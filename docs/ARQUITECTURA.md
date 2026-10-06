# Arquitectura de kaleidos

Cómo está montada la fábrica: qué hace cada pieza, qué datos se pasan y por qué se hizo así. Los formatos exactos de
cada archivo están en [`CONTRATO.md`](CONTRATO.md); aquí va el mapa.

## 1. Vista general

```
                ┌──────────────── ENTRADAS ────────────────┐
                │ bruto con ponente   locución (texto)   idea / web / noticia │
                └───────┬──────────────────┬───────────────────┬───────────────┘
                        │                  │                   │
          tools/kaleidos preparar   tools/kaleidos voz        skill /hyperframes
          (analizar, transcribir,   (ElevenLabs) +            (video-corto, product-launch-video,
           master, recortar, pose)   transcribir               general-video…) + scripts/*.mjs
                        │                  │                   │
                        └──────┬───────────┘                   │
                               ▼                               ▼
           guion.json (lo escribe el agente) ──►  tools/kaleidos linea ──► timeline.json
                               │                               │
                        tools/kaleidos media            proyecto HyperFrames
                    (enlaces duros en media/)           (index.html + compositions/)
                               │                               │
                 motor/ (Remotion 4.0.529) ◄── estilos/<e>/tokens.json   estilos/<e>/estilo.md → frame.md
                               │                               │
              local: stills y tramos de prueba        local: npx hyperframes check / preview
                               │                               │
              Lambda: motor/scripts/lambda.mjs         Lambda: stack hyperframes-kaleidos (desplegado)
                               ▼                               ▼
                         resultados/<slug>.mp4  +  proyectos/<slug>/informe.md
```

Tres caminos, dos motores:

| Camino | Motor | Entrada | Qué hace el agente |
|---|---|---|---|
| Con ponente | Remotion (`motor/`) | Grabación en `brutos/` | Lee la transcripción entera y escribe `guion.json` |
| Narración (voz TTS) | Remotion (`motor/`), modo narración | `locucion.json` escrito por el agente | Escribe la locución y el guion; la voz la genera ElevenLabs |
| Generativo | HyperFrames (skills globales) | Idea, web, noticia, guion | Compone HTML + GSAP siguiendo la skill |

## 2. Los dos motores

**Remotion, motor propio guiado por datos (`motor/`).** Un solo código base para todos los vídeos. El motor no sabe
nada del contenido: recibe `timeline.json` y un estilo (`tokens.json` + fuentes) y los pinta. Encaja cuando hay una
línea de tiempo larga que se puede describir con datos: clases, videocursos, masterclass, explainers narrados. Versión
fijada: **Remotion 4.0.529 exacto** en todos los paquetes, porque tiene que coincidir con las funciones Lambda
desplegadas. Detalle técnico: [`motor/README.md`](../motor/README.md).

**HyperFrames (skills globales de Claude Code).** Cada vídeo es un proyecto HTML propio (`index.html` +
`compositions/*.html`) con tiempos en atributos `data-*` y animación con GSAP. Encaja en piezas cortas y muy
diseñadas sin grabación: promos, noticias, explainers, ambiente WebGL. Las skills viven en `~/.claude/skills/`
(`hyperframes`, `hyperframes-cli`, `hyperframes-core`, `video-corto`, `product-launch-video`, `general-video`…) y la
CLI es `npx hyperframes`. Licencia Apache-2.0.

La comparación entre los dos (misma escena, mismos ajustes, render local y en Lambda) está en
[`benchmark/README.md`](../benchmark/README.md): en local, 900 fotogramas a 1080p tardaron 20,0 s con Remotion y 21,5 s
con HyperFrames (4 procesos).

## 3. Datos antes que código

Todo lo editorial vive en JSON dentro de `proyectos/<slug>/`. El código no se toca para hacer un vídeo nuevo.

| Archivo | Quién lo escribe | Para qué |
|---|---|---|
| `proyecto.json` | `tools/kaleidos nuevo` | Bruto o narración, método, estilo, salida (tamaño, fps), recorte, Whisper, Lambda, audio, escenario |
| `BRIEF.md` | El agente, tras confirmarlo con el usuario | Objetivo, público, duración, estructura, qué cortar, gráficos, privacidad |
| `locucion.json` | El agente (solo narración) | Bloques de texto de la voz, voz y pausas |
| `guion.json` | El agente, tras leer la transcripción entera | Cortes, capítulos, eventos anclados por frase clave, `fixes`, intro y cierre |
| `timeline.json` | `tools/kaleidos linea` (**nunca a mano**) | Todo en fotogramas de salida: EDL, planos, eventos, subtítulos, gestos, disposiciones, audio |
| `props-local.json` | `tools/kaleidos media` | Props pequeñas del motor para el render local |
| `images.json`, `captures.json` | El agente | Láminas (gpt-image-2) y capturas web que se usan como extras |
| `informe.md` | El agente y `lambda.mjs` | Decisiones, avisos, incoherencias, tiempos y coste real |
| `capitulos.txt` | `tools/kaleidos capitulos` | Capítulos en formato YouTube |

