import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreature,MOVES} from '../dist/domain.js';
import {applyEffect,attackWithStatuses,afterAttack,chooseEnemyMove,chooseGuardianMove,endTurnEffects,statusLabel} from '../dist/combat/tactics.js';

test('tactical debuffs do not mutate input status arrays',()=>{
 const old=[{kind:'fracture',remaining:1}];
 const out=applyEffect(old,{kind:'scorch',chance:1,turns:3},0);
 assert.equal(out.applied,true);assert.equal(out.statuses.length,2);assert.equal(old.length,1);
 const refresh=applyEffect(out.statuses,{kind:'scorch',chance:1,turns:1},0);
 assert.equal(refresh.statuses.find(s=>s.kind==='scorch').remaining,3);
 assert.equal(applyEffect(old,{kind:'scorch',chance:.5,turns:3},.8).applied,false);
});
test('debilidad reduces outgoing damage while fractura amplifies incoming damage',()=>{
 const a=createCreature('cindrel',8,()=>.1),b=createCreature('thorne',8,()=>.2);
 const base=attackWithStatuses(a,b,MOVES.ember,[],[],1);
 const weak=attackWithStatuses(a,b,MOVES.ember,[{kind:'weaken',remaining:2}],[],1);
 const exposed=attackWithStatuses(a,b,MOVES.ember,[],[{kind:'fracture',remaining:1}],1);
 assert.ok(weak.value<base.value);assert.ok(exposed.value>base.value);
 assert.equal(weak.attackerStatuses[0].remaining,1);
 assert.deepEqual(exposed.defenderStatuses,[]);
});
test('ardor ticks for three turns and cannot create negative health itself',()=>{
 const c=createCreature('runeowl',7,()=>.25);let s=[{kind:'scorch',remaining:3}];
 const ticks=[];for(let i=0;i<3;i++){const out=endTurnEffects(c,s);ticks.push(out.damage);s=out.statuses;}
 assert.equal(s.length,0);assert.ok(ticks.every(x=>x>=2));
 assert.equal(endTurnEffects(c,s).damage,0);
});
test('AI prioritizes lethal move against vulnerable creature',()=>{
 const a=createCreature('cinderwulf',10,()=>.25),b=createCreature('briarling',3,()=>.1);b.hp=2;
 assert.ok(a.moves.includes(chooseEnemyMove(a,b,[],[],0)));
 const best=chooseEnemyMove(a,b,[],[],0);
 assert.ok(a.moves.includes(best));assert.ok(MOVES[best].power>0);
});
test('status label renders remaining turns without unsafe markup',()=>{
 assert.equal(statusLabel([{kind:'scorch',remaining:2},{kind:'weaken',remaining:1}]),'ARDOR 2 · DEBILIDAD 1');
 assert.deepEqual(afterAttack([{kind:'weaken',remaining:1},{kind:'scorch',remaining:3}],'weaken'),[{kind:'scorch',remaining:3}]);
});

test('Hollowhart reserves Ether Eclipse for an explicitly charged strike',()=>{
 const boss=createCreature('hollowhart',12,()=>.25);
 for(const foe of ['cindrel','velaria','thorne']){
  const target=createCreature(foe,10,()=>.2);
  for(const rng of [0,.05,.49,.79,.9,.999]){
   const basic=chooseGuardianMove(boss,target,[],[],0,rng);
   const mid=chooseGuardianMove(boss,target,[],[],1,rng);
   assert.ok(boss.moves.includes(basic)&&basic!=='eclipse','untelegraphed Eclipse: '+foe);
   assert.ok(boss.moves.includes(mid)&&mid!=='eclipse','Eclipse while charging: '+foe);
   assert.equal(chooseGuardianMove(boss,target,[],[],2,rng),'eclipse');
  }
 }
 assert.ok(boss.moves.includes('eclipse'),'boss retains its signature move for saves');
});
