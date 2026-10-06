#!/usr/bin/env node
// Comprobación del entorno de kaleidos. SOLO LECTURA: no llama a AWS ni a APIs de pago, no escribe nada y de .env
// solo lee los NOMBRES de las variables (los valores no se guardan ni se imprimen: solo «definida» o «vacía»).
//
//   node scripts/doctor.mjs                   todo
//   node scripts/doctor.mjs --flujo narracion solo cuenta como ✗ lo que bloquea ese flujo:
//                                             ponente | narracion | hyperframes | lambda
//   node scripts/doctor.mjs --json            resultado en JSON (para otros agentes)
//
// Sale con 1 si hay algún ✗ que afecte al flujo pedido (o a cualquiera, sin --flujo).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOTOR = path.join(RAIZ, "motor");
const TOOLS = path.join(RAIZ, "tools");
const REMOTION = "4.0.529";
const FLUJOS = ["ponente", "narracion", "hyperframes", "lambda"];

const args = process.argv.slice(2);
const FLUJO = args.includes("--flujo") ? args[args.indexOf("--flujo") + 1] : null;
const JSON_OUT = args.includes("--json");
if (FLUJO && !FLUJOS.includes(FLUJO)) {
  console.error(`--flujo «${FLUJO}» desconocido: ${FLUJOS.join(" | ")}`);
  process.exit(2);
}

