# Referencias visuales v2 — «Chat vs agentes de escritorio» (anuncio de producto súper dinámico)

Fecha de la investigación: 2026-10-02. Solo lectura de páginas y capturas de miniaturas; no se ha descargado ningún vídeo ni archivo.

## Aviso de método (leer primero)

- No he podido **reproducir y analizar fotograma a fotograma** casi ninguno de los vídeos (los `.mp4` de HyperFrames se citan por URL pero no se descargan; YouTube mostró un anuncio previo y Vimeo/Behance bloquearon parcialmente la lectura).
- Por eso cada ficha distingue entre **VERIFICADO** (texto literal de la página, prompt publicado, metadatos del reproductor o captura vista) y **NO VERIFICADO** (lo que sería necesario ver reproduciendo el vídeo: música, sonido, cortes reales).
- Las técnicas de las fichas 1-6 proceden de **descripciones y prompts publicados por sus autores**, no de haber visto el vídeo. Las del apartado «Técnicas a replicar» son una síntesis de ese material y se deben validar con una prueba propia.
- Sin nombres de personas: se cita solo cuenta de empresa/producto o «autor».

---

## Fichas

### 1. HyperFrames — Showcase de películas de lanzamiento (HeyGen)
- **URL**: https://hyperframes.heygen.com/examples
- **Plataforma**: documentación oficial de HyperFrames (vídeos `.mp4` alojados por HeyGen). Algunas entradas indican «source included».
- **Duración**: NO VERIFICADO (la página no la indica; son piezas cortas).
- **Piezas relevantes** (URLs `.mp4` verificadas en la página, prefijo `https://static.heygen.ai/hyperframes-oss/docs/images/showcase/`):
  - `launch-HF-heygen-stripe-v1-s.mp4` — «Product launch, 4K · 100% HyperFrames».
  - `launch-k3-promo-v1-s.mp4` — «Short product spot».
  - `launch-website-to-hyperframes-v1-s.mp4` — convertir una web en vídeo promocional (fuente incluida).
  - `launch-keyframes-launch-v1-s.mp4` — animación «seek-safe».
  - `launch-vfx-heygen-combined-v1-s.mp4` — «Shaders and effects».
  - `launch-music-to-video-launch-v1-s.mp4` — «Cuts synced to a track» (cortes sincronizados con la música).
  - `launch-claude-design-hyperframes-video-v1-s.mp4` — «From a design draft».
  - `launch-pr-to-video-launch-v1-s.mp4` — PR de GitHub convertido en vídeo.
- **Técnicas (según las descripciones de la página)**:
  1. Cortes sincronizados a una pista de música (cuadrícula de beats).
  2. Shaders/efectos de transición como firma visual (VFX reel).
  3. Captura de una web real convertida en escenas animadas (la UI real como protagonista).
  4. Diseño parametrizable: «una composición, muchas versiones» (variables) → útil para versionar el vídeo por sector (audiovisual, marketing, ventas, RR. HH.).
  5. Visualización de cambios de código como revelado animado (diff).
- **Qué NO está verificado**: ritmo exacto de cortes, diseño de sonido, tipografías.

### 2. HyperFrames — Prompts verificados (galería con duración y técnicas por pieza)
- **URL**: https://hyperframes.heygen.com/prompting/examples
- **Plataforma**: documentación oficial HyperFrames (vídeos `.mp4`, prefijo `https://static.heygen.ai/hyperframes-oss/docs/images/prompting/`).
- **Duración / técnica por pieza (texto de la página, VERIFICADO)**:
  - `example-product-launch-v2.mp4` — 45 s: captura por URL, narración TTS, «feature beats».
  - `example-loader-ready.mp4` — 7 s: anillo de progreso, contador de porcentaje, estallido radial. **Muy útil para «la IA trabajando»**.
  - `example-before-after.mp4` — 8 s: divisor vertical que barre, línea de escaneo con bloom, cambio de estado. **Útil para «antes/después» de editar imagen o landing**.
  - `example-word-swap.mp4` — 8 s: titular con cambio de palabra tipo panel de aeropuerto, desenfoque de movimiento.
  - `example-stat-countup.mp4` — 6 s: contador tipo odómetro, ráfaga de partículas.
  - `example-vertical-hook.mp4` — 9 s: cortes secos, barras de resalte, sacudida con separación cromática.
  - `example-bar-race.mp4` — 10 s: barras que se adelantan con crecimiento escalonado.
  - `example-3d-cards.mp4` — 9 s: cámara isométrica, tarjetas que se elevan, barrido especular.
  - `example-pr-video-v2.mp4` — 30 s: bloque de diff de código, barrido de luz, subtítulos cinéticos.
  - `example-music-slideshow-v2.mp4` — 20 s: imágenes generadas, sincronía con cuadrícula de beats, split RGB.
