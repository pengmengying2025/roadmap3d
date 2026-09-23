// Render smoke test: two key frames of the deps example through the real engine (needs Playwright Chromium).
// Skip with ROADMAP3D_SKIP_SMOKE=1 (e.g. on machines without a browser).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('cli test renders key frames of examples/deps', { skip: process.env.ROADMAP3D_SKIP_SMOKE ? 'ROADMAP3D_SKIP_SMOKE set' : false }, () => {
  const out = path.join(ROOT, 'out', 'smoke'); fs.rmSync(out, { recursive: true, force: true });
  const r = spawnSync(process.execPath, [path.join(ROOT, 'src/cli.mjs'), 'test', path.join(ROOT, 'examples/deps/roadmap3d.json'), '-o', out, '--times', '0.5,9.9'], { encoding: 'utf8', timeout: 180000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const f of ['test_0_5.png', 'test_9_9.png', 'timeline.json']) { const p = path.join(out, f); assert.ok(fs.existsSync(p), f + ' missing'); }
  assert.ok(fs.statSync(path.join(out, 'test_9_9.png')).size > 50000, 'frame suspiciously small');
  const info = JSON.parse(fs.readFileSync(path.join(out, 'timeline.json'), 'utf8'));
  assert.equal(info.nodes, 26); assert.ok(info.camera.length >= 5); assert.ok(info.fontsOk !== false, 'fonts did not load');
});
