---
version: alpha
name: Señal informativo — Frame (capa de vídeo)
description: >
  Informativo de actualidad como «señal interceptada»: cada noticia entra como una transmisión y la
  prueba real (captura de la web oficial, publicación, cifra) se enmarca en una grafía de redacción
  precisa. Negro cálido #0B0C0E, un solo acento naranja señal #FF5B2E, blanco cálido #F2EEE7 (nunca
  #fff). League Gothic en mayúsculas para las afirmaciones e IBM Plex Mono para el instrumento. Nada
  decorativo que no sea «instrumento»: rejillas, marcas de registro, códigos de tiempo, barras de señal.
unit: el fotograma — 1920×1080 principal (informativo de YouTube); 9:16 posible con la misma grafía
principle: los átomos son sagrados · la composición es libre · cada dato lleva su fuente en pantalla
source: ~/videos-opus/videos/ia-septiembre-2026 (design.md, compositions/chrome.html, render)

colors:
  fondo: "#0B0C0E"        # --bg: fondo único en todas las escenas
  superficie: "#15171B"   # --panel: tarjetas, marcos de navegador
  superficie2: "#1D1F24"  # barra del navegador, chips de fecha
  linea: "#303031"        # --line rgba(242,238,231,.16) en opaco sobre el fondo: filetes y rejilla
  texto: "#F2EEE7"        # --fg: blanco cálido
  textoSuave: "#8E8A83"   # --muted: metadatos, créditos, URL
  textoMedio: "#C9C4BB"   # subtítulo de titular (entre texto y textoSuave)
  url: "#B9B4AB"          # texto del campo de URL del navegador
  campo-url: "#0F1013"    # fondo del campo de URL
  punto-navegador: "#3A3D44"   # los tres puntos de la barra del navegador
  acento: "#FF5B2E"       # --accent: señal (kicker, subrayados, barras, contador, recuadro de foco)
  ok: "#6FD08C"
  aviso: "#F2C14E"
  error: "#FF4D6D"
  capitulos: ["#FF5B2E", "#FF5B2E", "#FF5B2E", "#FF5B2E"]   # un solo acento: todas las noticias igual

typography:
  display:  { fontFamily: "League Gothic", weight: 400, tracking: "-0.005em", lineHeight: 0.9, upper: true, size: "120–340px", color: "texto; palabras clave en acento" }
  headline: { fontFamily: "League Gothic", weight: 400, lineHeight: 0.9, upper: true, size: "92–176px" }
  numeral:  { fontFamily: "League Gothic", weight: 400, size: "200–340px", note: "cifras gigantes; la unidad en acento" }
  kicker:   { fontFamily: "IBM Plex Mono", weight: 700, tracking: "0.16em", upper: true, size: "22–24px", color: "acento, con cuadrado de 14px delante" }
  body:     { fontFamily: "IBM Plex Mono", weight: 400, lineHeight: 1.4, size: "22–40px", color: "textoMedio / textoSuave" }
  meta:     { fontFamily: "IBM Plex Mono", weight: 400, tracking: "0.06em", upper: true, size: "22–24px", color: "textoSuave" }
  pill:     { fontFamily: "IBM Plex Mono", weight: 700, tracking: "0.14em", upper: true, size: "22px", color: "fondo sobre acento" }

radii:
  frame: "20px"         # marco de navegador y tarjetas de publicación
  url: "18px"           # campo de URL
  focus: "10px"         # recuadro de acento sobre la frase clave
  pill: "0px"           # etiquetas cuadradas (no píldoras)
  dot: "50%"

spacing:
  safe: "96px laterales · 84px arriba/abajo (los contenidos arrancan en x=120)"
  chrome: "bug SEÑAL arriba-izquierda · fecha + EN EMISIÓN + timecode arriba-derecha · contador 03/08 · ticker inferior"
  registration: "marcas de registro de 34px con trazo de 3px a 60px de los bordes"

motion:
  energy: alta
  easing: { entry: "expo.out", alt: ["power4.out", "back.out(1.6)", "power3.out"], exit: "power2.in", sweep: "power4.inOut", ambient: "sine.inOut" }
  duration: { entrance: 0.5, range: "0.4–0.7", hold: 3.0, transition: 0.9 }
  atmosphere: [rejilla-que-deriva, halo-que-respira, numero-fantasma, marcas-de-registro, grano-7%]
  transition: barrido-de-tres-barras

