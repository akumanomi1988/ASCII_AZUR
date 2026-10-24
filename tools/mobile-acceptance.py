#!/usr/bin/env python3
"""Real Chromium mobile-viewport acceptance; simulated touch is NOT device QA.

No Playwright/Selenium dependency. Uses isolated browser profiles and a local
origin to exercise production HTML, ES modules, save reload and the performance UI.
"""
from __future__ import annotations
import http.server, json, os, pathlib, shutil, signal, subprocess, tempfile, threading, urllib.parse

ROOT=pathlib.Path(__file__).resolve().parent.parent
CHROME=next((v for v in ('google-chrome','chromium','chromium-browser') if shutil.which(v)),None)
if not CHROME:
    raise SystemExit('Chromium required for mobile viewport acceptance')
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SCRIPT=r'''
<script>
(()=>{
 const params=new URLSearchParams(location.search);
 const expected=params.get('orientation');
 const $=id=>document.getElementById(id);
 const check=(yes,message)=>{if(!yes)throw Error(message)};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const errors=[];
 addEventListener('error',e=>errors.push(String(e.message||e.error)));
 addEventListener('unhandledrejection',e=>errors.push('unhandled: '+String(e.reason)));
 const submit=async report=>{
   await fetch('/__mobile_result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
 };
 addEventListener('load',()=>setTimeout(async()=>{
  try{
   check(matchMedia('(orientation: '+expected+')').matches,'Wrong orientation '+innerWidth+'x'+innerHeight+' for '+expected);
   check($('viewport').getBoundingClientRect().width>300,'Mobile game viewport collapsed');
   if(sessionStorage.getItem('azur-mobile-qa')!=='resume'){
    $('worldSeedInput').value='5507';
    $('newGame').click();
    const starter=document.querySelector('#starters button');
    check(!!starter,'Starter cannot be selected');starter.click();
    for(let i=0;i<9&&!$('dialogue').classList.contains('hidden');i++)$('closeDialogue').click();
    check($('dialogue').classList.contains('hidden'),'Opening cinematic cannot be dismissed with touch');
    const before=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
    check(before.team.length===1,'Starter missing from saved game');
    // Synthetic PointerEvents exercise the same joystick listeners, but not
    // a physical digitizer or operating-system touch event pipeline.
    const pad=$('joystick'),knob=$('joystickKnob'),rect=pad.getBoundingClientRect();
    check(rect.width>=35&&rect.height>=35,'Virtual joystick not exposed in mobile viewport');
    const originalCapture=pad.setPointerCapture;
    pad.setPointerCapture=()=>{}; // Synthetic PointerEvents have no active native pointer to capture.
    const pointer=(type,x,y)=>pad.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',clientX:x,clientY:y}));
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    pointer('pointerdown',cx,cy);
    pointer('pointermove',cx+rect.width*.25,cy);
    check(knob.style.transform.includes('calc('),'Joystick did not translate during synthetic drag');
    pointer('pointerup',cx+rect.width*.25,cy);
    check(knob.style.transform.includes('translate(-50%, -50%)'),'Joystick did not release');
    pad.setPointerCapture=originalCapture;
    $('settings').click();
    check(!$('modal').classList.contains('hidden'),'Mobile settings inaccessible');
    check(!!$('openEnduranceLab'),'No local performance measurement control');
    const modal=document.querySelector('#modal .modal').getBoundingClientRect(),viewport=$('viewport').getBoundingClientRect();
    check(modal.left>=viewport.left-4&&modal.right<=viewport.right+4,'Modal outside mobile viewport horizontally');
    check(modal.top>=viewport.top-4&&modal.bottom<=viewport.bottom+4,'Modal outside mobile viewport vertically');
    $('motionReduced').click();
    $('highContrast').click();
    check(document.documentElement.classList.contains('azur-high-contrast'),'Contrast control failed');
    $('openEnduranceLab').click();
    check($('modalTitle').textContent.includes('ESTABILIDAD'),'Endurance laboratory missing');
    $('labStart').click();
    $('closeModal').click();
    await sleep(1250);
    $('settings').click();$('openEnduranceLab').click();
    check($('modalContent').textContent.includes('REGISTRANDO'),'Session failed to begin');
    $('labStop').click();
    check($('modalContent').textContent.includes('DETENIDO'),'Session failed to stop');
    check(!$('labExport').disabled,'No collected performance samples available to export');
    $('labExport').click();
    $('closeModal').click();
    check(errors.length===0,'Browser JS errors: '+errors.join(' | '));
    sessionStorage.setItem('azur-mobile-qa','resume');
    sessionStorage.setItem('azur-mobile-seed',String(before.worldSeed));
    location.reload();
    return;
   }
   check(!$('continue').hidden,'Saved campaign not offered after mobile reload');
   $('continue').click();
   const after=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
   check(after.worldSeed===Number(sessionStorage.getItem('azur-mobile-seed')),'Seed changed across mobile reload');
   check(after.team.length===1,'Creature lost during mobile reload');
   check(after.inventory.seals===5&&after.inventory.tonics===3,'Measurement changed game supplies');
   check(after.flags.length===0,'Laboratory unexpectedly mutated quest flags');
   $('settings').click();
   check(document.documentElement.classList.contains('azur-high-contrast'),'Contrast setting not persisted');
   check($('motionReduced').checked,'Motion setting not persisted');
   $('openEnduranceLab').click();
   check($('modalContent').textContent.includes('DETENIDO'),'Measurement session leaked across reload');
   check($('labExport').disabled,'Volatile local performance data improperly survived reload');
   check(errors.length===0,'JS errors on resume: '+errors.join(' | '));
   const report={status:'PASS',orientation:expected,width:innerWidth,height:innerHeight,
    mobileViewport:true,syntheticPointerJoystick:true,settingsAccessible:true,
    localMeasurement:true,localExport:true,saveReload:true,settingsPersistence:true,
    physicalDevice:false,errors:errors.length};
   await submit(report);
  }catch(error){try{await submit({status:'FAIL',orientation:expected,message:String(error.stack||error),width:innerWidth,height:innerHeight});}catch{}}
 },300));
})();
</script>
'''
if '</head>' not in HTML:
    raise SystemExit('Missing HTML head')
