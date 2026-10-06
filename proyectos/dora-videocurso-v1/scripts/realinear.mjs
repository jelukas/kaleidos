// Realineado de palabras de Whisper contra la energía real del audio.
// - Inicio de palabra: marca DTW (timestampMs), que cuadra mejor con la voz que startMs
//   (medido: 5,8 % de palabras en silencio frente a 12,6 %).
// - Si el inicio cae en silencio, se engancha al comienzo de voz más cercano (hasta 1 s después
//   o 0,5 s antes). El final es el inicio de la palabra siguiente, limitado por su longitud y por el
//   final del bloque de voz.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

export const cargarVoz = (umbral = -50) =>
  fs
    .readFileSync(path.join(ROOT, "work", "diag", "rms100ms.txt"), "utf8")
    .split("\n")
    .filter((l) => l.includes("RMS_level="))
    .map((l) => {
      const v = l.split("=")[1].trim();
      return (v.includes("inf") ? -120 : Number(v)) > umbral;
    });

export const realinear = (palabras, voz) => {
  const hay = (i) => i >= 0 && i < voz.length && voz[i];
  const ws = palabras
    .filter((p) => p.text.trim() && !/^\s*[-–]\s*$/.test(p.text) && !/^\s*\[.*\]\s*$/.test(p.text))
    .map((p) => ({ ...p, t: (p.timestampMs ?? p.startMs) / 1000 }))
    .sort((a, b) => a.t - b.t);
  for (const w of ws) {
    const i = Math.round(w.t * 10);
    if (hay(i) || hay(i - 1) || hay(i + 1)) continue;
    let nuevo = null;
    for (let d = 1; d <= 10 && nuevo === null; d++) {
      if (hay(i + d)) nuevo = (i + d) / 10;
      else if (d <= 5 && hay(i - d)) nuevo = (i - d) / 10;
    }
    if (nuevo !== null) w.t = nuevo;
  }
  // Monotonía: nunca antes que la palabra anterior.
  for (let k = 1; k < ws.length; k++) if (ws[k].t < ws[k - 1].t + 0.04) ws[k].t = ws[k - 1].t + 0.04;
  return ws.map((w, k) => {
    const sig = ws[k + 1]?.t ?? w.t + 1;
    const largo = Math.max(0.22, w.text.trim().length * 0.075);
    let fin = Math.min(sig, w.t + largo + 0.25);
    // No pasar del final del bloque de voz.
    let j = Math.round(w.t * 10);
    while (j < voz.length && voz[j] && j / 10 < fin) j++;
    fin = Math.max(w.t + 0.12, Math.min(fin, j / 10 + 0.1));
    return {
      text: w.text,
      startMs: Math.round(w.t * 1000),
      endMs: Math.round(fin * 1000),
      timestampMs: Math.round(w.t * 1000),
      confidence: w.confidence ?? null,
    };
  });
};
