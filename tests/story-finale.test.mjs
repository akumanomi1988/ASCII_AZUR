import test from 'node:test';
import assert from 'node:assert/strict';
import {crownProgress,crownChoose,crownFinish,crownEpilogue,CROWN_BOSS_FLAG,CROWN_END_FLAG,CROWN_RELIC_FLAGS,CROWN_WITNESS_FLAGS,CROWN_CHOICE_REWARDS} from '../dist/story-finale.js';
const arc=['arken-vow-restored','marsh-chapter-complete','marsh-choice-keep','zone-spire'];
const met=[...arc,'crown-met-oriel'],relics=[...met,...CROWN_RELIC_FLAGS],witnesses=[...relics,...CROWN_WITNESS_FLAGS];
test('N3: explicit seven-stage non-skippable climax and terminal free-roam state',()=>{
 const cases=[[[],0],[arc,1],[met,2],[relics,3],[witnesses,4],[[...witnesses,CROWN_BOSS_FLAG],5],[[...witnesses,CROWN_BOSS_FLAG,'crown-choice-remember'],6],[[...witnesses,CROWN_BOSS_FLAG,'crown-choice-remember',CROWN_END_FLAG],7]];
 for(const [flags,stage] of cases){
  const result=crownProgress(flags);
  assert.equal(result.stage,stage,JSON.stringify(flags));assert.ok(result.objective&&result.hint&&result.title);
 }
 assert.equal(crownProgress(['marsh-chapter-complete','zone-spire']).unlocked,false);
});
test('N3: boss and endings cannot be accessed before the two relics and three distinct witnesses',()=>{
 assert.equal(crownProgress(relics).bossReady,false);
 assert.equal(crownProgress([...met,CROWN_RELIC_FLAGS[0],CROWN_RELIC_FLAGS[0],...CROWN_WITNESS_FLAGS]).bossReady,false);
 assert.equal(crownProgress(witnesses).bossReady,true);
 assert.equal(crownChoose(witnesses,'renew').newlyChosen,false);
 assert.equal(crownFinish(witnesses).newlyFinished,false);
});
test('N3: final choice and finite rewards are irreversible, with four distinct consequence-aware epilogues',()=>{
 const ready=[...witnesses,CROWN_BOSS_FLAG],epilogues=new Set();
 for(const marsh of ['marsh-choice-keep','marsh-choice-release'])for(const future of ['remember','renew']){
  const base=[...ready.filter(f=>!f.startsWith('marsh-choice-')),marsh];
  const chosen=crownChoose(base,future);
  assert.equal(chosen.newlyChosen,true);
  assert.equal(crownProgress(chosen.flags).choice,future);
  assert.equal(crownChoose(chosen.flags,future==='remember'?'renew':'remember').newlyChosen,false);
  const result=crownEpilogue(chosen.flags);assert.equal(result.length,3);
  epilogues.add(JSON.stringify(result));
  const finish=crownFinish(chosen.flags);
  assert.equal(finish.newlyFinished,true);
  assert.equal(crownFinish(finish.flags).newlyFinished,false);
  assert.equal(crownProgress(finish.flags).complete,true);
  assert.equal(CROWN_CHOICE_REWARDS[future].echoes,220);
  assert.equal(CROWN_CHOICE_REWARDS[future].seals+CROWN_CHOICE_REWARDS[future].tonics,4);
 }
 assert.equal(epilogues.size,4,'four morally coherent narrated endings');
});
