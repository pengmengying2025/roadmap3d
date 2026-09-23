#!/usr/bin/env node
// layergraph CLI — validate | test | render | still | cover | strip | info
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSpec, stripJsonComments } from './validate.mjs';
import { openEngine, renderFrames, shot, ROOT } from './capture.mjs';
import { loadPreset as loadPresetRaw, listPresets } from './preset.mjs';

const args = process.argv.slice(2); const cmd = args.shift();
const opt = { lang: null, preset: null, fontDir: path.join(ROOT, 'fonts'), out: null, fps: null, crf: 18, t: null, dpr: 2, keepFrames: false, noGif: false, ffmpeg: process.env.FFMPEG || null, strip: 'path', order: 'as-is', width: 1500, times: null, noVideo: false };
const pos = [];
for (let i = 0; i < args.length; i++) { const a = args[i]; const next = () => args[++i];
  if (a === '--lang') opt.lang = next(); else if (a === '--preset') opt.preset = next(); else if (a === '--font-dir') opt.fontDir = path.resolve(next()); else if (a === '-o' || a === '--out') opt.out = next();
  else if (a === '--fps') opt.fps = +next(); else if (a === '--crf') opt.crf = +next(); else if (a === '--t') opt.t = +next(); else if (a === '--dpr') opt.dpr = +next(); else if (a === '--keep-frames') opt.keepFrames = true; else if (a === '--no-gif') opt.noGif = true;
  else if (a === '--ffmpeg') opt.ffmpeg = next(); else if (a === '--second') opt.strip = 'second'; else if (a === '--reverse') opt.order = 'reverse'; else if (a === '--width') opt.width = +next(); else if (a === '--times') opt.times = next().split(',').map(Number); else if (a === '--no-video') opt.noVideo = true;
  else if (a.startsWith('-')) die(`unknown option ${a}`); else pos.push(a); }
