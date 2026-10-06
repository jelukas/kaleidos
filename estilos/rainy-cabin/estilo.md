---
version: alpha
name: Rainy Cabin — Frame (capa de vídeo)
description: >
  Ambiente nocturno de lluvia y tormenta del canal Rainy Cabin Nights: una escena WebGL a sangre en bucle
  perfecto (interior cálido de madera con quinqué y vela frente a una ventana con gotas, tormenta azul
  al otro lado con relámpagos que iluminan la habitación) y, como mucho, un rótulo mínimo y lento en
  Cormorant Garamond con una línea en Montserrat espaciada. Negro cálido #07090C, crema #F6EAD8, ámbar de
  lámpara #CB8856 y azules de tormenta. Inmersión pura: sin narración, sin música, sin texto invasivo.
unit: el fotograma — 1920×1080 a 30 fps; bucle de 240 s repetido hasta 8 h; Shorts 1080×1920 con un relámpago
principle: la escena manda · todo lo que cambia cierra ciclos enteros en T · imagen y sonido salen del mismo guion de tormenta
source: ~/videos-opus/CLAUDE.md (canal ambiente) · videos/tormenta-cabana · videos/tormenta-nueva-york · videos/rcn-intro-card · videos/brand-fonts

colors:
  fondo: "#07090C"        # negro cálido: fondos de marca, miniaturas y fundidos
  superficie: "#14100D"   # madera en sombra (si hay que poner una placa)
  superficie2: "#23110A"  # madera oscura
  linea: "#837A6B"        # filete del rótulo: rgba(233,214,184,.55) sobre el fondo
  texto: "#F6EAD8"        # crema del nombre del canal
  textoSuave: "#B8A68C"   # crema apagada para textos secundarios
  crema-linea: "#E9D6B8"  # línea espaciada bajo el nombre
  acento: "#CB8856"       # ámbar de la lámpara
  ok: "#8FA88A"           # helecho
  aviso: "#F1CC6D"        # llama
  error: "#C8553D"        # brasa
  capitulos: ["#CB8856", "#F1CC6D", "#7393B3", "#A27167"]   # ámbar, llama, azul tormenta, madera rosada
  # paleta de la escena (palettegen del bucle de la cabaña y de Nueva York)
  madera-oscura: "#3E1E12"
  madera: "#652A16"
  madera-calida: "#89381C"
  cobre: "#AC4720"
  tormenta-profunda: "#21293B"
  tormenta: "#2F3D5A"
  tormenta-media: "#3C567D"
  tormenta-clara: "#4F6C93"
  noche-ciudad: "#161C26"
  cielo-ciudad: "#5A7798"
  sombra-rotulo: "rgba(6,8,11,0.62)"

typography:
  display:  { fontFamily: "Cormorant Garamond", weight: 600, tracking: "0.01em", lineHeight: 1.0, size: "104px (intro) · 120–180px (miniaturas)", color: "texto", shadow: "0 4px 30px rgba(0,0,0,0.55)" }
  line:     { fontFamily: "Montserrat", weight: 500, tracking: "0.34em", upper: true, size: "26px", color: "crema-linea", shadow: "0 2px 14px rgba(0,0,0,0.7)" }
  body:     { fontFamily: "Montserrat", weight: 400, lineHeight: 1.5, size: "28–34px", color: "textoSuave", use: "descripciones en miniaturas o placas; en el vídeo casi nunca" }
  mono:     { fontFamily: "Montserrat", weight: 500, fontVariant: "tabular-nums", use: "duraciones (8 HOURS) en miniaturas" }

radii:
  plate: "12px"
  pill: "999px"
  rule: "0"

spacing:
  card: "rótulo centrado en el tercio inferior: bloque de 420px con padding inferior de 120px"
  rule: "filete de 220×2px, 26px arriba y 22px abajo"
  safe: "nada de texto sobre la ventana ni sobre la lámpara"

motion:
  energy: baja
  easing: { entry: "power2.out", rule: "power3.inOut", shade: "sine.inOut", exit: "sine.in" }
  duration: { entrance: 1.8, rule: 1.4, hold: 5.0, exit: 1.8, fade-from-black: 2.0 }
  atmosphere: [lluvia-en-el-cristal, parpadeo-del-quinque, vaho-y-niebla, polvo-en-la-luz, relampagos-programados, grano]
  transition: fundido-a-negro

