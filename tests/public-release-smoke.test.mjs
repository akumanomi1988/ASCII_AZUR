import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PUBLIC_ROOT,checkedSha,correctProvenance,waitForRelease} from '../tools/public-release-smoke.mjs';
const SHA='0123456789abcdef0123456789abcdef01234567';
const OK={source_commit:SHA,build:'verified-github-actions',published_at:'2026-10-26T07:12:26Z'};
test('public provenance rejects missing, partial, forged and differently sourced deployments',()=>{
 assert.equal(PUBLIC_ROOT,'https://akumanomi1988.github.io/ASCII_AZUR/');
 for(const s of [null,'',SHA.slice(0,12),'z'.repeat(40)])assert.throws(()=>checkedSha(s));
 assert.equal(checkedSha(SHA.toUpperCase()),SHA);
 assert.equal(correctProvenance(OK,SHA),true);
 assert.equal(correctProvenance({...OK,source_commit:'f'.repeat(40)},SHA),false);
 assert.equal(correctProvenance({...OK,build:'manual'},SHA),false);
 assert.equal(correctProvenance({...OK,published_at:'invalid'},SHA),false);
});
test('public smoke waits for exact served SHA, not just successful publication',async()=>{
 let call=0,delays=0;
 const p=await waitForRelease(PUBLIC_ROOT,SHA,{attempts:4,pause:async()=>delays++,
  fetcher:async(url,opts)=>{assert.equal(opts.cache,'no-store');assert.ok(String(url).includes('probe='));
   call++;return {ok:true,json:async()=>call===1?{...OK,source_commit:'f'.repeat(40)}:call===2?{...OK,build:'draft'}:OK};}});
 assert.equal(p.attempts,3);assert.equal(call,3);assert.equal(delays,2);
});
test('public release fails closed after HTTP/network and invalid manifest failures',async()=>{
 let call=0;
 await assert.rejects(waitForRelease(PUBLIC_ROOT,SHA,{attempts:3,pause:async()=>{},
 fetcher:async()=>{call++;if(call===1)return {ok:false,status:404};if(call===2)throw Error('offline');return {ok:true,json:async()=>({broken:true})};}}),/did not converge/);
 assert.equal(call,3);
 await assert.rejects(waitForRelease(PUBLIC_ROOT,SHA,{attempts:0}),/Invalid retry count/);
});
test('live release verification is downstream of validated Pages publishing',()=>{
 const yaml=readFileSync('.github/workflows/verify.yml','utf8');
 assert.match(yaml,/public-smoke:\s*\n/);
 assert.match(yaml,/needs: \[publish-pages\]/);
 assert.match(yaml,/SOURCE_SHA: \$\{\{ github\.sha \}\}/);
 assert.match(yaml,/node tools\/public-release-smoke\.mjs/);
 assert.match(yaml,/azur-public-release-evidence/);
 assert.match(yaml,/AZUR_SMOKE_ROOT: http:\/\/127\.0\.0\.1:18977\//);
 assert.match(yaml,/ascii-azur-local-public-smoke/);
});

test('live smoke waits for fully initialized game listeners, not just loaded HTML',()=>{
 const game=readFileSync('src/main.ts','utf8');
 const smoke=readFileSync('tools/public-release-smoke.mjs','utf8');
 assert.ok(game.includes("document.documentElement.dataset.azurReady='true'"));
 assert.ok(smoke.includes('document.documentElement?.dataset.azurReady==="true"'));
 assert.ok(!smoke.includes('document.readyState==="complete"&&!!document.getElementById'));
});
