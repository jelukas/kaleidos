"""`kaleidos pose`: MediaPipe Tasks PoseLandmarker (full) a baja resolución → work/pose.json y work/gestos.json.

- Entrada: el mezzanine (o el bruto) decodificado por VideoToolbox y escalado a 960×540 en la GPU (scale_vt),
  RGB por tubería; varios procesos en paralelo, cada uno con su tramo y su detector en modo VIDEO.
- Se guardan nariz, hombros, muñecas e índices en PÍXELES DE LA FUENTE, con su visibilidad. «izq»/«der» son
  los lados de la persona (convenio de MediaPipe): su muñeca izquierda aparece a la derecha de la imagen.
- Huecos (visibilidad < 0,5 o sin detección) interpolados linealmente hasta 2 s; suavizado Savitzky-Golay
  (ventana 9, orden 2). Con `--paso N` se procesa 1 de cada N fotogramas y se interpola al resto.
- Gestos candidatos (método §6): las dos muñecas visibles (> 0,6), por encima de hombros + 560 px (en 4K),
  separación horizontal 620–1500 px (en 4K) y al menos 16 fotogramas seguidos. El filtrado final (cortes,
  planos cortos, máximo 12 y 45 s de separación) lo hace `linea`.
"""

from __future__ import annotations

import multiprocessing as mp_
import subprocess
import time
from pathlib import Path

import numpy as np

from .comun import ErrorKaleidos, Proyecto, cronometro, escribir_json, info, leer_json

PUNTOS = {"nariz": 0, "hombro_izq": 11, "hombro_der": 12, "muneca_izq": 15, "muneca_der": 16,
          "indice_izq": 19, "indice_der": 20}
MANOS = ("mano_a", "mano_b")


def _trabajador(args) -> str:
    (entrada, hw, ini, n, fps, paso, ancho, alto, modelo, salida_npy, log, manos_modelo) = args
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    opciones = vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(modelo)), running_mode=vision.RunningMode.VIDEO,
        num_poses=1, min_pose_detection_confidence=0.5, min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5)
    det = vision.PoseLandmarker.create_from_options(opciones)
    manos = None
    if manos_modelo:
        manos = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(manos_modelo)), running_mode=vision.RunningMode.VIDEO,
            num_hands=2))
    sel = f"select='not(mod(n\\,{paso}))'," if paso > 1 else ""
    dec = (["-hwaccel", "videotoolbox", "-hwaccel_output_format", "videotoolbox_vld"] if hw else [])
    vf = (f"scale_vt=w={ancho}:h={alto},hwdownload,format=nv12,{sel}format=rgb24" if hw
          else f"{sel}scale={ancho}:{alto}:flags=area,format=rgb24")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", *dec, "-ss", f"{max(0.0, (ini - 0.25) / fps):.4f}", "-i", str(entrada),
           "-an", "-frames:v", str(n), "-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    with open(log, "a") as flog:
        flog.write(f"\n$ {' '.join(cmd)}\n")
        flog.flush()
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=flog, bufsize=1 << 22)
        tam = ancho * alto * 3
        esperados = (n + paso - 1) // paso
        datos = np.full((esperados, len(PUNTOS), 3), np.nan, np.float32)
        dmanos = np.full((esperados, 2, 3), np.nan, np.float32) if manos else None
        k = 0
        while k < esperados:
            b = p.stdout.read(tam)
            if len(b) < tam:
                break
            img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(b, np.uint8).reshape(alto, ancho, 3))
            ts = int(round((ini + k * paso) * 1000 / fps))
            r = det.detect_for_video(img, ts)
            if r.pose_landmarks:
                lm = r.pose_landmarks[0]
                for j, idx in enumerate(PUNTOS.values()):
                    datos[k, j] = (lm[idx].x, lm[idx].y, lm[idx].visibility if lm[idx].visibility is not None else 1.0)
            if manos:
                rm = manos.detect_for_video(img, ts)
                for h, pts in enumerate(rm.hand_landmarks[:2]):
                    dmanos[k, h] = (pts[9].x, pts[9].y, 1.0)   # base del dedo medio ≈ centro de la palma
            k += 1
        p.stdout.close()
        rc = p.wait()
        flog.write(f"# tramo {ini}+{n}: {k}/{esperados} fotogramas procesados, rc {rc}\n")
    if k != esperados:
        raise RuntimeError(f"tramo {ini}: {k}/{esperados} fotogramas (ver {log})")
    np.save(salida_npy, datos)
    if dmanos is not None:
        np.save(str(salida_npy).replace(".npy", "_manos.npy"), dmanos)
    return str(salida_npy)


