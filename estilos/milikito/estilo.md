---
version: alpha
name: Milikito — Masterclass show (capa de vídeo)
description: >
  Masterclass en directo de OpenWebinars con alma de show de televisión. Escenario de webinar verde casi negro
  #102424 con cajas redondeadas (diapositiva + cámara del ponente sobre fondo menta #9CE5DF); diapositivas «show»
  azul eléctrico con rayos, destellos dorados de cuatro puntas y titulares de videojuego (Fredoka 700 con
  degradado oro→naranja, doble contorno y sombra); diapositivas editoriales azul marino #041839 con condensada
  Barlow y palabras clave en oro #F5C121; láminas de cómic con bocadillos; apertura de marca «MASTER CLASS» en
  verde azulado #1B575C. Esta guía conserva ese ADN y lo dinamiza con motion graphics que el original no tiene.
unit: el fotograma — 1920×1080 a 25–30 fps; 1080×1920 previsto (cajas apiladas)
principle: el show entra por el titular · una idea por diapositiva · algo se mueve cada 8–12 s · el oro solo para lo importante
source: brutos/milikito.mp4 (42:13, 1920×1080, ~30 fps VFR), análisis en proyectos/ref-milikito/work/estilo/ y work/analisis/

colors:
  fondo: "#102424"          # lienzo del escenario (verde casi negro)
  lienzo-patron: "#142928"  # cuadraditos girados 45° del lienzo, solo en las esquinas
  superficie: "#041839"     # diapositiva editorial (azul marino)
  superficie2: "#1322CF"    # diapositiva show (azul eléctrico, rayo medio)
  azul-rayo-claro: "#2940DD"
  azul-rayo: "#080CDC"
  azul-borde: "#040E90"     # viñeta de los rayos hacia los bordes
  linea: "#2B4A4A"          # filetes sobre el lienzo; en editorial usar #33405A
  linea-editorial: "#33405A"
  texto: "#F2F3F8"
  textoSuave: "#B4C8C6"
  acento: "#F5C121"         # oro: palabras clave, subrayados, destellos, iconos de línea
  oro-claro: "#FFE14A"      # arriba del degradado del titular de juego
  naranja: "#EE6D06"        # abajo del degradado del titular de juego
  oro-editorial: "#D1A54B"  # oro algo más apagado de las diapositivas azul marino
  tinta: "#06103E"          # contorno interior de los titulares de juego
  sobreAcento: "#1A1206"    # texto sobre oro
  menta: "#9CE5DF"          # fondo de la cámara del ponente (estudio)
  marca: "#1B575C"          # verde azulado de la apertura «MASTER CLASS»
  marca-oscuro: "#143939"   # «CLASS» y franjas de la apertura
  marca-bitono: "#BAD1D5"   # luces del bitono de las fotos de la apertura
  rotulo: "#132A2E"         # cajas del rótulo de nombre
  rotulo-cargo: "#2FA6B0"   # cargo en cursiva del rótulo
  ok: "#3DDC97"
  aviso: "#FF9A3C"
  error: "#FF6B6B"
  capitulos: ["#F5C121", "#FF9A3C", "#9CE5DF", "#8FB2FF"]   # oro, naranja, menta, azul cielo

