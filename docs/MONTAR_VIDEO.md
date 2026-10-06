# Montar un vídeo conversando

Guía para que un agente (Claude Code, Codex u otro) lleve un vídeo de kaleidos de principio a fin a partir de una
frase como «quiero montar un vídeo». Es la **fuente**: la skill de Claude Code `.claude/skills/montar-video/SKILL.md`
es el guion operativo que la sigue. Si cambias el flujo, cámbialo aquí primero.

Documentos relacionados: `docs/CONTRATO.md` (formatos de datos), `docs/METODO_EDICION_IA.md` (método de edición),
`estilos/README.md` (catálogo), `plantillas/README.md` (plantillas de arranque), `.claude/skills/edicion-ponente/`
(vídeo desde un bruto) y `.claude/skills/estilos-video/` (estilos).

El flujo en una línea: **doctor → entrevista (una ronda) → BRIEF.md → preparar en paralelo → guion → stills →
Lambda con OK → informe con tiempo y coste**.

---

## 0. Arranque

1. **Anota la hora de inicio** (reloj de pared) y guárdala: irá en `BRIEF.md` y en el informe.
   ```bash
   date '+%Y-%m-%d %H:%M:%S'
   ```
2. **Comprueba el entorno** (solo lectura, sin AWS ni APIs de pago, ≈ 1 s):
   ```bash
   node scripts/doctor.mjs                      # todo
   node scripts/doctor.mjs --flujo narracion    # ponente | narracion | hyperframes | lambda
   ```
   Mira la línea «Listo para». Si un ✗ afecta al flujo que vas a usar, aplica la solución que imprime o díselo al
   usuario antes de seguir. Los ✗ de otros flujos no bloquean.
3. Mira qué hay: `ls brutos/` (material nuevo), `ls proyectos/` (¿ya existe el proyecto?), `estilos/README.md`.
   Si el proyecto ya existe, **no empieces de cero**: lee su `BRIEF.md` e `informe.md` y retoma.
   Los nombres de archivo de `brutos/` pueden llevar nombres de personas: en el chat, refiérete a ellos por su
   duración y resolución si es así.

## 1. La entrevista (una sola ronda)

**Reglas**

- **Una ronda de 3–4 preguntas**, cada una con 2–4 opciones y **una recomendada** (la primera, con «(recomendado)» en
  la etiqueta y el porqué en la descripción). Siempre cabe una respuesta libre.
- No preguntes lo que el usuario ya ha dicho ni lo que se deduce (§2). Si una de las cuatro preguntas ya está
  respondida, sustitúyela por la primera de la **reserva** que falte.
- Solo una segunda pregunta si falta algo **imprescindible** para empezar: qué bruto (si hay varios), el tema o el
  texto de una noticia, la URL de un producto.
- En Claude Code se hace con la herramienta `AskUserQuestion` (una llamada, hasta 4 preguntas). En otros agentes,
  un único mensaje con las preguntas numeradas y las opciones en lista (a, b, c), la recomendada primero.

**Las cuatro preguntas**

1. **Qué vídeo y con qué material** (decide el motor y la ruta, §4):
   - a. *Grabación con ponente* — hay un bruto en `brutos/` (clase, charla, pieza con presentador) → Remotion,
     skill `edicion-ponente` (§4.1). **Recomendada si hay un bruto nuevo en `brutos/` o el usuario lo menciona.**
   - b. *Narración con voz IA* — sin grabación: noticias, explainer o resumen con voz de ElevenLabs → Remotion en
     modo narración (§4.2). **Recomendada para actualidad y explicaciones de 1–4 min.**
   - c. *Generativo o promo* — sin grabación, con o sin voz: promo de producto, short muy dinámico, ambiente,
     motion graphics → HyperFrames, skill `/hyperframes` (§4.3). **Recomendada para promos y verticales.**
2. **Plantilla** (o ninguna): ver la tabla de §1.1. Opciones típicas según la respuesta 1:
   - ponente: *clase-larga* (> 3 min) · *corto-ilustrado* (≤ 2–3 min) · *libre*;
   - narración: *noticias-narracion* (3–4 min, 5 bloques) · *explainer-narracion* (60–120 s) · *libre*;
   - generativo: *promo-hyperframes* · un flujo concreto de HyperFrames (`video-corto`, `product-launch-video`,
     `general-video`) · *libre*.
   Si la pregunta 1 también está abierta, formula la 2 por forma: *larga por capítulos* (clase-larga /
   noticias-narracion) · *corta* (corto-ilustrado / explainer-narracion / promo) · *libre*.
