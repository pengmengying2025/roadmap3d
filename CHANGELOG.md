# Changelog

## 1.0.0 — 2026-09-24

First stable release. What is fixed from here on (breaking changes will bump the major version):

- **Spec**: `schema/layergraph.schema.json` — layers × groups × optional depth; major / minor / leaf nodes; `dep` / `link` edges; `highlight` with an optional second path; `camera` as `"auto"` or keyframes with semantic targets; timeline captions; brand, legend and tail overlays; bilingual text fields.
- **CLI**: `validate`, `info`, `test`, `render` (MP4 + GIF preview + cover + contact sheet + timeline), `still`, `cover`, `strip`; options `--lang`, `--preset`, `--font-dir`, `--ffmpeg`.
- **Presets**: `ivory-gold` (default), `ivory-indigo`, `slate-gold`, `midnight`, `obsidian-gold`; key structure documented in docs/visual.md, `"base"` inheritance.
- **Look**: serif type stack at small sizes; lit elements unlit (on-screen colour = preset colour); normal-blended halos on light grounds, additive on dark; lit nodes grow 1.15×.
- **Examples**: supply-chain, critical-path, deps — synthetic, English by default.

Changes since 0.6.0:
- Full-length example MP4s are published as assets of GitHub Release v1.0.0 instead of being committed; README links to them. GIF previews, covers and contact sheets stay in the repository.
- `scripts/scan_words.sh` no longer embeds private names: it reads them from a git-ignored `scripts/scan_private.local` (or `$LAYERGRAPH_SCAN_PRIVATE`), and it now also scans `render/*.json` and `fonts/README.md`.
- `.gitignore`: all of `fonts/` except its README, example MP4s, local scan lists.
- README: one-line positioning and a Showcase placeholder at the top.

## 0.6.0 — 2026-09-23

