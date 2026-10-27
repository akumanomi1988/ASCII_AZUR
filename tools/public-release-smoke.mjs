#!/usr/bin/env node
/** Fail-closed live Pages source and playable-browser acceptance. */
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';

export const PUBLIC_ROOT='https://akumanomi1988.github.io/ASCII_AZUR/';
export function checkedSha(sha){
 if(typeof sha!=='string'||!/^[a-f0-9]{40}$/i.test(sha))throw Error('A full 40-char Git SHA is required');
 return sha.toLowerCase();
}
export function correctProvenance(data,sha){
 return data?.source_commit===checkedSha(sha)&&data?.build==='verified-github-actions'&&
 typeof data?.published_at==='string'&&!Number.isNaN(Date.parse(data.published_at));
}
export async function waitForRelease(root,sha,opt={}){
 const expected=checkedSha(sha),attempts=opt.attempts??36,pause=opt.pause??sleep,fetcher=opt.fetcher??fetch;
 if(!Number.isInteger(attempts)||attempts<1)throw Error('Invalid retry count');
 let last='not available';
 for(let n=1;n<=attempts;n++){
  try{
   const url=new URL('build-info.json?probe='+expected.slice(0,12)+'-'+n,root);
   const r=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
   const body=r.ok?await r.json():null;
   if(r.ok&&correctProvenance(body,expected))return {attempts:n,metadata:body};
   last=r.ok?'stale or invalid source '+JSON.stringify(body).slice(0,220):'HTTP '+r.status;
  }catch(e){last=String(e).slice(0,220);}
  console.log('PUBLIC_PAGES_WAIT '+n+'/'+attempts+' '+last);
  if(n<attempts)await pause(10000);
 }
 throw Error('Public Pages source did not converge to '+expected+': '+last);
}
async function checkAssets(root,version){
 const names=['index.html','style.css','sw.js','manifest.webmanifest','dist/main.js','dist/render.js','dist/audio.js'];
 const out=[];
 for(const path of names){
  const url=new URL(path,root);url.searchParams.set('azur_probe',Date.now().toString());
  const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('Live resource '+path+' HTTP '+r.status);
  const body=await r.text();
  if(body.length<40||path!=='index.html'&&/^\s*<!doctype html/i.test(body))throw Error('HTML fallback or empty live asset '+path);
  if(path==='index.html'&&(!body.includes('id="newGame"')||!body.includes('WORLD ENGINE v'+version)))throw Error('Live HTML game/version mismatch');
  if(path==='dist/main.js'&&!body.includes('AzurGame'))throw Error('Live compiled game module mismatch');
  out.push({path,bytes:body.length});
 }
 return out;
}
class ChromeClient{
 constructor(ws){
  this.ws=ws;this.next=0;this.jobs=new Map();this.exceptions=[];
  ws.addEventListener('message',e=>{
   let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.id){const j=this.jobs.get(m.id);if(!j)return;this.jobs.delete(m.id);clearTimeout(j.t);m.error?j.reject(Error(JSON.stringify(m.error))):j.resolve(m.result||{});}
   else if(m.method==='Runtime.exceptionThrown')this.exceptions.push(m.params?.exceptionDetails?.text||'Page exception');
  });
  for(const event of ['close','error'])ws.addEventListener(event,()=>{for(const j of this.jobs.values()){clearTimeout(j.t);j.reject(Error('DevTools disconnected'));}this.jobs.clear();});
 }
 static async connect(url){
  const ws=new WebSocket(url);
  await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(Error('CDP socket timeout')),12000);
   ws.addEventListener('open',()=>{clearTimeout(t);ok();},{once:true});
   ws.addEventListener('error',()=>{clearTimeout(t);fail(Error('CDP socket error'));},{once:true});});
  const c=new ChromeClient(ws);await c.send('Page.enable');await c.send('Runtime.enable');return c;
 }
 send(method,params={},ms=16000){
  const id=++this.next;
  return new Promise((resolve,reject)=>{const t=setTimeout(()=>{this.jobs.delete(id);reject(Error('CDP command timed out: '+method));},ms);
   this.jobs.set(id,{resolve,reject,t});try{this.ws.send(JSON.stringify({id,method,params}));}catch(e){this.jobs.delete(id);clearTimeout(t);reject(e);}});
 }
 async eval(code){const r=await this.send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('JavaScript evaluation failed '+JSON.stringify(r.exceptionDetails).slice(0,300));
  return r.result?.value;
 }
 async until(code,ms=25000){
  const end=Date.now()+ms;
  while(Date.now()<end){try{if(await this.eval(code))return;}catch{}await sleep(220);}
  throw Error('Page condition not met: '+code.slice(0,200));
 }
 async tap(selector,touch){
  const pos=await this.eval('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)return null;el.scrollIntoView({block:"center"});const r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,width:r.width,height:r.height,hit:!!document.elementFromPoint(x,y)?.closest('+JSON.stringify(selector)+')};})()');
  if(!pos||pos.width<5||pos.height<5||!pos.hit)throw Error('Live UI cannot be tapped: '+selector+' '+JSON.stringify(pos));
  if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pos.x,y:pos.y,id:1}]});await sleep(90);await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else {await this.send('Input.dispatchMouseEvent',{type:'mousePressed',x:pos.x,y:pos.y,button:'left',clickCount:1});
   await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pos.x,y:pos.y,button:'left',clickCount:1});}
 }
 async screenshot(path){const r=await this.send('Page.captureScreenshot',{format:'png'},25000);writeFileSync(path,Buffer.from(r.data,'base64'));}
 close(){this.ws.close();}
}
async function startChrome(){
 const bin=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
 if(!bin)throw Error('Chromium missing on Actions host');
 const dir=mkdtempSync(join(tmpdir(),'azur-public-'));
 const child=spawn(bin,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-extensions',
  '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
 try{
  let port=0;
  for(let n=0;n<100;n++){const path=join(dir,'DevToolsActivePort');if(existsSync(path)){port=Number(readFileSync(path,'utf8').split('\n')[0]);if(port>0)break;}if(child.exitCode!==null)throw Error('Chromium terminated during startup');await sleep(200);}
  if(!port)throw Error('Chromium debugging boot timeout');
  let page;
  for(let n=0;n<30;n++){try{const items=await (await fetch('http://127.0.0.1:'+port+'/json',{signal:AbortSignal.timeout(1800)})).json();page=items.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(page)break;}catch{}await sleep(200);}
  if(!page)throw Error('Chromium debug page missing');
  return {cdp:await ChromeClient.connect(page.webSocketDebuggerUrl),cleanup:()=>{child.kill('SIGTERM');setTimeout(()=>{child.kill('SIGKILL');rmSync(dir,{force:true,recursive:true});},2400).unref();}};
 }catch(e){child.kill('SIGKILL');rmSync(dir,{force:true,recursive:true});throw e;}
}
async function play(cdp,root,version,mode,out){
 const mobile=mode==='mobile',width=mobile?390:1280,height=mobile?844:800;
 // This smoke checks responsive CSS width, not an Android user-agent or digitizer.
 await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 // Native touchscreen correctness is enforced by Android API30/API35 acceptance.
 // Here real Chromium mouse input exercises both public desktop and responsive mobile layouts.
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false,maxTouchPoints:1});
 await cdp.send('Page.navigate',{url:new URL('?azur_smoke='+mode+'-'+Date.now(),root).toString()});
 await cdp.until('document.readyState==="complete"&&!!document.getElementById("newGame")',35000);
 const title=await cdp.eval('document.querySelector(".live-tag")?.textContent||""');
 if(!title.includes('WORLD ENGINE v'+version))throw Error('Live page version mismatch: '+title);
 console.log('PUBLIC_STAGE '+mode+' start-new-game');
 await cdp.tap('#newGame',false);
 await cdp.until('!document.getElementById("openingCinematic").classList.contains("hidden")');
 await cdp.tap('#cinematicSkip',false);
 await cdp.until('!!document.querySelector("#starters button")&&!document.getElementById("starterScreen").classList.contains("hidden")');
 console.log('PUBLIC_STAGE '+mode+' choose-starter');
 await cdp.tap('#starters button',false);
 await cdp.until('(()=>{try{return JSON.parse(localStorage.getItem("ascii-azur-save-v1")).team.length===1}catch{return false}})()');
 const before=await cdp.eval('(()=>{const s=JSON.parse(localStorage.getItem("ascii-azur-save-v1"));return {seed:s.worldSeed,team:s.team.length,zone:s.zone}})()');
 console.log('PUBLIC_STAGE '+mode+' saved-initial');
 await cdp.screenshot(join(out,mode+'-new-game.png'));
 await cdp.send('Page.reload',{ignoreCache:true});
 await cdp.until('document.readyState==="complete"&&document.getElementById("continue")?.hidden===false',35000);
 console.log('PUBLIC_STAGE '+mode+' restore-save');
 await cdp.tap('#continue',false);
 const after=await cdp.eval('(()=>{const s=JSON.parse(localStorage.getItem("ascii-azur-save-v1"));return {seed:s.worldSeed,team:s.team.length,zone:s.zone,playing:document.getElementById("titleScreen").classList.contains("hidden")}})()');
 if(before.seed!==after.seed||before.team!==after.team||before.zone!==after.zone||!after.playing)throw Error('Live '+mode+' saved game resume failed: '+JSON.stringify({before,after}));
 console.log('PUBLIC_STAGE '+mode+' resumed');
 await cdp.screenshot(join(out,mode+'-continued.png'));
 if(cdp.exceptions.length)throw Error('Uncaught live browser errors: '+cdp.exceptions.join('; '));
 return {mode,width,height,version,seedPreserved:true,team:after.team,zone:after.zone};
}
async function main(){
 const sha=checkedSha(process.env.SOURCE_SHA||process.argv[2]),version=JSON.parse(readFileSync('package.json','utf8')).version;
 const root=process.env.AZUR_SMOKE_ROOT||PUBLIC_ROOT;
 if(root!==PUBLIC_ROOT&&!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{1,4}\/$/.test(root))throw Error('Only official Pages or loopback smoke fixture is permitted');
 const out=resolve('artifacts/public-smoke');mkdirSync(out,{recursive:true});
 const report={schema:'ascii-azur-public-smoke-v1',source:sha,version,status:'FAIL',assets:[],views:[]};
 let browser;
 try{
  report.deployed=await waitForRelease(root,sha);
  report.assets=await checkAssets(root,version);
  for(const mode of ['desktop','mobile']){
   browser=await startChrome();
   try{report.views.push(await play(browser.cdp,root,version,mode,out));}
   finally{browser.cdp.close();browser.cleanup();browser=null;}
  }
  report.status='PASS';
  console.log('PUBLIC_AZUR_PASS '+JSON.stringify({source:sha,views:report.views.map(v=>v.mode),attempts:report.deployed.attempts}));
 }catch(e){
  report.error=String(e?.stack||e);console.error('PUBLIC_AZUR_FAIL '+report.error);
  if(browser)try{await browser.cdp.screenshot(join(out,'failure.png'));}catch{}
  process.exitCode=1;
 }finally{
  try{browser?.cdp.close();browser?.cleanup();}catch{}
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
