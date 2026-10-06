/**
 * Paquete de marca (estilo.md › apertura-marca y rotulo-nombre): intro y outro con `estilo: "marca"`.
 *
 * Apertura (tiempos para 8 s; se comprimen si la intro es más corta):
 *   0,1 s  las palabras («MASTER», «CLASS») suben desde una máscara; deriva lenta
 *   0,8 s  etiquetas pequeñas (chevrones, aspas, lema, «En directo» + nº en caja, flecha en círculo)
 *   2,5 s  empuje: las palabras se apartan a la izquierda y entra una píldora con el ponente en bitono verde
 *          azulado (plancha o mezzanine, en vivo) que se abre a tarjeta
 *   4,2 s  rótulo de dos barras (icono + nombre y cargo), deslizando desde la izquierda con 0,08 s de desfase
 *   5,9 s  pliegue a franja con el título (Inter 700 cursiva), subtítulo y firma
 *   final  la franja se cierra y se descubre el escenario
 * Cierre: franja con el título del outro (y sus puntos) → pliegue → tarjeta con las palabras de marca.
 * Nombres genéricos salvo que el usuario los dé (contrato §7.3).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Intro, Outro } from "../datos/contrato";
import { camaraCaja } from "../lib/escenario";
import { clamp01, ease, lerp, tween } from "../tema/anim";
import { useMotor } from "../tema/Motor";
import { TramosVideo } from "../capas/Tramos";
import { Icono } from "../paneles/Iconos";
import { OndaVoz } from "./CajaVoz";

type RectXY = { x: number; y: number; w: number; h: number };

const useMarca = () => {
  const { tema } = useMotor();
  const m = tema.show.marca;
  const fam = `"${m.familia}", ${tema.f.cuerpo}`;
  return { m, fam, tema };
};

/** Foto del ponente en bitono (vídeo en vivo: plancha con recorte o mezzanine sin él). */
const FotoBitono: React.FC<{ r: RectXY; radio: number }> = ({ r, radio }) => {
  const { timeline: tl, medios, recorte, narracion } = useMotor();
  const { m } = useMarca();
  const f = useCurrentFrame();
  if (r.w < 2 || r.h < 2) return null;
  // §8 Narración: no hay ponente; la píldora lleva la onda de la locución en el bitono de la marca.
  if (narracion || !medios.mezzanine)
    return (
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radio, overflow: "hidden", background: m.oscuro, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <OndaVoz w={r.w * 0.7} h={r.h * 0.45} color={m.bitono} />
      </div>
    );
  const cam = camaraCaja(tl, f, r, { k: 1.45, focoY: 0.4 }, !recorte);
  const p = tl.plancha;
  const video =
    recorte && p && medios.plancha
      ? { left: cam.ox + p.x * cam.S - r.x, top: cam.oy + p.y * cam.S - r.y, width: p.ancho * cam.S, height: p.alto * cam.S, src: medios.plancha }
      : { left: cam.ox - r.x, top: cam.oy - r.y, width: tl.fuente.ancho * cam.S, height: tl.fuente.alto * cam.S, src: medios.mezzanine };
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radio, overflow: "hidden", isolation: "isolate", background: m.oscuro }}>
      <div style={{ position: "absolute", left: video.left, top: video.top, width: video.width, height: video.height, filter: "grayscale(1) contrast(1.2) brightness(1.08)" }}>
        <TramosVideo src={video.src} nombre="Bitono" muted />
      </div>
      {/* Duotono: las sombras suben al verde oscuro (lighten) y las luces bajan al claro del bitono (darken). */}
      <div style={{ position: "absolute", inset: 0, background: m.oscuro, mixBlendMode: "lighten" }} />
      <div style={{ position: "absolute", inset: 0, background: m.bitono, mixBlendMode: "darken" }} />
    </div>
  );
};

