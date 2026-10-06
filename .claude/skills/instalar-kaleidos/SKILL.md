---
name: instalar-kaleidos
description: >-
  Instala y deja listo kaleidos en este Mac con instalar.sh: comprueba el sistema, hace UNA pregunta corta (qué flujos
  va a usar) con la confirmación de descargas, lanza el instalador en segundo plano, resuelve lo que falle, y termina
  con el diagnóstico y lo que le queda al usuario (rellenar .env). Úsala cuando el usuario diga «instala kaleidos»,
  «instálalo», «prepara kaleidos», «pon kaleidos en marcha», «configura el entorno», «instala las dependencias», «no
  me funciona el entorno» o acabe de clonar o copiar el repo y quiera empezar. No la uses para montar un vídeo (eso
  es montar-video).
---

# Instalar kaleidos

**Fuente: [`INSTALAR.md`](../../../INSTALAR.md)** en la raíz del repo. Léelo entero y síguelo: reglas (§0), comprobar
(§1), preguntar (§2), lanzar y vigilar (§3), si algo falla (§4), credenciales (§5) e informe (§6).

En Claude Code:

- §2: una sola llamada a AskUserQuestion con las preguntas que no se deduzcan de lo que ya dijo el usuario; la opción
  recomendada, primera.
- §3: lanza `./instalar.sh [opciones] > instalar.log 2>&1` con `run_in_background` y revisa `tail -n 40 instalar.log`
  hasta que acabe (te avisan al terminar).
- §5: las claves las escribe el usuario en su editor. Nunca las pidas ni las leas.
