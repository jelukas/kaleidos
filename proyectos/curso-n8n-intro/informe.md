# Informe · Introducción a n8n (curso narrado)

## Resultado
- `resultados/curso-n8n-intro.mp4`: 1920×1080 a 25 fps, **28:27** (42.670 fotogramas, comprobados con `ffprobe`),
  audio normalizado a **−16,0 LUFS / −2,3 dBTP** (salía de Lambda a −12,9 LUFS y +0,7 dBTP).
- `resultados/curso-n8n-intro/`: **17 MP4** (bienvenida, 15 lecciones y cierre), de 1:10 a 2:18. Sus fotogramas suman
  exactamente 42.670. Se cortan en la pausa antes del primer bloque de cada lección, con fundidos de audio de 0,25 s
  (`work/cortar_lecciones.py`).
- `capitulos.txt`: capítulos para YouTube.

## Estructura
Apertura de marca (4 s) · Bienvenida · Cap. 1 Qué es n8n (1.1–1.3) · Cap. 2 Las piezas (2.1–2.4) · Cap. 3 Tu primer
flujo (3.1–3.3) · Cap. 4 Casos de uso reales (4.1–4.5) · Cierre con buenas prácticas y coda de 5 s.
La lección **4.5 «Ideas por departamento»** no estaba en el temario propuesto: se añadió para llegar a la media hora
con casos de uso reales.
Locución: 118 bloques, 4.462 palabras, 28:18 de voz (ElevenLabs `eleven_v4`, voz de `.env`). Guion visual:
135 eventos (32 láminas o capturas, 81 paneles, 11 rótulos de lección, 4 sellos), un cambio visual cada 3,6 s de media;
el tramo más largo sin cambio dura 17,8 s.

## Qué se verificó
- Hojas de contactos de los **142 eventos** (un fotograma por evento) y una hoja de un fotograma por minuto del MP4
  final. Es un muestreo de fotogramas: **no** se ha visionado el vídeo completo.
- Recuento de fotogramas del vídeo entero y de cada lección; sonoridad antes y después de normalizar.
- Las 15 capturas oficiales: nombres y fotos de quienes crearon las plantillas **difuminados** (4 capturas;
  originales en `work/capturas-originales/`). No hay datos personales en rótulos ni gráficos; los ejemplos usan datos
  genéricos («Persona 1»…).

## Fuentes e incoherencias (detalle en `fuentes.md`)
Todo dato sale de n8n.io, docs.n8n.io, zapier.com y make.com, consultados el 3/10/2026. Incoherencias entre fuentes
oficiales de n8n, resueltas usando la cifra más prudente:
- Integraciones: «over 500» (portada), 2.285 (directorio), «1000+» (comparativas), «400+» (GitHub) → el curso dice
  «más de quinientas».
- Plantillas: «+10k» (menú) y 12.895 (galería) → «más de diez mil».
- La nota de prensa de n8n aún dice «open»; la documentación dice que n8n **no** se llama open source → el curso dice
  «fair-code».
- Precios: la captura muestra el pago anual (20 € / 50 €); la voz da anual y mensual (24 € / 60 €).
- n8n 3.0 (octubre de 2026) cambia la instalación autoalojada (Docker) y la interfaz evoluciona rápido: revisar los
  nombres de botones (Publish, Execute workflow…) si el curso se reutiliza en unos meses.
- n8n Assistant y Agents están en *preview*; el curso lo dice.

## Avisos técnicos
- **Transcripción:** whisper.cpp revienta con DTW en un trozo (`WHISPER_ASSERT filter_width < ne[2]`) y tumbaba la
  pasada entera. Se ha añadido a `tools/src/kaleidos_tools/transcribir.py` una salvaguarda: si la llamada conjunta
  falla, se repite trozo a trozo y el que falla va sin DTW (realineado por energía). Aquí, 1 de 15 trozos; el 96 % de
  las palabras coincide con el texto y el resto se corrige contra `locucion.json`.
- **Motor (compatible hacia atrás):** token `registros.editorial.mayusculas` (defecto `true`) para que los estilos
  claros no fuercen mayúsculas («N8N»); `marca.texto` y `marca.palabra` para que la intro de marca contraste en estilos
  claros (por defecto, el texto del estilo si contrasta 4,5:1 y si no blanco). `lanzamiento-dinamico` gana tokens de
  escenario, editorial y marca. Esquema de estilos y `CONTRATO.md` actualizados; 12/12 estilos en verde.
- La música y los efectos son los de `estilos/milikito/audio/` (el estilo no trae audio), con la base a −27 LUFS.

## Tiempo y coste
- **Tiempo total de reloj:** 10:52:30 → 11:51:05 = **58 min 35 s** (encargo → 17 MP4 verificados). Pasos largos:
  investigación de fuentes ≈ 13,5 min (en paralelo con láminas y locución), voz 2 min 57 s, transcripción 3 min 6 s
  (más 1 min en los dos intentos fallidos), 142 fijas 4 min 14 s, Lambda 2 min 52 s (subida, site, render y descarga),
  normalización y cortes ≈ 6 min.
- **ElevenLabs:** 25.385 caracteres de texto en 118 bloques. La cabecera de la API informa de **2.822** caracteres
  facturados (no coincide con el texto: revisar en el panel de ElevenLabs cuánto ha descontado).
- **Imágenes:** 18 láminas con gpt-image-2, calidad media, 2048×1152 (importe según la tarifa de OpenAI).
- **AWS:** ≈ **0,595 $** (Lambda 0,573 $ + S3 ≈ 0,022 $; transferencia dentro de la capa gratuita). Detalle abajo.
- **En AWS queda:** el site `motor-2f16fc0bb814` en el bucket de Remotion (lo usarán los próximos renders con este
  motor). Entradas privadas y salida, borradas.


## Render en Lambda (2026-10-03 09:44 UTC)

| Concepto | Valor |
|---|---|
| Función · región | `remotion-render-4-0-529-mem3008mb-disk10240mb-900sec` · eu-west-1 |
| Site | `motor-2f16fc0bb814` |
| Fotogramas | 42670 (28 min 27 s), 200 funciones de 214, narración, 3D 0.5 % |
| Subida de entradas | 64.1 MB en 7.7 s |
| Site | 8.5 s |
| Render (reloj) | 1 min 60 s (Remotion: 1 min 54 s; estimado 2 min 13 s) |
| Facturación Lambda estimada por Remotion | 241 min 56 s |
| Descarga | 275.4 MB en 32.7 s → `resultados/curso-n8n-intro.mp4` |
| Reintentos de trozos | 0 |
| **Coste Lambda (getRenderProgress)** | **0.573 $** (Estimated cost for function invocations only. Does not include cost for storage and data transfer.) |
| S3 (almacenamiento y peticiones) | ≈ 0.0221 $ |
| Transferencia de salida | 0.28 GB: 0 $ dentro de los 100 GB/mes gratuitos (si no, 0.025 $) |
| **Total** | **≈ 0.595 $** (estimado antes de lanzar: 0.695 $) |
| Limpieza | entradas privadas borradas; renders/<id>/ borrado |
