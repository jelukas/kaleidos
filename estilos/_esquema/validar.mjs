#!/usr/bin/env node
// Valida el catálogo de estilos sin dependencias (Node 22).
//
//   node estilos/_esquema/validar.mjs                 # todos los estilos
//   node estilos/_esquema/validar.mjs curso-azul      # uno o varios
//   node estilos/_esquema/validar.mjs --detalle       # imprime todos los contrastes
//
// Comprueba, por estilo:
//   1. tokens.json contra tokens.schema.json (docs/CONTRATO.md §5): claves obligatorias, sin extras, tipos,
//      enumerados y patrones; `nombre` igual a la carpeta; `modo` coherente con fondo y texto.
//   2. Fuentes: cada archivo de `tipografia.archivos` existe y es WOFF2; cada rol (titular, cuerpo,
//      etiqueta, mono) tiene su familia y peso con subconjunto latin; cada familia tiene su licencia
//      OFL/Apache en fonts/; en fonts/ solo hay .woff2 y .txt.
//   3. Contraste WCAG 2.x: texto y textoSuave ≥ 4,5 sobre fondo y superficie (AA texto normal); acento ≥ 3
//      sobre fondo (AA texto grande). Con palabraActiva "subrayado", texto ≥ 4,5 sobre superficie2.
//      Avisos (no fallan): texto sobre superficie2, capítulos y semánticos sobre fondo por debajo de 3.
//   4. estilo.md: frontmatter YAML con colors y typography; todos los hex y familias de tokens.json
//      aparecen en la guía (tokens y guía no se desincronizan).
//   5. referencias/: de 3 a 6 JPG de 960 px de ancho.
// Sale con código 1 si hay algún error.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const SCHEMA = JSON.parse(readFileSync(join(AQUI, "tokens.schema.json"), "utf8"));
const args = process.argv.slice(2);
const DETALLE = args.includes("--detalle");
const pedidos = args.filter((a) => !a.startsWith("--"));

