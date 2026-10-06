import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, staticFile } from "remotion";

// Paleta común (assets/ESCENA.md).
export const COLOR = {
  bg: "#071631",
  panel: "#0D2552",
  line: "#1F3F7A",
  accent: "#4C8DFF",
  mid: "#2F6BE0",
  deep: "#040C1F",
  fg: "#F3F7FF",
  muted: "#A8BCE3",
  // Semánticos para los gráficos (derivados del acento, sin salir de la gama).
  ok: "#5FD4A0",
  warn: "#FFB547",
  bad: "#FF6B6B",
} as const;

export const FONT = "Montserrat, sans-serif";

// Montserrat 400/700/900: los mismos .woff2 que remotion-test/ y hyperframes-test/.
export const cargarFuentes = () =>
  Promise.all(
    [400, 700, 900].map((weight) =>
      loadFont({
        family: "Montserrat",
        url: staticFile(`fonts/montserrat-latin-${weight}-normal.woff2`),
        weight: String(weight),
        format: "woff2",
      }),
    ),
  );

// Equivalentes de las curvas de GSAP (tabla de ESCENA.md).
export const ease = {
  none: Easing.linear,
  power1In: Easing.in(Easing.quad),
  power2Out: Easing.out(Easing.cubic),
  power3Out: Easing.out(Easing.poly(4)),
  power3InOut: Easing.inOut(Easing.poly(4)),
  power4Out: Easing.out(Easing.poly(5)),
  expoOut: Easing.out(Easing.exp),
  backOut: Easing.out(Easing.back(1.6)),
};

// Semántica de GSAP fromTo: `from` antes de empezar y `to` al terminar.
export const tween = (
  t: number,
  start: number,
  duration: number,
  from: number,
  to: number,
  easing: (x: number) => number = ease.none,
) =>
  interpolate(t, [start, start + duration], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Entrada y salida simétricas: 0 → 1 al entrar y 1 → 0 al salir.
export const inOut = (t: number, dur: number, fadeIn = 0.5, fadeOut = 0.4, easing = ease.power3Out) =>
  Math.min(tween(t, 0, fadeIn, 0, 1, easing), tween(t, dur - fadeOut, fadeOut, 1, 0, ease.power2Out));

export const kickerStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: "0.24em",
  color: COLOR.accent,
  whiteSpace: "nowrap",
  textTransform: "uppercase",
};

export const radialGlow = "radial-gradient(circle closest-side, #4c8dff 0%, rgba(76, 141, 255, 0) 100%)";

export const FPS = 25;
export const ANCHO = 1920;
export const ALTO = 1080;
