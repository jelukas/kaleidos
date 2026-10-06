---
workflow: general-video
flow: automation
storyboard: no
message: "Septiembre de 2026 en el e-learning corporativo: la IA entra en el catálogo, medir competencias es el nuevo campo de batalla y el dinero público para formar sigue en marcha"
destination: event
aspect: 1920x1080
language: es
audience: "profesionales de formación y RR. HH. en el evento de OpenWebinars (lunes 5 de octubre de 2026)"
length: 234s
angle: noticias
---

## Intent

Resumen dinámico, divertido y muy visual de las noticias más relevantes del ecosistema del e-learning corporativo del mes de septiembre de 2026 y de la última semana (28 sep – 2 oct), de 3–4 minutos, para proyectarlo en el evento de OpenWebinars del lunes. Mucho motion graphics, capturas de pantalla reales de las fuentes oficiales y vídeos oficiales, con el logo vectorial de OpenWebinars animado como en el vídeo anterior. Estilo `lanzamiento-dinamico` (paleta de la web de OpenWebinars).

## Assets

- assets/logo-openwebinars.svg — logo vectorial oficial (apertura y cierre, sobre fondo claro, sin recolorear).
- assets/captures/ — 28 capturas reales de páginas oficiales (2880×1800) con su texto `.txt`.
- assets/video/ — 4 vídeos oficiales descargados con permiso expreso (Helix demo, Helix «LLM», Moncloa 22-09, DevLearn header); siempre sin audio original.
- fuentes.md — fuentes, fechas y correcciones tras verificar. research/ — investigación previa en 4 ángulos.
- frame.md — estilo (copia de estilos/lanzamiento-dinamico).

## Customizations

- Audio **íntegramente de ElevenLabs** (petición del usuario): voz `eleven_v4` (17 líneas, 3.164 caracteres, 207,2 s), música `music_v2` (1 pista de 237 s a 120 BPM) y 17 efectos de sonido (`/v1/sound-generation`).
- Sin subtítulos (el usuario los quitó en el vídeo anterior); se pueden añadir con `node build.mjs --subtitulos`.
- Orden de entrega pedido por el usuario: **abrir la previsualización (Studio) y luego renderizar en AWS Lambda; no renderizar en local.**

## Notes

- Solo fuentes oficiales, fecha verificada; sin precios inventados ni nombres de personas ni de modelos. Dato de Deloitte citado por Coursera: no se usa. Propuestas de la Comisión Europea: rotuladas como tales. Cifras de empresa: «según la empresa».
- Privacidad: firmas de autor, contactos de prensa y personas en vídeos oficiales fuera de cuadro o tapados; ningún nombre propio ni correo en pantalla.
- Mezcla final: −16 LUFS / −1,5 dBTP tras el render (`plantillas/herramientas/normalizar_audio.py`). Render en Lambda con `hyperframes@0.8.86` (misma versión que el handler desplegado).

## Inicio

2026-10-02 23:40:01
