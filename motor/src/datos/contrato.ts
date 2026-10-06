/**
 * Contrato de datos del motor (docs/CONTRATO.md §3, §4 y §5), validado con zod.
 *
 * - `timeline.json`: tiempos en FOTOGRAMAS DE SALIDA (salvo `segmentos[].src`, en segundos de la fuente) y
 *   coordenadas en PÍXELES DE LA FUENTE.
 * - `tokens.json`: el estilo en datos.
 * - Props: pequeñas; el texto viaja en `timeline.json` (objeto privado en Lambda), nunca en el site.
 *
 * Los objetos se validan sin `passthrough`: las claves que el motor no conoce se descartan, así un generador
 * más nuevo no rompe un motor más viejo. Lo que sí falla es un `tipo` o `kind` desconocido (el render no debe
 * perder contenido en silencio).
 */
import { z } from "zod";

const num = z.number();
const fotograma = z.number().min(0);
const punto = z.tuple([z.number(), z.number()]);
const tono = z.enum(["ok", "bad", "neutro", "aviso"]);
const lado = z.enum(["izq", "der", "centro"]);

// ——— §7 (escenario y registros «show»): todo opcional y compatible hacia atrás ———
export const registroSchema = z.enum(["show", "editorial", "lamina"]);
export const disposicionSchema = z.enum(["dos-cajas", "grande", "solo", "completa", "dividida", "voz"]);
/** §8 (modo narración, sin ponente): solo estas dos disposiciones. `voz` = diapositiva grande + caja de voz. */
export const DISPOSICIONES_NARRACION: readonly TipoDisposicion[] = ["completa", "voz"];
/** Campos que admite cualquier evento que va en la caja de diapositiva (§7.3). */
const deCaja = { registro: registroSchema.optional(), disposicion: disposicionSchema.optional() };

// ——— timeline.json ———

export const segmentoSchema = z.object({
  dst: fotograma, // fotograma de salida donde empieza
  src: z.number().min(0), // segundo de la fuente
  dur: z.number().int().positive(), // fotogramas
});

export const planoSchema = z.object({
  desde: fotograma,
  hasta: fotograma,
  tipo: z.string(), // wide | medium | close | sideL | sideR | popL | card (METODO §7.3)
  forzado: z.boolean().default(false),
  s: z.number().positive(), // escala sobre la fuente
  tx: num, // posición en pantalla de la nariz
  ty: num,
  nariz: punto, // px de la fuente
  zoom: z.tuple([z.number(), z.number()]).default([1, 1]),
});

export const capituloSchema = z.object({
  desde: fotograma,
  hasta: fotograma,
  rotuloHasta: fotograma,
  n: z.number().int(),
  titulo: z.string(),
  kicker: z.string().optional(),
  subtitulo: z.string().optional(),
  acento: z.number().int().min(0).default(0),
  objeto3d: z.string().nullable().optional(),
  sigla: z.string().optional(), // §7.3: letra o número corto de la ficha del HUD
  registro: registroSchema.optional(),
});

const itemSchema = z.object({
  en: fotograma.optional(),
  texto: z.string(),
  detalle: z.string().optional(),
  icono: z.string().optional(),
  tono: tono.optional(),
});

const basePanel = {
  id: z.string().optional(),
  tipo: z.literal("panel"),
  desde: fotograma,
  hasta: fotograma,
  lado: lado.default("der"),
  kicker: z.string().optional(),
  titulo: z.string().optional(),
  ...deCaja,
};

const columnaSchema = z.object({
  en: fotograma.optional(),
  titulo: z.string(),
  items: z.array(z.string()).default([]),
  tono: z.enum(["ok", "bad", "neutro"]).default("neutro"),
});

