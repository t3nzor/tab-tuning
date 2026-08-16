# tab-tuning

An interactive guitar fretboard note chart with chord and scale pickers, in the browser.

## Features

- **12-fret fretboard** showing every note, tablature-style (high string on top)
- **9 tuning presets** — Standard, Drop D, Half-Step Down, Drop C, DADGAD, Open G, Open D, Perfect 4ths, Major Thirds — plus fully custom per-string tuning
- **Chord picker** — type any chord symbol (`Cmaj7`, `Am`, `G7`…) or build one from root + chord-type dropdowns (20 common types: major, minor, 7, maj7, m7, dim, aug, sus2, sus4, and more)
- **Scale/mode picker** — pick a root note + scale type (14 scales: Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Major/Minor Pentatonic, Blues, Major Blues, Harmonic Minor, Melodic Minor, Harmonic Major). Defaults to None
- **Dual highlighting** — chord tones glow amber (root: orange); scale tones glow green (root: deep green). Notes in both get a green ring. Both layers update automatically when you switch tunings
- **Chord visibility toggle** — uncheck the **Chord** box to hide the chord's fretboard highlighting while keeping its name and scale matches visible, so you can study a scale on its own
- **Chord–scale compatibility** — for any active chord, a chip list shows every scale (of the 14 types × 12 roots) that contains all the chord's notes. Click a chip to light that scale up on the fretboard

## Running locally

No build step, no dependencies to install. Serve the files with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. [Tonal](https://github.com/tonaljs/tonal) loads from a jsDelivr CDN script tag — an internet connection is required for chord parsing.

## Usage

1. Pick a tuning preset from the dropdown, or tweak any string to switch to a custom tuning
2. Type a chord symbol in the text field (e.g. `Am7`, `G/B`, `F#dim`), or pick a root note and chord type from the two dropdowns — the text field and dropdowns stay in sync
3. Pick a scale root and type from the Scale row (or leave it on None). Chord and scale highlights are active simultaneously — notes that belong to both get a green ring
4. The chip list below the scale row shows every scale the current chord appears in; click one to preview it. The currently-selected scale's chip is outlined in green
5. Uncheck the **Chord** box to view the scale's notes without the chord's amber/orange highlights (the chord itself stays selected)
6. Invalid chord text shows a red border and clears the chord; switching tuning preserves both highlights

## Tech

- Vanilla HTML, CSS, and JavaScript — zero build tooling
- [Tonal](https://github.com/tonaljs/tonal) via jsDelivr CDN for chord and scale parsing and note normalization

## File structure

- `index.html` — page structure and controls
- `style.css` — dark theme, fretboard grid, highlight styles
- `script.js` — tuning/preset logic, fretboard rendering, chord and scale pickers

## Notes

An experimental mic-input chord-detection feature was removed due to instability with FFT-based pitch detection. It's recoverable from git history if you'd like to revisit it.
