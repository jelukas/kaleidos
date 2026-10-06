/**
 * Caja del ponente en el escenario (§7): redondeada, con la sombra del estilo y el ponente encuadrado por la
 * cámara virtual DENTRO de la caja (nariz centrada, borde inferior de la fuente nunca visible).
 *
 * - Con recorte: sobre el menta de `tokens.escenario.camara`, la misma composición que el modo normal
 *   (B = fondo·(1 − α) con la máscara en `multiply` + `invert`, A = plancha en `plus-lighter`), limitada a la caja.
 * - Sin recorte: el mezzanine reencuadrado, cubriendo siempre la caja.
 * Los vídeos van mudos: la voz sale de una pista aparte (así la caja se puede desmontar cuando está oculta).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Ajuste, CajaGeo } from "../lib/escenario";
import { camaraCaja } from "../lib/escenario";
import { useMotor } from "../tema/Motor";
import { TramosVideo } from "../capas/Tramos";

type R = { left: number; top: number; width: number; height: number };
const abs = (r: R): React.CSSProperties => ({ position: "absolute", left: r.left, top: r.top, width: r.width, height: r.height });

/** Fondo de estudio (menta con un degradado muy suave hacia abajo). */
export const fondoCamara = (camara: string, camara2: string, mezcla: (a: string, b: string, k: number) => string) =>
  `linear-gradient(180deg, ${mezcla(camara, "#FFFFFF", 0.14)} 0%, ${camara} 55%, ${camara2} 100%)`;

export const CajaPonente: React.FC<{ geo: CajaGeo; aj: Ajuste }> = ({ geo, aj }) => {
  const { timeline: tl, medios, recorte, tema, opciones } = useMotor();
  const f = useCurrentFrame();
  if (geo.o <= 0.002 || geo.w < 2 || geo.h < 2) return null;
  const e = tema.show.escenario;
  const caja = { x: geo.x, y: geo.y, w: geo.w, h: geo.h };
  const cam = camaraCaja(tl, f, caja, aj, !recorte);
  const sinSombra = opciones.perfil.has("sin-sombras");
  const fondo = fondoCamara(e.camara, e.camara2, tema.mezcla);
  const marco: React.CSSProperties = {
    position: "absolute",
    left: geo.x,
    top: geo.y,
    width: geo.w,
    height: geo.h,
    borderRadius: geo.r,
    overflow: "hidden",
    opacity: geo.o,
    background: fondo,
    boxShadow: sinSombra || geo.r < 1 ? undefined : e.sombra,
  };

  if (!recorte) {
    if (!medios.mezzanine) return <div style={marco} />;
    const mezzanine = medios.mezzanine;
    return (
      <div style={marco}>
        <div style={{ ...abs({ left: cam.ox - geo.x, top: cam.oy - geo.y, width: tl.fuente.ancho * cam.S, height: tl.fuente.alto * cam.S }), willChange: "transform" }}>
          <TramosVideo src={mezzanine} nombre="Mezzanine" muted />
        </div>
      </div>
    );
  }

  const p = tl.plancha!;
  const rPlancha: R = { left: cam.ox + p.x * cam.S - geo.x, top: cam.oy + p.y * cam.S - geo.y, width: p.ancho * cam.S, height: p.alto * cam.S };
  const rMascara: R = p.mascara === "fuente" ? { left: cam.ox - geo.x, top: cam.oy - geo.y, width: tl.fuente.ancho * cam.S, height: tl.fuente.alto * cam.S } : rPlancha;
  // Mezcla limitada a la intersección de la plancha con la caja (fuera, α = 0).
  const x0 = Math.max(0, rPlancha.left);
  const y0 = Math.max(0, rPlancha.top);
  const x1 = Math.min(geo.w, rPlancha.left + rPlancha.width);
  const y1 = Math.min(geo.h, rPlancha.top + rPlancha.height);
  const clip: R = { left: x0, top: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
  const filtro = p.curva === "metodo" ? "brightness(0.93) contrast(1.35) invert(1)" : "invert(1)";
  return (
    <div style={marco}>
      <div style={{ position: "absolute", inset: 0, isolation: "isolate", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: fondo }} />
        {opciones.perfil.has("sin-mascara") ? null : (
          <div style={{ ...abs(clip), overflow: "hidden", mixBlendMode: "multiply", filter: filtro }}>
            <div style={abs({ left: rMascara.left - clip.left, top: rMascara.top - clip.top, width: rMascara.width, height: rMascara.height })}>
              <TramosVideo src={medios.mascara!} nombre="Máscara" muted />
            </div>
          </div>
        )}
        {opciones.perfil.has("sin-plancha") ? null : (
          <div style={{ ...abs(rPlancha), mixBlendMode: "plus-lighter" }}>
            <TramosVideo src={medios.plancha!} nombre="Plancha" muted />
          </div>
        )}
      </div>
    </div>
  );
};
