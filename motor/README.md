# Motor de Remotion de kaleidos (`motor/`)

Un único motor para todos los vídeos: **un vídeo = una carpeta de datos (`timeline.json` + medios) + un estilo
(`tokens.json` + fuentes)**. El motor no sabe nada del contenido; solo pinta la línea de tiempo que genera
`tools linea` (contrato en `docs/CONTRATO.md`). El render final es **siempre en AWS Lambda**; en local solo se
sacan fotogramas de control y tramos de prueba.

Versiones fijadas: Remotion **4.0.529** en los 29 paquetes `remotion`/`@remotion/*` (incluidos `lambda`, `three`,
`media` y `fonts`), `three` 0.178.0, `@react-three/fiber` 9.2.0, `zod` 4.5.4, React 19.2.3, TypeScript estricto.

## Uso

```bash
cd motor
npm install
npm run estilos        # ../estilos/*/{tokens.json,estilo.md,fonts} → public/estilos (sin referencias/) + efectos
npm run lint           # eslint (src, scripts, fixtures) + tsc

# Fixture de desarrollo (89 s sobre el mezzanine de DORA v1, enlazado con un enlace duro)
node fixtures/demo/generar.mjs --medios      # timelines + máscara/plancha sintéticas + ilustración (≈1,5 min)

# Fotogramas de control + hoja de contactos (un empaquetado en out/bundle y un navegador)
node scripts/stills.mjs demo --at eventos --estilo prueba-oscuro
node scripts/stills.mjs demo --at 3,1:05,f250 --estilo curso-azul --timeline timeline-recorte.json
node scripts/stills.mjs <slug> --at eventos --comp Vertical

# Tramo local (pruebas y medidas)
node scripts/render-local.mjs demo --frames 241-340 --gl swangle --concurrency 1

# Calibración del modelo de coste (100 f por modo, una pestaña, swangle y angle)
node scripts/medir.mjs

# Lambda: SIEMPRE primero el plan (no llama a AWS ni lee credenciales)
node scripts/lambda.mjs <slug> --dry-run
node scripts/lambda.mjs crear-bucket-privado --dry-run
```

`<slug>` es `../proyectos/<slug>/` (sus medios locales en `media/`) o, si no existe, `motor/fixtures/<slug>/`. Si
`media/` aún está vacío, los scripts usan en **solo lectura** `<proyecto>/timeline.json` y
`work/{mezzanine,plancha,mascara}.mp4`, ignorando los que se estén escribiendo (modificados hace < 2 min).
Opciones comunes: `--estilo`, `--timeline <archivo del media/>`, `--ponente auto|recorte|marco`, `--gl angle|swangle`.

## Arquitectura

```
src/
  index.ts · Root.tsx          composiciones Horizontal (tamaño de timeline.json) y Vertical (1080×1920)
  Programa.tsx                 la pila de capas (común a las dos composiciones)
  datos/contrato.ts            zod: timeline.json, tokens.json y props (también lo usan los scripts)
  datos/cargar.ts              descarga y valida timeline + tokens (caché por pestaña, reintentos)
  tema/                        Motor.tsx (contexto useMotor/useTema, fuentes con @remotion/fonts),
                               tema.ts (todo lo visual sale de los tokens), anim.ts, color.ts, unicode.ts
  lib/                         camara.ts (cámara virtual), disposicion.ts (zonas y marco del ponente),
                               linea.ts (consultas sobre la timeline), ponente.ts (cámara efectiva)
  capas/                       Fondo, Ponente (recorte y marco), Tramos (EDL con @remotion/media),
                               Capas3D, Subtitulos, Hud, Grano, Sonido, MarcaDepuracion
  paneles/                     CapaPaneles (despacho por kind), Listas, Comparar, Textos, Diagramas,
                               Rotulos (capítulo, intro, outro), Transicion, Iconos, Base
  tres/                        Escenario (ThreeCanvas), materiales (estándar/toon + tinta), textura
                               (CanvasTexture), catalogo (15 objetos), Gesto3D, pantalla (screenToWorld),
                               Ilustracion (2,5D)
scripts/                       estilos, stills, render-local, medir, lambda (+ lib/comun, lib/coste)
fixtures/                      estilos de prueba (prueba-oscuro, prueba-claro) y el fixture demo
```

### Datos y privacidad

