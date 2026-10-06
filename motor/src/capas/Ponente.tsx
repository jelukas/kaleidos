/**
 * Ponente, en los dos modos del contrato.
 *
 * CON RECORTE (METODO §7.2), todo dentro de un grupo con `isolation: isolate`:
 *   B = fondo · (1 − α)   → lo de detrás (fondo, 3D detrás) y encima la máscara con `multiply` + `invert(1)`
 *   A = ponente · α       → la plancha premultiplicada en `plus-lighter`
 *   resultado = A + B
 * La geometría sale de `timeline.plancha` (región de la fuente → plancha) y de la cámara.
 *
 * SIN RECORTE: el mezzanine dentro de su marco (`tokens.ponente.marco`), con las disposiciones completa,
 * dividida o esquina (como en DORA) y la cámara de los planos en pantalla completa.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { camaraEn, rectFuente } from "../lib/camara";
import { videoEnVentana, ventanaEn } from "../lib/disposicion";
import { hayVideo } from "../lib/linea";
import { useMotor } from "../tema/Motor";
import { TramosAudio, TramosVideo } from "./Tramos";

const caja = (r: { left: number; top: number; width: number; height: number }): React.CSSProperties => ({
  position: "absolute",
  left: r.left,
  top: r.top,
  width: r.width,
  height: r.height,
});

export const PonenteRecorte: React.FC<{ detras: React.ReactNode }> = ({ detras }) => {
  const { timeline: tl, lienzo, medios, opciones } = useMotor();
  const perfil = opciones.perfil;
  const f = useCurrentFrame();
  const cam = camaraEn(tl, f, lienzo);
  const p = tl.plancha!;
  const rPlancha = rectFuente(cam, p.x, p.y, p.ancho, p.alto);
  const rMascara = p.mascara === "fuente" ? rectFuente(cam, 0, 0, tl.fuente.ancho, tl.fuente.alto) : rPlancha;
  // La mezcla (multiply + filtro) se limita al rectángulo de la plancha dentro de la pantalla: fuera, α = 0 y
  // mezclar una máscara de fuente entera (más grande que la pantalla) es trabajo perdido por software.
  const x0 = Math.max(0, rPlancha.left);
  const y0 = Math.max(0, rPlancha.top);
  const x1 = Math.min(lienzo.ancho, rPlancha.left + rPlancha.width);
  const y1 = Math.min(lienzo.alto, rPlancha.top + rPlancha.height);
  const clip = perfil.has("mascara-completa")
    ? null
    : { left: x0, top: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
  const filtro = perfil.has("sin-filtro-mascara")
    ? undefined
    : p.curva === "metodo"
      ? "brightness(0.93) contrast(1.35) invert(1)"
      : "invert(1)";
  return (
    <>
      <AbsoluteFill style={{ isolation: "isolate", overflow: "hidden" }}>
        {detras}
        {/* B: el fondo se multiplica por (1 − α). */}
        {perfil.has("sin-mascara") ? null : (
          // Filtros CSS en sRGB: brightness(0,93) + contrast(1,35) = la curva de tools; luego 1 − α.
          <div style={{ ...caja(clip ?? rMascara), overflow: "hidden", mixBlendMode: "multiply", filter: filtro }}>
            <div
              style={caja(
                clip
                  ? {
                      left: rMascara.left - clip.left,
                      top: rMascara.top - clip.top,
                      width: rMascara.width,
                      height: rMascara.height,
                    }
                  : { left: 0, top: 0, width: rMascara.width, height: rMascara.height },
              )}
            >
              <TramosVideo src={medios.mascara!} nombre="Máscara" muted />
            </div>
          </div>
        )}
        {/* A: ponente·α, que se suma. */}
        {perfil.has("sin-plancha") ? null : (
          <div style={{ ...caja(rPlancha), mixBlendMode: "plus-lighter" }}>
            <TramosVideo src={medios.plancha!} nombre="Plancha" muted />
          </div>
        )}
      </AbsoluteFill>
      {medios.audio ?? medios.mezzanine ? <TramosAudio src={(medios.audio ?? medios.mezzanine)!} /> : null}
    </>
  );
};

export const PonenteMarco: React.FC = () => {
  const { timeline: tl, lienzo, medios, bloques, tema, opciones } = useMotor();
  const f = useCurrentFrame();
  const cam = camaraEn(tl, f, lienzo);
  const sinSombra = opciones.perfil.has("sin-sombras");
  const v = ventanaEn(bloques, f, lienzo, tema.ponente.marco, tema.forma.radio);
  const vid = videoEnVentana(cam, v, tl.fuente, lienzo);
  const visible = hayVideo(tl, f);
  const acento = tema.c.acento;
  const borde = tema.ponente.borde && tema.ponente.marco !== "ninguno" ? v.borde : 0;
  const radio = tema.ponente.marco === "arco" ? `${v.radio}px ${v.radio}px 0 0` : v.radio;
  return (
    <div
      style={{
        position: "absolute",
        left: v.rect.x,
        top: v.rect.y,
        width: v.rect.w,
        height: v.rect.h,
        overflow: "hidden",
        borderRadius: radio,
        opacity: visible ? 1 : 0,
        background: tema.c.superficie,
        boxShadow:
          borde > 0.01
            ? `0 0 0 ${Math.max(2, tema.forma.borde + 1) * borde}px ${tema.alpha(acento, 0.9)}${sinSombra ? "" : `, 0 16px 36px ${tema.alpha("#000000", 0.3 * borde)}`}`
            : undefined,
      }}
    >
      {/* Capa propia para el vídeo: cada fotograma nuevo no obliga a repintar lo que hay debajo ni el marco. */}
      <div
        style={{
          ...caja({ left: vid.left - v.rect.x, top: vid.top - v.rect.y, width: vid.width, height: vid.height }),
          willChange: "transform",
        }}
      >
        {medios.mezzanine ? <TramosVideo src={medios.mezzanine} nombre="Mezzanine" /> : null}
      </div>
    </div>
  );
};
