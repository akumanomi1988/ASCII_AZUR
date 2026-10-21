import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleHeroPose} from '../dist/actors/hero-performance.js';

test('four views have authored, distinct orientation and stable weapon hand',()=>{
 const views=[0,1,2,3].map(f=>sampleHeroPose(2,true,f));
 assert.deepEqual(views.map(x=>x.view),['back','right','front','left']);
 assert.equal(views[1].weaponSide,1);
 assert.equal(views[3].weaponSide,-1);
});
test('hero locomotion is deterministic and mirrored for identical facing',()=>{
 assert.deepEqual(sampleHeroPose(1.4,true,2),sampleHeroPose(1.4,true,2));
 const a=sampleHeroPose(0,true,2),b=sampleHeroPose(.125,true,2);
 assert.notEqual(a.step,b.step);
 assert.equal(sampleHeroPose(1,false,0).step,0);
});
test('reduced motion removes gait, idle bob, cape sway and blinking',()=>{
 for(const facing of [0,1,2,3]){
  const a=sampleHeroPose(.5,true,facing,true),b=sampleHeroPose(50,true,facing,true);
  assert.equal(a.step,0);assert.equal(a.cape,0);assert.equal(a.bob,0);
  assert.equal(a.blink,false);assert.deepEqual(a,b);
 }
});
test('invalid time rejected and unknown facing gracefully defaults to front',()=>{
 assert.throws(()=>sampleHeroPose(Number.NaN,true,2));
 assert.equal(sampleHeroPose(1,false,123).view,'front');
});
