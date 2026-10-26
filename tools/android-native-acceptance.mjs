#!/usr/bin/env node
/** Real installed APK boot, touch, offline resume and Storage Access Framework gate. */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const ROOT=process.cwd(),API=process.env.ANDROID_API_LEVEL||'unknown';
const pkg='dev.akumano.asciiazur',PORT=19293,dir=resolve(ROOT,'artifacts/android-emulator',API);
mkdirSync(dir,{recursive:true});
const report={schema:'ascii-azur-native-apk-v1',api:API,physicalDevice:false,steps:[],errors:[]};
const check=(ok,label)=>{if(!ok)throw Error(label);report.steps.push(label);};
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:30000}).trim();

let active,forwarded=false;
class CDP {
 constructor(ws){this.ws=ws;this.id=0;this.pending=new Map();this.exceptions=[];
  ws.addEventListener('message',event=>{let msg;try{msg=JSON.parse(event.data);}catch{return;}
   if(msg.id){const p=this.pending.get(msg.id);if(p){this.pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result??{});}}
   if(msg.method==='Runtime.exceptionThrown')this.exceptions.push(msg.params?.exceptionDetails?.text??'JS failure');
  });
 }
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;
  const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timed out '+method));},45000);
  this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));
 });}
 async eval(expr){const r=await this.send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('JS '+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
 }
 async tap(selector){
  const location=await this.eval('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');if(!e)return null;const intro=e.closest("#titleScreen");if(intro)intro.scrollTop=0;e.scrollIntoView({block:"center",inline:"nearest",behavior:"auto"});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,w:r.width,h:r.height,dpr:devicePixelRatio,vh:innerHeight,hit:document.elementFromPoint(x,y)?.id||document.elementFromPoint(x,y)?.tagName}})()');
  if(!location||location.w<4||location.h<4)throw Error('Not visible: '+selector);
  console.log('NATIVE_TAP_TARGET '+JSON.stringify({selector,location}));
  await this.eval('(()=>{window.__nativeTapped=false;window.__nativeTarget='+JSON.stringify(selector)+';if(!window.__nativeTapProbe){document.addEventListener("click",e=>{if(e.target.closest(window.__nativeTarget))window.__nativeTapped=true},true);window.__nativeTapProbe=true;}})()');
  // Android 11 WebView CDP touch can freeze its inspector; native OS taps
  // are the supported and stricter route here (real pointerdown + click).
  let received=false;
  if (Number(API)>30) {
    await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:location.x,y:location.y,id:1}]});
    await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await delay(300);
    received=await this.eval('window.__nativeTapped===true');
  }
  if(!received){
    const size=adb('shell','wm','size');
    const match=size.match(/Override size:\s*(\d+)x(\d+)/)||size.match(/Physical size:\s*(\d+)x(\d+)/);
    if(!match)throw Error('Unknown Android display size: '+size);
    const actualHeight=Number(match[2]),actualWidth=Number(match[1]);
    const extra=Math.max(0,actualHeight-location.vh*location.dpr);
    const offsets=[extra/2,0,extra-24*location.dpr,extra-48*location.dpr,extra];
    for(const offset of [...new Set(offsets.map(Math.round))]){
      const x=Math.round(location.x*location.dpr),y=Math.round(location.y*location.dpr+offset);
      if(x<0||x>=actualWidth||y<0||y>=actualHeight)continue;
      console.log('NATIVE_OS_TAP '+JSON.stringify({selector,x,y,offset}));
      adb('shell','input','tap',String(x),String(y));
      await delay(350);
      received=await this.eval('window.__nativeTapped===true');
      if(received)break;
    }
  }
  if(!received)throw Error('Native touch did not activate '+selector+' '+JSON.stringify(location));
  console.log('NATIVE_TAP_PASS '+selector);
 }
 async until(js,timeout=25000){const begin=Date.now();while(Date.now()-begin<timeout){try{if(await this.eval(js))return;}catch{}await delay(300);}throw Error('WebView state timeout: '+js);}
 close(){this.ws.close();}
}
async function connect() {
 const start=Date.now();let lastError='',lastLog=0;
 while(Date.now()-start<60000){
  try{
   const pid=adb('shell','pidof',pkg).trim().split(/\s+/)[0];
   if(!pid)throw Error('Process not started');
   const sockets=adb('shell','cat','/proc/net/unix').split('\n').filter(x=>x.includes('webview_devtools_remote')).join('\n');
   // The Android 11 WebView socket PID may not equal the hosting app PID.
   // Resolve all sockets, accepting ONLY this game's trusted bundled origin.
   const names=[...new Set(sockets.split(String.fromCharCode(10))
     .map(x=>x.match(/(@?webview_devtools_remote_\d+)\s*$/)?.[1]).filter(Boolean))]
     .sort((a,b)=>Number(b.endsWith('_'+pid))-Number(a.endsWith('_'+pid)));
   if(!names.length)throw Error('No debug WebView socket');
   let tab=null;
   for(const name of names){
     try {
       if(forwarded)adb('forward','--remove','tcp:'+PORT);
       adb('forward','tcp:'+PORT,'localabstract:'+name.replace(/^@/,''));
       forwarded=true;
       const response=await fetch('http://127.0.0.1:'+PORT+'/json/list',{signal:AbortSignal.timeout(3500)});
       const candidates=await response.json();
       tab=candidates.find(x=>x.webSocketDebuggerUrl
         && String(x.url||'').startsWith('https://appassets.androidplatform.net/assets/'));
       if(tab)break;
     } catch {}
   }
   if(!tab)throw Error('No trusted game page among '+names.length+' WebView sockets');
   const ws=new WebSocket(tab.webSocketDebuggerUrl);
   await new Promise((ok,fail)=>{const timer=setTimeout(()=>fail(Error('WebSocket open')),8000);ws.addEventListener('open',()=>{clearTimeout(timer);ok();},{once:true});ws.addEventListener('error',()=>fail(Error('WebSocket failed')),{once:true});});
   const c=new CDP(ws);await c.send('Runtime.enable');await c.send('Page.enable');try{await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});}catch{}return c;
  }catch(err){lastError=String(err);
   if(Date.now()-lastLog>12000){lastLog=Date.now();let process='unknown';try{process=adb('shell','pidof',pkg).trim();}catch{}console.log('NATIVE_CDP_WAIT '+JSON.stringify({lastError:lastError.slice(0,230),process}));}
   await delay(700);}
 }
 throw Error('Could not connect to the installed app native WebView: '+lastError);
}
const info=JSON.parse(readFileSync('android/app/src/main/assets/package-info.json','utf8'));
const apk=resolve('android/app/build/outputs/apk/debug/app-debug.apk');
try{
 check(info.schema==='ascii-azur-android-package-v1','Manifest validated');
 const bytes=readFileSync(apk);check(bytes.length>200_000,'Compiled APK exists');
 const {createHash}=await import('node:crypto');
 report.apkSha256=createHash('sha256').update(bytes).digest('hex');
 adb('install','-r',apk);
 adb('shell','am','force-stop',pkg);
 adb('shell','am','start','-n',pkg+'/dev.akumano.asciiazur.MainActivity');
 active=await connect();
 await active.until('document.readyState==="complete" && !!document.querySelector("#newGame")',40000);
 const origin=await active.eval('location.origin');check(origin==='https://appassets.androidplatform.net','Packaged HTTPS origin');
 const version=await active.eval('document.querySelector(".live-tag")?.textContent||""');
 check(version.includes('0.67.0'),'Native and web version match');
 const stage=await active.eval('fetch("package-info.json").then(r=>r.json())');
 check(stage.main_sha256===info.main_sha256 && stage.version===info.version,'Manifest source fingerprint');
 const remote=await active.eval('performance.getEntriesByType("resource").map(x=>x.name).filter(x=>!x.startsWith("https://appassets.androidplatform.net/assets/"))');
 check(remote.length===0,'No remote resources loaded');
 await active.tap('#newGame');
 await active.until('!!document.querySelector("#starters button")',15000);
 await active.tap('#starters button');
 await active.until('document.querySelector("#titleScreen")?.classList.contains("hidden")',15000);
 check(await active.eval('document.querySelector("#titleScreen").classList.contains("hidden")'),'Gameplay surface opened after native starter touch');
 for(let i=0;i<20;i++){if(await active.eval('document.getElementById("dialogue")?.classList.contains("hidden")'))break;await active.tap('#closeDialogue');}
 await active.until('!!localStorage.getItem("ascii-azur-save-v1")',15000);
 const save=JSON.parse(await active.eval('localStorage.getItem("ascii-azur-save-v1")'));
 check(save.version===1 && save.team.length===1 && typeof save.zone==='string','Actual native-touch game saved');
 report.saved={version:save.version,zone:save.zone,team:save.team.length};
 // wm size alone does not rotate Android 11. Change native OS rotation.
 adb('shell','settings','put','system','accelerometer_rotation','0');
 adb('shell','settings','put','system','user_rotation','0');
 adb('shell','wm','size','820x1280');await delay(1800);
 const portrait=await active.eval('({w:innerWidth,h:innerHeight,angle:screen.orientation?.angle??null})');
 adb('shell','settings','put','system','user_rotation','1');
 adb('shell','wm','size','1280x820');await delay(1800);
 const landscape=await active.eval('({w:innerWidth,h:innerHeight,angle:screen.orientation?.angle??null})');
 report.rotation={portrait,landscape};
 check(portrait.h>portrait.w && landscape.w>landscape.h,'Real OS rotation and app viewport response');
 check(!!(await active.eval('localStorage.getItem("ascii-azur-save-v1")')),'Save survives device rotation');
 await active.tap('#drawerToggle');
 await active.until('document.getElementById("gameDrawer")?.classList.contains("open")',8000);
 check(await active.eval('document.getElementById("gameDrawer").classList.contains("open")'),'Landscape native drawer remains touch-operable');
 await active.tap('#drawerClose');
 active.close();active=null;
 // Finish the extreme resized-viewport stress before the separately tested
 // normal-device offline relaunch. Do not rely on a 241px-height title menu.
 adb('shell','wm','size','reset');await delay(1100);
 adb('shell','am','force-stop',pkg);
 adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');
 adb('shell','am','start','-n',pkg+'/dev.akumano.asciiazur.MainActivity');
 // A WebView DevTools socket can become stale across process restart.
 // Retry just the inspector once after a bounded cold start, never gameplay steps.
 try { active=await connect(); }
 catch (error) {
   report.inspectorRecovery={reason:String(error).slice(0,200),attempts:1};
   console.log('NATIVE_DEBUG_REATTACH '+JSON.stringify(report.inspectorRecovery));
   adb('shell','am','force-stop',pkg);
   await delay(1000);
   adb('shell','am','start','-n',pkg+'/dev.akumano.asciiazur.MainActivity');
   active=await connect();
 }
 await active.until('document.readyState==="complete" && !!document.querySelector("#continue")',40000);
 await active.tap('#continue');
 await active.until('document.querySelector("#titleScreen")?.classList.contains("hidden")',18000);
 const resumed=JSON.parse(await active.eval('localStorage.getItem("ascii-azur-save-v1")'));
 check(resumed.team[0].uid===save.team[0].uid&&resumed.worldSeed===save.worldSeed,'Offline native process restart preserves saved campaign');
 await active.tap('#drawerToggle');
 await active.until('!!document.querySelector("#exportBtn")',6000);
 await active.tap('#exportBtn');
 await delay(850);
 const activityState=adb('shell','dumpsys','activity','activities');
 const picker=activityState.split(String.fromCharCode(10)).filter(x=>/documentsui|PickActivity|CREATE_DOCUMENT|topResumedActivity|mResumedActivity/i.test(x)).slice(-15).join(String.fromCharCode(10));
 report.pickerEvidence=picker.slice(0,1400);
 check(/documentsui|PickActivity/i.test(picker),'JSON export opens Android document creation picker');
 adb('shell','input','keyevent','4');
 await delay(350);
 check((await active.eval('location.origin'))==='https://appassets.androidplatform.net','Native app origin remains isolated after SAF');
 report.javascriptExceptions=active.exceptions;
 check(active.exceptions.length===0,'No JavaScript errors');
 console.log('ANDROID_NATIVE_APK_PASS '+JSON.stringify({api:API,checks:report.steps.length,apkSha256:report.apkSha256,offline:true}));
}catch(error){
 report.errors.push(String(error));console.error('ANDROID_NATIVE_APK_FAIL '+String(error));
 try{
  const log=adb('logcat','-d','-t','1200');
  writeFileSync(resolve(dir,'native-logcat.txt'),log);
  console.log('NATIVE_LOGCAT_EVIDENCE '+log.split('\\n').filter(x=>/chromium|WebView|ActivityManager|lowmemory|OOM|ANR|crash|FATAL EXCEPTION|GL_|BufferQueue/i.test(x)).slice(-30).join('\\n').slice(-7000));
 }catch(logError){console.error('NATIVE_LOGCAT_UNAVAILABLE '+String(logError));}
 try{const mem=adb('shell','dumpsys','meminfo',pkg);writeFileSync(resolve(dir,'native-memory.txt'),mem);}catch{}
 try{const picture=execFileSync('adb',['exec-out','screencap','-p'],{timeout:18000,maxBuffer:8_000_000});writeFileSync(resolve(dir,'native-failure.png'),picture);}catch{}
 try{report.processAtFailure=adb('shell','pidof',pkg).trim();}catch{report.processAtFailure='not-running';}
 process.exitCode=1;
}
finally{
 try{active?.close();}catch{}
 try{adb('shell','wm','size','reset');adb('shell','settings','put','system','accelerometer_rotation','1');adb('shell','svc','wifi','enable');adb('shell','svc','data','enable');}catch{}
 try{if(forwarded)adb('forward','--remove','tcp:'+PORT);}catch{}
 writeFileSync(resolve(dir,'native-apk.json'),JSON.stringify(report,null,2));
}
