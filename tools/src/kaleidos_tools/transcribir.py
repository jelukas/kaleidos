"""`kaleidos transcribir`: whisper.cpp (Metal) + ggml-large-v3-turbo, marcas de tiempo por palabra.

- Voz del canal que indique el análisis (el bruto puede traerla en un solo canal), a 16 kHz, con ganancia a
  ~-20 LUFS y limitador (una grabación floja empeora el reconocimiento).
- Troceo por silencios a partir de la RMS de 100 ms (VAD propio): los silencios largos no pasan a Whisper,
  que es donde entraba en bucle de alucinación con el modelo medium. Trozos independientes de ≤ 120 s con
  `--max-context 0` y el prompt de `proyecto.json › whisper.prompt`.
- Un único proceso de whisper-cli para todos los trozos (el modelo se carga una vez).
- Marcas por token con DTW (`-dtw large.v3.turbo`, que exige desactivar flash attention) → palabras
  (un token con espacio inicial abre palabra), fusión de tokens partidos («CT» + «-09», «19» + «.20»),
  realineado contra la energía real de la voz y filtro de repeticiones.
Salidas: work/transcripcion.json (segundos de la fuente) y work/transcripcion.txt (legible, por párrafos).
"""

from __future__ import annotations

import re
import time
import wave
from pathlib import Path

import numpy as np

from . import instalar
from .comun import Proyecto, correr, cronometro, escribir_json, ffmpeg_bin, hms, info, leer_json

SR = 16000


def _regiones_voz(rms: np.ndarray, umbral: float, paso: float = 0.1) -> list[dict]:
    habla, cur = [], None
    for i, v in enumerate(rms):
        t = i * paso
        if v > umbral:
            if cur and t - cur["fin"] <= 1.5:
                cur["fin"] = t + paso
            else:
                if cur:
                    habla.append(cur)
                cur = {"ini": t, "fin": t + paso}
    if cur:
        habla.append(cur)
    return [{"ini": max(0.0, r["ini"] - 0.3), "fin": r["fin"] + 0.4} for r in habla if r["fin"] - r["ini"] >= 0.3]


def _trozos(regiones: list[dict], maximo: float) -> list[dict]:
    trozos: list[dict] = []
    for r in regiones:
        u = trozos[-1] if trozos else None
        if u and r["fin"] - u["ini"] <= maximo and r["ini"] - u["fin"] < 4:
            u["fin"] = r["fin"]
        else:
            trozos.append(dict(r))
    # un trozo más largo que el máximo (habla sin pausas ≥ 1,5 s) se parte en su RMS mínima
    return trozos


def _extraer_voz(proy: Proyecto, destino: Path) -> None:
    audio = proy.analisis_json("audio.json")
    ganancia = max(0.0, min(30.0, -20.0 - (audio.get("voz", {}).get("I_lufs") or -20.0)))
    af = f"{proy.canal_voz()},highpass=f=60,volume={ganancia:.1f}dB,alimiter=limit=0.9:level=0"
    destino.parent.mkdir(parents=True, exist_ok=True)
    correr([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", proy.bruto, "-vn", "-af", af,
            "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", destino], log=proy.logs / "transcribir.log")


def _escribir_trozos(wav: Path, trozos: list[dict], dir_: Path) -> list[Path]:
    dir_.mkdir(parents=True, exist_ok=True)
    for viejo in dir_.glob("t_*"):
        viejo.unlink()
    with wave.open(str(wav), "rb") as w:
        n = w.getnframes()
        datos = w.readframes(n)
    muestras = np.frombuffer(datos, dtype=np.int16)
    rutas = []
    for i, c in enumerate(trozos):
        a, b = int(c["ini"] * SR), min(len(muestras), int(c["fin"] * SR))
        ruta = dir_ / f"t_{i:03d}.wav"
        with wave.open(str(ruta), "wb") as o:
            o.setnchannels(1)
            o.setsampwidth(2)
            o.setframerate(SR)
            o.writeframes(muestras[a:b].tobytes())
        rutas.append(ruta)
    return rutas


_ESPECIAL = re.compile(r"^\s*(\[_[A-Z]+_?\d*\]|<\|.*\|>)\s*$")


