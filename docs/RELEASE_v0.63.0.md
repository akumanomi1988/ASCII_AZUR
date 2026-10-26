# v0.63.0 — Meaningful tactical decisions and recruit-first combat guidance

## Cohesive scope
1. **Capture-first discovery:** when a previously unowned wild companion is sufficiently weakened, has at least 68% estimated capture probability, an available seal and party/storage space, the read-only advisor prioritizes recruitment over a lethal attack. Bosses, already owned species and full storage never receive this prompt.
2. **Lethality, charge and defense:** estimates use the minimum live attack roll, bond damage, actual enemy tactical selection and boss-phase multipliers. An imminent charged Eclipse still advises guard unless a genuinely lethal attack is available. Tonic/skill-healing suggestions require an estimated survival benefit.
3. **Protected team changes:** when the active creature risks defeat, the adviser considers living equipped backups, their offensive move damage and 55% switching guard. It identifies the specific index, never initiates a swap or changes state.
4. **Distinct skill incentives:** suggest offensive cleansing of persistent afflictions, life drain while injured, and probabilistic status application when meaningful. Existing 3-use heal caps, moves, enemy AI, damage and status chances are unchanged.
5. **UX, accessibility and offline:** localized actionable battle advice now labels capture, swap, guard, tonic and moves. Enabled recommended controls in the real battle grid gain a visible, keyboard-focusable highlight; no auto-selection, new network requests, new rewards, or save-v1 migration.
6. **Deterministic regression:** new tests exercise starter/boss counterplay, novel-versus-owned wild capture, no-room/no-seal refusal, lethal and charge ordering, reserves, status redundancy, unavailable healing and DOM/CSS wiring. Existing unit, uninterrupted-campaign, browser and Android-emulator gates still apply.

## Publication and external blockers
The source must pass feature-branch GitHub Actions (TypeScript, Node regressions, standalone/PWA packaging, Chromium modes, synthetic mobile and emulators API 30/35) before any merge. Main CI, gh-pages source identity, and public smoke require separate post-merge observation. This iteration does **not** close C4 or P4 external balance/pacing acceptance or G4/U2/A3/Q4 device and human gates. The frozen baseline remains **21/32 milestones, weighted 68.75%**. Only genuinely recorded independent results may change it.

## Design limits
Battle suggestions are advisory heuristics, not authoritative simulators of random outcomes. Actual combat, consumable costs, counterattacks and capture outcomes continue to execute in the original battle controller. No player data or gameplay telemetry is transmitted.
