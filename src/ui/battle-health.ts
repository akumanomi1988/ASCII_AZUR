/** Purely visual HP timelines. Combat rules and saves always retain the true HP. */
import type {CombatCue,CombatSide} from '../actors/combat-fx.js';
type Meter={uid:string;max:number;from:number;to:number;at:number;delay:number;duration:number};
const clampPresentedHp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
export function visibleHp(m:Meter,now:number,reducedMotion=false):number{
 if(reducedMotion)return m.to;
 const t=clampPresentedHp((now-m.at-m.delay)/m.duration,0,1);
 return clampPresentedHp(Math.round(m.from+(m.to-m.from)*(t*t*(3-2*t))),0,m.max);
}
export class BattleHealthPresentation {
 private meters:Partial<Record<CombatSide,Meter>>={};
 reset(){this.meters={};}
 retarget(side:CombatSide,uid:string,hp:number,max:number,now:number,cue:CombatCue|null){
  const value=clampPresentedHp(hp,0,max),previous=this.meters[side];
  if(!previous||previous.uid!==uid||previous.max!==max){
   this.meters[side]={uid,max,from:value,to:value,at:now,delay:0,duration:.8};return;
  }
  if(previous.to===value)return;
  const impact=cue?.kind==='attack'&&cue.actor!==side;
  const healing=cue?.kind==='heal'&&cue.actor===side;
  const delay=impact?(cue!.duration*.46):healing?.24:.15;
  this.meters[side]={uid,max,from:visibleHp(previous,now),to:value,at:now,delay,duration:impact?.82:healing?.65:.58};
 }
 sample(side:CombatSide,now:number,reducedMotion=false):{hp:number;max:number;critical:boolean;warning:boolean}|null{
  const m=this.meters[side];if(!m)return null;
  const hp=visibleHp(m,now,reducedMotion);
  return {hp,max:m.max,critical:m.to>0&&m.to/m.max<=.23,warning:m.to>0&&m.to/m.max<=.45};
 }
}
