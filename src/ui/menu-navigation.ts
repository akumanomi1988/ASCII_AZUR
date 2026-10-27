/** Direction-aware keyboard navigation for title, modal, drawer and battle controls. */
export function isTypingTarget(target:EventTarget|null):boolean{
 const el=target as HTMLElement|null;
 const tag=(el?.tagName||'').toUpperCase();
 return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||el?.isContentEditable===true;
}
export interface MenuBounds {left:number;top:number;right:number;bottom:number}
const menuCenter=(r:MenuBounds)=>({x:(r.left+r.right)/2,y:(r.top+r.bottom)/2});
export function nextSpatialIndex(rects:readonly MenuBounds[],current:number,key:string):number{
 if(!rects.length)return -1;
 if(key==='Home')return 0;
 if(key==='End')return rects.length-1;
 const directions:Record<string,[number,number]>={
  ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
  w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0]
 };
 const direction=directions[key];if(!direction)return current;
 if(current<0||current>=rects.length)return 0;
 const origin=menuCenter(rects[current]!);
 let best=current,bestScore=Infinity;
 for(let i=0;i<rects.length;i++){
  if(i===current)continue;
  const point=menuCenter(rects[i]!);
  const dx=point.x-origin.x,dy=point.y-origin.y;
  const forward=dx*direction[0]+dy*direction[1];
  if(forward<=1)continue;
  const sideways=Math.abs(dx*direction[1]-dy*direction[0]);
  const score=forward+sideways*2.7+(sideways>forward?sideways:0);
  if(score<bestScore-0.01||(Math.abs(score-bestScore)<0.01&&i<best)){best=i;bestScore=score;}
 }
 return best;
}
export function menuButtons(root:HTMLElement):HTMLElement[]{
 return Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),[role="button"]:not([aria-disabled="true"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
 .filter(el=>!el.hidden&&!el.closest('.hidden,[aria-hidden="true"],fieldset[disabled]')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');
}
export function focusMenuFirst(root:HTMLElement):void{
 const nodes=menuButtons(root);
 const content=root.querySelector<HTMLElement>('#modalContent');
 const first=content?nodes.find(node=>content.contains(node)):undefined;
 (first||nodes[0])?.focus({preventScroll:true});
}
export function navigateMenuKey(root:HTMLElement,key:string,trapTab=false):boolean{
 const nodes=menuButtons(root);if(!nodes.length)return false;
 if(key==='Tab')return false;
 const active=document.activeElement as HTMLElement|null;
 if(isTypingTarget(active)&&root.contains(active))return false;
 const current=nodes.indexOf(active!);
 if(key==='Enter'||key===' '){
  const chosen=current>=0?nodes[current]:nodes[0];
  if(chosen?.tagName==='BUTTON'||chosen?.getAttribute('role')==='button'){chosen.click();return true;}
  return false;
 }
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D','Home','End'].includes(key))return false;
 const rects=nodes.map(node=>node.getBoundingClientRect());
 const next=nextSpatialIndex(rects,current,key);
 if(next<0)return false;
 nodes[next]?.focus({preventScroll:true});
 nodes[next]?.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'auto'});
 return true;
}
/** Preserved two-column abstract battle topology for previous keyboard contract. */
export function nextBattleCell(available:readonly number[],current:number,key:string):number{
 if(!available.length)return -1;
 if(!available.includes(current)||key==='Home')return available[0]!;
 if(key==='End')return available[available.length-1]!;
 const row=Math.floor(current/2),col=current%2;
 const directions:Record<string,[number,number]>={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],w:[-1,0],s:[1,0],a:[0,-1],d:[0,1]};
 const delta=directions[key];if(!delta)return current;
 const choices=available.filter(i=>delta[0]?Math.sign(Math.floor(i/2)-row)===delta[0]:Math.floor(i/2)===row&&Math.sign(i%2-col)===delta[1]);
 choices.sort((a,b)=>Math.abs(Math.floor(a/2)-row)-Math.abs(Math.floor(b/2)-row)||Math.abs(a%2-col)-Math.abs(b%2-col));
 return choices[0]??current;
}
export function navigateBattleMenuKey(root:HTMLElement,key:string):boolean{return navigateMenuKey(root,key);}
