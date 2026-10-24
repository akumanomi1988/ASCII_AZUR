# v0.53.0 — The connected pilgrimage

## Complete epic: world, discovery, objectives and finite exploration rewards

Block 2 of the five-iteration closure plan consolidates the existing seven regions, main campaign, crypt and two Afterlight chapters. It adds no extra biome, creature family, crafting system or backend.

### 1. Regional field journal

The drawer, story journal and Atlas lead to one regional objective projection. It distinguishes discovering a location from resolving its gameplay requirement. NPC introductions, Lumbres, every authored/secret chest, inscriptions, guardians, story memories, verdicts and finite roaming witnesses use their real saved flags. Arken additionally includes the physical crypt. Each Afterlight region includes the post-verdict keeper epilogue.

Only known regions appear as tabs. Unknown sites have generic labels, no coordinates and no tracking action. Completed sites receive checkmarks on the existing fog-respecting Atlas. The journal is read-only until the player explicitly tracks a goal or claims a reward; opening a panel cannot grant resources or alter discovery.

### 2. Persistent objective tracking and cross-region guidance

An optional version-1 save field, `fieldTarget: {zone,id}`, stores a semantic objective identifier, never arbitrary coordinates or synthetic map data. The current frozen world resolves its target. Only known, eligible objectives can be selected. NPCs/Lumbres remain revisitable; completed finite objectives stop tracking at the next gameplay save. Cancelling is explicit and durable.

The compass follows actual passable portals toward a tracked goal in another region. Closed story gates cannot become routing shortcuts. Same-region paths reuse the existing player-footprint route fields. The original temporary Atlas selection remains a separate short-lived navigation override and retains its prior behaviour.

### 3. Seven finite regional survey recognitions

Every objective in a region must actually be resolved before its recognition becomes available. Revealing fog alone is insufficient. Each region pays once per campaign:

| Region | Echoes | Seals | Tonics |
|---|---:|---:|---:|
| Arken | 35 | 1 | 1 |
| Forest | 45 | 1 | 1 |
| Sanctuary | 60 | 1 | 1 |
| Marsh | 75 | 1 | 1 |
| Crown | 90 | 1 | 1 |
| Ossuary | 100 | 1 | 1 |
| Garden | 110 | 1 | 1 |

Maximum added supply: 515 Echoes, seven seals and seven tonics for completing all seven regions. Rewards fund existing equipment and capture decisions instead of creating a repeatable scan/revisit farm. A full inventory, capped balance or full flag ledger refuses the entire claim without consuming its marker. Survey claims are unavailable in combat, active crypts and expeditions.

### 4. Visited Lumbre network

Travel is available from the regional journal/network, not an intrusive popup after every rest. The source must be an already visited Lumbre within interaction distance. The destination must already have been visited on foot and its narrative gate must be open. Battles, active crypts, active expeditions and entirely fainted parties cannot travel.

Travel costs no consumable, but does not heal, award seals, resolve landmarks, advance quests, resurrect companions or reroll world snapshots. It uses the existing destination altar coordinate and reveals only the normal local footprint. Origin and destination remain ordinary explorable regions.

Both travel and survey/pin transactions prepare a new snapshot and use the existing validated, optimistic save adapter before replacing live state. Quota, backup-write or stale-tab failures leave the live position, economy and persisted campaign intact.

### 5. Full Afterlight continuity

The original trilogy keeps its existing 19-step main-story measurement. The story journal separately reports the pilgrimage's 16 concrete objectives: eight per Afterlight chapter (keeper, two memories, three witnesses, verdict and return epilogue). Post-finale guidance now continues from any region toward the next unfinished chapter and brings the player back for missing keeper epilogues.

Hearing the keeper after a verdict records a finite epilogue flag but grants no duplicate choice reward. The four sea/garden decision combinations remain independent and permanent. The principal identity, individual stats, equipment, learned repertoire and crypt mortality from v0.52 remain intact. Outside crypts, fainting stays recoverable.

### 6. Integration and bounded presentation cost

