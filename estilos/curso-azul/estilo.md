---
version: alpha
name: Curso azul — Frame (capa de vídeo)
description: >
  Estilo de videocurso corporativo de kaleidos: azul marino #071631 a sangre, un acento azul #4C8DFF,
  texto blanco azulado, Montserrat 900 en titulares con máscara y Montserrat 400/700 en el resto.
  Paneles sólidos redondeados con borde interior de acento, resplandor radial que deriva, objetos 3D
  con luces y sombras reales, transiciones de empuje y de bloques diagonales. Sacado de
  benchmark/assets/ESCENA.md y del videocurso «DORA en la práctica» (proyectos/dora-videocurso-v1).
unit: el fotograma — 1920×1080 a 25 fps (30 en la escena de prueba); 1080×1920 previsto con la misma línea de tiempo
principle: los átomos son sagrados · la composición es libre · los datos salen del guion
source: benchmark/assets/ESCENA.md · proyectos/dora-videocurso-v1/src/tema.ts · resultados/dora-videocurso-v1.mp4

colors:
  fondo: "#071631"        # azul marino: fondo único de todo el vídeo
  superficie: "#0D2552"   # paneles, tarjetas, bloques de transición
  superficie2: "#13306A"  # panel destacado / fila activa
  linea: "#1F3F7A"        # rejilla de gráficas, filetes, bordes en reposo
  medio: "#2F6BE0"        # bloque intermedio de la transición diagonal
  profundo: "#040C1F"     # bloque más oscuro de la transición; caja de subtítulos al 78 %
  texto: "#F3F7FF"        # blanco azulado (nunca #FFFFFF)
  textoSuave: "#A8BCE3"   # subtítulos de rótulo, etiquetas, texto secundario
  acento: "#4C8DFF"       # antetítulos, barras, palabra activa, 3D, resplandor
  ok: "#3DDC97"           # tono ok (en dora-videocurso-v1 se usó #5FD4A0, misma familia)
  aviso: "#FFB547"
  error: "#FF6B6B"
  capitulos: ["#4C8DFF", "#8B7CFF", "#2EC5CE", "#FFB547"]   # azul, violeta, turquesa, ámbar

typography:
  display:  { fontFamily: "Montserrat", weight: 900, tracking: "-0.02em", lineHeight: 1.05, size: "150–200px", color: "texto (2.ª línea en acento)" }
  headline: { fontFamily: "Montserrat", weight: 900, tracking: "-0.02em", lineHeight: 1.05, size: "72–96px", color: "texto" }
  numeral:  { fontFamily: "Montserrat", weight: 900, size: "128px (cifra) · 48px (valor de barra)", fontVariant: "tabular-nums" }
  eyebrow:  { fontFamily: "Montserrat", weight: 700, tracking: "0.24em", upper: true, size: "20–26px", color: "acento" }
  body:     { fontFamily: "Montserrat", weight: 400, lineHeight: 1.35, size: "32–44px", color: "textoSuave" }
  label:    { fontFamily: "Montserrat", weight: 700, size: "26–36px", color: "texto" }
  caption:  { fontFamily: "Montserrat", weight: 700, size: "46px", lineHeight: 1.25 }
  mono:     { fontFamily: "JetBrains Mono", weight: 400, size: "20–26px", use: "código, marcas de tiempo" }

radii:
  card: "22px"          # paneles (16–22 px en el videocurso)
  card-sm: "16px"       # filas de lista y opciones
  caption: "18px"       # caja de subtítulos
  pill: "999px"
  bar-top: "8px"        # esquinas superiores de las barras de gráfica
  ring: "50%"

spacing:
  safe: "140px laterales · 120px arriba · banda inferior de 92px reservada a subtítulos"
  eyebrow-to-headline: "24px (20px en cabeceras de gráfica)"
  accent-bar: "120×6px (160×6px en el cierre), 28px arriba y 36px abajo"

motion:
  energy: media
  easing: { entry: "power3.out", title: "expo.out", exit: "power3.inOut", ambient: "none" }
  duration: { entrance: 0.6, title: 0.8, hold: 3.0, transition: 0.6 }
  atmosphere: [resplandor-radial-que-deriva, palabra-fantasma, anillos-concentricos]
  transition: push-slide · bloques-diagonales

