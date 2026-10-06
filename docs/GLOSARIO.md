# Glosario

Términos que aparecen en el código, los datos y la documentación de kaleidos. Los campos de datos van en `código`;
su formato exacto está en [`CONTRATO.md`](CONTRATO.md).

| Término | Qué es |
|---|---|
| **angle / swangle** | Modos de WebGL de Chrome en el render: `angle` usa la GPU (local); `swangle`, software, como en Lambda. `--gl swangle` en los scripts del motor para ver lo mismo que Lambda |
| **BRIEF** (`BRIEF.md`) | Intención del vídeo confirmada con el usuario: objetivo, público, duración, estructura, qué cortar, gráficos, privacidad. Se lee antes de escribir el guion |
| **bruto** | Grabación original en `brutos/`. Nunca se modifica; el pipeline trabaja sobre copias en `proyectos/<slug>/work/` |
| **bocadillo** | Globo de texto (`globo`, `nube`, `grito`) junto al ponente, a la caja de voz o dentro de una lámina (§7) |
| **bucket privado** | `kaleidos-privado-*`: entradas del render (vídeos, audio, `timeline.json`, extras), con URLs prefirmadas y caducidad de 3 días |
| **bucket público** | `remotionlambda-*`: el de Remotion, de lectura pública. Solo el site y la salida, que se borra tras descargarla |
| **caja de voz** | En narración, el recuadro que ocupa el sitio del ponente: fondo de cámara del estilo, onda de la locución y la etiqueta «Narración» (§8) |
| **calibración** | Medidas locales de segundos por fotograma por modo (`motor/scripts/medir.mjs` → `motor/out/calibracion.json`) que usa el modelo de coste |
| **cámara virtual** | Reencuadre del bruto por planos (`wide`, `medium`, `close`, `sideL`, `sideR`, `popL`, `card`) calculado con la pose, sin mover la cámara real |
| **capítulo** | Bloque del vídeo con rótulo de entrada (3,4 s), acento de color y, en escenario, `sigla` en el HUD |
| **concurrencia** | Número de funciones Lambda por render (máx. 200 en Remotion 4.0.529). `--concurrencia max\|N` o `proyecto.json › lambda.concurrencia` |
| **corte** | Tramo del bruto que se elimina (tomas falsas, charla fuera de guion) o silencio largo entre palabras. En narración no hay cortes |
| **cue** | Ancla de un momento del guion: `[segundo aproximado, "frase literal"]`. `linea` busca la frase desde `segundo − 2 s` |
| **disposición** | Reparto de la pantalla en modo escenario: `dos-cajas`, `grande`, `solo`, `completa`, `dividida` y, en narración, `completa` y `voz` |
| **dry-run** | Plan en seco de `lambda.mjs` (recursos, subidas, coste, tiempo) sin llamar a AWS ni leer credenciales. Siempre antes del render real |
| **EDL** (`segmentos`) | Lista de tramos de la fuente que forman el montaje: `dst` y `dur` en fotogramas de salida, `src` en segundos de la fuente |
| **escenario** (modo) | Maqueta de webinar: caja de diapositiva + caja del ponente (o de voz), registros, titulares de juego, bocadillos, sellos (§7) |
| **escena3d** | Evento con un objeto 3D del catálogo en un lienzo junto al ponente o en la diapositiva |
| **estilo** | Carpeta de `estilos/` con `estilo.md` (guía), `tokens.json` (datos para el motor), fuentes y referencias |
| **evento** | Cada cosa que aparece en pantalla anclada a la voz: `panel`, `pop`, `escena3d`, `gesto3d`, `ilustracion`, `titulo`, `lamina`, `bocadillo`, `reaccion`, `sello` |
| **extras** | Archivos adicionales para el motor (láminas, capturas, ilustraciones, música, efectos) en `media/extras/`; su clave es el nombre sin extensión |
| **F (factor)** | Relación entre segundos por fotograma en Lambda y en local con `swangle`, calibrada con el render real de DORA v1 |
| **fichas** | HUD de estilo `fichas`: una ficha por capítulo (vista, actual, pendiente) con su `sigla` |
| **fixes** | Correcciones de la transcripción en el guion (`"AIAC": "AI Act"`): se aplican a subtítulos y a la búsqueda de cues |
| **frame.md** | Guía de estilo que lee HyperFrames en la raíz de un proyecto; es la copia de `estilos/<e>/estilo.md` |
| **framesPerLambda** | Fotogramas por función (100 por defecto). Funciones = ⌈fotogramas / framesPerLambda⌉ |
| **gesto3d** | Objeto 3D anclado al punto medio de las manos en un gesto amplio detectado por la pose; congelado desde el pico. No vale en narración |
| **gestos** (`gestos.json`) | Momentos con las dos manos abiertas y separadas, candidatos a `gesto3d` |
| **hoja de contactos** | Imagen con muchos fotogramas en mosaico (`hoja.jpg`) para revisar de un vistazo |
| **HUD** | Barra de progreso por capítulos y chip del capítulo actual (o fichas) |
| **HyperFrames** | Framework de vídeo desde HTML (Apache-2.0), con skills globales de Claude Code y CLI `npx hyperframes` |
| **ilustración 2,5D** | Imagen fija con mapa de profundidad desplazada en 3D para dar parallax (`ilustracion`, `profundidad`, `ampliar`) |
| **informe** (`informe.md`) | Registro final del proyecto: decisiones, avisos, incoherencias, tiempos y coste real |
| **kicker** | Antetítulo corto encima de un título (capítulo, panel, intro) |
| **kind** | Tipo de panel: `lista`, `pasos`, `checklist`, `comparativa`, `opciones`, `cifra`, `cita`, `clave`, `linea`, `mapa`, `tarjeta`, `caso` |
| **lámina** | Ilustración o captura a toda la caja de diapositiva, con zoom lento y bocadillos (`lamina`, §7) |
| **locución** (`locucion.json`) | Texto de la voz en off de un proyecto de narración, en bloques; `tools/kaleidos voz` la convierte en `narracion.m4a` |
| **LUFS / dBTP** | Sonoridad integrada y pico real. Objetivo de entrega: −16 LUFS / −1,5 dBTP |
| **manifest** | JSON que deja cada generador junto a su salida (duraciones, hashes, caracteres, atribuciones) |
| **máscara** (`mascara.mp4`) | Vídeo en gris con la silueta del ponente (RVM) |
| **media/** | Carpeta del proyecto con enlaces duros a lo que necesita el motor (el `--public-dir` local) |
| **método** | `clase-larga` (guion por datos, cortes, cámara virtual) o `corto-ilustrado` (montaje 1:1, ilustraciones) |
| **mezzanine** (`mezzanine.mp4`) | Versión 1080p corregida del bruto (color y audio a −16 LUFS) sobre la que trabaja el motor |
| **modelo de coste** | `motor/scripts/lib/coste.mjs`: estima tiempo y coste de un render a partir de la timeline y la calibración |
| **narración** (modo) | Vídeo sin bruto ni ponente con voz TTS (`narracion: true`, §8); siempre en escenario |
| **panel** | Gráfico 2D por tipo (`kind`) alimentado por datos; sus elementos entran cuando la voz los nombra |
| **plancha** (`plancha.mp4`) | El ponente premultiplicado por su máscara, recortado a su franja; con la máscara permite cambiar el fondo |
| **plano forzado** | Plano de cámara que impone un evento (p. ej. ponente a la izquierda si el panel va a la derecha); ninguna regla posterior lo cambia |
| **pop** | Frase clave grande en pantalla |
| **pose** (`pose.json`) | Nariz, hombros, muñecas e índices del ponente por fotograma (MediaPipe) |
| **preproceso** | Análisis, transcripción, máster, recorte y pose (`tools/kaleidos preparar`) |
| **props** | Parámetros de la composición de Remotion: pequeños (`timelineSrc`, `estilo`, `media`); la línea de tiempo no viaja en ellos |
| **reacción** | Icono breve (~1,4 s) junto al ponente o la caja de voz (`pregunta`, `idea`, `rayo`, `ok`, `alerta`, `corazon`, `reloj`); la única pieza que puede solaparse |
| **recorte** | Separar al ponente del fondo (máscara + plancha) para poner el fondo del estilo y capas detrás y delante |
| **referencias** | 3–6 JPG por estilo que lo enseñan; sin caras ni nombres reales |
| **registro** | Piel de la caja de diapositiva en escenario: `show`, `editorial`, `lamina` |
| **rótulo** | Tarjeta de entrada de un capítulo; ningún evento puede caer dentro |
| **sello** | Estampa con golpe (`TRAMPA`, `EUREKA`…) y tono `ok`, `bad` o `aviso` |
| **site** | Empaquetado del motor subido a S3 para Lambda (`motor-<hash>`); se vuelve a subir si cambian `motor/src` o `motor/public` |
| **skill** | Instrucciones empaquetadas para Claude Code (`.claude/skills/` del proyecto y `~/.claude/skills/` globales). Codex las lee como documentación |
| **slug** | Nombre corto del proyecto en minúsculas con guiones (`dora-v2`); es la carpeta en `proyectos/` y el nombre del resultado |
| **stills** | Fotogramas sueltos de control (`motor/scripts/stills.mjs`), con hoja de contactos |
| **subtítulos** | Páginas de ≤ 34 caracteres con la palabra activa resaltada, a partir de la transcripción |
| **timeline** (`timeline.json`) | Línea de tiempo en fotogramas que genera `tools/kaleidos linea`; lo único que pinta el motor. No se edita a mano |
| **titular de juego** | Titular con degradado, doble contorno y brillo (`tratamiento: "juego"`, evento `titulo`) |
| **tokens** (`tokens.json`) | El estilo en datos para el motor: colores, tipografías, forma, fondo, paneles, subtítulos, movimiento, 3D, audio |
| **transcripción** | Palabras con marca de tiempo (`work/transcripcion.json`/`.txt`), de whisper.cpp con `large-v3-turbo` |
| **URL prefirmada** | Enlace temporal firmado a un objeto del bucket privado; así lee Lambda las entradas sin hacerlas públicas |
| **work/** | Intermedios del proyecto (fuera de git): análisis, transcripción, mezzanine, máscara, plancha, pose, voz, registros |
