#!/usr/bin/env node
// Captura una página HTML con Chrome headless y la guarda como JPG de 960 px de ancho (referencias/).
//
//   NODE_PATH=~/videos-opus/node_modules node estilos/_esquema/captura.mjs <pagina.html> <salida.jpg> [ancho alto]
//
// ancho×alto es el lienzo CSS (por defecto 1920×1080; 1080×1920 para vertical). La captura se hace a tamaño
// real y ffmpeg la reduce a 960 px con lanczos. puppeteer-core se busca en NODE_PATH y, si no, en
// ~/videos-opus/node_modules. Chrome: $CHROME_PATH o el chrome-headless-shell más reciente de ~/.cache/puppeteer.
// Espera a document.fonts.ready y a window.__listo (si la página lo define). Tiempo límite: 90 s.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function capturar(html, salida, ancho = 1920, alto = 1080) {
  const req = createRequire(import.meta.url);
  let puppeteer;
  for (const base of [...(process.env.NODE_PATH || "").split(":").filter(Boolean), join(homedir(), "videos-opus/node_modules")]) {
    try { puppeteer = req(join(base, "puppeteer-core")); break; } catch {}
  }
  if (!puppeteer) throw new Error("No encuentro puppeteer-core (usa NODE_PATH=~/videos-opus/node_modules)");
  let exe = process.env.CHROME_PATH;
  if (!exe) {
    const raiz = join(homedir(), ".cache/puppeteer/chrome-headless-shell");
    const vers = existsSync(raiz) ? readdirSync(raiz).sort() : [];
    for (const v of vers.reverse()) {
      const c = join(raiz, v, "chrome-headless-shell-mac-arm64/chrome-headless-shell");
      if (existsSync(c)) { exe = c; break; }
    }
  }
  if (!exe) throw new Error("No encuentro Chrome (define CHROME_PATH)");
  const tmp = mkdtempSync(join(tmpdir(), "captura-"));
  const png = join(tmp, "c.png");
  const navegador = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--allow-file-access-from-files", "--font-render-hinting=none"], timeout: 60_000 });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
    await pagina.goto(pathToFileURL(resolve(html)).href, { waitUntil: "load", timeout: 60_000 });
    await pagina.evaluate(async () => { await document.fonts.ready; });
    await pagina.waitForFunction(() => window.__listo !== false, { timeout: 30_000 });
    const faltan = await pagina.evaluate(() => [...document.fonts].filter((f) => f.status === "error").map((f) => `${f.family} ${f.weight}`));
    if (faltan.length) console.error(`aviso: fuentes que no cargaron: ${faltan.join(", ")}`);
    await pagina.screenshot({ path: png, clip: { x: 0, y: 0, width: ancho, height: alto } });
  } finally {
    await navegador.close();
  }
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", png, "-vf", "scale=960:-2:flags=lanczos", "-q:v", "2", salida], { timeout: 60_000 });
  rmSync(tmp, { recursive: true, force: true });
  return salida;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [html, salida, ancho, alto] = process.argv.slice(2);
  if (!html || !salida) { console.error("uso: captura.mjs <pagina.html> <salida.jpg> [ancho alto]"); process.exit(2); }
  const reloj = setTimeout(() => { console.error("tiempo límite (90 s)"); process.exit(1); }, 90_000);
  capturar(html, salida, Number(ancho) || 1920, Number(alto) || 1080)
    .then((s) => { clearTimeout(reloj); console.log(`✓ ${s}`); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
