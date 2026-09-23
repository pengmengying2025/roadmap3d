import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSpec, stripJsonComments, resolveText } from '../src/validate.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = p => JSON.parse(stripJsonComments(fs.readFileSync(p, 'utf8')));

test('the three example specs validate without errors', () => {
  for (const e of ['supply-chain', 'critical-path', 'deps']) {
    const v = validateSpec(load(path.join(ROOT, 'examples', e, 'layergraph.json')), { lang: 'zh' });
    assert.deepEqual(v.errors, [], e + ': ' + v.errors.join('; '));
  }
});
test('stripJsonComments removes // and /* */ but keeps them inside strings; trailing commas tolerated', () => {
  const s = '{ // c\n "a": "http://x/y", /* b */ "b": [1, 2,], "c": "/* not */", }';
  assert.deepEqual(JSON.parse(stripJsonComments(s)), { a: 'http://x/y', b: [1, 2], c: '/* not */' });
});
test('resolveText falls back across languages', () => {
  assert.equal(resolveText({ zh: '甲', en: 'A' }, 'en'), 'A');
  assert.equal(resolveText({ zh: '甲' }, 'en'), '甲');
  assert.equal(resolveText('plain', 'zh'), 'plain');
});
test('broken spec: missing layer, bad path id, non-monotonic lit_at, caption beyond duration, minor without parent', () => {
  const v = validateSpec({ meta: { duration: 10 }, layers: [{ id: 'L1', label: 'L1' }], groups: [{ id: 'g', label: 'g' }],
    nodes: [{ id: 'a', label: 'a', layer: 'L1', group: 'g' }, { id: 'b', label: 'b', layer: 'NOPE', group: 'g' }, { id: 'k', label: 'k', layer: 'L1', kind: 'minor' }],
    edges: [{ from: 'a', to: 'zzz' }], highlight: { path: ['a', 'ghost'], lit_at: [3, 2] }, captions: [{ a: 9, b: 12, main: 'x' }] }, { lang: 'en' });
  const all = v.errors.join('\n');
  for (const needle of ['layer "NOPE"', 'to "zzz"', '"ghost" not found', 'lit_at must increase', 'ends after duration', 'minor nodes need a parent']) assert.match(all, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), needle);
});
test('language coverage produces a warning, not an error', () => {
  const v = validateSpec({ layers: [{ id: 'L', label: { zh: '层' } }], nodes: [{ id: 'a', label: { zh: '甲' }, layer: 'L' }] }, { lang: 'en' });
  assert.deepEqual(v.errors, []); assert.ok(v.warnings.some(w => w.includes('no "en" text')));
});
