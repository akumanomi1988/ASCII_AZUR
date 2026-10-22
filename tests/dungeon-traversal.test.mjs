import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,dungeonSweep,dungeonConnected} from '../dist/dungeons/labyrinth.js';
import {dungeonTilePath} from './helpers/dungeon-path.mjs';
function traverse(d,from,to){
 let pos={...from};
 for(const next of dungeonTilePath(d,from,to).slice(1)){
  const n=dungeonSweep(d,pos.x,pos.y,next.x-pos.x,next.y-pos.y);
  assert.ok(Math.hypot(n.x-next.x,n.y-next.y)<.04,
   'seed '+d.seed+': physical corridor blocked at '+pos.x+','+pos.y+' -> '+next.x+','+next.y);
  pos=n;
 }
 return pos;
}
test('all key objectives and exit reachable by swept movement across 150 deterministic crypts',()=>{
 for(let seed=1;seed<=150;seed++){
  const d=generateDungeon(seed);assert.equal(dungeonConnected(d),true);
  let pos={x:d.x,y:d.y};
  for(const event of d.events.slice(1))pos=traverse(d,pos,event);
  pos=traverse(d,pos,d.events[0]);
  assert.ok(Math.hypot(pos.x-d.x,pos.y-d.y)<.04);
 }
});
test('single-width corridors remain traversable while solid edge walls block movement',()=>{
 const d=generateDungeon(1);
 const path=dungeonTilePath(d,d.events[0],d.events[1]);
 assert.ok(path.length>2);
 traverse(d,d.events[0],d.events[1]);
 assert.deepEqual(dungeonSweep(d,0,0,2,2),{x:0,y:0});
});