- **Props pequeñas** (§4): `timelineSrc`, `estilo`, `media` y `opciones` (solo pruebas).
- `calculateMetadata` descarga `timeline.json` (local: `staticFile`; Lambda: URL https prefirmada) y
  `public/estilos/<estilo>/tokens.json`, los valida con zod y devuelve **solo** duración, fps y tamaño. La
  línea de tiempo **no** se devuelve como props resueltas: en Lambda, Remotion serializa esas props y, si pasan
  de ~200 KB, las guarda en el bucket `remotionlambda-*`, que es de lectura pública. En su lugar, cada pestaña
  del renderizador descarga `timeline.json` una vez (`ConDatos`, con `delayRender` y caché de módulo).
- Fuentes: `loadFont` de `@remotion/fonts` desde `staticFile("estilos/<estilo>/fonts/...")`, con el
  `unicode-range` del subconjunto (latin / latin-ext, del nombre del archivo) para que se compongan bien.

### Pila de capas (METODO §3 y §7.2)

`fondo del estilo → 3D detrás → ponente → ilustraciones 2,5D → 3D delante → rótulos y paneles 2D → subtítulos
→ HUD → outro → grano`

- **Con recorte**: dentro de un `AbsoluteFill` con `isolation: isolate` se pintan el fondo y el 3D de detrás
  (B), encima la máscara con `mix-blend-mode: multiply` + `filter: invert(1)` (B = fondo·(1 − α)) y la plancha
  premultiplicada con `plus-lighter` (A). Geometría: `timeline.plancha` (región de la fuente → plancha) y la
  cámara. La voz sale del mezzanine con `<Audio>`; plancha y máscara van mudas.
- **Sin recorte**: el mezzanine dentro de su marco (`tokens.ponente.marco`: redondeado, recto, arco, circulo o
  ninguno; `borde`), con las disposiciones de DORA: `completa`, `dividida` (el ponente en una mitad) o `esquina`
  (ventana pequeña para paneles anchos). Bloques consecutivos iguales se funden; transición de 14 fotogramas.
- **Vídeo**: `@remotion/media` `<Video>` con `disallowFallbackToOffthreadVideo` (en Lambda cada función pide
  solo rangos de bytes), un `<Sequence>` por tramo de la EDL, `trimBefore = src·fps` y microfundido de audio de
  2 fotogramas en cada corte.

### Cámara virtual (METODO §7.3)

`lib/camara.ts` calcula, con el fotograma absoluto y **fuera** de los tramos de vídeo, escala y desplazamiento
de la fuente a partir de `timeline.planos` (`s`, `tx`, `ty`, `nariz`, `zoom`): acercamiento lento dentro del
plano, transición de 16 fotogramas centrada en la frontera cuando entra o sale un plano lateral (sideL/sideR),
cortes secos en el resto y el borde inferior de la fuente nunca visible. Sin recorte, el vídeo además cubre
siempre su ventana (nunca se ven sus bordes).

### Paneles 2D

Los 12 `kind` del contrato (`lista`, `pasos`, `checklist`, `comparativa`, `opciones` con foco y sello de
veredicto, `cifra` con contador y aro si es %, `cita`, `clave`, `linea`, `mapa`, `tarjeta`, `caso` con sello),
más `pop`, rótulo de capítulo, intro y outro. Cada elemento entra cuando la voz lo nombra (`en`). Todo toma del
tema color (acento del capítulo), tipografía, radios, estilo de panel (`solido`, `cristal`, `papel`, `tinta`),
curva y duración de entrada y transición (`empuje`, `fundido`, `bloques`, `barrido`, `zoom`). Los anchos se
adaptan (paneles de 840 px en la mitad libre; 1300 px en `esquina`; disposición vertical si no caben). Iconos:
catálogo propio de 43 iconos de trazo SVG (`paneles/Iconos.tsx`), sin descargas.

Subtítulos palabra a palabra con la palabra activa en el acento del capítulo (`caja`, `contorno` o `limpio` con
halo de contraste; activa: `acento`/`capitulo` en color, `subrayado` con bloque de `superficie2`, `ninguna`).
Se colocan bajo el ponente cuando hay un gráfico en el otro lado. HUD: barra de progreso por capítulos y chip.

### 3D

`@remotion/three` (`ThreeCanvas`, `flat` si el estilo es toon), todo en JSX y determinista (solo `t`). Material
estándar o `MeshToonMaterial` con rampa de N tonos y **contorno de tinta propio**: casco invertido (geometría con
vértices fusionados y normales suavizadas, inflada en el shader y pintada por detrás). Sin `Outlines` ni `Text`
de drei; texto sobre objetos con `CanvasTexture` y la fuente del estilo. Sin mapas de sombras: sombra de
contacto con un plano degradado.

