/** Deterministic presentation layer: VFX never decide damage or modify combat state. */
import {BASE_POSE,samplePose,type AnimationClip,type Pose} from './animation.js';

export type CombatSide='ally'|'enemy';
export type FxKind='attack'|'guard'|'heal'|'switch'|'capture'|'faint';
export interface CombatCue {
 kind:FxKind;actor:CombatSide;element:string;damage?:number;effective?:boolean;startedAt:number;duration:number;
}
export interface CombatFxFrame {
 kind:FxKind;actor:CombatSide;element:string;phase:number;active:boolean;
 attacker:Pose;target:Pose;impact:number;trail:number;damage:number;effective:boolean;shakeX:number;shakeY:number;
}
const pose=(x=0,y=0,scaleX=1,scaleY=1,rotation=0,alpha=1):Pose=>({x,y,scaleX,scaleY,rotation,alpha});
const clip=(id:string,action:AnimationClip['action'],keyframes:AnimationClip['keyframes']):AnimationClip=>
 ({id,action,duration:1,loop:false,keyframes});
const attackClip=clip('combat-lunge','attack',[
 {time:0,pose:pose()},{time:.17,pose:pose(-12,7,.91,1.06,-.045)},
 {time:.42,pose:pose(66,-27,1.09,.94,.13)},{time:.58,pose:pose(42,-16,1.04,.97,.08)},
 {time:.82,pose:pose(1,-3)},{time:1,pose:pose()}
]);
const targetClip=clip('combat-impact','hurt',[
 {time:0,pose:pose()},{time:.37,pose:pose()},
 {time:.47,pose:pose(11,1,.96,1.04,-.055,.69)},
 {time:.62,pose:pose(4,0,.98,1.01,-.015,.9)},{time:1,pose:pose()}
]);
const healClip=clip('combat-heal','interact',[
 {time:0,pose:pose()},{time:.25,pose:pose(0,-9,1.04,1.04)},
 {time:.63,pose:pose(0,-5,1.08,1.08)},{time:1,pose:pose()}
]);
const guardClip=clip('combat-guard','anticipate',[
 {time:0,pose:pose()},{time:.22,pose:pose(0,9,1.14,.85)},
 {time:.65,pose:pose(0,6,1.08,.9)},{time:1,pose:pose()}
]);
const switchClip=clip('combat-switch','interact',[
 {time:0,pose:pose(0,14,.55,.55,0,.12)},
 {time:.28,pose:pose(0,-12,.84,1.12,0,.6)},
 {time:.7,pose:pose(0,-6,1.08,1.04,0,1)},{time:1,pose:pose()}
]);
const captureClip=clip('combat-capture','capture',[
 {time:0,pose:pose()},{time:.22,pose:pose(-10,-6,.94,1.05)},
 {time:.45,pose:pose(20,-11,1.09,.94)},{time:.78,pose:pose(2,-2)},
 {time:1,pose:pose()}
]);
const captureTargetClip=clip('combat-capture-target','capture',[
 {time:0,pose:pose()},{time:.38,pose:pose()},
 {time:.62,pose:pose(0,-12,.8,.82,0,.8)},
 {time:.84,pose:pose(0,-18,.75,.75,0,.8)},{time:1,pose:pose()}
]);
const faintClip=clip('combat-faint','faint',[
 {time:0,pose:pose()},{time:.23,pose:pose(0,-8,1.06,.97)},
 {time:.55,pose:pose(0,18,1.2,.64,.12,.8)},
 {time:.78,pose:pose(0,32,1.28,.38,.2,.42)},
 {time:1,pose:pose(0,40,1.3,.22,.24,0)}
]);
const CLIPS:Readonly<Record<FxKind,AnimationClip>>={
 attack:attackClip,guard:guardClip,heal:healClip,switch:switchClip,capture:captureClip,faint:faintClip
};
export function combatClips():readonly AnimationClip[]{return [...Object.values(CLIPS),targetClip,captureTargetClip];}
export function createCombatCue(kind:FxKind,actor:CombatSide,element:string,nowSeconds:number,damage=0,effective=false):CombatCue{
 if(!Number.isFinite(nowSeconds))throw Error('Invalid combat cue time');
 const duration=kind==='attack'?.9:kind==='capture'?1.05:kind==='faint'?1.12:kind==='switch'?.82:.72;
 return {kind,actor,element,startedAt:nowSeconds,duration,damage,effective};
}
export function sampleCombatCue(cue:CombatCue|null,nowSeconds:number,reducedMotion=false):CombatFxFrame|null{
 if(!cue)return null;
 const progress=Math.min(1,Math.max(0,(nowSeconds-cue.startedAt)/cue.duration));
 if(progress>=1)return null;
 const base={kind:cue.kind,actor:cue.actor,element:cue.element,phase:progress,active:true,
  damage:cue.damage??0,effective:!!cue.effective};
 if(reducedMotion)return {...base,attacker:{...BASE_POSE},target:{...BASE_POSE},impact:0,
  trail:cue.kind==='attack'?0:.65,shakeX:0,shakeY:0};
 let attacker=samplePose(CLIPS[cue.kind],progress);
 let target=cue.kind==='attack'?samplePose(targetClip,progress):
  cue.kind==='capture'?samplePose(captureTargetClip,progress):{...BASE_POSE};
 if(cue.actor==='enemy'){
  attacker={...attacker,x:-attacker.x,y:cue.kind==='attack'?-attacker.y*.48:attacker.y,rotation:-attacker.rotation};
  target={...target,x:-target.x,rotation:-target.rotation};
 }
 const impact=cue.kind==='attack'?Math.max(0,1-Math.abs(progress-.48)/.14):0;
 const trail=cue.kind==='attack'?Math.max(0,1-Math.abs(progress-.40)/.35):
  cue.kind==='faint'?Math.max(0,1-progress):Math.sin(Math.PI*progress)*.86;
 const shake=impact*(cue.effective?5:3);
 return {...base,attacker,target,impact,trail,
  shakeX:Math.sin(progress*181)*shake,shakeY:Math.cos(progress*157)*shake*.55};
}
export function guardDamage(rawDamage:number,guarding:boolean):number{
 if(!Number.isFinite(rawDamage)||rawDamage<0)throw Error('Invalid damage');
 return guarding?Math.max(1,Math.ceil(rawDamage*.45)):Math.ceil(rawDamage);
}
