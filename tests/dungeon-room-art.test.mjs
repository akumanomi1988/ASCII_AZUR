import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,validateDungeon} from '../dist/dungeons/labyrinth.js';
import {chamberAt,chamberGrain,chamberProgress} from '../dist/dungeons/room-art.js';

test('eight story chambers have distinct art palettes and names',()=>{
 const run=generateDungeon(20261021);
 const chambers=run.events.map(e=>chamberAt(run,e.x,e.y));
 assert.equal(new Set(chambers.map(c=>c.id)).size,8);
 assert.equal(new Set(chambers.map(c=>c.name)).size,8);
 assert.equal(new Set(chambers.map(c=>c.floor)).size,8);
 assert.ok(chambers.every(c=>/^#[a-f\d]{6}$/i.test(c.wall)&&c.name.length>6));
});
test('decor changes with seed but remains identical for same seed',()=>{
 const s=137;
 assert.equal(chamberGrain(s,5,12),chamberGrain(s,5,12));
 assert.notEqual(chamberGrain(s,5,12),chamberGrain(s+1,5,12));
 assert.notEqual(chamberGrain(s,5,12),chamberGrain(s,6,12));
});
test('art selection never changes collision tiles or persisted dungeon layout',()=>{
 const run=generateDungeon(42);
 const snapshot=JSON.stringify(run);
 for(let y=0;y<29;y++)for(let x=0;x<43;x++)chamberAt(run,x,y);
 assert.equal(JSON.stringify(run),snapshot);
 assert.equal(validateDungeon(run),true);
});
test('story progress reports only seal-bearing encounters',()=>{
 const run=generateDungeon(4);
 assert.deepEqual(chamberProgress(run).completed,0);
 assert.deepEqual(chamberProgress({...run,cleared:[2,3]}).completed,2);
 const done=chamberProgress({...run,cleared:[2,3,5]});
 assert.equal(done.completed,3);assert.deepEqual(done.remaining,[]);
});
