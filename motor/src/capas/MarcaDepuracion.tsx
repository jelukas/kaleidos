/** Rótulo de depuración (solo con `opciones.marca`): fotograma, tiempo, plano, modo de ponente y evento activo. */
import React from "react";
import { useCurrentFrame } from "remotion";
import { camaraEn } from "../lib/camara";
import { eventosEn, formatoTiempo } from "../lib/linea";
import { useMotor } from "../tema/Motor";

export const MarcaDepuracion: React.FC = () => {
  const { timeline: tl, lienzo, recorte, tema } = useMotor();
  const f = useCurrentFrame();
  const cam = camaraEn(tl, f, lienzo);
  const ev = eventosEn(tl, f)
    .map((e) => `${e.id ?? ""} ${e.tipo === "panel" ? e.kind : e.tipo}`.trim())
    .join(", ");
  const texto = `f${f} · ${formatoTiempo(f, tl.fps)} · ${cam.plano.tipo} · ${recorte ? "recorte" : "marco"} · ${tema.nombre}${ev ? ` · ${ev}` : ""}`;
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 10,
        padding: "4px 10px",
        borderRadius: 6,
        background: "rgba(0,0,0,0.72)",
        color: "#FFFFFF",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 22,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};
