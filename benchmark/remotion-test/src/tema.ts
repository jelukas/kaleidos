import { loadFont } from "@remotion/fonts";
import type React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

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
} as const;

export const FONT = "Montserrat, sans-serif";

// Los mismos .woff2 que usa HyperFrames.
for (const weight of [400, 700, 900]) {
  loadFont({
    family: "Montserrat",
    url: staticFile(`fonts/montserrat-latin-${weight}-normal.woff2`),
    weight: String(weight),
    format: "woff2",
  });
}

// Equivalentes exactos de las curvas de GSAP que usa la versión HyperFrames.
export const ease = {
  none: Easing.linear,
  power2Out: Easing.out(Easing.cubic),
  power3Out: Easing.out(Easing.poly(4)),
  power3InOut: Easing.inOut(Easing.poly(4)),
  power4Out: Easing.out(Easing.poly(5)),
  expoOut: Easing.out(Easing.exp),
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

// Segundos absolutos del vídeo dentro de un <Sequence from={fromFrame}>.
export const useTime = (fromFrame: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (frame + fromFrame) / fps;
};

export const sceneStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
};

export const kickerStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: "0.24em",
  color: COLOR.accent,
  whiteSpace: "nowrap",
};

export const radialGlow = "radial-gradient(circle closest-side, #4c8dff 0%, rgba(76, 141, 255, 0) 100%)";
