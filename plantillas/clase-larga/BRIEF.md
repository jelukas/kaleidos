# BRIEF · <Título de la clase>

> Plantilla `clase-larga`. Sustituye a la que crea `tools/kaleidos nuevo --bruto …`. Rellena cada apartado y borra
> las indicaciones entre corchetes. Método completo: `.claude/skills/edicion-ponente/SKILL.md`.

- **Proyecto:** `<slug>` · método `clase-larga` · estilo `<clase-oscura-cristal | curso-azul | milikito>`
  [· modo escenario si `milikito`]
- **Bruto:** `brutos/<archivo>` (<ancho>×<alto>, <fps> fps, <duración>) [· preproceso heredado de `<otro>` con
  `--desde-proyecto`]
- **Salida:** 1920×1080 · render en AWS Lambda
- **Inicio:** <AAAA-MM-DD HH:MM>

## Confirmado con el usuario
[Lo que respondió: material, plantilla, estilo, duración objetivo, formato, recorte, y lo que pidiera expresamente.]

## Deducido (sin preguntar)
| Campo | Valor | De dónde |
|---|---|---|
| Idioma | es | conversación |
| Recorte del ponente | [sí: fondo liso] | `work/analisis/resumen.md` |
| fps | [el del bruto] | bruto |
| Densidad | un gráfico cada ~40 s [`milikito`: algo nuevo cada 8–12 s] | plantilla |
| Música y efectos | [ninguna / los de `estilos/milikito/audio/`] | estilo |
| Público y destino | [p. ej. profesionales del sector · LMS del curso] | tema |

## Objetivo
[Qué tiene que saber o hacer quien vea el vídeo al terminar.]

## Público
[Perfil, nivel previo, contexto de uso.]

## Duración y ritmo
[Duración objetivo tras los cortes (p. ej. de 34 min de bruto a ~25 min); energía.]

## Estructura
[Capítulos previstos o criterio para sacarlos de la transcripción; intro y cierre.]

## Qué cortar
Tomas falsas, charla fuera de guion y repeticiones: quedarse siempre con la última toma buena (mira sobre todo el
final de la grabación). [Otros tramos que el usuario quiera quitar.]

## Gráficos y 3D
[Tipos de panel preferidos, objetos 3D, qué NO mostrar.] Los gráficos resumen lo que dice la voz: sin datos,
opciones ni decisiones inventadas.

## Subtítulos y textos
Español. Términos del dominio y su grafía (van a `proyecto.json › whisper.prompt` y a `guion.json › fixes`):
[siglas, normas, productos].

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos, subtítulos destacados ni informes. Rótulos
genéricos («Docente del curso»). Si aparecen datos personales en pantalla, se difuminan.

## Contenido sensible
[Si es legal, clínico o financiero: un experto debe validar los textos de los paneles (se anota en `informe.md`).]

## Entregables
- `resultados/<slug>.mp4` (Lambda, 1920×1080)
- `proyectos/<slug>/capitulos.txt` (capítulos de YouTube)
- `proyectos/<slug>/informe.md` (decisiones, avisos, incoherencias, tiempo total y coste)
