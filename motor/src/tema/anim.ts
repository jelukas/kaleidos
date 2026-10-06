import { Easing, interpolate } from "remotion";

/** Curvas con nombres de GSAP (los tokens usan `movimiento.entrada: "power3Out"`, etc.). */
export const ease = {
  none: Easing.linear,
  linear: Easing.linear,
  power1In: Easing.in(Easing.quad),
  power1Out: Easing.out(Easing.quad),
  power2Out: Easing.out(Easing.cubic),
  power2InOut: Easing.inOut(Easing.cubic),
  power3Out: Easing.out(Easing.poly(4)),
  power3InOut: Easing.inOut(Easing.poly(4)),
  power4Out: Easing.out(Easing.poly(5)),
  expoOut: Easing.out(Easing.exp),
  expoInOut: Easing.inOut(Easing.exp),
  sineInOut: Easing.inOut(Easing.sin),
  backOut: Easing.out(Easing.back(1.6)),
  backOutSuave: Easing.out(Easing.back(1.1)),
  /**
   * Titular de juego (milikito): «0 → 1,12 → 1». Con la fórmula de Penner/GSAP, back.out(2.2) subiría a 1,154;
   * s = 1,9 da el 1,12 que pide la guía.
   */
  backOutJuego: Easing.out(Easing.back(1.9)),
  power2In: Easing.in(Easing.cubic),
  elasticOut: Easing.out(Easing.elastic(1)),
} as const;

export type NombreEase = keyof typeof ease;

export const easePorNombre = (n: string): ((x: number) => number) => (n in ease ? ease[n as NombreEase] : ease.power3Out);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** fromTo de GSAP: `from` antes de `start`, `to` después de `start + dur`. */
export const tween = (t: number, start: number, dur: number, from: number, to: number, easing: (x: number) => number = ease.none) =>
  dur <= 0 ? (t >= start ? to : from) : interpolate(t, [start, start + dur], [from, to], { ...clamp, easing });

/** 0 → 1 entre `a` y `b` (con curva). */
export const k01 = (t: number, a: number, b: number, easing: (x: number) => number = ease.none) => tween(t, a, b - a, 0, 1, easing);

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Pseudoaleatorio determinista en [0, 1) a partir de una semilla numérica. */
export const hash01 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
