import test from 'node:test';
import assert from 'node:assert/strict';
import {activeMixProfile,MIX_PRESETS,FOCUS_LEVELS,combatMusicIntensity,explorationMusicIntensity} from '../dist/audio-direction.js';
import {Sound} from '../dist/audio.js';

test('adaptive combat score: charges, boss escalation, status and injury produce bounded tension',()=>{
 const base={allyHp:100,allyMaxHp:100,enemyHp:100,enemyMaxHp:100,boss:false,bossPhase:1,chargeStage:0,allyStatusCount:0};
 const quiet=combatMusicIntensity(base),injured=combatMusicIntensity({...base,allyHp:10});
 const warning=combatMusicIntensity({...base,boss:true,chargeStage:1}),charged=combatMusicIntensity({...base,boss:true,chargeStage:2});
 assert.ok(quiet>=.2&&quiet<.4);
 assert.ok(injured>quiet);
 assert.ok(charged>warning);
 assert.ok(combatMusicIntensity({...base,boss:true,bossPhase:2,allyHp:1,chargeStage:2,allyStatusCount:3})>.9);
 for(let i=-10;i<=110;i++)assert.ok(combatMusicIntensity({...base,allyHp:i,allyMaxHp:100,chargeStage:i%3,allyStatusCount:i})<=1);
 assert.ok(Number.isFinite(combatMusicIntensity({...base,allyHp:NaN,enemyMaxHp:0})));
});
test('ambient score: each region has its own floor, crypt and witnesses increase risk without changing gameplay',()=>{
 const baseline={zone:'village',crypt:false,healthRatio:1,visibleWitness:false,moving:false};
 assert.ok(explorationMusicIntensity({...baseline,zone:'spire'})>explorationMusicIntensity(baseline));
 assert.ok(explorationMusicIntensity({...baseline,zone:'marsh',visibleWitness:true})>explorationMusicIntensity({...baseline,zone:'marsh'}));
 assert.ok(explorationMusicIntensity({...baseline,zone:'forest',crypt:true,healthRatio:.2,moving:true})>.55);
 for(const zone of ['village','forest','sanctuary','marsh','spire','ossuary','garden'])
  for(const healthRatio of [0,.3,1,NaN])assert.ok(explorationMusicIntensity({...baseline,zone,healthRatio})<=1);
});
test('audio accessibility profiles and focus levels have fixed safe headroom',()=>{
 assert.equal(activeMixProfile('invalid'),'balanced');
 assert.equal(activeMixProfile(null),'balanced');
 for(const [name,p] of Object.entries(MIX_PRESETS)){
  assert.ok(p.music>0&&p.music<=1);
  assert.ok(p.effects>0&&p.effects<=1.1);
  assert.ok(p.ambience>0&&p.ambience<=1);
  assert.ok(p.lowpassHz>=1000&&p.lowpassHz<=20000);
  assert.equal(activeMixProfile(name),name);
 }
 assert.ok(FOCUS_LEVELS.narration.music<FOCUS_LEVELS.menu.music);
 assert.ok(FOCUS_LEVELS.menu.music<FOCUS_LEVELS.game.music);
 const s=new Sound();s.setMixProfile('night');s.setFocus('narration');
 assert.equal(s.getMixProfile(),'night');assert.equal(s.getFocus(),'narration');
 assert.equal(s.diagnostics().contextState,'uninitialized','settings alone never unlock audio');
 s.setMixProfile('corrupt');assert.equal(s.getMixProfile(),'balanced');s.dispose();
});
