#!/usr/bin/env node
// Render en AWS Lambda (docs/CONTRATO.md §6). NADA se ejecuta en AWS sin confirmación explícita del usuario:
// empieza siempre por --dry-run, que imprime el plan (recursos, subidas, comandos) y el coste y el tiempo
// estimados, sin llamar a AWS ni leer credenciales.
//
//   node scripts/lambda.mjs <slug> --dry-run [--estilo X] [--timeline f] [--comp Horizontal|Vertical]
//                                            [--frames-por-lambda N | --concurrencia max|N] [--crf N] [--solo-cors]
//                                            [--caducidad-url 3h]
//   --concurrencia max (o proyecto.json › lambda.concurrencia: "max"): framesPerLambda para usar el máximo de
//   funciones por render que admite Remotion (MAX_FUNCTIONS_PER_RENDER, respetando MINIMUM_FRAMES_PER_FUNCTION).
//   node scripts/lambda.mjs <slug>                    ← real: sube, firma, (re)despliega el site si cambió, renderiza,
//                                                        descarga, limpia y añade tiempos y coste a informe.md
//   node scripts/lambda.mjs <slug> --reanudar         ← retoma el último render (sondeo, descarga y limpieza)
//   node scripts/lambda.mjs crear-bucket-privado [--dry-run]
//
// Credenciales: ../.env con un cargador propio (scripts/lib/comun.mjs), sin imprimir nunca valores.
// Bucket privado: ../aws/recursos.json › privado.bucket (entradas privadas, URLs prefirmadas de corta duración).
// Bucket de Remotion (remotionlambda-*, lectura pública): solo el site y la salida, que se borra tras descargar.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { cargarEnv, fallo, fmtBytes, fmtSeg, hashSite, leerArgs, MOTOR, OUT, RAIZ, resolverProyecto } from "./lib/comun.mjs";
import { comprobarDora, estimar, LIMITES_REMOTION, PRECIOS } from "./lib/coste.mjs";

const { pos, op } = leerArgs();
const SECO = !!op["dry-run"];
const RECURSOS = path.join(RAIZ, "aws", "recursos.json");
const titulo = (t) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 70 - t.length))}`);
const linea = (k, v) => console.log(`  ${String(k).padEnd(26)} ${v}`);

// ——— recursos.json ———
if (!fs.existsSync(RECURSOS)) fallo(`falta ${path.relative(MOTOR, RECURSOS)}: créalo con región, bucket de Remotion y bucket privado (ver docs/CONTRATO.md §6)`);
const recursos = JSON.parse(fs.readFileSync(RECURSOS, "utf8"));
const REGION = recursos.region ?? "eu-west-1";
const BUCKET_REMOTION = recursos.remotion?.bucket;
if (!BUCKET_REMOTION) fallo("aws/recursos.json no trae remotion.bucket");

// ——— Acceso a S3: SDK (dependencia de @remotion/lambda) o, si no está, la AWS CLI ———
const s3 = async () => {
  try {
    const sdk = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { Upload } = await import("@aws-sdk/lib-storage");
    const cliente = new sdk.S3Client({ region: REGION });
    return { tipo: "sdk", sdk, cliente, getSignedUrl, Upload };
  } catch {
    try {
      execFileSync("aws", ["--version"], { stdio: "ignore" });
      return { tipo: "cli" };
    } catch {
      fallo("ni @aws-sdk/client-s3 ni la AWS CLI están disponibles");
    }
  }
};
const aws = (args) => execFileSync("aws", [...args, "--region", REGION], { encoding: "utf8" });

const subir = async (S, bucket, key, archivo, tipo) => {
  if (S.tipo === "cli") {
    aws(["s3", "cp", archivo, `s3://${bucket}/${key}`, "--sse", "AES256", "--no-progress", ...(tipo ? ["--content-type", tipo] : [])]);
    return;
  }
  const up = new S.Upload({
    client: S.cliente,
    params: { Bucket: bucket, Key: key, Body: fs.createReadStream(archivo), ServerSideEncryption: "AES256", ContentType: tipo },
    queueSize: 6,
    partSize: 16 * 1024 * 1024,
  });
  let ultimo = 0;
  up.on("httpUploadProgress", (p) => {
    const pc = p.total ? Math.floor((p.loaded / p.total) * 20) : 0;
    if (pc !== ultimo) {
      ultimo = pc;
      process.stdout.write(`\r    ${path.basename(archivo)} ${pc * 5} %   `);
    }
  });
  await up.done();
  process.stdout.write("\n");
};
const firmar = async (S, bucket, key, segundos) => {
  if (S.tipo === "cli") return aws(["s3", "presign", `s3://${bucket}/${key}`, "--expires-in", String(segundos)]).trim();
  return S.getSignedUrl(S.cliente, new S.sdk.GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: segundos });
};
const borrarPrefijo = async (S, bucket, prefijo) => {
  if (S.tipo === "cli") {
    aws(["s3", "rm", `s3://${bucket}/${prefijo}`, "--recursive"]);
    return;
  }
  let token;
  do {
    const r = await S.cliente.send(new S.sdk.ListObjectsV2Command({ Bucket: bucket, Prefix: prefijo, ContinuationToken: token }));
    const objetos = (r.Contents ?? []).map((o) => ({ Key: o.Key }));
    if (objetos.length) await S.cliente.send(new S.sdk.DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objetos, Quiet: true } }));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
};
const descargar = async (S, bucket, key, destino) => {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (S.tipo === "cli") {
    aws(["s3", "cp", `s3://${bucket}/${key}`, destino, "--no-progress"]);
    return fs.statSync(destino).size;
  }
  const r = await S.cliente.send(new S.sdk.GetObjectCommand({ Bucket: bucket, Key: key }));
  await pipeline(r.Body, fs.createWriteStream(destino));
  return fs.statSync(destino).size;
};

