import test from 'node:test';
import assert from 'node:assert/strict';
import {readSave,writeSave,BACKUP_SAVE_KEY,SaveConflictError,saveKeyForSlot,backupKeyForSlot,ACTIVE_SAVE_SLOT_KEY} from '../dist/core/save-store.js';
import {SAVE_KEY,createCreature} from '../dist/domain.js';

const state=()=>({version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.25)],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:30});
function store(){
 const map=new Map();
 return{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),map};
}
const advance=(base,seconds)=>({...base,playSeconds:seconds});

test('legacy primary slot and schema stay compatible',()=>{
 const s=store(),original=state();
 const payload=writeSave(s,original,null);
 assert.equal(payload,s.getItem(SAVE_KEY));
 assert.equal(readSave(s).source,'primary');
 assert.deepEqual(readSave(s).state,original);
 assert.equal(s.getItem(BACKUP_SAVE_KEY),null);
});
test('rotation keeps the immediately preceding valid save',()=>{
 const s=store(),first=state();
 writeSave(s,first);
 writeSave(s,advance(first,49));
 assert.equal(readSave(s).state.playSeconds,49);
 assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);
});
test('identical saves do not churn the backup slot',()=>{
 const s=store(),first=state();
 writeSave(s,first);
 const baseline=s.getItem(SAVE_KEY);
 writeSave(s,first,baseline);
 assert.equal(s.getItem(BACKUP_SAVE_KEY),null);
});
test('corrupt primary is recovered without poisoning the backup',()=>{
 const s=store(),first=state();
 writeSave(s,first);writeSave(s,advance(first,49));
 s.setItem(SAVE_KEY,'{BROKEN');
 assert.equal(readSave(s).source,'backup');
 assert.equal(readSave(s).state.playSeconds,30);
 writeSave(s,advance(first,60),'{BROKEN');
 assert.equal(readSave(s).state.playSeconds,60);
 assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);
});
test('oversized primary falls back to the verified backup',()=>{
 const s=store(),first=state();
 writeSave(s,first);writeSave(s,advance(first,40));
 s.setItem(SAVE_KEY,'x'.repeat(1_000_001));
 assert.equal(readSave(s).source,'backup');
 assert.equal(readSave(s).state.playSeconds,30);
});
test('primary read errors do not prevent backup recovery',()=>{
 const s=store(),first=state();
 writeSave(s,first);writeSave(s,advance(first,40));
 const get=s.getItem;
 s.getItem=key=>key===SAVE_KEY?(()=>{throw Error('denied');})():get(key);
 assert.equal(readSave(s).source,'backup');
});
test('invalid save rejects before modifying either slot',()=>{
 const s=store();writeSave(s,state());
 const primary=s.getItem(SAVE_KEY),backup=s.getItem(BACKUP_SAVE_KEY);
 assert.throws(()=>writeSave(s,{...state(),x:NaN}));
 assert.equal(s.getItem(SAVE_KEY),primary);
 assert.equal(s.getItem(BACKUP_SAVE_KEY),backup);
});
test('stale-tab writes refuse to overwrite newer progress or its backup',()=>{
 const s=store(),first=state();
 writeSave(s,first);
 const tabA=s.getItem(SAVE_KEY),tabB=s.getItem(SAVE_KEY);
 const next=writeSave(s,advance(first,45),tabA);
 const backup=s.getItem(BACKUP_SAVE_KEY);
 assert.throws(()=>writeSave(s,advance(first,100),tabB),SaveConflictError);
 assert.equal(s.getItem(SAVE_KEY),next);
 assert.equal(s.getItem(BACKUP_SAVE_KEY),backup);
});
test('new-session expected empty slot detects a concurrent first save',()=>{
 const s=store(),first=state();
 writeSave(s,first);
 assert.throws(()=>writeSave(s,advance(first,80),null),SaveConflictError);
 assert.equal(readSave(s).state.playSeconds,30);
});
test('backup quota failure preserves the current primary',()=>{
 const s=store(),first=state();
 writeSave(s,first);const primary=s.getItem(SAVE_KEY);
 const set=s.setItem;s.setItem=(key,value)=>{if(key===BACKUP_SAVE_KEY)throw Error('quota');set(key,value);};
 assert.throws(()=>writeSave(s,advance(first,60),primary),/quota/);
 assert.equal(s.getItem(SAVE_KEY),primary);
 assert.equal(s.getItem(BACKUP_SAVE_KEY),null);
});
test('interrupted primary write still leaves a valid readable save',()=>{
 const s=store(),first=state();
 writeSave(s,first);const primary=s.getItem(SAVE_KEY);
 const set=s.setItem;s.setItem=(key,value)=>{if(key===SAVE_KEY)throw Error('interrupted');set(key,value);};
 assert.throws(()=>writeSave(s,advance(first,60),primary),/interrupted/);
 assert.equal(s.getItem(SAVE_KEY),primary);
 assert.equal(readSave(s).state.playSeconds,30);
 assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,30);
});
test('partial primary writes fail verification and restore from backup',()=>{
 const s=store(),first=state();
 writeSave(s,first);const primary=s.getItem(SAVE_KEY);
 const set=s.setItem;s.setItem=(key,value)=>set(key,key===SAVE_KEY?value.slice(0,20):value);
 assert.throws(()=>writeSave(s,advance(first,60),primary),/confirmó/);
 assert.equal(readSave(s).source,'backup');
 assert.equal(readSave(s).state.playSeconds,30);
});
test('500 save rotations preserve latest progression and one-step rollback',()=>{
 const s=store(),first=state();
 let baseline=writeSave(s,first);
 for(let seconds=31;seconds<=530;seconds++)baseline=writeSave(s,advance(first,seconds),baseline);
 assert.equal(readSave(s).state.playSeconds,530);
 assert.equal(JSON.parse(s.getItem(BACKUP_SAVE_KEY)).playSeconds,529);
 assert.equal(s.getItem(SAVE_KEY),baseline);
});

