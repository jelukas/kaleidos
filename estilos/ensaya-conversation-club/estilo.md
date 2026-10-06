---
version: alpha
name: Ensaya · Conversation Club — Frame (capa de vídeo)
description: >
  Sistema de marca de Ensaya (by OpenWebinars) a escala de fotograma, tomado del CSS del propio producto.
  Dos registros que se alternan: marfil #F7F8F2 (tipografía cinética gigante, retícula de puntos, UI
  flotante) y tinta #10231D / bosque #173F32 (la conversación). Un único acento lima #D6F469 que se
  comporta como un rotulador. Inter Tight 800 con tracking muy cerrado para lo que habla alto y DM Sans
  para etiquetas y cuerpo. Tarjetas suaves de 32 px y píldoras. Recoge las cinco variantes de la promo:
  original, tiempo real, divertida, corporativa y persona.
unit: el fotograma — 1080×1080 principal (feed de LinkedIn y X); 1920×1080 y 1080×1920 con la misma grafía
principle: los átomos son sagrados · la composición es libre · los números salen del producto
source: ~/videos-opus/videos/ensaya-promo*/frame.md, BRIEF.md, STORYBOARD.md · entregas en videos/entregas-ensaya/

colors:
  fondo: "#10231D"        # tinta: fondo del registro oscuro (y de toda la variante corporativa)
  superficie: "#173F32"   # bosque: tarjeta de práctica, bandas, paneles
  superficie2: "#192B25"  # panel corporativo: rgba(247,248,242,.04) sobre tinta
  linea: "#35453F"        # filetes en oscuro: rgba(247,248,242,.16) sobre tinta
  texto: "#F7F8F2"        # marfil: texto sobre tinta/bosque y fondo del registro claro
  textoSuave: "#B6C6BB"   # salvia: secundario sobre oscuro
  acento: "#D6F469"       # lima: el ÚNICO acento (marca de rotulador, CTA en oscuro, onda, ticks)
  ok: "#8EE0A1"
  aviso: "#F2D16B"
  error: "#FF8A73"
  capitulos: ["#D6F469", "#D6F469", "#D6F469", "#D6F469"]   # un solo acento, nunca un segundo color
  # registro claro (marfil)
  tinta: "#10231D"        # titulares y cuerpo sobre marfil
  lima-suave: "#E6F5B7"   # tinte del acento (tarjetas, chips)
  menta: "#E6F6CC"        # superficie suave
  linea-clara: "#D3D9CF"  # filetes y bordes de tarjeta sobre marfil
  apagado: "#526158"      # secundario sobre marfil
  musgo: "#50614B"        # antetítulo sobre marfil
  tarjeta: "#FFFFFF"      # tarjetas blancas sobre marfil
  # solo dentro del logotipo de OpenWebinars
  openwebinars-violeta: "#672FEA"
  openwebinars-magenta: "#FF01A2"

typography:
  display:  { fontFamily: "Inter Tight", weight: 800, tracking: "-0.055em", lineHeight: 0.92, size: "130–230px", color: "tinta (claro) / marfil (oscuro)" }
  headline: { fontFamily: "Inter Tight", weight: 800, tracking: "-0.04em", lineHeight: 1.0, size: "90–190px" }
  numeral:  { fontFamily: "Inter Tight", weight: 800, tracking: "-0.05em", lineHeight: 1.0, size: "hasta 360px" }
  eyebrow:  { fontFamily: "DM Sans", weight: 700, tracking: "0.18em", upper: true, size: "20–24px", color: "musgo (claro) / lima (oscuro)" }
  body:     { fontFamily: "DM Sans", weight: 400, lineHeight: 1.4, size: "30–38px", color: "apagado (claro) / salvia (oscuro)" }
  label:    { fontFamily: "DM Sans", weight: 700, size: "22–28px" }
  mono:     { fontFamily: "DM Mono", weight: 400, size: "22–28px", use: "cronómetros 02:34 / 05:00 y marcas de tiempo" }
  corporate-headline: { fontFamily: "DM Sans", weight: 400, tracking: "-0.02em", lineHeight: 1.05, size: "64–92px", note: "solo en la variante corporativa" }

radii:
  pill: "999px"
  card: "32px"        # 1rem en la web → 2rem a escala de vídeo
  card-sm: "20px"
  arch: "semicírculo arriba + esquinas inferiores de 28px (retratos de personaje)"

