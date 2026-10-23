import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {BOND_ARCS,bondAtZone,bondProgress,bondFlag,bondChoice,bondAttackDamage,bondIncomingDamage} from '../dist/creatures/bond-quests.js';

test('P3: four authored trials connect evolution, regional discoveries and altars',()=>{
 assert.equal(BOND_ARCS.length,4);
 assert.equal(new Set(BOND_ARCS.map(a=>a.zone)).size,4);
 assert.equal(new Set(BOND_ARCS.map(a=>a.speciesId)).size,4);
 for(const arc of BOND_ARCS){
  assert.equal(bondAtZone(arc.zone),arc);
  const evolved=createCreature(arc.speciesId,arc.minLevel,()=>.4);
  const fresh=bondProgress(arc,[],[evolved]);
  assert.equal(fresh.stage,'discover');
  assert.equal(fresh.creatureReady,true);
  assert.equal(fresh.memories,0);
  assert.equal(bondProgress(arc,arc.prerequisiteFlags,[evolved]).stage,'ready');
  const old=createCreature(arc.speciesId,Math.max(1,arc.minLevel-1),()=>.4);
  assert.equal(bondProgress(arc,arc.prerequisiteFlags,[old]).stage,'awaken');
  assert.equal(bondProgress(arc,[...arc.prerequisiteFlags,bondFlag(arc.id,'ward')],[old]).stage,'claimed');
 }
});

test('P3: chosen covenant is deterministic, species-specific and mutually exclusive in effect',()=>{
 for(const arc of BOND_ARCS){
  const fang=[bondFlag(arc.id,'fang')],ward=[bondFlag(arc.id,'ward')];
  assert.equal(bondChoice(fang,arc.speciesId),'fang');
  assert.equal(bondChoice(ward,arc.speciesId),'ward');
  assert.equal(bondAttackDamage(16,fang,arc.speciesId),20);
  assert.equal(bondAttackDamage(16,ward,arc.speciesId),16);
  assert.equal(bondIncomingDamage(20,ward,arc.speciesId),17);
  assert.equal(bondIncomingDamage(20,fang,arc.speciesId),20);
  assert.equal(bondAttackDamage(16,fang,'hollowhart'),16);
  assert.equal(bondIncomingDamage(20,ward,'hollowhart'),20);
  assert.equal(bondAttackDamage(0,fang,arc.speciesId),0);
  assert.equal(bondIncomingDamage(0,ward,arc.speciesId),0);
 }
});

test('P3: old v1 saves and claimed choices round-trip without a schema migration',()=>{
 const arc=BOND_ARCS[2];
 const roster=[createCreature(arc.speciesId,arc.minLevel,()=>.3)];
 const base={version:1,zone:arc.zone,x:14,y:16,team:roster,storage:[],inventory:{seals:3,tonics:2},defeatedBoss:true,flags:[...arc.prerequisiteFlags],playSeconds:10};
 assert.equal(validateSave(base),true);
 assert.equal(bondProgress(arc,base.flags,base.team).stage,'ready');
 const before=JSON.stringify(base);
 const claimed={...base,flags:[...base.flags,bondFlag(arc.id,'ward')]};
 assert.equal(validateSave(claimed),true);
 const restored=JSON.parse(JSON.stringify(claimed));
 assert.equal(bondProgress(arc,restored.flags,restored.team).stage,'claimed');
 assert.equal(bondChoice(restored.flags,arc.speciesId),'ward');
 assert.equal(JSON.stringify(base),before);
});
