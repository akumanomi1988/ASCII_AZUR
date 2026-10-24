import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound,AUDIO_LIMITS} from '../dist/audio.js';

// Audio time, suspended promises and scheduled graph ownership are observable.
// Wall-clock sleeps cannot prove browser audio lifecycle correctness.
function engine({deferred=false}={}){
 const original={AudioContext:globalThis.AudioContext,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
 const timers=new Map(),nodes=[],operations=[];let nextTimer=1,context;
 class Param{
  value=1;events=[];
  record(method,value,at){assert.ok(Number.isFinite(value));assert.ok(Number.isFinite(at));this.events.push({method,value,at});}
  setValueAtTime(v,t){this.record('set',v,t);}
  linearRampToValueAtTime(v,t){this.record('ramp',v,t);}
  exponentialRampToValueAtTime(v,t){assert.ok(v>0);this.record('exponential',v,t);}
  setTargetAtTime(v,t,c){assert.ok(c>0);this.record('target',v,t);}
  cancelScheduledValues(t){this.events=this.events.filter(e=>e.at<t);}
  cancelAndHoldAtTime(t){this.cancelScheduledValues(t);}
 }
 class Node{
  connections=new Set();disconnected=false;stopped=false;
  constructor(kind){this.kind=kind;nodes.push(this);for(const p of ['gain','frequency','Q','delayTime','threshold','knee','ratio','attack','release'])this[p]=new Param();}
  connect(to){this.connections.add(to);return to;}
  disconnect(){this.disconnected=true;this.connections.clear();}
  start(at=0){this.startedAt=at;}
  stop(at=0){this.stopped=true;this.stopAt=at;}
 }
 class Context{
  state='running';currentTime=1;sampleRate=1000;destination=new Node('destination');
  constructor(){context=this;}
  createGain(){return new Node('gain');}createBiquadFilter(){return new Node('filter');}
  createOscillator(){return new Node('oscillator');}createBufferSource(){return new Node('buffer');}
  createDelay(){return new Node('delay');}createDynamicsCompressor(){return new Node('compressor');}
  createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)};}
  transition(to){return new Promise(resolve=>{const run=()=>{this.state=to;this.onstatechange?.();resolve();};if(deferred)operations.push(run);else run();});}
  suspend(){return this.transition('suspended');}resume(){return this.transition('running');}
  close(){this.state='closed';return Promise.resolve();}
 }
 globalThis.AudioContext=Context;
 globalThis.setInterval=fn=>{const id=nextTimer++;timers.set(id,fn);return id;};
 globalThis.clearInterval=id=>timers.delete(id);
 const sound=new Sound();
 return {sound,nodes,timers,operations,get ctx(){return context;},
  advance(seconds){context.currentTime+=seconds;for(const fn of timers.values())fn();},
  async settle(){while(operations.length){operations.shift()();await Promise.resolve();}await Promise.resolve();},
  cleanup(){sound.dispose();Object.assign(globalThis,original);}};
}

test('audio lifecycle: hidden input cannot allocate or resume audio; dispose is terminal',async()=>{
 const e=engine();try{
  e.sound.pause();e.sound.unlock();e.sound.hit();assert.equal(e.ctx,undefined);
  e.sound.resume();e.sound.unlock();assert.equal(e.sound.diagnostics().scheduling,true);
  e.sound.dispose();e.sound.dispose();e.sound.resume();e.sound.unlock();e.sound.hit();
  assert.equal(e.ctx.state,'closed');assert.equal(e.timers.size,0);
  assert.equal(e.sound.diagnostics().musicVoices,0);assert.equal(e.sound.diagnostics().effectVoices,0);
  assert.equal(e.sound.diagnostics().disposed,true);
 }finally{e.cleanup();}
});

test('audio lifecycle: mute and zero music stop scheduler; effects remain independent',async()=>{
 const e=engine();try{
  e.sound.unlock();assert.equal(e.timers.size,1);
  e.sound.setMusicVolume(0);assert.equal(e.timers.size,0);
  e.sound.hit();assert.equal(e.sound.diagnostics().effectVoices,2);
  e.sound.setMusicVolume(.4);assert.equal(e.timers.size,1);
  e.sound.setEnabled(false);await e.settle();
  assert.equal(e.ctx.state,'suspended');assert.equal(e.timers.size,0);
  e.sound.setEnabled(true);await e.settle();assert.equal(e.ctx.state,'running');assert.equal(e.timers.size,1);
  e.sound.pause();await e.settle();e.sound.setEnabled(false);e.sound.setEnabled(true);await e.settle();
  assert.equal(e.ctx.state,'suspended','mute button must not resume a hidden page');
  e.sound.resume();await e.settle();assert.equal(e.timers.size,1);
 }finally{e.cleanup();}
});