3. **Estilo**: 2 del catálogo que encajen (con la ruta de su referencia principal, `estilos/README.md`) + *nuevo
   desde una web, una marca o un vídeo* (skill `estilos-video` §5) + *libre* (respuesta abierta). Recomendado por
   ruta: ponente largo → `clase-oscura-cristal` o `curso-azul` (o `milikito` si quiere show); ponente corto →
   `acuarela-ilustrada`; narración → `milikito` (el único con escenario, que es lo que pinta el motor en narración);
   noticia en HyperFrames → `senal-informativo`; short → `vox-corto`; producto cercano → `cuaderno-a-mano` o
   `dibujos-animados`; marca Ensaya → `ensaya-conversation-club`; ambiente → `rainy-cabin`.
4. **Duración y formato**: *16:9 con la duración de la plantilla* (recomendado en Remotion) · *9:16* · *16:9 y 9:16*
   (recomendado en `video-corto`) · libre («otra duración»). En Remotion el 9:16 es básico (composición `Vertical`
   sin pulir en escenario, §4.2): si el vertical es lo principal, recomienda HyperFrames `video-corto`.

**Reserva** (en este orden, solo si una de las cuatro ya estaba respondida y esto no se deduce):
idioma · voz (id de ElevenLabs; por defecto la de `.env`) · música y efectos (los del estilo o nuevos con
ElevenLabs) · fuentes (el usuario da texto/enlaces o se investiga con fuentes oficiales) · recorte del ponente ·
público y destino (YouTube, LMS, redes).

### 1.1 Plantillas

Detalle y ejemplos reales en `plantillas/README.md`.

| Plantilla | Ruta | Duración típica | Estilo recomendado | Ejemplo real |
|---|---|---|---|---|
| `clase-larga` | ponente · Remotion | 8–40 min (un gráfico cada ~40 s) | `clase-oscura-cristal`, `curso-azul` (show: `milikito`) | `proyectos/dora-milikito` (con `milikito`) |
| `corto-ilustrado` | ponente · Remotion | 30 s – 3 min, 1:1 con el original | `acuarela-ilustrada` | — (método A de `docs/METODO_EDICION_IA.md`) |
| `noticias-narracion` | narración · Remotion | 3–4 min, intro + 5 bloques + cierre | `milikito` (escenario) | `proyectos/devday-2026` |
| `explainer-narracion` | narración · Remotion | 60–120 s | `milikito` (registro editorial) | `proyectos/_prueba-narracion` (mínimo) |
| `promo-hyperframes` | generativo · HyperFrames | 15–60 s | `vox-corto`, `ensaya-conversation-club`, `cuaderno-a-mano` | promos de Ensaya en `~/videos-opus` (solo lectura) |
| *libre* | cualquiera | la que pida | recomendar 2–3 (`estilos-video`) | — |

## 2. Lo que se deduce sin preguntar

Todo esto va a `BRIEF.md` en la sección **«Deducido»**, con de dónde sale, para que el usuario lo corrija de un
vistazo.

