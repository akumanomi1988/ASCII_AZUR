# ASCII AZUR v0.18 — Quest Compass

## Scope

- Real-time contextual quest bearing and approximate distance to Archivist, portals and the Hollowhart boss.
- Proximity action instruction, crypt menu/in-dungeon state and completed chapter status.
- Direction targets always read the actual seeded landmark geometry; no hard-coded NPC placements.
- Compact mobile landscape/portrait HUD below region title. No input interception or overlapping menu controls.
- Pure guidance logic; no changes to battle logic, story flags or save v1.

## Local acceptance

- `npm run verify`: 145/145 Node tests pass, TypeScript build, standalone generation and offline audit (28 modules reachable / 29 cached entries).
- Chromium stand-alone content smoke: desktop 1180×740 and touch landscape 844×390, initial quest and non-overlap PASS, no JS exceptions.
- Public GitHub Pages external HTTP check and real Android GPU FPS remain unverified until measured.

## Known limits

- Objective arrow is Euclidean (orientation hint), not turn-by-turn pathfinding; players should follow visible corridors.
- Regional Arken arc is complete; game-wide commercial campaign and AAA quality criteria are not.
