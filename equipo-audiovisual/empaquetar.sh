#!/usr/bin/env bash
# empaquetar.sh — genera equipo-audiovisual/kaleidos-skills.zip con las skills que usan los vídeos.
#   proyecto/  skills de kaleidos (.claude/skills del repo)
#   globales/  video-corto (skills-globales/) + skills de HyperFrames instaladas en ~/.claude/skills
# Uso, desde la raíz del repo: equipo-audiovisual/empaquetar.sh
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SALIDA="$RAIZ/equipo-audiovisual/kaleidos-skills.zip"
GLOBALES=(hyperframes general-video product-launch-video media-use hyperframes-core hyperframes-animation
  hyperframes-cli hyperframes-creative hyperframes-audio hyperframes-keyframes hyperframes-registry hyperframes-studio)

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/kaleidos-skills/proyecto" "$TMP/kaleidos-skills/globales"

cp -R "$RAIZ/.claude/skills/"* "$TMP/kaleidos-skills/proyecto/"
cp -R "$RAIZ/skills-globales/video-corto" "$TMP/kaleidos-skills/globales/"
for s in "${GLOBALES[@]}"; do
  if [ -d "$HOME/.claude/skills/$s" ]; then
    cp -R "$HOME/.claude/skills/$s" "$TMP/kaleidos-skills/globales/"
  else
    echo "! falta ~/.claude/skills/$s (npx hyperframes@0.8.86 skills update $s)" >&2
    exit 1
  fi
done
cp "$RAIZ/vendor/hyperframes-repo/LICENSE" "$TMP/kaleidos-skills/globales/LICENSE-HyperFrames" 2>/dev/null \
  || curl -fsSL https://raw.githubusercontent.com/heygen-com/hyperframes/main/LICENSE -o "$TMP/kaleidos-skills/globales/LICENSE-HyperFrames"
cp "$RAIZ/equipo-audiovisual/README.md" "$TMP/kaleidos-skills/LEEME.md"
find "$TMP" \( -name .DS_Store -o -name node_modules -o -name __pycache__ \) -prune -exec rm -rf {} +

rm -f "$SALIDA"
(cd "$TMP" && zip -rqX "$SALIDA" kaleidos-skills)
echo "→ $SALIDA ($(du -h "$SALIDA" | cut -f1)) · $(ls "$TMP/kaleidos-skills/proyecto" | wc -l | tr -d ' ') de proyecto · $(ls -d "$TMP/kaleidos-skills/globales"/*/ | wc -l | tr -d ' ') globales"
