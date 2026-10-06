/**
 * Ilustración en 2,5D (METODO §7.4): plano subdividido desplazado por un mapa de profundidad en el shader de
 * vértices, con COMPENSACIÓN PROYECTIVA `p.xy *= (D − z) / D` (desde la cámara de reposo se ve idéntica al
 * original; al moverla aparece el parallax). `anchor(u, v, lift)` convierte un píxel de la imagen en un punto
 * 3D sobre la superficie, para colocar objetos 3D y etiquetas 2D que siguen al dibujo.
 * La oclusión la resuelve el buffer de profundidad.
 */
import React, { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { ease, lerp, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import { Objeto3D } from "./catalogo";
import type { Vec3 } from "./Escenario";
import { Escenario } from "./Escenario";
import { worldToScreen } from "./pantalla";

const D = 10; // distancia de la cámara de reposo al plano
const FOV = 30;
const PROFUNDIDAD = 1.8; // unidades de desplazamiento para blanco = 1 (METODO: ≈1,8)
const SOBREESCALA = 1.08; // margen para que los bordes no asomen al mover la cámara

type Imagenes = { color: HTMLImageElement; prof: HTMLImageElement; muestras: Float32Array; mw: number; mh: number };

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`No se pudo cargar la imagen ${src.split("?")[0]}`));
    img.src = src;
  });

