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
   next=(current+(backwards?-1:1)+nodes.length)%nodes.length;
 }
 nodes[next]?.focus();
 nodes[next]?.scrollIntoView?.({block:'nearest',inline:'nearest'});
 return true;
}
