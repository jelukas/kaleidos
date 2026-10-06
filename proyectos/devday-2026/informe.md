
## Render en Lambda (2026-09-30 19:31 UTC)

| Concepto | Valor |
|---|---|
| Función · región | `remotion-render-4-0-529-mem3008mb-disk10240mb-900sec` · eu-west-1 |
| Site | `motor-d7c0195e16b9` |
| Fotogramas | 6040 (4 min 2 s), 195 funciones de 31, narración, 3D 14.2 % |
| Subida de entradas | 13.8 MB en 4.5 s |
| Site | 9.7 s |
| Render (reloj) | 34.4 s (Remotion: 28.0 s; estimado 51.4 s) |
| Facturación Lambda estimada por Remotion | 41 min 28 s |
| Descarga | 102.9 MB en 12.5 s → `resultados/devday-2026.mp4` |
| Reintentos de trozos | 0 |
| **Coste Lambda (getRenderProgress)** | **0.098 $** (Estimated cost for function invocations only. Does not include cost for storage and data transfer.) |
| S3 (almacenamiento y peticiones) | ≈ 0.0216 $ |
| Transferencia de salida | 0.10 GB: 0 $ dentro de los 100 GB/mes gratuitos (si no, 0.009 $) |
| **Total** | **≈ 0.120 $** (estimado antes de lanzar: 0.198 $) |
| Limpieza | entradas privadas borradas; renders/<id>/ borrado |

### Posproceso local de audio (2026-09-30)
Salida de Lambda a −12,9 LUFS con pico real de +0,3 dBTP (voz a −16 más música y efectos). Normalizado en local a −16 LUFS /
−1,5 dBTP (loudnorm en dos pasadas, lineal; vídeo copiado, 6 040 fotogramas). Pendiente en el motor: limitar el bus de mezcla.

### Tiempo total del encargo
Inicio 21:15:55 → vídeo final 21:32:39 = **16 min 44 s** (investigación con fuentes oficiales, guion, voz ElevenLabs 3 528 caracteres,
6 láminas gpt-image-2, 3 capturas, transcripción, timeline, stills, render en Lambda con 195 funciones y normalización).
