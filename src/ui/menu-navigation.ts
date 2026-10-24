/** One keyboard focus policy for viewport menus, combat buttons and modal controls. */
export function isTypingTarget(target:EventTarget|null):boolean{
 const element=target as HTMLElement|null;
 const tag=(element?.tagName||'').toUpperCase();
 return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||element?.isContentEditable===true;
}
export function menuButtons(root:HTMLElement):HTMLElement[]{
 return Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]),[role="button"]:not([aria-disabled="true"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
   .filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&el.getClientRects().length>0);
}
export function focusMenuFirst(root:HTMLElement):void{menuButtons(root)[0]?.focus();}
export function navigateMenuKey(root:HTMLElement,key:string,trapTab=false):boolean{
 const nodes=menuButtons(root);if(!nodes.length)return false;
 const active=document.activeElement as HTMLElement|null;
 const current=nodes.indexOf(active!);
 if(key==='Tab'){
   if(!trapTab)return false;
   // Shift+Tab is handled by native traversal; the caller supplies Shift separately.
   return false;
 }
 if(isTypingTarget(active)){
   // Arrows on sliders, selects and form fields retain native browser semantics.
   return false;
 }
 if(key==='Enter'||key===' '){
   const selected=current>=0?nodes[current]:nodes[0];
   if(selected?.tagName==='BUTTON'||selected?.getAttribute('role')==='button'){selected.click();return true;}
   return false;
 }
 const vertical=['ArrowUp','ArrowDown','w','W','s','S'];
 const horizontal=['ArrowLeft','ArrowRight','a','A','d','D'];
 if(!vertical.includes(key)&&!horizontal.includes(key)&&key!=='Home'&&key!=='End')return false;
 let next=0;
 if(key==='Home')next=0;
 else if(key==='End')next=nodes.length-1;
 else{
   const backwards=['ArrowUp','ArrowLeft','w','W','a','A'].includes(key);
   // When focus starts outside this menu, enter at the nearest edge instead of skipping an item.
   next=current<0?(backwards?nodes.length-1:0):(current+(backwards?-1:1)+nodes.length)%nodes.length;
 }
 nodes[next]?.focus();
 nodes[next]?.scrollIntoView?.({block:'nearest',inline:'nearest'});
 return true;
}

/** Two-column turn menu. Disabled/empty slots never shift another slot's position. */
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
export function navigateBattleMenuKey(root:HTMLElement,key:string):boolean{
 const nodes=menuButtons(root);if(!nodes.length)return false;
 if(key==='Enter'||key===' '){const selected=nodes.find(n=>n===document.activeElement)??nodes[0];selected?.click();return true;}
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','w','a','s','d'].includes(key))return false;
 const cells=nodes.map(n=>Number(n.dataset.battleCell));
 const current=nodes.find(n=>n===document.activeElement);
 const next=nextBattleCell(cells,current?Number(current.dataset.battleCell):-1,key);
 nodes.find(n=>Number(n.dataset.battleCell)===next)?.focus();return true;
}