// ── Validador mínimo de JSON Schema (el subconjunto que usa tokens.schema.json) ──────────────
function resolverRef(ref) {
  if (!ref.startsWith("#/")) throw new Error(`$ref no soportado: ${ref}`);
  return ref.slice(2).split("/").reduce((o, k) => o[k], SCHEMA);
}
const tipoDe = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : Number.isInteger(v) ? "integer" : typeof v);
function validarEsquema(v, s, ruta, errores) {
  if (s.$ref) validarEsquema(v, resolverRef(s.$ref), ruta, errores);
  if (s.type) {
    const t = tipoDe(v);
    const ok = s.type === t || (s.type === "number" && t === "integer");
    if (!ok) return errores.push(`${ruta}: se esperaba ${s.type} y hay ${t}`);
  }
  if (s.enum && !s.enum.includes(v)) errores.push(`${ruta}: «${v}» no está en [${s.enum.join(", ")}]`);
  if (typeof v === "string") {
    if (s.minLength != null && v.length < s.minLength) errores.push(`${ruta}: texto demasiado corto`);
    if (s.pattern && !new RegExp(s.pattern).test(v)) errores.push(`${ruta}: «${v}» no cumple ${s.pattern}`);
  }
  if (typeof v === "number") {
    if (s.minimum != null && v < s.minimum) errores.push(`${ruta}: ${v} < ${s.minimum}`);
    if (s.maximum != null && v > s.maximum) errores.push(`${ruta}: ${v} > ${s.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems != null && v.length < s.minItems) errores.push(`${ruta}: menos de ${s.minItems} elementos`);
    if (s.maxItems != null && v.length > s.maxItems) errores.push(`${ruta}: más de ${s.maxItems} elementos`);
    if (s.items) v.forEach((x, i) => validarEsquema(x, s.items, `${ruta}[${i}]`, errores));
  }
  if (tipoDe(v) === "object") {
    for (const k of s.required || []) if (!(k in v)) errores.push(`${ruta}: falta la clave «${k}»`);
    // Con $ref, las propiedades y additionalProperties del destino ya se comprobaron arriba.
    const props = s.properties || {};
    for (const [k, x] of Object.entries(v)) {
      if (props[k]) validarEsquema(x, props[k], `${ruta}.${k}`, errores);
      else if (s.additionalProperties === false) errores.push(`${ruta}: clave no admitida «${k}»`);
    }
  }
}

// ── Color y contraste (WCAG 2.x) ─────────────────────────────────────────────────────────────
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── Utilidades de archivos ───────────────────────────────────────────────────────────────────
function anchoJpeg(ruta) {
  const b = readFileSync(ruta);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { ancho: b.readUInt16BE(i + 7), alto: b.readUInt16BE(i + 5) };
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
const esWoff2 = (ruta) => readFileSync(ruta).subarray(0, 4).toString("latin1") === "wOF2";
const subconjunto = (archivo) => (/-latin-ext-\d{3}-/.test(archivo) ? "latin-ext" : /-latin-\d{3}-/.test(archivo) ? "latin" : "otro");

// ── Validación de un estilo ──────────────────────────────────────────────────────────────────
function validarEstilo(nombre) {
  const dir = join(RAIZ, nombre);
  const E = [], A = [], C = [];
  const res = { nombre, errores: E, avisos: A, contrastes: C, modo: "?", fuentes: "" };
  const rutaTok = join(dir, "tokens.json");
  if (!existsSync(rutaTok)) { E.push("falta tokens.json"); return res; }
  let t;
  try { t = JSON.parse(readFileSync(rutaTok, "utf8")); } catch (e) { E.push(`tokens.json no es JSON válido: ${e.message}`); return res; }
  validarEsquema(t, SCHEMA, "tokens", E);
  if (E.length) return res; // sin esquema válido el resto no tiene sentido
  res.modo = t.modo;
  res.fuentes = [...new Set(["titular", "cuerpo", "etiqueta", "mono"].map((r) => t.tipografia[r].familia))].join(" + ");
  if (t.nombre !== nombre) E.push(`nombre «${t.nombre}» ≠ carpeta «${nombre}»`);
  const col = t.color;
  const oscuro = lum(col.fondo) < lum(col.texto);
  if ((t.modo === "oscuro") !== oscuro) E.push(`modo «${t.modo}» incoherente: el fondo es más ${oscuro ? "oscuro" : "claro"} que el texto`);

  // Contraste
  const reglas = [
    ["texto", "fondo", 4.5, "error"], ["textoSuave", "fondo", 4.5, "error"],
    ["texto", "superficie", 4.5, "error"], ["textoSuave", "superficie", 4.5, "error"],
    ["acento", "fondo", 3, "error"],
    ["texto", "superficie2", 4.5, t.subtitulos.palabraActiva === "subrayado" ? "error" : "aviso"],
    ["ok", "fondo", 3, "aviso"], ["aviso", "fondo", 3, "aviso"], ["error", "fondo", 3, "aviso"],
  ];
  for (const [a, b, min, nivel] of reglas) {
    const r = contraste(col[a], col[b]);
    C.push({ par: `${a}/${b}`, r, min, ok: r >= min });
    if (r < min) (nivel === "error" ? E : A).push(`contraste ${a} ${col[a]} sobre ${b} ${col[b]} = ${r.toFixed(2)} < ${min}`);
  }
  col.capitulos.forEach((c, i) => {
    const r = contraste(c, col.fondo);
    C.push({ par: `capitulos[${i}]/fondo`, r, min: 3, ok: r >= 3 });
    if (r < 3) A.push(`contraste capitulos[${i}] ${c} sobre fondo = ${r.toFixed(2)} < 3`);
  });

  // Fuentes
  const fdir = join(dir, "fonts");
  if (!existsSync(fdir)) E.push("falta fonts/");
  else {
    const enDisco = readdirSync(fdir).filter((f) => !f.startsWith("."));
    for (const f of enDisco) if (!/\.(woff2|txt)$/.test(f)) E.push(`fonts/${f}: solo se admiten .woff2 y licencias .txt`);
    const usados = new Set();
    for (const a of t.tipografia.archivos) {
      const ruta = join(dir, a.archivo);
      usados.add(a.archivo.replace(/^fonts\//, ""));
      if (!existsSync(ruta)) { E.push(`no existe ${a.archivo}`); continue; }
      if (!esWoff2(ruta)) E.push(`${a.archivo} no es WOFF2`);
      if (statSync(ruta).size < 1000) E.push(`${a.archivo} parece vacío`);
    }
    for (const f of enDisco) if (f.endsWith(".woff2") && !usados.has(f)) A.push(`fonts/${f} no aparece en tipografia.archivos`);
    for (const rol of ["titular", "cuerpo", "etiqueta", "mono"]) {
      const { familia, peso } = t.tipografia[rol];
      const hay = t.tipografia.archivos.some((a) => a.familia === familia && a.peso === peso && a.estilo === "normal" && subconjunto(a.archivo) === "latin");
      if (!hay) E.push(`rol ${rol}: no hay archivo latin de ${familia} ${peso}`);
    }
    // latin-ext antes que latin (si un motor ignora unicode-range, gana latin, que cubre el español)
    const vistos = new Map();
    t.tipografia.archivos.forEach((a, i) => {
      const k = `${a.familia}|${a.peso}|${a.estilo}`;
      const s = subconjunto(a.archivo);
      if (s === "latin") vistos.set(k, i);
      if (s === "latin-ext" && vistos.has(k)) A.push(`${a.archivo}: latin-ext debería ir antes que latin`);
    });
    for (const fam of new Set(t.tipografia.archivos.map((a) => a.familia))) {
      const slug = fam.replace(/\s+/g, "");
      const lic = [`OFL-${slug}.txt`, `LICENSE-${slug}.txt`].map((n) => join(fdir, n)).find(existsSync);
      if (!lic) { E.push(`falta la licencia de ${fam} (fonts/OFL-${slug}.txt)`); continue; }
      if (!/SIL OPEN FONT LICENSE|Apache License/i.test(readFileSync(lic, "utf8"))) E.push(`${lic.split("/").pop()} no es OFL ni Apache-2.0`);
    }
  }

  // estilo.md
  const rutaMd = join(dir, "estilo.md");
  if (!existsSync(rutaMd)) E.push("falta estilo.md");
  else {
    const md = readFileSync(rutaMd, "utf8");
    const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) E.push("estilo.md: falta el frontmatter YAML (--- … ---)");
    else {
      for (const k of ["name", "colors", "typography", "radii", "components"]) if (!new RegExp(`^${k}:`, "m").test(fm[1])) E.push(`estilo.md: el frontmatter no tiene «${k}:»`);
    }
    const low = md.toLowerCase();
    const hexes = new Set([...Object.entries(col).filter(([k]) => k !== "capitulos").map(([, v]) => v), ...col.capitulos]);
    for (const h of hexes) if (!low.includes(h.toLowerCase())) E.push(`estilo.md no menciona el color ${h} de tokens.json`);
    for (const fam of new Set(t.tipografia.archivos.map((a) => a.familia))) if (!md.includes(fam)) E.push(`estilo.md no menciona la familia ${fam}`);
  }

  // referencias
  const rdir = join(dir, "referencias");
  if (!existsSync(rdir)) E.push("falta referencias/");
  else {
    const jpgs = readdirSync(rdir).filter((f) => /\.jpe?g$/i.test(f));
    const otros = readdirSync(rdir).filter((f) => !/\.jpe?g$/i.test(f) && !f.startsWith("."));
    if (jpgs.length < 3 || jpgs.length > 6) E.push(`referencias/: ${jpgs.length} JPG (deben ser de 3 a 6)`);
    for (const o of otros) A.push(`referencias/${o}: no es JPG`);
    for (const j of jpgs) {
      const d = anchoJpeg(join(rdir, j));
      if (!d) E.push(`referencias/${j}: no se puede leer como JPEG`);
      else if (d.ancho !== 960) E.push(`referencias/${j}: ${d.ancho} px de ancho (deben ser 960)`);
    }
    res.referencias = jpgs.length;
  }
  return res;
}

// ── Ejecución ────────────────────────────────────────────────────────────────────────────────
const estilos = (pedidos.length ? pedidos : readdirSync(RAIZ)).filter((n) => !n.startsWith("_") && !n.startsWith(".") && statSync(join(RAIZ, n)).isDirectory());
if (!estilos.length) { console.error("No hay estilos que validar."); process.exit(1); }
let fallos = 0;
const filas = [];
for (const n of estilos) {
  const r = validarEstilo(n);
  const ok = r.errores.length === 0;
  if (!ok) fallos++;
  const peor = r.contrastes.filter((c) => /^(texto|textoSuave|acento)\//.test(c.par) && !c.par.endsWith("superficie2")).sort((a, b) => a.r / a.min - b.r / b.min)[0];
  filas.push([ok ? "✓" : "✗", n, r.modo, r.fuentes, peor ? `${peor.par} ${peor.r.toFixed(2)}` : "—", String(r.referencias ?? 0), `${r.errores.length}/${r.avisos.length}`]);
  console.log(`\n${ok ? "✓" : "✗"} ${n}`);
  for (const e of r.errores) console.log(`   ✗ ${e}`);
  for (const a of r.avisos) console.log(`   · aviso: ${a}`);
  if (DETALLE) for (const c of r.contrastes) console.log(`   ${c.ok ? " " : "!"} ${c.par.padEnd(22)} ${c.r.toFixed(2).padStart(6)}  (mín. ${c.min})`);
}
const cab = ["", "estilo", "modo", "tipografías", "contraste más justo", "refs", "err/avisos"];
const anchos = cab.map((h, i) => Math.max(h.length, ...filas.map((f) => f[i].length)));
const linea = (f) => f.map((x, i) => x.padEnd(anchos[i])).join("  ");
console.log(`\n${linea(cab)}\n${anchos.map((w) => "─".repeat(w)).join("  ")}`);
for (const f of filas) console.log(linea(f));
console.log(`\n${estilos.length - fallos}/${estilos.length} estilos en verde.`);
process.exit(fallos ? 1 : 0);
