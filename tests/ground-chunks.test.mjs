import test from 'node:test';
import assert from 'node:assert/strict';
import {TILE,WORLD_W,WORLD_H,configureWorld,getWorldRevision} from '../dist/world.js';
import {GROUND_CHUNK_TILES,GROUND_CHUNK_CAPACITY,visibleGroundChunks,GroundChunkCache} from '../dist/render/ground-chunks.js';

function harness(){
  let created=0,drawn=0,painted=0;
  const original=globalThis.document;
  globalThis.document={createElement(name){
    assert.equal(name,'canvas');created++;
    return {width:0,height:0,getContext(kind){assert.equal(kind,'2d');return{}}};
  }};
  const target={save(){},restore(){},drawImage(){drawn++;},imageSmoothingEnabled:true};
  return {
    target,
    paint(){painted++;},
    counts(){return{created,drawn,painted}},
    restore(){globalThis.document=original;}
  };
}

test('ground chunks cover each viewport including world boundaries with no duplicate tile ownership',()=>{
  assert.equal(GROUND_CHUNK_TILES,8);
  assert.equal(GROUND_CHUNK_CAPACITY,24);
  const cameras=[[0,0],[280,340],[1080,650],[WORLD_W*TILE-960,WORLD_H*TILE-540]];
  for(const [x,y] of cameras){
    const chunks=visibleGroundChunks(x,y,960,540);
    assert.ok(chunks.length>0&&chunks.length<=24);
    const tiles=new Set();
    for(const c of chunks){
      assert.equal(c.width,c.tileWidth*TILE);
      assert.equal(c.height,c.tileHeight*TILE);
      assert.ok(c.tileX>=0&&c.tileY>=0);
      assert.ok(c.tileX+c.tileWidth<=WORLD_W&&c.tileY+c.tileHeight<=WORLD_H);
      for(let ty=c.tileY;ty<c.tileY+c.tileHeight;ty++)
        for(let tx=c.tileX;tx<c.tileX+c.tileWidth;tx++){
          const id=tx+ty*WORLD_W;
          assert.ok(!tiles.has(id),'duplicate tile '+id);
          tiles.add(id);
        }
    }
    const minTileX=Math.floor(x/TILE),maxTileX=Math.floor((x+959)/TILE);
    const minTileY=Math.floor(y/TILE),maxTileY=Math.floor((y+539)/TILE);
    for(let ty=minTileY;ty<=maxTileY;ty++)
      for(let tx=minTileX;tx<=maxTileX;tx++)assert.ok(tiles.has(tx+ty*WORLD_W));
  }
  assert.deepEqual(visibleGroundChunks(5000,5000,960,540),[]);
  assert.throws(()=>visibleGroundChunks(Number.NaN,0,960,540));
  assert.throws(()=>visibleGroundChunks(0,0,0,540));
});

test('static landscape is painted once, then replayed as cached images across 100 frames',()=>{
  const h=harness();
  try{
    const cache=new GroundChunkCache();
    cache.draw(h.target,'village',42,200,200,960,540,h.paint);
    const first=h.counts();
    assert.ok(first.painted>100&&first.created>0);
    for(let frame=0;frame<100;frame++)
      cache.draw(h.target,'village',42,200,200,960,540,h.paint);
    const after=h.counts();
    assert.equal(after.painted,first.painted);
    assert.equal(after.created,first.created);
    assert.ok(after.drawn>first.drawn*90);
    assert.ok(cache.size<=GROUND_CHUNK_CAPACITY);
  }finally{h.restore();}
});

test('camera scroll uses bounded LRU and avoids redrawing cached chunks',()=>{
  const h=harness();
  try{
    const cache=new GroundChunkCache();
    cache.draw(h.target,'forest',1,200,200,960,540,h.paint);
    const first=h.counts().painted;
    cache.draw(h.target,'forest',1,210,210,960,540,h.paint);
    assert.equal(h.counts().painted,first);
    cache.draw(h.target,'forest',1,900,700,960,540,h.paint);
    assert.ok(h.counts().painted>first);
    for(let y=0;y<WORLD_H*TILE-540;y+=240)
      for(let x=0;x<WORLD_W*TILE-960;x+=280)
        cache.draw(h.target,'forest',1,x,y,960,540,h.paint);
    assert.ok(cache.size<=24);
  }finally{h.restore();}
});

test('world generation invalidates cached artwork including same-seed saved snapshot reconfiguration',()=>{
  const h=harness();
  try{
    const cache=new GroundChunkCache();
    const start=getWorldRevision();
    cache.draw(h.target,'village',start,200,200,960,540,h.paint);
    const old=h.counts().painted;
    configureWorld(0);
    assert.equal(getWorldRevision(),start+1);
    cache.draw(h.target,'village',getWorldRevision(),200,200,960,540,h.paint);
    assert.equal(h.counts().painted,old*2);
    configureWorld(0);
    assert.equal(getWorldRevision(),start+2);
    cache.draw(h.target,'village',getWorldRevision(),200,200,960,540,h.paint);
    assert.equal(h.counts().painted,old*3);
    cache.draw(h.target,'garden',getWorldRevision(),200,200,960,540,h.paint);
    assert.equal(h.counts().painted,old*4,'distinct biomes must not share ground pixels');
  }finally{configureWorld(0);h.restore();}
});

test('terrain cache is a strict presentation-only optimization',()=>{
  const h=harness();
  try{
    const cache=new GroundChunkCache();
    assert.throws(()=>new GroundChunkCache(0));
    const original=configureWorld(879);
    const revision=getWorldRevision();
    cache.draw(h.target,'marsh',revision,100,400,960,540,h.paint);
    assert.equal(typeof original,'undefined');
    assert.ok(cache.size>0);
    configureWorld(0);
  }finally{h.restore();}
});
