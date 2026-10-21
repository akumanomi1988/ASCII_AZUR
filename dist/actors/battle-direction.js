/** Authored, deterministic attack signatures. Visual-only: damage and turn state live in combat rules. */
import { rigFor } from './creature-performance.js';
const BATTLE_FAMILY_SIGNATURES = {
    canid: 'pounce', spirit: 'spectral', moth: 'wingstorm', owl: 'talons', boar: 'stampede',
    fish: 'riptide', sprout: 'thorns', stag: 'antlers', beast: 'quake'
};
const battlePose = (x = 0, y = 0, sx = 1, sy = 1, rotation = 0, alpha = 1) => ({ x, y, scaleX: sx, scaleY: sy, rotation, alpha });
const battlePulse = (phase, center, width) => Math.max(0, 1 - Math.abs(phase - center) / width);
/** Evaluates only the recorded cue time; independent of FPS, RNG or save state. */
export function sampleBattleSignature(speciesId, fx, reducedMotion = false) {
    if (!fx || !fx.active || fx.kind !== 'attack')
        return null;
    const family = rigFor(speciesId).family;
    const kind = BATTLE_FAMILY_SIGNATURES[family];
    const anticipation = battlePulse(fx.phase, .19, .19), strike = battlePulse(fx.phase, .45, .26), impact = battlePulse(fx.phase, .51, .17);
    const sign = fx.actor === 'enemy' ? -1 : 1;
    if (reducedMotion)
        return { kind, family, energy: 0, anticipation: 0, impact: 0, attacker: battlePose(), defender: battlePose() };
    let attack = battlePose();
    switch (kind) {
        case 'pounce':
            attack = battlePose(sign * 19 * strike, -19 * strike + 9 * anticipation, 1 + .11 * strike, 1 - .07 * strike, -sign * .06 * strike);
            break;
        case 'spectral':
            attack = battlePose(sign * 12 * strike, -29 * strike - 8 * anticipation, 1 + .13 * strike, 1 + .13 * strike, sign * .13 * strike, 1 - .17 * strike);
            break;
        case 'wingstorm':
            attack = battlePose(sign * 9 * strike, -30 * strike - 10 * anticipation, 1 + .23 * strike, 1 - .15 * strike, sign * .16 * strike);
            break;
        case 'talons':
            attack = battlePose(sign * 18 * strike, -24 * strike, 1 - .12 * strike, 1 + .16 * strike, -sign * .14 * strike);
            break;
        case 'stampede':
            attack = battlePose(sign * 23 * strike, 6 * strike + 7 * anticipation, 1 + .18 * strike, 1 - .17 * strike, sign * .04 * strike);
            break;
        case 'riptide':
            attack = battlePose(sign * 16 * strike, -18 * strike - 9 * anticipation, 1 + .08 * strike, 1 + .1 * strike, sign * .25 * strike);
            break;
        case 'thorns':
            attack = battlePose(sign * 6 * strike, -8 * strike, 1 + .2 * strike, 1 + .06 * strike, sign * .04 * strike);
            break;
        case 'antlers':
            attack = battlePose(sign * 16 * strike, -18 * strike, 1 + .07 * strike, 1 + .18 * strike, -sign * .09 * strike);
            break;
        case 'quake':
            attack = battlePose(sign * 13 * strike, 12 * anticipation - 12 * strike, 1 + .18 * strike, 1 - .2 * strike, sign * .03 * strike);
            break;
    }
    const hurt = battlePose(-sign * (5 + 8 * impact) * impact, -5 * impact, 1 - .08 * impact, 1 + .09 * impact, -sign * .045 * impact, 1 - .2 * impact);
    return { kind, family, energy: strike, anticipation, impact, attacker: attack, defender: hurt };
}
