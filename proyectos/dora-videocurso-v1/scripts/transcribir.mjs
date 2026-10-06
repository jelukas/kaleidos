// Transcripción local con whisper.cpp 1.5.5 (modelo medium, español, marcas por palabra con DTW).
//
// El primer intento con el archivo entero entró en un bucle de alucinación tras el primer
// silencio largo (5:14) y no se recuperó. Solución:
//   1. VAD propio a partir de la RMS cada 100 ms del canal de voz (> -50 dBFS = voz),
//      uniendo pausas cortas, para no pasar silencios largos a Whisper.
//   2. Trozos independientes de hasta ~120 s cortados en silencio, con --max-context 0.
//   3. Prompt inicial con vocabulario del tema.
// Todo se queda en work/transcripcion/ (fuera de git y fuera del site).
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const WORK = path.resolve(import.meta.dirname, "..", "work");
const OUT = path.join(WORK, "transcripcion");
const CHUNKS = path.join(WORK, "audio", "trozos");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CHUNKS, { recursive: true });
process.chdir(WORK); // transcribe() deja su JSON temporal en ./tmp

const MODEL = process.env.WHISPER_MODEL ?? "medium";
const PROMPT =
  "Curso sobre el reglamento DORA de resiliencia operativa digital. Proveedores TIC, due diligence, " +
  "ISO 27001, SOC 2, subcontratistas, registro de información, cláusulas contractuales, fintech, banco, " +
  "eurosistema, funciones críticas o importantes, estrategia de salida.";

// 1. VAD a partir de la RMS de 100 ms (generada en el diagnóstico).
const rms = fs
  .readFileSync(path.join(WORK, "diag", "rms100ms.txt"), "utf8")
  .split("\n")
  .filter((l) => l.includes("RMS_level="))
  .map((l) => {
    const v = l.split("=")[1].trim();
    return v.includes("inf") ? -120 : Number(v);
  });
const WIN = 0.1;
const speech = [];
let cur = null;
rms.forEach((v, i) => {
  const t = i * WIN;
  if (v > -50) {
    if (cur && t - cur.end <= 1.5) cur.end = t + WIN;
    else {
      if (cur) speech.push(cur);
      cur = { start: t, end: t + WIN };
    }
  }
});
if (cur) speech.push(cur);
const regions = speech
  .filter((r) => r.end - r.start >= 0.3)
  .map((r) => ({ start: Math.max(0, r.start - 0.3), end: r.end + 0.4 }));

// 2. Agrupar regiones en trozos de hasta 120 s (los huecos entre trozos son silencio).
const chunks = [];
for (const r of regions) {
  const last = chunks.at(-1);
  if (last && r.end - last.start <= 120 && r.start - last.end < 4) last.end = r.end;
  else chunks.push({ ...r });
}
console.log(`regiones de voz: ${regions.length}; trozos: ${chunks.length}`);
fs.writeFileSync(path.join(OUT, "vad.json"), JSON.stringify({ regions, chunks }, null, 1));

const t0 = Date.now();
const all = [];
for (const [i, c] of chunks.entries()) {
  const wav = path.join(CHUNKS, `t_${String(i).padStart(3, "0")}.wav`);
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", c.start.toFixed(2), "-t", (c.end - c.start).toFixed(2),
    "-i", path.join(WORK, "audio", "voz_16k.wav"),
    "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav,
  ]);
  const json = await transcribe({
    inputPath: wav,
    whisperPath: path.join(WORK, "whisper.cpp"),
    whisperCppVersion: "1.5.5",
    model: MODEL,
    modelFolder: path.join(WORK, "whisper-models"),
    tokenLevelTimestamps: true,
    language: "es",
    splitOnWord: true,
    printOutput: false,
    additionalArgs: [
      ["--max-context", "0"],
      ["--prompt", PROMPT],
    ],
  });
  const { captions } = toCaptions({ whisperCppOutput: json });
  const offset = Math.round(c.start * 1000);
  for (const w of captions) {
    all.push({
      ...w,
      startMs: w.startMs + offset,
      endMs: w.endMs + offset,
      timestampMs: w.timestampMs === null ? null : w.timestampMs + offset,
    });
  }
  console.log(
    `trozo ${i + 1}/${chunks.length} [${c.start.toFixed(1)}-${c.end.toFixed(1)} s]: ${captions.length} palabras, ` +
      `${((Date.now() - t0) / 1000).toFixed(0)} s acumulados`,
  );
}
fs.writeFileSync(path.join(OUT, "captions.json"), JSON.stringify(all, null, 1));
console.log(`palabras: ${all.length}; tiempo total: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
