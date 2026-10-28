import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OPENING_BEATS,OPENING_DURATION_MS,OPENING_SCENE_MS,openingCueAt,OpeningPlaybackClock} from '../dist/ui/opening-cinematic.js';

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


test('interactive story clock pauses without consuming the two-minute runtime and resumes at the exact frame',()=>{
 const clock=new OpeningPlaybackClock();
 clock.advance(750);assert.equal(clock.elapsed,750);
 assert.equal(clock.togglePause(),true);
 for(let i=0;i<50;i++)clock.advance(1000);
 assert.equal(clock.elapsed,750,'paused prologue must not skip unattended narration');
 assert.equal(clock.togglePause(),false);
 clock.advance(400);assert.equal(clock.elapsed,1150);
 clock.advance(Infinity);clock.advance(NaN);assert.equal(clock.elapsed,1150);
 clock.advance(60_000);assert.equal(clock.elapsed,2150,'background throttling may advance no more than 1000ms per frame');
 clock.reset();assert.equal(clock.elapsed,0);assert.equal(clock.paused,false);
});
test('story navigation allows replaying an unfinished scene or returning to the previous beat',()=>{
 const clock=new OpeningPlaybackClock();
 clock.next();assert.equal(clock.elapsed,OPENING_SCENE_MS);
 clock.advance(2300);clock.previous();assert.equal(clock.elapsed,OPENING_SCENE_MS,'rewind current scene when it is underway');
 clock.previous();assert.equal(clock.elapsed,0,'from a beat boundary navigate to prior beat');
 clock.previous();assert.equal(clock.elapsed,0,'first beat has no negative index');
 for(let i=0;i<9;i++)clock.next();
 assert.equal(clock.elapsed,108_000);
 clock.next();assert.equal(clock.elapsed,OPENING_DURATION_MS);
 clock.previous();assert.equal(clock.elapsed,OPENING_DURATION_MS-OPENING_SCENE_MS);
 clock.reset();assert.equal(openingCueAt(clock.elapsed).index,0);
});
test('cinematic pause, previous, skip and title replay are first-class accessible controls',()=>{
 const html=readFileSync('index.html','utf8'),css=readFileSync('style.css','utf8'),source=readFileSync('src/ui/opening-cinematic.ts','utf8');
 assert.match(html,/id="cinematicPause"[^>]*aria-pressed="false"/);
 assert.match(html,/id="cinematicPrevious"/);
 assert.match(source,/e\.key==='ArrowLeft'/);
 assert.match(source,/e\.key\.toLowerCase\(\)==='p'/);
 assert.match(css,/data-paused="true"/);
 assert.match(css,/cinematic-controls #cinematicNext\{grid-column:span 2\}/);
});
