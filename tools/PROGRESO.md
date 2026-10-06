# tools/ · progreso

Pipeline de preproceso de kaleidos (Mac M1 Pro, sin CUDA). CLI única:

```console
tools/kaleidos <comando> <slug> [opciones]          # = uv run --project tools kaleidos …
tools/kaleidos --help                               # lista de comandos
tools/kaleidos instalar --que whisper pose rvm      # compila whisper.cpp (Metal) y descarga modelos
```

| Comando | Qué hace | Salidas |
|---|---|---|
| `nuevo <slug> --bruto brutos/x.mp4 [--estilo] [--metodo] [--sin-recorte] [--titulo] [--prompt] [--escenario] [--desde-proyecto OTRO]` | Crea el proyecto; `--escenario` pone `"escenario": true`; `--desde-proyecto` hereda con enlaces duros el preproceso de otro proyecto del mismo bruto | `proyecto.json`, `BRIEF.md`, `media/`, `work/` |
| `nuevo <slug> --narracion --estilo <e> [--escenario] [--titulo] [--prompt]` | Proyecto **sin bruto** con locución TTS: `narracion: true`, `ponente.recorte: false`, 1920×1080 a 25 fps, `audio` del estilo (base a −24 LUFS) | `proyecto.json`, `BRIEF.md` de narración, `media/`, `work/voz/`, `assets/` |
| `voz [--concurrencia 4] [--forzar] [--max-caracteres N] [--simular]` | `locucion.json` → ElevenLabs (`mp3_44100_192`, `previous_text`/`next_text`, 4 a la vez, caché por hash de texto+voz+modelo+ajustes); para al primer error sin reintentar | `work/voz/<id>.mp3`, `work/narracion.m4a` (= `media/narracion.m4a`, −16 LUFS / −1,5 dBTP), `work/voz/manifest.json` |
| `analizar` | Metadatos, hojas de contactos, escenas (scdet), movimiento, luma, silencios, EBU R128, canales, fondo/ponente, nitidez | `work/analisis/*` + `resumen.md` |
| `transcribir [--rellenar] [--sin-corregir]` | whisper.cpp Metal + large-v3-turbo, DTW por token, troceo por silencios, relleno de huecos con voz; en narración, sobre `narracion.m4a` por bloques y corregido contra `locucion.json` | `work/transcripcion.json`, `work/transcripcion.txt` |
| `master [--solo audio\|video] [--partes N] [--cpu] [--desde/--duracion]` | Audio −16 LUFS / −1,5 dBTP; vídeo 1080p etalonado en GPU entre decodificadores y codificador VideoToolbox | `work/mezzanine.mp4`, `work/audio/`, `work/lut/grade.cube` |
| `recortar [--motor rvm\|vision] [--modelo] [--desde F] [--hasta F] [--medir S] [--solo mascara\|plancha]` | RVM en MPS (fp16, lotes T=8) por partes reanudables + plancha premultiplicada en GPU | `work/mascara.mp4`, `work/plancha.mp4`, `work/plancha.json` |
| `pose [--paso] [--partes] [--manos] [--solo-gestos]` | MediaPipe PoseLandmarker full a 960×540 (sin red: `sandbox-exec`) | `work/pose.json`, `work/gestos.json` |
| `linea [--estricto]` | guion + transcripción + pose + gestos + plancha → contrato §3 y §7.3 (eventos show, disposiciones, audio), con comprobaciones | `timeline.json` (salida ≠ 0 si hay errores) |
| `media` | Enlaces duros para `--public-dir` (+ `audio.m4a`, láminas, capturas, música y efectos en `extras/`) y props del contrato §4 | `media/*`, `props-local.json` |
| `capitulos` | Capítulos de YouTube (0:00, ≥ 10 s) | `capitulos.txt` |
| `preparar [--sin …] [--paralelo]` | analizar → transcribir → master → recortar → pose | `work/logs/tiempos.json` |
| `profundidad` / `ampliar` | Depth Anything V2 Base / Real-ESRGAN x2plus en MPS sobre `work/ilustraciones/` | `media/extras/` |

