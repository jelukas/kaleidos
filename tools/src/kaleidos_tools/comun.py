"""Utilidades comunes: rutas, proyecto, ffprobe, ejecución con registro y medida de tiempos."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from contextlib import contextmanager
from pathlib import Path

HERRAMIENTAS = Path(__file__).resolve().parents[2]          # tools/
RAIZ = HERRAMIENTAS.parent                                   # raíz del repositorio kaleidos
MODELOS = HERRAMIENTAS / "modelos"
VENDOR = HERRAMIENTAS / "vendor"
PROYECTOS = RAIZ / "proyectos"

# Cachés de modelos dentro de tools/modelos (nada en el HOME del usuario).
os.environ.setdefault("TORCH_HOME", str(MODELOS / "torch"))
os.environ.setdefault("HF_HOME", str(MODELOS / "hf"))
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")


class ErrorKaleidos(RuntimeError):
    """Error esperado del pipeline (se muestra sin traza)."""


def info(msg: str) -> None:
    print(f"[kaleidos] {msg}", flush=True)


def aviso(msg: str) -> None:
    print(f"[kaleidos] AVISO: {msg}", file=sys.stderr, flush=True)


def leer_json(ruta: Path):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def escribir_json(ruta: Path, datos, compacto: bool = False) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    tmp = ruta.with_suffix(ruta.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        if compacto:
            json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(datos, f, ensure_ascii=False, indent=1)
        f.write("\n")
    os.replace(tmp, ruta)


def cargar_env(ruta: Path | None = None) -> list[str]:
    """Lee RAIZ/.env (KEY=valor, # comentarios) y lo vuelca en os.environ SIN pisar lo ya definido.
    Nunca imprime valores; devuelve solo los nombres de las variables cargadas."""
    ruta = ruta or (RAIZ / ".env")
    cargadas: list[str] = []
    if not ruta.exists():
        return cargadas
    for bruto in ruta.read_text(encoding="utf-8").splitlines():
        linea = bruto.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        k, v = linea.split("=", 1)
        k, v = k.strip().removeprefix("export ").strip(), v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        if k and k not in os.environ:
            os.environ[k] = v
            cargadas.append(k)
    return cargadas


def ffmpeg_bin() -> str:
    b = shutil.which("ffmpeg")
    if not b:
        raise ErrorKaleidos("no encuentro ffmpeg en el PATH")
    return b


def ffprobe_bin() -> str:
    b = shutil.which("ffprobe")
    if not b:
        raise ErrorKaleidos("no encuentro ffprobe en el PATH")
    return b


def ffprobe(ruta: Path) -> dict:
    out = subprocess.run(
        [ffprobe_bin(), "-v", "error", "-show_format", "-show_streams", "-of", "json", str(ruta)],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def fps_de(stream: dict) -> float:
    num, den = stream.get("avg_frame_rate") or stream.get("r_frame_rate") or "0/1", "1"
    if "/" in num:
        num, den = num.split("/")
    return float(num) / float(den) if float(den) else 0.0


def video_info(ruta: Path) -> dict:
    """Resumen del primer flujo de vídeo: ancho, alto, fps, duración, fotogramas y audio."""
    d = ffprobe(ruta)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), None)
    if v is None:
        raise ErrorKaleidos(f"{ruta} no tiene vídeo")
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    fps = fps_de(v)
    dur = float(d["format"].get("duration") or v.get("duration") or 0)
    nb = int(v["nb_frames"]) if v.get("nb_frames", "").isdigit() else round(dur * fps)
    return {
        "ancho": int(v["width"]), "alto": int(v["height"]), "fps": fps, "duracion": dur,
        "fotogramas": nb, "codec": v.get("codec_name"), "pix_fmt": v.get("pix_fmt"),
        "color": {k: v.get(k) for k in ("color_space", "color_range", "color_transfer", "color_primaries")},
        "audio": None if a is None else {
            "codec": a.get("codec_name"), "canales": a.get("channels"),
            "frecuencia": int(a.get("sample_rate", 0)), "disposicion": a.get("channel_layout"),
        },
    }


def contar_fotogramas(ruta: Path) -> int:
    """Número real de fotogramas (cuenta paquetes; no se fía de la cabecera)."""
    out = subprocess.run(
        [ffprobe_bin(), "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(ruta)],
        check=True, capture_output=True, text=True,
    ).stdout.strip().split("\n")[0].strip(",")
    return int(out)


def correr(cmd: list[str], log: Path | None = None, cwd: Path | None = None, eco: bool = False) -> None:
    """Ejecuta un comando dejando su salida COMPLETA (sin filtrar) en `log`. Lanza error si falla."""
    cmd = [str(c) for c in cmd]
    if log is not None:
        log.parent.mkdir(parents=True, exist_ok=True)
        with open(log, "a", encoding="utf-8") as f:
            f.write(f"\n$ {' '.join(cmd)}\n")
            f.flush()
            p = subprocess.run(cmd, cwd=cwd, stdout=f, stderr=subprocess.STDOUT)
    else:
        p = subprocess.run(cmd, cwd=cwd, stdout=None if eco else subprocess.DEVNULL, stderr=None)
    if p.returncode != 0:
        extra = f" (registro: {log})" if log else ""
        raise ErrorKaleidos(f"falló {Path(cmd[0]).name} con código {p.returncode}{extra}")


def salida_de(cmd: list[str], log: Path | None = None) -> str:
    """Ejecuta y devuelve stdout+stderr (y los guarda en el registro)."""
    cmd = [str(c) for c in cmd]
    p = subprocess.run(cmd, capture_output=True, text=True)
    txt = (p.stdout or "") + (p.stderr or "")
    if log is not None:
        log.parent.mkdir(parents=True, exist_ok=True)
        with open(log, "a", encoding="utf-8") as f:
            f.write(f"\n$ {' '.join(cmd)}\n{txt}")
    if p.returncode != 0:
        raise ErrorKaleidos(f"falló {Path(cmd[0]).name} con código {p.returncode}" + (f" (registro: {log})" if log else ""))
    return txt


def hms(seg: float) -> str:
    seg = max(0.0, float(seg))
    h, r = divmod(seg, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:04.1f}" if h else f"{int(m)}:{s:04.1f}"


class Proyecto:
    """Carpeta proyectos/<slug>/ con su proyecto.json."""

    def __init__(self, slug: str):
        self.slug = slug
        self.dir = PROYECTOS / slug
        self.work = self.dir / "work"
        self.media = self.dir / "media"
        self.analisis = self.work / "analisis"
        self.logs = self.work / "logs"
        if not (self.dir / "proyecto.json").exists():
            raise ErrorKaleidos(f"no existe {self.dir / 'proyecto.json'} (crea el proyecto con `kaleidos nuevo {slug} --bruto …`)")
        self.cfg = leer_json(self.dir / "proyecto.json")

    @property
    def narracion(self) -> bool:
        """Proyecto sin bruto con locución TTS («modo narración»): la fuente es work/narracion.m4a."""
        return bool(self.cfg.get("narracion"))

    @property
    def audio_narracion(self) -> Path:
        return self.work / "narracion.m4a"

    @property
    def bruto(self) -> Path:
        if self.narracion or not self.cfg.get("bruto"):
            raise ErrorKaleidos(f"«{self.slug}» es un proyecto de narración (sin bruto): este paso no se aplica "
                                "(usa `voz`, `transcribir`, `linea` y `media`)")
        p = Path(self.cfg["bruto"])
        return p if p.is_absolute() else RAIZ / p

    def ruta(self, rel: str) -> Path:
        return self.dir / rel

    def fuente_info(self) -> dict:
        if self.narracion:
            # la «fuente» es la locución: lienzo = salida; duración = la de work/narracion.m4a
            a = self.audio_narracion
            if not a.exists():
                raise ErrorKaleidos(f"falta {a.relative_to(self.dir)}: ejecuta antes `kaleidos voz {self.slug}`")
            d = ffprobe(a)
            dur = float(d["format"].get("duration") or 0)
            sal = self.cfg.get("salida", {})
            fps = float(sal.get("fps") or 25)
            return {"ancho": int(sal.get("ancho", 1920)), "alto": int(sal.get("alto", 1080)), "fps": fps,
                    "duracion": dur, "fotogramas": round(dur * fps), "audio": True}
        cache = self.analisis / "fuente.json"
        if cache.exists():
            d = leer_json(cache)
            if d.get("_ruta") == str(self.bruto) and d.get("_mtime") == self.bruto.stat().st_mtime:
                return d
        d = video_info(self.bruto)
        d["_ruta"] = str(self.bruto)
        d["_mtime"] = self.bruto.stat().st_mtime
        escribir_json(cache, d)
        return d

    def analisis_json(self, nombre: str, obligatorio: bool = True):
        p = self.analisis / nombre
        if not p.exists():
            if obligatorio:
                raise ErrorKaleidos(f"falta {p}: ejecuta antes `kaleidos analizar {self.slug}`")
            return None
        return leer_json(p)

    def canal_voz(self) -> str:
        """Filtro de ffmpeg que extrae la voz en mono según el análisis de canales."""
        a = self.analisis_json("audio.json", obligatorio=False)
        canal = (a or {}).get("canal_voz", "mezcla")
        return {"izq": "pan=mono|c0=c0", "der": "pan=mono|c0=c1"}.get(canal, "pan=mono|c0=0.5*c0+0.5*c1")


@contextmanager
def cronometro(proy: Proyecto, paso: str, **detalles):
    """Mide el tiempo de un paso y lo acumula en work/logs/tiempos.json."""
    t0 = time.time()
    extra: dict = dict(detalles)
    try:
        yield extra
        estado = "ok"
    except BaseException as e:  # noqa: BLE001 — se registra y se relanza
        estado = f"error: {type(e).__name__}: {e}"
        raise
    finally:
        seg = time.time() - t0
        ruta = proy.logs / "tiempos.json"
        datos = leer_json(ruta) if ruta.exists() else {"pasos": []}
        datos["pasos"].append({
            "paso": paso, "inicio": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t0)),
            "segundos": round(seg, 1), "estado": estado, **extra,
        })
        escribir_json(ruta, datos)
        info(f"{paso}: {seg:.1f} s ({hms(seg)}) — {estado}")


def hay_encoder(nombre: str) -> bool:
    out = subprocess.run([ffmpeg_bin(), "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    return f" {nombre} " in out


def enlazar_duro(origen: Path, destino: Path) -> str:
    """Enlace duro origen→destino (sustituye si apunta a otro inodo). Devuelve lo que hizo."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists():
        if destino.stat().st_ino == origen.stat().st_ino:
            return "ya enlazado"
        destino.unlink()
    os.link(origen, destino)
    return "enlazado"


def independizar(ruta: Path) -> bool:
    """Rompe el enlace duro de `ruta` (si tiene más de un nombre) sustituyéndola por una copia propia.

    En APFS la copia es un clon (`cp -c`): instantánea y sin ocupar disco hasta que se modifica. Así un paso que
    reescribe su salida en el sitio (ffmpeg -y, write_text) no altera el fichero del proyecto del que se heredó
    (`kaleidos nuevo --desde-proyecto`). Devuelve True si hubo que copiar."""
    if not ruta.is_file() or ruta.stat().st_nlink <= 1:
        return False
    tmp = ruta.with_name(f".{ruta.name}.indep")
    if tmp.exists():
        tmp.unlink()
    ok = sys.platform == "darwin" and subprocess.run(["cp", "-c", str(ruta), str(tmp)],
                                                     capture_output=True).returncode == 0
    if not ok:
        shutil.copy2(ruta, tmp)
    os.replace(tmp, ruta)
    return True


# Salidas que reescribe cada paso (relativas a proyectos/<slug>/). Si el preproceso se heredó con enlaces duros,
# `cli` las independiza antes de ejecutar el paso.
SALIDAS_PASO = {
    "analizar": ["work/analisis"],
    "transcribir": ["work/transcripcion.json", "work/transcripcion.txt", "work/transcripcion_sin_relleno.json",
                    "work/audio/voz_16k.wav"],
    "master": ["work/mezzanine.mp4", "work/mezzanine.json", "work/audio", "work/lut"],
    "recortar": ["work/mascara.mp4", "work/plancha.mp4", "work/plancha.json"],
    "pose": ["work/pose.json", "work/gestos.json"],
}
SALIDAS_PASO["preparar"] = [r for v in SALIDAS_PASO.values() for r in v]


def independizar_salidas(proy: "Proyecto", paso: str) -> int:
    n = 0
    for rel in SALIDAS_PASO.get(paso, []):
        p = proy.dir / rel
        for f in (p.rglob("*") if p.is_dir() else [p]):
            if f.is_file() and independizar(f):
                n += 1
    if n:
        info(f"{paso}: {n} ficheros heredados de «{proy.cfg.get('preproceso', {}).get('desde')}» pasan a ser "
             f"copias propias (clon) antes de reescribirse")
    return n
