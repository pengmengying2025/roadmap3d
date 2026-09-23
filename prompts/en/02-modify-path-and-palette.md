# Prompt template · change the highlight path, captions or palette of an existing graph

```
You are working in the layergraph repo (read SKILL.md first). Modify an existing spec, do not rebuild it.

SPEC: ⟨path/to/layergraph.json⟩

CHANGES
- New highlight path: ⟨X → Y → Z⟩ (keep the second path / remove it / add ⟨…⟩).
- Captions: ⟨new lines per step, zh + en⟩; keep windows aligned to lit_at (start ≈ 0.2 s before the node lights, end before the next).
- Palette: ⟨e.g. brand background #123456, path colour warm white, light preset for print⟩.

DO
1. Edit only highlight / captions / camera (keep "auto" unless framing is wrong) in the spec.
2. For the palette, copy presets/⟨ivory-gold|ivory-indigo|slate-gold|midnight|obsidian-gold⟩.json to presets/⟨name⟩.json and change keys there (bg, fog, node.tints,
   lit.node / glow / tube, label.*, hud.*). Set meta.preset to "presets/⟨name⟩.json" or pass --preset. After editing,
   grep the new preset for any old hex you replaced; colours must not remain anywhere else.
3. `validate`, then `test -o out/⟨name⟩` and look at: the far frame (t≈0.5), each lit moment, the cover frame
   (`cover --t ⟨last lit + 1.5⟩`), and the last frame. Check contrast: the path must be the only saturated element (and, on a dark
   ground, the only glowing one); caption accents on the ivory presets must reach 4.5:1 on the white card.
4. Render (`render`, both languages if the spec is bilingual) and `strip`.
5. Report what changed (a diff of the spec sections and preset keys) and the paths of the new outputs.
```
