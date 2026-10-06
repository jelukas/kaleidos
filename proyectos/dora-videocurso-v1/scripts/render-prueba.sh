#!/usr/bin/env bash
# Render local de un extracto: scripts/render-prueba.sh <nombre> <fotograma_ini> <fotograma_fin> [gl] [concurrencia]
# - Empaqueta una vez en build-local/ con --public-dir=media-public (public/ + enlace al mezzanine),
#   que NO es la carpeta que se sube como site (el site de Lambda se empaqueta con public/).
# - gl: angle (GPU, por defecto) o swangle (WebGL por software, como en Lambda).
# Deja out/<nombre>.mp4, fotogramas de revisión en work/revision/<nombre>/ y el tiempo en work/tiempos.log.
set -euo pipefail
cd "$(dirname "$0")/.."
NOMBRE=$1
INI=$2
FIN=$3
GL=${4:-angle}
CONC=${5:-4}
mkdir -p out work/revision/"$NOMBRE"
if [[ ! -d build-local ]] || [[ -n "$(find src public -newer build-local/index.html -print -quit 2>/dev/null)" ]]; then
  tb=$(date +%s)
  npx remotion bundle src/index.ts --public-dir=media-public --out-dir=build-local --log=warn
  echo "bundle local: $(($(date +%s) - tb)) s" | tee -a work/tiempos.log
fi
t0=$(date +%s.%N)
npx remotion render build-local Videocurso "out/$NOMBRE.mp4" \
  --props=work/props-local.json \
  --frames="$INI-$FIN" \
  --codec=h264 --crf=18 \
  --gl="$GL" \
  --concurrency="$CONC" \
  --log=warn
t1=$(date +%s.%N)
N=$((FIN - INI + 1))
SEG=$(echo "$t1 - $t0" | bc)
SPF=$(echo "scale=4; $SEG / $N" | bc)
echo "render $NOMBRE frames $INI-$FIN ($N) gl=$GL conc=$CONC: ${SEG} s, ${SPF} s/fotograma" | tee -a work/tiempos.log
rm -f work/revision/"$NOMBRE"/*.jpg
ffmpeg -hide_banner -loglevel error -y -i "out/$NOMBRE.mp4" -vf "fps=1/2,scale=960:-2" -q:v 3 "work/revision/$NOMBRE/f_%03d.jpg"
