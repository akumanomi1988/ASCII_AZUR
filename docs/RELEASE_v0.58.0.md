# ASCII AZUR v0.58.0 — M3: Explore for a reason

M3 is the third gameplay repair epic in the frozen PLAYER_EXPERIENCE_REPAIR_MASTER_PLAN.

Implemented:
- Seven differentiated, stage-gated regional field briefs and purpose-driven landmark lore, including finite reward transparency and distinct optional Afterlight leads. No future region coordinates or secret locations are exposed.
- Eighteen seed-aware authored witness clues, elemental counter guidance from the real enemy species and persistent conclusion summaries after victory or capture. The late-game Ossuary and Garden witnesses now grant 112 one-time bonus XP rather than requiring random wild grinding; all earlier regions retain their established 48 XP first-clear bonus.
- One-click spoiler-safe lead suggestion limited to actually discovered, actionable, unfinished regional objectives; reuses the existing v1 field-target transaction, save conflict handling and compass.
- Adaptive wild-encounter pacing: a roll occurs only once per 6–12 traversed tiles **even on a failed attempt**; lower repeat frequency after all three persistent witnesses and after survey completion; the two optional Afterlight chapters suppress *random* travel encounters until each authored chapter ends, retaining their visible one-time witnesses and manual battles; wild travel resumes after completion.
- Distinct physical site context on chest, Lumbre, memory, NPC, guardian and verdict entries; quests and surveys retain the same finite rewards and region order.
- Existing postgame pilgrimage is explicitly labeled optional and readable in the field journal after actual earned main-ending and Ossuary progress.
- Automated deterministic tests: 200 saved seeds, 1400 zone inspections, fog safety, witness variety, no-save-mutation, pacing, E2E journal interactions and existing campaign matrix.

Preserved: all save-v1 flags, world snapshots, starting species, branching decisions, no-capture viability, visited-only fast travel and finite economy. 
Engineering gates: npm run verify, 150 simulated campaigns and 450 reloads, browser acceptance in 4 render/backend combinations plus synthetic touch, PWA cache graph and exact-source Pages release.
External W4 requires physical mobile navigation observation; internal automated verification cannot close it. Roadmap remains 20/32, 67.50% weighted.
