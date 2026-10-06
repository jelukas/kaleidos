#!/usr/bin/env node
// Renderiza un vídeo en los dos formatos (o en uno concreto).
//
//   node scripts/render.mjs <slug> [--format vertical|horizontal] [--quality high] [--fps 30]
//
// Salida: renders/<slug>-<formato>.mp4
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, parseArgs, ensureDir } from "./lib/config.mjs";

const CLI_VERSION = "0.7.87"; // mismo pin que package.json
const { flags, positional } = parseArgs();
const slug = positional[0];

if (!slug) {
  process.stderr.write("Uso: node scripts/render.mjs <slug> [--format vertical|horizontal]\n");
  process.exit(1);
}

const formats = flags.format ? [flags.format] : ["vertical", "horizontal"];
const quality = flags.quality || "high";
ensureDir(join(ROOT, "renders"));

for (const format of formats) {
  const composition = `videos/${slug}/${format}.html`;
  if (!existsSync(join(ROOT, composition))) {
    process.stderr.write(`✗ falta ${composition}\n`);
    process.exit(1);
  }
  const args = [
    "--yes",
    `hyperframes@${CLI_VERSION}`,
    "render",
    "-c",
    composition,
    "-q",
    quality,
    "-o",
    `renders/${slug}-${format}.mp4`,
  ];
  if (flags.fps) args.push("-f", String(flags.fps));

  process.stdout.write(`\n▶ ${slug} · ${format} · ${quality}\n`);
  const r = spawnSync("npx", args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
