import test from 'node:test';import assert from 'node:assert/strict';
import {createCreature,validateSave,validateBattleCheckpoint} from '../dist/domain.js';
import {readSave,writeSave} from '../dist/core/save-store.js';
import {createExpedition} from '../dist/expeditions/expedition.js';
const saved=()=>({version:1,zone:'village',x:4,y:16,team:[createCreature('velaria',8)],storage:[],inventory:{seals:5,tonics:4},defeatedBoss:false,flags:[],playSeconds:21,rpg:{echoes:50,completed:[],visitedNpcs:[]},expedition:createExpedition(991,'crypt')});
function battle(state){return{enemy:createCreature('gravemoth',7,()=>.331),type:'expedition',ally:0,guarding:true,bossPhase:1,chargeStage:0,effects:{[state.team[0].uid]:[{kind:'scorch',remaining:2}]}};}
test('checkpointed encounter survives save roundtrip with HP, effects and turn state',()=>{
 const s=saved();s.expedition.pending='f0-r1'; // choose correct generated room instead in next statement
 const id=s.expedition.rooms[0][0].id;s.expedition.pending=id;
 s.activeBattle=battle(s);s.activeBattle.enemy.hp=7;
 assert.ok(validateSave(s));
 const entries=new Map(),store={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};
 writeSave(store,s);const read=readSave(store);assert.ok(read);
 assert.equal(read.state.activeBattle.enemy.hp,7);
 assert.equal(read.state.activeBattle.effects[s.team[0].uid][0].remaining,2);
 assert.equal(read.state.expedition.pending,id);
});
test('checkpoint validation rejects invalid status, enemy HP, unknown move and ally index',()=>{
 const s=saved(),b=battle(s);
 assert.equal(validateBattleCheckpoint(b,s.team),true);
 for(const pending of ['enemy','capture','victory','defeat'])assert.equal(validateBattleCheckpoint({...b,pending},s.team),true);
 assert.equal(validateBattleCheckpoint({...b,pending:'free-extra-turn'},s.team),false);
 const bad=[{...b,ally:2},{...b,enemy:{...b.enemy,hp:9000}},{...b,enemy:{...b.enemy,moves:['delete_all']}},{...b,effects:{lol:[{kind:'sleep_forever',remaining:3}]}},{...b,effects:{lol:[{kind:'scorch',remaining:999}]}}];
 for(const v of bad)assert.equal(validateBattleCheckpoint(v,s.team),false);
});
test('v0.9 saves without active battle are still valid',()=>{
 const s=saved();delete s.expedition;assert.equal(validateSave(s),true);
});
