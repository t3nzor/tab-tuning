# tab-tuning

An interactive guitar fretboard note chart with chord and scale pickers, in the browser.

## Features

- **18-fret fretboard** showing every note, tablature-style (high string on top)
- **Switchable fretboard markers** — standard inlay dots (3/5/7/9/15/17, double at 12) by default, or a colored sticker cycle (white at the nut, then red/green/blue repeating every 4 frets — matches the repeating major-thirds pattern) via the checkbox below the board
- **9 tuning presets** — Standard, Drop D, Half-Step Down, Drop C, DADGAD, Open G, Open D, Perfect 4ths, Major Thirds — plus fully custom per-string tuning
- **Chord picker** — type any chord symbol (`Cmaj7`, `Am`, `G7`…) or build one from root + chord-type dropdowns (20 common types: major, minor, 7, maj7, m7, dim, aug, sus2, sus4, and more)
- **Scale/mode picker** — pick a root note + scale type (14 scales: Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Major/Minor Pentatonic, Blues, Major Blues, Harmonic Minor, Melodic Minor, Harmonic Major). Defaults to None
- **Diatonic chord buttons** — for any active scale, the row below shows its diatonic triads (`I · C`, `ii · Dm`, `vii° · Bdim`…) as clickable chips; click one to light that chord up as the active chord. Pentatonic and blues scales use the triads of their parent major/minor scale (same tonic), numbered per the parent
- **Open chord suggestions** — for the current tuning, clickable chips list every common chord (major, minor, 7, maj7, m7, sus2, sus4, dim) that has a fingerable open-position voicing: all chord tones fretted at fret ≤ 4 within a three-fret span, at least two open strings, at most three fretted frets, and no muted strings inside the strummed shape. The list updates with the tuning; click a chip to make it the active chord. When an open chord is active, its suggested voicing is shown on the fretboard — fingered positions highlighted in steel blue, sounded open strings ringed in steel blue at the nut, fretted strings shown in the neutral note style at the nut, and muted strings marked with an × at the nut
- **Dual highlighting** — chord tones glow amber (root: orange); scale tones glow green (root: deep green). Notes in both get a green ring. Both layers update automatically when you switch tunings
- **Chord visibility toggle** — uncheck the **Chord** box to hide the chord's fretboard highlighting while keeping its name and scale matches visible, so you can study a scale on its own
- **Chord–scale compatibility** — for any active chord, a chip list shows every scale (of the 14 types × 12 roots) that contains all the chord's notes. Click a chip to light that scale up on the fretboard

## Running locally

No build step, no dependencies to install. Serve the files with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. [Tonal](https://github.com/tonaljs/tonal) loads from a jsDelivr CDN script tag — an internet connection is required for chord parsing.

## Testing

Install the development dependencies and run the browser integration tests:

```bash
npm install
npm test
```

## Usage

1. Pick a tuning preset from the dropdown, or tweak any string to switch to a custom tuning
2. Type a chord symbol in the text field (e.g. `Am7`, `G/B`, `F#dim`), or pick a root note and chord type from the two dropdowns — the text field and dropdowns stay in sync
3. Pick a scale root and type from the Scale row (or leave it on None). Chord and scale highlights are active simultaneously — notes that belong to both get a green ring
4. The chip lists below the fretboard show open chords for the current tuning, the active scale's diatonic chords, and every scale the current chord appears in; click one to select it. The currently-selected scale's chip is outlined in green
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
