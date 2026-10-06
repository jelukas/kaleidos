# Audio del estilo milikito

Generado con ElevenLabs (MCP `creative_*`, flujo «kaleidos · audio estilo milikito», 2026-09-30), una variación por
pieza. Uso según los términos del plan de ElevenLabs de la cuenta. Nivel de referencia: base a ≈ −28 LUFS bajo la
voz; sintonía y cierre a ≈ −16 LUFS.

| Archivo | Modelo | Prompt (resumen) |
|---|---|---|
| `sintonia.mp3` | eleven_music_v2_5 | sintonía de concurso de 20 s: metales, batería funk, slap bass, subida y golpe final (120 BPM) |
| `base.mp3` | eleven_music_v2_5 | base de ~150 s, funk-pop suave (guitarra apagada, Rhodes, shaker, 104 BPM), energía constante para bucle |
| `cierre.mp3` | eleven_music_v2_5 | cierre de 15 s: fanfarria de metales, funk, acorde final triunfal |
| `sfx-destello.mp3` | eleven_text_to_sound_v2 | destello brillante ascendente |
| `sfx-whoosh.mp3` | eleven_text_to_sound_v2 | whoosh rápido de transición |
| `sfx-pop.mp3` | eleven_text_to_sound_v2 | pop de burbuja de dibujos |
| `sfx-golpe.mp3` | eleven_text_to_sound_v2 | golpe grave de revelación |
| `sfx-sello.mp3` | eleven_text_to_sound_v2 | sello de goma sobre mesa |
| `sfx-ficha.mp3` | eleven_text_to_sound_v2 | «level up» de dos notas |

## Tratamiento

- `base.mp3`: 146 s, los últimos 4 s fundidos con los primeros para que el bucle no tenga costura (original de 150 s en `originales/`).
- `sfx-pop` y `sfx-ficha` recortados al golpe útil; el resto, tal cual (ya duran 1–2 s) (`sfx-pop` se quedó con el segundo de sus cuatro pops (el primero es más flojo), `sfx-ficha` con la primera campanada). Originales en `originales/`.
- Comprobado con Whisper que la música no lleva voz cantada (solo devuelve alucinaciones típicas de música sin voz).
