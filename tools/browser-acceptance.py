#!/usr/bin/env python3
"""Dependency-free Chromium acceptance for glyph renderer and nested in-game menus."""
import http.server
import pathlib
import shutil
import subprocess
import tempfile
import threading
import urllib.parse

ROOT=pathlib.Path.cwd()
CHROME=next((p for p in (shutil.which('google-chrome'),shutil.which('chromium'),shutil.which('chromium-browser')) if p),None)
if not CHROME: raise SystemExit('Chromium is required for browser acceptance')
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
INJECTION=r'''<script>
window.__azurErrors=[];
window.addEventListener('error',e=>window.__azurErrors.push(e.message));
if(new URLSearchParams(location.search).has('fallback')){
 const real=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:real.call(this,kind,...args)};
}
const params=new URLSearchParams(location.search);
localStorage.setItem('ascii-azur-graphics-v2',JSON.stringify({renderMode:params.get('mode')||'ascii',pixelDetail:'chunky'}));
// Bound headless CPU fallback work: functional acceptance is not a sustained FPS benchmark.
if(params.has('fallback')){
 const nativeFrame=window.requestAnimationFrame.bind(window);let frames=0;
 window.requestAnimationFrame=callback=>frames++<12?nativeFrame(callback):0;
}
window.addEventListener('load',()=>setTimeout(()=>{
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 try{
  const $=id=>document.getElementById(id);
  check($('game')&&$('newGame'),'Missing game bootstrap');
  $('worldSeedInput').value='AZUR-QA-STABLE-SEED';
  $('newGame').click();
  check(document.querySelectorAll('#starters button').length===3,'Missing starters');
  document.querySelector('#starters button').click();
  for(let i=0;i<4;i++)$('closeDialogue').click();
  check($('dialogue').classList.contains('hidden'),'Intro dialogue not dismissed');
  const saved=localStorage.getItem('ascii-azur-save-v1');
  check(!!saved,'No game save');
  $('drawerToggle').click();$('resumeBtn').focus();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
  check(document.activeElement===$('teamBtn'),'Menu ArrowDown did not focus Team');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  check(!$('gameDrawer').classList.contains('open'),'Escape did not close drawer');
  $('teamBtn').click();
  check(!$('modal').classList.contains('hidden'),'Team did not open');
  const skills=document.querySelector('[data-skills]');
  check(!!skills,'Missing skills submenu');skills.click();
  check($('modalTitle').textContent.includes('HABILIDADES'),'Skills did not open');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  check($('modalTitle').textContent==='VÍNCULOS Y RESERVA','Escape did not return to Team');
  $('closeModal').click();
  $('quickSettings').click();
  check(!$('modal').classList.contains('hidden'),'Graphics options did not open');
  const mode=new URLSearchParams(location.search).get('mode')||'ascii';
  const selector=$('renderModeSelect');
  selector.value=mode==='ascii'?'glyph-pixel':'ascii';
  selector.dispatchEvent(new Event('change',{bubbles:true}));
  check(selector.value!==mode,'Opposite rendering mode not selected');
  selector.value=mode;
  selector.dispatchEvent(new Event('change',{bubbles:true}));
  check(selector.value===mode,'Mode selector mismatch');
  check(document.documentElement.dataset.renderMode===mode,'Theme mode mismatch');
  const viewport=$('viewport').getBoundingClientRect(),modal=document.querySelector('#modal .modal').getBoundingClientRect();
  check(modal.left>=viewport.left-2&&modal.right<=viewport.right+2&&modal.top>=viewport.top-2&&modal.bottom<=viewport.bottom+2,'Modal outside viewport');
  check(localStorage.getItem('ascii-azur-save-v1')===saved,'Graphics mode changed persisted gameplay state');
  const info=$('glyphStats').textContent;
  check(info.includes(new URLSearchParams(location.search).has('fallback')?'Canvas2D':'WebGL2'),'Incorrect graphics backend: '+info);
  $('closeModal').click();
  check($('modal').classList.contains('hidden'),'Settings did not close');
  check(window.__azurErrors.length===0,'JS errors: '+window.__azurErrors.join(' | '));
  document.body.dataset.azurQa='PASS';
 }catch(error){document.body.dataset.azurQa='FAIL: '+error.message;console.error(error)}
},700));
</script>'''
if '</head>' not in HTML: raise SystemExit('Missing HTML head')
QA=ROOT/'.azur-browser-acceptance.html'
QA.write_text(HTML.replace('</head>',INJECTION+'</head>',1),encoding='utf-8')
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 for mode in ('ascii','glyph-pixel'):
  for fallback in (False,True):
   query=urllib.parse.urlencode({'mode':mode,**({'fallback':'1'} if fallback else {})})
   url=f'http://127.0.0.1:{server.server_port}/{QA.name}?{query}'
   with tempfile.TemporaryDirectory() as profile:
    args=[CHROME,'--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--window-size=1280,850','--virtual-time-budget=1600',f'--user-data-dir={profile}','--dump-dom',url]
    result=subprocess.run(args,text=True,capture_output=True,timeout=35)
    if result.returncode or 'data-azur-qa="PASS"' not in result.stdout:
     marker=result.stdout.split('data-azur-qa=')[-1][:170] if 'data-azur-qa=' in result.stdout else 'MISSING QA MARKER'
     raise AssertionError(f'{mode} fallback={fallback} failed ({result.returncode}): {marker}\n{result.stderr[-1000:]}')
    print(f'PASS {mode} {"Canvas2D" if fallback else "WebGL2"}',flush=True)
finally:
 server.shutdown()
 QA.unlink(missing_ok=True)
