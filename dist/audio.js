const themes = {
    title: { bpm: 68, root: 48, mode: [0, 2, 3, 5, 7, 8, 10], melody: [0, null, 2, null, 3, null, 2, null, 4, null, 3, 2, 0, null, -2, null], bass: [0, null, null, null, -2, null, null, null, -4, null, null, null, -2, null, null, null], chords: [[0, 2, 4], [-2, 0, 2], [-4, -2, 0], [-2, 0, 3]], texture: 'mist' },
    village: { bpm: 78, root: 48, mode: [0, 2, 3, 5, 7, 8, 10], melody: [0, null, 2, 3, 4, null, 3, null, 2, null, 0, null, -2, 0, null, null], bass: [0, null, null, null, -2, null, null, null, -4, null, null, null, -2, null, null, null], chords: [[0, 2, 4], [-2, 0, 2], [-4, -2, 0], [-2, 0, 3]], texture: 'warm' },
    forest: { bpm: 66, root: 45, mode: [0, 2, 3, 5, 7, 8, 10], melody: [0, null, null, 2, 3, null, null, 2, 4, null, 3, null, 1, null, -2, null], bass: [0, null, null, null, -2, null, null, null, -4, null, null, null, -2, null, null, null], chords: [[0, 2, 4], [-2, 0, 2], [-4, -2, 0], [-2, 0, 3]], texture: 'mist' },
    sanctuary: { bpm: 56, root: 45, mode: [0, 1, 3, 5, 7, 8, 10], melody: [0, null, null, null, 3, null, 2, null, 5, null, null, 3, 1, null, -1, null], bass: [0, null, null, null, -3, null, null, null, -4, null, null, null, -1, null, null, null], chords: [[0, 2, 4], [-3, -1, 1], [-4, -2, 0], [-1, 1, 3]], texture: 'void' },
    marsh: { bpm: 62, root: 43, mode: [0, 2, 3, 5, 7, 8, 10], melody: [0, null, 3, null, 2, 1, null, -2, 0, null, 4, 3, 1, null, -2, null], bass: [0, null, null, null, -4, null, null, null, -2, null, null, null, -5, null, null, null], chords: [[0, 2, 4], [-4, -2, 0], [-2, 0, 2], [-5, -2, 1]], texture: 'mist' },
    spire: { bpm: 52, root: 41, mode: [0, 1, 3, 5, 6, 8, 10], melody: [0, null, 3, null, 5, 3, 1, null, -2, null, 1, 4, null, -1, 0, null], bass: [0, null, null, null, -3, null, null, null, -5, null, null, null, -1, null, null, null], chords: [[0, 2, 4], [-3, -1, 1], [-5, -2, 0], [-1, 1, 3]], texture: 'void' },
    ossuary: { bpm: 58, root: 42, mode: [0, 2, 3, 5, 7, 9, 10], melody: [0, null, 2, null, -1, 0, null, 3, 4, null, 2, 1, -2, null, 0, null], bass: [0, null, null, null, -5, null, null, null, -2, null, null, null, -4, null, null, null], chords: [[0, 2, 4], [-5, -2, 0], [-2, 0, 2], [-4, -1, 1]], texture: 'mist' },
    garden: { bpm: 72, root: 50, mode: [0, 2, 4, 5, 7, 9, 11], melody: [0, 2, null, 4, 3, null, 2, 0, 5, null, 4, 2, 1, null, 0, null], bass: [0, null, null, null, -3, null, null, null, -4, null, null, null, -1, null, null, null], chords: [[0, 2, 4], [-3, 0, 2], [-4, -1, 1], [-1, 1, 3]], texture: 'void' },
    battle: { bpm: 126, root: 45, mode: [0, 2, 3, 5, 7, 8, 10], melody: [0, 0, 4, null, 3, 2, 4, null, 5, 4, 3, 2, 0, null, -2, 0], bass: [0, null, 0, null, -2, null, -2, null, -4, null, -4, null, -2, null, -2, null], chords: [[0, 2, 4], [-2, 0, 2], [-4, -2, 0], [-2, 0, 3]], texture: 'percussion' },
    boss: { bpm: 144, root: 43, mode: [0, 1, 3, 5, 7, 8, 10], melody: [0, null, 3, 2, 1, 0, -2, null, 4, 3, 5, null, 3, 1, 0, -2], bass: [0, null, 0, null, -1, null, -1, null, -4, null, -4, null, -2, null, -2, null], chords: [[0, 2, 4], [-1, 1, 3], [-4, -2, 0], [-2, 0, 2]], texture: 'percussion' }
};
/**
 * Complete original score, A/B/cadence phrases for every audible location and
 * both combat situations. Authored degrees are projected through each scene's
 * original scale; no new audio files or network dependencies are required.
 *
 * Eight phrases comprise A1 / A2 / A3 / A4 / B1 / B2 / B3 / CODA.
 * No randomness is involved, enabling deterministic mastering references.
 */