def _interpolar(v: np.ndarray, valido: np.ndarray, max_hueco: int) -> np.ndarray:
    out = v.copy()
    idx = np.where(valido)[0]
    if len(idx) == 0:
        return out
    todos = np.arange(len(v))
    interp = np.interp(todos, idx, v[idx])
    # distancia al válido más cercano por cada lado
    prev = np.maximum.accumulate(np.where(valido, todos, -10**9))
    nxt = np.minimum.accumulate(np.where(valido, todos, 10**9)[::-1])[::-1]
    hueco = (nxt - prev) - 1
    rellenar = (~valido) & (hueco <= max_hueco) & (prev >= 0) & (nxt < len(v))
    out[rellenar] = interp[rellenar]
    out[~valido & ~rellenar] = np.nan
    return out


def _suavizar(v: np.ndarray, ventana: int = 9, orden: int = 2) -> np.ndarray:
    from scipy.signal import savgol_filter
    out = v.copy()
    ok = ~np.isnan(v)
    # por tramos contiguos válidos
    i = 0
    n = len(v)
    while i < n:
        if not ok[i]:
            i += 1
            continue
        j = i
        while j < n and ok[j]:
            j += 1
        if j - i >= ventana:
            out[i:j] = savgol_filter(v[i:j], ventana, orden)
        i = j
    return out


def gestos(pose: dict, fps: float) -> list[dict]:
    W, H = pose["fuente"]
    k = H / 2160.0
    P = {c: np.array([q if q is not None else [np.nan, np.nan] for q in pose["puntos"][c]], np.float32)
         for c in PUNTOS}
    V = {c: np.array(pose["vis"][c], np.float32) for c in PUNTOS}
    hom_y = np.nanmean(np.stack([P["hombro_izq"][:, 1], P["hombro_der"][:, 1]]), axis=0)
    wl, wr = P["muneca_izq"], P["muneca_der"]
    sep = np.abs(wl[:, 0] - wr[:, 0])
    with np.errstate(invalid="ignore"):
        cond = ((V["muneca_izq"] > 0.6) & (V["muneca_der"] > 0.6) & (wl[:, 1] < hom_y + 560 * k) &
                (wr[:, 1] < hom_y + 560 * k) & (sep >= 620 * k) & (sep <= 1500 * k))
    cond = np.nan_to_num(cond, nan=0).astype(bool)
    res = []
    i, n = 0, len(cond)
    while i < n:
        if not cond[i]:
            i += 1
            continue
        j = i
        while j < n and cond[j]:
            j += 1
        if j - i >= 16:
            pico = i + int(np.nanargmax(sep[i:j]))
            m = sorted([wl[pico].tolist(), wr[pico].tolist()])
            sm = float(np.nanmean(sep[i:j]))
            res.append({"desde": i, "pico": pico, "hasta": j, "desde_s": round(i / fps, 2), "pico_s": round(pico / fps, 2),
                        "hasta_s": round(j / fps, 2), "duracion_s": round((j - i) / fps, 2),
                        "separacion_px": round(sm), "puntuacion": round(sm * (j - i) / fps, 1),
                        "munecas": [[round(v) for v in p] for p in m],
                        "altura_sobre_hombros_px": round(float(hom_y[pico] - min(wl[pico, 1], wr[pico, 1])))})
        i = j
    return res


