# Imágenes — generadas y reales

Dos fuentes con criterios distintos. Elegir mal es la diferencia entre un vídeo
creíble y uno que parece de otra cosa.

| Necesidad | Fuente | Script |
| --- | --- | --- |
| Atmósfera, conceptos, texturas, B-roll genérico | `gpt-image-2` | `images.mjs` |
| Personas reales, hechos, actualidad, lugares e instituciones identificables | Apify Google Images | `stock.mjs` |
| **Logotipos de marca** | simple-icons (gratis, SVG) | `curl`, ver abajo |
| **Capturas de la noticia o del producto** | `hyperframes capture` | ver abajo |

## Logotipos

Un vídeo sobre una empresa gana mucho con su logo, y `gpt-image-2` no puede
dibujarlo (el `style` de esta skill le prohíbe expresamente los logotipos, porque
los inventa mal).

```bash
curl -sL -o assets/marca/openai.svg \
  "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openai.svg"
```

Es SVG monocromo: se colorea con `fill` desde el CSS de la escena (`.zlogo path {
fill: var(--vox-white) }`) y se **inserta inline** en el `<template>` para poder
animarlo. Uso editorial —hablar de la empresa— es lo normal; no lo uses de forma
que sugiera patrocinio o afiliación.

## Capturas de pantalla como prueba

`npx hyperframes capture <url> -o capture-x --skip-vision --max-screenshots 6`
abre la página en un navegador real y guarda `screenshots/scroll-*.png` más una
hoja de contactos. Sirve para enseñar **la fuente de lo que afirmas**: una tabla
de precios, un anuncio, un titular.

Dos cosas prácticas:

- **Muchos sitios grandes lo bloquean.** OpenAI devolvió "This page couldn't
  load". Cuando pase, tira de un medio que sí permita la carga, o renuncia a la
  captura: no la falsifiques recreando la página.
- **Recorta la zona útil.** Las capturas traen banner de cookies, navegación y
  barra lateral. Localiza la región mirando la captura escalada y recorta con
  `ffmpeg -i shot.png -vf "crop=W:H:X:Y" out.png`.

En el montaje van con el beat `capture`, que las muestra **enteras**
(`object-fit: contain`) y con su crédito: una captura recortada a sangre deja de
ser legible y deja de servir como prueba.

**El criterio**: si el plano exige que se reconozca a alguien o algo concreto, es
fotografía real. Si solo aporta ambiente (mar de noche, hormigón mojado, un haz de
luz), generada.

## gpt-image-2

`quality: "low"` basta para B-roll a pantalla completa y cuesta ~medio céntimo por
imagen. Solo sube a `medium` si la imagen es el sujeto del plano y se ve fija.

**`size` exige ancho y alto divisibles por 16.** El tamaño del stage NO vale:
`1080/16 = 67,5`, así que `1080x1920` da error 400. Los tamaños del script son
`1152x2048` (9:16) y `2048x1152` (16:9): relación exacta, cumplen la regla y
quedan por encima del stage, lo que deja margen para el Ken Burns. Hay reintento
automático a `1024x1536` / `1536x1024`.

Un 400 por tamaño **no se cobra**, así que probar tamaños es gratis.

### Prompts

Un campo `style` común a todo el vídeo mantiene la coherencia entre planos; el
`prompt` de cada imagen solo describe el contenido. Incluye siempre las
exclusiones: *sin personas, sin texto, sin logotipos, sin marcas de agua*. Un
rótulo inventado dentro de una imagen generada arruina el plano.

Si un plano sale demasiado oscuro bajo el degradado, no bajes el degradado
—rompe el contraste del texto—: regenera la imagen pidiendo más luz.

## Apify (`hooli/google-images-scraper`)

**Cobra por resultado devuelto, no por resultado útil** (~1,90 $/1000). El
filtrado por dominio del script ocurre *después* de pagar, así que la única
palanca real de ahorro es **pedir menos y mejor**.

En un caso real se pagaron 210 imágenes para acabar usando 3. Con consultas
acotadas, las mismas 3 costaron 12 resultados.

```json
{
  "maxResultsPerQuery": 4,
  "budgetUsd": 0.05,
  "sites": ["wikipedia.org", "wikimedia.org", "rtve.es", "eldiario.es"],
  "items": [{ "id": "valla", "query": "valla frontera Ceuta", "minWidth": 1200 }]
}
```

`sites` añade el operador `site:` de Google a la consulta: se piden pocos
resultados **ya restringidos** a medios con procedencia comprobable. `budgetUsd`
aborta la ejecución si el coste máximo se pasa. `--dry-run` enseña consultas y
coste sin gastar nada.

### Verificación visual OBLIGATORIA

**Nunca montes una imagen de Apify sin haberla mirado.** De 10 descargas en un
caso real: 5 eran *placeholders* de error de granjas de contenido ("This site
does not have permission…"), 2 eran capturas sin ninguna relación (una web sobre
la serie *Suits*; un monitor con una ventana de Grok abierta) y 1 era una tarjeta
partidista de redes con un titular sin verificar. **Todas pasaron el filtro
técnico**, porque son JPEG válidos del tamaño esperado.

```bash
cd videos/<slug>/assets/stock
md5 *.jpg | sort            # md5 repetidos = el mismo placeholder dos veces
for f in *.jpg; do ffmpeg -y -loglevel error -i "$f" -vf scale=300:-1 /tmp/t_$f.png; done
```

Y míralas. El script bloquea granjas y redes (`BLOCKED`) y prioriza medios
comprobables (`PREFERRED`), pero eso reduce la basura, no la elimina.

### Derechos

Son resultados de Google Images, casi siempre con derechos de terceros.
`stock.manifest.json` guarda `origin`, `title` y `contentUrl` de cada una para
poder revisar licencia y atribuir. Pon el crédito en pantalla con el beat `photo`
(campo `source`). No es material libre por defecto.