export const panelSchema = z.discriminatedUnion("kind", [
  z.object({ ...basePanel, kind: z.literal("lista"), items: z.array(itemSchema).min(1) }),
  z.object({ ...basePanel, kind: z.literal("pasos"), items: z.array(itemSchema).min(1) }),
  z.object({ ...basePanel, kind: z.literal("checklist"), items: z.array(itemSchema).min(1) }),
  z.object({ ...basePanel, kind: z.literal("comparativa"), izq: columnaSchema, der: columnaSchema }),
  z.object({
    ...basePanel,
    kind: z.literal("opciones"),
    opciones: z.array(z.object({ letra: z.string(), texto: z.string() })).min(2),
    foco: z
      .object({ en: fotograma, letra: z.string(), veredicto: z.enum(["correcta", "riesgo", "trampa"]) })
      .optional(),
  }),
  z.object({
    ...basePanel,
    kind: z.literal("cifra"),
    valor: z.number(),
    unidad: z.string().optional(),
    etiqueta: z.string(),
    // En el guion es `desde` (valor inicial del contador); en timeline.json `desde` ya es el fotograma del evento,
    // así que el generador lo escribe como `valorInicial` (se aceptan también `contadorDesde`).
    valorInicial: z.number().optional(),
    contadorDesde: z.number().optional(),
    decimales: z.number().int().min(0).max(3).optional(),
  }),
  z.object({ ...basePanel, kind: z.literal("cita"), texto: z.string(), resalta: z.array(z.string()).default([]) }),
  z.object({ ...basePanel, kind: z.literal("clave"), texto: z.string(), resalta: z.array(z.string()).default([]) }),
  z.object({
    ...basePanel,
    kind: z.literal("linea"),
    hitos: z.array(z.object({ en: fotograma.optional(), etiqueta: z.string(), texto: z.string() })).min(2),
  }),
  z.object({
    ...basePanel,
    kind: z.literal("mapa"),
    centro: z.string(),
    nodos: z.array(z.object({ en: fotograma.optional(), texto: z.string() })).min(2),
  }),
  z.object({ ...basePanel, kind: z.literal("tarjeta"), texto: z.string(), icono: z.string().optional() }),
  z.object({
    ...basePanel,
    kind: z.literal("caso"),
    texto: z.string(),
    veredicto: z.object({ en: fotograma.optional(), texto: z.string(), tono: tono.default("neutro") }),
  }),
]);

export const popSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("pop"),
  desde: fotograma,
  hasta: fotograma,
  texto: z.string(),
  sub: z.string().optional(),
  grande: z.boolean().default(false),
  lado: lado.optional(),
  ...deCaja,
});

export const escena3dSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("escena3d"),
  objeto: z.string(),
  desde: fotograma,
  hasta: fotograma,
  lado: lado.default("izq"),
  kicker: z.string().optional(),
  titulo: z.string().optional(),
  etiquetas: z.array(z.object({ en: fotograma.optional(), texto: z.string() })).default([]),
  texto: z.string().optional(), // objeto «letras»: el texto extruido
  ...deCaja,
});

export const gesto3dSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("gesto3d"),
  objeto: z.string(),
  desde: fotograma,
  hasta: fotograma,
  texto: z.string().optional(), // rótulo junto al objeto; con «letras», el texto extruido
  disposicion: disposicionSchema.optional(),
  // Extensión (lo escribe `tools linea`): el gesto de las manos en línea; si falta, se busca en `timeline.gestos`.
  gesto: z
    .object({
      desde: fotograma,
      pico: fotograma,
      hasta: fotograma,
      munecas: z.tuple([punto, punto]),
      pista: z.array(z.object({ f: fotograma, munecas: z.tuple([punto, punto]) })).optional(),
    })
    .optional(),
});

/** Extensión del motor (no está en el contrato §3): ilustración 2,5D a pantalla completa (METODO §7.4). */
export const ilustracionSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("ilustracion"),
  desde: fotograma,
  hasta: fotograma,
  imagen: z.string(), // clave de props.media.extras
  profundidad: z.string(), // clave de props.media.extras (mapa en gris: blanco = cerca)
  camara: z
    .object({
      desde: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
      hasta: z.tuple([z.number(), z.number(), z.number()]).default([0.5, 0.1, -0.6]),
    })
    .default({ desde: [0, 0, 0], hasta: [0.5, 0.1, -0.6] }),
  anclas: z
    .array(
      z.object({
        u: z.number(),
        v: z.number(),
        lift: z.number().default(0.05),
        texto: z.string().optional(),
        objeto: z.string().optional(),
        en: fotograma.optional(),
      }),
    )
    .default([]),
});

// ——— Eventos «show» (§7.3) ———

