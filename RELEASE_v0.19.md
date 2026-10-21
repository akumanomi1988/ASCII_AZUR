# ASCII AZUR v0.19 — Walkable Quest Navigation

## Player-facing improvement
The quest compass now navigates around trees, walls, rocks, and other solid obstacles instead of pointing in a straight line toward an unreachable goal. It estimates remaining route steps to a reachable interaction tile near the Archivist, Hollowhart or a portal. The compact in-game HUD displays “PASOS · RUTA”. It preserves the dense microscopic ASCII visual style and mobile joystick.

## Technical scope
- `src/story-navigation.ts`: reverse breadth-first search over the existing collision grid, with cached distance and next-step fields; the NPC itself is not traversed.
- `src/world.ts`: in-memory revision increments on every restore or generation, including snapshots with an identical seed. Route cache is invalidated deterministically.
- New tests traverse five objective kinds across forty generated worlds, verify obstacle detours and equal-seed snapshot invalidation.
- `dist/` compiled modules are committed to match GitHub Pages static publishing. `play.html` is built and tested in CI, not tracked.
- No change to save schema, procedural generation, battle mechanics or ASCII glyph density.

## Acceptance evidence
Local candidate: 149 Node tests PASS, TypeScript compile PASS, 28 reachable / 29 cached PWA assets PASS. Standalone Chromium desktop 1180×740 and simulated touch landscape 844×390 boot, choose starter, dismiss opening and display compass without JavaScript exceptions. Android physical GPU and public Pages HTTP smoke remain unverified.
