import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,ZONES,ZONE_IDS,WORLD_W,WORLD_H,terrain,canOccupy,getReachableTiles,captureWorldSnapshot,validateWorldSnapshot} from '../dist/world.js';
import {visibleEncounters} from '../dist/world/encounters.js';
import {createCreature,validateSave} from '../dist/domain.js';
const area=zone=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(zone,i%WORLD_W,(i/WORLD_W)|0)).join(',');
test('N3: fifth region is reachable for 200 fixed seeds, with three original story challenges and stable geometry',()=>{
 assert.deepEqual(ZONE_IDS,['village','forest','sanctuary','marsh','spire']);
 for(let n=1;n<=200;n++){
  const seed=Math.imul(n,2654435761)>>>0;configureWorld(seed);
  const walkable=getReachableTiles('spire');assert.ok(walkable.size>120,seed+' too few open tiles');
  for(const site of ZONES.spire.landmarks){
   assert.equal(terrain('spire',site.x,site.y),'path',site.label+' on obstacle');
   assert.ok(walkable.has(site.y*WORLD_W+site.x),'unreachable '+site.label+' seed '+seed);
  }
  for(const x of [4,40])assert.ok(canOccupy('spire',x,16,.19));
  const visible=visibleEncounters('spire',seed);
  assert.deepEqual(visible.map(c=>c.id),['spire-0','spire-1','spire-2']);
  assert.ok(visible.every(c=>walkable.has(c.y*WORLD_W+c.x)));
 }
 configureWorld(99);const a=area('spire'),landmarks=JSON.stringify(ZONES.spire.landmarks);
 configureWorld(99);assert.equal(area('spire'),a);assert.equal(JSON.stringify(ZONES.spire.landmarks),landmarks);
});
test('N3: legacy four-zone and old three-zone world snapshots retain exact original geometry on upgrade',()=>{
 configureWorld(733);
 const current=captureWorldSnapshot(),oldMarsh={gen:1,
  tiles:{village:current.tiles.village,forest:current.tiles.forest,sanctuary:current.tiles.sanctuary,marsh:current.tiles.marsh},
  poi:{village:current.poi.village,forest:current.poi.forest,sanctuary:current.poi.sanctuary,marsh:current.poi.marsh.slice(0,-1)}};
 assert.ok(validateWorldSnapshot(oldMarsh),'v0.29 snapshot must remain compatible');
 const oldMarshCopy=structuredClone(oldMarsh);
 configureWorld(91);configureWorld(733,oldMarsh);
 assert.deepEqual(oldMarsh,oldMarshCopy,'frozen v1 input may not be mutated');
 for(const zone of ['village','forest','sanctuary','marsh'])assert.equal(captureWorldSnapshot().tiles[zone],oldMarsh.tiles[zone]);
 assert.deepEqual(captureWorldSnapshot().poi.marsh.slice(0,-1),oldMarsh.poi.marsh,'old marsh POIs moved');
 assert.equal(ZONES.marsh.landmarks.at(-1).x,43,'new east portal remains fixed');
 assert.ok(captureWorldSnapshot().tiles.spire);
 const save={version:1,zone:'spire',x:4,y:16,team:[createCreature('thorne',14)],storage:[],inventory:{seals:3,tonics:4},defeatedBoss:true,
  flags:['arken-vow-restored','marsh-chapter-complete','zone-spire'],playSeconds:100,worldSeed:733,worldSnapshot:captureWorldSnapshot()};
 assert.ok(validateSave(save));
 assert.ok(validateSave({...save,zone:'marsh',worldSnapshot:oldMarsh}));
 const broken={...oldMarsh,tiles:{...oldMarsh.tiles,spire:'!'}};
 assert.equal(validateWorldSnapshot(broken),false);
});
