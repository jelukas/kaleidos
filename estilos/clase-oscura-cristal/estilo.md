---
version: alpha
name: Clase oscura cristal — Frame (capa de vídeo)
description: >
  Estilo para clases largas con ponente (de 15 min a más de 1 h): moderno y oscuro #0A0B14, paneles de
  cristal, un acento por capítulo (violeta #9B7BFF, cian #22D3EE, dorado #F5B84A, rojo #FF5C6C), Space
  Grotesk en titulares e Inter en el texto. Ponente recortado sobre un fondo nuevo con cámara virtual,
  texto detrás del ponente en los rótulos de capítulo, subtítulos palabra a palabra con la palabra activa
  en el color del capítulo, barra de progreso por capítulos y 3D toon con contorno de tinta.
unit: el fotograma — 1920×1080 a 25 fps (fuente 4K reencuadrada); 1080×1920 previsto con la misma línea de tiempo
principle: los gráficos resumen lo que dice la voz · nunca dos eventos a la vez · el color dice en qué capítulo estás
source: docs/METODO_EDICION_IA.md §5–§9 y §7.6 (vídeo B, clase de 31 min)

colors:
  fondo: "#0A0B14"        # negro azulado: fondo nuevo detrás del ponente recortado
  superficie: "#161827"   # cristal: equivalente opaco del panel (rgba(22,24,39,.72) + brillo)
  superficie2: "#1F2236"  # cristal destacado / fila activa
  linea: "#2E3250"        # filetes, pistas de la barra de progreso, bordes en reposo
  texto: "#F5F6FC"
  textoSuave: "#A7ADC8"
  acento: "#9B7BFF"       # violeta: acento base (capítulo 0, intro y cierre)
  ok: "#34D399"
  aviso: "#FBBF24"
  error: "#F87171"
  capitulos: ["#9B7BFF", "#22D3EE", "#F5B84A", "#FF5C6C"]   # violeta, cian, dorado, rojo
  cristal-relleno: "rgba(245,246,252,0.06)"   # relleno del panel sobre superficie al 72 %
  cristal-borde: "rgba(245,246,252,0.14)"
  cristal-brillo: "rgba(245,246,252,0.22)"    # filete interior superior

typography:
  display:  { fontFamily: "Space Grotesk", weight: 700, tracking: "-0.02em", lineHeight: 1.05, size: "96–128px", color: "texto" }
  numeral:  { fontFamily: "Space Grotesk", weight: 700, tracking: "-0.04em", size: "300–420px", treatment: "contorno de 3px en el color del capítulo (número de capítulo) o relleno en cifras" }
  headline: { fontFamily: "Space Grotesk", weight: 700, tracking: "-0.02em", lineHeight: 1.05, size: "56–72px" }
  eyebrow:  { fontFamily: "Space Grotesk", weight: 500, tracking: "0.18em", upper: true, size: "20–26px", color: "color del capítulo" }
  body:     { fontFamily: "Inter", weight: 400, lineHeight: 1.45, size: "28–36px", color: "textoSuave" }
  item:     { fontFamily: "Inter", weight: 600, size: "30–34px", color: "texto" }
  caption:  { fontFamily: "Inter", weight: 600, size: "44px", lineHeight: 1.25 }
  mono:     { fontFamily: "JetBrains Mono", weight: 400, size: "18–22px", use: "reloj de la clase, artículos de norma, código" }

radii:
  panel: "28px"
  item: "16px"
  caption: "22px"
  chip: "999px"
  bar: "3px"

spacing:
  safe: "72px laterales · 52px arriba (chip de capítulo) · 40px abajo (barra de progreso)"
  panel: "padding 44×50px; ancho 820–900px en el lado contrario al ponente"
  density: "≈ 1 gráfico cada 40 s; paneles de 10–50 s; ítems que entran con su frase"

motion:
  energy: media
  easing: { entry: "power3.out", exit: "power2.out", camera: "power3.inOut", ambient: "sine.inOut" }
  duration: { entrance: 0.6, exit: 0.4, hold: "lo que dure la explicación", camera-side: "16 fotogramas", transition: 0.6 }
  atmosphere: [halos-del-capitulo, grano-fino, acercamiento-lento-1-4%]
  transition: fundido-con-cambio-de-plano

components:
  glass-panel:
    backgroundColor: "{colors.superficie}"
    rounded: "{radii.panel}"
    description: "Cristal SIN backdrop-filter (es lo que hunde el render): degradado vertical rgba(texto, .10→.035) sobre superficie al 72 %, borde de 2px al 14 %, filete interior superior al 22 % y sombra 0 24px 70px rgba(0,0,0,.5)"
  chapter-card:
    description: "Rótulo de capítulo (85 fotogramas) con encuadre «card»: ponente desplazado a la derecha, número gigante con contorno del color del capítulo, antetítulo «CAPÍTULO 0N · TEMA», titular y barra de acento a la izquierda; el texto puede ir detrás del ponente"
  pop-phrase:
    description: "Frase clave grande con encuadre «popL»: una línea en Space Grotesk 700 y su remate en el color del capítulo"
  panel-kinds:
    description: "lista · pasos · checklist · comparativa (ok/bad) · opciones con sello de veredicto · cifra con contador · cita/clave con palabras subrayadas · línea de tiempo · mapa · tarjeta · caso con veredicto"
  step-badge:
    description: "Cuadrado de 52px radio 16 con el número: color del capítulo al 16 % con borde al 50 % (pendiente) o lleno con texto fondo (activo)"
  chapter-chip:
    description: "Píldora de cristal arriba a la izquierda con «0N · TEMA» en el color del capítulo + reloj en mono"
  progress-bar:
    description: "Barra de progreso segmentada por capítulos (6px, radio 3): capítulos vistos en su color, el actual rellenándose, los futuros en linea"
  caption-box:
    backgroundColor: "rgba(22,24,39,0.86)"
    rounded: "{radii.caption}"
    description: "Subtítulo palabra a palabra: palabra activa en el color del capítulo, pendientes al 55 %"
  speaker-matte:
    description: "Ponente recortado (máscara RVM + plancha premultiplicada) entre las capas de detrás (fondo, texto, 3D) y las de delante (paneles, subtítulos)"
---

# Clase oscura cristal — Frame

## Concepto (Overview)

La **clase larga moderna**: un ponente grabado en plano fijo sobre fondo liso, recortado y colocado sobre un
fondo oscuro nuevo, con una cámara virtual que reencuadra y gráficos de cristal que resumen lo que dice. El
color cambia con el capítulo (violeta, cian, dorado, rojo) para que el espectador sepa dónde está en una
hora de contenido. Sobrio, tecnológico y muy legible. Sirve para clases de 15 min a más de 1 h, formación
técnica o legal, conferencias grabadas y webinars editados.

## El cuadro (The Frame)

- 1920×1080 a 25 fps desde una fuente 4K (reencuadres hasta 2× sin perder nitidez).
- Capas (de atrás adelante): fondo + halos → texto detrás del ponente → 3D detrás → **ponente recortado** →
  3D delante → paneles de cristal → subtítulos → chip de capítulo y barra de progreso.
- **Planos de la cámara virtual** (escala `s` sobre el 4K y posición de la nariz):

  | Plano | s | tx | ty | Uso |
  |---|---|---|---|---|
  | wide | 0,52 | 960 | 250 | respiro |
  | medium | 0,76 | 960 | 372 | por defecto |
  | close | 0,90 | 960 | 430 | énfasis |
  | sideL / sideR | 0,68 | 560 / 1360 | 345 | panel en el lado contrario |
  | popL | 0,74 | 640 | 368 | frase clave grande |
  | card | 0,54 | 1440 | 262 | rótulo de capítulo e intro |

- Panel a la derecha → ponente a la izquierda (`sideL`) y viceversa. Ciclo del resto:
  `medium, close, medium, wide, close, medium, close`, cambiando en finales de frase cada 4–11 s; cada corte
  de silencio coincide con un cambio de plano. El borde inferior del cuadro original nunca se ve.

## Colores (Colors)

`fondo` #0A0B14 con halos radiales del color del capítulo al 15–25 %. Acentos por capítulo (`capitulos`,
índice = `capitulo.acento`): **violeta #9B7BFF, cian #22D3EE, dorado #F5B84A, rojo #FF5C6C**; el violeta es
también el `acento` base (intro, cierre). Cristal sobre `superficie` #161827 y `superficie2` #1F2236,
filetes en `linea` #2E3250. Texto `texto` #F5F6FC y `textoSuave` #A7ADC8. Semánticos para tonos de panel:
`ok` #34D399, `aviso` #FBBF24, `error` #F87171. **Un solo color de capítulo por plano.** Sin degradados
lineales a pantalla completa (bandas en H.264).

