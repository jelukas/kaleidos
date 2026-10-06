#!/usr/bin/env node
// Música de fondo y efectos de sonido con ElevenLabs.
//
//   node scripts/audio.mjs <slug> [--force] [--only music|sfx]
//
// Entrada : videos/<slug>/audio.json
// Salida  : videos/<slug>/assets/audio/<id>.wav          (música)
//           videos/<slug>/assets/audio/sfx/<id>.wav      (efectos)
//           videos/<slug>/assets/audio.manifest.json
//
// Endpoints (mismo ELEVENLABS_BASE_URL que la locución):
//   música  → POST /v1/music            { prompt, music_length_ms, force_instrumental }
//   efectos → POST /v1/sound-generation { text, duration_seconds, prompt_influence }
import { createHash } from "node:crypto";
import { existsSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { ROOT, loadEnv, requireEnv, parseArgs, ensureDir, probeDuration, pool, readJson } from "./lib/config.mjs";

loadEnv();
const { flags, positional } = parseArgs();

const BASE = (process.env.ELEVENLABS_BASE_URL || "").replace(/\/+$/, "");
const headers = () => ({
  "Content-Type": "application/json",
  Accept: "audio/mpeg",
  "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
});

/** mp3 → wav 48 kHz estéreo (la locución va en mono; la música conviene en estéreo). */
function toWav(mp3, outWav, channels) {
  const tmp = `${outWav}.tmp.mp3`;
  writeFileSync(tmp, mp3);
  const ff = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", tmp, "-ar", "48000", "-ac", String(channels), outWav,
  ]);
  rmSync(tmp, { force: true });
  if (ff.status !== 0) throw new Error(`ffmpeg falló: ${ff.stderr?.toString().trim()}`);
}

async function post(path, body, label) {
  const res = await fetch(`${BASE}${path}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${label} ${res.status} ${res.statusText} — ${detail.slice(0, 400)}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error(`${label} devolvió audio vacío`);
  return bytes;
}

async function main() {
  const slug = positional[0];
  if (!slug) throw new Error("Uso: node scripts/audio.mjs <slug> [--force] [--only music|sfx]");
  requireEnv("ELEVENLABS_BASE_URL");
  requireEnv("ELEVENLABS_API_KEY");

  const videoDir = resolve(ROOT, "videos", slug);
  const specFile = join(videoDir, "audio.json");
  if (!existsSync(specFile)) throw new Error(`No existe ${specFile}`);

  const spec = readJson(specFile);
  const audioDir = ensureDir(join(videoDir, "assets", "audio"));
  const sfxDir = ensureDir(join(audioDir, "sfx"));
  const manifestFile = join(videoDir, "assets", "audio.manifest.json");
  const previous = existsSync(manifestFile) ? readJson(manifestFile) : { music: [], sfx: [] };
  const prevMusic = new Map((previous.music ?? []).map((m) => [m.id, m]));
  const prevSfx = new Map((previous.sfx ?? []).map((s) => [s.id, s]));

  const force = Boolean(flags.force);
  const only = flags.only;

  // ── Música ────────────────────────────────────────────────────────────────
  const musicSpec = spec.music ? (Array.isArray(spec.music) ? spec.music : [spec.music]) : [];
  const music = only === "sfx" ? (previous.music ?? []) : await pool(musicSpec, 1, async (m) => {
    if (!m.id || !m.prompt) throw new Error(`Música inválida: ${JSON.stringify(m)}`);
    // force_instrumental por defecto: la voz manda, la música solo acompaña.
    const instrumental = m.instrumental ?? true;
    const lengthMs = m.lengthMs ?? 30000;
    const modelId = m.modelId ?? spec.musicModelId ?? "music_v2";
    const hash = createHash("sha256")
      .update(JSON.stringify([m.prompt, lengthMs, instrumental, modelId]))
      .digest("hex").slice(0, 16);

    const outWav = join(audioDir, `${m.id}.wav`);
    const cached = prevMusic.get(m.id);
    if (!force && cached?.hash === hash && existsSync(outWav)) {
      process.stdout.write(`= ${m.id} (cache)\n`);
      return cached;
    }
    if (lengthMs < 3000 || lengthMs > 600000) throw new Error("lengthMs debe estar entre 3000 y 600000");

    const bytes = await post("/v1/music", {
      prompt: m.prompt, music_length_ms: lengthMs, model_id: modelId, force_instrumental: instrumental,
    }, "música");
    toWav(bytes, outWav, 2);
    const duration = probeDuration(outWav);
    process.stdout.write(`♪ ${m.id}  ${duration}s\n`);
    return { id: m.id, prompt: m.prompt, file: `assets/audio/${m.id}.wav`, duration, instrumental, modelId, hash };
  });

  // ── Efectos ───────────────────────────────────────────────────────────────
  const sfxSpec = spec.sfx ?? [];
  const sfx = only === "music" ? (previous.sfx ?? []) : await pool(sfxSpec, 3, async (s) => {
    if (!s.id || !s.prompt) throw new Error(`SFX inválido: ${JSON.stringify(s)}`);
    const seconds = s.durationSeconds ?? null;
    const influence = s.promptInfluence ?? 0.3;
    const hash = createHash("sha256")
      .update(JSON.stringify([s.prompt, seconds, influence, s.loop ?? false]))
      .digest("hex").slice(0, 16);

    const outWav = join(sfxDir, `${s.id}.wav`);
    const cached = prevSfx.get(s.id);
    if (!force && cached?.hash === hash && existsSync(outWav)) {
      process.stdout.write(`= ${s.id} (cache)\n`);
      return cached;
    }
    if (seconds !== null && (seconds < 0.5 || seconds > 30))
      throw new Error(`${s.id}: durationSeconds debe estar entre 0.5 y 30`);

    const body = { text: s.prompt, prompt_influence: influence, loop: s.loop ?? false };
    if (seconds !== null) body.duration_seconds = seconds;
    const bytes = await post("/v1/sound-generation", body, "sfx");
    toWav(bytes, outWav, 1);
    const duration = probeDuration(outWav);
    process.stdout.write(`✓ ${s.id}  ${duration}s\n`);
    return { id: s.id, prompt: s.prompt, file: `assets/audio/sfx/${s.id}.wav`, duration, hash };
  });

  writeFileSync(manifestFile, `${JSON.stringify({ slug, music, sfx }, null, 2)}\n`);
  process.stdout.write(`\n→ ${manifestFile}\n  ${music.length} música · ${sfx.length} efectos\n`);
}

main().catch((err) => {
  process.stderr.write(`\n✗ ${err.message}\n`);
  process.exit(1);
});
