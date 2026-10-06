import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

// Luces y sombras idénticas a remotion-test/src/escenas/Objeto3D.tsx.
export const Luces: React.FC<{ sombra?: number }> = ({ sombra = 2048 }) => (
  <>
    <ambientLight color="#9FB8FF" intensity={0.4} />
    <directionalLight
      color="#FFFFFF"
      intensity={2.5}
      position={[4, 7, 5]}
      castShadow
      shadow-mapSize={[sombra, sombra]}
      shadow-normalBias={0.02}
    >
      <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 30]} />
    </directionalLight>
    <pointLight color="#6FA8FF" intensity={40} position={[-3, 2, -3]} />
  </>
);

export const Suelo: React.FC<{ y?: number; opacidad?: number }> = ({ y = -1.6, opacidad = 0.35 }) => (
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <planeGeometry args={[20, 20]} />
    <shadowMaterial opacity={opacidad} />
  </mesh>
);

export const Camara: React.FC<{ pos: [number, number, number]; mira?: [number, number, number] }> = ({
  pos,
  mira = [0, -0.1, 0],
}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.lookAt(...mira);
  }, [camera, pos, mira]);
  return null;
};

export const Escenario: React.FC<{
  width: number;
  height: number;
  fov?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ width, height, fov = 35, style, children }) => (
  <ThreeCanvas
    width={width}
    height={height}
    dpr={1}
    shadows
    camera={{ fov, near: 0.1, far: 100, position: [0, 0.8, 8] }}
    style={{ position: "absolute", ...style }}
  >
    {children}
  </ThreeCanvas>
);

// Tipografía 3D (Droid Sans Bold, Apache-2.0; subconjunto con tildes y eñe).
let fuentePromesa: Promise<Font> | null = null;
const cargarFuente3D = () => {
  if (!fuentePromesa) {
    fuentePromesa = fetch(staticFile("fonts/3d/droid_sans_bold.typeface.json"))
      .then((r) => r.json())
      .then((json) => new FontLoader().parse(json));
  }
  return fuentePromesa;
};

export const useFuente3D = () => {
  const [fuente, setFuente] = useState<Font | null>(null);
  const [handle] = useState(() => delayRender("Fuente 3D"));
  useEffect(() => {
    cargarFuente3D()
      .then((f) => {
        setFuente(f);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return fuente;
};
