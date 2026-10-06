/**
 * Cámara virtual (METODO §7.3). Se calcula FUERA de los tramos de vídeo, con el fotograma absoluto.
 *
 * Un plano da la escala `s` sobre la fuente y la posición en pantalla `(tx, ty)` de la nariz (`nariz`, px de la
 * fuente). Un punto `p` de la fuente cae en pantalla en `tx + (p.x − nariz.x)·s·zoom`, `ty + (p.y − nariz.y)·s·zoom`.
 *
 * - Acercamiento lento dentro del plano (`zoom: [z0, z1]`).
 * - Transición de 16 fotogramas al entrar o salir de un plano lateral (sideL/sideR); cortes secos en el resto.
 * - El borde inferior de la fuente nunca se ve (`oy ≥ alto − s·fuente.alto`).
 */
import type { Plano, Punto, Timeline } from "../datos/contrato";
import { ease, lerp } from "../tema/anim";

export const TRANSICION_LATERAL = 16;

export type Camara = {
  /** Escala total (s · zoom) de la fuente en pantalla. */
  S: number;
  /** Desplazamiento de la esquina superior izquierda de la fuente en pantalla. */
  ox: number;
  oy: number;
  /** Nariz de referencia del plano (px de la fuente) y su posición en pantalla. */
  nariz: Punto;
  tx: number;
  ty: number;
  plano: Plano;
};

export type Lienzo = { ancho: number; alto: number; vertical: boolean };

export const esLateral = (tipo: string) => tipo === "sideL" || tipo === "sideR";

const indicePlano = (planos: Plano[], f: number) => {
  // Búsqueda binaria: los planos vienen ordenados y sin huecos (los genera `tools linea`).
  let lo = 0;
  let hi = planos.length - 1;
  if (f < planos[0].desde) return 0;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (planos[mid].desde <= f) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

type Estado = { s: number; tx: number; ty: number; nx: number; ny: number };

const estadoPlano = (p: Plano, f: number): Estado => {
  const dur = Math.max(1, p.hasta - p.desde);
  const k = Math.max(0, Math.min(1, (f - p.desde) / dur));
  const z = lerp(p.zoom[0], p.zoom[1], ease.sineInOut(k));
  return { s: p.s * z, tx: p.tx, ty: p.ty, nx: p.nariz[0], ny: p.nariz[1] };
};

const mezclar = (a: Estado, b: Estado, k: number): Estado => ({
  s: lerp(a.s, b.s, k),
  tx: lerp(a.tx, b.tx, k),
  ty: lerp(a.ty, b.ty, k),
  nx: lerp(a.nx, b.nx, k),
  ny: lerp(a.ny, b.ny, k),
});

/** Adaptación básica de un plano horizontal al lienzo vertical (1080×1920): ponente centrado arriba. */
const aVertical = (e: Estado, lienzo: Lienzo, tl: Timeline): Estado => {
  const factor = (lienzo.alto * 0.62) / (tl.alto || 1080);
  return { ...e, s: e.s * factor * 1.05, tx: lienzo.ancho / 2, ty: e.ty * factor };
};

const cortes = new WeakMap<Timeline, Set<number>>();
/** Fotogramas de salida donde hay un corte de la EDL (inicio de cada tramo salvo el primero). */
const cortesDe = (tl: Timeline) => {
  let c = cortes.get(tl);
  if (!c) {
    c = new Set(tl.segmentos.slice(1).map((s) => s.dst));
    cortes.set(tl, c);
  }
  return c;
};

/** Estado de la cámara en el fotograma absoluto `f`. */
export const camaraEn = (tl: Timeline, f: number, lienzo: Lienzo): Camara => {
  const planos = tl.planos;
  const i = indicePlano(planos, f);
  const p = planos[i];
  let e = estadoPlano(p, f);

  // Transición suave alrededor de las fronteras con planos laterales (centrada en la frontera), salvo si la
  // frontera es un corte de la EDL: ahí el cambio de plano disimula el salto y debe ser seco.
  const suave = (a: Plano, b: Plano) => (esLateral(a.tipo) || esLateral(b.tipo)) && !cortesDe(tl).has(b.desde);
  const T = (a: Plano, b: Plano) =>
    Math.max(2, Math.min(TRANSICION_LATERAL, Math.floor((a.hasta - a.desde) / 2), Math.floor((b.hasta - b.desde) / 2)));
  const prev = i > 0 ? planos[i - 1] : null;
  const next = i < planos.length - 1 ? planos[i + 1] : null;
  if (prev && suave(prev, p)) {
    const t = T(prev, p);
    const b = p.desde;
    if (f < b + t / 2) {
      const k = ease.power2InOut(Math.max(0, Math.min(1, (f - (b - t / 2)) / t)));
      e = mezclar(estadoPlano(prev, f), e, k);
    }
  }
  if (next && suave(p, next)) {
    const t = T(p, next);
    const b = next.desde;
    if (f >= b - t / 2) {
      const k = ease.power2InOut(Math.max(0, Math.min(1, (f - (b - t / 2)) / t)));
      e = mezclar(e, estadoPlano(next, f), k);
    }
  }

  if (lienzo.vertical) e = aVertical(e, lienzo, tl);

  let ox = e.tx - e.nx * e.s;
  let oy = e.ty - e.ny * e.s;
  // El borde inferior de la fuente nunca se ve.
  const minOy = lienzo.alto - tl.fuente.alto * e.s;
  if (oy < minOy) oy = minOy;
  if (lienzo.vertical) ox = lienzo.ancho / 2 - e.nx * e.s;
  return { S: e.s, ox, oy, nariz: [e.nx, e.ny], tx: e.tx, ty: oy + e.ny * e.s, plano: p };
};

/** Fuente → pantalla con una cámara dada. */
export const fuenteAPantalla = (cam: Camara, p: Punto): Punto => [cam.ox + p[0] * cam.S, cam.oy + p[1] * cam.S];

/** Rectángulo en pantalla de una región de la fuente. */
export const rectFuente = (cam: Camara, x: number, y: number, w: number, h: number) => ({
  left: cam.ox + x * cam.S,
  top: cam.oy + y * cam.S,
  width: w * cam.S,
  height: h * cam.S,
});
