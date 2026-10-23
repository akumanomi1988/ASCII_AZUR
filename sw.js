// Versioned offline cache. Older saved games stay in localStorage, outside this cache.
const CACHE='ascii-azur-v038-q01';
const CORE=[
 './','./index.html','./style.css','./manifest.webmanifest','./assets/icon.svg',
 './dist/story-campaign.js','./dist/story-marsh.js','./dist/story-finale.js','./dist/story-afterlight.js','./dist/story-roadbook.js','./dist/story-navigation.js','./dist/main.js','./dist/dungeons/labyrinth.js','./dist/dungeons/room-art.js','./dist/dungeons/draw-dungeon.js','./dist/creatures/loadout.js','./dist/creatures/bond-quests.js','./dist/expeditions/expedition.js','./dist/rpg.js','./dist/domain.js','./dist/party.js','./dist/combat/tactics.js','./dist/combat/move-preview.js','./dist/combat/capture-odds.js','./dist/puzzles/runes.js','./dist/render.js',
 './dist/world.js','./dist/world/discovery.js','./dist/world/encounters.js','./dist/audio.js','./dist/core/frame-metrics.js','./dist/core/adaptive-glyphs.js','./dist/core/save-store.js',
 './dist/render/biome-art.js','./dist/render/glyph-cache.js','./dist/render/graphics-profile.js','./dist/render/legibility.js','./dist/render/software-glyph.js','./dist/render/glyph-material.js','./dist/render/ground-material.js','./dist/render/semantic-assets.js','./dist/ui/menu-navigation.js','./dist/actors/animation.js','./dist/actors/combat-fx.js','./dist/actors/battle-direction.js','./dist/actors/creature-performance.js','./dist/actors/hero-performance.js'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(response=>{
   if(response.ok){const copy=response.clone();void caches.open(CACHE).then(c=>c.put(e.request,copy));}
   return response;
 }).catch(()=>caches.match(e.request)));
});
