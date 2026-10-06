import React from "react";
import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { cargarDatos } from "./datos/cargar";
import type { PropsMotor } from "./datos/contrato";
import { propsSchema } from "./datos/contrato";
import { Horizontal, Vertical } from "./Programa";

/** Props por defecto: el fixture de desarrollo servido con --public-dir (ver scripts/stills.mjs). */
const porDefecto: PropsMotor = {
  timelineSrc: "timeline.json",
  estilo: "curso-azul",
  media: { mezzanine: "mezzanine.mp4", plancha: "plancha.mp4", mascara: "mascara.mp4", extras: {} },
};

/**
 * Duración, fps y tamaño salen de timeline.json (y se valida también tokens.json). Solo devuelve metadatos:
 * la línea de tiempo NO viaja como props resueltas (en Lambda acabarían en el bucket público de Remotion).
 */
const metadatos =
  (orientacion: "horizontal" | "vertical"): CalculateMetadataFunction<PropsMotor> =>
  async ({ props, abortSignal }) => {
    const { timeline } = await cargarDatos(props, abortSignal);
    return {
      durationInFrames: timeline.duracion,
      fps: timeline.fps,
      width: orientacion === "horizontal" ? timeline.ancho : 1080,
      height: orientacion === "horizontal" ? timeline.alto : 1920,
    };
  };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Horizontal"
      component={Horizontal}
      schema={propsSchema}
      defaultProps={porDefecto}
      calculateMetadata={metadatos("horizontal")}
      durationInFrames={1}
      fps={25}
      width={1920}
      height={1080}
    />
    <Composition
      id="Vertical"
      component={Vertical}
      schema={propsSchema}
      defaultProps={porDefecto}
      calculateMetadata={metadatos("vertical")}
      durationInFrames={1}
      fps={25}
      width={1080}
      height={1920}
    />
  </>
);
