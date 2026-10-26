# ASCII AZUR — Integrated Player-Experience Repair Master Plan

**Status:** APPROVED FOR TECHNICAL PLANNING ONLY; NO GAMEPLAY CHANGES IMPLEMENTED BY THIS DOCUMENT.  
**Created:** 2026-10-25  
**Source baseline:** \`bc0ecf7f369aa9824b9b25791707cb6da87322ab\` (main; release package 0.55.0).  
**Roadmap baseline:** 20/32 accepted milestones; **67.50% weighted**. This plan does not amend milestone definitions or move the percentage.  
**Source of truth:** \`docs/AAA_ROADMAP.md\`, \`docs/ANDROID_RELEASE_ACCEPTANCE.md\`, \`docs/WORLD_PLAYTEST_TASKS.md\`, \`docs/RELEASE_ACCEPTANCE_EVIDENCE.md\`, \`src/\` and CI.

## 1. Actual evidence; do not overinterpret it

The project's owner reports one personally played campaign, on **PC and Android** (exact hardware, browser, game commit and graphics profile not recorded), with **only the principal story** completed in **less than two hours**. Reported qualitative impressions: combat acceptable; creature collection/progression **not worthwhile**; exploration enjoyable **only intermittently**; little engagement with story or characters; graphics good; music very good; interface/operation problem-free in this session; would consider the product commercially acceptable **only after improvements**.

This is one **internal, unblinded, self-reported playtest**, not 20 independent combat sessions, an independently rated 16-domain quality audit, a hardware performance measurement, or proof that all chapters and Afterlight were completed. "No problems" is not evidence of no bugs on other devices, modes, seeds or saves. The under-two-hour report is a hypothesis about pacing, not a universal game length or permission to add filler.

**Observed design risks, not confirmed root causes:**
1. Weak incentive to capture, develop, swap and equip companions.
2. Insufficiently compelling/legible motivations, characters and consequences.
3. Uneven reward for exploration and only acceptable combat decision depth.
4. Optional content/Afterlight discoverability may be weak; completion not established.
5. Presentation/audio/UX appear comparatively strong in this single playtest; protect them against regressions.

**Before editing the design, make these hypotheses falsifiable:** examine current encounter/party/use paths, dialogue and rewards; replay the actual starter/seed if recoverable, and solicit specific examples without assuming them. Record internal observations separately from independent acceptance.

## 2. Design north star and measurable outcomes

**Core loop:** learn an immediate narrative stake -> scout a meaningful route -> discover/recruit a creature with a useful tactical role -> customize its techniques/relic/bond -> make a meaningful combat or narrative choice -> see a persistent, understandable consequence -> get a new reason to explore. Every stage must pay off within the existing main campaign, not exclusively in optional postgame.

**Non-goals:** more zones, indiscriminate new species, arbitrary grind, compulsory creature collection, bloated dialogue, another currencies layer, online dependencies/analytics, save-wiping migration, large renderer rewrites, or fictitious progress inflation.

**Product hypotheses to test with real people (provisional targets, not replacements for fixed roadmap gates):**
- Independent players can explain **why they are acting now** and the stakes after each chapter introduction without developer assistance.
- Independent players can articulate **at least two materially different creature/team decisions** and use more than a pure initial-companion strategy because the alternatives help, not because the game forbids the starter.
- Each required boss has clear telegraph/counterplay and does not become unwinnable for any starter; victory is not reliably achieved by blindly spamming a single attack.
- Major discoverable objectives have differentiated rewards (story, tactics, world state, useful resources) rather than a checklist of identical interactions.
- Players can find and understand optional Afterlight content after the main ending without being forced to clear it.
- A shorter but consistently engaging campaign beats inflated playtime. Compare unobstructed new-player completion duration, idle/backtracking, quest confusion and voluntary continued play before agreeing on a content-length target.
- No regression in screen readability, audio performance, existing saves, offline behavior or accessibility.

Measure using consented playtest scripts, anonymized manual notes and optional local exports. A single internal rating never becomes external acceptance.

## 3. Target architecture and technical boundaries

**Keep:** TypeScript, dependency-light browser runtime, GitHub Pages/PWA, all seven existing zones, procedural world, existing story and ending flags, saved \`version:1\` contract, three original starters, bounded capture/resource economy and the existing full campaign/Afterlight runner.

**Prefer targeted pure modules** around existing contracts to expanding \`src/main.ts\` (approximately 176 KB at baseline):
- \`src/creatures/\` — progression value, role/relic/bond synergy, research guidance, bounded reward selection.
- \`src/combat/\` — encounter intention, tactical roles, boss counterplay and reward tuning, sharing the same damage/AI/preview calculations.
- \`src/story-*.ts\` — authored beats, goals, decisions and outcome projection derived from durable flags; preserve existing branches.
- \`src/world/\` — useful optional discoveries, objective hints and region-specific challenge/reward identity.
- \`src/ui/\` and narrowly patched \`src/main.ts\` — one presentation/orchestration boundary; no second state authority.

All rules must have deterministic pure tests before connecting UI. Never encode core balance logic only in HTML string builders. Do not fork rules for tooltip vs battle vs AI. Performance/visual effects must be skippable and honor reduced-motion/high-contrast. Document every new/repurposed persistent flag, evaluate the \`flags.length <= 200\` validator bound on the longest full+optional route, and keep old save-v1/creature/move/loot IDs stable. If a schema break is genuinely unavoidable, require a separately tested forward migration, rollback plan and explicit release decision; do not hide it inside a gameplay epic.

## 4. Epic A — Creature progression and tactical value (FIRST)

**Outcome:** a player who was previously indifferent to collection can see a concrete, early, useful reason to capture or evolve a creature, adjust the squad, learn moves and equip relics, without mandatory grind.

Implement together:
1. **Role differentiation:** audit damage/status/heal/cleanse/drain, type affinities and stats for the starters and main-campaign capturables; give each recruited role at least one genuinely useful type/utility situation. Preserve three-starter completion viability.
2. **Encounter-reward linkage:** align visible forest/sanctuary/marsh/spire challenges, natural encounter placement and brief pre-battle hints with useful recruitable counters. Avoid introducing arbitrary hard type gates.
3. **Growth decisions:** retain a permanent move repertoire / maximum four equipped moves, but make upgrade/selection consequences readable with real damage/utility previews and clear why an alternative matters. Avoid forced choice prompts after every level-up.
4. **Relic and bond incentives:** connect existing six relics and four authored oath paths to understandable encounter strategies and narrative meaning. Tune or enhance existing effects before adding items; show before/after previews and obtained/available counts.
5. **Collection and reward pacing:** give early and midgame field research rewards an actual tactical or exploration function; improve discoverability and perceived value of evolution and reserve management. Keep finite, once-only rewards idempotent across reload/import and maintain economy caps.
6. **Battle decision quality:** extend telemetry-free deterministic balance matrices so healing, status timing, guarding, swaps, captures and alternative moves compete plausibly with the strongest attack; avoid a universal dominant action or overly punitive difficulty spikes. Preserve boss telegraphing and existing recovery cast limits.
7. **Feedback and UI:** make gains, newly usable moves, role changes and species discovery visibly and accessibly understandable in team, Codex and post-battle screens, without interrupting navigation.

**Primary code review/integration targets:** \`src/domain.ts\`, \`src/creatures/{bond-quests,equipment,field-research,loadout,attributes}.ts\`, \`src/combat/{tactics,planning,move-preview}.ts\`, \`src/world/encounters.ts\`, \`src/party.ts\`, scoped \`src/main.ts\` UI/transaction paths. New pure modules only for nontrivial reusable calculations.

**Acceptance:** every starter completes required trilogy routes with legitimate encounters and resources; every early recruitable role demonstrates one tested distinct advantage; before/after move/relic/relationship previews match actual combat; old saves work; no duplicate, negative or unbounded rewards; no endless heal/defend loop; both keyboard and touch can change team/moves/relics. Compare a full starter-only strategy with varied squads as diagnostic evidence, not a requirement to deliberately cripple solo play.

## 5. Epic B — Motivating story, character agency and visible payoff (SECOND)

**Outcome:** chapter objectives communicate concrete stakes; the player's choices change something they can perceive, not just a once-only flag and material reward.

Implement together:
1. **Arken opening:** rewrite the first player-visible sequence into a concise playable hook with a personal stake, a concrete objective and an early payoff. Use existing Archivist/Pilgrim/Keeper, not new exposition-only NPCs.
2. **Three-chapter emotional throughline:** explicitly connect the Arken oath, Nael's memories and Oriel/Nullscribe's finale so a player can explain how each chapter follows the previous one. Keep all established lore and existing saved-choice flags authoritative.
3. **Consequences in play:** make Marsh preserve/release and Crown remember/renew choices visibly alter later *authored lines, reactions, Chronicle records and/or bounded gameplay affordances* already controlled by flags. Preserve all four outcome combinations, avoid branching into four separately maintained games.
4. **Creature-to-story integration:** the four existing bond arcs become optional scenes that recognize a meaningful party decision and personal agency, not just passive stat rewards. Do not make optional collection block the ending.
5. **Pacing and dialogue:** replace repeated abstract lore blocks with shorter goal/action/reaction scenes, better transitions and accessible optional deeper reading. Never force slow cinematics; preserve skip/replay via Chronicle and reduced-motion behavior.
6. **Ending and continuation:** clarify what the principal ending resolves, what it does not, and why Ossuary/Garden/Afterlight matter. Surface an actionable postgame hook in the journal/compass with explicit optionality, not a generic completion message.
7. **Consistency:** reconcile NPC dialogue, current objective, map marker, Chronicle and saved flags; prevent spoilers, duplicate one-time rewards and replay-triggered state mutation.

**Primary modules:** \`src/story-campaign.ts\`, \`src/story-marsh.ts\`, \`src/story-finale.ts\`, \`src/story-afterlight.ts\`, \`src/story-presentation.ts\`, \`src/story-roadbook.ts\`, \`src/story-navigation.ts\`, \`src/world/field-journal.ts\` and narrative UI orchestration in \`src/main.ts\`.

**Acceptance:** replay all three starters x two Marsh decisions x two Crown endings, followed by both optional epilogues; four correctly differentiated main epilogues and earned postgame responses; all choices persist after close/reopen/import; no skipped essential scenes or accidental spoilers. A new, unfamiliar player can state the goal, emotional stakes and observed consequence after each chapter. External independent narrative review (N4) remains OPEN until performed.

## 6. Epic C — Exploration and encounter variety (THIRD)

**Outcome:** players are rewarded for following interesting leads, not for tediously sweeping repeated sites.

Implement together:
1. **Route rhythm:** audit required detours, travel times, wild encounter frequency, recovery loops and backtracking in all seven zones. Remove dead time rather than artificially extending the reported short campaign.
2. **Landmark identities:** differentiate existing memories, riddles, witnesses, chests, altars and region decisions through at least one unique clue, encounter twist, narrative beat or useful finite reward per authored cluster. Reuse geography; no extra regions as a shortcut.
3. **Fair discoverability:** ensure the main quest and optional mysteries have truthful fog-aware guidance, clear completed/available states and understandable completion rewards. Preserve visited-only fast travel and never reveal unseen secret coordinates.
4. **Challenge progression:** give creature roles meaningful situations in travel/roamers/crypt without hard-locking starter-only paths; expand enemy composition/AI variations where useful, not raw HP padding.
5. **Economy loops:** investigate tonics, seals, relics and echoes earned/spent on representative legitimate runs, including no-purchase and capture-heavy policies; tune sinks/rewards to avoid both starvation and meaningless abundance.
6. **Optional chapter onboarding:** direct players from the conclusion to the postgame's first accessible lead and give differentiated voluntary reasons to explore the two extra regions, preserving all current branches.
7. **Navigation and accessibility:** verify compass/Atlas tracking, waypoint changes, mobile touch targets, focus recovery, transition loading and save/reload. No fast-travel bypass of story or exploration gates.

**Primary modules:** \`src/world/{encounters,field-journal,discovery}.ts\`, \`src/world.ts\`, \`src/expeditions/expedition.ts\`, \`src/dungeons/\`, \`src/rpg.ts\`, \`src/story-navigation.ts\`, \`src/main.ts\`.

**Acceptance:** pathfinding/reward state over at least 200 saved seeds, all 7 regions accessible in correct story order, all objectives and optional endings reachable; no unrecoverable resource-starvation/dead-end from valid choices; offline save/reload and two-slot cross-tab conflict cases survive. Independent physical-mobile exploration (W4) remains an external acceptance requirement.

## 7. Epic D — Integrated presentation, balance, performance and commercial polish (FOURTH)

**Outcome:** the repaired gameplay is understandable and production-stable without degrading what the player already likes.

1. **Playable UI polish:** standardize objective/reward/result hierarchy in team, Codex, Chronicle, region journal and battle menu. Test desktop keyboard, gamepad and actual touch. Provide contextual help without tutorial walls.
2. **Combat presentation:** telegraph dangerous turns and meaningful elemental/status outcomes across ASCII and Glyph Pixel Art/WebGL2/Canvas2D; maintain reduced-motion and screen-reader equivalents. Compare expected and actual combat previews.
3. **Visual acceptance preparation:** preserve existing art direction and silhouettes; curate before/after scene screenshots in required biomes/combats and both modes at PC/mobile viewports for independent G2 review. Avoid gratuitous total visual overhaul.
4. **Audio completion:** preserve bounded score mixer. Inventory every scene/boss motif, loudness/peak transitions and asset provenance; finish/fix theme coverage and mastering deficiencies if found; run independent expert listening for A2/A4 and physical-device transition testing for A3.
5. **Android release engineering:** profile actual worst-case scenes and refine frame budget, fallback, input latency, rotation, fullscreen, PWA offline/update and save integrity; follow \`docs/ANDROID_RELEASE_ACCEPTANCE.md\`, with named physical minimum phone and measured thermal/battery results before G4/U2/A3 are eligible.
6. **Hardening:** eliminate new high/critical defects, add no network telemetry, guard corrupted legacy input, preserve 3-slot backup safety and run long-play reload/endurance cases.
7. **Release UX:** ensure README/version displayed in game, package version, service worker cache namespace, compiled modules, standalone build and Pages source provenance agree for the final playable release. No source/provenance claims without CI and external boot evidence.

## 8. Epic E — Actual human acceptance and gate closure (NOT replaceable by CI)

Use the existing source-pinned \`tools/acceptance-evidence.mjs\` and the human-device protocol as evidence intake, **not as a certification engine**.

**C4 (5.00 weighted points):** at least 20 *externally observed completed combat sessions* across three starters, real tactical diversity and no critical progression trap, explicit independent tuning signoff.

**N4 (5.00):** independent unfamiliar-player narrative clarity/coherence/pacing/ending evaluation, after the rewritten chapter and choice consequences.

**P4 (2.50):** independent economy/collection/relic/move-pacing observations and approval; a tester's real opportunity to ignore or use recruitment must be measured.

**W4 (3.75):** at least 200 seeded traversal cases plus independently observed physical mobile wayfinding/navigation tasks.

**G2 (2.50):** independent visual acceptance of screenshot and mobile legibility across representative biomes/profiles.

**G4 (2.50) and U2 (2.50):** minimum named Android hardware, sustained >=30FPS + battery/thermal evidence and full touch/rotation/fullscreen/offline flow.

**U4 (2.50):** independent task-based desktop/mobile usability observations.

**A2 (1.25), A3 (1.25), A4 (1.25):** mastered music review, dynamic mixing/device evidence and independent accessible sound quality approval.

**Q4 (2.50):** complete public source-pinned client boot, main CI/Pages provenance, zero open high/critical defects, required real-world reviews and all 16 externally rated quality domains >=4/5 with >=4.5/5 overall average.

**80% threshold is conditional, not forecasted:** from 67.50%, accepting C4 (+5.00), N4 (+5.00) and P4 (+2.50) would yield **80.00%**. Those gates cannot be marked done by this owner-only playtest, code changes, synthetic simulations, generated screenshots or future intentions. Other combinations are possible; never optimize the roadmap score over actual experience.

## 9. One coordinated implementation program, executed in macro-deliveries

| Delivery | Dependency | Complete integrated scope | Exit condition |
|---|---|---|---|
| **M0: baseline + design lock** | current release | document user journey, battle/collection economy, chapter beats, current metrics; identify actual causes, freeze acceptance matrices | reproducer/telemetry-free baseline, explicit design changes, save compatibility and test coverage mapped |
| **M1: valuable companions & decisions** | M0 | Epic A all seven components; team/Codex/combat/rewards/AI wiring, balancing, regression | new gameplay demonstrably benefits from varied recruits; all 3-starter legitimate routes pass; save v1 and 4 graphics/backend modes pass |
| **M2: emotionally coherent pilgrimage** | M1 role/quest contracts | Epic B all seven components; earned narrative outcomes, bonds, player-facing story flow, optional aftermath | all four trilogy endings, both afterlight epilogues, persistence and spoiler/UX gates pass |
| **M3: rewarding connected world** | M1+M2 | Epic C seven components; challenge distribution, finite rewards, route pacing and postgame induction | >=200 seed/path tests, no soft locks, valid resources, 7-region full journey pass |
| **M4: premium stabilization** | M1–M3 | Epic D, 4 render/backend acceptance flows, offline standalone/PWA, Android/candidate release preparation and independent review assets | complete CI, realistic real-device evidence, reproducible no-high-defect release candidate |
| **M5: external acceptance + release** | M4 + access to testers/device | Epic E; independently observed C4/N4/P4/W4/G2/G4/U2/U4/A2/A3/A4/Q4 signoffs, defect correction, exact-source Pages deployment and public-client smoke | each atomic accepted gate backed by actual documented evidence; percentage recomputed ONLY from accepted checks |

**Delivery rules:** one cohesive macro-delivery per execution; complete code + data + UI + docs + unit/integration/E2E + publication when accepted. Do not stop after one feature. Do not rewrite existing whole systems merely to claim volume. Build in a feature branch, run PR CI, merge only on PASS, verify main and Pages commit identity, and record source SHA. If PR evidence is not green, do not publish it as finished.

## 10. Required regression/evidence matrix for every code-changing delivery

1. **Build:** Node 22; \`npm run verify\` (TypeScript, standalone, all Node tests, release audit). The baseline before this plan is 388/388 CI tests; increases do not themselves count as quality outcomes.
2. **Core campaigns:** 50 seeds × 3 starters × 2 existing combat policies = 150 scripted complete playthroughs and 450 chapter reloads, plus the fixed 12 genuine full-branch trilogy trajectories and both earned Afterlight paths. Each tests real commands, not injected victory flags.
3. **Gameplay invariants:** active/repertoire move limit, combat status order, heal cast limit, unique rewards, relic ownership, bonded paths, economy ceilings, death/permanent crypt protection, finite flag capacity and save-v1 compatibility/import/conflict safety.
4. **World:** >=200 saved seeds, all required and optional objectives reachable, fog/known target truth, idempotent travel/rewards and no stranded portal.
5. **Presentation:** ASCII/Glyph Pixel Art × WebGL2/Canvas2D real Chromium; mobile portrait and landscape with synthetic touch as automation **only**, no claim of physical Android verification; generated screenshots/audio transition logs.
6. **Field acceptance:** test on specified physical Android hardware, at least 30-minute mixed session with independent FPS profiler and real battery/heat data; external unfamiliar players for combat/story/progression/navigation, original code SHA attached to every record.
7. **Publishing:** exact-source PR and main checks, verified GitHub Pages workflow, distribution \`build-info.json.source_commit\` match, independent public URL boot, no high/critical defects.

## 11. Risk controls and prioritization

- **Largest design risk:** a mechanical feature can be technically correct but add no motivation. Validate user-observed choices, not merely counts of moves/items/NPC dialogue.
- **Balance risk:** a buff can make one starter, technique, bond or relic strictly dominant. Build cross-starter and strategy comparison gates before tuning and check every choice combination.
- **Narrative risk:** rewriting too much can break established canon, saved flags, chronology and branches. Use continuity maps and derived read-only story presentation.
- **Progression risk:** new rewards can cause resource inflation, make capture mandatory, or starve no-capture runs. Separate essential and optional progression, validate both.
- **Runtime risk:** \`src/main.ts\` is large and tightly integrated. Extract pure rules conservatively; avoid simultaneously refactoring UI, state and persistence unless a direct quality/ROI reason exists.
- **Save risk:** do not change existing IDs or v1 semantics in-place, exceed flag limits or compromise transactional storage/backup/conflict rules.
- **Acceptance risk:** developer-owner reviews are valuable internal signals but not independent signoff. Report technical completion separately from milestone score.
- **Scope guard:** no new geographic region or total rendering overhaul until Epic A/B/C real player-value defects are corrected and tested.

## 12. Decision and immediate next action

**Commit to M0+M1 first as the largest coherent game-development iteration**, with a locked end-to-end result: *the creature you discover changes a battle decision, the reward is understandable and worthwhile, and the game visibly recognizes that progress.* M2 and M3 follow under this same plan, not a new brainstorming cycle. Run structured external playtesting as soon as a releasable build exists rather than waiting until the last delivery. Do not claim 80% or a premium-quality release on implementation alone.

**Status at creation:** PLAN COMPLETE; IMPLEMENTATION NOT STARTED HERE; accepted progress remains **67.50%**.


## v0.63 — Tactical-choice guidance integrated

The battle-decision subset of Epic A is implemented as pure read-only combat planning and integrated into accessible player controls. It addresses active tactical value and a concrete recruit-first opportunity without new species, inflated grind, or schema changes. See `docs/RELEASE_v0.63.0.md`. Other qualitative Epic A acceptance remains independent and OPEN.
