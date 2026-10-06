# AWS: recursos, permisos, costes y limpieza

Todo el render final se hace en AWS Lambda, región **`eu-west-1`**. Este documento dice qué hay desplegado, con qué
permisos, cuánto cuesta y cómo se limpia. El inventario vivo es [`aws/recursos.json`](../aws/recursos.json) (y, para los
sites del motor, `motor/out/lambda/sitios.json`); si este documento y esos archivos no coinciden, mandan los archivos.

## 1. Reglas (no se saltan)

1. **Nada en AWS sin confirmación explícita del usuario en el chat**: desplegar, subir, renderizar, borrar, cambiar
   permisos. Antes, la lista de recursos que se usan o se crean y el **coste y el tiempo estimados**. Las lecturas
   (listar sites, consultar un render, validar políticas) también se anuncian antes de hacerlas.
2. Siempre primero el plan en seco: `node motor/scripts/lambda.mjs <slug> --dry-run` (no llama a AWS ni lee `.env`).
3. Si un comando falla, se explica el error y se propone la solución **antes** de reintentar.
4. Al terminar un render se dan siempre el **tiempo y el coste reales** (quedan en `proyectos/<slug>/informe.md`) y qué
   queda en AWS.
5. El bucket `remotionlambda-*` es de **lectura pública**: ahí solo el site y la salida, que se descarga y se borra. Las
   entradas (vídeos, audio, `timeline.json`, láminas) van **siempre** al bucket privado con URLs prefirmadas.
6. Las credenciales viven en `.env` y nunca se muestran, copian al chat ni ponen en URLs (ver §9).

## 2. Qué hay desplegado

| Recurso | Nombre | Notas |
|---|---|---|
| Región | `eu-west-1` | Todo en la misma región (la transferencia interna es gratis) |
| Bucket de Remotion | `remotionlambda-euwest1-s50lbcdf7r` | **Lectura pública** (política de Remotion). Sites y salidas |
| Rol de las funciones | `remotion-lambda-role` | Política en `aws/politica-remotion-lambda-role.json` |
| Función por defecto | `remotion-render-4-0-529-mem3008mb-disk10240mb-900sec` | arm64, 3008 MB, 10 GB de disco efímero, 900 s |
| Función del benchmark | `remotion-render-4-0-529-mem3008mb-disk2048mb-120sec` | 120 s se quedan cortos para vídeos largos; no usar en proyectos |
| Sites | `motor-d7c0195e16b9` (el actual; los antiguos se borraron el 2026-10-01) | Código del motor + estilos + fuentes. Los `motor-<hash>` se registran en `motor/out/lambda/sitios.json` |
| Bucket privado | `kaleidos-privado-euwest1-d415b1af` | SSE-S3, caducidad de 3 días, sin CORS; verificado: 403 sin firma, 200 con URL firmada |
| Stack de HyperFrames | `hyperframes-kaleidos` | **No desplegado** (§8) |

Las funciones Lambda no cuestan nada en reposo; los buckets, solo por GB almacenado (las entradas privadas caducan
solas).

## 3. Identidades y políticas IAM

Usuario IAM de trabajo: `kaleidos-render-pruebas` (sus claves están en `.env`). Políticas en `aws/`:

| Archivo | Qué es |
|---|---|
| `politica-usuario-combinada.v1.json` | Versión original (histórico): permisos de Remotion (cuotas, `iam:PassRole` del rol, `remotionlambda-*`, funciones `remotion-render-*`, logs, capas de binarios) + los de HyperFrames/SAM |
| `politica-usuario-combinada.json` | **v3, la aplicada** (desde el 2026-09-30, en la política administrada `kaleidos-render-pruebas`). Sobre la v1 añade `KaleidosBucketsPrivados` (`s3:PutBucketPublicAccessBlock`, `GetBucketPublicAccessBlock`, `PutBucketCORS`, `GetBucketCORS`, `GetObjectAcl` en `kaleidos-*`, `hyperframes-kaleidos-*` y `aws-sam-cli-managed-default-*`), quita la acción inexistente `s3:PutPublicAccessBlock` y saca `iam:PassRole` de HyperFrames a `HyperFramesPassRole` (solo `role/hyperframes-kaleidos-*`, solo para Lambda y Step Functions) |
| `politica-usuario-combinada.v2.json` | v2 (histórico): la v1 + `KaleidosBucketsPrivados` sin el bucket de SAM |
| `politica-remotion-user.json` | Solo la parte de Remotion (referencia de la documentación oficial) |
| `politica-hyperframes-user.json` | Solo la parte de HyperFrames: CloudFormation, Lambda, Step Functions, S3, IAM, logs y CloudWatch para el despliegue con SAM |
| `politica-remotion-lambda-role.json` | Política del rol que asumen las funciones: `remotionlambda-*`, invocar `remotion-render-*` y logs |

