/**
 * Texto sobre objetos 3D con `CanvasTexture` (un canvas 2D con la fuente del estilo, ya cargada por
 * `@remotion/fonts`). Nada de `Text` de drei: descargaría fuentes durante el render.
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { useTema } from "../tema/Motor";

export type OpcionesTexto = {
  familia: string;
  peso?: number | string;
  tam?: number; // px del canvas
  color: string;
  fondo?: string | null;
  borde?: string | null;
  radio?: number;
  relleno?: number;
  mayusculas?: boolean;
};

const cache = new Map<string, { textura: THREE.CanvasTexture; aspecto: number }>();

export const texturaTexto = (texto: string, o: OpcionesTexto) => {
  const clave = JSON.stringify([texto, o]);
  const hit = cache.get(clave);
  if (hit) return hit;
  const tam = o.tam ?? 96;
  const relleno = o.relleno ?? Math.round(tam * 0.45);
  const t = o.mayusculas ? texto.toUpperCase() : texto;
  const medir = document.createElement("canvas").getContext("2d")!;
  const fuente = `${o.peso ?? 700} ${tam}px ${o.familia}`;
  medir.font = fuente;
  const w = Math.ceil(medir.measureText(t).width + relleno * 2);
  const h = Math.ceil(tam * 1.35 + relleno * 1.2);
  const c = document.createElement("canvas");
  // Potencias de dos no son necesarias en WebGL2; se deja el tamaño justo.
  c.width = Math.max(4, w);
  c.height = Math.max(4, h);
  const ctx = c.getContext("2d")!;
  if (o.fondo || o.borde) {
    const r = Math.min(o.radio ?? h / 2, h / 2);
    const lw = o.borde ? Math.max(4, tam * 0.07) : 0;
    ctx.beginPath();
    ctx.roundRect(lw / 2, lw / 2, c.width - lw, c.height - lw, r);
    if (o.fondo) {
      ctx.fillStyle = o.fondo;
      ctx.fill();
    }
    if (o.borde) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = o.borde;
      ctx.stroke();
    }
  }
  ctx.font = fuente;
  ctx.fillStyle = o.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t, c.width / 2, c.height / 2 + tam * 0.04);
  const textura = new THREE.CanvasTexture(c);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  textura.needsUpdate = true;
  const r = { textura, aspecto: c.width / c.height };
  cache.set(clave, r);
  return r;
};

type TemaEtiqueta = ReturnType<typeof useTema>;

/** Opciones de la textura de una etiqueta 3D (las mismas para pintarla y para medirla). */
export const opcionesEtiqueta = (tema: TemaEtiqueta, color?: string, fondo?: string | null): OpcionesTexto => ({
  familia: tema.f.cuerpo,
  peso: tema.pesoFuerte,
  color: color ?? tema.c.texto,
  fondo: fondo === undefined ? tema.alpha(tema.c.superficie, 0.92) : fondo,
  borde: tema.estiloPanel === "tinta" || tema.tres.toon ? tema.c.tinta : null,
  radio: tema.forma.radio,
});

/** Ancho en unidades del mundo de una etiqueta de alto `alto` (para que los objetos la mantengan en el lienzo). */
export const anchoEtiqueta3D = (texto: string, alto: number, tema: TemaEtiqueta) => alto * texturaTexto(texto, opcionesEtiqueta(tema)).aspecto;

/** Etiqueta plana (siempre de cara a la cámara si está girada con el grupo padre a cero). */
export const Etiqueta3D: React.FC<{
  texto: string;
  alto?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  fondo?: string | null;
  opacidad?: number;
}> = ({ texto, alto = 0.42, position, rotation, scale = 1, color, fondo, opacidad = 1 }) => {
  const tema = useTema();
  const { textura, aspecto } = useMemo(() => texturaTexto(texto, opcionesEtiqueta(tema, color, fondo)), [texto, tema, color, fondo]);
  return (
    <mesh position={position} rotation={rotation} scale={Math.max(1e-4, scale)} renderOrder={5}>
      <planeGeometry args={[alto * aspecto, alto]} />
      <meshBasicMaterial map={textura} transparent opacity={opacidad} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};
