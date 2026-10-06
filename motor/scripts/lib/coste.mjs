// Modelo de coste y tiempo de un render en Lambda, calibrado con medidas locales y con un render real (DORA).
//
//   s_lambda(fotograma) = FACTOR × s_local_swangle(modo del fotograma)       (una pestaña, WebGL por software)
//   GB-s = (Σ s_lambda + trozos × (ARRANQUE + CALENTAMIENTO [+ voz]) + T_principal) × memoria
//   T_render ≈ LANZAMIENTO + trozo_más_lento + UNIÓN(fotogramas)
//
// Cada función paga un coste fijo: ARRANQUE (Chrome, site, primer acceso a los medios) y CALENTAMIENTO (primer
// fotograma de su trozo: timeline, fuentes, contexto WebGL). En narración (§8) suma además la descarga y la
// decodificación de la locución para la onda de voz. Con trozos pequeños (`--concurrencia max`) ese fijo pesa: con
// 27 f por función es ≈ 30 % del coste.
//
// FACTOR se obtiene del render real de DORA v1 (19 599 f, 11,5 % 3D, sin recorte, 196 funciones de 100 f,
// 0,29 $ y 82 s) con sus medidas locales en esta misma máquina (swangle, una pestaña: 0,199 s/f en 2D y
// 0,332 s/f con 3D, proyectos/dora-videocurso-v1/PLAN-LAMBDA.md §2). Es un factor de máquina (Lambda arm64
// 3008 MB frente a un M1 Pro con swangle), no depende del motor.
import fs from "node:fs";
import path from "node:path";
import { OUT } from "./comun.mjs";

export const PRECIOS = {
  gbSegundo: 0.0000133334, // Lambda arm64, eu-west-1
  discoGbSegundo: 0.0000000309, // almacenamiento efímero por encima de 512 MB
  invocacion: 0.2 / 1e6,
  s3Put: 0.005 / 1000,
  s3Get: 0.0004 / 1000,
  s3GbMes: 0.023,
  salidaGb: 0.09, // los primeros 100 GB/mes son gratis
};

export const DORA = { fotogramas: 19599, frac3d: 0.115, porLambda: 100, funciones: 196, coste: 0.29, renderS: 82, local2d: 0.199, local3d: 0.332 };
export const ARRANQUE_S = 6; // por función: arranque de Chrome, apertura del site, primer acceso a los medios
export const CALENTAMIENTO_S = 2; // por función: primer fotograma del trozo (timeline, fuentes, WebGL)
/** §8: descarga + decodificación (16 kHz) de la locución en cada función, para la onda de voz. */
export const vozPorFuncion = ({ bytes = 0, segundos = 0 } = {}) => 0.2 + bytes / 30e6 + segundos * 0.004;
/** Límites de Remotion Lambda por render (node_modules/@remotion/serverless-client/dist/constants.js en 4.0.529). */
export const LIMITES_REMOTION = { maxFunciones: 200, minFotogramas: 5 };
const LANZAMIENTO_S = (trozos) => 6 + 0.03 * trozos;
const UNION_S = (fotogramas) => 10 + 0.0005 * fotogramas;

export const memoriaGb = (funcion) => {
  const m = String(funcion ?? "").match(/mem(\d+)mb/);
  return (m ? Number(m[1]) : 3008) / 1024;
};
export const discoGb = (funcion) => {
  const m = String(funcion ?? "").match(/disk(\d+)mb/);
  return (m ? Number(m[1]) : 2048) / 1024;
};

/** FACTOR Lambda / swangle local a partir del render real de DORA. */
export const factorLambda = () => {
  const mem = 3008 / 1024;
  const totalS = DORA.coste / (PRECIOS.gbSegundo * mem);
  const renderizadores = totalS - DORA.renderS - DORA.funciones * (ARRANQUE_S + CALENTAMIENTO_S);
  const local = DORA.fotogramas * (DORA.local2d * (1 - DORA.frac3d) + DORA.local3d * DORA.frac3d);
  return renderizadores / local;
};

