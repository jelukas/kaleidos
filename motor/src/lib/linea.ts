/** Consultas sobre la línea de tiempo (todas en fotogramas de salida, con el fotograma absoluto). */
import type { Capitulo, Evento, Timeline } from "../datos/contrato";

export const enRango = (f: number, a: { desde: number; hasta: number }) => f >= a.desde && f < a.hasta;

/** Capítulo en curso: el último cuyo `desde` ya pasó (o null antes del primero). */
export const capituloEn = (tl: Timeline, f: number): Capitulo | null => {
  let c: Capitulo | null = null;
  for (const x of tl.capitulos) if (f >= x.desde) c = x;
  return c;
};

export const indiceCapitulo = (tl: Timeline, f: number) => {
  const c = capituloEn(tl, f);
  return c ? tl.capitulos.indexOf(c) : -1;
};

/** Rótulo de capítulo activo (entre `desde` y `rotuloHasta`). */
export const rotuloEn = (tl: Timeline, f: number) => tl.capitulos.find((c) => f >= c.desde && f < c.rotuloHasta) ?? null;

export const hayVideo = (tl: Timeline, f: number) => tl.segmentos.some((s) => f >= s.dst && f < s.dst + s.dur);

/** Segmento que cubre el fotograma `f`, con el segundo de la fuente correspondiente. */
export const fuenteEn = (tl: Timeline, f: number) => {
  for (const s of tl.segmentos) {
    if (f >= s.dst && f < s.dst + s.dur) return { seg: s, t: s.src + (f - s.dst) / tl.fps };
  }
  return null;
};

export const eventosEn = (tl: Timeline, f: number): Evento[] => tl.eventos.filter((e) => enRango(f, e));

/** Tramo del programa entre intro y outro (donde se pintan HUD y barra de progreso). */
export const tramoPrograma = (tl: Timeline) => {
  const ini = tl.intro ? tl.intro.hasta : 0;
  const fin = tl.outro ? tl.outro.desde : tl.duracion;
  return { ini, fin };
};

/** Acento del evento: el del capítulo donde empieza. */
export const acentoDe = (tl: Timeline, f: number) => capituloEn(tl, f)?.acento ?? 0;

/** Fotograma local de una marca `en` de un evento (si falta, reparte las marcas en el primer tercio). */
export const marcaLocal = (en: number | undefined, desde: number, i: number, n: number, dur: number) => {
  if (typeof en === "number") return Math.max(0, en - desde);
  const tramo = Math.min(dur * 0.45, n * 18);
  return Math.round(8 + (tramo * i) / Math.max(1, n));
};

export const formatoTiempo = (frames: number, fps: number) => {
  const s = Math.floor(frames / fps);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ]/g, "");

/**
 * Fotograma (absoluto) en que la voz empieza a decir `frase`, buscándola palabra a palabra en los subtítulos entre
 * `desde − 12` y `hasta`; null si no aparece. Sirve para que una palabra resaltada «se encienda» al decirla.
 */
export const momentoDicho = (tl: Timeline, frase: string, desde: number, hasta: number): number | null => {
  const obj = frase.split(/\s+/).map(normalizar).filter(Boolean);
  if (!obj.length) return null;
  const ws = tl.subtitulos.filter((p) => p.hasta >= desde - 12 && p.desde <= hasta).flatMap((p) => p.palabras);
  for (let i = 0; i + obj.length <= ws.length; i++) {
    if (ws[i].desde < desde - 12 || ws[i].desde > hasta) continue;
    if (obj.every((w, j) => normalizar(ws[i + j].t) === w)) return ws[i].desde;
  }
  return null;
};