| Campo | Valor por defecto | De dónde |
|---|---|---|
| Slug | `tema-año` en minúsculas con guiones (`devday-2026`) | el tema |
| Idioma | `es` | la conversación |
| Voz | `ELEVENLABS_VOICE_ID` de `.env` (`locucion.json › voz: {}`); modelo **Eleven v4** (`eleven_v4`: `ELEVENLABS_MODEL_ID` de `.env` y predeterminado de `tools/kaleidos voz`). Opción rápida: `"voz": {"modelo": "eleven_v4_turbo"}`. Música y efectos no cambian de modelo | `.env` (nunca muestres el id) |
| Música y efectos | los de `estilos/<estilo>/audio/` si existen (hoy solo `milikito`: `tools/kaleidos nuevo` los declara solo); si no, lo que diga `tokens.json › audio` del estilo; nuevos con ElevenLabs (`scripts/el-audio.mjs`) solo si se piden | el estilo |
| Fuentes | tema de actualidad → investigación con **fuentes oficiales** (web y notas del organismo o la empresa, BOE, EUR-Lex, documentación oficial) y `fuentes.md` con fecha de consulta | el tema |
| Recorte del ponente | sí si el fondo es liso (`work/analisis/resumen.md` lo dice tras `analizar`) | el bruto |
| fps y resolución | los del bruto (1080p de salida); narración 1920×1080 a 25 fps | el bruto / `nuevo` |
| Formato | 16:9 salvo destino Shorts/Reels/TikTok | el destino |
| Densidad | clase: un gráfico cada ~40 s; `milikito`: algo nuevo cada 8–12 s; noticias: un cambio cada 3–10 s | la plantilla |
| Método | > 3 min → `clase-larga`; ≤ 2–3 min → `corto-ilustrado` | la duración del bruto |
| Render | Remotion: **siempre AWS Lambda** (`eu-west-1`). HyperFrames: Lambda si el stack está desplegado; si no, avisar y ofrecer render local o desplegarlo | `aws/recursos.json` |
| Público y destino | el que sugiera el tema (curso → LMS; noticia → YouTube) | el tema |

## 3. `BRIEF.md`

- **Remotion** (ponente y narración): `tools/kaleidos nuevo` crea `proyectos/<slug>/BRIEF.md` con una plantilla vacía.
  Sustitúyela por la de `plantillas/<plantilla>/BRIEF.md` rellena. Siempre tres bloques separados:
  **Confirmado con el usuario** (lo que respondió, con sus palabras si importan), **Deducido** (tabla de §2 con el
  origen) e **Inicio** (hora de §0). El resto de secciones (objetivo, público, estructura, gráficos, fuentes,
  privacidad, entregables) como en la plantilla.
- **HyperFrames**: el `BRIEF.md` lo escribe el propio flujo **después** de `npx hyperframes init` (que se niega a
  inicializar una carpeta con archivos), con su frontmatter (`workflow`, `flow`, `storyboard`, `message`, `aspect`,
  `language`, `length`…). `plantillas/promo-hyperframes/BRIEF.md` es el modelo para rellenarlo. Añade al final los
  bloques «Deducido» e «Inicio».
- El brief resume lo confirmado: **revisar no es confirmar**. Enséñaselo al usuario en un párrafo y arranca solo lo
  que no gasta (§5, punto 1).

## 4. Enrutado

Todos los comandos se lanzan desde la raíz del repo. Los largos, en segundo plano y con registro (nunca filtres los
logs de ffmpeg con `grep`). En macOS no hay `timeout`: `perl -e 'alarm 600; exec @ARGV' <cmd>`.

### 4.1 Grabación con ponente (Remotion · skill `edicion-ponente`)

Método completo en `.claude/skills/edicion-ponente/SKILL.md` y `docs/METODO_EDICION_IA.md`. Resumen operativo:

```bash
node scripts/doctor.mjs --flujo ponente
# Una vez por máquina, si el doctor lo pide: tools/kaleidos instalar · cd motor && npm install && npm run estilos

tools/kaleidos nuevo <slug> --bruto brutos/<archivo> --estilo <estilo> --metodo clase-larga \
  --titulo "Título" --prompt "siglas, normas, productos del dominio"      # [--sin-recorte] [--escenario]
#   mismo bruto ya preparado en otro proyecto → añade --desde-proyecto <otro> (enlaces duros, sin repetir preproceso)
cp plantillas/clase-larga/BRIEF.md proyectos/<slug>/BRIEF.md             # y rellénalo (§3)
tools/kaleidos preparar <slug> --paralelo > proyectos/<slug>/work/logs/preparar.log 2>&1   # en segundo plano
```

Mientras corre (§6): `work/analisis/resumen.md` (fondo, planos, gestos) → decide el recorte; en cuanto exista
`work/transcripcion.txt`, **léela entera** y escribe `guion.json` partiendo de `plantillas/<plantilla>/guion.json`
(cortes de tomas falsas, capítulos, eventos por frase clave, `fixes`; contrato §2 y §7). Los cues se pueden escribir
solo con la frase y dejar que `python3 plantillas/herramientas/cues.py <slug>` ponga los segundos (avisa de las
frases repetidas: en una clase larga, da un segundo aproximado). Con `milikito`, láminas y capturas: `images.json`
y `captures.json` como en `plantillas/noticias-narracion/`.

