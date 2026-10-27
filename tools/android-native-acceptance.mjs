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

/** Read an actual on-device accessibility tree, not a simulated HTML picker. */
function nativeNodes() {
  adb('shell','uiautomator','dump','/sdcard/azur-saf.xml');
  const xml=adb('shell','cat','/sdcard/azur-saf.xml');
  return [...xml.matchAll(/<node\b[^>]*\/>/g)].map(m=>{
    const el=m[0],attr=(key)=>el.match(new RegExp(key+'="([^"]*)"'))?.[1]??'';
    const v=attr('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    return {text:attr('text'),desc:attr('content-desc'),id:attr('resource-id'),
      clickable:attr('clickable')==='true',enabled:attr('enabled')!=='false',
      bounds:v?{left:+v[1],top:+v[2],right:+v[3],bottom:+v[4]}:null,
      center:v?{x:Math.round((+v[1]+ +v[3])/2),y:Math.round((+v[2]+ +v[4])/2)}:null};
  });
}
function nativePress(node){
  if(!node?.center)throw Error('Android accessibility node not tappable');
  adb('shell','input','tap',String(node.center.x),String(node.center.y));
}
async function importFromRealAndroidPicker(filename){
  let navigation=false,last='',listModeRequested=false;
  for(let i=0;i<10;i++){
    await delay(700);
    const nodes=nativeNodes();
    last=nodes.map(n=>n.text||n.desc).filter(Boolean).slice(0,40).join(' | ');
    console.log('NATIVE_IMPORT_CHOOSER '+JSON.stringify({pass:i,labels:last.slice(0,850)}));
    // Old Android DocumentsUI defaults to thumbnail GRID and the filename label
    // is not the touch target. Change to LIST first; then the row is selectable.
    const listToggle=nodes.find(n=>/^(List view|Vista de lista)$/i.test(n.desc||n.text));
    if(listToggle && !listModeRequested){
      console.log('NATIVE_IMPORT_GRID_TO_LIST');
      nativePress(listToggle);listModeRequested=true;continue;
    }
    const file=nodes.find(n=>n.text===filename||n.desc===filename);
    if(file){
      // On Android 11 DocumentsUI the filename TextView is not itself a
      // selectable item. Hit the smallest clickable accessibility ancestor.
      const inside=(outer,point)=>outer?.bounds && point
        && outer.bounds.left<=point.x && outer.bounds.right>=point.x
        && outer.bounds.top<=point.y && outer.bounds.bottom>=point.y;
      const area=n=>(n.bounds.right-n.bounds.left)*(n.bounds.bottom-n.bounds.top);
      const parents=nodes.filter(n=>n.clickable && n.enabled && inside(n,file.center))
        .sort((a,b)=>area(a)-area(b));
      const screen=adb('shell','wm','size');
      const screenWidth=Number((screen.match(/(?:Override|Physical) size:\\s*(\\d+)x/)||[])[1]||1080);
      const x=n=>Math.max(20,Math.min(screenWidth-20,n));
      const rowIcons=[
        {center:{x:x(file.bounds.left-105),y:file.center.y},id:'file-type-icon'},
        {center:{x:x(file.bounds.right+275),y:file.center.y},id:'file-row-action'},
        {center:{x:file.center.x,y:Math.max(20,file.center.y+35)},id:'file-row-lower'}
      ];
      const alternatives=[...parents,file,...rowIcons];
      console.log('NATIVE_IMPORT_FILE_TARGETS '+JSON.stringify({file,parents:parents.slice(0,6),rowIcons}));
      if(Number(API)>30){nativePress(alternatives[0]);return;}
      // Android 11 can expose a valid filename accessibility node that
      // cannot receive clicks. Use real OS touches on row/ancestor surfaces
      // and require its document picker to actually leave the foreground.
      for(const candidate of alternatives){
        nativePress(candidate);await delay(700);
        const now=nativeNodes();
        const still=now.some(n=>n.text===filename||n.desc===filename);
        console.log('NATIVE_IMPORT_TAP_RESULT '+JSON.stringify({candidate:candidate.center,stillPickerVisible:still}));
        if(!still)return;
      }
      // DocumentsUI API 30 may expose a visible file as a non-clickable
      // TextView, so accessibility coordinates alone cannot select the row.
      // Give the *native* system file picker keyboard focus and activate it
      // with a real Android key event; no WebView JS or save injection.
      const keys=['KEYCODE_DPAD_CENTER','KEYCODE_ENTER','KEYCODE_DPAD_DOWN','KEYCODE_DPAD_CENTER'];
      for(const key of keys){
        adb('shell','input','keyevent',key);
        await delay(650);
        const nodesNow=nativeNodes();
        const still=nodesNow.some(n=>n.text===filename||n.desc===filename);
        console.log('NATIVE_IMPORT_KEY_RESULT '+JSON.stringify({key,stillPickerVisible:still,labels:nodesNow.map(n=>n.text||n.desc).filter(Boolean).slice(0,14)}));
        if(!still)return;
      }
      // Confirm accessibility state on failure so the next diagnosis is
      // based on a real Android view tree, not guessed touch coordinates.
      throw Error('Real Android SAF document could not be selected by OS touch or key events');
    }
    const downloads=nodes.find(n=>/^(Downloads|Descargas)$/i.test(n.text));
    if(downloads){nativePress(downloads);navigation=true;continue;}
    const roots=nodes.find(n=>/Show roots|Mostrar raíces|Show navigation|Mostrar navegación|Browse files|Explorar archivos|Open navigation drawer/i.test(n.desc+' '+n.text));
    if(roots){nativePress(roots);continue;}
    if(navigation){
      const size=adb('shell','wm','size'),m=size.match(/(\d+)x(\d+)/);
      if(m){const x=Math.round(+m[1]*.55),y=Math.round(+m[2]*.68);adb('shell','input','swipe',String(x),String(y),String(x),String(Math.round(+m[2]*.25)),'300');}
    }
  }
  throw Error('Real Android documents picker did not list '+filename+': '+last);
}

