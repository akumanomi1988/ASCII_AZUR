#!/usr/bin/env python3
"""Generate a self-contained play.html from the no-dependency compiled ES modules."""
from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text()
css=(root/'style.css').read_text()
css=re.sub(r"@import\s+url\([^)]*\);\s*",'',css,count=1)
js=[]
for filename in ['dungeons/labyrinth.js','dungeons/room-art.js','expeditions/expedition.js','creatures/loadout.js','rpg.js','world.js','world/discovery.js','world/encounters.js','domain.js','party.js','core/frame-metrics.js','core/save-store.js','actors/animation.js','actors/combat-fx.js','actors/battle-direction.js','story-campaign.js','actors/creature-performance.js','actors/hero-performance.js','combat/tactics.js','puzzles/runes.js','render/glyph-cache.js','render/graphics-profile.js','render/legibility.js','render/software-glyph.js','render.js','dungeons/draw-dungeon.js','audio.js','main.js']:
    code=(root/'dist'/filename).read_text()
    code=re.sub(r'^import\s+.*?;\s*$', '', code,flags=re.MULTILINE)
    code=re.sub(r'\bexport\s+(?=(?:const|let|function|class)\b)', '', code)
    assert not re.search(r'^(?:import|export)\s',code,flags=re.MULTILINE),filename
    js.append(f'// --- {filename} ---\n{code}')
script='\n'.join(js)
assert '</script>' not in script.lower()
html=html.replace('<link rel="manifest" href="manifest.webmanifest">','')
html=html.replace('<link rel="icon" href="assets/icon.svg" type="image/svg+xml">','')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>')
html=html.replace('<script type="module" src="dist/main.js"></script>','<script>\n'+script+'\n</script>')
(root/'play.html').write_text(html)
print('Standalone:',(root/'play.html').stat().st_size,'bytes')
