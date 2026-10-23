import test from 'node:test';
import assert from 'node:assert/strict';
import {AFTERLIGHT,afterlightFlag,afterlightProgress,afterlightResolution,afterlightEpilogue} from '../dist/story-afterlight.js';
import {configureWorld,captureWorldSnapshot,validateWorldSnapshot,terrain,ZONES,ZONE_IDS,getReachableTiles,WORLD_W,WORLD_H} from '../dist/world.js';
import {visibleEncounters,firstRoamerVictoryBonus,BIOME_WILD_SPECIES} from '../dist/world/encounters.js';
import {SPECIES,createCreature,validateSave,learnableMoves} from '../dist/domain.js';
import {rigFor,sampleCreaturePerformance} from '../dist/actors/creature-performance.js';
import {pathMotif} from '../dist/render/ground-material.js';
import {biomePalette,contrastRatio} from '../dist/render/biome-art.js';
import {themeForZone,getThemeSummary} from '../dist/audio.js';
const baseFlags=['crown-trilogy-complete'];
const full=(zone)=>[...baseFlags,afterlightFlag(zone,'met'),...AFTERLIGHT[zone].memories.map(m=>afterlightFlag(zone,'memory-'+m.id)),...Array.from({length:3},(_,i)=>'roamer-'+zone+'-'+i),...(zone==='garden'?['afterlight-ossuary-choice-anchor','afterlight-ossuary-complete']:[])];
const layout=(zone)=>Array.from({length:WORLD_W*WORLD_H},(_,i)=>terrain(zone,i%WORLD_W,Math.floor(i/WORLD_W))).join('');
test('both Afterlight chapters are locked to legitimate campaign order',()=>{
 assert.equal(afterlightProgress('ossuary',[]).started,false);
 assert.equal(afterlightProgress('garden',baseFlags).started,false);
 assert.equal(afterlightProgress('ossuary',baseFlags).started,true);
 assert.equal(afterlightProgress('ossuary',baseFlags).ready,false);
 assert.equal(afterlightResolution('ossuary',baseFlags,'anchor'),null);
});
test('ossuary resolves through two real memories and three saved encounter flags',()=>{
 const flags=full('ossuary'),progress=afterlightProgress('ossuary',flags);
 assert.equal(progress.memories,2);assert.equal(progress.witnesses,3);assert.equal(progress.ready,true);
 const result=afterlightResolution('ossuary',flags,'anchor');
 assert.deepEqual(result.reward,{seals:4,tonics:0,echoes:100});
 const closed=[...flags,...result.additions];
 assert.equal(afterlightProgress('ossuary',closed).complete,true);
 assert.equal(afterlightProgress('garden',closed).started,true);
 assert.equal(afterlightResolution('ossuary',closed,'release'),null);
});
test('all four authored choices have distinct finite rewards and persistent epilogues',()=>{
 const sea=full('ossuary'),anchored=[...sea,...afterlightResolution('ossuary',sea,'anchor').additions];
 const released=[...sea,...afterlightResolution('ossuary',sea,'release').additions];
 const garden=[...full('garden'),...anchored];
 const bloom=afterlightResolution('garden',garden,'bloom'),sleep=afterlightResolution('garden',garden,'sleep');
 assert.deepEqual(bloom.reward,{seals:5,tonics:2,echoes:150});
 assert.deepEqual(sleep.reward,{seals:2,tonics:5,echoes:150});
 assert.notDeepEqual(afterlightEpilogue([...garden,...bloom.additions]),afterlightEpilogue([...released,...full('garden'),...sleep.additions]));
 assert.equal(afterlightResolution('garden',[...garden,...bloom.additions],'bloom'),null);
});
test('new regional ecosystems, signature moves, rigs, weather themes and glyph materials exist',()=>{
 for(const zone of ['ossuary','garden']){
  assert.equal(BIOME_WILD_SPECIES[zone].length>=5,true);
  assert.equal(pathMotif(zone),zone==='ossuary'?'shell':'frost');
  const palette=biomePalette(zone);
  assert.ok(contrastRatio(palette.pathMark,palette.path)>2.1);
  assert.equal(themeForZone(zone),zone);
  assert.equal(getThemeSummary(zone).steps,16);
 }
 for(const [species,skill] of [['tideworn','saltwake'],['frostlark','winterpsalm']]){
  assert.ok(SPECIES[species]);assert.ok(learnableMoves(species,17).includes(skill));
  assert.equal(createCreature(species,17,()=>.2).speciesId,species);
  assert.ok(rigFor(species));assert.equal(sampleCreaturePerformance(species,1,'attack',true).bob,0);
 }
});
test('200 seeds preserve fully reachable new regions and three unique visible encounters',()=>{
 for(let seed=1;seed<=200;seed++){
  configureWorld((seed*2147483647)>>>0);
  for(const zone of ['ossuary','garden']){
   const reach=getReachableTiles(zone);
   assert.ok(reach.size>120,zone+' seed '+seed);
   for(const point of ZONES[zone].landmarks)assert.ok(reach.has(point.y*WORLD_W+point.x),zone+' unreachable '+point.label+' seed '+seed);
   const list=visibleEncounters(zone,(seed*2147483647)>>>0);
   assert.equal(list.length,3,zone+' missing witnesses seed '+seed);
   assert.equal(new Set(list.map(e=>e.id)).size,3);
   for(const encounter of list)assert.ok(reach.has(encounter.y*WORLD_W+encounter.x));
  }
 }
});
test('version-one save and world snapshots restore the two new regions byte-for-byte',()=>{
 configureWorld(918287);const snap=captureWorldSnapshot();
 assert.equal(validateWorldSnapshot(snap),true);
 const before=Object.fromEntries(ZONE_IDS.map(zone=>[zone,layout(zone)]));
 const save={version:1,zone:'garden',x:4,y:16,team:[createCreature('tideworn',18,()=>.25)],storage:[createCreature('frostlark',20,()=>.3)],inventory:{seals:5,tonics:4},defeatedBoss:true,flags:['crown-trilogy-complete'],playSeconds:200,worldSeed:918287,worldSnapshot:snap};
 assert.ok(validateSave(save));
 configureWorld(918287,snap);
 for(const zone of ZONE_IDS)assert.equal(layout(zone),before[zone],zone);
 assert.ok(validateSave({...save,zone:'ossuary'}));
});
test('five-zone historical v1 snapshot remains valid and is extended without changing existing terrain',()=>{
 configureWorld(18292);const snap=captureWorldSnapshot(),baseline=Object.fromEntries(['village','forest','sanctuary','marsh','spire'].map(zone=>[zone,layout(zone)]));
 const old=structuredClone(snap);delete old.tiles.ossuary;delete old.poi.ossuary;delete old.tiles.garden;delete old.poi.garden;
 assert.equal(validateWorldSnapshot(old),true);
 configureWorld(18292,old);
 for(const zone of Object.keys(baseline))assert.equal(layout(zone),baseline[zone],zone);
 const expanded=captureWorldSnapshot();assert.equal(validateWorldSnapshot(expanded),true);
 assert.equal(expanded.poi.ossuary.length,ZONES.ossuary.landmarks.length);
 assert.equal(expanded.poi.garden.length,ZONES.garden.landmarks.length);
 const malformed=structuredClone(expanded);delete malformed.tiles.ossuary;
 assert.equal(validateWorldSnapshot(malformed),false);
});
test('finite witness XP is accepted only for legitimate unclaimed regional encounters',()=>{
 for(const zone of ['ossuary','garden']){
  assert.ok(firstRoamerVictoryBonus('wild',zone+'-0',[])>0);
  assert.equal(firstRoamerVictoryBonus('wild',zone+'-0',['roamer-'+zone+'-0']),0);
  assert.equal(firstRoamerVictoryBonus('expedition',zone+'-0',[]),0);
  assert.equal(firstRoamerVictoryBonus('wild',zone+'-3',[]),0);
 }
});