/** Medidas locales (out/calibracion.json de scripts/medir.mjs) o valores por defecto. */
export const leerCalibracion = () => {
  const f = path.join(OUT, "calibracion.json");
  // Modo escenario (§7): valores prudentes si aún no se ha medido (node scripts/medir.mjs --modos escenario,…).
  const def = { marco: 0.2, recorte: 0.3, tres: 0.33, "tres-pantalla": 0.45, escenario: 0.45, "escenario-show": 0.5, "escenario-3d": 0.55, "escenario-lamina": 0.48, "narracion-voz": 0.3, "narracion-completa": 0.25 };
  if (!fs.existsSync(f)) return { fuente: "por defecto (sin out/calibracion.json)", sw: def, angle: null };
  const c = JSON.parse(fs.readFileSync(f, "utf8"));
  const sw = {};
  const angle = {};
  for (const [m, v] of Object.entries(c.medidas ?? {})) {
    if (v.swangle) sw[m] = v.swangle;
    if (v.angle) angle[m] = v.angle;
  }
  return { fuente: `out/calibracion.json (${c.fecha?.slice(0, 16) ?? "?"}, ${c.maquina ?? "?"})`, sw: { ...def, ...sw }, angle };
};

// ——— Modo escenario (§7): clase de cada fotograma según la diapositiva que hay en la caja ———
// 0 sin diapositiva (solo ponente) · 1 editorial · 2 show (rayos, destellos, titular de juego) · 3 lámina · 4 escena 3D
const CLASE_ESC = { ninguna: 0, editorial: 1, show: 2, lamina: 3, tres: 4 };
const claseEscenario = (tl) => {
  const n = tl.duracion;
  const c = new Uint8Array(n);
  const marcar = (a, b, v) => {
    for (let f = Math.max(0, a); f < Math.min(n, b); f++) c[f] = Math.max(c[f], v);
  };
  if (tl.intro && tl.intro.estilo !== "marca") marcar(tl.intro.desde, tl.intro.hasta, CLASE_ESC.show);
  for (const cap of tl.capitulos ?? []) marcar(cap.desde, cap.rotuloHasta, (cap.registro ?? "show") === "show" ? CLASE_ESC.show : CLASE_ESC.editorial);
  for (const e of tl.eventos ?? []) {
    const reg = e.registro;
    if (e.tipo === "escena3d") marcar(e.desde, e.hasta, CLASE_ESC.tres);
    else if (e.tipo === "lamina" || reg === "lamina") marcar(e.desde, e.hasta, CLASE_ESC.lamina);
    else if (e.tipo === "titulo" || e.tipo === "pop" || reg === "show" || (e.tipo === "panel" && e.kind === "cifra" && !reg)) marcar(e.desde, e.hasta, CLASE_ESC.show);
    else if (e.tipo === "panel" || e.tipo === "sello") marcar(e.desde, e.hasta, CLASE_ESC.editorial);
  }
  return c;
};

// ——— Narración (§8): disposición de cada fotograma (0 voz, 1 completa), como la deriva lib/escenario.ts ———
const dispNarracion = (tl) => {
  const n = tl.duracion;
  const d = new Uint8Array(n);
  const marcar = (a, b) => {
    for (let f = Math.max(0, a); f < Math.min(n, b); f++) d[f] = 1;
  };
  if (tl.disposiciones?.length) {
    for (const t of tl.disposiciones) if (t.tipo === "completa") marcar(t.desde, t.hasta);
  } else {
    const deCaja = new Set(["panel", "pop", "escena3d", "titulo", "lamina", "sello"]);
    for (const e of tl.eventos ?? []) if (deCaja.has(e.tipo) && e.disposicion === "completa") marcar(e.desde, e.hasta);
    if (tl.intro && tl.intro.estilo !== "marca") marcar(tl.intro.desde, tl.intro.hasta);
  }
  return d;
};

