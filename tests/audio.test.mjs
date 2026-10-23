import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound,midiFrequency,degreeSemitone,getThemeSummary,themeForZone,scoreMix,scoreArrangement,MASTERING} from '../dist/audio.js';

test('procedural score: six distinct cue profiles',()=>{
  const names=['title','village','forest','sanctuary','battle','boss'];
  assert.equal(names.length,6);
  for(const scene of names){const cue=getThemeSummary(scene);assert.equal(cue.steps,16);assert.ok(cue.bpm>40 && cue.bpm<180);}
  assert.ok(getThemeSummary('boss').bpm>getThemeSummary('forest').bpm);
});
test('audio notes: correct pitch and negative scale degrees',()=>{
  assert.equal(midiFrequency(69),440);
  assert.equal(degreeSemitone(-1,[0,2,3,5,7,8,10]),-2);
  assert.equal(degreeSemitone(7,[0,2,3,5,7,8,10]),12);
  assert.equal(themeForZone('forest'),'forest');
});
test('audio settings: clamp levels and change scenes without a browser AudioContext',()=>{
  const a=new Sound();a.setMusicVolume(2);a.setEffectsVolume(-2);
  assert.equal(a.getMusicVolume(),1);assert.equal(a.getEffectsVolume(),0);
  a.setEnabled(false);assert.equal(a.isEnabled,false);
  a.setScene('battle');assert.equal(a.musicScene,'battle');
  a.setScene('boss');assert.equal(a.musicScene,'boss');
  a.dispose();
});
test('audio synthesis: audio graph starts after unlock and switches themes',()=>{
  let started=0,compressors=0,echoes=0;
  class Parameter {setValueAtTime(){} linearRampToValueAtTime(){} exponentialRampToValueAtTime(){} setTargetAtTime(){} cancelScheduledValues(){} get value(){return 1;}set value(_){} }
  class Node {constructor(){this.gain=new Parameter();this.frequency=new Parameter();this.Q=new Parameter();this.threshold=new Parameter();this.knee=new Parameter();this.ratio=new Parameter();this.attack=new Parameter();this.release=new Parameter();this.delayTime=new Parameter();} connect(x){return x;} disconnect(){}start(){started++;}stop(){}set type(_){}set onended(_){} }
  class FakeContext {state='running';currentTime=1;sampleRate=24000;destination=new Node();createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}createBufferSource(){return new Node();}createGain(){return new Node();}createOscillator(){return new Node();}createBiquadFilter(){return new Node();}createDynamicsCompressor(){compressors++;return new Node();}createDelay(){echoes++;return new Node();}resume(){return Promise.resolve();}close(){return Promise.resolve();}}
  const orig=globalThis.AudioContext;globalThis.AudioContext=FakeContext;
  try{const a=new Sound();a.unlock();assert.ok(started>0,'music notes actually scheduled');
    assert.equal(compressors,1,'music and effects pass through one mastering dynamics stage');
    assert.equal(echoes,1,'shared spatial tail is allocated only once');
    const n=started;a.setScene('boss');assert.ok(started>n,'new theme should schedule notes');
    a.setEnabled(false);assert.equal(a.isEnabled,false);a.dispose();
  }finally{globalThis.AudioContext=orig;}
});
test('elemental combat audio synthesizes distinct two-tone profiles',async()=>{
 const {Sound}=await import('../dist/audio.js');const sound=new Sound();
 const notes=[];sound.tone=(...args)=>notes.push(args);
 for(const e of ['Ceniza','Bruma','Raíz','Éter'])sound.hitElement(e);
 assert.equal(notes.length,8);
 assert.equal(new Set(notes.map(x=>x[0])).size,8);
});

test('procedural score: eight-phrase arc supplies deterministic harmonic variation',()=>{
  const arc=Array.from({length:8},(_,phrase)=>scoreArrangement('forest',phrase,.2));
  assert.equal(new Set(arc.map(x=>JSON.stringify(x))).size,8);
  assert.deepEqual(scoreArrangement('forest',8,.2),arc[0]);
  assert.deepEqual(scoreArrangement('forest',-1,.2),arc[7]);
  assert.deepEqual(scoreArrangement('forest',Number.NaN,.2),arc[0]);
  assert.ok(arc.some(x=>x.leadRegister===12)&&arc.some(x=>x.leadRegister===-12));
  assert.ok(arc.some(x=>x.counterVoice)&&arc.some(x=>!x.counterVoice));
  assert.equal(scoreArrangement('boss',4,.8).percussionFill,true);
  assert.equal(scoreArrangement('boss',4,.2).percussionFill,false);
  assert.equal(scoreArrangement('forest',4,.9).percussionFill,false);
  assert.ok(MASTERING.outputGain<1&&MASTERING.highpassHz>=20&&MASTERING.ratio>=4);
});
test('adaptive score: danger raises combat rhythm while keeping gains bounded',()=>{
  const calm=scoreMix('battle',0),danger=scoreMix('battle',1);
  assert.ok(danger.lead>calm.lead);
  assert.ok(danger.bass>calm.bass);
  assert.ok(danger.percussion>calm.percussion);
  assert.ok(danger.pad<calm.pad);
  assert.ok(danger.ambient<calm.ambient);
  assert.deepEqual(scoreMix('boss',99),scoreMix('boss',1));
  assert.deepEqual(scoreMix('forest',-99),scoreMix('forest',0));
  assert.deepEqual(scoreMix('title',Number.NaN),scoreMix('title',0));
  for(const scene of ['title','village','forest','sanctuary','marsh','spire','ossuary','garden','battle','boss']){
    for(const value of [0,.25,.5,.75,1]){
      for(const gain of Object.values(scoreMix(scene,value)))assert.ok(Number.isFinite(gain)&&gain>=0&&gain<2);
    }
  }
});
test('adaptive score: intensity state survives without AudioContext and resets on exploration',()=>{
  const s=new Sound();s.setScene('boss');assert.equal(s.getIntensity(),.65);
  s.setIntensity(2);assert.equal(s.getIntensity(),1);
  s.setIntensity(-1);assert.equal(s.getIntensity(),0);
  s.setIntensity(Number.NaN);assert.equal(s.getIntensity(),0);
  s.setScene('forest');assert.equal(s.getIntensity(),0);
  s.dispose();
});
