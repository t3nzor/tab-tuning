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

test('initializes the fretboard with the default major-thirds tuning and default C chord', () => {
    const dom = createApp();
    const document = dom.window.document;

    assert.equal(document.getElementById('preset').value, 'majorThirds');
    assert.equal(document.getElementById('string6').value, 'F');
    assert.equal(document.getElementById('string1').value, 'C#');
    assert.equal(document.querySelectorAll('#tuning-selects select').length, 6);
    assert.equal(document.querySelectorAll('#tuning-selects option').length, 72);
    assert.equal(document.querySelectorAll('.fretboard .note').length, 114);
    assert.equal(document.getElementById('chord-name').textContent, 'C');
    assert.equal(document.getElementById('scale-type').value, '');
    assert.ok(document.querySelector('.note[data-note="C"]').classList.contains('chord-root'));

    const stickers = document.querySelectorAll('.fret-num .sticker');
    assert.equal(stickers.length, 19);
    const expected = ['white', 'red', 'green', 'blue'];
    for (let f = 0; f <= 18; f++) {
        assert.ok(stickers[f].classList.contains(expected[f % 4]), 'fret ' + f + ' sticker color');
    }

    dom.window.close();
});

test('toggles between colored stickers and standard inlay dots', () => {
    const dom = createApp();
    const document = dom.window.document;

    const showStickers = document.getElementById('show-stickers');
    showStickers.checked = false;
    showStickers.dispatchEvent(new dom.window.Event('change'));

    assert.equal(document.querySelectorAll('.fret-num .sticker').length, 0);
    const dotCells = document.querySelectorAll('.fret-num');
    assert.equal(document.querySelectorAll('.fret-num .dot').length, 8);
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
    assert.equal(document.querySelectorAll('.fret-num .sticker').length, 19);

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
    assert.equal(document.getElementById('chord-root').value, 'A');
    assert.equal(document.getElementById('chord-type').value, 'minor seventh');
    assert.ok(document.querySelector('.note[data-note="A"]').classList.contains('chord-root'));
    assert.ok(document.querySelector('.match-chip'));

    inputValue(dom, 'not-a-chord');
    assert.equal(input.classList.contains('invalid'), true);
    assert.equal(document.getElementById('chord-name').textContent, '');
    assert.equal(document.getElementById('detected-notes').textContent, '');
    assert.equal(document.querySelector('.chord-tone, .chord-root'), null);
    assert.equal(document.querySelector('.match-chip'), null);

    inputValue(dom, '');
    assert.equal(input.classList.contains('invalid'), false);

    dom.window.close();
});

test('builds chords from controls and hides only chord highlights', () => {
    const dom = createApp();
    const document = dom.window.document;

    changeValue(dom, 'chord-root', 'G');
    changeValue(dom, 'chord-type', 'dominant seventh');
    assert.equal(document.getElementById('chord-input').value, 'G7');
    assert.equal(document.getElementById('chord-name').textContent, 'G7');
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
