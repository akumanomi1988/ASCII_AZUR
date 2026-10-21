import test from 'node:test';import assert from 'node:assert/strict';
import {createCreature} from '../dist/domain.js';
import {transferStoredCreature,reserveCreature,PARTY_LIMIT} from '../dist/party.js';
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
