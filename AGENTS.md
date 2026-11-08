# AGENTS.md

## Overview

Single-page vanilla JS guitar fretboard app (guitar tab-tuning helper). Three files only: `index.html`, `style.css`, `script.js` (~550 lines, all app logic). No build step, no bundler.

## Commands

```bash
# Dev: serve statically (app must be served; Tonal loads from jsDelivr CDN)
python3 -m http.server 8000   # -> http://localhost:8000

# Tests
npm install                   # dev deps (jsdom, tonal) exist ONLY for tests
npm test                      # node --test (Node built-in runner)

# Single test by name
node --test --test-name-pattern="toggles between colored stickers"
```

No lint, typecheck, or CI config exists. Verification = `npm test`.

## Testing quirks

- `tests/scale-display.test.js` is an integration test: it loads real `index.html` in JSDOM (`runScripts: 'outside-only'`), sets `window.Tonal = Tonal` (the npm package, substituting the CDN script), evals real `script.js`, then dispatches `DOMContentLoaded`.
- Renaming element IDs or restructuring `#tuning-selects`, `.fret-num`, `.cell.nut`, etc. will break tests — assertions depend on DOM structure, counts (6 strings, 72 options, 114 notes, 19 stickers), and CSS classes (`.chord-root`, `.scale-tone`, `.match-chip`).
- `script.js` must stay browser-global-DOM compatible; don't add module imports or `require`.
- Fretboard rows render high string on top: DOM row r (0-based) = string r+1, and `.fretboard .cell` index = r*19 + fret. String index s in `getCurrentTuning()` (0 = string6) maps to row 5−s — getting this backwards marks the wrong cells. Fingering display classes (`.finger-pos`, `.voicing-open`, `.muted-string`, `.fretted-string`, `.mute-mark`) are pinned by exact position in tests. Same-fret groups of ≥3 strings render as a `.barre-line` span appended to `#fretboard` (data-fret/from/to; individual `.finger-pos` dots suppressed for those strings; 2-string pairs stay dots) — but only when `barreFingerable` passes: no sounded string strictly inside the span may be fretted lower than the barre fret or open (a flat finger would press it), else the group falls back to dots (e.g. Gm7 in standard shows 6 dots, no line). The line's inline geometry duplicates CSS values: `FRET_CELL_HEIGHT` (2.5) must match `.cell` height, `BOARD_PAD_TOP` (0.5) must match `.fretboard` padding-top, and the 19 fret columns must stay equal-width `1fr` (percent-based left/width). The line sits behind cells via `.fretboard .cell { z-index: 1 }`. Scoring also carries a barre-penalty element (open strings trapped inside a same-fret span, ranked after most-strings, before fret-sum) — that's why F displays the textbook 1-3-3-2-1-1 full barre.
- Playable-chord chip matrix is pinned per tuning AND per fret window: `#open-max-fret` (default 12) feeds `OPEN_MAX_FRET`, its change handler re-renders via `renderFretboard()`, and the chip label embeds the window ("up to fret N"). The voicing search requires at most 4 fingers counting barres (distinct fretted frets — same-fret strings share one finger), span ≤ 3, contiguous sounded block; min open strings is 0. Chip lists always require full tone coverage; the fingering DISPLAY relaxes the 5th to optional for 4+-tone chords (classic open C7 = x-3-2-3-1-0 omits G) via a required-tone mask passed to `openVoicingEach`/`openVoicingBest` (memo key includes the mask). Display scoring is root-in-bass → lowest max fret → most strings → barre penalty → fret sum. `renderFingering` shows the single best voicing over the full window (no low/high toggle — it was removed). `#open-chords-list` renders as a 12-root × 8-type grid: `.type-label`/`.root-label`/`.chip-placeholder` cells plus one `.match-chip` per playable chord; test queries for chips must stay scoped to the list id (placeholders/labels deliberately lack `.match-chip`).

## Gotchas

- `script.js` depends on the global `Tonal` from a CDN `<script>` in `index.html` — the browser app needs internet; the test harness needs `npm install`.
- Default tuning is `standard` (E A D G B E, string6→string1) with default chord C; tests assert these exact values.
- Three chip rows share the `.match-chip` class: `#open-chords-list`, `#diatonic-list`, `#matches-list` (in that DOM order, below the fretboard). Test queries for chips must be scoped to a list id; unscoped `.match-chip` matches the open-chords row first.
- Every chord-state change (including clears/invalid input) goes through `renderScaleMatches`, which must re-render all three chip rows — its `!activeChord` early return skips `renderDiatonicChords`/`renderOpenChords` at your peril (stale `.active` chips).
- `.opencode/` is gitignored (local opencode plugin + plans).
- Commit messages: short imperative subject lines, no body (see `git log`).
