/**
 * Bocadillos de cómic (estilo.md › lamina-comic): globo, nube de pensamiento o grito, con cola hacia `izq`, `der`
 * o `abajo`. Se dibujan en SVG con la técnica del CONTORNO UNIDO: todas las formas (cuerpo + cola) primero en
 * negro con trazo doble y luego en blanco sin trazo, así el contorno rodea la unión sin líneas interiores.
 * Brotan con escala y rebote desde la punta de la cola y el texto aparece letra a letra (Comic Neue 700),
 * sin mover el maquetado (las letras pendientes están ocultas, no ausentes).
 */
import React from "react";
import type { FormaBocadillo } from "../datos/contrato";
import { clamp01, ease, hash01, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import { partirLineas } from "./medir";

type Cola = "izq" | "der" | "abajo";

const puntos = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";

/** Formas del bocadillo (cuerpo centrado en 0,0 de W×H) y punta de la cola. */
const formas = (forma: FormaBocadillo, cola: Cola, W: number, H: number) => {
  const a = W / 2;
  const b = H / 2;
  const tip: [number, number] = cola === "abajo" ? [-0.2 * W, b + 0.34 * H] : cola === "izq" ? [-a - 0.2 * W, 0.34 * H] : [a + 0.2 * W, 0.34 * H];
  const s = cola === "der" ? 1 : -1;
  const out: React.ReactElement[] = [];
  const el = (k: string, p: React.SVGProps<SVGElement> & { tag: "ellipse" | "circle" | "path" }) => {
    const { tag, ...rest } = p;
    return React.createElement(tag, { key: k, ...rest });
  };
  if (forma === "nube") {
    // Cuerpo: elipse central + 9 bultos alrededor. Cola: tres burbujas que menguan hacia la punta.
    out.push(el("c", { tag: "ellipse", cx: 0, cy: 0, rx: a * 0.82, ry: b * 0.78 }));
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 + 0.3;
      const r = Math.min(a, b) * (0.42 + 0.1 * hash01(i + 3));
      out.push(el(`b${i}`, { tag: "circle", cx: Math.cos(t) * (a - r * 0.85), cy: Math.sin(t) * (b - r * 0.8), r }));
    }
    const base: [number, number] = cola === "abajo" ? [-0.12 * W, b * 0.95] : [s * a * 0.9, b * 0.45];
    [0.16, 0.1, 0.06].forEach((k, i) => {
      const u = (i + 1) / 3.2;
      out.push(el(`t${i}`, { tag: "circle", cx: base[0] + (tip[0] - base[0]) * u, cy: base[1] + (tip[1] - base[1]) * u, r: Math.min(W, H) * k * 0.55 }));
    });
    return { out, tip };
  }
  if (forma === "grito") {
    const n = 18;
    const pts: [number, number][] = [];
    for (let i = 0; i < n * 2; i++) {
      const t = (i / (n * 2)) * Math.PI * 2;
      const k = i % 2 === 0 ? 1.08 + 0.1 * hash01(i) : 0.84;
      pts.push([Math.cos(t) * a * k, Math.sin(t) * b * k]);
    }
    out.push(el("c", { tag: "path", d: puntos(pts) }));
    const b1: [number, number] = cola === "abajo" ? [-0.3 * W, b * 0.55] : [s * a * 0.7, 0.1 * H];
    const b2: [number, number] = cola === "abajo" ? [-0.04 * W, b * 0.7] : [s * a * 0.62, 0.42 * H];
    out.push(el("t", { tag: "path", d: puntos([b1, tip, b2]) }));
    return { out, tip };
  }
  // globo: elipse + cola curva
  out.push(el("c", { tag: "ellipse", cx: 0, cy: 0, rx: a, ry: b }));
  const b1: [number, number] = cola === "abajo" ? [-0.3 * W, b * 0.6] : [s * a * 0.78, 0.05 * H];
  const b2: [number, number] = cola === "abajo" ? [-0.06 * W, b * 0.82] : [s * a * 0.68, 0.38 * H];
  const c1: [number, number] = [(b1[0] + tip[0]) / 2 + (cola === "abajo" ? -0.02 * W : 0), (b1[1] + tip[1]) / 2];
  out.push(el("t", { tag: "path", d: `M${b1[0]} ${b1[1]} Q${c1[0]} ${c1[1]} ${tip[0]} ${tip[1]} Q${(b2[0] + tip[0]) / 2} ${(b2[1] + tip[1]) / 2 - 0.04 * H} ${b2[0]} ${b2[1]} Z` }));
  return { out, tip };
};