Todos los pasos registran su duración en `proyectos/<slug>/work/logs/tiempos.json` y dejan los registros
completos de ffmpeg (sin filtrar) en `work/logs/*.log`.

## Hecho

- Proyecto `uv` (Python 3.12 gestionado por uv), `pyproject.toml`, envoltorio `tools/kaleidos`, `.gitignore`
  (`.venv/`, `modelos/`, `vendor/`).
- whisper.cpp (commit 6e4ab85) compilado con Metal + Accelerate en `tools/vendor/whisper.cpp` (cmake y ninja
  vienen de PyPI dentro del entorno). Modelo `ggml-large-v3-turbo.bin` de `ggerganov/whisper.cpp` (sha256
  verificado). MediaPipe `.task` de storage.googleapis.com, RVM por torch.hub, Depth Anything V2 Base de HF,
  Real-ESRGAN x2plus de una réplica de HF verificada por sha256 contra el fichero oficial.
- Todos los comandos implementados y probados de principio a fin con `proyectos/dora-v2` (bruto 4K de 34 min):
  análisis, transcripción, máster, máscara y plancha completas (51 067/51 067 fotogramas), pose completa,
  guion convertido del montaje anterior, `timeline.json` sin errores bloqueantes, `media/` y `capitulos.txt`.
  `profundidad` y `ampliar` probados con una imagen. Detalle y tiempos: `proyectos/dora-v2/informe.md`.

| Paso (dora-v2) | Tiempo medido |
|---|---|
| analizar | 1 min 45 s |
| transcribir | 3 min 15 s (+ 2 min 56 s de relleno de huecos) — antes ~77 min con medium |
| master | audio 2 min 51 s · vídeo 4 min 56 s (175 fps) — antes 18 min 46 s el vídeo |
| recortar | máscara 49 min 32 s (17,2 fps con la GPU compartida; 28,6 fps libre → ~30 min) · plancha 6 min 52 s |
| pose | 6 min 43 s (127,5 fps, 3 procesos) |
| linea | 0,4 s |

## Decisiones técnicas (y por qué)

- **Decodificación**: este bruto (fondo liso, 7,8 Mb/s) se decodifica por software a ~550–700 fps en 4K; el
  decodificador de VideoToolbox va a ~128 fps. `analizar` usa software; `master` combina un tramo VideoToolbox
  y dos por software con `hwupload,scale_vt` (el escalado siempre en la GPU).
- **Etalonaje en GPU**: `lut3d` + conversiones gbrp cuestan ~100 ms de CPU por fotograma (18 min en el proyecto
  anterior). La misma corrección (balance de blancos del fondo, exposición, saturación, desaturación azul/magenta,
  curva S, nitidez de luma) se aplica con PyTorch MPS y `torch.compile` (3,6 ms/fotograma). Se hornea además
  `work/lut/grade.cube` con la misma función (`--cpu` y editores).
- **MediaPipe**: la 1.0.1 aborta en macOS (`graph_service.h … DrishtiMetalHelper`) → fijada la 0.10.35. Esa
  versión trae un cliente de telemetría de uso («clearcut»): `pose` se relanza dentro de `sandbox-exec` sin red IP.
  El `Pool` se cambió por `ProcessPoolExecutor` (si un proceso nativo muere, error en vez de cuelgue).
- **DTW de whisper.cpp** exige `-nfa` (sin flash attention) y falla con trozos de muy pocos tokens: el relleno de
  huecos va sin DTW y se realinea con la energía.
- **Silencios en `linea`**: un silencio es «sin palabras y sin energía de voz». Whisper se salta a menudo la
  segunda toma de una frase repetida y pega el texto a la primera; con cortes solo por huecos entre palabras se
  perdía justo la toma buena. `transcribir` retranscribe esos huecos con voz (+312 palabras en dora-v2).
