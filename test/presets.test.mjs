// Preset files: all parse (with "base" inheritance resolved), share the key structure, and ivory-gold is the CLI default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPreset, listPresets, DEFAULT_PRESET } from '../src/preset.mjs';
const KEYS = ['bg', 'fog', 'floor', 'node', 'edge', 'lit', 'label', 'hud', 'light', 'cover'];
test('every preset resolves and carries the same top-level keys', () => {
  const names = listPresets();
  assert.deepEqual(names, ['ivory-gold', 'ivory-indigo', 'midnight', 'obsidian-gold', 'slate-gold']);
  for (const name of names) {
    const p = loadPreset(name);
    assert.equal(p.name, name);
    for (const k of KEYS) assert.ok(p[k] && typeof p[k] === 'object', `${name}.${k} missing`);
    for (const k of ['node', 'glow', 'tube']) assert.match(p.lit[k], /^#[0-9A-Fa-f]{6}$/, `${name}.lit.${k}`);
    assert.equal(p.node.tints.length, 6); assert.deepEqual(p.lit.grow, [0.6, 0.15], `${name}: lit nodes grow 1.15×`);
    if (p.lit.halos) { assert.ok(p.lit.halos.length >= 1); for (const h of p.lit.halos) { assert.match(h.color, /^(#[0-9A-Fa-f]{6}|rgba\(\d+,\d+,\d+,[\d.]+\))$/); assert.ok(h.radius > 1, `${name}: halo radius`); } assert.notEqual(p.lit.halo_blend, 'additive', `${name}: light presets must not use additive halos`); }
    else { assert.equal(p.lit.halo_scale.length, 3); assert.equal(p.lit.halo_blend, 'additive', `${name}: dark presets keep additive halos`); }
    assert.ok(p.lit.tube_radius <= 0.07, `${name}: tube radius`);
  }
});
test('default is ivory-gold; ivory-indigo inherits it; slate-gold keeps its ring', () => {
  assert.equal(DEFAULT_PRESET, 'ivory-gold');
  const ig = loadPreset(); assert.equal(ig.name, 'ivory-gold'); assert.equal(ig.lit.tube, '#E3B94A'); assert.equal(ig.lit.node, '#EBC25B'); assert.equal(ig.lit.ring, '#C99A2E'); assert.equal(ig.lit.ring_style, 'line'); assert.equal(ig.lit.spark_color, '#FFF1B8'); assert.equal(ig.hud.caption_em, '#92701A');
  assert.deepEqual(ig.lit.halos.map(h => [h.color, h.radius]), [['rgba(232,196,98,0.45)', 1.6], ['rgba(214,164,60,0.18)', 2.6]]); assert.equal(ig.lit.tube_glow.color, 'rgba(214,164,60,0.22)'); assert.equal(ig.bg.vignette, 0);
  const ii = loadPreset('ivory-indigo'); assert.equal(ii.lit.tube, '#4F46E5'); assert.equal(ii.lit.node, '#6366F1'); assert.equal(ii.lit.tube_glow.width, ig.lit.tube_glow.width, 'tube_glow width inherited'); assert.equal(ii.lit.halos.length, 2); assert.equal(ii.lit.ring_style, 'line'); assert.equal(ii.bg.center, ig.bg.center); assert.equal(ii.label.lit_fg, ig.label.lit_fg); assert.equal(ii.base, undefined);
  const sg = loadPreset('slate-gold'); assert.equal(sg.lit.ring, '#E8B84A'); assert.equal(sg.lit.halo_opacity, 0.5);
  const inline = loadPreset({ name: 'x', base: 'ivory-gold', lit: { tube: '#000000' } }); assert.equal(inline.lit.tube, '#000000'); assert.equal(inline.lit.node, '#EBC25B');
  assert.throws(() => loadPreset('no-such-preset'), /not found/);
});
