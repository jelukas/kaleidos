"""`kaleidos analizar`: todo lo que hay que saber del bruto antes de editar (→ work/analisis/).

Una única decodificación del vídeo (VideoToolbox + scale_vt) alimenta cuatro ramas de filtros:
  a) 1 fotograma cada 10 s a 384×216 → hojas de contactos (con marcas de tiempo dibujadas con PIL:
     este ffmpeg no trae drawtext);
  b) 1 fps a 240×135 → fondo (mediana temporal), ponente (diferencia con el fondo) y estadísticas;
  c) detección de cortes de escena (select=gt(scene,0.08));
  d) energía de movimiento por fotograma (diferencia entre fotogramas a 160×90) y luma media.
El audio se analiza aparte: canales (el bruto puede traer la voz en un solo canal), sonoridad EBU R128,
silencios y RMS cada 100 ms del canal de voz (lo usan transcribir y master).
"""

from __future__ import annotations

import concurrent.futures as cf
import re
import statistics as st
import time
from pathlib import Path

import numpy as np

from .comun import (
    Proyecto, correr, cronometro, escribir_json, ffmpeg_bin, ffprobe, hms, info, leer_json, salida_de,
)

HOJA_W, HOJA_H, HOJA_COLS, HOJA_FILAS, HOJA_CADA = 384, 216, 6, 6, 10.0
FONDO_W, FONDO_H = 240, 135
ESCENA_UMBRAL = 0.08


# ——— lectura de ficheros de metadata=print ———

def _leer_metadata(ruta: Path, clave: str) -> tuple[np.ndarray, np.ndarray]:
    ts, vs = [], []
    t = None
    pref = clave + "="
    with open(ruta, encoding="utf-8", errors="replace") as f:
        for linea in f:
            if linea.startswith("frame:"):
                m = re.search(r"pts_time:([-\d.]+)", linea)
                t = float(m.group(1)) if m else None
            elif linea.startswith(pref) and t is not None:
                v = linea[len(pref):].strip()
                ts.append(t)
                vs.append(-120.0 if "inf" in v else float(v))
    return np.array(ts), np.array(vs)


# ——— pasada de vídeo ———

def _pasada_video(proy: Proyecto, fuente: dict, forzar: bool) -> dict:
    a = proy.analisis
    tmp = a / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    salidas = [tmp / "hojas.rgb", tmp / "fondo_1fps.rgb", a / "escenas.txt", a / "movimiento.txt", a / "luma.txt"]
    if all(p.exists() and p.stat().st_size > 0 for p in salidas) and not forzar:
        info("pasada de vídeo ya hecha (usa --forzar para repetirla)")
        return leer_json(a / "pasada_video.json")
    # Decodificación por software: con este bruto (fondo liso, 7,8 Mb/s) va a ~700 fps en 4K, frente a
    # ~128 fps del decodificador de VideoToolbox (medido en el M1 Pro).
    fc = (
        f"[0:v]scale=480:270:flags=area,format=yuv420p,split=4[a][b][c][d];"
        f"[a]fps=1/{HOJA_CADA:g}:round=near,scale={HOJA_W}:{HOJA_H}:flags=area,format=rgb24[ha];"
        f"[b]fps=1:round=near,scale={FONDO_W}:{FONDO_H}:flags=area,format=rgb24[fo];"
        f"[c]scdet=threshold={ESCENA_UMBRAL * 100:g},metadata=print:key=lavfi.scd.score:file={a / 'escenas.txt'}[es];"
        f"[d]scale=160:90:flags=area,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file={a / 'luma.txt'},"
        f"format=gray,tblend=all_mode=difference,signalstats,"
        f"metadata=print:key=lavfi.signalstats.YAVG:file={a / 'movimiento.txt'}[mo]"
    )
    cmd = [
        ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", proy.bruto, "-an", "-filter_complex", fc,
        "-map", "[ha]", "-f", "rawvideo", tmp / "hojas.rgb",
        "-map", "[fo]", "-f", "rawvideo", tmp / "fondo_1fps.rgb",
        "-map", "[es]", "-f", "null", "/dev/null",
        "-map", "[mo]", "-f", "null", "/dev/null",
    ]
    t0 = time.time()
    correr(cmd, log=proy.logs / "analizar_video.log")
    seg = time.time() - t0
    res = {"segundos": round(seg, 1), "fps_decodificacion": round(fuente["fotogramas"] / seg, 1)}
    escribir_json(a / "pasada_video.json", res)
    info(f"pasada de vídeo: {seg:.0f} s ({res['fps_decodificacion']} fps de decodificación 4K por software)")
    return res


