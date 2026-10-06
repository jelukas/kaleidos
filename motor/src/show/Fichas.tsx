/**
 * Barra del método (`hud.estilo: "fichas"`): una ficha por capítulo con su `sigla` (por defecto, su número).
 * Estados: vista (oro apagado), actual (degradado dorado con brillo y escala 1,12) y pendiente (contorno
 * discontinuo). La ficha actual «salta» al cambiar de capítulo. Sustituye a la barra de progreso.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { indiceCapitulo, tramoPrograma } from "../lib/linea";
import { clamp01, ease, tween } from "../tema/anim";
import { useMotor } from "../tema/Motor";

export const HudFichas: React.FC<{ cx: number; y: number; tam: number }> = ({ cx, y, tam }) => {
  const { timeline: tl, tema } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caps = tl.capitulos;
  const { ini, fin } = tramoPrograma(tl);
  if (!caps.length || f < ini - 12 || f > fin + 12) return null;
  const aparece = Math.min(tween(f, ini - 12, 20, 0, 1, ease.power2Out), tween(f, fin - 12, 12, 1, 0));
  const actual = indiceCapitulo(tl, f);
  const lienzo = tema.show.escenario.lienzo;
  const acento = tema.c.acento;
  const [g0, g1, g2] = tema.show.juego.degradado;
  const gap = tam * 0.17;
  const ancho = caps.length * tam + (caps.length - 1) * gap;
  const familia = `"${tema.show.juego.familia}", ${tema.f.titular}`;
  return (
    <div style={{ position: "absolute", left: cx - ancho / 2, top: y, width: ancho, height: tam, display: "flex", gap, opacity: aparece, pointerEvents: "none" }}>
      {caps.map((c, i) => {
        const estado = i < actual ? "vista" : i === actual ? "actual" : "pendiente";
        const lf = f - c.desde;
        // Salto al entrar: sube y cae con rebote; la escala pasa por 1,25 y se queda en 1,12.
        const salto = estado === "actual" ? Math.sin(Math.PI * clamp01(lf / Math.round(0.42 * fps))) : 0;
        const escala = estado === "actual" ? 1 + 0.12 * tween(lf, 0, Math.round(0.36 * fps), 0, 1, ease.backOutJuego) + 0.1 * salto : 1;
        // La que acaba de dejar de ser actual vuelve a 1 poco a poco.
        const siguiente = caps[i + 1];
        const baja = estado === "vista" && siguiente ? 1 + 0.12 * tween(f - siguiente.desde, 0, 8, 1, 0) : 1;
        const base: React.CSSProperties = {
          width: tam,
          height: tam,
          flexShrink: 0,
          boxSizing: "border-box",
          borderRadius: tam * 0.21,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: familia,
          fontWeight: tema.show.juego.peso,
          fontSize: tam * 0.6,
          lineHeight: 1,
          transform: `translateY(${-salto * tam * 0.4}px) scale(${escala * baja})`,
        };
        const estilo: React.CSSProperties =
          estado === "actual"
            ? {
                background: `linear-gradient(180deg, ${g0} 0%, ${g1} 50%, ${g2} 100%)`,
                color: tema.c.sobreAcento ?? tema.sobre(acento),
                boxShadow: `0 0 ${tam * 0.32}px ${tema.alpha(acento, 0.7)}, 0 ${tam * 0.07}px 0 ${tema.c.tinta}`,
              }
            : estado === "vista"
              ? { background: tema.mezcla(acento, lienzo, 0.78), color: tema.mezcla(acento, lienzo, 0.22), border: `${Math.max(2, tam * 0.035)}px solid ${tema.mezcla(acento, lienzo, 0.58)}` }
              : { border: `${Math.max(2, tam * 0.035)}px dashed ${tema.c.linea}`, color: tema.mezcla(tema.c.linea, tema.c.texto, 0.3) };
        return (
          <div key={i} style={{ ...base, ...estilo }}>
            {c.sigla ?? String(c.n)}
          </div>
        );
      })}
    </div>
  );
};
