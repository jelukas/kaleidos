/**
 * Capa de paneles 2D: un `<Sequence>` por evento. Despacha cada `kind` a su componente, dentro de su zona y
 * con la transición del estilo. También el `pop` (frase clave grande) y los textos de `escena3d`.
 */
import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { EventoEscena3D, EventoPanel, EventoPop } from "../datos/contrato";
import { camaraEn } from "../lib/camara";
import type { Rect } from "../lib/disposicion";
import { zonaEvento } from "../lib/disposicion";
import { acentoDe, marcaLocal } from "../lib/linea";
import { tween } from "../tema/anim";
import { useMotor } from "../tema/Motor";
import { Escenario } from "../tres/Escenario";
import * as THREE from "three";
import { CON_ETIQUETAS_3D, Objeto3D } from "../tres/catalogo";
import type { ContenidoProps } from "./Base";
import { Cabecera, MarcoPanel, relleno, tamPorLargo } from "./Base";
import { Caso, Comparativa, Opciones } from "./Comparar";
import { Linea, Mapa } from "./Diagramas";
import { Checklist, Lista, Pasos } from "./Listas";
import { Cifra, Cita, Clave, Tarjeta } from "./Textos";
import { Transicion, useEntradaSalida } from "./Transicion";

const escalaZona = (z: Rect) => Math.max(0.9, Math.min(1.15, z.w / 840));

export const Contenido: React.FC<ContenidoProps<EventoPanel>> = (p) => {
  const { ev } = p;
  switch (ev.kind) {
    case "lista":
      return <Lista {...p} ev={ev} />;
    case "pasos":
      return <Pasos {...p} ev={ev} />;
    case "checklist":
      return <Checklist {...p} ev={ev} />;
    case "comparativa":
      return <Comparativa {...p} ev={ev} />;
    case "opciones":
      return <Opciones {...p} ev={ev} />;
    case "cifra":
      return <Cifra {...p} ev={ev} />;
    case "cita":
      return <Cita {...p} ev={ev} />;
    case "clave":
      return <Clave {...p} ev={ev} />;
    case "linea":
      return <Linea {...p} ev={ev} />;
    case "mapa":
      return <Mapa {...p} ev={ev} />;
    case "tarjeta":
      return <Tarjeta {...p} ev={ev} />;
    case "caso":
      return <Caso {...p} ev={ev} />;
  }
};

const Panel: React.FC<{ ev: EventoPanel }> = ({ ev }) => {
  const { tema, timeline, lienzo, recorte } = useMotor();
  const zona = zonaEvento(ev, lienzo, recorte);
  const escala = escalaZona(zona);
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const r = relleno(tema, escala);
  const dur = ev.hasta - ev.desde;
  return (
    <Transicion dur={dur} lado={ev.lado} style={{ position: "absolute", inset: 0 }}>
      <MarcoPanel zona={zona} acento={acento} escala={escala}>
        <Contenido ev={ev} dur={dur} acento={acento} ancho={zona.w - 2 * r.x} alto={zona.h - 2 * r.y} escala={escala} />
      </MarcoPanel>
    </Transicion>
  );
};

/** Frase clave grande en el lado libre (el ponente, en el contrario: plano popL). */
const Pop: React.FC<{ ev: EventoPop }> = ({ ev }) => {
  const { tema, timeline, lienzo, recorte } = useMotor();
  const dur = ev.hasta - ev.desde;
  const { k } = useEntradaSalida(dur);
  const f = useCurrentFrame();
  const cam = camaraEn(timeline, ev.desde, lienzo);
  const lado = ev.lado ?? (cam.tx < lienzo.ancho / 2 ? "der" : "izq");
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const zona: Rect = lienzo.vertical
    ? { x: 60, y: 1080, w: lienzo.ancho - 120, h: 600 }
    : lado === "centro"
      ? { x: 260, y: 150, w: 1400, h: 700 }
      : lado === "der"
        ? { x: 1010, y: 150, w: 830, h: 700 }
        : { x: 80, y: 150, w: 830, h: 700 };
  const base = ev.grande ? 104 : 80;
  const tam = tamPorLargo(ev.texto, base, ev.grande ? 22 : 30);
  const rebote = tween(f, 0, tema.mov.durEntrada, 0.85, 1, tema.mov.rebote);
  const barra = tween(f, 4, tema.mov.durEntrada, 0, 1, tema.mov.ease);
  const sinCaja = recorte;
  return (
    <Transicion dur={dur} lado={lado} style={{ position: "absolute", inset: 0 }}>
      <MarcoPanel zona={zona} acento={acento} escala={1} sinCaja={sinCaja} opaco>
        <div style={{ transform: `scale(${rebote})`, transformOrigin: lado === "der" ? "left center" : "right center", opacity: Math.min(1, k * 1.5) }}>
          <div style={{ width: 110 * barra, height: 10, borderRadius: 5, background: acento, marginBottom: 26 }} />
          <div
            style={{
              ...tema.t.titular,
              fontSize: tam,
              lineHeight: 1.04,
              color: tema.c.texto,
              textWrap: "balance",
              textShadow: sinCaja ? `0 4px 30px ${tema.alpha(tema.c.fondo, 0.6)}` : undefined,
            }}
          >
            {ev.texto}
          </div>
          {ev.sub ? (
            <div style={{ ...tema.t.titular, fontSize: tam * 0.62, lineHeight: 1.1, marginTop: 14, color: tema.acentoTexto(acento), clipPath: `inset(0 ${(1 - barra) * 100}% 0 0)` }}>
              {ev.sub}
            </div>
          ) : null}
        </div>
      </MarcoPanel>
    </Transicion>
  );
};

