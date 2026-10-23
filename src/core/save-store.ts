/** Crash-resistant local save rotation. Preserves the v1 schema and original key.
 * Callers may supply their last observed primary payload to reject stale-tab writes. */
import {SAVE_KEY,validateSave,type SaveGame} from '../domain.js';

export const BACKUP_SAVE_KEY=SAVE_KEY+'-backup';
export interface SaveStore {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type RestoredSave={state:SaveGame;source:'primary'|'backup'};
export class SaveConflictError extends Error {
 constructor(){super('Otra pestaña ha modificado esta partida. Exporta tu progreso antes de recargar.');this.name='SaveConflictError';}
}
const MAX_SAVE_LENGTH=1_000_000;
function decode(raw:string|null):SaveGame|null{
 if(!raw||raw.length>MAX_SAVE_LENGTH)return null;
 try{const value:unknown=JSON.parse(raw);return validateSave(value)?value:null;}catch{return null;}
}
function readSlot(store:SaveStore,key:string):string|null{
 try{return store.getItem(key);}catch{return null;}
}
export function readSave(store:SaveStore):RestoredSave|null{
 const current=decode(readSlot(store,SAVE_KEY));
 if(current)return{state:current,source:'primary'};
 const fallback=decode(readSlot(store,BACKUP_SAVE_KEY));
 return fallback?{state:fallback,source:'backup'}:null;
}
/** Returns the exact committed payload so a game session can track its baseline.
 * A mismatching expectedPrimary fails before either slot is touched.
 * Backups must be durable before advancing an existing valid primary. */
export function writeSave(store:SaveStore,state:SaveGame,expectedPrimary?:string|null):string{
 if(!validateSave(state))throw Error('No se puede guardar una partida inválida');
 const payload=JSON.stringify(state);
 if(payload.length>MAX_SAVE_LENGTH)throw Error('La partida supera el máximo permitido');
 const previous=store.getItem(SAVE_KEY);
 if(expectedPrimary!==undefined&&previous!==expectedPrimary)throw new SaveConflictError();
 if(previous===payload)return payload;
 // Fail closed on backup quota/refusal: never replace the only verified save.
 if(previous&&decode(previous))store.setItem(BACKUP_SAVE_KEY,previous);
 // If this write is interrupted, the old primary and/or backup remains readable.
 store.setItem(SAVE_KEY,payload);
 if(store.getItem(SAVE_KEY)!==payload)throw Error('El almacenamiento no confirmó el guardado');
 return payload;
}