/** Titular de juego: palabra-concepto enorme con degradado, doble contorno, destello y estallido. */
export const tituloSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("titulo"),
  desde: fotograma,
  hasta: fotograma,
  antetitulo: z.string().optional(),
  texto: z.string(),
  subtitulo: z.string().optional(),
  destellos: z.boolean().default(true),
  ...deCaja,
});

export const formaBocadillo = z.enum(["globo", "nube", "grito"]);

export const bocadilloEnLaminaSchema = z.object({
  en: fotograma.optional(),
  texto: z.string(),
  x: z.number().min(0).max(1), // centro del bocadillo, en fracción de la caja
  y: z.number().min(0).max(1),
  forma: formaBocadillo.default("globo"),
  cola: z.enum(["izq", "der", "abajo"]).default("abajo"),
  ancho: z.number().min(0.1).max(0.9).optional(), // fracción del ancho de la caja
});

/** Ilustración o captura a toda la caja, con acercamiento lento y bocadillos. */
export const laminaSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("lamina"),
  desde: fotograma,
  hasta: fotograma,
  imagen: z.string(), // clave de props.media.extras
  zoom: z.tuple([z.number(), z.number()]).optional(),
  pie: z.string().optional(),
  bocadillos: z.array(bocadilloEnLaminaSchema).default([]),
  ...deCaja,
});

/** Bocadillo suelto junto al ponente. */
export const bocadilloSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("bocadillo"),
  desde: fotograma,
  hasta: fotograma,
  texto: z.string(),
  forma: formaBocadillo.default("globo"),
  lado: z.enum(["izq", "der"]).default("der"),
});

/** Reacción (icono en una pastilla junto al ponente). Única excepción a la regla de no solapar eventos. */
export const reaccionSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("reaccion"),
  desde: fotograma,
  hasta: fotograma,
  icono: z.string(), // pregunta | idea | rayo | ok | alerta | corazon | reloj (uno desconocido pinta «idea»)
});

/** Sello de revelación (EUREKA…): golpe con giro −12°, sacudida y polvo. */
export const selloSchema = z.object({
  id: z.string().optional(),
  tipo: z.literal("sello"),
  desde: fotograma,
  hasta: fotograma,
  texto: z.string(),
  tono: tono.default("ok"),
  ...deCaja,
});

export const eventoSchema = z.union([
  panelSchema,
  popSchema,
  escena3dSchema,
  gesto3dSchema,
  ilustracionSchema,
  tituloSchema,
  laminaSchema,
  bocadilloSchema,
  reaccionSchema,
  selloSchema,
]);

export const subtituloSchema = z.object({
  desde: fotograma,
  hasta: fotograma,
  palabras: z.array(z.object({ t: z.string(), desde: fotograma, hasta: fotograma })).min(1),
});

export const gestoSchema = z.object({
  desde: fotograma,
  pico: fotograma,
  hasta: fotograma,
  munecas: z.tuple([punto, punto]), // px de la fuente en el pico
  // Opcional (no está en el contrato): trayectoria de las muñecas antes del pico, por fotograma de salida.
  pista: z.array(z.object({ f: fotograma, munecas: z.tuple([punto, punto]) })).optional(),
});

/** §7.3: apertura/cierre con el paquete de marca (`estilo: "marca"`). Nombres genéricos salvo que el usuario los dé. */
const deMarca = {
  estilo: z.enum(["marca"]).optional(),
  palabras: z.array(z.string()).optional(), // p. ej. ["MASTER", "CLASS"]
  etiquetas: z.array(z.string()).optional(), // p. ej. ["En directo", "Nº 1"]
  lema: z.string().optional(),
  rotulo: z.object({ nombre: z.string(), cargo: z.string().optional() }).optional(),
  franja: z.object({ titulo: z.string().optional(), subtitulo: z.string().optional(), firma: z.string().optional() }).optional(),
};

export const introSchema = z.object({
  desde: fotograma,
  hasta: fotograma,
  kicker: z.string().optional(),
  titulo: z.string(),
  subtitulo: z.string().optional(),
  objeto3d: z.string().nullable().optional(),
  ...deMarca,
});

