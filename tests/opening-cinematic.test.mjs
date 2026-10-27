import test from 'node:test';
import assert from 'node:assert/strict';
import {OPENING_BEATS,OPENING_DURATION_MS,OPENING_SCENE_MS,openingCueAt} from '../dist/ui/opening-cinematic.js';

test('opening is exactly two minutes with ten authored twelve-second scenes',()=>{
 assert.equal(OPENING_BEATS.length,10);
 assert.equal(OPENING_SCENE_MS,12_000);
 assert.equal(OPENING_DURATION_MS,120_000);
 assert.equal(new Set(OPENING_BEATS.map(b=>b.id)).size,OPENING_BEATS.length);
 for(const beat of OPENING_BEATS){
  assert.ok(beat.chapter.length>5&&beat.title.length>6);
  assert.ok(beat.narration.length>80,'Each scene needs a useful world introduction');
  assert.ok(/^#[a-f\d]{6}$/i.test(beat.color));
 }
});
test('scene boundaries, skipping and ending have deterministic timestamps',()=>{
 assert.deepEqual(openingCueAt(0),{index:0,progress:0,finished:false});
 assert.deepEqual(openingCueAt(-12),{index:0,progress:0,finished:false});
 assert.deepEqual(openingCueAt(Number.NaN),{index:0,progress:0,finished:false});
 for(let i=0;i<OPENING_BEATS.length;i++){
  assert.equal(openingCueAt(i*OPENING_SCENE_MS).index,i);
  assert.equal(openingCueAt((i+1)*OPENING_SCENE_MS-1).index,i);
  assert.equal(openingCueAt(i*OPENING_SCENE_MS).finished,false);
 }
 assert.deepEqual(openingCueAt(OPENING_DURATION_MS),{index:9,progress:1,finished:true});
 assert.deepEqual(openingCueAt(OPENING_DURATION_MS+100),{index:9,progress:1,finished:true});
});
test('the world introduction is a spoiler-safe prelude, not later-chapter walkthrough',()=>{
 const combined=OPENING_BEATS.map(b=>b.narration).join(' ');
 assert.match(combined,/Arken|Archivista/);
 assert.match(combined,/criaturas/);
 assert.match(combined,/Lumbres/);
 assert.match(combined,/vínculo/);
 assert.doesNotMatch(combined,/Nullscribe|Nael|Oriel|Marisma del Espejo Roto|Corona de lo No Escrito/);
});
