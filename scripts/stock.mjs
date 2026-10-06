#!/usr/bin/env node
// Busca imágenes REALES (personas, hechos, actualidad) que gpt-image-2 no puede
// inventar, vía el actor de Apify hooli/google-images-scraper.
//
//   node scripts/stock.mjs <slug> [--force] [--max 6] [--budget 0.20] [--dry-run]
//
// Entrada : proyectos/<slug>/stock.json
// Salida  : proyectos/<slug>/assets/stock/<id>.jpg
//           proyectos/<slug>/assets/stock.manifest.json
//
// COSTE: Apify cobra ~1,90 $/1000 imágenes DEVUELTAS, no útiles. El filtrado por
// dominio de este script ocurre DESPUÉS de pagar, así que la única forma real de
// ahorrar es pedir menos y mejor: `maxResultsPerQuery` bajo y consultas acotadas
// con `sites` (operador site: de Google). En el primer vídeo se pagaron 210
// imágenes para acabar usando 3.
//
// El manifest guarda origen, título y URL de la página de cada imagen: son
// resultados de Google Images, casi siempre con derechos de terceros, así que
// hay que revisar la licencia antes de publicar. La atribución queda registrada.
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT, loadEnv, requireEnv, parseArgs, ensureDir, pool, readJson } from "./lib/config.mjs";

loadEnv();
const { flags, positional } = parseArgs();

const ACTOR = "hooli~google-images-scraper"; // el id lleva ~ en la ruta REST
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Granjas de contenido y redes sociales: devuelven placeholders de error
// ("This site does not have permission…") o tarjetas partidistas sin verificar.
// Comprobado en la práctica: 5 de 10 descargas fueron placeholders válidos como
// JPEG, por eso no basta con mirar el content-type.
const BLOCKED = [
  "findarticles.com", "billionhands.com", "facebook.com", "instagram.com",
  "pinterest.", "x.com", "twitter.com", "tiktok.com", "alamy.", "shutterstock.",
  "gettyimages.", "dreamstime.", "istockphoto.", "123rf.", "depositphotos.",
];

// Medios y fuentes con procedencia comprobable: se colocan primero.
const PREFERRED = [
  "wikipedia.org", "wikimedia.org", "rtve.es", "efe.com", "europapress.es",
  "elpais.com", "eldiario.es", "lavanguardia.com", "elmundo.es", "abc.es",
  "elfarodeceuta.es", "elperiodicodeceuta.es", "ceutaactualidad.com",
  "aljazeera.com", "reuters.com", "apnews.com", "bbc.co",
];

// Precio del actor, para poder avisar ANTES de gastar.
const USD_POR_IMAGEN = 0.0019;
const MAX_POR_CONSULTA = 6; // antes 12; se paga por resultado devuelto
const PRESUPUESTO_POR_DEFECTO = 0.25; // $ por ejecución

const matches = (origin, list) =>
  list.some((d) => String(origin || "").toLowerCase().includes(d));

/**
 * Acota la consulta a dominios concretos con el operador site: de Google.
 * Es la palanca que de verdad ahorra: en vez de pagar 20 resultados y tirar 17,
 * se piden 4 ya restringidos a medios con procedencia comprobable.
 */
function construirQuery(item, sitesPorDefecto) {
  const sites = item.sites ?? sitesPorDefecto;
  if (!sites || sites.length === 0) return item.query;
  return `${item.query} (${sites.map((s) => `site:${s}`).join(" OR ")})`;
}

