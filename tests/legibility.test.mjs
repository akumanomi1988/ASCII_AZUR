import test from 'node:test';
import assert from 'node:assert/strict';
import {glyphVisible} from '../dist/render/legibility.js';

test('unlit flat ground is suppressed even at maximal noise threshold',()=>{
  for(const noise of [0,.2,.5,.99])assert.equal(glyphVisible(.15,.01,noise),false);
});
test('high-gradient character silhouettes remain visible independently of noise',()=>{
  for(const noise of [0,.2,.5,.99])assert.equal(glyphVisible(.3,.18,noise),true);
});
test('flat midtones are dithered to reduce glyph clutter',()=>{
  assert.equal(glyphVisible(.42,.04,.10),true);
  assert.equal(glyphVisible(.42,.04,.98),false);
  assert.equal(glyphVisible(.68,.04,.98),true);
});