The field journal domain is isolated in `src/world/field-journal.ts`. Encounter positions are cached per region, seed and world revision (at most seven entries), avoiding repeated reachable-tile scans during compass updates. The seeded topology and save-v1 snapshot format are unchanged. New optional pins and flags coexist with legacy campaigns.

Leader selection now uses the same durable transaction pattern, with the original principal remaining protected. The existing local playtest export includes known regional completion and pilgrimage status, not undiscovered coordinates or personal identity.

## Acceptance gates

- Regional rules: hidden/known/resolved separation, all seven reward paths, inventory/flag caps, duplicate claims, closed gates, visited-only travel, blocked combat/crypt/expedition actions and unchanged input snapshots.
- Save/runtime integration: read-only panel inspection, persistent goal/resume/retirement, quota-failed travel and stale-tab survey refusal before live credit.
- 200 saved seeds × seven regions verify 1,400 altar journal objectives and stable snapshot reloads; the existing 200-seed footprint-aware traversal gate still exercises all landmarks/witnesses.
- Twelve actual new-game → main finale → both Afterlight chapters journeys cover three starters and all four optional decision combinations, with no injected wins/XP/resources/flags. They physically discover and resolve memories/chests/witnesses, hear keeper epilogues, claim both regional recognitions exactly once, reload goals and travel round trips without supply/HP/topology changes.
- Existing 150-world/starter campaign acceptance, core/crypt/equipment/save regressions, TypeScript, standalone, offline dependency audit and four real Chromium renderer/backend paths must pass.
- Browser field-journal/network fixtures isolate DOM control/transaction behaviour; they are explicitly separate from the earned-progression physical journey gate.
- Main CI and Pages source provenance must be observed before shipment. A public boot is checked independently.

Human wayfinding/mobile evidence remains the fixed W4 acceptance dependency. No new code by itself closes external C4/P4/N4/U4, physical G4/U2 or independent art/audio gates. The accepted weighted roadmap stays 20/32, 67.50% pending those approvals. This is technical completion of closure block 2, not a claim of premium completion.


## Observed release evidence

- Local `npm run verify`: **360 tests passed, zero failures**, TypeScript, standalone and release audit PASS (52 reachable modules / 55 offline-cached modules).
- Physical acceptance: the existing 150 complete trilogy campaigns / 450 chapter reloads and 12 new-game-to-both-Afterlight journeys pass. New journeys cover three starters, all four optional endings, 24 optional region completions and 24 travel operations.
- Field journal: 13 passing tests include 200 saved seeds / 1,400 regional altar objectives and storage-failure rollback. The independent world traversal regression retains 200 seeds / 15,975 reachable routes / 1,846 physically swept routes.
- Playable source commit: `7badb5a2443b8d0947d7aeff46dc652e09634dca`. Remote browser, publication and live-boot evidence is recorded below only once observed.


### v0.53 verified deployment — 2026-10-24

[Main quality/browser/publish 40099794792](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40099794792) observed **SUCCESS**. Node job `120889408022` confirms **360/360 tests**, zero failures, 150 complete trilogy campaigns / 450 chapter reloads, the 12 complete main-plus-Afterlight journeys and release audit PASS (52 imports / 55 cached modules). Browser job `120889407827` passed all four ASCII/Pixel × WebGL2/Canvas2D combinations, including journal, saved objectives, travel and recognition UI; 32 screenshot artifacts were retained.

[Pages deployment 40100163040](https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/40100163040) observed **SUCCESS**. Distribution commit `0dd8856079ade8ae98c2636b1fdb6da9a659ab64` records exact `build-info.json.source_commit=7badb5a2443b8d0947d7aeff46dc652e09634dca`. An independent live browser reload of `https://akumanomi1988.github.io/ASCII_AZUR/` displayed **WORLD ENGINE v0.53.0** with the title, campaign selector and initialized HUD. This is public boot acceptance, separate from Chromium gameplay acceptance and physical Android evidence.

Closure block 2 is technically delivered. Fixed accepted gates remain **20/32, weighted 67.50%**; no independent human or physical-device approval is claimed. This evidence-only documentation follow-up intentionally skips CI and changes no playable source or deployed build. Next block: presentation/content finalization with narrative, visual and listening acceptance.
