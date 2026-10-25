import test from 'node:test';
import assert from 'node:assert/strict';
import {mount} from './helpers/game-runtime.mjs';
import {createCreature} from '../dist/domain.js';
function fresh(){
 const env=mount({virtualTime:true,seed:14});const g=env.game;
 g.startNew();g.pickStarter('cindrel');while(g.dialogOpen)g.nextDialog();
 return env;
}
test('real combat switch protects the incoming teammate and remains a turn-costing action',()=>{
 const {game}=fresh();game.save.team.push(createCreature('velaria',9,()=>.25));
 game.startBattle('hollowhart',12,'boss');
 game.switchCreature();assert.equal(game.battle.selecting,true);
 const actionsBefore=game.save.journey.counters.actions;
 game.switchTo(1);
 assert.equal(game.battle.ally,1);assert.equal(game.battle.guarding,true);
 assert.equal(game.battle.busy,true);assert.equal(game.battle.pending,'enemy');
 assert.match(game.battle.log,/protección/);
 assert.equal(game.save.journey.counters.actions,actionsBefore+1);
 game.battle.chargeStage=0;game.enemyTurn();
 assert.equal(game.battle.guarding,false);
});
test('real combat switching panel explains tactical value and shield',()=>{
 const {game,dom}=fresh();
 game.save.team.push(createCreature('velaria',9,()=>.25));
 game.startBattle('hollowhart',12,'boss');game.switchCreature();
 const content=dom.get('battleActions').children.map(b=>b.title+' '+b.textContent).join(' ');
 assert.match(content,/55 %/);
 assert.match(content,/daño|eficaz/i);
});
test('roster, loadouts and relic management expose prospective role advice',()=>{
 const {game,dom}=fresh();game.openTeam();
 assert.match(dom.get('modalContent').innerHTML,/IDENTIDAD TÁCTICA/);
 game.openSkills(game.save.team[0].uid);
 assert.match(dom.get('modalContent').innerHTML,/PREPARACIÓN CONTRA/);
 game.openRelics(game.save.team[0].uid);
 assert.match(dom.get('modalContent').innerHTML,/ELECCIÓN TÁCTICA/);
});
test('boss briefing presents real current party matchups and missing counter',()=>{
 const {game,dom}=fresh();
 game.prepareGuardianBattle();
 assert.match(dom.get('modalContent').innerHTML,/EXPLORACIÓN DEL EQUIPO/);
 assert.match(dom.get('modalContent').innerHTML,/Cindrel/);
 assert.match(dom.get('modalContent').innerHTML,/DAÑO|daño/);
});
