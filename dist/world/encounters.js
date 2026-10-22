/** Stable, visible overworld encounters, placed on reachable paths (not hidden RNG). */
import { getReachableTiles, getWorldSeed, hash, terrain, WORLD_W, ZONES } from '../world.js';
import { maxHp } from '../domain.js';
/** Three distinct forest trail lessons: Root challenges Ash, Ether challenges Mist,
 * and Mist challenges Root. A random initial pick must never deny a starter its
 * first favourable elemental matchup. Variants preserve replay diversity. */
const FOREST_TRAIL_POOLS = [
    ['mireling', 'velaria'], // Mist: Root's opening advantage
    ['thorne', 'briarling'], // Root: Ash's mid-trail advantage
    ['wispawn', 'gravemoth'] // Ether: Mist's late-trail advantage
];
/** A staged Sanctuary pilgrimage: every starter gets one genuinely favourable
 * elemental opponent (Ash > Root, Root > Mist, Mist > Ether). Identity and
 * placement remain seed-dependent, while v1 roamer IDs and XP stay stable. */
const SANCTUARY_TRAIL_POOLS = [
    ['briarling', 'thorne'], // Root: Ash counterplay
    ['mireling', 'rillfin', 'velaria'], // Mist: Root counterplay
    ['wispawn', 'gravemoth', 'runeowl'] // Ether: Mist counterplay
];
export function visibleEncounters(zone, seed) {
    if (zone === 'village')
        return [];
    const accessible = getReachableTiles(zone), out = [];
    // One guaranteed early encounter, one midpoint, one later encounter, each by a route.
    for (let slot = 0; slot < 3; slot++) {
        const target = slot === 0 ? 12 : slot === 1 ? 24 : 36;
        // v1 legacy saves (seed 0) predate the 'path' tile: their central
        // ground/grass road is equally traversable and must keep the core encounters.
        const isLegacyWorld = getWorldSeed() === 0;
        const trail = [...accessible].map(index => ({ x: index % WORLD_W, y: Math.floor(index / WORLD_W) }))
            .filter(p => p.x >= 6 && p.x <= 40
            && (terrain(zone, p.x, p.y) === 'path'
                || (isLegacyWorld && Math.abs(p.y - 16) <= 2 && ['ground', 'grass'].includes(terrain(zone, p.x, p.y))))
            && ZONES[zone].landmarks.every(l => Math.hypot(l.x - p.x, l.y - p.y) >= 3));
        const available = trail.filter(p => out.every(e => Math.hypot(e.x - p.x, e.y - p.y) >= 6));
        // If a displaced landmark consumes the preferred stretch, use another
        // reachable trail cell instead of silently dropping an encounter/XP source.
        const preferred = available.filter(p => Math.abs(p.x - target) <= 5);
        const candidates = preferred.length ? preferred : available;
        candidates.sort((a, b) => {
            const score = (p) => Math.abs(p.x - target) * 10 + hash(p.x, p.y, seed + slot * 17) * 8;
            return score(a) - score(b);
        });
        const pick = candidates[0];
        if (!pick)
            continue;
        const creatures = (zone === 'forest' ? FOREST_TRAIL_POOLS : SANCTUARY_TRAIL_POOLS)[slot];
        const variant = Math.floor(hash(slot + 1, seed & 255, seed + 45) * creatures.length);
        out.push({ id: `${zone}-${slot}`, x: pick.x, y: pick.y, speciesId: creatures[variant], level: zone === 'forest' ? 5 + slot : 8 + slot });
    }
    return out;
}
export function nearbyEncounter(encounters, flags, x, y, radius = 1.65) {
    return encounters.find(e => !flags.includes('roamer-' + e.id) && Math.hypot(e.x - x, e.y - y) <= radius);
}
/** One-time reward for defeating a visible, persistent trail encounter.
 * The existing roamer flag is set by battle resolution; captures choose a new ally over XP.
 * No additional save field is required. Never award for randomly generated battles. */
export const ROAMER_FIRST_VICTORY_XP = 48;
export function firstRoamerVictoryBonus(type, encounterId, flags) {
    return type === 'wild' && typeof encounterId === 'string' && /^(forest|sanctuary)-[0-2]$/.test(encounterId) && !flags.includes('roamer-' + encounterId)
        ? ROAMER_FIRST_VICTORY_XP : 0;
}
/** First trail victories provide a finite, post-combat respite so exploration
 * does not force an altar detour after every encounter. Never revive fainted
 * companions; health recovery follows the existing maximum-HP formula.
 * Caller must gate this against firstRoamerVictoryBonus > 0. */
export function recoverTrailParty(team) {
    return team.map(creature => creature.hp <= 0 ? { ...creature } : { ...creature, hp: Math.min(maxHp(creature), creature.hp + Math.ceil(maxHp(creature) * .25)) });
}
/** Arken's finite three-creature training circuit. The first win over each
 * original trial species grants a mastery bonus to the real winning party;
 * repeat battles remain legal but cannot generate infinite mastery XP. */
export const VILLAGE_TRAINING_SPECIES = ['cindrel', 'briarling', 'mireling'];
export const VILLAGE_TRAINING_XP = 55;
export const VILLAGE_TRAINING_REWARD_FLAG = 'arken-three-lessons-reward';
export function villageTrainingBonus(type, zone, speciesId, flags, encounterId) {
    return type === 'wild' && zone === 'village' && encounterId === undefined && VILLAGE_TRAINING_SPECIES.some(s => s === speciesId) && !flags.includes('training-' + speciesId) ? VILLAGE_TRAINING_XP : 0;
}
export function villageTrainingProgress(flags) {
    const completed = VILLAGE_TRAINING_SPECIES.filter(s => flags.includes('training-' + s)).length;
    const claimed = flags.includes(VILLAGE_TRAINING_REWARD_FLAG);
    return { completed, ready: completed === 3 && !claimed, claimed };
}
