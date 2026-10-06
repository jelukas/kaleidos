#!/usr/bin/env node
// Fixture `narracion` (46 s, §8 modo narración, estilo milikito): vídeo SIN ponente con una locución. La «locución» es
// la voz de una ventana de 45 s de proyectos/dora-milikito (su EDL aplicada al audio, en mono, como una pista de TTS)
// y los subtítulos por palabra son los de esa ventana (SOLO LECTURA de proyectos/). Encima: titular de juego
// (completa), lista editorial con reacción (voz), lámina con bocadillo (voz), rótulo de capítulo (voz), sello con
// bocadillo suelto y reacción (completa: anclados a la esquina inferior derecha), cifra de juego (voz) y escena 3D
// (voz), música y efectos de estilos/milikito/audio (enlazados). Textos genéricos, sin nombres de personas.
//
//   node fixtures/narracion/generar.mjs
//
// Escribe media/narracion.m4a, media/timeline.json, media/timeline-completa.json (la lista en `completa`, para medir) y
// media/timeline-largo.json (5 250 f, el bloque repetido: SOLO para la estimación de Lambda; la locución dura 45 s).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MOTOR = path.resolve(AQUI, "..", "..");
const RAIZ = path.resolve(MOTOR, "..");
const MEDIA = path.join(AQUI, "media");
const ORIGEN = path.join(RAIZ, "proyectos", "dora-milikito");
const AUDIO = path.join(RAIZ, "estilos", "milikito", "audio");
fs.mkdirSync(path.join(MEDIA, "extras"), { recursive: true });

const enlazar = (origen, destino) => {
  if (!fs.existsSync(origen)) throw new Error(`no existe ${path.relative(RAIZ, origen)}`);
  fs.rmSync(destino, { force: true });
  fs.symlinkSync(fs.realpathSync(origen), destino);
};
for (const f of fs.readdirSync(AUDIO).filter((x) => x.endsWith(".mp3"))) enlazar(path.join(AUDIO, f), path.join(MEDIA, "extras", f));
const lamina = path.join(MOTOR, "fixtures", "milikito", "media", "extras", "lamina-reunion.jpg");
if (!fs.existsSync(lamina)) throw new Error("falta la lámina sintética: ejecuta antes node fixtures/milikito/generar.mjs");
enlazar(lamina, path.join(MEDIA, "extras", "lamina-reunion.jpg"));

// ——— Ventana y locución ———
const src = JSON.parse(fs.readFileSync(path.join(ORIGEN, "timeline.json"), "utf8"));
const FPS = src.fps;
const W0 = 4000;
const NV = 1125; // 45 s de voz
const DUR = NV + 25;
const piezas = [];
for (const s of src.segmentos) {
  const a = Math.max(s.dst, W0);
  const b = Math.min(s.dst + s.dur, W0 + NV);
  if (b > a) piezas.push({ ini: s.src + (a - s.dst) / FPS, fin: s.src + (b - s.dst) / FPS });
}
const locucion = path.join(MEDIA, "narracion.m4a");
if (!fs.existsSync(locucion)) {
  const filtros = piezas.map((p, i) => `[0:a]atrim=${p.ini.toFixed(3)}:${p.fin.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(p.fin - p.ini - 0.02).toFixed(3)}:d=0.02[a${i}]`);
  const concat = `${piezas.map((_, i) => `[a${i}]`).join("")}concat=n=${piezas.length}:v=0:a=1[voz]`;
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", path.join(ORIGEN, "media", "audio.m4a"), "-filter_complex", [...filtros, concat].join(";"), "-map", "[voz]", "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", locucion]);
}

const subtitulos = src.subtitulos
  .filter((s) => s.desde >= W0 && s.hasta <= W0 + NV)
  .map((s) => ({ desde: s.desde - W0, hasta: s.hasta - W0, palabras: s.palabras.map((p) => ({ ...p, desde: p.desde - W0, hasta: p.hasta - W0 })) }));

