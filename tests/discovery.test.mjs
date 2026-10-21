import test from 'node:test';
import assert from 'node:assert/strict';
import {reveal,validDiscovery,isDiscovered,discoveredPercent} from '../dist/world/discovery.js';
import {configureWorld,captureWorldSnapshot,WORLD_W,WORLD_H} from '../dist/world.js';
import {validateSave,createCreature} from '../dist/domain.js';
import {readSave,writeSave} from '../dist/core/save-store.js';
test('fog of war initially hides undiscovered regions and reveals nearby terrain',()=>{
 const d=reveal({},'village',4,16,4.8);
 assert.equal(validDiscovery(d),true);
 assert.equal(isDiscovered(d,'village',4,16),true);
 assert.equal(isDiscovered(d,'village',30,16),false);
 assert.equal(isDiscovered(d,'forest',4,16),false);
 assert.ok(discoveredPercent(d,'village')>0&&discoveredPercent(d,'village')<20);
});
test('discovery persists across regions and is monotonic',()=>{
 const a=reveal({},'village',4,16,4.8);
 const b=reveal(a,'forest',4,16,4.8);
 const c=reveal(b,'village',40,16,4.8);
 assert.equal(isDiscovered(c,'forest',4,16),true);
 assert.equal(isDiscovered(c,'village',4,16),true);
 assert.ok(discoveredPercent(c,'village')>discoveredPercent(a,'village'));
});
test('corrupted masks and unreasonable flags are rejected',()=>{
 assert.equal(validDiscovery({village:'0'.repeat(WORLD_W*WORLD_H)}),true);
 assert.equal(validDiscovery({village:'1'.repeat(100)}),false);
 assert.equal(validDiscovery({unknown:'1'.repeat(WORLD_W*WORLD_H)}),false);
 assert.equal(validDiscovery({forest:'?'.repeat(WORLD_W*WORLD_H)}),false);
});
test('save and restore are byte-stable for seed, world snapshot and discovered tiles',()=>{
 configureWorld(347658);
 const state={version:1,zone:'forest',x:4,y:16,team:[createCreature('thorne',5)],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:0,worldSeed:347658,worldSnapshot:captureWorldSnapshot(),discovered:reveal({},'forest',4,16,5)};
 assert.equal(validateSave(state),true);
 const mem=new Map(),store={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
 writeSave(store,state);
 const loaded=readSave(store);
 assert.deepEqual(loaded?.state,state);
 assert.equal(loaded?.source,'primary');
});
