# Escena común: "Intro de curso"

Especificación que implementan **igual** `remotion-test/` y `hyperframes-test/`. Si se cambia algo aquí, hay que cambiarlo en los dos.

- Lienzo: 1920×1080, 30 fps, 30 s (900 fotogramas), sin audio.
- Tiempos en segundos absolutos del vídeo. `fromTo(inicio, duración, curva)`: antes de `inicio` vale el valor inicial y después de `inicio + duración` el final.

## Paleta

| Token    | Hex       | Uso                               |
| -------- | --------- | --------------------------------- |
| `bg`     | `#071631` | Fondo (azul marino)               |
| `panel`  | `#0D2552` | Bloques de transición             |
| `line`   | `#1F3F7A` | Rejilla del gráfico               |
| `accent` | `#4C8DFF` | Azul de acento                    |
| `mid`    | `#2F6BE0` | Bloque de transición              |
| `deep`   | `#040C1F` | Bloque de transición              |
| `fg`     | `#F3F7FF` | Texto principal (blanco azulado)  |
| `muted`  | `#A8BCE3` | Texto secundario                  |

## Tipografía

Montserrat 400 / 700 / 900 (latin), mismos `.woff2` en los dos proyectos (`assets/fonts/`, de `@fontsource/montserrat` 5.3.0).

## Detalles de maquetación comunes

- Las máscaras del título usan `line-height` 1,2 (para no cortar la tilde ni el rabo de la "g").
- Separación antetítulo → titular: 24 px en la escena 2 y 20 px en la 3.
- Subtítulo de la escena 1, titular y texto de la escena 2: `text-wrap: balance`.
- Barras con esquinas superiores redondeadas de 8 px.
- `box-sizing: border-box` en los anillos.

## Curvas (equivalencias GSAP ↔ Remotion)

| GSAP           | Remotion `Easing`                  | Fórmula         |
| -------------- | ---------------------------------- | --------------- |
| `none`         | `Easing.linear`                    | t               |
| `power1.in`    | `Easing.in(Easing.quad)`           | t²              |
| `power2.out`   | `Easing.out(Easing.cubic)`         | 1-(1-t)³        |
| `power3.out`   | `Easing.out(Easing.poly(4))`       | 1-(1-t)⁴        |
| `power3.inOut` | `Easing.inOut(Easing.poly(4))`     | —               |
| `power4.out`   | `Easing.out(Easing.poly(5))`       | 1-(1-t)⁵        |
| `expo.out`     | `Easing.out(Easing.exp)`           | 1-2^(-10t)      |

## Fondo persistente (0–30 s)

- Relleno `bg`.
- Resplandor radial `accent` de 1400 px, centrado en (1500, 200), opacidad 0,22. Deriva lineal 0→30 s: `x` 0 → -300, `y` 0 → 120.

## Escena 1: título (0–5,6 s)

Columna izquierda, `padding-left` 140 px, centrada en vertical:

- Antetítulo "NUEVO CURSO · MÓDULO 1": 26 px, 700, `letter-spacing` 0,24 em, `accent`.
- Barra `accent` de 120×6 px (margen 28 px arriba y 36 px abajo).
- Título en dos líneas, 176 px, 900, `line-height` 1, `letter-spacing` -0,02 em: "Vídeo con" (`fg`) / "código" (`accent`). Cada línea va dentro de una máscara con `overflow: hidden`.
- Subtítulo "Aprende a animar y renderizar vídeo desde el código": 44 px, 400, `muted`, `max-width` 1000 px, margen superior 40 px.
- Decorado: palabra fantasma "CÓDIGO" (460 px, 900, `fg`) anclada abajo a la derecha (right -80, bottom -90), y dos anillos en (1480, 540): uno sólido de 560 px y otro discontinuo de 780 px, con borde de 2 px `accent` al 30 %.