**Unidades** (CONTRATO, cabecera): el guion y la transcripción van en **segundos de la fuente** (del bruto o de la
locución); `timeline.json` va en **fotogramas de salida** (salvo `segmentos[].src`, en segundos de la fuente); las
coordenadas, en **píxeles de la fuente**.

**Anclaje por frase clave (cue).** Cada momento del guion es `[segundo aproximado, "frase literal"]`. `linea` busca la
frase normalizada (minúsculas, sin tildes ni puntuación, tras aplicar `fixes`) desde `segundo − 2 s` y usa el inicio
de su primera palabra. El gráfico entra cuando se dice y el guion aguanta pequeños cambios de tiempos.

## 4. Pipeline de preproceso (`tools/`)

Python 3.12 gestionado con `uv`. CLI única: `tools/kaleidos <comando> <slug> [opciones]` (equivale a
`uv run --project tools kaleidos …`). Cada paso anota su duración en `work/logs/tiempos.json` y deja los registros
completos de ffmpeg, sin filtrar, en `work/logs/*.log`.

| Paso | Qué hace | Sale en `work/` |
|---|---|---|
| `analizar` | Metadatos, hojas de contactos, escenas, movimiento, silencios, sonoridad, fondo y ponente | `analisis/*`, `analisis/resumen.md` |
| `transcribir` | whisper.cpp con Metal + `large-v3-turbo`, marcas por palabra (DTW), relleno de huecos con voz | `transcripcion.json`, `transcripcion.txt` |
| `master` | Audio a −16 LUFS / −1,5 dBTP; mezzanine 1080p etalonado en GPU (PyTorch MPS) | `mezzanine.mp4`, `audio/`, `lut/grade.cube` |
| `recortar` | Máscara del ponente (RVM resnet50 en MPS o Apple Vision) + plancha premultiplicada | `mascara.mp4`, `plancha.mp4`, `plancha.json` |
| `pose` | MediaPipe PoseLandmarker (sin red, en `sandbox-exec`) | `pose.json`, `gestos.json` |
| `voz` | `locucion.json` → ElevenLabs, un POST por bloque con contexto de los vecinos, caché por hash | `voz/<id>.mp3`, `voz/manifest.json`, `narracion.m4a` |
| `linea` | guion + transcripción + pose + gestos + plancha → `timeline.json`, con comprobaciones | `../timeline.json` |
| `media` | Enlaces duros en `media/` (lo que ve el motor) + `props-local.json` | `../media/*` |
| `capitulos` | Capítulos de YouTube | `../capitulos.txt` |
| `profundidad`, `ampliar` | Depth Anything V2 y Real-ESRGAN sobre `work/ilustraciones/` (ilustraciones 2,5D) | `../media/extras/` |

`preparar` encadena analizar → transcribir → master → recortar → pose (sin recortar si `ponente.recorte` es `false`).
En narración no hay bruto: analizar, master, recortar y pose no se aplican y la «fuente» es `work/narracion.m4a`.

**Herencia de preproceso.** `nuevo --desde-proyecto OTRO` enlaza con enlaces duros el `work/` de otro proyecto del
mismo bruto (0 bytes extra). Antes de reescribir una salida heredada, la CLI la independiza con un clon APFS, así el
proyecto de origen no cambia. Así se hizo `dora-milikito` a partir de `dora-v2`.

## 5. Motor (`motor/`)

- **Composiciones:** `Horizontal` (tamaño de `timeline.json`) y `Vertical` (1080×1920, básica). Duración, fps y tamaño
  salen de `timeline.json` en `calculateMetadata`.
- **Pila de capas:** fondo del estilo → 3D detrás → ponente → ilustraciones 2,5D → 3D delante → rótulos y paneles →
  subtítulos → HUD → cierre → grano.
