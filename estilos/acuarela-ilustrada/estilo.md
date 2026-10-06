---
version: alpha
name: Acuarela ilustrada — Frame (capa de vídeo)
description: >
  Pieza corta (30–90 s) que alterna a una presentadora sobre fondo blanco con ilustraciones de acuarela
  reconstruidas en 2,5D. Sobre el dibujo se colocan tarjetas blancas, chips y recuadros dibujados a
  mano, anclados a puntos de la ilustración para que la sigan cuando se mueve la cámara. Papel cálido
  #FBF7EF, tinta grafito #2A2833 y acentos de aguada: terracota #B5472F, verde azulado #1F6F78, ocre
  #8A6212 y ciruela #6E4A7E. Nunito para titulares y texto, Caveat para las anotaciones a mano.
unit: el fotograma — 1920×1080 a la cadencia de la fuente; el montaje va 1:1 con el original (fotograma N = fotograma N)
principle: la ilustración manda · los gráficos se pegan al dibujo · la paleta sale de las propias ilustraciones
source: docs/METODO_EDICION_IA.md §3, §4.4, §7.4–§7.6 (vídeo A, pieza corta ilustrada de 54 s)

colors:
  fondo: "#FBF7EF"        # papel de acuarela cálido
  superficie: "#FFFFFF"   # tarjetas blancas y cajas de subtítulo
  superficie2: "#F3E9D8"  # aguada cálida de fondo de tarjeta secundaria
  linea: "#D8CBB6"        # filetes y bordes suaves
  texto: "#2A2833"        # tinta grafito (nunca negro puro)
  textoSuave: "#5F5A66"
  acento: "#B5472F"       # terracota: anotaciones, recuadros dibujados, palabra activa
  ok: "#2F7A5B"
  aviso: "#8A6212"
  error: "#B23A3A"
  capitulos: ["#B5472F", "#1F6F78", "#8A6212", "#6E4A7E"]   # terracota, verde azulado, ocre, ciruela
  # aguadas (para manchas y fondos, con alfa 0,2–0,55 y mezcla multiply)
  aguada-cielo: "#1F6F78"
  aguada-hierba: "#2F7A5B"
  aguada-sol: "#8A6212"
  sombra-tarjeta: "rgba(60,40,20,0.18)"

typography:
  display:  { fontFamily: "Nunito", weight: 800, tracking: "-0.01em", lineHeight: 1.08, size: "54–96px", color: "texto" }
  numeral:  { fontFamily: "Nunito", weight: 800, tracking: "-0.03em", size: "160–260px", color: "acento" }
  body:     { fontFamily: "Nunito", weight: 400, lineHeight: 1.4, size: "28–36px", color: "textoSuave" }
  chip:     { fontFamily: "Nunito", weight: 600, size: "24–30px", color: "color del tono o del capítulo" }
  caption:  { fontFamily: "Nunito", weight: 600, size: "44px", lineHeight: 1.25 }
  hand:     { fontFamily: "Caveat", weight: 700, tracking: "0em", size: "36–56px", color: "acento", use: "antetítulos y anotaciones a mano sobre el dibujo" }
  mono:     { fontFamily: "JetBrains Mono", weight: 400, size: "20px", use: "casi nunca (fuentes de un dato)" }

radii:
  card: "18px"
  chip: "999px"
  caption: "16px"
  drawn-box: "trazo a mano, sin radio fijo"

spacing:
  safe: "96px laterales · 90px arriba · banda inferior para subtítulos (56px del borde)"
  card: "padding 38×44px; ancho 700–1000px"
  stroke: "recuadros y flechas dibujados de 4–5px con temblor (feDisplacementMap 5)"

motion:
  energy: media
  easing: { entry: "power2.out", pop: "back.out(1.4)", camera: "sine.inOut", draw: "power1.inOut" }
  duration: { entrance: 0.7, draw: 0.6, hold: 2.5, transition: 0.8 }
  atmosphere: [parallax-2.5D, grano-de-papel, cámara-lenta-sobre-el-dibujo]
  transition: fundido-entre-ilustración-y-presentadora

