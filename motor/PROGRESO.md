# Progreso del motor (`motor/`)

Estado de trabajo para poder retomar si se interrumpe.

## Hecho
- [x] Proyecto con Remotion 4.0.529 exacto (29 paquetes), three 0.178.0, R3F 9.2.0, zod 4.5.4, TS estricto; `npm run lint` limpio
- [x] Contrato en zod (timeline, tokens alineado con `estilos/_esquema`, props) y `calculateMetadata` solo con metadatos
- [x] Composiciones `Horizontal` y `Vertical` (básica)
- [x] Tema desde tokens, fuentes con `@remotion/fonts` + unicode-range; `npm run estilos` (9 del catálogo + 2 de prueba)
- [x] Capas (fondo, recorte/marco, 3D detrás/delante, ilustración, paneles, subtítulos, HUD, outro, grano, sonido)
- [x] Cámara virtual (planos, zoom, transición lateral de 16 f, corte seco si coincide con un corte, borde inferior)
- [x] 12 kinds + pop + rótulo + intro + outro, 43 iconos, 5 transiciones; huecos tenues en listas/pasos
- [x] 3D: 15 objetos, estándar y toon + tinta, gesto3d (screenToWorld, congelado en el pico), Ilustración 2,5D
- [x] Fixtures `demo` (sintético) y `demo-v2` (máscara real); `dora-v2` real probado en solo lectura
- [x] Máscara «fuente» + curva §7.2 por defecto (como `tools recortar`), mezcla limitada a la plancha
- [x] Scripts `stills`, `render-local`, `medir`, `hojas.sh`, `lambda` (`--dry-run`, `crear-bucket-privado --dry-run`)
- [x] Calibración final (`out/calibracion.json`) y modelo de coste que reproduce DORA; README con cifras
- [x] Hojas finales regeneradas (`./scripts/hojas.sh`)

## Estilo milikito · modo escenario (§7 del contrato) — 2026-09-30
- [x] Contrato zod: `escenario`, `disposiciones`, `audio`, eventos `titulo`/`lamina`/`bocadillo`/`reaccion`/`sello`,
      `registro`/`disposicion` en eventos de caja, `capitulos[].sigla|registro`, intro/outro `estilo: "marca"`,
      `gesto3d.gesto` en línea; tokens §7.1 opcionales (`escenario`, `hud`, `registros`, `tratamiento`, `fondo.rayos`, `marca`)
- [x] Escenario: lienzo + patrón, cajas (dos-cajas, grande, solo, completa, dividida), pista derivada si falta,
      transición 0,5 s power3.inOut, cámara en la caja (nariz centrada, sin borde inferior), recorte y sin recorte
- [x] Registros show (rayos, viñeta, destellos), editorial (cabecera, anillos, Barlow, palabras que se encienden al
      decirlas, iconos en círculo) y lámina (imagen con zoom + bocadillos; papel de cómic para paneles)
- [x] Titular de juego (3 capas + brillo + destello diagonal + estallido) en `titulo`, rótulos, pop grande, cifra, sello
- [x] Bocadillos (globo/nube/grito), reacciones (7 iconos, ≤ 2 a la vez), fichas del método, sello, apertura y cierre de marca
- [x] 3D: `trofeo`, `llave`, `escalera`, `letras` (Droid Sans Bold typeface, con tildes); etiquetas siempre dentro del lienzo
- [x] Pista `timeline.audio` (música con fundidos/bucle y efectos) y `lambda.mjs` sube TODOS los extras referenciados
- [x] Arreglos dora-v2: «Banco» cortado en `cadena` y `cifra` vacía en f13000 (tiempos de un evento de 48 f)
- [x] `opciones` sin `foco` rompía (`tween` con inicio infinito) — salía en dora-milikito
- [x] Fixture `fixtures/milikito` + medidas swangle del escenario + modelo de coste con clases de escenario

