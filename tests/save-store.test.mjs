import test from 'node:test';import assert from 'node:assert/strict';
import {readSave,writeSave,BACKUP_SAVE_KEY} from '../dist/core/save-store.js';
import {SAVE_KEY,createCreature} from '../dist/domain.js';
const state=()=>({version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.25)],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:30});
function store(){const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};}
test('save remains compatible with legacy slot and version',()=>{const s=store();writeSave(s,state());assert.equal(readSave(s).source,'primary');assert.ok(s.getItem(SAVE_KEY));assert.equal(s.getItem(BACKUP_SAVE_KEY),null);});
test('rotation maintains preceding valid save',()=>{const s=store(),v=state();writeSave(s,v);v.playSeconds=49;writeSave(s,v);assert.equal(readSave(s).state.playSeconds,49);assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);});
test('corrupt primary is recovered using backup without poisoning it',()=>{const s=store(),v=state();writeSave(s,v);v.playSeconds=49;writeSave(s,v);s.setItem(SAVE_KEY,'{BROKEN');assert.equal(readSave(s).source,'backup');assert.equal(readSave(s).state.playSeconds,30);writeSave(s,v);assert.equal(readSave(s).state.playSeconds,49);assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);});
test('invalid/unreasonably large payloads do not replace saves',()=>{const s=store();writeSave(s,state());const old=s.getItem(SAVE_KEY);assert.throws(()=>writeSave(s,{...state(),x:NaN}));assert.equal(s.getItem(SAVE_KEY),old);});
test('store refusal raises error but preserves readable previous state',()=>{const s=store();writeSave(s,state());s.setItem=(k,v)=>{if(k===SAVE_KEY)throw Error('quota');s.map.set(k,v);};assert.throws(()=>writeSave(s,state()));assert.ok(readSave(s));});
