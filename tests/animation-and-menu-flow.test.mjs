import test from 'node:test';
import assert from 'node:assert/strict';
import {nextSpatialIndex} from '../dist/ui/menu-navigation.js';
import {BattleHealthPresentation} from '../dist/ui/battle-health.js';
import {createCombatCue,sampleCombatCue} from '../dist/actors/combat-fx.js';
const r=(x,y,w=90,h=35)=>({left:x,top:y,right:x+w,bottom:y+h});
test('spatial keyboard navigation selects aligned neighbors',()=>{
 const grid=[r(0,0),r(140,0),r(0,65),r(140,65)];
 assert.equal(nextSpatialIndex(grid,0,'ArrowRight'),1);
 assert.equal(nextSpatialIndex(grid,0,'ArrowDown'),2);
 assert.equal(nextSpatialIndex(grid,1,'s'),3);
 assert.equal(nextSpatialIndex(grid,3,'a'),2);
 assert.equal(nextSpatialIndex(grid,0,'ArrowUp'),0);
 assert.equal(nextSpatialIndex(grid,2,'Home'),0);
 assert.equal(nextSpatialIndex(grid,1,'End'),3);
 assert.equal(nextSpatialIndex(grid,-1,'ArrowLeft'),0);
 assert.equal(nextSpatialIndex([],0,'ArrowDown'),-1);
});
test('health display waits for impact and rolls to true damage without modifying HP',()=>{
 const hp=new BattleHealthPresentation(),cue=createCombatCue('attack','ally','Ceniza',10,15);
 hp.retarget('enemy','enemy-1',50,50,9,null);
 hp.retarget('enemy','enemy-1',35,50,10,cue);
 assert.equal(hp.sample('enemy',10).hp,50);
 assert.equal(hp.sample('enemy',10+cue.duration*.25).hp,50);
 assert.equal(hp.sample('enemy',10+cue.duration*.68).hp,50);
 assert.ok(hp.sample('enemy',10+cue.duration*.72+.35).hp<50);
 assert.equal(hp.sample('enemy',13).hp,35);
 assert.equal(hp.sample('enemy',10,true).hp,35);
});
test('independent health tracks, healing and critical state',()=>{
 const hp=new BattleHealthPresentation();
 hp.retarget('ally','starter',20,100,0,null);hp.retarget('enemy','wild',100,100,0,null);
 hp.retarget('ally','starter',16,100,1,createCombatCue('attack','enemy','Bruma',1,4));
 assert.equal(hp.sample('ally',1).hp,20);assert.equal(hp.sample('ally',3).hp,16);
 assert.equal(hp.sample('enemy',3).hp,100);assert.equal(hp.sample('ally',3).critical,true);
 hp.retarget('ally','starter',70,100,4,createCombatCue('heal','ally','Bruma',4,54));
 assert.equal(hp.sample('ally',6).hp,70);assert.equal(hp.sample('ally',6).critical,false);
 hp.retarget('ally','other',24,60,7,null);assert.equal(hp.sample('ally',7).hp,24);
 hp.reset();assert.equal(hp.sample('ally',9),null);
});
test('attack reaction includes two separated flashes and longer timing',()=>{
 const c=createCombatCue('attack','ally','Raíz',1,12);
 assert.ok(c.duration>=1.35&&c.duration<=2.1);
 const alphas=[.4,.50,.56,.63,.7].map(p=>sampleCombatCue(c,1+p*c.duration).target.alpha);
 assert.ok(Math.min(...alphas)<.8);assert.ok(Math.max(...alphas)>.9);
});
