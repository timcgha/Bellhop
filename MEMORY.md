# Level 5 Implementation Notes

The authorized source gate passed before branch creation: `origin/main` was `8d7862fb05958f5f6b39577ee2711ad2f1d162f2`, exactly matching the requested SHA. Development occurs on `feature/level5-desert-mvp`.

Bellhop is not a WebDev/Babylon project. It is a self-contained Three.js r128 game with levels concatenated into `index.html` by `node build.js`; the implementation therefore follows the repository’s established architecture rather than introducing a second rendering host. Generated art is represented by a CDN-hosted sand texture and a retained visual target reference. No Radio code or earlier level design is intentionally modified.

The key compatibility point is that gamepad/touch A and keyboard Space share the game’s jump action, while keyboard `A` remains the left-movement key. Near a camel, the jump action mounts; while mounted it remains a higher camel jump, and B/J/Shift is the deliberately separate hop-off action. Away from a camel the controls remain unchanged.
