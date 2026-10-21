"""Four-direction hero and signature-creature glyph fidelity smoke in Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'play.html').read_text().replace('new AzurGame();','window.__AZUR_QA__=new AzurGame();')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=swiftshader'])
    for name,w,h in [('desktop',1200,720),('mobile-landscape',915,412)]:
        context=browser.new_context(viewport={'width':w,'height':h},is_mobile=name.startswith('mobile'),has_touch=name.startswith('mobile'))
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.evaluate("() => {const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}")
        page.set_content(html,wait_until='load',timeout=20000)
        page.locator('#newGame').click();page.locator('[data-starter="cindrel"]').click()
        for _ in range(3):page.locator('#closeDialogue').click()
        values=page.evaluate("""() => {
          const hero=window.__AZUR_QA__, x=hero.save.x,y=hero.save.y,ctx=hero.renderer.ctx;
          const results=[];
          for(const facing of [0,1,2,3]){
             ctx.fillStyle='#131e27';ctx.fillRect(0,0,960,540);
             drawHero(ctx,480,280,1.2,true,facing,false,false);
             // A fixed region lets the test verify the hero actually looks different by direction.
             const bytes=ctx.getImageData(445,205,74,90).data;
             let checksum=0;
             for(let i=0;i<bytes.length;i++)checksum=(checksum*33+bytes[i])>>>0;
             results.push(checksum);
          }
          hero.facing=0;
          return {poses:results, mode:hero.renderer.mode};
        }""")
        assert len(set(values['poses']))==4,values
        page.locator('#drawerToggle').click();page.locator('#graphicsBtn').click();page.locator('#glyphScale').fill('1.35')
        assert page.evaluate('window.__AZUR_QA__.renderer.getGraphics().glyphScale')==1.35
        page.locator('#closeModal').click()
        page.screenshot(path=str(root/f'qa-v014-{name}-game.png'))
        assert not errors, errors
        print(name,{'poses':4,'graphics':'PASS','errors':len(errors),'renderer':values['mode']})
        context.close()
    # Render a gallery with the actual ASCII compositor, not a vector mockup.
    page=browser.new_page(viewport={'width':1030,'height':600})
    page.set_content(html.replace('window.__AZUR_QA__=new AzurGame();',''),wait_until='load',timeout=20000)
    result=page.evaluate("""() => {
      const can=document.createElement('canvas');can.id='art-gallery';can.style='width:960px;height:540px;display:block';
      document.body.replaceChildren(can);document.body.style='margin:0;background:#101b25';
      const r=new AsciiRenderer(can);r.resize();const ctx=r.ctx;
      ctx.fillStyle='#101d28';ctx.fillRect(0,0,960,540);
      ctx.font='18px monospace';ctx.textAlign='center';ctx.fillStyle='#e0c79c';
      const views=['NORTE','ESTE','SUR','OESTE'];
      for(let i=0;i<4;i++){
         ctx.fillStyle='#162934';ctx.fillRect(18+i*236,25,220,220);
         ctx.fillStyle='#c3b795';ctx.fillText(views[i],128+i*236,67);
         drawHero(ctx,128+i*236,214,1.17,true,i);
      }
      ctx.fillStyle='#1e3644';ctx.fillRect(45,260,425,235);ctx.fillRect(490,260,425,235);
      ctx.fillStyle='#d8c498';ctx.fillText('CINDREL - BRASA ERRANTE',245,285);ctx.fillText('VELARIA - DAMA DEL VELO',704,285);
      drawCreature(ctx,'cindrel',240,425,2.5,1.17,'idle');
      drawCreature(ctx,'velaria',700,425,2.5,1.17,'idle');
      r.present(1170);return {mode:r.mode, width:can.width,height:can.height};
    }""")
    page.locator('#art-gallery').screenshot(path=str(root/'qa-v014-art-gallery.png'))
    print('art gallery',result)
    browser.close()
