#!/usr/bin/env node
// Fotogramas de control con UN empaquetado (out/bundle, reutilizado) y UN navegador, más una hoja de contactos.
//
//   node scripts/stills.mjs <slug> --at 12.5,1:03,f250        segundos, mm:ss o fotograma (fN)
//   node scripts/stills.mjs <slug> --at eventos                un fotograma por evento, intro, rótulos y outro
//   opciones: --estilo <estilo> --timeline <archivo> --ponente auto|recorte|marco --gl angle|swangle
//             --comp Horizontal|Vertical --escala 0.5 --cols 4 --nombre <carpeta> --sin-marca
//
// Medios: --public-dir = ../proyectos/<slug>/media (o motor/fixtures/<slug>/media), servido con enlaces duros
// desde out/publico junto a public/estilos (ver scripts/lib/comun.mjs). Limpia los temporales
// remotion-v4-*-assets* al terminar (METODO §8).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { aFotograma, asegurarBundle, fallo, leerArgs, limpiarTemporales, MOTOR, OUT, prepararPublico, propsLocales, resolverProyecto } from "./lib/comun.mjs";

const { pos, op } = leerArgs();
const p = resolverProyecto(pos[0]);
if (!op.at) fallo("falta --at t1,t2,… (o --at eventos)");
const comp = op.comp ?? "Horizontal";
const gl = op.gl ?? "angle";
const escala = Number(op.escala ?? 0.5);
const cols = Number(op.cols ?? 4);
const timeline = op.timeline ?? "timeline.json";
const props = propsLocales(p, { timeline, estilo: op.estilo, ponente: op.ponente });
props.opciones = { ...(props.opciones ?? {}), marca: !op["sin-marca"] };

const { renderStill, selectComposition, openBrowser } = await import("@remotion/renderer");

const t0 = Date.now();
prepararPublico(p);
const { bundle, reutilizado } = await asegurarBundle();
if (reutilizado) console.log("  empaquetado reutilizado (out/bundle)");
if (!p.archivos.has(timeline)) fallo(`no hay ${timeline} en los medios de ${p.slug}`);
const tl = JSON.parse(fs.readFileSync(p.archivos.get(timeline), "utf8"));

let fotogramas;
if (op.at === "eventos") {
  // Un fotograma por evento, a ~65 % de su duración (las marcas `en` ya han entrado), más intro/rótulos/outro.
  const f = [];
  const en = (a, b, k = 0.65) => Math.round(a + (b - a) * k);
  if (tl.intro) f.push(en(tl.intro.desde, tl.intro.hasta, 0.6));
  for (const c of tl.capitulos) f.push(en(c.desde, c.rotuloHasta, 0.6));
  for (const e of tl.eventos) f.push(en(e.desde, e.hasta, e.tipo === "gesto3d" ? 0.55 : 0.7));
  if (tl.outro) f.push(en(tl.outro.desde, tl.outro.hasta, 0.75));
  fotogramas = [...new Set(f)].sort((a, b) => a - b);
} else {
  fotogramas = String(op.at)
    .split(",")
    .map((x) => aFotograma(x, tl.fps))
    .filter((x) => x >= 0 && x < tl.duracion);
}
if (!fotogramas.length) fallo("ningún fotograma dentro de la duración");

const nombre = op.nombre ?? `${p.slug}-${props.estilo}-${op.ponente ?? (timeline.includes("recorte") ? "recorte" : "auto")}${comp === "Vertical" ? "-vertical" : ""}`;
const dir = path.join(OUT, "stills", nombre);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const navegador = await openBrowser("chrome", { chromiumOptions: { gl } });
const leyenda = [];
try {
  const composition = await selectComposition({ serveUrl: bundle, id: comp, inputProps: props, puppeteerInstance: navegador, chromiumOptions: { gl }, logLevel: "error" });
  let i = 0;
  for (const frame of fotogramas) {
    i++;
    const archivo = path.join(dir, `${String(i).padStart(3, "0")}.jpg`);
    const ts = Date.now();
    await renderStill({
      composition,
      serveUrl: bundle,
      output: archivo,
      frame,
      inputProps: props,
      puppeteerInstance: navegador,
      imageFormat: "jpeg",
      jpegQuality: 88,
      scale: escala,
      chromiumOptions: { gl },
      timeoutInMilliseconds: 120000,
      logLevel: "error",
    });
    const seg = ((Date.now() - ts) / 1000).toFixed(1);
    leyenda.push(`${String(i).padStart(3, "0")}  f${frame}  (${(frame / tl.fps).toFixed(2)} s)  ${seg} s`);
    console.log(`  ${leyenda.at(-1)}`);
  }
} finally {
  await navegador.close({ silent: true });
}

// Hoja de contactos (los fotogramas llevan su marca de depuración: fotograma, plano y evento).
const filas = Math.ceil(fotogramas.length / cols);
const hoja = path.join(dir, "hoja.jpg");
const anchoCelda = comp === "Vertical" ? 360 : 640;
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "1", "-i", path.join(dir, "%03d.jpg"),
  "-vf", `scale=${anchoCelda}:-2,tile=${cols}x${filas}:padding=8:margin=8:color=0x303030`,
  "-frames:v", "1", "-q:v", "3", hoja,
]);
fs.writeFileSync(path.join(dir, "leyenda.txt"), leyenda.join("\n") + "\n");
const borrados = limpiarTemporales();
console.log(`\n✓ ${fotogramas.length} fotogramas en ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.relative(MOTOR, hoja)}`);
if (borrados) console.log(`  temporales de Remotion borrados: ${borrados}`);
