# Level 4 — Space

Design by the six-year-old. Written up to the beat structure in
Bellhop_claude.md. This is the spec; `levels/level4.js` is the implementation.

## Premise

The lullaby reached the stars. Pling launches from a little space dock into open
sky full of planets, glittering stars, drifting asteroids, and friendly-looking
aliens. Four Snoozles are asleep out here. A huge black hole waits at the far
end of the route. It is dark and quiet until all four are awake.

## Level picker

Bellhop now has four levels, and all four are always available. There is no
unlock requirement.

The start card shows four large visual level cards:

- Level 1: the meadow and windmill.
- Level 2: the ocean and giant conch.
- Level 3: the volcano and steam organ.
- Level 4: stars, a colourful planet, and the black hole.

The pictures must be enough for a child to choose without reading. Small text
labels may exist for adults, but text must not be required to understand the
choice.

Touch taps a card. Keyboard and gamepad move the highlighted choice left and
right and confirm with the normal start/jump button. The highlighted card must
have an obvious visual selection state.

Levels 1–3 remain fully replayable and their existing win flows do not change.

## What is different about being in space

Everything Pling already knows how to do still works. Space changes how movement
feels in the open, not what the buttons mean.

### Open space (zero gravity)

In the big empty areas between landings, there is no gravity pulling Pling
down. This is Level 4 only; Levels 1–3 are unchanged.

**Hold-A flight contract (designer-locked):**

- **Press or hold jump (A / Space)** and a blue foot-jet fires immediately.
  While jump stays held, thrust continues — no need to release and press again.
  Pling can keep flying indefinitely in open space as long as the button is
  held.
- **Release jump** and the jet stops. Pling **coasts** at a gentle, capped
  speed. He does not fall. Move input still steers during the coast.
- **Press jump again** after release (or while coasting) restarts the jet.
- **Air-puff** (jump again while already thrusting, before the second stroke
  cooldown) still works once per flight. Same two-stroke rhythm as Level 1,
  just with no sinking between strokes.
- **Move (stick / WASD / arrows)** steers thrust and coast direction. Push
  forward/up on the primary movement control to climb; pull back/down to descend;
  left/right to steer. Camera look is optional — basic altitude does not require
  camera pitch. This is not realistic inertia — Pling turns and corrects quickly
  enough that a child can recover from overshoots without fighting the controls.
- **No downward gravity** in open-space zones. Vertical aim comes from primary
  move input, not from falling or camera pitch.
- **Soft speed cap** while thrusting and while coasting so he never blasts out
  of control. Exact numbers are for playtest; the invariant is *freedom +
  controllability*, not orbital simulation.
- **Spin (Y / K)** still hits everything nearby.
- **B / J / Shift** always performs the **gust** in open space. There is no
  ground-pound in zero gravity. Pressing B pushes space dust, spins little
  satellite dishes, and nudges loose asteroids aside. With Star Beam power, the
  same gust also fires the beam forward (see below).
- **Air-slam** does not exist in open space. Pressing B while drifting performs
  gust (and beam if powered), not slam.

The child-facing rule:

**Hold jump to fly. Let go to glide. B is your space breath.**

**Behavioral invariants (implementation contract):**

- Open-space `grav === 0`. Releasing jump never starts a fall loop.
- Holding jump from a standstill in an open-space zone begins flight
  immediately (Launch Dock teaches this first).
- Leaving a surface pad into open space: jump launches off; holding jump
  continues flight in the new zone without a mode change delay.
- Touching a landable surface while moving slowly enough to land snaps to
  grounded state; Level 1 rules apply until Pling jumps back into open space.
- Flight can restart immediately from any surface or mid-coast.

### On a planet surface

When Pling lands on a planet, moon, or dock platform, normal Level 1 physics
return for that zone:

- gravity pulls down
- jump, puff, float, slam, and gust behave exactly like Level 1
- the foot-jet still burns enemies directly underneath on jump

Surfaces must read clearly — colour, rim light, flat pads, maybe a soft landing
puff — so a child knows when the rules changed back.

### Inside a planet

