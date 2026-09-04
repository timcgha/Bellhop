# Bellhop Level 5 Structure

Bellhop remains a self-contained Three.js application whose `build.js` concatenates ordered level and source files into `index.html`. Level 5 follows the existing data-driven authoring style and does not refactor earlier levels or Radio.

| Area | Ownership | Responsibility |
|---|---|---|
| `levels/level5.js` | Level authoring | Desert metadata, checkpoints, route, entities, cliff, final trap, and oasis placement. |
| `src/desert.js` | Desert runtime | Desert terrain, camel entities, cactus visuals/blockers, lizards, quicksand behavior, portal transition, oasis tableau, and desert test hooks. |
| `src/entities.js` | Shared lifecycle | Level registration, action dispatch, desert world cleanup, Level 5 metadata exposure. |
| `src/player.js` | Shared player physics | Camel interaction consumption, mounted stride/jump tuning, quicksand recovery ownership, and rider visual offset. |
| `src/game.js` | Shared frame loop/camera | Desert entity update and temporary finish-camera delegation. |
| `src/hud.js` / `index.html` | UI | Fifth level card, desert artwork thumbnail, and one level-specific start prompt. |
| `tests/level5-desert.test.js` | Automated proof | Real input and frame-loop checks for all Level 5 mechanics and lifecycle cleanup. |

## State contracts

A camel is mounted only through `P.camel`; its visual mesh follows the player’s physical position and Pling receives a visual saddle offset. A/Space mounts only at a nearby camel and remains the camel’s higher jump; B/J/Shift is its intentional hop-off action. `DESERT.finish.phase` is the final-sequence state machine: `sink`, `portal`, then `oasis`. Ordinary quicksand uses `P.quicksandRecT` and `P.safeAnchor`, and cannot enter `DESERT.finish`. The oasis calls the existing `triggerWin()` flow only after the portal has finished.

## Asset hints

The generated sand tile is a repeated floor texture, while cactus, camel, lizard, quicksand, cliff, palms, and portal are readable procedural primitives. This preserves Bellhop’s single-file, low-download deployment model while grounding the level’s palette and material direction in generated art.
