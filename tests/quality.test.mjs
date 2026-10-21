import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameMetrics} from '../dist/core/frame-metrics.js';
import {BASE_POSE,validateClip,validateActor,samplePose} from '../dist/actors/animation.js';
test('frame metrics percentile and budgeting are deterministic',()=>{
 const m=new FrameMetrics(20,20);for(let i=1;i<=20;i++)m.add(i);
 const v=m.report();assert.equal(v.samples,20);assert.equal(v.p50Ms,10);assert.equal(v.p95Ms,19);assert.equal(v.p99Ms,20);assert.equal(v.averageMs,10.5);assert.equal(v.overBudget,0);
 m.add(100);assert.equal(m.report().samples,20);assert.equal(m.report().maxMs,100);assert.equal(m.report().overBudget,1);
 m.reset();assert.equal(m.report().samples,0);
});
test('quality stats reject pauses and invalid numeric samples',()=>{
 const m=new FrameMetrics(2,33);m.add(-1);m.add(NaN);m.add(Infinity);m.add(3000);assert.equal(m.report().samples,0);
 m.add(16);m.add(40);m.add(20);assert.equal(m.report().samples,2);assert.equal(m.report().maxMs,40);assert.equal(m.report().overBudget,1);
});
test('animation clip interpolates smooth poses and clamps',()=>{
 const clip={id:'walk',action:'walk',duration:1,loop:false,keyframes:[{time:0,pose:{...BASE_POSE}},{time:1,pose:{...BASE_POSE,x:10,alpha:.5}}]};
 assert.deepEqual(validateClip(clip),[]);assert.equal(samplePose(clip,0).x,0);assert.equal(samplePose(clip,.5).x,5);assert.equal(samplePose(clip,9).x,10);
});
test('animation clip validation rejects broken timeline and actor missing idle',()=>{
 const clip={id:'bad',action:'idle',duration:1,loop:true,keyframes:[{time:.9,pose:{...BASE_POSE}},{time:.3,pose:{...BASE_POSE}}]};
 assert.ok(validateClip(clip).length>0);
 const actor={id:'cindrel',silhouetteId:'c1',family:'quadruped',footAnchor:{x:0,y:0},scale:1,facing:[0,1,2,3],clips:[]};
 assert.ok(validateActor(actor).some(x=>x.includes('idle')));
});
