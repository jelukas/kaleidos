#!/usr/bin/env node
// Muestrario de un estilo a partir de su tokens.json: paleta, tipografías, un panel, un rótulo y un subtítulo,
// pintados con los tokens tal cual (sirve para revisar un estilo nuevo y como referencia si no hay renders).
//
//   NODE_PATH=~/videos-opus/node_modules node estilos/_esquema/muestrario.mjs <estilo> [--todas] [--salida x.jpg] [--html x.html]
//
// Por defecto escribe estilos/<estilo>/referencias/00-muestrario.jpg (960 px). Con --todas añade dos escenas
// genéricas: 01-rotulo.jpg (rótulo de capítulo) y 02-panel.jpg (panel + subtítulo + silueta de ponente), para
// llegar a las 3 referencias mínimas de un estilo nuevo o de una variante. Solo usa colores de tokens.json
// (con alfa cuando hace falta) y las fuentes de fonts/ con su unicode-range.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { capturar } from "./captura.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const RANGOS = JSON.parse(readFileSync(join(AQUI, "unicode-ranges.json"), "utf8"));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const nombre = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!nombre) { console.error("uso: muestrario.mjs <estilo> [--todas] [--salida x.jpg] [--html x.html]"); process.exit(2); }
const dir = join(RAIZ, nombre);
const t = JSON.parse(readFileSync(join(dir, "tokens.json"), "utf8"));
const c = t.color, ty = t.tipografia, fo = t.forma;

const rgba = (hex, a) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;
const fuente = (r) => `font-family:"${ty[r].familia}";font-weight:${ty[r].peso};${ty[r].tracking ? `letter-spacing:${ty[r].tracking};` : ""}${ty[r].interlineado ? `line-height:${ty[r].interlineado};` : ""}${ty[r].mayusculas ? "text-transform:uppercase;" : ""}`;
const faces = ty.archivos.map((a) => {
  const sub = /-latin-ext-/.test(a.archivo) ? "latin-ext" : "latin";
  return `@font-face{font-family:"${a.familia}";font-weight:${a.peso};font-style:${a.estilo};font-display:block;src:url("${pathToFileURL(join(dir, a.archivo)).href}") format("woff2");unicode-range:${RANGOS[sub]};}`;
}).join("\n");