export const SCORE_SCENES = ['title', 'village', 'forest', 'sanctuary', 'marsh', 'spire', 'ossuary', 'garden', 'battle', 'boss'];
const SCORE_BRIDGES = {
    title: [0, null, 3, null, 2, 1, -1, null, 4, null, 2, 1, 0, null, -2, null],
    village: [0, 2, 3, null, 5, 4, 2, null, 1, null, -1, 0, 2, null, 0, null],
    forest: [-2, null, 0, 2, null, 4, 3, null, 1, null, 2, -1, 0, null, -2, null],
    sanctuary: [0, null, 1, null, 4, 3, null, 2, 5, null, 3, null, 1, 0, -1, null],
    marsh: [-3, 0, null, 2, 1, null, -1, 0, null, 4, 2, 1, -2, null, 0, null],
    spire: [0, null, 5, 4, 2, 1, null, -2, 3, null, 6, 4, 1, null, -1, 0],
    ossuary: [0, null, -2, 1, null, 4, 2, null, 0, -1, null, 3, 2, -2, 0, null],
    garden: [0, 2, 4, 5, null, 3, 2, 1, 6, 5, 3, null, 2, 0, 1, null],
    battle: [0, 3, 4, 5, 4, null, 2, 0, 6, 5, 4, 2, 1, null, 0, 2],
    boss: [0, -2, 1, 4, 5, 3, 1, -1, 6, 4, 3, 2, -2, 1, 0, -1]
};
const SCORE_CADENCES = {
    title: [3, 1, 0, null], village: [4, 2, 0, null], forest: [2, 0, -2, null],
    sanctuary: [3, 1, 0, null], marsh: [1, -2, 0, null], spire: [5, 1, 0, null],
    ossuary: [3, 0, -2, null], garden: [4, 2, 0, null], battle: [4, 2, 0, 0], boss: [5, 3, 1, 0]
};
export const SCORE_IDENTITIES = {
    title: 'The Last Name / prologue', village: 'Iria Remembers / Arken',
    forest: 'Names in the Roots / ashwood', sanctuary: 'The First Word / oath',
    marsh: 'Lives Never Born / Nael', spire: 'The Unwritten Sky / Oriel',
    ossuary: 'Tide of Forgotten Voices / Edda', garden: 'A Spring Without Orders / Silas',
    battle: 'Against Oblivion / encounter', boss: 'The Nullscribe / finale'
};
/** Canonical note projection used by the Web Audio scheduler AND master renderer.
 * Returned arrays are copies so CI and third-party callers cannot mutate music. */
