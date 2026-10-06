# Contrato de datos de kaleidos

Qué produce cada pieza y qué consume la siguiente. **Datos antes que código:** lo editorial vive en JSON, el pipeline
(`tools/`) lo convierte en una línea de tiempo y el motor de Remotion (`motor/`) solo la pinta. El motor es uno solo
para todos los vídeos; un vídeo es una carpeta de datos + un estilo.

```
brutos/<archivo>                      material en bruto (nunca se modifica)
estilos/<estilo>/                     guía de estilo: estilo.md + tokens.json + fonts/ + referencias/
proyectos/<slug>/
  proyecto.json                       configuración (la crea `tools nuevo`)
  BRIEF.md                            intención confirmada con el usuario
  guion.json                          guion editorial por frases clave (lo escribe Claude tras leer la transcripción)
  timeline.json                       GENERADO por `tools linea` — no se edita a mano
  media/                              lo que el motor necesita en local (enlaces a work/ + timeline.json)
  work/                               intermedios (en .gitignore): analisis/, transcripcion.json, mezzanine.mp4,
                                      mascara.mp4, plancha.mp4, pose.json, stills/, logs/
  informe.md                          informe final: decisiones, tiempos, coste, avisos
resultados/<slug>.mp4                 vídeo final descargado de Lambda
```

**Unidades.** Tiempos del guion y de la transcripción: **segundos de la fuente** (el bruto). Tiempos de `timeline.json`:
**fotogramas de salida** (salvo `segmentos[].src`, en segundos de la fuente). Coordenadas espaciales: **píxeles de la
fuente** (del bruto, p. ej. 3840×2160); el motor las transforma con la cámara y la geometría de la plancha.

---

## 1. `proyecto.json`

```jsonc
{
  "slug": "dora-casos",
  "titulo": "DORA en la práctica",
  "bruto": "brutos/prueba1.mp4",
  "metodo": "clase-larga",            // clase-larga | corto-ilustrado
  "estilo": "curso-azul",             // nombre de carpeta en estilos/
  "idioma": "es",
  "salida": { "ancho": 1920, "alto": 1080, "fps": 25 },   // fps = el de la fuente salvo razón de peso
  "ponente": { "recorte": true },     // true: máscara + fondo del estilo + capas detrás/delante del ponente
  "cortes": { "silencioMin": 0.8, "margen": 0.25, "colaFinal": 1.6 },
  "whisper": { "modelo": "large-v3-turbo", "prompt": "Términos del dominio separados por comas" },
  "lambda": {
    "region": "eu-west-1",
    "funcion": "remotion-render-4-0-529-mem3008mb-disk10240mb-900sec",
    "framesPorLambda": 100,
    "crf": 20,
    "conservarSalida": false          // true: no borra renders/<id>/ del bucket de Remotion tras descargar
  }
}
```

## 2. `guion.json` (editorial, en segundos de la fuente)

Cada momento se ancla con un **cue** `[segundoAproximado, "frase literal"]`. El generador busca la frase normalizada
(minúsculas, sin tildes ni puntuación, tras aplicar `fixes`) a partir de `segundo − 2 s` y usa el inicio de su primera
palabra. Así el gráfico entra cuando se dice y el guion sobrevive a pequeños cambios. Si no la encuentra, usa el segundo
aproximado y lo anota en `avisos`.

