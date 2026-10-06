# Solución de problemas

Errores conocidos y cómo se arreglan, por áreas. Salen de los proyectos reales (`dora-videocurso-v1`, `dora-v2`,
`dora-milikito`, `devday-2026`), de `motor/PROGRESO.md`, `tools/PROGRESO.md`, del método
([`METODO_EDICION_IA.md`](METODO_EDICION_IA.md) §11) y de la skill `edicion-ponente`.

Dos reglas antes de nada: **verifica con imágenes y recuentos**, no con suposiciones; y **no filtres con `grep` la
salida de ffmpeg** al lanzar procesos largos (guarda el registro completo y léelo: así se perdieron errores reales).

## 1. Entorno e instalación

| Síntoma | Causa | Solución |
|---|---|---|
| `tools/kaleidos`: `uv: command not found` | Falta `uv` | `brew install uv` (el envoltorio también busca `/opt/homebrew/bin/uv`) |
| `transcribir` no encuentra `whisper-cli` | whisper.cpp sin compilar | `tools/kaleidos instalar` (compila con Metal y descarga modelos; `--que whisper pose rvm manos profundidad ampliar`) |
| `pose` aborta con `graph_service.h … DrishtiMetalHelper` | MediaPipe 1.0.x en macOS | Ya está fijada la 0.10.35 en `tools/pyproject.toml`: no la subas |
| Un comando con `drawtext` falla | ffmpeg de Homebrew sin `drawtext` | No uses `drawtext`; los stills ya llevan su rótulo de depuración del motor |
| `timeout: command not found` | macOS no lo trae | `perl -e 'alarm 120; exec @ARGV' <comando>` |
| `scripts/capture.mjs` falla al buscar Chrome | Usa Chrome for Testing de `~/.cache/puppeteer/chrome/` | `npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer` |
| `muestrario.mjs` o `captura.mjs` de estilos: falta `puppeteer-core` | Dependencia de la raíz | `npm install` en la raíz o `NODE_PATH=~/videos-opus/node_modules node …` |
| Lambda rechaza el render o el site | Versión de Remotion distinta de la de la función | Todo `motor/` va en **4.0.529 exacto**; no actualices paquetes `remotion`/`@remotion/*` sueltos |

## 2. Preproceso (`tools/`)

| Síntoma | Causa | Solución |
|---|---|---|
| `mascara.mp4` (u otro vídeo) con menos fotogramas que el bruto | El proceso se paró a mitad sin error | Cuenta fotogramas ([`FLUJOS.md`](FLUJOS.md) A.2). `tools/kaleidos recortar <slug>` continúa por partes de 2 500 fotogramas; `--desde F` desde uno concreto; `--solo plancha` rehace la plancha |
| El recorte va a 3–4 fps | GPU compartida (otro render, pose, Whisper) o memoria en swap | Lánzalo solo. Con la GPU libre, RVM resnet50 va a ~28 fps en 4K. `--medir 60` mide sin tocar salidas |
| `pose` se queda colgado | Un proceso nativo murió | Ya da error en vez de colgarse; relanza (`--partes 1` si se repite) |
| Faltan frases repetidas en la transcripción | Whisper se salta la segunda toma y pega el texto a la primera | `tools/kaleidos transcribir <slug> --rellenar` retranscribe los huecos con voz |
| Palabras mal reconocidas (siglas, productos) | Sin términos del dominio | `--prompt` en `nuevo` (o `proyecto.json › whisper.prompt`) antes de transcribir; después, `fixes` en el guion |
| La voz solo está en un canal | Grabación mono en estéreo | `analizar` lo detecta y `master` usa ese canal (dual-mono) |
| En narración, `analizar`/`master`/`recortar`/`pose` dan error | No hay bruto | No se aplican: en narración van `voz` y `transcribir` |
| Disco justo con dos proyectos del mismo bruto | Preproceso duplicado | `nuevo --desde-proyecto OTRO`: enlaces duros, 0 bytes extra |
| No caben recorte, pose y transcripción a la vez | 16 GB de memoria | Secuencial (`preparar`) o solo pose en paralelo con recortar (`--paralelo`) |

