#!/usr/bin/env node
// Fixture `milikito` (88,8 s, modo escenario): una ventana de 80,8 s del proyecto real dora-v2 (su EDL, planos,
// subtítulos y gestos, en SOLO LECTURA) con todos los componentes «show» del estilo milikito encima:
// apertura de marca, fichas del método, rótulos con titular de juego, gesto3d con trofeo, escena3d con escalera y
// con letras, reacciones solapadas, panel editorial con palabras que se encienden, sello, lámina con dos
// bocadillos, pop de juego, titular de juego, lista editorial, cifra de juego, bocadillo suelto, caso, cierre de
// marca, música y efectos. Sin nombres reales: rótulos genéricos («Docente del curso»).
//
//   node fixtures/milikito/generar.mjs
//
// Medios: ENLACES simbólicos (no copias) a proyectos/dora-v2/media/{mezzanine,plancha,mascara}.mp4 y audio.m4a,
// y a estilos/milikito/audio/*.mp3 (música y efectos); la lámina es una ilustración sintética (SVG del fixture
// rasterizado con el Chrome de Remotion). Escribe media/timeline.json (con recorte), timeline-marco.json (sin
// recorte), timeline-kinds.json (los 12 kinds en los tres registros) y timeline-3d.json (objetos 3D nuevos).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MOTOR = path.resolve(AQUI, "..", "..");
const RAIZ = path.resolve(MOTOR, "..");
const MEDIA = path.join(AQUI, "media");
const DORA = path.join(RAIZ, "proyectos", "dora-v2");
const AUDIO = path.join(RAIZ, "estilos", "milikito", "audio");
fs.mkdirSync(path.join(MEDIA, "extras"), { recursive: true });

// ——— Enlaces (solo lectura de proyectos/ y estilos/) ———
const enlazar = (origen, destino) => {
  if (!fs.existsSync(origen)) throw new Error(`no existe ${path.relative(RAIZ, origen)}`);
  fs.rmSync(destino, { force: true });
  fs.symlinkSync(fs.realpathSync(origen), destino);
};
for (const f of ["mezzanine.mp4", "plancha.mp4", "mascara.mp4", "audio.m4a"]) enlazar(path.join(DORA, "media", f), path.join(MEDIA, f));
for (const f of fs.readdirSync(AUDIO).filter((x) => x.endsWith(".mp3"))) enlazar(path.join(AUDIO, f), path.join(MEDIA, "extras", f));

// ——— Lámina sintética: SVG → PNG (Chrome de Remotion, sin red) → JPG ———
const lamina = path.join(MEDIA, "extras", "lamina-reunion.jpg");
if (!fs.existsSync(lamina)) {
  const chrome = path.join(MOTOR, "node_modules", ".remotion", "chrome-headless-shell", "mac-arm64", "chrome-headless-shell-mac-arm64", "chrome-headless-shell");
  const png = path.join(AQUI, ".tmp-lamina.png");
  execFileSync(chrome, ["--headless", "--disable-gpu", "--hide-scrollbars", `--screenshot=${png}`, "--window-size=1545,875", `file://${path.join(AQUI, "lamina-reunion.svg")}`], { stdio: "ignore" });
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", png, "-q:v", "2", lamina]);
  fs.rmSync(png, { force: true });
}

// ——— Ventana de dora-v2 ———
const src = JSON.parse(fs.readFileSync(path.join(DORA, "timeline.json"), "utf8"));
const FPS = src.fps;
const W0 = 10300; // fotograma de dora-v2 donde empieza la ventana
const NV = 2020; // fotogramas con vídeo (80,8 s)
const OUTRO = 200;
const DUR = NV + OUTRO;
const recortar = (a, b) => [Math.max(a, W0), Math.min(b, W0 + NV)];
const segmentos = [];
for (const s of src.segmentos) {
  const [a, b] = recortar(s.dst, s.dst + s.dur);
  if (b > a) segmentos.push({ dst: a - W0, src: +(s.src + (a - s.dst) / FPS).toFixed(3), dur: b - a });
}
let planos = [];
for (const p of src.planos) {
  const [a, b] = recortar(p.desde, p.hasta);
  if (b > a) planos.push({ ...p, desde: a - W0, hasta: b - W0 });
}
planos[0].desde = 0;
planos.at(-1).hasta = DUR;
const subtitulos = src.subtitulos
  .filter((s) => s.desde >= W0 && s.hasta <= W0 + NV)
  .map((s) => ({ desde: s.desde - W0, hasta: s.hasta - W0, palabras: s.palabras.map((p) => ({ ...p, desde: p.desde - W0, hasta: p.hasta - W0 })) }));