```jsonc
{
  "fixes": { "AIAC": "AI Act", "ESIA": "AESIA" },       // correcciones de la transcripción (palabra o frase)
  "cortes": [                                          // tramos a ELIMINAR (tomas falsas, charla fuera de guion)
    { "desde": 0, "hasta": 5.85 },
    { "desdeCue": [1720, "hay una serie de reglas"], "hastaCue": [1821, "y para terminar vamos"] }
  ],
  "intro":  { "kicker": "Resiliencia operativa digital", "titulo": "DORA en la práctica",
              "subtitulo": "Tres casos reales…", "objeto3d": "escudo", "duracion": 8 },
  "capitulos": [
    { "cue": [50.0, "en la unión europea"], "n": 1, "titulo": "El proveedor que ya conocemos",
      "kicker": "Caso 1", "subtitulo": "Contratar un SaaS…", "acento": 0, "objeto3d": null }
  ],
  "eventos": [
    { "tipo": "panel", "kind": "lista", "cue": [117, "hay diferentes roles"], "hasta": [162.5, "hay una cuestión"],
      "lado": "der", "kicker": "Roles", "titulo": "Quién es quién",
      "items": [ { "cue": [120, "el proveedor"], "texto": "Proveedor", "detalle": "…", "icono": "edificio" } ] },
    { "tipo": "pop", "cue": [486, "revisar es contrastar"], "texto": "Revisar es contrastar,", "sub": "no releer", "grande": true },
    { "tipo": "escena3d", "objeto": "cadena", "cue": [213, "si se cae"], "hasta": [231, "la pregunta"],
      "lado": "izq", "kicker": "Concentración", "titulo": "Si se cae, se cae todo",
      "etiquetas": [ { "cue": [214, "el banco"], "texto": "Banco" } ] },
    { "tipo": "gesto3d", "objeto": "orbe", "cue": [300, "todo encaja"], "texto": "Todo encaja" }
  ],
  "outro": { "kicker": "En resumen", "titulo": "…", "puntos": ["…", "…"], "cta": "…", "objeto3d": "escudo" }
}
```

**Tipos de panel (`kind`)** y sus campos propios (además de `kicker`, `titulo`, `lado`, `cue`, `hasta`):

| kind | Campos |
|---|---|
| `lista` · `pasos` · `checklist` | `items[{cue?, texto, detalle?, icono?, tono?}]` |
| `comparativa` | `izq` / `der`: `{cue?, titulo, items[], tono: ok\|bad\|neutro}` |
| `opciones` | `opciones[{letra, texto}]`, `foco?{cue, letra, veredicto: correcta\|riesgo\|trampa}` |
| `cifra` | `valor` (número), `unidad?`, `etiqueta`, `valorInicial?` (arranque del contador; `desde` se acepta por compatibilidad) |
| `cita` · `clave` | `texto`, `resalta[]` (palabras a subrayar) |
| `linea` | `hitos[{cue, etiqueta, texto}]` |
| `mapa` | `centro`, `nodos[{cue?, texto}]` |
| `tarjeta` | `texto`, `icono?` |
| `caso` | `texto`, `veredicto{cue, texto, tono}` |

`tono`: `ok | bad | neutro | aviso`. `icono`: nombre del catálogo de iconos del motor. `lado`: `izq | der | centro`
(el panel va en ese lado y el ponente en el contrario). **Objetos 3D** (`objeto3d`, `escena3d.objeto`,
`gesto3d.objeto`): nombre del catálogo 3D del motor (`escudo`, `contrato`, `registro`, `cadena`, `balanza`, `salida`,
`orbe`, `piramide`, `estrellas-ue`, `reloj`, `grafica`, `candado`, `engranajes`, `bombilla`, `documento`…).

**Reglas editoriales:** los gráficos resumen **lo que dice la voz**; no se inventan datos, opciones ni decisiones que el
guion no da. Nada de nombres reales de personas ni datos personales. Las incoherencias del material se señalan en
`informe.md`, no se ocultan.

## 3. `timeline.json` (generado; fotogramas de salida)