# ——— pasadas de audio ———

_RE_CANAL = re.compile(r"Channel: (\d+)")


def _astats_canales(txt: str) -> list[dict]:
    canales: list[dict] = []
    cur = None
    for linea in txt.splitlines():
        m = _RE_CANAL.search(linea)
        if m:
            cur = {"canal": int(m.group(1))}
            canales.append(cur)
            continue
        if "Overall" in linea:
            cur = None
            continue
        if cur is None:
            continue
        for clave, nombre in (("RMS level dB", "rms_db"), ("Peak level dB", "pico_db"), ("Noise floor dB", "suelo_db"),
                              ("DC offset", "dc")):
            if f"] {clave}:" in linea or linea.strip().startswith(clave + ":"):
                v = linea.split(":")[-1].strip()
                cur[nombre] = -120.0 if "inf" in v else float(v)
    return canales


def _ebur128(txt: str) -> dict:
    """Extrae el último bloque Summary de ebur128."""
    i = txt.rfind("Summary:")
    bloque = txt[i:] if i >= 0 else ""
    res = {}
    for clave, patron in (("I_lufs", r"I:\s+([-\d.]+) LUFS"), ("LRA_lu", r"LRA:\s+([-\d.]+) LU"),
                          ("umbral_lufs", r"Threshold:\s+([-\d.]+) LUFS"), ("pico_dbtp", r"Peak:\s+([-\d.]+) dBFS")):
        m = re.search(patron, bloque)
        if m:
            res[clave] = float(m.group(1))
    return res


