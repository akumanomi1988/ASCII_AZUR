import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {configureWorld,captureWorldSnapshot,ZONES,ZONE_IDS} from '../dist/world.js';
import {reveal} from '../dist/world/discovery.js';
import {visibleEncounters} from '../dist/world/encounters.js';
import {regionalObjectives,regionalSurvey,regionUnlocked,regionKnown,planFieldTarget,resolveFieldTarget,planSurveyClaim,planLumbreTravel,travelRefusal,nextFieldPortal,afterlightOverview} from '../dist/world/field-journal.js';
import {mount} from './helpers/game-runtime.mjs';
import {generateDungeon} from '../dist/dungeons/labyrinth.js';
const allStory=['arken-vow-restored','marsh-chapter-complete','crown-trilogy-complete','afterlight-ossuary-choice-anchor','afterlight-ossuary-complete'];
function state(seed=17){configureWorld(seed);return{version:1,worldSeed:seed,worldSnapshot:captureWorldSnapshot(),zone:'village',x:4,y:16,team:[createCreature('cindrel',8,()=>.1)],storage:[],inventory:{seals:5,tonics:3},flags:[],defeatedBoss:false,playSeconds:0,rpg:{echoes:35,completed:[],visitedNpcs:[]}};}
function completeRegion(s,zone){
 s.flags.push(...allStory,'zone-'+zone,'altar-'+zone,'rune-'+zone,'archivist','merchant-met','pilgrim-met','marsh-met-nael','crown-met-oriel','crown-nullscribe-fallen');
 s.rpg.visitedNpcs=['archivist','merchant','scout','keeper','pilgrim'];s.defeatedBoss=true;
 if(zone==='village'){s.dungeon=generateDungeon(91);s.dungeon.active=false;s.dungeon.finished=true;s.dungeon.cleared=[2,3,5];}
 for(const l of ZONES[zone].landmarks){
  if(l.kind==='chest')s.flags.push(`chest-${zone}-${l.x}`);
  if(l.kind==='memory')s.flags.push(zone==='marsh'?'marsh-memory-'+l.npcId:zone==='spire'?'crown-relic-'+l.npcId:`afterlight-${zone}-memory-${l.npcId}`);
 }
 s.flags.push(...visibleEncounters(zone,s.worldSeed).map(e=>'roamer-'+e.id));
 if(zone==='marsh')s.flags.push('marsh-choice-keep');if(zone==='spire')s.flags.push('crown-choice-remember');
 if(zone==='ossuary'||zone==='garden')s.flags.push(`afterlight-${zone}-met`,`afterlight-${zone}-choice-${zone==='ossuary'?'anchor':'bloom'}`,`afterlight-${zone}-complete`,`afterlight-${zone}-epilogue`);
 s.flags=[...new Set(s.flags)];return s;
}
const start=()=>{const r=mount({virtualTime:true,seed:155});r.game.startNew();r.game.pickStarter('cindrel');while(r.game.dialogOpen)r.game.nextDialog();return r;};

