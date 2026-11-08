# tab-tuning

An interactive guitar fretboard note chart with chord and scale pickers, in the browser.

## Features

- **18-fret fretboard** showing every note, tablature-style (high string on top)
- **Switchable fretboard markers** — standard inlay dots (3/5/7/9/15/17, double at 12) by default, or a colored sticker cycle (white at the nut, then red/green/blue repeating every 4 frets — matches the repeating major-thirds pattern) via the checkbox below the board
- **9 tuning presets** — Standard, Drop D, Half-Step Down, Drop C, DADGAD, Open G, Open D, Perfect 4ths, Major Thirds — plus fully custom per-string tuning
- **Chord picker** — type any chord symbol (`Cmaj7`, `Am`, `G7`…) or build one from root + chord-type dropdowns (20 common types: major, minor, 7, maj7, m7, dim, aug, sus2, sus4, and more)
- **Scale/mode picker** — pick a root note + scale type (14 scales: Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Major/Minor Pentatonic, Blues, Major Blues, Harmonic Minor, Melodic Minor, Harmonic Major). Defaults to None
- **Diatonic chord buttons** — for any active scale, the row below shows its diatonic triads (`I · C`, `ii · Dm`, `vii° · Bdim`…) as clickable chips; click one to light that chord up as the active chord. Pentatonic and blues scales use the triads of their parent major/minor scale (same tonic), numbered per the parent
- **Playable chord suggestions** — a **Max fret** control (default 12 — one octave, patterns repeat past it) sets how far up the neck the chord search looks. The buttons below the fretboard form a labeled matrix (one row per root, one column per type: major, minor, 7, maj7, m7, sus2, sus4, dim) listing every common chord with a fingerable voicing under the current tuning: all chord tones covered on distinct strings within the fret window, a contiguous strummed shape (no muted strings inside it), a fret span of at most four frets, and at most four fingers — barres allowed, so strings at the same fret share one finger; open strings are welcome but not required. Chords that don't fit the window leave a blank cell. The matrix updates with the tuning and the fret window; click a chip to make it the active chord. A **Shape slider** above the matrix steps the active chord's fingering through the six best-ranked alternate voicings, each labeled with its fret pattern (e.g. `2/6 · 8-10-10-8-8-8`); it resets to the best shape when the chord, tuning, or fret window changes. When one of these chords is active, its suggested voicing is shown on the fretboard — fingered positions highlighted in rose, sounded open strings ringed in rose at the nut, fretted strings shown neutral at the nut, and muted strings marked with an × at the nut. Seventh chords and richer may omit the 5th in the suggested grip (standard practice — the open C7 is x-3-2-3-1-0), while triads keep full coverage. Chords with little or no open-string availability (Cm in standard, say) are shown as the standard barre shapes from chord books (Cm = x-3-5-5-4-3) rather than minimal low-fret grips. When three or more strings share a fret and a flat finger could actually span them (no lower-fretted or open string in between), the barre is drawn as a rose bar spanning those strings instead of individual dots. The best-scoring voicing is shown automatically (root in the bass, then lowest frets, most strings)
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
4. The chip lists below the fretboard show every playable common chord for the current tuning (as a root × type matrix), the active scale's diatonic chords, and every scale the current chord appears in; click one to select it. The currently-selected scale's chip is outlined in green
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