test('audio lifecycle: serialize rapid hide/show and mute/unmute browser promises',async()=>{
 const e=engine({deferred:true});try{
  e.sound.unlock();e.sound.pause();e.sound.resume();e.sound.setEnabled(false);e.sound.setEnabled(true);
  assert.equal(e.operations.length,1,'only one browser state operation in flight');
  await e.settle();assert.equal(e.ctx.state,'running');assert.equal(e.timers.size,1);
  e.sound.pause();e.sound.resume();e.sound.pause();await e.settle();
  assert.equal(e.ctx.state,'suspended');assert.equal(e.timers.size,0);
  e.sound.resume();e.sound.dispose();await e.settle();assert.equal(e.sound.diagnostics().scheduling,false);
 }finally{e.cleanup();}
});

test('audio lifecycle: context interruption stops timers and gesture restores scheduling',async()=>{
 const e=engine();try{
  e.sound.unlock();e.ctx.state='interrupted';e.ctx.onstatechange();assert.equal(e.timers.size,0);
  e.sound.unlock();await e.settle();assert.equal(e.ctx.state,'running');assert.equal(e.timers.size,1);
 }finally{e.cleanup();}
});

test('score continuity: repeated combat returns to exploration phrase instead of restarting the theme',()=>{
 const e=engine();try{
  e.sound.setScene('forest');e.sound.unlock();
  for(let i=0;i<20;i++)e.advance(.5);
  const step=e.sound.diagnostics().step;assert.ok(step>16);
  e.sound.setScene('battle');assert.ok(e.sound.diagnostics().step<step);
  e.sound.setScene('forest');assert.ok(e.sound.diagnostics().step>=step);
  const continued=e.sound.diagnostics().step;e.sound.setScene('forest');assert.equal(e.sound.diagnostics().step,continued);
  e.sound.setScene('boss');e.sound.setScene('garden');assert.ok(e.sound.diagnostics().step<step);
 }finally{e.cleanup();}
});

test('audio stress: 2000 scene and effect bursts keep voices and crossfade graphs bounded',()=>{
 const e=engine();try{
  e.sound.unlock();const scenes=['village','forest','sanctuary','marsh','spire','ossuary','garden','battle','boss','title'];
  for(let i=0;i<2000;i++){
   e.sound.setScene(scenes[i%scenes.length]);e.sound.evolve();e.sound.hitElement('Éter');
   const d=e.sound.diagnostics();
   assert.ok(d.retiringBuses<=AUDIO_LIMITS.retiringBuses);
   assert.ok(d.musicVoices<=AUDIO_LIMITS.musicVoices);assert.ok(d.effectVoices<=AUDIO_LIMITS.effectVoices);
   if(i%5===0)e.advance(.1);
  }
  e.advance(10);
  assert.equal(e.sound.diagnostics().retiringBuses,0);assert.equal(e.sound.diagnostics().effectVoices,0);
  // Every retired music filter must be disconnected, including rapid scene switches.
  const live=new Set();for(const node of e.nodes)for(const target of node.connections)live.add(target);
  const filters=e.nodes.filter(n=>n.kind==='filter'&&n.frequency.events.some(v=>v.value===650||v.value===1100));
  assert.ok(filters.length>100);assert.ok(filters.filter(n=>!n.disconnected).length<=AUDIO_LIMITS.musicVoices);
  e.sound.dispose();assert.equal(e.timers.size,0);
  assert.ok(e.nodes.filter(n=>n.kind==='oscillator').every(n=>n.disconnected));
 }finally{e.cleanup();}
});

test('audio mixing: overlapping effects share one duck envelope and restore the music without changing user volume',()=>{
 const e=engine();try{
  e.sound.unlock();e.sound.setMusicVolume(.7);e.sound.evolve();
  const duck=e.nodes.find(n=>n.gain.events.some(x=>x.method==='target'&&x.value===.68));
  assert.ok(duck);const recoveries=duck.gain.events.filter(x=>x.method==='target'&&x.value===1);
  assert.equal(recoveries.length,1);assert.ok(recoveries[0].at>=e.ctx.currentTime+1);
  assert.equal(e.sound.getMusicVolume(),.7);
  assert.ok(e.nodes.filter(n=>n.kind==='delay').length===1,'one shared spatial effect');
 }finally{e.cleanup();}
});

test('audio safety: invalid settings and effect parameters never reach Web Audio',()=>{
 const e=engine();try{
  e.sound.setMusicVolume(NaN);e.sound.setEffectsVolume(Infinity);
  assert.equal(e.sound.getMusicVolume(),0);assert.equal(e.sound.getEffectsVolume(),0);
  e.sound.setMusicVolume(.4);e.sound.setEffectsVolume(.5);e.sound.unlock();
  const before=e.sound.diagnostics().effectVoices;
  e.sound.tone(NaN);e.sound.tone(440,Infinity);e.sound.tone(440,.2,'sine',NaN);
  assert.equal(e.sound.diagnostics().effectVoices,before);
  e.sound.tone(1,-100,'sine',400,999);assert.equal(e.sound.diagnostics().effectVoices,before+1);
 }finally{e.cleanup();}
});
