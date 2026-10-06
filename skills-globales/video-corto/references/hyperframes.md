# HyperFrames — las restricciones que rompen el render en silencio

Todas salen de errores reales, no de la documentación. La mayoría **no fallan al
lintar**: fallan al renderizar, y algunas producen un MP4 aparentemente correcto.

## 1. `data-composition-id` es único por composición

No puedes montar el mismo fichero de escena dos veces en un shell: el id es la
clave con la que el runtime busca la timeline registrada.

Por eso los planos que se repiten (B-roll, rótulos) van como **clips en el shell**
—`<img class="clip shot">`, `<div class="clip caption">`— animados por la timeline
principal. Las sub-composiciones se reservan para escenas complejas de **un solo
uso**: un mapa, un gráfico, el cierre.

## 2. Dos clips de la misma pista no pueden solaparse en el tiempo

Ni siquiera si son de tipos distintos. Rótulo y barra de acento coinciden en
pantalla, así que van en pistas separadas. Convenio del generador:

| Pista | Contenido |
| --- | --- |
| 0 | imagen de fondo |
| 1 | degradado |
| 2 | tarjeta de texto o sub-composición |
| 3 | barra de acento |
| 4 | locución |
| 5 | música |
| 6 | efectos |
| 7 | crédito de imagen |

## 3. Todo `<audio>` necesita `id`

Sin él, el renderer no descubre el medio y **el vídeo sale mudo**. No avisa en
runtime; solo lo caza el lint (`media_missing_id`). Convenio: `id="voz-<lineId>"`,
`id="bgm-<id>"`, `id="sfx-<n>-<id>"`.

## 4. El registro de la timeline debe ser inline en el shell

El lint estático no mira dentro de un `.js` externo, así que un
`window.__timelines["main"] = …` en un fichero aparte da `missing_timeline_registry`
aunque funcione en runtime. Solución: el fichero compartido expone un constructor
y el shell hace el registro:

```html
<script src="videos/_shared/timeline.js"></script>
<script>
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = window.buildVoxTimeline();
</script>
```

## 5. Sin `<link>` a Google Fonts

Aviso `google_fonts_import`. Basta declarar la familia en CSS: el compilador
inyecta `@font-face` determinista y resuelve la fuente en compile/render.

## 6. Sub-composiciones: el `<template>` es el transporte

El runtime clona **solo** el contenido de `<template>` y descarta todo lo demás,
incluido el `<head>` entero. Estilos, marcado y scripts van **dentro** del
template. Tres trampas que pasan el lint y revientan al montar:

- `<style>` en el `<head>` → se descarta; el texto sale sin estilar arriba a la izquierda.
- El `data-composition-id` del host ≠ el del template → el runtime espera 45 s por escena y captura fotogramas estáticos.
- Estilar la raíz por una clase → el compilador scopea cada regla a
  `[data-composition-id="<id>"] S`, y la raíz no es descendiente de sí misma, así
  que la regla se cae entera. **Estila por `#root`**, que está special-cased.

## 7. La raíz de una escena no lleva `data-width` / `data-height`

Si los lleva, impone su caja y el contenido se descoloca en el otro formato
—verificado: con `1080×1920` el contenido se centraba fuera de cuadro en 16:9—.
El slot del host es quien manda. El **shell** sí los lleva, en la raíz y en cada
clip de sub-composición.

## 8. Determinismo

Sin `Date.now()`, sin `Math.random()`, sin `fetch`. Geometría generada en bucles
deterministas. En animaciones continuas, `fromTo` con `ease: "none"` para que el
estado dependa solo de la posición del playhead: el render hace *seek*, no
reproduce.

## Comandos

```bash
npm run check                     # lint + runtime + layout + motion + contraste
npx hyperframes lint --verbose    # incluye findings informativos
npx hyperframes snapshot --at 12,40,90 -o /tmp/s   # + hoja de contactos
npx hyperframes render -c videos/<slug>/vertical.html -q draft -o out.mp4
```

`check` opera **solo sobre `index.html`** del proyecto; por eso existe
`use.mjs`, que copia el shell activo al index. `render` sí acepta `-c <ruta>`.

Un SVG animado hace que el render caiga del modo rápido (`drawElement`) a captura
por pantalla. Es un fallback automático y correcto, solo más lento.
