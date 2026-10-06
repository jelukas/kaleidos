#!/usr/bin/env node
// Genera el informativo completo desde story.json + manifests de voz y audio.
//
//   node scripts/build-news.mjs <slug> --script   # story.json → script.json (para tts.mjs)
//   node scripts/build-news.mjs <slug>            # → index.html + compositions/*.html + voice.wav
//
// El guion manda el reloj: cada beat referencia una línea de locución y hereda su
// start real del manifest. Cambia el texto, regenera la voz y todo se recoloca.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import * as si from "simple-icons";

const ROOT = resolve(import.meta.dirname, "..");
const slug = process.argv[2];
const MODE_SCRIPT = process.argv.includes("--script");
const dir = join(ROOT, "proyectos", slug);
const story = JSON.parse(readFileSync(join(dir, "story.json"), "utf8"));
const W = 1920, H = 1080;
const r3 = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Secciones: intro · noticias · cierre ────────────────────────────────────
const sections = [story.intro, ...story.stories, story.outro];

// ── Modo guion ──────────────────────────────────────────────────────────────
if (MODE_SCRIPT) {
  const lines = [];
  sections.forEach((sec, si_) => {
    sec.beats.forEach((b, bi) => {
      if (!b.vo) return;
      const line = { id: b.line, text: b.vo };
      if (bi === 0) line.gapBefore = si_ === 0 ? (story.introLead ?? 2.4) : (story.sectionGap ?? 1.0);
      else if (b.gapBefore != null) line.gapBefore = b.gapBefore;
      lines.push(line);
    });
  });
  const script = {
    voiceId: story.voiceId,
    modelId: story.modelId ?? "eleven_v3",
    voiceSettings: story.voiceSettings ?? { stability: 0.5, similarity_boost: 0.8 },
    defaultGap: story.defaultGap ?? 0.3,
    tempo: story.tempo ?? 1,
    lines,
  };
  writeFileSync(join(dir, "script.json"), JSON.stringify(script, null, 2) + "\n");
  const chars = lines.reduce((a, l) => a + l.text.length, 0);
  console.log(`→ script.json · ${lines.length} líneas · ${chars} caracteres`);
  process.exit(0);
}

// ── Tiempos ─────────────────────────────────────────────────────────────────
const voice = JSON.parse(readFileSync(join(dir, "assets/voice.manifest.json"), "utf8"));
const audio = JSON.parse(readFileSync(join(dir, "assets/audio.manifest.json"), "utf8"));
const L = new Map(voice.lines.map((l) => [l.id, l]));
const lineOf = (id) => {
  const l = L.get(id);
  if (!l) throw new Error(`línea ${id} sin voz en el manifest`);
  return l;
};
const LEAD = 0.18; // lo visual entra un pelo antes que la voz
const SECTION_LEAD = story.sectionLead ?? 0.7;
const TAIL = story.outroTail ?? 5.0;

sections.forEach((sec, i) => {
  const first = lineOf(sec.beats.find((b) => b.line).line);
  sec.start = i === 0 ? 0 : r3(first.start - SECTION_LEAD);
});
sections.forEach((sec, i) => {
  const last = lineOf([...sec.beats].reverse().find((b) => b.line).line);
  sec.end = i < sections.length - 1 ? sections[i + 1].start : r3(last.start + last.duration + TAIL);
  sec.dur = r3(sec.end - sec.start);
  sec.beats.forEach((b, bi) => {
    const l = b.line ? lineOf(b.line) : null;
    b.start = bi === 0 ? 0 : r3(l.start - sec.start - LEAD + (b.offset ?? 0));
    b.voStart = l ? r3(l.start - sec.start) : b.start;
    b.voEnd = l ? r3(l.start + l.duration - sec.start) : b.start;
  });
  sec.beats.forEach((b, bi) => {
    b.end = bi < sec.beats.length - 1 ? sec.beats[bi + 1].start : sec.dur;
    b.dur = r3(b.end - b.start);
  });
});
const TOTAL = sections.at(-1).end;

// ── Voz: una sola pista concatenada con los starts reales ───────────────────
{
  const inputs = [], filters = [];
  voice.lines.forEach((l, i) => {
    inputs.push("-i", join(dir, l.file));
    filters.push(`[${i}:a]adelay=${Math.round(l.start * 1000)}|${Math.round(l.start * 1000)}[v${i}]`);
  });
  const mix = voice.lines.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${voice.lines.length}:normalize=0:dropout_transition=0,apad=whole_dur=${TOTAL}[out]`;
  const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", [...filters, mix].join(";"),
    "-map", "[out]", "-t", String(TOTAL), "-ar", "48000", "-ac", "1", join(dir, "assets/voice.wav")]);
  if (ff.status !== 0) throw new Error(ff.stderr.toString());
}

// ── Logos (simple-icons o SVG local) ────────────────────────────────────────
function logoSvg(key, cls = "logo") {
  if (!key) return "";
  const local = join(dir, "assets/logos", `${key}.svg`);
  if (existsSync(local)) {
    return readFileSync(local, "utf8").replace("<svg", `<svg class="${cls}"`).replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"');
  }
  const icon = si[`si${key[0].toUpperCase()}${key.slice(1)}`];
  if (!icon) throw new Error(`logo desconocido: ${key}`);
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-label="${esc(icon.title)}"><path fill="currentColor" d="${icon.path}"/></svg>`;
}

const capMeta = (img) => {
  const f = join(dir, img.replace(/\.png$/, ".json"));
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
};

// Palabras envueltas en máscaras para el revelado por líneas.
// *palabras entre asteriscos* van en color de acento (pueden abarcar varias
// palabras y cerrar antes de la puntuación: «Dario *tiene razón*»).
const words = (text, cls = "w") => {
  let on = false;
  return String(text).split(/\s+/).filter(Boolean).map((tok) => {
    let html = "", buf = "";
    const flush = () => { if (buf) html += on ? `<em>${esc(buf)}</em>` : esc(buf); buf = ""; };
    for (const ch of tok) {
      if (ch === "*") { flush(); on = !on; } else buf += ch;
    }
    flush();
    return `<span class="wm"><span class="${cls}">${html}</span></span>`;
  }).join(" ");
};

