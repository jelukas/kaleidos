# Audio — todo por ElevenLabs

Misma base y misma clave para los tres usos. `ELEVENLABS_BASE_URL` puede apuntar
a la API real (`https://api.elevenlabs.io`) o a cualquier proxy local que imite
su forma: los scripts solo componen `{base}/v1/...`.

| Uso | Endpoint | Salida |
| --- | --- | --- |
| Locución | `POST /v1/text-to-speech/{voice_id}` | wav 48 kHz **mono** |
| Música | `POST /v1/music` | wav estéreo; `music_length_ms` entre 3000 y 600000 |
| Efectos | `POST /v1/sound-generation` | wav mono; `duration_seconds` entre 0,5 y 30 |

## Etiquetas de emoción: hay que usar `eleven_v3`

`eleven_multilingual_v2` **ignora** las etiquetas silenciosamente — el audio sale
plano y parece que las etiquetas "no funcionan". Ponte en `eleven_v3` y escríbelas
en minúscula entre corchetes, inline en el texto:

- **Emoción**: `[serious]` `[somber]` `[curious]` `[thoughtful]` `[emphatic]` `[excited]` `[nervous]` `[sarcastically]`
- **Entrega**: `[whispers]` `[softly]` `[slowly]` `[quickly]` `[shouting]`
- **No verbal y ritmo**: `[pauses]` `[hesitates]` `[sighs]` `[laughs]` `[gasps]`

`stability: 0.5` (Natural) es el equilibrio; `0.0` (Creative) responde más a las
etiquetas pero deriva más. **Las etiquetas cuentan como caracteres facturables.**

### Verificar que se interpretan y no se leen

Comprobado empíricamente: `[curious] ¿Y por qué ahora?` duró 1,36 s frente a
1,35 s sin etiqueta, y `[emphatic]` **acortó** la línea. Si dudas en otro
proyecto:

```bash
npx hyperframes transcribe videos/<slug>/assets/voice/l01.wav
```

y comprueba que las palabras de la etiqueta no aparecen en la transcripción.
Ojo: **`[pauses]` sí alarga la línea**, porque es exactamente su función.

### Registro acorde al tema

Es el error de tono más fácil de cometer. En una noticia con víctimas, `[excited]`
suena obsceno. Usa `[somber]` en el bloque de víctimas, `[curious]` en las
preguntas y `[emphatic]` solo en los giros.

## Normalización de la voz: no es opcional

ElevenLabs devuelve la locución a **−0,7 dB de pico**, prácticamente a tope. Sin
tocarla, la mezcla final satura en cuanto entran música y efectos: medido, +1,05 dB
de pico en el MP4. Y es un fallo que **no se ve en el lint ni en los fotogramas**.

`tts.mjs` aplica `loudnorm` (EBU R128) en el transcodificado:

```
-af loudnorm=I=-16:TP=-3.0:LRA=11
```

Hace dos cosas necesarias: deja **3 dB de techo** para el resto de la mezcla e
**iguala el volumen entre líneas**, que ElevenLabs varía de una a otra. No altera
la duración, así que la sincronía con `voice.manifest.json` se mantiene intacta
(verificado: desviación 0,0000 s).

Si heredas locuciones sin normalizar, se arreglan sin volver a llamar a la API:

```bash
for f in videos/<slug>/assets/voice/*.wav; do
  ffmpeg -y -loglevel error -i "$f" -af "loudnorm=I=-16:TP=-3.0:LRA=11" \
    -ar 48000 -ac 1 "$f.n.wav" && mv "$f.n.wav" "$f"
done
```

Comprueba el resultado en el MP4 final; **el pico no debe pasar de 0 dB**:

```bash
ffmpeg -i renders/<slug>-vertical.mp4 -af astats=metadata=1 -f null /dev/null 2>&1 | grep 'Peak level'
```

Si satura, el culpable casi nunca son los efectos: baja la voz o la música, en ese
orden.

## Música

`force_instrumental: true` por defecto: acompaña, no compite con la locución. En
el montaje va con `data-volume` bajo (**0,13–0,16**).

Varias pistas dan mucho: una base para el cuerpo y **un cierre distinto** que
entra en el remate cambia por completo la sensación del final. `plan.music`
admite entradas con `at` (segundos) o `line` (id de línea del guion); todas van en
la pista 5 y el generador **recorta cada una donde entra la siguiente**, porque
dos clips de la misma pista no pueden solaparse.

Prompts que funcionan: describe instrumentación, pulso y **lo que NO debe haber**
("sin melodía protagonista, sin voces, sin subidas épicas, debe dejar hueco a la
locución"). Sin esa restricción la música se come la voz.

## Efectos

Pocos y con criterio: un `whoosh` en los cambios de bloque, un `impacto` grave
cuando entra una cifra, un `tick` en un conteo. `volume` entre 0,28 y 0,35.

## Voces

Un `voice_id` puede ser una **voz pública compartida**: en ese caso
`GET /v1/voices/{id}` responde `voice_not_found` aunque la síntesis funcione
perfectamente. Para comprobar una voz, **sintetiza**; no consultes la biblioteca.

## Coste

Créditos compartidos entre los tres usos. Tarifas de referencia: 1 crédito por
carácter (v2 multilingual), ~200 créditos por efecto, ~900 por minuto de música.
Medición real en un caso: locución v3 de 3.080 caracteres + 200 s de música + 1
efecto = **8.556 créditos**, bastante por encima de lo que predicen esas tarifas.
Trátalas como suelo, no como techo.

Para medir de verdad, lee el contador antes y después:

```bash
curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/user/subscription | jq '{tier,character_count,character_limit}'
```

Ese endpoint es además la fuente autorizada del plan del usuario: la web pública
de precios puede no coincidir con lo que tiene contratado.
