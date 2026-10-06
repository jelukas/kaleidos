/**
 * Fondo del estilo (`tokens.fondo.tipo`): liso | radial | rejilla | papel | cristal.
 * Solo degradados CSS (sin `blur` ni `backdrop-filter`, que hunden el render por software; METODO §8).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { capituloEn } from "../lib/linea";
import { useMotor } from "../tema/Motor";

export const Fondo: React.FC<{ acento?: string }> = ({ acento: acentoFijo }) => {
  const { tema, timeline, lienzo } = useMotor();
  const f = useCurrentFrame();
  const c = tema.c;
  const acento = acentoFijo ?? tema.acentoCap(capituloEn(timeline, f)?.acento);
  const W = lienzo.ancho;
  const H = lienzo.alto;
  // Fondo ESTÁTICO a propósito: cualquier deriva obliga a repintar la pantalla entera en cada fotograma, y en
  // Lambda (composición por software) eso es lo más caro del render. Solo cambia con el acento del capítulo.
  const d = 0.5;
  const tipo = tema.fondo.tipo;

  const resplandor = (x: number, y: number, r: number, color: string, a: number) => (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle closest-side, ${tema.alpha(color, a)} 0%, ${tema.alpha(color, 0)} 100%)`,
      }}
    />
  );

  return (
    <AbsoluteFill style={{ background: c.fondo, overflow: "hidden", willChange: "transform" }}>
      {tipo === "radial" || tipo === "rejilla" ? (
        <>
          {resplandor(W * 0.82 - 120 * d, -H * 0.05 + 60 * d, H * 0.95, acento, tema.oscuro ? 0.3 : 0.18)}
          {resplandor(W * 0.08, H * 1.02, H * 0.7, c.superficie2, tema.oscuro ? 0.55 : 0.35)}
        </>
      ) : null}
      {tipo === "rejilla" ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${tema.alpha(c.linea, 0.28)} 1px, transparent 1px), linear-gradient(90deg, ${tema.alpha(c.linea, 0.28)} 1px, transparent 1px)`,
            backgroundSize: `${Math.round(W / 24)}px ${Math.round(W / 24)}px`,
            backgroundPosition: `${Math.round(W / 48)}px ${Math.round(W / 48)}px`,
          }}
        />
      ) : null}
      {tipo === "cristal" ? (
        <>
          {resplandor(W * (0.2 + 0.05 * d), H * 0.25, H * 0.75, c.capitulos[0] ?? acento, 0.32)}
          {resplandor(W * (0.85 - 0.04 * d), H * 0.3, H * 0.7, c.capitulos[1] ?? c.acento, 0.26)}
          {resplandor(W * 0.55, H * (1.0 - 0.05 * d), H * 0.8, acento, 0.22)}
        </>
      ) : null}
      {tipo === "papel" ? (
        <>
          {/* Fibra del papel: puntos muy finos y dos bandas suaves; nada de ruido aleatorio por fotograma. */}
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${tema.alpha(c.linea, 0.35)} 0.8px, transparent 1.2px), radial-gradient(${tema.alpha(c.texto, 0.05)} 0.7px, transparent 1.1px)`,
              backgroundSize: "7px 7px, 11px 11px",
              backgroundPosition: "0 0, 3px 5px",
            }}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at 50% 45%, ${tema.alpha("#FFFFFF", 0.35)} 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 55%, ${tema.alpha(c.linea, 0.45)} 100%)`,
            }}
          />
          {resplandor(W * 0.86, H * 0.12, H * 0.55, acento, 0.1)}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
