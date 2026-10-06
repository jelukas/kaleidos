# kaleidos · instrucciones para agentes (Codex y otros)

Este archivo es el equivalente de `CLAUDE.md` para agentes que no son Claude Code (Codex de ChatGPT, Cursor, Gemini
CLI…). Las reglas son las mismas y obligan igual.

**Para montar un vídeo, sigue `docs/MONTAR_VIDEO.md` (la conversación con el usuario) y `docs/FLUJOS.md` (los
comandos).** **Para instalarlo** («instala kaleidos»), sigue `INSTALAR.md`. Índice de toda la documentación:
`docs/INDICE.md`.

## Qué es

Fábrica de vídeos: entra un **bruto** (grabación), un **texto** o una **idea** y sale un vídeo con un **estilo** del
catálogo, **renderizado siempre en AWS Lambda** (`eu-west-1`).

| Camino | Motor | Procedimiento |
|---|---|---|
| Con ponente: clase, videocurso, masterclass, pieza corta con presentador | Remotion (`motor/` + `tools/`) | `docs/FLUJOS.md` §A |
| Narración con voz TTS, sin grabación: noticias, explainers | Remotion, modo narración (`docs/CONTRATO.md` §8) | `docs/FLUJOS.md` §B |
| Generativo: promos, shorts, ambiente WebGL | HyperFrames (`npx hyperframes`) | `docs/FLUJOS.md` §C y «HyperFrames sin Claude Code» abajo |

## Skills de Claude Code y su equivalente aquí

En Claude Code el trabajo entra por *skills* (instrucciones empaquetadas). Aquí no se invocan, pero **son Markdown y
se pueden leer como procedimientos**:

| Skill de Claude Code | Qué hacer en su lugar |
|---|---|
| `instalar-kaleidos` (proyecto) | Seguir `INSTALAR.md` (lanza `./instalar.sh`) |
| `montar-video` (proyecto) | Seguir `docs/MONTAR_VIDEO.md`; los procedimientos, en `.claude/skills/montar-video/SKILL.md` |
| `edicion-ponente` (proyecto) | `docs/FLUJOS.md` §A y `.claude/skills/edicion-ponente/SKILL.md` |
| `estilos-video` (proyecto) | `docs/ESTILOS.md` y `.claude/skills/estilos-video/SKILL.md` |
| `audio-local` (proyecto) | Solo si el usuario lo pide: `.claude/skills/audio-local/SKILL.md` y su script `audio-local.sh` |
| `hyperframes`, `hyperframes-*`, `media-use`, `product-launch-video`, `general-video` (globales) | Ver «HyperFrames sin Claude Code» |
| `video-corto` (global, propia) | Leer `skills-globales/video-corto/SKILL.md` (copia en el repo) como guía y usar los scripts de `scripts/` |

## HyperFrames sin Claude Code

Las skills globales de HyperFrames (`~/.claude/skills/hyperframes*`, instaladas para Claude Code) no se cargan en
Codex. Equivalentes, de menos a más integración:

1. **Seguir `docs/` y los scripts**: `docs/FLUJOS.md` §C (estilo como `frame.md`, medios con `scripts/*.mjs`,
   `npx hyperframes lint`, `check`, `preview`, `render`). La CLI `npx hyperframes` funciona igual con cualquier agente.
2. **Leer las skills como documentación**: el mismo contenido está en `vendor/hyperframes-repo/skills/<skill>/SKILL.md`
   (clon de HyperFrames) o en `~/.claude/skills/<skill>/SKILL.md`. Empieza por `hyperframes/SKILL.md` (el enrutador) y
   `hyperframes-core/SKILL.md` (contrato de la composición) antes de escribir HTML.
