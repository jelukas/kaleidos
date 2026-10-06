# BRIEF · Introducción a n8n

- **Proyecto:** `curso-n8n-intro` · **narración** (sin bruto ni ponente; voz de ElevenLabs) · estilo `lanzamiento-dinamico` · modo escenario
- **Salida:** 1920×1080 a 25 fps · ≈ 30 min · render en AWS Lambda
- **Inicio:** 2026-10-03 10:52 (reloj de pared, para el tiempo total del informe)

## Confirmado con el usuario
- «Un curso de una media hora dividido por capítulos y lecciones de introducción a n8n para personas no técnicas,
  con ejemplos y casos de uso reales».
- Material: narración con voz IA. Plantilla: larga por capítulos. Estilo: `lanzamiento-dinamico`. Formato: 16:9.
- Entrega: **un vídeo entero + un MP4 por lección** (cortes en local tras el render de Lambda).
- En pantalla: **diagramas animados de flujos + capturas de fuentes oficiales** (sin grabaciones de pantalla).
- Temario propuesto aceptado y «hazlo del tirón todo»: de principio a fin sin paradas intermedias (voz, láminas y
  Lambda dentro de las estimaciones dadas: ≈ 30.000 caracteres, 20–30 láminas, ≈ 1 $ de Lambda).

## Deducido (sin preguntar)
| Campo | Valor | De dónde |
|---|---|---|
| Idioma | es (España) | conversación |
| Voz | la de `.env` (`ELEVENLABS_VOICE_ID`), modelo `eleven_v4` | `.env` |
| Música y efectos | los de `estilos/milikito/audio/` (el estilo no trae audio); base más baja (≈ −27 LUFS) | proyecto |
| Fuentes | oficiales de n8n (docs.n8n.io, n8n.io), en `fuentes.md` con fecha de consulta | contenido sobre un producto |
| Público y destino | personas no técnicas que quieren automatizar tareas de oficina · plataforma de cursos | petición |

## Objetivo
Que alguien sin perfil técnico entienda qué es n8n, sus piezas (disparadores, nodos, datos, credenciales) y sepa
montar su primer flujo y reconocer casos de uso reales en su trabajo.

## Estructura (≈ 30 min)
Apertura de marca (4 s sin voz) → bienvenida → 4 capítulos con lecciones (rótulo `titulo` al empezar cada lección)
→ cierre con resumen y coda de 5 s sin voz.
- **Bienvenida** (≈ 1 min)
- **Cap. 1 · Qué es n8n** — 1.1 Automatizar sin programar · 1.2 n8n frente a Zapier y Make · 1.3 Cloud o instalado por tu cuenta
- **Cap. 2 · Las piezas de n8n** — 2.1 Disparadores · 2.2 Nodos y acciones · 2.3 Los datos entre pasos · 2.4 Credenciales
- **Cap. 3 · Tu primer flujo** — 3.1 Formulario → hoja → aviso · 3.2 Probar y corregir · 3.3 Activar y ejecuciones
- **Cap. 4 · Casos de uso reales** — 4.1 Marketing: contactos al CRM · 4.2 Clasificar y resumir correos · 4.3 IA y agentes · 4.4 Plantillas de la comunidad
- **Cierre** (≈ 2 min): buenas prácticas y siguientes pasos

## Locución (`locucion.json`)
≈ 150 palabras por minuto (≈ 4.300–4.600 palabras, ≈ 30.000 caracteres); bloques de 1–3 frases; `pausaDespues`
al cerrar cada lección. Términos de la interfaz en inglés tal y como aparecen en n8n, explicados en castellano.
Grafía en pantalla en `guion.json › fixes` y en `proyecto.json › whisper.prompt`.

## Gráficos
Algo nuevo en pantalla cada 5–15 s. Flujos dibujados como pasos/mapas (disparador → nodos → resultado), listas,
comparativas, checklists, cifras verificadas; láminas ilustradas (`images.json`, sin personas reales ni marcas ni
texto) y capturas de páginas oficiales (`captures.json`). Disposiciones `completa` y `voz`; sin `gesto3d`.

## Fuentes y veracidad
Solo fuentes oficiales (`fuentes.md`). Precios y cifras, tal y como los publica n8n y con fecha; lo que diga cada
empresa sobre sí misma, dicho como tal. Incoherencias → `informe.md`.

## Privacidad
Ejemplos con datos ficticios genéricos; nada de nombres reales ni datos personales. Capturas sin datos personales.

## Entregables
- `resultados/curso-n8n-intro.mp4` (Lambda, audio normalizado a −16 LUFS / −1,5 dBTP)
- `resultados/curso-n8n-intro/` con un MP4 por lección
- `proyectos/curso-n8n-intro/capitulos.txt` e `informe.md` (estructura, avisos, fuentes, tiempo total y coste)
