"""`kaleidos master`: mezzanine 1080p corregido (work/mezzanine.mp4) + máster de voz a -16 LUFS / -1,5 dBTP.

Vídeo (valores de work/analisis/recomendaciones.json): balance de blancos que neutraliza el fondo liso,
exposición, saturación, desaturación selectiva azul/magenta, curva S y nitidez de luma, aplicados en la GPU
(PyTorch MPS, función compilada) entre decodificadores y codificador de VideoToolbox:
  - tramo 0: decodificación VideoToolbox + scale_vt (motor de medios, ~128 fps en 4K);
  - tramos 1…: decodificación por software (≈2 núcleos) + hwupload + scale_vt;
  - codificación h264_videotoolbox, GOP de 2 s; concatenación sin recodificar, audio AAC y faststart.
`--cpu` usa la cadena clásica de ffmpeg con la LUT .cube horneada de la misma función (≈4× más lenta).
Audio: canal de voz → paso alto → ganancia a ~-20 LUFS → reducción de ruido FFT → expansor suave →
de-esser → compresión en dos etapas → ganancia medida → limitador → loudnorm lineal a dos pasadas.
"""

from __future__ import annotations

import json
import math
import re
import time
from pathlib import Path

from . import color
from .comun import (
    ErrorKaleidos, Proyecto, contar_fotogramas, correr, cronometro, escribir_json, ffmpeg_bin, hay_encoder, info,
    salida_de,
)

OBJ_I, OBJ_TP, OBJ_LRA = -16.0, -1.5, 12.0


def _lin(db: float) -> float:
    return 10 ** (db / 20)


def _ebur(txt: str) -> dict:
    i = txt.rfind("Summary:")
    b = txt[i:]
    res = {}
    for k, pat in (("I", r"I:\s+([-\d.]+) LUFS"), ("LRA", r"LRA:\s+([-\d.]+) LU"), ("TP", r"Peak:\s+([-\d.]+) dBFS")):
        m = re.search(pat, b)
        if m:
            res[k] = float(m.group(1))
    return res


def _json_loudnorm(txt: str) -> dict:
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", txt, re.S)
    if not m:
        raise ErrorKaleidos("loudnorm no devolvió medidas")
    return json.loads(m[-1])


