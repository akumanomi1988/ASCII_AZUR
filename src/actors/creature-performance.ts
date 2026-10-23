/** Deterministic, species-specific performance rigs. No DOM, RNG, or simulation state. */
export type CreatureAction='idle'|'attack'|'hurt'|'faint'|'evolve';
export type CreatureFamily='canid'|'spirit'|'moth'|'owl'|'boar'|'fish'|'sprout'|'stag'|'beast';
export interface CreatureRig {family:CreatureFamily;pace:number;amplitude:number;blinkInterval:number;detail:string;accent:string;}
export interface CreaturePerformance {
  family:CreatureFamily; bob:number;roll:number;breath:number;gait:number;tail:number;wing:number;
  blink:number; eyeGlow:number;halo:number;particles:number;expression:'calm'|'feral'|'hurt'|'faint'|'transcendent';
}
export const RIGS:Readonly<Record<string,CreatureRig>>=Object.freeze({
 cindrel:{family:'canid',pace:3.1,amplitude:1.5,blinkInterval:3.3,detail:'#ffe6ae',accent:'#ffb763'},
 cinderwulf:{family:'canid',pace:2.3,amplitude:1.15,blinkInterval:4.2,detail:'#fff1c9',accent:'#ff8c43'},
 velaria:{family:'spirit',pace:1.15,amplitude:4.1,blinkInterval:5.6,detail:'#e0fbfa',accent:'#a4f9ec'},
 thorne:{family:'beast',pace:1.0,amplitude:1.0,blinkInterval:5.5,detail:'#ebf4ad',accent:'#91c79d'},
 wispawn:{family:'spirit',pace:2.5,amplitude:5.1,blinkInterval:2.9,detail:'#f0deff',accent:'#d9b1ff'},
 gravemoth:{family:'moth',pace:3.1,amplitude:3.0,blinkInterval:9.0,detail:'#efe5fe',accent:'#bdb2f9'},
 mireling:{family:'beast',pace:1.3,amplitude:1.25,blinkInterval:5.1,detail:'#cdf6b8',accent:'#8bdab5'},
 runeowl:{family:'owl',pace:1.7,amplitude:2.1,blinkInterval:3.0,detail:'#ffefc9',accent:'#e2cdff'},
 ashboar:{family:'boar',pace:2.6,amplitude:1.4,blinkInterval:4.3,detail:'#fff1d5',accent:'#ffc08f'},
 rillfin:{family:'fish',pace:2.8,amplitude:3.5,blinkInterval:9.0,detail:'#e1ffff',accent:'#9ddcf8'},
 briarling:{family:'sprout',pace:1.7,amplitude:2.0,blinkInterval:4.8,detail:'#f4f6b0',accent:'#b5e8ae'},
 mourveil:{family:'spirit',pace:1.0,amplitude:3.2,blinkInterval:5.2,detail:'#e8fffb',accent:'#b1edf0'},
 mnemoshade:{family:'spirit',pace:2.15,amplitude:4.4,blinkInterval:4.1,detail:'#f3e7ff',accent:'#cbaaff'},
 bellroot:{family:'beast',pace:.85,amplitude:.7,blinkInterval:6.3,detail:'#f5edbd',accent:'#b9e4a4'},
 ashglass:{family:'owl',pace:3.5,amplitude:2.6,blinkInterval:4.4,detail:'#fff7d4',accent:'#ffbf8b'},
 tideworn:{family:'beast',pace:.78,amplitude:.85,blinkInterval:6.7,detail:'#e4fff2',accent:'#81e1cf'},
 frostlark:{family:'owl',pace:3.0,amplitude:2.8,blinkInterval:4.9,detail:'#ffffff',accent:'#c8e8ff'},
 nullscribe:{family:'spirit',pace:.85,amplitude:3.1,blinkInterval:6.2,detail:'#fff2df',accent:'#dba8ff'},
 hollowhart:{family:'stag',pace:.9,amplitude:1.8,blinkInterval:5.6,detail:'#fff0d1',accent:'#ddc6ff'}
});
export function rigFor(speciesId:string):CreatureRig {const rig=RIGS[speciesId];if(!rig)throw new Error('Creature rig missing: '+speciesId);return rig;}
export function sampleCreaturePerformance(speciesId:string,seconds:number,action:CreatureAction='idle',reducedMotion=false):CreaturePerformance {
 if(!Number.isFinite(seconds))throw Error('Invalid animation time');
 const rig=rigFor(speciesId);const phase=[...speciesId].reduce((n,c)=>n+c.charCodeAt(0),0)*.029;
 const t=Math.max(0,seconds), pulse=Math.sin(t*rig.pace+phase),slow=Math.sin(t*rig.pace*.43+phase),blinkPhase=(t+phase)%rig.blinkInterval;
 const blink=blinkPhase<.11?Math.max(0,1-Math.abs(blinkPhase-.055)/.055):0;
 const signal=action==='attack'?1:action==='hurt'?-1:action==='faint'?-2:action==='evolve'?2:0;
 const freeze=reducedMotion||action==='faint',k=freeze?0:1;
 const attack=action==='attack'?1:0,hurt=action==='hurt'?1:0,faint=action==='faint'?1:0;
 return {
  family:rig.family,
  bob:k*rig.amplitude*(pulse*.48+.52)+(signal===2?Math.sin(t*8)*3:0)-hurt*2,
  roll:faint ? .22 : hurt ? -.095 :k*slow*(rig.family==='fish'?.065:rig.family==='spirit'?.055:.018),
  breath:faint ? .82 : hurt ? .94 :1+k*.025*Math.sin(t*rig.pace*.83)+attack*.055,
  gait:k*pulse*(1+attack*.8),
  tail:k*Math.sin(t*(rig.pace*1.7)+phase)*(.65+attack*.35),
  wing:k*Math.sin(t*(rig.family==='moth'?8.6:4.3)+phase)*(1+attack*.55),
  blink:action==='attack'?0:action==='hurt'||action==='faint'?1:blink,
  eyeGlow:faint ? 0 : hurt ? .65 :signal===1?1.4:signal===2?1.6:1+.16*slow,
  halo:faint ? 0 : k*(.67+.22*Math.sin(t*1.6+phase))+(signal===2?.6:0),
  particles:faint ? 0 : k*(rig.family==='spirit'?1.2:rig.family==='stag'?1.1:rig.family==='sprout'?.65:.5),
  expression:signal===1?'feral':signal===-1?'hurt':signal===-2?'faint':signal===2?'transcendent':'calm'
 };
}
/** Identical inputs must yield identical values, including independent saved-game sessions. */
export function performanceChecksum(speciesId:string,t:number):string{
 const f=sampleCreaturePerformance(speciesId,t);
 return [f.bob,f.roll,f.tail,f.wing,f.blink,f.halo].map(n=>n.toFixed(4)).join(':');
}
