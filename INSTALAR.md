# Instalar kaleidos · guía para agentes de IA

Si el usuario te ha dado esta carpeta y te dice **«instala kaleidos»** (o «prepara kaleidos», «pon kaleidos en
marcha», «configura el entorno de kaleidos»), sigue esta guía de principio a fin. Sirve para Claude Code (skill
`instalar-kaleidos`), Codex, Cursor, Gemini CLI o cualquier agente con terminal.

Todo el trabajo lo hace un script idempotente, [`instalar.sh`](instalar.sh): tú compruebas, preguntas una vez,
lo lanzas, lo vigilas, resuelves lo que falle y das el informe. Las personas pueden usar el mismo script a mano
(`./instalar.sh --help`).

## 0. Reglas (mandan sobre todo lo demás)

- **Nada de AWS ni APIs de pago** durante la instalación, ni siquiera lecturas. La infraestructura ya está
  desplegada en `eu-west-1` (inventario en [`aws/recursos.json`](aws/recursos.json)); no se crea ni se despliega nada.
- **Credenciales**: nunca las pidas en el chat, nunca las escribas en `.env`, nunca leas `.env` con `cat`. El script
  crea `.env` vacío desde [`.env.example`](.env.example) y el usuario lo rellena en su editor. El diagnóstico
  (`scripts/doctor.mjs`) solo muestra nombres de variables, nunca valores.
- **Sin `sudo`**: Homebrew y las Command Line Tools de Xcode piden contraseña o un diálogo del sistema. Si faltan, se
  lo dices al usuario con el comando exacto y esperas a que lo haga.
- **OK antes de instalar**: el script descarga ≈ 4 GB, instala paquetes de Homebrew y escribe en `~/.claude/skills` y
  `~/.cache/puppeteer`. Pide confirmación (paso 2) antes de lanzarlo.
- **No borres nada** que ya exista (`.env`, skills de `~/.claude/skills`, `node_modules`, modelos). El script no
  sobrescribe; si algo hay que rehacer, propónlo y espera el OK.
- **Remotion 4.0.529 exacto** en `motor/`: nunca `npm install <paquete>` ni `npm update` ahí (debe coincidir con las
  funciones de Lambda desplegadas). El script usa `npm ci` con el lock.
- **Privacidad** (política de la organización): ningún dato personal de clientes en respuestas ni informes.

## 1. Comprobar

Desde la raíz del repo (la carpeta que contiene `instalar.sh` y `CLAUDE.md`):

```bash
uname -sm                 # Darwin arm64 (Mac con Apple Silicon)
xcode-select -p           # Command Line Tools de Xcode
command -v brew node      # Homebrew y Node (puede no haber ninguno: es normal en un Mac nuevo)
df -h .                   # ≥ 15 GB libres; recomendable ≥ 40 GB (cada proyecto con bruto 4K ocupa varios GB)
```

- **No es macOS** → para: kaleidos depende de Metal, VideoToolbox y Apple Vision. Explícalo y no sigas.
- **Intel** (`x86_64`) → funciona, pero el preproceso será muy lento; avisa y pregunta si sigue.
- **Sin Command Line Tools** → el usuario ejecuta `xcode-select --install` (diálogo del sistema) y te avisa.
- **Sin Homebrew** → el usuario lo instala desde <https://brew.sh> (pide su contraseña) y después
  `eval "$(/opt/homebrew/bin/brew shellenv)"`.
- **Ya instalado antes** → `./instalar.sh --comprobar` te dice qué falta; relanzar el script solo completa lo que falte.

## 2. Preguntar (una sola vez, todo junto)

| Pregunta | Opciones → opción del script |
|---|---|
| ¿Qué vas a hacer con kaleidos? | **Todo** (clases con ponente, narraciones, promos) → sin opción *(recomendado)* · Además **cortos ilustrados 2,5D** → `--ilustrado` (+1 GB) · **Solo promos y shorts de HyperFrames**, sin transcribir → `--sin-modelos` |
| ¿Vas a administrar AWS (redesplegar, revisar recursos)? | No → nada *(recomendado)* · Sí → `--aws-cli` (AWS CLI, SAM CLI, bun) |
| ¿Instalo las skills globales de vídeo en `~/.claude/skills`? | Sí *(recomendado con Claude Code)* · No → `--sin-skills` |

Y la confirmación: «Voy a instalar con Homebrew Node 22, ffmpeg, uv y git (los que falten), descargar ≈ 4 GB
(dependencias de Node y Python, whisper.cpp y sus modelos, Chrome for Testing) y ocupar ≈ 5 GB. Tarda 15–30 min la
primera vez. No toca AWS ni tus claves. ¿Sigo?»

Si el usuario ya dijo lo que quiere («instálalo todo», «solo para HyperFrames»), no preguntes lo que ya sabes: pide
solo la confirmación.

## 3. Lanzar y vigilar

La primera instalación tarda más que el límite habitual de un comando de agente: lánzala **en segundo plano con su
registro** y revisa el registro de vez en cuando (sin filtrarlo con `grep`: los errores de compilación y de descarga
salen en líneas que no esperas).

```bash
./instalar.sh [opciones] > instalar.log 2>&1        # en segundo plano
tail -n 40 instalar.log                              # cada minuto o dos
```

Pasos que verás: `[1] Sistema` → `[2] Paquetes del sistema` → `[3] Carpetas y .env` → `[4] Dependencias de Node` →
`[5] Pipeline de preproceso` (el más largo: Python con torch y la compilación de whisper.cpp con Metal) →
`[6] Chrome for Testing` → `[7] Skills globales` → `[8] Verificación` → `Diagnóstico`. Termina con
`kaleidos instalado en N min` y el resumen del doctor.

## 4. Si algo falla