components:
  kicker:
    description: "Antetítulo en mayúsculas Montserrat 700, 0.24em, acento; entra con opacidad 0→1 y x −40→0 (0,6 s power3.out)"
  accent-bar:
    backgroundColor: "{colors.acento}"
    description: "Barra de 120×6 px bajo el antetítulo; scaleX 0→1 desde la izquierda (0,6 s power2.out)"
  masked-title:
    description: "Titular en líneas dentro de máscaras overflow:hidden con line-height 1,2 (no corta tildes ni la g); cada línea yPercent 110→0, 0,8 s expo.out, 0,15 s de desfase; la segunda línea en acento"
  ghost-word:
    description: "Palabra fantasma gigante (460 px, 900, texto al 7 %) anclada abajo a la derecha que se desplaza x 0→−140 durante la escena"
  rings:
    description: "Dos anillos en (1480, 540): sólido 560 px y discontinuo 780 px, borde 2 px acento al 30 %; el discontinuo gira 0→45°"
  panel:
    backgroundColor: "{colors.superficie}"
    rounded: "{radii.card}"
    border: "inset 0 0 0 1–2px acento al 25–35 %; 2 px acento lleno en el elemento activo"
    description: "Panel sólido (lista, pasos, opciones A/B/C/D, comparativa, cifra, cita, línea de tiempo); fila activa en rgba(76,141,255,.16) con borde de acento"
  option-badge:
    description: "Letra A/B/C/D en cuadrado de 46 px radio 14, fondo linea (reposo) o acento (foco), veredicto en chip de color ok/aviso/error"
  chapter-card:
    description: "Tarjeta de capítulo 3,6 s: número 3D gigante (01, 02…) en acento con luz y sombra a la izquierda, antetítulo «CAPÍTULO 0N» + barra + titular 900 + subtítulo a la derecha"
  bar-chart:
    description: "Barras de acento con esquinas superiores de 8 px, la mayor en texto; rejilla de 2 px en linea, base de 3 px textoSuave; valores con contador tabular"
  caption-box:
    backgroundColor: "rgba(4,12,31,0.78)"
    rounded: "{radii.caption}"
    description: "Subtítulo centrado en caja; palabra activa en acento con pop 0,92→1,06→1"
  progress-bar:
    description: "Barra inferior por capítulos + chip del capítulo actual (20 px, 700, fondo rgba(4,12,31,.72), radio 8)"
  logo-lockup:
    description: "Logotipo de texto «kaleidos» + punto de acento, 200 px 900, una caja por letra que sube (y 80→0, 0,5 s power4.out, 0,05 s de desfase)"
---

# Curso azul — Frame

## Concepto (Overview)

El vídeo de curso «serio pero vivo»: una academia técnica que explica con claridad. Azul marino profundo en
todo el cuadro, **un único acento azul** que marca lo importante y tipografía **Montserrat 900** muy
compacta para los titulares. La sensación es de producto bien hecho: nada estático más de un par de
segundos (el resplandor deriva, los anillos giran, la palabra fantasma se desplaza) pero sin rebotes ni
gritos. Sirve para cursos corporativos, módulos de formación, píldoras técnicas e intros/outros de curso.

## El cuadro (The Frame)

- 1920×1080. Márgenes seguros: 140 px a los lados, 120 px arriba; la banda inferior (≈ 92 px sobre el
  borde) es de los subtítulos y la barra de progreso.
- Un elemento dominante por plano: el titular, el objeto 3D, la gráfica o el panel.
- Capas (de atrás adelante): fondo + resplandor → decorado (anillos, palabra fantasma) → 3D detrás →
  ponente → 3D delante → paneles 2D → subtítulos → barra de progreso.
- Disposiciones del ponente en el videocurso: `completa`, `esquina` (gráfico a la izquierda) y `dividida`
  (ponente a la izquierda, panel a la derecha). Sin recorte, el ponente va en un marco redondeado con borde.

## Colores (Colors)

`fondo` #071631 es el único fondo. `acento` #4C8DFF hace todo el trabajo de color: antetítulos, barras,
palabra activa, objetos 3D, resplandor y filas activas. Superficies en `superficie` #0D2552 y
`superficie2` #13306A; rejillas y bordes en reposo en `linea` #1F3F7A. Texto en `texto` #F3F7FF (blanco
azulado) y `textoSuave` #A8BCE3. Los semánticos (`ok` #3DDC97, `aviso` #FFB547, `error` #FF6B6B) solo
aparecen en veredictos y tonos de panel. Los acentos por capítulo son #4C8DFF, #8B7CFF, #2EC5CE y #FFB547;
en el videocurso DORA se usó solo el azul. Los bloques de transición usan además `medio` #2F6BE0 y
`profundo` #040C1F.

