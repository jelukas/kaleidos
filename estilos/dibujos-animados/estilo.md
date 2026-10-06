---
version: alpha
name: Dibujos animados — Frame (capa de vídeo)
description: >
  Episodio de serie de dibujos animados de sábado por la mañana: personajes articulados en SVG con trazo
  grueso de tinta #10231D y colores planos, brazos «de manguera», rayos de sol de dos tonos, bocadillos
  y estallidos de cómic, onomatopeyas con contorno, cartelas de narrador y animación «a doses» (12
  dibujos por segundo) con línea que tiembla («boil»). Paleta base de marca bosque #173F32, lima #D6F469
  y marfil #F7F8F2, más una paleta de decorados y personajes. Inter Tight 800 y DM Sans.
unit: el fotograma — 1920×1080 (web, YouTube, LinkedIn); 9:16 recomponiendo decorados
principle: todo es dibujo · la línea respira · el chiste llega en el golpe de sonido
source: ~/videos-opus/videos/ensaya-promo-v8-dibujos (BRIEF.md, engine/kit.js, engine/rigs.js, engine/scenes.js, render)

colors:
  fondo: "#173F32"        # bosque: cartela de título, guarida, fondo de rótulos del motor
  superficie: "#10231D"   # tinta: paneles de interfaz, caja de subtítulos
  superficie2: "#0F2D24"  # bosque oscuro: segundo panel, sombras de decorado
  linea: "#10231D"        # contorno de tinta de 6–9 px en TODO
  texto: "#F7F8F2"        # marfil
  textoSuave: "#B6C6BB"   # salvia
  acento: "#D6F469"       # lima: cartelas, rayos, onomatopeyas, capa de la heroína
  lima-oscura: "#A9C94A"  # sombra plana de la lima
  ok: "#7BD88F"
  aviso: "#FFE066"        # amarillo de rayo / estallido
  error: "#FF6B57"
  capitulos: ["#D6F469", "#FFE066", "#FF8A73", "#8FD3F4"]   # lima, amarillo, coral, celeste
  # decorados
  cielo-noche: "#241C44"
  morado: "#6A4889"
  morado-oscuro: "#3A2B5E"
  rojo-comic: "#E5484D"
  sol: "#FFD27A"
  nube: "#FBD9C4"
  melocoton: "#F6BE86"
  papel-pared: "#EFE9D8"
  blanco: "#FFFFFF"       # bocadillos, guantes, ojos
  # personajes (piel, pelo, ropa: ajustar por personaje; engine/rigs.js › C)
  piel: "#C98B63"
  piel-sombra: "#AD7150"
  pelo: "#2A1B17"
  americana: "#3C6E8F"
  americana-sombra: "#2E5873"
  camisa: "#F3F1EA"
  falda: "#26323A"
  traje-villano: "#5B4B8A"
  traje-villano-sombra: "#45386E"
  raya-traje: "#7766A6"
  piel-villano: "#F0C2A0"
  piel-villano-sombra: "#D9A283"
  nariz-villano: "#E48C78"
  pelo-villano: "#EDEAE2"
  monoculo: "#C9A227"
  corbata: "#E5484D"
  boca: "#6B1F24"
  lengua: "#E0707A"
  rubor: "#E88A7A"
  sudor: "#8FD3F4"
  # resto de decorados del episodio original (sombras, maderas, plantas, cielos, placas)
  decorados-extra: ["#1F4D3E", "#2B4A3F", "#34245F", "#B44E7A", "#F6A55E", "#7A1E2B", "#5A0F1E", "#28050F", "#2A0E17", "#E7E0CB", "#5E9E5A", "#C8664A", "#9A6B4A", "#B7825C", "#56606B", "#8A949E", "#DCE7E0", "#E3F0B8", "#E6F5B7", "#EAF7C2", "#FFE3A8", "#FFE3D6", "#50614B"]
  negro: "#000000"        # solo en sombras con alfa

