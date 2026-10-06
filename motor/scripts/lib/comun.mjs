// Utilidades comunes de los scripts del motor (Node 22, ESM). Sin dependencias fuera de Remotion.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RAIZ = path.resolve(MOTOR, "..");
export const OUT = path.join(MOTOR, "out");
export const BUNDLE = path.join(OUT, "bundle");
export const PUBLICO = path.join(OUT, "publico");

// ——— Argumentos ———

/** `--clave valor`, `--clave=valor` y `--bandera`; el resto, posicionales. */
export const leerArgs = (argv = process.argv.slice(2)) => {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) op[k] = v;
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) op[k] = argv[++i];
      else op[k] = true;
    } else pos.push(a);
  }
  return { pos, op };
};

export const fallo = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

// ——— Proyectos ———

/**
 * Proyecto por slug: `../proyectos/<slug>/` si existe; si no, un fixture de `motor/fixtures/<slug>/`.
 * Los medios locales del motor están en `<proyecto>/media/` (timeline.json + enlaces a work/).
 */
export const resolverProyecto = (slug) => {
  if (!slug) fallo("falta el slug del proyecto");
  const candidatos = [path.join(RAIZ, "proyectos", slug), path.join(MOTOR, "fixtures", slug)];
  const dir = candidatos.find((d) => fs.existsSync(path.join(d, "media")));
  if (!dir) fallo(`no encuentro ${candidatos.map((d) => path.relative(MOTOR, path.join(d, "media"))).join(" ni ")}`);
  const pj = path.join(dir, "proyecto.json");
  const proyecto = fs.existsSync(pj) ? JSON.parse(fs.readFileSync(pj, "utf8")) : {};
  const media = path.join(dir, "media");
  return {
    slug,
    dir,
    media,
    archivos: archivosMedia(dir, media),
    proyecto,
    informe: path.join(dir, "informe.md"),
    esFixture: dir.startsWith(path.join(MOTOR, "fixtures")),
  };
};

/**
 * Medios locales del proyecto (ruta publicada → archivo). Lo normal es `media/` (timeline.json + enlaces a work/).
 * Respaldo de SOLO LECTURA mientras `tools` no haya poblado `media/`: `<proyecto>/timeline.json` y
 * `work/{mezzanine,plancha,mascara}.mp4`, ignorando los que se hayan modificado hace menos de 2 min (a medio escribir).
 */
const archivosMedia = (dir, media) => {
  const m = new Map();
  for (const rel of recorrer(media)) m.set(rel, path.join(media, rel));
  if (m.has("timeline.json") || !fs.existsSync(path.join(dir, "timeline.json"))) return m;
  const reciente = (f) => Date.now() - fs.statSync(f).mtimeMs < 120000;
  m.set("timeline.json", path.join(dir, "timeline.json"));
  const ignorados = [];
  for (const f of ["mezzanine.mp4", "plancha.mp4", "mascara.mp4"]) {
    const a = path.join(dir, "work", f);
    if (!fs.existsSync(a)) continue;
    if (reciente(a)) ignorados.push(f);
    else m.set(f, a);
  }
  console.log(`  (media/ vacío: se usan timeline.json y work/ de solo lectura${ignorados.length ? `; se ignoran por estar escribiéndose: ${ignorados.join(", ")}` : ""})`);
  return m;
};

/**
 * Props del motor para un proyecto (local: nombres de archivo en el --public-dir). §8 narración: sin mezzanine y con
 * la locución (`narracion.m4a`) como `audio`.
 */
export const propsLocales = (p, { timeline = "timeline.json", estilo, ponente } = {}) => {
  const hay = (f) => p.archivos.has(f);
  const audio = hay("narracion.m4a") ? "narracion.m4a" : hay("audio.m4a") ? "audio.m4a" : null;
  const extras = {};
  for (const rel of p.archivos.keys()) if (rel.startsWith("extras/")) extras[path.basename(rel).replace(/\.[^.]+$/, "")] = rel;
  return {
    timelineSrc: timeline,
    estilo: estilo ?? p.proyecto.estilo ?? "curso-azul",
    media: {
      ...(hay("mezzanine.mp4") ? { mezzanine: "mezzanine.mp4" } : {}),
      ...(hay("plancha.mp4") ? { plancha: "plancha.mp4" } : {}),
      ...(hay("mascara.mp4") ? { mascara: "mascara.mp4" } : {}),
      ...(audio ? { audio } : {}),
      extras,
    },
    ...(ponente ? { opciones: { ponente } } : {}),
  };
};

// ——— Carpeta pública local y empaquetado único ———

const enlazar = (origen, destino) => {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const real = fs.realpathSync(origen);
  try {
    fs.linkSync(real, destino); // enlace duro: el servidor estático de Remotion no sirve enlaces simbólicos
  } catch (e) {
    if (e.code === "EXDEV") fs.copyFileSync(real, destino);
    else throw e;
  }
};

const recorrer = (dir, base = dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    const st = fs.statSync(p); // sigue enlaces simbólicos (media/ son enlaces a work/)
    if (st.isDirectory()) recorrer(p, base, out);
    else out.push(path.relative(base, p));
  }
  return out;
};

/**
 * `out/publico/` = los medios del proyecto (--public-dir ../proyectos/<slug>/media) + `public/` del motor
 * (estilos y efectos), todo con ENLACES DUROS: no se copia ningún vídeo. El bundle apunta aquí con un
 * enlace simbólico (symlinkPublicDir), así que cambiar de proyecto no obliga a reempaquetar.
 */
