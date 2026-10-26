import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {RELIC_IDS} from '../dist/creatures/equipment.js';
import {legacyBranch,legacyClaimed,legacyReward,legacyReceipt,planLegacyClaim,LEGACY_WITNESS_FLAG} from '../dist/story-legacy.js';
import {azurNarrativeBeat} from '../dist/story-agency.js';
import {storyChronicle} from '../dist/story-presentation.js';
import {mount} from './helpers/game-runtime.mjs';

const baseFlags=['archivist','zone-forest','zone-sanctuary','arken-vow-restored','zone-marsh','marsh-met-nael',
  'marsh-chapter-complete','zone-spire','crown-met-oriel','crown-nullscribe-fallen','crown-trilogy-complete'];
const flags=(marsh,crown)=>[...baseFlags,'marsh-choice-'+marsh,'crown-choice-'+crown];
function save(m='keep',c='remember'){
 return {version:1,zone:'village',x:8,y:16,team:[createCreature('cindrel',10,()=>.3)],
  storage:[],inventory:{seals:3,tonics:2},flags:flags(m,c),defeatedBoss:true,playSeconds:10,
  rpg:{echoes:200,completed:[],visitedNpcs:[]},relics:{}};
}
test('four preexisting moral combinations become distinct non-spoiling witnessed outcomes',()=>{
 const ids=new Set(),descriptions=new Set(),relics=new Set();
 for(const m of ['keep','release'])for(const c of ['remember','renew']){
  const f=flags(m,c),copy=JSON.stringify(f),out=legacyBranch(f);
  assert.ok(out);ids.add(out.id);descriptions.add(out.resolution);relics.add(out.relic);
  assert.ok(out.nael.includes('Nael')&&out.oriel.includes('Oriel')&&out.opening.includes('Iria'));
  assert.equal(JSON.stringify(f),copy);
  assert.equal(legacyBranch([...f,LEGACY_WITNESS_FLAG]).id,out.id);
 }
 assert.equal(ids.size,4);assert.equal(descriptions.size,4);assert.equal(relics.size,4);
});
test('no premature, forged or contradictory branches and no spoilers before the final decision',()=>{
 assert.equal(legacyBranch([]),null);
 assert.equal(legacyBranch(baseFlags),null);
 assert.equal(legacyBranch([...flags('keep','remember'),'marsh-choice-release']),null);
 assert.equal(legacyBranch([...flags('keep','remember'),'crown-choice-renew']),null);
 assert.equal(legacyBranch(flags('keep','remember').filter(x=>x!=='crown-trilogy-complete')),null);
});
test('real relic award is finite, one-time, save-v1-valid and survives JSON reload',()=>{
 for(const m of ['keep','release'])for(const c of ['remember','renew']){
  const old=save(m,c),before=JSON.stringify(old),next=planLegacyClaim(old);
  assert.equal(JSON.stringify(old),before,'pure preparation');
  assert.ok(next);assert.equal(next.flags.length,old.flags.length+1);
  assert.equal(next.relics[legacyBranch(old.flags).relic],1);
  assert.equal(validateSave(next),true);
  const restored=JSON.parse(JSON.stringify(next));
  assert.equal(legacyClaimed(restored.flags),true);
  assert.equal(planLegacyClaim(restored),null);
  assert.equal(JSON.stringify(old),before);
 }
});
test('equipment stock caps select a deterministic alternative; full stock preserves story completion',()=>{
 const s=save();s.relics={'echo-prism':6};
 const result=planLegacyClaim(s);
 assert.ok(result);assert.equal(result.relics['echo-prism'],6);assert.equal(result.relics[RELIC_IDS[0]],1);
 assert.equal(legacyReward(s),RELIC_IDS[0]);
 const full=save();full.relics=Object.fromEntries(RELIC_IDS.map(id=>[id,6]));
 const next=planLegacyClaim(full);
 assert.ok(next);assert.deepEqual(next.relics,full.relics);assert.ok(next.flags.includes(LEGACY_WITNESS_FLAG));
 assert.match(legacyReceipt(full),/completas/);
});
test('busy combat, crypt, expedition, overflowing flags and corrupted ownership refuse without mutations',()=>{
 const changes=[
  s=>{s.activeBattle={};},
  s=>{s.dungeon={active:true};},
  s=>{s.expedition={};},
  s=>{s.flags=Array.from({length:200},(_,i)=>'filler-'+i).concat(flags('keep','remember'));},
  s=>{s.relics={'echo-prism':7};},
  s=>{s.relics={'pilgrim-ward':-1};}
 ];
 for(const alter of changes){
  const s=save();alter(s);const snapshot=JSON.stringify(s);
  assert.equal(planLegacyClaim(s),null);assert.equal(JSON.stringify(s),snapshot);
 }
});
test('chronicle and journal preserve original structure and reveal witnessed closure only when earned',()=>{
 const before=save(),after=planLegacyClaim(before);
 const state=s=>({flags:s.flags,defeatedBoss:true,dungeonFinished:true});
 const old=storyChronicle(state(before)),newer=storyChronicle(state(after));
 assert.equal(newer.length,old.length);
 assert.equal(newer[2].passages.length,old[2].passages.length+1);
 assert.match(newer[2].passages.at(-1),/Arken|nombres|destino|vidas/);
 assert.notEqual(azurNarrativeBeat(state(before)).next,azurNarrativeBeat(state(after)).next);
});
test('actual Archivist visit claims reward through save CAS and persists after reload, without repeats',()=>{
 const {game,dom,storage}=mount({virtualTime:true,seed:456});
 game.startNew();game.pickStarter('cindrel');
 while(game.dialogOpen)game.nextDialog();
 game.save.flags.push(...flags('keep','renew').filter(f=>!game.save.flags.includes(f)));
 game.save.zone='village';game.save.x=8;game.save.y=16;
 game.interactNpc('archivist');
 assert.match(dom.get('modalContent').innerHTML,/TESTIMONIO|ATLAS|AMANECER/);
 const candidate=planLegacyClaim(game.save);
 assert.ok(candidate,'real NPC action should meet all pure claim preconditions');
 assert.equal(validateSave(candidate),true,'result must be a persistable v1 snapshot');
 const committed=game.claimLegacyWitness();
 assert.equal(committed,true,JSON.stringify({saveStatus:dom.get('saveStatus').textContent,dialogOpen:game.dialogOpen,modalOpen:game.modalOpen,zone:game.save.zone,flags:game.save.flags.length}));
 assert.equal(game.save.flags.includes(LEGACY_WITNESS_FLAG),true);
 assert.equal(game.save.relics['ember-tooth'],1);
 const raw=storage.getItem('ascii-azur-save-v1');
 assert.ok(raw);assert.equal(validateSave(JSON.parse(raw)),true);
 const resumed=mount({virtualTime:true,priorSave:raw});
 resumed.game.continueGame();
 assert.equal(resumed.game.save.flags.includes(LEGACY_WITNESS_FLAG),true);
 assert.equal(resumed.game.save.relics['ember-tooth'],1);
 assert.equal(resumed.game.claimLegacyWitness(),false);
});
test('claim requires physical Archivist proximity; diary preview remains read-only',()=>{
 const {game,dom}=mount({virtualTime:true,seed:456});
 game.startNew();game.pickStarter('thorne');while(game.dialogOpen)game.nextDialog();
 game.save.flags.push(...flags('release','remember').filter(f=>!game.save.flags.includes(f)));
 game.save.zone='forest';game.save.x=16;game.save.y=16;
 game.openQuests();assert.match(dom.get('modalContent').innerHTML,/TESTIMONIO DE ARKEN/);
 game.openLegacyWitness();assert.match(dom.get('modalContent').innerHTML,/REGRESA AL ARCHIVISTA/);
 assert.equal(game.claimLegacyWitness(),false);
 assert.equal(legacyClaimed(game.save.flags),false);
});