// ── CSS compartido (cada sub-composición lo lleva dentro de su <template>) ───
const CSS = `
#root { position:absolute; inset:0; overflow:hidden; background:#0B0C0E; color:#F2EEE7; font-family:"IBM Plex Mono", monospace; }
.layer { position:absolute; inset:0; }
.bggrid { position:absolute; left:-160px; top:-160px; width:${W + 320}px; height:${H + 320}px;
  background-image: linear-gradient(rgba(242,238,231,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(242,238,231,.07) 2px, transparent 2px);
  background-size: 80px 80px; }
.bgglow { position:absolute; width:1500px; height:1500px; border-radius:50%;
  background: radial-gradient(circle, rgba(255,91,46,.26) 0%, rgba(255,91,46,.08) 38%, rgba(255,91,46,0) 68%); }
.ghost { position:absolute; right:-40px; bottom:-150px; font-family:"League Gothic"; font-size:980px; line-height:.8;
  color:rgba(242,238,231,.045); -webkit-text-stroke:2px rgba(242,238,231,.13); letter-spacing:-.02em; }
.reg { position:absolute; width:34px; height:34px; border-color:rgba(242,238,231,.4); border-style:solid; border-width:0; }
.reg.tl { left:60px; top:132px; border-top-width:3px; border-left-width:3px; }
.reg.tr { right:60px; top:132px; border-top-width:3px; border-right-width:3px; }
.reg.bl { left:60px; bottom:112px; border-bottom-width:3px; border-left-width:3px; }
.reg.br { right:60px; bottom:112px; border-bottom-width:3px; border-right-width:3px; }
.phase { position:absolute; inset:0; opacity:0; }
.wm { display:inline-block; overflow:hidden; vertical-align:top; padding:.16em .02em .04em; margin:-.16em 0 -.04em; }
.w { display:inline-block; }
em { font-style:normal; color:#FF5B2E; }
.logo { width:100%; height:100%; display:block; }
.kick { display:inline-flex; align-items:center; gap:14px; font-size:24px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#FF5B2E; }
.kick i { display:block; width:14px; height:14px; background:#FF5B2E; }
.pill { display:inline-block; background:#FF5B2E; color:#0B0C0E; font-weight:700; font-size:22px; letter-spacing:.14em; padding:10px 16px 9px; text-transform:uppercase; }
.meta { font-size:24px; color:#8E8A83; letter-spacing:.06em; text-transform:uppercase; }
.head { font-family:"League Gothic"; text-transform:uppercase; line-height:.9; letter-spacing:-.005em; color:#F2EEE7; }
.rule { height:3px; background:rgba(242,238,231,.22); transform-origin:left center; }
.rule.acc { background:#FF5B2E; }

/* ── título ── */
.t-wrap { position:absolute; left:120px; top:190px; width:1120px; display:flex; flex-direction:column; gap:30px; }
.t-row { display:flex; align-items:center; gap:22px; }
.t-logo { width:64px; height:64px; color:#F2EEE7; }
.t-co { font-size:30px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.t-num { font-family:"League Gothic"; font-size:64px; line-height:1; color:#FF5B2E; }
.t-head { font-size:176px; max-width:1120px; }
.t-sub { font-size:32px; line-height:1.4; color:#C9C4BB; max-width:960px; }
.emb { position:absolute; left:1300px; top:250px; width:520px; height:520px; }
.emb svg.rings { position:absolute; inset:0; width:520px; height:520px; overflow:visible; }
.emb .elogo { position:absolute; left:160px; top:160px; width:200px; height:200px; color:#F2EEE7; }
.emb .elbl { position:absolute; left:0; right:0; bottom:-64px; text-align:center; font-size:22px; letter-spacing:.2em; color:#8E8A83; }

/* ── captura ── */
.c-left { position:absolute; left:120px; top:210px; width:470px; display:flex; flex-direction:column; gap:28px; }
.c-cap { font-size:92px; }
.c-url { font-size:22px; color:#8E8A83; word-break:break-all; line-height:1.4; }
.c-stage { position:absolute; left:640px; top:150px; width:1180px; height:790px; perspective:2200px; }
.bframe { position:absolute; inset:0; border-radius:20px; background:#15171B; overflow:hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,.6), 0 0 0 2px rgba(242,238,231,.14); }
.bbar { position:absolute; left:0; right:0; top:0; height:58px; background:#1D1F24; display:flex; align-items:center; gap:12px; padding:0 22px; }
.bbar i { display:block; width:16px; height:16px; border-radius:50%; background:#3A3D44; }
.burl { margin-left:18px; flex:1; height:36px; border-radius:18px; background:#0F1013; color:#B9B4AB; font-size:19px; line-height:36px; padding:0 20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bview { position:absolute; left:0; right:0; top:58px; bottom:0; overflow:hidden; background:#fff; }
.bcam { position:absolute; left:0; top:0; transform-origin:0 0; }
.bcam img { display:block; }
.focus { position:absolute; border:5px solid #FF5B2E; border-radius:10px; box-shadow:0 0 0 9999px rgba(11,12,14,.42), 0 0 40px rgba(255,91,46,.55); }
.ftag { position:absolute; left:-5px; top:-44px; background:#FF5B2E; color:#0B0C0E; font-weight:700; font-size:18px; letter-spacing:.14em; padding:8px 12px 7px; white-space:nowrap; }
.shot { position:absolute; left:0; top:0; width:1180px; height:790px; background:#F2EEE7; opacity:0; }

/* ── cifra ── */
.s-wrap { position:absolute; left:120px; top:170px; width:1680px; height:760px; }
.s-kick { position:absolute; left:0; top:10px; }
.s-num { position:absolute; left:-8px; top:130px; font-family:"League Gothic"; font-size:420px; line-height:.82; color:#F2EEE7; letter-spacing:-.01em; white-space:nowrap; }
.s-num span { display:inline-block; line-height:.8; vertical-align:top; }
.s-num .u { color:#FF5B2E; font-size:.55em; margin-left:.06em; }
.s-num .p { color:#FF5B2E; font-size:.55em; margin-right:.04em; }
.s-side { position:absolute; left:1040px; top:140px; width:640px; display:flex; flex-direction:column; gap:26px; }
.s-label { font-family:"League Gothic"; font-size:96px; line-height:.95; text-transform:uppercase; }
.s-ctx { font-size:28px; line-height:1.45; color:#C9C4BB; }
.s-bar { position:absolute; left:0; right:0; bottom:40px; height:26px; background:rgba(242,238,231,.1); }
.s-fill { position:absolute; left:0; top:0; bottom:0; width:100%; background:#FF5B2E; transform-origin:left center; }
.s-ticks { position:absolute; left:0; right:0; bottom:0; height:30px; display:flex; justify-content:space-between; font-size:20px; color:#8E8A83; }
.s-extra { display:flex; gap:48px; margin-top:12px; }
.s-extra div { display:flex; flex-direction:column; gap:6px; }
.s-extra b { font-family:"League Gothic"; font-weight:400; font-size:84px; line-height:1; color:#F2EEE7; }
.s-extra span { font-size:20px; color:#8E8A83; letter-spacing:.08em; text-transform:uppercase; }

/* ── post en X ── */
.x-stage { position:absolute; left:130px; top:150px; width:760px; height:800px; perspective:1800px; display:flex; align-items:center; justify-content:center; }
.x-card { position:relative; border-radius:24px; overflow:hidden; background:#000;
  box-shadow: 0 40px 120px rgba(0,0,0,.65), 0 0 0 2px rgba(242,238,231,.16), 0 0 80px rgba(255,91,46,.18); }
.x-card img { display:block; }
.x-right { position:absolute; left:990px; top:220px; width:820px; display:flex; flex-direction:column; gap:32px; }
.x-badge { display:flex; align-items:center; gap:16px; font-size:24px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
.x-badge .xl { width:40px; height:40px; color:#F2EEE7; }
.x-quote { font-size:104px; }
.x-attr { font-size:26px; color:#C9C4BB; }

/* ── puntos ── */
.p-wrap { position:absolute; left:120px; top:180px; width:1680px; display:flex; flex-direction:column; gap:0; }
.p-title { margin-bottom:34px; }
.p-row { position:relative; display:flex; align-items:center; gap:40px; padding:28px 0; }
.p-row .rule { position:absolute; left:0; right:0; top:0; }
.p-idx { font-family:"League Gothic"; font-size:88px; line-height:1; color:#FF5B2E; width:110px; }
.p-txt { font-family:"League Gothic"; font-size:92px; line-height:1; text-transform:uppercase; }
.p-note { margin-left:auto; font-size:24px; color:#8E8A83; text-align:right; max-width:520px; line-height:1.4; }

/* ── comparación ── */
.v-wrap { position:absolute; left:120px; right:120px; top:190px; bottom:170px; display:grid; grid-template-columns:1fr 120px 1fr; }
.v-col { display:flex; flex-direction:column; gap:22px; justify-content:center; }
.v-col.r { align-items:flex-end; text-align:right; }
.v-lbl { font-size:28px; letter-spacing:.14em; text-transform:uppercase; color:#8E8A83; }
.v-val { font-family:"League Gothic"; font-size:300px; line-height:.9; white-space:nowrap; }
.v-col.r .v-val { color:#FF5B2E; }
.v-sub { font-size:28px; color:#C9C4BB; max-width:620px; line-height:1.4; }
.v-mid { display:flex; align-items:center; justify-content:center; }
.v-line { width:3px; height:100%; background:rgba(242,238,231,.22); transform-origin:center top; }

/* ── cita ── */
.q-wrap { position:absolute; left:200px; top:220px; width:1520px; display:flex; flex-direction:column; gap:40px; }
.q-mark { font-family:"League Gothic"; font-size:300px; line-height:.6; color:#FF5B2E; height:130px; }
.q-txt { font-size:128px; }
.q-attr { font-size:28px; color:#C9C4BB; letter-spacing:.06em; }

/* ── rótulo inferior persistente ── */
.lt { position:absolute; left:120px; bottom:118px; display:flex; align-items:stretch; height:64px; opacity:0; }
.lt-n { background:#FF5B2E; color:#0B0C0E; font-family:"League Gothic"; font-size:48px; line-height:64px; padding:0 18px; }
.lt-b { background:#F2EEE7; color:#0B0C0E; display:flex; align-items:center; gap:14px; padding:0 22px; font-size:24px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; }
.lt-b .ll { width:30px; height:30px; color:#0B0C0E; }
.lt-src { display:flex; align-items:center; padding:0 18px; background:#15171B; color:#B9B4AB; font-size:20px; letter-spacing:.08em; }
`;