def _palabras_de(json_trozo: dict, desfase: float) -> tuple[list[dict], list[dict]]:
    palabras: list[dict] = []
    segmentos: list[dict] = []
    for seg in json_trozo.get("transcription", []):
        texto = seg.get("text", "").strip()
        if texto:
            segmentos.append({"ini": round(seg["offsets"]["from"] / 1000 + desfase, 3),
                              "fin": round(seg["offsets"]["to"] / 1000 + desfase, 3), "texto": texto})
        for tok in seg.get("tokens", []):
            txt = tok.get("text", "")
            if not txt or _ESPECIAL.match(txt) or tok.get("id", 0) >= 50257 and txt.startswith("[_"):
                continue
            ini = tok["t_dtw"] / 100 if tok.get("t_dtw", -1) >= 0 else tok["offsets"]["from"] / 1000
            fin = tok["offsets"]["to"] / 1000
            p = float(tok.get("p", 1.0))
            if txt.startswith(" ") or not palabras or palabras[-1].get("_cerrada"):
                palabras.append({"t": txt.strip(), "ini": ini + desfase, "fin": fin + desfase, "ps": [p]})
            else:
                w = palabras[-1]
                w["t"] += txt
                w["fin"] = max(w["fin"], fin + desfase)
                w["ps"].append(p)
        if palabras:
            palabras[-1]["_cerrada"] = True   # un segmento nuevo siempre abre palabra
    for w in palabras:
        w.pop("_cerrada", None)
    return [w for w in palabras if w["t"]], segmentos


_PUNT_SOLA = re.compile(r"^[,.;:!?…%)»\]]+$")
_CONT_NUM = re.compile(r"^[-./:,][\dA-Za-z]")


def _fusionar(palabras: list[dict]) -> tuple[list[dict], int]:
    """Une tokens partidos: puntuación suelta, «CT» + «-09», «19» + «.20», «27» + «001»."""
    out: list[dict] = []
    n = 0
    for w in palabras:
        if out:
            prev = out[-1]
            pegado = w["ini"] - prev["fin"] < 0.35
            if _PUNT_SOLA.match(w["t"]) or (pegado and _CONT_NUM.match(w["t"]) and re.search(r"[\dA-Za-z]$", prev["t"])) \
                    or (pegado and re.fullmatch(r"\d{3}[.,;:]?", w["t"]) and re.fullmatch(r"\d{1,3}", prev["t"])):
                prev["t"] += w["t"]
                prev["fin"] = max(prev["fin"], w["fin"])
                prev["ps"] += w["ps"]
                n += 1
                continue
        out.append(w)
    return out, n


def _realinear(palabras: list[dict], rms: np.ndarray, umbral: float) -> int:
    """Si una palabra empieza en silencio, se engancha al comienzo de voz más cercano (+1 s / −0,5 s)."""
    voz = rms > umbral
    hay = lambda i: 0 <= i < len(voz) and bool(voz[i])  # noqa: E731
    movidas = 0
    for w in palabras:
        i = round(w["ini"] * 10)
        if hay(i) or hay(i - 1) or hay(i + 1):
            continue
        nuevo = None
        for d in range(1, 11):
            if hay(i + d):
                nuevo = (i + d) / 10
                break
            if d <= 5 and hay(i - d):
                nuevo = (i - d) / 10
                break
        if nuevo is not None:
            w["ini"] = nuevo
            movidas += 1
    palabras.sort(key=lambda w: w["ini"])
    for k in range(1, len(palabras)):
        if palabras[k]["ini"] < palabras[k - 1]["ini"] + 0.04:
            palabras[k]["ini"] = palabras[k - 1]["ini"] + 0.04
    for k, w in enumerate(palabras):
        sig = palabras[k + 1]["ini"] if k + 1 < len(palabras) else w["ini"] + 1
        largo = max(0.22, len(w["t"]) * 0.075)
        fin = min(sig, max(w["fin"], w["ini"] + 0.12), w["ini"] + largo + 0.35)
        j = round(w["ini"] * 10)
        while j < len(voz) and voz[j] and j / 10 < fin:
            j += 1
        w["fin"] = max(w["ini"] + 0.12, min(fin, j / 10 + 0.1))
        if k + 1 < len(palabras):
            w["fin"] = min(w["fin"], palabras[k + 1]["ini"])
    return movidas


