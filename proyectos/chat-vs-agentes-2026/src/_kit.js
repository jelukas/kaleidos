/* KIT COMPARTIDO v2 (JS) — dentro del <script> de cada escena. Disponibles: ID, DUR, CUES, BEATS, tl y los helpers. */
const ID = "__ID__";
const DUR = __DUR__;
const CUES = __CUES__;      // { words:[{t,s,e}], voiceStart } — tiempos relativos a la escena (s). Vacío si el plano no lleva voz
const BEATS = __BEATS__;    // pulsos de la música (110 BPM) relativos a la escena (s), solo los que caen dentro
const tl = gsap.timeline({ paused: true });
const E = "expo.out", SPR = "back.out(1.7)", SOFTSPR = "back.out(1.2)", IO = "power3.inOut";
const Q = (s) => "#" + ID + " " + s;
const $q = (s) => document.querySelector(Q(s));
const $$q = (s) => [...document.querySelectorAll(Q(s))];
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
/* tiempo de inicio de una palabra de la locución: cue("texto") | cue("el", 1) (n-ésima coincidencia por prefijo) | cue(7) por índice */
function cue(w, nth = 0) {
  if (typeof w === "number") return CUES.words[w].s;
  const hits = CUES.words.filter((x) => norm(x.t).startsWith(norm(w)));
  if (!hits[nth]) throw new Error("cue no encontrado: " + w + " #" + nth);
  return Math.max(0, hits[nth].s - 0.05);
}
/* siguiente pulso de la música a partir de t (para clavar golpes al ritmo) */
function beat(t) { const b = BEATS.find((x) => x >= t - 0.02); return b === undefined ? t : b; }

/* ---- entradas de texto y elementos ---- */
function rise(sel, at, d = 1.0) { return tl.fromTo(Q(sel), { yPercent: 110 }, { yPercent: 0, duration: d, ease: E }, at); }   // titular dentro de .mask>.r
function up(sel, at, o = {}) { return tl.fromTo(Q(sel), { opacity: 0, y: o.y ?? 28 }, { opacity: o.to ?? 1, y: 0, duration: o.d ?? 0.8, ease: o.ease ?? E }, at); }
function pop(sel, at, d = 0.6) { return tl.fromTo(Q(sel), { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: d, ease: SPR }, at); }
function fade(sel, at, d = 0.4, to = 1) { return tl.fromTo(Q(sel), { opacity: 0 }, { opacity: to, duration: d, ease: "power2.out" }, at); }
/* golpe: escala grande + desenfoque que aterriza con sacudida */
function slam(sel, at) {
  tl.fromTo(Q(sel), { opacity: 0, scale: 1.7, filter: "blur(26px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.42, ease: "power4.out" }, at);
  tl.fromTo(Q(sel), { x: 0 }, { x: 14, duration: 0.045, repeat: 7, yoyo: true, ease: "none" }, at + 0.38);
  tl.set(Q(sel), { x: 0 }, at + 0.74);
}
/* texto que se escribe carácter a carácter en el elemento sel; devuelve la duración */
function typeText(sel, text, at, cps = 30) {
  const el = $q(sel), o = { n: 0 };
  el.textContent = "";
  tl.to(o, { n: text.length, duration: text.length / cps, ease: "none", onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, at);
  return text.length / cps;
}
/* contador numérico 0→valor en sel */
function count(sel, to, at, d = 1.2, fmt = (v) => String(Math.round(v))) {
  const el = $q(sel), o = { v: 0 };
  tl.to(o, { v: to, duration: d, ease: "power3.out", onUpdate: () => { el.textContent = fmt(o.v); } }, at);
}
/* ---- el orbe del agente ---- */
function orbSet(x, y, at = 0) { tl.set(Q(".orb"), { x, y }, at); }
function orbTo(x, y, at, d = 0.7, ease = IO) { return tl.to(Q(".orb"), { x, y, duration: d, ease }, at); }
function orbSquash(at) {   // estira y encoge con humor (al terminar una tarea)
  tl.to(Q(".orb"), { scaleX: 1.35, scaleY: 0.72, duration: 0.11, ease: "power2.out" }, at);
  tl.to(Q(".orb"), { scaleX: 0.85, scaleY: 1.2, duration: 0.14, ease: "power2.inOut" }, at + 0.11);
  tl.to(Q(".orb"), { scaleX: 1, scaleY: 1, duration: 0.35, ease: "elastic.out(1,0.5)" }, at + 0.25);
}
function orbPulse(at, d = 0.5) { tl.fromTo(Q(".orb"), { scale: 1 }, { scale: 1.3, duration: d / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, at); }
/* clic: anillo que se expande en (x,y). Requiere <div class="ripple"> en el HTML (uno por clic: .ripple.r1, .r2…) */
function clickAt(sel, x, y, at) {
  tl.set(Q(sel), { x, y, opacity: 0 }, 0);
  tl.fromTo(Q(sel), { opacity: 0.9, scale: 0.2 }, { opacity: 0, scale: 2.2, duration: 0.6, ease: "power2.out" }, at);
  tl.fromTo(Q(".orb"), { scale: 1 }, { scale: 0.8, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" }, at - 0.02);
}
/* ---- entrada / salida de escena sobre .stage ---- */
function sceneIn(kind = "fade") {
  if (kind === "cut") return;
  if (kind === "whip") tl.fromTo(Q(".stage"), { x: 260, opacity: 0, filter: "blur(22px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0);
  else if (kind === "zoom") tl.fromTo(Q(".stage"), { scale: 1.12, opacity: 0, filter: "blur(16px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0);
  else tl.fromTo(Q(".stage"), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
}
function sceneOut(kind = "fade") {
  const t = DUR - 0.42;
  if (kind === "cut") return;
  if (kind === "whip") tl.to(Q(".stage"), { x: -260, opacity: 0, filter: "blur(22px)", duration: 0.42, ease: "power3.in" }, t);
  else if (kind === "zoom") tl.to(Q(".stage"), { scale: 1.12, opacity: 0, filter: "blur(16px)", duration: 0.42, ease: "power3.in" }, t);
  else tl.to(Q(".stage"), { opacity: 0, duration: 0.4, ease: "power2.inOut" }, t);
}
