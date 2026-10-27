# ASCII AZUR v0.68.0 — A World Written in Ash

## Player experience

A **new journey** now passes through a full **120-second, ten-scene** in-engine cinematic before the existing starter selection and first Arken dialogues. Each scene is 12 seconds and has its own subtitle, art palette, glyph silhouette and world-building beat.

The prologue establishes the original story's stakes without prematurely revealing late-region antagonists or resolutions: Azur was shaped by remembered names; creatures of fire, mist and root share the world; a spreading silence erases people and places; Lumbres and bonds help memories endure; an Archivist in Arken needs someone willing to listen.

The presentation is original CSS/glyph art layered inside the existing viewport—starfield, celestial bodies, mountain silhouettes, embers, mist, rune and color-shifted biomes—with the existing title music. This is a scripted animated introduction, **not** prerecorded 2-minute video, cinematic voice acting, a new art-asset pack or a replacement for the game's renderer.

## Input and save behavior

- **Start new journey:** respects the existing occupied-slot confirmation and custom world seed; a new save is **not written** until the starter has been chosen. The default run is 2:00 of foreground playback.
- **Next scene:** jump to the next 12-second beat; final scene continues directly to starter selection.
- **Skip intro:** proceed immediately to starter selection; applies on the first and later new games.
- **Back / Escape:** return to title without replacing an existing save or choosing a creature.
- **View prologue:** replay from the title menu without starting or saving a journey; finish and skip return to title.
- **Keyboard:** Tab is trapped within the active modal's three controls, ArrowRight advances and Enter/Space operate focused buttons; all controls have touch targets. Spoken screen-reader announcements are complemented by always-visible subtitles.
- **Reduced motion:** all cinematic animations and transitions are suppressed by `prefers-reduced-motion` while text and advance/skip actions remain available.
- **Background tabs:** playback does not advance while the document is hidden. Clock restarts from the visible frame, avoiding surprise auto-completion after task switching.

## Delivery and regression gates

- `src/ui/opening-cinematic.ts`: pure 120-second scene timings and isolated DOM rAF lifecycle.
- `index.html` / `style.css`: responsive viewport staging for desktop, narrow Chrome, Android portrait/landscape, reduced motion and high contrast.
- `src/main.ts`: new game / replay integration before starter selection; save-v1, the three campaign slots and existing opening dialogues are unchanged.
- `sw.js`: release cache identity `ascii-azur-v068-q1`, compiled `dist/ui/opening-cinematic.js` included for offline PWA and APK bundle staging.
- `tests/opening-cinematic.test.mjs`: exact duration, all boundaries, authored completeness and spoiler-safe story scope.
- Browser, mobile viewport, Android native APK, Android Chrome emulator and live-site smoke harnesses now explicitly exercise the cinematic and skip path instead of assuming an immediate starter selection.

## Remaining acceptance

GitHub Actions must compile and exercise the relevant QA jobs before merging to `main`. The two-minute visual/narrative pacing and quality still require independent human evaluation; Android low-end frame stability, audio approval and physical-device touch acceptance remain unverified.

**Roadmap weight:** this feature is an experience addition, not independent sign-off for any pre-existing commercial acceptance gate; the previously frozen measure remains **21/32 = 68.75%** until accepted separately.
