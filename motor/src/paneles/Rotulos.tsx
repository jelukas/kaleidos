/**
 * Rótulo de capítulo, intro y outro.
 * - Rótulo e intro van con el plano `card`: ponente a la derecha, texto a la izquierda. Con vídeo, el objeto 3D
 *   va como insignia sobre el título (detrás del ponente quedaba casi oculto); sin vídeo, grande a la derecha.
 * - El outro es una tarjeta a pantalla completa que entra con la cortinilla del estilo.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { Capitulo, Intro as TIntro, Outro as TOutro } from "../datos/contrato";
import { Fondo } from "../capas/Fondo";
import { hayVideo } from "../lib/linea";
import { ease, tween } from "../tema/anim";
import { useMotor, useTema } from "../tema/Motor";
import { Objeto3D } from "../tres/catalogo";
import { Escenario, SombraContacto } from "../tres/Escenario";
import { tamPorLargo } from "./Base";
import { Cortinilla, estiloTransicion, useEntradaSalida } from "./Transicion";

/** Objeto 3D suelto en un lienzo propio (insignias, objetos grandes). */
export const Objeto3DSuelto: React.FC<{
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  acento: string;
  aparece?: number;
  dist?: number;
  opacidad?: number;
  sombra?: boolean;
}> = ({ nombre, x, y, w, h, acento, aparece = 0.2, dist = 7.4, opacidad = 1, sombra = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: opacidad }}>
      <Escenario width={w} height={h} camara={{ pos: [0, 0.5, dist], mira: [0, -0.05, 0] }}>
        <Objeto3D nombre={nombre} t={f / fps} aparece={aparece} acento={acento} />
        {sombra ? <SombraContacto y={-1.75} radio={2.1} opacidad={0.3} /> : null}
      </Escenario>
    </div>
  );
};

/** Columna de texto de rótulos, intro y outro: izquierda en horizontal; mitad inferior en vertical. */
const useColumna = (ancho = 860): React.CSSProperties => {
  const { lienzo } = useMotor();
  return lienzo.vertical
    ? { position: "absolute", left: 80, right: 80, top: 1020, bottom: 220, display: "flex", flexDirection: "column", justifyContent: "center" }
    : { position: "absolute", left: 130, top: 0, bottom: 0, width: ancho, display: "flex", flexDirection: "column", justifyContent: "center" };
};

const Barra: React.FC<{ acento: string; k: number; ancho?: number }> = ({ acento, k, ancho = 110 }) => (
  <div style={{ width: ancho, height: 8, borderRadius: 4, background: acento, transformOrigin: "left", transform: `scaleX(${k})`, margin: "26px 0 30px" }} />
);

// ——— Rótulo de capítulo ———

