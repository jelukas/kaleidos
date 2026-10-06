/**
 * Contexto del motor: datos (timeline + tokens), tema, lienzo, medios resueltos y disposición del ponente.
 * `ConDatos` descarga y valida los datos y las fuentes con `delayRender` antes de pintar nada.
 */
import { loadFont } from "@remotion/fonts";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, useVideoConfig } from "remotion";
import type { PropsMotor, Timeline, Tokens } from "../datos/contrato";
import type { Datos } from "../datos/cargar";
import { cargarDatos, resolverSrc, rutaEstilo } from "../datos/cargar";
import type { Lienzo } from "../lib/camara";
import type { Bloque } from "../lib/disposicion";
import { bloquesPonente } from "../lib/disposicion";
import type { Diapo, Tramo } from "../lib/escenario";
import { diapositivas, pistaDisposiciones } from "../lib/escenario";
import { hayVideo } from "../lib/linea";
import type { RegistroTema, Tema } from "./tema";
import { crearTema, resolverShow } from "./tema";
import { rangoDeArchivo } from "./unicode";
import { cargarFuente3D, usaLetras } from "../tres/letras";

export type Medios = { mezzanine: string | null; plancha: string | null; mascara: string | null; audio: string | null; extras: Record<string, string> };

export type Motor = {
  props: PropsMotor;
  timeline: Timeline;
  tokens: Tokens;
  tema: Tema;
  lienzo: Lienzo;
  recorte: boolean;
  medios: Medios;
  bloques: Bloque[];
  opciones: { subtitulos: boolean; hud: boolean; grano: boolean; sonido: boolean; marca: boolean; perfil: Set<string> };
  /** §7: modo escenario (cajas de diapositiva y ponente sobre el lienzo). */
  escenario: boolean;
  /** §8: modo narración (sin ponente: la caja del ponente es la caja de voz y no se pinta ningún vídeo). */
  narracion: boolean;
  /** Tema de cada registro de la caja de diapositiva (y el base). */
  temas: Record<RegistroTema, Tema>;
  /** Diapositivas, pista de disposiciones y paquetes de marca (solo en modo escenario; vacíos si no). */
  esc: { diapos: Diapo[]; pista: Tramo[]; introMarca: boolean; outroMarca: boolean };
};

const Ctx = createContext<Motor | null>(null);

export const useMotor = () => {
  const m = useContext(Ctx);
  if (!m) throw new Error("useMotor() fuera de <ConDatos>");
  return m;
};

export const useTema = () => useMotor().tema;

