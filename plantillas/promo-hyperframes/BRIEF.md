---
workflow: <video-corto | product-launch-video | general-video | motion-graphics | faceless-explainer>
flow: <automation | companion>
storyboard: <yes | no>
message: "<La única idea que tiene que quedar>"
destination: <youtube | shorts | reels | tiktok | linkedin | web>
aspect: <1920x1080 | 1080x1920 | 1080x1080>
language: es
audience: "<Para quién>"
length: <15s | 30s | 45s | 60s>
angle: <launch | feature | demo | concept>
---

<!--
Plantilla promo-hyperframes. NO la copies antes de `npx hyperframes init`: init se niega a inicializar una carpeta
con archivos. El flujo de HyperFrames escribe BRIEF.md como primera acción tras init, con este frontmatter
(formato: ~/.claude/skills/hyperframes/references/brief-format.md); usa esta plantilla para rellenarlo.
Entrada: skill /hyperframes (elige el flujo). Proyecto en proyectos/<slug>/ (no en videos/).
Estilo: tras init, cp ../../estilos/<estilo>/estilo.md frame.md y las fuentes a assets/fonts/.
Render: Lambda con el stack hyperframes-kaleidos solo si está desplegado (aws/recursos.json › hyperframes.estado);
si no, avisar y ofrecer render local (npx hyperframes render --quality delivery) o desplegarlo con OK y coste.
-->

## Intent

<Qué es el vídeo, para quién y por qué ahora; tono en palabras del usuario (p. ej. «cercano, con humor, nada de
anuncio de teletienda»).>

## Assets

- <ruta — qué es y dónde va (logo, capturas, URL del producto, música del usuario)>

## Customizations

- Estilo `<vox-corto | ensaya-conversation-club | cuaderno-a-mano | dibujos-animados | senal-informativo>` del
  catálogo de kaleidos (`frame.md` copiado de `estilos/<estilo>/estilo.md`).
- Voz: <sin voz | ElevenLabs con la voz de `.env`, modelo `eleven_v4` (`scripts/tts.mjs`)>.
- Música y efectos: <los del estilo | nuevos con ElevenLabs (`scripts/audio.mjs` o `el-audio.mjs`) | sin música>.
- Imágenes: <gpt-image-2 (`scripts/images.mjs`) | capturas del producto (`scripts/capture.mjs`) | fotos reales vía
  Apify (`scripts/stock.mjs`, de pago: `--dry-run` y `--budget`)>.
- <Petición concreta: contador en la cifra final, captura de la página de precios…>

## Notes

- Inicio: <AAAA-MM-DD HH:MM> (para el tiempo total del informe).
- Deducido sin preguntar: <idioma es · formato según destino · render local si no hay Lambda de HyperFrames · …>.
- Datos y cifras solo de fuentes oficiales o del usuario; nada de personas reales ni datos personales.
- <Qué evitar.>
