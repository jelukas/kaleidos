# Plan de render en AWS Lambda (sin ejecutar)

> **Nada de este documento se ha ejecutado.** Todos los comandos llaman a AWS y requieren tu
> confirmación explícita antes de lanzarse. Región: `eu-west-1`. Remotion **4.0.529** (proyecto y función).

## 1. Qué hay que renderizar

| Dato | Valor |
| ---- | ----- |
| Composición | `Videocurso`, 1920×1080, 25 fps |
| Duración | 19 599 fotogramas = **13 min 04 s** |
| Fotogramas con WebGL (3D) | 2 259 (**11,5 %**, 90 s): intro, 3 tarjetas de capítulo, 2 transiciones de losetas, 6 escenas de concepto y la primera mitad del cierre |
| Fuente de vídeo | `media/mezzanine.mp4`: 1 136 462 062 bytes (**1,14 GB**), H.264 High 1080p25 4,25 Mb/s, GOP 2 s, `faststart`, AAC 192 kb/s |
| Site (bundle con `public/`) | ~38 MB (JS, fuentes, sonido sintetizado). **Sin** mezzanine ni transcripción |
| Props | `work/props-lambda.json`, 106 KB: `videoSrc` + palabras de los subtítulos (solo lo que queda en el montaje). Caben en la invocación (límite en línea ~194 KB), así que no se suben como objeto aparte |

## 2. Medidas locales que sirven de base (una pestaña de Chrome, como cada Lambda)

M1 Pro, 100 fotogramas por prueba, incluido el arranque del navegador (`scripts/render-prueba.sh … 1`):

| Tramo | WebGL por GPU (`angle`) | WebGL por software (`swangle`, el de Lambda) |
| ----- | ----------------------- | -------------------------------------------- |
| 2D: ponente + gráficos + subtítulos | 0,061 s/fotograma | **0,199 s/fotograma** |
| 3D de concepto (cadena de proveedores) | 0,067 | 0,332 |
| Intro 3D (escudo + texto 3D) | 0,062 | 0,377 |
| Losetas 3D + tarjeta con número 3D | 0,059 | 0,270 |

- Con `swangle` todo el compositing de Chrome va por CPU, por eso incluso el 2D es 3,3× más lento que con GPU.
- **Sobrecoste del 3D en Lambda**: un segundo con 3D cuesta ~0,33 s/fotograma frente a 0,20 (≈ **×1,65**). Como solo es
  el 11,5 % del vídeo, encarece el render completo en torno a un **+6-7 %**.
- En Lambda (arm64, 3008 MB ≈ 1,8 vCPU) se supone un factor ×1,5 (rango ×1,2-×2,0) sobre `swangle` local:
  **2D ≈ 0,30 s/fotograma y 3D ≈ 0,50 s/fotograma**.

## 3. ¿Sirve la función ya desplegada?

`remotion-render-4-0-529-mem3008mb-disk2048mb-120sec` (arm64, 3008 MB, disco 2048 MB, timeout 120 s): **no**.

| Límite | Necesidad de este vídeo | Veredicto |
| ------ | ----------------------- | --------- |
| Timeout de la función principal (120 s) | La principal vive todo el render: lanzar ~196 renderizadores (5-15 s) + esperar al trozo más lento (≈ 40-75 s) + unir trozos (descarga de ~0,5 GB de trozos, concatenación, mezcla de audio y subida del final: 30-60 s) ≈ **2-2,5 min** en el mejor caso, y más si la cuota de concurrencia obliga a trozos grandes | ❌ se pasa |
| Timeout de cada renderizador (120 s) | Trozo de 100 fotogramas 2D ≈ 38 s; con 3D ≈ 58 s (hasta 75 s en el caso pesimista). Si la cuota de concurrencia obliga a 200 fotogramas por Lambda: 68-110 s, al límite | ⚠️ sin margen |
| Disco efímero (2048 MB) | La principal descarga todos los trozos de vídeo y audio (~0,5-0,7 GB) y escribe el MP4 final (~0,5-0,7 GB) antes de subirlo; más los temporales de Chrome | ⚠️ muy justo |
| Descarga de la fuente en cada Lambda | Con `@remotion/media` `<Video>` cada renderizador pide solo los rangos de bytes que necesita (índice `moov` de 1,15 MB + ~3 MB de su tramo): ~5 MB por Lambda, ~1 GB en total dentro de la región (gratis). Con `OffthreadVideo` cada Lambda bajaría el archivo entero (1,14 GB × 196 = 223 GB y no cabría en 2 GB de disco): por eso el componente usa `disallowFallbackToOffthreadVideo` | ✅ con `<Video>` |
| Memoria (3008 MB) | Chrome + WebGL por software + decodificación 1080p | ✅ |

