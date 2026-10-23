import test from 'node:test';import assert from 'node:assert/strict';
import {readSave,writeSave,BACKUP_SAVE_KEY,SaveConflictError} from '../dist/core/save-store.js';
import {SAVE_KEY,createCreature} from '../dist/domain.js';
const state=()=>({version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.25)],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:30});
function store(){const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};}
test('save remains compatible with legacy slot and version',()=>{const s=store();writeSave(s,state());assert.equal(readSave(s).source,'primary');assert.ok(s.getItem(SAVE_KEY));assert.equal(s.getItem(BACKUP_SAVE_KEY),null);});
test('rotation maintains preceding valid save',()=>{const s=store(),v=state();writeSave(s,v);v.playSeconds=49;writeSave(s,v);assert.equal(readSave(s).state.playSeconds,49);assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);});
test('corrupt primary is recovered using backup without poisoning it',()=>{const s=store(),v=state();writeSave(s,v);v.playSeconds=49;writeSave(s,v);s.setItem(SAVE_KEY,'{BROKEN');assert.equal(readSave(s).source,'backup');assert.equal(readSave(s).state.playSeconds,30);writeSave(s,v);assert.equal(readSave(s).state.playSeconds,49);assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);});
test('invalid/unreasonably large payloads do not replace saves',()=>{const s=store();writeSave(s,state());const old=s.getItem(SAVE_KEY);assert.throws(()=>writeSave(s,{...state(),x:NaN}));assert.equal(s.getItem(SAVE_KEY),old);});
test('store refusal raises error but preserves readable previous state',()=>{const s=store();writeSave(s,state());s.setItem=(k,v)=>{if(k===SAVE_KEY)throw Error('quota');s.map.set(k,v);};assert.throws(()=>writeSave(s,state()));assert.ok(readSave(s));});

test('stale tabs cannot overwrite a newer local save or its backup',()=>{
 const s=store(),first=state();
 const baseline=writeSave(s,first,null);
 const next={...first,playSeconds:52};
 const current=writeSave(s,next,baseline);
 assert.equal(current,s.getItem(SAVE_KEY));
 assert.throws(()=>writeSave(s,{...first,playSeconds:99},baseline),SaveConflictError);
 assert.equal(readSave(s).state.playSeconds,52);
 assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);
});
test('empty-slot expectation detects a concurrent first save',()=>{
 const s=store();
 const first=writeSave(s,state(),null);
 assert.ok(first);
 assert.throws(()=>writeSave(s,{...state(),playSeconds:80},null),SaveConflictError);
 assert.equal(readSave(s).state.playSeconds,30);
});
test('rejected save does not advance the optimistic revision',()=>{
 const s=store(),baseline=writeSave(s,state());
 let writes=0;const flaky={getItem:s.getItem,setItem:(k,v)=>{if(k===SAVE_KEY&&writes++===0)throw Error('quota');s.setItem(k,v);}};
 const next={...state(),playSeconds:88};
 assert.throws(()=>writeSave(flaky,next,baseline),/quota/);
 assert.equal(readSave(s).state.playSeconds,30);
 const committed=writeSave(flaky,next,baseline);
 assert.equal(committed,s.getItem(SAVE_KEY));
 assert.equal(readSave(s).state.playSeconds,88);
});
test('thousand consecutive v1 rotations recover the preceding good state',()=>{
 const s=store();let expected=null;
 for(let i=0;i<1000;i++)expected=writeSave(s,{...state(),playSeconds:i},expected);
 assert.equal(readSave(s).state.playSeconds,999);
 s.setItem(SAVE_KEY,'{BROKEN');
 assert.equal(readSave(s).source,'backup');
 assert.equal(readSave(s).state.playSeconds,998);
});