components:
  storm-scene:
    description: "WebGL2 en 3 pasadas: exterior (cielo, nubes, niebla, rayos detrás de lo que tapa) → cristal + interior (gotas que resbalan con ruido periódico, vaho, reflejos especulares de la lámpara, luz aditiva y fría del relámpago que desatura) → bloom, grano y tono"
  intro-card:
    description: "Tarjeta de canal los primeros 12 s: sombra elíptica radial bajo el texto, nombre en Cormorant Garamond 600 104px, filete de 220×2px, línea en Montserrat 500 26px 0.34em; entra cuando la imagen ya salió del negro y se va antes de que el espectador se duerma"
  lightning:
    description: "Relámpagos del guion storm/schedule.js (bolt = rayo visible y trueno cercano · sheet = entre nubes · far = lejano), siempre en el centro de un panel de la ventana, nunca detrás de un travesaño"
  thumbnail:
    description: "Miniatura: solo escena (patrón dominante del nicho) o escena + título en Cormorant Garamond con línea en Montserrat espaciada"
---

# Rainy Cabin — Frame

## Concepto (Overview)

**Refugio cálido mientras fuera ruge la tormenta.** Una sola escena, contemplativa y casi inmóvil, que
se deja puesta horas para dormir, estudiar o concentrarse: la lluvia resbala por el cristal, el quinqué
parpadea, el vaho se mueve y, de vez en cuando, un relámpago ilumina la habitación y el trueno llega con
su retardo. **El sonido importa tanto como la imagen.** El texto es la excepción: una tarjeta de canal
de 12 s al principio y nada más. Sirve para vídeos ambiente largos (30 min a 8 h), Shorts de un relámpago y
cualquier pieza que tenga que calmar.

## El cuadro (The Frame)

- 1920×1080 a 30 fps. La escena ocupa todo el cuadro: interior en primer plano (madera, lámpara, taza,
  libros, planta, manta), ventana de seis paneles en el centro, paisaje o ciudad en tormenta detrás.
- El texto, si lo hay, va centrado en el tercio inferior sobre una sombra elíptica, sin tapar la ventana
  ni la lámpara.
- Bucle perfecto de **240 s** renderizado una vez y montado con ffmpeg hasta la duración final.

## Colores (Colors)

- Marca: `fondo` #07090C, `texto` crema #F6EAD8, `crema-linea` #E9D6B8, filete `linea` #837A6B (el
  rgba(233,214,184,.55) aplanado), `textoSuave` #B8A68C y `acento` ámbar de lámpara #CB8856.
- Escena (medida con `palettegen` sobre los bucles): madera #3E1E12, #652A16, #89381C, cobre #AC4720,
  llama #F1CC6D; tormenta #21293B, #2F3D5A, #3C567D, #4F6C93; ciudad #161C26 y cielo #5A7798.
- Acentos por capítulo (para placas o listas de escenas): #CB8856, #F1CC6D, #7393B3, #A27167. Semánticos
  de apoyo: `ok` #8FA88A, `aviso` #F1CC6D, `error` #C8553D. Superficies de placa #14100D y #23110A.
- Regla de luz: la del relámpago en interiores es **aditiva, fría y desatura**; multiplicar la madera
  cálida la vuelve naranja.

## Tipografía (Typography)

Solo tipografías OFL (las del sistema de Apple, como New York, SF o Avenir, no tienen licencia para arte
comercial):

- **Cormorant Garamond 600** para el nombre y los títulos (104 px en la tarjeta, 0,01em, sombra suave).
- **Montserrat 500** en mayúsculas con 0,34em para la línea bajo el nombre; **Montserrat 400** para
  textos de miniatura o placa.

## Fondo y superficies (Depth & Surface)

La profundidad la da la escena: exterior lejano, cristal con gotas y vaho, interior cálido, polvo en
suspensión en la luz de la lámpara, bloom y grano finales. Para rótulos, la única «superficie» es la
sombra radial elíptica `rgba(6,8,11,0.62) → 0,36 → 0` bajo el texto. Sin paneles ni tarjetas.

## Componentes (Components)

