# kaleidos para el equipo audiovisual

Todo lo necesario para hacer los vídeos de clientes con kaleidos y Claude Code: qué skills se usan, cómo se
instalan y cómo se pide un vídeo. En esta carpeta:

| Archivo | Qué es |
|---|---|
| `README.md` | Esta guía |
| `kaleidos-skills.zip` | Las skills que usan los vídeos (las de kaleidos y las de HyperFrames), listas para copiar |
| `empaquetar.sh` | Regenera el zip con las versiones actuales de las skills |

## 1. Qué es kaleidos

Una fábrica de vídeos: entra una **grabación**, un **texto** o una **idea** y sale un MP4 con un **estilo** del
catálogo (`estilos/`). Claude Code hace el trabajo siguiendo las skills; el render se hace siempre en **AWS Lambda**
(`eu-west-1`). Hay tres caminos:

| Material | Motor | Ejemplos de lo que ya se ha hecho |
|---|---|---|
| Grabación con ponente (clase, videocurso, charla) | Remotion (`motor/` + `tools/`) | Videocursos y clases editadas, con gráficos y recorte del ponente |
| Narración con voz de ElevenLabs, sin grabación | Remotion, modo narración | Noticias y explainers |
| Generativo: promos, demos, propuestas para clientes | HyperFrames (HTML → vídeo) | Propuestas formativas para empresas, demo de una micropíldora, promos de producto |

Los vídeos de clientes de las últimas semanas son todos del tercer tipo (HyperFrames).

## 2. Instalación (una vez por Mac)

Requisitos: Mac con Apple Silicon, ≥ 15 GB libres, Claude Code y acceso al repo.

1. Clona el repo y ábrelo en Claude Code.
2. Di **«instala kaleidos»**. La skill `instalar-kaleidos` lanza `./instalar.sh` (≈ 4 GB de descargas, 15–30 min) y
   deja instaladas también las skills globales. Guía completa: [`INSTALAR.md`](../INSTALAR.md).
3. Rellena `.env` **tú, en tu editor** (plantilla en `.env.example`): AWS/Remotion, ElevenLabs, OpenAI y Apify.
   Las claves te las da el responsable del repo; nunca se pegan en el chat ni se suben a git.
4. Comprueba: `node scripts/doctor.mjs` → la última línea dice para qué flujos está listo.

### Instalar las skills desde el zip (sin el instalador, o para actualizarlas)

```bash
unzip -o equipo-audiovisual/kaleidos-skills.zip -d /tmp/kaleidos-skills
```

```bash
cp -R /tmp/kaleidos-skills/globales/* ~/.claude/skills/
```

Las skills de `proyecto/` ya vienen dentro del repo (`.claude/skills/`) y solo funcionan con Claude Code abierto en
la carpeta de kaleidos: no hace falta copiarlas. Están en el zip para quien quiera leerlas o usar otro agente. Cierra
y vuelve a abrir Claude Code después de copiar skills.

## 3. Las skills

### De kaleidos (en el repo, `.claude/skills/`)

| Skill | Cuándo entra | Qué hace |
|---|---|---|
| `montar-video` | «quiero montar un vídeo», «hazme un vídeo de…» | **Puerta de entrada.** Una ronda corta de preguntas (material, plantilla, estilo, formato), escribe `BRIEF.md` y elige el camino |
| `edicion-ponente` | hay una grabación en `brutos/` | Transcribe, corta tomas falsas, recorta al ponente, añade gráficos y renderiza con Remotion |
| `estilos-video` | «con el estilo X», «qué estilos hay», «crea un estilo desde esta web» | Catálogo de estilos: aplicar, recomendar, crear variantes y revisar que el vídeo lo cumple |
| `instalar-kaleidos` | «instala kaleidos» | Instalación guiada en un Mac nuevo |
| `audio-local` | solo si se pide «audio local» | Voz, música y efectos con modelos locales en lugar de ElevenLabs |

### Globales (en `~/.claude/skills/`, las instala `instalar.sh` o el zip)

| Skill | Para qué |
|---|---|
| `hyperframes` | Router de HyperFrames: reglas del formato y qué skill usar en cada caso. Se lee siempre primero |
| `general-video` | El flujo que han usado los vídeos de clientes: piezas a medida de varias escenas |
| `product-launch-video` | Promos y demos de producto a partir de una URL o un guion |
| `video-corto` | Shorts y vídeos muy dinámicos, vertical y horizontal a la vez, con voz y música (de kaleidos) |
| `media-use` | Voz, música, efectos, imágenes, logos y tratamiento de metraje |
| `hyperframes-core` | El contrato de las composiciones (`data-*`, clips, timelines) |
| `hyperframes-animation` | Animación con GSAP y escenas tipo |
| `hyperframes-cli` | Comandos: `check`, `snapshot`, `preview`, render en Lambda |
| `hyperframes-creative` | Dirección de arte: paleta, tipografía, ritmo |
| `hyperframes-audio` | Mezcla: fundidos, ducking bajo la voz |
| `hyperframes-keyframes` | Zooms, encuadres y movimientos de cámara |
| `hyperframes-registry` | ~450 bloques listos (transiciones, títulos, gráficos) |
| `hyperframes-studio` | Trabajar el proyecto en el Studio de HyperFrames |

