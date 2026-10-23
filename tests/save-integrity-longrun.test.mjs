import test from 'node:test';
import assert from 'node:assert/strict';
import {readSave,writeSave,saveKeyForSlot,backupKeyForSlot,SaveConflictError} from '../dist/core/save-store.js';
import {createCreature,validateSave} from '../dist/domain.js';
import {configureWorld,captureWorldSnapshot,ZONE_IDS} from '../dist/world.js';

const startingSave=()=>({
 version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.25)],
 storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:0
});
const storage=()=>{
 const map=new Map();
 return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>{map.set(key,value);}};
};

test('Q2: 7-region snapshots round-trip through legacy three-region saves without moving historic terrain',()=>{
 try{
  for(const seed of [1,412,9001,65537,0x7fffffff]){
   configureWorld(seed);
   const full=captureWorldSnapshot();
   assert.ok(full);
   const legacy={
    gen:1,
    tiles:Object.fromEntries(['village','forest','sanctuary'].map(z=>[z,full.tiles[z]])),
    poi:Object.fromEntries(['village','forest','sanctuary'].map(z=>[z,full.poi[z]]))
   };
   const first={...startingSave(),worldSeed:seed,worldSnapshot:legacy};
   assert.ok(validateSave(first),'legacy v1 snapshot rejected');
   const db=storage();
   const initial=writeSave(db,first,null);
   assert.equal(readSave(db).state.worldSnapshot.tiles.forest,full.tiles.forest);
   configureWorld(seed,readSave(db).state.worldSnapshot);
   const expanded=captureWorldSnapshot();
   assert.equal(Object.keys(expanded.tiles).length,ZONE_IDS.length);
   for(const zone of ['village','forest','sanctuary']){
    assert.equal(expanded.tiles[zone],legacy.tiles[zone]);
    assert.deepEqual(expanded.poi[zone],legacy.poi[zone]);
   }
   const second=writeSave(db,{...first,worldSnapshot:expanded,playSeconds:30},initial);
   assert.equal(readSave(db).state.worldSnapshot.tiles.garden,expanded.tiles.garden);
   assert.equal(JSON.parse(db.getItem(backupKeyForSlot(1))).playSeconds,0);
   assert.equal(db.getItem(saveKeyForSlot(1)),second);
  }
 }finally{configureWorld(0);}
});

test('Q2: silent backup refusal never overwrites the only valid primary',()=>{
 const db=storage(),first=startingSave();
 const original=writeSave(db,first,null);
 const set=db.setItem;
 db.setItem=(key,value)=>{if(key!==backupKeyForSlot(1))set(key,value);};
 assert.throws(()=>writeSave(db,{...first,playSeconds:10},original),/respaldo/);
 assert.equal(db.getItem(saveKeyForSlot(1)),original);
 assert.equal(readSave(db).state.playSeconds,0);
});

test('Q2: 9,000 interleaved slot writes survive quota faults, torn primary writes and stale sessions',()=>{
 const db=storage(),base=startingSave(),latest=new Map(),expectedRaw=new Map();
 for(const slot of [1,2,3]){
  const state={...base,playSeconds:slot};
  expectedRaw.set(slot,writeSave(db,state,null,slot));
  latest.set(slot,slot);
 }
 for(let n=1;n<=9000;n++){
  const slot=(n%3)+1,key=saveKeyForSlot(slot),backup=backupKeyForSlot(slot);
  const oldRaw=db.getItem(key),next={...base,playSeconds:100+n,flags:['checkpoint-'+(n%60)]};
  const set=db.setItem;
  const quota=n%97===0,partial=n%113===0;
  if(quota||partial)db.setItem=(k,v)=>{
   if(quota&&(k===backup||k===key))throw Error('simulated quota');
   if(partial&&k===key){set(k,v.slice(0,20));return;}
   set(k,v);
  };
  try{
   if(quota||partial){
    assert.throws(()=>writeSave(db,next,oldRaw,slot));
   }else{
    expectedRaw.set(slot,writeSave(db,next,oldRaw,slot));
    latest.set(slot,next.playSeconds);
   }
  }finally{db.setItem=set;}
  const recovered=readSave(db,slot);
  assert.ok(recovered,'all durable generations lost at step '+n);
  assert.equal(recovered.state.playSeconds,latest.get(slot),'wrong recovered state at step '+n);
  // A recovered torn primary is compared against the current raw payload
  // on the next iteration, never blindly overwriting another tab's change.
  if(n%211===0){
   const stale=expectedRaw.get(slot);
   const foreign={...base,playSeconds:50000+n};
   const actual=db.getItem(key);
   const committed=writeSave(db,foreign,actual,slot);
   assert.throws(()=>writeSave(db,next,stale,slot),SaveConflictError);
   expectedRaw.set(slot,committed);latest.set(slot,foreign.playSeconds);
  }
 }
 for(const slot of [1,2,3]){
  assert.equal(readSave(db,slot).state.playSeconds,latest.get(slot));
  assert.notEqual(saveKeyForSlot(slot),backupKeyForSlot(slot));
 }
});
