/**
 * Pila de capas del MODO ESCENARIO (§7):
 *
 *   lienzo → caja de diapositiva (registro + contenido) → caja del ponente → gesto3d → ilustraciones →
 *   bocadillos y reacciones → subtítulos → HUD (fichas o barra) → apertura/cierre de marca u outro → grano
 *
 * La voz va en su propia pista (TramosAudio): los vídeos del ponente están mudos y la caja se puede desmontar
 * mientras la apertura o el cierre de marca la tapan (menos decodificación en Lambda).
 *
 * §8 Narración: en lugar de la caja del ponente, la CAJA DE VOZ (show/CajaVoz); la voz es la locución
 * (`media.audio`) y no se monta ningún vídeo. Bocadillos y reacciones se anclan a la caja de voz en `voz` y a la
 * esquina inferior derecha de la diapositiva en `completa`.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { EventoGesto3D } from "../datos/contrato";
import { CapaIlustraciones } from "../capas/Capas3D";
import { Grano } from "../capas/Grano";
import { Hud } from "../capas/Hud";
import { MarcaDepuracion } from "../capas/MarcaDepuracion";
import { PistaAudio } from "../capas/Musica";
import { Sonido } from "../capas/Sonido";
import { Subtitulos } from "../capas/Subtitulos";
import { Locucion, TramosAudio } from "../capas/Tramos";
import type { CajaGeo } from "../lib/escenario";
import { camaraCaja, diapoEn, estadoEscenario } from "../lib/escenario";
import { acentoDe, capituloEn } from "../lib/linea";
import { CapaOutro } from "../paneles/Rotulos";
import { ConTema, useMotor } from "../tema/Motor";
import { Gesto3D } from "../tres/Gesto3D";
import { CajaPonente } from "./CajaPonente";
import { CajaVoz } from "./CajaVoz";
import { ContenidoDiapo } from "./Diapositivas";
import { HudFichas } from "./Fichas";
import { IntroMarca, OutroMarca } from "./Marca";
import type { CajaDe } from "./Reacciones";
import { CapaBocadillos, CapaReacciones } from "./Reacciones";
import { FondoRegistro, Lienzo } from "./Registros";

const LienzoMemo = React.memo(Lienzo);

/** Estado del escenario en un fotograma cualquiera (para las cámaras de gestos, reacciones y bocadillos). */
const useEstadoEn = () => {
  const m = useMotor();
  const { fps } = useVideoConfig();
  return (f: number) => estadoEscenario(m.esc.pista, f, m.lienzo, m.tema.show.escenario.radio, fps);
};

/** Cabecera editorial: acrónimo de las siglas de capítulo (T.R.A.M.A.) o nº de capítulo, y su título. */
const useCabecera = (f: number) => {
  const { timeline: tl } = useMotor();
  const cap = capituloEn(tl, f);
  const siglas = tl.capitulos.map((c) => c.sigla).filter((s): s is string => !!s);
  const acronimo = siglas.length >= 2 ? `${siglas.join(".")}.` : "";
  return { sigla: acronimo || (cap ? String(cap.n).padStart(2, "0") : ""), descripcion: cap?.titulo ?? tl.intro?.titulo };
};

const CajaDiapo: React.FC<{ geo: CajaGeo }> = ({ geo }) => {
  const m = useMotor();
  const f = useCurrentFrame();
  const cab = useCabecera(f);
  if (geo.o <= 0.002 || geo.w < 2 || geo.h < 2) return null;
  const { actual, siguiente, kSig } = diapoEn(m.esc.diapos, f);
  const e = m.tema.show.escenario;
  const sinSombra = m.opciones.perfil.has("sin-sombras");
  const fondo = (d: NonNullable<typeof actual>) => (
    <ConTema tema={m.temas[d.registro]}>
      <FondoRegistro registro={d.registro} w={geo.w} h={geo.h} sigla={cab.sigla} descripcion={cab.descripcion} barrido={d.clase === "rotulo" ? d.desde : undefined} />
    </ConTema>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: geo.x,
        top: geo.y,
        width: geo.w,
        height: geo.h,
        borderRadius: geo.r,
        overflow: "hidden",
        opacity: geo.o,
        boxShadow: sinSombra || geo.r < 1 ? undefined : e.sombra,
        background: m.tema.show.rayos.c2,
      }}
    >
      {actual ? fondo(actual) : null}
      {siguiente && kSig > 0 ? <div style={{ position: "absolute", inset: 0, opacity: kSig }}>{fondo(siguiente)}</div> : null}
      {m.opciones.perfil.has("sin-paneles")
        ? null
        : m.esc.diapos.map((d) => (
            <Sequence key={d.id} from={d.desde} durationInFrames={Math.max(1, d.hasta - d.desde)} name={`Diapositiva ${d.id} (${d.registro})`} layout="none">
              <ConTema tema={m.temas[d.registro]}>
                <ContenidoDiapo d={d} w={geo.w} h={geo.h} />
              </ConTema>
            </Sequence>
          ))}
    </div>
  );
};

