/**
 * Titular de juego (estilo.md › titulo-juego; receta de `muestrarios/comun.css`): TRES CAPAS DE TEXTO apiladas,
 * sin `paint-order` (no es fiable en texto HTML en todas las versiones de Chrome):
 *
 *   1. contorno blanco  → `-webkit-text-stroke` grueso blanco + sombra dura (text-shadow sin desenfoque)
 *   2. contorno de tinta → trazo a la mitad, en el color de tinta
 *   3. relleno           → degradado oro-claro → acento → naranja con `background-clip: text`
 *   (+ brillo interior y destello diagonal, también con `background-clip: text`)
 *
 * El trazo va centrado en el contorno del glifo: la capa 3 tapa su mitad interior, así que se ven dos anillos
 * iguales (tinta y blanco) de c/4 cada uno. Entrada: escala 0 → 1,12 → 1 en 0,7 s; destello diagonal 0,4 s
 * después y estallido de destellos alrededor.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import { Estallido, useEntradaJuego } from "./Destellos";
import { anchoTexto, enDosLineas } from "./medir";

const recorteTexto: React.CSSProperties = {
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

/** Capas de una línea de texto «juego» (sin animación). */
export const LineaJuego: React.FC<{ texto: string; tam: number; brillo?: number; degradado?: [string, string, string] }> = ({ texto, tam, brillo = -1, degradado }) => {
  const tema = useTema();
  const j = tema.show.juego;
  const [g0, g1, g2] = degradado ?? j.degradado;
  const c = tam * 0.15;
  const base: React.CSSProperties = {
    fontFamily: `"${j.familia}", ${tema.f.titular}`,
    fontWeight: j.peso,
    fontSize: tam,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  };
  const capa: React.CSSProperties = { position: "absolute", left: c / 2, top: 0 };
  const p = brillo * 140 - 20; // posición de la banda de luz (−20 % → 120 %)
  return (
    <div style={{ position: "relative", ...base, padding: `0 ${c / 2}px` }}>
      <span style={{ position: "relative", display: "block", color: "#FFFFFF", WebkitTextStroke: `${c}px #FFFFFF`, textShadow: `0 ${tam * 0.065}px 0 rgba(0,0,0,0.35)` }}>{texto}</span>
      <span style={{ ...capa, color: tema.c.tinta, WebkitTextStroke: `${c * 0.5}px ${tema.c.tinta}` }}>{texto}</span>
      <span style={{ ...capa, ...recorteTexto, backgroundImage: `linear-gradient(180deg, ${g0} 12%, ${g1} 50%, ${g2} 92%)` }}>{texto}</span>
      <span style={{ ...capa, ...recorteTexto, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.55) 8%, rgba(255,255,255,0) 40%)" }}>{texto}</span>
      {brillo > 0 && brillo < 1 ? (
        <span
          style={{
            ...capa,
            ...recorteTexto,
            backgroundImage: `linear-gradient(115deg, rgba(255,255,255,0) ${p - 14}%, rgba(255,255,255,0.95) ${p}%, rgba(255,255,255,0) ${p + 14}%)`,
          }}
        >
          {texto}
        </span>
      ) : null}
    </div>
  );
};

/** Cuerpo que cabe en `anchoMax` (medido con la fuente cargada) y reparto en 1 o 2 líneas. */
export const ajustarJuego = (texto: string, tam: number, anchoMax: number, familia: string, peso: number, lineasMax = 2) => {
  const ancho = (t: string, s: number) => anchoTexto(t, familia, peso, s, -0.01) + s * 0.15;
  let lineas = [texto];
  let s = Math.min(tam, (tam * anchoMax) / Math.max(1, ancho(texto, tam)));
  if (lineasMax > 1 && s < tam * 0.62 && /\s/.test(texto)) {
    const dos = enDosLineas(texto, familia, peso, tam);
    const s2 = Math.min(tam * 0.8, (tam * anchoMax) / Math.max(1, ...dos.map((l) => ancho(l, tam))));
    if (s2 > s) {
      lineas = dos;
      s = s2;
    }
  }
  return { lineas, tam: s };
};

export const TitularJuego: React.FC<{
  texto: string;
  tam: number;
  anchoMax: number;
  inicio?: number; // fotograma local de la entrada
  destello?: boolean;
  estallido?: boolean;
  lineasMax?: number;
  sinEntrada?: boolean;
  degradado?: [string, string, string];
}> = ({ texto, tam, anchoMax, inicio = 0, destello = true, estallido = true, lineasMax = 2, sinEntrada, degradado }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const j = tema.show.juego;
  const fam = `"${j.familia}", ${tema.f.titular}`;
  const a = ajustarJuego(texto, tam, anchoMax, fam, j.peso, lineasMax);
  const entrada = useEntradaJuego(inicio);
  const s = sinEntrada ? 1 : entrada;
  const brillo = destello ? tween(f, inicio + Math.round(1.1 * fps), Math.round(0.45 * fps), 0, 1) : -1;
  const alto = a.tam * 1.1 * a.lineas.length;
  const anchoReal = Math.max(...a.lineas.map((l) => anchoTexto(l, fam, j.peso, a.tam, -0.01) + a.tam * 0.15));
  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${Math.max(0.001, s)})`,
          transformOrigin: "50% 55%",
          opacity: Math.min(1, s * 4),
        }}
      >
        {a.lineas.map((l, i) => (
          <LineaJuego key={i} texto={l} tam={a.tam} brillo={brillo} degradado={degradado} />
        ))}
      </div>
      {estallido ? <Estallido cx={anchoReal / 2} cy={alto / 2} radio={Math.max(anchoReal, alto) * 0.62} inicio={inicio + Math.round(0.28 * fps)} n={6} tam={a.tam * 0.42} /> : null}
    </div>
  );
};

/** Antetítulo del registro show («El método»): redonda gruesa blanca, sombra dura y subrayado dorado redondeado. */
export const Antetitulo: React.FC<{ texto: string; tam: number; k: number }> = ({ texto, tam, k }) => {
  const tema = useTema();
  const [g0, g1] = tema.show.juego.degradado;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * tam * 0.4}px)` }}>
      <div style={{ ...tema.t.titular, fontSize: tam, lineHeight: 1.1, color: tema.c.texto, textShadow: `0 ${tam * 0.08}px 0 ${tema.c.tinta}`, whiteSpace: "nowrap" }}>{texto}</div>
      <div
        style={{
          marginTop: tam * 0.1,
          height: Math.max(4, tam * 0.16),
          width: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${g1}, ${g0}, ${g1})`,
          boxShadow: `0 ${tam * 0.06}px 0 ${tema.c.tinta}`,
          transformOrigin: "center",
          transform: `scaleX(${k})`,
        }}
      />
    </div>
  );
};
