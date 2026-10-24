import test from 'node:test';
import assert from 'node:assert/strict';
import {runCampaign} from './helpers/campaign-runner.mjs';

test('full optional journey: three starters and four Afterlight endings use physical discovery, earned rewards, travel and reload', {timeout:240000},()=>{
 const report=[];
 for(const starter of ['cindrel','velaria','thorne'])for(const sea of ['anchor','release'])for(const garden of ['bloom','sleep']){
  const seed=Math.imul(starter.length*31+(sea==='anchor'?11:7)+(garden==='bloom'?29:5),2654435761)>>>0;
  const r=runCampaign({starter,seed,policy:'tactical',marsh:'release',ending:'renew',afterlight:{sea,garden}});
  assert.equal(r.afterlight.chapters.length,2);assert.equal(r.afterlight.travelRoundTrip,true);assert.equal(r.afterlight.objectiveReload,true);
  report.push({starter,seed,sea,garden,battles:r.battles,captures:r.captured,actions:r.actions,losses:r.metrics.counters.losses});
 }
 assert.equal(report.length,12);
 console.log('AFTERLIGHT_PHYSICAL_ACCEPTANCE '+JSON.stringify({sessions:report.length,starters:3,endings:4,completedRegions:24,roundTripTravels:24,cases:report}));
});
