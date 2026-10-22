# ASCII AZUR v0.25 — A party worth keeping

**Gameplay deficiency:** only the creature that finished a battle gained XP, forcing individually repetitive grinding and discouraging early captures.

**Change:** full XP to the active ally, floor(50%) to every non-fainted party companion, no XP to defeated members or stored reserves. Uses existing `gainExp` rules, including level milestones and species evolution; evolution cues can show a progressing companion. Battle messages identify the shared reward. Single-ally XP and old saves remain unchanged.

**Acceptance conditions:** TypeScript strict compilation; solo, bench, fainted, reserve and evolution regression tests; runtime win payout; all existing Node tests; offline asset audit; public deployment provenance. Independent balance/player tests and Android GPU FPS remain pending.