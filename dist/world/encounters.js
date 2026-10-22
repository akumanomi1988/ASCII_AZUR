/** Stable, visible overworld encounters, placed on reachable paths (not hidden RNG). */
import { getReachableTiles, hash, terrain, WORLD_W, ZONES } from '../world.js';
const SPECIES_BY_ZONE = {
    forest: ['cindrel', 'mireling', 'thorne', 'briarling', 'ashboar'],
    sanctuary: ['wispawn', 'gravemoth', 'runeowl', 'rillfin', 'velaria']
};
export function visibleEncounters(zone, seed) {
    if (zone === 'village')
        return [];
    const accessible = getReachableTiles(zone), out = [];
    // One guaranteed early encounter, one midpoint, one later encounter, each by a route.
    for (let slot = 0; slot < 3; slot++) {
        const target = slot === 0 ? 12 : slot === 1 ? 24 : 36;
        const candidates = [...accessible].map(index => ({ x: index % WORLD_W, y: Math.floor(index / WORLD_W) }))
            .filter(p => Math.abs(p.x - target) <= 5 && p.x >= 6 && p.x <= 40
            && terrain(zone, p.x, p.y) === 'path'
            && ZONES[zone].landmarks.every(l => Math.hypot(l.x - p.x, l.y - p.y) >= 3)
            && out.every(e => Math.hypot(e.x - p.x, e.y - p.y) >= 6));
        candidates.sort((a, b) => {
            const score = (p) => Math.abs(p.x - target) * 10 + hash(p.x, p.y, seed + slot * 17) * 8;
            return score(a) - score(b);
        });
        const pick = candidates[0];
        if (!pick)
            continue;
        const creatures = SPECIES_BY_ZONE[zone];
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