Catálogo (`tres/catalogo.tsx`): `escudo`, `contrato`, `registro`, `cadena`, `balanza`, `salida` (de DORA),
`orbe`, `piramide`, `estrellas-ue`, `reloj`, `grafica`, `candado`, `engranajes`, `bombilla`, `documento`, y (§7)
`trofeo`, `llave`, `escalera`, `letras`.
Un nombre desconocido pinta el orbe y lo avisa.

- **`gesto3d`**: el objeto se ancla al punto medio de las muñecas de `timeline.gestos` (px de fuente → cámara
  efectiva del ponente → pantalla → mundo con `screenToWorld`), con el tamaño según la separación de las manos;
  antes del pico sigue la pista (si la hay) y desde el pico el punto queda **congelado**.
- **`Ilustracion`** (METODO §7.4): plano subdividido (240×135) desplazado por el mapa de profundidad en el shader
  de vértices, con compensación proyectiva `p.xy *= (D − z)/D` y anclajes `anchor(u, v, lift)` para objetos 3D
  y etiquetas 2D proyectadas. Probada con una imagen y un mapa sintéticos (`fixtures/demo/media/extras/`).

### Extensiones del contrato (compatibles hacia atrás)

| Campo | Para qué |
|---|---|
| `cifra.valorInicial` (o `contadorDesde`) | En el guion es `desde`, pero en `timeline.json` `desde` ya es el fotograma del evento |
| `cifra.decimales` | Decimales del contador |
| `plancha.mascara: "fuente" \| "plancha"` | Geometría del vídeo de máscara (por defecto la de `tools recortar`) |
| `gestos[].pista[]` | Trayectoria opcional de las muñecas antes del pico |
| `media.audio` (props) | Solo el audio del mezzanine; con recorte basta con él (Lambda no sube el mezzanine entero) |
| evento `ilustracion` | Ilustración 2,5D a pantalla completa (`imagen`/`profundidad` son claves de `media.extras`) |
| `color.sobreAcento`, `color.tinta`, `fondo.grano` | Opcionales en tokens |
| `opciones.{subtitulos,hud,grano,sonido,ponente,marca,perfil}` | Solo pruebas y perfilado |

## Scripts

- **`stills.mjs`**: un empaquetado en `out/bundle` (se rehace solo si cambia `src/`) y un navegador para todos
  los fotogramas. `--public-dir` = los medios del proyecto: `out/publico/` junta, con **enlaces duros** (no se
  copia ningún vídeo), `../proyectos/<slug>/media/` y `public/` (estilos y efectos), y el bundle lo enlaza con
  `symlinkPublicDir`, así que cambiar de proyecto no obliga a reempaquetar. Hoja de contactos con ffmpeg
  (`tile`) y rótulo de depuración en cada fotograma (ffmpeg no tiene `drawtext`). Limpia
  `remotion-v4-*-assets*`.
- **`render-local.mjs`**: tramo `--frames a-b` con `--gl angle|swangle`; deja `out/render/*.mp4` y una línea
  en `out/logs/tiempos.log`.
- **`lambda.mjs`**: todo el §6 del contrato (ver abajo).

### Lambda (`lambda.mjs`)

1. Lee `../aws/recursos.json` (si no existe, avisa y para): región, bucket de Remotion, función por defecto y
   bucket privado. Si `privado.bucket` es `null`, el dry-run lo dice y el modo real se para.
2. Sube `timeline.json`, mezzanine, plancha, máscara y extras al **bucket privado** (SSE-S3), con
   `@aws-sdk/client-s3` (dependencia de `@remotion/lambda`) o, si no estuviera, con la AWS CLI.
3. Firma URLs de corta duración (3 h por defecto) y las pasa como props.
4. `sites create` (bundle + `deploySiteFromBundle`) **solo** si cambia el hash de `src/` + `public/`
   (site `motor-<hash>`).
5. `renderMediaOnLambda` con `disableWebSecurity` (o `--solo-cors`), `privacy: "private"`, `framesPerLambda`,
   `crf`, `timeoutInMilliseconds: 240000`, `maxRetries: 2` y reintentos de la propia llamada.
6. Sondeo de `getRenderProgress` robusto a `ECONNRESET`/`ETIMEDOUT` (estado en `out/lambda/<slug>.json`;
   `--reanudar` lo retoma).
7. Descarga directa de S3 a `../resultados/<slug>.mp4` y `deleteRender` salvo `conservarSalida`.
8. Borra las entradas privadas y añade tiempos y coste real (`getRenderProgress().costs` + S3 + transferencia)
   a `proyectos/<slug>/informe.md`.

