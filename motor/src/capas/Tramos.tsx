/**
 * Tramos de la EDL (`timeline.segmentos`): un `<Sequence from={dst}>` por tramo con `@remotion/media`.
 *
 * - `disallowFallbackToOffthreadVideo`: en Lambda cada función pide solo rangos de bytes; si cayera a
 *   OffthreadVideo descargaría el archivo entero en cada función.
 * - `trimBefore` = `src` (segundos de la fuente) en fotogramas de salida.
 * - Microfundido de audio de `fundido` fotogramas (1–3) en cada corte, para evitar chasquidos.
 * - El posicionamiento lo decide el padre (la cámara se calcula fuera, con el fotograma absoluto).
 */
import { Audio, Video } from "@remotion/media";
import React from "react";
import { interpolate, Sequence } from "remotion";
import { useMotor } from "../tema/Motor";

const FUNDIDO = 2;

const volumen = (dur: number, fundido: number) => (vf: number) =>
  interpolate(vf, [0, fundido, Math.max(fundido + 1, dur - fundido), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const TramosVideo: React.FC<{
  src: string;
  nombre: string;
  muted?: boolean;
  style?: React.CSSProperties;
}> = ({ src, nombre, muted = false, style }) => {
  const { timeline: tl } = useMotor();
  const fundido = Math.max(1, Math.min(3, FUNDIDO));
  return (
    <>
      {tl.segmentos.map((s, i) => {
        const inicio = Math.round(s.src * tl.fps);
        return (
          <Sequence
            key={`${nombre}-${i}`}
            from={s.dst}
            durationInFrames={s.dur}
            premountFor={Math.round(tl.fps)}
            name={`${nombre} ${i + 1} (${s.src.toFixed(2)} s)`}
          >
            <Video
              src={src}
              trimBefore={inicio}
              trimAfter={inicio + s.dur}
              muted={muted}
              volume={(vf) => (muted ? 0 : volumen(s.dur, fundido)(vf))}
              disallowFallbackToOffthreadVideo
              objectFit="fill"
              style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", ...style }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

/** Solo el audio (modo con recorte: la plancha y la máscara van mudas). */
export const TramosAudio: React.FC<{ src: string }> = ({ src }) => {
  const { timeline: tl } = useMotor();
  return (
    <>
      {tl.segmentos.map((s, i) => {
        const inicio = Math.round(s.src * tl.fps);
        return (
          <Sequence key={`audio-${i}`} from={s.dst} durationInFrames={s.dur} name={`Voz ${i + 1}`} layout="none">
            <Audio src={src} trimBefore={inicio} trimAfter={inicio + s.dur} volume={(vf) => volumen(s.dur, FUNDIDO)(vf)} />
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * §8 Locución de la narración (`props.media.audio`): sin EDL, entera desde el fotograma 0; con `segmentos`, por
 * tramos como la voz del ponente (`src` = segundo de la locución).
 */
export const Locucion: React.FC<{ src: string }> = ({ src }) => {
  const { timeline: tl } = useMotor();
  if (tl.segmentos.length) return <TramosAudio src={src} />;
  return (
    <Sequence durationInFrames={tl.duracion} name="Locución" layout="none">
      <Audio src={src} />
    </Sequence>
  );
};
