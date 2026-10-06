"""`kaleidos voz`: locución de un proyecto de narración con la API de ElevenLabs.

Entrada: proyectos/<slug>/locucion.json
    { "voz": {"id"?: "<voice_id>", "modelo"?: "eleven_v4", "ajustes"?: {voice_settings},
              "semilla"?: 123, "idioma"?: "es"},
      "pausaEntreBloques": 0.35,
      "recortarSilencios"?: true,
      "bloques": [ {"id": "b01", "texto": "…", "pausaDespues"?: 0.6} ] }
- `voz.id` / `voz.modelo` a falta de ellos: ELEVENLABS_VOICE_ID / ELEVENLABS_MODEL_ID de .env (se cargan sin
  imprimirse nunca). URL base: ELEVENLABS_BASE_URL o, si está vacía, https://api.elevenlabs.io.
- Un POST por bloque a /v1/text-to-speech/{voz}?output_format=mp3_44100_192, 4 a la vez, con `previous_text` y
  `next_text` (texto de los bloques vecinos) para que la entonación sea continua.
- Caché por hash de (texto, voz, modelo, ajustes, semilla, idioma, formato) en work/voz/cache/<hash>.mp3: cambiar
  un bloque solo regenera ese bloque (el contexto de los vecinos no entra en el hash, a propósito).
- Si la API devuelve un error se para (sin reintentos) y se explica el motivo.
Salidas: work/voz/<id>.mp3 · work/narracion.m4a (bloques + pausas, −16 LUFS / −1,5 dBTP, AAC 48 kHz) enlazado en
media/narracion.m4a · work/voz/manifest.json (inicio y duración de cada bloque, caracteres consumidos).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import FIRST_EXCEPTION, ThreadPoolExecutor, wait
from pathlib import Path

import numpy as np

from .comun import (ErrorKaleidos, Proyecto, cargar_env, cronometro, enlazar_duro, escribir_json, ffmpeg_bin,
                    info, leer_json)

FORMATO = "mp3_44100_192"
SR = 44100
MODELO_DEFECTO = "eleven_v4"
BASE_DEFECTO = "https://api.elevenlabs.io"
LUFS, TP = -16.0, -1.5
UMBRAL_BORDE_DB = -55.0    # recorte de silencios en los bordes de cada bloque
MARGEN_BORDE_S = 0.06
_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")


class ErrorAPI(ErrorKaleidos):
    pass


def leer_locucion(proy: Proyecto) -> dict:
    ruta = proy.dir / "locucion.json"
    if not ruta.exists():
        raise ErrorKaleidos(f"falta {ruta.relative_to(proy.dir.parent.parent)}: escribe la locución con la forma "
                            '{"voz": {...}, "pausaEntreBloques": 0.35, "bloques": [{"id": "b01", "texto": "…"}]}')
    loc = leer_json(ruta)
    bloques = loc.get("bloques") or []
    if not bloques:
        raise ErrorKaleidos("locucion.json no tiene «bloques»")
    vistos = set()
    for k, b in enumerate(bloques):
        if not isinstance(b, dict) or not str(b.get("texto", "")).strip():
            raise ErrorKaleidos(f"locucion.json: el bloque {k + 1} no tiene «texto»")
        bid = str(b.get("id") or "")
        if not _ID.match(bid):
            raise ErrorKaleidos(f"locucion.json: el bloque {k + 1} necesita un «id» con letras, cifras, - o _ (p. ej. b01)")
        if bid in vistos:
            raise ErrorKaleidos(f"locucion.json: id repetido «{bid}»")
        vistos.add(bid)
    return loc


def _config_voz(loc: dict) -> dict:
    v = loc.get("voz") or {}
    cargar_env()
    voz_id = v.get("id") or os.environ.get("ELEVENLABS_VOICE_ID") or ""
    if not voz_id:
        raise ErrorKaleidos("falta la voz: pon «voz.id» en locucion.json o ELEVENLABS_VOICE_ID en .env")
    return {
        "id": voz_id, "id_origen": "locucion.json" if v.get("id") else "ELEVENLABS_VOICE_ID (.env)",
        "modelo": v.get("modelo") or os.environ.get("ELEVENLABS_MODEL_ID") or MODELO_DEFECTO,
        "ajustes": v.get("ajustes") or None, "semilla": v.get("semilla"), "idioma": v.get("idioma"),
        "base": (os.environ.get("ELEVENLABS_BASE_URL") or "").strip().rstrip("/") or BASE_DEFECTO,
    }


def _hash(texto: str, cv: dict) -> str:
    clave = json.dumps([texto, cv["id"], cv["modelo"], cv["ajustes"], cv["semilla"], cv["idioma"], FORMATO],
                       ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(clave.encode("utf-8")).hexdigest()[:16]


def _explicar(codigo: int, cuerpo: str) -> str:
    """Mensaje legible de un error de la API (sin credenciales: la API no las devuelve)."""
    detalle, estado = cuerpo.strip()[:400], ""
    try:
        d = json.loads(cuerpo).get("detail")
        if isinstance(d, dict):
            estado, detalle = str(d.get("status") or d.get("code") or ""), str(d.get("message") or detalle)
        elif isinstance(d, list) and d:
            detalle = "; ".join(str(x.get("msg", x)) for x in d[:3] if isinstance(x, dict)) or detalle
        elif isinstance(d, str):
            detalle = d
    except (ValueError, AttributeError):
        pass
    pista = {
        401: "la clave de API no es válida o no tiene permiso de text-to-speech",
        402: "la cuenta no tiene saldo o el plan no cubre la petición",
        403: "sin permiso para esa voz, ese modelo o ese formato (mp3_44100_192 exige plan Creator o superior)",
        404: "la voz o el modelo no existen para esta cuenta",
        422: "la petición no es válida (revisa ajustes, modelo o texto)",
        429: "límite de peticiones o de concurrencia superado (baja --concurrencia) o cuota agotada",
    }.get(codigo, "error del servicio")
    if estado == "quota_exceeded":
        pista = "cuota de caracteres agotada"
    return f"ElevenLabs respondió {codigo} ({pista}){' [' + estado + ']' if estado else ''}: {detalle}"


def _sintetizar(cv: dict, texto: str, anterior: str | None, siguiente: str | None, destino: Path) -> dict:
    url = f"{cv['base']}/v1/text-to-speech/{urllib.parse.quote(cv['id'], safe='')}?output_format={FORMATO}"
    cuerpo: dict = {"text": texto, "model_id": cv["modelo"]}
    if cv["ajustes"]:
        cuerpo["voice_settings"] = cv["ajustes"]
    if cv["semilla"] is not None:
        cuerpo["seed"] = int(cv["semilla"])
    if cv["idioma"]:
        cuerpo["language_code"] = cv["idioma"]
    if cv["contexto"]:
        if anterior:
            cuerpo["previous_text"] = anterior
        if siguiente:
            cuerpo["next_text"] = siguiente
    req = urllib.request.Request(url, data=json.dumps(cuerpo).encode("utf-8"), method="POST", headers={
        "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", ""), "Content-Type": "application/json",
        "Accept": "audio/mpeg"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            datos = r.read()
            cab = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        raise ErrorAPI(_explicar(e.code, e.read().decode("utf-8", "replace"))) from None
    except urllib.error.URLError as e:
        raise ErrorAPI(f"no se pudo conectar con ElevenLabs ({e.reason})") from None
    if len(datos) < 256:
        raise ErrorAPI(f"ElevenLabs devolvió un audio vacío o demasiado corto ({len(datos)} bytes)")
    destino.parent.mkdir(parents=True, exist_ok=True)
    tmp = destino.with_suffix(".part")
    tmp.write_bytes(datos)
    os.replace(tmp, destino)
    cc = cab.get("x-character-count") or cab.get("character-cost")
    meta = {"caracteres": int(cc) if cc and str(cc).isdigit() else len(texto),
            "caracteres_fuente": "cabecera" if cc and str(cc).isdigit() else "len(texto)",
            "request_id": cab.get("request-id"), "segundos": round(time.time() - t0, 2)}
    escribir_json(destino.with_suffix(".json"), meta)
    return meta


def _decodificar(mp3: Path) -> np.ndarray:
    p = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-v", "error", "-i", str(mp3), "-ac", "1",
                        "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    if p.returncode != 0:
        raise ErrorKaleidos(f"ffmpeg no pudo decodificar {mp3.name}: {p.stderr.decode()[-300:]}")
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def _bordes(x: np.ndarray) -> tuple[int, int]:
    """Primera y última muestra con voz (ventanas de 10 ms sobre UMBRAL_BORDE_DB), con MARGEN_BORDE_S."""
    v = int(SR * 0.01)
    n = len(x) // v
    if n == 0:
        return 0, len(x)
    rms = np.sqrt(np.mean(x[:n * v].reshape(n, v) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    idx = np.nonzero(db > UMBRAL_BORDE_DB)[0]
    if not len(idx):
        return 0, len(x)
    m = int(MARGEN_BORDE_S * SR)
    return max(0, idx[0] * v - m), min(len(x), (idx[-1] + 1) * v + m)


def _normalizar(wav: Path, destino: Path, log: Path) -> dict:
    """loudnorm en dos pasadas (lineal) a −16 LUFS / −1,5 dBTP → AAC 48 kHz; devuelve la medida final."""
    af1 = f"loudnorm=I={LUFS}:TP={TP}:LRA=11:print_format=json"
    p = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", str(wav), "-af", af1, "-f", "null", "-"],
                       capture_output=True, text=True)
    with open(log, "a", encoding="utf-8") as f:
        f.write(f"\n$ ffmpeg loudnorm (medida)\n{p.stderr}")
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr, re.S)
    if p.returncode != 0 or not m:
        raise ErrorKaleidos(f"loudnorm no pudo medir la locución (registro: {log})")
    d = json.loads(m.group(0))
    af2 = (f"loudnorm=I={LUFS}:TP={TP}:LRA=11:linear=true:measured_I={d['input_i']}:measured_TP={d['input_tp']}:"
           f"measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}")
    tmp = destino.with_name(destino.stem + ".tmp.m4a")
    with open(log, "a", encoding="utf-8") as f:
        f.write(f"\n$ ffmpeg loudnorm (aplicar) → {destino.name}\n")
        f.flush()
        r = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", str(wav), "-af", af2,
                            "-ar", "48000", "-ac", "1", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                            str(tmp)], stdout=f, stderr=subprocess.STDOUT)
    if r.returncode != 0:
        raise ErrorKaleidos(f"ffmpeg falló al codificar la locución (registro: {log})")
    os.replace(tmp, destino)
    q = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", str(destino), "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?\d+(?:\.\d+)?) LUFS", q)
    tp = re.findall(r"Peak:\s+(-?\d+(?:\.\d+)?) dBFS", q)
    return {"objetivo_lufs": LUFS, "objetivo_dbtp": TP, "entrada_lufs": float(d["input_i"]),
            "lufs": float(i[-1]) if i else None, "true_peak_dbtp": float(tp[-1]) if tp else None,
            "modo": d.get("normalization_type")}


def generar(proy: Proyecto, concurrencia: int = 4, forzar: bool = False, max_caracteres: int | None = None,
            simular: bool = False) -> dict:
    loc = leer_locucion(proy)
    cv = _config_voz(loc)
    # eleven_v3 no admite previous_text/next_text (request stitching)
    cv["contexto"] = loc.get("contexto", True) and not str(cv["modelo"]).startswith("eleven_v3")
    if not cv["contexto"] and str(cv["modelo"]).startswith("eleven_v3"):
        info("aviso: el modelo eleven_v3 no admite previous_text/next_text; se genera sin contexto")
    bloques = loc["bloques"]
    textos = [str(b["texto"]).strip() for b in bloques]
    dir_v = proy.work / "voz"
    cache = dir_v / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    plan = []
    for k, b in enumerate(bloques):
        h = _hash(textos[k], cv)
        mp3 = cache / f"{h}.mp3"
        plan.append({"k": k, "id": b["id"], "hash": h, "mp3": mp3, "cache": mp3.exists() and not forzar})
    pendientes = [p for p in plan if not p["cache"]]
    a_gastar = sum(len(textos[p["k"]]) for p in pendientes)
    info(f"{len(plan)} bloques ({sum(len(t) for t in textos)} caracteres de texto); en caché {len(plan) - len(pendientes)}; "
         f"a generar {len(pendientes)} ({a_gastar} caracteres) · modelo {cv['modelo']} · voz de {cv['id_origen']} · "
         f"{'con' if cv['contexto'] else 'sin'} contexto entre bloques")
    if simular:
        for p in pendientes:
            info(f"  generaría {p['id']}: {len(textos[p['k']])} caracteres")
        return {"simulado": True, "a_generar": len(pendientes), "caracteres_estimados": a_gastar}
    if max_caracteres is not None and a_gastar > max_caracteres:
        raise ErrorKaleidos(f"se gastarían {a_gastar} caracteres de TTS y el máximo es {max_caracteres} (--max-caracteres)")
    if pendientes and not os.environ.get("ELEVENLABS_API_KEY"):
        raise ErrorKaleidos("falta ELEVENLABS_API_KEY en .env")

    gastado: dict[str, dict] = {}
    cerrojo = threading.Lock()

    def tarea(p: dict) -> None:
        k = p["k"]
        meta = _sintetizar(cv, textos[k], textos[k - 1] if k > 0 else None,
                           textos[k + 1] if k + 1 < len(textos) else None, p["mp3"])
        with cerrojo:
            gastado[p["id"]] = meta
        info(f"✓ {p['id']}: {meta['caracteres']} caracteres, {meta['segundos']} s")

    if pendientes:
        with ThreadPoolExecutor(max_workers=max(1, concurrencia)) as ex:
            futs = [ex.submit(tarea, p) for p in pendientes]
            hechos, _ = wait(futs, return_when=FIRST_EXCEPTION)
            err = next((f.exception() for f in hechos if f.exception()), None)
            if err:
                for f in futs:
                    f.cancel()                     # los que no han empezado no se envían; los que están en vuelo acaban
        if err:
            n = sum(m["caracteres"] for m in gastado.values())
            raise ErrorKaleidos(f"{err}. Parado sin reintentar: {len(gastado)} bloques generados antes del error "
                                f"({n} caracteres, quedan en caché).")

    # audio: bloques recortados en los bordes + pausas → WAV → loudnorm → m4a
    recortar = bool(loc.get("recortarSilencios", True))
    pausa_def = float(loc.get("pausaEntreBloques", 0.35))
    trozos, filas, t = [], [], 0.0
    for p in plan:
        b = bloques[p["k"]]
        enlazar_duro(p["mp3"], dir_v / f"{p['id']}.mp3")
        x = _decodificar(p["mp3"])
        a, z = _bordes(x) if recortar else (0, len(x))
        x = x[a:z]
        ultimo = p["k"] == len(plan) - 1
        pausa = float(b.get("pausaDespues", 0.0 if ultimo else pausa_def))
        dur = len(x) / SR
        side = p["mp3"].with_suffix(".json")
        meta = gastado.get(p["id"]) or (leer_json(side) if side.exists() else {"caracteres": len(textos[p["k"]])})
        filas.append({"id": p["id"], "texto": textos[p["k"]], "inicio": round(t, 3), "fin": round(t + dur, 3),
                      "duracion": round(dur, 3), "pausaDespues": round(pausa, 3), "archivo": f"work/voz/{p['id']}.mp3",
                      "hash": p["hash"], "caracteres": int(meta.get("caracteres", len(textos[p["k"]]))),
                      "cache": p["id"] not in gastado,
                      **({"recorte_s": [round(a / SR, 3), round(z / SR, 3)]} if recortar else {})})
        trozos += [x, np.zeros(int(round(pausa * SR)), np.float32)]
        t += dur + pausa
    wav = dir_v / "narracion_bruta.wav"
    import wave
    todo = np.clip(np.concatenate(trozos), -1, 1)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((todo * 32767).astype("<i2").tobytes())
    son = _normalizar(wav, proy.audio_narracion, proy.logs / "voz.log")
    wav.unlink(missing_ok=True)
    enlazar_duro(proy.audio_narracion, proy.media / "narracion.m4a")

    man_p = dir_v / "manifest.json"
    previo = leer_json(man_p) if man_p.exists() else {}
    esta = sum(m["caracteres"] for m in gastado.values())
    acumulado = int((previo.get("caracteres") or {}).get("acumulado", 0)) + esta
    man = {
        "slug": proy.slug, "generado": time.strftime("%Y-%m-%d %H:%M:%S"),
        "voz": {"origen_id": cv["id_origen"], **({"id": cv["id"]} if cv["id_origen"] == "locucion.json" else {}),
                "modelo": cv["modelo"], "ajustes": cv["ajustes"], "semilla": cv["semilla"], "formato": FORMATO,
                "contexto": cv["contexto"]},
        "pausaEntreBloques": pausa_def, "recortarSilencios": recortar,
        "duracion": round(len(todo) / SR, 3), "salida": str(proy.audio_narracion.relative_to(proy.dir)),
        "sonoridad": son,
        "caracteres": {"esta_ejecucion": esta, "bloques_generados": len(gastado),
                       "bloques_cache": len(plan) - len(gastado), "texto_total": sum(len(x) for x in textos),
                       "acumulado": acumulado},
        "bloques": filas,
    }
    escribir_json(man_p, man)
    info(f"narracion.m4a: {man['duracion']:.2f} s, {son['lufs']} LUFS, {son['true_peak_dbtp']} dBTP · "
         f"caracteres gastados ahora {esta} (acumulado {acumulado})")
    return {"duracion_s": man["duracion"], "caracteres": esta, "bloques": len(plan), "generados": len(gastado),
            "lufs": son["lufs"], "tp": son["true_peak_dbtp"]}


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    if not proy.narracion:
        raise ErrorKaleidos(f"«{args.slug}» no es un proyecto de narración (proyecto.json › narracion: true)")
    with cronometro(proy, "voz") as extra:
        extra.update(generar(proy, concurrencia=args.concurrencia, forzar=args.forzar,
                             max_caracteres=args.max_caracteres, simular=args.simular))
    return 0
