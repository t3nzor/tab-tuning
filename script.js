const NUM_FRETS = 18;

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
    majorThirds: ['F', 'A', 'C#', 'F', 'A', 'C#'],
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
    majorThirds: 'Major Thirds (F A C# F A C#)',
    custom: 'Custom',
};

// ---- Core ----

function noteAt(openNote, fret) {
    var idx = NOTES.indexOf(openNote);
    return NOTES[(idx + fret) % 12];
}

function getCurrentTuning() {
    var tuning = [];
    for (var i = 6; i >= 1; i--) {
        tuning.push(document.getElementById('string' + i).value);
    }
    return tuning;
}

function renderFretboard() {
    var tuning = getCurrentTuning();
    var fretboard = document.getElementById('fretboard');
    var html = '';

    for (var s = 5; s >= 0; s--) {
        var openNote = tuning[s];
        for (var f = 0; f <= NUM_FRETS; f++) {
            var note = noteAt(openNote, f);
            var text = note;
            if (showIntervals) {
                var ref = activeScale ? activeScale.tonic : document.getElementById('scale-root').value;
                if (ref) text = getIntervalName(ref, note);
            }
            var classes = ['cell'];
            if (f === 0) classes.push('nut');
            html += '<div class="' + classes.join(' ') + '"><span class="note" data-note="' + note + '">' + text + '</span></div>';
        }
    }

    for (var f = 0; f <= NUM_FRETS; f++) {
        var markerHtml = '';
        if (showStickers) {
            var colors = ['white', 'red', 'green', 'blue'];
            markerHtml = '<span class="sticker ' + colors[f % 4] + '"></span>';
        } else {
            var dots = [3, 5, 7, 9, 15, 17].includes(f) ? 1 : (f !== 0 && f % 12 === 0) ? 2 : 0;
            if (dots === 1) markerHtml = '<span class="dot"></span>';
            else if (dots === 2) markerHtml = '<span class="dot"></span><span class="dot"></span>';
        }
        html += '<div class="fret-num">' + f + markerHtml + '</div>';
    }

    fretboard.innerHTML = html;
    fretboard.style.gridTemplateColumns = 'repeat(' + (NUM_FRETS + 1) + ', minmax(2.5rem, 1fr))';
    highlightAll();
}

// ---- Presets ----

function initPresetSelect() {
    var select = document.getElementById('preset');
    Object.keys(PRESET_LABELS).forEach(function(key) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = PRESET_LABELS[key];
        select.appendChild(option);
    });
}

