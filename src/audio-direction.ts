/** Reactive music direction. No rendering, timers, storage or audio hardware needed. */
export type MixProfile='balanced'|'clarity'|'night';
export type AudioFocus='game'|'menu'|'narration';
export interface MixPreset {music:number;effects:number;ambience:number;lowpassHz:number;}
export const MIX_PRESETS:Readonly<Record<MixProfile,MixPreset>>={
 balanced:{music:1,effects:1,ambience:1,lowpassHz:12000},
 clarity:{music:.68,effects:1.06,ambience:.42,lowpassHz:6200},
 night:{music:.80,effects:.55,ambience:.50,lowpassHz:3700}
};
export const FOCUS_LEVELS:Readonly<Record<AudioFocus,{music:number;effects:number;ambience:number}>>={
 game:{music:1,effects:1,ambience:1},
 menu:{music:.76,effects:.80,ambience:.72},
 narration:{music:.48,effects:.76,ambience:.35}
};
const clamp=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export function activeMixProfile(v:unknown):MixProfile{
 return v==='clarity'||v==='night'?v:'balanced';
}
export interface CombatMusicSituation {
 allyHp:number;allyMaxHp:number;enemyHp:number;enemyMaxHp:number;
 boss:boolean;bossPhase:number;chargeStage:number;allyStatusCount:number;
}
/** The same combat state that drives the tactical readout drives the score.
 * The danger rises before the charged strike and subsides after recovery. */
export function combatMusicIntensity(s:CombatMusicSituation):number{
 const allyRisk=1-clamp(s.allyMaxHp>0?s.allyHp/s.allyMaxHp:0);
 const enemyThreat=clamp(s.enemyMaxHp>0?s.enemyHp/s.enemyMaxHp:0);
 const charge=s.chargeStage>=2?.19:s.chargeStage===1?.11:0;
 return clamp(.23+allyRisk*.31+(s.boss?.18:0)+(s.boss&&s.bossPhase>=2?.16:0)+
  charge+Math.min(3,Math.max(0,s.allyStatusCount))*.035+enemyThreat*.055);
}
export type RegionMusic='village'|'forest'|'sanctuary'|'marsh'|'spire'|'ossuary'|'garden';
const WILDERNESS_UNEASE:Record<RegionMusic,number>={
 village:.04,forest:.17,sanctuary:.24,marsh:.21,spire:.29,ossuary:.23,garden:.12
};
export interface ExplorationMusicSituation {
 zone:RegionMusic;crypt:boolean;healthRatio:number;visibleWitness:boolean;moving:boolean;
}
/** Voluntary silence, travel risk, and low party health adapt existing authored motifs.
 * No random rolls and no dependency on saved quest flags. */
export function explorationMusicIntensity(s:ExplorationMusicSituation):number{
 const risk=1-clamp(s.healthRatio);
 return clamp((WILDERNESS_UNEASE[s.zone]??0)+risk*.25+(s.crypt?.24:0)+
  (s.visibleWitness?.16:0)+(s.moving?.035:0));
}
