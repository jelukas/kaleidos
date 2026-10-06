"""Etalonaje del mezzanine y de la plancha, definido una sola vez.

Orden (en RGB con gamma, 0–1): balance de blancos por canal → exposición → saturación → desaturación
selectiva de azules/magentas → curva S (monótona, PCHIP aproximada por polinomio) → [nitidez de luma].
La misma función se usa en la GPU (PyTorch MPS, compilada) y para hornear una LUT .cube que aplica ffmpeg
en el modo `--cpu` (y que sirve para cualquier editor).
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np

# BT.709
KR, KG, KB = 0.2126, 0.7152, 0.0722


def parametros(recom: dict) -> dict:
    v = recom["video"]
    xs, ys = zip(*[tuple(map(float, p.split("/"))) for p in v["curva"].split()])
    from scipy.interpolate import PchipInterpolator
    t = np.linspace(0, 1, 1025)
    curva = PchipInterpolator(xs, ys)(t)
    coef = np.polyfit(t, curva, 7)
    err = float(np.abs(np.polyval(coef, t) - curva).max())
    return {
        "ganancias": [float(g) * float(v.get("exposicion", 1.0)) for g in v["ganancias_rgb"]],
        "saturacion": float(v.get("saturacion", 1.0)),
        "desat_bm": float(v.get("desaturar_azul_magenta", 0.0)),
        "curva_coef": coef.tolist(), "curva_error": err,
        "unsharp": float(v.get("unsharp", 0.0)),
    }


def grado_rgb(rgb, p: dict, xp):
    """rgb: tensor/array [..., 3, H, W] en 0–1. `xp` = torch o numpy (para hornear la LUT)."""
    g = p["ganancias"]
    r, gr, b = rgb[..., 0:1, :, :] * g[0], rgb[..., 1:2, :, :] * g[1], rgb[..., 2:3, :, :] * g[2]
    L = KR * r + KG * gr + KB * b
    s = p["saturacion"]
    r, gr, b = L + s * (r - L), L + s * (gr - L), L + s * (b - L)
    if p["desat_bm"] > 0:
        cb = (b - L) / 1.8556
        cr = (r - L) / 1.5748
        ang = xp.arctan2(cr, cb) * (180.0 / math.pi)             # azul ≈ −5°, magenta ≈ 50°
        u = xp.clip((ang - 22.5) / 60.0, -1.0, 1.0)
        w = 0.5 * (1.0 + xp.cos(u * math.pi))
        k = 1.0 - p["desat_bm"] * w
        r, gr, b = L + k * (r - L), L + k * (gr - L), L + k * (b - L)
    out = []
    for c in (r, gr, b):
        c = xp.clip(c, 0.0, 1.0)
        acc = c * 0 + p["curva_coef"][0]
        for a in p["curva_coef"][1:]:
            acc = acc * c + a
        out.append(xp.clip(acc, 0.0, 1.0))
    if xp is np:
        return np.concatenate(out, axis=-3)
    import torch
    return torch.cat(out, dim=-3)


def hornear_cube(p: dict, ruta: Path, n: int = 33) -> Path:
    t = np.linspace(0, 1, n, dtype=np.float64)
    B, G, R = np.meshgrid(t, t, t, indexing="ij")               # R varía más rápido (formato .cube)
    rgb = np.stack([R.ravel(), G.ravel(), B.ravel()])[:, None, :]  # [3, 1, n³]
    out = grado_rgb(rgb, p, np)[:, 0, :]
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta, "w") as f:
        f.write('TITLE "kaleidos: balance de blancos + exposicion + saturacion + desat. azul/magenta + curva S"\n')
        f.write(f"LUT_3D_SIZE {n}\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n")
        for i in range(out.shape[1]):
            f.write(f"{out[0, i]:.6f} {out[1, i]:.6f} {out[2, i]:.6f}\n")
    return ruta


# ——— núcleos de GPU (NV12 limitado BT.709 ↔ RGB) ———

def nucleo_nv12(p: dict, ancho: int, alto: int, dispositivo):
    """Devuelve f(x: uint8 [B, ancho·alto·3/2]) → uint8 [B, …] NV12 etalonado y con nitidez de luma."""
    import torch
    import torch.nn.functional as F

    W, H = ancho, alto
    k = torch.tensor([1, 4, 6, 4, 1], dtype=torch.float16, device=dispositivo)
    k = (k[:, None] * k[None, :])
    k = (k / k.sum()).view(1, 1, 5, 5)
    amt = p["unsharp"]

    def f(x):
        B = x.shape[0]
        y = x[:, : W * H].view(B, 1, H, W).half()
        uv = x[:, W * H:].view(B, H // 2, W // 2, 2).permute(0, 3, 1, 2).half()
        uv = F.interpolate(uv, scale_factor=2, mode="nearest")
        Y = (y - 16) / 219
        cb = (uv[:, 0:1] - 128) / 224
        cr = (uv[:, 1:2] - 128) / 224
        rgb = torch.cat([Y + 1.5748 * cr, Y - 0.1873 * cb - 0.4681 * cr, Y + 1.8556 * cb], 1)
        rgb = grado_rgb(rgb, p, torch)
        L = KR * rgb[:, 0:1] + KG * rgb[:, 1:2] + KB * rgb[:, 2:3]
        cb = (rgb[:, 2:3] - L) / 1.8556
        cr = (rgb[:, 0:1] - L) / 1.5748
        if amt > 0:
            Lb = F.conv2d(F.pad(L, (2, 2, 2, 2), mode="replicate"), k)
            L = L + amt * (L - Lb)
        yo = (L * 219 + 16).round().clamp(0, 255).to(torch.uint8)
        c = F.avg_pool2d(torch.cat([cb, cr], 1), 2)
        c = (c * 224 + 128).round().clamp(0, 255).to(torch.uint8)
        return torch.cat([yo.view(B, -1), c.permute(0, 2, 3, 1).reshape(B, -1)], 1)

    return f
