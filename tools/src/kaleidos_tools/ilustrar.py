"""Método corto-ilustrado: profundidad (Depth Anything V2 Base) y ampliación ×2 (Real-ESRGAN x2plus) en MPS.

Entrada: imágenes de work/ilustraciones/ (jpg/png/webp). Salida: media/extras/<nombre>_profundidad.png
(16 bits, normalizada por percentiles, filtro bilateral + desenfoque suave) y media/extras/<nombre>_x2.png.
"""

from __future__ import annotations

import time
from pathlib import Path

import numpy as np

from .comun import ErrorKaleidos, Proyecto, info

EXT = {".jpg", ".jpeg", ".png", ".webp"}


def _imagenes(proy: Proyecto, una: str | None) -> list[Path]:
    d = proy.work / "ilustraciones"
    if not d.exists():
        raise ErrorKaleidos(f"no existe {d} (pon ahí las ilustraciones)")
    ims = [d / una] if una else sorted(p for p in d.iterdir() if p.suffix.lower() in EXT)
    if not ims:
        raise ErrorKaleidos(f"no hay imágenes en {d}")
    return ims


def _dispositivo():
    import torch
    return torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")


def profundidad(proy: Proyecto, una: str | None = None) -> dict:
    import cv2
    import torch
    from PIL import Image
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    from .instalar import DEPTH

    dev = _dispositivo()
    t0 = time.time()
    proc = AutoImageProcessor.from_pretrained(DEPTH)
    modelo = AutoModelForDepthEstimation.from_pretrained(DEPTH).to(dev).eval()
    carga = time.time() - t0
    salida = proy.media / "extras"
    salida.mkdir(parents=True, exist_ok=True)
    hechas = []
    for ruta in _imagenes(proy, una):
        t1 = time.time()
        img = Image.open(ruta).convert("RGB")
        x = proc(images=img, return_tensors="pt").to(dev)
        with torch.inference_mode():
            pred = modelo(**x).predicted_depth                  # [1, h, w], mayor = más cerca
        pred = torch.nn.functional.interpolate(pred[:, None], size=img.size[::-1], mode="bicubic",
                                               align_corners=False)[0, 0].float().cpu().numpy()
        lo, hi = np.percentile(pred, [2, 98])
        d = np.clip((pred - lo) / max(hi - lo, 1e-6), 0, 1).astype(np.float32)
        d = cv2.bilateralFilter(d, 9, 0.1, 5)
        d = cv2.GaussianBlur(d, (0, 0), 1.2)
        destino = salida / f"{ruta.stem}_profundidad.png"
        cv2.imwrite(str(destino), (np.clip(d, 0, 1) * 65535).astype(np.uint16))
        hechas.append({"imagen": ruta.name, "salida": str(destino.relative_to(proy.dir)), "segundos": round(time.time() - t1, 2),
                       "tamano": list(img.size)})
        info(f"profundidad: {ruta.name} → {destino.name} ({time.time() - t1:.1f} s, {img.size[0]}×{img.size[1]})")
    return {"modelo": DEPTH, "dispositivo": str(dev), "carga_s": round(carga, 1), "imagenes": hechas}


def ampliar(proy: Proyecto, una: str | None = None, tesela: int = 512, solape: int = 32) -> dict:
    import torch
    from PIL import Image
    from spandrel import ModelLoader

    from .instalar import modelo_esrgan

    dev = _dispositivo()
    t0 = time.time()
    desc = ModelLoader().load_from_file(str(modelo_esrgan()))
    escala = desc.scale
    red = desc.model.eval().to(dev)
    media = desc.supports_half and dev.type == "mps"
    if media:
        red = red.half()
    carga = time.time() - t0
    salida = proy.media / "extras"
    salida.mkdir(parents=True, exist_ok=True)
    hechas = []
    for ruta in _imagenes(proy, una):
        t1 = time.time()
        img = np.asarray(Image.open(ruta).convert("RGB"), dtype=np.float32) / 255.0
        H, W, _ = img.shape
        out = np.zeros((H * escala, W * escala, 3), np.float32)
        peso = np.zeros((H * escala, W * escala, 1), np.float32)
        paso = tesela - solape
        for y in range(0, H, paso):
            for x in range(0, W, paso):
                y0, x0 = min(y, max(0, H - tesela)), min(x, max(0, W - tesela))
                t = img[y0:y0 + tesela, x0:x0 + tesela]
                tt = torch.from_numpy(t).permute(2, 0, 1)[None].to(dev)
                tt = tt.half() if media else tt
                with torch.inference_mode():
                    r = red(tt).float().clamp(0, 1)[0].permute(1, 2, 0).cpu().numpy()
                h, w = t.shape[:2]
                out[y0 * escala:(y0 + h) * escala, x0 * escala:(x0 + w) * escala] += r
                peso[y0 * escala:(y0 + h) * escala, x0 * escala:(x0 + w) * escala] += 1
        out /= np.maximum(peso, 1e-6)
        destino = salida / f"{ruta.stem}_x{escala}.png"
        Image.fromarray((out * 255).round().clip(0, 255).astype(np.uint8)).save(destino)
        hechas.append({"imagen": ruta.name, "salida": str(destino.relative_to(proy.dir)), "segundos": round(time.time() - t1, 2),
                       "de": [W, H], "a": [W * escala, H * escala]})
        info(f"ampliar: {ruta.name} {W}×{H} → {destino.name} {W * escala}×{H * escala} ({time.time() - t1:.1f} s, "
             f"{'fp16' if media else 'fp32'})")
    return {"modelo": "RealESRGAN_x2plus (spandrel)", "dispositivo": str(dev), "fp16": media, "carga_s": round(carga, 1),
            "imagenes": hechas}
