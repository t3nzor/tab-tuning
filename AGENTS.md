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
- Fretboard rows render high string on top: DOM row r (0-based) = string r+1, and `.fretboard .cell` index = r*19 + fret. String index s in `getCurrentTuning()` (0 = string6) maps to row 5−s — getting this backwards marks the wrong cells. Fingering display classes (`.finger-pos`, `.voicing-open`, `.muted-string`, `.fretted-string`, `.mute-mark`) are pinned by exact position in tests.
- Open-chord chip lists are pinned per tuning AND per fret window: `#open-max-fret` (default 12) feeds `OPEN_MAX_FRET`, its change handler re-renders via `renderFretboard()`, and the chip label embeds the window ("up to fret N"). The voicing search requires at most 3 fretted strings (no barres — one finger per fretted string), span ≤ 2, contiguous sounded block; display scoring is root-in-bass → lowest max fret → most strings. `renderFingering` picks between two candidates (≤ fret 4 vs the full window) per the `#low-position` checkbox and disables it for single-position chords; low/high display pins are in tests.

## Gotchas

- `script.js` depends on the global `Tonal` from a CDN `<script>` in `index.html` — the browser app needs internet; the test harness needs `npm install`.
- Default tuning is `standard` (E A D G B E, string6→string1) with default chord C; tests assert these exact values.
- Three chip rows share the `.match-chip` class: `#open-chords-list`, `#diatonic-list`, `#matches-list` (in that DOM order, below the fretboard). Test queries for chips must be scoped to a list id; unscoped `.match-chip` matches the open-chords row first.
- Every chord-state change (including clears/invalid input) goes through `renderScaleMatches`, which must re-render all three chip rows — its `!activeChord` early return skips `renderDiatonicChords`/`renderOpenChords` at your peril (stale `.active` chips).
- `.opencode/` is gitignored (local opencode plugin + plans).
- Commit messages: short imperative subject lines, no body (see `git log`).