Las skills de HyperFrames son de HeyGen con licencia **Apache-2.0** (copia en el zip, `globales/LICENSE-HyperFrames`).

## 4. Cómo se pide un vídeo

Abre Claude Code en la carpeta de kaleidos y pídelo con tus palabras. Cuanto más concreto, menos preguntas:

- «Quiero montar un vídeo con la grabación nueva de `brutos/`, estilo curso-azul, sin recortar al ponente.»
- «Hazme un vídeo de 2:30 para [empresa], con su logo, sobre la propuesta del pptx de `brutos/Inputs X`.»
- «Una demo de una micropíldora formativa sobre Claude para perfiles IT, como la que les llegaría por correo.»
- «Un short de la noticia de [tema] en vertical y horizontal, con fuentes oficiales.»

Lo que pasa después, siempre en este orden:

1. **Brief**: Claude pregunta lo que falte (una ronda) y escribe `proyectos/<slug>/BRIEF.md`. Revísalo: ahí queda
   qué se ha confirmado y qué se ha deducido.
2. **Material**: voz y música con ElevenLabs, logos vectoriales de la web del cliente, capturas y fuentes oficiales
   (anotadas en `fuentes.md`).
3. **Montaje y revisión**: escenas, `check` y fotogramas de cada escena. Puedes verlo antes en la previsualización
   (Claude te da la dirección `http://localhost:…`).
4. **Render en Lambda**: Claude enseña recursos, coste y tiempo estimados y **espera tu OK**. Referencia: ≈ 0,10 $ por
   cada 2:15 de vídeo a 1080p.
5. **Entrega**: `resultados/<slug>.mp4` con el audio normalizado a −16 LUFS, `informe.md` con tiempo y coste reales,
   y propuesta de borrar de AWS lo que quede (otra vez con tu OK).

## 5. Reglas que no se saltan

- **AWS**: nada sin OK explícito, con coste por delante. Al acabar, tiempo y coste finales.
- **Privacidad**: ningún dato personal de clientes en vídeos, informes ni rótulos. Lo que aparezca en pantalla se
  difumina. Rótulos genéricos salvo que te den los nombres.
- **Credenciales**: solo en `.env`; nunca en el chat, en URLs ni en git.
- **Contenido**: los gráficos resumen lo que dice la voz; no se inventan datos. Cifras de actualidad solo de fuentes
  oficiales. Lo simulado se rotula «Demo · ejemplo ilustrativo».
- **Vídeos para clientes**: sin precios ni importes (los decide el equipo comercial) y sin mencionar FUNDAE ni
  bonificaciones.
- **Tipografías** solo con licencia OFL o Apache. Logos de clientes: el vectorial de su propia web, sin recolorear.
- **Marca OpenWebinars**: estilo claro, violeta `#7D29E0`, nada de azules (estilos `lanzamiento-minimal` y
  `lanzamiento-dinamico`). Gustan los vídeos muy dinámicos, con interfaces simuladas, más que las listas estáticas.

## 6. Trucos aprendidos

- En la locución, «IA» se escribe «inteligencia artificial»: ElevenLabs deletrea la sigla. En pantalla, «IA».
- La voz va con `eleven_v4`; la música, con `music_v2` (`eleven_music_v2_5` da error 422).
- En Lambda no hay fuentes de símbolos: ✓ ✕ → 🔒 salen como cuadros o círculos vacíos. Usa iconos SVG.
- La subida a Lambda falla a veces con `read ECONNRESET` antes de empezar (sin coste): se repite el mismo comando.
- Render de HyperFrames siempre desde una copia **sin `node_modules`** y con `hyperframes@0.8.86`.
- La mezcla sale de Lambda a ≈ −14 LUFS: se normaliza en local antes de entregar
  (`python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 --en-sitio`).

## 7. Más documentación

[`docs/INDICE.md`](../docs/INDICE.md) es el índice. Los más útiles: [`MONTAR_VIDEO.md`](../docs/MONTAR_VIDEO.md)
(la conversación paso a paso), [`FLUJOS.md`](../docs/FLUJOS.md) (comandos, tiempos y costes),
[`ESTILOS.md`](../docs/ESTILOS.md) y [`SOLUCION_PROBLEMAS.md`](../docs/SOLUCION_PROBLEMAS.md).