const esErrorDeRed = (e) => /ECONNRESET|ETIMEDOUT|EAI_AGAIN|EPIPE|socket hang up|fetch failed|TimeoutError|NetworkingError|Throttl|Rate exceeded|TooManyRequests/i.test(`${e?.code ?? ""} ${e?.name ?? ""} ${e?.message ?? ""}`);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const conReintentos = async (que, fn, intentos = 4) => {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= intentos || !esErrorDeRed(e)) throw e;
      console.log(`    (${que}: ${e.code ?? e.name ?? "error de red"}; reintento ${i}/${intentos - 1})`);
      await esperar(2000 * i);
    }
  }
};

// ════════════════════════════ crear-bucket-privado ════════════════════════════
if (pos[0] === "crear-bucket-privado") {
  const priv = recursos.privado ?? {};
  const prefijo = priv.prefijo ?? "kaleidos-privado-";
  const dias = priv.caducidadDias ?? 3;
  if (priv.bucket && !op.forzar) fallo(`ya hay bucket privado en recursos.json (${priv.bucket}); usa --forzar para crear otro`);
  const nombre = `${prefijo}${crypto.randomBytes(4).toString("hex")}`;
  const cors = { CORSRules: [{ AllowedMethods: ["GET", "HEAD"], AllowedOrigins: ["*"], AllowedHeaders: ["Range"], ExposeHeaders: ["Content-Range", "Content-Length", "Accept-Ranges", "ETag"], MaxAgeSeconds: 3000 }] };
  const bloqueo = { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true };
  const cifrado = { Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" }, BucketKeyEnabled: true }] };
  const ciclo = { Rules: [{ ID: "caducidad-entradas", Status: "Enabled", Filter: { Prefix: "" }, Expiration: { Days: dias }, AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 } }] };
  titulo(`Bucket privado ${SECO ? "(dry-run: no se llama a AWS)" : ""}`);
  linea("Nombre", `${nombre}  (prefijo de recursos.json + 8 hex aleatorios)`);
  linea("Región", REGION);
  linea("1. CreateBucket", `LocationConstraint=${REGION}`);
  linea("2. PutPublicAccessBlock", JSON.stringify(bloqueo));
  linea("3. PutBucketEncryption", "SSE-S3 (AES256), BucketKey");
  linea("4. PutBucketLifecycle", `caducidad de ${dias} días + multipart incompletos a 1 día`);
  linea("5. PutBucketCors", "GET y HEAD, cualquier origen, cabecera Range (con esto sobraría --disable-web-security)");
  linea("6. GetPublicAccessBlock", "comprobación de que el bloqueo quedó activo");
  linea("7. recursos.json", `privado.bucket = "${nombre}" (verificado: false hasta el paso 8)`);
  linea("8. Sonda sin firma", `PutObject sonda.txt; curl sin firma a https://${nombre}.s3.${REGION}.amazonaws.com/ y /sonda.txt → debe dar 403; DeleteObject`);
  linea("Permisos", "s3:CreateBucket, s3:PutBucketPublicAccessBlock, s3:GetBucketPublicAccessBlock, s3:PutEncryptionConfiguration, s3:PutLifecycleConfiguration, s3:PutBucketCORS, s3:PutObject, s3:DeleteObject en arn:aws:s3:::kaleidos-*");
  linea("Coste", "0 $ en reposo (se paga por GB almacenado; las entradas caducan solas)");
  if (SECO) {
    console.log("\n  Equivalente con la AWS CLI:");
    console.log(`    aws s3api create-bucket --bucket ${nombre} --region ${REGION} --create-bucket-configuration LocationConstraint=${REGION}`);
    console.log(`    aws s3api put-public-access-block --bucket ${nombre} --public-access-block-configuration '${JSON.stringify(bloqueo)}'`);
    console.log(`    aws s3api put-bucket-encryption --bucket ${nombre} --server-side-encryption-configuration '${JSON.stringify(cifrado)}'`);
    console.log(`    aws s3api put-bucket-lifecycle-configuration --bucket ${nombre} --lifecycle-configuration '${JSON.stringify(ciclo)}'`);
    console.log(`    aws s3api put-bucket-cors --bucket ${nombre} --cors-configuration '${JSON.stringify(cors)}'`);
    console.log(`    curl -s -o /dev/null -w "%{http_code}" https://${nombre}.s3.${REGION}.amazonaws.com/sonda.txt   # → 403`);
    console.log("\n  (dry-run) No se ha creado nada. Para crearlo, con confirmación del usuario: node scripts/lambda.mjs crear-bucket-privado\n");
    process.exit(0);
  }
  cargarEnv();
  const S = await s3();
  if (S.tipo !== "sdk") fallo("crear-bucket-privado necesita @aws-sdk/client-s3");
  const { sdk, cliente } = S;
  await cliente.send(new sdk.CreateBucketCommand({ Bucket: nombre, CreateBucketConfiguration: { LocationConstraint: REGION } }));
  await cliente.send(new sdk.PutPublicAccessBlockCommand({ Bucket: nombre, PublicAccessBlockConfiguration: bloqueo }));
  await cliente.send(new sdk.PutBucketEncryptionCommand({ Bucket: nombre, ServerSideEncryptionConfiguration: cifrado }));
  await cliente.send(new sdk.PutBucketLifecycleConfigurationCommand({ Bucket: nombre, LifecycleConfiguration: ciclo }));
  await cliente.send(new sdk.PutBucketCorsCommand({ Bucket: nombre, CORSConfiguration: cors }));
  const pab = await cliente.send(new sdk.GetPublicAccessBlockCommand({ Bucket: nombre }));
  const c = pab.PublicAccessBlockConfiguration ?? {};
  if (!(c.BlockPublicAcls && c.IgnorePublicAcls && c.BlockPublicPolicy && c.RestrictPublicBuckets)) fallo(`el bloqueo de acceso público de ${nombre} no quedó activo`);
  recursos.privado = { ...priv, bucket: nombre, creado: new Date().toISOString(), verificado: false };
  fs.writeFileSync(RECURSOS, JSON.stringify(recursos, null, 2) + "\n");
  await cliente.send(new sdk.PutObjectCommand({ Bucket: nombre, Key: "sonda.txt", Body: "sonda", ServerSideEncryption: "AES256" }));
  const codigo = (url) => execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", url], { encoding: "utf8" }).trim();
  const r1 = codigo(`https://${nombre}.s3.${REGION}.amazonaws.com/`);
  const r2 = codigo(`https://${nombre}.s3.${REGION}.amazonaws.com/sonda.txt`);
  await cliente.send(new sdk.DeleteObjectCommand({ Bucket: nombre, Key: "sonda.txt" }));
  if (r1 !== "403" || r2 !== "403") fallo(`¡el bucket responde sin firma! listado=${r1} objeto=${r2}: NO usar hasta revisarlo (recursos.json › verificado: false)`);
  recursos.privado.verificado = true;
  fs.writeFileSync(RECURSOS, JSON.stringify(recursos, null, 2) + "\n");
  console.log(`\n✓ ${nombre}: privado (403 sin firma), SSE-S3, caducidad ${dias} días, CORS de solo lectura. recursos.json actualizado.\n`);
  process.exit(0);
}