typography:
  juego:       { fontFamily: "Fredoka", weight: 700, tracking: "-0.01em", lineHeight: 1.0, size: "160–260px", treatment: "degradado vertical oro-claro→naranja, contorno interior tinta 6–8px, contorno exterior blanco 6–8px, sombra 0 10px 0 rgba(0,0,0,.35), brillo interior arriba" }
  show-titular:{ fontFamily: "Nunito", weight: 900, lineHeight: 1.05, size: "64–96px", color: "texto", treatment: "sombra dura 0 4px 0 tinta" }
  show-dorado: { fontFamily: "Nunito", weight: 900, lineHeight: 1.08, size: "56–80px", treatment: "degradado oro-claro→acento, contorno tinta 4px, sombra" }
  show-antetitulo: { fontFamily: "Nunito", weight: 800, size: "56–72px", color: "texto", with: "subrayado dorado redondeado de 10px bajo el texto" }
  editorial-titular: { fontFamily: "Barlow Condensed", weight: 800, upper: true, tracking: "0.01em", lineHeight: 1.0, size: "72–120px", color: "texto (palabras clave en oro-editorial)" }
  editorial-cuerpo:  { fontFamily: "Barlow Semi Condensed", weight: 400, lineHeight: 1.35, size: "30–40px", color: "texto (fragmentos clave en oro-editorial, peso 500)" }
  editorial-cabecera: { fontFamily: "Barlow Condensed", weight: 700, upper: true, tracking: "0.04em", size: "18–22px", pattern: "SIGLA. descripción — y filete fino debajo" }
  marca-display: { fontFamily: "Inter", weight: 300, tracking: "-0.01em", lineHeight: 0.9, size: "220–300px", color: "texto; segunda palabra en marca-oscuro" }
  marca-titulo:  { fontFamily: "Inter", weight: 700, style: "italic", size: "40–56px", note: "el título del curso en cursiva negrita + subtítulo Inter 400" }
  rotulo:        { fontFamily: "Inter", weight: 400, size: "34px nombre · 28px cargo (Inter 700 italic, rotulo-cargo)" }
  bocadillo:     { fontFamily: "Comic Neue", weight: 700, size: "36–48px", color: "#1E1E1E" }
  mono:          { fontFamily: "JetBrains Mono", weight: 400, size: "20–24px", use: "contadores, números de episodio, códigos" }

radii:
  caja: "20px"            # diapositiva y cámara del escenario (medido ≈ 18–20 px a 1080p)
  rotulo: "12px"
  ficha: "18px"
  subrayado: "999px"
  pildora: "999px"

spacing:
  escenario-dos-cajas: "diapositiva x 64–1117 · cámara x 1172–1849 · y 240–840 (600 px de alto) · hueco 55 px"
  escenario-grande: "diapositiva x 10–1555, y 105–980 · recuadro del ponente x 1495–1890, y 652–1040 (solapa la esquina)"
  escenario-solo: "cámara x 100–1815, y 50–1030"
  seguro: "64 px laterales en el escenario; 96 px dentro de las diapositivas"
  densidad: "1 idea por diapositiva; titular + máximo 3 líneas o 3 columnas"

motion:
  energy: alta
  easing: { entry: "back.out(1.6)", titulo-juego: "back.out(2.2) con rebote de escala 0→1,12→1", exit: "power2.in", push: "power3.inOut", ambient: "sine.inOut" }
  duration: { entrance: 0.45, stagger: 0.06, push: 0.6, titulo-juego: 0.7, hold-min: 8, cambio-visual-max: 12 }
  atmosphere: [rayos-girando-2°/s, destellos-parpadeando, deriva-lenta-1-3%, lienzo-quieto]
  transition: zoom-punch (primaria) · barrido-de-rayos (capítulos) · empuje de marca (apertura y cierre)