spacing:
  safe: "72px de margen; el texto clave dentro de 84px"
  dot-grid: "puntos de tinta al 16 % cada 44px (solo sobre marfil)"
  shadow: "0 30px 60px rgba(16,35,29,0.16) solo para chips de UI flotantes"

motion:
  energy: alta
  easing: { entry: "expo.out", pop: "back.out(1.6)", exit: "power2.in", camera: "none" }
  duration: { entrance: 0.5, hold: 1.0, transition: 0.4 }
  atmosphere: [reticula-de-puntos, push-in-continuo-1-a-1.05, marca-lima-que-barre]
  transition: push-slide-izquierda · blur-crossfade · corte-en-la-rejilla-musical

components:
  brand-lockup:
    description: "Logotipo «ensaya» Inter Tight 800 −0.05em + icono de dos bocadillos (lleno + contorno) y «CONVERSATION CLUB» DM Sans 700 0.32em debajo"
  highlight-mark:
    backgroundColor: "{colors.acento}"
    description: "Bloque lima detrás de la frase clave (la marca del h1 de la web); barre de izquierda a derecha"
  practice-card:
    backgroundColor: "{colors.superficie}"
    description: "Superficie de roleplay por voz: píldora lima «ROLEPLAY POR VOZ», cronómetro 02:34 / 05:00, retrato redondo con anillo lima, cita, onda y píldora de micro + «Finalizar práctica»"
  waveform:
    description: "Barras verticales redondeadas, lima sobre bosque / tinta sobre lima; el motivo del producto"
  score-card:
    description: "Bloque tinta/bosque con «70» Inter Tight 800 + «/100» y chip lima «Objetivo parcialmente logrado»; cuatro criterios con medidores de 5 puntos"
  scenario-card:
    description: "Tarjeta de 32px con número grande 01/02/03, antetítulo de categoría y titular; variantes lima / bosque / menta"
  stepper:
    description: "01 Prepárate · 02 Conversa · 03 Evalúate con el paso activo en tinta"
  cta-pill:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.texto}"
    description: "Píldora con flecha ↗ («Practica gratis», «Pruébalo gratis con invitación»); en oscuro, lima con texto tinta"
  openwebinars-logo:
    description: "SVG oficial (~/videos-opus/videos/_probe-ensaya/brand/), nunca recoloreado salvo la variante tinta/marfil del texto; mínimo 64px de alto en 1080; aparece con «by» en el cierre"
---

# Ensaya · Conversation Club — Frame

## Concepto (Overview)

Ensaya enseña que **las conversaciones se entrenan**. El aspecto es el del propio producto: una página
marfil, tipografía de tinta muy pesada y apretada, **un solo acento lima que actúa de rotulador** y
superficies bosque profundas donde ocurre la práctica por voz. Seguro y cálido, nunca frío ni corporativo
de catálogo (salvo en la variante corporativa, que es deliberadamente sobria). Sirve para promos de
producto, demos, anuncios en LinkedIn/X y cualquier pieza de la marca Ensaya.

## El cuadro (The Frame)

- 1080×1080 (1:1) para feed. Margen seguro de 72 px; el texto clave dentro de 84 px. En 16:9 y 9:16 la
  grafía es la misma y cambia solo la composición.
- Cada plano tiene un elemento dominante: un titular de tinta gigante, una superficie de producto en
  bosque o una cifra.
- Los fondos se alternan por actos: **marfil** (gancho cinético, beneficios, cierre) y **tinta/bosque**
  (la conversación). Un fondo lima a sangre se permite una vez, como golpe (el «drop»).

## Colores (Colors)

Lima #D6F469 es el único acento: marca de rotulador, onda de voz, ticks, el punto del cronómetro y el CTA
sobre oscuro. **Nunca un segundo acento.** Tinta sobre marfil y marfil sobre tinta/bosque para todo el texto.

- **Registro oscuro** (el de `tokens.json`): `fondo` tinta #10231D, `superficie` bosque #173F32,
  `superficie2` #192B25, `linea` #35453F, `texto` marfil #F7F8F2, `textoSuave` salvia #B6C6BB,
  `acento` lima #D6F469 (legible como texto: 13,3:1).
- **Registro claro** (marfil): fondo #F7F8F2, texto tinta #10231D, secundario apagado #526158 (6,1:1),
  antetítulo musgo #50614B, tarjetas blancas #FFFFFF con borde #D3D9CF, tintes lima-suave #E6F5B7 y
  menta #E6F6CC. Aquí la lima **nunca es color de texto** (1,2:1 sobre marfil): va como relleno detrás
  de la palabra (marca) o como fondo de tarjeta con texto tinta encima (13,3:1).
