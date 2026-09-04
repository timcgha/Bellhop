# Game Plan: Bellhop Level 5 — Desert

## Risk Tasks

### 1. Camel mount-state handoff
- **Why isolated:** The player must visibly sit on a moving camel while the existing platform physics and input contract remain stable for Levels 1–4.
- **Approach:** Keep the camel as a data-owned world entity. Mounting consumes the normal A/Space jump action only when Pling is close to a rideable camel. While mounted, A/Space retains its normal jump role and B/J/Shift becomes a deliberate hop-off action. Mounted movement uses the existing player collision and camera with a higher visual rider position, faster stride, and a higher jump.
- **Verify:** A nearby A/Space mounts exactly one camel; mounted speed and jump exceed normal movement; B/J/Shift dismounts without an immediate remount or a lost player.

### 2. Split quicksand outcomes and finish handoff
- **Why isolated:** Ordinary quicksand must use an ordinary recovery consequence, while the final trap must run a readable sink, portal, and oasis win sequence without accidental wins.
- **Approach:** Author quicksand as explicit level entities with `ordinary` or `final` roles. Ordinary patches remove one heart and return Pling to the safe anchor. The final patch owns a short sink and portal state machine before positioning Pling in the separate oasis tableau and invoking the existing win architecture.
- **Verify:** Ordinary quicksand never calls the win flow; final quicksand cannot be confused with ordinary recovery; camera ownership remains stable through sink, portal, and oasis celebration.

## Main Build

The implementation adds `levels/level5.js` for the authored desert route and `src/desert.js` for desert-only presentation and mechanics. The route introduces a camel near the start, heart- and note-reward lizards, readable cactus blockers, several distinct ordinary quicksand pools, a stair-stepped sandstone cliff, the intentional final sand trap, a sand portal, and a separate green oasis celebration scene. The level picker gains a fifth Desert card and desert thumbnail. Existing shared code receives only narrow dispatch, lifecycle, HUD/picker, player mounted-motion, and test-hook changes.

- **Assets:**
  - Generated warm-rippled sand tile, 2m repeat, loaded as the desert floor texture from the asset CDN.
  - Generated Level 5 visual target, 2560×1440 review reference, used to set the camel, cactus, quicksand, cliff, and oasis composition.
- **Verify:**
  - Level 5 is selectable, loads, and begins in a clearly desert-colored scene.
  - Camel mount, stride, jump, and dismount state transitions remain stable.
  - Both lizard reward types create real heart/note pickups.
  - Cactus collision blocks the player consistently.
  - Ordinary quicksand causes recovery and never wins.
  - The cliff drop reaches final quicksand, sand portal, oasis, and the existing congratulations banner.
  - `node build.js`, `node build.js --check`, and `node tests/run.js` pass with Levels 1–4 regression coverage intact.
  - Browser verification records the Level 5 picker, camel, quicksand, cliff/portal, and oasis visuals without console errors.
