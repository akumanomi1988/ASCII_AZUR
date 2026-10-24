/** Stable individual potential, 0..31 per stat; legacy creatures use neutral 16. */
export const ATTRIBUTE_KEYS = ['hp', 'attack', 'defense', 'speed'];
export function validPotential(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const v = value;
    return Object.keys(v).length === 4 && ATTRIBUTE_KEYS.every(k => Number.isInteger(v[k]) && v[k] >= 0 && v[k] <= 31);
}
export function potentialFromUid(uid) {
    let seed = 2166136261;
    for (const char of uid)
        seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    const values = ATTRIBUTE_KEYS.map(() => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) % 32; });
    return { hp: values[0], attack: values[1], defense: values[2], speed: values[3] };
}
export function individualStat(base, potential = 16) { return Math.max(1, Math.round(base * (1 + (potential - 16) * .004))); }
export function individualRange(base) { return { min: individualStat(base, 0), max: individualStat(base, 31) }; }
