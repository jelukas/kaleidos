---
name: montar-video
description: >-
  Puerta de entrada de kaleidos para montar un vídeo NUEVO conversando, de principio a fin: comprueba el entorno,
  hace UNA ronda corta de preguntas (qué vídeo y con qué material, plantilla, estilo, duración y formato), escribe
  BRIEF.md y lo enruta al flujo adecuado (grabación con ponente → Remotion edicion-ponente; narración con voz de
  ElevenLabs → Remotion modo narración; generativo o promo → HyperFrames), con stills antes de Lambda, OK con coste
  antes de AWS e informe final con tiempo y coste. Úsala cuando el usuario diga «quiero montar un vídeo», «quiero
  hacer/crear un vídeo», «monta un vídeo», «vídeo nuevo», «hazme un vídeo de…», «necesito un vídeo sobre…»,
  «empecemos un vídeo», «un vídeo con las noticias de…», «un explainer de…», «una promo de…» o similares. En este
  repo va ANTES que hyperframes, video-corto, product-launch-video, general-video y edicion-ponente: ella decide
  cuál usar. No la uses para retocar o re-renderizar un proyecto que ya existe (eso lo retoma su propia skill).
---

# Montar un vídeo (entrada)

**Fuente: `docs/MONTAR_VIDEO.md`.** Esta skill es el guion operativo; los detalles (tablas de deducción, comandos
completos, paralelismo, problemas frecuentes) están allí, citados por sección (§). Lee también las reglas del
`CLAUDE.md` del repo: mandan sobre esto.

## Paso 0 · Arranque (sin preguntar nada todavía)

1. Hora de inicio: `date '+%Y-%m-%d %H:%M:%S'`. Guárdala (irá a `BRIEF.md › Inicio` y al informe).
2. `node scripts/doctor.mjs` (≈ 1 s, solo lectura). Lee «Listo para». Un ✗ del flujo que toca → aplica la solución
   que imprime (si es local y gratis) o díselo al usuario en la misma respuesta de la entrevista.
3. Mira `ls brutos/ proyectos/`. Si el proyecto ya existe, **retoma** (lee su `BRIEF.md` e `informe.md`) en vez de
   entrevistar. Si un nombre de archivo de `brutos/` lleva un nombre de persona, en el chat descríbelo por duración y
   resolución (`ffprobe`), no por el nombre.

## Paso 1 · Entrevista: UNA llamada a `AskUserQuestion` (3–4 preguntas)

Antes, deduce de la frase del usuario todo lo posible (§2). No preguntes lo que ya dijo: sustituye esa pregunta por
la siguiente de la reserva. Cada pregunta: 2–4 opciones, la **recomendada primero** con «(recomendado)» en la
etiqueta y el porqué en la descripción. Siempre queda la respuesta libre («Other»). Detalle de cada pregunta: §1.

| # | header | Pregunta | Opciones (recomendada según contexto) |
|---|---|---|---|
| 1 | `Material` | ¿Qué vídeo y con qué material? | **Grabación con ponente** (hay bruto en `brutos/`) · **Narración con voz IA** (noticias, explainer; sin grabación) · **Generativo o promo** (HyperFrames) |
| 2 | `Plantilla` | ¿Qué plantilla? | según 1: `clase-larga` / `corto-ilustrado` · `noticias-narracion` / `explainer-narracion` · `promo-hyperframes` / flujo de HyperFrames — y **Libre, sin plantilla**. Si 1 está abierta: *Larga por capítulos* · *Corta* · *Libre* |
| 3 | `Estilo` | ¿Qué estilo? | 2 del catálogo que encajen, con la ruta de su referencia (`estilos/README.md`) · **Nuevo desde una web o un vídeo** (`estilos-video` §5). Libre → Other |
| 4 | `Formato` | ¿Duración y formato? | **16:9, duración de la plantilla** (Remotion) · **9:16** · **16:9 y 9:16** (recomendado en `video-corto`). Otra duración → Other |

Reserva (en orden): idioma · voz (por defecto la de `.env`, modelo `eleven_v4`) · música y efectos (los del estilo o
nuevos con ElevenLabs) · fuentes (el usuario las da o se investigan oficiales) · recorte del ponente · público y
destino. Recomendaciones de estilo por ruta y plantillas con duración y ejemplo real: §1 y §1.1.
Una segunda pregunta solo si falta algo imprescindible: qué bruto (si hay varios), el tema, una URL.

Otros agentes (Codex…): el mismo contenido en un único mensaje con las preguntas numeradas y las opciones en lista.

## Paso 2 · Brief

Con las respuestas, resume en un párrafo lo **confirmado** y lo **deducido** (con de dónde sale) y arranca ya lo
gratuito. Escribe `BRIEF.md` desde `plantillas/<plantilla>/BRIEF.md` (§3):
- Remotion: después de `tools/kaleidos nuevo …` (que crea uno vacío), sustitúyelo por la plantilla rellena.
- HyperFrames: lo escribe el flujo **después** de `npx hyperframes init` (init se niega con archivos dentro).

