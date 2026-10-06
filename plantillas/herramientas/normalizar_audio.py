#!/usr/bin/env python3
"""Normaliza el audio de un MP4 final a −16 LUFS / −1,5 dBTP sin tocar el vídeo (loudnorm en dos pasadas, lineal).

    python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 [--lufs -16] [--tp -1.5] [--en-sitio]

La mezcla que sale de Lambda (voz + música + efectos) ronda −13 LUFS con picos por encima de 0 dBTP. Este paso:
1. mide con `loudnorm` (primera pasada) y guarda el registro completo de ffmpeg en `<mp4>.loudnorm.log`;
2. aplica la ganancia con los valores medidos (`linear=true`), copia el vídeo (`-c:v copy`) y codifica AAC 192k;
3. comprueba que el número de fotogramas y la duración no cambian y mide el resultado (ebur128).
Sin `--en-sitio` deja `<nombre>.norm.mp4`; con `--en-sitio` sustituye el original y lo conserva como
`<nombre>.orig.mp4`. Sale con 1 si la comprobación falla. Sin dependencias (Python 3.9+ y ffmpeg/ffprobe en el PATH).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def correr(cmd: list[str], log: Path) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    with open(log, "a", encoding="utf-8") as f:
        f.write(f"\n$ {' '.join(cmd)}\n{p.stderr}{p.stdout}")
    if p.returncode != 0:
        raise SystemExit(f"✗ falló {cmd[0]} (registro completo: {log})")
    return p.stderr + p.stdout


def contar(mp4: Path) -> tuple[int, float]:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                          "stream=nb_read_packets:format=duration", "-of", "json", str(mp4)],
                         capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    return int(d["streams"][0]["nb_read_packets"]), float(d["format"]["duration"])


def medir(mp4: Path, log: Path) -> tuple[float | None, float | None]:
    txt = correr(["ffmpeg", "-hide_banner", "-nostats", "-i", str(mp4), "-vn", "-af", "ebur128=peak=true:framelog=quiet",
                  "-f", "null", "-"], log)
    i = re.findall(r"I:\s+(-?\d+(?:\.\d+)?) LUFS", txt)
    tp = re.findall(r"Peak:\s+(-?\d+(?:\.\d+)?) dBFS", txt)
    return (float(i[-1]) if i else None), (float(tp[-1]) if tp else None)


def main() -> int:
    ap = argparse.ArgumentParser(description="Normaliza el audio de un MP4 (dos pasadas, vídeo copiado).")
    ap.add_argument("mp4")
    ap.add_argument("--lufs", type=float, default=-16.0)
    ap.add_argument("--tp", type=float, default=-1.5)
    ap.add_argument("--lra", type=float, default=11.0)
    ap.add_argument("--en-sitio", action="store_true", help="sustituye el original (se guarda como .orig.mp4)")
    a = ap.parse_args()

    src = Path(a.mp4).resolve()
    if not src.exists():
        print(f"✗ no existe {src}", file=sys.stderr)
        return 2
    log = src.with_suffix(".loudnorm.log")
    log.write_text("", encoding="utf-8")
    antes_i, antes_tp = medir(src, log)
    print(f"Antes: {antes_i} LUFS, pico real {antes_tp} dBTP")

    base = f"loudnorm=I={a.lufs}:TP={a.tp}:LRA={a.lra}"
    txt = correr(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-vn", "-af", f"{base}:print_format=json",
                  "-f", "null", "-"], log)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", txt, re.S)
    if not m:
        print(f"✗ loudnorm no devolvió la medida (registro: {log})", file=sys.stderr)
        return 1
    d = json.loads(m.group(0))
    af = (f"{base}:linear=true:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:"
          f"measured_thresh={d['input_thresh']}:offset={d['target_offset']}")
    dst = src.with_name(src.stem + ".norm.mp4")
    correr(["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src), "-map", "0:v:0", "-map", "0:a:0",
            "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
            str(dst)], log)

    f0, d0 = contar(src)
    f1, d1 = contar(dst)
    despues_i, despues_tp = medir(dst, log)
    ok = f0 == f1 and abs(d0 - d1) < 0.2
    print(f"Después: {despues_i} LUFS, pico real {despues_tp} dBTP · fotogramas {f0} → {f1} · duración "
          f"{d0:.2f} → {d1:.2f} s · {'✓' if ok else '✗'}")
    if not ok:
        print(f"✗ el vídeo cambió: se deja {dst.name} sin sustituir nada", file=sys.stderr)
        return 1
    if a.en_sitio:
        orig = src.with_name(src.stem + ".orig.mp4")
        os.replace(src, orig)
        os.replace(dst, src)
        print(f"→ {src.name} normalizado (original en {orig.name})")
    else:
        print(f"→ {dst.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
