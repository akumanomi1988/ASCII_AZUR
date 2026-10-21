export type ZoneId='village'|'forest'|'sanctuary';
export interface Landmark {x:number;y:number;kind:'npc'|'altar'|'portal'|'guardian'|'chest'|'rune';label:string;npcId?:string;}
export interface Zone {id:ZoneId;name:string;subtitle:string;ground:string;glow:string;seed:number;landmarks:Landmark[];}
export const WORLD_W=46,WORLD_H=32,TILE=48;
export const ZONES:Record<ZoneId,Zone>={
 village:{id:'village',name:'Velo de Arken',subtitle:'La última aldea iluminada',ground:'#1b292b',glow:'#c4a46d',seed:12,landmarks:[{x:8,y:16,kind:'npc',label:'El Archivista',npcId:'archivist'},{x:12,y:17,kind:'npc',label:'Mara · Tienda',npcId:'merchant'},{x:19,y:16,kind:'npc',label:'Iria · Vigía',npcId:'scout'},{x:15,y:12,kind:'altar',label:'Lumbre de reposo'},{x:24,y:19,kind:'chest',label:'Cofre de juramentos'},{x:43,y:16,kind:'portal',label:'Bosque de Ceniza'},{x:21,y:20,kind:'rune',label:'Piedra del origen'}]},
 forest:{id:'forest',name:'Bosque de Ceniza',subtitle:'Las raíces pronuncian nombres antiguos',ground:'#15272b',glow:'#77adb0',seed:48,landmarks:[{x:2,y:16,kind:'portal',label:'Velo de Arken'},{x:17,y:16,kind:'altar',label:'Lumbre de reposo'},{x:26,y:16,kind:'npc',label:'Peregrino perdido',npcId:'pilgrim'},{x:35,y:10,kind:'chest',label:'Cofre cubierto de musgo'},{x:43,y:16,kind:'portal',label:'Santuario sin Voz'},{x:30,y:17,kind:'rune',label:'Juramento de raíces'}]},
 sanctuary:{id:'sanctuary',name:'Santuario sin Voz',subtitle:'Donde termina el lenguaje del mundo',ground:'#202432',glow:'#aa8adb',seed:90,landmarks:[{x:2,y:16,kind:'portal',label:'Bosque de Ceniza'},{x:18,y:16,kind:'altar',label:'Lumbre primordial'},{x:24,y:16,kind:'npc',label:'Custodia del Umbral',npcId:'keeper'},{x:35,y:16,kind:'guardian',label:'Hollowhart · Guardián del Silencio'},{x:29,y:18,kind:'rune',label:'Inscripción ausente'}]}
};
export function hash(x:number,y:number,s=0):number{let n=Math.imul(x+137,374761393)^Math.imul(y+193,668265263)^Math.imul(s+19,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function legacyTerrain(zone:ZoneId,x:number,y:number):Tile{if(x<0||y<0||x>=WORLD_W||y>=WORLD_H)return 'wall';const z=ZONES[zone];const r=hash(x,y,z.seed);if(y<=1||y>=WORLD_H-2)return'wall';if(x<=0||x>=WORLD_W-1)return'wall';const center=Math.abs(y-16)<=2;if(center|| (zone==='village'&&x<27&&y>=9&&y<=22))return r>.76?'grass':'ground';if(zone==='sanctuary'){if(y>=12&&y<=20)return'ground';return r>.91?'stone':'ground';}if(zone==='village'){if(r>.91)return'tree';if(r>.86)return'stone';return r>.67?'grass':'ground';}if(r>.81)return'tree';if(r>.70)return'grass';if(r<.055)return'water';return'ground';}

/** Procedural generation v1. Seed 0 deliberately preserves every legacy v0.8 save. */
export type Tile='ground'|'tree'|'stone'|'water'|'wall'|'grass'|'path';
export const WORLD_GEN_VERSION=1;
export const ZONE_IDS:ZoneId[]=['village','forest','sanctuary'];
const IDS=ZONE_IDS;
const TILE_CHARS:Record<Tile,string>={ground:'g',grass:'h',tree:'t',stone:'s',water:'w',wall:'x',path:'p'};
const CHAR_TILES:Record<string,Tile>={g:'ground',h:'grass',t:'tree',s:'stone',w:'water',x:'wall',p:'path'};
export interface WorldSnapshot{gen:1;tiles:Record<ZoneId,string>;poi:Record<ZoneId,[number,number][]>;}
export function validateWorldSnapshot(raw:unknown):raw is WorldSnapshot{
 if(!raw||typeof raw!=='object')return false;const snap=raw as Partial<WorldSnapshot>;
 if(snap.gen!==1||!snap.tiles||!snap.poi)return false;
 return IDS.every(id=>{const tiles=snap.tiles?.[id],poi=snap.poi?.[id];
  return typeof tiles==='string'&&tiles.length===WORLD_W*WORLD_H&&/^[ghtswxp]+$/.test(tiles)
   &&Array.isArray(poi)&&poi.length===ORIGINAL_LANDMARKS[id].length+(SECRET_CACHE[id]?1:0)
   &&poi.every(a=>Array.isArray(a)&&a.length===2&&Number.isInteger(a[0])&&Number.isInteger(a[1])&&a[0]>=2&&a[0]<=43&&a[1]>=2&&a[1]<=29);
 });
}
export function captureWorldSnapshot():WorldSnapshot|null{
 if(!generated||activeSeed===0)return null;
 return {gen:1,tiles:Object.fromEntries(IDS.map(id=>[id,generated![id].map(t=>TILE_CHARS[t]).join('')])) as Record<ZoneId,string>,
 poi:Object.fromEntries(IDS.map(id=>[id,ZONES[id].landmarks.map(l=>[l.x,l.y] as [number,number])])) as Record<ZoneId,[number,number][]>};
}
const SECRET_CACHE:Partial<Record<ZoneId,Landmark>>={forest:{x:20,y:6,kind:'chest',label:'Alijo entre raíces'},sanctuary:{x:20,y:6,kind:'chest',label:'Reliquia olvidada'}};
const ORIGINAL_LANDMARKS:Record<ZoneId,Landmark[]>=Object.fromEntries(IDS.map(z=>[z,ZONES[z].landmarks.map(l=>({...l}))])) as Record<ZoneId,Landmark[]>;
let activeSeed=0;
let azurWorldRevision=0;
/** Changes on every world restore, even with an identical seed and a different snapshot. */
export function getWorldRevision():number{return azurWorldRevision;}
let generated:Record<ZoneId,Tile[]>|null=null;
export function getWorldSeed(){return activeSeed;}
export function seedFromText(input:string):number{
  let h=2166136261>>>0;
  for(const c of input.trim()){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;}
  return h||1;
}
export function freshWorldSeed():number {
  const values=new Uint32Array(1);
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function')crypto.getRandomValues(values);
  else values[0]=((Date.now()^Math.floor(Math.random()*0xFFFFFFFF))>>>0);
  return values[0]||1;
}
function zoneSalt(z:ZoneId){return z==='village'?14567:z==='forest'?37517:94163;}
function zoneRandom(seed:number,z:ZoneId){let x=(seed^zoneSalt(z))>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function smooth(t:number){return t*t*(3-2*t);}
function valueNoise(x:number,y:number,seed:number,step:number){
 const ix=Math.floor(x/step),iy=Math.floor(y/step),fx=smooth(x/step-ix),fy=smooth(y/step-iy);
 const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed),c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);
 return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
function buildZone(id:ZoneId,seed:number):Tile[]{
 const rng=zoneRandom(seed,id),zone=ZONES[id],salt=seed^zoneSalt(id),size=WORLD_W*WORLD_H;
 const arr=new Array<Tile>(size);
 const index=(x:number,y:number)=>y*WORLD_W+x;
 const inside=(x:number,y:number)=>x>0&&y>1&&x<WORLD_W-1&&y<WORLD_H-2;
 for(let y=0;y<WORLD_H;y++)for(let x=0;x<WORLD_W;x++){
  if(!inside(x,y)){arr[index(x,y)]='wall';continue;}
  const mass=valueNoise(x,y,salt,5),granular=hash(x,y,salt+97);
  if(id==='forest')arr[index(x,y)]=mass>.47?(granular>.14?'tree':'grass'):mass<.25&&granular>.58?'water':granular>.82?'stone':granular>.55?'grass':'ground';
  else if(id==='village')arr[index(x,y)]=mass>.57?(granular>.27?'tree':'grass'):mass<.30&&granular>.66?'stone':granular>.88?'grass':'ground';
  else arr[index(x,y)]=mass>.56?(granular>.25?'wall':'stone'):mass<.22&&granular>.65?'water':granular>.82?'stone':'ground';
 }
 const set=(x:number,y:number,t:Tile)=>{if(inside(x,y))arr[index(x,y)]=t;};
 const disk=(cx:number,cy:number,r:number,t:Tile)=>{for(let y=Math.floor(cy-r-1);y<=Math.ceil(cy+r+1);y++)for(let x=Math.floor(cx-r-1);x<=Math.ceil(cx+r+1);x++)if(Math.hypot(x-cx,y-cy)<=r+.09*hash(x,y,salt+212))set(x,y,t);};
 // A deliberately legible 3–5 tile-wide east/west route, with seeded bends.
 const bands=[16,12+Math.floor(rng()*9),10+Math.floor(rng()*13),11+Math.floor(rng()*12),16];
 const waypoints=[{x:3,y:16},{x:12,y:bands[1]!},{x:23,y:bands[2]!},{x:34,y:bands[3]!},{x:42,y:16}];
 const routeY=new Array<number>(WORLD_W).fill(16);
 for(let i=0;i<waypoints.length-1;i++){
  const a=waypoints[i]!,b=waypoints[i+1]!;
  for(let x=a.x;x<=b.x;x++){
   const p=(x-a.x)/(b.x-a.x),wave=smooth(p),y=Math.round(a.y+(b.y-a.y)*wave);
   routeY[x]=y;disk(x,y,id==='village'?2.3:1.85,'path');
  }
 }
 // Village square and sanctuary arena are authored shapes within the generated landscape.
 if(id==='village')disk(15,16,5.2,'path');
 if(id==='sanctuary')disk(35,16,4.6,'path');
 // Add loop / glade route, important for exploration and a choice of approaches.
 const gladeX=19+Math.floor(rng()*12),gladeY=rng()>.5?6+Math.floor(rng()*5):23+Math.floor(rng()*4);
 disk(gladeX,gladeY,3.4,'ground');
 const carve=(a:{x:number;y:number},b:{x:number;y:number},radius=1.4)=>{
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));
  for(let i=0;i<=steps;i++){const t=i/steps;
    disk(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,radius,'path');}
 };
 carve({x:gladeX,y:routeY[gladeX]!},{x:gladeX,y:gladeY});
 carve({x:gladeX,y:gladeY},{x:Math.min(41,gladeX+9),y:routeY[Math.min(41,gladeX+9)]!});
 // Seeded landmark displacements provide different layouts without scrambling the narrative.
 const existing:{x:number;y:number}[]=[];
 zone.landmarks=ORIGINAL_LANDMARKS[id].map(l=>{
  if(l.kind==='portal'){existing.push({x:l.x,y:l.y});return {...l};}
  let out={...l};
  for(let attempt=0;attempt<20;attempt++){
   const dx=Math.floor(rng()*7)-3,dy=Math.floor(rng()*9)-4;
   const x=Math.min(WORLD_W-5,Math.max(5,l.x+dx)),y=Math.min(WORLD_H-6,Math.max(6,l.y+dy));
   if(existing.every(p=>Math.hypot(p.x-x,p.y-y)>=3.2)){out={...l,x,y};break;}
  }
  existing.push({x:out.x,y:out.y});return out;
 });
 // Main story locations are navigable by construction, with 3-tile access corridors.
 if(SECRET_CACHE[id]){zone.landmarks.push({...SECRET_CACHE[id]!,x:gladeX,y:gladeY});}
 const mustReach=[...zone.landmarks,{x:4,y:16},{x:40,y:16},...(id==='village'?[{x:15,y:14}]:[])];
 for(const p of mustReach){
  disk(p.x,p.y,2.2,'path');
  const anchorX=Math.min(42,Math.max(3,p.x));
  carve(p,{x:anchorX,y:routeY[anchorX]!},1.5);
 }
 // Ensure every non-solid terrain tile reachable from the spawn, without sealing side pockets.
 const visited=new Uint8Array(size),queue=[index(4,16)];visited[queue[0]!]=1;
 for(let i=0;i<queue.length;i++){
  const n=queue[i]!,x=n%WORLD_W,y=Math.floor(n/WORLD_W);
  for(const [dx,dy] of ([[1,0],[-1,0],[0,1],[0,-1]] as const)){
   const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=WORLD_W||yy>=WORLD_H)continue;
   const v=index(xx,yy);if(!visited[v]&&!['wall','tree','stone','water'].includes(arr[v]!)){visited[v]=1;queue.push(v);}
  }
 }
 // Deliberately eliminate isolated clear pockets so random grass cannot spawn unreachable encounters.
 for(let y=2;y<WORLD_H-2;y++)for(let x=1;x<WORLD_W-1;x++){
  const i=index(x,y);if(!visited[i]&&!['wall','tree','stone','water'].includes(arr[i]!))arr[i]=id==='sanctuary'?'wall':'tree';
 }
 return arr;
}
export function configureWorld(seed:number,snapshot?:WorldSnapshot):void{
 azurWorldRevision++;
 activeSeed=(Number.isSafeInteger(seed)&&seed>=0&&seed<=0xFFFFFFFF)?seed>>>0:0;
 for(const id of IDS)ZONES[id].landmarks=ORIGINAL_LANDMARKS[id].map(l=>({...l}));
 generated=null;
 if(activeSeed!==0){
  if(snapshot&&validateWorldSnapshot(snapshot)){
    generated=Object.fromEntries(IDS.map(id=>[id,Array.from(snapshot.tiles[id],c=>CHAR_TILES[c]!)])) as Record<ZoneId,Tile[]>;
    for(const id of IDS)if(SECRET_CACHE[id])ZONES[id].landmarks.push({...SECRET_CACHE[id]!});
    for(const id of IDS)ZONES[id].landmarks.forEach((l,i)=>{const point=snapshot.poi[id][i]!;l.x=point[0];l.y=point[1];});
  }else{const built={} as Record<ZoneId,Tile[]>;for(const id of IDS)built[id]=buildZone(id,activeSeed);generated=built;}
}
}
export function terrain(zone:ZoneId,x:number,y:number):Tile{
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=WORLD_W||y>=WORLD_H)return 'wall';
 return generated?.[zone]?.[y*WORLD_W+x]??legacyTerrain(zone,x,y);
}
/** Pure connectivity diagnostic; solid NPCs remain interactable from adjacent path tiles. */
export function getReachableTiles(zone:ZoneId,start={x:4,y:16}):Set<number>{
 const seen=new Set<number>(),queue=[start.y*WORLD_W+start.x];seen.add(queue[0]!);
 for(let n=0;n<queue.length;n++){
  const cell=queue[n]!,x=cell%WORLD_W,y=Math.floor(cell/WORLD_W);
  for(const [dx,dy] of ([[1,0],[-1,0],[0,1],[0,-1]] as const)){
   const xx=x+dx,yy=y+dy,key=yy*WORLD_W+xx;
   if(xx>=0&&yy>=0&&xx<WORLD_W&&yy<WORLD_H&&!seen.has(key)&&!isBlocked(zone,xx,yy)){seen.add(key);queue.push(key);}
  }
 }
 return seen;
}

