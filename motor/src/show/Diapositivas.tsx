/**
 * Contenido de la caja de diapositiva (§7). Cada diapositiva va en su `<Sequence>` (fotograma local) y con el tema
 * de su registro; todo se maqueta en px REALES de la caja con una escala `s = ancho / 1545` (la diapositiva de la
 * disposición `grande`), sin escalar el contenido con `transform` (el texto no se reescala borroso durante las
 * transiciones de disposición).
 *
 * - titular de juego (evento `titulo`, rótulo de capítulo, intro): antetítulo + palabra enorme + subtítulo
 * - `pop` (grande → juego), `sello` (golpe, sacudida y polvo), `cifra` de juego (contador + destello)
 * - paneles de todos los `kind` con el tema del registro y ajustados al alto de la caja (se mide una vez)
 * - `escena3d` (cabecera + lienzo 3D en la caja; las etiquetas nunca se salen del lienzo)
 * - `lamina` (imagen a toda la caja con acercamiento lento y bocadillos)
 */
import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { EventoEscena3D, EventoLamina, EventoPanel, EventoPop, EventoSello, PanelDe } from "../datos/contrato";
import type { Diapo } from "../lib/escenario";
import { DIAPO_W } from "../lib/escenario";
import { acentoDe, marcaLocal } from "../lib/linea";
import { clamp01, ease, hash01, lerp, tween } from "../tema/anim";
import { useMotor, useTema } from "../tema/Motor";
import { Cabecera, tamPorLargo } from "../paneles/Base";
import { Contenido } from "../paneles/CapaPaneles";
import { Objeto3D, CON_ETIQUETAS_3D } from "../tres/catalogo";
import { Escenario } from "../tres/Escenario";
import { Bocadillo } from "./Bocadillo";
import { Estallido } from "./Destellos";
import { Antetitulo, LineaJuego, TitularJuego, ajustarJuego } from "./TitularJuego";
import { useEntradaJuego } from "./Destellos";
import { anchoTexto } from "./medir";

/** Salida de la diapositiva (fundido corto) y entrada «zoom-punch» (0,35 s). */
const useEntradaSalidaDiapo = (dur: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ds = Math.min(8, Math.max(3, Math.floor(dur / 4)));
  const entra = tween(f, 0, Math.round(0.35 * fps), 0, 1, ease.power3Out);
  const sale = tween(f, dur - ds, ds, 1, 0, ease.power2In);
  return { f, entra, sale };
};

const estiloPunch = (entra: number, sale: number): React.CSSProperties => {
  const k = Math.min(entra, sale);
  return { opacity: Math.min(1, k * 1.5), transform: k < 1 ? `scale(${0.94 + 0.06 * k})` : undefined };
};

/** ¿Este registro pinta los titulares con el tratamiento «juego»? */
const useJuego = () => {
  const tema = useTema();
  return tema.registro === "show" ? tema.show.showTitular === "juego" : tema.juego && tema.registro === "base";
};

// ——— Titular (evento titulo, rótulo de capítulo, intro) ———

