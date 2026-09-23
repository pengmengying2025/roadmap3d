---
name: layergraph
description: Render a layered 3D graph animation (MP4 + GIF preview + cover PNG + 2D strip) from one JSON spec — layers, groups, an optional depth dimension, edges, a highlight path that lights up in sequence, camera keyframes, zh/en captions. Use when the user wants a "light up the path" graph video for a slide deck or explainer — supply-chain provenance, a project's critical path, a module build order, any tiered dependency or flow — or a still frame / 2D strip of such a graph. Headless (three.js in Chromium + ffmpeg), no GUI.
license: MIT
---

# layergraph — Agent Skill

## When to use
- The user has (or can describe) **nodes that belong to ordered layers** (tiers, phases, levels) and **edges** between them, and wants a short **video** in which one path lights up, or a **still / strip** of that graph.
- Typical asks: "show where this product's parts come from", "animate the critical path of the plan", "which modules get built before this one", "a 20-second clip for slide 4".

## Not for
- Force-directed or geographic layouts, interactive web graphs (use 3d-force-graph / sigma.js), graphs with more than ~600 nodes, audio (add narration in a video tool afterwards).

## What to get from the user (ask only for what is missing)
1. **Layers** (bottom → top) and **groups** (lanes). If they only have a flat list, propose the layering and confirm.
2. **Nodes** with layer/group; optional minor nodes (sub-items shown near a parent) and leaf nodes (attachments on a back plane).
3. **Edges**; direction `from → to` = "`to` depends on `from`" (earlier → later, supplier → customer).
4. **The highlight path**, in lighting order, plus one line per step for the caption; optionally a second path for the tail.
5. Language(s): zh, en or both; duration (default 21 s); preset (`ivory-gold` default; `ivory-indigo` when gold is the wrong signal; `slate-gold` / `midnight` / `obsidian-gold` for dark decks).
6. Any brand line / subtitle for the top-left.

## Workflow (in order; do not skip the look)
```bash
npm install && npx playwright install chromium        # once
scripts/get_fonts.sh                                  # once (Source Serif 4 + Noto Serif SC); or --font-dir <dir with fonts>
node src/cli.mjs validate <spec.json>                 # fix every ✗; read every ⚠
node src/cli.mjs test <spec.json> -o out/<name>       # key frames: far shot, each lit moment, each caption, last frame
#   → open the PNGs; check: path readable in the far shot? labels not overlapping? captions inside the frame? axis titles clear?
node src/cli.mjs render <spec.json> -o out/<name>     # video.mp4 + preview.gif + cover.png + contact.png + timeline.json (2–3 min for 20 s)
node src/cli.mjs strip  <spec.json> -o out/<name>     # optional 2D band of the path
```
- Long renders: run with `nohup … > render.log 2>&1 &` and poll the log; progress prints every 60 frames.
- `--lang zh` / `--lang en` renders the same spec in either language; deliver both if the user is bilingual.
- Deliverables: `video.mp4`, `preview.gif` (for READMEs and chat), `cover.png` (first frame, use it as the video poster), `contact.png` (12 tiles for a quick review), optionally `strip.png` and a `still`.

## Spec cheat-sheet
- Text = `"string"` or `{"zh": "…", "en": "…"}`. `*word*` in a caption is an accent.
- `layers[]` bottom→top, `groups[]` left→right, `axes.depth` optional (`levels[]`, `gap` negative = inward).
- `nodes[]`: `id, label, layer, group, depth?, kind (major|minor|leaf), parent?, order?, short?` — minor needs a major parent.
- `edges[]`: `from, to, kind (dep|link)`; parent spokes are automatic.
- `highlight`: `path[]`, `lit_at[]` (default 0.24T + 0.085T·i), `release_at` (default 0.63T), `labels{}`, `second{}` (default lit 0.686T + 0.043T·i).
- `camera`: `"auto"` or keyframes `{t, az, el, r, target}`; `target` = `center | path | second | node:ID | mid:A,B | [x,y,z]`; `r` may be `"0.35"` (fraction of the auto overview radius).
- `captions[]`: `{a, b, main, sub}`; one at a time; keep `main` ≤ 40 characters.
- `overlays`: `brand`, `legend` (`{kinds:{minor,leaf}}`), `tail {a, text}`.
- Timing rule of thumb for a 21 s clip: lights at ~5 / 6.5 / 8.6 s, release ~13.2 s, second path from ~14.4 s, captions start 0.2 s before each light-up and end before the next.

