import test from 'node:test';
import assert from 'node:assert/strict';
import {EnduranceLab,FRAME_BINS_MS} from '../dist/core/endurance-lab.js';

test('opt-in endurance sampling is inactive by default, starts empty and can stop',()=>{
 const lab=new EnduranceLab();
 lab.sample(16,'explore',true,920,430);
 assert.equal(lab.report().totalFrames,0);
 lab.start();
 lab.sample(16,'explore',true,920,430);
 lab.sample(48,'battle',true,920,430);
 assert.equal(lab.report().totalFrames,2);
 assert.equal(lab.report().phases.battle.slowFrames,1);
 lab.stop();
 lab.sample(13,'battle',true,920,430);
 assert.equal(lab.report().totalFrames,2);
 assert.equal(lab.report().status,'stopped');
 lab.start();
 assert.equal(lab.report().totalFrames,0);
});
test('endurance phase attribution and accurate bounded histogram upper percentiles',()=>{
 const lab=new EnduranceLab();lab.start();
 for(let i=0;i<80;i++)lab.sample(16,'explore',true,915,412);
 for(let i=0;i<18;i++)lab.sample(35,'explore',true,915,412);
 for(let i=0;i<2;i++)lab.sample(115,'explore',true,915,412);
 lab.sample(23,'battle',true,915,412);lab.sample(36,'crypt',true,915,412);lab.sample(34,'menu',true,915,412);
 const r=lab.report();
 assert.equal(r.totalFrames,103);
 assert.equal(r.phases.explore.frames,100);
 assert.equal(r.phases.explore.slowFrames,20);
 assert.equal(r.phases.explore.slowPercent,20);
 assert.equal(r.phases.explore.p95UpperBoundMs,50);
 assert.ok(r.phases.explore.averageFps>40);
 assert.equal(r.phases.battle.p95UpperBoundMs,25);
 assert.equal(r.phases.crypt.p95UpperBoundMs,50);
 assert.equal(r.phases.menu.p95UpperBoundMs,34);
 assert.ok(r.sampledSeconds>2&&r.sampledSeconds<3);
});
test('hidden, suspended, invalid and missing-viewport intervals never become apparent FPS',()=>{
 const lab=new EnduranceLab();lab.start();
 for(const [ms,visible,w,h] of [[16,false,600,400],[2200,true,600,400],[-4,true,600,400],[NaN,true,600,400],[16,true,0,400],[16,true,600,0]]){
  lab.sample(ms,'explore',visible,w,h);
 }
 let report=lab.report();
 assert.equal(report.totalFrames,0);assert.equal(report.ignoredFrames,6);
 assert.equal(report.phases.explore.averageFps,0);
 assert.equal(report.phases.explore.p95UpperBoundMs,0);
 lab.sample(25,'explore',true,600,400);
 report=lab.report();
 assert.equal(report.totalFrames,1);assert.equal(report.phases.explore.p95UpperBoundMs,25);
});
test('orientation/viewport evidence identifies changes without device fingerprints',()=>{
 const lab=new EnduranceLab();lab.start();
 for(let i=0;i<8;i++)lab.sample(16,'explore',true,915,412);
 for(let i=0;i<6;i++)lab.sample(32,'menu',true,412,915);
 for(let i=0;i<2;i++)lab.sample(16,'battle',true,915,412);
 const report=lab.report();
 assert.equal(report.orientation,'landscape');assert.equal(report.orientationChanges,2);
 assert.deepEqual(report.orientationFrames,{portrait:6,landscape:10});
 assert.deepEqual(report.viewport,{minWidth:412,maxWidth:915,minHeight:412,maxHeight:915});
 assert.equal(report.collection,'opt-in-visible-rAF');
 assert.ok(!JSON.stringify(report).includes('userAgent'));
});
test('long sessions remain bounded and produce deterministic reports across 180,000 frames',()=>{
 const a=new EnduranceLab(),b=new EnduranceLab();a.start();b.start();
 for(let i=0;i<180000;i++){
  const phase=['explore','battle','crypt','menu'][i%4],ms=(i%31===0)?52:16.4;
  a.sample(ms,phase,true,915,412);
  b.sample(ms,phase,true,915,412);
 }
 const x=a.report(),y=b.report();
 assert.deepEqual(x,y);
 assert.equal(x.totalFrames,180000);
 assert.ok(x.phases.battle.p95UpperBoundMs<=34);
 assert.equal(FRAME_BINS_MS.length,10);
 assert.equal(a.report().totalFrames,180000);
 a.stop();a.reset();assert.equal(a.report().totalFrames,0);
});

test('opt-in end-combat jank records synchronous work plus only the next 30 valid rAF frames',()=>{
 const lab=new EnduranceLab();lab.noteTransition('victory',45);
 assert.equal(lab.report().transitions.victory.events,0);
 lab.start();lab.noteTransition('victory',45);
 for(let i=0;i<40;i++)lab.sample(i===0?125:16,'explore',true,915,412);
 assert.deepEqual(lab.report().transitions.victory,{events:1,maxWorkMs:45,slowWorkEvents:1,frames:30,slowFrames:1,maxFrameMs:125});
 lab.noteTransition('capture',4);lab.sample(41,'menu',false,915,412);lab.sample(41,'explore',true,915,412);
 assert.equal(lab.report().transitions.capture.frames,1);
 lab.stop();lab.noteTransition('defeat',80);assert.equal(lab.report().transitions.defeat.events,0);
 lab.reset();assert.equal(lab.report().transitions.victory.events,0);
});
