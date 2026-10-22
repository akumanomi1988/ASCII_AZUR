export const VISUAL_ASSETS = {
    hero: { id: 'hero', category: 'actor', silhouette: 'hood-cape-four-views', anchor: [0, 0], depth: 90, materials: { cape: '#35677b', rim: '#8ed0dc', metal: '#e5bf7c' }, glyphFamily: 'solid', animation: 'walk', variantSeed: 1 },
    spirit: { id: 'spirit', category: 'creature', silhouette: 'paired-glowing-eyes', anchor: [0, 0], depth: 91, materials: { light: '#c7b4ee', shadow: '#423954' }, glyphFamily: 'soft', animation: 'flicker', variantSeed: 2 },
    beast: { id: 'beast', category: 'creature', silhouette: 'quadruped-crest', anchor: [0, 0], depth: 91, materials: { light: '#ffc878', shadow: '#403431' }, glyphFamily: 'angular', animation: 'walk', variantSeed: 3 },
    tree: { id: 'tree', category: 'foliage', silhouette: 'layered-crown-trunk', anchor: [0, 0], depth: 50, materials: { trunk: '#253439', low: '#2b4744', middle: '#31544c', high: '#3a6055', rim: '#63938a' }, glyphFamily: 'soft', animation: 'sway', variantSeed: 4 },
    cottage: { id: 'cottage', category: 'architecture', silhouette: 'pitched-roof-door', anchor: [0, 0], depth: 60, materials: { wall: '#665b50', timber: '#392c2c', roof: '#73616a', window: '#f3c37f' }, glyphFamily: 'angular', animation: 'flicker', variantSeed: 5 },
    ruin: { id: 'ruin', category: 'architecture', silhouette: 'broken-arch-pillars', anchor: [0, 0], depth: 60, materials: { shadow: '#39434c', rim: '#64717c' }, glyphFamily: 'angular', animation: 'idle', variantSeed: 6 },
    rock: { id: 'rock', category: 'stone', silhouette: 'offset-blocks', anchor: [0, 0], depth: 45, materials: { shadow: '#414654', rim: '#808597' }, glyphFamily: 'angular', animation: 'idle', variantSeed: 7 },
    trail: { id: 'trail', category: 'ground', silhouette: 'continuous-path', anchor: [0, 0], depth: 0, materials: { village: '#837360', forest: '#867763', sanctuary: '#756e87' }, glyphFamily: 'fine', animation: 'idle', variantSeed: 8 },
    relic: { id: 'relic', category: 'interactive', silhouette: 'glowing-rune', anchor: [0, 0], depth: 70, materials: { core: '#d6caef', aura: '#a395da' }, glyphFamily: 'solid', animation: 'flicker', variantSeed: 9 }
};
/** Stable across frames and profiles: only the world seed and asset ID affect the variant. */
export function visualVariation(id, seed) {
    const n = VISUAL_ASSETS[id].variantSeed;
    const x = Math.sin((seed + n * 193) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}
