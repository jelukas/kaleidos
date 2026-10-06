# Informe — «E-learning corporativo: septiembre 2026» (resumen de noticias para el evento del 5 de octubre)

## Resultado

- **Fichero:** `resultados/elearning-septiembre-2026.mp4` (el MP4 sin normalizar se conserva como `.orig.mp4`).
- **Formato:** 1920×1080, 30 fps, H.264 + AAC 48 kHz estéreo, **3:54,4** (7.031 fotogramas), 239 MB.
- **Audio:** −16,0 LUFS, pico real −3,7 dBTP, LRA 2,6 LU (normalizado en dos pasadas copiando el vídeo; fotogramas 7.031 → 7.031). Sin subtítulos (se pueden añadir con `node build.mjs --subtitulos`).
- **Render:** **AWS Lambda** (`hyperframes-kaleidos`, eu-west-1, `hyperframes@0.8.86`), calidad `high`, 40 trozos en paralelo máx. Previsualización abierta en Studio antes del render, a petición del usuario.

## Qué es

Resumen dinámico de las noticias del ecosistema del e-learning corporativo del mes de septiembre de 2026 y de la última semana (28 sep – 2 oct), organizado en cuatro bloques (IA, Plataformas y contenidos, Mercado, España y UE) más agenda y cierre, con una tira de calendario (1 sep → 2 oct) que marca el día de cada noticia, capturas de pantalla reales de las fuentes oficiales con zoom y resaltados, cuatro vídeos oficiales y el logo vectorial de OpenWebinars animado. Estilo `lanzamiento-dinamico`.

## Estructura (tiempos del MP4)

| # | Plano | Inicio | Dur. | Fuente / fecha |
|---|---|---|---|---|
| 01 | Apertura (titulares reales, «SEPTIEMBRE 2026») | 0:00 | 12,1 s | — |
| 02 | Logo OpenWebinars (trazo, brillo, iris violeta) | 0:12 | 3,6 s | — |
| 03 | Mapa del mes (19 noticias, 4 bloques) | 0:16 | 9,7 s | — |
| 04 | OpenAI Academy — rutas por rol | 0:25 | 15,2 s | openai.com · 21 sep |
| 05 | Microsoft Copilot (Home, Code, Autopilot) + AI at Work | 0:41 | 10,8 s | microsoft.com · 25 sep |
| 06 | OpenAI «dots» (agentes siempre activos) ★ | 0:51 | 13,4 s | openai.com · 29 sep |
| 07 | Anthropic Frontier Academy (100 M$, 10.000 ingenieros) ★ | 1:05 | 11,5 s | anthropic.com · 2 oct |
| 08 | Gartner, tres predicciones (30 %, 1.303 directivos, 70 %) ★ | 1:16 | 17,8 s | gartner.com · 9 y 29 sep |
| 09 | Coursera + Udemy: Project Helix (con vídeos oficiales) | 1:34 | 17,4 s | coursera.org · 9 sep |
| 10 | Articulate 360 AI, Nova y Frontline | 1:52 | 11,4 s | articulate.com · 10 sep |
| 11 | Skillsoft LX Design Studio (hasta −85 %, según la empresa) | 2:03 | 11,3 s | skillsoft.com · 10 sep |
| 12 | Coursera Global Skills Report (98 países) ★ | 2:14 | 9,4 s | coursera.org · 28 sep |
| 13 | Pearson compra ITS (18 sep) y Workera (29 sep) ★ | 2:24 | 16,2 s | pearson.com |
| 14 | Dinero para formar: 250 M€ y 352/312 M€ (con vídeo oficial) ★ | 2:40 | 18,5 s | lamoncloa.gob.es · 22 y 29 sep |
| 15 | BOE: 35 M€ + 46,7 M€, 10 días de plazo ★ | 2:59 | 9,2 s | boe.es · 30 sep |
| 16 | Comisión (Skills Portability Act) y Eurostat (13,7 %) | 3:08 | 16,7 s | ec.europa.eu / eurostat · 14–15 sep |
| 17 | Agenda: Talent Day, World of Learning, Workday Rising, DevLearn | 3:24 | 11,7 s | webs oficiales |
| 18 | Cierre: 3 ideas y «Nos vemos el lunes» | 3:36 | 13,4 s | — |
| 19 | Logo de cierre | 3:50 | 4,8 s | — |

★ = noticia de la semana 28 sep – 2 oct. Fuentes completas, fechas y correcciones en `fuentes.md`.

## Qué se verificó (y qué no)