export function scorePhraseNote(scene, step) {
    const t = themes[scene];
    const finite = Number.isFinite(step) ? Math.max(0, Math.floor(step)) : 0;
    const idx = finite % 16, phrase = Math.floor(finite / 16) % 8;
    const section = phrase === 7 ? 'CODA' : phrase >= 4 ? 'B' : 'A';
    const source = section === 'B' ? SCORE_BRIDGES[scene] : t.melody;
    const lead = section === 'CODA' && idx >= 12 ? SCORE_CADENCES[scene][idx - 12] : source[idx];
    const chordIndex = Math.floor(idx / 4), chord = t.chords[section === 'B' ? 3 - chordIndex : chordIndex];
    return { section, phrase, index: idx, lead, bass: t.bass[idx], chord: [...chord], root: t.root, mode: [...t.mode], bpm: t.bpm };
}
/** Exact authored timing, motifs and progressions exposed for deterministic offline reference exports. */
export function scoreCatalog() {
    return SCORE_SCENES.map(scene => ({ scene, title: SCORE_IDENTITIES[scene], bpm: themes[scene].bpm,
        steps: 128, sections: ['A', 'B', 'CODA'], texture: themes[scene].texture,
        signature: SCORE_BRIDGES[scene].map(v => v === null ? '_' : String(v)).join(',') }));
}
/** Ambient soundbed uses one looping seeded-noise buffer, no samples or streaming. */
export function ambienceForScene(scene) {
    switch (scene) {
        case 'forest': return { gain: .14, lowpassHz: 450, modulation: .35 };
        case 'spire': return { gain: .16, lowpassHz: 210, modulation: .23 };
        case 'ossuary': return { gain: .19, lowpassHz: 370, modulation: .42 };
        case 'garden': return { gain: .11, lowpassHz: 490, modulation: .17 };
        case 'marsh': return { gain: .20, lowpassHz: 340, modulation: .48 };
        case 'sanctuary': return { gain: .17, lowpassHz: 240, modulation: .18 };
        case 'village': return { gain: .06, lowpassHz: 650, modulation: .12 };
        case 'battle': return { gain: .045, lowpassHz: 1100, modulation: .1 };
        case 'boss': return { gain: .085, lowpassHz: 310, modulation: .2 };
        default: return { gain: .035, lowpassHz: 600, modulation: .15 };
    }
}
/**
 * Eight-phrase score arc. Harmony stays on the scene's authored scale/chord.
 * The returned state is deterministic, including after a save or scene restart.
 */
