# Plantillas de arranque

Una carpeta por plantilla con su `BRIEF.md` modelo y los JSON de arranque que aplican. Se eligen en la entrevista
de `docs/MONTAR_VIDEO.md` (§1) y se copian al proyecto después de `tools/kaleidos nuevo`. Formatos:
`docs/CONTRATO.md` §2 (guion), §7 (escenario y componentes show) y §8 (narración).

| Plantilla | Qué es | Duración típica | Estilo recomendado | Ejemplo real | Archivos |
|---|---|---|---|---|---|
| [`clase-larga`](clase-larga/) | Clase, videocurso o charla desde un bruto con ponente: cortes de tomas falsas, capítulos y un gráfico cada ~40 s | 8–40 min | `clase-oscura-cristal` o `curso-azul`; con show, `milikito` | `proyectos/dora-milikito` (`milikito`, 10:17 de 34 min de bruto) | `BRIEF.md`, `guion.json` |
| [`corto-ilustrado`](corto-ilustrado/) | Pieza corta con ponente alternando con ilustraciones en 2,5D, montaje 1:1 con el original | 30 s – 3 min | `acuarela-ilustrada` (o variante con la paleta de sus ilustraciones) | método A de `docs/METODO_EDICION_IA.md` (54 s) | `BRIEF.md`, `guion.json`, `images.json` |
| [`noticias-narracion`](noticias-narracion/) | Informativo con voz de ElevenLabs, sin grabación: apertura de marca, gancho, 5 bloques con ficha y cierre | 3–4 min | `milikito` (escenario) | `proyectos/devday-2026` (3:50 de voz, 16 min 44 s de encargo) | `BRIEF.md`, `locucion.json`, `guion.json`, `images.json`, `captures.json`, `fuentes.md` |
| [`explainer-narracion`](explainer-narracion/) | Explicación de un concepto con voz de ElevenLabs: problema → cómo funciona → errores → resumen | 60–120 s | `milikito` (registro editorial) | `proyectos/_prueba-narracion` (banco de pruebas mínimo) | `BRIEF.md`, `locucion.json`, `guion.json`, `images.json` |
| [`promo-hyperframes`](promo-hyperframes/) | Promo, lanzamiento o short generativo con HyperFrames (con o sin voz) | 15–60 s | `vox-corto`, `ensaya-conversation-club`, `cuaderno-a-mano`, `dibujos-animados` | promos de Ensaya en `~/videos-opus` (solo lectura) | `BRIEF.md` (frontmatter de HyperFrames) |

## Cómo se usan

```bash
# Remotion con ponente
tools/kaleidos nuevo <slug> --bruto brutos/<x> --estilo <e> --metodo clase-larga      # o corto-ilustrado
cp plantillas/clase-larga/{BRIEF.md,guion.json} proyectos/<slug>/

# Remotion narración
tools/kaleidos nuevo <slug> --narracion --estilo milikito --escenario --titulo "…" --prompt "…"
cp plantillas/noticias-narracion/{BRIEF.md,locucion.json,guion.json,images.json,captures.json,fuentes.md} proyectos/<slug>/

# HyperFrames: NO copies nada antes de `npx hyperframes init` (se niega con archivos dentro); el flujo escribe
# BRIEF.md con el frontmatter de plantillas/promo-hyperframes/BRIEF.md
```

Después, sustituye todo lo que va entre `<…>`, las frases de ejemplo y las cifras de ejemplo. El campo `_plantilla`
de cada JSON es una nota para quien edita: `tools` y `scripts/` lo ignoran (puedes borrarlo).

- **`guion.json`**: los cues son `[segundo, "frase literal"]`. En narración, las frases son de `locucion.json` y los
  segundos de ejemplo salen de una estimación a 2,75 palabras/s; en ponente, las frases son marcadores `<…>` que se
  sustituyen por frases de `work/transcripcion.txt`. Tras `tools/kaleidos transcribir`, ponlos al día con
  `python3 plantillas/herramientas/cues.py <slug>`.
