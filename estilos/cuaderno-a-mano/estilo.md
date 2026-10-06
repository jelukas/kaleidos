---
version: alpha
name: Cuaderno a mano — Frame (capa de vídeo)
description: >
  Explainer de pizarra dibujado a mano: un rotulador escribe y dibuja cada idea sobre papel marfil
  #F7F8F2 mientras el narrador la cuenta. Tinta #10231D, un segundo rotulador bosque #173F32 y un
  subrayador fosforito lima #D6F469 detrás de las palabras clave. Un único lienzo grande de viñetas
  unidas por flechas dibujadas que la cámara recorre, y un plano general final que enseña el recorrido
  completo. Letra de trazo único trazada por el rotulador (alfabeto propio en código) o Patrick Hand
  cuando hace falta una fuente.
unit: el fotograma — 1920×1080 (web, YouTube, LinkedIn); el lienzo mide ~8 480 × 2 520 px de mundo
principle: todo se dibuja delante del espectador · la cámara cuenta el orden · el subrayador marca lo importante
source: ~/videos-opus/videos/ensaya-promo-v7-a-mano (BRIEF.md, engine/board.js, engine/hand.js, assets/paper-grain.png, render)

colors:
  fondo: "#F7F8F2"        # papel marfil
  superficie: "#FFFFFF"   # hoja o tarjeta pegada sobre el papel
  superficie2: "#D6F469"  # subrayador fosforito: relleno detrás de la palabra, NUNCA color de texto
  linea: "#D3D9CF"        # puntos de la retícula (r 2,2 px cada 48 px) y filetes suaves
  texto: "#10231D"        # tinta del rotulador principal
  textoSuave: "#50614B"   # musgo: rótulos pequeños y notas al margen
  acento: "#173F32"       # rotulador bosque: cifras, números en círculo, flechas de énfasis
  ok: "#2E7D4F"
  aviso: "#9A6A12"
  error: "#B23A2A"
  capitulos: ["#173F32", "#1F5A8C", "#A23B2A", "#6B4E9B"]   # rotuladores bosque, azul, rojo corrección y morado
  sombra-rotulador: "rgba(16,35,29,0.18)"   # sombra del rotulador sobre el papel
  rotulador-punta: "#0B1612"   # punta del rotulador dibujado

typography:
  hand:     { fontFamily: "Mano (trazo único en código)", strokeWidth: "max(3.4px, 13 % del tamaño)", color: "texto", note: "engine/hand.js: cada glifo es una lista de trazos en el orden de la mano; el rotulador los recorre" }
  display:  { fontFamily: "Patrick Hand", weight: 400, tracking: "0em", lineHeight: 1.1, size: "90–220px", color: "texto", note: "sustituto con fuente cuando no se traza (motor Remotion, rótulos estáticos)" }
  body:     { fontFamily: "Patrick Hand", weight: 400, lineHeight: 1.3, size: "40–64px", color: "texto" }
  note:     { fontFamily: "Patrick Hand", weight: 400, size: "28–36px", color: "textoSuave" }
  eyebrow:  { fontFamily: "DM Sans", weight: 700, tracking: "0.18em", upper: true, size: "20–24px", color: "textoSuave", use: "solo créditos y chrome del cierre" }
  mono:     { fontFamily: "DM Mono", weight: 400, size: "22–28px", use: "URL, cronómetros" }

radii:
  box: "24px"           # recuadros dibujados (rrect a mano, radio 24)
  bubble: "34px"        # bocadillos con cola en una esquina
  pill: "999px"
  highlighter: "extremos redondeados (stroke-linecap: round)"

spacing:
  tile: "cada viñeta es un cuadro de 1920×1080 del lienzo; rejilla de 4 × 2 viñetas separadas 180px"
  safe: "90px de margen dentro de cada viñeta"
  stroke: "tinta de 6–8px (5,5–9) · subrayador de 0,6 × el cuerpo de letra al 92 %"

motion:
  energy: media
  easing: { pen: "0.55·t + 0.45·(1−cos πt)/2 (penEase)", highlighter: "cubic.out", camera: "cubic.inOut", fill: "smoothstep" }
  duration: { stroke: "según longitud: ~2300–3000 px/s", highlighter: 0.42, camera-move: 1.15, zoom-out: 1.5, zoom-in: 1.45 }
  atmosphere: [reticula-de-puntos, grano-de-papel, deriva-lenta-de-camara, sombra-del-rotulador]
  transition: paneo-de-camara-por-el-lienzo

