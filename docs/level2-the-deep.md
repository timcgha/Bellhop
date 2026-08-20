# Level 2 — The Deep

Design by the six-year-old. Written up to the beat structure in
Bellhop_claude.md. This is the spec; levels/level2.js is the implementation.

## Premise

The lullaby reached the sea. Four Snoozles are asleep on the ocean floor, and a
giant conch shell at the end of the trench is where they live. Its door is shut
until all four are awake.

## Level picker

Bellhop now has two levels, and both are always available. There is no unlock
requirement.

The start card shows two large visual level cards:

- Level 1: the meadow and windmill.
- Level 2: the ocean and giant conch.

The pictures must be enough for a child to choose without reading. Small text
labels may exist for adults, but text must not be required to understand the
choice.

Touch taps a card. Keyboard and gamepad move the highlighted choice left and
right and confirm with the normal start/jump button. The highlighted card must
have an obvious visual selection state.

This replaces the existing press-anything-to-start flow. An arbitrary key,
tap, or gamepad press must not bypass the picker and start Level 1 directly.
Starting the game now means confirming the highlighted level card.

Level 1 remains fully replayable and its existing win flow does not change.

## What is different about being underwater

Everything you already know how to do still works. The water changes how it
feels, not what the buttons do.

- Gravity is about a fifth of normal. Jump and you rise, hang, and drift back
  down. Falling is never dangerous.
- The air-puff is a second swim stroke. Two strokes then sink, exactly the
  same rhythm as Level 1, just slower and higher.
- Holding jump after the second stroke still slows the descent and matters
  more here than it did on land.
- B always gusts underwater, whether swimming or standing on the seabed.
  The ground-pound/slam does not exist underwater. Pressing the slam/gust button
  while swimming performs the underwater gust. With bubble power, that same
  gust fires a bubble forward.
- There is no dive mechanic. There is no third-jump-press behavior. Descending
  is intentionally slow. Level geometry, especially the Wreck, must leave enough
  room that overshooting a platform is not severely punishing. If descent feels
  too slow in playtesting, tune the underwater physics profile rather than
  adding another control.

**Important:** buoyancy is a property of the level, not a global change.

Level 1 must play exactly as it does today. The physics profile belongs in the
level data, with Level 1 carrying its current physics values explicitly.

If changing Level 2 alters Level 1, the split is in the wrong place.

gravity: -6, maxFall: -6, jumpV: 5.5 are starting values, not settled ones.

Every number in Level 1 was arrived at by playing, not by reasoning, and these
deserve the same treatment. Implement them as named Level 2 values, play the
level with the designer, and tune only the underwater profile.

## The bubble power-up

Crates in this level hold bubble power instead of fire power.

One power-up per level is a rule worth keeping. It is a large part of what
makes levels feel distinct.

The gust already works underwater: it pushes kelp, scatters fish, and shoves
things it would normally shove.

With bubble power, the same gust also fires a trapping bubble.

Same button, same move, upgraded. Nothing new to relearn.

A bubble that traps a note-bearing creature lifts it for a moment and then pops,
revealing the music note that creature was already holding.

The note is not created at defeat time.

## Counted-note rule

Anything finite and deliberately placed in the level may hold a counted music
note.

That note exists in the level from build time and contributes to notes.length
from the beginning. Defeating or bubbling the creature reveals the existing
hidden note rather than spawning a new one.

The note can only be revealed and collected once.

This follows the same pattern already used by dust piles in Level 1.

A creature rebuilt or respawned after its note has already been collected does
not create another note.

A valid way of defeating a note-bearing creature must never make 100% note
completion impossible. If a shark holds a note, defeating it by spin,
jump-jet, or bubble reveals the same note.

Anything unlimited, ambient, or respawning does not award a counted note.

Ordinary schooling fish therefore give a pop, sparkles, and a sound when
bubbled, but no counted collectible.

## Renewable-power rule

Any mandatory obstacle requiring a losable power must have a renewable source
of that power nearby.