- **Qué aprender**: son microescenas de 5-10 s que se pueden reutilizar como «bloques» (loader, contador, antes/después, tarjetas 3D).

### 3. HyperFrames — Guía de vídeos de lanzamiento de producto
- **URL**: https://hyperframes.heygen.com/prompting/product-launch
- **Plataforma**: documentación oficial.
- **Duración**: ejemplos de 45 s (estándar) y 20 s vertical (teaser). Vídeos de ejemplo: `.../prompting/example-product-launch-v2.mp4` (marca «Linear.app» como demostración, por lo que NO se copia) y `.../variant-launch-script-v2.mp4`.
- **Técnicas / estructura (VERIFICADO en texto)**:
  1. Narrativa **gancho → valor → evidencia → CTA**.
  2. Estándar 45 s: gancho (problema) → **3 beats de funcionalidad con capturas de UI y subtítulos** → tarjeta final con logo/CTA.
  3. Teaser 20 s vertical: problema + 2 beats + cierre con animación en reposo.
  4. Guion a ~130 palabras por minuto (30 s = 65-70 palabras).
  5. Parámetros: fuente de paleta (colores de la propia web), nivel de música en dB, relación de aspecto 16:9 / 1:1 / 9:16.

### 4. Remotion Prompt Showcase — «Launch Video on X» (producto: agente de escritorio de IA, código abierto)
- **URL**: https://www.remotion.dev/prompts/launch-video-on-x
- **Plataforma**: galería oficial de prompts de Remotion (el vídeo se ve en la página; el prompt está publicado completo).
- **Duración**: ~37 s, 1080x700, 30 fps, 8 escenas en serie (VERIFICADO en el prompt).
- **Estructura por escenas (VERIFICADO)**: terminal 4 s → pantalla de inicio 5 s → chat con panel de pasos 5,3 s → selector de proveedor 4,3 s → catálogo MCP 4,7 s → bots de mensajería 4 s → combo de logos 6 s → CTA GitHub 4 s. Media ≈ 4,7 s por escena (~13 escenas/min).
- **Técnicas (descritas en el prompt)**:
  1. **Terminal Mac que escribe carácter a carácter** (1 fotograma por carácter), con logo ASCII y líneas de salida que aparecen progresivamente: «código que se escribe».
  2. Ventana que entra desde abajo con **perspectiva 3D** (rotateX ≈ 20°, ligera oscilación en rotateY).
  3. **Panel lateral de progreso** con pasos (Leyendo → Analizando → Aplicando → Creando PR) y **llamadas a herramienta con checks verdes**: la forma más clara de mostrar «la IA trabajando».
  4. Entradas con **spring y retardos escalonados** (título → subtítulo → input → controles).
  5. Modal de catálogo con filtros en píldora y tarjetas con insignias.
  6. Cierre con etiqueta, logo giratorio y estrellas orbitando.
- **No copiar**: la pista de música que nombra el prompt (obra con derechos); producto, nombre y textos.
- **NO VERIFICADO**: cómo queda realmente la animación (no reproduje el vídeo).

### 5. Remotion Prompt Showcase — «Product Demo for Presscut»
- **URL**: https://www.remotion.dev/prompts/product-demo-for-presscut
- **Plataforma**: galería oficial de prompts de Remotion.
- **Duración**: 1:24 (VERIFICADO en el reproductor de la página).
- **Qué se vio (captura de la miniatura, VERIFICADO)**: fondo claro con trama de semitono; **tarjetas de titulares flotando y rotadas** en distintos ángulos; **titular serif grande centrado** («Writing newsletter commentary takes forever.») sobre las tarjetas.
- **Técnicas**:
  1. Réplica de la UI del producto con componentes React (el prompt lo pide expresamente): no hay capturas, se «dibuja» la interfaz.
  2. Tarjetas de contenido dispersas como metáfora del problema (el «ruido») antes de mostrar la solución.
  3. Tipografía serif editorial grande sobre fondo texturizado como contrapunto a la UI.
  4. Enfoque «demo con un cliente»: lenguaje simple y directo, pocas funcionalidades destacadas.
