import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,maxHp} from '../dist/domain.js';
import {capturePreview,CAPTURE_MAX_CHANCE} from '../dist/combat/capture-odds.js';
const ally=createCreature('cindrel',5,()=>.1);
const enemy=createCreature('thorne',6,()=>.2);
test('capture baseline exactly matches pre-v0.22 formula without statuses',()=>{
 for(const hp of [maxHp(enemy),Math.floor(maxHp(enemy)/2),1]){
  const target={...enemy,hp};
  const expected=Math.min(.94,.26+(1-hp/maxHp(target))*.65+Math.max(0,ally.level-target.level)*.02);
  const result=capturePreview(ally,target,[]);
  assert.ok(Math.abs(result.chance-expected)<1e-12);
  assert.equal(result.percent,Math.round(expected*100));
 }
});
test('active statuses improve capture in disclosed 8 percent-point increments',()=>{
 const base=capturePreview(ally,enemy,[]);
 const once=capturePreview(ally,enemy,[{kind:'weaken',remaining:2}]);
 const twice=capturePreview(ally,enemy,[{kind:'weaken',remaining:1},{kind:'fracture',remaining:2}]);
 assert.ok(Math.abs(once.chance-base.chance-.08)<1e-12);
 assert.ok(Math.abs(twice.chance-base.chance-.16)<1e-12);
 assert.match(twice.accessible,/16 puntos porcentuales/);
});
test('expired and repeated ailments never stack capture benefits',()=>{
 const one=capturePreview(ally,enemy,[{kind:'weaken',remaining:2}]);
 const repeated=capturePreview(ally,enemy,[{kind:'weaken',remaining:2},{kind:'weaken',remaining:1},{kind:'scorch',remaining:0}]);
 assert.equal(repeated.chance,one.chance);
});
test('low-health capture cannot exceed 94 percent and defeated enemy cannot be captured',()=>{
 const ready={...enemy,hp:1};
 const boosted=capturePreview({...ally,level:30},ready,[{kind:'scorch',remaining:1},{kind:'fracture',remaining:1}]);
 assert.equal(boosted.chance,CAPTURE_MAX_CHANCE);
 assert.equal(capturePreview(ally,{...enemy,hp:0},[]).chance,0);
});
test('capture model is deterministic and never mutates the encounter',()=>{
 const statuses=[{kind:'weaken',remaining:2}];const original=structuredClone(enemy);
 const first=capturePreview(ally,enemy,statuses),second=capturePreview(ally,enemy,statuses);
 assert.deepEqual(first,second);assert.deepEqual(enemy,original);assert.deepEqual(statuses,[{kind:'weaken',remaining:2}]);
});
