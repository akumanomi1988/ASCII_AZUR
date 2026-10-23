# ASCII AZUR v0.35 — G3 Complete Combat Choreography

## Scope

This is the full G3 roadmap milestone: a coherent battle presentation language across all tactical verbs, creature rigs, render backends and input modes. It is not a cosmetic-only hotfix.

### Player-facing improvements
- Six deliberately distinct motion sequences: attack, guard, healing, creature switching, binding seals and fainting.
- Family-specific attack signatures and seventeen original creature rigs now react differently to attacking, taking damage, defeat and evolution.
- Readable impact feedback: damage values, efficacy calls, shielding geometry, restoration runes, seal trajectories, portal-like switch rings and a final defeat dissolve.
- The effects run in the same source scene used by Atmospheric ASCII and Glyph Pixel Art, then pass through Canvas2D or WebGL2.
- Reduced-motion presentation removes shaking, translations and unnecessary particles while retaining information about the action.
- Defeat choreography is sequenced after a resolved combat result; checkpoint state still prevents replaying a turn during save/reload.

### Verification contract
- TypeScript production compilation.
- Pure deterministic choreography tests for every action, timeline and creature.
- Full existing game, save, encounter, ending, offline-cache and release regression suite.
- Chromium acceptance in both graphic modes and both render backends, including a saved battle rehydration, move input and VFX screenshot.
- Merge to `main`, GitHub Actions/Pages success, build-info provenance and public smoke check.

### Remaining outside G3
Hardware FPS and battery performance (G4), physical Android interaction (U2), external art/animation review and independent playtesting remain open. Passing G3 does not mean the game is premium-release complete.
