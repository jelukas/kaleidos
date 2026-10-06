# kaleidos

**Para montar un vídeo, usa la skill `montar-video` (o sigue `docs/MONTAR_VIDEO.md`).** Para instalarlo en un Mac
nuevo («instala kaleidos»), la skill `instalar-kaleidos` (o `INSTALAR.md`).

Fábrica de vídeos: entra un **bruto** (grabación), un **texto** o una **idea** y sale un vídeo con un **estilo** del
catálogo, **renderizado siempre en AWS Lambda** (`eu-west-1`). Índice de toda la documentación: `docs/INDICE.md`.

| Camino | Motor | Skill | Comandos |
|---|---|---|---|
| Con ponente: clase, videocurso, masterclass, pieza corta con presentador | Remotion (`motor/` + `tools/`) | `edicion-ponente` | `docs/FLUJOS.md` §A |
| Narración con voz TTS, sin grabación: noticias, explainers | Remotion, modo narración (CONTRATO §8) | `montar-video` | `docs/FLUJOS.md` §B |
| Generativo: promos, shorts, ambiente WebGL | HyperFrames | `/hyperframes` (global) | `docs/FLUJOS.md` §C |

## Estructura

```
brutos/            material en bruto (nunca se modifica; fuera de git)
proyectos/<slug>/  un vídeo = datos (proyecto.json, BRIEF.md, guion.json, [locucion.json], timeline.json, informe.md)
                   + media/ (enlaces para el motor) + work/ (intermedios) + assets/ (láminas, capturas)
estilos/<nombre>/  estilo.md (formato frame.md) + tokens.json + fonts/ (OFL/Apache) + referencias/ [+ audio/]
motor/             motor Remotion 4.0.529 (un solo código para todos los vídeos) + scripts de stills y Lambda
tools/             pipeline de preproceso (uv, Python 3.12): CLI tools/kaleidos
scripts/           generativa: tts, audio, images, stock, capture, build-news; doctor.mjs (diagnóstico)
plantillas/        plantillas de arranque por tipo de vídeo
aws/               políticas IAM y recursos.json (inventario de lo desplegado)
docs/              documentación (INDICE, MONTAR_VIDEO, FLUJOS, ARQUITECTURA, CONTRATO, AWS, ESTILOS…)
resultados/        vídeos finales <slug>.mp4 (fuera de git)
benchmark/ · vendor/   comparativa Remotion vs HyperFrames · clon de HyperFrames para Lambda (fuera de git)
skills-globales/   skills que instalar.sh copia a ~/.claude/skills (video-corto)
```

Antes de tocar un proyecto, lee su `BRIEF.md`. Los formatos de datos están en `docs/CONTRATO.md`: respétalos.
`timeline.json` lo genera `tools/kaleidos linea`; nunca se edita a mano.

## Ciclo de un vídeo con el motor (resumen; detalle en `docs/FLUJOS.md`)

1. **Brief**: método, estilo (si no lo dice, propón 2–3 con `estilos-video`), recorte sí/no, público, duración.
   Confirma y escribe `BRIEF.md`.
2. **Proyecto y preproceso**
   - Con ponente: `tools/kaleidos nuevo <slug> --bruto brutos/<x> --estilo <e> --metodo clase-larga|corto-ilustrado`
     y `tools/kaleidos preparar <slug>` en segundo plano; comprueba el recuento de fotogramas de cada salida.
   - Narración: `tools/kaleidos nuevo <slug> --narracion --estilo <e> --escenario`; escribe `locucion.json`;
     `tools/kaleidos voz <slug> --simular` → `voz <slug>` → `transcribir <slug>`.
3. **Lee la transcripción entera** y escribe `guion.json` (cortes de tomas falsas, capítulos, eventos por frase clave,
   `fixes`). Densidad de referencia en clases: un gráfico cada ~40 s. En narración: sin cortes, sin `gesto3d`,
   disposiciones `completa`/`voz`.
4. `tools/kaleidos media <slug> && tools/kaleidos linea <slug> && tools/kaleidos media <slug>` hasta que no quede
   ningún `ERROR:`; `tools/kaleidos capitulos <slug>`.
5. **Revisión local**: `node motor/scripts/stills.mjs <slug> --at eventos` → mira la hoja de contactos → corrige.
6. **Lambda**: `node motor/scripts/lambda.mjs <slug> --dry-run` (en narración, `--concurrencia max`) → enseña al usuario
   recursos, coste y tiempo estimados → **espera su OK** → `lambda.mjs <slug>` → `resultados/<slug>.mp4`.
7. **Audio y verificación**: normaliza la mezcla (loudnorm en dos pasadas a −16 LUFS / −1,5 dBTP, copiando el vídeo;
   `docs/FLUJOS.md` §6), `ffprobe` y recuento de fotogramas, y cierra `informe.md` con tiempo y coste reales.