def _pasada_audio(proy: Proyecto, fuente: dict, forzar: bool) -> dict:
    a = proy.analisis
    destino = a / "audio.json"
    if destino.exists() and (a / "rms100ms.json").exists() and not forzar:
        info("pasada de audio ya hecha")
        return leer_json(destino)
    log = proy.logs / "analizar_audio.log"
    fa = fuente["audio"]
    if fa is None:
        res = {"hay_audio": False}
        escribir_json(destino, res)
        return res
    t0 = time.time()
    # 1) estadísticas por canal y sonoridad de la mezcla original
    txt = salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", proy.bruto, "-vn", "-af",
                     "astats=measure_overall=none,ebur128=peak=true:framelog=quiet", "-f", "null", "-"], log=log)
    canales = _astats_canales(txt)
    original = _ebur128(txt)
    # 2) canal de voz: si uno de los dos está en silencio digital (o 25 dB por debajo), se usa el otro
    canal_voz = "mezcla"
    if len(canales) >= 2:
        l, r = canales[0].get("rms_db", -120), canales[1].get("rms_db", -120)
        if r < -90 or l - r > 25:
            canal_voz = "izq"
        elif l < -90 or r - l > 25:
            canal_voz = "der"
    elif len(canales) == 1:
        canal_voz = "izq"
    pan = {"izq": "pan=mono|c0=c0", "der": "pan=mono|c0=c1"}.get(canal_voz, "pan=mono|c0=0.5*c0+0.5*c1")
    sr = fa["frecuencia"] or 48000
    n100 = sr // 10
    fc = (f"[0:a]{pan},asplit=3[x][y][z];"
          f"[x]ebur128=peak=true:framelog=quiet[xo];"
          f"[y]silencedetect=noise=-35dB:d=0.4[yo];"
          f"[z]asetnsamples=n={n100}:p=0,astats=metadata=1:reset=1:measure_perchannel=none,"
          f"ametadata=print:key=lavfi.astats.Overall.RMS_level:file={a / 'rms100ms.txt'}[zo]")
    txt2 = salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", proy.bruto, "-vn", "-filter_complex", fc,
                      "-map", "[xo]", "-f", "null", "-", "-map", "[yo]", "-f", "null", "-",
                      "-map", "[zo]", "-f", "null", "-"], log=log)
    voz = _ebur128(txt2)
    silencios = []
    ini = None
    for linea in txt2.splitlines():
        m = re.search(r"silence_start: ([-\d.]+)", linea)
        if m:
            ini = float(m.group(1))
        m = re.search(r"silence_end: ([-\d.]+) \| silence_duration: ([-\d.]+)", linea)
        if m and ini is not None:
            silencios.append([round(max(0.0, ini), 3), round(float(m.group(1)), 3)])
            ini = None
    if ini is not None:
        silencios.append([round(ini, 3), round(fuente["duracion"], 3)])
    ts, rms = _leer_metadata(a / "rms100ms.txt", "lavfi.astats.Overall.RMS_level")
    rms = np.round(rms, 1)
    silencios_35 = silencios
    escribir_json(a / "rms100ms.json", {"paso": 0.1, "rms_db": rms.tolist()}, compacto=True)
    (a / "rms100ms.txt").unlink(missing_ok=True)
    validos = rms[rms > -119]
    suelo = float(np.percentile(validos, 5)) if len(validos) else -120.0
    voz_nivel = float(np.percentile(validos, 90)) if len(validos) else -120.0
    umbral = round(max(suelo + 10, min(-40.0, voz_nivel - 25)), 1)
    # Silencios con umbral relativo a la voz (grabaciones flojas: -35 dB fijo marcaría la mitad como silencio)
    silencios = []
    bajo = np.concatenate([rms < umbral, [False]])
    i0 = None
    for i, b in enumerate(bajo):
        if b and i0 is None:
            i0 = i
        elif not b and i0 is not None:
            if (i - i0) * 0.1 >= 0.4:
                silencios.append([round(i0 * 0.1, 2), round(min(i * 0.1, fuente["duracion"]), 2)])
            i0 = None
    res = {
        "hay_audio": True, "codec": fa["codec"], "frecuencia": sr, "canales": fa["canales"],
        "por_canal": canales, "canal_voz": canal_voz, "original": original, "voz": voz,
        "suelo_ruido_db": round(suelo, 1), "voz_p90_db": round(voz_nivel, 1),
        "umbral_voz_db": umbral,
        "silencios": silencios,
        "silencios_silencedetect_35db": len(silencios_35),
        "silencio_total_s": round(sum(b - a_ for a_, b in silencios), 1),
        "segundos": round(time.time() - t0, 1),
    }
    escribir_json(destino, res)
    info(f"audio: canal de voz «{canal_voz}», {voz.get('I_lufs')} LUFS, {len(silencios)} silencios "
         f"({res['silencio_total_s']} s), {res['segundos']} s")
    return res


# ——— hojas de contactos ———