/** Lanza el actor y espera el dataset (una sola llamada por lote de queries). */
async function search(queries, maxPerQuery, token) {
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries, maxResultsPerQuery: maxPerQuery }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Apify ${res.status} ${res.statusText} — ${detail.slice(0, 400)}`);
  }
  return res.json();
}

/** Descarga la primera candidata que responda con una imagen de verdad. */
async function download(candidates) {
  const errors = [];
  for (const c of candidates) {
    for (const url of [c.imageUrl, c.thumbnailUrl].filter(Boolean)) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
          redirect: "follow",
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
          errors.push(`${res.status} ${url.slice(0, 60)}`);
          continue;
        }
        const type = res.headers.get("content-type") || "";
        if (!type.startsWith("image/")) {
          errors.push(`content-type ${type} ${url.slice(0, 60)}`);
          continue;
        }
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length < 5000) {
          errors.push(`demasiado pequeña (${bytes.length}B)`);
          continue;
        }
        return { bytes, used: url, meta: c };
      } catch (err) {
        errors.push(`${err.name}: ${url.slice(0, 60)}`);
      }
    }
  }
  throw new Error(`ninguna candidata descargable — ${errors.slice(0, 4).join(" · ")}`);
}

async function main() {
  const slug = positional[0];
  if (!slug) throw new Error("Uso: node scripts/stock.mjs <slug> [--force]");
  const token = requireEnv("APIFY_API_KEY", "token de Apify");

  const videoDir = resolve(ROOT, "proyectos", slug);
  const specFile = join(videoDir, "stock.json");
  if (!existsSync(specFile)) throw new Error(`No existe ${specFile}`);

  const spec = readJson(specFile);
  const items = spec.items ?? [];
  if (items.length === 0) throw new Error("stock.json no tiene 'items'");

  const stockDir = ensureDir(join(videoDir, "assets", "stock"));
  const manifestFile = join(videoDir, "assets", "stock.manifest.json");
  const previous = existsSync(manifestFile) ? readJson(manifestFile) : { items: [] };
  const previousById = new Map(previous.items.map((i) => [i.id, i]));
  const force = Boolean(flags.force);

  // Consulta efectiva de cada item, ya acotada por dominio.
  const sitesPorDefecto = spec.sites ?? null;
  items.forEach((it) => {
    it._q = construirQuery(it, sitesPorDefecto);
  });

  // Qué hay que buscar de verdad (lo cacheado no se vuelve a pedir: Apify cobra
  // por imagen devuelta, ~1,90 $/1000).
  const pending = items.filter((it) => {
    const hash = createHash("sha256")
      .update(JSON.stringify([it._q, it.minWidth ?? 0, it.pick ?? 0]))
      .digest("hex")
      .slice(0, 16);
    it._hash = hash;
    const cached = previousById.get(it.id);
    const hit = !force && cached?.hash === hash && existsSync(join(stockDir, `${it.id}.jpg`));
    if (hit) process.stdout.write(`= ${it.id} (cache)\n`);
    return !hit;
  });

  let byQuery = new Map();
  let devueltas = 0;
  if (pending.length > 0) {
    const queries = [...new Set(pending.map((it) => it._q))];
    const maxPerQuery = Number(flags.max || spec.maxResultsPerQuery || MAX_POR_CONSULTA);
    const techo = queries.length * maxPerQuery;
    const coste = techo * USD_POR_IMAGEN;
    const presupuesto = Number(flags.budget ?? spec.budgetUsd ?? PRESUPUESTO_POR_DEFECTO);

    process.stdout.write(
      `→ Apify: ${queries.length} consulta(s) × ${maxPerQuery} = hasta ${techo} imágenes · máx. $${coste.toFixed(3)}\n`,
    );
    queries.forEach((q) => process.stdout.write(`   · ${q}\n`));

    // Freno de mano: se paga por resultado devuelto, así que una consulta de más
    // multiplicada por un maxResultsPerQuery alto se nota en la factura.
    if (coste > presupuesto) {
      throw new Error(
        `coste máximo $${coste.toFixed(3)} supera el presupuesto $${presupuesto.toFixed(2)}. ` +
          `Baja --max, reduce consultas o sube --budget.`,
      );
    }
    if (flags["dry-run"]) {
      process.stdout.write("\n(dry-run: no se ha llamado a Apify, no se ha gastado nada)\n");
      return;
    }

    const results = await search(queries, maxPerQuery, token);
    devueltas = results.length;
    for (const r of results) {
      if (!byQuery.has(r.query)) byQuery.set(r.query, []);
      byQuery.get(r.query).push(r);
    }
  }

  const results = await pool(items, Number(flags.concurrency || 2), async (it) => {
    const outFile = join(stockDir, `${it.id}.jpg`);
    const cached = previousById.get(it.id);
    if (!pending.includes(it)) return cached;

    const all = byQuery.get(it._q) ?? [];
    const minWidth = it.minWidth ?? 900;
    const blocked = [...BLOCKED, ...(it.blockOrigins ?? [])];
    const ranked = all
      // Fuera granjas de contenido y redes: son la principal fuente de basura.
      .filter((c) => !matches(c.origin, blocked) && !matches(c.contentUrl, blocked))
      .filter((c) => (c.imageWidth ?? 0) >= minWidth)
      // Primero procedencia comprobable; a igualdad, mayor resolución.
      .sort((a, b) => {
        const pa = matches(a.origin, it.preferOrigins ?? PREFERRED) ? 1 : 0;
        const pb = matches(b.origin, it.preferOrigins ?? PREFERRED) ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return (b.imageWidth ?? 0) * (b.imageHeight ?? 0) - (a.imageWidth ?? 0) * (a.imageHeight ?? 0);
      });
    const pool_ = ranked.slice(it.pick ?? 0);
    if (pool_.length === 0)
      throw new Error(`${it.id}: sin resultados válidos para "${it._q}" (${all.length} descartados por dominio o tamaño)`);

    const { bytes, used, meta } = await download(pool_);
    writeFileSync(outFile, bytes);
    process.stdout.write(
      `✓ ${it.id}  ${meta.imageWidth}x${meta.imageHeight}  ${(bytes.length / 1024).toFixed(0)} KB  ${meta.origin ?? ""}\n`,
    );
    return {
      id: it.id,
      query: it.query,
      queryEfectiva: it._q,
      file: `assets/stock/${it.id}.jpg`,
      hash: it._hash,
      // Atribución: imprescindible para revisar derechos antes de publicar.
      origin: meta.origin ?? null,
      title: meta.title ?? null,
      contentUrl: meta.contentUrl ?? null,
      imageUrl: used,
      width: meta.imageWidth ?? null,
      height: meta.imageHeight ?? null,
    };
  });

  writeFileSync(
    manifestFile,
    `${JSON.stringify({ slug, source: "apify/hooli~google-images-scraper", items: results.filter(Boolean) }, null, 2)}\n`,
  );
  const usadas = results.filter(Boolean).length;
  process.stdout.write(`\n→ ${manifestFile}\n  ${usadas} imágenes\n`);
  // Rendimiento real de la ejecución: se paga por devuelta, se usa una por item.
  if (devueltas > 0) {
    const gasto = devueltas * USD_POR_IMAGEN;
    process.stdout.write(
      `  Apify devolvió ${devueltas} imágenes ($${gasto.toFixed(3)}) para ${pending.length} plano(s) · ` +
        `aprovechamiento ${((pending.length / devueltas) * 100).toFixed(0)}%\n`,
    );
  }
  process.stdout.write("  ⚠ Resultados de Google Images: revisa licencia y atribución antes de publicar.\n");
}

main().catch((err) => {
  process.stderr.write(`\n✗ ${err.message}\n`);
  process.exit(1);
});
