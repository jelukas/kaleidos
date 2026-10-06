/** HUD: barra de progreso segmentada por capítulos y chip del capítulo en curso (solo entre intro y outro). */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { capituloEn, tramoPrograma } from "../lib/linea";
import { ease, tween } from "../tema/anim";
import { useMotor } from "../tema/Motor";

export const Hud: React.FC = () => {
  const { timeline: tl, tema, lienzo } = useMotor();
  const f = useCurrentFrame();
  const { ini, fin } = tramoPrograma(tl);
  if (!tl.capitulos.length || f < ini - 12 || f > fin + 12) return null;
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const aparece = Math.min(interpolate(f, [ini - 12, ini + 8], [0, 1], clamp), interpolate(f, [fin - 12, fin], [1, 0], clamp));
  const total = Math.max(1, fin - ini);
  const margen = 40;
  const ANCHO = lienzo.ancho - margen * 2;
  const GAP = 6;
  const actual = capituloEn(tl, f) ?? tl.capitulos[0];
  const enRotulo = f >= actual.desde && f < actual.rotuloHasta;
  const chip = enRotulo ? 0 : tween(f, actual.rotuloHasta, 12, 0, 1, ease.power3Out);
  const acento = tema.acentoCap(actual.acento);
  const fondoChip = tema.oscuro ? tema.alpha(tema.mezcla(tema.c.fondo, "#000000", 0.3), 0.78) : tema.alpha(tema.c.superficie, 0.9);
  return (
    <div style={{ position: "absolute", left: margen, bottom: 24, width: ANCHO, opacity: aparece, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 22,
          ...tema.t.etiqueta,
          fontSize: 19,
          letterSpacing: "0.12em",
          color: tema.c.texto,
          whiteSpace: "nowrap",
          padding: "7px 14px",
          borderRadius: Math.min(10, tema.forma.radio),
          background: fondoChip,
          border: tema.estiloPanel === "tinta" ? `2px solid ${tema.c.tinta}` : undefined,
          opacity: chip,
          transform: `translateY(${(1 - chip) * 8}px)`,
        }}
      >
        <span style={{ color: tema.acentoTexto(acento) }}>{String(actual.n).padStart(2, "0")}</span>
        {"  ·  "}
        {actual.titulo}
      </div>
      <div style={{ position: "relative", height: 10 }}>
        {tl.capitulos.map((c, i) => {
          const x0 = ((Math.max(ini, c.desde) - ini) / total) * ANCHO;
          const x1 = ((Math.min(fin, c.hasta) - ini) / total) * ANCHO;
          const w = Math.max(4, x1 - x0 - GAP);
          const k = interpolate(f, [c.desde, c.hasta], [0, 1], clamp);
          const on = c === actual;
          const col = tema.acentoCap(c.acento);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x0,
                width: w,
                top: on ? 0 : 2,
                height: on ? 10 : 6,
                borderRadius: 5,
                overflow: "hidden",
                background: tema.alpha(tema.oscuro ? tema.c.superficie : tema.c.linea, 0.7),
                boxShadow: `0 0 0 1px ${tema.alpha(tema.c.texto, 0.25)}`,
              }}
            >
              <div style={{ width: `${k * 100}%`, height: "100%", background: col }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
