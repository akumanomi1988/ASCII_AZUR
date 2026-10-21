export const SHOP = {
    seals: { name: 'Sello de Vínculo', cost: 18, description: 'Contiene la memoria de una criatura debilitada.' },
    tonics: { name: 'Tónico de Lumbre', cost: 25, description: 'Recupera 28 HP en combate.' }
};
export const NPCS = {
    archivist: { name: 'El Archivista', color: '#91a9a0', role: 'La memoria de Azur' },
    merchant: { name: 'Mara, la Buhonera', color: '#cfa36f', role: 'Mercader de ecos' },
    scout: { name: 'Iria, la Vigía', color: '#91b4cf', role: 'Exploradora de Arken' },
    pilgrim: { name: 'El Peregrino', color: '#a8c692', role: 'Viajero extraviado' },
    keeper: { name: 'Custodia del Umbral', color: '#b4a1d8', role: 'Observadora del santuario' }
};
export function newEconomy() { return { echoes: 35, completed: [], visitedNpcs: [] }; }
export function normalizeEconomy(value) {
    if (!value || typeof value !== 'object')
        return newEconomy();
    const v = value;
    return { echoes: Number.isSafeInteger(v.echoes) && v.echoes >= 0 && v.echoes <= 999999 ? v.echoes : 35,
        completed: Array.isArray(v.completed) ? v.completed.filter(x => typeof x === 'string').slice(0, 100) : [],
        visitedNpcs: Array.isArray(v.visitedNpcs) ? v.visitedNpcs.filter(x => typeof x === 'string').slice(0, 50) : [] };
}
export function buy(economy, inventory, id) {
    const item = SHOP[id];
    if (!item || economy.echoes < item.cost || inventory[id] >= 9999)
        return false;
    economy.echoes -= item.cost;
    inventory[id]++;
    return true;
}
export const QUESTS = [
    { id: 'archivist', name: 'Voces del pasado', description: 'Habla con el Archivista en Arken.', reward: 25, ready: flags => flags.includes('archivist') },
    { id: 'first-capture', name: 'Un nombre que permanece', description: 'Captura una criatura salvaje.', reward: 35, ready: flags => flags.includes('first-capture') },
    { id: 'zone-forest', name: 'Donde las ramas susurran', description: 'Encuentra el Bosque de Ceniza.', reward: 40, ready: flags => flags.includes('zone-forest') },
    { id: 'pilgrim-rescued', name: 'El peregrino perdido', description: 'Habla con el Peregrino del bosque y después con Iria.', reward: 65, ready: flags => flags.includes('pilgrim-rescued') },
    { id: 'runes', name: 'Los signos del mundo', description: 'Resuelve las tres inscripciones antiguas.', reward: 80, ready: flags => ['village', 'forest', 'sanctuary'].every(z => flags.includes('rune-' + z)) },
    { id: 'first-word', name: 'La Primera Palabra', description: 'Derrota al Guardián del Santuario.', reward: 110, ready: (_flags, boss) => boss }
];
export function claimQuests(economy, flags, boss) {
    const newly = [];
    for (const q of QUESTS) {
        if (q.ready(flags, boss) && !economy.completed.includes(q.id)) {
            economy.completed.push(q.id);
            economy.echoes = Math.min(999999, economy.echoes + q.reward);
            newly.push(q);
        }
    }
    return newly;
}