components:
  bug:
    description: "Cuadrado de acento + «SEÑAL» en League Gothic arriba a la izquierda; a su lado sección y fecha en mono"
  on-air:
    description: "Punto de acento + «EN EMISIÓN» + timecode en mono + barra de progreso segmentada (acento lo emitido)"
  kicker:
    description: "Cuadrado de acento de 14px + texto mono 700 en mayúsculas 0.16em en acento"
  pill:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.fondo}"
    rounded: "{radii.pill}"
    description: "Etiqueta de tipo de noticia (LANZAMIENTO, RESPUESTA…), cuadrada"
  headline-mask:
    description: "Titular League Gothic revelado palabra a palabra por máscara (.wm overflow hidden); una o dos palabras en acento"
  emblem:
    description: "Logotipo de la fuente dentro de anillos concéntricos (sólido + discontinuo en acento) con cruz de mira"
  browser-frame:
    backgroundColor: "{colors.superficie}"
    rounded: "{radii.frame}"
    description: "Marco de navegador con barra #1D1F24, tres puntos y la URL real; la captura dentro con push-in lento"
  focus-box:
    description: "Recuadro de 5px en acento, radio 10, que se dibuja sobre la frase clave y oscurece el resto al 42 %, con halo del acento"
  post-card:
    description: "Publicación como tarjeta flotante con su captura real del embed oficial, inclinada en 3D que se endereza"
  numeral-split:
    description: "Dos cifras gigantes separadas por un filete vertical; la que carga el peso en acento"
  ticker:
    description: "Banda inferior «ÚLTIMA HORA» (etiqueta en acento) con titulares en mono separados por rombos"
  ghost-number:
    description: "Número de la noticia a 980px con relleno del texto al 4,5 % y contorno de 2px al 13 %, abajo a la derecha"
---

# Señal informativo — Frame

## Concepto (Overview)

Un **informativo interceptado**. Cada noticia llega como una transmisión: el titular es una afirmación
rotunda en League Gothic, la prueba se enseña (la web oficial en un marco de navegador con su URL, la
publicación original, la cifra con su fuente) y todo lo demás es **instrumento**: rejilla, marcas de
registro, timecode, barras de señal. Serio, rápido, editorial. Sirve para resúmenes de actualidad, boletines
mensuales, noticias de tecnología y cualquier pieza que tenga que **demostrar** lo que cuenta.

## El cuadro (The Frame)

- 1920×1080. Márgenes seguros de 96 px laterales y 84 px arriba/abajo; el contenido arranca en x = 120.
- **Chrome persistente** en todas las escenas: bug «SEÑAL» arriba a la izquierda, fecha + «EN EMISIÓN» +
  timecode arriba a la derecha, contador de noticia `03/08`, ticker inferior de «ÚLTIMA HORA».
- Cada escena tiene tres capas: fondo (rejilla + halo + número fantasma) · contenido (titular, captura,
  cifra) · acentos (filetes, etiquetas mono, marcas de registro).
- Tipos de plano: titular con emblema, dato gigante, captura en navegador, publicación flotante, lista
  numerada, comparativa de cifras, resumen en rejilla y cierre.

## Colores (Colors)