def _quitar_repeticiones(palabras: list[dict], rms: np.ndarray, umbral: float) -> tuple[list[dict], list[str]]:
    """Quita bucles (mismo n-grama ≥ 3 veces seguidas) y palabras dudosas en silencio total."""
    avisos = []
    norm = [re.sub(r"\W", "", w["t"].lower()) for w in palabras]
    borrar = set()
    for n in range(3, 9):
        i = 0
        while i + 3 * n <= len(norm):
            a = norm[i:i + n]
            k = 1
            while norm[i + k * n:i + (k + 1) * n] == a:
                k += 1
            if k >= 3 and any(a):
                borrar.update(range(i + n, i + k * n))
                avisos.append(f"bucle de repetición quitado en {palabras[i]['ini']:.1f} s ({k}× «{' '.join(w['t'] for w in palabras[i:i + n])[:40]}»)")
                i += k * n
            else:
                i += 1
    for k, w in enumerate(palabras):
        a, b = int(w["ini"] * 10), int(w["fin"] * 10) + 1
        if min(w["ps"]) < 0.25 and b > a and (rms[a:b] <= umbral - 6).all():
            borrar.add(k)
    return [w for k, w in enumerate(palabras) if k not in borrar], avisos


def huecos_con_voz(palabras: list[dict], rms: np.ndarray, umbral: float, minimo: float = 0.5) -> list[tuple[float, float]]:
    """Tramos con voz (RMS > umbral) de al menos `minimo` s en los que no hay ninguna palabra.
    Whisper suele saltarse la repetición de una frase (la segunda toma) y pega el texto a la primera."""
    voz = rms > umbral
    ocupado = np.zeros(len(voz), bool)
    for w in palabras:
        # DTW a veces deja palabras largas con 0,1 s: se estima también su duración por el número de letras
        fin = max(w["fin"], w["ini"] + 0.07 * len(w["t"]))
        ocupado[max(0, int(w["ini"] * 10) - 1):int(fin * 10) + 2] = True
    libre = voz & ~ocupado
    res, i = [], 0
    while i < len(libre):
        if not libre[i]:
            i += 1
            continue
        j = i
        while j < len(libre) and (libre[j] or (j + 3 < len(libre) and libre[j + 1:j + 4].any() and not ocupado[j])):
            j += 1
        if (j - i) / 10 >= minimo:
            res.append((i / 10, j / 10))
        i = j
    return res


def _rellenar(proy: Proyecto, cli, modelo, idioma: str, prompt: str, hilos: int, wav: Path,
              palabras: list[dict], rms: np.ndarray, umbral: float, nombre_modelo: str) -> tuple[list[dict], int, float]:
    huecos = huecos_con_voz(palabras, rms, umbral)
    if not huecos:
        return palabras, 0, 0.0
    trozos = [{"ini": max(0.0, a - 0.25), "fin": b + 0.25} for a, b in huecos]
    rutas = _escribir_trozos(wav, trozos, proy.work / "transcripcion" / "huecos")
    # Sin DTW: con tan pocos tokens su filtro de mediana no cabe (WHISPER_ASSERT filter_width < ne[2]); las
    # marcas por token bastan en tramos de 1–3 s y después se realinean con la energía.
    cmd = [cli, "-m", modelo, "-l", idioma, "-t", str(hilos), "-bs", "5", "-bo", "5", "-mc", "0", "-ojf", "-sns"]
    if prompt:
        cmd += ["--prompt", prompt]
    for r in rutas:
        cmd += ["-f", r]
    t0 = time.time()
    correr(cmd, log=proy.logs / "transcribir.log")
    nuevas = []
    for (a, b), c, r in zip(huecos, trozos, rutas):
        ws, _ = _palabras_de(leer_json(Path(str(r) + ".json")), c["ini"])
        ws, _ = _fusionar(ws)
        for w in ws:
            m = (w["ini"] + w["fin"]) / 2
            if a - 0.15 <= m <= b + 0.15 and min(w["ps"]) > 0.05:
                w["relleno"] = True
                nuevas.append(w)
    todas = deduplicar(sorted(palabras + nuevas, key=lambda w: w["ini"]))
    return todas, sum(1 for w in todas if w.get("relleno")), time.time() - t0


def deduplicar(ws: list[dict]) -> list[dict]:
    """Quita palabras de relleno que repiten a las vecinas originales (mismo texto seguido, a menos de 1,5 s):
    son restos de palabras cuya marca de DTW quedó corta («interna. interna.», «es que es que»)."""
    import re as _re
    norm = lambda t: _re.sub(r"\W", "", t.lower())  # noqa: E731
    out = list(ws)
    cambiado = True
    while cambiado:
        cambiado = False
        for n in (3, 2, 1):
            i = 0
            while i + 2 * n <= len(out):
                a, b = out[i:i + n], out[i + n:i + 2 * n]
                if [norm(w["t"]) for w in a] == [norm(w["t"]) for w in b] and all(norm(w["t"]) for w in a) \
                        and b[0]["ini"] - a[-1]["fin"] < 1.5:
                    ra, rb = all(w.get("relleno") for w in a), all(w.get("relleno") for w in b)
                    if ra != rb:
                        k0 = i if ra else i + n
                        del out[k0:k0 + n]
                        cambiado = True
                        continue
                i += 1
    return out