// ——— Timeline de narración ———
const eventos = [
  { id: "n01", tipo: "titulo", desde: 0, hasta: 150, antetitulo: "Última hora", texto: "Novedades", subtitulo: "El resumen del día", registro: "show", disposicion: "completa" },
  {
    id: "n02", tipo: "panel", kind: "lista", desde: 165, hasta: 430, disposicion: "voz", kicker: "Claves", titulo: "Lo que hay que saber",
    items: [
      { en: 190, texto: "Se anuncia una versión nueva", icono: "rayo" },
      { en: 260, texto: "Llega a más equipos", icono: "personas" },
      { en: 330, texto: "Con un calendario por fases", icono: "calendario" },
    ],
  },
  { id: "n03", tipo: "reaccion", desde: 300, hasta: 335, icono: "idea" },
  { id: "n04", tipo: "lamina", desde: 445, hasta: 565, imagen: "lamina-reunion", disposicion: "voz", pie: "Ilustración de archivo", bocadillos: [{ en: 470, texto: "¿Y ahora qué?", x: 0.66, y: 0.22, forma: "globo", cola: "izq" }] },
  { id: "n05", tipo: "sello", desde: 665, hasta: 800, texto: "Confirmado", tono: "ok", disposicion: "completa" },
  { id: "n06", tipo: "bocadillo", desde: 690, hasta: 790, texto: "¡Por fin!", forma: "grito", lado: "izq" },
  { id: "n07", tipo: "reaccion", desde: 705, hasta: 740, icono: "ok" },
  { id: "n08", tipo: "panel", kind: "cifra", desde: 815, hasta: 960, disposicion: "voz", valor: 29, unidad: "%", etiqueta: "más rápido", registro: "show" },
  { id: "n10", tipo: "bocadillo", desde: 840, hasta: 945, texto: "¡Casi un tercio!", forma: "nube", lado: "izq" },
  { id: "n09", tipo: "escena3d", objeto: "trofeo", desde: 975, hasta: 1110, disposicion: "voz", kicker: "Balance", titulo: "Un buen día", etiquetas: [{ en: 1000, texto: "Objetivo cumplido" }] },
];
const tl = {
  version: 1,
  fps: FPS,
  ancho: 1920,
  alto: 1080,
  duracion: DUR,
  narracion: true,
  recorte: false,
  escenario: true,
  segmentos: [],
  capitulos: [
    { desde: 0, hasta: 575, rotuloHasta: 0, n: 1, titulo: "La noticia", sigla: "1", acento: 0 },
    { desde: 575, hasta: DUR, rotuloHasta: 650, n: 2, titulo: "Qué cambia", sigla: "2", acento: 1, registro: "show" },
  ],
  eventos,
  subtitulos,
  audio: {
    musica: [{ archivo: "base", desde: 0, hasta: DUR, volumen: 0.12, fundidoEntrada: 12, fundidoSalida: 25, bucle: true }],
    sfx: [
      { archivo: "sfx-destello", en: 4, volumen: 0.6 },
      { archivo: "sfx-pop", en: 300, volumen: 0.6 },
      { archivo: "sfx-pop", en: 470, volumen: 0.6 },
      { archivo: "sfx-golpe", en: 668, volumen: 0.7 },
      { archivo: "sfx-pop", en: 690, volumen: 0.6 },
    ],
  },
  avisos: [],
};
const escribir = (nombre, datos) => fs.writeFileSync(path.join(MEDIA, nombre), JSON.stringify(datos, null, 1));
escribir("timeline.json", tl);
escribir("timeline-completa.json", { ...tl, eventos: eventos.map((e) => (e.id === "n02" ? { ...e, disposicion: "completa" } : e)) });

// 5 250 f (3 min 30 s) = el bloque repetido: solo para `lambda.mjs --dry-run` (la locución no llega hasta el final).
const LARGO = 5250;
const veces = Math.ceil(LARGO / DUR);
const desplazar = (e, k) => {
  const o = k * DUR;
  const x = { ...e, id: `${e.id}-${k}`, desde: e.desde + o, hasta: e.hasta + o };
  if (x.items) x.items = x.items.map((i) => ({ ...i, en: i.en + o }));
  if (x.bocadillos) x.bocadillos = x.bocadillos.map((b) => ({ ...b, en: b.en + o }));
  if (x.etiquetas) x.etiquetas = x.etiquetas.map((b) => ({ ...b, en: b.en + o }));
  return x;
};
const rep = (xs, f) => Array.from({ length: veces }, (_, k) => xs.map((x) => f(x, k))).flat();
escribir("timeline-largo.json", {
  ...tl,
  duracion: LARGO,
  capitulos: [{ desde: 0, hasta: LARGO, rotuloHasta: 0, n: 1, titulo: "La noticia", sigla: "1", acento: 0 }],
  eventos: rep(eventos, desplazar).filter((e) => e.hasta <= LARGO),
  subtitulos: rep(subtitulos, (s, k) => ({ desde: s.desde + k * DUR, hasta: s.hasta + k * DUR, palabras: s.palabras.map((p) => ({ ...p, desde: p.desde + k * DUR, hasta: p.hasta + k * DUR })) })).filter((s) => s.hasta <= LARGO),
  audio: { musica: [{ ...tl.audio.musica[0], hasta: LARGO }], sfx: rep(tl.audio.sfx, (x, k) => ({ ...x, en: x.en + k * DUR })).filter((x) => x.en < LARGO) },
});
console.log(`✓ fixtures/narracion: ${DUR} f (${(DUR / FPS).toFixed(1)} s), ${eventos.length} eventos, ${subtitulos.length} páginas de subtítulos, locución ${(fs.statSync(locucion).size / 1e6).toFixed(2)} MB`);
