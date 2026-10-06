# Informe · dora-milikito («DORA en la práctica», estilo `milikito`)

Re-edición a ~10 min de la clase DORA de `dora-v2` (12:44) con el estilo `milikito` en modo escenario. Fecha:
2026-09-30. Preproceso **heredado** de `dora-v2` con enlaces duros (0 bytes extra, 41 ficheros). Falta el render:
depende del motor (componentes §7, en curso por otro agente) y del OK del usuario para Lambda.

## Estado

| Pieza | Estado |
|---|---|
| `proyecto.json` | `nuevo --escenario --desde-proyecto dora-v2`; `escenario: true`, `preproceso.desde: dora-v2`, bloque `audio` |
| `BRIEF.md` | Escrito a partir del encargo del orquestador; **pendiente de confirmar por el usuario** |
| `guion.json` | 79 cortes, intro de marca, 3 capítulos con `sigla`, 76 eventos, cierre con resumen (generado con `work/guion/eventos.py`) |
| `images.json` → `assets/images/` | 6 láminas de cómic (gpt-image-2, `medium`, 2048×1152). Hoja: `work/revision/hoja_laminas.jpg` |
| `captures.json` → `assets/captures/` | 2 capturas de EUR-Lex (art. 30 y art. 17 del Reglamento (UE) 2022/2554) |
| `timeline.json` | **Sin errores bloqueantes**. 15 426 fotogramas (10:17,0) · 99 segmentos · 112 planos · 3 capítulos · 76 eventos · 414 subtítulos · 10 gestos · 40 disposiciones · 3 pistas de música · 78 efectos |
| Esquema zod del motor | `timeline.json` y `props-local.json` **válidos** contra `motor/src/datos/contrato.ts` (ya ampliado con el §7) |
| `media/` + `props-local.json` | Enlaces duros: mezzanine, plancha, máscara, `audio.m4a`, timeline y 17 extras (6 láminas, 2 capturas, 9 audios; 9 MB) |
| `capitulos.txt` | 4 capítulos de YouTube (0:00 · 0:10 · 3:31 · 6:48) |

## Estructura (10:17,0)

| Tramo | Salida | Contenido |
|---|---|---|
| Apertura de marca | 0:00–0:10,4 | 5,6 s **sin voz** (sintonía; tramo 586,0–591,6 s del bruto, ponente quieta) + «…pasemos a su aplicación práctica». «MASTER CLASS», rótulo genérico «Docente del curso · DORA · Casos prácticos», franja con el título y «Una formación de OpenWebinars» |
| Caso 1 · El proveedor que ya conocemos (ficha «1») | 0:10,4–3:31,6 | Enunciado, opciones A (trampa), B (riesgo), C (correcta), D (riesgo) |
| Caso 2 · La señal débil de las 9:15 (ficha «2») | 3:31,6–6:48,9 | Enunciado, opciones A–D (B correcta) |
| Caso 3 · Viernes por la tarde (ficha «3») | 6:48,9–10:09,4 | Enunciado, opciones A (trampa), B (riesgo), C (correcta), D (riesgo) |
| Cierre | 10:09,4–10:17,0 | Resumen (3 puntos) + trofeo 3D sobre una coda de 7,6 s **sin voz** (1917,2–1924,8 s del bruto) para la música de cierre |

Voz: 10:03,8 (de 12:44,5 en `dora-v2`, −2:40,7). Disposiciones: dos cajas 54 % · diapositiva grande 39 % · solo
cámara 3 % · pantalla completa 3 %. Densidad (`linea`): hueco máximo sin cambio visual **12,0 s**, ninguno > 15 s.

### Qué se recortó respecto a `dora-v2` (criterio: repeticiones y el tramo menos fuerte de cada opción)

- Caso 1: «Y si la due diligence revela un riesgo serio…» (repite la frase anterior); en la opción B, «Tú vas a usarlo
  para otra cosa…» (repite «riesgos concretos… caso de uso concreto») y «Lo que era dato no crítico allí…»; en la D,
  «Y además, fuerza al banco a utilizar herramientas peores…».
- Caso 2: «Y oye, en términos de eficiencia operativa pura…»; en B, «Si en una hora se demuestra que era falso
  positivo…»; en C, la frase introductoria sobre aislar y tres de las cinco preguntas (la del reloj ya se trató en A);
  en D, «y aparece más de lo que parece en organizaciones grandes…», «El negocio entra en escena…» y «Y si el
  incidente resulta grave, tu defensa…» (repite el cierre de la opción A).
