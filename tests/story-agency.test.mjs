import test from 'node:test';
import assert from 'node:assert/strict';
import {azurOpening,azurNarrativeBeat,azurWorldConsequence,azurNpcReflection,azurMarshChoiceMeaning,azurCrownChoiceMeaning,azurBondLegacy,azurAfterlightIntroduction} from '../dist/story-agency.js';
const intro=['archivist','zone-forest','zone-sanctuary','arken-vow-restored'];
const state=flags=>({flags,defeatedBoss:false,dungeonFinished:false});
const marsh=m=>[...intro,'marsh-met-nael','zone-marsh','marsh-choice-'+m,'marsh-chapter-complete'];
const crown=(m,c)=>[...marsh(m),'zone-spire','crown-met-oriel','crown-choice-'+c,'crown-trilogy-complete'];
test('opening creates real stakes, specific first objective, isolated return copy',()=>{
 const beats=azurOpening();assert.equal(beats.length,3);assert.match(beats[0].text,/Iria/);assert.match(beats[2].text,/Archivista/);
 beats[0].text='mutated';assert.notEqual(azurOpening()[0].text,'mutated');
});
test('chapter motivations do not spoil future and direct real actions',()=>{
 const a=azurNarrativeBeat(state([])),b=azurNarrativeBeat(state(intro)),c=azurNarrativeBeat(state(marsh('release'))),d=azurNarrativeBeat(state(crown('keep','renew')));
 assert.match(a.next,/Archivista/);assert.doesNotMatch(a.stake,/Nael|Nullscribe/);
 assert.match(b.chapter,/II/);assert.match(c.chapter,/III/);assert.match(d.chapter,/VIGILIA/);
 assert.equal(d.optional,true);assert.match(d.next,/Osario/);
});
test('all four choice combinations produce different post-finale consequences',()=>{
 const all=new Set();
 for(const m of ['keep','release'])for(const c of ['remember','renew']){
  const f=crown(m,c),outcome=azurWorldConsequence(f);
  assert.ok(outcome.length>75);assert.equal(azurNpcReflection(f,'nael').text,outcome);
  assert.match(azurNpcReflection(f,'oriel').text,/Edda/);all.add(outcome);
 }
 assert.equal(all.size,4);
});
test('return dialogue is gated by real story completion',()=>{
 assert.equal(azurNpcReflection([],'nael'),null);assert.equal(azurNpcReflection([],'oriel'),null);
 assert.equal(azurNpcReflection([],'archivist'),null);
 assert.match(azurNpcReflection(intro,'archivist').text,/Nael/);
});
test('choice descriptions communicate different observable meanings',()=>{
 assert.notEqual(azurMarshChoiceMeaning('keep'),azurMarshChoiceMeaning('release'));
 assert.notEqual(azurCrownChoiceMeaning('remember',marsh('keep')),azurCrownChoiceMeaning('renew',marsh('keep')));
});
test('four bond scenes react to attack/protect without new flags or mandatory progress',()=>{
 for(const id of ['ember','root','mist','ether'])assert.notEqual(azurBondLegacy(id,'fang',[]),azurBondLegacy(id,'ward',[]));
 assert.match(azurBondLegacy('mist','ward',[...intro,'marsh-choice-release']),/Nael/);
});
test('optional continuations respect earned main story and Ossuary choice',()=>{
 assert.match(azurAfterlightIntroduction('ossuary',[]),/Corona/);
 assert.match(azurAfterlightIntroduction('ossuary',crown('keep','remember')),/Edda/);
 assert.match(azurAfterlightIntroduction('garden',crown('keep','remember')),/espera/);
 const f=[...crown('keep','remember'),'afterlight-ossuary-choice-anchor','afterlight-ossuary-complete'];
 assert.match(azurAfterlightIntroduction('garden',f),/Silas/);
 assert.notEqual(azurAfterlightIntroduction('garden',f),azurAfterlightIntroduction('garden',[...crown('keep','remember'),'afterlight-ossuary-choice-release','afterlight-ossuary-complete']));
});
test('projections are pure and deterministic on legacy v1 flags',()=>{
 const f=crown('release','renew'),before=JSON.stringify(f);
 assert.deepEqual(azurNarrativeBeat(state(f)),azurNarrativeBeat(state(f)));
 azurWorldConsequence(f);azurNpcReflection(f,'oriel');azurBondLegacy('root','fang',f);
 assert.equal(JSON.stringify(f),before);
});
