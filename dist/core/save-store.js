/** Crash-resistant local save rotation. Preserves the v1 schema and original key. */
import { SAVE_KEY, validateSave } from '../domain.js';
export const BACKUP_SAVE_KEY = SAVE_KEY + '-backup';
function decode(raw) {
    if (!raw || raw.length > 1_000_000)
        return null;
    try {
        const value = JSON.parse(raw);
        return validateSave(value) ? value : null;
    }
    catch {
        return null;
    }
}
export function readSave(store) {
    const current = decode(store.getItem(SAVE_KEY));
    if (current)
        return { state: current, source: 'primary' };
    const fallback = decode(store.getItem(BACKUP_SAVE_KEY));
    return fallback ? { state: fallback, source: 'backup' } : null;
}
export function writeSave(store, state) {
    if (!validateSave(state))
        throw Error('No se puede guardar una partida inválida');
    const previous = store.getItem(SAVE_KEY);
    const payload = JSON.stringify(state);
    if (payload.length > 1_000_000)
        throw Error('La partida supera el máximo permitido');
    // Never replace a good backup with an already corrupted primary.
    if (previous && decode(previous)) {
        try {
            store.setItem(BACKUP_SAVE_KEY, previous);
        }
        catch { /* main slot still takes priority */ }
    }
    store.setItem(SAVE_KEY, payload);
}
