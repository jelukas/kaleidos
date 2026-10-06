/**
 * Reacciones (§7.3, evento `reaccion`): un icono propio en una pastilla que brota junto a la caja del ponente, flota
 * 12 px y se desvanece (~1,4 s). Pueden solaparse con otros eventos; como mucho 2 a la vez, en las esquinas
 * superiores de la caja (lejos de la cara, que la cámara centra). Iconos: pregunta, idea, rayo, ok, alerta,
 * corazon, reloj (uno desconocido pinta «idea»).
 *
 * También los bocadillos sueltos (evento `bocadillo`): junto a la cabeza, con la cola hacia la boca.
 */
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EventoBocadillo, EventoReaccion } from "../datos/contrato";
import type { Rect } from "../lib/escenario";
import { clamp01, ease, tween } from "../tema/anim";
import { useMotor, useTema } from "../tema/Motor";
import { Bocadillo, medidasBocadillo } from "./Bocadillo";

const TINTA = 3.2;

/** Iconos (viewBox 48×48): relleno blanco o de color con trazo de tinta. */
const IconoReaccion: React.FC<{ nombre: string; tam: number; tinta: string; color: string }> = ({ nombre, tam, tinta, color }) => {
  const p = { stroke: tinta, strokeWidth: TINTA, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let d: React.ReactNode;
  switch (nombre) {
    case "pregunta":
      d = (
        <>
          <path d="M16 17 C16 8 32 8 32 17 C32 24 24 24 24 31" fill="none" {...p} strokeWidth={6} />
          <circle cx={24} cy={39.5} r={3.4} fill={tinta} />
        </>
      );
      break;
    case "rayo":
      d = <path d="M27 4 L10 27 H22 L19 44 L38 19 H26 Z" fill="#FFFFFF" {...p} />;
      break;
    case "ok":
      d = <path d="M10 25 L20 35 L38 13" fill="none" {...p} strokeWidth={6.5} />;
      break;
    case "alerta":
      d = (
        <>
          <path d="M24 5 L44 41 H4 Z" fill="#FFFFFF" {...p} />
          <path d="M24 17 V29" fill="none" {...p} strokeWidth={5} />
          <circle cx={24} cy={35} r={2.8} fill={tinta} />
        </>
      );
      break;
    case "corazon":
      d = <path d="M24 42 C10 32 4 24 4 16 C4 9 9 5 15 5 C19 5 22 7 24 11 C26 7 29 5 33 5 C39 5 44 9 44 16 C44 24 38 32 24 42 Z" fill={color} {...p} />;
      break;
    case "reloj":
      d = (
        <>
          <circle cx={24} cy={25} r={18} fill="#FFFFFF" {...p} />
          <path d="M24 14 V25 L31 30" fill="none" {...p} strokeWidth={4} />
          <path d="M19 4 H29" fill="none" {...p} />
        </>
      );
      break;
    default: // idea
      d = (
        <>
          <path d="M16 30 C10 25 11 7 24 7 C37 7 38 25 32 30 V35 H16 Z" fill="#FFFFFF" {...p} />
          <path d="M17 40 H31" fill="none" {...p} />
          <path d="M21 21 L24 26 L27 21" fill="none" {...p} strokeWidth={2.6} />
        </>
      );
  }
  return (
    <svg width={tam} height={tam} viewBox="0 0 48 48" style={{ overflow: "visible" }}>
      {d}
    </svg>
  );
};

/** Hueco (0 o 1) de cada reacción: como mucho dos a la vez; las que no caben se descartan. */
const huecos = (rs: EventoReaccion[]) => {
  const ocupado: [number, number] = [-Infinity, -Infinity];
  return rs.map((r) => {
    const libre = ocupado.findIndex((h) => h <= r.desde);
    if (libre < 0) return -1;
    ocupado[libre] = r.hasta;
    return libre;
  });
};

/** Caja del ponente en pantalla en el fotograma `f` (escenario: su caja; normal: un rectángulo alrededor de la cabeza). */
export type CajaDe = (f: number) => (Rect & { nariz: [number, number] }) | null;

export const CapaReacciones: React.FC<{ cajaDe: CajaDe }> = ({ cajaDe }) => {
  const { timeline: tl, tema } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rs = useMemo(() => tl.eventos.filter((e): e is EventoReaccion => e.tipo === "reaccion").sort((a, b) => a.desde - b.desde), [tl]);
  const slot = useMemo(() => huecos(rs), [rs]);
  const activas = rs.map((r, i) => ({ r, s: slot[i] })).filter(({ r, s }) => s >= 0 && f >= r.desde && f < r.hasta);
  if (!activas.length) return null;
  const caja = cajaDe(f);
  if (!caja) return null;
  const colores: Record<string, string> = {
    pregunta: tema.c.capitulos[3] ?? tema.c.acento,
    idea: tema.c.acento,
    rayo: tema.c.aviso,
    ok: tema.c.ok,
    alerta: tema.c.aviso,
    corazon: tema.mezcla(tema.c.error, "#FFFFFF", 0.1),
    reloj: tema.c.capitulos[2] ?? tema.c.acento,
  };
  const tam = Math.max(52, Math.min(104, caja.h * 0.15));
  return (
    <>
      {activas.map(({ r, s }) => {
        const lf = f - r.desde;
        const dur = r.hasta - r.desde;
        const pop = tween(lf, 0, 9, 0.001, 1, ease.backOutJuego);
        const sale = tween(lf, dur - 10, 10, 1, 0, ease.power2In);
        const sube = -12 * (tam / 90) * ease.sineInOut(clamp01(lf / Math.max(1, dur)));
        const cx = caja.x + caja.w * (s === 0 ? 0.13 : 0.87);
        const cy = caja.y + caja.h * 0.2 + sube;
        const color = colores[r.icono] ?? tema.c.acento;
        const w = tam * 1.3;
        const bamboleo = Math.sin((lf / fps) * 7) * 6 * (1 - clamp01(lf / 18));
        return (
          <div
            key={`${r.desde}-${s}`}
            style={{
              position: "absolute",
              left: cx - w / 2,
              top: cy - tam / 2,
              width: w,
              height: tam,
              borderRadius: 999,
              background: `linear-gradient(180deg, ${tema.mezcla(color, "#FFFFFF", 0.35)} 0%, ${color} 100%)`,
              border: `${Math.max(3, tam * 0.05)}px solid ${tema.c.tinta}`,
              boxShadow: `0 ${tam * 0.07}px 0 ${tema.c.tinta}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${pop}) rotate(${bamboleo}deg)`,
              opacity: sale,
              willChange: "transform, opacity",
            }}
          >
            <IconoReaccion nombre={r.icono} tam={tam * 0.66} tinta={tema.c.tinta} color={tema.c.error} />
          </div>
        );
      })}
    </>
  );
};

/** Bocadillos sueltos junto a la cabeza del ponente (lado `izq` o `der`, cola hacia la boca). */
export const CapaBocadillos: React.FC<{ cajaDe: CajaDe }> = ({ cajaDe }) => {
  const { timeline: tl, lienzo } = useMotor();
  const tema = useTema();
  const f = useCurrentFrame();
  const bs = tl.eventos.filter((e): e is EventoBocadillo => e.tipo === "bocadillo" && f >= e.desde && f < e.hasta);
  if (!bs.length) return null;
  const caja = cajaDe(f);
  if (!caja) return null;
  const familia = `"Comic Neue", ${tema.f.cuerpo}`;
  return (
    <>
      {bs.map((b, i) => {
        const W = Math.max(280, Math.min(560, caja.w * 0.36, lienzo.ancho * 0.3));
        const tam = Math.max(30, Math.min(48, W * 0.085));
        const { H } = medidasBocadillo(b.texto, W, tam, familia);
        const [nx, ny] = caja.nariz;
        const s = b.lado === "izq" ? -1 : 1;
        let cx = nx + s * (caja.w * 0.14 + W * 0.52);
        let cy = ny - caja.h * 0.16 - H * 0.2;
        cx = Math.max(W / 2 + 24, Math.min(lienzo.ancho - W / 2 - 24, cx));
        cy = Math.max(H / 2 + 24, cy);
        return (
          <Bocadillo key={i} texto={b.texto} forma={b.forma} cola={b.lado === "izq" ? "der" : "izq"} cx={cx} cy={cy} ancho={W} tam={tam} f={f - b.desde} dur={b.hasta - b.desde} />
        );
      })}
    </>
  );
};
