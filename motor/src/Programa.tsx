/**
 * El programa: la pila de capas (METODO §3 y §7.2), la misma para Horizontal y Vertical.
 *
 *   fondo del estilo → 3D detrás → ponente → 3D delante → paneles 2D → subtítulos → HUD → outro → grano
 *
 * Con recorte, «fondo + 3D detrás» se pintan dentro del grupo aislado del ponente (B = fondo·(1 − α)).
 * En MODO ESCENARIO (§7: timeline.escenario o tokens.escenario.activo) la pila es la de show/CapaEscenario.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import type { PropsMotor } from "./datos/contrato";
import { Capa3DDelante, Capa3DDetras, CapaIlustraciones } from "./capas/Capas3D";
import { Fondo } from "./capas/Fondo";
import { Grano } from "./capas/Grano";
import { Hud } from "./capas/Hud";
import { PonenteMarco, PonenteRecorte } from "./capas/Ponente";
import { Sonido } from "./capas/Sonido";
import { Subtitulos } from "./capas/Subtitulos";
import { CapaPaneles } from "./paneles/CapaPaneles";
import { CapaOutro, CapaRotulos } from "./paneles/Rotulos";
import { ConDatos, useMotor } from "./tema/Motor";
import { MarcaDepuracion } from "./capas/MarcaDepuracion";
import { PistaAudio } from "./capas/Musica";
import { CapasEscenario } from "./show/CapaEscenario";
import { HudFichas } from "./show/Fichas";
import { CapaShowNormal } from "./show/ShowNormal";

const Capas: React.FC = () => {
  const { tema, recorte, opciones, escenario, lienzo, timeline } = useMotor();
  if (escenario) return <CapasEscenario />;
  return (
    <AbsoluteFill style={{ background: tema.c.fondo, overflow: "hidden", fontFamily: tema.f.cuerpo }}>
      {recorte ? (
        <PonenteRecorte
          detras={
            <>
              <Fondo />
              <Capa3DDetras />
            </>
          }
        />
      ) : (
        <>
          <Fondo />
          <PonenteMarco />
        </>
      )}
      <CapaIlustraciones />
      <Capa3DDelante />
      <CapaRotulos />
      {opciones.perfil.has("sin-paneles") ? null : <CapaPaneles />}
      <CapaShowNormal />
      {opciones.subtitulos ? <Subtitulos /> : null}
      {opciones.hud ? tema.show.hud === "fichas" ? <HudFichas cx={lienzo.ancho / 2} y={28} tam={64} /> : <Hud /> : null}
      <CapaOutro />
      {opciones.grano ? <Grano /> : null}
      <PistaAudio />
      {opciones.sonido && !timeline.audio?.sfx?.length ? <Sonido /> : null}
      {opciones.marca ? <MarcaDepuracion /> : null}
    </AbsoluteFill>
  );
};

export const Horizontal: React.FC<PropsMotor> = (props) => (
  <ConDatos props={props}>
    <Capas />
  </ConDatos>
);

/** Vertical 1080×1920 con la misma línea de tiempo (versión básica: ponente arriba, gráficos abajo). */
export const Vertical: React.FC<PropsMotor> = (props) => (
  <ConDatos props={props} vertical>
    <Capas />
  </ConDatos>
);
