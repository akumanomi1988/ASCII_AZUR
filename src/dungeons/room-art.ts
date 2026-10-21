import type {DungeonRun} from './labyrinth.js';

/** Art direction for the eight fixed semantic chamber roles. This is deliberately
 * independent of collision tiles and save data: existing seeds and saves remain stable.
 */
export interface ChamberStyle {
 readonly id:number; readonly name:string; readonly epitaph:string;
 readonly wall:string;readonly wallShadow:string;readonly rim:string;
 readonly floor:string;readonly floorShade:string;readonly detail:string;readonly light:string;
 readonly sigil:'diamond'|'cross'|'circle'|'fracture'|'roots';
}
const CHAMBERS:ReadonlyArray<Omit<ChamberStyle,'id'>>=[
 {name:'Umbral sumergido',epitaph:'La puerta aún recuerda.',wall:'#314c5a',wallShadow:'#1d3543',rim:'#80b0bb',floor:'#334854',floorShade:'#283945',detail:'#84a7b4',light:'#8bd4db',sigil:'circle'},
 {name:'Cámara del tributo',epitaph:'El oro no compra un nombre.',wall:'#514536',wallShadow:'#30291f',rim:'#a68e6e',floor:'#4a4038',floorShade:'#332e2b',detail:'#c7a978',light:'#ddbd83',sigil:'diamond'},
 {name:'Sala de las cenizas',epitaph:'El primer vigía escucha.',wall:'#56373a',wallShadow:'#342529',rim:'#aa6a63',floor:'#45343a',floorShade:'#33272e',detail:'#dc8774',light:'#ef997e',sigil:'fracture'},
 {name:'Scriptorium roto',epitaph:'Aquí se borró una palabra.',wall:'#4b3f62',wallShadow:'#29253b',rim:'#8d7ab2',floor:'#39354f',floorShade:'#2b2a3c',detail:'#b5a2e2',light:'#be9df6',sigil:'cross'},
 {name:'Lumbre bajo la piedra',epitaph:'Alguien veló por los vivos.',wall:'#2d5049',wallShadow:'#213832',rim:'#66a895',floor:'#344c46',floorShade:'#263b36',detail:'#87dfbd',light:'#a6f2d2',sigil:'circle'},
 {name:'Capilla del silencio',epitaph:'El segundo vigía aguarda.',wall:'#483745',wallShadow:'#292433',rim:'#99718e',floor:'#3c3542',floorShade:'#2d2835',detail:'#ce9cb8',light:'#ee9eb8',sigil:'roots'},
 {name:'Cámara de los ecos',epitaph:'Nada se pierde del todo.',wall:'#4b443c',wallShadow:'#2c2925',rim:'#a89b83',floor:'#484239',floorShade:'#332f2a',detail:'#ccb98c',light:'#e0c598',sigil:'diamond'},
 {name:'Puerta del Último Signo',epitaph:'La voz exige memoria.',wall:'#3b4e5f',wallShadow:'#26333e',rim:'#b2a2a0',floor:'#364550',floorShade:'#293641',detail:'#e4c7a1',light:'#f4dcb0',sigil:'cross'}
];
export function chamberAt(run:DungeonRun,x:number,y:number):ChamberStyle {
 let nearest=0,min=Infinity;
 for(const event of run.events){
   const dx=x-event.x,dy=y-event.y;const d=dx*dx+dy*dy;
   if(d<min){min=d;nearest=event.id;}
 }
 return {id:nearest,...CHAMBERS[nearest % CHAMBERS.length]!};
}
/** Fast, fixed, seed-derived decor — no Math.random or time-dependence. */
export function chamberGrain(seed:number,x:number,y:number):number {
 let n=(Math.imul(x+101,374761393)^Math.imul(y+97,668265263)^seed)>>>0;
 n=Math.imul(n^(n>>>13),1274126177)>>>0;
 return (n^(n>>>16))>>>0;
}
export function chamberProgress(run:DungeonRun):{required:number;completed:number;remaining:string[]} {
 const ids=[2,3,5];
 return {required:ids.length,completed:ids.filter(id=>run.cleared.includes(id)).length,
 remaining:ids.filter(id=>!run.cleared.includes(id)).map(id=>CHAMBERS[id]!.name)};
}
