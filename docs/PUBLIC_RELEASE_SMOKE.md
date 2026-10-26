# Public Pages release smoke

The GitHub Actions main pipeline first requires verified TypeScript, unit/regression, browser and Android 11/15 emulator passes. It then publishes the verified source to gh-pages. Only after that, public-smoke polls the real https://akumanomi1988.github.io/ASCII_AZUR/build-info.json (up to 36 x 10 seconds) until source_commit matches the exact 40-character main commit. It never treats a successful push, stale page or invalid provenance as a public release pass.

Before merging a PR the browser job first uses the very same script against a temporary loopback HTTP server containing the freshly built candidate and a source-matched test-only build-info.json. This real Chromium proof is NOT a public deployment claim. Only the official root can be used in post-publication CI; the alternate smoke root is restricted to 127.0.0.1.

After provenance convergence the smoke validates live HTML, stylesheet, PWA service worker, manifest and compiled render, audio and game modules. It boots an isolated genuine Chromium session and tests both desktop and mobile viewport with actual CDP browser input. Starting a game, selecting the starter, saving, reloading, continuing and absence of uncaught script errors are validated. JSON findings and screenshots are retained even on failure.

The external job is a technical public distribution check, not human playtest, a real mobile digitizer/thermal/battery test, audio quality signoff or commercial AAA certification. All real-world independent gates remain open. The official weighted progress remains 21/32 and 68.75 percent until their independent evidence is accepted.

Manual invocation on a host with Chromium and internet: SOURCE_SHA=<exact 40 character commit hash> node tools/public-release-smoke.mjs. If it fails after publication, the operator must investigate/roll back; do not claim that live Pages was verified.
