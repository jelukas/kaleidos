---
format: 1920x1080
duration: 30s
message: "Intro de curso: Vídeo con código"
arc: Título → Demostración 3D → Datos → Marca
mode: autonomous
---

## Frame 1 — Título

- scene: Título en dos líneas con máscara, antetítulo, barra y subtítulo; anillos y palabra fantasma de fondo
- duration: 5s
- poster: 2.5s
- transition_in: cut
- status: animated
- src: index.html
- rules: waterfall-entry (líneas enmascaradas), ambient-glow-bloom, sine-wave-loop

## Frame 2 — Objeto 3D

- scene: Nudo toroidal Three.js girando con luz direccional, luz de contorno y sombra en el suelo; texto a la izquierda
- duration: 10s
- poster: 10s
- transition_in: push slide
- status: animated
- src: index.html
- rules: adapters/three (hf-seek), ambient-glow-bloom

## Frame 3 — Gráfica

- scene: Cinco barras que crecen con contador de minutos por módulo
- duration: 7s
- poster: 19s
- transition_in: push slide
- status: animated
- src: index.html
- rules: stat-bars-and-fills, counting-dynamic-scale (contador redondeado)

## Frame 4 — Rótulo final

- scene: Logotipo "kaleidos." letra a letra, barra, lema y pie
- duration: 8s
- poster: 27s
- transition_in: staggered blocks (diagonales)
- status: animated
- src: index.html
- rules: css-cover staggered blocks, logo-assemble-lockup (letras en cascada), spring-pop-entrance