For The Deep, a giant clam can repeatedly provide bubble power near a mandatory
bubble obstacle.

A child who loses bubble power immediately before a required spikefish must
never be forced into long backtracking or become stuck.

These two rules should later be promoted into Bellhop_claude.md:

1. Counted collectibles come from finite, pre-existing level sources and valid
   play must never permanently prevent 100% completion.
2. Mandatory obstacles that require a losable power have a renewable source of
   that power nearby.

Do not edit Bellhop_claude.md as part of this spec commit.

Like the fire power-up, bubble power is kept until something hits you.

## Creatures

### Sharks

Sharks swim toward the player and bite.

Spin, jump-jet, and bubbles can defeat them.

They patrol at a fairly steady height with a slow, lazy bob so a six-year-old
can actually line up an attack.

Placed sharks may hold music notes. If a shark holds a note, any valid method
of defeating it reveals that same hidden note. Bubble defeat is the most
spectacular version: the shark is trapped, floats upward briefly, then the
bubble pops and reveals the note.

### Ordinary fish

Many kinds and colours drift in schools.

They are harmless.

They scatter when the player approaches. Swimming through a school may gently
shove the player off course, which should feel funny rather than punishing in
the floaty physics.

Bubbling an ordinary fish gives a satisfying pop, sparkles, and sound but no
counted music note.

### Note fish

Some schools contain a visibly special golden, shimmering fish.

These are finite, placed note-bearing creatures.

A note fish holds an existing hidden music note. Bubbling it reveals that note.

It should be visually obvious enough that a child can understand that this fish
is special without reading anything.

### Spikefish

Spikefish are obviously spiky, slow, and follow a fixed drifting route.

A warning sound plays as the player gets near one.

Touching one costs a heart.

Spin and jump-jet do not defeat it.

A bubble is the only way to remove it.

Placed spikefish may hold an existing hidden music note. Bubbling one reveals
its held note.

The simple rule should be:

Sharks are for hitting. Fish are for bubbling.

## The route

Six areas. The overall structure follows the corridor-and-room rhythm of Level 1,
with coral and kelp replacing hedges.

### 1. The Shallows

Opening moment.

Bright, sunlit water, white sand, coral, and colourful fish.

Show off the underwater environment before asking the player to do anything
difficult.

There are gaps too wide to cross like a normal Level 1 jump but easy to float
across, teaching buoyancy before anything can hurt the player.

Colourful ordinary fish scatter as the player approaches. This establishes
that fish are harmless before spikefish appear.

Snoozle 1 sleeps in an open clamshell in plain sight.

### 2. The Kelp Forest

Tall kelp sways and parts.

Early on the normal route, place a kelp curtain that visibly parts when hit by
the gust. This safely teaches that gust can move kelp.

Later the secret uses the same visual language, rewarding memory rather than
random button pressing.

Introduce bubble power here.

First give the player a bubble source, then show a large obvious school of
harmless fish containing one golden note fish.

Bubble → pop → music note.

The rule should teach itself before anything dangerous appears.

Then introduce one shark alone in a clearing.

The existing combat moves still work on it, showing that old knowledge remains
useful underwater. Bubble also works if the player experiments.

Snoozle 2 sleeps on a rock shelf that the player floats up to.

The teaching order matters:

fish → bubble → note

then

shark → what you already know still works

then later

spikefish → so that is what the bubble is for

### 3. The Shoal

Introduce the first spikefish in open water where the player can see it coming
and safely swim around it.

Later, use one in a narrow passage where it must be bubbled to pass.

This is the only forced use of bubble power in the level.

Put a renewable bubble clam beside this mandatory obstacle so losing the power
cannot trap the player.

### 4. The Wreck

This is the major challenge and one of the designer’s core ideas.

Show the wreck before the player reaches it.

Give ten or fifteen seconds of open-water approach toward an enormous tilted
sunken ship so the player understands where he is going before entering it.

The ship should announce itself visually.

Enter near the keel and travel upward through broken decks, using swim strokes,
ledge landings, and slow floating through openings in the floors.

One shark patrols a middle deck.