def ejecutar_pose(proy: Proyecto, paso: int = 1, ancho: int = 960, modelo: str = "full", manos: bool = False,
                  partes: int = 2, desde: float | None = None, duracion: float | None = None) -> dict:
    from . import instalar

    f = proy.fuente_info()
    fps, N, W, H = f["fps"], f["fotogramas"], f["ancho"], f["alto"]
    alto = round(ancho * H / W / 2) * 2
    mezz = proy.work / "mezzanine.mp4"
    entrada, hw = (mezz, True) if mezz.exists() else (proy.bruto, True)
    ruta_modelo = instalar.modelo_pose(modelo)
    ruta_manos = instalar.modelo_manos() if manos else None
    ini0 = round((desde or 0) * fps)
    n_total = min(N - ini0, round(duracion * fps)) if duracion else N - ini0
    tmp = proy.work / "pose_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    por = int(np.ceil(n_total / partes / paso) * paso)
    trabajos = []
    for i in range(partes):
        a = ini0 + i * por
        n = min(por, ini0 + n_total - a)
        if n <= 0:
            continue
        trabajos.append((entrada, hw, a, n, fps, paso, ancho, alto, ruta_modelo, tmp / f"t{i}.npy",
                         proy.logs / f"pose_{i}.log", ruta_manos))
    t0 = time.time()
    info(f"pose: {n_total} fotogramas ({entrada.name}), {len(trabajos)} procesos, paso {paso}, {ancho}×{alto}, modelo {modelo}")
    # ProcessPoolExecutor (no Pool): si un trabajador muere (p. ej. un abort nativo de MediaPipe) lanza
    # BrokenProcessPool en vez de quedarse esperando para siempre.
    from concurrent.futures import ProcessPoolExecutor
    from concurrent.futures.process import BrokenProcessPool
    try:
        with ProcessPoolExecutor(len(trabajos), mp_context=mp_.get_context("spawn")) as ex:
            rutas = list(ex.map(_trabajador, trabajos))
    except BrokenProcessPool as e:
        raise ErrorKaleidos(f"un proceso de pose murió ({e}); revisa work/logs/pose_*.log") from e
    seg = time.time() - t0
    crudo = np.concatenate([np.load(r) for r in rutas])           # [n/paso, 7, 3] normalizado
    # a píxeles de la fuente, válidos con visibilidad ≥ 0,5; luego a todos los fotogramas
    t_proc = np.arange(len(crudo)) * paso
    t_all = np.arange(n_total)
    puntos, vis = {}, {}
    for j, nombre in enumerate(PUNTOS):
        x = crudo[:, j, 0] * W
        y = crudo[:, j, 1] * H
        v = np.nan_to_num(crudo[:, j, 2], nan=0.0)
        ok = (v >= 0.5) & ~np.isnan(x)
        max_h = int(2 * fps / paso)
        xi = _suavizar(_interpolar(x, ok, max_h))
        yi = _suavizar(_interpolar(y, ok, max_h))
        if paso > 1:
            okp = ~np.isnan(xi)
            xa = np.interp(t_all, t_proc[okp], xi[okp]) if okp.any() else np.full(n_total, np.nan)
            ya = np.interp(t_all, t_proc[okp], yi[okp]) if okp.any() else np.full(n_total, np.nan)
            cerca = np.interp(t_all, t_proc, okp.astype(float)) > 0.99
            xa[~cerca] = np.nan
            ya[~cerca] = np.nan
            va = np.interp(t_all, t_proc, v)
        else:
            xa, ya, va = xi, yi, v
        puntos[nombre] = [None if np.isnan(a) else [int(round(a)), int(round(b))] for a, b in zip(xa, ya)]
        vis[nombre] = [round(float(q), 2) for q in va]
    pose = {"version": 1, "fps": fps, "fuente": [W, H], "n": n_total, "desde": ini0, "paso": paso,
            "modelo": f"MediaPipe PoseLandmarker {modelo}", "resolucion_analisis": [ancho, alto],
            "convenio": "izq/der = lados de la persona (MediaPipe); coordenadas en píxeles de la fuente",
            "puntos": puntos, "vis": vis}
    if manos:
        cm = np.concatenate([np.load(str(r).replace(".npy", "_manos.npy")) for r in rutas])
        pose["manos"] = [[None if np.isnan(c[h, 0]) else [int(c[h, 0] * W), int(c[h, 1] * H)] for h in range(2)]
                         for c in cm]
    completo = desde is None and duracion is None
    nombre = "pose.json" if completo else "pose_prueba.json"
    escribir_json(proy.work / nombre, pose, compacto=True)
    g = gestos(pose, fps)
    for x in g:  # a fotogramas absolutos de la fuente
        for c in ("desde", "pico", "hasta"):
            x[c] += ini0
        for c in ("desde_s", "pico_s", "hasta_s"):
            x[c] = round(x[c] + ini0 / fps, 2)
    escribir_json(proy.work / ("gestos.json" if completo else "gestos_prueba.json"),
                  {"reglas": "muñecas vis > 0,6; y < hombros + 560·k; separación 620·k–1500·k; ≥ 16 fotogramas (k = alto/2160)",
                   "candidatos": g})
    for r in rutas:
        Path(r).unlink(missing_ok=True)
    detect = float(np.mean(~np.isnan(crudo[:, 0, 0])))
    info(f"pose: {len(crudo)} fotogramas analizados en {seg:.0f} s ({len(crudo) / seg:.1f} fps de análisis, "
         f"{n_total / seg:.1f} fps de vídeo); detección {detect * 100:.1f} %; {len(g)} gestos candidatos")
    return {"fotogramas": n_total, "analizados": len(crudo), "segundos_analisis": round(seg, 1),
            "fps_analisis": round(len(crudo) / seg, 1), "deteccion_pct": round(detect * 100, 1), "gestos": len(g)}


