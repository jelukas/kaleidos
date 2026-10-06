# Índice de la documentación

## Por dónde empezar

| Si quieres… | Lee, en este orden |
|---|---|
| Instalar kaleidos en un Mac nuevo (agente o persona) | [`../INSTALAR.md`](../INSTALAR.md) → `./instalar.sh` → `node scripts/doctor.mjs` |
| Montar un vídeo (agente o persona) | [`MONTAR_VIDEO.md`](MONTAR_VIDEO.md) → [`FLUJOS.md`](FLUJOS.md) → el `BRIEF.md` del proyecto → [`CONTRATO.md`](CONTRATO.md) |
| Entender cómo está hecho | [`../README.md`](../README.md) → [`ARQUITECTURA.md`](ARQUITECTURA.md) → [`../motor/README.md`](../motor/README.md) |
| Lanzar un render o revisar costes | [`AWS.md`](AWS.md) → `proyectos/<slug>/informe.md` |
| Elegir o crear un estilo | [`ESTILOS.md`](ESTILOS.md) → [`../estilos/README.md`](../estilos/README.md) → skill `estilos-video` |
| Arreglar algo que falla | [`SOLUCION_PROBLEMAS.md`](SOLUCION_PROBLEMAS.md) |
| Cambiar el motor o el pipeline | [`CONTRATO.md`](CONTRATO.md) → [`METODO_EDICION_IA.md`](METODO_EDICION_IA.md) → `motor/PROGRESO.md` · `tools/PROGRESO.md` |
| Trabajar con Codex u otro agente que no es Claude Code | [`../AGENTS.md`](../AGENTS.md) |

## Raíz

| Archivo | Qué cubre |
|---|---|
| [`README.md`](../README.md) | Qué es, qué se puede hacer, requisitos, puesta en marcha, ejemplo de 5 minutos, mapa de carpetas |
| [`CLAUDE.md`](../CLAUDE.md) | Instrucciones de sesión para Claude Code: reglas y enlaces (se carga siempre; corto) |
| [`AGENTS.md`](../AGENTS.md) | Lo mismo para Codex y otros agentes, sin sintaxis propia de Claude |
| [`INSTALAR.md`](../INSTALAR.md) · [`instalar.sh`](../instalar.sh) | Instalación: guía para agentes de IA («instala kaleidos») y el script idempotente que la hace |
| [`.env.example`](../.env.example) | Plantilla de credenciales (el `.env` real nunca se muestra) |

## `docs/`

| Archivo | Qué cubre |
|---|---|
| [`INDICE.md`](INDICE.md) | Este índice |
| [`MONTAR_VIDEO.md`](MONTAR_VIDEO.md) | La conversación para montar un vídeo: qué preguntar, cuándo confirmar, qué entregar |
| [`FLUJOS.md`](FLUJOS.md) | Los tres flujos (con ponente, narración con voz TTS, HyperFrames) con comandos exactos, tiempos y costes reales; normalización de audio y verificación final |
| [`ARQUITECTURA.md`](ARQUITECTURA.md) | Motores, datos, pipeline, Lambda y buckets; cómo viajan los datos y por qué |
| [`CONTRATO.md`](CONTRATO.md) | Formato de cada archivo: `proyecto.json`, `guion.json`, `timeline.json`, props, `tokens.json`, Lambda, escenario (§7) y narración (§8) |
| [`METODO_EDICION_IA.md`](METODO_EDICION_IA.md) | El método de edición con IA de los dos primeros vídeos: principios, recetas probadas, errores y tiempos |
| [`AWS.md`](AWS.md) | Recursos desplegados, políticas IAM, buckets, coste, concurrencia, limpieza y pendientes |
| [`ESTILOS.md`](ESTILOS.md) | Usar el catálogo, aplicar un estilo a cada motor, adherencia, crear estilos y variantes |
| [`SOLUCION_PROBLEMAS.md`](SOLUCION_PROBLEMAS.md) | Errores conocidos por área y cómo se arreglan |
| [`GLOSARIO.md`](GLOSARIO.md) | Términos del proyecto |

## Por componente

| Archivo | Qué cubre |
|---|---|
| [`motor/README.md`](../motor/README.md) | Motor de Remotion: uso de los scripts, arquitectura, capas, cámara, paneles, 3D, escenario, narración, rendimiento y modelo de coste |
| [`motor/PROGRESO.md`](../motor/PROGRESO.md) | Estado del motor: hecho, por pulir, pendiente y comandos para retomar |
| [`tools/PROGRESO.md`](../tools/PROGRESO.md) | Pipeline de preproceso: tabla de comandos, decisiones técnicas, tiempos, pendiente |
| `tools/kaleidos --help` | Lista de comandos de la CLI (`tools/kaleidos <comando> --help` para las opciones) |
| [`estilos/README.md`](../estilos/README.md) | Catálogo de los 10 estilos y herramientas de `_esquema/` |
| [`estilos/PROGRESO.md`](../estilos/PROGRESO.md) | Estado y decisiones del catálogo |
| `estilos/<estilo>/estilo.md` | Guía completa de cada estilo (formato `frame.md`) |
| [`aws/recursos.json`](../aws/recursos.json) | Inventario de lo desplegado en AWS |
| [`benchmark/README.md`](../benchmark/README.md) | Comparativa Remotion frente a HyperFrames (fases 1–6) |
| [`brutos/LEEME.md`](../brutos/LEEME.md) | Qué va en `brutos/` |
| `proyectos/<slug>/BRIEF.md` · `informe.md` | Intención confirmada y resultado de cada vídeo (ejemplos: `dora-v2`, `dora-milikito`, `devday-2026`) |
| `proyectos/dora-videocurso-v1/README.md` · `PLAN-LAMBDA.md` | El primer videocurso, montado a mano, y el plan de Lambda que calibró los costes |

## Skills y arnés

| Dónde | Qué |
|---|---|
| [`.claude/skills/montar-video/`](../.claude/skills/montar-video/) | Entrada única para montar un vídeo en Claude Code |
| [`.claude/skills/instalar-kaleidos/`](../.claude/skills/instalar-kaleidos/SKILL.md) | Instalar kaleidos (sigue `INSTALAR.md`) |
| [`.claude/skills/edicion-ponente/`](../.claude/skills/edicion-ponente/SKILL.md) | Vídeo desde un bruto con ponente (Remotion + Lambda) |
| [`.claude/skills/estilos-video/`](../.claude/skills/estilos-video/SKILL.md) | Listar, aplicar, recomendar, crear y revisar estilos |
| [`.claude/skills/audio-local/`](../.claude/skills/audio-local/SKILL.md) | Voz, música y efectos en local (solo si el usuario lo pide) |
| `~/.claude/skills/hyperframes*`, `video-corto`, `product-launch-video`, `general-video`, `media-use` | Skills globales de HyperFrames (Claude Code), instaladas por `instalar.sh`; `video-corto` sale de [`skills-globales/`](../skills-globales/) |
| [`plantillas/`](../plantillas/) | Plantillas de arranque por tipo de vídeo |
| `scripts/doctor.mjs` | Diagnóstico del entorno (`node scripts/doctor.mjs`) |
