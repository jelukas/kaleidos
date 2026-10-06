#!/usr/bin/env node
// Música (composition_plan o prompt) y efectos con ElevenLabs desde una especificación JSON.
//
//   node scripts/el-audio.mjs <spec.json>
//   spec: { "out": "proyectos/x/assets/audio", "music": { "id": "music", "plan": {...} | "prompt": "...", "lengthMs": 40000 },
//           "sfx": { "<id>": ["prompt", seconds], ... } }
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { loadEnv, requireEnv } from "./lib/config.mjs";

loadEnv();
const KEY = requireEnv("ELEVENLABS_API_KEY");
const ROOT = resolve(import.meta.dirname, "..");
const spec = JSON.parse(readFileSync(process.argv[2], "utf8"));
const OUT = join(ROOT, spec.out);
mkdirSync(join(OUT, "sfx"), { recursive: true });

async function post(path, body, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`https://api.elevenlabs.io${path}?output_format=mp3_44100_192`, {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const txt = await res.text();
    if (res.status === 429 && i < tries - 1) { await new Promise((r) => setTimeout(r, 4000 * (i + 1))); continue; }
    throw new Error(`${path} ${res.status}: ${txt.slice(0, 300)}`);
  }
}
function toWav(buf, out, ch) {
  const tmp = out + ".tmp.mp3";
  writeFileSync(tmp, buf);
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-ar", "48000", "-ac", String(ch), out]);
  rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error(r.stderr.toString());
}

const jobs = [];
if (spec.music) {
  const m = spec.music;
  jobs.push((async () => {
    const body = m.plan ? { composition_plan: m.plan, model_id: "music_v1" }
      : { prompt: m.prompt, music_length_ms: m.lengthMs ?? 40000, model_id: "music_v1", force_instrumental: true };
    toWav(await post("/v1/music", body), join(OUT, `${m.id ?? "music"}.wav`), 2);
    console.log("♪", m.id ?? "music");
  })());
}
// efectos en tandas de 6 (límite de concurrencia de la cuenta)
const entries = Object.entries(spec.sfx ?? {}).filter(([id]) => !existsSync(join(OUT, "sfx", `${id}.wav`)));
jobs.push((async () => {
  for (let i = 0; i < entries.length; i += 6) {
    await Promise.all(entries.slice(i, i + 6).map(async ([id, [text, dur]]) => {
      try {
        toWav(await post("/v1/sound-generation", { text, duration_seconds: dur, prompt_influence: 0.45 }), join(OUT, "sfx", `${id}.wav`), 1);
        console.log("✓", id);
      } catch (e) { console.error("✗", id, e.message); }
    }));
  }
})());
const res = await Promise.allSettled(jobs);
res.filter((r) => r.status === "rejected").forEach((r) => console.error("✗", r.reason.message));
