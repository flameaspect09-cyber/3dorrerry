# Audit: how astronomical objects are described in Orrery Sky (task 4D-2A, audit only)

Date: Nov 13, 2026. No code was changed. Method: read `index.html`, `sky.js`, `sky-math.js`, `scene.js`, `eclipse-local.js`, `keyboard.js`, `joystick.js`, and ran the real `sky.js` card code under the smoke-test stubs for 10 URL cases to copy the real text (strings quoted below are real output). NOT looked at in a real browser.

## 1. What is drawn, and what text exists for it

Drawn in the sky: the Sun, the Moon, 7 planets (Mercury to Neptune) and 17 bright stars. Nothing else (no Milky Way, constellations, other stars, dwarf planets, comets, satellites).

Text about objects appears in only five places:
1. Top-bar buttons "Sun" and "Moon" (tooltip only says "Turn to look at the Sun/Moon").
2. The live line in the info card (`#live`), e.g. `Sun -51° high, Moon -7° high, 16% lit. Faintest visible magnitude 6.5. Planets visible: saturn 0.7, uranus 5.6.`
3. The card header for event links (`ev=`): "Free sky", "Opposition", "Conjunction", etc., plus one or two lines.
4. Eclipse cards (`ev=solar`, `ev=lunar`): type, magnitude, duration, contact-time table, notes.
5. The hint line and canvas label: controls only, nothing about the sky.

## 2. Per object

| Object | Has a description? | What exists today | Missing |
|---|---|---|---|
| Sun | No (partial) | Button; "Sun N° high"; solar-eclipse card is detailed | What it is; direction; sunrise/sunset context |
| Moon | No (partial) | Button; "Moon N° high"; "N% lit"; lunar-eclipse card | Phase NAME (waxing/waning data exists, `moon.waxing`); direction |
| Mercury, Venus, Mars | No | Name + magnitude in the live line, only while above the horizon and brighter than the limit | Everything else (see below) |
| Jupiter, Saturn, Uranus, Neptune | No | Same as above | Everything else; Saturn ring tilt shown nowhere as text |
| 17 stars | No, and they are not named anywhere on screen | Nothing | Name, brightness, what it is |

Counts: 0 of 26 drawn objects has a description of what it is. 2 of 26 (Sun, Moon) can be found with a button. 7 planets appear as a lowercase name + number in one line, sometimes. 17 stars have no text at all.

## 3. Unclear or incomplete (real examples)

1. **Negative altitude read as "high":** `Sun -51° high`, `Moon -7° high`. Should say below the horizon.
2. **Lowercase planet names:** `Planets visible: saturn 0.7, uranus 5.6` and `mercury is lost in the Sun’s glare` (engine names are lowercase and are shown as-is).
3. **Magnitude is never explained:** `0.7`, `-4.2`, `Faintest visible magnitude 6.5`. Nothing says smaller or negative = brighter.
4. **Moon:** `16% lit` has no phase name. In a total lunar eclipse it still says `100% lit` next to `Lunar eclipse in progress`, which reads as contradictory.
5. **Event headers do not name the planet:** `Opposition`, `Greatest elongation`, `Conjunction` (the `look=` planets are not named; the conjunction line gives a separation but not between which planets). The words themselves are not explained.
6. **Negative hours:** `Showing the nearest visible time, -6.3 h away.`
7. **Eclipse jargon not explained:** umbral/global magnitude, annular, penumbral, C1 to C4, P1 to P4, U1 to U4. (The eclipse card is otherwise the most complete text in the app.)
8. **Safety gap:** the solar-eclipse filter warning exists only for the `ev=solar` link. In any other view, the live line can say `Solar eclipse in progress: N% of the Sun covered.` with no warning. (Read from code; not reproduced with a test case.)
9. **No direction:** only altitude is given, never a compass direction, except that the Sun and Moon buttons turn the view. There is no way to find a planet or star.
10. **No legend in the Free sky card:** nothing says what the dots, discs, or the brightest "stars" are. Planets change from a point to a disc when zoomed; the text never mentions it.
11. **Live line is re-read in full by screen readers on every update** (already noted in 4D-1; still true).
12. **`look=` accepts the Sun, the Moon and planets but not stars** (`find()` in `sky.js`).

## 4. Data already computed but never shown

Planets: `illum` (lit fraction), `phase` angle, `semi` (apparent size), `dist` (AU), `sep`; Saturn `ring.B` (ring tilt). Moon: `illum`, `waxing`, `dist`, `semi`. Sun: `dist`, `semi`. Stars: `name`, `mag`. So most missing descriptions could be written from existing data, with no new astronomy. Not yet available: star constellation names, star types/distances, planet facts (these would be new text content).

## 5. Suggested order for later tasks (NOT done; for the user to decide)

1. Fix wording only: capitalised names, "below the horizon", phase name, planet name in event headers, one-line explanation of magnitude.
2. Add a short "what is it" line per Sun, Moon and planet (from existing data).
3. Add star names (the 17) and a way to find any object (direction text or look buttons).
4. Explain eclipse terms; show the safety warning whenever a solar eclipse is in progress.

## 6. Limits of this audit

Based on reading code and stubbed runs, not a real browser. Wording quality was judged by me, not tested with users or a screen reader. The Orrery side (the app that links here) was not in the ZIP and was not inspected.