def _hojas(proy: Proyecto, fuente: dict) -> list[str]:
    from PIL import Image, ImageDraw, ImageFont

    raw = proy.analisis / "tmp" / "hojas.rgb"
    tam = HOJA_W * HOJA_H * 3
    n = raw.stat().st_size // tam
    datos = np.memmap(raw, dtype=np.uint8, mode="r", shape=(n, HOJA_H, HOJA_W, 3))
    try:
        fuente_txt = ImageFont.load_default(size=18)
    except TypeError:  # Pillow antiguo
        fuente_txt = ImageFont.load_default()
    por_hoja = HOJA_COLS * HOJA_FILAS
    dir_ = proy.analisis / "contactos"
    dir_.mkdir(exist_ok=True)
    rutas = []
    for h in range((n + por_hoja - 1) // por_hoja):
        img = Image.new("RGB", (HOJA_COLS * HOJA_W, HOJA_FILAS * HOJA_H), (20, 20, 20))
        dib = ImageDraw.Draw(img)
        for k in range(por_hoja):
            i = h * por_hoja + k
            if i >= n:
                break
            x, y = (k % HOJA_COLS) * HOJA_W, (k // HOJA_COLS) * HOJA_H
            img.paste(Image.fromarray(np.asarray(datos[i])), (x, y))
            etiqueta = f"{hms(i * HOJA_CADA)} · {i * HOJA_CADA:.0f}s"
            dib.rectangle([x + 4, y + 4, x + 12 + 10 * len(etiqueta), y + 28], fill=(0, 0, 0))
            dib.text((x + 8, y + 6), etiqueta, fill=(255, 255, 0), font=fuente_txt)
        ruta = dir_ / f"hoja_{h + 1:02d}.jpg"
        img.save(ruta, quality=82)
        rutas.append(str(ruta.relative_to(proy.dir)))
    return rutas


# ——— fondo y ponente ———

def _fondo(proy: Proyecto, fuente: dict) -> dict:
    from scipy import ndimage

    raw = proy.analisis / "tmp" / "fondo_1fps.rgb"
    tam = FONDO_W * FONDO_H * 3
    n = raw.stat().st_size // tam
    fr = np.fromfile(raw, dtype=np.uint8, count=n * tam).reshape(n, FONDO_H, FONDO_W, 3)
    k = fuente["ancho"] / FONDO_W
    # Fondo, en dos etapas. 1) Mediana temporal: si la ponente casi no se mueve, la mediana la contiene.
    sub = fr[:: max(1, n // 400)]
    fondo0 = np.median(sub, axis=0).astype(np.float32)
    lum0 = fondo0 @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    oscuro = lum0 < 150  # pelo, falda… de la ponente «pegada» en la mediana
    vacios = np.zeros(n, bool)
    if oscuro.sum() > 50:
        lum = fr[:, oscuro].astype(np.float32) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
        vacios = ((lum - lum0[oscuro]) > 60).mean(axis=1) > 0.9
    # 2) Si hay fotogramas sin nadie (≥ 5 s), su mediana es el fondo limpio; si no, el percentil 90 temporal
    #    (el fondo liso claro es lo más luminoso de cada píxel en cuanto la ponente se aparta).
    if vacios.sum() >= 5:
        fondo = np.median(fr[vacios], axis=0).astype(np.float32)
        origen_fondo = f"mediana de {int(vacios.sum())} muestras sin ponente"
    else:
        fondo = np.percentile(sub, 90, axis=0).astype(np.float32)
        origen_fondo = "percentil 90 temporal (no hay fotogramas vacíos)"
    dif = np.abs(fr.astype(np.int16) - fondo.astype(np.int16)).max(axis=3)
    mascaras = dif > 28
    # limpieza morfológica por fotograma (quita motas de compresión)
    estructura = np.ones((1, 3, 3), bool)
    mascaras = ndimage.binary_opening(mascaras, structure=estructura)
    frecuencia = mascaras.mean(axis=0)
    zona_fondo = frecuencia < 0.02
    if zona_fondo.mean() < 0.05:  # plano cambiante: usa los bordes
        zona_fondo = np.zeros_like(zona_fondo)
        zona_fondo[:, :12] = zona_fondo[:, -12:] = True
    rgb = fondo[zona_fondo]
    Y = 0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]
    Cb = 128 + (rgb[:, 2] - Y) / 1.8556
    Cr = 128 + (rgb[:, 0] - Y) / 1.5748
    lum_fondo = 0.2126 * fondo[..., 0] + 0.7152 * fondo[..., 1] + 0.0722 * fondo[..., 2]
    # viñeteado: esquinas superiores frente a la franja superior central (zonas de fondo)
    def media_zona(y0, y1, x0, x1):
        z = zona_fondo[y0:y1, x0:x1]
        return float(lum_fondo[y0:y1, x0:x1][z].mean()) if z.any() else float("nan")
    esquinas = np.nanmean([media_zona(0, 20, 0, 30), media_zona(0, 20, FONDO_W - 30, FONDO_W)])
    centro_sup = media_zona(0, 20, FONDO_W // 2 - 30, FONDO_W // 2 + 30)
    # ruido/deriva temporal del fondo (a 240×135, así que es sobre todo parpadeo y deriva de luz)
    fr_fondo = fr[:, zona_fondo].astype(np.float32).mean(axis=2)
    deriva = float(np.median(np.abs(np.diff(fr_fondo, axis=0)))) if n > 1 else 0.0
    lum_t = fr_fondo.mean(axis=1)

    # ponente por fotograma
    area = mascaras.mean(axis=(1, 2))
    presente = area > 0.005
    cajas = []
    for i in range(n):
        if not presente[i]:
            cajas.append(None)
            continue
        cols = np.where(mascaras[i].sum(axis=0) >= 2)[0]
        filas = np.where(mascaras[i].sum(axis=1) >= 2)[0]
        if len(cols) == 0 or len(filas) == 0:
            cajas.append(None)
            presente[i] = False
            continue
        cajas.append([int(cols[0] * k), int((cols[-1] + 1) * k), int(filas[0] * k), int((filas[-1] + 1) * k)])
    validas = [c for c in cajas if c]
    huecos, ini = [], None
    for i, p in enumerate(presente.tolist() + [True]):
        if not p and ini is None:
            ini = i
        if p and ini is not None:
            if i - ini >= 2:
                huecos.append([ini, i])
            ini = None
    # contraste ponente/fondo: diferencia típica dentro de la silueta
    contraste = float(np.median(dif[mascaras])) if mascaras.any() else 0.0
    # persona en contacto con el borde inferior (plano medio) → la plancha debe llegar abajo
    toca_abajo = float(np.mean([c[3] >= fuente["alto"] - 2 * k for c in validas])) if validas else 0.0

    esp_std = float(Y.std())
    apto = bool(esp_std < 12 and (np.percentile(Y, 95) - np.percentile(Y, 5)) < 45 and contraste > 35
                and zona_fondo.mean() > 0.2)
    motivos = []
    motivos.append(f"fondo {'uniforme' if esp_std < 12 else 'con textura'} (desv. espacial de luma {esp_std:.1f})")
    motivos.append(f"contraste ponente/fondo {contraste:.0f} niveles")
    motivos.append(f"zona de fondo {zona_fondo.mean() * 100:.0f} % del cuadro")
    if Y.mean() > 200 and contraste < 60:
        motivos.append("fondo claro: ropa clara puede confundirse (la segmentación por IA lo resuelve mejor que un croma)")

    # guardar imágenes de control
    from PIL import Image
    Image.fromarray(fondo.astype(np.uint8)).resize((FONDO_W * 2, FONDO_H * 2)).save(proy.analisis / "fondo_mediana.png")
    Image.fromarray((frecuencia * 255).clip(0, 255).astype(np.uint8)).resize((FONDO_W * 2, FONDO_H * 2)).save(
        proy.analisis / "ponente_frecuencia.png")

    pct = lambda arr, q: int(np.percentile(arr, q)) if len(arr) else None  # noqa: E731
    x1s = [c[0] for c in validas]
    x2s = [c[1] for c in validas]
    tops = [c[2] for c in validas]
    cx = [((c[0] + c[1]) / 2) for c in validas]
    res = {
        "muestras": n, "paso_s": 1.0, "resolucion_analisis": [FONDO_W, FONDO_H],
        "fondo": {
            "origen": origen_fondo,
            "rgb_medio": [round(float(v), 1) for v in rgb.mean(axis=0)],
            "luma_media": round(float(Y.mean()), 1), "luma_p5": round(float(np.percentile(Y, 5)), 1),
            "luma_p95": round(float(np.percentile(Y, 95)), 1), "desv_espacial": round(esp_std, 2),
            "cb_medio": round(float(Cb.mean()), 1), "cr_medio": round(float(Cr.mean()), 1),
            "recortado_pct": round(float((rgb.max(axis=1) >= 250).mean() * 100), 2),
            "vineteado_niveles": round(float(centro_sup - esquinas), 1) if not np.isnan(esquinas) else None,
            "deriva_temporal": round(deriva, 2),
            "luma_min_t": round(float(lum_t.min()), 1), "luma_max_t": round(float(lum_t.max()), 1),
            "zona_pct": round(float(zona_fondo.mean() * 100), 1),
        },
        "apto_recorte": apto, "motivos": motivos,
        "ponente": {
            "presente_pct": round(float(presente.mean() * 100), 1),
            "contraste": round(contraste, 1),
            "x1_p1": pct(x1s, 1), "x2_p99": pct(x2s, 99), "top_p1": pct(tops, 1),
            "cx_mediana": pct(cx, 50), "cx_p5": pct(cx, 5), "cx_p95": pct(cx, 95),
            "ancho_mediano": pct([b - a_ for a_, b in zip(x1s, x2s)], 50),
            "toca_borde_inferior_pct": round(toca_abajo * 100, 1),
            "sin_ponente": [[a_, b] for a_, b in huecos],
            "cajas_1fps": cajas,
        },
    }
    return res


def _nitidez(proy: Proyecto, fuente: dict, caja: list | None) -> dict:
    """Nitidez de la ponente a 1080p (lanczos desde el bruto) en tres instantes."""
    from PIL import Image

    dir_ = proy.analisis / "fotogramas"
    dir_.mkdir(exist_ok=True)
    medidas, rutas = [], []
    for frac in (0.1, 0.5, 0.9):
        t = fuente["duracion"] * frac
        ruta = dir_ / f"f_{int(t):05d}.png"
        if not ruta.exists():
            correr([ffmpeg_bin(), "-hide_banner", "-y", "-ss", f"{t:.2f}", "-i", proy.bruto, "-frames:v", "1",
                      "-vf", "scale=1920:1080:flags=lanczos", ruta], log=proy.logs / "analizar_video.log")
        rutas.append(str(ruta.relative_to(proy.dir)))
        g = np.asarray(Image.open(ruta).convert("L"), dtype=np.float32)
        if caja:
            s = 1920 / fuente["ancho"]
            x1, x2, y1 = int(caja[0] * s), int(caja[1] * s), int(caja[2] * s)
            g = g[y1:, x1:x2]
        lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
        medidas.append(float(lap.mean()))
    return {"laplaciano_medio": round(st.mean(medidas), 2), "fotogramas": rutas}


def _recomendaciones(fondo: dict, audio: dict, nitidez: dict) -> dict:
    f = fondo["fondo"]
    r, g, b = f["rgb_medio"]
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    # balance de blancos: el fondo liso debe quedar neutro (ganancias por canal, conservando luma)
    ganancias = [round(float(np.clip(Y / c, 0.9, 1.1)), 4) if c > 0 else 1.0 for c in (r, g, b)]
    # exposición: fondo claro hacia ~94 % sin quemarlo; nunca más de +12 %
    exposicion = 1.0
    if Y > 150 and f["recortado_pct"] < 5:
        exposicion = round(float(np.clip(240.0 / Y, 0.95, 1.12)), 4)
    lap = nitidez["laplaciano_medio"]
    unsharp = 0.7 if lap < 2.5 else (0.55 if lap < 5 else 0.35)
    return {
        "video": {
            "ganancias_rgb": ganancias, "exposicion": exposicion,
            "saturacion": 0.94,                  # compensa la curva S
            "curva": "0/0 0.07/0.058 0.5/0.5 0.88/0.905 1/1",
            "desaturar_azul_magenta": 0.3 if (f["cb_medio"] > 129.5 or f["cr_medio"] > 129.5) else 0.0,
            "unsharp": unsharp,
            "reduccion_ruido": bool(f["deriva_temporal"] > 1.5),
        },
        "audio": {"canal_voz": audio.get("canal_voz", "mezcla"),
                  "I_voz_lufs": audio.get("voz", {}).get("I_lufs"),
                  "suelo_ruido_db": audio.get("suelo_ruido_db")},
    }


def _resumen_md(proy: Proyecto, fuente: dict, meta: dict, pasada: dict, audio: dict, escenas: list, mov: dict,
                fondo: dict, nitidez: dict, recom: dict, hojas: list) -> str:
    f, p = fondo["fondo"], fondo["ponente"]
    v = recom["video"]
    L = [f"# Análisis de `{proy.cfg['bruto']}`", "",
         f"Generado por `kaleidos analizar {proy.slug}` el {time.strftime('%Y-%m-%d %H:%M')}.", "",
         "## Metadatos", "",
         "| Campo | Valor |", "|---|---|",
         f"| Resolución | {fuente['ancho']}×{fuente['alto']} ({fuente['pix_fmt']}) |",
         f"| Fotogramas / fps | {fuente['fotogramas']} a {fuente['fps']:g} fps |",
         f"| Duración | {fuente['duracion']:.2f} s ({hms(fuente['duracion'])}) |",
         f"| Vídeo | {fuente['codec']}, {int(meta['format'].get('bit_rate', 0)) / 1e6:.1f} Mb/s en total |",
         f"| Color | {', '.join(f'{k}={v_}' for k, v_ in fuente['color'].items() if v_) or 'sin etiquetas (se asume BT.709)'} |",
         f"| Audio | {audio.get('codec')} {audio.get('frecuencia')} Hz, {audio.get('canales')} canales |",
         f"| Decodificación | {pasada.get('fps_decodificacion')} fps (software, {pasada.get('segundos')} s) |",
         "", "## Imagen", "",
         f"- **Cortes de escena** (umbral {ESCENA_UMBRAL}): {len(escenas)}"
         + (f" — primeros: {', '.join(f'{e['t']:.1f} s' for e in escenas[:10])}" if escenas else " — plano único."),
         f"- **Movimiento** (diferencia media entre fotogramas a 160×90): mediana {mov['mediana']:.2f}, "
         f"p95 {mov['p95']:.2f}, máx. {mov['max']:.1f}. {mov['lectura']}",
         f"- **Luma media**: {mov['luma_min']:.0f}–{mov['luma_max']:.0f} (sin fundidos si el rango es estrecho).",
         f"- **Fondo** ({f.get('origen')}): RGB medio {f['rgb_medio']}, luma {f['luma_media']} (p5 {f['luma_p5']} · p95 {f['luma_p95']}), "
         f"desviación espacial {f['desv_espacial']}, Cb/Cr {f['cb_medio']}/{f['cr_medio']}, "
         f"recortado {f['recortado_pct']} %, viñeteado {f['vineteado_niveles']} niveles, "
         f"deriva temporal {f['deriva_temporal']}.",
         f"- **Apto para recorte**: {'**sí**' if fondo['apto_recorte'] else '**no**'} — {'; '.join(fondo['motivos'])}.",
         f"- **Ponente**: presente en el {p['presente_pct']} % de las muestras; franja x {p['x1_p1']}–{p['x2_p99']} px "
         f"(p1–p99), centro {p['cx_p5']}–{p['cx_p95']} (mediana {p['cx_mediana']}), parte superior ≥ {p['top_p1']} px, "
         f"toca el borde inferior en el {p['toca_borde_inferior_pct']} % de las muestras.",
         f"- **Sin ponente** (≥ 2 s): " + (", ".join(f"{a}–{b} s" for a, b in p["sin_ponente"][:20]) or "nunca") + ".",
         f"- **Nitidez** (laplaciano medio a 1080p en la ponente): {nitidez['laplaciano_medio']}.",
         "", "## Audio", "",
         "| Canal | RMS dB | Pico dB | Suelo dB |", "|---|---|---|---|",
         *[f"| {c['canal']} | {c.get('rms_db')} | {c.get('pico_db')} | {c.get('suelo_db')} |" for c in audio.get("por_canal", [])],
         "",
         f"- **Canal de voz**: `{audio.get('canal_voz')}`.",
         f"- **Sonoridad original** (mezcla): {audio.get('original', {}).get('I_lufs')} LUFS, "
         f"LRA {audio.get('original', {}).get('LRA_lu')} LU, pico {audio.get('original', {}).get('pico_dbtp')} dBFS.",
         f"- **Voz** (canal elegido): {audio.get('voz', {}).get('I_lufs')} LUFS, LRA {audio.get('voz', {}).get('LRA_lu')} LU, "
         f"pico {audio.get('voz', {}).get('pico_dbtp')} dBFS; suelo de ruido (p5 RMS 100 ms) {audio.get('suelo_ruido_db')} dB, "
         f"umbral de voz {audio.get('umbral_voz_db')} dB.",
         f"- **Silencios** (RMS 100 ms < {audio.get('umbral_voz_db')} dB, ≥ 0,4 s): {len(audio.get('silencios', []))}, {audio.get('silencio_total_s')} s en total; "
         f"los más largos: " + ", ".join(f"{a:.1f}–{b:.1f} s" for a, b in sorted(audio.get('silencios', []), key=lambda s: s[0] - s[1])[:8]) + ".",
         "", "## Recomendaciones para `master`", "",
         f"- Balance de blancos (ganancias R G B): {v['ganancias_rgb']}; exposición ×{v['exposicion']}; saturación ×{v['saturacion']}; "
         f"curva `{v['curva']}`; desaturación azul/magenta {v['desaturar_azul_magenta']}.",
         f"- Nitidez: unsharp de luma {v['unsharp']} tras el escalado lanczos. Reducción de ruido: {'sí' if v['reduccion_ruido'] else 'no'}.",
         f"- Audio: voz del canal `{recom['audio']['canal_voz']}`, paso alto, reducción de ruido, compresión y loudnorm a -16 LUFS / -1,5 dBTP.",
         "", "## Archivos", "",
         *[f"- `{h}`" for h in hojas],
         "- `work/analisis/fondo_mediana.png`, `work/analisis/ponente_frecuencia.png`",
         *[f"- `{r}`" for r in nitidez["fotogramas"]],
         "- `audio.json`, `rms100ms.json`, `escenas.json`, `movimiento.json`, `fondo.json`, `recomendaciones.json`",
         ""]
    return "\n".join(L)


def ejecutar_analisis(proy: Proyecto, forzar: bool = False) -> dict:
    a = proy.analisis
    a.mkdir(parents=True, exist_ok=True)
    fuente = proy.fuente_info()
    meta = ffprobe(proy.bruto)
    escribir_json(a / "metadatos.json", meta)
    with cf.ThreadPoolExecutor(2) as ex:
        fv = ex.submit(_pasada_video, proy, fuente, forzar)
        fa = ex.submit(_pasada_audio, proy, fuente, forzar)
        pasada, audio = fv.result(), fa.result()

    ts, sc = _leer_metadata(a / "escenas.txt", "lavfi.scd.score")
    # scdet da la puntuación de cada fotograma (0–100): nos quedamos con los picos por encima del umbral
    escenas = [{"t": round(float(t), 3), "puntuacion": round(float(s) / 100, 3)} for t, s in zip(ts, sc)
               if s >= ESCENA_UMBRAL * 100]
    escribir_json(a / "escenas.json", escenas)
    tm, mv = _leer_metadata(a / "movimiento.txt", "lavfi.signalstats.YAVG")
    tl, lu = _leer_metadata(a / "luma.txt", "lavfi.signalstats.YAVG")
    fps = fuente["fps"]
    por_seg = [float(mv[int(s * fps):int((s + 1) * fps)].mean()) for s in range(int(len(mv) / fps))] if len(mv) else []
    med = float(np.median(mv)) if len(mv) else 0.0
    lectura = ("Movimiento casi nulo: imagen fija o congelada." if med < 0.05 else
               "Plano fijo con movimiento de la persona (vídeo real)." if med < 3 else "Mucho movimiento o cámara en mano.")
    mov = {"mediana": med, "p95": float(np.percentile(mv, 95)) if len(mv) else 0.0,
           "max": float(mv.max()) if len(mv) else 0.0, "lectura": lectura,
           "luma_min": float(lu.min()) if len(lu) else 0, "luma_max": float(lu.max()) if len(lu) else 0}
    escribir_json(a / "movimiento.json", {**mov, "por_segundo": [round(v, 3) for v in por_seg],
                                          "por_fotograma": [round(float(v), 2) for v in mv],
                                          "luma_por_fotograma": [round(float(v), 1) for v in lu]}, compacto=True)
    hojas = _hojas(proy, fuente)
    fondo = _fondo(proy, fuente)
    escribir_json(a / "fondo.json", fondo)
    p = fondo["ponente"]
    caja = [p["x1_p1"], p["x2_p99"], p["top_p1"]] if p["x1_p1"] is not None else None
    nit = _nitidez(proy, fuente, caja)
    recom = _recomendaciones(fondo, audio, nit)
    escribir_json(a / "recomendaciones.json", recom)
    (a / "resumen.md").write_text(_resumen_md(proy, fuente, meta, pasada, audio, escenas, mov, fondo, nit, recom, hojas),
                                  encoding="utf-8")
    info(f"resumen en {(a / 'resumen.md').relative_to(proy.dir)}")
    return {"pasada_video_s": pasada.get("segundos"), "audio_s": audio.get("segundos")}


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "analizar") as extra:
        extra.update(ejecutar_analisis(proy, forzar=args.forzar))
    return 0
