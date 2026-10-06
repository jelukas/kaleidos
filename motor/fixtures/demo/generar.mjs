#!/usr/bin/env node
// Fixture de desarrollo `demo` (89 s): una línea de tiempo sobre el mezzanine de DORA v1 (enlace duro, no copia)
// con intro, dos rótulos de capítulo, UNO DE CADA KIND de panel, un pop, una escena3d, un gesto3d con muñecas
// inventadas, una ilustración 2,5D sintética, subtítulos inventados y outro. Sin nombres reales ni datos personales.
//
//   node fixtures/demo/generar.mjs            → media/timeline.json (sin recorte) y media/timeline-recorte.json
//   node fixtures/demo/generar.mjs --medios   → además, máscara y plancha sintéticas (elipse suave) e ilustración
//
// Los tiempos siguen las reglas del generador (docs/CONTRATO.md §3): ≥ 6 fotogramas entre eventos, ninguno
// dentro de un rótulo, planos ≥ 1,2 s, cada corte coincide con un cambio de plano y el borde inferior nunca se ve.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.join(AQUI, "media");
const RAIZ = path.resolve(AQUI, "..", "..", "..");
const MEZZ = path.join(RAIZ, "proyectos", "dora-videocurso-v1", "media", "mezzanine.mp4");
const FPS = 25;
fs.mkdirSync(path.join(MEDIA, "extras"), { recursive: true });

// ——— EDL: tres tramos con dos cortes (en fronteras de plano: el pop y el capítulo 2) ———
const segmentos = [
  { dst: 0, src: 41.0, dur: 685 },
  { dst: 685, src: 72.0, dur: 415 },
  { dst: 1100, src: 92.0, dur: 950 },
];
const FIN_VIDEO = 2050;
// La máscara sintética usa la geometría de la plancha (la real de tools es gris 1080p de la fuente entera).
const PLANCHA = { x: 768, y: 0, ancho: 2400, alto: 2160, escala: 0.75, mascara: "plancha", curva: "metodo" };
const DURACION = 2225;

// ——— Capítulos ———
const capitulos = [
  { desde: 150, hasta: 1100, rotuloHasta: 235, n: 1, titulo: "Decidir con datos", kicker: "Capítulo 1", subtitulo: "Qué revisar antes de firmar con un proveedor", acento: 0, objeto3d: null },
  { desde: 1100, hasta: FIN_VIDEO, rotuloHasta: 1185, n: 2, titulo: "Cuando algo falla", kicker: "Capítulo 2", subtitulo: "Señales, plazos y cómo reaccionar a tiempo", acento: 1, objeto3d: "bombilla" },
];

// Marcas `en` repartidas en el primer 60 % del evento.
const marcas = (desde, hasta, n, ini = 10) => Array.from({ length: n }, (_, i) => Math.round(desde + ini + ((hasta - desde) * 0.58 * i) / Math.max(1, n - 1 || 1)));
const conEn = (desde, hasta, items, ini) => {
  const m = marcas(desde, hasta, items.length, ini);
  return items.map((it, i) => ({ en: m[i], ...it }));
};

const ev = [];
const panel = (id, kind, desde, hasta, lado, extra) => ev.push({ id, tipo: "panel", kind, desde, hasta, lado, ...extra });

