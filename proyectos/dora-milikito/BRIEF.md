# BRIEF · DORA en la práctica

> Intención del vídeo. Claude la lee antes de escribir `guion.json`.

- **Proyecto:** `dora-milikito` · método `clase-larga` · estilo `milikito` · modo escenario (`"escenario": true`)
- **Bruto:** `brutos/prueba1.mp4` (3840×2160, 25 fps, 34:02.7). Preproceso heredado de `dora-v2` con enlaces duros
  (`tools/kaleidos nuevo … --desde-proyecto dora-v2`).
- **Origen del encargo:** orquestador de la sesión del 2026-09-30. **Pendiente de confirmar por el usuario** antes
  del render en Lambda.

## Objetivo
Que quien lo vea sepa decidir, en tres casos de banca, qué pide DORA: due diligence antes de firmar con un proveedor
TIC, activar pronto el protocolo de incidentes ante una señal crítica y actuar por el protocolo (no por atajos) cuando
un fallo TIC pone en riesgo un plazo.

## Público
Profesionales de entidades financieras (riesgo TIC, seguridad, cumplimiento, negocio) que ya conocen DORA en teoría.
Uso: módulo de curso («casos prácticos»).

## Duración y ritmo
~10 min (entre 9:30 y 10:30) a partir de la clase de `dora-v2` (12:44). Estilo `milikito`: algo nuevo en pantalla
cada 8–12 s, ninguna diapositiva quieta más de 12 s.

## Estructura
Intro de marca (MASTER CLASS) con apertura sin voz para la sintonía → tres capítulos, uno por caso (fichas «1», «2»,
«3», cada uno con su titular de juego) → en cada caso, las cuatro opciones con su veredicto → cierre con resumen y
coda sin voz para la música de cierre.

## Qué cortar
Lo que ya cortaba `dora-v2` (tomas falsas y charla del equipo) más repeticiones y el tramo menos fuerte de cada
opción (ver `informe.md`). Quedarse siempre con la última toma buena.

## Gráficos y 3D
Todos los componentes del estilo: registro show (titulares de juego, opciones con foco y veredicto, contadores),
registro editorial (listas, comparativas, citas y claves con palabras resaltadas…), láminas de cómic con bocadillos y
capturas de la norma oficial, bocadillos sueltos, reacciones en las preguntas, sellos en las ideas clave, 3D toon (un
objeto por capítulo como mucho). Los gráficos resumen lo que dice la voz: sin datos, cifras ni decisiones inventadas.

## Subtítulos y textos
Español. Grafías: DORA, SIEM, EDR, VDI, SaaS, ISO 27001, SOC 2, shadow IT, due diligence, prerrequisito, prórroga
(`fixes` heredados de `dora-v2`).

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos, subtítulos destacados ni informes. Rótulos
genéricos («Docente del curso», «DORA · Casos prácticos»). Láminas sin personas reales, sin marcas y sin texto.

## Entregables
- `resultados/dora-milikito.mp4` (render en Lambda, 1920×1080) — pendiente del motor y del OK del usuario
- `proyectos/dora-milikito/capitulos.txt` (capítulos de YouTube)
- `proyectos/dora-milikito/informe.md`
