import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import type { Grafico } from "../datos/tipos";
import type { BloqueDisp } from "../lib/encuadre";
import { cabezaX, disposicionEn } from "../lib/encuadre";
import type { GraficoColocado, LineaTiempo } from "../lib/linea-tiempo";
import { Camara, Escenario, Luces, Suelo, useFuente3D } from "../tres/Escenario";
import { Balanza3D, Cadena3D, Contrato3D, Escudo3D, Registro3D, Salida3D } from "../tres/Objetos3D";
import { COLOR, ease, FONT, FPS, radialGlow, tween } from "../tema";
import { Cabecera, Cita, Clave, Comparativa, Contador, LineaProceso, Lista, Mapa, Opciones, Pasos, type Marca } from "./Graficos2D";

// Zona del lienzo que ocupa el gráfico en cada disposición.
const ZONA = {
  dividida: { x: 980, y: 100, w: 860, h: 770 },
  esquina: { x: 120, y: 100, w: 1240, h: 770 },
  completa: { x: 0, y: 0, w: 1920, h: 1080 },
} as const;

// ——— Escena 3D de concepto ———
const Escena3DGrafico: React.FC<{ g: Extract<Grafico, { tipo: "escena3d" }>; marca: Marca; w: number; h: number }> = ({
  g,
  marca,
  w,
  h,
}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const fuente = useFuente3D();
  const enes = (g.etiquetas ?? []).map((e) => Math.max(8, marca(e.en)) / FPS);
  const alto3d = h - 190;
  return (
    <div style={{ fontFamily: FONT, position: "relative", width: w, height: h }}>
      <Cabecera kicker={g.kicker} titulo={g.titulo} f={f} tam={50} />
      <Escenario width={w} height={alto3d} style={{ left: 0, top: 190 }}>
        <Camara pos={[0, 0.9, g.escena === "cadena" ? 9.2 : 7.2]} mira={[0, -0.1, 0]} />
        <Luces />
        {g.escena === "escudo" ? <Escudo3D t={t} aparece={0.3} check={enes[0] ?? 1.2} /> : null}
        {g.escena === "cadena" && fuente ? (
          <Cadena3D t={t} fuente={fuente} etiquetas={(g.etiquetas ?? []).map((e) => e.texto)} enes={enes} />
        ) : null}
        {g.escena === "registro" ? <Registro3D t={t} enes={enes.length ? enes : [0.4, 0.8, 1.2, 1.6]} /> : null}
        {g.escena === "contrato" ? <Contrato3D t={t} sello={enes[0] ?? 1.5} /> : null}
        {g.escena === "salida" ? <Salida3D t={t} sale={enes[0] ?? 1.2} /> : null}
        {g.escena === "balanza" ? <Balanza3D t={t} enes={enes} /> : null}
        <Suelo y={-1.6} />
      </Escenario>
      {g.escena !== "cadena"
        ? (g.etiquetas ?? []).map((e, i) => {
            const k = tween(f, Math.max(8, marca(e.en)) + 6, 12, 0, 1, ease.power3Out);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 230 + i * 74,
                  padding: "12px 22px",
                  borderRadius: 12,
                  background: "rgba(13,37,82,0.85)",
                  boxShadow: `inset 3px 0 0 ${COLOR.accent}`,
                  fontSize: 30,
                  fontWeight: 700,
                  color: COLOR.fg,
                  opacity: k,
                  transform: `translateX(${(1 - k) * -30}px)`,
                }}
              >
                {e.texto}
              </div>
            );
          })
        : null}
    </div>
  );
};

const Contenido: React.FC<{ g: Grafico; marca: Marca; dur: number; ancho: number; alto: number }> = ({ g, marca, dur, ancho, alto }) => {
  switch (g.tipo) {
    case "lista":
      return <Lista g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "pasos":
      return <Pasos g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "comparativa":
      return <Comparativa g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "opciones":
      return <Opciones g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "contador":
      return <Contador g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "linea":
      return <LineaProceso g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "mapa":
      return <Mapa g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "cita":
      return <Cita g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "clave":
      return <Clave g={g} marca={marca} dur={dur} ancho={ancho} />;
    case "escena3d":
      return <Escena3DGrafico g={g} marca={marca} w={ancho} h={alto} />;
  }
};

const GraficoEnZona: React.FC<{ gc: GraficoColocado; lt: LineaTiempo; bloques: BloqueDisp[] }> = ({ gc, lt, bloques }) => {
  const f = useCurrentFrame();
  const { g, desde, hasta } = gc;
  const dur = hasta - desde;
  const marca: Marca = (s) => lt.fuenteAFotogramaCercano(s) - desde;
  if (g.tipo === "clave") {
    // La palabra clave se coloca en el lado libre del plano (contrario a la cabeza de la ponente).
    const lado = g.lado ?? (cabezaX(g.t) > 1000 ? "izq" : "der");
    return <Clave g={{ ...g, lado }} marca={marca} dur={dur} ancho={1920} />;
  }
  const disp = "disp" in g ? g.disp : "completa";
  const z = ZONA[disp];
  // Fundido y desplazamiento de entrada/salida del gráfico dentro de su zona.
  const k = Math.min(tween(f, 0, 12, 0, 1, ease.power3Out), tween(f, dur - 10, 10, 1, 0, ease.power2Out));
  const { mezcla } = disposicionEn(bloques, desde + f);
  const panel =
    disp === "completa" ? (
      <AbsoluteFill style={{ background: COLOR.bg, opacity: k }}>
        <div
          style={{
            position: "absolute",
            left: 800,
            top: -500,
            width: 1400,
            height: 1400,
            borderRadius: "50%",
            background: radialGlow,
            opacity: 0.22,
          }}
        />
      </AbsoluteFill>
    ) : null;
  const pad = disp === "completa" ? { x: 140, y: 120, w: 1640, h: 820 } : z;
  return (
    <>
      {panel}
      <div
        style={{
          position: "absolute",
          left: pad.x,
          top: pad.y,
          width: pad.w,
          height: pad.h,
          opacity: disp === "completa" ? k : Math.min(k, 0.2 + mezcla),
          transform: `translateY(${(1 - k) * 24}px)`,
        }}
      >
        {g.tipo === "escena3d" ? (
          <Contenido g={g} marca={marca} dur={dur} ancho={pad.w} alto={pad.h} />
        ) : (
          // Los gráficos 2D se centran en vertical dentro de su zona.
          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Contenido g={g} marca={marca} dur={dur} ancho={pad.w} alto={pad.h} />
          </div>
        )}
      </div>
    </>
  );
};

export const CapaGraficos: React.FC<{ graficos: GraficoColocado[]; lt: LineaTiempo; bloques: BloqueDisp[] }> = ({
  graficos,
  lt,
  bloques,
}) => (
  <>
    {graficos.map((gc, i) => (
      <Sequence
        key={i}
        from={gc.desde}
        durationInFrames={gc.hasta - gc.desde}
        name={`Gráfico ${gc.g.tipo}`}
        layout="none"
      >
        <GraficoEnZona gc={gc} lt={lt} bloques={bloques} />
      </Sequence>
    ))}
  </>
);

// Fondo de marca que asoma cuando la ponente se reduce (esquina / dividida).
export const FondoMarca: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.bg, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 800,
        top: -500,
        width: 1400,
        height: 1400,
        borderRadius: "50%",
        background: radialGlow,
        opacity: 0.22,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${COLOR.line}22 1px, transparent 1px), linear-gradient(90deg, ${COLOR.line}22 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }}
    />
  </AbsoluteFill>
);