components:
  illustration-2-5d:
    description: "Ilustración a sangre como plano de three.js subdividido (480×270) desplazado por un mapa de profundidad, con compensación proyectiva p.xy *= (D − z)/D: en reposo se ve idéntica al original y al mover la cámara aparece el parallax (profundidad ≈ 1,8, desplazamiento lateral ≤ 0,6)"
  anchor:
    description: "anchor(u, v, lift): convierte un píxel de la ilustración en un punto 3D sobre la superficie; tarjetas, chips, recuadros y objetos 3D se atan a él y siguen al dibujo"
  white-card:
    backgroundColor: "{colors.superficie}"
    rounded: "{radii.card}"
    description: "Tarjeta blanca con sombra cálida 0 18px 40px rgba(60,40,20,.18): antetítulo a mano en Caveat, titular Nunito 800 y texto"
  chip:
    rounded: "{radii.chip}"
    description: "Píldora blanca con borde de 3px en el color del tono (✓ ok, ✗ error) o del capítulo, texto Nunito 600 del mismo color"
  drawn-box:
    description: "Recuadro u óvalo dibujado a mano alrededor de un elemento de la ilustración, en terracota de 5px, que se traza en 0,6 s; con flecha a su chip"
  number-badge:
    description: "Círculo de 58px lleno del color del capítulo con el número en blanco para pasos sobre el dibujo"
  toon-object:
    description: "Objeto 3D por escena (nevera, termómetro, gráfica, reloj…) en toon de 3 tonos con contorno de tinta, anclado al dibujo y ocluido por él mediante el buffer de profundidad"
  presenter-cutout:
    description: "Presentadora recortada (WebP RGBA por fotograma en piezas cortas) sobre blanco o sobre el papel"
---

# Acuarela ilustrada — Frame

## Concepto (Overview)

Una **pieza corta y cálida** que explica algo cotidiano con ilustraciones de acuarela. Una presentadora
habla sobre fondo blanco y el vídeo alterna con las ilustraciones, que cobran profundidad (2,5D) mientras
la cámara se mueve despacio. Encima del dibujo aparecen tarjetas blancas, chips y recuadros trazados a
mano que señalan justo lo que se está diciendo. Amable, didáctica y artesana. Sirve para piezas de 30–90 s,
salud y bienestar, consumo, divulgación, campañas institucionales y resúmenes ilustrados.

## El cuadro (The Frame)

- 1920×1080. El montaje va **1:1 con el original** (sin cortes de tiempo): la voz no se toca.
- Dos tipos de plano: **presentadora** (recortada sobre blanco o papel, con tarjetas al lado) e
  **ilustración** (a sangre, en 2,5D, con gráficos anclados a puntos del dibujo).
- Capas en la ilustración: papel → ilustración desplazada por profundidad → objetos 3D (con oclusión) →
  recuadros y flechas dibujados → tarjetas y chips → subtítulos.
- Márgenes de 96 px laterales y 90 px arriba; los gráficos no tapan lo que señalan.

## Colores (Colors)

**La paleta sale de las ilustraciones de cada proyecto** (ver «Crear un estilo nuevo desde un vídeo» en la
skill `estilos-video`: muestrear fotogramas limpios y `palettegen`). Los valores de este archivo son la
paleta por defecto, típica de acuarela:

- `fondo` papel #FBF7EF, `superficie` blanca #FFFFFF para tarjetas y subtítulos, `superficie2` #F3E9D8
  (aguada cálida), `linea` #D8CBB6.
- `texto` grafito #2A2833 (nunca negro puro) y `textoSuave` #5F5A66.
- `acento` terracota #B5472F para anotaciones, recuadros dibujados y la palabra activa; capítulos:
  **terracota #B5472F, verde azulado #1F6F78, ocre #8A6212, ciruela #6E4A7E** (todos ≥ 5:1 sobre el papel).
- Semánticos para chips con tono: `ok` #2F7A5B, `aviso` #8A6212, `error` #B23A3A.
- Aguadas decorativas: los mismos colores con alfa 0,2–0,55 y mezcla `multiply`, bordes irregulares.

## Tipografía (Typography)

**Nunito** 800 para titulares y cifras (redondeada, amable), 400 para el texto y 600 para chips y
subtítulos. **Caveat** 700 para antetítulos y anotaciones escritas a mano sobre el dibujo (sin mayúsculas).
**JetBrains Mono** solo para la fuente de un dato, si hace falta.

## Fondo y superficies (Depth & Surface)

Papel cálido con grano. Tarjetas **blancas** con radio 18 y sombra cálida
`0 18px 40px rgba(60,40,20,0.18)`; nada de cristal ni de bordes duros. Profundidad real en la ilustración
(mapa de profundidad Depth Anything V2 + parallax) y oclusión de los objetos 3D por el propio dibujo.