// ── Fondo común de escena ───────────────────────────────────────────────────
const bg = (id, ghost) => `
  <div class="layer">
    <div class="bggrid" id="${id}-grid"></div>
    <div class="bgglow" id="${id}-glow" style="left:${ghost ? 820 : 210}px; top:-420px;"></div>
    ${ghost ? `<div class="ghost" id="${id}-ghost" aria-hidden="true" data-layout-ignore>${esc(ghost)}</div>` : ""}
    <div class="reg tl"></div><div class="reg tr"></div><div class="reg bl"></div><div class="reg br"></div>
  </div>`;

const bgMotion = (id, dur, ghost) => `
  tl.fromTo("#${id}-grid", { x: 0, y: 0 }, { x: -80, y: -80, duration: ${dur}, ease: "none" }, 0);
  tl.fromTo("#${id}-glow", { scale: 0.9, x: 0 }, { scale: 1.12, x: 260, duration: ${dur}, ease: "sine.inOut" }, 0);
  ${ghost ? `tl.fromTo("#${id}-ghost", { x: 120 }, { x: -60, duration: ${dur}, ease: "none" }, 0);` : ""}`;

// ── Beats ───────────────────────────────────────────────────────────────────
// Cada renderer devuelve { html, js } para una fase con id pid, en tiempo local
// de la sección (t0 = inicio del beat).
const R = {};

R.title = (b, sec, pid, t0) => {
  const html = `
  <div class="phase" id="${pid}">
    <div class="t-wrap">
      <div class="t-row" id="${pid}-row">
        ${sec.num ? `<div class="t-num">${sec.num}</div>` : ""}
        ${sec.logo ? `<div class="t-logo">${logoSvg(sec.logo)}</div>` : ""}
        <div class="t-co">${esc(sec.company ?? "")}</div>
        <div class="meta">· ${esc(sec.date ?? "")}</div>
      </div>
      <div><span class="pill" id="${pid}-pill">${esc(b.kicker ?? sec.kicker ?? "")}</span></div>
      <div class="head t-head" id="${pid}-head">${words(b.headline)}</div>
      <div class="rule acc" id="${pid}-rule" style="width:220px"></div>
      ${b.sub ? `<div class="t-sub" id="${pid}-sub">${esc(b.sub)}</div>` : ""}
    </div>
    <div class="emb" id="${pid}-emb">
      <svg class="rings" viewBox="0 0 520 520">
        <circle id="${pid}-r1" cx="260" cy="260" r="250" fill="none" stroke="rgba(242,238,231,.25)" stroke-width="2" stroke-dasharray="1571" stroke-dashoffset="1571"/>
        <circle id="${pid}-r2" cx="260" cy="260" r="200" fill="none" stroke="#FF5B2E" stroke-width="4" stroke-dasharray="14 18"/>
        <circle id="${pid}-r3" cx="260" cy="260" r="150" fill="none" stroke="rgba(242,238,231,.18)" stroke-width="2"/>
        <g stroke="rgba(242,238,231,.5)" stroke-width="3">
          <line x1="260" y1="-10" x2="260" y2="30"/><line x1="260" y1="490" x2="260" y2="530"/>
          <line x1="-10" y1="260" x2="30" y2="260"/><line x1="490" y1="260" x2="530" y2="260"/>
        </g>
      </svg>
      <div class="elogo" id="${pid}-elogo">${logoSvg(sec.logo)}</div>
      <div class="elbl">${esc(b.emblemLabel ?? `SEÑAL ${sec.num ?? ""} · ${sec.company ?? ""}`)}</div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-row", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, ${t0 + 0.1});
  tl.fromTo("#${pid}-pill", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power4.out" }, ${t0 + 0.25});
  tl.fromTo("#${pid}-head .w", { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.06 }, ${t0 + 0.3});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power4.inOut" }, ${t0 + 0.7});
  ${b.sub ? `tl.fromTo("#${pid}-sub", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, ${t0 + 0.9});` : ""}
  tl.fromTo("#${pid}-r1", { strokeDashoffset: 1571 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, ${t0 + 0.2});
  tl.fromTo("#${pid}-r2", { rotation: 0, svgOrigin: "260 260", opacity: 0 }, { rotation: 90, svgOrigin: "260 260", opacity: 1, duration: ${b.dur}, ease: "none" }, ${t0});
  tl.fromTo("#${pid}-r3", { scale: 0.6, svgOrigin: "260 260", opacity: 0 }, { scale: 1, svgOrigin: "260 260", opacity: 1, duration: 0.9, ease: "back.out(1.6)" }, ${t0 + 0.35});
  tl.fromTo("#${pid}-elogo", { scale: 0.3, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(1.8)" }, ${t0 + 0.45});
  tl.fromTo("#${pid}-emb", { y: 0 }, { y: -26, duration: ${b.dur}, ease: "sine.inOut" }, ${t0});`;
  return { html, js, sfx: [{ id: "impact", at: t0 + 0.3, vol: 0.32 }] };
};