/** Sustituye el tema para un subárbol (la piel de un registro dentro de la caja de diapositiva). */
export const ConTema: React.FC<{ tema: Tema; children: React.ReactNode }> = ({ tema, children }) => {
  const m = useMotor();
  const v = useMemo(() => ({ ...m, tema }), [m, tema]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
};

const fuentesCargadas = new Map<string, Promise<void>>();

export const cargarFuentes = (tokens: Tokens, estilo: string) =>
  Promise.all(
    tokens.tipografia.archivos.map((a) => {
      const url = rutaEstilo(estilo, a.archivo);
      const clave = `${a.familia}|${a.peso}|${a.estilo}|${url}`;
      let p = fuentesCargadas.get(clave);
      if (!p) {
        p = loadFont({ family: a.familia, url, weight: String(a.peso), style: a.estilo, unicodeRange: rangoDeArchivo(a.archivo) });
        fuentesCargadas.set(clave, p);
      }
      return p;
    }),
  );

const resolverMedios = (props: PropsMotor): Medios => {
  const extras: Record<string, string> = {};
  for (const [k, v] of Object.entries(props.media.extras ?? {})) extras[k] = resolverSrc(v);
  return {
    mezzanine: props.media.mezzanine ? resolverSrc(props.media.mezzanine) : null,
    plancha: props.media.plancha ? resolverSrc(props.media.plancha) : null,
    mascara: props.media.mascara ? resolverSrc(props.media.mascara) : null,
    audio: props.media.audio ? resolverSrc(props.media.audio) : null,
    extras,
  };
};

export const ConDatos: React.FC<{ props: PropsMotor; vertical?: boolean; children: React.ReactNode }> = ({
  props,
  vertical = false,
  children,
}) => {
  const { width, height, fps } = useVideoConfig();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [handle] = useState(() => delayRender("Cargando timeline.json, tokens y fuentes", { timeoutInMilliseconds: 90000 }));
  const hecho = useRef(false);

  useEffect(() => {
    let vivo = true;
    cargarDatos(props)
      .then(async (d) => {
        if (d.timeline.narracion && !props.media.audio) throw new Error("Modo narración: falta props.media.audio (la locución, p. ej. narracion.m4a)");
        if (!d.timeline.narracion && !props.media.mezzanine) throw new Error("Falta props.media.mezzanine (solo es opcional con timeline.narracion: true)");
        await cargarFuentes(d.tokens, props.estilo);
        const tl = d.timeline;
        if (usaLetras(tl.eventos, [tl.intro?.objeto3d, tl.outro?.objeto3d, ...tl.capitulos.map((c) => c.objeto3d)])) await cargarFuente3D();
        if (!vivo) return;
        setDatos(d);
        if (!hecho.current) {
          hecho.current = true;
          continueRender(handle);
        }
      })
      .catch((e) => cancelRender(e));
    return () => {
      vivo = false;
    };
    // `props` completas no: solo lo que cambia los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.timelineSrc, props.estilo, handle]);

  const motor = useMemo<Motor | null>(() => {
    if (!datos) return null;
    const { timeline, tokens } = datos;
    const medios = resolverMedios(props);
    const modo = props.opciones?.ponente ?? "auto";
    const puede = !!(timeline.plancha && medios.plancha && medios.mascara);
    const narracion = timeline.narracion;
    const recorte = narracion ? false : modo === "recorte" ? puede : modo === "marco" ? false : timeline.recorte && puede;
    const perfil = new Set(props.opciones?.perfil ?? []);
    let tk = tokens;
    if (perfil.has("sin-sombras")) tk = { ...tk, forma: { ...tk.forma, sombra: "none" } };
    if (perfil.has("fondo-liso")) tk = { ...tk, fondo: { ...tk.fondo, tipo: "liso" } };
    const tema = crearTema(tk, fps);
    const temas: Record<RegistroTema, Tema> = {
      base: tema,
      show: crearTema(tk, fps, "show"),
      editorial: crearTema(tk, fps, "editorial"),
      lamina: crearTema(tk, fps, "lamina"),
    };
    const show = resolverShow(tk);
    const escenario = narracion || timeline.escenario === true || (timeline.escenario !== false && show.escenario.activo);
    const introMarca = timeline.intro?.estilo === "marca";
    const outroMarca = timeline.outro?.estilo === "marca";
    const intro = timeline.intro;
    const introConVideo = intro ? hayVideo(timeline, intro.desde + Math.round((intro.hasta - intro.desde) / 2)) : false;
    const diapos = escenario ? diapositivas(timeline, introMarca, introConVideo) : [];
    const esc = { diapos, pista: escenario ? pistaDisposiciones(timeline, diapos) : [], introMarca, outroMarca };
    const o = props.opciones ?? {};
    return {
      props,
      timeline,
      tokens,
      tema,
      lienzo: { ancho: width, alto: height, vertical },
      recorte,
      medios,
      bloques: bloquesPonente(timeline, recorte),
      opciones: {
        subtitulos: o.subtitulos ?? true,
        hud: o.hud ?? true,
        grano: o.grano ?? (tokens.fondo.grano ?? 0) > 0,
        sonido: o.sonido ?? tokens.audio.sfx !== "ninguno",
        marca: o.marca ?? false,
        perfil: new Set(o.perfil ?? []),
      },
      escenario,
      narracion,
      temas,
      esc,
    };
  }, [datos, props, fps, width, height, vertical]);

  if (!motor) return null;
  return <Ctx.Provider value={motor}>{children}</Ctx.Provider>;
};