| Elemento              | Animación                                            | Inicio | Duración | Curva        |
| --------------------- | ---------------------------------------------------- | ------ | -------- | ------------ |
| Anillos               | opacidad 0→1, escala 0,8→1                           | 0,20   | 1,2      | power2.out   |
| Anillo discontinuo    | rotación 0→45°                                       | 0      | 5,6      | none         |
| Palabra fantasma      | opacidad 0→0,07                                      | 0      | 1,0      | power2.out   |
| Palabra fantasma      | x 0→-140                                             | 0      | 5,6      | none         |
| Antetítulo            | opacidad 0→1, x -40→0                                | 0,30   | 0,6      | power3.out   |
| Barra                 | scaleX 0→1 (origen izquierda)                        | 0,45   | 0,6      | power2.out   |
| Línea 1 del título    | yPercent 110→0                                       | 0,60   | 0,8      | expo.out     |
| Línea 2 del título    | yPercent 110→0                                       | 0,75   | 0,8      | expo.out     |
| Subtítulo             | opacidad 0→1, y 30→0                                 | 1,30   | 0,7      | power2.out   |

**Transición 1→2 (push slide) en 5,0 s:** escena 1 x 0→-1920 y escena 2 x 1920→0, 0,6 s `power3.inOut`.

## Escena 2: objeto 3D (5,0–15,6 s)

- Texto a la izquierda (`padding-left` 140, ancho 680): antetítulo "01 · ESCENAS 3D" (mismo estilo), titular "Luces, materiales y sombras" (88 px, 900, `fg`, `line-height` 1,05) y texto "Un objeto real, renderizado fotograma a fotograma" (36 px, 400, `muted`, `max-width` 600, margen superior 32).
- Resplandor DOM detrás del objeto: círculo radial `accent` de 900 px centrado en (1370, 540).
- Lienzo WebGL de 1100×1080 px en x = 820 (lado derecho), `dpr` 1, antialias, fondo transparente, sombras PCFSoft y tone mapping ACES Filmic (lo que R3F aplica por defecto).
- Three.js **0.178.0** en los dos.

Escena 3D (unidades del mundo, `t` = segundos absolutos, `u = t - 5`):

- Cámara: perspectiva, FOV 35, near 0,1, far 100, posición (0, 0,8, z) mirando a (0, -0,1, 0); `z` va de 8,2 a 7,2 de forma lineal entre 5,0 y 15,6 s.
- Objeto: `TorusKnotGeometry(1, 0,32, 256, 40)`, `MeshStandardMaterial` color `accent`, roughness 0,28, metalness 0,1, proyecta sombra.
  - Rotación: y = `u · 0,9`, x = `0,4 + sin(u · 0,7) · 0,2`.
  - Flotación: posición y = `sin(u · 1,3) · 0,12`.
  - Escala: 0,001→1 entre 5,2 y 6,4 s con `power3.out`.
- Suelo: plano de 20×20 en y = -1,6, `ShadowMaterial` opacidad 0,35, recibe sombra.
- Luces: ambiental `#9FB8FF` 0,4; direccional `#FFFFFF` 2,5 en (4, 7, 5) con sombra (mapa 2048, cámara ±4, near 0,5, far 30, normalBias 0,02); puntual `#6FA8FF` 40 en (-3, 2, -3).
- Solo se pinta mientras la escena está en pantalla (5,0–15,6 s).

| Elemento     | Animación                                             | Inicio | Duración | Curva        |
| ------------ | ----------------------------------------------------- | ------ | -------- | ------------ |
| Resplandor   | opacidad 0→0,4, escala 0,8→1                          | 5,60   | 1,0      | power2.out   |
| Resplandor   | respira: opacidad 0,4 + sin(φ)·0,05, escala 1 + sin(φ)·0,04, φ 0→6π | 6,60 | 9,0 | none |
| Antetítulo   | opacidad 0→1, x -40→0                                 | 5,70   | 0,6      | power3.out   |
| Titular      | opacidad 0→1, y 40→0                                  | 5,85   | 0,7      | power3.out   |
| Texto        | opacidad 0→1, y 30→0                                  | 6,10   | 0,6      | power2.out   |

**Transición 2→3 (push slide) en 15,0 s:** igual que la anterior.

## Escena 3: gráfica de barras (15,0–22,75 s)

