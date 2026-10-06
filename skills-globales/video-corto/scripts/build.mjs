#!/usr/bin/env node
// Genera vertical.html y horizontal.html de un vídeo desde un único plan.
//
//   node scripts/build.mjs <slug>
//
// Entrada : videos/<slug>/plan.json          (beats, cada uno referido a líneas)
//           videos/<slug>/assets/voice.manifest.json   (tiempos REALES)
//           videos/<slug>/assets/audio.manifest.json   (opcional)
//
// Por qué generar y no escribir a mano: con decenas de cortes en dos formatos,
// mantenerlos sincronizados a mano es inviable. Los dos shells salen del mismo
// plan, así que no pueden divergir; lo único distinto es el tamaño del stage.
//
// Pistas: 0 imagen · 1 degradado · 2 tarjeta · 4 voz · 5 música · 6 efectos · 7 fuente
import { existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT, parseArgs, readJson } from "./lib/config.mjs";

const { positional } = parseArgs();
const slug = positional[0];
if (!slug) {
  process.stderr.write("Uso: node scripts/build.mjs <slug>\n");
  process.exit(1);
}

const videoDir = resolve(ROOT, "videos", slug);
const plan = readJson(join(videoDir, "plan.json"));
const voice = readJson(join(videoDir, "assets", "voice.manifest.json"));
const audioFile = join(videoDir, "assets", "audio.manifest.json");
const audio = existsSync(audioFile) ? readJson(audioFile) : { music: [], sfx: [] };

const byLine = new Map(voice.lines.map((l) => [l.id, l]));
const TOTAL = plan.outroHold ? +(voice.totalDuration + plan.outroHold).toFixed(3) : voice.totalDuration;

// ── Ventanas de cada beat ────────────────────────────────────────────────────
// Un beat arranca con su primera línea y dura hasta que arranca el siguiente:
// así no quedan huecos negros entre cortes (los gaps de la locución son de
// décimas, pero en pantalla se verían como parpadeos).
const beats = plan.beats.map((b) => {
  const first = byLine.get(b.lines[0]);
  if (!first) throw new Error(`Línea desconocida: ${b.lines[0]}`);
  return { ...b, start: first.start };
});
beats.forEach((b, i) => {
  const next = beats[i + 1];
  b.duration = +((next ? next.start : TOTAL) - b.start).toFixed(3);
  if (b.duration <= 0) throw new Error(`Beat ${i} (${b.lines[0]}) tiene duración <= 0`);
});

// El plan referencia las imágenes sin extensión (stock/valla); todas se generan
// y descargan como .jpg.
const rel = (p) => `videos/${slug}/assets/${/\.\w{3,4}$/.test(p) ? p : `${p}.jpg`}`;
const esc = (s) => String(s ?? "");

// ── Emisión de un beat ───────────────────────────────────────────────────────
function emit(b, i) {
  const t = `data-start="${b.start}" data-duration="${b.duration}"`;
  const id = `b${String(i + 1).padStart(2, "0")}`;
  const out = [];

  // Captura de pantalla: se muestra ENTERA (contain) y con su fuente, porque
  // sirve como prueba de lo que se afirma. Recortarla a sangre la invalidaría.
  if (b.type === "capture") {
    out.push(
      `      <img id="${id}-cap" class="clip capimg" src="${rel(b.img)}" alt="" ${t} data-track-index="0" />`,
    );
    if (b.source) {
      out.push(`      <div id="${id}-src" class="clip source" ${t} data-track-index="7">${esc(b.source)}</div>`);
    }
  }

  // Fondo: foto real o plano atmosférico generado.
  if (b.img && b.type !== "capture") {
    const kb = b.kb ? ` data-kb="${b.kb}"` : "";
    out.push(
      `      <img id="${id}-img" class="clip shot" src="${rel(b.img)}" alt="" ${t} data-track-index="0"${kb} />`,
      `      <div id="${id}-scrim" class="clip scrim" ${t} data-track-index="1"></div>`,
    );
    // Atribución obligatoria: procedencia de la foto o aviso de imagen generada.
    if (b.source) {
      out.push(`      <div id="${id}-src" class="clip source" ${t} data-track-index="7">${esc(b.source)}</div>`);
    }
  }

  // Sub-composición (escena compleja de un solo uso, p. ej. el mapa).
  if (b.type === "scene") {
    out.push(
      `      <div id="${id}-scene" class="clip" data-composition-id="${b.compositionId}"`,
      `        data-composition-src="videos/${slug}/scenes/${b.scene}" ${t}`,
      `        data-track-index="2" data-width="__W__" data-height="__H__"></div>`,
    );
    return out.join("\n");
  }

  // Tarjeta tipográfica.
  const inner = [];
  if (b.kicker) inner.push(`        <div class="kicker">${esc(b.kicker)}</div>`);

  if (b.type === "stat") {
    const countAttr =
      b.countTo !== undefined
        ? ` data-count-to="${b.countTo}"${b.prefix ? ` data-prefix="${esc(b.prefix)}"` : ""}${b.suffix ? ` data-suffix="${esc(b.suffix)}"` : ""}`
        : "";
    inner.push(`        <div class="statnum"${countAttr}>${countAttr ? "0" : esc(b.num)}</div>`);
    if (b.unit) inner.push(`        <div class="statunit">${esc(b.unit)}</div>`);
    if (b.label) inner.push(`        <div class="statlabel">${esc(b.label)}</div>`);
  } else if (b.type === "compare") {
    inner.push(`        <div class="compare">`);
    for (const c of b.items) {
      const countAttr = c.countTo !== undefined ? ` data-count-to="${c.countTo}"` : "";
      inner.push(
        `          <div class="${c.key ? "cmp-key" : ""}">`,
        `            <div class="cmpnum"${countAttr}>${countAttr ? "0" : esc(c.num)}</div>`,
        `            <div class="cmprule"></div>`,
        `            <div class="cmplabel">${esc(c.label)}</div>`,
        `          </div>`,
      );
    }
    inner.push(`        </div>`);
  } else if (b.type === "quote") {
    inner.push(`        <div class="quotetext">${esc(b.quote)}</div>`);
    if (b.attr) inner.push(`        <div class="quoteattr">${esc(b.attr)}</div>`);
  } else {
    if (b.headline) inner.push(`        <div class="headline">${esc(b.headline)}</div>`);
    if (b.deck) inner.push(`        <div class="deck">${esc(b.deck)}</div>`);
  }

  if (inner.length) {
    // `over` ancla el texto abajo: sobre foto es donde el degradado es denso, y
    // en una captura es lo que deja la imagen despejada.
    const anclado = b.img ? " over" : "";
    out.push(
      `      <div id="${id}-card" class="clip card${anclado}" ${t} data-track-index="2">`,
      ...inner,
      `      </div>`,
    );
  }
  return out.join("\n");
}

