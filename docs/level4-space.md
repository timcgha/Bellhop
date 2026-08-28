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

In the big empty areas between landings, there is no gravity.

- **Jump (A / Space)** still gives a foot-jet puff. In space the puff pushes
  Pling in the direction he is facing, up and forward like always, but he does
  not fall afterward.
- **Hold jump after a puff** keeps a gentle blue jet running from his feet. He
  keeps drifting in that direction while the button is held. This is the space
  version of float — same button, same idea, but with no ground pulling him
  down he can effectively keep flying.
- **Release jump** and the jet stops. Pling coasts slowly until he presses
  jump again. There is a soft top speed so he never blasts out of control.
- **Air-puff** (jump again while already in the air) still works once per
  flight. Two puffs, then wait for a short breath before the second stroke is
  ready again. Same rhythm as Level 1, just with no sinking between strokes.
- **Spin (Y / K)** still hits everything nearby.
- **B / J / Shift** always performs the **gust** in open space. There is no
  ground-pound in zero gravity. Pressing B pushes space dust, spins little
  satellite dishes, and nudges loose asteroids aside. With Star Beam power, the
  same button fires the beam (see below).
- **Air-slam** does not exist in open space. Pressing B while drifting performs
  gust, not slam.

The child-facing rule:

**Hold jump to fly. Let go to glide. B is your space breath.**

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
(gust fires the beam). Zero-gravity flight does not work indoors.

**Important:** zero gravity is a property of Level 4 open-space zones, not a
global change.

Levels 1–3 must play exactly as they do today. The space physics profile belongs
in the level data, with explicit zone tags (`openSpace`, `surface`, `interior`).
Level 1 carries its current physics values explicitly and is never altered.

If changing Level 4 alters Level 1, the split is in the wrong place.

### Starting physics values (not settled)

These are named Level 4 open-space values for implementation and playtesting.
They are starting points, not contracts, until a real playtest locks them.