- **Contrato, acordado con el motor**: en `cifra`, el valor de arranque del contador va como `valorInicial`
  (el `desde` del guion se traduce; chocaba con el `desde` del evento). Extensiones que `linea`/`media` ya rellenan:
  `plancha.mascara: "fuente"` (la máscara es gris 1080p de la fuente entera), `plancha.curva: "metodo"` (la curva
  con la que se multiplicó la plancha), `gestos[].pista` (muñecas por fotograma de salida hasta el pico) y
  `media.audio` en las props (`media/audio.m4a`, el AAC del mezzanine sin recodificar). El evento `ilustracion`
  (`imagen`/`profundidad` = claves de `media.extras`, `anclas[].cue` → `en`) se acepta en el guion y se valida.
  `timeline.json` y `props-local.json` de dora-v2 pasan el esquema zod del motor (`motor/src/datos/contrato.ts`).
- Los planos forzados largos se parten en cada corte con +7 % de escala alterna (punch-in).
- **Recorte**: RVM resnet50 fp16 en MPS a ~22 fps en régimen (> 8 fps), así que no hizo falta Apple Vision; el
  motor `--motor vision` está implementado como alternativa.

## Escenario, registros y componentes «show» (CONTRATO §7) — 2026-09-30

- **`nuevo --desde-proyecto OTRO`**: exige el mismo bruto (`samefile`) y enlaza con enlaces duros `mezzanine.mp4/.json`,
  `plancha.mp4/.json`, `mascara.mp4`, `pose.json`, `gestos.json`, las tres transcripciones, `audio/` (máster y WAV),
  `lut/` y `analisis/` (`linea` necesita `fuente`, `audio`, `rms100ms` y `fondo`). Hereda el `whisper.prompt` y apunta
  `preproceso.desde` en `proyecto.json`. **Copia al escribir**: `cli` independiza (clon APFS `cp -c`, instantáneo y
  sin disco) las salidas de `analizar/transcribir/master/recortar/pose/preparar` antes de ejecutarlas, porque ffmpeg y
  `write_text` reescriben en el sitio y cambiarían el fichero del proyecto de origen (`comun.SALIDAS_PASO`).
  `--escenario` pone `"escenario": true`.
- **`linea` §7.3**: tipos `titulo`, `lamina` (+ `bocadillos[]`, cue → `en`), `bocadillo`, `reaccion` (1,4 s, se puede
  solapar; si cae en rótulo, intro o cierre se descarta), `sello`; `registro` y `disposicion` validados en cualquier
  evento; `capitulos[].sigla`/`registro`; `intro.estilo: marca`; objetos 3D `trofeo`, `llave`, `escalera`, `letras`
  (`letras` exige `texto`). Salidas nuevas: `disposiciones` (reglas en la cabecera de `linea.py`; huecos < 1,5 s
  absorbidos para no parpadear, tramos < 1,2 s fundidos), `audio.musica` (sintonía / base en bucle / cierre con
  fundidos; `lufs` en la config ⇒ `linea` mide el archivo con ebur128 y calcula el volumen, caché en
  `work/audio_extras.json`) y `audio.sfx` (titulo → destello, bocadillo/reaccion → pop, cambio de disposición → whoosh,
  sello → golpe, capítulo → ficha, veredicto de `opciones` opcional; a < 6 fotogramas gana la prioridad; `dur` medida),
  y `"escenario": true`. Comprobaciones: extras en `media/extras` (error si no existen en ningún sitio, aviso si falta
  `media`), bocadillos dentro de su lámina (error), `titulo` fuera de rótulos, densidad (aviso si > 15 s sin cambio
  visual: entradas/salidas, `en` internos, reacciones, rótulos y disposiciones).