Credenciales desde `../.env` con un cargador propio que nunca imprime valores (el dry-run ni siquiera lo lee).
`crear-bucket-privado [--dry-run]`: `prefijo + 8 hex`, bloqueo de acceso público, SSE-S3, caducidad de
`caducidadDias`, CORS de solo lectura (GET/HEAD, `Range`), actualiza `recursos.json` y comprueba con `curl` sin
firma que responde 403 antes de darlo por bueno.

## Rendimiento y modelo de coste

### Medidas locales (M1 Pro, una pestaña como cada Lambda, 100 fotogramas, mínimo de 3 tomas)

`node scripts/medir.mjs --repeticiones 3` → `out/calibracion.json`. Se midió con la máquina compartida (el recorte de
`dora-v2` con RVM corría a la vez, carga media 11–15); las tres tomas de cada modo coinciden en ±3 %.

| Modo (fixture demo, estilo prueba-oscuro) | `angle` (GPU) | `swangle` (software, como Lambda) | DORA v1 swangle |
|---|---|---|---|
| Sin recorte: mezzanine en su marco + panel 2D + subtítulos (f 241–340) | 0,053 s/f | **0,189 s/f** | 0,199 |
| Con recorte: plancha + máscara + panel 2D + subtítulos (f 241–340) | 0,056 s/f | **0,429 s/f** | — |
| 3D: escena3d en un lienzo de 840×600 (f 1648–1747) | 0,061 s/f | **0,165 s/f** | 0,332 |
| 3D a pantalla completa: gesto3d (f 988–1062) | 0,067 s/f | **0,178 s/f** | — |

Con los medios **reales** de `dora-v2` (plancha 4K a 1968×1620 + máscara RVM 1080p, f 1150–1249, panel de opciones):
**0,362 s/f** con `swangle` y 0,048 con `angle` (algo menos que el fixture sintético, que queda como cota prudente).
Render local completo del fixture con la máscara real (`demo-v2`, 2225 f, `angle`, 6 pestañas): **115,6 s, 19,3 fps**.

Perfilado por software (opción `perfil`, A/B intercalado, 40 f con un panel animándose): todo 0,30 → sin paneles
0,24 → sin subtítulos ni HUD 0,23 → fondo liso 0,19 → sin sombra del marco 0,18 (suelo: vídeo, composición y
captura). Con recorte: 0,45 → sin la curva de la máscara 0,42 → sin máscara 0,31 → sin máscara ni plancha 0,15: cada
vídeo extra con mezcla cuesta ≈ 0,15 s/f. Cambios que se quedaron: fondo **estático** (la deriva repintaba la pantalla
entera en cada fotograma), capas propias (`will-change`) para vídeo, paneles y subtítulos, sombra del marco más corta
y la mezcla de la máscara limitada al rectángulo de la plancha (−4 %). Separar la sombra del panel en otra capa no
mejoró nada y se descartó.

### Modelo de coste (`scripts/lib/coste.mjs`)

- `s_lambda = F × s_local_swangle(modo)` con **F = 1,37**, obtenido del render real de DORA (19 599 f, 11,5 % 3D, 196
  funciones de 100 f, 0,29 $, 82 s) y sus medidas locales en esta misma máquina. El modelo reproduce DORA: 0,29 $ y
  85 s. Fijo por función: arranque 6 s + primer fotograma 2 s (antes 6 s y F = 1,46; con trozos de 100 f sale casi
  igual, pero con trozos pequeños el fijo ya no se esconde en F); tiempo = lanzamiento + trozo más lento + unión.
- Cada fotograma se clasifica por modo (sin/con recorte, sin vídeo, 3D parcial o a pantalla completa) a partir de la
  timeline; se añaden disco efímero, invocaciones, S3 y la transferencia de salida (0 $ dentro de 100 GB/mes).
- Máximo de 200 funciones: si no caben, sube `framesPerLambda`. `--concurrencia max` usa las 200 (ver modo narración).

