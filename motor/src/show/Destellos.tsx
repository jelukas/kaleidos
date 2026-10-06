/**
 * Destellos dorados de cuatro puntas (estilo.md › diapo-show): SVG con degradado radial y halo, sin `filter`
 * (el `drop-shadow` del muestrario es un desenfoque y en Lambda se compone por software). Cada destello va en su
 * capa (`will-change`): parpadear y derivar solo recompone, no repinta.
 *
 * - `DestellosAmbiente`: 6–10 destellos deterministas repartidos por los bordes de la caja (el centro queda libre
 *   para el titular), que parpadean y derivan despacio.
 * - `Estallido`: 4–6 destellos que salen disparados desde un punto (titular de juego, contador, sello).
 * - `Polvo`: puntos dorados con halo.
 */
import React, { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { clamp01, ease, hash01, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";

const ESTRELLA = "M50 0 C53 30 58 42 100 50 C58 58 53 70 50 100 C47 70 42 58 0 50 C42 42 47 30 50 0 Z";

export const Destello: React.FC<{ x: number; y: number; tam: number; k: number; giro?: number; opacidad?: number }> = ({
  x,
  y,
  tam,
  k,
  giro = 0,
  opacidad = 1,
}) => {
  const tema = useTema();
  const id = useId().replace(/:/g, "");
  if (k <= 0.001 || opacidad <= 0.001) return null;
  const [claro] = tema.show.juego.degradado;
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        left: x - tam / 2,
        top: y - tam / 2,
        overflow: "visible",
        transform: `scale(${k}) rotate(${giro}deg)`,
        opacity: opacidad,
        willChange: "transform, opacity",
        pointerEvents: "none",
      }}
    >
      <defs>
        <radialGradient id={`h${id}`}>
          <stop offset="0%" stopColor={claro} stopOpacity={0.75} />
          <stop offset="100%" stopColor={tema.c.acento} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`e${id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="28%" stopColor={tema.mezcla(claro, "#FFFFFF", 0.55)} />
          <stop offset="100%" stopColor={tema.c.acento} />
        </radialGradient>
      </defs>
      <circle cx={50} cy={50} r={34} fill={`url(#h${id})`} />
      <path d={ESTRELLA} fill={`url(#e${id})`} />
    </svg>
  );
};

/** Puntos de anclaje por los bordes de la caja (fracciones), en orden de uso. */
const ANCLAS: [number, number][] = [
  [0.12, 0.13],
  [0.86, 0.15],
  [0.09, 0.8],
  [0.9, 0.78],
  [0.52, 0.07],
  [0.27, 0.9],
  [0.7, 0.91],
  [0.96, 0.46],
  [0.04, 0.44],
  [0.66, 0.1],
  [0.34, 0.08],
  [0.8, 0.52],
];

export const DestellosAmbiente: React.FC<{ w: number; h: number; n: number; semilla?: number }> = ({ w, h, n, semilla = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const m = Math.min(w, h);
  return (
    <>
      {ANCLAS.slice(0, Math.max(0, Math.min(ANCLAS.length, n))).map(([ax, ay], i) => {
        const r = (k: number) => hash01(semilla * 97 + i * 13 + k);
        const tam = m * (0.075 + 0.07 * r(1));
        const frec = 0.35 + 0.5 * r(2);
        const fase = r(3) * Math.PI * 2;
        const parpadeo = 0.55 + 0.45 * Math.abs(Math.sin(t * frec * Math.PI + fase));
        // Deriva lenta (1–3 % de la caja) en una órbita elíptica.
        const dx = Math.sin(t * 0.4 + fase) * w * (0.01 + 0.02 * r(4));
        const dy = Math.cos(t * 0.33 + fase) * h * (0.01 + 0.015 * r(5));
        return <Destello key={i} x={ax * w + dx} y={ay * h + dy} tam={tam} k={parpadeo} giro={Math.sin(t * 0.5 + fase) * 12} opacidad={0.7 + 0.3 * parpadeo} />;
      })}
    </>
  );
};

/** Estallido de destellos desde (cx, cy) en el fotograma local `inicio`. */
export const Estallido: React.FC<{ cx: number; cy: number; radio: number; inicio: number; n?: number; tam: number; semilla?: number }> = ({
  cx,
  cy,
  radio,
  inicio,
  n = 6,
  tam,
  semilla = 3,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = Math.round(fps * 0.75);
  const p = (f - inicio) / dur;
  if (p <= 0 || p >= 1) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: number) => hash01(semilla * 31 + i * 7 + k);
        const a = (i / n) * Math.PI * 2 + (r(1) - 0.5) * 0.9 - Math.PI / 2;
        const d = radio * (0.45 + 0.55 * ease.power3Out(clamp01(p * 1.2))) * (0.75 + 0.4 * r(2));
        const k = Math.sin(Math.PI * clamp01(p * 1.1)) * (0.7 + 0.5 * r(3));
        return <Destello key={i} x={cx + Math.cos(a) * d} y={cy + Math.sin(a) * d * 0.75} tam={tam * (0.6 + 0.6 * r(4))} k={k} giro={p * 90 * (r(5) - 0.5)} />;
      })}
    </>
  );
};

/** Polvo dorado: puntos con halo que parpadean (sin `box-shadow` difuminado: halo con degradado radial). */
export const Polvo: React.FC<{ w: number; h: number; n?: number; semilla?: number }> = ({ w, h, n = 8, semilla = 5 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tema = useTema();
  const t = f / fps;
  const m = Math.min(w, h);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: number) => hash01(semilla * 53 + i * 11 + k);
        const [ax, ay] = ANCLAS[(i + 3) % ANCLAS.length];
        const x = (ax + (r(1) - 0.5) * 0.12) * w;
        const y = (ay + (r(2) - 0.5) * 0.12) * h;
        const s = m * 0.022;
        const o = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + r(3)) + r(4) * 6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - s,
              top: y - s,
              width: s * 2,
              height: s * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, #FFFFFF 0 16%, ${tema.c.acento} 22%, ${tema.alpha(tema.c.acento, 0)} 70%)`,
              opacity: o,
              willChange: "opacity",
            }}
          />
        );
      })}
    </>
  );
};

/** Progreso 0→1 de una entrada con la curva del titular de juego (`back.out(2.2)`, 0,7 s). */
export const useEntradaJuego = (inicio: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return tween(f, inicio, Math.round(0.7 * fps), 0, 1, ease.backOutJuego);
};
