# ref-milikito · proyecto de análisis (no es un vídeo a renderizar)

Análisis a fondo de `brutos/milikito.mp4` (42:13, masterclass en directo de OpenWebinars) para crear la guía de
estilo `estilos/milikito/`. No tiene guion ni timeline y no se renderiza.

- `work/analisis/`: `tools/kaleidos analizar` (metadatos, escenas, movimiento, sonoridad, hojas de contactos).
- `work/transcripcion.{json,txt}`: `tools/kaleidos transcribir` (large-v3-turbo). **Contiene el nombre real del
  ponente: no se cita ni se copia a guías, rótulos ni informes.**
- `work/estilo/estructura.mjs` → `estructura.json` (disposición y contenido de cada segundo) y `eventos.json`
  (cambios de diapositiva y de disposición).
- Resultado: `estilos/milikito/` (estilo.md, tokens.json, fonts/, referencias/).
