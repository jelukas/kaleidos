/** Paneles de diagrama: línea de tiempo (hitos) y mapa conceptual (centro + nodos). */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { PanelDe } from "../datos/contrato";
import { marcaLocal } from "../lib/linea";
import { ease, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import type { ContenidoProps } from "./Base";
import { Cabecera, tamPorLargo, useAparece } from "./Base";

export const Linea: React.FC<ContenidoProps<PanelDe<"linea">>> = ({ ev, dur, acento, ancho, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const n = ev.hitos.length;
  const enes = ev.hitos.map((h, i) => Math.max(8 + i * 3, marcaLocal(h.en, ev.desde, i, n, dur)));
  const actual = enes.findLastIndex((e) => f >= e);
  const horizontal = ancho >= 1050 && n <= 6;
  const prog = tween(f, enes[0], Math.max(1, enes[n - 1] - enes[0] + 10), 0, 1);
  const col = tema.acentoTexto(acento);

  if (horizontal) {
    const W = ancho;
    const paso = W / n;
    return (
      <>
        <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
        <div style={{ position: "relative", height: 300 * escala }}>
          <div style={{ position: "absolute", left: paso / 2, right: paso / 2, top: 96 * escala, height: 5, borderRadius: 3, background: tema.alpha(tema.c.textoSuave, 0.3) }} />
          <div
            style={{ position: "absolute", left: paso / 2, width: (W - paso) * prog, top: 96 * escala, height: 5, borderRadius: 3, background: acento }}
          />
          {ev.hitos.map((h, i) => {
            const k = ap(enes[i], 12);
            const on = i === actual;
            const x = paso * (i + 0.5);
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: x - paso / 2,
                    width: paso,
                    top: 0,
                    height: 76 * escala,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    ...tema.t.etiqueta,
                    fontSize: 21 * escala,
                    color: on ? col : tema.c.textoSuave,
                    opacity: k,
                  }}
                >
                  {h.etiqueta}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: x - 17 * escala,
                    top: 98 * escala - 17 * escala,
                    width: 34 * escala,
                    height: 34 * escala,
                    boxSizing: "border-box",
                    borderRadius: "50%",
                    background: on ? acento : tema.c.superficie,
                    border: `${6 * escala}px solid ${acento}`,
                    transform: `scale(${k})`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: x - paso / 2 + 8,
                    width: paso - 16,
                    top: 136 * escala,
                    textAlign: "center",
                    ...tema.t.cuerpo,
                    fontWeight: on ? tema.pesoFuerte : tema.t.cuerpo.fontWeight,
                    fontSize: tamPorLargo(h.texto, 26 * escala, 26),
                    lineHeight: 1.22,
                    color: on ? tema.c.texto : tema.c.textoSuave,
                    opacity: k,
                    transform: `translateY(${(1 - k) * 14}px)`,
                  }}
                >
                  {h.texto}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </>
    );
  }

  const d = n > 5 ? 0.82 : 1;
  const e = escala * d;
  // Columna de etiquetas ajustada a la más larga (mayúsculas con tracking: ≈ 1 em por carácter), con tope.
  const largo = Math.max(...ev.hitos.map((h) => h.etiqueta.length));
  const colEtiqueta = Math.min(ancho * 0.4, Math.max(110 * e, largo * 20 * e * 1.02));
  const fila = 92 * e;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ position: "relative", height: fila * n }}>
        <div style={{ position: "absolute", left: colEtiqueta + 15 * e, top: fila / 2, height: fila * (n - 1), width: 5, background: tema.alpha(tema.c.textoSuave, 0.3), borderRadius: 3 }} />
        <div
          style={{ position: "absolute", left: colEtiqueta + 15 * e, top: fila / 2, height: fila * (n - 1) * prog, width: 5, background: acento, borderRadius: 3 }}
        />
        {ev.hitos.map((h, i) => {
          const k = ap(enes[i], 12);
          const on = i === actual;
          const y = fila * i;
          return (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: fila, display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: colEtiqueta,
                  flexShrink: 0,
                  textAlign: "right",
                  ...tema.t.etiqueta,
                  fontSize: 20 * e,
                  color: on ? col : tema.c.textoSuave,
                  opacity: k,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {h.etiqueta}
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 34 * e,
                  height: 34 * e,
                  marginLeft: 0,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  background: on ? acento : tema.c.superficie,
                  border: `${6 * e}px solid ${acento}`,
                  transform: `scale(${k})`,
                  position: "relative",
                  left: 0,
                }}
              />
              <div
                style={{
                  marginLeft: 22 * e,
                  ...tema.t.cuerpo,
                  fontWeight: on ? tema.pesoFuerte : tema.t.cuerpo.fontWeight,
                  fontSize: tamPorLargo(h.texto, 30 * e, 36),
                  lineHeight: 1.2,
                  color: on ? tema.c.texto : tema.c.textoSuave,
                  opacity: k,
                  transform: `translateX(${(1 - k) * 24}px)`,
                }}
              >
                {h.texto}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const Mapa: React.FC<ContenidoProps<PanelDe<"mapa">>> = ({ ev, dur, acento, ancho, alto, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const n = ev.nodos.length;
  const W = ancho;
  const H = Math.min(alto, 560 * escala);
  const cx = W / 2;
  const cy = H / 2;
  const nodoW = Math.min(270 * escala, W * 0.33);
  const nodoH = 92 * escala;
  const rx = Math.max(nodoW * 0.8, W / 2 - nodoW / 2 - 4);
  const ry = Math.max(nodoH, H / 2 - nodoH / 2 - 4);
  const centroW = Math.min(330 * escala, W * 0.4);
  const kc = ap(4, 16);
  const enes = ev.nodos.map((nd, i) => Math.max(12 + i * 3, marcaLocal(nd.en, ev.desde, i, n, dur)));
  // Con número par de nodos se gira medio paso para no apilar dos nodos en el eje vertical.
  const giro = n % 2 === 0 ? Math.PI / n : 0;
  const pos = (i: number) => {
    const a = -Math.PI / 2 + giro + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const;
  };
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} margen={14} />
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {ev.nodos.map((_, i) => {
            const [x, y] = pos(i);
            const k = tween(f, enes[i] - 4, 12, 0, 1, ease.power2Out);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + (x - cx) * k}
                y2={cy + (y - cy) * k}
                stroke={acento}
                strokeWidth={3}
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            left: cx - centroW / 2,
            top: cy - 64 * escala,
            width: centroW,
            height: 128 * escala,
            boxSizing: "border-box",
            borderRadius: tema.estiloPanel === "tinta" ? 22 : 64 * escala,
            background: acento,
            border: tema.estiloPanel === "tinta" ? `4px solid ${tema.c.tinta}` : undefined,
            color: tema.sobre(acento),
            ...tema.t.titular,
            fontSize: tamPorLargo(ev.centro, 34 * escala, 14),
            lineHeight: 1.08,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: `0 ${20 * escala}px`,
            boxShadow: tema.estiloPanel === "tinta" ? `6px 6px 0 ${tema.c.tinta}` : `0 0 60px ${tema.alpha(acento, 0.45)}`,
            transform: `scale(${kc})`,
          }}
        >
          {ev.centro}
        </div>
        {ev.nodos.map((nd, i) => {
          const [x, y] = pos(i);
          const k = ap(enes[i] + 4, 12);
          return (
            <div
              key={i}
              style={{
                ...tema.ficha(acento, false),
                position: "absolute",
                left: x - nodoW / 2,
                top: y - nodoH / 2,
                width: nodoW,
                minHeight: nodoH,
                boxSizing: "border-box",
                padding: `${10 * escala}px ${14 * escala}px`,
                background: tema.estiloPanel === "cristal" ? tema.alpha(tema.c.superficie2, 0.92) : tema.ficha(acento, false).background,
                ...tema.t.cuerpo,
                fontWeight: tema.pesoFuerte,
                fontSize: tamPorLargo(nd.texto, 25 * escala, 22),
                lineHeight: 1.18,
                color: tema.c.texto,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                opacity: k,
                transform: `scale(${0.8 + 0.2 * k})`,
              }}
            >
              {nd.texto}
            </div>
          );
        })}
      </div>
    </>
  );
};
