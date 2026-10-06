/**
 * Disposición en pantalla: zonas de los paneles y, sin recorte, la ventana (marco) del ponente.
 *
 * - Con recorte, el ponente siempre está a pantalla completa y lo mueve la cámara (los planos laterales del
 *   generador ya lo apartan del panel). Los paneles van en la mitad libre.
 * - Sin recorte (METODO: disposiciones de DORA): `completa`, `dividida` (el ponente ocupa una mitad) o
 *   `esquina` (ventana pequeña; para paneles anchos). Bloques consecutivos iguales se funden para no volver
 *   a pantalla completa entre dos gráficos seguidos.
 */
import type { Evento, Timeline } from "../datos/contrato";
import { ease, lerp } from "../tema/anim";
import type { Camara, Lienzo } from "./camara";

export type Rect = { x: number; y: number; w: number; h: number };
export type Disp = "completa" | "dividida" | "esquina";
export type LadoPonente = "izq" | "der";
export type Bloque = { disp: Disp; ponente: LadoPonente; desde: number; hasta: number };

/** Kinds que piden más ancho: sin recorte usan la disposición `esquina`. */
export const KINDS_ANCHOS = new Set(["comparativa", "mapa", "linea", "opciones", "pasos"]);

export const TRANSICION_DISP = 14;

const contrario = (l: string | undefined): LadoPonente => (l === "izq" ? "der" : "izq");

const bloqueDeEvento = (e: Evento, recorte: boolean): Omit<Bloque, "desde" | "hasta"> | null => {
  if (e.tipo === "panel") {
    if (e.lado === "centro") return { disp: "esquina", ponente: "der" };
    const ancho = KINDS_ANCHOS.has(e.kind) && !(e.kind === "pasos" && e.items.length <= 3);
    return { disp: ancho && !recorte ? "esquina" : "dividida", ponente: contrario(e.lado) };
  }
  if (e.tipo === "escena3d") return { disp: "dividida", ponente: contrario(e.lado) };
  return null;
};

export const bloquesPonente = (tl: Timeline, recorte: boolean): Bloque[] => {
  const crudos: Bloque[] = [];
  if (tl.intro) crudos.push({ disp: "dividida", ponente: "der", desde: tl.intro.desde, hasta: tl.intro.hasta });
  for (const c of tl.capitulos) crudos.push({ disp: "dividida", ponente: "der", desde: c.desde, hasta: c.rotuloHasta });
  for (const e of tl.eventos) {
    const b = bloqueDeEvento(e, recorte);
    if (b) crudos.push({ ...b, desde: e.desde, hasta: e.hasta });
  }
  crudos.sort((a, b) => a.desde - b.desde);
  const out: Bloque[] = [];
  const hueco = Math.round(tl.fps * 1.2);
  for (const b of crudos) {
    const u = out.at(-1);
    if (u && u.disp === b.disp && u.ponente === b.ponente && b.desde - u.hasta < hueco) u.hasta = Math.max(u.hasta, b.hasta);
    else out.push({ ...b });
  }
  return out;
};

// ——— Zonas (lienzo horizontal 1920×1080 como referencia; se escalan con el lienzo) ———

const H_ZONAS = {
  der: { x: 1000, y: 96, w: 840, h: 800 },
  izq: { x: 80, y: 96, w: 840, h: 800 },
  centro: { x: 250, y: 110, w: 1420, h: 780 },
  anchaDer: { x: 540, y: 96, w: 1300, h: 800 },
  anchaIzq: { x: 80, y: 96, w: 1300, h: 800 },
} as const;

const escalar = (r: Rect, lienzo: Lienzo): Rect => {
  const k = lienzo.ancho / 1920;
  return { x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k };
};

/** Zona que ocupa un panel (o la cabecera + 3D de una escena3d). */
export const zonaEvento = (e: Evento, lienzo: Lienzo, recorte: boolean): Rect => {
  if (lienzo.vertical) return { x: 60, y: 1010, w: lienzo.ancho - 120, h: 700 };
  const lado = "lado" in e && e.lado ? e.lado : "der";
  if (e.tipo === "panel" && lado !== "centro") {
    const b = bloqueDeEvento(e, recorte);
    if (b?.disp === "esquina") return escalar(lado === "izq" ? H_ZONAS.anchaIzq : H_ZONAS.anchaDer, lienzo);
  }
  return escalar(lado === "izq" ? H_ZONAS.izq : lado === "centro" ? H_ZONAS.centro : H_ZONAS.der, lienzo);
};

// ——— Ventana del ponente (sin recorte) ———

export type Ventana = { rect: Rect; radio: number; borde: number; disp: Disp; ponente: LadoPonente; k: number };