const useImagenes = (color: string, prof: string) => {
  const [datos, setDatos] = useState<Imagenes | null>(null);
  const [handle] = useState(() => delayRender(`Ilustración ${color.split("?")[0]}`));
  useEffect(() => {
    Promise.all([cargarImagen(color), cargarImagen(prof)])
      .then(([c, p]) => {
        // Muestras de profundidad en CPU (reducidas) para los anclajes.
        const mw = 256;
        const mh = Math.max(2, Math.round((256 * p.naturalHeight) / p.naturalWidth));
        const cv = document.createElement("canvas");
        cv.width = mw;
        cv.height = mh;
        const ctx = cv.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(p, 0, 0, mw, mh);
        const px = ctx.getImageData(0, 0, mw, mh).data;
        const muestras = new Float32Array(mw * mh);
        for (let i = 0; i < mw * mh; i++) muestras[i] = px[i * 4] / 255;
        setDatos({ color: c, prof: p, muestras, mw, mh });
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [color, prof, handle]);
  return datos;
};

const VERT = /* glsl */ `
  uniform sampler2D prof;
  uniform float escalaZ;
  uniform float D;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float d = texture2D(prof, uv).r;
    vec3 p = position;
    p.z = d * escalaZ;
    p.xy *= (D - p.z) / D;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D mapa;
  varying vec2 vUv;
  void main() { gl_FragColor = texture2D(mapa, vUv); }
`;

export type AnclaIlustracion = { u: number; v: number; lift: number; texto?: string; objeto?: string; en?: number };

export const Ilustracion: React.FC<{
  imagen: string;
  profundidad: string;
  ancho: number;
  alto: number;
  dur: number;
  camara: { desde: Vec3; hasta: Vec3 };
  anclas: AnclaIlustracion[];
  acento: string;
  segmentos?: [number, number];
}> = ({ imagen, profundidad, ancho, alto, dur, camara, anclas, acento, segmentos = [240, 135] }) => {
  const tema = useTema();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = useImagenes(imagen, profundidad);

  // Plano que cubre el lienzo en reposo (con el aspecto de la imagen).
  const altoVista = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * D;
  const anchoVista = altoVista * (ancho / alto);
  const aspImg = img ? img.color.naturalWidth / img.color.naturalHeight : ancho / alto;
  const [pw, ph] = aspImg >= ancho / alto ? [altoVista * aspImg, altoVista] : [anchoVista, anchoVista / aspImg];
  const PW = pw * SOBREESCALA;
  const PH = ph * SOBREESCALA;

  const geo = useMemo(() => new THREE.PlaneGeometry(PW, PH, segmentos[0], segmentos[1]), [PW, PH, segmentos]);
  const uniforms = useMemo(() => {
    if (!img) return null;
    const mapa = new THREE.Texture(img.color);
    mapa.colorSpace = THREE.NoColorSpace; // píxeles tal cual: entrada y salida sin conversión
    mapa.needsUpdate = true;
    const prof = new THREE.Texture(img.prof);
    prof.colorSpace = THREE.NoColorSpace;
    prof.needsUpdate = true;
    return { mapa: { value: mapa }, prof: { value: prof }, escalaZ: { value: PROFUNDIDAD }, D: { value: D } };
  }, [img]);

  const k = ease.sineInOut(Math.max(0, Math.min(1, f / Math.max(1, dur))));
  const off: Vec3 = [lerp(camara.desde[0], camara.hasta[0], k), lerp(camara.desde[1], camara.hasta[1], k), lerp(camara.desde[2], camara.hasta[2], k)];
  const pos: Vec3 = [off[0], off[1], D + off[2]];
  const mira: Vec3 = [off[0] * 0.35, off[1] * 0.35, 0];

  // Cámara equivalente en JS para proyectar los anclajes a pantalla.
  const camJs = useMemo(() => {
    const c = new THREE.PerspectiveCamera(FOV, ancho / alto, 0.1, 100);
    return c;
  }, [ancho, alto]);
  camJs.position.set(...pos);
  camJs.lookAt(...mira);
  camJs.updateMatrixWorld();
  camJs.updateProjectionMatrix();

  /** anchor(u, v, lift): píxel de la imagen (0–1) → punto 3D sobre la superficie desplazada. */
  const anchor = (u: number, v: number, lift: number) => {
    let d = 0;
    if (img) {
      const x = Math.max(0, Math.min(img.mw - 1, u * (img.mw - 1)));
      const y = Math.max(0, Math.min(img.mh - 1, v * (img.mh - 1)));
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(img.mw - 1, x0 + 1);
      const y1 = Math.min(img.mh - 1, y0 + 1);
      const s = (xx: number, yy: number) => img.muestras[yy * img.mw + xx];
      const a = lerp(s(x0, y0), s(x1, y0), x - x0);
      const b = lerp(s(x0, y1), s(x1, y1), x - x0);
      d = lerp(a, b, y - y0);
    }
    const z = d * PROFUNDIDAD;
    const comp = (D - z) / D;
    return new THREE.Vector3((u - 0.5) * PW * comp, (0.5 - v) * PH * comp, z + lift);
  };

  if (!img || !uniforms) return null;
  return (
    <>
      <Escenario width={ancho} height={alto} camara={{ pos, mira, fov: FOV }} style={{ left: 0, top: 0 }}>
        <mesh geometry={geo}>
          <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} toneMapped={false} />
        </mesh>
        {anclas.map((a, i) =>
          a.objeto ? (
            <group key={i} position={anchor(a.u, a.v, a.lift + 0.25).toArray()} scale={0.28 * tween(f, a.en ?? 10 + i * 8, 14, 0.001, 1, ease.backOut)}>
              <Objeto3D nombre={a.objeto} t={f / fps} aparece={0} acento={acento} />
            </group>
          ) : null,
        )}
      </Escenario>
      {anclas.map((a, i) => {
        if (!a.texto) return null;
        const p = anchor(a.u, a.v, a.lift + (a.objeto ? 0.9 : 0));
        const [sx, sy] = worldToScreen(p, camJs, ancho, alto);
        const ke = tween(f, (a.en ?? 10 + i * 8) + 6, 12, 0, 1, tema.mov.ease);
        return (
          <div
            key={`t${i}`}
            style={{
              position: "absolute",
              left: sx - 300,
              top: sy - 70,
              width: 600,
              display: "flex",
              justifyContent: "center",
              opacity: ke,
              transform: `translateY(${(1 - ke) * 12}px)`,
            }}
          >
            <div
              style={{
                ...tema.t.etiqueta,
                fontSize: 26,
                padding: "10px 20px",
                borderRadius: tema.forma.radioPildora,
                background: tema.c.superficie,
                color: tema.c.texto,
                border: `3px solid ${tema.estiloPanel === "tinta" ? tema.c.tinta : acento}`,
                boxShadow: tema.forma.sombra,
                whiteSpace: "nowrap",
              }}
            >
              {a.texto}
            </div>
            <div style={{ position: "absolute", top: 58, left: 297, width: 6, height: 20, background: acento, borderRadius: 3 }} />
          </div>
        );
      })}
    </>
  );
};