const ALTO_CABECERA = 200;

const marcasEscena = (ev: EventoEscena3D, fps: number) =>
  ev.etiquetas.map((e, i) => Math.max(8, marcaLocal(e.en, ev.desde, i, ev.etiquetas.length, ev.hasta - ev.desde)) / fps);

/** Lienzo 3D de una escena3d (en recorte va DETRÁS del ponente; sin recorte, delante del fondo). */
export const Escena3DLienzo: React.FC<{ ev: EventoEscena3D }> = ({ ev }) => {
  const { tema, timeline, lienzo, recorte } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zona = zonaEvento(ev, lienzo, recorte);
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const dur = ev.hasta - ev.desde;
  const { k } = useEntradaSalida(dur);
  const enes = marcasEscena(ev, fps);
  const alto = zona.h - ALTO_CABECERA;
  const conEtiquetas = CON_ETIQUETAS_3D.has(ev.objeto);
  // Sin etiquetas 3D, el objeto se corre a la derecha para dejar sitio a las etiquetas 2D.
  const desplaza = !conEtiquetas && ev.etiquetas.length ? 0.28 : 0;
  const dist = ev.objeto === "cadena" ? 7.4 : 6.5;
  // Semiancho/semialto visibles en z = 0 (fov 35 de Escenario): los objetos con etiquetas se escalan para caber.
  const medioAlto = Math.tan(THREE.MathUtils.degToRad(35 / 2)) * dist;
  const limite: [number, number] = [medioAlto * (zona.w / Math.max(1, alto)) - desplaza * 4, medioAlto];
  return (
    <div style={{ position: "absolute", left: zona.x, top: zona.y + ALTO_CABECERA, width: zona.w, height: alto, opacity: Math.min(1, k * 1.6) }}>
      <Escenario width={zona.w} height={alto} camara={{ pos: [0, 0.6, dist], mira: [0, -0.05, 0] }}>
        <group position={[desplaza * 4, 0, 0]}>
          <Objeto3D
            nombre={ev.objeto}
            t={f / fps}
            aparece={0.15}
            enes={enes}
            etiquetas={conEtiquetas ? ev.etiquetas.map((e) => e.texto) : []}
            acento={acento}
            texto={ev.texto ?? ev.titulo}
            limite={limite}
          />
        </group>
      </Escenario>
    </div>
  );
};

export const Escena3DTextos: React.FC<{ ev: EventoEscena3D }> = ({ ev }) => {
  const { tema, timeline, lienzo, recorte } = useMotor();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zona = zonaEvento(ev, lienzo, recorte);
  const acento = tema.acentoCap(acentoDe(timeline, ev.desde));
  const dur = ev.hasta - ev.desde;
  const enes = marcasEscena(ev, fps).map((s) => Math.round(s * fps));
  const conEtiquetas = CON_ETIQUETAS_3D.has(ev.objeto);
  return (
    <Transicion dur={dur} lado={ev.lado} style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: zona.x, top: zona.y, width: zona.w, height: ALTO_CABECERA, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Cabecera kicker={ev.kicker} titulo={ev.titulo} acento={acento} escala={1} tamTitulo={50} margen={0} />
      </div>
      {!conEtiquetas
        ? ev.etiquetas.map((e, i) => {
            const k = tween(f, enes[i] + 4, 12, 0, 1, tema.mov.ease);
            return (
              <div
                key={i}
                style={{
                  ...tema.ficha(acento, false),
                  position: "absolute",
                  left: zona.x,
                  top: zona.y + ALTO_CABECERA + 40 + i * 78,
                  maxWidth: zona.w * 0.5,
                  padding: "12px 20px",
                  background: tema.estiloPanel === "tinta" ? tema.c.superficie : tema.alpha(tema.c.superficie, 0.9),
                  boxShadow: `${tema.ficha(acento, false).boxShadow ?? ""}, inset 4px 0 0 ${acento}`,
                  ...tema.t.cuerpo,
                  fontWeight: tema.pesoFuerte,
                  fontSize: tamPorLargo(e.texto, 29, 26),
                  color: tema.c.texto,
                  opacity: k,
                  transform: `translateX(${(1 - k) * -26}px)`,
                }}
              >
                {e.texto}
              </div>
            );
          })
        : null}
    </Transicion>
  );
};

export const CapaPaneles: React.FC = () => {
  const { timeline, recorte } = useMotor();
  return (
    <>
      {timeline.eventos.map((ev, i) => {
        const dur = Math.max(1, ev.hasta - ev.desde);
        const nombre = ev.tipo === "panel" ? `Panel ${ev.kind}` : ev.tipo;
        let hijo: React.ReactNode = null;
        if (ev.tipo === "panel") hijo = <Panel ev={ev} />;
        else if (ev.tipo === "pop") hijo = <Pop ev={ev} />;
        else if (ev.tipo === "escena3d")
          hijo = (
            <>
              {recorte ? null : <Escena3DLienzo ev={ev} />}
              <Escena3DTextos ev={ev} />
            </>
          );
        if (!hijo) return null;
        return (
          <Sequence key={ev.id ?? i} from={ev.desde} durationInFrames={dur} name={`${nombre} ${ev.id ?? i}`} layout="none">
            {hijo}
          </Sequence>
        );
      })}
    </>
  );
};

