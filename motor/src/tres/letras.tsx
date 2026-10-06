/**
 * Texto 3D extruido (`letras`) con la `typeface.json` del site (`public/fonts/3d/droid_sans_bold.typeface.json`,
 * Droid Sans Bold, Apache 2.0, copiada de three/examples; tiene á é í ó ú ñ ü ¿ ¡ €). Sin descargas externas: se
 * lee con `staticFile` una vez por pestaña: `ConDatos` la carga antes de pintar el primer fotograma (si el hook la
 * cargase dentro del lienzo, R3F redibujaría DESPUÉS de la captura y las letras no saldrían). Una geometría por
 * letra (se animan por separado).
 */
import { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export const FUENTE_3D = "fonts/3d/droid_sans_bold.typeface.json";

let promesa: Promise<Font> | null = null;
let lista: Font | null = null;

/** Carga (una vez por pestaña) la fuente 3D. `ConDatos` la espera antes de pintar si el timeline usa «letras». */
export const cargarFuente3D = () => cargar();

/** ¿Usa el timeline el objeto «letras»? */
export const usaLetras = (eventos: { tipo: string; objeto?: string }[], extra: (string | null | undefined)[] = []) =>
  eventos.some((e) => (e.tipo === "escena3d" || e.tipo === "gesto3d") && e.objeto === "letras") || extra.includes("letras");

const cargar = () => {
  if (!promesa) {
    promesa = fetch(staticFile(FUENTE_3D))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => (lista = new FontLoader().parse(j)))
      .catch((e) => {
        promesa = null;
        throw new Error(`No se pudo leer la fuente 3D ${FUENTE_3D}: ${String(e)}`);
      });
  }
  return promesa;
};

/** La fuente 3D (null mientras carga; el render espera con delayRender). */
export const useFuente3D = () => {
  const [fuente, setFuente] = useState<Font | null>(lista);
  const [handle] = useState(() => (lista ? null : delayRender("Fuente 3D (typeface.json)")));
  useEffect(() => {
    if (fuente) {
      if (handle !== null) continueRender(handle);
      return;
    }
    cargar()
      .then((f) => {
        setFuente(f);
        if (handle !== null) continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [fuente, handle]);
  return fuente;
};

const geos = new Map<string, THREE.BufferGeometry>();
/** Alto de las mayúsculas (em) de Droid Sans: centra las letras en vertical sin moverlas del renglón. */
const ALTO_MAYUSCULA = 0.72;
export const FONDO_LETRA = 0.34;

/** Geometría de una letra con el origen en el centro de su avance y a media altura de mayúscula. */
export const geometriaLetra = (fuente: Font, ch: string) => {
  const clave = `${fuente.data.familyName}|${ch}`;
  let g = geos.get(clave);
  if (!g) {
    g = new TextGeometry(ch, { font: fuente, size: 1, depth: FONDO_LETRA, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.026, bevelSegments: 2 });
    g.translate(-avance(fuente, ch) / 2, -ALTO_MAYUSCULA / 2, -FONDO_LETRA / 2);
    geos.set(clave, g);
  }
  return g;
};

/** Avance horizontal (em) de una letra; las que no están en la fuente cuentan como un espacio. */
export const avance = (fuente: Font, ch: string) => {
  const glifos = fuente.data.glyphs as Record<string, { ha: number } | undefined>;
  const g = glifos[ch] ?? glifos[" "];
  return (g?.ha ?? 500) / fuente.data.resolution;
};

/** Letras sin glifo en la fuente (para avisar). */
export const faltanGlifos = (fuente: Font, texto: string) => {
  const glifos = fuente.data.glyphs as Record<string, unknown>;
  return [...new Set([...texto].filter((c) => c.trim() && !glifos[c]))];
};

export const useLetras = (texto: string) => {
  const fuente = useFuente3D();
  return useMemo(() => {
    if (!fuente) return null;
    const chars = [...texto].slice(0, 16);
    const faltan = faltanGlifos(fuente, texto);
    if (faltan.length) console.warn(`[motor] letras 3D: la fuente no tiene «${faltan.join("")}» (se dejan huecos)`);
    let x = 0;
    const out = chars.map((ch) => {
      const a = avance(fuente, ch);
      const c = { ch, x: x + a / 2, geo: ch.trim() && !faltan.includes(ch) ? geometriaLetra(fuente, ch) : null };
      x += a;
      return c;
    });
    return { letras: out.map((l) => ({ ...l, x: l.x - x / 2 })), ancho: x, alto: ALTO_MAYUSCULA };
  }, [fuente, texto]);
};

export type LetrasPreparadas = NonNullable<ReturnType<typeof useLetras>>;