Una sola acento. `fondo` #0B0C0E en todas las escenas; `superficie` #15171B para tarjetas y marcos,
`superficie2` #1D1F24 para la barra del navegador. Texto en blanco cálido `texto` #F2EEE7 (nunca #fff);
metadatos y URL en `textoSuave` #8E8A83; subtítulos de titular en `textoMedio` #C9C4BB. Filetes y rejilla
en `linea` #303031 (es rgba(242,238,231,.16) aplanado sobre el fondo; en HTML se puede usar el rgba).
`acento` #FF5B2E para kicker, palabras clave, subrayados, barras, contador y recuadro de foco. Los
semánticos (`ok` #6FD08C, `aviso` #F2C14E, `error` #FF4D6D) no aparecen en el informativo original: solo
para paneles con tono. Todas las noticias usan el mismo acento (#FF5B2E en los cuatro capítulos).

**Sin degradados lineales a pantalla completa** (bandas en H.264): solo radiales localizados del acento al
15–26 %.

## Tipografía (Typography)

Dos voces:

- **League Gothic** 400 — titulares y cifras, siempre en mayúsculas, −0,005em, interlineado 0,9, de 92 a
  340 px. Es la voz de las afirmaciones. Las palabras clave van en `<em>` en acento.
- **IBM Plex Mono** 400/700 — kickers (700, 0,16em, mayúsculas), metadatos (0,06em, mayúsculas), cuerpo
  corto (22–40 px, interlineado 1,4), URL y atribuciones. Es la voz del instrumento.

## Fondo y superficies (Depth & Surface)

- Rejilla de 80 px con líneas de 2 px al 7 % que deriva despacio; halo radial del acento de 1500 px
  (26 % → 8 % → 0) que respira; número fantasma de la noticia a 980 px; grano al 7 % en `overlay` que se
  mueve a saltos (`steps`).
- Marcos de navegador con sombra `0 40px 120px rgba(0,0,0,0.6)` y un borde de 2 px al 14 %.
- Marcas de registro en las cuatro esquinas (34 px, trazo de 3 px al 40 %).

## Componentes (Components)

Bug, «EN EMISIÓN» con timecode, kicker con cuadrado, pill cuadrada de tipo de noticia, titular por
máscara, emblema con anillos y mira, marco de navegador con URL real, recuadro de foco, tarjeta de
publicación, cifras enfrentadas, ticker y número fantasma. Valores en el frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Kicker / meta | opacidad 0→1, x −30→0 | 0,4–0,5 s | power3.out |
| Titular | palabra a palabra por máscara (yPercent 100→0), desfase 0,06 s | 0,5–0,7 s | expo.out |
| Pill | scaleX 0→1 desde la izquierda | 0,4 s | power4.out |
| Emblema | anillos escala 0,8→1 + giro lento del discontinuo | 0,7 s + lineal | back.out(1.6) |
| Captura | inclinación 3D que se endereza (rotateY/X → 0) + push-in lento 1→1,06 | 0,7 s + toda la escena | expo.out / none |
| Recuadro de foco | se dibuja (clip o scale) sobre la frase clave | 0,5 s | power3.out |
| Cifra | contador con `tabular-nums`, unidad en acento | 0,9 s | power3.out |
| Ambiente | rejilla que deriva, halo que respira, grano a saltos | continuo | none / sine.inOut |
| Salidas | opacidad 1→0, y 0→−20 | 0,3 s | power2.in |

Se varían las curvas de una escena a otra (expo.out, power4.out, back.out(1.6)) para que no todo entre igual.

## Transiciones (Transitions)

**Barrido de tres barras** entre noticias: tres barras a pantalla completa inclinadas `skewX(−12°)`
—`superficie` #15171B con el número de la noticia a 560 px en acento, `texto` #F2EEE7 y `acento`
#FF5B2E— entran de izquierda a derecha con 0,06 s de desfase (x 0→2500, 0,5 s power3.in), tapan el
cambio de escena y salen (x →5000, 0,55 s power3.out); whoosh sincronizado. Dentro de una noticia,
cortes secos entre planos.

## Subtítulos (Captions)

El informativo original no los llevaba (el texto en pantalla ya cuenta la noticia). Si se añaden: caja
`superficie` al 90 % con radio 10, IBM Plex Mono 700 a 36–40 px en `texto`, palabra activa en acento,
máximo 42 caracteres por página, encima del ticker (y ≤ 960).

## 3D

Solo inclinaciones 3D de CSS (perspectiva 2200 px) para capturas y tarjetas que se enderezan. No hay
objetos 3D; si se usan, material estándar oscuro con aristas en acento, sin toon.

## Audio

Base electrónica de informativo a 112 bpm (batería contenida, bajo de sintetizador en arpegio, pads),
sin melodía principal para dejar sitio a la locución; ráfaga de intro y cierre resolutivo. Efectos:
whoosh en cada barrido, impacto grave en titulares, tic de interfaz, obturador en capturas, glitch corto,
teclado. Locución por delante; música en carve bajo la voz.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Cada afirmación con su prueba: captura real con la URL visible o la publicación original.
- Kicker con la fuente (medio, web oficial) y fecha en mono en cada noticia.
- Una o dos palabras clave del titular en acento, nunca el titular entero.
- Contador de noticia y timecode siempre visibles.

### No (Don't)
- Nada decorativo que no sea instrumento; ni iconos de adorno ni ilustraciones.
- Nada de #fff puro ni de un segundo acento.
- Ni degradados lineales a pantalla completa ni fotos de personas como protagonistas del plano.
- No recortar una captura a sangre hasta hacerla ilegible: la prueba tiene que leerse.
- No inventar cifras ni citas; nombres reales solo si son la noticia y nunca de particulares.

## Carga de fuentes (Font loading)

Copia `estilos/senal-informativo/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
senal-informativo --ruta <carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"League Gothic";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/league-gothic-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"League Gothic";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/league-gothic-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/ibm-plex-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/ibm-plex-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/ibm-plex-mono-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/ibm-plex-mono-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json` recoge la paleta, las dos voces y el movimiento (`energia: alta`, `expoOut` 0,5 s,
`transicion: barrido`). `forma.radioPildora` es 0: las etiquetas son cuadradas.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Acento único:** solo #FF5B2E; blanco cálido, nunca #fff.
- **Voces:** League Gothic en mayúsculas para afirmar; IBM Plex Mono para todo lo demás.
- **Prueba:** cada noticia tiene su captura, URL o publicación real y su fuente en pantalla.
- **Chrome:** bug, EN EMISIÓN, timecode, contador y ticker presentes.
- **Bandas:** ningún degradado lineal a pantalla completa.

## Referencias

`referencias/`: 01 titular con emblema · 02 dato gigante · 03 captura en marco de navegador con recuadro
de foco · 04 cifras enfrentadas · 05 titular con palabras en acento · 06 cierre.
