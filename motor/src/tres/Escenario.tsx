/**
 * Escenario 3D con `@remotion/three` (`ThreeCanvas`). Todo declarado en JSX y determinista: nada de
 * `useFrame`, efectos que añadan mallas después del primer fotograma (el motivo por el que `Outlines` de drei
 * no se pintaba en el render) ni cargas de fuentes (`Text` de drei).
 *
 * - `flat` (sin tone mapping) cuando el estilo es toon, para que los colores sean los de los tokens.
 * - Sin mapas de sombras: una sombra de contacto (plano con degradado) cuesta casi nada en swangle.
 */
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useTema } from "../tema/Motor";

export type Vec3 = [number, number, number];

export const CamaraFija: React.FC<{ pos: Vec3; mira?: Vec3; fov?: number }> = ({ pos, mira = [0, 0, 0], fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    if (fov && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(mira[0], mira[1], mira[2]);
    camera.updateMatrixWorld();
  }, [camera, pos, mira, fov]);
  return null;
};

export const Luces: React.FC = () => {
  const tema = useTema();
  if (tema.tres.toon) {
    return (
      <>
        <ambientLight intensity={0.55} color="#FFFFFF" />
        <directionalLight intensity={2.2} position={[4, 6, 6]} color="#FFFFFF" />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={0.55} color={tema.mezcla("#FFFFFF", tema.c.acento, 0.25)} />
      <hemisphereLight intensity={0.5} color="#FFFFFF" groundColor={tema.c.fondo} />
      <directionalLight intensity={2.4} position={[4, 7, 5]} color="#FFFFFF" />
      <pointLight intensity={30} position={[-3.5, 2, -3]} color={tema.c.acento} />
    </>
  );
};

/** Sombra de contacto: un plano con degradado radial bajo el objeto. */
export const SombraContacto: React.FC<{ y?: number; radio?: number; opacidad?: number }> = ({ y = -1.6, radio = 2.2, opacidad = 0.4 }) => {
  const tema = useTema();
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.55, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
  const color = tema.oscuro ? "#000000" : tema.c.tinta;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[radio * 2, radio * 2]} />
      <meshBasicMaterial map={tex} color={color} transparent opacity={opacidad} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const Escenario: React.FC<{
  width: number;
  height: number;
  camara?: { pos: Vec3; mira?: Vec3; fov?: number };
  style?: React.CSSProperties;
  sinLuces?: boolean;
  children: React.ReactNode;
}> = ({ width, height, camara = { pos: [0, 0.6, 7.6] }, style, sinLuces, children }) => {
  const tema = useTema();
  const fov = camara.fov ?? 35;
  return (
    <ThreeCanvas
      width={Math.max(2, Math.round(width))}
      height={Math.max(2, Math.round(height))}
      dpr={1}
      flat={tema.tres.toon}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov, near: 0.1, far: 100, position: camara.pos }}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      <CamaraFija pos={camara.pos} mira={camara.mira} fov={fov} />
      {sinLuces ? null : <Luces />}
      {children}
    </ThreeCanvas>
  );
};
