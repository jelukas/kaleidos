/** Paneles de decisión: comparativa, opciones (con foco y veredicto) y caso (con sello de veredicto). */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { PanelDe } from "../datos/contrato";
import { marcaLocal } from "../lib/linea";
import { ease, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import type { ContenidoProps } from "./Base";
import { Bola, Cabecera, tamPorLargo, useAparece } from "./Base";
import { Icono, IconoCirculo } from "./Iconos";

const iconoTono = { ok: "check", bad: "cruz", neutro: "punto", aviso: "alerta" } as const;

export const Comparativa: React.FC<ContenidoProps<PanelDe<"comparativa">>> = ({ ev, dur, acento, ancho, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const cols = [ev.izq, ev.der];
  const apilar = ancho < 640;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", flexDirection: apilar ? "column" : "row", gap: 26 * escala, alignItems: "stretch" }}>
        {cols.map((c, ci) => {
          const en = Math.max(6 + ci * 10, marcaLocal(c.en, ev.desde, ci, 2, dur));
          const k = ap(en);
          const color = c.tono === "neutro" ? acento : tema.tono(c.tono, acento);
          return (
            <div
              key={ci}
              style={{
                ...tema.ficha(color, false),
                flex: 1,
                minWidth: 0,
                padding: `${24 * escala}px ${24 * escala}px ${26 * escala}px`,
                boxShadow: `${tema.ficha(color, false).boxShadow ?? ""}${tema.estiloPanel === "tinta" ? "" : `, inset 0 5px 0 ${color}`}`,
                opacity: k,
                transform: `translateY(${(1 - k) * 44}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 * escala, marginBottom: 18 * escala }}>
                <Icono nombre={iconoTono[c.tono]} size={40 * escala} color={tema.acentoTexto(color)} progreso={tween(f, en + 6, 16, 0, 1)} grosor={4} />
                <div style={{ ...tema.t.titular, fontSize: tamPorLargo(c.titulo, 36 * escala, 14), lineHeight: 1.1, color: tema.c.texto }}>
                  {c.titulo}
                </div>
              </div>
              {c.items.map((it, i) => {
                const ki = ap(en + 8 + i * tema.mov.escalon * 2);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12 * escala,
                      alignItems: "baseline",
                      ...tema.t.cuerpo,
                      fontSize: tamPorLargo(it, 28 * escala, 24),
                      lineHeight: 1.28,
                      color: tema.c.textoSuave,
                      marginTop: 12 * escala,
                      opacity: ki,
                      transform: `translateX(${(1 - ki) * 18}px)`,
                    }}
                  >
                    <span style={{ color, fontWeight: 900 }}>•</span>
                    <span>{it}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
};

const VEREDICTO = { trampa: "TRAMPA", riesgo: "RIESGO", correcta: "CORRECTA" } as const;

const Sello: React.FC<{ texto: string; color: string; k: number; escala: number; tam?: number }> = ({ texto, color, k, escala, tam = 22 }) => {
  const tema = useTema();
  return (
    <div
      style={{
        ...tema.t.etiqueta,
        fontSize: tam * escala,
        padding: `${6 * escala}px ${14 * escala}px`,
        borderRadius: Math.min(10, tema.forma.radio * 0.4),
        background: color,
        color: tema.sobre(color),
        border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : undefined,
        whiteSpace: "nowrap",
        opacity: Math.min(1, k * 2),
        transform: `scale(${0.4 + 0.6 * k}) rotate(${(1 - k) * -14 + 3}deg)`,
      }}
    >
      {texto}
    </div>
  );
};

export const Opciones: React.FC<ContenidoProps<PanelDe<"opciones">>> = ({ ev, dur, acento, ancho, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const foco = ev.foco;
  // Sin foco no hay veredicto (antes: tween con inicio infinito → error de interpolate).
  const enFoco = foco ? Math.max(16, marcaLocal(foco.en, ev.desde, 0, 1, dur)) : null;
  const kFoco = enFoco === null ? 0 : tween(f, enFoco, 16, 0, 1, ease.power3Out);
  const sello = enFoco === null ? 0 : tween(f, enFoco + 8, 14, 0, 1, tema.mov.rebote);
  const cols = ancho >= 1000 ? 2 : 1;
  const colorVer = foco ? (foco.veredicto === "correcta" ? tema.c.ok : foco.veredicto === "riesgo" ? tema.c.aviso : tema.c.error) : acento;
  const d = cols === 1 && ev.opciones.length > 4 ? 0.85 : 1;
  const e = escala * d;
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} tamTitulo={48} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 * e }}>
        {ev.opciones.map((o, i) => {
          const k = ap(8 + i * tema.mov.escalon * 2);
          const esFoco = foco?.letra === o.letra;
          const atenua = foco && !esFoco ? 1 - 0.55 * kFoco : 1;
          return (
            <div
              key={o.letra}
              style={{
                ...tema.ficha(esFoco && kFoco > 0.5 ? colorVer : acento, esFoco && kFoco > 0.5),
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 20 * e,
                padding: `${17 * e}px ${22 * e}px`,
                opacity: k * atenua,
                transform: `translateY(${(1 - k) * 26}px) scale(${esFoco ? 1 + 0.025 * kFoco : 1})`,
              }}
            >
              <Bola n={o.letra} color={esFoco && kFoco > 0.5 ? colorVer : tema.c.linea} tam={52 * e} />
              <div style={{ ...tema.t.cuerpo, fontWeight: tema.pesoFuerte, fontSize: tamPorLargo(o.texto, 31 * e, 26), lineHeight: 1.2, color: tema.c.texto }}>
                {o.texto}
              </div>
              {esFoco && foco ? (
                <div style={{ position: "absolute", right: 18 * e, top: -16 * e }}>
                  <Sello texto={VEREDICTO[foco.veredicto]} color={colorVer} k={sello} escala={e} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
};

export const Caso: React.FC<ContenidoProps<PanelDe<"caso">>> = ({ ev, dur, acento, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const kt = ap(8);
  const en = Math.max(20, marcaLocal(ev.veredicto.en, ev.desde, 1, 2, dur));
  const sello = tween(f, en, 14, 0, 1, tema.mov.rebote);
  const color = tema.tono(ev.veredicto.tono, acento);
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div
        style={{
          ...tema.ficha(acento, false),
          position: "relative",
          padding: `${24 * escala}px ${28 * escala}px ${34 * escala}px`,
          opacity: kt,
          transform: `translateY(${(1 - kt) * 20}px)`,
        }}
      >
        <div style={{ display: "flex", gap: 18 * escala, alignItems: "flex-start" }}>
          {tema.iconoCirculo ? (
            <IconoCirculo nombre="documento" size={64 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 8, 28, 0, 1)} />
          ) : (
            <Icono nombre="documento" size={46 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 8, 24, 0, 1)} />
          )}
          <div style={{ ...tema.t.cuerpo, fontSize: tamPorLargo(ev.texto, 31 * escala, 90), lineHeight: 1.35, color: tema.c.texto }}>{ev.texto}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -18 * escala, paddingRight: 24 * escala }}>
        <Sello texto={ev.veredicto.texto.toUpperCase()} color={color} k={sello} escala={escala} tam={26} />
      </div>
    </>
  );
};
