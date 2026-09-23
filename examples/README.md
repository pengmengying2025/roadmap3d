# Examples

All three are synthetic and render in English by default (`--lang zh` for the Chinese strings kept in each spec).

| folder | shows | preset |
|---|---|---|
| `supply-chain/` | four supplier tiers as layers, four regions as lanes, risk rating as depth; sub-parts as minor nodes, QC certificates as leaf nodes; a 4-node highlight path from a finished product down to its raw material, plus a second product's path in the tail | `ivory-gold` |
| `critical-path/` | five project phases as layers, five teams as lanes, no depth; a 6-node highlight path = the critical path that sets the launch date; explicit camera keyframes (push-in at 0.5 R0, aimed between the first two nodes) keep the top layer titles in frame | `ivory-indigo` |
| `deps/` | five architecture tiers as layers, four subsystems as lanes, change rate as depth, test suites as leaf nodes; a 5-node highlight path = the build order of one module, bottom-up; explicit camera keyframes (push-in at 0.5 R0, always aimed between two path nodes) keep modules out of the brand and legend areas | `ivory-gold` |

Regenerate a render: `node src/cli.mjs render examples/<name>/roadmap3d.json -o examples/<name>/render`. The `video.mp4` it writes is git-ignored; the published MP4s are on [Release v1.0.0](https://github.com/pengmengying2025/roadmap3d/releases/tag/v1.0.0).
