import type { Caption, TikTokPage } from "@remotion/captions";
import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Palabra } from "../datos/tipos";
import type { BloqueDisp } from "../lib/encuadre";
import { disposicionEn } from "../lib/encuadre";
import type { LineaTiempo } from "../lib/linea-tiempo";
import { COLOR, ease, FONT, FPS } from "../tema";

// Pasa las palabras de tiempo de fuente a tiempo de salida y descarta las que caen en cortes.
const aSalida = (palabras: Palabra[], lt: LineaTiempo): Caption[] => {
  const out: Caption[] = [];
  for (const p of palabras) {
    const texto = p.text.replace(/^\s*-\s*$/, "");
    if (!texto.trim()) continue;
    const ini = lt.fuenteAFotograma(p.startMs / 1000);
    if (ini === null) continue;
    const finSrc = Math.max(p.startMs + 80, p.endMs);
    const fin = lt.fuenteAFotograma(finSrc / 1000) ?? ini + Math.round(((finSrc - p.startMs) / 1000) * FPS);
    out.push({
      text: texto,
      startMs: (ini / FPS) * 1000,
      endMs: (Math.max(fin, ini + 2) / FPS) * 1000,
      timestampMs: null,
      confidence: p.confidence ?? null,
    });
  }
  return out;
};

// Páginas de subtítulos: se corta al final de frase, en pausas de más de 0,5 s o al pasar de ~46
// caracteres (sin dejar una palabra suelta de la frase siguiente al final de la página).
const MAX_CHARS = 46;
const paginar = (caps: Caption[]): TikTokPage[] => {
  const paginas: TikTokPage[] = [];
  let actual: Caption[] = [];
  const cerrar = () => {
    if (!actual.length) return;
    const startMs = actual[0].startMs;
    paginas.push({
      text: actual.map((c) => c.text).join(""),
      startMs,
      durationMs: actual[actual.length - 1].endMs - startMs,
      tokens: actual.map((c) => ({ text: c.text, fromMs: c.startMs, toMs: c.endMs })),
    });
    actual = [];
  };
  caps.forEach((c, i) => {
    const prev = actual[actual.length - 1];
    const largo = actual.map((x) => x.text).join("").length + c.text.length;
    if (prev && (c.startMs - prev.endMs > 500 || largo > MAX_CHARS)) cerrar();
    actual.push(c);
    const finFrase = /[.?!…]["»”]?$/.test(c.text.trim());
    const sig = caps[i + 1];
    if (finFrase || !sig) cerrar();
  });
  return paginas;
};

export const Subtitulos: React.FC<{ palabras: Palabra[]; lt: LineaTiempo; bloques: BloqueDisp[] }> = ({
  palabras,
  lt,
  bloques,
}) => {
  const frame = useCurrentFrame();
  const paginas = useMemo<TikTokPage[]>(() => paginar(aSalida(palabras, lt)), [palabras, lt]);

  const ms = (frame / FPS) * 1000;
  const pagina = paginas.find((p) => ms >= p.startMs && ms < p.startMs + Math.min(p.durationMs, 4000) + 250);
  if (!pagina) return null;

  // Sin subtítulos encima de las tarjetas de capítulo.
  if (lt.capitulos.some((c) => frame >= c.tarjetaDesde - 20 && frame < c.desde + 12)) return null;
  if (frame >= lt.outroDesde - 20) return null;

  const { disp, mezcla } = disposicionEn(bloques, frame);
  // Esquina: centrados en la zona del gráfico (izquierda). Dividida: bajo la ponente (mitad izquierda).
  const objetivoX = disp === "esquina" ? 720 : disp === "dividida" ? 450 : 960;
  const objetivoW = disp === "dividida" ? 840 : 1400;
  const centroX = interpolate(mezcla, [0, 1], [960, objetivoX]);
  const anchoMax = interpolate(mezcla, [0, 1], [1400, objetivoW]);
  const aparece = interpolate(ms - pagina.startMs, [0, 160], [0, 1], { extrapolateRight: "clamp", easing: ease.power2Out });

  return (
    <div
      style={{
        position: "absolute",
        left: centroX - 760,
        width: 1520,
        bottom: 92,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: anchoMax,
          padding: "14px 28px 16px",
          borderRadius: 18,
          background: "rgba(4, 12, 31, 0.78)",
          boxShadow: "0 12px 40px rgba(4,12,31,0.25)",
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.25,
          textAlign: "center",
          color: COLOR.fg,
          textWrap: "balance",
          opacity: aparece,
          transform: `translateY(${(1 - aparece) * 14}px)`,
        }}
      >
        {pagina.tokens.map((tk, i) => {
          const activa = ms >= tk.fromMs && ms < tk.toMs;
          const dicha = ms >= tk.fromMs;
          const pop = interpolate(ms - tk.fromMs, [0, 90, 200], [0.92, 1.06, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                color: activa ? COLOR.accent : dicha ? COLOR.fg : "rgba(243,247,255,0.55)",
                transform: activa ? `scale(${pop})` : undefined,
              }}
            >
              {tk.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
