#!/usr/bin/env node
// Revisa la adherencia de una composición a un estilo del catálogo antes de renderizar.
//
//   node estilos/_esquema/adherencia.mjs <estilo> <archivo|carpeta> [...]
//   node estilos/_esquema/adherencia.mjs senal-informativo ~/videos-opus/videos/ia-septiembre-2026/compositions
//
// Recorre .html .css .js .mjs .ts .tsx .svg (sin node_modules, renders, snapshots, out, build, dist) y comprueba:
//   · colores: cada hex / rgb() / rgba() debe estar en la paleta de estilo.md o tokens.json (el alfa no cuenta);
//   · tipografías: cada font-family / fontFamily debe ser una familia de tokens.json (o genérica);
//   · sin <link>/@import a Google Fonts (las fuentes van locales, de fonts/);
//   · determinismo: avisa de Math.random, Date.now y new Date (el render hace seek).
// Al final imprime el «Qué no» de estilo.md para revisarlo a mano. Sale con 1 si hay colores o fuentes ajenos.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [estilo, ...rutas] = process.argv.slice(2);
if (!estilo || !rutas.length) { console.error("uso: adherencia.mjs <estilo> <archivo|carpeta> [...]"); process.exit(2); }
const md = readFileSync(join(RAIZ, estilo, "estilo.md"), "utf8");
const tok = JSON.parse(readFileSync(join(RAIZ, estilo, "tokens.json"), "utf8"));

const hex6 = (h) => {
  h = h.replace("#", "").toUpperCase();
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((x) => x + x).join("");
  return "#" + h.slice(0, 6);
};
const rgbHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("").toUpperCase();
const RE_HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g; // no casa con ids como #f01-glow
const RE_RGB = /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/g;
const colores = (txt) => [...[...txt.matchAll(RE_HEX)].map((m) => hex6(m[0])), ...[...txt.matchAll(RE_RGB)].map((m) => rgbHex(m[1], m[2], m[3]))];

const paleta = new Set([...colores(md), ...colores(JSON.stringify(tok.color))]);
const familias = new Set(tok.tipografia.archivos.map((a) => a.familia.toLowerCase()));
const GENERICAS = new Set(["sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "cursive", "ui-monospace", "currentcolor"]);

const EXT = new Set([".html", ".css", ".js", ".mjs", ".ts", ".tsx", ".svg"]);
const FUERA = new Set(["node_modules", "renders", "snapshots", "out", "build", "dist", ".git", "vendor"]);
const archivos = [];
const recorrer = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) { for (const n of readdirSync(p)) if (!FUERA.has(n) && !n.startsWith(".")) recorrer(join(p, n)); }
  else if (EXT.has(extname(p))) archivos.push(p);
};
rutas.forEach((r) => recorrer(resolve(r)));

const ajenosColor = new Map(), ajenosFuente = new Map(), avisos = [];
const anotar = (mapa, clave, donde) => { const l = mapa.get(clave) || []; l.push(donde); mapa.set(clave, l); };
for (const f of archivos) {
  const lineas = readFileSync(f, "utf8").split("\n");
  lineas.forEach((ln, i) => {
    const donde = `${relative(process.cwd(), f)}:${i + 1}`;
    if (ln.length > 4000) return; // datos incrustados (base64, capturas): no son estilo
    for (const c of colores(ln.replace(/url\([^)]*\)/g, "").replace(/&#\d+;|&#x[0-9a-f]+;/gi, ""))) if (!paleta.has(c)) anotar(ajenosColor, c, donde);
    // CSS (font-family: X, …), atributo SVG/HTML (font-family="X") y JS con cadena (fontFamily: "X");
    // un identificador JS sin comillas (fontFamily: FONT) no se puede resolver y se ignora.
    const fams = [
      ...[...ln.matchAll(/(?<![\w"'-])font-family\s*:\s*(["']?)([^;"'}{,]+)\1/gi)].map((m) => m[2]),
      ...[...ln.matchAll(/font-family\s*=\s*(["'])([^"']+)\1/gi)].map((m) => m[2].split(",")[0]),
      ...[...ln.matchAll(/(?:fontFamily|["']font-family["'])\s*:\s*(["'`])([^"'`]+)\1/g)].map((m) => m[2].split(",")[0]),
    ];
    for (const bruto of fams) {
      const fam = bruto.replace(/["'`\\]/g, "").trim().toLowerCase();
      if (!fam || fam.startsWith("var(") || fam.startsWith("$") || fam.includes("${") || GENERICAS.has(fam)) continue;
      if (!familias.has(fam)) anotar(ajenosFuente, fam, donde);
    }
    if (/fonts\.googleapis|fonts\.gstatic/.test(ln)) avisos.push(`${donde}: carga de Google Fonts (usa las fuentes locales del estilo)`);
    if (/Math\.random\(|Date\.now\(|new Date\(/.test(ln)) avisos.push(`${donde}: azar o reloj no deterministas`);
  });
}

console.log(`Adherencia a «${estilo}» · ${archivos.length} archivos · paleta de ${paleta.size} colores · familias: ${[...familias].join(", ")}\n`);
const listar = (titulo, mapa) => {
  console.log(`${mapa.size ? "✗" : "✓"} ${titulo}: ${mapa.size ? mapa.size + " fuera del estilo" : "todo del estilo"}`);
  for (const [k, l] of [...mapa].sort((a, b) => b[1].length - a[1].length)) console.log(`   ${k.padEnd(18)} ×${String(l.length).padEnd(4)} ${l.slice(0, 3).join("  ")}`);
};
listar("Colores", ajenosColor);
listar("Tipografías", ajenosFuente);
console.log(`${avisos.length ? "·" : "✓"} Avisos: ${avisos.length}`);
for (const a of avisos.slice(0, 20)) console.log(`   ${a}`);
const no = md.match(/### No \(Don't\)\n([\s\S]*?)(\n## |\n### |$)/);
if (no) console.log(`\nRevisa a mano el «Qué no» de ${estilo}/estilo.md:\n${no[1].trim()}`);
process.exit(ajenosColor.size || ajenosFuente.size ? 1 : 0);
