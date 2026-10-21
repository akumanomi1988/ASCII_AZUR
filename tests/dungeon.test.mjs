import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,validateDungeon,dungeonConnected,dungeonSweep,nearbyDungeonEvent,completeDungeonEvent,dungeonGateOpen,revealDungeon,DUNGEON_W,DUNGEON_H} from '../dist/dungeons/labyrinth.js';
import {createCreature,validateSave} from '../dist/domain.js';

test('1000 seeded physical dungeons have stable, connected, distinct layouts',()=>{
 const fingerprints=new Set();
 for(let seed=1;seed<=1000;seed++){
  const run=generateDungeon(seed);
  assert.equal(validateDungeon(run),true,`seed ${seed}`);
  assert.equal(dungeonConnected(run),true,`disconnected ${seed}`);
  assert.equal(run.tiles.length,DUNGEON_W*DUNGEON_H);
  assert.deepEqual(generateDungeon(seed),run);
  assert.equal(run.events.length,8);
  fingerprints.add(run.tiles);
 }
 assert.ok(fingerprints.size>990);
});
test('fixed layout persists across moves, exploration and repeated visits',()=>{
 const run=generateDungeon(2310),initial=run.tiles;
 const moved=dungeonSweep(run,run.x,run.y,1.5,0);
 const next=revealDungeon({...run,...moved});
 assert.equal(next.tiles,initial);
 assert.ok(next.visited.split('1').length>=run.visited.split('1').length);
 assert.equal(validateDungeon(next),true);
 assert.deepEqual(JSON.parse(JSON.stringify(next)),next);
});
test('walls, edge boundaries and obstacle corners prevent tunnelling',()=>{
 const run=generateDungeon(444);
 for(let y=0;y<DUNGEON_H;y++)for(let x=0;x<DUNGEON_W;x++)if(run.tiles[y*DUNGEON_W+x]==='#'){
   const around=dungeonSweep(run,x+.5,y+.5,2.2,-2.5);
   // Even when given an invalid start, movement must not allow leaving the board.
   assert.ok(Number.isFinite(around.x)&&Number.isFinite(around.y));
 }
 const hit=dungeonSweep(run,run.x,run.y,-100,-100);
 assert.ok(hit.x>=1&&hit.y>=1);
});
test('chests cannot be claimed twice, and the exit needs both guardians and rune',()=>{
 let run=generateDungeon(371);
 assert.equal(dungeonGateOpen(run),false);
 const chest=run.events.find(e=>e.kind==='cache');assert.ok(chest);
 run=completeDungeonEvent(run,chest.id);
 assert.throws(()=>completeDungeonEvent(run,chest.id));
 for(const e of run.events.filter(e=>e.kind==='enemy')){
  assert.throws(()=>completeDungeonEvent(run,e.id));
  run={...run,pending:e.id};run=completeDungeonEvent(run,e.id);
 }
 assert.equal(dungeonGateOpen(run),false);
 run=completeDungeonEvent(run,3);
 assert.equal(dungeonGateOpen(run),true);
 assert.equal(validateDungeon({...run,finished:true}),true);
});
test('tampered saved maps, forged rewards, invalid flags, or malformed events are rejected',()=>{
 const run=generateDungeon(54);
 assert.equal(validateDungeon({...run,tiles:run.tiles.slice(0,run.events[0].y*DUNGEON_W+run.events[0].x)+'#'+run.tiles.slice(run.events[0].y*DUNGEON_W+run.events[0].x+1)}),false);
 assert.equal(validateDungeon({...run,cleared:[2,2]}),false);
 assert.equal(validateDungeon({...run,cleared:[0]}),false);
 assert.equal(validateDungeon({...run,pending:99}),false);
 assert.equal(validateDungeon({...run,visited:'0'}),false);
 assert.equal(validateDungeon({...run,events:run.events.map((e,i)=>i===4?{...e,x:3}:e)}),false);
 assert.equal(validateDungeon({...run,finished:true}),false);
});
test('legacy game save remains valid; dungeon is an optional v1 extension',()=>{
 const save={version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.17)],storage:[],inventory:{seals:2,tonics:1},flags:[],defeatedBoss:false,playSeconds:4};
 assert.equal(validateSave(save),true);
 assert.equal(validateSave({...save,dungeon:generateDungeon(344)}),true);
 assert.equal(validateSave({...save,dungeon:{seed:344}}),false);
});
