# Videocurso «DORA en la práctica» (Remotion 4.0.529)

Montaje de un videocurso a partir de la grabación en bruto `../../brutos/prueba1.mp4`
(4K, 25 fps, 34 min). Todas las dependencias `remotion` y `@remotion/*` están fijadas a **4.0.529**
(la versión de la función Lambda desplegada); el 3D usa `three` 0.178.0 y `@react-three/fiber` 9.2.0.

## Flujo

| Paso | Script | Resultado |
| ---- | ------ | --------- |
| 1. Máster de audio | `scripts/audio-master.sh` | `work/audio/voz_master.wav` (-16 LUFS / -1,5 dBTP) |
| 2. Mezzanine corregido | `scripts/mezzanine.sh` | `media/mezzanine.mp4` (1080p25 H.264, BT.709) |
| 3. Whisper local | `scripts/instalar-whisper.mjs`, `scripts/transcribir.mjs` | `work/transcripcion/` (no sale del equipo) |
| 4. Seguimiento de la ponente | `scripts/seguimiento.py` | `src/datos/seguimiento.json` (solo posiciones x) |
| 5. Cortes | `scripts/tomas.json` (a mano) + `scripts/cortes.mjs` | `src/datos/cortes.json` |
| 6. Props | `scripts/generar-props.mjs` | `work/props-local.json`, `work/props-lambda.json` |
| 7. Capítulos | `scripts/capitulos.mjs` | `capitulos.txt` (formato YouTube) |
| 8. Sonido | `scripts/generar-sonido.sh` | `public/audio/*.wav` (sintetizado, sin licencias) |
| 9. Render local | `scripts/render-prueba.sh <nombre> <ini> <fin> [angle\|swangle]` | `out/*.mp4` |

## Estructura del código

- `src/Videocurso.tsx`: composición principal (1920×1080, 25 fps).
- `src/datos/montaje.ts`: capítulos, gráficos sincronizados con el discurso y zooms de énfasis.
- `src/lib/linea-tiempo.ts`: traduce tiempos de la fuente a fotogramas de salida (jump cuts).
- `src/lib/encuadre.ts`: disposición de la ponente (completa, esquina, dividida) y reencuadre automático.
- `src/componentes/`: ponente, subtítulos, rótulos, barra de progreso, intro/tarjetas/outro, sonido.
- `src/graficos/`: motion graphics 2D (listas, pasos, comparativas, opciones, cifras, línea de tiempo, mapa, citas, iconos).
- `src/tres/`: escenas 3D con las luces y sombras de `remotion-test/src/escenas/Objeto3D.tsx`.

## Fuente de vídeo

`videoSrc` llega por `inputProps`:

- Local: `"mezzanine.mp4"`, servido con `--public-dir=media-public` (copia de `public/` + enlace al
  mezzanine). **No** es la carpeta del site.
- Lambda: URL prefirmada de S3 (ver `PLAN-LAMBDA.md`). El site se empaqueta con `public/`
  (fuentes, sonido), sin el mezzanine ni la transcripción.

Los subtítulos también viajan en las props (solo las palabras que quedan en el montaje).

## Comandos locales

```console
npm run lint                               # eslint + tsc
npm run dev                                # Studio con --public-dir=media-public
./scripts/render-prueba.sh intro 0 199     # extracto local
```

No hay que ejecutar nada de AWS sin confirmación: el plan está en `PLAN-LAMBDA.md`.
