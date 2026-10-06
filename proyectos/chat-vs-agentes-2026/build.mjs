#!/usr/bin/env node
// Genera index.html + compositions/*.html a partir de la voz real (assets/voice.manifest.json + work/words.json).
// Uso: node build.mjs        (tras cambiar voz o textos; luego `npx hyperframes check`)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const manifest = JSON.parse(readFileSync("assets/voice.manifest.json", "utf8"));
const WORDS = JSON.parse(readFileSync("work/words.json", "utf8"));
const LINE = Object.fromEntries(manifest.lines.map((l) => [l.id, l]));
const frame = readFileSync("frame.md", "utf8");
const fontCss = (frame.match(/\/\* fuentes:inicio[\s\S]*?\/\* fuentes:fin \*\//) || [""])[0]
  .split("\n")
  .filter((l) => !/JetBrains/.test(l))
  .join("\n");

const INK = "#0D1320", SOFT = "#667085", ACC = "#7D29E0", PINK = "#FF01A2", LILA = "#F2E7FC", BORDER = "#E4E7EC";
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------- utilidades de tiempos ----------
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
function cueIn(lineId, word, nth = 0) {
  const w = WORDS[lineId];
  const hits = w.map((x, i) => [x, i]).filter(([x]) => norm(x.t) === norm(word) || norm(x.t).startsWith(norm(word)));
  if (!hits[nth]) throw new Error(`cue no encontrado: ${lineId} «${word}» #${nth}`);
  return hits[nth][0].s;
}

// ---------- escenas ----------
const SCENES = [
  { id: "s01", file: "01-logo-apertura", kind: "logo", dur: 4.2, name: "Logo de apertura" },
  { id: "s02", file: "02-gancho", line: "l02", lead: 0.5, tail: 0.9, name: "Gancho" },
  { id: "s03", file: "03-diferencia", line: "l03", lead: 0.4, tail: 0.8, name: "La diferencia" },
  { id: "s04", file: "04-en-chat", line: "l04", lead: 0.4, tail: 0.8, name: "En chat" },
  { id: "s05", file: "05-en-escritorio", line: "l05", lead: 0.4, tail: 0.8, name: "En el escritorio" },
  { id: "s06", file: "06-mismo-encargo", line: "l06", lead: 0.4, tail: 0.8, name: "Mismo encargo" },
  { id: "s07", file: "07-conectores", line: "l07", lead: 0.4, tail: 0.8, name: "Se conecta" },
  { id: "s08", file: "08-nombres", line: "l08", lead: 0.4, tail: 0.8, name: "Los nombres" },
  { id: "s09", file: "09-marketing", line: "l09", lead: 0.4, tail: 0.8, name: "Marketing" },
  { id: "s10", file: "10-ventas", line: "l10", lead: 0.4, tail: 0.8, name: "Ventas" },
  { id: "s11", file: "11-rrhh", line: "l11", lead: 0.4, tail: 0.8, name: "Recursos humanos" },
  { id: "s12", file: "12-creatividad", line: "l12", lead: 0.4, tail: 0.8, name: "Audiovisual y creatividad" },
  { id: "s13", file: "13-control", line: "l13", lead: 0.4, tail: 0.8, name: "Control" },
  { id: "s14", file: "14-cierre", line: "l14", lead: 0.4, tail: 1.9, name: "Cierre" },
  { id: "s15", file: "15-logo-cierre", kind: "logo", dur: 4.6, name: "Logo de cierre" },
];
let t0 = 0;
for (const s of SCENES) {
  if (s.line) s.dur = r3(s.lead + LINE[s.line].duration + s.tail);
  s.start = r3(t0);
  t0 += s.dur;
  if (s.line) {
    s.voiceStart = r3(s.start + s.lead);
    s.c = (word, nth = 0) => r3(s.lead + cueIn(s.line, word, nth) - 0.06); // cue relativo a la escena
  }
}
const TOTAL = r3(t0);

// ---------- logo (SVG oficial) ----------
const logoSrc = readFileSync("assets/logo-openwebinars.svg", "utf8");
function logoSvg(id) {
  const body = logoSrc.replace(/_11953_875/g, `_${id}`);
  const defs = body.match(/<defs>[\s\S]*<\/defs>/)[0];
  const inner = body.match(/<g clip-path[\s\S]*?<\/g>/)[0];
  let i = 0;
  const marked = inner.replace(/<path /g, () => `<path class="lp" data-i="${i++}" `);
  const white = inner.replace(/<path /g, "<path ").replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/clip-path="[^"]*"/g, "");
  return `<svg class="logo" viewBox="0 0 241 42" width="1040" height="181" xmlns="http://www.w3.org/2000/svg" overflow="visible">
${defs}
<defs><linearGradient id="shg_${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="shm_${id}" maskUnits="userSpaceOnUse" x="-10" y="-5" width="270" height="55">${white}</mask></defs>
${marked}
<g mask="url(#shm_${id})"><rect class="shine" x="-60" y="-8" width="34" height="60" fill="url(#shg_${id})" transform="skewX(-18)"/></g>
</svg>`;
}

// ---------- CSS y JS compartidos ----------
const baseCss = (id) => `
${fontCss}
#${id}{position:absolute;inset:0;font-family:Inter,sans-serif;color:${INK};overflow:hidden}
#${id} .stage{position:absolute;inset:0}
#${id} .h{font-weight:800;letter-spacing:-0.04em;line-height:1.02;white-space:nowrap}
#${id} .mask{display:block;overflow:hidden;padding:0.08em 0.04em 0.16em;margin:-0.08em -0.04em -0.16em}
#${id} .mask>.r{display:block}
#${id} .eye{font-weight:600;letter-spacing:.18em;text-transform:uppercase;font-size:28px;color:${SOFT}}
#${id} .panel{background:#fff;border:1px solid ${BORDER};box-shadow:0 24px 60px rgba(13,19,32,.10);border-radius:40px;box-sizing:border-box}
#${id} .chip{display:inline-block;border:2px solid ${BORDER};border-radius:999px;padding:.32em .85em;font-weight:600;font-size:44px;line-height:1.1;background:#fff;white-space:nowrap}
#${id} .acc{color:${ACC}}
#${id} .soft{color:${SOFT}}
`;
const baseJs = (id, D, ...extra) => `
const tl = gsap.timeline({ paused: true });
const E = "expo.out";
const Q = (s) => "#${id} " + s;
const rise = (s, at, d = 1.1) => tl.fromTo(Q(s), { yPercent: 108 }, { yPercent: 0, duration: d, ease: E }, at);
const up = (s, at, o = {}) => tl.fromTo(Q(s), { opacity: 0, y: o.y ?? 26 }, { opacity: o.to ?? 1, y: 0, duration: o.d ?? 0.9, ease: E }, at);
const pop = (s, at, d = 0.7) => tl.fromTo(Q(s), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: d, ease: E }, at);
tl.fromTo(Q(".stage"), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
tl.to(Q(".stage"), { opacity: 0, duration: 0.5, ease: "power2.inOut" }, ${r3(D - 0.55)});
${extra.join("\n")}
window.__timelines["${id}"] = tl;
`;
function wrap(s, css, html, js) {
  return `<template>
<style>${baseCss(s.id)}${css}</style>
<div id="${s.id}" data-composition-id="${s.id}" data-width="1920" data-height="1080">
${html}
</div>
<script>${js}</script>
</template>
`;
}

// ---------- escenas de logo ----------
function logoScene(s, fast) {
  const k = fast ? 0.75 : 1;
  const js = baseJs(s.id, s.dur, `
const ps = [...document.querySelectorAll(Q(".lp"))];
ps.forEach((p, i) => {
  const L = p.getTotalLength();
  p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
  p.style.fillOpacity = 0; p.style.strokeLinecap = "round"; p.style.strokeLinejoin = "round";
  p.style.strokeWidth = i < 2 ? 0.7 : 0.4;
  p.style.stroke = i === 0 ? "url(#paint0_linear_${s.id})" : "#010101";
});
tl.fromTo(Q(".glow"), { opacity: 0, scale: 0.6 }, { opacity: 0.55, scale: 1, duration: ${r3(1.6 * k)}, ease: E }, ${r3(0.2 * k)});
tl.to(Q(".glow"), { opacity: 0.18, duration: 1.2, ease: "sine.inOut" }, ${r3(1.9 * k)});
ps.forEach((p, i) => {
  const at = i === 0 ? ${r3(0.25 * k)} : i === 1 ? ${r3(0.7 * k)} : ${r3(1.0 * k)} + (i - 2) * ${r3(0.06 * k)};
  const d = i === 0 ? ${r3(1.25 * k)} : i === 1 ? ${r3(0.9 * k)} : ${r3(0.75 * k)};
  tl.to(p, { strokeDashoffset: 0, duration: d, ease: i < 2 ? E : "power2.out" }, at);
  tl.to(p, { fillOpacity: 1, duration: ${r3(0.5 * k)}, ease: "power1.out" }, at + d * 0.7);
  tl.to(p, { strokeOpacity: 0, duration: ${r3(0.4 * k)}, ease: "power1.out" }, at + d + 0.2);
  if (i >= 2) tl.fromTo(p, { y: 1.6 }, { y: 0, duration: d, ease: E }, at);
});
tl.fromTo(Q(".shine"), { attr: { x: -60 } }, { attr: { x: 270 }, duration: ${r3(1.0 * k)}, ease: "power2.inOut" }, ${r3(2.3 * k)});
tl.fromTo(Q(".logowrap"), { scale: 1 }, { scale: 1.035, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${r3(2.9 * k)});
`);
  const html = `<div class="stage">
<div class="glow"></div>
<div class="logowrap">${logoSvg(s.id)}</div>
</div>`;
  const css = `
#${s.id} .glow{position:absolute;left:290px;top:358px;width:360px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(125,41,224,.55),rgba(255,1,162,.25) 60%,transparent)}
#${s.id} .logowrap{position:absolute;left:440px;top:449px;width:1040px;height:181px;transform-origin:50% 50%}
#${s.id} .logo{display:block}
`;
  return wrap(s, css, html, js);
}

// ---------- plantillas por escena ----------
const mk = {};

mk.s02 = (s) => {
  const css = `#${s.id} .col{position:absolute;left:160px;top:190px}
#${s.id} .h{font-size:220px}`;
  const html = `<div class="stage"><div class="col">
<div class="h l1 soft"><span class="mask" data-layout-allow-overflow><span class="r">Un texto.</span></span></div>
<div class="h l2"><span class="mask" data-layout-allow-overflow><span class="r">El trabajo</span></span></div>
<div class="h l3"><span class="mask" data-layout-allow-overflow><span class="r"><span class="acc">hecho</span>.</span></span></div>
</div></div>`;
  const js = baseJs(s.id, s.dur, `
rise(".l1 .r", ${s.c("pedirle")});
tl.to(Q(".l1"), { opacity: 0.35, duration: 0.8, ease: "power2.out" }, ${s.c("pidieras")});
rise(".l2 .r", ${s.c("pidieras")});
rise(".l3 .r", ${s.c("hecho")}, 1.3);
`);
  return wrap(s, css, html, js);
};

mk.s03 = (s) => {
  const css = `#${s.id} .rule{position:absolute;left:959px;top:170px;width:2px;height:740px;background:${BORDER};transform-origin:50% 0}
#${s.id} .eyel{position:absolute;left:160px;top:150px}
#${s.id} .left{position:absolute;left:160px;top:330px}
#${s.id} .right{position:absolute;left:1040px;top:330px}
#${s.id} .h{font-size:170px}
#${s.id} .pill{margin-top:44px;width:420px;height:120px;border-radius:60px}
#${s.id} .steps{margin-top:36px;font-size:46px;font-weight:600;line-height:1.5;color:${SOFT}}
#${s.id} .steps div{display:flex;align-items:center;gap:20px}
#${s.id} .steps i{display:block;width:14px;height:14px;border-radius:50%;background:${ACC}}`;
  const html = `<div class="stage">
<div class="eye eyel">La diferencia</div>
<div class="rule"></div>
<div class="left"><div class="h soft"><span class="mask" data-layout-allow-overflow><span class="r">Contesta</span></span></div><div class="panel pill"></div></div>
<div class="right"><div class="h acc"><span class="mask" data-layout-allow-overflow><span class="r">Trabaja</span></span></div>
<div class="steps"><div class="a1"><i></i>Abre tus archivos</div><div class="a2"><i></i>Sigue un encargo</div><div class="a3"><i></i>Te entrega el resultado</div></div></div>
</div>`;
  const js = baseJs(s.id, s.dur, `
up(".eyel", 0.2);
tl.fromTo(Q(".rule"), { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: E }, ${s.c("diferencia")});
rise(".left .r", ${s.c("contestan")}, 1.0);
up(".pill", ${s.c("contestan") + 0.3}, { to: 0.6 });
rise(".right .r", ${s.c("trabajan")}, 1.1);
up(".a1", ${s.c("abren")}, { y: 16, d: 0.7 });
up(".a2", ${s.c("siguen")}, { y: 16, d: 0.7 });
up(".a3", ${s.c("entregan")}, { y: 16, d: 0.7 });
`);
  return wrap(s, css, html, js);
};

mk.s04 = (s) => {
  const words = "Aquí tienes un borrador del resumen semanal.".split(" ");
  const css = `#${s.id} .wrap{position:absolute;left:210px;top:210px;width:1500px}
#${s.id} .panel{margin-top:26px;padding:84px 88px}
#${s.id} .msg{font-size:76px;line-height:1.2;font-weight:600}
#${s.id} .msg span{display:inline-block;margin-right:.28em}
#${s.id} .chips{margin-top:64px;display:flex;gap:30px}`;
  const html = `<div class="stage"><div class="wrap">
<div class="eye eyel">En chat</div>
<div class="panel"><div class="msg">${words.map((w) => `<span class="w">${w}</span>`).join("")}</div></div>
<div class="chips"><span class="chip c1">Copiar</span><span class="chip c2">Pegar</span><span class="chip c3">Ordenar</span></div>
</div></div>`;
  const js = baseJs(s.id, s.dur, `
up(".eyel", 0.1);
up(".panel", ${s.c("chat")}, { y: 40 });
tl.fromTo(Q(".w"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: E, stagger: 0.16 }, ${s.c("recibes")});
tl.set(Q(".chip"), { opacity: 0 }, 0);
tl.fromTo(Q(".c1"), { opacity: 0, y: 18 }, { opacity: 0.45, y: 0, duration: 0.7, ease: E }, ${s.c("copias")});
tl.fromTo(Q(".c2"), { opacity: 0, y: 18 }, { opacity: 0.45, y: 0, duration: 0.7, ease: E }, ${s.c("pegas")});
tl.fromTo(Q(".c3"), { opacity: 0, y: 18 }, { opacity: 0.45, y: 0, duration: 0.7, ease: E }, ${s.c("ordenas")});
`);
  return wrap(s, css, html, js);
};

mk.s05 = (s) => {
  const files = ["datos.xlsx", "notas.docx", "foto.png", "borrador", "informe-v2"];
  const css = `#${s.id} .wrap{position:absolute;left:200px;top:170px;width:1520px}
#${s.id} .panel{margin-top:26px;padding:64px 72px}
#${s.id} .tab{font-size:56px;font-weight:600;color:${SOFT};margin-bottom:40px}
#${s.id} .files,#${s.id} .newf{display:flex;flex-wrap:wrap;gap:24px}
#${s.id} .files .chip{font-size:40px;color:${SOFT}}
#${s.id} .newf{margin-top:34px;min-height:100px}
#${s.id} .newf .chip{font-size:46px;border-color:${ACC};color:${ACC};background:${LILA}}
#${s.id} .bar{margin-top:54px;height:10px;border-radius:5px;background:${BORDER};overflow:hidden}
#${s.id} .bar i{display:block;width:100%;height:100%;background:${ACC};border-radius:5px;transform-origin:0 50%}`;
  const html = `<div class="stage"><div class="wrap">
<div class="eye acc">En el escritorio</div>
<div class="panel"><div class="tab">Tu carpeta</div>
<div class="files">${files.map((f) => `<span class="chip f">${f}</span>`).join("")}</div>
<div class="newf"><span class="chip n1">Informe</span><span class="chip n2">Hoja</span><span class="chip n3">Presentación</span></div>
<div class="bar"><i></i></div></div></div></div>`;
  const offs = [[-60, 40, -7], [80, -30, 6], [-40, 60, 4], [120, 30, -5], [-90, -20, 8]];
  const js = baseJs(s.id, s.dur, `
const O = ${JSON.stringify(offs)};
document.querySelectorAll(Q(".f")).forEach((el, i) => tl.set(el, { x: O[i][0], y: O[i][1], rotation: O[i][2], opacity: 0 }, 0));
tl.set(Q(".n1,.n2,.n3"), { opacity: 0 }, 0);
tl.set(Q(".bar i"), { scaleX: 0 }, 0);
up(".panel", ${s.c("escritorio")}, { y: 40 });
tl.to(Q(".f"), { opacity: 1, duration: 0.6, stagger: 0.12, ease: "power2.out" }, ${s.c("carpeta")});
document.querySelectorAll(Q(".f")).forEach((el, i) => tl.to(el, { x: 0, y: 0, rotation: 0, duration: 1.2, ease: E }, ${s.c("organiza")} + i * 0.09));
tl.fromTo(Q(".n1"), { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: E }, ${s.c("documentos")});
tl.fromTo(Q(".n2"), { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: E }, ${s.c("hojas")});
tl.fromTo(Q(".n3"), { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: E }, ${s.c("presentaciones")});
tl.to(Q(".bar i"), { scaleX: 1, duration: ${r3(s.dur - 0.8 - s.c("largas"))}, ease: "none" }, ${s.c("largas")});
`);
  return wrap(s, css, html, js);
};

mk.s06 = (s) => {
  const css = `#${s.id} .req{position:absolute;left:0;right:0;top:110px;display:flex;justify-content:center}
#${s.id} .cols{position:absolute;left:160px;right:160px;top:290px;display:flex;gap:64px}
#${s.id} .col{flex:1}
#${s.id} .panel{margin-top:22px;height:520px;padding:56px 60px;border-radius:36px}
#${s.id} .ln{height:22px;border-radius:11px;background:#D0D5DD;margin:28px 0}
#${s.id} .step{display:flex;align-items:center;gap:22px;font-size:54px;font-weight:600;padding:12px 0}
#${s.id} .step i{display:block;flex:none;width:34px;height:34px;border-radius:50%;background:${ACC}}
#${s.id} .done{margin-top:26px;font-size:48px;font-weight:600;color:${ACC}}
#${s.id} .right .panel{border-color:${ACC}}`;
  const html = `<div class="stage">
<div class="req"><span class="chip">Prepara el resumen semanal</span></div>
<div class="cols">
<div class="col left"><div class="eye">Chat</div><div class="panel"><div class="ln" style="width:100%"></div><div class="ln" style="width:92%"></div><div class="ln" style="width:97%"></div><div class="ln" style="width:58%"></div></div></div>
<div class="col right"><div class="eye acc">Escritorio</div><div class="panel"><div class="step st1"><i></i>Abre tus hojas</div><div class="step st2"><i></i>Hace las cuentas</div><div class="step st3"><i></i>Crea el documento</div><div class="done">Guardado en tu carpeta</div></div></div>
</div></div>`;
  const js = baseJs(s.id, s.dur, `
up(".req", ${s.c("pides")});
up(".left", ${s.c("chat")}, { y: 30 });
tl.fromTo(Q(".ln"), { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1, duration: 0.7, stagger: 0.12, ease: E }, ${s.c("texto")});
up(".right", ${s.c("escritorio")}, { y: 30 });
up(".st1", ${s.c("abre")}, { y: 16, d: 0.7 });
up(".st2", ${s.c("cuentas")}, { y: 16, d: 0.7 });
up(".st3", ${s.c("crea")}, { y: 16, d: 0.7 });
up(".done", ${s.c("guarda")}, { y: 16, d: 0.8 });
`);
  return wrap(s, css, html, js);
};

mk.s07 = (s) => {
  const nodes = [["Correo", 430, 190, "correo"], ["Calendario", 1490, 190, "calendario"], ["Archivos", 260, 470, "archivos"], ["Mensajes", 1660, 470, "mensajeria"], ["Clientes", 960, 700, "clientes"]];
  const cx = 960, cy = 400;
  const css = `#${s.id} .center{position:absolute;left:${cx - 230}px;top:${cy - 80}px;width:460px;height:160px;display:flex;align-items:center;justify-content:center;font-size:80px;font-weight:800;letter-spacing:-0.03em}
#${s.id} .center span{position:absolute}
#${s.id} .center .t2{color:#fff}
#${s.id} .node{position:absolute;display:flex;align-items:center;justify-content:center;width:420px;margin-left:-210px;margin-top:-45px}
#${s.id} svg.lines{position:absolute;inset:0}`;
  const lines = nodes.map(([, x, y], i) => `<line class="ln" data-i="${i}" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${ACC}" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`).join("");
  const html = `<div class="stage">
<svg class="lines" viewBox="0 0 1920 1080" width="1920" height="1080">${lines}</svg>
<div class="panel center"><span class="t1">Tu IA</span><span class="t2">Actúa</span></div>
${nodes.map(([n, x, y], i) => `<div class="node" style="left:${x}px;top:${y}px"><span class="chip nd${i}">${n}</span></div>`).join("")}

</div>`;
  const js = baseJs(s.id, s.dur, `
pop(".center", ${s.c("conecta")}, 0.9);
const ls = [...document.querySelectorAll(Q(".ln"))];
ls.forEach((l) => { const L = l.getTotalLength(); l.style.strokeDasharray = L; l.style.strokeDashoffset = L; });
${nodes.map(([, , , w], i) => `tl.to(ls[${i}], { strokeDashoffset: 0, duration: 0.9, ease: E }, ${s.c(w)});
pop(".nd${i}", ${s.c(w) + 0.2}, 0.7);`).join("\n")}
tl.set(Q(".t2"), { opacity: 0 }, 0);
tl.to(Q(".center"), { backgroundColor: "${ACC}", color: "#fff", borderColor: "${ACC}", scale: 1.08, duration: 0.7, ease: E }, ${s.c("acciones")});
tl.to(Q(".t1"), { opacity: 0, duration: 0.25 }, ${s.c("acciones")});
tl.to(Q(".t2"), { opacity: 1, duration: 0.4 }, ${s.c("acciones") + 0.2});
`);
  return wrap(s, css, html, js);
};

mk.s08 = (s) => {
  const css = `#${s.id} .tbl{position:absolute;left:180px;top:170px;width:1560px}
#${s.id} .row{display:grid;grid-template-columns:380px 620px 560px;align-items:center;border-bottom:2px solid ${BORDER};min-height:170px}
#${s.id} .head{min-height:150px}
#${s.id} .th{font-size:84px;font-weight:800;letter-spacing:-0.035em}
#${s.id} .lab{font-size:38px;font-weight:600;color:${SOFT};letter-spacing:.04em}
#${s.id} .td{font-size:68px;font-weight:700;letter-spacing:-0.02em}
#${s.id} .td small{display:block;font-size:40px;font-weight:400;color:${SOFT};letter-spacing:0;margin-top:6px}
#${s.id} .foot{margin-top:60px;font-size:46px;color:${SOFT};opacity:.6;font-weight:600}`;
  const html = `<div class="stage"><div class="tbl">
<div class="row head"><div></div><div class="th hc">Claude</div><div class="th hg">ChatGPT</div></div>
<div class="row r1"><div class="lab">Chat</div><div class="td">Chat</div><div class="td">Chat</div></div>
<div class="row r2"><div class="lab">Modo agente</div><div class="td acc ca">Modo agente<small class="co">antes llamado Cowork</small></div><div class="td acc cw">Work</div></div>
<div class="foot">Claude Code · Codex = programar</div></div></div>`;
  const js = baseJs(s.id, s.dur, `
tl.set(Q(".hc,.hg,.r1,.r2,.foot,.co,.cw,.ca"), { opacity: 0 }, 0);
up(".hc", ${s.c("claude")}, { y: 20 });
up(".r1", ${s.c("claude")} + 0.4, { y: 16 });
up(".ca", ${s.c("agente")}, { y: 18 });
up(".r2", ${s.c("agente")}, { y: 0, d: 0.6 });
up(".co", ${s.c("cowork")}, { y: 12, d: 0.7 });
up(".hg", ${s.c("chatgpt")}, { y: 20 });
up(".cw", ${s.c("work")}, { y: 18 });
up(".foot", ${s.c("code")}, { y: 14, to: 0.6 });
`);
  return wrap(s, css, html, js);
};

function area(s, o) {
  const css = `#${s.id} .ttl{position:absolute;left:160px;top:120px}
#${s.id} .h{font-size:${o.size ?? 150}px;margin-top:18px}
#${s.id} .card{position:absolute;left:160px;top:390px;width:1560px;padding:40px 72px}
#${s.id} .li{display:flex;align-items:center;gap:28px;font-size:62px;font-weight:600;padding:9px 0;letter-spacing:-0.01em}
#${s.id} .li i{display:block;flex:none;width:22px;height:22px;border-radius:50%;background:${o.color}}
#${s.id} .eyea{color:${o.color}}
#${s.id} .extra{position:absolute;left:160px;top:${o.extraTop ?? 800}px}`;
  const html = `<div class="stage">
<div class="ttl"><div class="eye eyea">Área</div><div class="h"><span class="mask" data-layout-allow-overflow><span class="r">${o.title}</span></span></div></div>
<div class="panel card">${o.lines.map((l, i) => `<div class="li l${i + 1}"><i></i>${l}</div>`).join("")}</div>
<div class="extra">${o.extra ?? ""}</div></div>`;
  const js = baseJs(s.id, s.dur, `
up(".eyea", 0.1);
rise(".h .r", 0.15);
up(".card", 0.55, { y: 40 });
tl.set(Q(".li"), { opacity: 0 }, 0);
${o.cues.map((c, i) => `up(".l${i + 1}", ${s.c(...c)}, { y: 18, d: 0.8 });`).join("\n")}
tl.set(Q(".extra"), { opacity: 0 }, 0);
${o.extraCue ? `up(".extra", ${s.c(...o.extraCue)}, { y: 18, d: 0.8 });` : ""}
`);
  return wrap(s, css, html, js);
}
mk.s09 = (s) => area(s, { title: "Marketing", color: ACC, lines: ["Briefing de campaña", "Adaptar a otros mercados", "Informe cada lunes"], cues: [["briefing"], ["adaptar"], ["lunes"]] });
mk.s10 = (s) => area(s, { title: "Ventas", color: PINK, lines: ["Reunión con el contexto del cliente", "Llamadas del trimestre, resumidas", "Memo listo"], cues: [["prepara"], ["resume"], ["memo"]] });
mk.s11 = (s) => area(s, { title: "Recursos humanos", color: "#5E3DE6", lines: ["Descripciones de puesto", "Planes de incorporación", "Evaluaciones"], cues: [["descripciones"], ["planes"], ["evaluaciones"]],
  extra: `<span class="chip" style="border-color:#B54708;color:#B54708;background:#FFF6ED">Sin datos personales</span>`, extraCue: ["sin"] });
mk.s12 = (s) => area(s, { title: "Audiovisual y creatividad", size: 130, color: "#9B61F6", lines: ["Conceptos, guiones y briefings", "Archivos organizados y renombrados", "Presentaciones preparadas"], cues: [["conceptos"], ["organiza"], ["prepara"]],
  extra: `<div style="font-size:60px;font-weight:700;color:#667085">La dirección creativa, <span style="color:#9B61F6">tú</span>.</div>`, extraCue: ["direccion"] , extraTop: 800 });

mk.s13 = (s) => {
  const css = `#${s.id} .wrap{position:absolute;left:260px;top:170px;width:1400px}
#${s.id} .panel{margin-top:24px;padding:20px 80px}
#${s.id} .row{display:flex;align-items:center;justify-content:space-between;font-size:72px;font-weight:600;padding:36px 0;border-bottom:2px solid ${BORDER}}
#${s.id} .row:last-child{border-bottom:0}
#${s.id} .tg{position:relative;display:block;width:150px;height:84px;border-radius:42px;background:#D0D5DD}
#${s.id} .kn{position:absolute;left:6px;top:6px;display:block;width:72px;height:72px;border-radius:50%;background:#fff;box-shadow:0 4px 12px rgba(13,19,32,.25)}
#${s.id} .end{position:absolute;left:0;right:0;top:330px;text-align:center}
#${s.id} .end .a{font-size:108px;font-weight:800;letter-spacing:-0.04em}
#${s.id} .end .b{margin-top:36px;font-size:54px;font-weight:600;color:${SOFT}}`;
  const rows = ["Tú eliges la carpeta", "Ves cada paso", "Te pide permiso"];
  const html = `<div class="stage"><div class="wrap">
<div class="eye">Control</div>
<div class="panel pn">${rows.map((r, i) => `<div class="row rw${i}"><span>${r}</span><span class="tg t${i}"><span class="kn k${i}"></span></span></div>`).join("")}</div></div>
<div class="end"><div class="a">Empieza por tareas <span class="acc">sencillas</span>.</div><div class="b">Algunas funciones cambian según tu plan y tu país.</div></div></div>`;
  const js = baseJs(s.id, s.dur, `
up(".wrap", ${s.c("control")}, { y: 30 });
tl.set(Q(".end .a, .end .b"), { opacity: 0 }, 0);
tl.set(Q(".row"), { opacity: 0 }, 0);
${["carpetas", "paso", "permiso"].map((w, i) => `up(".rw${i}", ${s.c(w)} - 0.5, { y: 14, d: 0.7 });
tl.to(Q(".t${i}"), { backgroundColor: "${ACC}", duration: 0.5, ease: "power2.out" }, ${s.c(w) + 0.1});
tl.to(Q(".k${i}"), { x: 66, duration: 0.5, ease: E }, ${s.c(w) + 0.1});`).join("\n")}
tl.to(Q(".wrap"), { opacity: 0, y: -20, duration: 0.8, ease: "power2.inOut" }, ${s.c("empieza") - 0.4});
up(".end .a", ${s.c("empieza")}, { y: 24 });
up(".end .b", ${s.c("plan")} - 0.2, { y: 18, d: 0.8 });
`);
  return wrap(s, css, html, js);
};

mk.s14 = (s) => {
  const css = `#${s.id} .col{position:absolute;left:160px;top:160px}
#${s.id} .h{font-size:150px;line-height:1.04}
#${s.id} .ico{position:absolute;left:160px;top:830px;display:flex;gap:26px}
#${s.id} .b{width:200px;height:84px;border-radius:42px}
#${s.id} .f{width:200px;height:84px;border-radius:20px;border-color:${ACC}}`;
  const html = `<div class="stage"><div class="col">
<div class="h soft a1"><span class="mask" data-layout-allow-overflow><span class="r">Chat para preguntar.</span></span></div>
<div class="h a2"><span class="mask" data-layout-allow-overflow><span class="r">Agente para que te</span></span></div>
<div class="h a3"><span class="mask" data-layout-allow-overflow><span class="r">entregue el trabajo</span></span></div>
<div class="h a4"><span class="mask" data-layout-allow-overflow><span class="r"><span class="acc">hecho</span>.</span></span></div>
</div></div>`;
  const js = baseJs(s.id, s.dur, `
rise(".a1 .r", ${s.c("chat")}, 1.1);
tl.to(Q(".a1"), { opacity: 0.55, duration: 0.8 }, ${s.c("agente") - 0.2});
rise(".a2 .r", ${s.c("agente")}, 1.1);
rise(".a3 .r", ${s.c("entregue")}, 1.1);
rise(".a4 .r", ${s.c("hecho")}, 1.2);
`);
  return wrap(s, css, html, js);
};

// ---------- escribir composiciones ----------
mkdirSync("compositions", { recursive: true });
for (const s of SCENES) {
  const html = s.kind === "logo" ? logoScene(s, s.id === "s15") : mk[s.id](s);
  writeFileSync(`compositions/${s.file}.html`, html);
}

// ---------- subtítulos (3 ficheros) ----------
const chunks = [];
for (const s of SCENES) {
  if (!s.line) continue;
  const ws = WORDS[s.line];
  let cur = [];
  const flush = () => { if (cur.length) chunks.push({ scene: s, words: cur }); cur = []; };
  ws.forEach((w) => {
    cur.push({ ...w, abs: r3(s.voiceStart + w.s), absE: r3(s.voiceStart + w.e) });
    const len = cur.map((x) => x.t).join(" ").length;
    if (/[.?!:]$/.test(w.t) || (/,$/.test(w.t) && len >= 26) || len >= 40) flush();
  });
  flush();
}
chunks.forEach((c, i) => {
  const next = chunks[i + 1];
  let en = c.words[c.words.length - 1].absE + 0.35;
  if (next && next.words[0].abs < en) en = next.words[0].abs - 0.05;
  c.st = r3(c.words[0].abs - 0.08); c.en = r3(en);
});
const SUBS = 5;
const per = Math.ceil(chunks.length / SUBS);
const subIds = [];
for (let g = 0; g < SUBS; g++) {
  const id = `subs${g + 1}`; subIds.push(id);
  let html = "", js = "";
  chunks.slice(g * per, (g + 1) * per).forEach((c, k) => {
    const i = g * per + k;
    html += `<div class="cap" id="${id}c${i}">${c.words.map((w, j) => `<span id="${id}w${i}_${j}" class="w">${w.t}</span>`).join(" ")}</div>\n`;
    js += `tl.fromTo("#${id}c${i}", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, ${c.st});
tl.to("#${id}c${i}", { opacity: 0, duration: 0.16, ease: "power1.in" }, ${r3(c.en - 0.16)});
`;
    c.words.forEach((w, j) => {
      js += `tl.set("#${id}w${i}_${j}", { color: "${ACC}", opacity: 1 }, ${w.abs});
tl.set("#${id}w${i}_${j}", { color: "${INK}" }, ${w.absE});
`;
    });
  });
  const css = `${fontCss}
#${id}{position:absolute;inset:0;font-family:Inter,sans-serif}
#${id} .cap{position:absolute;left:200px;right:200px;bottom:58px;text-align:center;font-size:46px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;opacity:0}
#${id} .w{display:inline-block;color:${INK};opacity:.5}`;
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
// ---------- fondo (resplandor que respira) ----------
writeFileSync("compositions/fondo.html", `<template>
<style>
#fondo{position:absolute;inset:0}
#fondo .core{position:absolute;left:160px;right:160px;bottom:-760px;height:1500px;border-radius:50%;
 background:radial-gradient(closest-side,rgba(125,41,224,.30),rgba(255,1,162,.15) 62%,rgba(255,1,162,0))}
</style>
<div id="fondo" data-composition-id="fondo" data-width="1920" data-height="1080"><div class="core"></div></div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#fondo .core", { opacity: 0.75, scale: 0.96 }, { opacity: 1, scale: 1.05, duration: 6, ease: "sine.inOut", yoyo: true, repeat: ${Math.max(0, Math.floor(TOTAL / 6) - 1)} }, 0);
window.__timelines["fondo"] = tl;
</script>
</template>
`);

// ---------- index ----------
const hosts = SCENES.map((s) => `<div id="host-${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.file}.html" data-start="${s.start}" data-duration="${s.dur}" data-track-index="1" data-width="1920" data-height="1080"></div>`).join("\n    ");
const voices = SCENES.filter((s) => s.line).map((s) => `<audio id="voz-${s.line}" src="assets/voice/${s.line}.wav" data-start="${s.voiceStart}" data-duration="${LINE[s.line].duration}" data-track-index="10" data-volume="1"></audio>`).join("\n    ");
const ticks = SCENES.filter((s) => s.line && !["s02"].includes(s.id)).map((s) => `<audio id="tick-${s.id}" src="assets/audio/tick.wav" data-start="${r3(s.start + 0.12)}" data-duration="0.3" data-track-index="12" data-volume="0.3"></audio>`).join("\n    ");
const s15 = SCENES[SCENES.length - 1];
const closeStart = r3(s15.start - 5.0);
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
      ${subIds.map((id, k) => `<div id="host-${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="0" data-duration="${TOTAL}" data-track-index="${2 + k}" data-width="1920" data-height="1080"></div>`).join("\n      ")}
      <audio id="pad-open" src="assets/audio/pad-open.wav" data-start="0" data-duration="7.3" data-track-index="11" data-volume="0.55"></audio>
      <audio id="pad-close" src="assets/audio/pad-close.wav" data-start="${closeStart}" data-duration="${r3(Math.min(9.7, TOTAL - closeStart))}" data-track-index="11" data-volume="0.55"></audio>
    ${voices}
    ${ticks}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync("index.html", index);
console.log(`ok · ${SCENES.length} escenas · ${chunks.length} subtítulos · duración ${TOTAL}s`);
writeFileSync("work/timing.json", JSON.stringify(SCENES.map((s) => ({ id: s.id, name: s.name, start: s.start, dur: s.dur, voiceStart: s.voiceStart ?? null })), null, 1));