components:
  pen:
    description: "Rotulador dibujado en SVG (cuerpo tinta, capuchón lima, reflejo blanco al 16 %) que sigue la punta del trazo activo; se levanta entre trazos y proyecta sombra al 18 %"
  ink-stroke:
    description: "Trazo de tinta de 6px con extremos redondeados que se revela con stroke-dasharray siguiendo el orden de dibujo"
  hand-text:
    description: "Texto escrito letra a letra con el alfabeto de trazo único; cada trazo arranca cuando termina el anterior o en su señal de la voz"
  highlighter:
    backgroundColor: "{colors.superficie2}"
    description: "Pasada de fosforito detrás de una palabra (0,42 s, cubic.out), un poco torcida, al 92 %"
  drawn-box:
    rounded: "{radii.box}"
    description: "Recuadro a mano alzada que se pasa un poco al cerrar; puede rellenarse de lima al elegirse"
  bubble:
    description: "Bocadillo redondeado con cola en una esquina inferior; nube de pensamiento con burbujas"
  arrow:
    description: "Flecha curva a mano que une una viñeta con la siguiente y guía a la cámara"
  circled-number:
    description: "Número dentro de un círculo a mano (①②③) delante del titular de la viñeta"
  doodles:
    description: "Iconos de trazo: calendario, cabeza de perfil, micrófono, portapapeles, móvil, portátil, gráfica de barras, bucle"
---

# Cuaderno a mano — Frame

## Concepto (Overview)

**El cuaderno.** Un explainer dibujado a mano sobre papel: un rotulador escribe y dibuja cada idea
mientras la voz la cuenta, y la cámara recorre un único lienzo grande de viñeta en viñeta, unidas por
flechas dibujadas. Al final se aleja para enseñar el recorrido completo y entra en el cierre. Todo se
construye delante del espectador; el fosforito lima marca lo importante. Cercano, claro y artesano.
Sirve para explicar un producto, un proceso o una idea en 45–90 s, onboarding, clases cortas y promos
«hechas a mano».

## El cuadro (The Frame)

- 1920×1080. El lienzo es una rejilla de viñetas de 1920×1080 (4 × 2 en el original) y la cámara se
  coloca en cada una; el plano general final lo enseña entero a escala ≈ 0,23.
- Cada viñeta: un titular a mano (con número en círculo si es un paso) + un dibujo principal + dos o tres
  notas. Margen de 90 px dentro de la viñeta.
- Capas: papel + retícula → subrayador (debajo) → tinta → tipografía de marca (solo cierre) → rotulador.

## Colores (Colors)

Papel `fondo` #F7F8F2 con retícula de puntos en `linea` #D3D9CF (r 2,2 px cada 48 px) y grano de papel
en multiplicar al 60 %. Tinta `texto` #10231D para casi todo; `acento` #173F32 como segundo rotulador (cifras, números en
círculo, flechas de énfasis); `textoSuave` #50614B para notas al margen. El **subrayador** #D6F469 va en
`superficie2`: solo relleno detrás de palabras o dentro de un recuadro elegido, **nunca color de texto**
(1,2:1 sobre el papel). Tarjetas pegadas en `superficie` #FFFFFF. Rotuladores por capítulo: #173F32,
#1F5A8C, #A23B2A y #6B4E9B (el original solo usó tinta y bosque). Semánticos `ok` #2E7D4F, `aviso`
#9A6A12, `error` #B23A2A.

## Tipografía (Typography)

- **Letra de trazo único** («Mano», `engine/hand.js`): cada glifo es una lista de trazos en el orden en
  que los haría una mano (altura de x 100, mayúsculas 150), con tildes, ñ, ¿ y ¡. Grosor de trazo
  máx(3,4 px, 13 % del cuerpo). Es la opción buena en HyperFrames porque el rotulador puede trazarla.
- **Patrick Hand** 400 cuando hace falta una fuente (motor Remotion, rótulos que aparecen enteros).
  Interlineado 1,1 en titulares y 1,3 en cuerpo; tracking 0.
- **DM Sans** 700 en mayúsculas y **DM Mono** solo en el chrome del cierre (URL, créditos). El
  logotipo de una marca, en su propia tipografía, solo en el cierre.

## Fondo y superficies (Depth & Surface)

Plano, de papel: nada de sombras salvo la del rotulador (18 %, se aclara al levantarlo). La retícula
se atenúa al alejar la cámara (opacidad 0,25 + 0,75 · escala). Recuadros, bocadillos y tarjetas son
trazos de tinta, no cajas con relleno; el relleno lima aparece solo al «elegir» algo.

