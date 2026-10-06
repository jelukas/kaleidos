/**
 * Entradas y salidas según `tokens.movimiento.transicion`: empuje | fundido | bloques | barrido | zoom.
 * Se usan en paneles, rótulos, pop, intro y outro (fotograma local dentro de su Sequence).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ease, tween } from "../tema/anim";
import { useMotor, useTema } from "../tema/Motor";

export type Tipo = "empuje" | "fundido" | "bloques" | "barrido" | "zoom";

/** Progreso de entrada (0→1) y de salida (1→0) de un elemento que dura `dur` fotogramas. */
export const useEntradaSalida = (dur: number, retraso = 0) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const de = tema.mov.durEntrada;
  const ds = Math.min(tema.mov.durSalida, Math.max(4, Math.floor(dur / 3)));
  const entra = tween(f, retraso, de, 0, 1, tema.mov.ease);
  const sale = tween(f, dur - ds, ds, 1, 0, tema.mov.salida);
  return { f, entra, sale, k: Math.min(entra, sale), saliendo: f >= dur - ds };
};

/** Escalera para `bloques`: bandas horizontales que se destapan de izquierda a derecha, escalonadas. */
const escalera = (k: number, bandas: number, desdeDerecha: boolean) => {
  const pts: string[] = [];
  for (let i = 0; i < bandas; i++) {
    const ki = Math.max(0, Math.min(1, k * 1.6 - (i / bandas) * 0.6));
    const w = ki * 100;
    const y0 = (i / bandas) * 100;
    const y1 = ((i + 1) / bandas) * 100;
    const x = desdeDerecha ? 100 - w : w;
    pts.push(`${x}% ${y0}%`, `${x}% ${y1}%`);
  }
  const borde = desdeDerecha ? "100%" : "0%";
  return `polygon(${borde} 0%, ${pts.join(", ")}, ${borde} 100%)`;
};

export const estiloTransicion = (tipo: Tipo, k: number, lado: "izq" | "der" | "centro" = "der", distancia = 90): React.CSSProperties => {
  const s = lado === "izq" ? -1 : 1;
  switch (tipo) {
    case "fundido":
      return { opacity: k };
    case "zoom":
      return { opacity: Math.min(1, k * 1.3), transform: `scale(${0.9 + 0.1 * k})` };
    case "barrido":
      return {
        clipPath: lado === "izq" ? `inset(0 0 0 ${(1 - k) * 100}%)` : `inset(0 ${(1 - k) * 100}% 0 0)`,
        transform: `translateX(${(1 - k) * s * 24}px)`,
      };
    case "bloques":
      return { clipPath: k >= 1 ? undefined : escalera(k, 5, lado === "izq"), opacity: Math.min(1, k * 3) };
    default:
      return { opacity: Math.min(1, k * 1.4), transform: `translateX(${(1 - k) * s * distancia}px)` };
  }
};

export const Transicion: React.FC<{
  dur: number;
  lado?: "izq" | "der" | "centro";
  tipo?: Tipo;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ dur, lado = "der", tipo, style, children }) => {
  const tema = useTema();
  const { k } = useEntradaSalida(dur);
  const t = tipo ?? tema.mov.transicion;
  // Capa propia (will-change): el panel se rasteriza una vez y las entradas/salidas solo se componen.
  return <div style={{ ...style, ...estiloTransicion(t, k, lado), willChange: "transform, opacity" }}>{children}</div>;
};

/**
 * Cortinilla de escena (intro → vídeo, entrada al outro). Dura `dur` fotogramas y tapa del todo en el centro.
 * - bloques: barras diagonales con los colores del estilo;
 * - barrido: una barra del acento;
 * - empuje, fundido y zoom: velo del color de fondo.
 */
export const Cortinilla: React.FC<{ dur: number; acento: string }> = ({ dur, acento }) => {
  const { tema, lienzo } = useMotor();
  const f = useCurrentFrame();
  const W = lienzo.ancho;
  const H = lienzo.alto;
  const recorrido = W + H * 0.6 + 400;
  const t = tema.mov.transicion;
  const mitad = dur / 2;
  if (t === "bloques" || t === "barrido") {
    const colores = t === "bloques" ? [acento, tema.c.superficie2, tema.c.texto, tema.c.superficie, tema.c.fondo] : [acento, tema.c.fondo];
    return (
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        {colores.map((c, i) => {
          const r = i * (dur * 0.05);
          const x =
            f < mitad + r
              ? tween(f, r, mitad * 0.9, -recorrido, 0, ease.power3InOut)
              : tween(f, mitad + r, mitad * 0.9, 0, recorrido, ease.power3InOut);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: -40,
                left: -H * 0.3 - 40,
                width: W + H * 0.6 + 80,
                height: H + 80,
                background: c,
                transform: `translateX(${x}px) skewX(-16deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }
  const k = f < mitad ? tween(f, 0, mitad, 0, 1, ease.power2InOut) : tween(f, mitad, mitad, 1, 0, ease.power2InOut);
  return <AbsoluteFill style={{ background: tema.c.fondo, opacity: k, pointerEvents: "none" }} />;
};
