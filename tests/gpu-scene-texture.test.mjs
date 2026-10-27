import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allocateSceneTexture,updateSceneTexture} from '../dist/render/scene-texture.js';
function fixture(){
 const commands=[];
 const gl={TEXTURE_2D:3553,RGBA:6408,UNSIGNED_BYTE:5121,
  texImage2D(...args){commands.push(['allocate',...args]);},
  texSubImage2D(...args){commands.push(['update',...args]);}};
 return {gl,commands};
}
test('WebGL2 storage is allocated once, then subupdated through 180 frames',()=>{
 const {gl,commands}=fixture(),canvas={width:960,height:540};
 allocateSceneTexture(gl,960,540);
 for(let i=0;i<180;i++)updateSceneTexture(gl,canvas);
 assert.equal(commands.filter(c=>c[0]==='allocate').length,1);
 assert.equal(commands.filter(c=>c[0]==='update').length,180);
 assert.deepEqual(commands[0],['allocate',3553,0,6408,960,540,0,6408,5121,null]);
 assert.deepEqual(commands[1],['update',3553,0,0,0,6408,5121,canvas]);
});
test('scene storage rejects invalid dimensions and renderer never reallocates each frame',()=>{
 const {gl,commands}=fixture();
 for(const w of [0,-1,NaN,Infinity,4.5])assert.throws(()=>allocateSceneTexture(gl,w,540));
 allocateSceneTexture(gl,960,540);updateSceneTexture(gl,{width:960,height:540});
 assert.equal(commands.length,2);
 const source=readFileSync('src/render.ts','utf8');
 assert.match(source,/this\.tex=texture\(gl\);allocateSceneTexture\(gl,W,H\)/);
 assert.match(source,/updateSceneTexture\(gl,this\.source\)/);
 assert.doesNotMatch(source,/gl\.texImage2D\(gl\.TEXTURE_2D,0,gl\.RGBA,gl\.RGBA,gl\.UNSIGNED_BYTE,this\.source\)/);
});