El rol de las funciones **no** tiene acceso al bucket privado: no le hace falta, porque lee las entradas con URLs
prefirmadas.

## 4. Los dos buckets

| | `remotionlambda-*` (público) | `kaleidos-privado-*` (privado) |
|---|---|---|
| Quién lo crea | Remotion | `node motor/scripts/lambda.mjs crear-bucket-privado` (hecho el 2026-09-30) |
| Acceso | `s3:GetObject` para cualquiera con la URL exacta | Bloqueo de acceso público; solo URLs prefirmadas (3 h por defecto, `--caducidad-url`) |
| Qué va | `sites/<site>/` (código, estilos, fuentes) y `renders/<id>/` (salida) | `timeline.json`, `audio.m4a` o `narracion.m4a`, `plancha.mp4`, `mascara.mp4`, `mezzanine.mp4` (sin recorte), extras |
| Limpieza | `lambda.mjs` borra `renders/<id>/` tras descargar (salvo `lambda.conservarSalida: true`) | `lambda.mjs` borra las entradas al terminar; además caducan a los 3 días |
| Cifrado | El de Remotion | SSE-S3 (AES256) |

El bloqueo de acceso público del bucket privado es el que S3 pone por defecto a los buckets nuevos; con la v3 ya se lee:
`GetPublicAccessBlock` confirma los cuatro bloqueos activos (2026-09-30).

Si un día hubiera que crear otro bucket privado: `node motor/scripts/lambda.mjs crear-bucket-privado --dry-run`
enseña los pasos (crear, bloqueo, cifrado, caducidad, CORS de solo lectura, sonda sin firma que debe dar 403) y el
coste (0 $ en reposo). El modo real necesita la v3 (aplicada) y el OK del usuario.

## 5. Qué hace un render (`motor/scripts/lambda.mjs`)

1. Lee `aws/recursos.json`; valida `timeline.json` y el estilo con el esquema zod del motor.
2. Sube las entradas al bucket privado con SSE-S3 (SDK de AWS; si no está, la AWS CLI). Con recorte sube solo el audio
   del mezzanine (extraído sin recodificar); en narración, `narracion.m4a`; y todos los extras que cita la timeline.
3. Firma URLs de corta duración y las pasa como props (pequeñas; el texto solo viaja en `timeline.json`).
4. Despliega el site `motor-<hash>` **solo** si cambió el hash de `motor/src/` + `motor/public/`.
5. `renderMediaOnLambda`: h264, `crf` de `proyecto.json › lambda` (20), `privacy: private`, `framesPerLambda`,
   `--disable-web-security` (o `--solo-cors`), timeout de 240 s por trozo, 2 reintentos.
6. Sondea el progreso tolerando `ECONNRESET`/`ETIMEDOUT`; guarda el estado en `motor/out/lambda/<slug>.json`
   (`--reanudar` lo retoma).
7. Descarga directa de S3 a `resultados/<slug>.mp4`, borra `renders/<id>/` y las entradas privadas.
8. Añade a `informe.md` tiempos (subida, site, render, descarga), coste real de Lambda (`getRenderProgress().costs`),
   S3 y transferencia.

Opciones: `--estilo`, `--timeline <archivo>`, `--comp Horizontal|Vertical`, `--frames-por-lambda N`,
`--concurrencia max|N`, `--crf N`, `--solo-cors`, `--caducidad-url 3h`, `--reanudar`.

## 6. Coste: estimación y control

**Modelo** (`motor/scripts/lib/coste.mjs`): `s_lambda = F × s_local_swangle(modo)`, con F calibrado con el render real
de DORA v1 (el modelo lo reproduce: 0,29 $ y 86 s frente a 0,29 $ y 82 s). Cada fotograma se clasifica por modo (sin o
con recorte, escenario, show, lámina, 3D, narración `voz`/`completa`); se suman el fijo de cada función (arranque 6 s +
primer fotograma 2 s + descarga de la locución en narración), disco efímero, invocaciones, S3 y transferencia. Tarifas:
Lambda arm64 0,0000133334 $/GB-s; S3 0,023 $/GB-mes; salida 0,09 $/GB (los primeros 100 GB/mes, gratis). Medidas
locales: `node motor/scripts/medir.mjs --repeticiones 3` (con la máquina tranquila) → `motor/out/calibracion.json`.

