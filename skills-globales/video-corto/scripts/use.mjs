#!/usr/bin/env node
// Marca qué vídeo/formato es el ACTIVO copiándolo a index.html.
//
//   node scripts/use.mjs <slug> [vertical|horizontal]
//
// `hyperframes lint|check|preview` solo operan sobre el index.html del proyecto,
// así que este script es el que decide sobre qué se está trabajando.
// Para renderizar no hace falta: `render -c videos/<slug>/<formato>.html`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT, parseArgs } from "./lib/config.mjs";

const { positional } = parseArgs();
const slug = positional[0];
const format = positional[1] || "vertical";

if (!slug) {
  process.stderr.write("Uso: node scripts/use.mjs <slug> [vertical|horizontal]\n");
  process.exit(1);
}
if (!["vertical", "horizontal"].includes(format)) {
  process.stderr.write(`Formato inválido: ${format} (vertical | horizontal)\n`);
  process.exit(1);
}

const source = join(ROOT, "videos", slug, `${format}.html`);
if (!existsSync(source)) {
  process.stderr.write(`No existe ${source}\n`);
  process.exit(1);
}

// El banner va DESPUÉS del doctype: el linter exige que el fichero empiece por
// `<!doctype html>` (regla root_composition_missing_html_wrapper).
const banner = `<!-- GENERADO por scripts/use.mjs — editar videos/${slug}/${format}.html, no este fichero. -->`;
const html = readFileSync(source, "utf8").replace(
  /^(<!doctype html>)/i,
  `$1\n${banner}`,
);
writeFileSync(resolve(ROOT, "index.html"), html);
writeFileSync(
  resolve(ROOT, ".active.json"),
  `${JSON.stringify({ slug, format }, null, 2)}\n`,
);
process.stdout.write(`✓ activo: ${slug} (${format})\n  npm run dev · npm run check\n`);
