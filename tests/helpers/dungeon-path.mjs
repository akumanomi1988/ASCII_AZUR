/** Cardinal shortest path through the exact persisted labyrinth tiles, for movement tests. */
import {tileDungeon} from '../../dist/dungeons/labyrinth.js';
export function dungeonTilePath(d,origin,destination){
 const start=Math.round(origin.x)+','+Math.round(origin.y),goal=destination.x+','+destination.y;
 const queue=[{x:Math.round(origin.x),y:Math.round(origin.y)}],seen=new Map([[start,null]]);
 for(let i=0;i<queue.length;i++){
  const {x,y}=queue[i];if(x+','+y===goal)break;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+dx,yy=y+dy,key=xx+','+yy;
   if(seen.has(key)||!['.','+'].includes(tileDungeon(d,xx,yy)))continue;
   seen.set(key,x+','+y);queue.push({x:xx,y:yy});
  }
 }
 if(!seen.has(goal))throw new Error('Missing valid tile path: '+start+' -> '+goal);
 const path=[];for(let key=goal;key!==null;key=seen.get(key)){
  const [x,y]=key.split(',').map(Number);path.push({x,y});
 }
 return path.reverse();
}
