import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,MOVES} from '../dist/domain.js';
import {creatureRole,tacticalProfile,teamGuide,loadoutUpgrade,relicUpgrade,recruitmentValue,storyThreat} from '../dist/creatures/tactical-identity.js';
const unit=(species,level=12)=>createCreature(species,level,()=>.25);
test('creature identity derives from actual known techniques and species roles',()=>{
 assert.match(creatureRole(unit('mourveil')),/SOPORTE/);
 assert.match(creatureRole(unit('ashglass')),/ASALTANTE/);
 assert.match(creatureRole(unit('velaria')),/SOPORTE/);
 assert.ok(creatureRole(unit('cindrel')).length>4);
});
test('real equipped type moves produce effective damage forecasts without mutating combatants',()=>{
 const c=unit('cindrel'),enemy=unit('hollowhart');const saved=JSON.stringify({c,enemy});
 const plan=tacticalProfile(c,enemy);
 assert.equal(plan.effective,true);assert.ok(plan.maxDamage>=plan.minDamage&&plan.minDamage>0);
 assert.equal(plan.enemyElement,'Raíz');assert.equal(plan.estimatedIncoming>0,true);
 assert.equal(JSON.stringify({c,enemy}),saved);
});
test('guardians need a specific counter, not the chosen starting element alone',()=>{
 const c=unit('cindrel',6),enemy=unit('hollowhart');c.moves=['pulse'];
 const plan=tacticalProfile(c,enemy);assert.equal(plan.effective,false);
 assert.equal(teamGuide([c],enemy).missingCounter,true);
});
test('team guide favors viable useful role, never a fainted teammate',()=>{
 const enemy=unit('hollowhart'),strong=unit('cindrel'),unavailable=unit('cindrel');
 unavailable.hp=0;
 const guide=teamGuide([unavailable,strong,unit('velaria')],enemy);
 assert.equal(guide.members.find(c=>c.viable===false).score,0);
 assert.equal(guide.recommended,'cindrel');assert.equal(guide.missingCounter,false);
});
test('loadout advice only proposes an actually unlocked and non-equipped technique',()=>{
 const c=unit('cindrel',14),enemy=unit('hollowhart');
 c.moves=['pulse'];
 const advice=loadoutUpgrade(c,enemy);
 assert.ok(advice);assert.ok(!c.moves.includes(advice.moveId));
 assert.ok(advice.candidateMax>advice.currentMax+2);
 assert.ok(advice.reason.includes('gratis'));
 assert.equal(loadoutUpgrade({...c,moves:['emberstorm']},enemy),null);
});
test('no upgrade offered when candidate adds no real damage',()=>{
 const c=unit('cindrel',3),enemy=unit('hollowhart');
 c.moves=['ember','pulse'];const r=loadoutUpgrade(c,enemy);
 assert.equal(r,null);
});
test('relic advice respects available copies and does not claim unavailable items',()=>{
 const c=unit('cindrel'),enemy=unit('hollowhart'),state={team:[c],storage:[],relics:{'ember-tooth':1,'pilgrim-ward':1}};
 const out=relicUpgrade(c,enemy,[],state);
 assert.ok(out);assert.ok(['ember-tooth','pilgrim-ward'].includes(out.id));
 assert.ok(out.damageGain+out.incomingReduction>0);
 assert.equal(relicUpgrade(c,enemy,[],{team:[c],storage:[],relics:{}}),null);
});
test('relic ownership includes equipped copies and may not clone a relic',()=>{
 const equipped={...unit('cindrel'),equipment:'ember-tooth'},challenger=unit('cindrel');
 const state={team:[equipped,challenger],storage:[],relics:{'ember-tooth':1}};
 const out=relicUpgrade(challenger,unit('hollowhart'),[],state);
 assert.notEqual(out?.id,'ember-tooth');
});
test('bond paths influence the same damage estimates as the real combat execution',()=>{
 const c=unit('cinderwulf'),enemy=unit('hollowhart');
 const ordinary=tacticalProfile(c,enemy);
 const fang=tacticalProfile(c,enemy,['bond-ember-fang']);
 const ward=tacticalProfile(c,enemy,['bond-ember-ward']);
 assert.equal(fang.maxDamage,ordinary.maxDamage+4);
 assert.ok(ward.estimatedIncoming<=ordinary.estimatedIncoming);
});
test('recruitment value identifies new tactical affinity without mutating inventory',()=>{
 const old=unit('cindrel'),newOne=unit('velaria');const original=JSON.stringify([old,newOne]);
 const text=recruitmentValue(newOne,[old]);
 assert.match(text,/NUEVA AFINIDAD/);
 assert.match(text,/BRUMA contra ÉTER/);
 assert.match(recruitmentValue(old,[old]),/OTRO EJEMPLAR/);
 assert.equal(JSON.stringify([old,newOne]),original);
});
test('story threat follows only earned persistent campaign flags',()=>{
 assert.equal(storyThreat([]).speciesId,'hollowhart');
 assert.equal(storyThreat(['first-word']),null);
 assert.equal(storyThreat(['first-word','marsh-chapter-complete']).speciesId,'nullscribe');
 assert.equal(storyThreat(['first-word','marsh-chapter-complete','crown-nullscribe-fallen']),null);
});
test('invalid tactical species and no usable attack fail closed',()=>{
 const c=unit('velaria'),enemy=unit('hollowhart');
 c.moves=['drizzle'];const p=tacticalProfile(c,enemy);
 assert.equal(p.bestMoveId,null);assert.equal(p.maxDamage,0);
 assert.throws(()=>tacticalProfile({...c,speciesId:'undefined'},enemy));
});

test('identity never advertises an unlocked but unequipped healing role',()=>{
 const c=unit('cindrel',14);c.moves=['pulse'];
 assert.match(creatureRole(c),/ATAQUE/);
 assert.doesNotMatch(creatureRole(c),/CURACIÓN/);
});


test('scouting detects a real weaker equipped counter when the best hit is neutral',()=>{
 const ally=unit('velaria',12),enemy=unit('cindrel',12);
 const snapshot=JSON.stringify({ally,enemy});
 const profile=tacticalProfile(ally,enemy),guide=teamGuide([ally],enemy);
 assert.equal(profile.bestMoveId,'tide');
 assert.equal(profile.effective,false,'the top-damage move is neutral');
 assert.equal(profile.counterMoveId,'pulse','a weaker equipped Ether attack counters Ash');
 assert.ok(profile.counterMaxDamage>0&&profile.counterMaxDamage<profile.maxDamage);
 assert.match(profile.summary,/alternativa eficaz: Pulso/);
 assert.equal(guide.missingCounter,false,'do not wrongly warn that no counter exists');
 assert.equal(guide.recommendedUid,ally.uid);
 assert.equal(JSON.stringify({ally,enemy}),snapshot,'scouting is read-only');
});
test('scouting recommends an exact UID rather than the first copy of a species',()=>{
 const weak=unit('velaria',3),strong=unit('velaria',18),enemy=unit('cindrel',12);
 weak.uid='weak-velaria';weak.hp=2;strong.uid='strong-velaria';
 const roster=[weak,strong],before=JSON.stringify(roster);
 const guide=teamGuide(roster,enemy);
 assert.equal(guide.recommended,'velaria');
 assert.equal(guide.recommendedUid,strong.uid);
 assert.equal(guide.members[0].uid,strong.uid);
 assert.equal(JSON.stringify(roster),before,'no equipment, leader or save mutations');
});
