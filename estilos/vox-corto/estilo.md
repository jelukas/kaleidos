---
version: alpha
name: Vox corto — Frame (capa de vídeo)
description: >
  Explainer corto editorial inspirado en los vídeos explicativos de vox.com, para Shorts, Reels, TikTok y
  YouTube en vertical 1080×1920 y horizontal 1920×1080 desde una sola fuente. Tinta casi negra #0B0B0C,
  blanco #FFFFFF, amarillo de acento #FFE500 y gris #9A9AA2. Archivo 900 en mayúsculas muy apretadas,
  chip amarillo de antetítulo, una sola palabra en amarillo por rótulo, barra de acento que barre, B-roll a
  sangre con Ken Burns y degradado de lectura, cifras con conteo y escenas SVG con movimiento que significa
  algo. Cortes rápidos: algo cambia en cada corte.
unit: el viewport ES el escenario — 1080×1920 y 1920×1080 a la vez; todo en vw/vh/vmin, nunca px
principle: el guion manda el reloj · una palabra amarilla por rótulo · cada gráfico afirma algo verdadero
source: ~/.claude/skills/video-corto (references/sistema-visual.md, references/escenas-animadas.md, assets/vox.css)

colors:
  fondo: "#0B0B0C"        # --vox-ink: fondo y tarjetas tipográficas
  superficie: "#0F0F14"   # fondo de capturas (.capimg)
  superficie2: "#2A2A30"  # filete de comparativa en reposo (.cmprule)
  linea: "#2C2C36"        # borde de capturas
  texto: "#FFFFFF"        # --vox-white: texto principal
  textoSuave: "#9A9AA2"   # --vox-muted: etiquetas, atribuciones, fuentes
  entradilla: "#D7D7DC"   # deck / statlabel: texto de apoyo en caja baja
  acento: "#FFE500"       # --vox-yellow: chip, palabra clave, barra, cifra protagonista
  ok: "#3DDC97"
  aviso: "#FF9F1C"
  error: "#FF4D4D"
  capitulos: ["#FFE500", "#FFE500", "#FFE500", "#FFE500"]   # un solo acento en todo el vídeo
  scrim: "linear-gradient(to top, rgba(11,11,12,.95) 0%, rgba(11,11,12,.82) 34%, rgba(11,11,12,.5) 68%, rgba(11,11,12,.34) 100%)"

typography:
  headline: { fontFamily: "Archivo", weight: 900, size: "8.6vmin", lineHeight: 0.98, tracking: "-0.28vmin (≈ −0.03em)", upper: true, color: "texto; una palabra en acento con <em>" }
  caption:  { fontFamily: "Archivo", weight: 900, size: "6.2vmin", lineHeight: 1.02, tracking: "-0.15vmin", upper: true, use: "rótulo sobre foto (.caption)" }
  kicker:   { fontFamily: "Archivo", weight: 800, size: "2.9vmin", tracking: "0.32vmin (≈ 0.11em)", upper: true, color: "fondo sobre chip acento" }
  deck:     { fontFamily: "Archivo", weight: 700, size: "4.2vmin", lineHeight: 1.24, color: "entradilla", case: "caja baja" }
  statnum:  { fontFamily: "Archivo", weight: 900, size: "21vmin", lineHeight: 0.86, tracking: "-1vmin", color: "acento", fontVariant: "tabular-nums" }
  statunit: { fontFamily: "Archivo", weight: 900, size: "6.4vmin", upper: true }
  label:    { fontFamily: "Archivo", weight: 700, size: "3.2vmin", tracking: "0.18vmin", upper: true, color: "textoSuave" }
  quote:    { fontFamily: "Archivo", weight: 900, size: "6.6vmin", lineHeight: 1.1, borderLeft: "1.2vmin acento" }

radii:
  chip: "0"           # chips y barras rectos
  capture: "0"
  bar: "0"

spacing:
  safe: "6–7vmin laterales · 9–11vmin abajo (texto anclado abajo sobre foto)"
  card: "padding 10vmin 7vmin · gap 2.4vmin"
  bar: "14vmin × 1vmin bajo el rótulo"

motion:
  energy: alta
  easing: { entry: "expo.out", pop: "back.out(1.7)", count: "power2.out", kenburns: "none" }
  duration: { entrance: 0.35, beat-short: "0.8–2.5s", beat-explainer: "2–6s", transition: "≤ 0.25s" }
  atmosphere: [ken-burns-alterno, scrim, conteo-ascendente]
  transition: flash · escala · barrido (≤ 0,25 s)

