/** Stable, visible overworld encounters, placed on reachable paths (not hidden RNG). */
import {getReachableTiles,hash,terrain,WORLD_W,ZONES,type ZoneId} from '../world.js';
export interface RoamingEncounter {id:string;x:number;y:number;speciesId:string;level:number;}
const SPECIES_BY_ZONE:Record<'forest'|'sanctuary',readonly string[]>={
 forest:['cindrel','mireling','thorne','briarling','ashboar'],
 sanctuary:['wispawn','gravemoth','runeowl','rillfin','velaria']
};
export function visibleEncounters(zone:ZoneId,seed:number):RoamingEncounter[]{
 if(zone==='village')return[];
 const accessible=getReachableTiles(zone),out:RoamingEncounter[]=[];
 // One guaranteed early encounter, one midpoint, one later encounter, each by a route.
 for(let slot=0;slot<3;slot++){
   const target=slot===0?12:slot===1?24:36;
   const candidates=[...accessible].map(index=>({x:index%WORLD_W,y:Math.floor(index/WORLD_W)}))
     .filter(p=>Math.abs(p.x-target)<=5 && p.x>=6 &&p.x<=40
       &&terrain(zone,p.x,p.y)==='path'
       &&ZONES[zone].landmarks.every(l=>Math.hypot(l.x-p.x,l.y-p.y)>=3)
       &&out.every(e=>Math.hypot(e.x-p.x,e.y-p.y)>=6));
   candidates.sort((a,b)=>{
     const score=(p:{x:number;y:number})=>Math.abs(p.x-target)*10+hash(p.x,p.y,seed+slot*17)*8;
     return score(a)-score(b);
   });
   const pick=candidates[0];if(!pick)continue;
   const creatures=SPECIES_BY_ZONE[zone];const variant=Math.floor(hash(slot+1,seed&255,seed+45)*creatures.length);
   out.push({id:`${zone}-${slot}`,x:pick.x,y:pick.y,speciesId:creatures[variant]!,level:zone==='forest'?5+slot:8+slot});
 }
 return out;
}
export function nearbyEncounter(encounters:readonly RoamingEncounter[],flags:readonly string[],x:number,y:number,radius=1.65):RoamingEncounter|undefined{
 return encounters.find(e=>!flags.includes('roamer-'+e.id)&&Math.hypot(e.x-x,e.y-y)<=radius);
}
