import test from 'node:test';
import assert from 'node:assert/strict';
import {BIOMES,createExpedition,chooseRoom,availableRooms,completeBattle,expeditionComplete,settleExpedition,validateExpedition} from '../dist/expeditions/expedition.js';
import {createCreature,validateSave} from '../dist/domain.js';
function selectRun(run,selector=(rooms)=>rooms[0]){
  const room=selector(availableRooms(run));const a=chooseRoom(run,room.id);
  return a.requiresBattle?completeBattle(a.next):a.next;
}
test('same biome and seed create the same complete route snapshot',()=>{
 for(const biome of Object.keys(BIOMES)){
  const a=createExpedition(9182,biome),b=createExpedition(9182,biome);
  assert.deepEqual(a,b);assert.equal(a.rooms.length,5);
  assert.equal(a.rooms[4].length,1);assert.equal(a.rooms[4][0].kind,'boss');
  assert.equal(validateExpedition(a),true);
 }
});
test('runs differ with changed seed; all four biomes stay valid over 500 seeds',()=>{
 const a=JSON.stringify(createExpedition(99,'ashwood'));
 const b=JSON.stringify(createExpedition(100,'ashwood'));
 assert.notEqual(a,b);
 for(let seed=1;seed<=500;seed++)for(const biome of Object.keys(BIOMES)){
  let run=createExpedition(seed,biome);
  assert.equal(validateExpedition(run),true);
  for(let floor=0;floor<5;floor++){
   const options=availableRooms(run);assert.ok(options.length>=1);
   assert.ok(options.every(r=>r.id.startsWith(`f${floor}-`)));
   run=selectRun(run,rooms=>rooms[seed%rooms.length]);assert.equal(validateExpedition(run),true);
  }
  assert.equal(expeditionComplete(run),true);
  const reward=settleExpedition(run,true);assert.ok(reward.echoes>0);
 }
});
test('selecting a combat room does not advance until victory and cannot be duplicated',()=>{
 let run=createExpedition(123,'crypt');const room=availableRooms(run).find(r=>r.kind==='skirmish');assert.ok(room);
 const selected=chooseRoom(run,room.id);assert.equal(selected.requiresBattle,true);run=selected.next;
 assert.equal(run.floor,0);assert.equal(run.pending,room.id);
 assert.throws(()=>chooseRoom(run,room.id));
 assert.equal(validateExpedition(run),true);
 run=completeBattle(run);assert.equal(run.floor,1);assert.equal(run.pending,null);
 assert.throws(()=>completeBattle(run));
 assert.throws(()=>settleExpedition(run,true));
 assert.equal(validateExpedition(run),true);
});
test('no forged rewards, stages, room substitutions, duplicated claims or invalid in-flight state',()=>{
 const run=createExpedition(355,'marsh');const bad=[
  {...run,treasure:{echoes:10000,seals:1,tonics:2}},
  {...run,floor:3},
  {...run,pending:'made-up-room'},
  {...run,rooms:run.rooms.map((r,i)=>i===1?[{...r[0],reward:{echoes:1000,seals:0,tonics:0}},...r.slice(1)]:r)},
  {...run,cleared:['f0-r0','f0-r0'],floor:2},
 ];
 for(const value of bad)assert.equal(validateExpedition(value),false);
});
test('expedition save field is optional for v0.9 legacy saves; new saves validate',()=>{
 const base={version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',5,()=>.15)],storage:[],inventory:{seals:2,tonics:1},defeatedBoss:false,flags:[],playSeconds:11};
 assert.equal(validateSave(base),true);assert.equal(validateSave({...base,expedition:createExpedition(432,'ashwood')}),true);
 assert.equal(validateSave({...base,expedition:{version:1,seed:0}}),false);
});
test('abandon returns only quarter of accumulated echoes, not consumables',()=>{
 let run=createExpedition(48,'archive');run=selectRun(run,rooms=>rooms.find(r=>r.kind==='cache')||rooms[0]);
 assert.equal(validateExpedition(run),true);
 const low=settleExpedition(run,false);
 assert.equal(low.echoes,Math.floor(run.treasure.echoes/4));
 assert.equal(low.seals,0);assert.equal(low.tonics,0);
});
