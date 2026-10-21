# ASCII AZUR — Autonomous Evolution State

Last updated: 2026-10-21 · v0.13. Source of truth: `akumanomi1988/ASCII_AZUR` / `main`. This file tracks **verified evidence**, not a declared AAA milestone.

## Identity

Premium-quality original dark fantasy RPG with collectable creatures, strategic turn-based battles, persistent procedural worlds, hand-authored narrative, and recognisable ASCII/Unicode-based art. Android landscape is a primary intended platform; web is currently the working delivery target. Do not use protected Pokémon assets or story.

## Release scope / gates

Current campaign: 3 regions, 12 species, short chapter, physical crypt, node-based expeditions. **Not content complete.** Premium release requires a start-to-finish campaign, replayable but meaningful game loop, strong presentation, reliable saves, real-device performance and independent playtesting. See evolution prompt for complete gate.

## Quality assessment (0–5; engineering estimate only)

| Area | Score | Evidence / primary gap |
|---|---:|---|
| Artistic direction | 3 | Atmospheric ASCII style; character readability varies |
| ASCII rendering | 3 | GPU+Canvas paths, settings; Android GPU unmeasured |
| Animation | 2 | Species pose/FX cues exist; no final rigs or authored performances |
| World design | 2 | 3 regions and pathways; limited architecture and interiors |
| Procedural generation | 3 | Deterministic and persistent, connectivity tests; limited geography |
| Exploration | 3 | Rune puzzles, secrets, visible encounter sites; more variety needed |
| Core gameplay | 3 | Movement, capture, quests and direct battles present; feel untested |
| Combat | 3 | 34 moves, roles and AI; balance and strategy unverified |
| Creatures | 2 | 12 species; anatomy and animation need substantial work |
| Story and lore | 2 | Opening chapter only; climax of full narrative absent |
| Progression | 2 | Level/evolution + quests; long-term economy/progression incomplete |
| UX / HUD | 3 | Mobile drawer and render controls; responsive UX needs real-device QA |
| Mobile experience | 2 | Touch joystick/emulated viewport PASS; physical device untested |
| Audio | 3 | Procedural audio exists; composition and mastering incomplete |
| Technical quality | 3 | 116 unit/integration tests and build; high complexity in `main.ts` |
| Production readiness | 1 | No full campaign, Android build, legal review or player trials |

Mean: **2.5 / 5** (author estimate). Previous comparable full assessment: unavailable; no artificial score delta assigned.

## This iteration

- Fixed the discoverability problem behind "no direct battles": predictable visible overworld enemies plus freely selected direct encounters from the drawer, even in the starting village.
- Graphic controls expanded: independent density, glyph size, contrast, brightness and edge sharpness with validation and persistence in both renderers.
- QA: 116/116 tests PASS (previous 111/111); 200 world seeds sampled in the new tests; three viewport modes in browser PASS; fallback Canvas2D only.
- Persistent save compatibility: SaveGame v1 unchanged. Visible encounter results use `flags` and checkpoints optionally store the encounter ID.

## Architecture / risk decisions

- `src/world/encounters.ts` generates deterministic, reachable, landmark-safe encounter locations; clearing is a save flag, not a world mutation.
- `src/render/graphics-profile.ts` owns bounded renderer preferences; separate from `SaveGame`.
- `src/main.ts` is still too large; extract runtime systems gradually without rewriting working gameplay.
- Ultra density can reduce fallback FPS; real WebGL2 device profiling is a required release gate.
- Existing code is public. Verify commercial compatibility for any future added assets.

## Deployment

Local: build, tests, source bundle and headless fallback browser PASS. GitHub commit / GitHub Actions / public Pages verification to be confirmed by release agent; **do not infer success from push**.

## Next priority

Golden Slice: identifiable hero and two distinctive creature rigs, purpose-built glyph density per subject, smoother frame-to-frame art and a real-device graphics profile. Afterwards improve authored locations and a complete campaign segment.
