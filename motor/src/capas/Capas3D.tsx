/**
 * Capas 3D: DETRÁS del ponente (con recorte, dentro del grupo aislado: se multiplica por 1 − α) y DELANTE.
 * - Detrás (con recorte): los lienzos de `escena3d` (el ponente los tapa si se cruzan: profundidad real).
 * - Delante: `gesto3d` (entre las manos) y, si la intro no tiene vídeo, su objeto grande.
 * - Ilustraciones 2,5D a pantalla completa (tapan al ponente; la voz sigue).
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { acentoDe, hayVideo } from "../lib/linea";
import { useMotor } from "../tema/Motor";
import { Escena3DLienzo } from "../paneles/CapaPaneles";
import { IntroObjetoGrande } from "../paneles/Rotulos";
import { useEntradaSalida } from "../paneles/Transicion";
import type { EventoIlustracion } from "../datos/contrato";
import { Gesto3D } from "../tres/Gesto3D";
import { Ilustracion } from "../tres/Ilustracion";

export const Capa3DDetras: React.FC = () => {
  const { timeline, recorte } = useMotor();
  if (!recorte) return null;
  return (
    <>
      {timeline.eventos.map((ev, i) =>
        ev.tipo === "escena3d" ? (
          <Sequence key={ev.id ?? i} from={ev.desde} durationInFrames={Math.max(1, ev.hasta - ev.desde)} name={`3D detrás ${ev.objeto}`} layout="none">
            <Escena3DLienzo ev={ev} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

export const Capa3DDelante: React.FC = () => {
  const { timeline, tema } = useMotor();
  const intro = timeline.intro;
  const introSinVideo = intro ? !hayVideo(timeline, intro.desde + Math.round((intro.hasta - intro.desde) / 2)) : false;
  return (
    <>
      {introSinVideo ? <IntroObjetoGrande /> : null}
      {timeline.eventos.map((ev, i) =>
        ev.tipo === "gesto3d" ? (
          <Sequence key={ev.id ?? i} from={ev.desde} durationInFrames={Math.max(1, ev.hasta - ev.desde)} name={`Gesto 3D ${ev.objeto}`} layout="none">
            <Gesto3D ev={ev} acento={tema.acentoCap(acentoDe(timeline, ev.desde))} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

const IlustracionEvento: React.FC<{ ev: EventoIlustracion }> = ({ ev }) => {
  const { medios, lienzo, tema, timeline } = useMotor();
  const dur = ev.hasta - ev.desde;
  const { k } = useEntradaSalida(dur);
  const img = medios.extras[ev.imagen];
  const prof = medios.extras[ev.profundidad];
  if (!img || !prof) throw new Error(`ilustración ${ev.id ?? ""}: faltan media.extras «${ev.imagen}» o «${ev.profundidad}» en las props`);
  return (
    <AbsoluteFill style={{ opacity: k, background: tema.c.fondo }}>
      <Ilustracion
        imagen={img}
        profundidad={prof}
        ancho={lienzo.ancho}
        alto={lienzo.alto}
        dur={dur}
        camara={ev.camara}
        anclas={ev.anclas.map((a) => ({ ...a, en: a.en !== undefined ? a.en - ev.desde : undefined }))}
        acento={tema.acentoCap(acentoDe(timeline, ev.desde))}
      />
    </AbsoluteFill>
  );
};

export const CapaIlustraciones: React.FC = () => {
  const { timeline } = useMotor();
  return (
    <>
      {timeline.eventos.map((ev, i) =>
        ev.tipo === "ilustracion" ? (
          <Sequence key={ev.id ?? i} from={ev.desde} durationInFrames={Math.max(1, ev.hasta - ev.desde)} name={`Ilustración ${ev.id ?? i}`} layout="none">
            <IlustracionEvento ev={ev} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};
