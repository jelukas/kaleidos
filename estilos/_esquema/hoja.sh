#!/bin/bash
# Hoja de contactos del catálogo: una referencia por estilo (la primera que no sea el muestrario), en rejilla.
#
#   bash estilos/_esquema/hoja.sh <salida.jpg> [columnas=3] [estilo …]
#
# Cada celda es de 480×270 (las verticales se encajan con bandas). El orden es el alfabético de las carpetas.
# Todas las celdas se pasan a yuvj420p: si se mezclan 4:4:4 y 4:2:0, ffmpeg reinicia el filtro tile a mitad.
set -euo pipefail
SALIDA="${1:?uso: hoja.sh <salida.jpg> [columnas] [estilo …]}"
shift
COLS=3
if [[ "${1:-}" =~ ^[0-9]+$ ]]; then COLS="$1"; shift; fi
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ESTILOS=("$@")
if [ ${#ESTILOS[@]} -eq 0 ]; then
  for d in "$RAIZ"/*/; do n="$(basename "$d")"; [[ "$n" == _* ]] || ESTILOS+=("$n"); done
fi
i=0
for n in "${ESTILOS[@]}"; do
  f="$(ls "$RAIZ/$n/referencias/"*.jpg 2>/dev/null | grep -v 00-muestrario | head -1 || true)"
  [ -n "$f" ] || f="$(ls "$RAIZ/$n/referencias/"*.jpg 2>/dev/null | head -1 || true)"
  [ -n "$f" ] || { echo "sin referencias: $n" >&2; continue; }
  ffmpeg -nostdin -v error -y -i "$f" \
    -vf "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2,format=yuvj420p" \
    "$TMP/$(printf %03d $i).jpg"
  echo "$(printf %2d $((i + 1))) $n ← ${f#$RAIZ/}"
  i=$((i + 1))
done
[ $i -gt 0 ] || { echo "no hay referencias" >&2; exit 1; }
FILAS=$(( (i + COLS - 1) / COLS ))
ffmpeg -nostdin -v error -y -framerate 1 -i "$TMP/%03d.jpg" -vf "tile=${COLS}x${FILAS}:padding=6:color=white" -frames:v 1 -q:v 3 "$SALIDA"
echo "✓ $SALIDA (${COLS}×${FILAS})"
