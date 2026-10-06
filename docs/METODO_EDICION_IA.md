# Método de edición de vídeo con IA (Remotion + Claude)

Instrucciones y criterios que se siguieron para editar dos vídeos en este proyecto:

- **A. Pieza corta ilustrada:** 54 s, presentadora sobre fondo blanco alternando con ilustraciones de acuarela.
- **B. Clase larga:** 31 min en 4K, un solo plano fijo de un ponente sobre fondo liso.

El documento está pensado para que otro proyecto lo analice y decida qué adoptar. Cada apartado indica si es un
**principio general**, una **receta técnica probada** o un **parche/decisión local** que conviene revisar.

---

## 0. Cómo leer este documento

| Etiqueta | Significado |
|---|---|
| **[General]** | Criterio que aplicaría a cualquier vídeo |
| **[Probado]** | Receta técnica que funcionó con estos parámetros y esta máquina |
| **[Local]** | Decisión tomada para estos vídeos concretos; no la copies sin pensar |
| **[Revisar]** | Algo que funcionó a medias o que haría distinto |

Máquina de referencia: Windows 11, RTX 3050 8 GB, 16 hilos, ~40 GB libres en disco.
Software: Remotion 4.0.529, React 19, three.js 0.186, Python 3.12 (entorno con `uv`), PyTorch 2.11 + CUDA 12.8 y ffmpeg con NVDEC/NVENC.

---

## 1. Principios de trabajo [General]

1. **Analizar antes de editar.** Se extraen metadatos, hojas de contactos, cortes de escena, silencios y
   transcripción, y con eso se presenta un plan. En el vídeo A el usuario aprobó el plan y pidió «hazlo todo del
   tirón». A partir de ahí se toman decisiones razonables sin preguntar, y se documentan.
2. **Todo sincronizado con la voz.** La voz original es la columna vertebral. En A no se tocó el tiempo: el
   fotograma N del montaje era el N del original. En B se cortó, y todo se expresa en tiempo de montaje mediante
   una EDL.
3. **Separar en capas.** Fondo nuevo, elementos 3D detrás, ponente recortado, elementos 3D delante, gráficos 2D,
   subtítulos y grano. La separación por capas es lo que permite cambiar el fondo, mover al ponente y meter
   texto detrás de él.
4. **Datos antes que código.** Lo editorial (capítulos, gráficos, cortes) vive en un JSON escrito a mano. Un
   script lo convierte en línea de tiempo, y los componentes de Remotion solo pintan esa línea de tiempo.
5. **Verificar con imágenes, no con suposiciones.** Tras cada cambio se renderizan fotogramas sueltos, se montan
   en hojas de contactos y se miran. La mayoría de los fallos se detectaron así: un encuadre que tapaba el título,
   solapes, contornos que no se pintaban.
6. **No inventar contenido sensible.** En contenido clínico o legal, los gráficos resumen lo que dice la voz. No
   se añaden decisiones ni opciones de respuesta que el guion no da. Las incoherencias del material (dos números
   de lote distintos, «el lote está linfodeplecionado» cuando es el paciente) se señalan en vez de ocultarse.
7. **Privacidad.** No se ponen nombres reales de personas en los gráficos ni en los resúmenes. La persona del
   caso («Ana») era ficticia y venía en el guion.
8. **Informar con honestidad.** Se dice qué se ha verificado (fotogramas muestreados, no un visionado completo),
   qué falló y cuánto tiempo se perdió por ello.

---

## 2. Fase de análisis [General + Probado]

