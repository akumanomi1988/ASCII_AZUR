export const FRAME_BINS_MS = [17, 25, 34, 50, 75, 100, 150, 250, 500, 2000];
const ENDURANCE_PHASES = ['explore', 'battle', 'crypt', 'menu'];
function emptyEnduranceStats() { return { frames: 0, sumMs: 0, overBudget: 0, maxMs: 0, bins: FRAME_BINS_MS.map(() => 0) }; }
function percentileUpperBound(bins, count) {
    if (count === 0)
        return 0;
    const target = Math.ceil(count * .95);
    let n = 0;
    for (let i = 0; i < bins.length; i++) {
        n += bins[i];
        if (n >= target)
            return FRAME_BINS_MS[i];
    }
    return FRAME_BINS_MS[FRAME_BINS_MS.length - 1];
}
function summarizeEndurancePhase(s) {
    const sampledSeconds = s.sumMs / 1000;
    return { frames: s.frames, sampledSeconds: Number(sampledSeconds.toFixed(2)),
        averageFps: s.frames ? Number((s.frames / sampledSeconds).toFixed(1)) : 0,
        p95UpperBoundMs: percentileUpperBound(s.bins, s.frames),
        slowFrames: s.overBudget, slowPercent: s.frames ? Number((s.overBudget / s.frames * 100).toFixed(2)) : 0,
        maxMs: Number(s.maxMs.toFixed(2)) };
}
export class EnduranceLab {
    enabled = false;
    stats = { explore: emptyEnduranceStats(), battle: emptyEnduranceStats(), crypt: emptyEnduranceStats(), menu: emptyEnduranceStats() };
    dropped = 0;
    orientation = null;
    orientationChanges = 0;
    orientationFrames = { portrait: 0, landscape: 0 };
    viewport = null;
    get recording() { return this.enabled; }
    start() { this.reset(); this.enabled = true; }
    stop() { this.enabled = false; }
    reset() {
        this.enabled = false;
        this.stats = { explore: emptyEnduranceStats(), battle: emptyEnduranceStats(), crypt: emptyEnduranceStats(), menu: emptyEnduranceStats() };
        this.dropped = 0;
        this.orientation = null;
        this.orientationChanges = 0;
        this.orientationFrames = { portrait: 0, landscape: 0 };
        this.viewport = null;
    }
    sample(intervalMs, phase, visible, width, height) {
        if (!this.enabled)
            return;
        if (!visible || !Number.isFinite(intervalMs) || intervalMs <= 0 || intervalMs > 2000 ||
            !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || !ENDURANCE_PHASES.includes(phase)) {
            this.dropped++;
            return;
        }
        const s = this.stats[phase];
        s.frames++;
        s.sumMs += intervalMs;
        if (intervalMs > 1000 / 30)
            s.overBudget++;
        s.maxMs = Math.max(s.maxMs, intervalMs);
        const at = FRAME_BINS_MS.findIndex(limit => intervalMs <= limit);
        s.bins[at < 0 ? FRAME_BINS_MS.length - 1 : at]++;
        const current = width >= height ? 'landscape' : 'portrait';
        if (this.orientation !== null && current !== this.orientation)
            this.orientationChanges++;
        this.orientation = current;
        this.orientationFrames[current]++;
        if (!this.viewport)
            this.viewport = { minWidth: width, maxWidth: width, minHeight: height, maxHeight: height };
        else {
            this.viewport.minWidth = Math.min(this.viewport.minWidth, width);
            this.viewport.maxWidth = Math.max(this.viewport.maxWidth, width);
            this.viewport.minHeight = Math.min(this.viewport.minHeight, height);
            this.viewport.maxHeight = Math.max(this.viewport.maxHeight, height);
        }
    }
    report() {
        const out = {};
        for (const phase of ENDURANCE_PHASES)
            out[phase] = summarizeEndurancePhase(this.stats[phase]);
        const totalFrames = ENDURANCE_PHASES.reduce((sum, p) => sum + this.stats[p].frames, 0);
        return { format: 'ascii-azur-endurance', version: 1, collection: 'opt-in-visible-rAF',
            status: this.enabled ? 'recording' : 'stopped', totalFrames,
            sampledSeconds: Number(ENDURANCE_PHASES.reduce((sum, p) => sum + this.stats[p].sumMs, 0).toFixed(0)) / 1000,
            ignoredFrames: this.dropped, orientationChanges: this.orientationChanges,
            orientationFrames: { ...this.orientationFrames }, orientation: this.orientation ?? 'unobserved',
            viewport: this.viewport ? { ...this.viewport } : null, phases: out,
            meaning: 'Visible requestAnimationFrame main-thread pacing only. P95 is an upper histogram bound. Not GPU time, energy, temperature, physical device, human acceptance or play-duration proof.' };
    }
}