- Engine: everything that lights up — the lit-node fill, path tubes, spark, halos and outline — uses unlit materials and ignores the fog, so the colour on screen equals the preset colour (a #E0B455 fill used to render ~#957736 under the scene lights). Ordinary nodes keep lighting and fog. Applies to all five presets; the dark ones keep their additive halo.
- New preset keys for light grounds: `lit.halos` (layered normal-blended halos: `{color, radius × node, soft}`), `lit.tube_glow` (a camera-facing soft band along each lit edge: `{color, width × tube}`), `lit.ring_style: "line"` (a true 1 px outline at any zoom). Colours may be written as `rgba(r,g,b,a)`.
- `ivory-gold`: path #E3B94A with a soft band rgba(214,164,60,0.22); lit nodes #EBC25B with a 1 px #C99A2E outline and two halos — rgba(232,196,98,0.45) at 1.6 × and rgba(214,164,60,0.18) at 2.6 × the node radius; spark #FFF1B8, smaller; caption accent still #92701A. `ivory-indigo`: the same construction on an indigo scale.
- docs/visual.md: new section on why a light ground cannot use additive glow (it clips to white) and uses halos instead.
- Examples, cover frames, GIFs and comparison images re-rendered.

## 0.5.0 — 2026-09-23

- `ivory-gold` path one step lighter: path, halo and outline #C99A2E → #D4A93E, lit-node fill #D9A441 → #E0B455, spark #E8C462 → #EFD27A; gold label and tail borders follow the path colour. The caption accent stays #92701A (4.5:1 on the white card; the path gold is 2.2:1 and is never used for text).
- `paper` preset removed — it duplicated `ivory-indigo`. Five presets remain: `ivory-gold` (default), `ivory-indigo`, `slate-gold`, `midnight`, `obsidian-gold`. Specs that named `paper` should switch to `ivory-indigo`.
- `examples/deps` uses explicit camera keyframes: the push-in stays at 0.5 R0 and always aims between two path nodes, so no module slides under the brand line or the legend.
- Examples, cover frames, GIFs and the preset comparison images re-rendered.

## 0.4.0 — 2026-09-23

- New default preset `ivory-gold` (light): ivory ground #F5F3EE → #ECE9E2 without vignette, white 40 % layer panels with a #D9D4C8 outline, grey-green nodes #8C9A92, edges #B8B3A8 at 0.45, deep-gold path #C99A2E with a small warm halo and a bright-gold spark (#E8C462), lit nodes filled #D9A441 with a 1 px deep-gold outline, charcoal labels on white cards. `ivory-indigo` = the same with an indigo path, defined through `"base"`. The three dark presets and `paper` stay. Caption accent on `ivory-gold` is #92701A rather than the path gold so 22 px text passes WCAG AA (4.5:1); every other text role was checked ≥ 4.5:1.
- All presets: lit nodes now grow 1.15× (was ~3×), halos shrink with them, path tubes are 30 % thinner, sparks smaller. Ordinary nodes unchanged. Lit-label clearance follows the new node radius.
- Layer and axis titles fade out as they reach the frame edge instead of being cut in half.
- `examples/critical-path` uses explicit camera keyframes (push-in at 0.5 R0 aimed between the first two nodes) so the top layer titles stay in frame; `supply-chain` and `deps` render on `ivory-gold`, `critical-path` on `ivory-indigo`.
- Preset loading moved to `src/preset.mjs` (`loadPreset`, `listPresets`, `DEFAULT_PRESET`); new keys `lit.ring_width`, `lit.spark_color`.

## 0.3.0 — 2026-09-23

- New default preset `slate-gold`: slate ground (#1F2532 → #2B3345, half the vignette), cool-grey nodes, gold path (#E8B84A) with a softer glow and a thin gold outline ring around lit nodes, ivory labels on translucent slate boxes with small corners. `midnight` stays as an option; `paper` highlight is now indigo #4F46E5 (coral is the one-key swap); `obsidian-gold` unchanged.
- Typography: one serif stack (`"Times New Roman", "Source Serif 4", Georgia, serif`; `Noto Serif SC` for CJK), 20–25 % smaller — node labels 14 px, path labels 20 px, captions 22 / 15 px, legend and axis labels 12 px at 1080p; regular weight, semibold titles, slightly tight tracking. All 3D labels now keep a constant on-screen size. `scripts/get_fonts.sh` fetches Source Serif 4 + Noto Serif SC. Spec: `meta.fonts.family / cjk / scale / sizes` replace `sans / serif`.
- Preset keys added: `lit.ring / ring_scale / ring_opacity`, `lit.spark_opacity`, `hud.radius`, `hud.caption_em`; `label.radius` and borders are now in on-screen px.
- `strip` respects the gradient background object; font scanner understands `[opsz,wght]` and italic files.
- Examples re-rendered (supply-chain on `slate-gold`); docs/visual.md covers four presets and the type rules; preset structure test added.

## 0.2.0 — 2026-09-23

- Presets redone: `midnight` (default), `obsidian-gold`, `paper`; the previous two presets are gone. Background is now a radial gradient with a vignette (DOM layers under a transparent canvas); layer panels are gradient-faded with a thin outline; depth fog is tighter (far nodes fade); a spark runs along each edge as the path lights up; label boxes have rounded corners and a soft shadow; leaf nodes are smaller.
- `render` picks the cover frame at the moment the first path node lights up (`cover` command default too).
- Examples render in English by default (Chinese kept as optional localisation); each example uses a different preset.
- Validator: length warnings scale for Latin text.
- docs/visual.md rewritten around the three presets and the four rules.

## 0.1.0 — 2026-09-23

First release, extracted from an internal presentation pipeline and generalised.

- Engine (`src/engine.html`): layered layout from spec (layers × groups × optional depth; major / minor / leaf nodes), edges by kind (`dep`, `link`, automatic parent spokes), highlight path with halo + growing tubes + placed labels, optional second path, camera keyframes with semantic targets or `auto`, timeline captions, brand / legend / tail overlays, screen-space label avoidance with LOD, cover mode.
- Presets: `dark`, `light` (all colours and glow parameters in JSON; inline overrides with `base`).
- CLI: `validate`, `info`, `test`, `render` (MP4 + GIF preview + cover + contact sheet), `still`, `cover`, `strip`; JSONC specs; fonts scanned from a directory; ffmpeg discovered from `$FFMPEG` / PATH / imageio-ffmpeg.
- Spec validator + JSON Schema (draft-07).
- Examples (synthetic): supply-chain provenance, project critical path, module dependency build order — each with rendered video, GIF, cover and contact sheet.
- Docs: README (en / zh-CN), SKILL.md (Agent Skills), prompts (en / zh), visual guide, licence table.
- Tests: spec validation (`node --test`), render smoke test.
