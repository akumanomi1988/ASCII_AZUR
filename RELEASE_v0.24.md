# ASCII AZUR v0.24 — The Guardian's Warning

**Player-facing improvement:** Hollowhart now warns underprepared players, highlights party size, level 8, recovery and the charged-attack guard mechanic, and provides accessible proceed/retreat actions. Battle remains available at any level; no save schema or combat calculations change.

**Evidence:** deterministic test performs wild training and genuine creature capture, boss and sentinel turns through `useMove`, `defend`, `tonic`, and scheduled opponent actions, actual traversable crypt and one-time story finale. No `winBattle()` calls, invented HP, forced quest flags, or manually granted XP. Earlier v0.23 tests shortcut the combat outcome; both types remain explicitly distinguished.

**Open:** other seeds and starts, independent full human playthrough, global campaign, live site browser and Android GPU testing. Experimental scripted testing is not proof of commercial quality.
