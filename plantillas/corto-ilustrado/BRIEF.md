# BRIEF · <Título corto>

> Plantilla `corto-ilustrado` (método A de `docs/METODO_EDICION_IA.md`). Sustituye a la que crea
> `tools/kaleidos nuevo --bruto … --metodo corto-ilustrado`. Rellena y borra las indicaciones entre corchetes.

- **Proyecto:** `<slug>` · método `corto-ilustrado` · estilo `acuarela-ilustrada` [o una variante con la paleta de
  las ilustraciones]
- **Bruto:** `brutos/<archivo>` (<ancho>×<alto>, <fps> fps, <duración>) · montaje **1:1** con el original
- **Salida:** 1920×1080 · render en AWS Lambda
- **Inicio:** <AAAA-MM-DD HH:MM>

## Confirmado con el usuario
[Material, plantilla, estilo, duración, formato y lo que pidiera expresamente.]

## Deducido (sin preguntar)
| Campo | Valor | De dónde |
|---|---|---|
| Idioma | es | conversación |
| Recorte del ponente | [sí: fondo blanco liso] | `work/analisis/resumen.md` |
| Ilustraciones | [del bruto: fotogramas limpios / generadas con `images.json`] | análisis del bruto |
| Tiempo | 1:1 con el original, sin cortes de silencio | método |
| Público y destino | [p. ej. campaña divulgativa · redes y web] | tema |

## Objetivo
[La idea que tiene que quedar clara en 30–90 s.]

## Estructura
[Tramos de ponente e ilustraciones en orden, con la frase que abre cada uno.]

## Ilustraciones
[Cuántas; de dónde salen; qué elementos de cada una se señalan (anclas) y con qué objeto 3D, uno por escena como
mucho.] Sin personas reales ni marcas ni texto.

## Gráficos
Tarjetas blancas, chips y recuadros a mano anclados al dibujo; un pop con la frase clave; cierre con 2–3 puntos.
Los gráficos resumen lo que dice la voz.

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos ni informes.

## Entregables
- `resultados/<slug>.mp4` (Lambda, 1920×1080)
- `proyectos/<slug>/informe.md` (decisiones, avisos, tiempo total y coste)