components:
  escenario:
    description: "Lienzo #102424 con patrón de cuadraditos a 45° en las esquinas; las cajas (diapositiva y cámara) redondeadas 20px, sin borde, sombra suave; disposiciones: dos-cajas, diapositiva-grande+recuadro, solo-cámara, dividida (dos cámaras), pantalla completa"
  camara-menta:
    description: "Ponente de cintura para arriba sobre fondo menta liso #9CE5DF (degradado muy suave a #7FDCD6 abajo); micro de solapa visible; luz frontal blanda"
  diapo-show:
    backgroundColor: "{colors.superficie2}"
    description: "Rayos azul eléctrico desde el centro (alternando #2940DD / #080CDC, viñeta #040E90), destellos dorados de cuatro puntas con halo y polvo de puntos; titular blanco Nunito 900 + bloque dorado con contorno; o titular de juego Fredoka gigante"
  titulo-juego:
    description: "El sello del estilo: palabra-concepto enorme (Fredoka 700) con degradado oro-claro→naranja, contorno interior tinta, contorno exterior blanco, sombra dura y brillo; antetítulo «El método» con subrayado dorado; subtítulo blanco"
  diapo-editorial:
    backgroundColor: "{colors.superficie}"
    description: "Azul marino con cabecera «SIGLA. DESCRIPCIÓN» + filete, anillos concéntricos tipo radar (#0C2A5C) en una esquina, titulares condensados en mayúsculas con palabras en oro, iconos de línea dorados dentro de círculo, subrayados dorados cortos, columnas separadas por filetes verticales"
  lamina-comic:
    description: "Ilustración de cómic a toda la caja (tinta gruesa, color cálido saturado, iluminación dramática) con bocadillo o nube de pensamiento blanca de contorno negro y texto Comic Neue 700"
  imagen-metafora:
    description: "Fotografía realista a sangre (p. ej. el bloque de mármol en el taller del escultor) con acercamiento lento de 4–6 %; sin texto o con un titular corto"
  apertura-marca:
    description: "«MASTER CLASS» en Inter 300 gigante sobre #1B575C subiendo desde máscara, etiquetas pequeñas («En directo», nº de episodio en caja, flechas ⌄, aspas ×, «Fórmate con nuestros expertos»), logotipo de OpenWebinars; empuje a una píldora con la foto en bitono que se abre a tarjeta, rótulo de dos barras, pliegue a franja con el título en Inter 700 italic"
  rotulo-nombre:
    description: "Dos cajas #132A2E radio 12: cuadrada con icono de línea blanco + ancha con nombre (Inter 400 blanco) y cargo (Inter 700 italic #2FA6B0); entra deslizando desde la izquierda con 0,08 s de desfase"
---

# Milikito — Masterclass show — Frame

## Concepto (Overview)

Una clase en directo que se viste de programa de televisión. El **escenario** es sobrio (lienzo verde casi negro,
cajas redondeadas, el ponente sobre un menta luminoso) y el **contenido** es de concurso: rayos azul eléctrico,
destellos dorados y titulares de videojuego que anuncian cada paso del método como si fuera una fase de un juego.
Entre medias, dos registros más calmados: la **diapositiva editorial** azul marino (argumentos, ejemplos, reglas) y
las **láminas** (cómic con bocadillos o una foto metafórica a sangre). La apertura y el cierre llevan el **paquete de
marca MASTER CLASS** de OpenWebinars.

El original es estático fuera de la apertura (una diapositiva por minuto de media). Esta guía mantiene la identidad
y añade el movimiento que le falta: **algo cambia en pantalla cada 8–12 segundos**.

## El cuadro (The Frame)

Cinco disposiciones (proporción del tiempo en el original):

| Disposición | Geometría (1920×1080) | Uso | Original |
|---|---|---|---|
| **Dos cajas** | diapositiva x 64–1117 · cámara x 1172–1849 · y 240–840 | explicación con apoyo visual | 40 % |
| **Diapositiva grande + recuadro** | diapositiva x 10–1555, y 105–980 · ponente x 1495–1890, y 652–1040 solapando la esquina | método, conceptos, reglas | 25 % |
| **Solo cámara** | cámara x 100–1815, y 50–1030 | preguntas en directo, conversación | 28 % |
| **Pantalla completa** | ponente sobre menta o imagen a sangre | bienvenida, cierre, metáforas | 6 % |
| **Dividida** | dos cámaras con la geometría de dos cajas | cambio de cámara, directo | 1 % |

- Todo centrado en vertical, con margen lateral de 64 px; nunca pegado al borde.
- El ponente mira a cámara, de cintura para arriba, centrado en su caja; en el recuadro pequeño, plano medio.
- Una idea por diapositiva. En «show»: titular + como mucho un bloque dorado de 3 líneas. En editorial: titular
  condensado + 1–3 columnas.

## Colores (Colors)

