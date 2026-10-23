import test from 'node:test';
import assert from 'node:assert/strict';
import {pixelSourceDivisor,pixelAccent} from '../dist/render/glyph-pixel-presentation.js';

test('pixel fallback preserves a useful source resolution across adaptive performance tiers',()=>{
  assert.equal(pixelSourceDivisor('fine',1),2);
  assert.equal(pixelSourceDivisor('balanced',1),3);
  assert.equal(pixelSourceDivisor('chunky',1),4);
  assert.equal(pixelSourceDivisor('fine',2.4),3);
  assert.equal(pixelSourceDivisor('balanced',2.4),4);
  assert.equal(pixelSourceDivisor('chunky',2.4),5);
  assert.equal(pixelSourceDivisor('balanced',NaN),3);
  assert.ok(Math.ceil(960/pixelSourceDivisor('balanced',2.4))>=240);
});

test('pixel glyph ink is reserved for strong scene edges, not flat-colored ground',()=>{
  for(const noise of [0,.15,.29,.5,1]){
    assert.equal(pixelAccent(0,noise),-1);
    assert.equal(pixelAccent(.219,noise),-1);
  }
  assert.equal(pixelAccent(.25,.1),0);
  assert.equal(pixelAccent(.35,.1),1);
  assert.equal(pixelAccent(.5,.1),2);
  assert.equal(pixelAccent(.8,.1),3);
  assert.equal(pixelAccent(.8,.4),-1);
  assert.equal(pixelAccent(NaN,.1),-1);
});
