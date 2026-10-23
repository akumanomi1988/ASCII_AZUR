/** Authored creature-bond trials, resolved at the matching regional Lumbre.
 * Uses existing v1 save flags: stable across old saves and offline play. */
import type {Creature} from '../domain.js';
import type {ZoneId} from '../world.js';

export type BondPath='fang'|'ward';
export interface BondArc {
 id:string;zone:ZoneId;speciesId:string;minLevel:number;title:string;
 prerequisiteFlags:readonly string[];hint:string;memory:string;
}
export const BOND_ARCS:readonly BondArc[]=[
 {id:'ember',zone:'forest',speciesId:'cinderwulf',minLevel:9,title:'El juramento de la ceniza',
  prerequisiteFlags:['pilgrim-met'],hint:'Ayuda al Peregrino del Bosque y despierta a Cinderwulf (nivel 9).',
  memory:'La lumbre de los extraviados reconoce al lobo que un día fue chispa.'},
 {id:'root',zone:'sanctuary',speciesId:'thorne',minLevel:8,title:'La promesa de la raíz',
  prerequisiteFlags:['first-word'],hint:'Recupera la Primera Palabra y lleva a Thorne de nivel 8 o más al Santuario.',
  memory:'Las raíces guardan la primera voz. Thorne elige qué proteger cuando todo calla.'},
 {id:'mist',zone:'marsh',speciesId:'mourveil',minLevel:12,title:'El velo de las dos vidas',
  prerequisiteFlags:['marsh-memory-bell','marsh-memory-lantern'],hint:'Recuerda la Campana y el Farol, y despierta a Mourveil (nivel 12).',
  memory:'Mourveil recoge dos lágrimas: una por lo vivido, otra por lo que pudo ser.'},
 {id:'ether',zone:'spire',speciesId:'mnemoshade',minLevel:13,title:'El nombre que se niega a morir',
  prerequisiteFlags:['crown-relic-flame','crown-relic-archive'],hint:'Recupera las dos reliquias de la Corona y despierta a Mnemoshade (nivel 13).',
  memory:'Un nombre roto vuelve a escribirse. Mnemoshade puede herir o preservar la memoria.'}
];

export type BondStage='claimed'|'ready'|'awaken'|'discover';
export interface BondProgress {arc:BondArc;stage:BondStage;path:BondPath|null;creatureReady:boolean;memories:number;}
export function bondFlag(id:string,path:BondPath):string{return 'bond-'+id+'-'+path;}
export function bondProgress(arc:BondArc,flags:readonly string[],roster:readonly Creature[]):BondProgress{
 const path:BondPath|null=flags.includes(bondFlag(arc.id,'fang'))?'fang':flags.includes(bondFlag(arc.id,'ward'))?'ward':null;
 const creatureReady=roster.some(c=>c.speciesId===arc.speciesId&&c.level>=arc.minLevel);
 const memories=arc.prerequisiteFlags.filter(f=>flags.includes(f)).length;
 const stage:BondStage=path?'claimed':creatureReady&&memories===arc.prerequisiteFlags.length?'ready':creatureReady?'discover':'awaken';
 return {arc,stage,path,creatureReady,memories};
}
export function bondAtZone(zone:ZoneId):BondArc|undefined{return BOND_ARCS.find(a=>a.zone===zone);}
export function bondChoice(flags:readonly string[],speciesId:string):BondPath|null{
 const arc=BOND_ARCS.find(a=>a.speciesId===speciesId);
 if(!arc)return null;
 return flags.includes(bondFlag(arc.id,'fang'))?'fang':flags.includes(bondFlag(arc.id,'ward'))?'ward':null;
}
/** The fang covenant only affects the bonded creature's damaging moves. */
export function bondAttackDamage(base:number,flags:readonly string[],speciesId:string):number{
 if(!Number.isFinite(base)||base<=0)return 0;
 return base+(bondChoice(flags,speciesId)==='fang'?4:0);
}
/** The ward covenant only affects incoming damage to the bonded creature. */
export function bondIncomingDamage(base:number,flags:readonly string[],speciesId:string):number{
 if(!Number.isFinite(base)||base<=0)return 0;
 return bondChoice(flags,speciesId)==='ward'?Math.max(1,Math.floor(base*.85)):base;
}
