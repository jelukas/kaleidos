#!/usr/bin/env node
// npm run estilos — prepara motor/public/ para el site (pesa poco):
//   1. copia ../estilos/*/{tokens.json,estilo.md,fonts/} a public/estilos/ (SIN referencias/);
//   2. añade los estilos de prueba de fixtures/estilos/ que no existan en el catálogo; un estilo de prueba puede
//      heredar de uno del catálogo con `"_base": "<estilo>"` en su tokens.json (fusión profunda: los objetos se
//      mezclan y los arrays se sustituyen) y usa las fuentes del estilo base;
//   3. valida cada tokens.json con el mismo esquema zod del motor y comprueba que existen sus fuentes;
//   4. sintetiza con ffmpeg los efectos de sonido (public/motor/sfx/), sin licencias de terceros.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fmtBytes, MOTOR, RAIZ } from "./lib/comun.mjs";

const { tokensSchema } = await import("../src/datos/contrato.ts");

const DESTINO = path.join(MOTOR, "public", "estilos");
const fuentes = [
  { dir: path.join(RAIZ, "estilos"), origen: "estilos/" },
  { dir: path.join(MOTOR, "fixtures", "estilos"), origen: "motor/fixtures/estilos/" },
];

const copiarDir = (a, b) => {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const pa = path.join(a, e.name);
    const pb = path.join(b, e.name);
    if (e.isDirectory()) copiarDir(pa, pb);
    else fs.copyFileSync(pa, pb);
  }
};

const tam = (d) => {
  let n = 0;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    n += e.isDirectory() ? tam(p) : fs.statSync(p).size;
  }
  return n;
};

fs.rmSync(DESTINO, { recursive: true, force: true });
fs.mkdirSync(DESTINO, { recursive: true });

const esObjeto = (x) => x && typeof x === "object" && !Array.isArray(x);
const fusionar = (a, b) => {
  if (!esObjeto(a) || !esObjeto(b)) return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in a ? fusionar(a[k], v) : v;
  return out;
};

const hechos = [];
const errores = [];
for (const { dir, origen } of fuentes) {
  if (!fs.existsSync(dir)) {
    console.log(`  (no existe ${origen}: se omite)`);
    continue;
  }
  for (const nombre of fs.readdirSync(dir).sort()) {
    const d = path.join(dir, nombre);
    if (nombre.startsWith("_") || nombre.startsWith(".") || !fs.statSync(d).isDirectory()) continue;
    if (hechos.some((h) => h.nombre === nombre)) continue; // el catálogo real manda
    const tj = path.join(d, "tokens.json");
    if (!fs.existsSync(tj)) {
      errores.push(`${origen}${nombre}: sin tokens.json (se omite)`);
      continue;
    }
    let tokens;
    try {
      tokens = JSON.parse(fs.readFileSync(tj, "utf8"));
    } catch (e) {
      errores.push(`${origen}${nombre}/tokens.json no es JSON: ${e.message}`);
      continue;
    }
    // Herencia de un estilo del catálogo (solo estilos de prueba): tokens fusionados y fuentes del base.
    let dirFuentes = d;
    if (tokens._base) {
      const base = path.join(RAIZ, "estilos", tokens._base);
      if (!fs.existsSync(path.join(base, "tokens.json"))) {
        errores.push(`${origen}${nombre}: _base «${tokens._base}» no existe en estilos/`);
        continue;
      }
      const { _base, ...propios } = tokens;
      tokens = fusionar(JSON.parse(fs.readFileSync(path.join(base, "tokens.json"), "utf8")), { ...propios, nombre });
      dirFuentes = base;
      console.log(`  ${nombre}: hereda de estilos/${_base}`);
    }
    const r = tokensSchema.safeParse(tokens);
    if (!r.success) {
      errores.push(`${origen}${nombre}/tokens.json no cumple el contrato: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    const faltan = r.data.tipografia.archivos.filter((a) => !fs.existsSync(path.join(dirFuentes, a.archivo))).map((a) => a.archivo);
    if (faltan.length) {
      errores.push(`${origen}${nombre}: faltan fuentes ${faltan.join(", ")}`);
      continue;
    }
    const dst = path.join(DESTINO, nombre);
    fs.mkdirSync(dst, { recursive: true });
    fs.writeFileSync(path.join(dst, "tokens.json"), JSON.stringify(tokens, null, 2));
    const md = fs.existsSync(path.join(d, "estilo.md")) ? path.join(d, "estilo.md") : path.join(dirFuentes, "estilo.md");
    if (fs.existsSync(md)) fs.copyFileSync(md, path.join(dst, "estilo.md"));
    if (fs.existsSync(path.join(dirFuentes, "fonts"))) copiarDir(path.join(dirFuentes, "fonts"), path.join(dst, "fonts"));
    hechos.push({ nombre, origen, bytes: tam(dst) });
  }
}

// Efectos de sonido sintetizados (mono, 44,1 kHz): ruido rosa filtrado con barrido y un «pop» senoidal corto.
const SFX = path.join(MOTOR, "public", "motor", "sfx");
fs.mkdirSync(SFX, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
if (!fs.existsSync(path.join(SFX, "whoosh.wav"))) {
  ff([
    "-f", "lavfi", "-i", "anoisesrc=color=pink:duration=0.9:amplitude=0.5:seed=7",
    "-af", "highpass=f=300,lowpass=f=5000,afade=t=in:d=0.35:curve=qsin,afade=t=out:st=0.45:d=0.45:curve=qsin,volume=0.8",
    "-ac", "1", "-ar", "44100", path.join(SFX, "whoosh.wav"),
  ]);
}
if (!fs.existsSync(path.join(SFX, "pop.wav"))) {
  ff([
    "-f", "lavfi", "-i", "sine=frequency=880:duration=0.12",
    "-af", "afade=t=in:d=0.005,afade=t=out:st=0.02:d=0.1:curve=exp,volume=0.6",
    "-ac", "1", "-ar", "44100", path.join(SFX, "pop.wav"),
  ]);
}

console.log("\nEstilos en public/estilos/:");
for (const h of hechos) console.log(`  ✓ ${h.nombre.padEnd(28)} ${fmtBytes(h.bytes).padStart(8)}  (${h.origen})`);
for (const e of errores) console.log(`  ✗ ${e}`);
console.log(`\npublic/ total: ${fmtBytes(tam(path.join(MOTOR, "public")))} (sin referencias/)`);
if (!hechos.length) process.exit(1);
