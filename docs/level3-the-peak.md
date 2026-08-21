# Level 3 — The Peak

Working design notes for the volcano level. Implementation lives in
`levels/level3.js` and the Peak systems under `src/`.

This file is not a complete rewrite of every Peak stage. It exists so the
documented Sky Blast contract matches the build after real phone playtests.

## Post-playtest amendments

The original Peak / Sky Blast prototype described a long jump powered by
`hasSkyBlast`, `P.puff`, and horizontal `leapBoost`, with orange bellows seams
and a steam trail. That core remains.

After the first phone playtests, mechanical wings and a bounded automatic
glide were added. They are now part of the implemented Sky Blast — not a
separate flight mode, and not a new button.

### Current Sky Blast states (verified against HEAD)

- `hasSkyBlast` — owns the power until an enemy hit (lava does **not** remove it)
- `P.puff` — once-per-airtime stroke (unchanged Level 1 rhythm)
- `leapBoost` — separate horizontal carry from a powered puff
- `P.glideArmed` / `P.glideT` — short descent softener after crest
- `P.wingsOut` — visual wing deploy (may begin at puff; physical glide still
  waits for crest/descent)

### Verified Level 3 constants (Stage 4.5 / 4.6)

```
puffVMul:      1.4
boostMax:      12.5
boostDecay:    1.6
glideDur:      0.55
glideFallCap: -2.2
glideStartVy:  0.2
```

Do not retune these without a new phone playtest.

### Wings and glide (child-facing rule)

Sky Blast still means: jump farther, not higher.

Sequence:

1. Powered puff fires `leapBoost` and steam trail.
2. Wings deploy immediately as a visual tell (`wingsOut`).
3. Bounded glide physics begin near crest / early descent (`glideStartVy`).
4. Descent softens for `glideDur`, then ends on its own timer.
5. Wings retract on landing, air-slam, enemy hurt, lava contact, death, or
   level load.

Hold-to-float must not indefinitely extend the glide. Air-slam clears
`leapBoost`, glide, and wings immediately. Lava clears boost/glide/wings but
keeps `hasSkyBlast`.

### Stage 4.6 readability note

Wing **visual** timing was moved earlier (deploy at puff) while glide physics
constants stayed as above. Mystery-box placement and volcanic ground materials
were corrected in that pass; they are production route concerns, not Sky Blast
tuning.
