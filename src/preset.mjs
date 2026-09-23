// Preset loading: presets/<name>.json, a file path, or an inline object; "base" inherits another preset (deep merge).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_PRESET = 'ivory-gold';
export function listPresets() { return fs.readdirSync(path.join(ROOT, 'presets')).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')).sort(); }
export function deepMerge(a, b) { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? deepMerge(a[k], b[k]) : b[k]; return o; }
export function loadPreset(nameOrObj, override, depth = 0) {
  const pick = override || nameOrObj || DEFAULT_PRESET; let base;
  if (depth > 8) throw new Error('preset "base" chain too deep (cycle?)');
  if (typeof pick === 'object') base = pick;
  else if (fs.existsSync(pick)) base = JSON.parse(fs.readFileSync(pick, 'utf8'));
  else { const f = path.join(ROOT, 'presets', pick + '.json'); if (!fs.existsSync(f)) throw new Error(`preset "${pick}" not found (presets/: ${listPresets().join(', ')})`); base = JSON.parse(fs.readFileSync(f, 'utf8')); }
  if (base.base) { const parent = loadPreset(base.base, null, depth + 1); const { base: _b, ...own } = base; return deepMerge(parent, own); }
  return base;
}
