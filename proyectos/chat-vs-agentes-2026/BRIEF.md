---
workflow: general-video
flow: companion
storyboard: yes
message: "El chat contesta; el agente trabaja con tus archivos y herramientas y te entrega el trabajo hecho"
destination: youtube
aspect: 1920x1080
language: es
audience: "profesionales no técnicos de audiovisual, marketing, ventas y recursos humanos"
length: 125s
angle: concept
---

## Intent

Explainer narrado (voz IA) sobre la diferencia entre usar ChatGPT o Claude solo como chat y usarlos con la app de
escritorio y sus modos de agente (Claude con Cowork y Claude Code; ChatGPT con Work y Codex), y qué aporta a personas de
audiovisual, marketing, ventas y recursos humanos. Nada muy técnico. Estilo moderno y minimalista, tipo anuncio de
producto, con los colores de la web de OpenWebinars (el usuario descartó el azul): un mensaje por plano, mucho aire, movimiento lento. Unos 2:30, 16:9.

## Assets

- assets/logo-openwebinars.svg — logo vectorial actual de OpenWebinars (SVG oficial de openwebinars.net, 241×42: aro con
  degradado #672FEA→#FF01A2, W y logotipo en #010101). Se anima como vector con efectos en la apertura (≈3 s) y en el
  cierre (≈4 s). Sin recolorear ni deformar: se muestra sobre el fondo claro de la paleta.
- fuentes.md — fuentes oficiales de Anthropic y OpenAI (consulta 2026-10-02) con avisos de lo no verificado.
- frame.md — estilo `lanzamiento-minimal` (copia de estilos/lanzamiento-minimal/estilo.md) con la paleta de la web de OpenWebinars (fondo #FAFBFC, tinta #0D1320, violeta #7D29E0, rosa #FF01A2 del logo); fuentes en assets/fonts/.

## Changes v2 (feedback del usuario tras ver v1)

- «Demasiado básico»: quiere animaciones más profesionales, mucho motion graphics, muy visual, animado, divertido y dinámico; que **simule lo que produce la IA** (vídeo con Remotion/HyperFrames, generar/editar/corregir imágenes, landings cortadas en secciones, presentaciones vistosas), como un anuncio de producto súper dinámico. Pidió buscar ejemplos (hecho: `referencias-v2.md`).
- Estilo nuevo `lanzamiento-dinamico` (variante de `lanzamiento-minimal`), voz nueva más punchy (10 líneas), música con ElevenLabs (elegido por el usuario) y construir directo sin bocetos. Etiqueta «Simulación» en las 4 producciones. Duración ≈ 2:01.

## Customizations

- Animación vectorial del logo de OpenWebinars con efectos (trazo del aro, W, letras por máscara, brillo que barre, pulso).
- Voz en español con ElevenLabs `eleven_v4` (voz de `.env`). Subtítulos limpios, sin caja.
- Pad suave en apertura y cierre; música/efectos nuevos con ElevenLabs solo si se anuncian antes con coste.
- Render en AWS Lambda (stack `hyperframes-kaleidos`, eu-west-1): `--dry-run` y OK explícito del usuario antes de lanzar.

## Notes

- Contenido solo de `fuentes.md`; nada de precios, versiones ni planes concretos. Decir «el modo agente de Claude (Cowork)»
  y «ChatGPT Work». Cowork se fusionó con el chat de Claude el 2026-09-16; «ChatGPT agent» pasó a Work en 2026-07.
- Audiovisual: ninguna de las dos empresas cita el montaje de vídeo como caso oficial; plantearlo como creatividad
  (briefings, conceptos, guiones, presentaciones, organizar material).
- No prometer disponibilidad en España/UE de Work, Computer Use ni Sites (no verificado).
- RR. HH.: avisar de no pegar datos personales de personas en el chat.
- Privacidad: ningún dato personal de clientes; rótulos genéricos; sin capturas ni logos de terceros en pantalla.
- Medidas de calidad: normalizar audio a −16 LUFS / −1,5 dBTP al entregar; informe con tiempo y coste real.

## Inicio

2026-10-02 21:13:33