// ════════════════════════════ render ════════════════════════════
const p = resolverProyecto(pos[0]);
const cfgL = p.proyecto.lambda ?? {};
const FUNCION = op.funcion ?? cfgL.funcion ?? recursos.remotion?.funcionPorDefecto;
if (!FUNCION) fallo("no hay función: proyecto.json › lambda.funcion o recursos.json › remotion.funcionPorDefecto");
const COMP = op.comp ?? "Horizontal";
const CRF = Number(op.crf ?? cfgL.crf ?? 20);
const FPL = Number(op["frames-por-lambda"] ?? cfgL.framesPorLambda ?? 100);
// Concurrencia: «max» o un número de funciones. --frames-por-lambda en la línea de órdenes manda sobre proyecto.json.
const CONCURRENCIA = op.concurrencia ?? (op["frames-por-lambda"] ? null : (cfgL.concurrencia ?? null));
if (CONCURRENCIA !== null && CONCURRENCIA !== "max" && !(Number(CONCURRENCIA) >= 1)) fallo(`--concurrencia «${CONCURRENCIA}»: usa max o un número de funciones`);
// Límites de Remotion por render, leídos de la versión instalada (sin llamar a AWS).
const LIMITES = await (async () => {
  try {
    const c = await import("@remotion/serverless-client");
    return { maxFunciones: c.MAX_FUNCTIONS_PER_RENDER ?? LIMITES_REMOTION.maxFunciones, minFotogramas: c.MINIMUM_FRAMES_PER_FUNCTION ?? LIMITES_REMOTION.minFotogramas, fuente: "@remotion/serverless-client" };
  } catch {
    return { ...LIMITES_REMOTION, fuente: "valores de 4.0.529 (no se pudo leer @remotion/serverless-client)" };
  }
})();
const CONSERVAR = !!(op["conservar-salida"] ?? cfgL.conservarSalida);
const TL_ARCHIVO = op.timeline ?? "timeline.json";
const ESTILO = op.estilo ?? p.proyecto.estilo;
const CADUCIDAD = (() => {
  const m = String(op["caducidad-url"] ?? "3h").match(/^(\d+)(h|m)?$/);
  return m ? Number(m[1]) * (m[2] === "m" ? 60 : 3600) : 10800;
})();
const WEB_SECURITY_OFF = !op["solo-cors"];
const BUCKET_PRIVADO = recursos.privado?.bucket ?? null;
const ESTADO = path.join(OUT, "lambda", `${p.slug}.json`);