## 3. Guion y `linea`

`linea` lista los problemas en pantalla y en `timeline.json › avisos`; los que empiezan por `ERROR:` hacen que salga
con código distinto de 0.

| Aviso | Qué pasa | Solución |
|---|---|---|
| `cue no encontrado: [s, "frase"]` | La frase no está tal cual tras aplicar `fixes`, o está antes de `s − 2 s` | Copia la grafía de `work/transcripcion.txt` y baja el segundo aproximado. `linea` ya reintenta con los `fixes` aplicados a la frase. `--estricto` lo hace bloqueante |
| `ERROR: evento N (…) se queda sin duración tras resolver solapes y rótulos` | Evento dentro de la intro o de un rótulo de capítulo (3,4 s) | Pon su cue después de `intro.hasta` o del rótulo, o quítalo (en `devday-2026` salieron 6 y se arreglaron así) |
| `evento N empezaba dentro del rótulo …: se retrasa N fotogramas` | Aviso normal | Revisa que sigue entrando con su frase |
| `ERROR: solape de eventos …` | Dos eventos a menos de 6 fotogramas | Ajusta `hasta` del primero (salvo `reaccion`, que sí puede solaparse) |
| `ERROR: capítulo N empieza dentro del rótulo del anterior` | Capítulos a menos de 3,4 s | Sepáralos o fúndelos |
| `ERROR: gesto3d no vale en narración` | No hay manos | `escena3d` con el mismo objeto |
| `ERROR: … disposición «X» no válida en narración` | Solo valen `completa` y `voz` | Cámbiala o quítala (la decide `linea`) |
| `ERROR: narración: el guion no admite «cortes»` | La locución ya sale montada | Quita `cortes`; edita `locucion.json` |
| `ERROR: … contiene N palabras: debe ser un tramo sin voz` | `intro.previo` u `outro.coda` sobre voz (con ponente) | Elige un tramo del bruto en silencio |
| `«clave» no entra en timeline.json hasta que esté en media/extras` | Lámina, captura o audio sin enlazar | `tools/kaleidos media <slug>` y otra vez `linea` |
| `ERROR: … el bocadillo … cae fuera de …` | `x`/`y` fuera de la lámina | Centro del bocadillo en fracción de la caja (0–1), en el hueco de la imagen |
| `ERROR: el objeto «letras» necesita «texto»` | Falta el texto a extruir | `"texto": "DORA"` |
| Aviso de densidad (> 15 s sin cambio visual) | Tramo largo sin nada | Añade un elemento de panel, una reacción o un cambio de disposición |
| `capitulos`: el cierre dura < 10 s | YouTube exige 10 s por capítulo | Aviso: se une al capítulo anterior |
| El contador de `cifra` arranca mal | `desde` del guion choca con el `desde` del evento | Nada que hacer: `linea` lo traduce a `valorInicial` |

## 4. Motor, stills y render local

