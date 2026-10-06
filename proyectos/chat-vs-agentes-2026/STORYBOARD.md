---
format: 1920x1080
duration: 125s
message: "El chat contesta; el agente trabaja con tus archivos y herramientas y te entrega el trabajo hecho"
arc: "Logo → Gancho → Diferencia → Cómo trabaja → «Produce» → 4 producciones simuladas → 4 áreas → Nombres → Control → Cierre → Logo"
audience: "profesionales no técnicos de audiovisual, marketing, ventas y recursos humanos"
mode: collaborative
---

# Chat o agente — v2 «anuncio de producto dinámico»

## Decisiones (v2)

- **Cambio de rumbo (feedback del usuario tras ver v1):** v1 era un explainer limpio pero básico. v2 es un anuncio de producto muy visual, con motion graphics, que **simula lo que produce el agente**: vídeo con código, imágenes, landing, presentaciones.
- **Estilo:** variante `lanzamiento-dinamico` de `lanzamiento-minimal`. Misma paleta de la web de OpenWebinars (violeta #7D29E0, rosa #FF01A2, tinta #0D1320, fondo #FAFBFC) más **violeta profundo #2F125E** para planos oscuros de producción, degradados violeta→rosa permitidos en campos de color, energía alta, spring con rebote, desenfoque de movimiento en cada corte y grano sutil.
- **Ritmo:** planos de 4–9 s y un cambio visual cada 2–3 s dentro de cada plano. Alternancia claro (logo, gancho, cierre) / color y oscuro (producciones) para dar puntuación.
- **Espina:** **el orbe del agente**, un cursor/orbe violeta con estela que ejecuta cada tarea (escribe código, marca fallos, corta la landing, lanza las diapositivas) y se desinfla/estira con humor al cerrar cada una. Es el mismo en todos los planos.
- **Simulación honesta:** las interfaces son dibujadas y genéricas, sin marcas de terceros ni datos reales; una etiqueta discreta «Simulación» en las cuatro producciones. Sin nombres de modelos ni versiones.
- **Logo:** solo sobre fondo claro, SVG oficial sin recolorear; se anima por trazo, brillo y pulso (v1) y el aro **se expande hasta convertirse en el campo violeta** del plano siguiente.
- **Sonido:** locución ElevenLabs `eleven_v4` (reutiliza l02 y l14; 10 líneas nuevas), cama musical propia (a decidir), efectos de UI sintetizados (tecleo, clic, whoosh, pop, riser) y desenfoque de corte con whoosh. Mezcla a −16 LUFS / −1,5 dBTP al entregar.
- **Veracidad:** hechos de producto (Cowork/Work, permisos, planes) de `fuentes.md`. «Vídeo con código con Remotion o HyperFrames» se apoya en las webs oficiales de ambos (a añadir a `fuentes.md`); imágenes, landing y presentaciones son ejemplos de uso con un agente con herramientas, mostrados como simulación ilustrativa. No se promete disponibilidad en España/UE.
- **Referencias:** `referencias-v2.md` (solo inspiración; sin marcas, textos ni música ajenos).

## Frame 01 — Logo sting

- status: outline
- duration: 3.6s
- blueprint: logo-assemble-lockup (outline draws on)
- scene: Fondo claro; el logo se dibuja por trazo, brilla y el aro se expande hasta llenar la pantalla de violeta
- voiceover: ""
- seam: iris del aro → campo violeta (iris-reveal)

## Frame 02 — Gancho

- status: outline
- duration: 6.0s
- blueprint: kinetic-type-beats
- scene: Campo violeta → blanco; «UN TEXTO.» se desvanece con desenfoque y «EL TRABAJO HECHO.» golpea con sacudida y estallido de archivitos
- voiceover: "¿Y si, en vez de pedirle un texto a la IA, le pidieras el trabajo hecho?" (l02, ya generada)
- seam: whip horizontal con desenfoque

## Frame 03 — La diferencia

- status: outline
- duration: 12.0s
- blueprint: comparison-split + agent-progress-theater
- scene: Pantalla partida. Izquierda «CHAT»: burbuja del usuario y respuesta que se escribe. Derecha «AGENTE»: ventana con la carpeta, los archivos vuelan, el orbe los ordena, panel de pasos (Leyendo → Analizando → Creando) con checks y documento «Hecho». El divisor barre para dejar solo el lado agente
- voiceover: "Esa es la diferencia. En chat, la IA contesta. Con la aplicación de escritorio, trabaja: abre tus archivos, sigue un encargo paso a paso y te entrega el resultado."
- seam: el documento crece y llena el cuadro

## Frame 04 — Cómo trabaja

- status: outline
- duration: 12.4s
- blueprint: constellation-hub
- scene: Carpeta en el centro; archivos que orbitan; nodos genéricos (Correo, Calendario, Clientes) saltan al anillo con líneas que se dibujan; reloj que gira para «tareas largas» mientras el orbe sigue trabajando en segundo plano
- voiceover: "Eliges una carpeta y se acabó subir y bajar archivos. Se conecta a tu correo, tu calendario o tu gestor de clientes, y sigue con tareas largas mientras tú haces otra cosa."
- seam: colapso del anillo a un punto que explota en el siguiente plano

## Frame 05 — «Produce»

- status: outline
- duration: 3.0s
- blueprint: kinetic-type-beats
- scene: Fondo violeta profundo; «Y no solo escribe.» pequeño, y «PRODUCE.» enorme que entra con sacudida cromática
- voiceover: "Y no solo escribe. Produce."
- seam: corte seco al editor

## Frame 06 — Producción 1: vídeo con código

- status: outline
- duration: 8.5s
- blueprint: prompt-type-submit-generate + device-surface-showcase
- scene: Editor oscuro con código que se escribe (1 carácter por fotograma); a la derecha, el vídeo cobra vida a medida que el código aparece (formas, titular, logo), línea de tiempo con clips y playhead; anillo de render al 100 % y «MP4 listo»
- voiceover: "Puede escribir el código de un vídeo, con herramientas como Remotion o HyperFrames, y renderizarlo."
- label: «Simulación · Vídeo con código»
- seam: el vídeo se despega y vuela a una cuadrícula

## Frame 07 — Producción 2: imágenes

- status: outline
- duration: 8.5s
- blueprint: prompt-type-submit-generate + panel-edit-live-sync
- scene: El prompt se escribe, la imagen (ilustración vectorial genérica) se genera por partículas; el orbe dibuja cajas de detección con etiquetas («Borroso», «Logo torcido», «Sombra dura»); corrección en vivo y barrido antes/después
- voiceover: "Generar imágenes, revisarlas, detectar lo que falla y corregirlo."
- label: «Simulación · Imágenes»
- seam: iris sobre la imagen corregida

## Frame 08 — Producción 3: landing

- status: outline
- duration: 8.5s
- blueprint: camera-journey + cursor-ui-demo
- scene: Ventana de navegador con una landing plana (una sola imagen); líneas de corte barren y la cortan en 5 secciones que se despegan y se recomponen como bloques HTML; el cursor del orbe pulsa «Publicar» y la página hace scroll con cámara
- voiceover: "Montar una landing, cortarla en secciones y dejarla lista para publicar."
- label: «Simulación · Landing»
- seam: scroll de la landing se transforma en diapositivas

## Frame 09 — Producción 4: presentaciones

- status: outline
- duration: 7.0s
- blueprint: grid-card-assemble + comparison-split
- scene: Diapositivas que entran en 3D con tilt y desfase, se organizan en una cuadrícula, una crece a pantalla completa con un gráfico de barras que se anima y un título; carrusel rápido
- voiceover: "Y preparar presentaciones que entran por los ojos."
- label: «Simulación · Presentaciones»
- seam: zoom-out al «lienzo de áreas»

## Frame 10 — Cuatro áreas

- status: outline
- duration: 19.0s
- blueprint: spatial-pan-stations
- scene: Un lienzo con 4 estaciones recorridas por cámara: Marketing (briefing y gráfico del informe de los lunes), Ventas (reunión preparada y memo), RR. HH. (plan de incorporación y descripción de puesto con candado de «sin datos personales»), Audiovisual (conceptos, guion y archivos renombrados). Cada estación con su color y su titular cinético
- voiceover: "En marketing, briefings, campañas y el informe de cada lunes. En ventas, la reunión preparada y el memo listo. En recursos humanos, planes de incorporación y descripciones de puesto, sin pegar datos personales. En audiovisual, conceptos, guiones y archivos en orden."
- seam: la cámara se aleja y las estaciones se pliegan en dos columnas

## Frame 11 — Los nombres

- status: outline
- duration: 8.0s
- blueprint: comparison-split
- scene: Dos columnas «CLAUDE» y «CHATGPT» que entran con tilt de libro; filas «Chat / Modo agente (antes Cowork) / Work»; «Claude Code · Codex = programar» al 55 %
- voiceover: "En Claude, el modo agente, antes llamado Cowork. En ChatGPT, Work. Claude Code y Codex, para programar."
- seam: whip

## Frame 12 — Control

- status: outline
- duration: 11.0s
- blueprint: cursor-ui-demo
- scene: Diálogo simulado «¿Permitir editar 3 archivos?» con el cursor del orbe esperando; la carpeta elegida rodeada por una valla; tres interruptores que se activan; el usuario pulsa «Permitir» y el orbe sigue
- voiceover: "Tú mantienes el control: eliges las carpetas, ves cada paso y te pide permiso antes de actuar. Algunas funciones cambian según tu plan y tu país."
- seam: fundido a claro

## Frame 13 — Cierre

- status: outline
- duration: 9.0s
- blueprint: titlecard-reveal
- scene: Fondo claro; «Chat para preguntar.» y «Agente para que te entregue el trabajo hecho.» a gran tamaño; pieza sostenida de 2 s antes del logo
- voiceover: "Chat para preguntar. Agente para que te entregue el trabajo hecho. Empieza por una tarea pequeña de tu semana." (l14, ya generada)
- seam: el texto se contrae al aro del logo

## Frame 14 — Logo de cierre

- status: outline
- duration: 4.5s
- blueprint: logo-assemble-lockup
- scene: Logo de OpenWebinars animado por trazo y brillo sobre fondo claro; pulso final y fundido
- voiceover: ""
