import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Grafico, Icono } from "../datos/tipos";
import { COLOR, ease, FONT, FPS, kickerStyle, tween } from "../tema";
import { IconoAnimado } from "./Iconos";

// `marca(s)` convierte un instante de la fuente (s) en fotograma local del gráfico.
export type Marca = (s: number) => number;
type GProps<T extends Grafico["tipo"]> = { g: Extract<Grafico, { tipo: T }>; marca: Marca; dur: number; ancho: number };

const aparecer = (f: number, en: number, dur = 14) =>
  interpolate(f, [en, en + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.power3Out });

export const Cabecera: React.FC<{ kicker: string; titulo?: string; f: number; tam?: number }> = ({ kicker, titulo, f, tam = 60 }) => {
  const k = aparecer(f, 2, 16);
  const t = aparecer(f, 6, 18);
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ ...kickerStyle, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>{kicker}</div>
      <div
        style={{
          width: 96,
          height: 6,
          margin: "20px 0 22px",
          background: COLOR.accent,
          transformOrigin: "left",
          transform: `scaleX(${k})`,
        }}
      />
      {titulo ? (
        <div
          style={{
            fontSize: tam,
            fontWeight: 900,
            lineHeight: 1.08,
            color: COLOR.fg,
            textWrap: "balance",
            opacity: t,
            transform: `translateY(${(1 - t) * 30}px)`,
          }}
        >
          {titulo}
        </div>
      ) : null}
    </div>
  );
};

