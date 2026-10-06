/**
 * `gesto3d`: un objeto del catálogo anclado a las muñecas de `timeline.gestos`.
 * px de fuente → cámara del ponente → pantalla → mundo (`screenToWorld`); el punto se congela en el pico.
 * Va en la capa «3D delante» del ponente.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { EventoGesto3D } from "../datos/contrato";
import type { Camara } from "../lib/camara";
import { camaraPonente } from "../lib/ponente";
import { ease, tween } from "../tema/anim";
import { useMotor } from "../tema/Motor";
import { Objeto3D } from "./catalogo";
import { Escenario } from "./Escenario";
import { anclaGesto, gestoDeEvento, mundoPorPixel, screenToWorld } from "./pantalla";

const CAM = { fov: 30, dist: 10 };
/** Tamaño nominal de los objetos del catálogo (unidades). */
const TAM_OBJETO = 2.8;

/**
 * `camaraDe` (modo escenario): cámara efectiva del ponente en su caja. `zona`: rectángulo de pantalla del lienzo 3D
 * (por defecto, la pantalla entera); en el escenario se limita a la caja del ponente con margen, más barato.
 */
export const Gesto3D: React.FC<{
  ev: EventoGesto3D;
  acento: string;
  camaraDe?: (f: number) => Camara;
  zona?: { x: number; y: number; w: number; h: number };
}> = ({ ev, acento, camaraDe, zona: zonaProp }) => {
  const motor = useMotor();
  const { timeline: tl, lienzo: pantalla, tema } = motor;
  const zona = zonaProp ?? { x: 0, y: 0, w: pantalla.ancho, h: pantalla.alto };
  const lienzo = { ancho: zona.w, alto: zona.h, vertical: false };
  const camara = camaraDe ?? ((x: number) => camaraPonente(motor, x));
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = ev.desde + local;
  const dur = ev.hasta - ev.desde;
  const g = ev.gesto ?? gestoDeEvento(tl, ev.desde, ev.hasta);

  let centro: [number, number];
  let separacion: number;
  let pico = ev.desde + Math.min(12, dur / 3);
  if (g) {
    const a = anclaGesto(g, f, camara);
    centro = a.centro;
    separacion = a.separacion;
    pico = g.pico;
  } else {
    // Sin gesto detectado: delante del pecho (nariz + 0,25 del alto de la fuente).
    const cam = camara(f);
    centro = [cam.ox + cam.nariz[0] * cam.S, cam.oy + (cam.nariz[1] + tl.fuente.alto * 0.25) * cam.S];
    separacion = Math.min(pantalla.alto * 0.3, zona.h * 0.45);
  }

  const t = local / fps;
  // Crece desde el inicio hasta el pico y se mantiene; sale al final del evento.
  const crece = tween(f, ev.desde, Math.max(6, pico - ev.desde), 0.001, 1, ease.backOutSuave);
  const sale = tween(local, dur - 10, 10, 1, 0.001, ease.power2InOut);
  const k = Math.min(crece, sale);
  const pos = screenToWorld(centro[0] - zona.x, centro[1] - zona.y, lienzo, CAM);
  const escala = Math.max(0.2, ((separacion * 0.72) / TAM_OBJETO) * mundoPorPixel(lienzo, CAM)) * k;
  const radioPx = separacion * 0.4;
  const etiquetaK = tween(local, Math.max(8, pico - ev.desde) + 4, 10, 0, 1, tema.mov.ease) * sale;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: zona.x, top: zona.y, width: zona.w, height: zona.h }}>
        <Escenario width={zona.w} height={zona.h} camara={{ pos: [0, 0, CAM.dist], mira: [0, 0, 0], fov: CAM.fov }}>
          <group position={pos} scale={escala}>
            <Objeto3D nombre={ev.objeto} t={t} aparece={0} acento={acento} texto={ev.texto} />
          </group>
        </Escenario>
      </div>
      {ev.texto && ev.objeto !== "letras" ? (
        <div
          style={{
            position: "absolute",
            left: centro[0] - 400,
            width: 800,
            top: centro[1] - radioPx - 110,
            display: "flex",
            justifyContent: "center",
            opacity: etiquetaK,
            transform: `translateY(${(1 - etiquetaK) * 16}px)`,
          }}
        >
          <div
            style={{
              ...tema.t.titular,
              fontSize: 44,
              lineHeight: 1.1,
              padding: "12px 26px",
              borderRadius: tema.forma.radioPildora,
              background: tema.estiloPanel === "tinta" ? tema.c.superficie : tema.alpha(tema.c.fondo, 0.85),
              border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : `2px solid ${tema.alpha(acento, 0.7)}`,
              color: tema.c.texto,
              whiteSpace: "nowrap",
            }}
          >
            {ev.texto}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
