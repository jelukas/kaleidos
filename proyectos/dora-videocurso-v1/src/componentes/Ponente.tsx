import { Video } from "@remotion/media";
import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { BloqueDisp } from "../lib/encuadre";
import { cabezaX, colocarVideo, disposicionEn, envolventeEnfasis } from "../lib/encuadre";
import type { EnfasisColocado, Toma } from "../lib/linea-tiempo";
import { COLOR, FPS } from "../tema";

export const resolverFuente = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

const PUNCH = 1.1; // alternancia 100 % ↔ 110 % en cada corte

const VideoToma: React.FC<{
  toma: Toma;
  src: string;
  bloques: BloqueDisp[];
  enfasis: EnfasisColocado[];
}> = ({ toma, src, bloques, enfasis }) => {
  const local = useCurrentFrame();
  const f = toma.desde + local;
  const { enc } = disposicionEn(bloques, f);
  const sFuente = toma.in + local / FPS;
  // El punch-in se atenúa en la ventana pequeña (ya va reencuadrada).
  const punch = toma.punch ? 1 + (PUNCH - 1) * (1 - Math.min(1, (1 - enc.escala) * 4)) : 1;
  const zoom = punch * envolventeEnfasis(enfasis, f);
  const v = colocarVideo(enc, zoom, cabezaX(sFuente));

  return (
    <div
      style={{
        position: "absolute",
        left: enc.x,
        top: enc.y,
        width: enc.w,
        height: enc.h,
        overflow: "hidden",
        borderRadius: enc.radio,
        backgroundColor: "#F4F6FA",
        boxShadow:
          enc.borde > 0.01
            ? `0 0 0 ${4 * enc.borde}px ${COLOR.accent}, 0 30px 80px rgba(0,0,0,${0.45 * enc.borde})`
            : undefined,
      }}
    >
      <Video
        src={src}
        trimBefore={Math.round(toma.in * FPS)}
        trimAfter={Math.round(toma.out * FPS)}
        // Sin plan B silencioso: OffthreadVideo descargaría el mezzanine entero (1,14 GB) en cada Lambda.
        disallowFallbackToOffthreadVideo
        // Microfundido de 1 fotograma (40 ms) en cada corte para evitar clics.
        volume={(vf) =>
          interpolate(vf, [0, 1, toma.dur - 1, toma.dur], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
        style={{ position: "absolute", left: v.left, top: v.top, width: v.width, height: v.height }}
      />
    </div>
  );
};

export const Ponente: React.FC<{
  tomas: Toma[];
  videoSrc: string;
  bloques: BloqueDisp[];
  enfasis: EnfasisColocado[];
}> = ({ tomas, videoSrc, bloques, enfasis }) => {
  const src = resolverFuente(videoSrc);
  return (
    <>
      {tomas.map((t) => (
        <Sequence key={t.desde} from={t.desde} durationInFrames={t.dur} premountFor={FPS} name={`Toma ${t.in.toFixed(1)}s`}>
          <VideoToma toma={t} src={src} bloques={bloques} enfasis={enfasis} />
        </Sequence>
      ))}
    </>
  );
};