/** Medidas del cuerpo para un texto (el texto ocupa ≈ 74 % del ancho y ≈ 62 % del alto). */
export const medidasBocadillo = (texto: string, ancho: number, tam: number, familia: string) => {
  const lineas = partirLineas(texto, ancho * 0.72, familia, 700, tam);
  const altoTexto = lineas.length * tam * 1.16;
  const H = Math.max(ancho * 0.44, altoTexto / 0.6);
  return { lineas, W: ancho, H };
};

export const Bocadillo: React.FC<{
  texto: string;
  forma: FormaBocadillo;
  cola: Cola;
  cx: number; // centro del cuerpo (px del contenedor)
  cy: number;
  ancho: number;
  tam: number;
  f: number; // fotograma local desde que brota
  dur: number; // fotogramas hasta que desaparece (sale en los 6 últimos)
  contorno?: number;
}> = ({ texto, forma, cola, cx, cy, ancho, tam, f, dur, contorno = 5 }) => {
  const tema = useTema();
  if (f < 0 || f >= dur) return null;
  const familia = tema.tokens.tipografia.archivos.some((a) => a.familia === "Comic Neue") ? `"Comic Neue", ${tema.f.cuerpo}` : tema.f.cuerpo;
  const { lineas, W, H } = medidasBocadillo(texto, ancho, tam, familia);
  const { out, tip } = formas(forma, cola, W, H);
  const entra = tween(f, 0, 11, 0.001, 1, ease.backOutJuego);
  const sale = tween(f, dur - 6, 6, 1, 0.001, ease.power2In);
  const k = Math.min(entra, sale);
  // Letra a letra (≈ 40 letras/s a 25 fps) desde el fotograma 6.
  const total = lineas.join(" ").length;
  const visibles = Math.floor(clamp01((f - 6) / Math.max(1, total / 1.6)) * total);
  const margen = Math.max(W, H) * 0.7 + contorno * 2;
  const vb = [-W / 2 - margen, -H / 2 - margen, W + margen * 2, H + margen * 2];
  const inicios = lineas.map((_, i) => lineas.slice(0, i).reduce((n, l) => n + l.length + 1, 0));
  return (
    <div
      style={{
        position: "absolute",
        left: cx + vb[0],
        top: cy + vb[1],
        width: vb[2],
        height: vb[3],
        transform: `scale(${k})`,
        transformOrigin: `${tip[0] - vb[0]}px ${tip[1] - vb[1]}px`,
        pointerEvents: "none",
      }}
    >
      <svg width={vb[2]} height={vb[3]} viewBox={vb.join(" ")} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g fill="#111111" stroke="#111111" strokeWidth={contorno * 2} strokeLinejoin="round">
          {out}
        </g>
        <g fill="#FFFFFF" stroke="none">
          {out}
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: -vb[0] - W * 0.39,
          top: -vb[1] - (lineas.length * tam * 1.16) / 2,
          width: W * 0.78,
          fontFamily: familia,
          fontWeight: 700,
          fontSize: tam,
          lineHeight: 1.16,
          color: "#1E1E1E",
          textAlign: "center",
        }}
      >
        {lineas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {[...l].map((ch, j) => (
              <span key={j} style={{ visibility: inicios[i] + j < visibles ? "visible" : "hidden" }}>
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
