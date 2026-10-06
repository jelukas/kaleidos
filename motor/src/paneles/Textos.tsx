/** Paneles de texto destacado: cifra (con contador), cita, clave y tarjeta. */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { PanelDe } from "../datos/contrato";
import { ease, tween } from "../tema/anim";
import { momentoDicho } from "../lib/linea";
import { useMotor, useTema } from "../tema/Motor";
import type { ContenidoProps } from "./Base";
import { Cabecera, tamPorLargo, useAparece } from "./Base";
import { Icono, IconoCirculo } from "./Iconos";

const formato = (v: number, dec: number) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true }).format(v);

export const Cifra: React.FC<ContenidoProps<PanelDe<"cifra">>> = ({ ev, dur, acento, ancho, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ap = useAparece();
  const inicio = ev.valorInicial ?? ev.contadorDesde ?? 0;
  const dec = ev.decimales ?? (Number.isInteger(ev.valor) ? 0 : 1);
  // En eventos cortos (dora-v2 e43: 48 f) el contador empezaba en el f10 y acababa justo cuando salía el panel:
  // ahora entra antes y dura como mucho el 40 % del evento (el valor final se ve al menos la mitad del tiempo).
  const t0 = Math.min(10, Math.round(dur * 0.12));
  const durC = Math.max(Math.round(0.5 * fps), Math.min(Math.round(1.3 * fps), Math.round(dur * 0.4)));
  const v = tween(f, t0, durC, inicio, ev.valor, ease.power3Out);
  const k = ap(Math.max(0, t0 - 4));
  const esPct = ev.unidad?.trim() === "%";
  const pct = esPct ? Math.max(0, Math.min(1, v / 100)) : 0;
  const texto = formato(v, dec);
  const tam = Math.min(190 * escala, (ancho * 0.9) / Math.max(2.2, texto.length * 0.62 + (ev.unidad ? ev.unidad.length * 0.35 : 0)));
  const aro = 150 * escala;
  const col = tema.acentoTexto(acento);
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", alignItems: "center", gap: 34 * escala, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
        {esPct ? (
          <svg width={aro} height={aro} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <circle cx={50} cy={50} r={42} stroke={tema.alpha(tema.c.textoSuave, 0.25)} strokeWidth={10} fill="none" />
            <circle
              cx={50}
              cy={50}
              r={42}
              stroke={acento}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - pct}
              transform="rotate(-90 50 50)"
            />
          </svg>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              ...tema.t.titular,
              fontSize: tam,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: tema.c.texto,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {texto}
            {ev.unidad ? <span style={{ color: col, fontSize: tam * 0.42, marginLeft: tam * 0.08 }}>{ev.unidad}</span> : null}
          </div>
          <div
            style={{
              ...tema.t.cuerpo,
              fontWeight: tema.pesoFuerte,
              marginTop: 14 * escala,
              fontSize: tamPorLargo(ev.etiqueta, 32 * escala, 40),
              lineHeight: 1.25,
              color: tema.c.textoSuave,
              textWrap: "balance",
            }}
          >
            {ev.etiqueta}
          </div>
        </div>
      </div>
    </>
  );
};

const limpiar = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:¡!¿?«»"“”()]/g, "");

/**
 * Texto con palabras resaltadas; `modo` marcador (cita) o color + subrayado (clave). En el registro editorial
 * (`tema.resaltado === "encender"`) las palabras pasan de blanco a oro con un subrayado que se barre. `enes`:
 * fotograma local de cada frase de `resalta` (cuando la voz la dice, de los subtítulos); si falta, en orden.
 */
const TextoResaltado: React.FC<{ texto: string; resalta: string[]; tam: number; acento: string; modo: "marcador" | "subrayado"; inicio: number; enes?: (number | undefined)[] }> = ({
  texto,
  resalta,
  tam,
  acento,
  modo: modoPedido,
  inicio,
  enes = [],
}) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const palabras = texto.split(/\s+/);
  // Se resaltan FRASES completas (secuencias de palabras consecutivas), no palabras sueltas.
  const limpias = palabras.map(limpiar);
  const marcadas = new Set<number>();
  const fraseDe = new Map<number, number>();
  resalta.forEach((r, ri) => {
    const frase = r.split(/\s+/).map(limpiar).filter(Boolean);
    if (!frase.length) return;
    for (let i = 0; i + frase.length <= limpias.length; i++) {
      if (frase.every((w, j) => limpias[i + j] === w))
        for (let j = 0; j < frase.length; j++) {
          marcadas.add(i + j);
          fraseDe.set(i + j, ri);
        }
    }
  });
  const encender = tema.resaltado === "encender";
  const modo = encender ? "subrayado" : modoPedido;
  let orden = 0;
  return (
    <div style={{ ...tema.t.titular, fontSize: tam, lineHeight: 1.22, color: tema.c.texto, textWrap: "balance" }}>
      {palabras.map((p, i) => {
        const res = marcadas.has(i);
        const kp = ap(inicio + i * 1.4, 10);
        const o = res ? orden++ : 0;
        const dicho = res ? enes[fraseDe.get(i) ?? -1] : undefined;
        const t = dicho !== undefined ? Math.max(inicio + 4, dicho) + o * 2 : inicio + palabras.length * 1.4 + 6 + o * 6;
        const m = res ? tween(f, t, encender ? 10 : 14, 0, 1, ease.power2Out) : 0;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", marginRight: tam * 0.26, opacity: kp }}>
            {res && modo === "marcador" ? (
              <span
                style={{
                  position: "absolute",
                  left: -tam * 0.08,
                  right: -tam * 0.08,
                  bottom: tam * 0.06,
                  height: "40%",
                  background: tema.alpha(acento, tema.oscuro ? 0.55 : 0.35),
                  borderRadius: 6,
                  transformOrigin: "left",
                  transform: `scaleX(${m})`,
                }}
              />
            ) : null}
            {res && modo === "subrayado" ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -tam * 0.04,
                  height: Math.max(4, tam * 0.07),
                  background: acento,
                  borderRadius: 4,
                  transformOrigin: "left",
                  transform: `scaleX(${m})`,
                }}
              />
            ) : null}
            <span style={{ position: "relative", color: res && modo === "subrayado" ? (encender ? tema.mezcla(tema.c.texto, tema.acentoTexto(acento), m) : tema.acentoTexto(acento)) : undefined }}>{p}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Fotograma local en que la voz dice cada frase de `resalta` (o undefined). */
const useEnesResalta = (ev: { resalta: string[]; desde: number; hasta: number }) => {
  const { timeline } = useMotor();
  return ev.resalta.map((r) => {
    const m = momentoDicho(timeline, r, ev.desde, ev.hasta);
    return m === null ? undefined : m - ev.desde;
  });
};

export const Cita: React.FC<ContenidoProps<PanelDe<"cita">>> = ({ ev, acento, escala }) => {
  const tema = useTema();
  const ap = useAparece();
  const k = ap(2);
  const enes = useEnesResalta(ev);
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} margen={10} />
      <div style={{ ...tema.t.titular, fontSize: 150 * escala, lineHeight: 0.62, height: 70 * escala, color: tema.acentoTexto(acento), opacity: k }}>“</div>
      <TextoResaltado texto={ev.texto} resalta={ev.resalta} tam={tamPorLargo(ev.texto, 54 * escala, 60)} acento={acento} modo="marcador" inicio={6} enes={enes} />
    </>
  );
};

