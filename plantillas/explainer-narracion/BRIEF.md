# BRIEF · <Concepto>

> Plantilla `explainer-narracion`. Sustituye a la que crea `tools/kaleidos nuevo --narracion`. Rellena cada apartado
> y borra las indicaciones entre corchetes.

- **Proyecto:** `<slug>` · **narración** (sin bruto ni ponente; voz de ElevenLabs) · estilo `milikito` (registro
  editorial) · modo escenario
- **Salida:** 1920×1080 a 25 fps · 60–120 s · render en AWS Lambda
- **Inicio:** <AAAA-MM-DD HH:MM>

## Confirmado con el usuario
[Tema, plantilla, estilo, duración y formato, y lo que pidiera expresamente.]

## Deducido (sin preguntar)
| Campo | Valor | De dónde |
|---|---|---|
| Idioma | es | conversación |
| Voz | la de `.env` (`ELEVENLABS_VOICE_ID`), modelo `eleven_v4` | `.env` |
| Música y efectos | los de `estilos/milikito/audio/` | estilo |
| Fuentes | [texto del usuario / documentación oficial del tema] | tema |
| Público y destino | [p. ej. equipo interno sin conocimientos previos · LMS] | tema |

## Objetivo
[La única idea que tiene que quedar clara.]

## Estructura (≈ 90 s)
Apertura de 3 s sin voz → gancho con pregunta → 3 pasos con ficha «1»…«3»: **el problema** · **cómo funciona**
(idea clave + pasos + ejemplo) · **lo que conviene evitar** (error frente a acierto + checklist) → cierre con 3 puntos
y coda de 4 s.

## Locución (`locucion.json`)
≈ 150 palabras por minuto (90 s ≈ 220 palabras); 6–10 bloques de 1–3 frases. Términos con su grafía:
[siglas, productos].

## Gráficos
Algo nuevo cada 5–10 s. Registro editorial (lista, clave con palabras resaltadas, pasos, comparativa, checklist),
2–3 láminas con bocadillos (sin personas reales, sin marcas, sin texto), una reacción en la idea clave, bombilla 3D
en el cierre. Disposiciones `completa` y `voz`; sin `gesto3d`.

## Fuentes y veracidad
Los gráficos resumen lo que dice la voz. Ningún ejemplo ni cifra que no venga de una fuente o del usuario.

## Privacidad
Nada de nombres reales de personas ni datos personales.

## Entregables
- `resultados/<slug>.mp4` (Lambda, audio normalizado a −16 LUFS / −1,5 dBTP)
- `proyectos/<slug>/informe.md` (estructura, avisos, tiempo total y coste)