Some planets have an entrance. Walking or flying into the mouth loads an
interior volume with normal gravity and a visible sky dome so it still feels
like outer space outside the windows.

Inside, all Level 1 movement rules apply. Star Beam still works the same way
(gust breath plus forward beam). Zero-gravity flight does not work indoors.

**Interior gravity rule (frozen):** option B — interiors restore ordinary
grounded Bellhop movement. Open space alone uses hold-A flight. The transition
must read clearly: landing pad colour, rim glow, or a short whoosh plus
footstep SFX when crossing from open space to surface/interior.

**Important:** zero gravity is a property of Level 4 open-space zones, not a
global change.

Levels 1–3 must play exactly as they do today. The space physics profile belongs
in the level data, with explicit zone tags (`openSpace`, `surface`, `interior`).
Level 1 carries its current physics values explicitly and is never altered.

If changing Level 4 alters Level 1, the split is in the wrong place.

### Open-space bounds and recovery

Space feels open, but the authored route is a **bounded play volume**. A child
must never drift forever into an empty void or become permanently stranded.

- **Soft route envelope:** invisible or softly visible tether fields, star-lane
  buoys, and gentle nudge volumes keep Pling near meaningful content. Crossing
  the outer envelope applies a slow push back toward the nearest route marker,
  not instant death.
- **Vertical and lateral limits:** flying too far above, below, or sideways
  triggers the same gentle return force or teleports Pling to the last
  checkpoint facing the next landmark. Recovery must take seconds, not minutes.
- **Knockback cap:** asteroid and saucer knockback cannot eject Pling beyond
  the recoverable envelope in one hit. I-frames always allow steering input.
- **Missed landing:** missing a planet pad costs time, not a run. Checkpoints
  and buoy lines make re-approach obvious. Dying returns to the last checkpoint
  with full hearts, keeping Snoozles and notes already collected (same as
  Levels 1–3).
- **No instant void death.** No fail state harsher than losing a heart.

### Starting physics values (playtest tuning)

These are named Level 4 open-space values for implementation and first
playtest. Behavioral invariants above are the contract; numbers below are
starting points until a real playtest locks them.

```
openSpace:
  grav: 0
  coastCap: ~4         // max drift speed when jet released (not "fall")
  jumpV: 8.5           // initial puff thrust
  puffV: 7.5           // second stroke
  thrustHold: 5.5      // sustained hold-jet acceleration
  thrustCap: 9.0       // max fly speed while holding jump
  steerResponse: high  // child can correct overshoot quickly
  coyote/buffer/hover: same keys as Level 1 unless playtest says otherwise

surface/interior:
  identical to Level 1 physics block
```

Every number in Level 1 was arrived at by playing, not by reasoning. These
deserve the same treatment. Implement as named Level 4 values, play the level
with the designer, and tune only the open-space profile.

## The Star Beam power-up

Crates in this level hold **Star Beam** power instead of fire, bubble, or Sky
Blast.

One power-up per level is a rule worth keeping. It is a large part of what makes
levels feel distinct.

The gust already works in space: it blows glitter dust, spins little antennas,
and pushes light debris.

With Star Beam, the same gust also fires a bright laser beam forward from
Pling’s whistle-spout. The gust puff still happens — dust, crystals, jellyfish,
and dishes react exactly as without power. Only forward combat/door interactions
gain the beam.

Same button, same move, upgraded. Nothing new to relearn.

### Controls with free flight

Jump and gust must never fight each other:

| Situation | Jump (A) | B / gust |
|---|---|---|
| Open space, no power | Hold to fly; tap for puff stroke | Space gust |
| Open space, Star Beam | Hold to fly; tap for puff stroke | Gust **plus** Star Beam |
| Planet surface, no power | Normal jump / puff / float | Normal gust |
| Planet surface, Star Beam | Normal jump / puff / float | Gust **plus** Star Beam |
| Planet interior | Normal jump / puff / float | Gust **plus** Star Beam |

Jump is for moving. B is for breath and zapping. A child can hold jump with one
finger and tap B with another on a tablet.

Star Beam can be fired while flying. Holding jump does not block B.

