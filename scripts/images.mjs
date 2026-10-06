#!/usr/bin/env node
// Genera las imágenes B-roll de un vídeo con gpt-image-2 (calidad low).
//
//   node scripts/images.mjs <slug> [--force] [--concurrency 3]
//                                  [--format vertical|horizontal] [--quality low|medium|high]
//
// Entrada : proyectos/<slug>/images.json
// Salida  : proyectos/<slug>/assets/images/<id>.jpg
//           proyectos/<slug>/assets/images.manifest.json
//
// gpt-image-2 admite resoluciones arbitrarias; si el endpoint rechaza la nativa
// (1080x1920 / 1920x1080) se reintenta con el tamaño documentado más cercano.
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT, loadEnv, requireEnv, parseArgs, ensureDir, pool, readJson } from "./lib/config.mjs";

loadEnv();
const { flags, positional } = parseArgs();

// gpt-image-2 exige ancho y alto DIVISIBLES POR 16, así que 1080x1920 y
// 1920x1080 (el tamaño del stage) son inválidos: 1080/16 = 67,5.
// 1152x2048 y 2048x1152 son 9:16 y 16:9 exactos, cumplen la regla y quedan por
// encima del stage, lo que deja margen de sobra para el Ken Burns.
const SIZES = {
  vertical: { native: "1152x2048", fallback: "1024x1536" },
  horizontal: { native: "2048x1152", fallback: "1536x1024" },
  square: { native: "1024x1024", fallback: "1024x1024" },
};

async function generate({ prompt, size, quality, model, baseUrl, apiKey }) {
  const res = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size, quality, n: 1, output_format: "jpeg" }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`imagen ${res.status} ${res.statusText} — ${detail.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`respuesta sin b64_json: ${JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(b64, "base64");
}

async function main() {
  const slug = positional[0];
  if (!slug) throw new Error("Uso: node scripts/images.mjs <slug> [--force]");

  const apiKey = requireEnv("OPENAI_API_KEY", "clave para gpt-image-2");
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  const model = process.env.IMAGE_MODEL || "gpt-image-2";

  const videoDir = resolve(ROOT, "proyectos", slug);
  const specFile = join(videoDir, "images.json");
  if (!existsSync(specFile)) throw new Error(`No existe ${specFile}`);

  const spec = readJson(specFile);
  const images = spec.images ?? [];
  if (images.length === 0) throw new Error("images.json no tiene 'images'");

  const format = flags.format || spec.format || "vertical";
  if (!SIZES[format]) throw new Error(`format debe ser: ${Object.keys(SIZES).join(" | ")}`);
  const quality = flags.quality || spec.quality || process.env.IMAGE_QUALITY || "low";
  const style = spec.style ? `${spec.style.trim()} ` : "";

  const imagesDir = ensureDir(join(videoDir, "assets", "images"));
  const manifestFile = join(videoDir, "assets", "images.manifest.json");
  const previous = existsSync(manifestFile) ? readJson(manifestFile) : { images: [] };
  const previousById = new Map(previous.images.map((i) => [i.id, i]));

  const concurrency = Number(flags.concurrency || 3);
  const force = Boolean(flags.force);

  const results = await pool(images, concurrency, async (img) => {
    if (!img.id || !img.prompt) throw new Error(`Imagen inválida: ${JSON.stringify(img)}`);
    const fullPrompt = `${style}${img.prompt}`;
    const imgFormat = img.format || format;
    const sizes = SIZES[imgFormat];
    const size = img.size || sizes.native;
    const hash = createHash("sha256")
      .update(JSON.stringify([fullPrompt, size, quality, model]))
      .digest("hex")
      .slice(0, 16);

    const outFile = join(imagesDir, `${img.id}.jpg`);
    const cached = previousById.get(img.id);
    if (!force && cached?.hash === hash && existsSync(outFile)) {
      process.stdout.write(`= ${img.id} (cache)\n`);
      return cached;
    }

    let used = size;
    let bytes;
    try {
      bytes = await generate({ prompt: fullPrompt, size, quality, model, baseUrl, apiKey });
    } catch (err) {
      if (err.status !== 400 || size === sizes.fallback) throw err;
      process.stdout.write(`! ${img.id}: ${size} rechazado, reintento con ${sizes.fallback}\n`);
      used = sizes.fallback;
      bytes = await generate({ prompt: fullPrompt, size: used, quality, model, baseUrl, apiKey });
    }

    writeFileSync(outFile, bytes);
    process.stdout.write(`✓ ${img.id}  ${used}  ${(bytes.length / 1024).toFixed(0)} KB\n`);
    return {
      id: img.id,
      prompt: fullPrompt,
      file: `assets/images/${img.id}.jpg`,
      size: used,
      format: imgFormat,
      quality,
      hash,
    };
  });

  writeFileSync(
    manifestFile,
    `${JSON.stringify({ slug, model, quality, format, images: results }, null, 2)}\n`,
  );
  process.stdout.write(`\n→ ${manifestFile}\n  ${results.length} imágenes\n`);
}

main().catch((err) => {
  process.stderr.write(`\n✗ ${err.message}\n`);
  process.exit(1);
});