const gestos = src.gestos
  .filter((g) => g.desde >= W0 && g.hasta <= W0 + NV)
  .map((g) => ({ ...g, desde: g.desde - W0, pico: g.pico - W0, hasta: g.hasta - W0, pista: g.pista?.map((x) => ({ ...x, f: x.f - W0 })) }));

// Fotograma local en que se dice una palabra (a partir de `desde`), para anclar las marcas `en` a la voz.
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const palabras = subtitulos.flatMap((s) => s.palabras);
const dicho = (palabra, desde = 0) => {
  const p = palabras.find((x) => x.desde >= desde && norm(x.t) === norm(palabra));
  if (!p) throw new Error(`no encuentro «${palabra}» después de f${desde} en los subtítulos`);
  return p.desde;
};

// ——— Capítulos (fichas P · T · L) ———
const capitulos = [
  { desde: 175, hasta: 624, rotuloHasta: 250, n: 1, sigla: "P", titulo: "Contener con protocolo", kicker: "Paso 1", subtitulo: "La contención forma parte del protocolo", acento: 0 },
  { desde: 624, hasta: 1540, rotuloHasta: 700, n: 2, sigla: "T", titulo: "La trampa", kicker: "Paso 2", subtitulo: "Decisión de las áreas afectadas", acento: 1 },
  { desde: 1540, hasta: NV, rotuloHasta: 1625, n: 3, sigla: "L", titulo: "Latencia humana", kicker: "Paso 3", subtitulo: "Esperar permiso cuesta minutos", acento: 2 },
];

// ——— Eventos ———
const eventos = [
  { id: "e01", tipo: "gesto3d", objeto: "trofeo", desde: 256, hasta: 340, texto: "Parte del protocolo" },
  {
    id: "e02",
    tipo: "escena3d",
    objeto: "escalera",
    desde: 346,
    hasta: 530,
    lado: "der",
    kicker: "El protocolo",
    titulo: "Cuatro peldaños",
    etiquetas: [
      { en: dicho("registro", 346), texto: "Registro" },
      { en: dicho("evaluacion", 346), texto: "Evaluación de impacto" },
      { en: dicho("escalado", 346), texto: "Escalado" },
      { en: dicho("comunicacion", 346), texto: "Comunicación" },
    ],
  },
  { id: "r01", tipo: "reaccion", desde: 440, hasta: 475, icono: "alerta" },
  { id: "r02", tipo: "reaccion", desde: 452, hasta: 487, icono: "idea" },
  { id: "e03", tipo: "panel", kind: "clave", desde: 536, hasta: 618, lado: "der", registro: "editorial", kicker: "Opción C", titulo: "Madurez sin disciplina", texto: "Técnicamente maduras, pero sin la disciplina regulatoria", resalta: ["disciplina regulatoria"] },
  { id: "e04", tipo: "sello", desde: 706, hasta: 790, texto: "TRAMPA", tono: "bad" },
  {
    id: "e05",
    tipo: "lamina",
    desde: 796,
    hasta: 960,
    imagen: "lamina-reunion",
    pie: "Ilustración de prueba",
    bocadillos: [
      { en: 812, texto: "¿Lo consultamos con negocio?", x: 0.27, y: 0.2, forma: "globo", cola: "abajo", ancho: 0.34 },
      { en: 880, texto: "Mejor esperamos…", x: 0.74, y: 0.2, forma: "nube", cola: "abajo", ancho: 0.28 },
    ],
  },
  { id: "e06", tipo: "pop", desde: 966, hasta: 1070, texto: "No es una decisión", sub: "de negocio", grande: true },
  { id: "e07", tipo: "titulo", desde: 1076, hasta: 1180, antetitulo: "Es una", texto: "Obligación", subtitulo: "operativa del equipo de seguridad TIC" },
  { id: "e08", tipo: "panel", kind: "clave", desde: 1186, hasta: 1266, lado: "der", kicker: "Sin condiciones", texto: "No puede condicionarse a la aprobación previa de las áreas usuarias", resalta: ["aprobación previa"] },
  {
    id: "e09",
    tipo: "panel",
    kind: "lista",
    desde: 1272,
    hasta: 1534,
    lado: "der",
    kicker: "El negocio decide",
    titulo: "Con el protocolo ya activo",
    items: [
      { en: dicho("prioridades", 1272), texto: "Prioridades de servicio", icono: "objetivo" },
      { en: dicho("comunicacion", 1272), texto: "Comunicación a clientes", icono: "mensaje" },
      { en: dicho("aceptacion", 1272), texto: "Aceptación del impacto", icono: "balanza" },
    ],
  },
  { id: "e10", tipo: "panel", kind: "cifra", desde: 1631, hasta: 1745, lado: "der", kicker: "Latencia humana", valor: 15, valorInicial: 0, unidad: "min", etiqueta: "cada vez que esperas un permiso" },
  { id: "e11", tipo: "escena3d", objeto: "letras", texto: "DORA", desde: 1751, hasta: 1826, lado: "der", kicker: "Automático y rápido", disposicion: "grande" },
  { id: "e12", tipo: "bocadillo", desde: 1834, hasta: 1920, texto: "¿Y mi defensa ante el supervisor?", forma: "grito", lado: "der" },
  {
    id: "e13",
    tipo: "panel",
    kind: "caso",
    desde: 1926,
    hasta: 2014,
    lado: "der",
    kicker: "Ante el supervisor",
    titulo: "«Esperábamos a negocio»",
    texto: "Si el incidente resulta grave, esperar la decisión de las áreas afectadas no es una defensa.",
    veredicto: { en: dicho("sostiene", 1926), texto: "No se sostiene", tono: "bad" },
  },
];

