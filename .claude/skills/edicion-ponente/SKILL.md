---
name: edicion-ponente
description: Convierte una grabación en bruto con ponente (clase, videocurso, charla, pieza corta con presentador) en un vídeo editado con Remotion en este repo — análisis, transcripción, corrección técnica, recorte del ponente, cámara virtual, guion editorial por frases clave, motion graphics 2D/3D con un estilo del catálogo — y lo renderiza en AWS Lambda. Úsala cuando el usuario diga «haz un videocurso/vídeo/clase de brutos/…», «edita este bruto», «monta esta grabación», «transforma el vídeo de la carpeta brutos», o deje un vídeo nuevo en brutos/ y pida trabajarlo. No la uses para vídeos generativos sin grabación (eso es /hyperframes).
---

# Edición de vídeos con ponente (Remotion + Lambda)

Si el vídeo es nuevo y aún no hay brief, entra por la skill `montar-video` (entrevista, `node scripts/doctor.mjs`, hora
de inicio) y vuelve aquí. Método completo y razones: `docs/METODO_EDICION_IA.md`. Formatos: `docs/CONTRATO.md`. Motor: `motor/README.md`.
Pipeline: `tools/` (CLI `tools/kaleidos <comando> <slug>`). Nada de AWS sin confirmación; privacidad ante todo.

## 0. Elegir el enfoque

| | `corto-ilustrado` (≲ 2–3 min) | `clase-larga` (> 3 min) |
|---|---|---|
| Montaje | escena a escena | guion JSON → `tools linea` → timeline |
| Tiempo | 1:1 con el original o con cortes | con cortes (EDL) |
| Gráficos | diseñados uno a uno, anclados al dibujo | paneles por tipo alimentados por datos |
| Extras | ilustraciones 2,5D (`tools profundidad`/`ampliar`) | 3D en las manos (`gesto3d`), cámara virtual |

Regla: por encima de ~2–3 min, no diseñes a mano: datos + componentes.

## 1. Brief (una ronda de preguntas, solo lo que falte)

- **Estilo**: si no lo dice, carga `estilos-video` y propón 2–3 del catálogo con sus referencias.
- Método, **recorte del ponente** (sí por defecto si el fondo es liso), idioma, público, duración objetivo,
  destino (YouTube/LMS/redes), vertical 9:16 además del horizontal (sí/no).
- Términos del dominio para el `prompt` de Whisper (siglas, nombres de normas, productos).
Escribe `proyectos/<slug>/BRIEF.md` con lo confirmado y lo inferido por separado.

## 2. Preparar (en segundo plano)

Primera vez en esta máquina (una sola vez): `tools/kaleidos instalar` (whisper.cpp con Metal + modelos) y
`cd motor && npm install && npm run estilos`. Referencia de tiempos en el M1 Pro con un bruto 4K de 34 min:
analizar 1 min 45 s · transcribir 3 min · master 5 min · recorte ~30 min con la GPU libre · pose 7 min.
No lances recorte, pose y transcripción a la vez si no caben en 16 GB.

```bash
tools/kaleidos nuevo <slug> --bruto brutos/<archivo> --estilo <estilo> --metodo <metodo>   # [--sin-recorte]
tools/kaleidos preparar <slug>      # analizar → transcribir → master → recortar → pose (logs en work/logs/)
```

Mientras corre: revisa `work/analisis/resumen.md` y la hoja de contactos (tipo de plano, fondo, gestos, 4K para
reencuadres). **Comprueba el recuento de fotogramas** de cada salida (`mascara.mp4`, `plancha.mp4`, `mezzanine.mp4`);
si un proceso se corta, reanúdalo con `--desde`.

## 3. Guion editorial (`guion.json`)

Lee **entera** `work/transcripcion.txt`: estructura, tomas falsas (sobre todo al final), errores de reconocimiento.
Escribe `guion.json` según `docs/CONTRATO.md` §2:
- `fixes` para errores de reconocimiento; `cortes` para tomas falsas o charla fuera de guion (quédate con la toma limpia).
- `capitulos` con `cue` por frase; `intro` y `outro`.
- `eventos` anclados por frase clave: paneles (`lista`, `pasos`, `comparativa`, `opciones`, `cifra`, `cita`, `clave`,
  `linea`, `mapa`, `tarjeta`, `caso`, `checklist`), `pop`, `escena3d`, `gesto3d` (donde haya gestos buenos en
  `work/gestos.json`). Densidad de referencia: un gráfico cada ~40 s; los paneles duran lo que dura la explicación
  y sus elementos entran con su propia frase.
