import test from 'node:test';import assert from 'node:assert/strict';
import {createCreature} from '../dist/domain.js';
import {transferStoredCreature,reserveCreature,grantPartyExperience,PARTY_LIMIT} from '../dist/party.js';
const unit=(id,i)=>{const c=createCreature(id,3,()=>i/20);return {...c,uid:id+i};};
test('recruit from reserve without mutating original snapshot',()=>{
 const a=unit('cindrel',1),b=unit('velaria',2),base={team:[a],storage:[b]};const next=transferStoredCreature(base,b.uid);
 assert.deepEqual(next.team,[a,b]);assert.deepEqual(next.storage,[]);assert.equal(base.storage.length,1);
});
test('swap with a full party and preserve party cap',()=>{
 const c=['cindrel','velaria','thorne','runeowl','rillfin','ashboar'].map((x,i)=>unit(x,i+1));const reserve=unit('briarling',9);
 const next=transferStoredCreature({team:c,storage:[reserve]},reserve.uid,c[2].uid);
 assert.equal(next.team.length,PARTY_LIMIT);assert.equal(next.team[2].uid,reserve.uid);assert.equal(next.storage[0].uid,c[2].uid);
});
test('reject full withdraw, missing replacement, and duplicate identities',()=>{
 const a=unit('cindrel',1),b=unit('velaria',2);
 assert.throws(()=>transferStoredCreature({team:Array(6).fill(a),storage:[b]},b.uid));
 assert.throws(()=>transferStoredCreature({team:[a],storage:[b]},b.uid,'missing'));
 assert.throws(()=>transferStoredCreature({team:[a],storage:[a]},a.uid));
});
test('last teammate cannot be deposited, other teammates can',()=>{
 const a=unit('cindrel',1),b=unit('velaria',2);
 assert.throws(()=>reserveCreature({team:[a],storage:[]},a.uid));
 const result=reserveCreature({team:[a,b],storage:[]},b.uid);assert.equal(result.team.length,1);assert.deepEqual(result.storage,[b]);
});

test('combatant retains full XP, conscious bench earns half, defeated and stored creatures gain none',()=>{
 const active=unit('cindrel',1),bench=unit('velaria',2),defeated=unit('thorne',3),stored=unit('runeowl',4);
 active.level=5;bench.level=5;defeated.hp=0;stored.level=5;
 const rewards=grantPartyExperience([active,bench,defeated],0,21);
 assert.deepEqual(rewards.map(r=>[r.uid,r.amount,r.active]),[[active.uid,21,true],[bench.uid,10,false]]);
 assert.equal(active.exp,21);assert.equal(bench.exp,10);assert.equal(defeated.exp,0);assert.equal(stored.exp,0);
});
test('bench can evolve and its evolution can be presented without stealing active reward',()=>{
 const lead=unit('cindrel',1),bench=unit('briarling',2);
 lead.level=5;bench.level=7;bench.exp=80;
 const awards=grantPartyExperience([lead,bench],0,12);
 assert.equal(lead.exp,12);
 assert.equal(bench.level,8);assert.equal(bench.speciesId,'thorne');
 assert.equal(awards[1].from,'briarling');assert.equal(awards[1].to,'thorne');assert.equal(awards[1].evolved,true);
});
test('solo combat yields exactly legacy XP and invalid awards fail closed',()=>{
 const solo=unit('cindrel',1);solo.level=5;
 assert.deepEqual(grantPartyExperience([solo],0,20).map(x=>x.amount),[20]);
 assert.equal(solo.exp,20);
 for(const [index,amount] of [[-1,20],[1,20],[0,-1],[0,1.5],[0,Number.POSITIVE_INFINITY]])assert.throws(()=>grantPartyExperience([solo],index,amount));
});
