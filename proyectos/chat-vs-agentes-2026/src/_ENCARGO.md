# Encargo para los agentes de escena — vídeo «Chat o agente» v2 (anuncio de producto dinámico)

Eres un **motion designer sénior**. Construyes UNA o varias escenas de un vídeo de ~2 min, 1920×1080, 30 fps, en HTML + CSS + GSAP + SVG (HyperFrames). Lo que se busca: **anuncio de producto súper dinámico, muy visual, divertido, con motion graphics de nivel profesional**. Nada de "tarjetas estáticas con fundidos". Cada plano debe sentirse diseñado: jerarquía clara, profundidad (sombras, capas, blur), movimiento con intención (anticipación, rebote, solapamientos, cámara virtual), y algo nuevo cada 1,5–3 s.

## Qué ya existe (léelo antes de escribir)

- `frame.md` (raíz del proyecto): estilo. Paleta de la web de OpenWebinars: violeta #7D29E0, rosa #FF01A2, tinta #0D1320, fondo #FAFBFC, violeta profundo #2F125E, índigo #5E3DE6, lavanda #9B61F6, lila #F2E7FC, aviso #B54708. Tipografía **Inter** (400/600/800) y **JetBrains Mono** (400, solo para código). Titulares Inter 800 con tracking −0,04em. **Solo estas fuentes**: ya están cargadas por el ensamblador (`@font-face`), no añadas otras.
- `src/_kit.css` y `src/_kit.js`: **kit compartido** que el ensamblador inyecta en tu escena (clases `.h .mask .eye .panel .chip .win .orb .ripple .simlabel .bg-*`; helpers `rise up pop fade slam typeText count orbTo orbSet orbSquash orbPulse clickAt sceneIn sceneOut cue beat`; constantes `tl E SPR IO ID DUR CUES BEATS`). **Léelos**: úsalos para ser coherente con el resto del vídeo y no los modifiques.
- `work/scenes.json`: para cada escena, `start`, `dur`, `theme` y las **palabras de la locución con su tiempo relativo a la escena** (`words[].s/e`) y los **pulsos de la música** (`beats`, 110 BPM). Tu escena recibe `CUES` y `BEATS` ya inyectados; usa `cue("palabra")`/`cue(índice)` para que cada elemento aparezca **cuando la voz lo dice** y `beat(t)` para clavar golpes al ritmo.
- `STORYBOARD.md`: busca los bloques `## Frame NN` de TUS escenas: son tu especificación (qué se ve, voz, esquema). Los esquemas (`blueprint:`) están en `/Users/openwebinars/.claude/skills/hyperframes-animation/blueprints/<id>.md`: **léelos** y reproduce su "signature move". También hay reglas de movimiento en `/Users/openwebinars/.claude/skills/hyperframes-animation/rules/` (p. ej. svg-path-draw, kinetic-beat-slam, spring-pop-entrance, particle-burst, card-morph-anchor, split-tilt-cards, ai-tracking-box, stat-bars-and-fills, 3d-page-scroll, camera-cursor-tracking).
- `referencias-v2.md`: referencias y técnicas a replicar (solo inspiración).
- Los fotogramas de v1 (`work/hoja-borrador.jpg`) muestran lo que NO se quiere: pantallas estáticas con listas.

## Formato del fichero que entregas: `src/NN-nombre.html`

El nombre exacto de cada escena está en `work/scenes.json` (`file`). Estructura:

```
<!--CSS-->
/* usa el prefijo #__ID__ en todos los selectores; el ensamblador sustituye __ID__ por el id real (s06…) */
#__ID__ .mi-clase { … }
<!--HTML-->
<div class="stage">            <!-- TODO tu contenido dentro de .stage; sceneIn/sceneOut animan .stage -->
  <div class="bg bg-deep clip" data-start="0" data-duration="__DUR__" data-track-index="0"></div>   <!-- fondo a pantalla completa: clase clip con estos atributos -->
  …
  <div class="orb"></div>      <!-- el orbe del agente, si la escena lo usa -->
</div>
<!--JS-->
sceneIn("whip");               // tu código; usa tl (ya creado) y los helpers del kit. NO registres window.__timelines: lo hace el ensamblador
…
sceneOut("whip");
<!--SFX-->
[{"k":"pop","t":1.2,"v":0.5}]  <!-- opcional: efectos de sonido (t relativo a la escena, v volumen 0–1). k ∈ whoosh pop click key riser impact ding shimmer. Ya se añade un whoosh al inicio de cada escena -->
```

