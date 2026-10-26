import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {BIOME_DUEL_SPECIES,BIOME_WILD_SPECIES} from '../dist/world/encounters.js';
import {RESEARCH_TIERS,RESEARCH_REWARD_PREFIX,recordSpeciesResearch,researchCatalogue,nextResearchLead,claimResearchTier} from '../dist/creatures/field-research.js';

function creature(id){return createCreature(id,12,()=>.42)}
const capturable=['cindrel','cinderwulf','velaria','thorne','wispawn','gravemoth','mireling','runeowl','ashboar','rillfin','briarling','mourveil','mnemoshade','bellroot','ashglass','tideworn','frostlark'];
function state(count=0){
 const team=capturable.slice(0,Math.min(6,count)).map(creature);
 const storage=capturable.slice(6,count).map(creature);
 return{team,storage,flags:[],inventory:{seals:2,tonics:1},rpg:{echoes:35,completed:[],visitedNpcs:[]}};
}

test('field research lists 17 capturable species and excludes the two bosses from rewards',()=>{
 const r=researchCatalogue([],[],[]);
 assert.equal(r.total,17);assert.equal(r.bonded,0);assert.equal(r.seen,0);
 assert.equal(r.entries.length,19);
 assert.equal(r.entries.filter(x=>!x.capturable).length,2);
 assert.equal(r.entries.find(x=>x.id==='hollowhart').capturable,false);
 for(const id of capturable){
  const entry=r.entries.find(x=>x.id===id);
  assert.ok(entry,id);
  assert.ok(entry.habitats.length>0,id+' needs an accessible habitat');
  assert.ok(entry.habitats.some(zone=>BIOME_WILD_SPECIES[zone].includes(id)||BIOME_DUEL_SPECIES[zone].includes(id)));
 }
});

test('first encounter is remembered but never falsely counts as a capture',()=>{
 const flags=[];
 assert.equal(recordSpeciesResearch(flags,'mireling','seen'),true);
 assert.equal(recordSpeciesResearch(flags,'mireling','seen'),false);
 assert.equal(recordSpeciesResearch(flags,'not-a-creature','seen'),false);
 const seen=researchCatalogue([creature('cindrel')],[],flags);
 assert.equal(seen.bonded,1);assert.equal(seen.seen,2);
 assert.equal(seen.entries.find(x=>x.id==='mireling').status,'seen');
 assert.equal(seen.entries.find(x=>x.id==='wispawn').status,'unknown');
 assert.equal(recordSpeciesResearch(flags,'mireling','bonded'),true);
 assert.equal(researchCatalogue([creature('cindrel')],[],flags).bonded,2);
 assert.equal(recordSpeciesResearch(flags,'mireling','seen'),false);
});

test('evolved species preserve original bonds via stored lineage flags',()=>{
 const flags=[];
 recordSpeciesResearch(flags,'briarling','bonded');
 recordSpeciesResearch(flags,'thorne','bonded');
 const r=researchCatalogue([creature('thorne')],[],flags);
 assert.equal(r.bonded,2);
 assert.equal(r.entries.find(e=>e.id==='briarling').status,'bonded');
 const legacy=researchCatalogue([creature('thorne')],[],[]);
 assert.equal(legacy.bonded,1,'legacy save cannot invent an unrecorded predecessor');
});

test('all four tiers can only be claimed once and never alter old saves until requested',()=>{
 const s=state(17),before=JSON.stringify(s);
 assert.equal(researchCatalogue(s.team,s.storage,s.flags).bonded,17);
 assert.equal(JSON.stringify(s),before);
 for(const tier of RESEARCH_TIERS){
  assert.equal(claimResearchTier(s,tier.id),'claimed');
  assert.equal(claimResearchTier(s,tier.id),'already');
  assert.ok(s.flags.includes(RESEARCH_REWARD_PREFIX+tier.id));
 }
 assert.equal(s.rpg.echoes,35+RESEARCH_TIERS.reduce((a,x)=>a+x.echoes,0));
 assert.equal(s.inventory.seals,2+RESEARCH_TIERS.reduce((a,x)=>a+x.seals,0));
 assert.equal(s.inventory.tonics,1+RESEARCH_TIERS.reduce((a,x)=>a+x.tonics,0));
 assert.equal(s.flags.length,4);
 for(const tier of RESEARCH_TIERS)assert.equal(s.relics[tier.relic],1,'one useful relic per tier');
 assert.ok(validateSave({version:1,zone:'forest',x:6,y:16,...s,defeatedBoss:false,playSeconds:99}));
});

test('tier conditions are monotonic and cannot be bypassed with repeated specimens or bosses',()=>{
 const s=state(3);
 assert.equal(claimResearchTier(s,'living-atlas'),'locked');
 s.storage.push(creature('cindrel'),creature('hollowhart'));
 assert.equal(researchCatalogue(s.team,s.storage,s.flags).bonded,3);
 assert.equal(claimResearchTier(s,'first-names'),'claimed');
 assert.equal(claimResearchTier(s,'all-names'),'locked');
 assert.equal(claimResearchTier(s,'invented-reward'),'unknown');
});

