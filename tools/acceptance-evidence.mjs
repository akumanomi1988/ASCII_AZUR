/**
 * External release evidence intake for ASCII AZUR.
 * This is an OFFLINE, fail-closed reviewer aid. It cannot authenticate observers,
 * hardware or subjective assessments, and NEVER closes roadmap milestones.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const OPEN_GATES=Object.freeze(['C4','W4','N4','P4','G2','G4','U2','U4','A2','A3','A4','Q4']);
export const QUALITY_DOMAINS=Object.freeze([
 'combat','balance','exploration','world','narrative','pacing','collection','progression',
 'art','animation','readability','controls','accessibility','music','sound','stability'
]);
const SHA=/^[a-f0-9]{40}$/i;
const CATEGORIES=new Set(['combat','navigation','narrative','pacing','usability']);
const STARTERS=new Set(['cindrel','velaria','thorne']);
const SEVERITIES=new Set(['critical','high','medium','low']);
const STATES=new Set(['open','resolved']);
const RECORDED_FORMAT='ascii-azur-external-acceptance';
const GATE_DESCRIPTION={
 C4:'20 independent completed combat observations across three starters; explicit balance signoff',
 W4:'at least 200 examined seeds and independent physical-mobile navigation evidence',
 N4:'independent narrative observations and approval',
 P4:'independent progression/pacing observations and approval',
 G2:'independent visual review of both graphics profiles and scene readability',
 G4:'minimum real Android hardware: 30 min, 10 min per phase, >=30 sustained FPS, thermal/battery, warm repeat and both render backends',
 U2:'physical Android controls, touch, orientation, fullscreen, offline/update, saves and multi-tab behavior',
 U4:'independent usability observations on mobile and desktop',
 A2:'mastered themes explicitly reviewed',
 A3:'dynamic mixing approved using real-device evidence',
 A4:'independent sound and accessibility approval',
 Q4:'exact-source public boot, real hardware and independent QA, no open high/critical defects, 16 ratings >=4 with mean >=4.5, final signoff'
};
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const goodLabel=v=>typeof v==='string'&&v.trim().length>0&&v.length<=160;
const validSHA=v=>typeof v==='string'&&SHA.test(v);
const isBoolean=v=>typeof v==='boolean';
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const approved=(obj,key)=>isObject(obj?.[key])&&obj[key].approved===true&&goodLabel(obj[key].reviewerCode)&&obj[key].reviewerCode.trim().length>=2;
const realDevice=d=>isObject(d)&&d.physical===true&&validSHA(d.sourceCommit)&&goodLabel(d.model)&&goodLabel(d.android)&&goodLabel(d.browser)&&goodLabel(d.profiler);
const sourceAligned=(s,source)=>s?.sourceCommit===source;
const allTrue=(obj,keys)=>keys.every(k=>obj?.[k]===true);

export function blankEvidence(sourceCommit=''){
 return {format:RECORDED_FORMAT,version:1,sourceCommit,releaseVersion:'',
  publishedSourceCommit:null,publicBoot:{observed:false,sourceCommit:null,url:''},
  seedCoverage:{savedSeeds:0},device:null,sessions:[],reviews:{},ratings:[],defects:[],signoffs:{}};
}
function verifyStructure(data){
 const errors=[];
 if(!isObject(data))return ['Root must be a JSON object'];
 if(data.format!==RECORDED_FORMAT||data.version!==1)errors.push('Unsupported evidence format/version');
 if(!validSHA(data.sourceCommit))errors.push('sourceCommit must be a 40-character Git SHA');
 if(data.publishedSourceCommit!==null&&data.publishedSourceCommit!==undefined&&!validSHA(data.publishedSourceCommit))errors.push('publishedSourceCommit is not a Git SHA');
 if(!goodLabel(data.releaseVersion))errors.push('releaseVersion is required');
 if(data.publicBoot!==undefined&&data.publicBoot!==null&&!isObject(data.publicBoot))errors.push('publicBoot must be an object');
 if(data.device!==undefined&&data.device!==null&&!isObject(data.device))errors.push('device must be an object');
 if(data.seedCoverage!==undefined&&data.seedCoverage!==null&&!isObject(data.seedCoverage))errors.push('seedCoverage must be an object');
 if(!Array.isArray(data.sessions)||data.sessions.length>2000)errors.push('sessions must be an array with at most 2000 entries');
 if(!Array.isArray(data.ratings)||data.ratings.length>16)errors.push('ratings must be an array with at most 16 entries');
 if(!Array.isArray(data.defects)||data.defects.length>200)errors.push('defects must be an array with at most 200 entries');
 if(data.reviews!==undefined&&!isObject(data.reviews))errors.push('reviews must be an object');
 if(data.signoffs!==undefined&&!isObject(data.signoffs))errors.push('signoffs must be an object');
 if(errors.length)return errors;
 const ids=new Set();
 for(const [i,s] of data.sessions.entries()){
  if(!isObject(s)||!goodLabel(s.id)||ids.has(s.id)){errors.push('Invalid or duplicate session id at index '+i);continue;}
  ids.add(s.id);
  if(!CATEGORIES.has(s.category)||!goodLabel(s.observerCode)||!isBoolean(s.independent)||!isBoolean(s.completed)||!validSHA(s.sourceCommit))errors.push('Invalid session metadata: '+s.id);
  if(s.category==='combat'&&!STARTERS.has(s.starter))errors.push('Invalid combat starter: '+s.id);
  if(s.mobile!==undefined&&!isBoolean(s.mobile))errors.push('Invalid mobile flag: '+s.id);
  if(s.physical!==undefined&&!isBoolean(s.physical))errors.push('Invalid physical flag: '+s.id);
 }
 const domains=new Set();
 for(const [i,r] of data.ratings.entries()){
  if(!isObject(r)||!QUALITY_DOMAINS.includes(r.domain)||domains.has(r.domain)||!finite(r.score,1,5)||!Number.isInteger(r.score*10)||r.independent!==true)errors.push('Invalid/duplicate independent rating at index '+i);
  if(isObject(r))domains.add(r.domain);
 }
 const defectIds=new Set();
 for(const [i,d] of data.defects.entries()){
  if(!isObject(d)||!goodLabel(d.id)||defectIds.has(d.id)||!SEVERITIES.has(d.severity)||!STATES.has(d.status))errors.push('Invalid/duplicate defect at index '+i);
  if(isObject(d))defectIds.add(d.id);
 }
 if(data.device){
  const d=data.device;
  if(d.physical!==true||!validSHA(d.sourceCommit)||!goodLabel(d.model)||!goodLabel(d.android)||!goodLabel(d.browser))errors.push('Invalid physical device declaration');
  for(const k of ['sessionMinutes','exploreMinutes','combatCryptMinutes','mixedMinutes','sustainedFps','batteryStart','batteryEnd','thermalStartC','thermalEndC']){
   if(d[k]!==undefined&&!finite(d[k],k.startsWith('thermal')?-30:0,k.endsWith('Minutes')?1440:k==='sustainedFps'?1000:k.startsWith('thermal')?150:100))errors.push('Invalid hardware measurement '+k);
  }
 }
 if(data.seedCoverage?.savedSeeds!==undefined&&(!Number.isSafeInteger(data.seedCoverage.savedSeeds)||data.seedCoverage.savedSeeds<0))errors.push('Invalid saved seed coverage');
 if(data.publicBoot?.observed===true){
  if(!validSHA(data.publicBoot.sourceCommit)||typeof data.publicBoot.url!=='string'||!data.publicBoot.url.startsWith('https://akumanomi1988.github.io/ASCII_AZUR/'))errors.push('Invalid public boot provenance');
 }
 for(const [gate,signature] of Object.entries(data.signoffs??{})){
  if(!OPEN_GATES.includes(gate)||!isObject(signature)||!isBoolean(signature.approved)||!goodLabel(signature.reviewerCode))errors.push('Invalid gate signoff: '+gate);
 }
 return errors;
}
export function evaluateEvidence(input,{expectedSource=null}={}){
 const errors=verifyStructure(input);
 if(expectedSource!==null&&(!validSHA(expectedSource)||input?.sourceCommit!==expectedSource))errors.push('Requested release source SHA mismatch');
 const gates=Object.fromEntries(OPEN_GATES.map(k=>[k,{status:'OPEN',description:GATE_DESCRIPTION[k],missing:[]}]));
 if(errors.length)return {format:'ascii-azur-evidence-review',version:1,valid:false,errors,
  disclaimer:'INVALID evidence. No milestone is accepted or certified.',gates};
 const d=input.device??{},sessions=input.sessions,review=input.reviews??{},signoffs=input.signoffs??{};
 const matchingSessions=sessions.filter(s=>s.completed&&s.independent&&sourceAligned(s,input.sourceCommit));
 const byKind=kind=>matchingSessions.filter(s=>s.category===kind);
 const physicalNav=byKind('navigation').some(s=>s.physical===true&&s.mobile===true);
 const published=input.publishedSourceCommit===input.sourceCommit;
 const publicBoot=published&&input.publicBoot?.observed===true&&input.publicBoot.sourceCommit===input.sourceCommit;
 const hardware=realDevice(d)&&sourceAligned(d,input.sourceCommit);
 const phaseTimes=finite(d.sessionMinutes,30,1440)&&finite(d.exploreMinutes,10,1440)&&finite(d.combatCryptMinutes,10,1440)&&finite(d.mixedMinutes,10,1440)&&
  d.exploreMinutes+d.combatCryptMinutes+d.mixedMinutes<=d.sessionMinutes;
 const thermals=finite(d.thermalStartC,-30,150)&&finite(d.thermalEndC,-30,150)&&
  finite(d.batteryStart,0,100)&&finite(d.batteryEnd,0,100)&&d.batteryEnd<=d.batteryStart&&
  d.thermalReviewed===true&&d.batteryReviewed===true;
 const gpuPerf=hardware&&phaseTimes&&finite(d.sustainedFps,30,1000)&&thermals&&allTrue(d,['warmRepeat','canvas2d','webgl2']);
 const deviceUX=hardware&&allTrue(d,['touchControls','rotation','fullscreen','offlineRecovery','saveResume','multiTab']);
 const combat=byKind('combat');
 const starters=new Set(combat.map(s=>s.starter));
 const combatCoverage=combat.length>=20&&STARTERS.size===starters.size&&[...STARTERS].every(starter=>starters.has(starter));
 const seedCoverage=Number.isSafeInteger(input.seedCoverage?.savedSeeds)&&input.seedCoverage.savedSeeds>=200;
 const matchingRatings=input.ratings.length===16&&QUALITY_DOMAINS.every(domain=>input.ratings.some(r=>r.domain===domain&&r.independent===true&&r.score>=4));
 const mean=input.ratings.length?Number((input.ratings.reduce((sum,r)=>sum+r.score,0)/input.ratings.length).toFixed(3)):null;
 const quality=matchingRatings&&mean>=4.5;
 const blockingDefects=input.defects.filter(x=>x.status==='open'&&['critical','high'].includes(x.severity));
 const requirements={
  C4:[combatCoverage,approved(signoffs,'C4')],
  W4:[seedCoverage,physicalNav,approved(signoffs,'W4')],
  N4:[byKind('narrative').length>0,approved(signoffs,'N4')],
  P4:[byKind('pacing').length>0,approved(signoffs,'P4')],
  G2:[review.visual===true,approved(signoffs,'G2')],
  G4:[gpuPerf,approved(signoffs,'G4')],
  U2:[deviceUX,approved(signoffs,'U2')],
  U4:[byKind('usability').some(s=>s.mobile===true),byKind('usability').some(s=>s.mobile===false),approved(signoffs,'U4')],
  A2:[review.mastering===true,approved(signoffs,'A2')],
  A3:[gpuPerf,review.mixing===true,approved(signoffs,'A3')],
  A4:[review.audio===true,approved(signoffs,'A4')]
 };
 for(const [key,checks] of Object.entries(requirements)){
  gates[key].missing=checks.map((ok,i)=>ok?null:'requirement-'+(i+1)).filter(Boolean);
  if(gates[key].missing.length===0)gates[key].status='EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION';
 }
 const others=OPEN_GATES.filter(k=>k!=='Q4');
 const q4Checks=[publicBoot,gpuPerf,deviceUX,combatCoverage,byKind('narrative').length>0,byKind('usability').length>0,
  quality,blockingDefects.length===0,others.every(k=>gates[k].status==='EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION'),approved(signoffs,'Q4')];
 gates.Q4.missing=q4Checks.map((ok,i)=>ok?null:'requirement-'+(i+1)).filter(Boolean);
 if(!gates.Q4.missing.length)gates.Q4.status='EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION';
 return {format:'ascii-azur-evidence-review',version:1,valid:true,sourceCommit:input.sourceCommit,releaseVersion:input.releaseVersion,
  publishedSourceMatched:published,publicBootProvenanceMatched:publicBoot,
  sessions:{independentCompleted:matchingSessions.length,combat:combat.length,starters:[...starters].sort()},
  hardware:{declaredPhysical:hardware,performanceEvidenceComplete:gpuPerf,controlsEvidenceComplete:deviceUX},
  quality:{domainsRecorded:input.ratings.length,allAtLeastFour:matchingRatings,mean,thresholdCandidate:quality},
  defects:{total:input.defects.length,openBlocking:blockingDefects.map(x=>x.id)},
  gates,readinessCount:Object.values(gates).filter(x=>x.status==='EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION').length,
  acceptedMilestonesByThisTool:0,disclaimer:'SELF-REPORTED UNAUTHENTICATED inputs. Ready means reviewable, not accepted. No hardware, human, performance, public boot or milestone claims are independently verified by this CLI.'};
}
export function runCli(argv){
 if(argv.length===1&&argv[0]==='--template'){
  process.stdout.write(JSON.stringify(blankEvidence(),null,2)+'\n');return 0;
 }
 const pos=argv.indexOf('--input'),out=argv.indexOf('--output'),sha=argv.indexOf('--source');
 if(pos<0||!argv[pos+1]||(sha>=0&&!argv[sha+1])||(out>=0&&!argv[out+1])){
  process.stderr.write('Usage: node tools/acceptance-evidence.mjs --template | --input evidence.json [--source exact40charsha] [--output report.json]\n');return 2;
 }
 try{
  const file=resolve(argv[pos+1]);const bytes=readFileSync(file);
  if(bytes.length>2_000_000)throw Error('Evidence file exceeds 2 MB');
  const input=JSON.parse(bytes.toString('utf-8'));
  const report=evaluateEvidence(input,{expectedSource:sha<0?null:argv[sha+1]});
  const output=JSON.stringify(report,null,2)+'\n';
  if(out>=0)writeFileSync(resolve(argv[out+1]),output,'utf-8');
  else process.stdout.write(output);
  return report.valid?0:1;
 }catch(e){process.stderr.write('Evidence input error: '+(e instanceof Error?e.message:String(e))+'\n');return 2;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 process.exitCode=runCli(process.argv.slice(2));
}
