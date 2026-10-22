import { maxHp } from './domain.js';
/** A self-contained, saved-with-flags narrative arc built on existing exploration and dungeon systems. */
export const ARKEN_FINALE_FLAG = 'arken-vow-restored';
export const ARKEN_FINALE_REWARD = { echoes: 200, seals: 4 };
export const ARKEN_STORY = [
    { id: 'archivist', title: 'La voz de Arken', objective: 'Habla con el Archivista', hint: 'Búscalo junto a la plaza de Velo de Arken. Pulsa E o ACCIÓN para hablar.' },
    { id: 'forest', title: 'Los nombres del bosque', objective: 'Cruza al Bosque de Ceniza', hint: 'Sigue el camino hacia el portal oriental de la aldea.' },
    { id: 'sanctuary', title: 'El Santuario sin Voz', objective: 'Alcanza el santuario', hint: 'Atraviesa el bosque hasta su salida oriental. Recupera fuerzas en las lumbres.' },
    { id: 'guardian', title: 'La Primera Palabra', objective: 'Derrota a Hollowhart', hint: 'El Guardián es un desafío táctico. Prepara al menos dos vínculos, una criatura de nivel 8 o superior y tónicos; anticipa su ataque cargado con GUARDIA.' },
    { id: 'crypt', title: 'El Último Signo', objective: 'Completa la Cripta de los Ecos', hint: 'Regresa a Arken; abre el MENÚ → CRIPTA EXPLORABLE, vence a los centinelas, lee la inscripción y abre la última puerta.' },
    { id: 'return', title: 'El juramento de las cenizas', objective: 'Vuelve con el Archivista', hint: 'Sal de la cripta y habla con el Archivista en la plaza de Arken para unir la Palabra y el Signo.' },
    { id: 'ending', title: 'El recuerdo permanece', objective: 'Arco de Arken completado', hint: 'El juramento permanece. Puedes explorar, capturar criaturas y superar nuevas expediciones.' }
];
export function arkenStoryIndex(state) {
    const flags = new Set(state.flags);
    if (!flags.has('archivist'))
        return 0;
    if (!flags.has('zone-forest'))
        return 1;
    if (!flags.has('zone-sanctuary'))
        return 2;
    if (!state.defeatedBoss)
        return 3;
    if (!state.dungeonFinished)
        return 4;
    if (!flags.has(ARKEN_FINALE_FLAG))
        return 5;
    return 6;
}
export function arkenStoryBeat(state) { return ARKEN_STORY[arkenStoryIndex(state)]; }
/** Story rewards are granted only by the archivist once both major challenges are complete. */
export function canConcludeArken(state) { return arkenStoryIndex(state) === 5; }
/** Pure idempotent transition; caller persists the updated flag and reward. */
export function concludeArken(state) {
    if (!canConcludeArken(state))
        return { flags: [...state.flags], newlyCompleted: false };
    return { flags: [...state.flags, ARKEN_FINALE_FLAG], newlyCompleted: true };
}
/** Optional, non-blocking Guardian preparation advice derived from a real saved party.
 * Not a win-probability estimate: matches observed boss difficulty without promising victory. */
export function guardianPreparation(team) {
    const conscious = team.filter(c => c.hp > 0);
    const highest = Math.max(0, ...conscious.map(c => c.level));
    const advice = [];
    if (conscious.length < 2)
        advice.push('Equipo corto: lleva al menos dos criaturas con vida.');
    if (highest < 8)
        advice.push('Nivel 8 recomendado. Los rastros visibles dan +48 EXP una vez.');
    if (conscious.some(c => c.hp < maxHp(c) * .6))
        advice.push('Recupera salud en una Lumbre; reserva tónicos.');
    return { ready: advice.length === 0, advice };
}