export const prepararPublico = (p) => {
  fs.rmSync(PUBLICO, { recursive: true, force: true });
  fs.mkdirSync(PUBLICO, { recursive: true });
  const publicMotor = path.join(MOTOR, "public");
  if (!fs.existsSync(path.join(publicMotor, "estilos"))) fallo("falta public/estilos: ejecuta antes `npm run estilos`");
  for (const rel of recorrer(publicMotor)) enlazar(path.join(publicMotor, rel), path.join(PUBLICO, rel));
  for (const [rel, abs] of p.archivos) enlazar(abs, path.join(PUBLICO, rel));
  return PUBLICO;
};

const archivosFuente = () => {
  const out = [];
  const añadir = (d) => {
    for (const rel of recorrer(path.join(MOTOR, d))) out.push(path.join(d, rel));
  };
  añadir("src");
  out.push("package.json", "tsconfig.json");
  return out.sort();
};

export const hashArchivos = (rels, base = MOTOR) => {
  const h = crypto.createHash("sha256");
  for (const rel of rels) {
    h.update(rel);
    h.update(fs.readFileSync(path.join(base, rel)));
  }
  return h.digest("hex");
};

/** Hash del código del motor (src + package.json): decide si hay que reempaquetar. */
export const hashCodigo = () => hashArchivos(archivosFuente());

/** Hash del site de Lambda: código + public/ (estilos y efectos). */
export const hashSite = () => {
  const rels = [...archivosFuente(), ...recorrer(path.join(MOTOR, "public")).map((r) => path.join("public", r))].sort();
  return hashArchivos(rels);
};

/** Empaquetado único en out/bundle (se reutiliza mientras no cambie el código). */
export const asegurarBundle = async ({ publico = PUBLICO, forzar = false } = {}) => {
  const marca = path.join(BUNDLE, ".kaleidos.json");
  const hash = hashCodigo();
  const actual = fs.existsSync(marca) ? JSON.parse(fs.readFileSync(marca, "utf8")) : null;
  if (!forzar && actual?.hash === hash && actual?.publico === publico && fs.existsSync(path.join(BUNDLE, "index.html"))) {
    return { bundle: BUNDLE, reutilizado: true };
  }
  const { bundle } = await import("@remotion/bundler");
  fs.rmSync(BUNDLE, { recursive: true, force: true });
  const t0 = Date.now();
  await bundle({
    entryPoint: path.join(MOTOR, "src", "index.ts"),
    outDir: BUNDLE,
    publicDir: publico,
    symlinkPublicDir: true,
    enableCaching: true,
    onProgress: () => undefined,
  });
  fs.writeFileSync(marca, JSON.stringify({ hash, publico, fecha: new Date().toISOString() }));
  console.log(`  empaquetado en out/bundle (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  return { bundle: BUNDLE, reutilizado: false };
};

// ——— Temporales de Remotion (METODO §8) ———

/** Borra los temporales `remotion-v4-*-assets*` (descargas de medios por render) y devuelve cuántos. */
export const limpiarTemporales = () => {
  const dirs = new Set([os.tmpdir(), "/tmp", "/private/tmp", process.env.TMPDIR].filter(Boolean));
  let n = 0;
  for (const d of dirs) {
    let lista = [];
    try {
      lista = fs.readdirSync(d);
    } catch {
      continue;
    }
    for (const e of lista) {
      if (/^remotion-v4[.-].*assets/.test(e) || /^remotion-v4-[^/]*-assets/.test(e)) {
        try {
          fs.rmSync(path.join(d, e), { recursive: true, force: true });
          n++;
        } catch {
          // en uso o sin permisos: se deja
        }
      }
    }
  }
  return n;
};

// ——— Credenciales (.env) sin imprimir nunca valores ———

/**
 * Carga `../.env` (KEY=VALUE, comentarios con #, comillas opcionales) en process.env SIN sobrescribir lo que ya
 * haya. Devuelve solo los NOMBRES de las claves cargadas (nunca valores).
 */
export const cargarEnv = (archivo = path.join(RAIZ, ".env")) => {
  if (!fs.existsSync(archivo)) return [];
  const nombres = [];
  for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^".*"$/.test(v) || /^'.*'$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    nombres.push(m[1]);
  }
  // Remotion acepta REMOTION_AWS_*; el SDK de AWS, AWS_*. Se completan en ambos sentidos.
  for (const [a, b] of [
    ["REMOTION_AWS_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"],
    ["REMOTION_AWS_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"],
  ]) {
    if (process.env[a] && !process.env[b]) process.env[b] = process.env[a];
    if (process.env[b] && !process.env[a]) process.env[a] = process.env[b];
  }
  return nombres;
};

// ——— Varios ———

export const fmtBytes = (n) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} KB` : `${n} B`;

export const fmtSeg = (s) => (s >= 90 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${s.toFixed(1)} s`);

/** Rango de fotogramas `a-b` (inclusive). */
export const leerRango = (txt) => {
  const m = String(txt ?? "").match(/^(\d+)-(\d+)$/);
  if (!m) fallo(`rango de fotogramas inválido: «${txt}» (usa a-b)`);
  return [Number(m[1]), Number(m[2])];
};

/** Segundos (`12.5`), `mm:ss` o fotograma (`f250`) → fotograma. */
export const aFotograma = (x, fps) => {
  const s = String(x).trim();
  if (/^f\d+$/.test(s)) return Number(s.slice(1));
  if (/^\d+:\d+(\.\d+)?$/.test(s)) {
    const [m, ss] = s.split(":");
    return Math.round((Number(m) * 60 + Number(ss)) * fps);
  }
  return Math.round(Number(s) * fps);
};