Contraste (WCAG): texto/fondo 16,7 · textoSuave/fondo 9,4 · textoSuave/superficie 7,8 · acento/fondo 5,6.

## Tipografía (Typography)

Una sola familia, **Montserrat** (400 · 700 · 900), y **JetBrains Mono** 400 solo para código o marcas
de tiempo.

- Titulares: 900, −0,02em, interlineado 1,05 (1,2 dentro de las máscaras). Intro 150–176 px en dos
  líneas, cabeceras 72–96 px. `text-wrap: balance`.
- Antetítulo: 700 en mayúsculas, 0,24em, 20–26 px, en acento, siempre con la barra de 120×6 debajo.
- Cuerpo: 400, 1,35, 32–44 px, en `textoSuave`.
- Cifras: 900 con `tabular-nums` (el contador no baila).
- Nada de cursivas ni de titulares en mayúsculas (solo el antetítulo va en mayúsculas).

## Fondo y superficies (Depth & Surface)

- Fondo liso #071631 con un **resplandor radial** del acento de 1400 px centrado en (1500, 200) al 22 %
  que deriva despacio (x 0 → −300, y 0 → 120 en 30 s). Nada de degradados lineales a pantalla completa.
- Paneles **sólidos**: `superficie` con borde interior de 1–2 px en acento al 25–35 % y radio 16–22 px.
  Sombra solo en tarjetas flotantes: `0 30px 80px rgba(4,12,31,0.45)`.
- Detrás de los objetos 3D, círculo radial de acento de 900 px al 40 % que respira (±5 % de opacidad,
  ±4 % de escala).

## Componentes (Components)

Antetítulo + barra, titular en máscaras, palabra fantasma, anillos, panel sólido (lista, pasos,
opciones A–D con veredicto, comparativa, cifra, cita, línea de tiempo, mapa, tarjeta), tarjeta de
capítulo con número 3D, gráfica de barras, caja de subtítulos, barra de progreso con chip de capítulo y
logotipo de texto por letras. Los valores exactos están en el frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Antetítulo | opacidad 0→1, x −40→0 | 0,6 s | power3.out |
| Barra de acento | scaleX 0→1 (origen izquierda) | 0,6 s | power2.out |
| Línea de titular | yPercent 110→0, desfase 0,15 s | 0,8 s | expo.out |
| Subtítulo / texto | opacidad 0→1, y 30→0 | 0,6–0,7 s | power2.out |
| Titular de sección | opacidad 0→1, y 40→0 | 0,7 s | power3.out |
| Barra de gráfica i | scaleY 0→1 (origen abajo), desfase 0,12 s | 0,9 s | power3.out |
| Valor de barra | contador 0→valor + opacidad | 0,9 s | power3.out |
| Anillos | opacidad 0→1, escala 0,8→1 | 1,2 s | power2.out |
| Letra del logotipo | opacidad 0→1, y 80→0, desfase 0,05 s | 0,5 s | power4.out |
| Objeto 3D | escala 0,001→1 | 1,2 s | power3.out |
| Deriva y giro ambiente | lineal durante toda la escena | — | none |

Equivalencias GSAP ↔ Remotion (`benchmark/assets/ESCENA.md`): power2.out = `Easing.out(Easing.cubic)`,
power3.out = `Easing.out(Easing.poly(4))`, power3.inOut = `Easing.inOut(Easing.poly(4))`, power4.out =
`Easing.out(Easing.poly(5))`, expo.out = `Easing.out(Easing.exp)`.

Paneles del videocurso: entrada 0,5 s power3.out y salida 0,4 s power2.out; cada ítem aparece con su frase.

## Transiciones (Transitions)

- **Empuje (push slide):** la escena saliente x 0→−1920 y la entrante 1920→0, 0,6 s power3.inOut. Es la
  transición por defecto (intro → primera tarjeta de capítulo, entre escenas).
- **Bloques diagonales:** cinco bloques a pantalla completa con `skewX(−18°)` en acento, texto, medio,
  superficie y profundo; entran x −2700→0 (0,45 s power3.inOut, 0,06 s de desfase), cambian la escena
  debajo y salen x 0→2700 empezando por el de arriba. Se reserva para la entrada al cierre.