export const Clave: React.FC<ContenidoProps<PanelDe<"clave">>> = ({ ev, acento, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const enes = useEnesResalta(ev);
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", gap: 26 * escala, alignItems: "flex-start" }}>
        {tema.iconoCirculo ? (
          <IconoCirculo nombre="llave" size={84 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 4, 26, 0, 1)} />
        ) : (
        <div
          style={{
            flexShrink: 0,
            width: 84 * escala,
            height: 84 * escala,
            borderRadius: tema.estiloPanel === "tinta" ? 14 : 42 * escala,
            background: tema.alpha(acento, 0.16),
            border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icono nombre="llave" size={50 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 4, 22, 0, 1)} />
        </div>
        )}
        <TextoResaltado texto={ev.texto} resalta={ev.resalta} tam={tamPorLargo(ev.texto, 50 * escala, 52)} acento={acento} modo="subrayado" inicio={6} enes={enes} />
      </div>
    </>
  );
};

export const Tarjeta: React.FC<ContenidoProps<PanelDe<"tarjeta">>> = ({ ev, acento, escala }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const ap = useAparece();
  const k = ap(6);
  return (
    <>
      <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={escala} />
      <div style={{ display: "flex", gap: 30 * escala, alignItems: "center", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
        {ev.icono && tema.iconoCirculo ? (
          <IconoCirculo nombre={ev.icono} size={132 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 6, 30, 0, 1)} />
        ) : ev.icono ? (
          <div
            style={{
              flexShrink: 0,
              width: 132 * escala,
              height: 132 * escala,
              borderRadius: tema.estiloPanel === "tinta" ? 18 : tema.forma.radio,
              background: tema.alpha(acento, 0.14),
              border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : `2px solid ${tema.alpha(acento, 0.4)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icono nombre={ev.icono} size={84 * escala} color={tema.acentoTexto(acento)} progreso={tween(f, 6, 26, 0, 1)} grosor={2.6} />
          </div>
        ) : null}
        <div style={{ ...tema.t.cuerpo, fontWeight: tema.pesoFuerte, fontSize: tamPorLargo(ev.texto, 42 * escala, 60), lineHeight: 1.25, color: tema.c.texto, textWrap: "balance" }}>
          {ev.texto}
        </div>
      </div>
    </>
  );
};