R.capture = (b, sec, pid, t0) => {
  const meta = capMeta(b.img);
  if (!meta) throw new Error(`sin metadatos de captura: ${b.img}`);
  const VW = 1180, VH = 790 - 58;
  const s0 = VW / meta.width; // escala base: ancho de página → ancho del marco
  const imgH = meta.height * s0;
  const rect = b.focus ? (meta.rects?.[b.focus] ?? null) : null;
  if (b.focus && !rect) console.warn(`  ! ${pid}: no se localizó "${b.focus}" en ${b.img}`);
  // Cámara: scroll inicial → encuadre final sobre el foco
  const pad = 14;
  let fx, fy, fw, fh;
  if (rect) { fx = rect.x * s0 - pad; fy = rect.y * s0 - pad; fw = rect.w * s0 + pad * 2; fh = rect.h * s0 + pad * 2; }
  const zoom = rect ? Math.min(b.zoom ?? 1.7, (VW * 0.82) / fw, (VH * 0.6) / fh) : 1;
  const clampY = (y, s) => Math.min(0, Math.max(VH - imgH * s, y));
  const clampX = (x, s) => Math.min(0, Math.max(VW - VW * s, x));
  const startY = clampY(-(b.scrollFrom ?? 0) * s0, 1);
  let endX = 0, endY = clampY(-(b.scrollTo ?? 0) * s0, 1);
  if (rect) {
    endX = clampX(VW / 2 - (fx + fw / 2) * zoom, zoom);
    endY = clampY(VH / 2 - (fy + fh / 2) * zoom, zoom);
  }
  const preY = rect ? clampY(VH / 2 - (fy + fh / 2), 1) : endY;
  const d = b.dur;
  const tZoom = t0 + Math.max(0.9, Math.min(d * 0.32, d - 1.9));
  const html = `
  <div class="phase" id="${pid}">
    <div class="c-left">
      <div class="kick" id="${pid}-k"><i></i>${esc(b.kicker ?? "Fuente oficial")}</div>
      <div class="head c-cap" id="${pid}-cap">${words(b.caption)}</div>
      <div class="rule acc" id="${pid}-rule" style="width:160px"></div>
      <div class="c-url" id="${pid}-url">${esc(b.urlLabel ?? meta.url?.replace(/^https?:\/\//, "") ?? "")}</div>
    </div>
    <div class="c-stage">
      <div class="bframe" id="${pid}-frame">
        <div class="bbar"><i></i><i></i><i></i><div class="burl">${esc(meta.url?.replace(/^https?:\/\//, "") ?? "")}</div></div>
        <div class="bview">
          <div class="bcam" id="${pid}-cam" style="width:${VW}px; height:${r3(imgH)}px;">
            <img src="${b.img}" style="width:${VW}px; height:${r3(imgH)}px;" />
            ${rect ? `<div class="focus" id="${pid}-focus" style="left:${r3(fx)}px; top:${r3(fy)}px; width:${r3(fw)}px; height:${r3(fh)}px; border-width:${r3(5 / zoom)}px;"><div class="ftag" style="transform:scale(${r3(1 / zoom)}); transform-origin:0 100%;">${esc(b.focusLabel ?? "Clave")}</div></div>` : ""}
          </div>
        </div>
        <div class="shot" id="${pid}-shot"></div>
      </div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-k", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, ${t0 + 0.1});
  tl.fromTo("#${pid}-cap .w", { yPercent: 110 }, { yPercent: 0, duration: 0.65, ease: "expo.out", stagger: 0.05 }, ${t0 + 0.2});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.inOut" }, ${t0 + 0.55});
  tl.fromTo("#${pid}-url", { opacity: 0 }, { opacity: 1, duration: 0.5 }, ${t0 + 0.7});
  tl.fromTo("#${pid}-frame", { rotationY: -24, rotationX: 8, x: 260, z: -300, opacity: 0 },
    { rotationY: -7, rotationX: 3, x: 0, z: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, ${t0});
  tl.fromTo("#${pid}-frame", { rotationY: -7, rotationX: 3 }, { rotationY: -2, rotationX: 1, duration: ${r3(Math.max(0.5, d - 1.1))}, ease: "sine.inOut", immediateRender: false }, ${t0 + 1.1});
  tl.fromTo("#${pid}-shot", { opacity: 0.9 }, { opacity: 0, duration: 0.35, ease: "power2.out" }, ${t0 + 0.15});
  tl.fromTo("#${pid}-cam", { x: 0, y: ${r3(startY)}, scale: 1 }, { x: 0, y: ${r3(preY)}, scale: 1, duration: ${r3(Math.max(0.3, tZoom - t0 - 0.2))}, ease: "power2.inOut" }, ${t0});
  ${rect ? `tl.fromTo("#${pid}-cam", { x: 0, y: ${r3(preY)}, scale: 1 }, { x: ${r3(endX)}, y: ${r3(endY)}, scale: ${r3(zoom)}, duration: 1.3, ease: "power3.inOut", immediateRender: false }, ${r3(tZoom)});` : ""}
  ${rect ? `tl.fromTo("#${pid}-focus", { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, ${r3(tZoom + 0.85)});` : ""}`;
  return { html, js, sfx: [{ id: "shutter", at: t0 + 0.12, vol: 0.34 }, ...(rect ? [{ id: "whoosh2", at: tZoom, vol: 0.2 }, { id: "tick", at: tZoom + 0.85, vol: 0.3 }] : [])] };
};

R.stat = (b, sec, pid, t0) => {
  const dec = b.decimals ?? 0;
  const fmt = (v) => v.toFixed(dec).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  // Tamaño que cabe en la columna izquierda (League Gothic ≈ 0,43 em por dígito)
  const glyphs = fmt(b.value).length + ((b.prefix ?? "").length + (b.suffix ?? "").length) * 0.6;
  const numSize = Math.round(Math.min(420, 900 / (glyphs * 0.43)));
  const html = `
  <div class="phase" id="${pid}">
    <div class="s-wrap">
      <div class="kick s-kick" id="${pid}-k"><i></i>${esc(b.kicker ?? "El dato")}</div>
      <div class="s-num" id="${pid}-num" style="font-size:${numSize}px">${b.prefix ? `<span class="p">${esc(b.prefix)}</span>` : ""}<span id="${pid}-v">${fmt(b.value)}</span>${b.suffix ? `<span class="u">${esc(b.suffix)}</span>` : ""}</div>
      <div class="s-side">
        <div class="head s-label" id="${pid}-lbl">${words(b.label)}</div>
        <div class="rule acc" id="${pid}-rule" style="width:140px"></div>
        ${b.context ? `<div class="s-ctx" id="${pid}-ctx">${esc(b.context)}</div>` : ""}
        ${b.extra ? `<div class="s-extra" id="${pid}-ex">${b.extra.map((e) => `<div><b>${esc(e.value)}</b><span>${esc(e.label)}</span></div>`).join("")}</div>` : ""}
      </div>
      ${b.bar != null ? `<div class="s-bar"><div class="s-fill" id="${pid}-fill"></div></div>` : ""}
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-k", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, ${t0 + 0.05});
  tl.fromTo("#${pid}-num", { opacity: 0, y: 80, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out", transformOrigin: "0% 100%" }, ${t0 + 0.1});
  {
    const el = document.getElementById("${pid}-v"); const p = { v: ${b.from ?? 0} };
    tl.fromTo(p, { v: ${b.from ?? 0} }, { v: ${b.value}, duration: 1.4, ease: "power3.out",
      onUpdate: () => { el.textContent = p.v.toFixed(${dec}).replace(".", ",").replace(/\\B(?=(\\d{3})+(?!\\d))/g, "."); } }, ${t0 + 0.15});
  }
  tl.fromTo("#${pid}-lbl .w", { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 }, ${t0 + 0.45});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.inOut" }, ${t0 + 0.7});
  ${b.context ? `tl.fromTo("#${pid}-ctx", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, ${t0 + 0.85});` : ""}
  ${b.extra ? `tl.fromTo("#${pid}-ex > div", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)", stagger: 0.12 }, ${t0 + 1.0});` : ""}
  ${b.bar != null ? `tl.fromTo("#${pid}-fill", { scaleX: 0 }, { scaleX: ${b.bar}, duration: 1.4, ease: "power3.out" }, ${t0 + 0.2});` : ""}
  tl.fromTo("#${pid}-num", { x: 0 }, { x: 24, duration: ${b.dur}, ease: "none", immediateRender: false }, ${t0 + 0.9});`;
  return { html, js, sfx: [{ id: "impact", at: t0 + 0.12, vol: 0.3 }, { id: "tick", at: t0 + 1.5, vol: 0.28 }] };
};

R.tweet = (b, sec, pid, t0) => {
  const meta = capMeta(b.img);
  // Cabe en 720 × 740 px sin salirse del cuadro
  const sc = Math.min(720 / meta.width, 740 / meta.height);
  const tw = meta.width * sc, th = meta.height * sc;
  const html = `
  <div class="phase" id="${pid}">
    <div class="x-stage">
      <div class="x-card" id="${pid}-card" style="width:${r3(tw)}px"><img src="${b.img}" style="width:${r3(tw)}px; height:${r3(th)}px" /></div>
    </div>
    <div class="x-right">
      <div class="x-badge" id="${pid}-bd"><span class="xl">${logoSvg("x")}</span>${esc(b.kicker ?? "Publicado en X")}</div>
      <div class="head x-quote" id="${pid}-q">${words(b.quote)}</div>
      <div class="rule acc" id="${pid}-rule" style="width:160px"></div>
      <div class="x-attr" id="${pid}-at">${esc(b.attribution ?? "")}</div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-card", { y: 380, rotationX: 28, rotationZ: -6, opacity: 0, scale: 0.9 }, { y: 0, rotationX: 0, rotationZ: -2, opacity: 1, scale: 1, duration: 1.0, ease: "expo.out" }, ${t0});
  tl.fromTo("#${pid}-card", { y: 0, rotationZ: -2 }, { y: -30, rotationZ: 1, duration: ${r3(Math.max(0.5, b.dur - 1))}, ease: "sine.inOut", immediateRender: false }, ${t0 + 1.0});
  tl.fromTo("#${pid}-bd", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, ${t0 + 0.3});
  tl.fromTo("#${pid}-q .w", { yPercent: 110 }, { yPercent: 0, duration: 0.65, ease: "expo.out", stagger: 0.05 }, ${t0 + 0.5});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.inOut" }, ${t0 + 0.9});
  tl.fromTo("#${pid}-at", { opacity: 0 }, { opacity: 1, duration: 0.5 }, ${t0 + 1.0});`;
  return { html, js, sfx: [{ id: "pop", at: t0 + 0.15, vol: 0.4 }] };
};

R.points = (b, sec, pid, t0) => {
  const n = b.items.length;
  const span = Math.max(0.3, Math.min(0.9, (b.dur - 1.5) / n));
  const html = `
  <div class="phase" id="${pid}">
    <div class="p-wrap">
      <div class="kick p-title" id="${pid}-k"><i></i>${esc(b.kicker ?? "")}</div>
      ${b.items.map((it, i) => `
      <div class="p-row" id="${pid}-r${i}">
        <div class="rule" id="${pid}-rl${i}"></div>
        <div class="p-idx">${String(i + 1).padStart(2, "0")}</div>
        <div class="p-txt">${words(it.text)}</div>
        ${it.note ? `<div class="p-note">${esc(it.note)}</div>` : ""}
      </div>`).join("")}
    </div>
  </div>`;
  const at = (i) => r3(t0 + 0.3 + (b.itemOffsets?.[i] ?? i * span));
  const js = `
  tl.fromTo("#${pid}-k", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, ${t0 + 0.05});
  ${b.items.map((_, i) => `
  tl.fromTo("#${pid}-rl${i}", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power4.inOut" }, ${at(i)});
  tl.fromTo("#${pid}-r${i} .p-idx", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.7)" }, ${at(i) + 0.1});
  tl.fromTo("#${pid}-r${i} .w", { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "expo.out", stagger: 0.04 }, ${at(i) + 0.12});
  tl.fromTo("#${pid}-r${i} .p-note", { opacity: 0 }, { opacity: 1, duration: 0.4 }, ${at(i) + 0.35});`).join("")}`;
  return { html, js, sfx: b.items.map((_, i) => ({ id: "tick", at: at(i) + 0.1, vol: 0.26 })) };
};

R.compare = (b, sec, pid, t0) => {
  const vSize = (v) => Math.round(Math.min(300, 700 / (String(v).length * 0.43)));
  const html = `
  <div class="phase" id="${pid}">
    <div class="v-wrap">
      <div class="v-col" id="${pid}-a">
        <div class="v-lbl">${esc(b.a.label)}</div>
        <div class="v-val" style="font-size:${vSize(b.a.value)}px">${esc(b.a.value)}</div>
        <div class="v-sub">${esc(b.a.sub ?? "")}</div>
      </div>
      <div class="v-mid"><div class="v-line" id="${pid}-ln"></div></div>
      <div class="v-col r" id="${pid}-b">
        <div class="v-lbl">${esc(b.b.label)}</div>
        <div class="v-val" style="font-size:${vSize(b.b.value)}px">${esc(b.b.value)}</div>
        <div class="v-sub">${esc(b.b.sub ?? "")}</div>
      </div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-ln", { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: "power4.inOut" }, ${t0 + 0.05});
  tl.fromTo("#${pid}-a", { opacity: 0, x: -120, rotationY: 20 }, { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "expo.out" }, ${t0 + 0.15});
  tl.fromTo("#${pid}-b", { opacity: 0, x: 120, rotationY: -20 }, { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "expo.out" }, ${t0 + (b.bDelay ?? 0.6)});`;
  return { html, js, sfx: [{ id: "whoosh2", at: t0 + 0.1, vol: 0.2 }, { id: "impact", at: t0 + (b.bDelay ?? 0.6), vol: 0.26 }] };
};

R.quote = (b, sec, pid, t0) => {
  const html = `
  <div class="phase" id="${pid}">
    <div class="q-wrap">
      <div class="q-mark" id="${pid}-m">“</div>
      <div class="head q-txt" id="${pid}-q">${words(b.quote)}</div>
      <div class="rule acc" id="${pid}-rule" style="width:180px"></div>
      <div class="q-attr" id="${pid}-at">${esc(b.attribution ?? "")}</div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-m", { opacity: 0, y: 60, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.8)" }, ${t0 + 0.05});
  tl.fromTo("#${pid}-q .w", { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.05 }, ${t0 + 0.2});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.inOut" }, ${t0 + 0.6});
  tl.fromTo("#${pid}-at", { opacity: 0 }, { opacity: 1, duration: 0.5 }, ${t0 + 0.8});`;
  return { html, js, sfx: [] };
};

// Vídeo oficial dentro del marco (solo si el fichero existe en assets/video/)
R.video = (b, sec, pid, t0) => {
  const html = `
  <div class="phase" id="${pid}">
    <div class="c-left">
      <div class="kick" id="${pid}-k"><i></i>${esc(b.kicker ?? "Vídeo oficial")}</div>
      <div class="head c-cap" id="${pid}-cap">${words(b.caption)}</div>
      <div class="rule acc" id="${pid}-rule" style="width:160px"></div>
      <div class="c-url">${esc(b.credit ?? "")}</div>
    </div>
    <div class="c-stage">
      <div class="bframe" id="${pid}-frame">
        <div class="bbar"><i></i><i></i><i></i><div class="burl">${esc(b.urlLabel ?? "")}</div></div>
        <div class="bview" style="background:#000">
          <video id="${pid}-vid" class="clip" src="${b.src}" data-start="${r3(t0)}" data-duration="${r3(b.dur)}" data-media-start="${b.mediaStart ?? 0}" data-track-index="2" muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
        </div>
      </div>
    </div>
  </div>`;
  const js = `
  tl.fromTo("#${pid}-k", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, ${t0 + 0.1});
  tl.fromTo("#${pid}-cap .w", { yPercent: 110 }, { yPercent: 0, duration: 0.65, ease: "expo.out", stagger: 0.05 }, ${t0 + 0.2});
  tl.fromTo("#${pid}-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.inOut" }, ${t0 + 0.55});
  tl.fromTo("#${pid}-frame", { rotationY: 22, x: -200, opacity: 0, scale: 0.9 }, { rotationY: 4, x: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, ${t0});
  tl.fromTo("#${pid}-frame", { rotationY: 4 }, { rotationY: -2, duration: ${r3(Math.max(0.5, b.dur - 1.1))}, ease: "sine.inOut", immediateRender: false }, ${t0 + 1.1});`;
  return { html, js, sfx: [{ id: "whoosh", at: t0, vol: 0.22 }] };
};

// ── Sección de noticia ──────────────────────────────────────────────────────
const allSfx = [];
function storyComp(sec) {
  const id = sec.id;
  let html = "", js = "";
  sec.beats.forEach((b, bi) => {
    const pid = `${id}-b${bi}`;
    const r = R[b.type](b, sec, pid, b.start);
    html += r.html;
    // Visibilidad de la fase + salida suave
    const out = Math.max(b.start + 0.2, b.end - 0.28);
    js += `
  tl.set("#${pid}", { opacity: 1 }, ${b.start});
  ${bi < sec.beats.length - 1 ? `tl.fromTo("#${pid}", { opacity: 1, y: 0, filter: "blur(0px)" }, { opacity: 0, y: -24, filter: "blur(6px)", duration: 0.28, ease: "power2.in", immediateRender: false }, ${r3(out)});` : ""}
  ${r.js}`;
    r.sfx.forEach((s) => allSfx.push({ ...s, at: r3(sec.start + s.at) }));
  });
  // Rótulo inferior persistente tras el título
  const ltStart = sec.beats[1]?.start ?? 1;
  const ltEnd = sec.dur - 0.35;
  const lower = `
  <div class="lt" id="${id}-lt">
    <div class="lt-n">${sec.num}</div>
    <div class="lt-b"><span class="ll">${logoSvg(sec.logo)}</span>${esc(sec.slug ?? sec.company)}</div>
    <div class="lt-src">${esc(sec.date ?? "")}</div>
  </div>`;
  js += `
  tl.fromTo("#${id}-lt", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, ${r3(ltStart + 0.4)});
  tl.to("#${id}-lt", { opacity: 0, x: -30, duration: 0.3, ease: "power2.in" }, ${r3(ltEnd)});`;
  return subComp(id, bg(id, sec.num) + html + lower, bgMotion(id, sec.dur, true) + js, sec.dur);
}

function subComp(id, body, js, dur) {
  return `<!doctype html>
<html lang="es">
  <head><meta charset="UTF-8" /></head>
  <body>
    <template id="${id}-template">
      <style>${CSS}</style>
      <div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}" data-duration="${dur}">
