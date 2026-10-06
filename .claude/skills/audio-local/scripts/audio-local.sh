#!/usr/bin/env bash
# Genera el audio de un vídeo en local, un modelo detrás de otro (nunca en paralelo: no caben en 16 GB).
#   .claude/skills/audio-local/scripts/audio-local.sh <slug> [voz|musica|efectos|todo] [opciones del script]
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI="$HOME/ai-audio"
SLUG="${1:?Uso: audio-local.sh <slug> [voz|musica|efectos|todo] [--force ...]}"
WHAT="${2:-todo}"; shift $(( $# >= 2 ? 2 : 1 ))
cd "$DIR"

VIDEO="$DIR/../../../../proyectos/$SLUG"
need() { [[ -f "$VIDEO/$1" ]] || { echo "(no existe proyectos/$SLUG/$1: se omite $2)"; return 1; }; }
run_voz()     { if need script.json voz;      then "$AI/qwen3-tts/.venv/bin/python" voz.py "$SLUG" "$@"; fi; }
run_musica()  { if need audio.json música;    then "$AI/ACE-Step-1.5/.venv/bin/python" musica.py "$SLUG" "$@"; fi; }
run_efectos() { if need audio.json efectos;   then "$AI/stable-audio/.venv/bin/python" efectos.py "$SLUG" "$@"; fi; }

case "$WHAT" in
  voz) run_voz "$@" ;;
  musica) run_musica "$@" ;;
  efectos) run_efectos "$@" ;;
  todo) echo "── Voz (Qwen3-TTS)";   run_voz "$@"
        echo "── Música (ACE-Step)"; run_musica "$@"
        echo "── Efectos (Stable Audio Open)"; run_efectos "$@" ;;
  *) echo "Parte desconocida: $WHAT (voz|musica|efectos|todo)"; exit 1 ;;
esac
