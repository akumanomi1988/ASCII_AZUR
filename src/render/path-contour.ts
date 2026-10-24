/** Deterministic stepped corner cuts for connected navigable path tiles.
 * Pure visual geometry: terrain collision and world generation never change. */
export interface PathNeighbors {north:boolean;east:boolean;south:boolean;west:boolean}
export interface PathCut {readonly x:number;readonly y:number;readonly width:number;readonly height:number;}
export function pathCornerCuts(size:number,neighbors:PathNeighbors):readonly PathCut[]{
  if(!Number.isInteger(size)||size<24)throw Error('Path tile size must be at least 24 pixels');
  const wide=Math.max(6,Math.round(size/5)),narrow=Math.max(3,Math.floor(wide/2));
  const cuts:PathCut[]=[];
  if(!neighbors.north&&!neighbors.west){
    cuts.push({x:0,y:0,width:wide,height:narrow},{x:0,y:narrow,width:narrow,height:wide-narrow});
  }
  if(!neighbors.north&&!neighbors.east){
    cuts.push({x:size-wide,y:0,width:wide,height:narrow},{x:size-narrow,y:narrow,width:narrow,height:wide-narrow});
  }
  if(!neighbors.south&&!neighbors.west){
    cuts.push({x:0,y:size-narrow,width:wide,height:narrow},{x:0,y:size-wide,width:narrow,height:wide-narrow});
  }
  if(!neighbors.south&&!neighbors.east){
    cuts.push({x:size-wide,y:size-narrow,width:wide,height:narrow},{x:size-narrow,y:size-wide,width:narrow,height:wide-narrow});
  }
  return cuts;
}