const intro = {
  desde: 0,
  hasta: 175,
  estilo: "marca",
  kicker: "Resiliencia operativa digital",
  titulo: "DORA en la práctica",
  subtitulo: "Tres casos para decidir como exige el reglamento",
  palabras: ["MASTER", "CLASS"],
  etiquetas: ["En directo", "Nº 1", "Resiliencia & regulación"],
  lema: "Fórmate con nuestros expertos",
  rotulo: { nombre: "Docente del curso", cargo: "Especialista en resiliencia digital" },
  franja: { titulo: "DORA en la práctica", subtitulo: "Tres casos para decidir como exige el reglamento", firma: "Una formación de OpenWebinars" },
};
const outro = {
  desde: NV,
  hasta: DUR,
  estilo: "marca",
  kicker: "En resumen",
  titulo: "Activar primero, decidir después",
  puntos: ["La contención es parte del protocolo", "El negocio decide prioridades, no la activación", "Cada permiso añade latencia"],
  cta: "Siguiente caso: viernes por la tarde",
  palabras: ["MASTER", "CLASS"],
  etiquetas: ["Hasta la próxima", "Nº 1", "Resiliencia & regulación"],
  lema: "Fórmate con nuestros expertos",
  franja: { firma: "Una formación de OpenWebinars" },
};

// ——— Música y efectos (claves de media.extras = nombre del archivo sin extensión) ———
const sfx = [];
const efecto = (archivo, en, volumen) => sfx.push({ archivo, en, volumen });
for (const c of capitulos) {
  efecto("sfx-ficha", c.desde, 0.45);
  efecto("sfx-destello", c.desde + 4, 0.4);
}
efecto("sfx-destello", 1080, 0.45);
for (const en of [250, 340, 618, 700, 790, 960, 1070, 1180, 1625, 1745, 1826, 1920]) efecto("sfx-whoosh", en - 4, 0.3);
for (const en of [440, 452, 812, 880, 1834]) efecto("sfx-pop", en, 0.5);
efecto("sfx-sello", 714, 0.6);
efecto("sfx-golpe", 714, 0.45);
efecto("sfx-destello", 1672, 0.35);
const audio = {
  musica: [
    { archivo: "sintonia", desde: 0, hasta: 200, volumen: 0.4, fundidoSalida: 30 },
    { archivo: "base", desde: 170, hasta: NV + 10, volumen: 0.12, fundidoEntrada: 25, fundidoSalida: 20, bucle: true },
    { archivo: "cierre", desde: NV - 10, hasta: DUR, volumen: 0.5, fundidoEntrada: 10, fundidoSalida: 20 },
  ],
  sfx,
};

const base = {
  version: 1,
  fps: FPS,
  ancho: 1920,
  alto: 1080,
  duracion: DUR,
  fuente: src.fuente,
  recorte: true,
  plancha: src.plancha,
  escenario: true,
  segmentos,
  planos,
  capitulos,
  eventos,
  subtitulos,
  gestos,
  intro,
  outro,
  audio,
  avisos: [`fixture: ventana f${W0}–f${W0 + NV} de proyectos/dora-v2 (solo lectura) con eventos «show» de prueba`],
};

