# ASCII AZUR v0.31.1 — The Memory Safeguard

A reliability patch for long-running trilogy saves.

- A tab that loaded an older save can no longer silently overwrite a newer primary save after another tab has progressed. Instead, the player sees a conflict warning and can export their unsaved journey before reloading.
- Automatic storage/quota failures are visible in the save status and through a one-time in-game alert instead of being ignored silently.
- Confirmed JSON imports validate and persist successfully before the active journey changes. A failed import leaves the current in-memory journey intact; a successful first import write preserves the previous valid primary as backup.
- Existing version-1 saves, their recovery backup, graphics preferences and offline modules remain compatible.

Limitations: optimistic revision checks are not atomic cross-tab transactions; physical-device storage eviction, prolonged browser soak and imported-file UI acceptance remain separate release gates. CI and Pages publication must pass before this candidate is considered shipped.
