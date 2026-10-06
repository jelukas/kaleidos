# Progreso del catálogo de estilos

Estado de trabajo para poder retomar si se interrumpe. Se actualiza a medida que avanza.

## Hecho
- [x] Lectura de `docs/CONTRATO.md` §5 y `docs/METODO_EDICION_IA.md` §7.6
- [x] Lectura de modelos `frame.md` / `design.md` y de `hyperframes-creative` (design-spec, design-adherence, visual-styles, frame-presets)
- [x] Investigación de fuentes de los 9 estilos (videos-opus, solo lectura) y hojas de contactos de los renders
- [x] `_esquema/tokens.schema.json`, `_esquema/validar.mjs` (probado con un tokens roto a propósito), `_esquema/unicode-ranges.json`
- [x] Herramientas: `_esquema/fuentes.mjs`, `fontface.mjs` (con `--escribir`), `captura.mjs`, `muestrario.mjs`
- [x] Fuentes instaladas en los 9 estilos (todas OFL-1.1, latin + latin-ext, @fontsource 5.3.0)
- [x] 9 × `tokens.json` (contraste AA comprobado; también pasan el esquema zod de `motor/src/datos/contrato.ts`)
- [x] 9 × `estilo.md` (frontmatter YAML validado con pyyaml; bloque de @font-face generado)
- [x] 9 × `referencias/` (fotogramas sin caras reales ni nombres reales; muestrarios en vox-corto, clase-oscura-cristal y acuarela-ilustrada)
- [x] Validador en verde para los 9 (`node estilos/_esquema/validar.mjs`)
- [x] `README.md` del catálogo
- [x] `.claude/skills/estilos-video/SKILL.md` (7 procedimientos; variante probada de punta a punta en una copia temporal)
- [x] Herramientas añadidas para la skill: `_esquema/adherencia.mjs`, `_esquema/hoja.sh`, `muestrario.mjs --todas`

## Pendiente
- Nada del encargo. Posibles mejoras: renders reales de `vox-corto`, `clase-oscura-cristal` y `acuarela-ilustrada`
  cuando existan (sustituir los muestrarios); decidir en el contrato las extensiones opcionales del motor.

## Decisiones
- Colores con transparencia en la fuente (filetes `rgba(...)`) → su equivalente opaco sobre el fondo en `linea`.
- Estilos claros con subrayador (lima en cuaderno): el subrayador va en `superficie2` y `subtitulos.palabraActiva: "subrayado"`;
  el `acento` es siempre un color legible como texto (≥ 3:1 sobre el fondo).
- Ensaya en tokens usa su registro tinta/bosque (lima legible como texto); el registro marfil se documenta en `estilo.md`.
- `archivos`: latin-ext antes que latin (si un motor ignora `unicode-range`, gana latin, que cubre el español).
- El esquema es estricto con §5 (sin claves extra). El motor admite además `color.sobreAcento`, `color.tinta` y
  `fondo.grano` opcionales: si el contrato los adopta, añadirlos a `tokens.schema.json`.
- Las escenas de muestra de los estilos sin render se generaron con un script temporal (no versionado); el
  muestrario de tokens (`00-muestrario.jpg`) se regenera con `_esquema/muestrario.mjs`.
