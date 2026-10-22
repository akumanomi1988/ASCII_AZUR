/** Player-facing tactical estimates derived from the exact combat damage formula.
 * This is presentation only: actual RNG, status rolls, and battle state remain authoritative.
 */
import { TYPE_ADV, SPECIES } from '../domain.js';
import { MOVE_EFFECTS, STATUS_INFO, attackWithStatuses, skillUtility } from './tactics.js';
export function previewMove(attacker, defender, move, attackerStatuses, defenderStatuses) {
    const utility = skillUtility(attacker, move, attackerStatuses);
    if (move.role === 'heal') {
        const summary = `+${utility.healing} VIDA`;
        return { summary, extra: 'CURACIÓN', accessible: `${move.name}: recupera hasta ${utility.healing} puntos de vida`, min: 0, max: 0 };
    }
    // useMove rolls in [0.90, 1.09). A status application is probabilistic, never guaranteed.
    const low = attackWithStatuses(attacker, defender, move, attackerStatuses, defenderStatuses, .90);
    const high = attackWithStatuses(attacker, defender, move, attackerStatuses, defenderStatuses, 1.09);
    const min = Math.min(low.value, high.value), max = Math.max(low.value, high.value);
    const summary = `${min}–${max} DAÑO`;
    const defenderElement = SPECIES[defender.speciesId]?.element;
    const advantage = low.effective ? 'EFICAZ' : defenderElement && TYPE_ADV[defenderElement] === move.element ? 'RESISTIDO' : '';
    const applied = MOVE_EFFECTS[move.id];
    const status = applied ? `${STATUS_INFO[applied.kind].name} ${Math.round(applied.chance * 100)}%` : '';
    const draining = move.role === 'drain' ? 'ROBA VIDA' : '';
    const cleansing = move.role === 'cleanse' ? `PURIFICA ${attackerStatuses.length}` : '';
    const extra = [advantage, status, draining, cleansing].filter(Boolean).join(' · ') || 'IMPACTO';
    return { summary, extra, accessible: `${move.name}: entre ${min} y ${max} de daño estimado${advantage ? ', ' + advantage.toLowerCase() : ''}${status ? ', ' + status.toLowerCase() : ''}${draining ? ', roba vida' : ''}${cleansing ? ', purifica estados' : ''}`, min, max };
}
