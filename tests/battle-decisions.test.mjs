import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCreature,maxHp,MOVES} from '../dist/domain.js';
import {suggestBattleAction} from '../dist/combat/planning.js';

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