- **NO VERIFICADO**: transiciones y cursor (no reproducido).

### 6. RemotionUI — Showcase: «Supabase product demo» (concepto no oficial) y «RemotionUI launch film»
- **URL**: https://remotionui.com/showcase
- **Plataforma**: web de la herramienta (código fuente enlazado en GitHub desde la página).
- **Duración**: 48 s (demo) y 34 s (película de lanzamiento) — VERIFICADO en el texto.
- **Técnicas (texto de la página)**:
  1. **Cámara virtual** que recorre un único lienzo con capturas reales de dashboard.
  2. **Cursor «anclado» a elementos de la UI** (se mueve hacia el elemento y hace clic).
  3. Componentes del registro renderizados «en vivo» dentro del vídeo (hero en bucle, intro, grano de ruido animado, revelado de logo).
  4. Banda sonora **sincronizada al fotograma** (frame-locked score).
  5. Grano animado como textura global.
- **NO VERIFICADO**: velocidades de cámara y cortes.

### 7. Anthropic — «Introducing Cowork: Claude Code for the rest of your work»
- **URL**: https://www.youtube.com/watch?v=UAmKyyZ-b9E
- **Plataforma**: YouTube (canal oficial de Anthropic).
- **Duración**: 1:09 (según la lista de resultados de YouTube). ~949 mil visualizaciones en el momento de la consulta.
- **Técnicas**: NO VERIFICADO. Un anuncio previo ocupó el reproductor y no pude ver los fotogramas. Es la referencia temática más directa («agente que trabaja sobre tus archivos» frente a chat), así que **conviene verla manualmente** antes de diseñar.
- **Material adicional verificado**: la página de producto https://claude.com/product/cowork muestra tres demos en vídeo (marketing, ventas, legal) con enlaces a tutoriales en `academy.claude.com`; sirven como idea de casos de uso de ventas/marketing.

### 8. Canva — «Introducing Canva AI 2.0 | Canva Create 2026»
- **URL**: https://www.youtube.com/watch?v=WJ8Jj44ehWE
- **Plataforma**: YouTube (canal oficial de Canva).
- **Duración**: ~14:09 (848,8 s leídos del reproductor). Es una **presentación/keynote**, no un anuncio corto: relevancia baja como ritmo, útil solo para ver cómo muestran generar/editar diseños, presentaciones y documentos con IA.
- **Técnicas**: NO VERIFICADO (no reproducido).

### 9. Behance — «SaaS Product Demo Video with UI Animation» (estudio de motion para SaaS)
- **URL**: https://www.behance.net/gallery/247649847/SaaS-Product-Demo-Video-with-UI-Animation
- **Plataforma**: Behance (publicado el 18 de abril de 2026).
- **Duración**: NO VERIFICADO.
- **Técnicas (texto de la página, VERIFICADO)**: demo de plataforma de hostelería centrada en **animación de UI** y **narración por funcionalidades**; mezcla motion graphics, **3D mínimo de UI** y **acentos de neón suave**; destaca reserva, mensajería y automatización con un formato modular.

### 10. Vimeo — «SaaS Demo Video for AI Automation Platform» y «Modern SaaS Promotional Video with Motion Graphics»
- **URLs**: https://vimeo.com/1148407756 · https://vimeo.com/1149369423
- **Plataforma**: Vimeo.
- **Duración / técnicas**: NO VERIFICADO. Vimeo mostró una verificación anti-bot que no se resuelve. Solo el resumen de la búsqueda indica motion graphics, UI animada y efectos 3D para flujos de trabajo de IA. No usar como referencia hasta verlos manualmente.

