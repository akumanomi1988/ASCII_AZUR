import test from 'node:test';
import assert from 'node:assert/strict';
import {RIGS,rigFor,sampleCreaturePerformance,performanceChecksum} from '../dist/actors/creature-performance.js';
import {SPECIES} from '../dist/domain.js';
test('all authored species have a distinct rig binding',()=>{
 assert.deepEqual(Object.keys(RIGS).sort(),Object.keys(SPECIES).sort());
 for(const id of Object.keys(SPECIES)){const f=sampleCreaturePerformance(id,1.25);assert.ok(Number.isFinite(f.bob));assert.ok(Number.isFinite(f.roll));assert.ok(rigFor(id).pace>0);}
});
test('performances are deterministic and vary across families',()=>{
 assert.equal(performanceChecksum('cindrel',12),performanceChecksum('cindrel',12));
 assert.notEqual(performanceChecksum('cindrel',12),performanceChecksum('gravemoth',12));
 assert.equal(sampleCreaturePerformance('gravemoth',2).family,'moth');
 assert.equal(sampleCreaturePerformance('hollowhart',2).family,'stag');
});
test('hurt closes eyes and attack energizes eyes',()=>{
 assert.equal(sampleCreaturePerformance('cindrel',2,'hurt').blink,1);
 assert.ok(sampleCreaturePerformance('cindrel',2,'attack').eyeGlow>1);
 assert.equal(sampleCreaturePerformance('cindrel',2,'evolve').expression,'transcendent');
});
test('reduced motion freezes secondary action and backgrounds',()=>{
 const a=sampleCreaturePerformance('gravemoth',2,'idle',true);
 const b=sampleCreaturePerformance('gravemoth',12,'idle',true);
 assert.equal(a.wing,0);assert.equal(b.bob,0);assert.equal(a.tail,0);assert.equal(b.particles,0);
});
test('unknown species and invalid time are rejected',()=>{
 assert.throws(()=>rigFor('no-such-species'));assert.throws(()=>sampleCreaturePerformance('cindrel',Number.NaN));
});
