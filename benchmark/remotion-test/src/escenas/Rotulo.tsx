import React from "react";
import { COLOR, ease, radialGlow, sceneStyle, tween, useTime } from "../tema";

export const ROTULO_FROM = 683; // primer fotograma tras el cambio de escena de 22,75 s

const LETTERS = "kaleidos".split("");

export const Rotulo: React.FC = () => {
  const t = useTime(ROTULO_FROM);

  let glowOpacity: number;
  let glowScale: number;
  if (t < 24.2) {
    glowOpacity = tween(t, 23.0, 1.2, 0, 0.45, ease.power2Out);
    glowScale = tween(t, 23.0, 1.2, 0.7, 1, ease.power2Out);
  } else {
    const s = Math.sin(tween(t, 24.2, 5.8, 0, Math.PI * 4));
    glowOpacity = 0.45 + s * 0.05;
    glowScale = 1 + s * 0.04;
  }

  return (
    <div style={sceneStyle}>
      <div
        style={{
          position: "absolute",
          left: 360,
          top: -60,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: radialGlow,
          opacity: glowOpacity,
          transform: `scale(${glowScale})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 200,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: COLOR.fg,
            transform: `scale(${tween(t, 24.0, 6.0, 1, 1.04)})`,
          }}
        >
          {LETTERS.map((ch, i) => {
            const at = 23.2 + i * 0.05;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: tween(t, at, 0.5, 0, 1, ease.power4Out),
                  transform: `translateY(${tween(t, at, 0.5, 80, 0, ease.power4Out)}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
          <span
            style={{
              display: "inline-block",
              color: COLOR.accent,
              transformOrigin: "50% 80%",
              transform: `scale(${tween(t, 23.75, 0.5, 0, 1, ease.power3Out)})`,
            }}
          >
            .
          </span>
        </div>
        <div
          style={{
            width: 160,
            height: 6,
            margin: "36px 0",
            background: COLOR.accent,
            transformOrigin: "center center",
            transform: `scaleX(${tween(t, 23.9, 0.6, 0, 1, ease.power2Out)})`,
          }}
        />
        <div
          style={{
            fontSize: 40,
            fontWeight: 400,
            lineHeight: 1.2,
            color: COLOR.muted,
            opacity: tween(t, 24.0, 0.7, 0, 1, ease.power2Out),
            transform: `translateY(${tween(t, 24.0, 0.7, 30, 0, ease.power2Out)}px)`,
          }}
        >
          Academia de vídeo programático
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: "center",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.24em",
          color: COLOR.accent,
          opacity: tween(t, 24.4, 0.6, 0, 1, ease.power2Out),
          transform: `translateY(${tween(t, 24.4, 0.6, 20, 0, ease.power2Out)}px)`,
        }}
      >
        EMPIEZA HOY · MÓDULO 1 DISPONIBLE
      </div>
    </div>
  );
};
