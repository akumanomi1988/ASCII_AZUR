/** Local, bounded playtest evidence. No network, analytics SDK, or personal identity. */
import type {SaveGame} from '../domain.js';
export const JOURNEY_COUNTERS=['battles','wins','losses','captures','escapes','actions','tonics','rests','echoesSpent'] as const;
export type JourneyCounter=typeof JOURNEY_COUNTERS[number];
export interface JourneyMetrics {version:1;starter:string;counters:Record<JourneyCounter,number>;}
export function newJourneyMetrics(starter='unknown'):JourneyMetrics{return{version:1,starter,counters:{battles:0,wins:0,losses:0,captures:0,escapes:0,actions:0,tonics:0,rests:0,echoesSpent:0}};}
export function validJourneyMetrics(value:unknown):boolean{
 if(value===undefined)return true;
 if(!value||typeof value!=='object')return false;
 const v=value as JourneyMetrics;
 return v.version===1&&['unknown','cindrel','velaria','thorne'].includes(v.starter)&&!!v.counters&&typeof v.counters==='object'&&Object.keys(v.counters).length===JOURNEY_COUNTERS.length&&JOURNEY_COUNTERS.every(k=>Number.isSafeInteger(v.counters[k])&&v.counters[k]>=0&&v.counters[k]<=10000000);
}
export function recordJourney(save:SaveGame,key:JourneyCounter,amount=1):void{
 if(!Number.isSafeInteger(amount)||amount<0)return;
 const metrics=save.journey??(save.journey=newJourneyMetrics());
 metrics.counters[key]=Math.min(10000000,metrics.counters[key]+amount);
}
export function journeyReport(save:SaveGame){return{format:'ascii-azur-playtest',version:1,worldSeed:save.worldSeed??null,
 recordedSince:save.journey?.starter==='unknown'||!save.journey?'metrics-introduced':'new-game',
 metrics:save.journey?JSON.parse(JSON.stringify(save.journey)):null,playSeconds:Math.floor(save.playSeconds),zone:save.zone,
 chapters:{arken:save.flags.includes('arken-vow-restored'),marsh:save.flags.includes('marsh-chapter-complete'),crown:save.flags.includes('crown-trilogy-complete')},
 team:save.team.map(c=>({species:c.speciesId,level:c.level,equipment:c.equipment??null,potential:c.potential?{...c.potential}:null,principal:c.uid===save.primaryUid,moves:[...c.moves]})),
 fallen:(save.fallen??[]).map(c=>({species:c.speciesId,level:c.level})),inventory:{...save.inventory},relics:{...save.relics},echoes:save.rpg?.echoes??0,
 interpretation:'Recorded gameplay counters; not human approval, elapsed-session duration, or a difficulty score.'};}