panel("e01", "lista", 241, 346, "der", {
  kicker: "Antes de firmar",
  titulo: "Qué pedir al proveedor",
  items: conEn(241, 346, [
    { texto: "Certificaciones vigentes", icono: "escudo" },
    { texto: "Plan de continuidad probado", icono: "reloj", detalle: "con fecha del último simulacro" },
    { texto: "Lista de subcontratistas", icono: "red" },
    { texto: "Derecho de auditoría", icono: "auditoria" },
  ]),
});
panel("e02", "pasos", 352, 457, "izq", {
  kicker: "Proceso",
  titulo: "Del riesgo a la decisión",
  items: conEn(352, 457, [{ texto: "Identificar", icono: "lupa" }, { texto: "Evaluar", icono: "balanza" }, { texto: "Decidir", icono: "check" }]),
});
panel("e03", "checklist", 463, 568, "der", {
  kicker: "Revisión",
  titulo: "El contrato incluye…",
  items: conEn(463, 568, [
    { texto: "Niveles de servicio medibles", tono: "ok" },
    { texto: "Plazos de notificación de incidentes", tono: "ok" },
    { texto: "Estrategia de salida", tono: "aviso", detalle: "solo esbozada" },
    { texto: "Ubicación de los datos", tono: "bad" },
  ]),
});
panel("e04", "comparativa", 574, 679, "der", {
  kicker: "Certificación ≠ contrato",
  titulo: "No es lo mismo",
  izq: { en: 584, titulo: "Certificados", items: ["Útiles como punto de partida", "No cubren tu caso"], tono: "neutro" },
  der: { en: 612, titulo: "Cláusulas", items: ["Específicas del servicio", "Obligan a las dos partes"], tono: "ok" },
});
ev.push({ id: "e05", tipo: "pop", desde: 685, hasta: 755, texto: "Revisar es contrastar,", sub: "no releer", grande: true });
panel("e06", "opciones", 761, 881, "der", {
  kicker: "Caso práctico",
  titulo: "¿Cómo lo abordas?",
  opciones: [
    { letra: "A", texto: "Firmar ya y revisar después" },
    { letra: "B", texto: "Reutilizar una evaluación antigua" },
    { letra: "C", texto: "Evaluación completa y proporcional" },
    { letra: "D", texto: "Esperar a que otro decida" },
  ],
  foco: { en: 830, letra: "C", veredicto: "correcta" },
});
panel("e07", "cifra", 887, 982, "der", { kicker: "Plazo", titulo: "Notificación inicial", valor: 72, valorInicial: 0, unidad: "h", etiqueta: "como máximo desde que se detecta el incidente" });
ev.push({ id: "e08", tipo: "gesto3d", objeto: "orbe", desde: 988, hasta: 1063, texto: "Todo encaja" });

panel("e09", "cita", 1191, 1296, "izq", { kicker: "Idea clave", texto: "La resiliencia no se improvisa: se ensaya antes de necesitarla", resalta: ["se ensaya"] });
panel("e10", "clave", 1302, 1397, "der", { kicker: "Concepto", titulo: "Función crítica", texto: "Si se interrumpe, el servicio al cliente se detiene", resalta: ["se detiene"] });
panel("e11", "linea", 1403, 1518, "der", {
  kicker: "Cronología",
  titulo: "Un incidente, paso a paso",
  hitos: conEn(1403, 1518, [
    { etiqueta: "09:15", texto: "Alerta sin confirmar" },
    { etiqueta: "09:40", texto: "Se activa el protocolo" },
    { etiqueta: "11:00", texto: "Aviso inicial" },
    { etiqueta: "Día 3", texto: "Informe intermedio" },
  ]),
});
panel("e12", "mapa", 1524, 1639, "izq", {
  kicker: "Dependencias",
  titulo: "Quién toca el servicio",
  centro: "Servicio crítico",
  nodos: conEn(1524, 1639, [{ texto: "Proveedor en la nube" }, { texto: "Equipo interno" }, { texto: "Subcontrata" }, { texto: "Autoridad supervisora" }]),
});
ev.push({
  id: "e13",
  tipo: "escena3d",
  objeto: "cadena",
  desde: 1645,
  hasta: 1770,
  lado: "der",
  kicker: "Concentración",
  titulo: "Si uno cae, caen todos",
  etiquetas: conEn(1645, 1770, [{ texto: "Entidad" }, { texto: "Proveedor" }, { texto: "Subcontrata" }], 12),
});
panel("e14", "tarjeta", 1776, 1871, "der", { kicker: "Recuerda", titulo: "Documentar", texto: "Lo que no está documentado, no se puede demostrar", icono: "documento" });
panel("e15", "caso", 1877, 1982, "izq", {
  kicker: "Caso 2",
  titulo: "La señal débil",
  texto: "Una alerta sin confirmar afecta a funciones críticas. Esperar a tener certeza deja fuera de plazo la primera notificación.",
  veredicto: { en: 1945, texto: "Activar pronto", tono: "ok" },
});
ev.push({
  id: "e16",
  tipo: "ilustracion",
  desde: 1988,
  hasta: 2046,
  imagen: "ilustracion-demo",
  profundidad: "ilustracion-demo-prof",
  camara: { desde: [-0.35, 0.05, 0], hasta: [0.45, 0.12, -0.9] },
  anclas: [
    { u: 0.32, v: 0.62, lift: 0.05, texto: "Oficina", objeto: "candado", en: 1996 },
    { u: 0.76, v: 0.27, lift: 0.05, texto: "Sol", en: 2008 },
  ],
});