const { timelineSchema, tokensSchema, errorLegible } = await import("../src/datos/contrato.ts");
const tlPath = p.archivos.get(TL_ARCHIVO) ?? path.join(p.media, TL_ARCHIVO);
if (!fs.existsSync(tlPath)) fallo(`no existe ${path.relative(MOTOR, tlPath)}`);
const rTl = timelineSchema.safeParse(JSON.parse(fs.readFileSync(tlPath, "utf8")));
if (!rTl.success) fallo(errorLegible(TL_ARCHIVO, rTl.error).message);
const tl = rTl.data;
if (!ESTILO) fallo("falta el estilo (proyecto.json › estilo o --estilo)");
const tokPath = path.join(MOTOR, "public", "estilos", ESTILO, "tokens.json");
if (!fs.existsSync(tokPath)) fallo(`el estilo «${ESTILO}» no está en public/estilos (npm run estilos)`);
const rTok = tokensSchema.safeParse(JSON.parse(fs.readFileSync(tokPath, "utf8")));
if (!rTok.success) fallo(errorLegible(`estilos/${ESTILO}/tokens.json`, rTok.error).message);

// Entradas privadas: timeline + medios que usa el render. Con recorte, el vídeo del mezzanine no se pinta: se sube
// solo su audio (extraído sin recodificar a out/lambda/<slug>/audio.m4a), no el mezzanine entero.
// §8 Narración: timeline + la locución (narracion.m4a) como `audio` + extras. Ni mezzanine, ni plancha, ni máscara.
const NARRACION = tl.narracion === true;
const entradas = [{ clave: "timelineSrc", archivo: TL_ARCHIVO, tipo: "application/json" }];
const SOLO_AUDIO = !NARRACION && tl.recorte && !op["con-mezzanine"];
const AUDIO_LOCAL = path.join(OUT, "lambda", p.slug, "audio.m4a");
const LOCUCION = p.archivos.has("narracion.m4a") || !p.archivos.has("audio.m4a") ? "narracion.m4a" : "audio.m4a";
if (NARRACION) entradas.push({ clave: "audio", archivo: LOCUCION, tipo: "audio/mp4", que: "locución" });
else if (SOLO_AUDIO) entradas.push({ clave: "audio", archivo: "audio.m4a", tipo: "audio/mp4", ruta: AUDIO_LOCAL, derivado: "mezzanine.mp4" });
else entradas.push({ clave: "mezzanine", archivo: "mezzanine.mp4", tipo: "video/mp4" });
if (!NARRACION && tl.recorte) entradas.push({ clave: "plancha", archivo: "plancha.mp4", tipo: "video/mp4" }, { clave: "mascara", archivo: "mascara.mp4", tipo: "video/mp4" });
// Extras que referencia el timeline (claves de media.extras = nombre del archivo sin extensión en media/extras/):
// ilustraciones 2,5D (imagen + profundidad), láminas y capturas (§7.3) y la pista de audio (música y efectos).
const TIPOS_EXTRA = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".wav": "audio/wav", ".ogg": "audio/ogg" };
const extrasUsados = new Map(); // clave → para qué
const usar = (k, que) => k && !extrasUsados.has(k) && extrasUsados.set(k, que);
for (const e of tl.eventos) {
  if (e.tipo === "ilustracion") {
    usar(e.imagen, "ilustración");
    usar(e.profundidad, "profundidad");
  }
  if (e.tipo === "lamina") usar(e.imagen, "lámina");
}
for (const m of tl.audio?.musica ?? []) usar(m.archivo, "música");
for (const x of tl.audio?.sfx ?? []) usar(x.archivo, "efecto");
const extrasLocales = new Map();
for (const rel of p.archivos.keys()) if (rel.startsWith("extras/")) extrasLocales.set(path.basename(rel).replace(/\.[^.]+$/, ""), rel);
for (const [k, que] of extrasUsados) {
  const rel = extrasLocales.get(k);
  const ext = rel ? path.extname(rel).toLowerCase() : "";
  entradas.push({ clave: `extra:${k}`, archivo: rel ?? `extras/${k}`, tipo: TIPOS_EXTRA[ext] ?? "application/octet-stream", que });
}
const faltan = [];
for (const e of entradas) {
  if (e.derivado) {
    // audio.m4a: se estima en dry-run (ffprobe, solo lectura) y se extrae en real (ffmpeg -vn -c:a copy).
    const origen = p.archivos.get(e.derivado) ?? path.join(p.media, e.derivado);
    if (!fs.existsSync(origen)) {
      if (!SECO) fallo(`falta ${path.relative(MOTOR, origen)}`);
      faltan.push(e.derivado);
      e.bytes = 0;
      e.falta = true;
      continue;
    }
    e.origen = origen;
    const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=bit_rate:format=duration", "-of", "json", origen], { encoding: "utf8" }));
    e.bytes = Math.round((Number(info.streams?.[0]?.bit_rate ?? 192000) / 8) * Number(info.format?.duration ?? 0));
    continue;
  }
  const a = p.archivos.get(e.archivo) ?? path.join(p.media, e.archivo);
  if (!fs.existsSync(a)) {
    // En dry-run se informa y se sigue (p. ej. la plancha aún se está generando); en real, se para.
    if (!SECO) fallo(`falta ${path.relative(MOTOR, a)} (timeline.recorte=${tl.recorte})`);
    faltan.push(e.archivo);
    e.bytes = 0;
    e.falta = true;
    continue;
  }
  e.bytes = fs.statSync(a).size;
  e.ruta = a;
}
const bytesEntrada = entradas.reduce((s, e) => s + e.bytes, 0);
const hash = hashSite().slice(0, 12);
const SITE = `motor-${hash}`;
const sitiosLocales = path.join(OUT, "lambda", "sitios.json");
const sitios = fs.existsSync(sitiosLocales) ? JSON.parse(fs.readFileSync(sitiosLocales, "utf8")) : {};
const ejecucion = `${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}-${crypto.randomBytes(3).toString("hex")}`;
const PREFIJO = `entradas/${p.slug}/${ejecucion}/`;
const ESCENARIO = tl.escenario === true || (tl.escenario !== false && rTok.data.escenario?.activo === true);
// Duración de la locución (ffprobe, solo lectura) para el coste fijo de la onda de voz en cada función.
const audioVoz = (() => {
  const e = entradas.find((x) => x.clave === "audio" && !x.derivado);
  if (!NARRACION || !e?.ruta) return { bytes: e?.bytes ?? 0, segundos: tl.duracion / tl.fps };
  try {
    return { bytes: e.bytes, segundos: Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", e.ruta], { encoding: "utf8" }).trim()) || tl.duracion / tl.fps };
  } catch {
    return { bytes: e.bytes, segundos: tl.duracion / tl.fps };
  }
})();
const est = estimar({ tl, funcion: FUNCION, porLambda: FPL, concurrencia: CONCURRENCIA, limites: LIMITES, recorte: tl.recorte, escenario: ESCENARIO || NARRACION, narracion: NARRACION, audioVoz, bytesEntrada });
const dora = comprobarDora();

// ——— Plan ———
titulo(`Render en Lambda · ${p.slug} ${SECO ? "(DRY-RUN: sin llamadas a AWS)" : ""}`);
linea("Proyecto", `${path.relative(RAIZ, p.dir)}  ·  ${TL_ARCHIVO}  ·  estilo ${ESTILO}  ·  ${COMP}`);
linea("Vídeo", `${tl.duracion} fotogramas = ${fmtSeg(tl.duracion / tl.fps)} a ${tl.fps} fps, ${tl.ancho}×${tl.alto}, ${NARRACION ? "NARRACIÓN (§8: sin ponente, locución de TTS)" : tl.recorte ? "con recorte" : "sin recorte"}, 3D ${(est.frac3d * 100).toFixed(1)} %${ESCENARIO || NARRACION ? ", MODO ESCENARIO (§7)" : ""}`);
linea("Región", REGION);
linea("Función", `${FUNCION} (${est.trozos} funciones de ${est.porLambda} fotogramas)`);
linea(
  "Concurrencia",
  CONCURRENCIA === "max"
    ? `MÁXIMA: ${est.trozos} funciones de ${est.porLambda} f (límite de Remotion ${LIMITES.maxFunciones} funciones por render, mínimo ${LIMITES.minFotogramas} f por función; ${LIMITES.fuente})`
    : CONCURRENCIA
      ? `${CONCURRENCIA} funciones pedidas → ${est.trozos} de ${est.porLambda} f`
      : `framesPerLambda ${est.porLambda} (${est.trozos} funciones; --concurrencia max daría ${Math.ceil(tl.duracion / Math.max(LIMITES.minFotogramas, Math.ceil(tl.duracion / LIMITES.maxFunciones)))})`,
);
if (est.trozos > 100) linea("", `ojo: ${est.trozos} ejecuciones simultáneas de la función (cuota de concurrencia de Lambda de la cuenta, 1000 por defecto en la región)`);
linea("Site", `${SITE} en ${BUCKET_REMOTION}: ${sitios[SITE] ? "ya desplegado según out/lambda/sitios.json (en real se comprueba con getSites)" : "NUEVO: se empaqueta motor/ con public/ (estilos y efectos) y se sube"}`);
linea("Bucket privado", BUCKET_PRIVADO ? `${BUCKET_PRIVADO} (${recursos.privado?.verificado === false ? "¡SIN VERIFICAR!" : "privado"}, caducidad ${recursos.privado?.caducidadDias ?? "?"} días)` : "✗ FALTA: recursos.json › privado.bucket es null → node scripts/lambda.mjs crear-bucket-privado --dry-run");
linea("Credenciales", fs.existsSync(path.join(RAIZ, ".env")) ? "../.env presente (en dry-run no se lee)" : "✗ falta ../.env");

titulo("Subidas privadas (SSE-S3) y URLs prefirmadas");
for (const e of entradas) console.log(`  ${(e.derivado ? `${e.archivo} (audio de ${e.derivado})` : e.que ? `${e.archivo} (${e.que})` : e.archivo).padEnd(44)} ${e.falta ? "  ✗ FALTA" : fmtBytes(e.bytes).padStart(9)}  ${String(e.tipo ?? "").padEnd(16)} → s3://${BUCKET_PRIVADO ?? "<bucket-privado>"}/${PREFIJO}${path.basename(e.archivo)}`);
const nExtras = entradas.filter((e) => e.clave.startsWith("extra:"));
if (nExtras.length) linea("Extras", `${nExtras.length} (${fmtBytes(nExtras.reduce((a, e) => a + e.bytes, 0))}) → props.media.extras con URL prefirmada cada uno`);
linea("Total", `${fmtBytes(bytesEntrada)} (≈ ${fmtSeg(est.tSubida)} a 50 Mb/s)  ·  URLs prefirmadas de ${CADUCIDAD / 3600} h`);
linea("Acceso", WEB_SECURITY_OFF ? "--disable-web-security (lectura entre dominios sin CORS)" : "solo CORS del bucket privado (--solo-cors)");

titulo("Render");
linea("renderMediaOnLambda", `codec h264, crf ${CRF}, aac 192k, privacy private, framesPerLambda ${est.porLambda}, maxRetries 2, timeout 240 s, gl swangle`);
linea("Props", `{ timelineSrc: <URL firmada>, estilo, media: { ${NARRACION ? "audio (locución)" : "mezzanine, audio?, plancha?, mascara?"}, extras: { ${[...extrasUsados.keys()].slice(0, 6).join(", ")}${extrasUsados.size > 6 ? ", …" : ""} } } } (el texto solo viaja en timeline.json privado)`);
linea("Sondeo", "getRenderProgress cada 4 s, tolerante a ECONNRESET/ETIMEDOUT (hasta 30 fallos seguidos)");
linea("Salida", `s3://${BUCKET_REMOTION}/renders/<id>/${p.slug}.mp4 → ${path.relative(MOTOR, path.join(RAIZ, "resultados", `${p.slug}.mp4`))} y ${CONSERVAR ? "se CONSERVA renders/<id>/" : "se borra renders/<id>/"}`);
linea("Limpieza", `se borran las entradas privadas s3://${BUCKET_PRIVADO ?? "<bucket-privado>"}/${PREFIJO}`);
linea("Informe", `se añade la sección de tiempos y coste real a ${path.relative(MOTOR, p.informe)}`);

titulo("Estimación de coste y tiempo");
linea("Calibración", est.calibracion);
linea("Local swangle (s/f)", Object.entries(est.sLocal).filter(([k]) => (NARRACION ? k.startsWith("narracion") || (k.startsWith("escenario") && k !== "escenario") : ESCENARIO ? k.startsWith("escenario") || k === "marco" : !k.startsWith("escenario") && !k.startsWith("narracion"))).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(" · "));
linea("Factor Lambda/local", `${est.factor.toFixed(2)} (del render real de DORA; el modelo lo reproduce: ${dora.coste.toFixed(2)} $ y ${Math.round(dora.tRender)} s frente a 0,29 $ y 82 s)`);
linea("s/fotograma en Lambda", `${est.sLambdaMedio.toFixed(3)} de media; trozo más lento ≈ ${fmtSeg(est.trozoLento)}`);
linea("Fijo por función", `${est.fijoPorFuncion.toFixed(1)} s (arranque + primer fotograma${NARRACION ? ` + locución de ${fmtSeg(audioVoz.segundos)} para la onda` : ""}) × ${est.trozos} = ${Math.round(est.pesoFijo * 100)} % del tiempo facturado`);
linea("Tiempo de render", `≈ ${fmtSeg(est.tRender)} (lanzamiento + trozo más lento + unión)  ·  descarga ≈ ${fmtSeg(est.tDescarga)} a 100 Mb/s`);
linea("Lambda", `${Math.round(est.gbs)} GB-s → ${est.coste.lambda.toFixed(3)} $`);
linea("Disco, invocaciones, S3", `${est.coste.discoExtra.toFixed(4)} $ · ${est.coste.invocaciones.toFixed(5)} $ · ${est.coste.s3.toFixed(4)} $`);
linea("Transferencia de salida", `0–${est.coste.transferencia.max.toFixed(3)} $ (${fmtBytes(est.salidaBytes)}; gratis dentro de los 100 GB/mes)`);
linea("TOTAL estimado", `≈ ${est.coste.total.toFixed(2)} $  (rango ${est.coste.rango[0].toFixed(2)}–${est.coste.rango[1].toFixed(2)} $)`);

titulo("Comandos equivalentes (referencia; el script usa las APIs)");
console.log(`  aws s3 cp media/<archivo> s3://${BUCKET_PRIVADO ?? "<bucket-privado>"}/${PREFIJO}<archivo> --sse AES256`);
console.log(`  aws s3 presign s3://${BUCKET_PRIVADO ?? "<bucket-privado>"}/${PREFIJO}<archivo> --expires-in ${CADUCIDAD}`);
if (!sitios[SITE]) console.log(`  npx remotion lambda sites create src/index.ts --site-name=${SITE} --region=${REGION}`);
console.log(`  npx remotion lambda render ${SITE} ${COMP} --function-name=${FUNCION} --region=${REGION} --props=<props-firmadas.json> \\`);
console.log(`     --frames-per-lambda=${est.porLambda} --codec=h264 --crf=${CRF} --privacy=private --max-retries=2 --timeout=240000${WEB_SECURITY_OFF ? " --disable-web-security" : ""}`);

if (SECO) {
  if (faltan.length) console.log(`\n  ✗ Faltan medios (${faltan.join(", ")}): el render real se parará hasta que existan.`);
  console.log(`\n  (dry-run) No se ha llamado a AWS ni se han leído credenciales. ${BUCKET_PRIVADO ? "" : "Antes del render real hay que crear el bucket privado. "}Para lanzarlo, con confirmación del usuario: node scripts/lambda.mjs ${p.slug}\n`);
  process.exit(0);
}

// ════════════════ Modo real (solo con confirmación explícita del usuario) ════════════════
if (!BUCKET_PRIVADO) fallo("recursos.json › privado.bucket es null: crea antes el bucket privado (node scripts/lambda.mjs crear-bucket-privado)");
if (recursos.privado?.verificado === false) fallo(`el bucket privado ${BUCKET_PRIVADO} no está verificado (403 sin firma): revísalo antes de subir nada`);
const cargadas = cargarEnv();
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) fallo(`faltan credenciales en ../.env (claves presentes: ${cargadas.join(", ") || "ninguna"})`);
const lambda = await import("@remotion/lambda");
const S = await s3();
fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
const tiempos = {};
const marca = (k, t0) => (tiempos[k] = (Date.now() - t0) / 1000);

