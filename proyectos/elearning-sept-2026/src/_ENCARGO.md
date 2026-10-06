# Encargo para los agentes de escena — «E-learning corporativo: septiembre 2026» (resumen de noticias para el evento del lunes)

Eres un **motion designer sénior**. Construyes UNA o varias escenas de un vídeo de **3:54**, 1920×1080, 30 fps, en HTML + CSS + GSAP + SVG (HyperFrames **0.8.86**). Es un **resumen de noticias del e-learning corporativo** de septiembre de 2026 y de la última semana (28 sep – 2 oct) que se proyectará en el evento de OpenWebinars (lunes 5 de octubre). Lo que se busca: **dinámico, divertido, MUY visual, con motion graphics de nivel profesional, capturas de pantalla reales y vídeos oficiales**. Nada de «diapositiva con viñetas»: cada plano debe sentirse diseñado (jerarquía, profundidad, cámara virtual, rebote con intención, números que cuentan, ventanas con zoom a la frase clave, resaltados), con algo nuevo cada 1,5–3 s. Cada noticia debe poder **leerse de un vistazo** aunque no se oiga la voz: titular corto + dato clave + fuente.

## Qué ya existe (léelo antes de escribir)

- `frame.md`: estilo (paleta de la web de OpenWebinars: violeta #7D29E0, rosa #FF01A2, tinta #0D1320, fondo #FAFBFC, violeta profundo #2F125E, índigo #5E3DE6, lavanda #9B61F6, lila #F2E7FC, aviso #B54708). Tipografía **Inter** (400/600/800) y **JetBrains Mono** (400). **Solo estas fuentes** (ya cargadas por el ensamblador).
- `src/_kit.css` y `src/_kit.js`: **kit compartido** inyectado en tu escena. Clases: `.h .mask .eye .panel .chip .win .orb .ripple .bg-* .simlabel` y de noticias `.shotwin .hlbox .badge(.week/.date/.src/.dk/.srcdk) .tag .strip`. Helpers: `rise up pop fade slam typeText count orbTo orbSet orbSquash orbPulse clickAt sceneIn sceneOut cue beat` y de noticias `dateStrip shotSet shotCam shotPos hl dayIndex dayLabel`. Constantes: `tl E SPR IO Q $q $$q ID DUR CUES BEATS DATES PREV BLOCK COLOR WEEK`. **Léelos**; no los modifiques.
- `work/scenes.json`: por escena `start`, `dur`, `theme`, `block`, `color`, `dates`, y las **palabras de la locución con su tiempo relativo a la escena** (`words[].s/e`) y los **pulsos de la música** (`beats`, 120 BPM). Tu escena recibe `CUES`/`BEATS` inyectados: usa `cue("palabra")` / `cue(índice)` (por prefijo; `cue("el",1)` para la 2.ª coincidencia) para que cada elemento aparezca **cuando la voz lo dice**, y `beat(t)` para clavar golpes al ritmo.
- `STORYBOARD`: no existe esta vez; **tu especificación es la sección de tu escena al final de este fichero**.
- Los fotogramas de otros vídeos (`../chat-vs-agentes-2026`) son referencia de acabado: puedes leer `../chat-vs-agentes-2026/src/*.html` para ver cómo se resolvieron ventanas, cursor, cámara, partículas y contadores (copia ideas, no ficheros).

## Recursos reales (`assets/`)

**Capturas de pantalla** (`assets/captures/<id>.png`, **2880×1800 px = viewport de 1440×900 CSS px a 2×**): son páginas oficiales reales. Colócalas con `<img src="assets/captures/x.png">` dentro de un `.shotwin` y usa **natW=1440, natH=900** en `shotSet/shotCam` (las coordenadas `fx,fy` son px CSS de la captura, 0–1440 × 0–900). Con zoom hasta s≈2,4 siguen nítidas. **Mira cada PNG** (herramienta Read) para elegir qué zona enseñar. Cada captura tiene un `.txt` con el texto de la página (para verificar y para citar). Disponibles: `oa-academy oa-dots an-frontier ms-copilot ms-skills gartner-shifts gartner-marketing gartner-fde gartner-fde-body coursera-helix coursera-helix-blog coursera-gsr articulate skillsoft-lx skillsoft-lx-title pearson-workera pearson-its moncloa-22 moncloa-29 boe-35 boe-467 ec-skills eurostat ev-talentday ev-wol ev-devlearn ev-rising 360-companion`.

**Vídeos oficiales** (`assets/video/*.mp4`, **siempre `muted`**; el audio del vídeo lo ponemos nosotros): 
- `helix-demo.mp4` (1920×1080, 3:38; demo oficial de Project Helix de Coursera/Udemy). Momentos útiles (s): 32–38 logo «coursera + udemy»; 72–80 «What do you want to learn today?»; 88–95 «task-specific paths»; 104–112 pantalla de rutas con checks «Personalized and adapts»; 152–160 «Shareable skills record»; 176–182 «where the gaps are»; 192–200 «Practice becomes proof of capability».
- `helix-llm.mp4` (1920×1080, 1:57; segundo vídeo oficial del blog de Helix: el aprendizaje dentro de los asistentes de IA). Momentos (s): 10–14 «Not anymore.»; 15–19 «@Coursera» en ChatGPT / Claude / Copilot; 20–29 «No context switching · Just trusted learning»; 30–40 Agent Store.
- `moncloa-cmin-20260922.mp4` (1920×1080, 14 s, ya recortado; directo oficial del Consejo de Ministros del 22 sep, cuando se anuncian los 250 M€). Sale gente: **no rotules nombres**; trátalo con un duotono violeta/oscuro para unificar.
- `devlearn-header.mp4` (1080×1080, 32 s; bucle de ambiente de conferencia, de la web oficial de DevLearn).
Uso de vídeo: `<video src="assets/video/x.mp4" muted playsinline data-start="T" data-duration="D" data-media-start="M" class="clip">` con tiempos **relativos a la escena**; **sin ancestros con `data-start`** (la ventana contenedora no lleva `data-start`); lee `/Users/openwebinars/.claude/skills/hyperframes-core/references/variables-and-media.md` (§ vídeo) antes. Rotula siempre «Vídeo oficial · <empresa>». Máximo ~6 s por clip. Tu escena decide qué momentos usa.

**Efectos de sonido (ElevenLabs)** en la sección `<!--SFX-->` (`k`): `whoosh whoosh-long impact riser pop click key ding ping shutter stamp glitch shimmer sting counter swipe tick`. Ya se añade un `whoosh` al inicio de cada escena. Ideas: `shutter` cuando «se captura» una página, `stamp` al verificar/sellar un dato, `counter` mientras cuenta un número, `ping` en una notificación, `pop` en chips, `click` en cursor, `impact` en golpes de titular, `glitch` en transiciones, `swipe` en tarjetas, `key`/`tick` en tecleo (un efecto por 3–4 caracteres, no uno por carácter). **Máx. ~8–10 efectos por escena, volúmenes 0,3–0,6.**

## Formato del fichero que entregas: `src/NN-nombre.html`

El nombre exacto de cada escena está en `scenes.config.json` (`file`). Estructura:

```
<!--CSS-->
/* usa el prefijo #__ID__ en todos los selectores; el ensamblador sustituye __ID__ por el id real (s04…) */
#__ID__ .mi-clase { … }
<!--HTML-->
<div class="stage">            <!-- TODO tu contenido dentro de .stage; sceneIn/sceneOut animan .stage -->
  <div class="bg bg-deep clip" data-start="0" data-duration="__DUR__" data-track-index="0"></div>   <!-- fondo a pantalla completa (solo en escenas dark): clase clip con estos atributos -->
  <div class="strip dk"></div>   <!-- tira de calendario (en escenas con fecha); "dk" en escenas dark -->
  …
</div>
<!--JS-->
sceneIn("whip");               // tu código; usa tl y los helpers del kit. NO registres window.__timelines: lo hace el ensamblador
dateStrip([PREV, ...DATES], 0.3, 0.9, 0.8);
…
sceneOut("whip");
<!--SFX-->
[{"k":"shutter","t":1.2,"v":0.5}]  <!-- opcional; t relativo a la escena -->
```

Reglas del tema: **dark** → pinta tú el fondo (`bg-deep` o `bg-violet`), texto blanco, `strip dk`; **light** → el fondo base ya es #FAFBFC con un resplandor violeta→rosa detrás (no pintes fondo opaco; sí puedes usar campos/formas de color). **No hay subtítulos**: tienes todo el cuadro (deja ≥ 40 px de margen). Pantalla, no locución: **no repitas la frase de la voz como texto**; muestra titular corto + dato + fuente. Cada escena de noticia lleva siempre: (1) **etiqueta de bloque** (`BLOCK` en `COLOR`), (2) **insignia de fuente** `.badge.src` con el dominio (p. ej. «openai.com») y la fecha, (3) insignia **«ESTA SEMANA»** (`.badge.week`) si `WEEK` es true, (4) la tira de calendario con el marcador en la fecha de la noticia (`dateStrip`), (5) la captura real en una `.shotwin` con zoom/pan a la zona clave y **resaltado** (`hl`).

## Privacidad (obligatorio)

Nada de **nombres de personas ni correos** en pantalla. Riesgos conocidos: Gartner → bloque «Media contacts» (columna derecha, nombres y correos) y autores en el cuerpo; Articulate y Coursera → firma del autor bajo el titular; Moncloa → personas en el vídeo y en la página; Pearson/BOE → nombres de firmantes. Soluciones: encuadra con `shotCam` para dejar fuera esas zonas, o tápalas con un rectángulo con `backdrop-filter:blur(14px)`/color sólido. Antes de dar por buena la escena, revisa **cada captura** en los instantes capturados y confirma que no se lee ningún nombre propio ni correo. Los textos que escribas tú no incluyen nombres de personas.

## Verificación (obligatoria, tú mismo)

```bash
cd /Users/openwebinars/Dev/kaleidos/proyectos/elearning-sept-2026
node build.mjs --preview=NN-nombre                  # monta SOLO tu escena en work/prev/NN-nombre/
npx --yes hyperframes@0.8.86 snapshot work/prev/NN-nombre --at 0.5,1.5,2.5,… --no-end --describe false -o work/prev/NN-nombre/snap
npx --yes hyperframes@0.8.86 check work/prev/NN-nombre
```
Mira las capturas (`snap/contact-sheet.jpg` y los PNG) en **varios instantes** (entrada, mitad, final) y corrige hasta que se vea profesional. **No ejecutes `node build.mjs` sin `--preview`** (varios agentes a la vez) y no edites ficheros que no sean tus `src/NN-*.html`. Si `check` marca `sweep_static` en tu escena es que no se anima: tu escena sí debe animarse.

## Reglas técnicas (el lint las comprueba)

- Todo determinista: nada de `Date.now`, `Math.random` sin semilla, red ni estados de ratón. Un único timeline `tl` (ya creado). `repeat:-1` prohibido.
- No pongas `transform` CSS inicial en un elemento al que luego animas `x/y/scale/rotation` con GSAP (usa `fromTo`, `xPercent/yPercent` o márgenes). Elementos con `transform` animado: block/inline-block con tamaño real. No animes `display`/`visibility`/`autoAlpha`; usa `opacity`. Sin `<br>` en texto; titulares en `.mask>.r` con `white-space:nowrap`.
- El elemento héroe se ve antes de 0,5 s. Nada de pantalla vacía al inicio.
- Textos legibles (contraste AA; `check` lo mide); ≥ 36 px para texto importante; titulares 110–240 px.
- Sin logos ni marcas gráficas de terceros que tú dibujes: las marcas aparecen **solo como texto** o dentro de las **capturas/vídeos oficiales**. Nada de datos inventados: **solo las cifras verificadas de tu sección**. Todo en **español**.
- Cámara virtual: `.world` con `scale/x/y` (no uses `.stage` para la cámara).
- Ritmo: golpes sobre los **pulsos** (`beat`), revelados sobre las **palabras** (`cue`).

## Entrega

Al terminar responde con ≤ 8 líneas: ficheros escritos, instantes capturados, y cualquier cosa que el orquestador deba saber.

---

# ESPECIFICACIONES POR ESCENA

Datos verificados contra la página oficial (no añadas otros). `cue("…")` usa palabras de la locución indicada.

## s01 · 01-apertura (dark, 12,2 s) — apertura / «cold open» · captura de los titulares reales
Voz (a 0,5 s): «Septiembre de dos mil veintiséis: inteligencia artificial, compras, dinero público para formar y una semana sin tregua. Esto es lo que ha pasado en el e-learning corporativo.»
Montaje explosivo: «SEPTIEMBRE 2026» enorme que golpea; **tarjetas inclinadas con recortes de titulares reales** (OpenAI, Anthropic, Pearson, BOE, Gartner, Coursera, Moncloa: usa `shotwin` pequeñas con zoom al titular, con motion blur y velocidad) que cruzan en 3D; palabras `inteligencia artificial`, `compras`, `dinero público`, `semana sin tregua` golpean (slam) en su cue con color de bloque distinto; la **tira de calendario** barre del 1 sep al 2 oct (`dateStrip(["2026-09-01","2026-10-02"], 0.5, 6, 0)`) y «ESTA SEMANA» se enciende; al final, título «EL RESUMEN · E-LEARNING CORPORATIVO» y whip/glitch hacia el logo (siguiente escena, claro). Sin fecha de noticia.

## s03 · 03-mapa (light, 9,7 s) — mapa del mes
Voz: «Casi veinte noticias, cuatro bloques y poco más de tres minutos. Empezamos por donde más ruido hay: la inteligencia artificial.»
Un **mapa visual**: la tira de calendario grande en el centro (sep 2026) con **cuatro bloques de color** que se despliegan como carriles: IA (#7D29E0), Plataformas y contenidos (#E6008E), Mercado (#9B61F6), España y Europa (#5E3DE6); contador «19 noticias» (count-up) y chips con los nombres de los bloques en `cue("bloques")`; en `cue("inteligencia")` el bloque IA se llena y «explota» (flood violeta) hacia la escena siguiente (oscura). Sin fecha.

## s04 · 04-openai-academy (dark, 15,2 s) — IA · 21 sep 2026 · openai.com
Captura `oa-academy` (página oscura; titular «Expanding OpenAI Academy with new learning paths», subtítulo «Role-based learning helps employees, developers, leaders, educators, and students build practical AI skills and demonstrate what they’ve learned»; fecha «September 21, 2026»). Voz: «OpenAI amplía su Academy con rutas por rol, para empleados, desarrolladores, líderes, educadores y estudiantes, y una forma de demostrar lo aprendido. El proveedor de IA, también como proveedor de formación.»
Datos citables: 4 rutas por rol: **Knowledge workers → Apply AI at Work · Developers → Build with AI · Leaders → Lead AI Adoption · Educators and students → Teach and Learn with AI**; evaluación del curso y **badge al aprobar**; guía para llevar los cursos a la organización. Idea: ventana con zoom al titular y resaltado del subtítulo; 4 «tarjetas de ruta» que entran con spring en `cue("empleados")`, `cue("desarrolladores")`, `cue("líderes")`, `cue("educadores")`; un **badge** que se sella (`stamp`) en `cue("demostrar")`; remate: «PROVEEDOR DE IA → PROVEEDOR DE FORMACIÓN» con flecha animada.

## s05 · 05-microsoft-copilot (light, 10,8 s) — IA · 25 sep 2026 · blogs.microsoft.com
Capturas `ms-copilot` («Introducing the new Copilot with Home, Code and Autopilot», Sep 25, 2026) y `ms-skills` (Skills Hub Blog; «AI at work: Learn, build, and grow with Microsoft Copilot and agents», Sep 25, 2026; playlist «AI at Work» en AI Skills Navigator). Voz: «Microsoft reorganiza Copilot en tres piezas, Home, Code y Autopilot, y lo acompaña con una lista de formación en AI Skills Navigator.»
Datos citables: **Home** (chat + Cowork juntos), **Code** (extiende la construcción de soluciones a cualquier trabajador del conocimiento), **Autopilot** (agente persistente y proactivo que sigue trabajando aunque no estés; vista previa privada a finales de mes); formación: lista «AI at Work» en AI Skills Navigator para elegir el modo de Copilot según el rol. Idea: tres tarjetas 3D (Home, Code, Autopilot) en cada `cue`; luego la segunda ventana (`ms-skills`) entra con whip y el titular «AI at Work» se resalta; chip «formación + producto el mismo día».

## s06 · 06-openai-dots (dark, 13,5 s, ★ esta semana) — IA · 29 sep 2026 · openai.com
Captura `oa-dots` («Introducing dots», September 29, 2026; «Dots are remarkably capable, always-on agents built to handle everything…»). Voz: «El veintinueve, OpenAI presenta dots: agentes siempre activos que trabajan en tu nombre. Para quien forma, la pregunta es nueva: cómo se enseña a delegar, supervisar y revisar.»
Datos citables: **agentes siempre activos**; se conectan a **más de 4.000 apps** mediante plugins; se usan desde ChatGPT, Slack o Teams; se despliegan en **planes Pro, Business Premium y Enterprise** en mercados elegibles; **«Action review and approvals»** (revisión y aprobación de acciones). Idea: un círculo/anillo («dot») vivo que late y se multiplica en órbita; la captura con zoom al titular; contador «4.000+ apps» (count-up) con nodos que se conectan; pregunta final en tarjeta destacada con los tres verbos **delegar · supervisar · revisar** apareciendo en `cue("delegar")`, `cue("supervisar")`, `cue("revisar")`.

## s07 · 07-anthropic-academy (light, 11,6 s, ★) — IA · 2 oct 2026 · anthropic.com
Captura `an-frontier` («Anthropic invests $100 million to train 10,000 engineers and tackle the enterprise AI talent gap», Oct 2, 2026). Voz: «Y este viernes, Anthropic anuncia cien millones de dólares para formar a diez mil ingenieros: bootcamp, doce semanas de residencia en su empresa, evaluación y credencial.»
Datos citables: **100 M$ · 10.000 ingenieros · bootcamp presencial de varios días (insignia «Claude Resident Engineer») → residencia de 12 semanas en la propia empresa (credencial «Claude Frontier Deployed Engineer») · evaluación al final**. Idea: dos contadores gigantes (100 y 10.000) que cuentan en `cue("cien")` y `cue("diez")`; una **línea de progreso en 3 hitos** (bootcamp → 12 semanas → credencial) que se dibuja con las palabras; sello de credencial; la captura con zoom al titular. Sin logos de la marca (solo la captura).

## s08 · 08-gartner (dark, 17,9 s, ★) — IA · 9 y 29 sep 2026 · gartner.com
Capturas `gartner-shifts` (9 sep: «By 2029, 30% of Employees Laid Off Due to Replacement by AI Will Need to Be Rehired»), `gartner-marketing` (29 sep: «CMOs Must Redesign Entry-Level Roles to Build the Next Generation of Marketing Talent»), `gartner-fde` y `gartner-fde-body` (29 sep: «Gartner Predicts 70% of Enterprises Will Abandon Agentic AI Built by Vendor Forward-Deployed Engineering by 2028»). Voz: «Gartner firma tres predicciones: recontratar en dos mil veintinueve al treinta por ciento de los despedidos por sustitución con IA, rediseñar los puestos de entrada en marketing, y que en dos mil veintiocho el setenta por ciento abandone la IA agéntica construida por el proveedor.»
Datos citables: **30 % · 2029** (recontratación); **marketing: encuesta a 1.303 directivos (ene–abr 2026): 18 % eliminó roles, 16 % creó nuevos, casi 1/3 los rediseñó; los puestos de entrada se rediseñan hacia 2030**; **70 % · 2028**. **Ojo privacidad:** las páginas de Gartner llevan «Media contacts» con nombres y correos: déjalos fuera del encuadre. Idea: **tres tarjetas** (una por predicción) con su capturas inclinadas en 3D que entran sucesivas con cada `cue("recontratar")`, `cue("rediseñar")`, `cue("setenta")`; cifras enormes 30 % / 70 % con contador; barras 18/16/33 % para el dato de marketing; línea de tiempo 2029 → 2028 → 2030. Dos fechas: usa `dateStrip` con ambas.

## s09 · 09-coursera-helix (light, 17,5 s) — Plataformas · 9 sep 2026 · coursera.org / udemy · **con vídeos oficiales**
Capturas `coursera-helix-blog` (blog.coursera.org «Announcing Project Helix: A skills platform for the AI era», September 9, 2026) y `coursera-helix` (nota de IR «Coursera Announces Project Helix, a New AI-Native Platform…», September 9, 2026; «Built on a combined ecosystem of 30,000 global instructors and content partners»). Voz: «Plataformas y contenidos. Coursera y Udemy, ya una sola empresa, adelantan Project Helix: rutas de aprendizaje a partir de un objetivo de negocio en lenguaje natural, habilidades verificadas y registro portable. Primer semestre de dos mil veintisiete.»
Datos citables: **plataforma «AI-native»**, rutas adaptativas desde objetivos de negocio en **lenguaje natural**, evaluaciones graduadas + observación práctica + credenciales → **registro portable de habilidades**; **disponibilidad general en la primera mitad de 2027**; **30.000+ instructores y socios de contenido**; previsualizado en el evento de clientes FWD 2026. Idea: abre con un **cartel de bloque «PLATAFORMAS Y CONTENIDOS»** (corto, ~1,5 s, color #E6008E) y luego los **vídeos oficiales** como protagonistas (3–4 clips de 4–5 s en una ventana con marco y sombra, con transiciones whip/zoom, rotulados «Vídeo oficial · Coursera + Udemy»): `helix-demo` 72–77 s («What do you want to learn today?») con `cue("objetivo")`; 88–93 s («task-specific paths») con `cue("habilidades")`; 152–157 s («Shareable skills record») con `cue("registro")`; y `helix-llm` 15–19 s (el aprendizaje dentro de los asistentes de IA) como cuarto clip; chip «H1 2027» grande en `cue("semestre")`; captura de titular con zoom entre clips.

## s10 · 10-articulate (dark, 11,5 s) — Plataformas · 10 sep 2026 · articulate.com
Captura `articulate` («Articulate Announces Major Platform Evolution at Articuland 2026», September 10, 2026). Voz: «Articulate presenta Articulate 360 AI, un agente llamado Nova y Frontline, para equipos que crean formación fuera del departamento de formación.»
Datos citables: **Articulate 360 AI** (para equipos de L&D; renueva Rise, Storyline, Review y Reach), **Nova** (agente de IA integrado, p. ej. vídeo con avatar de IA y traducción multiformato), **Frontline** (producto nativo de IA para equipos que no son de L&D: ventas, soporte, TI), **20.000 créditos de lanzamiento por usuario (hasta 100.000 por suscripción)**, disponible hoy para cuentas elegibles de Articulate 360. **Ojo privacidad:** no dejes ver la firma del autor. Idea: tres «módulos» (360 AI, Nova, Frontline) que se ensamblan como piezas; contador de créditos 0 → 20.000 con barra; ventana con zoom al titular; el orbe/cursor «entrega» Frontline a un grupo de personas genéricas (ventas, soporte, TI) dibujadas como iconos.

## s11 · 11-skillsoft (light, 11,3 s) — Plataformas · 10 sep 2026 · skillsoft.com
Capturas `skillsoft-lx-title` (titular «Skillsoft LX Design Studio Reduces Custom Learning Content Development from Weeks to Days», SEPTEMBER 10, 2026) y `skillsoft-lx`. Voz: «Skillsoft estrena LX Design Studio: contenido a medida con IA que, según la empresa, reduce hasta un ochenta y cinco por ciento el tiempo de desarrollo.»
Datos citables: **«de semanas a días»**; **hasta un 85 % menos de tiempo de desarrollo (según la propia empresa; ella misma lo marca con asterisco)**; usuarios de la beta publicaron **simulaciones de conversación con IA en unos 15 minutos**; la propiedad intelectual del cliente queda privada. Idea: un **reloj/calendario que se contrae** (semanas → días) con un 85 % que cuenta y se «recorta» como una barra; ventana con zoom al titular y resaltado de «Weeks to Days»; etiqueta pequeña «según la empresa» siempre visible junto al 85 %.

## s12 · 12-coursera-informe (dark, 9,5 s, ★) — Plataformas · 28 sep 2026 · coursera.org
Captura `coursera-gsr` (blog.coursera.org «Presenting Coursera’s Global Skills Report 2026, and our new AI-Human Skills Synergy Index—the first of its kind in the world», September 28, 2026). Voz: «Coursera publica su Global Skills Report, con un índice nuevo que cruza habilidades de IA y habilidades humanas en noventa y ocho países.»
Datos citables: **Global Skills Report 2026**; **AI-Human Skills Synergy Index**; **98 países**. (El 43 %/20 % de la página es un dato de Deloitte citado por Coursera: **no lo uses**.) **Ojo privacidad:** quita la firma del autor. Idea: un **globo/mapa de puntos** (puntos generados con semilla fija) en el que se encienden 98 puntos con un contador 0 → 98; dos ejes que se cruzan («IA» × «Humanas») formando un índice; la captura con zoom al titular y resaltado de «AI-Human Skills Synergy Index».

## s13 · 13-pearson (light, 16,3 s, ★) — Mercado · 18 y 29 sep 2026 · pearson.com
Capturas `pearson-workera` («Pearson Acquires Workera, a Pioneer in AI-Native Enterprise Assessment and Skills Verification», 29 Sep 2026) y `pearson-its` («Pearson Acquires Assessment Technology Provider, ITS», 18 Sep 2026). Voz: «Mercado. Pearson compra Workera, evaluación de competencias con IA, el veintinueve de septiembre. Once días antes, ITS, evaluación y certificación a distancia. Dos compras: medir lo que la gente sabe hacer.»
Datos citables: **ITS (18 sep)**: tecnología de evaluación con sede en Baltimore (EE. UU.), evaluaciones remotas supervisadas y certificación; **Workera (29 sep)**: inteligencia de habilidades nativa de IA, evaluación adaptativa y escenarios por rol; **11 días** entre ambas (cálculo de fechas); términos económicos no divulgados (no inventes precios). Idea: una **línea de tiempo con dos hitos** (18 sep y 29 sep) unidos por un arco con contador «11 días»; cada hito con su captura en ventana y un sello; cierre con una **regla/medidor** que se llena y la palabra «MEDIR». Cartel breve de bloque «MERCADO» (color #9B61F6) al inicio. Dos fechas: `dateStrip` con ambas.

## s14 · 14-espana-dinero (dark, 18,6 s, ★) — España y UE · 22 y 29 sep 2026 · lamoncloa.gob.es · **con vídeo oficial**
Capturas `moncloa-22` («El Gobierno destina 250 millones de euros a mejorar la formación de las personas trabajadoras», Consejo de Ministros 22.9.2026) y `moncloa-29` (Referencia del Consejo de Ministros 29.9.2026) y el **vídeo** `moncloa-cmin-20260922.mp4`. Voz: «España. El veintidós, doscientos cincuenta millones para formar a personas trabajadoras, sobre todo ocupadas. El veintinueve, autorización de gasto para formación en el trabajo: trescientos cincuenta y dos millones en dos mil veintisiete y trescientos doce en dos mil veintiocho.»
Datos citables: **22 sep: 250 M€** del presupuesto del SEPE para programas formativos dirigidos de manera prioritaria a personas ocupadas; **29 sep: autorización de gasto para convocatorias de «formación en el trabajo»: 351,98 M€ en 2027 y 311,6 M€ en 2028** (límites de compromiso de gasto; aún no son convocatorias publicadas). Idea: cartel breve de bloque «ESPAÑA Y UE» (#5E3DE6); el **vídeo oficial** en una ventana (10–14 s; duotono violeta; sin rótulos de personas) con un contador gigante **250 M€** en `cue("doscientos")`; luego dos **barras** 2027 vs 2028 (352 y 312) con contadores en `cue("trescientos")`; la captura con zoom a la cabecera con la fecha; euros animados (monedas/segmentos como formas vectoriales). Dos fechas: `dateStrip`.

## s15 · 15-boe-fp (light, 9,3 s, ★) — España y UE · 30 sep 2026 · boe.es
Capturas `boe-35` y `boe-467` (BOE núm. 241, 30 de septiembre de 2026; extractos de convocatorias de la Secretaría General de Formación Profesional). Voz: «Y el BOE del treinta publica dos convocatorias de Formación Profesional: treinta y cinco y cuarenta y seis coma siete millones de euros.»
Datos citables: **35.000.000 €** (oficios y desempeños estratégicos) y **46.700.000 €** (sectores de alta demanda, prioridad a personas en situación de especial vulnerabilidad); **plazo: 10 días naturales** desde el día siguiente a la publicación del extracto; suma 81,7 M€ (**suma propia**, rotúlala «suma»). Idea: dos **hojas del BOE** que entran apiladas con zoom a la cifra y resaltado (`hl`); contadores 35 y 46,7 que se funden en 81,7; un **cronómetro de 10 días** que cuenta atrás; sello «BOE».

## s16 · 16-europa (dark, 16,8 s) — España y UE · 14 y 15 sep 2026 · ec.europa.eu / eurostat
Capturas `ec-skills` («Commission proposes ambitious measures to strengthen fair labour mobility», 15 September 2026) y `eurostat` («SDG 4: Adult learning on the rise in the EU», 14 September 2026). Voz: «En Bruselas, la Comisión propone el Skills Portability Act, con cualificaciones digitales y comparables. Y Eurostat: el trece coma siete por ciento de los adultos europeos se formó en las últimas cuatro semanas, frente al diez coma uno de dos mil quince.»
Datos citables: **«Skills Portability Act»** dentro de un paquete de 5 propuestas legislativas (movilidad laboral justa), incluido un **reglamento sobre cualificaciones digitales y comparables** (son **propuestas**: falta tramitación); **Eurostat: 13,7 % de personas de 25 a 64 años en formación en las últimas 4 semanas en 2025, frente a 10,1 % en 2015** (Suecia 38,2 % lidera; Grecia 5,2 % cierra). Idea: primero la Comisión (captura con zoom al titular y al texto «Skills Portability Act»; un **pasaporte/credencial digital** que se transfiere entre dos banderas de «países» abstractas), luego Eurostat: **indicador/medidor que sube de 10,1 a 13,7** con contadores y mini gráfico de barras por años; etiqueta «propuesta» visible en lo de la Comisión. Dos fechas.

## s17 · 17-agenda (light, 11,8 s) — Agenda · próximos eventos · con vídeo oficial
Capturas `ev-talentday`, `ev-wol`, `ev-rising`, `ev-devlearn` y vídeo `devlearn-header.mp4` (cuadrado, 32 s). Voz: «La semana que viene: el seis de octubre, Talent Day en Barcelona y World of Learning en Birmingham. El doce, Workday Rising. Y el cuatro de noviembre arranca DevLearn.»
Datos citables (webs oficiales): **6 oct** Talent Day Barcelona (Palau de Congressos de Catalunya); **6 y 7 oct** World of Learning (NEC Birmingham; 150+ proveedores, 70+ seminarios gratuitos); **12–15 oct** Workday Rising (Las Vegas; 400+ sesiones); **4–6 nov** DevLearn (MGM Grand, Las Vegas; 160+ sesiones nuevas). Idea: **calendario que se pasa de página** (octubre → noviembre) con las fechas como bloques grandes que caen en `cue("seis")`, `cue("doce")`, `cue("cuatro")`; cada evento con su captura en una tarjeta 3D y, para DevLearn, el **vídeo oficial** (4–5 s, rotulado «Vídeo oficial · DevLearn») recortado en un marco. Sin `dateStrip` (son fechas futuras): en su lugar, un cartel «LA SEMANA QUE VIENE».

## s18 · 18-cierre (dark, 13,0 s) — cierre
Voz: «Para llevarse a casa: la IA ya es parte del catálogo, medir competencias es el nuevo campo de batalla y el dinero público para formar sigue en marcha. Nos vemos el lunes.»
Tres **afirmaciones enormes** numeradas (01 «La IA ya es parte del catálogo», 02 «Medir competencias: el nuevo campo de batalla», 03 «Dinero público para formar: en marcha») que entran en `cue("IA")`, `cue("medir")`, `cue("dinero")`, cada una con su color de bloque (#7D29E0, #9B61F6, #5E3DE6) y un icono vectorial animado; «Nos vemos el lunes.» en `cue("lunes")`. En el último ~1,1 s: un círculo blanco crece desde el centro (iris a claro) mientras un **aro violeta→rosa (SVG, trazo ~14 px)** se centra en **(x=533, y=538) con diámetro final ≈ 185 px** (ahí dibuja su aro el logo en la escena siguiente). Termina con el aro visible sobre blanco/claro.
