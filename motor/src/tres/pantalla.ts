/**
 * Conversión pantalla ↔ mundo para anclar 3D a puntos de la imagen (manos, ilustraciones).
 *
 * Cadena del gesto (METODO §7.5): px de la FUENTE → cámara virtual → px de PANTALLA → MUNDO.
 * La cámara 3D es una perspectiva que mira hacia −z desde (0, 0, dist) y ocupa todo el lienzo.
 */
import * as THREE from "three";
import type { Gesto, Punto, Timeline } from "../datos/contrato";
import type { Camara, Lienzo } from "../lib/camara";
import { fuenteAPantalla } from "../lib/camara";

export type Camara3D = { fov: number; dist: number };

/** Punto de pantalla (px) → punto del plano z = `z` en coordenadas del mundo. */
export const screenToWorld = (px: number, py: number, lienzo: Lienzo, cam: Camara3D, z = 0): [number, number, number] => {
  const ndcX = (px / lienzo.ancho) * 2 - 1;
  const ndcY = 1 - (py / lienzo.alto) * 2;
  const d = cam.dist - z;
  const medioAlto = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * d;
  const medioAncho = medioAlto * (lienzo.ancho / lienzo.alto);
  return [ndcX * medioAncho, ndcY * medioAlto, z];
};

/** Unidades del mundo por píxel de pantalla en el plano z. */
export const mundoPorPixel = (lienzo: Lienzo, cam: Camara3D, z = 0) =>
  (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * (cam.dist - z)) / lienzo.alto;

/** Mundo → pantalla con una cámara three.js ya colocada (para etiquetas 2D sobre objetos 3D). */
export const worldToScreen = (p: THREE.Vector3, camara: THREE.Camera, ancho: number, alto: number): [number, number, number] => {
  const v = p.clone().project(camara);
  return [((v.x + 1) / 2) * ancho, ((1 - v.y) / 2) * alto, v.z];
};

const medio = (a: Punto, b: Punto): Punto => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export type Ancla = { centro: Punto; separacion: number; congelado: boolean; cam: Camara };

/**
 * Ancla de un gesto en PANTALLA en el fotograma `f`: punto medio de las muñecas pasado por la cámara virtual.
 * Antes del pico sigue la pista (si la hay); desde el pico el punto queda CONGELADO (si no, el objeto
 * acompañaría a las manos cuando bajan).
 */
export const anclaGesto = (g: Gesto, f: number, camaraDe: (f: number) => Camara): Ancla => {
  const congelado = f >= g.pico || !g.pista?.length;
  const fRef = congelado ? g.pico : f;
  const cam = camaraDe(fRef);
  let munecas = g.munecas;
  if (!congelado && g.pista) {
    const pista = g.pista;
    const i = pista.findLastIndex((m) => m.f <= f);
    if (i < 0) munecas = pista[0].munecas;
    else if (i >= pista.length - 1) munecas = pista[pista.length - 1].munecas;
    else {
      const a = pista[i];
      const b = pista[i + 1];
      const k = (f - a.f) / Math.max(1, b.f - a.f);
      munecas = [
        [a.munecas[0][0] + (b.munecas[0][0] - a.munecas[0][0]) * k, a.munecas[0][1] + (b.munecas[0][1] - a.munecas[0][1]) * k],
        [a.munecas[1][0] + (b.munecas[1][0] - a.munecas[1][0]) * k, a.munecas[1][1] + (b.munecas[1][1] - a.munecas[1][1]) * k],
      ];
    }
  }
  const a = fuenteAPantalla(cam, munecas[0]);
  const b = fuenteAPantalla(cam, munecas[1]);
  return { centro: medio(a, b), separacion: Math.hypot(a[0] - b[0], a[1] - b[1]), congelado, cam };
};

/** Gesto de `timeline.gestos` que corresponde a un evento gesto3d (el que más se solapa con él). */
export const gestoDeEvento = (tl: Timeline, desde: number, hasta: number): Gesto | null => {
  let mejor: Gesto | null = null;
  let solape = 0;
  for (const g of tl.gestos) {
    const s = Math.min(hasta, g.hasta) - Math.max(desde, g.desde);
    if (s > solape) {
      solape = s;
      mejor = g;
    }
  }
  return mejor;
};