export const outroSchema = z.object({
  desde: fotograma,
  hasta: fotograma,
  kicker: z.string().optional(),
  titulo: z.string().optional(),
  puntos: z.array(z.string()).default([]),
  cta: z.string().optional(),
  objeto3d: z.string().nullable().optional(),
  ...deMarca,
});

/** §7.3: pista de disposiciones del escenario (si falta, el motor la deriva de los eventos). */
export const disposicionTramoSchema = z.object({ desde: fotograma, hasta: fotograma, tipo: disposicionSchema });

/** §7.3: música y efectos (claves de props.media.extras). La voz sigue saliendo del mezzanine o de media.audio. */
export const audioSchema = z.object({
  musica: z
    .array(
      z.object({
        archivo: z.string(),
        desde: fotograma,
        hasta: fotograma,
        volumen: z.number().min(0).max(2).default(1),
        fundidoEntrada: z.number().min(0).default(0), // fotogramas
        fundidoSalida: z.number().min(0).default(0),
        bucle: z.boolean().default(false),
        inicio: z.number().min(0).optional(), // segundo del archivo donde empieza (trimBefore)
      }),
    )
    .default([]),
  sfx: z
    .array(
      z.object({
        archivo: z.string(),
        en: fotograma,
        volumen: z.number().min(0).max(2).default(1),
        dur: z.number().int().positive().optional(), // fotogramas (por defecto 2 s)
      }),
    )
    .default([]),
});

export const planchaSchema = z.object({
  x: num,
  y: num,
  ancho: z.number().positive(),
  alto: z.number().positive(),
  escala: z.number().positive(),
  // Extensión: geometría del vídeo de máscara. "fuente" (por defecto, lo que escribe `tools recortar`): gris
  // 1080p de la fuente entera. "plancha": mismo recorte y escala que la plancha.
  mascara: z.enum(["plancha", "fuente"]).default("fuente"),
  // Extensión: curva aplicada a la máscara antes de invertirla. "metodo" (por defecto): la misma con la que tools
  // multiplica la plancha, clip((α·0,93 − 128)·1,35 + 128) (METODO §7.2), para que A y B casen en el borde.
  // "lineal": la máscara tal cual.
  curva: z.enum(["metodo", "lineal"]).default("metodo"),
});

const fuenteSchema = z.object({ ancho: z.number().positive(), alto: z.number().positive(), fps: z.number().positive(), duracion: z.number() });