## Componentes (Components)

Rotulador, trazo de tinta, texto a mano, subrayador, recuadro dibujado, bocadillo y nube, flecha de
viñeta a viñeta, número en círculo y garabatos de icono. Todo es determinista: el azar sale de un PRNG
con semilla (`rng(20260927)`), nunca de `Math.random`.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Trazo de tinta | stroke-dashoffset de la longitud a 0 | longitud / 2300 px/s (texto 3000) + saltos de 0,07 s | penEase = 0,55·t + 0,45·(1 − cos πt)/2 |
| Subrayador | pasada de izquierda a derecha | 0,42 s (0,5 en URL) | cubic.out |
| Relleno de recuadro | opacidad 0→1 | 0,35 s | smoothstep |
| Cámara entre viñetas | paneo con caída de escala del 10 % a mitad de camino | 1,15 s | cubic.inOut |
| Deriva en la viñeta | +26 px, +8 px, escala 1→1,03 mientras se dibuja | 9 s | lineal |
| Plano general | zoom anclado (escala logarítmica, punto ancla en línea recta) | 1,5 s ida · 1,45 s vuelta | cubic.inOut |
| Rotulador | sigue la punta; se levanta y vuelve a su sitio entre trazos | — | — |

Cada elemento arranca en su palabra de la voz (tiempos por palabra de la locución) o al terminar el
anterior si va tarde: el dibujo nunca se adelanta a lo que se dice.

## Transiciones (Transitions)

No hay cortes: la **cámara viaja por el lienzo** de una viñeta a la siguiente siguiendo la flecha
dibujada. El cierre llega tras un plano general del lienzo completo y un zoom anclado a la viñeta final.

## Subtítulos (Captions)

El texto dibujado ya refuerza la voz; si se añaden subtítulos, van **limpios** en Patrick Hand a 44 px
en tinta, abajo y centrados sobre el papel, con la palabra activa **subrayada** en lima (bloque
`superficie2` detrás, texto en tinta). Máximo 40 caracteres por página.

## 3D

No hay 3D en el original. Si se usa, material toon de 2 tonos con contorno de tinta (casco invertido),
colores de la paleta y sin sombras proyectadas: debe parecer dibujado.

## Audio

Todo local (skill `audio-local`): locución de anuncio con emoción (frases cortas, pausas), música pop
electrónica suave a 118 bpm muy baja (0,24) con carve bajo la voz y efectos de rotulador sobre papel,
pasar página y «pop» al subrayar.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Dibujar todo en pantalla y en el orden de la voz; la cámara enseña el orden.
- Una pasada de subrayador por viñeta, sobre la palabra clave.
- Unir las viñetas con flechas y terminar con el plano general del recorrido.
- Trazos con el mismo grosor y extremos redondeados; imperfección controlada (semilla fija).

### No (Don't)
- Ni fuentes manuscritas con licencia dudosa ni fuentes del sistema: letra propia o Patrick Hand (OFL).
- Nada de lima como color de texto; nada de degradados, sombras de tarjeta ni iconos a color.
- No enseñar el texto entero de golpe si puede trazarse.
- No usar azar no determinista (`Math.random`, relojes): el render hace *seek*.

## Carga de fuentes (Font loading)

Copia `estilos/cuaderno-a-mano/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
cuaderno-a-mano --ruta <carpeta>`). La letra trazada no necesita fuente: es `engine/hand.js` del proyecto
original.

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Patrick Hand";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/patrick-hand-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Patrick Hand";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/patrick-hand-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/dm-sans-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/dm-sans-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"DM Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"DM Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/dm-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json`: modo claro, `paneles: papel`, `fondo: papel`, `subtitulos: limpio` con
`palabraActiva: "subrayado"` (el motor pinta `superficie2` detrás de la palabra) y 3D toon con contorno.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Tinta:** trazos de 6–8 px, extremos redondeados, todos del mismo rotulador salvo énfasis en bosque.
- **Subrayador:** lima solo como relleno; una pasada por viñeta.
- **Orden:** ningún dibujo aparece antes de que la voz lo nombre.
- **Cámara:** paneo de 1,15 s entre viñetas; plano general antes del cierre.
- **Determinismo:** semilla fija; mismo fotograma, mismo dibujo.

## Referencias

`referencias/`: 01 gancho con subrayador y calendario · 02 viñeta de escenarios con recuadros dibujados ·
03 nota 70/100 subrayada y lista con iconos · 04 bucle «prueba, equivócate, vuelve» · 05 plano general del
lienzo completo.
