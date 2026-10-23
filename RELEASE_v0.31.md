# ASCII AZUR v0.31.0 — The Unbroken Pilgrimage

## Player-facing delivery
- New read-only 19-step trilogy Wayfarer's Roadbook integrated into the existing Diary modal: real chapter progress, objective, conscious creatures, supplies, equipped-element counterplay, healing and boss preparation advice.
- Existing save-v1, visual renderers, menu input support and service-worker remain compatible; standalone HTML and GitHub Pages include the new module.
- Chapter continuity acceptance from brand-new worlds, attempting three starters and four ending combinations (12 full sessions) with actual capture and combat actions, dungeon navigation, chapter checkpoint reload, nonduplicating rewards and all four distinct ending states.

## Validation cautions
- The automated game harness invokes established surface landmark/portal handlers directly rather than walking every outdoor tile; real crypt travel uses player movement/collision. Manual physical navigability and player-enjoyment approval remain Q4/N4/W4 gates.
- No injected boss victories, levels, completed quest flags, crypt-clear flags or Marsh/Crown decisions in continuity acceptance. Runtime battle AI uses scripted commands (not human participants).
- CI must verify outcome, Android device QA and independent public HTTP smoke remain separately pending.