- **Lienzo** `#102424` en todo el escenario, con el patrón `#142928` apenas visible en las esquinas.
- **Show**: rayos `#2940DD` / `#080CDC` con viñeta `#040E90`; oro `#F5C121`→naranja `#EE6D06` en los titulares de
  juego; tinta `#06103E` en contornos.
- **Editorial**: azul marino `#041839`, texto `#F2F3F8`, oro editorial `#D1A54B` solo en palabras clave, subrayados e
  iconos.
- **Cámara**: menta `#9CE5DF`. **Marca**: verde azulado `#1B575C` / `#143939` / bitono `#BAD1D5`.
- Acento por capítulo (paso del método): oro, naranja, menta, azul cielo. El oro es la voz del estilo: si todo es
  oro, nada lo es.

## Tipografía (Typography)

Tipografías del original identificadas a ojo y sustituidas por sus equivalentes **OFL** (todas en `fonts/`):

| Uso | En el original | Aquí (OFL) |
|---|---|---|
| Titular de juego («Revelación», «Actuación») | redondeada muy gruesa de logotipo | **Fredoka 700** |
| Titulares y bloques dorados de las diapositivas show | sans redondeada negra | **Nunito 900 / 800** |
| Titulares editoriales en mayúsculas | condensada gruesa de curvas cuadradas | **Barlow Condensed 800 / 700** |
| Texto editorial | condensada regular | **Barlow Semi Condensed 400 / 500** |
| «MASTER CLASS», rótulos y títulos de la marca | grotesca ligera / cursiva negrita | **Inter 300 / 400 / 700 italic** |
| Bocadillos de cómic | letra de cómic | **Comic Neue 700** |
| Contadores y números | — | **JetBrains Mono 400** |

Escala de vídeo: titular de juego 160–260 px; titulares 64–120 px; texto 30–40 px; etiquetas 18–26 px.

## Fondo y superficies (Depth & Surface)

- **Lienzo**: plano, sin degradados; el patrón de cuadraditos no se mueve (es el ancla del escenario).
- **Cajas**: radio 20 px, sin borde, sombra `0 18px 48px rgba(0,0,0,.45)`.
- **Show**: los rayos giran despacio (2°/s) y respiran (escala 1,00↔1,03 en 6 s); los destellos parpadean.
- **Editorial**: los anillos radar laten muy suave (opacidad 60↔100 % en 4 s).
- **Menta**: plano; si hay recorte del ponente, el menta pasa a ser el fondo de su caja o se sustituye por los rayos.

## Componentes (Components)

Los del original (frontmatter › `components`) y **los nuevos para dinamizarlo**:

| Componente nuevo | Qué hace | Cuándo | En el motor |
|---|---|---|---|
| **Titular de juego animado** | la palabra entra con escala 0→1,12→1 (`back.out(2.2)`, 0,7 s), destello que la recorre en diagonal y 4–6 destellos que estallan alrededor | cada paso del método o concepto clave | `pop` + tratamiento «juego» (**nuevo**) |
| **Barra del método** | acróstico persistente arriba (T · R · A · M · A): el paso actual en su color y con brillo, los vistos en oro apagado, los pendientes en contorno | toda la parte del método | HUD de capítulos (existe) con aspecto de fichas (**nuevo**) |
| **Acróstico de repaso** | las iniciales caen una a una con rebote y completan su palabra (máquina de escribir) | resumen del método | `pasos` con inicial destacada (**nuevo**) |
| **Bocadillo** | nube o globo que brota con escala y rebote desde la boca del personaje; texto letra a letra | láminas de cómic y citas del ponente | **nuevo** (evento `bocadillo`) |
| **Sello «EUREKA»** | sello dorado que golpea con rotación −12°, sacudida de 3 fotogramas y polvo | revelaciones, veredictos | `caso` con sello (existe) + estilo juego |
| **Contador de juego** | cifra en Fredoka con degradado dorado que sube con `power3.out` y termina con un destello | datos, tiempos, porcentajes | `cifra` (existe) |
| **Tarjetas editoriales en cascada** | columnas que entran de abajo con 0,1 s de desfase; el icono dorado se dibuja (trazo) y el subrayado crece desde el centro | ejemplos y comparativas | `lista` / `comparativa` (existen) |
| **Palabra clave que se enciende** | en editorial, la palabra pasa de blanco a oro con un subrayado que se barre | cuando el ponente la dice | `clave` / `cita` con `resalta` (existe) |
| **Rayos de transición** | los rayos giran rápido y cubren el cuadro (0,5 s) para cambiar de capítulo | entre pasos del método | transición `zoom` o `bloques` (existen) + rayos (**nuevo**) |
| **Punch-in del ponente** | acercamiento de 1,00→1,08 en su caja en las frases fuertes, vuelta suave | énfasis, preguntas al público | cámara virtual (existe) |
| **Reacciones** | iconos pequeños (❓, 💡, ⚡) que brotan junto al ponente cuando pregunta o cuando llega una idea | las ~2 preguntas por minuto del ponente | **nuevo** |
| **Subtítulos** | caja oscura redondeada, palabra activa en el oro del capítulo | toda la clase (el original no tiene) | subtítulos (existen) |
| **3D toon** | objetos con contorno de tinta y rampa de 3 tonos: bombilla («eureka»), trofeo, llave, escalera de 5 peldaños, letras 3D doradas | un objeto por capítulo como mucho | catálogo 3D toon (existe; trofeo, llave, escalera y letras: **nuevos**) |