Reglas del tema: si tu escena es `dark` (ver `scenes.json › theme`) pinta tú el fondo (`bg-deep` o `bg-violet`) y usa texto blanco; si es `light`, el fondo base ya es #FAFBFC con un resplandor violeta→rosa detrás: **no pintes fondo opaco** salvo que el plano lo pida. Los **subtítulos** son una capa global en la banda inferior (y 940–1020): **no pongas nada importante por debajo de y = 930** ni repitas la frase de la locución como texto en pantalla (los subtítulos ya la dicen): en pantalla va el **concepto visual**, no la frase.

## Verificación (obligatoria, tú mismo)

```bash
cd /Users/openwebinars/Dev/kaleidos/proyectos/chat-vs-agentes-2026
node build2.mjs --preview=NN-nombre            # monta SOLO tu escena en work/prev/NN-nombre/  (no toca nada más)
npx hyperframes snapshot work/prev/NN-nombre --at 0.5,1.5,2.5,… --no-end --describe false -o work/prev/NN-nombre/snap
npx hyperframes check work/prev/NN-nombre      # lint+layout+contraste de tu escena
```
Mira las capturas (`snap/contact-sheet.jpg` y los PNG) en **varios instantes de la escena** (entrada, mitad, final) y corrige hasta que se vea profesional. **No ejecutes `node build2.mjs` sin `--preview`** (varios agentes trabajan a la vez) y no edites ficheros que no sean tus `src/NN-*.html`.

## Reglas técnicas (HyperFrames; el lint las comprueba)

- Todo determinista: nada de `Date.now`, `Math.random` sin semilla, red, ni estados de ratón. Un único timeline `tl` (ya creado y registrado). `repeat:-1` prohibido; para bucles usa un nº finito de repeticiones.
- No pongas `transform` CSS inicial en un elemento al que luego animas `x/y/scale/rotation` con GSAP (usa `fromTo`, `xPercent/yPercent` o márgenes para centrar). Los elementos con `transform` animado deben ser **block/inline-block con tamaño real**.
- No animes `display`/`visibility`/`autoAlpha`; usa `opacity`. No uses `<br>` en texto; titulares en `.mask>.r` con `white-space:nowrap`. Nada de `class="clip"` salvo la capa de fondo indicada.
- Los elementos que entran con `fromTo` desde `opacity:0` quedan **visibles al terminar**; el elemento "héroe" debe verse antes de 0,5 s (no empieces con pantalla vacía).
- Textos legibles (contraste AA, `hyperframes check` lo mide; el texto sobre fondo oscuro, blanco). Tamaños mínimos de lectura en 1080p: ≥ 36 px para texto de UI importante; titulares 120–260 px.
- Sin marcas de terceros (nada de logos ni nombres de productos reales salvo "Claude", "ChatGPT", "Remotion" y "HyperFrames" **solo donde el guion lo cita**). Sin datos personales: todo el contenido de las interfaces simuladas es ficticio y genérico (nombres de archivo genéricos, "Cliente A", "Empresa X", etc.). Todo en **español**.
- Las escenas de «Simulación» llevan `<div class="simlabel on-dark">Simulación · …</div>` (ver el kit).
- Cámara virtual: envuelve el contenido en un `.world` y anima `scale/x/y` (no el `.stage` entero, que lo usa sceneIn/Out).
- Ritmo: golpes (slam, pop, cambios de plano) sobre los **pulsos** de la música (`beat(t)`) cuando sea natural; el resto, sobre las **palabras** de la voz (`cue`).
- Sé generoso con el detalle (sombras suaves, brillo de borde, partículas de confeti/archivitos, estelas del orbe, números que cuentan, barras que se llenan) pero sin saturar: un foco claro por momento.

## Entrega

Al terminar responde con ≤ 8 líneas: ficheros escritos, qué has comprobado (instantes capturados) y cualquier cosa que el orquestador deba saber (p. ej. sfx que has pedido o límites).
