import test from 'node:test';
import assert from 'node:assert/strict';
import {runCampaign} from './helpers/campaign-runner.mjs';

// 50 distinct saved world seeds x 3 starters. Both bounded policies remain useful:
// offense uses no relic, tactical uses only Mara's earned introductory ward.
// No extra XP, money, captures, wins or story flags are injected by the driver.
// Up to two recoverable preparation defeats are allowed; mandatory route/boss
// failures cannot be bypassed because the physical driver asserts their real flags.
test('campaign balance: fifty seeds and three starters complete physical trilogy with bounded resources and chapter reloads', {timeout:600000},()=>{
 const count=Number(process.env.AZUR_BALANCE_SEEDS??50);
 assert.ok(Number.isInteger(count)&&count>=1&&count<=50);
 const report=[];
 for(let n=1;n<=count;n++)for(const starter of ['cindrel','velaria','thorne']){
  const seed=Math.imul(n,2654435761)>>>0;
  const policy=n%2?'tactical':'offense';
  const result=runCampaign({starter,seed,policy,marsh:n%2?'keep':'release',ending:n%4<2?'remember':'renew'});
  assert.equal(result.metrics.starter,starter);assert.ok(result.metrics.counters.losses<=2,`${starter}/${seed} excessive optional-preparation defeats`);
  assert.ok(result.metrics.counters.tonics<=18,`${starter}/${seed} consumable spiral`);
  assert.ok(result.metrics.counters.actions<=180,`${starter}/${seed} excessive grinding`);
  assert.ok(result.echoes>=0&&result.inventory.tonics>=0&&result.inventory.seals>=0);
  if(policy==='tactical')assert.equal(result.equipment[0],'pilgrim-ward');
  report.push(result);
 }
 for(const starter of ['cindrel','velaria','thorne'])for(const policy of ['offense','tactical']){
  const rows=report.filter(r=>r.starter===starter&&r.policy===policy);if(!rows.length)continue;
  console.log('CAMPAIGN_BALANCE '+JSON.stringify({starter,policy,runs:rows.length,completed:rows.length,
   minLevel:Math.min(...rows.map(r=>r.level)),maxLevel:Math.max(...rows.map(r=>r.level)),
   maxActions:Math.max(...rows.map(r=>r.metrics.counters.actions)),maxTonics:Math.max(...rows.map(r=>r.metrics.counters.tonics)),
   battles:rows.reduce((v,r)=>v+r.metrics.counters.battles,0),losses:rows.reduce((v,r)=>v+r.metrics.counters.losses,0)}));
 }
 assert.equal(report.length,count*3);
 console.log('CAMPAIGN_MATRIX '+JSON.stringify({seeds:count,starters:3,policies:2,sessions:report.length,chapterReloads:report.length*3}));
});