```jsonc
{
  "version": 1,
  "fps": 25, "ancho": 1920, "alto": 1080, "duracion": 19599,            // duración en fotogramas
  "fuente": { "ancho": 3840, "alto": 2160, "fps": 25, "duracion": 2042.7 },
  "recorte": true,                                                       // hay máscara + plancha
  "plancha": { "x": 768, "y": 0, "ancho": 2400, "alto": 2160, "escala": 0.75 },   // región de la fuente → plancha
  "segmentos": [ { "dst": 0, "src": 12.34, "dur": 145 } ],               // EDL: dst y dur en fotogramas; src en s de fuente
  "planos": [
    { "desde": 0, "hasta": 120, "tipo": "medium", "forzado": false,
      "s": 0.76, "tx": 960, "ty": 372,                                   // escala sobre la fuente; posición en pantalla de la nariz
      "nariz": [1920, 700],                                              // mediana de la nariz en el plano (px de fuente)
      "zoom": [1.0, 1.03] }                                              // acercamiento lento dentro del plano
  ],
  "capitulos": [ { "desde": 250, "hasta": 3900, "rotuloHasta": 335, "n": 1, "titulo": "…", "kicker": "…",
                   "subtitulo": "…", "acento": 0, "objeto3d": null } ],
  "eventos": [ { "id": "e07", "tipo": "panel", "kind": "lista", "desde": 500, "hasta": 900, "lado": "der",
                 "kicker": "…", "titulo": "…", "items": [ { "en": 520, "texto": "…" } ] } ],
  "subtitulos": [ { "desde": 10, "hasta": 60, "palabras": [ { "t": "hola", "desde": 10, "hasta": 18 } ] } ],
  "gestos": [ { "desde": 800, "pico": 815, "hasta": 840,
                "munecas": [[1500, 1300], [2400, 1310]] } ],             // px de fuente en el pico
  "intro":  { "desde": 0, "hasta": 200, "...": "campos del guion" },
  "outro":  { "desde": 19300, "hasta": 19599, "...": "campos del guion" },
  "avisos": [ "cue no encontrado: [486, \"revisar es contrastar\"]" ]
}
```

Tipos de plano: `wide`, `medium`, `close`, `sideL`, `sideR`, `popL`, `card` (valores de referencia en
`docs/METODO_EDICION_IA.md` §7.3). Reglas que garantiza el generador: nunca dos eventos a la vez (≥ 6 fotogramas entre
ellos); ningún evento dentro de un rótulo de capítulo; planos ≥ 1,2 s; cada corte coincide con un cambio de plano; los
planos forzados no los toca ninguna regla posterior; el borde inferior de la fuente nunca se ve.

## 4. Props del motor (pequeñas)

El texto de la transcripción no va en el site público: viaja en `timeline.json`, que en Lambda es un objeto **privado**.

```jsonc
{
  "timelineSrc": "timeline.json",                 // local: archivo en --public-dir; Lambda: URL prefirmada
  "estilo": "curso-azul",                          // carpeta de estilos/ (sus tokens y fuentes van en el site)
  "media": {
    "mezzanine": "mezzanine.mp4",                  // vídeo corregido completo (1080p) — siempre
    "plancha": "plancha.mp4",                      // ponente premultiplicado (solo si recorte)
    "mascara": "mascara.mp4",                      // máscara en gris (solo si recorte)
    "extras": { "ilustracion-1": "extras/ilustracion-1.jpg" }
  }
}
```

### Extensiones admitidas (opcionales, compatibles hacia atrás)

| Campo | Dónde | Para qué |
|---|---|---|
| `valorInicial`, `decimales` | evento `cifra` | Arranque y decimales del contador (`desde` en el guion se traduce a `valorInicial`) |
| `plancha.mascara: "fuente" \| "plancha"` | `timeline.json` | Geometría del vídeo de máscara (`tools recortar` la da a fuente completa) |
| `plancha.curva` | `timeline.json` | Curva de contraste aplicada a la máscara |
| `gestos[].pista[]` | `timeline.json` | Trayectoria de las muñecas antes del pico |
| evento `ilustracion` | `guion.json` / `timeline.json` | Ilustración 2,5D a pantalla completa (`imagen` y `profundidad` son claves de `media.extras`) |
| `media.audio` | props | Solo el audio del mezzanine: con recorte basta con él y en Lambda no se sube el mezzanine entero. En narración (§8), la locución; `media.mezzanine` es entonces opcional |
| `color.sobreAcento`, `color.tinta`, `fondo.grano` (0–1) | `tokens.json` | Texto sobre el acento, color de trazo/tinta e intensidad del grano de película |
| `subtitulos.palabraActiva: "acento"` | `tokens.json` | La palabra activa se pinta en el **acento del capítulo** (`color.capitulos[n]`); `"subrayado"` la subraya |

