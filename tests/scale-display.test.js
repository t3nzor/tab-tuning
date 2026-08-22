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
