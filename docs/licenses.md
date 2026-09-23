# Dependency licences

roadmap3d itself is MIT. Nothing copyleft is imported; the two GPL-family tools are called as external processes only.

| dependency | licence | how it is used | verified |
|---|---|---|---|
| three (npm `three` ^0.186) | MIT | ES module served to the headless page from `node_modules/three/build/` | 2026-09-23, npm metadata + repo LICENSE |
| playwright (npm ^1.60) | Apache-2.0 | drives headless Chromium; browser binaries downloaded by `npx playwright install` carry their own licences | 2026-09-23 |
| ffmpeg | GPL-2.0-or-later (typical builds, incl. the binary shipped by `imageio-ffmpeg`) or LGPL builds | **external process** (`$FFMPEG`, PATH, or the `imageio-ffmpeg` Python package); not linked, not redistributed here | 2026-09-23 (`ffmpeg -L` on the imageio build) |
| Source Serif 4 / Noto Serif SC | SIL OFL 1.1 | downloaded on demand by `scripts/get_fonts.sh`; not committed. Times New Roman and Georgia are used only when the rendering machine already has them (system fonts; never bundled). Rendered glyphs inside video frames are not a font redistribution (OFL §5 / FAQ 1.12) | 2026-09-23, google/fonts OFL.txt (both) |
| Chromium (via Playwright) | BSD-3 and others | runtime only | — |

Notes
- No fonts, videos or third-party media are committed except the example renders produced by this tool from synthetic or public-catalogue data.
- If you swap in a different font, check its licence allows rendering to video (most do; some commercial fonts restrict "broadcast" use).
- If you package ffmpeg with a derived product, its licence (not this repository's) governs that binary.
