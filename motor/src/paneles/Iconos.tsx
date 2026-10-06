/**
 * Catálogo propio de iconos de línea (viewBox 48×48, sin descargas). Se «dibujan» con stroke-dashoffset.
 * `icono` en timeline.json es un nombre de este catálogo; uno desconocido pinta un punto (y no rompe).
 */
import React from "react";

const C = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

export const ICONOS: Record<string, string[]> = {
  escudo: ["M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11 Z", "M17 24 L22 29 L32 18"],
  contrato: ["M12 5 H30 L38 13 V43 H12 Z", "M30 5 V13 H38", "M17 21 H33", "M17 28 H33", "M17 35 H26"],
  documento: ["M12 5 H30 L38 13 V43 H12 Z", "M30 5 V13 H38", "M17 22 H33", "M17 29 H33", "M17 36 H29"],
  lupa: [C(21, 21, 13), "M31 31 L42 42"],
  banco: ["M6 18 L24 7 L42 18 Z", "M10 22 V36", "M19 22 V36", "M29 22 V36", "M38 22 V36", "M6 41 H42"],
  edificio: ["M10 42 V8 H30 V42", "M30 18 H40 V42", "M6 42 H42", "M16 15 H18", "M22 15 H24", "M16 23 H18", "M22 23 H24", "M16 31 H18", "M22 31 H24", "M35 26 V28", "M35 34 V36"],
  alerta: ["M24 6 L43 40 H5 Z", "M24 18 V29", "M24 34 V35"],
  check: ["M9 25 L19 35 L39 13"],
  cruz: ["M12 12 L36 36", "M36 12 L12 36"],
  candado: ["M11 22 H37 V42 H11 Z", "M16 22 V15 C16 5 32 5 32 15 V22", "M24 30 V35"],
  llave: [C(15, 24, 8), "M23 24 H42", "M36 24 V31", "M41 24 V29"],
  red: [C(24, 11, 4), C(10, 36, 4), C(38, 36, 4), "M22 15 L12 32", "M26 15 L36 32", "M14 36 H34"],
  reloj: [C(24, 24, 18), "M24 13 V24 L32 29"],
  calendario: ["M7 11 H41 V42 H7 Z", "M7 19 H41", "M15 6 V14", "M33 6 V14", "M14 27 H18", "M22 27 H26", "M30 27 H34", "M14 34 H18", "M22 34 H26"],
  salida: ["M22 7 H9 V41 H22", "M18 24 H42", "M34 16 L42 24 L34 32"],
  entrada: ["M26 7 H39 V41 H26", "M6 24 H30", "M22 16 L30 24 L22 32"],
  registro: ["M8 10 H40 V18 H8 Z", "M8 21 H40 V29 H8 Z", "M8 32 H40 V40 H8 Z", "M13 14 H20", "M13 25 H20", "M13 36 H20"],
  auditoria: ["M10 6 H32 V24", "M10 6 V42 H22", "M15 14 H27", "M15 21 H23", C(32, 32, 7), "M37 37 L42 42"],
  personas: [C(17, 14, 6), "M5 38 C5 28 29 28 29 38", C(33, 16, 5), "M31 27 C38 26 43 30 43 37"],
  persona: [C(24, 14, 7), "M10 42 C10 29 38 29 38 42"],
  datos: ["M10 11 C10 5 38 5 38 11 C38 17 10 17 10 11 Z", "M10 11 V37 C10 43 38 43 38 37 V11", "M10 24 C10 30 38 30 38 24"],
  servidor: ["M8 7 H40 V20 H8 Z", "M8 27 H40 V40 H8 Z", "M14 13 H16", "M14 33 H16", "M24 13 H34", "M24 33 H34"],
  nube: ["M14 36 H36 C44 36 44 24 36 24 C36 14 22 12 19 21 C11 19 7 36 14 36 Z"],
  engranaje: [C(24, 24, 7), "M24 5 V11", "M24 37 V43", "M5 24 H11", "M37 24 H43", "M10.5 10.5 L14.8 14.8", "M33.2 33.2 L37.5 37.5", "M37.5 10.5 L33.2 14.8", "M14.8 33.2 L10.5 37.5", C(24, 24, 14)],
  bombilla: ["M17 31 C11 26 12 8 24 8 C36 8 37 26 31 31 V36 H17 Z", "M18 41 H30", "M21 20 L24 25 L27 20"],
  grafica: ["M7 7 V41 H42", "M14 33 V26", "M22 33 V18", "M30 33 V23", "M38 33 V12"],
  tendencia: ["M7 7 V41 H42", "M11 34 L20 24 L27 29 L40 14", "M33 14 H40 V21"],
  dinero: [C(24, 24, 18), "M29 16 C27 14 19 14 19 19 C19 24 29 23 29 29 C29 34 21 34 18 32", "M24 11 V14", "M24 34 V37"],
  mensaje: ["M7 10 H41 V33 H20 L11 41 V33 H7 Z", "M14 19 H34", "M14 26 H28"],
  correo: ["M6 12 H42 V38 H6 Z", "M6 13 L24 27 L42 13"],
  objetivo: [C(24, 24, 18), C(24, 24, 11), C(24, 24, 4)],
  rayo: ["M27 5 L10 27 H23 L20 43 L38 20 H25 Z"],
  balanza: ["M24 7 V41", "M14 41 H34", "M9 13 H39", "M9 13 L4 26 H14 Z", "M39 13 L34 26 H44 Z"],
  mundo: [C(24, 24, 18), "M6 24 H42", "M24 6 C15 16 15 32 24 42", "M24 6 C33 16 33 32 24 42"],
  estrella: ["M24 5 L29.5 17.5 L43 18.5 L32.5 27.5 L36 41 L24 33.5 L12 41 L15.5 27.5 L5 18.5 L18.5 17.5 Z"],
  carpeta: ["M5 13 H19 L23 18 H43 V40 H5 Z"],
  codigo: ["M17 14 L7 24 L17 34", "M31 14 L41 24 L31 34", "M27 10 L21 38"],
  pregunta: [C(24, 24, 18), "M18 19 C18 11 30 11 30 19 C30 24 24 24 24 29", "M24 34 V35"],
  info: [C(24, 24, 18), "M24 22 V33", "M24 15 V16"],
  cadena: ["M20 28 L28 20", "M22 14 L26 10 C30 6 38 6 41 10 C45 14 44 20 40 23 L35 28", "M26 34 L22 38 C18 42 10 42 7 38 C3 34 4 28 8 25 L13 20"],
  piramide: ["M24 6 L42 40 H6 Z", "M13 27 H35", "M18.5 17 H29.5"],
  flecha: ["M6 24 H40", "M30 14 L40 24 L30 34"],
  punto: [C(24, 24, 6)],
};