/** Palabras de marca que suben desde una máscara. */
const Palabras: React.FC<{ palabras: string[]; t0: number; tam: number; paso: number }> = ({ palabras, t0, tam, paso }) => {
  const { m, fam } = useMarca();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div>
      {palabras.map((p, i) => {
        const k = tween(f, t0 + i * paso, Math.round(0.6 * fps), 0, 1, ease.power3Out);
        return (
          <div key={i} style={{ overflow: "hidden", height: tam * 0.94, marginTop: i ? -tam * 0.04 : 0 }}>
            <div style={{ fontFamily: fam, fontWeight: 300, fontSize: tam, lineHeight: 0.94, letterSpacing: "-0.01em", color: i % 2 ? m.palabra : m.texto, transform: `translateY(${(1 - k) * 105}%)`, whiteSpace: "nowrap" }}>
              {p}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Chevron: React.FC<{ x: number; y: number; k: number; color: string }> = ({ x, y, k, color }) => (
  <svg width={40} height={24} viewBox="0 0 40 24" style={{ position: "absolute", left: x, top: y, opacity: k, transform: `translateY(${(1 - k) * -10}px)` }}>
    <path d="M4 4 L20 20 L36 4" fill="none" stroke={color} strokeWidth={2.4} />
  </svg>
);

const Aspa: React.FC<{ x: number; y: number; k: number; color: string }> = ({ x, y, k, color }) => (
  <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", left: x, top: y, opacity: k, transform: `rotate(${(1 - k) * 45}deg)` }}>
    <path d="M4 4 L56 56 M56 4 L4 56" fill="none" stroke={color} strokeWidth={2.4} />
  </svg>
);

/** Etiquetas pequeñas de la tarjeta de marca (escalonadas desde `t0`). */
const Etiquetas: React.FC<{ t0: number; etiquetas: string[]; lema?: string }> = ({ t0, etiquetas, lema }) => {
  const { m, fam, tema } = useMarca();
  const f = useCurrentFrame();
  const k = (i: number) => tween(f, t0 + i * 3, 10, 0, 1, ease.power2Out);
  const suave = tema.mezcla(m.texto, m.fondo, 0.35);
  const lineas = tema.mezcla(m.texto, m.fondo, 0.15);
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Chevron key={i} x={150} y={470 + i * 88 + (i === 2 ? 22 : 0)} k={k(i)} color={lineas} />
      ))}
      <Aspa x={1560} y={78} k={k(1)} color={m.oscuro} />
      <Aspa x={1674} y={78} k={k(2)} color={m.oscuro} />
      {lema ? (
        <div style={{ position: "absolute", left: 1552, top: 236, width: 260, fontFamily: fam, fontWeight: 400, fontSize: 21, lineHeight: 1.35, color: suave, opacity: k(3) }}>{lema}</div>
      ) : null}
      {etiquetas[0] ? (
        <div style={{ position: "absolute", left: 72, top: 850, width: 160, fontFamily: fam, fontWeight: 400, fontSize: 24, lineHeight: 1.05, color: suave, opacity: k(4) }}>{etiquetas[0]}</div>
      ) : null}
      {etiquetas[1] ? (
        <div
          style={{
            position: "absolute",
            left: 78,
            top: 912,
            minWidth: 70,
            height: 66,
            padding: "0 14px",
            boxSizing: "border-box",
            border: `2px solid ${m.oscuro}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fam,
            fontWeight: 400,
            fontSize: 26,
            color: m.texto,
            opacity: k(5),
          }}
        >
          {etiquetas[1]}
        </div>
      ) : null}
      {etiquetas[2] ? (
        <div style={{ position: "absolute", right: 250, top: 886, fontFamily: fam, fontWeight: 400, fontSize: 21, color: suave, opacity: k(6) }}>{etiquetas[2]}</div>
      ) : null}
      <svg width={76} height={76} viewBox="0 0 76 76" style={{ position: "absolute", left: 1664, top: 866, opacity: k(6) }}>
        <circle cx={38} cy={38} r={35} fill="none" stroke={m.oscuro} strokeWidth={2.4} />
        <path d="M22 38 H54 M44 28 L54 38 L44 48" fill="none" stroke={m.oscuro} strokeWidth={2.4} />
      </svg>
    </>
  );
};

/** Rótulo de dos barras: caja cuadrada con icono de línea + caja ancha con nombre y cargo. */
const Rotulo: React.FC<{ x: number; y: number; t0: number; nombre: string; cargo?: string }> = ({ x, y, t0, nombre, cargo }) => {
  const { m, fam } = useMarca();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k1 = tween(f, t0, Math.round(0.45 * fps), 0, 1, ease.power3Out);
  const k2 = tween(f, t0 + Math.round(0.08 * fps), Math.round(0.45 * fps), 0, 1, ease.power3Out);
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: 10 }}>
      <div style={{ width: 92, height: 92, borderRadius: 12, background: m.rotulo, display: "flex", alignItems: "center", justifyContent: "center", opacity: k1, transform: `translateX(${(1 - k1) * -60}px)` }}>
        <Icono nombre="estrella" size={46} color="#FFFFFF" progreso={tween(f, t0 + 4, 16, 0, 1)} grosor={2} />
      </div>
      <div style={{ height: 92, boxSizing: "border-box", borderRadius: 12, background: m.rotulo, padding: "0 28px", display: "flex", flexDirection: "column", justifyContent: "center", opacity: k2, transform: `translateX(${(1 - k2) * -60}px)` }}>
        <div style={{ fontFamily: fam, fontWeight: 400, fontSize: 32, color: "#FFFFFF", whiteSpace: "nowrap" }}>{nombre}</div>
        {cargo ? <div style={{ fontFamily: fam, fontWeight: 700, fontStyle: "italic", fontSize: 25, color: m.cargo, whiteSpace: "nowrap", marginTop: 2 }}>{cargo}</div> : null}
      </div>
    </div>
  );
};

/** Franja (resultado del pliegue): título en cursiva negrita, subtítulo, puntos opcionales y firma. */
const Franja: React.FC<{ k: number; revela: number; titulo?: string; subtitulo?: string; firma?: string; puntos?: string[] }> = ({ k, revela, titulo, subtitulo, firma, puntos = [] }) => {
  const { m, fam, tema } = useMarca();
  const alto = 330 + puntos.length * 46;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 540 - alto / 2,
        height: alto,
        background: m.fondo,
        boxShadow: `0 0 0 3px ${m.oscuro}`,
        transform: `scaleY(${Math.max(0.001, k)})`,
        transformOrigin: "50% 50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 180px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ clipPath: `inset(0 ${(1 - revela) * 100}% 0 0)` }}>
        {titulo ? <div style={{ fontFamily: fam, fontWeight: 700, fontStyle: "italic", fontSize: 66, lineHeight: 1.05, color: m.texto }}>{titulo}</div> : null}
        {subtitulo ? <div style={{ fontFamily: fam, fontWeight: 400, fontSize: 34, lineHeight: 1.3, marginTop: 12, color: tema.mezcla(m.texto, m.fondo, 0.2) }}>{subtitulo}</div> : null}
        {puntos.map((p, i) => (
          <div key={i} style={{ fontFamily: fam, fontWeight: 400, fontSize: 28, lineHeight: 1.3, marginTop: i ? 6 : 18, color: m.texto }}>
            <span style={{ color: m.bitono, marginRight: 14 }}>—</span>
            {p}
          </div>
        ))}
        {firma ? <div style={{ fontFamily: fam, fontWeight: 400, fontSize: 22, marginTop: 22, color: tema.mezcla(m.texto, m.fondo, 0.4) }}>{firma}</div> : null}
      </div>
    </div>
  );
};

export const IntroMarca: React.FC<{ intro: Intro }> = ({ intro }) => {
  const { m } = useMarca();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = intro.hasta - intro.desde;
  const q = Math.min(1, D / (8 * fps));
  const T = (s: number) => Math.round(s * fps * q);
  const palabras = intro.palabras?.length ? intro.palabras : ["MASTER", "CLASS"];
  const etiquetas = intro.etiquetas ?? [];
  // Empuje: las palabras se van a la izquierda y se encogen; la píldora entra y se abre a tarjeta.
  const empuje = tween(f, T(2.5), T(0.7), 0, 1, ease.power3InOut);
  const abre = tween(f, T(3.05), T(1.0), 0, 1, ease.power3InOut);
  const pliegue = tween(f, T(5.9), T(0.6), 0, 1, ease.power3InOut);
  const revela = tween(f, T(6.25), T(0.55), 0, 1, ease.power3Out);
  const cierra = tween(f, D - T(0.5), T(0.45), 0, 1, ease.power2In);
  const deriva = -f * 0.25;
  const pildoraX = lerp(2050, 1060, ease.power3Out(clamp01((f - T(2.6)) / T(0.6))));
  const card: RectXY = {
    x: lerp(pildoraX, 980, abre),
    y: lerp(360, 150, abre),
    w: lerp(230, 720, abre),
    h: lerp(380, 780, abre),
  };
  const franja = intro.franja ?? {};
  const escena = 1 - pliegue;
  return (
    <AbsoluteFill style={{ background: m.oscuro, opacity: 1 - tween(f, D - T(0.25), T(0.25), 0, 1) }}>
      {/* Tarjeta de marca (se pliega a franja) */}
      <AbsoluteFill style={{ transform: `scaleY(${lerp(1, 0.3, pliegue)})`, transformOrigin: "50% 50%", opacity: escena }}>
        <div style={{ position: "absolute", inset: 24, borderRadius: 38, background: m.fondo, overflow: "hidden" }}>
          {/* Empuje: las palabras se encogen a la esquina superior izquierda (enteras) y las etiquetas se apartan. */}
          <div style={{ position: "absolute", left: lerp(346, 96, empuje), top: lerp(250, 110, empuje), transform: `translateX(${deriva * (1 - empuje)}px) scale(${lerp(1, 0.42, empuje)})`, transformOrigin: "0 0" }}>
            <Palabras palabras={palabras} t0={T(0.1)} tam={284} paso={T(0.14)} />
          </div>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${-empuje * 520}px)`, opacity: 1 - empuje }}>
            <Etiquetas t0={T(0.8)} etiquetas={etiquetas} lema={intro.lema} />
          </div>
          {intro.kicker ? (
            <div style={{ position: "absolute", left: 96, top: 420, width: 760, fontFamily: `"${m.familia}"`, fontWeight: 700, fontStyle: "italic", fontSize: 50, lineHeight: 1.1, color: m.texto, opacity: tween(f, T(3.3), T(0.5), 0, 1), transform: `translateY(${(1 - tween(f, T(3.3), T(0.5), 0, 1)) * 20}px)` }}>
              {intro.kicker}
            </div>
          ) : null}
        </div>
        {f >= T(2.5) ? <FotoBitono r={card} radio={lerp(card.w / 2, 30, abre)} /> : null}
        {intro.rotulo ? <Rotulo x={card.x - 150} y={card.y + card.h - 140} t0={T(4.2)} nombre={intro.rotulo.nombre} cargo={intro.rotulo.cargo} /> : null}
      </AbsoluteFill>
      {pliegue > 0 ? <Franja k={pliegue * (1 - cierra)} revela={revela} titulo={franja.titulo ?? intro.titulo} subtitulo={franja.subtitulo ?? intro.subtitulo} firma={franja.firma} /> : null}
    </AbsoluteFill>
  );
};

export const OutroMarca: React.FC<{ outro: Outro }> = ({ outro }) => {
  const { m } = useMarca();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = outro.hasta - outro.desde;
  const q = Math.min(1, D / (8 * fps));
  const T = (s: number) => Math.round(s * fps * q);
  const entra = tween(f, 0, T(0.4), 0, 1, ease.power2Out);
  const abre = tween(f, T(0.25), T(0.6), 0, 1, ease.power3Out);
  const revela = tween(f, T(0.55), T(0.6), 0, 1, ease.power3Out);
  const pliegue = tween(f, T(4.4), T(0.6), 0, 1, ease.power3InOut);
  const tarjeta = tween(f, T(4.7), T(0.6), 0, 1, ease.power3Out);
  const franja = outro.franja ?? {};
  const palabras = outro.palabras?.length ? outro.palabras : ["MASTER", "CLASS"];
  return (
    <AbsoluteFill style={{ background: m.oscuro, opacity: entra }}>
      {tarjeta > 0 ? (
        <div style={{ position: "absolute", inset: 24, borderRadius: 38, background: m.fondo, overflow: "hidden", transform: `scaleY(${lerp(0.3, 1, tarjeta)})`, opacity: tarjeta }}>
          <div style={{ position: "absolute", left: 346, top: 250 }}>
            <Palabras palabras={palabras} t0={T(4.8)} tam={284} paso={T(0.14)} />
          </div>
          <Etiquetas t0={T(5.4)} etiquetas={outro.etiquetas ?? []} lema={outro.lema} />
        </div>
      ) : null}
      {pliegue < 1 ? <Franja k={abre * (1 - pliegue)} revela={revela} titulo={franja.titulo ?? outro.titulo} subtitulo={franja.subtitulo ?? outro.cta} firma={franja.firma} puntos={outro.puntos} /> : null}
    </AbsoluteFill>
  );
};