```
openSpace:
  grav: 0
  maxFall: -4          // gentle coast cap when not thrusting
  jumpV: 8.5           // puff thrust
  puffV: 7.5           // second stroke
  thrustHold: 5.5      // sustained hold-jet acceleration
  thrustCap: 9.0       // max fly speed while holding jump
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
Pling’s whistle-spout.

Same button, same move, upgraded. Nothing new to relearn.

### Controls with free flight

Jump and gust must never fight each other:

| Situation | Jump (A) | B / gust |
|---|---|---|
| Open space, no power | Foot-jet puff; hold to keep flying | Space gust |
| Open space, Star Beam | Foot-jet puff; hold to keep flying | **Star Beam** laser |
| Planet surface, no power | Normal jump / puff / float | Normal gust |
| Planet surface, Star Beam | Normal jump / puff / float | **Star Beam** laser |
| Planet interior | Normal jump / puff / float | **Star Beam** laser |

Jump is for moving. B is for shooting. A child can hold jump with one finger
and tap B with another on a tablet.

The beam travels straight forward from Pling’s facing direction, about 18–22
units, for roughly 0.35 s. It pierces one saucer or breaks one cracked asteroid
shield. It makes a sharp twinkle sound every time.

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
provide Star Beam near a mandatory shielded saucer or beam-only barrier.

A child who loses Star Beam immediately before a required beam door must never
be forced into long backtracking or become stuck.

## Enemies and hazards

### Flying saucers (main enemy)

Flying saucers are the main hostile creatures. They are simple and readable:

- shiny disc body, glowing dome, gentle wobble
- they patrol a small area or slowly chase Pling when he comes close
- they wind up for half a second with a pulsing dome light, then shoot one
  green spark ball in a lazy arc
- getting hit by the ship body or the spark costs **one heart**, applies
  knockback, and grants i-frames like every other enemy

**How to beat them (child rule: saucers are for spinning, slamming, or
zapping):**

| Attack | Effect |
|---|---|
| Spin | Defeats saucer |
| Air-slam (on a surface) | Defeats saucer |
| Jump-jet from below | Defeats saucer |
| Star Beam | Defeats saucer |
| Gust (no power) | Stuns briefly, no damage |
| Spark ball hits saucer | Bounces back; reflected spark defeats saucer |

Placed saucers may hold music notes. Any valid defeat reveals the held note.

Three sizes for variety, mirroring Gloop readability:

- **Small silver** — 1 hp, quick bob
- **Mid blue** — 2 hp, takes two spins or one beam
- **Big gold** — 3 hp, slow, telegraphs longer

### Asteroids (hazard)

Asteroids drift slowly. They are grey-brown rocks with soft rotation.

Touching one costs **one heart**, knockback, and i-frames. They are not instant
death.

Spin and slam do **not** destroy ordinary asteroids. The child learns to fly
around them.

Some larger asteroids have a glowing crack. These are **cracked asteroids**:

- Star Beam breaks the crack and splits the rock (safe path opens)
- spin or slam also breaks cracked asteroids after two hits
- a placed cracked asteroid may hold a hidden note revealed when it breaks

Ordinary unlimited drifting rocks never award counted notes.

### Harmless space life

Optional ambient creatures keep the sky alive:

- **Space jellyfish** — pulsing bell shapes that drift and glow; gust makes them
  ripple and play a soft bloop
- **Satellite critters** — tiny robots on floating panels; gust spins their
  dishes
- **Comet moths** — leave sparkle trails; no damage

These exist for wonder and gust play, not farming.

## The route

Seven areas. The black hole is visible from Area 1 as a distant swirling disc
with faint sparkles. The route bends toward it like following a river of stars.

Overall play time target: 10–14 minutes. Something interesting every 20–30
seconds.

`snoozleGoal = 4`

### 1. The Launch Dock

Opening moment.

A tiny wooden-and-brass dock with Pling’s rocket pad, bunting, and a view of
the whole star field. The black hole glimmers far ahead. A ringed planet and a
pink moon hang to the left and right.

Safe teaching space with no enemies.

Wide zero-G lanes with glowing tether buoys show where to fly. The first gap is
forgiving — hold jump, drift through, land on the next pad.

Snoozle 1 sleeps in a glass dome on the dock in plain sight.

Checkpoint at the pad.

### 2. The Asteroid Garden

Colourful asteroids drift in slow lanes like a garden. None chase.

Teach dodging before combat:

- first lane is wide and slow
- second lane adds gentle sideways drift
- cracked asteroid optional tutorial: one cracked rock blocks a shortcut; spin
  twice or any later beam breaks it — safe to skip

Introduce one **small silver saucer** alone in a clear bubble after the garden.
The child has room to spin, slam a nearby moon rock, or experiment.

Snoozle 2 sleeps on a tiny **Cheese Moon** — a round yellow surface with normal
gravity. Land, wake, launch back to zero-G.

Checkpoint on the Cheese Moon.

### 3. The Candy Planet (surface + Star Beam)

A big striped planet ahead. Rings of sugar-coloured dust. Landing pad glows
pink and green.

On the surface, gravity returns. Teach the surface/interior switch honestly.

Introduce **Star Beam** here:

1. Star crate on a obvious pedestal before any mandatory use.
2. Harmless saucer target dummy (no note) that flashes when beamed.
3. One mid saucer on the route holding a note — any defeat reveals it.

The gust → beam upgrade should teach itself before anything dangerous.

A cave mouth on the far side of the planet leads to Area 4. The main route
marker is a giant lollipop antenna visible from space.

Checkpoint at the cave mouth.

### 4. The Crystal Planet (interior)

Enter the planet through the candy-planet cave or a visible crack on a nearby
**Crystal Planet** — a geode world with glowing purple insides (Level 2 geode
energy, but space themed).

Interior is a cave network with normal gravity:

- crystal bridges
- low ceilings so jump/float still matter
- one mid saucer in a chamber
- gust blows stardust off crystals and reveals hidden glitter paths

Snoozle 3 sleeps inside a cracked crystal geode.

Optional side tunnel with two cracked asteroids embedded in the walls (notes
inside if placed).

Checkpoint at the interior midpoint.

Exit through a top opening back to open space toward the black hole.

### 5. The Saucer Belt

The path narrows into a busy lane: asteroids + saucers together.

Teaching order:

1. Open lane — dodge asteroids only
2. One saucer weaving between rocks
3. Two saucers with room to spin or beam

Place a **renewable star crate** beside the one mandatory **shielded gate** —
a saucer shield wall that only Star Beam opens. Losing power here must not soft
lock the run.

Big gold saucer optional mini-boss in a wide arena; holds a note if placed.

Checkpoint after the gate.

### 6. The Star Observatory

Calm area before the end. Floating glass platforms, telescopes, slow jellyfish.

Snoozle 4 sleeps on a observatory catwalk with a direct view of the black hole,
now much closer and slowly spinning.

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

1. Camera locks behind him; controls soften but not fully removed.
2. He is pulled along a **warp tunnel** — a tube of streaking stars, rainbow
   rings, and passing planets for 6–8 seconds. No fail state in the tunnel.
3. Gentle whoosh and twinkle SFX; music swells.
4. Pling bursts out into a **finish void** — calm starfield, all four Snoozles
   orbiting him, notes and confetti as stars.

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
- three music notes at the end on a floating trophy pad
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
  `thrustCap`.
- Holding jump after a puff applies sustained thrust in open space.
- Air-puff second stroke still works once per flight in open space.
- B in open space performs gust, not slam.
- Surface and interior zones use Level 1 jump apex (~1.75) and gravity.
- Level 1 movement and controls remain unchanged when Level 1 is loaded.

### Star Beam

- Star crate grants `hasStarBeam` (or equivalent).
- With Star Beam, B fires a beam; without it, B performs gust.
- Jump/hold flight still works while Star Beam is active.
- Enemy hit removes Star Beam; asteroid hazard hit removes Star Beam.
- Beam defeat reveals an existing held note, not a new note.
- Renewable star crate restores Star Beam after loss.
- Mandatory shielded gate always has renewable Star Beam nearby.

### Saucers and asteroids

- Saucer contact costs one heart.
- Spark contact costs one heart.
- Spin defeats a small saucer.
- Star Beam defeats a saucer.
- Gust stuns but does not defeat.
- Reflected spark defeats a saucer.
- Ordinary asteroid contact costs one heart.
- Spin does not destroy ordinary asteroids.
- Cracked asteroid breaks from beam or two spins.
- Ambient jellyfish contact costs nothing.
- Ambient entities never increase counted note total.

### Counted notes

- Note-bearing saucer reveals pre-existing hidden note on any valid defeat.
- Counted-note total is fixed at build/load time.
- Respawned saucer after note collected does not create another note.

### Finish

- Black hole stays inactive at three Snoozles.
- Black hole activates at four Snoozles (`FINISH.onAllAwake`).
- Touching inactive hole does not trigger win.
- Waking fourth Snoozle alone does not trigger win.
- Entering active portal triggers warp tunnel then win.
- Win subtitle reads `The stars are singing!` (or authored FINISH string).
- Level 1–3 FINISH flows unchanged.

### Level traversal

- Launch Dock → Asteroid Garden → Candy Planet route is completable without
  soft-lock.
- Crystal Planet interior enter/exit works; gravity restores inside.
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
- not enemy behaviour in earlier levels
- not note counts in earlier levels
- not controls in earlier levels
- not layouts or win logic in earlier levels

Test infrastructure may be extended as much as needed.

The harness will need to learn how to boot `LEVEL4`. That is expected and is
not a warning sign.

The line is between teaching the harness a new trick and changing what Levels
1–3 are asserted to do.

This specification is frozen for implementation.

**Do not** revise its gameplay design during implementation unless the designer
changes it after playtesting.
