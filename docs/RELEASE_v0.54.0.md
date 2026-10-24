# ASCII AZUR v0.54.0 — Story presentation and narrative continuity

## Scope: closure block 3 engineering slice

This macroiteration targets presentation/content finalization while preserving the v0.53 campaign, seven frozen world regions, save-v1 format and all battle/economy rules. It is a cohesive player-visible production pass, not a new progression feature.

### 1. Five-chapter retrospective chronicle
- A reusable, **pure** `storyChronicle` projection composes the Arken, Marsh, Crown, Ossuary and Garden story from real saved flags. Each chapter is unlocked only after its actual prerequisite; no unreached chapter details or final-choice spoilers are revealed.
- Four original trilogy choice combinations and four Afterlight outcomes retain distinct authored consequences. Recorded choices remain irreversible; viewing/replaying this text has zero gameplay effects.
- The existing Journal shows an accessible chapter list, reading surface and back navigation. Inspection and replay never mutate flags, HP, currency, inventory, story progress or saves.

### 2. Six regional establishing scenes
- Forest, Sanctuary, Marsh, Crown, Ossuary and Garden have authored first-visit titles, distinct regional stakes and carefully written one-line descriptions.
- Scenes are derived from existing visit flags and narrative gate flags. A save/resume or return visit never replays an arrival; older saves with recorded visits automatically skip it. No new persistence fields are introduced.

### 3. Five closing-chapter scenes
- Arken restoration, Marsh verdict closure, original Crown finale and the two Afterlight resolutions receive distinct nonblocking closure cards.
- They trigger only after a new persistent chapter flag has been earned, using the existing idempotent transitions. Arken's direct flag transaction has an explicit hook. No reward, dialog or progression edge is duplicated.

### 4. Visual/accessible direction
- An unobtrusive glyph-oriented chapter card layers an authored typographic hierarchy, quiet material borders and a short reveal/fade over the existing ASCII/Pixel rendering modes without intercepting controls.
- Hardware/motion preferences are respected; reduced-motion immediately switches to static scene layout. The DOM text uses `textContent`, includes `role=status` / polite announcements and works with existing high-contrast CSS.
- CSS constrains the overlay in small landscape and portrait viewports. Gameplay collision, camera, glyph shader and performance pacing are untouched.

### 5. Original musical punctuation
- Five original short four-note motifs distinguish discovery, memory, oath, reckoning and Afterlight resolution.
- Motifs reuse the existing capped Web Audio effect voices, mixed music-duck path, dynamics master, volume/mute state and audio lifecycle. No licensed assets, downloads, polling or persistent audio graphs.

### 6. Regression and distribution integration
- Unit tests cover all regional gates, replay avoidance, closure legitimacy, five-stage spoiler-safe narrative progression, branching choices, state immutability and quiet bounded motifs.
- Runtime tests validate first entry, timed auto-dismiss, persistent visit identity, one-time flag-triggered chapter scenes and read-only journal.
- Browser acceptance exercises actual Journal `LEER` flow, spoiler-safe new-game state, unchanged saved game and keyboard/menu return across Atmospheric ASCII/Glyph Pixel Art and WebGL2/Canvas2D.
- Bump to v0.54.0 with an isolated service-worker cache namespace and release query. The standalone concat builder includes `story-presentation.js` after its prerequisite story modules. The CI pipeline rebuilds all dist modules, runs Node tests and 4-browser acceptance before publishing.

## Criteria and evidence

Initial status: **implementation candidate**. No unverified claims. Require TypeScript, Node, standalone PWA audit, four browser paths, merged main CI and Pages provenance to close the technical delivery.

**Not satisfied by code alone:** G2 visual art-direction approval, A2/A4 original score listening/mastering review, G4/U2 Android physical hardware, N4 independent full narrative reading, C4/P4 combat/economy testing and W4/U4 human navigation. These remain external or device acceptance conditions in the fixed roadmap.

Progress before: **20/32 accepted milestones, 67.50% weighted**. Progress after this implementation is **unchanged** until existing milestone criteria receive independent evidence. This does not mean the phase contributed no engineering work; completion percentages are only incremented at the locked acceptance gates.

Next closure phase: performance/endurance, real Android usability and external player validation (block 4 of 5).
