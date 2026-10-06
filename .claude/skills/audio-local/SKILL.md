---
name: audio-local
description: Genera la locución, la música y los efectos de un vídeo EN LOCAL en este Mac, con Qwen3-TTS 1.7B (voz), ACE-Step 1.5 (música) y Stable Audio Open 1.0 (efectos), en lugar de ElevenLabs. Úsala SOLO cuando el usuario lo pida explícitamente, con frases como «genera el audio local», «audio local», «hazlo con los modelos locales», «sin ElevenLabs» o «en local». Si no lo pide así, el audio se sigue generando con ElevenLabs como siempre (scripts/tts.mjs, scripts/audio.mjs, video-corto), aunque se trate de un vídeo nuevo.
---

# Audio local (Qwen3-TTS · ACE-Step · Stable Audio Open)

Tres modelos instalados en `~/ai-audio/` sustituyen a ElevenLabs cuando el usuario lo pide. Cada uno hace lo suyo:

| Parte | Modelo | Sustituye a |
|---|---|---|
| Voz | Qwen3-TTS 1.7B Base, clonando el **narrador castellano aprobado** (`assets/narrador_ref.wav`) | `scripts/tts.mjs` |
| Música | ACE-Step 1.5 turbo (LM 0.6B, MLX), con o sin letra | parte `music` de `scripts/audio.mjs` |
| Efectos | Stable Audio Open 1.0 (diffusers, fp16) | parte `sfx` de `scripts/audio.mjs` |

## Cuándo usarla

- **Sí:** el usuario dice «genera el audio local», «audio local», «con los modelos locales», «sin ElevenLabs». Vale para cualquier flujo (video-corto, HyperFrames, canal relax…): en ese flujo, cambia solo el paso de audio por esta skill y deja el resto igual.
- **No:** en cualquier otro caso. ElevenLabs es el camino por defecto. No propongas el audio local por iniciativa propia salvo que el usuario pregunte por alternativas.
- Si pide solo una parte («la música en local»), genera solo esa y el resto con ElevenLabs.

## Contrato de ficheros (idéntico a ElevenLabs)

Lee y escribe exactamente lo mismo que `tts.mjs` y `audio.mjs`, así que la composición no cambia:

- Voz: `proyectos/<slug>/script.json` → `assets/voice/<id>.wav` + `assets/voice.manifest.json` (con `start` acumulados).
- Música y efectos: `proyectos/<slug>/audio.json` → `assets/audio/<id>.wav`, `assets/audio/sfx/<id>.wav` + `assets/audio.manifest.json`.
- Las tomas extra van a `assets/audio/alt/` y `assets/audio/sfx/alt/`, y el manifiesto las lista en `alternates`, para elegir de oído.

Campos extra que entienden los scripts locales en `audio.json`:
- `music[]`: `lyrics` (canción con voz; por defecto instrumental), `vocalLanguage` (por defecto `es`), `bpm`.
- `sfx[]`: `durationSeconds` (0,3–47; por defecto 5), `takes` (tomas por efecto).

## Cómo ejecutarla

Siempre **de uno en uno** (el lanzador ya lo hace en orden). Los tres a la vez no caben en 16 GB:

```bash
.claude/skills/audio-local/scripts/audio-local.sh <slug>            # voz → música → efectos
.claude/skills/audio-local/scripts/audio-local.sh <slug> voz        # solo una parte: voz | musica | efectos
.claude/skills/audio-local/scripts/audio-local.sh <slug> efectos --force --takes 4
```

Cada parte cachea por hash como los scripts de ElevenLabs; `--force` regenera. Lánzalo con `run_in_background` y sigue el progreso: tarda minutos.

Antes de lanzar, comprueba la memoria (`memory_pressure | tail -1`). Si hay menos de un 35–45 % libre, pide al usuario que cierre Premiere u otras apps pesadas. Con poca memoria los modelos paginan a disco y un trabajo de 3 min puede tardar más de una hora (ya pasó). `musica.py` aborta un trabajo a los 15 min por esa razón.

## Qué esperar de cada parte

**Voz (`voz.py`)**
- Velocidad: unas 2,6 veces la duración del audio; 3 min de locución son unos 8 min.
- Las etiquetas de ElevenLabs v3 (`[serious]`, `[sighs]`…) se eliminan porque Qwen las leería en voz alta. La emoción la da la puntuación y el propio texto.
- Control de calidad automático por línea: Whisper local comprueba que se dice el texto (WER ≤ 0,25). Si la frase tiene palabras con z/ce/ci y con s, mide además Δθ, que debe superar 12 dB para ser castellano (la misma prueba que `scripts/persona-voice.py`). Si una toma falla, repite hasta `--takes` (3 por defecto) y se queda con la mejor; las que siguen fallando salen marcadas con «⚠ revisar».
- Solo hay **una voz aprobada: el narrador masculino**. No hay voz femenina castellana validada: si el usuario la pide, avísale. Opciones: una tanda de diseños con VoiceDesign midiendo Δθ, o clonar una grabación castellana con permiso de su dueña. Clona solo voces sintéticas propias o voces reales con permiso.
- Números y siglas: escríbelos como se leen («noventa y nueve coma nueve», «GPT seis»), igual que en ElevenLabs.

**Música (`musica.py`)**
- Genera 2 tomas por pieza: A va al fichero principal y B a `alt/`. Cada par de 60–90 s tarda entre 2,5 y 3,5 min; la primera pieza tarda más porque carga los modelos.
- Arranca el servidor de ACE-Step y lo apaga al terminar para liberar unos 7 GB.
- Duración entre 10 y 600 s. Si se pide menos de 10 s, recorta con un fundido.
- Las canciones en español con `lyrics` se entienden bien. Para camas bajo locución, pide en el prompt «no vocals, no lead melody».

**Efectos (`efectos.py`)**
- Cada toma tarda lo mismo sea un clic o 30 s de lluvia (el modelo siempre genera 47 s): unos 1,5–2,5 min por toma.
- Salen bien los ambientes (lluvia, viento, trueno cercano, impactos, obturador, tecleo). El trueno lejano y los sonidos de interfaz muy cortos (tick, pop, riser) varían mucho de una toma a otra: para esos, usa `"takes": 4` y deja que el usuario elija entre las alternativas.
- Los ambientes largos (≥ 8 s o `loop`) salen en estéreo y el resto en mono. No hay loop sin costura nativo: si hace falta, crea el loop con un fundido cruzado en ffmpeg.

## Después de generar

1. Resume en una tabla lo generado: duración, tomas, avisos «⚠ revisar» y Δθ de la voz.
2. Recuerda que la música y los efectos tienen tomas alternativas en `alt/`; si el usuario prefiere otra, cópiala sobre el fichero principal.
3. Sigue con el flujo del vídeo (composición, render) igual que con ElevenLabs.

## Referencia

- Instalación: `~/ai-audio/qwen3-tts`, `~/ai-audio/ACE-Step-1.5` (instalar dependencias con `uv sync --frozen` o `UV_FROZEN=1`) y `~/ai-audio/stable-audio`. El modelo de Stable Audio es de acceso restringido y ya está descargado con la cuenta del usuario.
- Página de escucha con las pruebas A/B contra ElevenLabs: https://claude.ai/artifact/U5s6eynmvcNbKCSqtnoKcM (scripts en `~/ai-audio/pruebas/`).
- Licencias: Stable Audio Open usa la licencia comunitaria de Stability AI (gratis por debajo de 1 M$ de ingresos anuales). ACE-Step es MIT y Qwen3-TTS es Apache-2.0.