### 11. launchvideo.dev — película de referencia de 8 escenas
- **URL**: https://www.launchvideo.dev/
- **Plataforma**: web de una herramienta (vídeos de lanzamiento animados con agente).
- **Duración**: NO VERIFICADO (no hay enlace al vídeo en la página leída).
- **Principios declarados (VERIFICADO en texto)**: **animación con spring en lugar de curvas de easing**, **«transit blur» (desenfoque de movimiento) en cada corte**, 30 fps, 1920x1080, fotogramas deterministas, y usar **componentes reales** del producto en vez de grabaciones de pantalla.

### 12. Kiln — «We made our launch video with Claude Code» (artículo)
- **URL**: https://techbytes.app/posts/we-made-our-launch-video-with-claude-code-and-open-sourced-the-tool/
- **Plataforma**: artículo (el enlace al vídeo no aparece en el contenido leído → NO VERIFICADO).
- **Técnicas (VERIFICADO en texto)**: guion humano, animaciones generadas por el agente (SVG animado, Lottie, React/Svelte en navegador); **los beats del vídeo se ajustan a marcas de tiempo por palabra** de la locución; captura del servidor de desarrollo a 60 fps.

### 13. Remotion — Showcase oficial (productos que usan Remotion)
- **URL**: https://www.remotion.dev/showcase
- **Plataforma**: web oficial.
- **Relevantes para este proyecto (VERIFICADO solo el título/descripción corta)**: *SuperMotion* (vídeos de producto desde grabaciones o capturas de pantalla), *Hackreels* (animación de código), *Remotion Recorder* (screencasts), *Vibrantsnap* (demos y tutoriales).
- **Técnicas**: NO VERIFICADO (la galería enlaza a vídeos que no se abrieron).

---

## (a) Técnicas a replicar (priorizadas, en HTML/CSS/GSAP/SVG)

1. **Terminal/editor que «escribe» el código**: caracteres revelados con `gsap.to` sobre un contador entero (1 carácter por fotograma a 30 fps), cursor parpadeante y líneas de salida con retardo escalonado; sirve para «Remotion/HyperFrames generando el vídeo».
2. **Panel de pasos de tarea con checks**: lista vertical «Leyendo → Analizando → Generando → Entregando»; cada fila pasa de punto gris a spinner SVG y luego a check verde, con `stagger` de 0,5-0,8 s; es el recurso principal para mostrar «la IA trabaja sola».
3. **Ventana de navegador/app simulada en HTML** (con puntos de semáforo, barra de URL y contenido real dibujado con divs), nunca capturas: permite editar la landing, cortar una sección y corregir un texto en vivo.
4. **Cursor coreografiado**: un SVG de cursor que viaja con `motionPath` o `power2.inOut` a un botón, se «pulsa» (escala 0,9 → 1) y dispara el cambio de estado de la UI; anclarlo siempre a la posición del elemento destino.
5. **Cámara virtual**: un contenedor `#world` con `scale` y `x/y` animados (zoom-in a un detalle, zoom-out para mostrar el conjunto) sobre un lienzo único con varias ventanas.
6. **Spring con retardos escalonados** (`ease: "back.out(1.4)"` o `elastic.out(1, 0.6)`) para entrada de titulares, tarjetas y chips: nada entra con fundido lineal.
7. **Antes/después con divisor que barre** (`clip-path: inset()` animado + línea brillante) para mostrar «foto original → foto corregida» y «landing antes → después».
8. **Capas que se apilan**: elementos de una presentación, una imagen o una hoja que caen uno a uno con desplazamiento y ligera rotación hasta formar el resultado final; refuerza «el agente construye».
9. **Tipografía cinética de bloques**: palabras clave grandes (ej. «CHAT» frente a «AGENTE») que entran en ráfaga, con cambio de palabra tipo panel de aeropuerto (rotación vertical) para contrastar conceptos.
10. **Bloques de color a pantalla completa y splits** (2-3 paneles que se deslizan) como puntuación entre escenas y para comparar chat vs agente en paralelo.
11. **Contadores y barras de progreso** (odómetro, anillo de porcentaje con `stroke-dashoffset`) para cifras de tiempo ahorrado y para cargas de generación.
12. **Transiciones con desenfoque de movimiento** (`filter: blur()` breve en el corte, 4-6 fotogramas) y grano animado global muy sutil (SVG `feTurbulence`) para dar acabado de producto premium.

## (b) Estructura narrativa típica

