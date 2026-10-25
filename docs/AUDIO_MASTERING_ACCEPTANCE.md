# A2 — Original scene music and mastering acceptance (v0.60)

## Scope
A2 requires original mastered music for all current scenes and the boss finale. It is separate from A3 physical device transitions, A4 independent listening and Q4 commercial release.
All tracks are original synthesized scores: no licensed third-party samples, network fetching, or proprietary plugin.

## Ten original score identities
| Scene | Theme |
|---|---|
| title | The Last Name / prologue |
| village | Iria Remembers / Arken |
| forest | Names in the Roots / ashwood |
| sanctuary | The First Word / oath |
| marsh | Lives Never Born / Nael |
| spire | The Unwritten Sky / Oriel |
| ossuary | Tide of Forgotten Voices / Edda |
| garden | A Spring Without Orders / Silas |
| battle | Against Oblivion / encounter |
| boss | The Nullscribe / finale |

Each track has eight original 16-step phrases: A1/A2/A3/A4, B1/B2/B3, CODA. Each has a hand-authored B melody and four-step ending; the runtime and offline renderer use the same pure phrase projection.

## Objective acceptance
Run npm run verify. This builds all 10 uncompressed WAV reference mixes, tests them and writes artifacts/score-master/manifest.json with deterministic SHA-256 fingerprints. Every track must be distinct, non-silent, show A/B/coda structure, have zero clipped samples, RMS between -31 and -16 dBFS, a four-times linearly interpolated peak no greater than -1.5 dBFS, and DC mean below 0.006. Mastering applies DC blocking, attack/release compression, normalization and a peak ceiling.
These are RMS and interpolated sample peaks, NOT LUFS or standards-defined reconstruction true peak. The offline reference approximates Web Audio instruments; the game also has ambience, echo, FX ducking and a runtime master compressor.
CI retains all ten listening WAVs and the source-pinned manifest as artifact ascii-azur-original-mastered-score for 30 days. Verify success must include complete gameplay tests and four Chromium graphics/backends. After merge, main and Pages must be green, with matching gh-pages/build-info.json.source_commit. Only then may A2 close.

Real hardware thermal/battery/audio transitions and independent expert listening have not been supplied. A3, A4 and Q4 remain OPEN.
