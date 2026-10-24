import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,damage,maxHp,MOVES,validateSave,validateBattleCheckpoint,gainExp} from '../dist/domain.js';
import {RELICS,RELIC_IDS,setCreatureRelic,buyRelic,grantRelic,freeRelicCopies,validRelicOwnership} from '../dist/creatures/equipment.js';
import {attackWithStatuses,skillUtility,drainHealing,effectiveHealing,recoveryCastsLeft} from '../dist/combat/tactics.js';
import {previewMove} from '../dist/combat/move-preview.js';
import {suggestBattleAction} from '../dist/combat/planning.js';
import {newJourneyMetrics,recordJourney,journeyReport,validJourneyMetrics} from '../dist/core/journey-metrics.js';
import {transferStoredCreature} from '../dist/party.js';
import {writeSave,readSave} from '../dist/core/save-store.js';
import {mount} from './helpers/game-runtime.mjs';
const saved=()=>({version:1,zone:'village',x:4,y:16,team:[createCreature('cindrel',8,()=>.1)],storage:[createCreature('velaria',8,()=>.2)],inventory:{seals:5,tonics:3},flags:[],defeatedBoss:false,playSeconds:0,rpg:{echoes:200,completed:[],visitedNpcs:[]}});
const start=()=>{const r=mount({virtualTime:true,seed:721});r.game.startNew();r.game.pickStarter('velaria');while(r.game.dialogOpen)r.game.nextDialog();return r;};