/** Real native ACTION_CREATE_DOCUMENT; the exported save is indexed by the
 * system picker instead of being placed directly by adb in scoped storage. */
async function saveThroughRealAndroidPicker(){
  let last='';
  for(let i=0;i<8;i++){
    await delay(650);
    const nodes=nativeNodes();
    last=nodes.map(n=>n.text||n.desc).filter(Boolean).slice(0,45).join(' | ');
    console.log('NATIVE_EXPORT_CHOOSER '+JSON.stringify({pass:i,labels:last.slice(0,1000)}));
    const button=nodes.find(n=>/^(Save|Guardar)$/i.test(n.text)&&n.enabled);
    if(button){
      nativePress(button);
      await delay(800);
      const after=nativeNodes();
      if(!after.some(n=>/^(Save|Guardar)$/i.test(n.text)))return;
    }
    const downloads=nodes.find(n=>/^(Downloads|Descargas)$/i.test(n.text));
    if(downloads){nativePress(downloads);continue;}
    const roots=nodes.find(n=>/Show roots|Mostrar raíces/i.test(n.desc));
    if(roots){nativePress(roots);continue;}
  }
  throw Error('Unable to save actual game export via Android DocumentsUI: '+last);
}

async function acceptNativeSaveReplacement() {
  for(let i=0;i<5;i++){
    const nodes=nativeNodes();
    const approve=nodes.find(n=>/^(Continuar|Continue|Aceptar|OK)$/i.test(n.text));
    const labels=nodes.map(n=>n.text||n.desc).filter(Boolean);
    console.log('NATIVE_IMPORT_CONFIRM_UI '+JSON.stringify({pass:i,labels:labels.slice(0,35)}));
    // Android 11 truncates/encodes long dialog body accessibility strings.
    // A native dialog with this app's title and explicit positive/negative
    // actions is stronger evidence than matching one translated body word.
    const appTitle=nodes.some(n=>n.text==='ASCII AZUR');
    const decline=nodes.some(n=>/^(Cancelar|Cancel)$/i.test(n.text));
    if(approve && appTitle && decline){nativePress(approve);return;}
    await delay(500);
  }
  throw Error('Native confirmation dialog did not present explicit overwrite approval');
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
 check(version.includes(info.version),'Native and web version match');
 const stage=await active.eval('fetch("package-info.json").then(r=>r.json())');
 check(stage.main_sha256===info.main_sha256 && stage.version===info.version,'Manifest source fingerprint');
 const remote=await active.eval('performance.getEntriesByType("resource").map(x=>x.name).filter(x=>!x.startsWith("https://appassets.androidplatform.net/assets/"))');
 check(remote.length===0,'No remote resources loaded');
 await active.tap('#newGame');
 await active.until('!document.getElementById("openingCinematic").classList.contains("hidden")',15000);
 await active.tap('#cinematicSkip');
 await active.until('!!document.querySelector("#starters button")&&!document.getElementById("starterScreen").classList.contains("hidden")',15000);
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
 const systemExport=Number(API)<=30;
 if(systemExport){
   await saveThroughRealAndroidPicker();
   report.exportCreatedByNativePicker=true;
   check(true,'Android 11 SAF exported a real game save document');
 } else {
   adb('shell','input','keyevent','4');
   await delay(350);
 }
 check((await active.eval('location.origin'))==='https://appassets.androidplatform.net','Native app origin remains isolated after SAF');
 // Round trip through the Android system picker and real application file-input.
 // Source fixture is the player's own newly generated save, with an explicit
 // valid playSeconds sentinel; no privileged insert into app-private storage.
 const originalImport=JSON.parse(await active.eval('localStorage.getItem("ascii-azur-save-v1")'));
 const replacementSeconds=originalImport.playSeconds+1234;
 const fixtureName=systemExport?'ascii-azur-viaje-1.json':'ascii-azur-import-qa.json';
 const targetPath='/sdcard/Download/'+fixtureName;
 if(!systemExport){
   // API 35 separately verifies that an externally provided valid v1 save
   // replaces the current live campaign with a distinct progress sentinel.
   const fixture={...originalImport,playSeconds:replacementSeconds};
   const localFixture=resolve(dir,fixtureName);
   writeFileSync(localFixture,JSON.stringify(fixture));
   adb('push',localFixture,targetPath);
   try{adb('shell','am','broadcast','-a','android.intent.action.MEDIA_SCANNER_SCAN_FILE','-d','file://'+targetPath);}catch{}
 }
 await active.tap('#importBtn');
 await delay(850);
 const pickerImport=adb('shell','dumpsys','activity','activities');
 check(/documentsui|PickActivity/i.test(pickerImport),'Native import launches Android ACTION_OPEN_DOCUMENT');
 await importFromRealAndroidPicker(fixtureName);
 await acceptNativeSaveReplacement();
 if(!systemExport){
   await active.until('JSON.parse(localStorage.getItem("ascii-azur-save-v1")||"{}").playSeconds >= '+replacementSeconds,17000);
 } else {
   await active.until('document.getElementById("toast")?.textContent === "PARTIDA IMPORTADA"',17000);
 }
 const confirmed=JSON.parse(await active.eval('localStorage.getItem("ascii-azur-save-v1")'));
 check(confirmed.team[0].uid===save.team[0].uid && confirmed.worldSeed===save.worldSeed,'Native SAF import preserved valid campaign identity');
 if(!systemExport)check(confirmed.playSeconds>=replacementSeconds,'Real imported JSON replaced the live and durable save');
 else check(await active.eval('document.getElementById("toast")?.textContent === "PARTIDA IMPORTADA"'),'Real system-exported document imported through the game handler');
 if(!systemExport)adb('shell','rm','-f',targetPath);
 report.importRoundtrip={validated:true,source:systemExport?'real-native-export':'synthetic-valid-external-save',playSecondsBefore:originalImport.playSeconds,playSecondsAfter:confirmed.playSeconds};
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