let estado;
if (op.reanudar) {
  if (!fs.existsSync(ESTADO)) fallo(`no hay render que reanudar (${path.relative(MOTOR, ESTADO)})`);
  estado = JSON.parse(fs.readFileSync(ESTADO, "utf8"));
  console.log(`\n  Reanudando ${estado.renderId}`);
} else {
  // 1. Subidas privadas + URLs prefirmadas
  titulo("1. Subidas privadas");
  let t0 = Date.now();
  const urls = {};
  for (const e of entradas.filter((x) => x.derivado)) {
    fs.mkdirSync(path.dirname(e.ruta), { recursive: true });
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", e.origen, "-vn", "-c:a", "copy", "-movflags", "+faststart", e.ruta]);
    e.bytes = fs.statSync(e.ruta).size;
  }
  for (const e of entradas) {
    const key = `${PREFIJO}${path.basename(e.archivo)}`;
    await conReintentos(`subida ${e.archivo}`, () => subir(S, BUCKET_PRIVADO, key, e.ruta, e.tipo));
    urls[e.clave] = await firmar(S, BUCKET_PRIVADO, key, CADUCIDAD);
  }
  marca("subida", t0);
  const extras = {};
  for (const [k, v] of Object.entries(urls)) if (k.startsWith("extra:")) extras[k.slice(6)] = v;
  // Con ponente, `mezzanine` es obligatorio; con solo audio se pasa la URL del audio (el vídeo no se pinta).
  // En narración (§8) no hay mezzanine: solo la locución en `audio`.
  const props = NARRACION
    ? { timelineSrc: urls.timelineSrc, estilo: ESTILO, media: { audio: urls.audio, extras } }
    : { timelineSrc: urls.timelineSrc, estilo: ESTILO, media: { mezzanine: urls.mezzanine ?? urls.audio, ...(urls.audio ? { audio: urls.audio } : {}), ...(urls.plancha ? { plancha: urls.plancha, mascara: urls.mascara } : {}), extras } };

  // 2. Site: solo si cambió el hash del motor y los estilos
  titulo("2. Site");
  t0 = Date.now();
  let serveUrl = null;
  const existentes = await conReintentos("getSites", () => lambda.getSites({ region: REGION, forceBucketName: BUCKET_REMOTION }));
  serveUrl = existentes.sites.find((s) => s.id === SITE)?.serveUrl ?? null;
  if (serveUrl) console.log(`  ${SITE} ya existe: se reutiliza`);
  else {
    const { bundle } = await import("@remotion/bundler");
    const dirSite = path.join(OUT, "bundle-site");
    fs.rmSync(dirSite, { recursive: true, force: true });
    await bundle({ entryPoint: path.join(MOTOR, "src", "index.ts"), outDir: dirSite, publicDir: path.join(MOTOR, "public") });
    const r = await lambda.deploySiteFromBundle({ bucketName: BUCKET_REMOTION, region: REGION, bundleDir: dirSite, siteName: SITE });
    serveUrl = r.serveUrl;
    console.log(`  ${SITE} desplegado (${r.stats.uploadedFiles} archivos subidos)`);
  }
  sitios[SITE] = { serveUrl, fecha: new Date().toISOString() };
  fs.writeFileSync(sitiosLocales, JSON.stringify(sitios, null, 2));
  marca("site", t0);

  // 3. Render
  titulo("3. Render");
  t0 = Date.now();
  const r = await conReintentos(
    "renderMediaOnLambda",
    () =>
      lambda.renderMediaOnLambda({
        region: REGION,
        functionName: FUNCION,
        serveUrl,
        composition: COMP,
        inputProps: props,
        codec: "h264",
        crf: CRF,
        audioCodec: "aac",
        audioBitrate: "192k",
        imageFormat: "jpeg",
        jpegQuality: 90,
        privacy: "private",
        framesPerLambda: est.porLambda,
        maxRetries: 2,
        timeoutInMilliseconds: 240000,
        chromiumOptions: { gl: "swangle", ...(WEB_SECURITY_OFF ? { disableWebSecurity: true } : {}) },
        outName: `${p.slug}.mp4`,
        logLevel: "warn",
      }),
    3,
  );
  estado = { renderId: r.renderId, bucketName: r.bucketName, region: REGION, prefijo: PREFIJO, bucketPrivado: BUCKET_PRIVADO, inicio: t0, subida: tiempos.subida, site: tiempos.site, estimado: est.coste.total, estimadoS: est.tRender };
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
  console.log(`  renderId ${r.renderId}`);
}