### Función nueva propuesta

```bash
npx remotion lambda functions deploy --region=eu-west-1 --memory=3008 --disk=10240 --timeout=900
# → remotion-render-4-0-529-mem3008mb-disk10240mb-900sec (arm64)
```

- `--timeout=900` (máximo de Lambda): margen de sobra para la principal y para trozos grandes si la cuota es baja.
- `--disk=10240`: trozos + final + temporales sin riesgo. El disco extra casi no cuesta (ver §6).
- Memoria 3008 MB, igual que la actual (mismo precio por GB-s). Opción: 6144 MB duplica las vCPU y acortaría los
  trozos 3D, a igual o parecido coste total.

## 4. Mezzanine privado en S3 (no va en el site)

El site de Remotion es legible públicamente; el mezzanine se sube **aparte, como objeto privado** del bucket existente
y se entrega a Chrome con una **URL prefirmada de corta duración**. Mismo host que el site
(`remotionlambda-euwest1-….s3.eu-west-1.amazonaws.com`), así que no hace falta CORS.

## 5. Comandos exactos (en orden, desde `/Users/openwebinars/Dev/kaleidos/proyectos/dora-videocurso-v1`)

Todos en un subshell que carga las credenciales sin mostrarlas:

```bash
( set -a; . ../../.env; set +a
  REGION=eu-west-1
  FUNCION=remotion-render-4-0-529-mem3008mb-disk10240mb-900sec

  # 0. Comprobaciones (solo lectura)
  npx remotion lambda policies validate
  npx remotion lambda quotas --region=$REGION          # concurrencia disponible
  BUCKET=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, 'remotionlambda-euwest1-')].Name | [0]" --output text)
  echo "$BUCKET"

  # 1. Función nueva (ver §3)
  npx remotion lambda functions deploy --region=$REGION --memory=3008 --disk=10240 --timeout=900

  # 2. Site (bundle con public/: fuentes y sonido; sin mezzanine ni transcripción)
  npx remotion lambda sites create src/index.ts --site-name=videocurso-dora --region=$REGION

  # 3. Mezzanine privado (1,14 GB) y URL prefirmada de 3 h
  aws s3 cp media/mezzanine.mp4 "s3://$BUCKET/privado/videocurso/mezzanine.mp4" --region $REGION --no-progress
  URL=$(aws s3 presign "s3://$BUCKET/privado/videocurso/mezzanine.mp4" --expires-in 10800 --region $REGION)
  node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("work/props-lambda.json"));p.videoSrc=process.argv[1];fs.writeFileSync("work/props-lambda.firmado.json",JSON.stringify(p))' "$URL"

  # 4. Render: 100 fotogramas por Lambda → 196 renderizadores (máximo de Remotion: 200)
  npx remotion lambda render videocurso-dora Videocurso \
    /Users/openwebinars/Dev/kaleidos/resultados/dora-videocurso-v1.mp4 \
    --region=$REGION \
    --function-name=$FUNCION \
    --props=work/props-lambda.firmado.json \
    --frames-per-lambda=100 \
    --codec=h264 --crf=20 --audio-codec=aac --audio-bitrate=192k \
    --privacy=private \
    --timeout=120000 \
    --max-retries=2 \
    --log=info

  # 5. Limpieza (tras comprobar el resultado)
  aws s3 rm "s3://$BUCKET/privado/videocurso/mezzanine.mp4" --region $REGION
  rm -f work/props-lambda.firmado.json
)
```

Notas:

- La concurrencia la fija `--frames-per-lambda` (Remotion no admite `--concurrency` y `--frames-per-lambda` a la vez).
  Si `quotas` muestra menos de ~200 ejecuciones simultáneas libres, usar
  `--frames-per-lambda=$(( (19599 + N - 1) / N ))` con `N` = concurrencia disponible (p. ej. 50 → 392 fotogramas por
  Lambda; con timeout 900 s sigue cabiendo, el render tardaría ~4-5 min).
- `--timeout=120000` (ms, por `delayRender`): en el render local completo una extracción de fotograma se quedó
  bloqueada más de 30 s (valor por defecto) con 6 pestañas simultáneas; con reintentos (`--max-retries=2`) un trozo
  que falle se repite sin rehacer todo el render.