// ——— Lista: cada viñeta aparece cuando se enumera; la última dicha queda resaltada ———
export const Lista: React.FC<GProps<"lista">> = ({ g, marca }) => {
  const f = useCurrentFrame();
  const enes = g.items.map((it) => Math.max(10, marca(it.en)));
  const actual = enes.findLastIndex((e) => f >= e);
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} titulo={g.titulo} f={f} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {g.items.map((it, i) => {
          const k = aparecer(f, enes[i]);
          const on = i === actual;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "18px 26px",
                borderRadius: 16,
                background: on ? "rgba(76,141,255,0.16)" : "rgba(13,37,82,0.6)",
                boxShadow: on ? `inset 0 0 0 2px ${COLOR.accent}` : "inset 0 0 0 1px rgba(76,141,255,0.25)",
                opacity: k,
                transform: `translateX(${(1 - k) * 60}px)`,
              }}
            >
              {it.icono ? (
                <IconoAnimado icono={it.icono} size={52} progreso={tween(f, enes[i], 20, 0, 1)} color={on ? COLOR.accent : COLOR.muted} />
              ) : (
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    background: on ? COLOR.accent : COLOR.line,
                    color: COLOR.fg,
                    fontSize: 24,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
              )}
              <div style={{ fontSize: 36, fontWeight: on ? 700 : 400, color: on ? COLOR.fg : COLOR.muted, lineHeight: 1.25 }}>
                {it.texto}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Pasos: diagrama de flujo que se construye paso a paso con flechas ———
export const Pasos: React.FC<GProps<"pasos">> = ({ g, marca, ancho }) => {
  const f = useCurrentFrame();
  const n = g.pasos.length;
  const enes = g.pasos.map((p) => Math.max(10, marca(p.en)));
  const vertical = ancho < 1100;
  const gap = vertical ? 22 : 56;
  const cajaW = vertical ? ancho - 40 : (ancho - (n - 1) * gap) / n;
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} titulo={g.titulo} f={f} />
      <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap, alignItems: "stretch" }}>
        {g.pasos.map((p, i) => {
          const k = aparecer(f, enes[i]);
          const flecha = i < n - 1 ? tween(f, enes[i + 1] - 10, 12, 0, 1, ease.power2Out) : 0;
          return (
            <div key={i} style={{ position: "relative", width: cajaW, flexShrink: 0 }}>
              <div
                style={{
                  height: "100%",
                  padding: vertical ? "14px 22px" : "30px 26px",
                  borderRadius: 18,
                  background: COLOR.panel,
                  boxShadow: `inset 0 0 0 2px ${k > 0.99 && f < (enes[i + 1] ?? 1e9) ? COLOR.accent : "rgba(76,141,255,0.3)"}`,
                  display: "flex",
                  flexDirection: vertical ? "row" : "column",
                  alignItems: vertical ? "center" : "flex-start",
                  gap: 18,
                  opacity: k,
                  transform: `translateY(${(1 - k) * 40}px) scale(${0.94 + 0.06 * k})`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      background: COLOR.accent,
                      color: COLOR.fg,
                      fontWeight: 900,
                      fontSize: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                  {p.icono ? <IconoAnimado icono={p.icono} size={48} progreso={tween(f, enes[i] + 4, 20, 0, 1)} /> : null}
                </div>
                <div style={{ fontSize: vertical ? 30 : 32, fontWeight: 700, color: COLOR.fg, lineHeight: 1.22 }}>{p.texto}</div>
              </div>
              {i < n - 1 ? (
                vertical ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 50,
                      bottom: -gap,
                      width: 4,
                      height: gap,
                      background: COLOR.accent,
                      transformOrigin: "top",
                      transform: `scaleY(${flecha})`,
                    }}
                  />
                ) : (
                  <svg
                    width={gap}
                    height={30}
                    style={{ position: "absolute", right: -gap, top: "50%", marginTop: -15, overflow: "visible" }}
                  >
                    <path
                      d={`M4 15 H${gap - 10} M${gap - 20} 5 L${gap - 8} 15 L${gap - 20} 25`}
                      stroke={COLOR.accent}
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - flecha}
                    />
                  </svg>
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Comparativa en dos columnas ———
const tonoColor = { ok: COLOR.ok, bad: COLOR.bad, neutro: COLOR.accent } as const;
const tonoIcono: Record<"ok" | "bad" | "neutro", Icono> = { ok: "check", bad: "cruz", neutro: "check" };

export const Comparativa: React.FC<GProps<"comparativa">> = ({ g, marca }) => {
  const f = useCurrentFrame();
  const cols = [g.izq, g.der];
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} f={f} />
      <div style={{ display: "flex", gap: 34 }}>
        {cols.map((c, ci) => {
          const en = Math.max(8, marca(c.en));
          const k = aparecer(f, en, 16);
          const color = tonoColor[c.tono];
          return (
            <div
              key={ci}
              style={{
                flex: 1,
                borderRadius: 22,
                padding: "30px 32px 34px",
                background: COLOR.panel,
                boxShadow: `inset 0 0 0 2px ${color}55`,
                opacity: k,
                transform: `translateY(${(1 - k) * 50}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
                <IconoAnimado icono={tonoIcono[c.tono]} size={48} color={color} progreso={tween(f, en + 6, 16, 0, 1)} />
                <div style={{ fontSize: 40, fontWeight: 900, color: COLOR.fg, lineHeight: 1.1 }}>{c.titulo}</div>
              </div>
              {c.items.map((it, i) => {
                const ki = aparecer(f, en + 10 + i * 8);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "baseline",
                      fontSize: 31,
                      color: COLOR.muted,
                      lineHeight: 1.3,
                      marginTop: 14,
                      opacity: ki,
                      transform: `translateX(${(1 - ki) * 20}px)`,
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
    </div>
  );
};

// ——— Opciones de respuesta (A/B/C/D) con veredicto sobre la que se analiza ———
const VEREDICTO = {
  trampa: { texto: "TRAMPA", color: COLOR.bad },
  riesgo: { texto: "RIESGO", color: COLOR.warn },
  correcta: { texto: "CORRECTA", color: COLOR.ok },
} as const;

export const Opciones: React.FC<GProps<"opciones">> = ({ g, marca, ancho }) => {
  const f = useCurrentFrame();
  const foco = g.foco;
  const enFoco = foco ? Math.max(16, marca(foco.en)) : 1e9;
  const kFoco = tween(f, enFoco, 16, 0, 1, ease.power3Out);
  const sello = tween(f, enFoco + 10, 14, 0, 1, ease.backOut);
  const cols = ancho > 1100 ? 2 : 1;
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} titulo={g.titulo} f={f} tam={52} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
        {g.opciones.map((o, i) => {
          const k = aparecer(f, 10 + i * 5);
          const esFoco = foco?.letra === o.letra;
          const atenua = foco ? 1 - 0.55 * kFoco * (esFoco ? 0 : 1) : 1;
          const v = foco ? VEREDICTO[foco.veredicto] : null;
          return (
            <div
              key={o.letra}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: "22px 26px",
                borderRadius: 18,
                background: esFoco ? "rgba(76,141,255,0.18)" : COLOR.panel,
                boxShadow: esFoco && v ? `inset 0 0 0 ${2 + 1 * kFoco}px ${v.color}` : "inset 0 0 0 1px rgba(76,141,255,0.3)",
                opacity: k * atenua,
                transform: `translateY(${(1 - k) * 30}px) scale(${esFoco ? 1 + 0.03 * kFoco : 1})`,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 14,
                  background: esFoco ? COLOR.accent : COLOR.line,
                  color: COLOR.fg,
                  fontSize: 32,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {o.letra}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: COLOR.fg, lineHeight: 1.2 }}>{o.texto}</div>
              {esFoco && v ? (
                <div
                  style={{
                    position: "absolute",
                    right: 22,
                    top: -18,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: v.color,
                    color: COLOR.deep,
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    transform: `scale(${sello}) rotate(${(1 - sello) * -12 + 3}deg)`,
                  }}
                >
                  {v.texto}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Cifras con contador ———
export const Contador: React.FC<GProps<"contador">> = ({ g, marca }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} f={f} />
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        {g.cifras.map((c, i) => {
          const en = Math.max(8, marca(c.en));
          const k = aparecer(f, en);
          const v = tween(f, en, 1.1 * FPS, 0, c.valor, ease.power3Out);
          return (
            <div
              key={i}
              style={{
                minWidth: 300,
                padding: "30px 36px",
                borderRadius: 22,
                background: COLOR.panel,
                boxShadow: "inset 0 0 0 1px rgba(76,141,255,0.35)",
                opacity: k,
                transform: `translateY(${(1 - k) * 40}px)`,
              }}
            >
              <div style={{ fontSize: 128, fontWeight: 900, lineHeight: 1, color: COLOR.fg, fontVariantNumeric: "tabular-nums" }}>
                {c.prefijo ?? ""}
                {Math.round(v)}
                <span style={{ color: COLOR.accent, fontSize: 54, marginLeft: 8 }}>{c.sufijo ?? ""}</span>
              </div>
              <div style={{ marginTop: 16, fontSize: 30, fontWeight: 700, color: COLOR.muted, maxWidth: 420, lineHeight: 1.25 }}>
                {c.etiqueta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Línea de tiempo del proceso ———
const marcaColor = { ok: COLOR.ok, bad: COLOR.bad, warn: COLOR.warn } as const;

export const LineaProceso: React.FC<GProps<"linea">> = ({ g, marca, ancho }) => {
  const f = useCurrentFrame();
  const n = g.hitos.length;
  const enes = g.hitos.map((h) => Math.max(10, marca(h.en)));
  const W = ancho - 40;
  const paso = W / (n - 1 || 1);
  const progresoLinea = interpolate(f, [enes[0], enes[n - 1] + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} titulo={g.titulo} f={f} />
      <div style={{ position: "relative", height: 330, marginTop: 20 }}>
        <div style={{ position: "absolute", left: 20, right: 20, top: 120, height: 4, background: COLOR.line }} />
        <div
          style={{
            position: "absolute",
            left: 20,
            width: W * progresoLinea,
            top: 120,
            height: 4,
            background: COLOR.accent,
          }}
        />
        {g.hitos.map((h, i) => {
          const k = aparecer(f, enes[i], 12);
          const c = h.marca ? marcaColor[h.marca] : COLOR.accent;
          const x = 20 + i * paso;
          const arriba = i % 2 === 0;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: x - 18,
                  top: 104,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: COLOR.bg,
                  border: `6px solid ${c}`,
                  transform: `scale(${k})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: Math.max(0, Math.min(W - 280, x - 150)),
                  width: 300,
                  top: arriba ? 0 : 168,
                  height: arriba ? 90 : undefined,
                  display: "flex",
                  alignItems: arriba ? "flex-end" : "flex-start",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: COLOR.fg,
                  opacity: k,
                  transform: `translateY(${(1 - k) * (arriba ? -16 : 16)}px)`,
                }}
              >
                {h.texto}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Mapa conceptual: nodo central y ramas que se dibujan ———
export const Mapa: React.FC<GProps<"mapa">> = ({ g, marca, ancho }) => {
  const f = useCurrentFrame();
  const W = ancho;
  const H = 640;
  const cx = W / 2;
  const cy = H / 2 + 10;
  const n = g.ramas.length;
  const kc = aparecer(f, 6, 16);
  const rx = Math.min(W / 2 - 170, 470);
  const ry = 230;
  return (
    <div style={{ fontFamily: FONT }}>
      <Cabecera kicker={g.kicker} f={f} />
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {g.ramas.map((r, i) => {
            const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
            const x = cx + Math.cos(a) * rx;
            const y = cy + Math.sin(a) * ry;
            const k = tween(f, Math.max(10, marca(r.en)) - 4, 12, 0, 1, ease.power2Out);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + (x - cx) * k}
                y2={cy + (y - cy) * k}
                stroke={COLOR.accent}
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
            left: cx - 170,
            top: cy - 70,
            width: 340,
            height: 140,
            borderRadius: 70,
            background: COLOR.accent,
            color: COLOR.fg,
            fontSize: 38,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            lineHeight: 1.1,
            padding: "0 26px",
            boxShadow: "0 0 80px rgba(76,141,255,0.45)",
            transform: `scale(${kc})`,
          }}
        >
          {g.centro}
        </div>
        {g.ramas.map((r, i) => {
          const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
          const x = cx + Math.cos(a) * rx;
          const y = cy + Math.sin(a) * ry;
          const k = aparecer(f, Math.max(10, marca(r.en)) + 6, 12);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - 150,
                top: y - 45,
                width: 300,
                minHeight: 90,
                padding: "14px 18px",
                borderRadius: 16,
                background: COLOR.panel,
                boxShadow: `inset 0 0 0 2px ${COLOR.accent}88`,
                color: COLOR.fg,
                fontSize: 27,
                fontWeight: 700,
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                opacity: k,
                transform: `scale(${0.8 + 0.2 * k})`,
              }}
            >
              {r.texto}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ——— Cita destacada con subrayado de rotulador ———
export const Cita: React.FC<GProps<"cita">> = ({ g }) => {
  const f = useCurrentFrame();
  const palabras = g.texto.split(" ");
  const k = aparecer(f, 4, 18);
  let idxResalta = 0;
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ ...kickerStyle, opacity: k }}>{g.kicker}</div>
      <div style={{ fontSize: 150, fontWeight: 900, color: COLOR.accent, lineHeight: 0.6, marginTop: 40, opacity: k }}>“</div>
      <div style={{ fontSize: 60, fontWeight: 900, color: COLOR.fg, lineHeight: 1.22, textWrap: "balance" }}>
        {palabras.map((p, i) => {
          const limpia = p.replace(/[.,;:¡!¿?]/g, "").toLowerCase();
          const resaltada = g.resalta.some((r) => r.toLowerCase().split(" ").includes(limpia));
          const kp = aparecer(f, 8 + i * 1.6, 10);
          const orden = resaltada ? idxResalta++ : 0;
          const marcador = resaltada ? tween(f, 26 + orden * 6, 14, 0, 1, ease.power2Out) : 0;
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", marginRight: 16, opacity: kp }}>
              {resaltada ? (
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    right: -6,
                    bottom: 4,
                    height: "42%",
                    background: COLOR.accent,
                    opacity: 0.55,
                    transformOrigin: "left",
                    transform: `scaleX(${marcador})`,
                    borderRadius: 6,
                  }}
                />
              ) : null}
              <span style={{ position: "relative" }}>{p}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ——— Palabra clave junto a la ponente (en pantalla completa) ———
export const Clave: React.FC<GProps<"clave">> = ({ g, dur }) => {
  const f = useCurrentFrame();
  const k = Math.min(tween(f, 0, 12, 0, 1, ease.backOut), tween(f, dur - 10, 10, 1, 0, ease.power2Out));
  const barra = tween(f, 4, 14, 0, 1, ease.power3Out);
  const lado = g.lado ?? "der";
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        [lado === "der" ? "right" : "left"]: 80,
        maxWidth: 580,
        fontFamily: FONT,
        transform: `scale(${0.7 + 0.3 * k})`,
        transformOrigin: lado === "der" ? "right center" : "left center",
        opacity: Math.min(1, k * 1.4),
      }}
    >
      <div
        style={{
          padding: "26px 34px 30px",
          borderRadius: 20,
          background: COLOR.bg,
          boxShadow: "0 30px 70px rgba(4,12,31,0.35)",
          borderLeft: `8px solid ${COLOR.accent}`,
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 900, color: COLOR.fg, lineHeight: 1.08, textWrap: "balance" }}>{g.texto}</div>
        {g.sub ? (
          <div
            style={{
              marginTop: 14,
              fontSize: 28,
              fontWeight: 400,
              color: COLOR.muted,
              lineHeight: 1.3,
              clipPath: `inset(0 ${(1 - barra) * 100}% 0 0)`,
            }}
          >
            {g.sub}
          </div>
        ) : null}
      </div>
    </div>
  );
};
