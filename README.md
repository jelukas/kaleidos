# kaleidos · fábrica de vídeos

Entra una **grabación**, un **texto** o una **idea**; sale un vídeo con un **estilo** del catálogo, renderizado en
**AWS Lambda** (`eu-west-1`). Lo editorial vive en datos (JSON); el código es el mismo para todos los vídeos. Un
agente (Claude Code o Codex) puede montar un vídeo de principio a fin leyendo esta documentación.

> **Para montar un vídeo:** en Claude Code, usa la skill `montar-video`; con otro agente, sigue
> [`docs/MONTAR_VIDEO.md`](docs/MONTAR_VIDEO.md) y [`docs/FLUJOS.md`](docs/FLUJOS.md).

## Qué se puede hacer

| Camino | Entrada | Motor | Ejemplo real |
|---|---|---|---|
| **Vídeo con ponente** | Grabación en `brutos/` (clase, curso, charla, masterclass) | Remotion (`motor/`): cortes, recorte del ponente, cámara virtual, paneles 2D, 3D en las manos, subtítulos | `dora-milikito`: 10:17, 76 eventos, 0,43 $ de render |
| **Narración con voz TTS** | Un tema o una noticia: el agente escribe la locución y el guion | Remotion en modo narración: voz de ElevenLabs, caja de voz con onda, láminas, capturas, música | `devday-2026`: 4:02, 0,12 $ de render, 16 min 44 s el encargo entero |
| **Generativo** | Idea, web, guion, noticia (sin grabación) | HyperFrames (HTML + GSAP), skills globales `/hyperframes`, `video-corto`, `product-launch-video`, `general-video` | Promos y piezas de `~/videos-opus` |

Siempre: brief confirmado con el usuario, estilo del catálogo, revisión con fotogramas antes de renderizar, **nada en
AWS sin el OK del usuario** con el coste por delante, y tiempo y coste reales en `proyectos/<slug>/informe.md`.

## Requisitos

| | |
|---|---|
| Máquina | Mac con Apple Silicon (probado en M1 Pro, 16 GB): Metal para Whisper, MPS para el recorte y el etalonaje, VideoToolbox |
| Software | Node 22 · ffmpeg 8 (Homebrew, con VideoToolbox; no trae `drawtext`) · `uv` (instala Python 3.12) · git · Command Line Tools de Xcode (`instalar.sh` pone lo que falte salvo Homebrew y las CLT) |
| Opcional | AWS CLI (respaldo del SDK) · AWS SAM CLI y `bun` (solo para desplegar HyperFrames en Lambda) · Chrome for Testing en `~/.cache/puppeteer/` (capturas web) |
| Disco | ~2,1 GB de modelos en `tools/modelos/`; varios GB por proyecto con bruto 4K (el mezzanine de 34 min pesa 1,3 GB) |
| Cuentas | AWS (usuario IAM con la política de `aws/`) · ElevenLabs (voz, música, efectos) · OpenAI (gpt-image-2) · Apify (fotos reales, opcional) |

Las claves van en `.env` (plantilla: [`.env.example`](.env.example)). Nunca se muestran, se copian al chat ni se ponen
en URLs.

## Puesta en marcha (una vez)

```bash
git clone https://github.com/jelukas/kaleidos.git && cd kaleidos
./instalar.sh                 # Homebrew (Node 22, ffmpeg, uv), dependencias, whisper.cpp + modelos, skills, diagnóstico
```

Con un agente de IA basta con abrir la carpeta y decirle **«instala kaleidos»**: sigue [`INSTALAR.md`](INSTALAR.md)
(en Claude Code, skill `instalar-kaleidos`). El script es idempotente (relánzalo para completar o actualizar), no toca
AWS ni APIs de pago y crea `.env` vacío desde [`.env.example`](.env.example): las claves las rellena el usuario.
Opciones: `./instalar.sh --help` (`--ilustrado`, `--sin-modelos`, `--aws-cli`, `--comprobar`…).

Lo que hace por dentro, por si hay que repetir un paso a mano:

```bash
npm ci                                  # raíz: puppeteer-core y simple-icons para scripts/
(cd motor && npm ci && npm run estilos && npm run lint)
(cd benchmark/hyperframes-test && npm ci)                  # CLI de HyperFrames 0.8.86 para su Lambda
uv sync --project tools && tools/kaleidos instalar        # whisper.cpp con Metal + modelos (tools/modelos/)
tools/kaleidos instalar --que profundidad ampliar          # solo si vas a usar ilustraciones 2,5D
npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer   # solo para scripts/capture.mjs
cp -R skills-globales/video-corto ~/.claude/skills/ && npx hyperframes@0.8.86 skills update product-launch-video general-video
node scripts/doctor.mjs                 # diagnóstico del entorno
```

## Ejemplo de 5 minutos: un vídeo narrado de unos 25 s

Gasta unos 200 caracteres de ElevenLabs y nada de AWS hasta que se confirme el render.
<!-- REVISAR: ejemplo sin ejecutar tal cual (sigue la estructura de proyectos/_prueba-narracion, que sí se probó) -->

```bash
tools/kaleidos nuevo ejemplo-narracion --narracion --estilo milikito --escenario --titulo "kaleidos en un minuto"
```

`proyectos/ejemplo-narracion/locucion.json`:

```json
{
  "voz": {},
  "pausaEntreBloques": 0.35,
  "bloques": [
    { "id": "b01", "texto": "Esto es kaleidos, una fábrica de vídeos guiada por datos.", "pausaDespues": 0.5 },
    { "id": "b02", "texto": "Tú escribes la locución, el guion y el estilo; el motor pinta cada fotograma." },
    { "id": "b03", "texto": "Y el render final se hace siempre en la nube, en AWS Lambda." }
  ]
}
```

`proyectos/ejemplo-narracion/guion.json` (los cues son frases de la locución y segundos aproximados, siempre por debajo):

```json
{
  "fixes": {},
  "intro": { "kicker": "Demo", "titulo": "kaleidos", "subtitulo": "Modo narración", "duracion": 4 },
  "capitulos": [],
  "eventos": [
    { "tipo": "titulo", "cue": [0, "esto es kaleidos"], "hasta": [3, "tu escribes la locucion"],
      "antetitulo": "Demo", "texto": "kaleidos", "registro": "show" },
    { "tipo": "panel", "kind": "pasos", "cue": [3, "tu escribes la locucion"], "hasta": [7, "y el render final"],
      "kicker": "Cómo funciona", "titulo": "Tres piezas",
      "items": [ { "cue": [3.5, "la locucion"], "texto": "Locución" },
                 { "cue": [4, "el guion"], "texto": "Guion" },
                 { "cue": [4.5, "el estilo"], "texto": "Estilo" } ] }
  ],
  "outro": { "kicker": "En resumen", "titulo": "kaleidos", "puntos": ["Datos", "Estilo", "Lambda"], "duracion": 5 }
}
```

```bash
tools/kaleidos voz ejemplo-narracion --simular             # cuántos caracteres gastaría
tools/kaleidos voz ejemplo-narracion --max-caracteres 400  # voz con eleven_v4 → work/narracion.m4a
tools/kaleidos transcribir ejemplo-narracion               # marcas por palabra, corregidas contra la locución
tools/kaleidos media ejemplo-narracion && tools/kaleidos linea ejemplo-narracion && tools/kaleidos media ejemplo-narracion
node motor/scripts/stills.mjs ejemplo-narracion --at eventos
#   → motor/out/stills/ejemplo-narracion-milikito-auto/hoja.jpg: míralo
node motor/scripts/lambda.mjs ejemplo-narracion --dry-run --concurrencia max    # plan, coste y tiempo
```

El render real (`node motor/scripts/lambda.mjs ejemplo-narracion --concurrencia max`) solo con el OK del usuario;
después, normalizar el audio y verificar ([`docs/FLUJOS.md`](docs/FLUJOS.md) §6). Para una prueba sin ningún coste
en esta máquina: `(cd motor && node scripts/stills.mjs narracion --at eventos)` sobre el fixture del motor.