Regla de densidad nueva: **ninguna diapositiva quieta más de 12 s**. Si el ponente sigue con la misma idea, algo
evoluciona: aparece el siguiente elemento, se enciende una palabra, entra un destello, un punch-in o una reacción.

## Movimiento (Motion)

**Lo que hace el original (medido):**
- Cuerpo casi estático: 30 diapositivas en 27 min (**mediana 38 s en pantalla**, p90 96 s, máx. 5 min), cortes secos
  entre disposiciones, sin animación dentro de las diapositivas.
- Apertura de marca muy animada: «MASTER» sube desde máscara (~0,6 s, frenada suave) → pausa con deriva lenta →
  empuje lateral de la tarjeta mientras una píldora con la foto se abre a tarjeta (~1 s) → rótulo de dos barras →
  pliegue a franja con el título → montaje de retratos a 28 cortes/min con voz en off.

**Lo que hace esta guía:**
- Entradas 0,45 s con `back.out(1.6)` (juego) o `power3.out` (editorial); desfase 0,06 s; salidas 0,3 s.
- Titular de juego: 0,7 s con rebote; destello diagonal 0,4 s después.
- Ambiente: rayos girando, destellos, deriva lenta de 1–3 % en láminas y fotos.
- Energía alta en el show, media en editorial, baja en preguntas en directo (el ponente manda).

## Transiciones (Transitions)

- **Primaria**: zoom-punch corto (0,35 s) entre diapositivas del mismo capítulo.
- **Capítulo / paso del método**: barrido de rayos (0,5 s) + titular de juego.
- **Apertura y cierre**: el lenguaje de la marca (subida desde máscara, empuje, píldora que se abre, pliegue a franja).
- Cambios de disposición: corte seco coincidiendo con un final de frase (como el original), nunca a mitad de palabra.

## Subtítulos (Captions)

El original no lleva. Aquí: caja oscura `rgba(16,36,36,.88)` radio 18 px, Nunito 800 44 px, palabra activa en el oro
del capítulo, máximo 2 líneas y 34 caracteres por línea, centrados abajo con 64 px de margen. En «dos cajas», debajo
de las cajas (y ≈ 900).

## 3D

Toon con contorno de tinta (`#06103E`) y rampa de 3 tonos, luz cálida, colores del estilo (oro, naranja, azul
eléctrico, menta). Un objeto por capítulo como mucho, dentro de la diapositiva o anclado a las manos del ponente
cuando abre los brazos. Nada de 3D realista: aquí todo es juego.

## Audio

