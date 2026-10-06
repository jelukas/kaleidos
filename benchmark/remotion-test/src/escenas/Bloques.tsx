import React from "react";
import { COLOR, ease, tween, useTime } from "../tema";

export const BLOQUES_FROM = 660; // 22,0 s

// De abajo arriba en la pila.
const BLOCKS = [COLOR.accent, COLOR.fg, COLOR.mid, COLOR.panel, COLOR.deep];

export const Bloques: React.FC = () => {
  const t = useTime(BLOQUES_FROM);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, overflow: "hidden", pointerEvents: "none" }}>
      {BLOCKS.map((color, k) => {
        const exitAt = 22.8 + (4 - k) * 0.06; // sale primero el de arriba
        const x =
          t < exitAt
            ? tween(t, 22.0 + k * 0.06, 0.45, -2700, 0, ease.power3InOut)
            : tween(t, exitAt, 0.45, 0, 2700, ease.power3InOut);
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              top: 0,
              left: -200,
              width: 2320,
              height: 1080,
              background: color,
              transform: `translateX(${x}px) skewX(-18deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