def audio_master(proy: Proyecto) -> dict:
    t0 = time.time()
    dir_ = proy.work / "audio"
    dir_.mkdir(parents=True, exist_ok=True)
    log = proy.logs / "master_audio.log"
    audio = proy.analisis_json("audio.json")
    I0 = audio.get("voz", {}).get("I_lufs") or -23.0
    suelo = audio.get("suelo_ruido_db", -80.0)
    voz = dir_ / "voz_48k.wav"
    if not voz.exists():
        correr([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", proy.bruto, "-vn", "-af", proy.canal_voz(),
                "-ar", "48000", "-c:a", "pcm_f32le", voz], log=log)
    g1 = max(0.0, min(30.0, -20.0 - I0))
    nf = max(-80.0, min(-20.0, suelo + g1 + 3))
    pre = (f"highpass=f=80:poles=2,volume={g1:.2f}dB,afftdn=nr=10:nf={nf:.0f}:tn=1,"
           f"agate=threshold={_lin(-47):.5f}:ratio=1.5:range=0.316:attack=5:release=300:knee=4,"
           f"deesser=i=0.25:m=0.5:f=0.5:s=o,"
           f"acompressor=threshold={_lin(-29.5):.5f}:ratio=3:attack=10:release=200:knee=6:makeup=1,"
           f"acompressor=threshold={_lin(-21.5):.5f}:ratio=4:attack=2:release=80:knee=3:makeup=1")
    # 1) sonoridad tras la dinámica → ganancia para quedar en el objetivo antes del limitador
    med = _ebur(salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", voz, "-af",
                           f"{pre},ebur128=peak=true:framelog=quiet", "-f", "null", "-"], log=log))
    g2 = OBJ_I - (med["I"] + 3.01)   # la medida es en mono; el máster es estéreo dual-mono (+3 dB)
    # dinámica en mono (la mitad de trabajo) y estéreo dual-mono ANTES de loudnorm, para que mida lo que se entrega
    cadena = (f"{pre},volume={g2:.2f}dB,alimiter=limit={_lin(-2.5):.4f}:attack=4:release=60:level=0:asc=1,"
              f"pan=stereo|c0=c0|c1=c0")
    # 2) loudnorm, primera pasada (medida)
    p1 = _json_loudnorm(salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", voz, "-af",
                                   f"{cadena},loudnorm=I={OBJ_I}:TP={OBJ_TP}:LRA={OBJ_LRA}:print_format=json",
                                   "-f", "null", "-"], log=log))
    ln = (f"loudnorm=I={OBJ_I}:TP={OBJ_TP}:LRA={OBJ_LRA}:measured_I={p1['input_i']}:measured_TP={p1['input_tp']}"
          f":measured_LRA={p1['input_lra']}:measured_thresh={p1['input_thresh']}:offset={p1['target_offset']}"
          f":linear=true:print_format=json")
    master = dir_ / "voz_master.wav"
    # 3) segunda pasada (lineal) → estéreo dual-mono, 48 kHz, 24 bits
    p2 = _json_loudnorm(salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", voz, "-af",
                                   f"{cadena},{ln}", "-ar", "48000", "-c:a", "pcm_s24le",
                                   master], log=log))
    fin = _ebur(salida_de([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", master, "-af",
                           "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], log=log))
    aac = "aac_at" if hay_encoder("aac_at") else "aac"
    m4a = dir_ / "voz_master.m4a"
    correr([ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-i", master, "-c:a", aac, "-b:a", "192k", m4a], log=log)
    res = {
        "entrada_I": I0, "ganancia_previa_db": round(g1, 2), "ganancia_final_db": round(g2, 2),
        "afftdn_nf": nf, "cadena": f"{cadena},{ln}", "loudnorm_pasada1": p1, "loudnorm_pasada2": p2,
        "normalizacion": p2.get("normalization_type"), "resultado": fin, "segundos": round(time.time() - t0, 1),
    }
    escribir_json(dir_ / "master.json", res)
    ok = abs(fin.get("I", 0) - OBJ_I) <= 0.5 and fin.get("TP", 0) <= OBJ_TP + 0.1
    info(f"audio: {fin.get('I')} LUFS, TP {fin.get('TP')} dBTP, LRA {fin.get('LRA')} LU, loudnorm "
         f"{p2.get('normalization_type')} ({res['segundos']} s){'' if ok else ' — FUERA DE OBJETIVO'}")
    if not ok:
        raise ErrorKaleidos("el máster de audio no cumple -16 LUFS / -1,5 dBTP (ver master_audio.log)")
    return res


def _video_gpu(proy: Proyecto, ini: int, n: int, partes: int, salida_dir: Path, p: dict) -> list[Path]:
    import torch

    from . import tuberia

    f = proy.fuente_info()
    fps = f["fps"]
    W, H = proy.cfg["salida"]["ancho"], proy.cfg["salida"]["alto"]
    dev = torch.device("mps")
    nucleo = torch.compile(color.nucleo_nv12(p, W, H, dev))
    tam = W * H * 3 // 2
    salida_dir.mkdir(parents=True, exist_ok=True)
    for viejo in salida_dir.glob("p*.mp4"):
        viejo.unlink()
    # reparto: el tramo VT va a ~128 fps; los de software algo más → el primero se queda con menos
    pesos = [0.8] + [1.0] * (partes - 1)
    cortes = [ini]
    acum = 0.0
    for w in pesos[:-1]:
        acum += w
        cortes.append(ini + round(n * acum / sum(pesos)))
    cortes.append(ini + n)
    tramos, rutas = [], []
    for i in range(partes):
        a, b = cortes[i], cortes[i + 1]
        ruta = salida_dir / f"p{i}.mp4"
        dec = (tuberia.decodificador_vt(proy.bruto, a, b - a, fps, W, H) if i == 0 else
               tuberia.decodificador_sw(proy.bruto, a, b - a, fps, W, H))
        enc = tuberia.codificador_vt(ruta, W, H, fps, bitrate="6M", gop=round(2 * fps))
        tramos.append(tuberia.Tramo(f"tramo {i} [{a}-{b})", dec, enc, tam, b - a, proy.logs / f"master_video_{i}.log"))
        rutas.append(ruta)
    info(f"vídeo: {n} fotogramas en {partes} tramos (1 VideoToolbox + {partes - 1} software/scale_vt) → GPU")
    r = tuberia.bucle_gpu(tramos, nucleo, 4, dev, progreso=proy.logs / "master_progreso.json", etiqueta="master ")
    info(f"vídeo: {r['fotogramas']} fotogramas en {r['segundos']} s ({r['fps']} fps)")
    return rutas


def _video_cpu(proy: Proyecto, ini: int, n: int, partes: int, salida_dir: Path, p: dict) -> list[Path]:
    """Cadena 100 % ffmpeg con la LUT horneada (modo de respaldo)."""
    import subprocess

    f = proy.fuente_info()
    fps = f["fps"]
    W, H = proy.cfg["salida"]["ancho"], proy.cfg["salida"]["alto"]
    cube = color.hornear_cube(p, proy.work / "lut" / "grade.cube")
    vf = (f"scale={W}:{H}:flags=lanczos,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv,"
          f"format=rgb24,lut3d=file={cube}:interp=tetrahedral,scale=out_color_matrix=bt709:out_range=tv,"
          f"format=yuv420p" + (f",unsharp=5:5:{p['unsharp']}:5:5:0" if p["unsharp"] > 0 else ""))
    salida_dir.mkdir(parents=True, exist_ok=True)
    rutas, procs = [], []
    por = math.ceil(n / partes)
    for i in range(partes):
        a = ini + i * por
        k = min(por, ini + n - a)
        ruta = salida_dir / f"p{i}.mp4"
        cmd = [ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-threads", "3", "-ss", f"{max(0, (a - 0.25) / fps):.4f}",
               "-i", proy.bruto, "-an", "-frames:v", str(k), "-vf", vf, "-c:v", "h264_videotoolbox", "-b:v", "6M",
               "-maxrate", "9M", "-bufsize", "12M", "-profile:v", "high", "-g", str(round(2 * fps)),
               "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", ruta]
        logf = open(proy.logs / f"master_video_{i}.log", "a")
        logf.write(f"\n$ {' '.join(map(str, cmd))}\n")
        logf.flush()
        procs.append((subprocess.Popen(cmd, stderr=logf, stdout=logf), logf))
        rutas.append(ruta)
    for pr, lf in procs:
        if pr.wait() != 0:
            raise ErrorKaleidos(f"falló un tramo del mezzanine (ver {lf.name})")
        lf.close()
    return rutas


def video_master(proy: Proyecto, partes: int = 3, desde: float | None = None, duracion: float | None = None,
                 cpu: bool = False) -> dict:
    t0 = time.time()
    f = proy.fuente_info()
    fps = f["fps"]
    recom = proy.analisis_json("recomendaciones.json")
    p = color.parametros(recom)
    escribir_json(proy.work / "lut" / "parametros.json", p)
    color.hornear_cube(p, proy.work / "lut" / "grade.cube")
    total = f["fotogramas"]
    prueba = desde is not None
    ini = round((desde or 0) * fps)
    n = min(total - ini, round((duracion or 20) * fps)) if prueba else total
    dir_partes = proy.work / ("mezz_prueba" if prueba else "mezz_partes")
    rutas = (_video_cpu if cpu else _video_gpu)(proy, ini, n, 1 if prueba else partes, dir_partes, p)
    t1 = time.time()
    for r_ in rutas:
        info(f"  {r_.name}: {contar_fotogramas(r_)} fotogramas")
    lista = dir_partes / "lista.txt"
    lista.write_text("".join(f"file '{r_.name}'\n" for r_ in rutas))
    salida = proy.work / ("mezzanine_prueba.mp4" if prueba else "mezzanine.mp4")
    m4a = proy.work / "audio" / "voz_master.m4a"
    cmd = [ffmpeg_bin(), "-hide_banner", "-nostats", "-y", "-f", "concat", "-safe", "0", "-i", lista]
    if m4a.exists():
        if prueba:
            cmd += ["-ss", f"{ini / fps:.4f}", "-t", f"{n / fps:.4f}"]
        cmd += ["-i", m4a, "-map", "0:v:0", "-map", "1:a:0"]
    else:
        info("AVISO: no hay máster de audio; el mezzanine sale sin audio")
    cmd += ["-c", "copy", "-movflags", "+faststart", salida]
    correr(cmd, log=proy.logs / "master_video.log")
    nf = contar_fotogramas(salida)
    res = {"salida": str(salida.relative_to(proy.dir)), "fotogramas": nf, "esperados": n,
           "segundos_video": round(t1 - t0, 1), "segundos_total": round(time.time() - t0, 1),
           "fps": round(n / max(t1 - t0, 1e-6), 1), "modo": "cpu" if cpu else "gpu", "partes": len(rutas),
           "bytes": salida.stat().st_size}
    escribir_json(proy.work / ("mezzanine_prueba.json" if prueba else "mezzanine.json"), res)
    if nf != n:
        raise ErrorKaleidos(f"el mezzanine tiene {nf} fotogramas y se esperaban {n}")
    info(f"mezzanine: {salida.name} con {nf}/{n} fotogramas, {res['bytes'] / 1e6:.0f} MB, "
         f"{res['segundos_total']} s ({res['fps']} fps)")
    if not prueba:
        for r_ in rutas:
            r_.unlink()
    return res


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "master" + (f" ({args.solo})" if args.solo else "") +
                    (" (extracto)" if args.desde is not None else "")) as extra:
        if args.solo != "video" and args.desde is None:
            a = audio_master(proy)
            extra["audio_s"] = a["segundos"]
            extra["audio"] = a["resultado"]
        if args.solo != "audio":
            v = video_master(proy, partes=args.partes, desde=args.desde, duracion=args.duracion,
                             cpu=getattr(args, "cpu", False))
            extra.update({k: v[k] for k in ("fotogramas", "fps", "segundos_video", "modo")})
    return 0
