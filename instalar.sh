#!/usr/bin/env bash
# instalar.sh — deja kaleidos listo en este Mac. Idempotente: se puede relanzar; lo que ya está, se salta.
# Guía para agentes de IA (qué preguntar antes, qué no hacer nunca): INSTALAR.md.
#
#   ./instalar.sh                  instalación completa (la primera vez: ≈ 4 GB de descargas, ≈ 5 GB en disco, 15–30 min)
#   ./instalar.sh --comprobar      solo diagnostica (node scripts/doctor.mjs); no instala nada
#
# Opciones (se combinan):
#   --sin-brew        no instala paquetes de Homebrew (comprueba que estén y para si falta alguno)
#   --sin-modelos     no compila whisper.cpp ni descarga modelos (sin transcripción ni flujo con ponente)
#   --ilustrado       añade los modelos de profundidad y ampliación (método corto-ilustrado, ~1 GB más)
#   --sin-skills      no instala skills globales (~/.claude/skills y ~/.agents/skills: HyperFrames y video-corto)
#   --sin-chrome      no descarga Chrome for Testing (solo lo usa scripts/capture.mjs)
#   --aws-cli         añade AWS CLI, SAM CLI y bun (solo para administrar o redesplegar AWS)
#   --sin-lint        no pasa el lint + tsc del motor al final
#
# Nunca toca AWS ni APIs de pago y nunca escribe valores en .env: si no existe, lo crea vacío desde .env.example.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"

COMPROBAR=0; BREW=1; MODELOS=1; ILUSTRADO=0; SKILLS=1; CHROME=1; AWSCLI=0; LINT=1
for a in "$@"; do
  case "$a" in
    --comprobar) COMPROBAR=1 ;;
    --sin-brew) BREW=0 ;;
    --sin-modelos) MODELOS=0 ;;
    --ilustrado) ILUSTRADO=1 ;;
    --sin-skills) SKILLS=0 ;;
    --sin-chrome) CHROME=0 ;;
    --aws-cli) AWSCLI=1 ;;
    --sin-lint) LINT=0 ;;
    -h|--help) sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "opción desconocida: $a (./instalar.sh --help)" >&2; exit 2 ;;
  esac
done

# ——— salida ———
if [ -t 1 ]; then B=$'\e[1m'; V=$'\e[32m'; A=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'; else B=""; V=""; A=""; R=""; N=""; fi
PASO=0
paso() { PASO=$((PASO + 1)); printf '\n%s[%d] %s%s\n' "$B" "$PASO" "$1" "$N"; }
ok() { printf '  %s✓%s %s\n' "$V" "$N" "$1"; }
aviso() { printf '  %s!%s %s\n' "$A" "$N" "$1"; AVISOS+=("$1"); }
muere() { printf '\n%s✗ %s%s\n' "$R" "$1" "$N" >&2; [ $# -gt 1 ] && printf '  → %s\n' "${@:2}" >&2; exit 1; }
tiene() { command -v "$1" >/dev/null 2>&1; }
AVISOS=()
INICIO=$(date +%s)

# npm ci si falta node_modules o si el lock es más nuevo que lo instalado; si no, nada (no reescribe el lock)
npm_al_dia() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ] || [ "$dir/package-lock.json" -nt "$dir/node_modules/.package-lock.json" ]; then
    (cd "$dir" && npm ci --no-audit --no-fund --loglevel=error)
    ok "$dir: dependencias instaladas (npm ci)"
  else
    ok "$dir: dependencias al día"
  fi
}

if [ "$COMPROBAR" = 1 ]; then
  tiene node || muere "Node no está instalado" "./instalar.sh (sin --comprobar) o brew install node@22"
  exec node scripts/doctor.mjs
fi

printf '%skaleidos · instalación%s en %s\n' "$B" "$N" "$RAIZ"

# ════════ 1. Sistema ════════
paso "Sistema"
[ "$(uname -s)" = Darwin ] || muere "kaleidos está hecho para macOS (Metal, VideoToolbox, Apple Vision)" \
  "en Linux o Windows no hay instalador: mira README.md › Requisitos"
[ "$(uname -m)" = arm64 ] || aviso "CPU $(uname -m): el repo está probado en Apple Silicon (M1 Pro); el preproceso irá mucho más lento"
ok "macOS $(sw_vers -productVersion) · $(uname -m)"
xcode-select -p >/dev/null 2>&1 || muere "faltan las Command Line Tools de Xcode (git, clang para compilar whisper.cpp)" \
  "el usuario debe ejecutar: xcode-select --install   (abre un diálogo del sistema) y relanzar ./instalar.sh"
ok "Command Line Tools de Xcode"

# ════════ 2. Homebrew y paquetes ════════
paso "Paquetes del sistema (Homebrew)"
if [ -x /opt/homebrew/bin/brew ] && ! tiene brew; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
if ! tiene brew; then
  [ "$BREW" = 0 ] || muere "Homebrew no está instalado (pide la contraseña de administrador: no lo instala este script)" \
    "el usuario debe instalarlo desde https://brew.sh y relanzar ./instalar.sh"
fi

node_ok() { tiene node && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]; }
ffmpeg_ok() { tiene ffmpeg && ffmpeg -hide_banner -encoders 2>/dev/null | grep h264_videotoolbox >/dev/null; }  # sin -q: con pipefail, SIGPIPE

if ! node_ok; then
  if [ "$BREW" = 1 ] && [ -x "$(brew --prefix node@22 2>/dev/null)/bin/node" ]; then :
  elif [ "$BREW" = 1 ]; then brew install node@22
  else muere "hace falta Node ≥ 22" "brew install node@22"; fi
  export PATH="$(brew --prefix node@22)/bin:$PATH"
  node_ok || muere "Node ≥ 22 no responde tras instalarlo"
  aviso "Node 22 de Homebrew es keg-only: añade a tu shell  export PATH=\"$(brew --prefix node@22)/bin:\$PATH\""
