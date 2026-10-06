import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { LineaTiempo } from "../lib/linea-tiempo";
import { INTRO_FR } from "../lib/linea-tiempo";
import { COLOR, ease, FONT, FPS, kickerStyle, tween } from "../tema";

// Barra de progreso segmentada por capítulos, con el capítulo en curso.
export const BarraProgreso: React.FC<{ lt: LineaTiempo }> = ({ lt }) => {
  const frame = useCurrentFrame();
  const ini = INTRO_FR;
  const fin = lt.outroDesde;
  if (frame < ini - 10 || frame > fin + 10) return null;
  const aparece = Math.min(
    interpolate(frame, [ini - 10, ini + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [fin - 10, fin + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const total = fin - ini;
  const ANCHO = 1840;
  const GAP = 6;
  const actual = lt.capitulos.findLast((c) => frame >= c.tarjetaDesde) ?? lt.capitulos[0];
  const enTarjeta = frame >= actual.tarjetaDesde && frame < actual.desde + 6;
  const etiqueta = enTarjeta ? 0 : tween(frame, actual.desde + 6, 12, 0, 1, ease.power3Out);

  return (
    <div style={{ position: "absolute", left: 40, bottom: 26, width: ANCHO, opacity: aparece }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 22,
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: COLOR.fg,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          padding: "6px 14px",
          borderRadius: 8,
          background: "rgba(4,12,31,0.72)",
          opacity: etiqueta,
          transform: `translateY(${(1 - etiqueta) * 8}px)`,
        }}
      >
        <span style={{ color: COLOR.accent }}>{String(actual.cap.numero).padStart(2, "0")}</span>
        {"  ·  "}
        {actual.cap.titulo}
      </div>
      <div style={{ position: "relative", height: 10 }}>
        {lt.capitulos.map((c) => {
          const x0 = ((c.tarjetaDesde - ini) / total) * ANCHO;
          const x1 = ((Math.min(fin, c.hasta) - ini) / total) * ANCHO;
          const w = Math.max(4, x1 - x0 - GAP);
          const k = interpolate(frame, [c.tarjetaDesde, c.hasta], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const activo = c === actual;
          return (
            <div
              key={c.cap.id}
              style={{
                position: "absolute",
                left: Math.max(0, x0),
                width: w,
                top: activo ? 0 : 2,
                height: activo ? 10 : 6,
                borderRadius: 5,
                overflow: "hidden",
                background: "rgba(13,37,82,0.55)",
                boxShadow: "0 0 0 1px rgba(243,247,255,0.35)",
              }}
            >
              <div style={{ width: `${k * 100}%`, height: "100%", background: COLOR.accent }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Rótulo inferior genérico (sin nombres propios).
export const RotuloInferior: React.FC<{ kicker: string; titulo: string; durFr: number; lado?: "izq" | "der" }> = ({
  kicker,
  titulo,
  durFr,
  lado = "izq",
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const d = durFr / FPS;
  const barra = Math.min(tween(t, 0, 0.5, 0, 1, ease.power3Out), tween(t, d - 0.5, 0.4, 1, 0, ease.power3InOut));
  const texto = Math.min(tween(t, 0.25, 0.5, 0, 1, ease.power3Out), tween(t, d - 0.6, 0.35, 1, 0, ease.power2Out));
  return (
    <div
      style={{
        position: "absolute",
        [lado === "izq" ? "left" : "right"]: 90,
        bottom: 230,
        display: "flex",
        alignItems: "stretch",
        fontFamily: FONT,
      }}
    >
      <div style={{ width: 8, background: COLOR.accent, transformOrigin: "bottom", transform: `scaleY(${barra})` }} />
      <div
        style={{
          padding: "18px 30px 20px 26px",
          background: COLOR.bg,
          clipPath: `inset(0 ${(1 - barra) * 100}% 0 0)`,
          boxShadow: "0 20px 50px rgba(4,12,31,0.35)",
        }}
      >
        <div style={{ ...kickerStyle, fontSize: 20, opacity: texto }}>{kicker}</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 40,
            fontWeight: 900,
            color: COLOR.fg,
            whiteSpace: "nowrap",
            opacity: texto,
            transform: `translateX(${(1 - texto) * -20}px)`,
          }}
        >
          {titulo}
        </div>
      </div>
    </div>
  );
};