Composiciones del motor: `Horizontal` (1920×1080) y, más adelante, `Vertical` (1080×1920) con la misma línea de
tiempo. Duración y fps salen de `timeline.json` en `calculateMetadata`.

## 5. `estilos/<estilo>/tokens.json`

`estilo.md` es la guía para personas y para HyperFrames (formato `frame.md`: paleta, tipografía, componentes,
movimiento, audio, qué sí y qué no). `tokens.json` es lo mismo en datos, para el motor:

```jsonc
{
  "nombre": "curso-azul",
  "descripcion": "Curso corporativo azul marino y blanco",
  "modo": "oscuro",                                   // oscuro | claro
  "color": {
    "fondo": "#071631", "superficie": "#0D2552", "superficie2": "#13306A", "linea": "#1F3F7A",
    "texto": "#F3F7FF", "textoSuave": "#A8BCE3", "acento": "#4C8DFF",
    "ok": "#3DDC97", "aviso": "#FFB547", "error": "#FF6B6B",
    "capitulos": ["#4C8DFF", "#8B7CFF", "#2EC5CE", "#FFB547"]   // acento por capítulo (índice = capitulo.acento)
  },
  "tipografia": {
    "titular":  { "familia": "Montserrat", "peso": 900, "tracking": "-0.02em", "interlineado": 1.05 },
    "cuerpo":   { "familia": "Montserrat", "peso": 400, "interlineado": 1.35 },
    "etiqueta": { "familia": "Montserrat", "peso": 700, "tracking": "0.24em", "mayusculas": true },
    "mono":     { "familia": "JetBrains Mono", "peso": 400 },
    "archivos": [ { "familia": "Montserrat", "peso": 900, "estilo": "normal", "archivo": "fonts/montserrat-latin-900-normal.woff2" } ]
  },
  "forma": { "radio": 24, "radioPildora": 999, "borde": 2, "sombra": "0 30px 80px rgba(0,0,0,0.45)" },
  "fondo": { "tipo": "radial", "detalle": "resplandor del acento arriba a la derecha" },   // liso | radial | rejilla | papel | cristal
  "paneles": { "estilo": "cristal" },                  // solido | cristal | papel | tinta
  "ponente": { "marco": "redondeado", "borde": true },  // cuando no hay recorte
  "subtitulos": { "estilo": "caja", "palabraActiva": "acento" },   // caja | contorno | limpio
  "movimiento": { "energia": "media", "entrada": "power3Out", "duracionEntrada": 0.6,
                  "transicion": "empuje" },            // empuje | fundido | bloques | barrido | zoom
  "tres": { "material": "estandar", "contornoTinta": false, "rampa": 3 },   // estandar | toon
  "audio": { "musica": "ninguna", "sfx": "suaves" },
  "licencias": "Todas las fuentes son OFL; ver fonts/*.txt"
}
```

Las rutas de `archivos` son relativas a la carpeta del estilo. El motor copia `estilos/*` a `motor/public/estilos/`
(`npm run estilos` en `motor/`), así que fuentes y tokens van en el site y no se descargan al renderizar.

## 6. Lambda (render siempre en Lambda)

- Función: la de `proyecto.json › lambda.funcion` (arm64, 3008 MB, 10 GB de disco, 900 s). Site: `motor-<hash>` (se
  vuelve a subir solo si cambia el motor o los estilos).
- **Entradas privadas:** `timeline.json`, mezzanine, plancha, máscara y extras se suben al **bucket privado** de
  kaleidos (nombre en `aws/recursos.json`, bloqueo de acceso público, caducidad de 3 días) y se entregan con URLs
  prefirmadas de corta duración. **Nunca** al bucket `remotionlambda-*`, que es de lectura pública.
