#!/usr/bin/env bash
# Narrative / confidentiality scan: the repository must not carry domain-specific narrative words or private names.
# Exit 1 on any hit. Run before every commit: scripts/scan_words.sh  (npm run scan)
# Private names (people, paths, internal project names) are NOT listed here: put one extended regex in
# scripts/scan_private.local (git-ignored) or export LAYERGRAPH_SCAN_PRIVATE='name1|name2'.
cd "$(dirname "$0")/.."
ZH='学习|学生|年级|课程|知识点|缺口|补齐|回溯|诊断|先修|教材|教学|课时|学伴|讲次|第 ?[0-9]+ ?讲'
EN='\blearn(ing|er|ers)?\b|\bstudents?\b|\bgrades?\b|\bcurricul(um|a)\b|\bknowledge\b|\bthe gap\b|fill(ing)? the gap|\btrace(d|s)? back\b|\bdiagnos|prerequisite chain|\blessons?\b|\btextbook|\bteach|\bschool|\bmaths?\b|\bpupils?\b'
PRIV="${LAYERGRAPH_SCAN_PRIVATE:-}"
if [ -z "$PRIV" ] && [ -f scripts/scan_private.local ]; then PRIV=$(grep -v '^#' scripts/scan_private.local | tr -d '\n'); fi
PAT="$ZH|$EN"; [ -n "$PRIV" ] && PAT="$PAT|$PRIV"
hits=$(grep -rn -I -E "$PAT" --exclude-dir=node_modules --exclude-dir=out --exclude-dir=frames --exclude-dir=.git \
  --exclude='*.log' --exclude='*.ttf' --exclude='*.otf' --exclude='OFL-*.txt' --exclude='scan_words.sh' --exclude='scan_private.local' . || true)
if [ -n "$hits" ]; then echo "$hits"; echo "✗ scan: $(echo "$hits" | wc -l | tr -d ' ') hit(s)"; exit 1; fi
if [ -n "$PRIV" ]; then echo "✓ scan clean (narrative + private list)"; else echo "✓ scan clean (narrative only — no private list: add scripts/scan_private.local)"; fi