- **Recorte sin secuencias de imágenes:** `fondo·(1 − α)` con la máscara en `multiply` + `invert(1)`, y encima la plancha
  premultiplicada en `plus-lighter`. Lo de detrás del ponente se pinta antes; lo de delante, después.
- **Cámara virtual:** planos `wide`, `medium`, `close`, `sideL`, `sideR`, `popL`, `card`, calculados con la mediana de la
  nariz de la pose; el borde inferior de la fuente nunca se ve.
- **Modos:** normal; **escenario** (`escenario: true`, CONTRATO §7: caja de diapositiva + caja del ponente, registros
  `show`/`editorial`/`lamina`, bocadillos, reacciones, sellos, fichas, apertura de marca); **narración** (CONTRATO §8:
  sin ponente, la caja de voz con la onda de la locución ocupa el sitio del ponente; disposiciones `completa` y `voz`).
 
- **Datos validados con zod** (`src/datos/contrato.ts`): el mismo esquema lo usan los scripts y `tools` para validar.
- **Estilos en el site:** `npm run estilos` copia `estilos/*/{tokens.json,estilo.md,fonts}` a `motor/public/estilos/`
  (sin `referencias/`) y los valida. Fuentes con `@remotion/fonts`; nada se descarga al renderizar.

## 6. Scripts generativos (`scripts/`)

Traídos de `~/videos-opus`. Trabajan sobre `proyectos/<slug>/`, leen `.env` con su propio cargador y dejan un
*manifest* junto a lo que generan.

| Script | Entrada | Salida |
|---|---|---|
| `tts.mjs` | `script.json` | `assets/voice/<id>.wav` + `assets/voice.manifest.json` (HyperFrames) |
| `audio.mjs`, `el-audio.mjs` | `audio.json` o una especificación | `assets/audio/…` + manifest |
| `images.mjs` | `images.json` | `assets/images/<id>.jpg` (gpt-image-2) |
| `stock.mjs` | `stock.json` | `assets/stock/<id>.jpg` (Apify, con presupuesto) |
| `capture.mjs` | `captures.json` | `assets/captures/<id>.png` (Chrome headless) |
| `build-news.mjs` | `story.json` | `script.json` o el informativo HyperFrames completo |
| `beatmap.py`, `tempo.py` | Una pista de audio | Golpes y tempo para cortar a ritmo |

Las láminas y capturas de `assets/` también sirven al motor: `tools/kaleidos media` las enlaza en `media/extras/`.

## 7. Render en Lambda y cómo viajan los datos

El render final es **siempre** en AWS Lambda (`eu-west-1`). En local solo se sacan fotogramas de control y tramos de
prueba.

```
máquina local                                   AWS eu-west-1
─────────────                                   ─────────────
motor/ (bundle) ── sites create ──────────────► remotionlambda-* (LECTURA PÚBLICA)
                   (solo si cambia src/+public)    └ sites/motor-<hash>/   ← código + estilos + fuentes
                                                   └ renders/<id>/out.mp4  ← salida (se borra tras bajarla)
media/timeline.json, audio.m4a o narracion.m4a,
plancha, máscara, extras ── subida SSE-S3 ─────► kaleidos-privado-* (PRIVADO, caduca a 3 días)
                                                   └ URLs prefirmadas de 3 h → props del render
renderMediaOnLambda(props pequeñas) ───────────► función remotion-render-4-0-529-… (hasta 200 en paralelo)
                                                   cada función descarga timeline.json una vez y pide
                                                   solo rangos de bytes de los vídeos
resultados/<slug>.mp4 ◄── descarga directa de S3 ◄─ renders/<id>/
informe.md ◄── tiempo y coste real (getRenderProgress().costs + S3 + transferencia)
```

Por qué así:

- **El bucket `remotionlambda-*` es de lectura pública** (política de Remotion). Ahí solo van el site (código y estilos)
  y la salida, que se descarga y se borra. Una vez se expuso unos minutos un vídeo subido ahí: por eso la regla.
- **Las entradas van al bucket privado** con URLs prefirmadas de corta duración: la transcripción (en `timeline.json`)
  y los vídeos del ponente no deben ser públicos.
- **La línea de tiempo no viaja en las props.** Si las props resueltas pasan de ~200 KB, Remotion las guarda en el
  bucket público. Por eso `calculateMetadata` devuelve solo duración, fps y tamaño, y cada pestaña descarga
  `timeline.json` por su cuenta.
