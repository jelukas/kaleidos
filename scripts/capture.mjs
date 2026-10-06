#!/usr/bin/env node
// Capturas de pantalla reales de webs y tweets con Chrome headless.
//
//   node scripts/capture.mjs <slug> [--only id1,id2] [--force]
//
// Entrada : proyectos/<slug>/captures.json
//   [{ "id": "openai-blog", "url": "https://…", "width": 1440, "height": 900,
//      "fullPage": false, "scrollY": 0, "maxHeight": 3200, "dark": true },
//    { "id": "tweet-sam", "tweet": "1234567890", "dark": true }]
// Salida  : proyectos/<slug>/assets/captures/<id>.png
//
// Los banners de cookies no se aceptan: se eliminan del DOM antes de capturar.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const slug = args[0];
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const force = args.includes("--force");
if (!slug) throw new Error("Uso: node scripts/capture.mjs <slug>");

const videoDir = join(ROOT, "proyectos", slug);
const specs = JSON.parse(readFileSync(join(videoDir, "captures.json"), "utf8"));
const outDir = join(videoDir, "assets", "captures");
mkdirSync(outDir, { recursive: true });

const chromeDir = join(homedir(), ".cache/puppeteer/chrome");
const { readdirSync } = await import("node:fs");
const ver = readdirSync(chromeDir).sort().pop();
const executablePath = join(
  chromeDir, ver, "chrome-mac-arm64",
  "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);

const KILL_OVERLAYS = `
  (() => {
    const sel = [
      '#onetrust-consent-sdk', '#onetrust-banner-sdk', '.onetrust-pc-dark-filter',
      '#CybotCookiebotDialog', '[id*="cookie" i]', '[class*="cookie" i]',
      '[id*="consent" i]', '[class*="consent" i]', '[aria-label*="cookie" i]',
      '#credential_picker_container', '[id*="axeptio" i]', '[class*="axeptio" i]', '.fc-consent-root', '#sp_message_container',
      '[class*="newsletter" i][class*="modal" i]', '[class*="paywall" i]'
    ];
    for (const s of sel) document.querySelectorAll(s).forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky' || el.getAttribute('role') === 'dialog' || s.startsWith('#')) el.remove();
    });
    document.querySelectorAll('body *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && parseInt(cs.zIndex || '0') > 999 && el.offsetHeight > 120) el.remove();
    });
    // Diálogos de consentimiento: se quitan del DOM (nunca se aceptan)
    document.querySelectorAll('button, a').forEach((btn) => {
      if (!/^(accept all|reject all|aceptar todo|rechazar todo|accept|decline)$/i.test((btn.innerText || '').trim())) return;
      let el = btn;
      for (let k = 0; k < 8 && el && el !== document.body; k++) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'sticky' || el.getAttribute('role') === 'dialog') { el.remove(); return; }
        el = el.parentElement;
      }
    });
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  })();
`;

const REAL = process.argv.includes("--real");
const browser = await puppeteer.launch({
  executablePath: REAL ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : executablePath,
  ignoreDefaultArgs: REAL ? ["--enable-automation"] : [],
  userDataDir: REAL ? join(ROOT, ".chrome-capture-profile") : undefined,
  headless: process.argv.includes("--headful") ? false : true,
  args: ["--no-sandbox", "--hide-scrollbars", "--lang=en-US,en", "--disable-blink-features=AutomationControlled"],
});

for (const spec of specs) {
  if (only && !only.includes(spec.id)) continue;
  const out = join(outDir, `${spec.id}.png`);
  const meta = { id: spec.id, url: spec.url ?? null, tweet: spec.tweet ?? null };
  if (!force && existsSync(out)) { console.log(`= ${spec.id} (cache)`); continue; }
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  );
  if (spec.dark) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  try {
    if (spec.tweet) {
      await page.setViewport({ width: 620, height: 1200, deviceScaleFactor: 2 });
      const theme = spec.dark === false ? "light" : "dark";
      await page.goto(
        `https://platform.twitter.com/embed/Tweet.html?id=${spec.tweet}&theme=${theme}&dnt=true&hideThread=true&lang=es`,
        { waitUntil: "networkidle2", timeout: 60000 },
      );
      await new Promise((r) => setTimeout(r, spec.wait ?? 3500));
      const el = await page.$("article") || await page.$("#app > div");
      if (!el) throw new Error("no se encontró el tweet");
      const bb = await el.boundingBox();
      await el.screenshot({ path: out, omitBackground: true });
      meta.width = Math.round(bb.width); meta.height = Math.round(bb.height);
    } else {
      const w = spec.width ?? 1440, h = spec.height ?? 900;
      await page.setViewport({ width: w, height: h, deviceScaleFactor: spec.scale ?? 2 });
      await page.goto(spec.url, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => {
        console.warn(`  ! ${spec.id}: ${e.message} (sigo con lo cargado)`);
      });
      await new Promise((r) => setTimeout(r, spec.wait ?? 3000));
      await page.evaluate(KILL_OVERLAYS);
      if (spec.css) await page.addStyleTag({ content: spec.css });
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 9000));
      writeFileSync(out.replace(/\.png$/, ".txt"), txt);
      if (spec.scrollY) {
        await page.evaluate((y) => window.scrollTo(0, y), spec.scrollY);
        await new Promise((r) => setTimeout(r, 1200));
      }
      await page.evaluate(KILL_OVERLAYS);
      // Localiza frases clave: rectángulo en px CSS relativos al documento (o al viewport tras scroll)
      const findRects = async () => { if (spec.find?.length) {
        meta.rects = await page.evaluate((snips, fullPage) => {
          const out = {};
          const all = [...document.querySelectorAll("body *")];
          for (const snip of snips) {
            const parts = snip.toLowerCase().split("&&");
            let best = null;
            for (const el of all) {
              const t = (el.innerText || "").toLowerCase();
              if (!parts.every((p) => t.includes(p))) continue;
              const r = el.getBoundingClientRect();
              if (r.width < 4 || r.height < 4) continue;
              if (!best || r.width * r.height < best.area) best = { el, area: r.width * r.height, r };
            }
            if (best) {
              const r = best.r;
              const oy = fullPage ? window.scrollY : 0;
              out[snip] = { x: r.left, y: r.top + oy, w: r.width, h: r.height };
            }
          }
          return out;
        }, spec.find, !!spec.fullPage);
      } };
      if (spec.fullPage) {
        const full = await page.evaluate(() => document.documentElement.scrollHeight);
        const maxH = Math.min(full, spec.maxHeight ?? 3600);
        // Fuerza la carga perezosa bajando y volviendo arriba
        for (let y = 0; y < maxH; y += 600) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await new Promise((r) => setTimeout(r, 250));
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 1500));
        await page.evaluate(KILL_OVERLAYS);
        await page.addStyleTag({ content: '[id*="axeptio" i],[class*="axeptio" i],#onetrust-consent-sdk{display:none!important}' });
        await findRects();
        await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: maxH }, captureBeyondViewport: true });
        meta.width = w; meta.height = maxH;
      } else {
        await findRects();
        await page.screenshot({ path: out });
        meta.width = w; meta.height = h;
      }
    }
    writeFileSync(out.replace(/\.png$/, ".json"), JSON.stringify(meta, null, 2));
    console.log(`✓ ${spec.id} ${meta.width}x${meta.height} ${meta.rects ? Object.keys(meta.rects).length + " rects" : ""}`);
  } catch (e) {
    console.error(`✗ ${spec.id}: ${e.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