Contraste: texto/fondo 18,2 · textoSuave/superficie 7,9 · violeta/fondo 6,2 · cian 10,9 · dorado 11,1 · rojo 6,5.

## Tipografía (Typography)

**Space Grotesk** 700 para titulares y números (−0,02em; −0,04em en los números gigantes), 500 en
mayúsculas con 0,18em para antetítulos y chips. **Inter** 400 para el texto (interlineado 1,45) y 600 para
ítems y subtítulos. **JetBrains Mono** para el reloj de la clase, artículos de una norma o código.

## Fondo y superficies (Depth & Surface)

- **Cristal sin `backdrop-filter`** ni `blur()` grandes: en el render de Remotion son lo que baja de ~7 a
  ~2,5 fps. El efecto se consigue con degradado vertical de blanco al 10→3,5 % sobre `superficie` al 72 %,
  borde de 2 px al 14 %, filete interior superior al 22 % y sombra `0 24px 70px rgba(0,0,0,0.5)`.
- Halos del capítulo como degradados radiales (no desenfoques). Grano fino encima de todo.
- Radios: 28 px en paneles, 16 px en ítems, 22 px en subtítulos, píldoras de 999 px.

## Componentes (Components)

Panel de cristal (lista, pasos, checklist, comparativa, opciones con veredicto, cifra, cita/clave, línea de
tiempo, mapa, tarjeta, caso), rótulo de capítulo, frase clave, insignia de paso, chip de capítulo, barra
de progreso, caja de subtítulos y ponente recortado. Detalle en el frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Panel | opacidad 0→1, y 24→0, escala 0,98→1 | 0,6 s | power3.out |
| Ítem de panel | entra con su frase (opacidad + x 20→0) | 0,4 s | power3.out |
| Salida de panel | opacidad 1→0, y 0→−12 | 0,4 s | power2.out |
| Número de capítulo | trazo del contorno + opacidad | 0,8 s | power3.out |
| Titular de capítulo | yPercent 100→0 por líneas | 0,7 s | expo.out |
| Cambio a plano lateral | transición suave de la cámara | 16 fotogramas | power3.inOut |
| Resto de cambios de plano | corte seco | — | — |
| Acercamiento dentro del plano | escala 1 → 1,01–1,04 | todo el plano | lineal |
| Halos | respiran ±4 % | continuo | sine.inOut |

