export const RUNE_SYMBOLS = ['*', '+', '#'];
export const RUNE_PUZZLES = {
    village: { id: 'village', name: 'La piedra del origen', lore: '«La primera luz fue una estrella. La voz la sostuvo. La memoria la selló».', hint: 'Estrella, unión, sello.', sequence: ['*', '+', '#'], echoReward: 20 },
    forest: { id: 'forest', name: 'El juramento de las raíces', lore: '«La memoria echó raíces. Después llegó la estrella. Y la voz las hizo crecer».', hint: 'Sello, estrella, unión.', sequence: ['#', '*', '+'], echoReward: 30 },
    sanctuary: { id: 'sanctuary', name: 'La inscripción ausente', lore: '«Las voces se encontraron. Sellaron el vacío. Una estrella persistió».', hint: 'Unión, sello, estrella.', sequence: ['+', '#', '*'], echoReward: 45 }
};
export function submitRune(puzzle, index, glyph) {
    if (!Number.isInteger(index) || index < 0 || index >= puzzle.sequence.length || !RUNE_SYMBOLS.includes(glyph))
        return { index: 0, correct: false, completed: false };
    const correct = puzzle.sequence[index] === glyph;
    const next = correct ? index + 1 : 0;
    return { index: next, correct, completed: next >= puzzle.sequence.length };
}
/** Pure idempotent reward. Caller persists the resulting flag and echoes. */
export function claimRune(flags, echoes, where) {
    const flag = 'rune-' + where;
    const earned = flags.includes(flag) ? 0 : RUNE_PUZZLES[where].echoReward;
    return { flag, earned, echoes: Math.min(999999, Math.max(0, echoes) + earned) };
}
