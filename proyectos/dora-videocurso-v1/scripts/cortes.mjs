// Genera src/datos/cortes.json a partir de:
//   - scripts/tomas.json: rangos de contenido elegidos a mano por capítulo (qué toma se queda),
//   - work/diag/rms100ms.txt: energía del canal de voz cada 100 ms (VAD).
// Dentro de cada rango, los silencios de más de UMBRAL_S se eliminan (jump cut), dejando un
// colchón antes y después de la voz. Los cortes caen siempre en la ventana de menor energía.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const tomas = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "tomas.json"), "utf8"));
const rms = fs
  .readFileSync(path.join(ROOT, "work", "diag", "rms100ms.txt"), "utf8")
  .split("\n")
  .filter((l) => l.includes("RMS_level="))
  .map((l) => {
    const v = l.split("=")[1].trim();
    return v.includes("inf") ? -120 : Number(v);
  });

const W = 0.1;
const VOZ_DB = -47; // umbral de voz (el suelo está en -84 dBFS y la voz ronda -33 dBFS)
const UMBRAL_S = 1.0; // silencios de más de 1 s se recortan (las pausas de respiración se respetan)
const PRE = 0.12; // colchón antes de la voz
const POST = 0.28; // colchón después de la voz
const MIN_SEG = 0.5; // segmentos más cortos se descartan (ruidos sueltos)

const esVoz = (i) => rms[i] !== undefined && rms[i] > VOZ_DB;

const segmentosDe = (a, b) => {
  // Regiones de voz dentro de [a, b).
  const i0 = Math.floor(a / W);
  const i1 = Math.ceil(b / W);
  const regiones = [];
  let cur = null;
  for (let i = i0; i < i1; i++) {
    if (esVoz(i)) {
      if (cur && (i - cur.fin) * W <= UMBRAL_S) cur.fin = i + 1;
      else {
        if (cur) regiones.push(cur);
        cur = { ini: i, fin: i + 1 };
      }
    }
  }
  if (cur) regiones.push(cur);
  return regiones
    .map((r) => ({ in: Math.max(a, r.ini * W - PRE), out: Math.min(b, r.fin * W + POST) }))
    .filter((s) => s.out - s.in >= MIN_SEG)
    .map((s) => ({ in: Math.round(s.in * 25) / 25, out: Math.round(s.out * 25) / 25 }));
};

const salida = { capitulos: [] };
let totalIn = 0;
let totalOut = 0;
for (const cap of tomas.capitulos) {
  const segmentos = [];
  for (const [a, b] of cap.rangos) {
    totalIn += b - a;
    // Un segmento que empieza justo donde acaba el anterior se funde (evita cortes invisibles).
    for (const s of segmentosDe(a, b)) {
      const last = segmentos.at(-1);
      if (last && Math.abs(s.in - last.out) < 0.01) last.out = s.out;
      else segmentos.push(s);
    }
  }
  // Cola de 0,8 s al final del capítulo sobre la pausa siguiente: la transición 3D de losetas tapa ese
  // silencio y no la última frase (solo si la voz no vuelve antes).
  const ultimo = segmentos.at(-1);
  if (ultimo) {
    let j = Math.ceil(ultimo.out / W);
    while (j < rms.length && !esVoz(j) && j * W < ultimo.out + 0.9) j++;
    ultimo.out = Math.round(Math.min(ultimo.out + 0.8, j * W - 0.1) * 25) / 25;
  }
  totalOut += segmentos.reduce((acc, s) => acc + (s.out - s.in), 0);
  salida.capitulos.push({ id: cap.id, secciones: cap.secciones ?? [], segmentos });
}
fs.writeFileSync(path.join(ROOT, "src", "datos", "cortes.json"), JSON.stringify(salida, null, 1));
const nCortes = salida.capitulos.reduce((a, c) => a + c.segmentos.length, 0);
console.log(
  `rangos elegidos: ${totalIn.toFixed(1)} s → tras quitar silencios: ${totalOut.toFixed(1)} s; ${nCortes} tomas`,
);