export function scoreArrangement(scene, phrase, intensity) {
    const bar = Number.isFinite(phrase) ? ((Math.floor(phrase) % 8) + 8) % 8 : 0;
    const energy = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0;
    const combat = scene === 'battle' || scene === 'boss';
    const registers = [0, 0, 12, 0, -12, 0, 12, 0];
    return {
        leadRegister: registers[bar],
        counterVoice: [false, true, false, true, true, false, true, false][bar],
        counterDegree: bar % 2 === 0 ? 4 : 2,
        percussionFill: combat && bar >= 3 && energy >= .45,
        leadGain: bar === 0 ? .82 : bar === 3 ? 1.06 : bar === 7 ? .75 : bar === 6 ? 1.12 : 1
    };
}
export const MASTERING = { highpassHz: 28, thresholdDb: -18, kneeDb: 12, ratio: 7, attackSeconds: .003, releaseSeconds: .24, outputGain: .84 };
/** Deterministic adaptive balance. Clamped to avoid runaway gain or invalid Web Audio parameters. */
export function scoreMix(scene, intensity) {
    const x = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0;
    const combat = scene === 'battle' || scene === 'boss';
    return {
        lead: 1 + (combat ? .20 : .08) * x,
        bass: 1 + .24 * x,
        pad: combat ? 1 - .30 * x : 1 - .12 * x,
        percussion: combat ? .65 + 1.05 * x : 0,
        ambient: combat ? 1 - .45 * x : 1 + .10 * x
    };
}
export function themeForZone(zone) { return zone; }
export function midiFrequency(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
/** Scaled degree -> chromatic offset, supporting degrees below zero. */
export function degreeSemitone(degree, mode) {
    const octave = Math.floor(degree / 7), index = ((degree % 7) + 7) % 7;
    return octave * 12 + mode[index];
}
export function getThemeSummary(scene) {
    const t = themes[scene];
    return { bpm: t.bpm, steps: t.melody.length, texture: t.texture };
}
export const AUDIO_LIMITS = { musicVoices: 64, effectVoices: 24, retiringBuses: 2, crossfadeSeconds: .65 };
const AZUR_SIGNAL_PATTERNS = {
    warning: [{ frequency: 220, duration: .18, gain: .029, delay: 0 }, { frequency: 165, duration: .26, gain: .033, delay: .21 }],
    victory: [{ frequency: 294, duration: .22, gain: .024, delay: 0 }, { frequency: 370, duration: .22, gain: .025, delay: .15 }, { frequency: 440, duration: .32, gain: .029, delay: .31 }]
};
export function scoreSignal(kind) { return AZUR_SIGNAL_PATTERNS[kind].map(n => ({ ...n })); }
const unitLevel = (value, fallback = 0) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
/** Audio-time scheduling and resource ownership stay independent of rendering FPS. */
export class Sound {
    ctx = null;
    master = null;
    musicMaster = null;
    musicDuck = null;
    duckUntil = 0;
    fxMaster = null;
    echoInput = null;
    bus = null;
    ambience = null;
    ambientFilter = null;
    ambientSource = null;
    windLfo = null;
    windDepth = null;
    enabled = true;
    musicVolume = .38;
    fxVolume = .55;
    scene = 'title';
    intensity = 0;
    timer = null;
    nextAt = 0;
    step = 0;
    lookAhead = .28;
    paused = false;
    disposed = false;
    contextTransition = null;
    voices = new Set();
    retiring = new Map();
    busStartedAt = 0;
    busInitial = true;
    phraseBookmarks = new Map();
    /** Bounded engine counters for QA; no audio nodes or mutable state escape. */
    diagnostics() {
        return { scene: this.scene, step: this.step, musicVoices: [...this.voices].filter(v => v.kind === 'music').length,
            effectVoices: [...this.voices].filter(v => v.kind === 'effect').length, retiringBuses: this.retiring.size,
            scheduling: this.timer !== null, paused: this.paused, disposed: this.disposed, contextState: this.ctx?.state ?? 'uninitialized' };
    }
    get musicScene() { return this.scene; }
    getIntensity() { return this.intensity; }
    get isEnabled() { return this.enabled; }
    getMusicVolume() { return this.musicVolume; }
    getEffectsVolume() { return this.fxVolume; }
    init() {
        if (this.ctx)
            return;
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.enabled ? MASTERING.outputGain : 0;
        // Fixed headroom and a gentle brickwall-style compressor protect mobile speakers
        // from simultaneous elemental FX, bass, and score transients.
        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = MASTERING.highpassHz;
        this.master.connect(highpass);
        if (typeof this.ctx.createDynamicsCompressor === 'function') {
            const limiter = this.ctx.createDynamicsCompressor();
            limiter.threshold.value = MASTERING.thresholdDb;
            limiter.knee.value = MASTERING.kneeDb;
            limiter.ratio.value = MASTERING.ratio;
            limiter.attack.value = MASTERING.attackSeconds;
            limiter.release.value = MASTERING.releaseSeconds;
            highpass.connect(limiter).connect(this.ctx.destination);
        }
        else
            highpass.connect(this.ctx.destination);
        this.musicMaster = this.ctx.createGain();
        this.musicMaster.gain.value = this.musicVolume;
        this.musicDuck = this.ctx.createGain();
        this.musicDuck.gain.value = 1;
        this.musicMaster.connect(this.musicDuck).connect(this.master);
        // Shared low-feedback spatial tail prevents a dry, repetitive chiptune texture.
        // A single delay is cheaper than a convolution impulse on low-end mobile GPUs/CPUs.
        if (typeof this.ctx.createDelay === 'function') {
            const delay = this.ctx.createDelay(.5), feedback = this.ctx.createGain(), wet = this.ctx.createGain();
            delay.delayTime.value = .21;
            feedback.gain.value = .14;
            wet.gain.value = .12;
            delay.connect(feedback).connect(delay);
            delay.connect(wet).connect(this.musicMaster);
            this.echoInput = this.ctx.createGain();
            this.echoInput.gain.value = .20;
            this.echoInput.connect(delay);
        }
        this.fxMaster = this.ctx.createGain();
        this.fxMaster.gain.value = this.fxVolume;
        this.fxMaster.connect(this.master);
        this.newBus(true);
        this.startAmbience();
        this.nextAt = this.ctx.currentTime + .08;
        this.ctx.onstatechange = () => this.updateScheduler();
        this.updateScheduler();
    }
    /** Must be called by a tap/click/keypress; browsers block automatic audio. */
    unlock() {
        if (this.disposed || this.paused || !this.enabled)
            return;
        try {
            this.init();
            this.syncContext();
            this.updateScheduler();
        }
        catch { /* unavailable audio must not interrupt gameplay */ }
    }
    updateScheduler() {
        const active = !this.disposed && !this.paused && this.enabled && this.musicVolume > 0 && this.ctx?.state === 'running';
        if (!active) {
            if (this.timer !== null)
                clearInterval(this.timer);
            this.timer = null;
            return;
        }
        if (this.timer === null)
            this.timer = setInterval(() => this.tick(), 90);
        this.tick();
    }
    /** Serialize browser promises so rapid hide/show/mute cannot leave a stale suspension. */
    syncContext() {
        const ctx = this.ctx;
        if (!ctx || this.disposed || this.contextTransition)
            return;
        const wantsRunning = this.enabled && !this.paused;
        if ((wantsRunning && ctx.state === 'running') || (!wantsRunning && ctx.state === 'suspended') || ctx.state === 'closed')
            return;
        let operation;
        try {
            operation = wantsRunning ? ctx.resume() : ctx.suspend();
        }
        catch {
            return;
        }
        this.contextTransition = operation.then(() => {
            this.contextTransition = null;
            if (this.ctx !== ctx || this.disposed)
                return;
            this.updateScheduler();
            // A later player/visibility action may have reversed the requested state.
            if (wantsRunning !== (this.enabled && !this.paused))
                this.syncContext();
        }, () => { this.contextTransition = null; this.updateScheduler(); });
    }
    setEnabled(v) {
        this.enabled = v;
        if (this.ctx && this.master)
            this.master.gain.setTargetAtTime(v ? MASTERING.outputGain : 0, this.ctx.currentTime, .07);
        this.syncContext();
        this.updateScheduler();
    }
    setMusicVolume(v) {
        this.musicVolume = unitLevel(v);
        if (this.ctx && this.musicMaster)
            this.musicMaster.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, .05);
        this.updateScheduler();
    }
    setEffectsVolume(v) { this.fxVolume = unitLevel(v); if (this.ctx && this.fxMaster)
        this.fxMaster.gain.setTargetAtTime(this.fxVolume, this.ctx.currentTime, .05); }
    setIntensity(value) {
        const next = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
        if (Math.abs(next - this.intensity) < .02)
            return;
        this.intensity = next;
        this.setAmbience();
    }
    setScene(scene) {
        if (this.scene === scene)
            return;
        if (this.scene !== 'battle' && this.scene !== 'boss' && this.scene !== 'title')
            this.phraseBookmarks.set(this.scene, this.step);
        this.scene = scene;
        this.step = this.phraseBookmarks.get(scene) ?? 0;
        this.intensity = scene === 'boss' ? .65 : scene === 'battle' ? .35 : 0;
        if (!this.ctx || this.disposed)
            return;
        this.newBus(false);
        this.setAmbience();
        this.nextAt = this.ctx.currentTime + .08;
        this.tick();
    }
    startAmbience() {
        const ctx = this.ctx;
        if (!ctx || !this.musicMaster)
            return;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), samples = buffer.getChannelData(0);
        let seed = 11235813;
        for (let i = 0; i < samples.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
            samples[i] = ((seed >>> 0) / 4294967295) * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = .6;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(filter).connect(gain).connect(this.musicMaster);
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = .18;
        depth.gain.value = 0;
        lfo.connect(depth).connect(gain.gain);
        lfo.start();
        src.start();
        this.ambientSource = src;
        this.ambientFilter = filter;
        this.ambience = gain;
        this.windLfo = lfo;
        this.windDepth = depth;
        this.setAmbience();
    }
    setAmbience() {
        const ctx = this.ctx;
        if (!ctx || !this.ambience || !this.ambientFilter)
            return;
        const a = ambienceForScene(this.scene);
        const mix = scoreMix(this.scene, this.intensity);
        this.ambience.gain.setTargetAtTime(a.gain * mix.ambient, ctx.currentTime, .65);
        this.windDepth?.gain.setTargetAtTime(a.gain * a.modulation * mix.ambient, ctx.currentTime, .65);
        this.ambientFilter.frequency.setTargetAtTime(a.lowpassHz, ctx.currentTime, .6);
    }
    releaseVoice(voice, stop = false) {
        if (!this.voices.delete(voice))
            return;
        voice.source.onended = null;
        if (stop)
            try {
                voice.source.stop();
            }
            catch { /* already ended */ }
        for (const node of voice.nodes)
            node.disconnect();
    }
    releaseBus(bus) {
        for (const voice of this.voices)
            if (voice.bus === bus)
                this.releaseVoice(voice, true);
        bus.disconnect();
        this.retiring.delete(bus);
    }
    collect(now) {
        for (const voice of this.voices)
            if (voice.end <= now)
                this.releaseVoice(voice);
        for (const [bus, end] of this.retiring)
            if (end <= now)
                this.releaseBus(bus);
    }
    trackVoice(voice) {
        this.voices.add(voice);
        voice.source.onended = () => this.releaseVoice(voice);
    }
    hasVoiceRoom(kind) {
        if (this.ctx)
            this.collect(this.ctx.currentTime);
        let count = 0;
        for (const voice of this.voices)
            if (voice.kind === kind)
                count++;
        return count < (kind === 'music' ? AUDIO_LIMITS.musicVoices : AUDIO_LIMITS.effectVoices);
    }
    newBus(initial) {
        if (!this.ctx || !this.musicMaster)
            return;
        const now = this.ctx.currentTime, old = this.bus;
        this.collect(now);
        // Audio-time expiry survives background timer throttling. Rapid scene changes
        // cannot accumulate hundreds of connected graphs during the crossfade window.
        while (this.retiring.size >= AUDIO_LIMITS.retiringBuses)
            this.releaseBus(this.retiring.keys().next().value);
        const next = this.ctx.createGain();
        next.gain.setValueAtTime(initial ? 1 : 0, now);
        if (!initial)
            next.gain.linearRampToValueAtTime(1, now + AUDIO_LIMITS.crossfadeSeconds);
        next.connect(this.musicMaster);
        if (this.echoInput)
            next.connect(this.echoInput);
        this.bus = next;
        if (old) {
            const level = this.busInitial ? 1 : Math.max(0, Math.min(1, (now - this.busStartedAt) / AUDIO_LIMITS.crossfadeSeconds));
            old.gain.cancelScheduledValues(now);
            old.gain.setValueAtTime(level, now);
            old.gain.linearRampToValueAtTime(0, now + AUDIO_LIMITS.crossfadeSeconds);
            this.retiring.set(old, now + AUDIO_LIMITS.crossfadeSeconds);
        }
        this.busStartedAt = now;
        this.busInitial = initial;
    }
    note(midi, at, duration, kind, volume) {
        const c = this.ctx, bus = this.bus;
        if (!c || !bus || !this.enabled || this.paused || this.disposed || this.musicVolume === 0 || !this.hasVoiceRoom('music'))
            return;
        const oscillator = c.createOscillator(), gain = c.createGain();
        oscillator.type = kind === 'bass' ? 'triangle' : kind === 'lead' ? 'sine' : kind === 'pad' ? 'triangle' : kind === 'bell' ? 'sine' : 'square';
        const freq = midiFrequency(midi);
        oscillator.frequency.setValueAtTime(freq, at);
        if (kind === 'bell')
            oscillator.frequency.exponentialRampToValueAtTime(freq * .998, at + duration);
        const attack = kind === 'pad' ? .12 : .01, release = kind === 'pad' ? .38 : kind === 'bass' ? .12 : .16;
        const end = at + Math.max(duration, attack + .03), stop = end + release;
        gain.gain.setValueAtTime(.00001, at);
        gain.gain.linearRampToValueAtTime(volume, at + attack);
        gain.gain.setValueAtTime(volume * .72, end);
        gain.gain.exponentialRampToValueAtTime(.00001, stop);
        const nodes = [oscillator, gain];
        let output = oscillator;
        if (kind === 'bass' || kind === 'pad') {
            const filter = c.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(kind === 'bass' ? 650 : 1100, at);
            output.connect(filter);
            output = filter;
            nodes.push(filter);
        }
        output.connect(gain).connect(bus);
        oscillator.start(at);
        oscillator.stop(stop + .02);
        this.trackVoice({ source: oscillator, nodes, bus, end: stop + .02, kind: 'music' });
    }
    tick() {
        const c = this.ctx;
        if (!c || c.state !== 'running' || !this.enabled || this.paused || this.disposed || this.musicVolume === 0)
            return;
        this.collect(c.currentTime);
        if (this.nextAt < c.currentTime - .08)
            this.nextAt = c.currentTime + .08;
        let queued = 0;
        while (this.nextAt < c.currentTime + this.lookAhead && queued++ < 12) {
            const t = themes[this.scene], step = this.step, score = scorePhraseNote(this.scene, step), idx = score.index, stepDuration = 60 / t.bpm / 2;
            const chord = score.chord;
            const mix = scoreMix(this.scene, this.intensity);
            const arrangement = scoreArrangement(this.scene, Math.floor(step / 16), this.intensity);
            const lead = score.lead, bass = score.bass;
            if (lead != null) {
                this.note(t.root + 24 + arrangement.leadRegister + degreeSemitone(lead, t.mode), this.nextAt, stepDuration * (this.scene === 'battle' ? .83 : 1.55), 'lead', (t.texture === 'percussion' ? .045 : .032) * mix.lead * arrangement.leadGain);
            }
            if (bass != null)
                this.note(t.root - 12 + degreeSemitone(bass, t.mode), this.nextAt, stepDuration * 3.5, 'bass', .048 * mix.bass);
            if (idx % 4 === 0) {
                for (const degree of chord)
                    this.note(t.root + 12 + degreeSemitone(degree, t.mode), this.nextAt, stepDuration * 3.55, 'pad', (t.texture === 'void' ? .018 : .010) * mix.pad);
            }
            if (t.texture === 'percussion' && idx % 2 === 0)
                this.note(t.root - 24, this.nextAt, .035, 'perc', .014 * mix.percussion);
            if (t.texture === 'percussion' && this.intensity >= .55 && idx % 4 === 2)
                this.note(t.root + 12 + degreeSemitone(chord[2], t.mode), this.nextAt, stepDuration * .75, 'bell', .012 * this.intensity);
            if (arrangement.counterVoice && idx === 10)
                this.note(t.root + 24 + degreeSemitone(chord[arrangement.counterDegree === 4 ? 2 : 1], t.mode), this.nextAt, stepDuration * 2, 'bell', .009 * mix.lead);
            if (arrangement.percussionFill && idx === 15)
                this.note(t.root - 12, this.nextAt, stepDuration * .22, 'perc', .011 * mix.percussion);
            if (t.texture === 'mist' && idx % 8 === 6)
                this.note(t.root + 36 + degreeSemitone(chord[1], t.mode), this.nextAt, stepDuration * 2.1, 'bell', .017);
            this.step++;
            this.nextAt += stepDuration;
        }
    }
    tone(freq, duration = .12, type = 'sine', volume = .04, delay = 0) {
        if (!this.enabled || this.paused || this.disposed || this.fxVolume === 0)
            return;
        if (![freq, duration, volume, delay].every(Number.isFinite))
            return;
        try {
            this.unlock();
            const c = this.ctx;
            if (!c || !this.fxMaster || !this.hasVoiceRoom('effect'))
                return;
            const at = c.currentTime + Math.max(0, Math.min(2, delay)), length = Math.max(.02, Math.min(3, duration));
            const o = c.createOscillator(), g = c.createGain();
            o.type = type;
            o.frequency.setValueAtTime(Math.max(20, Math.min(20000, freq)), at);
            g.gain.setValueAtTime(.00001, at);
            g.gain.linearRampToValueAtTime(Math.max(.00001, Math.min(.15, volume)), at + .008);
            g.gain.exponentialRampToValueAtTime(.00001, at + length);
            o.connect(g).connect(this.fxMaster);
            o.start(at);
            o.stop(at + length + .02);
            this.trackVoice({ source: o, nodes: [o, g], bus: this.fxMaster, end: at + length + .02, kind: 'effect' });
            // Shared envelope: overlapping effects extend one recovery instead of stacking gain.
            if (this.musicDuck) {
                const gain = this.musicDuck.gain, now = c.currentTime;
                if (typeof gain.cancelAndHoldAtTime === 'function')
                    gain.cancelAndHoldAtTime(now);
                else {
                    gain.cancelScheduledValues(now);
                    gain.setValueAtTime(gain.value, now);
                }
                this.duckUntil = Math.max(this.duckUntil, at + length);
                gain.setTargetAtTime(.68, now, .025);
                gain.setTargetAtTime(1, this.duckUntil, .18);
            }
        }
        catch { /* browser audio unavailable */ }
    }
    /** Original short musical punctuation. Leaves the existing scene score, headroom,
     * voice caps and audio lifecycle intact; no downloaded samples are needed. */
    storySting(kind) {
        const patterns = {
            arrival: [196, 247, 294, 392], memory: [220, 261, 329, 392],
            oath: [196, 294, 370, 494], reckoning: [146, 220, 277, 440],
            afterlight: [247, 329, 392, 523]
        };
        patterns[kind].forEach((frequency, index) => this.tone(frequency, .23, 'sine', .019, index * .12));
    }
    hit() { this.tone(148, .15, 'sawtooth', .028); this.tone(82, .2, 'triangle', .035, .05); }
    /** Lightweight synthesized elemental attacks; no asset downloads or extra runtime dependencies. */
    hitElement(element) {
        switch (element) {
            case 'Ceniza':
                this.tone(188, .16, 'sawtooth', .026);
                this.tone(72, .26, 'triangle', .03, .03);
                break;
            case 'Bruma':
                this.tone(325, .22, 'sine', .032);
                this.tone(438, .28, 'sine', .018, .06);
                break;
            case 'Raíz':
                this.tone(93, .24, 'triangle', .041);
                this.tone(146, .15, 'square', .016, .03);
                break;
            case 'Éter':
                this.tone(550, .21, 'sine', .035);
                this.tone(733, .3, 'triangle', .023, .07);
                break;
            default:
                this.hit();
                break;
        }
    }
    warning() { for (const note of scoreSignal('warning'))
        this.tone(note.frequency, note.duration, 'triangle', note.gain, note.delay); }
    victory() { for (const note of scoreSignal('victory'))
        this.tone(note.frequency, note.duration, 'sine', note.gain, note.delay); }
    evolve() { for (let i = 0; i < 7; i++)
        this.tone(262 * Math.pow(2, i * 2 / 12), .31, 'sine', .025, i * .18); }
    pick() { this.tone(430, .10, 'sine', .04); this.tone(620, .14, 'sine', .035, .09); this.tone(820, .16, 'sine', .035, .18); }
    select() { this.tone(540, .07, 'sine', .022); }
    portal() { this.tone(160, .35, 'triangle', .032); this.tone(320, .45, 'sine', .020, .13); }
    pause() { if (this.disposed)
        return; this.paused = true; this.updateScheduler(); this.syncContext(); }
    resume() { if (this.disposed)
        return; this.paused = false; this.syncContext(); this.updateScheduler(); }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.updateScheduler();
        for (const voice of this.voices)
            this.releaseVoice(voice, true);
        for (const bus of this.retiring.keys())
            this.releaseBus(bus);
        this.bus?.disconnect();
        this.bus = null;
        try {
            this.windLfo?.stop();
            this.ambientSource?.stop();
        }
        catch { /* already stopped */ }
        this.windLfo?.disconnect();
        this.windDepth?.disconnect();
        this.ambientSource?.disconnect();
        this.ambience?.disconnect();
        this.ambientFilter?.disconnect();
        this.master?.disconnect();
        this.musicMaster?.disconnect();
        this.fxMaster?.disconnect();
        this.musicDuck?.disconnect();
        this.echoInput?.disconnect();
        this.windLfo = null;
        this.windDepth = null;
        this.echoInput = null;
        this.ambientSource = null;
        this.ambience = null;
        this.ambientFilter = null;
        this.master = null;
        this.musicMaster = null;
        this.fxMaster = null;
        this.musicDuck = null;
        const ctx = this.ctx;
        this.ctx = null;
        if (ctx) {
            ctx.onstatechange = null;
            void ctx.close().catch(() => { });
        }
    }
}
