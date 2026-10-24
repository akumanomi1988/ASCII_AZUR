import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
  keys:async()=>['ascii-azur-v047-q1','ascii-azur-v048-q1'],
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
 assert.ok(urls.every(url=>new URL(url).searchParams.get('__azur_release')==='048'));
 assert.ok(urls.some(url=>url.includes('/dist/main.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/story-navigation.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/creatures/field-research.js?')));
 assert.ok(urls.some(url=>url.includes('/dist/render/pixel-scenery.js?')));
});

test('PWA fetch bypasses stale unversioned JS cache and restores offline from matching release',async()=>{
 const sw=serviceWorker();
 await sw.fire('install');
 const request={method:'GET',url:'https://azur.example/ASCII_AZUR/dist/story-navigation.js'};
 const first=await sw.fire('fetch',request);
 assert.ok(first?.ok);
 const last=sw.requests.at(-1);
 assert.equal(new URL(last.url).searchParams.get('__azur_release'),'048');
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
