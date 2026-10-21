import { validateDungeon } from './dungeons/labyrinth.js';
import { validateExpedition } from './expeditions/expedition.js';
import { validateWorldSnapshot } from './world.js';
import { validDiscovery } from './world/discovery.js';
export const MOVES = {
    ember: { id: 'ember', name: 'Chispa fúnebre', element: 'Ceniza', power: 12, description: 'Brasas que nunca se extinguen' },
    smolder: { id: 'smolder', name: 'Hoguera rota', element: 'Ceniza', power: 19, description: 'Un fuego que consume recuerdos' },
    fog: { id: 'fog', name: 'Hálito gris', element: 'Bruma', power: 12, description: 'La niebla de los ausentes' },
    tide: { id: 'tide', name: 'Marea velada', element: 'Bruma', power: 19, description: 'Disuelve la voluntad del adversario' },
    thorn: { id: 'thorn', name: 'Zarpa espinada', element: 'Raíz', power: 12, description: 'Raíces que recuerdan la tierra' },
    roots: { id: 'roots', name: 'Raíz ancestral', element: 'Raíz', power: 19, description: 'La tierra reclama lo perdido' },
    astral: { id: 'astral', name: 'Eco umbrío', element: 'Éter', power: 12, description: 'Una voz que no pertenece a nadie' },
    void: { id: 'void', name: 'Ruptura', element: 'Éter', power: 19, description: 'Reescribe un fragmento de realidad' },
    pulse: { id: 'pulse', name: 'Pulso', element: 'Éter', power: 9, description: 'Un golpe de esencia pura' },
    kindle: { id: 'kindle', name: 'Cántico de lumbre', element: 'Ceniza', power: 0, role: 'heal', description: 'Restaura vida mediante una chispa protectora.' },
    flare: { id: 'flare', name: 'Filo incandescente', element: 'Ceniza', power: 23, description: 'Ataque veloz con calor que deja cicatrices.' },
    emberstorm: { id: 'emberstorm', name: 'Tormenta de brasas', element: 'Ceniza', power: 29, description: 'Una llamarada que oscurece el horizonte.' },
    ashfang: { id: 'ashfang', name: 'Mordisco de ceniza', element: 'Ceniza', power: 21, role: 'drain', description: 'El fuego bebe la energía del oponente.' },
    funeral: { id: 'funeral', name: 'Último rescoldo', element: 'Ceniza', power: 17, role: 'cleanse', description: 'Purifica los efectos que consumen al portador.' },
    embersong: { id: 'embersong', name: 'Eco de hogar', element: 'Ceniza', power: 0, role: 'heal', description: 'Reaviva la llama del vínculo.' },
    drizzle: { id: 'drizzle', name: 'Lluvia consoladora', element: 'Bruma', power: 0, role: 'heal', description: 'Recupera vida con agua recogida del pasado.' },
    undertow: { id: 'undertow', name: 'Resaca oscura', element: 'Bruma', power: 20, role: 'drain', description: 'Arrebata al enemigo su fuerza líquida.' },
    moonfog: { id: 'moonfog', name: 'Velo lunar', element: 'Bruma', power: 14, role: 'cleanse', description: 'Disipa las cicatrices del combate.' },
    deluge: { id: 'deluge', name: 'Diluvio del olvido', element: 'Bruma', power: 28, description: 'Una marea implacable de recuerdos.' },
    frostwake: { id: 'frostwake', name: 'Despertar frío', element: 'Bruma', power: 23, description: 'Un estremecimiento surgido de la niebla.' },
    rilldance: { id: 'rilldance', name: 'Danza del cauce', element: 'Bruma', power: 24, description: 'Un remolino de movimientos impredecibles.' },
    verdancy: { id: 'verdancy', name: 'Brote eterno', element: 'Raíz', power: 0, role: 'heal', description: 'La tierra devuelve la vida a los vínculos.' },
    vinegrip: { id: 'vinegrip', name: 'Abrazo espinoso', element: 'Raíz', power: 21, role: 'drain', description: 'Enredaderas roban vigor y lo transfieren.' },
    seedburst: { id: 'seedburst', name: 'Estallido de semillas', element: 'Raíz', power: 25, description: 'Las semillas de piedra explotan al contacto.' },
    barkskin: { id: 'barkskin', name: 'Corteza antigua', element: 'Raíz', power: 12, role: 'cleanse', description: 'La corteza sana heridas espirituales.' },
    bramble: { id: 'bramble', name: 'Corona de zarzas', element: 'Raíz', power: 27, description: 'Las raíces se alzan en defensa del bosque.' },
    harvest: { id: 'harvest', name: 'Siega de bruma', element: 'Raíz', power: 23, description: 'Segadura de hojas afiladas.' },
    echoheal: { id: 'echoheal', name: 'Recomponer el nombre', element: 'Éter', power: 0, role: 'heal', description: 'Reconstruye una parte de la identidad perdida.' },
    siphon: { id: 'siphon', name: 'Robo de recuerdos', element: 'Éter', power: 21, role: 'drain', description: 'Recupera fuerza a partir de un recuerdo ajeno.' },
    absolve: { id: 'absolve', name: 'Absolución', element: 'Éter', power: 14, role: 'cleanse', description: 'Disuelve una alteración de la esencia.' },
    runeburst: { id: 'runeburst', name: 'Alfabeto roto', element: 'Éter', power: 26, description: 'Glifos violentos atraviesan la realidad.' },
    eclipse: { id: 'eclipse', name: 'Eclipse sin voz', element: 'Éter', power: 30, description: 'Un silencio capaz de partir el cielo.' },
    mothdust: { id: 'mothdust', name: 'Polvo de umbral', element: 'Éter', power: 24, description: 'Sombras de alas borran la memoria.' },
    starlash: { id: 'starlash', name: 'Látigo de estrellas', element: 'Éter', power: 25, description: 'Un haz que escribe heridas en el aire.' },
};
export const SPECIES = {
    cindrel: { id: 'cindrel', name: 'Cindrel', title: 'Zorro de brasas', element: 'Ceniza', color: '#e78b60', stats: { hp: 37, attack: 15, defense: 10, speed: 14 }, evo: { id: 'cinderwulf', level: 9 }, desc: 'De su pelaje cae una lluvia de ceniza caliente.', shape: 0 },
    cinderwulf: { id: 'cinderwulf', name: 'Cinderwulf', title: 'Lobo del último fuego', element: 'Ceniza', color: '#f3a678', stats: { hp: 54, attack: 24, defense: 16, speed: 18 }, desc: 'Custodia las hogueras de los viajeros desaparecidos.', shape: 5 },
    velaria: { id: 'velaria', name: 'Velaria', title: 'Espíritu de niebla', element: 'Bruma', color: '#8abed1', stats: { hp: 40, attack: 12, defense: 12, speed: 13 }, desc: 'Su rostro solo aparece cuando llueve.', shape: 1 },
    thorne: { id: 'thorne', name: 'Thorne', title: 'Guardián del musgo', element: 'Raíz', color: '#9abf81', stats: { hp: 47, attack: 12, defense: 16, speed: 8 }, desc: 'Las flores nacen donde descansan sus huellas.', shape: 2 },
    wispawn: { id: 'wispawn', name: 'Wispawn', title: 'Llama de los nombres', element: 'Éter', color: '#c0a7ee', stats: { hp: 32, attack: 15, defense: 9, speed: 18 }, desc: 'Imita los nombres de los que han sido olvidados.', shape: 3 },
    gravemoth: { id: 'gravemoth', name: 'Gravemoth', title: 'Polilla del luto', element: 'Éter', color: '#b0a6d6', stats: { hp: 36, attack: 16, defense: 10, speed: 16 }, desc: 'Sus alas parecen páginas de un libro quemado.', shape: 4 },
    mireling: { id: 'mireling', name: 'Mireling', title: 'Errante del pantano', element: 'Bruma', color: '#7eb7ac', stats: { hp: 44, attack: 12, defense: 15, speed: 10 }, desc: 'Guarda pequeños recuerdos en su cuerpo de barro.', shape: 2 },
    runeowl: { id: 'runeowl', name: 'Runeowl', title: 'Búho de las inscripciones', element: 'Éter', color: '#c5c5fa', stats: { hp: 38, attack: 19, defense: 9, speed: 18 }, desc: 'Sus plumas contienen frases que solo la luna puede leer.', shape: 7 },
    ashboar: { id: 'ashboar', name: 'Ashboar', title: 'Jabalí de escoria', element: 'Ceniza', color: '#eaa079', stats: { hp: 51, attack: 20, defense: 14, speed: 8 }, desc: 'Se alimenta de carbones y deja una estela de chispas.', shape: 8 },
    rillfin: { id: 'rillfin', name: 'Rillfin', title: 'Pez de los caminos', element: 'Bruma', color: '#81d9df', stats: { hp: 34, attack: 14, defense: 11, speed: 20 }, desc: 'Nada entre charcos y recuerdos de lluvia.', shape: 9 },
    briarling: { id: 'briarling', name: 'Briarling', title: 'Semilla errante', element: 'Raíz', color: '#c0d78d', stats: { hp: 36, attack: 12, defense: 14, speed: 12 }, evo: { id: 'thorne', level: 8 }, desc: 'Cada amanecer le crece una hoja que no recuerda.', shape: 10 },
    hollowhart: { id: 'hollowhart', name: 'Hollowhart', title: 'Ciervo del silencio', element: 'Raíz', color: '#d9bd9c', stats: { hp: 66, attack: 22, defense: 20, speed: 12 }, desc: 'Último guardián de las palabras originales.', shape: 6 }
};
export const TYPE_ADV = { Ceniza: 'Raíz', Raíz: 'Bruma', Bruma: 'Éter', Éter: 'Ceniza' };
export const BASE_MOVES = { Ceniza: ['ember', 'pulse', 'smolder'], Bruma: ['fog', 'pulse', 'tide'], Raíz: ['thorn', 'pulse', 'roots'], Éter: ['astral', 'pulse', 'void'] };
/** Each species has a signature move. Learned at level 7 and preserved across legacy saves. */
export const SIGNATURE_MOVES = {
    cindrel: 'ashfang', cinderwulf: 'emberstorm', velaria: 'drizzle', thorne: 'vinegrip',
    wispawn: 'siphon', gravemoth: 'mothdust', mireling: 'undertow', runeowl: 'runeburst',
    ashboar: 'flare', rillfin: 'rilldance', briarling: 'verdancy', hollowhart: 'eclipse'
};
export function learnableMoves(speciesId, level) {
    const s = SPECIES[speciesId];
    if (!s)
        throw Error('Especie desconocida');
    const base = BASE_MOVES[s.element].slice(0, level >= 7 ? 3 : 2);
    return level >= 7 ? [...base, SIGNATURE_MOVES[speciesId]] : base;
}
export function maxHp(c) { const s = SPECIES[c.speciesId]; return s ? s.stats.hp + (c.level - 1) * 4 : 30; }
export function attackValue(c) { const s = SPECIES[c.speciesId]; return (s?.stats.attack ?? 10) + Math.floor(c.level * 1.6); }
export function defenseValue(c) { const s = SPECIES[c.speciesId]; return (s?.stats.defense ?? 10) + Math.floor(c.level * 1.2); }
export function damage(attacker, defender, move, roll = 1) { const a = SPECIES[attacker.speciesId], d = SPECIES[defender.speciesId]; if (!a || !d)
    return { value: 0, effective: false }; const effective = TYPE_ADV[move.element] === d.element; const same = a.element === move.element ? 1.2 : 1; let mult = effective ? 1.45 : TYPE_ADV[d.element] === move.element ? 0.8 : 1; const raw = (move.power * (attackValue(attacker) / Math.max(5, defenseValue(defender))) * .66 + attacker.level * .55) * same * mult * roll; return { value: Math.max(1, Math.floor(raw)), effective }; }
