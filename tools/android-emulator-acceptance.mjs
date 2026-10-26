#!/usr/bin/env node
/**
 * Actual Android emulator + installed Chrome via ADB and CDP.
 * Touch is injected into Chrome's input pipeline, never dispatched as DOM events.
 * These are emulated results, not physical thermals, battery or speaker validation.
 */
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
const ROOT=process.cwd(),API=process.env.ANDROID_API_LEVEL||'unknown';
const PORT=18976,DEVTOOLS=19222,OUT=resolve(ROOT,'artifacts/android-emulator',API);
mkdirSync(OUT,{recursive:true});
const report={schema:'ascii-azur-android-emulator-v1',api:API,physicalDevice:false,emulatedMeasurements:true,assertions:[],errors:[]};
function check(ok,label){if(!ok)throw Error(label);report.assertions.push(label);}
function adb(...args){return execFileSync('adb',args,{timeout:25000,encoding:'utf8'}).trim();}
function evidence(name,content){writeFileSync(resolve(OUT,name),content);}
const MIME={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),file=resolve(ROOT,'.'+decodeURIComponent(url.pathname.replace(/\/$/,'/index.html')));
  if(!file.startsWith(ROOT+'/')){res.writeHead(403).end();return;}
  const bytes=readFileSync(file);
  res.writeHead(200,{'content-type':MIME[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end();}
});
await new Promise((done,fail)=>{server.once('error',fail);server.listen(PORT,'0.0.0.0',done);});
class Devtools{
 constructor(ws){
  this.ws=ws;this.next=0;this.pending=new Map();this.exceptions=[];this.networkFailures=[];this.nativeJoystickMoveSeen=false;this.nativeJoystickReleaseSeen=false;
  ws.addEventListener('message',e=>{
   let msg;try{msg=JSON.parse(e.data);}catch{return;}
   if(msg.id){const job=this.pending.get(msg.id);if(!job)return;this.pending.delete(msg.id);clearTimeout(job.timeout);
    if(msg.error)job.reject(Error(JSON.stringify(msg.error)));else job.resolve(msg.result||{});
   }else if(msg.method==='Runtime.exceptionThrown')this.exceptions.push(msg.params?.exceptionDetails?.text||'JavaScript exception');
   else if(msg.method==='Network.loadingFailed')this.networkFailures.push(msg.params?.errorText||'Network failure');
   else if(msg.method==='Runtime.consoleAPICalled'){
    const words=(msg.params?.args||[]).map(a=>String(a.value||'')).join(' ');
    if(words.includes('ANDROID_JOYSTICK_NATIVE_MOVE'))this.nativeJoystickMoveSeen=true;
    if(words.includes('ANDROID_JOYSTICK_NATIVE_RELEASE'))this.nativeJoystickReleaseSeen=true;
   }
  });
  const failPending=(event)=>{
   for(const [id,job] of this.pending){clearTimeout(job.timeout);job.reject(Error('Chrome CDP socket '+event+' while awaiting '+id));}
   this.pending.clear();
  };
  ws.addEventListener('close',()=>failPending('closed'));
  ws.addEventListener('error',()=>failPending('error'));
 }
 static async connect(url){
  const ws=new WebSocket(url);
  await new Promise((done,fail)=>{
   const t=setTimeout(()=>fail(Error('Chrome WebSocket connection timeout')),15000);
   ws.addEventListener('open',()=>{clearTimeout(t);done();},{once:true});
   ws.addEventListener('error',()=>{clearTimeout(t);fail(Error('Chrome WebSocket connection failed'));},{once:true});
  });
  const c=new Devtools(ws);await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');
  await c.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__azurEarlyErrors=[];window.addEventListener("error",e=>window.__azurEarlyErrors.push(String(e.message||e.error)));window.addEventListener("unhandledrejection",e=>window.__azurEarlyErrors.push(String(e.reason)));'});
  try{await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});}catch{}
  return c;
 }
 send(method,params={},ms=25000){
  const id=++this.next;
  return new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{
    this.pending.delete(id);
    console.error('ANDROID_CDP_TIMEOUT '+JSON.stringify({api:API,method,id,ms,socketState:this.ws.readyState,pending:this.pending.size,expression:method==='Runtime.evaluate'?String(params.expression||'').slice(0,200):undefined}));
    reject(Error('Timed out: '+method+' (socket '+this.ws.readyState+', id '+id+')'));
   },ms);
   this.pending.set(id,{resolve,reject,timeout});this.ws.send(JSON.stringify({id,method,params}));
  });
 }
 async evaluate(script,ms=25000){
  const r=await this.send('Runtime.evaluate',{expression:script,returnByValue:true,awaitPromise:true},ms);
  if(r.exceptionDetails)throw Error('Chrome JS error: '+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
 }
 async until(script,ms=26000){
  const start=Date.now();
  while(Date.now()-start<ms){try{if(await this.evaluate(script,3000))return;}catch{}
   await sleep(250);
  }
  throw Error('Android Chrome condition timed out: '+script);
 }
 async tap(selector){
  console.log('ANDROID_TOUCH_BEGIN '+selector);
  const p=await this.evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');if(!e)return null;if(e.closest("#titleScreen")){document.querySelector("#titleScreen").scrollTop=99999;window.scrollTo(0,0);}else if(e.closest("#joystick")){window.scrollTo(0,0);}else{e.scrollIntoView({block:"nearest"});}const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2,dpr:devicePixelRatio,vh:innerHeight,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML?.slice(0,160)}:null})()');
  if(!p)throw Error('Touch target unavailable: '+selector);
  if(p.y<2||p.y>=p.vh-2)throw Error('Touch target outside visible Chrome viewport: '+selector+' '+JSON.stringify(p));
  console.log('ANDROID_TOUCH_GEOMETRY '+JSON.stringify({selector,p}));
  if(Number(API)<=30){
   // Android 11 Chrome maps CDP touch coordinates incorrectly after window
   // metric overrides. Drive the actual OS touch pipeline with adb input tap.
   console.log('ANDROID_TOUCH_INSTALL_PROBE '+selector);
   await this.evaluate('(()=>{window.__azurNativeTapSelector='+JSON.stringify(selector)+';window.__azurNativeTapHit=false;if(!window.__azurNativeTapInstalled){document.addEventListener("pointerdown",e=>{if(e.target.closest(window.__azurNativeTapSelector))window.__azurNativeTapHit=true},true);window.__azurNativeTapInstalled=true;}})()');
   const size=adb('shell','wm','size');
   const match=size.match(/Override size:\s*(\d+)x(\d+)/)||size.match(/Physical size:\s*(\d+)x(\d+)/);
   if(!match)throw Error('Could not measure Android display size: '+size);
   const screenHeight=Number(match[2]),extra=screenHeight-p.vh*p.dpr;
   const offsets=[Math.max(0,extra-55),Math.max(0,extra-15),Math.max(0,extra-95),Math.max(0,extra),0,64,110,160,210];
   let matched=false;
   for(const offset of [...new Set(offsets.map(Math.round))]){
    const x=Math.round(p.x*p.dpr),y=Math.round(p.y*p.dpr+offset);
    if(y<10||y>=screenHeight-10)continue;
    console.log('ANDROID_TOUCH_OS_TAP '+JSON.stringify({selector,x,y,offset}));
    adb('shell','input','tap',String(x),String(y));
    await sleep(280);
    if(await this.evaluate('window.__azurNativeTapHit===true')){matched=true;this.lastAndroidTapOffset=offset;report.androidNativeOsTaps=(report.androidNativeOsTaps||0)+1;break;}
   }
   if(!matched)throw Error('Android OS tap missed '+selector+'; probe='+JSON.stringify({p,screenHeight,extra}));
   console.log('ANDROID_TOUCH_OS_MATCH '+JSON.stringify({selector,offset:this.lastAndroidTapOffset}));
  }else{
   await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});
   await sleep(110);await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await sleep(240);
 }
 async capture(name){const r=await this.send('Page.captureScreenshot',{format:'png'},20000);evidence(name,Buffer.from(r.data,'base64'));}
 close(){this.ws.close();}
}
let chrome;
const page='http://127.0.0.1:'+PORT+'/index.html';
async function startChrome(){
 // A fresh Google Play image opens Chrome's first-run experience by default.
 // Open Chrome's real Main activity with the official first-run skip intent
 // before navigating to the project URL via Android's browser intent.
 try{adb('shell','am','start','-n','com.android.chrome/com.google.android.apps.chrome.Main',
   '--ez','com.android.chrome.firstrun.skip','true','-d',page);}catch{}
 adb('shell','am','start','-a','android.intent.action.VIEW','-d',page,'-p','com.android.chrome');
}
function chromeDebugSnapshot(){
 const details={};
 for(const [key,args] of [
  ['pid',['shell','pidof','com.android.chrome']],
  ['activity',['shell','dumpsys','activity','activities']],
  ['unixSockets',['shell','cat','/proc/net/unix']],
  ['forward',['forward','--list']],
  ['uiDump',['shell','uiautomator','dump','/sdcard/azur-ui.xml']],
  ['ui',['shell','cat','/sdcard/azur-ui.xml']]
 ]){
  try{details[key]=adb(...args).slice(0,key==='activity'?2800:8500);}catch(error){details[key]=String(error).slice(0,500);}
 }
 evidence('chrome-boot-diagnostic.json',JSON.stringify(details,null,2)+'\n');
 console.error('ANDROID_CHROME_BOOT_DIAGNOSTICS '+JSON.stringify({
  pid:details.pid,forward:details.forward,sockets:(details.unixSockets||'').split('\n').filter(x=>/chrome|devtools/i.test(x)).slice(0,12),
  activity:details.activity?.slice(-850),ui:details.ui?.slice(0,2900)}));
 return details;
}
async function dismissChromeFirstRun(){
 let last='';
 for(let attempts=0;attempts<4;attempts++){
  let dump='';
  try{adb('shell','uiautomator','dump','/sdcard/azur-ui.xml');dump=adb('shell','cat','/sdcard/azur-ui.xml');}catch{return;}
  const controls=[...dump.matchAll(/<node\b[^>]*text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)];
  const target=controls.find(m=>/^(Accept &amp; continue|Accept & continue|Use without an account|No thanks|Not now|Skip|Continue|Got it|No, thanks)$/i.test(m[1]));
  if(!target||last===target[1])return;
  last=target[1];
  const x=Math.round((Number(target[2])+Number(target[4]))/2),y=Math.round((Number(target[3])+Number(target[5]))/2);
  console.log('ANDROID_CHROME_FIRST_RUN '+target[1]+' at '+x+','+y);
  adb('shell','input','tap',String(x),String(y));await sleep(1100);
 }
}

