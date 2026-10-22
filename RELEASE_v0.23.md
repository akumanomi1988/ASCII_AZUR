# ASCII AZUR v0.23 — Traversable Crypt

Critical progression repair: crypt collision now samples characters around tile centres. Previously some one-tile corridors were blocked by the footprint check even though the procedural layout was connected. Existing world seeds, graphics, combat, save schema, loot and story remain unchanged.

Verification: 150 generated crypts physically traversed via the swept movement engine to every authored event and back. A runtime scenario reaches the Arken finale after spatial crypt traversal (boss and sentinel victories are controlled by the existing victory handler, not a natural human battle). The test suite uses a two-worker concurrency limit to avoid local/CI oversubscription.

Open gates: physical Android/WebGL2 FPS, complete natural campaign playthrough, independent player quality validation, and live public-origin browser smoke.
