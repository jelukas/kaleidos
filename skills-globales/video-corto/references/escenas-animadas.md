# Escenas animadas en SVG

La alternativa al carrusel de rótulos. `assets/scenes/` trae cinco listas para
copiar a `videos/<slug>/scenes/` y adaptar; cada una se monta **una sola vez** por
vídeo (el `data-composition-id` es único por composición).

| Escena | Qué hace | Cuándo |
| --- | --- | --- |
| `olas.html` | Bandas de ola desplazándose a distinta velocidad, con un elemento vertical fijo | Ambiente marítimo, profundidad sin vídeo |
| `puntos.html` | Campo de 2.000 puntos donde cada punto son N personas | Magnitudes grandes que un número no transmite |
| `barras.html` | Dos barras proporcionales con conteo sincronizado | Comparar dos cifras |
| `mapa.html` | Diagrama esquemático de ruta entre dos puntos | Geografía, trayectos |
| `cierre.html` | N puntos apareciendo uno a uno mientras sube un contador | Rematar el vídeo |
| `orbita.html` | Sistema de cuerpos orbitando alrededor de uno central | Jerarquías, familias de producto, relaciones |
| `precios.html` | Tabla de filas con precio antiguo tachado → precio nuevo + variación | Cambios de tarifa, antes/después con varias filas |
| `caida.html` | Dos barras antes/ahora en proporción real + porcentaje golpeando | Una sola caída o subida que carga el plano |
| `indice.html` | Barras horizontales ordenadas con conteo, escaladas al máximo | Rankings, benchmarks, puntuaciones |

## Dos trampas que cuestan una tarde

Ninguna de las dos falla en el lint. Las dos se ven solo mirando un fotograma.

### 1. Los nombres de clase colisionan con `vox.css`

El CSS de la escena se scopea a su `data-composition-id`, así que gana en
especificidad… **pero solo en las propiedades que declara**. Todo lo que no
redefinas sigue viniendo del CSS compartido.

Caso real: una escena con `.bar` para sus barras de datos. `vox.css` ya define
`.bar` como la barra de acento del rótulo, con `position: absolute; left: 6vmin;
bottom: 6vmin`. La escena redefinía color, ancho y alto — pero no `position`, así
que las barras se iban a la esquina inferior izquierda y el layout parecía roto
sin motivo aparente.

**Prefija las clases de cada escena** (`.cbar`, `.ikicker`, `.pnew`). Nombres ya
ocupados por `vox.css`: `shot` `scrim` `caption` `bar` `card` `kicker` `headline`
`deck` `statnum` `statunit` `statlabel` `compare` `cmpnum` `cmplabel` `cmprule`
`cmp-key` `quotetext` `quoteattr` `source`.

### 2. GSAP reescribe el `transform` de los elementos SVG

Al animar `rotation`, `x` o `y` sobre un `<g>`, GSAP **escribe su atributo
`transform` completo** y calcula el origen desde el bounding box del propio
elemento. Dos consecuencias:

- Un `transform="translate(...)"` puesto a mano en ese mismo grupo **se pierde**,
  y el elemento salta al origen o desaparece.
- `transform-origin` por CSS **no manda**: un grupo pensado para orbitar alrededor
  del centro del sistema acaba girando sobre sí mismo.

Para movimiento sobre una trayectoria, **anima la posición explícitamente** con un
proxy y `onUpdate`, en vez de rotar un grupo padre:

```js
const p = { a: 0 };
tl.fromTo(p, { a: 0 }, {
  a: Math.PI * 2 * vueltas, duration: dur, ease: "none",
  onUpdate: () => {
    el.setAttribute("transform",
      `translate(${(cx + rx * Math.cos(p.a)).toFixed(2)} ${(cy + ry * Math.sin(p.a)).toFixed(2)})`);
  },
}, 0);
```

Es explícito, determinista, sobrevive al seek y además deja las etiquetas
derechas (no hace falta contrarrotarlas). Si solo necesitas cambiar un radio o
una posición fija, `attr: { r: 21 }` funciona sin tocar el `transform`.

