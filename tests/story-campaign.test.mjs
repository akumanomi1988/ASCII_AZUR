import test from 'node:test';
import assert from 'node:assert/strict';
import {ARKEN_FINALE_FLAG,ARKEN_STORY,arkenStoryIndex,arkenStoryBeat,canConcludeArken,concludeArken,guardianPreparation,sanctuaryRoutePlan,sanctuaryOathProgress,SANCTUARY_OATHS_FLAG,SANCTUARY_OATHS_REWARD} from '../dist/story-campaign.js';
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

test('guardian preparation warns the underprepared but does not gate battle',()=>{
 const newbie={uid:'first',speciesId:'cindrel',level:5,exp:0,hp:12,moves:['ember']};
 const result=guardianPreparation([newbie]);
 assert.equal(result.ready,false);
 assert.equal(result.advice.length,3);
 assert.match(result.advice.join(' '),/dos criaturas/);
 assert.match(result.advice.join(' '),/nivel 8/);
});
test('guardian advice recognizes a healthy captured team and never promises victory',()=>{
 const group=[
  {uid:'a',speciesId:'cinderwulf',level:9,exp:0,hp:84,moves:['ember']},
  {uid:'b',speciesId:'runeowl',level:8,exp:0,hp:70,moves:['astral']}
 ];
 const result=guardianPreparation(group);
 assert.equal(result.ready,true);
 assert.deepEqual(result.advice,[]);
});
 
test('guardian preparation identifies missing actionable elemental counter in a healthy team',()=>{
 const mist={uid:'a',speciesId:'velaria',level:9,exp:0,hp:72,moves:['fog','tide']};
 const root={uid:'b',speciesId:'thorne',level:9,exp:0,hp:79,moves:['thorn','roots']};
 const result=guardianPreparation([mist,root]);
 assert.equal(result.ready,false);
 assert.equal(result.advice.length,1);
 assert.match(result.advice[0],/Hollowhart es de Raíz/);
 assert.match(result.advice[0],/Ceniza/);
 assert.match(result.advice[0],/Bosque de Ceniza/);
});
test('guardian preparation accepts actual counter move, not just ash creature name',()=>{
 const mist={uid:'a',speciesId:'velaria',level:9,exp:0,hp:72,moves:['fog','tide']};
 const fire={uid:'b',speciesId:'cindrel',level:9,exp:0,hp:69,moves:['ember','pulse']};
 assert.equal(guardianPreparation([mist,fire]).ready,true);
 assert.equal(guardianPreparation([mist,{...fire,moves:['pulse']}]).ready,false);
 assert.ok(guardianPreparation([mist,{...fire,hp:1}]).advice.some(x=>x.includes('Lumbre')));
});

test('Sanctuary scouting uses only equipped offensive counters and persists cleared stages',()=>{
 const route=[
  {id:'sanctuary-0',speciesId:'briarling',level:8},
  {id:'sanctuary-1',speciesId:'rillfin',level:9},
  {id:'sanctuary-2',speciesId:'runeowl',level:10}
 ];
 const ash={uid:'a',speciesId:'cindrel',level:8,exp:0,hp:52,moves:['ember','pulse']};
 const root={uid:'b',speciesId:'thorne',level:9,exp:0,hp:62,moves:['thorn','roots']};
 const mist={uid:'c',speciesId:'velaria',level:8,exp:0,hp:56,moves:['fog','tide']};
 const before=JSON.stringify([ash,root,mist,route]);
 const report=sanctuaryRoutePlan([ash,root,mist],route,['roamer-sanctuary-1']);
 assert.deepEqual(report.map(x=>x.counter),['Cindrel','Thorne','Velaria']);
 assert.deepEqual(report.map(x=>x.cleared),[false,true,false]);
 assert.deepEqual(report.map(x=>x.level),[8,9,10]);
 assert.equal(JSON.stringify([ash,root,mist,route]),before,'scouting must be read-only');
 assert.deepEqual(sanctuaryRoutePlan([{...ash,hp:0},root,{...mist,moves:['pulse']}],route,[]).map(x=>x.counter),
  [null,'Thorne',null],'fainted or unequipped moves may not falsely promise a counter');
 assert.equal(sanctuaryRoutePlan([{...root,moves:['verdancy']}],route,[]).every(x=>x.counter===null),true,
  'non-damaging skills do not count as offensive counters');
});

test('Sanctuary oaths accept first victory or capture flags and never permit repeat payout',()=>{
 const partial=['roamer-sanctuary-0','roamer-sanctuary-0','roamer-sanctuary-2'];
 assert.deepEqual(sanctuaryOathProgress(partial),{resolved:2,ready:false,claimed:false});
 const complete=[...partial,'roamer-sanctuary-1'];
 assert.deepEqual(sanctuaryOathProgress(complete),{resolved:3,ready:true,claimed:false});
 assert.deepEqual(sanctuaryOathProgress([...complete,SANCTUARY_OATHS_FLAG]),
  {resolved:3,ready:false,claimed:true});
 assert.deepEqual(SANCTUARY_OATHS_REWARD,{echoes:40,seals:2,tonics:2});
});
