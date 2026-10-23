/** Crash-resistant local save rotation. Preserves the v1 schema and original key.
 * Callers may supply their last observed primary payload to reject stale-tab writes. */
import { SAVE_KEY, validateSave } from '../domain.js';
export const BACKUP_SAVE_KEY = SAVE_KEY + '-backup';
/** Slot 1 retains the original keys byte-for-byte. Additional slots are isolated. */
export const SAVE_SLOTS = [1, 2, 3];
export const ACTIVE_SAVE_SLOT_KEY = SAVE_KEY + '-active-slot';
export function saveKeyForSlot(slot) {
    if (slot !== 1 && slot !== 2 && slot !== 3)
        throw Error('Invalid campaign slot');
    return slot === 1 ? SAVE_KEY : SAVE_KEY + '-slot-' + slot;
}
export function backupKeyForSlot(slot) {
    return slot === 1 ? BACKUP_SAVE_KEY : saveKeyForSlot(slot) + '-backup';
}
export class SaveConflictError extends Error {
    constructor() { super('Otra pestaña ha modificado esta partida. Exporta tu progreso antes de recargar.'); this.name = 'SaveConflictError'; }
}
const MAX_SAVE_LENGTH = 1_000_000;
function decode(raw) {
    if (!raw || raw.length > MAX_SAVE_LENGTH)
        return null;
    try {
        const value = JSON.parse(raw);
        return validateSave(value) ? value : null;
    }
    catch {
        return null;
    }
}
function readSlot(store, key) {
    try {
        return store.getItem(key);
    }
    catch {
        return null;
    }
}
export function readSave(store, slot = 1) {
    const current = decode(readSlot(store, saveKeyForSlot(slot)));
    if (current)
        return { state: current, source: 'primary' };
    const fallback = decode(readSlot(store, backupKeyForSlot(slot)));
    return fallback ? { state: fallback, source: 'backup' } : null;
}
/** Returns the exact committed payload so a game session can track its baseline.
 * A mismatching expectedPrimary fails before either slot is touched.
 * Backups must be durable before advancing an existing valid primary. */
export function writeSave(store, state, expectedPrimary, slot = 1) {
    if (!validateSave(state))
        throw Error('No se puede guardar una partida inválida');
    const payload = JSON.stringify(state);
    if (payload.length > MAX_SAVE_LENGTH)
        throw Error('La partida supera el máximo permitido');
    const key = saveKeyForSlot(slot), backup = backupKeyForSlot(slot);
    const previous = store.getItem(key);
    if (expectedPrimary !== undefined && previous !== expectedPrimary)
        throw new SaveConflictError();
    if (previous === payload)
        return payload;
    // Fail closed on backup quota/refusal: never replace the only verified save.
    if (previous && decode(previous)) {
        store.setItem(backup, previous);
        // A storage adapter that silently drops the backup must not risk the only good copy.
        if (store.getItem(backup) !== previous)
            throw Error('El almacenamiento no confirmó el respaldo');
    }
    // If this write is interrupted, the old primary and/or backup remains readable.
    store.setItem(key, payload);
    if (store.getItem(key) !== payload)
        throw Error('El almacenamiento no confirmó el guardado');
    return payload;
}
