import test from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveGlyphs} from '../dist/core/adaptive-glyphs.js';
import {readGraphics, DEFAULT_GRAPHICS} from '../dist/render/graphics-profile.js';
const report=(p95,average=p95,samples=90)=>({samples,averageMs:average,p50Ms:p95,p95Ms:p95,p99Ms:p95,maxMs:p95,overBudget:p95>33?90:0,budgetMs:1000/30});
test('Manual microscopic density is never changed without explicit opt-in',()=>{
 const auto=new AdaptiveGlyphs();const original=readGraphics({density:.18,glyphScale:.5});
 for(let now=2000;now<22000;now+=2000)assert.equal(auto.observe(report(70),now,true),false);
 assert.equal(auto.scale,1);assert.deepEqual(original,readGraphics({density:.18,glyphScale:.5}));assert.equal(DEFAULT_GRAPHICS.density,.32);
});
test('Slow frames degrade gradually, with dwell time and a fixed cap',()=>{
 const auto=new AdaptiveGlyphs();assert.equal(auto.configure(true),true);
 assert.equal(auto.observe(report(60,50,5),2000,true),false);
 assert.equal(auto.observe(report(60),2000,false),false);
 assert.equal(auto.observe(report(60),2000,true),false);
 assert.equal(auto.observe(report(60),2200,true),false);
 assert.equal(auto.observe(report(60),4000,true),true);assert.equal(auto.scale,1.2);
 for(let now=6000;now<=36000;now+=2000)auto.observe(report(60),now,true);
 assert.equal(auto.scale,auto.maxScale);
});
test('Fast frames recover detail conservatively without oscillation',()=>{
 const auto=new AdaptiveGlyphs();auto.configure(true);auto.observe(report(60),2000,true);auto.observe(report(60),4000,true);
 assert.equal(auto.scale,1.2);
 assert.equal(auto.observe(report(20,16),6000,true),false);
 assert.equal(auto.observe(report(20,16),8000,true),false);
 assert.equal(auto.observe(report(20,16),10000,true),true);
 assert.equal(auto.scale,1);
 for(let now=12000;now<=20000;now+=2000)auto.observe(report(20,16),now,true);
 assert.equal(auto.scale,1);
});
test('Unknown, paused, and alternating frame data cannot trigger unstable changes',()=>{
 const auto=new AdaptiveGlyphs();auto.configure(true);
 for(let i=0;i<20;i++)assert.equal(auto.observe(report(i%2?55:20),2000+i*2000,true),false);
 assert.equal(auto.scale,1);
 assert.equal(auto.observe(report(50),NaN,true),false);
 assert.equal(auto.observe(report(50),90000,false),false);
});
test('Disabling performance mode immediately restores full requested glyph fidelity',()=>{
 const auto=new AdaptiveGlyphs();auto.configure(true);auto.observe(report(70),2000,true);auto.observe(report(70),4000,true);
 assert.ok(auto.scale>1);assert.equal(auto.configure(false),true);assert.equal(auto.scale,1);
 assert.equal(auto.observe(report(70),8000,true),false);
 assert.equal(auto.configure(false),false);
});