typography:
  display:  { fontFamily: "Inter Tight", weight: 800, tracking: "-0.02em", lineHeight: 1.0, upper: true, size: "96–180px", treatment: "relleno lima o marfil + contorno de tinta de 14px + sombra desplazada 8px" }
  title-kicker: { fontFamily: "DM Sans", weight: 700, tracking: "0.22em", upper: true, size: "46px", color: "marfil" }
  caption-box: { fontFamily: "Inter Tight", weight: 800, tracking: "0.03em", upper: true, size: "36–40px", color: "tinta sobre lima" }
  balloon:  { fontFamily: "DM Sans", weight: 700, lineHeight: 1.12, size: "40–52px", color: "tinta" }
  body:     { fontFamily: "DM Sans", weight: 700, lineHeight: 1.15, size: "34–46px" }
  subtitle: { fontFamily: "DM Sans", weight: 700, size: "38px", color: "marfil sobre tinta al 92 %" }
  mono:     { fontFamily: "DM Mono", weight: 400, size: "22–26px", use: "cronómetros de la interfaz" }

radii:
  subtitle: "22px"
  panel: "22px"
  pill: "999px"
  balloon: "óvalo (o estallido de 22 puntas si grita)"
  caption: "0px (caja recta con sombra de tinta desplazada)"

spacing:
  outline: "tinta de 6–9px en decorados y personajes; extremidades con contorno de w + 11px"
  shadow: "sombra dura desplazada 10px 12px en tinta (sin desenfoque)"
  safe: "70px; cartela de narrador arriba a la izquierda (70, 70); subtítulos centrados en y ≈ 1030"

motion:
  energy: alta
  easing: { entry: "back (c=1.9)", stamp: "elastic", move: "cubic.inOut", bounce: "bounce", sine: "sine" }
  duration: { entrance: 0.3, balloon: 0.32, stamp: 0.6, hold: 1.5, transition: 0.45 }
  atmosphere: [rayos-que-giran, boil-de-linea-12fps, destellos, sacudida-de-camara]
  transition: iris · whoosh-corte

components:
  sunburst:
    description: "Rayos de sol: círculo de un tono + triángulos alternos del otro (lima/bosque, rojo/rojo oscuro, melocotón/crema) que giran despacio detrás del personaje"
  character-rig:
    description: "Muñeco articulado en SVG: cabeza, torso, extremidades «de manguera» (curva cuadrática que pasa por el codo, contorno de tinta w+11), boca con dientes y lengua recortadas, parpadeo con semilla (~20/min), labios sincronizados con la amplitud de la voz"
  balloon:
    backgroundColor: "{colors.blanco}"
    description: "Bocadillo ovalado con rabito hacia quien habla, contorno de 7px; si grita, estallido de 22 puntas que tiembla; entra con back en 0,32 s"
  caption-box:
    backgroundColor: "{colors.acento}"
    description: "Cartela de narrador: caja lima con borde de tinta de 6px y sombra de tinta desplazada 10px; entra girando −2°→0 con back"
  stamp:
    description: "Onomatopeya o sello (¡ZAS!, ¡PRUEBA!, ¡UPS!) sobre estallido lima o amarillo con borde de 8px; entra con elastic en 0,6 s y tiembla a doses"
  outlined-title:
    description: "Título con relleno lima/marfil, contorno de tinta de 14px (paint-order stroke) y copia en tinta desplazada 8px como sombra"
  ribbon:
    description: "Banda de episodio con puntas en cola de golondrina, lima con borde de tinta de 8px"
  ui-panel:
    backgroundColor: "{colors.superficie}"
    description: "Interfaz de producto redibujada en clave de dibujo: panel tinta/bosque redondeado, píldoras, onda de voz lima, cronómetro en mono"
  hologram:
    description: "Personaje en verde translúcido sobre una plataforma de rejilla con cono de luz: la IA que hace de interlocutor"
  sparkles:
    description: "Destellos de cuatro puntas lima/marfil con contorno de 5px que salen del golpe"
  iris:
    description: "Transición de iris: círculo de tinta que se cierra hasta el punto de interés y vuelve a abrir (0,45 s por lado)"