const RotuloCapitulo: React.FC<{ c: Capitulo; conObjeto: boolean }> = ({ c, conObjeto }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const dur = c.rotuloHasta - c.desde;
  const { k } = useEntradaSalida(dur);
  const acento = tema.acentoCap(c.acento);
  const col = tema.acentoTexto(acento);
  const e = tema.mov.ease;
  const num = String(c.n).padStart(2, "0");
  const t1 = tween(f, 2, tema.mov.durEntrada, 0, 1, e);
  const t2 = tween(f, 6, tema.mov.durEntrada + 4, 0, 1, e);
  const t3 = tween(f, 12, tema.mov.durEntrada, 0, 1, e);
  const columna = useColumna(820);
  return (
    <AbsoluteFill style={{ ...estiloTransicion(tema.mov.transicion, k, "izq") }}>
      <div style={columna}>
        {conObjeto && c.objeto3d ? <Objeto3DSuelto nombre={c.objeto3d} x={-40} y={40} w={300} h={300} acento={acento} dist={8} sombra={false} /> : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{ ...tema.t.titular, fontSize: 150, lineHeight: 0.9, color: col, opacity: t1, transform: `translateY(${(1 - t1) * 40}px)` }}>{num}</div>
          <div style={{ ...tema.t.etiqueta, fontSize: 26, color: tema.c.textoSuave, opacity: t1 }}>{c.kicker ?? `Capítulo ${c.n}`}</div>
        </div>
        <Barra acento={acento} k={t1} />
        <div style={{ overflow: "hidden", paddingBottom: 8 }}>
          <div
            style={{
              ...tema.t.titular,
              fontSize: tamPorLargo(c.titulo, 84, 24),
              lineHeight: tema.t.titular.lineHeight ?? 1.06,
              color: tema.c.texto,
              textWrap: "balance",
              transform: `translateY(${(1 - t2) * 105}%)`,
            }}
          >
            {c.titulo}
          </div>
        </div>
        {c.subtitulo ? (
          <div style={{ ...tema.t.cuerpo, marginTop: 20, fontSize: 36, lineHeight: 1.3, color: tema.c.textoSuave, textWrap: "balance", opacity: t3, transform: `translateY(${(1 - t3) * 20}px)` }}>
            {c.subtitulo}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ——— Intro ———

const IntroTexto: React.FC<{ intro: TIntro; insignia: boolean; acento: string }> = ({ intro, insignia, acento }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const dur = intro.hasta - intro.desde;
  const { k } = useEntradaSalida(dur, 0);
  const e = tema.mov.ease;
  const t0 = tween(f, 4, tema.mov.durEntrada, 0, 1, e);
  const t1 = tween(f, 10, tema.mov.durEntrada + 6, 0, 1, ease.expoOut);
  const t2 = tween(f, 22, tema.mov.durEntrada, 0, 1, e);
  const col = tema.acentoTexto(acento);
  const columna = useColumna(860);
  return (
    <AbsoluteFill style={{ ...estiloTransicion(tema.mov.transicion, k, "izq") }}>
      <div style={columna}>
        {insignia && intro.objeto3d ? <Objeto3DSuelto nombre={intro.objeto3d} x={-30} y={60} w={280} h={280} acento={acento} dist={8} sombra={false} /> : null}
        {intro.kicker ? (
          <div style={{ ...tema.t.etiqueta, fontSize: 28, color: col, opacity: t0, transform: `translateX(${(1 - t0) * -40}px)` }}>{intro.kicker}</div>
        ) : null}
        <Barra acento={acento} k={t0} ancho={130} />
        <div style={{ overflow: "hidden", paddingBottom: 10 }}>
          <div
            style={{
              ...tema.t.titular,
              fontSize: tamPorLargo(intro.titulo, 124, 18),
              lineHeight: tema.t.titular.lineHeight ?? 1.02,
              color: tema.c.texto,
              textWrap: "balance",
              transform: `translateY(${(1 - t1) * 105}%)`,
            }}
          >
            {intro.titulo}
          </div>
        </div>
        {intro.subtitulo ? (
          <div style={{ ...tema.t.cuerpo, maxWidth: 820, marginTop: 30, fontSize: 40, lineHeight: 1.3, color: tema.c.textoSuave, textWrap: "balance", opacity: t2, transform: `translateY(${(1 - t2) * 26}px)` }}>
            {intro.subtitulo}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Objeto grande de la intro (solo si la intro no tiene vídeo debajo). */
export const IntroObjetoGrande: React.FC = () => {
  const { timeline, tema, lienzo } = useMotor();
  const intro = timeline.intro;
  if (!intro?.objeto3d || lienzo.vertical) return null;
  const dur = intro.hasta - intro.desde;
  return (
    <Sequence from={intro.desde} durationInFrames={dur} name="Intro · objeto 3D" layout="none">
      <IntroObjetoGrandeInterno nombre={intro.objeto3d} dur={dur} acento={tema.acentoCap(timeline.capitulos[0]?.acento ?? 0)} />
    </Sequence>
  );
};

const IntroObjetoGrandeInterno: React.FC<{ nombre: string; dur: number; acento: string }> = ({ nombre, dur, acento }) => {
  const { k } = useEntradaSalida(dur);
  return <Objeto3DSuelto nombre={nombre} x={980} y={60} w={920} h={960} acento={acento} dist={6.6} opacidad={k} />;
};

// ——— Outro ———

const OutroTarjeta: React.FC<{ outro: TOutro; acento: string }> = ({ outro, acento }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const dur = outro.hasta - outro.desde;
  const e = tema.mov.ease;
  const col = tema.acentoTexto(acento);
  const fin = tween(f, dur - 12, 12, 1, 0, ease.power2InOut);
  const t0 = tween(f, 6, tema.mov.durEntrada, 0, 1, e);
  const t1 = tween(f, 10, tema.mov.durEntrada + 4, 0, 1, e);
  const n = outro.puntos.length;
  const cta = tween(f, 18 + n * 8, tema.mov.durEntrada, 0, 1, tema.mov.rebote);
  const { lienzo } = useMotor();
  const columna = useColumna(900);
  return (
    <AbsoluteFill>
      <Fondo acento={acento} />
      <AbsoluteFill style={{ opacity: fin }}>
        {outro.objeto3d ? (
          lienzo.vertical ? (
            <Objeto3DSuelto nombre={outro.objeto3d} x={140} y={120} w={800} h={820} acento={acento} dist={6.8} aparece={0.3} />
          ) : (
            <Objeto3DSuelto nombre={outro.objeto3d} x={1080} y={80} w={780} h={900} acento={acento} dist={6.8} aparece={0.3} />
          )
        ) : null}
        <div style={columna}>
          <div style={{ ...tema.t.etiqueta, fontSize: 28, color: col, opacity: t0 }}>{outro.kicker ?? "En resumen"}</div>
          <Barra acento={acento} k={t0} />
          {outro.titulo ? (
            <div
              style={{
                ...tema.t.titular,
                fontSize: tamPorLargo(outro.titulo, 76, 26),
                lineHeight: tema.t.titular.lineHeight ?? 1.06,
                color: tema.c.texto,
                textWrap: "balance",
                marginBottom: 36,
                opacity: t1,
                transform: `translateY(${(1 - t1) * 30}px)`,
              }}
            >
              {outro.titulo}
            </div>
          ) : null}
          {outro.puntos.map((p, i) => {
            const k = tween(f, 16 + i * 8, tema.mov.durEntrada, 0, 1, e);
            return (
              <div
                key={i}
                style={{ display: "flex", gap: 22, alignItems: "baseline", marginBottom: 22, opacity: k, transform: `translateX(${(1 - k) * -36}px)` }}
              >
                <span style={{ ...tema.t.titular, fontSize: 40, color: col, minWidth: 58 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ ...tema.t.cuerpo, fontWeight: tema.pesoFuerte, fontSize: tamPorLargo(p, 40, 44), lineHeight: 1.25, color: tema.c.texto }}>{p}</span>
              </div>
            );
          })}
          {outro.cta ? (
            <div style={{ marginTop: 26, alignSelf: "flex-start", transform: `scale(${cta})`, transformOrigin: "left center", opacity: Math.min(1, cta * 1.4) }}>
              <div
                style={{
                  ...tema.t.etiqueta,
                  fontSize: 26,
                  padding: "16px 30px",
                  borderRadius: tema.forma.radioPildora,
                  background: acento,
                  color: tema.sobre(acento),
                  border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : undefined,
                  boxShadow: tema.estiloPanel === "tinta" ? `6px 6px 0 ${tema.c.tinta}` : undefined,
                }}
              >
                {outro.cta}
              </div>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CORTINILLA = 30;

/** Rótulos de capítulo e intro (capa de paneles). */
export const CapaRotulos: React.FC = () => {
  const { timeline, tema, lienzo } = useMotor();
  const intro = timeline.intro;
  const introConVideo = intro ? hayVideo(timeline, intro.desde + Math.round((intro.hasta - intro.desde) / 2)) : false;
  return (
    <>
      {intro ? (
        <Sequence from={intro.desde} durationInFrames={Math.max(1, intro.hasta - intro.desde)} name="Intro" layout="none">
          <IntroTexto intro={intro} insignia={introConVideo && !lienzo.vertical} acento={tema.acentoCap(timeline.capitulos[0]?.acento ?? 0)} />
        </Sequence>
      ) : null}
      {intro && !introConVideo ? (
        <Sequence from={intro.hasta - CORTINILLA / 2} durationInFrames={CORTINILLA} name="Cortinilla intro" layout="none">
          <Cortinilla dur={CORTINILLA} acento={tema.acentoCap(0)} />
        </Sequence>
      ) : null}
      {timeline.capitulos.map((c, i) => (
        <Sequence key={`rot-${i}`} from={c.desde} durationInFrames={Math.max(1, c.rotuloHasta - c.desde)} name={`Rótulo ${c.n}`} layout="none">
          <RotuloCapitulo c={c} conObjeto={!lienzo.vertical} />
        </Sequence>
      ))}
    </>
  );
};

/** Outro a pantalla completa con su cortinilla (por encima de todo salvo el grano). */
export const CapaOutro: React.FC = () => {
  const { timeline, tema } = useMotor();
  const o = timeline.outro;
  if (!o) return null;
  const acento = tema.acentoCap(timeline.capitulos.at(-1)?.acento ?? 0);
  return (
    <>
      <Sequence from={o.desde} durationInFrames={Math.max(1, o.hasta - o.desde)} name="Outro" layout="none">
        <OutroTarjeta outro={o} acento={acento} />
      </Sequence>
      <Sequence from={Math.max(0, o.desde - CORTINILLA / 2)} durationInFrames={CORTINILLA} name="Cortinilla outro" layout="none">
        <Cortinilla dur={CORTINILLA} acento={acento} />
      </Sequence>
    </>
  );
};
