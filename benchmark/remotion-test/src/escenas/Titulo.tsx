import React from "react";
import { COLOR, ease, kickerStyle, sceneStyle, tween, useTime } from "../tema";

export const TITULO_FROM = 0;

const ring: React.CSSProperties = {
  position: "absolute",
  boxSizing: "border-box",
  borderRadius: "50%",
  border: "2px solid rgba(76, 141, 255, 0.3)",
};

const mask: React.CSSProperties = { overflow: "hidden", lineHeight: 1.2 };

const line: React.CSSProperties = {
  display: "block",
  fontSize: 176,
  fontWeight: 900,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
};

export const Titulo: React.FC = () => {
  const t = useTime(TITULO_FROM);

  const ringOpacity = tween(t, 0.2, 1.2, 0, 1, ease.power2Out);
  const ringScale = tween(t, 0.2, 1.2, 0.8, 1, ease.power2Out);
  const ringRotation = tween(t, 0, 5.6, 0, 45);
  const sceneX = tween(t, 5.0, 0.6, 0, -1920, ease.power3InOut);

  return (
    <div style={{ ...sceneStyle, transform: `translateX(${sceneX}px)` }}>
      <div
        style={{
          position: "absolute",
          right: -80,
          bottom: -90,
          fontSize: 460,
          fontWeight: 900,
          lineHeight: 1,
          color: COLOR.fg,
          whiteSpace: "nowrap",
          opacity: tween(t, 0, 1.0, 0, 0.07, ease.power2Out),
          transform: `translateX(${tween(t, 0, 5.6, 0, -140)}px)`,
        }}
      >
        CÓDIGO
      </div>
      <div
        style={{
          ...ring,
          left: 1200,
          top: 260,
          width: 560,
          height: 560,
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
        }}
      />
      <div
        style={{
          ...ring,
          left: 1090,
          top: 150,
          width: 780,
          height: 780,
          borderStyle: "dashed",
          opacity: ringOpacity,
          transform: `rotate(${ringRotation}deg) scale(${ringScale})`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...kickerStyle,
            opacity: tween(t, 0.3, 0.6, 0, 1, ease.power3Out),
            transform: `translateX(${tween(t, 0.3, 0.6, -40, 0, ease.power3Out)}px)`,
          }}
        >
          NUEVO CURSO · MÓDULO 1
        </div>
        <div
          style={{
            width: 120,
            height: 6,
            margin: "28px 0 36px",
            background: COLOR.accent,
            transformOrigin: "left center",
            transform: `scaleX(${tween(t, 0.45, 0.6, 0, 1, ease.power2Out)})`,
          }}
        />
        <div style={mask}>
          <div style={{ ...line, transform: `translateY(${tween(t, 0.6, 0.8, 110, 0, ease.expoOut)}%)` }}>
            Vídeo con
          </div>
        </div>
        <div style={mask}>
          <div
            style={{
              ...line,
              color: COLOR.accent,
              transform: `translateY(${tween(t, 0.75, 0.8, 110, 0, ease.expoOut)}%)`,
            }}
          >
            código
          </div>
        </div>
        <div
          style={{
            maxWidth: 1000,
            marginTop: 40,
            fontSize: 44,
            fontWeight: 400,
            lineHeight: 1.3,
            color: COLOR.muted,
            textWrap: "balance",
            opacity: tween(t, 1.3, 0.7, 0, 1, ease.power2Out),
            transform: `translateY(${tween(t, 1.3, 0.7, 30, 0, ease.power2Out)}px)`,
          }}
        >
          Aprende a animar y renderizar vídeo desde el código
        </div>
      </div>
    </div>
  );
};