// 4. Sondeo robusto
titulo("4. Progreso");
let prog = null;
let fallos = 0;
for (;;) {
  try {
    prog = await lambda.getRenderProgress({ renderId: estado.renderId, bucketName: estado.bucketName, functionName: FUNCION, region: REGION });
    fallos = 0;
  } catch (e) {
    if (!esErrorDeRed(e) || ++fallos > 30) throw e;
    process.stdout.write(`\r  (sin respuesta: ${e.code ?? e.name}; reintento ${fallos}/30)        `);
    await esperar(5000);
    continue;
  }
  process.stdout.write(`\r  ${Math.round(prog.overallProgress * 100)} %  ·  ${prog.framesRendered}/${tl.duracion} f  ·  ${prog.lambdasInvoked} funciones  ·  ${prog.costs.displayCost}        `);
  if (prog.fatalErrorEncountered) {
    console.log("\n");
    for (const e of prog.errors.slice(0, 5)) console.log(`  ✗ ${e.message?.split("\n")[0]}`);
    fallo(`el render ${estado.renderId} ha fallado (entradas privadas conservadas para reintentar; caducan solas)`);
  }
  if (prog.done) break;
  await esperar(4000);
}
const tRender = (Date.now() - estado.inicio) / 1000;
console.log("");

// 5. Descarga
titulo("5. Descarga");
let t0 = Date.now();
const destino = path.join(RAIZ, "resultados", `${p.slug}.mp4`);
const bytes = await conReintentos("descarga", () => descargar(S, prog.outBucket ?? estado.bucketName, prog.outKey, destino), 5);
const tDescarga = (Date.now() - t0) / 1000;
console.log(`  ${path.relative(RAIZ, destino)} (${fmtBytes(bytes)})`);

