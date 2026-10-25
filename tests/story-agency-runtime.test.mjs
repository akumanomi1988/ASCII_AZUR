import test from 'node:test';
import assert from 'node:assert/strict';
import {mount} from './helpers/game-runtime.mjs';
const fresh=()=>{const {game,dom}=mount();game.startNew();game.pickStarter('cindrel');return{game,dom};};
test('new-player intro identifies Arken stakes; diary offers purposeful next task',()=>{
 const {game,dom}=fresh();assert.match(dom.get('diaText').textContent,/Iria/);
 while(game.dialogOpen)game.nextDialog();
 game.openQuests();const html=dom.get('modalContent').innerHTML;
 assert.match(html,/MOTIVACIÓN DE LA HISTORIA/);assert.match(html,/Archivista/);
});
test('only the earned final branch exposes optional pilgrimage in the diary',()=>{
 const {game,dom}=fresh();while(game.dialogOpen)game.nextDialog();
 game.openQuests();assert.doesNotMatch(dom.get('modalContent').innerHTML,/VIGILIA OPCIONAL · DESPUÉS DEL FINAL/);game.hideModal();
 game.save.defeatedBoss=true;game.save.dungeon={finished:true};
 game.save.flags.push('arken-vow-restored','marsh-chapter-complete','marsh-choice-release','crown-choice-renew','crown-trilogy-complete');
 const before=JSON.stringify(game.save);game.openQuests();assert.match(dom.get('modalContent').innerHTML,/VIGILIA OPCIONAL/);
 assert.match(dom.get('modalContent').innerHTML,/Osario/);assert.equal(JSON.stringify(game.save),before);
});
test('completed Nael and Oriel conversations acknowledge saved choices without farming resources',()=>{
 const {game,dom}=fresh();while(game.dialogOpen)game.nextDialog();
 game.save.flags.push('arken-vow-restored','marsh-chapter-complete','marsh-choice-keep','crown-choice-renew','crown-trilogy-complete');
 const before=game.economy.echoes;
 game.interactNpc('nael');assert.match(dom.get('diaText').textContent,/Atlas|Telar|Nael/);
 while(game.dialogOpen)game.nextDialog();
 game.interactNpc('nael');assert.equal(game.economy.echoes,before);
 while(game.dialogOpen)game.nextDialog();
 game.interactNpc('oriel');assert.match(dom.get('diaText').textContent,/Edda|Telar|Atlas/);
});
