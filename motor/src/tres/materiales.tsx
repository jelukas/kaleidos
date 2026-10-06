/**
 * Materiales del estilo: estándar (PBR) o toon (`MeshToonMaterial` con rampa de N tonos, por defecto 3) y
 * CONTORNO DE TINTA PROPIO: casco invertido (la geometría inflada por la normal suavizada y pintada por detrás).
 * El casco se declara en JSX como hermano de la malla, así se pinta desde el primer fotograma.
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useTema } from "../tema/Motor";

const rampas = new Map<number, THREE.DataTexture>();

/** Rampa de tonos para el toon (filtro Nearest: escalones duros). */
export const rampaToon = (n: number) => {
  let r = rampas.get(n);
  if (!r) {
    const datos = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      // Sombra no negra (0,35) → luz plena: aspecto de ilustración.
      const v = Math.round(255 * (0.35 + (0.65 * i) / Math.max(1, n - 1)));
      datos.set([v, v, v, 255], i * 4);
    }
    r = new THREE.DataTexture(datos, n, 1, THREE.RGBAFormat);
    r.minFilter = THREE.NearestFilter;
    r.magFilter = THREE.NearestFilter;
    r.generateMipmaps = false;
    r.needsUpdate = true;
    rampas.set(n, r);
  }
  return r;
};

export type PropsMaterial = {
  color: string;
  rugosidad?: number;
  metal?: number;
  emisivo?: string;
  intensidadEmisiva?: number;
  opacidad?: number;
  lado?: THREE.Side;
};

export const Material: React.FC<PropsMaterial> = ({ color, rugosidad = 0.32, metal = 0.08, emisivo, intensidadEmisiva = 0, opacidad, lado }) => {
  const tema = useTema();
  const transparente = opacidad !== undefined && opacidad < 1;
  if (tema.tres.toon) {
    return (
      <meshToonMaterial
        color={color}
        gradientMap={rampaToon(tema.tres.rampa)}
        emissive={emisivo ?? "#000000"}
        emissiveIntensity={intensidadEmisiva}
        transparent={transparente}
        opacity={opacidad ?? 1}
        side={lado ?? THREE.FrontSide}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={color}
      roughness={rugosidad}
      metalness={metal}
      emissive={emisivo ?? "#000000"}
      emissiveIntensity={intensidadEmisiva}
      transparent={transparente}
      opacity={opacidad ?? 1}
      side={lado ?? THREE.FrontSide}
    />
  );
};

const cascos = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/** Geometría para el casco: vértices fusionados y normales suavizadas (sin grietas en las aristas). */
export const geometriaCasco = (g: THREE.BufferGeometry) => {
  let h = cascos.get(g);
  if (!h) {
    const base = g.index ? g.toNonIndexed() : g.clone();
    for (const nombre of Object.keys(base.attributes)) if (nombre !== "position") base.deleteAttribute(nombre);
    h = mergeVertices(base, 1e-3);
    h.computeVertexNormals();
    cascos.set(g, h);
  }
  return h;
};

const VERT = /* glsl */ `
  uniform float grosor;
  void main() {
    vec3 p = position + normalize(normal) * grosor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 color;
  uniform float opacidad;
  void main() { gl_FragColor = vec4(color, opacidad); }
`;

export const MaterialTinta: React.FC<{ grosor: number; opacidad?: number }> = ({ grosor, opacidad = 1 }) => {
  const tema = useTema();
  const uniforms = useMemo(
    () => ({ grosor: { value: grosor }, color: { value: new THREE.Color(tema.c.tinta) }, opacidad: { value: opacidad } }),
    [grosor, tema.c.tinta, opacidad],
  );
  return (
    <shaderMaterial
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      side={THREE.BackSide}
      transparent={opacidad < 1}
      depthWrite={opacidad >= 1}
      toneMapped={false}
    />
  );
};

type Transform = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
};

/**
 * Malla con el material del estilo y, si el estilo lo pide (toon + contornoTinta), su casco de tinta.
 * `grosor` en unidades del objeto (se escala con él).
 */
export const Solido: React.FC<Transform & PropsMaterial & { geometry: THREE.BufferGeometry; grosor?: number; sinTinta?: boolean }> = ({
  geometry,
  position,
  rotation,
  scale,
  visible = true,
  grosor = 0.035,
  sinTinta,
  ...mat
}) => {
  const tema = useTema();
  const conTinta = tema.tres.toon && tema.tres.tinta && !sinTinta;
  const casco = useMemo(() => (conTinta ? geometriaCasco(geometry) : null), [conTinta, geometry]);
  // Escalas nulas dan matrices singulares (normales NaN): se limitan a un mínimo.
  const s: number | [number, number, number] | undefined =
    typeof scale === "number" ? Math.max(1e-4, scale) : scale ? [Math.max(1e-4, scale[0]), Math.max(1e-4, scale[1]), Math.max(1e-4, scale[2])] : undefined;
  return (
    <group position={position} rotation={rotation} scale={s} visible={visible}>
      <mesh geometry={geometry}>
        <Material {...mat} />
      </mesh>
      {casco ? (
        <mesh geometry={casco}>
          <MaterialTinta grosor={grosor} opacidad={mat.opacidad} />
        </mesh>
      ) : null}
    </group>
  );
};

/** `useMemo` de geometrías con una clave estable. */
export const useGeo = <T extends THREE.BufferGeometry>(crear: () => T, deps: React.DependencyList) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(crear, deps);