async function connectChrome(){
 const start=Date.now();let firstRunChecked=false;
 while(Date.now()-start<65000){
  try{
   const res=await fetch('http://127.0.0.1:'+DEVTOOLS+'/json',{signal:AbortSignal.timeout(2000)});
   const tabs=await res.json(),pages=tabs.filter(t=>t.type==='page'&&t.webSocketDebuggerUrl);
   const t=pages.find(t=>t.url.includes('127.0.0.1:'+PORT))||pages[0];
   if(t)return Devtools.connect(t.webSocketDebuggerUrl.replace('localhost','127.0.0.1'));
  }catch{}
  if(!firstRunChecked&&Date.now()-start>9000){firstRunChecked=true;await dismissChromeFirstRun();}
  await sleep(800);
 }
 chromeDebugSnapshot();
 throw Error('Chrome DevTools not reachable through emulator ADB');
}
async function resize(w,h,label){
 adb('shell','wm','size',w+'x'+h);
 await sleep(2200);
 const m=await chrome.evaluate('({width:innerWidth,height:innerHeight,portrait:matchMedia("(orientation:portrait)").matches})');
 check(label==='portrait'?m.portrait:!m.portrait,'Android OS resized viewport '+label);
 report[label]=m;
}
async function testAudio(){
 const data=await chrome.evaluate('(async()=>{'+
  'const {Sound,AUDIO_LIMITS}=await import("./dist/audio.js");'+
  'const s=new Sound();s.setScene("forest");s.unlock();await new Promise(r=>setTimeout(r,420));const playing=s.diagnostics();'+
  's.setScene("battle");s.setIntensity(.8);s.hitElement("Éter");'+
  'for(let i=0;i<160;i++){if(i%12===0)await new Promise(r=>setTimeout(r,20));s.setScene(i%3===0?"boss":i%3===1?"garden":"marsh");s.hitElement(i%2?"Ceniza":"Bruma");}'+
  'const stress=s.diagnostics();s.setScene("forest");s.pause();await new Promise(r=>setTimeout(r,420));const paused=s.diagnostics();'+
  's.resume();await new Promise(r=>setTimeout(r,420));const resumed=s.diagnostics();'+
  's.setEnabled(false);await new Promise(r=>setTimeout(r,420));const muted=s.diagnostics();s.dispose();const disposed=s.diagnostics();'+
  'return {playing,stress,paused,resumed,muted,disposed,limits:AUDIO_LIMITS};})()',70000);
 report.audio=data;
 check(data.playing.contextState==='running'&&data.playing.musicVoices>0,'Android Web Audio graph plays music');
 check(data.stress.musicVoices<=data.limits.musicVoices&&data.stress.effectVoices<=data.limits.effectVoices,'160 scene changes respect voice budgets');
 check(data.stress.retiringBuses<=data.limits.retiringBuses,'Scene crossfades respect bus budget');
 check(data.paused.paused&&!data.paused.scheduling,'Pause shuts down Android music scheduler');
 check(data.resumed.contextState==='running'&&data.resumed.scheduling,'Resume restarts Android music scheduler');
 check(!data.muted.scheduling,'Mute suspends scheduler');
 check(data.disposed.disposed&&!data.disposed.musicVoices&&!data.disposed.effectVoices,'Dispose releases all audio graph voices');
}
async function frameProbe(){
 const perf=await chrome.evaluate('(async()=>{'+
  'let prev=performance.now();const gaps=[];for(let i=0;i<40;i++){await new Promise(requestAnimationFrame);'+
  'const now=performance.now();gaps.push(now-prev);prev=now;}const sorted=[...gaps].sort((a,b)=>a-b);'+
  'return {frames:gaps.length,averageMs:gaps.reduce((a,b)=>a+b,0)/gaps.length,p95Ms:sorted[Math.floor(gaps.length*.95)],'+
  'hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory||null};})()',80000);
 check(perf.frames===40&&Number.isFinite(perf.p95Ms)&&perf.p95Ms>0,'Emulator frame time measured');
 report.frameProbe=perf; // Not representative of physical-device fps.
}
async function journey(){
 console.log('ANDROID_STAGE journey-start');
 await chrome.until('document.readyState==="complete"&&!!document.getElementById("newGame")',40000);
 console.log('ANDROID_STAGE bootstrap');
 const ua=await chrome.evaluate('navigator.userAgent');
 check(ua.includes('Android'),'Native Android Chrome browser running');report.userAgent=ua;
 await chrome.evaluate('(()=>{window.__azurQaTouches=[];document.addEventListener("pointerdown",e=>window.__azurQaTouches.push({type:e.type,target:e.target.id,x:e.clientX,y:e.clientY,pointer:e.pointerType}),true);document.addEventListener("click",e=>window.__azurQaTouches.push({type:e.type,target:e.target.id}),true);})()');
 await chrome.tap('#newGame');
 // Older Android Chrome may eat the first OS-to-renderer touch while warming up.
 // Retry once with another actual Chrome touch, never bypassing the native event.
 try{await chrome.until('!!document.querySelector("#starters button")',16000);}
 catch(error){
  const state=await chrome.evaluate('({title:document.getElementById("titleScreen")?.className,starter:document.getElementById("starterScreen")?.className,touches:window.__azurQaTouches,modal:document.getElementById("modal")?.className,body:document.body.innerText.slice(0,400)})');
  const extra=await chrome.evaluate('({ua:navigator.userAgent,ready:document.readyState,early:window.__azurEarlyErrors||[],imports:performance.getEntriesByType("resource").filter(x=>x.name.includes("/dist/")).map(x=>({url:x.name.split("/").pop(),size:x.transferSize,duration:x.duration})).slice(0,20),script:document.querySelector("script[type=module]")?.outerHTML,starter:document.querySelector("#starterScreen")?.outerHTML.slice(0,250)})');
  console.log('ANDROID_STARTER_DEBUG '+JSON.stringify({state,extra,exceptions:chrome.exceptions,networkFailures:chrome.networkFailures}));
  await chrome.capture('debug-before-start.png');
  await chrome.tap('#newGame');
  await chrome.until('!!document.querySelector("#starters button")',15000);
 }

 console.log('ANDROID_STAGE starter-buttons');
 await chrome.tap('#starters button');
 for(let i=0;i<15;i++){if(await chrome.evaluate('document.getElementById("dialogue").classList.contains("hidden")'))break;await chrome.tap('#closeDialogue');}
 check(await chrome.evaluate('document.getElementById("dialogue").classList.contains("hidden")'),'Native touch completes introduction');console.log('ANDROID_STAGE intro-complete');
 const initial=await chrome.evaluate('(()=>{const x=JSON.parse(localStorage.getItem("ascii-azur-save-v1"));return {seed:x.worldSeed,team:x.team.length,flags:x.flags.length}})()');
 check(initial.team===1,'Game saves native Android starter selection');report.initial=initial;
 if(Number(API)<=30){await chrome.evaluate('window.scrollTo(0,0)');await sleep(350);}console.log('ANDROID_STAGE joystick-start');
 const pad=await chrome.evaluate('(()=>{window.__azurJoystickMoves=0;document.addEventListener("pointermove",e=>{if(e.target.closest("#joystick")&&++window.__azurJoystickMoves===1)console.log("ANDROID_JOYSTICK_NATIVE_MOVE");},true);document.addEventListener("pointerup",e=>{if(e.target.closest("#joystick"))console.log("ANDROID_JOYSTICK_NATIVE_RELEASE");},true);const r=document.getElementById("joystick").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,dx:r.width*.25,width:r.width,dpr:devicePixelRatio,vh:innerHeight,visibleHeight:Math.min(innerHeight,window.visualViewport?.height||innerHeight)};})()');
 check(pad.width>=35,'Emulator displays virtual joystick');
 const viewport=await chrome.evaluate('(()=>{const stage=document.getElementById("viewport"),stick=document.getElementById("joystick"),p=stage.getBoundingClientRect(),j=stick.getBoundingClientRect(),styles=getComputedStyle(stage);return {stage:{x:p.x,y:p.y,width:p.width,height:p.height},stick:{x:j.x,y:j.y,width:j.width,height:j.height},computedHeight:styles.height,position:styles.position,cssViewportHeight:document.documentElement.style.getPropertyValue("--azur-visible-height"),windowHeight:innerHeight,visualHeight:visualViewport?.height,scrollY,appTop:document.getElementById("app").getBoundingClientRect().y};})()');
 console.log('ANDROID_STAGE joystick-layout '+JSON.stringify({pad,viewport}));
 check(pad.y-pad.width/2>=0&&pad.y+pad.width/2<=pad.visibleHeight-4,'Android joystick fully within the visible browser viewport: '+JSON.stringify({pad,viewport}));
 if(Number(API)<=30){
  // Exercise the actual Android OS touch pipeline at several plausible Chrome
  // content-area offsets. Capture pointer events via DevTools console events;
  // never block the old Android renderer with concurrent Runtime.evaluate.
  const screen=adb('shell','wm','size');
  const match=screen.match(/Override size:\s*(\d+)x(\d+)/)||screen.match(/Physical size:\s*(\d+)x(\d+)/);
  if(!match)throw Error('Android screen geometry unavailable '+screen);
  const width=Number(match[1]),height=Number(match[2]),extra=height-pad.vh*pad.dpr;
  console.log('ANDROID_STAGE joystick-geometry '+JSON.stringify({pad,screen,extra}));
  const x=Math.round(pad.x*pad.dpr),destinationX=Math.round((pad.x+pad.dx)*pad.dpr);
  const candidates=[Math.max(0,extra),Math.max(0,extra-48),Math.max(0,extra-96),Math.max(0,extra-144),0,48,96,144,192];
  for(const offset of [...new Set(candidates.map(Math.round))]){
   const y=Math.round(pad.y*pad.dpr+offset);
   if(x<10||x>=width-10||y<10||y>=height-10)continue;
   console.log('ANDROID_STAGE joystick-os-swipe '+JSON.stringify({x,y,destinationX,offset}));
   const proc=spawn('adb',['shell','input','swipe',String(x),String(y),String(destinationX),String(y),'700'],{stdio:'ignore'});
   await new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('exit',code=>code===0?resolve():reject(Error('adb swipe failed '+code)));});
   await sleep(170);
   if(chrome.nativeJoystickMoveSeen){
    report.androidNativeOsSwipes=1;
    report.nativeJoystickOffset=offset;
    break;
   }
  }
  check(chrome.nativeJoystickMoveSeen,'Native Android 11 OS swipe delivers pointer movement to joystick');
  check(chrome.nativeJoystickReleaseSeen,'Native Android 11 OS swipe releases joystick pointer');
 }else{
  await chrome.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x,y:pad.y,id:2}]});
  await chrome.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pad.x+pad.dx,y:pad.y,id:2}]});
  await sleep(450);
  check((await chrome.evaluate('document.getElementById("joystickKnob").style.transform')).includes('calc('),'Native touch drags joystick');
  await chrome.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 if(Number(API)>30)check((await chrome.evaluate('document.getElementById("joystickKnob").style.transform')).includes('translate(-50%, -50%)'),'Native joystick touch releases');console.log('ANDROID_STAGE joystick-complete');
 console.log('ANDROID_STAGE settings-start');await chrome.tap('#quickSettings');
 await chrome.until('!document.getElementById("modal").classList.contains("hidden")');
 await chrome.tap('#motionReduced');await chrome.tap('#highContrast');
 check(await chrome.evaluate('document.documentElement.classList.contains("azur-high-contrast")'),'Native touch enables high contrast');
 await chrome.tap('#closeModal');await chrome.capture('portrait.png');console.log('ANDROID_STAGE settings-complete');
 console.log('ANDROID_STAGE audio-start');await testAudio();console.log('ANDROID_STAGE audio-complete');await frameProbe();console.log('ANDROID_STAGE frame-complete');
 console.log('ANDROID_STAGE landscape-start');await resize(960,540,'landscape');await chrome.capture('landscape.png');await resize(540,960,'portrait');
 adb('shell','input','keyevent','3');await sleep(1700);
 await startChrome();await sleep(2200);
 chrome.close();chrome=await connectChrome();await chrome.send('Page.navigate',{url:page});
 await chrome.until('document.readyState==="complete"&&!!document.getElementById("continue")',40000);
 check(await chrome.evaluate('!document.getElementById("continue").hidden'),'Android background/foreground retains save');
 console.log('ANDROID_STAGE reload-start');await chrome.tap('#continue');
 console.log('ANDROID_STAGE reload-clicked');const restored=await chrome.evaluate('(()=>{const x=JSON.parse(localStorage.getItem("ascii-azur-save-v1"));return {seed:x.worldSeed,team:x.team.length,contrast:document.documentElement.classList.contains("azur-high-contrast")}})()');
 check(restored.seed===initial.seed&&restored.team===initial.team,'Resume preserves same playable v1 save');
 check(restored.contrast,'Android retains high-contrast preference');
 report.restored=restored;await chrome.capture('resumed.png');
 const mem=adb('shell','dumpsys','meminfo','com.android.chrome');evidence('chrome-memory.txt',mem);
 const total=mem.match(/TOTAL PSS:\s*([0-9,]+)/);report.chromeTotalPssKb=total?Number(total[1].replaceAll(',','')):null;
 check(chrome.exceptions.length===0,'No uncaught Android Chrome JavaScript exceptions');
}
try{
 const apps=adb('shell','pm','list','packages','com.android.chrome');
 check(apps.includes('com.android.chrome'),'Android system image provides installed Chrome');
 report.device=adb('shell','getprop','ro.product.model');
 report.androidVersion=adb('shell','getprop','ro.build.version.release');
 report.androidApi=adb('shell','getprop','ro.build.version.sdk');
 adb('reverse','tcp:'+PORT,'tcp:'+PORT);
 adb('forward','tcp:'+DEVTOOLS,'localabstract:chrome_devtools_remote');
 adb('shell','wm','density','240');adb('shell','wm','size','540x960');
 await startChrome();chrome=await connectChrome();
 if(Number(API)<=30){
  // Android 11's stock Chrome 83 supports Canvas2D and does not guarantee a stable
  // accelerated WebGL2 path under software-emulated GitHub Actions GPUs.
  await chrome.send('Page.addScriptToEvaluateOnNewDocument',{source:'(function(){var previous=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind){if(kind==="webgl2")return null;return previous.apply(this,arguments);};})();'});
  console.log('ANDROID_STAGE chrome83-canvas-fallback');
 }
 await chrome.send('Page.navigate',{url:page});
 await resize(540,960,'portrait');await journey();
 report.status='PASS';console.log('ANDROID_EMULATOR_PASS '+JSON.stringify({api:report.androidApi,assertions:report.assertions.length,frame:report.frameProbe,pss:report.chromeTotalPssKb}));
}catch(error){
 try{if(chrome){await chrome.capture('failure.png');report.errors.push(...chrome.exceptions);}}catch{}
 report.status='FAIL';report.failure=String(error?.stack||error);
 console.error('ANDROID_EMULATOR_FAIL '+report.failure);process.exitCode=1;
 try{evidence('adb-logcat.txt',adb('logcat','-d','-t','350'));}catch{}
 try{evidence('failure-adb.png',execFileSync('adb',['exec-out','screencap','-p'],{timeout:20000,maxBuffer:12*1024*1024}));}catch{}
 for(const [name,args] of [
  ['chrome-memory-failure.txt',['shell','dumpsys','meminfo','com.android.chrome']],
  ['chrome-gfx-failure.txt',['shell','dumpsys','gfxinfo','com.android.chrome','framestats']],
  ['chrome-window-failure.txt',['shell','dumpsys','window','windows']]
 ]){try{evidence(name,adb(...args).slice(0,200000));}catch{}}
 console.error('ANDROID_DIAGNOSTICS_RETAINED: OS screenshot, Chrome memory/gfx/window, logcat when accessible');
}finally{
 try{chrome?.close();}catch{}
 try{adb('shell','wm','size','reset');adb('shell','wm','density','reset');}catch{}
 try{adb('forward','--remove','tcp:'+DEVTOOLS);}catch{}
 try{adb('reverse','--remove','tcp:'+PORT);}catch{}
 evidence('report.json',JSON.stringify(report,null,2)+'\n');
 server.close();
}