- Voz: el original va a −21,8 LUFS con un rango de 9 LU; objetivo −16 LUFS / −1,5 dBTP.
- Sintonía enérgica de marca en apertura (los primeros ~18 s del original son música sin voz) y cierre.
- Efectos: destello en titulares dorados, whoosh en empujes y barridos, pop en bocadillos y fichas, golpe grave en
  revelaciones. Música de fondo opcional muy baja (≈ −28 LUFS bajo la voz) solo en tramos largos de diapositivas.

## Voz y narrativa (del análisis de la transcripción)

- Ritmo alto y constante: **175 palabras/min** en todas las secciones; el gancho, más lento (144) y en voz en off.
- Pocas pausas (17 de más de 1,5 s en 42 min), **84 preguntas al público** y un «¿vale?» de comprobación frecuente.
- Estructura: sintonía → gancho de contraste en voz en off sobre un montaje → bienvenida con el título → presentación
  personal → demostración práctica (comparar dos versiones de lo mismo) → método por pasos con nombre propio y
  acrónimo → regla de oro → preguntas en directo.
- Recursos visuales asociados: cada paso del método = titular de juego; cada argumento = diapositiva editorial; cada
  historia = lámina de cómic o foto metáfora.

## Qué sí y qué no (Do's and Don'ts)

### Sí (Do)

- Titular de juego solo para conceptos con nombre propio (pasos del método, la gran idea).
- Una idea por diapositiva y algo nuevo cada 8–12 s.
- Oro para lo importante; el resto en blanco.
- Láminas de cómic para historias y ejemplos; foto metáfora a sangre para el concepto central.
- Acrónimo del método visible mientras se explica.

### No (Don't)

- **Nada de marcas de agua del sistema** en las diapositivas (en el original se ve «Activar Windows»).
- Nada de diapositivas quietas durante minutos (en el original, una aguanta 5 min).
- No mezclar el registro show y el editorial en la misma diapositiva.
- No usar el oro sobre el menta ni texto dorado pequeño sobre los rayos (pierde legibilidad).
- No poner nombres reales ni datos personales en rótulos de ejemplo, láminas o gráficos.
- No usar fuentes no OFL (las del original se sustituyen por las de esta guía).

## Carga de fuentes (Font loading)

Copia `estilos/milikito/fonts/*.woff2` a `assets/fonts/` (o `node estilos/_esquema/fontface.mjs milikito --ruta
<carpeta>`):

```html
<style>
/* fuentes:inicio · generado con _esquema/fontface.mjs */
@font-face{font-family:"Fredoka";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/fredoka-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Fredoka";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/fredoka-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Fredoka";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/fredoka-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Fredoka";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/fredoka-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Nunito";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/nunito-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/nunito-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Nunito";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/nunito-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/nunito-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Nunito";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/nunito-latin-ext-900-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Nunito";font-style:normal;font-weight:900;font-display:block;src:url("assets/fonts/nunito-latin-900-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/barlow-condensed-latin-ext-600-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:600;font-display:block;src:url("assets/fonts/barlow-condensed-latin-600-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/barlow-condensed-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/barlow-condensed-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/barlow-condensed-latin-ext-800-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Barlow Condensed";font-style:normal;font-weight:800;font-display:block;src:url("assets/fonts/barlow-condensed-latin-800-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Barlow Semi Condensed";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/barlow-semi-condensed-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Barlow Semi Condensed";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/barlow-semi-condensed-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Barlow Semi Condensed";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/barlow-semi-condensed-latin-ext-500-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Barlow Semi Condensed";font-style:normal;font-weight:500;font-display:block;src:url("assets/fonts/barlow-semi-condensed-latin-500-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:300;font-display:block;src:url("assets/fonts/inter-latin-ext-300-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:300;font-display:block;src:url("assets/fonts/inter-latin-300-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/inter-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:italic;font-weight:700;font-display:block;src:url("assets/fonts/inter-latin-ext-700-italic.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:italic;font-weight:700;font-display:block;src:url("assets/fonts/inter-latin-700-italic.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/inter-latin-ext-700-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/inter-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Comic Neue";font-style:normal;font-weight:700;font-display:block;src:url("assets/fonts/comic-neue-latin-700-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-ext-400-normal.woff2")format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:400;font-display:block;src:url("assets/fonts/jetbrains-mono-latin-400-normal.woff2")format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* fuentes:fin */
</style>
```

