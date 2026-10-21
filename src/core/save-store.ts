/** Crash-resistant local save rotation. Preserves the v1 schema and original key. */
import {SAVE_KEY,validateSave,type SaveGame} from '../domain.js';
export const BACKUP_SAVE_KEY=SAVE_KEY+'-backup';
export interface SaveStore {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type RestoredSave={state:SaveGame;source:'primary'|'backup'};
function decode(raw:string|null):SaveGame|null{
 if(!raw||raw.length>1_000_000)return null;
 try{const value:unknown=JSON.parse(raw);return validateSave(value)?value:null;}catch{return null;}
}
export function readSave(store:SaveStore):RestoredSave|null{
 const current=decode(store.getItem(SAVE_KEY));if(current)return{state:current,source:'primary'};
 const fallback=decode(store.getItem(BACKUP_SAVE_KEY));return fallback?{state:fallback,source:'backup'}:null;
}
export function writeSave(store:SaveStore,state:SaveGame):void{
 if(!validateSave(state))throw Error('No se puede guardar una partida inválida');
 const previous=store.getItem(SAVE_KEY);
 const payload=JSON.stringify(state);
 if(payload.length>1_000_000)throw Error('La partida supera el máximo permitido');
 // Never replace a good backup with an already corrupted primary.
 if(previous&&decode(previous)){
  try{store.setItem(BACKUP_SAVE_KEY,previous);}catch{/* main slot still takes priority */}
 }
 store.setItem(SAVE_KEY,payload);
}