${body}
      </div>
      <script>
        const tl = gsap.timeline({ paused: true });
${js}
        window.__timelines["${id}"] = tl;
      </script>
    </template>
  </body>
</html>
`;
}

// ── Intro ───────────────────────────────────────────────────────────────────
function introComp(sec) {
  const id = sec.id;
  const bars = 36;
  // Ecualizador de señal: alturas pseudoaleatorias deterministas
  const prng = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const flurry = story.stories.map((s) => ({ num: s.num, logo: s.logo, co: s.company, h: s.flash ?? s.slug }));
  const b0 = sec.beats[0], b1 = sec.beats[1], b2 = sec.beats[2];
  const fStart = b1.start + 0.2, fEnd = (b2 ? b2.start : sec.dur) - 0.2;
  const step = (fEnd - fStart) / flurry.length;
  let html = `
  <style>
    .i-center { position:absolute; left:0; right:0; top:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .i-scan { position:absolute; left:0; right:0; top:538px; height:4px; background:#FF5B2E; transform-origin:center; box-shadow:0 0 30px rgba(255,91,46,.8); }
    .i-eq { position:absolute; left:360px; right:360px; top:390px; height:300px; display:flex; align-items:center; justify-content:space-between; }
    .i-eq i { display:block; width:18px; height:300px; background:#F2EEE7; transform-origin:center; opacity:.9; }
    .i-logo { font-family:"League Gothic"; font-size:420px; line-height:.8; letter-spacing:.02em; color:#F2EEE7; position:relative; }
    .i-logo .ch { display:inline-block; }
    .i-logo .dot { color:#FF5B2E; }
    .i-sub { margin-top:40px; font-size:30px; letter-spacing:.3em; color:#C9C4BB; text-transform:uppercase; }
    .i-sub b { color:#FF5B2E; font-weight:700; }
    .i-fl { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:36px; opacity:0; }
    .i-fl .fl-row { display:flex; align-items:center; gap:24px; font-size:30px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#C9C4BB; }
    .i-fl .fl-n { font-family:"League Gothic"; font-size:60px; color:#FF5B2E; font-weight:400; letter-spacing:0; }
    .i-fl .fl-l { width:60px; height:60px; color:#F2EEE7; }
    .i-fl .fl-h { font-family:"League Gothic"; font-size:210px; line-height:.9; text-transform:uppercase; text-align:center; max-width:1600px; }
    .i-cnt { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:60px; opacity:0; }
    .i-cnt .big { font-family:"League Gothic"; font-size:520px; line-height:.8; color:#FF5B2E; }
    .i-cnt .txt { font-family:"League Gothic"; font-size:150px; line-height:.9; text-transform:uppercase; }
    .i-flash { position:absolute; inset:0; background:#F2EEE7; opacity:0; }
  </style>
  <div class="i-eq" id="${id}-eq">${Array.from({ length: bars }, (_, i) => `<i id="${id}-eq${i}"></i>`).join("")}</div>
  <div class="i-scan" id="${id}-scan"></div>
  <div class="i-center" id="${id}-brand">
    <div class="i-logo" id="${id}-logo">${"SEÑAL".split("").map((c, i) => `<span class="wm"><span class="ch" id="${id}-c${i}">${c}</span></span>`).join("")}<span class="wm"><span class="ch dot" id="${id}-c5">.</span></span></div>
    <div class="i-sub" id="${id}-sub">${esc(sec.subtitle)}</div>
  </div>
  ${flurry.map((f, i) => `
  <div class="i-fl" id="${id}-f${i}">
    <div class="fl-row"><span class="fl-n">${f.num}</span><span class="fl-l">${logoSvg(f.logo)}</span>${esc(f.co)}</div>
    <div class="fl-h">${esc(f.h)}</div>
  </div>`).join("")}
  ${b2 ? `<div class="i-cnt" id="${id}-cnt"><div class="big">${story.stories.length}</div><div class="txt">${words(b2.headline)}</div></div>` : ""}
  <div class="i-flash" id="${id}-flash"></div>`;
  let js = bgMotion(id, sec.dur, null);
  js += `
  tl.fromTo("#${id}-scan", { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.9, ease: "expo.inOut" }, 0.2);
  tl.to("#${id}-scan", { opacity: 0, scaleY: 30, duration: 0.25, ease: "power2.in" }, 1.1);`;
  for (let i = 0; i < bars; i++) {
    const seq = [0.05, ...Array.from({ length: 6 }, (_, k) => r3(0.15 + prng(i, k) * 0.85)), 0.02];
    js += `\n  tl.fromTo("#${id}-eq${i}", { scaleY: 0.01 }, { keyframes: { scaleY: [${seq.join(",")}] }, duration: 1.3, ease: "none" }, ${r3(1.0 + (Math.abs(i - bars / 2) * 0.012))});`;
  }
  js += `
  tl.fromTo("#${id}-eq", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, 2.15);
  tl.fromTo("#${id}-flash", { opacity: 0 }, { keyframes: { opacity: [0, 0.85, 0] }, duration: 0.35, ease: "none" }, 2.25);
  tl.fromTo("#${id}-logo .ch", { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 2.3);
  tl.fromTo("#${id}-logo", { scale: 1.2 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 2.3);
  ${[0,1,2,3,4,5].map((i) => `tl.fromTo("#${id}-c${i}", { x: ${(i - 2.5) * 60} }, { x: 0, duration: 1.6, ease: "expo.out", immediateRender: false }, 2.3);`).join("\n  ")}
  tl.fromTo("#${id}-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" }, 2.9);
  tl.to("#${id}-brand", { opacity: 0, scale: 0.94, filter: "blur(10px)", duration: 0.35, ease: "power2.in" }, ${r3(fStart - 0.3)});`;
  allSfx.push({ id: "glitch", at: 1.0, vol: 0.3 }, { id: "impact", at: 2.3, vol: 0.45 });
  flurry.forEach((f, i) => {
    const a = r3(fStart + i * step), z = r3(fStart + (i + 1) * step);
    js += `
  tl.set("#${id}-f${i}", { opacity: 1 }, ${a});
  tl.fromTo("#${id}-f${i} .fl-h", { scale: 1.35, filter: "blur(14px)" }, { scale: 1, filter: "blur(0px)", duration: ${r3(Math.min(0.4, step * 0.6))}, ease: "expo.out" }, ${a});
  tl.fromTo("#${id}-f${i} .fl-h", { scale: 1 }, { scale: 0.96, duration: ${r3(step)}, ease: "none", immediateRender: false }, ${r3(a + 0.4)});
  tl.set("#${id}-f${i}", { opacity: 0 }, ${z});`;
    allSfx.push({ id: i % 2 ? "whoosh2" : "tick", at: r3(sec.start + a), vol: i % 2 ? 0.16 : 0.3 });
  });
  if (b2) {
    js += `
  tl.set("#${id}-cnt", { opacity: 1 }, ${r3(b2.start)});
  tl.fromTo("#${id}-cnt .big", { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" }, ${r3(b2.start)});
  tl.fromTo("#${id}-cnt .w", { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.07 }, ${r3(b2.start + 0.2)});`;
    allSfx.push({ id: "impact", at: r3(sec.start + b2.start), vol: 0.4 });
  }
  return subComp(id, bg(id, null) + html, js, sec.dur);
}

// ── Cierre ──────────────────────────────────────────────────────────────────
function outroComp(sec) {
  const id = sec.id;
  const b0 = sec.beats[0], b1 = sec.beats[1];
  const html = `
  <style>
    .o-grid { position:absolute; left:120px; right:120px; top:170px; display:grid; grid-template-columns:repeat(5, 1fr); gap:24px; }
    .o-card { position:relative; height:340px; background:#15171B; border:2px solid rgba(242,238,231,.14); padding:30px; display:flex; flex-direction:column; gap:18px; }
    .o-card .top { display:flex; align-items:center; gap:16px; }
    .o-card .n { font-family:"League Gothic"; font-size:56px; line-height:1; color:#FF5B2E; }
    .o-card .lg { width:40px; height:40px; color:#F2EEE7; }
    .o-card .co { font-size:20px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#8E8A83; }
    .o-card .h { font-family:"League Gothic"; font-size:56px; line-height:.95; text-transform:uppercase; }
    .o-card .bar { position:absolute; left:0; bottom:0; height:6px; width:100%; background:#FF5B2E; transform-origin:left center; }
    .o-end { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:34px; opacity:0; }
    .o-logo { font-family:"League Gothic"; font-size:360px; line-height:.8; letter-spacing:.02em; }
    .o-logo .dot { color:#FF5B2E; }
    .o-tag { font-size:32px; letter-spacing:.24em; text-transform:uppercase; color:#C9C4BB; }
    .o-cred { position:absolute; left:260px; right:260px; bottom:120px; text-align:center; font-size:20px; line-height:1.6; letter-spacing:.08em; color:#8E8A83; text-transform:uppercase; }
  </style>
  <div class="o-grid" id="${id}-grid2">
    ${story.stories.map((s, i) => `
    <div class="o-card" id="${id}-k${i}">
      <div class="top"><span class="n">${s.num}</span><span class="lg">${logoSvg(s.logo)}</span><span class="co">${esc(s.company)}</span></div>
      <div class="h">${esc(s.recap ?? s.slug)}</div>
      <div class="bar" id="${id}-kb${i}"></div>
    </div>`).join("")}
  </div>
  <div class="o-end" id="${id}-end">
    <div class="o-logo" id="${id}-logo">${"SEÑAL".split("").map((c) => `<span class="wm"><span class="w">${c}</span></span>`).join("")}<span class="wm"><span class="w dot">.</span></span></div>
    <div class="o-tag" id="${id}-tag">${esc(b1?.tagline ?? "")}</div>
    <div class="o-cred" id="${id}-cred">${esc(sec.credits ?? "")}</div>
  </div>`;
  const endAt = b1 ? b1.start : sec.dur - 5;
  let js = bgMotion(id, sec.dur, null);
  story.stories.forEach((_, i) => {
    const a = r3(0.3 + i * 0.09);
    js += `
  tl.fromTo("#${id}-k${i}", { opacity: 0, y: 80, rotationX: -30, scale: 0.9 }, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.7, ease: "expo.out" }, ${a});
  tl.fromTo("#${id}-kb${i}", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, ${r3(a + 0.3)});`;
  });
  js += `
  tl.fromTo("#${id}-grid2", { scale: 1, y: 0 }, { scale: 0.93, y: 20, duration: ${r3(endAt - 0.35)}, ease: "sine.inOut" }, 0);
  tl.to("#${id}-grid2", { opacity: 0, scale: 0.86, filter: "blur(12px)", duration: 0.5, ease: "power2.in" }, ${r3(endAt - 0.3)});
  tl.set("#${id}-end", { opacity: 1 }, ${r3(endAt)});
  tl.fromTo("#${id}-logo .w", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, ${r3(endAt + 0.1)});
  tl.fromTo("#${id}-tag", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, ${r3(endAt + 0.7)});
  tl.fromTo("#${id}-cred", { opacity: 0 }, { opacity: 1, duration: 0.8 }, ${r3(endAt + 1.2)});
  tl.to("#${id}-end", { opacity: 0, duration: 1.2, ease: "power1.in" }, ${r3(sec.dur - 1.4)});`;
  allSfx.push({ id: "whoosh", at: r3(sec.start + 0.2), vol: 0.22 }, { id: "impact", at: r3(sec.start + endAt + 0.1), vol: 0.4 });
  return subComp(id, bg(id, null) + html, js, sec.dur);
}

// ── Chrome persistente: bug, fecha, contador, ticker, transiciones, grano ───
function chromeComp() {
  const id = "chrome";
  const first = story.stories[0], lastS = story.stories.at(-1);
  const tickerFrom = first.start, tickerTo = story.outro.start;
  const tickerText = story.stories.map((s) => `<b>${s.num}</b> ${esc(s.company)} — ${esc(s.slug)}`).join('<i>◆</i>');
  const html = `
  <style>
    .ch-bug { position:absolute; left:96px; top:52px; display:flex; align-items:center; gap:16px; }
    .ch-bug .sq { width:18px; height:18px; background:#FF5B2E; }
    .ch-bug .nm { font-family:"League Gothic"; font-size:52px; line-height:1; letter-spacing:.04em; }
    .ch-bug .ed { font-size:18px; letter-spacing:.2em; color:#8E8A83; text-transform:uppercase; padding-left:14px; border-left:2px solid rgba(242,238,231,.25); }
    .ch-tr { position:absolute; right:96px; top:56px; display:flex; align-items:center; gap:26px; font-size:20px; letter-spacing:.14em; color:#B9B4AB; }
    .ch-live { display:flex; align-items:center; gap:10px; color:#F2EEE7; font-weight:700; }
    .ch-live i { display:block; width:12px; height:12px; border-radius:50%; background:#FF5B2E; }
    .ch-segs { display:flex; gap:6px; }
    .ch-segs span { display:block; width:34px; height:6px; background:rgba(242,238,231,.2); position:relative; overflow:hidden; }
    .ch-segs span b { position:absolute; inset:0; background:#FF5B2E; transform-origin:left center; transform:scaleX(0); }
    .ch-tk { position:absolute; left:0; right:0; bottom:0; height:62px; display:flex; background:rgba(11,12,14,.92); border-top:2px solid rgba(242,238,231,.14); }
    .ch-tk .lb { flex:none; background:#FF5B2E; color:#0B0C0E; font-weight:700; font-size:20px; letter-spacing:.16em; line-height:62px; padding:0 26px; z-index:2; }
    .ch-tk .vp { position:relative; flex:1; overflow:hidden; }
    .ch-tk .st { position:absolute; left:0; top:0; white-space:nowrap; font-size:22px; line-height:62px; letter-spacing:.06em; color:#C9C4BB; text-transform:uppercase; }
    .ch-tk .st b { color:#FF5B2E; margin-right:10px; }
    .ch-tk .st i { font-style:normal; color:#FF5B2E; margin:0 34px; }
    .ch-wipe { position:absolute; top:-40px; bottom:-40px; width:2400px; left:-2500px; }
    .ch-wipe.a { background:#FF5B2E; }
    .ch-wipe.b { background:#F2EEE7; }
    .ch-wipe.c { background:#15171B; display:flex; align-items:center; justify-content:center; }
    .ch-wipe.c span { font-family:"League Gothic"; font-size:560px; line-height:1; color:#FF5B2E; }
    .ch-grain { position:absolute; left:-256px; top:-256px; right:-256px; bottom:-256px; background-image:url(assets/grain.png); background-size:256px 256px; opacity:.07; mix-blend-mode:overlay; }
    .ch-vig { position:absolute; inset:0; background:radial-gradient(ellipse at center, rgba(11,12,14,0) 55%, rgba(11,12,14,.55) 100%); }
  </style>
  <div class="ch-vig"></div>
  <div class="ch-grain" id="${id}-grain" aria-hidden="true" data-layout-ignore></div>
  <div class="ch-bug" id="${id}-bug"><div class="sq" id="${id}-sq"></div><div class="nm">SEÑAL</div><div class="ed">${esc(story.edition)}</div></div>
  <div class="ch-tr" id="${id}-tr">
    <div class="ch-live"><i id="${id}-dot"></i>EN EMISIÓN</div>
    <div id="${id}-tc">00:00:00</div>
    <div class="ch-segs">${story.stories.map((_, i) => `<span><b id="${id}-sg${i}"></b></span>`).join("")}</div>
  </div>
  <div class="ch-tk" id="${id}-tk"><div class="lb">ÚLTIMA HORA</div><div class="vp"><div class="st" id="${id}-st" data-layout-ignore>${Array(6).fill(tickerText).join("<i>◆</i>")}</div></div></div>
  ${story.stories.map((s, i) => `<div class="ch-wipe c" id="${id}-wc${i}" data-layout-ignore aria-hidden="true"><span>${s.num}</span></div><div class="ch-wipe b" id="${id}-wb${i}" data-layout-ignore></div><div class="ch-wipe a" id="${id}-wa${i}" data-layout-ignore></div>`).join("")}
  <div class="ch-wipe c" id="${id}-wco" data-layout-ignore aria-hidden="true"><span>✦</span></div><div class="ch-wipe b" id="${id}-wbo" data-layout-ignore></div><div class="ch-wipe a" id="${id}-wao" data-layout-ignore></div>`;
  let js = `
  tl.fromTo("#${id}-bug", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, ${r3(story.intro.beats[1].start)});
  tl.fromTo("#${id}-tr", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, ${r3(story.intro.beats[1].start + 0.1)});
  tl.fromTo("#${id}-dot", { opacity: 1 }, { opacity: 0.2, duration: 0.6, ease: "steps(1)", repeat: ${Math.floor(TOTAL / 1.2) - 1}, yoyo: true }, 0);
  tl.fromTo("#${id}-grain", { x: 0, y: 0 }, { x: 256, y: 256, duration: ${r3(TOTAL)}, ease: "steps(${Math.floor(TOTAL * 12)})" }, 0);
  {
    const tc = document.getElementById("${id}-tc"); const p = { t: 0 };
    const f = (n) => String(Math.floor(n)).padStart(2, "0");
    tl.fromTo(p, { t: 0 }, { t: ${r3(TOTAL)}, duration: ${r3(TOTAL)}, ease: "none",
      onUpdate: () => { tc.textContent = f(p.t / 60) + ":" + f(p.t % 60) + ":" + f((p.t * 25) % 25); } }, 0);
  }
  tl.fromTo("#${id}-tk", { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.out" }, ${r3(tickerFrom + 0.6)});
  tl.fromTo("#${id}-st", { x: 0 }, { x: ${-Math.round((tickerTo - tickerFrom) * 80)}, duration: ${r3(tickerTo - tickerFrom)}, ease: "none" }, ${r3(tickerFrom)});
  tl.to("#${id}-tk", { yPercent: 100, duration: 0.5, ease: "power2.in" }, ${r3(tickerTo - 0.2)});
  tl.to(["#${id}-bug", "#${id}-tr"], { opacity: 0, duration: 0.6 }, ${r3(story.outro.start + (story.outro.beats[1]?.start ?? 6) - 0.3)});`;
  const wipe = (suffix, T) => {
    // Tres paneles barren la pantalla; cubren por completo en T (el corte real)
    [["c", 0.0], ["b", 0.06], ["a", 0.12]].forEach(([k, d]) => {
      js += `
  tl.fromTo("#${id}-w${k}${suffix}", { x: 0, skewX: -12 }, { x: 2500, skewX: -12, duration: 0.5, ease: "power3.in" }, ${r3(T - 0.5 + d)});
  tl.to("#${id}-w${k}${suffix}", { x: 5000, duration: 0.55, ease: "power3.out" }, ${r3(T + (k === "c" ? 0.12 : d))});`;
    });
    // El bug y el reloj se apartan mientras pasa la cortinilla
    js += `
  tl.fromTo(["#${id}-bug", "#${id}-tr"], { opacity: 1 }, { opacity: 0, duration: 0.15, immediateRender: false }, ${r3(T - 0.42)});
  tl.fromTo(["#${id}-bug", "#${id}-tr"], { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, ${r3(T + 0.5)});`;
    allSfx.push({ id: "whoosh", at: r3(T - 0.45), vol: 0.3 });
  };
  story.stories.forEach((s, i) => {
    wipe(String(i), s.start);
    js += `\n  tl.fromTo("#${id}-sg${i}", { scaleX: 0 }, { scaleX: 1, duration: ${r3(s.dur)}, ease: "none" }, ${r3(s.start)});`;
  });
  wipe("o", story.outro.start);
  return subComp(id, html, js, r3(TOTAL)).replace('#root { position:absolute; inset:0; overflow:hidden; background:#0B0C0E;', '#root { position:absolute; inset:0; overflow:hidden; background:transparent; pointer-events:none;');
}

// ── Montaje ─────────────────────────────────────────────────────────────────
mkdirSync(join(dir, "compositions"), { recursive: true });
writeFileSync(join(dir, "compositions", `${story.intro.id}.html`), introComp(story.intro));
story.stories.forEach((s) => writeFileSync(join(dir, "compositions", `${s.id}.html`), storyComp(s)));
writeFileSync(join(dir, "compositions", `${story.outro.id}.html`), outroComp(story.outro));
writeFileSync(join(dir, "compositions", "chrome.html"), chromeComp());

// SFX: repartidos en pistas para que no se solapen dentro de la misma
const sfxDur = new Map(audio.sfx.map((s) => [s.id, s.duration]));
const lanes = [];
const sfxTags = allSfx.sort((a, b) => a.at - b.at).map((s, i) => {
  const d = sfxDur.get(s.id) ?? 1;
  let lane = lanes.findIndex((end) => end <= s.at);
  if (lane === -1) { lane = lanes.length; lanes.push(0); }
  lanes[lane] = s.at + d + 0.01;
  return `    <audio id="sfx-${i}-${s.id}" src="assets/audio/sfx/${s.id}.wav" data-start="${r3(Math.max(0, s.at))}" data-duration="${r3(d)}" data-track-index="${20 + lane}" data-volume="${s.vol}"></audio>`;
});

const slot = (sec, track) => `    <div id="el-${sec.id}" data-composition-id="${sec.id}" data-composition-src="compositions/${sec.id}.html" data-start="${sec.start}" data-duration="${sec.dur}" data-track-index="${track}" data-width="${W}" data-height="${H}"></div>`;
const introMusic = audio.music.find((m) => m.id === "intro");
const outroMusic = audio.music.find((m) => m.id === "outro");
const bedStart = r3(Math.min(introMusic.duration - 1.5, story.stories[0].start));
const bedEnd = r3(story.outro.start + 2);
const outroStart = r3(Math.max(0, TOTAL - outroMusic.duration));

// Música con fundidos horneados (el bed se corta donde entra el cierre)
const fade = (src, out, dur, fin, fout) => {
  const af = [`atrim=0:${dur}`, fin ? `afade=t=in:st=0:d=${fin}` : null, fout ? `afade=t=out:st=${r3(dur - fout)}:d=${fout}` : null].filter(Boolean).join(",");
  const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(dir, src), "-af", af, "-ar", "48000", "-ac", "2", join(dir, out)]);
  if (ff.status !== 0) throw new Error(ff.stderr.toString());
};
const introDur = r3(Math.min(introMusic.duration, bedStart + 1.5));
fade("assets/audio/intro.wav", "assets/audio/intro-mix.wav", introDur, 0, 1.4);
fade("assets/audio/bed.wav", "assets/audio/bed-mix.wav", r3(bedEnd - bedStart), 2.0, 2.2);
fade("assets/audio/outro.wav", "assets/audio/outro-mix.wav", r3(TOTAL - outroStart), 1.0, 1.2);

const index = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { margin:0; width:${W}px; height:${H}px; overflow:hidden; background:#0B0C0E; }
      #root { position:relative; width:100%; height:100%; overflow:hidden; background:#0B0C0E; }
      #root > div[data-composition-src] { position:absolute; inset:0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-width="${W}" data-height="${H}" data-duration="${r3(TOTAL)}">
${sections.map((s, i) => slot(s, 1 + (i % 2))).join("\n")}
    <div id="el-chrome" data-composition-id="chrome" data-composition-src="compositions/chrome.html" data-start="0" data-duration="${r3(TOTAL)}" data-track-index="5" data-width="${W}" data-height="${H}"></div>
    <audio id="narration" src="assets/voice.wav" data-start="0" data-duration="${r3(TOTAL)}" data-track-index="10" data-volume="1"></audio>
    <audio id="music-intro" src="assets/audio/intro-mix.wav" data-start="0" data-duration="${introDur}" data-track-index="11" data-volume="0.5"></audio>
    <audio id="music-bed" src="assets/audio/bed-mix.wav" data-start="${bedStart}" data-duration="${r3(bedEnd - bedStart)}" data-track-index="12" data-volume="0.2"></audio>
    <audio id="music-outro" src="assets/audio/outro-mix.wav" data-start="${outroStart}" data-duration="${r3(TOTAL - outroStart)}" data-track-index="13" data-volume="0.4"></audio>
${sfxTags.join("\n")}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(join(dir, "index.html"), index);
writeFileSync(join(dir, "timing.json"), JSON.stringify(sections.map((s) => ({ id: s.id, start: s.start, dur: s.dur,
  beats: s.beats.map((b) => ({ type: b.type, line: b.line, start: r3(s.start + b.start), dur: b.dur })) })), null, 1));
console.log(`→ index.html · ${r3(TOTAL)}s · ${sections.length} secciones · ${sfxTags.length} efectos`);
sections.forEach((s) => console.log(`  ${s.id.padEnd(6)} ${String(s.start).padStart(8)} → ${String(s.end).padStart(8)}  (${s.dur}s, ${s.beats.length} beats)`));
