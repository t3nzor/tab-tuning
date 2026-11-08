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
    majorThirds: ['G', 'B', 'D#', 'G', 'B', 'D#'],
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
    majorThirds: 'Major Thirds (G B D# G B D#)',
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
    renderOpenChords();
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
var showStickers = false;

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

var OPEN_TYPES = [
    'major',
    'minor',
    'dominant seventh',
    'major seventh',
    'minor seventh',
    'suspended second',
    'suspended fourth',
    'diminished',
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
    renderFingering();
}

function clearHighlights() {
    var notes = document.querySelectorAll('.fretboard .note');
    for (var i = 0; i < notes.length; i++) {
        notes[i].classList.remove('chord-tone', 'chord-root', 'scale-tone', 'scale-root');
    }
    clearFingering();
}

function clearFingering() {
    var marked = document.querySelectorAll('.fretboard .note.finger-pos, .fretboard .note.voicing-open');
    for (var i = 0; i < marked.length; i++) {
        marked[i].classList.remove('finger-pos');
        marked[i].classList.remove('voicing-open');
    }
    var muted = document.querySelectorAll('.fretboard .cell.muted-string, .fretboard .cell.fretted-string');
    for (var m = 0; m < muted.length; m++) {
        muted[m].classList.remove('muted-string');
        muted[m].classList.remove('fretted-string');
    }
    var marks = document.querySelectorAll('.fretboard .mute-mark');
    for (var k = 0; k < marks.length; k++) {
        marks[k].parentNode.removeChild(marks[k]);
    }
    var lines = document.querySelectorAll('.fretboard .barre-line');
    for (var b = 0; b < lines.length; b++) {
        lines[b].parentNode.removeChild(lines[b]);
    }
}

var FRET_CELL_HEIGHT = 2.5;
var BOARD_PAD_TOP = 0.5;

function renderBarreLine(fret, strings, stringCount) {
    var board = document.getElementById('fretboard');
    if (!board) return;
    var minS = strings[0];
    var maxS = strings[0];
    for (var i = 1; i < strings.length; i++) {
        if (strings[i] < minS) minS = strings[i];
        if (strings[i] > maxS) maxS = strings[i];
    }
    var topRow = stringCount - 1 - maxS;
    var span = maxS - minS + 1;
    var colPct = 100 / (NUM_FRETS + 1);
    var line = document.createElement('span');
    line.className = 'barre-line';
    line.setAttribute('data-fret', String(fret));
    line.setAttribute('data-from-string', String(stringCount - maxS));
    line.setAttribute('data-to-string', String(stringCount - minS));
    line.style.left = (fret * colPct) + '%';
    line.style.width = colPct + '%';
    line.style.top = (BOARD_PAD_TOP + topRow * FRET_CELL_HEIGHT) + 'rem';
    line.style.height = (span * FRET_CELL_HEIGHT) + 'rem';
    board.appendChild(line);
}

// A flat finger can't cross a sounded string fretted lower than the barre
// fret (or an open string) without pressing it down — such spans must show
// individual dots instead of a barre line.
function barreFingerable(fret, strings, voicing) {
    var minS = strings[0];
    var maxS = strings[0];
    for (var i = 1; i < strings.length; i++) {
        if (strings[i] < minS) minS = strings[i];
        if (strings[i] > maxS) maxS = strings[i];
    }
    for (var s = minS + 1; s < maxS; s++) {
        if (voicing[s] && voicing[s][1] < fret) return false;
    }
    return true;
}