| Vídeo | Funciones | s/f en Lambda | Render | Coste estimado |
|---|---|---|---|---|
| Fixture demo, 89 s sin recorte (30 % 3D) | 23 × 100 | 0,27 | ≈ 51 s | ≈ 0,03 $ |
| Fixture demo-v2, 89 s con recorte | 23 × 100 | 0,60 | ≈ 87 s | ≈ 0,06 $ |
| **`proyectos/dora-v2` (real)**: 19 113 f = 12 min 45 s, con recorte, 11,7 % 3D | 192 × 100 | 0,63 | ≈ 1 min 40 s | **≈ 0,55 $** (0,44–0,75) |
| Tipo DORA, 13 min sin recorte (11,5 % 3D) | 196 × 100 | 0,28 | ≈ 65 s | ≈ 0,28 $ (0,23–0,41) |
| Tipo DORA, 13 min con recorte | 196 × 100 | 0,63 | ≈ 100 s | ≈ 0,56 $ (0,45–0,76) |
| Clase de 30 min con recorte | 200 × 225 | 0,63 | ≈ 3 min | ≈ 1,19 $ (0,95–1,64) |
| Clase de 60 min con recorte | 200 × 450 | 0,63 | ≈ 6 min | ≈ 2,31 $ (1,85–3,19) |

Para `dora-v2` la subida privada es de 1,93 GB (≈ 5 min a 50 Mb/s): con recorte solo se sube el **audio** del
mezzanine (`audio.m4a`, extraído sin recodificar, 49 MB) en vez del mezzanine entero (1,3 GB).

El recorte duplica el coste por software (dos vídeos más que decodificar y mezclar). Si importa, las palancas son una
máscara a media resolución o empaquetar α en la propia plancha (cambio de contrato con `tools`).

### Disco

- Un único empaquetado en `out/bundle` (34 MB), que apunta con un enlace simbólico a `out/publico/`; ahí los medios
  del proyecto y `public/` van con **enlaces duros** (mismo volumen; si no, se copian). No se copia ningún vídeo.
- `public/` pesa 2 MB (9 estilos del catálogo + 2 de prueba, sin `referencias/`, y dos efectos WAV).
- Los scripts borran `remotion-v4-*-assets*` al terminar. El fixture demo enlaza el mezzanine de DORA (enlace duro);
  `demo-v2` copia solo 131 s (≈190 MB en total).

## Modo escenario y componentes «show» (estilo milikito, contrato §7)

Se activa con `timeline.escenario: true` o `tokens.escenario.activo` (`timeline.escenario: false` lo apaga). Todo es
opcional: sin estos campos el motor se comporta como antes. Código en `src/show/` (+ `src/lib/escenario.ts`).

| Pieza | Archivo | Qué hace |
|---|---|---|
| Escenario | `lib/escenario.ts`, `show/CapaEscenario.tsx`, `show/Registros.tsx › Lienzo` | Lienzo + patrón a 45° en las esquinas; caja de diapositiva y caja del ponente (radio 20, sombra) en `dos-cajas`, `grande`, `solo`, `completa`, `dividida`; transición de 0,5 s power3.inOut; pista `timeline.disposiciones` o derivada (titulo/lamina → grande, paneles → dos-cajas, gesto3d → solo, huecos ≥ 2 s → solo) |
| Ponente en su caja | `show/CajaPonente.tsx` | Con recorte: máscara + plancha sobre el menta de `escenario.camara`; sin recorte: mezzanine que cubre la caja. Nariz centrada, borde inferior nunca visible; voz en pista aparte |
| Registros | `show/Registros.tsx`, `tema/tema.ts › tokensDeRegistro` | `show` (rayos cónicos girando 2°/s, respiración, viñeta, 8 destellos y polvo), `editorial` (azul marino, «SIGLA · descripción», anillos radar, Barlow, palabras de `resalta` que se encienden cuando la voz las dice, iconos de línea en círculo), `lamina` (imagen a toda la caja con zoom; en paneles, papel de cómic y fichas con tinta). Todos los kinds se pintan en los tres, ajustados al alto de la caja |
| Titular de juego | `show/TitularJuego.tsx` | Contorno blanco + contorno de tinta + degradado con `background-clip` + brillo; entrada 0 → 1,12 → 1, destello diagonal, estallido. En `titulo`, rótulos, pop grande, cifra, sello e intro no de marca |
| Bocadillos | `show/Bocadillo.tsx`, `show/Reacciones.tsx` | Globo, nube, grito (contorno unido en SVG), brotan desde la cola y escriben letra a letra; en `lamina.bocadillos[]` o sueltos (`bocadillo`) junto a la cabeza |
| Fichas del método | `show/Fichas.tsx` | `hud.estilo: "fichas"`: vista / actual (salta al cambiar de capítulo) / pendiente, con `capitulos[].sigla` |
| Reacciones | `show/Reacciones.tsx` | `reaccion` (pregunta, idea, rayo, ok, alerta, corazon, reloj): pastilla que brota, flota 12 px y se va (~1,4 s); ≤ 2 a la vez en las esquinas de la caja |
| Sello | `show/Diapositivas.tsx › DiapoSello` | `sello`: giro −12°, golpe, sacudida de 3 fotogramas, polvo y destellos; color por `tono` |
| Marca | `show/Marca.tsx` | `intro.estilo: "marca"` / `outro.estilo: "marca"`: palabras que suben de una máscara, etiquetas, empuje a píldora con el ponente en bitono (en vivo) que se abre a tarjeta, rótulo de dos barras, pliegue a franja |
| Audio | `capas/Musica.tsx` | `timeline.audio.musica[]` (fundidos, bucle, volumen) y `sfx[]` (`en`), claves de `media.extras`. Si hay `sfx`, se apagan los efectos sintetizados del motor |
| 3D | `tres/catalogo.tsx`, `tres/letras.tsx` | `trofeo`, `llave`, `escalera` (5 peldaños que se construyen con las `etiquetas`), `letras` (`texto`, extruido con `public/fonts/3d/droid_sans_bold.typeface.json`, Droid Sans Bold, Apache 2.0: **sí** tiene á é í ó ú ñ ü ¿ ¡). `cadena` y `piramide` se escalan para que sus etiquetas no salgan del lienzo |

