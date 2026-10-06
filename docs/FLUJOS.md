# Flujos de trabajo, de principio a fin

Comandos exactos de cada flujo, con tiempos y costes reales. La conversación con el usuario (qué preguntar, cuándo
parar a confirmar) está en [`MONTAR_VIDEO.md`](MONTAR_VIDEO.md) y en la skill `montar-video`; aquí va la parte
técnica. Formatos de datos: [`CONTRATO.md`](CONTRATO.md). Todos los comandos se lanzan **desde la raíz del repo**.

## 0. Elegir el flujo

| Si el usuario trae… | Flujo | Motor |
|---|---|---|
| Una grabación con ponente (clase, curso, charla, masterclass, pieza corta con presentador) | [A. Con ponente](#a-vídeo-con-ponente-remotion) | Remotion |
| Un tema, una noticia o un texto para contar con voz en off y gráficos, sin grabación | [B. Narración](#b-narración-con-voz-tts-remotion) | Remotion (modo narración) |
| Una idea de promo, short, explainer muy diseñado, ambiente en bucle | [C. Generativo](#c-generativo-hyperframes) | HyperFrames |

Reglas comunes a los tres: brief confirmado antes de escribir nada; estilo del catálogo (si no lo dice, proponer 2–3,
[`ESTILOS.md`](ESTILOS.md)); los gráficos resumen lo que dice la voz y no se inventan datos; ningún dato personal ni
nombre real en rótulos, gráficos o informes; **nada en AWS sin el OK explícito del usuario**, con recursos, coste y
tiempo por delante ([`AWS.md`](AWS.md)). Plantillas de arranque por tipo de vídeo en [`../plantillas/`](../plantillas/)
(`clase-larga`, `corto-ilustrado`, `explainer-narracion`, `noticias-narracion`, `promo-hyperframes`).


---

## A. Vídeo con ponente (Remotion)

### A.1 Brief y proyecto

Métodos: `clase-larga` (más de 2–3 min: guion por datos, cortes de silencio, cámara virtual) o `corto-ilustrado`
(montaje 1:1 con el original, ilustraciones 2,5D). Recorte del ponente: sí por defecto si el fondo es liso.

```bash
tools/kaleidos nuevo <slug> --bruto brutos/<archivo>.mp4 --estilo <estilo> --metodo clase-larga \
  --titulo "Título del vídeo" --prompt "SIGLA1, SIGLA2, Producto, Norma"      # términos del dominio para Whisper
# opciones: --sin-recorte · --escenario (modo escenario, CONTRATO §7) · --idioma es
#           --desde-proyecto OTRO (hereda el preproceso de otro proyecto del MISMO bruto, con enlaces duros)
```

Crea `proyectos/<slug>/` con `proyecto.json`, `BRIEF.md` (plantilla), `media/` y `work/`. Rellena `BRIEF.md` con lo
confirmado y lo inferido por separado. El slug va en minúsculas, cifras y guiones.

### A.2 Preparar (en segundo plano)

```bash
tools/kaleidos preparar <slug>                 # analizar → transcribir → master → recortar → pose
tools/kaleidos preparar <slug> --paralelo      # pose (CPU) a la vez que recortar (GPU)
tools/kaleidos preparar <slug> --sin pose      # saltar pasos
```

Mientras corre, lee `work/analisis/resumen.md` y las hojas de contactos de `work/analisis/`. Al terminar, **comprueba
el recuento de fotogramas** de cada vídeo de `work/` contra el del bruto (un proceso puede pararse sin error):

```bash
for f in brutos/<archivo>.mp4 proyectos/<slug>/work/{mezzanine,mascara,plancha}.mp4; do
  printf '%s ' "$f"; ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$f"
done
tools/kaleidos recortar <slug>                 # si la máscara quedó corta: continúa por partes de 2500 fotogramas
tools/kaleidos recortar <slug> --desde 30000   # o desde un fotograma concreto
```

Tiempos de referencia (M1 Pro, bruto 4K de 34 min, `dora-v2`):

| Paso | Tiempo |
|---|---|
| `analizar` | 1 min 45 s |
| `transcribir` | 3 min 15 s (+ 2 min 56 s de relleno de huecos) |
| `master` | audio 2 min 51 s · vídeo 4 min 56 s |
| `recortar` | máscara ~30 min con la GPU libre (49 min 32 s medidos con la GPU compartida) · plancha 6 min 52 s |
| `pose` | 6 min 43 s |
| `linea`, `media`, `capitulos` | < 1 s |
| **Total** | **~55 min** con la máquina libre |

No lances a la vez recorte, pose y transcripción de otro proyecto: no caben en 16 GB.

### A.3 Guion editorial

Lee **entera** `work/transcripcion.txt` (estructura, tomas falsas, sobre todo al final, y errores de reconocimiento) y
mira `work/gestos.json` (gestos amplios, buenos para `gesto3d`). Escribe `proyectos/<slug>/guion.json` (CONTRATO §2 y,
en modo escenario, §7):

- `fixes` para errores de reconocimiento; `cortes` para tomas falsas o charla fuera de guion (quédate con la toma limpia).
- `intro`, `capitulos` (con `cue`, `acento` 0–3, `objeto3d`; en escenario, `sigla` y `registro`), `outro`.
- `eventos` anclados por frase: paneles (`lista`, `pasos`, `checklist`, `comparativa`, `opciones`, `cifra`, `cita`,
  `clave`, `linea`, `mapa`, `tarjeta`, `caso`), `pop`, `escena3d`, `gesto3d`, `ilustracion` y, en escenario, `titulo`,
  `lamina`, `bocadillo`, `reaccion`, `sello`. Densidad de referencia en clases: un gráfico cada ~40 s.
- En una clase que se reedita, un script propio en `work/guion/` que genere `guion.json` es reproducible (así se hicieron
  `dora-v2` y `dora-milikito`).

Música y efectos (solo modo escenario): el bloque `audio` de `proyecto.json` (CONTRATO §7.3) no lo crea `nuevo` con
bruto; cópialo de un proyecto de narración (`proyectos/devday-2026/proyecto.json`) si el estilo trae `audio/`.

### A.4 Extras opcionales (láminas, capturas, ilustraciones)

```bash
node scripts/images.mjs <slug>             # images.json → assets/images/<id>.jpg (gpt-image-2)
node scripts/capture.mjs <slug>            # captures.json → assets/captures/<id>.png (Chrome headless)
tools/kaleidos profundidad <slug>          # work/ilustraciones/*.jpg → mapas de profundidad en media/extras/
tools/kaleidos ampliar <slug>              # Real-ESRGAN x2 para tener margen de zoom
```

Formatos de `images.json` y `captures.json`: los de `proyectos/dora-milikito/`. Las láminas se piden sin texto, sin
personas reales ni logotipos, con hueco para los bocadillos. La clave de cada extra en el guion es el nombre del archivo
sin extensión.

### A.5 Línea de tiempo

```bash
tools/kaleidos media <slug> && tools/kaleidos linea <slug> && tools/kaleidos media <slug>
tools/kaleidos capitulos <slug>            # capitulos.txt (YouTube)
```

`media` va antes de `linea` porque `linea` solo mete los extras que ya están en `media/extras/`, y otra vez después para
enlazar el `timeline.json` nuevo. `linea` sale con código distinto de 0 si hay avisos `ERROR:` (se listan en
`timeline.json › avisos` y en pantalla). Itera sobre el guion hasta que no quede ninguno; los avisos sin `ERROR:`
(eventos retrasados tras un rótulo, cues aproximados) se revisan pero no bloquean. `--estricto` convierte los cues no
encontrados en error.

### A.6 Revisión con imágenes

```bash
(cd motor && npm run estilos)                                    # si cambió algún estilo
node motor/scripts/stills.mjs <slug> --at eventos                # un fotograma por evento, intro, rótulos y cierre
node motor/scripts/stills.mjs <slug> --at 12.5,1:03,f250         # segundos, mm:ss o fotograma
node motor/scripts/render-local.mjs <slug> --frames 1000-1800    # tramo con movimiento (y medida de velocidad)
```

La hoja queda en `motor/out/stills/<slug>-<estilo>-auto/hoja.jpg` (ábrela y mírala). Busca encuadres que tapan títulos,
solapes, textos fuera de caja, contraste, 3D que no se pinta y subtítulos. Corrige datos (guion) antes que código.
Adherencia al estilo: [`ESTILOS.md`](ESTILOS.md) §5. Opciones útiles: `--ponente marco|recorte`, `--comp Vertical`,
`--gl swangle` (como en Lambda), `--escala 0.35 --cols 9`.

### A.7 Render en Lambda

```bash
node motor/scripts/lambda.mjs <slug> --dry-run          # plan: recursos, subidas, coste y tiempo; no llama a AWS
```

Enseña al usuario el resumen del plan (función, site nuevo o reutilizado, tamaño de las subidas privadas, número de
funciones, coste y tiempo estimados) y **espera su OK**. Después:

```bash
node motor/scripts/lambda.mjs <slug>                    # sube, renderiza, descarga, limpia y escribe informe.md
node motor/scripts/lambda.mjs <slug> --reanudar         # si se cortó: retoma sondeo, descarga y limpieza
```

Resultado: `resultados/<slug>.mp4` y la sección de tiempos y coste real en `proyectos/<slug>/informe.md`. Después,
normaliza el audio y verifica ([§6](#6-después-de-lambda-audio-y-verificación)).

Costes reales:

| Vídeo | Tipo | Fotogramas | Funciones | Render (reloj) | Lambda | Total |
|---|---|---|---|---|---|---|
| DORA v1 (`dora-videocurso-v1`) | Ponente sin recorte, 3D 11,5 % | 19 599 (13:04) | 196 × 100 f | 82 s | — | **0,29 $** |
| `dora-milikito` | Ponente con recorte, modo escenario | 15 426 (10:17) | 155 × 100 f | 2 min 4 s | 0,411 $ | **≈ 0,43 $** |

En `dora-milikito` la subida privada fue de 1,94 GB (72 s) y la descarga de 246 MB (31 s); el modelo había estimado
0,437 $. Estimaciones del modelo de coste para otros casos: `dora-v2` (12:45 con recorte) ≈ 0,55 $; clase de 30 min con
recorte ≈ 1,19 $; de 60 min ≈ 2,31 $ ([`motor/README.md`](../motor/README.md), «Modelo de coste»).

---

## B. Narración con voz TTS (Remotion)

Vídeo sin bruto ni ponente: la voz la genera ElevenLabs desde `locucion.json` y la **caja de voz** (con la onda de la
locución) ocupa el sitio del ponente. Siempre en modo escenario. Referencia real: `proyectos/devday-2026` (noticias,
4:02, estilo `milikito`).

### B.1 Brief, fuentes y proyecto

Si el vídeo cuenta actualidad, reúne primero las fuentes **oficiales** y anótalas en `proyectos/<slug>/fuentes.md`
(URL, fecha, qué dato sale de cada una): todo lo que diga la locución tiene que salir de ahí. Algunas webs bloquean la
descarga directa (openai.com responde 403 a WebFetch): léelas con el navegador integrado; las capturas se hacen con
`scripts/capture.mjs`, que sí funciona.

```bash
tools/kaleidos nuevo <slug> --narracion --estilo milikito --escenario \
  --titulo "Título del vídeo" --prompt "Producto, SIGLA, Nombre de modelo"
```

Deja `proyecto.json` con `narracion: true`, `ponente.recorte: false`, salida 1920×1080 a 25 fps y, si el estilo trae
`audio/` (sintonía, base, cierre y efectos), el bloque `audio` ya relleno (la base, a −24 LUFS medidos). También crea
`BRIEF.md` de narración, `work/voz/` y `assets/{images,captures}/`.

### B.2 Locución (`locucion.json`)

```json
{
  "voz": {},
  "pausaEntreBloques": 0.35,
  "bloques": [
    { "id": "b01", "texto": "Primera idea, en una o tres frases.", "pausaDespues": 0.5 },
    { "id": "b02", "texto": "Segunda idea. Las siglas y los números, escritos como se leen." }
  ]
}
```

- `voz` vacío usa `ELEVENLABS_VOICE_ID` y `ELEVENLABS_MODEL_ID` de `.env`. El modelo de voz es **Eleven v4
  (`eleven_v4`)**: es el valor de `.env.example` y el que usa `voz` si no se indica otro. Admite `id`, `modelo`,
  `ajustes` (voice settings), `semilla` e `idioma`. (Con `eleven_v3`, `voz` genera sin el contexto de los vecinos,
  porque ese modelo no lo admite.)
- Bloques de 1–3 frases; `id` con letras, cifras, `-` o `_`, sin repetir. ≈ 150 palabras por minuto.
- `recortarSilencios` (por defecto `true`) quita el silencio de los bordes de cada bloque.

```bash
tools/kaleidos voz <slug> --simular                    # bloques y caracteres que gastaría, sin llamar a la API
tools/kaleidos voz <slug> --max-caracteres 5000        # genera; se para si hubiera que gastar más
tools/kaleidos transcribir <slug>                      # Whisper sobre la locución, corregido contra locucion.json
```

`voz` hace un POST por bloque (4 a la vez) con el texto de los vecinos como contexto, cachea por hash (cambiar un
bloque solo regenera ese) y se para al primer error de la API explicándolo. Salidas: `work/voz/<id>.mp3`,
`work/voz/manifest.json` (inicio y duración de cada bloque, caracteres gastados) y `work/narracion.m4a` a −16 LUFS /
−1,5 dBTP. `transcribir` da las marcas por palabra para los subtítulos y los cues, con la grafía del guion
(`--sin-corregir` para ver lo que oyó Whisper).

### B.3 Extras y guion

Láminas y capturas como en [A.4](#a4-extras-opcionales-láminas-capturas-ilustraciones). Después, `guion.json` con las
mismas piezas que el modo escenario, con estas diferencias (CONTRATO §8):

- Los cues son frases de la **locución** y sus segundos, los de la locución (tómalos de `work/transcripcion.json`).
  `devday-2026/work/guion/eventos.py` genera el guion así: textos de `locucion.json`, tiempos de la transcripción.
- **Sin `cortes`** (la locución ya sale montada).
- `intro.previo`: segundos de música sin voz antes de la locución (si falta, `intro.duracion`; 5 s por defecto);
  `intro.hasta` como cue.
  `outro.coda`: segundos de música tras la voz; `outro.cue` marca dónde empieza el cierre.
- Disposiciones: solo `completa` (la diapositiva a sangre: intro, cierre, `titulo`, `lamina`, `ilustracion`) y `voz`
  (diapositiva grande + caja de voz: el resto). `bocadillo` fuerza `voz`.
- **`gesto3d` no vale** (no hay manos): usa `escena3d` con el mismo objeto.
- Ningún evento dentro de la intro ni de un rótulo de capítulo (3,4 s): `linea` los retrasa y, si se quedan sin
  duración, da error. Pon sus cues después del rótulo.

```bash
tools/kaleidos media <slug> && tools/kaleidos linea <slug> && tools/kaleidos media <slug>
tools/kaleidos capitulos <slug>
node motor/scripts/stills.mjs <slug> --at eventos
```

### B.4 Lambda

En narración conviene repartir al máximo: los trozos son baratos y el render baja a segundos.

```bash
node motor/scripts/lambda.mjs <slug> --dry-run --concurrencia max    # o proyecto.json › lambda.concurrencia: "max"
node motor/scripts/lambda.mjs <slug> --concurrencia max              # solo con el OK del usuario
```

Solo se suben `timeline.json`, `narracion.m4a` y los extras (ningún vídeo). Luego, [§6](#6-después-de-lambda-audio-y-verificación).

### B.5 Referencia real: `devday-2026`

| Paso | Dato |
|---|---|
| Encargo completo (fuentes, guion, voz, láminas, capturas, timeline, stills, Lambda, normalización) | **16 min 44 s** |
| `voz` | 15 bloques, 3 528 caracteres de ElevenLabs, 3 min 52 s de locución, 24,8 s (con `eleven_multilingual_v2`, antes del cambio a `eleven_v4`) |
| `transcribir` | 603 palabras (31 corregidas contra la locución), 22,3 s |
| Extras | 6 láminas (gpt-image-2) y 3 capturas |
| `linea` | < 1 s; 25 eventos, 5 capítulos, 17 disposiciones, 26 efectos |
| Lambda | 6 040 f (4:02), **195 funciones de 31 f**, render de 34,4 s, subida 13,8 MB, descarga 102,9 MB |
| Coste | **0,098 $** de Lambda, **≈ 0,12 $** en total (estimado antes de lanzar: 0,198 $) |

Otros costes que no son de AWS: ElevenLabs cobra por carácter (`voz --simular` los cuenta antes); gpt-image-2 en
calidad `medium` salió por ≈ 0,06–0,10 $ por lámina en `dora-milikito` (estimación: el script no registra el consumo).

---

## C. Generativo (HyperFrames)

### C.1 Entrada

En Claude Code, entra siempre por la skill global `/hyperframes`: hace la entrevista de intención y elige el flujo
(`video-corto` para shorts y explainers con voz, `product-launch-video` para promos desde una web, `general-video`
para el resto, `motion-graphics`, `slideshow`…). El proyecto va en `proyectos/<slug>/` (no en `videos/` como en
`~/videos-opus`). Sin Claude Code, ver [`../AGENTS.md`](../AGENTS.md).

### C.2 Estilo

```bash
cp estilos/<estilo>/estilo.md proyectos/<slug>/frame.md
mkdir -p proyectos/<slug>/assets/fonts && cp estilos/<estilo>/fonts/* proyectos/<slug>/assets/fonts/
node estilos/_esquema/fontface.mjs <estilo> --ruta assets/fonts          # CSS @font-face si hace falta regenerarlo
```

Nada de `<link>` a Google Fonts. Algunos estilos tienen motores propios en `~/videos-opus` (solo lectura): ver
[`ESTILOS.md`](ESTILOS.md) §4.

### C.3 Medios

| Qué | Entrada en `proyectos/<slug>/` | Comando |
|---|---|---|
| Locución | `script.json` (`lines[]`) | `node scripts/tts.mjs <slug>` (necesita `ELEVENLABS_BASE_URL`; `--check` prueba el endpoint) |
| Música y efectos | `audio.json` | `node scripts/audio.mjs <slug> [--only music\|sfx]` |
| Imágenes B-roll | `images.json` | `node scripts/images.mjs <slug> [--format vertical\|horizontal] [--quality low\|medium\|high]` |
| Fotos reales | `stock.json` | `node scripts/stock.mjs <slug> --dry-run`, luego con `--budget 0.20` |
| Capturas web | `captures.json` | `node scripts/capture.mjs <slug>` |
| Informativo completo | `story.json` | `node scripts/build-news.mjs <slug> --script` → `tts.mjs` → `build-news.mjs <slug>` |
| Tempo de una pista | archivo de audio | `python3 scripts/tempo.py <pista>` · `python3 scripts/beatmap.py <pista>` |

Modelos de ElevenLabs: voz **`eleven_v4`** (defecto de `.env` y de `tts.mjs`), música **`eleven_music_v2_5`** y efectos
**`eleven_text_to_sound_v2`**. `audio.mjs` usa `music_v2` si `audio.json` no trae `"musicModelId": "eleven_music_v2_5"`
(o `modelId` en cada pieza), y en los efectos no envía `model_id` (usa el que dé la API).

Audio en local (Qwen3-TTS, ACE-Step, Stable Audio) **solo si el usuario lo pide**: skill `audio-local`
(`.claude/skills/audio-local/scripts/audio-local.sh <slug> [voz|musica|efectos]`), de uno en uno por memoria.

### C.4 Comprobar, previsualizar y renderizar

```bash
cd proyectos/<slug>
npx hyperframes lint                           # tras el primer HTML y cada cambio estructural
npx hyperframes check                          # control final (repite lint y abre el navegador)
npx hyperframes preview --background           # Studio para que el usuario lo revise
node ../../estilos/_esquema/adherencia.mjs <estilo> index.html compositions   # colores y fuentes fuera del estilo
```

Render: en Lambda con el stack `hyperframes-kaleidos` ([`AWS.md`](AWS.md) §8), desde una copia sin `node_modules`
(comando en [`MONTAR_VIDEO.md`](MONTAR_VIDEO.md) §4.3; 30 s a 1080p = 23 s y 0,02 $). Render local, si el usuario lo prefiere:

```bash
npx hyperframes render --quality draft -o ../../resultados/<slug>-borrador.mp4 -w 4    # iterar
npx hyperframes render --quality delivery -o ../../resultados/<slug>.mp4 -w 4          # entrega
```

Referencia (benchmark, 900 f a 1080p): 21,5 s con 4 procesos; con los valores por defecto elige 1 proceso y tarda
51 s. Conocimiento heredado de `~/videos-opus` (promos de Ensaya, informativo, pizarra, dibujos, bucle de 240 s de
Rainy Cabin): solo lectura; las reglas del bucle están en `~/videos-opus/CLAUDE.md`.

---

## 5. Qué rehacer tras un cambio

| Cambió… | Rehacer |
|---|---|
| Un texto, un gráfico o un cue del guion | `linea` → `stills` → Lambda (el site no cambia; solo se sube la timeline) |
| Un bloque de la locución | `voz` (solo ese bloque) → `transcribir` → `linea` → `stills` → Lambda |
| Una lámina o captura | `images.mjs` / `capture.mjs` (con `--force` o `--only`) → `media` → `linea` → `stills` |
| La música o los efectos del estilo | `media` → `linea` |
| Un token o una fuente del estilo | `(cd motor && npm run estilos)` → `stills` → Lambda (se vuelve a subir el site) |
| El código del motor | `(cd motor && npm run lint)` → `stills` → Lambda (site nuevo) |
| Los ajustes de transcripción (`whisper.prompt`) | `transcribir` → revisar `fixes` y cues → `linea` |

## 6. Después de Lambda: audio y verificación

### 6.1 Normalizar la sonoridad (paso obligatorio mientras el motor no limite el bus)

La mezcla (voz a −16 LUFS + música + efectos) sale de Lambda por encima del objetivo y con picos por encima de 0 dBTP:
`dora-milikito` a −15,1 LUFS y `devday-2026` a −12,9 LUFS, los dos con +0,3 dBTP. Se normaliza en local a
**−16 LUFS / −1,5 dBTP** con `loudnorm` en dos pasadas, lineal, **copiando el vídeo** (sin recodificar):

```bash
S=<slug>; L=proyectos/$S/work/logs
# 1.ª pasada: medir (el JSON sale al final del registro)
ffmpeg -hide_banner -nostats -i resultados/$S.mp4 -vn -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2> $L/loudnorm-1.log
tail -16 $L/loudnorm-1.log           # input_i, input_tp, input_lra, input_thresh, target_offset
# 2.ª pasada: aplicar con los valores medidos
ffmpeg -hide_banner -nostats -i resultados/$S.mp4 -map 0 -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=<input_i>:measured_TP=<input_tp>:measured_LRA=<input_lra>:measured_thresh=<input_thresh>:offset=<target_offset>:linear=true:print_format=json" \
  resultados/$S.norm.mp4 2> $L/loudnorm-2.log
tail -16 $L/loudnorm-2.log           # normalization_type debe ser "linear"; el vídeo conserva sus fotogramas
```

Si sale `dynamic`, sube `LRA` por encima del `input_lra` medido y repite la 2.ª pasada. Comprueba el resultado
(abajo) y, si cuadra, sustituye: `mv resultados/$S.norm.mp4 resultados/$S.mp4`. Anótalo en `informe.md`
(«Posproceso local de audio»).

### 6.2 Verificar la salida

```bash
S=<slug>; L=proyectos/$S/work/logs
ffprobe -v error -select_streams v:0 -count_packets \
  -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_packets:format=duration -of compact resultados/$S.mp4
#   nb_read_packets = timeline.json › duracion (fotogramas)
ffmpeg -hide_banner -nostats -i resultados/$S.mp4 -vn -af ebur128=peak=true -f null - 2> $L/ebur128-final.log
tail -14 $L/ebur128-final.log                                            # I ≈ −16 LUFS, pico ≤ −1,5 dBTP
mkdir -p proyectos/$S/work/revision
ffmpeg -v error -i resultados/$S.mp4 -vf "fps=1/60,scale=480:-2,tile=5x3" -frames:v 1 -update 1 proyectos/$S/work/revision/final.jpg
```

Nunca pases por `grep` la salida de un ffmpeg largo: se pierden los errores. Guarda el registro y léelo.

### 6.3 Informe al usuario

`informe.md` (y el mensaje final) recoge: duración final, capítulos y gráficos, qué se verificó (fotogramas
muestreados, no un visionado completo), avisos de `linea` que quedan, incoherencias del material, **tiempo y coste
final** (Lambda + S3 + transferencia; y, si los hubo, ElevenLabs, imágenes o Apify) y qué queda en AWS. Sin datos
personales ni fragmentos de transcripción con nombres.
