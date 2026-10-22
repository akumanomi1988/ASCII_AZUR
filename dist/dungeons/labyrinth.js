/** A fully spatial, persistent expedition: authored room grammar + seeded topology.
 * Immutable layout, mutable exploration/encounter state. No HTML or rendering dependency.
 */
export const DUNGEON_W = 43, DUNGEON_H = 29, DUNGEON_VERSION = 1;
const idx = (x, y) => y * DUNGEON_W + x;
const walkable = (t) => t === '.' || t === '+';
function prng(seed) { let s = seed >>> 0; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
export function generateDungeon(seed) {
    if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff)
        throw Error('Semilla inválida');
    const rand = prng(seed ^ 0x5bf03635), tiles = new Array(DUNGEON_W * DUNGEON_H).fill('#');
    const set = (x, y, ch = '.') => { if (x > 0 && x < DUNGEON_W - 1 && y > 0 && y < DUNGEON_H - 1)
        tiles[idx(x, y)] = ch; };
    const roomCenters = [];
    // Eight readable chambers: randomized shapes, invariant safe footprint, coherent grid topology.
    for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++) {
            const cx = 6 + col * 10 + Math.floor(rand() * 3) - 1, cy = 8 + row * 12 + Math.floor(rand() * 3) - 1;
            roomCenters.push({ x: cx, y: cy });
            const hw = 2 + Math.floor(rand() * 2), hh = 2 + Math.floor(rand() * 2);
            for (let y = cy - hh; y <= cy + hh; y++)
                for (let x = cx - hw; x <= cx + hw; x++)
                    set(x, y);
        }
    const link = (a, b) => {
        const from = roomCenters[a], to = roomCenters[b];
        const bendVertical = rand() > .5;
        const carveLine = (x1, y1, x2, y2) => {
            const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), length = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            for (let i = 0; i <= length; i++) {
                const x = x1 + dx * i, y = y1 + dy * i;
                set(x, y, '+');
                if (rand() > .91)
                    set(x + 1, y);
            }
        };
        if (bendVertical) {
            carveLine(from.x, from.y, from.x, to.y);
            carveLine(from.x, to.y, to.x, to.y);
        }
        else {
            carveLine(from.x, from.y, to.x, from.y);
            carveLine(to.x, from.y, to.x, to.y);
        }
    };
    // Connected snake spanning all eight rooms. Extra vertical connectors form loops.
    for (let i = 0; i < 3; i++)
        link(i, i + 1);
    link(3, 7);
    for (let i = 7; i > 4; i--)
        link(i, i - 1);
    if (rand() > .38)
        link(1, 5);
    if (rand() > .38)
        link(2, 6);
    // Re-carve centers so landmarks never occupy an unwalkable corridor junction.
    for (const p of roomCenters)
        set(p.x, p.y, '.');
    const kind = ['entrance', 'cache', 'enemy', 'rune', 'altar', 'enemy', 'cache', 'exit'];
    const labels = ['Umbral de entrada', 'Arca de los Perdidos', 'Vigía de Ceniza', 'Inscripción partida', 'Lumbre enterrada', 'Centinela sin Nombre', 'Arca del Silencio', 'Puerta del Último Signo'];
    const events = roomCenters.map((p, i) => ({ id: i, ...p, kind: kind[i], label: labels[i], ...(kind[i] === 'enemy' ? { species: i === 2 ? 'ashboar' : 'gravemoth' } : {}) }));
    const start = roomCenters[0];
    const out = { version: 1, seed, tiles: tiles.join(''), events, x: start.x, y: start.y,
        visited: '0'.repeat(DUNGEON_W * DUNGEON_H), cleared: [], pending: null, active: true, finished: false };
    return revealDungeon(out);
}
export function tileDungeon(run, x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    return ix < 0 || iy < 0 || ix >= DUNGEON_W || iy >= DUNGEON_H ? '#' : run.tiles[idx(ix, iy)];
}
export function dungeonConnected(run) {
    const start = run.events[0];
    if (!start)
        return false;
    const queue = [idx(start.x, start.y)], seen = new Uint8Array(DUNGEON_W * DUNGEON_H);
    seen[queue[0]] = 1;
    for (let n = 0; n < queue.length; n++) {
        const cell = queue[n], x = cell % DUNGEON_W, y = Math.floor(cell / DUNGEON_W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= DUNGEON_W || ny >= DUNGEON_H)
                continue;
            const id = idx(nx, ny);
            if (!seen[id] && walkable(tileDungeon(run, nx, ny))) {
                seen[id] = 1;
                queue.push(id);
            }
        }
    }
    return run.events.every(e => seen[idx(e.x, e.y)] === 1);
}
/** Collision with a foot capsule approximated by a small circle. Substeps avoid tunnelling. */
export function dungeonSweep(run, x, y, dx, dy) {
    // Positions refer to tile centres at integral coordinates; checking from a corner
    // incorrectly rejected single-tile corridors in generated dungeon layouts.
    const can = (px, py) => [
        [0, 0], [.23, 0], [-.23, 0], [0, .23], [0, -.23], [.17, .17], [-.17, -.17], [-.17, .17], [.17, -.17]
    ].every(([ox, oy]) => walkable(tileDungeon(run, px + .5 + ox, py + .5 + oy)));
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / .16));
    for (let i = 0; i < steps; i++) {
        const nx = x + dx / steps, ny = y + dy / steps;
        if (can(nx, y))
            x = nx;
        if (can(x, ny))
            y = ny;
    }
    return { x, y };
}
export function revealDungeon(run) {
    const chars = run.visited.split('');
    const cx = Math.floor(run.x), cy = Math.floor(run.y);
    for (let y = cy - 4; y <= cy + 4; y++)
        for (let x = cx - 4; x <= cx + 4; x++)
            if (x >= 0 && y >= 0 && x < DUNGEON_W && y < DUNGEON_H && Math.hypot(x - cx, y - cy) < 4.5) {
                chars[idx(x, y)] = '1';
            }
    return { ...run, visited: chars.join('') };
}
export function nearbyDungeonEvent(run, distance = 1.65) {
    return run.events.filter(e => !run.cleared.includes(e.id) || e.kind === 'entrance' || e.kind === 'exit')
        .sort((a, b) => Math.hypot(a.x - run.x, a.y - run.y) - Math.hypot(b.x - run.x, b.y - run.y))
        .find(e => Math.hypot(e.x - run.x, e.y - run.y) <= distance);
}
export function dungeonGateOpen(run) { return [2, 3, 5].every(id => run.cleared.includes(id)); }
export function completeDungeonEvent(run, id) {
    const e = run.events.find(e => e.id === id);
    if (!e || e.kind === 'entrance' || e.kind === 'exit' || run.cleared.includes(id))
        throw Error('Evento ya reclamado o inválido');
    if (e.kind === 'enemy' && run.pending !== id)
        throw Error('Encuentro no iniciado');
    return { ...run, cleared: [...run.cleared, id].sort((a, b) => a - b), pending: null };
}
export function validateDungeon(raw) {
    if (!raw || typeof raw !== 'object')
        return false;
    const r = raw;
    if (r.version !== 1 || !Number.isInteger(r.seed) || r.seed < 1 || r.seed > 0xffffffff || typeof r.tiles !== 'string' || typeof r.visited !== 'string' || r.tiles.length !== DUNGEON_W * DUNGEON_H || r.visited.length !== r.tiles.length || !/^[01]+$/.test(r.visited) || !Array.isArray(r.events))
        return false;
    if (!Number.isFinite(r.x) || !Number.isFinite(r.y) || !Number.isFinite(r.pending) && r.pending !== null || typeof r.active !== 'boolean' || typeof r.finished !== 'boolean' || !Array.isArray(r.cleared) || r.cleared.length > 6 || new Set(r.cleared).size !== r.cleared.length)
        return false;
    if (!r.cleared.every(id => Number.isInteger(id) && id >= 1 && id <= 6) || r.pending !== null && ![2, 5].includes(r.pending) || r.pending !== null && r.cleared.includes(r.pending))
        return false;
    if (!walkable(tileDungeon(r, r.x, r.y)))
        return false;
    const original = generateDungeon(r.seed);
    if (r.tiles !== original.tiles || JSON.stringify(r.events) !== JSON.stringify(original.events))
        return false;
    if (r.finished && !dungeonGateOpen(r))
        return false;
    return dungeonConnected(r);
}
