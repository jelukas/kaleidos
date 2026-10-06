#!/usr/bin/env node
// Imprime los @font-face de un estilo (con unicode-range por subconjunto) para pegarlos en un proyecto.
//
//   node estilos/_esquema/fontface.mjs <estilo> [--ruta assets/fonts] [--escribir]
//
// --ruta es la carpeta donde estarán los .woff2 en el proyecto (por defecto assets/fonts, la de HyperFrames).
// Los nombres de archivo no cambian: copia estilos/<estilo>/fonts/*.woff2 a esa carpeta.
// --escribir actualiza el bloque de estilo.md entre /* fuentes:inicio */ y /* fuentes:fin */ (o el marcador
// <!-- FUENTES --> de una guía nueva) en vez de imprimirlo.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const RANGOS = JSON.parse(readFileSync(join(AQUI, "unicode-ranges.json"), "utf8"));
const args = process.argv.slice(2);
const i = args.indexOf("--ruta");
const ruta = (i >= 0 ? args[i + 1] : "assets/fonts").replace(/\/$/, "");
const nombre = args.find((a, j) => !a.startsWith("--") && !(j > 0 && args[j - 1] === "--ruta"));
if (!nombre) { console.error("uso: fontface.mjs <estilo> [--ruta assets/fonts] [--escribir]"); process.exit(2); }
const t = JSON.parse(readFileSync(join(RAIZ, nombre, "tokens.json"), "utf8"));
const lineas = t.tipografia.archivos.map((a) => {
  const archivo = a.archivo.replace(/^fonts\//, "");
  const sub = /-latin-ext-/.test(archivo) ? "latin-ext" : "latin";
  return `@font-face{font-family:"${a.familia}";font-style:${a.estilo};font-weight:${a.peso};font-display:block;src:url("${ruta}/${archivo}")format("woff2");unicode-range:${RANGOS[sub]}}`;
});
const css = lineas.join("\n");
if (args.includes("--escribir")) {
  const md = join(RAIZ, nombre, "estilo.md");
  const txt = readFileSync(md, "utf8");
  const bloque = `/* fuentes:inicio · generado con _esquema/fontface.mjs */\n${css}\n/* fuentes:fin */`;
  const nuevo = txt.includes("<!-- FUENTES -->")
    ? txt.replace("<!-- FUENTES -->", bloque)
    : txt.replace(/\/\* fuentes:inicio[^*]*\*\/\n[\s\S]*?\/\* fuentes:fin \*\//, bloque);
  if (nuevo === txt && !txt.includes(bloque)) { console.error("estilo.md no tiene <!-- FUENTES --> ni el bloque fuentes:inicio/fin"); process.exit(1); }
  writeFileSync(md, nuevo);
  console.error(`✓ ${nombre}/estilo.md: ${lineas.length} @font-face`);
} else console.log(css);
