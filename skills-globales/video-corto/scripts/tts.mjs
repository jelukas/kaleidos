#!/usr/bin/env node
// Genera la locución de un vídeo con ElevenLabs contra un endpoint LOCAL.
//
//   node scripts/tts.mjs <slug> [--force] [--concurrency 3] [--voice <id>]
//   node scripts/tts.mjs --check          # comprueba que el endpoint responde
//
// Entrada : videos/<slug>/script.json
// Salida  : videos/<slug>/assets/voice/<lineId>.wav
//           videos/<slug>/assets/voice.manifest.json  (duraciones + starts acumulados)
//
// El manifest es lo que consume la composición para cuadrar los cortes con la voz.
import { createHash } from "node:crypto";
import { existsSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { ROOT, loadEnv, requireEnv, parseArgs, ensureDir, probeDuration, pool, readJson } from "./lib/config.mjs";

loadEnv();
const { flags, positional } = parseArgs();

const BASE = (process.env.ELEVENLABS_BASE_URL || "").replace(/\/+$/, "");
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

function headers() {
  const h = { "Content-Type": "application/json", Accept: "audio/mpeg" };
  const key = process.env.ELEVENLABS_API_KEY;
  if (key) h["xi-api-key"] = key;
  return h;
}

async function check() {
  requireEnv("ELEVENLABS_BASE_URL", "URL de tu API local de ElevenLabs");
  const url = `${BASE}/v1/voices`;
  process.stdout.write(`→ GET ${url}\n`);
  const res = await fetch(url, { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY || "" } });
  const body = await res.text();
  process.stdout.write(`← ${res.status} ${res.statusText}\n${body.slice(0, 2000)}\n`);
  if (!res.ok) process.exitCode = 1;
}

/** Sintetiza una línea: POST /v1/text-to-speech/{voice} → mp3 → wav 48 kHz. */
async function synthesize({ text, voiceId, outWav, modelId, voiceSettings, speed }) {
  const url = `${BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const payload = { text, model_id: modelId };
  if (voiceSettings) payload.voice_settings = voiceSettings;
  if (speed && speed !== 1) payload.speed = speed;

  const res = await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(payload) });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TTS ${res.status} ${res.statusText} — ${detail.slice(0, 500)}`);
  }
  const mp3 = Buffer.from(await res.arrayBuffer());
  if (mp3.length === 0) throw new Error("TTS devolvió un audio vacío");

  const tmpMp3 = `${outWav}.tmp.mp3`;
  writeFileSync(tmpMp3, mp3);
  // loudnorm (EBU R128) hace dos cosas imprescindibles: iguala el volumen entre
  // líneas —ElevenLabs varía de una a otra— y deja 3 dB de techo. Sin esto la
  // voz sale a -0,7 dB, sin aire para la música, y la mezcla final satura.
  const ff = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", tmpMp3,
    "-af", "loudnorm=I=-16:TP=-3.0:LRA=11",
    "-ar", "48000", "-ac", "1", outWav,
  ]);
  rmSync(tmpMp3, { force: true });
  if (ff.status !== 0) throw new Error(`ffmpeg falló: ${ff.stderr?.toString().trim()}`);
}

async function main() {
  if (flags.check) return check();

  const slug = positional[0];
  if (!slug) throw new Error("Uso: node scripts/tts.mjs <slug> [--force]");

  requireEnv("ELEVENLABS_BASE_URL", "URL de tu API local de ElevenLabs");

  const videoDir = resolve(ROOT, "videos", slug);
  const scriptFile = join(videoDir, "script.json");
  if (!existsSync(scriptFile)) throw new Error(`No existe ${scriptFile}`);

  const script = readJson(scriptFile);
  const lines = script.lines ?? [];
  if (lines.length === 0) throw new Error("script.json no tiene 'lines'");

  const voiceDir = ensureDir(join(videoDir, "assets", "voice"));
  const manifestFile = join(videoDir, "assets", "voice.manifest.json");
  const previous = existsSync(manifestFile) ? readJson(manifestFile) : { lines: [] };
  const previousById = new Map(previous.lines.map((l) => [l.id, l]));

  const defaultVoice = flags.voice || script.voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!defaultVoice) throw new Error("Falta voiceId (en script.json, ELEVENLABS_VOICE_ID o --voice)");

  const modelId = script.modelId || MODEL_ID;
  const concurrency = Number(flags.concurrency || 3);
  const force = Boolean(flags.force);

  const results = await pool(lines, concurrency, async (line) => {
    if (!line.id || !line.text) throw new Error(`Línea inválida: ${JSON.stringify(line)}`);
    const voiceId = line.voiceId || defaultVoice;
    const hash = createHash("sha256")
      .update(JSON.stringify([line.text, voiceId, modelId, line.speed ?? 1, script.voiceSettings ?? null]))
      .digest("hex")
      .slice(0, 16);

    const outWav = join(voiceDir, `${line.id}.wav`);
    const cached = previousById.get(line.id);
    if (!force && cached?.hash === hash && existsSync(outWav)) {
      process.stdout.write(`= ${line.id} (cache)\n`);
      return { ...cached, cached: true };
    }

    await synthesize({
      text: line.text,
      voiceId,
      outWav,
      modelId,
      voiceSettings: script.voiceSettings,
      speed: line.speed,
    });
    const duration = probeDuration(outWav);
    process.stdout.write(`✓ ${line.id}  ${duration}s\n`);
    return { id: line.id, text: line.text, file: `assets/voice/${line.id}.wav`, duration, hash };
  });

  // starts acumulados: cada línea entra cuando termina la anterior + su gap.
  let cursor = 0;
  const withTiming = results.map((r, i) => {
    const gap = i === 0 ? (lines[i].gapBefore ?? 0) : (lines[i].gapBefore ?? script.defaultGap ?? 0.12);
    cursor += gap;
    const start = Math.round(cursor * 1000) / 1000;
    cursor += r.duration;
    return { id: r.id, text: r.text, file: r.file, start, duration: r.duration, hash: r.hash };
  });

  const manifest = {
    slug,
    voiceId: defaultVoice,
    modelId,
    totalDuration: Math.round(cursor * 1000) / 1000,
    lines: withTiming,
  };
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`\n→ ${manifestFile}\n  duración total: ${manifest.totalDuration}s (${withTiming.length} líneas)\n`);
}

main().catch((err) => {
  process.stderr.write(`\n✗ ${err.message}\n`);
  process.exit(1);
});
