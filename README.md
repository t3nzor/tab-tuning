# tab-tuning

An interactive guitar fretboard note chart with a chord picker, in the browser.

## Features

- **12-fret fretboard** showing every note, tablature-style (high string on top)
- **9 tuning presets** — Standard, Drop D, Half-Step Down, Drop C, DADGAD, Open G, Open D, Perfect 4ths, Major Thirds — plus fully custom per-string tuning
- **Chord picker** — type any chord symbol (`Cmaj7`, `Am`, `G7`…) or build one from root + chord-type dropdowns (20 common types: major, minor, 7, maj7, m7, dim, aug, sus2, sus4, and more)
- **Highlighting** — chord tones glow amber across the board; root notes get an orange accent. Highlights update automatically when you switch tunings

## Running locally

No build step, no dependencies to install. Serve the files with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. [Tonal](https://github.com/tonaljs/tonal) loads from a jsDelivr CDN script tag — an internet connection is required for chord parsing.

## Usage

1. Pick a tuning preset from the dropdown, or tweak any string to switch to a custom tuning
2. Type a chord symbol in the text field (e.g. `Am7`, `G/B`, `F#dim`), or pick a root note and chord type from the two dropdowns — the text field and dropdowns stay in sync
3. Invalid chord text shows a red border and clears the board

## Tech

- Vanilla HTML, CSS, and JavaScript — zero build tooling
- [Tonal](https://github.com/tonaljs/tonal) via jsDelivr CDN for chord parsing and note normalization

## File structure

- `index.html` — page structure and controls
- `style.css` — dark theme, fretboard grid, highlight styles
- `script.js` — tuning/preset logic, fretboard rendering, chord picker

## Notes

An experimental mic-input chord-detection feature was removed due to instability with FFT-based pitch detection. It's recoverable from git history if you'd like to revisit it.
