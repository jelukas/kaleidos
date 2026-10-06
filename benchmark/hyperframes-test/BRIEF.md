---
workflow: general-video
flow: automation
storyboard: no
message: "Intro de curso: Vídeo con código"
aspect: 1920x1080
language: es
length: 30s
---

## Intent

Escena de prueba para comparar Remotion y HyperFrames con la misma "intro de curso" de 30 s (1920×1080, 30 fps): título animado con subtítulo (0–5 s), objeto 3D girando con luces y sombras (5–15 s), gráfica de barras animada con 5 valores (15–22 s) y transición vistosa con rótulo final y logo de texto (22–30 s). Paleta azul oscuro y blanco, misma tipografía que en Remotion.

## Notes

- La especificación común está en `../assets/ESCENA.md` (ahora `benchmark/assets/ESCENA.md`); esta composición debe coincidir con la de `../remotion-test/`.
- Sin audio ni voz.
- Three.js 0.178.0 copiado en `vendor/three/` (misma versión que Remotion) para no depender de un CDN al renderizar.
- Montserrat 400/700/900 local en `assets/fonts/` (mismos archivos que Remotion).