- **Con recorte solo se sube el audio del mezzanine** (`audio.m4a`, extraído sin recodificar): el vídeo del ponente sale
  de la plancha. En `dora-v2`, 49 MB en lugar de 1,3 GB. En narración se sube `narracion.m4a` y ningún vídeo
  (`devday-2026`: 13,8 MB de entradas en total).
- **Concurrencia configurable**: `framesPerLambda` (100 por defecto) o `--concurrencia max|N` /
  `proyecto.json › lambda.concurrencia`, que reparte el vídeo en hasta 200 funciones (límite de Remotion 4.0.529).
- **La mezcla no se limita en el motor**: la salida de Lambda sale por encima de −16 LUFS con picos de +0,3 dBTP, así
  que se normaliza en local copiando el vídeo (ver [`FLUJOS.md`](FLUJOS.md) §6).
 
- **`--disable-web-security`**: el bucket privado no tiene CORS; el render lee entre dominios así.
- **`<Video>` de `@remotion/media`** con `disallowFallbackToOffthreadVideo`: cada función pide solo los rangos de bytes
  de su tramo en vez de bajar el vídeo entero.
- **Site por hash**: `motor-<hash>` se vuelve a subir solo si cambian `motor/src/` o `motor/public/`.

Recursos, políticas, costes y limpieza: [`AWS.md`](AWS.md).

## 8. Local: disco y verificación

- Un único empaquetado en `motor/out/bundle`, que se rehace solo si cambia `src/`.
- `motor/out/publico/` junta con **enlaces duros** los medios del proyecto y `public/`: no se copia ningún vídeo.
- Los scripts borran los temporales `remotion-v4-*-assets*` al terminar (Remotion descarga cada vídeo en cada llamada y
  llenó el disco en el primer proyecto).
- Si `media/` está vacío, los scripts usan en **solo lectura** `timeline.json` y `work/*.mp4`, ignorando los que se
  estén escribiendo (modificados hace menos de 2 min).
- Verificar con imágenes: stills y hoja de contactos tras cada cambio; `ffprobe` y recuento de fotogramas de cada salida.

## 9. Estado, registros y reanudación

| Dónde | Qué |
|---|---|
| `proyectos/<slug>/work/logs/tiempos.json` | Duración y resultado de cada paso de `tools` |
| `proyectos/<slug>/work/logs/*.log` | Salida completa de ffmpeg y de los modelos |
| `motor/out/lambda/<slug>.json` | Estado del último render en Lambda (`lambda.mjs --reanudar`) |
| `motor/out/calibracion.json` | Medidas locales que usa el modelo de coste |
| `aws/recursos.json` | Inventario de lo desplegado en AWS |
| `motor/PROGRESO.md`, `tools/PROGRESO.md`, `estilos/PROGRESO.md` | Hecho, pendiente y comandos para retomar cada parte |

## 10. Pendiente

Previsto o conocido, pero sin hacer (detalle y estado en cada `PROGRESO.md`):

- **Motor**: limitar el bus de mezcla (hoy se normaliza en local tras Lambda); composición `Vertical` básica (escenario
  y caja de voz sin revisar a fondo; la apertura de marca se recorta); tratamiento «juego» fuera del modo escenario;
  rótulo del `gesto3d` que tapa la cara con objetos altos; bocadillo suelto con `lado: "der"` en `voz`; factor de
  escala para fuentes manuscritas; comprobar en Lambda que la onda de voz decodifica AAC (si no, sigue a los
  subtítulos sin romper el render).
- **Contrato**: recoger en `CONTRATO.md` lo que `tools` ya implementa: `intro.previo`, `intro.hasta`, `outro.coda` y
  `outro.cue`, y los formatos de `locucion.json` y `work/voz/manifest.json`.
- **Coste y render**: máscara a media resolución o α dentro de la plancha para abaratar el recorte (cambio de contrato);
  recalibrar el factor F con los renders reales; repetir `medir.mjs --repeticiones 3` con la máquina tranquila.
- **AWS**: nada bloqueante (política v3 aplicada, HyperFrames desplegado, limpieza hecha el 2026-10-01); lo que queda,
  en [`AWS.md`](AWS.md) §11.
- **Estilos**: renders reales de `vox-corto`, `clase-oscura-cristal` y `acuarela-ilustrada` (hoy, muestrarios).
- **Proyectos**: `dora-v2` tiene el preproceso y la timeline completos pero no se ha renderizado; su `BRIEF.md` está
  sin confirmar y quedan por escuchar las juntas de los cortes.
- **Benchmark**: fase 6 (comparativa, extrapolación a 1 h, recomendación y comandos de limpieza sin ejecutar).
