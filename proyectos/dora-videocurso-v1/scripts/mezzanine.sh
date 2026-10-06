#!/usr/bin/env bash
# Mezzanine corregido: 1920x1080, 25 fps, H.264 High (libx264 CRF 19), BT.709 limitado, GOP 2 s, faststart.
#
# Vídeo (valores medidos en el diagnóstico, ver work/diag):
#   - Escalado 4K -> 1080p con lanczos y matriz BT.709 explícita (el bruto no trae etiquetas de color).
#   - Una sola LUT 3D (work/lut/grade.cube, 33³, interpolación tetraédrica) que hornea, en este orden:
#       saturación -6 % (compensa la curva S) · balance de blancos R x1,026 / B x0,988 (ciclorama
#       U 131 / V 126 -> 128) · desaturación selectiva de azules y magentas (derrame lavanda de las
#       esquinas) · curva S suave (negros algo más densos, fondo blanco limpio ~97 % sin recortar).
#   - Nitidez ligera solo en luma (unsharp 5x5, 0,55) tras el escalado.
#   - Reducción de ruido: no procede (ruido temporal medido 0,02 niveles; con hqdn3d no había diferencia visible).
#   - Estabilización: no procede (cámara fija, fondo idéntico en los 34 min; además este ffmpeg no trae vidstab).
# Audio: máster de scripts/audio-master.sh (-16 LUFS / -1,5 dBTP) en AAC 192 kb/s (AudioToolbox).
#
# Velocidad: en este equipo la CPU se limita con carga sostenida (el mismo trabajo pasa de 6 a 16 CPU-s),
# así que la decodificación 4K, el escalado (scale_vt) y la codificación H.264 van por VideoToolbox y la
# CPU solo aplica la LUT y el realce. Se codifican 2 tramos exactos en paralelo y se concatenan sin
# recodificar; el audio se codifica entero aparte (sin huecos entre tramos).
# (MODO=sw usa la cadena 100 % software con libx264 CRF 19: SSIM 0,9945 frente a 0,9939 del modo vt.)
#
# Uso: scripts/mezzanine.sh                      → media/mezzanine.mp4 completo
#      scripts/mezzanine.sh <ini_s> <dur_s> <out> → extracto de prueba (un solo proceso)
set -euo pipefail
cd "$(dirname "$0")/../work"

SRC=../../../brutos/prueba1.mp4
AUDIO=audio/voz_master.wav
FPS=25
mkdir -p lut

# 1. LUT 3D exacta: se pasan los 33³ nodos de la rejilla por la cadena de corrección.
if [[ ! -f lut/grade.cube ]]; then
  python3 - <<'EOF'
N = 33
px = bytearray()
for b in range(N):
    for g in range(N):
        for r in range(N):
            px += bytes([round(r * 255 / (N - 1)), round(g * 255 / (N - 1)), round(b * 255 / (N - 1))])
open("lut/nodos_33.rgb", "wb").write(px)
EOF
  ffmpeg -hide_banner -loglevel error -y -f rawvideo -pix_fmt rgb24 -s 1089x33 -i lut/nodos_33.rgb -vf \
    "scale=out_color_matrix=bt709:out_range=pc,format=yuv444p,eq=saturation=0.94,scale=in_color_matrix=bt709:in_range=pc,format=gbrp,\
colorchannelmixer=rr=1.026:gg=1:bb=0.988,huesaturation=saturation=-0.3:colors=b+m:strength=2,\
curves=all='0/0 0.07/0.058 0.5/0.5 0.88/0.905 1/1',format=rgb24" -f rawvideo lut/nodos_33_grade.rgb
  python3 - <<'EOF'
d = open("lut/nodos_33_grade.rgb", "rb").read()
with open("lut/grade.cube", "w") as o:
    o.write('TITLE "videocurso: saturacion + balance de blancos + desat. azul/magenta + curva S"\n')
    o.write("LUT_3D_SIZE 33\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n")
    for i in range(33 ** 3):
        o.write(f"{d[3*i]/255:.6f} {d[3*i+1]/255:.6f} {d[3*i+2]/255:.6f}\n")
