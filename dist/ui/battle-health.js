const clampPresentedHp = (x, a, b) => Math.min(b, Math.max(a, x));
export function visibleHp(m, now, reducedMotion = false) {
    if (reducedMotion)
        return m.to;
    const t = clampPresentedHp((now - m.at - m.delay) / m.duration, 0, 1);
    return clampPresentedHp(Math.round(m.from + (m.to - m.from) * (t * t * (3 - 2 * t))), 0, m.max);
}
export class BattleHealthPresentation {
    constructor() {
        this.meters = {};
    }
    reset() { this.meters = {}; }
    retarget(side, uid, hp, max, now, cue) {
        const value = clampPresentedHp(hp, 0, max), previous = this.meters[side];
        if (!previous || previous.uid !== uid || previous.max !== max) {
            this.meters[side] = { uid, max, from: value, to: value, at: now, delay: 0, duration: .8 };
            return;
        }
        if (previous.to === value)
            return;
        const impact = cue?.kind === 'attack' && cue.actor !== side;
        const healing = cue?.kind === 'heal' && cue.actor === side;
        const delay = impact ? (cue.duration * .72) : healing ? .24 : .15;
        this.meters[side] = { uid, max, from: visibleHp(previous, now), to: value, at: now, delay, duration: impact ? .65 : healing ? .65 : .58 };
    }
    sample(side, now, reducedMotion = false) {
        const m = this.meters[side];
        if (!m)
            return null;
        const hp = visibleHp(m, now, reducedMotion);
        return { hp, max: m.max, critical: hp > 0 && hp / m.max <= .23, warning: hp > 0 && hp / m.max <= .45 };
    }
}