**Renders reales**

| Vídeo | Fotogramas | Funciones | Render | Lambda | S3 | Total | Estimado antes |
|---|---|---|---|---|---|---|---|
| DORA v1 (ponente sin recorte) | 19 599 (13:04) | 196 × 100 f | 82 s | — | — | **0,29 $** | — |
| `dora-milikito` (recorte, escenario) | 15 426 (10:17) | 155 × 100 f | 2 min 4 s | 0,411 $ | 0,019 $ | **≈ 0,43 $** | 0,437 $ |
| `devday-2026` (narración) | 6 040 (4:02) | 195 × 31 f | 34,4 s | 0,098 $ | 0,022 $ | **≈ 0,12 $** | 0,198 $ |

**Estimaciones** (mismo modelo): clase de 13 min sin recorte ≈ 0,28 $; con recorte ≈ 0,56 $; clase de 30 min con
recorte ≈ 1,19 $; de 60 min ≈ 2,31 $. El recorte duplica el coste por fotograma (dos vídeos más que decodificar y
mezclar). Tras cada render real conviene comparar el coste con la estimación y, si se desvía, recalibrar F.

**Otros servicios de pago** (no son AWS, pero se avisa igual antes de gastar): ElevenLabs por carácter
(`tools/kaleidos voz <slug> --simular` los cuenta; `--max-caracteres` pone tope); gpt-image-2 por imagen (≈ 0,06–0,10 $
en calidad `medium`, estimado); Apify ≈ 1,90 $ por 1 000 imágenes **devueltas** (`scripts/stock.mjs --dry-run` y
`--budget`).

**Alerta de presupuesto**: se configura en la consola de AWS (lo hace el usuario; estaba en la fase 4 del benchmark).
Confírmala con él si el volumen de renders sube.

## 7. Concurrencia

- Un render se reparte en trozos de `framesPerLambda` fotogramas (100 por defecto): funciones = ⌈fotogramas / 100⌉.
- Remotion 4.0.529 admite **como máximo 200 funciones por render** y un mínimo de 5 fotogramas por función. Si no
  caben, `lambda.mjs` sube `framesPerLambda`.
- `--concurrencia max` (o `proyecto.json › lambda.concurrencia: "max"`) usa las 200; `--concurrencia 120` fija el
  número de funciones. Con trozos pequeños pesa el coste fijo de cada función: para 5 250 f de narración,
  `max` (195 × 27 f) da ≈ 45 s y ≈ 0,16 $; 100 f por función (53 funciones), ≈ 75 s y ≈ 0,10 $. En la práctica
  `devday-2026` con `max` costó 0,098 $ de Lambda en 34 s.
- Cuota de la cuenta: ejecuciones simultáneas de Lambda en la región (1 000 por defecto). El dry-run avisa si un render
  pide más de 100 a la vez. Con una cuota baja (p. ej. 50) un render de 13 min tardaría ≈ 4–5 min.
- El timeout de 900 s de la función deja margen para trozos grandes; el de cada trozo es de 240 s.

## 8. HyperFrames en Lambda (desplegado)

Desplegado el 2026-09-30 en 4 min 53 s (`aws/recursos.json › hyperframes`), con la política **v3** (v2 +
`s3:PutBucketPublicAccessBlock` sobre `aws-sam-cli-managed-default-*`, sin la acción inexistente `s3:PutPublicAccessBlock`
y con `iam:PassRole` acotado a `role/hyperframes-kaleidos-*` para Lambda y Step Functions; v2 en
`aws/politica-usuario-combinada.v2.json`).

| Recurso | Nombre |
|---|---|
| Pila CloudFormation | `hyperframes-kaleidos` (+ `aws-sam-cli-managed-default`, bucket de artefactos de SAM) |
| Lambda | `hyperframes-render` · 10 240 MB · x86_64 · concurrencia reservada 50 |
| Step Functions | `hyperframes-render` (Plan → RenderChunks en paralelo → Assemble) |
| Bucket de renders | `hyperframes-kaleidos-renderbucket-qjv9f1enbbu5` · privado (4 bloqueos, 403 sin firma) · intermedios a 7 días · `Retain` |
| Otros | rol IAM, grupo de logs, 3 alarmas de CloudWatch (≈ 0,30 $/mes: es casi todo el coste fijo) |

Pruebas reales (`benchmark/hyperframes-test`, 30 s, 1080p, 30 fps, 900 fotogramas, 10 trozos de 90):

