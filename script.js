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

function inferStringOctaves(pitchClasses) {
    var midiNotes = [];
    for (var i = 0; i < 6; i++) {
        var pc = NOTES.indexOf(pitchClasses[i]);
        var midi = 36 + pc;
        while (i > 0 && midi <= midiNotes[i - 1]) {
            midi += 12;
        }
        midiNotes.push(midi);
    }
    return midiNotes;
}

function renderFretboard() {
    var tuning = getCurrentTuning();
    var stringMidi = inferStringOctaves(tuning);
    var fretboard = document.getElementById('fretboard');
    var html = '';

    for (var s = 5; s >= 0; s--) {
        var openNote = tuning[s];
        var openMidi = stringMidi[s];
        for (var f = 0; f <= 12; f++) {
            var note = noteAt(openNote, f);
            var midi = openMidi + f;
            var classes = ['cell'];
            if (f === 0) classes.push('nut');
            html += '<div class="' + classes.join(' ') + '"><span class="note" data-note="' + note + '" data-midi="' + midi + '">' + note + '</span></div>';
        }
    }

    for (var f = 0; f <= 12; f++) {
        var dots = [3, 5, 7, 9].includes(f) ? 1 : f === 12 ? 2 : 0;
        var dotHtml = '';
        if (dots === 1) dotHtml = '<span class="dot"></span>';
        else if (dots === 2) dotHtml = '<span class="dot"></span><span class="dot"></span>';
        html += '<div class="fret-num">' + f + dotHtml + '</div>';
    }

    fretboard.innerHTML = html;

    if (activePitchClasses) {
        highlightFretboard(activeChordName, activePitchClasses, activeMidiSet);
    }
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

// ---- Audio / Chord Detection ----

var listening = false;
var audioCtx, analyser, mediaStream, intervalId;
var spectrum;
var stabilityWindow = [];
var STABILITY_SIZE = 5;
var STABILITY_THRESHOLD = 3;
var silenceCount = 0;
var lastStableKey = '';
var activePitchClasses = null;
var activeMidiSet = null;
var activeChordName = null;
var hasTonal = typeof Tonal !== 'undefined' && Tonal.Chord;

function freqToMidi(freq) {
    return Math.round(12 * Math.log2(freq / 440) + 69);
}

function findPeaks(spec, sampleRate, fftSize) {
    var binWidth = sampleRate / fftSize;
    var maxDb = -Infinity;
    for (var i = 0; i < spec.length; i++) {
        if (spec[i] > maxDb) maxDb = spec[i];
    }
    var threshold = maxDb - 40;
    var peaks = [];
    for (var i = 1; i < spec.length - 1; i++) {
        if (spec[i] > threshold && spec[i] > spec[i - 1] && spec[i] > spec[i + 1]) {
            var a = spec[i - 1], b = spec[i], c = spec[i + 1];
            var denom = a - 2 * b + c;
            var shift = denom !== 0 ? 0.5 * (a - c) / denom : 0;
            var freq = (i + shift) * binWidth;
            if (freq >= 75 && freq <= 1300) {
                peaks.push({ freq: freq, db: b });
            }
        }
    }
    return peaks;
}

function filterHarmonics(peaks) {
    var result = [];
    for (var i = 0; i < peaks.length; i++) {
        var f = peaks[i].freq;
        var isHarmonic = false;
        for (var j = 0; j < peaks.length; j++) {
            if (i === j) continue;
            var lower = peaks[j].freq;
            if (lower >= f) continue;
            for (var k = 2; k <= 4; k++) {
                if (Math.abs(f - lower * k) / (lower * k) < 0.03) {
                    isHarmonic = true;
                    break;
                }
            }
            if (isHarmonic) break;
        }
        if (!isHarmonic) result.push(peaks[i]);
    }
    return result;
}

function updateStability(midiNotes) {
    var frame = {};
    midiNotes.forEach(function(m) { frame[m] = true; });
    stabilityWindow.push(frame);
    if (stabilityWindow.length > STABILITY_SIZE) {
        stabilityWindow.shift();
    }
    var counts = {};
    stabilityWindow.forEach(function(f) {
        Object.keys(f).forEach(function(m) {
            counts[m] = (counts[m] || 0) + 1;
        });
    });
    var stable = [];
    Object.keys(counts).forEach(function(m) {
        if (counts[m] >= STABILITY_THRESHOLD) {
            stable.push(parseInt(m));
        }
    });
    return stable.sort(function(a, b) { return a - b; });
}

function detectChord(midiNotes) {
    var pitchClasses = [];
    var seen = {};
    midiNotes.forEach(function(midi) {
        var pc = NOTES[midi % 12];
        if (!seen[pc]) {
            seen[pc] = true;
            pitchClasses.push(pc);
        }
    });
    if (pitchClasses.length < 2 || !hasTonal) return null;
    var detected = Tonal.Chord.detect(pitchClasses);
    if (!detected || detected.length === 0) return null;
    return detected[0];
}

function highlightFretboard(chordName, pitchClasses, midiSet) {
    var root = null;
    if (chordName && hasTonal) {
        var info = Tonal.Chord.get(chordName);
        root = info.tonic;
    }
    var notes = document.querySelectorAll('.fretboard .note');
    for (var i = 0; i < notes.length; i++) {
        var el = notes[i];
        var pc = el.getAttribute('data-note');
        var midi = parseInt(el.getAttribute('data-midi'));
        el.classList.remove('chord-tone', 'chord-root', 'exact-pitch');
        if (pitchClasses.has(pc)) {
            if (pc === root) {
                el.classList.add('chord-root');
            } else {
                el.classList.add('chord-tone');
            }
        }
        if (midiSet.has(midi)) {
            el.classList.add('exact-pitch');
        }
    }
}

function clearHighlights() {
    var notes = document.querySelectorAll('.fretboard .note');
    for (var i = 0; i < notes.length; i++) {
        notes[i].classList.remove('chord-tone', 'chord-root', 'exact-pitch');
    }
}

function updateStatus(chordName, midiNotes) {
    var chordEl = document.getElementById('chord-name');
    var notesEl = document.getElementById('detected-notes');
    chordEl.textContent = chordName || '';
    if (midiNotes && midiNotes.length > 0) {
        notesEl.textContent = midiNotes.map(function(m) {
            return NOTES[m % 12] + (Math.floor(m / 12) - 1);
        }).join(' ');
    } else {
        notesEl.textContent = '';
    }
}

function analyze() {
    if (!analyser) return;
    if (!spectrum || spectrum.length !== analyser.frequencyBinCount) {
        spectrum = new Float32Array(analyser.frequencyBinCount);
    }
    analyser.getFloatFrequencyData(spectrum);

    var sampleRate = audioCtx.sampleRate;
    var fftSize = analyser.fftSize;
    var peaks = findPeaks(spectrum, sampleRate, fftSize);

    if (peaks.length === 0) {
        silenceCount++;
        if (silenceCount > 15 && activePitchClasses) {
            activePitchClasses = null;
            activeMidiSet = null;
            activeChordName = null;
            clearHighlights();
            updateStatus(null, []);
            lastStableKey = '';
        }
        return;
    }
    silenceCount = 0;

    peaks = filterHarmonics(peaks);
    var midiNotes = peaks.map(function(p) { return freqToMidi(p.freq); });
    var stable = updateStability(midiNotes);

    var stableKey = stable.join(',');
    if (stableKey === lastStableKey) return;
    lastStableKey = stableKey;

    if (stable.length === 0) {
        activePitchClasses = null;
        activeMidiSet = null;
        activeChordName = null;
        clearHighlights();
        updateStatus(null, []);
        return;
    }

    var pitchClasses = new Set();
    stable.forEach(function(m) { pitchClasses.add(NOTES[m % 12]); });

    var chordName = detectChord(stable);

    activePitchClasses = pitchClasses;
    activeMidiSet = new Set(stable);
    activeChordName = chordName;

    updateStatus(chordName, stable);
    highlightFretboard(chordName, pitchClasses, activeMidiSet);
}

function startListening() {
    navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false }
    }).then(function(stream) {
        mediaStream = stream;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32768;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        listening = true;
        document.getElementById('listen-btn').textContent = 'Stop';
        document.getElementById('listen-btn').classList.add('listening');

        silenceCount = 0;
        stabilityWindow = [];
        lastStableKey = '';
        activePitchClasses = null;
        activeMidiSet = null;
        activeChordName = null;

        intervalId = setInterval(analyze, 100);
    }).catch(function(err) {
        console.error('Mic access denied:', err);
        document.getElementById('chord-name').textContent = 'Mic access denied';
    });
}

function stopListening() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (mediaStream) {
        mediaStream.getTracks().forEach(function(t) { t.stop(); });
        mediaStream = null;
    }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    analyser = null;
    spectrum = null;
    listening = false;
    document.getElementById('listen-btn').textContent = 'Listen';
    document.getElementById('listen-btn').classList.remove('listening');
    clearHighlights();
    updateStatus(null, []);
    activePitchClasses = null;
    activeMidiSet = null;
    activeChordName = null;
    stabilityWindow = [];
    silenceCount = 0;
    lastStableKey = '';
}

function initListen() {
    var btn = document.getElementById('listen-btn');
    btn.addEventListener('click', function() {
        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    });
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', function() {
    initPresetSelect();
    initStringSelects();
    initListen();

    var presetSelect = document.getElementById('preset');
    presetSelect.addEventListener('change', function() {
        applyPreset(presetSelect.value);
        renderFretboard();
    });

    applyPreset('standard');
    presetSelect.value = 'standard';
    renderFretboard();
});