def _texto_legible(proy: Proyecto, palabras: list[dict], meta: dict) -> str:
    L = [f"# Transcripción · {proy.slug} · whisper.cpp {meta['modelo']} ({meta['motor']})",
         "# Tiempos en SEGUNDOS DE LA FUENTE. Una frase por línea (inicio de su primera palabra);",
         "# párrafo nuevo tras una pausa > 1,5 s. Úsalo para escribir los cues de guion.json.", ""]
    frase: list[dict] = []
    prev_fin = None

    def volcar():
        if frase:
            L.append(f"{frase[0]['ini']:8.2f}  {' '.join(w['t'] for w in frase)}")

    for w in palabras:
        if prev_fin is not None and w["ini"] - prev_fin > 1.5:
            volcar()
            frase = []
            L.append("")
            L.append(f"[{hms(w['ini'])} · {w['ini']:.2f} s · pausa de {w['ini'] - prev_fin:.1f} s]")
        elif prev_fin is None:
            L.append(f"[{hms(w['ini'])} · {w['ini']:.2f} s]")
        frase.append(w)
        prev_fin = w["fin"]
        if re.search(r"[.?!…]$", w["t"]) and len(frase) >= 3:
            volcar()
            frase = []
    volcar()
    L.append("")
    return "\n".join(L)


def transcribir(proy: Proyecto, hilos: int = 6, trozo_max: float = 120.0, desde: float | None = None,
                duracion: float | None = None, salida: str | None = None) -> dict:
    t0 = time.time()
    cli = instalar.whisper_cli()
    nombre_modelo = proy.cfg.get("whisper", {}).get("modelo", "large-v3-turbo")
    modelo = instalar.modelo_whisper(nombre_modelo)
    prompt = proy.cfg.get("whisper", {}).get("prompt", "")
    idioma = proy.cfg.get("idioma", "es")
    audio = proy.analisis_json("audio.json")
    rms = np.array(proy.analisis_json("rms100ms.json")["rms_db"], dtype=np.float32)
    umbral = float(audio["umbral_voz_db"])

    wav = proy.work / "audio" / "voz_16k.wav"
    if not wav.exists():
        _extraer_voz(proy, wav)
    regiones = _regiones_voz(rms, umbral)
    if desde is not None:
        fin = desde + (duracion or 60.0)
        regiones = [{"ini": max(r["ini"], desde), "fin": min(r["fin"], fin)} for r in regiones
                    if r["fin"] > desde and r["ini"] < fin]
    trozos = _trozos(regiones, trozo_max)
    dir_trozos = proy.work / "transcripcion" / "trozos"
    rutas = _escribir_trozos(wav, trozos, dir_trozos)
    seg_audio = sum(c["fin"] - c["ini"] for c in trozos)
    info(f"{len(regiones)} regiones de voz → {len(trozos)} trozos ({seg_audio:.0f} s de audio a Whisper)")

    cmd = [cli, "-m", modelo, "-l", idioma, "-t", str(hilos), "-bs", "5", "-bo", "5", "-mc", "0",
           "-ojf", "-dtw", "large.v3.turbo" if "turbo" in nombre_modelo else nombre_modelo.replace("-", "."),
           "-nfa", "-sns", "-pp"]
    if prompt:
        cmd += ["--prompt", prompt]
    for r in rutas:
        cmd += ["-f", r]
    t1 = time.time()
    correr(cmd, log=proy.logs / "transcribir.log")
    t_whisper = time.time() - t1

    palabras: list[dict] = []
    segmentos: list[dict] = []
    for c, r in zip(trozos, rutas):
        js = Path(str(r) + ".json")
        if not js.exists():
            raise RuntimeError(f"whisper no generó {js}")
        ws, ss = _palabras_de(leer_json(js), c["ini"])
        palabras += ws
        segmentos += ss
    palabras.sort(key=lambda w: w["ini"])
    palabras, fusionadas = _fusionar(palabras)
    palabras, avisos = _quitar_repeticiones(palabras, rms, umbral)
    palabras, rellenas, t_rell = _rellenar(proy, cli, modelo, idioma, prompt, hilos, wav, palabras, rms, umbral,
                                           nombre_modelo)
    if rellenas:
        info(f"huecos con voz sin palabras retranscritos: +{rellenas} palabras en {t_rell:.0f} s")
    movidas = _realinear(palabras, rms, umbral)
    salida_p = [{"t": w["t"], "ini": round(w["ini"], 3), "fin": round(w["fin"], 3),
                 "p": round(float(np.mean(w["ps"])), 3), **({"relleno": True} if w.get("relleno") else {})}
                for w in palabras]
    meta = {
        "modelo": Path(modelo).stem.replace("ggml-", ""), "motor": f"whisper.cpp {instalar.whisper_version()}, Metal, DTW",
        "idioma": idioma, "prompt": prompt, "fuente": proy.cfg["bruto"],
        "duracion_fuente": proy.fuente_info()["duracion"], "audio_a_whisper_s": round(seg_audio, 1),
        "segundos_whisper": round(t_whisper, 1), "segundos_total": round(time.time() - t0, 1),
        "trozos": [{"ini": round(c["ini"], 2), "fin": round(c["fin"], 2)} for c in trozos],
        "fusionadas": fusionadas, "realineadas": movidas, "rellenadas": rellenas, "avisos": avisos,
    }
    base = salida or ("transcripcion" if desde is None else "transcripcion_prueba")
    escribir_json(proy.work / f"{base}.json", {**meta, "palabras": salida_p, "segmentos": segmentos})
    (proy.work / f"{base}.txt").write_text(_texto_legible(proy, salida_p, meta), encoding="utf-8")
    info(f"{len(salida_p)} palabras; whisper {t_whisper:.0f} s para {seg_audio:.0f} s de audio "
         f"({seg_audio / max(t_whisper, 1e-6):.1f}× tiempo real); {fusionadas} fusiones, {movidas} realineadas")
    for a in avisos:
        info(f"aviso: {a}")
    return {"palabras": len(salida_p), "segundos_whisper": meta["segundos_whisper"],
            "audio_s": meta["audio_a_whisper_s"], "trozos": len(trozos)}


