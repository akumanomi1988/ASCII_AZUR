/**
 * Two-minute first-journey prologue, staged entirely with local DOM/CSS art.
 * No save flags, unlocks, rewards, remote assets or time spent in the game world.
 */
import {renderOpeningStoryboard,type OpeningStoryboardId} from './opening-storyboard.js';

export interface OpeningBeat {
  id:OpeningStoryboardId; chapter:string; title:string; narration:string; glyph:string;
  color:string;
}
export const OPENING_SCENE_MS=12_000;
export const OPENING_BEATS:readonly OpeningBeat[]=[
  {id:'creation',chapter:'PRÓLOGO · I',title:'Hubo un tiempo...',glyph:'✧',color:'#7bb8c4',
   narration:'Hubo un tiempo en que cada estrella, cada río y cada criatura tenía un nombre. El mundo de Azur brillaba porque alguien recordaba cada vida.'},
  {id:'world',chapter:'LAS TIERRAS DE AZUR',title:'Un mundo vivo',glyph:'◇',color:'#b9c6ac',
   narration:'Desde la pequeña Arken, un viajero siguió la senda entre montañas y bosques. Cada aldea, puente y santuario tenía una historia que proteger.'},
  {id:'bonds',chapter:'LOS HABITANTES',title:'Nunca caminamos solos',glyph:'✣',color:'#a9c5aa',
   narration:'Cindrel, el zorro de brasas; Velaria, espíritu de niebla; y Thorne, guardián del musgo. Tres criaturas distintas, tres posibles compañeros de viaje.'},
  {id:'silence',chapter:'LA PRIMERA GRIETA',title:'Entonces llegó el Silencio',glyph:'∅',color:'#a0a6c4',
   narration:'Entonces llegó el Silencio. Una sombra atravesó los caminos de Arken: las ventanas se apagaron, los nombres dejaron de pronunciarse y el viajero protegió su luz.'},
  {id:'erasure',chapter:'EL OLVIDO AVANZA',title:'Cuando un nombre se apaga',glyph:'⌁',color:'#b89bb2',
   narration:'En el archivo, las palabras comenzaron a desaparecer de los libros. Ni siquiera el Archivista pudo recordar todos los rostros de quienes ya no estaban.'},
  {id:'embers',chapter:'LO QUE RESISTE',title:'Pero aún quedan Lumbres',glyph:'✦',color:'#e6bc80',
   narration:'Pero las Lumbres aún alumbran los senderos. Alrededor de su fuego, criaturas y viajeros descansan mientras una pequeña llama protege sus recuerdos.'},
  {id:'companions',chapter:'EL PODER DEL VÍNCULO',title:'Alguien puede recordarte',glyph:'♨  ≋  ✣',color:'#e4b88a',
   narration:'Cuando alguien extiende la mano y una criatura responde, nace un vínculo. Cindrel, Velaria o Thorne pueden acompañarte incluso cuando el Silencio se acerque.'},
  {id:'arken',chapter:'EL ÚLTIMO REFUGIO',title:'Arken sigue encendida',glyph:'⌂',color:'#d8c498',
   narration:'En Arken, el Archivista abre su libro junto al viajero. Guarda fragmentos de nombres antiguos, pero necesita a alguien que salga al mundo y escuche sus historias.'},
  {id:'choice',chapter:'TU HISTORIA',title:'El futuro no está escrito',glyph:'⚖',color:'#c5bccf',
   narration:'Los caminos de Azur se bifurcan. Habrá encuentros, pérdidas y decisiones que no se resuelven luchando; lo que hagas quedará en la memoria de tus compañeros.'},
  {id:'begin',chapter:'UN NUEVO VIAJE',title:'¿A quién recordarás?',glyph:'❖',color:'#e6c28f',
   narration:'Un nuevo amanecer ilumina Arken. Pronto elegirás entre Cindrel, Velaria y Thorne; con tu primer vínculo comenzarás a escribir una historia que todavía no existe.'}
];
export const OPENING_DURATION_MS=OPENING_BEATS.length*OPENING_SCENE_MS;
export function openingCueAt(elapsedMs:number):{index:number;progress:number;finished:boolean}{
 const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
 if(elapsed>=OPENING_DURATION_MS)return {index:OPENING_BEATS.length-1,progress:1,finished:true};
 const index=Math.floor(elapsed/OPENING_SCENE_MS);
 return {index,progress:elapsed/OPENING_DURATION_MS,finished:false};
}

