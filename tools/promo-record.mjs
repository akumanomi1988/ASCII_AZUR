#!/usr/bin/env node
/**
 * Promotional footage of the actual AZUR browser game. The operator stages
 * positions through valid local saves, then uses real UI input for actions.
 * Fails closed if an NPC dialogue or a combat encounter cannot be demonstrated.
 */
import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

const OUT=resolve('artifacts/promo'), frames=join(OUT,'frames');
mkdirSync(frames,{recursive:true});
const report={source:process.env.GITHUB_SHA||'local',scenes:[],frames:0,npcDialogue:false,battle:false,combatActions:0};
let server,chrome,profile,recorder;
const bin=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!bin)throw Error('Chromium unavailable');
if(!spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status===0)console.warn('ffmpeg preflight pending');
const stopProcess=p=>{try{p?.kill('SIGTERM')}catch{}};
class CDP{
 constructor(ws){
  this.ws=ws;this.next=0;this.pending=new Map();this.errors=[];
  ws.addEventListener('message',e=>{
   let m;try{m=JSON.parse(e.data)}catch{return}
   if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result||{})}
   if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params?.exceptionDetails?.text||'page exception');
  });
 }
 async send(method,params={},timeout=20000){
  const id=++this.next;return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method))},timeout);
   this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));
  });
 }
 async eval(expression){
  const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},25000);
  if(r.exceptionDetails)throw Error('Runtime: '+JSON.stringify(r.exceptionDetails).slice(0,500));
  return r.result?.value;
 }
 async until(expression,timeout=30000){
  const end=Date.now()+timeout;
  while(Date.now()<end){try{if(await this.eval(expression))return}catch{}await sleep(200)}
  throw Error('Not ready: '+expression);
 }
 async click(selector){
  const exists=await this.eval('!!document.querySelector('+JSON.stringify(selector)+')');
  if(!exists)throw Error('Missing control '+selector);
  await this.eval('document.querySelector('+JSON.stringify(selector)+').click()');
 }
 async key(key,ms=70){
  const code=key.length===1?'Key'+key.toUpperCase():key;
  await this.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:key.length===1?key.toUpperCase().charCodeAt(0):0});
  await sleep(ms);
  await this.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:key.length===1?key.toUpperCase().charCodeAt(0):0});
 }
}
async function openChrome(){
 profile=mkdtempSync(join(tmpdir(),'azur-promo-'));
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--disable-extensions',
  '--disable-background-networking','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required',
  '--window-size=1280,720','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 let port=0;
 for(let i=0;i<100;i++){
  const p=join(profile,'DevToolsActivePort');if(existsSync(p)){port=Number(readFileSync(p,'utf8').split('\n')[0]);if(port>0)break}
  if(chrome.exitCode!==null)throw Error('Chrome exited');
  await sleep(200);
 }
 if(!port)throw Error('Chrome port timeout');
 let item;
 for(let i=0;i<40;i++){
  try{const p=await (await fetch('http://127.0.0.1:'+port+'/json')).json();item=p.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(item)break}catch{}
  await sleep(100);
 }
 if(!item)throw Error('Chrome target unavailable');
 const ws=new WebSocket(item.webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true})});
 const c=new CDP(ws);await c.send('Page.enable');await c.send('Runtime.enable');
 await c.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,mobile:false,deviceScaleFactor:1});
 return c;
}
function startRecording(c){
 if(recorder)throw Error('Recorder already started');
 let busy=false,active=true,framesDone=0,failures=0;
 const job=setInterval(async()=>{
  if(busy||!active)return;busy=true;
  try{
   const r=await c.send('Page.captureScreenshot',{format:'jpeg',quality:84,captureBeyondViewport:false},16000);
   if(r.data){writeFileSync(join(frames,String(report.frames++).padStart(6,'0')+'.jpg'),Buffer.from(r.data,'base64'));framesDone++}
  }catch(e){failures++;if(failures<=3)console.warn('Screenshot failed',String(e))}
  finally{busy=false}
 },125);
 recorder={stop:async()=>{active=false;clearInterval(job);for(let i=0;i<60&&busy;i++)await sleep(100);recorder=null;return framesDone}};
}
async function scene(c,label,fn){
 const before=report.frames;
 startRecording(c);
 try{await fn()}finally{const n=await recorder.stop();report.scenes.push({label,frames:n});console.log('PROMO_SCENE',label,n)}
 if(report.frames===before)throw Error('No captured frames in '+label);
}
async function stageSave(c,zone,x,y){
 await c.eval('(()=>{const k="ascii-azur-save-v1";const s=JSON.parse(localStorage.getItem(k)||"null");if(!s||!s.team?.length)throw Error("missing save");s.zone='+JSON.stringify(zone)+';s.x='+JSON.stringify(x)+';s.y='+JSON.stringify(y)+';delete s.activeBattle;localStorage.setItem(k,JSON.stringify(s));return true})()');
 await c.send('Page.reload',{ignoreCache:true});
 await c.until('document.readyState==="complete"&&document.documentElement.dataset.azurReady==="true"&&document.getElementById("continue")?.hidden===false',45000);
 await c.click('#continue');await c.until('document.getElementById("titleScreen").classList.contains("hidden")');
}
async function ready(c){await c.until('document.readyState==="complete"&&document.documentElement.dataset.azurReady==="true"&&!!document.getElementById("newGame")',45000)}
async function main(){
 server=spawn('python3',['-m','http.server','18979','--bind','127.0.0.1'],{stdio:'ignore'});
 for(let n=0;n<60;n++){try{const r=await fetch('http://127.0.0.1:18979/');if(r.ok)break}catch{}await sleep(200)}
 const c=await openChrome();
 try{
  await c.send('Page.navigate',{url:'http://127.0.0.1:18979/?azur_promo=20261107'});
  await ready(c);
  await c.eval('localStorage.setItem("ascii-azur-graphics-v2",JSON.stringify({renderMode:"pixel",pixelDetail:"fine"}))');
  await c.send('Page.reload',{ignoreCache:true});await ready(c);
  await scene(c,'Title and prologue',async()=>{
   await sleep(1800);
   await c.eval('document.getElementById("worldSeedInput").value="AZUR-PROMO-2026"');
   await c.click('#newGame');
   await c.until('!document.getElementById("openingCinematic").classList.contains("hidden")');
   await sleep(4700);
  });
  await c.click('#cinematicSkip');
  await c.until('!!document.querySelector("#starters button")&&!document.getElementById("starterScreen").classList.contains("hidden")');
  await scene(c,'Choose creature and opening dialogues',async()=>{
   await sleep(1500);await c.click('#starters button');
   await c.until('!!JSON.parse(localStorage.getItem("ascii-azur-save-v1")||"null")?.team?.length',30000);
   for(let i=0;i<5;i++){
    const open=await c.eval('!document.getElementById("dialogue").classList.contains("hidden")');
    if(!open)break;
    await sleep(1450);await c.click('#closeDialogue');
   }
   await sleep(1250);
  });
  const archivist=await c.eval('(async()=>{const m=await import("./dist/world.js");const l=m.ZONES.village.landmarks.find(x=>x.npcId==="archivist");return l?{x:l.x,y:l.y}:null})()');
  if(!archivist)throw Error('Archivist is missing from the generated game world');
  await stageSave(c,'village',archivist.x-1,archivist.y);
  await scene(c,'Exploration and The Archivist',async()=>{
   await c.key('a',280);await sleep(350);await c.key('d',350);await sleep(400);
   await c.click('#touchInteract');
   await c.until('!document.getElementById("dialogue").classList.contains("hidden")',10000);
   const title=await c.eval('document.getElementById("diaTitle").textContent');
   console.log('PROMO_NPC_DIALOGUE',title);
   report.npcDialogue=true;
   report.npcTitle=title;
   for(let i=0;i<5;i++){
    if(await c.eval('document.getElementById("dialogue").classList.contains("hidden")'))break;
    await sleep(1550);await c.click('#closeDialogue');
   }
   await sleep(550);
  });
  // Stage a checkpoint in the actual generated forest; no image manipulation.
  await stageSave(c,'forest',8,16);
  await scene(c,'Forest exploration',async()=>{
   await sleep(1150);await c.key('d',1500);await sleep(750);await c.key('a',450);await sleep(550);
  });
  const roamer=await c.eval('(async()=>{const m=await import("./dist/world/encounters.js");const s=JSON.parse(localStorage.getItem("ascii-azur-save-v1"));const e=m.visibleEncounters("forest",s.worldSeed)[0];return e?{x:e.x,y:e.y,id:e.id,species:e.speciesId}:null})()');
  if(!roamer)throw Error('No real forest encounter generated');
  await stageSave(c,'forest',roamer.x-1.2,roamer.y);
  await scene(c,'Live tactical battle',async()=>{
   await sleep(550);await c.key('e');
   await c.until('!document.getElementById("battle").classList.contains("hidden")',12000);
   report.battle=true;
   report.enemy=await c.eval('document.getElementById("enemyName").textContent');
   await sleep(2100);
   for(let i=0;i<4;i++){
    if(await c.eval('document.getElementById("battle").classList.contains("hidden")'))break;
    let menu=await c.eval('document.getElementById("battleActions").dataset.menu');
    if(menu==='commands'){await c.click('#battleActions button');await sleep(500)}
    const hasMove=await c.eval('!!Array.from(document.querySelectorAll("#battleActions button")).find(x=>!x.disabled&&!x.textContent.includes("COMANDOS"))');
    if(!hasMove)break;
    await c.eval('Array.from(document.querySelectorAll("#battleActions button")).find(x=>!x.disabled&&!x.textContent.includes("COMANDOS")).click()');
    report.combatActions++;
    await sleep(2800);
   }
   await sleep(1100);
  });
  if(!report.npcDialogue||!report.battle||report.combatActions<1)throw Error('Gameplay acceptance gates failed');
  if(report.frames<80)throw Error('Insufficient real frames captured: '+report.frames);
  if(c.errors.length)console.warn('Browser exceptions',c.errors.slice(0,5));
  report.status='CAPTURED';
 }finally{c.ws.close()}
 const ordered=readdirSync(frames).filter(f=>f.endsWith('.jpg')).sort();
 if(ordered.length!==report.frames)throw Error('Incomplete frames');
 const voice=join(OUT,'narration.wav');
 const script='Hay mundos que se apagan cuando nadie los recuerda. En Azur, cada paso revela un secreto. En Arken, el Archivista custodia las últimas palabras. Pero el bosque esconde criaturas que todavía recuerdan tu nombre. Elige un compañero. Explora lo desconocido. Domina técnicas elementales. Y decide qué historia merece sobrevivir. ASCII Azur. The Unwritten.';
 const speech=spawnSync('espeak-ng',['-v','es','-s','142','-a','132','-w',voice,script],{stdio:'pipe'});
 if(speech.status!==0)console.warn('Voice narration unavailable',String(speech.stderr).slice(0,250));
 const musicDir=resolve('artifacts/score-master');
 const tracks=existsSync(musicDir)?readdirSync(musicDir).filter(n=>/\.(wav|mp3|ogg)$/i.test(n)):[];
 const music=tracks.length?join(musicDir,tracks.find(n=>/explor|forest|ambient|title|main/i.test(n))||tracks[0]):null;
 const playbackFrameRate=4; // Preserve approximate real-time pacing in headless software-rendered footage.
 const sources=['-framerate',String(playbackFrameRate),'-i',join(frames,'%06d.jpg')];
 const filters=[];
 if(music){sources.push('-stream_loop','-1','-i',music);filters.push('[1:a]volume=0.20[m]')}
 if(speech.status===0){
  sources.push('-i',voice);
  if(music)filters.push('[2:a]volume=1.6[v]','[m][v]amix=inputs=2:duration=first:dropout_transition=1[a]');
  else filters.push('['+(sources.filter(x=>x==='-i').length-1)+':a]volume=1.6[a]');
 }else if(music)filters.push('[m]anull[a]');
 const withAudio=!!music||speech.status===0;
 const base=join(OUT,'azur-gameplay-youtube.mp4');
 const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
 const titles=[
  ['UN MUNDO ESCRITO EN CENIZA',0,4.5],
  ['ELIGE TU VINCULO',5,10],
  ['CADA NOMBRE TIENE UNA HISTORIA',11,15],
  ['EXPLORA LO DESCONOCIDO',16,20.5],
  ['DOMINA LAS TECNICAS ELEMENTALES',21,27.8]
 ];
 const overlays=titles.map(([text,a,b],i)=>{
  const path=join(OUT,'title-'+i+'.txt');writeFileSync(path,text);
  return "drawtext=fontfile="+font+":textfile="+path+":fontsize=26:fontcolor=white:shadowcolor=black@0.95:shadowx=2:shadowy=3:box=1:boxcolor=black@0.65:boxborderw=15:x=(w-text_w)/2:y=h-90:enable='between(t,"+a+","+b+")'";
 });
 const baseFilter='scale=1280:720,eq=contrast=1.10:saturation=1.16,'+overlays.join(',');
 const args=['-y','-hide_banner','-loglevel','error',...sources];
 if(filters.length){args.push('-filter_complex',filters.join(';'))}
 args.push('-map','0:v');
 if(withAudio)args.push('-map','[a]');
 args.push('-vf',baseFilter,'-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-r','24');
 if(withAudio)args.push('-c:a','aac','-b:a','192k');
 args.push('-shortest','-movflags','+faststart',base);
 const make=spawnSync('ffmpeg',args,{encoding:'utf8',timeout:240000});
 if(make.status!==0)throw Error('ffmpeg main: '+String(make.stderr).slice(-1700));
 const short=join(OUT,'azur-gameplay-tiktok.mp4');
 const vertical=spawnSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-ss','2','-i',base,
  '-t','25','-filter_complex','[0:v]split=2[original][back];[back]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=30:12,eq=brightness=-0.2[bg];[original]scale=720:-2[fg];[bg][fg]overlay=x=(W-w)/2:y=(H-h)/2,format=yuv420p[out]',
  '-map','[out]','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','21','-r','24','-c:a','aac','-b:a','160k','-movflags','+faststart',short],{encoding:'utf8',timeout:240000});
 if(vertical.status!==0)throw Error('ffmpeg TikTok: '+String(vertical.stderr).slice(-1700));
 report.status='SUCCESS';report.approximateDurationSeconds=Math.round(report.frames/playbackFrameRate);report.outputs=[base,short].map(p=>({name:p.split('/').pop()}));
 writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('AZUR_PROMO_SUCCESS',JSON.stringify(report));
}
try{await main()}catch(e){
 report.status='FAILED';report.error=String(e?.stack||e);
 writeFileSync(join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.error('AZUR_PROMO_FAIL',report.error);
 process.exitCode=1;
}finally{stopProcess(chrome);stopProcess(server)}
