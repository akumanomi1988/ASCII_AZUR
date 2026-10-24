/** Pure creature build system. Does not mutate saves or bypass learnable move gates. */
import { MOVES, SPECIES, SIGNATURE_MOVES, learnableMoves } from '../domain.js';
const SPECIAL = {
    Ceniza: ['kindle', 'flare', 'funeral', 'embersong', 'ashfang', 'emberstorm'],
    Bruma: ['drizzle', 'moonfog', 'frostwake', 'undertow', 'deluge', 'rilldance'],
    Raíz: ['verdancy', 'barkskin', 'seedburst', 'vinegrip', 'bramble', 'harvest'],
    Éter: ['echoheal', 'absolve', 'starlash', 'siphon', 'runeburst', 'eclipse']
};
export function unlockedMoves(creature) {
    const sp = SPECIES[creature.speciesId];
    if (!sp)
        throw Error('Especie inválida');
    const candidates = [...learnableMoves(creature.speciesId, creature.level), ...(creature.knownMoves ?? [])];
    if (creature.level >= 7)
        candidates.push(SIGNATURE_MOVES[creature.speciesId]);
    const count = creature.level >= 18 ? 6 : creature.level >= 14 ? 4 : creature.level >= 10 ? 2 : 0;
    candidates.push(...SPECIAL[sp.element].slice(0, count));
    // Legacy moves are preserved as known, even if a creature evolved into another element.
    candidates.push(...creature.moves);
    return [...new Set(candidates)].filter(id => !!MOVES[id]);
}
export function equipMove(creature, index, id) {
    if (!Number.isInteger(index) || index < 0 || index > creature.moves.length || index >= 4)
        throw Error('Ranura inválida');
    if (!MOVES[id] || !unlockedMoves(creature).includes(id))
        throw Error('Habilidad no aprendida');
    if (creature.moves.includes(id) && creature.moves[index] !== id)
        throw Error('Habilidad duplicada');
    const moves = [...creature.moves];
    moves[index] = id;
    if (!moves.some(move => MOVES[move].power > 0))
        throw Error('Conserva al menos una técnica ofensiva');
    return { ...creature, moves, knownMoves: [...new Set([...(creature.knownMoves ?? []), ...unlockedMoves(creature)])] };
}
