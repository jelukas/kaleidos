/**
 * Grano opcional: ruido fractal en SVG (se rasteriza una vez, como imagen) desplazado de forma determinista
 * en cada fotograma. Sin archivos ni aleatoriedad. `<Img>` espera a que la imagen esté decodificada.
 */
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { hash01 } from "../tema/anim";
import { useMotor } from "../tema/Motor";

const TAM = 2400;
const SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${TAM}' height='${TAM}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='${TAM}' height='${TAM}' filter='url(#n)'/></svg>`,
  );

export const Grano: React.FC = () => {
  const { tokens } = useMotor();
  const f = useCurrentFrame();
  const intensidad = tokens.fondo.grano ?? 0.35;
  const x = -Math.round(hash01(f) * 400);
  const y = -Math.round(hash01(f + 17.3) * 400);
  return (
    <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: 0.08 + 0.14 * intensidad, pointerEvents: "none" }}>
      <Img src={SVG} style={{ position: "absolute", left: x, top: y, width: TAM, height: TAM }} />
    </AbsoluteFill>
  );
};
