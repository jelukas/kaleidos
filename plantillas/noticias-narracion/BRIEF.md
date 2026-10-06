# BRIEF · <Titular corto>

> Plantilla `noticias-narracion` (modelo: `proyectos/devday-2026`). Sustituye a la que crea `tools/kaleidos nuevo
> --narracion`. Rellena cada apartado y borra las indicaciones entre corchetes.

- **Proyecto:** `<slug>` · **narración** (sin bruto ni ponente; voz de ElevenLabs) · estilo `milikito` · modo escenario
- **Salida:** 1920×1080 a 25 fps · 3–4 min · render en AWS Lambda
- **Inicio:** <AAAA-MM-DD HH:MM> (reloj de pared, para el tiempo total del informe)

## Confirmado con el usuario
[Lo que respondió en la entrevista, con sus palabras cuando importen: tema, plantilla, estilo, duración y formato,
y cualquier cosa que pidiera expresamente (p. ej. «renderízalo en Lambda»).]

## Deducido (sin preguntar)
| Campo | Valor | De dónde |
|---|---|---|
| Idioma | es | conversación |
| Voz | la de `.env` (`ELEVENLABS_VOICE_ID`), modelo `eleven_v4` | `.env` |
| Música y efectos | los de `estilos/milikito/audio/` (sintonía, base a ≈ −24 LUFS, cierre, 6 efectos) | estilo |
| Fuentes | oficiales, en `fuentes.md` con fecha de consulta | tema de actualidad |
| Público y destino | [p. ej. profesionales del sector · YouTube] | tema |

## Objetivo
[Qué tiene que saber quien vea el vídeo al terminar, en una frase.]

## Estructura (≈ 3:30–4:00)
Apertura de marca (4 s de sintonía sin voz, `intro.previo`) → gancho → **5 bloques** con ficha «1»…«5» y rótulo →
cierre con resumen en 3 puntos y coda de 5 s sin voz (`outro.coda`).
1. [Bloque 1 · noticia principal]
2. [Bloque 2]
3. [Bloque 3]
4. [Bloque 4]
5. [Bloque 5]

## Locución (`locucion.json`)
≈ 150 palabras por minuto (3–4 min ≈ 500–600 palabras, ≈ 3.500 caracteres); 12–16 bloques de 1–3 frases;
`pausaDespues: 0.7` al cerrar cada bloque temático. Cifras y siglas escritas como se dicen; su grafía en pantalla en
`guion.json › fixes` y en `proyecto.json › whisper.prompt`: [siglas y nombres de producto].

## Gráficos
Algo nuevo en pantalla cada 3–10 s. Registro show (cifras con contador, titulares de juego, sellos) y editorial
(listas, checklist, comparativas, mapas, pasos); láminas de cómic (`images.json`, sin personas reales ni marcas ni
texto) y capturas de las fuentes (`captures.json`); reacciones en las preguntas; 3D (`letras`, `llave`, `trofeo`).
Disposiciones `completa` y `voz`; sin `gesto3d`.

## Fuentes y veracidad
Solo fuentes oficiales (`fuentes.md`). Los gráficos resumen lo que dice la voz; no se inventan cifras. Afirmaciones
de la empresa, dichas como tales. Incoherencias entre fuentes → `informe.md`.

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos, subtítulos destacados ni informes, salvo lo que
el usuario dé para el vídeo. Capturas sin datos personales (si los hay, se difuminan o se descartan).

## Entregables
- `resultados/<slug>.mp4` (Lambda, audio normalizado a −16 LUFS / −1,5 dBTP)
- `proyectos/<slug>/capitulos.txt` (capítulos de YouTube)
- `proyectos/<slug>/informe.md` (estructura, avisos, fuentes, tiempo total y coste)
