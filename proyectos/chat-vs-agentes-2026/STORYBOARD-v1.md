---
format: 1920x1080
duration: 150s
message: "El chat contesta; el agente trabaja con tus archivos y herramientas y te entrega el trabajo hecho"
arc: "Logo → Gancho → La diferencia → Chat vs escritorio → Nombres → Cuatro áreas → Control → Cierre → Logo"
audience: "profesionales no técnicos de audiovisual, marketing, ventas y recursos humanos"
mode: collaborative
---

# Chat o agente: qué cambia al usar ChatGPT y Claude con la app de escritorio

## Estado

Plan aprobado, bocetos v1 hechos (`storyboard.html`) y vídeo construido (`build.mjs` regenera `index.html` y `compositions/` desde la voz real).
## Tiempos finales (de la voz real)

| Plano | Inicio | Duración |
|---|---|---|
| 01 Logo de apertura | 0.00 s | 4.20 s |
| 02 Gancho | 4.20 s | 5.96 s |
| 03 La diferencia | 10.16 s | 14.80 s |
| 04 En chat | 24.96 s | 11.36 s |
| 05 En el escritorio | 36.32 s | 15.20 s |
| 06 Mismo encargo | 51.52 s | 11.68 s |
| 07 Se conecta | 63.20 s | 11.76 s |
| 08 Los nombres | 74.96 s | 13.12 s |
| 09 Marketing | 88.08 s | 10.80 s |
| 10 Ventas | 98.88 s | 8.24 s |
| 11 Recursos humanos | 107.12 s | 10.16 s |
| 12 Audiovisual y creatividad | 117.28 s | 11.60 s |
| 13 Control | 128.88 s | 16.48 s |
| 14 Cierre | 145.36 s | 9.26 s |
| 15 Logo de cierre | 154.62 s | 4.60 s |

Total: 159,22 s (4.777 fotogramas a 30 fps). Estado: construido y validado (`npm run check` limpio); borrador local verificado; falta render final.


## Cambios desde v0