The beam travels straight forward from Pling’s facing direction, about 18–22
units, for roughly 0.35 s. It pierces one saucer or breaks one cracked asteroid
shield. It makes a sharp twinkle sound every time.

**What Star Beam replaces:** forward attack power on B (saucer damage, cracked
shields, the one mandatory beam gate). It does **not** remove gust utility on
environmental props. Spin, slam (on surfaces), and jump-jet still defeat
saucers without Star Beam.

Star Beam is **not** spent on use. Like fire, bubble, and Sky Blast, it is kept
until an enemy or hazard hit removes it.

A short orange seam glow on Pling’s bellows and a tiny star on the whistle-spout
show the power is active.

## Counted-note rule

Anything finite and deliberately placed in the level may hold a counted music
note.

That note exists in the level from build time and contributes to `notes.length`
from the beginning. Defeating a note-bearing saucer or cracking a note-bearing
asteroid reveals the existing hidden note rather than spawning a new one.

The note can only be revealed and collected once.

This follows the same pattern already used by dust piles in Level 1 and note
fish in Level 2.

A saucer rebuilt or respawned after its note has already been collected does not
create another note.

A valid way of defeating a note-bearing saucer must never make 100% note
completion impossible. If a saucer holds a note, defeating it by spin, slam,
jump-jet, or Star Beam reveals the same note.

Anything unlimited, ambient, or respawning does not award a counted note.

Drifting space jellyfish, twinkling stars, and ordinary asteroids therefore
give pops, sparkles, and sounds when interacted with, but no counted collectible.

## Renewable-power rule

Any mandatory obstacle requiring a losable power must have a renewable source
of that power nearby.

For Space, a **star crate** (mystery box with a star emblem) can repeatedly
provide Star Beam near a mandatory shielded gate.

**Mandatory Star Beam use:** exactly one — the Saucer Belt **shielded gate**
(beam-only barrier, not a saucer). Spin and gust cannot open it. A renewable
star crate sits beside this gate. No other main-route obstacle requires Star
Beam; cracked asteroids and saucers always offer spin, slam, or jump-jet
alternatives.

A child who loses Star Beam immediately before the required gate must never
be forced into long backtracking or become stuck.

## Enemies and hazards

### Flying saucers (main enemy)

Flying saucers are the main hostile creatures. They are simple and readable:

- shiny disc body, glowing dome, gentle wobble
- they patrol a small **leashed** area; they do not chase forever across the
  whole sky
- they wind up for half a second with a pulsing dome light, then shoot one
  green spark ball in a lazy arc — always telegraphed, never a bullet hose
- sparks and body contact are visible before they arrive; no off-screen sniping
  from behind planets
- getting hit by the ship body or the spark costs **one heart**, applies
  moderate knockback, and grants i-frames like every other enemy

**How to beat them (child rule: saucers are for spinning, slamming, or
zapping):**

| Attack | Effect |
|---|---|
| Spin | Defeats saucer |
| Air-slam (on a surface only) | Defeats saucer |
| Jump-jet from below | Defeats saucer |
| Star Beam | Defeats saucer |
| Gust (no power) | Stuns briefly, no damage |
| Spark ball hits saucer | Bounces back; reflected spark defeats saucer |

Placed saucers may hold music notes. Any valid defeat reveals the held note.
Ambient or respawning saucers never hold counted notes.

Three sizes for variety, mirroring Gloop readability:

- **Small silver** — 1 hp, quick bob
- **Mid blue** — 2 hp, takes two spins or one beam
- **Big gold** — 3 hp, slow, telegraphs longer

### Asteroids (hazard)

**Roles (visual language must differ):**

| Role | Look | Interaction |
|---|---|---|
| Backdrop | Small, dim, parallax | No collision |
| Hazard rock | Solid grey-brown, soft spin | Touch = one heart + knockback + i-frames |
| Cracked rock | Same body plus glowing crack | Breakable; may hold a note |
| Landable body | Bright pad, rim light, tether buoys | Surface/interior zone; normal gravity |

