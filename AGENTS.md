# AGENTS.md

## Overview

Single-page vanilla JS guitar fretboard app (guitar tab-tuning helper). Three files only: `index.html`, `style.css`, `script.js`. No build step, no bundler.

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
- Fretboard rows render high string on top: DOM row r (0-based) = string r+1, and `.fretboard .cell` index = r*19 + fret. String index s in `getCurrentTuning()` (0 = string6) maps to row 5−s — getting this backwards marks the wrong cells.
- The voicing-search ALGORITHM is kept intact but has no UI anymore (the magenta fingering overlay, the `#open-chords-list` chip grid, and the shape slider were removed — element ids `open-max-fret`/`open-chords-list`/`shape-slider` are asserted absent in tests). Kept and still tested via direct calls on `window` (sloppy indirect eval puts `function`/`var` on the global object; `const`s like `NOTES` are NOT on `window`, only reachable through the functions' closures): `findOpenChords()` (rows of {root, cells} symbols per `OPEN_TYPES`), `openVoicingEach/Exists/Best/Ranked`, `openVoicingScore`, `barreFingerable`, `openRequiredMask(tones, tonic)` (5th optional for 4+-tone chords — classic open C7 = x-3-2-3-1-0 omits G), and `OPEN_MAX_FRET` (fixed 12; tests may reassign it — it's a `var`). Voicing rules: ≤ 4 fingers counting barres (same-fret strings share one), span ≤ 3, contiguous sounded block, min open strings 0; scoring is root-in-bass → [open-starved shortfall/adjacentOpen/spread] → lowest max fret → most strings → barre penalty (open strings trapped inside a same-fret span) → fret sum. Reference pins, string6→string1 ("x" = muted): C x-3-2-0-1-0, Am x-0-2-2-1-0, F 1-3-3-2-1-1 (barre fret 1, strings 1-6), D x-x-0-2-3-2, C7 x-3-2-3-1-0, Cm x-3-5-5-4-3, G 3-2-0-0-3-3, Gm7 3-1-3-3-3-1 (no barre — fret-3 span traps the fret-1 strings), G#m 4-6-6-4-4-4 (barre fret 4). `openVoicingRanked(..., 6)` keeps the top 6 (`list[0]` ≡ `openVoicingBest`).
- jsdom-realm gotcha: values returned by script functions (e.g. `findOpenChords()` arrays) belong to the jsdom Realm — `assert.deepEqual` on them fails with "same structure but are not reference-equal". Wrap in `Array.from(...)`/spread in the test realm first.

## Gotchas

- `script.js` depends on the global `Tonal` from a CDN `<script>` in `index.html` — the browser app needs internet; the test harness needs `npm install`.
- Default tuning is `standard` (E A D G B E, string6→string1) with default chord C; tests assert these exact values.
- Two chip rows share the `.match-chip` class: `#diatonic-list`, `#matches-list` (in that DOM order, below the fretboard). Test queries for chips must be scoped to a list id.
- Every chord-state change (including clears/invalid input) goes through `renderScaleMatches`, which must re-render both chip rows — its `!activeChord` early return skips `renderDiatonicChords` at your peril (stale `.active` chips).
- `.opencode/` is gitignored (local opencode plugin + plans).
- Commit messages: short imperative subject lines, no body (see `git log`).
