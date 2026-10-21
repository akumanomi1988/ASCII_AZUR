import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleBattleSignature} from '../dist/actors/battle-direction.js';
import {createCombatCue,sampleCombatCue} from '../dist/actors/combat-fx.js';
import {SPECIES} from '../dist/domain.js';

const cue=(side='ally')=>sampleCombatCue(createCombatCue('attack',side,'Ceniza',1,21,true),1.405);
test('all twelve original creatures produce a defined battle signature',()=>{
 for(const id of Object.keys(SPECIES)){
  const a=sampleBattleSignature(id,cue());
  assert.ok(a?.kind,`${id} missing signature`);
  for(const n of Object.values(a.attacker))assert.ok(Number.isFinite(n),`${id} invalid pose`);
 }
});
test('families have distinct attack silhouettes and transform curves',()=>{
 const ids=['cindrel','velaria','gravemoth','runeowl','ashboar','rillfin','briarling','hollowhart','thorne'];
 const signatures=ids.map(id=>sampleBattleSignature(id,cue()));
 assert.equal(new Set(signatures.map(x=>x.kind)).size,9);
 assert.equal(new Set(signatures.map(x=>JSON.stringify(x.attacker))).size,9);
});
test('enemy attack mirrors spatial impulse, hit window is bounded, and no save state is mutated',()=>{
 const ally=sampleBattleSignature('cindrel',cue('ally'));
 const enemy=sampleBattleSignature('cindrel',cue('enemy'));
 assert.ok(ally.attacker.x>0);assert.ok(enemy.attacker.x<0);
 assert.ok(ally.impact>=0&&ally.impact<=1);
 assert.deepEqual(sampleBattleSignature('cindrel',cue()),ally);
});
test('reduced motion suppresses kinetic effects but preserves attack family',()=>{
 const regular=sampleBattleSignature('gravemoth',cue(),false);
 const reduced=sampleBattleSignature('gravemoth',cue(),true);
 assert.equal(regular.kind,reduced.kind);assert.equal(reduced.energy,0);assert.equal(reduced.attacker.x,0);assert.equal(reduced.defender.alpha,1);
});
test('none, guard and finished cues do not create attack signatures',()=>{
 assert.equal(sampleBattleSignature('cindrel',null),null);
 assert.equal(sampleBattleSignature('cindrel',sampleCombatCue(createCombatCue('guard','ally','Bruma',1),1.3)),null);
 assert.equal(sampleBattleSignature('cindrel',sampleCombatCue(createCombatCue('attack','ally','Bruma',1),6)),null);
});