El script para en el primer error con `✗` y una línea `→` que dice cómo arreglarlo. Arregla y **relánzalo con las
mismas opciones**: lo ya hecho se salta.

| Síntoma | Qué hacer |
|---|---|
| `faltan las Command Line Tools` / `Homebrew no está instalado` | Lo hace el usuario (paso 1). Después, relanza. |
| `Node 22 de Homebrew es keg-only` (aviso) | Que el usuario añada a su `~/.zshrc`: `export PATH="$(brew --prefix node@22)/bin:$PATH"`. |
| Falla `npm ci` (red, `ECONNRESET`, `EAI_AGAIN`) | Relanza. Si insiste, comprueba la red/proxy. Nunca cambies a `npm install` en `motor/`. |
| Falla `uv sync` | Relanza; si sigue, `uv sync --project tools` a mano para ver el error completo. |
| Falla la compilación de whisper.cpp | Lee `tools/vendor/whisper_build.log`. Suele ser falta de Command Line Tools o de disco. |
| Descarga de un modelo cortada o `sha256 inesperado` | Relanza: `curl` reanuda el `.part`; si el sha256 falla, el parcial se borra solo y se baja de nuevo. |
| `no se pudieron instalar las skills de HyperFrames` | `npx hyperframes@0.8.86 skills update product-launch-video general-video` a mano para ver el error. |
| `video-corto ya existe … y difiere` (aviso) | El usuario tiene su propia versión: no la toques. Si quiere la del repo, que lo diga y copias `skills-globales/video-corto`. |
| `el lint del motor falla` (aviso) | `(cd motor && npm run lint)` y repórtalo; no bloquea renders, pero indica un cambio roto. |
| Disco lleno | Para y pide al usuario que libere espacio; no borres nada por tu cuenta. |

Más errores conocidos: [`docs/SOLUCION_PROBLEMAS.md`](docs/SOLUCION_PROBLEMAS.md).

## 5. Credenciales (las pone el usuario)

Al terminar, los `✗` del diagnóstico en `.env` y AWS son **normales**: faltan las claves. Explica al usuario que abra
`.env` en su editor (no en el chat) y rellene:

| Variables | Para qué | De dónde |
|---|---|---|
| `REMOTION_AWS_*` y `AWS_*` (mismas claves) | Render en Lambda (`eu-west-1`) | Del administrador de la cuenta AWS de kaleidos: usuario IAM con la política `aws/politica-usuario-combinada.json` |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (`ELEVENLABS_BASE_URL` para `scripts/tts.mjs`) | Voz, música y efectos | Cuenta de ElevenLabs |
| `OPENAI_API_KEY` | Láminas e imágenes (gpt-image-2) | Cuenta de OpenAI |
| `APIFY_API_KEY` *(opcional)* | Fotografía real de stock | Cuenta de Apify |

Cuando diga que ya está: `./instalar.sh --comprobar` (o `node scripts/doctor.mjs`). La línea `Listo para:` debe
marcar ✓ los flujos que va a usar.

## 6. Informe al usuario

Corto y sin valores de claves:

- Qué se instaló (pasos con ✓) y en cuánto tiempo (lo dice la última línea del script).
- Los avisos (`!`) y qué hacer con cada uno.
- La línea `Listo para:` del diagnóstico.
- Lo que le queda: rellenar `.env` (§5), volver a comprobar y, para empezar, decir «quiero montar un vídeo» (Claude
  Code, skill `montar-video`) o seguir [`docs/MONTAR_VIDEO.md`](docs/MONTAR_VIDEO.md) con otro agente.
- Si es uso comercial en una empresa de más de 3 personas, Remotion necesita licencia
  ([remotion.pro/license](https://www.remotion.pro/license)).

## Qué instala y dónde

| Pieza | Dónde | Tamaño aprox. |
|---|---|---|
| Node 22, ffmpeg (con VideoToolbox), uv, git · opcional AWS CLI, SAM CLI, bun | Homebrew | — |
| Dependencias de Node: raíz (capturas), `motor/` (Remotion 4.0.529), `benchmark/hyperframes-test/` (CLI de HyperFrames 0.8.86 para Lambda) | `node_modules/` de cada una | 1,7 GB |
| Pipeline de Python 3.12 (torch, mediapipe, transformers…) | `tools/.venv/` | 1,3 GB |
| whisper.cpp compilado con Metal + modelos de Whisper, pose y recorte (y con `--ilustrado`, profundidad y ampliación) | `tools/vendor/`, `tools/modelos/` | 1,7 GB (2,1 GB con `--ilustrado`) |
| Chrome for Testing (capturas web) | `~/.cache/puppeteer/` | 0,3 GB |
| Skills globales: `video-corto` (desde `skills-globales/`) y HyperFrames (`hyperframes`, `hyperframes-*`, `media-use`, `product-launch-video`, `general-video`) | `~/.claude/skills/` (las de HyperFrames, también en `~/.agents/skills/`) | < 10 MB |
| `.env` vacío (permisos 600) · `brutos/` · `resultados/` | raíz del repo | — |

## Otros agentes

El script es el mismo. Las skills de HyperFrames quedan en `~/.claude/skills` y en `~/.agents/skills` (la carpeta
compartida que leen Codex y otros agentes); `video-corto` solo en `~/.claude/skills`, y fuera de Claude Code se lee
como procedimiento desde `skills-globales/video-corto/SKILL.md`. Más en [`AGENTS.md`](AGENTS.md) › «HyperFrames sin
Claude Code».
`~/videos-opus` (conocimiento heredado que citan `CLAUDE.md` y `AGENTS.md`) solo existe en el Mac original: si no está,
ignora esas referencias.

## Actualizar

```bash
git pull && ./instalar.sh        # idempotente: reinstala dependencias solo si cambió su lock
```