Ordinary hazard asteroids drift slowly. Touching one costs **one heart**,
moderate knockback, and i-frames. They are not instant death.

**Anti-pinball contract:** authored lanes keep minimum spacing so one hit
cannot chain into immediate second hits during i-frames. Knockback pushes
*away* from the rock face, not deeper into a cluster. If a belt feels tight,
provide a parallel wait lane or wider gap — never luck-only threading.

Spin and slam do **not** destroy ordinary hazard asteroids. The child learns to
fly around them.

Some larger asteroids have a glowing crack. These are **cracked asteroids**:

- Star Beam breaks the crack and splits the rock (safe path opens)
- spin or slam also breaks cracked asteroids after two hits
- a placed cracked asteroid may hold a hidden note revealed when it breaks

Ordinary unlimited drifting rocks never award counted notes.

**Moving asteroids:** motion is slow and lane-based. Openings stay readable; a
child can wait, steer around, or choose another line. No random walls of rock,
no timer dependency, no unavoidable collision from bad spawn timing.

### Harmless space life

Optional ambient creatures keep the sky alive:

- **Space jellyfish** — pulsing bell shapes that drift and glow; gust makes them
  ripple and play a soft bloop
- **Satellite critters** — tiny robots on floating panels; gust spins their
  dishes
- **Comet moths** — leave sparkle trails; no damage

These exist for wonder and gust play, not farming.

## Camera, occlusion, and mobile readability

Level 4 does **not** retune the global landscape-camera experiment from Level 3
Stage 4.8A. Instead, authored volumes own local readability rules.

**Open space:** default follow camera with slightly longer boom when far from
landmarks so Pling stays readable against starfields. Important interactables
(Pling, real asteroids, saucers, landable pads, Snoozles, black hole) stay
**hero-sized** — never pin-dot scale for drama.

**Large bodies:** planet entrance shells and thick asteroid walls use the Geode
Hollow lessons from Level 3:

- no unexplained box doorways; entrances read as cave mouths, cracks, or docks
- visible geometry and collision agree; no fake walls Pling can clip through
- no unsupported floor seams at transitions
- shell occluders **fade or clip** when Pling enters so the camera never loses
  him behind opaque planet crust
- mandatory interior content (Snoozle 3, main exit) visible from the main
  chamber line without pixel hunting

**Interiors:** tighter boom, higher look target if ceilings are low; sky dome
windows keep exterior context.

**Mobile (phone landscape):** saucers, hazard asteroids, landable pads, and
Snoozles must read at phone scale without zooming. Star Beam and foot-jet VFX
stay bright and large. The black hole stays an unmistakable silhouette even at
distance.

## The route

Seven named beats. Areas 3 and 4 are one planet fantasy (Candy exterior →
Crystal interior) but stay separate beats for pacing and teaching. The black
hole is visible from Area 1 as a distant swirling disc with faint sparkles. The
route bends toward it like following a river of stars.

Overall play time target: 10–14 minutes. Something interesting every 20–30
seconds.

`snoozleGoal = 4`

### 1. The Launch Dock

Opening moment.

A tiny wooden-and-brass dock with Pling’s rocket pad, bunting, and a view of
the whole star field. The black hole glimmers far ahead. A ringed planet and a
pink moon hang to the left and right as **backdrop** bodies (no landing pads).

Safe teaching space with no enemies and no hazard asteroids.

Wide zero-G lanes with glowing tether buoys show where to fly. The first gap is
forgiving — hold jump from the pad, drift through, land on the next pad. No
combat, no damage, no Star Beam yet: sell **“I can fly forever!”** first.

Snoozle 1 sleeps in a glass dome on the dock in plain sight.

Checkpoint at the pad.

### 2. The Asteroid Garden

Colourful asteroids drift in slow lanes like a garden. None chase.

Teach dodging before combat:

- first lane is wide and slow
- second lane adds gentle sideways drift
- cracked asteroid optional tutorial: one cracked rock blocks a shortcut; spin
  twice or any later beam breaks it — safe to skip

Introduce one **small silver saucer** alone in a clear bubble after the garden,
still before the Candy Planet approach. The child has room to spin, or jump-jet
from below.