- El render usa `--disable-web-security` (lectura entre dominios sin CORS) y `--privacy=private`.
- La salida de Remotion cae en `renders/<id>/` del bucket `remotionlambda-*` (legible con la URL exacta): se descarga a
  `resultados/<slug>.mp4` y se borra salvo `conservarSalida: true`.
- Si la CLI corta al final (`ECONNRESET`), se recupera con `getRenderProgress` y descarga directa desde S3.
- El informe recoge tiempo y coste reales (`getRenderProgress().costs`) más S3 y transferencia.
- **Nada en AWS sin confirmación explícita del usuario** (coste estimado antes de lanzar).

---

## 7. Escenario, registros y componentes «show» (estilo `milikito` y siguientes)

Extensiones **opcionales** y compatibles hacia atrás. Si un proyecto no las usa, el motor se comporta como antes.

### 7.1 Tokens (`tokens.json`)

```jsonc
{
  "fondo": { "tipo": "rayos",                       // nuevo valor: rayos cónicos desde el centro
             "rayos": { "colores": ["#2940DD", "#080CDC"], "vineta": "#040E90", "giro": 2, "destellos": 8 } },
  "tipografia": { "titular": { "tratamiento": "juego" } },   // "plano" (defecto) | "juego": degradado + doble contorno + sombra + brillo
  "escenario": {                                    // activa el modo escenario de webinar
    "activo": true,
    "lienzo": "#102424", "patron": true,             // cuadraditos a 45° en las esquinas
    "caja": { "radio": 20, "sombra": "0 18px 48px rgba(0,0,0,.45)" },
    "camara": { "fondo": "#9CE5DF", "fondo2": "#7FDCD6" }    // fondo de la caja del ponente (con recorte) o marco
  },
  "hud": { "estilo": "fichas" },                    // "barra" (defecto) | "fichas": acrónimo/números de capítulo
  "registros": {                                     // pieles de la caja de diapositiva
    "show":      { "fondo": "rayos", "titular": "juego" },
    "editorial": { "fondo": "#041839", "familiaTitular": "Barlow Condensed", "familiaCuerpo": "Barlow Semi Condensed", "oro": "#D1A54B", "anillos": true, "mayusculas": true },   // mayusculas: false → titulares editoriales tal cual (defecto true)
    "lamina":    { "zoom": [1.0, 1.06] }
  }
}
```

### 7.2 Proyecto (`proyecto.json`)

`"escenario": true` activa el modo escenario (el ponente va en su caja y los gráficos en la caja de diapositiva).

### 7.3 Guion y timeline: campos y eventos nuevos

- Todo evento de panel admite `registro: "show" | "editorial" | "lamina"` (piel de la caja de diapositiva) y
  `disposicion: "dos-cajas" | "grande" | "solo" | "completa" | "dividida"` (si falta, la decide el motor:
  `titulo` y `lamina` → `grande`; paneles → `dos-cajas`; sin evento → `solo`).
- `capitulos[].sigla`: letra o número corto de la ficha del HUD (p. ej. `"1"`, `"R"`); `capitulos[].registro`.
- **`titulo`** (titular de juego): `{ "tipo": "titulo", "cue", "hasta", "antetitulo": "Caso 1", "texto": "Proveedor", "subtitulo": "…", "registro": "show", "destellos": true }`.
- **`lamina`** (ilustración o captura a toda la caja): `{ "tipo": "lamina", "cue", "hasta", "imagen": "<clave de media.extras>", "zoom": [1, 1.06], "pie"?: "fuente o texto corto", "bocadillos": [ { "cue", "texto", "x": 0.62, "y": 0.18, "forma": "globo" | "nube" | "grito", "cola": "izq" | "der" | "abajo" } ] }`.
- **`bocadillo`** suelto junto al ponente: `{ "tipo": "bocadillo", "cue", "hasta", "texto", "forma", "lado": "izq" | "der" }`.
- **`reaccion`**: `{ "tipo": "reaccion", "cue", "icono": "pregunta" | "idea" | "rayo" | "ok" | "alerta" | "corazon" | "reloj" }`. Dura ~1,4 s
  junto al ponente y **puede solaparse** con otros eventos (única excepción a la regla de no solapar).