```bash
node scripts/images.mjs <slug> --quality medium      # si hay láminas (images.json)
node scripts/capture.mjs <slug>                      # si hay capturas (captures.json)
tools/kaleidos media <slug>                          # enlaces en media/ (láminas, capturas, audio del estilo)
tools/kaleidos linea <slug>                          # → timeline.json; repetir hasta 0 errores (los avisos, leerlos)
tools/kaleidos media <slug>                          # vuelve a enlazar el timeline.json nuevo
tools/kaleidos capitulos <slug>                      # capitulos.txt (YouTube)
```

**corto-ilustrado**: `--metodo corto-ilustrado` (montaje 1:1, sin cortes de silencio). Las ilustraciones van a
`proyectos/<slug>/work/ilustraciones/` (fotogramas limpios del bruto o generadas con `images.json` y copiadas allí) y:

```bash
tools/kaleidos ampliar <slug>        # → media/extras/<nombre>_x2.png   (Real-ESRGAN x2plus)
tools/kaleidos profundidad <slug>    # → media/extras/<nombre>_profundidad.png (Depth Anything V2)
```
El evento es `{"tipo": "ilustracion", "imagen": "<nombre>_x2", "profundidad": "<nombre>_profundidad", …}`.
`ampliar` y `profundidad` usan la GPU: no a la vez que `recortar`.

Después, revisión (§5, punto 3) y Lambda (§5, punto 4).

### 4.2 Narración con voz IA (Remotion · modo narración)

Sin bruto ni ponente: la locución (ElevenLabs) es la fuente y manda el reloj. El motor pinta siempre el escenario
(caja de diapositiva + caja con la onda de la voz), así que el estilo recomendado es `milikito`; con otros estilos
el escenario sale con valores por defecto (sin probar: stills antes de nada). Contrato: `docs/CONTRATO.md` §8;
reglas de `linea` en narración: cabecera de `tools/src/kaleidos_tools/linea.py`.

Orden real del ejemplo `proyectos/devday-2026` (3:50 de locución, encargo completo en 16 min 44 s):

```bash
node scripts/doctor.mjs --flujo narracion
tools/kaleidos nuevo <slug> --narracion --estilo milikito --escenario --titulo "Título" \
  --prompt "Siglas, Productos, Nombres propios con su grafía"
cp plantillas/noticias-narracion/{BRIEF.md,locucion.json,guion.json,images.json,captures.json,fuentes.md} proyectos/<slug>/
#   explainer: cp plantillas/explainer-narracion/{BRIEF.md,locucion.json,guion.json,images.json} proyectos/<slug>/
```

1. **Fuentes** (si es actualidad): busca y lee las fuentes oficiales; apunta cada dato con su URL y la fecha de
   consulta en `fuentes.md`. Lo que no se pueda verificar no entra en la locución. Si una web oficial devuelve 403
   a la descarga directa (p. ej. openai.com con WebFetch), léela con el navegador integrado.
2. **Locución** (`locucion.json`): bloques de 1–3 frases (`b01`, `b02`…; devday: 15 bloques), ≈ 150 palabras por
   minuto, `pausaDespues: 0.7` al cerrar cada bloque temático; cifras y siglas escritas como se dicen («GPT seis
   punto uno») y su grafía en pantalla en `guion.json › fixes`. `voz: {}` usa la voz y el modelo de `.env`
   (`eleven_v4`); otra voz: `"voz": {"id": "<voice_id>"}`; más rápido: `"modelo": "eleven_v4_turbo"`.
3. **En paralelo** (§6), mientras se escribe el guion:
   ```bash
   node scripts/images.mjs <slug> --quality medium --concurrency 6   # láminas (images.json)
   node scripts/capture.mjs <slug>                                   # capturas de las fuentes (captures.json)
   tools/kaleidos voz <slug> --simular                               # bloques y caracteres que se gastarían
   tools/kaleidos voz <slug> --max-caracteres <N>                    # N = lo que dijo --simular (tope de gasto)
   ```
   `voz` deja `work/narracion.m4a` (−16 LUFS) y `work/voz/manifest.json`. Cambiar un bloque solo regenera ese
   bloque (caché por texto). Si ElevenLabs devuelve 429, baja `--concurrencia`.
