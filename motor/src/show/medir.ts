/**
 * Medida de texto con un canvas 2D (las fuentes ya están cargadas por `@remotion/fonts` antes de pintar nada):
 * determinista y barata. Sirve para ajustar titulares al ancho y partir bocadillos en líneas sin medir el DOM.
 */
let ctx: CanvasRenderingContext2D | null = null;
const contexto = () => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return ctx!;
};

/** Ancho en px de `texto` con la pila de familias `familia` (p. ej. `"Fredoka", system-ui`). */
export const anchoTexto = (texto: string, familia: string, peso: number | string, tam: number, trackingEm = 0) => {
  const c = contexto();
  c.font = `${peso} ${tam}px ${familia}`;
  return c.measureText(texto).width + trackingEm * tam * Math.max(0, texto.length - 1);
};

/** Reparto voraz de palabras en líneas de como mucho `maxW` px. */
export const partirLineas = (texto: string, maxW: number, familia: string, peso: number | string, tam: number) => {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (!actual || anchoTexto(prueba, familia, peso, tam) <= maxW) actual = prueba;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
};

/** Divide un texto en dos líneas lo más parecidas posible (por palabras). */
export const enDosLineas = (texto: string, familia: string, peso: number | string, tam: number): string[] => {
  const p = texto.split(/\s+/).filter(Boolean);
  if (p.length < 2) return [texto];
  let mejor: string[] = [texto];
  let peor = Infinity;
  for (let i = 1; i < p.length; i++) {
    const a = p.slice(0, i).join(" ");
    const b = p.slice(i).join(" ");
    const m = Math.max(anchoTexto(a, familia, peso, tam), anchoTexto(b, familia, peso, tam));
    if (m < peor) {
      peor = m;
      mejor = [a, b];
    }
  }
  return mejor;
};