- Semánticos para paneles con tono: `ok` #8EE0A1, `aviso` #F2D16B, `error` #FF8A73.
- El degradado violeta #672FEA → magenta #FF01A2 de OpenWebinars existe **solo dentro de su logotipo**.

## Tipografía (Typography)

**Inter Tight 800** para todo lo que habla alto (titulares de 90–190 px, cifras de hasta 360 px), siempre
con tracking de −0,04 a −0,065em. **DM Sans** para antetítulos (mayúsculas, 0,18em), etiquetas y cuerpo;
**DM Mono** para cronómetros y marcas de tiempo. Sin cursivas; sin titulares en mayúsculas (la web usa
tipo frase); los antetítulos son lo único en mayúsculas.

## Fondo y superficies (Depth & Surface)

Suave: tarjetas blancas o bosque con radio de 32 px; una sola sombra blanda
(`0 30px 60px rgba(16,35,29,0.16)`) solo para chips de UI flotantes. Retícula de puntos (tinta al 16 %,
paso de 44 px) como textura del registro marfil. En oscuro, tinta a sangre con un halo bosque muy suave.

## Componentes (Components)

Logotipo con icono de bocadillos, marca lima, tarjeta de práctica por voz, onda, tarjeta de nota 70/100
con criterios, tarjetas de escenario 01/02/03, stepper, píldora CTA y logotipo oficial de OpenWebinars.
Son componentes reales del producto reconstruidos en HTML: úsalos en vez de inventar interfaz.

## Movimiento (Motion)

| Elemento | Animación | Duración | Curva |
|---|---|---|---|
| Titular cinético | palabra a palabra por máscara; cada línea con otro movimiento (sube, entra de lado con desenfoque, cae con muelle) | 0,4–0,6 s | expo.out / back.out(1.6) |
| Marca lima | scaleX 0→1 de izquierda a derecha detrás de la palabra | 0,4 s | power3.out |
| Golpes al beat | palabra que sustituye a la anterior con escala-pop | 0,25 s | back.out(2) |
| Tarjetas de UI | llegan inclinadas en 3D y se enderezan; flotan | 0,6 s | expo.out |
| Cifra | contador 0→70 | 1,0 s | power3.out |
| Cámara | push-in continuo 1→1,05 por plano | todo el plano | none |

Todos los cortes caen en la rejilla de la música (0,5 s a 118 bpm) y el drop es el momento «Ensáyalo».
Nada estático más de 1 s.

## Transiciones (Transitions)

Corte seco en el beat por defecto; **push-slide a la izquierda de 0,4 s** entre superficies de producto;
**blur-crossfade de 0,4 s** para entrar al cierre (0,6 s en la corporativa).

## Subtítulos (Captions)

La promo está pensada para verse sin sonido: el texto en pantalla cuenta la historia y no hay narrador.
Cuando hay voz de personaje, su frase se revela **palabra a palabra sincronizada** dentro de un bocadillo
o de la transcripción. Para subtítulos del motor: caja tinta con radio 20, DM Sans 700 a 40–46 px en
marfil, palabra activa en lima.

## 3D

Solo profundidad de CSS: tarjetas de escenario que vuelan en abanico con inclinación 3D y piezas de UI
flotando. Sin objetos 3D; si se usan, material estándar en bosque y lima, sin contornos.

## Audio

Música electrónica a 118 bpm con build y drop (ElevenLabs o local); efectos de interfaz (ui-pop, whoosh,
thump, mic-on, success, tick). Voces de personaje con acento de Madrid; sin narrador en las promos 1:1.

## Variantes (de ~/videos-opus/videos/entregas-ensaya/)

