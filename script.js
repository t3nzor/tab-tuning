const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const TUNINGS = {
    standard:  ['E', 'A', 'D', 'G', 'B', 'E'],
    dropD:     ['D', 'A', 'D', 'G', 'B', 'E'],
    halfDown:  ['D#', 'G#', 'C#', 'F#', 'A#', 'D#'],
    dropC:     ['C', 'G', 'C', 'F', 'A', 'D'],
    dadgad:    ['D', 'A', 'D', 'G', 'A', 'D'],
    openG:     ['D', 'G', 'D', 'G', 'B', 'D'],
    openD:     ['D', 'A', 'D', 'F#', 'A', 'D'],
    perfect4ths: ['E', 'A', 'D', 'G', 'C', 'F'],
    majorThirds: ['F#', 'A#', 'D', 'F#', 'A#', 'D'],
};

const PRESET_LABELS = {
    standard: 'Standard (E A D G B E)',
    dropD: 'Drop D (D A D G B E)',
    halfDown: 'Half-Step Down (D# G# C# F# A# D#)',
    dropC: 'Drop C (C G C F A D)',
    dadgad: 'DADGAD (D A D G A D)',
    openG: 'Open G (D G D G B D)',
    openD: 'Open D (D A D F# A D)',
    perfect4ths: 'Perfect 4ths (E A D G C F)',
    majorThirds: 'Major Thirds (F# A# D F# A# D)',
    custom: 'Custom',
};

function noteAt(openNote, fret) {
    const idx = NOTES.indexOf(openNote);
    return NOTES[(idx + fret) % 12];
}

function getCurrentTuning() {
    const tuning = [];
    for (let i = 6; i >= 1; i--) {
        tuning.push(document.getElementById('string' + i).value);
    }
    return tuning;
}

function renderFretboard() {
    const tuning = getCurrentTuning();
    const fretboard = document.getElementById('fretboard');
    let html = '';

    for (let s = 5; s >= 0; s--) {
        const openNote = tuning[s];
        for (let f = 0; f <= 12; f++) {
            const note = noteAt(openNote, f);
            const classes = ['cell'];
            if (f === 0) classes.push('nut');
            html += '<div class="' + classes.join(' ') + '"><span class="note">' + note + '</span></div>';
        }
    }

    for (let f = 0; f <= 12; f++) {
        const dots = [3, 5, 7, 9].includes(f) ? 1 : f === 12 ? 2 : 0;
        let dotHtml = '';
        if (dots === 1) dotHtml = '<span class="dot"></span>';
        else if (dots === 2) dotHtml = '<span class="dot"></span><span class="dot"></span>';
        html += '<div class="fret-num">' + f + dotHtml + '</div>';
    }

    fretboard.innerHTML = html;
}

function initPresetSelect() {
    const select = document.getElementById('preset');
    Object.keys(PRESET_LABELS).forEach(function(key) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PRESET_LABELS[key];
        select.appendChild(option);
    });
}

function initStringSelects() {
    const container = document.getElementById('tuning-selects');
    for (let i = 6; i >= 1; i--) {
        const label = document.createElement('label');
        const span = document.createElement('span');
        span.textContent = 'String ' + i;
        const select = document.createElement('select');
        select.id = 'string' + i;
        NOTES.forEach(function(note) {
            const option = document.createElement('option');
            option.value = note;
            option.textContent = note;
            select.appendChild(option);
        });
        select.addEventListener('change', function() {
            document.getElementById('preset').value = 'custom';
            renderFretboard();
        });
        label.appendChild(span);
        label.appendChild(select);
        container.appendChild(label);
    }
}

function applyPreset(preset) {
    if (preset === 'custom') return;
    const tuning = TUNINGS[preset];
    for (let i = 0; i < 6; i++) {
        document.getElementById('string' + (6 - i)).value = tuning[i];
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initPresetSelect();
    initStringSelects();

    var presetSelect = document.getElementById('preset');
    presetSelect.addEventListener('change', function() {
        applyPreset(presetSelect.value);
        renderFretboard();
    });

    applyPreset('standard');
    presetSelect.value = 'standard';
    renderFretboard();
});