// ——— Planos (valores de referencia de METODO §7.3; nariz de la ponente ≈ (1930, 500) px de la fuente 4K) ———
const TIPOS = {
  wide: { s: 0.52, tx: 960, ty: 250 },
  medium: { s: 0.76, tx: 960, ty: 372 },
  close: { s: 0.9, tx: 960, ty: 430 },
  sideL: { s: 0.68, tx: 560, ty: 345 },
  sideR: { s: 0.68, tx: 1360, ty: 345 },
  popL: { s: 0.74, tx: 640, ty: 368 },
  card: { s: 0.54, tx: 1440, ty: 262 },
};
const nariz = [1930, 500];
const forzados = [{ desde: 0, hasta: 150, tipo: "card" }];
for (const c of capitulos) forzados.push({ desde: c.desde, hasta: c.rotuloHasta, tipo: "card" });
for (const e of ev) {
  const tipo =
    e.tipo === "pop" ? "popL" : e.tipo === "gesto3d" ? "wide" : e.tipo === "ilustracion" ? "wide" : e.lado === "izq" ? "sideR" : e.lado === "der" ? "sideL" : "medium";
  forzados.push({ desde: e.desde, hasta: e.hasta, tipo });
}
forzados.sort((a, b) => a.desde - b.desde);
const ciclo = ["medium", "close", "medium", "wide", "close"];
let ic = 0;
const planos = [];
let f = 0;
for (const w of forzados) {
  if (w.desde - f >= 30) planos.push({ desde: f, hasta: w.desde, tipo: ciclo[ic++ % ciclo.length], forzado: false });
  else if (planos.length && w.desde > f) planos.at(-1).hasta = w.desde; // huecos cortos: se alarga el anterior
  planos.push({ desde: Math.max(f, w.desde), hasta: w.hasta, tipo: w.tipo, forzado: true });
  f = w.hasta;
}
if (DURACION - f >= 30) planos.push({ desde: f, hasta: DURACION, tipo: "wide", forzado: false });
else planos.at(-1).hasta = DURACION;
for (let i = 1; i < planos.length; i++) planos[i].desde = planos[i - 1].hasta;
const planosOut = planos.map((p) => ({ ...p, ...TIPOS[p.tipo], nariz, zoom: p.tipo === "card" || p.tipo.startsWith("side") ? [1, 1.02] : [1, 1.03] }));

// ——— Gesto inventado (manos abiertas a la altura del pecho) ———
const gestos = [
  {
    desde: 986,
    pico: 1004,
    hasta: 1060,
    munecas: [[1600, 1250], [2380, 1230]],
    pista: [
      { f: 986, munecas: [[1700, 1480], [2260, 1460]] },
      { f: 995, munecas: [[1650, 1350], [2320, 1330]] },
      { f: 1004, munecas: [[1600, 1250], [2380, 1230]] },
    ],
  },
];

// ——— Subtítulos inventados (páginas cortas, palabra a palabra) ———
const frases = [
  "Hoy vamos a ver cómo decidir con datos",
  "antes de firmar con un proveedor.",
  "Primero, qué le pedimos.",
  "Después, cómo pasar del riesgo a la decisión.",
  "Revisamos el contrato punto por punto",
  "y separamos certificado de cláusula.",
  "Revisar es contrastar, no releer.",
  "Ante un caso práctico, ¿qué harías tú?",
  "La opción C es la proporcional.",
  "Setenta y dos horas como máximo.",
  "Y así, todo encaja.",
  "Vamos con el segundo bloque.",
  "La resiliencia se ensaya antes.",
  "Una función crítica detiene el servicio.",
  "Veamos un incidente paso a paso.",
  "¿Quién toca el servicio crítico?",
  "Si uno cae, caen todos.",
  "Lo que no se documenta, no existe.",
  "Ante la duda, activar pronto.",
  "Y para terminar, un repaso.",
];
const subtitulos = [];
{
  const huecos = [[0, 150], [150, 1100], [1100, FIN_VIDEO]];
  const porTramo = [2, 9, 9];
  let k = 0;
  huecos.forEach(([a, b], ti) => {
    const n = porTramo[ti];
    const paso = (b - a) / n;
    for (let i = 0; i < n && k < frases.length; i++, k++) {
      const desde = Math.round(a + i * paso + 6);
      const palabras = frases[k].split(" ");
      const durP = Math.min(9, Math.floor((paso - 16) / palabras.length));
      const ps = palabras.map((t, j) => ({ t, desde: desde + j * durP, hasta: desde + (j + 1) * durP }));
      subtitulos.push({ desde, hasta: ps.at(-1).hasta + 12, palabras: ps });
    }
  });
}