const ventanaDe = (disp: Disp, ponente: LadoPonente, lienzo: Lienzo, marco: string, radio: number): { rect: Rect; radio: number } => {
  const W = lienzo.ancho;
  const H = lienzo.alto;
  if (lienzo.vertical) {
    if (disp === "completa") return { rect: { x: 0, y: 0, w: W, h: H }, radio: 0 };
    return { rect: { x: 0, y: 0, w: W, h: 980 }, radio: 0 };
  }
  // marco: redondeado | recto | arco | circulo | ninguno (recto y ninguno: a sangre, sin radio).
  const recto = marco === "recto" || marco === "ninguno";
  const circulo = marco === "circulo";
  const arco = marco === "arco";
  if (disp === "completa") return { rect: { x: 0, y: 0, w: W, h: H }, radio: 0 };
  if (disp === "dividida") {
    // El marco deja libre la franja inferior del HUD (chip del capítulo y barra de progreso).
    const r = recto ? { x: 0, y: 0, w: 920, h: H - 88 } : { x: 48, y: 48, w: 872, h: H - 48 - 100 };
    if (ponente === "der") r.x = W - r.x - r.w;
    return { rect: r, radio: recto ? 0 : arco ? r.w / 2 : radio };
  }
  const lado = circulo ? 440 : 420;
  const r = { x: 72, y: circulo ? 520 : 470, w: lado, h: circulo ? 440 : 520 };
  if (ponente === "der") r.x = W - r.x - r.w;
  return { rect: r, radio: circulo ? 220 : arco ? r.w / 2 : Math.max(radio, 20) };
};

const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  w: lerp(a.w, b.w, k),
  h: lerp(a.h, b.h, k),
});

export const ventanaEn = (bloques: Bloque[], f: number, lienzo: Lienzo, marco: string, radio: number): Ventana => {
  const T = TRANSICION_DISP;
  const b = bloques.find((x) => f >= x.desde - T && f < x.hasta + T);
  const completa = ventanaDe("completa", "izq", lienzo, marco, radio);
  if (!b) return { ...completa, borde: 0, disp: "completa", ponente: "izq", k: 0 };
  const kin = Math.max(0, Math.min(1, (f - (b.desde - T)) / T));
  const kout = Math.max(0, Math.min(1, (b.hasta + T - f) / T));
  const k = ease.power3InOut(Math.min(kin, kout));
  const v = ventanaDe(b.disp, b.ponente, lienzo, marco, radio);
  return { rect: lerpRect(completa.rect, v.rect, k), radio: lerp(0, v.radio, k), borde: k, disp: b.disp, ponente: b.ponente, k };
};

/** Escala relativa al «cubrir la ventana» y altura de la nariz en cada disposición. */
const AJUSTE: Record<Disp, { rel: number; focoY: number }> = {
  completa: { rel: 1, focoY: 0.33 },
  dividida: { rel: 1.1, focoY: 0.3 },
  esquina: { rel: 1.8, focoY: 0.34 },
};

/**
 * Rectángulo del vídeo (fuente completa) en pantalla, sin dejar ver sus bordes dentro de la ventana.
 * En `completa` manda la cámara; en las ventanas, la nariz se centra en la ventana.
 */
export const videoEnVentana = (cam: Camara, v: Ventana, fuente: { ancho: number; alto: number }, lienzo: Lienzo) => {
  const fw = fuente.ancho;
  const fh = fuente.alto;
  const cubrir = (r: Rect, S: number, cx: number, cy: number) => {
    const s = Math.max(S, r.w / fw, r.h / fh);
    let ox = cx - cam.nariz[0] * s;
    let oy = cy - cam.nariz[1] * s;
    ox = Math.min(r.x, Math.max(r.x + r.w - fw * s, ox));
    oy = Math.min(r.y, Math.max(r.y + r.h - fh * s, oy));
    return { left: ox, top: oy, width: fw * s, height: fh * s };
  };
  const full: Rect = { x: 0, y: 0, w: lienzo.ancho, h: lienzo.alto };
  const aCompleta = cubrir(full, cam.S, cam.ox + cam.nariz[0] * cam.S, cam.oy + cam.nariz[1] * cam.S);
  if (v.k <= 0) return aCompleta;
  const ventanaFinal = ventanaDe(v.disp, v.ponente, lienzo, "", 0).rect;
  const aj = AJUSTE[v.disp];
  const Sv = Math.max(ventanaFinal.w / fw, ventanaFinal.h / fh) * aj.rel;
  // Se calcula respecto a la ventana ACTUAL (interpolada) para que el vídeo la cubra durante la transición.
  const enVentana = cubrir(v.rect, lerp(cam.S, Sv, v.k), v.rect.x + v.rect.w / 2, v.rect.y + v.rect.h * aj.focoY);
  const k = v.k;
  return {
    left: lerp(aCompleta.left, enVentana.left, k),
    top: lerp(aCompleta.top, enVentana.top, k),
    width: lerp(aCompleta.width, enVentana.width, k),
    height: lerp(aCompleta.height, enVentana.height, k),
  };
};