Reglas de línea de tiempo: nunca dos eventos a la vez (≥ 6 fotogramas entre ellos); ningún panel dentro
de un rótulo de capítulo (se retrasa al final del rótulo); planos de al menos 1,2 s.

## Transiciones (Transitions)

Cortes con cambio de plano en el cuerpo de la clase (disimulan los jump cuts). Entre capítulos, **fundido
corto** al rótulo con encuadre `card` y cambio del color de capítulo en halos, chip y barra de progreso.

## Subtítulos (Captions)

Palabra a palabra, en caja de cristal oscuro (`rgba(22,24,39,0.86)`, radio 22), Inter 600 a 44 px, páginas
de 34 caracteres como máximo cortadas en pausas de más de 0,5 s o en punto final. **La palabra activa va
en el color del capítulo**; las pendientes al 55 %. Se ocultan durante los rótulos de capítulo.

## 3D

`MeshToonMaterial` con rampa de 3 tonos y **contorno de tinta propio** (casco invertido: geometría inflada
por la normal y pintada por detrás), colores de la paleta y del capítulo. Texto sobre objetos con
`CanvasTexture` (sin `drei Text`, que descarga fuentes); todo el 3D declarado en JSX (el `Outlines` de drei
no se pinta en el render). Objetos anclados a las manos del ponente en gestos amplios (orbe, estrellas UE,
pirámide de riesgo), congelando el punto de partida en el pico del gesto.

## Audio

La voz original es la columna vertebral (cortes con fundido de 2–3 fotogramas). Sin música salvo que haya
una con licencia; efectos sintetizados suaves (barrido de ruido rosa en los rótulos, pop al entrar un
panel, tic-tac en esperas).

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Resumir lo que dice la voz; los ítems entran con su frase.
- Un color de capítulo por plano, el mismo en halos, chip, barra, antetítulo y palabra activa.
- Panel en el lado contrario al ponente; texto detrás del ponente solo en encuadre `card`.
- Degradados en vez de desenfoques; comprobar solapes antes del render.

### No (Don't)
- Nada de `backdrop-filter` ni `blur()` grandes en paneles.
- No inventar datos, opciones ni decisiones que el guion no da; nada de nombres reales ni datos personales.
- Nunca dos gráficos a la vez ni un panel encima de un rótulo de capítulo.
- No mezclar colores de capítulo en el mismo plano.

## Carga de fuentes (Font loading)

Copia `estilos/clase-oscura-cristal/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
clase-oscura-cristal --ruta <carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/space-grotesk-latin-ext-500-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/space-grotesk-latin-500-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/space-grotesk-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/space-grotesk-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/inter-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/inter-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

Es el estilo pensado para el método «clase-larga» del motor: `paneles: cristal`, `subtitulos: caja` con
`palabraActiva: "capitulo"`, `movimiento: power3Out 0,6 s` con `transicion: fundido`, 3D toon con contorno
y `ponente: redondeado` cuando no hay recorte. En `guion.json`, `capitulos[].acento` elige el color (0–3).

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Capítulo:** un solo color por plano y coherente en todos los elementos.
- **Cristal:** sin `backdrop-filter`; paneles legibles (texto ≥ 4,5:1 sobre `superficie`).
- **Tiempo:** sin solapes de eventos; ningún panel dentro de un rótulo; planos ≥ 1,2 s.
- **Encuadre:** el panel nunca tapa la cara del ponente; el borde inferior de la fuente no se ve.
- **Contenido:** cada gráfico resume la voz; nada inventado.

## Referencias

Sin renders en el catálogo: `referencias/` son muestrarios generados con estos tokens (el ponente es una
silueta abstracta de relleno). 00 muestrario de tokens · 01 rótulo de capítulo con encuadre «card» ·
02 panel de cristal con subtítulo en el color del capítulo · 03 los cuatro acentos de capítulo.
