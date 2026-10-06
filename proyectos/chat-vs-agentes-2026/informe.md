# Informe — «Chat o agente» (chat-vs-agentes-2026)

## Resultado

- **Fichero:** `resultados/chat-vs-agentes-2026.mp4` (el original sin normalizar se conserva como `.orig.mp4`).
- **Formato:** 1920×1080, 30 fps, H.264 + AAC 48 kHz estéreo, **2:00,8** (3.621 fotogramas), 99,4 MB.
- **Audio:** −16,0 LUFS, pico real −1,6 dBTP, LRA 3,2 LU (normalizado en dos pasadas copiando el vídeo; fotogramas 3.621 → 3.621).
- **Render:** local con HyperFrames 0.8.113 (`--quality high`), **no se usó AWS**. Decisión del usuario/recomendación: para 2 min no aporta nada y el local es gratis.

## Qué es

Anuncio de producto muy dinámico, en español, para perfiles no técnicos de audiovisual, marketing, ventas y RR. HH.: **el chat contesta; el agente trabaja con tus archivos y herramientas y te entrega el trabajo hecho**. Estilo `lanzamiento-dinamico` (variante de `lanzamiento-minimal`, paleta de la web de OpenWebinars), con el **orbe del agente** como hilo.

## Estructura (tiempos de la locución real)

| # | Plano | Inicio | Dur. |
|---|---|---|---|
| 01 | Logo sting (aro que se expande a violeta) | 0,0 | 3,6 |
| 02 | Gancho («UN TEXTO.» → «EL TRABAJO HECHO.») | 3,6 | 5,2 |
| 03 | La diferencia (chat vs agente, pantalla partida) | 8,8 | 12,4 |
| 04 | Cómo trabaja (carpeta, conectores, tareas largas) | 21,2 | 11,6 |
| 05 | «Produce» | 32,8 | 3,4 |
| 06 | Simulación · Vídeo con código | 36,2 | 8,5 |
| 07 | Simulación · Imágenes (generar, detectar, corregir) | 44,7 | 8,2 |
| 08 | Simulación · Landing (cortar y publicar) | 52,9 | 8,2 |
| 09 | Simulación · Presentaciones | 61,1 | 6,8 |
| 10 | Cuatro áreas (cámara por 4 estaciones) | 67,9 | 18,4 |
| 11 | Los nombres (Claude / ChatGPT) | 86,3 | 9,6 |
| 12 | Control (permisos, valla, interruptores) | 95,9 | 11,0 |
| 13 | Cierre | 106,9 | 9,0 |
| 14 | Logo de cierre | 115,9 | 4,8 |

## Qué se verificó (y qué no)

- `npm run check` limpio (0 errores; 47/47 comprobaciones de contraste AA); los solapes con subtítulos del plano 06 se corrigieron moviendo la cámara.
- Recuento de fotogramas y duración con `ffprobe`; sonoridad con `ebur128`.
- Revisión visual de capturas por plano (cada agente de escena capturó entre 10 y 30 instantes) y de una hoja de contactos del borrador completo.
- **No verificado:** no se ha visto el vídeo completo fotograma a fotograma ni se ha escuchado la mezcla (solo medida); conviene una escucha humana de música/efectos frente a la voz.

## Avisos e incoherencias a revisar

1. **Cifras en las simulaciones:** el gráfico de marketing («+18 %»), la diapositiva («+128 %» y «87») y los precios de la landing ficticia son relleno; están marcados «dato de ejemplo» / «Simulación», no son datos reales.
2. **Imágenes, landing y presentaciones** son ejemplos de uso con un agente con herramientas, mostrados como simulación ilustrativa; no se atribuyen a ningún producto concreto. «Vídeo con código» se apoya en las webs oficiales de Remotion y HyperFrames (`fuentes.md` §8).
3. **Nombres que cambian rápido** (Cowork fusionado con el chat de Claude el 16-sep-2026; «ChatGPT agent» → Work en julio de 2026): ver `fuentes.md`. No se dice nada de precios, planes, versiones ni de la disponibilidad en España/UE (no verificada).
4. **Audiovisual:** ninguna de las dos empresas cita el montaje de vídeo como caso oficial; el vídeo lo plantea como creatividad (conceptos, guiones, archivos).
5. **Documentación del repo:** `CLAUDE.md`/`docs/FLUJOS.md` citan `eleven_music_v2_5` para la música, pero la API lo rechaza (422); funciona `music_v2`.
6. Referencias de `referencias-v2.md`: las técnicas salen de textos y prompts de sus autores, no de ver los vídeos; el anuncio de Cowork en YouTube no se pudo ver.
7. Queda `snapshots/`, `work/` y `src/` en el proyecto (fuentes del montaje); `build2.mjs` regenera `index.html` y `compositions/` desde `src/`.

## Tiempo

- **Reloj total:** inicio 2026-10-02 21:13 → vídeo final verificado 22:47 ≈ **1 h 34 min** (incluye la v1 completa y el rediseño a v2).
- **Renders:** v1 borrador 1 min 38 s · v2 borrador 2 min 12 s · **final 3 min 9 s**.
- Montaje de escenas v2: 5 agentes en paralelo, ≈ 17 min.

## Coste

- **ElevenLabs (voz, `eleven_v4`):** v1 2.048 caracteres; v2 1.161 caracteres nuevos (las líneas de gancho y cierre se reutilizaron por caché) → **3.209 caracteres** en total.
- **ElevenLabs (música, `music_v2`):** 1 generación de 128 s. **No se conoce el importe** (no verificado); se informa la cantidad consumida.
- **Efectos de sonido:** sintetizados con ffmpeg (sin coste). **Imágenes (OpenAI), Apify:** no se usaron.
- **AWS:** **0 $**; no se creó ni usó ningún recurso (render local).
- Quedan en AWS solo los recursos que ya había (stack `hyperframes-kaleidos`, bucket privado de Remotion); nada nuevo.

---

## Versión sin subtítulos (2026-10-02, a petición del usuario)

- **Fichero:** `resultados/chat-vs-agentes-2026-sin-subs.mp4` (la versión con subtítulos sigue en `resultados/chat-vs-agentes-2026.mp4`).
- **Cambios:** sin la capa de subtítulos y con **todos los efectos de sonido a ×0,45 (≈ −7 dB)**; voz y música intactas. Generado con `node build2.mjs --sin-subtitulos --fx=0.45` y render local `--quality high` (3 min 20 s).
- **Verificación:** 3.621 fotogramas, 120,7 s, 1920×1080; audio normalizado a −16,0 LUFS con pico real −2,3 dBTP. `npm run check` limpio (19/19 contraste).
- **Ajuste de encuadre:** en el plano 06 (vídeo con código) la cámara se había subido para no chocar con los subtítulos; en esta versión se restaura el encuadre original (fotograma a 40 s revisado).
- **Coste:** 0 $ (render local; sin generaciones nuevas de voz ni música).