- **Contenido:** cada dato narrado se contrastó con el texto real de la página oficial (los `.txt` de `assets/captures/`). Resultados de esa verificación, ya aplicados: la cifra 43 %/20 % del informe de Coursera es de Deloitte (no se usa); la «traducción a 80 idiomas» de Articulate no estaba en la página (no se usa); las cifras de Helix y de la fusión de Coursera/Udemy discrepan entre notas (no se citan); lo de la Comisión son **propuestas**; lo de Moncloa del 29 sep son **límites de gasto**, no convocatorias publicadas; el 85 % de Skillsoft va siempre «según la empresa» (una nota al pie de la misma página dice 86 %).
- **Técnica:** `check` limpio (0 errores; avisos de estructura informativos); 7.031 fotogramas y 234,37 s con `ffprobe`; hojas de contactos del proyecto ensamblado (57 instantes) y del MP4 final de Lambda (19 instantes + clips de vídeo + valores finales de contadores). Contadores finales comprobados (98 países, 30.000+, 351,98/311,6 M€, 81,7 M€, 10 días, 13,7 %).
- **Privacidad:** firmas de autor, contactos de prensa (Gartner) y nombres de las páginas, tapados o fuera de cuadro; revisado en los fotogramas muestreados. **No se ha visto el vídeo completo fotograma a fotograma ni se ha escuchado la mezcla (solo medida y simulada).**

## Avisos

1. **Vídeo de La Moncloa (plano 14):** en el clip oficial del 22 sep aparecen la ministra que anuncia la convocatoria y una intérprete de signos (cargos públicos en una emisión oficial); no se rotulan nombres y va con duotono violeta. Si se prefiere, se puede recortar o sustituir por solo la captura.
2. **Cifras de empresa** («hasta −85 %», créditos, etc.) están atribuidas a la empresa; **no se verificó independientemente** ninguna.
3. **Fechas:** la noticia de Wooclap–Vevox, 360Learning, etc. no entraron por no poder verificar fecha/fuente primaria (ver `fuentes.md`).
4. **Capturas de terceros:** páginas públicas oficiales mostradas con atribución de fuente y fecha como material informativo; vídeos oficiales descargados con permiso expreso del usuario (lista en `fuentes.md`), siempre sin audio original. YouTube/Vimeo (Microsoft, Articulate) no se descargaron.
5. **Audio:** la mezcla sale de Lambda a −14,1 LUFS y se normalizó a −16,0 LUFS. Efectos ElevenLabs a ×1,8 sobre los volúmenes de escena (calibrado con una mezcla simulada: voz −16,7 LUFS, música −23,7 LUFS ya con ducking).
6. **Documentación del repo:** `music_v2` es el modelo de música que acepta la API (el `eleven_music_v2_5` de `CLAUDE.md` da 422); y `hyperframes lambda render` necesita `@hyperframes/aws-lambda`, que solo está en `benchmark/hyperframes-test/node_modules` (el `npx` suelto falla).
7. La previsualización de Studio sigue abierta en http://127.0.0.1:3003/#project/elearning-sept-2026 (`npx hyperframes@0.8.86 preview --stop` desde el proyecto la cierra).

## Tiempo

- **Reloj total:** inicio 2026-10-02 23:40 → MP4 final verificado 2026-10-03 00:47 ≈ **1 h 07 min**.
- **Reparto aproximado:** investigación (4 agentes en paralelo) ≈ 7 min; capturas, verificación de datos y vídeos ≈ 25 min; guion, voz, música y efectos ≈ 12 min; escenas (6 agentes en paralelo) ≈ 24 min; ensamblado, verificación y calibración ≈ 12 min; **Lambda: ≈ 3 min desde el lanzamiento hasta tener el MP4 descargado** (subida de 161 MB incluida).

## Coste

- **AWS Lambda:** **0,279 $** (total que informa el render) + S3 (161 MB subidos, 239 MB de salida, 7 días de caducidad) y transferencia de descarga: despreciables (no medidos). Sin recursos nuevos.
- **ElevenLabs:** voz `eleven_v4` **3.164 caracteres** (17 líneas); música `music_v2` **1 generación de 237 s** (importe no conocido); efectos de sonido **19 generaciones** (17 efectos; whoosh e impact se generaron dos veces por un reintento tras un error de duración mínima). Importes no verificados: se informa la cantidad consumida.
- **Sin coste:** investigación y subagentes dentro de la sesión; capturas con Chrome local; vídeos oficiales descargados sin coste; efectos del kit y análisis de tempo locales.
- **Queda en AWS:** en el bucket privado `hyperframes-kaleidos-renderbucket-…`: `sites/61466e62724fa811/project.tar.gz` (161 MB) y `renders/hf-render-270a723e-…/output.mp4` (239 MB), con caducidad de intermedios de 7 días; stack, función y bucket preexistentes.