4. ```bash
   tools/kaleidos transcribir <slug>            # palabras con tiempos, corregidas contra el texto de locucion.json
   ```
5. **Guion** (`guion.json`): escríbelo con **frases literales de la locución** y deja que la herramienta ponga los
   segundos desde `work/transcripcion.json` (generaliza `devday-2026/work/guion/eventos.py`):
   ```bash
   python3 plantillas/herramientas/cues.py <slug> --estimar --comprobar   # antes de la voz: frases que no existen
   python3 plantillas/herramientas/cues.py <slug>                         # tras transcribir: escribe los segundos
   ```
   `intro.previo` y `outro.coda` = segundos de música sin voz (4–5 s). Disposiciones solo `completa` o `voz`; sin
   `gesto3d` ni `cortes`.
6. ```bash
   tools/kaleidos media <slug> && tools/kaleidos linea <slug> && tools/kaleidos media <slug> && tools/kaleidos capitulos <slug>
   ```
   Errores típicos de `linea` en narración: evento dentro del rótulo de capítulo (3,4 s) → cue más tarde o quita el
   `titulo` que repite el capítulo; `intro.hasta` alarga la intro y se traga los primeros eventos → con narración,
   solo `intro.previo`; bocadillos arriba en el centro (`y` < 0,15) tapan las fichas de capítulo → `x` ≈ 0,2–0,25 e
   `y` ≈ 0,16–0,17.
7. Revisión (§5, punto 3), Lambda con `--concurrencia max` (§5, punto 4; devday: 195 funciones, 34 s de render,
   0,12 $) y **normalización del audio** (§5, punto 5): la mezcla sale de Lambda a ≈ −13 LUFS.

**9:16 en Remotion**: `nuevo --narracion` fija 1920×1080 y la composición `Vertical` del escenario es básica (la
apertura y el cierre de marca salen recortados). Para un vertical de verdad, HyperFrames `video-corto`.
<!-- REVISAR: cuando el motor pula el vertical del escenario, documentar aquí `--comp Vertical` en stills y lambda. -->

### 4.3 Generativo o promo (HyperFrames · skill `/hyperframes`)

Se entra **siempre** por la skill `/hyperframes` (Claude Code; en otros agentes, léela en
`~/.claude/skills/hyperframes/SKILL.md`), que elige el flujo:

| Caso | Flujo |
|---|---|
| Short o explainer muy dinámico con voz, 9:16 y 16:9 a la vez | `video-corto` |
| Promo, lanzamiento o demo de un producto o una web (hay URL) | `product-launch-video` |
| Explicar un tema con visuales inventados, sin producto | `faceless-explainer` (vía `/hyperframes`) |
| Pieza animada corta sin voz (< 10 s): título, cifra, logo | `motion-graphics` (vía `/hyperframes`) |
| Todo lo demás, piezas largas, ambiente, montajes | `general-video` |
| Informativo «SEÑAL» desde `story.json` | `scripts/build-news.mjs` + estilo `senal-informativo` |

En kaleidos el proyecto vive en `proyectos/<slug>/` (no en `videos/`):

