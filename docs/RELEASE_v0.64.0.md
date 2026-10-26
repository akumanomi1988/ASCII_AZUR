# v0.64.0 — Tactical research and collection milestone

## Player-facing functionality
- The 3 / 7 / 12 / 17 unique-species research thresholds grant respectively Hearth Bead, Root Knot, Echo Prism and Pilgrim Ward as real usable relics, alongside original Echo, seal and tonic rewards.
- Relic rewards are one-time, voluntary and cap-safe; if the preferred one is full, a deterministic free relic is granted. A fully stocked player may complete the one-time tier with the existing payout.
- Codex offers a seen-but-uncaught wild species in a known, active habitat, without revealing undiscovered identities or locked chapter-specific wild populations. It links to the existing field journal.
- The claim flow synchronizes granted relics into the live save and restores resource flags, currencies and relic inventory if the durable save transaction fails.
- Existing version-one saves, story/creature IDs, no-telemetry policy and region count are unchanged.

## Offline and build integrity
- Package and title version 0.64.0, service worker cache ascii-azur-v064-q1 and query release 0640 are advanced together. Offline assets therefore cannot mix old and new ESM module graphs.
- New Node and runtime/continue tests cover stock caps, claim idempotence, new-player Codex path, chapter availability and persistence.
- Validate feature PR with full TypeScript/Node, standalone/PWA, four browser combinations and Android emulators API 30/35. Merge only on green CI; main CI and public smoke are separate post-merge requirements.

## Acceptance accounting
- Locked global roadmap: 21/32 accepted milestones, weighted 68.75%. No milestone is newly closed by this technical change.
- P4 independent collection/pacing approval, human balance and narrative reviews, physical Android performance/usability and commercial release evidence remain outstanding.
