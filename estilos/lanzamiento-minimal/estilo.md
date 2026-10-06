---
version: alpha
name: Lanzamiento minimal — Frame (capa de vídeo)
description: >
  Estilo de lanzamiento minimalista de kaleidos con la paleta de la web de OpenWebinars: fondo casi blanco #FAFBFC,
  titulares Inter 800 en tinta #0D1320 con una palabra en violeta #7D29E0, paneles blancos con borde fino, resplandor
  suave violeta→rosa y movimiento lento (expo.out, fundidos). Un mensaje por plano, nada de decorado. Colores sacados
  del CSS público de openwebinars.net (consulta 2026-10-02); no usa marcas ni imágenes de terceros.
unit: el fotograma — 1920×1080 a 25 fps; 1080×1920 con la misma línea de tiempo
principle: un mensaje por plano · el aire es parte del diseño · el movimiento es lento y seguro
source: https://openwebinars.net (CSS público y logo SVG) · estilos/curso-azul como plantilla de estructura

colors:
  fondo: "#FAFBFC"        # casi blanco: fondo único de todo el vídeo
  superficie: "#FFFFFF"   # paneles y tarjetas
  superficie2: "#F2F4F7"  # panel destacado / fila activa
  linea: "#E4E7EC"        # filetes y bordes en reposo
  texto: "#0D1320"        # tinta: titulares y texto principal
  textoSuave: "#667085"   # texto secundario, etiquetas
  acento: "#7D29E0"       # una palabra clave por plano, palabra activa, botones
  ok: "#067647"
  aviso: "#B54708"
  error: "#D92D20"
  rosa: "#FF01A2"         # solo en el resplandor y el degradado del logo
  violetaProfundo: "#2F125E"   # plano oscuro puntual (cierre) si se necesita
  lila: "#F2E7FC"         # relleno suave de chips y fila activa
  capitulos: ["#7D29E0", "#FF01A2", "#5E3DE6", "#9B61F6"]   # violeta, rosa, índigo, lavanda

typography:
  display:  { fontFamily: "Inter", weight: 800, tracking: "-0.04em", lineHeight: 1.02, size: "160–240px", color: "texto (una palabra en acento)" }
  headline: { fontFamily: "Inter", weight: 800, tracking: "-0.04em", lineHeight: 1.04, size: "96–140px", color: "texto" }
  eyebrow:  { fontFamily: "Inter", weight: 600, tracking: "0.18em", upper: true, size: "22–28px", color: "textoSuave" }
  body:     { fontFamily: "Inter", weight: 400, lineHeight: 1.4, size: "40–52px", color: "textoSuave" }
  label:    { fontFamily: "Inter", weight: 600, size: "36–48px", color: "texto" }
  caption:  { fontFamily: "Inter", weight: 600, size: "44px", lineHeight: 1.25 }
  mono:     { fontFamily: "JetBrains Mono", weight: 400, size: "20–26px", use: "marcas técnicas" }

radii:
  card: "28px"
  card-sm: "18px"
  pill: "999px"

spacing:
  safe: "160px laterales · 120px arriba · banda inferior de 100px para subtítulos"
  headline-gap: "32px entre antetítulo y titular"

motion:
  energy: baja
  easing: { entry: "expo.out", title: "expo.out", exit: "power2.inOut", ambient: "sine.inOut" }
  duration: { entrance: 0.9, title: 1.1, hold: 3.5, transition: 0.8 }
  atmosphere: [resplandor-que-respira]
  transition: fundido · empuje-suave

components:
  headline-block:
    description: "Antetítulo en mayúsculas (textoSuave) y titular enorme en tinta; entra por líneas con máscara, yPercent 105→0 en 1,1 s expo.out, 0,12 s de desfase; una palabra en acento"
  panel:
    backgroundColor: "{colors.superficie}"
    rounded: "{radii.card}"
    description: "Panel blanco con borde de 1 px en linea y sombra 0 24px 60px de tinta al 10 %"
  pill-button:
    backgroundColor: "{colors.acento}"
    rounded: "{radii.pill}"
    description: "Píldora violeta con texto blanco (como los botones de la web); en chips: borde de 1 px y texto en tinta"
  big-number:
    description: "Cifra o palabra gigante (240 px, 800) con contador tabular; solo cuando la voz la dice"
  compare-split:
    description: "Dos columnas sobre fondo liso separadas por un filete de linea; la columna activa en texto, la otra al 45 %"
  logo:
    description: "Logo vectorial de OpenWebinars sobre el fondo claro, sin recolorear: el aro se dibuja con trazo, la W y las letras entran por máscaras, brillo que barre una vez"
  caption-clean:
    description: "Subtítulo sin caja, centrado, Inter 600 a 44 px; palabra activa en acento"
---

# Lanzamiento minimal — Frame

## Concepto (Overview)

Un vídeo de producto que respira. Fondo casi blanco, **un mensaje por plano**, un titular enorme en Inter 800 en tinta con
una sola palabra en violeta (como el titular de la web de OpenWebinars) y mucho espacio vacío alrededor. El movimiento es lento y seguro (expo.out, fundidos):
nada rebota ni grita. Sirve para explainers narrados, anuncios de producto y piezas de marca de ritmo pausado.

