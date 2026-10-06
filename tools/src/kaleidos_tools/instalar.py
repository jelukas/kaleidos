"""`kaleidos instalar`: whisper.cpp con Metal y modelos en tools/modelos/ (solo orígenes oficiales)."""

from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
from pathlib import Path

from .comun import MODELOS, VENDOR, ErrorKaleidos, correr, info

WHISPER_REPO = "https://github.com/ggml-org/whisper.cpp.git"   # antes ggerganov/whisper.cpp (redirige)
WHISPER_DIR = VENDOR / "whisper.cpp"
WHISPER_CLI = WHISPER_DIR / "build" / "bin" / "whisper-cli"
HF = "https://huggingface.co"

MODELOS_WHISPER = {
    # nombre → (repositorio oficial en Hugging Face, fichero, sha256)
    "large-v3-turbo": ("ggerganov/whisper.cpp", "ggml-large-v3-turbo.bin",
                       "1fc70f774d38eb169993ac391eea357ef47c88757ef72ee5943879b7e8e2bc69"),
    "medium": ("ggerganov/whisper.cpp", "ggml-medium.bin", None),
}
MEDIAPIPE = {
    "pose_lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    "pose_full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
    "pose_heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
    "manos": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
}
# Real-ESRGAN x2plus: el autor solo lo publica en GitHub; se toma de una réplica en Hugging Face y se
# verifica que es byte a byte el fichero oficial (sha256 de la release v0.2.1 de xinntao/Real-ESRGAN).
ESRGAN = ("nateraw/real-esrgan", "RealESRGAN_x2plus.pth",
          "49fafd45f8fd7aa8d31ab2a22d14d91b536c34494a5cfe31eb5d89c2fa266abb")
DEPTH = "depth-anything/Depth-Anything-V2-Base-hf"


def _sha256(ruta: Path) -> str:
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 22), b""):
            h.update(bloque)
    return h.hexdigest()


def descargar(url: str, destino: Path, sha256: str | None = None) -> Path:
    if destino.exists():
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    parte = destino.with_suffix(destino.suffix + ".part")
    info(f"descargando {url}")
    correr(["curl", "-L", "--fail", "-s", "-S", "-C", "-", "-o", parte, url])
    if sha256 and _sha256(parte) != sha256:
        parte.unlink()
        raise ErrorKaleidos(f"sha256 inesperado en {destino.name}")
    os.replace(parte, destino)
    return destino


def modelo_whisper(nombre: str = "large-v3-turbo") -> Path:
    if nombre not in MODELOS_WHISPER:
        raise ErrorKaleidos(f"modelo de whisper desconocido: {nombre}")
    repo, fichero, sha = MODELOS_WHISPER[nombre]
    return descargar(f"{HF}/{repo}/resolve/main/{fichero}", MODELOS / fichero, sha)


def whisper_cli() -> Path:
    """Compila whisper.cpp (Metal + Accelerate, estático) si no está."""
    if WHISPER_CLI.exists():
        return WHISPER_CLI
    if not WHISPER_DIR.exists():
        correr(["git", "clone", "--depth", "1", WHISPER_REPO, WHISPER_DIR])
    venv_bin = Path(sys.executable).parent          # cmake y ninja vienen de PyPI, en el entorno
    env_path = f"{venv_bin}:{os.environ.get('PATH', '')}"
    log = VENDOR / "whisper_build.log"
    for cmd in (
        ["cmake", "-B", "build", "-G", "Ninja", "-DCMAKE_BUILD_TYPE=Release", "-DGGML_METAL=ON",
         "-DGGML_METAL_EMBED_LIBRARY=ON", "-DBUILD_SHARED_LIBS=OFF", "-DWHISPER_BUILD_TESTS=OFF",
         "-DWHISPER_BUILD_EXAMPLES=ON", "-DWHISPER_SDL2=OFF"],
        ["cmake", "--build", "build", "-j", str(os.cpu_count() or 8), "--target", "whisper-cli"],
    ):
        with open(log, "a") as f:
            p = subprocess.run(cmd, cwd=WHISPER_DIR, stdout=f, stderr=subprocess.STDOUT,
                               env={**os.environ, "PATH": env_path})
        if p.returncode:
            raise ErrorKaleidos(f"falló la compilación de whisper.cpp (ver {log})")
    return WHISPER_CLI


def whisper_version() -> str:
    try:
        return subprocess.run(["git", "-C", WHISPER_DIR, "log", "-1", "--format=%h %cs"],
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        return "?"


def modelo_pose(variante: str = "full") -> Path:
    clave = f"pose_{variante}"
    return descargar(MEDIAPIPE[clave], MODELOS / "mediapipe" / Path(MEDIAPIPE[clave]).name)


def modelo_manos() -> Path:
    return descargar(MEDIAPIPE["manos"], MODELOS / "mediapipe" / "hand_landmarker.task")


def modelo_esrgan() -> Path:
    repo, fichero, sha = ESRGAN
    return descargar(f"{HF}/{repo}/resolve/main/{fichero}", MODELOS / "esrgan" / fichero, sha)


def rvm(modelo: str = "resnet50"):
    import torch
    return torch.hub.load("PeterL1n/RobustVideoMatting", modelo, trust_repo=True)


def ejecutar(args) -> int:
    for que in args.que:
        if que == "whisper":
            info(f"whisper-cli: {whisper_cli()} ({whisper_version()})")
            info(f"modelo: {modelo_whisper()}")
        elif que == "pose":
            info(f"pose: {modelo_pose('full')}")
        elif que == "manos":
            info(f"manos: {modelo_manos()}")
        elif que == "rvm":
            rvm("resnet50")
            rvm("mobilenetv3")
            info("RobustVideoMatting (torch.hub) listo")
        elif que == "profundidad":
            from huggingface_hub import snapshot_download
            info(f"Depth Anything V2 Base: {snapshot_download(DEPTH)}")
        elif que == "ampliar":
            info(f"Real-ESRGAN x2plus: {modelo_esrgan()}")
    shutil.which("ffmpeg") or info("AVISO: falta ffmpeg en el PATH")
    return 0
