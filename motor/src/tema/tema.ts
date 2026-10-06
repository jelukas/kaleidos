/**
 * Tema: todo lo que los componentes necesitan del estilo, derivado de `tokens.json`.
 * Ningún componente usa colores, fuentes o curvas propias: todo sale de aquí.
 */
import type React from "react";
import type { Tokens } from "../datos/contrato";
import { easePorNombre, ease } from "./anim";
import { aHsl, alpha, asegurarContraste, contraste, deHsl, legibleSobre, luminancia, mezcla, parse } from "./color";

export type EstiloPanel = Tokens["paneles"]["estilo"];
/** Piel de la caja de diapositiva (§7): la base es el tema del estilo tal cual. */
export type RegistroTema = "base" | "show" | "editorial" | "lamina";

/** Pesos cargados de una familia (de `tipografia.archivos`). */
const pesosDe = (tokens: Tokens, familia: string) =>
  tokens.tipografia.archivos
    .filter((a) => a.familia === familia && a.estilo !== "italic")
    .map((a) => Number(a.peso))
    .sort((a, b) => a - b);

/** El peso cargado más cercano a `deseado` (o `deseado` si la familia no tiene archivos). */
const pesoCercano = (tokens: Tokens, familia: string, deseado: number) => {
  const p = pesosDe(tokens, familia);
  if (!p.length) return deseado;
  return p.reduce((m, x) => (Math.abs(x - deseado) < Math.abs(m - deseado) ? x : m), p[0]);
};

const tieneFamilia = (tokens: Tokens, familia: string | undefined) => !!familia && tokens.tipografia.archivos.some((a) => a.familia === familia);