Fuera del modo escenario, `titulo`, `lamina` y `sello` salen como una tarjeta de diapositiva flotante en el lado libre,
y bocadillos y reacciones junto a la cabeza (`show/ShowNormal.tsx`).

**Estilo de prueba** `fixtures/estilos/milikito-escenario`: hereda de `estilos/milikito` con `"_base"` (lo resuelve
`npm run estilos`) y añade los campos §7.1 y los colores de `marca`. Si `tokens.marca` falta, los colores de la
apertura salen del tono de `escenario.camara`.

**Fixture** `fixtures/milikito` (88,8 s): ventana f10300–f12320 de `proyectos/dora-v2` (EDL, planos, subtítulos y
gesto reales; medios ENLAZADOS, no copiados) con todos los componentes, música y efectos de `estilos/milikito/audio`
(enlazados) y una lámina sintética (`lamina-reunion.svg` rasterizada con el Chrome de Remotion). Timelines:
`timeline.json` (recorte), `timeline-marco.json`, `timeline-kinds.json` (12 kinds × 3 registros + titulo, pop, sello,
cifra de juego) y `timeline-3d.json` (objetos nuevos; con `prueba-oscuro` sale en el modo normal y material estándar).

### Velocidad en `swangle` (una pestaña, 100 f, fixture milikito con recorte real, M1 Pro con carga 7–10)

| Modo escenario | s/f | Lambda estimado (×1,46) |
|---|---|---|
| Editorial (lista) + fichas + subtítulos, sin 3D | **0,398** | 0,58 |
| Show: rayos + destellos + titular de juego (`grande`) | **0,451** | 0,66 |
| · sin destellos / sin destellos ni giro de rayos | 0,423 / 0,420 | — |
| Escena 3D (escalera) en la caja + reacciones | **0,502** | 0,73 |
| Lámina + 2 bocadillos (`grande`) | **0,476** | 0,70 |

El escenario con recorte sale algo más barato que el recorte a pantalla completa (0,429) porque la mezcla de la
máscara se limita a la caja del ponente. Los destellos cuestan ≈ 0,03 s/f; el giro de los rayos, casi nada (es una
transformación de una capa ya rasterizada).

`lib/coste.mjs` clasifica cada fotograma del escenario por su diapositiva (editorial, show, lámina, 3D) y suma el 3D
de los gestos (lienzo del tamaño de la caja); sin recorte descuenta lo que cuesta el recorte en el modo normal.
`lambda.mjs` sube además todos los extras que referencia el timeline (láminas y capturas, música y efectos, con su
content-type) y los pasa en `media.extras`. Estimaciones con esta calibración:

| Vídeo | Funciones | s/f en Lambda | Render | Coste estimado |
|---|---|---|---|---|
| Fixture `milikito`, 88,8 s (15 % 3D) | 23 × 100 | 0,60 | ≈ 1 min 37 s | ≈ 0,07 $ |
| **`proyectos/dora-milikito`**: 15 426 f = 10 min 17 s, recorte, escenario, 17 extras (8,6 MB) | 155 × 100 | 0,62 | ≈ 1 min 48 s | **≈ 0,44 $** (0,35–0,60) |