components:
  kicker-chip:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.fondo}"
    description: "Chip amarillo de antetítulo sobre el titular (Archivo 800 en mayúsculas)"
  headline:
    description: "Titular 900 en mayúsculas muy apretado con UNA palabra en amarillo (<em>); dos ya no destacan nada"
  accent-bar:
    backgroundColor: "{colors.acento}"
    description: "Barra de 14×1vmin que barre bajo el rótulo (scaleX 0→1 desde la izquierda)"
  photo-shot:
    description: "B-roll a sangre (object-fit: cover) con Ken Burns que alterna in/out, .scrim que tiñe también la parte alta, texto anclado abajo y crédito"
  stat:
    description: "Cifra protagonista en amarillo con conteo ascendente (countTo) y tabular-nums, unidad en mayúsculas y etiqueta en caja baja"
  compare:
    description: "Dos cifras enfrentadas (en columna en 9:16, en fila en 16:9); la que carga el peso en amarillo con su filete amarillo"
  quote:
    description: "Cita en 900 con filete izquierdo amarillo de 1.2vmin y atribución en mayúsculas grises"
  capture:
    description: "Captura entera como prueba (object-fit: contain, nunca recortada a sangre), borde #2C2C36 y fondo #0F0F14, con su fuente"
  svg-scenes:
    description: "Escenas animadas de un solo uso: olas, puntos (cada punto = N), barras proporcionales, mapa esquemático, cierre con contador, órbita, precios antes→después, caída y ranking"
---

# Vox corto — Frame

## Concepto (Overview)

Un **explainer editorial corto**: la voz cuenta una idea o una noticia y cada corte la hace visible con una
cifra, una foto, una escena animada o una cita. Tinta negra, blanco, **un amarillo** y Archivo 900 en
mayúsculas. Rápido pero riguroso: cada dato con su fuente y cada gráfico en proporción real. Sirve para
Shorts, Reels, TikTok y YouTube, noticias explicadas, divulgación y «X en 60 segundos».

## El cuadro (The Frame)

- **Dos formatos desde una fuente**: 1080×1920 y 1920×1080. El viewport es el escenario, así que todo va
  en `vw`/`vh`/`vmin` (`vmin` para tipografía que debe leerse igual en los dos).
- Layouts que cambian de eje con `@media (min-aspect-ratio: 1/1)` (p. ej. la comparativa pasa de columna
  a fila).
- Sobre foto, el texto se ancla **abajo**, donde el degradado es más denso, dejando hueco al crédito.
- Tipos de beat: `stat`, `compare`, `title`, `quote`, `photo`, `capture` y `scene`.

## Colores (Colors)