// Comprobaciones del generador (las de `tools linea`; las reacciones pueden solaparse).
const orden = eventos.filter((e) => e.tipo !== "reaccion").sort((a, b) => a.desde - b.desde);
for (let i = 1; i < orden.length; i++) if (orden[i].desde - orden[i - 1].hasta < 6) throw new Error(`eventos demasiado juntos: ${orden[i - 1].id} → ${orden[i].id}`);
for (const e of orden) for (const c of capitulos) if (e.desde < c.rotuloHasta && e.hasta > c.desde) throw new Error(`${e.id} dentro del rótulo ${c.n}`);
if (!gestos.some((g) => g.desde < 340 && g.hasta > 256)) throw new Error("no hay gesto para el trofeo");

const escribir = (nombre, tl) => fs.writeFileSync(path.join(MEDIA, nombre), JSON.stringify(tl, null, 1));
escribir("timeline.json", base);
escribir("timeline-marco.json", { ...base, recorte: false, plancha: null });

// ——— Todos los kinds en los tres registros (dos-cajas), para las hojas de contactos ———
{
  const it = (t, icono, extra = {}) => ({ texto: t, icono, ...extra });
  const kinds = [
    { kind: "lista", kicker: "Lista", titulo: "Qué pedir al proveedor", items: [it("Certificaciones vigentes", "escudo"), it("Plan de continuidad", "reloj", { detalle: "con fecha del último simulacro" }), it("Subcontratistas", "red")] },
    { kind: "pasos", kicker: "Pasos", titulo: "Del riesgo a la decisión", items: [it("Identificar", "lupa"), it("Evaluar", "balanza"), it("Decidir", "check")] },
    { kind: "checklist", kicker: "Checklist", titulo: "El contrato incluye…", items: [{ texto: "Niveles de servicio", tono: "ok" }, { texto: "Estrategia de salida", tono: "aviso" }, { texto: "Ubicación de los datos", tono: "bad" }] },
    { kind: "comparativa", kicker: "Comparativa", titulo: "No es lo mismo", izq: { titulo: "Certificados", items: ["Punto de partida", "No cubren tu caso"], tono: "neutro" }, der: { titulo: "Cláusulas", items: ["Específicas", "Obligan a las dos partes"], tono: "ok" } },
    { kind: "opciones", kicker: "Opciones", titulo: "¿Cómo lo abordas?", opciones: [{ letra: "A", texto: "Firmar ya" }, { letra: "B", texto: "Reutilizar una evaluación" }, { letra: "C", texto: "Evaluación proporcional" }, { letra: "D", texto: "Esperar" }], foco: { en: 20, letra: "C", veredicto: "correcta" } },
    { kind: "cifra", kicker: "Cifra", titulo: "Notificación inicial", valor: 72, valorInicial: 0, unidad: "h", etiqueta: "como máximo desde la detección" },
    { kind: "cita", kicker: "Cita", texto: "La resiliencia no se improvisa: se ensaya antes de necesitarla", resalta: ["se ensaya"] },
    { kind: "clave", kicker: "Clave", titulo: "Función crítica", texto: "Si se interrumpe, el servicio al cliente se detiene", resalta: ["se detiene"] },
    { kind: "linea", kicker: "Línea", titulo: "Un incidente, paso a paso", hitos: [{ etiqueta: "09:15", texto: "Alerta" }, { etiqueta: "09:40", texto: "Protocolo" }, { etiqueta: "11:00", texto: "Aviso inicial" }, { etiqueta: "Día 3", texto: "Informe" }] },
    { kind: "mapa", kicker: "Mapa", titulo: "Quién toca el servicio", centro: "Servicio crítico", nodos: [{ texto: "Proveedor" }, { texto: "Equipo interno" }, { texto: "Subcontrata" }, { texto: "Supervisor" }] },
    { kind: "tarjeta", kicker: "Tarjeta", titulo: "Documentar", texto: "Lo que no está documentado, no se puede demostrar", icono: "documento" },
    { kind: "caso", kicker: "Caso", titulo: "La señal débil", texto: "Una alerta sin confirmar afecta a funciones críticas. Esperar a tener certeza deja fuera de plazo la primera notificación.", veredicto: { en: 30, texto: "Activar pronto", tono: "ok" } },
  ];
  const D = 60;
  const ev = [];
  let f = 0;
  for (const registro of ["show", "editorial", "lamina"]) {
    for (const k of kinds) {
      const e = { id: `${registro.slice(0, 2)}-${k.kind}`, tipo: "panel", lado: "der", desde: f, hasta: f + D - 6, registro, disposicion: "dos-cajas", ...JSON.parse(JSON.stringify(k)) };
      if (e.foco) e.foco.en += f;
      if (e.veredicto) e.veredicto.en += f;
      ev.push(e);
      f += D;
    }
  }
  const extra = [
    { tipo: "titulo", antetitulo: "El método", texto: "Impacto", subtitulo: "Una idea, un titular" },
    { tipo: "pop", texto: "Revisar es contrastar", sub: "no releer", grande: true },
    { tipo: "sello", texto: "EUREKA", tono: "ok" },
    { tipo: "panel", kind: "cifra", kicker: "Contador de juego", valor: 87, unidad: "%", etiqueta: "el dato que cita el ponente", lado: "der" },
  ];
  for (const x of extra) {
    ev.push({ id: `x-${x.tipo}${x.kind ? `-${x.kind}` : ""}`, desde: f, hasta: f + D - 6, disposicion: "dos-cajas", ...x });
    f += D;
  }
  const dur = f + 10;
  escribir("timeline-kinds.json", {
    ...base,
    duracion: dur,
    segmentos: [{ dst: 0, src: 1160, dur }],
    planos: [{ ...planos[0], desde: 0, hasta: dur, tipo: "medium", forzado: true }],
    capitulos: [],
    eventos: ev,
    subtitulos: [],
    gestos: [],
    intro: null,
    outro: null,
    audio: undefined,
    disposiciones: [{ desde: 0, hasta: dur, tipo: "dos-cajas" }],
  });
}

