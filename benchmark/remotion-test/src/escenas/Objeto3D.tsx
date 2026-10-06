import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect } from "react";
import { COLOR, ease, kickerStyle, radialGlow, sceneStyle, tween, useTime } from "../tema";

export const OBJETO_FROM = 150; // 5,0 s

const SCENE_START = 5.0;
const SCENE_END = 15.6;

const CameraRig: React.FC<{ z: number }> = ({ z }) => {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 0.8, z);
    camera.lookAt(0, -0.1, 0);
  }, [camera, z]);
  return null;
};

const Escena3D: React.FC = () => {
  const t = useTime(OBJETO_FROM);
  const u = t - SCENE_START;

  const z = tween(t, SCENE_START, SCENE_END - SCENE_START, 8.2, 7.2);
  const scale = tween(t, 5.2, 1.2, 0.001, 1, ease.power3Out);

  return (
    <>
      <CameraRig z={z} />
      <ambientLight color="#9FB8FF" intensity={0.4} />
      <directionalLight
        color="#FFFFFF"
        intensity={2.5}
        position={[4, 7, 5]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 30]} />
      </directionalLight>
      <pointLight color="#6FA8FF" intensity={40} position={[-3, 2, -3]} />

      <mesh
        castShadow
        scale={scale}
        rotation={[0.4 + Math.sin(u * 0.7) * 0.2, u * 0.9, 0]}
        position={[0, Math.sin(u * 1.3) * 0.12, 0]}
      >
        <torusKnotGeometry args={[1, 0.32, 256, 40]} />
        <meshStandardMaterial color={COLOR.accent} roughness={0.28} metalness={0.1} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
    </>
  );
};

export const Objeto3D: React.FC = () => {
  const t = useTime(OBJETO_FROM);

  const sceneX =
    t < 15.0 ? tween(t, 5.0, 0.6, 1920, 0, ease.power3InOut) : tween(t, 15.0, 0.6, 0, -1920, ease.power3InOut);

  // Resplandor: aparece y después respira.
  let glowOpacity: number;
  let glowScale: number;
  if (t < 6.6) {
    glowOpacity = tween(t, 5.6, 1.0, 0, 0.4, ease.power2Out);
    glowScale = tween(t, 5.6, 1.0, 0.8, 1, ease.power2Out);
  } else {
    const s = Math.sin(tween(t, 6.6, 9.0, 0, Math.PI * 6));
    glowOpacity = 0.4 + s * 0.05;
    glowScale = 1 + s * 0.04;
  }

  return (
    <div style={{ ...sceneStyle, transform: `translateX(${sceneX}px)` }}>
      <div
        style={{
          position: "absolute",
          left: 920,
          top: 90,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: radialGlow,
          opacity: glowOpacity,
          transform: `scale(${glowScale})`,
        }}
      />

      <ThreeCanvas
        width={1100}
        height={1080}
        dpr={1}
        shadows
        camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0.8, 8.2] }}
        style={{ position: "absolute", left: 820, top: 0 }}
      >
        <Escena3D />
      </ThreeCanvas>

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 0,
          bottom: 0,
          width: 680,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...kickerStyle,
            opacity: tween(t, 5.7, 0.6, 0, 1, ease.power3Out),
            transform: `translateX(${tween(t, 5.7, 0.6, -40, 0, ease.power3Out)}px)`,
          }}
        >
          01 · ESCENAS 3D
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 88,
            fontWeight: 900,
            lineHeight: 1.05,
            color: COLOR.fg,
            textWrap: "balance",
            opacity: tween(t, 5.85, 0.7, 0, 1, ease.power3Out),
            transform: `translateY(${tween(t, 5.85, 0.7, 40, 0, ease.power3Out)}px)`,
          }}
        >
          Luces, materiales y sombras
        </div>
        <div
          style={{
            maxWidth: 600,
            marginTop: 32,
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.35,
            color: COLOR.muted,
            textWrap: "balance",
            opacity: tween(t, 6.1, 0.6, 0, 1, ease.power2Out),
            transform: `translateY(${tween(t, 6.1, 0.6, 30, 0, ease.power2Out)}px)`,
          }}
        >
          Un objeto real, renderizado fotograma a fotograma
        </div>
      </div>
    </div>
  );
};
