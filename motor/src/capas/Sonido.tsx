/**
 * Efectos discretos (sintetizados con ffmpeg por `npm run estilos`, sin licencias de terceros):
 * «whoosh» en rótulos y outro, «pop» al entrar cada panel. Nivel según `tokens.audio.sfx`.
 */
import { Audio } from "@remotion/media";
import React from "react";
import { Sequence, staticFile } from "remotion";
import { useMotor } from "../tema/Motor";

export const Sonido: React.FC = () => {
  const { timeline: tl, tokens } = useMotor();
  const nivel = tokens.audio.sfx === "marcados" ? 1 : tokens.audio.sfx === "ninguno" ? 0 : 0.55;
  if (nivel <= 0) return null;
  const whoosh = staticFile("motor/sfx/whoosh.wav");
  const pop = staticFile("motor/sfx/pop.wav");
  const dur = Math.round(tl.fps);
  return (
    <>
      {tl.capitulos.map((c, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, c.desde - 4)} durationInFrames={dur} name="Whoosh" layout="none">
          <Audio src={whoosh} volume={() => 0.6 * nivel} />
        </Sequence>
      ))}
      {tl.outro ? (
        <Sequence from={Math.max(0, tl.outro.desde - 12)} durationInFrames={dur} name="Whoosh outro" layout="none">
          <Audio src={whoosh} volume={() => 0.7 * nivel} />
        </Sequence>
      ) : null}
      {tl.eventos
        .filter((e) => e.tipo === "panel" || e.tipo === "pop")
        .map((e, i) => (
          <Sequence key={`p${i}`} from={e.desde} durationInFrames={Math.round(tl.fps / 4)} name="Pop" layout="none">
            <Audio src={pop} volume={() => 0.25 * nivel} />
          </Sequence>
        ))}
    </>
  );
};
