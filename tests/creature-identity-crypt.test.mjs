import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,maxHp,attackValue,defenseValue,speedValue,gainExp,validateSave,MOVES} from '../dist/domain.js';
import {potentialFromUid,individualRange,validPotential} from '../dist/creatures/attributes.js';
import {equipMove,unlockedMoves} from '../dist/creatures/loadout.js';
import {establishPrimary,loseCryptCompanion} from '../dist/creatures/crypt-mortality.js';
import {reserveCreature,transferStoredCreature} from '../dist/party.js';
import {nextBattleCell} from '../dist/ui/menu-navigation.js';
import {generateDungeon} from '../dist/dungeons/labyrinth.js';
import {mount} from './helpers/game-runtime.mjs';
const start=()=>{const r=mount({virtualTime:true,seed:181});r.game.startNew();r.game.pickStarter('cindrel');while(r.game.dialogOpen)r.game.nextDialog();return r;};

test('individual stats: same species and level has bounded persistent variance; neutral legacy attributes preserve formulas',()=>{
 const a=createCreature('velaria',10,()=>.1),b=createCreature('velaria',10,()=>.9);
 assert.notDeepEqual(a.potential,b.potential);assert.deepEqual(potentialFromUid(a.uid),a.potential);
 assert.ok(validPotential(a.potential));assert.equal(validPotential({...a.potential,hp:32}),false);
 const baseline={...a};delete baseline.potential;assert.equal(maxHp(baseline),43+9*4);
 for(const c of [a,b]){
  const r=individualRange(maxHp(baseline));assert.ok(maxHp(c)>=r.min&&maxHp(c)<=r.max);
  assert.ok([attackValue(c),defenseValue(c),speedValue(c)].every(Number.isFinite));
 }
 const potential=JSON.stringify(a.potential);gainExp(a,2000);assert.equal(JSON.stringify(a.potential),potential);
});
test('active techniques: level-ups and evolution never replace the four selected moves or forget the repertoire',()=>{
 let c=createCreature('cindrel',8,()=>.2);const active=[...c.moves];gainExp(c,1000);
 assert.equal(c.speciesId,'cinderwulf');assert.deepEqual(c.moves,active);assert.ok(unlockedMoves(c).includes('emberstorm'));assert.ok(unlockedMoves(c).includes('ashfang'));
 const slot=c.moves.indexOf('pulse');c=equipMove(c,slot,'emberstorm');assert.ok(!c.moves.includes('pulse'));assert.ok(unlockedMoves(c).includes('pulse'));
 c=equipMove(c,slot,'pulse');assert.ok(c.moves.includes('pulse'));assert.ok(unlockedMoves(c).includes('emberstorm'));
 assert.equal(c.moves.length,4);assert.throws(()=>equipMove(c,4,'emberstorm'));
});
test('four active slots can be filled without mutating the saved creature and cannot duplicate techniques',()=>{
 const c=createCreature('cindrel',8,()=>.21);c.moves=['ember','pulse'];const next=equipMove(c,2,'smolder');
 assert.deepEqual(c.moves,['ember','pulse']);assert.deepEqual(next.moves,['ember','pulse','smolder']);
 assert.throws(()=>equipMove(next,3,'ember'));assert.throws(()=>equipMove(c,3,'smolder'));
});
test('primary identity remains fixed across leading, reserve operations and crypt losses',()=>{
 const {game}=start(),s=game.save,primary=s.team[0],buddy=createCreature('velaria',5,()=>.72);s.team.unshift(buddy);
 assert.equal(s.primaryUid,primary.uid);assert.throws(()=>reserveCreature(s,primary.uid));
 s.storage.push(createCreature('thorne',5,()=>.82));assert.throws(()=>transferStoredCreature(s,s.storage[0].uid,primary.uid));
 s.dungeon=generateDungeon(81);s.dungeon.active=true;buddy.hp=0;assert.equal(loseCryptCompanion(s,buddy),true);
 primary.hp=0;assert.equal(loseCryptCompanion(s,primary),false);assert.equal(s.team.length,1);assert.equal(s.team[0].uid,primary.uid);
 assert.ok(validateSave(s));
});
test('crypt permadeath: actual enemy strike removes a companion, frees its relic and persists through resume/healing',()=>{
 const {game,storage,flushTimers}=start();const primary=game.save.team[0],buddy=createCreature('velaria',5,()=>.72);
 game.save.team.push(buddy);game.save.relics={'mist-pearl':1};buddy.equipment='mist-pearl';game.enterDungeon(false);
 game.startBattle('ashboar',15,'wild',undefined,1);buddy.hp=1;game.enemyTurn();flushTimers();
 assert.ok(!game.save.team.some(c=>c.uid===buddy.uid));assert.equal(game.save.fallen[0].uid,buddy.uid);assert.equal(game.save.relics['mist-pearl'],1);
 const raw=storage.getItem('ascii-azur-save-v1');assert.ok(validateSave(JSON.parse(raw)));assert.ok(!JSON.parse(raw).team.some(c=>c.uid===buddy.uid));
 const reopened=mount({virtualTime:true,priorSave:raw});reopened.game.continueGame();
 assert.ok(!reopened.game.save.team.some(c=>c.uid===buddy.uid));assert.equal(reopened.game.save.primaryUid,primary.uid);
 reopened.game.finishBattle();reopened.game.save.dungeon.active=false;reopened.game.interactLandmark({kind:'altar',x:15,y:14,label:'Lumbre'});
 assert.ok(!reopened.game.save.team.some(c=>c.uid===buddy.uid));assert.equal(reopened.game.save.fallen.length,1);
});
test('crypt permadeath: final companion loss checkpoints correctly when the protected principal is already down',()=>{
 const {game,storage,flushTimers}=start(),primary=game.save.team[0],buddy=createCreature('velaria',5,()=>.72);game.save.team.push(buddy);
 game.enterDungeon(false);game.startBattle('ashboar',15,'wild',undefined,1);primary.hp=0;buddy.hp=1;game.enemyTurn();
 const beforeDefeat=JSON.parse(storage.getItem('ascii-azur-save-v1'));assert.ok(validateSave(beforeDefeat));assert.equal(beforeDefeat.team.length,1);assert.equal(beforeDefeat.activeBattle.pending,'defeat');
 flushTimers();assert.equal(game.save.team[0].uid,primary.uid);assert.equal(game.save.team[0].hp,maxHp(game.save.team[0]));assert.equal(game.save.fallen.length,1);assert.equal(game.save.dungeon.active,false);
});
test('outside the crypt companions faint normally; protected principal never enters the memorial',()=>{
 const {game,flushTimers}=start(),primary=game.save.team[0],buddy=createCreature('velaria',5,()=>.72);game.save.team.push(buddy);
 game.startBattle('ashboar',15,'wild',undefined,1);buddy.hp=1;game.enemyTurn();flushTimers();assert.ok(game.save.team.some(c=>c.uid===buddy.uid));assert.equal(game.save.fallen,undefined);
 game.finishBattle();game.save.team.forEach(c=>c.hp=maxHp(c));game.enterDungeon(false);game.startBattle('ashboar',15,'wild',undefined,0);primary.hp=1;game.enemyTurn();flushTimers();assert.ok(game.save.team.some(c=>c.uid===primary.uid));assert.ok(!game.save.fallen?.some(c=>c.uid===primary.uid));
});
test('legacy migration is deterministic; malformed identity, potential, forgotten book and revived graves are rejected',()=>{
 const {game}=start(),s=structuredClone(game.save);delete s.primaryUid;delete s.team[0].potential;delete s.team[0].knownMoves;
 assert.ok(validateSave(s));assert.equal(establishPrimary(s),true);assert.equal(establishPrimary(s),false);
 assert.equal(validateSave({...s,primaryUid:'missing'}),false);
 assert.equal(validateSave({...s,team:[{...s.team[0],potential:{hp:0,attack:0,defense:0,speed:99}}]}),false);
 assert.equal(validateSave({...s,team:[{...s.team[0],knownMoves:['delete_everything']}]}),false);
 assert.equal(validateSave({...s,fallen:[{uid:s.team[0].uid,speciesId:'cindrel',level:5}]}),false);
 assert.equal(validateSave({...s,team:[{...s.team[0],speciesId:'__proto__'}]}),false);
});
test('turn menu: directional movement follows the 2x2 grid without shifting disabled skill slots',()=>{
 assert.equal(nextBattleCell([0,1,2,3],0,'ArrowDown'),2);assert.equal(nextBattleCell([0,1,2,3],0,'ArrowRight'),1);
 assert.equal(nextBattleCell([0,1,2,3],3,'ArrowUp'),1);assert.equal(nextBattleCell([0,1,2,3],1,'ArrowRight'),1);
 assert.equal(nextBattleCell([0,2,4],0,'ArrowDown'),2);assert.equal(nextBattleCell([0,2,4],2,'ArrowDown'),4);
 assert.equal(nextBattleCell([0,2,4],4,'ArrowUp'),2);assert.equal(nextBattleCell([],0,'ArrowUp'),-1);
});
test('runtime: command submenus do not consume a turn; four techniques, objects and Back share one action path',()=>{
 const {game,dom}=start();game.startBattle('mireling',5,'wild');const counters=game.save.journey.counters.actions;
 assert.equal(game.battleMenu,'commands');assert.equal(dom.get('battleActions').children.length,4);
 game.openBattleMenu('moves');assert.equal(dom.get('battleActions').children.length,5);assert.equal(game.battle.busy,false);
 game.openBattleMenu('items');assert.equal(dom.get('battleActions').children.length,4);game.openBattleMenu('commands');
 assert.equal(game.save.journey.counters.actions,counters);game.useMove(game.getAlly().moves[0]);assert.equal(game.battle.busy,true);assert.equal(game.battleMenu,'commands');
});