## Vídeos generativos (HyperFrames)

Entra siempre por la skill `/hyperframes` (elige el flujo: `video-corto`, `product-launch-video`, `general-video`…).
Si el usuario indica un estilo, aplícalo con `estilos-video` (copiar `estilo.md` como `frame.md` del proyecto).
Proyectos en `proyectos/<slug>/`, no en `videos/`. Scripts de apoyo en `scripts/` (tabla en `docs/FLUJOS.md` §C.3).
Render en Lambda de HyperFrames: stack `hyperframes-kaleidos` (desplegado; `docs/AWS.md` §8). Renderiza desde una copia
**sin `node_modules`** y con `hyperframes@0.8.86` (comando en `docs/MONTAR_VIDEO.md` §4.3). Conocimiento heredado de `~/videos-opus` (solo lectura): promos de Ensaya,
informativo «SEÑAL», pizarra a mano, dibujos animados y el bucle WebGL de 240 s de Rainy Cabin (reglas en
`~/videos-opus/CLAUDE.md`).

## Estilos

`estilos/README.md` es el catálogo; guía de uso en `docs/ESTILOS.md`. «Con el estilo X» → aplícalo; sin estilo →
recomienda 2–3 con su referencia; «como X pero…» → variante; «a partir de esta web/vídeo» → estilo nuevo (skill
`estilos-video`). Tipografías **solo OFL/Apache**.

## Reglas

- **AWS**: nada sin confirmación explícita del usuario, con recursos y coste estimado por delante (también se anuncian
  las lecturas). Región `eu-west-1`. El bucket `remotionlambda-*` es de **lectura pública** (política de Remotion):
  ahí solo el site y la salida, que se descarga y se borra. Entradas (vídeos, audio, `timeline.json`, extras) siempre
  al **bucket privado** con URLs prefirmadas. Si algo falla, explica y propone antes de reintentar. Al acabar, da
  **tiempo y coste final**. Detalle: `docs/AWS.md`.
- **Credenciales** en `.env` (plantilla en `.env.example`): nunca las muestres, copies al chat ni pongas en URLs.
  Cárgalas en un subshell (`set -a; . ./.env; set +a`).
- **Privacidad** (política de la organización): ningún dato personal de clientes en respuestas, informes, gráficos o
  rótulos; no cites fragmentos de transcripción con datos personales; si aparecen en pantalla, se difuminan. Rótulos
  genéricos salvo que el usuario dé los nombres.
- **Contenido**: los gráficos resumen lo que dice la voz; no se inventan datos ni decisiones. Las incoherencias del
  material se señalan en el informe. Actualidad: solo fuentes oficiales, anotadas en `proyectos/<slug>/fuentes.md`.
- **Verificar con imágenes**: stills y hojas de contactos tras cada cambio; `ffprobe` y recuento de fotogramas de cada
  salida; nunca filtres los logs de ffmpeg con `grep` al lanzar procesos largos.
- **Audio**: la mezcla sale de Lambda por encima de −16 LUFS y con picos de +0,3 dBTP; se normaliza en local antes de
  entregar mientras el motor no limite el bus.
- **TTS**: ElevenLabs `eleven_v4`; música `eleven_music_v2_5`; efectos `eleven_text_to_sound_v2`. Audio local (skill
  `audio-local`) solo si el usuario lo pide.
- Remotion **4.0.529 exacto** en `motor/` (debe coincidir con las funciones Lambda desplegadas).
- Licencia: Remotion es gratis para equipos de hasta 3 personas; uso comercial en empresa → licencia de Remotion.
  HyperFrames es Apache-2.0.

## Entorno

Mac M1 Pro (16 GB, Metal), Node 22, ffmpeg 8 con VideoToolbox (sin `drawtext`), `uv`, AWS CLI, SAM CLI, bun.
Variables de `.env`: AWS/Remotion, ElevenLabs, OpenAI (imágenes), Apify. Diagnóstico: `node scripts/doctor.mjs`.
Instalación (una vez): `./instalar.sh` (guía para agentes: `INSTALAR.md`). No lances a la vez recorte, pose y transcripción (16 GB).

## Documentación

`docs/INDICE.md` (índice) · `docs/MONTAR_VIDEO.md` (conversación) · `docs/FLUJOS.md` (comandos, tiempos, costes) ·
`docs/ARQUITECTURA.md` · `docs/CONTRATO.md` (formatos) · `docs/METODO_EDICION_IA.md` (método) · `docs/AWS.md` ·
`docs/ESTILOS.md` · `docs/SOLUCION_PROBLEMAS.md` · `docs/GLOSARIO.md` · `motor/README.md` · `tools/PROGRESO.md`.
