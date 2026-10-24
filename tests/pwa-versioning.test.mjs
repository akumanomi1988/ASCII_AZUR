import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Release pin must track the package semver rather than a past release fixture.
const [major,minor,patch]=JSON.parse(fs.readFileSync('package.json','utf8')).version.split('.').map(Number);
const expectedRelease=`${major}${String(minor).padStart(2,'0')}${patch}`;

function serviceWorker(){
 const listeners=new Map(),cached=new Map(),requests=[];
 let offline=false,precache=[];
 const response=url=>({ok:true,url,clone(){return response(url)}});
 const cache={
  async addAll(urls){precache=urls;for(const url of urls)cached.set(url,response(url));},
  async put(url,value){cached.set(url,value);}
 };
 const self={
  location:{href:'https://azur.example/ASCII_AZUR/sw.js'},
  addEventListener(name,handler){listeners.set(name,handler);},
  skipWaiting:async()=>{},
  clients:{claim:async()=>{}}
 };
 const caches={
  open:async()=>cache,
  keys:async()=>['unrelated-app-cache','ascii-azur-v054-q1','ascii-azur-v053-q1'],
  delete:async()=>true,
  match:async url=>cached.get(url)
 };
 const sandbox={self,caches,URL,location:{origin:'https://azur.example'},
  fetch:async(url,options)=>{requests.push({url,cache:options?.cache});if(offline)throw Error('Offline');return response(url);}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),sandbox,{filename:'sw.js'});
 const fire=async(name,request)=>{
  const pending=[];let result;
  const event={request,waitUntil(p){pending.push(Promise.resolve(p));},respondWith(p){result=Promise.resolve(p);}};
  listeners.get(name)(event);
  if(result)await result;
  await Promise.all(pending);
  return result;
 };
 return{fire,requests,cached,getPrecache:()=>precache,setOffline:value=>offline=value};
}

test('PWA release cache preloads every asset under a versioned URL',async()=>{
 const sw=serviceWorker();
 await sw.fire('install');
 const urls=sw.getPrecache();
 assert.ok(urls.length>=40,'Precache shrank below essential modules');
 assert.ok(urls.every(url=>url.startsWith('https://azur.example/ASCII_AZUR/')));
 assert.ok(urls.every(url=>new URL(url).searchParams.get('__azur_release')===expectedRelease));
 assert.ok(urls.some(url=>url.includes('/dist/main.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/story-navigation.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/story-presentation.js?')),'New chronicle must be cached offline');
 assert.ok(urls.some(url=>url.includes('/dist/creatures/field-research.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/render/pixel-scenery.js?')));
 for(const asset of ['glyph-ramp','path-contour','pixel-landmarks','ground-chunks'])
   assert.ok(urls.some(url=>url.includes('/dist/render/'+asset+'.js?')),asset+' missing from offline pack');
});

test('PWA fetch bypasses stale unversioned JS cache and restores offline from matching release',async()=>{
 const sw=serviceWorker();
 await sw.fire('install');
 const request={method:'GET',url:'https://azur.example/ASCII_AZUR/dist/story-navigation.js'};
 const first=await sw.fire('fetch',request);
 assert.ok(first?.ok);
 const last=sw.requests.at(-1);
 assert.equal(new URL(last.url).searchParams.get('__azur_release'),expectedRelease);
 assert.equal(last.cache,'reload');
 assert.ok(sw.cached.has(last.url));
 sw.setOffline(true);
 const offline=await sw.fire('fetch',request);
 assert.ok(offline?.ok);
 assert.equal(offline.url,last.url);
});

test('PWA does not intercept cross-origin or mutating requests',async()=>{
 const sw=serviceWorker();
 const cross=await sw.fire('fetch',{method:'GET',url:'https://other.example/main.js'});
 const write=await sw.fire('fetch',{method:'POST',url:'https://azur.example/ASCII_AZUR/save'});
 assert.equal(cross,undefined);assert.equal(write,undefined);
 assert.equal(sw.requests.length,0);
});

// Offline release safety: activation may evict only this game's own old caches,
// never other PWAs on the same host. A transient 503 can recover only same-release data.
test('PWA avoids rewriting other same-origin project paths',async()=>{
 const sw=serviceWorker();
 const external=await sw.fire('fetch',{method:'GET',url:'https://azur.example/OTHER_GAME/dist/main.js'});
 assert.equal(external,undefined);
 assert.equal(sw.requests.length,0);
});

// Activation must not erase other PWA caches on a shared Pages origin.
test('PWA install and activation retain unrelated caches while expiring ASCII AZUR versions',async()=>{
 const listeners=new Map(),deleted=[];
 const self={location:{href:'https://azur.example/ASCII_AZUR/sw.js'},addEventListener:(n,cb)=>listeners.set(n,cb),
  skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const caches={open:async()=>({addAll:async()=>{}}),
  keys:async()=>['other-pwa-v4','ascii-azur-v054-q1','ascii-azur-v055-q1','ascii-azur-v053-q1'],
  delete:async key=>{deleted.push(key);return true;}};
 const sandbox={self,caches,URL,location:{origin:'https://azur.example'}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),sandbox);
 const pending=[];
 listeners.get('activate')({waitUntil:p=>pending.push(p)});
 await Promise.all(pending);
 assert.deepEqual(deleted,['ascii-azur-v054-q1','ascii-azur-v053-q1']);
});
