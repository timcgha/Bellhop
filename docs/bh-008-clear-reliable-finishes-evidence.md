# BH-008 clear and reliable finishes — evidence map

The `clear-reliable-finishes` pull-request job builds the candidate and the
authorized base `60890b569593211013217c0be60974e041983e4a` (tree
`df863400c7a9e5e02785f439c192443bfe546544`). It requires the focused
deterministic test to fail on that base and pass on the candidate, then repeats
the comparison in Chrome. The uploaded artifact is
`clear-reliable-finishes-browser`.

| Acceptance | Deterministic evidence | Chrome evidence |
| --- | --- | --- |
| AC-01 — compact, readable shared finish presentation | `candidate-deterministic.log`: exact title, palette, 7.036:1 title contrast, non-repeating entrance, reduced-motion rule | `candidate-result.json`: computed styles, geometry and rendered-pixel counts; `candidate-*-representative-victory.png` |
| AC-02 — correct identity for all six levels | Six-level FINISH registration/message matrix in `candidate-deterministic.log` | Six exact 844×390 captures and `candidate-844x390-six-level-render-sheet.png` |
| AC-03 — responsive, safe-area-aware and unobstructed | Safe-area and short-landscape rules in the focused suite | 390×844, 1280×720, 932×430, and 667×320 reduced-motion captures plus control-intersection records |
| AC-04 — once-only finish and clean lifecycle | Peak fanfare count plus keyboard, touch, Gamepad, restart/switch and auto-return assertions | `candidate-result.json` return matrix, active resize/orientation record, and pause rejection |
| AC-05 — safe ordinary Peak approach after 4/4 | Continuous KeyW journey from z=-608; no heart loss, death or recovery; unchanged keyboard trigger | Ordered `candidate-peak-01-*`, `02-*`, and `03-*` frames with timestamped state points |
| AC-06 — guarded Peak trigger | Before-4/4, lava/recovery, nearby-space, and settled-overlap negative assertions | Exact-base failure and candidate journey records in `baseline-result.json` and `candidate-result.json` |
| AC-07 — authored behavior and broader regressions preserved | Full `node tests/run.js` gate plus the existing Peak/finish suites | Existing PR jobs (general, movement, phone landscape menu, Web Hero) and authored celebration flags in the focused Chrome result |

The Peak prerequisite fixture wakes all four Snoozles with positioned normal
spin input. It never teleports into the keyboard trigger, calls `triggerWin`,
injects `won`, or replaces the final walk. Other six-level render fixtures
use normal Snoozle spin input and position Pling only at each authored finish
destination; Snowbound additionally labels the completed sled prerequisite.
These are automated Chrome checks, not physical-device or human-play evidence.