- **`locucion.json`** (narración): 1–3 frases por bloque, ≈ 150 palabras por minuto, `pausaDespues: 0.7` al cerrar
  cada bloque temático. `voz: {}` usa la voz y el modelo de `.env` (`eleven_v4`); `{"modelo": "eleven_v4_turbo"}` para
  ir más rápido; `{"id": "<voice_id>"}` para otra voz.
- **`images.json`**: láminas de gpt-image-2 (`node scripts/images.mjs <slug> --quality medium --concurrency 6`), con
  el estilo gráfico fijado en `style`. Sin personas reales, sin marcas y sin texto; hueco arriba para los bocadillos.
  Los `id` son las claves `imagen` de los eventos `lamina` del guion.
- **`captures.json`**: capturas de las fuentes oficiales (`node scripts/capture.mjs <slug>`); la URL de ejemplo es un
  marcador que hay que sustituir.

## Herramientas (`herramientas/`)

| Herramienta | Qué hace |
|---|---|
| `cues.py <slug> [--estimar] [--comprobar] [--recalcular]` | Pone los segundos a todos los cues del guion (capítulos, eventos y sus elementos, bocadillos, anclas, cortes, cierre) buscando cada frase en `work/transcripcion.json` (con y sin `fixes`), como `linea`. Admite `"frase"`, `[null, "frase"]` o `[s, "frase"]` (el segundo es la pista). `--estimar` usa `locucion.json` antes de tener la voz. Avisa de frases repetidas y sale con 1 si alguna no aparece. Generaliza `proyectos/devday-2026/work/guion/eventos.py` |
| `normalizar_audio.py resultados/<slug>.mp4 [--en-sitio]` | Normaliza el audio del MP4 final a −16 LUFS / −1,5 dBTP (loudnorm en dos pasadas, lineal) copiando el vídeo; comprueba fotogramas y duración y guarda el registro completo de ffmpeg. La mezcla de Lambda sale a ≈ −13 LUFS |

Ambas solo usan la biblioteca estándar de Python (3.9+) y ffmpeg.

## Errores típicos de `linea` con estas plantillas

- Evento dentro del rótulo de capítulo (los 3,4 s tras el cue del capítulo): pon su cue más tarde o quita el
  `titulo` que repite el capítulo.
- Narración: `intro.hasta` alarga la intro y se traga los primeros eventos; usa solo `intro.previo`.
- Bocadillos arriba en el centro (`y` < 0,15) tapan las fichas de capítulo: `x` ≈ 0,2–0,25 e `y` ≈ 0,16–0,17.
- «evento 1 (lamina) empezaba dentro del intro: se retrasa 6 fotogramas» con la primera lámina pegada a la voz:
  es inofensivo.

## Cómo se comprobaron (2026-09-30)

- Todos los JSON parsean; las claves de cada tipo de evento, de `locucion.json`, `images.json` y `captures.json`
  coinciden con las de los proyectos reales o están documentadas en el contrato (`lado` en todos los paneles,
  `desdeCue`/`hastaCue` en cortes, `ilustracion` según el esquema del motor). Iconos y objetos 3D, del catálogo del
  motor.
- `linea` en memoria (sin tocar `proyectos/`) sobre proyectos sintéticos en un directorio temporal:
  `noticias-narracion` y `explainer-narracion` con una transcripción sintética de su propia locución (cues.py: 73 y
  30 cues, todos encontrados; `linea`: 0 errores, 1 aviso inofensivo) y `clase-larga` y `corto-ilustrado` sobre el
  preproceso de `dora-v2` (0 errores; los avisos son los cues `<…>` sin sustituir y las ilustraciones sin generar).
- Los cuatro `timeline.json` resultantes pasan el esquema zod del motor (`motor/src/datos/contrato.ts`).
- No se ha renderizado ningún fotograma con las plantillas (necesitan su contenido real): haz stills en cada proyecto.