| Síntoma | Causa | Solución |
|---|---|---|
| Disco lleno tras unas pruebas | Remotion copia `public/` y descarga cada vídeo en cada llamada | Los scripts usan un bundle fijo, enlaces duros y borran `remotion-v4-*-assets*`; usa siempre `stills.mjs`/`render-local.mjs`, no `npx remotion render` a pelo |
| `el estilo «X» no está en public/estilos` | Estilo sin copiar al motor | `(cd motor && npm run estilos)` |
| `no hay timeline.json en los medios de <slug>` | Falta `linea` o `media` | `tools/kaleidos linea <slug> && tools/kaleidos media <slug>` |
| «media/ vacío: se usan timeline.json y work/ de solo lectura» | `media` sin ejecutar | Es un respaldo válido para stills; ejecuta `media` antes de Lambda |
| Un objeto 3D o un contorno no se pinta | Componentes de drei que se añaden tras el primer fotograma (`Outlines`, `Text`) | Todo el 3D en JSX y determinista; texto con `CanvasTexture` |
| El objeto 3D sigue a las manos cuando bajan | Anclaje sin congelar | Ya se congela en el pico del gesto; si pasa, revisa `gestos[].pico` |
| El rótulo de un `gesto3d` tapa la cara en escenario | Objeto alto (pendiente del motor) | Otro objeto o `escena3d` en ese momento |
| Un bocadillo suelto con `lado: "der"` en `voz` queda pegado al borde | Pendiente del motor | Usa `lado: "izq"` |
| El título queda tapado por el ponente | Encuadre | Los planos forzados de `linea` ya lo evitan; si pasa, cambia el `lado` del evento |
| Remotion Studio va a saltos | Compone en directo 4K + máscara | La vista fiable son los stills y el MP4 de `render-local.mjs` |
| Los stills se ven distintos de Lambda | GPU local (`angle`) frente a software en Lambda | `--gl swangle` para ver lo mismo que Lambda |
| La composición `Vertical` sale básica | Aún no está trabajada (la apertura de marca se recorta) | Revísala con stills antes de ofrecerla |
| Las fuentes manuscritas se ven pequeñas | Mismo cuerpo de letra en todos los estilos | Pendiente: factor de escala por estilo |
| La onda de la caja de voz no sigue al audio | La locución no se pudo decodificar | El motor no cancela el render: la onda sigue a los subtítulos y lo avisa por consola; revisa `media/narracion.m4a` |

## 5. Lambda y AWS

| Síntoma | Causa | Solución |
|---|---|---|
| `recursos.json › privado.bucket es null` | Sin bucket privado | `node motor/scripts/lambda.mjs crear-bucket-privado --dry-run` y, con OK, sin `--dry-run` |
| `el bucket privado … no está verificado` | La sonda sin firma no dio 403 | **No subas nada**; revísalo con el usuario |
| `faltan credenciales en ../.env` | `.env` incompleto | Rellénalo desde `.env.example` (lo hace el usuario; nunca por el chat) |
| La CLI se corta al final con `ECONNRESET` | Red | `lambda.mjs` ya lo tolera; si se cortó el script, `node motor/scripts/lambda.mjs <slug> --reanudar` |
| `el render … ha fallado (entradas privadas conservadas…)` | Error en algún trozo | Lee los errores que imprime, arregla y relanza (las entradas caducan solas a los 3 días) |
| Un trozo supera los 240 s | Trozos grandes con mucho 3D o recorte | Baja `--frames-por-lambda` o usa `--concurrencia max` |
| El render tarda minutos con muchas funciones | Cuota de concurrencia baja en la cuenta | El dry-run avisa por encima de 100; pide al usuario subir la cuota o usa menos funciones |
| `PutBucketPublicAccessBlock` denegado | Política IAM v1 | Aplicar la v2 (`aws/politica-usuario-combinada.json`); lo hace el usuario |
| `--solo-cors` no lee las entradas | El bucket privado no tiene CORS | Usa el modo por defecto (`--disable-web-security`) |
| Algo privado acabó en `remotionlambda-*` | Subida al bucket equivocado | Avisa al usuario, bórralo con su OK y revisa el flujo: las entradas van **siempre** al privado |

## 6. Audio y voz

