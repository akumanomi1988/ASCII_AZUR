export const BASE_POSE = Object.freeze({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 });
export function validateClip(clip) {
    const errors = [];
    if (!clip.id || !Number.isFinite(clip.duration) || clip.duration <= 0)
        errors.push('Invalid id/duration');
    if (clip.keyframes.length < 2)
        errors.push('At least two keyframes required');
    let prev = -1;
    for (const k of clip.keyframes) {
        if (!Number.isFinite(k.time) || k.time < 0 || k.time > clip.duration || k.time <= prev)
            errors.push('Keyframes must increase within duration');
        prev = k.time;
        if (!Object.values(k.pose).every(Number.isFinite) || k.pose.alpha < 0 || k.pose.alpha > 1 || k.pose.scaleX <= 0 || k.pose.scaleY <= 0)
            errors.push('Invalid pose values');
    }
    for (const e of clip.events || [])
        if (e.time < 0 || e.time > clip.duration || !e.id)
            errors.push('Invalid cue');
    return errors;
}
const lerp = (a, b, t) => a + (b - a) * t;
export function samplePose(clip, seconds) {
    if (validateClip(clip).length)
        throw Error('Invalid animation clip');
    const duration = clip.duration;
    const t = clip.loop ? ((seconds % duration) + duration) % duration : Math.max(0, Math.min(duration, seconds));
    const keys = clip.keyframes;
    if (t <= keys[0].time)
        return { ...keys[0].pose };
    if (t >= keys[keys.length - 1].time)
        return { ...keys[keys.length - 1].pose };
    for (let i = 1; i < keys.length; i++) {
        const b = keys[i];
        if (t > b.time)
            continue;
        const a = keys[i - 1];
        let k = (t - a.time) / (b.time - a.time);
        // Hermite smoothing: no sudden motion at individual pose anchors.
        k = k * k * (3 - 2 * k);
        return { x: lerp(a.pose.x, b.pose.x, k), y: lerp(a.pose.y, b.pose.y, k), scaleX: lerp(a.pose.scaleX, b.pose.scaleX, k), scaleY: lerp(a.pose.scaleY, b.pose.scaleY, k), rotation: lerp(a.pose.rotation, b.pose.rotation, k), alpha: lerp(a.pose.alpha, b.pose.alpha, k) };
    }
    return { ...keys[keys.length - 1].pose };
}
export function validateActor(actor) {
    const errors = [];
    if (!actor.id || !actor.silhouetteId || !actor.family || !Number.isFinite(actor.scale) || actor.scale <= 0)
        errors.push('Invalid actor identity/scale');
    if (!Number.isFinite(actor.footAnchor.x) || !Number.isFinite(actor.footAnchor.y))
        errors.push('Invalid foot anchor');
    if (!actor.facing.length || actor.facing.some(f => ![0, 1, 2, 3].includes(f)))
        errors.push('Invalid facings');
    const ids = new Set();
    for (const clip of actor.clips) {
        if (ids.has(clip.id))
            errors.push('Duplicate clip id');
        ids.add(clip.id);
        errors.push(...validateClip(clip).map(e => `${clip.id}: ${e}`));
    }
    if (!actor.clips.some(c => c.action === 'idle'))
        errors.push('Missing idle clip');
    return errors;
}