Snoozle 2 sleeps on the **Candy Planet surface** — on the bright landing pad
area but slightly off the Star Beam teaching line so finding it feels like a
small discovery. No obscure traversal required.

The **Cheese Moon** remains a round yellow **backdrop** body only — visible
foreshadow, not landable. There is no Cheese Moon checkpoint.

Checkpoint at the Candy Planet cave mouth (after surface teaching).

### 3. The Candy Planet (surface + Star Beam)

A big striped **landable** planet ahead — bright landing pad, tether buoys,
rings of sugar-coloured dust. Backdrop planets without pads stay dimmer and
smaller in parallax.

On the surface, gravity returns. Teach the surface/interior switch honestly.

Introduce **Star Beam** here:

1. Star crate on an obvious pedestal before any mandatory use.
2. Harmless saucer target dummy (no note) that flashes when beamed.
3. One mid saucer on the route holding a note — any defeat reveals it.

The gust → beam upgrade should teach itself before anything dangerous.

The **main route** cave mouth on the far side leads into Area 4. A giant
lollipop antenna marks the planet from space.

Checkpoint at the cave mouth.

### 4. The Crystal Cavern (Candy Planet interior)

The interior of the Candy Planet — a geode world with glowing purple insides
(Level 3 Geode Hollow energy, but space themed). Not a separate mandatory
planet landing; the cave mouth from Area 3 is the primary entrance.

Optional shortcut: a visible glowing crack on a nearby **decorative crystal
moon** (same interior, re-entry only — not required for first visit).

Interior is a cave network with normal gravity:

- crystal bridges
- low ceilings so jump/float still matter
- one mid saucer in a chamber
- gust (with or without Star Beam) blows stardust off crystals and reveals
  hidden glitter paths

Snoozle 3 sleeps inside a cracked crystal geode on the **main route** — visible
from the primary chamber approach (Level 3 Snoozle 3 readability lesson).

Optional side tunnel with two cracked asteroids embedded in the walls (notes
inside if placed).

Checkpoint at the interior midpoint.

Exit through a top opening back to open space toward the black hole. Crossing
the exit threshold returns to open-space hold-A flight immediately.

### 5. The Saucer Belt

The path narrows into a busy lane: asteroids + saucers together.

Teaching order:

1. Open lane — dodge asteroids only
2. One saucer weaving between rocks
3. Two saucers with room to spin or beam

Place a **renewable star crate** beside the one mandatory **shielded gate** —
a beam-only energy barrier (not a saucer). Spin and gust alone cannot open it.
Losing power here must not soft-lock the run.

Big gold saucer optional mini-boss in a wide arena; holds a note if placed.

Checkpoint after the gate.

### 6. The Star Observatory

Calm register break before the end. Floating glass platforms, telescopes, slow
jellyfish — no new mechanics, no mandatory combat.

Functions:

- **Snoozle 4** on an observatory catwalk with a direct view of the black hole,
  now much closer and slowly spinning
- **Black-hole foreshadow** — telescopes and window framing point at the finish
  landmark; the child sees where the adventure ends
- **Rest after Saucer Belt** before the final approach

Ambient notes placed in plain sight reward exploration without combat pressure.

Woken Snoozles fly toward the black hole the same way Level 1 Snoozles fly to
the windmill and Level 2 Snoozles swim to the conch.

Checkpoint on the observatory deck.

### 7. The Black Hole

The finish landmark.

From the start it was visible; now it fills the sky — black core, white
accretion swirl, slow sparkle particles, gentle hum when near.

The hole is **inactive** until all four Snoozles are awake: dark rim, no pull,
soft warning shimmer if Pling touches it early (gentle bounce, no damage).

## The finish

Waking the final Snoozle is the **climax**.

Entering the black hole is the **finish**.

These are deliberately separate moments.

When the fourth Snoozle wakes:

- the black hole **activates** — swirl speeds up, rim glows gold and white,
  sparkles intensify, a deep welcoming bass note plays
