#!/usr/bin/env node
// Render local de un tramo (pruebas y medidas; el render final es SIEMPRE en Lambda).
//
//   node scripts/render-local.mjs <slug> --frames a-b [--gl angle|swangle] [--concurrency N]
//        [--estilo X] [--timeline archivo] [--ponente auto|recorte|marco] [--comp Horizontal|Vertical]
//        [--crf 18] [--nombre salida] [--json]
//
// Con --concurrency 1 y --gl swangle se parece a UNA función de Lambda (una pestaña, WebGL por software):
// es lo que usa la calibración del modelo de coste. Deja out/render/<nombre>.mp4 y una línea en
// out/logs/tiempos.log; limpia los temporales remotion-v4-*-assets*.
import fs from "node:fs";
import path from "node:path";
import { asegurarBundle, fallo, leerArgs, leerRango, limpiarTemporales, MOTOR, OUT, prepararPublico, propsLocales, resolverProyecto } from "./lib/comun.mjs";

const { pos, op } = leerArgs();
const p = resolverProyecto(pos[0]);
if (!op.frames) fallo("falta --frames a-b");
const [a, b] = leerRango(op.frames);
const gl = op.gl ?? "angle";
if (!["angle", "swangle", "swiftshader", "egl", "vulkan"].includes(gl)) fallo(`--gl desconocido: ${gl}`);
const concurrency = Number(op.concurrency ?? 4);
const comp = op.comp ?? "Horizontal";
const timeline = op.timeline ?? "timeline.json";
const props = propsLocales(p, { timeline, estilo: op.estilo, ponente: op.ponente });
// Perfilado: --perfil sin-sombras,fondo-liso,sin-paneles · --sin-subtitulos · --sin-hud
if (op.perfil || op["sin-subtitulos"] || op["sin-hud"])
  props.opciones = { ...(props.opciones ?? {}), ...(op.perfil ? { perfil: String(op.perfil).split(",") } : {}), ...(op["sin-subtitulos"] ? { subtitulos: false } : {}), ...(op["sin-hud"] ? { hud: false } : {}) };
const nombre = op.nombre ?? `${p.slug}-${a}-${b}-${gl}-c${concurrency}`;
const salida = path.join(OUT, "render", `${nombre}.mp4`);
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.mkdirSync(path.join(OUT, "logs"), { recursive: true });

const { renderMedia, selectComposition, openBrowser } = await import("@remotion/renderer");
prepararPublico(p);
const { bundle } = await asegurarBundle();

const navegador = await openBrowser("chrome", { chromiumOptions: { gl } });
let seg = 0;
try {
  const composition = await selectComposition({ serveUrl: bundle, id: comp, inputProps: props, puppeteerInstance: navegador, chromiumOptions: { gl }, logLevel: "error" });
  if (b >= composition.durationInFrames) fallo(`--frames fuera de rango (duración ${composition.durationInFrames})`);
  let ultimo = -1;
  const t0 = performance.now();
  await renderMedia({
    composition,
    serveUrl: bundle,
    codec: "h264",
    crf: Number(op.crf ?? 18),
    outputLocation: salida,
    inputProps: props,
    frameRange: [a, b],
    concurrency,
    puppeteerInstance: navegador,
    chromiumOptions: { gl },
    imageFormat: "jpeg",
    jpegQuality: 90,
    timeoutInMilliseconds: 240000,
    logLevel: "error",
    onProgress: ({ progress }) => {
      const pc = Math.floor(progress * 10);
      if (pc !== ultimo && !op.json) {
        ultimo = pc;
        process.stdout.write(`\r  ${Math.round(progress * 100)} %   `);
      }
    },
  });
  seg = (performance.now() - t0) / 1000;
} finally {
  await navegador.close({ silent: true });
}
const n = b - a + 1;
const r = { slug: p.slug, timeline, estilo: props.estilo, comp, frames: [a, b], n, gl, concurrency, segundos: +seg.toFixed(2), sPorFotograma: +(seg / n).toFixed(4), fps: +(n / seg).toFixed(2), salida: path.relative(MOTOR, salida), fecha: new Date().toISOString() };
fs.appendFileSync(path.join(OUT, "logs", "tiempos.log"), JSON.stringify(r) + "\n");
limpiarTemporales();
if (op.json) console.log(JSON.stringify(r));
else console.log(`\n✓ ${n} fotogramas en ${seg.toFixed(1)} s → ${r.sPorFotograma} s/fotograma (${r.fps} fps, gl=${gl}, concurrencia ${concurrency}) → ${r.salida}`);
