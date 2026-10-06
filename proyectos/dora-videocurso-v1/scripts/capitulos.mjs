// Genera capitulos.txt (formato de capítulos de YouTube) a partir de src/datos/cortes.json.
// Replica el cálculo de src/lib/linea-tiempo.ts (mismas constantes).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const FPS = 25;
const INTRO_FR = 9 * FPS;
const TARJETA_FR = Math.round(3.6 * FPS);
const OUTRO_FR = 10 * FPS;
const SOLAPE_INTRO_FR = 20;
const SALIDA_TARJETA_FR = 12;

const cortes = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "datos", "cortes.json"), "utf8"));
const TITULOS = {
  caso1: "Caso 1 · El proveedor que ya conocemos",
  caso2: "Caso 2 · La señal débil de las 9:15",
  caso3: "Caso 3 · Viernes por la tarde",
};

let f = INTRO_FR;
const tomas = [];
const caps = [];
cortes.capitulos.forEach((c, i) => {
  const tarjetaDesde = i === 0 ? f - SOLAPE_INTRO_FR : f;
  f = tarjetaDesde + TARJETA_FR - SALIDA_TARJETA_FR;
  for (const s of c.segmentos) {
    const inF = Math.round(s.in * FPS);
    const dur = Math.round(s.out * FPS) - inF;
    if (dur <= 0) continue;
    tomas.push({ in: inF / FPS, out: (inF + dur) / FPS, desde: f });
    f += dur;
  }
  caps.push({ c, tarjetaDesde });
});
const total = f + OUTRO_FR;
const aSalida = (s) => {
  const t = tomas.find((x) => s >= x.in && s < x.out) ?? tomas.find((x) => x.in >= s);
  return t.desde + Math.max(0, Math.round((s - t.in) * FPS));
};
const fmt = (fr) => {
  const s = Math.floor(fr / FPS);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const lineas = ["0:00 Introducción · DORA en la práctica"];
for (const { c, tarjetaDesde } of caps) {
  lineas.push(`${fmt(tarjetaDesde)} ${TITULOS[c.id]}`);
  for (const sec of c.secciones) {
    if (sec.titulo === "Enunciado") continue;
    lineas.push(`${fmt(aSalida(sec.t))} ${TITULOS[c.id].split(" · ")[0]} · ${sec.titulo}`);
  }
}
lineas.push(`${fmt(f)} Resumen y cierre`);
fs.writeFileSync(path.join(ROOT, "capitulos.txt"), lineas.join("\n") + "\n");
console.log(lineas.join("\n"));
console.log(`\nDuración total: ${fmt(total)} (${total} fotogramas)`);

// Uso auxiliar: node scripts/capitulos.mjs --fotograma 198.4 675 → fotograma de salida de cada instante.
const idx = process.argv.indexOf("--fotograma");
if (idx > 0) {
  for (const v of process.argv.slice(idx + 1)) console.log(`fuente ${v} s → fotograma ${aSalida(Number(v))}`);
  const tarjetas = caps.map(({ c, tarjetaDesde }) => `${c.id}: tarjeta ${tarjetaDesde}`);
  console.log(tarjetas.join(" · "), `· outro ${f}`);
}
