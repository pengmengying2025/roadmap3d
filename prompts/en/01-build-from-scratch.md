# Prompt template · build a roadmap3d animation from scratch

Paste into Claude Code / Cursor inside the `roadmap3d` repository. Replace the ⟨…⟩ parts.

```
You are working in the roadmap3d repo (read SKILL.md first). Build a new animation spec and render it.

DATA
⟨paste a list / CSV / markdown table of nodes: name, which layer, which group, optional depth level, optional parent⟩
⟨paste edges or describe the rule: e.g. "each part feeds the assembly that uses it", "each task blocks the tasks after it"⟩

STORY
- The highlight path, in lighting order: ⟨A → B → C⟩ (A is where the story starts; C is where it ends).
- One caption per step (zh and en): ⟨…⟩
- Optional tail: a second path ⟨…⟩ and a one-line tail text ⟨…⟩.
- Duration ⟨21⟩ s, preset ⟨ivory-gold|ivory-indigo|slate-gold|midnight|obsidian-gold⟩, languages ⟨zh, en⟩, brand line ⟨title / subtitle⟩.

DO
1. Write examples/⟨name⟩/roadmap3d.json following schema/roadmap3d.schema.json. Layers bottom→top, groups as lanes,
   depth only if the data has an ordinal level. Use minor nodes for sub-items shown near a parent, leaf nodes for attachments.
2. Keep every visible string bilingual ({"zh","en"}). Captions ≤ 40 characters; *word* marks the accent.
3. Run `node src/cli.mjs validate …`, fix all errors, explain any warnings you keep.
4. Run `node src/cli.mjs test … -o out/⟨name⟩` and look at the PNGs. Report: is the path readable in the far shot,
   do labels overlap, do captions fit, are axis titles clear in both far and near frames. Adjust lit_at / captions /
   camera (use "auto" unless there is a reason) and repeat until clean.
5. Render both languages: `node src/cli.mjs render … --lang zh -o out/⟨name⟩-zh` and `--lang en`, plus `strip`.
6. Hand back: the spec path, out/ paths, the contact sheets and GIFs, and a 5-line summary of choices (layering, path timing, preset).
Do not edit src/engine.html or presets to change content; content belongs in the spec.
```
