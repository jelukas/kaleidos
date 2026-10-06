/**
 * §8 Modo narración: la CAJA DE VOZ ocupa el sitio de la caja del ponente (disposición `voz`). Lleva el fondo de
 * cámara del estilo (menta en milikito), una onda de voz que sigue a la locución y la etiqueta «Narración» con la
 * tipografía de etiqueta del estilo.
 *
 * Onda: `@remotion/media-utils` (`getAudioData` + `visualizeAudio`), el mismo par que `useAudioData`, pero con la
 * carga envuelta aquí para que un fallo de decodificación NO tumbe el render (useAudioData llama a cancelRender):
 * si la locución no se puede decodificar, la onda sale de los tiempos de las palabras de los subtítulos (también
 * determinista) y se avisa por consola. Todo depende solo del fotograma: vale para Lambda (cada función decodifica
 * la locución una vez por pestaña, a 16 kHz, y la guarda en caché de módulo).
 */
import type { MediaUtilsAudioData } from "@remotion/media-utils";
import { getAudioData, visualizeAudio } from "@remotion/media-utils";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import type { Timeline } from "../datos/contrato";
import type { Ajuste, CajaGeo } from "../lib/escenario";
import { fuenteEn } from "../lib/linea";
import { clamp01 } from "../tema/anim";
import { useMotor } from "../tema/Motor";
import { fondoCamara } from "./CajaPonente";

const MUESTREO = 16000; // Hz: la voz cabe de sobra y la memoria por pestaña es un tercio que a 48 kHz
const BANDAS = 64; // potencia de 2 (visualizeAudio)
const USADAS = 14; // bandas 1..14 ≈ 125–1750 Hz a 16 kHz: donde está la energía de la voz

