#!/usr/bin/env bash
# Máster de audio del videocurso (voz).
# - El bruto trae la voz solo en el canal izquierdo (el derecho es silencio digital):
#   se toma el izquierdo y se entrega en estéreo dual-mono.
# - Paso alto 80 Hz, reducción de ruido FFT suave, expansor suave en pausas, de-esser suave,
#   compresión en dos etapas (nivel + picos), ganancia, limitador y loudnorm lineal a dos pasadas
#   a -16 LUFS / -1,5 dBTP.
set -euo pipefail
cd "$(dirname "$0")/../work"

SRC=../../../brutos/prueba1.mp4
mkdir -p audio

if [[ ! -f audio/voz_L_48k.wav ]]; then
  ffmpeg -hide_banner -loglevel error -y -i "$SRC" -vn -af "pan=mono|c0=c0" -c:a pcm_f32le -ar 48000 audio/voz_L_48k.wav
fi

CH="highpass=f=80:poles=2,afftdn=nr=10:nf=-80:tn=1,agate=threshold=0.001:ratio=1.5:range=0.316:attack=5:release=300:knee=4,deesser=i=0.25:m=0.5:f=0.5:s=o,acompressor=threshold=0.0079:ratio=3:attack=10:release=200:knee=6:makeup=1,acompressor=threshold=0.02:ratio=4:attack=2:release=80:knee=3:makeup=1,pan=stereo|c0=c0|c1=c0,volume=26.3dB,alimiter=limit=0.75:attack=4:release=60:level=0:asc=1"
echo "$CH" > audio/cadena_pre.txt

t0=$(date +%s)
ffmpeg -hide_banner -nostats -i audio/voz_L_48k.wav -af "${CH},loudnorm=I=-16:TP=-1.5:LRA=12:print_format=json" -f null - 2>&1 \
  | sed -n '/^{/,/^}/p' > audio/loudnorm_pass1.json
t1=$(date +%s)

val() { grep "\"$1\"" audio/loudnorm_pass1.json | grep -oE -- '-?[0-9]+\.[0-9]+'; }
MI=$(val input_i); MTP=$(val input_tp); MLRA=$(val input_lra); MTH=$(val input_thresh); OFF=$(val target_offset)
LN="loudnorm=I=-16:TP=-1.5:LRA=12:measured_I=${MI}:measured_TP=${MTP}:measured_LRA=${MLRA}:measured_thresh=${MTH}:offset=${OFF}:linear=true:print_format=json"
echo "$LN" > audio/loudnorm_pass2_filtro.txt

ffmpeg -hide_banner -nostats -y -i audio/voz_L_48k.wav -af "${CH},${LN}" -ar 48000 -c:a pcm_s24le audio/voz_master.wav 2>&1 \
  | sed -n '/^{/,/^}/p' > audio/loudnorm_pass2.json
t2=$(date +%s)

echo "audio: pasada 1 $((t1 - t0)) s, pasada 2 $((t2 - t1)) s" | tee -a tiempos.log
grep -E "output_i|output_tp|normalization_type" audio/loudnorm_pass2.json
ffmpeg -hide_banner -nostats -i audio/voz_master.wav -af "ebur128=peak=true:framelog=quiet" -f null - 2>&1 \
  | grep -A20 "Summary" | grep -E "I:|LRA:|Peak:" | tee audio/ebur128_master.txt