const base = {
  version: 1,
  fps: FPS,
  ancho: 1920,
  alto: 1080,
  duracion: DURACION,
  fuente: { ancho: 3840, alto: 2160, fps: 25, duracion: 2042.688 },
  recorte: false,
  plancha: null,
  segmentos,
  planos: planosOut,
  capitulos,
  eventos: ev,
  subtitulos,
  gestos,
  intro: { desde: 0, hasta: 150, kicker: "Curso de prueba", titulo: "Decisiones con proveedores", subtitulo: "Fixture de desarrollo del motor de kaleidos", objeto3d: "escudo" },
  outro: {
    desde: FIN_VIDEO,
    hasta: DURACION,
    kicker: "En resumen",
    titulo: "Tres ideas para llevarte",
    puntos: ["Pide evidencias antes de firmar", "Ensaya la respuesta a incidentes", "Documenta cada decisión"],
    cta: "Siguiente módulo: la salida ordenada",
    objeto3d: "escudo",
  },
  avisos: ["fixture sintético: subtítulos y gesto inventados"],
};

// Comprobaciones del generador (las mismas que garantiza `tools linea`).
const orden = [...ev].sort((a, b) => a.desde - b.desde);
for (let i = 1; i < orden.length; i++) if (orden[i].desde - orden[i - 1].hasta < 6) throw new Error(`eventos demasiado juntos: ${orden[i - 1].id} → ${orden[i].id}`);
for (const e of ev) for (const c of capitulos) if (e.desde < c.rotuloHasta && e.hasta > c.desde) throw new Error(`${e.id} dentro del rótulo ${c.n}`);
for (const p of planosOut) if (p.hasta - p.desde < 30) throw new Error(`plano de menos de 1,2 s en ${p.desde}`);
for (const s of segmentos.slice(1)) if (!planosOut.some((p) => p.desde === s.dst)) throw new Error(`el corte en ${s.dst} no coincide con un cambio de plano`);

fs.writeFileSync(path.join(MEDIA, "timeline.json"), JSON.stringify(base, null, 1));
fs.writeFileSync(
  path.join(MEDIA, "timeline-recorte.json"),
  JSON.stringify({ ...base, recorte: true, plancha: PLANCHA }, null, 1),
);
fs.writeFileSync(
  path.join(AQUI, "proyecto.json"),
  JSON.stringify({ slug: "demo", titulo: "Fixture de desarrollo del motor", metodo: "clase-larga", estilo: "prueba-oscuro", salida: { ancho: 1920, alto: 1080, fps: 25 }, ponente: { recorte: false }, lambda: { region: "eu-west-1", funcion: "remotion-render-4-0-529-mem3008mb-disk10240mb-900sec", framesPorLambda: 100, crf: 20, conservarSalida: false } }, null, 2) + "\n",
);
// Catálogo 3D: una escena3d por objeto (para las hojas de contactos del 3D estándar y toon).
{
  const objetos = ["escudo", "contrato", "registro", "cadena", "balanza", "salida", "orbe", "piramide", "estrellas-ue", "reloj", "grafica", "candado", "engranajes", "bombilla", "documento"];
  const etiquetas = { cadena: ["Entidad", "Proveedor", "Subcontrata"], piramide: ["Mínimo", "Limitado", "Alto", "Inaceptable"], balanza: ["Riesgo", "Control"], contrato: ["Auditoría", "Salida"] };
  const D = 76;
  const eventos = objetos.map((o, i) => ({
    id: `c${String(i + 1).padStart(2, "0")}`,
    tipo: "escena3d",
    objeto: o,
    desde: i * D,
    hasta: i * D + D - 6,
    lado: "der",
    kicker: `Catálogo 3D · ${i + 1}/${objetos.length}`,
    titulo: o,
    etiquetas: conEn(i * D, i * D + D - 6, (etiquetas[o] ?? []).map((texto) => ({ texto })), 8),
  }));
  const dur = objetos.length * D;
  const cat = {
    ...base,
    duracion: dur,
    segmentos: [{ dst: 0, src: 41.0, dur }],
    planos: [{ desde: 0, hasta: dur, tipo: "sideL", forzado: true, ...TIPOS.sideL, nariz, zoom: [1, 1] }],
    capitulos: [],
    eventos,
    subtitulos: [],
    gestos: [],
    intro: null,
    outro: null,
  };
  fs.writeFileSync(path.join(MEDIA, "timeline-catalogo.json"), JSON.stringify(cat, null, 1));
  fs.writeFileSync(path.join(MEDIA, "timeline-catalogo-recorte.json"), JSON.stringify({ ...cat, recorte: true, plancha: PLANCHA }, null, 1));
}
console.log(`timeline.json y timeline-recorte.json: ${DURACION} fotogramas (${(DURACION / FPS).toFixed(1)} s), ${ev.length} eventos, ${planosOut.length} planos, ${subtitulos.length} páginas de subtítulos`);

