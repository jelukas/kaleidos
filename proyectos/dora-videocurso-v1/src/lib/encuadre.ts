import { interpolate } from "remotion";
import seguimiento from "../datos/seguimiento.json";
import type { Disposicion } from "../datos/tipos";
import { ease, FPS } from "../tema";
import type { EnfasisColocado, GraficoColocado } from "./linea-tiempo";

// Ventana donde se ve a la ponente (coordenadas del lienzo 1920×1080) y escala del vídeo dentro.
export type Encuadre = {
  x: number;
  y: number;
  w: number;
  h: number;
  radio: number;
  borde: number; // opacidad del borde de acento (0–1)
  escala: number; // escala del fotograma 1920×1080 dentro de la ventana
  foco: number; // 0 = centrar el fotograma, 1 = centrar la cabeza de la ponente en la ventana
  arriba: number; // desplazamiento vertical del fotograma (px, antes de escalar)
};

const COMPLETA: Encuadre = { x: 0, y: 0, w: 1920, h: 1080, radio: 0, borde: 0, escala: 1, foco: 0.6, arriba: 0 };
const DIVIDIDA: Encuadre = { x: 0, y: 0, w: 900, h: 1080, radio: 0, borde: 0, escala: 1.02, foco: 1, arriba: 10 };
const ESQUINA: Encuadre = { x: 1452, y: 360, w: 408, h: 500, radio: 28, borde: 1, escala: 0.86, foco: 1, arriba: 70 };

export const ENCUADRES: Record<Disposicion, Encuadre> = { completa: COMPLETA, dividida: DIVIDIDA, esquina: ESQUINA };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mezclar = (a: Encuadre, b: Encuadre, k: number): Encuadre => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  w: lerp(a.w, b.w, k),
  h: lerp(a.h, b.h, k),
  radio: lerp(a.radio, b.radio, k),
  borde: lerp(a.borde, b.borde, k),
  escala: lerp(a.escala, b.escala, k),
  foco: lerp(a.foco, b.foco, k),
  arriba: lerp(a.arriba, b.arriba, k),
});

// Bloques de disposición: gráficos consecutivos con la misma disposición se funden en uno
// para no volver a pantalla completa entre dos gráficos seguidos.
export type BloqueDisp = { disp: Disposicion; desde: number; hasta: number };
const TRANS = 14; // fotogramas de transición de encuadre

export const bloquesDisposicion = (graficos: GraficoColocado[]): BloqueDisp[] => {
  const out: BloqueDisp[] = [];
  for (const { g, desde, hasta } of graficos) {
    if (!("disp" in g) || g.disp === "completa") continue;
    const last = out.at(-1);
    if (last && last.disp === g.disp && desde - last.hasta < FPS * 1.2) last.hasta = Math.max(last.hasta, hasta);
    else out.push({ disp: g.disp, desde, hasta });
  }
  return out;
};

export const disposicionEn = (bloques: BloqueDisp[], f: number): { enc: Encuadre; disp: Disposicion; mezcla: number } => {
  const b = bloques.find((x) => f >= x.desde - TRANS && f < x.hasta + TRANS);
  if (!b) return { enc: COMPLETA, disp: "completa", mezcla: 0 };
  const kIn = interpolate(f, [b.desde - TRANS, b.desde], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kOut = interpolate(f, [b.hasta, b.hasta + TRANS], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const k = ease.power3InOut(Math.min(kIn, kOut));
  return { enc: mezclar(COMPLETA, ENCUADRES[b.disp], k), disp: b.disp, mezcla: k };
};

// Posición horizontal de la cabeza en el instante `s` de la fuente (interpolada entre muestras de 1 s).
export const cabezaX = (s: number) => {
  const hx = seguimiento.hx as number[];
  const i = Math.max(0, Math.min(hx.length - 2, Math.floor(s)));
  const k = Math.max(0, Math.min(1, s - i));
  return hx[i] + (hx[i + 1] - hx[i]) * k;
};

export const CABEZA_Y = 300; // altura aproximada de la cara en el fotograma (plano fijo)

export const envolventeEnfasis = (enfasis: EnfasisColocado[], f: number) => {
  let z = 1;
  for (const e of enfasis) {
    if (f < e.desde - 1 || f > e.desde + e.dur + 1) continue;
    const sube = interpolate(f, [e.desde, e.desde + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const baja = interpolate(f, [e.desde + e.dur - 12, e.desde + e.dur], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    z = Math.max(z, 1 + (e.zoom - 1) * ease.power3InOut(Math.min(sube, baja)));
  }
  return z;
};

// Rectángulo del fotograma de vídeo dentro de la ventana.
export const colocarVideo = (enc: Encuadre, zoom: number, hx: number) => {
  const S = enc.escala * zoom;
  const vw = 1920 * S;
  const vh = 1080 * S;
  // Horizontal: mezcla entre centrar el fotograma y centrar la cabeza en la ventana.
  const centrado = (enc.w - vw) / 2;
  const enCabeza = enc.w / 2 - hx * S;
  let left = lerp(centrado, enCabeza, enc.foco);
  left = Math.min(0, Math.max(enc.w - vw, left));
  // Vertical: el zoom se ancla en la cara para que no "se escape" por arriba.
  let top = -enc.arriba * S - (zoom - 1) * CABEZA_Y * enc.escala;
  top = Math.min(0, Math.max(enc.h - vh, top));
  return { left, top, width: vw, height: vh };
};
