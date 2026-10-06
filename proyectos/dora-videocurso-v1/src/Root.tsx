import { Composition } from "remotion";
import { videocursoSchema } from "./datos/tipos";
import { cargarFuentes, FPS } from "./tema";
import { lineaTiempo, Videocurso } from "./Videocurso";

cargarFuentes();

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Videocurso"
      component={Videocurso}
      schema={videocursoSchema}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={lineaTiempo.total}
      defaultProps={{
        // En local: archivo servido con --public-dir=media-public. En Lambda: URL prefirmada de S3.
        videoSrc: "mezzanine.mp4",
        subtitulos: [],
        mostrarSubtitulos: true,
      }}
    />
  );
};
