#!/usr/bin/env node
// Audio del promo de Ensaya con ElevenLabs: música por secciones (composition_plan),
// voz de Clara (eleven_v3) y efectos de interfaz.
//
//   node scripts/ensaya-audio.mjs [--only music|voice|sfx]
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { loadEnv, requireEnv } from "./lib/config.mjs";

loadEnv();
const KEY = requireEnv("ELEVENLABS_API_KEY");
const BASE = "https://api.elevenlabs.io";
const OUT = resolve(import.meta.dirname, "../proyectos/ensaya-promo/assets/audio");
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
mkdirSync(join(OUT, "sfx"), { recursive: true });

async function post(path, body) {
  const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}output_format=mp3_44100_192`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return Buffer.from(await res.arrayBuffer());
}
function toWav(buf, out, ch, af) {
  const tmp = out + ".tmp.mp3";
  writeFileSync(tmp, buf);
  const args = ["-y", "-loglevel", "error", "-i", tmp];
  if (af) args.push("-af", af);
  args.push("-ar", "48000", "-ac", String(ch), out);
  const r = spawnSync("ffmpeg", args);
  rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error(r.stderr.toString());
}

const jobs = [];

if (!only || only === "music") {
  jobs.push((async () => {
    const plan = {
      positive_global_styles: ["modern minimal electronic pop", "118 bpm", "warm analog synths", "crisp tight drums", "premium tech brand spot", "optimistic", "clean mix"],
      negative_global_styles: ["vocals", "lyrics", "epic orchestral", "dubstep", "lo-fi hiss", "cheesy corporate ukulele"],
      sections: [
        { section_name: "held breath", duration_ms: 10200, lines: [],
          positive_local_styles: ["sparse and tense", "soft ticking clock-like hi-hat", "low filtered synth pulse", "lots of space", "slow build, filter slowly opening"],
          negative_local_styles: ["kick drum", "melody", "big drums"] },
        { section_name: "the groove", duration_ms: 16600, lines: [],
          positive_local_styles: ["drop on the first beat", "bright bouncy groove", "punchy kick and claps", "plucky synth arpeggio", "confident and light"],
          negative_local_styles: ["breakdown", "silence"] },
        { section_name: "lift", duration_ms: 4200, lines: [],
          positive_local_styles: ["energy lift", "open hats", "short rising synth sweep into the last section"],
          negative_local_styles: ["slowdown"] },
        { section_name: "resolve", duration_ms: 5400, lines: [],
          positive_local_styles: ["warm resolving chord", "final clean hit then soft reverb tail", "confident ending"],
          negative_local_styles: ["fade loop", "new melody"] },
      ],
    };
    const buf = await post("/v1/music", { composition_plan: plan, model_id: "music_v1" });
    toWav(buf, join(OUT, "music.wav"), 2);
    console.log("♪ music");
  })());
}

if (!only || only === "voice") {
  // Clara: voz femenina peninsular cálida y creíble; 0,6 s de silencio delante para colocar la frase
  jobs.push((async () => {
    const voiceId = "kwNLkNjbQHMw9YUFZsHI"; // Alejandra - Credible, Warm and Appealing
    const buf = await post(`/v1/text-to-speech/${voiceId}`, {
      text: "[thoughtful] Me gusta... pero se sale de nuestro presupuesto.",
      model_id: "eleven_v3",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    });
    toWav(buf, join(OUT, "clara.wav"), 1, "loudnorm=I=-16:TP=-3.0:LRA=11,adelay=600|600");
    console.log("🎙 clara");
  })());
}

if (!only || only === "sfx") {
  const sfx = {
    "ui-pop": ["soft rounded UI bubble pop, modern app notification, clean", 0.6],
    "whoosh": ["soft airy premium whoosh transition, smooth", 1.0],
    "whoosh-fast": ["quick tight swish, modern motion graphics", 0.6],
    "tick": ["tiny soft digital tick for a counter, clean", 0.5],
    "clock": ["three slow soft clock ticks in a quiet room", 2.0],
    "mic-on": ["gentle two-note ascending UI chime, microphone activated", 0.8],
    "blips": ["soft chat typing indicator blips, three gentle bubbles", 1.2],
    "thump": ["warm deep soft thump impact, clean sub, short", 1.2],
    "success": ["bright positive UI success chime, warm and satisfying", 1.2],
    "stamp": ["satisfying soft stamp click, UI confirmation", 0.6],
    "riser": ["short airy tonal riser building for one and a half seconds", 1.6],
  };
  for (const [id, [text, dur]] of Object.entries(sfx)) {
    jobs.push((async () => {
      const buf = await post("/v1/sound-generation", { text, duration_seconds: dur, prompt_influence: 0.4 });
      toWav(buf, join(OUT, "sfx", `${id}.wav`), 1);
      console.log("✓", id);
    })());
  }
}

const res = await Promise.allSettled(jobs);
res.filter((r) => r.status === "rejected").forEach((r) => console.error("✗", r.reason.message));