- a bright ring portal opens in the core
- Snoozles travel toward the black hole
- toast optional: short picture of the portal opening; no required reading

**Entering the inactive hole does not win.**

**Waking the fourth Snoozle does not win.**

Only crossing into the active portal triggers the finish sequence.

### Warp tunnel sequence

When Pling enters the active portal:

1. Camera locks behind him; movement input softens but jump/gust remain
   responsive enough that the child feels in control. No damage, no enemies.
2. He is pulled along a **warp tunnel** — a tube of streaking stars, rainbow
   rings, and passing planets for **6–8 seconds**. No fail state in the tunnel.
3. Gentle whoosh and twinkle SFX; music swells with the win layer (see below).
4. Pling bursts out into a **finish void** — calm starfield, all four Snoozles
   orbiting him, notes and confetti as stars.
5. `CONGRATULATIONS YOU WIN!` appears in the finish void, not at Snoozle 4.
6. Return-to-picker (soft return) becomes available after the celebration beat,
   same as Levels 1–3. Hazards are inert once win triggers.

Generic post-win hazard safety applies throughout the tunnel and finish void.

### Celebration

Inside the finish void:

- every music layer plays (see song concept below)
- Snoozles dance in slow orbit
- the black hole behind them becomes a glowing halo (friendly, not scary)
- star confetti and lens sparkles
- camera pulls back for a big tableau

The existing `CONGRATULATIONS YOU WIN!` banner remains unchanged.

Suggested Level 4 win subtitle (FINISH-owned, like the Conch and Steam Organ):

**The stars are singing!**

## One clever secret

In the Asteroid Garden, one large asteroid looks solid from the main lane.

The player has already seen cracked asteroids break.

Flying around the back reveals a glowing crack. Spin twice or beam opens a
hollow with three music notes and a heart. Not required for completion.

## Optional hard challenge

Side route in the Saucer Belt: **The Comet Run**

- marked by a red buoy — flying past it commits to a narrow zig-zag lane
- dense fast asteroids and two mid saucers
- three **pre-placed** music notes at the end on a floating trophy pad
- rejoins the main route before the observatory

Ignoring it never blocks completion.

## Music / song layering

Level 4 song id: `space`.

Base bed: soft pulse, twinkling high ticks, slow bass like a heartbeat.

Snoozle layers match prior levels:

| Awake | Layer added |
|---|---|
| 0 | Sparse stars — quiet pulse and high twinkles only |
| 1 | Gentle melody enters (5-note motif) |
| 2 | Warm pad harmony |
| 3 | Rhythmic pluck / chime arpeggio |
| 4 | Full arrangement; black hole activation adds a low welcoming swell |
| Win (after warp tunnel) | All layers plus celebratory bell cluster and slow choir-like sine pad |

The black hole activation swell is tied to `FINISH.onAllAwake`, not to win,
mirroring the conch door and organ lighting.

Entering the portal adds the final win layer during the warp tunnel peak.

## Tests to add

Follow the existing pattern in `tests/`.

### Stage 1 / level framework

- Selecting Level 4 boots `LEVEL4`.
- Booting Level 4 does not alter Level 1–3 physics or expected values.
- Level picker shows four cards; Level 4 card boots space level.
- Levels 1–3 remain selectable and unchanged.

### Open-space movement

- Open-space zones have `grav === 0` (or level equivalent).
- Pling does not fall when jump is released in open space; he coasts below
  `thrustCap` / coast cap.
- Holding jump from standstill in open space applies sustained thrust.
- Holding jump after initial press continues thrust without requiring release.
- Air-puff second stroke still works once per flight in open space.
- Move input steers thrust and coast direction.
- B in open space performs gust, not slam.
- Surface and interior zones use Level 1 jump apex (~1.75) and gravity.
- Level 1 movement and controls remain unchanged when Level 1 is loaded.
- Crossing outer route envelope applies recovery (nudge or checkpoint snap); no
  void death.
- Knockback from asteroids/saucers cannot eject Pling beyond recoverable bounds
  in one hit.

### Star Beam

- Star crate grants `hasStarBeam` (or equivalent).
- With Star Beam, B performs gust **and** fires beam forward; without it, B
  performs gust only.
