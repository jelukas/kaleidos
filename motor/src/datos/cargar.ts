/**
 * Carga y validación de `timeline.json` y `tokens.json`.
 *
 * `calculateMetadata` solo devuelve duración, fps y tamaño. La línea de tiempo NO se devuelve como props
 * resueltas: en Lambda, Remotion serializa esas props y, si pasan de ~200 KB, las sube al bucket
 * `remotionlambda-*` (de lectura pública). En su lugar, cada pestaña del renderizador descarga
 * `timeline.json` una vez (URL prefirmada del bucket privado) y la guarda en caché de módulo.
 */
import { staticFile } from "remotion";
import type { PropsMotor, Timeline, Tokens } from "./contrato";
import { errorLegible, timelineSchema, tokensSchema } from "./contrato";

export const esUrl = (src: string) => /^(https?:|blob:|data:)/.test(src);

/** Local: archivo del --public-dir (staticFile). Lambda: URL https (prefirmada). */
export const resolverSrc = (src: string) => (esUrl(src) ? src : staticFile(src.replace(/^\/+/, "")));

export const rutaEstilo = (estilo: string, archivo: string) => staticFile(`estilos/${estilo}/${archivo.replace(/^\/+/, "")}`);

const cache = new Map<string, Promise<unknown>>();

const leerJson = (url: string, que: string, signal?: AbortSignal): Promise<unknown> => {
  const hit = cache.get(url);
  if (hit) return hit;
  const p = (async () => {
    let r: Response;
    // Reintentos cortos: en Lambda, decenas de funciones piden a la vez el mismo objeto.
    let ultimo: unknown = null;
    for (let intento = 0; intento < 4; intento++) {
      try {
        r = await fetch(url, { signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as unknown;
      } catch (e) {
        ultimo = e;
        if (signal?.aborted) break;
        await new Promise((res) => setTimeout(res, 300 * (intento + 1)));
      }
    }
    // No se muestra la URL completa: en Lambda es prefirmada (lleva la firma en la query).
    const visible = url.split("?")[0];
    throw new Error(`No se pudo leer ${que} (${visible}): ${String(ultimo)}`);
  })();
  cache.set(url, p);
  p.catch(() => cache.delete(url));
  return p;
};

export const cargarTimeline = async (src: string, signal?: AbortSignal): Promise<Timeline> => {
  const json = await leerJson(resolverSrc(src), "timeline.json", signal);
  const r = timelineSchema.safeParse(json);
  if (!r.success) throw errorLegible("timeline.json", r.error);
  return r.data;
};

export const cargarTokens = async (estilo: string, signal?: AbortSignal): Promise<Tokens> => {
  const json = await leerJson(rutaEstilo(estilo, "tokens.json"), `tokens del estilo «${estilo}»`, signal);
  const r = tokensSchema.safeParse(json);
  if (!r.success) throw errorLegible(`estilos/${estilo}/tokens.json`, r.error);
  return r.data;
};

export type Datos = { timeline: Timeline; tokens: Tokens };

export const cargarDatos = async (props: PropsMotor, signal?: AbortSignal): Promise<Datos> => {
  const [timeline, tokens] = await Promise.all([cargarTimeline(props.timelineSrc, signal), cargarTokens(props.estilo, signal)]);
  return { timeline, tokens };
};
