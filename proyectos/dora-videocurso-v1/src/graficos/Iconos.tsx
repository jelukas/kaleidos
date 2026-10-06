import React from "react";
import type { Icono } from "../datos/tipos";
import { COLOR } from "../tema";

// Iconos de línea propios (viewBox 48×48). Se "dibujan" con stroke-dashoffset según `progreso`.
const TRAZOS: Record<Icono, string[]> = {
  escudo: ["M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11 Z", "M17 24 L22 29 L32 18"],
  contrato: ["M12 5 H30 L38 13 V43 H12 Z", "M30 5 V13 H38", "M17 21 H33", "M17 28 H33", "M17 35 H26"],
  lupa: ["M21 7 A14 14 0 1 1 20.9 7 Z", "M31 31 L42 42"],
  banco: ["M6 18 L24 7 L42 18 Z", "M10 22 V36", "M19 22 V36", "M29 22 V36", "M38 22 V36", "M6 41 H42"],
  alerta: ["M24 6 L43 40 H5 Z", "M24 18 V29", "M24 34 V35"],
  check: ["M9 25 L19 35 L39 13"],
  cruz: ["M12 12 L36 36", "M36 12 L12 36"],
  candado: ["M11 22 H37 V42 H11 Z", "M16 22 V15 C16 5 32 5 32 15 V22", "M24 30 V35"],
  red: [
    "M24 8 A4 4 0 1 1 23.9 8 Z",
    "M9 34 A4 4 0 1 1 8.9 34 Z",
    "M39 34 A4 4 0 1 1 38.9 34 Z",
    "M22 15 L11 31",
    "M26 15 L37 31",
    "M13 38 H35",
  ],
  reloj: ["M24 6 A18 18 0 1 1 23.9 6 Z", "M24 13 V24 L32 29"],
  salida: ["M22 7 H9 V41 H22", "M18 24 H42", "M34 16 L42 24 L34 32"],
  registro: ["M8 10 H40 V18 H8 Z", "M8 21 H40 V29 H8 Z", "M8 32 H40 V40 H8 Z", "M13 14 H20", "M13 25 H20", "M13 36 H20"],
  auditoria: ["M10 6 H32 V26", "M10 6 V42 H22", "M15 14 H27", "M15 21 H23", "M31 30 A7 7 0 1 1 30.9 30 Z", "M36 42 L41 47"],
  personas: [
    "M17 10 A6 6 0 1 1 16.9 10 Z",
    "M5 38 C5 28 29 28 29 38",
    "M33 13 A5 5 0 1 1 32.9 13 Z",
    "M31 27 C38 26 43 30 43 37",
  ],
  datos: [
    "M10 11 C10 5 38 5 38 11 C38 17 10 17 10 11 Z",
    "M10 11 V37 C10 43 38 43 38 37 V11",
    "M10 24 C10 30 38 30 38 24",
  ],
  nube: ["M14 36 H36 C44 36 44 24 36 24 C36 14 22 12 19 21 C11 19 7 36 14 36 Z"],
};

export const IconoAnimado: React.FC<{
  icono: Icono;
  size?: number;
  color?: string;
  progreso?: number; // 0–1
  grosor?: number;
}> = ({ icono, size = 64, color = COLOR.accent, progreso = 1, grosor = 3 }) => {
  const trazos = TRAZOS[icono];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible", flexShrink: 0 }}>
      {trazos.map((d, i) => {
        // Cada trazo se dibuja en su tramo del progreso total.
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