| Proyecto subido | Reloj | Ejecución | Coste |
|---|---|---|---|
| con `node_modules` (286,5 MiB) | 6 min (5 min 16 s de subida) | 41,7 s (plan en frío 19,6 s) | 0,026 $ |
| copia limpia (2 MB) | **23 s** | — | **0,020 $** |

Reglas: renderizar desde una copia **sin `node_modules`** (el CLI empaqueta toda la carpeta) y con la **misma versión**
que el handler (0.8.86; si cambia, `PLAN_HASH_MISMATCH`: redesplegar). Comando en `docs/MONTAR_VIDEO.md` §4.3. Estado
local del CLI: `benchmark/hyperframes-test/.hyperframes/lambda-stack-hyperframes-kaleidos.json` (desde otra carpeta usa
`describe-stacks`). Para desmontarlo (**solo con OK**): `npx hyperframes lambda destroy --stack-name=hyperframes-kaleidos`
y vaciar y borrar a mano el bucket de renders (`Retain`).

## 9. Credenciales

- `.env` en la raíz (plantilla: [`.env.example`](../.env.example)); está en `.gitignore`. Hay una copia previa
  `.env.backup-2026-09-29`, también fuera de git.
- Remotion lee `REMOTION_AWS_ACCESS_KEY_ID` / `REMOTION_AWS_SECRET_ACCESS_KEY` / `REMOTION_AWS_REGION`; el SDK, SAM,
  HyperFrames y la AWS CLI, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` (las mismas claves).
- `lambda.mjs` carga `.env` con un cargador propio que nunca imprime valores (el dry-run ni lo lee).
- Para comandos sueltos (CLI de Remotion o AWS), cárgalas en un subshell, sin mostrarlas:
  `( set -a; . ./.env; set +a; <comando> )`.
- Nunca: `cat .env`, `echo $AWS_SECRET_ACCESS_KEY`, claves en URLs o en el chat.

## 10. Limpieza

Automática en cada render: salida de `renders/<id>/` y entradas privadas (Remotion). HyperFrames deja la salida y el
tarball del proyecto en su bucket privado: descárgala y bórralos (los intermedios caducan solos a los 7 días).

Limpieza del 2026-10-01 (con OK del usuario; detalle en `aws/recursos.json › limpiezas`): renders antiguos del bucket
público de Remotion (DORA v1, 266 MB de lectura pública, y los del benchmark), sites `intro-curso`, `videocurso-dora`
y `motor-eac57f0d2ebb`, y los renders y tarballs de prueba de HyperFrames. **Queda:** el site `motor-d7c0195e16b9`
(el actual), el bucket privado vacío y el bucket de HyperFrames vacío. `aws/recursos.json › pendienteDeBorrar` está vacío.

Se acumulan con el uso (borrar **solo con OK**): un site `motor-<hash>` por cada versión del motor que se sube, y en
HyperFrames `renders/<id>/` y `sites/<id>/` de cada render.

Comandos de referencia (**no ejecutar sin OK**; lanzar desde `motor/`, donde está `@remotion/lambda` 4.0.529):

```bash
( set -a; . ../.env; set +a
  npx remotion lambda sites ls --region=eu-west-1
  npx remotion lambda sites rm <site> --region=eu-west-1
  aws s3 rm s3://remotionlambda-euwest1-s50lbcdf7r/renders/<id>/ --recursive --region eu-west-1
  aws s3 rm s3://hyperframes-kaleidos-renderbucket-qjv9f1enbbu5/renders/<id>/ --recursive --region eu-west-1
  aws s3 rm s3://hyperframes-kaleidos-renderbucket-qjv9f1enbbu5/sites/<id>/ --recursive --region eu-west-1
  npx remotion lambda functions rm remotion-render-4-0-529-mem3008mb-disk2048mb-120sec --region=eu-west-1 )
```

Tras borrar algo, actualiza `aws/recursos.json`.

## 11. Pendiente

- **Limitar el bus de mezcla en el motor**: hoy la salida de Lambda llega a −12,9/−15,1 LUFS con +0,3 dBTP y se
  normaliza en local ([`FLUJOS.md`](FLUJOS.md) §6.1).
- Recalibrar F con los renders reales de `dora-milikito` y `devday-2026` (la estimación de narración fue alta:
  0,198 $ frente a 0,12 $).
- Registrar en `aws/recursos.json` cada site `motor-<hash>` nuevo que suba `lambda.mjs` (se guardan en
  `motor/out/lambda/sitios.json`) y borrar el anterior con OK.
- Fase 6 del benchmark (comparativa Remotion frente a HyperFrames, ya con datos reales de los dos en Lambda).
