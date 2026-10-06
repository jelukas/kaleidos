import { Audio } from "@remotion/media";
import React from "react";
import { interpolate, Sequence, staticFile } from "remotion";
import type { GraficoColocado, LineaTiempo } from "../lib/linea-tiempo";
import { BLOQUES_FR, INTRO_FR, OUTRO_FR } from "../lib/linea-tiempo";
import { FPS } from "../tema";

// Música y efectos sintetizados con ffmpeg (scripts/generar-sonido.sh): sin licencias de terceros.
// Niveles pensados para no tapar la voz (-16 LUFS): pad a -22 LUFS solo en intro y cierre, efectos discretos.
export const Sonido: React.FC<{ lt: LineaTiempo; graficos: GraficoColocado[] }> = ({ lt, graficos }) => (
  <>
    <Sequence  durationInFrames={INTRO_FR + 10} name="Pad intro" layout="none">
      <Audio
        src={staticFile("audio/pad_intro.wav")}
        volume={(f) => interpolate(f, [INTRO_FR - 20, INTRO_FR + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
    <Sequence from={lt.outroDesde - 10} durationInFrames={OUTRO_FR + 10} name="Pad cierre" layout="none">
      <Audio src={staticFile("audio/pad_outro.wav")} />
    </Sequence>

    {/* Whoosh en cada transición de capítulo y en la entrada al cierre. */}
    {lt.capitulos.map((c) => (
      <Sequence
        key={c.cap.id}
        from={c.indice === 0 ? c.tarjetaDesde - 8 : c.tarjetaDesde - 20}
        durationInFrames={Math.round(0.9 * FPS)}
        name="Whoosh"
        layout="none"
      >
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.7} />
      </Sequence>
    ))}
    <Sequence from={lt.outroDesde - Math.round(BLOQUES_FR / 2)} durationInFrames={Math.round(0.9 * FPS)} name="Whoosh" layout="none">
      <Audio src={staticFile("audio/whoosh.wav")} volume={0.7} />
    </Sequence>

    {/* "Pop" muy discreto al entrar cada gráfico (bajo la voz). */}
    {graficos.map((g, i) => (
      <Sequence key={i} from={g.desde} durationInFrames={4} name="Pop" layout="none">
        <Audio src={staticFile("audio/pop.wav")} volume={0.22} />
      </Sequence>
    ))}
  </>
);
