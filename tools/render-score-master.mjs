#!/usr/bin/env node
/**
 * Render the same authored note/phrase projection as Sound.tick into deterministic
 * original, shareable WAV listening references. Every file is mastered against a
 * measured RMS, 4x-interpolated sample peak, DC and clipping envelope.
 *
 * This offline oscillator approximation is NOT a substitute for Web Audio device
 * testing: the shipped interactive score uses its own compressor/ambience/echo bus.
 * No third-party recordings, codecs, packages, or network calls.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {SCORE_SCENES,SCORE_IDENTITIES,scorePhraseNote,scoreArrangement,scoreMix,midiFrequency,degreeSemitone,MASTERING} from '../dist/audio.js';

const SR=16000,STEPS=128,TAIL=.9;
const OUT=resolve('artifacts/score-master');
const rmsDb=rms=>20*Math.log10(Math.max(1e-12,rms));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function synthesize(scene) {
 const first=scorePhraseNote(scene,0),stepDuration=30/first.bpm;
 const duration=STEPS*stepDuration+TAIL,samples=new Float64Array(Math.ceil(duration*SR));
 const combat=scene==='boss'||scene==='battle';
 const texture=scene==='sanctuary'||scene==='spire'||scene==='garden'?'void':scene==='battle'||scene==='boss'?'percussion':scene==='village'?'warm':'mist';
 const energy=scene==='boss'?.65:scene==='battle'?.35:0;
 const mix=scoreMix(scene,energy);
 const TAU=Math.PI*2;
 function sound(midi,start,duration,kind,gain) {
  const startIndex=Math.max(0,Math.round(start*SR));
  const count=Math.min(samples.length-startIndex,Math.floor((duration+.17)*SR));
  if(count<=0)return;
  const freq=midiFrequency(midi),angle=TAU*freq/SR;
  const attack=kind==='pad'?.12:kind==='bass'?.012:.009;
  const release=kind==='pad'?.25:kind==='bass'?.12:.15;
  const decay=kind==='perc'?.022:duration;
  for(let i=0;i<count;i++){
   const t=i/SR;
   if(t>duration+release)break;
   const envelope=Math.min(1,t/attack)*Math.min(1,Math.max(0,(duration+release-t)/release));
   const phase=angle*i;
   let signal=kind==='bass'?(Math.sin(phase)-Math.sin(3*phase)/9+Math.sin(5*phase)/25)*.85:
    kind==='pad'?.8*Math.sin(phase)+.20*Math.sin(2*phase):
    kind==='bell'?.78*Math.sin(phase)+.22*Math.sin(3*phase):
    kind==='perc'?Math.sin(phase)*Math.exp(-t/decay):
    Math.sin(phase)+.15*Math.sin(2*phase);
   if(kind==='perc')signal*=.8;
   samples[startIndex+i]+=signal*gain*envelope;
  }
 }
 for(let step=0;step<STEPS;step++){
  const note=scorePhraseNote(scene,step),idx=note.index,at=step*stepDuration,chord=note.chord;
  const arrangement=scoreArrangement(scene,note.phrase,energy);
  if(note.lead!==null)sound(note.root+24+arrangement.leadRegister+degreeSemitone(note.lead,note.mode),
   at,stepDuration*(scene==='battle'?.83:1.55),'lead',(combat?.045:.032)*mix.lead*arrangement.leadGain);
  if(note.bass!==null)sound(note.root-12+degreeSemitone(note.bass,note.mode),at,stepDuration*3.5,'bass',.048*mix.bass);
  if(idx%4===0)for(const d of chord)
   sound(note.root+12+degreeSemitone(d,note.mode),at,stepDuration*3.55,'pad',(texture==='void'?.018:.010)*mix.pad);
  if(combat&&idx%2===0)sound(note.root-24,at,.035,'perc',.014*mix.percussion);
  if(combat&&energy>=.55&&idx%4===2)
   sound(note.root+12+degreeSemitone(chord[2],note.mode),at,stepDuration*.75,'bell',.012*energy);
  if(arrangement.counterVoice&&idx===10)
   sound(note.root+24+degreeSemitone(chord[arrangement.counterDegree===4?2:1],note.mode),at,stepDuration*2,'bell',.009*mix.lead);
  if(arrangement.percussionFill&&idx===15)sound(note.root-12,at,stepDuration*.22,'perc',.011*mix.percussion);
  if(texture==='mist'&&idx%8===6)sound(note.root+36+degreeSemitone(chord[1],note.mode),at,stepDuration*2.1,'bell',.017);
 }
 // Shared spatial tail, analogous in intent to the runtime's 210 ms echo.
 const echo=Math.round(.21*SR);
 for(let i=echo;i<samples.length;i++)samples[i]+=.09*samples[i-echo];
 // DC-block and mild dynamic gain reduction before final normalization.
 let prev=0,highpass=0,env=0;const attack=Math.exp(-1/(SR*.006)),release=Math.exp(-1/(SR*.16));
 const threshold=.17,ratio=5;
 for(let i=0;i<samples.length;i++){
  const input=samples[i],filtered=input-prev+.99*highpass;prev=input;highpass=filtered;
  const abs=Math.abs(filtered);env=(abs>env?attack:release)*env+(1-(abs>env?attack:release))*abs;
  const above=Math.max(0,env-threshold);
  const correction=env>0?(threshold+above/ratio)/env:1;
  samples[i]=filtered*(env>threshold?correction:1)*MASTERING.outputGain;
 }
 // One shared mastering target. Peak safety takes precedence over RMS.
 let sum=0,peak=0,dc=0;
 for(const v of samples){sum+=v*v;peak=Math.max(peak,Math.abs(v));dc+=v;}
 const rms=Math.sqrt(sum/samples.length);
 if(!Number.isFinite(rms)||rms<.001)throw Error('Silent or invalid mix: '+scene);
 const factor=Math.min(.082/rms,.78/Math.max(.00001,peak));
 let finalSum=0,finalPeak=0,finalDc=0,clipped=0,prevOut=0;
 const pcm=Buffer.alloc(44+samples.length*2);
 pcm.write('RIFF',0);pcm.writeUInt32LE(36+samples.length*2,4);pcm.write('WAVE',8);
 pcm.write('fmt ',12);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);
 pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);
 pcm.write('data',36);pcm.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++){
  const v=samples[i]*factor;
  finalSum+=v*v;finalDc+=v;
  for(let k=0;k<=4;k++){const interpolated=prevOut+(v-prevOut)*k/4;finalPeak=Math.max(finalPeak,Math.abs(interpolated));}
  prevOut=v;
  if(Math.abs(v)>=1)clipped++;
  pcm.writeInt16LE(Math.round(clamp(v,-1,1)*32767),44+i*2);
 }
 const measuredRms=Math.sqrt(finalSum/samples.length);
 const meter={
  scene,title:SCORE_IDENTITIES[scene],sampleRate:SR,channels:1,durationSeconds:Number(duration.toFixed(3)),
  phrases:8,sections:['A','B','CODA'],rmsDbfs:Number(rmsDb(measuredRms).toFixed(2)),
  fourXInterpolatedPeakDbfs:Number(rmsDb(finalPeak).toFixed(2)),dcMean:Number((finalDc/samples.length).toFixed(7)),
  clippedSamples:clipped,sha256:createHash('sha256').update(pcm).digest('hex'),
  bytes:pcm.length
 };
 if(meter.rmsDbfs< -31||meter.rmsDbfs> -16||meter.fourXInterpolatedPeakDbfs> -1.5
    ||Math.abs(meter.dcMean)>.006||clipped>0)throw Error('Unacceptable mastered score: '+JSON.stringify(meter));
 return {pcm,meter};
}
mkdirSync(OUT,{recursive:true});
const references=[];
for(const scene of SCORE_SCENES){
 const {pcm,meter}=synthesize(scene);
 writeFileSync(resolve(OUT,scene+'.wav'),pcm);
 references.push(meter);
 console.log('MASTERED',scene,JSON.stringify({rms:meter.rmsDbfs,peak:meter.fourXInterpolatedPeakDbfs,duration:meter.durationSeconds}));
}
if(new Set(references.map(r=>r.sha256)).size!==SCORE_SCENES.length)throw Error('Duplicate score renders');
const manifest={schema:'ascii-azur-mastered-score-v1',original:true,
 note:'These reproducible offline reference masters share the exact authored 8-phrase score with the interactive Web Audio runtime. The render oscillator/limiter approximates the runtime and is not a device-specific acoustic performance claim. Linear interpolated peaks are not ITU-R BS.1770 true-peak or LUFS measurements.',
 mastering:{targetRmsDbfs:rmsDb(.082),maxSamplePeakDbfs:rmsDb(.78),sourceMastering:MASTERING,masteringTechnology:'DC blocking, attack/release dynamic compression, shared normalization, peak ceiling'},
 references};
writeFileSync(resolve(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('A2_MASTER_ACCEPTANCE',JSON.stringify({scenes:references.length,allUnique:true,allNoClipping:true,totalSeconds:references.reduce((n,r)=>n+r.durationSeconds,0),minRms:Math.min(...references.map(r=>r.rmsDbfs)),maxPeak:Math.max(...references.map(r=>r.fourXInterpolatedPeakDbfs))}));
