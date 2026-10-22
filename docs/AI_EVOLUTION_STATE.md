# ASCII AZUR — Autonomous Evolution State

Updated: 2026-10-22. Active change: **v0.26.1 trail respite**. Source: `akumanomi1988/ASCII_AZUR`, release branch `main`. Do not infer deployment from a push or green CI.

## Product vision and non-negotiables

Original dark-fantasy creature RPG with dense, continuously shaded ASCII/Unicode glyph art (not a pixel-art background), recognizable silhouettes, turn-based tactical encounters, an authored campaign, deterministic procedural terrain and persistent worlds. Touch controls and HUD must work on Android and desktop. Avoid copyrighted franchise assets. Keep existing `version:1` save compatibility, full visual glyph coverage and the production WebGL2/Canvas2D fallback. Work in one complete vertical slice per invocation.

## Release scope and reality

The current game includes three regions, 12 species, an authored six-step Arken arc and finale, visible/seeded encounters, 34 moves, evolving creatures, a persistent physical crypt, expeditions, seeded maps and saves. **This is not a complete global RPG campaign**. Missing: multiple authored chapters with a satisfying global climax, full content and balance, Android physical-device QA, mastered music, accessibility coverage, independent player testing and complete start-to-end human playthrough. Do not report premium release readiness before these are verified.

## Sixteen-domain quality scorecard (0–5; conservative evidence)

| Domain | v0.26 | v0.26.1 | Evidence and unclosed acceptance |
|---|---:|---:|---|
| Artistic direction | 3 | 3 | Four actor facings; compare readability across biomes with users |
| ASCII rendering | 3 | 3 | Dense glyph compositor; physical GPU/low-end FPS pending |
| Animation | 2 | 2 | Authored battle motions; expressive animation coverage pending |
| World design | 2 | 2 | Three traversable regions; more meaningful authored world sites needed |
| Procedural generation | 3 | 3 | 200-seed reachability tests; persistent replay QA needed |
| Exploration | 3 | 3 | Discoveries, runes, visible paths; player reward evaluation pending |
| Core gameplay | 3 | 3 | Walkable mission routes and repeatable encounters; real-world feel pending |
| Combat | 3 | 3 | Tactical preview and charged boss; cross-seed win pacing pending |
| Creatures | 2 | 2 | 12 original species; visual personality across all at mobile scale pending |
| Story and lore | 2 | 2 | Arken arc closed; global beginning–climax–ending absent |
| Progression | 2 | 2 | First-victory XP plus finite 25% team recovery; full balance pending |
| UX / HUD | 3 | 3 | Quest guidance; real-device layout and accessibility pending |
| Mobile | 2 | 2 | Simulated viewports, no sustained physical Android QA |
| Audio | 3 | 3 | Procedural ambience and combat cues; production mix/themes pending |
| Technical | 3 | 3 | TS build, 183 unit/runtime tests, static PWA checks; stress pending |
| Production readiness | 1 | 1 | Global content, hardware QA, complete playthrough still missing |

**Average: 2.5/5 → 2.5/5.** These domain scores remain unchanged because feature tests are not player-experience evidence. No critical/high-severity defect resolution is claimed beyond the tested slice.

## Verified work and release baseline

- v0.14: directional hero silhouettes. v0.15: restored microscopic, dense glyph art and faster software glyph rendering. v0.16: differentiated combat choreography. v0.17: six-step authored Arken story. v0.18/0.19: quest compass and walkable path routing. v0.20: optional adaptive glyph FPS controller. v0.21/0.22: move forecasts and capture odds. v0.23: traversable physical crypt. v0.24: real-combat scripted Arken walkthrough and nonblocking boss preparation. v0.25: 50% shared party XP. v0.26: first visible encounter victories give a one-time +48 XP; roamer flags prevent repeats.
- Previous source baseline on `main`: `ff579e739a309e571b3fdc39dbd9fa4130ceb371` (documentation-only; code v0.26 in `ce9d0e2d2ec43107531dbdf3877ba595b063ced7`). Previous `gh-pages` commit `fdcf992a5a582f37aa4043a7e5ea80b5fb34cf9f`, Pages run `39763347819` SUCCESS. Public `github.io` browser smoke was **not verified**.
- v0.26.1 diagnosis: despite better first-win XP, route battles exhaust health and lead to repeated return journeys. Change: pure `recoverTrailParty` restores `ceil(maxHp*0.25)` to each conscious ally only on first-win roamer payout; cap at max HP, never revive fainted allies. No new save fields and no economy inflation. Capture, random combat, repeat roamer, boss, sentinel and expedition do not grant this respite. Battle toast communicates the recovery.
- v0.26.1 acceptance: feature head `b7b9909244e11a87c524a2ef1ccc9136c1f66e72`, GitHub Actions run `39765446134` SUCCESS, **183/183** Node tests PASS, TypeScript build PASS, 31 JS modules/32 cached PWA assets release audit PASS, generated standalone bundle PASS. Tests include no-repeat recovery, persistence, health caps, no revive, and a scripted first-forest combat using real move commands for all three starters. This is virtual-environment combat, **not** a full physical Android or human playthrough.
- v0.26.1 main merge commit `2724c2579c2316f456ea4697d40bf851415f952a` verified. GitHub Pages provenance and public smoke: **PENDING** until separately verified. Current source changes are not considered released merely because feature CI succeeded.

## Architecture and operational invariants

- `src/**/*.ts` is the source of truth; `dist/` compiled, `play.html` generated only (never committed).
- GitHub Pages serves `gh-pages` static modules with `build-info.json.source_commit`. Updating `main` does not automatically mean the public game is updated.
- `src/main.ts` is large. Refactor incrementally around existing stable contracts, never rewrite the entire engine merely for style.
- Maintain seeded world map snapshots, idempotent quest flags, stable v1 saves, responsive joystick and dense glyph aesthetics.
- GitHub writes only through `akumanomi1988`; no force pushes, unrelated file overwrites, secrets or automatic schedules.

## Prioritized backlog

1. Finish the current branch/main/Pages release with exact commit provenance, smoke-test the public URL when available.
2. Measure forest→guardian→crypt completion, consumable usage, captures and time for all three starters over many seeds; adjust real encounters based on observed failures rather than arbitrary rewards.
3. Expand the global authored campaign and supporting unique biomes/encounters to a genuine beginning, climax and ending.
4. Measure sustained physical Android WebGL2 FPS, GPU/CPU load, heat, battery, joystick and portrait/landscape usability. Target at least 30 stable FPS on a defined minimum device.
5. Complete creature identity and authored animations, audio mastering, accessibility and external user playtests.
6. Execute a full gameplay end-to-end acceptance campaign; remove all high/critical defects and verify all 16 quality dimensions at least 4/5, average at least 4.5/5 before any premium-complete claim.

**Next iteration priority:** cross-seed progression balance through the Guardian and crypt, then the first integrated global-campaign expansion. Score gain requires measurable player evidence.
