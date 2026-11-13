# Orrery Sky - Phase 2 report (the scene, FIRST BUILD)
Nov 11, 2026. Not published. NOT run in a real browser or on a GPU. Serve over http (`python3 -m http.server`), needs internet for three.js r128 (cdnjs).

## Built (code-only shapes, no models)
- Glass dome (7 m wide, 4.5 m high, ribbed, door gap), stone base, grated floor with 14 ring lights, round door that swings outward when you come within about 3 m, step.
- Terrace 14 x 8 m with flagstone texture, low stone wall, mesh fence on rust posts (front and both sides).
- Rock mountain behind the dome, rock shelf, steep cliff below the wall, dark foreground hills.
- City far below (a generic stage): about 7,000 light points, 1,400 low boxes (seen by day), 9 lit towers, one curved highway of white and red lights. Lights fade on from Sun altitude 0 to -6 deg.
- Sky coupling: day/night lighting from the real Sun and Moon, fog colour from the horizon, city glow in the sky dome, and a "City glow" slider that lowers the faintest visible magnitude (up to 2.5 mag at night).
- Walking: WASD (Shift = faster), 1.65 m eye height, look-down limited to 35 deg, dome floor and terrace one walkable area joined only through the door, fence and glass are boundaries. Buttons: Dome, Terrace.
- Sky objects now live in a group scaled x20 that follows the camera, so mountains and the dome can hide stars, Sun and Moon.

## Tests (Node, stubbed three.js; 43 checks in total across `tests/run-all.sh`)
walk rules: 9 pass (door route, glass blocks, fence stops, 20,000 random walks never left the walkable area). Smoke test: all 12 link cases run with the scene loaded. The smoke test caught a real bug (city buffers too small, would have thrown in a browser); fixed.

## Download (measured, files only)
Our files and engines about 80 KB raw (about 35 KB gzip); Moon texture 541 KB; total about 620 KB raw. three.js is extra (about 150 KB gzip was estimated earlier, not measured). Still to come: star catalogue (100-250 KB estimated) and Milky Way (227 KB), so the 1.5 MB target looks reachable but is NOT confirmed.

## NOT done or NOT verified
1. Frame rate: unmeasured. About 18 mesh creations plus 7,800 light points, 1,400 instanced boxes: my estimate is under 100 draw calls, not counted in a browser.
2. Look: nothing compared with the concept image yet. Colours, glass look and reflections, glow strength are first guesses. Glass reflections of the interior at night are not built.
3. Door gap: the dome rib layout leaves the door side open; the door frame is a plain torus. Moon and stars inside the dome may look washed out or fine: unknown.
4. Touch joystick: cut (touch can look and zoom, not walk). Low mode, accessibility pass: Phase 4.
5. Curved wall and fence are straight in this build (concept image has them curved).
6. City is random, with no named layout; tower cluster is south. Terrace faces south.
7. Day city is simple grey boxes with fog; "day needs its own check".
8. The earlier Phase 1 gaps remain (Milky Way, 17-star list, Moon tilt, local eclipse numbers).
Phase 2 "done when" (walk dome to terrace, see city and sky, frame rate and download in target) is therefore only partly met: walking logic is tested; seeing and speed are unconfirmed.

## Update: look controls (Nov 11, 2026)
Reported reversed. Cause: mouse/touch drag was "grab the sky" (drag right turned the view left, drag up looked down). Now drag right looks right and drag up looks up. Arrow keys were already look-left/right/up/down by my reading of the code and are unchanged. A "Flip look" button reverses BOTH drag and arrow keys (remembered on the device). Tested with stubbed DOM events (10 checks); the on-screen result was not seen in a real browser.

## Update: fence, toolbar, orientation (Nov 11, 2026), from your screenshot
- Fence was too high: top was 1.8 m, above the 1.65 m eye height. Now wall 0.5 m and fence top 1.2 m above the terrace (about 0.45 m below eye height).
- "City glow" slider sat above its label: toolbar CSS fixed (inline-flex). Not seen in a browser.
- Sun path: the city was to the SOUTH, so the Sun (east to west) crossed left to right. The whole scene is now rotated so the door, terrace and city face EAST. The Sun rises in front over the city and sets behind over the mountain. The real sky is unchanged; only the scene moved. The tested Node checks cover the coordinate conversion and walking; the on-screen result is unverified.

## Update: door and walking feel (Nov 11, 2026)
- Door: no longer opens by itself (old rule: opened when you were within 3.2 m of it, which is far too far). Now you must stand within 1.4 m of the handle, face it, and press E (or the new "Door (E)" button). A hint appears on screen ("Press E to open the door"). The door is a wall while shut and only becomes walkable once it has swung mostly open (about 0.5 s). It will not close while you stand in the doorway or its swing area. You start inside the dome with the door SHUT. The open panel is not a collision object (you can walk through the space it sweeps).
- Walking: speed is now smoothed (about 0.3 s to reach full speed, about 0.3 s to stop) instead of instant full speed; walk 1.5 m/s, run (Shift) 3.0 m/s; diagonal no longer faster. Head bob (about 6 cm up and down, one per step) and side sway (under 2 cm, one per two steps) follow the distance actually walked, so walking into a wall does not bob. Reduced motion (browser setting) cuts bob and sway to 20%. No footstep sounds.
- Tested in Node (walk.test.js, 23 checks, plus 16 and 28 in the other files): door blocking, reach, doorway rule, start and stop timing, bob size. NOT seen in a real browser: whether the bob size, 0.3 s smoothing and speeds feel right on your device are guesses to tune from your feedback.