/** framesPerLambda: el pedido o, con `concurrencia` ("max" o un número de funciones), el que la da. */
export const framesPorLambda = ({ n, porLambda = 100, concurrencia = null, limites = LIMITES_REMOTION }) => {
  const minimo = Math.min(limites.minFotogramas, n);
  let fpl = porLambda;
  if (concurrencia === "max") fpl = Math.ceil(n / limites.maxFunciones);
  else if (concurrencia) fpl = Math.ceil(n / Math.min(limites.maxFunciones, Number(concurrencia)));
  fpl = Math.max(minimo, fpl);
  if (Math.ceil(n / fpl) > limites.maxFunciones) fpl = Math.ceil(n / limites.maxFunciones); // no caben: sube
  return { porLambda: fpl, funciones: Math.ceil(n / fpl), minimo, maximo: limites.maxFunciones };
};

/** Clasifica cada fotograma de la línea de tiempo: base (marco/recorte) y extra 3D (lienzo parcial o completo). */
export const perfilTimeline = (tl) => {
  const n = tl.duracion;
  const tres = new Uint8Array(n); // 0 nada, 1 lienzo 3D parcial, 2 lienzo 3D a pantalla completa
  const marcar = (a, b, v) => {
    for (let f = Math.max(0, a); f < Math.min(n, b); f++) tres[f] = Math.max(tres[f], v);
  };
  for (const e of tl.eventos ?? []) {
    if (e.tipo === "escena3d") marcar(e.desde, e.hasta, 1);
    if (e.tipo === "gesto3d" || e.tipo === "ilustracion") marcar(e.desde, e.hasta, 2);
  }
  for (const c of tl.capitulos ?? []) if (c.objeto3d) marcar(c.desde, c.rotuloHasta, 1);
  if (tl.intro?.objeto3d) marcar(tl.intro.desde, tl.intro.hasta, 1);
  if (tl.outro?.objeto3d) marcar(tl.outro.desde, tl.outro.hasta, 1);
  const video = new Uint8Array(n);
  for (const s of tl.segmentos ?? []) for (let f = s.dst; f < Math.min(n, s.dst + s.dur); f++) video[f] = 1;
  let n3d = 0;
  let nVideo = 0;
  for (let f = 0; f < n; f++) {
    if (tres[f]) n3d++;
    if (video[f]) nVideo++;
  }
  return { n, tres, video, n3d, nVideo, frac3d: n3d / n };
};