export const DiapoTitular: React.FC<{ w: number; dur: number; antetitulo?: string; texto: string; subtitulo?: string; destellos?: boolean }> = ({
  w,
  dur,
  antetitulo,
  texto,
  subtitulo,
  destellos = true,
}) => {
  const tema = useTema();
  const juego = useJuego();
  const { f, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const ante = tween(f, 0, tema.mov.durEntrada + 4, 0, 1, tema.mov.ease);
  const sub = tween(f, 16, tema.mov.durEntrada + 4, 0, 1, tema.mov.ease);
  const entrada = useEntradaJuego(3);
  return (
    <AbsoluteFill
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 * s, opacity: sale, transform: sale < 1 ? `scale(${0.96 + 0.04 * sale})` : undefined }}
    >
      {antetitulo ? <Antetitulo texto={antetitulo} tam={62 * s} k={ante} /> : null}
      {juego ? (
        <TitularJuego texto={texto} tam={235 * s} anchoMax={w - 170 * s} inicio={3} destello estallido={destellos} />
      ) : (
        <div
          style={{
            ...tema.t.titular,
            fontSize: tamPorLargo(texto, 150 * s, 14),
            lineHeight: 1.02,
            color: tema.c.texto,
            textShadow: tema.sombraTitular,
            textAlign: "center",
            maxWidth: w - 170 * s,
            textWrap: "balance",
            transform: `scale(${Math.max(0.001, entrada)})`,
          }}
        >
          {texto}
        </div>
      )}
      {subtitulo ? (
        <div
          style={{
            ...tema.t.titular,
            fontSize: tamPorLargo(subtitulo, 50 * s, 40),
            lineHeight: 1.15,
            color: tema.c.texto,
            textShadow: `0 ${4 * s}px 0 ${tema.c.tinta}`,
            textTransform: "none",
            textAlign: "center",
            maxWidth: w - 220 * s,
            textWrap: "balance",
            opacity: sub,
            transform: `translateY(${(1 - sub) * 20 * s}px)`,
          }}
        >
          {subtitulo}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ——— Pop (frase clave) ———

const DiapoPop: React.FC<{ ev: EventoPop; w: number; dur: number }> = ({ ev, w, dur }) => {
  const tema = useTema();
  const juego = useJuego() && ev.grande;
  const { f, entra, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const sub = tween(f, 12, tema.mov.durEntrada + 4, 0, 1, tema.mov.ease);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 * s, ...estiloPunch(juego ? 1 : entra, sale) }}>
      {juego ? (
        <TitularJuego texto={ev.texto} tam={180 * s} anchoMax={w - 180 * s} inicio={2} />
      ) : (
        <div style={{ ...tema.t.titular, fontSize: tamPorLargo(ev.texto, (ev.grande ? 120 : 96) * s, 22), lineHeight: 1.05, color: tema.c.texto, textShadow: tema.sombraTitular, textAlign: "center", maxWidth: w - 200 * s, textWrap: "balance" }}>
          {ev.texto}
        </div>
      )}
      {ev.sub ? (
        <div
          style={{
            ...tema.t.titular,
            fontSize: tamPorLargo(ev.sub, 84 * s, 30),
            color: tema.registro === "show" ? tema.c.texto : tema.acentoTexto(tema.c.acento),
            textShadow: tema.sombraTitular,
            textTransform: tema.t.titular.textTransform ?? "none",
            opacity: sub,
            transform: `translateY(${(1 - sub) * 16 * s}px)`,
            textAlign: "center",
          }}
        >
          {ev.sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ——— Sello (EUREKA) ———

const GRADIENTES_TONO: Record<string, [string, string, string]> = {
  bad: ["#FFB3A8", "#FF5A4E", "#B3121F"],
  aviso: ["#FFE0A0", "#FF9A3C", "#C24E00"],
};

const DiapoSello: React.FC<{ ev: EventoSello; w: number; h: number; dur: number }> = ({ ev, w, h, dur }) => {
  const tema = useTema();
  const { fps } = useVideoConfig();
  const { f, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const en = 3;
  const caida = Math.round(0.24 * fps);
  const g = tween(f, en, caida, 0, 1, ease.power2In);
  const impacto = en + caida;
  const escala = lerp(2.4, 1, g);
  const giro = lerp(-24, -12, g);
  // Sacudida de 3 fotogramas tras el golpe.
  const sac = [
    [10, -6],
    [-7, 5],
    [4, -2],
  ][f - impacto] ?? [0, 0];
  const color = ev.tono === "bad" ? tema.c.error : ev.tono === "aviso" ? tema.c.aviso : tema.c.acento;
  const tam = 200 * s;
  const fam = `"${tema.show.juego.familia}", ${tema.f.titular}`;
  const a = ajustarJuego(ev.texto, tam, w * 0.66, fam, tema.show.juego.peso, 1);
  const brillo = tween(f, impacto + 6, Math.round(0.45 * fps), 0, 1);
  const polvo = clamp01((f - impacto) / Math.round(0.6 * fps));
  return (
    <AbsoluteFill style={{ opacity: sale, transform: `translate(${sac[0] * s}px, ${sac[1] * s}px)` }}>
      {f >= impacto && polvo < 1
        ? Array.from({ length: 14 }, (_, i) => {
            const r = (k: number) => hash01(i * 17 + k);
            const ang = (i / 14) * Math.PI * 2 + r(1) * 0.4;
            const d = (0.18 + 0.2 * ease.power3Out(polvo)) * w * (0.8 + 0.4 * r(2));
            const t = (6 + 8 * r(3)) * s;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: w / 2 + Math.cos(ang) * d - t / 2,
                  top: h / 2 + Math.sin(ang) * d * 0.55 - t / 2,
                  width: t,
                  height: t,
                  borderRadius: "50%",
                  background: tema.mezcla(color, "#FFFFFF", 0.3),
                  opacity: 1 - polvo,
                }}
              />
            );
          })
        : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            border: `${10 * s}px solid ${color}`,
            borderRadius: 28 * s,
            padding: `${14 * s}px ${36 * s}px`,
            boxShadow: `0 0 0 ${6 * s}px ${tema.c.tinta}, 0 ${14 * s}px 0 ${6 * s}px rgba(0,0,0,0.3)`,
            transform: `rotate(${giro}deg) scale(${escala})`,
            opacity: f < en ? 0 : Math.min(1, (f - en + 1) / 3),
          }}
        >
          <LineaJuego texto={a.lineas[0]} tam={a.tam} brillo={brillo} degradado={GRADIENTES_TONO[ev.tono]} />
        </div>
      </div>
      <Estallido cx={w / 2} cy={h / 2} radio={w * 0.36} inicio={impacto} n={6} tam={70 * s} />
    </AbsoluteFill>
  );
};

// ——— Cifra de juego (contador) ———

const formato = (v: number, dec: number) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true }).format(v);

const DiapoCifraJuego: React.FC<{ ev: PanelDe<"cifra">; w: number; h: number; dur: number }> = ({ ev, w, dur }) => {
  const tema = useTema();
  const { fps } = useVideoConfig();
  const { f, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const t0 = Math.min(8, Math.round(dur * 0.1));
  const durC = Math.max(Math.round(0.5 * fps), Math.min(Math.round(1.3 * fps), Math.round(dur * 0.4)));
  const inicio = ev.valorInicial ?? ev.contadorDesde ?? 0;
  const dec = ev.decimales ?? (Number.isInteger(ev.valor) ? 0 : 1);
  const v = tween(f, t0, durC, inicio, ev.valor, ease.power3Out);
  const fam = `"${tema.show.juego.familia}", ${tema.f.titular}`;
  const peso = tema.show.juego.peso;
  const final = formato(ev.valor, dec);
  const unidad = ev.unidad?.trim();
  const uEsPct = unidad === "%";
  // Cuerpo fijado con el valor FINAL (el contador no cambia de tamaño mientras sube).
  const anchoFinal = (tam: number) => anchoTexto(final, fam, peso, tam) + (unidad ? anchoTexto(unidad, fam, peso, tam * (uEsPct ? 0.8 : 0.45)) + tam * 0.1 : 0) + tam * 0.3;
  let tam = 300 * s;
  const maxW = w - 200 * s;
  if (anchoFinal(tam) > maxW) tam *= maxW / anchoFinal(tam);
  const e = useEntradaJuego(Math.max(0, t0 - 4));
  const brillo = tween(f, t0 + durC, Math.round(0.45 * fps), 0, 1);
  const ante = tween(f, 0, tema.mov.durEntrada + 4, 0, 1, tema.mov.ease);
  const et = tween(f, t0 + 6, tema.mov.durEntrada + 4, 0, 1, tema.mov.ease);
  const kicker = ev.kicker ?? ev.titulo;
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 * s, opacity: sale }}>
      {kicker ? <Antetitulo texto={kicker} tam={52 * s} k={ante} /> : null}
      <div style={{ position: "relative", display: "flex", alignItems: "baseline", transform: `scale(${Math.max(0.001, e)})`, opacity: Math.min(1, e * 4) }}>
        <LineaJuego texto={formato(v, dec)} tam={tam} brillo={brillo} />
        {unidad ? (
          <div style={{ marginLeft: -tam * 0.04 }}>
            <LineaJuego texto={unidad} tam={tam * (uEsPct ? 0.8 : 0.45)} brillo={brillo} />
          </div>
        ) : null}
        <Estallido cx={anchoFinal(tam) / 2} cy={tam * 0.55} radio={anchoFinal(tam) * 0.62} inicio={t0 + durC - 2} n={6} tam={tam * 0.34} />
      </div>
      <div
        style={{
          ...tema.t.titular,
          fontSize: tamPorLargo(ev.etiqueta, 48 * s, 36),
          lineHeight: 1.15,
          color: tema.c.texto,
          textShadow: `0 ${4 * s}px 0 ${tema.c.tinta}`,
          textAlign: "center",
          maxWidth: w - 220 * s,
          textWrap: "balance",
          opacity: et,
          transform: `translateY(${(1 - et) * 18 * s}px)`,
        }}
      >
        {ev.etiqueta}
      </div>
    </AbsoluteFill>
  );
};