- Caso 3: la lista de ejemplos de entregas del enunciado; en A, «Esta es la opción que casi todos hemos hecho…» y
  «Aunque te logues… Estás operando en un entorno…»; en B, «Y técnicamente, en términos de filtración directa…» y
  «La capa de virtualización no protege…» (repite la frase anterior); en C, «Y además, dejas preparado el siguiente
  escalón…»; en D, «La apertura de un ticket…» (repite la lista de la opción C) y la última frase sobre los reinicios
  forzados (el vídeo cierra en «…podría empeorar el problema»).

## Componentes usados (minuto de entrada)

| Componente | N.º | Dónde |
|---|---|---|
| Intro de marca (`estilo: marca`) | 1 | 0:00 |
| Capítulos con `sigla` + `registro: show` | 3 | 0:10 «1» · 3:31 «2» · 6:48 «3» |
| `titulo` de juego (show) | 3 | 0:14 «Proveedor» · 3:35 «Lunes, 9:15» · 6:52 «Viernes, 16:30» |
| Panel `opciones` (show) | 12 | 0:45 A→trampa · 1:32 B→riesgo · 2:14 C→correcta · 2:49 D→riesgo · 4:06 sin foco · 4:56 B→correcta · 5:36 C→riesgo · 6:16 sin foco · 7:10 A→trampa · 8:01 B→riesgo · 8:49 C→correcta · 9:26 D→riesgo |
| Panel `cifra` con contador (show) | 4 | 3:52 «3» alertas · 4:31 «2 h» · 7:08 «90 min» · 10:00 «30 min» |
| Panel `tarjeta` (show) | 1 | 4:01 «Eres el analista de turno» |
| Panel `lista` (editorial) | 5 | 0:19 · 2:32 · 5:43 · 7:35 · 9:53 |
| Panel `comparativa` (editorial) | 4 | 2:52 · 5:02 · 6:21 · 9:39 |
| Panel `pasos` (editorial) | 4 | 2:20 · 5:15 · 7:21 · 9:06 |
| Panel `checklist` (editorial) | 3 | 1:02 (art. 30) · 3:21 · 8:14 |
| Panel `cita` con `resalta` (editorial) | 3 | 1:57 · 4:46 · 6:09 |
| Panel `clave` con `resalta` (editorial) | 3 | 4:23 · 8:37 · 9:19 |
| Panel `mapa` / `linea` / `caso` (editorial) | 2 / 1 / 2 | mapa 1:42 · 5:56 — linea 6:37 — caso 2:05 · 7:43 |
| `lamina` de cómic (1–2 bocadillos) | 6 | 0:38 reunión (2) · 1:18 firma (2) · 3:38 alerta de las 9:15 (2) · 4:40 atacante (1) · 6:56 viernes (2) · 8:27 tablet (2) |
| `lamina` con captura oficial | 2 | 0:54 EUR-Lex art. 30 (1 bocadillo) · 4:15 EUR-Lex art. 17 (1 bocadillo) |
| `bocadillo` suelto | 3 | 4:09 «¡No movamos a 30 personas por una alerta!» · 7:56 «¡La regla se erosiona!» · 8:57 «No es «se me ha roto el portátil»» |
| `reaccion` | 12 | 0:47 · 2:40 · 3:02 · 3:23 · 4:05 · 5:50 · 9:47 (pregunta) · 2:03 (alerta) · 5:02 · 9:25 (idea) · 7:08 (reloj) · 8:56 (ok) |
| `sello` | 3 | 1:28 «PRERREQUISITO» (ok) · 6:19 «TRAMPA» (bad) · 8:45 «SHADOW IT» (bad) |
| `escena3d` | 2 | 3:06 `letras` «DORA» · 5:25 `balanza` |
| `gesto3d` | 1 | 9:36 `escalera` «Delegas hacia arriba» (anclado a un gesto real de la pose, 1900 s) |
| Cierre con resumen | 1 | 10:09 (3 puntos + `objeto3d: trofeo`) |

Regla del estilo de un objeto 3D por capítulo respetada (letras en el caso 1, balanza en el 2, escalera en el 3; el
trofeo va en el cierre). No se usa `llave`: donde encajaba («La clave está en la palabra preliminar») no hay gesto.
Las opciones A y D del caso 2 van sin foco: en A el veredicto llega después con el bocadillo y la captura del art. 17
(«DORA no te deja esperar»); en D el veredicto es el sello «TRAMPA».

## Láminas y capturas

