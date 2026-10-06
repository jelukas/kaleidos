"""`kaleidos recortar`: máscara del ponente y plancha premultiplicada, sin ficheros intermedios.

Máscara (work/mascara.mp4, gris 1080p):
  ffmpeg (VideoToolbox decodifica el mezzanine, o el bruto con scale_vt) → NV12 por tubería →
  RobustVideoMatting (torch.hub PeterL1n/RobustVideoMatting, resnet50 o mobilenetv3) en MPS, fp16,
  downsample_ratio 0,25, lotes temporales [1, T, 3, H, W] (el codificador trabaja en lote y el estado
  recurrente avanza igual) → alfa con el borde algo cerrado → NV12 por tubería → h264_videotoolbox.
  Alternativa `--motor vision`: VNGeneratePersonSegmentationRequest de Apple Vision (pyobjc).
  Se escribe por partes de 2500 fotogramas (100 s) en work/recorte/mascara/: si el proceso muere se pierde
  como mucho la parte en curso; `--desde F` (o nada: continúa donde se quedó) y al final se concatena y se
  valida el número de fotogramas. Los registros de ffmpeg van completos a work/logs/.
Plancha (work/plancha.mp4 + work/plancha.json): la franja del ponente del bruto 4K (geometría sacada de la
  pose o del análisis), escalada (0,75) con scale_vt, etalonada igual que el mezzanine y multiplicada por la
  máscara (con contraste) en la GPU → h264_videotoolbox. Es la versión sin CUDA del §7.2 del método.
"""

from __future__ import annotations

import math
import queue
import subprocess
import threading
import time
from pathlib import Path

import numpy as np

from . import color, tuberia
from .comun import (
    ErrorKaleidos, Proyecto, contar_fotogramas, correr, cronometro, escribir_json, ffmpeg_bin, info, leer_json,
)

PARTE = 2500
ESCALA_PLANCHA = 0.75


# ——— motores de segmentación ———

class MotorRVM:
    def __init__(self, modelo: str = "resnet50", fp16: bool = True, downsample: float = 0.25):
        import torch

        from .instalar import rvm
        self.torch = torch
        self.dev = torch.device("mps")
        self.dtype = torch.float16 if fp16 else torch.float32
        self.net = rvm(modelo).eval().to(self.dev, self.dtype)
        self.ds = downsample
        self.rec = [None] * 4
        self.nombre = f"RVM {modelo} {'fp16' if fp16 else 'fp32'} ds={downsample}"

    def reiniciar(self, primero):
        """Calienta el estado recurrente repitiendo 6 veces el primer fotograma."""
        self.rec = [None] * 4
        with self.torch.inference_mode():
            x = primero[:1].unsqueeze(0).repeat(1, 6, 1, 1, 1)
            _, _, *self.rec = self.net(x, *self.rec, downsample_ratio=self.ds)

    def alfa(self, rgb):
        """rgb: [T, 3, H, W] (0–1, en la GPU) → alfa [T, 1, H, W]."""
        with self.torch.inference_mode():
            _, pha, *self.rec = self.net(rgb.unsqueeze(0).to(self.dtype), *self.rec, downsample_ratio=self.ds)
        return pha[0]


