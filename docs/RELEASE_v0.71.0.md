# v0.71.0 — A World Remembered Together

## Player-facing change
The original 120-second prologue has been reauthored as a **continuous ten-panel illustrated story** instead of disconnected backgrounds and glyphs. The traveler begins at Arken, encounters the three real starter companions **Cindrel (fox of embers), Velaria (mist spirit) and Thorne (moss guardian)**, witnesses the Silence erasing familiar places, meets the Archivist, finds a Lumbre and reaches the first choice. These are the game's canonical names, shapes and elements. The artwork repeatedly depicts the **same cast, village, landscape and road**, so each scene is part of one journey.

Illustrations are locally authored SVG with figurative silhouettes, expressive eyes, books, buildings, trees, fire, flowing mist and legible creature labels. Characters walk, breathe, float or gesture. The environment pans, lantern and Lumbre pulse, pages drift, erasing darkness crosses the town, and a gold bond ribbon travels between companions. Scene transitions have authored reveal timing.

## Compatibility and accessibility
- Exactly 10 × 12-second scenes, total **2:00**, unchanged elapsed/pause semantics; no changes to save version or starter selection.
- Next, Skip, Escape/Back, replay from title, Tab focus and accessible scene narration are unchanged.
- Reduced-motion OS settings **and the game's own reduced-motion preference** disable decorative animations; high contrast retains legible text.
- Artwork is purely local: SVG geometry and CSS, no web fonts, stock images, generated external images, streaming or new package dependencies.
- Offline PWA, standalone `play.html`, Android WebView assets, release cache and version entries include the new storyboard module.

## Acceptance gates
- Unit tests cover all ten scene IDs, exact timing, recognizable recurring entities and starter names, safe SVG markup, offline packaging and motion preference.
- Real Chromium browser integration checks first scene, Arken/traveler visuals, world-to-companions continuity and existing skip-to-starter flow.
- Full TypeScript, Node campaign/save/audio suites, Chromium GPU/Canvas2D, Android API 35 installed APK/Chrome, standalone and Pages public desktop/mobile smoke must pass before declaring shipped.
- Human visual judgement of choreography, narrative clarity and G2/N4 independent acceptance remains external. The **frozen 21/32 weighted roadmap (68.75%)** is not increased by a code-only prologue revision.