SIN_RED = "(version 1)(allow default)(deny network-outbound (remote ip))"


def _sin_red(args) -> int | None:
    """MediaPipe ≥ 0.10.3x incluye un cliente de telemetría de uso (clearcut) que intenta enviar datos a Google.
    Se descargan antes los modelos y se vuelve a lanzar el comando dentro de `sandbox-exec` sin red IP."""
    import os
    import shutil
    import sys
    if os.environ.get("KALEIDOS_SIN_RED") == "1" or not shutil.which("sandbox-exec"):
        return None
    from . import instalar
    instalar.modelo_pose(args.modelo)
    if args.manos:
        instalar.modelo_manos()
    env = {**os.environ, "KALEIDOS_SIN_RED": "1"}
    argv = ["pose", args.slug, "--paso", str(args.paso), "--ancho", str(args.ancho), "--modelo", args.modelo,
            "--partes", str(args.partes)]
    argv += ["--manos"] * bool(args.manos) + ["--solo-gestos"] * bool(args.solo_gestos)
    if args.desde is not None:
        argv += ["--desde", str(args.desde)]
    if args.duracion is not None:
        argv += ["--duracion", str(args.duracion)]
    cmd = ["sandbox-exec", "-p", SIN_RED, sys.executable, "-m", "kaleidos_tools.cli", *argv]
    info("pose: se ejecuta sin acceso a la red (sandbox-exec) para bloquear la telemetría de MediaPipe")
    return subprocess.run(cmd, env=env).returncode


def ejecutar(args) -> int:
    rc = _sin_red(args)
    if rc is not None:
        return rc
    proy = Proyecto(args.slug)
    if args.solo_gestos:
        pose = leer_json(proy.work / "pose.json")
        g = gestos(pose, pose["fps"])
        escribir_json(proy.work / "gestos.json", {"candidatos": g})
        info(f"{len(g)} gestos candidatos")
        return 0
    with cronometro(proy, "pose" if args.desde is None else "pose (tramo)") as extra:
        extra.update(ejecutar_pose(proy, paso=args.paso, ancho=args.ancho, modelo=args.modelo, manos=args.manos,
                                   partes=args.partes, desde=args.desde, duracion=args.duracion))
    return 0
