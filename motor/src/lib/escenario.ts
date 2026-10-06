/**
 * Modo escenario (docs/CONTRATO.md §7): lienzo con dos cajas redondeadas, la de DIAPOSITIVA (gráficos) y la del
 * PONENTE, en cinco disposiciones (estilo.md › «El cuadro», px de un lienzo de 1920×1080):
 *
 *   dos-cajas  diapositiva 64,240 1053×600 · ponente 1172,240 677×600
 *   grande     diapositiva 10,105 1545×875 · recuadro del ponente 1495,652 395×388 (solapa la esquina)
 *   solo       ponente 100,50 1715×980
 *   completa   la diapositiva (si hay una) o el ponente a sangre
 *   dividida   dos cajas iguales (diapositiva 64,200 880×660 · ponente 976,200 880×660)
 *   voz        (§8, narración) como `grande`, con la CAJA DE VOZ en el sitio del recuadro del ponente
 *
 * En narración (§8) solo hay `completa` (siempre la diapositiva a sangre) y `voz`: cualquier otro tipo que llegue
 * por derivación (rótulos, huecos) se pinta como `voz`.
 *
 * La pista `timeline.disposiciones` manda; si falta se deriva de los eventos (§7.3: titulo y lamina → grande;
 * paneles → dos-cajas; gesto3d → solo; sin evento → solo). Entre disposiciones, las cajas se mueven y cambian de
 * tamaño en 0,5 s con power3.inOut (el original cortaba en seco).
 */
import type { Capitulo, Evento, Registro, Timeline, TipoDisposicion } from "../datos/contrato";
import { clamp01, ease, lerp } from "../tema/anim";
import type { Camara, Lienzo } from "./camara";
import { camaraEn } from "./camara";
import { capituloEn } from "./linea";

export type Rect = { x: number; y: number; w: number; h: number };
/** Caja en pantalla: rectángulo, radio y opacidad (0 = oculta). */
export type CajaGeo = Rect & { r: number; o: number };
/** Encuadre del ponente en su caja: escala relativa y altura de la nariz (fracción del alto de la caja). */
export type Ajuste = { k: number; focoY: number };
export type Geo = {
  diapo: CajaGeo;
  ponente: CajaGeo;
  aj: Ajuste;
  subs: { cx: number; w: number; bottom: number };
  fichas: { y: number; tam: number };
};

export type ClaseDiapo = "evento" | "rotulo" | "intro";
export type Diapo = {
  id: string;
  desde: number;
  hasta: number;
  registro: Registro;
  disp: TipoDisposicion;
  clase: ClaseDiapo;
  ev?: Evento;
  cap?: Capitulo | null;
};
export type Tramo = { desde: number; hasta: number; tipo: TipoDisposicion; conDiapo: boolean };

/** Tipos de evento que se pintan dentro de la caja de diapositiva. */
export const EVENTOS_DE_CAJA = new Set<Evento["tipo"]>(["panel", "pop", "escena3d", "titulo", "lamina", "sello"]);

/** Tamaño lógico de la diapositiva (la de la disposición `grande`): el contenido escala con `caja.w / DIAPO_W`. */
export const DIAPO_W = 1545;
export const DIAPO_H = 875;

const registroDe = (e: Evento, cap: Capitulo | null): Registro => {
  if ("registro" in e && e.registro) return e.registro;
  if (e.tipo === "lamina") return "lamina";
  if (e.tipo === "panel") return cap?.registro ?? (e.kind === "cifra" ? "show" : "editorial");
  if (e.tipo === "sello") return cap?.registro ?? "editorial";
  return "show";
};

const dispDe = (e: Evento, narracion: boolean): TipoDisposicion => {
  if ("disposicion" in e && e.disposicion) return e.disposicion;
  if (narracion) return "voz";
  return e.tipo === "titulo" || e.tipo === "lamina" ? "grande" : "dos-cajas";
};

/** §8: en narración, todo lo que no sea `completa` es `voz`. */
export const aNarracion = (t: TipoDisposicion): TipoDisposicion => (t === "completa" ? "completa" : "voz");

/** Diapositiva de un evento de caja (también la usa el modo normal para las tarjetas flotantes). */
export const diapoDeEvento = (tl: Timeline, e: Evento, i: number): Diapo => {
  const cap = capituloEn(tl, e.desde);
  return { id: e.id ?? `ev${i}`, desde: e.desde, hasta: e.hasta, registro: registroDe(e, cap), disp: dispDe(e, tl.narracion), clase: "evento", ev: e, cap };
};