- Environmental gust interactions (dust, crystals, dishes, jellyfish) still work
  with Star Beam active.
- Jump/hold flight still works while Star Beam is active.
- Beam can be fired while holding jump.
- Enemy hit removes Star Beam; asteroid hazard hit removes Star Beam.
- Beam defeat reveals an existing held note, not a new note.
- Renewable star crate restores Star Beam after loss.
- Mandatory shielded gate always has renewable Star Beam nearby.
- Shielded gate cannot be opened by spin or gust alone.
- No main-route soft-lock when Star Beam is lost before the gate.

### Saucers and asteroids

- Saucer contact costs one heart.
- Spark contact costs one heart.
- Spin defeats a small saucer.
- Star Beam defeats a saucer.
- Gust stuns but does not defeat.
- Reflected spark defeats a saucer.
- Ordinary asteroid contact costs one heart.
- Two asteroid hits cannot chain during i-frames in authored lanes.
- Spin does not destroy ordinary asteroids.
- Cracked asteroid breaks from beam or two spins.
- Ambient jellyfish contact costs nothing.
- Ambient entities never increase counted note total.
- Backdrop asteroids have no collision.

### Counted notes

- Note-bearing saucer reveals pre-existing hidden note on any valid defeat.
- Counted-note total is fixed at build/load time.
- Respawned saucer after note collected does not create another note.
- Comet Run and secret-hollow notes exist at build time (not spawned on entry).

### Snoozles

- Exactly four Snoozles; `snoozleGoal === 4`.
- **Snoozle 1** — Launch Dock.
- **Snoozle 2** — Candy Planet surface (small discovery off the Star Beam line).
- **Snoozle 3** — Crystal Cavern interior (main route).
- **Snoozle 4** — Star Observatory (future slice; not yet obtainable).
- After Stage 4 implementation, exactly **three** Snoozles are obtainable before
  the Observatory slice ships.
- Snoozle 3 reachable without optional side tunnel.
- Waking fourth Snoozle does not trigger win.

### Finish

- Black hole stays inactive at three Snoozles.
- Black hole activates at four Snoozles (`FINISH.onAllAwake`).
- Touching inactive hole does not trigger win (gentle bounce only).
- Waking fourth Snoozle alone does not trigger win.
- Entering active portal triggers warp tunnel then win exactly once.
- Win subtitle reads `The stars are singing!` (or authored FINISH string).
- Hazards inert after win; return-to-picker works.
- Level 1–3 FINISH flows unchanged.

### Level traversal

- Launch Dock → Asteroid Garden → Candy Planet route is completable without
  soft-lock.
- Crystal Cavern interior enter/exit works; gravity restores inside; exit
  restores open-space flight.
- Planet entrance shells fade/occlude correctly (Geode-style visibility).
- Saucer Belt mandatory gate is passable with beam; renewable crate reachable.
- Black hole visible from spawn direction (authored landmark present).
- Sample points through open-space lanes using the same approach as
  `level.test.js` and `level3-route.test.js`.

## Do not change

Levels 1–3.

No Level 1–3 gameplay expectation or expected value may change because of Level
4:

- not the 1.75 jump apex on land levels
- not underwater buoyancy in Level 2
- not Sky Blast tuning in Level 3
- not Level 3 Geode Hollow layout or finish
- not enemy behaviour in earlier levels
- not note counts in earlier levels
- not Snoozle counts in earlier levels (each level keeps `snoozleGoal = 4` on
  its own level, unchanged)
- not controls in earlier levels
- not layouts or win logic in earlier levels
- not Stage 4.8A camera diagnostic unless separately authorized

Shared infrastructure may become more generic only if existing expected behavior
does not move.

Test infrastructure may be extended as much as needed.

The harness will need to learn how to boot `LEVEL4`. That is expected and is
not a warning sign.

The line is between teaching the harness a new trick and changing what Levels
1–3 are asserted to do.

This specification is frozen for implementation.

**Do not** revise its gameplay design during implementation unless the designer
changes it after playtesting.
