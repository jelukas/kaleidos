// Instala whisper.cpp 1.5.5 (Makefile clásico, sin CMake) y descarga el modelo en work/.
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";
import path from "node:path";

const WORK = path.resolve(import.meta.dirname, "..", "work");
const MODEL = process.env.WHISPER_MODEL ?? "medium";

import fs from "node:fs";
fs.mkdirSync(path.join(WORK, "whisper-models"), { recursive: true });
const t0 = Date.now();
await Promise.all([
  installWhisperCpp({ to: path.join(WORK, "whisper.cpp"), version: "1.5.5", printOutput: false }).then(() =>
    console.log(`whisper.cpp instalado en ${((Date.now() - t0) / 1000).toFixed(1)} s`),
  ),
  downloadWhisperModel({ model: MODEL, folder: path.join(WORK, "whisper-models"), printOutput: false }).then(() =>
    console.log(`modelo ${MODEL} descargado en ${((Date.now() - t0) / 1000).toFixed(1)} s`),
  ),
]);
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)} s`);