test('saturated resources or full flag list refuse atomically without burning the milestone',()=>{
 const s=state(17);
 const first=RESEARCH_TIERS[0];
 s.inventory.seals=9999;
 const old=JSON.stringify(s);
 assert.equal(claimResearchTier(s,first.id),'full');assert.equal(JSON.stringify(s),old);
 s.inventory.seals=1;s.inventory.tonics=9999;
 const next=JSON.stringify(s);
 assert.equal(claimResearchTier(s,first.id),'full');assert.equal(JSON.stringify(s),next);
 s.inventory.tonics=1;s.rpg.echoes=999999;
 assert.equal(claimResearchTier(s,first.id),'full');
 s.rpg.echoes=35;
 s.flags=Array.from({length:200},(_,i)=>'other-'+i);
 assert.equal(recordSpeciesResearch(s.flags,'wispawn','seen'),false);
 assert.equal(claimResearchTier(s,first.id),'full');
 assert.equal(s.flags.length,200);
});

test('research flags survive legacy version-one save validation and JSON reload',()=>{
 const s=state(7);recordSpeciesResearch(s.flags,'gravemoth','seen');
 assert.equal(claimResearchTier(s,'first-names'),'claimed');
 const save={version:1,zone:'forest',x:6,y:16,...s,defeatedBoss:false,playSeconds:99};
 assert.equal(validateSave(save),true);
 const restored=JSON.parse(JSON.stringify(save));
 assert.equal(validateSave(restored),true);
 assert.equal(claimResearchTier(restored,'first-names'),'already');
 assert.equal(researchCatalogue(restored.team,restored.storage,restored.flags).bonded,7);
});

test('tiered tactical rewards persist as normal v1 relic inventory without cloning',()=>{
 const s=state(7);
 assert.equal(claimResearchTier(s,'first-names'),'claimed');
 assert.equal(s.relics['hearth-bead'],1);
 assert.equal(claimResearchTier(s,'living-atlas'),'claimed');
 assert.equal(s.relics['root-knot'],1);
 const save={version:1,zone:'forest',x:6,y:16,...s,defeatedBoss:false,playSeconds:99};
 assert.equal(validateSave(save),true);
 const snapshot=JSON.stringify(save),reloaded=JSON.parse(snapshot);
 assert.equal(claimResearchTier(reloaded,'first-names'),'already');
 assert.equal(JSON.stringify(reloaded),snapshot);
});
test('saturated tier gear falls back deterministically, or lets a fully stocked collector complete',()=>{
 const s=state(3);s.relics={'hearth-bead':6};
 assert.equal(claimResearchTier(s,'first-names'),'claimed');
 assert.equal(s.relics['hearth-bead'],6);
 assert.equal(s.relics['ember-tooth'],1);
 const all=state(17);
 all.relics=Object.fromEntries(['ember-tooth','mist-pearl','root-knot','echo-prism','pilgrim-ward','hearth-bead'].map(id=>[id,6]));
 assert.equal(claimResearchTier(all,'first-names'),'claimed');
 assert.equal(Object.values(all.relics).reduce((a,b)=>a+b,0),36);
 assert.equal(claimResearchTier(all,'first-names'),'already');
});
test('invalid relic state refuses research atomically',()=>{
 for(const relics of [[],null,{'hearth-bead':-1},{'hearth-bead':7},{'hearth-bead':1.5}]){
  const s=state(3);s.relics=relics;const before=JSON.stringify(s);
  assert.equal(claimResearchTier(s,'first-names'),'full');
  assert.equal(JSON.stringify(s),before);
 }
});
test('field recruit guidance requires a seen uncaught wild in a known active habitat',()=>{
 const flags=['research-seen-mireling','research-seen-wispawn'];
 const summary=researchCatalogue([creature('cindrel')],[],flags),before=JSON.stringify(summary);
 const lead=nextResearchLead(summary,flags,['forest'],'forest','Raíz');
 assert.ok(lead);assert.equal(lead.zone,'forest');
 assert.ok(['mireling','wispawn'].includes(lead.id));
 assert.equal(JSON.stringify(summary),before);
 assert.equal(nextResearchLead(researchCatalogue([],[],[]),[],['forest'],'forest'),null);
 assert.equal(nextResearchLead(summary,flags,['village'],'village'),null);
 assert.equal(nextResearchLead(summary,flags,[],'forest'),null);
 const owned=researchCatalogue([creature('cindrel'),creature('mireling'),creature('wispawn')],[],flags);
 assert.equal(nextResearchLead(owned,flags,['forest'],'forest'),null);
});
test('chapter-locked later wilds are never recommended until their pool is active',()=>{
 const seen=['research-seen-mourveil'];
 const summary=researchCatalogue([creature('cindrel')],[],seen);
 assert.equal(nextResearchLead(summary,seen,['marsh'],'marsh'),null);
 assert.equal(nextResearchLead(summary,[...seen,'marsh-chapter-complete'],['marsh'],'marsh')?.id,'mourveil');
});