3. **Instalarlas para este agente** (solo si el usuario lo decide): HyperFrames publica sus skills para Codex y otros
   agentes (`npx skills add heygen-com/hyperframes`, o el paquete de plugin de Codex que se construye en el clon con
   `bun run package:codex-plugin`). Ver `vendor/hyperframes-repo/README.md` › «Skills».

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
docs/              documentación
resultados/        vídeos finales <slug>.mp4 (fuera de git)
```

Antes de tocar un proyecto, lee su `BRIEF.md`. Los formatos de datos están en `docs/CONTRATO.md`: respétalos.
`timeline.json` lo genera `tools/kaleidos linea`; nunca se edita a mano.

## Ciclo de un vídeo con el motor (detalle en `docs/FLUJOS.md`)

1. **Brief**: método, estilo (si no lo dice, propón 2–3 del catálogo con su referencia, `docs/ESTILOS.md` §3), recorte
   sí/no, público, duración. Confirma y escribe `BRIEF.md`.
2. **Proyecto y preproceso**
   - Con ponente: `tools/kaleidos nuevo <slug> --bruto brutos/<x> --estilo <e> --metodo clase-larga|corto-ilustrado`
     y `tools/kaleidos preparar <slug>`. Es largo (~55 min con un bruto 4K de 34 min): lánzalo en segundo plano con su
     registro (`… > proyectos/<slug>/work/logs/preparar.out 2>&1 &`) y comprueba después el recuento de fotogramas.
   - Narración: `tools/kaleidos nuevo <slug> --narracion --estilo <e> --escenario`; escribe `locucion.json`;
     `tools/kaleidos voz <slug> --simular` → `voz <slug>` → `transcribir <slug>`.
3. **Lee la transcripción entera** (`work/transcripcion.txt`) y escribe `guion.json` (cortes, capítulos, eventos por
   frase clave, `fixes`). Densidad de referencia en clases: un gráfico cada ~40 s. En narración: sin cortes, sin
   `gesto3d`, disposiciones `completa`/`voz`.
4. `tools/kaleidos media <slug> && tools/kaleidos linea <slug> && tools/kaleidos media <slug>` hasta que no quede
   ningún `ERROR:`; `tools/kaleidos capitulos <slug>`.
5. **Revisión local**: `node motor/scripts/stills.mjs <slug> --at eventos` → hoja en
   `motor/out/stills/<slug>-<estilo>-auto/hoja.jpg`. Mírala (si tu entorno no te deja ver imágenes, pide al usuario que
   la revise antes de seguir) y corrige.
6. **Lambda**: `node motor/scripts/lambda.mjs <slug> --dry-run` (en narración, `--concurrencia max`) → enseña al usuario
   recursos, coste y tiempo estimados → **espera su OK** → `node motor/scripts/lambda.mjs <slug>`.
7. **Audio y verificación**: normaliza la mezcla (loudnorm en dos pasadas a −16 LUFS / −1,5 dBTP, copiando el vídeo;
   `docs/FLUJOS.md` §6), `ffprobe` y recuento de fotogramas, y cierra `informe.md` con tiempo y coste reales.

## Reglas

- **AWS**: nada sin confirmación explícita del usuario, con recursos y coste estimado por delante (también se anuncian
  las lecturas). Región `eu-west-1`. El bucket `remotionlambda-*` es de **lectura pública** (política de Remotion):
  ahí solo el site y la salida, que se descarga y se borra. Entradas (vídeos, audio, `timeline.json`, extras) siempre
  al **bucket privado** con URLs prefirmadas. Si algo falla, explica y propone antes de reintentar. Al acabar, da
  **tiempo y coste final**. Detalle: `docs/AWS.md`.
- **Credenciales** en `.env` (plantilla en `.env.example`): nunca las muestres, copies al chat ni pongas en URLs. No
  leas `.env` con `cat`; cárgalo en un subshell (`set -a; . ./.env; set +a`). Los scripts ya lo cargan sin imprimirlo.
- **Privacidad** (política de la organización): ningún dato personal de clientes en respuestas, informes, gráficos o
  rótulos; no cites fragmentos de transcripción con datos personales; si aparecen en pantalla, se difuminan. Rótulos
  genéricos salvo que el usuario dé los nombres.
- **Contenido**: los gráficos resumen lo que dice la voz; no se inventan datos ni decisiones. Las incoherencias del
  material se señalan en el informe. Actualidad: solo fuentes oficiales, anotadas en `proyectos/<slug>/fuentes.md`; si
  una web devuelve 403 a la descarga directa, ábrela con un navegador y captúrala con `scripts/capture.mjs`.
- **Verificar con imágenes**: stills y hojas de contactos tras cada cambio; `ffprobe` y recuento de fotogramas de cada
  salida; nunca filtres los logs de ffmpeg con `grep` al lanzar procesos largos.
- **Audio**: la mezcla sale de Lambda por encima de −16 LUFS y con picos de +0,3 dBTP; se normaliza en local antes de
  entregar mientras el motor no limite el bus.
- **TTS**: ElevenLabs `eleven_v4`; música `eleven_music_v2_5`; efectos `eleven_text_to_sound_v2`. Audio local
  (`.claude/skills/audio-local/`) solo si el usuario lo pide.
- Remotion **4.0.529 exacto** en `motor/` (debe coincidir con las funciones Lambda desplegadas).
- HyperFrames en Lambda: stack `hyperframes-kaleidos` desplegado (`docs/AWS.md` §8). Renderiza desde una copia sin
  `node_modules` y con `hyperframes@0.8.86` (comando en `docs/MONTAR_VIDEO.md` §4.3).
- `~/videos-opus` es de solo lectura (conocimiento heredado: promos, informativo, pizarra, dibujos, bucle de 240 s).
- Tipografías **solo OFL/Apache**.
- Licencia: Remotion es gratis para equipos de hasta 3 personas; uso comercial en empresa → licencia de Remotion.
  HyperFrames es Apache-2.0.

## Entorno

Mac M1 Pro (16 GB, Metal), Node 22, ffmpeg 8 con VideoToolbox (sin `drawtext`), `uv`, AWS CLI, SAM CLI, bun.
Variables de `.env`: AWS/Remotion, ElevenLabs, OpenAI (imágenes), Apify. Diagnóstico: `node scripts/doctor.mjs`.
Instalación (una vez): `./instalar.sh` (guía: `INSTALAR.md`). No lances a la vez recorte, pose y transcripción (16 GB).
En macOS no hay `timeout`: `perl -e 'alarm 120; exec @ARGV' <comando>`. Lanza todo desde la raíz del repo.

## Documentación

`docs/INDICE.md` (índice) · `docs/MONTAR_VIDEO.md` (conversación) · `docs/FLUJOS.md` (comandos, tiempos, costes) ·
`docs/ARQUITECTURA.md` · `docs/CONTRATO.md` (formatos) · `docs/METODO_EDICION_IA.md` (método) · `docs/AWS.md` ·
`docs/ESTILOS.md` · `docs/SOLUCION_PROBLEMAS.md` · `docs/GLOSARIO.md` · `motor/README.md` · `tools/PROGRESO.md`.