### 3. `width: auto` no sirve para posicionar una `<img>`

En un elemento **reemplazado** (`<img>`, `<video>`), `width: auto` resuelve a la
anchura **intrínseca** del archivo e ignora la pareja `left`/`right`. Una captura
posicionada con `position:absolute; left:6vmin; right:6vmin; width:auto` se sale
del cuadro por la derecha. Da la anchura explícita:

```css
width: calc(100% - 12vmin);   /* no `right` + `width: auto` */
```

En un `<div>` sí funciona `left`+`right`; el problema es solo con los reemplazados.

## Cuidado con la corrección de lo que dibujas

Si el gráfico representa algo del mundo real, **tiene que ser correcto**. En una
primera versión de `orbita.html` la Luna orbitaba el Sol en vez de la Tierra: el
render era bonito y el lint estaba en verde, pero el diagrama afirmaba una
falsedad que cualquiera detecta. Un satélite se posiciona **respecto a su
planeta**, no respecto al centro del sistema:

```js
const tx = cx + RX * Math.cos(anguloTierra);          // Tierra sobre el Sol
const lx = tx + LR * Math.cos(anguloLuna);            // Luna sobre la TIERRA
```

Lo mismo aplica a proporciones de barras, escalas y proyecciones. Revisa el
fotograma preguntándote qué está *afirmando* el gráfico, no solo si se ve bien.

## Las reglas que las hacen funcionar

**Rendimiento.** No animes miles de nodos. `puntos.html` pinta 2.000 círculos
estáticos y anima **solo la altura de un `<rect>` dentro de un `clipPath`**: el
campo se "llena" con una única propiedad. Animar 2.000 opacidades multiplicaría el
tiempo de render por nada.

Por debajo de ~100 elementos sí puedes animarlos individualmente con `stagger`,
como hace `cierre.html` con sus 67 puntos.

**Dual formato.** `viewBox` + `preserveAspectRatio="xMidYMid meet"` para que el
diagrama entero quepa en 9:16 y 16:9. `slice` solo cuando la escena sea un fondo
a sangre (`olas.html`). El resto del layout, en `vmin`.

**Determinismo.** La geometría se genera en bucles deterministas dentro del
`<template>` — nunca `Math.random()`. En movimientos continuos, `fromTo` con
`ease: "none"`, para que el estado dependa solo de la posición del playhead: el
render hace *seek*, no reproduce.

**Contraste.** Separa bien los tonos. En una primera versión de `mapa.html`,
tierra (`#1b1b21`) y mar (`#0e1420`) eran indistinguibles en el render; con
`#33333d` y `#0d1b2e` el diagrama se lee.

## Honestidad en los diagramas

Un diagrama esquemático **no es un mapa**. Si abstraes la geografía, rotúlalo
(`ESQUEMA, NO A ESCALA`). Si un punto representa a varias personas, dilo en
pantalla (`CADA PUNTO = 25 PERSONAS`). Cuesta una línea de texto y evita que el
gráfico afirme algo que no puedes sostener.

En `barras.html`, la barra menor escala con la proporción real (`46/97`), no a
ojo: una comparación visual desproporcionada es un dato falso.

## Hacer una escena nueva

Copia la más parecida y cambia la geometría. El esqueleto obligado:

```html
<template>
  <style>
    #root { position: absolute; inset: 0; }   /* por #root, nunca por clase */
  </style>
  <div id="root" data-composition-id="mi-escena">…</div>  <!-- sin data-width -->
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    // … fromTo, nunca from
    window.__timelines["mi-escena"] = tl;
  </script>
</template>
```

El `data-composition-id` debe coincidir **exactamente** con el del host en
`plan.json` (`compositionId`) y con la clave de `window.__timelines`. Si no,
el render espera 45 s por escena y captura fotogramas estáticos.

Un SVG animado hace que el render caiga del modo rápido a captura por pantalla:
es un fallback automático y correcto, solo más lento.
