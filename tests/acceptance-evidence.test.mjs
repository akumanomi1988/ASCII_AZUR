import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {blankEvidence,evaluateEvidence,OPEN_GATES,QUALITY_DOMAINS} from '../tools/acceptance-evidence.mjs';

const SHA='a'.repeat(40),OTHER='b'.repeat(40);
const base=()=>({...blankEvidence(SHA),releaseVersion:'0.55.0'});
const signoff=(gates)=>Object.fromEntries(gates.map(k=>[k,{approved:true,reviewerCode:'external-qa'}]));
function complete(){
 const e=base();
 e.publishedSourceCommit=SHA;
 e.publicBoot={observed:true,sourceCommit:SHA,url:'https://akumanomi1988.github.io/ASCII_AZUR/'};
 e.seedCoverage={savedSeeds:200};
 e.device={sourceCommit:SHA,physical:true,model:'Actual low-end device',android:'Android 14',browser:'Chrome',profiler:'On-device profiler',
  sessionMinutes:35,exploreMinutes:11,combatCryptMinutes:12,mixedMinutes:10,sustainedFps:30,
  batteryStart:90,batteryEnd:79,thermalStartC:30,thermalEndC:36,thermalReviewed:true,batteryReviewed:true,
  warmRepeat:true,canvas2d:true,webgl2:true,touchControls:true,rotation:true,fullscreen:true,
  offlineRecovery:true,saveResume:true,multiTab:true};
 e.sessions=[
  ...Array.from({length:20},(_,i)=>({id:'combat-'+i,category:'combat',observerCode:'observer-'+(i%4),independent:true,completed:true,
   sourceCommit:SHA,starter:['cindrel','velaria','thorne'][i%3]})),
  {id:'navigation-1',category:'navigation',observerCode:'n',independent:true,completed:true,sourceCommit:SHA,physical:true,mobile:true},
  {id:'narrative-1',category:'narrative',observerCode:'n',independent:true,completed:true,sourceCommit:SHA},
  {id:'pacing-1',category:'pacing',observerCode:'n',independent:true,completed:true,sourceCommit:SHA},
  {id:'usability-m',category:'usability',observerCode:'m',independent:true,completed:true,sourceCommit:SHA,mobile:true},
  {id:'usability-d',category:'usability',observerCode:'d',independent:true,completed:true,sourceCommit:SHA,mobile:false}
 ];
 e.reviews={visual:true,mastering:true,mixing:true,audio:true};
 e.ratings=QUALITY_DOMAINS.map(domain=>({domain,score:4.5,independent:true}));
 e.signoffs=signoff(OPEN_GATES);
 return e;
}
test('blank template never reports acceptance or readiness',()=>{
 const r=evaluateEvidence(base(),{expectedSource:SHA});
 assert.equal(r.valid,true);assert.equal(r.readinessCount,0);
 assert.equal(r.acceptedMilestonesByThisTool,0);
 assert.equal(Object.values(r.gates).every(x=>x.status==='OPEN'),true);
});
test('complete declared evidence only becomes review-ready, never accepted',()=>{
 const r=evaluateEvidence(complete(),{expectedSource:SHA});
 assert.equal(r.valid,true);assert.equal(r.readinessCount,12);
 assert.equal(r.gates.Q4.status,'EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION');
 assert.equal(r.acceptedMilestonesByThisTool,0);
 assert.equal(r.quality.mean,4.5);
 assert.equal(r.publicBootProvenanceMatched,true);
});
test('exact release source mismatch rejects evidence before gate evaluation',()=>{
 const r=evaluateEvidence(complete(),{expectedSource:OTHER});
 assert.equal(r.valid,false);assert.match(r.errors.join(' '),/source SHA mismatch/);
 assert.equal(r.gates.C4.status,'OPEN');
});
test('published source mismatch prevents Q4 even with claimed passing physical sessions',()=>{
 const e=complete();e.publishedSourceCommit=OTHER;
 const r=evaluateEvidence(e);assert.equal(r.valid,true);
 assert.equal(r.gates.Q4.status,'OPEN');assert.equal(r.publicBootProvenanceMatched,false);
});
test('simulated browser performance cannot satisfy physical Android gates',()=>{
 const e=complete();e.device.physical=false;
 const r=evaluateEvidence(e);
 assert.equal(r.valid,false);
 assert.equal(r.gates.G4.status,'OPEN');
});
test('30-minute gate requires adequate phase duration and independent telemetry',()=>{
 const e=complete();e.device.combatCryptMinutes=9;
 assert.equal(evaluateEvidence(e).gates.G4.status,'OPEN');
 e.device.combatCryptMinutes=12;e.device.profiler='';
 assert.equal(evaluateEvidence(e).gates.G4.status,'OPEN');
 e.device.profiler='On-device profiler';e.device.thermalReviewed=false;
 assert.equal(evaluateEvidence(e).gates.G4.status,'OPEN');
});
test('combat requires 20 independent complete observations and starter diversity',()=>{
 const e=complete();e.sessions=e.sessions.filter(s=>s.id!=='combat-0');
 assert.equal(evaluateEvidence(e).gates.C4.status,'OPEN');
 e.sessions.push({...e.sessions.find(s=>s.id==='combat-1'),id:'combat-extra',independent:false});
 assert.equal(evaluateEvidence(e).gates.C4.status,'OPEN');
 e.sessions.find(s=>s.id==='combat-extra').independent=true;
 assert.equal(evaluateEvidence(e).gates.C4.status,'EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION');
 for(const s of e.sessions)if(s.category==='combat')s.starter='cindrel';
 assert.equal(evaluateEvidence(e).gates.C4.status,'OPEN');
});
test('wrong-source observations and non-physical mobile walkthroughs do not count',()=>{
 const e=complete();for(const s of e.sessions)s.sourceCommit=OTHER;
 const r=evaluateEvidence(e);
 assert.equal(r.gates.C4.status,'OPEN');assert.equal(r.gates.W4.status,'OPEN');
 e.sessions.find(s=>s.id==='navigation-1').sourceCommit=SHA;
 e.sessions.find(s=>s.id==='navigation-1').physical=false;
 assert.equal(evaluateEvidence(e).gates.W4.status,'OPEN');
});
test('open high/critical defects block Q4; medium defects do not automatically close gates',()=>{
 const e=complete();e.defects=[{id:'defect-1',severity:'high',status:'open'}];
 let r=evaluateEvidence(e);assert.equal(r.gates.Q4.status,'OPEN');assert.deepEqual(r.defects.openBlocking,['defect-1']);
 e.defects[0].status='resolved';r=evaluateEvidence(e);
 assert.equal(r.gates.Q4.status,'EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION');
});
test('strict 16-domain quality threshold and scores block Q4',()=>{
 const e=complete();e.ratings[0].score=3.9;
 assert.equal(evaluateEvidence(e).gates.Q4.status,'OPEN');
 e.ratings[0].score=4.0;
 assert.equal(evaluateEvidence(e).gates.Q4.status,'OPEN','mean below 4.5');
 e.ratings[0].score=4.5;
 e.ratings[1].domain=e.ratings[0].domain;
 assert.equal(evaluateEvidence(e).valid,false,'duplicate domain is invalid');
});
test('duplicate ids, malformed metadata, invalid Sha and missing human signoff fail closed',()=>{
 const e=complete();e.sessions.push({...e.sessions[0]});
 assert.equal(evaluateEvidence(e).valid,false);
 e.sessions.pop();e.signoffs.C4.approved=false;
 assert.equal(evaluateEvidence(e).gates.C4.status,'OPEN');
 e.sourceCommit='short';assert.equal(evaluateEvidence(e).valid,false);
});
test('evaluating input is side-effect-free and deterministic',()=>{
 const e=complete(),snapshot=JSON.stringify(e);
 const a=evaluateEvidence(e),b=evaluateEvidence(e);
 assert.deepEqual(a,b);assert.equal(JSON.stringify(e),snapshot);
});
test('CLI template, parse, expected-SHA checks and output report',()=>{
 const t=spawnSync(process.execPath,['tools/acceptance-evidence.mjs','--template'],{encoding:'utf8'});
 assert.equal(t.status,0);assert.equal(JSON.parse(t.stdout).format,'ascii-azur-external-acceptance');
 const dir=mkdtempSync(join(tmpdir(),'azur-qa-'));
 try{
  const path=join(dir,'evidence.json'),out=join(dir,'report.json');
  writeFileSync(path,JSON.stringify(complete()));
  const r=spawnSync(process.execPath,['tools/acceptance-evidence.mjs','--input',path,'--source',SHA,'--output',out],{encoding:'utf8'});
  assert.equal(r.status,0);
  const mismatch=spawnSync(process.execPath,['tools/acceptance-evidence.mjs','--input',path,'--source',OTHER],{encoding:'utf8'});
  assert.equal(mismatch.status,1);
  const bad=spawnSync(process.execPath,['tools/acceptance-evidence.mjs','--input',join(dir,'missing.json')],{encoding:'utf8'});
  assert.equal(bad.status,2);
 }finally{rmSync(dir,{force:true,recursive:true});}
});
