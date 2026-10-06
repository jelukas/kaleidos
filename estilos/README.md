# Catálogo de estilos de vídeo

Cada carpeta es una guía de estilo lista para usar en un proyecto del motor de Remotion (`proyectos/<slug>/`) o en
un proyecto HyperFrames. Formato y contrato en `docs/CONTRATO.md` §5.

```
estilos/<estilo>/
  estilo.md       guía completa en formato frame.md de HyperFrames (frontmatter YAML + prosa)
  tokens.json     lo mismo en datos, para el motor (esquema de CONTRATO §5)
  fonts/          .woff2 OFL (latin + latin-ext) + licencias OFL-*.txt
  referencias/    3–6 JPG de 960 px que muestran el estilo
estilos/_esquema/ esquema, validador y herramientas (fuentes, @font-face, muestrarios)
```

## Los 12 estilos

| Estilo | Para qué sirve | Modo | Tipografías | Energía | Motor recomendado | Referencia principal |
|---|---|---|---|---|---|---|
| [`curso-azul`](curso-azul/estilo.md) | Videocursos corporativos y píldoras técnicas con ponente; intros y cierres de curso | oscuro | Montserrat 400/700/900 · JetBrains Mono | media | Remotion (motor kaleidos) | [tarjeta de capítulo](curso-azul/referencias/02-tarjeta-capitulo.jpg) |
| [`senal-informativo`](senal-informativo/estilo.md) | Informativos y boletines de actualidad que enseñan la prueba (capturas, publicaciones, cifras con fuente) | oscuro | League Gothic · IBM Plex Mono 400/700 | alta | HyperFrames | [titular de noticia](senal-informativo/referencias/01-titular-noticia.jpg) |
| [`ensaya-conversation-club`](ensaya-conversation-club/estilo.md) | Promos y demos de la marca Ensaya (5 variantes: original, tiempo real, divertida, corporativa, persona) | oscuro (+ registro marfil) | Inter Tight 800 · DM Sans 400/700 · DM Mono | alta | HyperFrames | [drop «Ensáyalo.»](ensaya-conversation-club/referencias/01-original-ensayalo-tarjetas.jpg) |
| [`cuaderno-a-mano`](cuaderno-a-mano/estilo.md) | Explainers de pizarra dibujados a mano (45–90 s): producto, proceso, onboarding | claro | Patrick Hand · DM Sans 700 · DM Mono (letra trazada en código) | media | HyperFrames | [viñetas dibujadas](cuaderno-a-mano/referencias/02-vinetas-recuadros.jpg) |
| [`dibujos-animados`](dibujos-animados/estilo.md) | Episodios de serie de dibujos: presentar un producto o una idea con personajes y humor | oscuro | Inter Tight 800 · DM Sans 400/700 · DM Mono | alta | HyperFrames | [cartela del episodio](dibujos-animados/referencias/01-cartela-episodio.jpg) |
| [`rainy-cabin`](rainy-cabin/estilo.md) | Vídeos ambiente largos en bucle perfecto (lluvia y tormenta), rótulos mínimos y miniaturas | oscuro | Cormorant Garamond 600 · Montserrat 400/500 | baja | HyperFrames + WebGL + ffmpeg | [tarjeta de canal](rainy-cabin/referencias/04-tarjeta-intro-canal.jpg) |
| [`vox-corto`](vox-corto/estilo.md) | Shorts, Reels, TikTok y explainers cortos en 9:16 y 16:9 a la vez | oscuro | Archivo 700/800/900 | alta | HyperFrames (skill `video-corto`) | [rótulo horizontal](vox-corto/referencias/01-rotulo-horizontal.jpg) |
| [`clase-oscura-cristal`](clase-oscura-cristal/estilo.md) | Clases largas con ponente recortado, cámara virtual y acento por capítulo | oscuro | Space Grotesk 500/700 · Inter 400/600 · JetBrains Mono | media | Remotion (motor kaleidos, `clase-larga`) | [panel de cristal](clase-oscura-cristal/referencias/02-panel-cristal-subtitulos.jpg) |
| [`acuarela-ilustrada`](acuarela-ilustrada/estilo.md) | Piezas cortas con ilustraciones de acuarela en 2,5D, tarjetas blancas y anotaciones a mano | claro | Nunito 400/600/800 · Caveat 700 · JetBrains Mono | media | Remotion (motor kaleidos, `corto-ilustrado`) | [ilustración con tarjeta](acuarela-ilustrada/referencias/01-ilustracion-tarjeta.jpg) |
| [`milikito`](milikito/estilo.md) | Masterclass en directo con alma de show: escenario de webinar (diapositiva + cámara), diapositivas de concurso con titulares de videojuego, registro editorial y láminas de cómic; versión dinamizada | oscuro | Fredoka 700 · Nunito 700–900 · Barlow Condensed · Inter · Comic Neue | alta | Remotion (motor kaleidos) o HyperFrames | [escenario de dos cajas](milikito/referencias/04-escenario-dos-cajas.jpg) |
| [`lanzamiento-minimal`](lanzamiento-minimal/estilo.md) | Explainers narrados y piezas de marca de ritmo pausado: un mensaje por plano, titular enorme, mucho aire; paleta de la web de OpenWebinars y su logo animado como vector | claro | Inter 400/600/800 · JetBrains Mono | baja | HyperFrames (o Remotion) | [rótulo](lanzamiento-minimal/referencias/01-rotulo.jpg) |
| [`lanzamiento-dinamico`](lanzamiento-dinamico/estilo.md) | Variante de lanzamiento-minimal: anuncio de producto muy dinámico (spring, desenfoque de movimiento, campos violeta, orbe del agente, simulaciones de UI), paleta de la web de OpenWebinars | claro + campos de color | Inter 400/600/800 · JetBrains Mono | alta | HyperFrames | [rótulo](lanzamiento-dinamico/referencias/01-rotulo.jpg) |

