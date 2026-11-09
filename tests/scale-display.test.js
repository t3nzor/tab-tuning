const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const Tonal = require('tonal');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');

function createApp() {
    const dom = new JSDOM(html, { runScripts: 'outside-only' });
    const { window } = dom;
    window.Tonal = Tonal;
    window.eval(script);
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return dom;
}

function selectScale(dom, root, type) {
    const { window } = dom;
    const rootSelect = window.document.getElementById('scale-root');
    const typeSelect = window.document.getElementById('scale-type');
    rootSelect.value = root;
    typeSelect.value = type;
    typeSelect.dispatchEvent(new window.Event('change'));
}

function changeValue(dom, id, value) {
    const { window } = dom;
    const element = window.document.getElementById(id);
    element.value = value;
    element.dispatchEvent(new window.Event('change'));
    return element;
}

function inputValue(dom, value) {
    const { window } = dom;
    const input = window.document.getElementById('chord-input');
    input.value = value;
    input.dispatchEvent(new window.Event('input'));
    return input;
}

const CHIP_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHIP_TYPES = ['', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', 'dim'];
const allPlayableChips = CHIP_ROOTS.flatMap((root) => CHIP_TYPES.map((type) => root + type));

function playableSymbols(window) {
    return Array.from(window.findOpenChords().flatMap((row) => row.cells.filter((symbol) => symbol !== null)));
}

function bestVoicing(window) {
    const chord = window.activeChord;
    if (!chord || !chord.ordered) return null;
    const tuning = window.getCurrentTuning();
    const mask = window.openRequiredMask(chord.ordered, chord.tonic);
    return window.openVoicingBest(tuning, chord.ordered, chord.tonic, window.OPEN_DISPLAY_MIN_OPEN_STRINGS, window.OPEN_MAX_FRET, mask);
}

function voicingVector(voicing) {
    return voicing.map((c) => (c ? (c[1] === 0 ? '0' : String(c[1])) : 'x')).join('-');
}

function barreLines(window, voicing) {
    const groups = {};
    voicing.forEach((c, s) => {
        if (c && c[1] > 0) {
            (groups[c[1]] = groups[c[1]] || []).push(s);
        }
    });
    return Object.keys(groups).flatMap((fret) => {
        const strings = groups[fret];
        if (strings.length < 3 || !window.barreFingerable(Number(fret), strings, voicing)) return [];
        const lo = Math.min(...strings);
        const hi = Math.max(...strings);
        return [{ fret: Number(fret), from: 6 - hi, to: 6 - lo }];
    });
}

test('initializes the fretboard with the default standard tuning and default C chord', () => {
    const dom = createApp();
    const document = dom.window.document;

    assert.equal(document.getElementById('preset').value, 'standard');
    assert.equal(document.getElementById('string6').value, 'E');
    assert.equal(document.getElementById('string1').value, 'E');
    assert.equal(document.querySelectorAll('#tuning-selects select').length, 6);
    assert.equal(document.querySelectorAll('#tuning-selects option').length, 72);
    assert.equal(document.querySelectorAll('.fretboard .note').length, 114);
    assert.equal(document.getElementById('chord-name').textContent, 'C');
    assert.equal(document.getElementById('scale-type').value, '');
    assert.ok(document.querySelector('.note[data-note="C"]').classList.contains('chord-root'));
    assert.equal(document.getElementById('chord-root'), null);
    assert.equal(document.getElementById('chord-type'), null);
    assert.equal(document.querySelectorAll('#chord-roots .chord-btn').length, 12);
    assert.equal(document.querySelectorAll('#chord-types .chord-btn').length, 20);
    assert.equal(document.querySelector('#chord-roots .chord-btn[data-root="C"]').textContent, 'C');
    assert.ok(document.querySelector('#chord-roots .chord-btn[data-root="C"]').classList.contains('active'));
    assert.ok(document.querySelector('#chord-types .chord-btn[data-type="major"]').classList.contains('active'));
    assert.equal(document.getElementById('open-max-fret'), null);
    assert.equal(document.getElementById('open-chords-list'), null);
    assert.equal(document.getElementById('shape-slider'), null);

    const showStickers = document.getElementById('show-stickers');
    assert.equal(showStickers.checked, false);
    assert.equal(document.querySelectorAll('.fret-num .sticker').length, 0);
    assert.equal(document.querySelectorAll('.fret-num .dot').length, 8);

    dom.window.close();
});

test('toggles between colored stickers and standard inlay dots', () => {
    const dom = createApp();
    const document = dom.window.document;

    const showStickers = document.getElementById('show-stickers');

    const dotCells = document.querySelectorAll('.fret-num');
    [3, 5, 7, 9, 15, 17].forEach((f) => {
        assert.equal(dotCells[f].querySelectorAll('.dot').length, 1, 'single dot at fret ' + f);
    });
    assert.equal(dotCells[12].querySelectorAll('.dot').length, 2, 'double dot at fret 12');
    [0, 1, 2, 4, 6, 8, 10, 11, 13, 14, 16, 18].forEach((f) => {
        assert.equal(dotCells[f].querySelectorAll('.dot').length, 0, 'no dot at fret ' + f);
    });

    showStickers.checked = true;
    showStickers.dispatchEvent(new dom.window.Event('change'));
    assert.equal(document.querySelectorAll('.fret-num .dot').length, 0);
    const stickers = document.querySelectorAll('.fret-num .sticker');
    assert.equal(stickers.length, 19);
    const expected = ['white', 'red', 'green', 'blue'];
    for (let f = 0; f <= 18; f++) {
        assert.ok(stickers[f].classList.contains(expected[f % 4]), 'fret ' + f + ' sticker color');
    }

    showStickers.checked = false;
    showStickers.dispatchEvent(new dom.window.Event('change'));
    assert.equal(document.querySelectorAll('.fret-num .sticker').length, 0);
    assert.equal(document.querySelectorAll('.fret-num .dot').length, 8);

    dom.window.close();
});

test('applies presets and switches to custom tuning when a string changes', () => {
    const dom = createApp();
    const document = dom.window.document;

    changeValue(dom, 'preset', 'dropD');
    assert.equal(document.getElementById('string6').value, 'D');
    let openNotes = document.querySelectorAll('.cell.nut .note');
    assert.equal(openNotes[openNotes.length - 1].getAttribute('data-note'), 'D');

    changeValue(dom, 'string6', 'C');
    assert.equal(document.getElementById('preset').value, 'custom');
    openNotes = document.querySelectorAll('.cell.nut .note');
    assert.equal(openNotes[openNotes.length - 1].getAttribute('data-note'), 'C');
    assert.ok(document.querySelector('.note[data-note="C"]').classList.contains('chord-root'));

    dom.window.close();
});

test('updates and clears chord state from free-form chord input', () => {
    const dom = createApp();
    const document = dom.window.document;

    const input = inputValue(dom, 'Am7');
    assert.equal(input.classList.contains('invalid'), false);
    assert.equal(document.getElementById('chord-name').textContent, 'Am7');
    assert.equal(document.getElementById('detected-notes').textContent, 'A C E G');
    assert.ok(document.querySelector('#chord-roots .chord-btn[data-root="A"]').classList.contains('active'));
    assert.ok(document.querySelector('#chord-types .chord-btn[data-type="minor seventh"]').classList.contains('active'));
    assert.ok(document.querySelector('.note[data-note="A"]').classList.contains('chord-root'));
    assert.ok(document.querySelector('.match-chip'));

    inputValue(dom, 'not-a-chord');
    assert.equal(input.classList.contains('invalid'), true);
    assert.equal(document.getElementById('chord-name').textContent, '');
    assert.equal(document.getElementById('detected-notes').textContent, '');
    assert.equal(document.querySelector('.chord-tone, .chord-root'), null);
    assert.equal(document.querySelector('.match-chip.active'), null);

    inputValue(dom, '');
    assert.equal(input.classList.contains('invalid'), false);

    dom.window.close();
});

test('builds chords from root and type buttons and hides only chord highlights', () => {
    const dom = createApp();
    const document = dom.window.document;

    document.querySelector('#chord-roots .chord-btn[data-root="G"]').click();
    document.querySelector('#chord-types .chord-btn[data-type="dominant seventh"]').click();
    assert.equal(document.getElementById('chord-input').value, 'G7');
    assert.equal(document.getElementById('chord-name').textContent, 'G7');
    assert.ok(document.querySelector('#chord-roots .chord-btn[data-root="G"]').classList.contains('active'));
    assert.ok(document.querySelector('#chord-types .chord-btn[data-type="dominant seventh"]').classList.contains('active'));
    assert.ok(document.querySelector('.chord-root'));

    selectScale(dom, 'G', 'mixolydian');
    const showChord = document.getElementById('show-chord');
    showChord.checked = false;
    showChord.dispatchEvent(new dom.window.Event('change'));
    assert.equal(document.querySelector('.chord-tone, .chord-root'), null);
    assert.ok(document.querySelector('.scale-root'));
    assert.equal(document.getElementById('chord-name').textContent, 'G7');
    assert.ok(document.querySelector('.match-chip'));

    showChord.checked = true;
    showChord.dispatchEvent(new dom.window.Event('change'));
    assert.ok(document.querySelector('.chord-root'));

    dom.window.close();
});

test('clears scales and keeps interval labels tied to the scale root', () => {
    const dom = createApp();
    const document = dom.window.document;

    selectScale(dom, 'C', 'major');
    const cNote = document.querySelector('.note[data-note="C"]');
    assert.ok(cNote.classList.contains('chord-root'));
    assert.ok(cNote.classList.contains('scale-root'));

    const showIntervals = document.getElementById('show-intervals');
    showIntervals.checked = true;
    showIntervals.dispatchEvent(new dom.window.Event('change'));
    assert.equal(document.querySelector('.note[data-note="C"]').textContent, 'P1');

    changeValue(dom, 'scale-type', '');
    assert.equal(document.getElementById('scale-name').textContent, '');
    assert.equal(document.getElementById('scale-notes').textContent, '');
    assert.equal(document.querySelector('.scale-tone, .scale-root'), null);
    assert.ok(document.querySelector('.chord-root'));
    assert.equal(document.querySelector('.note[data-note="C"]').textContent, 'P1');

    showIntervals.checked = false;
    showIntervals.dispatchEvent(new dom.window.Event('change'));
    assert.equal(document.querySelector('.note[data-note="C"]').textContent, 'C');

    dom.window.close();
});

test('activates a scale from a chord compatibility chip', () => {
    const dom = createApp();
    const document = dom.window.document;
    const chip = document.querySelector('.match-chip[data-root="C"][data-type="major"]');

    assert.ok(chip);
    chip.click();

    assert.equal(document.getElementById('scale-root').value, 'C');
    assert.equal(document.getElementById('scale-type').value, 'major');
    assert.equal(document.getElementById('scale-name').textContent, 'C Major');
    assert.ok(document.querySelector('.match-chip[data-root="C"][data-type="major"]').classList.contains('active'));
    const cNote = document.querySelector('.note[data-note="C"]');
    assert.ok(cNote.classList.contains('chord-root'));
    assert.ok(cNote.classList.contains('scale-root'));

    dom.window.close();
});

test('G Dorian keeps diatonic note spelling and capitalizes its label', () => {
    const dom = createApp();
    selectScale(dom, 'G', 'dorian');

    const document = dom.window.document;
    assert.equal(document.getElementById('scale-name').textContent, 'G Dorian');
    assert.equal(document.getElementById('scale-notes').textContent, 'G A Bb C D E F');
    assert.ok(document.querySelector('.note[data-note="A#"]').classList.contains('scale-tone'));

    dom.window.close();
});

test('sharp-key scales retain necessary letter spellings', () => {
    const dom = createApp();
    selectScale(dom, 'F#', 'major');

    const document = dom.window.document;
    assert.equal(document.getElementById('scale-name').textContent, 'F# Major');
    assert.equal(document.getElementById('scale-notes').textContent, 'F# G# A# B C# D# E#');

    dom.window.close();
});

test('shows clickable diatonic chords for the active scale', () => {
    const dom = createApp();
    const document = dom.window.document;

    assert.equal(document.querySelectorAll('#diatonic-list .match-chip').length, 0);

    selectScale(dom, 'C', 'major');
    const buttons = [...document.querySelectorAll('#diatonic-list .match-chip')];
    assert.equal(buttons.length, 7);
    const expected = ['I · C', 'ii · Dm', 'iii · Em', 'IV · F', 'V · G', 'vi · Am', 'vii° · Bdim'];
    expected.forEach((label, i) => assert.equal(buttons[i].textContent, label));
    assert.equal(document.getElementById('diatonic-label').textContent, 'Diatonic chords in C Major:');

    buttons[1].click();
    assert.equal(document.getElementById('chord-name').textContent, 'Dm');
    assert.equal(document.getElementById('chord-input').value, 'Dm');
    assert.ok(document.querySelector('#chord-roots .chord-btn[data-root="D"]').classList.contains('active'));
    assert.ok(document.querySelector('#chord-types .chord-btn[data-type="minor"]').classList.contains('active'));
    assert.ok(document.querySelector('.note[data-note="D"]').classList.contains('chord-root'));
    assert.ok(document.querySelector('#diatonic-list .match-chip[data-symbol="Dm"]').classList.contains('active'));

    dom.window.close();
});

test('derives diatonic chords from the parent scale for pentatonic and blues scales', () => {
    const dom = createApp();
    const document = dom.window.document;

    selectScale(dom, 'A', 'harmonic minor');
    let labels = [...document.querySelectorAll('#diatonic-list .match-chip')].map((b) => b.textContent);
    assert.deepEqual(labels, ['i · Am', 'ii° · Bdim', 'III+ · Caug', 'iv · Dm', 'V · E', 'VI · F', 'vii° · G#dim']);

    selectScale(dom, 'A', 'minor pentatonic');
    labels = [...document.querySelectorAll('#diatonic-list .match-chip')].map((b) => b.textContent);
    assert.deepEqual(labels, ['i · Am', 'III · C', 'iv · Dm', 'v · Em', 'VII · G']);
    assert.equal(document.getElementById('diatonic-label').textContent, 'Diatonic chords in A Minor Pentatonic (numbered from A Minor):');

    selectScale(dom, 'C', 'major pentatonic');
    labels = [...document.querySelectorAll('#diatonic-list .match-chip')].map((b) => b.textContent);
    assert.deepEqual(labels, ['I · C', 'ii · Dm', 'iii · Em', 'V · G', 'vi · Am']);

    selectScale(dom, 'A', 'minor blues');
    labels = [...document.querySelectorAll('#diatonic-list .match-chip')].map((b) => b.textContent);
    assert.deepEqual(labels, ['i · Am', 'III · C', 'iv · Dm', 'v · Em', 'VII · G']);

    dom.window.close();
});

test('finds playable chords for the selected tuning', () => {
    const dom = createApp();
    const window = dom.window;

    assert.deepEqual(playableSymbols(window), allPlayableChips);

    changeValue(dom, 'preset', 'dropD');
    assert.deepEqual(playableSymbols(window), allPlayableChips);

    changeValue(dom, 'string6', 'C');
    const customSymbols = playableSymbols(window);
    assert.equal(customSymbols.length, 96);
    assert.ok(customSymbols.includes('Cm'));
    assert.ok(customSymbols.includes('F7'));
    assert.ok(customSymbols.includes('F#sus4'));

    dom.window.close();
});

test('suggests playable voicings for the active chord', () => {
    const dom = createApp();
    const window = dom.window;

    const c = bestVoicing(window);
    assert.equal(voicingVector(c), 'x-3-2-0-1-0');
    assert.deepEqual(barreLines(window, c), []);

    inputValue(dom, 'Am');
    const am = bestVoicing(window);
    assert.equal(voicingVector(am), 'x-0-2-2-1-0');
    assert.deepEqual(barreLines(window, am), []);

    inputValue(dom, 'F');
    const f = bestVoicing(window);
    assert.equal(voicingVector(f), '1-3-3-2-1-1');
    assert.deepEqual(barreLines(window, f), [{ fret: 1, from: 1, to: 6 }]);

    inputValue(dom, 'not-a-chord');
    assert.equal(window.activeChord, null);
    assert.equal(bestVoicing(window), null);

    inputValue(dom, 'D');
    const d = bestVoicing(window);
    assert.equal(voicingVector(d), 'x-x-0-2-3-2');
    assert.deepEqual(barreLines(window, d), []);

    changeValue(dom, 'preset', 'dropD');
    const dDropD = bestVoicing(window);
    assert.equal(voicingVector(dDropD), '0-0-0-2-3-2');
    assert.deepEqual(barreLines(window, dDropD), []);

    inputValue(dom, 'Am');
    const amDropD = bestVoicing(window);
    assert.equal(voicingVector(amDropD), 'x-0-2-2-1-0');
    assert.deepEqual(barreLines(window, amDropD), []);

    changeValue(dom, 'preset', 'standard');
    inputValue(dom, 'C7');
    const c7 = bestVoicing(window);
    assert.equal(voicingVector(c7), 'x-3-2-3-1-0');
    assert.deepEqual(barreLines(window, c7), []);

    inputValue(dom, 'Cm');
    const cm = bestVoicing(window);
    assert.equal(voicingVector(cm), 'x-3-5-5-4-3');
    assert.deepEqual(barreLines(window, cm), []);

    inputValue(dom, 'G');
    const g = bestVoicing(window);
    assert.equal(voicingVector(g), '3-2-0-0-3-3');
    assert.deepEqual(barreLines(window, g), []);

    inputValue(dom, 'Gm7');
    const gm7 = bestVoicing(window);
    assert.equal(voicingVector(gm7), '3-1-3-3-3-1');
    assert.deepEqual(barreLines(window, gm7), []);

    inputValue(dom, 'G#m');
    const gsm = bestVoicing(window);
    assert.equal(voicingVector(gsm), '4-6-6-4-4-4');
    assert.deepEqual(barreLines(window, gsm), [{ fret: 4, from: 1, to: 6 }]);

    dom.window.close();
});

test('limits the playable chord search to the max-fret window', () => {
    const dom = createApp();
    const window = dom.window;

    assert.equal(window.OPEN_MAX_FRET, 12);
    assert.ok(playableSymbols(window).includes('Gm7'));
    assert.ok(playableSymbols(window).includes('C#m'));

    window.OPEN_MAX_FRET = 3;
    const tightSymbols = playableSymbols(window);
    assert.equal(tightSymbols.length, 94);
    assert.ok(tightSymbols.includes('C#m'));
    assert.equal(tightSymbols.includes('F#sus4'), false);
    assert.equal(tightSymbols.includes('Bsus2'), false);

    window.OPEN_MAX_FRET = 12;
    assert.ok(playableSymbols(window).includes('Gm7'));

    dom.window.close();
});

test('ranks alternate chord shapes', () => {
    const dom = createApp();
    const window = dom.window;

    function rankedShapes() {
        const chord = window.activeChord;
        const tuning = window.getCurrentTuning();
        const mask = window.openRequiredMask(chord.ordered, chord.tonic);
        return window.openVoicingRanked(tuning, chord.ordered, chord.tonic, window.OPEN_DISPLAY_MIN_OPEN_STRINGS, window.OPEN_MAX_FRET, mask, 6)
            .map(voicingVector);
    }

    inputValue(dom, 'C');
    const cShapes = rankedShapes();
    assert.equal(cShapes.length, 6);
    assert.deepEqual(cShapes[0], voicingVector(bestVoicing(window)));
    assert.equal(cShapes[0], 'x-3-2-0-1-0');
    assert.equal(cShapes[1], 'x-3-2-0-1-3');

    inputValue(dom, 'Cm');
    const cmShapes = rankedShapes();
    assert.equal(cmShapes.length, 6);
    assert.equal(cmShapes[0], 'x-3-5-5-4-3');
    assert.equal(cmShapes[1], '8-10-10-8-8-8');

    inputValue(dom, 'Am');
    assert.equal(rankedShapes()[0], 'x-0-2-2-1-0');

    dom.window.close();
});
