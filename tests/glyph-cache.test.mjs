import test from 'node:test';import assert from 'node:assert/strict';
import {ATLAS_COLORS,classifyGlyphColor,glyphPaletteIndex} from '../dist/render/glyph-cache.js';
test('glyph cache has bounded color and brightness combinations',()=>{for(let r=0;r<256;r+=17)for(let g=0;g<256;g+=19)for(let b=0;b<256;b+=23){const n=glyphPaletteIndex(r,g,b);assert.ok(n>=0&&n<ATLAS_COLORS);}});
test('art direction distinguishes root, ember, aether and neutral colors',()=>{assert.equal(classifyGlyphColor(220,120,75),3);assert.equal(classifyGlyphColor(90,215,100),2);assert.equal(classifyGlyphColor(140,95,220),4);assert.equal(classifyGlyphColor(102,101,100),0);});
