# Research-to-combat milestone — creature collection incentives

**Scope.** The four existing one-time collection milestones (3, 7, 12, 17 unique capturable species) retain their original Echo, seal and tonic rewards and add one usable, equipable relic each:
- 3: Hearth Bead (+20% healing, drain and tonic effects).
- 7: Root Knot (+12% Root attack damage).
- 12: Echo Prism (+12% Ether damage).
- 17: Pilgrim Ward (10% less direct incoming damage).

Each is awarded via the existing Codex claim, only once, and is manually equipped via Team → Relics. Existing v1 saves with prior redeemed flags are not re-granted. If the preferred relic has six copies, a deterministic alternative under the cap is awarded. If all six relic variants are at their caps, the player may still claim original resources and complete the milestone, rather than hitting an irreversible completion dead-end.

**Discoverability.** The Codex now presents an actionable seen-but-uncaught wild creature from a previously known, currently unlocked habitat. The current region is ranked first, with elemental relevance to the next campaign guardian as tie-break context. It opens the existing field journal, never invents hidden coordinates or automatically teleports the player. Wild populations suppressed before chapter completion remain excluded.

**Persistence/safety.** No new data model, format, IDs, servers, analytics or repeatable grants. Validate resource bounds, 200-flag cap and ownership before mutation. Relic stock joins the client transaction rollback for failed save writes. Full replay still uses the original capture roll, roster limits and ordinary combat commands.

**Acceptance.** TypeScript, node unit/runtime tests, scripted campaign journeys, 4-mode Chromium QA and Android-emulator CI must pass before merge. Independent P4 collection pacing and other human/device roadmap milestones remain open. Frozen weighted baseline: 21/32 accepted milestones, **68.75%**.
