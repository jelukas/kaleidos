# Informe · dora-v2 («DORA en la práctica»)

Preproceso completo del bruto `brutos/prueba1.mp4` (3840×2160, 25 fps, 51 067 fotogramas, 34:02,7) con el
pipeline de `tools/` en un Mac M1 Pro (8 núcleos, 16 GB, sin CUDA). Fecha: 2026-09-29. Falta el render (motor y
Lambda), que no forma parte de este encargo.

## Estado

| Pieza | Estado |
|---|---|
| `proyecto.json` | Hecho con `nuevo` (salida 1920×1080 a 25 fps, recorte activado, prompt de Whisper con términos DORA) |
| `BRIEF.md` | **Plantilla sin confirmar**: la intención no se ha validado con el usuario |
| `work/analisis/` | Completo (`resumen.md`, 6 hojas de contactos, fondo, ponente, audio, recomendaciones) |
| `work/transcripcion.json/.txt` | Completo: 4160 palabras (301 recuperadas en huecos con voz) |
| `work/mezzanine.mp4` | Completo: 51 067/51 067 fotogramas, H.264 1080p, GOP 2 s, faststart, audio AAC −16 LUFS |
| `work/mascara.mp4` | Completo: 51 067/51 067 fotogramas (RVM resnet50), 188 MB |
| `work/plancha.mp4` + `plancha.json` | Completo: 51 067/51 067 fotogramas, 1968×1620 (región x 856, ancho 2624, alto 2160, escala 0,75) |
| `work/pose.json`, `work/gestos.json` | Completos: detección 93,9 % (el resto son los tramos sin ponente), 89 gestos candidatos |
| `guion.json` | Hecho: conversión del montaje de `dora-videocurso-v1` (ver abajo) |
| `timeline.json` | Hecho, **sin errores bloqueantes**: 19 113 fotogramas (12:44,5), 114 segmentos, 128 planos, 15 capítulos, 64 eventos, 524 páginas de subtítulos, 12 gestos |
| `media/` | Enlaces duros: mezzanine, plancha, máscara, `audio.m4a`, timeline y `extras/` (pruebas de profundidad y ampliación) |
| `capitulos.txt` | Hecho: 15 capítulos de YouTube (0:00 … 11:41) |

## Tiempos reales (reloj de pared, `work/logs/tiempos.json`)

| Paso | Tiempo | Detalle |
|---|---|---|
| `analizar` | 1 min 45 s | Una sola decodificación del 4K por software a 512 fps (VideoToolbox iría a 128 fps) + audio en 27 s |
| `transcribir` | **3 min 15 s** | whisper.cpp Metal + large-v3-turbo, 35 trozos, 1863 s de audio a 9,6× tiempo real (la versión anterior con medium tardó ~77 min) |
| `transcribir --rellenar` | 2 min 56 s | 91 huecos con voz sin palabras retranscritos (GPU compartida con el recorte) |
| `master` audio | 2 min 51 s | −16,0 LUFS, −1,7 dBTP, LRA 11,7 LU, loudnorm lineal en la 2.ª pasada |
| `master` vídeo | **4 min 56 s** | 175 fps; 1 tramo VideoToolbox + 2 software/`scale_vt`, etalonaje en GPU (el proyecto anterior tardó 18 min 46 s) |
| `recortar` medida (60 s) | 1 min 48 s | 18,0 fps de media, 21,8 fps en régimen |
| `recortar` máscara completa | **49 min 32 s** | 17,2 fps de media (ver «Incidencias»: GPU compartida); con la GPU libre, 28,6 fps → ~30 min estimados |
| `recortar` plancha | 6 min 52 s | 125 fps |
| `pose` | **6 min 43 s** | 127,5 fps con 3 procesos (PoseLandmarker full a 960×540) |
| `linea` | 0,4 s | |
| `media`, `capitulos` | < 0,1 s | |
| `profundidad` / `ampliar` (1 imagen 960×540) | 27,7 s / 9,6 s | 1,8 s y 3,0 s por imagen en MPS; el resto es cargar el modelo |

Total de preproceso encadenado (análisis + transcripción + máster + máscara + plancha + pose): ~1 h 18 min medido
con interferencias; ~55 min estimados con la máquina libre.

## Decisiones

- **Audio**: la voz solo está en el canal izquierdo (el derecho es silencio digital); se usa ese canal en
  transcripción y máster, y el máster se entrega en estéreo dual-mono.
- **Etalonaje** (desde el análisis del fondo liso, 133 muestras sin ponente): ganancias R 1,019 · G 0,998 · B 0,966
  para neutralizar el fondo lavanda, saturación ×0,94, desaturación azul/magenta 0,3, curva S suave y nitidez de
  luma 0,55. Fondo corregido medido: RGB ≈ 247/247/245. LUT equivalente en `work/lut/grade.cube`.
- **Recorte**: RVM resnet50 (fp16, `downsample_ratio` 0,25, lotes de 8). Comparado en los mismos fotogramas con
  RVM mobilenetv3 (36,9 fps) y Apple Vision `accurate` (13,2 fps): resnet50 da el borde de pelo más limpio;
  mobilenetv3 deja algo más de halo y Vision un halo claro en pelo y hombro. Imágenes:
  `work/revision/comparativa_recorte.jpg` y `work/revision/comparativa_recorte_bordes.jpg`. Composición de
  control fondo·(1−α) + plancha: `work/revision/plancha_composicion.jpg`.
