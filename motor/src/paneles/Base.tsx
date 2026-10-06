/** Piezas comunes de los paneles: marco con el estilo, cabecera, tamaños de texto y apariciones. */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Rect } from "../lib/disposicion";
import { tween } from "../tema/anim";
import type { Tema } from "../tema/tema";
import { useTema } from "../tema/Motor";

/** Aparición 0→1 en `en` (fotograma local) con la curva del estilo. */
export const useAparece = () => {
  const tema = useTema();
  const f = useCurrentFrame();
  return (en: number, dur = tema.mov.durEntrada) => tween(f, en, dur, 0, 1, tema.mov.ease);
};

/** Reduce el cuerpo de letra de textos largos para que no desborden. */
export const tamPorLargo = (texto: string | undefined, base: number, largoOk = 34) => {
  const n = texto?.length ?? 0;
  if (n <= largoOk) return base;
  return Math.max(base * 0.62, base * Math.sqrt(largoOk / n));
};

export type ContenidoProps<E> = { ev: E; dur: number; acento: string; ancho: number; alto: number; escala: number };

export const Kicker: React.FC<{ texto: string; color: string; k?: number; tam?: number }> = ({ texto, color, k = 1, tam = 22 }) => {
  const tema = useTema();
  return (
    <div
      style={{
        ...tema.t.etiqueta,
        fontSize: tam,
        color,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        opacity: k,
        transform: `translateX(${(1 - k) * -30}px)`,
      }}
    >
      {texto}
    </div>
  );
};

export const Cabecera: React.FC<{ kicker?: string; titulo?: string; acento: string; escala: number; tamTitulo?: number; margen?: number }> = ({
  kicker,
  titulo,
  acento,
  escala,
  tamTitulo = 52,
  margen = 34,
}) => {
  const tema = useTema();
  const ap = useAparece();
  const k = ap(1);
  const t = ap(4);
  if (!kicker && !titulo) return null;
  const color = tema.acentoTexto(acento);
  return (
    <div style={{ marginBottom: margen * escala }}>
      {kicker ? <Kicker texto={kicker} color={color} k={k} tam={22 * escala} /> : null}
      <div
        style={{
          width: 84 * escala,
          height: 6 * escala,
          borderRadius: 3 * escala,
          margin: `${16 * escala}px 0 ${titulo ? 18 * escala : 0}px`,
          background: acento,
          transformOrigin: "left",
          transform: `scaleX(${k})`,
        }}
      />
      {titulo ? (
        <div
          style={{
            ...tema.t.titular,
            fontSize: tamPorLargo(titulo, tamTitulo * escala, 30),
            lineHeight: tema.t.titular.lineHeight ?? 1.08,
            color: tema.c.texto,
            textWrap: "balance",
            opacity: t,
            transform: `translateY(${(1 - t) * 24}px)`,
          }}
        >
          {titulo}
        </div>
      ) : null}
    </div>
  );
};

/** Relleno interior del panel según el estilo. */
export const relleno = (tema: Tema, escala: number) => {
  const base = tema.estiloPanel === "tinta" ? 40 : 44;
  return { x: base * escala, y: (base - 4) * escala };
};

/** Marco de panel: se centra en vertical dentro de su zona y adopta el estilo de panel del estilo. */
export const MarcoPanel: React.FC<{ zona: Rect; acento: string; escala: number; sinCaja?: boolean; opaco?: boolean; children: React.ReactNode }> = ({
  zona,
  acento,
  escala,
  sinCaja,
  opaco,
  children,
}) => {
  const tema = useTema();
  const r = relleno(tema, escala);
  // (Probado: sacar la sombra difuminada a una capa propia no mejora el render por software; se deja en la caja.)
  return (
    <div
      style={{
        position: "absolute",
        left: zona.x,
        top: zona.y,
        width: zona.w,
        height: zona.h,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...(sinCaja ? {} : tema.panel(acento)),
          // Sobre el vídeo (pop sin recorte), el cristal translúcido pierde contraste: se hace opaco.
          ...(opaco && !sinCaja && tema.estiloPanel === "cristal" ? { background: tema.alpha(tema.c.superficie, 0.96) } : {}),
          padding: sinCaja ? 0 : `${r.y}px ${r.x}px`,
          fontFamily: tema.f.cuerpo,
          color: tema.c.texto,
          maxHeight: zona.h,
          overflow: "hidden",
          boxSizing: "border-box",
          transform: tema.estiloPanel === "papel" && !sinCaja ? "rotate(-0.35deg)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Bola numerada o con icono de las listas y pasos. */
export const Bola: React.FC<{ n?: number | string; color: string; tam: number; relleno?: boolean; children?: React.ReactNode }> = ({
  n,
  color,
  tam,
  relleno: lleno = true,
  children,
}) => {
  const tema = useTema();
  return (
    <div
      style={{
        width: tam,
        height: tam,
        borderRadius: tema.estiloPanel === "tinta" ? tam * 0.3 : tam / 2,
        background: lleno ? color : "transparent",
        border: tema.estiloPanel === "tinta" ? `3px solid ${tema.c.tinta}` : lleno ? undefined : `2px solid ${color}`,
        color: lleno ? tema.sobre(color) : color,
        ...tema.t.titular,
        fontSize: tam * 0.48,
        lineHeight: 1,
        letterSpacing: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children ?? n}
    </div>
  );
};