export const timelineSchema = z
  .object({
    version: z.literal(1),
    fps: z.number().positive(),
    ancho: z.number().int().positive(),
    alto: z.number().int().positive(),
    duracion: z.number().int().positive(),
    // §8: en narración no hay bruto; si falta, el motor usa el lienzo de salida (nada lo pinta).
    fuente: fuenteSchema.optional(),
    recorte: z.boolean(),
    plancha: planchaSchema.nullable().optional(),
    // En narración, EDL sobre la locución (`src` en segundos del audio); vacía = la locución entera desde el fotograma 0.
    segmentos: z.array(segmentoSchema).default([]),
    // Obligatorios con ponente (≥ 1); en narración no hacen falta (el motor pone un plano neutro).
    planos: z.array(planoSchema).default([]),
    capitulos: z.array(capituloSchema).default([]),
    eventos: z.array(eventoSchema).default([]),
    subtitulos: z.array(subtituloSchema).default([]),
    gestos: z.array(gestoSchema).default([]),
    intro: introSchema.nullable().optional(),
    outro: outroSchema.nullable().optional(),
    avisos: z.array(z.string()).default([]),
    // §7: modo escenario (true lo activa; false lo desactiva aunque el estilo lo pida), disposiciones y audio.
    escenario: z.boolean().optional(),
    disposiciones: z.array(disposicionTramoSchema).optional(),
    audio: audioSchema.optional(),
    // §8: modo narración (vídeo sin ponente, voz de TTS en props.media.audio). Implica modo escenario.
    narracion: z.boolean().optional(),
  })
  .superRefine((t, ctx) => {
    const error = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (!t.narracion) {
      if (!t.fuente) error(["fuente"], "falta `fuente` (obligatoria con ponente; solo `narracion: true` la hace opcional)");
      if (!t.planos.length) error(["planos"], "`planos` necesita al menos un plano (solo `narracion: true` lo hace opcional)");
      if (t.recorte && !t.plancha) error(["plancha"], "recorte: true exige `plancha` (geometría de la plancha)");
      t.eventos.forEach((e, i) => {
        if ("disposicion" in e && e.disposicion === "voz") error(["eventos", i, "disposicion"], "la disposición `voz` solo vale con `narracion: true`");
      });
      t.disposiciones?.forEach((d, i) => {
        if (d.tipo === "voz") error(["disposiciones", i, "tipo"], "la disposición `voz` solo vale con `narracion: true`");
      });
      return;
    }
    const validas = DISPOSICIONES_NARRACION.join(" | ");
    if (t.recorte) error(["recorte"], "narración: `recorte` tiene que ser false (no hay ponente que recortar)");
    if (t.plancha) error(["plancha"], "narración: no lleva `plancha` (no hay ponente)");
    if (t.escenario === false) error(["escenario"], "narración: se pinta siempre en modo escenario (quita `escenario: false`)");
    t.eventos.forEach((e, i) => {
      if (e.tipo === "gesto3d")
        error(["eventos", i, "tipo"], `narración: \`gesto3d\` no vale (no hay manos que seguir)${e.id ? ` en «${e.id}»` : ""}; usa \`escena3d\` con el mismo objeto`);
      else if ("disposicion" in e && e.disposicion && !DISPOSICIONES_NARRACION.includes(e.disposicion))
        error(["eventos", i, "disposicion"], `narración: disposición «${e.disposicion}» no válida${e.id ? ` en «${e.id}»` : ""} (solo ${validas})`);
    });
    t.disposiciones?.forEach((d, i) => {
      if (!DISPOSICIONES_NARRACION.includes(d.tipo)) error(["disposiciones", i, "tipo"], `narración: disposición «${d.tipo}» no válida (solo ${validas})`);
    });
  })
  .transform((t) => {
    const narracion = t.narracion === true;
    const fuente = t.fuente ?? { ancho: t.ancho, alto: t.alto, fps: t.fps, duracion: t.duracion / t.fps };
    // Plano neutro para la narración: nada pinta vídeo, pero así ninguna consulta de cámara (subtítulos, rótulo de
    // depuración, paneles del modo normal) se queda sin plano.
    const planos = t.planos.length
      ? t.planos
      : [{ desde: 0, hasta: t.duracion, tipo: "medium", forzado: false, s: 1, tx: t.ancho / 2, ty: t.alto / 2, nariz: [fuente.ancho / 2, fuente.alto / 2] as Punto, zoom: [1, 1] as [number, number] }];
    return { ...t, narracion, fuente, planos, gestos: narracion ? [] : t.gestos };
  });

export type Timeline = z.infer<typeof timelineSchema>;
export type Segmento = z.infer<typeof segmentoSchema>;
export type Plano = z.infer<typeof planoSchema>;
export type Capitulo = z.infer<typeof capituloSchema>;
export type Evento = z.infer<typeof eventoSchema>;
export type EventoPanel = z.infer<typeof panelSchema>;
export type EventoPop = z.infer<typeof popSchema>;
export type EventoEscena3D = z.infer<typeof escena3dSchema>;
export type EventoGesto3D = z.infer<typeof gesto3dSchema>;
export type EventoIlustracion = z.infer<typeof ilustracionSchema>;
export type EventoTitulo = z.infer<typeof tituloSchema>;
export type EventoLamina = z.infer<typeof laminaSchema>;
export type EventoBocadillo = z.infer<typeof bocadilloSchema>;
export type EventoReaccion = z.infer<typeof reaccionSchema>;
export type EventoSello = z.infer<typeof selloSchema>;
export type BocadilloLamina = z.infer<typeof bocadilloEnLaminaSchema>;
export type FormaBocadillo = z.infer<typeof formaBocadillo>;
export type Registro = z.infer<typeof registroSchema>;
export type TipoDisposicion = z.infer<typeof disposicionSchema>;
export type PistaAudio = z.infer<typeof audioSchema>;
export type KindPanel = EventoPanel["kind"];
export type PanelDe<K extends KindPanel> = Extract<EventoPanel, { kind: K }>;
export type Subtitulo = z.infer<typeof subtituloSchema>;
export type Gesto = z.infer<typeof gestoSchema>;
export type Intro = z.infer<typeof introSchema>;
export type Outro = z.infer<typeof outroSchema>;
export type Plancha = z.infer<typeof planchaSchema>;
export type Tono = z.infer<typeof tono>;
export type Lado = z.infer<typeof lado>;
export type Punto = z.infer<typeof punto>;

