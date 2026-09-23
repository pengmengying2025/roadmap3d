// Headless Chromium driver: opens the engine with a spec, waits for READY, renders frames or stills.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// Font files in fontDir → [{family, weight, file}] (filename heuristic; meta.fonts.files overrides)
export function scanFonts(fontDir, meta = {}) {
  if (!fontDir || !fs.existsSync(fontDir)) return [];
  const files = fs.readdirSync(fontDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
  const map = (meta.fonts && meta.fonts.files) || {};
  return files.map(file => {
    if (map[file]) return { file, family: map[file].family, weight: map[file].weight || '400', style: map[file].style || 'normal' };
    const base = file.replace(/\.(ttf|otf|woff2?)$/i, '');
    const variable = /\[[^\]]*wght[^\]]*\]/.test(base);                       // NotoSerifSC[wght] or SourceSerif4[opsz,wght]
    const italic = /Italic/.test(base);
    const m = base.replace(/\[.*\]$/, '').replace(/-?Italic/, '').match(/^(.*?)(?:-(Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black))?$/);
    const family = m[1].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Za-z])(\d)/g, '$1 $2');   // SourceSerif4 → "Source Serif 4"
    const W = { Thin: '100', ExtraLight: '200', Light: '300', Regular: '400', Medium: '500', SemiBold: '600', Bold: '700', ExtraBold: '800', Black: '900' };
    return { file, family, weight: variable ? '100 900' : (W[m[2]] || '400'), style: italic ? 'italic' : 'normal' };
  });
}
export async function openEngine({ spec, preset, lang, fontDir, dpr = 1, page: pageName = 'engine.html' }) {
  const server = await startServer({ root: ROOT, fontDir });
  const browser = await chromium.launch({ args: GL_ARGS });
  const [W, H] = (spec.meta && spec.meta.size) || [1920, 1080];
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  const fonts = scanFonts(fontDir, spec.meta);
  await page.addInitScript(cfg => { window.__LG = cfg; }, { spec, preset, lang, fonts });
  await page.goto(`${server.url}/src/${pageName}`, { waitUntil: 'load' });
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 }); }
  catch (e) { throw new Error('engine never became READY (60 s). ' + (errors.join(' | ') || 'no page errors captured; a JS syntax error in the spec-derived code or a font that never loads is the usual cause')); }
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => window.__LG_INFO || null);
  return { page, browser, server, info, errors, close: async () => { await browser.close(); await server.close(); } };
}
export async function renderFrames(page, outdir, fps, onProgress) {
  fs.mkdirSync(outdir, { recursive: true });
  const T = await page.evaluate(() => window.T_END); const n = Math.round(T * fps); const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.renderFrame(t), i / fps);
    await page.screenshot({ path: path.join(outdir, `f_${String(i).padStart(4, '0')}.png`) });
    if (onProgress && i % 60 === 0) onProgress(i, n, (Date.now() - t0) / 1000);
  }
  return n;
}
export async function shot(page, t, file, { hide = false, cover = false } = {}) {
  await page.evaluate(([t, hide, cover]) => { if (hide) window.hideOverlays(); if (cover) window.coverMode(true); window.settle(t); }, [t, hide, cover]);
  await page.waitForTimeout(120);
  await page.screenshot({ path: file });
}
