import React from "react";
import { COLOR, ease, kickerStyle, sceneStyle, tween, useTime } from "../tema";

export const GRAFICA_FROM = 450; // 15,0 s

const VALUES = [35, 50, 42, 65, 48];
const PX_PER_MIN = 8;
const BAR_STEP = 360; // 200 px de barra + 160 px de hueco
const HIGHLIGHT = 3; // Módulo 4, el mayor
const GRID = [0, 160, 320, 480];

export const Grafica: React.FC = () => {
  const t = useTime(GRAFICA_FROM);
  const sceneX = tween(t, 15.0, 0.6, 1920, 0, ease.power3InOut);

  return (
    <div style={{ ...sceneStyle, transform: `translateX(${sceneX}px)` }}>
      <div style={{ position: "absolute", left: 140, top: 120 }}>
        <div
          style={{
            ...kickerStyle,
            opacity: tween(t, 15.7, 0.6, 0, 1, ease.power3Out),
            transform: `translateX(${tween(t, 15.7, 0.6, -40, 0, ease.power3Out)}px)`,
          }}
        >
          02 · DATOS EN MOVIMIENTO
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.1,
            color: COLOR.fg,
            whiteSpace: "nowrap",
            opacity: tween(t, 15.85, 0.7, 0, 1, ease.power3Out),
            transform: `translateY(${tween(t, 15.85, 0.7, 40, 0, ease.power3Out)}px)`,
          }}
        >
          Minutos de vídeo por módulo
        </div>
      </div>

      <div style={{ position: "absolute", left: 140, bottom: 170, width: 1640, height: 520 }}>
        {GRID.map((bottom, i) => (
          <div
            key={bottom}
            style={{
              position: "absolute",
              left: 0,
              bottom,
              width: 1640,
              height: i === 0 ? 3 : 2,
              background: i === 0 ? COLOR.muted : COLOR.line,
              transformOrigin: "left center",
              transform: `scaleX(${tween(t, 15.9 + i * 0.06, 0.8, 0, 1, ease.power2Out)})`,
            }}
          />
        ))}

        {VALUES.map((value, i) => {
          const at = 16.3 + i * 0.12;
          const height = value * PX_PER_MIN;
          const left = i * BAR_STEP;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left,
                  bottom: 0,
                  width: 200,
                  height,
                  borderRadius: "8px 8px 0 0",
                  background: i === HIGHLIGHT ? COLOR.fg : COLOR.accent,
                  transformOrigin: "center bottom",
                  transform: `scaleY(${tween(t, at, 0.9, 0, 1, ease.power3Out)})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left,
                  bottom: height + 16,
                  width: 200,
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1,
                  textAlign: "center",
                  color: COLOR.fg,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                  opacity: tween(t, at, 0.3, 0, 1, ease.power3Out),
                }}
              >
                {Math.round(tween(t, at, 0.9, 0, value, ease.power3Out))} min
              </div>
              <div
                style={{
                  position: "absolute",
                  left,
                  top: 548,
                  width: 200,
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1,
                  textAlign: "center",
                  color: COLOR.muted,
                  whiteSpace: "nowrap",
                  opacity: tween(t, at, 0.5, 0, 1, ease.power2Out),
                  transform: `translateY(${tween(t, at, 0.5, 20, 0, ease.power2Out)}px)`,
                }}
              >
                Módulo {i + 1}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