- El usuario pidió usar los colores de la web de OpenWebinars y no el azul: el estilo pasa a claro (fondo #FAFBFC, acento violeta #7D29E0) y el logo ya no necesita placa blanca.

## Decisiones

- **Mensaje:** el chat contesta; el agente trabaja con tus archivos y herramientas y te entrega el trabajo hecho.
- **Formato:** 1920×1080 a 25 fps, ≈150 s, locución en español (ElevenLabs `eleven_v4`), subtítulos limpios sin caja, banda inferior de 100 px reservada.
- **Espina:** **un único panel de cristal** que atraviesa el vídeo y cambia de papel: burbuja de chat (03) → carpeta de trabajo (04) → resultado entregado (05) → columna de cada herramienta (07) → tarjeta de cada área (08–11) → panel de permisos (12) → burbuja y carpeta juntas (13). Una cosa que cambia, no veinte tarjetas nuevas.
- **Estilo:** `frame.md` (lanzamiento-minimal, **paleta de la web de OpenWebinars**): fondo #FAFBFC, tinta #0D1320, titular Inter 800 enorme con una palabra por plano en violeta #7D29E0, resplandor suave violeta→rosa, mucho aire, movimiento expo.out lento, fundidos de 0,8 s. Acentos por área: marketing violeta #7D29E0, ventas rosa #FF01A2, RR. HH. índigo #5E3DE6, creatividad lavanda #9B61F6; aviso de privacidad en #B54708. Sin azul.
- **Logo:** apertura (01) y cierre (15), SVG oficial sin recolorear, directamente sobre el fondo claro como en la cabecera de la web.
- **Pieza sostenida:** el plano 13 se queda quieto con las dos frases clave mientras la voz las dice.
- **Prohibido:** capturas, interfaces o logos de ChatGPT/Claude/OpenAI/Anthropic; precios, versiones y planes; nombres de personas; más de ~12 palabras de pantalla por plano; rebotes; degradados de pantalla completa; fingir una interfaz real.
- **Veracidad:** todo el contenido sale de `fuentes.md` (consulta 2026-10-02). Se dice «el modo agente de Claude (Cowork)» y «ChatGPT Work». No se promete disponibilidad en España/UE. Audiovisual se plantea como creatividad, no como montaje de vídeo.
- **Audio:** voz a −16 LUFS; pad suave en 00 y 14 (≈ −24 LUFS); un «tick» muy suave al entrar el panel en cada cambio de papel. Música o efectos nuevos con ElevenLabs solo si tú lo pides, con coste anunciado.
- **Duración:** la fija la voz real. Los tiempos de abajo son estimaciones (≈150 palabras por minuto) y se recalculan con la locución.

## Frame 01 — Logo de apertura

- status: animated
- src: compositions/01-logo-apertura.html
- duration: 4s
- scene: Fondo claro con resplandor; el logo de OpenWebinars se dibuja como vector y brilla una vez
- transition_in: cut
- voiceover: ""
- hero: el aro del logo (se convierte en el halo del fondo en el plano 02)
- motion: aro con trazo (stroke-dashoffset, 1,2 s expo.out) y relleno de degradado; W con trazo y relleno (0,6 s); letras de «OpenWebinars» suben desde su máscara con 0,05 s de desfase; brillo inclinado que barre el aro una vez; pulso 1→1,03→1
- seam: fundido suave de 0,6 s; el aro se queda como resplandor tenue
- audio: pad suave desde 0 s; «tick» al cerrarse el aro
- constraint: no recolorear ni deformar el logo; sin texto añadido; sin subtítulos
- why: abre con la marca sin usar el logo como adorno: el aro es el halo del resto del vídeo

## Frame 02 — Gancho

- status: animated
- src: compositions/02-gancho.html
- duration: 8s
- scene: Fondo claro con resplandor tenue; titular enorme en dos líneas
- transition_in: crossfade
- voiceover: "¿Y si, en vez de pedirle un texto a la IA, le pidieras el trabajo hecho?"
- hero: —
- motion: «un texto» aparece por máscara y se atenúa; «el trabajo hecho» entra en acento; yPercent 105→0, 1,1 s expo.out
- seam: fundido de 0,8 s
- constraint: sin palabras de producto; sin iconos
- why: gancho en lenguaje de resultado (lo que el espectador gana), no de producto

Pantalla: «Un texto.» → «El trabajo hecho.» (acento en «hecho»).

## Frame 03 — La diferencia

- status: animated
- src: compositions/03-diferencia.html
- duration: 13s
- scene: Dos palabras gigantes a ambos lados de un filete: «Contesta» y «Trabaja»
- transition_in: crossfade
- voiceover: "Esa es la diferencia. Usados como chat, ChatGPT o Claude contestan. Usados con la aplicación de escritorio, trabajan: abren tus archivos, siguen un encargo paso a paso y te entregan el resultado."
- hero: el panel de cristal nace aquí como burbuja pequeña bajo «Contesta»
- motion: «Contesta» entra a 45 % de opacidad; «Trabaja» entra en texto y en acento cuando la voz dice «trabajan»; filete central que se dibuja (scaleY, 0,8 s expo.out)
- seam: la burbuja se agranda hasta llenar el centro (match de escala, 0,8 s)
- constraint: sin lista de funciones
- why: lanza el mensaje en el segundo plano (valor antes que evidencia)

## Frame 04 — En chat

- status: animated
- src: compositions/04-en-chat.html
- duration: 10s
- scene: El panel como burbuja de chat con una sola línea de texto; debajo, tres tareas manuales atenuadas
- transition_in: match-scale
- voiceover: "En chat, tú pones los archivos y los datos, y recibes texto. Lo copias, lo pegas, lo ordenas. Muy útil para ideas, borradores y dudas rápidas."
- hero: el panel (papel: burbuja)
- motion: línea de texto que se escribe palabra a palabra; tres chips «Copiar», «Pegar», «Ordenar» que aparecen con la voz y se atenúan al 45 %
- seam: los chips se pliegan dentro del panel y el panel se ensancha a carpeta
- constraint: sin interfaz realista de ningún chat; sin logos
- why: define el punto de partida que el público ya conoce, para que el contraste del plano 05 se note

## Frame 05 — En el escritorio

- status: animated
- src: compositions/05-en-escritorio.html
- duration: 14s
- scene: El panel como carpeta de trabajo; chips de archivos entran y salen ordenados; barra de progreso fina
- transition_in: match-scale
- voiceover: "En el escritorio ya no hace falta subir nada. Eliges una carpeta y la IA lee los archivos, los organiza, crea documentos, hojas de cálculo y presentaciones, y puede seguir con tareas largas mientras tú haces otra cosa."
- hero: el panel (papel: carpeta)
- motion: título de carpeta «Tu carpeta» (genérico); cinco chips de archivo desordenados que se alinean; tres chips nuevos («Informe», «Hoja», «Presentación») que nacen del panel; progreso lineal que avanza despacio
- seam: el panel se contrae a una sola tarjeta «Entregado»
- constraint: nombres de archivo genéricos; sin rutas ni nombres reales
- why: primera prueba visual del valor: la IA actúa sobre archivos y entrega

## Frame 06 — Mismo encargo, dos resultados

- status: animated
- src: compositions/06-mismo-encargo.html
- duration: 12s
- scene: Una petición arriba; debajo, dos columnas: «Chat» y «Escritorio»
- transition_in: crossfade
- voiceover: "Imagina que pides el resumen semanal. En chat te devuelve un texto. En el escritorio, abre tus hojas, hace las cuentas, crea el documento y lo guarda en tu carpeta."
- hero: el panel (papel: resultado)
- motion: la columna «Chat» muestra un bloque de texto gris; la columna «Escritorio» muestra tres pasos que se marcan uno a uno y termina en «Guardado en tu carpeta»
- seam: fundido
- constraint: sin cifras ni datos reales; el «resumen semanal» es un ejemplo, no un dato
- why: comparación directa de lo que cambia, con la misma petición

## Frame 07 — Se conecta a tus herramientas

- status: animated
- src: compositions/07-conectores.html
- duration: 9s
- scene: Cinco nodos genéricos (Correo, Calendario, Archivos, Mensajes, Clientes) alrededor del panel
- transition_in: crossfade
- voiceover: "Además se conecta a tus herramientas: correo, calendario, tus archivos en la nube, mensajería o tu gestor de clientes. Y puede tomar acciones, no solo opinar."
- hero: el panel (papel: centro)
- motion: líneas finas que se dibujan del panel a cada nodo, 0,15 s de desfase; «acciones» en acento
- seam: los nodos se pliegan al panel
- constraint: sin logos de marcas de terceros (nodos genéricos con icono lineal)
- why: explica el segundo gran salto, de opinar a hacer

## Frame 08 — Los nombres

- status: animated
- src: compositions/08-nombres.html
- duration: 14s
- scene: Dos columnas con el nombre de cada empresa sin logo: «Claude» y «ChatGPT»; filas «Chat» y «Modo agente»; una nota pequeña «Programar» para las otras dos herramientas
- transition_in: crossfade
- voiceover: "Cada empresa lo llama de una forma. En Claude es el modo agente, que antes se llamaba Cowork. En ChatGPT se llama Work. Claude Code y Codex son sus herramientas para programar."
- hero: el panel (papel: tabla)
- motion: columna «Claude» entra primero con «Modo agente (antes Cowork)»; columna «ChatGPT» con «Work»; la línea «Claude Code · Codex = programar» entra al 55 % de opacidad
- seam: fundido
- constraint: sin versiones, planes ni precios; el nombre «Cowork» solo como «antes llamado»
- why: evita la confusión de nombres, que es la barrera real para un público no técnico (aviso 1 de `fuentes.md`)

## Frame 09 — Marketing

- status: animated
- src: compositions/09-marketing.html
- duration: 10s
- scene: Rótulo gigante «Marketing»; tarjeta con tres ejemplos en una línea cada uno
- transition_in: push-soft
- voiceover: "En marketing, puede convertir una investigación en un briefing de campaña, adaptar piezas a distintos mercados o dejarte preparado cada lunes el informe semanal."
- hero: el panel (papel: tarjeta de área)
- motion: rótulo por máscara; tres líneas «Briefing de campaña», «Adaptar a otros mercados», «Informe cada lunes» entran con la voz
- seam: la tarjeta se desliza a la izquierda (misma dirección en todo el vídeo)
- constraint: sin cifras de rendimiento
- why: ejemplo oficial de marketing (fuentes: OpenAI Work y Cowork)

## Frame 10 — Ventas

- status: animated
- src: compositions/10-ventas.html
- duration: 9s
- scene: Rótulo «Ventas»; tarjeta con tres líneas
- transition_in: push-soft
- voiceover: "En ventas, prepara la reunión con el contexto del cliente, resume las llamadas del trimestre y te deja un memo listo."
- hero: el panel (papel: tarjeta de área)
- motion: igual que 09; la línea «Memo listo» marcada con un check lineal al final
- seam: tarjeta a la izquierda
- constraint: nada de nombres de clientes ni datos de ejemplo
- why: ejemplo oficial de ventas (OpenAI Work y plugin de Ventas de Claude)

## Frame 11 — Recursos humanos

- status: animated
- src: compositions/11-rrhh.html
- duration: 9s
- scene: Rótulo «Recursos humanos»; tarjeta con tres líneas y un aviso discreto
- transition_in: push-soft
- voiceover: "En recursos humanos, ayuda con descripciones de puesto, planes de incorporación y evaluaciones. Eso sí: sin pegar datos personales de nadie."
- hero: el panel (papel: tarjeta de área)
- motion: igual que 09; el aviso «Sin datos personales» entra al final en el color de aviso (#B54708) con un icono de candado lineal
- seam: tarjeta a la izquierda
- constraint: sin nombres, caras ni currículos; sin afirmar que ninguna empresa cite candidatos como caso (no verificado)
- why: ejemplos de RR. HH. con el aviso de privacidad que exige el brief

## Frame 12 — Audiovisual y creatividad

- status: animated
- src: compositions/12-creatividad.html
- duration: 11s
- scene: Rótulo «Audiovisual y creatividad»; tarjeta con tres líneas
- transition_in: push-soft
- voiceover: "En audiovisual y creatividad, genera conceptos, guiones y briefings, organiza y renombra tus archivos y prepara presentaciones. La dirección creativa la pones tú."
- hero: el panel (papel: tarjeta de área)
- motion: igual que 09; «La dirección creativa, tú» al final en acento
- seam: tarjeta a la izquierda
- constraint: sin mencionar montaje de vídeo como caso oficial (no verificado)
- why: cumple la petición de audiovisual con lo que las fuentes sí documentan

## Frame 13 — Tú mantienes el control

- status: animated
- src: compositions/13-control.html
- duration: 14s
- scene: El panel como lista de permisos con tres interruptores lineales
- transition_in: crossfade
- voiceover: "Y tú mantienes el control: eliges las carpetas que ve, ves cada paso y puede pedirte permiso antes de actuar. Empieza por tareas sencillas, revisa siempre el resultado y recuerda que algunas funciones cambian según tu plan y tu país."
- hero: el panel (papel: permisos)
- motion: tres filas «Tú eliges la carpeta», «Ves cada paso», «Te pide permiso» con interruptor que se activa con la voz; la última línea en textoSuave
- seam: fundido
- constraint: sin prometer disponibilidad; sin nombres de planes
- why: seguridad y control para público no técnico (fuentes §7) y el aviso de variación por plan/país (aviso 3)

## Frame 14 — Cierre

- status: animated
- src: compositions/14-cierre.html
- duration: 8s
- scene: Dos frases enormes que ocupan el cuadro: «Chat para preguntar.» / «Agente para que te lo entreguen hecho.» (pieza sostenida)
- transition_in: crossfade
- voiceover: "Chat para preguntar. Agente para que te entregue el trabajo hecho. Empieza por una tarea pequeña de tu semana."
- hero: burbuja y carpeta juntas, pequeñas, a cada lado (callback a 04 y 05)
- motion: primera frase entra y se queda; la segunda entra con la voz; el resto del cuadro no se mueve (pieza sostenida)
- seam: fundido al logo de cierre (0,8 s)
- constraint: sin llamada a la acción comercial ni URL
- why: repite el mensaje y deja una acción concreta y pequeña

## Frame 15 — Logo de cierre

- status: animated
- src: compositions/15-logo-cierre.html
- duration: 4s
- scene: Fondo claro; el logo se anima y se queda sostenido
- transition_in: crossfade
- voiceover: ""
- hero: el aro del logo (vuelve del plano 01)
- motion: igual que 01 pero más corta (aro 0,9 s, W, letras) y 1,5 s de logo sostenido con un pulso suave; después fundido suave
- seam: fin
- audio: pad que se cierra; cierre limpio
- constraint: sin subtítulos; no recolorear ni deformar
- why: cierra con la marca igual que abre
