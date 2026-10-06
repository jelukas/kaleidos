#!/usr/bin/env node
// v2 «anuncio dinámico». Ensambla index.html + compositions/*.html desde src/*.html (escenas), la voz real y la música.
// Uso: node build2.mjs [--sin-audio]     (luego `npx hyperframes check`)
// Formato de src/NN-nombre.html (lo escribe cada escena):  <!--CSS--> … <!--HTML--> … <!--JS--> … <!--SFX--> [json opcional]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const SIN_AUDIO = process.argv.includes("--sin-audio");
const SIN_SUBS = !process.argv.includes("--subtitulos");
const FXGAIN = parseFloat((process.argv.find((a) => a.startsWith("--fx=")) || "--fx=1.8").split("=")[1]);
const manifest = JSON.parse(readFileSync("assets/voice.manifest.json", "utf8"));
const WORDS = JSON.parse(readFileSync("work/words.json", "utf8"));
const LINE = Object.fromEntries(manifest.lines.map((l) => [l.id, l]));
const frame = readFileSync("frame.md", "utf8");
const fontCss = (frame.match(/\/\* fuentes:inicio[\s\S]*?\/\* fuentes:fin \*\//) || [""])[0];
const KIT_CSS = readFileSync("src/_kit.css", "utf8");
const KIT_JS = readFileSync("src/_kit.js", "utf8");
const r3 = (x) => Math.round(x * 1000) / 1000;
const INK = "#0D1320", ACC = "#7D29E0";

// ---------- línea de tiempo ----------
const MB = existsSync("work/music-beats.json") ? JSON.parse(readFileSync("work/music-beats.json", "utf8")) : { first: 0, bpm: 120 };
const BEAT0 = MB.first, BEATP = 60 / MB.bpm;
const SCENES = JSON.parse(readFileSync("scenes.config.json", "utf8"));
let t0 = 0;
let lastDate = "2026-09-01";
for (const s of SCENES) {
  s.prev = lastDate; if (s.dates && s.dates.length) lastDate = s.dates[s.dates.length - 1];
  s.start = r3(t0); t0 += s.dur;
  if (s.line) {
    if (s.lead + LINE[s.line].duration > s.dur + 0.01) throw new Error(`${s.id}: la voz (${LINE[s.line].duration}s + lead) no cabe en ${s.dur}s`);
    s.voiceStart = r3(s.start + s.lead);
  }
}
const TOTAL = r3(t0);
const beatsFor = (s) => { const out = []; for (let k = -20; k < 400; k++) { const t = BEAT0 + k * BEATP - s.start; if (t >= 0 && t <= s.dur) out.push(r3(t)); } return out; };
const sceneInfo = (s) => ({
  id: s.id, file: s.file, name: s.name, start: s.start, dur: s.dur, theme: s.theme, line: s.line ?? null, lead: s.lead ?? null,
  words: s.line ? WORDS[s.line].map((w) => ({ t: w.t, s: r3(s.lead + w.s), e: r3(s.lead + w.e) })) : [],
  beats: beatsFor(s),
});
mkdirSync("work", { recursive: true });
writeFileSync("work/scenes.json", JSON.stringify(SCENES.map(sceneInfo), null, 1));

// ---------- escenas ----------
const section = (txt, name) => { const m = txt.match(new RegExp(`<!--${name}-->([\\s\\S]*?)(?=<!--(?:CSS|HTML|JS|SFX)-->|$)`)); return m ? m[1].trim() : ""; };
const fill = (str, s) => str.replace(/__DATES__/g, JSON.stringify(s.dates ?? [])).replace(/__PREV__/g, s.prev ?? "2026-09-01").replace(/__BLOCK__/g, s.block ?? "").replace(/__COLOR__/g, s.color ?? "#7D29E0").replace(/__WEEK__/g, s.week ? "true" : "false").replace(/__SUBS__/g, SIN_SUBS ? "0" : "1").replace(/__ID__/g, s.id).replace(/__DUR__/g, String(s.dur))
  .replace(/__CUES__/g, JSON.stringify({ words: sceneInfo(s).words, voiceStart: s.lead ?? 0 }))
  .replace(/__BEATS__/g, JSON.stringify(beatsFor(s)));
const sfxEvents = []; // {t, k, v} absolutos
const autoWhoosh = new Set(SCENES.filter((x, i) => i > 0 && !x.noWhoosh).map((x) => x.id));

function composeScene(s, css, html, js) {
  return `<template>
<style>${fontCss}
${fill(KIT_CSS, s)}
${fill(css, s)}</style>
<div id="${s.id}" data-composition-id="${s.id}" data-width="1920" data-height="1080">
${fill(html, s)}
</div>
<script>
${fill(KIT_JS, s)}
${fill(js, s)}
window.__timelines["${s.id}"] = tl;
</script>
</template>
`;
}

// ---------- logo (SVG oficial) ----------
const logoSrc = readFileSync("assets/logo-openwebinars.svg", "utf8");
function logoSvg(id) {
  const body = logoSrc.replace(/_11953_875/g, `_${id}`);
  const defs = body.match(/<defs>[\s\S]*<\/defs>/)[0];
  const inner = body.match(/<g clip-path[\s\S]*?<\/g>/)[0];
  let i = 0;
  const marked = inner.replace(/<path /g, () => `<path class="lp" data-i="${i++}" `);
  const white = inner.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/clip-path="[^"]*"/g, "");
  return `<svg class="logo" viewBox="0 0 241 42" width="1040" height="181" xmlns="http://www.w3.org/2000/svg" overflow="visible">
${defs}
<defs><linearGradient id="shg_${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="shm_${id}" maskUnits="userSpaceOnUse" x="-10" y="-5" width="270" height="55">${white}</mask></defs>
${marked}
<g mask="url(#shm_${id})"><rect class="shine" x="-60" y="-8" width="34" height="60" fill="url(#shg_${id})" transform="skewX(-18)"/></g>
</svg>`;
}
function logoScene(s) {
  const open = s.logo !== "close";
  const k = open ? 0.62 : 0.8;
  const css = `#${s.id} .glow{position:absolute;left:290px;top:358px;width:360px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(125,41,224,.55),rgba(255,1,162,.25) 60%,transparent)}
#${s.id} .logowrap{position:absolute;left:440px;top:449px;width:1040px;height:181px;transform-origin:50% 50%}
#${s.id} .logo{display:block}
#${s.id} .iris{position:absolute;left:533px;top:538px;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:linear-gradient(135deg,#7D29E0,#5E3DE6 55%,#FF01A2 140%);opacity:0}`;
  const html = `<div class="stage"><div class="glow"></div><div class="logowrap">${logoSvg(s.id)}</div></div>
<div class="iris"></div>`;
  const js = `
const ps = $$q(".lp");
ps.forEach((p, i) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.style.fillOpacity = 0; p.style.strokeLinecap = "round"; p.style.strokeLinejoin = "round"; p.style.strokeWidth = i < 2 ? 0.7 : 0.4; p.style.stroke = i === 0 ? "url(#paint0_linear_${s.id})" : "#010101"; });
tl.fromTo(Q(".glow"), { opacity: 0, scale: 0.6 }, { opacity: 0.55, scale: 1, duration: ${r3(1.4 * k)}, ease: E }, ${r3(0.15 * k)});
ps.forEach((p, i) => {
  const at = i === 0 ? ${r3(0.15 * k)} : i === 1 ? ${r3(0.55 * k)} : ${r3(0.8 * k)} + (i - 2) * ${r3(0.05 * k)};
  const d = i === 0 ? ${r3(1.1 * k)} : i === 1 ? ${r3(0.8 * k)} : ${r3(0.65 * k)};
  tl.to(p, { strokeDashoffset: 0, duration: d, ease: i < 2 ? E : "power2.out" }, at);
  tl.to(p, { fillOpacity: 1, duration: ${r3(0.4 * k)}, ease: "power1.out" }, at + d * 0.7);
  tl.to(p, { strokeOpacity: 0, duration: ${r3(0.3 * k)} }, at + d + 0.1);
  if (i >= 2) tl.fromTo(p, { y: 1.6 }, { y: 0, duration: d, ease: E }, at);
});
tl.fromTo(Q(".shine"), { attr: { x: -60 } }, { attr: { x: 270 }, duration: ${r3(0.9 * k)}, ease: "power2.inOut" }, ${r3(2.0 * k)});
tl.fromTo(Q(".logowrap"), { scale: 1 }, { scale: 1.04, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${r3(2.3 * k)});
${open
  ? `// el aro se expande hasta llenar la pantalla de violeta (iris)
tl.set(Q(".iris"), { opacity: 1, scale: 1 }, ${r3(DUR_IRIS(s))});
tl.to(Q(".logowrap"), { opacity: 0, duration: 0.25, ease: "power2.in" }, ${r3(DUR_IRIS(s))});
tl.to(Q(".iris"), { scale: 40, duration: 0.55, ease: "power4.in" }, ${r3(DUR_IRIS(s))});`
  : `tl.to(Q(".stage"), { opacity: 0, duration: 0.6, ease: "power2.inOut" }, ${r3(s.dur - 0.7)});`}
`;
  return composeScene(s, css, html, js);
}
function DUR_IRIS(s) { return s.dur - 0.62; }

const SRC_DIR = "src";
function buildScene(s) {
  if (s.kind === "logo") return { html: logoScene(s), sfx: [], stub: false };
  const p = `${SRC_DIR}/${s.file}.html`;
  if (!existsSync(p)) {
    return { stub: true, sfx: [], html: composeScene(s, `#${s.id} .t{position:absolute;left:160px;top:400px;font-size:120px}`,
      `<div class="stage"><div class="bg ${s.theme === "dark" ? "bg-deep" : "bg-light"}"></div><div class="t h ${s.theme === "dark" ? "white" : ""}">${s.name}</div></div>`, `sceneIn("fade"); sceneOut("fade");`) };
  }
  const txt = readFileSync(p, "utf8");
  const sfx = section(txt, "SFX");
  return { stub: false, html: composeScene(s, section(txt, "CSS"), section(txt, "HTML"), section(txt, "JS")), sfx: sfx ? JSON.parse(sfx) : [] };
}
// modo vista previa aislada: node build2.mjs --preview=NN-nombre  →  work/prev/NN-nombre/ (index de una sola escena, sin audio ni subtítulos)
const prevArg = process.argv.find((a) => a.startsWith("--preview="));
if (prevArg) {
  const name = prevArg.split("=")[1];
  const s = SCENES.find((x) => x.file === name || x.id === name);
  if (!s) { console.error("escena no encontrada: " + name); process.exit(1); }
  const dir = `work/prev/${s.file}`;
  mkdirSync(`${dir}/compositions`, { recursive: true });
  writeFileSync(`${dir}/compositions/${s.file}.html`, buildScene(s).html);
  for (const f of ["assets", "frame.md"]) if (!existsSync(`${dir}/${f}`)) spawnSync("ln", ["-s", `${process.cwd()}/${f}`, `${dir}/${f}`]);
  for (const f of ["hyperframes.json", "meta.json", "package.json"]) if (!existsSync(`${dir}/${f}`)) spawnSync("cp", [f, `${dir}/${f}`]);
  writeFileSync(`${dir}/index.html`, `<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#FAFBFC}#root{position:relative;width:100%;height:100%;background:#FAFBFC;overflow:hidden}.clip{position:absolute;inset:0}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${s.dur}" data-width="1920" data-height="1080">
<div id="host-${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.file}.html" data-start="0" data-duration="${s.dur}" data-track-index="1" data-width="1920" data-height="1080"></div>
</div><script>const tl=gsap.timeline({paused:true});tl.fromTo("#root",{"--p":0},{"--p":1,duration:${s.dur},ease:"none"},0);window.__timelines["main"]=tl;</script></body></html>`);
  console.log(`preview listo: ${dir}  (duración ${s.dur}s, voz desde ${s.lead ?? "-"}s)`);
  process.exit(0);
}
mkdirSync("compositions", { recursive: true });
for (const f of readdirSync("compositions")) if (f.endsWith(".html") && !f.startsWith("fondo") && !f.startsWith("subs")) rmSync(`compositions/${f}`);
const stubs = [];
for (const s of SCENES) {
  const b = buildScene(s);
  if (b.stub) stubs.push(s.id);
  for (const e of b.sfx) sfxEvents.push({ t: r3(s.start + e.t), k: e.k, v: e.v ?? 0.6 });
  writeFileSync(`compositions/${s.file}.html`, b.html);
  if (autoWhoosh.has(s.id)) sfxEvents.push({ t: r3(Math.max(0, s.start - 0.12)), k: "whoosh", v: 0.5 });
  if (s.kind === "logo") sfxEvents.push({ t: r3(s.start + 0.6), k: "shimmer", v: 0.55 });
}

// ---------- subtítulos ----------
const chunks = [];
for (const s of SCENES) {
  if (!s.line) continue;
  const ws = WORDS[s.line]; let cur = [];
  const flush = () => { if (cur.length) chunks.push({ scene: s, words: cur }); cur = []; };
  ws.forEach((w) => {
    cur.push({ ...w, abs: r3(s.voiceStart + w.s), absE: r3(s.voiceStart + w.e) });
    const len = cur.map((x) => x.t).join(" ").length;
    if (/[.?!:]$/.test(w.t) || (/,$/.test(w.t) && len >= 26) || len >= 40) flush();
  });
  flush();
}
chunks.forEach((c, i) => {
  const next = chunks[i + 1]; let en = c.words[c.words.length - 1].absE + 0.35;
  if (next && next.words[0].abs < en) en = next.words[0].abs - 0.05;
  c.st = r3(c.words[0].abs - 0.08); c.en = r3(en);
});
const SUBS = 4, per = Math.ceil(chunks.length / SUBS), subIds = [];
for (let g = 0; g < SUBS; g++) {
  const id = `subs${g + 1}`; subIds.push(id); let html = "", js = "";
  chunks.slice(g * per, (g + 1) * per).forEach((c, k) => {
    const i = g * per + k, dark = c.scene.theme === "dark";
    html += `<div class="cap${dark ? " dk" : ""}" id="${id}c${i}">${c.words.map((w, j) => `<span id="${id}w${i}_${j}" class="w">${w.t}</span>`).join(" ")}</div>\n`;
    js += `tl.fromTo("#${id}c${i}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, ${c.st});
tl.to("#${id}c${i}", { opacity: 0, duration: 0.16, ease: "power1.in" }, ${r3(c.en - 0.16)});
`;
    c.words.forEach((w, j) => {
      js += `tl.set("#${id}w${i}_${j}", { color: "${dark ? "#FF8AD3" : ACC}", opacity: 1 }, ${w.abs});
tl.set("#${id}w${i}_${j}", { color: "${dark ? "#FFFFFF" : INK}" }, ${w.absE});
`;
    });
  });
  const css = `${fontCss}
#${id}{position:absolute;inset:0;font-family:Inter,sans-serif}
#${id} .cap{position:absolute;left:200px;right:200px;bottom:58px;text-align:center;font-size:46px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;opacity:0}
#${id} .w{display:inline-block;color:${INK};opacity:.5}
#${id} .cap.dk .w{color:#fff;opacity:.55;text-shadow:0 2px 18px rgba(20,0,50,.6)}`;
  writeFileSync(`compositions/${id}.html`, `<template>
<style>${css}</style>
<div id="${id}" data-composition-id="${id}" data-width="1920" data-height="1080">
${html}</div>
<script>
const tl = gsap.timeline({ paused: true });
${js}
window.__timelines["${id}"] = tl;
</script>
</template>
`);
}
// ---------- fondo ----------
writeFileSync("compositions/fondo.html", `<template>
<style>
#fondo{position:absolute;inset:0}
#fondo .core{position:absolute;left:160px;right:160px;bottom:-760px;height:1500px;border-radius:50%;background:radial-gradient(closest-side,rgba(125,41,224,.30),rgba(255,1,162,.15) 62%,rgba(255,1,162,0))}
</style>
<div id="fondo" data-composition-id="fondo" data-width="1920" data-height="1080"><div class="core"></div></div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#fondo .core", { opacity: 0.75, scale: 0.96 }, { opacity: 1, scale: 1.05, duration: 6, ease: "sine.inOut", yoyo: true, repeat: ${Math.max(0, Math.floor(TOTAL / 6) - 1)} }, 0);
window.__timelines["fondo"] = tl;
</script>
</template>
`);

// ---------- música: recorte, fundido y ducking bajo la voz ----------
const MUSIC_GAIN = parseFloat((process.argv.find((a) => a.startsWith("--musica=")) || "--musica=0.5").split("=")[1]);
const MUSIC_IN = "assets/audio/musica.wav", MUSIC_OUT = "assets/audio/musica-mix.wav";
const voiceScenes = SCENES.filter((s) => s.line);
const mixKey = createHash("sha256").update(JSON.stringify([TOTAL, voiceScenes.map((s) => [s.line, s.voiceStart])])).digest("hex").slice(0, 12);
if (!SIN_AUDIO && (!existsSync(MUSIC_OUT) || !existsSync("work/mix.key") || readFileSync("work/mix.key", "utf8") !== mixKey)) {
  const args = ["-y", "-loglevel", "error"];
  voiceScenes.forEach((s) => args.push("-i", `assets/voice/${s.line}.wav`));
  args.push("-i", MUSIC_IN);
  const n = voiceScenes.length;
  const f = voiceScenes.map((s, i) => `[${i}:a]adelay=${Math.round(s.voiceStart * 1000)}|${Math.round(s.voiceStart * 1000)}[v${i}]`).join(";");
  const mixIn = voiceScenes.map((_, i) => `[v${i}]`).join("");
  const filter = `${f};${mixIn}amix=inputs=${n}:normalize=0:duration=longest,apad=whole_dur=${TOTAL + 1},aformat=sample_rates=48000:channel_layouts=mono[vm];` +
    `[${n}:a]atrim=0:${TOTAL + 0.1},asetpts=PTS-STARTPTS,afade=t=out:st=${r3(TOTAL - 3.2)}:d=3.2,volume=${MUSIC_GAIN}[m];` +
    `[m][vm]sidechaincompress=threshold=0.012:ratio=9:attack=25:release=500:makeup=1[md];[md]atrim=0:${TOTAL}[out]`;
  args.push("-filter_complex", filter, "-map", "[out]", "-ar", "48000", "-ac", "2", MUSIC_OUT);
  const r = spawnSync("ffmpeg", args);
  if (r.status !== 0) { console.error(r.stderr.toString().slice(0, 1500)); process.exit(1); }
  writeFileSync("work/mix.key", mixKey);
  console.log("música: recortada y con ducking");
}

// ---------- index ----------
const hosts = SCENES.map((s) => `<div id="host-${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.file}.html" data-start="${s.start}" data-duration="${s.dur}" data-track-index="1" data-width="1920" data-height="1080"></div>`).join("\n      ");
const subs = SIN_SUBS ? "" : subIds.map((id, k) => `<div id="host-${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="0" data-duration="${TOTAL}" data-track-index="${2 + k}" data-width="1920" data-height="1080"></div>`).join("\n      ");
const voices = voiceScenes.map((s) => `<audio id="voz-${s.line}" src="assets/voice/${s.line}.wav" data-start="${s.voiceStart}" data-duration="${LINE[s.line].duration}" data-track-index="10" data-volume="1"></audio>`).join("\n      ");
const FX = {};
for (const f of readdirSync("assets/audio/fx")) if (f.endsWith(".wav")) { const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `assets/audio/fx/${f}`]); FX[f.replace(".wav", "")] = parseFloat(r.stdout.toString()) || 1; }
const fxEls = sfxEvents.sort((a, b) => a.t - b.t).map((e, i) => `<audio id="fx${i}-${e.k}" src="assets/audio/fx/${e.k}.wav" data-start="${e.t}" data-duration="${Math.min(FX[e.k], r3(TOTAL - e.t))}" data-track-index="${12 + (i % 6)}" data-volume="${r3(e.v * FXGAIN)}"></audio>`).join("\n      ");
const index = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Chat o agente</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #FAFBFC; }
      #root { position: relative; width: 100%; height: 100%; background: #FAFBFC; overflow: hidden; }
      .clip { position: absolute; inset: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
      <div id="host-fondo" class="clip" data-composition-id="fondo" data-composition-src="compositions/fondo.html" data-start="0" data-duration="${TOTAL}" data-track-index="0" data-width="1920" data-height="1080"></div>
      ${hosts}
      ${subs}
      <audio id="musica" src="assets/audio/musica-mix.wav" data-start="0" data-duration="${TOTAL}" data-track-index="9" data-volume="1"></audio>
      ${voices}
      ${fxEls}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#root", { "--p": 0 }, { "--p": 1, duration: ${TOTAL}, ease: "none" }, 0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync("index.html", index);
writeFileSync("work/timing.json", JSON.stringify(SCENES.map((s) => ({ id: s.id, name: s.name, start: s.start, dur: s.dur, voiceStart: s.voiceStart ?? null })), null, 1));
console.log(`ok · ${SCENES.length} escenas${stubs.length ? ` (provisionales: ${stubs.join(",")})` : ""} · ${chunks.length} subtítulos · ${sfxEvents.length} efectos · duración ${TOTAL}s`);