- **6 imágenes** con `node scripts/images.mjs dora-milikito` (gpt-image-2, `quality: medium`, horizontal
  2048×1152), una sola pasada de 30 s, sin reintentos. Cómic de tinta gruesa, color cálido saturado y luz dramática
  (`estilo.md › lamina-comic`), sin texto, sin personas reales ni logotipos, con hueco arriba para los bocadillos
  (revisado en la hoja y con recortes a tamaño completo: la firma es un garabato abstracto y los relojes no tienen
  números). **Coste aproximado: 0,40–0,60 $** (≈ 0,06–0,10 $ por imagen; el script no registra el consumo real y la
  referencia es la tarifa `medium` de gpt-image-1 a 1536×1024; mirar la factura de OpenAI para el dato exacto).
- **2 capturas** con `node scripts/capture.mjs dora-milikito` (Chrome local, 1100×619 a escala 3): texto oficial en
  español del Reglamento (UE) 2022/2554 en EUR-Lex, abierto en el ancla del artículo (`#art_30` «Cláusulas
  contractuales fundamentales» y `#art_17` «Proceso de gestión de incidentes relacionados con las TIC»). No apareció
  banner de cookies (el script los elimina del DOM; nunca los acepta). Sin datos personales. Coste: 0 $.

## Audio (`proyecto.json › audio`, archivos del orquestador en `estilos/milikito/audio/`)

| Pista | Salida | Volumen | Notas |
|---|---|---|---|
| `sintonia` | 0:00–0:07,1 | 0,5 | Suena sola en la apertura sin voz; fundido de salida de 1,5 s al entrar la voz |
| `base` (bucle) | 0:05,6–10:09,4 | **0,18** | Bajo la voz, fundidos de 2 s. `linea` mide el archivo (−13,1 LUFS) y calcula el volumen para −28 LUFS. El 0,12 orientativo daría ≈ −31,5 LUFS |
| `cierre` | 10:08,4–10:17,0 | 0,5 | Entra al acabar la voz (fundido de 1 s) y ocupa la coda; se corta con fundido de 2 s (usa 8,6 de sus 15 s) |

Efectos (78, con su `dur` medida): whoosh 31 (cambios de disposición) · pop 28 (13 bocadillos de lámina, 3 sueltos,
12 reacciones) · sello 10 (veredicto de `opciones`) · ficha 3 (capítulos) · destello 3 (titulares) · golpe 3 (sellos).
Dos efectos a menos de 6 fotogramas: gana el de más prioridad (sello > titular/veredicto > ficha > pop > whoosh).

## Avisos de `linea` (ninguno bloqueante)

- Los tres `titulo` empezaban dentro del rótulo de su capítulo y se retrasan al final del rótulo (22, 1 y 9
  fotogramas). Previsto: cada caso abre con rótulo (ficha) y después su titular.
- `capitulos`: el cierre dura 7,6 s (< 10 s) y YouTube lo une al caso 3.

## Incoherencias del material y puntos a verificar

- **«Seis meses» / «este año»**: el enunciado del caso 2 dice «en los últimos seis meses se han dado ya tres
  similares» y la opción A, «una alerta que tres veces este año ha sido falsa». El gráfico usa la primera («En los
  últimos seis meses · 3»).
- **«CMDB»**: en la opción C del caso 1 la voz dice «inscripción en la CMDB»; DORA habla del registro de información
  (que la propia voz menciona en la opción B). El panel dice «Inscripción en la CMDB», como la voz: conviene que lo
  revise un experto.
- **A oído**: subtítulos «Está cerrando una entrega…» (6:53) y «¿Qué decisión tomaría?» (7:09) — por el resto del
  enunciado (2.ª persona) probablemente son «Estás» y «tomarías»; no se corrigen sin escucharlo. Siguen pendientes los
  `fixes` heredados de `dora-v2` «sin EDR» (el ítem «Sin EDR corporativo» del caso 3 depende de él) y «moverse
  lateralmente».
- El título oficial del art. 30 en español es «Cláusulas contractuales fundamentales»; la voz dice «cláusulas
  contractuales específicas que exige DORA» (mismo sentido). Contenido regulatorio: validación experta recomendada.

## Decisiones técnicas nuevas (tools)

- **Apertura y coda sin voz** (`intro.previo`, `outro.coda`, segundos del bruto): tramos silenciosos que se anteponen
  o se añaden a la EDL para que la sintonía y el cierre no queden debajo de la voz. `linea` comprueba que no tengan
  palabras ni voz; el motor ya trata `segmentos` como EDL (cualquier `src`). La intro termina con `intro.hasta` (cue).
  **Extensión del guion, no está en `docs/CONTRATO.md`**: propuesta para añadirla al §7.3.
