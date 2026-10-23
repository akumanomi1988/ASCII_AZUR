#!/usr/bin/env python3
"""Dependency-free Chromium acceptance for glyph renderer and nested in-game menus."""
import http.server
import base64
import hashlib
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
 const frameBudget=params.has('fallback')?12:20;let stalled=null;
 window.requestAnimationFrame=callback=>{if(frames++<frameBudget)return nativeFrame(callback);stalled=callback;return 0};
 window.__azurQaAdvance=()=>{frames=frameBudget-3;if(stalled){const callback=stalled;stalled=null;nativeFrame(callback)}};
}
window.addEventListener('load',()=>setTimeout(async()=>{
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 try{
  const $=id=>document.getElementById(id);
  const captureZone=async zone=>{
   window.__azurQaAdvance();
   await new Promise(resolve=>setTimeout(resolve,160));
   check($('zoneName').textContent===({
    village:'Velo de Arken',forest:'Bosque de Ceniza',sanctuary:'Santuario sin Voz',
    marsh:'Marismas del Espejo Roto',spire:'Corona de lo No Escrito',
    ossuary:'Osario de las Mareas',garden:'Jardín de la Última Escarcha'
   })[zone],'Wrong region before screenshot: '+zone);
   const params=new URLSearchParams(location.search);
   const capture=await fetch('/__qa_capture?mode='+encodeURIComponent(params.get('mode')||'ascii')+
    '&fallback='+(params.has('fallback')?'1':'0')+'&zone='+zone,
    {method:'POST',body:$('game').toDataURL('image/png')});
   check(capture.ok,'Canvas screenshot failed: '+zone);
  };
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
  await captureZone('village');
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
  $('questsBtn').click();
  check(!$('modal').classList.contains('hidden'),'Trilogy roadbook journal did not open');
  check($('modalContent').textContent.includes('ATLAS DEL VIAJE'),'Nineteen-step roadbook missing');
  check($('modalContent').textContent.includes('0/19 HITOS'),'Brand-new journey is not 0/19');
  check($('modalContent').textContent.includes('Equipo: 1/1'),'Real starting party not reported');
  check($('modalContent').textContent.includes('CRIPTA')||$('modalContent').textContent.includes('ARKEN'),'Chapter roadmap missing');
  $('closeModal').click();
  check(localStorage.getItem('ascii-azur-save-v1')===saved,'Read-only roadbook changed saved gameplay');
  $('teamBtn').click();
  check(!$('modal').classList.contains('hidden'),'Team did not open');
  const skills=document.querySelector('[data-skills]');
  check(!!skills,'Missing skills submenu');skills.click();
  check($('modalTitle').textContent.includes('HABILIDADES'),'Skills did not open');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  check($('modalTitle').textContent==='VÍNCULOS Y RESERVA','Escape did not return to Team');
  $('closeModal').click();
  // Player-facing Arken mastery circuit must be actionable inside the real game.
  $('drawerToggle').click();$('duelBtn').click();
  check(!$('modal').classList.contains('hidden'),'Arken training menu did not open');
  check($('modalContent').textContent.includes('CIRCUITO DE IRIA'),'Three-lesson training circuit missing');
  check(document.querySelectorAll('[data-duel]').length===3,'Village training challenges missing');
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
  // Capture each authored biome with an actual saved-state reload. This is
  // a visual matrix, distinct from the full physical traversal gate in Node.
  for(const [zone,flags] of [
   ['forest',['zone-forest']],
   ['sanctuary',['zone-sanctuary','arken-vow-restored']]
  ]){
   const regionSave=JSON.parse(saved);regionSave.zone=zone;regionSave.x=4;regionSave.y=16;
   regionSave.flags=[...new Set([...regionSave.flags,...flags])];
   localStorage.setItem('ascii-azur-save-v1',JSON.stringify(regionSave));
   $('continue').click();
   await captureZone(zone);
  }
  // Rehydrate a compatible chapter-II location under the same real Chromium
  // graphics/backend combination; the full journey is tested in Node runtime.
  const marshSave=JSON.parse(saved);
  marshSave.zone='marsh';marshSave.x=4;marshSave.y=16;
  marshSave.flags=[...new Set([...marshSave.flags,'arken-vow-restored','zone-marsh','marsh-met-nael'])];
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(marshSave));
  $('continue').click();
  check($('zoneName').textContent==='Marismas del Espejo Roto','Marsh resume did not restore its new biome');
  check($('zoneSubtitle').textContent.includes('vidas'),'Missing authored Marsh subtitle');
  check($('titleScreen').classList.contains('hidden'),'Resume unexpectedly reopened title');
  await captureZone('marsh');
  // Fifth-zone browser integration on the real renderer/backend combination.
  const crownSave=JSON.parse(saved);
  crownSave.zone='spire';crownSave.x=4;crownSave.y=16;
  crownSave.flags=[...new Set([...crownSave.flags,'arken-vow-restored','marsh-chapter-complete','marsh-choice-keep','zone-spire','crown-met-oriel'])];
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(crownSave));
  $('continue').click();
  check($('zoneName').textContent==='Corona de lo No Escrito','Crown resume did not restore its distinct zone');
  check($('zoneSubtitle').textContent.includes('última palabra'),'The authored Crown region subtitle is missing');
  check($('titleScreen').classList.contains('hidden'),'Crown resume unexpectedly reopened title');
  await captureZone('spire');
  // Post-campaign macro: both new regions render, restore and expose their
  // authored pilgrimage through the actual in-game journal.
  for(const [zone,flags] of [
    ['ossuary',['crown-trilogy-complete','zone-ossuary']],
    ['garden',['crown-trilogy-complete','afterlight-ossuary-choice-anchor','afterlight-ossuary-complete','zone-garden']]
  ]){
    const afterlightSave=JSON.parse(saved);afterlightSave.zone=zone;afterlightSave.x=4;afterlightSave.y=16;
    afterlightSave.flags=[...new Set([...afterlightSave.flags,...flags])];
    localStorage.setItem('ascii-azur-save-v1',JSON.stringify(afterlightSave));
    $('continue').click();
    check($('zoneName').textContent===(zone==='ossuary'?'Osario de las Mareas':'Jardín de la Última Escarcha'),'Afterlight region resume failed: '+zone);
    $('drawerToggle').click();$('questsBtn').click();
    check($('modalContent').textContent.includes('LA MAREA DE LOS NOMBRES'),'Afterlight quest journal missing');
    check($('modalContent').textContent.includes('LA SEMILLA BAJO EL INVIERNO'),'Second Afterlight quest missing');
    $('closeModal').click();
    await captureZone(zone);
  }
  // Exercise a real persistent irreversible Afterlight choice through DOM
  // controls, with deterministic saved-story prerequisites as a fixture.
  const verdictSave=JSON.parse(saved);verdictSave.zone='ossuary';
  const verdict=verdictSave.worldSnapshot.poi.ossuary[4];
  verdictSave.x=verdict[0];verdictSave.y=verdict[1];
  verdictSave.flags=[...new Set([...verdictSave.flags,'crown-trilogy-complete','afterlight-ossuary-met','afterlight-ossuary-memory-shell','afterlight-ossuary-memory-beacon',
    'roamer-ossuary-0','roamer-ossuary-1','roamer-ossuary-2'])];
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(verdictSave));
  $('continue').click();$('touchInteract').click();
  check(!$('modal').classList.contains('hidden'),'Ready Afterlight verdict did not open');
  check(document.querySelectorAll('[data-afterlight-choice]').length===2,'Afterlight decision is not selectable');
  document.querySelector('[data-afterlight-choice="anchor"]').click();
  const afterChoice=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(afterChoice.flags.includes('afterlight-ossuary-complete'),'Afterlight completion not saved');
  check(afterChoice.flags.includes('afterlight-ossuary-choice-anchor'),'Afterlight outcome not saved');
  check(afterChoice.inventory.seals===verdictSave.inventory.seals+4,'Afterlight reward not applied exactly once');
  for(let i=0;i<2;i++)$('closeDialogue').click();
  $('touchInteract').click();
  check($('modal').classList.contains('hidden'),'Completed Afterlight verdict offered repeat choice');
  // The completed shrine returns a short story dialogue; dismiss it before
  // rehydrating an independent save fixture for the Forest bond test.
  for(let i=0;i<4&&!$('dialogue').classList.contains('hidden');i++)$('closeDialogue').click();
  check($('dialogue').classList.contains('hidden'),'Completed Afterlight dialogue remained open');
  // P3 complete optional creature-bond loop: saved evolution + memory + altar
  // -> irreversible choice -> combat trait persistence -> no duplicate claim.
  const bondSave=JSON.parse(saved);
  bondSave.zone='forest';
  const altar=bondSave.worldSnapshot?.poi?.forest?.[1]||[17,16];
  bondSave.x=altar[0];bondSave.y=altar[1];
  bondSave.team[0].speciesId='cinderwulf';bondSave.team[0].level=9;bondSave.team[0].hp=1;
  bondSave.flags=[...new Set([...bondSave.flags,'pilgrim-met','roamer-forest-0','roamer-forest-1','roamer-forest-2'])];
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(bondSave));
  $('continue').click();
  $('touchInteract').click();
  check(!$('modal').classList.contains('hidden'),'Eligible Forest bond altar did not open a choice');
  check($('modalTitle').textContent.includes('JURAMENTO'),'Bond trial was not named');
  check(!!$('bondFang')&&!!$('bondWard'),'Two bond outcomes not selectable');
  $('bondFang').click();
  const bound=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(bound.flags.includes('bond-ember-fang'),'Bond choice not persisted immediately');
  check(!bound.flags.includes('bond-ember-ward'),'Opposing bond choice was also granted');
  for(let i=0;i<3;i++)$('closeDialogue').click();
  $('touchInteract').click();
  check($('modal').classList.contains('hidden'),'Claimed bond can be repeated at altar');
  check(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).flags.filter(f=>f==='bond-ember-fang').length===1,'Duplicated bond reward');
  // G3 complete combat presentation acceptance: rehydrate a real pending duel,
  // trigger a player move and inspect the glyph-composited action on each backend.
  const combatSave=JSON.parse(saved);
  combatSave.activeBattle={
   enemy:{...combatSave.team[0],uid:'qa-enemy',speciesId:'wispawn',level:4,hp:24,moves:[...combatSave.team[0].moves]},
   type:'wild',ally:0,guarding:false,bossPhase:1,chargeStage:0,effects:{}
  };
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(combatSave));
  $('continue').click();
  check(!$('battle').classList.contains('hidden'),'Saved battle did not restore');
  check(document.querySelectorAll('#battleActions button').length>=4,'Missing tactical battle actions');
  const attack=document.querySelector('#battleActions .battle-move:not([disabled])');
  check(!!attack,'No usable player attack');
  attack.click();
  check($('battleLog').textContent.length>5,'Battle action did not update the log');
  window.__azurQaAdvance();
  await new Promise(resolve=>setTimeout(resolve,180));
  const combatImage=await fetch('/__qa_capture?mode='+encodeURIComponent(params.get('mode')||'ascii')+
   '&fallback='+(params.has('fallback')?'1':'0')+'&zone=battle',{method:'POST',body:$('game').toDataURL('image/png')});
  check(combatImage.ok,'Combat VFX screenshot failed');
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
  mode=query.get('mode',[''])[0];fallback=query.get('fallback',[''])[0];zone=query.get('zone',[''])[0]
  if mode not in ('ascii','glyph-pixel') or fallback not in ('0','1') or zone not in ('village','forest','sanctuary','marsh','spire','ossuary','garden','battle'):self.send_error(400);return
  body=self.rfile.read(int(self.headers.get('Content-Length','0'))).decode('ascii')
  if not body.startswith('data:image/png;base64,'):self.send_error(415);return
  png=base64.b64decode(body.split(',',1)[1],validate=True)
  if not png.startswith(b'\x89PNG\r\n\x1a\n') or len(png)<24:self.send_error(422);return
  width,height=struct.unpack('>II',png[16:24])
  if width<300 or height<180:self.send_error(422);return
  name=zone+'-'+mode+('-canvas2d' if fallback=='1' else '-webgl2')+'.png'
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
    args=[CHROME,'--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--window-size=1280,850','--virtual-time-budget=2600',f'--user-data-dir={profile}','--dump-dom',url]
    result=subprocess.run(args,text=True,capture_output=True,timeout=35)
    if result.returncode or 'data-azur-qa="PASS"' not in result.stdout:
     marker=result.stdout.split('data-azur-qa=')[-1][:170] if 'data-azur-qa=' in result.stdout else 'MISSING QA MARKER'
     raise AssertionError(f'{mode} fallback={fallback} failed ({result.returncode}): {marker}\n{result.stderr[-1000:]}')
    captures=[OUT/(zone+'-'+mode+('-canvas2d' if fallback else '-webgl2')+'.png') for zone in ('village','forest','sanctuary','marsh','spire','ossuary','garden','battle')]
    if not all(path.exists() for path in captures):raise AssertionError('Missing one or more biome visual captures')
    if len({hashlib.sha256(path.read_bytes()).hexdigest() for path in captures})!=8:raise AssertionError('World/combat screenshots are stale or indistinguishable')
    print(f'PASS {mode} {"Canvas2D" if fallback else "WebGL2"} · 7 biomes + combat VFX screenshot',flush=True)
finally:
 server.shutdown()
 QA.unlink(missing_ok=True)
