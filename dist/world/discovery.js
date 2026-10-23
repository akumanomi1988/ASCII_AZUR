import { WORLD_W, WORLD_H } from '../world.js';
export const DISCOVERY_CELLS = WORLD_W * WORLD_H;
export function validDiscovery(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return false;
    return Object.entries(v).every(([k, value]) => ['village', 'forest', 'sanctuary', 'marsh'].includes(k)
        && typeof value === 'string' && value.length === DISCOVERY_CELLS && /^[01]+$/.test(value));
}
export function isDiscovered(discovered, zone, x, y, legacy = false) {
    if (legacy)
        return true;
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H)
        return false;
    return discovered?.[zone]?.[Math.floor(y) * WORLD_W + Math.floor(x)] === '1';
}
export function reveal(discovered, zone, x, y, radius = 4.4) {
    const next = { ...(discovered || {}) };
    const mask = (next[zone] || '0'.repeat(DISCOVERY_CELLS)).split('');
    for (let yy = Math.max(0, Math.floor(y - radius)); yy <= Math.min(WORLD_H - 1, Math.ceil(y + radius)); yy++) {
        for (let xx = Math.max(0, Math.floor(x - radius)); xx <= Math.min(WORLD_W - 1, Math.ceil(x + radius)); xx++) {
            if (Math.hypot(xx - x, yy - y) <= radius)
                mask[yy * WORLD_W + xx] = '1';
        }
    }
    next[zone] = mask.join('');
    return next;
}
export function discoveredPercent(discovered, zone) {
    const mask = discovered?.[zone];
    if (!mask)
        return 0;
    let count = 0;
    for (const char of mask)
        if (char === '1')
            count++;
    return Math.floor(count / DISCOVERY_CELLS * 100);
}