- **Cámara virtual**: hoja de control con un plano de cada tipo en `work/revision/planos_camara.jpg` (el borde
  inferior de la fuente queda siempre por debajo de la pantalla).

## Guion: conversión del montaje anterior

Hecha con `work/guion/generar_guion.py` (reproducible; ver `work/guion/LEEME.txt`):

- **Cortes (62)**: los rangos conservados de `scripts/tomas.json` convertidos a tramos eliminados, con los bordes
  ajustados a la nueva transcripción (no partir la última palabra de una frase). La transcripción nueva destapó
  **repeticiones dentro de rangos que el montaje anterior daba por buenos** (Whisper medium tampoco las vio); se
  añadieron 5 cortes y se ajustaron 6 (primera toma de «una vez realizada…», «de repente, tu portátil…», «estás
  operando», «si tu tablet personal…», «saltárselo porque…», «en paralelo», «de datos»; se conservan «Mientras»,
  «datos.» y «Pero el»; se quita un «para» suelto).
- **Capítulos (15)**: cada caso y cada una de sus cuatro opciones, como en el `capitulos.txt` anterior; acento por
  caso y objeto 3D en el rótulo de cada caso (contrato, escudo, reloj).
- **Eventos (64)**: los 63 gráficos de `montaje.ts` traducidos a kinds del contrato (`opciones`, `lista`,
  `comparativa`, `pasos`, `cita`, `linea`, `mapa`, `cifra`; `clave` → `pop` grande; `escena3d`), menos el «pop»
  final (lo taparía el cierre) y una cita sustituida por un gesto; los contadores con varias cifras pasan a `lista`.
  Cada momento se ancla con un cue de la nueva transcripción verificado con el buscador de `linea`.
  `disp: dividida` → `lado: der`; `esquina` → `lado: izq`.
- **3 `gesto3d`** en gestos amplios detectados por la pose: 1175 s «Contención dentro del protocolo»
  (engranajes), 1600 s «La regla se erosiona» (candado) y 2015 s «Reiniciar puede complicar la recuperación» (orbe).
- **Intro de 3,8 s** (termina cuando la ponente dice «Caso 1») y **cierre de 4,5 s** sobre la última frase.
- **`fixes`**: DORA, SIEM, Pack, prerrequisito, prórroga, «moverse lateralmente», «la más sutil», «DORA quiere»,
  «y, si aplica, regulatorias», mayúsculas de retomas y **«sin EDR»** en la retoma de 1651 s (se oye —hay
  energía de voz en 1656,6–1657,4 s— pero Whisper no lo transcribió): **verificar a oído**.
- No se trasladaron los 14 «zooms de énfasis» del montaje anterior: el contrato no tiene ese campo.

## Avisos de `linea` (ninguno bloqueante)

- 12 paneles de opciones y 2 listas empiezan en un rótulo de capítulo y se retrasan a su final (1–91 fotogramas).
- 2 de 113 cortes no coinciden con un cambio de plano por quedar entre segmentos de < 1,2 s (fotogramas 14 892 y 19 084).
- Un segmento de 1,16 s entre cortes («por parte de IT.», 2021,65 s).

## Incidencias y límites

- **GPU compartida**: durante el recorte completo corrió en la misma máquina un render de Remotion ajeno a este
  trabajo (`motor/`), además de la pose y el relleno de Whisper; hubo 3,5 GB de swap y el recorte bajó a 3–4 fps
  unos minutos. La máscara es correcta (fotogramas validados), pero el tiempo medido está inflado.
- **MediaPipe 1.0.1** aborta en macOS: fijada la 0.10.35. Esa versión trae telemetría de uso hacia Google:
  `pose` se ejecuta con `sandbox-exec` sin red. La primera prueba se colgó (el `Pool` esperaba a un proceso muerto).
- **whisper.cpp**: el DTW exige desactivar flash attention y falla con trozos de muy pocos tokens.
- **Contrato** (acordado con el motor): en `cifra`, el valor de arranque del contador va como `valorInicial`
  porque `desde` ya es el fotograma del evento. `timeline.json` rellena además las extensiones que el motor admite:
  `plancha.mascara: "fuente"`, `plancha.curva: "metodo"` y `gestos[].pista` (los 12 gestos). `props-local.json`
  lleva `media.audio: "audio.m4a"` (el AAC del mezzanine sin recodificar, 95 754 paquetes idénticos): con recorte,
  en Lambda basta con subir el audio. No hay eventos `ilustracion` (no aplican a una clase larga); `linea` los
  acepta y valida. **`timeline.json` y `props-local.json` pasan el esquema zod del motor.**
- **Densidad**: con 64 eventos en 12:44 casi todo el vídeo tiene un panel, así que 124 de 128 planos son
  forzados (sideL/sideR/card/popL). Dentro de cada panel largo, los cortes de silencio se disimulan con un +7 % de
  escala alterno.
- **Subtítulos**: palabras con marcas de DTW realineadas con la energía; las 301 recuperadas en huecos tienen marcas
  aproximadas. No se ha hecho un visionado ni una escucha completos (no hay render todavía): hay que revisar a
  oído las juntas de los cortes y leer los subtítulos sobre el vídeo.
- **Privacidad**: la transcripción contiene charla del equipo con nombres de pila; todo cae en tramos cortados y
  nada de eso aparece en `timeline.json`, `guion.json`, gráficos ni informes. `work/` está fuera de git.
- El contenido es un resumen de lo que dice la voz (reglas editoriales del contrato); por ser contenido
  regulatorio, conviene que lo valide un experto.