```bash
node scripts/doctor.mjs --flujo hyperframes
mkdir -p proyectos/<slug> && cd proyectos/<slug>
# el Setup del flujo ejecuta `npx hyperframes init .` (video-corto: `npx hyperframes@latest init . --non-interactive
# --example blank`) y escribe BRIEF.md (modelo: plantillas/promo-hyperframes/BRIEF.md). Después, el estilo:
cp ../../estilos/<estilo>/estilo.md frame.md
mkdir -p assets/fonts && cp ../../estilos/<estilo>/fonts/* assets/fonts/
```

Apoyo en `scripts/`: `tts.mjs` (voz; usa el endpoint `ELEVENLABS_BASE_URL`), `audio.mjs` / `el-audio.mjs` (música y
efectos), `images.mjs` (gpt-image-2), `stock.mjs` (fotos reales vía Apify, **de pago por resultado**: `--dry-run` y
`--budget` antes), `capture.mjs` (capturas web). Audio local sin ElevenLabs **solo si el usuario lo pide** (skill
`audio-local`). Verificación: `npx hyperframes check` y `node estilos/_esquema/adherencia.mjs <estilo> proyectos/<slug>`.

**Render**: Lambda con el stack `hyperframes-kaleidos` (desplegado el 2026-09-30; `aws/recursos.json › hyperframes`).
El CLI empaqueta **toda** la carpeta del proyecto: renderiza siempre desde una copia **sin `node_modules`** (con ellos
subió 286 MiB y tardó 6 min; limpia, 2 MB y 23 s). La versión tiene que ser la del handler desplegado (0.8.86):

```bash
S=$(mktemp -d) && rsync -a --exclude node_modules --exclude .hyperframes proyectos/<slug>/ "$S/p/"
( set -a; . ./.env; set +a; export AWS_REGION=eu-west-1
  npx --yes hyperframes@0.8.86 lambda render "$S/p" --stack-name=hyperframes-kaleidos --region=eu-west-1 \
    --width 1920 --height 1080 --fps 30 --format mp4 --quality standard \
    --chunk-size 90 --max-parallel-chunks 16 --wait --wait-interval-ms 2000 )
# descarga: aws s3 cp <Output s3://…/output.mp4> resultados/<slug>.mp4   (bucket privado del stack)
```

Coste de referencia: 30 s a 1080p/30 fps (900 f, 10 trozos) = 0,02 $ y 23 s de reloj. Como en todo AWS: enseña coste y
espera OK salvo que el usuario ya haya pedido el render en Lambda. Render local (`npx hyperframes render --quality
delivery --output ../../resultados/<slug>.mp4`) solo si el usuario lo prefiere.

### 4.4 Estilo nuevo, variante o libre

- «Libre» sin más: recomienda 2–3 del catálogo con su referencia y deja elegir (skill `estilos-video` §1).
- «A partir de esta web / marca / vídeo»: skill `estilos-video` §5 (5a web, 5b vídeo, 5c descripción). Solo fuentes
  OFL/Apache; `node estilos/_esquema/validar.mjs <estilo>` en verde antes de usarlo; `cd motor && npm run estilos`
  para el motor (si el estilo cambia, el site de Lambda se vuelve a subir: sale en el dry-run).
- «Como X pero…»: variante (`estilos-video` §6).

### 4.5 Música y efectos nuevos en Remotion

Solo `milikito` trae audio (`estilos/milikito/audio/`: sintonía, base, cierre y 6 efectos; `nuevo` los declara en
`proyecto.json › audio`). Para otro estilo o música nueva, con ElevenLabs:

```bash
node scripts/el-audio.mjs <spec.json>     # spec: {"out": "proyectos/<slug>/assets/audio", "music": {...}, "sfx": {...}}
ln proyectos/<slug>/assets/audio/sfx/*.wav proyectos/<slug>/assets/audio/   # `media` no mira subcarpetas
```
y declara `proyecto.json › audio` como en `proyectos/devday-2026/proyecto.json`, con `"origen":
"proyectos/<slug>/assets/audio"` y las claves de los archivos (`sintonia`, `base`, `cierre`, `sfx-pop`…).
No lances `el-audio.mjs` a la vez que `voz` (§6).
<!-- REVISAR: camino sin probar de principio a fin; mejor que `tools/kaleidos media` busque también en `sfx/`. -->

## 5. Puntos de control

1. **Tras la entrevista**: resumen del brief (confirmado / deducido). Se arranca lo que no gasta: `nuevo`,
   `preparar`, investigación, borrador de locución y guion.
2. **APIs de pago** (no son AWS, pero cuestan): `voz --simular` antes de `voz` (caracteres), número de imágenes de
   `images.json` antes de `images.mjs`. Van dentro del brief confirmado; se anotan en el informe. Apify (`stock.mjs`)
   solo si el brief lo pide, con `--dry-run` y `--budget`, y con OK si supera lo previsto.
3. **Antes de Lambda, siempre imágenes**:
   ```bash
   cd motor && npm run estilos && cd ..                       # si cambió algún estilo
   node motor/scripts/stills.mjs <slug> --at eventos          # un fotograma por evento, rótulos, intro y cierre
   ```
   Abre la hoja de contactos (`motor/out/stills/<nombre>/hoja.jpg`) y mírala: encuadres que tapan títulos, textos
   fuera de caja, contraste, 3D que no se pinta, subtítulos, bocadillos. Adherencia al estilo (`estilos-video` §7).
   Corrige datos (guion) antes que código. En HyperFrames: `npx hyperframes check --snapshots`.
4. **AWS (Remotion Lambda)**:
   ```bash
   node motor/scripts/lambda.mjs <slug> --dry-run --concurrencia max
   ```
   Enseña al usuario: función y región, site (nuevo o reutilizado), subidas al **bucket privado** (tamaño), número de
   funciones, **coste estimado** (rango) y **tiempo estimado**. **Espera su OK explícito.** Excepción: si el usuario
   ya pidió expresamente el render en Lambda en esta misma petición, enseña esos datos y lánzalo sin esperar.
   Crear recursos nuevos (bucket, stack, políticas IAM) necesita siempre un OK aparte.
   ```bash
   node motor/scripts/lambda.mjs <slug> --concurrencia max   # → resultados/<slug>.mp4 y sección de coste en informe.md
   node motor/scripts/lambda.mjs <slug> --reanudar           # si se corta
   ```
5. **Verificación de la salida**: `ffprobe` (duración, códecs, fps, recuento de fotogramas frente a
   `timeline.json › duracion`), una hoja con un fotograma por minuto y sonoridad. La mezcla de Lambda sale a
   ≈ −13 LUFS con picos > 0 dBTP: normalízala en local (dos pasadas, vídeo copiado, comprueba fotogramas):
   ```bash
   python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 --en-sitio   # −16 LUFS / −1,5 dBTP
   ```
   <!-- REVISAR: quitar este paso cuando el motor limite el bus de mezcla (pendiente en proyectos/dora-milikito/informe.md). -->
6. **Informe final** (`proyectos/<slug>/informe.md` y resumen en el chat): duración del vídeo, estructura, qué se
   verificó (fotogramas muestreados, no visionado completo), avisos de `linea`, incoherencias del material, **tiempo
   total** (§7) y **coste** (Lambda real + S3 + transferencia de `informe.md`; caracteres de ElevenLabs de
   `work/voz/manifest.json`; número de imágenes; Apify si hubo) y qué queda en AWS. Si no sabes el precio de una
   API, da la cantidad consumida, no un importe inventado.

## 6. Paralelismo para ir rápido

| A la vez | Por qué funciona | Límite |
|---|---|---|
| `voz` ‖ `images.mjs` ‖ `capture.mjs` | proveedores distintos (ElevenLabs, OpenAI, Chrome local) | `voz --concurrencia 4` por defecto; `images.mjs --concurrency 6` (6 láminas en ~30 s) |
| Voz por bloques | `voz` lanza N bloques a la vez con el contexto de los vecinos y cachea cada uno; editar un bloque solo regenera ese | 429 → bajar `--concurrencia`; no lances `el-audio.mjs` (6–7 peticiones a la vez) mientras corre `voz`: comparten el límite de ElevenLabs y `voz` se para sin reintentar |
| `preparar --paralelo` | pose (CPU) mientras recorta (GPU) | es la única combinación probada en 16 GB |
| Guion mientras se recorta | la transcripción sale a los ~5 min; el recorte tarda ~30 min | `stills.mjs --ponente marco` sirve antes de tener la plancha |
| Investigación y locución mientras se instala o prepara | no compiten por recursos | — |
| Lambda con `--concurrencia max` | el máximo de funciones que admite Remotion por render: menos tiempo de reloj, coste parecido | > 100 funciones: cuota de concurrencia de la cuenta (1000 por defecto); también `proyecto.json › lambda.concurrencia: "max"` |

**No a la vez en el M1 de 16 GB**: `recortar` + `transcribir` + `pose` (no caben), dos pasos de GPU (`recortar`,
`ampliar`, `profundidad`, `master`), dos `stills.mjs` o `render-local.mjs` (cada uno copia `public/` y descarga
medios: disco). Referencia con un bruto 4K de 34 min: analizar 1 min 45 s · transcribir 3 min · master 5–8 min ·
recorte ~30 min con la GPU libre · pose 7 min. Narración de 4 min (`devday-2026`): voz 25 s · transcribir 22 s ·
6 láminas 30 s · render en Lambda 34 s; el encargo entero, 16 min 44 s, casi todo investigación y guion.

## 7. Cronómetro

- Inicio: la hora de §0, en `BRIEF.md` («Inicio») y en el informe.
- Cada paso de `tools/kaleidos` deja su duración en `proyectos/<slug>/work/logs/tiempos.json`; `lambda.mjs` añade
  los tiempos y el coste reales del render a `informe.md`.
- Fin: cuando `resultados/<slug>.mp4` está descargado y verificado. Informa del **tiempo total de reloj** (fin −
  inicio) y del desglose: preparar, guion y revisión, render, verificación. Si hubo esperas del usuario, dilo.

## 8. Privacidad y reglas del repo

- **Ningún dato personal de clientes** en respuestas, informes, gráficos o rótulos; no cites fragmentos de la
  transcripción con datos personales; si aparecen en pantalla, se difuminan. Rótulos genéricos («Docente del
  curso») salvo que el usuario dé los nombres para el vídeo. Láminas e imágenes sin personas reales ni marcas.
- **Credenciales** en `.env`: nunca las muestres, copies ni pongas en URLs. Cárgalas en un subshell
  (`set -a; . ./.env; set +a`) o deja que las lean los scripts. El doctor solo dice **nombres** de variables.
- **AWS**: nada sin confirmación con recursos y coste por delante (§5, punto 4); región `eu-west-1`; entradas solo al
  **bucket privado** con URLs prefirmadas; el bucket `remotionlambda-*` es de lectura pública (solo site y salida,
  que se descarga y se borra).
- `brutos/` no se modifica nunca; `~/videos-opus` es de solo lectura.
- Remotion 4.0.529 exacto en `motor/`. Tipografías solo OFL/Apache.
- Verificar con imágenes tras cada cambio; `ffprobe` y recuento de fotogramas de cada salida.

## 9. Criterio de contenido

- Los gráficos **resumen lo que dice la voz**: no se inventan datos, cifras, opciones ni decisiones.
- Actualidad: solo **fuentes oficiales** (y, como apoyo, medios de referencia), citadas en `fuentes.md` con URL y
  fecha. Afirmaciones de una empresa sobre sí misma, dichas como tales («según OpenAI…»). Benchmarks sin
  verificación independiente: fuera o señalados.
- **Incoherencias** del material (dos cifras distintas, una fecha que no cuadra) se señalan en `informe.md`, no se
  ocultan ni se «arreglan» en silencio. Si la premisa del encargo no se sostiene, dilo y monta lo que sí ocurrió.
- Contenido legal, clínico o financiero: anota en el informe que un experto debe validar los textos.

## 10. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| El doctor marca ✗ en `tools/.venv` o modelos | `tools/kaleidos instalar` (whisper, pose, rvm); `--que profundidad ampliar` para corto-ilustrado |
| `motor/node_modules` falta o no es 4.0.529 | `cd motor && npm ci` (respeta `package-lock.json`; nunca actualizar Remotion) |
| Estilos del motor desactualizados | `cd motor && npm run estilos` |
| `linea` da `ERROR:` | corrige el guion (cues, disposiciones, bocadillos fuera de su lámina) y relanza; los avisos se leen, no bloquean |
| Un cue no se encuentra | la frase debe ser literal de la transcripción tras `fixes`; revisa `work/transcripcion.txt` o pasa `plantillas/herramientas/cues.py <slug> --comprobar` |
| Narración: eventos que se retrasan o desaparecen al principio | quita `intro.hasta` (basta `intro.previo`); no pongas eventos en los 3,4 s del rótulo de capítulo |
| Bocadillos que tapan las fichas de capítulo | `x` ≈ 0,2–0,25 e `y` ≈ 0,16–0,17 |
| El MP4 de Lambda suena alto (≈ −13 LUFS, picos > 0 dBTP) | `python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 --en-sitio` |
| Una web oficial da 403 al descargarla | léela con el navegador integrado |
| ElevenLabs 401/402/429 | `voz` explica el motivo y se para sin reintentar; lo generado queda en caché |
| La CLI de Lambda corta (`ECONNRESET`) | `node motor/scripts/lambda.mjs <slug> --reanudar` |
| HyperFrames en Lambda tarda minutos en empezar | el proyecto lleva `node_modules`: renderiza desde una copia limpia (§4.3) |
| `PLAN_HASH_MISMATCH` / `FFMPEG_VERSION_MISMATCH` en HyperFrames | versión distinta de la desplegada (0.8.86): usa `hyperframes@0.8.86` o redespliega con OK |