def rellenar_existente(proy: Proyecto, hilos: int = 6) -> dict:
    """Aplica solo el relleno de huecos con voz a work/transcripcion.json (sin repetir la pasada completa)."""
    ruta = proy.work / "transcripcion.json"
    d = leer_json(ruta)
    cli = instalar.whisper_cli()
    nombre_modelo = proy.cfg.get("whisper", {}).get("modelo", "large-v3-turbo")
    modelo = instalar.modelo_whisper(nombre_modelo)
    rms = np.array(proy.analisis_json("rms100ms.json")["rms_db"], dtype=np.float32)
    umbral = float(proy.analisis_json("audio.json")["umbral_voz_db"])
    ws = [{**w, "ps": [w.get("p", 1.0)]} for w in d["palabras"] if not w.get("relleno")]
    ws, n, seg = _rellenar(proy, cli, modelo, proy.cfg.get("idioma", "es"), proy.cfg.get("whisper", {}).get("prompt", ""),
                           hilos, proy.work / "audio" / "voz_16k.wav", ws, rms, umbral, nombre_modelo)
    nuevas = [w for w in ws if w.get("relleno")]
    _realinear(ws, rms, umbral)
    d["palabras"] = [{"t": w["t"], "ini": round(w["ini"], 3), "fin": round(w["fin"], 3),
                      "p": round(float(np.mean(w["ps"])), 3), **({"relleno": True} if w.get("relleno") else {})}
                     for w in ws]
    d["rellenadas"] = n
    escribir_json(ruta, d)
    (proy.work / "transcripcion.txt").write_text(_texto_legible(proy, d["palabras"], d), encoding="utf-8")
    info(f"relleno: +{n} palabras en {len(huecos_con_voz([w for w in ws if not w.get('relleno')], rms, umbral))} huecos ({seg:.0f} s)")
    return {"rellenadas": n, "segundos": round(seg, 1), "ejemplos": len(nuevas)}


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    if proy.narracion:
        if args.rellenar or args.desde is not None:
            from .comun import ErrorKaleidos
            raise ErrorKaleidos("en un proyecto de narración no hay --rellenar ni --desde (se transcribe la locución entera)")
        with cronometro(proy, "transcribir (narración)") as extra:
            extra.update(transcribir_narracion(proy, hilos=args.hilos, corregir=not args.sin_corregir))
        return 0
    if getattr(args, "rellenar", False):
        with cronometro(proy, "transcribir (relleno de huecos)") as extra:
            extra.update(rellenar_existente(proy, args.hilos))
        return 0
    with cronometro(proy, "transcribir" if args.desde is None else "transcribir (tramo)") as extra:
        extra.update(transcribir(proy, hilos=args.hilos, trozo_max=args.trozo_max, desde=args.desde,
                                 duracion=args.duracion, salida=args.salida))
    return 0