Escena de tormenta WebGL, tarjeta de canal, relámpagos programados y miniatura. Ver frontmatter.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Entrada del vídeo | fundido desde negro | 2 s | — |
| Sombra del rótulo | opacidad 0→1 (desde 1,4 s) | 2,2 s | sine.inOut |
| Nombre | opacidad 0→1, y 16→0 (desde 1,8 s) | 1,8 s | power2.out |
| Filete | scaleX 0→1 + opacidad (desde 2,4 s) | 1,4 s | power3.inOut |
| Línea | opacidad 0→1, y 10→0 (desde 2,8 s) | 2,0 s | power2.out |
| Salida del rótulo | opacidad 1→0 escalonada 0,12 s (desde 9,0 s) | 1,8 s | sine.in |
| Lluvia, vaho, llama, polvo | ruido periódico `pnoise/pfbm` que cierra ciclos enteros en T | 240 s | — |
| Relámpago | destello según `storm/schedule.js`; trueno con su retardo (0,8–6,9 s) | ~0,5 s | — |

**Reglas del bucle** (si se rompen, se ve la costura): todo lo que cambia completa un número entero de
ciclos en T (`loopPhase(hz·uT)`, periodos `uT / round(uT / P)`, frecuencias `round(hz·T)/T` en JS); nada
de `Math.random`. Se comprueba con instantáneas sin comprimir a mitad de fotograma
(`--at 0.01,0.045,239.95,239.99`): el PSNR último→primero debe igualar al de un par normal (~39 dB).

## Transiciones (Transitions)

No hay cortes dentro del vídeo: una escena, un bucle. Solo **fundido desde negro** al empezar y **fundido
a negro** al terminar; la tarjeta de canal se superpone a los primeros 12 s.

## Subtítulos (Captions)

No lleva subtítulos (no hay voz). Si una pieza derivada necesitara texto, va limpio en Cormorant
Garamond o Montserrat crema con sombra suave, nunca en caja.

## 3D

La escena es 2,5D en shaders (placas de imagen generadas + máscaras de cielo y cristal); no hay objetos 3D.
Máscara de cielo por luminancia en paisajes y por textura en ciudades; rayos detrás de lo que tapa.

## Audio

Lluvia en el cristal y en el tejado, truenos cercanos, medios y lejanos sincronizados con el mismo guion de
tormenta que la imagen; mezcla larga **sin repeticiones audibles** a −20 LUFS con pico de −1 dBTP. Sin
música y sin voz.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Un bucle perfecto verificado por PSNR antes de montar las horas.
- Relámpagos en el centro de un panel; luz del relámpago aditiva y fría.
- Sonido y relámpagos desde `storm/schedule.js` (única fuente de verdad).
- Tipografías OFL (Cormorant Garamond + Montserrat).

### No (Don't)
- Nada de narración, música, texto invasivo ni logotipos permanentes sobre la escena.
- Nada de azar no periódico ni de ciclos que no cierren en T.
- Ni fuentes del sistema de Apple ni tipografías sin licencia.
- No publicar el mismo bucle en varias duraciones.

## Carga de fuentes (Font loading)

Copia `estilos/rainy-cabin/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs
rainy-cabin --ruta <carpeta>`). Son las mismas familias que `videos/brand-fonts/` (allí en TTF variable):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Cormorant Garamond";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/cormorant-garamond-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Cormorant Garamond";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/cormorant-garamond-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/montserrat-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/montserrat-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/montserrat-latin-ext-500-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Montserrat";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/montserrat-latin-500-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json` sirve para rótulos, miniaturas y placas generados por el motor: modo oscuro, energía baja,
entrada `power2Out` de 1,8 s y fundido. La escena en sí es un proyecto HyperFrames con WebGL.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Costura:** PSNR último→primero ≈ par normal.
- **Luz:** relámpago frío y aditivo; la madera no se vuelve naranja.
- **Texto:** solo la tarjeta de canal de 12 s; nada sobre la ventana.
- **Sonido:** truenos en su sitio y con su retardo; −20 LUFS.
- **Licencias:** solo OFL; ninguna fuente del sistema.

## Referencias

`referencias/`: 01 cabaña en calma · 02 cabaña con relámpago · 03 Nueva York con relámpago · 04 tarjeta
de canal sobre la escena · 05 hoja de contactos del bucle.
