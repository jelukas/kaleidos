// Carga de .env sin dependencias + helpers compartidos por los scripts del pipeline.
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Lee .env (formato KEY=value, # comentarios) y lo vuelca en process.env sin pisar lo ya definido. */
export function loadEnv(file = resolve(ROOT, ".env")) {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function requireEnv(key, hint) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Falta ${key} en .env${hint ? ` — ${hint}` : ""}`);
  }
  return value;
}

/** Parseo mínimo de argv: --flag valor, --bool, y posicionales. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }
  return { flags, positional };
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Duración en segundos de un fichero de audio/vídeo vía ffprobe. */
export function probeDuration(file) {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(`ffprobe falló en ${file}: ${r.stderr?.trim()}`);
  const seconds = Number.parseFloat(r.stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`ffprobe devolvió duración inválida para ${file}`);
  return Math.round(seconds * 1000) / 1000;
}

/** Ejecuta `tareas` (funciones que devuelven promesa) con un límite de concurrencia. */
export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}
