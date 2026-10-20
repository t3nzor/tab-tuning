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

## Gotchas

- `script.js` depends on the global `Tonal` from a CDN `<script>` in `index.html` — the browser app needs internet; the test harness needs `npm install`.
- Default tuning is `majorThirds` (G B D# G B D#, string6→string1) with default chord C; tests assert these exact values.
- `.opencode/` is gitignored (local opencode plugin + plans).
- Commit messages: short imperative subject lines, no body (see `git log`).