| Síntoma | Causa | Solución |
|---|---|---|
| El MP4 de Lambda suena alto (−12,9 / −15,1 LUFS) con picos de +0,3 dBTP | El motor no limita el bus de mezcla (voz + música + efectos) | Normaliza en local con `loudnorm` en dos pasadas copiando el vídeo ([`FLUJOS.md`](FLUJOS.md) §6.1) |
| `loudnorm` sale en modo `dynamic` | El LRA medido supera el objetivo | Sube `LRA` por encima del `input_lra` medido y repite la 2.ª pasada |
| La música base tapa la voz o no se oye | Volumen fijo sin medir | Pon `lufs` en `proyecto.json › audio.musica.base` y deja que `linea` calcule el volumen (≈ −28 LUFS bajo voz real, −24 bajo TTS) |
| `ElevenLabs respondió 401` | Clave no válida o sin permiso de text-to-speech | Revisar `ELEVENLABS_API_KEY` (el usuario) |
| `… 402` o `quota_exceeded` | Sin saldo o cuota de caracteres agotada | Avisar al usuario; `voz --simular` para saber cuánto falta |
| `… 403` | Sin permiso para esa voz, modelo o formato (`mp3_44100_192` exige plan Creator o superior) | Otra voz o modelo, o subir de plan |
| `… 404` | Voz o modelo inexistentes para la cuenta | Revisa `voz.id` / `ELEVENLABS_VOICE_ID` y el modelo (`eleven_v4`) |
| `… 422` | Petición no válida | Revisa `ajustes`, modelo y texto del bloque |
| `… 429` | Límite de peticiones o de concurrencia | `--concurrencia 2` y relanzar |
| `voz` se paró a mitad | Se para al primer error, sin reintentar | Lo generado queda en caché: al relanzar no se vuelve a pagar |
| Con `eleven_v3` la entonación salta entre bloques | Ese modelo no admite `previous_text`/`next_text` | Usa `eleven_v4` (el de por defecto) |
| `scripts/tts.mjs` pide `ELEVENLABS_BASE_URL` | Ese script va contra un endpoint local compatible | Rellena la URL o usa `tools/kaleidos voz` (va a `api.elevenlabs.io` si está vacía) |
| El audio local tarda más de una hora | Los modelos paginan a disco | `memory_pressure \| tail -1`: con < 35–45 % libre, pide cerrar apps pesadas; nunca los tres modelos a la vez |
| No suenan los efectos sintetizados del motor | Hay `timeline.audio.sfx` | Es lo previsto: con efectos del estilo se apagan los sintetizados |

## 7. Generativa (`scripts/`)

| Síntoma | Causa | Solución |
|---|---|---|
| gpt-image-2 rechaza 1920×1080 | Exige lados divisibles por 16 | `images.mjs` ya pide 2048×1152 / 1152×2048 (y reintenta con el documentado más cercano) |
| Las láminas traen texto, logotipos o caras reconocibles | Prompt sin restricciones | Usa el `style` de `proyectos/dora-milikito/images.json` como base (sin texto, sin personas reales, hueco para bocadillos) y revisa la hoja |
| Apify cobra mucho para pocas fotos útiles | Se paga por imagen **devuelta** | `stock.mjs --dry-run`, `--max` bajo, consultas con `sites` y `--budget`; revisa la licencia de cada foto (queda en el manifest) |
| Una web responde 403 a la descarga directa (p. ej. openai.com con WebFetch) | Bloqueo de bots | Léela con el navegador integrado; captúrala con `scripts/capture.mjs` |
| Aparece un banner de cookies | — | `capture.mjs` los quita del DOM; nunca se aceptan |

## 8. HyperFrames

| Síntoma | Causa | Solución |
|---|---|---|
| El render local tarda el doble de lo esperado | `auto` elige 1 proceso (y la captura lenta si hay WebGL) | `npx hyperframes render -w 4` |
| La compilación tarda ~8 s | Descarga GSAP del CDN | Normal; no afecta al resultado |
| «Renderiza en Lambda» | El stack `hyperframes-kaleidos` no está desplegado | Avisa y ofrece render local o despliegue ([`AWS.md`](AWS.md) §8) |
| Colores o fuentes que no son del estilo | Composición libre | `node estilos/_esquema/adherencia.mjs <estilo> index.html compositions` |

## 9. Contenido y privacidad

| Situación | Qué hacer |
|---|---|
| El material se contradice (dos cifras distintas para lo mismo) | Elige la que dice la voz en ese momento y **señálalo en `informe.md`**; no lo ocultes |
| Una palabra de los subtítulos parece mal a oído | No la corrijas sin escucharla: anótala en el informe como pendiente |
| Contenido legal, regulatorio o clínico | Anota en el informe que un experto debe validar los textos de los paneles |
| La transcripción tiene nombres de personas o charla fuera de guion | No los cites en guion, rótulos, gráficos ni informes; corta esos tramos. `work/` está fuera de git |
| Aparecen datos personales en pantalla | Se difuminan |
| El rótulo de apertura pide el nombre del ponente | Rótulo genérico («Docente del curso»), salvo que el usuario dé el nombre para el vídeo |