- **No inventes**: los gráficos resumen lo que dice la voz. Nada de nombres reales ni datos personales. En contenido
  legal o clínico, anota en `informe.md` que un experto debe validar los textos.

```bash
tools/kaleidos linea <slug>        # → timeline.json + avisos (cues no encontrados, solapes, planos cortos…)
tools/kaleidos media <slug>        # enlaces en proyectos/<slug>/media/ para el motor
tools/kaleidos capitulos <slug>    # capitulos.txt (formato YouTube)
```
Itera hasta que no haya avisos bloqueantes. Corrige los cues no encontrados (a menudo por los propios `fixes`).
Para poner los segundos de los cues a partir de las frases: `python3 plantillas/herramientas/cues.py` (lee
`work/transcripcion.json`; ver `plantillas/README.md`).

## 4. Revisión local con imágenes

```bash
cd motor && npm run estilos
node scripts/stills.mjs <slug> --at eventos         # un fotograma por evento (o --at 12.5,1:03,f250)
node scripts/render-local.mjs <slug> --frames a-b   # tramo de ~800 fotogramas para ver movimiento y medir velocidad
```
Mira las hojas de contactos: encuadres que tapan títulos, solapes, textos fuera de caja, contraste, 3D que no se
pinta, subtítulos. Revisa la adherencia al estilo (`estilos-video` › revisión). Corrige datos, no código, cuando se
pueda.

## 5. Render en Lambda (siempre)

```bash
node motor/scripts/lambda.mjs <slug> --dry-run
```
Enseña al usuario: recursos que se usan o crean, tamaño de las subidas privadas, coste y tiempo estimados.
**Espera su OK explícito.** Después:
```bash
node motor/scripts/lambda.mjs <slug>                    # o --concurrencia max (hasta 200 funciones): más rápido, algo más caro
```
Sube `timeline.json` y los medios al **bucket privado** (`aws/recursos.json › privado.bucket`), renderiza con la
función de `proyecto.json › lambda`, descarga a `resultados/<slug>.mp4`, borra la salida del bucket público (salvo
`conservarSalida`) y las entradas privadas, y escribe tiempo y coste reales en `informe.md`.
Si `privado.bucket` es `null`, propón crearlo (`node motor/scripts/lambda.mjs crear-bucket-privado --dry-run`) y pide
confirmación. Referencia real: DORA v1 (19 599 fotogramas, sin recorte) 0,29 $ y 82 s; estimación de DORA v2 con
recorte (19 113 fotogramas) ≈ 0,55 $ y ~1 min 40 s.

## 6. Verificación final e informe

`ffprobe` (duración, códecs, fps), sonoridad (ebur128, objetivo −16 LUFS), una hoja con un fotograma por minuto.
La mezcla de Lambda sale caliente (≈ −13/−15 LUFS con picos > 0 dBTP): normaliza en local con
`python3 plantillas/herramientas/normalizar_audio.py resultados/<slug>.mp4 --en-sitio` (dos pasadas, vídeo copiado, comprueba fotogramas).
Informe al usuario: duración final, capítulos y gráficos, qué se verificó (fotogramas muestreados, no visionado
completo), avisos, **tiempo y coste final** (Lambda + S3 + transferencia) y qué queda en AWS.

## Errores conocidos (del método)

| Error | Cómo evitarlo |
|---|---|
| El recorte se para a mitad sin error | validar el número de fotogramas; reanudar con `--desde` |
| Disco lleno por copias de Remotion | empaquetado fijo, `public/` mínimo, limpiar `remotion-v4-*-assets*` |
| 3D de drei que no se pinta | todo el 3D en JSX y determinista; sin `Outlines`/`Text` de drei |
| Una regla de planos pisa los forzados | los forzados son inmutables en `tools linea` |
| El objeto 3D sigue a las manos al bajar | congelar el anclaje en el pico del gesto |
| Solapes detectados tarde | comprobaciones automáticas de `tools linea` antes de cualquier render |
| La CLI de Lambda corta al final (ECONNRESET) | `lambda.mjs` recupera con `getRenderProgress` y descarga de S3 |
| Entradas expuestas | nunca subir al bucket `remotionlambda-*`; solo al privado |
