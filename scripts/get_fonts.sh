#!/usr/bin/env bash
# Download the bundled-on-demand fonts (SIL OFL 1.1) from the google/fonts repository into ./fonts/:
#   Source Serif 4 (variable; Latin text when "Times New Roman" is not installed) and Noto Serif SC (variable; CJK fallback).
# The fonts are NOT part of this repository; they are fetched on demand. See docs/licenses.md.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/fonts"
mkdir -p "$DIR"
BASE="https://raw.githubusercontent.com/google/fonts/main/ofl"
dl() { echo "→ $2"; curl -fL --retry 3 -o "$DIR/$2" "$1"; }
dl "$BASE/sourceserif4/SourceSerif4%5Bopsz%2Cwght%5D.ttf" "SourceSerif4[opsz,wght].ttf"
dl "$BASE/sourceserif4/OFL.txt"                            "OFL-SourceSerif4.txt"
dl "$BASE/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"           "NotoSerifSC[wght].ttf"
dl "$BASE/notoserifsc/OFL.txt"                             "OFL-NotoSerifSC.txt"
echo "done → $DIR"
ls -la "$DIR"