- **Tramos sin voz** (extensión del guion, propuesta para el contrato): `intro.previo` y `outro.coda` (segundos del
  bruto, sin palabras) se anteponen/añaden a la EDL para que sintonía y cierre suenen sin voz encima; `intro.hasta`
  admite un cue. El mapa src→dst ignora esos tramos (su `src` puede estar en cualquier punto).
- **Cámara en escenario**: plano medio forzado en «grande», laterales solo en bocadillos, abierto en gesto3d, resto
  medio/corto. Las ventanas forzadas se ajustan también hacia dentro al corte más cercano (< 1,2 s): cada corte
  coincide con un cambio de plano (en dora-v2 mejora de 2 a 1 corte sin cambio; el resto de su timeline no cambia).
- **`media`**: `extras/` = `work/extras/*` + `assets/images/*` (láminas) + `assets/captures/*.png` + los audios que
  declara `proyecto.json › audio` en `audio.origen` (por defecto `estilos/<estilo>/audio/`, sin subcarpetas). Avisa de
  los que faltan y se puede relanzar cuando lleguen.
- Regresión: `Linea(dora-v2)` en memoria da el mismo `timeline.json` salvo `disposiciones` (nueva), un aviso que ya no
  cita la transcripción (privacidad) y el ajuste de planos citado. Validación contra el zod del motor (ya ampliado):
  `dora-milikito` y `dora-v2` válidos (se empaqueta `motor/src/datos/contrato.ts` con el esbuild del motor fuera de
  `motor/`).
- Primer proyecto: `proyectos/dora-milikito` (10:17, 76 eventos, 6 láminas + 2 capturas; ver su `informe.md`).

## Modo narración (proyectos sin bruto, voz de ElevenLabs) — 2026-09-30

- **`nuevo --narracion`**: sin `bruto` (error si se pasa `--bruto` o `--desde-proyecto`), `metodo` por defecto
  `corto-ilustrado`, `audio` rellenado con lo que haya en `estilos/<e>/audio/` (base con `lufs: -24`). `Proyecto.bruto`
  da un error claro en narración (analizar/master/recortar/pose no se aplican); `Proyecto.fuente_info()` devuelve el
  lienzo de salida + la duración de `work/narracion.m4a`. Slugs que empiezan por `_` admitidos (pruebas).
- **`voz`**: `.env` cargado con `comun.cargar_env()` (sin imprimir valores; no pisa el entorno); URL base vacía →
  `https://api.elevenlabs.io`. Caché en `work/voz/cache/<hash>.mp3` (+ `.json` con los caracteres de la cabecera
  `x-character-count`): renombrar o reordenar bloques no regenera; el contexto de los vecinos no entra en el hash.
  `eleven_v3` va sin `previous_text`/`next_text` (no los admite). Bordes de cada bloque recortados a −55 dBFS con 60 ms
  de margen (`recortarSilencios: false` lo desactiva); pausas = `pausaDespues` o `pausaEntreBloques`. loudnorm en dos
  pasadas (si el pico no deja hacerlo lineal, ffmpeg pasa a dinámico: queda anotado en `manifest.sonoridad.modo`).
  El manifest guarda `caracteres.esta_ejecucion` y `acumulado`, y el id de voz solo si viene de `locucion.json`.
- **`transcribir`** (narración): trozos = bloques del manifest (unidos hasta 120 s), prompt = `whisper.prompt` + siglas,
  productos y cifras del texto; escribe también `work/analisis/rms100ms.json` y `audio.json`. Corrección por bloque con
  `difflib` (iguales → grafía del guion; sustituciones → tiempos repartidos por letras; omitidas → interpoladas; de más →
  quitadas). Queda `work/transcripcion/whisper_sin_corregir.txt` para comparar.
