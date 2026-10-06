/**
 * Pieles de la caja de diapositiva (§7) y lienzo del escenario.
 *
 * - `FondoRayos` (show): rayos cónicos alternos que giran ~2°/s y respiran (1,00↔1,03 en 6 s), viñeta y destellos.
 *   El giro es una TRANSFORMACIÓN de una capa propia (el degradado cónico se rasteriza una vez); la viñeta es otra
 *   capa estática encima. `barrido` acelera el giro al entrar un capítulo (rayos de transición).
 * - `FondoEditorial`: azul marino, cabecera «SIGLA · descripción» con filete y anillos radar que laten.
 * - `FondoLamina`: papel cálido de cómic con trama de puntos (para paneles con registro «lamina»).
 * - `Lienzo`: color del escenario y cuadraditos a 45° que asoman solo en las esquinas (estático).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Registro } from "../datos/contrato";
import { ease, tween } from "../tema/anim";
import { useMotor, useTema } from "../tema/Motor";
import { DestellosAmbiente, Polvo } from "./Destellos";

export const FondoRayos: React.FC<{ w: number; h: number; barrido?: number; destellos?: boolean; semilla?: number }> = ({ w, h, barrido, destellos = true, semilla = 1 }) => {
  const tema = useTema();
  const { opciones } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const r = tema.show.rayos;
  const quietos = opciones.perfil.has("rayos-quietos");
  // Barrido de capítulo: media vuelta rápida en 0,5 s al entrar (fotograma local `barrido`).
  const extra = barrido !== undefined ? tween(f, barrido, Math.round(0.5 * fps), -150, 0, ease.power3Out) : 0;
  const giro = quietos ? 0 : r.giro * t + extra;
  const respira = quietos ? 1 : 1 + 0.015 * (1 - Math.cos((t / 6) * Math.PI * 2));
  const diag = Math.hypot(w, h) * 1.04;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: r.c2 }}>
      <div
        style={{
          position: "absolute",
          left: (w - diag) / 2,
          top: (h - diag) / 2,
          width: diag,
          height: diag,
          background: `repeating-conic-gradient(from 3deg at 50% 50%, ${r.c1} 0deg 7deg, ${r.c2} 7deg 14deg)`,
          transform: `rotate(${giro}deg) scale(${respira})`,
          willChange: "transform",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${tema.alpha(r.vineta, 0)} 30%, ${tema.alpha(r.vineta, 0.85)} 100%)` }} />
      {destellos && !opciones.perfil.has("sin-destellos") ? (
        <>
          <DestellosAmbiente w={w} h={h} n={r.destellos} semilla={semilla} />
          <Polvo w={w} h={h} n={Math.max(4, Math.round(r.destellos * 0.75))} semilla={semilla + 2} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Cabecera editorial: «SIGLA · DESCRIPCIÓN» y filete fino debajo. */
export const CabeceraEditorial: React.FC<{ w: number; sigla: string; descripcion?: string; k?: number }> = ({ w, sigla, descripcion, k = 1 }) => {
  const tema = useTema();
  const s = w / 1545;
  return (
    <div style={{ position: "absolute", left: 60 * s, right: 60 * s, top: 30 * s, opacity: k }}>
      <div style={{ ...tema.t.etiqueta, fontSize: 21 * s, letterSpacing: "0.05em", color: tema.c.texto, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {sigla}
        {descripcion ? <span style={{ fontWeight: 600, color: tema.c.textoSuave, marginLeft: 14 * s }}>{descripcion}</span> : null}
      </div>
      <div style={{ marginTop: 12 * s, height: Math.max(1, 2 * s), background: tema.c.linea, transformOrigin: "left", transform: `scaleX(${k})` }} />
    </div>
  );
};

export const FondoEditorial: React.FC<{ w: number; h: number; sigla?: string; descripcion?: string }> = ({ w, h, sigla, descripcion }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ed = tema.show.editorial;
  const s = w / 1545;
  // Anillos radar en la esquina inferior derecha: laten (opacidad 60↔100 % en 4 s).
  const late = 0.8 + 0.2 * Math.sin((f / fps / 4) * Math.PI * 2);
  const R = 330 * s;
  const anillo = tema.mezcla(ed.fondo, "#3F7BD8", 0.18);
  return (
    <AbsoluteFill style={{ background: ed.fondo, overflow: "hidden" }}>
      {ed.anillos ? (
        <svg
          width={R * 2}
          height={R * 2}
          viewBox="-100 -100 200 200"
          style={{ position: "absolute", left: w - R * 1.05, top: h - R * 1.15, opacity: late, willChange: "opacity" }}
        >
          {[96, 74, 52, 30].map((r, i) => (
            <circle key={i} r={r} fill="none" stroke={anillo} strokeWidth={i === 0 ? 3 : 5} />
          ))}
          <circle r={9} fill={anillo} />
        </svg>
      ) : null}
      {sigla ? <CabeceraEditorial w={w} sigla={sigla} descripcion={descripcion} /> : null}
    </AbsoluteFill>
  );
};

export const FondoLamina: React.FC = () => {
  const tema = useTema();
  return (
    <AbsoluteFill
      style={{
        background: tema.c.fondo,
        backgroundImage: `radial-gradient(${tema.alpha("#B98E3C", 0.22)} 1.6px, transparent 2.2px), radial-gradient(ellipse at 50% 40%, ${tema.alpha("#FFFFFF", 0.55)} 0%, transparent 70%)`,
        backgroundSize: "14px 14px, 100% 100%",
      }}
    />
  );
};

/** Fondo de un registro dentro de la caja (el tema ya es el del registro). */
export const FondoRegistro: React.FC<{ registro: Registro; w: number; h: number; sigla?: string; descripcion?: string; barrido?: number }> = ({
  registro,
  w,
  h,
  sigla,
  descripcion,
  barrido,
}) => {
  if (registro === "show") return <FondoRayos w={w} h={h} barrido={barrido} />;
  if (registro === "editorial") return <FondoEditorial w={w} h={h} sigla={sigla} descripcion={descripcion} />;
  return <FondoLamina />;
};

/** Lienzo del escenario: color plano y cuadraditos girados 45° que asoman solo en dos esquinas. */
export const Lienzo: React.FC = () => {
  const { tema, lienzo } = useMotor();
  const e = tema.show.escenario;
  const k = lienzo.ancho / 1920;
  const lado = 56 * k;
  const patron: React.CSSProperties = {
    position: "absolute",
    width: 700 * k,
    height: 560 * k,
    backgroundImage: `linear-gradient(45deg, ${e.patronColor} 25%, transparent 25%, transparent 75%, ${e.patronColor} 75%), linear-gradient(45deg, ${e.patronColor} 25%, transparent 25%, transparent 75%, ${e.patronColor} 75%)`,
    backgroundSize: `${lado}px ${lado}px`,
    backgroundPosition: `0 0, ${lado / 2}px ${lado / 2}px`,
    opacity: 0.9,
  };
  return (
    <AbsoluteFill style={{ background: e.lienzo, overflow: "hidden" }}>
      {e.patron ? (
        <>
          <div style={{ ...patron, left: -80 * k, bottom: -60 * k, WebkitMaskImage: "radial-gradient(circle at 0% 100%, #000 0, transparent 70%)", maskImage: "radial-gradient(circle at 0% 100%, #000 0, transparent 70%)" }} />
          <div style={{ ...patron, right: -80 * k, top: -60 * k, WebkitMaskImage: "radial-gradient(circle at 100% 0%, #000 0, transparent 70%)", maskImage: "radial-gradient(circle at 100% 0%, #000 0, transparent 70%)" }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