function renderFingering() {
    clearFingering();
    if (!activeChord || !activeChord.ordered || !showChord) return;
    var tuning = getCurrentTuning();
    var tones = activeChord.ordered;
    var requiredMask = (1 << tones.length) - 1;
    // 7th chords and richer may drop the 5th (the classic open C7 omits G);
    // triads keep full coverage — a triad without its 5th is half a chord.
    if (tones.length >= 4) {
        var fifth = toSharp(noteAt(activeChord.tonic, 7));
        var fifthIdx = tones.indexOf(fifth);
        if (fifthIdx !== -1) requiredMask &= ~(1 << fifthIdx);
    }
    var voicing = openVoicingBest(tuning, tones, activeChord.tonic, OPEN_DISPLAY_MIN_OPEN_STRINGS, OPEN_MAX_FRET, requiredMask);
    if (!voicing) return;
    var cells = document.querySelectorAll('.fretboard .cell');
    if (!cells.length) return;
    var barreStrings = {};
    for (var i = 0; i < voicing.length; i++) {
        if (voicing[i] && voicing[i][1] > 0) {
            var fret = voicing[i][1];
            if (!barreStrings[fret]) barreStrings[fret] = [];
            barreStrings[fret].push(i);
        }
    }
    for (var s = 0; s < tuning.length; s++) {
        var row = tuning.length - 1 - s;
        var index = row * (NUM_FRETS + 1);
        if (!voicing[s]) {
            cells[index].classList.add('muted-string');
            var mark = document.createElement('span');
            mark.className = 'mute-mark';
            mark.textContent = '×';
            cells[index].appendChild(mark);
        } else if (voicing[s][1] > 0) {
            cells[index].classList.add('fretted-string');
            var group = barreStrings[voicing[s][1]];
            var asBarre = group.length >= 3 && barreFingerable(voicing[s][1], group, voicing);
            if (!asBarre) {
                cells[index + voicing[s][1]].querySelector('.note').classList.add('finger-pos');
            }
        } else {
            cells[index].querySelector('.note').classList.add('voicing-open');
        }
    }
    Object.keys(barreStrings).forEach(function(f) {
        var group = barreStrings[f];
        if (group.length >= 3 && barreFingerable(Number(f), group, voicing)) {
            renderBarreLine(Number(f), group, tuning.length);
        }
    });
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
    activeChord = { notes: notesSet, tonic: tonic, label: symbol.trim(), ordered: notes };
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
    activeScale = { notes: notesSet, tonic: tonic, label: label, type: typeName, ordered: displayNotes };
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
        renderDiatonicChords();
        renderOpenChords();
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
    renderDiatonicChords();
    renderOpenChords();
}

var PENTATONIC_PARENTS = {
    'major pentatonic': 'major',
    'minor pentatonic': 'minor',
    'minor blues': 'minor',
    'major blues': 'major',
};

var ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function buildTriads(sevenNotes, filterSet) {
    var chords = [];
    var qualities = {
        '4,7': ['', false, ''],
        '3,7': ['m', true, ''],
        '3,6': ['dim', true, '°'],
        '4,8': ['aug', false, '+'],
    };
    var semi = function(n) { return NOTES.indexOf(toSharp(n)); };
    for (var d = 0; d < 7; d++) {
        var root = sevenNotes[d];
        if (filterSet && !filterSet.has(toSharp(root))) continue;
        var third = sevenNotes[(d + 2) % 7];
        var fifth = sevenNotes[(d + 4) % 7];
        var t = (semi(third) - semi(root) + 12) % 12;
        var f = (semi(fifth) - semi(root) + 12) % 12;
        var q = qualities[t + ',' + f];
        if (!q) continue;
        var numeral = ROMAN_NUMERALS[d];
        if (q[1]) numeral = numeral.toLowerCase();
        numeral += q[2];
        chords.push({ symbol: root + q[0], numeral: numeral });
    }
    return chords;
}

function getDiatonicChords() {
    if (!activeScale || !activeScale.ordered) return [];
    var ordered = activeScale.ordered;
    if (ordered.length === 7) return buildTriads(ordered, null);
    var parentType = PENTATONIC_PARENTS[activeScale.type];
    if (!parentType || !hasTonal) return [];
    var parent = Tonal.Scale.get(activeScale.tonic + ' ' + parentType);
    if (parent.empty || !parent.tonic) return [];
    return buildTriads(parent.notes, activeScale.notes);
}