export function createCreature(speciesId, level, rng = Math.random) { const sp = SPECIES[speciesId]; if (!sp)
    throw Error('Especie desconocida'); const c = { uid: `${speciesId}-${Math.floor(rng() * 1000000000)}`, speciesId, level, exp: 0, hp: 1, moves: learnableMoves(speciesId, level) }; c.hp = maxHp(c); return c; }
export function gainExp(c, amount) { const before = c.level; const s = SPECIES[c.speciesId]; c.exp += amount; while (c.level < 30 && c.exp >= c.level * 12) {
    c.exp -= c.level * 12;
    c.level++;
} let evolved = false; if (s?.evo && c.level >= s.evo.level) {
    c.speciesId = s.evo.id;
    evolved = true;
} if (c.level >= 7) {
    c.moves = [...new Set([...c.moves, ...learnableMoves(c.speciesId, c.level)])].slice(-4);
} c.hp = Math.min(maxHp(c), c.hp + (c.level - before) * 5 + (evolved ? 12 : 0)); return { levelUp: c.level > before, evolved }; }
export const SAVE_KEY = 'ascii-azur-save-v1';
export function validateBattleCheckpoint(value, team) {
    if (!value || typeof value !== 'object' || !Array.isArray(team))
        return false;
    const b = value, e = b.enemy;
    if (!e || typeof e.uid !== 'string' || e.uid.length > 80 || typeof e.speciesId !== 'string' || !SPECIES[e.speciesId] || !Number.isInteger(e.level) || e.level < 1 || e.level > 30 || !Number.isInteger(e.hp) || e.hp < 0 || e.hp > maxHp(e) || !Number.isInteger(e.exp) || e.exp < 0 || !Array.isArray(e.moves) || e.moves.length < 1 || e.moves.length > 4 || e.moves.some(m => typeof m !== 'string' || !MOVES[m]))
        return false;
    if (!['wild', 'boss', 'expedition'].includes(b.type || '') || !Number.isInteger(b.ally) || b.ally < 0 || b.ally >= team.length || typeof b.guarding !== 'boolean' || ![1, 2].includes(b.bossPhase || 0) || ![0, 1, 2].includes(b.chargeStage ?? -1))
        return false;
    if (b.encounterId !== undefined && (!/^(forest|sanctuary)-[0-2]$/.test(b.encounterId)))
        return false;
    if (!b.effects || typeof b.effects !== 'object' || Array.isArray(b.effects) || Object.keys(b.effects).length > 8)
        return false;
    return Object.entries(b.effects).every(([key, list]) => key.length < 85 && Array.isArray(list) && list.length <= 3 && list.every(s => !!s && ['scorch', 'weaken', 'fracture'].includes(s.kind) && Number.isInteger(s.remaining) && s.remaining >= 1 && s.remaining <= 5));
}
export function validateSave(data) {
    if (!data || typeof data !== 'object')
        return false;
    const v = data;
    const validCreature = (c) => {
        if (!c || typeof c !== 'object')
            return false;
        const a = c;
        return typeof a.speciesId === 'string' && !!SPECIES[a.speciesId] && typeof a.uid === 'string' && a.uid.length <= 80 && Number.isInteger(a.level) && a.level > 0 && a.level <= 30 && Number.isInteger(a.exp) && a.exp >= 0 && Number.isInteger(a.hp) && a.hp >= 0 && a.hp <= maxHp(a) && Array.isArray(a.moves) && a.moves.length >= 1 && a.moves.length <= 4 && a.moves.every(m => typeof m === 'string' && !!MOVES[m]);
    };
    return v.version === 1 && ['village', 'forest', 'sanctuary'].includes(v.zone || '')
        && typeof v.x === 'number' && Number.isFinite(v.x) && v.x >= 0 && v.x < 46
        && typeof v.y === 'number' && Number.isFinite(v.y) && v.y >= 0 && v.y < 32
        && Array.isArray(v.team) && v.team.length > 0 && v.team.length <= 6 && v.team.every(validCreature)
        && Array.isArray(v.storage) && v.storage.length <= 500 && v.storage.every(validCreature)
        && !!v.inventory && Number.isInteger(v.inventory.seals) && v.inventory.seals >= 0 && v.inventory.seals <= 9999
        && Number.isInteger(v.inventory.tonics) && v.inventory.tonics >= 0 && v.inventory.tonics <= 9999
        && Array.isArray(v.flags) && v.flags.length <= 200 && v.flags.every(f => typeof f === 'string' && f.length < 100)
        && (!v.rpg || (Number.isSafeInteger(v.rpg.echoes) && v.rpg.echoes >= 0 && v.rpg.echoes <= 999999 && Array.isArray(v.rpg.completed) && v.rpg.completed.length <= 100 && v.rpg.completed.every(f => typeof f === 'string' && f.length < 100) && Array.isArray(v.rpg.visitedNpcs) && v.rpg.visitedNpcs.length <= 50 && v.rpg.visitedNpcs.every(f => typeof f === 'string' && f.length < 100)))
        && (v.worldSeed === undefined || (Number.isInteger(v.worldSeed) && v.worldSeed >= 0 && v.worldSeed <= 4294967295))
        && (v.worldSnapshot === undefined || (v.worldSeed !== undefined && v.worldSeed > 0 && validateWorldSnapshot(v.worldSnapshot)))
        && (v.activeBattle === undefined || (validateBattleCheckpoint(v.activeBattle, v.team) && (v.activeBattle.type !== 'expedition' || !!v.expedition?.pending)))
        && (v.discovered === undefined || validDiscovery(v.discovered))
        && (v.expedition === undefined || validateExpedition(v.expedition))
        && (v.dungeon === undefined || validateDungeon(v.dungeon))
        && typeof v.defeatedBoss === 'boolean' && typeof v.playSeconds === 'number' && Number.isFinite(v.playSeconds) && v.playSeconds >= 0;
}