# ——— modo narración: la fuente es work/narracion.m4a y el texto se conoce (locucion.json) ———

_ETIQUETA = re.compile(r"<[^>]*>|\[[^\]]*\]")          # SSML (<break …/>) y etiquetas de audio de v3 ([excited])


def _clave(t: str) -> str:
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w]", "", t)


def terminos_prompt(textos: list[str], maximo: int = 600) -> str:
    """Siglas, productos y cifras del texto (palabras con mayúsculas internas, siglas, cifras, nombres propios que
    no abren frase) para el prompt de Whisper."""
    vistos: dict[str, None] = {}
    for texto in textos:
        limpio = _ETIQUETA.sub(" ", texto)
        palabras = limpio.split()
        for k, w in enumerate(palabras):
            n = w.strip("¿¡\"'«»()[]{},;:.!?…")
            if not n:
                continue
            inicio_frase = k == 0 or re.search(r"[.!?…:]$", palabras[k - 1])
            if (re.search(r"\d", n) or re.search(r"[A-Z].*[A-Z]", n) or re.search(r"[a-z][A-Z]", n)
                    or (n[:1].isupper() and not inicio_frase) or "-" in n.strip("-")):
                vistos.setdefault(n, None)
    out = ""
    for t in vistos:
        if len(out) + len(t) + 2 > maximo:
            break
        out = f"{out}, {t}" if out else t
    return out


def _alinear_bloque(ws: list[dict], script: list[str], ini: float, fin: float) -> tuple[list[dict], dict]:
    """Palabras de Whisper de un bloque → palabras del guion con su grafía exacta, alineando por secuencia.
    Iguales: se copia la grafía; sustituciones: se reparten los tiempos por letras; palabras del guion que Whisper
    no oyó: se interpolan entre las vecinas; palabras de Whisper que no están en el guion: se quitan."""
    from difflib import SequenceMatcher
    a = [_clave(w["t"]) for w in ws]
    b = [_clave(t) for t in script]
    sm = SequenceMatcher(None, a, b, autojunk=False)
    out: list[dict] = []
    est = {"iguales": 0, "corregidas": 0, "interpoladas": 0, "quitadas": 0}

    def repartir(t0: float, t1: float, trozo: list[str], marca: str, p: float) -> None:
        t1 = max(t1, t0 + 0.08 * len(trozo))
        pesos = [max(1, len(_clave(x))) for x in trozo]
        tot, acc = sum(pesos), t0
        for x, pw in zip(trozo, pesos):
            d = (t1 - t0) * pw / tot
            out.append({"t": x, "ini": acc, "fin": acc + d, "ps": [p], marca: True})
            acc += d

    ops = sm.get_opcodes()
    for k, (op, i1, i2, j1, j2) in enumerate(ops):
        if op == "equal":
            for i, j in zip(range(i1, i2), range(j1, j2)):
                out.append({**ws[i], "t": script[j]})
                est["iguales"] += 1
        elif op == "replace":
            grupo = ws[i1:i2]
            if i2 - i1 == j2 - j1:
                for w, j in zip(grupo, range(j1, j2)):
                    out.append({**w, "t": script[j], "corregida": True})
            else:
                repartir(grupo[0]["ini"], grupo[-1]["fin"], script[j1:j2], "corregida",
                         float(np.mean([p for w in grupo for p in w["ps"]])))
            est["corregidas"] += j2 - j1
        elif op == "insert":
            t0 = out[-1]["fin"] if out else ini
            t1 = ws[i1]["ini"] if i1 < len(ws) else fin
            if t1 - t0 < 0.1 * (j2 - j1):                 # sin hueco: se comparte el tiempo con la anterior
                t0 = max(ini, t1 - 0.12 * (j2 - j1))
            repartir(t0, t1, script[j1:j2], "interpolada", 0.0)
            est["interpoladas"] += j2 - j1
        elif op == "delete":
            est["quitadas"] += i2 - i1
    out.sort(key=lambda w: w["ini"])
    for x, y in zip(out, out[1:]):                          # monótono y sin solapes
        if y["ini"] < x["ini"] + 0.04:
            y["ini"] = x["ini"] + 0.04
        x["fin"] = min(x["fin"], y["ini"]) if x["fin"] > y["ini"] else x["fin"]
        x["fin"] = max(x["fin"], x["ini"] + 0.04)
    return out, est