// ——— Objetos 3D nuevos (escena3d; en milikito-escenario va en la caja, en prueba-oscuro en el modo normal) ———
{
  const objs = [
    { objeto: "trofeo", titulo: "Trofeo" },
    { objeto: "llave", titulo: "Llave" },
    { objeto: "escalera", titulo: "Escalera", etiquetas: [{ texto: "Registro" }, { texto: "Evaluación" }, { texto: "Escalado" }, { texto: "Comunicación" }] },
    { objeto: "letras", titulo: "Letras", texto: "¡Acción!" },
    { objeto: "letras", titulo: "Letras (tildes)", texto: "Ñandú ÁÉÍÓÚ" },
    { objeto: "cadena", titulo: "Cadena (etiquetas largas)", etiquetas: [{ texto: "Banco" }, { texto: "Proveedor único" }, { texto: "Servicios dependientes" }, { texto: "Nuevas dependencias" }] },
  ];
  const D = 80;
  const ev = objs.map((o, i) => ({ id: `o${i + 1}`, tipo: "escena3d", lado: "izq", desde: i * D, hasta: i * D + D - 6, kicker: `Catálogo 3D · ${i + 1}/${objs.length}`, etiquetas: [], ...o }));
  const dur = objs.length * D;
  escribir("timeline-3d.json", {
    ...base,
    escenario: undefined,
    duracion: dur,
    segmentos: [{ dst: 0, src: 1160, dur }],
    planos: [{ ...planos[0], desde: 0, hasta: dur, tipo: "sideR", forzado: true, s: 0.68, tx: 1360, ty: 345 }],
    capitulos: [],
    eventos: ev,
    subtitulos: [],
    gestos: [],
    intro: null,
    outro: null,
    audio: undefined,
  });
}

fs.writeFileSync(
  path.join(AQUI, "proyecto.json"),
  JSON.stringify(
    {
      slug: "milikito",
      titulo: "Fixture del estilo milikito (modo escenario)",
      metodo: "clase-larga",
      estilo: "milikito-escenario",
      salida: { ancho: 1920, alto: 1080, fps: FPS },
      ponente: { recorte: true },
      escenario: true,
      lambda: { region: "eu-west-1", funcion: "remotion-render-4-0-529-mem3008mb-disk10240mb-900sec", framesPorLambda: 100, crf: 20, conservarSalida: false },
    },
    null,
    2,
  ) + "\n",
);
console.log(`milikito: ${DUR} fotogramas (${(DUR / FPS).toFixed(1)} s), ${eventos.length} eventos, ${segmentos.length} tramos, ${subtitulos.length} páginas de subtítulos, ${gestos.length} gestos, ${sfx.length} efectos`);
