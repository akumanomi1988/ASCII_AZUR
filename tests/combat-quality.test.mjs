import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatCue, sampleCombatCue,guardDamage} from '../dist/actors/combat-fx.js';

test('combat cue is deterministic, finishes, and keeps game state separate',()=>{
 const cue=createCombatCue('attack','ally','Ceniza',10,13,true);
 const a=sampleCombatCue(cue,10.40),b=sampleCombatCue(cue,10.40);
 assert.deepEqual(a,b);assert.equal(a.damage,13);assert.ok(a.attacker.x>0);
 assert.equal(sampleCombatCue(cue,11.5),null);
 assert.equal(cue.damage,13);
});
test('enemy cue lunges in opposite direction and impact recoils',()=>{
 const cue=createCombatCue('attack','enemy','Bruma',1,12);
 const fx=sampleCombatCue(cue,1.4);
 assert.equal(fx.actor,'enemy');assert.ok(fx.attacker.x<0);
 assert.ok(fx.impact>0);assert.ok(fx.target.x<0);
});
test('reduced motion eliminates camera shake and actor translation',()=>{
 const fx=sampleCombatCue(createCombatCue('attack','ally','Éter',1,10),1.45,true);
 assert.equal(fx.shakeX,0);assert.equal(fx.shakeY,0);assert.equal(fx.attacker.x,0);assert.equal(fx.target.x,0);
});
test('guard absorbs 55 percent, but cannot reduce positive damage below 1',()=>{
 assert.equal(guardDamage(20,false),20);assert.equal(guardDamage(20,true),9);
 assert.equal(guardDamage(1,true),1);assert.throws(()=>guardDamage(NaN,true));
});
test('non-attack cues have finite presentation and do not apply damage',()=>{
 for(const kind of ['heal','guard','capture','switch']){
  const cue=createCombatCue(kind,'ally','Raíz',0);const fx=sampleCombatCue(cue,.25);
  assert.equal(fx.damage,0);assert.ok(fx.trail>=0);assert.equal(sampleCombatCue(cue,3),null);
 }
});
test('offline cache includes battle animations and all imported game modules',async()=>{
 const fs=await import('node:fs');const text=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const file of ['dist/actors/combat-fx.js','dist/actors/animation.js','dist/core/frame-metrics.js','dist/core/save-store.js','dist/actors/creature-performance.js','dist/render/glyph-cache.js','dist/party.js','dist/render.js'])assert.ok(text.includes(file));
 assert.match(text,/const CACHE=\x27ascii-azur-v\d+-q\d+\x27;/);
});
