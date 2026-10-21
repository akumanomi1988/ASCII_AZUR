from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'play.html').read_text().replace('new AzurGame();','window.__AZUR_QA__=new AzurGame();')
(root/'qa-dungeon.html').write_text(html)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-web-security'])
 for mode,w,h in [('landscape',915,412),('portrait',412,915)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mode!='desktop',has_touch=mode!='desktop')
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load',timeout=10000)
  page.locator('#newGame').click();page.locator('[data-starter="cindrel"]').click()
  for _ in range(3):page.locator('#closeDialogue').click()
  page.locator('#drawerToggle').click();page.locator('#dungeonBtn').click();page.locator('#enterDungeon').click()
  assert page.evaluate('window.__AZUR_QA__.save.dungeon.active') is True
  assert page.evaluate('validateDungeon(window.__AZUR_QA__.save.dungeon)') is True
  page.wait_for_timeout(350)
  page.screenshot(path=str(root/f'qa-v11-{mode}-entrance.png'))
  page.locator('#drawerToggle').click();page.locator('#mapBtn').click();assert page.locator('.azur-dungeon-map').count()==1
  page.screenshot(path=str(root/f'qa-v11-{mode}-atlas.png'))
  page.locator('#closeModal').click()
  # Use the physical pathway and enter a chest room, with exact map coordinates in test only.
  page.evaluate('''() => {let g=window.__AZUR_QA__,d=g.save.dungeon,e=d.events.find(e=>e.kind==='cache');d.x=e.x;d.y=e.y;g.save.dungeon=revealDungeon(d);}''')
  page.locator('#touchInteract').click();assert page.evaluate('window.__AZUR_QA__.save.dungeon.cleared.includes(1)')
  page.locator('#closeDialogue').click()
  # A sentinel battle with its event checkpoint, then deterministic win.
  page.evaluate('''() => {let g=window.__AZUR_QA__,d=g.save.dungeon,e=d.events.find(e=>e.kind==='enemy');d.x=e.x;d.y=e.y;g.save.dungeon=revealDungeon(d);}''')
  page.locator('#touchInteract').click();assert page.evaluate('window.__AZUR_QA__.battle?.type')=='wild'
  page.evaluate('window.__AZUR_QA__.battle.enemy.hp=0;window.__AZUR_QA__.winBattle()')
  assert page.evaluate('window.__AZUR_QA__.save.dungeon.cleared.includes(2)')
  assert page.evaluate('window.__AZUR_QA__.save.dungeon.pending') is None
  assert page.evaluate('validateDungeon(window.__AZUR_QA__.save.dungeon)') is True
  page.wait_for_timeout(180)
  page.screenshot(path=str(root/f'qa-v11-{mode}-exploration.png'))
  assert not errors,errors
  print('PASS',mode,'size',w,h,'renderer',page.evaluate('window.__AZUR_QA__.renderer.mode'),'errors',len(errors),flush=True)
  ctx.close()
 browser.close()
