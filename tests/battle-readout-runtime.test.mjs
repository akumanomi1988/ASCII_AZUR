import test from 'node:test';
import assert from 'node:assert/strict';
import {mount} from './helpers/game-runtime.mjs';
function setup(){
 const {game,dom}=mount({virtualTime:true,seed:144});
 game.startNew();game.pickStarter('cindrel');
 while(game.dialogOpen)game.nextDialog();
 game.startBattle('hollowhart',12,'boss');
 return {game,dom};
}
test('battle HUD shows phase II charge and live actionable guard warning',()=>{
 const {game,dom}=setup();
 assert.ok(dom.get('battleThreat').textContent.includes('ENFRENTAMIENTO DECISIVO'));
 game.battle.chargeStage=1;game.refreshBattle();
 assert.match(dom.get('battleThreat').textContent,/EL JEFE ESTÁ CARGANDO/);
 assert.equal(dom.get('battleThreat').dataset.severity,'caution');
 game.battle.chargeStage=2;game.refreshBattle();
 assert.equal(dom.get('battleThreat').dataset.severity,'critical');
 assert.match(dom.get('battleThreat').textContent,/GUARDIA RECOMENDADA/);
 assert.match(dom.get('accessibilityStatus').textContent,/ECLIPSE INMINENTE/);
 const buttons=dom.get('battleActions').children;
 assert.ok(buttons.some(b=>b.classList.contains('recommended-defense')));
});
test('guarding and battle end never falsely show unguarded threat',()=>{
 const {game,dom}=setup();
 game.battle.chargeStage=2;game.battle.guarding=true;game.refreshBattle();
 assert.match(dom.get('battleThreat').textContent,/PROTECCIÓN ACTIVA/);
 assert.ok(!dom.get('battleActions').children.some(b=>b.classList.contains('recommended-defense')));
 game.finishBattle();assert.equal(dom.get('battleThreat').textContent,'');
});