fi
ok "Node $(node -v)"

instalar_brew() { # instalar_brew <comando> <fórmula> [comprobación]
  local bin="$1" formula="$2" check="${3:-tiene $1}"
  if eval "$check"; then ok "$bin"; return; fi
  [ "$BREW" = 1 ] || muere "falta $bin" "brew install $formula"
  brew install "$formula"
  eval "$check" || muere "$bin no responde tras brew install $formula"
  ok "$bin (instalado)"
}
instalar_brew ffmpeg ffmpeg ffmpeg_ok
instalar_brew uv uv
instalar_brew git git
if [ "$AWSCLI" = 1 ]; then
  instalar_brew aws awscli
  instalar_brew sam aws-sam-cli
  instalar_brew bun oven-sh/bun/bun
fi

# ════════ 3. Carpetas y credenciales ════════
paso "Carpetas y .env"
mkdir -p brutos resultados proyectos
ok "brutos/ · resultados/ · proyectos/"
if [ -f .env ]; then
  ok ".env ya existe (no se toca)"
else
  cp .env.example .env
  aviso ".env creado vacío desde .env.example: el usuario debe rellenar las claves (nunca en el chat)"
fi
chmod 600 .env

# ════════ 4. Dependencias de Node ════════
paso "Dependencias de Node (raíz, motor y CLI de HyperFrames para Lambda)"
npm_al_dia .
npm_al_dia motor
npm_al_dia benchmark/hyperframes-test
(cd motor && npm run --silent estilos >/dev/null)
ok "estilos copiados a motor/public/estilos"

# ════════ 5. Pipeline de Python ════════
paso "Pipeline de preproceso (tools/, Python 3.12 con uv)"
uv sync --project tools --quiet
ok "tools/.venv ($(tools/.venv/bin/python -V))"
if [ "$MODELOS" = 1 ]; then
  QUE=(whisper pose rvm)
  [ "$ILUSTRADO" = 1 ] && QUE+=(profundidad ampliar)
  echo "  … whisper.cpp con Metal y modelos (${QUE[*]}); la primera vez tarda (≈ 2 GB)"
  tools/kaleidos instalar --que "${QUE[@]}"
  ok "modelos en tools/modelos/"
else
  aviso "sin modelos (--sin-modelos): no habrá transcripción ni flujo con ponente hasta lanzar tools/kaleidos instalar"
fi

# ════════ 6. Chrome for Testing ════════
if [ "$CHROME" = 1 ]; then
  paso "Chrome for Testing (capturas web)"
  if ls "$HOME"/.cache/puppeteer/chrome/*/chrome-mac-arm64 >/dev/null 2>&1; then
    ok "ya está en ~/.cache/puppeteer"
  else
    npx --yes @puppeteer/browsers install chrome@stable --path "$HOME/.cache/puppeteer" >/dev/null
    ok "instalado en ~/.cache/puppeteer"
  fi
fi

# ════════ 7. Skills globales de Claude Code ════════
if [ "$SKILLS" = 1 ]; then
  paso "Skills globales (~/.claude/skills)"
  mkdir -p "$HOME/.claude/skills"
  if [ -d "$HOME/.claude/skills/video-corto" ]; then
    diff -rq -x .DS_Store skills-globales/video-corto "$HOME/.claude/skills/video-corto" >/dev/null 2>&1 \
      && ok "video-corto (igual que la del repo)" \
      || aviso "video-corto ya existe en ~/.claude/skills y difiere de skills-globales/video-corto (no se sobrescribe)"
  else
    cp -R skills-globales/video-corto "$HOME/.claude/skills/"
    ok "video-corto (copiada desde skills-globales/)"
  fi
  # Núcleo de HyperFrames + los flujos que usa kaleidos; la misma versión que la Lambda desplegada
  if npx --yes hyperframes@0.8.86 skills update product-launch-video general-video >/dev/null 2>&1; then
    ok "HyperFrames: hyperframes, hyperframes-*, media-use, product-launch-video, general-video"
  else
    aviso "no se pudieron instalar las skills de HyperFrames: npx hyperframes@0.8.86 skills update product-launch-video general-video"
  fi
fi

# ════════ 8. Verificación ════════
if [ "$LINT" = 1 ]; then
  paso "Verificación del motor (eslint + tsc)"
  if (cd motor && npm run --silent lint >/dev/null 2>&1); then ok "lint y tipos sin errores"
  else aviso "el lint del motor falla: (cd motor && npm run lint) para ver el detalle"; fi
fi

paso "Diagnóstico (scripts/doctor.mjs)"
DOCTOR=0
node scripts/doctor.mjs || DOCTOR=$?

T=$(( $(date +%s) - INICIO ))
printf '\n%skaleidos instalado en %d min %d s.%s\n' "$B" $((T / 60)) $((T % 60)) "$N"
if [ ${#AVISOS[@]} -gt 0 ]; then
  echo "Avisos:"
  for a in "${AVISOS[@]}"; do echo "  ! $a"; done
fi
if [ "$DOCTOR" != 0 ]; then cat <<EOF

Lo que queda (lo hace el usuario, no el agente):
  1. Resolver los ✗ del diagnóstico. Los de .env y AWS son normales en una instalación nueva: el usuario rellena
     .env en su editor con sus claves (AWS de render, ElevenLabs, OpenAI, Apify opcional), nunca en el chat.
  2. Volver a comprobar: ./instalar.sh --comprobar
EOF
fi
echo "Para empezar: en Claude Code, «quiero montar un vídeo» (skill montar-video); con otro agente, docs/MONTAR_VIDEO.md."
exit 0