- **Cámara en escenario**: plano medio forzado en la disposición «grande» (recuadro pequeño), laterales solo en los
  bocadillos y abierto en el gesto 3D; el resto alterna medio/corto (punch-in). Todos los cortes coinciden con un
  cambio de plano.
- `timeline.json` lleva `"escenario": true` (el esquema del motor lo admite).

## Qué depende del motor y del audio para cerrarlo

1. **Motor** (§7): pintar todo lo nuevo que ya valida el esquema: escenario y disposiciones, fichas del HUD, titular de
   juego, láminas con zoom y bocadillos (`x`/`y` puestos en el hueco superior de cada imagen: revisar en stills),
   bocadillo suelto, reacciones, sellos, intro de marca, objetos 3D `letras`, `balanza`, `escalera` y `trofeo`, y la
   pista `audio` (música y efectos).
2. **Revisión en imágenes**: `node motor/scripts/stills.mjs dora-milikito --at eventos` → hoja de contactos →
   corregir (posición de bocadillos, legibilidad de las capturas, duraciones cortas: opciones D del caso 1 2,9 s,
   opciones D del caso 2 2,6 s, cifra «90 min» 2,3 s). Escucha completa de juntas y de la mezcla (sobre todo el nivel
   de la base y la frecuencia de whooshes).
3. **Audio**: ya está enlazado y en la línea de tiempo; si el orquestador cambia algún archivo, basta con
   `tools/kaleidos media dora-milikito && tools/kaleidos linea dora-milikito`.
4. **Lambda**: `node motor/scripts/lambda.mjs dora-milikito --dry-run`, enseñar recursos y coste, y esperar el OK
   del usuario. Entradas al bucket privado: `timeline.json`, `audio.m4a`, plancha, máscara y 9 MB de extras.

## Tiempos

| Paso | Tiempo |
|---|---|
| `nuevo --desde-proyecto` | < 1 s (41 enlaces duros) |
| `images.mjs` (6 imágenes) | 30 s |
| `capture.mjs` (3 pasadas para localizar los artículos) | ~1 min |
| `linea` / `media` / `capitulos` | 0,3 s / < 0,1 s / < 0,1 s |

## Privacidad

Rótulos genéricos, sin nombres reales. La charla del equipo (con nombres de pila) queda en tramos cortados; los
tramos de apertura y coda son silencio. Revisados los 1 679 términos de los subtítulos: ningún nombre propio de
persona. Las láminas no muestran personas reales ni marcas; las capturas son texto normativo público.

## Render en Lambda (2026-09-30 19:06 UTC)

| Concepto | Valor |
|---|---|
| Función · región | `remotion-render-4-0-529-mem3008mb-disk10240mb-900sec` · eu-west-1 |
| Site | `motor-eac57f0d2ebb` |
| Fotogramas | 15426 (10 min 17 s), 155 funciones de 100, con recorte, 3D 5.6 % |
| Subida de entradas | 1.94 GB en 72.2 s |
| Site | 8.7 s |
| Render (reloj) | 2 min 4 s (Remotion: 1 min 57 s; estimado 1 min 48 s) |
| Facturación Lambda estimada por Remotion | 173 min 19 s |
| Descarga | 246.4 MB en 30.6 s → `resultados/dora-milikito.mp4` |
| Reintentos de trozos | 0 |
| **Coste Lambda (getRenderProgress)** | **0.411 $** (Estimated cost for function invocations only. Does not include cost for storage and data transfer.) |
| S3 (almacenamiento y peticiones) | ≈ 0.0186 $ |
| Transferencia de salida | 0.25 GB: 0 $ dentro de los 100 GB/mes gratuitos (si no, 0.022 $) |
| **Total** | **≈ 0.429 $** (estimado antes de lanzar: 0.437 $) |
| Limpieza | entradas privadas borradas; renders/<id>/ borrado |

### Posproceso local de audio (2026-09-30)
La salida de Lambda medía −15,1 LUFS con pico real de +0,3 dBTP (riesgo de saturación). Se normalizó en local a
−16 LUFS / −1,5 dBTP (loudnorm en dos pasadas, lineal; vídeo copiado sin recodificar, 15 426 fotogramas). Pendiente
en el motor: bajar ~1 dB la mezcla (voz + música + efectos) o limitar el bus para no depender de este paso.