// ——— tokens.json ———

const tipoTexto = z.object({
  familia: z.string(),
  peso: z.number().default(400),
  tracking: z.string().optional(),
  interlineado: z.number().optional(),
  mayusculas: z.boolean().optional(),
});

const titularSchema = tipoTexto.extend({
  // §7.1: "plano" (defecto) | "juego": degradado + doble contorno + sombra + brillo (titular de videojuego).
  tratamiento: z.enum(["plano", "juego"]).optional(),
  // Extensión: degradado del tratamiento «juego» [claro, medio, oscuro]; por defecto sale del acento.
  degradado: z.array(z.string()).length(3).optional(),
});

const color = z.string();

export const tokensSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().optional(),
  modo: z.enum(["oscuro", "claro"]),
  color: z.object({
    fondo: z.string(),
    superficie: z.string(),
    superficie2: z.string(),
    linea: z.string(),
    texto: z.string(),
    textoSuave: z.string(),
    acento: z.string(),
    ok: z.string(),
    aviso: z.string(),
    error: z.string(),
    capitulos: z.array(z.string()).default([]),
    // Opcional: color del texto sobre el acento (si no, se elige blanco o negro por contraste).
    sobreAcento: z.string().optional(),
    tinta: z.string().optional(), // contorno de tinta (toon/tinta); por defecto, texto en claro y fondo en oscuro
  }),
  tipografia: z.object({
    titular: titularSchema,
    cuerpo: tipoTexto,
    etiqueta: tipoTexto,
    mono: tipoTexto.optional(),
    archivos: z
      .array(
        z.object({
          familia: z.string(),
          peso: z.union([z.number(), z.string()]),
          estilo: z.enum(["normal", "italic"]).default("normal"),
          archivo: z.string(), // relativo a la carpeta del estilo
        }),
      )
      .default([]),
  }),
  forma: z
    .object({
      radio: z.number().default(20),
      radioPildora: z.number().default(999),
      borde: z.number().default(2),
      sombra: z.string().default("0 30px 80px rgba(0,0,0,0.35)"),
    })
    .default({ radio: 20, radioPildora: 999, borde: 2, sombra: "0 30px 80px rgba(0,0,0,0.35)" }),
  fondo: z
    .object({
      tipo: z.enum(["liso", "radial", "rejilla", "papel", "cristal", "rayos"]).default("liso"),
      detalle: z.string().optional(),
      grano: z.number().min(0).max(1).optional(), // extensión: intensidad del grano (0 = sin grano)
      // §7.1: rayos cónicos desde el centro (fondo «rayos» y registro «show»).
      rayos: z
        .object({
          colores: z.array(color).min(2).optional(),
          vineta: color.optional(),
          giro: z.number().optional(), // grados por segundo
          destellos: z.number().int().min(0).max(16).optional(),
        })
        .optional(),
    })
    .default({ tipo: "liso" }),
  paneles: z.object({ estilo: z.enum(["solido", "cristal", "papel", "tinta"]).default("solido") }).default({ estilo: "solido" }),
  ponente: z
    // marco: redondeado | recto | arco | circulo | ninguno
    .object({ marco: z.string().default("redondeado"), borde: z.boolean().default(true) })
    .default({ marco: "redondeado", borde: true }),
  subtitulos: z
    // palabraActiva: acento | capitulo (color del capítulo) | subrayado (bloque de superficie2) | ninguna
    .object({ estilo: z.enum(["caja", "contorno", "limpio"]).default("caja"), palabraActiva: z.string().default("acento") })
    .default({ estilo: "caja", palabraActiva: "acento" }),
  movimiento: z
    .object({
      energia: z.enum(["baja", "media", "alta"]).default("media"),
      entrada: z.string().default("power3Out"),
      duracionEntrada: z.number().positive().default(0.6),
      transicion: z.enum(["empuje", "fundido", "bloques", "barrido", "zoom"]).default("empuje"),
    })
    .default({ energia: "media", entrada: "power3Out", duracionEntrada: 0.6, transicion: "empuje" }),
  tres: z
    .object({
      material: z.enum(["estandar", "toon"]).default("estandar"),
      contornoTinta: z.boolean().default(false),
      rampa: z.number().int().min(2).max(8).default(3),
    })
    .default({ material: "estandar", contornoTinta: false, rampa: 3 }),
  audio: z
    .object({ musica: z.string().default("ninguna"), sfx: z.string().default("suaves") })
    .default({ musica: "ninguna", sfx: "suaves" }),
  licencias: z.string().optional(),
  // ——— §7.1 (todo opcional; los valores por defecto están en tema/tema.ts) ———
  escenario: z
    .object({
      activo: z.boolean().optional(),
      lienzo: color.optional(),
      patron: z.boolean().optional(),
      caja: z.object({ radio: z.number().optional(), sombra: z.string().optional() }).optional(),
      camara: z.object({ fondo: color.optional(), fondo2: color.optional() }).optional(),
    })
    .optional(),
  hud: z.object({ estilo: z.enum(["barra", "fichas"]).optional() }).optional(),
  registros: z
    .object({
      show: z.object({ fondo: z.string().optional(), titular: z.enum(["plano", "juego"]).optional(), familiaTitular: z.string().optional() }).optional(),
      editorial: z
        .object({
          fondo: color.optional(),
          familiaTitular: z.string().optional(),
          familiaCuerpo: z.string().optional(),
          oro: color.optional(),
          anillos: z.boolean().optional(),
          // Titulares del registro editorial en mayúsculas (defecto true, como en milikito).
          mayusculas: z.boolean().optional(),
        })
        .optional(),
      lamina: z.object({ zoom: z.tuple([z.number(), z.number()]).optional() }).optional(),
    })
    .optional(),
  // Extensión: colores y familia del paquete de marca (intro/outro `estilo: "marca"`).
  marca: z
    .object({
      fondo: color.optional(),
      oscuro: color.optional(),
      bitono: color.optional(),
      rotulo: color.optional(),
      cargo: color.optional(),
      texto: color.optional(),
      palabra: color.optional(),
      familia: z.string().optional(),
    })
    .optional(),
});

