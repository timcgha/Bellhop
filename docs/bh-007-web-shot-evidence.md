# BH-007 exact-candidate evidence map

This is the compact evidence index for **Web Hero — Persistent Web Shot**. The immutable approved brief is `timcgha/product-operating-model` commit `10249d84cca7de3325118433c3623bc78df16bfc`, `changes/BH-007.md`, revision r1, blob `d0a8931a28e3a68a7527def6974a3b01d5239f39`. The authorized Bellhop base is commit `4fa4aadce54bf46225ca71d29f2dcf3119cd9b2e`, tree `9866de4688918f17eb5c458fcd499da518a98bdb`.

The candidate is the head of `feature/bh-007-web-hero-persistent-web-shot`. Its exact head/tree, tested checkout/tree, PR event parents, working-tree state, runtime and observation time are written at execution time into `report.json` in the `web-hero-web-shot-browser` workflow artifact. The verifier requires the tested checkout tree to equal the PR candidate tree, including when GitHub checks out a synthetic merge. The draft PR and workflow run are the durable publication index; do not reuse evidence after a head change without inspecting the exact diff and rerunning affected checks.

## Approved behavior and tuning

| Item | Implemented contract |
| --- | --- |
| Authority | `skinSelection.snapshot().equipped === "web-hero"`; preview state and materials are never consulted |
| Keyboard / gamepad / touch | KeyX; standard gamepad X/button 2 (B/button 1 remains gust/slam); visible gameplay-only X/web touch control |
| Projectile | 18 units/s, 1.0 s, 16-unit cap, 0.45 s cooldown, one target, no homing/piercing/AOE |
| Aim and blocking | nearest eligible visible hostile in a 30° facing cone; sampled solid geometry blocks before target collision |
| Capture | enemy is immediately inactive/non-hostile; procedural white enclosing wire-web remains 0.8 s; family defeat adapter then runs once and the enemy/effect disappear |
| Cleanup | bounded shots; pause freezes; death, respawn, restart, menu and level exit clear transients; confirmed eligibility persists |

## Level/enemy matrix

| Level | Eligible evidence path | Negative boundary |
| --- | --- | --- |
| Meadow | Gloop → `hitGloop` | Snoozles, crates, notes, hearts, scenery, goo |
| The Deep | Shark → `killShark`; Spikefish → `killSpikefish` | fish, clams, kelp; bubble-trapped shark |
| The Peak | Cinder → `hitCinder`; Wisp → `extinguishWisp` | salamanders, geysers, notes, scenery |
| Space | hostile Saucer → `hitSaucer` | tutorial target dummy, asteroids, sparks, scenery |
| Desert | real fire/miss/range-or-lifetime cleanup; no hostile family | lizards, camels, cacti, quicksand, collectibles |
| Snowbound | Snowman → `hitSnowman(..., "web")` | reindeer, Snoozles, sled, snowballs, scenery |

## AC-to-evidence map

| AC | Deterministic/integration evidence | Exact-product Chrome evidence |
| --- | --- | --- |
| AC-01 | preview/cancel/confirm, other-skin negative, storage success/unavailable-session behavior | real skin UI confirmation, persisted reload, cancelled preview negative |
| AC-02 | KeyX, touch pointer binding, gamepad X/B coexistence and non-Hero X-as-B regression | browser KeyX, visible-coordinate touch X, emulated standard Gamepad API button 2; ordinary KeyW journey |
| AC-03 | timed inactive wrap, stationary targets, family adapters, held-note and heart reward once-only checks | projected ordinary-camera wire-wrap inspection plus timestamp-faithful ready/projectile/wrapped/disappeared frame sequence |
| AC-04 | real shark, saucer and snowman contact plus real goo-projectile update; heart loss and shoot-again | actual shark contact update → one-heart loss → KeyX capture journey |
| AC-05 | exact eligible-family inventory for all levels, every adapter, Desert negative, solid blocking and explicit non-enemies | each level/family through actual browser input; Desert finite miss |
| AC-06 | pause freeze, stale-input neutralization, death/respawn restoration, menu cleanup, skin switch, reload, temporary powers, 8.33/16.67/33.33 ms schedules | pause/resume timer freeze, menu/reload and temporary-power coexistence |
| AC-07 | full `tests/run.js`; narrowed shared-input skin invariant; unchanged physics/movement/menu suites | complete mandatory PR workflow, including existing browser, movement and phone-menu jobs |
| AC-08 | pending sponsor gameplay/visual judgment | direct exact-candidate images/sequence and playable PR preview after QA |

## Commands and retained artifacts

- Local/final gates: `node build.js`; `node build.js --check`; `node tests/run.js`; `git diff --check`.
- Focused deterministic log: `node tests/web-hero-web-shot.test.js` (also retained in the focused artifact).
- Focused browser gate: `node tools/browser-web-hero-web-shot-verify.js` under Node 22 and GitHub-hosted Chrome/CDP.
- Artifact: `web-hero-web-shot-browser`, containing `report.json`, `sequence-manifest.json`, deterministic log, the hashed generated `candidate-index.html`, the four-frame 1280×720 sequence, and readable-wrap images at CSS viewports 390×844 and 844×390. Image pixel dimensions reflect recorded DPR.
- The complete PR workflow remains authoritative for all mandatory existing jobs and exact run/job/attempt outcomes.

## Evidence limits

Deterministic tests use a permissive headless THREE/DOM fixture. Browser matrix positioning uses a labelled fixture only to place Pling at each distant authored family; input, projectile travel, collision, capture and defeat execute in the generated product. A separate Meadow journey uses real menu interaction and continuous KeyW traversal with no position assignment. Gamepad is browser-level standard-API emulation. CI Chrome is not WebKit, a physical phone, or sponsor playtesting. AC-08 remains pending until the sponsor uses the exact candidate and judges the result.