/** gesto3d dentro de la caja del ponente: anclado a sus manos, con un lienzo 3D del tamaño de la caja (+ margen). */
const GestoEscenario: React.FC<{ ev: EventoGesto3D }> = ({ ev }) => {
  const m = useMotor();
  const estadoEn = useEstadoEn();
  const medio = Math.round((ev.desde + ev.hasta) / 2);
  const g = estadoEn(medio).geo.ponente;
  const mx = g.w * 0.2;
  const my = g.h * 0.16;
  const x = Math.max(0, g.x - mx);
  const y = Math.max(0, g.y - my);
  const zona = { x, y, w: Math.min(m.lienzo.ancho, g.x + g.w + mx) - x, h: Math.min(m.lienzo.alto, g.y + g.h + my) - y };
  const camaraDe = (f: number) => {
    const e = estadoEn(f);
    return camaraCaja(m.timeline, f, e.geo.ponente, e.geo.aj, !m.recorte);
  };
  return <Gesto3D ev={ev} acento={m.tema.acentoCap(acentoDe(m.timeline, ev.desde))} camaraDe={camaraDe} zona={zona} />;
};

export const CapasEscenario: React.FC = () => {
  const m = useMotor();
  const { tema, lienzo, timeline: tl, esc, opciones, medios, recorte, narracion } = m;
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const estadoEn = useEstadoEn();
  const est = estadoEn(f);
  const intro = tl.intro;
  const outro = tl.outro;
  // Mientras la apertura o el cierre de marca tapan del todo el escenario, no se pinta (ni se decodifica) debajo.
  const tapaIntro = esc.introMarca && intro && f >= intro.desde + 2 && f < intro.hasta - Math.round(0.6 * fps);
  const tapaOutro = esc.outroMarca && outro && f >= outro.desde + Math.round(0.45 * fps);
  const tapado = !!(tapaIntro || tapaOutro);
  const cajaDe: CajaDe = (x) => {
    const e = estadoEn(x);
    const g = e.geo.ponente;
    if (narracion) {
      // Caja de voz (voz) o, si está oculta (completa), un recuadro en la esquina inferior derecha de la diapositiva.
      if (g.o >= 0.3) return { x: g.x, y: g.y, w: g.w, h: g.h, nariz: [g.x + g.w / 2, g.y + g.h * 0.42] };
      const d = e.geo.diapo;
      const w = d.w * 0.26;
      const h = d.h * 0.42;
      const r = { x: d.x + d.w - w - d.w * 0.025, y: d.y + d.h - h - d.h * 0.045, w, h };
      // «Nariz» baja: el bocadillo queda en la esquina, por debajo de las reacciones (arriba del recuadro).
      return { ...r, nariz: [r.x + w * 0.62, r.y + h * 0.75] };
    }
    if (g.o < 0.3) return null;
    const cam = camaraCaja(tl, x, g, e.geo.aj, !recorte);
    return { x: g.x, y: g.y, w: g.w, h: g.h, nariz: [cam.ox + cam.nariz[0] * cam.S, cam.oy + cam.nariz[1] * cam.S] };
  };
  return (
    <AbsoluteFill style={{ background: tema.show.escenario.lienzo, overflow: "hidden", fontFamily: tema.f.cuerpo }}>
      <LienzoMemo />
      {tapado ? null : (
        <>
          <CajaDiapo geo={est.geo.diapo} />
          {narracion ? <CajaVoz geo={est.geo.ponente} /> : <CajaPonente geo={est.geo.ponente} aj={est.geo.aj} />}
          {tl.eventos.map((ev, i) =>
            ev.tipo === "gesto3d" ? (
              <Sequence key={ev.id ?? `g${i}`} from={ev.desde} durationInFrames={Math.max(1, ev.hasta - ev.desde)} name={`Gesto 3D ${ev.objeto}`} layout="none">
                <GestoEscenario ev={ev} />
              </Sequence>
            ) : null,
          )}
        </>
      )}
      <CapaIlustraciones />
      {tapado ? null : (
        <>
          <CapaBocadillos cajaDe={cajaDe} />
          <CapaReacciones cajaDe={cajaDe} />
        </>
      )}
      {opciones.subtitulos && !tapado ? <Subtitulos /> : null}
      {opciones.hud ? tema.show.hud === "fichas" ? <HudFichas cx={lienzo.ancho / 2} y={est.geo.fichas.y} tam={est.geo.fichas.tam} /> : <Hud /> : null}
      {esc.introMarca && intro ? (
        <Sequence from={intro.desde} durationInFrames={Math.max(1, intro.hasta - intro.desde)} name="Apertura de marca" layout="none">
          <IntroMarca intro={intro} />
        </Sequence>
      ) : null}
      {esc.outroMarca && outro ? (
        <Sequence from={outro.desde} durationInFrames={Math.max(1, outro.hasta - outro.desde)} name="Cierre de marca" layout="none">
          <OutroMarca outro={outro} />
        </Sequence>
      ) : (
        <CapaOutro />
      )}
      {opciones.grano ? <Grano /> : null}
      {narracion ? (
        medios.audio ? <Locucion src={medios.audio} /> : null
      ) : medios.audio ?? medios.mezzanine ? (
        <TramosAudio src={(medios.audio ?? medios.mezzanine)!} />
      ) : null}
      <PistaAudio />
      {opciones.sonido && !tl.audio?.sfx?.length ? <Sonido /> : null}
      {opciones.marca ? <MarcaDepuracion /> : null}
    </AbsoluteFill>
  );
};