/** Diapositivas en orden: intro (si no es de marca), rótulos de capítulo y eventos de caja. */
export const diapositivas = (tl: Timeline, introMarca: boolean, introConVideo: boolean): Diapo[] => {
  const out: Diapo[] = [];
  if (tl.intro && !introMarca)
    out.push({ id: "intro", desde: tl.intro.desde, hasta: tl.intro.hasta, registro: "show", disp: introConVideo && !tl.narracion ? "grande" : "completa", clase: "intro" });
  for (const c of tl.capitulos)
    out.push({ id: `cap${c.n}`, desde: c.desde, hasta: c.rotuloHasta, registro: c.registro ?? "show", disp: tl.narracion ? "voz" : "grande", clase: "rotulo", cap: c });
  tl.eventos.forEach((e, i) => {
    if (EVENTOS_DE_CAJA.has(e.tipo)) out.push(diapoDeEvento(tl, e, i));
  });
  // Sin diapositivas de duración 0 (p. ej. un capítulo sin rótulo: rotuloHasta = desde), que abrirían un tramo vacío.
  return out.filter((d) => d.hasta > d.desde).sort((a, b) => a.desde - b.desde);
};

/** Pista de disposiciones: la del timeline o la derivada de los eventos (tramos contiguos de 0 a la duración). */
export const pistaDisposiciones = (tl: Timeline, diapos: Diapo[]): Tramo[] => {
  const hay = (a: number, b: number) => diapos.some((d) => d.desde < b && d.hasta > a);
  let crudos: Tramo[];
  if (tl.disposiciones?.length) {
    crudos = [...tl.disposiciones].sort((a, b) => a.desde - b.desde).map((d) => ({ ...d, conDiapo: hay(d.desde, d.hasta) }));
  } else {
    const marcas: Tramo[] = diapos.map((d) => ({ desde: d.desde, hasta: d.hasta, tipo: d.disp, conDiapo: true }));
    for (const e of tl.eventos) if (e.tipo === "gesto3d") marcas.push({ desde: e.desde, hasta: e.hasta, tipo: e.disposicion ?? "solo", conDiapo: false });
    marcas.sort((a, b) => a.desde - b.desde);
    // Huecos cortos (< 2 s): se mantiene la disposición anterior (no se vuelve a «solo» entre dos gráficos seguidos).
    const hueco = Math.round(tl.fps * 2);
    crudos = [];
    for (const m of marcas) {
      const u = crudos.at(-1);
      if (!u) {
        if (m.desde > 0) crudos.push({ desde: 0, hasta: m.desde, tipo: "solo", conDiapo: false });
      } else if (m.desde - u.hasta >= hueco) crudos.push({ desde: u.hasta, hasta: m.desde, tipo: "solo", conDiapo: false });
      else u.hasta = Math.max(u.hasta, m.desde);
      crudos.push({ ...m });
    }
    const u = crudos.at(-1);
    if (!u) crudos.push({ desde: 0, hasta: tl.duracion, tipo: "solo", conDiapo: false });
    else if (tl.duracion - u.hasta >= hueco) crudos.push({ desde: u.hasta, hasta: tl.duracion, tipo: "solo", conDiapo: false });
    else u.hasta = tl.duracion;
  }
  // Narración: solo `completa` (siempre con la diapositiva a sangre) y `voz`.
  if (tl.narracion)
    crudos = crudos.map((t) => {
      const tipo = aNarracion(t.tipo);
      return { ...t, tipo, conDiapo: tipo === "completa" ? true : t.conDiapo };
    });
  // Contiguos (sin huecos ni solapes) y fundidos si se repiten.
  const out: Tramo[] = [];
  for (const t of crudos) {
    const u = out.at(-1);
    if (u) {
      if (t.desde !== u.hasta) t.desde = u.hasta;
      if (t.hasta <= t.desde) continue;
      if (u.tipo === t.tipo && u.conDiapo === t.conDiapo) {
        u.hasta = t.hasta;
        continue;
      }
    } else t.desde = 0;
    out.push({ ...t });
  }
  if (out.length) out[out.length - 1].hasta = Math.max(out[out.length - 1].hasta, tl.duracion);
  return out;
};

// ——— Geometría ———

type RefCaja = [number, number, number, number];
const caja = ([x, y, w, h]: RefCaja, r: number, o = 1): CajaGeo => ({ x, y, w, h, r, o });
/** Caja oculta: la de referencia encogida un 10 % sobre su centro y transparente (así «brota» al aparecer). */
const oculta = (c: CajaGeo): CajaGeo => ({ x: c.x + c.w * 0.05, y: c.y + c.h * 0.05, w: c.w * 0.9, h: c.h * 0.9, r: c.r, o: 0 });

