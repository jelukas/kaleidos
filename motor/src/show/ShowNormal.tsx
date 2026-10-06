/**
 * Componentes «show» FUERA del modo escenario (compatibilidad): los eventos `titulo`, `lamina` y `sello` se pintan
 * como una tarjeta de diapositiva flotante (con la piel de su registro) en el lado libre, y los bocadillos y las
 * reacciones junto a la cabeza del ponente (cámara efectiva de siempre).
 */
import React, { useMemo } from "react";
import { Sequence } from "remotion";
import type { Diapo } from "../lib/escenario";
import { DIAPO_H, DIAPO_W, diapoDeEvento } from "../lib/escenario";
import { camaraEn } from "../lib/camara";
import { camaraPonente } from "../lib/ponente";
import { ConTema, useMotor } from "../tema/Motor";
import { Transicion } from "../paneles/Transicion";
import { ContenidoDiapo } from "./Diapositivas";
import type { CajaDe } from "./Reacciones";
import { CapaBocadillos, CapaReacciones } from "./Reacciones";
import { FondoRegistro } from "./Registros";

const FLOTANTES = new Set(["titulo", "lamina", "sello"]);

const DiapoFlotante: React.FC<{ d: Diapo }> = ({ d }) => {
  const m = useMotor();
  const { lienzo, timeline: tl } = m;
  const cam = camaraEn(tl, d.desde, lienzo);
  const lado = cam.tx < lienzo.ancho / 2 ? "der" : "izq";
  const w = lienzo.vertical ? lienzo.ancho - 120 : 860;
  const h = (w * DIAPO_H) / DIAPO_W;
  const x = lienzo.vertical ? 60 : lado === "der" ? lienzo.ancho - 80 - w : 80;
  const y = lienzo.vertical ? 1060 : (lienzo.alto - h) / 2 - 20;
  const tema = m.temas[d.registro];
  return (
    <Transicion dur={d.hasta - d.desde} lado={lado} style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: tema.forma.radio, overflow: "hidden", boxShadow: tema.forma.sombra }}>
        <ConTema tema={tema}>
          <FondoRegistro registro={d.registro} w={w} h={h} />
          <ContenidoDiapo d={d} w={w} h={h} />
        </ConTema>
      </div>
    </Transicion>
  );
};

export const CapaShowNormal: React.FC = () => {
  const m = useMotor();
  const { timeline: tl } = m;
  const diapos = useMemo(() => tl.eventos.map((e, i) => (FLOTANTES.has(e.tipo) ? diapoDeEvento(tl, e, i) : null)).filter((d): d is Diapo => !!d), [tl]);
  const cajaDe: CajaDe = (f) => {
    const cam = camaraPonente(m, f);
    const nx = cam.ox + cam.nariz[0] * cam.S;
    const ny = cam.oy + cam.nariz[1] * cam.S;
    return { x: nx - 360, y: ny - 280, w: 720, h: 820, nariz: [nx, ny] };
  };
  return (
    <>
      {diapos.map((d) => (
        <Sequence key={d.id} from={d.desde} durationInFrames={Math.max(1, d.hasta - d.desde)} name={`Tarjeta ${d.id}`} layout="none">
          <DiapoFlotante d={d} />
        </Sequence>
      ))}
      <CapaBocadillos cajaDe={cajaDe} />
      <CapaReacciones cajaDe={cajaDe} />
    </>
  );
};