test('three campaign slots use isolated keys without moving legacy slot one',()=>{
 const s=store(),first=state();
 assert.equal(saveKeyForSlot(1),SAVE_KEY);
 assert.equal(backupKeyForSlot(1),BACKUP_SAVE_KEY);
 assert.equal(ACTIVE_SAVE_SLOT_KEY,SAVE_KEY+'-active-slot');
 assert.notEqual(saveKeyForSlot(2),saveKeyForSlot(3));
 writeSave(s,first,null,1);
 writeSave(s,advance(first,120),null,2);
 writeSave(s,advance(first,240),null,3);
 assert.equal(readSave(s,1).state.playSeconds,30);
 assert.equal(readSave(s,2).state.playSeconds,120);
 assert.equal(readSave(s,3).state.playSeconds,240);
 assert.equal(s.getItem(SAVE_KEY),JSON.stringify(first));
 assert.equal(s.getItem(BACKUP_SAVE_KEY),null);
});
test('slot-specific backups and concurrent writes never affect another campaign',()=>{
 const s=store(),first=state();
 const baseline1=writeSave(s,first,null,1);
 const baseline2=writeSave(s,advance(first,80),null,2);
 const slot2=writeSave(s,advance(first,90),baseline2,2);
 assert.throws(()=>writeSave(s,advance(first,95),baseline2,2),SaveConflictError);
 assert.equal(readSave(s,1).state.playSeconds,30);
 assert.equal(s.getItem(SAVE_KEY),baseline1);
 assert.equal(readSave(s,2).state.playSeconds,90);
 assert.equal(s.getItem(saveKeyForSlot(2)),slot2);
 assert.equal(JSON.parse(s.getItem(backupKeyForSlot(2))).playSeconds,80);
 s.setItem(saveKeyForSlot(2),'{corrupt');
 assert.equal(readSave(s,2).source,'backup');
 assert.equal(readSave(s,2).state.playSeconds,80);
 assert.equal(readSave(s,1).state.playSeconds,30);
});
test('repeated independent slot rotations preserve latest and previous checkpoints',()=>{
 const s=store(),first=state();
 for(const slot of [1,2,3]){
  let baseline=writeSave(s,advance(first,slot*1000),null,slot);
  for(let n=1;n<=1200;n++)baseline=writeSave(s,advance(first,slot*1000+n),baseline,slot);
  assert.equal(readSave(s,slot).state.playSeconds,slot*1000+1200);
  assert.equal(JSON.parse(s.getItem(backupKeyForSlot(slot))).playSeconds,slot*1000+1199);
  assert.equal(s.getItem(saveKeyForSlot(slot)),baseline);
 }
});
test('invalid slot is rejected without touching any stored campaign',()=>{
 const s=store(),first=state();writeSave(s,first,null,1);
 assert.throws(()=>saveKeyForSlot(0),/Invalid campaign slot/);
 assert.throws(()=>writeSave(s,advance(first,33),null,9),/Invalid campaign slot/);
 assert.equal(readSave(s,1).state.playSeconds,30);
 assert.equal(s.map.size,1);
});