def _rms_100ms(wav: Path) -> np.ndarray:
    with wave.open(str(wav), "rb") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    v = SR // 10
    n = int(np.ceil(len(x) / v))
    x = np.pad(x, (0, n * v - len(x)))
    return (20 * np.log10(np.sqrt(np.mean(x.reshape(n, v) ** 2, axis=1)) + 1e-6)).astype(np.float32)


def _whisper_por_trozos(cmd: list, rutas: list, log: Path) -> list:
    """Pasa todos los trozos a whisper-cli en una llamada. Si falla (el DTW de whisper.cpp revienta con
    `WHISPER_ASSERT filter_width < ne[2]` cuando un segmento sale con muy pocos tokens), repite trozo a trozo y,
    en el que vuelva a fallar, sin DTW ni `-nfa` (sus marcas por token se realinean después con la energía).
    Devuelve las rutas transcritas sin DTW."""
    from .comun import ErrorKaleidos
    try:
        correr(cmd + [x for r in rutas for x in ("-f", r)], log=log)
        return []
    except ErrorKaleidos:
        info("whisper-cli falló con todos los trozos a la vez: se repite trozo a trozo")
    base_sin = []
    k = 0
    while k < len(cmd):  # quita «-dtw <modelo>» y «-nfa»
        if cmd[k] == "-dtw":
            k += 2
            continue
        if cmd[k] != "-nfa":
            base_sin.append(cmd[k])
        k += 1
    sin_dtw = []
    for r in rutas:
        try:
            correr(cmd + ["-f", r], log=log)
        except ErrorKaleidos:
            info(f"  {Path(r).name}: falla con DTW → sin DTW")
            correr(base_sin + ["-f", r], log=log)
            sin_dtw.append(r)
    return sin_dtw