// ——— Paneles (todos los kinds) ajustados a la caja ———

/**
 * Ajuste al alto: se mide UNA vez, al montar, el alto natural por unidad de escala (el maquetado de los paneles es
 * proporcional a `escala`) y se reduce la escala si no cabe. Determinista: no depende del fotograma.
 */
const Ajustado: React.FC<{ ancho: number; alto: number; escala: number; children: (e: number) => React.ReactNode }> = ({ ancho, alto, escala, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (ref.current && ratio === null) setRatio(ref.current.offsetHeight / Math.max(0.01, escala));
    // Solo al montar: la medida no debe cambiar con el fotograma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fit = ratio ? Math.min(1, Math.round((alto / (ratio * escala)) * 100) / 100) : 1;
  return (
    <div ref={ref} style={{ width: ancho }}>
      {children(escala * Math.max(0.55, fit))}
    </div>
  );
};

const DiapoPanel: React.FC<{ ev: EventoPanel; w: number; h: number; dur: number }> = ({ ev, w, h, dur }) => {
  const tema = useTema();
  const { timeline } = useMotor();
  const { entra, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const padX = 92 * s;
  const arriba = (tema.registro === "editorial" ? 112 : 70) * s;
  const abajo = 64 * s;
  const ancho = w - padX * 2;
  const alto = h - arriba - abajo;
  return (
    <div style={{ position: "absolute", left: padX, top: arriba, width: ancho, height: alto, display: "flex", flexDirection: "column", justifyContent: "center", ...estiloPunch(entra, sale) }}>
      <div style={{ fontFamily: tema.f.cuerpo, color: tema.c.texto }}>
        {/* `alto` también escala con el ajuste (el mapa lo usa para su altura): así todo el maquetado es proporcional. */}
        <Ajustado ancho={ancho} alto={alto} escala={1.75 * s}>
          {(e) => <Contenido ev={ev} dur={dur} acento={acento} ancho={ancho} alto={alto * 0.72 * (e / (1.75 * s))} escala={e} />}
        </Ajustado>
      </div>
    </div>
  );
};

// ——— Escena 3D en la caja ———

const DiapoEscena3D: React.FC<{ ev: EventoEscena3D; w: number; h: number; dur: number }> = ({ ev, w, h, dur }) => {
  const tema = useTema();
  const { timeline } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { entra, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const padX = 80 * s;
  const cab = ev.kicker || ev.titulo ? 205 * s : 40 * s;
  const lx = padX * 0.5;
  const ly = cab;
  const lw = w - padX;
  const lh = h - cab - 26 * s;
  const con3d = CON_ETIQUETAS_3D.has(ev.objeto);
  const etiquetas2d = !con3d && ev.etiquetas.length > 0;
  const enes = ev.etiquetas.map((e, i) => Math.max(8, marcaLocal(e.en, ev.desde, i, ev.etiquetas.length, dur)));
  const dist = ev.objeto === "cadena" ? 7.4 : 6.5;
  const fov = 35;
  const medioAlto = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * dist;
  const medioAncho = medioAlto * (lw / Math.max(1, lh));
  // Con etiquetas 2D a la izquierda (≈ 38 % del ancho), el objeto se corre a la derecha y se ajusta a lo que queda.
  const franja = etiquetas2d ? 0.38 : 0;
  const limite: [number, number] = [medioAncho * (1 - franja), medioAlto];
  const desplaza = medioAncho * franja;
  return (
    <AbsoluteFill style={estiloPunch(entra, sale)}>
      {ev.kicker || ev.titulo ? (
        <div style={{ position: "absolute", left: padX, right: padX, top: 44 * s }}>
          <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={1.25 * s} tamTitulo={52} margen={0} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: lx, top: ly, width: lw, height: lh }}>
        <Escenario width={lw} height={lh} camara={{ pos: [0, 0.6, dist], mira: [0, -0.05, 0], fov }}>
          <group position={[desplaza, 0, 0]}>
            <Objeto3D
              nombre={ev.objeto}
              t={f / fps}
              aparece={0.15}
              enes={enes.map((x) => x / fps)}
              etiquetas={con3d ? ev.etiquetas.map((e) => e.texto) : []}
              acento={acento}
              texto={ev.texto ?? ev.titulo}
              limite={limite}
            />
          </group>
        </Escenario>
      </div>
      {etiquetas2d
        ? ev.etiquetas.map((e, i) => {
            const k = tween(f, enes[i] + 2, 12, 0, 1, tema.mov.ease);
            const tamE = tamPorLargo(e.texto, 46 * s, 22);
            return (
              <div
                key={i}
                style={{
                  ...tema.ficha(acento, false),
                  position: "absolute",
                  left: padX,
                  top: ly + 20 * s + i * 112 * s,
                  maxWidth: w * 0.37,
                  padding: `${14 * s}px ${26 * s}px`,
                  boxShadow: `${tema.ficha(acento, false).boxShadow ?? ""}, inset ${5 * s}px 0 0 ${acento}`,
                  ...tema.t.cuerpo,
                  fontWeight: tema.pesoFuerte,
                  fontSize: tamE,
                  lineHeight: 1.15,
                  color: tema.c.texto,
                  opacity: k,
                  transform: `translateX(${(1 - k) * -30 * s}px)`,
                }}
              >
                {e.texto}
              </div>
            );
          })
        : null}
    </AbsoluteFill>
  );
};

// ——— Lámina (ilustración + bocadillos) ———

const DiapoLamina: React.FC<{ ev: EventoLamina; w: number; h: number; dur: number }> = ({ ev, w, h, dur }) => {
  const tema = useTema();
  const { medios } = useMotor();
  const { f, entra, sale } = useEntradaSalidaDiapo(dur);
  const s = w / DIAPO_W;
  const img = medios.extras[ev.imagen];
  if (!img) throw new Error(`lámina ${ev.id ?? ""}: falta media.extras «${ev.imagen}» en las props`);
  const [z0, z1] = ev.zoom ?? tema.show.laminaZoom;
  const z = lerp(z0, z1, ease.sineInOut(clamp01(f / Math.max(1, dur))));
  return (
    <AbsoluteFill style={{ opacity: Math.min(entra * 1.5, sale), overflow: "hidden" }}>
      <Img src={img} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, transformOrigin: "50% 45%", willChange: "transform" }} />
      {ev.bocadillos.map((b, i) => {
        const en = b.en !== undefined ? b.en - ev.desde : 8 + i * 30;
        return (
          <Bocadillo
            key={i}
            texto={b.texto}
            forma={b.forma}
            cola={b.cola}
            cx={b.x * w}
            cy={b.y * h}
            ancho={(b.ancho ?? 0.34) * w}
            tam={44 * s}
            f={f - en}
            dur={dur - en}
            contorno={Math.max(3, 5 * s)}
          />
        );
      })}
      {ev.pie ? (
        <div
          style={{
            position: "absolute",
            left: 28 * s,
            bottom: 24 * s,
            ...tema.t.etiqueta,
            fontSize: 20 * s,
            padding: `${6 * s}px ${14 * s}px`,
            borderRadius: 10 * s,
            background: "rgba(0,0,0,0.62)",
            color: "#FFFFFF",
          }}
        >
          {ev.pie}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ——— Despacho ———

export const ContenidoDiapo: React.FC<{ d: Diapo; w: number; h: number }> = ({ d, w, h }) => {
  const { timeline } = useMotor();
  const dur = d.hasta - d.desde;
  if (d.clase === "rotulo" && d.cap) {
    const c = d.cap;
    return <DiapoTitular w={w} dur={dur} antetitulo={c.kicker ?? `Paso ${c.n}`} texto={c.titulo} subtitulo={c.subtitulo} />;
  }
  if (d.clase === "intro" && timeline.intro) {
    const i = timeline.intro;
    return <DiapoTitular w={w} dur={dur} antetitulo={i.kicker} texto={i.titulo} subtitulo={i.subtitulo} />;
  }
  const ev = d.ev;
  if (!ev) return null;
  switch (ev.tipo) {
    case "titulo":
      return <DiapoTitular w={w} dur={dur} antetitulo={ev.antetitulo} texto={ev.texto} subtitulo={ev.subtitulo} destellos={ev.destellos} />;
    case "pop":
      return <DiapoPop ev={ev} w={w} dur={dur} />;
    case "sello":
      return <DiapoSello ev={ev} w={w} h={h} dur={dur} />;
    case "lamina":
      return <DiapoLamina ev={ev} w={w} h={h} dur={dur} />;
    case "escena3d":
      return <DiapoEscena3D ev={ev} w={w} h={h} dur={dur} />;
    case "panel":
      return ev.kind === "cifra" && d.registro === "show" ? <DiapoCifraJuegoSiToca ev={ev} w={w} h={h} dur={dur} /> : <DiapoPanel ev={ev} w={w} h={h} dur={dur} />;
    default:
      return null;
  }
};

/** Cifra en show: contador de juego si el registro lo pide; si no, el panel normal. */
const DiapoCifraJuegoSiToca: React.FC<{ ev: PanelDe<"cifra">; w: number; h: number; dur: number }> = (p) => {
  const juego = useJuego();
  return juego ? <DiapoCifraJuego {...p} /> : <DiapoPanel {...p} />;
};
