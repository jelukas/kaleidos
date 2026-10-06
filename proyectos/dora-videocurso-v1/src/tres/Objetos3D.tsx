import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { COLOR, ease, tween } from "../tema";

const MAT = { roughness: 0.28, metalness: 0.1 };

// ——— Texto 3D extruido ———
export const Texto3D: React.FC<{
  fuente: Font;
  texto: string;
  tam?: number;
  fondo?: number;
  color?: string;
  centrar?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ fuente, texto, tam = 1, fondo = 0.3, color = COLOR.accent, centrar = true, position, rotation, scale = 1 }) => {
  const geo = useMemo(() => {
    const g = new TextGeometry(texto, {
      font: fuente,
      size: tam,
      depth: fondo,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: tam * 0.04,
      bevelSize: tam * 0.025,
      bevelSegments: 3,
    });
    if (centrar) g.center();
    return g;
  }, [fuente, texto, tam, fondo, centrar]);
  return (
    <mesh geometry={geo} castShadow position={position} rotation={rotation} scale={scale}>
      <meshStandardMaterial color={color} {...MAT} />
    </mesh>
  );
};

// ——— Escudo (resiliencia operativa) con marca de verificación ———
const formaEscudo = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 1.25);
  s.lineTo(1.0, 0.9);
  s.lineTo(1.0, 0.05);
  s.bezierCurveTo(1.0, -0.7, 0.45, -1.1, 0, -1.3);
  s.bezierCurveTo(-0.45, -1.1, -1.0, -0.7, -1.0, 0.05);
  s.lineTo(-1.0, 0.9);
  s.closePath();
  return s;
};
const formaCheck = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0.05);
  s.lineTo(-0.15, -0.32);
  s.lineTo(0.55, 0.45);
  s.lineTo(0.42, 0.57);
  s.lineTo(-0.15, -0.06);
  s.lineTo(-0.37, 0.18);
  s.closePath();
  return s;
};

export const Escudo3D: React.FC<{ t: number; aparece?: number; check?: number; position?: [number, number, number] }> = ({
  t,
  aparece = 0,
  check = 0.6,
  position = [0, 0, 0],
}) => {
  const escudo = useMemo(
    () =>
      new THREE.ExtrudeGeometry(formaEscudo(), {
        depth: 0.34,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.06,
        bevelSegments: 4,
        curveSegments: 24,
      }).center(),
    [],
  );
  const marca = useMemo(
    () =>
      new THREE.ExtrudeGeometry(formaCheck(), {
        depth: 0.18,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 2,
      }).center(),
    [],
  );
  const s = tween(t, aparece, 1.2, 0.001, 1, ease.power3Out);
  const sc = tween(t, check, 0.6, 0.001, 1, ease.backOut);
  return (
    <group
      position={[position[0], position[1] + Math.sin(t * 1.3) * 0.08, position[2]]}
      rotation={[0.12 + Math.sin(t * 0.7) * 0.08, Math.sin(t * 0.6) * 0.55, 0]}
      scale={s}
    >
      <mesh geometry={escudo} castShadow>
        <meshStandardMaterial color={COLOR.accent} {...MAT} />
      </mesh>
      <mesh geometry={marca} castShadow position={[0, 0.02, 0.33]} scale={sc}>
        <meshStandardMaterial color={COLOR.fg} roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  );
};

// ——— Cadena de subcontratación: banco → proveedor → subcontratistas ———
export const Cadena3D: React.FC<{ t: number; fuente: Font; etiquetas: string[]; enes: number[] }> = ({
  t,
  fuente,
  etiquetas,
  enes,
}) => {
  const caja = useMemo(() => new RoundedBoxGeometry(1.3, 1.3, 1.3, 4, 0.16), []);
  const n = etiquetas.length;
  const paso = 2.5;
  const x0 = -((n - 1) * paso) / 2;
  // Colores con contraste sobre el fondo azul marino: banco claro, proveedor en acento, dependencias en ámbar.
  const colores = [COLOR.fg, COLOR.accent, COLOR.mid, COLOR.warn, COLOR.bad];
  return (
    <group rotation={[0.16, -0.1 + Math.sin(t * 0.3) * 0.04, 0]}>
      {etiquetas.map((e, i) => {
        const k = tween(t, enes[i], 0.8, 0.001, 1, ease.backOut);
        const enlace = i > 0 ? tween(t, enes[i] - 0.2, 0.5, 0.001, 1, ease.power3Out) : 0;
        const x = x0 + i * paso;
        const flota = Math.sin(t * 1.2 + i) * 0.06;
        // Etiquetas alternas arriba y abajo para que no se solapen.
        const yEtiqueta = i % 2 === 0 ? 1.2 : -1.25;
        return (
          <group key={i}>
            {i > 0 ? (
              <mesh castShadow position={[x - paso / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, enlace, 1]}>
                <cylinderGeometry args={[0.08, 0.08, paso - 1.25, 16]} />
                <meshStandardMaterial color={COLOR.muted} {...MAT} />
              </mesh>
            ) : null}
            <mesh geometry={caja} castShadow position={[x, flota, 0]} scale={k} rotation={[0, t * 0.4 + i, 0]}>
              <meshStandardMaterial color={colores[i % colores.length]} {...MAT} />
            </mesh>
            <Texto3D
              fuente={fuente}
              texto={e}
              tam={0.27}
              fondo={0.07}
              color={COLOR.fg}
              position={[x, yEtiqueta + flota, 0.2]}
              scale={k}
            />
          </group>
        );
      })}
    </group>
  );
};