Hojas: `out/stills/milikito-escenario`, `milikito-marco`, `milikito-kinds`, `milikito-3d-toon`,
`milikito-3d-estandar`, `milikito-vertical`, `dora-milikito`, `dora-milikito-swangle`, `dora-v2-arreglos`.

## Modo narración (vídeo sin ponente, voz de TTS · contrato §8)

`timeline.narracion: true` (+ `recorte: false`, sin `plancha`): la voz es una locución (`props.media.audio`, en local
`media/narracion.m4a`) y `props.media.mezzanine` pasa a ser opcional. Implica el modo escenario. `fuente`, `planos`,
`segmentos` y `gestos` sobran (plano neutro por defecto; `segmentos` vacío = la locución entera desde el fotograma 0).

| Pieza | Archivo | Qué hace |
|---|---|---|
| Contrato | `datos/contrato.ts` | `narracion`, disposición `voz`; en narración solo `completa` y `voz` (en eventos y en `disposiciones`), `gesto3d` es un error legible (usa `escena3d`), `recorte: true`/`plancha`/`escenario: false` también; `voz` fuera de narración, error |
| Disposiciones | `lib/escenario.ts` | `voz` = geometría de `grande` con la caja de voz en el recuadro del ponente (vertical: diapositiva alta + caja pequeña debajo); `completa` siempre con la diapositiva a sangre; lo derivado (rótulos, huecos) va a `voz` |
| Caja de voz | `show/CajaVoz.tsx` | Fondo de cámara del estilo (menta), onda de 27 barras simétricas y pastilla «Narración» (micrófono + tipografía de etiqueta) |
| Onda | `show/CajaVoz.tsx › OndaVoz` | `@remotion/media-utils` 4.0.529 (`getAudioData` a 16 kHz + `visualizeAudio`, 64 bandas, `smoothing`), solo del fotograma → determinista. Carga con `delayRender` y caché de módulo; si la locución no se puede decodificar NO se cancela el render: la onda sigue a las palabras de los subtítulos y se avisa por consola (probado con un 404) |
| Voz | `capas/Tramos.tsx › Locucion` | La locución entera o por `segmentos` |
| Anclas | `show/CapaEscenario.tsx › cajaDe` | Bocadillos y reacciones: a la caja de voz en `voz`; en `completa`, a un recuadro en la esquina inferior derecha |
| Marca | `show/Marca.tsx` | La píldora de la apertura de marca lleva la onda en bitono (no hay foto) |

Sin mezzanine no se monta ningún `<Video>` (caja del ponente, bitono, marco). El motor para con un error legible si
falta `media.audio` en narración o `media.mezzanine` sin ella.

**Fixture** `fixtures/narracion` (46 s, estilo milikito): la voz de una ventana de 45 s de `dora-milikito` (EDL aplicada,
mono, como un TTS) con sus subtítulos; titular (completa), lista editorial + reacción (voz), lámina con bocadillo (voz),
rótulo (voz), sello + bocadillo suelto + reacción (completa), cifra + bocadillo (voz), escena 3D (voz). Genera también
`timeline-completa.json` (para medir) y `timeline-largo.json` (5 250 f, solo para la estimación). Hojas:
`out/stills/narracion/hoja.jpg` y `narracion-anclas/hoja.jpg`.

```bash
node fixtures/narracion/generar.mjs
node scripts/stills.mjs narracion --at eventos --nombre narracion
node scripts/medir.mjs --gl swangle --modos narracion-voz,narracion-completa
node scripts/lambda.mjs narracion --dry-run --timeline timeline-largo.json      # proyecto.json › lambda.concurrencia: "max"
```

### Velocidad y coste (swangle, una pestaña, 100 f de una lista editorial; máquina cargada, carga 11–13)

| Disposición | s/f local | Lambda (×1,37) |
|---|---|---|
| `voz` (diapositiva grande + caja de voz con la onda + subtítulos) | **0,230** | 0,32 |
| `completa` (la misma lista a sangre) | **0,172** | 0,24 |

La onda y su caja cuestan ≈ 0,06 s/f. Show, lámina y 3D suman lo mismo que en el escenario con ponente.

**Concurrencia máxima** (`--concurrencia max` o `proyecto.json › lambda.concurrencia: "max"`; también un número):
`framesPerLambda = max(MINIMUM_FRAMES_PER_FUNCTION, ⌈n / MAX_FUNCTIONS_PER_RENDER⌉)`, leídos de
`@remotion/serverless-client` (200 funciones y 5 f en 4.0.529). Con trozos pequeños pesa el fijo de cada función:
arranque 6 s + primer fotograma 2 s + la locución para la onda (0,2 s + bytes/30 MB/s + 0,004 s por segundo de audio).

