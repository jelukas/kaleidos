#!/usr/bin/env node
// Calibración del modelo de coste de Lambda: 100 fotogramas por modo con UNA pestaña (como cada función) y
// WebGL por software (swangle, como en Lambda), más la misma medida con GPU (angle) para comparar.
//
//   node scripts/medir.mjs [--gl swangle,angle] [--modos marco,recorte,tres,tres-pantalla] [--repeticiones 2]
//   node scripts/medir.mjs --gl swangle --modos escenario,escenario-show,escenario-3d,escenario-lamina   (§7)
//   node scripts/medir.mjs --gl swangle --modos narracion-voz,narracion-completa                        (§8)
//
// Se guarda el MÍNIMO de las repeticiones: si la máquina está compartida (otros procesos pesados), el mínimo es
// lo que más se parece a una función de Lambda dedicada. La carga media se anota junto a cada medida.
//
// Modos sobre el fixture demo (estilo prueba-oscuro):
//   marco          sin recorte: mezzanine en su marco + panel 2D + subtítulos   (fotogramas 241–340)
//   recorte        con recorte: plancha + máscara + panel 2D + subtítulos       (241–340)
//   tres           sin recorte + escena3d (lienzo 840×600)                       (1648–1747)
//   tres-pantalla  gesto3d (lienzo 3D a pantalla completa, 75 f)                 (988–1062)
// Resultado: out/calibracion.json (lo lee scripts/lambda.mjs) y el detalle en out/logs/tiempos.log.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { leerArgs, MOTOR, OUT } from "./lib/comun.mjs";

const { op } = leerArgs();
const gls = String(op.gl ?? "swangle,angle").split(",");
const MODOS = {
  marco: { timeline: "timeline.json", frames: "241-340" },
  recorte: { timeline: "timeline-recorte.json", frames: "241-340" },
  tres: { timeline: "timeline.json", frames: "1648-1747" },
  "tres-pantalla": { timeline: "timeline.json", frames: "988-1062" },
  // Modo escenario (§7) sobre el fixture milikito (medios reales de dora-v2, con recorte), estilo milikito-escenario:
  escenario: { slug: "milikito", estilo: "milikito-escenario", timeline: "timeline.json", frames: "1272-1371" }, // lista editorial + fichas + subtítulos
  "escenario-show": { slug: "milikito", estilo: "milikito-escenario", timeline: "timeline.json", frames: "1076-1175" }, // rayos + destellos + titular de juego (grande)
  "escenario-3d": { slug: "milikito", estilo: "milikito-escenario", timeline: "timeline.json", frames: "346-445" }, // escena3d (escalera) en la caja + reacciones
  "escenario-lamina": { slug: "milikito", estilo: "milikito-escenario", timeline: "timeline.json", frames: "796-895" }, // lámina + 2 bocadillos (grande)
  // Modo narración (§8) sobre el fixture narracion (sin ponente, locución de 45 s), estilo milikito:
  "narracion-voz": { slug: "narracion", estilo: "milikito", timeline: "timeline.json", frames: "200-299" }, // lista editorial + caja de voz con onda + subtítulos
  "narracion-completa": { slug: "narracion", estilo: "milikito", timeline: "timeline-completa.json", frames: "200-299" }, // la misma lista a sangre (completa)
};
const modos = String(op.modos ?? "marco,recorte,tres,tres-pantalla").split(",");
const reps = Math.max(1, Number(op.repeticiones ?? 2));

const destino = path.join(OUT, "calibracion.json");
const prev = fs.existsSync(destino) ? JSON.parse(fs.readFileSync(destino, "utf8")) : { medidas: {} };
const res = { ...prev, fecha: new Date().toISOString(), maquina: `${os.cpus()[0]?.model ?? "?"} · ${os.cpus().length} núcleos · ${Math.round(os.totalmem() / 2 ** 30)} GB`, medidas: prev.medidas ?? {} };

for (const gl of gls) {
  for (const m of modos) {
    const cfg = MODOS[m];
    if (!cfg) continue;
    const tomas = [];
    for (let i = 0; i < reps; i++) {
      const salida = execFileSync(
        process.execPath,
        [path.join(MOTOR, "scripts", "render-local.mjs"), cfg.slug ?? "demo", "--frames", cfg.frames, "--gl", gl, "--concurrency", "1", "--estilo", cfg.estilo ?? "prueba-oscuro", "--timeline", cfg.timeline, "--nombre", `calib-${m}-${gl}`, "--json"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
      );
      tomas.push(JSON.parse(salida.trim().split("\n").filter((l) => l.startsWith("{")).at(-1)).sPorFotograma);
    }
    const min = Math.min(...tomas);
    const carga = os.loadavg()[0];
    res.medidas[m] = { ...(res.medidas[m] ?? {}), [gl]: min, [`${gl}Tomas`]: tomas, [`${gl}Carga`]: +carga.toFixed(1) };
    console.log(`  ${m.padEnd(14)} ${gl.padEnd(8)} ${min.toFixed(3)} s/fotograma  (tomas ${tomas.map((x) => x.toFixed(3)).join(", ")}; carga ${carga.toFixed(1)})`);
    fs.writeFileSync(destino, JSON.stringify(res, null, 2));
  }
}
console.log(`\n✓ ${path.relative(MOTOR, destino)}`);
