# ASCII AZUR v0.29.0 — Broken Mirror Marsh

## Narrative chapter II
- Unique fourth 46×32 seeded region, the Broken Mirror Marsh. Persistent scenery, distinctive teal/drowned-light art direction, fog/rain and a procedurally composed Marsh soundscape.
- Authorized continuation after completing the original Arken arc; sanctuary's old western portal unchanged and new east gate remains locked until the Archivist acknowledges both relics.
- Nael, the Cartographer of Oblivion, provides a two-memory investigation and three persistent seeded roaming challenges. First victory or capture clears a testifier using the original combat save architecture.
- The Tribunal offers an irreversible **preserve** vs **release** fork with different inventory reward profiles, stateful dialogue and a separate Nael epilogue. Both choices and reward claims are idempotent.
- Chapter diary, objective compass and HUD react to actual flags; visual quest landmarks are in both renderers.

## Data and compatibility
- No save format bump. v1 frozen three-zone snapshots retain exact original terrain/POIs; a deterministic Marsh is generated when an old snapshot is first loaded. Fresh snapshots include four zones. Newly introduced flags are optional.
- All 12 original creature species remain unchanged. Three authored marsh encounter slots reuse existing species with different levels/variants; an expanded creature roster is a separate future milestone.
- Offline cache v029-q01 and compiled standalone package include story-marsh.js. Source assets only.

## Test scope and remaining limitations
- Tests cover 200 procedural seeds including the fourth zone, legacy snapshot compatibility and an isolated Chapter II gameplay scenario across 18 combinations (2 outcomes × 3 initial starters × 3 seeds) using ordinary combat commands and save/reload assertions. The state immediately after Chapter I is a validated fixture, not a substituted full human playthrough.
- Main Chromium, Pages provenance and public HTTP smoke to be recorded in evolution state only on actual successful workflow results.
- Global campaign climax, commercial AAA quality, real Android battery/FPS and independently evaluated player enjoyment remain incomplete.