`vox-corto`, `clase-oscura-cristal` y `acuarela-ilustrada` no tienen render propio todavía: sus referencias son
muestrarios generados con sus tokens (`00-muestrario.jpg` + escenas de ejemplo).

## Guía rápida

**Elegir.** Mira las `referencias/` y la tabla. Si dudas: clase o curso con ponente → `clase-oscura-cristal` o
`curso-azul`; pieza corta ilustrada → `acuarela-ilustrada`; noticia → `senal-informativo` (demostrar) o `vox-corto`
(explicar rápido y en vertical); explicar un producto con cercanía → `cuaderno-a-mano` o `dibujos-animados`; marca
Ensaya → `ensaya-conversation-club`; ambiente → `rainy-cabin`.

**Usar en un proyecto del motor (Remotion).** En `proyectos/<slug>/proyecto.json`, `"estilo": "<estilo>"`. El motor
lee `estilos/<estilo>/tokens.json` y sus fuentes; `npm run estilos` en `motor/` los copia a `motor/public/estilos/`
(sin `referencias/`) y los valida.

**Usar en un proyecto HyperFrames.** Copia `estilo.md` como `frame.md` en la raíz del proyecto y las fuentes a
`assets/fonts/`; el bloque `@font-face` ya está en la guía:

```bash
cp estilos/<estilo>/estilo.md <proyecto>/frame.md
mkdir -p <proyecto>/assets/fonts && cp estilos/<estilo>/fonts/* <proyecto>/assets/fonts/
node estilos/_esquema/fontface.mjs <estilo> --ruta assets/fonts   # si hay que regenerar el CSS
```

**Validar** (esquema, fuentes, licencias, contraste WCAG AA, guía y referencias):

```bash
node estilos/_esquema/validar.mjs              # todos
node estilos/_esquema/validar.mjs <estilo> --detalle
```

**Crear un estilo o una variante.** Procedimientos en la skill `.claude/skills/estilos-video/SKILL.md`. Herramientas:

| Herramienta | Qué hace |
|---|---|
| `_esquema/fuentes.mjs <estilo> <paquete>:<pesos> …` | `npm pack @fontsource/<paquete>`, comprueba OFL/Apache, copia latin + latin-ext y la licencia e imprime las entradas de `archivos` |
| `_esquema/fontface.mjs <estilo> [--ruta] [--escribir]` | CSS `@font-face` con `unicode-range`; `--escribir` actualiza el bloque de `estilo.md` |
| `_esquema/muestrario.mjs <estilo> [--todas]` | Muestrario de tokens (paleta, tipografías, panel, subtítulo) → `referencias/00-muestrario.jpg`; con `--todas`, también `01-rotulo.jpg` y `02-panel.jpg` |
| `_esquema/captura.mjs <html> <jpg> [ancho alto]` | Captura una página con Chrome headless y la deja en JPG de 960 px |
| `_esquema/validar.mjs [estilo…] [--detalle]` | Validador sin dependencias; sale con 1 si algo falla |
| `_esquema/adherencia.mjs <estilo> <archivos o carpetas>` | Colores y tipografías de una composición que no son del estilo (archivo:línea), Google Fonts y azar no determinista |
| `_esquema/hoja.sh <salida.jpg> [columnas] [estilo …]` | Hoja de contactos con una referencia por estilo |

`muestrario.mjs` y `captura.mjs` necesitan `puppeteer-core`: `NODE_PATH=~/videos-opus/node_modules node …`.

## Reglas del catálogo

- **Fuentes:** solo OFL o Apache-2.0, en `.woff2`, de `@fontsource/*` o de `~/videos-opus/videos/brand-fonts/`;
  nunca fuentes del sistema de Apple. Cada familia con su licencia en `fonts/`.
- **Contraste:** `texto` y `textoSuave` ≥ 4,5:1 sobre `fondo` y `superficie`; `acento` ≥ 3:1 sobre `fondo`.
  Si un color de marca no llega (p. ej. un fosforito sobre claro), va de relleno (`superficie2`), no de texto.
- **Referencias:** sin caras de personas reales ni nombres reales; fotogramas de rótulos, gráficos e ilustraciones.
- **Tokens y guía sincronizados:** todos los hex y familias de `tokens.json` aparecen en `estilo.md` (lo comprueba
  el validador).