function renderDiatonicChords() {
    var labelEl = document.getElementById('diatonic-label');
    var listEl = document.getElementById('diatonic-list');
    var chords = getDiatonicChords();
    if (!activeScale || !chords.length) {
        labelEl.textContent = '';
        listEl.innerHTML = '';
        return;
    }
    var label = 'Diatonic chords in ' + activeScale.label;
    if (activeScale.ordered.length !== 7) {
        label += ' (numbered from ' + activeScale.tonic + ' ' + formatScaleName(PENTATONIC_PARENTS[activeScale.type]) + ')';
    }
    labelEl.textContent = label + ':';
    var html = '';
    chords.forEach(function(c) {
        var isActive = activeChord && activeChord.label === c.symbol;
        html += '<button class="match-chip' + (isActive ? ' active' : '') + '" data-symbol="' + c.symbol + '">' + c.numeral + ' · ' + c.symbol + '</button>';
    });
    listEl.innerHTML = html;
    var buttons = listEl.querySelectorAll('.match-chip');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            var symbol = this.getAttribute('data-symbol');
            document.getElementById('chord-input').value = symbol;
            applyChord(symbol);
        });
    }
}

var OPEN_MAX_FRET = 12;
var OPEN_MIN_OPEN_STRINGS = 0;
var OPEN_MAX_FINGERS = 4;
var OPEN_MAX_SPAN = 3;
var OPEN_DISPLAY_MIN_OPEN_STRINGS = 0;

function openVoicingReachable(tuning, tones, maxFret) {
    for (var t = 0; t < tones.length; t++) {
        var reachable = false;
        for (var ts = 0; ts < tuning.length && !reachable; ts++) {
            for (var tf = 0; tf <= maxFret && !reachable; tf++) {
                if (noteAt(tuning[ts], tf) === tones[t]) reachable = true;
            }
        }
        if (!reachable) return false;
    }
    return true;
}

// Enumerate every valid fingerable voicing: all required tones covered on
// distinct strings, contiguous sounded block, fret span <= OPEN_MAX_SPAN, at
// most OPEN_MAX_FINGERS fingers counting barres (strings at the same fret
// share one finger), at least minOpens open strings, frets <= maxFret.
// requiredMask limits which tones must be covered (bit i set = tones[i]
// required); bits outside it may still be covered but aren't mandatory.
// callback(voicing) returning true stops the search.
function openVoicingEach(tuning, tones, minOpens, maxFret, callback, requiredMask) {
    var n = tuning.length;
    if (requiredMask === undefined) requiredMask = (1 << tones.length) - 1;
    if (!openVoicingReachable(tuning, tones, maxFret)) return;
    var options = new Array(n);
    for (var s = 0; s < n; s++) {
        var openIdx = NOTES.indexOf(tuning[s]);
        var opts = [null];
        for (var ti = 0; ti < tones.length; ti++) {
            var base = ((NOTES.indexOf(tones[ti]) - openIdx) % 12 + 12) % 12;
            if (base <= maxFret) opts.push([ti, base]);
            if (base !== 0 && base + 12 <= maxFret) opts.push([ti, base + 12]);
        }
        options[s] = opts;
    }
    var chosen = new Array(n);
    var fretStrings = {};
    var frets = [];
    var covered = 0;
    var opens = [];
    var sounded = 0;
    var first = -1;
    var last = -1;
    var stopped = false;

    function uncoveredRequired() {
        var uncovered = 0;
        var missing = ~covered & requiredMask;
        for (; missing; missing &= missing - 1) uncovered++;
        return uncovered;
    }

    function pruned(s) {
        var remaining = n - s;
        if (uncoveredRequired() > remaining) return true;
        if (opens.length + remaining < minOpens) return true;
        if (frets.length > OPEN_MAX_FINGERS) return true;
        if (frets.length) {
            var lo = frets[0];
            var hi = frets[0];
            for (var i = 1; i < frets.length; i++) {
                if (frets[i] < lo) lo = frets[i];
                if (frets[i] > hi) hi = frets[i];
            }
            if (hi - lo > OPEN_MAX_SPAN) return true;
        }
        return false;
    }

    function leaf() {
        if ((covered & requiredMask) !== requiredMask) return false;
        if (opens.length < minOpens) return false;
        if (last - first !== sounded - 1) return false;
        if (frets.length > 1) {
            var lo = frets[0];
            var hi = frets[0];
            for (var i = 1; i < frets.length; i++) {
                if (frets[i] < lo) lo = frets[i];
                if (frets[i] > hi) hi = frets[i];
            }
            if (hi - lo > OPEN_MAX_SPAN) return false;
        }
        if (frets.length > OPEN_MAX_FINGERS) return false;
        return callback(chosen.slice());
    }

    function search(s) {
        if (stopped) return;
        if (s === n) {
            if (leaf()) stopped = true;
            return;
        }
        if (pruned(s)) return;
        var opts = options[s];
        for (var j = 0; j < opts.length && !stopped; j++) {
            var opt = opts[j];
            chosen[s] = opt;
            if (opt) {
                var fret = opt[1];
                var bit = 1 << opt[0];
                var hadBit = (covered & bit) !== 0;
                covered |= bit;
                sounded++;
                var prevFirst = first;
                var prevLast = last;
                if (first === -1) first = s;
                last = s;
                if (fret === 0) {
                    opens.push(s);
                    search(s + 1);
                    opens.pop();
                } else {
                    var arr = fretStrings[fret];
                    if (!arr) { arr = []; fretStrings[fret] = arr; frets.push(fret); }
                    arr.push(s);
                    search(s + 1);
                    arr.pop();
                    if (!arr.length) {
                        delete fretStrings[fret];
                        frets.splice(frets.indexOf(fret), 1);
                    }
                }
                sounded--;
                first = prevFirst;
                last = prevLast;
                if (!hadBit) covered &= ~bit;
            } else {
                search(s + 1);
            }
        }
        chosen[s] = null;
    }

    search(0);
}

