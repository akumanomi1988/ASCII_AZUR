import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,captureWorldSnapshot,validateWorldSnapshot,terrain,getWorldSeed,getReachableTiles,canOccupy,seedFromText,ZONE_IDS,ZONES,WORLD_W,WORLD_H} from '../dist/world.js';
import {createCreature,validateSave} from '../dist/domain.js';
const capture=(zone)=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join('|');
function allRelevantReachable(seed){
 configureWorld(seed);
 for (const id of ZONE_IDS){
  const reach=getReachableTiles(id);
  assert.ok(reach.size>120,`${id} ${seed}: too few walkable cells`);
  for (const l of ZONES[id].landmarks){
   assert.ok(reach.has(l.y*WORLD_W+l.x),`${id} ${seed}: ${l.label} unreachable`);
   assert.equal(terrain(id,l.x,l.y),'path',`${id} ${seed}: point of interest not placed on a path`);
  }
  for(const [x,y] of [[4,16],[40,16]])assert.ok(canOccupy(id,x,y,.19),`${id} ${seed}: landing ${x},${y} blocked`);
 }
}
test('same world seed always reconstructs identical maps and landmark placements',()=>{
 configureWorld(123456789);const expected=ZONE_IDS.map(id=>capture(id));const landmarks=ZONE_IDS.map(id=>ZONES[id].landmarks.map(p=>[p.x,p.y]));
 configureWorld(123456789);
 assert.deepEqual(ZONE_IDS.map(id=>capture(id)),expected);
 assert.deepEqual(ZONE_IDS.map(id=>ZONES[id].landmarks.map(p=>[p.x,p.y])),landmarks);
 assert.equal(getWorldSeed(),123456789);
});
test('different seeds result in meaningfully different zones',()=>{
 configureWorld(11);const first=capture('forest');configureWorld(12);const next=capture('forest');
 const differences=first.split('|').filter((x,i)=>x!==next.split('|')[i]).length;
 assert.ok(differences>200,`only ${differences} terrain tiles changed`);
});
test('200 world seeds all have reachable story sites and safe spawn points',()=>{
 for(let i=1;i<=200;i++)allRelevantReachable((i*274763641)>>>0);
});
test('snapshot captures layout and resists future in-memory map changes',()=>{
 configureWorld(93242);const snapshot=captureWorldSnapshot();assert.ok(snapshot);assert.ok(validateWorldSnapshot(snapshot));const expected=capture('village');
 configureWorld(823);assert.notEqual(capture('village'),expected);
 configureWorld(93242,snapshot);assert.equal(capture('village'),expected);
 assert.equal(validateWorldSnapshot({...snapshot,tiles:{...snapshot.tiles,village:'!'.repeat(42)}}),false);
 assert.equal(validateWorldSnapshot({...snapshot,poi:{...snapshot.poi,forest:[]}}),false);
});
test('seed and frozen world persist using old version=1 save format',()=>{
 configureWorld(558);const save={version:1,zone:'forest',x:4,y:16,team:[createCreature('cindrel',5)],storage:[],inventory:{seals:3,tonics:2},defeatedBoss:false,flags:[],playSeconds:20,worldSeed:558,worldSnapshot:captureWorldSnapshot()};
 assert.equal(validateSave(save),true);assert.equal(validateSave({...save,worldSeed:-1}),false);
 assert.equal(validateSave({...save,worldSnapshot:{gen:1,tiles:{village:'evil'},poi:{}}}),false);
});
test('old v0.8 save restores the legacy world and unchanged landmarks',()=>{
 configureWorld(78);configureWorld(0);
 assert.equal(captureWorldSnapshot(),null);
 assert.equal(getWorldSeed(),0);
 assert.equal(terrain('forest',4,16),'ground');
 assert.equal(ZONES.forest.landmarks.find(p=>p.npcId==='pilgrim')?.x,26);
});
test('human seed text is deterministic and independent from platform RNG',()=>{
 assert.equal(seedFromText('AZUR-LUNA'),seedFromText('AZUR-LUNA'));
 assert.notEqual(seedFromText('AZUR-LUNA'),seedFromText('AZUR-SOL'));
});
