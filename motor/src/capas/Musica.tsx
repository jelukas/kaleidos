/**
 * Pista de audio de `timeline.audio` (§7.3): música con fundidos, bucle y volumen, y efectos en su fotograma.
 * Los archivos son claves de `props.media.extras` (local: archivos del --public-dir; Lambda: URLs prefirmadas
 * del bucket privado). La voz NO va aquí: sigue saliendo del mezzanine o de `media.audio`.
 */
import { Audio } from "@remotion/media";
import React from "react";
import { interpolate, Sequence } from "remotion";
import { useMotor } from "../tema/Motor";

const fundido = (dur: number, entrada: number, salida: number) => (vf: number) => {
  const a = Math.max(0, Math.min(entrada, dur / 2));
  const b = Math.max(0, Math.min(salida, dur / 2));
  const kin = a > 0 ? interpolate(vf, [0, a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const kout = b > 0 ? interpolate(vf, [dur - b, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return Math.min(kin, kout);
};

export const PistaAudio: React.FC = () => {
  const { timeline: tl, medios } = useMotor();
  const a = tl.audio;
  if (!a) return null;
  const src = (clave: string, que: string) => {
    const s = medios.extras[clave];
    // Sin el archivo no se sigue en silencio: el render perdería audio sin avisar.
    if (!s) throw new Error(`audio: falta media.extras «${clave}» (${que}) en las props`);
    return s;
  };
  return (
    <>
      {a.musica.map((m, i) => {
        const dur = Math.max(1, m.hasta - m.desde);
        const vol = fundido(dur, m.fundidoEntrada, m.fundidoSalida);
        return (
          <Sequence key={`m${i}`} from={m.desde} durationInFrames={dur} name={`Música ${m.archivo}`} layout="none">
            <Audio
              src={src(m.archivo, "música")}
              loop={m.bucle}
              loopVolumeCurveBehavior="extend"
              trimBefore={m.inicio ? Math.round(m.inicio * tl.fps) : undefined}
              volume={(vf) => m.volumen * vol(vf)}
            />
          </Sequence>
        );
      })}
      {a.sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={s.en} durationInFrames={s.dur ?? Math.round(tl.fps * 2)} name={`Efecto ${s.archivo}`} layout="none">
          <Audio src={src(s.archivo, "efecto")} volume={() => s.volumen} />
        </Sequence>
      ))}
    </>
  );
};