// 6. Limpieza
titulo("6. Limpieza");
if (!CONSERVAR) {
  await conReintentos("deleteRender", () => lambda.deleteRender({ bucketName: estado.bucketName, region: REGION, renderId: estado.renderId }));
  console.log(`  borrado renders/${estado.renderId}/ de ${estado.bucketName}`);
} else console.log(`  se conserva renders/${estado.renderId}/ (conservarSalida)`);
await conReintentos("borrado de entradas", () => borrarPrefijo(S, estado.bucketPrivado, estado.prefijo));
console.log(`  borradas las entradas privadas ${estado.prefijo}`);
fs.rmSync(ESTADO, { force: true });

// 7. Informe
const costeLambda = prog.costs.accruedSoFar;
const costeS3 = (bytesEntrada / 1e9) * PRECIOS.s3GbMes * (1 / 30) + (prog.chunks * 6 + 20) * PRECIOS.s3Put + prog.chunks * 200 * PRECIOS.s3Get;
const salidaGb = bytes / 1e9;
const seccion = `
## Render en Lambda (${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC)

| Concepto | Valor |
|---|---|
| Función · región | \`${FUNCION}\` · ${REGION} |
| Site | \`${SITE}\` |
| Fotogramas | ${tl.duracion} (${fmtSeg(tl.duracion / tl.fps)}), ${prog.chunks} funciones de ${est.porLambda}, ${NARRACION ? "narración" : `${tl.recorte ? "con" : "sin"} recorte`}, 3D ${(est.frac3d * 100).toFixed(1)} % |
| Subida de entradas | ${fmtBytes(bytesEntrada)} en ${fmtSeg(estado.subida ?? 0)} |
| Site | ${fmtSeg(estado.site ?? 0)} |
| Render (reloj) | ${fmtSeg(tRender)} (Remotion: ${prog.timeToFinish ? fmtSeg(prog.timeToFinish / 1000) : "?"}; estimado ${fmtSeg(estado.estimadoS ?? est.tRender)}) |
| Facturación Lambda estimada por Remotion | ${prog.estimatedBillingDurationInMilliseconds ? fmtSeg(prog.estimatedBillingDurationInMilliseconds / 1000) : "?"} |
| Descarga | ${fmtBytes(bytes)} en ${fmtSeg(tDescarga)} → \`resultados/${p.slug}.mp4\` |
| Reintentos de trozos | ${prog.retriesInfo?.length ?? 0} |
| **Coste Lambda (getRenderProgress)** | **${costeLambda.toFixed(3)} $** (${prog.costs.disclaimer ?? ""}) |
| S3 (almacenamiento y peticiones) | ≈ ${costeS3.toFixed(4)} $ |
| Transferencia de salida | ${salidaGb.toFixed(2)} GB: 0 $ dentro de los 100 GB/mes gratuitos (si no, ${(salidaGb * PRECIOS.salidaGb).toFixed(3)} $) |
| **Total** | **≈ ${(costeLambda + costeS3).toFixed(3)} $** (estimado antes de lanzar: ${(estado.estimado ?? est.coste.total).toFixed(3)} $) |
| Limpieza | entradas privadas borradas; renders/<id>/ ${CONSERVAR ? "conservado" : "borrado"} |
`;
fs.appendFileSync(p.informe, seccion);
console.log(`\n✓ Listo: ${path.relative(RAIZ, destino)} · ${costeLambda.toFixed(3)} $ · ${fmtSeg(tRender)}. Informe: ${path.relative(RAIZ, p.informe)}\n`);