function die(m, code = 1) { console.error('✗ ' + m); process.exit(code); }
const HELP = `layergraph <command> <spec.json> [options]
  validate  spec.json                       check structure, references, timing, text coverage (exit 1 on errors)
  info      spec.json                       resolved timeline: lanes, camera keyframes, lit times (needs a browser)
  test      spec.json -o out/ [--times a,b] key frames (captions, camera, lit) + far/near frames → out/test_*.png, out/timeline.json
  render    spec.json -o out/ [--fps 30 --crf 18 --keep-frames --no-video --no-gif]  → out/video.mp4, preview.gif, cover.png (frame at first light-up), contact.png, timeline.json
  still     spec.json -o out/ --t 10.6 [--dpr 2]   one frame without overlays (hi-res)
  cover     spec.json -o out/ --t 10.6            cover-style frame: everything dimmed except the path
  strip     spec.json -o out/ [--second --reverse --width 1500]  2D strip of the highlighted path → out/strip.png
options: --lang zh|en   --preset ${listPresets().join('|')}|file.json (default ivory-gold)   --font-dir DIR (default ./fonts)   --ffmpeg PATH (or $FFMPEG)`;
if (!cmd || cmd === '-h' || cmd === '--help') { console.log(HELP); process.exit(0); }
const specPath = pos[0]; if (!specPath) die('spec.json required\n' + HELP);
export function loadSpec(p) { const raw = fs.readFileSync(p, 'utf8'); try { return JSON.parse(stripJsonComments(raw)); } catch (e) { die(`${p}: not valid JSON (${e.message})`); } }
function loadPreset(nameOrObj, override) { try { return loadPresetRaw(nameOrObj, override); } catch (e) { die(e.message); } }
function findFfmpeg() { if (opt.ffmpeg) return opt.ffmpeg; const w = spawnSync('which', ['ffmpeg']); if (w.status === 0) return w.stdout.toString().trim();
  const py = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']); if (py.status === 0) return py.stdout.toString().trim(); return null; }
const spec = loadSpec(specPath); const lang = opt.lang || (spec.meta && spec.meta.lang) || 'en';
const v = validateSpec(spec, { lang }); v.warnings.forEach(w => console.log('  ⚠ ' + w)); v.errors.forEach(e => console.log('  ✗ ' + e));
if (v.errors.length) die(`${v.errors.length} error(s) in ${specPath}`);
if (cmd === 'validate') { console.log(`✓ ${specPath} valid (${spec.nodes.length} nodes, ${(spec.edges || []).length} edges, ${v.warnings.length} warning(s))`); process.exit(0); }
const preset = loadPreset(spec.meta && spec.meta.preset, opt.preset);
const out = opt.out ? path.resolve(opt.out) : path.join(path.dirname(path.resolve(specPath)), 'out'); fs.mkdirSync(out, { recursive: true });
if (!fs.existsSync(opt.fontDir) || !fs.readdirSync(opt.fontDir).some(f => /\.(ttf|otf)$/i.test(f))) console.log(`  ⚠ no fonts in ${opt.fontDir}; system fonts only (run scripts/get_fonts.sh for Source Serif 4 + Noto Serif SC)`);
const T = spec.meta && spec.meta.duration || 21; const fps = opt.fps || (spec.meta && spec.meta.fps) || 30;
const fmt = t => String(+t.toFixed(2)).replace('.', '_');
(async () => {
  if (cmd === 'strip') { const eng = await openEngine({ spec, preset, lang, fontDir: opt.fontDir, dpr: opt.dpr, page: 'strip.html' }); await eng.page.evaluate(() => 0);
    const p = await eng.browser.newPage({ viewport: { width: opt.width, height: 190 }, deviceScaleFactor: opt.dpr }); await p.addInitScript(cfg => { window.__LG = cfg; }, { spec, preset, lang, fonts: eng.page.__fonts, strip: opt.strip, stripOrder: opt.order, stripWidth: opt.width });
    await eng.page.close(); await p.goto(`${eng.server.url}/src/strip.html`); await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 }); await p.waitForTimeout(200);
    const f = path.join(out, `strip${opt.strip === 'second' ? '-second' : ''}.png`); await p.screenshot({ path: f }); await eng.close(); console.log('✓ ' + f); return; }
  const eng = await openEngine({ spec, preset, lang, fontDir: opt.fontDir, dpr: (cmd === 'still' || cmd === 'cover') ? opt.dpr : 1 });
  const info = eng.info; if (info && info.fontsOk === false) console.log('  ⚠ fonts did not load; labels use fallback fonts'); if (eng.errors.length) console.log('  ⚠ page errors: ' + eng.errors.join(' | '));
  fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(info, null, 1));
  if (cmd === 'info') { console.log(JSON.stringify(info, null, 1)); await eng.close(); return; }
  if (cmd === 'test') { const set = new Set([0.5, T - 0.2]); (spec.captions || []).forEach(c => set.add(c.a + 0.4)); (info.camera || []).forEach(k => set.add(Math.min(T - 0.05, k.t + 0.2))); (info.lit.path || []).forEach(t => set.add(t + 0.3)); if (info.lit.release != null) set.add(info.lit.release + 0.5); (info.lit.second || []).forEach(t => set.add(t + 0.2));
    const times = (opt.times || [...set]).filter(t => t >= 0 && t <= T).sort((a, b) => a - b).map(t => +t.toFixed(2));
    for (const t of times) await shot(eng.page, t, path.join(out, `test_${fmt(t)}.png`)); console.log(`✓ ${times.length} key frames → ${out}  (t = ${times.join(', ')})  · timeline.json`); await eng.close(); return; }
  if (cmd === 'still' || cmd === 'cover') { const t = opt.t ?? (cmd === 'cover' ? (info.cover_t || T / 2) : (info.lit.path && info.lit.path.length ? info.lit.path[info.lit.path.length - 1] + 1.5 : T / 2)); const f = path.join(out, `${cmd}_${fmt(t)}.png`); await shot(eng.page, t, f, { hide: true, cover: cmd === 'cover' }); console.log('✓ ' + f); await eng.close(); return; }
  if (cmd === 'render') { const frames = path.join(out, 'frames'); const t0 = Date.now();
    const n = await renderFrames(eng.page, frames, fps, (i, n, s) => console.log(`  frame ${i}/${n}  ${s.toFixed(0)} s`)); await eng.close(); console.log(`  ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    const ci = Math.min(n - 1, Math.max(0, Math.round((info.cover_t || 0) * fps))); fs.copyFileSync(path.join(frames, `f_${String(ci).padStart(4, '0')}.png`), path.join(out, 'cover.png'));   // cover = the moment the first path node lights up
    if (opt.noVideo) { console.log(`✓ frames → ${frames}`); return; }
    const ff = findFfmpeg(); if (!ff) { console.log(`  ⚠ ffmpeg not found (set $FFMPEG, put ffmpeg on PATH, or pip install imageio-ffmpeg). Frames kept in ${frames}`); return; }
    const video = path.join(out, 'video.mp4'); let r = spawnSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f_%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(opt.crf), '-movflags', '+faststart', video]); if (r.status !== 0) die('ffmpeg failed: ' + r.stderr);
    const step = Math.max(1, Math.floor(n / 12)); r = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', path.join(frames, 'f_%04d.png'), '-vf', `select='not(mod(n\\,${step}))',scale=480:-1,tile=4x3`, '-frames:v', '1', path.join(out, 'contact.png')]); if (r.status !== 0) console.log('  ⚠ contact sheet failed: ' + r.stderr);
    let gifNote = '';
    if (!opt.noGif) { const pal = path.join(out, 'palette.png'); const gif = path.join(out, 'preview.gif');
      r = spawnSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f_%04d.png'), '-vf', 'fps=10,scale=480:-1:flags=lanczos,palettegen=max_colors=128', pal]);
      if (r.status === 0) r = spawnSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f_%04d.png'), '-i', pal, '-lavfi', 'fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3', gif]);
      if (r.status === 0) gifNote = ` · preview.gif (${(fs.statSync(gif).size / 1e6).toFixed(1)} MB)`; else console.log('  ⚠ preview.gif failed: ' + r.stderr); fs.rmSync(pal, { force: true }); }
    if (!opt.keepFrames) fs.rmSync(frames, { recursive: true, force: true });
    console.log(`✓ ${video} (${(fs.statSync(video).size / 1e6).toFixed(1)} MB, ${n} frames @ ${fps} fps)${gifNote} · cover.png · contact.png · timeline.json`); return; }
  await eng.close(); die('unknown command ' + cmd + '\n' + HELP);
})().catch(e => { console.error('✗ ' + (e.stack || e.message)); process.exit(1); });