- Dentro del cuerpo del curso, cortes secos con cambio de plano; transición suave de 16 fotogramas solo al
  entrar o salir de una disposición lateral.

## Subtítulos (Captions)

Caja centrada `rgba(4,12,31,0.78)` con radio 18, padding 14/28, Montserrat 700 a 46 px, interlineado
1,25, `text-wrap: balance`. Páginas de hasta ~46 caracteres, cortadas en pausas de más de 0,5 s o en
final de frase. Palabra ya dicha en `texto`, pendiente al 55 %, **activa en acento** con pop
0,92→1,06→1 en 200 ms. Aparecen en 160 ms (y 14→0). Se ocultan sobre las tarjetas de capítulo y el cierre.
Con panel en `esquina` se centran en la zona libre; con `dividida`, bajo el ponente.

## 3D

`MeshStandardMaterial` (roughness 0,28, metalness 0,1) en acento, `texto` o `superficie`; cámara de FOV
35; luces: ambiental #9FB8FF 0,4 + direccional blanca 2,5 con sombra (mapa 2048, PCFSoft) + puntual
#6FA8FF 40 a contraluz; suelo `ShadowMaterial` al 35 %. Tone mapping ACES Filmic. Objetos del catálogo
del motor (escudo, número de capítulo en volumen, losetas, contrato…). Rotación lenta continua y
flotación senoidal; nada de materiales toon ni contornos en este estilo.

## Audio

Voz como columna vertebral (−16 LUFS). Pad sintetizado suave solo en intro y cierre (≈ −22 LUFS), whoosh
en cada tarjeta de capítulo y en la entrada al cierre (volumen 0,7), «pop» muy discreto al entrar cada
gráfico (0,22). Todo sintetizado con ffmpeg o con la skill `audio-local`: sin músicas sin licencia.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Un solo acento por plano; la segunda línea del titular de intro en acento.
- Antetítulo + barra + titular + texto como bloque de apertura de cada escena.
- Titulares en máscaras con interlineado 1,2 y `text-wrap: balance`.
- Cifras con `tabular-nums` y contador; la barra mayor en `texto` para destacarla.
- Movimiento ambiente lineal continuo (deriva, giro) para que nada quede quieto.

### No (Don't)
- Nada de blanco puro ni de colores fuera de la paleta; nada de degradados lineales a pantalla completa.
- Ni rebotes (`back`, `elastic`) ni sacudidas: este estilo no grita.
- No mezclar más de un acento de capítulo en el mismo plano.
- No poner subtítulos encima de una tarjeta de capítulo ni del cierre.
- No inventar cifras: las gráficas y paneles resumen lo que dice la voz.

## Carga de fuentes (Font loading)

Copia `estilos/curso-azul/fonts/*.woff2` a `assets/fonts/` del proyecto HyperFrames (o regenera con
`node estilos/_esquema/fontface.mjs curso-azul --ruta <carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Montserrat";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/montserrat-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/montserrat-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/montserrat-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/montserrat-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/montserrat-latin-ext-900-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/montserrat-latin-900-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json` es este mismo estilo en datos (`docs/CONTRATO.md` §5). En `proyectos/<slug>/proyecto.json`:
`"estilo": "curso-azul"`; `npm run estilos` en `motor/` lo copia a `motor/public/estilos/`. Diferencias
con el videocurso DORA original: allí `ok` era #5FD4A0 y los paneles usaban radios de 16–22 px.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Paleta:** todos los hex están en este archivo; un solo acento por plano.
- **Tipo:** Montserrat 900/700/400 (JetBrains Mono solo en código); titulares −0,02em; antetítulo 0,24em.
- **Máscaras:** interlineado 1,2; no se cortan tildes ni descendentes.
- **Movimiento:** power3/expo en entradas, lineal en ambiente; empuje 0,6 s entre escenas.
- **Subtítulos:** caja 78 %, palabra activa en acento, ocultos en tarjetas y cierre.
- **Datos:** cada cifra sale del guion; nada de nombres reales.

## Referencias

`referencias/`: 01 intro con título y escudo 3D · 02 tarjeta de capítulo con número 3D · 03 transición de
bloques · 04 resumen · 05 gráfica de barras (escena de prueba) · 06 objeto 3D con luces y sombras.
