/** Pure four-way hero animation poses. All values are relative to actor-local coordinates. */
export type HeroFacing = 0 | 1 | 2 | 3;
export type HeroView = 'back' | 'right' | 'front' | 'left';
export interface HeroPose {
  view:HeroView;
  step:number;
  bob:number;
  cape:number;
  arm:number;
  blink:boolean;
  weaponSide:-1|1;
}
export function sampleHeroPose(seconds:number,moving:boolean,facing:number,reducedMotion=false):HeroPose {
  if(!Number.isFinite(seconds))throw Error('Invalid hero animation time');
  const direction=Number.isInteger(facing)?facing:2;
  const view:HeroView=direction===0?'back':direction===1?'right':direction===3?'left':'front';
  const pace=reducedMotion?0:Math.sin(Math.max(0,seconds)*11.8);
  const step=moving?pace*3.5:0;
  return {
    view,
    step,
    bob:reducedMotion?0:moving?Math.abs(pace)*1.65:Math.sin(Math.max(0,seconds)*1.7)*.4,
    cape:reducedMotion?0:(moving?pace*3.2:Math.sin(Math.max(0,seconds)*1.9)*1.2),
    arm:moving?pace*2.2:0,
    blink:!reducedMotion&&Math.max(0,seconds)%4.1<.12,
    weaponSide:view==='left'?-1:1
  };
}
