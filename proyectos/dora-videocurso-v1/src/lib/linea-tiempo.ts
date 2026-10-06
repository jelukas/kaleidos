import type { Capitulo, Enfasis, Grafico, Segmento } from "../datos/tipos";
import { FPS } from "../tema";

// Duraciones fijas de los bloques de grafismo (fotogramas a 25 fps).
export const INTRO_FR = 9 * FPS; // 9 s
export const TARJETA_FR = Math.round(3.6 * FPS); // tarjeta de capítulo
export const OUTRO_FR = 10 * FPS;
export const SOLAPE_INTRO_FR = 20; // la primera tarjeta entra empujando a la intro (push slide)
export const LOSETAS_FR = 40; // transición 3D de losetas entre capítulos (tapa el corte a los 20 fotogramas)
export const BLOQUES_FR = 34; // bloques diagonales antes del outro
export const SALIDA_TARJETA_FR = 12; // la tarjeta sale empujada descubriendo ya el vídeo del capítulo

export type Toma = {
  capitulo: number; // índice del capítulo
  in: number; // s de la fuente
  out: number;
  desde: number; // fotograma de salida donde empieza
  dur: number; // fotogramas
  punch: boolean; // alternancia de encuadre 100 % ↔ 110 % para disimular el corte
};

export type BloqueCapitulo = {
  cap: Capitulo;
  indice: number;
  tarjetaDesde: number;
  desde: number; // primer fotograma de vídeo del capítulo
  hasta: number; // fotograma siguiente al último
};

export type LineaTiempo = {
  tomas: Toma[];
  capitulos: BloqueCapitulo[];
  outroDesde: number;
  total: number;
  fuenteAFotograma: (s: number) => number | null; // null si ese instante se ha cortado
  fuenteAFotogramaCercano: (s: number) => number;
};

export const construirLineaTiempo = (capitulos: Capitulo[]): LineaTiempo => {
  const tomas: Toma[] = [];
  const bloques: BloqueCapitulo[] = [];
  let f = INTRO_FR;
  let punch = false;
  capitulos.forEach((cap, i) => {
    const tarjetaDesde = i === 0 ? f - SOLAPE_INTRO_FR : f;
    f = tarjetaDesde + TARJETA_FR - SALIDA_TARJETA_FR;
    const desde = f;
    cap.segmentos.forEach((s: Segmento) => {
      // Cortes en fotogramas enteros de la fuente (25 fps).
      const inF = Math.round(s.in * FPS);
      const outF = Math.round(s.out * FPS);
      const dur = outF - inF;
      if (dur <= 0) return;
      tomas.push({ capitulo: i, in: inF / FPS, out: outF / FPS, desde: f, dur, punch });
      punch = !punch;
      f += dur;
    });
    bloques.push({ cap, indice: i, tarjetaDesde, desde, hasta: f });
  });
  const outroDesde = f;
  const total = outroDesde + OUTRO_FR;

  const fuenteAFotograma = (s: number) => {
    for (const t of tomas) {
      if (s >= t.in && s < t.out) return t.desde + Math.round((s - t.in) * FPS);
    }
    return null;
  };
  const fuenteAFotogramaCercano = (s: number) => {
    const exacto = fuenteAFotograma(s);
    if (exacto !== null) return exacto;
    // Si cae en un corte, se lleva al principio de la toma siguiente.
    const sig = tomas.find((t) => t.in >= s);
    return sig ? sig.desde : (tomas.at(-1)?.desde ?? 0) + (tomas.at(-1)?.dur ?? 0);
  };
  return { tomas, capitulos: bloques, outroDesde, total, fuenteAFotograma, fuenteAFotogramaCercano };
};

// Gráfico con sus tiempos ya en fotogramas de salida.
export type GraficoColocado = { g: Grafico; desde: number; hasta: number };

export const colocarGraficos = (lt: LineaTiempo, graficos: Grafico[]): GraficoColocado[] =>
  graficos
    .map((g) => {
      const desde = lt.fuenteAFotogramaCercano(g.t);
      const hasta = Math.max(desde + FPS, lt.fuenteAFotogramaCercano(g.hasta));
      return { g, desde, hasta };
    })
    .sort((a, b) => a.desde - b.desde);

export type EnfasisColocado = { desde: number; dur: number; zoom: number };

export const colocarEnfasis = (lt: LineaTiempo, enfasis: Enfasis[]): EnfasisColocado[] =>
  enfasis.map((e) => ({
    desde: lt.fuenteAFotogramaCercano(e.t),
    dur: Math.round(e.dur * FPS),
    zoom: e.zoom ?? 1.16,
  }));

export const formatoMinSeg = (frames: number) => {
  const s = Math.floor(frames / FPS);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