const fondoCss = {
  liso: `background:${c.fondo};`,
  radial: `background:radial-gradient(circle at 82% 12%, ${rgba(c.acento, 0.22)} 0, ${rgba(c.acento, 0)} 38%), radial-gradient(circle at 8% 100%, ${rgba(c.capitulos[1 % c.capitulos.length], 0.12)} 0, ${rgba(c.capitulos[1 % c.capitulos.length], 0)} 34%), ${c.fondo};`,
  rejilla: `background:radial-gradient(circle at 80% 20%, ${rgba(c.acento, 0.2)} 0, ${rgba(c.acento, 0)} 40%), linear-gradient(${rgba(c.texto, 0.07)} 2px, transparent 2px) 0 0/80px 80px, linear-gradient(90deg, ${rgba(c.texto, 0.07)} 2px, transparent 2px) 0 0/80px 80px, ${c.fondo};`,
  papel: `background:radial-gradient(${rgba(c.texto, 0.16)} 1.6px, transparent 2px) 0 0/44px 44px, ${c.fondo};`,
  cristal: `background:radial-gradient(circle at 78% 18%, ${rgba(c.capitulos[0], 0.24)} 0, ${rgba(c.capitulos[0], 0)} 36%), radial-gradient(circle at 20% 90%, ${rgba(c.capitulos[1 % c.capitulos.length], 0.18)} 0, ${rgba(c.capitulos[1 % c.capitulos.length], 0)} 34%), ${c.fondo};`,
}[t.fondo.tipo];
const panelCss = {
  solido: `background:${c.superficie};border:${fo.borde}px solid ${c.linea};box-shadow:${fo.sombra};`,
  cristal: `background:linear-gradient(180deg, ${rgba(c.texto, 0.1)}, ${rgba(c.texto, 0.04)}), ${rgba(c.superficie, 0.7)};border:${fo.borde}px solid ${rgba(c.texto, 0.14)};box-shadow:inset 0 1px 0 ${rgba(c.texto, 0.18)}, ${fo.sombra};`,
  papel: `background:${c.superficie};border:${fo.borde}px solid ${c.texto};box-shadow:${fo.sombra};transform:rotate(-0.6deg);`,
  tinta: `background:${c.superficie};border:${fo.borde}px solid ${c.linea === c.superficie ? c.texto : c.linea};box-shadow:${fo.sombra};`,
}[t.paneles.estilo];
const subCss = {
  caja: `background:${rgba(c.superficie, 0.9)};padding:18px 34px 20px;border-radius:${Math.max(8, fo.radio * 0.8)}px;`,
  contorno: `-webkit-text-stroke:10px ${c.fondo};paint-order:stroke fill;`,
  limpio: `text-shadow:0 3px 18px ${rgba(c.fondo, 0.85)};`,
}[t.subtitulos.estilo];
const activa = {
  acento: `color:${c.acento};`,
  capitulo: `color:${c.capitulos[1 % c.capitulos.length]};`,
  subrayado: `color:${c.texto};background:${c.superficie2};border-radius:6px;padding:0 .12em;`,
  ninguna: `color:${c.texto};`,
}[t.subtitulos.palabraActiva];
const titulo = nombre.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
const sw = (k, v) => `<div class="sw"><i style="background:${v};${v.toLowerCase() === c.fondo.toLowerCase() ? `outline:2px solid ${c.linea};` : ""}"></i><b>${k}</b><code>${v}</code></div>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
${faces}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1920px;height:1080px;overflow:hidden;${fondoCss}color:${c.texto};${fuente("cuerpo")}}
.et{${fuente("etiqueta")};font-size:${ty.etiqueta.mayusculas ? 24 : 36}px;color:${c.acento}}
h1{${fuente("titular")};font-size:118px;margin:14px 0 18px}
.desc{font-size:30px;color:${c.textoSuave};max-width:1560px}
body{display:flex;flex-direction:column;padding:72px 96px 56px}
.fila{flex:1;display:flex;gap:84px;align-items:center}
.pal{width:820px;flex:none;display:grid;grid-template-columns:repeat(4,1fr);gap:22px 18px}
.sw{display:flex;flex-direction:column;gap:6px}.sw i{display:block;height:84px;border-radius:${Math.min(fo.radio, 18)}px;box-shadow:0 0 0 1px ${rgba(c.texto, 0.08)}}
.sw b{${fuente("etiqueta")};font-size:15px;color:${c.textoSuave}}.sw code{font-family:"${ty.mono.familia}";font-weight:${ty.mono.peso};font-size:19px}
.caps{display:flex;gap:10px;grid-column:1/-1;align-items:center}.caps span{width:72px;height:28px;border-radius:${fo.radioPildora}px}
.caps em{${fuente("etiqueta")};font-style:normal;font-size:15px;color:${c.textoSuave};margin-right:8px}
.panel{flex:1;padding:40px 46px;border-radius:${fo.radio}px;${panelCss}}
.panel .et{font-size:${ty.etiqueta.mayusculas ? 20 : 32}px}.panel h2{${fuente("titular")};font-size:62px;margin:10px 0 22px;color:${c.texto}}
.it{display:flex;gap:18px;align-items:baseline;font-size:31px;margin:12px 0;color:${c.texto}}.it i{flex:none;width:18px;height:18px;border-radius:${fo.radioPildora}px;transform:translateY(-2px)}
.it small{display:block;font-size:24px;color:${c.textoSuave}}
.chips{display:flex;gap:12px;margin-top:24px}.chip{${fuente("etiqueta")};font-size:17px;padding:10px 18px;border-radius:${fo.radioPildora}px;border:${Math.max(1, fo.borde)}px solid currentColor}
.tipos{margin-top:26px;display:flex;flex-wrap:wrap;gap:48px;align-items:baseline;color:${c.textoSuave};font-size:22px}
.tipos span b{color:${c.texto}}
.sub{display:flex;justify-content:center}
.sub div{font-family:"${ty.cuerpo.familia}";font-weight:${Math.max(600, ...ty.archivos.filter((a) => a.familia === ty.cuerpo.familia).map((a) => a.peso))};font-size:46px;line-height:1.25;${subCss}}
.sub .a{${activa}}.sub .p{opacity:.55}
</style></head><body>
<div class="wrap"><div class="et">Guía de estilo · ${t.modo}</div><h1>${titulo}</h1><p class="desc">${t.descripcion}</p>
<div class="tipos"><span><b style="${fuente("titular")};font-size:30px">Titular</b> · ${ty.titular.familia} ${ty.titular.peso}</span><span><b>Cuerpo</b> · ${ty.cuerpo.familia} ${ty.cuerpo.peso}</span><span><b class="et" style="font-size:20px">Etiqueta</b> · ${ty.etiqueta.familia} ${ty.etiqueta.peso}</span><span><b style="font-family:'${ty.mono.familia}';font-weight:${ty.mono.peso}">00:12:34 · 70/100</b> · ${ty.mono.familia}</span></div></div>
<div class="fila"><div class="pal">${["fondo", "superficie", "superficie2", "linea", "texto", "textoSuave", "acento", "ok"].map((k) => sw(k, c[k])).join("")}
<div class="caps"><em>capítulos</em>${c.capitulos.map((x) => `<span style="background:${x}"></span>`).join("")}<em style="margin-left:18px">aviso</em><span style="background:${c.aviso}"></span><em>error</em><span style="background:${c.error}"></span></div></div>
<div class="panel"><div class="et">Panel · ${t.paneles.estilo}</div><h2>Tres ideas clave</h2>
<div class="it"><i style="background:${c.capitulos[0]}"></i><div>Datos antes que código<small>lo editorial vive en JSON</small></div></div>
<div class="it"><i style="background:${c.capitulos[1 % c.capitulos.length]}"></i><div>Todo sincronizado con la voz</div></div>
<div class="it"><i style="background:${c.capitulos[2 % c.capitulos.length]}"></i><div>Verificar con imágenes</div></div>
<div class="chips"><span class="chip" style="color:${c.ok}">Correcto</span><span class="chip" style="color:${c.aviso}">Aviso</span><span class="chip" style="color:${c.error}">Riesgo</span></div></div></div>
<div class="sub"><div>La palabra que se dice <span class="a">ahora</span> <span class="p">se resalta así</span></div></div>
</body></html>`;

