import test from 'node:test';
import assert from 'node:assert/strict';
import {combatClips,createCombatCue,sampleCombatCue} from '../dist/actors/combat-fx.js';
import {validateClip} from '../dist/actors/animation.js';
import {sampleCreaturePerformance,RIGS} from '../dist/actors/creature-performance.js';
import {SPECIES} from '../dist/domain.js';

const actions=['attack','guard','heal','switch','capture','faint'];
const sample=(kind,phase=.5,side='ally',reduced=false)=>{
 const c=createCombatCue(kind,side,'Bruma',10,kind==='heal'?28:kind==='attack'?19:0,true);
 return sampleCombatCue(c,10+c.duration*phase,reduced);
};
test('G3: every combat beat has a valid standalone animation clip',()=>{
 const clips=combatClips();
 assert.equal(clips.length,8);
 assert.equal(new Set(clips.map(c=>c.id)).size,clips.length);
 for(const c of clips)assert.deepEqual(validateClip(c),[],c.id);
 for(const kind of actions)assert.ok(clips.some(c=>c.id==='combat-'+(kind==='attack'?'lunge':kind)),kind);
});
test('G3: six combat actions are deterministic, distinct and bounded',()=>{
 const signatures=new Set();
 for(const kind of actions){
  const cue=createCombatCue(kind,'ally','Bruma',10,kind==='attack'?19:0,true);
  assert.ok(cue.duration>=.7&&cue.duration<=1.2,kind);
  const frames=[];
  for(const phase of [0,.2,.4,.6,.8,.98]){
   const time=10+cue.duration*phase;
   const frame=sampleCombatCue(cue,time);
   assert.ok(frame&&frame.active,kind+' '+phase);
   assert.deepEqual(frame,sampleCombatCue(cue,time),kind);
   for(const key of ['attacker','target'])for(const value of Object.values(frame[key]))assert.ok(Number.isFinite(value),kind+' '+key);
   assert.ok(Number.isFinite(frame.impact)&&frame.impact>=0&&frame.impact<=1,kind);
   assert.ok(Number.isFinite(frame.trail)&&frame.trail>=0&&frame.trail<=1,kind);
   frames.push([frame.attacker.x,frame.attacker.y,frame.attacker.scaleX,frame.attacker.scaleY,frame.target.alpha,frame.impact,frame.trail].map(n=>n.toFixed(2)).join(':'));
  }
  signatures.add(frames.join('|'));
  assert.equal(sampleCombatCue(cue,10+cue.duration),null,kind+' remains active after end');
 }
 assert.equal(signatures.size,actions.length,'every combat verb must have its own motion language');
});
test('G3: enemy reaction and final defeat beats are directional and readable',()=>{
 const allyAttack=sample('attack',.42,'ally'),enemyAttack=sample('attack',.42,'enemy');
 assert.ok(allyAttack.attacker.x>0&&enemyAttack.attacker.x<0);
 assert.ok(sample('faint',.8).attacker.alpha<.5);
 assert.ok(sample('capture',.7).target.scaleX<1);
 assert.ok(sample('guard',.5).attacker.scaleX>1);
 assert.ok(sample('heal',.5).attacker.y<0);
 assert.ok(sample('switch',.2).attacker.scaleX<1);
});
test('G3: reduced motion holds characters still but retains a static non-attack cue',()=>{
 for(const kind of actions){
  const frame=sample(kind,.5,'ally',true);
  assert.equal(frame.attacker.x,0,kind);
  assert.equal(frame.attacker.y,0,kind);
  assert.equal(frame.target.x,0,kind);
  assert.equal(frame.shakeX,0,kind);
  assert.equal(frame.shakeY,0,kind);
  if(kind!=='attack')assert.ok(frame.trail>0,kind+' lost all feedback');
 }
});
test('G3: each original creature supports idle, attack, hurt, faint and evolution reactions',()=>{
 assert.deepEqual(Object.keys(RIGS).sort(),Object.keys(SPECIES).sort());
 for(const id of Object.keys(SPECIES)){
  for(const action of ['idle','attack','hurt','faint','evolve']){
   const f=sampleCreaturePerformance(id,2.6,action);
   const f2=sampleCreaturePerformance(id,2.6,action);
   assert.deepEqual(f,f2,id+' '+action);
   for(const [key,value] of Object.entries(f))if(typeof value==='number')assert.ok(Number.isFinite(value),id+' '+action+' '+key);
  }
  const hurt=sampleCreaturePerformance(id,2.6,'hurt');
  const faint=sampleCreaturePerformance(id,2.6,'faint');
  const evolve=sampleCreaturePerformance(id,2.6,'evolve');
  assert.equal(hurt.expression,'hurt',id);
  assert.equal(faint.expression,'faint',id);
  assert.equal(faint.eyeGlow,0,id);
  assert.equal(evolve.expression,'transcendent',id);
 }
});
test('G3: creature action legibility survives the reduced-motion preference',()=>{
 for(const id of Object.keys(SPECIES)){
  const a=sampleCreaturePerformance(id,1,'faint',true);
  const b=sampleCreaturePerformance(id,7,'faint',true);
  assert.equal(a.expression,'faint');
  assert.equal(b.expression,'faint');
  assert.equal(a.tail,0);
  assert.equal(b.wing,0);
 }
});
