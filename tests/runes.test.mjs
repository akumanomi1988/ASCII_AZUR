import test from 'node:test';import assert from 'node:assert/strict';
import {RUNE_PUZZLES,submitRune,claimRune} from '../dist/puzzles/runes.js';
import {ZONES} from '../dist/world.js';
test('three authored runic seals are reachable in the three regions',()=>{
 for(const zone of ['village','forest','sanctuary']){
  assert.ok(RUNE_PUZZLES[zone]);assert.ok(ZONES[zone].landmarks.some(x=>x.kind==='rune'));
 }
});
test('wrong glyph resets progress, correct sequence completes',()=>{
 for(const p of Object.values(RUNE_PUZZLES)){
  assert.deepEqual(submitRune(p,0,'wrong'),{correct:false,completed:false,index:0});
  let next=0;
  for(const glyph of p.sequence){const step=submitRune(p,next,glyph);assert.equal(step.correct,true);next=step.index;}
  assert.equal(next,3);
 }
});
test('puzzle rewards are granted once and capped',()=>{
 const first=claimRune([],35,'forest');assert.equal(first.earned,30);assert.equal(first.echoes,65);
 const again=claimRune([first.flag],65,'forest');assert.equal(again.earned,0);assert.equal(again.echoes,65);
 assert.equal(claimRune([],999999,'sanctuary').echoes,999999);
});