## Tokens para el motor (Remotion)

`tokens.json` fija lo que el motor ya sabe pintar: lienzo `rejilla`, paneles `solido` (superficie azul marino,
superficie2 azul eléctrico), titular Fredoka, cuerpo Nunito, etiqueta Barlow Condensed, subtítulos `caja` con
`palabraActiva: "acento"`, entrada `backOut` 0,45 s, transición `zoom`, 3D `toon` con contorno. Los componentes
marcados **nuevo** en la tabla (tratamiento «juego» del titular, fondo de rayos con destellos, bocadillo, barra del
método con fichas, reacciones y los objetos 3D nuevos) necesitan implementarse en `motor/` antes de usarse en un
render; hasta entonces el motor aplica la versión más cercana que ya tiene.

## Autoauditoría antes de renderizar (Pre-Render Self-Audit)

- **Registro**: cada diapositiva es show, editorial o lámina; nunca una mezcla.
- **Oro**: solo en palabras clave, subrayados, destellos e iconos; contraste del texto ≥ 4,5:1.
- **Ritmo**: ningún tramo de más de 12 s sin un cambio visual; titulares de juego solo en conceptos con nombre.
- **Escenario**: geometría de la disposición respetada, cajas con radio 20 px, lienzo sin mover.
- **Limpieza**: sin marcas de agua, sin nombres reales ni datos personales, sin fuentes fuera de la guía.
- **Contenido**: cada gráfico resume lo que dice la voz.

## Referencias

`referencias/` (sin caras de personas reales ni nombres): 01 diapositiva show con titular de juego · 02 diapositiva
editorial · 03 apertura de marca · 04 escenario de dos cajas (muestrario con silueta) · 05 lámina de cómic con
bocadillo · 06 tablero de los motion graphics nuevos (muestrario).

Los muestrarios 04 y 06 son HTML en `muestrarios/` (`escenario.html`, `tablero.html`, `comun.css`): sirven de receta CSS
de los componentes nuevos (rayos cónicos, destellos de cuatro puntas, titular de juego en tres capas —contorno blanco,
contorno tinta y relleno en degradado con brillo—, fichas del método, bocadillo, sello). Se regeneran con
`NODE_PATH=~/videos-opus/node_modules node estilos/_esquema/captura.mjs estilos/milikito/muestrarios/<x>.html <salida.jpg>`.

## Análisis del original (resumen medido)

| Dato | Valor |
|---|---|
| Duración y formato | 42:13 · 1920×1080 · ~30 fps variable · H.264 1,8 Mb/s |
| Cortes de escena | 43 en todo el vídeo; 28/min en la apertura, ~1/min en el cuerpo |
| Diapositivas | 30 en 27 min · mediana 38 s · p25 23 s · p75 66 s · p90 96 s · máx. 298 s |
| Tiempo por disposición | dos cajas 40 % · diapositiva grande 25 % · solo cámara 28 % · pantalla completa 6 % · dividida 1 % |
| Registros de diapositiva | show azul 59 % · editorial 22 % · láminas e imágenes 15 % · diapositiva blanca 3 % (de los 1 638 s con diapositiva) |
| Sonido | −21,8 LUFS integrados, LRA 9,1 LU, pico −3,9 dBFS; 15 % de silencios; música solo en la apertura |
| Voz | 7 423 palabras · 175 pal/min · 84 preguntas · 17 pausas > 1,5 s |
| Defectos | marca de agua «Activar Windows» en las diapositivas; diapositiva de título 5 min en pantalla |

Datos en bruto: `proyectos/ref-milikito/work/estilo/estructura.json` y `eventos.json` (clasificación por segundo) y
`proyectos/ref-milikito/work/analisis/` (metadatos, escenas, movimiento, sonoridad).
