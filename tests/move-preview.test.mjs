import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,MOVES,maxHp} from '../dist/domain.js';
import {previewMove} from '../dist/combat/move-preview.js';
import {attackWithStatuses,skillUtility} from '../dist/combat/tactics.js';
const c=(id,level=8)=>createCreature(id,level,()=>.2);
test('preview damage bounds exactly bracket both existing combat rolls',()=>{
 const attacker=c('cindrel'),target=c('thorne');
 for(const statuses of [[],[{kind:'weaken',remaining:2}]]){
  for(const defense of [[],[{kind:'fracture',remaining:1}]]){
   const preview=previewMove(attacker,target,MOVES.ember,statuses,defense);
   assert.equal(preview.min,attackWithStatuses(attacker,target,MOVES.ember,statuses,defense,.90).value);
   assert.equal(preview.max,attackWithStatuses(attacker,target,MOVES.ember,statuses,defense,1.09).value);
   assert.match(preview.summary,/DAÑO/);
   assert.match(preview.extra,/EFICAZ/);
  }
 }
});
test('effect probability is disclosed rather than described as certain',()=>{
 const preview=previewMove(c('cindrel'),c('briarling'),MOVES.ember,[],[]);
 assert.match(preview.extra,/ARDOR 22%/);
 assert.match(preview.accessible,/22%/);
});
test('resisted moves indicate unfavorable matchups',()=>{
 const preview=previewMove(c('thorne'),c('cindrel'),MOVES.thorn,[],[]);
 assert.match(preview.extra,/RESISTIDO/);
});
test('healing shows effective amount but never claims direct damage',()=>{
 const ally=c('cindrel');ally.hp-=12;
 const result=previewMove(ally,c('thorne'),MOVES.kindle,[],[]);
 assert.equal(result.min,0);assert.equal(result.max,0);
 assert.equal(result.summary,`+${skillUtility(ally,MOVES.kindle,[]).healing} VIDA`);
 assert.ok(result.summary.includes('+12'));
});
test('cleansing attack still advertises damage and the cleanse',()=>{
 const a=c('cindrel'),b=c('thorne');
 const statuses=[{kind:'scorch',remaining:2}];
 const preview=previewMove(a,b,MOVES.funeral,statuses,[]);
 assert.ok(preview.min>0);assert.match(preview.extra,/PURIFICA 1/);
 assert.match(preview.accessible,/purifica estados/);
});
test('draining attacks expose recovery and preserve combat formula',()=>{
 const result=previewMove(c('cindrel'),c('thorne'),MOVES.ashfang,[],[]);
 assert.match(result.extra,/ROBA VIDA/);
 assert.ok(result.max>=result.min);
});
