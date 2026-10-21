"""Browser smoke for mobile, graphic customization and visible battles."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'play.html').read_text().replace('new AzurGame();','window.__AZUR_QA__=new AzurGame();')
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security','--enable-unsafe-swiftshader','--use-gl=swiftshader'])
  for name,w,h in [('mobile-landscape',915,412),('mobile-portrait',412,915),('desktop',1200,720)]:
    if os.getenv('AZUR_QA_MODE') and os.getenv('AZUR_QA_MODE')!=name:continue
    print('START',name,flush=True)
    context=browser.new_context(viewport={'width':w,'height':h},is_mobile=name.startswith('mobile'),has_touch=name.startswith('mobile'))
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate("""() => {const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}})}""")
    page.set_content(html,wait_until='load',timeout=15000)
    page.locator('#newGame').click();page.locator('[data-starter="cindrel"]').click()
    for _ in range(3):page.locator('#closeDialogue').click()
    # Direct battle is available even in the village, without traversing random encounter tiles.
    page.locator('#drawerToggle').click();page.locator('#duelBtn').click()
    assert page.locator('[data-duel]').count()==3
    page.locator('[data-duel]').first.click()
    assert page.evaluate('window.__AZUR_QA__.battle?.type')=='wild'
    page.evaluate('window.__AZUR_QA__.finishBattle()')
    page.locator('#drawerToggle').click();page.locator('#graphicsBtn').click()
    assert page.locator('#glyphScale').is_visible()
    page.locator('#densitySelect').select_option('.42')
    page.locator('#glyphScale').fill('1.35')
    page.locator('#glyphContrast').fill('1.4')
    page.locator('#glyphEdges').fill('1.8')
    page.locator('#glyphBrightness').fill('0.1')
    props=page.evaluate('window.__AZUR_QA__.renderer.getGraphics()')
    assert props['density']==.42 and props['glyphScale']==1.35 and props['contrast']==1.4 and props['edgeStrength']==1.8 and props['brightness']==.1,props
    assert page.evaluate("JSON.parse(localStorage.getItem('ascii-azur-graphics-v1')).glyphScale")==1.35
    page.screenshot(path=str(root/f'qa-v013-{name}-settings.png'))
    page.locator('#closeModal').click()
    # Enter a deterministic seeded forest and encounter a visible creature.
    page.evaluate('''() => {const g=window.__AZUR_QA__;g.interactLandmark({kind:'portal',x:43,y:16,label:'Bosque'});const e=g.roamers()[0];if(!e)throw Error('No visible encounter');g.save.x=e.x;g.save.y=e.y;g.revealPosition();}''')
    roster=page.evaluate('window.__AZUR_QA__.roamers()')
    assert len(roster)>=2
    page.screenshot(path=str(root/f'qa-v013-{name}-world.png'))
    page.locator('#touchInteract').evaluate('(btn)=>btn.click()')
    assert page.evaluate('window.__AZUR_QA__.battle?.type')=='wild'
    assert page.evaluate('window.__AZUR_QA__.battle?.encounterId')==roster[0]['id']
    page.screenshot(path=str(root/f'qa-v013-{name}-battle.png'))
    # Defeat this precise roamer: it is removed exactly once and remains persisted.
    page.evaluate('''() => {let g=window.__AZUR_QA__;g.battle.enemy.hp=0;g.winBattle();}''')
    assert page.evaluate('window.__AZUR_QA__.save.flags.includes("roamer-"+"'+roster[0]['id']+'")')
    assert page.evaluate('window.__AZUR_QA__.roamers().length')==len(roster)-1
    page.locator('#drawerToggle').click();page.locator('#duelBtn').click()
    assert page.locator('[data-duel]').count()==3
    page.locator('[data-duel]').first.click()
    assert page.evaluate('window.__AZUR_QA__.battle?.type')=='wild'
    assert page.evaluate('window.__AZUR_QA__.battle?.encounterId') is None
    assert not errors,errors
    print(name,{'QA':'PASS','visible_encounters':len(roster),'density':props['density'],'glyphScale':props['glyphScale'],'errors':len(errors),'mode':page.evaluate('window.__AZUR_QA__.renderer.mode')})
    context.close()
  browser.close()
