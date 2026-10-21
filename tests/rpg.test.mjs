import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOP,QUESTS,newEconomy,normalizeEconomy,buy,claimQuests} from '../dist/rpg.js';
import {ZONES,canOccupy,sweepMove} from '../dist/world.js';
import {createCreature,validateSave} from '../dist/domain.js';
test('shop: insufficient balance never removes currency or invents goods',()=>{
 const e={echoes:0,completed:[],visitedNpcs:[]},inv={seals:2,tonics:1};
 assert.equal(buy(e,inv,'seals'),false);assert.deepEqual(inv,{seals:2,tonics:1});assert.equal(e.echoes,0);
});
test('shop: purchases cost exactly the advertised prices and add one item',()=>{
 const e=newEconomy(),inv={seals:5,tonics:2};
 assert.equal(buy(e,inv,'seals'),true);assert.equal(e.echoes,35-SHOP.seals.cost);assert.equal(inv.seals,6);
 assert.equal(buy(e,inv,'tonics'),false);assert.equal(inv.tonics,2);
});
test('quest rewards are idempotent and only granted when requirements are met',()=>{
 const e=newEconomy();assert.equal(claimQuests(e,[],false).length,0);
 const got=claimQuests(e,['archivist','zone-forest'],false);assert.equal(got.length,2);
 assert.equal(e.echoes,35+got.reduce((n,q)=>n+q.reward,0));
 assert.deepEqual(claimQuests(e,['archivist','zone-forest'],false),[]);
 assert.equal(e.completed.length,2);
 assert.equal(QUESTS.length,6);
});
test('legacy v0.3 save remains valid and optional economy migrates safely',()=>{
 const save={version:1,zone:'village',x:4,y:16,team:[createCreature('velaria',5)],storage:[],inventory:{seals:5,tonics:3},defeatedBoss:false,flags:[],playSeconds:0};
 assert.equal(validateSave(save),true);assert.deepEqual(normalizeEconomy(undefined),newEconomy());
 assert.equal(validateSave({...save,rpg:{echoes:-1,completed:[],visitedNpcs:[]}}),false);
 assert.equal(validateSave({...save,rpg:newEconomy()}),true);
});
test('NPCs and chests are physically solid, altars and portals traversable',()=>{
 const npc=ZONES.village.landmarks.find(x=>x.npcId==='merchant');assert.ok(npc);
 assert.equal(canOccupy('village',npc.x,npc.y),false);
 assert.equal(canOccupy('village',15,12),true);
 assert.equal(canOccupy('forest',43,16),true);
});
test('sweep movement stops before obstacles even at 30+ tile/sec',()=>{
 const position=sweepMove('village',4,16,8,0);
 assert.ok(position.x<8,'should not pass through archivist');
 assert.ok(position.x>4);
 const initial=sweepMove('village',4,16,0,0);assert.deepEqual(initial,{x:4,y:16});
});
