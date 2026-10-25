import test from 'node:test';
import assert from 'node:assert/strict';
import {battleReadout,BATTLE_CONTROL_MIN_PX} from '../dist/combat/battle-readout.js';
const basic={boss:false,bossPhase:1,chargeStage:0,guarding:false,hp:40,maxHp:40,enemyHp:40,enemyMaxHp:40,busy:false,statuses:[],enemyStatuses:[]};
const show=changes=>battleReadout({...basic,...changes});
test('danger only recommends guard when the next Eclipse is actually ready',()=>{
 assert.equal(show({boss:true,chargeStage:1}).guardRecommended,false);
 const warning=show({boss:true,chargeStage:2});
 assert.equal(warning.severity,'critical');assert.equal(warning.guardRecommended,true);
 assert.match(warning.aria,/GUARDIA/);
 assert.equal(show({boss:true,chargeStage:2,busy:true}).guardRecommended,false);
 assert.equal(show({boss:true,chargeStage:2,guarding:true}).guardRecommended,false);
 assert.match(show({boss:true,chargeStage:2,guarding:true}).detail,/PROTECCIÓN ACTIVA/);
});
test('second phase, low health, and statuses remain understandable without colour or motion',()=>{
 assert.match(show({boss:true,bossPhase:2}).title,/FASE II/);
 assert.match(show({hp:1,maxHp:40}).detail,/Tónico/);
 const r=show({boss:true,bossPhase:2,hp:3,statuses:['ARDOR'],enemyStatuses:['FRACTURA']});
 assert.equal(r.severity,'critical');assert.match(r.aria,/ARDOR/);assert.match(r.aria,/FRACTURA/);
 assert.equal(BATTLE_CONTROL_MIN_PX,44);
});
test('terminal animations and unusual health snapshots do not suggest another attack',()=>{
 for(const pending of ['victory','defeat']){
  const r=show({boss:true,chargeStage:2,pending});
  assert.equal(r.severity,'resolution');assert.equal(r.guardRecommended,false);
 }
 const r=show({hp:NaN,maxHp:0});
 assert.ok(!/NaN|Infinity/.test(r.aria));
});
test('boss readout is deterministic and never mutates input arrays',()=>{
 const state={...basic,boss:true,chargeStage:2,statuses:['ARDOR'],enemyStatuses:['BRUMA']};
 const before=JSON.stringify(state);
 assert.deepEqual(battleReadout(state),battleReadout(state));assert.equal(JSON.stringify(state),before);
});