const AJ: Record<TipoDisposicion, Ajuste> = {
  "dos-cajas": { k: 1, focoY: 0.36 },
  grande: { k: 1.04, focoY: 0.38 },
  solo: { k: 1, focoY: 0.33 },
  completa: { k: 1, focoY: 0.34 },
  dividida: { k: 1, focoY: 0.36 },
  voz: { k: 1, focoY: 0.36 },
};

const escalarGeo = (g: Geo, k: number): Geo => {
  const e = (c: CajaGeo): CajaGeo => ({ x: c.x * k, y: c.y * k, w: c.w * k, h: c.h * k, r: c.r * k, o: c.o });
  return { ...g, diapo: e(g.diapo), ponente: e(g.ponente), subs: { cx: g.subs.cx * k, w: g.subs.w * k, bottom: g.subs.bottom * k }, fichas: { y: g.fichas.y * k, tam: g.fichas.tam * k } };
};

export const geometria = (tipo: TipoDisposicion, conDiapo: boolean, lienzo: Lienzo, radio: number): Geo => {
  const r = radio;
  if (lienzo.vertical) {
    const W = lienzo.ancho;
    const H = lienzo.alto;
    const d = caja([40, 190, W - 80, Math.round(((W - 80) * 9) / 16)], r);
    const p = caja([40, 800, W - 80, H - 800 - 240], r);
    const subs = { cx: W / 2, w: W - 100, bottom: 120 };
    const fichas = { y: 70, tam: 76 };
    if (tipo === "voz") {
      // Narración en vertical: diapositiva alta arriba y la caja de voz, pequeña, debajo.
      const dv = caja([40, 170, W - 80, 1160], r);
      return { diapo: dv, ponente: caja([Math.round((W - 440) / 2), 1370, 440, 300], r), aj: AJ.voz, subs: { ...subs, bottom: 110 }, fichas };
    }
    if (tipo === "solo") return { diapo: oculta(d), ponente: caja([40, 190, W - 80, H - 190 - 240], r), aj: AJ.solo, subs: { ...subs, bottom: 150 }, fichas };
    if (tipo === "completa")
      return conDiapo
        ? { diapo: caja([0, 0, W, H], 0), ponente: oculta(p), aj: AJ.completa, subs, fichas }
        : { diapo: oculta(d), ponente: caja([0, 0, W, H], 0), aj: AJ.completa, subs, fichas };
    return { diapo: d, ponente: p, aj: AJ[tipo], subs, fichas };
  }
  const dos = { d: caja([64, 240, 1053, 600], r), p: caja([1172, 240, 677, 600], r) };
  const grande = { d: caja([10, 105, 1545, 875], r), p: caja([1495, 652, 395, 388], r) };
  let g: Geo;
  switch (tipo) {
    case "dos-cajas":
      g = { diapo: dos.d, ponente: dos.p, aj: AJ[tipo], subs: { cx: 960, w: 1500, bottom: 130 }, fichas: { y: 118, tam: 86 } };
      break;
    case "grande":
    case "voz":
      g = { diapo: grande.d, ponente: grande.p, aj: AJ[tipo], subs: { cx: 782, w: 1300, bottom: 40 }, fichas: { y: 16, tam: 72 } };
      break;
    case "dividida":
      g = { diapo: caja([64, 200, 880, 660], r), ponente: caja([976, 200, 880, 660], r), aj: AJ[tipo], subs: { cx: 960, w: 1500, bottom: 130 }, fichas: { y: 88, tam: 80 } };
      break;
    case "completa":
      g = conDiapo
        ? { diapo: caja([0, 0, 1920, 1080], 0), ponente: oculta(grande.p), aj: AJ[tipo], subs: { cx: 960, w: 1400, bottom: 64 }, fichas: { y: 24, tam: 64 } }
        : { diapo: oculta(dos.d), ponente: caja([0, 0, 1920, 1080], 0), aj: AJ[tipo], subs: { cx: 960, w: 1400, bottom: 64 }, fichas: { y: 24, tam: 64 } };
      break;
    default:
      g = { diapo: oculta(dos.d), ponente: caja([100, 50, 1715, 980], r), aj: AJ.solo, subs: { cx: 960, w: 1400, bottom: 64 }, fichas: { y: 66, tam: 64 } };
  }
  return lienzo.ancho === 1920 ? g : escalarGeo(g, lienzo.ancho / 1920);
};

const lerpCaja = (a: CajaGeo, b: CajaGeo, k: number): CajaGeo => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  w: lerp(a.w, b.w, k),
  h: lerp(a.h, b.h, k),
  r: lerp(a.r, b.r, k),
  o: lerp(a.o, b.o, k),
});

