import test from 'node:test';
import assert from 'node:assert/strict';
import {glyphVisible} from '../dist/render/legibility.js';

test('true black remains blank independent of dithering noise',()=>{
 for(const noise of [0,.2,.5,.99])assert.equal(glyphVisible(0,0,noise),false);
});
test('dark and middle tonal cells remain populated — no random empty patches',()=>{
 for(const lum of [.02,.15,.3,.42,.58,.68]){
  for(const noise of [0,.2,.5,.99])assert.equal(glyphVisible(lum,.01,noise),true);
 }
});
test('sharp silhouettes always survive with very small characters',()=>{
 for(const noise of [0,.5,.99])assert.equal(glyphVisible(0,.1,noise),true);
});
