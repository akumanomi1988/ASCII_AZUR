import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {SCORE_SCENES,SCORE_IDENTITIES,scorePhraseNote,scoreCatalog,getThemeSummary,MASTERING} from '../dist/audio.js';

test('A2: exactly ten original scores cover all current music scenes, each with A/B/CODA',()=>{
 const expected=['title','village','forest','sanctuary','marsh','spire','ossuary','garden','battle','boss'];
 assert.deepEqual([...SCORE_SCENES],expected);
 const all=scoreCatalog();
 assert.equal(all.length,10);
 assert.equal(new Set(all.map(s=>s.signature)).size,10,'ten genuinely distinct authored B melodies');
 for(const entry of all){
  assert.equal(entry.steps,128);
  assert.deepEqual(entry.sections,['A','B','CODA']);
  assert.equal(typeof SCORE_IDENTITIES[entry.scene],'string');
  assert.equal(entry.bpm,getThemeSummary(entry.scene).bpm);
  const seen=new Set();let audible=0;
  for(let step=0;step<128;step++){
   const note=scorePhraseNote(entry.scene,step);
   assert.ok(note.bpm>=50&&note.bpm<=145);
   assert.equal(note.index,step%16);
   assert.ok(Number.isInteger(note.lead)||note.lead===null);
   assert.ok(Number.isInteger(note.bass)||note.bass===null);
   assert.equal(note.chord.length,3);
   assert.ok(note.mode.every(v=>Number.isFinite(v)));
   if(note.lead!==null)audible++;
   seen.add(note.section);
  }
  assert.deepEqual([...seen],['A','B','CODA']);
  assert.ok(audible>50,entry.scene+' must have a playable composed melody');
  assert.notDeepEqual(Array.from({length:16},(_,i)=>scorePhraseNote(entry.scene,i).lead),
   Array.from({length:16},(_,i)=>scorePhraseNote(entry.scene,64+i).lead));
  assert.notDeepEqual(Array.from({length:4},(_,i)=>scorePhraseNote(entry.scene,108+i).lead),
   Array.from({length:4},(_,i)=>scorePhraseNote(entry.scene,124+i).lead),
   entry.scene+' must have a real coda');
 }
});
test('A2: score state derives only from scene+step and returned notes are immutable copies',()=>{
 for(const scene of SCORE_SCENES){
  for(const step of [0,31,64,96,111,124,127]){
   assert.deepEqual(scorePhraseNote(scene,step),scorePhraseNote(scene,step+128),'8-phrase loop');
   const a=scorePhraseNote(scene,step);const b=scorePhraseNote(scene,step);
   a.chord[0]=999;a.mode[0]=999;
   assert.notDeepEqual(a,b);
   assert.notEqual(scorePhraseNote(scene,step).chord[0],999);
  }
 }
 assert.ok(MASTERING.outputGain>0&&MASTERING.outputGain<1);
});
test('A2: each complete offline master is a valid measured unique 16-bit WAV with safe level',()=>{
 const dir=resolve('artifacts/score-master'),path=resolve(dir,'manifest.json');
 assert.ok(existsSync(path),'run npm run score:master before the Node acceptance suite');
 const manifest=JSON.parse(readFileSync(path,'utf8'));
 assert.equal(manifest.schema,'ascii-azur-mastered-score-v1');
 assert.equal(manifest.original,true);
 assert.equal(manifest.references.length,10);
 const fingerprints=new Set();
 for(const master of manifest.references){
  assert.ok(SCORE_SCENES.includes(master.scene));
  assert.equal(master.phrases,8);
  assert.deepEqual(master.sections,['A','B','CODA']);
  assert.equal(master.clippedSamples,0);
  assert.ok(master.rmsDbfs>=-31&&master.rmsDbfs<=-16,master.scene+' RMS: '+master.rmsDbfs);
  assert.ok(master.fourXInterpolatedPeakDbfs<=-1.5);
  assert.ok(Math.abs(master.dcMean)<.006);
  assert.ok(master.durationSeconds>15);
  assert.equal(master.channels,1);assert.equal(master.sampleRate,16000);
  const data=readFileSync(resolve(dir,master.scene+'.wav'));
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WAVE');
  assert.equal(data.readUInt16LE(20),1,'uncompressed PCM');
  assert.equal(data.readUInt16LE(22),1);
  assert.equal(data.readUInt16LE(34),16);
  assert.equal(data.length,master.bytes);
  fingerprints.add(master.sha256);
 }
 assert.equal(fingerprints.size,10);
});