export const estimar = ({ tl, funcion, porLambda = 100, concurrencia = null, limites, recorte, escenario = false, narracion = false, audioVoz = null, bytesEntrada = 0, mbpsSubida = 50 }) => {
  const cal = leerCalibracion();
  const F = factorLambda();
  const perfil = perfilTimeline(tl);
  const sw = cal.sw;
  const base = recorte ? sw.recorte : sw.marco;
  const extra1 = Math.max(0, sw.tres - sw.marco);
  const extra2 = Math.max(0, (sw["tres-pantalla"] ?? sw.tres) - sw.marco);
  let sFotograma = (f) => F * ((perfil.video[f] ? base : sw.marco * 0.8) + (perfil.tres[f] === 2 ? extra2 : perfil.tres[f] === 1 ? extra1 : 0));
  if (escenario) {
    // Escenario: medido con recorte (fixture milikito). Sin recorte se descuenta lo que cuesta el recorte en el modo
    // normal (máscara + plancha frente al mezzanine). gesto3d: lienzo del tamaño de la caja (≈ la mitad del extra
    // a pantalla completa). Las aperturas y cierres de marca tapan las cajas (no se decodifican): como editorial.
    const clase = claseEscenario(tl);
    const ahorroMarco = recorte ? 0 : Math.max(0, sw.recorte - sw.marco);
    const porClase = [sw.escenario, sw.escenario, sw["escenario-show"], sw["escenario-lamina"], sw["escenario-3d"]].map((x) => Math.max(0.05, x - ahorroMarco));
    sFotograma = (f) => F * ((perfil.video[f] ? porClase[clase[f]] : sw.marco) + (perfil.tres[f] === 2 ? extra2 * 0.5 : 0));
  }
  if (narracion) {
    // Narración (§8): sin vídeo. Base medida en el fixture `narracion` con una lista editorial en `voz` (diapositiva
    // grande + caja de voz con la onda) y en `completa`; lo que cuestan de más show, lámina y 3D frente a la
    // editorial sale de las medidas del escenario (la diferencia no depende del ponente).
    const clase = claseEscenario(tl);
    const disp = dispNarracion(tl);
    const extraClase = [0, 0, sw["escenario-show"], sw["escenario-lamina"], sw["escenario-3d"]].map((x, i) => (i < 2 ? 0 : Math.max(0, x - sw.escenario)));
    sFotograma = (f) => F * ((disp[f] ? sw["narracion-completa"] : sw["narracion-voz"]) + extraClase[clase[f]]);
  }

  const { porLambda: fpl, minimo, maximo } = framesPorLambda({ n: perfil.n, porLambda, concurrencia, limites });
  const trozos = Math.ceil(perfil.n / fpl);
  const fijo = ARRANQUE_S + CALENTAMIENTO_S + (narracion ? vozPorFuncion(audioVoz ?? {}) : 0);
  let total = 0;
  let lento = 0;
  for (let t = 0; t < trozos; t++) {
    let s = 0;
    for (let f = t * fpl; f < Math.min(perfil.n, (t + 1) * fpl); f++) s += sFotograma(f);
    total += s;
    lento = Math.max(lento, s);
  }
  const mem = memoriaGb(funcion);
  const disco = discoGb(funcion);
  const tRender = LANZAMIENTO_S(trozos) + lento + fijo + UNION_S(perfil.n);
  const segRenderizadores = total + trozos * fijo;
  const gbs = (segRenderizadores + tRender) * mem;
  const lambda = gbs * PRECIOS.gbSegundo;
  const discoExtra = Math.max(0, disco - 0.5) * (segRenderizadores + tRender) * PRECIOS.discoGbSegundo;
  const invocaciones = (trozos + 2) * PRECIOS.invocacion;
  const salidaBytes = (perfil.n / tl.fps) * (4.5e6 / 8); // ≈ 4,5 Mb/s en 1080p con CRF 20
  const s3 = (trozos * 6 + 20) * PRECIOS.s3Put + trozos * 200 * PRECIOS.s3Get + ((bytesEntrada + salidaBytes) / 1e9) * PRECIOS.s3GbMes * (1 / 30);
  const transferencia = { min: 0, max: (salidaBytes / 1e9) * PRECIOS.salidaGb };
  const totalCoste = lambda + discoExtra + invocaciones + s3;
  return {
    escenario,
    calibracion: cal.fuente,
    factor: F,
    sLocal: sw,
    fotogramas: perfil.n,
    frac3d: perfil.frac3d,
    narracion,
    porLambda: fpl,
    trozos,
    limites: { minimo, maximo },
    fijoPorFuncion: fijo,
    pesoFijo: (trozos * fijo) / segRenderizadores,
    sLambdaMedio: total / perfil.n,
    trozoLento: lento + fijo,
    tRender,
    tSubida: (bytesEntrada * 8) / (mbpsSubida * 1e6),
    tDescarga: (salidaBytes * 8) / (100 * 1e6),
    gbs,
    coste: { lambda, discoExtra, invocaciones, s3, transferencia, total: totalCoste, rango: [totalCoste * 0.8, totalCoste * 1.3 + transferencia.max] },
    salidaBytes,
  };
};

/** Comprobación: el modelo aplicado a DORA con sus medidas locales reproduce el render real. */
export const comprobarDora = () => {
  const F = factorLambda();
  const mem = 3008 / 1024;
  const trozos = DORA.funciones;
  const sMedio = F * (DORA.local2d * (1 - DORA.frac3d) + DORA.local3d * DORA.frac3d);
  const lento = F * DORA.local3d * DORA.porLambda; // peor caso: un trozo entero con 3D
  const tRender = LANZAMIENTO_S(trozos) + lento + ARRANQUE_S + CALENTAMIENTO_S + UNION_S(DORA.fotogramas);
  const coste = (DORA.fotogramas * sMedio + trozos * (ARRANQUE_S + CALENTAMIENTO_S) + DORA.renderS) * mem * PRECIOS.gbSegundo;
  return { coste, tRender };
};