const body = beats.map(emit).join("\n\n");

// ── Audio ────────────────────────────────────────────────────────────────────
// Todo <audio> necesita id o el render sale MUDO (media_missing_id).
const voiceTags = voice.lines
  .map(
    (l) =>
      `      <audio id="voz-${l.id}" src="${rel(`voice/${l.id}.wav`)}" data-start="${l.start}" data-duration="${l.duration}" data-track-index="4"></audio>`,
  )
  .join("\n");

// Varias pistas de música, cada una con su entrada. Van todas en la pista 5, así
// que NO pueden solaparse: el plan fija dónde entra cada una y aquí se recorta
// la anterior si hiciera falta.
const musicPlan = plan.music ?? (audio.music ?? []).map((m) => ({ id: m.id, at: 0 }));
const musicTags = musicPlan
  .map((entry, i) => {
    const def = (audio.music ?? []).find((m) => m.id === entry.id);
    if (!def) throw new Error(`música desconocida: ${entry.id}`);
    const at = entry.at !== undefined ? entry.at : byLine.get(entry.line)?.start;
    if (at === undefined) throw new Error(`música ${entry.id}: falta 'at' o 'line'`);
    const siguiente = musicPlan[i + 1];
    const finSiguiente = siguiente
      ? siguiente.at !== undefined
        ? siguiente.at
        : byLine.get(siguiente.line)?.start
      : TOTAL;
    const dur = +Math.min(def.duration, finSiguiente - at, TOTAL - at).toFixed(3);
    if (dur <= 0) throw new Error(`música ${entry.id}: duración <= 0`);
    return `      <audio id="bgm-${entry.id}" src="videos/${slug}/${def.file}" data-start="${+at.toFixed(3)}" data-duration="${dur}" data-track-index="5" data-volume="${entry.volume ?? plan.musicVolume ?? 0.14}"></audio>`;
  })
  .join("\n");

const sfxTags = (plan.sfx ?? [])
  .map((s, i) => {
    const def = (audio.sfx ?? []).find((x) => x.id === s.id);
    if (!def) throw new Error(`sfx desconocido: ${s.id}`);
    const at = s.at !== undefined ? s.at : byLine.get(s.line)?.start;
    if (at === undefined) throw new Error(`sfx ${s.id}: falta 'at' o 'line'`);
    return `      <audio id="sfx-${i + 1}-${s.id}" src="videos/${slug}/${def.file}" data-start="${+Math.max(0, at + (s.offset ?? 0)).toFixed(3)}" data-duration="${def.duration}" data-track-index="6" data-volume="${s.volume ?? 0.4}"></audio>`;
  })
  .join("\n");

// ── Shells ───────────────────────────────────────────────────────────────────
function shell(W, H) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <link rel="stylesheet" href="videos/_shared/vox.css" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>
      /* Lo único propio del formato: el tamaño del stage. */
      html,
      body {
        width: ${W}px;
        height: ${H}px;
      }
    </style>
  </head>
  <body>
    <!-- GENERADO por scripts/build.mjs desde plan.json — no editar a mano. -->
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${TOTAL}"
      data-width="${W}"
      data-height="${H}"
      data-fps="30"
    >
${body.replace(/__W__/g, W).replace(/__H__/g, H)}

${voiceTags}
${musicTags}
${sfxTags}
    </div>

    <script src="videos/_shared/timeline.js"><\/script>
    <script>
      // El registro debe ser inline: el lint estático no mira dentro del .js externo.
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = window.buildVoxTimeline();
    <\/script>
  </body>
</html>
`;
}

writeFileSync(join(videoDir, "vertical.html"), shell(1080, 1920));
writeFileSync(join(videoDir, "horizontal.html"), shell(1920, 1080));
process.stdout.write(
  `✓ ${slug}: ${beats.length} beats · ${TOTAL}s · ${voice.lines.length} líneas de voz\n  vertical.html + horizontal.html\n`,
);
