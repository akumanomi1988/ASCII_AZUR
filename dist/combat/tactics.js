/** Deterministic tactical effects. No DOM, animation or mutable global state. */
import { MOVES, damage, maxHp } from '../domain.js';
export const STATUS_INFO = {
    scorch: { name: 'ARDOR', description: 'Pierde vida al terminar sus turnos.' },
    weaken: { name: 'DEBILIDAD', description: 'Inflige un 25 % menos de daño durante sus próximos ataques.' },
    fracture: { name: 'FRACTURA', description: 'Recibe un 25 % más de daño en los próximos impactos.' }
};
export const MOVE_EFFECTS = {
    ember: { kind: 'scorch', chance: .22, turns: 3 }, smolder: { kind: 'scorch', chance: .65, turns: 3 },
    fog: { kind: 'weaken', chance: .50, turns: 2 }, tide: { kind: 'weaken', chance: .78, turns: 2 },
    thorn: { kind: 'fracture', chance: .28, turns: 2 }, roots: { kind: 'fracture', chance: .62, turns: 2 },
    astral: { kind: 'fracture', chance: .24, turns: 2 }, void: { kind: 'fracture', chance: .65, turns: 2 }
};
export function applyEffect(statuses, effect, roll) {
    if (!effect || !Number.isFinite(roll) || roll < 0 || roll >= 1 || roll >= effect.chance)
        return { statuses: statuses.map(s => ({ ...s })), applied: false };
    const old = statuses.find(s => s.kind === effect.kind);
    const next = statuses.filter(s => s.kind !== effect.kind).map(s => ({ ...s }));
    next.push({ kind: effect.kind, remaining: Math.max(old?.remaining || 0, effect.turns) });
    return { statuses: next, applied: true };
}
export function afterAttack(statuses, kind) {
    return statuses.map(s => s.kind === kind ? { ...s, remaining: s.remaining - 1 } : { ...s }).filter(s => s.remaining > 0);
}
export function attackWithStatuses(attacker, defender, move, attackStatuses, defenseStatuses, roll = 1) {
    const base = damage(attacker, defender, move, roll);
    const weak = attackStatuses.some(s => s.kind === 'weaken');
    const exposed = defenseStatuses.some(s => s.kind === 'fracture');
    const multiplier = (weak ? .75 : 1) * (exposed ? 1.25 : 1);
    return { value: Math.max(1, Math.ceil(base.value * multiplier)), effective: base.effective,
        attackerStatuses: weak ? afterAttack(attackStatuses, 'weaken') : attackStatuses.map(s => ({ ...s })),
        defenderStatuses: exposed ? afterAttack(defenseStatuses, 'fracture') : defenseStatuses.map(s => ({ ...s })) };
}
export function endTurnEffects(creature, statuses) {
    if (!statuses.some(s => s.kind === 'scorch'))
        return { damage: 0, statuses: statuses.map(s => ({ ...s })) };
    const burn = Math.max(2, Math.ceil(maxHp(creature) * .055));
    return { damage: burn, statuses: afterAttack(statuses, 'scorch') };
}
/** Deterministic skill utility. Healing and cleansing never directly damage a target. */
export function skillUtility(attacker, move, statuses) {
    const missing = maxHp(attacker) - attacker.hp;
    const healing = move.role === 'heal' ? Math.min(missing, Math.max(9, Math.floor(maxHp(attacker) * .22) + Math.floor(attacker.level * .8))) : 0;
    return { healing, cleanse: move.role === 'cleanse' && statuses.length > 0 };
}
export function statusLabel(statuses) {
    return statuses.map(s => `${STATUS_INFO[s.kind].name} ${s.remaining}`).join(' · ');
}
/** Basic tactical opponent: evaluates lethality, type advantage and debuff utility.
 * Scored deterministically; RNG only resolves close tactical alternatives. */
export function chooseEnemyMove(enemy, ally, enemyStatuses, allyStatuses, rng = 0) {
    const ranked = enemy.moves.filter(id => MOVES[id]).map(id => {
        const move = MOVES[id];
        const result = attackWithStatuses(enemy, ally, move, enemyStatuses, allyStatuses, 1);
        const utility = skillUtility(enemy, move, enemyStatuses);
        const effect = MOVE_EFFECTS[id];
        const novel = effect && !allyStatuses.some(s => s.kind === effect.kind) ? effect.chance * 4.5 : 0;
        const kill = move.role !== 'heal' && result.value >= ally.hp ? 100 : 0;
        const score = (move.role === 'heal' ? utility.healing * 1.2 - (enemy.hp > maxHp(enemy) * .72 ? 30 : 0) : result.value) + (move.role === 'cleanse' ? enemyStatuses.length * 5 : 0) + (move.role === 'drain' ? Math.min(maxHp(enemy) - enemy.hp, result.value * .4) : 0) + novel + kill;
        return { id, score };
    }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    if (!ranked.length)
        return 'pulse';
    if (!Number.isFinite(rng))
        rng = 0;
    // One choice in five varies among near-optimal moves to avoid mechanical repetition.
    if (ranked.length > 1 && rng > .8) {
        const close = ranked.filter(c => ranked[0].score - c.score < 7);
        return close[Math.floor(((rng - .8) / .2) * close.length) % close.length]?.id ?? ranked[0].id;
    }
    return ranked[0].id;
}
