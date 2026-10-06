/** Paneles de enumeración: lista, pasos y checklist. Cada elemento entra cuando la voz lo nombra (`en`). */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { PanelDe } from "../datos/contrato";
import { marcaLocal } from "../lib/linea";
import { ease, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import type { ContenidoProps } from "./Base";
import { Bola, Cabecera, tamPorLargo, useAparece } from "./Base";
import { Icono, IconoCirculo } from "./Iconos";

const marcas = (items: { en?: number }[], desde: number, dur: number) =>
  items.map((it, i) => Math.max(6 + i * 3, marcaLocal(it.en, desde, i, items.length, dur)));

export const Lista: React.FC<ContenidoProps<PanelDe<"lista">>> = ({ ev, dur, acento, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const n = ev.items.length;
  const enes = marcas(ev.items, ev.desde, dur);
  const actual = enes.findLastIndex((e) => f >= e);
  const d = n > 5 ? 0.8 : n > 4 ? 0.9 : 1;
  const e = escala * d;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 * e }}>
        {ev.items.map((it, i) => {
          const k = ap(enes[i]);
          const on = i === actual;
          const color = tema.tono(it.tono, acento);
          // Antes de nombrarse, la fila es un hueco tenue (el panel no parece vacío si la voz tarda en enumerar).
          const hueco = ap(2 + i * tema.mov.escalon);
          return (
            <div
              key={i}
              style={{
                ...tema.ficha(color, on),
                display: "flex",
                alignItems: "center",
                gap: 22 * e,
                padding: `${15 * e}px ${22 * e}px`,
                opacity: Math.max(0.4 * hueco, k),
              }}
            >
              <div style={{ display: "contents" }}>
                {it.icono && tema.iconoCirculo ? (
                  <IconoCirculo nombre={it.icono} size={58 * e} color={tema.acentoTexto(color)} progreso={tween(f, enes[i], 24, 0, 1)} />
                ) : it.icono ? (
                  <Icono
                    nombre={it.icono}
                    size={46 * e}
                    color={on ? tema.acentoTexto(color) : tema.c.textoSuave}
                    progreso={tween(f, enes[i], 20, 0, 1)}
                  />
                ) : (
                  <Bola n={i + 1} color={on ? color : tema.c.linea} tam={44 * e} />
                )}
                <div style={{ minWidth: 0, opacity: k, transform: `translateX(${(1 - k) * 40}px)` }}>
                  <div
                    style={{
                      ...tema.t.cuerpo,
                      fontSize: tamPorLargo(it.texto, 33 * e, 32),
                      lineHeight: 1.22,
                      fontWeight: on ? tema.pesoFuerte : tema.t.cuerpo.fontWeight,
                      color: on ? tema.c.texto : tema.c.textoSuave,
                    }}
                  >
                    {it.texto}
                  </div>
                  {it.detalle ? (
                    <div
                      style={{ ...tema.t.cuerpo, fontSize: 23 * e, lineHeight: 1.3, color: tema.c.textoSuave, marginTop: 4 * e }}
                    >
                      {it.detalle}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const Pasos: React.FC<ContenidoProps<PanelDe<"pasos">>> = ({ ev, dur, acento, ancho, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const n = ev.items.length;
  const enes = marcas(ev.items, ev.desde, dur);
  const actual = enes.findLastIndex((e) => f >= e);
  const horizontal = ancho >= 1050 && n <= 5;
  const gap = (horizontal ? 54 : 26) * escala;
  const cajaW = horizontal ? (ancho - (n - 1) * gap) / n : ancho;
  const d = !horizontal && n > 4 ? 0.85 : 1;
  const e = escala * d;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", gap, alignItems: "stretch" }}>
        {ev.items.map((p, i) => {
          const k = ap(enes[i]);
          const on = i === actual;
          const color = tema.tono(p.tono, acento);
          const flecha = i < n - 1 ? tween(f, enes[i + 1] - 10, 12, 0, 1, ease.power2Out) : 0;
          return (
            <div key={i} style={{ position: "relative", width: cajaW, flexShrink: 0 }}>
              <div
                style={{
                  ...tema.ficha(color, on),
                  height: "100%",
                  boxSizing: "border-box",
                  padding: horizontal ? `${26 * e}px ${22 * e}px` : `${13 * e}px ${20 * e}px`,
                  display: "flex",
                  flexDirection: horizontal ? "column" : "row",
                  alignItems: horizontal ? "flex-start" : "center",
                  gap: 16 * e,
                  opacity: Math.max(0.4 * ap(2 + i * tema.mov.escalon), k),
                  transform: `scale(${0.97 + 0.03 * k})`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 * e, opacity: Math.max(0.5, k) }}>
                  <Bola n={i + 1} color={on || f >= enes[i] ? color : tema.c.linea} tam={46 * e} />
                  {p.icono ? (
                    <Icono
                      nombre={p.icono}
                      size={42 * e}
                      color={tema.acentoTexto(color)}
                      progreso={tween(f, enes[i] + 4, 20, 0, 1)}
                    />
                  ) : null}
                </div>
                <div style={{ minWidth: 0, opacity: k, transform: `translateY(${(1 - k) * 16}px)` }}>
                  <div
                    style={{
                      ...tema.t.cuerpo,
                      fontWeight: tema.pesoFuerte,
                      fontSize: tamPorLargo(p.texto, (horizontal ? 30 : 31) * e, horizontal ? 22 : 34),
                      lineHeight: 1.2,
                      color: tema.c.texto,
                    }}
                  >
                    {p.texto}
                  </div>
                  {p.detalle ? (
                    <div
                      style={{ ...tema.t.cuerpo, fontSize: 22 * e, lineHeight: 1.3, color: tema.c.textoSuave, marginTop: 4 * e }}
                    >
                      {p.detalle}
                    </div>
                  ) : null}
                </div>
              </div>
              {i < n - 1 ? (
                horizontal ? (
                  <svg
                    width={gap}
                    height={30}
                    style={{ position: "absolute", right: -gap, top: "50%", marginTop: -15, overflow: "visible" }}
                  >
                    <path
                      d={`M6 15 H${gap - 10} M${gap - 20} 6 L${gap - 9} 15 L${gap - 20} 24`}
                      stroke={acento}
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - flecha}
                    />
                  </svg>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      left: 20 * e + 23 * e - 2,
                      bottom: -gap,
                      width: 4,
                      height: gap,
                      background: acento,
                      transformOrigin: "top",
                      transform: `scaleY(${flecha})`,
                    }}
                  />
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
};

export const Checklist: React.FC<ContenidoProps<PanelDe<"checklist">>> = ({ ev, dur, acento, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const n = ev.items.length;
  const enes = marcas(ev.items, ev.desde, dur);
  const d = n > 5 ? 0.82 : 1;
  const e = escala * d;
  const lado = 44 * e;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 * e }}>
        {ev.items.map((it, i) => {
          // Todas las casillas aparecen vacías al principio; cada una se marca cuando se nombra.
          const k = ap(4 + i * tema.mov.escalon);
          const marca = tween(f, enes[i], 14, 0, 1, ease.power2Out);
          const tono = it.tono ?? "ok";
          const color = tema.tono(tono, acento);
          const icono = tono === "bad" ? "cruz" : tono === "aviso" ? "alerta" : "check";
          const hecho = f >= enes[i];
          return (
            <div
              key={i}
              style={{
                ...tema.ficha(color, false),
                display: "flex",
                alignItems: "center",
                gap: 20 * e,
                padding: `${13 * e}px ${20 * e}px`,
                opacity: k,
                transform: `translateY(${(1 - k) * 20}px)`,
              }}
            >
              <div
                style={{
                  width: lado,
                  height: lado,
                  flexShrink: 0,
                  borderRadius: Math.min(12, tema.forma.radio * 0.4) * e,
                  border: `3px solid ${hecho ? color : tema.c.textoSuave}`,
                  background: hecho ? tema.alpha(color, 0.16) : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 + 0.12 * Math.sin(Math.PI * marca)})`,
                }}
              >
                <Icono nombre={icono} size={lado * 0.8} color={tema.acentoTexto(color)} progreso={marca} grosor={5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    ...tema.t.cuerpo,
                    fontSize: tamPorLargo(it.texto, 32 * e, 32),
                    lineHeight: 1.22,
                    fontWeight: hecho ? tema.pesoFuerte : tema.t.cuerpo.fontWeight,
                    color: hecho ? tema.c.texto : tema.c.textoSuave,
                  }}
                >
                  {it.texto}
                </div>
                {it.detalle ? (
                  <div style={{ ...tema.t.cuerpo, fontSize: 22 * e, color: tema.c.textoSuave, marginTop: 3 * e }}>
                    {it.detalle}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