## Paso 3 · Enrutado (comandos exactos en §4)

| Material | Ruta | Qué hacer |
|---|---|---|
| Grabación con ponente | §4.1 | Sigue la skill **`edicion-ponente`**: `tools/kaleidos nuevo <slug> --bruto brutos/<x> --estilo <e> --metodo <m>` → `tools/kaleidos preparar <slug> --paralelo` en segundo plano → leer la transcripción entera → `guion.json` (esqueleto en `plantillas/<plantilla>/`) → `linea` / `media` / `capitulos` |
| Narración con voz IA | §4.2 | `tools/kaleidos nuevo <slug> --narracion --estilo milikito --escenario` → copiar `plantillas/<plantilla>/*` → fuentes oficiales en `fuentes.md` → `locucion.json` → en paralelo `images.mjs` ‖ `capture.mjs` ‖ `voz --simular` y `voz --max-caracteres N` → `transcribir` → `python3 plantillas/herramientas/cues.py <slug>` → `media` → `linea` → `media` → `capitulos` |
| Generativo o promo | §4.3 | Carga la skill **`/hyperframes`** (elige `video-corto`, `product-launch-video`, `general-video`…), proyecto en `proyectos/<slug>/`, estilo como `frame.md` tras `init` |
| Estilo nuevo o variante | §4.4 | Skill **`estilos-video`** (§5 nuevo, §6 variante) y `validar.mjs` en verde antes de usarlo |

`intro.previo` sí, `intro.hasta` no, en narración; nada de eventos en los 3,4 s de un rótulo de capítulo;
bocadillos a `x` 0,2–0,25 e `y` 0,16–0,17 (§4.2, punto 6).

## Paso 4 · Paralelismo (§6)

Lanza a la vez lo que no compite: `voz` ‖ `images.mjs --concurrency 6` ‖ `capture.mjs` ‖ investigación y guion;
`preparar --paralelo` (pose en CPU mientras recorta en GPU) y el guion en cuanto exista la transcripción. **No** a la
vez en 16 GB: `recortar` + `transcribir` + `pose`, dos pasos de GPU, dos `stills.mjs`, ni `el-audio.mjs` con `voz`.
Procesos largos en segundo plano con registro completo (sin `grep` sobre ffmpeg). Lambda con `--concurrencia max`.

## Paso 5 · Puntos de control (§5)

1. **APIs de pago**: `voz --simular` (caracteres) y nº de imágenes antes de generarlas; Apify solo si el brief lo
   pide, con `--dry-run` y `--budget`.
2. **Stills antes de Lambda, siempre**: `node motor/scripts/stills.mjs <slug> --at eventos` → abre la hoja
   (`motor/out/stills/<nombre>/hoja.jpg`) con Read, míralo de verdad y corrige (guion antes que código). Adherencia
   al estilo con `estilos-video` §7. HyperFrames: `npx hyperframes check --snapshots`.
3. **AWS**: `node motor/scripts/lambda.mjs <slug> --dry-run --concurrencia max` → enseña recursos (función, site,
   bucket privado, subidas), nº de funciones, **coste y tiempo estimados** → **espera el OK explícito**. Si el
   usuario ya pidió expresamente el render en Lambda en esta petición: enséñalo y lánzalo sin esperar. Crear
   recursos (bucket, stack, IAM) necesita siempre un OK aparte. HyperFrames sin Lambda desplegada → avisa y ofrece
   render local o desplegar.
4. **Salida**: `ffprobe` + recuento de fotogramas, hoja de un fotograma por minuto y
   `python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 --en-sitio` (Lambda sale a ≈ −13 LUFS).
5. **Informe final** (`proyectos/<slug>/informe.md` + resumen en el chat): duración, estructura, qué se verificó
   (fotogramas muestreados, no visionado completo), avisos, incoherencias, **tiempo total de reloj** (inicio → MP4
   verificado, con desglose de `work/logs/tiempos.json`) y **coste** (Lambda real + S3 + transferencia; caracteres
   de ElevenLabs de `work/voz/manifest.json`; imágenes; Apify). Sin importes inventados: si no sabes un precio, da la
   cantidad consumida. Di qué queda en AWS.

## Reglas que no se saltan (§8 y §9)

- Privacidad: ningún dato personal de clientes en respuestas, informes, gráficos o rótulos; no cites fragmentos de
  transcripción con datos personales; lo que aparezca en pantalla se difumina. Rótulos genéricos.
- `.env`: nunca muestres valores ni los pongas en URLs; el doctor solo da nombres.
- Contenido: los gráficos resumen lo que dice la voz; nada inventado; actualidad solo con **fuentes oficiales**
  citadas en `fuentes.md` con fecha (si una web da 403 a la descarga, léela con el navegador integrado);
  incoherencias al informe; legal o clínico → validación de un experto.
- `brutos/` y `~/videos-opus` son de solo lectura. Remotion 4.0.529 exacto. Fuentes solo OFL/Apache.