| 5 250 f (3 min 30 s) de narración | Funciones | Render | Fijo / facturado | Coste estimado |
|---|---|---|---|---|
| `--concurrencia max` | 195 × 27 f | ≈ 45 s | 48 % | **≈ 0,16 $** (0,13–0,22) |
| `framesPerLambda` 100 | 53 × 100 f | ≈ 75 s | 20 % | ≈ 0,10 $ (0,08–0,14) |

## Hojas de contactos que conviene revisar

Cada fotograma lleva arriba a la derecha su rótulo de depuración (fotograma, tiempo, plano, modo, estilo y evento).
Se regeneran todas con `./scripts/hojas.sh` (≈2 min).

| Hoja | Qué muestra |
|---|---|
| `out/stills/oscuro-marco/hoja.jpg` | Todos los kinds, pop, escena3d, gesto3d, ilustración, intro, rótulos y outro · oscuro (cristal, rejilla, bloques) · sin recorte |
| `out/stills/oscuro-recorte/hoja.jpg` | Lo mismo con recorte (máscara y plancha sintéticas: el halo blanco es la elipse) |
| `out/stills/claro-marco/hoja.jpg` · `claro-recorte/hoja.jpg` | Estilo claro (papel, tinta, toon con contorno, marco en arco, subtítulos limpios con subrayado) |
| `out/stills/catalogo3d-estandar/hoja.jpg` · `catalogo3d-toon/hoja.jpg` | Los 15 objetos 3D en material estándar y en toon con tinta |
| `out/stills/dora-v2-recorte/hoja.jpg` · `dora-v2-marco/hoja.jpg` | **El proyecto real `dora-v2`** (timeline de `tools linea`, plancha y máscara reales): 81 fotogramas, uno por evento, rótulo, intro y outro, con y sin recorte |
| `out/stills/demo-v2-real/hoja.jpg` · `demo-v2-render-completo.jpg` | Fixture con la máscara real de dora-v2 (y el MP4 completo renderizado, un fotograma cada 4 s) |
| `out/stills/curso-azul-marco/hoja.jpg` · `cuaderno-recorte/hoja.jpg` | Dos estilos reales del catálogo (oscuro sin recorte y claro manuscrito con recorte) |
| `out/stills/vertical-oscuro/hoja.jpg` | Composición Vertical (básica) |
| `out/stills/transiciones.jpg` | Las 5 transiciones (bloques, empuje, barrido, fundido, zoom): entrada de panel y cortinilla del outro |

## Problemas conocidos y pendientes

- **`dora-v2`**: su `timeline.json` real **valida con el esquema del motor** y se pinta entero con plancha y máscara
  reales (hojas `dora-v2-*`), pero su `media/` sigue vacío: se probó con el respaldo de solo lectura. No se ha
  revisado cada uno de los 64 eventos a tamaño completo, solo la hoja y una muestra.
- **Lambda sin ejecutar** (solo `--dry-run`): falta el bucket privado (`recursos.json › privado.bucket` es `null`);
  crearlo requiere confirmación (`node scripts/lambda.mjs crear-bucket-privado`). Tras el primer render real conviene
  recalibrar F con el coste que queda en `informe.md`.
- **Medidas con la máquina compartida**: repetir `node scripts/medir.mjs --repeticiones 3` con la máquina tranquila.
- `palabraActiva: "acento"` pinta la palabra con el acento **del capítulo** (lo pide el encargo); el esquema de
  `estilos/` lo describe como `color.acento` fijo. Es una línea en `capas/Subtitulos.tsx` si se prefiere lo otro.
- `cifra.desde` del guion choca con el `desde` del evento en `timeline.json`: el motor lee `valorInicial` (o
  `contadorDesde`); `tools linea` debe escribirlo así.
- `stills.mjs` no usa `--public-dir` literalmente: junta medios y `public/estilos` en `out/publico` (enlaces duros),
  porque las fuentes y los tokens tienen que estar en el mismo directorio público que los medios.
- La Vertical es básica (ponente arriba, gráficos abajo; la ilustración 16:9 se recorta).
- Música: `tokens.audio.musica` se ignora (no hay pistas con licencia); solo efectos sintetizados.
- Las fuentes manuscritas (p. ej. Patrick Hand) se ven algo pequeñas con los mismos cuerpos de letra; faltaría un
  factor de escala por estilo.
