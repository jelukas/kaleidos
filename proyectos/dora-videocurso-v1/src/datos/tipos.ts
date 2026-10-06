import { z } from "zod";

// Props de entrada. `videoSrc` es la fuente del mezzanine:
//  - en local, un nombre de archivo servido con --public-dir (p. ej. "mezzanine.mp4");
//  - en Lambda, una URL prefirmada de S3 (https://...).
// Los subtítulos (palabras de la transcripción) también llegan como props, para que el texto
// de la transcripción no quede dentro del site público.
export const palabraSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable().optional(),
  confidence: z.number().nullable().optional(),
});

export const videocursoSchema = z.object({
  videoSrc: z.string(),
  subtitulos: z.array(palabraSchema).default([]),
  mostrarSubtitulos: z.boolean().default(true),
});

export type VideocursoProps = z.infer<typeof videocursoSchema>;
export type Palabra = z.infer<typeof palabraSchema>;

// ——— Montaje (tiempos en segundos del mezzanine = segundos del bruto) ———

export type Disposicion = "completa" | "esquina" | "dividida";

export type Segmento = { in: number; out: number };

export type Capitulo = {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  secciones: { titulo: string; t: number }[];
  segmentos: Segmento[];
};

// Gráficos sincronizados con el discurso. `t` y `hasta` son segundos de la fuente;
// las marcas internas (`en`) también. El montaje las traslada a fotogramas de salida.
export type Grafico =
  | { tipo: "clave"; t: number; hasta: number; texto: string; sub?: string; lado?: "izq" | "der" }
  | { tipo: "cita"; t: number; hasta: number; disp: Disposicion; kicker: string; texto: string; resalta: string[] }
  | {
      tipo: "lista";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      titulo: string;
      items: { en: number; texto: string; icono?: Icono }[];
    }
  | {
      tipo: "pasos";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      titulo: string;
      pasos: { en: number; texto: string; icono?: Icono }[];
    }
  | {
      tipo: "comparativa";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      izq: { titulo: string; items: string[]; tono: "ok" | "bad" | "neutro"; en: number };
      der: { titulo: string; items: string[]; tono: "ok" | "bad" | "neutro"; en: number };
    }
  | {
      tipo: "opciones";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      titulo: string;
      opciones: { letra: string; texto: string }[];
      foco?: { letra: string; en: number; veredicto: "trampa" | "correcta" | "riesgo" };
    }
  | {
      tipo: "contador";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      cifras: { en: number; valor: number; prefijo?: string; sufijo?: string; etiqueta: string }[];
    }
  | {
      tipo: "linea";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      titulo: string;
      hitos: { en: number; texto: string; marca?: "ok" | "bad" | "warn" }[];
    }
  | {
      tipo: "mapa";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      centro: string;
      ramas: { en: number; texto: string }[];
    }
  | {
      tipo: "escena3d";
      t: number;
      hasta: number;
      disp: Disposicion;
      kicker: string;
      titulo: string;
      escena: Escena3D;
      etiquetas?: { en: number; texto: string }[];
    };

export type Escena3D = "escudo" | "cadena" | "registro" | "salida" | "contrato" | "balanza";

export type Icono =
  | "escudo"
  | "contrato"
  | "lupa"
  | "banco"
  | "alerta"
  | "check"
  | "cruz"
  | "candado"
  | "red"
  | "reloj"
  | "salida"
  | "registro"
  | "auditoria"
  | "personas"
  | "datos"
  | "nube";

export type Enfasis = { t: number; dur: number; zoom?: number };
