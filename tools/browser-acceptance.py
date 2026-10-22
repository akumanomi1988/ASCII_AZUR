#!/usr/bin/env python3
"""Dependency-free Chromium acceptance for glyph renderer and nested in-game menus."""
import http.server
import base64
import struct
import pathlib
import shutil
import subprocess
import tempfile
import threading
import urllib.parse

ROOT=pathlib.Path.cwd()
OUT=ROOT/'artifacts'/'browser-acceptance'
OUT.mkdir(parents=True,exist_ok=True)
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
// Headless acceptance intentionally captures a bounded number of real rendered frames.
// Sustained-performance profiling is a separate measurement, not this CI interaction gate.
{
 const nativeFrame=window.requestAnimationFrame.bind(window);let frames=0;
 const frameBudget=params.has('fallback')?12:20;
 window.requestAnimationFrame=callback=>frames++<frameBudget?nativeFrame(callback):0;
}
window.addEventListener('load',()=>setTimeout(async()=>{
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
  // Allow an actual animation frame after scene transition before capturing pixels.
  await new Promise(resolve=>setTimeout(resolve,180));
  const saved=localStorage.getItem('ascii-azur-save-v1');
  check(!!saved,'No game save');
  const params=new URLSearchParams(location.search);
  if(params.has('fallback')){
   const ctx=$('game').getContext('2d'),width=$('game').width,height=$('game').height;
   let painted=0;
   for(const [cx,cy] of [[.2,.2],[.5,.5],[.8,.8]]){
    const rgba=ctx.getImageData(Math.floor(width*cx),Math.floor(height*cy),1,1).data;
    if(rgba[3]>0&&rgba[0]+rgba[1]+rgba[2]>0)painted++;
   }
   check(painted>0,'Renderer returned an empty/transparent Canvas2D frame');
  }
  const capture=await fetch('/__qa_capture?mode='+encodeURIComponent(params.get('mode')||'ascii')+'&fallback='+(params.has('fallback')?'1':'0'),{method:'POST',body:$('game').toDataURL('image/png')});
  check(capture.ok,'Canvas screenshot could not be collected');
  $('drawerToggle').click();$('resumeBtn').focus();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
  check(document.activeElement===$('teamBtn'),'Menu ArrowDown did not focus Team');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  check(!$('gameDrawer').classList.contains('open'),'Escape did not close drawer');
  // Actual Chromium DOM integration for the newly shipped optional Sanctuary route.
  // This must be visible from the same touch/mouse/keyboard drawer in both render modes.
  $('drawerToggle').click();
  check(!!$('routeBtn'),'Missing Sanctuary route menu button');
  $('routeBtn').click();
  check(!$('modal').classList.contains('hidden'),'Sanctuary scouting modal did not open');
  check($('modalTitle').textContent.includes('SANTUARIO'),'Wrong Sanctuary scouting modal');
  const routeText=$('modalContent').textContent;
  check((routeText.match(/CONTRAATAQUE|SIN CONTRAATAQUE/g)||[]).length===3,'Scouting did not render all three stages');
  $('closeModal').click();
  check($('modal').classList.contains('hidden'),'Scouting modal did not close');
  check(localStorage.getItem('ascii-azur-save-v1')===saved,'Scouting mutated saved gameplay');
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
},90));
</script>'''
if '</head>' not in HTML: raise SystemExit('Missing HTML head')
QA=ROOT/'.azur-browser-acceptance.html'
QA.write_text(HTML.replace('</head>',INJECTION+'</head>',1),encoding='utf-8')
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args): pass
 def do_POST(self):
  request=urllib.parse.urlparse(self.path)
  if request.path!='/__qa_capture': self.send_error(404);return
  query=urllib.parse.parse_qs(request.query)
  mode=query.get('mode',[''])[0];fallback=query.get('fallback',[''])[0]
  if mode not in ('ascii','glyph-pixel') or fallback not in ('0','1'):self.send_error(400);return
  body=self.rfile.read(int(self.headers.get('Content-Length','0'))).decode('ascii')
  if not body.startswith('data:image/png;base64,'):self.send_error(415);return
  png=base64.b64decode(body.split(',',1)[1],validate=True)
  if not png.startswith(b'\x89PNG\r\n\x1a\n') or len(png)<24:self.send_error(422);return
  width,height=struct.unpack('>II',png[16:24])
  if width<300 or height<180:self.send_error(422);return
  name=mode+('-canvas2d' if fallback=='1' else '-webgl2')+'.png'
  (OUT/name).write_bytes(png)
  self.send_response(204);self.end_headers()
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