## Mapa de carpetas

```
brutos/            material en bruto (nunca se modifica; fuera de git salvo LEEME.md)
proyectos/<slug>/  un vídeo: proyecto.json, BRIEF.md, guion.json, [locucion.json], timeline.json, informe.md,
                   media/ (enlaces para el motor), work/ (intermedios, fuera de git), assets/ (láminas, capturas)
estilos/<estilo>/  estilo.md (formato frame.md) + tokens.json + fonts/ (OFL/Apache) + referencias/ [+ audio/]
motor/             motor Remotion 4.0.529 (src/) + scripts: stills, render-local, medir, estilos, lambda
tools/             pipeline de preproceso (uv, Python 3.12); CLI tools/kaleidos
scripts/           generativa: tts, audio, images, stock, capture, build-news (+ doctor.mjs)
plantillas/        plantillas de arranque por tipo de vídeo
aws/               políticas IAM y recursos.json (inventario de lo desplegado)
docs/              documentación (índice en docs/INDICE.md)
resultados/        vídeos finales <slug>.mp4 (fuera de git)
benchmark/         comparativa Remotion vs HyperFrames
vendor/            clon de HyperFrames para su despliegue en Lambda (fuera de git)
.claude/skills/    skills del proyecto: montar-video, instalar-kaleidos, edicion-ponente, estilos-video, audio-local
skills-globales/   skills que instalar.sh copia a ~/.claude/skills (video-corto)
```

## Documentación

- [`docs/INDICE.md`](docs/INDICE.md): índice de todo.
- [`docs/MONTAR_VIDEO.md`](docs/MONTAR_VIDEO.md): la conversación para montar un vídeo.
- [`docs/FLUJOS.md`](docs/FLUJOS.md): cada flujo con comandos, tiempos y costes reales.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): motores, datos, pipeline, Lambda y buckets.
- [`docs/CONTRATO.md`](docs/CONTRATO.md): formatos de datos. [`docs/METODO_EDICION_IA.md`](docs/METODO_EDICION_IA.md): método.
- [`docs/AWS.md`](docs/AWS.md): recursos, permisos, costes, limpieza. [`docs/ESTILOS.md`](docs/ESTILOS.md): estilos.
- [`docs/SOLUCION_PROBLEMAS.md`](docs/SOLUCION_PROBLEMAS.md) · [`docs/GLOSARIO.md`](docs/GLOSARIO.md).
- Por componente: [`motor/README.md`](motor/README.md), [`tools/PROGRESO.md`](tools/PROGRESO.md),
  [`estilos/README.md`](estilos/README.md), [`benchmark/README.md`](benchmark/README.md).

## Proyectos de ejemplo

| Proyecto | Qué es |
|---|---|
| `dora-videocurso-v1` | Videocurso DORA (13 min, 63 gráficos, 3D) montado a mano en Remotion; Lambda: 196 funciones, 82 s, 0,29 $ |
| `dora-v2` | El mismo bruto con el pipeline guiado por datos (recorte, cámara virtual, 3D en las manos); preproceso completo |
| `dora-milikito` | Reedición a 10:17 con el estilo `milikito` en modo escenario; Lambda: 155 funciones, 2 min 4 s, ≈ 0,43 $ |
| `devday-2026` | Noticias narradas con voz TTS (4:02), estilo `milikito`; Lambda: 195 funciones, 34 s, ≈ 0,12 $ |
| `ref-milikito` | Análisis de una masterclass para crear el estilo `milikito` (no se renderiza) |

## Licencias

Remotion es gratuito para equipos de hasta 3 personas; el uso comercial en una empresa mayor necesita licencia de
Remotion ([remotion.pro/license](https://www.remotion.pro/license)). HyperFrames es Apache-2.0. Las tipografías del
catálogo son solo OFL o Apache-2.0. Los modelos de audio local tienen sus licencias en la skill `audio-local`.
