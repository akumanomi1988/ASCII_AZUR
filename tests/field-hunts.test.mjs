import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,validateSave} from '../dist/domain.js';
import {configureWorld,captureWorldSnapshot,ZONE_IDS} from '../dist/world.js';
import {BIOME_DUEL_SPECIES,activeWildBiome,biomeDuelLevel} from '../dist/world/encounters.js';
import {fieldHuntBoard,fieldHuntPermission} from '../dist/creatures/field-hunts.js';
import {mount} from './helpers/game-runtime.mjs';

function save(zone='forest',flags=[],seed=173){
 configureWorld(seed);
 return{version:1,zone,x:4,y:16,worldSeed:seed,worldSnapshot:captureWorldSnapshot(),
  team:[createCreature('cindrel',12,()=>.5),createCreature('velaria',12,()=>.5)],
  storage:[],inventory:{seals:6,tonics:4},flags:[...flags],defeatedBoss:false,
  playSeconds:0,rpg:{echoes:30,completed:[],visitedNpcs:[]}};
}
test('all seven areas yield three native direct encounters, no extra species or altered world, 200 seeded worlds',()=>{
 let candidates=0;
 for(let seed=1;seed<=200;seed++){
  const s=save('village',[],seed);const original=JSON.stringify(s),topology=JSON.stringify(s.worldSnapshot);
  for(const zone of ZONE_IDS){
   s.zone=zone;const b=fieldHuntBoard(s);
   assert.ok(b,zone);assert.equal(b.zone,zone);
   assert.equal(b.habitat,activeWildBiome(zone,s.flags));
   assert.deepEqual(b.entries.map(e=>e.id),BIOME_DUEL_SPECIES[b.habitat]);
   assert.equal(b.entries.length,3);assert.ok(b.entries.every((e,i)=>e.level===biomeDuelLevel(zone,i)));
   assert.ok(b.entries.every(e=>e.bestLeadUid&&e.counterElement&&e.forecast&&e.recruitment));
   for(const e of b.entries){
    assert.equal(fieldHuntPermission(s,e.id,b.entries[0].bestLeadUid)?.id,e.id);
    assert.equal(fieldHuntPermission(s,'hollowhart',b.entries[0].bestLeadUid),null);
    candidates++;
   }
  }
  assert.equal(JSON.stringify(s.worldSnapshot),topology);
  s.zone='village';assert.equal(JSON.stringify(s),original);
  assert.ok(validateSave(s));
 }
 assert.equal(candidates,4200);
});
test('later chapter habitats reveal actual fauna only after existing chapter completion, never early spoilers',()=>{
 const s=save('marsh',[]);
 assert.equal(fieldHuntBoard(s).habitat,'sanctuary');
 assert.ok(!fieldHuntBoard(s).entries.some(e=>e.id==='mourveil'||e.id==='bellroot'));
 s.flags.push('marsh-chapter-complete');
 assert.equal(fieldHuntBoard(s).habitat,'marsh');
 assert.ok(fieldHuntBoard(s).entries.some(e=>e.id==='mourveil'));
 s.zone='spire';
 assert.equal(fieldHuntBoard(s).habitat,'sanctuary');
 assert.ok(!fieldHuntBoard(s).entries.some(e=>e.id==='ashglass'));
 s.flags.push('crown-trilogy-complete');
 assert.equal(fieldHuntBoard(s).habitat,'spire');
 assert.ok(fieldHuntBoard(s).entries.some(e=>e.id==='ashglass'));
});
test('research states and supply warnings derive from actual saved roster, not optimistic guesses',()=>{
 const s=save('village',['research-seen-mireling']);
 let b=fieldHuntBoard(s);assert.equal(b.entries.find(e=>e.id==='mireling').status,'seen');
 assert.equal(b.entries.find(e=>e.id==='briarling').status,'unseen');
 s.storage.push(createCreature('mireling',8,()=>.5));b=fieldHuntBoard(s);
 assert.equal(b.entries.find(e=>e.id==='mireling').status,'bonded');
 s.inventory.seals=0;s.storage=Array.from({length:500},(_,i)=>({...createCreature('velaria',8,()=>.5),uid:'reserve-'+i}));
 s.team=Array.from({length:6},(_,i)=>({...createCreature('cindrel',8,()=>.5),uid:'ally-'+i}));
 b=fieldHuntBoard(s);assert.equal(b.seals,0);assert.equal(b.captureRoom,false);
 assert.equal(fieldHuntPermission(s,'mireling','missing-leader'),null);
 s.team[0].hp=0;assert.equal(fieldHuntPermission(s,'mireling','ally-0'),null);
 s.team[1].hp=0;s.team[2].hp=0;s.team[3].hp=0;s.team[4].hp=0;s.team[5].hp=0;
 assert.equal(fieldHuntBoard(s).available,false);assert.equal(fieldHuntPermission(s,'mireling','ally-0'),null);
});
test('dungeon, expedition and battle reject duel planning without mutating save state',()=>{
 const s=save('forest');const before=JSON.stringify(s);
 s.activeBattle={};assert.equal(fieldHuntBoard(s),null);delete s.activeBattle;
 s.expedition={};assert.equal(fieldHuntBoard(s),null);delete s.expedition;
 s.dungeon={active:true};assert.equal(fieldHuntBoard(s),null);delete s.dungeon;
 assert.equal(JSON.stringify(s),before);
});
test('real game briefing, leader choice and wild battle use existing combat and update Codex sighting',()=>{
 const {game,dom,storage}=mount({virtualTime:true,seed:541});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 game.openDuel();
 assert.match(dom.get('modalContent').innerHTML,/CAMINO DEL CAZADOR/);
 assert.match(dom.get('modalContent').innerHTML,/LECCIONES|LECCIÓN/);
 assert.equal(game.prepareFieldDuel('hollowhart'),false);
 assert.equal(game.prepareFieldDuel('mireling'),true);
 assert.match(dom.get('modalContent').innerHTML,/PREPARACIÓN TÁCTICA/);
 const uid=game.save.team[0].uid;
 assert.equal(game.launchFieldDuel('mireling','invalid'),false);
 assert.equal(game.launchFieldDuel('mireling',uid),true);
 assert.equal(game.battle.enemy.speciesId,'mireling');assert.equal(game.battle.type,'wild');
 assert.equal(game.battle.ally,0);
 assert.ok(game.save.flags.includes('research-seen-mireling'));
 assert.equal(game.launchFieldDuel('mireling',uid),false);
 game.finishBattle();game.saveNow(false);
 const persisted=storage.getItem('ascii-azur-save-v1');
 assert.equal(validateSave(JSON.parse(persisted)),true);
 const reloaded=mount({virtualTime:true,priorSave:persisted});reloaded.game.continueGame();reloaded.game.openDuel();
 assert.match(reloaded.dom.get('modalContent').innerHTML,/AVISTADA/);
 reloaded.game.openCodex();
 assert.match(reloaded.dom.get('modalContent').innerHTML,/AVISTADA/);
});
test('real runtime blocks early late-stage duel IDs and unlocks only after chapter',()=>{
 const {game,dom}=mount({virtualTime:true,seed:441});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 game.save.zone='marsh';game.openDuel();
 assert.match(dom.get('modalContent').innerHTML,/FAUNA EN TRÁNSITO/);
 assert.equal(game.prepareFieldDuel('mourveil'),false);
 game.save.flags.push('marsh-chapter-complete');
 game.openDuel();assert.equal(game.prepareFieldDuel('mourveil'),true);
});


test('hunt briefing selects the exact stronger same-species ally and starts that one',()=>{
 const {game,dom}=mount({virtualTime:true,seed:643});
 game.startNew();game.pickStarter('cindrel');while(game.dialogOpen)game.nextDialog();
 game.save.team=[
  {...createCreature('velaria',3,()=>.11),uid:'weak-first',hp:2},
  {...createCreature('velaria',18,()=>.22),uid:'strong-second'}
 ];
 const before=JSON.stringify(game.save.team);
 const board=fieldHuntBoard(game.save),candidate=board.entries[0];
 assert.equal(candidate.bestLeadUid,'strong-second','do not select first copy by species');
 assert.equal(JSON.stringify(game.save.team),before,'advice must not change the roster');
 game.openDuel();
 assert.equal(game.prepareFieldDuel(candidate.id),true);
 const markup=dom.get('modalContent').innerHTML;
 assert.match(markup,/<option value="strong-second" selected>/);
 assert.match(markup,/RECOMENDADO/);
 assert.equal(game.launchFieldDuel(candidate.id,candidate.bestLeadUid),true);
 assert.equal(game.battle.ally,1,'the battle must start with the recommended UID');
});
