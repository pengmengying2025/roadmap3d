# fonts/

Font files are not committed. Run `scripts/get_fonts.sh` to download the two on-demand fonts (both SIL OFL 1.1) here, or point `--font-dir` at any directory containing them:

- `SourceSerif4[opsz,wght].ttf` — Latin text. The stack is `"Times New Roman", "Source Serif 4", Georgia, serif`, so on a machine that has Times New Roman (macOS, Windows) that face is used and Source Serif 4 is the portable stand-in (Linux CI, containers).
- `NotoSerifSC[wght].ttf` (or `NotoSerifSC-Regular.ttf` + `NotoSerifSC-Bold.ttf`) — CJK fallback for zh strings.

Any other family works: set `meta.fonts.family` (Latin list) and `meta.fonts.cjk` in the spec; `meta.fonts.files` maps a filename to `{family, weight, style}` when the filename heuristic (`Family-Weight.ttf`, `Family[wght].ttf`) does not fit. Without fonts, the engine falls back to system serif / CJK fonts and the CLI warns.