// ——— utilidades ———
const rel = (p) => path.relative(RAIZ, p) || ".";
const existe = (p) => fs.existsSync(p);
const leerJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};
const cmd = (bin, argv = [], opciones = {}) => {
  const r = spawnSync(bin, argv, { encoding: "utf8", timeout: 20000, ...opciones });
  return { ok: !r.error && r.status === 0, status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}`, error: r.error };
};
const version = (txt, re) => (txt.match(re) ?? [])[1] ?? null;
const gb = (bytes) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

const secciones = [];
let actual = null;
const seccion = (titulo) => {
  actual = { titulo, items: [] };
  secciones.push(actual);
};
// estado: ok | aviso | fallo · afecta: flujos a los que bloquea un fallo ([] = todos)
const item = (estado, nombre, detalle = "", solucion = "", afecta = []) => actual.items.push({ estado, nombre, detalle, solucion, afecta });
const ok = (n, d) => item("ok", n, d);
const aviso = (n, d, s = "", afecta = []) => item("aviso", n, d, s, afecta);
const fallo = (n, d, s, afecta = []) => item("fallo", n, d, s, afecta);
const bloquea = (it) => it.estado === "fallo" && (!FLUJO || it.afecta.length === 0 || it.afecta.includes(FLUJO));

const REMOTION_FLUJOS = ["ponente", "narracion", "lambda"];

// ════════════════ Sistema ════════════════
seccion("Sistema");
{
  const mayor = Number(process.versions.node.split(".")[0]);
  mayor >= 22 ? ok("Node", `v${process.versions.node}`) : fallo("Node", `v${process.versions.node} (hace falta ≥ 22)`, "instala Node 22 (brew install node@22)");

  const ff = cmd("ffmpeg", ["-hide_banner", "-version"]);
  if (!ff.ok) fallo("ffmpeg", "no está en el PATH", "brew install ffmpeg");
  else {
    const v = version(ff.out, /ffmpeg version (\S+)/);
    const m = Number(String(v).split(".")[0]);
    m >= 8 ? ok("ffmpeg", v) : m >= 7 ? aviso("ffmpeg", `${v} (el repo está probado con 8)`, "brew upgrade ffmpeg") : fallo("ffmpeg", `${v} (hace falta ≥ 7)`, "brew upgrade ffmpeg");
    const enc = cmd("ffmpeg", ["-hide_banner", "-encoders"]).out;
    const fil = cmd("ffmpeg", ["-hide_banner", "-filters"]).out;
    const vt = /h264_videotoolbox/.test(enc);
    const faltan = ["loudnorm", "ebur128", "scale_vt", "lut3d"].filter((f) => !new RegExp(`\\s${f}\\s`).test(fil));
    vt && !faltan.length
      ? ok("ffmpeg: VideoToolbox y filtros", "h264_videotoolbox · loudnorm · ebur128 · scale_vt · lut3d")
      : fallo("ffmpeg: VideoToolbox y filtros", `faltan: ${[...(vt ? [] : ["h264_videotoolbox"]), ...faltan].join(", ")}`, "usa el ffmpeg de Homebrew (brew reinstall ffmpeg)", ["ponente", "narracion"]);
  }
  cmd("ffprobe", ["-version"]).ok ? ok("ffprobe", "en el PATH") : fallo("ffprobe", "no está en el PATH", "brew install ffmpeg");

  const uv = cmd("uv", ["--version"]);
  const uvAlt = !uv.ok && existe("/opt/homebrew/bin/uv");
  uv.ok || uvAlt ? ok("uv", version(uv.out, /uv (\S+)/) ?? "/opt/homebrew/bin/uv") : fallo("uv", "no está instalado", "brew install uv", ["ponente", "narracion"]);

  const awsCli = cmd("aws", ["--version"]);
  awsCli.ok ? ok("AWS CLI", version(awsCli.out, /aws-cli\/(\S+)/) + " (no se llama a AWS)") : aviso("AWS CLI", "no está (lambda.mjs usa el SDK de @remotion/lambda; la CLI solo es respaldo)", "brew install awscli", ["lambda"]);
  const sam = cmd("sam", ["--version"]);
  sam.ok ? ok("SAM CLI", version(sam.out, /version (\S+)/)) : aviso("SAM CLI", "no está (solo para desplegar la Lambda de HyperFrames)", "brew install aws-sam-cli", ["hyperframes"]);
  const bun = cmd("bun", ["--version"]);
  bun.ok ? ok("bun", bun.out.trim()) : aviso("bun", "no está (solo para construir HyperFrames desde vendor/)", "brew install oven-sh/bun/bun", ["hyperframes"]);

  const ram = os.totalmem();
  ok("Memoria", `${gb(ram)} · ${os.cpus().length} núcleos${ram <= 17 * 1024 ** 3 ? " — no lances recortar + transcribir + pose a la vez" : ""}`);
  try {
    const st = fs.statfsSync(RAIZ);
    const libre = st.bavail * st.bsize;
    libre > 40 * 1024 ** 3 ? ok("Disco libre", gb(libre)) : libre > 15 * 1024 ** 3 ? aviso("Disco libre", `${gb(libre)} (Remotion copia public/ y descarga medios en cada render local)`, "borra temporales remotion-v4-*-assets* y out/ del motor") : fallo("Disco libre", `${gb(libre)}`, "libera espacio (un bruto 4K de 34 min ocupa ~2 GB y su preproceso ~5 GB)");
  } catch {
    aviso("Disco libre", "no se pudo medir");
  }
  const chromeDir = path.join(os.homedir(), ".cache/puppeteer/chrome");
  const ver = existe(chromeDir) ? fs.readdirSync(chromeDir).filter((d) => !d.startsWith(".")).sort().pop() : null;
  const chromeBin = ver && path.join(chromeDir, ver, "chrome-mac-arm64", "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
  chromeBin && existe(chromeBin) ? ok("Chrome for Testing (capturas)", ver) : aviso("Chrome for Testing (capturas)", "no está en ~/.cache/puppeteer/chrome (scripts/capture.mjs lo necesita)", "npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer");
}

// ════════════════ tools/ (pipeline de Python) ════════════════
seccion("tools/ · preproceso (Python 3.12, uv)");
{
  const py = path.join(TOOLS, ".venv/bin/python");
  const afectaTools = ["ponente", "narracion"];
  if (!existe(py)) fallo("tools/.venv", "no existe", "tools/kaleidos --help (uv crea el entorno) o uv sync --project tools", afectaTools);
  else {
    // Solo metadatos de paquetes (sin importarlos: nada se ejecuta ni se escribe, -B sin bytecode)
    const guion = `import importlib.metadata as m, sys, json
r = {"python": sys.version.split()[0]}
for p in ["torch", "mediapipe", "numpy", "transformers", "spandrel", "pyobjc-framework-Vision", "huggingface-hub"]:
    try: r[p] = m.version(p)
    except Exception: r[p] = None
print(json.dumps(r))`;
    const r = cmd(py, ["-B", "-c", guion]);
    const d = r.ok ? JSON.parse(r.out.trim().split("\n").pop()) : null;
    if (!d) fallo("tools/.venv", "el intérprete no responde", "rm -rf tools/.venv && uv sync --project tools", afectaTools);
    else {
      d.python?.startsWith("3.12") ? ok("tools/.venv", `Python ${d.python}`) : fallo("tools/.venv", `Python ${d.python} (hace falta 3.12)`, "rm -rf tools/.venv && uv sync --project tools", afectaTools);
      const faltan = ["torch", "mediapipe", "numpy", "transformers", "spandrel"].filter((p) => !d[p]);
      faltan.length ? fallo("Paquetes de tools", `faltan: ${faltan.join(", ")}`, "uv sync --project tools", afectaTools) : ok("Paquetes de tools", `torch ${d.torch} · mediapipe ${d.mediapipe} · transformers ${d.transformers} · spandrel ${d.spandrel}`);
      if (d.mediapipe && d.mediapipe !== "0.10.35") aviso("mediapipe", `${d.mediapipe} (fijado a 0.10.35: la 1.0.x aborta en macOS)`, "uv sync --project tools", ["ponente"]);
      d["pyobjc-framework-Vision"] ? ok("Apple Vision (recorte alternativo)", d["pyobjc-framework-Vision"]) : aviso("Apple Vision (recorte alternativo)", "pyobjc-framework-Vision no está (solo para recortar --motor vision)", "uv sync --project tools", ["ponente"]);
    }
  }
  const whisper = path.join(TOOLS, "vendor/whisper.cpp/build/bin/whisper-cli");
  if (existe(whisper)) {
    const g = cmd("git", ["-C", path.join(TOOLS, "vendor/whisper.cpp"), "log", "-1", "--format=%h %cs"]);
    ok("whisper.cpp (Metal)", `${rel(whisper)}${g.ok ? ` · ${g.out.trim()}` : ""}`);
  } else fallo("whisper.cpp (Metal)", "no está compilado", "tools/kaleidos instalar --que whisper", afectaTools);
  const modelo = path.join(TOOLS, "modelos/ggml-large-v3-turbo.bin");
  existe(modelo) && fs.statSync(modelo).size > 1.5e9
    ? ok("Modelo de Whisper", `large-v3-turbo (${gb(fs.statSync(modelo).size)})`)
    : fallo("Modelo de Whisper", existe(modelo) ? "incompleto" : "falta ggml-large-v3-turbo.bin", "tools/kaleidos instalar --que whisper", afectaTools);
  const pose = path.join(TOOLS, "modelos/mediapipe/pose_landmarker_full.task");
  existe(pose) ? ok("Modelo de pose (MediaPipe)", "pose_landmarker_full") : fallo("Modelo de pose (MediaPipe)", "falta", "tools/kaleidos instalar --que pose", ["ponente"]);
  const rvm = path.join(TOOLS, "modelos/torch/hub/checkpoints/rvm_resnet50.pth");
  existe(rvm) && existe(path.join(TOOLS, "modelos/torch/hub/PeterL1n_RobustVideoMatting_master"))
    ? ok("Recorte del ponente (RVM)", "resnet50 + mobilenetv3")
    : fallo("Recorte del ponente (RVM)", "faltan los pesos o el repositorio de torch.hub", "tools/kaleidos instalar --que rvm", ["ponente"]);
  existe(path.join(TOOLS, "modelos/hf/hub/models--depth-anything--Depth-Anything-V2-Base-hf"))
    ? ok("Profundidad (Depth Anything V2)", "para corto-ilustrado")
    : aviso("Profundidad (Depth Anything V2)", "no descargado (solo corto-ilustrado)", "tools/kaleidos instalar --que profundidad", ["ponente"]);
  existe(path.join(TOOLS, "modelos/esrgan/RealESRGAN_x2plus.pth"))
    ? ok("Ampliación (Real-ESRGAN x2plus)", "para corto-ilustrado")
    : aviso("Ampliación (Real-ESRGAN x2plus)", "no descargado (solo corto-ilustrado)", "tools/kaleidos instalar --que ampliar", ["ponente"]);
}

// ════════════════ motor/ (Remotion) ════════════════
seccion(`motor/ · Remotion ${REMOTION}`);
{
  const nm = path.join(MOTOR, "node_modules");
  if (!existe(nm)) fallo("motor/node_modules", "no existe", "cd motor && npm install", REMOTION_FLUJOS);
  else {
    const pkg = leerJson(path.join(MOTOR, "package.json")) ?? {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const remotionDeps = Object.keys(deps).filter((k) => k === "remotion" || k.startsWith("@remotion/"));
    const malDeclarados = remotionDeps.filter((k) => deps[k] !== REMOTION);
    const instalados = remotionDeps.map((k) => [k, leerJson(path.join(nm, k, "package.json"))?.version ?? null]);
    const malInstalados = instalados.filter(([, v]) => v !== REMOTION);
    if (malDeclarados.length) fallo("Versión de Remotion (package.json)", `sin fijar a ${REMOTION}: ${malDeclarados.join(", ")}`, `fija "${REMOTION}" exacto (debe coincidir con las funciones de Lambda)`, REMOTION_FLUJOS);
    else if (malInstalados.length) fallo("Versión de Remotion (instalada)", malInstalados.map(([k, v]) => `${k}@${v ?? "falta"}`).join(", "), "cd motor && npm ci", REMOTION_FLUJOS);
    else ok("Versión de Remotion", `${REMOTION} exacto en los ${remotionDeps.length} paquetes (@remotion/lambda incluido)`);
  }
  // puppeteer-core: capturas (scripts/capture.mjs) y resolución desde motor/ (sube a node_modules de la raíz)
  let pp = null;
  try {
    const req = createRequire(path.join(MOTOR, "package.json"));
    const p = req.resolve("puppeteer-core/package.json");
    pp = { v: leerJson(p)?.version, donde: rel(path.dirname(p)) };
  } catch {}
  pp ? ok("puppeteer-core", `${pp.v} (${pp.donde}; lo resuelven motor/ y scripts/)`) : fallo("puppeteer-core", "no se resuelve desde motor/ ni desde la raíz", "npm install (en la raíz del repo)", ["narracion", "hyperframes"]);
  if (!existe(path.join(os.homedir(), "videos-opus/node_modules/puppeteer-core")))
    aviso("puppeteer-core para estilos/_esquema", "muestrario.mjs y captura.mjs usan NODE_PATH=~/videos-opus/node_modules y ahí no está", "usa NODE_PATH=$PWD/node_modules en su lugar");

  // Estilos copiados al motor (npm run estilos): mismos tokens (estilos.mjs los reescribe con otro sangrado, así que
  // se comparan ya parseados) y el mismo estilo.md (copia literal)
  const est = (existe(path.join(RAIZ, "estilos")) ? fs.readdirSync(path.join(RAIZ, "estilos"), { withFileTypes: true }) : []).filter((d) => d.isDirectory() && !d.name.startsWith("_") && existe(path.join(RAIZ, "estilos", d.name, "tokens.json"))).map((d) => d.name);
  const pub = path.join(MOTOR, "public/estilos");
  const canon = (p) => JSON.stringify(leerJson(p));
  const igual = (a, b) => existe(a) === existe(b) && (!existe(a) || fs.readFileSync(a).equals(fs.readFileSync(b)));
  const faltan = [], distintos = [];
  for (const e of est) {
    const a = path.join(RAIZ, "estilos", e), b = path.join(pub, e);
    if (!existe(path.join(b, "tokens.json"))) faltan.push(e);
    else if (canon(path.join(a, "tokens.json")) !== canon(path.join(b, "tokens.json")) || !igual(path.join(a, "estilo.md"), path.join(b, "estilo.md"))) distintos.push(e);
  }
  faltan.length || distintos.length
    ? fallo("Estilos en motor/public", [faltan.length && `sin copiar: ${faltan.join(", ")}`, distintos.length && `desactualizados: ${distintos.join(", ")}`].filter(Boolean).join(" · "), "cd motor && npm run estilos", REMOTION_FLUJOS)
    : ok("Estilos en motor/public", `${est.length} estilos al día`);
}

// ════════════════ .env (solo nombres) ════════════════
seccion(".env · credenciales (solo nombres, nunca valores)");
{
  const envP = path.join(RAIZ, ".env");
  const ejemplo = path.join(RAIZ, ".env.example");
  const nombres = (p) => {
    const m = new Map(); // nombre → definida (bool)
    if (!existe(p)) return m;
    for (const linea of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const r = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!r) continue;
      let v = r[2];
      if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1);
      else v = v.replace(/\s+#.*$/, "");
      m.set(r[1], v.length > 0); // el valor no sale de aquí
    }
    return m;
  };
  if (!existe(envP)) fallo(".env", "no existe", "cp .env.example .env y rellénalo (sin pegar valores en el chat)");
  else {
    const env = nombres(envP);
    const esperadas = [...nombres(ejemplo).keys()];
    const definidas = [...env].filter(([, d]) => d).map(([k]) => k);
    const vacias = [...env].filter(([, d]) => !d).map(([k]) => k);
    const ausentes = esperadas.filter((k) => !env.has(k));
    const modo = (fs.statSync(envP).mode & 0o777).toString(8);
    ok(".env", `${env.size} variables (${definidas.length} con valor${vacias.length ? `, ${vacias.length} vacías` : ""}) · permisos ${modo}`);
    if (Number.parseInt(modo, 8) & 0o077) aviso("Permisos de .env", `${modo}: lo pueden leer otros usuarios`, "chmod 600 .env");
    const def = (k) => definidas.includes(k);
    const grupo = (nombre, claves, obligatorias, afecta, solucion) => {
      const faltan = obligatorias.filter((k) => !(Array.isArray(k) ? k.some(def) : def(k))).map((k) => (Array.isArray(k) ? k.join(" o ") : k));
      const presentes = claves.filter(def);
      faltan.length ? fallo(nombre, `faltan: ${faltan.join(", ")}${presentes.length ? ` · definidas: ${presentes.join(", ")}` : ""}`, solucion, afecta) : ok(nombre, presentes.join(", "));
    };
    grupo("AWS (Remotion Lambda)", ["REMOTION_AWS_ACCESS_KEY_ID", "REMOTION_AWS_SECRET_ACCESS_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "REMOTION_AWS_REGION"],
      [["AWS_ACCESS_KEY_ID", "REMOTION_AWS_ACCESS_KEY_ID"], ["AWS_SECRET_ACCESS_KEY", "REMOTION_AWS_SECRET_ACCESS_KEY"]], ["lambda"], "añade las claves del usuario IAM de render a .env (plantilla en .env.example)");
    grupo("ElevenLabs (voz, música, efectos)", ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID", "ELEVENLABS_BASE_URL"],
      ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"], ["narracion"], "añade ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID a .env");
    if (def("ELEVENLABS_API_KEY") && !def("ELEVENLABS_BASE_URL")) aviso("ELEVENLABS_BASE_URL", "vacía: `tools/kaleidos voz` usa api.elevenlabs.io, pero scripts/tts.mjs necesita el endpoint", "rellénala si vas a usar scripts/tts.mjs (HyperFrames)", ["hyperframes"]);
    grupo("OpenAI (imágenes gpt-image-2)", ["OPENAI_API_KEY", "OPENAI_BASE_URL", "IMAGE_MODEL", "IMAGE_QUALITY"], ["OPENAI_API_KEY"], ["narracion", "hyperframes"], "añade OPENAI_API_KEY a .env (solo si hay láminas o B-roll)");
    def("APIFY_API_KEY") ? ok("Apify (fotos reales, de pago)", "APIFY_API_KEY") : aviso("Apify (fotos reales, de pago)", "APIFY_API_KEY sin definir (solo scripts/stock.mjs)", "añádela a .env si hace falta", ["hyperframes"]);
    if (ausentes.length) aviso("Variables de .env.example ausentes en .env", ausentes.join(", "), "cópialas de .env.example si las vas a usar");
  }
}

// ════════════════ AWS (inventario local, sin llamadas) ════════════════
seccion("AWS · aws/recursos.json (inventario local; no se llama a AWS)");
{
  const r = leerJson(path.join(RAIZ, "aws/recursos.json"));
  if (!r) fallo("aws/recursos.json", "no existe o no es JSON", "créalo (docs/CONTRATO.md §6)", ["lambda"]);
  else {
    r.region === "eu-west-1" ? ok("Región", r.region) : aviso("Región", `${r.region} (el repo trabaja en eu-west-1)`, "", ["lambda"]);
    r.remotion?.bucket ? ok("Bucket de Remotion", "definido (lectura pública: solo site y salida)") : fallo("Bucket de Remotion", "no definido", "npx remotion lambda buckets create (con OK del usuario)", ["lambda"]);
    const fn = r.remotion?.funcionPorDefecto ?? "";
    fn.includes(REMOTION.replaceAll(".", "-")) ? ok("Función de Lambda", fn) : fallo("Función de Lambda", fn ? `${fn} no es de Remotion ${REMOTION}` : "sin funcionPorDefecto", `despliega la función de ${REMOTION} (con OK del usuario)`, ["lambda"]);
    if (!r.privado?.bucket) fallo("Bucket privado", "null: las entradas no tienen dónde subirse", "node motor/scripts/lambda.mjs crear-bucket-privado --dry-run (y OK del usuario)", ["lambda"]);
    else if (r.privado.verificado === false) fallo("Bucket privado", "definido pero SIN VERIFICAR (403 sin firma)", "revísalo antes de subir nada", ["lambda"]);
    else ok("Bucket privado", `definido y verificado · caducidad ${r.privado.caducidadDias ?? "?"} días`);
    const hf = r.hyperframes ?? {};
    /^desplegad/i.test(hf.estado ?? "") ? ok("Lambda de HyperFrames", `${hf.stack} desplegado`) : aviso("Lambda de HyperFrames", `${hf.stack ?? "hyperframes-kaleidos"}: ${hf.estado ?? "sin datos"}`, "render local (npx hyperframes render) o desplegar el stack con OK del usuario" + (hf.requiere ? ` (requiere ${hf.requiere})` : ""), ["hyperframes"]);
  }
}

// ════════════════ Estilos ════════════════
seccion("Estilos · estilos/_esquema/validar.mjs");
{
  const v = cmd(process.execPath, [path.join(RAIZ, "estilos/_esquema/validar.mjs")], { cwd: RAIZ });
  const linea = v.out.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
  if (v.ok) ok("Catálogo", linea);
  else fallo("Catálogo", linea || "el validador falló", "node estilos/_esquema/validar.mjs --detalle");
}

// ════════════════ Repo: skills, plantillas, carpetas ════════════════
seccion("Repo · skills, plantillas y carpetas");
{
  const skills = ["montar-video", "edicion-ponente", "estilos-video"].filter((s) => !existe(path.join(RAIZ, ".claude/skills", s, "SKILL.md")));
  skills.length ? aviso("Skills del proyecto", `faltan: ${skills.join(", ")}`) : ok("Skills del proyecto", "montar-video · edicion-ponente · estilos-video");
  const globales = ["hyperframes", "video-corto", "product-launch-video", "general-video"].filter((s) => !existe(path.join(os.homedir(), ".claude/skills", s, "SKILL.md")));
  globales.length ? aviso("Skills globales de HyperFrames", `faltan en ~/.claude/skills: ${globales.join(", ")}`, "npx hyperframes skills update <flujo>", ["hyperframes"]) : ok("Skills globales de HyperFrames", "hyperframes · video-corto · product-launch-video · general-video");
  const plantillas = existe(path.join(RAIZ, "plantillas")) ? fs.readdirSync(path.join(RAIZ, "plantillas")).filter((d) => existe(path.join(RAIZ, "plantillas", d, "BRIEF.md"))) : [];
  plantillas.length ? ok("Plantillas", plantillas.join(" · ")) : aviso("Plantillas", "no hay plantillas/*/BRIEF.md");
  existe(path.join(RAIZ, "docs/MONTAR_VIDEO.md")) ? ok("Guía para agentes", "docs/MONTAR_VIDEO.md") : aviso("Guía para agentes", "falta docs/MONTAR_VIDEO.md");
  const brutos = path.join(RAIZ, "brutos");
  if (existe(brutos)) {
    const vids = fs.readdirSync(brutos).filter((f) => /\.(mp4|mov|mkv|m4v|webm)$/i.test(f));
    const total = vids.reduce((s, f) => s + fs.statSync(path.join(brutos, f)).size, 0);
    ok("brutos/", `${vids.length} vídeo(s), ${gb(total)} (no se modifican nunca)`);
  } else aviso("brutos/", "no existe", "mkdir brutos (fuera de git)", ["ponente"]);
  existe(path.join(RAIZ, "resultados")) ? ok("resultados/", "existe") : aviso("resultados/", "no existe (lambda.mjs la crea)");
  existe(path.join(RAIZ, "vendor/hyperframes-repo")) ? ok("vendor/hyperframes-repo", "clon para desplegar HyperFrames en Lambda") : aviso("vendor/hyperframes-repo", "no está (solo para desplegar la Lambda de HyperFrames)", "", ["hyperframes"]);
}

// ════════════════ Resumen ════════════════
const todos = secciones.flatMap((s) => s.items);
const nOk = todos.filter((i) => i.estado === "ok").length;
const nAviso = todos.filter((i) => i.estado === "aviso").length;
const nFallo = todos.filter((i) => i.estado === "fallo").length;
const listo = Object.fromEntries(FLUJOS.map((f) => [f, !todos.some((i) => i.estado === "fallo" && (i.afecta.length === 0 || i.afecta.includes(f)))]));
const hfLambda = !todos.some((i) => i.nombre === "Lambda de HyperFrames" && i.estado !== "ok");
const codigo = todos.some(bloquea) ? 1 : 0;

if (JSON_OUT) {
  console.log(JSON.stringify({ flujo: FLUJO, listo, lambdaHyperframes: hfLambda, ok: nOk, avisos: nAviso, fallos: nFallo, secciones }, null, 1));
  process.exit(codigo);
}
const M = { ok: "✓", aviso: "!", fallo: "✗" };
console.log(`\nkaleidos · doctor${FLUJO ? ` (flujo: ${FLUJO})` : ""} — solo lectura, sin AWS ni APIs de pago\n`);
for (const s of secciones) {
  console.log(s.titulo);
  for (const i of s.items) {
    const marca = i.estado === "fallo" && !bloquea(i) ? "✗·" : M[i.estado];
    console.log(`  ${marca} ${i.nombre}${i.detalle ? ` — ${i.detalle}` : ""}`);
    if (i.estado !== "ok" && i.solucion) console.log(`      → ${i.solucion}`);
  }
  console.log("");
}
const txt = (f, etq) => `${etq} ${listo[f] ? "✓" : "✗"}`;
console.log(`Listo para: ${txt("ponente", "ponente")} · ${txt("narracion", "narración")} · ${txt("hyperframes", "hyperframes")} (render ${hfLambda ? "en Lambda" : "local: su Lambda no está desplegada"}) · ${txt("lambda", "Lambda de Remotion")}`);
console.log(`${nOk} ✓ · ${nAviso} ! · ${nFallo} ✗${FLUJO && nFallo && !codigo ? ` (ninguno bloquea «${FLUJO}»; ✗· = no afecta a este flujo)` : ""}`);
process.exit(codigo);
