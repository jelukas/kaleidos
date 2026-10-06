#!/usr/bin/env node
// Instala tipografías OFL/Apache-2.0 de @fontsource en un estilo del catálogo.
//
//   node estilos/_esquema/fuentes.mjs <estilo> <paquete>:<pesos>[:italic] [...]
//   node estilos/_esquema/fuentes.mjs curso-azul montserrat:400,700,900 jetbrains-mono:400
//
// Por cada paquete: `npm pack @fontsource/<paquete>` en una carpeta temporal (o lo toma de
// $FUENTES_CACHE si ahí ya está el .tgz), comprueba que la licencia sea OFL-1.1 o Apache-2.0,
// copia a estilos/<estilo>/fonts/ los .woff2 de los subconjuntos latin y latin-ext (si existe)
// y la licencia como OFL-<Familia>.txt (o LICENSE-<Familia>.txt). Al final imprime las entradas
// de `tipografia.archivos` listas para pegar en tokens.json.
//
// Orden de `archivos`: latin-ext primero y latin después. Si un motor carga los dos sin
// `unicode-range`, gana el último (latin) y el español se ve bien. Con `unicode-range` (ver
// unicode-ranges.json) los dos conviven. Sin dependencias: solo Node 22, npm y tar.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LICENCIAS_OK = new Set(["OFL-1.1", "Apache-2.0"]);
const [estilo, ...specs] = process.argv.slice(2);
if (!estilo || !specs.length) {
  console.error("uso: fuentes.mjs <estilo> <paquete>:<pesos>[:italic] ...");
  process.exit(2);
}
const destino = join(RAIZ, estilo, "fonts");
mkdirSync(destino, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "fuentes-"));
const cache = process.env.FUENTES_CACHE;
const entradas = [];

try {
  for (const spec of specs) {
    const [pkg, pesosTxt, estiloTxt] = spec.split(":");
    const pesos = (pesosTxt || "400").split(",").map(Number);
    const estilos = estiloTxt === "italic" ? ["normal", "italic"] : ["normal"];
    let tgz = cache && readdirSync(cache).find((f) => f.startsWith(`fontsource-${pkg}-`) && f.endsWith(".tgz"));
    if (tgz) tgz = join(cache, tgz);
    else {
      const out = execFileSync("npm", ["pack", `@fontsource/${pkg}`, "--silent"], { cwd: tmp, timeout: 120_000 }).toString().trim();
      tgz = join(tmp, out.split("\n").pop());
    }
    const dir = join(tmp, pkg);
    mkdirSync(dir, { recursive: true });
    execFileSync("tar", ["-xzf", tgz, "-C", dir], { timeout: 60_000 });
    const base = join(dir, "package");
    const meta = JSON.parse(readFileSync(join(base, "metadata.json"), "utf8"));
    const licencia = meta.license?.type || JSON.parse(readFileSync(join(base, "package.json"), "utf8")).license;
    if (!LICENCIAS_OK.has(licencia)) throw new Error(`${pkg}: licencia ${licencia} no permitida (solo OFL-1.1 o Apache-2.0)`);
    const familia = meta.family;
    const slugFam = familia.replace(/\s+/g, "");
    copyFileSync(join(base, "LICENSE"), join(destino, `${licencia.startsWith("OFL") ? "OFL" : "LICENSE"}-${slugFam}.txt`));
    for (const peso of pesos) {
      if (!meta.weights.includes(peso)) throw new Error(`${pkg}: no existe el peso ${peso} (${meta.weights.join(",")})`);
      for (const est of estilos) {
        for (const sub of ["latin-ext", "latin"]) {
          const nombre = `${pkg}-${sub}-${peso}-${est}.woff2`;
          const origen = join(base, "files", nombre);
          if (!existsSync(origen)) {
            if (sub === "latin") throw new Error(`${pkg}: falta ${nombre}`);
            continue;
          }
          copyFileSync(origen, join(destino, nombre));
          entradas.push({ familia, peso, estilo: est, archivo: `fonts/${nombre}` });
        }
      }
    }
    console.error(`✓ ${familia} (${licencia}) ${pesos.join(",")} → ${estilo}/fonts/`);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (!process.exitCode) console.log(JSON.stringify(entradas, null, 2));
