import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCreature,maxHp,MOVES} from '../dist/domain.js';
import {suggestBattleAction,protectedSwitchDamage} from '../dist/combat/planning.js';

const c=(id,level=12)=>createCreature(id,level,()=>.35);
const context=(ally,enemy,override={})=>({
 type:'wild',party:[ally],allyIndex:0,seals:3,hasRoom:true,
 ownedSpecies:[ally.speciesId],flags:[],...override
});
const decide=(ally,enemy,ctx,allyStatuses=[],enemyStatuses=[],opts={})=>
 suggestBattleAction(ally,enemy,allyStatuses,enemyStatuses,opts.tonics??0,opts.charge??0,opts.phase??1,opts.heals??3,ctx);

test('newly recruitable weakened wild creatures are suggested before lethal spam',()=>{
 const ally=c('cindrel',14),enemy=c('briarling',5);enemy.hp=Math.max(1,Math.floor(maxHp(enemy)*.20));
 const suggestion=decide(ally,enemy,context(ally,enemy));
 assert.equal(suggestion.kind,'capture');assert.match(suggestion.reason,/\d+ %/);
 assert.notEqual(decide(ally,enemy,context(ally,enemy,{seals:0})).kind,'capture');
 assert.notEqual(decide(ally,enemy,context(ally,enemy,{hasRoom:false})).kind,'capture');
 assert.notEqual(decide(ally,enemy,context(ally,enemy,{type:'boss'})).kind,'capture');
 assert.notEqual(decide(ally,enemy,context(ally,enemy,{ownedSpecies:[ally.speciesId,enemy.speciesId]})).kind,'capture');
});
test('an imminent charged strike is guarded unless the minimum hit kills',()=>{
 const ally=c('velaria',9),enemy=c('hollowhart',14);
 assert.equal(decide(ally,enemy,context(ally,enemy,{type:'boss'}),[],[],{charge:2}).kind,'guard');
 enemy.hp=1;
 const finishing=decide(ally,enemy,context(ally,enemy,{type:'boss'}),[],[],{charge:2});
 assert.equal(finishing.kind,'move');assert.ok(MOVES[finishing.moveId].power>0);
});
test('near defeat suggests a protected viable replacement, without changing the party',()=>{
 const ally=c('cindrel',3),reserve=c('thorne',16),enemy=c('gravemoth',16);ally.hp=3;
 const party=[ally,reserve],ctx=context(ally,enemy,{type:'boss',party});
 const before=JSON.stringify([party,enemy]);
 const suggestion=decide(ally,enemy,ctx);
 assert.deepEqual({kind:suggestion.kind,targetIndex:suggestion.targetIndex},{kind:'switch',targetIndex:1});
 assert.equal(JSON.stringify([party,enemy]),before);
});
test('switch advice evaluates the replacement creature, not the outgoing ally',()=>{
 const ally=c('tideworn',24),enemy=c('ashglass',20),fragile=c('thorne',8);
 ally.hp=1;ally.moves=['pulse'];
 const outgoingShield=protectedSwitchDamage(enemy,ally,[],[],[],1);
 const replacementShield=protectedSwitchDamage(enemy,fragile,[],[],[],1);
 assert.ok(replacementShield>outgoingShield+2,'type advantage and low defense make the replacement more vulnerable');
 assert.ok(replacementShield<=maxHp(fragile),'fixture can represent a weakened living replacement');
 fragile.hp=replacementShield;
 assert.ok(fragile.hp>outgoingShield+2,'the previous outgoing-ally projection would have treated this switch as safe');
 const advice=decide(ally,enemy,context(ally,enemy,{type:'boss',party:[ally,fragile]}));
 assert.equal(advice.kind,'guard','the unsafe replacement must not be recommended');
 const next=protectedSwitchDamage(enemy,fragile,[],[{kind:'fracture',remaining:2}],[],1);
 assert.ok(next>replacementShield,'the reserve creature\'s active fracture must increase projected incoming damage');
 const fractured=decide(ally,enemy,context(ally,enemy,{type:'boss',party:[ally,fragile],
  statusesByUid:{[fragile.uid]:[{kind:'fracture',remaining:2}]}}));
 assert.notEqual(fractured.kind,'switch');
});

test('protected switch forecast uses the same boss-phase and guard rules as live combat',()=>{
 const enemy=c('hollowhart',19),reserve=c('velaria',12);
 const first=protectedSwitchDamage(enemy,reserve,[],[],[],1);
 const escalated=protectedSwitchDamage(enemy,reserve,[],[],[],2);
 assert.ok(first>0);assert.ok(escalated>=first);
 assert.equal(protectedSwitchDamage({...enemy,moves:['drizzle']},reserve,[],[],[],1),0,
  'an enemy healing action is not an incoming attack');
});

test('defensive cleanse is suggested against lasting statuses when not lethal',()=>{
 const ally=c('cindrel',12),enemy=c('hollowhart',18);
 ally.moves=['emberstorm','funeral'];
 const suggestion=decide(ally,enemy,context(ally,enemy,{type:'boss'}),[{kind:'scorch',remaining:3}]);
 assert.equal(suggestion.kind,'move');
 assert.equal(suggestion.moveId,'funeral');
 assert.match(suggestion.reason,/Purifica/);
});
test('early probabilistic status matters only when novel and the target will survive',()=>{
 const ally=c('cindrel',13),enemy=c('hollowhart',20);ally.moves=['flare','smolder'];
 const ctx=context(ally,enemy,{type:'boss'});
 const proc=decide(ally,enemy,ctx);
 assert.equal(proc.kind,'move');assert.equal(proc.moveId,'smolder');
 assert.match(proc.reason,/65 %/);
 const already=decide(ally,enemy,ctx,[],[{kind:'scorch',remaining:3}]);
 assert.equal(already.kind,'move');assert.equal(already.moveId,'flare');
});
test('no attack or no remaining healing creates no invalid action recommendations',()=>{
 const ally=c('velaria',12),enemy=c('thorne',17);ally.moves=['drizzle'];
 const recommendation=decide(ally,enemy,context(ally,enemy,{type:'boss'}),[],[],{heals:0});
 assert.equal(recommendation.kind,'guard');
});
test('combat hints are wired into real battle, with both mouse/touch buttons and keyboard focus',()=>{
 const source=readFileSync('src/main.ts','utf8');
 const css=readFileSync('style.css','utf8');
 assert.match(source,/hasRoom:this\.save\.team\.length<6/);
 assert.match(source,/ownedSpecies:\[\.\.\.this\.save\.team,\.\.\.this\.save\.storage\]/);
 assert.match(source,/data-recommended/);
 assert.match(source,/if\(!b\.busy&&!disabled&&advisedButton\)/);
 assert.match(css,/recommended-choice:not\(:disabled\)/);
 assert.match(css,/recommended-choice:not\(:disabled\):focus-visible/);
});