- **`sello`**: `{ "tipo": "sello", "cue", "hasta", "texto": "EUREKA", "tono": "ok" | "bad" | "aviso" }`.
- Objetos 3D nuevos: `trofeo`, `llave`, `escalera`, `letras` (con `texto`, p. ej. `{ "objeto": "letras", "texto": "DORA" }`).
- `intro.estilo: "marca"`: `{ "estilo": "marca", "palabras": ["MASTER", "CLASS"], "etiquetas": ["En directo", "Nº 1"], "lema": "Fórmate con nuestros expertos", "rotulo": { "nombre": "…", "cargo": "…" }, "franja": { "titulo": "…", "subtitulo": "…", "firma": "Una formación de OpenWebinars" } }`. Con nombres **genéricos** (sin personas reales) salvo que el usuario los dé.

En `timeline.json` todos llevan `desde`/`hasta` en fotogramas y los bocadillos o elementos internos `en`. El generador
añade además:

```jsonc
"disposiciones": [ { "desde": 0, "hasta": 300, "tipo": "solo" }, { "desde": 300, "hasta": 900, "tipo": "dos-cajas" } ],
"audio": {
  "musica": [ { "archivo": "<clave de media.extras>", "desde": 0, "hasta": 540, "volumen": 0.9, "fundidoEntrada": 12, "fundidoSalida": 25, "bucle": false } ],
  "sfx":    [ { "archivo": "<clave de media.extras>", "en": 812, "volumen": 0.7 } ]
}
```

La música de fondo va a un volumen bajo constante bajo la voz (≈ −28 LUFS), salvo en apertura y cierre. Los efectos
(`sfx`) los genera `tools linea` a partir de los eventos (`titulo` → destello, `bocadillo`/`reaccion` → pop,
cambio de disposición → whoosh, `sello` → golpe), según `proyecto.json › audio.sfx` (tipo de evento → clave de
media.extras).

---

## 8. Modo narración (vídeo sin ponente, voz de TTS)

Para piezas sin bruto ni ponente (noticias, explainers) con una **locución** (p. ej. ElevenLabs). Todo lo demás es
igual que en §3 y §7: timeline en fotogramas, subtítulos por palabra (del whisper de la locución), eventos del §7,
música y efectos. Siempre se pinta en **modo escenario** (§7).

### 8.1 `timeline.json`

```jsonc
{
  "version": 1, "fps": 25, "ancho": 1920, "alto": 1080, "duracion": 5250,
  "narracion": true,                 // activa el modo (implica escenario; `escenario: false` es un error)
  "recorte": false,                  // obligatorio false; sin `plancha`
  "segmentos": [],                   // opcional: EDL sobre la locución (`src` en s del audio); vacía = entera desde f0
  "capitulos": [ ... ], "eventos": [ ... ], "subtitulos": [ ... ], "audio": { "musica": [ ... ], "sfx": [ ... ] },
  "disposiciones": [ { "desde": 0, "hasta": 150, "tipo": "completa" }, { "desde": 150, "hasta": 900, "tipo": "voz" } ]
}
```

- `fuente`, `planos` y `gestos` sobran (si faltan, el motor pone un plano neutro: ninguna consulta de cámara falla).
- **Disposiciones válidas:** solo `completa` (la diapositiva ocupa todo el lienzo) y `voz` (diapositiva grande, como
  `grande`, más la **caja de voz** en el sitio del recuadro del ponente: fondo de cámara del estilo, onda de voz que
  sigue a la locución y la etiqueta «Narración» con la tipografía de etiqueta del estilo). En `eventos[].disposicion`
  y en `disposiciones[]`, cualquier otra es un error del contrato. Si falta la pista, todo es `voz` salvo los eventos
  con `disposicion: "completa"` (los rótulos de capítulo van en `voz`; una intro que no sea de marca, en `completa`).