## El cuadro (The Frame)

- 1920×1080. Márgenes seguros: 160 px a los lados, 120 px arriba; banda inferior de 100 px para subtítulos.
- Un elemento dominante por plano; el resto es aire. Titular centrado o alineado a la izquierda, nunca ambos en el vídeo.
- Capas: fondo + halo → titular o panel → ilustración → subtítulos.

## Colores (Colors)

`fondo` #FAFBFC es el único fondo. `acento` #7D29E0 (el violeta de los botones y titulares de la web) marca una palabra o
un elemento por plano. Paneles en `superficie` #FFFFFF y `superficie2` #F2F4F7; filetes en `linea` #E4E7EC. Texto en `texto`
#0D1320 y `textoSuave` #667085. El rosa #FF01A2 del logo solo aparece en el resplandor. Acentos de capítulo: #7D29E0,
#FF01A2, #5E3DE6, #9B61F6. Los valores salen del CSS público de openwebinars.net (consulta 2026-10-02).

## Tipografía (Typography)

**Inter** (400 · 600 · 800) y **JetBrains Mono** 400 solo para marcas técnicas. Titulares 800, −0,04em, 96–240 px;
antetítulo 600 en mayúsculas con 0,18em; cuerpo 400 a 36–48 px en `textoSuave`. Sin cursivas.

## Fondo y superficies (Depth & Surface)

Fondo liso con un **resplandor radial** violeta→rosa de 1600 px abajo en el centro al 14 % que respira (±4 % en 12 s). Paneles
blancos con borde de 1 px y sombra suave. Nada de degradados lineales a pantalla completa.

## Componentes (Components)

Titular en bloque, panel blanco, píldora, cifra gigante, comparativa a dos columnas, logo y subtítulo limpio.
Valores exactos en el frontmatter.

## El logo de OpenWebinars (animación vectorial)

- Fuente: `proyectos/<slug>/assets/logo-openwebinars.svg` (SVG oficial, 241×42): aro con degradado violeta #672FEA →
  rosa #FF01A2, una W y el logotipo en #010101.
- **No se recolorea ni se deforma.** Vive directamente sobre el fondo claro (#FAFBFC), igual que en la cabecera de la web.
  Nunca sobre un fondo oscuro, porque la W y el logotipo (#010101) desaparecerían.
- Animación (todo en el SVG, sin raster): 1) el aro se dibuja con trazo (`stroke-dashoffset`, 1,2 s expo.out) y se rellena
  con el degradado; 2) la W se dibuja y rellena; 3) las letras de «OpenWebinars» suben una a una desde su máscara (0,05 s de
  desfase); 4) un brillo (rect inclinado con mezcla `soft-light`) barre el aro una vez; 5) pulso de escala 1→1,03→1.
- Aparece en la apertura (≈ 3 s) y en el cierre (≈ 4 s) y en ningún otro plano.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Línea de titular | yPercent 105→0, desfase 0,12 s | 1,1 s | expo.out |
| Panel | opacidad 0→1, y 24→0 | 0,9 s | expo.out |
| Cifra | contador 0→valor | 1,2 s | power3.out |
| Halo | opacidad ±4 % | 12 s | sine.inOut |
| Trazo del aro del logo | stroke-dashoffset 100→0 | 1,2 s | expo.out |

Transiciones: fundido de 0,8 s por defecto; empuje suave solo entre bloques temáticos.

## Subtítulos (Captions)

Sin caja, centrados, Inter 600 a 44 px, páginas de hasta ~42 caracteres. Palabra dicha en `texto`, pendiente al 55 %, activa
en `acento`. Se ocultan durante la animación del logo.

## Audio

Voz a −16 LUFS. Un pad sintetizado muy suave en apertura y cierre (≈ −24 LUFS) y efectos mínimos (un «tick» suave al entrar
cada panel). Sin música con licencia dudosa.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Un mensaje y un solo acento por plano; mucho espacio vacío.
- Titulares enormes con una sola palabra en acento.
- Logo sobre fondo claro, animado como vector.

### No (Don't)
- Nada de rebotes, sacudidas ni degradados de pantalla completa.
- No recolorear ni deformar el logo; no mostrarlo sobre fondo oscuro.
- No más de ~12 palabras de pantalla por plano; no inventar cifras ni marcas de terceros.

## Carga de fuentes (Font loading)

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/inter-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/inter-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/inter-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/inter-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json` es este mismo estilo en datos (`docs/CONTRATO.md` §5). `proyecto.json › "estilo": "lanzamiento-minimal"`;
`npm run estilos` en `motor/` lo copia a `motor/public/estilos/`. Licencias: Inter y JetBrains Mono, OFL 1.1.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Paleta:** todos los hex están en este archivo; un solo acento por plano.
- **Tipo:** Inter 800/600/400; titulares −0,04em; antetítulo 0,18em.
- **Logo:** solo sobre fondo claro, sin recolorear; animado como SVG.
- **Movimiento:** expo.out en entradas; fundido 0,8 s; nada rebota.
- **Datos:** cada cifra sale del guion y de `fuentes.md`; sin marcas de terceros en pantalla.

## Referencias

`referencias/`: muestrarios generados con los tokens del estilo.
