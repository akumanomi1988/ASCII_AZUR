# ASCII AZUR v0.26 — The trails remember

**Target deficiency:** repeated random fighting dominates early progression compared with exploration. The previous automated Arken route trained through 18 wild battles; that is evidence of an expensive route, not a validated minimum.

**Gameplay change:** first victory against each persistent visible trail encounter gives 48 bonus XP, plus standard level-based battle XP. Shared party XP (100% active, 50% each conscious companion) remains. Capture removes the encounter in exchange for the new creature and awards no bonus. A re-fight cannot collect the bonus again; a v1 save uses its existing `roamer-*` flags. Random encounters, crypt sentinels, expedition battles and Hollowhart have unchanged XP.

**Numerical design rationale:** the three visible forest encounters are levels 5, 6, 7: base XP = 26+29+32 and first-win bonus = 3×48, total **231 XP**. Raising a level-5 starter to level 8 needs **216 XP** using existing level thresholds. This is a theoretical progression path, not a guarantee of victory or balanced enjoyment.

**Acceptance:** three-starter threshold tests; first-win flags/boss/random-exclusion tests; a runtime battle test with real attack actions and one-time payout; full Node test suite and TS build; offline/PWA audit; matching source/Pages provenance. Physical Android and independent playtesting remain outstanding.
