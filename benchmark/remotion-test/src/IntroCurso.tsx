import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Bloques, BLOQUES_FROM } from "./escenas/Bloques";
import { Grafica, GRAFICA_FROM } from "./escenas/Grafica";
import { Objeto3D, OBJETO_FROM } from "./escenas/Objeto3D";
import { Rotulo, ROTULO_FROM } from "./escenas/Rotulo";
import { Titulo, TITULO_FROM } from "./escenas/Titulo";
import { COLOR, FONT, radialGlow, tween } from "./tema";

// Intro de curso de 30 s: especificación común en assets/ESCENA.md.
export const IntroCurso: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg, color: COLOR.fg, fontFamily: FONT, overflow: "hidden" }}>
      {/* Fondo persistente */}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: -500,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: radialGlow,
          opacity: 0.22,
          transform: `translate(${tween(t, 0, 30, 0, -300)}px, ${tween(t, 0, 30, 0, 120)}px)`,
        }}
      />

      {/* Cada escena se monta desde que entra hasta que sale de cuadro. */}
      <Sequence name="1 · Título" from={TITULO_FROM} durationInFrames={168} layout="none">
        <Titulo />
      </Sequence>
      <Sequence name="2 · Objeto 3D" from={OBJETO_FROM} durationInFrames={318} layout="none">
        <Objeto3D />
      </Sequence>
      <Sequence name="3 · Gráfica" from={GRAFICA_FROM} durationInFrames={233} layout="none">
        <Grafica />
      </Sequence>
      <Sequence name="4 · Rótulo" from={ROTULO_FROM} durationInFrames={217} layout="none">
        <Rotulo />
      </Sequence>
      <Sequence name="Transición bloques" from={BLOQUES_FROM} durationInFrames={45} layout="none">
        <Bloques />
      </Sequence>
    </AbsoluteFill>
  );
};
