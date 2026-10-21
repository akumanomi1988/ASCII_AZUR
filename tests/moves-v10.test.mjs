import test from 'node:test';import assert from 'node:assert/strict';
import {createCreature,gainExp,maxHp,SPECIES,SIGNATURE_MOVES,MOVES,learnableMoves} from '../dist/domain.js';
import {skillUtility,chooseEnemyMove} from '../dist/combat/tactics.js';
test('25+ distinct moves exist, each species has a valid special move',()=>{
 assert.ok(Object.keys(MOVES).length>=30);
 for(const id of Object.keys(SPECIES)){
  assert.ok(MOVES[SIGNATURE_MOVES[id]],id);
  const c=createCreature(id,9,()=>.123);
  assert.ok(c.moves.includes(SIGNATURE_MOVES[id]),id);
  assert.ok(c.moves.length<=4);
 }
});
test('healing respects max health, and is useless at full health',()=>{
 const c=createCreature('velaria',9);c.hp=1;let effect=skillUtility(c,MOVES.drizzle,[]);
 assert.ok(effect.healing>0);assert.ok(effect.healing<=maxHp(c)-1);
 c.hp=maxHp(c);effect=skillUtility(c,MOVES.drizzle,[]);assert.equal(effect.healing,0);
});
test('cleanse is conditional and draining is not mislabeled as healing',()=>{
 const c=createCreature('wispawn',9);assert.equal(skillUtility(c,MOVES.absolve,[{kind:'scorch',remaining:2}]).cleanse,true);
 assert.equal(skillUtility(c,MOVES.absolve,[]).cleanse,false);
 assert.equal(skillUtility(c,MOVES.siphon,[]).healing,0);
});
test('learning evolved species signature move without duplicated skills',()=>{
 const c=createCreature('cindrel',8,()=>.11);c.level=8;c.exp=0;
 let res=gainExp(c,200);assert.equal(res.evolved,true);assert.equal(c.speciesId,'cinderwulf');
 assert.ok(c.moves.includes(SIGNATURE_MOVES.cinderwulf));
 assert.equal(new Set(c.moves).size,c.moves.length);
});
test('AI can recover itself when very weak rather than always attack',()=>{
 const enemy=createCreature('velaria',11);enemy.hp=1;
 const other=createCreature('thorne',11);
 assert.equal(chooseEnemyMove(enemy,other,[],[],0),'drizzle');
});