test('relic ownership: purchase debits exact cost; unknown items, poor/capped inventory and battle edits refuse atomically',()=>{
 const s=saved();assert.equal(RELIC_IDS.length,6);const before=s.rpg.echoes;
 assert.equal(buyRelic(s,'mist-pearl'),true);assert.equal(s.rpg.echoes,before-RELICS['mist-pearl'].cost);
 s.rpg.echoes=0;const snapshot=JSON.stringify(s);assert.equal(buyRelic(s,'mist-pearl'),false);assert.equal(buyRelic(s,'toString'),false);assert.equal(JSON.stringify(s),snapshot);
 s.rpg.echoes=200;s.relics['mist-pearl']=6;assert.equal(buyRelic(s,'mist-pearl'),false);
 s.activeBattle={};assert.equal(buyRelic(s,'pilgrim-ward'),false);assert.equal(setCreatureRelic(s,s.team[0].uid,'mist-pearl'),false);
});
test('one relic slot: never shares one copy across team/reserve, replacing and removing returns availability',()=>{
 const s=saved();s.relics={'mist-pearl':1,'pilgrim-ward':1};
 assert.equal(setCreatureRelic(s,s.team[0].uid,'mist-pearl'),true);assert.equal(freeRelicCopies(s,'mist-pearl'),0);
 assert.equal(setCreatureRelic(s,s.storage[0].uid,'mist-pearl'),false);
 assert.equal(setCreatureRelic(s,s.team[0].uid,'pilgrim-ward'),true);assert.equal(freeRelicCopies(s,'mist-pearl'),1);
 assert.equal(setCreatureRelic(s,s.storage[0].uid,'mist-pearl'),true);
 assert.equal(setCreatureRelic(s,s.team[0].uid,null),true);assert.equal(s.team[0].equipment,undefined);
 assert.equal(freeRelicCopies(s,'pilgrim-ward'),1);assert.equal(validRelicOwnership(s.relics,[...s.team,...s.storage]),true);
});
test('equipment persists through evolution, reserve transfers and primary/backup save round trips',()=>{
 const s=saved();s.relics={'ember-tooth':1};assert.equal(setCreatureRelic(s,s.team[0].uid,'ember-tooth'),true);
 gainExp(s.team[0],500);assert.equal(s.team[0].equipment,'ember-tooth');assert.equal(s.team[0].speciesId,'cinderwulf');
 const moved=transferStoredCreature(s,s.storage[0].uid);s.team=moved.team;s.storage=moved.storage;
 const map=new Map(),store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 writeSave(store,s);writeSave(store,s);const restored=readSave(store).state;assert.equal(restored.team[0].equipment,'ember-tooth');assert.deepEqual(restored.relics,s.relics);
 assert.ok(validateSave(restored));
});
test('save import rejects forged equipment, missing ownership, duplicates, malformed counters and equipped wild enemies',()=>{
 const s=saved();assert.ok(validateSave(s),'legacy save remains valid');
 for(const relics of [null,[],{'unknown':1},{'mist-pearl':-1},{'mist-pearl':1.5},{'mist-pearl':7}])assert.equal(validateSave({...s,relics}),false);
 s.team[0].equipment='mist-pearl';assert.equal(validateSave(s),false);s.relics={'mist-pearl':1};assert.ok(validateSave(s));
 s.storage[0].equipment='mist-pearl';assert.equal(validateSave(s),false);delete s.storage[0].equipment;
 s.team[0].equipment='__proto__';assert.equal(validateSave(s),false);
 const enemy=createCreature('thorne',8,()=>.3);enemy.equipment='pilgrim-ward';
 assert.equal(validateBattleCheckpoint({enemy,type:'wild',ally:0,guarding:false,bossPhase:1,chargeStage:0,effects:{}},s.team),false);
});
test('finite relic rewards refuse duplicates/caps without consuming the reward claim',()=>{
 const s=saved();assert.equal(grantRelic(s,'pilgrim-ward','relic-cache-village'),true);
 assert.equal(grantRelic(s,'pilgrim-ward','relic-cache-village'),false);assert.equal(s.relics['pilgrim-ward'],1);
 s.relics['pilgrim-ward']=6;assert.equal(grantRelic(s,'pilgrim-ward','new-reward'),false);assert.ok(!s.flags.includes('new-reward'));
});
test('relic damage is included in actual combat, AI estimates and the player forecast',()=>{
 const s=saved(),a=s.team[0],b=createCreature('briarling',8,()=>.3);const before=damage(a,b,MOVES.ember).value;
 s.relics={'ember-tooth':1};setCreatureRelic(s,a.uid,'ember-tooth');assert.ok(damage(a,b,MOVES.ember).value>before);
 const preview=previewMove(a,b,MOVES.ember,[],[]);assert.equal(preview.min,attackWithStatuses(a,b,MOVES.ember,[],[],.90).value);
 const unrelated=damage(a,b,MOVES.pulse).value;delete a.equipment;assert.equal(damage(a,b,MOVES.pulse).value,unrelated);
 const base=damage(b,a,MOVES.thorn).value;a.equipment='pilgrim-ward';assert.ok(damage(b,a,MOVES.thorn).value<base);
});
test('healing and drain: no damage/status consumption on restorative casts, no overkill healing or revival',()=>{
 const a=createCreature('velaria',8,()=>.1),b=createCreature('thorne',8,()=>.2);a.hp=10;
 const weak=[{kind:'weaken',remaining:2}],fracture=[{kind:'fracture',remaining:2}];
 const result=attackWithStatuses(a,b,MOVES.drizzle,weak,fracture);assert.equal(result.value,0);assert.deepEqual(result.attackerStatuses,weak);assert.deepEqual(result.defenderStatuses,fracture);
 const healing=skillUtility(a,MOVES.drizzle,[]).healing;a.equipment='hearth-bead';assert.ok(skillUtility(a,MOVES.drizzle,[]).healing>healing);
 assert.equal(effectiveHealing(a,28),33);assert.equal(drainHealing(a,1),1);a.hp=0;assert.equal(effectiveHealing(a,28),0);
});
test('tactical guidance: close a lethal turn, respect charged attacks and never recommend exhausted restorative skills',()=>{
 const a=createCreature('velaria',8,()=>.1),b=createCreature('hollowhart',12,()=>.2);a.hp=15;
 const choice=suggestBattleAction(a,b,[],[],0,0,1,0);assert.notEqual(choice.moveId,'drizzle');
 assert.equal(suggestBattleAction(a,b,[],[],2,2).kind,'guard');
 b.hp=1;assert.equal(suggestBattleAction(a,b,[],[],2,2).kind,'move');
 assert.equal(recoveryCastsLeft({[a.uid]:3},a.uid),0);
});
test('local playtest counters validate, saturate safely and export a detached identity-free summary',()=>{
 const s=saved();s.journey=newJourneyMetrics('cindrel');recordJourney(s,'wins');recordJourney(s,'actions',12);
 assert.ok(validJourneyMetrics(s.journey));assert.equal(s.journey.counters.actions,12);
 recordJourney(s,'wins',-100);assert.equal(s.journey.counters.wins,1);
 recordJourney(s,'actions',10000000);assert.equal(s.journey.counters.actions,10000000);
 assert.equal(validJourneyMetrics({...s.journey,counters:{}}),false);
 const report=journeyReport(s);assert.ok(!JSON.stringify(report).includes(s.team[0].uid));report.metrics.counters.wins=999;assert.equal(s.journey.counters.wins,1);
 assert.ok(validateSave(s));
});
test('runtime: Mara gift, actual purchases, equip/unequip and backpack persist without repeatable rewards',()=>{
 const {game,storage}=start();assert.equal(game.claimRelicGift(),true);assert.equal(game.claimRelicGift(),false);
 const uid=game.save.team[0].uid;assert.equal(game.equipRelic(uid,'pilgrim-ward'),true);
 assert.equal(game.save.team[0].equipment,'pilgrim-ward');game.openTeam();
 assert.equal(game.purchaseRelic('mist-pearl'),false,'insufficient money must refuse');
 game.interactNpc('archivist');while(game.dialogOpen)game.nextDialog();assert.equal(game.purchaseRelic('mist-pearl'),true);
 assert.equal(game.equipRelic(uid,'mist-pearl'),true);game.hideModal();game.openBag();
 const resumed=mount({virtualTime:true,priorSave:storage.getItem('ascii-azur-save-v1')});resumed.game.continueGame();
 assert.equal(resumed.game.save.team[0].equipment,'mist-pearl');assert.equal(resumed.game.save.relics['pilgrim-ward'],1);
 assert.equal(resumed.game.claimRelicGift(),false);
});
test('runtime: retroactive chest relic is claimed once and does not repeat old consumable or Echo rewards',()=>{
 const {game,storage}=start();game.save.flags.push('chest-village-12');
 const before=JSON.stringify(game.save.inventory),echoes=game.economy.echoes;
 game.interactLandmark({kind:'chest',x:12,y:10,label:'Cofre'});assert.equal(game.save.relics['pilgrim-ward'],1);
 game.interactLandmark({kind:'chest',x:12,y:10,label:'Cofre'});assert.equal(game.save.relics['pilgrim-ward'],1);
 assert.equal(JSON.stringify(game.save.inventory),before);assert.equal(game.economy.echoes,echoes);
 assert.ok(validateSave(JSON.parse(storage.getItem('ascii-azur-save-v1'))));
});
test('runtime: no mid-battle equipment change or unlearned move; tonic pays exactly once and uses relic healing',()=>{
 const {game,flushTimers}=start();game.claimRelicGift();const uid=game.save.team[0].uid;game.equipRelic(uid,'pilgrim-ward');game.hideModal();
 game.startBattle('briarling',4,'wild');const hp=game.battle.enemy.hp;game.useMove('eclipse');assert.equal(game.battle.enemy.hp,hp);assert.equal(game.battle.busy,false);
 assert.equal(game.equipRelic(uid,null),false);assert.equal(game.purchaseRelic('ember-tooth'),false);
 const n=game.save.inventory.tonics;game.tonic();assert.equal(game.save.inventory.tonics,n,'full-HP tonic must not spend');
 game.getAlly().hp=1;game.tonic();game.tonic();assert.equal(game.save.inventory.tonics,n-1);flushTimers();
 assert.equal(game.save.journey.counters.tonics,1);
});
test('runtime: restorative casts persist through battle resume and cannot be reset by switching or reloading',()=>{
 const {game,storage,flushTimers}=start();game.save.team[0]=createCreature('velaria',8,()=>.77);game.save.primaryUid=game.save.team[0].uid;game.startBattle('rillfin',3,'wild');
 game.getAlly().hp=30;game.useMove('drizzle');flushTimers();const uid=game.getAlly().uid;
 assert.equal(game.battle.recoveryUses[uid],1);game.saveNow(false);
 const reopened=mount({virtualTime:true,priorSave:storage.getItem('ascii-azur-save-v1')});reopened.game.continueGame();
 assert.equal(reopened.game.battle.recoveryUses[uid],1);reopened.game.battle.recoveryUses[uid]=3;reopened.game.getAlly().hp=10;
 reopened.game.useMove('drizzle');assert.equal(reopened.game.getAlly().hp,10);assert.equal(reopened.game.battle.busy,false);
});