export function isBlocked(zone:ZoneId,x:number,y:number):boolean {const t=terrain(zone,Math.floor(x),Math.floor(y));return t==='tree'||t==='stone'||t==='wall'||t==='water';}
export function isWild(zone:ZoneId,x:number,y:number):boolean{return zone!=='village'&&(terrain(zone,x,y)==='grass'||(terrain(zone,x,y)==='ground'&&hash(x,y,ZONES[zone].seed+getWorldSeed()+101)>.78));}
export function nearbyLandmark(zone:ZoneId,x:number,y:number,r=1.65):Landmark|undefined {return ZONES[zone].landmarks.find(l=>Math.hypot(l.x-x,l.y-y)<=r);}
/** Footprint collision. Player coordinates describe the tile containing the feet. */
export function canOccupy(zone:ZoneId,x:number,y:number,radius=.20):boolean{
  if(!Number.isFinite(x)||!Number.isFinite(y)||radius<0||radius>.49)return false;
  const cx=x+.5,cy=y+.5;
  for(let ty=Math.floor(cy-radius);ty<=Math.floor(cy+radius);ty++){
    for(let tx=Math.floor(cx-radius);tx<=Math.floor(cx+radius);tx++){
      if(!isBlocked(zone,tx,ty))continue;
      const qx=Math.max(tx,Math.min(cx,tx+1));
      const qy=Math.max(ty,Math.min(cy,ty+1));
      if((cx-qx)**2+(cy-qy)**2<radius**2)return false;
    }
  }
  // Solid NPCs and treasure: characters stop at their feet, not through their torsos.
  for(const l of ZONES[zone].landmarks){
    if(l.kind!=='npc'&&l.kind!=='chest'&&l.kind!=='guardian')continue;
    const dx=x-l.x,dy=y-l.y;
    if(dx*dx+dy*dy<(radius+.32)**2)return false;
  }
  return true;
}
/** Bounded swept movement avoids tunneling and slides along walls. */
export function sweepMove(zone:ZoneId,x:number,y:number,dx:number,dy:number,radius=.19):{x:number;y:number}{
 const distance=Math.hypot(dx,dy);const slices=Math.max(1,Math.ceil(distance/.10));
 for(let i=0;i<slices;i++){
  const sx=dx/slices,sy=dy/slices;
  if(canOccupy(zone,x+sx,y,radius))x+=sx;
  if(canOccupy(zone,x,y+sy,radius))y+=sy;
 }
 return{x,y};
}
