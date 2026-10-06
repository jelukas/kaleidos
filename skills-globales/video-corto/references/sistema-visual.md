# Sistema visual — explainer editorial

El de `assets/vox.css`, inspirado en los vídeos explicativos de vox.com. Es un
punto de partida sólido para piezas informativas; cámbialo si la marca del
usuario manda otra cosa.

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `--vox-yellow` | `#ffe500` | acento, subrayados, la palabra clave del rótulo |
| `--vox-ink` | `#0b0b0c` | fondo |
| `--vox-white` | `#ffffff` | texto principal |
| `--vox-muted` | `#9a9aa2` | etiquetas y atribuciones |
| `--vox-font` | Archivo | 900 titulares, 800 kicker, 700 entradillas |

Los tokens se declaran en el shell y **heredan a las sub-composiciones** (mismo
documento), así que las escenas no repiten la paleta.

## Rasgos

- Mayúsculas gruesas y muy apretadas (`letter-spacing` negativo) en titulares.
- Chip amarillo de antetítulo sobre el titular.
- **Una sola palabra en amarillo** por rótulo, con `<em>`. Dos ya no destacan
  nada.
- Barra de acento que barre bajo el rótulo.
- Degradado inferior sobre las fotos para que el texto lea.
- Cifras con `font-variant-numeric: tabular-nums`, para que el conteo ascendente
  no baile de ancho.

## Contraste sobre imagen

Oscurecer solo el pie **no basta**: con una foto clara (mar, cielo) el titular se
queda por debajo de 3:1 y `check` lo caza. El degradado de `.scrim` tiñe también
la parte alta, y `.card.over` ancla el texto abajo, que es donde es más denso,
dejando hueco al crédito.

Si el aviso de contraste persiste, regenera la imagen más oscura antes de tocar
el degradado: subirlo más acaba tapando la foto.

## Adaptación al formato

Todo en `vw`/`vh`/`vmin`, nunca `px`. `vmin` es el aliado para tipografía que
debe leerse igual en 9:16 y 16:9. Para layouts que cambian de eje:

```css
@media (min-aspect-ratio: 1/1) {
  .compare { flex-direction: row; }   /* dos columnas solo en horizontal */
}
```

Funciona porque el viewport **es** el stage.

## Ritmo visual

Cambia algo en cada corte: escala, encuadre, color o tipografía. `kb: "in"` /
`"out"` alterna la dirección del Ken Burns para que dos planos seguidos no se
sientan iguales. Transiciones cortas (≤ 0,25 s): flash, escala, barrido. Sin
fundidos lentos.