`fondo` #0B0B0C, `texto` #FFFFFF, `acento` #FFE500, `textoSuave` #9A9AA2 para etiquetas y atribuciones y
#D7D7DC (`entradilla`) para el texto de apoyo. Capturas sobre `superficie` #0F0F14 con borde `linea`
#2C2C36; filete de comparativa en reposo `superficie2` #2A2A30. **Una sola palabra en amarillo por
rótulo.** Semánticos (`ok` #3DDC97, `aviso` #FF9F1C, `error` #FF4D4D) solo en variaciones de precios y
caídas. Todos los capítulos llevan el mismo amarillo (#FFE500).

Contraste sobre imagen: oscurecer solo el pie **no basta**; el `.scrim` tiñe también la parte alta. Si el
aviso de contraste persiste, regenera la imagen más oscura antes de subir el degradado.

## Tipografía (Typography)

Una familia, **Archivo**: 900 para titulares, rótulos y cifras (mayúsculas, tracking negativo, interlineado
0,86–1,02), 800 para el chip de antetítulo, 700 para entradillas (caja baja, para que respiren frente al
titular), etiquetas y atribuciones. Cifras con `tabular-nums` para que el conteo no baile de ancho.

## Fondo y superficies (Depth & Surface)

Plano. Tarjetas tipográficas sobre tinta; fotos a sangre con Ken Burns y `.scrim`; capturas con sombra
`0 2vmin 6vmin rgba(0,0,0,0.55)`. Nada de radios: chips, barras y capturas rectos.

## Componentes (Components)

Chip de antetítulo, titular con palabra amarilla, barra de acento, plano de foto con degradado, cifra con
conteo, comparativa, cita, captura como prueba y escenas SVG. Valores en el frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Chip | scaleX 0→1 o y 20→0 + opacidad | 0,25–0,35 s | expo.out |
| Titular | líneas o palabras que suben por máscara | 0,35–0,5 s | expo.out |
| Barra de acento | scaleX 0→1 desde la izquierda | 0,4 s | power3.out |
| Cifra | conteo ascendente (`countTo`) | 0,8–1,2 s | power2.out |
| Foto | Ken Burns lento, alternando `in` / `out` entre planos | todo el beat | none |
| Escenas SVG | movimiento continuo con `fromTo` y `ease: "none"` (depende solo del playhead) | todo el beat | none |

Beats de **0,8 a 2,5 s** en un short y de 2 a 6 s en un explainer de tres minutos; cada beat dura hasta que
arranca el siguiente (sin fotogramas negros). Entradas con `fromTo()`, nunca `from()`.

## Transiciones (Transitions)

Cortes secos al ritmo de la voz y transiciones **cortas (≤ 0,25 s)**: flash, escala o barrido. Sin
fundidos lentos. **Cambia algo en cada corte**: escala, encuadre, color o tipografía. Alterna cifra →
foto → escena animada → cita → foto (el error más común es el carrusel de rótulos).

## Subtítulos (Captions)

Rótulos grandes y **limpios**: Archivo 900 en mayúsculas a 5,4–6,2vmin, centrados, con sombra oscura para
leerse sobre cualquier imagen, en páginas de 2–4 palabras; la palabra clave en amarillo. En vertical,
por encima de la interfaz de la plataforma (≥ 15vmin del borde inferior).

## 3D

No usa 3D. Las escenas son SVG 2D deterministas.

## Audio

Locución que fija el ritmo (con emociones dirigidas si el tema lo permite; en noticias con víctimas, nada
de tono alegre), base electrónica o percusiva baja bajo la voz y efectos en cada corte (whoosh, golpe,
tic de conteo).

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Verificar los hechos antes de escribir el guion; cada cifra con su fuente en pantalla.
- Una palabra amarilla por rótulo; chip amarillo encima del titular.
- Proporciones reales en barras y comparativas; rotular «ESQUEMA, NO A ESCALA» o «CADA PUNTO = N».
- Movimiento con significado (escenas SVG) en vez de otro rótulo más.
- Prefijar las clases de cada escena (`.cbar`, `.ikicker`) para no chocar con `vox.css`.

### No (Don't)
- Nada de `px` fijos ni `data-width` en la raíz de una sub-composición.
- No recortar una captura a sangre (deja de ser prueba) ni usar `width: auto` en una `<img>` posicionada.
- Ni fundidos lentos ni dos palabras en amarillo.
- No rotar un `<g>` SVG con GSAP para una órbita: animar la posición con un proxy y `onUpdate`.
- Nada de `Math.random` en la geometría.

## Carga de fuentes (Font loading)

Copia `estilos/vox-corto/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs vox-corto
--ruta <carpeta>`); sin `<link>` a Google Fonts:

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Archivo";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/archivo-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Archivo";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/archivo-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Archivo";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/archivo-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Archivo";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/archivo-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Archivo";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/archivo-latin-ext-900-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Archivo";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/archivo-latin-900-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json`: modo oscuro, radios 0, borde 4, `subtitulos: limpio` con palabra activa en acento, energía
alta con entrada `expoOut` de 0,35 s y transición `zoom` (escala corta). Para vertical, la composición
`Vertical` del motor con la misma línea de tiempo.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Hechos:** cada cifra y afirmación verificada y con fuente.
- **Amarillo:** una palabra por rótulo; chip y barra presentes en los títulos.
- **Formatos:** los dos renders revisados con fotogramas sueltos; nada se sale del cuadro.
- **Contraste:** texto sobre foto ≥ 3:1 con el `.scrim`.
- **Ritmo:** algo cambia en cada corte; ningún carrusel de más de dos rótulos seguidos.

## Referencias

Sin renders en el catálogo: `referencias/` son muestrarios generados con estos tokens. 00 muestrario de
tokens · 01 rótulo horizontal sobre B-roll de ejemplo · 02 cifra en vertical 9:16 · 03 comparativa en
horizontal con rótulo.
