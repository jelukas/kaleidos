---
name: video-corto
description: >-
  Produce vídeos cortos, muy dinámicos y con cortes rápidos para YouTube, Shorts,
  TikTok o Reels, en formato vertical Y horizontal a la vez, con locución
  generada (ElevenLabs), música y efectos, B-roll de gpt-image-2, fotografía real
  vía Apify y montaje HTML+GSAP con HyperFrames. Úsala siempre que el usuario
  pida un vídeo, un explainer, un vídeo de una noticia, un short, un reel, un
  vídeo de TikTok o de YouTube, un vídeo con voz en off o locución, un vídeo
  animado con datos o cifras, o quiera convertir un texto, un guion o una noticia
  en vídeo — aunque no mencione HyperFrames, ElevenLabs ni ninguna herramienta
  concreta. Úsala también para retocar, alargar, reencuadrar o volver a renderizar
  un vídeo ya hecho con este flujo.
---

# Vídeo corto dual-formato

Convierte un tema, un guion o una noticia en **dos MP4** —vertical 1080×1920 y
horizontal 1920×1080— generados desde **una sola fuente**. La locución fija el
ritmo; todo lo demás cuelga de ella.

## Antes de nada: si el tema es una noticia

**Verifica los hechos con búsqueda web antes de escribir una sola línea de
guion.** Un vídeo informativo con datos falsos es el peor resultado posible de
esta skill, y es un fallo silencioso: el vídeo sale igual de bonito.

Si la premisa del encargo no se sostiene, **dilo y monta lo que sí ocurrió**. No
"suavices" el guion para que encaje con una premisa falsa. Lee
`references/periodismo.md` antes de tocar el guion: cubre la verificación, el
tratamiento de imágenes en piezas informativas y el fichero de trazabilidad.

## El flujo

```bash
npm run voz -- <slug>       # script.json → assets/voice/*.wav + manifest de tiempos
npm run imagenes -- <slug>  # images.json → B-roll generado
npm run stock -- <slug>     # stock.json  → fotografía real (opcional, de pago)
npm run audio -- <slug>     # audio.json  → música y efectos
npm run build -- <slug>     # plan.json   → vertical.html + horizontal.html
npm run use -- <slug> vertical
npm run check               # obligatorio: 0 errores antes de renderizar
npm run render -- <slug>    # renders/<slug>-<formato>.mp4
```

Si el proyecto aún no existe: `npx hyperframes@latest init . --non-interactive
--example blank`, copia `scripts/` y `assets/` de esta skill, y añade los scripts
de `package.json`. Requiere **Node 22+ y ffmpeg**. Claves en `.env` (plantilla en
`assets/env.example`).

## Estructura

```
videos/_shared/vox.css, timeline.js     compartidos por TODOS los vídeos
videos/<slug>/
  script.json   guion — una línea = un corte
  images.json   prompts de B-roll generado
  stock.json    consultas de fotografía real
  audio.json    música y efectos
  plan.json     el montaje: beats que referencian líneas del guion
  scenes/*.html sub-composiciones animadas de un solo uso
  assets/       lo generado + manifests con los tiempos reales
  vertical.html, horizontal.html   GENERADOS por build.mjs — no editar
```

## Las dos ideas que sostienen todo

**1. El guion manda el reloj.** `voice.manifest.json` trae el `start` y la
`duration` reales de cada línea. Un beat de `plan.json` referencia **líneas**, no
segundos. Nunca estimes duraciones a ojo: cambia el guion, regenera la voz y el
montaje se recoloca solo.

**2. Los shells son artefactos.** Con decenas de cortes en dos formatos,
sincronizarlos a mano es inviable. `build.mjs` genera los dos desde el mismo
`plan.json`, así que no pueden divergir: lo único distinto es el tamaño del
stage. Se edita `plan.json` y se reconstruye.

Para que una escena valga en 9:16 y 16:9: maquetar en `vw`/`vh`/`vmin`, **nunca
`px` fijos**; la raíz de una sub-composición **no lleva `data-width`/`data-height`**
(la caja la manda el slot del host); y se estila por `#root`, nunca por una clase
—el scoping del compilador la descarta—. Para layouts que cambian de eje,
`@media (min-aspect-ratio: 1/1)`.

## Tipos de beat

`stat` (cifra protagonista con conteo ascendente vía `countTo`) · `compare` (dos
cifras enfrentadas) · `title` (kicker + titular + entradilla) · `quote` (cita +
atribución) · `photo` (imagen a pantalla completa con degradado, texto y crédito)
· `capture` (captura de pantalla entera, con su fuente, como prueba de lo que se
afirma) · `scene` (sub-composición animada de un solo uso).

Para vídeos sobre una empresa o un producto, el logo y una captura de la fuente
levantan mucho el resultado: ambos en `references/imagenes.md`.

## El error de diseño más común: el carrusel de rótulos

Un vídeo hecho solo de tarjetas de texto aburre, por muy buena que sea la
tipografía. Cuando notes que se acumulan `title` y `stat` seguidos, el arreglo no
es más texto: es **movimiento con significado**.

`assets/scenes/` trae nueve escenas animadas en SVG listas para adaptar: `olas`,
`puntos`, `barras`, `mapa`, `cierre`, `orbita` (cuerpos orbitando), `precios`
(tabla antes→después), `caida` (una caída con su porcentaje) e `indice`
(ranking con barras). Copia la que encaje a `videos/<slug>/scenes/` y
cámbiale los datos. Detalles y reglas de rendimiento en
`references/escenas-animadas.md`.

Alterna: cifra → foto → escena animada → cita → foto. Y varía el encuadre en cada
corte (`kb: "in"` / `"out"` alterna el Ken Burns).

## Ritmo

Beats de **2 a 6 s** en un explainer de tres minutos; de **0,8 a 2,5 s** en un
short. Cada beat dura hasta que arranca el siguiente, para que no queden
fotogramas negros. Entradas con `fromTo()`, nunca `from()`: el host re-busca la
escena en cada seek y `from()` se desincroniza.

## Voz con emociones

`eleven_multilingual_v2` **ignora** las etiquetas. Para dirigir la interpretación,
`"modelId": "eleven_v3"` y etiquetas en minúscula entre corchetes, inline:

```json
{ "id": "l19", "text": "[somber] Sesenta y siete personas murieron." }
```

Ajusta el registro al tema — en una noticia con víctimas, nada de `[excited]`.
Catálogo de etiquetas, ajustes y cómo verificar que no se leen en voz alta:
`references/audio.md`.

## Antes de dar por bueno

`npm run check` debe salir con **0 errores**. Después, **mira el vídeo**: extrae
fotogramas (`ffmpeg -ss <t> -i <mp4> -frames:v 1`) o usa `npx hyperframes
snapshot --at 12,40,90`, que además genera una hoja de contactos. El linter no ve
que un plano esté negro, que un texto se salga o que una foto no sea lo que dice
ser.

## Referencias

- `references/hyperframes.md` — las restricciones del framework que rompen el
  render en silencio. **Léelo antes de escribir composiciones.**
- `references/audio.md` — ElevenLabs: voz con etiquetas v3, música, efectos, pistas.
- `references/imagenes.md` — gpt-image-2 y Apify, con el control de coste.
- `references/periodismo.md` — verificación y tratamiento de imágenes en noticias.
- `references/escenas-animadas.md` — las nueve escenas SVG, cómo hacer nuevas y
  las dos trampas que cuestan una tarde (colisión de clases con `vox.css`, y
  GSAP reescribiendo el `transform` de los SVG).
- `references/sistema-visual.md` — la paleta y la tipografía del estilo explainer.