- `--privacy=private` es imprescindible: por defecto Remotion deja el MP4 de salida **público**.
- CRF 20 en H.264: calidad visualmente transparente para ponente + grafismo con archivo más ligero que el CRF 18 por defecto.
- La URL prefirmada caduca a las 3 h; si hay que reintentar más tarde, repetir el paso 3 (solo `presign` y props).
- `props-lambda.firmado.json` contiene la URL firmada: no se versiona (`work/` está en `.gitignore`) y se borra al final.

## 6. Recursos que se crearían

| Recurso | Nombre | Permanencia |
| ------- | ------ | ----------- |
| Función Lambda nueva | `remotion-render-4-0-529-mem3008mb-disk10240mb-900sec` | Hasta que se borre (`npx remotion lambda functions rm …`). Sin coste en reposo |
| Site | `sites/videocurso-dora/` en el bucket existente (~38 MB) | Hasta `npx remotion lambda sites rm videocurso-dora` |
| Objeto privado | `privado/videocurso/mezzanine.mp4` (1,14 GB) | Se borra en el paso 5 |
| Render | `renders/<id>/` con el MP4 privado (~0,5-0,7 GB) y metadatos | Borrar a mano cuando esté descargado |
| Logs | CloudWatch `/aws/lambda/remotion-render-…` (retención 14 días) | Automática |

El bucket `remotionlambda-euwest1-*`, el rol `remotion-lambda-role` y el usuario IAM ya existen; no se crean.

## 7. Estimación de coste (por render completo)

Precios `eu-west-1`: Lambda arm64 0,0000133334 $/GB-s; disco efímero por encima de 512 MB ≈ 0,000000031 $/GB-s;
invocaciones 0,20 $/millón; S3 Standard 0,023 $/GB-mes, PUT 0,005 $/1000, GET 0,0004 $/1000; salida a Internet 0,09 $/GB
(los primeros 100 GB/mes de salida son gratis en AWS).

| Concepto | Cálculo | Coste |
| -------- | ------- | ----- |
| Renderizadores | 17 340 f × 0,30 s + 2 259 f × 0,50 s + 196 trozos × 8 s de arranque = 7 900 s × 2,9375 GB = 23 200 GB-s | **0,31 $** |
| Función principal | ~150 s × 2,9375 GB = 440 GB-s | 0,006 $ |
| Disco efímero extra | 9,5 GB × ~8 050 s × 0,000000031 | 0,002 $ |
| Invocaciones | ~200 | < 0,001 $ |
| S3 almacenamiento | 1,14 GB (mezzanine, 1 día) + ~0,6 GB (render, 1 día) | < 0,002 $ |
| S3 peticiones | ~800 PUT (trozos, progreso) + ~5 000 GET con rango | ~0,006 $ |
| Transferencia S3 → Lambda | misma región | 0 $ |
| Descarga del MP4 final | ~0,6 GB (gratis dentro de los 100 GB/mes) | 0-0,05 $ |
| **Total** | Rango según el factor de velocidad real de Lambda (×1,2 a ×2,0) | **≈ 0,27-0,45 $** (central 0,33 $) |

Desglose del 3D: un segundo de vídeo cuesta ≈ 7,5 s de Lambda sin 3D (≈ 0,0003 $) y ≈ 12,5 s con 3D (≈ 0,0005 $).
Los 90 s con 3D añaden ≈ 450 s de Lambda (≈ **0,02 $, +6 %**) frente a un montaje sin 3D.

Subida del mezzanine: gratis (tráfico de entrada), pero son 1,14 GB desde tu conexión (≈ 3 min a 50 Mb/s).

## 8. Estimación de tiempo

| Fase | Tiempo |
| ---- | ------ |
| `functions deploy` | ~30 s |
| `sites create` (38 MB) | ~15-30 s |
| Subida del mezzanine | ~3 min a 50 Mb/s (depende de tu conexión) |
| Render con 196 Lambdas en paralelo | lanzamiento 5-15 s + trozo más lento 40-75 s + unión 30-60 s ≈ **1,5-2,5 min** |
| Descarga del resultado (~0,6 GB) | ~1-2 min |

Con una cuota de solo 50 ejecuciones simultáneas: render ≈ 4-5 min. Como referencia, el render local completo en
borrador (GPU, 6 pestañas) tardó lo indicado en `work/tiempos.log`.