## Componentes (Components)

Ilustración 2,5D, anclajes, tarjeta blanca, chip, recuadro dibujado con flecha, insignia de paso, objeto
3D toon y presentadora recortada. Detalle en el frontmatter. Los gráficos se diseñan **uno a uno** para
cada ilustración (en una pieza de menos de 2–3 min no compensa un sistema genérico).

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Tarjeta blanca | opacidad 0→1, y 20→0, escala 0,97→1 | 0,7 s | power2.out |
| Chip | escala 0,6→1 con leve rebote | 0,4 s | back.out(1.4) |
| Recuadro / flecha dibujados | trazo que se revela (stroke-dashoffset) | 0,6 s | power1.inOut |
| Cifra | contador | 0,9 s | power2.out |
| Cámara sobre la ilustración | desplazamiento lateral ≤ 0,6 y acercamiento suave; parallax por profundidad | todo el plano | sine.inOut |
| Objeto 3D | aparece con escala y gira despacio anclado al dibujo | 0,8 s + continuo | power2.out |

Todo anclado: si la cámara se mueve, tarjetas, chips y recuadros siguen al punto del dibujo.

## Transiciones (Transitions)

**Fundido** de 0,6–0,8 s entre la presentadora y la ilustración (respetando los fundidos del original si
los hay). Dentro de una ilustración no hay cortes: la cámara se mueve.

## Subtítulos (Captions)

Caja blanca con radio 16 y la sombra cálida, Nunito 600 a 44 px en grafito, centrada abajo; palabra activa
en terracota (acento), pendientes al 50 %. Máximo ~40 caracteres por página.

## 3D

`MeshToonMaterial` con rampa de 3 tonos y contorno de tinta propio (casco invertido), colores de la paleta
de la ilustración. Un objeto por escena, anclado con `anchor(u, v, lift)` y ocluido por el buffer de
profundidad (no hace falta segmentar). Texto sobre objetos con `CanvasTexture`.

## Audio

Voz original intacta. Efectos sintetizados suaves (barrido de ruido rosa, pop al entrar una tarjeta,
tic-tac, golpe grave) y, si hay una con licencia, una música muy baja; sin licencia, sin música.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Sacar la paleta de las ilustraciones reales del proyecto y validarla con `validar.mjs`.
- Anclar cada gráfico a un punto del dibujo y señalar con un recuadro dibujado lo que se nombra.
- Tarjetas blancas con sombra cálida; anotaciones a mano en Caveat.
- Parallax contenido (profundidad ≈ 1,8, lateral ≤ 0,6) para no estirar los bordes.

### No (Don't)
- Nada de cristal, neón ni degradados digitales: todo debe parecer papel y pigmento.
- No tapar con una tarjeta lo que la voz está señalando.
- No inventar datos ni decisiones que el guion no da (en contenido clínico, validación experta).
- Ni negro puro ni blanco puro de fondo en la ilustración (el blanco es para tarjetas).

## Carga de fuentes (Font loading)

Copia `estilos/acuarela-ilustrada/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
acuarela-ilustrada --ruta <carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Nunito";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/nunito-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/nunito-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Nunito";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/nunito-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/nunito-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Nunito";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/nunito-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/nunito-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Caveat";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/caveat-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Caveat";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/caveat-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

Es el estilo del método «corto-ilustrado»: modo claro, `paneles: papel`, `fondo: papel`, subtítulos en caja
con palabra activa en acento, entrada `power2Out` de 0,7 s, `transicion: fundido` y 3D toon con contorno.
Al crear el proyecto, sustituye la paleta por la de sus ilustraciones con una variante
(`estilos/acuarela-ilustrada-<proyecto>/`).

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Paleta:** coincide con la de las ilustraciones; contraste AA validado.
- **Anclaje:** tarjetas, chips y recuadros siguen al dibujo en todo el movimiento de cámara.
- **Parallax:** sin bordes estirados entre manos, objetos y fondo.
- **Oclusión:** los objetos 3D quedan detrás de lo que está delante en el dibujo.
- **Contenido:** cada gráfico dice lo que dice la voz, nada más.

## Referencias

Sin renders en el catálogo: `referencias/` son muestrarios generados con estos tokens y una ilustración de
acuarela procedimental de ejemplo. 00 muestrario de tokens · 01 ilustración con tarjeta, recuadro dibujado
y chips · 02 cifra en tarjeta blanca con chips de tono · 03 pasos numerados sobre el dibujo.
