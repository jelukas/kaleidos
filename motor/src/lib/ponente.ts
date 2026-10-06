/** Cámara EFECTIVA del ponente tal y como se pinta (con recorte: la cámara virtual; sin recorte: su marco). */
import type { Motor } from "../tema/Motor";
import type { Camara } from "./camara";
import { camaraEn } from "./camara";
import { videoEnVentana, ventanaEn } from "./disposicion";

export const camaraPonente = (m: Motor, f: number): Camara => {
  const cam = camaraEn(m.timeline, f, m.lienzo);
  if (m.recorte) return cam;
  const v = ventanaEn(m.bloques, f, m.lienzo, m.tema.ponente.marco, m.tema.forma.radio);
  const r = videoEnVentana(cam, v, m.timeline.fuente, m.lienzo);
  const S = r.width / m.timeline.fuente.ancho;
  return { ...cam, S, ox: r.left, oy: r.top };
};