- **`gesto3d` no vale** (no hay manos): error legible; usa `escena3d` con el mismo objeto. `escena3d`, `lamina`,
  `titulo`, `sello`, `pop`, paneles, fichas, rótulos, intro/outro (también `estilo: "marca"`, con la onda en la píldora
  en lugar de la foto) funcionan igual.
- `bocadillo` y `reaccion` se anclan a la caja de voz en `voz` y a la esquina inferior derecha de la diapositiva en
  `completa`.

### 8.2 Props y Lambda

- `media.audio` = la locución (`narracion.m4a`), **obligatoria**; `media.mezzanine` pasa a ser **opcional** (sin él no
  se monta ninguna capa de vídeo). Sin narración, `mezzanine` sigue siendo obligatorio (el motor para con un error).
- Entradas privadas (§6): `timeline.json`, `narracion.m4a` como `audio` y los extras que referencia el timeline. Ni
  mezzanine, ni plancha, ni máscara.
- `proyecto.json › lambda.concurrencia: "max"` (o `lambda.mjs --concurrencia max`): `framesPerLambda` para usar el
  máximo de funciones por render de Remotion (200 en 4.0.529, con un mínimo de 5 fotogramas por función). También un
  número de funciones (`"concurrencia": 120`).

### 8.3 Entradas del pipeline en narración (`proyecto.json`, `locucion.json`, `guion.json`)

- `proyecto.json` (lo escribe `tools/kaleidos nuevo <slug> --narracion [--escenario]`): `"narracion": true`,
  `ponente.recorte: false`, `escenario: true`, sin `bruto`; `audio` con la música y los efectos del estilo (base a
  −24 LUFS medidos, más alta que bajo una voz real).
- `locucion.json` (lo escribe quien guioniza; lo lee `tools/kaleidos voz`):

```jsonc
{
  "voz": { "id": "…", "modelo": "eleven_v4", "ajustes": { } },  // todo opcional: por defecto ELEVENLABS_VOICE_ID / ELEVENLABS_MODEL_ID (.env)
  "pausaEntreBloques": 0.35,                                      // s de silencio entre bloques
  "bloques": [ { "id": "b01", "texto": "…", "pausaDespues": 0.7 } ]  // pausaDespues opcional (cambio de bloque/capítulo)
}
```

  Cada bloque se genera por separado (4 a la vez, `previous_text`/`next_text` para entonación continua) con caché por
  hash de texto, voz, modelo y ajustes: cambiar un bloque solo regenera ese. Los números, siglas y versiones se escriben
  **como se pronuncian** («GPT seis punto uno Sol») y se corrigen en pantalla con `guion.json › fixes`.
- Salidas de `voz`: `work/voz/<id>.mp3`, `media/narracion.m4a` (−16 LUFS / −1,5 dBTP) y `work/voz/manifest.json`
  (`bloques[]` con `inicio`/`fin`/`duracion` en s, `caracteres` de la ejecución y acumulados, `sonoridad`).
- `transcribir` sobre la locución deja `work/transcripcion.json` con `palabras[] {t, ini, fin, p, corregida?}` alineadas
  contra el texto de `locucion.json` (los subtítulos salen con la grafía del guion).
- `guion.json` en narración, diferencias con §2: sin `cortes` (se deja `[]`); los segundos de los cues son de la
  **locución**; `intro.previo` = segundos de música **antes** de la voz (normalmente solo esto: `intro.hasta` alarga la
  intro y se traga los primeros eventos); `outro.cue` = frase de la locución donde empieza el cierre y `outro.coda` =
  segundos de música **después** de la voz. Un evento que cae en los 3,4 s del rótulo de su capítulo se retrasa (si
  choca con el siguiente, `linea` da error): pon su cue más tarde o no dupliques el título del capítulo.
- Ejemplo completo: `proyectos/devday-2026` (`locucion.json`, `guion.json` generado por `work/guion/eventos.py`, que
  resuelve los cues contra `work/transcripcion.json`).