const lerpGeo = (a: Geo, b: Geo, k: number): Geo => ({
  diapo: lerpCaja(a.diapo, b.diapo, k),
  ponente: lerpCaja(a.ponente, b.ponente, k),
  aj: { k: lerp(a.aj.k, b.aj.k, k), focoY: lerp(a.aj.focoY, b.aj.focoY, k) },
  subs: { cx: lerp(a.subs.cx, b.subs.cx, k), w: lerp(a.subs.w, b.subs.w, k), bottom: lerp(a.subs.bottom, b.subs.bottom, k) },
  fichas: { y: lerp(a.fichas.y, b.fichas.y, k), tam: lerp(a.fichas.tam, b.fichas.tam, k) },
});

/** Duración de la transición entre disposiciones (0,5 s). Empieza 0,6·T antes de la frontera. */
export const transicionDisp = (fps: number) => Math.max(4, Math.round(fps * 0.5));

const indiceTramo = (pista: Tramo[], f: number) => {
  let lo = 0;
  let hi = pista.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (pista[mid].desde <= f) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

export type EstadoEscenario = { geo: Geo; tramo: Tramo; k: number; cambiando: boolean };

/** Geometría del escenario en el fotograma `f` (con la transición animada entre tramos). */
export const estadoEscenario = (pista: Tramo[], f: number, lienzo: Lienzo, radio: number, fps: number): EstadoEscenario => {
  const i = indiceTramo(pista, f);
  const t = pista[i];
  const T = transicionDisp(fps);
  const pre = Math.round(T * 0.6);
  const g = (x: Tramo) => geometria(x.tipo, x.conDiapo, lienzo, radio);
  const next = pista[i + 1];
  if (next && f >= next.desde - pre) {
    const k = ease.power3InOut(clamp01((f - (next.desde - pre)) / T));
    return { geo: lerpGeo(g(t), g(next), k), tramo: t, k, cambiando: true };
  }
  const prev = pista[i - 1];
  if (prev && f < t.desde + (T - pre)) {
    const k = ease.power3InOut(clamp01((f - (t.desde - pre)) / T));
    return { geo: lerpGeo(g(prev), g(t), k), tramo: t, k, cambiando: true };
  }
  return { geo: g(t), tramo: t, k: 1, cambiando: false };
};

/** Diapositiva del fondo de la caja en `f`: la última que ya empezó (se mantiene hasta la siguiente). */
export const diapoEn = (diapos: Diapo[], f: number) => {
  let i = -1;
  for (let j = 0; j < diapos.length; j++) if (diapos[j].desde <= f) i = j;
  const actual = i >= 0 ? diapos[i] : (diapos[0] ?? null);
  const siguiente = i >= 0 ? (diapos[i + 1] ?? null) : null;
  // Fundido del fondo al registro de la siguiente en los 8 fotogramas previos a su entrada.
  const kSig = siguiente && actual && siguiente.registro !== actual.registro ? clamp01((f - (siguiente.desde - 8)) / 8) : 0;
  return { actual, siguiente, kSig };
};

// ——— Cámara del ponente dentro de su caja ———

/**
 * Cámara efectiva en una caja: la de los planos (escala relativa al plano medio y nariz del plano) con la NARIZ
 * CENTRADA en la caja, a `aj.focoY` de su alto, y sin ver nunca el borde inferior de la fuente. `cubrir` (sin
 * recorte): el vídeo tapa la caja entera (no se ven sus bordes).
 */
export const camaraCaja = (tl: Timeline, f: number, r: Rect, aj: Ajuste, cubrir: boolean): Camara => {
  const base = camaraEn(tl, f, { ancho: 1920, alto: 1080, vertical: false });
  const fw = tl.fuente.ancho;
  const fh = tl.fuente.alto;
  // Los planos de `tools` dan la escala para una fuente 4K en 1080 (plano medio ≈ 0,76): se normaliza por el alto.
  const norm = 2160 / fh;
  const rel = Math.max(0.85, Math.min(1.25, base.S / norm / 0.76));
  let S = (r.h / 1080) * 0.76 * rel * aj.k * norm;
  if (cubrir) S = Math.max(S, r.w / fw, r.h / fh);
  let ox = r.x + r.w / 2 - base.nariz[0] * S;
  let oy = r.y + r.h * aj.focoY - base.nariz[1] * S;
  const minOy = r.y + r.h - fh * S;
  if (oy < minOy) oy = minOy;
  if (cubrir) {
    oy = Math.min(oy, r.y);
    ox = Math.min(r.x, Math.max(r.x + r.w - fw * S, ox));
  }
  return { ...base, S, ox, oy, tx: ox + base.nariz[0] * S, ty: oy + base.nariz[1] * S };
};
