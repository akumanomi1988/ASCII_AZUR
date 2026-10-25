# ASCII AZUR v0.56.0 — Tactical creature identity & meaningful team decisions

M1 development epic, from docs/PLAYER_EXPERIENCE_REPAIR_MASTER_PLAN.md.

## Delivered product changes

1. **Visible tactical identity** — team and Codex-preparation surfaces explain creature role and the actually equipped attack/status/heal/cleanse/drain toolkit. No invented elemental advantages.
2. **Contextual boss matchup planning** — the next earned story boss is assessed with the actual party; forecast compares bounded damage from equipped moves, current HP and exposure to a normal enemy hit. Recommendations are explicitly estimates, not auto-winning tactics.
3. **Useful team rotation** — switching to a conscious ally spends a turn and protects the incoming ally from the next enemy attack using the existing GUARDIA reduction (55%). It does not grant a free attack or change the battle checkpoint schema. The battle selector explains the tradeoff.
4. **Meaningful technique decisions** — the loadout screen highlights a real unlocked offensive alternative against the next earned boss when it improves damage. Equipping still follows the established one-attack-minimum and four-slot rules.
5. **Meaningful relic decisions** — available, *free* copies are evaluated against actual enemy damage/defence. No cloning of equipped relics, no automatic purchases and no fabricated future combat gain.
6. **Capture feedback** — before binding and after a successful capture, players can see whether an enemy introduces a missing elemental counter/creature role and what its elemental matchup offers. No new currencies or reward inflation.
7. **Regression and packaging** — deterministic pure and DOM/runtime tests, battle checkpoint/turn protections, TypeScript, pre-existing 150 full scripted campaigns and 450 reloads, seven-zone acceptance, four browser render/backend modes, portrait/landscape synthetic touch, package/standalone/PWA source audit and Pages provenance.

## Game design invariants

- Existing save-v1 schema, flags, species/move/relic IDs, evolution, crypt permanent mortality and all 4 narrative endings unchanged.
- Guard-on-swap consumes exactly one command, applies to the *incoming* combatant once, and is cleared by enemy response; no repeated free shielding or infinite stall advantage.
- Opponent advice is deterministic, read-only, computed from existing combat data. The 55% guard does not claim to protect from scorch, which resolves separately.
- All display/hints are accessible through existing modal controls and browser interfaces. No server analytics or personal data processing.
- The public game remains usable offline with version-pinned service-worker modules and a regenerated standalone package.

## Acceptance and release

Engineering acceptance needs PR and main CI green, zero new TS errors, automated scripted campaigns, real-browser modes, Pages matching exact main source SHA. Independent C4/P4 design quality requires unfamiliar-player validation, so no milestone can be closed on code or internal playtesting alone.

The weighted fixed-roadmap baseline remains **20/32, 67.50%**, even if all technical gates pass. Continue M2 narrative significance and M3 exploration/quest reward value, then run complete independent external acceptance.