const cache = new Map<string, Promise<MediaUtilsAudioData | null>>();
const sinFirma = (t: string) => t.replace(/\?[^\s"')]*/g, "?…"); // las URLs prefirmadas no salen en los registros

const cargarVoz = (src: string) => {
  let p = cache.get(src);
  if (!p) {
    p = getAudioData(src, { sampleRate: MUESTREO }).catch((e: unknown) => {
      console.warn(`[kaleidos] onda de voz: no se pudo decodificar la locución (${sinFirma(String(e))}); la onda sigue a los subtítulos`);
      return null;
    });
    cache.set(src, p);
  }
  return p;
};

/** Datos de la locución (null mientras carga; `{ d: null }` si no se pudo decodificar). */
const useDatosVoz = (src: string | null) => {
  const [datos, setDatos] = useState<{ d: MediaUtilsAudioData | null } | null>(null);
  const [handle] = useState(() => (src ? delayRender("Onda de voz: decodificando la locución", { timeoutInMilliseconds: 120000 }) : null));
  useEffect(() => {
    if (!src || handle === null) return;
    let vivo = true;
    cargarVoz(src).then((d) => {
      if (vivo) setDatos({ d });
      continueRender(handle);
    });
    return () => {
      vivo = false;
    };
  }, [src, handle]);
  return datos;
};

/** Fotograma de la LOCUCIÓN que suena en el fotograma de salida `f` (null si ahí no suena). */
const fotogramaVoz = (tl: Timeline, f: number): number | null => {
  if (!tl.segmentos.length) return f;
  const s = fuenteEn(tl, f);
  return s ? s.t * tl.fps : null;
};

/** Nivel 0–1 de cada banda (dB con suelo en −62), o null si no suena nada. */
const nivelesVoz = (d: MediaUtilsAudioData, fAudio: number, fps: number): number[] | null => {
  if (fAudio < 0 || fAudio / fps >= d.durationInSeconds - 0.05) return null;
  const v = visualizeAudio({ audioData: d, frame: Math.floor(fAudio), fps, numberOfSamples: BANDAS, smoothing: true });
  return v.slice(1, USADAS + 1).map((x) => clamp01((20 * Math.log10(Math.max(1e-6, x)) + 62) / 46));
};

/** Respaldo determinista: pseudo-onda mientras hay una palabra activa en los subtítulos. */
const nivelesSubtitulos = (tl: Timeline, f: number): number[] | null => {
  const pag = tl.subtitulos.find((p) => f >= p.desde && f < p.hasta);
  const w = pag?.palabras.find((p) => f >= p.desde && f < p.hasta);
  if (!w) return null;
  const k = Math.sin(Math.PI * clamp01((f - w.desde + 0.5) / Math.max(1, w.hasta - w.desde)));
  return Array.from({ length: USADAS }, (_, i) => clamp01(k * (0.55 + 0.4 * Math.abs(Math.sin(f * 0.83 + i * 1.71))) * (1 - i / (USADAS * 1.4))));
};

/** Onda de voz: barras simétricas (graves en el centro) que siguen a la locución. */
export const OndaVoz: React.FC<{ w: number; h: number; color: string; reposo?: number }> = ({ w, h, color, reposo = 0.08 }) => {
  const { timeline: tl, medios } = useMotor();
  const f = useCurrentFrame();
  const datos = useDatosVoz(medios.audio);
  const fa = fotogramaVoz(tl, f);
  const niveles = fa === null ? null : datos?.d ? nivelesVoz(datos.d, fa, tl.fps) : datos ? nivelesSubtitulos(tl, f) : null;
  // Barras: [13..1, 0, 1..13] → 2·USADAS − 1, con la banda más grave en el centro.
  const n = USADAS * 2 - 1;
  const paso = w / n;
  const bw = Math.max(3, paso * 0.56);
  const c = USADAS - 1;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      {Array.from({ length: n }, (_, i) => {
        const banda = Math.abs(i - c);
        const nivel = niveles ? niveles[banda] : 0;
        // Envolvente: más alta en el centro, para que la onda tenga forma de voz y no de ecualizador plano.
        const env = 1 - 0.55 * (banda / c) ** 1.6;
        const alto = Math.max(bw, h * (reposo + (1 - reposo) * nivel * env));
        return <rect key={i} x={i * paso + (paso - bw) / 2} y={(h - alto) / 2} width={bw} height={alto} rx={bw / 2} fill={color} />;
      })}
    </svg>
  );
};

export const CajaVoz: React.FC<{ geo: CajaGeo; aj?: Ajuste }> = ({ geo }) => {
  const { tema, opciones } = useMotor();
  if (geo.o <= 0.002 || geo.w < 2 || geo.h < 2) return null;
  const e = tema.show.escenario;
  const s = Math.min(geo.w / 395, geo.h / 388);
  const tinta = tema.c.tinta;
  const sinSombra = opciones.perfil.has("sin-sombras");
  const etiqueta = tema.t.etiqueta;
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
        background: fondoCamara(e.camara, e.camara2, tema.mezcla),
        boxShadow: sinSombra || geo.r < 1 ? undefined : e.sombra,
      }}
    >
      <div style={{ position: "absolute", left: geo.w * 0.1, top: geo.h * 0.2, willChange: "transform" }}>
        <OndaVoz w={geo.w * 0.8} h={geo.h * 0.5} color={tinta} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: geo.h * 0.09,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...etiqueta,
            display: "flex",
            alignItems: "center",
            gap: 10 * s,
            padding: `${6 * s}px ${18 * s}px`,
            borderRadius: 999,
            background: tinta,
            color: e.camara,
            fontSize: 30 * s,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <svg width={20 * s} height={26 * s} viewBox="0 0 20 26" style={{ display: "block" }}>
            <rect x={5} y={1} width={10} height={15} rx={5} fill={e.camara} />
            <path d="M2 11 C2 17 6 20 10 20 C14 20 18 17 18 11 M10 20 V25" fill="none" stroke={e.camara} strokeWidth={2.4} strokeLinecap="round" />
          </svg>
          Narración
        </div>
      </div>
    </div>
  );
};