### Pulir (anotado, no bloquea el render)
- [ ] Rótulo del `gesto3d` en el escenario: la pastilla cae sobre la cara cuando el objeto es alto (moverla bajo el objeto)
- [ ] Tratamiento «juego» FUERA del modo escenario (rótulo, pop, cifra e intro clásicos siguen planos) y en el outro clásico
- [ ] Vertical del escenario: geometría básica (cajas apiladas), revisada solo en una hoja; la apertura y el cierre de marca están maquetados a 1920×1080 y en vertical salen recortados
- [ ] `dividida` implementada pero no ejercitada en el fixture
- [ ] Apertura de marca: el fotograma a mitad del pliegue (≈ 6 s) es de transición; revisar a velocidad real
- [ ] `timeline-kinds.json` usa un tramo crudo de la fuente: al final la ponente sale de cuadro (no es del motor)
- [ ] Medidas del escenario con la máquina cargada (carga 7–10) y una sola toma: repetir con `--repeticiones 3`
- [ ] Tras el primer render real de dora-milikito, recalibrar F (el escenario no se había medido en Lambda)

## Modo narración (§8 del contrato) — 2026-09-30
- [x] Contrato: `narracion`, disposición `voz`, `media.mezzanine` opcional, `fuente`/`planos`/`segmentos` opcionales en narración (plano neutro), errores legibles (`gesto3d`, disposiciones, recorte, plancha, `voz` sin narración)
- [x] Caja de voz (menta + onda con `@remotion/media-utils` 4.0.529 + «Narración»), locución por `media.audio`, anclas de bocadillos y reacciones, bitono de marca con la onda
- [x] `lambda.mjs`: entradas de narración (timeline + narracion.m4a + extras), `--concurrencia max|N` / `lambda.concurrencia`; `coste.mjs` con fijo por función (arranque + primer fotograma + locución)
- [x] Fixture `fixtures/narracion`, stills (`narracion`, `narracion-anclas`), medidas swangle (voz 0,230 · completa 0,172), regresión de dora-milikito (79/81 idénticos; los 2 `mapa` cambiaron por Diapositivas.tsx de las 20:53, no por esto)

### Pulir (narración)
- [ ] Probar en Lambda que el Chromium de la capa decodifica AAC con `decodeAudioData` (si no, la onda cae al respaldo de subtítulos sin romper el render; se ve en los registros del render)
- [ ] Vertical de `voz` solo con geometría, sin hoja revisada
- [ ] Medidas con la máquina cargada (carga 11–13): repetir `--repeticiones 3` con la máquina tranquila
- [ ] Bocadillo suelto en `voz` con `lado: "der"`: queda pegado al borde derecho (sale sobre la caja de voz)

## Pendiente (fuera de este encargo o necesita confirmación)
- [ ] Crear el bucket privado y hacer el primer render real en Lambda (requiere confirmación del usuario)
- [ ] Recalibrar F con el coste real del primer render (queda en `informe.md`)
- [ ] Repetir `node scripts/medir.mjs --repeticiones 3` con la máquina tranquila
- [ ] Revisar a tamaño completo los 64 eventos de `dora-v2` cuando `tools` pueble `media/`

## Comandos para retomar
```bash
cd motor
npm install && npm run estilos && npm run lint
node fixtures/demo/generar.mjs --medios          # timelines + máscara/plancha sintéticas (≈1,5 min)
node fixtures/demo-v2/generar.mjs                # máscara real de dora-v2 (solo lee proyectos/dora-v2/work)
./scripts/hojas.sh                               # todas las hojas de verificación (≈3 min)
node scripts/medir.mjs --repeticiones 3          # calibración (≈15 min)
node scripts/lambda.mjs dora-v2 --dry-run

# Estilo milikito / modo escenario
npm run estilos                                  # incluye fixtures/estilos/milikito-escenario (hereda de milikito)
node fixtures/milikito/generar.mjs               # enlaces a dora-v2 y estilos/milikito/audio + lámina sintética + timelines
node scripts/stills.mjs milikito --at eventos --nombre milikito-escenario
node scripts/stills.mjs milikito --at eventos --timeline timeline-kinds.json --cols 8 --escala 0.4 --nombre milikito-kinds
node scripts/stills.mjs dora-milikito --at eventos --escala 0.35 --cols 9 --nombre dora-milikito
node scripts/medir.mjs --gl swangle --modos escenario,escenario-show,escenario-3d,escenario-lamina
node scripts/lambda.mjs dora-milikito --dry-run
```
