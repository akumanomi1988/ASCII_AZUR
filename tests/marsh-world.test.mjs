import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,ZONES,ZONE_IDS,WORLD_W,WORLD_H,terrain,canOccupy,getReachableTiles,captureWorldSnapshot,validateWorldSnapshot} from '../dist/world.js';
import {createCreature,validateSave,validateBattleCheckpoint} from '../dist/domain.js';
import {visibleEncounters} from '../dist/world/encounters.js';
const tilemap=z=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(z,i%WORLD_W,Math.floor(i/WORLD_W))).join(',');
test('new Marsh is a fourth procedural biome with original quest landmarks, music, portal and reachable loop',()=>{
 assert.deepEqual(ZONE_IDS,['village','forest','sanctuary','marsh']);
 for(let n=1;n<=200;n++){
  const seed=Math.imul(n,2654435761)>>>0;configureWorld(seed);
  const reach=getReachableTiles('marsh');
  assert.ok(reach.size>120,'marsh too small '+seed);
  for(const l of ZONES.marsh.landmarks){
   assert.equal(terrain('marsh',l.x,l.y),'path','POI off road '+seed);
   assert.ok(reach.has(l.y*WORLD_W+l.x),'unreachable '+l.label+' '+seed);
  }
  for(const x of [4,40])assert.ok(canOccupy('marsh',x,16,.19),'blocked entry '+seed);
  const roamers=visibleEncounters('marsh',seed);
  assert.equal(roamers.length,3,'three seeded witnesses required '+seed);
  assert.deepEqual(roamers.map(r=>r.id),['marsh-0','marsh-1','marsh-2']);
  assert.ok(roamers.every(r=>reach.has(r.y*WORLD_W+r.x)));
 }
 configureWorld(718);const before=tilemap('marsh'),poi=JSON.stringify(ZONES.marsh.landmarks);
 configureWorld(718);assert.equal(tilemap('marsh'),before);assert.equal(JSON.stringify(ZONES.marsh.landmarks),poi);
});
test('all v1 frozen legacy region tiles and old Sanctuary points survive Marsh upgrade unchanged',()=>{
 configureWorld(77);
 const full=captureWorldSnapshot();
 const previous={gen:1,
   tiles:{village:full.tiles.village,forest:full.tiles.forest,sanctuary:full.tiles.sanctuary},
   poi:{village:full.poi.village,forest:full.poi.forest,sanctuary:[...full.poi.sanctuary.slice(0,5),full.poi.sanctuary.at(-1)]}};
 assert.ok(validateWorldSnapshot(previous),'pre-Marsh frozen saves remain valid');
 const copy=structuredClone(previous);
 const expected=Object.fromEntries(['village','forest','sanctuary'].map(id=>[id,full.tiles[id]]));
 configureWorld(12);
 configureWorld(77,previous);
 assert.deepEqual(previous,copy,'load must not rewrite frozen payload');
 for(const zone of ['village','forest','sanctuary'])assert.equal(captureWorldSnapshot().tiles[zone],expected[zone],zone+' tiles changed');
 assert.deepEqual(ZONES.sanctuary.landmarks.slice(0,5).map(l=>[l.x,l.y]),previous.poi.sanctuary.slice(0,5));
 assert.deepEqual([ZONES.sanctuary.landmarks[6].x,ZONES.sanctuary.landmarks[6].y],previous.poi.sanctuary[5]);
 assert.equal(ZONES.sanctuary.landmarks[5].kind,'portal');
 assert.equal(ZONES.sanctuary.landmarks[5].x,43);
 assert.ok(captureWorldSnapshot().tiles.marsh,'new Marsh generated once and saved');
 const save={version:1,zone:'marsh',x:4,y:16,team:[createCreature('cindrel',12)],storage:[],inventory:{seals:2,tonics:3},defeatedBoss:true,flags:['arken-vow-restored','zone-marsh'],playSeconds:100,worldSeed:77,worldSnapshot:captureWorldSnapshot()};
 assert.ok(validateSave(save));
 assert.ok(validateSave({...save,zone:'sanctuary',worldSnapshot:previous}));
 assert.equal(validateSave({...save,worldSnapshot:{...previous,tiles:{...previous.tiles,marsh:'bad'}}}),false);
});