/** The animation owns its focus and rAF; callers own game state transitions. */
export class OpeningCinematic{
 private elapsed=0;
 private priorFrame=0;
 private frame=0;
 private index=-1;
 private activeState=false;
 private onComplete:()=>void=()=>{};
 private onCancel:()=>void=()=>{};
 private readonly buttons:HTMLButtonElement[];
 private readonly announcement:HTMLElement;
 private readonly heading:HTMLElement;
 private readonly chapter:HTMLElement;
 private readonly narration:HTMLElement;
 private readonly glyph:HTMLElement;
 private readonly artwork:HTMLDivElement|null;
 private readonly progress:HTMLElement;
 private readonly clock:HTMLElement;
 private readonly onVisibility=()=>{this.priorFrame=0;};
 constructor(private readonly root:HTMLElement){
  const required=<T extends HTMLElement>(id:string)=>{
   const el=root.querySelector<T>('#'+id);
   if(!el)throw new Error('Missing cinematic control: '+id);
   return el;
  };
  this.heading=required('cinematicHeading');
  this.chapter=required('cinematicChapter');
  this.narration=required('cinematicNarration');
  this.glyph=required('cinematicGlyph');
  const stage=root.querySelector<HTMLElement>('.cinematic-stage');
  // Headless gameplay tests intentionally supply a semantic cinematic root only.
  // Real browser acceptance requires and verifies the illustrated stage.
  this.artwork=stage?document.createElement('div'):null;
  if(this.artwork){
   this.artwork.className='cinematic-artwork';
   this.artwork.setAttribute('aria-hidden','true');
   stage!.appendChild(this.artwork);
  }
  this.announcement=required('cinematicAnnouncement');
  this.progress=required('cinematicProgress');
  this.clock=required('cinematicClock');
  const next=required<HTMLButtonElement>('cinematicNext');
  const skip=required<HTMLButtonElement>('cinematicSkip');
  const back=required<HTMLButtonElement>('cinematicBack');
  this.buttons=[next,skip,back];
  next.addEventListener('click',()=>this.next());
  skip.addEventListener('click',()=>this.finish());
  back.addEventListener('click',()=>this.cancel());
  document.addEventListener('visibilitychange',this.onVisibility);
 }
 get active(){return this.activeState;}
 setReducedMotion(enabled:boolean){this.root.classList.toggle('motion-reduced',enabled);}
 start(onComplete:()=>void,onCancel:()=>void){
  this.stop();
  this.onComplete=onComplete;this.onCancel=onCancel;
  this.elapsed=0;this.index=-1;this.activeState=true;
  this.root.classList.remove('hidden');
  this.root.setAttribute('aria-hidden','false');
  this.render();
  // On Android a new-game button can be reached by scrolling the title panel.
  // Focus without implicit document scrolling, then center the actual game
  // viewport so Next/Skip/Back remain physically visible and tappable.
  this.root.parentElement?.scrollIntoView?.({behavior:'instant',block:'center',inline:'nearest'});
  this.buttons[0]!.focus({preventScroll:true});
  this.frame=requestAnimationFrame(this.tick);
 }
 private readonly tick=(now:number)=>{
  if(!this.activeState)return;
  if(!document.hidden&&this.priorFrame>0)this.elapsed+=Math.max(0,Math.min(now-this.priorFrame,1000));
  this.priorFrame=now;
  if(this.elapsed>=OPENING_DURATION_MS){this.finish();return;}
  this.render();
  this.frame=requestAnimationFrame(this.tick);
 };
 next(){
  if(!this.activeState)return;
  const current=openingCueAt(this.elapsed).index;
  this.elapsed=(current+1)*OPENING_SCENE_MS;
  this.priorFrame=0;
  if(this.elapsed>=OPENING_DURATION_MS)this.finish();
  else this.render();
 }
 handleKey(e:KeyboardEvent){
  if(!this.activeState)return;
  if(e.key==='Escape'){e.preventDefault();this.cancel();return;}
  if(e.key==='ArrowRight'){e.preventDefault();this.next();return;}
  if(e.key==='Tab'){
   const index=this.buttons.indexOf(document.activeElement as HTMLButtonElement);
   if(index<0){e.preventDefault();this.buttons[0]!.focus();return;}
   if(e.shiftKey&&index===0){e.preventDefault();this.buttons[this.buttons.length-1]!.focus();}
   else if(!e.shiftKey&&index===this.buttons.length-1){e.preventDefault();this.buttons[0]!.focus();}
   return;
  }
  if((e.key===' '||e.key==='Enter')&&!this.buttons.includes(document.activeElement as HTMLButtonElement)){
   e.preventDefault();if(!e.repeat)this.next();
  }
 }
 private render(){
  const cue=openingCueAt(this.elapsed);
  const beat=OPENING_BEATS[cue.index]!;
  if(this.index!==cue.index){
   this.index=cue.index;
   this.root.dataset.scene=beat.id;
   this.root.style.setProperty('--cinematic-accent',beat.color);
   this.heading.textContent=beat.title;
   this.chapter.textContent=beat.chapter;
   this.narration.textContent=beat.narration;
   this.glyph.textContent=beat.glyph;
   if(this.artwork)this.artwork.innerHTML=renderOpeningStoryboard(beat.id);
   this.announcement.textContent=beat.chapter+'. '+beat.title+'. '+beat.narration;
   this.buttons[0]!.textContent=cue.index===OPENING_BEATS.length-1?'COMENZAR VIAJE':'SIGUIENTE ESCENA';
  }
  this.progress.style.width=(cue.progress*100).toFixed(2)+'%';
  const secondsRemaining=Math.ceil((OPENING_DURATION_MS-this.elapsed)/1000);
  const time=Math.max(0,secondsRemaining);
  const clock=Math.floor(time/60)+':'+String(time%60).padStart(2,'0');
  if(this.clock.textContent!==clock)this.clock.textContent=clock;
 }
 private stop(){
  // Detached SVGs cannot keep animating while another screen owns the focus.
  this.artwork?.replaceChildren();
  cancelAnimationFrame(this.frame);this.frame=0;this.priorFrame=0;
  this.activeState=false;
  this.root.classList.add('hidden');
  this.root.setAttribute('aria-hidden','true');
 }
 finish(){if(!this.activeState)return;const onComplete=this.onComplete;this.stop();onComplete();}
 cancel(){if(!this.activeState)return;const onCancel=this.onCancel;this.stop();onCancel();}
}
