import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { BloquesDiagonales, Intro, Outro, TarjetaCapitulo, TransicionLosetas } from "./componentes/Bloques";
import { Ponente } from "./componentes/Ponente";
import { BarraProgreso, RotuloInferior } from "./componentes/Rotulos";
import { Sonido } from "./componentes/Sonido";
import { Subtitulos } from "./componentes/Subtitulos";
import { CAPITULOS, CURSO, ENFASIS, GRAFICOS } from "./datos/montaje";
import type { VideocursoProps } from "./datos/tipos";
import { CapaGraficos, FondoMarca } from "./graficos/CapaGraficos";
import { bloquesDisposicion } from "./lib/encuadre";
import {
  BLOQUES_FR,
  colocarEnfasis,
  colocarGraficos,
  construirLineaTiempo,
  INTRO_FR,
  LOSETAS_FR,
  OUTRO_FR,
  TARJETA_FR,
} from "./lib/linea-tiempo";
import { COLOR, FONT } from "./tema";

export const lineaTiempo = construirLineaTiempo(CAPITULOS);

export const Videocurso: React.FC<VideocursoProps> = ({ videoSrc, subtitulos, mostrarSubtitulos }) => {
  const lt = lineaTiempo;
  const graficos = useMemo(() => colocarGraficos(lt, GRAFICOS), [lt]);
  const bloques = useMemo(() => bloquesDisposicion(graficos), [graficos]);
  const enfasis = useMemo(() => colocarEnfasis(lt, ENFASIS), [lt]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg, fontFamily: FONT }}>
      <FondoMarca />
      <Ponente tomas={lt.tomas} videoSrc={videoSrc} bloques={bloques} enfasis={enfasis} />
      <CapaGraficos graficos={graficos} lt={lt} bloques={bloques} />

      {/* Rótulos inferiores genéricos al empezar cada capítulo (sin nombres propios). */}
      {lt.capitulos.map((c) => (
        <Sequence key={`ri-${c.cap.id}`} from={c.desde + 20} durationInFrames={105} layout="none" name="Rótulo inferior">
          <RotuloInferior
            kicker={c.indice === 0 ? CURSO.rotuloDocente : `Capítulo ${String(c.cap.numero).padStart(2, "0")}`}
            titulo={c.indice === 0 ? CURSO.rotuloTema : c.cap.titulo}
            durFr={105}
          />
        </Sequence>
      ))}

      {mostrarSubtitulos ? <Subtitulos palabras={subtitulos} lt={lt} bloques={bloques} /> : null}
      <BarraProgreso lt={lt} />

      <Sequence  durationInFrames={INTRO_FR} name="Intro">
        <Intro
          kicker={CURSO.kicker}
          titulo1={CURSO.titulo1}
          titulo2={CURSO.titulo2}
          subtitulo={CURSO.subtitulo}
          fantasma={CURSO.fantasma}
        />
      </Sequence>

      {lt.capitulos.map((c) => (
        <React.Fragment key={c.cap.id}>
          {c.indice > 0 ? (
            <Sequence from={c.tarjetaDesde - 20} durationInFrames={LOSETAS_FR} name="Transición 3D">
              <TransicionLosetas durFr={LOSETAS_FR} />
            </Sequence>
          ) : null}
          <Sequence from={c.tarjetaDesde} durationInFrames={TARJETA_FR} name={`Tarjeta ${c.cap.numero}`}>
            <TarjetaCapitulo
              numero={c.cap.numero}
              titulo={c.cap.titulo}
              subtitulo={c.cap.subtitulo}
              durFr={TARJETA_FR}
              entrada={c.indice === 0 ? "push" : "corte"}
            />
          </Sequence>
        </React.Fragment>
      ))}

      <Sequence from={lt.outroDesde} durationInFrames={OUTRO_FR} name="Outro">
        <Outro ideas={CURSO.ideas} lema={CURSO.lema} pie={CURSO.pie} />
      </Sequence>
      <Sequence from={lt.outroDesde - Math.round(BLOQUES_FR / 2)} durationInFrames={BLOQUES_FR} name="Bloques diagonales">
        <BloquesDiagonales />
      </Sequence>

      <Sonido lt={lt} graficos={graficos} />
    </AbsoluteFill>
  );
};
