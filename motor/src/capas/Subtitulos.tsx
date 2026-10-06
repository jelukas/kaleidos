/**
 * Subtítulos palabra a palabra (páginas de `timeline.subtitulos`), con la palabra activa en el acento del
 * capítulo. Estilos: caja | contorno | limpio (`tokens.subtitulos.estilo`); palabra activa: acento | fondo |
 * subrayado (`tokens.subtitulos.palabraActiva`).
 * Cuando hay un panel, rótulo o pop, se centran bajo el ponente para no pisar el gráfico.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Timeline } from "../datos/contrato";
import { camaraEn } from "../lib/camara";
import { estadoEscenario } from "../lib/escenario";
import { acentoDe } from "../lib/linea";
import { ease } from "../tema/anim";
import { useMotor } from "../tema/Motor";

/** Columna libre para los subtítulos: bajo el ponente si hay algo en el otro lado. */
const columna = (tl: Timeline, f: number, ancho: number, vertical: boolean) => {
  if (vertical) {
    const ocupada =
      (tl.intro && f >= tl.intro.desde && f < tl.intro.hasta) ||
      tl.capitulos.some((c) => f >= c.desde && f < c.rotuloHasta) ||
      tl.eventos.some((e) => (e.tipo === "panel" || e.tipo === "escena3d") && f >= e.desde - 4 && f < e.hasta + 4);
    return { cx: ancho / 2, w: ancho - 120, abajo: !ocupada };
  }
  const lateral = (lado: string | undefined) => (lado === "izq" ? { cx: 1440, w: 820 } : { cx: 480, w: 820 });
  if (tl.intro && f >= tl.intro.desde && f < tl.intro.hasta) return lateral("izq");
  if (tl.capitulos.some((c) => f >= c.desde && f < c.rotuloHasta)) return lateral("izq");
  for (const e of tl.eventos) {
    if (f < e.desde - 4 || f >= e.hasta + 4) continue;
    if (e.tipo === "panel" || e.tipo === "escena3d") return e.lado === "centro" ? { cx: 960, w: 1400 } : lateral(e.lado);
    if (e.tipo === "pop") {
      const lado = e.lado ?? (camaraEn(tl, e.desde, { ancho: 1920, alto: 1080, vertical: false }).tx < 960 ? "der" : "izq");
      return lado === "centro" ? { cx: 960, w: 1400 } : lateral(lado);
    }
  }
  return { cx: ancho / 2, w: 1400 };
};

export const Subtitulos: React.FC = () => {
  const { timeline: tl, tema, lienzo, escenario, esc } = useMotor();
  const f = useCurrentFrame();
  if (tl.outro && f >= tl.outro.desde - 6) return null;
  // La apertura de marca va sin subtítulos (el original es música y montaje).
  if (esc.introMarca && tl.intro && f < tl.intro.hasta) return null;
  const pag = tl.subtitulos.find((p) => f >= p.desde && f < p.hasta);
  if (!pag) return null;
  const acento = tema.acentoCap(acentoDe(tl, f));
  const activo = tema.acentoTexto(acento);
  // Escenario: bajo las cajas en «dos-cajas» (y ≈ 900) y abajo en el resto, siguiendo la transición.
  const subs = escenario ? estadoEscenario(esc.pista, f, lienzo, tema.show.escenario.radio, tl.fps).geo.subs : null;
  const col = subs ? { cx: subs.cx, w: subs.w } : columna(tl, f, lienzo.ancho, lienzo.vertical);
  const { cx, w } = col;
  const abajo = "abajo" in col && col.abajo;
  const estilo = tema.subtitulos.estilo;
  const modoActiva = tema.subtitulos.palabraActiva;
  const aparece = interpolate(f - pag.desde, [0, 4], [0, 1], { extrapolateRight: "clamp", easing: ease.power2Out });
  const tam = lienzo.vertical ? 52 : 44;
  const base = estilo === "caja" ? tema.c.texto : estilo === "contorno" ? (tema.oscuro ? "#FFFFFF" : tema.c.texto) : tema.c.texto;
  // Color de contraste (trazo o halo): claro detrás de texto oscuro y al revés; el vídeo puede ser de cualquier color.
  const contra = tema.oscuro || estilo === "contorno" ? (base === "#FFFFFF" || tema.oscuro ? tema.mezcla(tema.c.fondo, "#000000", 0.45) : "#FFFFFF") : "#FFFFFF";
  const futuro = estilo === "caja" ? tema.alpha(base, 0.55) : tema.mezcla(base, contra, 0.25);
  const trazo = estilo === "contorno" ? contra : null;
  // `limpio`: sin caja, con un halo difuso en el color de contraste (legible sobre pelo oscuro o fondo blanco).
  const halo = estilo === "limpio" ? [0, 1, 2].map((i) => `0 0 ${4 + i * 6}px ${tema.alpha(contra, 0.95 - i * 0.2)}`).join(", ") : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        width: w,
        // Vertical: al pie de la zona del ponente (0–980), por encima de los paneles (1010–1710).
        bottom: subs ? subs.bottom : lienzo.vertical ? (abajo ? 300 : lienzo.alto - 960) : 96,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        willChange: "transform, opacity",
        opacity: aparece,
        transform: `translateY(${(1 - aparece) * 10}px)`,
      }}
    >
      <div
        style={{
          maxWidth: w,
          padding: estilo === "caja" ? "12px 26px 14px" : "0 10px",
          borderRadius: estilo === "caja" ? Math.min(18, tema.forma.radio) : 0,
          background: estilo === "caja" ? tema.alpha(tema.oscuro ? tema.mezcla(tema.c.fondo, "#000000", 0.3) : tema.c.superficie, 0.82) : undefined,
          border: estilo === "caja" && tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : undefined,
          ...tema.t.cuerpo,
          fontWeight: tema.pesoFuerte,
          fontSize: tam,
          lineHeight: 1.26,
          letterSpacing: 0,
          textTransform: "none",
          textAlign: "center",
          textWrap: "balance",
          textShadow: halo,
        }}
      >
        {pag.palabras.map((p, i) => {
          const on = f >= p.desde && f < p.hasta && modoActiva !== "ninguna";
          const dicha = f >= p.desde || modoActiva === "ninguna";
          // acento | capitulo: color del capítulo · subrayado: bloque de superficie2 detrás · fondo: bloque del acento.
          const bloque = on && (modoActiva === "subrayado" || modoActiva === "fondo");
          const fondoBloque = modoActiva === "fondo" ? acento : tema.c.superficie2;
          const color = on ? (bloque ? (modoActiva === "fondo" ? tema.sobre(acento) : tema.c.texto) : estilo === "contorno" ? acento : activo) : dicha ? base : futuro;
          const pop = on ? interpolate(f - p.desde, [0, 2, 5], [0.94, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: "inline-block",
                  position: "relative",
                  color,
                  transform: `scale(${pop})`,
                  padding: bloque ? "0 8px" : undefined,
                  margin: bloque ? "0 -8px" : undefined,
                  borderRadius: 8,
                  background: bloque ? fondoBloque : undefined,
                  WebkitTextStroke: trazo && !bloque ? `${Math.round(tam * 0.16)}px ${trazo}` : undefined,
                  paintOrder: trazo ? "stroke fill" : undefined,
                }}
              >
                {p.t}
              </span>{" "}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