A spikefish moves vertically through the main shaft.

Snoozle 3 sleeps in the crow’s nest at the top.

Put a checkpoint at the entrance and another about halfway through.

Because there is no fast-dive mechanic, the wreck must be laid out with enough
vertical and horizontal room that overshooting a deck costs a little time but
does not become frustrating.

If descent proves tedious during the first real playtest, tune the underwater
gravity profile rather than adding a new button or dive mechanic.

### 5. The Trench

Dark, narrow, and bioluminescent.

A couple of sharks occupy water with less room to dodge than earlier areas.

Snoozle 4 is here.

The optional hard challenge is a side alcove containing several notes and
guarded by two spikefish in a tighter space.

It is optional. Ignoring it never blocks completion.

### 6. The Conch

A giant conch shell sits on an open sand plain.

Its door is shut and dark.

When the fourth Snoozle wakes, the conch begins glowing and its door opens.

The player must then swim inside to finish.

## The finish

Waking the final Snoozle is the climax.

Entering the conch is the finish.

These are deliberately separate moments.

Woken Snoozles swim back to the conch the same way Level 1 Snoozles fly back to
the windmill.

When the fourth Snoozle wakes, the conch’s spiral lights up and the entrance
opens. This is the visual instruction to go there; no text is required.

Only when the player swims through the open entrance does the win sequence
trigger.

Inside:

- the conch spiral glows brightly
- every music layer plays
- the Snoozles dance
- the water surface high above brightens with a visible rainbow

The existing CONGRATULATIONS YOU WIN! banner remains unchanged. The designer
likes it.

## One clever secret

Later in the Kelp Forest is a wall of kelp that appears solid.

The player has already seen a normal-route kelp curtain part when hit by gust.

Using gust on this wall parts it and reveals a hidden alcove with music notes.

The secret rewards remembering an old move in a new environment.

## Tests to add

Follow the existing pattern in tests/.

### Stage 1 / level framework

- Selecting Level 1 boots LEVEL1.
- Selecting Level 2 boots LEVEL2.
- Booting Level 2 does not alter Level 1 physics or expected values.
- The old press-anything start path cannot bypass the level picker.

### Underwater movement

- Level 2 jump apex is higher and descent is slower than Level 1.
- Level 1 jump apex remains 1.75.
- The player gets two swim strokes and then sinks.
- Holding jump after the second stroke slows descent.
- There is no third-press dive behavior.
- B while swimming performs underwater gust.
- Level 1 movement and controls remain unchanged.

### Creatures and bubbles

- Bubble interaction reveals the existing held note rather than creating an
  uncounted note.
- A shark holding a note reveals the same note whether defeated by spin,
  jump-jet, or bubble.
- Ordinary fish contact costs nothing.
- Ordinary fish bubbling does not increase the counted note total.
- Bubbling a note fish reveals its held note.
- Spin defeats a shark.
- Spin does not defeat a spikefish.
- Jump-jet does not defeat a spikefish.
- Spikefish contact costs a heart.
- Bubble defeats/removes a spikefish.
- A renewable clam can restore bubble power after it is lost.

### Finish

- The conch door stays shut at three Snoozles.
- The conch door opens at four Snoozles.
- Entering the shut door does not trigger the win.
- Entering the open door triggers the win.

### Level traversal

- The Wreck shaft is completable. Sample points through the climb using the
  same kind of approach level.test.js uses for Level 1.
- The mandatory spikefish passage always has access to renewable bubble power.

## Do not change

Level 1.

No Level 1 gameplay expectation or expected value may change because of Level 2:

- not the 1.75 jump apex
- not enemy behaviour
- not the note count
- not the controls
- not the layout
- not the win logic

Test infrastructure may be extended as much as needed.

The harness will need to learn how to boot LEVEL2. That is expected and is not
a warning sign.

The line is between teaching the harness a new trick and changing what Level 1
is asserted to do.

This specification is frozen for implementation.

**Do not** revise its gameplay design during implementation unless the designer
changes it after playtesting.
