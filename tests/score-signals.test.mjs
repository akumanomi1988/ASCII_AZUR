import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound,scoreSignal,AUDIO_LIMITS} from '../dist/audio.js';
test('synthesized warning and boss-victory motifs differ and remain headroom-safe',()=>{
 const w=scoreSignal('warning'),v=scoreSignal('victory');
 assert.equal(w.length,2);assert.equal(v.length,3);assert.notDeepEqual(w,v);
 for(const notes of [w,v])for(const note of notes){
  assert.ok(note.frequency>=100&&note.frequency<=2000);
  assert.ok(note.duration>0&&note.duration<=.5);
  assert.ok(note.gain>0&&note.gain<=.05);
  assert.ok(note.delay>=0&&note.delay<=.6);
 }assert.ok(AUDIO_LIMITS.effectVoices>=v.length);
});
test('motifs are pure copies and muted/paused audio never requires an AudioContext',()=>{
 const first=scoreSignal('warning');first[0].frequency=1;
 assert.notEqual(scoreSignal('warning')[0].frequency,1);
 const sound=new Sound();sound.setEnabled(false);
 assert.doesNotThrow(()=>{sound.warning();sound.victory();sound.pause();sound.warning();sound.resume();sound.dispose();});
 assert.equal(sound.diagnostics().musicVoices,0);assert.equal(sound.diagnostics().effectVoices,0);
});
