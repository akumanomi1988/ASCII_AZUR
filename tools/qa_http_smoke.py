#!/usr/bin/env python3
"""Optional real-browser HTTP smoke test (requires playwright Python + Chromium)."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
handler=partial(QuietHandler,directory=str(root))
server=ThreadingHTTPServer(('127.0.0.1',0),handler)
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for label,w,h in [('landscape',915,412),('portrait',412,915)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   page=ctx.new_page();errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
   page.locator('#newGame').click();page.locator('[data-starter="cindrel"]').click()
   for i in range(3):page.locator('#closeDialogue').click()
   page.locator('#drawerToggle').click();page.locator('#dungeonBtn').click();page.locator('#enterDungeon').click()
   state=page.evaluate('''() => JSON.parse(localStorage.getItem('ascii-azur-save-v1'))''')
   assert state['dungeon']['active'] and len(state['dungeon']['tiles'])==43*29
   assert page.locator('#zoneName').inner_text()=='Cripta de los Ecos'
   page.wait_for_timeout(200)
   page.screenshot(path=str(root/'release'/f'qa-v012-{label}-crypt.png'))
   page.reload(wait_until='load');page.locator('#continue').click()
   again=page.evaluate('''() => JSON.parse(localStorage.getItem('ascii-azur-save-v1'))''')
   assert again['dungeon']['seed']==state['dungeon']['seed']
   assert again['dungeon']['tiles']==state['dungeon']['tiles']
   assert again['dungeon']['visited']==state['dungeon']['visited']
   assert page.locator('#zoneName').inner_text()=='Cripta de los Ecos'
   assert not errors,errors
   print('PASS',label,w,h,'HTTP reload', 'seed',again['dungeon']['seed'],'JS errors',len(errors),flush=True)
   ctx.close()
  browser.close()
finally:
 server.shutdown();server.server_close()