function openVoicingExists(tuning, tones) {
    var found = false;
    openVoicingEach(tuning, tones, OPEN_MIN_OPEN_STRINGS, OPEN_MAX_FRET, function() {
        found = true;
        return true;
    });
    return found;
}

function openScoreLess(a, b) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] < b[i]) return true;
        if (a[i] > b[i]) return false;
    }
    return false;
}

function openVoicingScore(tuning, voicing, tonic) {
    var maxFret = 0;
    var sumFret = 0;
    var sounded = 0;
    var firstSounded = -1;
    var fretStrings = {};
    for (var i = 0; i < voicing.length; i++) {
        var c = voicing[i];
        if (!c) continue;
        sounded++;
        if (firstSounded === -1) firstSounded = i;
        if (c[1] > maxFret) maxFret = c[1];
        sumFret += c[1];
        if (c[1] > 0) {
            if (!fretStrings[c[1]]) fretStrings[c[1]] = [];
            fretStrings[c[1]].push(i);
        }
    }
    var rootBass = noteAt(tuning[firstSounded], voicing[firstSounded][1]) === tonic ? 0 : 1;
    var barrePenalty = 0;
    Object.keys(fretStrings).forEach(function(fret) {
        var strings = fretStrings[fret];
        if (strings.length < 2) return;
        var lo = strings[0];
        var hi = strings[0];
        for (var k = 1; k < strings.length; k++) {
            if (strings[k] < lo) lo = strings[k];
            if (strings[k] > hi) hi = strings[k];
        }
        for (var m = lo + 1; m < hi; m++) {
            if (voicing[m] && voicing[m][1] === 0) barrePenalty++;
        }
    });
    var tiebreak = '';
    for (var j = 0; j < voicing.length; j++) {
        tiebreak += voicing[j] ? (voicing[j][1] < 10 ? '0' + voicing[j][1] : String(voicing[j][1])) : 'xx';
    }
    return [rootBass, maxFret, -sounded, barrePenalty, sumFret, tiebreak];
}

var openVoicingMemo = { key: null, best: null };