function initStringSelects() {
    var container = document.getElementById('tuning-selects');
    for (var i = 6; i >= 1; i--) {
        var label = document.createElement('label');
        var span = document.createElement('span');
        span.textContent = 'String ' + i;
        var select = document.createElement('select');
        select.id = 'string' + i;
        NOTES.forEach(function(note) {
            var option = document.createElement('option');
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
    var tuning = TUNINGS[preset];
    for (var i = 0; i < 6; i++) {
        document.getElementById('string' + (6 - i)).value = tuning[i];
    }
}

// ---- Chord Picker ----

var hasTonal = typeof Tonal !== 'undefined' && Tonal.Chord;
var activeChord = null;
var activeScale = null;
var showChord = true;
var showIntervals = false;
var showStickers = true;

var CHORD_TYPES = [
    { name: 'major', label: 'Major', symbol: '' },
    { name: 'minor', label: 'Minor', symbol: 'm' },
    { name: 'dominant seventh', label: '7', symbol: '7' },
    { name: 'major seventh', label: 'maj7', symbol: 'maj7' },
    { name: 'minor seventh', label: 'm7', symbol: 'm7' },
    { name: 'minor/major seventh', label: 'm(maj7)', symbol: 'mMaj7' },
    { name: 'sixth', label: '6', symbol: '6' },
    { name: 'minor sixth', label: 'm6', symbol: 'm6' },
    { name: 'sixth added ninth', label: '6/9', symbol: '6add9' },
    { name: 'dominant ninth', label: '9', symbol: '9' },
    { name: 'major ninth', label: 'maj9', symbol: 'maj9' },
    { name: 'minor ninth', label: 'm9', symbol: 'm9' },
    { name: 'suspended second', label: 'sus2', symbol: 'sus2' },
    { name: 'suspended fourth', label: 'sus4', symbol: 'sus4' },
    { name: 'suspended fourth seventh', label: '7sus4', symbol: '7sus4' },
    { name: 'diminished', label: 'dim', symbol: 'dim' },
    { name: 'diminished seventh', label: 'dim7', symbol: 'dim7' },
    { name: 'half-diminished', label: 'm7b5', symbol: 'm7b5' },
    { name: 'augmented', label: 'aug', symbol: 'aug' },
    { name: 'fifth', label: '5', symbol: '5' },
];

var SCALE_TYPES = [
    { name: 'major', label: 'Major (Ionian)', short: 'Major' },
    { name: 'minor', label: 'Minor (Aeolian)', short: 'Minor' },
    { name: 'dorian', label: 'Dorian', short: 'Dorian' },
    { name: 'phrygian', label: 'Phrygian', short: 'Phrygian' },
    { name: 'lydian', label: 'Lydian', short: 'Lydian' },
    { name: 'mixolydian', label: 'Mixolydian', short: 'Mixolydian' },
    { name: 'locrian', label: 'Locrian', short: 'Locrian' },
    { name: 'major pentatonic', label: 'Major Pentatonic', short: 'Maj Pent' },
    { name: 'minor pentatonic', label: 'Minor Pentatonic', short: 'Min Pent' },
    { name: 'minor blues', label: 'Blues', short: 'Blues' },
    { name: 'major blues', label: 'Major Blues', short: 'Maj Blues' },
    { name: 'harmonic minor', label: 'Harmonic Minor', short: 'Harm Minor' },
    { name: 'melodic minor', label: 'Melodic Minor', short: 'Mel Minor' },
    { name: 'harmonic major', label: 'Harmonic Major', short: 'Harm Major' },
];

function toSharp(note) {
    var s = Tonal.Note.simplify(note);
    if (s.indexOf('b') !== -1) {
        s = Tonal.Note.enharmonic(s);
    }
    return s;
}

function formatScaleName(typeName) {
    return typeName.replace(/\b\w/g, function(letter) {
        return letter.toUpperCase();
    });
}

var INTERVAL_NAMES = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7'];

function getIntervalName(root, note) {
    var rootIdx = NOTES.indexOf(root);
    var noteIdx = NOTES.indexOf(note);
    var semitones = (noteIdx - rootIdx + 12) % 12;
    return INTERVAL_NAMES[semitones];
}

function displayChord(label, notes) {
    document.getElementById('chord-name').textContent = label || '';
    document.getElementById('detected-notes').textContent = notes ? notes.join(' ') : '';
}

function displayScale(label, notes) {
    document.getElementById('scale-name').textContent = label || '';
    document.getElementById('scale-notes').textContent = notes ? notes.join(' ') : '';
}

function highlightAll() {
    var notes = document.querySelectorAll('.fretboard .note');
    for (var i = 0; i < notes.length; i++) {
        var el = notes[i];
        var pc = el.getAttribute('data-note');
        el.classList.remove('chord-tone', 'chord-root', 'scale-tone', 'scale-root');
        if (activeScale && activeScale.notes.has(pc)) {
            el.classList.add(pc === activeScale.tonic ? 'scale-root' : 'scale-tone');
        }
        if (showChord && activeChord && activeChord.notes.has(pc)) {
            el.classList.add(pc === activeChord.tonic ? 'chord-root' : 'chord-tone');
        }
    }
}

function clearHighlights() {
    var notes = document.querySelectorAll('.fretboard .note');
    for (var i = 0; i < notes.length; i++) {
        notes[i].classList.remove('chord-tone', 'chord-root', 'scale-tone', 'scale-root');
    }
}

function applyChord(symbol) {
    var input = document.getElementById('chord-input');
    if (!symbol || !symbol.trim()) {
        input.classList.remove('invalid');
        activeChord = null;
        clearHighlights();
        displayChord(null, null);
        renderScaleMatches();
        return;
    }
    if (!hasTonal) {
        input.classList.add('invalid');
        activeChord = null;
        clearHighlights();
        displayChord(null, null);
        renderScaleMatches();
        return;
    }
    var chord = Tonal.Chord.get(symbol.trim());
    if (chord.empty || !chord.tonic) {
        input.classList.add('invalid');
        activeChord = null;
        clearHighlights();
        displayChord(null, null);
        renderScaleMatches();
        return;
    }
    input.classList.remove('invalid');
    var tonic = toSharp(chord.tonic);
    var notes = chord.notes.map(toSharp);
    var notesSet = new Set(notes);
    activeChord = { notes: notesSet, tonic: tonic, label: symbol.trim() };
    displayChord(symbol.trim(), notes);
    highlightAll();
    document.getElementById('chord-root').value = tonic;
    var typeEntry = CHORD_TYPES.find(function(t) { return t.name === chord.type; });
    if (typeEntry) {
        document.getElementById('chord-type').value = chord.type;
    }
    renderScaleMatches();
}

function applyScale(root, typeName) {
    if (!typeName) {
        activeScale = null;
        displayScale(null, null);
        renderFretboard();
        renderScaleMatches();
        return;
    }
    if (!hasTonal) {
        activeScale = null;
        displayScale(null, null);
        renderFretboard();
        renderScaleMatches();
        return;
    }
    var scale = Tonal.Scale.get(root + ' ' + typeName);
    if (scale.empty || !scale.tonic) {
        activeScale = null;
        displayScale(null, null);
        renderFretboard();
        renderScaleMatches();
        return;
    }
    var tonic = toSharp(scale.tonic);
    var displayNotes = scale.notes;
    var notesSet = new Set(displayNotes.map(toSharp));
    var label = tonic + ' ' + formatScaleName(typeName);
    activeScale = { notes: notesSet, tonic: tonic, label: label, type: typeName };
    displayScale(label, displayNotes);
    renderFretboard();
    renderScaleMatches();
}

function findScalesForChord(chordNotesSet) {
    var results = [];
    var tonic = activeChord ? activeChord.tonic : null;
    var roots = NOTES.slice();
    if (tonic) {
        var idx = NOTES.indexOf(tonic);
        roots = NOTES.slice(idx).concat(NOTES.slice(0, idx));
    }
    roots.forEach(function(root) {
        SCALE_TYPES.forEach(function(t) {
            var scale = Tonal.Scale.get(root + ' ' + t.name);
            if (scale.empty) return;
            var scaleSet = new Set(scale.notes.map(toSharp));
            var containsAll = true;
            chordNotesSet.forEach(function(n) { if (!scaleSet.has(n)) containsAll = false; });
            if (containsAll) results.push({ root: root, type: t.name, label: root + ' ' + t.short });
        });
    });
    return results;
}

function renderScaleMatches() {
    var labelEl = document.getElementById('matches-label');
    var listEl = document.getElementById('matches-list');
    if (!activeChord) {
        labelEl.textContent = '';
        listEl.innerHTML = '';
        return;
    }
    var matches = findScalesForChord(activeChord.notes);
    labelEl.innerHTML = '<strong>' + activeChord.label + '</strong> appears in ' + matches.length + ' scale' + (matches.length !== 1 ? 's' : '') + ':';
    var html = '';
    matches.forEach(function(m) {
        var isActive = activeScale && activeScale.tonic === m.root && activeScale.type === m.type;
        html += '<button class="match-chip' + (isActive ? ' active' : '') + '" data-root="' + m.root + '" data-type="' + m.type + '">' + m.label + '</button>';
    });
    listEl.innerHTML = html;
    var chips = listEl.querySelectorAll('.match-chip');
    for (var i = 0; i < chips.length; i++) {
        chips[i].addEventListener('click', function() {
            var root = this.getAttribute('data-root');
            var type = this.getAttribute('data-type');
            document.getElementById('scale-root').value = root;
            document.getElementById('scale-type').value = type;
            applyScale(root, type);
            renderScaleMatches();
        });
    }
}

function initChordControls() {
    var rootSelect = document.getElementById('chord-root');
    NOTES.forEach(function(note) {
        var option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        rootSelect.appendChild(option);
    });

    var typeSelect = document.getElementById('chord-type');
    CHORD_TYPES.forEach(function(t) {
        var option = document.createElement('option');
        option.value = t.name;
        option.textContent = t.label;
        typeSelect.appendChild(option);
    });

    var chordInput = document.getElementById('chord-input');

    chordInput.addEventListener('input', function() {
        applyChord(chordInput.value);
    });

    function onSelectChange() {
        var root = rootSelect.value;
        var type = typeSelect.value;
        var entry = CHORD_TYPES.find(function(t) { return t.name === type; });
        var symbol = entry ? root + entry.symbol : root;
        chordInput.value = symbol;
        applyChord(symbol);
    }

    rootSelect.addEventListener('change', onSelectChange);
    typeSelect.addEventListener('change', onSelectChange);

    document.getElementById('show-chord').addEventListener('change', function() {
        showChord = this.checked;
        highlightAll();
    });

    rootSelect.value = 'C';
    typeSelect.value = 'major';
    chordInput.value = 'C';
    applyChord('C');
}

function initScaleControls() {
    var rootSelect = document.getElementById('scale-root');
    NOTES.forEach(function(note) {
        var option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        rootSelect.appendChild(option);
    });

    var typeSelect = document.getElementById('scale-type');
    var noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'None';
    typeSelect.appendChild(noneOption);
    SCALE_TYPES.forEach(function(t) {
        var option = document.createElement('option');
        option.value = t.name;
        option.textContent = t.label;
        typeSelect.appendChild(option);
    });

    rootSelect.addEventListener('change', function() {
        applyScale(rootSelect.value, typeSelect.value);
    });
    typeSelect.addEventListener('change', function() {
        applyScale(rootSelect.value, typeSelect.value);
    });

    document.getElementById('show-intervals').addEventListener('change', function() {
        showIntervals = this.checked;
        renderFretboard();
    });

    rootSelect.value = 'C';
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', function() {
    initPresetSelect();
    initStringSelects();
    initChordControls();
    initScaleControls();

    var presetSelect = document.getElementById('preset');
    presetSelect.addEventListener('change', function() {
        applyPreset(presetSelect.value);
        renderFretboard();
    });

    applyPreset('majorThirds');
    presetSelect.value = 'majorThirds';
    renderFretboard();

    document.getElementById('show-stickers').addEventListener('change', function() {
        showStickers = this.checked;
        renderFretboard();
    });
});