class MotorVision:
    """Segmentación de personas de Apple Vision (Neural Engine/GPU) vía pyobjc."""

    def __init__(self, calidad: str = "accurate"):
        import torch
        import Vision

        self.torch = torch
        self.dev = torch.device("mps")
        self.V = Vision
        niveles = {"accurate": Vision.VNGeneratePersonSegmentationRequestQualityLevelAccurate,
                   "balanced": Vision.VNGeneratePersonSegmentationRequestQualityLevelBalanced,
                   "fast": Vision.VNGeneratePersonSegmentationRequestQualityLevelFast}
        self.req = Vision.VNGeneratePersonSegmentationRequest.alloc().initWithCompletionHandler_(None)
        self.req.setQualityLevel_(niveles[calidad])
        self.req.setOutputPixelFormat_(1278226534)  # kCVPixelFormatType_OneComponent32Float ('L00f')
        self.seq = Vision.VNSequenceRequestHandler.alloc().init()
        self.nombre = f"Apple Vision {calidad}"

    def reiniciar(self, primero):
        self.seq = self.V.VNSequenceRequestHandler.alloc().init()

    def _cgimage(self, rgb8: np.ndarray):
        import Quartz
        h, w, _ = rgb8.shape
        rgba = np.concatenate([rgb8, np.full((h, w, 1), 255, np.uint8)], axis=2).tobytes()
        prov = Quartz.CGDataProviderCreateWithData(None, rgba, len(rgba), None)
        cs = Quartz.CGColorSpaceCreateDeviceRGB()
        return Quartz.CGImageCreate(w, h, 8, 32, w * 4, cs, Quartz.kCGImageAlphaNoneSkipLast, prov, None, False,
                                    Quartz.kCGRenderingIntentDefault)

    def alfa(self, rgb):
        import Quartz
        torch = self.torch
        T, _, H, W = rgb.shape
        arr = (rgb.clamp(0, 1) * 255).round().to(torch.uint8).permute(0, 2, 3, 1).cpu().numpy()
        out = []
        for i in range(T):
            img = self._cgimage(arr[i])
            ok, err = self.seq.performRequests_onCGImage_error_([self.req], img, None)
            if not ok:
                raise ErrorKaleidos(f"Vision falló: {err}")
            pb = self.req.results()[0].pixelBuffer()
            Quartz.CVPixelBufferLockBaseAddress(pb, 1)
            h, w = Quartz.CVPixelBufferGetHeight(pb), Quartz.CVPixelBufferGetWidth(pb)
            bpr = Quartz.CVPixelBufferGetBytesPerRow(pb)
            base = Quartz.CVPixelBufferGetBaseAddress(pb)
            buf = np.frombuffer(base.as_buffer(bpr * h), dtype=np.float32).reshape(h, bpr // 4)[:, :w].copy()
            Quartz.CVPixelBufferUnlockBaseAddress(pb, 1)
            out.append(torch.from_numpy(buf))
        m = torch.stack(out).unsqueeze(1).to(self.dev)
        return torch.nn.functional.interpolate(m, size=(H, W), mode="bilinear", align_corners=False)


# ——— conversión NV12 ↔ RGB en la GPU ———

def _nv12_a_rgb(x, W, H):
    import torch
    import torch.nn.functional as F
    B = x.shape[0]
    y = x[:, : W * H].view(B, 1, H, W).half()
    uv = x[:, W * H:].view(B, H // 2, W // 2, 2).permute(0, 3, 1, 2).half()
    uv = F.interpolate(uv, scale_factor=2, mode="nearest")
    Y = (y - 16) / 219
    cb = (uv[:, 0:1] - 128) / 224
    cr = (uv[:, 1:2] - 128) / 224
    return torch.cat([Y + 1.5748 * cr, Y - 0.1873 * cb - 0.4681 * cr, Y + 1.8556 * cb], 1).clamp(0, 1)


def _gris_a_nv12(a, W, H):
    """alfa [B,1,H,W] 0–1 → NV12 limitado (Y = 16 + 219·α, croma neutra)."""
    import torch
    B = a.shape[0]
    y = (a * 219 + 16).round().clamp(0, 255).to(torch.uint8).view(B, -1)
    c = torch.full((B, W * H // 2), 128, dtype=torch.uint8, device=a.device)
    return torch.cat([y, c], 1)


def _rgb_a_nv12(rgb, W, H):
    import torch
    import torch.nn.functional as F
    B = rgb.shape[0]
    L = color.KR * rgb[:, 0:1] + color.KG * rgb[:, 1:2] + color.KB * rgb[:, 2:3]
    cb = (rgb[:, 2:3] - L) / 1.8556
    cr = (rgb[:, 0:1] - L) / 1.5748
    yo = (L * 219 + 16).round().clamp(0, 255).to(torch.uint8)
    c = F.avg_pool2d(torch.cat([cb, cr], 1), 2)
    c = (c * 224 + 128).round().clamp(0, 255).to(torch.uint8)
    return torch.cat([yo.view(B, -1), c.permute(0, 2, 3, 1).reshape(B, -1)], 1)


# ——— máscara por partes ———

def _dir_partes(proy: Proyecto) -> Path:
    d = proy.work / "recorte" / "mascara"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _partes_validas(proy: Proyecto) -> list[dict]:
    reg = _dir_partes(proy) / "partes.json"
    return leer_json(reg)["partes"] if reg.exists() else []


def _guardar_partes(proy: Proyecto, partes: list[dict]) -> None:
    escribir_json(_dir_partes(proy) / "partes.json", {"partes": sorted(partes, key=lambda p: p["ini"])})


def _siguiente_desde(partes: list[dict]) -> int:
    f = 0
    for p in sorted(partes, key=lambda p: p["ini"]):
        if p["ini"] != f:
            break
        f = p["ini"] + p["n"]
    return f


def _entrada_mascara(proy: Proyecto, ini: int, n: int, fps: float, W: int, H: int) -> tuple[list, str]:
    mezz = proy.work / "mezzanine.mp4"
    if mezz.exists():
        return (["ffmpeg", "-hide_banner", "-nostats", "-hwaccel", "videotoolbox", "-ss",
                 f"{max(0.0, (ini - 0.25) / fps):.4f}", "-i", str(mezz), "-an", "-frames:v", str(n),
                 "-f", "rawvideo", "-pix_fmt", "nv12", "-"], "mezzanine")
    return tuberia.decodificador_vt(proy.bruto, ini, n, fps, W, H), "bruto (scale_vt)"


def mascara(proy: Proyecto, motor, lote: int, desde: int | None, hasta: int | None, medir: float | None = None,
            muestras: bool = False) -> dict:
    import torch

    f = proy.fuente_info()
    fps, N = f["fps"], f["fotogramas"]
    W, H = proy.cfg["salida"]["ancho"], proy.cfg["salida"]["alto"]
    partes = _partes_validas(proy)
    if medir:
        ini = min(N - 1, round(600 * fps)) if N > 700 * fps else 0
        fin = min(N, ini + round(medir * fps))
    else:
        ini = desde if desde is not None else _siguiente_desde(partes)
        fin = min(N, hasta) if hasta else N
    if ini >= fin:
        info(f"máscara: nada que hacer ({ini} ≥ {fin})")
        return {"fotogramas": 0}
    n = fin - ini
    dec_cmd, origen = _entrada_mascara(proy, ini, n, fps, W, H)
    log = proy.logs / "recortar_mascara.log"
    flog = open(log, "a", encoding="utf-8")
    flog.write(f"\n# {time.strftime('%F %T')} {motor.nombre}, fotogramas [{ini}, {fin}) desde {origen}\n$ {' '.join(dec_cmd)}\n")
    flog.flush()
    dec = subprocess.Popen(dec_cmd, stdout=subprocess.PIPE, stderr=flog, bufsize=1 << 24)
    tam = W * H * 3 // 2
    qin: queue.Queue = queue.Queue(48)
    qout: queue.Queue = queue.Queue(48)
    estado = {"leidos": 0, "escritos": 0, "error": None}

    def lector():
        try:
            while estado["leidos"] < n:
                b = dec.stdout.read(tam)
                if len(b) < tam:
                    break
                qin.put(b)
                estado["leidos"] += 1
        except Exception as e:  # noqa: BLE001
            estado["error"] = f"lectura: {e}"
        qin.put(None)

    dir_ = _dir_partes(proy)
    nuevas: list[dict] = []

    def escritor():
        enc = None
        parte = None
        cnt = 0

        def cerrar():
            nonlocal enc
            if enc is None:
                return
            enc.stdin.close()
            rc = enc.wait()
            if rc != 0:
                estado["error"] = f"el codificador de la parte {parte['ini']} salió con {rc}"
                return
            parte["n"] = cnt
            nuevas.append(dict(parte))
            enc = None
        try:
            while True:
                item = qout.get()
                if item is None:
                    break
                idx, b = item
                limite = (idx // PARTE + 1) * PARTE
                if enc is None or idx >= parte["limite"]:
                    cerrar()
                    ruta = dir_ / ("medida.mp4" if medir else f"parte_{idx:06d}.mp4")
                    parte = {"ini": idx, "limite": min(limite, fin), "archivo": ruta.name}
                    cmd = tuberia.codificador_vt(ruta, W, H, fps, bitrate="3M", gop=round(2 * fps))
                    flog.write(f"$ {' '.join(cmd)}\n")
                    flog.flush()
                    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=flog)
                    cnt = 0
                enc.stdin.write(b)
                cnt += 1
                estado["escritos"] += 1
            cerrar()
        except Exception as e:  # noqa: BLE001
            estado["error"] = f"escritura: {e}"

    hl = threading.Thread(target=lector, daemon=True)
    he = threading.Thread(target=escritor, daemon=True)
    hl.start()
    he.start()
    t0 = time.time()
    ultimo = t0
    idx = ini
    primero = True
    muestras_t = {ini + n // 5, ini + n // 2, ini + (4 * n) // 5} if muestras else set()
    fin_datos = False
    while not fin_datos:
        bs = []
        while len(bs) < lote:
            b = qin.get()
            if b is None:
                fin_datos = True
                break
            bs.append(b)
        if not bs:
            break
        x = torch.from_numpy(np.frombuffer(b"".join(bs), dtype=np.uint8).reshape(len(bs), -1).copy()).to(motor.dev)
        rgb = _nv12_a_rgb(x, W, H)
        if primero:
            motor.reiniciar(rgb)
            primero = False
        a = motor.alfa(rgb).float()
        a = ((a - 0.04) / 0.92).clamp(0, 1)            # cierra un poco el borde (halo del fondo original)
        salida = _gris_a_nv12(a, W, H).cpu().numpy()
        for i in range(len(bs)):
            qout.put((idx + i, salida[i].tobytes()))
            if idx + i in muestras_t:
                _muestra(proy, rgb[i], a[i], idx + i, motor.nombre)
        idx += len(bs)
        ahora = time.time()
        if ahora - ultimo > 30:
            ultimo = ahora
            fps_m = (idx - ini) / (ahora - t0)
            info(f"máscara {idx - ini}/{n} · {fps_m:.1f} fps · fotograma {idx} · quedan {(fin - idx) / fps_m / 60:.1f} min")
            escribir_json(proy.logs / "recortar_progreso.json", {
                "motor": motor.nombre, "ini": ini, "fin": fin, "fotograma": idx, "fps": round(fps_m, 2),
                "segundos": round(ahora - t0, 1), "eta_s": round((fin - idx) / fps_m)})
    qout.put(None)
    he.join()
    rc = dec.wait()
    seg = time.time() - t0
    flog.write(f"# leídos {estado['leidos']}/{n}, escritos {estado['escritos']}, rc decodificador {rc}, {seg:.1f} s\n")
    flog.close()
    if estado["error"]:
        raise ErrorKaleidos(f"máscara: {estado['error']} (ver {log})")
    if estado["leidos"] != n:
        raise ErrorKaleidos(f"máscara: se esperaban {n} fotogramas y se leyeron {estado['leidos']} (ver {log})")
    res = {"motor": motor.nombre, "ini": ini, "fin": fin, "fotogramas": n, "segundos": round(seg, 1),
           "fps": round(n / seg, 2), "origen": origen, "lote": lote}
    if medir:
        (dir_ / "medida.mp4").unlink(missing_ok=True)
        info(f"medida: {n} fotogramas en {seg:.1f} s → {res['fps']} fps ({motor.nombre}, lote {lote})")
        return res
    # validar partes nuevas y registrar (las que se solapan con el tramo rehecho se sustituyen)
    for p in nuevas:
        real = contar_fotogramas(dir_ / p["archivo"])
        esperado = p["limite"] - p["ini"]
        if real != p["n"] or real != esperado:
            raise ErrorKaleidos(f"parte {p['archivo']}: {real} fotogramas en el archivo, {p['n']} escritos, {esperado} esperados")
    viejas = [p for p in partes if p["ini"] + p["n"] <= ini or p["ini"] >= fin]
    for p in partes:
        if p not in viejas and not any(q["archivo"] == p["archivo"] for q in nuevas):
            (dir_ / p["archivo"]).unlink(missing_ok=True)
    _guardar_partes(proy, viejas + [{"ini": p["ini"], "n": p["n"], "archivo": p["archivo"]} for p in nuevas])
    info(f"máscara [{ini}, {fin}): {n} fotogramas en {seg:.0f} s ({res['fps']} fps, {motor.nombre})")
    return res


def concatenar_mascara(proy: Proyecto) -> dict | None:
    f = proy.fuente_info()
    N = f["fotogramas"]
    partes = _partes_validas(proy)
    hecho = _siguiente_desde(partes)
    if hecho < N:
        info(f"máscara incompleta: {hecho}/{N} fotogramas contiguos desde el 0 (reanuda con `recortar` o `--desde {hecho}`)")
        return None
    dir_ = _dir_partes(proy)
    orden = sorted(partes, key=lambda p: p["ini"])
    (dir_ / "lista.txt").write_text("".join(f"file '{p['archivo']}'\n" for p in orden))
    salida = proy.work / "mascara.mp4"
    correr([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-f", "concat", "-safe", "0", "-i", dir_ / "lista.txt",
            "-c", "copy", "-movflags", "+faststart", salida], log=proy.logs / "recortar_mascara.log")
    n = contar_fotogramas(salida)
    if n != N:
        raise ErrorKaleidos(f"mascara.mp4 tiene {n} fotogramas y se esperaban {N}")
    info(f"mascara.mp4: {n}/{N} fotogramas, {salida.stat().st_size / 1e6:.0f} MB")
    return {"fotogramas": n, "bytes": salida.stat().st_size}


def _muestra(proy: Proyecto, rgb, a, idx: int, nombre: str) -> None:
    from PIL import Image
    d = proy.work / "recorte" / "muestras"
    d.mkdir(parents=True, exist_ok=True)
    fondo = np.array([7, 22, 49], np.float32) / 255
    im = rgb.float().permute(1, 2, 0).cpu().numpy()
    al = a.float().permute(1, 2, 0).cpu().numpy()
    comp = im * al + fondo * (1 - al)
    tag = nombre.split()[0].lower() + ("-" + nombre.split()[1] if len(nombre.split()) > 1 else "")
    Image.fromarray((comp * 255).clip(0, 255).astype(np.uint8)).save(d / f"{tag}_{idx:06d}_compuesto.jpg", quality=90)
    Image.fromarray((al[..., 0] * 255).clip(0, 255).astype(np.uint8)).save(d / f"{tag}_{idx:06d}_alfa.png")


# ——— plancha ———

def geometria_plancha(proy: Proyecto) -> dict:
    f = proy.fuente_info()
    W, H = f["ancho"], f["alto"]
    fondo = proy.analisis_json("fondo.json")
    p = fondo["ponente"]
    x1, x2, top = p["x1_p1"], p["x2_p99"], p["top_p1"] or 0
    origen = "análisis (silueta frente al fondo, p1–p99)"
    pose_p = proy.work / "pose.json"
    if pose_p.exists():
        pose = leer_json(pose_p)
        xs = []
        for clave in ("muneca_izq", "muneca_der", "indice_izq", "indice_der", "hombro_izq", "hombro_der"):
            pts = np.array([q for q in pose["puntos"][clave] if q is not None], dtype=np.float32)
            if len(pts):
                xs.append(pts[:, 0])
        if xs:
            xs = np.concatenate(xs)
            x1 = min(x1, int(np.percentile(xs, 0.5)))
            x2 = max(x2, int(np.percentile(xs, 99.5)))
            origen = "análisis + pose (muñecas, índices y hombros, p0,5–p99,5)"
    margen = round(0.05 * W)
    xa = max(0, x1 - margen)
    xb = min(W, x2 + margen)
    ya = max(0, int(top) - round(0.075 * H))
    esc = ESCALA_PLANCHA
    # región de la fuente con ancho múltiplo de 64 y alto múltiplo de 8: la plancha (×0,75) queda con
    # dimensiones enteras y pares (1920×1620 con 2560×2160, como en el §7.2 del método)
    ancho = min(W - W % 64, int(math.ceil((xb - xa) / 64) * 64))
    alto = min(H, int(math.ceil((H - ya) / 8) * 8))
    xa = max(0, min((xa + xb) // 2 - ancho // 2, W - ancho))
    xa -= xa % 2
    ya = H - alto
    pw, ph = round(ancho * esc), round(alto * esc)
    return {"x": xa, "y": ya, "ancho": ancho, "alto": alto, "escala": esc, "plancha_ancho": pw, "plancha_alto": ph,
            "mascara": "fuente", "curva": "metodo",
            "origen": origen, "fuente": [W, H]}


def plancha(proy: Proyecto, desde: int | None = None, hasta: int | None = None) -> dict:
    import torch
    import torch.nn.functional as F

    f = proy.fuente_info()
    fps, N = f["fps"], f["fotogramas"]
    geo = geometria_plancha(proy)
    escribir_json(proy.work / "plancha.json", geo)
    mascara_p = proy.work / "mascara.mp4"
    partes = _partes_validas(proy)
    ini = desde or 0
    fin = min(N, hasta or N)
    completa = ini == 0 and fin == N
    if not mascara_p.exists():
        if completa:
            raise ErrorKaleidos("falta work/mascara.mp4 completa (usa --desde/--hasta para una plancha parcial)")
        cubierto = _siguiente_desde(partes)
        if fin > cubierto:
            raise ErrorKaleidos(f"la máscara solo cubre [0, {cubierto})")
        # máscara parcial: concatena las partes disponibles en un archivo temporal
        dir_ = _dir_partes(proy)
        orden = sorted(partes, key=lambda p: p["ini"])
        (dir_ / "lista_parcial.txt").write_text("".join(f"file '{p['archivo']}'\n" for p in orden))
        mascara_p = proy.work / "recorte" / "mascara_parcial.mp4"
        correr([ffmpeg_bin(), "-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", dir_ / "lista_parcial.txt",
                "-c", "copy", mascara_p], log=proy.logs / "recortar_plancha.log")
    n = fin - ini
    SW, SH = proy.cfg["salida"]["ancho"], proy.cfg["salida"]["alto"]
    PW, PH = geo["plancha_ancho"], geo["plancha_alto"]
    k = SW / f["ancho"]                                          # fuente → 1080p de la máscara
    mx, my, mw, mh = geo["x"] * k, geo["y"] * k, geo["ancho"] * k, geo["alto"] * k
    recorte = f"crop={geo['ancho']}:{geo['alto']}:{geo['x']}:{geo['y']},"
    dec_fg = tuberia.decodificador_sw(proy.bruto, ini, n, fps, PW, PH, recorte=recorte, hilos=4)
    dec_m = ["ffmpeg", "-hide_banner", "-nostats", "-hwaccel", "videotoolbox", "-ss",
             f"{max(0.0, (ini - 0.25) / fps):.4f}", "-i", str(mascara_p), "-an", "-frames:v", str(n),
             "-f", "rawvideo", "-pix_fmt", "nv12", "-"]
    salida = proy.work / ("plancha.mp4" if completa else f"plancha_{ini}_{fin}.mp4")
    enc = tuberia.codificador_vt(salida, PW, PH, fps, bitrate="8M", gop=round(2 * fps), extra=["-movflags", "+faststart"])
    log = proy.logs / "recortar_plancha.log"
    dev = torch.device("mps")
    p = color.parametros(proy.analisis_json("recomendaciones.json"))
    p = {**p, "unsharp": 0.0}

    def nucleo(fg, m):
        rgb = color.grado_rgb(_nv12_a_rgb(fg, PW, PH), p, torch)
        B = m.shape[0]
        y = m[:, : SW * SH].view(B, 1, SH, SW).half()
        a = ((y - 16) / 219 * 255)
        a = ((a * 0.93 - 128) * 1.35 + 128).clamp(0, 255) / 255     # contraste de la máscara (§7.2)
        y0, x0 = int(round(my)), int(round(mx))
        a = a[:, :, y0:y0 + int(round(mh)), x0:x0 + int(round(mw))]
        a = F.interpolate(a, size=(PH, PW), mode="bicubic", align_corners=False).clamp(0, 1)
        return _rgb_a_nv12(rgb * a, PW, PH)

    nucleo_c = torch.compile(nucleo)
    tam_fg, tam_m = PW * PH * 3 // 2, SW * SH * 3 // 2
    fg_t = tuberia.Tramo("plancha", dec_fg, enc, tam_fg, n, log)
    m_t = tuberia.Tramo("máscara", dec_m, None, tam_m, n, log)
    fg_t.arrancar()
    m_t.arrancar()
    t0 = time.time()
    ultimo = t0
    hechos = 0
    lote = 4
    while hechos < n:
        bf, bm = [], []
        while len(bf) < lote:
            a_, b_ = fg_t.qin.get(), m_t.qin.get()
            if a_ is None or b_ is None:
                break
            bf.append(a_)
            bm.append(b_)
        if not bf:
            break
        kk = len(bf)
        pad = lote - kk
        xf = torch.from_numpy(np.frombuffer(b"".join(bf + [bf[-1]] * pad), np.uint8).reshape(lote, -1).copy()).to(dev)
        xm = torch.from_numpy(np.frombuffer(b"".join(bm + [bm[-1]] * pad), np.uint8).reshape(lote, -1).copy()).to(dev)
        out = nucleo_c(xf, xm)[:kk].cpu().numpy()
        for i in range(kk):
            fg_t.qout.put(out[i].tobytes())
        hechos += kk
        if kk < lote:
            break
        if time.time() - ultimo > 30:
            ultimo = time.time()
            v = hechos / (ultimo - t0)
            info(f"plancha {hechos}/{n} · {v:.1f} fps · quedan {(n - hechos) / v / 60:.1f} min")
    fg_t.cerrar()
    m_t.qout.put(None)
    m_t.cerrar()
    seg = time.time() - t0
    nf = contar_fotogramas(salida)
    if nf != n:
        raise ErrorKaleidos(f"{salida.name} tiene {nf} fotogramas y se esperaban {n}")
    info(f"{salida.name}: {nf} fotogramas {PW}×{PH} en {seg:.0f} s ({n / seg:.1f} fps), {salida.stat().st_size / 1e6:.0f} MB")
    return {"salida": salida.name, "fotogramas": nf, "segundos": round(seg, 1), "fps": round(n / seg, 1), **geo}


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    if not proy.cfg.get("ponente", {}).get("recorte", False):
        info("proyecto sin recorte (ponente.recorte = false): no hay nada que hacer")
        return 0
    etiqueta = "recortar" + (" (medida)" if args.medir else "") + (f" ({args.solo})" if args.solo else "")
    with cronometro(proy, etiqueta) as extra:
        if args.solo != "plancha":
            motor = (MotorVision(args.calidad) if args.motor == "vision" else
                     MotorRVM(args.modelo, fp16=not args.fp32, downsample=args.downsample))
            r = mascara(proy, motor, args.lote, args.desde, args.hasta, medir=args.medir, muestras=args.muestras)
            extra.update({k: r.get(k) for k in ("motor", "fotogramas", "fps", "ini", "fin")})
            if args.medir:
                return 0
            c = concatenar_mascara(proy)
            extra["mascara_completa"] = c is not None
            if c is None and args.solo != "mascara":
                info("la plancha se genera cuando la máscara esté completa (o con --solo plancha --desde/--hasta)")
                return 0
        if args.solo != "mascara":
            pl = plancha(proy, args.desde if args.solo == "plancha" else None,
                         args.hasta if args.solo == "plancha" else None)
            extra["plancha"] = {k: pl[k] for k in ("salida", "fotogramas", "fps", "x", "y", "ancho", "alto", "escala")}
    return 0
