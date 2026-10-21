/** Deterministic presentation layer: VFX never decide damage or modify combat state. */
import { BASE_POSE, samplePose } from './animation.js';
const pose = (dx = 0, dy = 0, scaleX = 1, scaleY = 1, rotation = 0, alpha = 1) => ({ x: dx, y: dy, scaleX, scaleY, rotation, alpha });
const attackClip = {
    id: 'combat-lunge', action: 'attack', duration: 1, loop: false,
    keyframes: [
        { time: 0, pose: { ...BASE_POSE } },
        { time: .17, pose: pose(-12, 7, .91, 1.06, -.045) },
        { time: .42, pose: pose(66, -27, 1.09, .94, .13) },
        { time: .58, pose: pose(42, -16, 1.04, .97, .08) },
        { time: .82, pose: pose(1, -3) },
        { time: 1, pose: { ...BASE_POSE } }
    ]
};
const healClip = { id: 'combat-heal', action: 'interact', duration: 1, loop: false, keyframes: [
        { time: 0, pose: { ...BASE_POSE } }, { time: .3, pose: pose(0, -8, 1.04, 1.04) },
        { time: .75, pose: pose(0, -3, 1.02, 1.02) }, { time: 1, pose: { ...BASE_POSE } }
    ] };
const targetClip = { id: 'combat-impact', action: 'hurt', duration: 1, loop: false, keyframes: [
        { time: 0, pose: { ...BASE_POSE } }, { time: .37, pose: { ...BASE_POSE } },
        { time: .47, pose: pose(11, 1, .96, 1.04, -.055, .69) },
        { time: .62, pose: pose(4, 0, .98, 1.01, -.015, .9) },
        { time: 1, pose: { ...BASE_POSE } }
    ] };
export function createCombatCue(kind, actor, element, nowSeconds, damage = 0, effective = false) {
    const duration = kind === 'attack' ? .9 : kind === 'capture' ? 1.05 : .72;
    return { kind, actor, element, startedAt: nowSeconds, duration, damage, effective };
}
export function sampleCombatCue(cue, nowSeconds, reducedMotion = false) {
    if (!cue)
        return null;
    const progress = Math.min(1, Math.max(0, (nowSeconds - cue.startedAt) / cue.duration));
    if (progress >= 1)
        return null;
    if (reducedMotion)
        return { kind: cue.kind, actor: cue.actor, element: cue.element, phase: progress, active: true, attacker: { ...BASE_POSE }, target: { ...BASE_POSE }, impact: 0, trail: 0, damage: cue.damage ?? 0, effective: !!cue.effective, shakeX: 0, shakeY: 0 };
    const isAttack = cue.kind === 'attack';
    let attacker = samplePose(isAttack ? attackClip : healClip, progress);
    let target = isAttack ? samplePose(targetClip, progress) : { ...BASE_POSE };
    if (cue.actor === 'enemy') {
        // Enemy moves towards bottom-left, not along the friendly creature's vector.
        attacker = { ...attacker, x: -attacker.x, y: -attacker.y * .48, rotation: -attacker.rotation };
        target = { ...target, x: -target.x, rotation: -target.rotation };
    }
    const impact = isAttack ? Math.max(0, 1 - Math.abs(progress - .48) / .14) : 0;
    const trail = isAttack ? Math.max(0, 1 - Math.abs(progress - .40) / .35) : Math.sin(Math.PI * progress) * .72;
    const shake = impact * (cue.effective ? 5 : 3);
    return { kind: cue.kind, actor: cue.actor, element: cue.element, phase: progress, active: true, attacker, target, impact, trail, damage: cue.damage ?? 0, effective: !!cue.effective,
        shakeX: Math.sin(progress * 181) * shake, shakeY: Math.cos(progress * 157) * shake * .55 };
}
export function guardDamage(rawDamage, guarding) {
    if (!Number.isFinite(rawDamage) || rawDamage < 0)
        throw Error('Invalid damage');
    return guarding ? Math.max(1, Math.ceil(rawDamage * .45)) : Math.ceil(rawDamage);
}