- **Duración habitual de las piezas encontradas**: 34-48 s en demos de lanzamiento, 37 s la película de 8 escenas, hasta 1:24 en una demo completa; para ~2 min conviene dividir en **capítulos de 15-20 s**.
- **Ritmo observado**: planos de **4-6 s** (≈ 10-14 cortes por minuto) en el ejemplo de 8 escenas; micro-bloques de **5-10 s** en los ejemplos de HyperFrames; escena final de 4-6 s.
- **Esquema común (documentado en la guía de HyperFrames)**: gancho con el problema (3-5 s) → 3 beats de funcionalidad con UI y subtítulos → prueba/evidencia (cifra) → tarjeta final con CTA.
- **Propuesta para este vídeo de ~2 min (hipótesis de trabajo, no extraída de una fuente)**: 0:00-0:12 gancho «chat = conversación, agente = trabajo hecho»; 0:12-1:30 cuatro bloques de ~20 s (vídeo con código, imagen, landing, presentación/documentos) mostrados con la UI simulada y el panel de pasos; 1:30-1:50 sectores (audiovisual, marketing, ventas, RR. HH.) en splits rápidos; 1:50-2:00 CTA.
- **Sonido**: según las fuentes, música con cortes sincronizados a la cuadrícula de beats y música a ~40 % en el ejemplo de 37 s. Efectos concretos de UI (clic, tecleo, «whoosh»): NO VERIFICADO en las fuentes; decisión de diseño propia.

## (c) Qué NO copiar

- **Marcas y logos** de los productos de las fichas (agente de escritorio de código abierto, Presscut, Supabase, Canva, Linear, Stripe, Anthropic/Cowork, etc.): son solo inspiración. El vídeo debe usar interfaces genéricas o las marcas que tú indiques.
- **Textos y guiones ajenos**: titulares, taglines y copys de los ejemplos (p. ej. los de la película de 8 escenas o el titular serif de la demo de Presscut).
- **Música**: no usar la pista nombrada en el prompt del ejemplo de 37 s ni ninguna banda sonora de los vídeos citados. Generar música propia (`eleven_music_v2_5`) o usar una licenciada.
- **Imágenes, capturas y miniaturas** de las fuentes; las miniaturas solo se miraron para el análisis.
- **Capturas con datos reales** de personas o clientes (política de la organización): rótulos y documentos de la UI simulada deben ser ficticios y genéricos.
- **Réplicas fieles**: las skills tipo «clone mode» pueden reconstruir un vídeo fotograma a fotograma; aquí no se debe clonar ninguna pieza concreta, solo reutilizar técnicas.

## Lista de pendientes de verificación manual

1. Ver completo https://www.youtube.com/watch?v=UAmKyyZ-b9E (1:09) para medir ritmo, tipografía y cómo muestra el trabajo del agente.
2. Reproducir los `.mp4` de las fichas 1 y 2 (sin descargarlos al repo si no hace falta) para medir cortes/min y el sonido.
3. Abrir los dos Vimeo de la ficha 10 desde un navegador normal.
4. Ver los vídeos de la ficha 4 y 5 en la propia galería de Remotion para comprobar cursor y transiciones.

## Fuentes consultadas

- https://hyperframes.heygen.com/examples
- https://hyperframes.heygen.com/prompting/examples
- https://hyperframes.heygen.com/prompting/product-launch
- https://hyperframes.heygen.com (índice) y búsqueda de documentación de HyperFrames
- https://www.remotion.dev/prompts/launch-video-on-x
- https://www.remotion.dev/prompts/product-demo-for-presscut
- https://www.remotion.dev/showcase · https://www.remotion.dev/prompts · https://www.remotion.dev/success-stories
- https://remotionui.com/showcase
- https://www.launchvideo.dev/ · https://github.com/per-simmons/launch-video-clone
- https://techbytes.app/posts/we-made-our-launch-video-with-claude-code-and-open-sourced-the-tool/
- https://www.youtube.com/watch?v=UAmKyyZ-b9E · https://www.youtube.com/watch?v=WJ8Jj44ehWE
- https://claude.com/product/cowork
- https://www.behance.net/gallery/247649847/SaaS-Product-Demo-Video-with-UI-Animation
- https://vimeo.com/1148407756 · https://vimeo.com/1149369423
- https://www.ui-skills.com/collections/videos
