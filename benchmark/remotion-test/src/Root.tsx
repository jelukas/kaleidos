import { Composition } from "remotion";
import { IntroCurso } from "./IntroCurso";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="IntroCurso"
      component={IntroCurso}
      fps={30}
      durationInFrames={900}
      width={1920}
      height={1080}
    />
  );
};
