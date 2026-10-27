import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gpuResolutionFactor,adaptiveDefault,initialAdaptiveScale,limitedMobileHardware} from '../dist/core/presentation-budget.js';
import {readGraphics,DEFAULT_GRAPHICS} from '../dist/render/graphics-profile.js';
test('adaptive WebGL2 budget changes actual fragment load, restores full quality and stays bounded',()=>{
 const ratios=[1,1.2,1.44,1.73,2.4].map(gpuResolutionFactor);
 assert.equal(ratios[0],1);
 assert.ok(ratios.at(-1)>=.62&&ratios.at(-1)**2<.5);
 for(let i=1;i<ratios.length;i++)assert.ok(ratios[i]<ratios[i-1]);
 assert.equal(gpuResolutionFactor(Infinity),1);assert.equal(gpuResolutionFactor(NaN),1);
});
test('real touch microscopic mode can default to protective scaling without changing art settings',()=>{
 const tiny=readGraphics({renderMode:'ascii',density:.18,glyphScale:.5,pixelDetail:'fine'});
 const snapshot=JSON.stringify(tiny);
 assert.equal(adaptiveDefault(5,'gpu',tiny),true);
 assert.equal(adaptiveDefault(0,'gpu',tiny),false);
 assert.equal(adaptiveDefault(5,'gpu',DEFAULT_GRAPHICS),false);
 assert.equal(adaptiveDefault(5,'gpu',readGraphics({renderMode:'glyph-pixel',pixelDetail:'fine'})),true);
 assert.equal(adaptiveDefault(5,'gpu',readGraphics({renderMode:'ascii',density:.32,pixelDetail:'fine'})),false,
  'a hidden pixel-art setting must not change ASCII stability defaults');
 assert.equal(adaptiveDefault(0,'fallback',tiny),true);
 assert.ok(initialAdaptiveScale(5,'gpu',tiny)>1);
 assert.equal(initialAdaptiveScale(0,'gpu',tiny),1);
 assert.equal(initialAdaptiveScale(0,'fallback',tiny),1.6);
 assert.equal(JSON.stringify(tiny),snapshot);
});

test('selecting microscopic mode mid-session respects manual opt-out and updates the live toggle',()=>{
 const source=readFileSync('src/main.ts','utf8');
 assert.match(source,/localStorage\.getItem\('ascii-azur-adaptive-fps-v1'\)===null/);
 assert.match(source,/adaptive\.checked=this\.adaptiveGlyphs\.active;sync\(\)/);
});

test('low-end mobile hints enable reversible performance protection without changing user choices',()=>{
 assert.equal(limitedMobileHardware(0,2,2),false);
 assert.equal(limitedMobileHardware(5,2,2),true);
 assert.equal(limitedMobileHardware(5,4,4),true);
 assert.equal(limitedMobileHardware(5,8,8),false);
 assert.equal(limitedMobileHardware(5,8,undefined),false);
 assert.equal(limitedMobileHardware(5,0,0),false);
 assert.equal(limitedMobileHardware(5,NaN,NaN),false);
 assert.equal(limitedMobileHardware(5,6,2),true);
 assert.equal(adaptiveDefault(5,'gpu',DEFAULT_GRAPHICS,2,2),true);
 assert.equal(adaptiveDefault(5,'gpu',DEFAULT_GRAPHICS,8,8),false);
 assert.equal(adaptiveDefault(0,'gpu',DEFAULT_GRAPHICS,2,2),false);
 assert.equal(initialAdaptiveScale(5,'gpu',DEFAULT_GRAPHICS,2,2),1.4);
 assert.equal(initialAdaptiveScale(5,'gpu',DEFAULT_GRAPHICS,8,8),1);
 assert.equal(initialAdaptiveScale(5,'fallback',DEFAULT_GRAPHICS,2,2),1.6);
 const source=readFileSync('src/main.ts','utf8');
 assert.match(source,/const enabled=saved===null\?adaptiveDefault\(/);
 assert.match(source,/:saved==='true'/);
 assert.match(source,/hardwareConcurrency/);
 assert.match(source,/deviceMemory/);
});
