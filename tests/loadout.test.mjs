import test from 'node:test';import assert from 'node:assert/strict';
import {createCreature,SIGNATURE_MOVES} from '../dist/domain.js';
import {equipMove,unlockedMoves} from '../dist/creatures/loadout.js';
test('levels gate advanced spells and species signatures',()=>{
 const low=createCreature('cindrel',5);assert.ok(!unlockedMoves(low).includes('emberstorm'));
 const high=createCreature('cindrel',18);assert.ok(unlockedMoves(high).includes('emberstorm'));
 assert.ok(unlockedMoves(high).includes(SIGNATURE_MOVES.cindrel));
});
test('loadout switching returns a copy and avoids duplicate moves',()=>{
 const c=createCreature('velaria',16);const old=[...c.moves];const known=unlockedMoves(c).filter(id=>!old.includes(id));assert.ok(known.length);
 const after=equipMove(c,0,known[0]);assert.equal(after.moves[0],known[0]);assert.deepEqual(c.moves,old);
 assert.throws(()=>equipMove(after,1,after.moves[0]));
});
test('cannot equip locked moves or use invalid slots',()=>{
 const c=createCreature('velaria',5);assert.throws(()=>equipMove(c,0,'eclipse'));
 assert.throws(()=>equipMove(c,-1,'fog'));assert.throws(()=>equipMove(c,100,'fog'));
});
