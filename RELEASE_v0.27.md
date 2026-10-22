# ASCII AZUR v0.27 — Trail respite

**Player problem:** even with first-victory XP, three intended first encounters may exhaust health and force a detour to a distant campfire after every battle.

**Integrated gameplay rule:** on a **first win** versus a persistent visible forest/sanctuary encounter, all currently conscious team members regain `ceil(maxHp × 0.25)`, capped to full HP, after XP/evolution calculations. Fainted members stay at zero. The same one-time `roamer-*` save flag used for v0.26 XP gates this reward. Capture gives no recovery. Random/duel/crypt/expedition/boss encounters and repeats give no recovery. No schema migration, new item currency or unbounded farming loop.

**Acceptance:** TypeScript build and Node regression suite with pure and runtime tests; first-win persistence, no replay heal, no random heal; scripted real-action first forest battle per starter; PWA dependency/version audit; source and GitHub Pages provenance. These tests are not a complete playthrough, physical Android measurement or subjective player validation.

**Quality:** 16-domain average remains 2.5/5 pending independent feedback and complete campaign work.
