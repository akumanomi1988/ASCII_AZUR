import test from 'node:test';
import assert from 'node:assert/strict';
import {ARKEN_FINALE_FLAG,ARKEN_STORY,arkenStoryIndex,arkenStoryBeat,canConcludeArken,concludeArken} from '../dist/story-campaign.js';
const state=(flags=[],defeatedBoss=false,dungeonFinished=false)=>({flags,defeatedBoss,dungeonFinished});
test('seven authored story beats have actionable, unique Spanish objectives',()=>{
 assert.equal(ARKEN_STORY.length,7);
 assert.equal(new Set(ARKEN_STORY.map(s=>s.id)).size,7);
 for(const beat of ARKEN_STORY){assert.ok(beat.objective.length>=12);assert.ok(beat.hint.length>35);}
});
test('story is derived from legacy flags, guardian and saved dungeon outcome',()=>{
 assert.equal(arkenStoryIndex(state()),0);
 assert.equal(arkenStoryIndex(state(['archivist'])),1);
 assert.equal(arkenStoryIndex(state(['archivist','zone-forest'])),2);
 assert.equal(arkenStoryIndex(state(['archivist','zone-forest','zone-sanctuary'])),3);
 assert.equal(arkenStoryIndex(state(['archivist','zone-forest','zone-sanctuary'],true)),4);
 assert.equal(arkenStoryIndex(state(['archivist','zone-forest','zone-sanctuary'],true,true)),5);
 assert.equal(arkenStoryIndex(state(['archivist','zone-forest','zone-sanctuary',ARKEN_FINALE_FLAG],true,true)),6);
});
test('crypt clearing before guardian cannot award ending early',()=>{
 const saved=state(['archivist','zone-forest','zone-sanctuary'],false,true);
 assert.equal(arkenStoryIndex(saved),3);assert.equal(canConcludeArken(saved),false);
 assert.deepEqual(concludeArken(saved),{flags:saved.flags,newlyCompleted:false});
});
test('archivist finale is idempotent and requires every stage',()=>{
 const ready=state(['archivist','zone-forest','zone-sanctuary'],true,true);
 const result=concludeArken(ready);assert.equal(result.newlyCompleted,true);
 assert.equal(result.flags.filter(f=>f===ARKEN_FINALE_FLAG).length,1);
 const repeat=concludeArken({...ready,flags:result.flags});assert.equal(repeat.newlyCompleted,false);
 assert.equal(repeat.flags.filter(f=>f===ARKEN_FINALE_FLAG).length,1);
 assert.equal(arkenStoryBeat({...ready,flags:repeat.flags}).id,'ending');
});
test('unknown save flags and reordered arrays cannot bypass prerequisites',()=>{
 const s=state([ARKEN_FINALE_FLAG,'zone-sanctuary','zone-forest'],true,true);
 assert.equal(arkenStoryIndex(s),0);
 assert.equal(canConcludeArken(s),false);
});
