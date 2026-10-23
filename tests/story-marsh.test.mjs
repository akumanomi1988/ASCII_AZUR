import test from 'node:test';
import assert from 'node:assert/strict';
import {marshChapterProgress,marshDecision,marshFinish,MARSH_REWARDS,MARSH_CHAPTER_FLAG} from '../dist/story-marsh.js';
const arken=['arken-vow-restored'];
const arrived=[...arken,'zone-marsh'];
const met=[...arrived,'marsh-met-nael'];
const remembered=[...met,'marsh-memory-bell','marsh-memory-lantern'];
const ready=[...remembered,'roamer-marsh-0','roamer-marsh-1','roamer-marsh-2'];
test('second chapter has seven finite sequential beats and an authored objective at every step',()=>{
 for(const [flags,stage] of [[arken,0],[arrived,1],[met,2],[remembered,3],[ready,4],[[...ready,'marsh-choice-keep'],5],[[...ready,'marsh-choice-keep',MARSH_CHAPTER_FLAG],6]]){
  const p=marshChapterProgress(flags);assert.equal(p.stage,stage);assert.ok(p.objective&&p.title&&p.hint);
 }
});
test('memories and roamer encounters cannot be substituted by duplicates',()=>{
 const s=[...met,'marsh-memory-bell','marsh-memory-bell','roamer-marsh-0','roamer-marsh-0'];
 const p=marshChapterProgress(s);
 assert.equal(p.memories,1);assert.equal(p.encounters,1);assert.equal(p.verdictReady,false);
 assert.equal(marshDecision(s,'keep').newlyDecided,false);
});
test('two irreversible opposing choices yield different finite resource rewards',()=>{
 for(const choice of ['keep','release']){
  const decision=marshDecision(ready,choice);
  assert.equal(decision.newlyDecided,true);
  assert.equal(marshChapterProgress(decision.flags).choice,choice);
  assert.equal(marshChapterProgress(decision.flags).endingReady,true);
  assert.equal(marshDecision(decision.flags,choice==='keep'?'release':'keep').newlyDecided,false);
  assert.equal(MARSH_REWARDS[choice].echoes,180);
  assert.equal(MARSH_REWARDS[choice].seals+MARSH_REWARDS[choice].tonics,4);
  const end=marshFinish(decision.flags);
  assert.equal(end.newlyFinished,true);
  assert.equal(marshChapterProgress(end.flags).complete,true);
  assert.equal(marshFinish(end.flags).newlyFinished,false);
 }
});
test('old Arken endings do not gain decisions or rewards without visiting marsh and gathering evidence',()=>{
 assert.equal(marshChapterProgress(arken).stage,0);
 assert.equal(marshDecision(arken,'keep').newlyDecided,false);
 assert.equal(marshFinish(arken).newlyFinished,false);
});
