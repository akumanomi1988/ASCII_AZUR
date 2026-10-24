#!/usr/bin/env python3
"""Dependency-free Chromium acceptance for glyph renderer and nested in-game menus."""
import http.server
import os
import signal
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
  // Real Web Audio graph lifecycle, independent of the scene-rendering frame budget.
  // Autoplay is explicitly allowed only in this acceptance browser; production still
  // unlocks audio through the existing player gesture handlers.
  const {Sound,AUDIO_LIMITS}=await import('./dist/audio.js');
  const score=new Sound();
  try{
   score.setScene('forest');score.unlock();
   await new Promise(resolve=>setTimeout(resolve,100));
   check(score.diagnostics().contextState==='running','Real AudioContext failed to unlock');
   check(score.diagnostics().musicVoices>0,'Real score did not schedule any voices');
   const phrase=score.diagnostics().step;
   score.setScene('battle');score.hitElement('Éter');score.setScene('forest');
   check(score.diagnostics().step>=phrase,'Combat restarted exploration music');
   for(let i=0;i<120;i++){score.setScene(i%2?'boss':'garden');score.pick();}
   check(score.diagnostics().musicVoices<=AUDIO_LIMITS.musicVoices,'Music voice budget exceeded');
   check(score.diagnostics().effectVoices<=AUDIO_LIMITS.effectVoices,'Effect voice budget exceeded');
   check(score.diagnostics().retiringBuses<=AUDIO_LIMITS.retiringBuses,'Scene bus budget exceeded');
   score.pause();score.unlock();
   await new Promise(resolve=>setTimeout(resolve,100));
   check(score.diagnostics().contextState==='suspended'&&!score.diagnostics().scheduling,'Background audio still running');
   score.resume();await new Promise(resolve=>setTimeout(resolve,100));
   check(score.diagnostics().contextState==='running'&&score.diagnostics().scheduling,'Foreground score did not resume');
   score.setEnabled(false);await new Promise(resolve=>setTimeout(resolve,100));
   check(score.diagnostics().contextState==='suspended'&&!score.diagnostics().scheduling,'Muted score consumes scheduler');
  }finally{score.dispose();}
  check(score.diagnostics().musicVoices===0&&score.diagnostics().effectVoices===0,'Disposed graph retained voices');
  const $=id=>document.getElementById(id);
  let previousZoneImage='';
  const captureZone=async zone=>{
   let image='';
   for(let attempt=0;attempt<6;attempt++){
    window.__azurQaAdvance();
    await new Promise(resolve=>setTimeout(resolve,180));
    check($('zoneName').textContent===({
     village:'Velo de Arken',forest:'Bosque de Ceniza',sanctuary:'Santuario sin Voz',
     marsh:'Marismas del Espejo Roto',spire:'Corona de lo No Escrito',
     ossuary:'Osario de las Mareas',garden:'Jardín de la Última Escarcha'
    })[zone],'Wrong region before screenshot: '+zone);
    image=$('game').toDataURL('image/png');
    if(image!==previousZoneImage)break;
   }
   check(image!==previousZoneImage,'Renderer held a stale frame after entering '+zone);
   previousZoneImage=image;
   const params=new URLSearchParams(location.search);
   const capture=await fetch('/__qa_capture?mode='+encodeURIComponent(params.get('mode')||'ascii')+
    '&fallback='+(params.has('fallback')?'1':'0')+'&zone='+zone,
    {method:'POST',body:image});
   check(capture.ok,'Canvas screenshot failed: '+zone);
  };
  check($('game')&&$('newGame'),'Missing game bootstrap');
  $('worldSeedInput').value='AZUR-QA-STABLE-SEED';
  $('newGame').click();
  check(document.querySelectorAll('#starters button').length===3,'Missing starters');
  check(document.activeElement?.matches('#starters button'),'Starter selection is not keyboard-focused');
  document.querySelector('#starters button').click();
  check(document.activeElement?.id==='dialogue','Story dialogue lacks modal keyboard focus');
  for(let i=0;i<4;i++)$('closeDialogue').click();
  check($('dialogue').classList.contains('hidden'),'Intro dialogue not dismissed');
  check(document.activeElement?.id==='viewport','Closing dialogue did not restore game focus');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'h',bubbles:true,cancelable:true}));
  check($('accessibilityStatus').textContent.includes('Orientación.'),'Nonvisual route scan did not announce location');
  check(/Salidas cercanas:|No hay salidas inmediatas/.test($('accessibilityStatus').textContent),'Nonvisual route scan did not announce passage state');
  check($('accessibilityStatus').textContent.includes('Guía:'),'Nonvisual route scan omitted quest guidance');
  // Allow an actual animation frame after scene transition before capturing pixels.
  await new Promise(resolve=>setTimeout(resolve,180));
  const saved=localStorage.getItem('ascii-azur-save-v1');
  check(!!saved,'No game save');
  // Isolated stored-state fixture for the regional journal/network UI. The Node
  // journey gate separately earns all unlocks by physical exploration and combat.
  const {ZONES:fieldZones}=await import('./dist/world.js');
  const fieldSave=JSON.parse(saved),villageCamp=fieldSave.worldSnapshot.poi.village[3];
  fieldSave.x=villageCamp[0];fieldSave.y=villageCamp[1];
  fieldSave.flags=[...new Set([...fieldSave.flags,'altar-village','altar-forest','altar-marsh','zone-forest','rune-forest','pilgrim-met',
    ...fieldZones.forest.landmarks.filter(l=>l.kind==='chest').map(l=>'chest-forest-'+l.x),...Array.from({length:3},(_,i)=>'roamer-forest-'+i)])];
  fieldSave.rpg.visitedNpcs.push('pilgrim');
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(fieldSave));$('continue').click();
  $('drawerToggle').click();$('fieldJournalBtn').click();
  check($('modalTitle').textContent.includes('DIARIO DE CAMPO'),'Regional journal entry point failed');
  check($('modalContent').textContent.includes('OBJETIVOS RESUELTOS'),'Regional completion summary missing');
  check($('claimRegionSurvey').disabled,'Unfinished village survey can be claimed');
  const campGoal=document.querySelector('[data-field-target="site:3"]');check(!!campGoal,'Visited Lumbre cannot be tracked');campGoal.click();
  check(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).fieldTarget.id==='site:3','Journal target was not persisted');
  $('continue').click();check($('storyCompass').textContent.startsWith('DIARIO ·'),'Saved objective did not resume');
  $('drawerToggle').click();$('fieldJournalBtn').click();$('fieldLumbres').click();
  check(!document.querySelector('[data-lumbre-travel="marsh"]'),'Lumbre network bypasses the Arken story gate');
  const travelBefore=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  document.querySelector('[data-lumbre-travel="forest"]').click();
  const travelled=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(travelled.zone==='forest'&&$('zoneName').textContent==='Bosque de Ceniza','Visited Lumbre travel failed');
  check(JSON.stringify(travelled.inventory)===JSON.stringify(travelBefore.inventory),'Travel granted consumables');
  check(JSON.stringify(travelled.team)===JSON.stringify(travelBefore.team),'Travel healed or changed the party');
  $('drawerToggle').click();$('fieldJournalBtn').click();
  check(!$('claimRegionSurvey').disabled,'Completed forest objectives do not offer recognition');
  $('claimRegionSurvey').click();const surveySave=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(surveySave.rpg.echoes===travelled.rpg.echoes+45,'Forest survey Echo reward mismatch');
  check(surveySave.flags.filter(f=>f==='survey-forest').length===1,'Survey reward flag duplicated');
  check($('claimRegionSurvey').disabled,'Claimed survey remains actionable');
  $('clearFieldTarget').click();check(!JSON.parse(localStorage.getItem('ascii-azur-save-v1')).fieldTarget,'Persistent goal could not be cancelled');
  $('closeModal').click();localStorage.setItem('ascii-azur-save-v1',saved);$('continue').click();
  // P4 research: browser Codex shows truthful discovery state and one-time rewards.
  $('drawerToggle').click();$('codexBtn').click();
  check($('modalTitle').textContent.includes('INVESTIGACIÓN'),'Research Codex missing from game drawer');
  check($('modalContent').textContent.includes('1/17 VÍNCULOS'),'Starter bond not counted in field research');
  check(!document.querySelector('[data-research-claim]'),'Unfinished field research was claimable');
  $('closeModal').click();
  check(localStorage.getItem('ascii-azur-save-v1')===saved,'Read-only field guide unexpectedly saved resources');
  const researchSave=JSON.parse(saved);
  researchSave.team.push(
   {uid:'qa-field-mist',speciesId:'velaria',level:5,exp:0,hp:56,moves:['fog','pulse']},
   {uid:'qa-field-root',speciesId:'thorne',level:5,exp:0,hp:63,moves:['thorn','pulse']});
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(researchSave));
  $('continue').click();
  $('drawerToggle').click();$('codexBtn').click();
  const firstReward=document.querySelector('[data-research-claim="first-names"]');
  check(!!firstReward,'Three collected species did not unlock first research reward');
  firstReward.click();
  const rewarded=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(rewarded.flags.includes('research-reward-first-names'),'Research claim not durable');
  check(rewarded.inventory.seals===researchSave.inventory.seals+1,'Research seal reward mismatch');
  check(rewarded.inventory.tonics===researchSave.inventory.tonics+1,'Research tonic reward mismatch');
  check(rewarded.rpg.echoes===researchSave.rpg.echoes+20,'Research Echo reward mismatch');
  check(!document.querySelector('[data-research-claim="first-names"]'),'Research claimed a second time');
  $('closeModal').click();
  localStorage.setItem('ascii-azur-save-v1',saved);$('continue').click();
  // Resume an authentic v1 snapshot from before Afterlight was introduced.
  // Previously generated terrain must remain byte-identical, while both new
  // regions become part of the persisted save immediately and idempotently.
  const legacy=JSON.parse(saved);
  const preserved=Object.fromEntries(['village','forest','sanctuary','marsh','spire'].map(z=>[z,legacy.worldSnapshot.tiles[z]]));
  for(const zone of ['ossuary','garden']){delete legacy.worldSnapshot.tiles[zone];delete legacy.worldSnapshot.poi[zone];}
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(legacy));
  $('continue').click();
  const expanded=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(!!expanded.worldSnapshot.tiles.ossuary&&!!expanded.worldSnapshot.tiles.garden,'Legacy save did not persist both Afterlight regions');
  for(const [zone,tiles] of Object.entries(preserved))check(expanded.worldSnapshot.tiles[zone]===tiles,'Legacy terrain was rerolled: '+zone);
  check(expanded.worldSnapshot.poi.ossuary.length>=6&&expanded.worldSnapshot.poi.garden.length>=6,'Afterlight landmarks were not persisted');
  $('continue').click();
  check(JSON.stringify(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).worldSnapshot)===JSON.stringify(expanded.worldSnapshot),'Repeated resume changed a stable world');
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
  // Creature sheet and one-slot relic ownership through actual menu controls.
  const {ZONES}=await import('./dist/world.js');
  const equipmentSave=JSON.parse(saved),merchant=ZONES.village.landmarks.find(l=>l.kind==='npc'&&l.npcId==='merchant');
  equipmentSave.x=merchant.x;equipmentSave.y=merchant.y;equipmentSave.flags.push('merchant-introduced');equipmentSave.rpg.echoes=200;
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(equipmentSave));$('continue').click();$('touchInteract').click();
  for(let i=0;i<4&&!$('dialogue').classList.contains('hidden');i++)$('closeDialogue').click();
  check(!!$('relicGift'),'Mara introductory relic gift missing');$('relicGift').click();
  check(!document.querySelector('#relicGift'),'Relic gift can be claimed repeatedly');
  const buyPearl=document.querySelector('[data-buy-relic="mist-pearl"]');check(!!buyPearl,'Relic catalogue missing');buyPearl.click();
  check(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).rpg.echoes===140,'Relic price not debited exactly');
  $('closeModal').click();$('teamBtn').click();
  check($('modalContent').textContent.includes('POTENCIAL INDIVIDUAL'),'Individual stats not visible');
  check($('modalContent').textContent.includes('RANGO'),'Species/level min-max range not visible');
  document.querySelector('[data-relics]').click();document.querySelector('[data-equip-relic="mist-pearl"]').click();
  check(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).team[0].equipment==='mist-pearl','Equipped relic not persisted');
  $('unequipRelic').click();check(!JSON.parse(localStorage.getItem('ascii-azur-save-v1')).team[0].equipment,'Unequip failed');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  document.querySelector('[data-skills]').click();check(document.querySelectorAll('[data-skill-slot]').length===4,'Expected exactly four active technique slots');
  $('closeModal').click();localStorage.setItem('ascii-azur-save-v1',saved);$('continue').click();
  // An actual restored enemy turn must kill a non-primary crypt companion permanently.
  const {generateDungeon}=await import('./dist/dungeons/labyrinth.js');
  const {createCreature}=await import('./dist/domain.js');
  const mortal=JSON.parse(saved),companion=createCreature('velaria',5,()=>.72);
  companion.hp=1;mortal.team.push(companion);mortal.dungeon=generateDungeon(810);mortal.dungeon.active=true;
  mortal.activeBattle={enemy:createCreature('ashboar',18,()=>.35),type:'wild',ally:1,guarding:false,bossPhase:1,chargeStage:0,effects:{},pending:'enemy'};
  localStorage.setItem('ascii-azur-save-v1',JSON.stringify(mortal));$('continue').click();
  await new Promise(resolve=>setTimeout(resolve,1000));
  const afterLoss=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  check(!afterLoss.team.some(c=>c.uid===companion.uid),'Crypt casualty remained in the party');
  check(afterLoss.fallen.some(c=>c.uid===companion.uid),'Crypt casualty missing from memorial');
  check(afterLoss.team.some(c=>c.uid===mortal.primaryUid),'Protected principal was removed');
  $('continue').click();check(!JSON.parse(localStorage.getItem('ascii-azur-save-v1')).team.some(c=>c.uid===companion.uid),'Reload resurrected a casualty');
  localStorage.setItem('ascii-azur-save-v1',saved);$('continue').click();
  check($('battle').classList.contains('hidden'),'Returning to a non-battle save left stale combat UI');
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
  const highContrast=$('highContrast');
  check(highContrast instanceof HTMLInputElement,'High-contrast setting missing');
  highContrast.checked=true;highContrast.dispatchEvent(new Event('change',{bubbles:true}));
  check(document.documentElement.classList.contains('azur-high-contrast'),'High contrast did not activate');
  check(JSON.parse(localStorage.getItem('ascii-azur-accessibility')).highContrast===true,'High contrast did not persist');
  highContrast.checked=false;highContrast.dispatchEvent(new Event('change',{bubbles:true}));
  check(!document.documentElement.classList.contains('azur-high-contrast'),'High contrast did not disable');
  check($('accessibilityStatus').getAttribute('aria-live')==='polite','Accessible world status is not announced');
  check($('accessibilityStatus').textContent.includes('Región:'),'Accessible world context missing');
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
   if(zone==='forest'){
    // Real browser Atlas: discovered POIs support selectable personal
    // waypoints; the route respects fog and can be cancelled.
    $('drawerToggle').click();$('mapBtn').click();
    check($('modalTitle').textContent.includes('ATLAS'),'World Atlas did not open');
    const west=[...document.querySelectorAll('[data-atlas-target]')]
     .find(b=>b.closest('.modal-option')?.textContent.includes('Velo de Arken'));
    check(!!west,'Discovered Forest return portal is missing from Atlas');
    west.click();
    check($('modal').classList.contains('hidden'),'Atlas waypoint did not close menu');
    check($('storyCompass').textContent.startsWith('ATLAS ·'),'Atlas guidance did not override story compass');
    $('drawerToggle').click();$('mapBtn').click();
    check($('modalContent').textContent.includes('DESTINO:'),'Atlas selection did not survive reopening');
    check(!!document.querySelector('.azur-cartography line[stroke="#f6d292"]'),'Atlas route is not drawn over revealed cells');
    check(!!document.querySelector('[data-atlas-clear]'),'Atlas route has no cancel action');
    document.querySelector('[data-atlas-clear]').click();
    check(!$('storyCompass').textContent.startsWith('ATLAS ·'),'Atlas cancellation did not restore story compass');
    check($('modal').classList.contains('hidden'),'Atlas cancellation left menu open');
   }
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
  check($('enemyHealthTrack').getAttribute('aria-valuenow')===$('enemyHpText').textContent.split('/')[0],'Enemy HP is not exposed as progressbar');
  check($('allyHealthTrack').getAttribute('aria-valuemax')===$('allyHpText').textContent.split('/')[1],'Ally HP maximum is not exposed');
  check($('battleActions').getAttribute('role')==='group','Battle actions lack semantic grouping');
  const roots=Array.from(document.querySelectorAll('#battleActions button'));
  check(roots.length===4,'Classic command menu must have four commands');roots[0].focus();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
  check(document.activeElement===roots[3],'Grid Down did not skip disabled party slot');
  roots[1].click();check($('battleActions').getAttribute('aria-label')==='Objetos y retirada','Item submenu failed');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  check($('battleActions').getAttribute('aria-label')==='Comandos de combate','Back did not restore command menu');
  document.querySelector('#battleActions button').click();
  check(document.querySelectorAll('#battleActions button').length===5,'Four active move slots plus Back expected');
  const attack=document.querySelector('#battleActions .battle-move:not([disabled])');
  check(!!attack,'No usable player attack');
  attack.click();
  check($('battleLog').textContent.length>5,'Battle action did not update the log');
  window.__azurQaAdvance();
  await new Promise(resolve=>setTimeout(resolve,180));
  const combatImage=await fetch('/__qa_capture?mode='+encodeURIComponent(params.get('mode')||'ascii')+
   '&fallback='+(params.has('fallback')?'1':'0')+'&zone=battle',{method:'POST',body:$('game').toDataURL('image/png')});
  check(combatImage.ok,'Combat VFX screenshot failed');
  // Persistence is renderer-independent; run its heavier browser flow once.
  if(params.get('mode')==='ascii'&&!params.has('fallback')){
  // Q2: a stale tab must not silently replace another session's saved progress.
  const competing=JSON.parse(localStorage.getItem('ascii-azur-save-v1'));
  competing.playSeconds+=20;
  const competingRaw=JSON.stringify(competing);
  localStorage.setItem('ascii-azur-save-v1',competingRaw);
  $('saveBtn').click();
  check(localStorage.getItem('ascii-azur-save-v1')===competingRaw,'Stale tab overwrote the newer save');
  check($('saveStatus').textContent.includes('CONFLICTO'),'No visible concurrent-save warning');
  $('continue').click(); // explicitly reload the newer baseline
  // A quota failure during import must not swap the live game or saved world.
  const importSave=JSON.parse(saved);importSave.zone='garden';importSave.playSeconds=987;
  const restoreInput=$('restoreFile');
  const nativeSet=Storage.prototype.setItem,nativeConfirm=window.confirm;
  window.confirm=()=>true;
  const chooseFile=()=>{
   const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(importSave)],'azur-save.json',{type:'application/json'}));
   restoreInput.files=transfer.files;restoreInput.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const oldZone=$('zoneName').textContent;
  Storage.prototype.setItem=function(key,value){if(key==='ascii-azur-save-v1')throw Error('quota');return nativeSet.call(this,key,value);};
  try{chooseFile();await new Promise(resolve=>setTimeout(resolve,100));}
  finally{Storage.prototype.setItem=nativeSet;}
  check($('zoneName').textContent===oldZone,'Failed import replaced the live world');
  check(localStorage.getItem('ascii-azur-save-v1')===competingRaw,'Failed import replaced the persisted world');
  chooseFile();await new Promise(resolve=>setTimeout(resolve,100));
  window.confirm=nativeConfirm;
  check($('zoneName').textContent==='Jardín de la Última Escarcha','Validated import did not enter Garden');
  check(JSON.parse(localStorage.getItem('ascii-azur-save-v1')).playSeconds>=987,'Imported progress was not persisted');
  // Campaign manager: changing seeds must never replace another slot.
  $('quickSettings').click();$('returnTitle').click();
  check(!$('titleScreen').classList.contains('hidden'),'Return to journey selection failed');
  const slotOneRaw=localStorage.getItem('ascii-azur-save-v1');
  const slotSelect=$('saveSlotSelect');
  slotSelect.value='2';slotSelect.dispatchEvent(new Event('change',{bubbles:true}));
  check($('continue').hidden,'Empty second campaign incorrectly offers Continue');
  $('worldSeedInput').value='independent-second-campaign';
  $('newGame').click();
  check(!$('starterScreen').classList.contains('hidden'),'Second campaign starter selection missing');
  document.querySelector('[data-starter="cindrel"]').click();
  for(let i=0;i<12&&!$('dialogue').classList.contains('hidden');i++)$('closeDialogue').click();
  $('saveBtn').click();
  const slotTwoStarted=localStorage.getItem('ascii-azur-save-v1-slot-2');
  check(!!slotTwoStarted,'Second campaign was not written to its own slot');
  check(JSON.parse(slotTwoStarted).worldSeed!==JSON.parse(slotOneRaw).worldSeed,'Two independent seeds collapsed');
  check(localStorage.getItem('ascii-azur-save-v1')===slotOneRaw,'Second campaign overwrote first slot');
  $('quickSettings').click();$('returnTitle').click();
  const slotTwoRaw=localStorage.getItem('ascii-azur-save-v1-slot-2');
  slotSelect.value='1';slotSelect.dispatchEvent(new Event('change',{bubbles:true}));
  check(!$('continue').hidden,'First campaign was not offered after switching back');
  $('continue').click();
  check($('zoneName').textContent==='Jardín de la Última Escarcha','First campaign did not restore after slot change');
  check(localStorage.getItem('ascii-azur-save-v1-slot-2')===slotTwoRaw,'Returning to first campaign changed second slot');
  }
    check(window.__azurErrors.length===0,'JS errors: '+window.__azurErrors.join(' | '));
  document.body.dataset.azurQa='PASS';
 }catch(error){document.body.dataset.azurQa='FAIL: '+error.message;console.error(error)}
  try{await fetch('/__qa_result',{method:'POST',body:document.body.dataset.azurQa||'FAIL: missing result'});}catch{/* server may have closed */}
},90));
</script>'''
if '</head>' not in HTML: raise SystemExit('Missing HTML head')
QA=ROOT/'.azur-browser-acceptance.html'
QA.write_text(HTML.replace('</head>',INJECTION+'</head>',1),encoding='utf-8')
QA_DONE=threading.Event()
QA_RESULTS=[]
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args): pass
 def do_POST(self):
  request=urllib.parse.urlparse(self.path)
  if request.path=='/__qa_result':
   outcome=self.rfile.read(int(self.headers.get('Content-Length','0'))).decode('utf-8','replace')
   QA_RESULTS.append(outcome);QA_DONE.set()
   self.send_response(204);self.end_headers();return
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
   with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
    args=[CHROME,'--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--autoplay-policy=no-user-gesture-required','--no-first-run','--window-size=1280,850',f'--user-data-dir={profile}',url]
    QA_DONE.clear();QA_RESULTS.clear()
    process=subprocess.Popen(args,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    try:
     for _ in range(90):
      if QA_DONE.wait(1):break
      if process.poll() is not None:raise AssertionError(f'{mode} fallback={fallback}: Chromium exited before acceptance callback')
     else:raise TimeoutError(f'{mode} fallback={fallback}: no acceptance callback after 90 seconds')
    finally:
     try:os.killpg(process.pid,signal.SIGTERM)
     except ProcessLookupError:pass
     try:process.wait(timeout=8)
     except subprocess.TimeoutExpired:
      try:os.killpg(process.pid,signal.SIGKILL)
      except ProcessLookupError:pass
      process.wait(timeout=5)
    if QA_RESULTS!=['PASS']:
     raise AssertionError(f'{mode} fallback={fallback}: {QA_RESULTS[-1] if QA_RESULTS else "no result"}')
    captures=[OUT/(zone+'-'+mode+('-canvas2d' if fallback else '-webgl2')+'.png') for zone in ('village','forest','sanctuary','marsh','spire','ossuary','garden','battle')]
    if not all(path.exists() for path in captures):raise AssertionError('Missing one or more biome visual captures')
    if len({hashlib.sha256(path.read_bytes()).hexdigest() for path in captures})!=8:raise AssertionError('World/combat screenshots are stale or indistinguishable')
    print(f'PASS {mode} {"Canvas2D" if fallback else "WebGL2"} · 7 biomes + combat VFX screenshot',flush=True)
finally:
 server.shutdown()
 QA.unlink(missing_ok=True)