## Visual rules (short; full reasoning in docs/visual.md)
- Four rules behind every preset: quiet ground (ivory or dark), low-saturation nodes, one saturated path colour, low-alpha edges. Do not add a second accent colour.
- `ivory-gold` (default) / `ivory-indigo` on light grounds: the path is the only saturated element, lit nodes grow just 1.15× and carry a 1 px outline, glow comes from two normal-blended halos and a soft band along the path (never additive on a light ground: it clips to white). Lit elements are unlit, so the preset hex is what appears on screen. `slate-gold` / `midnight` / `obsidian-gold` for dark decks.
- Type is serif, small and regular-weight (node labels 14 px, path labels 20 px, captions 22 / 15 px at 1080p). Do not enlarge it to "make it readable" — shorten the text instead; `meta.fonts.scale` exists for other output sizes.
- Caption box: white card with charcoal text on the ivory presets, translucent dark box with light text on the dark ones; bottom-centre, ≤ 60 % width. `*word*` in a caption takes the accent colour (`hud.caption_em`; on `ivory-gold` a darker gold than the path so it passes WCAG AA).
- Cover = the frame where the first path node lights up (`render` picks it automatically).

## Pitfalls
- Engine "never READY" → page error or unloadable font; the CLI prints captured errors. Validate first.
- Check **both** a far frame and a near frame: 3D axis titles move on screen with the camera.
- Colours live only in `presets/*.json`; after a palette change grep the preset for the old hex, not the engine.
- Label overlap in `cover`: try another `--t` or shorter `highlight.labels`.
- Two paths sharing a node: give the second path its own label to avoid a duplicated sprite.
- Never edit `src/engine.html` to change content; everything content-like belongs in the spec or preset.

## Output checklist before handing over
- [ ] `validate` exits 0; warnings understood.
- [ ] Far frame: layer labels readable, legend not colliding with the depth title.
- [ ] Each lit moment: node bright, label placed, tube visible, caption inside the frame.
- [ ] Last frame: tail text present (if any), nothing half-faded.
- [ ] `video.mp4` plays; `cover.png` is the first frame; `preview.gif` loops cleanly.

---

## 中文摘要
**用途**：把「节点 + 层 + 分组（+ 深度）+ 边 + 一条要亮的高亮路径 + 字幕」的一份 JSON 渲染成 MP4、GIF 预览、封面 PNG 和 2D 横带；适合 deck 里的供应链溯源、项目关键路径、模块构建顺序等分层依赖或流程故事。**不做**：力导向布局、交互、>600 节点、音频。
**向用户要**：层（自下而上）与分组；节点及其层/分组；边（`from → to` = to 依赖 from）；要亮的路径及每步一句字幕；语言、时长、预设；品牌行。
**流程**：`validate` → `test`（先看关键帧：远景、每次点亮、每条字幕、末帧）→ `render`（nohup 跑，看日志）→ 可选 `strip`。**交付**：video.mp4、preview.gif、cover.png（第一个节点点亮那一帧）、contact.png，双语各出一版。
**视觉**：四条规则——底暗、节点低饱和、路径高饱和 + 发光、边低 alpha；默认 `ivory-gold`（米白底、深金路径）或 `ivory-indigo`，深色场合 `slate-gold` / `midnight` / `obsidian-gold`；字体全篇衬线、小字号、Regular，不要为「看得清」放大字，改短文本；不加第二强调色；字幕框底部居中 ≤60% 宽。
**坑**：不 READY 先查 validate 与字体；远近景各看一帧；色值只在预设里；封面标签叠 → 换 t 或缩短标签；内容永远不写进 engine.html。