// ── Escenas genéricas (--todas) ──────────────────────────────────────────────────────────────
const cap = c.capitulos[1 % c.capitulos.length];
const base = `${faces}\n*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;${fondoCss}color:${c.texto};${fuente("cuerpo")}}
.et{${fuente("etiqueta")};font-size:${ty.etiqueta.mayusculas ? 24 : 38}px;color:${cap}}
.prog{position:absolute;left:72px;right:72px;bottom:40px;display:flex;gap:10px}.prog i{flex:1;height:6px;border-radius:3px;background:${rgba(c.texto, 0.16)}}
.sub{position:absolute;left:0;right:0;bottom:92px;display:flex;justify-content:center}
.sub div{font-family:"${ty.cuerpo.familia}";font-weight:${Math.max(600, ...ty.archivos.filter((a) => a.familia === ty.cuerpo.familia).map((a) => a.peso))};font-size:44px;line-height:1.25;${subCss}}
.sub .a{${t.subtitulos.palabraActiva === "acento" ? activa : t.subtitulos.palabraActiva === "capitulo" ? `color:${cap};` : activa}}.sub .p{opacity:.55}
.ponente{position:absolute;bottom:0;width:600px;height:860px;background:radial-gradient(ellipse 17% 12% at 50% 21%, ${rgba(c.textoSuave, 0.5)} 0 97%, transparent 100%), radial-gradient(ellipse 44% 52% at 50% 96%, ${rgba(c.textoSuave, 0.42)} 0 98%, transparent 100%);opacity:.45}`;
const prog = `<div class="prog">${c.capitulos.map((x, i) => `<i style="${i === 0 ? `background:${c.capitulos[0]}` : i === 1 ? `background:linear-gradient(90deg, ${x} 45%, ${rgba(c.texto, 0.16)} 45%)` : ""}"></i>`).join("")}</div>`;
const rotulo = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${base}
.num{position:absolute;left:110px;top:120px;${fuente("titular")};font-size:380px;line-height:.8;color:transparent;-webkit-text-stroke:3px ${cap}}
.txt{position:absolute;left:120px;top:540px;width:1080px}.txt h1{${fuente("titular")};font-size:112px;margin:16px 0 22px}.txt p{font-size:34px;color:${c.textoSuave}}
.barra{width:120px;height:6px;border-radius:3px;background:${cap};margin-top:28px}</style></head><body>
<div class="num">02</div><div class="txt"><div class="et">Capítulo 02 · Contexto</div><h1>Lo que conviene saber</h1><p>Una idea por capítulo, con su color.</p><div class="barra"></div></div>
<div class="ponente" style="right:140px"></div>${prog}</body></html>`;
const panel = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${base}
.panel{position:absolute;right:96px;top:140px;width:880px;padding:44px 50px;border-radius:${fo.radio}px;${panelCss}}
.panel h2{${fuente("titular")};font-size:60px;margin:12px 0 24px}.paso{display:flex;gap:22px;align-items:flex-start;margin:18px 0;font-size:32px;line-height:1.3}
.paso b{flex:none;width:54px;height:54px;border-radius:${Math.min(fo.radio, 16)}px;display:grid;place-items:center;${fuente("titular")};text-transform:none;letter-spacing:0;font-size:28px;background:${cap};color:${c.fondo}}
.paso small{display:block;font-size:24px;color:${c.textoSuave}}.paso.off{opacity:.45}
.chip{position:absolute;left:72px;top:52px;${fuente("etiqueta")};font-size:${ty.etiqueta.mayusculas ? 20 : 32}px;color:${cap};padding:10px 18px;border-radius:${fo.radioPildora}px;border:${Math.max(1, fo.borde)}px solid ${cap}}</style></head><body>
<div class="chip">02 · Contexto</div><div class="ponente" style="left:170px"></div>
<div class="panel"><div class="et">Pasos</div><h2>Cómo se hace</h2>
<div class="paso"><b>1</b><div>Leer la transcripción entera<small>revela capítulos y tomas falsas</small></div></div>
<div class="paso"><b>2</b><div>Escribir el guion por frases clave</div></div>
<div class="paso off"><b>3</b><div>Verificar con fotogramas</div></div></div>
<div class="sub"><div>Primero se lee la <span class="a">transcripción</span> <span class="p">completa</span></div></div>${prog}</body></html>`;

const tmp = mkdtempSync(join(tmpdir(), "muestrario-"));
const rutaHtml = opt("--html") || join(tmp, "muestrario.html");
writeFileSync(rutaHtml, html);
const salida = opt("--salida") || join(dir, "referencias", "00-muestrario.jpg");
mkdirSync(dirname(salida), { recursive: true });
const trabajos = [[rutaHtml, salida]];
if (args.includes("--todas")) {
  for (const [n, h] of [["01-rotulo", rotulo], ["02-panel", panel]]) {
    const r = join(tmp, `${n}.html`);
    writeFileSync(r, h);
    trabajos.push([r, join(dirname(salida), `${n}.jpg`)]);
  }
}
const reloj = setTimeout(() => { console.error("tiempo límite"); process.exit(1); }, 90_000 * trabajos.length);
(async () => {
  for (const [h, o] of trabajos) console.log(`✓ ${await capturar(h, o)}`);
  clearTimeout(reloj);
})().catch((e) => { console.error(e.message); process.exit(1); });
