// Genera las props de render:
//   work/props-local.json  → videoSrc "mezzanine.mp4" (servido con --public-dir=media-public)
//   work/props-lambda.json → videoSrc "__URL_PREFIRMADA__" (se sustituye por la URL prefirmada de S3)
// Solo viajan las palabras que quedan dentro del montaje (lo cortado —charla del equipo, tomas
// descartadas— no sale del equipo local). Se realinean contra el audio, se corrige la terminología
// (scripts/correcciones.json) y se aplican las redacciones de work/redacciones.json (lista local,
// fuera de git) y patrones genéricos de correo y teléfono.
import fs from "node:fs";
import path from "node:path";
import { cargarVoz, realinear } from "./realinear.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORK = path.join(ROOT, "work");
const brutas = JSON.parse(fs.readFileSync(path.join(WORK, "transcripcion", "captions.json"), "utf8"));
const cortes = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "datos", "cortes.json"), "utf8"));
const redaccionesPath = path.join(WORK, "redacciones.json");
const redacciones = fs.existsSync(redaccionesPath) ? JSON.parse(fs.readFileSync(redaccionesPath, "utf8")) : [];
const corr = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "correcciones.json"), "utf8"));

const cerca = (ms, t) => Math.abs(ms / 1000 - t) < 0.35;
let palabras = realinear(brutas, cargarVoz())
  .filter((p) => !corr.excluir.some(([t, txt]) => cerca(p.startMs, t) && p.text.trim() === txt))
  .map((p) => {
    const m = corr.mover.find(([t, txt]) => cerca(p.startMs, t) && p.text.trim() === txt);
    if (!m) return p;
    const nuevo = Math.round(m[2] * 1000);
    return { ...p, startMs: nuevo, timestampMs: nuevo, endMs: Math.max(p.endMs, nuevo + 300) };
  })
  .map((p) => {
    const r = corr.reemplazos_en.find(([t, txt]) => cerca(p.startMs, t) && p.text.trim() === txt);
    return r ? { ...p, text: p.text.replace(r[1], r[2]) } : p;
  });

const segs = cortes.capitulos.flatMap((c) => c.segmentos);
const dentro = (ms) => segs.some((s) => ms / 1000 >= s.in && ms / 1000 < s.out);

// Palabras finales cuya marca cae unas décimas después del final de su toma (el VAD confirma que la
// voz termina antes): se adelantan al final de la toma para que no desaparezcan del subtítulo.
palabras = palabras.map((p) => {
  if (dentro(p.startMs)) return p;
  const s = segs.find((x) => p.startMs / 1000 >= x.out && p.startMs / 1000 < x.out + 0.7);
  if (!s) return p;
  const ini = Math.round(s.out * 1000) - 180;
  return { ...p, startMs: ini, timestampMs: ini, endMs: Math.round(s.out * 1000) - 20 };
});

const PATRONES = [/[\w.+-]+@[\w-]+\.[\w.]+/g, /\b\d{3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{0,3}\b/g];
let nRedactadas = 0;
const limpiar = (texto) => {
  const lider = texto.match(/^\s*/)[0];
  let t = texto.trim();
  if (corr.reemplazos[t] !== undefined) t = corr.reemplazos[t];
  else {
    // Misma corrección ignorando la puntuación final ("Dora," → "DORA,").
    const [, nucleo, punt] = t.match(/^(.*?)([.,;:!?»"]*)$/);
    if (corr.reemplazos[nucleo] !== undefined) t = corr.reemplazos[nucleo] + punt;
  }
  for (const r of redacciones) {
    if (t.toLowerCase().includes(r.toLowerCase())) {
      t = t.replace(new RegExp(r, "gi"), "[…]");
      nRedactadas++;
    }
  }
  for (const p of PATRONES) {
    p.lastIndex = 0;
    if (p.test(t)) {
      t = t.replace(p, "[…]");
      nRedactadas++;
    }
  }
  return lider + t;
};

// Solo lo imprescindible (texto e instantes): las props caben en la invocación de Lambda (< 194 KB)
// y no se suben como objeto aparte a S3.
const subtitulos = palabras
  .filter((p) => dentro(p.startMs))
  .map((p) => ({ text: limpiar(p.text), startMs: p.startMs, endMs: p.endMs }));

const local = { videoSrc: "mezzanine.mp4", subtitulos, mostrarSubtitulos: true };
fs.writeFileSync(path.join(WORK, "props-local.json"), JSON.stringify(local));
fs.writeFileSync(path.join(WORK, "props-lambda.json"), JSON.stringify({ ...local, videoSrc: "__URL_PREFIRMADA__" }));

// Carpeta de pruebas locales: public/ + mezzanine (NO es la carpeta que se sube como site).
const mp = path.join(ROOT, "media-public");
fs.mkdirSync(mp, { recursive: true });
for (const d of ["fonts", "audio"]) {
  fs.cpSync(path.join(ROOT, "public", d), path.join(mp, d), { recursive: true });
}
const mez = path.join(ROOT, "media", "mezzanine.mp4");
const enlace = path.join(mp, "mezzanine.mp4");
// Enlace duro: el servidor estático del renderizador no sirve enlaces simbólicos (symlinks: false),
// y un enlace duro no ocupa espacio extra (el bundle local sí hace una copia, ~0,5 s en este SSD).
try {
  if (fs.lstatSync(enlace).isSymbolicLink()) fs.unlinkSync(enlace);
} catch {
  // no existía
}
if (!fs.existsSync(enlace) && fs.existsSync(mez)) fs.linkSync(mez, enlace);

console.log(
  `palabras en el montaje: ${subtitulos.length} de ${brutas.length}; redacciones: ${nRedactadas}; ` +
    `props: ${(fs.statSync(path.join(WORK, "props-local.json")).size / 1024).toFixed(0)} KB`,
);
