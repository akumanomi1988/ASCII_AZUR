import test from 'node:test';
import assert from 'node:assert/strict';
import {arrivalMoment,resolutionMoment,storyChronicle} from '../dist/story-presentation.js';
import {Sound} from '../dist/audio.js';

const start=['archivist','zone-forest','zone-sanctuary','arken-vow-restored'];
const marsh=choice=>[...start,'marsh-met-nael','zone-marsh','marsh-choice-'+choice,'marsh-chapter-complete'];
const crown=(m,c)=>[...marsh(m),'zone-spire','crown-met-oriel','crown-nullscribe-fallen','crown-choice-'+c,'crown-trilogy-complete'];
const sea=(m,c,s)=>[...crown(m,c),'afterlight-ossuary-choice-'+s,'afterlight-ossuary-complete'];
const garden=(m,c,s,g)=>[...sea(m,c,s),'afterlight-garden-choice-'+g,'afterlight-garden-complete'];
const state=flags=>({flags,defeatedBoss:true,dungeonFinished:true});

test('first-visit direction covers all six new regional arrivals without replay or locked-chapter spoilers',()=>{
 const cases=[['forest',[],[]],['sanctuary',['zone-forest'],[]],['marsh',start,start],['spire',marsh('keep'),marsh('keep')],['ossuary',crown('keep','remember'),crown('keep','remember')],['garden',sea('keep','remember','anchor'),sea('keep','remember','anchor')]];
 for(const [zone,visits,flags] of cases){
  const first=arrivalMoment(zone,visits,flags);
  assert.ok(first,zone);assert.equal(first.zone,zone);
  assert.ok(first.eyebrow.length>5&&first.title.length>15&&first.subtitle.length>20);
  assert.equal(arrivalMoment(zone,['zone-'+zone,...visits],flags),null);
 }
 assert.equal(arrivalMoment('village',[],[]),null);
 for(const zone of ['marsh','spire','ossuary','garden'])assert.equal(arrivalMoment(zone,[],[]),null);
});
test('chapter completion title scenes require actual flags, never store transient identity',()=>{
 const ids=['arken-vow-restored','marsh-chapter-complete','crown-trilogy-complete','afterlight-ossuary-complete','afterlight-garden-complete'];
 for(const id of ids){
  assert.equal(resolutionMoment(id,[]),null);
  const scene=resolutionMoment(id,[id]);
  assert.ok(scene);assert.equal(scene.id,id);assert.ok(scene.zone);
 }
 assert.equal(resolutionMoment('malicious-unknown',['malicious-unknown']),null);
});
test('chronicle progressively reveals only unlocked chapters and does not mutate saved flags',()=>{
 const cases=[
  [[],1],
  [start,2],
  [marsh('release'),3],
  [crown('keep','renew'),4],
  [sea('release','remember','release'),5],
  [garden('keep','renew','anchor','sleep'),5]
 ];
 for(const [flags,count] of cases){
  const before=JSON.stringify(flags),entries=storyChronicle(state(flags));
  assert.equal(entries.length,count,JSON.stringify(flags));
  assert.equal(new Set(entries.map(x=>x.id)).size,entries.length);
  for(const entry of entries){assert.ok(entry.title&&entry.summary);assert.ok(entry.passages.length>=1);}
  assert.equal(JSON.stringify(flags),before,'chronicle is read-only');
 }
 assert.equal(storyChronicle({flags:[],defeatedBoss:false,dungeonFinished:false}).length,1);
});
test('all four main endings and all four Afterlight endings retain unique authored consequences',()=>{
 const main=new Set(),afterlight=new Set();
 for(const m of ['keep','release'])for(const c of ['remember','renew']){
  const entries=storyChronicle(state(crown(m,c))),text=entries.map(x=>x.summary+' '+x.passages.join(' ')).join(' ');
  main.add(text);
  assert.equal(entries.filter(x=>x.status==='complete').length,3);
 }
 for(const s of ['anchor','release'])for(const g of ['bloom','sleep']){
  const entries=storyChronicle(state(garden('keep','remember',s,g)));
  afterlight.add(entries.map(x=>x.summary+' '+x.passages.join(' ')).join(' '));
  assert.equal(entries.filter(x=>x.status==='complete').length,5);
 }
 assert.equal(main.size,4);assert.equal(afterlight.size,4);
});
test('chapter audio cadence is bounded, quiet, distinct and uses existing effect voice limiter',()=>{
 const sound=Object.create(Sound.prototype),sequences=new Set();
 for(const kind of ['arrival','memory','oath','reckoning','afterlight']){
  const calls=[];sound.tone=(...args)=>calls.push(args);
  sound.storySting(kind);
  assert.equal(calls.length,4);
  assert.ok(calls.every(([freq,duration,type,volume,delay])=>Number.isFinite(freq)&&freq>=140&&freq<=600&&duration<=.25&&type==='sine'&&volume<=.02&&delay<=.5));
  sequences.add(calls.map(x=>x[0]).join(','));
 }
 assert.equal(sequences.size,5);
});