PAGE=ROOT/'.azur-mobile-acceptance.html'
PAGE.write_text(HTML.replace('</head>',SCRIPT+'</head>',1),encoding='utf-8')
done=threading.Event()
reports=[]
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
    def do_POST(self):
        if urllib.parse.urlparse(self.path).path!='/__mobile_result':
            self.send_error(404);return
        raw=self.rfile.read(int(self.headers.get('Content-Length','0')))
        reports.append(json.loads(raw.decode('utf-8')))
        done.set()
        self.send_response(204);self.end_headers()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    for orientation,width,height in [('landscape',960,540),('portrait',480,850)]:
        done.clear();reports.clear()
        query=urllib.parse.urlencode({'orientation':orientation})
        url=f'http://127.0.0.1:{server.server_port}/{PAGE.name}?{query}'
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
            args=[CHROME,'--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage',
                '--disable-background-networking','--touch-events=enabled','--autoplay-policy=no-user-gesture-required',
                '--no-first-run',f'--window-size={width},{height}',f'--user-data-dir={profile}',url]
            process=subprocess.Popen(args,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
            try:
                for _ in range(95):
                    if done.wait(1):break
                    if process.poll() is not None:raise AssertionError('Chromium exited before '+orientation+' result')
                else:raise TimeoutError('No '+orientation+' browser acceptance after 95s')
            finally:
                try:os.killpg(process.pid,signal.SIGTERM)
                except ProcessLookupError:pass
                try:process.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    try:os.killpg(process.pid,signal.SIGKILL)
                    except ProcessLookupError:pass
                    process.wait(timeout=5)
        if len(reports)!=1 or reports[0].get('status')!='PASS':
            raise AssertionError(f'{orientation}: {reports}')
        evidence=ROOT/'artifacts'/'mobile-acceptance'
        evidence.mkdir(parents=True,exist_ok=True)
        (evidence/(orientation+'.json')).write_text(json.dumps(reports[0],indent=2,sort_keys=True)+'\n',encoding='utf-8')
        print('MOBILE_VIEWPORT_PASS '+json.dumps(reports[0],sort_keys=True),flush=True)
finally:
    server.shutdown();server.server_close()
    PAGE.unlink(missing_ok=True)