Checklist (todo con ffmpeg/ffprobe):

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact in.mp4
# Hoja de contactos (1 fotograma cada N s)
ffmpeg -i in.mp4 -vf "fps=1/2,scale=480:-1,tile=4x4" -frames:v 1 sheet.jpg
# Cortes de escena
ffmpeg -i in.mp4 -vf "select='gt(scene,0.08)',showinfo" -an -f null - 2>&1 | grep pts_time
# Energía de movimiento por fotograma: distingue imagen fija con zoom (Ken Burns) de vídeo real
ffmpeg -i in.mp4 -vf "scale=160:90,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -an -f null -
# Silencios
ffmpeg -i in.mp4 -af silencedetect=noise=-35dB:d=0.4 -vn -f null -
```

Qué buscar:

- **Tipo de plano:** ¿un plano fijo largo o varios bloques? ¿Hay fundidos? Localiza los fotogramas «limpios», sin
  mezcla, de cada bloque.
- **Fondo:** si es liso y claro, se puede recortar con IA. Ojo: una bata blanca sobre fondo blanco hace fallar
  el croma, y la segmentación por IA sí lo resuelve.
- **Ilustraciones:** si el movimiento entre fotogramas es constante, son imágenes fijas con zoom. Confírmalo
  alineando fotogramas (ORB + RANSAC, apartado 4). Si el residuo es bajo (≈3 px), se reconstruye la escena
  desde la imagen fija y se controla la cámara.
- **Gestos:** identifica en qué momentos el ponente abre las manos. Son los puntos buenos para 3D anclado a las manos.
- **Transcripción con tiempos por palabra.** Léela entera: revela la estructura (capítulos), las tomas falsas
  (en B, 1 min 40 s de charla fuera de guion y una repetición) y los errores de reconocimiento que habrá que
  corregir (en B: «AIAC» → «AI Act», «ESIA» → «AESIA»).
- **Resolución de origen:** 4K para una salida en 1080p permite reencuadres de hasta 2× sin perder nitidez.

---

## 3. Elegir el enfoque según el vídeo [General]

| | A. Corto ilustrado (54 s) | B. Clase larga (31 min) |
|---|---|---|
| Montaje | Hecho a mano, escena a escena | Semiautomático: guion JSON → script → timeline |
| Tiempo del montaje | 1:1 con el original | Con cortes (EDL) |
| Ilustraciones | Reconstruidas en 2,5D con profundidad | — |
| Ponente | Recorte en WebP RGBA por fotograma (414 fotogramas) | Máscara en vídeo + plancha premultiplicada |
| Gráficos | Diseñados uno a uno y anclados a puntos del dibujo | Componentes genéricos por tipo de panel, alimentados por datos |
| 3D | Un objeto por escena (nevera, termómetro, gráfica, reloj…) | Estrellas UE, pirámide de riesgo, orbe entre las manos |
| Tiempo total | ~50 min | ~3 h (94 min de render) |

Regla práctica: **por encima de ~2–3 min, no diseñes a mano.** Construye un sistema de datos y componentes.

---

## 4. Preproceso: herramientas, modelos y parámetros [Probado]

### 4.1 Transcripción
- **faster-whisper** con **large-v3-turbo** en GPU (float16), `word_timestamps=True`, `vad_filter=True`,
  `beam_size=5`, `condition_on_previous_text=False`. En B, 31 min tardaron 2 min 10 s.
- Truco en Windows: hacer `import torch` antes de `faster_whisper` para que CTranslate2 encuentre las DLL de CUDA/cuDNN.
- Después, **corrección manual**: fusionar tokens partidos («CT» + «-09», «19» + «.20») y aplicar un diccionario
  de correcciones sobre las palabras (`fixes` en el guion).

### 4.2 Recorte del ponente (máscara)
- **RobustVideoMatting ResNet50** (vía `torch.hub`), en half precision y con `downsample_ratio=0.25` sobre
  entrada 1080p.
- **[Probado] Procesar en lotes temporales** `[1, T=8, 3, H, W]`: el codificador trabaja en lote y el estado
  recurrente avanza igual. Pasó de 13–16 fps a 25–30 fps.
- Pipeline sin ficheros intermedios: `ffmpeg -hwaccel cuda` decodifica y escala a 1080p y lo envía por tubería
  en rgb24 → RVM → tubería en gris → ffmpeg `h264_nvenc` (`-cq 16`). Resultado: una máscara en vídeo de ~400 MB
  para 31 min.
- Calentar el estado recurrente repitiendo 6 veces el primer fotograma.
- Cerrar un poco el borde para quitar el halo del fondo original: `a = clip((a − 0.04) / 0.92)` y, además, un
  contraste en la máscara (`clip((v·0.93 − 128)·1.35 + 128)`).
- **[Revisar]** El proceso terminó a mitad de vídeo sin error: 24 161 de 46 985 fotogramas. Hubo que relanzar
  desde ese fotograma (`-ss` antes de `-i`) y concatenar con el concat demuxer. **Comprueba siempre el número
  de fotogramas de salida** y no filtres los logs de ffmpeg con `grep`: se pierden los errores.

### 4.3 Pose y manos
- **MediaPipe Tasks**: `PoseLandmarker full` (clase entera, a 960×540, ~28 fps en CPU) y `HandLandmarker`
  (solo en los tramos cortos del vídeo A).
- Se guardan nariz, hombros, muñecas e índices en píxeles del original.
- Suavizado Savitzky-Golay (ventana 9, orden 2) e interpolación de los huecos.
- Usos: centrar cada plano (mediana de la nariz en el plano) y detectar gestos amplios.

### 4.4 Ilustraciones (solo vídeo A)
- Confirmar que son imágenes fijas: ORB (4000 puntos) + `estimateAffinePartial2D` con RANSAC contra un
  fotograma de referencia. Un residuo ≈3 px confirma que es imagen fija con zoom.
- Extraer el fotograma más abierto que no esté en un fundido.
- **Real-ESRGAN x2plus** (cargado con `spandrel`, fp16, por teselas de 512) para tener margen de zoom.
- **Depth Anything V2 Base** (`transformers`, `depth-estimation`) → mapa de profundidad normalizado por
  percentiles, con filtro bilateral y desenfoque suave.

### 4.5 Sonido
- Efectos sintetizados con ffmpeg `lavfi`: ruido rosa filtrado (barrido) y senoidales (pop, alarma, tic-tac,
  golpe grave).
- **[Revisar]** Funcionan, pero son básicos. No hay música porque no había ninguna con licencia.

---

## 5. Guion editorial (vídeo B) [General + Local]

Un JSON escrito a mano tras leer la transcripción: `src/morato/data/script.json`.

```jsonc
{
  "cuts": [ { "from": 0, "to": 5.85 }, { "fromCue": [1720, "hay una serie de reglas"], "toCue": [1821, "y para terminar vamos"] } ],
  "chapters": [ { "cue": [50.0, "en la unión europea"], "n": 3, "title": "El Reglamento Europeo de IA", "kicker": "AI Act", "accent": "gold", "stars": true } ],
  "events": [
    { "type": "panel", "cue": [117, "hay diferentes roles"], "until": [162.5, "hay una cuestión"], "side": "right", "kind": "compare", ... },
    { "type": "pop", "cue": [486, "revisar es contrastar"], "text": "Revisar es contrastar,", "sub": "no releer", "big": true }
  ],
  "fixes": { "AIAC": "AI Act", "ESIA": "AESIA" }
}
```

- **[General] Sincronizar por frase clave, no por segundos.** Cada `cue` es `[segundo aproximado, "frase"]`. El
  script busca la frase normalizada (minúsculas, sin tildes ni puntuación) a partir de `t − 2 s` y usa el inicio
  de la primera palabra. El gráfico entra justo cuando se dice, y el guion sobrevive a pequeños cambios de
  tiempos. Lista las frases no encontradas y corrígelas. En B fallaron dos por las propias correcciones de
  `fixes` («la esia» → «la aesia»).
- **Densidad usada en B [Local]:** 19 capítulos y 42 gráficos en 29 min, es decir, un gráfico cada ~40 s. Los
  paneles duran lo que dura la explicación (10–50 s) y los elementos de cada panel aparecen con su propia frase.
- **Tipos de panel:** persona, list, stat, card, quote, compare, loop, articles, pyramid (3D), checklist, steps,
  case (con sello de veredicto), roles, authorities, fines, rules. Cubren casi todo el contenido de una clase
  expositiva.
- **[General] Cortar tomas falsas leyendo la transcripción entera**, sobre todo el final. En B, el ponente
  repitió el resumen: se dejó la segunda toma porque era la limpia.

---

## 6. Línea de tiempo (vídeo B) [Probado]

`tools/morato/04_timeline.py` genera `timeline.json` con segments, shots, chapters, events, captions y gestures.

**Cortes**
- Los del guion, más los silencios de más de **0,8 s** entre palabras. De cada silencio se dejan **0,25 s** a
  cada lado.
- Al final se deja 1,6 s tras la última palabra. Resultado: de 31:19 a 29:03.

**Mapa src→dst**
- Todos los tiempos del guion (en segundos del original) se convierten a fotogramas del montaje.
- Si un tiempo cae dentro de un corte, pasa al inicio del tramo siguiente.

**Eventos**
- Los paneles que empezarían durante un rótulo de capítulo (85 fotogramas) se retrasan al final del rótulo.
- **Nunca dos gráficos a la vez:** cada evento termina, como mucho, 6 fotogramas antes del siguiente. Este
  problema se detectó comprobando solapes justo antes del render final.

**Planos de la cámara virtual**

1. **Ventanas forzadas:**
   - panel a la derecha → ponente a la izquierda (`sideL`), y viceversa;
   - frase clave grande → `popL`;
   - rótulo de capítulo e intro → `card`, con el ponente a la derecha y el título a la izquierda.
2. **Resto:** se cambia de plano en finales de frase, cada 4–11 s, siguiendo el ciclo
   `medium, close, medium, wide, close, medium, close`.
3. **Cada corte de silencio coincide con un cambio de plano**, para disimular el salto (el típico jump cut de YouTube).
4. Ningún plano dura menos de 1,2 s: los cortos se funden con el vecino.
5. Los planos forzados se marcan y **ninguna regla posterior los modifica**. Un error real: la regla «no repetir
   el mismo plano» convertía el plano abierto de un rótulo en plano medio, y el ponente tapaba el título.

**Gestos**
- Condiciones:
  - las dos muñecas visibles (>0,6);
  - por encima de hombros + 560 px (en 4K);
  - separación horizontal entre 620 y 1500 px;
  - al menos 16 fotogramas seguidos;
  - que no crucen un corte ni caigan en un plano corto.
- Se quedan como mucho 12, separados al menos 45 s y ordenados por separación × duración.

**Subtítulos**
- Palabras corregidas y convertidas a tiempo de montaje (se descartan las que caen en cortes).
- Páginas de 34 caracteres como máximo, que se cortan en pausas de más de 0,5 s o en punto final.

---

## 7. Composición en Remotion

### 7.1 Estructura [Probado]
- Una composición 1920×1080 a 25 fps.
- Los tramos de vídeo son `<Sequence from={dst}>` con `<OffthreadVideo trimBefore={src}>`. El volumen hace un
  fundido de 2–3 fotogramas en cada borde para evitar chasquidos.
- La cámara se calcula **fuera** de los tramos, con el fotograma absoluto, y se pasa por props.

### 7.2 Recorte del ponente sin secuencias de imágenes [Probado — la pieza clave de B]

```
B = fondo · (1 − α)      → <Segments src=matte  style={{ mixBlendMode: "multiply", filter: "invert(1)" }}/>
A = ponente · α          → plancha premultiplicada generada con ffmpeg
resultado = A + B        → <Segments src=premult style={{ mixBlendMode: "plus-lighter" }}/>
```

Todo va dentro de un `AbsoluteFill` con `isolation: "isolate"`. Lo que va detrás del ponente (fondo, texto
detrás, 3D detrás) se pinta en B; lo que va delante (paneles, subtítulos), encima del resultado.

Plancha premultiplicada: recorte a la franja del ponente y escala 0,75.

```bash
ffmpeg -hwaccel cuda -i fuente4k.mp4 -i matte.mp4 -filter_complex "[0:v]crop=2400:2160:768:0,scale=1800:1620:flags=lanczos,format=gbrp[fg];[1:v]crop=1200:1080:384:0,format=gray,lut=y='clip((val*0.93-128)*1.35+128\,0\,255)',scale=1800:1620:flags=bicubic,format=gbrp[a];[fg][a]blend=all_mode=multiply,format=yuv420p[v]" -map "[v]" -map 0:a -c:v h264_nvenc -preset p5 -rc vbr -cq 18 -b:v 0 -g 50 -c:a aac -b:a 192k premult.mp4
```

- Para el vídeo A (414 fotogramas) bastó con **WebP RGBA** por fotograma (~90 KB cada uno) y `<Img>`. Para B
  habrían sido millones de ficheros y ~16 GB.
- **[Revisar]** Un `crop` sobre fotogramas de GPU (`-hwaccel_output_format cuda`) **se ignora sin avisar**. Con
  `-hwaccel cuda` a secas sí funciona. Comprueba siempre la resolución de salida.

### 7.3 Cámara virtual [Probado]
- `s` es la escala sobre el 4K (0,5 = plano completo en 1080p). `(tx, ty)` es la posición en pantalla de la
  nariz, tomada de la mediana de la pose en ese plano.

  | Plano | s | tx | ty |
  |---|---|---|---|
  | wide | 0,52 | 960 | 250 |
  | medium | 0,76 | 960 | 372 |
  | close | 0,90 | 960 | 430 |
  | sideL / sideR | 0,68 | 560 / 1360 | 345 |
  | popL | 0,74 | 640 | 368 |
  | card | 0,54 | 1440 | 262 |

- Acercamiento lento dentro de cada plano (1–4 %).
- Transición suave de 16 fotogramas al entrar o salir de un plano lateral; el resto son cortes secos.
- Restricción: el borde inferior del cuadro original nunca puede verse (`oy ≥ 1080 − s·2160`). Los bordes
  laterales y el superior no importan, porque fuera del ponente todo es fondo nuevo.

### 7.4 Ilustraciones en 2,5D (vídeo A) [Probado]
- Plano de three.js subdividido (480×270) desplazado por el mapa de profundidad en el shader de vértices.
- **Compensación proyectiva** `p.xy *= (D − z) / D`: desde la cámara de reposo la imagen se ve idéntica al
  original, y al mover la cámara aparece el parallax.
- Profundidad de desplazamiento ≈1,8 unidades y desplazamiento lateral de cámara ≤0,6. Con más, se estiraban
  los bordes entre las manos y el fondo.
- Anclajes: `anchor(u, v, lift)` convierte un píxel de la imagen en un punto 3D sobre la superficie. Así los
  objetos 3D y las etiquetas 2D siguen al dibujo con cualquier movimiento de cámara. Los puntos se eligen a mano
  sobre la imagen con una rejilla de coordenadas.
- La oclusión (3D detrás de las manos dibujadas) la resuelve el propio buffer de profundidad. No hizo falta SAM.

### 7.5 3D [Probado]
- `@remotion/three` (`ThreeCanvas`, con `flat` para que no aplique tone mapping) y React Three Fiber.
- Estética de ilustración: `MeshToonMaterial` con rampa de 3 tonos y **contorno de tinta propio** (casco
  invertido: la geometría inflada por la normal y pintada por detrás).
- **[Revisar] `Outlines` de drei no se pintaba en el render de Remotion** (añade la malla en un efecto, después
  del primer fotograma). Declara todo en JSX.
- Texto sobre objetos 3D: `CanvasTexture` dibujada en un canvas 2D. No se usa `drei Text`, porque descarga
  fuentes.
- Objetos anclados a las manos: palmas o muñecas de MediaPipe → encuadre → pantalla → mundo con
  `screenToWorld`. Al soltarlo, **congela el punto de partida en el pico del gesto**; si no, el objeto
  acompaña a las manos cuando bajan.

### 7.6 Gráficos y estilo [Local]
- **Vídeo A:** paleta sacada de las ilustraciones; tarjetas blancas, chips y recuadros dibujados sobre el dibujo.
- **Vídeo B:** estilo moderno oscuro con acentos por capítulo (violeta, cian, dorado, rojo), paneles de cristal,
  Space Grotesk para titulares e Inter para el texto.
- **Texto detrás del ponente:** solo funciona si el ponente tapa poco. Por eso el encuadre `card` desplaza al
  ponente a un lado y el título va en el otro.
- Subtítulos palabra a palabra con la palabra activa resaltada con el color del capítulo.
- Barra de progreso por capítulos y chip del capítulo actual.

---

## 8. Rendimiento y disco [Probado — lo que más tiempo costó]

| Cambio | fps de render |
|---|---|
| Vídeo 4K por `OffthreadVideo` + máscara dos veces + `blur(120px)` + `backdrop-filter` | ~2,5 |
| Plancha premultiplicada (1800×1620) + máscara una vez + degradados en vez de desenfoques | ~6 |
| `offthreadVideoThreads: 10–12` (**el valor por defecto es 2** y era el cuello de botella) | ~7,7–9 |
| Más pestañas de Chrome (`concurrency` de 8 a 14) sin subir los hilos | No mejora |

Configuración final:

```js
renderMedia({
  codec: "h264",
  crf: 19,
  concurrency: 10,
  offthreadVideoThreads: 12,
  offthreadVideoCacheSizeInBytes: 3 * 1024 ** 3,
  chromiumOptions: { gl: "angle" },
  timeoutInMilliseconds: 240000,
});
```

**Disco:** Remotion 4 hace dos copias que pueden llenar el disco.
- Cada `bundle()` **copia `public/` entero** a una carpeta temporal.
- Cada `renderStill`/`renderMedia` **descarga cada vídeo** a `%TEMP%\remotion-v4.*-assets*` (2,2 GB por
  llamada con un 4K).

Consecuencia: unos pocos fotogramas de prueba llenaron el disco. Soluciones:
- empaquetar siempre en `out/bundle` fijo y reutilizarlo;
- borrar `remotion-v4.*-assets*` tras cada prueba;
- dejar en `public/` solo lo que usa la composición;
- usar enlaces duros (`ln`) en vez de copias.

**Previsualización:** Remotion Studio compone en directo y en B va a saltos. La vista fiable es el MP4.

---

## 9. Control de calidad [General]

1. `tsc --noEmit` tras cada bloque de cambios.
2. Script propio que renderiza N fotogramas con un único empaquetado y un único navegador, más una hoja de
   contactos. Se prueba un fotograma por tipo de panel, rótulos, transiciones, gestos y el cierre.
3. Render de prueba de un tramo de 800 fotogramas para medir la velocidad antes del render completo.
4. Comprobaciones automáticas del timeline: solapes entre eventos, eventos dentro de rótulos, planos de menos de
   1,2 s y frases no resueltas.
5. Tras el render: `ffprobe` (duración, códecs), `volumedetect` (niveles de audio) y una hoja con un fotograma
   por minuto.
6. **[Revisar]** No se hizo un visionado completo. Queda pendiente revisar por oído las juntas de los cortes y
   leer los subtítulos enteros.

---

## 10. Tiempos de referencia (reloj de pared)

**Vídeo A (54 s):** unos 50 min.
- ~6 min de análisis y plan;
- ~45 min de montaje, que incluyen el preproceso (recorte, profundidad y ampliación en paralelo, pocos minutos)
  y 1 min 17 s de render.

**Vídeo B (31 min → 29 min): 3 h 05 min.**

| Fase | Duración |
|---|---|
| Análisis y transcripción | 6 min |
| Recorte del ponente | 43 min (en segundo plano; incluye repetir la segunda mitad) |
| Pose | 28 min (en segundo plano) |
| Guion editorial y código | ~50 min (en paralelo con lo anterior) |
| Optimización del render | 31 min |
| Render final | 94 min |
| Revisión | 2 min |

Sin los tropiezos se estimaron ~2 h 15 min. Un re-render tras cambiar textos o gráficos cuesta ~95 min.

---

## 11. Errores cometidos y cómo evitarlos [General]

| Error | Coste | Cómo evitarlo |
|---|---|---|
| La máscara se paró a la mitad sin error | Relanzar 24 min | Validar el número de fotogramas y ver los logs sin filtrar |
| `crop` ignorado con fotogramas en GPU | 19 min de GPU y 4,6 GB inútiles | `ffprobe` de la salida tras los primeros segundos |
| Disco lleno por las copias de Remotion | ~5 min + riesgo | `outDir` fijo, limpiar temporales, `public/` mínimo |
| Primer enfoque de render lento | ~30 min | Diseñar el compositing pensando en el render desde el principio (apartado 8) |
| El contorno de drei no se pintaba | Reescritura | Todo el 3D en JSX y determinista |
| Una regla de planos sobrescribía los forzados | Títulos tapados | Marcar lo forzado como inmutable |
| El 3D seguía a las manos al bajar | Retoque | Congelar el anclaje en el pico del gesto |
| Solapes de gráficos detectados tarde | Relanzar el render | Chequeo automático de solapes en el generador |
| El progreso del render no se veía | Monitorización a ciegas | No pasar la salida por `grep` sin `--line-buffered` |

---

## 12. Puntos abiertos para el análisis [Revisar]

- **Calidad frente a tiempo:** la plancha a 0,75 obliga a limitar el plano corto a s = 0,9 (ampliación de
  1,2×). Con más tiempo de render se podría usar el 4K completo en los planos cortos.
- **Música y sonido:** faltan una base musical con licencia y efectos con más calidad.
- **Revisión humana del contenido:** los textos de los paneles son un resumen del discurso; en contenido legal
  o clínico debe validarlos un experto.
- **Subtítulos:** solo se corrigieron los errores detectados. Conviene un diccionario de términos del dominio
  antes de transcribir (`initial_prompt` de Whisper) o una revisión completa.
- **Automatizar más el guion editorial:** en B se escribió a mano tras leer la transcripción (~20 min). Un LLM
  podría proponer capítulos y gráficos en el mismo formato JSON, con revisión humana.
- **Versión vertical 9:16:** con el ponente separado y la cámara virtual, sería casi gratis generar cortes
  verticales para redes.
- **Studio fluido:** para previsualizar en tiempo real haría falta un proxy de baja resolución de la plancha.

---

## Anexo: ficheros de referencia en este repositorio

| Ruta | Qué contiene |
|---|---|
| `tools/morato/01_transcribe.py` … `04_timeline.py` | Preproceso y generador de la línea de tiempo (B) |
| `tools/01_matte.py` … `04_depth_upscale.py` | Preproceso del vídeo A |
| `src/morato/` | Composición `ClaseIA`: `Camera.tsx`, `Panels.tsx`, `Titles.tsx`, `Hud.tsx`, `HandFx.tsx`, `three/` |
| `src/components/Illustration.tsx`, `src/lib/camera.ts` | Escena 2,5D con anclajes (A) |
| `src/three/toon.tsx` | Material toon, contorno de tinta y texturas de texto |
| `scripts/stills.mjs`, `scripts/render-clase.mjs` | Fotogramas de control y render con empaquetado único |
| `README.md` | Comandos para reproducir ambos montajes |
