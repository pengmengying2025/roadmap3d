// Spec validation: structure, references, timing, text coverage. Pure function, no browser.
// Returns {errors:[], warnings:[]}. Errors block rendering; warnings are printed.
const KINDS = new Set(['major', 'minor', 'leaf']); const EKINDS = new Set(['dep', 'link', 'member', 'leaf']);
export function resolveText(x, lang) { if (x == null) return ''; if (typeof x === 'string') return x; return x[lang] ?? x.en ?? x.zh ?? Object.values(x)[0] ?? ''; }
export function stripJsonComments(s) { let out = '', i = 0, inStr = false, q = '';
  while (i < s.length) { const c = s[i], d = s[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === q) inStr = false; i++; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++; }
  return out.replace(/,(\s*[}\]])/g, '$1'); }   // also tolerate trailing commas
export function validateSpec(spec, { lang = 'en' } = {}) {
  const E = [], Wn = []; const err = m => E.push(m), warn = m => Wn.push(m);
  const isText = x => typeof x === 'string' || (x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).every(v => typeof v === 'string'));
  const checkText = (x, where, max) => { if (x == null) return; if (!isText(x)) return err(`${where}: text must be a string or {zh:…, en:…}`);
    if (typeof x === 'object' && !(lang in x)) warn(`${where}: no "${lang}" text, will fall back to another language`); const s = resolveText(x, lang);
    const latin = (s.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length < s.length / 2; const lim = max && (latin ? Math.round(max * 1.9) : max);   // CJK glyphs are ~2× as wide as Latin letters
    if (lim && s.length > lim) warn(`${where}: ${s.length} chars, longer than ${lim} may not fit`); };
  if (!spec || typeof spec !== 'object') return { errors: ['spec is not an object'], warnings: [] };
  const M = spec.meta || {}; const T = M.duration ?? 21;
  if (M.size && !(Array.isArray(M.size) && M.size.length === 2 && M.size.every(v => Number.isInteger(v) && v > 0))) err('meta.size must be [width, height] positive integers');
  if (M.fps != null && !(M.fps > 0)) err('meta.fps must be > 0'); if (!(T > 0)) err('meta.duration must be > 0');
  if (M.preset != null && typeof M.preset !== 'string' && typeof M.preset !== 'object') err('meta.preset must be a preset name or an object');
  checkText(M.title, 'meta.title', 40); checkText(M.subtitle, 'meta.subtitle', 60);
  // axes
  const AX = spec.axes || {}; const AD = AX.depth || null; const levels = AD ? (AD.levels || []) : [];
  if (AD && !Array.isArray(levels)) err('axes.depth.levels must be an array');
  // layers / groups
  if (!Array.isArray(spec.layers) || !spec.layers.length) err('layers: non-empty array required');
  const layers = Array.isArray(spec.layers) ? spec.layers : []; const lIds = new Set();
  layers.forEach((l, i) => { if (!l.id) err(`layers[${i}]: id required`); if (lIds.has(l.id)) err(`layers: duplicate id "${l.id}"`); lIds.add(l.id); if (l.label == null) warn(`layers[${i}] "${l.id}": no label`); checkText(l.label, `layers[${i}].label`, 12); });
  const subCount = l => Array.isArray(l.sublayers) ? l.sublayers.length : (l.sublayers || 1);
  const groups = Array.isArray(spec.groups) ? spec.groups : []; const gIds = new Set();
  groups.forEach((g, i) => { if (!g.id) err(`groups[${i}]: id required`); if (gIds.has(g.id)) err(`groups: duplicate id "${g.id}"`); gIds.add(g.id); checkText(g.label, `groups[${i}].label`, 12); if (g.lane && !(Array.isArray(g.lane) && g.lane.length === 2 && g.lane[0] < g.lane[1])) err(`groups[${i}].lane must be [x0, x1] with x0 < x1`); });
  // nodes
  if (!Array.isArray(spec.nodes) || !spec.nodes.length) err('nodes: non-empty array required');
  const nodes = Array.isArray(spec.nodes) ? spec.nodes : []; const byId = {};
  nodes.forEach((n, i) => { if (!n.id) return err(`nodes[${i}]: id required`); if (byId[n.id]) err(`nodes: duplicate id "${n.id}"`); byId[n.id] = n; });
  nodes.forEach((n, i) => { const w = `nodes[${i}] "${n.id}"`; const kind = n.kind || 'major'; if (!KINDS.has(kind)) err(`${w}: kind must be major | minor | leaf`);
    if (!lIds.has(n.layer)) err(`${w}: layer "${n.layer}" not in layers`); else { const l = layers.find(l => l.id === n.layer); if ((n.sublayer || 0) >= subCount(l)) err(`${w}: sublayer ${n.sublayer} but layer has ${subCount(l)}`); }
    if (kind === 'major') { if (groups.length > 1 && !gIds.has(n.group)) err(`${w}: group "${n.group}" not in groups`); if (groups.length === 1 && n.group && !gIds.has(n.group)) err(`${w}: group "${n.group}" not in groups`); }
    if (kind === 'minor') { if (!n.parent) err(`${w}: minor nodes need a parent`); else if (!byId[n.parent]) err(`${w}: parent "${n.parent}" not found`); else if ((byId[n.parent].kind || 'major') !== 'major') err(`${w}: parent must be a major node`); }
    if (kind === 'leaf' && n.parent && !byId[n.parent]) err(`${w}: parent "${n.parent}" not found`);
    if (n.depth != null && levels.length && !(n.depth >= 1 && n.depth <= levels.length)) err(`${w}: depth ${n.depth} outside 1..${levels.length}`);
    if (n.depth != null && !AD) warn(`${w}: has depth but axes.depth is not defined (ignored)`);
    if (n.label == null) err(`${w}: label required`); checkText(n.label, `${w}.label`, kind === 'major' ? 16 : 24); checkText(n.short, `${w}.short`, 10); });
  // edges
  (spec.edges || []).forEach((e, i) => { const w = `edges[${i}]`; if (!byId[e.from]) err(`${w}: from "${e.from}" not found`); if (!byId[e.to]) err(`${w}: to "${e.to}" not found`); if (e.kind && !EKINDS.has(e.kind)) err(`${w}: kind must be dep | link | member | leaf`); if (e.from === e.to) warn(`${w}: self-loop`); });
  // highlight
  const HL = spec.highlight || {}; const checkPath = (Pp, name) => { if (!Pp) return; const ids = Pp.path || []; if (!Array.isArray(ids)) return err(`${name}.path must be an array`);
    ids.forEach(id => { if (!byId[id]) err(`${name}.path: "${id}" not found`); }); if (new Set(ids).size !== ids.length) warn(`${name}.path repeats a node`);
    if (Pp.lit_at) { if (Pp.lit_at.length !== ids.length) err(`${name}.lit_at must have one time per path node (${ids.length})`); for (let i = 1; i < Pp.lit_at.length; i++) if (!(Pp.lit_at[i] > Pp.lit_at[i - 1])) err(`${name}.lit_at must increase`); Pp.lit_at.forEach(t => { if (t < 0 || t > T) err(`${name}.lit_at ${t} outside 0..${T}`); }); }
    if (Pp.release_at != null) { if (Pp.release_at > T) err(`${name}.release_at beyond duration`); if (Pp.lit_at && Pp.release_at <= Pp.lit_at[Pp.lit_at.length - 1]) err(`${name}.release_at must be after the last lit_at`); }
    if (Pp.labels) Object.entries(Pp.labels).forEach(([id, t]) => { if (!byId[id]) warn(`${name}.labels: "${id}" is not a node`); checkText(t, `${name}.labels.${id}`, 22); }); };
  checkPath(HL, 'highlight'); checkPath(HL.second, 'highlight.second');
  // camera
  if (spec.camera != null && spec.camera !== 'auto') { if (!Array.isArray(spec.camera) || !spec.camera.length) err('camera must be "auto" or a non-empty array of keyframes'); else {
    const k0 = spec.camera[0]; ['az', 'el', 'r'].forEach(f => { if (k0[f] == null) err(`camera[0].${f} required`); }); if (k0.t !== 0) warn('camera[0].t should be 0');
    spec.camera.forEach((k, i) => { const w = `camera[${i}]`; if (typeof k.t !== 'number') err(`${w}.t required`); if (i && !(k.t > spec.camera[i - 1].t)) err(`${w}.t must increase`); if (k.t > T) err(`${w}.t beyond duration`);
      const tg = k.target; if (tg != null && tg !== 'center' && tg !== 'path' && tg !== 'second' && !Array.isArray(tg)) { if (typeof tg !== 'string') err(`${w}.target invalid`); else if (tg.startsWith('node:')) { if (!byId[tg.slice(5)]) err(`${w}.target ${tg}: node not found`); } else if (tg.startsWith('mid:')) { tg.slice(4).split(',').map(s => s.trim()).forEach(id => { if (!byId[id]) err(`${w}.target ${tg}: node "${id}" not found`); }); } else err(`${w}.target "${tg}": use center | path | second | node:ID | mid:A,B | [x,y,z]`); } });
    if (spec.camera[spec.camera.length - 1].t < T) warn(`camera: last keyframe at ${spec.camera[spec.camera.length - 1].t} s, camera holds still until ${T} s`); } }
  // captions
  const caps = spec.captions || []; caps.forEach((c, i) => { const w = `captions[${i}]`; if (!(typeof c.a === 'number' && typeof c.b === 'number' && c.a < c.b)) err(`${w}: need a < b`); if (c.b > T) err(`${w}: ends after duration`); if (c.main == null) err(`${w}: main required`);
    checkText(c.main, `${w}.main`, 40); checkText(c.sub, `${w}.sub`, 60); if (i && caps[i - 1].b > c.a + 1e-9) warn(`${w}: overlaps previous caption (only one shows at a time)`); });
  const OV = spec.overlays || {}; if (OV.tail) { if (typeof OV.tail.a !== 'number' || OV.tail.a > T) err('overlays.tail.a must be a time within duration'); checkText(OV.tail.text, 'overlays.tail.text', 30); }
  // cross-checks: lit times vs captions (a caption that names a node should start near its lit time is up to the author; here only sanity)
  const lit = HL.lit_at || []; if (lit.length && caps.length) { const last = lit[lit.length - 1]; if (caps.every(c => c.b < lit[0])) warn('all captions end before the first node lights up'); if (caps.length && caps[caps.length - 1].a > T - 0.5) warn('last caption starts in the final half second'); void last; }
  if ((HL.path || []).length > 8) warn('highlight.path has more than 8 nodes; the auto camera will move fast');
  if (nodes.length > 600) warn(`${nodes.length} nodes: rendering will be slow (about 1 s per frame beyond ~600)`);
  return { errors: E, warnings: Wn };
}