/** Tono (0–360) de un color. */
const tono = (c: string) => {
  const [r, g, b] = parse(c).rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

/** Valores §7.1 resueltos con sus valores por defecto (todo opcional en tokens.json). */
export const resolverShow = (tokens: Tokens) => {
  const c = tokens.color;
  const e = tokens.escenario ?? {};
  const lienzo = e.lienzo ?? c.fondo;
  const camara = e.camara?.fondo ?? mezcla(c.fondo, c.texto, 0.16);
  const r = tokens.fondo.rayos ?? {};
  const c2 = r.colores?.[1] ?? c.superficie2;
  const c1 = r.colores?.[0] ?? mezcla(c2, "#FFFFFF", 0.12);
  const ed = tokens.registros?.editorial ?? {};
  const m = tokens.marca ?? {};
  // Paquete de marca por defecto: el tono del fondo de cámara con las luminosidades de la guía de milikito
  // (#1B575C, #143939, #BAD1D5, #132A2E, #2FA6B0 salen de un menta #9CE5DF).
  const [hc, sc] = aHsl(camara);
  const hm = (hc + 8) % 360;
  const marcaFondo = m.fondo ?? deHsl(hm, Math.min(0.55, sc), 0.23);
  const acento = c.acento;
  const h = tono(acento);
  const calido = h >= 20 && h <= 70;
  const degradado = (tokens.tipografia.titular.degradado as [string, string, string] | undefined) ?? [
    mezcla(acento, calido ? "#FFF45A" : "#FFFFFF", calido ? 0.55 : 0.45),
    acento,
    calido ? mezcla(acento, "#E3500A", 0.75) : mezcla(acento, "#000000", 0.32),
  ];
  return {
    escenario: {
      activo: e.activo ?? false,
      lienzo,
      patron: e.patron ?? true,
      patronColor: mezcla(lienzo, "#FFFFFF", 0.022),
      radio: e.caja?.radio ?? tokens.forma.radio,
      sombra: e.caja?.sombra ?? tokens.forma.sombra,
      camara,
      camara2: e.camara?.fondo2 ?? mezcla(camara, "#000000", 0.08),
    },
    hud: tokens.hud?.estilo ?? "barra",
    rayos: { c1, c2, vineta: r.vineta ?? mezcla(c2, "#000000", 0.45), giro: r.giro ?? 2, destellos: r.destellos ?? 8 },
    editorial: {
      fondo: ed.fondo ?? c.superficie,
      oro: ed.oro ?? acento,
      anillos: ed.anillos ?? true,
      mayusculas: ed.mayusculas ?? true,
      familiaTitular: tieneFamilia(tokens, ed.familiaTitular) ? ed.familiaTitular! : tokens.tipografia.etiqueta.familia,
      familiaCuerpo: tieneFamilia(tokens, ed.familiaCuerpo) ? ed.familiaCuerpo! : tokens.tipografia.cuerpo.familia,
    },
    showTitular: tokens.registros?.show?.titular ?? tokens.tipografia.titular.tratamiento ?? "plano",
    showFamilia: tieneFamilia(tokens, tokens.registros?.show?.familiaTitular) ? tokens.registros!.show!.familiaTitular! : tokens.tipografia.cuerpo.familia,
    laminaZoom: tokens.registros?.lamina?.zoom ?? ([1, 1.06] as [number, number]),
    juego: {
      activo: tokens.tipografia.titular.tratamiento === "juego",
      familia: tokens.tipografia.titular.familia,
      peso: pesoCercano(tokens, tokens.tipografia.titular.familia, 700),
      degradado,
    },
    marca: {
      fondo: marcaFondo,
      oscuro: m.oscuro ?? deHsl(hm, Math.min(0.48, sc), 0.15),
      bitono: m.bitono ?? deHsl(hm, Math.min(0.2, sc), 0.78),
      rotulo: m.rotulo ?? deHsl(hm, Math.min(0.42, sc), 0.13),
      cargo: m.cargo ?? deHsl(hm - 1, Math.min(0.58, sc), 0.44),
      familia: tieneFamilia(tokens, m.familia) ? m.familia! : tieneFamilia(tokens, "Inter") ? "Inter" : tokens.tipografia.cuerpo.familia,
      // Texto sobre el fondo de marca: el del estilo si contrasta (estilos oscuros); si no, blanco (estilos claros).
      texto: m.texto ?? (contraste(c.texto, marcaFondo) >= 4.5 ? c.texto : "#FFFFFF"),
      // Color de las palabras pares de la tarjeta de marca (milikito: el oscuro de la marca).
      palabra: m.palabra ?? m.oscuro ?? deHsl(hm, Math.min(0.48, sc), 0.15),
    },
  };
};

export type Show = ReturnType<typeof resolverShow>;

/**
 * Tokens de un registro de la caja de diapositiva (§7): show (rayos, titulares redondos con sombra dura),
 * editorial (azul marino, condensada en mayúsculas, oro) y lámina (cómic: papel, tinta y fichas con contorno).
 */
export const tokensDeRegistro = (tokens: Tokens, registro: RegistroTema): Tokens => {
  if (registro === "base") return tokens;
  const c = tokens.color;
  const sh = resolverShow(tokens);
  const tipo = tokens.tipografia;
  if (registro === "show") {
    const f = sh.showFamilia;
    return {
      ...tokens,
      modo: "oscuro",
      color: {
        ...c,
        superficie: mezcla(sh.rayos.c2, "#000000", 0.5),
        superficie2: mezcla(sh.rayos.c2, "#000000", 0.3),
        linea: mezcla(sh.rayos.c1, "#FFFFFF", 0.35),
        textoSuave: mezcla(c.texto, sh.rayos.c1, 0.18),
      },
      tipografia: { ...tipo, titular: { familia: f, peso: pesoCercano(tokens, f, 900), interlineado: 1.05, tracking: "0" } },
      paneles: { estilo: "solido" },
    };
  }
  if (registro === "editorial") {
    const ed = sh.editorial;
    const oscuro = luminancia(ed.fondo) < 0.2;
    return {
      ...tokens,
      modo: oscuro ? "oscuro" : "claro",
      color: {
        ...c,
        superficie: ed.fondo,
        superficie2: mezcla(ed.fondo, "#FFFFFF", 0.07),
        linea: mezcla(ed.fondo, "#FFFFFF", 0.2),
        acento: ed.oro,
        capitulos: [ed.oro],
        textoSuave: mezcla(c.texto, ed.fondo, 0.28),
      },
      tipografia: {
        ...tipo,
        titular: { familia: ed.familiaTitular, peso: pesoCercano(tokens, ed.familiaTitular, 800), mayusculas: ed.mayusculas, tracking: ed.mayusculas ? "0.01em" : "-0.02em", interlineado: ed.mayusculas ? 1.0 : 1.05 },
        cuerpo: { familia: ed.familiaCuerpo, peso: pesoCercano(tokens, ed.familiaCuerpo, 400), interlineado: 1.35 },
      },
      paneles: { estilo: "solido" },
    };
  }
  // lámina: cómic claro (papel, tinta negra y fichas con contorno)
  const f = sh.showFamilia;
  return {
    ...tokens,
    modo: "claro",
    color: {
      ...c,
      fondo: "#F4E6C6",
      superficie: "#FFFFFF",
      superficie2: "#FFF4D8",
      linea: "#1E1E1E",
      texto: "#1E1E1E",
      textoSuave: "#474747",
      tinta: "#111111",
      sobreAcento: c.sobreAcento,
    },
    tipografia: { ...tipo, titular: { familia: f, peso: pesoCercano(tokens, f, 900), interlineado: 1.05 } },
    paneles: { estilo: "tinta" },
    forma: { ...tokens.forma, radio: Math.max(12, tokens.forma.radio) },
  };
};

const pila = (familia: string, generica: string) => `"${familia}", ${generica}`;

const textoCss = (t: Tokens["tipografia"]["titular"], generica: string): React.CSSProperties => ({
  fontFamily: pila(t.familia, generica),
  fontWeight: t.peso,
  letterSpacing: t.tracking,
  lineHeight: t.interlineado,
  textTransform: t.mayusculas ? "uppercase" : undefined,
});

export const crearTema = (tokensBase: Tokens, fps: number, registro: RegistroTema = "base") => {
  const tokens = tokensDeRegistro(tokensBase, registro);
  const show = resolverShow(tokensBase);
  const c = tokens.color;
  const oscuro = tokens.modo === "oscuro";
  const tinta = c.tinta ?? (oscuro ? mezcla(c.fondo, "#000000", 0.55) : c.texto);
  const capitulos = c.capitulos.length ? c.capitulos : [c.acento];
  // Acento para texto: en estilos claros puede hacer falta oscurecerlo para que se lea sobre la superficie.
  const acentoTexto = (a: string) => asegurarContraste(a, c.superficie, 3.2);
  const sobre = (fondo: string) => (c.sobreAcento && fondo === c.acento ? c.sobreAcento : legibleSobre(fondo, "#FFFFFF", mezcla(c.texto, "#000000", oscuro ? 0.9 : 0.2)));

  const radio = tokens.forma.radio;
  const borde = tokens.forma.borde;
  const estilo = tokens.paneles.estilo;

  /** Contenedor principal de un panel (la «tarjeta» que agrupa cabecera y contenido). */
  const panel = (acento: string): React.CSSProperties => {
    switch (estilo) {
      case "cristal":
        return {
          borderRadius: radio,
          // Degradado translúcido en vez de backdrop-filter (METODO §8: el desenfoque hunde el render).
          background: `linear-gradient(160deg, ${alpha(c.superficie2, 0.78)} 0%, ${alpha(c.superficie, 0.66)} 100%)`,
          boxShadow: `inset 0 0 0 1px ${alpha(c.texto, 0.14)}, inset 0 1px 0 ${alpha(c.texto, 0.22)}, ${tokens.forma.sombra}`,
        };
      case "papel":
        return {
          borderRadius: Math.round(radio * 0.4),
          background: `linear-gradient(175deg, ${mezcla(c.superficie, "#FFFFFF", 0.35)} 0%, ${c.superficie} 100%)`,
          boxShadow: `0 1px 0 ${alpha(c.linea, 0.9)}, 0 3px 0 ${alpha(c.linea, 0.35)}, 0 22px 50px ${alpha(tinta, 0.14)}`,
        };
      case "tinta":
        return {
          borderRadius: Math.round(radio * 0.5),
          background: c.superficie,
          border: `${Math.max(3, borde + 1)}px solid ${tinta}`,
          boxShadow: `10px 10px 0 ${tinta}`,
        };
      default:
        return {
          borderRadius: radio,
          background: c.superficie,
          border: `${borde}px solid ${alpha(acento, 0.35)}`,
          boxShadow: tokens.forma.sombra,
        };
    }
  };

  /** Fichas dentro de un panel (viñetas, opciones, columnas…). `on` = resaltada. */
  const ficha = (acento: string, on: boolean): React.CSSProperties => {
    switch (estilo) {
      case "papel":
        return {
          borderRadius: Math.round(radio * 0.3),
          background: on ? alpha(acento, 0.14) : alpha(c.superficie2, 0.55),
          boxShadow: on ? `inset 5px 0 0 ${acento}` : `inset 0 -1px 0 ${alpha(c.linea, 0.9)}`,
        };
      case "tinta":
        return {
          borderRadius: Math.round(radio * 0.35),
          background: on ? mezcla(c.superficie, acento, 0.22) : c.superficie,
          border: `3px solid ${tinta}`,
          boxShadow: on ? `5px 5px 0 ${tinta}` : "none",
        };
      default:
        return {
          borderRadius: Math.round(radio * 0.7),
          background: on ? alpha(acento, 0.18) : alpha(c.superficie2, estilo === "cristal" ? 0.55 : 0.9),
          boxShadow: on ? `inset 0 0 0 2px ${acento}` : `inset 0 0 0 1px ${alpha(acento, 0.22)}`,
        };
    }
  };

  // Peso «fuerte» del cuerpo: el menor cargado ≥ 600 (o el mayor disponible), para no depender de negritas sintéticas.
  const pesosCuerpo = tokens.tipografia.archivos
    .filter((a) => a.familia === tokens.tipografia.cuerpo.familia)
    .map((a) => Number(a.peso))
    .sort((a, b) => a - b);
  const pesoFuerte = pesosCuerpo.find((p) => p >= 600) ?? pesosCuerpo.at(-1) ?? 700;

  const energia = { baja: 0.8, media: 1, alta: 1.25 }[tokens.movimiento.energia];
  const durEntrada = Math.max(6, Math.round((tokens.movimiento.duracionEntrada * fps) / energia));

  return {
    tokens,
    nombre: tokens.nombre,
    oscuro,
    c: { ...c, capitulos, tinta },
    alpha,
    mezcla,
    /** Acento del capítulo (índice = capitulo.acento, cíclico). */
    acentoCap: (i: number | undefined) => capitulos[((i ?? 0) % capitulos.length + capitulos.length) % capitulos.length],
    acentoTexto,
    /** Color de texto legible sobre un relleno (p. ej. sobre el acento). */
    sobre,
    tono: (t: string | undefined, acento: string) =>
      t === "ok" ? c.ok : t === "bad" ? c.error : t === "aviso" ? c.aviso : acento,
    f: {
      titular: pila(tokens.tipografia.titular.familia, "system-ui, sans-serif"),
      cuerpo: pila(tokens.tipografia.cuerpo.familia, "system-ui, sans-serif"),
      etiqueta: pila(tokens.tipografia.etiqueta.familia, "system-ui, sans-serif"),
      mono: pila(tokens.tipografia.mono?.familia ?? "ui-monospace", "ui-monospace, monospace"),
    },
    t: {
      titular: textoCss(tokens.tipografia.titular, "system-ui, sans-serif"),
      cuerpo: textoCss(tokens.tipografia.cuerpo, "system-ui, sans-serif"),
      etiqueta: textoCss(tokens.tipografia.etiqueta, "system-ui, sans-serif"),
      mono: textoCss(tokens.tipografia.mono ?? { familia: "ui-monospace", peso: 400 }, "ui-monospace, monospace"),
    },
    pesoFuerte,
    forma: tokens.forma,
    estiloPanel: estilo,
    panel,
    ficha,
    fondo: tokens.fondo,
    subtitulos: tokens.subtitulos,
    ponente: tokens.ponente,
    mov: {
      ease: easePorNombre(tokens.movimiento.entrada),
      salida: ease.power2InOut,
      rebote: tokens.movimiento.energia === "baja" ? ease.power3Out : tokens.movimiento.energia === "alta" ? ease.backOut : ease.backOutSuave,
      durEntrada,
      durSalida: Math.max(6, Math.round(durEntrada * 0.6)),
      /** Separación entre elementos de una misma entrada escalonada (fotogramas). */
      escalon: Math.max(2, Math.round(4 / energia)),
      energia,
      transicion: tokens.movimiento.transicion,
    },
    tres: {
      toon: tokens.tres.material === "toon",
      tinta: tokens.tres.contornoTinta,
      rampa: tokens.tres.rampa,
      colorTinta: tinta,
    },
    audio: tokens.audio,
    // ——— §7 ———
    registro,
    show,
    /** Tratamiento «juego» del titular (degradado, doble contorno, sombra y brillo). */
    juego: show.juego.activo,
    /** Sombra de los titulares (registro show: sombra dura de tinta, en em para que escale con el cuerpo). */
    sombraTitular: registro === "show" ? `0 0.07em 0 ${tinta}` : undefined,
    /** Palabras resaltadas: en editorial se «encienden» (blanco → oro con subrayado barrido). */
    resaltado: registro === "editorial" ? ("encender" as const) : undefined,
    /** Iconos de línea dentro de un círculo que se dibuja (registro editorial). */
    iconoCirculo: registro === "editorial",
  };
};

export type Tema = ReturnType<typeof crearTema>;