// ——— Medios ———
const enlace = path.join(MEDIA, "mezzanine.mp4");
if (!fs.existsSync(enlace)) {
  if (!fs.existsSync(MEZZ)) throw new Error(`no encuentro ${MEZZ}`);
  fs.linkSync(MEZZ, enlace); // enlace duro (mismo volumen): no ocupa espacio y el servidor estático lo sirve
  console.log("mezzanine.mp4 → enlace duro a proyectos/dora-videocurso-v1/media/mezzanine.mp4");
}

if (process.argv.includes("--medios")) {
  const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
  const T = 131; // segundos de fuente que usa la EDL (hasta 130 s)
  const tmp = path.join(AQUI, ".tmp");
  fs.mkdirSync(tmp, { recursive: true });
  // Máscara con la geometría de la plancha (región x 768–3168 de la fuente 4K, escala 0,75 → 1800×1620).
  // Unión suave de una elipse (cabeza y pelo) y una superelipse (torso), en coordenadas de la fuente.
  const sx = "(768+X/0.75)";
  const sy = "(Y/0.75)";
  const e1 = `(1.15-(pow((${sx}-1935)/330,2)+pow((${sy}-560)/440,2)))/0.3`;
  const e2 = `(1.1-(pow(abs(${sx}-1945)/650,4)+pow(abs(${sy}-1540)/900,4)))/0.3`;
  const png = path.join(tmp, "mascara.png");
  ff(["-f", "lavfi", "-i", "color=black:s=1800x1620", "-frames:v", "1", "-vf", `format=gray,geq=lum='255*max(clip(${e1},0,1),clip(${e2},0,1))'`, png]);
  ff(["-loop", "1", "-framerate", "25", "-i", png, "-t", String(T), "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-tune", "stillimage", "-g", "50", "-movflags", "+faststart", path.join(MEDIA, "mascara.mp4")]);
  // Plancha premultiplicada: recorte del mezzanine 1080p (región/2), escala a 1800×1620 y × máscara.
  ff([
    "-t", String(T), "-i", MEZZ, "-loop", "1", "-framerate", "25", "-i", png,
    "-filter_complex", "[0:v]crop=1200:1080:384:0,scale=1800:1620:flags=lanczos,format=gbrp[fg];[1:v]format=gray,lut=y='clip((val*0.93-128)*1.35+128,0,255)',format=gbrp[a];[fg][a]blend=all_mode=multiply,format=yuv420p[v]",
    "-map", "[v]", "-an", "-t", String(T), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-g", "50", "-movflags", "+faststart", path.join(MEDIA, "plancha.mp4"),
  ]);
  // Ilustración sintética (cielo, sol, dos colinas y una casa) y su mapa de profundidad (blanco = cerca).
  const h1 = "(640+50*sin(X/170))";
  const h2 = "(790+70*sin(X/260+1.3))";
  const casa = "between(X,520,720)*between(Y,650,800)";
  const tejado = "between(Y,560,650)*lt(abs(X-620),(Y-560)*1.25)";
  const sol = "lt(hypot(X-1460,Y-300),105)";
  const color = (sky, s, far, near, c, t) =>
    `if(${casa},${c},if(${tejado},${t},if(gt(Y,${h2}),${near},if(gt(Y,${h1}),${far},if(${sol},${s},${sky})))))`;
  ff([
    "-f", "lavfi", "-i", "color=black:s=1920x1080", "-frames:v", "1",
    "-vf",
    `format=rgb24,geq=r='${color("150+60*Y/1080", "255", "70", "90+20*sin(X/40)", "235", "190")}':g='${color("190+40*Y/1080", "205", "120", "160+15*sin(X/40)", "225", "70")}':b='${color("235-30*Y/1080", "80", "150", "80", "210", "60")}'`,
    path.join(MEDIA, "extras", "ilustracion-demo.png"),
  ]);
  ff([
    "-f", "lavfi", "-i", "color=black:s=1920x1080", "-frames:v", "1",
    "-vf", `format=gray,geq=lum='255*if(${casa}+${tejado},0.86,if(gt(Y,${h2}),0.7+0.3*(Y-${h2})/(1080-${h2}),if(gt(Y,${h1}),0.38,if(${sol},0.03,0.06))))',gblur=sigma=3`,
    path.join(MEDIA, "extras", "ilustracion-demo-prof.png"),
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("medios sintéticos: mascara.mp4, plancha.mp4, extras/ilustracion-demo{,-prof}.png");
}
