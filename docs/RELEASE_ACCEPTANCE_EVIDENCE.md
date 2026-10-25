# ASCII AZUR — release acceptance evidence intake (v0.56 candidate)

This is a deterministic **offline verification aid**, not a test-execution service or a tool for signing off roadmap milestones. The source of truth for gate criteria remains docs/AAA_ROADMAP.md and docs/ANDROID_RELEASE_ACCEPTANCE.md. **All 12 open milestones stay OPEN** until evidence is independently inspected and explicitly accepted. A green GitHub Actions job, test fixture or manually declared JSON field cannot substitute for a real phone, human tester, independent visual/audio reviewer or live public boot.

## Scope delivered

1. Source-pinned acceptance manifest: exact 40-character release Git SHA, distribution source SHA and observed public boot provenance. Mismatches fail closed.
2. Bounded mobile hardware intake: model, OS/browser, actual device declaration, profiler, minimum 30-minute / 10-minute-per-phase session, 30 FPS, heat/battery measurements, warm-repeat and Canvas2D/WebGL2 check.
3. Independent playtesting records with unique session IDs, three starters across at least 20 complete externally observed combat sessions, mobile navigation, narrative/collection pacing and usability on desktop/mobile, with 200-seed coverage evidence.
4. Distinct expert review placeholders for silhouettes/visuals, mastered music, dynamic device mixing and accessible sound.
5. Sixteen named independent quality dimensions with >=4/5 each and >=4.5/5 average; open critical/high defects block final release readiness.
6. JSON report with explicit missing requirements for C4/W4/N4/P4/G2/G4/U2/U4/A2/A3/A4/Q4, zero automatic accepted milestones and a strong provenance/unauthenticated-input disclaimer.
7. Thirteen deterministic Node tests, executed by the existing npm test glob and main/PR GitHub Actions quality gate. Includes missing, malformed, counterfeit, mixed-source, fake-device, threshold and CLI scenarios.

## Collect and assess

Run from the repository root:

- node tools/acceptance-evidence.mjs --template > local-acceptance.json
- Fill it **only using genuinely observed and consented external evidence**, recording the exact source SHA of the build on the device, never invented evidence.
- node tools/acceptance-evidence.mjs --input local-acceptance.json --source EXPECTED_SOURCE_SHA --output local-acceptance-report.json

Manifests/reports are **local**, not bundled with the game or sent remotely. Do not commit personal/device-owner data, screenshots or raw player records. Use anonymous observer codes and attach independently stored artifacts only with consent. The CLI limits the input to 2 MB, 2,000 session observations and 200 defects; it stores no identity itself.

The provided template intentionally contains zero sessions, no device and no quality ratings. Review signatures are declarations, not cryptographic signatures. The validator can check arithmetic, structure and consistency, but **cannot confirm real-world authenticity**, hardware measurements, fairness of samples, human consent or subjective quality. Report status EVIDENCE_READY_FOR_INDEPENDENT_VERIFICATION means **candidate for an external reviewer to verify**, never accepted or shipped.

For public release acceptance the reviewer must separately inspect actual Android logs, source SHA on both GitHub Pages and device, real public HTTP/browser boot, each tester's consent and observations, measured hardware acceptance and resolved high/critical defects. Only then may the existing roadmap owner change an atomic milestone with its independent supporting evidence. The unchanged official baseline is 20/32, weighted 67.50%.

## Non-goals and external dependencies

The connector and cloud CI cannot perform physical Android battery/thermal FPS testing, independently operate a human playtest or certify mastered sound/visual quality. This tool does not request network permissions, update save-v1, introduce telemetry, automatically open GitHub issues or alter the fixed acceptance thresholds.
