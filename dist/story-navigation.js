import { arkenStoryIndex } from './story-campaign.js';
import { ZONES, WORLD_W, WORLD_H, canOccupy, getWorldRevision } from './world.js';
const MARKS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
function arrow(dx, dy) {
    const a = Math.atan2(dy, dx);
    return MARKS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}
function landmark(zone, kind, right = true) {
    const matches = ZONES[zone].landmarks.filter(p => p.kind === kind);
    return right ? matches[matches.length - 1] : matches[0];
}
const azurRoutes = new Map();
let azurRouteRevision = -1;
const azurNeighbors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function azurRoute(zone, target) {
    const revision = getWorldRevision();
    if (revision !== azurRouteRevision) {
        azurRoutes.clear();
        azurRouteRevision = revision;
    }
    const key = `${zone}:${target.kind}:${target.x}:${target.y}`;
    const cached = azurRoutes.get(key);
    if (cached)
        return cached;
    const length = WORLD_W * WORLD_H;
    const cost = new Int16Array(length).fill(-1), next = new Int16Array(length).fill(-1);
    const queue = new Int16Array(length);
    const valid = (x, y) => x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H && canOccupy(zone, x, y, .19);
    let head = 0, tail = 0;
    for (let y = Math.floor(target.y) - 2; y <= Math.ceil(target.y) + 2; y++)
        for (let x = Math.floor(target.x) - 2; x <= Math.ceil(target.x) + 2; x++) {
            if (!valid(x, y) || Math.hypot(x - target.x, y - target.y) > 1.65)
                continue;
            const n = y * WORLD_W + x;
            cost[n] = 0;
            queue[tail++] = n;
        }
    while (head < tail) {
        const n = queue[head++], x = n % WORLD_W, y = (n / WORLD_W) | 0;
        for (const [dx, dy] of azurNeighbors) {
            const xx = x + dx, yy = y + dy;
            if (!valid(xx, yy))
                continue;
            const m = yy * WORLD_W + xx;
            if (cost[m] !== -1)
                continue;
            cost[m] = cost[n] + 1;
            next[m] = n;
            queue[tail++] = m;
        }
    }
    const route = { cost, next };
    azurRoutes.set(key, route);
    return route;
}
function azurRouteStart(position, cost) {
    const px = Math.round(position.x), py = Math.round(position.y);
    let best = -1, bestDistance = Infinity;
    for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
            const x = px + dx, y = py + dy;
            if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H)
                continue;
            const n = y * WORLD_W + x;
            if (cost[n] === -1)
                continue;
            const dist = Math.hypot(position.x - x, position.y - y);
            if (dist < bestDistance) {
                best = n;
                bestDistance = dist;
            }
        }
    return best;
}
export function storyGuidance(story, position) {
    const step = arkenStoryIndex(story);
    const simple = (text, kind) => ({ text, direction: '✦', distance: null, target: null, kind });
    if (step === 6)
        return simple('ARKEN RESTAURADO', 'completed');
    if (position.inDungeon)
        return simple(step === 4 ? 'EXPLORA LA CRIPTA' : 'REGRESA A ARKEN', 'dungeon');
    if (step === 4)
        return simple('MENÚ → CRIPTA EXPLORABLE', 'menu');
    const destination = step === 0 || step === 5 ? 'village' : step === 1 ? 'forest' : 'sanctuary';
    let target;
    let title;
    if (position.zone === destination) {
        if (step === 0 || step === 5) {
            target = ZONES.village.landmarks.find(l => l.npcId === 'archivist');
            title = 'ARCHIVISTA';
        }
        else if (step === 3) {
            target = landmark('sanctuary', 'guardian');
            title = 'HOLLOWHART';
        }
        else
            return simple('ZONA ALCANZADA · AVANZA', 'interaction');
    }
    else {
        const goingWest = destination === 'village' || (destination === 'forest' && position.zone === 'sanctuary');
        target = landmark(position.zone, 'portal', !goingWest);
        title = goingWest ? 'PORTAL OESTE' : 'PORTAL ESTE';
    }
    if (!target)
        return simple('CONSULTA EL DIARIO', 'menu');
    if (Math.hypot(target.x - position.x, target.y - position.y) <= 1.65)
        return { text: `✦ ${title} · ACCIÓN`, direction: '✦', distance: 0, target, kind: 'interaction', waypoint: null };
    const route = azurRoute(position.zone, target), start = azurRouteStart(position, route.cost);
    if (start < 0)
        return simple('RUTA BLOQUEADA · CONSULTA EL DIARIO', 'menu');
    const next = route.next[start];
    if (next === undefined || next < 0)
        return { text: `✦ ${title} · ACÉRCATE`, direction: '✦', distance: 0, target, kind: 'interaction', waypoint: null };
    const x = next % WORLD_W, y = (next / WORLD_W) | 0;
    const direction = arrow(x - position.x, y - position.y), distance = route.cost[start] + 1;
    return { text: `${direction} ${title} · ${distance} PASOS · RUTA`, direction, distance, target, kind: 'target', waypoint: { x, y } };
}