EOF
fi

VF="setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv,\
scale=1920:1080:flags=lanczos:in_color_matrix=bt709:out_color_matrix=bt709,\
scale=in_color_matrix=bt709:in_range=tv,format=gbrp,\
lut3d=file=lut/grade.cube:interp=tetrahedral,\
scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,\
unsharp=5:5:0.55:5:5:0,\
setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv"

MODO=${MODO:-vt}
VF_VT="scale_vt=w=1920:h=1080,hwdownload,format=nv12,\
setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv,\
scale=in_color_matrix=bt709:in_range=tv,format=gbrp,\
lut3d=file=lut/grade.cube:interp=tetrahedral,\
scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,\
unsharp=5:5:0.55:5:5:0,\
setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv"
VT=(-c:v h264_videotoolbox -b:v 5M -maxrate 8M -bufsize 10M -profile:v high -g 50
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
HWDEC=(-hwaccel videotoolbox -hwaccel_output_format videotoolbox_vld)
X264=(-c:v libx264 -preset medium -crf 19 -profile:v high -level 4.1 -g 50 -keyint_min 25 -bf 2 -x264-params "aq-mode=3"
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
AAC=aac
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q " aac_at "; then AAC=aac_at; fi

t0=$(date +%s)
if [[ $# -ge 2 ]]; then
  OUT=${3:-../work/diag/mezz_extracto.mp4}
  ffmpeg -hide_banner -nostats -loglevel warning -y -ss "$1" -t "$2" -i "$SRC" -ss "$1" -t "$2" -i "$AUDIO" \
    -map 0:v:0 -map 1:a:0 -vf "$VF" -r $FPS "${X264[@]}" -c:a "$AAC" -b:a 192k -ar 48000 -ac 2 -movflags +faststart "$OUT"
  echo "mezzanine extracto $OUT: $(($(date +%s) - t0)) s" | tee -a tiempos.log
  exit 0
fi

TOTAL=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$SRC")
PARTES=${PARTES:-2}
POR=$(((TOTAL + PARTES - 1) / PARTES))
mkdir -p mezz_partes
rm -f mezz_partes/*
pids=()
for ((i = 0; i < PARTES; i++)); do
  INI=$((i * POR))
  N=$((TOTAL - INI < POR ? TOTAL - INI : POR))
  SS=$(echo "scale=3; $INI / $FPS" | bc)
  if [[ "$MODO" == "vt" ]]; then
    ffmpeg -hide_banner -nostats -loglevel error -y "${HWDEC[@]}" -ss "$SS" -i "$SRC" -an -frames:v "$N" -vf "$VF_VT" -r $FPS \
      "${VT[@]}" "mezz_partes/p$i.mp4" &
  else
    ffmpeg -hide_banner -nostats -loglevel error -y -ss "$SS" -i "$SRC" -an -frames:v "$N" -vf "$VF" -r $FPS \
      "${X264[@]}" -threads 3 "mezz_partes/p$i.mp4" &
  fi
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
t1=$(date +%s)
for ((i = 0; i < PARTES; i++)); do echo "file 'p$i.mp4'"; done > mezz_partes/lista.txt
ffmpeg -hide_banner -loglevel error -y -i "$AUDIO" -c:a "$AAC" -b:a 192k -ar 48000 -ac 2 mezz_partes/audio.m4a
mkdir -p ../media
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i mezz_partes/lista.txt -i mezz_partes/audio.m4a \
  -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart ../media/mezzanine.mp4
t2=$(date +%s)
echo "mezzanine completo ($MODO): vídeo $((t1 - t0)) s ($PARTES tramos en paralelo), audio+concat $((t2 - t1)) s, total $((t2 - t0)) s" | tee -a tiempos.log
ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets,width,height,r_frame_rate,color_space,color_range -of compact ../media/mezzanine.mp4
ls -la ../media/mezzanine.mp4
