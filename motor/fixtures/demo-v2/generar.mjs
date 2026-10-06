#!/usr/bin/env node
// Fixture `demo-v2`: la línea de tiempo del fixture demo con la MÁSCARA REAL que genera `tools recortar` para
// proyectos/dora-v2 (RobustVideoMatting, gris 1080p de la fuente entera), mientras la plancha definitiva no exista.
// Solo LEE proyectos/dora-v2/work/ (no modifica nada allí): copia el tramo necesario (0–131 s) del mezzanine y de
// las partes de máscara ya terminadas, y construye una plancha de prueba desde el mezzanine 1080p con la misma
// curva de contraste que usa tools (§7.2: clip((α·0,93 − 128)·1,35 + 128)).
//
//   node fixtures/demo-v2/generar.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.join(AQUI, "media");
const RAIZ = path.resolve(AQUI, "..", "..", "..");
const WORK = path.join(RAIZ, "proyectos", "dora-v2", "work");
const T = 131; // segundos de fuente que usa la EDL del fixture demo (hasta 130 s)
fs.mkdirSync(MEDIA, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });

const partes = fs
  .readdirSync(path.join(WORK, "recorte", "mascara"))
  .filter((f) => /^parte_\d+\.mp4$/.test(f))
  .sort();
const fps = 25;
const utiles = [];
for (const p of partes) {
  const ini = Number(p.match(/\d+/)[0]);
  const n = Number(execFileSync("ffprobe", ["-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", path.join(WORK, "recorte", "mascara", p)], { encoding: "utf8" }).trim());
  if (n !== 2500) break; // parte en curso: se ignora
  utiles.push(p);
  if ((ini + n) / fps >= T) break;
}
const cubierto = utiles.length * 100;
if (cubierto < T) throw new Error(`la máscara real solo cubre ${cubierto} s y el fixture necesita ${T} s`);

const tmp = path.join(AQUI, ".tmp");
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, "lista.txt"), utiles.map((p) => `file '${path.join(WORK, "recorte", "mascara", p)}'\n`).join(""));
ff(["-f", "concat", "-safe", "0", "-i", path.join(tmp, "lista.txt"), "-t", String(T), "-c", "copy", "-movflags", "+faststart", path.join(MEDIA, "mascara.mp4")]);
ff(["-i", path.join(WORK, "mezzanine.mp4"), "-t", String(T), "-c", "copy", "-movflags", "+faststart", path.join(MEDIA, "mezzanine.mp4")]);
// Plancha de prueba: región x 768–3168 de la fuente 4K (384–1584 en 1080p) a escala 0,75 → 1800×1620.
ff([
  "-i", path.join(MEDIA, "mezzanine.mp4"), "-i", path.join(MEDIA, "mascara.mp4"),
  "-filter_complex",
  "[0:v]crop=1200:1080:384:0,scale=1800:1620:flags=lanczos,format=gbrp[fg];[1:v]crop=1200:1080:384:0,format=gray,lut=y='clip((val*0.93-128)*1.35+128,0,255)',scale=1800:1620:flags=bicubic,format=gbrp[a];[fg][a]blend=all_mode=multiply,format=yuv420p[v]",
  "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-g", "50", "-movflags", "+faststart", path.join(MEDIA, "plancha.mp4"),
]);
fs.rmSync(tmp, { recursive: true, force: true });

// Línea de tiempo: la del demo con recorte y la geometría por defecto de la máscara («fuente»).
const tl = JSON.parse(fs.readFileSync(path.join(AQUI, "..", "demo", "media", "timeline-recorte.json"), "utf8"));
tl.plancha = { x: 768, y: 0, ancho: 2400, alto: 2160, escala: 0.75 };
tl.avisos = ["fixture: máscara real de dora-v2 (partes " + utiles.join(", ") + "), plancha de prueba desde el mezzanine 1080p"];
fs.writeFileSync(path.join(MEDIA, "timeline.json"), JSON.stringify(tl, null, 1));
fs.mkdirSync(path.join(MEDIA, "extras"), { recursive: true });
for (const f of fs.readdirSync(path.join(AQUI, "..", "demo", "media", "extras"))) fs.copyFileSync(path.join(AQUI, "..", "demo", "media", "extras", f), path.join(MEDIA, "extras", f));
fs.writeFileSync(path.join(AQUI, "proyecto.json"), JSON.stringify({ slug: "demo-v2", titulo: "Fixture con la máscara real de dora-v2", estilo: "curso-azul", ponente: { recorte: true } }, null, 2) + "\n");
console.log(`demo-v2: máscara real (${utiles.length} partes), mezzanine y plancha de ${T} s en ${path.relative(RAIZ, MEDIA)}`);
