/** Save-v1-compatible field research. All progress is derived from carried creatures
 * and finite, namespaced flags; no extra save schema or repeatable resource farm. */
import { SPECIES, TYPE_ADV } from '../domain.js';
import { RELIC_IDS, RELIC_COPY_LIMIT } from './equipment.js';
import { BIOME_DUEL_SPECIES, BIOME_WILD_SPECIES, activeWildBiome } from '../world/encounters.js';
import { ZONE_IDS } from '../world.js';
export const RESEARCH_SEEN_PREFIX = 'research-seen-';
export const RESEARCH_BOND_PREFIX = 'research-bond-';
export const RESEARCH_REWARD_PREFIX = 'research-reward-';
export const RESEARCH_TIERS = [
    { id: 'first-names', count: 3, title: 'PRIMEROS NOMBRES', seals: 1, tonics: 1, echoes: 20, relic: 'hearth-bead' },
    { id: 'living-atlas', count: 7, title: 'ATLAS VIVIENTE', seals: 2, tonics: 1, echoes: 45, relic: 'root-knot' },
    { id: 'deep-memory', count: 12, title: 'MEMORIA PROFUNDA', seals: 2, tonics: 2, echoes: 70, relic: 'echo-prism' },
    { id: 'all-names', count: 17, title: 'TODOS LOS NOMBRES', seals: 3, tonics: 2, echoes: 90, relic: 'pilgrim-ward' }
];
const speciesIds = Object.keys(SPECIES);
const capturableIds = speciesIds.filter(id => id !== 'hollowhart' && id !== 'nullscribe');
/** Called at encounter creation/capture/evolution; can safely be repeated.
 * If a legacy save already uses all 200 flag slots, never make it invalid. */
export function recordSpeciesResearch(flags, id, kind) {
    if (!SPECIES[id])
        return false;
    const key = (kind === 'seen' ? RESEARCH_SEEN_PREFIX : RESEARCH_BOND_PREFIX) + id;
    if (flags.includes(key) || flags.includes(RESEARCH_BOND_PREFIX + id))
        return false;
    if (flags.length >= 200)
        return false;
    flags.push(key);
    return true;
}
export function researchCatalogue(team, storage, flags) {
    const bonded = new Set([...team, ...storage].map(c => c.speciesId));
    const seen = new Set();
    for (const id of speciesIds) {
        if (flags.includes(RESEARCH_BOND_PREFIX + id))
            bonded.add(id);
        if (flags.includes(RESEARCH_SEEN_PREFIX + id))
            seen.add(id);
    }
    const entries = speciesIds.map(id => {
        const species = SPECIES[id];
        const status = bonded.has(id) ? 'bonded' : seen.has(id) ? 'seen' : 'unknown';
        const habitats = ZONE_IDS.filter(zone => BIOME_WILD_SPECIES[zone].includes(id) || BIOME_DUEL_SPECIES[zone].includes(id));
        return { id, name: species.name, element: species.element, title: species.title, role: species.role || '', status, habitats,
            evolution: species.evo?.id, capturable: capturableIds.includes(id) };
    });
    const regular = entries.filter(e => e.capturable);
    return { entries, seen: regular.filter(e => e.status !== 'unknown').length, bonded: regular.filter(e => e.status === 'bonded').length, total: capturableIds.length };
}
/** Recommend real wilds that have been seen, but not captured, in known habitats.
 * Never leak hidden identities or suggest inactive chapter-locked wild populations. */
export function nextResearchLead(summary, flags, knownZones, currentZone, upcomingEnemy) {
    const options = [];
    for (const entry of summary.entries) {
        if (!entry.capturable || entry.status !== 'seen')
            continue;
        for (const zone of knownZones) {
            if (!ZONE_IDS.includes(zone) || !entry.habitats.includes(zone))
                continue;
            if (!BIOME_WILD_SPECIES[activeWildBiome(zone, flags)].includes(entry.id))
                continue;
            const advantage = upcomingEnemy !== undefined && TYPE_ADV[entry.element] === upcomingEnemy;
            options.push({ id: entry.id, name: entry.name, zone, role: entry.role, advantage,
                reason: advantage ? 'Su afinidad tiene ventaja contra el siguiente guardián.' :
                    entry.role ? 'Su rol ' + entry.role.toLowerCase() + ' amplía las opciones del equipo.' :
                        'Añade una afinidad y avanza en la investigación.' });
        }
    }
    options.sort((x, y) => Number(y.zone === currentZone) - Number(x.zone === currentZone) ||
        Number(y.advantage) - Number(x.advantage) || ZONE_IDS.indexOf(x.zone) - ZONE_IDS.indexOf(y.zone) ||
        x.name.localeCompare(y.name));
    return options[0] ?? null;
}
/** Atomic in-memory reward: mutate nothing on any refusal, including capacity
 * overflow. The caller persists this through the existing save-store CAS. */
export function claimResearchTier(state, id) {
    const tier = RESEARCH_TIERS.find(t => t.id === id);
    if (!tier)
        return 'unknown';
    const flag = RESEARCH_REWARD_PREFIX + id;
    if (state.flags.includes(flag))
        return 'already';
    if (researchCatalogue(state.team, state.storage, state.flags).bonded < tier.count)
        return 'locked';
    // Prefer the tier's specific item; use the next uncapped existing relic if full.
    // A fully stocked collector may still claim the one-time currency rewards.
    if (state.relics !== undefined && (!state.relics || typeof state.relics !== 'object' || Array.isArray(state.relics)))
        return 'full';
    if (RELIC_IDS.some(key => {
        const count = state.relics?.[key];
        return count !== undefined && (!Number.isSafeInteger(count) || count < 1 || count > RELIC_COPY_LIMIT);
    }))
        return 'full';
    const priority = [tier.relic, ...RELIC_IDS];
    const relic = priority.find((key, index) => priority.indexOf(key) === index && (state.relics?.[key] ?? 0) < RELIC_COPY_LIMIT);
    if (state.flags.length >= 200 ||
        !Number.isSafeInteger(state.inventory.seals) || state.inventory.seals < 0 || state.inventory.seals + tier.seals > 9999 ||
        !Number.isSafeInteger(state.inventory.tonics) || state.inventory.tonics < 0 || state.inventory.tonics + tier.tonics > 9999 ||
        !Number.isSafeInteger(state.rpg.echoes) || state.rpg.echoes < 0 || state.rpg.echoes + tier.echoes > 999999)
        return 'full';
    state.flags.push(flag);
    state.inventory.seals += tier.seals;
    state.inventory.tonics += tier.tonics;
    state.rpg.echoes += tier.echoes;
    if (relic)
        state.relics = { ...state.relics, [relic]: (state.relics?.[relic] ?? 0) + 1 };
    return 'claimed';
}