---

# Dibujos animados — Frame

## Concepto (Overview)

Un **episodio de serie de dibujos**: cartela de título, un conflicto con villano, la heroína que entrena,
un golpe final y el «¡Continuará…!». Todo está dibujado en código (SVG vectorial, trazo grueso y colores
planos) y se anima como la tele de antes: 12 dibujos por segundo y línea que tiembla. Humor, energía y
claridad. Sirve para presentar un producto o una idea de forma memorable, piezas para redes, formación con
personajes y series cortas.

## El cuadro (The Frame)

- 1920×1080. Cada escena es un decorado a sangre (ciudad al atardecer, despacho, guarida, sala de
  reuniones) con personajes en primer plano y la tipografía de cómic encima.
- Capas: decorado (con «boil») → personajes (con «boil») → bocadillos y estallidos → marca nítida sin
  temblor (logotipos, interfaz) → cartela de narrador → subtítulos → iris.
- Cartela de narrador arriba a la izquierda (70, 70); subtítulos centrados abajo (y ≈ 1030).

## Colores (Colors)

Base de marca: `fondo` bosque #173F32, `superficie` tinta #10231D, `superficie2` #0F2D24, `texto` marfil
#F7F8F2, `textoSuave` salvia #B6C6BB y `acento` lima #D6F469 (su sombra plana, #A9C94A). **Todo lleva
contorno de tinta** (`linea` #10231D). Decorados: cielo de noche #241C44, morados #6A4889 / #3A2B5E, rojo
de cómic #E5484D, sol #FFD27A, nubes #FBD9C4, melocotón #F6BE86, papel pintado #EFE9D8 y blanco #FFFFFF
para bocadillos. Personajes: piel #C98B63 / #AD7150, pelo #2A1B17, americana #3C6E8F, traje del villano
#5B4B8A con raya #7766A6, boca #6B1F24, lengua #E0707A, rubor #E88A7A, sudor #8FD3F4. Acentos por
capítulo: #D6F469, #FFE066, #FF8A73 y #8FD3F4. Semánticos: `ok` #7BD88F, `aviso` #FFE066, `error`
#FF6B57. Colores planos siempre: nada de degradados salvo los rayos (que son geometría).

## Tipografía (Typography)

- **Inter Tight 800** en mayúsculas para títulos, cartelas y onomatopeyas, con relleno lima o marfil,
  contorno de tinta de 14 px y una copia en tinta desplazada 8 px como sombra.
- **DM Sans 700** para bocadillos (40–52 px, interlineado 1,12), subtítulos (38 px) y el cuerpo;
  DM Sans 700 con tracking 0,22em para la línea «LAS AVENTURAS DE LA».
- **DM Mono** para cronómetros de interfaz.

## Fondo y superficies (Depth & Surface)

Plano con **sombra dura**: cajas y cartelas con sombra de tinta desplazada 10 px 12 px, sin desenfoque.
Profundidad por superposición de decorados con contorno y por los rayos de sol que giran detrás del
personaje. La marca (logotipo, interfaz real) va nítida, fuera del filtro de temblor.

## Componentes (Components)

Rayos de sol, muñeco articulado con boca y parpadeo, bocadillo (normal o grito), cartela de narrador,
sello/onomatopeya, título con contorno, banda de episodio, panel de interfaz dibujado, holograma,
destellos e iris. Valores exactos en el frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Animación de personajes | poses con fotogramas clave; se muestrea **a doses** (`floor(t·12)/12`) | — | cubic.inOut entre claves |
| Temblor de línea («boil») | `feTurbulence` baseFrequency 0,018, 2 octavas, desplazamiento 3,2; la semilla cambia 12 veces/s entre 4 valores | continuo | — |
| Bocadillo | escala 0→1 con rebote; al salir se encoge y funde | 0,32 s · 0,25 s | back (c = 1,9) |
| Cartela | entra desde −40 px girando −2°→0 | 0,3 s | back |
| Sello / onomatopeya | escala con muelle + temblor de ±1,2° a doses | 0,6 s | elastic |
| Rayos de sol | giro lento continuo | escena entera | lineal |
| Sacudida de cámara | amplitud que decae en 0,5 s en cada golpe | 0,5 s | lineal |
| Labios | amplitud de la voz muestreada a 30 fps y a doses | — | — |
| Parpadeo | por personaje con semilla, ~20 por minuto | 0,12 s | — |

Todo es una función pura del tiempo (`render(t)`): el mismo instante da siempre el mismo dibujo.

## Transiciones (Transitions)

Cortes con **whoosh** entre escenas y **iris** (círculo de tinta que se cierra sobre el punto de interés
y vuelve a abrir, 0,45 s por lado) en los cambios grandes y al final del episodio. En el motor se mapea
a `barrido`.

## Subtítulos (Captions)

Caja de tinta #10231D al 92 % con radio 22, DM Sans 700 a 38 px en marfil, centrada abajo; trozos de hasta
42 caracteres por frase del narrador, sin resaltado palabra a palabra (el ritmo lo marcan bocadillos y
onomatopeyas). Los diálogos de personajes van en bocadillos, no en subtítulos.

## 3D

Si se usa, material toon de 3 tonos con contorno de tinta (casco invertido) y colores planos de la paleta;
nada de brillos realistas.

## Audio

Todo local: narrador de tráiler, voces de personaje diseñadas (el holograma, con filtro robótico), una
fanfarria de superhéroes **muy baja** con carve bajo la voz y efectos cómicos sincronizados con la imagen
desde la misma lista de señales: whoosh, pop, pow, sparkle, trueno, holograma.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Contorno de tinta en todo lo dibujado; colores planos; sombras duras desplazadas.
- Animación a doses y «boil» en decorados y personajes; la marca, nítida.
- Onomatopeya y sacudida en los golpes; efecto de sonido en el mismo fotograma.
- Personajes ficticios; la interfaz del producto redibujada en clave de dibujo.

### No (Don't)
- Nada de fotografía, degradados suaves ni sombras con desenfoque.
- No aplicar el temblor al logotipo ni a la interfaz real.
- Nada de `Math.random` ni relojes: semillas fijas.
- No caricaturizar a personas reales.

## Carga de fuentes (Font loading)

Copia `estilos/dibujos-animados/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
dibujos-animados --ruta <carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Inter Tight";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/inter-tight-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter Tight";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/inter-tight-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-sans-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-sans-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/dm-sans-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/dm-sans-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"DM Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"DM Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json`: modo oscuro sobre bosque, `paneles: tinta`, sombra dura `10px 12px 0 #10231D`, borde de 7,
entrada `backOut` 0,3 s, subtítulos en caja sin palabra activa y 3D toon con contorno.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Línea:** contorno de tinta de 6–9 px en todo lo dibujado; «boil» activo salvo en la marca.
- **Ritmo:** personajes a 12 dibujos/s; golpes con onomatopeya, sacudida y sonido.
- **Paleta:** colores planos de este archivo; lima como acento de marca.
- **Legibilidad:** bocadillos con texto tinta sobre blanco; subtítulos en caja de tinta.
- **Determinismo:** semillas fijas en parpadeo, temblor y estallidos.

## Referencias

`referencias/`: 01 cartela del episodio · 02 villano con bocadillo de grito sobre rayos · 03 heroína y
logotipo sobre rayos lima · 04 guarida con panel de interfaz y holograma · 05 evaluación en tarjetas ·
06 decorado de despacho.
