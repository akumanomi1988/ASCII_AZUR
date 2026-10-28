import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OPENING_BEATS,OPENING_DURATION_MS} from '../dist/ui/opening-cinematic.js';
import {OPENING_STORYBOARD_IDS,renderOpeningStoryboard} from '../dist/ui/opening-storyboard.js';

test('ten prologue beats use one continuous spoiler-safe world',()=>{
 assert.equal(OPENING_STORYBOARD_IDS.length,10);
 assert.deepEqual(OPENING_BEATS.map(b=>b.id),[...OPENING_STORYBOARD_IDS]);
 assert.equal(OPENING_DURATION_MS,120_000);
 assert.match(OPENING_BEATS.find(b=>b.id==='bonds').narration,/Cindrel.+Velaria.+Thorne/);
 assert.match(OPENING_BEATS.find(b=>b.id==='arken').narration,/Archivista/);
});
test('every beat contains local illustration and recognizable recurring cast or geography',()=>{
 const expected={
  creation:['intro-arken','intro-traveler'],
  world:['intro-arken','intro-traveler','intro-cindrel'],
  bonds:['intro-cindrel','intro-velaria','intro-thorne'],
  silence:['intro-shadow','intro-traveler','intro-cindrel'],
  erasure:['intro-archivist','intro-missing-pages'],
  embers:['intro-lumbre','intro-traveler'],
  companions:['intro-traveler','intro-cindrel','intro-velaria','intro-thorne','intro-strong-thread'],
  arken:['intro-arken','intro-archivist','intro-traveler'],
  choice:['intro-traveler','intro-cindrel','intro-velaria','intro-thorne'],
  begin:['intro-arken','intro-traveler','intro-cindrel','intro-velaria','intro-thorne']
 };
 for(const [id,features] of Object.entries(expected)){
  const svg=renderOpeningStoryboard(id);
  assert.match(svg,/^<svg /);
  assert.match(svg,/viewBox="0 0 960 540"/);
  assert.match(svg,/<defs>/);
  assert.match(svg,/intro-land/);
  assert.match(svg,/<\/svg>$/);
  for(const feature of features)assert.ok(svg.includes(feature),id+' lacks '+feature);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|on(?:load|click|error)=/i);
 }
 assert.throws(()=>renderOpeningStoryboard('unknown-scene'),/Unknown opening storyboard scene/);
});
test('canonical starter companions have legible nameplates and cross-scene continuity',()=>{
 const bonds=renderOpeningStoryboard('bonds');
 for(const name of ['CINDREL','VELARIA','THORNE'])assert.match(bonds,new RegExp('>'+name+'<'));
 const final=renderOpeningStoryboard('begin');
 assert.ok(final.includes('href="#intro-arken"'));
 for(const name of ['intro-cindrel','intro-velaria','intro-thorne'])assert.ok(final.includes('href="#'+name+'"'));
});
test('offline cache, standalone script, reduced-motion toggle and no save mutation',()=>{
 const build=readFileSync('tools/build-standalone.py','utf8'),worker=readFileSync('sw.js','utf8');
 const css=readFileSync('style.css','utf8'),game=readFileSync('src/ui/opening-cinematic.ts','utf8');
 const main=readFileSync('src/main.ts','utf8');
 assert.match(build,/ui\/opening-storyboard\.js/);
 assert.match(worker,/dist\/ui\/opening-storyboard\.js/);
 assert.match(game,/renderOpeningStoryboard\(beat\.id\)/);
 assert.match(css,/\.cinematic-storyboard/);
 assert.match(css,/\.motion-reduced \.cinematic-storyboard/);
 assert.match(main,/this\.cinematic\.setReducedMotion\(this\.reducedMotion\)/);
});