function openVoicingBest(tuning, tones, tonic, minOpens, maxFret, requiredMask) {
    var key = tuning.join(',') + '|' + tones.join(',') + '|' + tonic + '|' + minOpens + '|' + maxFret + '|' + requiredMask;
    if (openVoicingMemo.key === key) {
        return openVoicingMemo.best ? openVoicingMemo.best.slice() : null;
    }
    var best = null;
    var bestScore = null;
    openVoicingEach(tuning, tones, minOpens, maxFret, function(voicing) {
        var score = openVoicingScore(tuning, voicing, tonic);
        if (bestScore === null || openScoreLess(score, bestScore)) {
            bestScore = score;
            best = voicing;
        }
        return false;
    }, requiredMask);
    openVoicingMemo.key = key;
    openVoicingMemo.best = best ? best.slice() : null;
    return best ? best.slice() : null;
}

function findOpenChords() {
    if (!hasTonal) return [];
    var tuning = getCurrentTuning();
    var rows = [];
    NOTES.forEach(function(root) {
        var cells = [];
        OPEN_TYPES.forEach(function(typeName) {
            var entry = CHORD_TYPES.find(function(t) { return t.name === typeName; });
            var symbol = null;
            var chord = Tonal.Chord.get(root + entry.symbol);
            if (!chord.empty && chord.tonic) {
                var tones = [];
                chord.notes.map(toSharp).forEach(function(n) {
                    if (tones.indexOf(n) === -1) tones.push(n);
                });
                if (openVoicingExists(tuning, tones)) symbol = root + entry.symbol;
            }
            cells.push(symbol);
        });
        rows.push({ root: root, cells: cells });
    });
    return rows;
}

function openTypeLabel(typeName) {
    var entry = CHORD_TYPES.find(function(t) { return t.name === typeName; });
    return entry.symbol || 'maj';
}

function renderOpenChords() {
    var labelEl = document.getElementById('open-chords-label');
    var listEl = document.getElementById('open-chords-list');
    var rows = findOpenChords();
    var any = rows.some(function(row) {
        return row.cells.some(function(symbol) { return symbol !== null; });
    });
    if (!any) {
        labelEl.textContent = '';
        listEl.innerHTML = '';
        return;
    }
    labelEl.textContent = 'Playable chords in ' + getCurrentTuning().join(' ') + ' up to fret ' + OPEN_MAX_FRET + ':';
    var html = '<span class="type-label"></span>';
    OPEN_TYPES.forEach(function(typeName) {
        html += '<span class="type-label">' + openTypeLabel(typeName) + '</span>';
    });
    rows.forEach(function(row) {
        html += '<span class="root-label">' + row.root + '</span>';
        row.cells.forEach(function(symbol) {
            if (symbol) {
                var isActive = activeChord && activeChord.label === symbol;
                html += '<button class="match-chip' + (isActive ? ' active' : '') + '" data-symbol="' + symbol + '">' + symbol + '</button>';
            } else {
                html += '<span class="chip-placeholder"></span>';
            }
        });
    });
    listEl.innerHTML = html;
    var buttons = listEl.querySelectorAll('.match-chip');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            var symbol = this.getAttribute('data-symbol');
            document.getElementById('chord-input').value = symbol;
            applyChord(symbol);
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

    var openMaxFret = document.getElementById('open-max-fret');
    var parsedFret = parseInt(openMaxFret.value, 10);
    if (!isNaN(parsedFret)) OPEN_MAX_FRET = Math.min(Math.max(parsedFret, 0), NUM_FRETS);
    openMaxFret.addEventListener('change', function() {
        var value = parseInt(this.value, 10);
        if (isNaN(value)) value = OPEN_MAX_FRET;
        OPEN_MAX_FRET = Math.min(Math.max(value, 0), NUM_FRETS);
        this.value = OPEN_MAX_FRET;
        renderFretboard();
    });

    var presetSelect = document.getElementById('preset');
    presetSelect.addEventListener('change', function() {
        applyPreset(presetSelect.value);
        renderFretboard();
    });

    applyPreset('standard');
    presetSelect.value = 'standard';
    renderFretboard();

    document.getElementById('show-stickers').addEventListener('change', function() {
        showStickers = this.checked;
        renderFretboard();
    });
});