test('regional journal keeps unknown identity/coordinates hidden and viewing it is read-only',()=>{
 const s=state();s.discovered=reveal(undefined,'village',4,16);const before=JSON.stringify(s);
 const entries=regionalObjectives(s,'village');const hidden=entries.filter(e=>!e.known);assert.ok(hidden.length>=3);
 assert.ok(hidden.every(e=>e.x===undefined&&e.y===undefined&&!e.trackable));assert.ok(hidden.every(e=>!e.label.includes('Mara')));
 assert.equal(planFieldTarget(s,{zone:'village',id:hidden[0].id}),null);assert.equal(JSON.stringify(s),before);
 assert.equal(regionKnown(s,'garden'),false);assert.equal(regionUnlocked(s,'garden'),false);
});
test('discovering is not resolving: fog alone does not grant a regional reward',()=>{
 const s=state();s.discovered=reveal(undefined,'village',23,16,100);
 const r=regionalSurvey(s,'village');assert.ok(r.entries.every(e=>e.known));assert.equal(r.done,0);assert.equal(r.ready,false);assert.equal(planSurveyClaim(s,'village'),null);
});
test('persistent field objectives survive save JSON and guide between regions without forging coordinates',()=>{
 const s=state();s.flags.push('zone-forest');s.discovered=reveal(undefined,'forest',ZONES.forest.landmarks[1].x,ZONES.forest.landmarks[1].y);
 const next=planFieldTarget(s,{zone:'forest',id:'site:1'});assert.ok(next);assert.ok(validateSave(next));assert.equal(s.fieldTarget,undefined);
 const restored=JSON.parse(JSON.stringify(next));assert.equal(resolveFieldTarget(restored).label,ZONES.forest.landmarks[1].label);
 assert.equal(nextFieldPortal(restored,'forest').x,43);
 assert.equal(validateSave({...s,fieldTarget:{zone:'garden',id:'site:0',x:999}}),false);
 assert.equal(validateSave({...s,fieldTarget:{zone:'village',id:'__proto__'}}),false);
});
test('a resolved finite objective stops tracking while revisitable NPCs and Lumbres remain trackable',()=>{
 const s=state();const chest=ZONES.village.landmarks.findIndex(l=>l.kind==='chest');s.discovered=reveal(undefined,'village',ZONES.village.landmarks[chest].x,ZONES.village.landmarks[chest].y);
 const next=planFieldTarget(s,{zone:'village',id:'site:'+chest});assert.ok(next);next.flags.push('chest-village-'+ZONES.village.landmarks[chest].x);assert.equal(resolveFieldTarget(next),null);
 const altar=ZONES.village.landmarks.findIndex(l=>l.kind==='altar');next.flags.push('altar-village');assert.ok(planFieldTarget(next,{zone:'village',id:'site:'+altar}));
});
test('each of seven region surveys pays once, respects caps and never mutates its input snapshot',()=>{
 for(const zone of ZONE_IDS){
  const s=completeRegion(state(),zone),r=regionalSurvey(s,zone),before=JSON.stringify(s);assert.equal(r.done,r.total,zone+' incomplete fixture');assert.equal(r.ready,true);
  const next=planSurveyClaim(s,zone);assert.ok(next);assert.equal(next.rpg.echoes,s.rpg.echoes+r.reward.echoes);assert.equal(next.inventory.seals,s.inventory.seals+1);assert.equal(next.inventory.tonics,s.inventory.tonics+1);
  assert.equal(JSON.stringify(s),before);assert.equal(planSurveyClaim(next,zone),null);assert.ok(validateSave(next));
  s.inventory.tonics=9999;assert.equal(planSurveyClaim(s,zone),null);assert.ok(!s.flags.includes('survey-'+zone));
 }
});
test('survey and world movement refuse battles/crypt/expeditions and a full flag ledger',()=>{
 const s=completeRegion(state(),'forest');s.activeBattle={};assert.equal(planSurveyClaim(s,'forest'),null);assert.equal(planLumbreTravel(s,'forest'),null);
 delete s.activeBattle;s.flags=Array.from({length:200},(_,i)=>'flag-'+i);assert.equal(planSurveyClaim(s,'forest'),null);
});
test('Lumbre network requires origin proximity, visited destination, narrative gates and a conscious party',()=>{
 const s=state();const origin=ZONES.village.landmarks.find(l=>l.kind==='altar'),end=ZONES.forest.landmarks.find(l=>l.kind==='altar');
 s.flags.push('altar-village');s.x=origin.x;s.y=origin.y;assert.equal(planLumbreTravel(s,'forest'),null);
 s.flags.push('altar-forest');const hp=s.team[0].hp=15,bag=JSON.stringify(s.inventory),before=JSON.stringify(s);
 const next=planLumbreTravel(s,'forest');assert.ok(next);assert.equal(next.x,end.x);assert.equal(next.y,end.y);assert.equal(next.team[0].hp,hp);assert.equal(JSON.stringify(next.inventory),bag);assert.equal(JSON.stringify(s),before);
 assert.equal(planLumbreTravel(s,'marsh'),null);s.flags.push('altar-marsh');assert.equal(planLumbreTravel(s,'marsh'),null);s.flags.push('arken-vow-restored');assert.ok(planLumbreTravel(s,'marsh'));
 s.x=4;s.y=16;assert.match(travelRefusal(s,'forest'),/DESDE UNA LUMBRE/);
 s.x=origin.x;s.y=origin.y;s.team[0].hp=0;assert.equal(planLumbreTravel(s,'forest'),null);s.team[0].hp=15;s.expedition={};assert.equal(planLumbreTravel(s,'forest'),null);delete s.expedition;
 s.dungeon=generateDungeon(71);assert.equal(planLumbreTravel(s,'forest'),null);
});
test('Afterlight overview separates the 19-step main ending from both eight-step epilogues',()=>{
 const s=state();s.flags.push('crown-trilogy-complete');assert.equal(afterlightOverview(s).done,0);assert.equal(afterlightOverview(s).total,16);
 completeRegion(s,'ossuary');assert.equal(afterlightOverview(s).chapters[0].done,8);assert.equal(afterlightOverview(s).complete,false);
 completeRegion(s,'garden');assert.equal(afterlightOverview(s).done,16);assert.equal(afterlightOverview(s).complete,true);
});
test('200 saved seeds retain reachable known journal/altar objectives after snapshot reload',()=>{
 let checked=0;
 for(let seed=1;seed<=200;seed++){
  const s=state(seed),snapshot=s.worldSnapshot;
  for(const zone of ZONE_IDS){
   const altar=ZONES[zone].landmarks.find(l=>l.kind==='altar');s.flags=[...allStory,'altar-'+zone];s.discovered=reveal(undefined,zone,altar.x,altar.y);
   const known=regionalObjectives(s,zone).find(o=>o.kind==='altar');assert.equal(known.known,true);assert.equal(known.done,true);assert.equal(known.trackable,true);checked++;
  }
  configureWorld(seed,snapshot);assert.deepEqual(captureWorldSnapshot(),snapshot);
 }
 assert.equal(checked,1400);console.log('FIELD_SAVED_WORLD_QA '+JSON.stringify({savedSeeds:200,regions:7,altarObjectives:checked}));
});
test('runtime journal, map and Lumbre network do not write or award rewards on inspection',()=>{
 const {game,storage}=start();const before=storage.getItem('ascii-azur-save-v1');
 game.openFieldJournal();game.openMap();game.openLumbreNetwork();assert.equal(storage.getItem('ascii-azur-save-v1'),before);
});
test('runtime tracking persists, survives a journey resume and clears after a finite goal completes',()=>{
 const {game,storage}=start();const site=game.save.worldSnapshot.poi.village[0];game.save.discovered=reveal(game.save.discovered,'village',site[0],site[1]);
 assert.equal(game.setFieldTarget({zone:'village',id:'site:0'}),true);const raw=storage.getItem('ascii-azur-save-v1');
 const resumed=mount({virtualTime:true,priorSave:raw});resumed.game.continueGame();assert.equal(resumed.game.save.fieldTarget.id,'site:0');
 // NPCs are intentionally revisitable; use a chest to prove finite-goal retirement.
 const point=game.save.worldSnapshot.poi.village[4];game.save.discovered=reveal(game.save.discovered,'village',point[0],point[1]);
 game.setFieldTarget({zone:'village',id:'site:4'});game.interactLandmark({kind:'chest',x:point[0],y:point[1],label:'Cofre'});game.saveNow(false);assert.equal(game.save.fieldTarget,undefined);
});
test('runtime travel storage faults preserve both live position and saved campaign',()=>{
 const {game,storage}=start();const origin=game.save.worldSnapshot.poi.village[3];game.save.x=origin[0];game.save.y=origin[1];game.save.flags.push('altar-village','altar-forest');game.saveNow(false);
 const before=storage.getItem('ascii-azur-save-v1'),position={zone:game.save.zone,x:game.save.x,y:game.save.y};
 const native=storage.setItem;storage.setItem=()=>{throw Error('quota');};assert.equal(game.travelLumbre('forest'),false);
 assert.deepEqual({zone:game.save.zone,x:game.save.x,y:game.save.y},position);assert.equal(storage.getItem('ascii-azur-save-v1'),before);storage.setItem=native;
 assert.equal(game.travelLumbre('forest'),true);assert.equal(game.save.zone,'forest');assert.equal(JSON.parse(storage.getItem('ascii-azur-save-v1')).zone,'forest');
});
test('runtime survey claims are durable, one-time and refuse stale tabs without crediting the live economy',()=>{
 const {game,storage,world}=start();game.save.flags.push('zone-forest','altar-forest','rune-forest','pilgrim-met');game.save.rpg.visitedNpcs.push('pilgrim');
 game.save.flags.push(...world.ZONES.forest.landmarks.filter(l=>l.kind==='chest').map(l=>'chest-forest-'+l.x),...Array.from({length:3},(_,i)=>'roamer-forest-'+i));game.saveNow(false);
 const old=game.economy.echoes,raw=storage.getItem('ascii-azur-save-v1'),competing=JSON.parse(raw);competing.playSeconds+=10;storage.setItem('ascii-azur-save-v1',JSON.stringify(competing));
 assert.equal(game.claimSurvey('forest'),false);assert.equal(game.economy.echoes,old);assert.ok(!game.save.flags.includes('survey-forest'));
 game.continueGame();assert.equal(game.claimSurvey('forest'),true);assert.equal(game.economy.echoes,old+45);assert.equal(game.claimSurvey('forest'),false);
});