| Variante | Qué cambia | Movimiento y sonido |
|---|---|---|
| **Original** (v1, 35 s) | Mezcla «La conversación pendiente» + «Club cinético»: gancho de tipografía gigante en marfil, objeción del personaje en tinta, «¿Qué le respondes?», drop lima «Ensáyalo.», tarjeta de práctica, evaluación 70/100 y cierre con logotipo | expo.out/back.out, máscaras de palabra, push-in continuo; 118 bpm con drop en 16,25 s |
| **Tiempo real** (v2, 45 s) | La práctica se convierte en una conversación rápida de 4 turnos con transcripción palabra a palabra, «● EN DIRECTO» y cronómetro real; añade un plano de cumplimiento (Zero Retention · ISO/IEC 27001 · Reglamento Europeo de IA) y cierre por invitación | igual que la original, con cinco compases más |
| **Divertida** (v3, 38 s) | Neobrutalismo de marca: bordes de tinta de 4–7 px, sombras duras desplazadas de 8–16 px (tinta o lima), lima a sangre, pegatinas giradas (−4° a 8°), concurso A/B/C, sellos de goma, contador de tragaperras, cursor sobre el CTA | back.out(2–3), elastic.out(1, 0.45), bounce, sacudidas de cámara en los golpes; funk-pop a 124 bpm y efectos cómicos |
| **Corporativa** (v4, 42 s) | Tinta a sangre en todos los planos, paneles bosque o `rgba(247,248,242,.04)`, filetes de 1–2 px al 16 %, lima solo en detalles mínimos (línea de progreso de 2 px, puntos, subrayado de la nota); titulares en **DM Sans 400** (64–92 px, −0,02em), Inter Tight 800 solo para la nota y el logotipo; índice «01 / 06» arriba a la izquierda y «ENSAYA · OPENWEBINARS» arriba a la derecha; retícula estricta alineada a la izquierda | lento y preciso: máscaras yPercent 100→0 y fundidos de 0,8–1,2 s (power3.out, power2.inOut, expo.out), filetes que se dibujan, deriva de cámara 1→1,02, blur-crossfade 0,6 s; sin rebotes ni pegatinas ni exclamaciones; piano + pulso a 92 bpm |
| **Persona** (v5, v5b, v6, 55 s) | La grafía de las v1–v3 con una persona generada en tres planos (vídeo debajo, rótulos de marca encima, en capas transparentes) | cortes secos en la rejilla musical; 118 bpm |

Para usar una variante como estilo propio del catálogo, créala con el procedimiento de variantes de la
skill `estilos-video` (p. ej. `estilos/ensaya-conversation-club-corporativa/`).

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)
- Resaltar **una** frase clave por plano con la marca lima.
- Usar los componentes reales del producto (tarjeta de práctica, onda, nota, escenarios).
- Alternar marfil y tinta/bosque por actos; lima a sangre una sola vez.
- Poner el logotipo de OpenWebinars con «by» en el cierre.

### No (Don't)
- No inventar métricas: los únicos números son los del producto (10 min, 05:00, el ejemplo 70/100, 3/5–4/5), marcados como ejemplo.
- No recolorear ninguno de los dos logotipos ni usar un segundo acento.
- Nada de lima como color de texto sobre marfil; nada de titulares en mayúsculas ni cursivas.
- No mostrar datos personales de clientes; los personajes son virtuales.

## Carga de fuentes (Font loading)

Copia `estilos/ensaya-conversation-club/fonts/*.woff2` a `assets/fonts/` (o `node
estilos/_esquema/fontface.mjs ensaya-conversation-club --ruta <carpeta>`). Sustituye a los `.ttf`
capturados de la web que usaban las promos originales:

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

`tokens.json` describe el **registro oscuro** (tinta/bosque), que es el que permite la lima como color de
texto y de palabra activa. Para un vídeo del motor en marfil, crea la variante
`ensaya-conversation-club-marfil` con fondo #F7F8F2, texto #10231D, textoSuave #526158, superficie
#FFFFFF, superficie2 #D6F469 (subrayador), acento #173F32 y `palabraActiva: "subrayado"`.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Un acento:** lima y solo lima; el violeta/magenta solo dentro del logotipo de OpenWebinars.
- **Registros:** marfil/tinta alternados; lima a sangre como mucho una vez.
- **Tipo:** Inter Tight 800 −0,04em o más cerrado; DM Sans en antetítulos y cuerpo; sin mayúsculas en titulares.
- **Producto:** componentes reales; cifras de ejemplo marcadas como ejemplo.
- **Ritmo:** cortes en la rejilla musical; nada quieto más de 1 s (salvo en la corporativa).

## Referencias

`referencias/`: 01 original, drop «Ensáyalo.» con logotipo y tarjetas de escenario · 02 original,
evaluación 70/100 con criterios y alternativa · 03 original, cierre de marca · 04 divertida, concurso A/B/C
neobrutalista · 05 divertida, sellos de cumplimiento · 06 corporativa, evaluación sobre tinta.