- Cabecera arriba a la izquierda (padding 120 px arriba, 140 a los lados): antetítulo "02 · DATOS EN MOVIMIENTO" y titular "Minutos de vídeo por módulo" (72 px, 900, `fg`).
- Gráfica: caja de 1640×520 px, con la línea base a 170 px del borde inferior y 140 px a la izquierda.
- Datos: Módulo 1 → 35, Módulo 2 → 50, Módulo 3 → 42, Módulo 4 → 65, Módulo 5 → 48. Altura = valor × 8 px. Barras de 200 px de ancho con 160 px de hueco. Color `accent`, salvo la mayor (Módulo 4), en `fg`.
- Rejilla en 20, 40 y 60 min (alturas 160, 320 y 480), 2 px `line`; línea base de 3 px `muted`.
- Encima de cada barra, el valor con contador "NN min" (48 px, 900, `fg`, cifras tabulares). Debajo, la etiqueta "Módulo N" (26 px, 700, `muted`).

| Elemento          | Animación                                   | Inicio               | Duración | Curva       |
| ----------------- | ------------------------------------------- | -------------------- | -------- | ----------- |
| Antetítulo        | opacidad 0→1, x -40→0                       | 15,70                | 0,6      | power3.out  |
| Titular           | opacidad 0→1, y 40→0                        | 15,85                | 0,7      | power3.out  |
| Base y rejilla    | scaleX 0→1 (origen izquierda), i·0,06       | 15,90 + i·0,06       | 0,8      | power2.out  |
| Barra i (0–4)     | scaleY 0→1 (origen abajo)                   | 16,30 + i·0,12       | 0,9      | power3.out  |
| Valor i           | contador 0→valor (redondeado) y opacidad 0→1 en 0,3 s | 16,30 + i·0,12 | 0,9 | power3.out |
| Etiqueta i        | opacidad 0→1, y 20→0                        | 16,30 + i·0,12       | 0,5      | power2.out  |

(Rejilla, `i` = 0 base, 1 → 20 min, 2 → 40 min, 3 → 60 min.)

## Transición 3→4: bloques diagonales (22,0–23,5 s)

Cinco bloques a pantalla completa (left -200, 2320×1080, `skewX(-18°)`), apilados en este orden de abajo arriba: `accent`, `fg`, `mid`, `panel`, `deep`.

- Entrada del bloque k: x -2700→0, 0,45 s `power3.inOut`, en 22,00 + k·0,06.
- Cambio de escena en 22,75: la escena 3 desaparece y aparece la 4.
- Salida del bloque k: x 0→2700, 0,45 s `power3.inOut`, en 22,80 + (4-k)·0,06 (primero sale el de arriba).

## Escena 4: rótulo final (22,75–30 s)

Centrado:

- Logotipo de texto "kaleidos" + punto `accent`: 200 px, 900, `fg`, `letter-spacing` -0,02 em, una caja por letra.
- Barra `accent` 160×6 px centrada (margen 36 px arriba y abajo).
- Lema "Academia de vídeo programático": 40 px, 400, `muted`.
- Pie "EMPIEZA HOY · MÓDULO 1 DISPONIBLE": 24 px, 700, `accent`, `letter-spacing` 0,24 em, a 110 px del borde inferior.
- Resplandor radial `accent` de 1200 px centrado en el lienzo.

| Elemento     | Animación                                              | Inicio            | Duración | Curva       |
| ------------ | ------------------------------------------------------ | ----------------- | -------- | ----------- |
| Resplandor   | opacidad 0→0,45, escala 0,7→1                          | 23,00             | 1,2      | power2.out  |
| Resplandor   | respira: opacidad 0,45 + sin(φ)·0,05, escala 1 + sin(φ)·0,04, φ 0→4π | 24,20 | 5,8 | none |
| Letra i (0–7)| opacidad 0→1, y 80→0                                   | 23,20 + i·0,05    | 0,5      | power4.out  |
| Punto        | escala 0→1                                             | 23,75             | 0,5      | power3.out  |
| Logotipo     | escala 1→1,04 (empuje lento)                           | 24,00             | 6,0      | none        |
| Barra        | scaleX 0→1 (origen centro)                             | 23,90             | 0,6      | power2.out  |
| Lema         | opacidad 0→1, y 30→0                                   | 24,00             | 0,7      | power2.out  |
| Pie          | opacidad 0→1, y 20→0                                   | 24,40             | 0,6      | power2.out  |

Se mantiene hasta el último fotograma, sin fundido final.