export const nombresIconos = Object.keys(ICONOS);

export const Icono: React.FC<{
  nombre: string;
  size?: number;
  color: string;
  progreso?: number; // 0–1: fracción dibujada
  grosor?: number;
}> = ({ nombre, size = 56, color, progreso = 1, grosor = 3 }) => {
  const trazos = ICONOS[nombre] ?? ICONOS.punto;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible", flexShrink: 0 }}>
      {trazos.map((d, i) => {
        const a = i / trazos.length;
        const b = (i + 1) / trazos.length;
        const k = Math.max(0, Math.min(1, (progreso - a) / (b - a)));
        return (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - k}
          />
        );
      })}
    </svg>
  );
};

/**
 * Icono de línea dentro de un círculo (registro editorial): primero se dibuja el círculo y luego el icono.
 */
export const IconoCirculo: React.FC<{ nombre: string; size: number; color: string; progreso?: number; grosor?: number }> = ({ nombre, size, color, progreso = 1, grosor = 2.4 }) => {
  const kc = Math.max(0, Math.min(1, progreso * 1.7));
  const ki = Math.max(0, Math.min(1, (progreso - 0.35) / 0.65));
  const trazos = ICONOS[nombre] ?? ICONOS.punto;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ overflow: "visible", flexShrink: 0 }}>
      <circle cx={32} cy={32} r={29} stroke={color} strokeWidth={grosor} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - kc} transform="rotate(-90 32 32)" />
      <g transform="translate(15 15) scale(0.708)">
        {trazos.map((d, i) => {
          const a = i / trazos.length;
          const b = (i + 1) / trazos.length;
          const k = Math.max(0, Math.min(1, (ki - a) / (b - a)));
          return <path key={i} d={d} stroke={color} strokeWidth={grosor * 1.25} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />;
        })}
      </g>
    </svg>
  );
};