// ——— Registro de información: fichas que caen y se apilan ———
export const Registro3D: React.FC<{ t: number; enes: number[] }> = ({ t, enes }) => {
  const ficha = useMemo(() => new RoundedBoxGeometry(2.4, 0.16, 1.5, 3, 0.05), []);
  return (
    <group rotation={[0.35, -0.5 + t * 0.12, 0]} position={[0, -0.9, 0]}>
      {enes.map((en, i) => {
        const cae = tween(t, en, 0.7, 4, 0, ease.power3Out);
        const k = t >= en ? 1 : 0.001;
        return (
          <group key={i} position={[Math.sin(i * 2.1) * 0.08, i * 0.2 + cae, Math.cos(i * 1.7) * 0.06]} scale={k}>
            <mesh geometry={ficha} castShadow receiveShadow>
              <meshStandardMaterial color={i % 2 ? COLOR.panel : COLOR.mid} {...MAT} />
            </mesh>
            <mesh position={[-0.7, 0.09, 0]}>
              <boxGeometry args={[0.6, 0.02, 1.1]} />
              <meshStandardMaterial color={COLOR.accent} {...MAT} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ——— Contrato con sello ———
export const Contrato3D: React.FC<{ t: number; sello: number }> = ({ t, sello }) => {
  const hoja = useMemo(() => new RoundedBoxGeometry(2.2, 3.0, 0.1, 2, 0.04), []);
  const baja = tween(t, sello, 0.35, 1.6, 0, ease.power1In);
  const golpe = tween(t, sello + 0.35, 0.3, 1.15, 1, ease.power2Out);
  return (
    <group rotation={[-0.35, 0.35 + Math.sin(t * 0.5) * 0.1, 0.05]} position={[0, 0.1, 0]}>
      <mesh geometry={hoja} castShadow>
        <meshStandardMaterial color={COLOR.fg} roughness={0.5} metalness={0} />
      </mesh>
      {[0.95, 0.6, 0.25, -0.1, -0.45].map((y, i) => (
        <mesh key={i} position={[-0.15 + (i === 4 ? -0.3 : 0), y, 0.06]}>
          <boxGeometry args={[i === 4 ? 1.0 : 1.6, 0.08, 0.02]} />
          <meshStandardMaterial color={COLOR.line} {...MAT} />
        </mesh>
      ))}
      <mesh castShadow position={[0.55, -0.95, 0.12 + baja]} rotation={[Math.PI / 2, 0, 0]} scale={t >= sello ? golpe : 0.001}>
        <cylinderGeometry args={[0.42, 0.42, 0.14, 40]} />
        <meshStandardMaterial color={COLOR.accent} {...MAT} />
      </mesh>
    </group>
  );
};

// ——— Estrategia de salida: puerta con flecha que la atraviesa ———
const formaFlecha = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.9, 0.16);
  s.lineTo(0.3, 0.16);
  s.lineTo(0.3, 0.45);
  s.lineTo(0.9, 0);
  s.lineTo(0.3, -0.45);
  s.lineTo(0.3, -0.16);
  s.lineTo(-0.9, -0.16);
  s.closePath();
  return s;
};

export const Salida3D: React.FC<{ t: number; sale: number }> = ({ t, sale }) => {
  const flecha = useMemo(
    () => new THREE.ExtrudeGeometry(formaFlecha(), { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04 }).center(),
    [],
  );
  const x = tween(t, sale, 1.2, -1.6, 2.2, ease.power3InOut);
  return (
    <group rotation={[0.1, -0.55, 0]}>
      {[
        [-0.8, 0.2, 0, 0.18, 2.8, 0.3],
        [0.8, 0.2, 0, 0.18, 2.8, 0.3],
        [0, 1.55, 0, 1.78, 0.18, 0.3],
      ].map(([px, py, pz, sx, sy, sz], i) => (
        <mesh key={i} castShadow position={[px, py, pz]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={COLOR.fg} {...MAT} />
        </mesh>
      ))}
      <mesh geometry={flecha} castShadow position={[x, 0.1, 0.05]} rotation={[0, Math.PI / 2 - 0.2, 0]}>
        <meshStandardMaterial color={COLOR.accent} {...MAT} />
      </mesh>
    </group>
  );
};

// ——— Balanza: evaluación del riesgo (se inclina al añadir pesos) ———
export const Balanza3D: React.FC<{ t: number; enes: number[] }> = ({ t, enes }) => {
  const pesosIzq = enes.filter((_, i) => i % 2 === 0).map((e) => (t >= e ? 1 : 0)).reduce<number>((a, b) => a + b, 0);
  const pesosDer = enes.filter((_, i) => i % 2 === 1).map((e) => (t >= e ? 1 : 0)).reduce<number>((a, b) => a + b, 0);
  const objetivo = (pesosDer - pesosIzq) * 0.12;
  const ultimo = Math.max(0, ...enes.filter((e) => t >= e));
  const inclina = objetivo * tween(t, ultimo, 0.8, 0.4, 1, ease.backOut);
  return (
    <group position={[0, -0.4, 0]} rotation={[0.1, 0.35, 0]}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 2.2, 20]} />
        <meshStandardMaterial color={COLOR.muted} {...MAT} />
      </mesh>
      <group position={[0, 1.4, 0]} rotation={[0, 0, -inclina]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 0.1, 0.14]} />
          <meshStandardMaterial color={COLOR.fg} {...MAT} />
        </mesh>
        {[-1.5, 1.5].map((x, lado) => (
          <group key={x} position={[x, -0.75, 0]} rotation={[0, 0, inclina]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.55, 0.45, 0.08, 32]} />
              <meshStandardMaterial color={COLOR.accent} {...MAT} />
            </mesh>
            {enes
              .map((e, i) => ({ e, i }))
              .filter(({ i }) => i % 2 === lado)
              .map(({ e }, j) => (
                <mesh key={j} castShadow position={[0, 0.2 + j * 0.3, 0]} scale={tween(t, e, 0.5, 0.001, 1, ease.backOut)}>
                  <boxGeometry args={[0.5, 0.26, 0.5]} />
                  <meshStandardMaterial color={lado === 0 ? COLOR.mid : COLOR.warn} {...MAT} />
                </mesh>
              ))}
          </group>
        ))}
      </group>
    </group>
  );
};

// ——— Transición 3D: losetas que giran para tapar y destapar el plano ———
export const Losetas3D: React.FC<{ t: number; dur: number; columnas?: number; filas?: number }> = ({
  t,
  dur,
  columnas = 8,
  filas = 5,
}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 0.12, 2, 0.03), []);
  // Cámara a z=8 con FOV 35: se ven 5,04 × 8,96 unidades.
  const alto = 5.1;
  const ancho = 9.1;
  const w = ancho / columnas;
  const h = alto / filas;
  const colores = [COLOR.accent, COLOR.mid, COLOR.panel, COLOR.deep];
  const mitad = dur / 2;
  return (
    <group>
      {Array.from({ length: columnas * filas }, (_, i) => {
        const c = i % columnas;
        const r = Math.floor(i / columnas);
        const retraso = (c + r) * 0.035;
        const entra = tween(t, retraso, 0.4, Math.PI / 2, 0, ease.power3Out);
        const sale = tween(t, mitad + retraso, 0.4, 0, -Math.PI / 2, ease.power3InOut);
        const rot = t < mitad + retraso ? entra : sale;
        const visible = Math.abs(rot) < Math.PI / 2 - 0.01;
        return (
          <mesh
            key={i}
            geometry={geo}
            castShadow
            visible={visible}
            position={[-ancho / 2 + w * (c + 0.5), alto / 2 - h * (r + 0.5) + 0.4, 0]}
            rotation={[0, rot, 0]}
            scale={[w * 1.01, h * 1.01, 1]}
          >
            <meshStandardMaterial color={colores[(c * 3 + r * 5) % colores.length]} {...MAT} />
          </mesh>
        );
      })}
    </group>
  );
};