- **`linea`** (narración): un segmento `{dst: previo, src: 0, dur: locución}`; `intro.previo`/`outro.coda` = segundos de
  música sin voz antes/después (por defecto intro 5 s / cola 0,6 s), `intro.hasta` y `outro.cue` como cues de la
  locución; `planos: []` (el motor pone uno neutro), sin gestos, sin `plancha`, `narracion: true`. Disposiciones
  `completa` (intro, cierre, rótulos, `titulo`, `lamina`, `ilustracion`) y `voz` (el resto y los huecos); `bocadillo`
  fuerza `voz`; `gesto3d` y cualquier otra disposición → error; reacción en tramo `completa` → aviso. Base a −24 LUFS
  si no hay `lufs`. Nuevo en todos los modos: si un cue no aparece, se reintenta con los `fixes` aplicados a su frase.
- **`media`** (narración): `narracion.m4a` + `timeline.json` + extras; props con `media.audio = "narracion.m4a"` (lo
  que lee el motor, §8) y sin `mezzanine`.
- Prueba de principio a fin: `proyectos/_prueba-narracion` (3 bloques, 264 caracteres de TTS, 18,3 s de voz,
  −16,0 LUFS / −1,5 dBTP; 46 palabras, 1 corregida «3» → «tres»; timeline de 27,9 s sin errores). `timeline.json` y
  `props-local.json` válidos contra el zod del motor ya adaptado, igual que `devday-2026`, `dora-milikito` y `dora-v2`.
  Se queda como banco de pruebas: con la caché, `voz` no gasta caracteres (`rm -rf proyectos/_prueba-narracion` si sobra).

## En curso / pendiente

- `devday-2026`: `linea` da 6 errores del guion (eventos 1–3 dentro de la intro por `intro.hasta`; eventos 4, 23 y
  28 dentro de rótulos de capítulo), avisado al orquestador.
- Proponer al contrato (`docs/CONTRATO.md` §8): `locucion.json`, `work/voz/manifest.json` e `intro.previo`/`outro.coda`
  en segundos para narración.
- `proyectos/dora-v2` queda listo para el motor (`--public-dir proyectos/dora-v2/media`).
- `dora-milikito`: listo para el motor; faltan stills cuando el motor pinte el §7 y el render en Lambda (con OK).
- Proponer al contrato (`docs/CONTRATO.md` §7.3): `intro.previo`, `outro.coda`, `intro.hasta` y `"escenario"` en
  `timeline.json`.
- Pendiente de revisión humana en dora-v2: `BRIEF.md` (plantilla sin confirmar), escuchar las juntas de los
  cortes y el `fix` «sin EDR» (ver informe), y validar los textos de los paneles.
- Posibles mejoras: `pose --paso 2` para ir el doble de rápido; `preparar --paralelo` (pose en CPU mientras
  recorta la GPU); plancha a más escala para planos cortos a s > 0,9; máscara a media resolución o α dentro de la plancha
  para abaratar el render (propuesta del motor, cambio de contrato).

## Retomar

```console
tools/kaleidos recortar dora-v2                     # continúa la máscara donde se quedó (partes de 2500 fotogramas)
tools/kaleidos recortar dora-v2 --desde 30000       # o desde un fotograma concreto (rehace las partes que pise)
tools/kaleidos recortar dora-v2 --solo plancha      # solo la plancha (necesita work/mascara.mp4 completa)
tools/kaleidos transcribir dora-v2 --rellenar       # solo retranscribir huecos con voz
tools/kaleidos linea dora-v2 && tools/kaleidos media dora-v2 && tools/kaleidos capitulos dora-v2
# dora-milikito (preproceso heredado de dora-v2): regenerar guion, extras y línea
uv run --project tools python proyectos/dora-milikito/work/guion/eventos.py   # reescribe guion.json › eventos
tools/kaleidos media dora-milikito && tools/kaleidos linea dora-milikito && tools/kaleidos capitulos dora-milikito
```

El guion de dora-v2 se generó con un script de conversión del montaje anterior (ver `informe.md`); si se retoca
`guion.json` a mano, basta con `linea` + `media` + `capitulos`.
