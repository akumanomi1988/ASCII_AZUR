import test from 'node:test';
import assert from 'node:assert/strict';
import {configureWorld,captureWorldSnapshot,ZONE_IDS,ZONES} from '../dist/world.js';
import {createCreature,validateSave} from '../dist/domain.js';
import {reveal} from '../dist/world/discovery.js';
import {regionalObjectives} from '../dist/world/field-journal.js';
import {visibleEncounters} from '../dist/world/encounters.js';
import {regionFieldGuide,landmarkFieldHint,witnessFieldHint,witnessFieldAftermath,nextKnownFieldLead,wildPacing} from '../dist/world/exploration-flow.js';
const state=seed=>{configureWorld(seed);return{version:1,worldSeed:seed,worldSnapshot:captureWorldSnapshot(),zone:'village',x:4,y:16,team:[createCreature('cindrel',7,()=>.5)],storage:[],inventory:{seals:5,tonics:3},flags:[],defeatedBoss:false,playSeconds:0,rpg:{echoes:0,completed:[],visitedNpcs:[]}};};
test('seven region themes contain specific reason and outcome, with optional aftermath gating',()=>{
 for(const zone of ZONE_IDS){const info=regionFieldGuide(zone,[]);assert.ok(info.title&&info.purpose&&info.payoff);
  if(zone==='ossuary'||zone==='garden')assert.match(info.purpose,/historia aún no/);
 }
 assert.match(regionFieldGuide('ossuary',['crown-trilogy-complete']).purpose,/Edda/);
 assert.match(regionFieldGuide('garden',['afterlight-ossuary-complete']).purpose,/Silas/);
});
test('landmark hints reflect actual one-time chest economy without promising fake repeat rewards',()=>{
 for(const zone of ZONE_IDS){
  const chest=ZONES[zone].landmarks.find(l=>l.kind==='chest');if(!chest)continue;
  assert.match(landmarkFieldHint(zone,chest,false),/3 Sellos, 2 Tónicos y 25 Ecos/);
  assert.match(landmarkFieldHint(zone,chest,true),/Ya saqueado/);
 }
});
test('all authored witness leads have unique roles, valid elemental counter advice and completion echoes',()=>{
 for(const zone of ZONE_IDS.filter(z=>z!=='village')){
  const enemies=visibleEncounters(zone,17);assert.equal(enemies.length,3);
  const narratives=[];
  for(let i=0;i<3;i++){
   const e=enemies[i],before=witnessFieldHint(zone,i,e.speciesId,false);
   const after=witnessFieldHint(zone,i,e.speciesId,true);
   assert.match(before,/contraataque elemental/);assert.notEqual(before,after);
   const flags=['roamer-'+e.id],out=witnessFieldAftermath(zone,e.id,flags);
   assert.match(out,/TESTIGO/);narratives.push(before);
  }
  assert.equal(new Set(narratives).size,3);
  assert.match(witnessFieldAftermath(zone,'wrong-0',[] )??'',/^$/);
 }
});
test('known lead suggestions never expose undiscovered coordinates and ignore completed/rewarded landmarks',()=>{
 const s=state(170);const village=ZONES.village.landmarks;
 let entries=regionalObjectives(s,'village');
 assert.equal(nextKnownFieldLead(entries,'village',4,16),null);
 s.discovered=reveal(s.discovered,'village',village[0].x,village[0].y);
 entries=regionalObjectives(s,'village');const lead=nextKnownFieldLead(entries,'village',4,16);
 assert.ok(lead);assert.equal(lead.label,village[0].label);
 s.flags.push('archivist');s.rpg.visitedNpcs.push('archivist');
 entries=regionalObjectives(s,'village');
 assert.notEqual(nextKnownFieldLead(entries,'village',4,16)?.id,lead.id);
});
test('bounded wilderness encounter frequency preserves early threat and fair repeat exploration',()=>{
 assert.deepEqual(wildPacing('forest',[]),{chance:.22,distance:6,reason:'TERRITORIO ACTIVO'});
 assert.equal(wildPacing('marsh',[]).chance,.12);
 const flags=['roamer-marsh-0','roamer-marsh-1','roamer-marsh-2'];
 assert.equal(wildPacing('marsh',flags).chance,.07);
 assert.equal(wildPacing('marsh',[...flags,'survey-marsh']).chance,.035);
 assert.ok(wildPacing('marsh',[...flags,'survey-marsh']).distance>wildPacing('marsh',flags).distance);
});
test('200 saved procedural worlds keep proposed leads spoiler-proof and story/flag-safe',()=>{
 let checks=0;
 for(let seed=1;seed<=200;seed++){
  const s=state(seed),before=JSON.stringify(s);
  for(const zone of ZONE_IDS){
   const altar=ZONES[zone].landmarks.find(l=>l.kind==='altar');
   const entries=regionalObjectives(s,zone);
   assert.ok(entries.filter(e=>!e.known).every(e=>e.x===undefined&&e.y===undefined));
   s.discovered=reveal(s.discovered,zone,altar.x,altar.y);
   const seen=regionalObjectives(s,zone).find(e=>e.kind==='altar');
   assert.ok(seen.known&&seen.trackable);
   const proposed=nextKnownFieldLead(regionalObjectives(s,zone),zone,altar.x,altar.y);
   if(proposed)assert.ok(regionalObjectives(s,zone).some(o=>o.id===proposed.id&&o.known&&o.trackable));
   checks++;
  }
  assert.ok(validateSave(s));assert.equal(s.flags.length,0);
  configureWorld(seed,s.worldSnapshot);assert.deepEqual(captureWorldSnapshot(),s.worldSnapshot);
 }
 assert.equal(checks,1400);
});
