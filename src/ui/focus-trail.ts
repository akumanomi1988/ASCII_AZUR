/** Keyboard focus and mouse share one bond-colored, non-interactive light trail. */
const MENU_SCOPE='#titleScreen,#starterScreen,#modal,#gameDrawer,#battleActions,#openingCinematic';
const FOCUS_SELECTOR='button:not(:disabled),[role="button"],a[href],select,input:not([type="hidden"]),textarea';
const TEXT_EDIT_SELECTOR='input,select,textarea,[contenteditable="true"]';
export class MenuFocusTrail {
 private orb:HTMLDivElement;
 private points:HTMLSpanElement[]=[];
 private x=0;private y=0;private targetX=0;private targetY=0;
 private visible=false;private animation=0;private last=0;
 private history:{x:number;y:number;time:number}[]=[];
 private previous:HTMLElement|null=null;private hovered:HTMLElement|null=null;
 private reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 constructor(){
  const layer=document.createElement('div');layer.className='azur-cursor-layer';layer.setAttribute('aria-hidden','true');
  this.orb=document.createElement('div');this.orb.className='azur-cursor-orb';layer.appendChild(this.orb);
  for(let i=0;i<12;i++){const dot=document.createElement('span');dot.className='azur-cursor-particle';layer.appendChild(dot);this.points.push(dot);}
  document.body.appendChild(layer);
  document.documentElement.classList.add('azur-magic-cursor');
  document.addEventListener('focusin',e=>this.focus(e.target),true);
  document.addEventListener('pointermove',e=>this.pointer(e),{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')this.hide();},{passive:true});
  document.addEventListener('click',()=>queueMicrotask(()=>{
   if(this.visible&&!this.surface(document.elementFromPoint(this.targetX,this.targetY)))this.hide();
  }));
  window.addEventListener('blur',()=>this.hide());
  window.addEventListener('mouseleave',()=>this.hide());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.hide();});
 }
 setTone(color:string){if(/^#[a-f0-9]{6}$/i.test(color))document.documentElement.style.setProperty('--azur-bond-glow',color);}
 setReducedMotion(value:boolean){this.reduced=value;document.documentElement.classList.toggle('azur-ui-reduced-motion',value);if(value){this.history=[];for(const dot of this.points)dot.style.opacity='0';}}
 private surface(target:EventTarget|null):HTMLElement|null{
  const el=target instanceof Element?target:null;
  const root=el?.closest<HTMLElement>(MENU_SCOPE)??null;
  if(!root||root.closest('.hidden,[aria-hidden="true"]')||root.getClientRects().length===0)return null;
  return root;
 }
 private valid(target:EventTarget|null):HTMLElement|null{
  const root=this.surface(target),el=target instanceof Element?target:null;
  const control=el?.closest<HTMLElement>(FOCUS_SELECTOR)??null;
  return root&&control&&root.contains(control)&&!control.matches(':disabled,[aria-disabled="true"]')&&control.getClientRects().length>0?control:null;
 }
 private focus(target:EventTarget|null){
  this.previous?.classList.remove('azur-nav-active');
  const control=this.valid(target);this.previous=control;
  if(!control){if(!this.hovered)this.hide();return;}
  control.classList.add('azur-nav-active');
  const r=control.getBoundingClientRect();this.travel(r.left+r.width/2,r.top+r.height/2);
 }
 private pointer(e:PointerEvent){
  if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  const root=this.surface(e.target),node=e.target instanceof Element?e.target:null;
  this.hovered?.classList.remove('azur-nav-hover');this.hovered=null;
  if(!root||node?.closest(TEXT_EDIT_SELECTOR)){this.hide();return;}
  const control=this.valid(e.target);
  if(control){control.classList.add('azur-nav-hover');this.hovered=control;}
  // Keep light visible between controls, without stealing clicks or focus.
  this.travel(e.clientX,e.clientY);
 }
 private travel(x:number,y:number){
  if(!Number.isFinite(x+y))return;
  if(!this.visible){this.x=x;this.y=y;this.history=[];}
  this.targetX=x;this.targetY=y;this.visible=true;this.orb.classList.add('visible');
  if(!this.animation)this.animation=requestAnimationFrame(this.tick);
 }
 private hide(){this.visible=false;this.orb.classList.remove('visible');this.hovered?.classList.remove('azur-nav-hover');this.hovered=null;this.history=[];for(const node of this.points)node.style.opacity='0';}
 private readonly tick=(now:number)=>{
  this.animation=0;if(!this.visible)return;
  const dt=Math.min(.05,Math.max(.008,(now-this.last)/1000||.016));this.last=now;
  const easing=this.reduced?1:1-Math.exp(-dt*13);
  this.x+=(this.targetX-this.x)*easing;this.y+=(this.targetY-this.y)*easing;
  this.orb.style.transform='translate3d('+this.x+'px,'+this.y+'px,0)';
  if(!this.reduced){
   const last=this.history[0];
   if(!last||Math.hypot(this.x-last.x,this.y-last.y)>3)this.history.unshift({x:this.x,y:this.y,time:now});
   this.history=this.history.filter(point=>now-point.time<420).slice(0,12);
  }else this.history=[];
  for(let i=0;i<this.points.length;i++){
   const dot=this.points[i]!,point=this.history[i];
   if(!point){dot.style.opacity='0';continue;}
   dot.style.transform='translate3d('+point.x+'px,'+point.y+'px,0)';
   dot.style.opacity=String(Math.max(0,(1-(now-point.time)/420)*.52*(1-i/15)));
  }
  if(Math.hypot(this.targetX-this.x,this.targetY-this.y)>.35||this.history.length)this.animation=requestAnimationFrame(this.tick);
 };
}