def transcribir_narracion(proy: Proyecto, hilos: int = 6, corregir: bool = True) -> dict:
    from .comun import ErrorKaleidos
    t0 = time.time()
    fuente = proy.audio_narracion
    man_p = proy.work / "voz" / "manifest.json"
    if not fuente.exists() or not man_p.exists():
        raise ErrorKaleidos(f"faltan work/narracion.m4a o work/voz/manifest.json: ejecuta `kaleidos voz {proy.slug}`")
    man = leer_json(man_p)
    bloques = man["bloques"]
    cli = instalar.whisper_cli()
    nombre_modelo = proy.cfg.get("whisper", {}).get("modelo", "large-v3-turbo")
    modelo = instalar.modelo_whisper(nombre_modelo)
    base = proy.cfg.get("whisper", {}).get("prompt", "") or ""
    terminos = terminos_prompt([b["texto"] for b in bloques])
    # prompt = el de proyecto.json + los términos del texto que aún no estén en él (sin repetir)
    ya = {_clave(x) for x in re.split(r"[,;]\s*|\s+", base)}
    extra = [x for x in terminos.split(", ") if x and _clave(x) not in ya]
    prompt = ", ".join(x for x in (base.strip().rstrip(".,"), ", ".join(extra)) if x)[:800]
    idioma = proy.cfg.get("idioma", "es")

    wav = proy.work / "audio" / "voz_16k.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    correr([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", fuente, "-vn", "-af", "highpass=f=60",
            "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", wav], log=proy.logs / "transcribir.log")
    rms = _rms_100ms(wav)
    validos = rms[rms > -100]
    suelo = float(np.percentile(validos, 5)) if len(validos) else -120.0
    nivel = float(np.percentile(validos, 90)) if len(validos) else -20.0
    umbral = round(max(suelo + 10, min(-40.0, nivel - 25)), 1)
    # para los pasos que leen el análisis (linea, rangos mudos): mismo formato que `analizar`
    escribir_json(proy.analisis / "rms100ms.json", {"paso": 0.1, "rms_db": [round(float(v), 2) for v in rms]}, compacto=True)
    escribir_json(proy.analisis / "audio.json", {"hay_audio": True, "fuente": "work/narracion.m4a",
                                                 "umbral_voz_db": umbral, "suelo_ruido_db": round(suelo, 1),
                                                 "voz_p90_db": round(nivel, 1)})

    # un trozo por bloque (tiempos exactos del manifest), unidos hasta 120 s si van seguidos
    regiones = [{"ini": max(0.0, b["inicio"] - 0.1), "fin": b["fin"] + 0.15} for b in bloques]
    trozos = _trozos(regiones, 120.0)
    rutas = _escribir_trozos(wav, trozos, proy.work / "transcripcion" / "trozos")
    cmd = [cli, "-m", modelo, "-l", idioma, "-t", str(hilos), "-bs", "5", "-bo", "5", "-mc", "0",
           "-ojf", "-dtw", "large.v3.turbo" if "turbo" in nombre_modelo else nombre_modelo.replace("-", "."),
           "-nfa", "-sns", "-pp"]
    if prompt:
        cmd += ["--prompt", prompt]
    t1 = time.time()
    sin_dtw = _whisper_por_trozos(cmd, rutas, proy.logs / "transcribir.log")
    t_whisper = time.time() - t1
    palabras, segmentos = [], []
    for c, r in zip(trozos, rutas):
        ws, ss = _palabras_de(leer_json(Path(str(r) + ".json")), c["ini"])
        palabras += ws
        segmentos += ss
    palabras.sort(key=lambda w: w["ini"])
    palabras, fusionadas = _fusionar(palabras)
    palabras, avisos = _quitar_repeticiones(palabras, rms, umbral)
    avisos += [f"trozo {Path(r).name} sin DTW (whisper.cpp falló con DTW); sus palabras se realinean con la energía"
               for r in sin_dtw]
    movidas = _realinear(palabras, rms, umbral)
    whisper_txt = " ".join(w["t"] for w in palabras)
    est_total = {"iguales": 0, "corregidas": 0, "interpoladas": 0, "quitadas": 0}
    if corregir:
        nuevas = []
        for k, b in enumerate(bloques):
            # palabras de Whisper cuyo centro cae en el bloque (hasta la mitad de la pausa con los vecinos)
            a0 = (bloques[k - 1]["fin"] + b["inicio"]) / 2 if k else -1.0
            a1 = (b["fin"] + bloques[k + 1]["inicio"]) / 2 if k + 1 < len(bloques) else 1e9
            ws = [w for w in palabras if a0 <= (w["ini"] + w["fin"]) / 2 < a1]
            script = _ETIQUETA.sub(" ", b["texto"]).split()
            if not ws:
                avisos.append(f"bloque {b['id']}: Whisper no devolvió palabras; se interpolan las del texto")
            al, est = _alinear_bloque(ws, script, b["inicio"], b["fin"])
            for kk in est:
                est_total[kk] += est[kk]
            nuevas += al
        palabras = nuevas
    salida_p = [{"t": w["t"], "ini": round(w["ini"], 3), "fin": round(w["fin"], 3),
                 "p": round(float(np.mean(w["ps"])), 3),
                 **{k: True for k in ("corregida", "interpolada") if w.get(k)}} for w in palabras]
    dur = proy.fuente_info()["duracion"]
    meta = {
        "modelo": Path(modelo).stem.replace("ggml-", ""), "motor": f"whisper.cpp {instalar.whisper_version()}, Metal, DTW",
        "idioma": idioma, "prompt": prompt, "fuente": "work/narracion.m4a", "narracion": True,
        "duracion_fuente": round(dur, 3), "audio_a_whisper_s": round(sum(c["fin"] - c["ini"] for c in trozos), 1),
        "segundos_whisper": round(t_whisper, 1), "segundos_total": round(time.time() - t0, 1),
        "trozos": [{"ini": round(c["ini"], 2), "fin": round(c["fin"], 2)} for c in trozos],
        "fusionadas": fusionadas, "realineadas": movidas, "rellenadas": 0,
        "correccion_texto": {"activa": corregir, **est_total}, "avisos": avisos,
    }
    segs = [{"ini": b["inicio"], "fin": b["fin"], "texto": _ETIQUETA.sub(" ", b["texto"]).strip(), "bloque": b["id"]}
            for b in bloques] if corregir else segmentos
    escribir_json(proy.work / "transcripcion.json", {**meta, "palabras": salida_p, "segmentos": segs})
    (proy.work / "transcripcion.txt").write_text(_texto_legible(proy, salida_p, meta), encoding="utf-8")
    (proy.work / "transcripcion" / "whisper_sin_corregir.txt").write_text(whisper_txt + "\n", encoding="utf-8")
    info(f"{len(salida_p)} palabras; whisper {t_whisper:.1f} s; corrección contra locucion: {est_total}")
    for a in avisos:
        info(f"aviso: {a}")
    return {"palabras": len(salida_p), "segundos_whisper": meta["segundos_whisper"], **est_total}