export type Tokens = z.infer<typeof tokensSchema>;

// ——— Props del motor (§4) ———

export const propsSchema = z.object({
  timelineSrc: z.string(), // local: archivo en --public-dir; Lambda: URL prefirmada
  estilo: z.string(), // carpeta de public/estilos/
  media: z.object({
    // Obligatorio con ponente; en narración (timeline.narracion) no hay vídeo y basta con `audio` (la locución).
    mezzanine: z.string().optional(),
    plancha: z.string().optional(),
    mascara: z.string().optional(),
    // Extensión: solo el audio del mezzanine (p. ej. .m4a sin recodificar). Con recorte, el vídeo del mezzanine no
    // se pinta y basta con esto: en Lambda evita subir el mezzanine entero solo por la voz. En narración (§8), la
    // locución (narracion.m4a): es obligatoria.
    audio: z.string().optional(),
    extras: z.record(z.string(), z.string()).optional(),
  }),
  opciones: z
    .object({
      subtitulos: z.boolean().optional(),
      hud: z.boolean().optional(),
      grano: z.boolean().optional(),
      sonido: z.boolean().optional(),
      // Solo pruebas: fuerza el modo de ponente aunque timeline.recorte diga otra cosa.
      ponente: z.enum(["auto", "recorte", "marco"]).optional(),
      // Solo pruebas: rótulo con fotograma, plano y evento (para las hojas de contactos; ffmpeg no tiene drawtext).
      marca: z.boolean().optional(),
      // Solo perfilado del render: desactiva capas para medir su coste (sin-sombras, fondo-liso, sin-paneles…).
      perfil: z.array(z.string()).optional(),
    })
    .optional(),
});

export type PropsMotor = z.infer<typeof propsSchema>;

/** Error legible de zod (ruta + mensaje) para `calculateMetadata` y los scripts. */
export const errorLegible = (que: string, err: z.ZodError) =>
  new Error(`${que} no cumple el contrato:\n${z.prettifyError(err)}`);
