# ASCII AZUR v0.38.0 — Walkable Afterlight Wayfinding

## Purpose

Close the technical navigation gap in the two postgame Afterlight chapters without altering deterministic world generation, save schema, collision physics, or story progression. This is the machine-verifiable part of roadmap W4, not independent human/mobile acceptance.

## Player-facing changes

- Ossuary and Garden quest compass directions follow traversable cardinal waypoints instead of straight-line arrows through obstacles.
- Targets include authored NPCs, memories, persistent witnesses, decisions, and post-chapter objectives.
- Shared guidance returns an interaction cue when the player is within reach; inaccessible routes show a diagnostic rather than a misleading arrow.
- The same world-footprint collision rules are used for route computation and actual movement.

## Engineering

- `guidanceToTarget` is a reusable, read-only route interface in `src/story-navigation.ts`.
- The world-revision-keyed walkability cache avoids repeating expensive footprint/collision checks for every target. It is invalidated on each world regeneration or save-snapshot restore.
- Both WebGL2 and Canvas2D consume the same HUD/navigation state; no rendering backend divergence.
- Existing version-1 save snapshots remain untouched.

## Verification

- Feature PR: https://github.com/akumanomi1988/ASCII_AZUR/pull/16
- Feature head at first complete optimized acceptance: `5b44bed8f1dd66039b1639ccf648e41112a75a59`
- CI run: https://github.com/akumanomi1988/ASCII_AZUR/actions/runs/39972029347 — **SUCCESS** (TypeScript, Node tests, browser mode/backend acceptance, standalone/release and offline-cache audit).
- The new Node regression traverses the actual `sweepMove` physics to every landmark and visible roamer in all seven regions across 200 deterministic seeded worlds. It checks adjacent waypoints, collision-free moves and completed arrival, rather than mere straight-line distance.

## Unclosed quality gates

- W4 requires unaided human wayfinding and physical Android traversal testing; automated seeded movement alone cannot close it.
- G2 visual quality, G4 physical device FPS, U2/U4 real user/device acceptance, and Q4 release signoff remain open.
- The weighted milestone progress remains **18/32, 62.50%**. No subjective premium quality score is increased by this technical patch.

## Publication acceptance

At document creation, feature CI is green. Main merge, Pages source provenance and independent public smoke are separate steps and must be recorded only after verification.
