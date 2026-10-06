/** Utilidades de color sin dependencias (hex #rgb/#rrggbb, rgb() y rgba()). */

type RGB = [number, number, number];

export const parse = (c: string): { rgb: RGB; a: number } => {
  const s = c.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    const n = parseInt(h.slice(0, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], a };
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { rgb: [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0], a: p[3] ?? 1 };
  }
  return { rgb: [128, 128, 128], a: 1 };
};

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");

export const toHex = (rgb: RGB) => `#${hex2(rgb[0])}${hex2(rgb[1])}${hex2(rgb[2])}`;

/** Mismo color con otra opacidad. */
export const alpha = (c: string, a: number) => {
  const { rgb } = parse(c);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};

/** Mezcla lineal en sRGB (suficiente para matices de UI). */
export const mezcla = (a: string, b: string, k: number) => {
  const x = parse(a).rgb;
  const y = parse(b).rgb;
  return toHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
};

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminancia = (c: string) => {
  const [r, g, b] = parse(c).rgb;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export const contraste = (a: string, b: string) => {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** Entre dos candidatos, el que más contraste da sobre `fondo`. */
export const legibleSobre = (fondo: string, claro = "#FFFFFF", oscuro = "#0B0F19") =>
  contraste(fondo, claro) >= contraste(fondo, oscuro) ? claro : oscuro;

/**
 * Ajusta `c` hacia `hacia` hasta tener al menos `min` de contraste sobre `fondo` (texto de acento legible
 * en estilos claros, donde un acento saturado puede quedarse corto sobre blanco).
 */
export const asegurarContraste = (c: string, fondo: string, min = 3, hacia?: string) => {
  const destino = hacia ?? legibleSobre(fondo);
  let k = 0;
  let out = c;
  while (contraste(out, fondo) < min && k < 1) {
    k += 0.08;
    out = mezcla(c, destino, Math.min(1, k));
  }
  return out;
};

/** RGB → HSL (h en grados, s y l en 0–1). */
export const aHsl = (c: string): [number, number, number] => {
  const [r, g, b] = parse(c).rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

/** HSL → hex. */
export const deHsl = (h: number, s: number, l: number) => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
};
