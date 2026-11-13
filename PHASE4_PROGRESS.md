# Phase 4 progress (Orrery Sky)

Last updated: Nov 13, 2026 (4F-1C final verification). Nothing published. This final project build was not tested in a real browser, on a real GPU or phone, or with a screen reader. Visual appearance and actual device performance remain unverified. An earlier 4B-1 shader comparison was rendered once in headless Chromium with software GL, but that does not verify the current full viewer or how it looks on a real device.

## Prerequisite check
Jonathan says Phases 1-3 are done. The Phase 1-3 reports say their "done when" targets are only partly met (see PHASE1/2/3_REPORT.md: Milky Way, 17-star list, time zones, cities.json, Orrery-side link code, real-browser test, frame rate). None of those gaps blocks planet disks, so 4A-1 went ahead. They stay open.

## Done: PROMPT 4A-1 planet disk rendering
- Planets stay POINTS at normal fields of view. When a planet's true angular size becomes big enough on screen, the point cross-fades to a flat-colour procedural disc (no textures).
- Cross-fade starts when the disc diameter is 0.6x the point size and is complete at 1.2x (PROPOSED thresholds, to tune on a real device).
- Disc size = true angular size, so it grows as the field of view narrows (diameter in pixels = screen height x tan(semi-diameter) / tan(fov/2)).
- Positions, brightness (magnitude), visibility limit and stars are NOT changed. Disc opacity uses the same brightness-based alpha as the point; planets below the horizon draw neither.
- NOT done in 4A-1 (4A-2 added Venus phase shading only): other planets' phase shading, Saturn's rings, limb darkening, surface detail. Saturn's disc is the globe only (60,268 km), no rings.

### Modified / new files
- `sky-math.js`: planets now also return `dist` (AU) and `semi` (apparent semi-diameter, degrees); new exports `diskPx`, `diskBlend`, `PLANET_KM`, `AU_KM`. Existing outputs unchanged.
- `sky.js`: 7 planet disc sprites, `applyDisks()` (runs every frame, because zoom changes between time updates), `SkyHook.disks()` and a `SkyHook.fov` getter/setter for tests.
- `tests/disks.test.js` (new, 31 checks), `tests/ref/planet_baseline.json` (new: positions/magnitudes/stars snapshot taken BEFORE the change, 24 date/place cases), `tests/run-all.sh` (runs the new test), `PHASE4_PROGRESS.md` (new).

### Tests actually run (Node, stubbed three.js): `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks = 138 checks, 0 failed (107 before this change).
What they show: planet diameters (1900-2100) fall inside published ranges; zoom maths; planet alt/az/magnitude/limit/stars identical to the pre-change snapshot; Jupiter is a point at fov 60 and 30, a full disc by 2 degrees; on-screen diameter doubles when fov halves; disc world size is constant; below-horizon planets draw nothing; device pixel ratio 1.5 behaves.
What they do NOT show: how it looks, frame rate, whether sprite sort order against Sun, Moon, dome and terrace is right on a real GPU.

### Known limits / unfinished
- Point sizes are in device pixels; discs are compared in the same unit. Not checked on a real screen.
- Thresholds 0.6x / 1.2x and the 6% soft edge are first guesses.
- Disc colours reuse the point colours (not measured planet colours).
- At 0.2 degrees (the current zoom floor) Uranus is about 5 px and Neptune about 3 px wide; Jupiter about 67 px. The floor was not changed.
- Perspective stretch at the screen edges is ignored (size is computed for the view centre).
- Planet discs are additive-blended like the points; against a bright daytime sky this may look washed out. Unverified.
- Still open from Phases 1-3: see the reports.

## Done: PROMPT 4A-2 Venus phase shading (VENUS ONLY)
(The number 4A-2 is my label: the earlier note planned 4A-2 as Venus, Mercury and Mars together; this request was Venus only, so Mercury and Mars move to 4A-3.)
- Venus's disc now shows its lit part. Planet points, the 0.6x/1.2x cross-fade, disc size, opacity, positions, magnitudes, limit, stars and all other planets are unchanged (the pre-change snapshot test still passes).
- **Lit fraction**: phase angle i = Sun-Venus-Earth angle from the planet and Earth distances already used for the magnitude; lit fraction = (1 + cos i) / 2. Both are now returned for every planet as `phase` (deg) and `illum`.
- **Terminator**: `SkyMath.phaseDisk(N, fill, i)` makes RGBA pixels of a lit sphere (Sun toward the top). Terminator = where the sphere normal is 90 deg from the Sun. Gibbous, half and crescent come out of the same formula. Unlit side is fully transparent. Rim keeps the 4A-1 soft edge (opaque to 0.94 of the half width).
- **Orientation**: the Sun is at the TOP of the texture. Each frame the sprite is turned by `-SkyMath.screenAngle(Venus, Sun, yaw, pitch)`. screenAngle projects the planet and a point a little toward the Sun through the real camera (yaw, pitch, perspective), so it includes the convergence of vertical lines off the view centre (about 3.5 deg at 4 deg off-centre at altitude 60). Uses TRUE (unrefracted) alt/az of Venus and Sun (`trueAlt` now returned for planets and `sun.trueAlt`).
- **Updates**: orientation every frame (camera, place and time all change it). The texture is redrawn only when Venus is shown as a disc AND the phase angle moved 0.25 deg or more (1.2 ms per redraw in Node; browser cost not measured).

### Modified / new files (4A-2)
- `sky-math.js`: planets return `trueAlt`, `phase`, `illum`; `sun.trueAlt`; new exports `limbAngle`, `toCam`, `screenAngle`, `phaseDisk`. Nothing existing removed or changed in value.
- `sky.js`: Venus disc sprite uses its own CanvasTexture (`vn`, `drawVenus`, `VI=1`); `applyDisks` sets Venus rotation each frame; `SkyHook` gains `venus()`, a `pitch` setter, and `rotation`/`shaded` fields in `disks()`.
- `tests/venus.test.js` (new, 48 checks), `tests/ref/make_venus_ref.py` and `tests/ref/venus_ref.json` (new, 36 PyEphem cases), `tests/run-all.sh` (runs the new test), `PHASE4_PROGRESS.md`.
- NOT changed: eclipse-local.js, scene.js, walk.js, index.html, engines, textures, other test files.

### Tests actually run (Node, stubbed three.js): `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks + 48 venus = **186 checks, 0 failed** (138 before).
What the 48 show:
- Against PyEphem 4.2.1 (VSOP87, independent of Orrery's elements), 36 cases 1900-2099, 8 places incl. southern hemisphere: lit fraction worst difference 0.00013; direction from Venus to the Sun worst 0.09 deg; Venus alt/az worst 0.026 deg. (Tolerances in the test, 0.003 / 0.5 deg / 0.1 deg, were set AFTER measuring; they are my choices.)
- Over Venus's cycle: thinnest crescent 1.03% (2025-03-23) and 0.60% (2026-10-24), PyEphem 1.04% and 0.61%; about 1.00 lit at superior conjunction 2026-01-06; 0.49 lit at greatest elongation (47.3 deg).
- Texture geometry at 512 px: exactly left-right symmetric; lit area equals (1+cos i)/2 within 0.02 at 7 phases (measured within 0.002); terminator crosses the axis where the sphere maths puts it (within 2.5 px); lit side up; quarter phase is exactly half; full phase round; new phase (180) transparent, no ring; nothing outside the disc.
- screenAngle equals a second, independent camera-basis projection in 21 views (worst 4e-11 deg); at the view centre it equals the zenith-based angle.
- Viewer (stub): Venus disc uses the phase texture and the other 6 do not; texture drawn once with the current phase; camera panning changes the rotation, does not redraw; one minute later no redraw, one week later one redraw; changing place changes the rotation and it still matches the independent value; below-horizon Venus draws nothing; wide fov still a point; Jupiter still a flat unrotated disc.
- Mutation checks (by hand, not a script): flipping the rotation sign, flipping the Sun side in the texture, flipping the illumination formula and removing the texture redraw each made the tests fail (6, 3, 6 and 4 failures or a crash); source restored afterwards and re-run clean.
- I also rendered the texture to a PNG with Python and looked at it (gibbous to crescent, lit side up). That is a picture of the pixel data, not of the viewer.
What they do NOT show: how it looks in the real viewer, on a real GPU or screen; frame rate; sprite sort order.

### Mistakes made while testing (found and fixed)
- I first wrote the inferior-conjunction dates from memory wrongly (2025-06-01; that is greatest western elongation). The engine was right; PyEphem confirmed 2025-03-23 and 2026-10-25. Test fixed.
- A "Sun due east = 90 deg" test was wrong (a great circle between two points at the same altitude bends). Fixed with a tiny offset.
- First texture had a faint ring at new phase (rim normal at z=0); fixed by using the normal at 0.995 of the radius for the rim.

### Known limits / unfinished (4A-2)
- NOT seen in a browser. The sign convention (three.js r128 Sprite rotation is counter-clockwise, so rotation = -clockwise angle) comes from reading the sprite shader maths, the same assumption the Moon tilt code makes. If the lit side points the wrong way on screen, flip the sign in `applyDisks` (`vn.rot`). The tests cannot catch a wrong sign in three.js itself.
- Shading is illustrative and tuned by eye, never seen live: terminator softness (smoothstep over +/-0.06 of the cosine), fall-off toward the terminator (75-100%), flat white times Venus colour (1, 0.97, 0.9).
- No earthshine or ashen light on the dark side; no cusp extension, no Schroeter effect, no cloud markings, no limb darkening beyond the mild fall-off.
- Texture is 128 px. Venus is at most about 63 arcsec; at the 0.2 deg zoom floor that is 92 px (1000 px canvas) or 137 px (1500 px device pixels): slightly soft at the top end. Not enlarged.
- Brightness at the hand-over: the point (magnitude-based) fades out as the disc fades in. A thin crescent disc has far less light than the round point it replaces, so near inferior conjunction the hand-over may look like a dim-down. Not tuned.
- Orientation is computed for the planet's centre; stretching at screen edges is ignored (same as 4A-1 sizes). Orientation uses unrefracted positions, while the sprite sits at the refracted position (differences well under 1 deg near the horizon).
- Venus is found by fixed index (`VI=1`, order mercury, venus, mars, ...).
- Reference is PyEphem, not an official almanac. Reference data was generated in this sandbox (`pip install ephem`).
- Everything open from Phases 0-3 and 4A-1 is still open (Milky Way, 17-star list, time zones, cities.json, Orrery-side link code, real-browser test, frame rate, wall and fence curved, touch joystick, Phase 0 audit).
- The master handoff file (`Orrery_Sky_MASTER_Handoff.md`) was NOT updated. It still shows Phase 3 as part A only and has no Phase 4 entry.

## Done: PROMPT 4A-3 phase shading for Mercury and Mars
- Mercury, Venus and Mars discs now carry phase shading. Jupiter, Saturn, Uranus, Neptune keep the flat disc. Planets stay POINTS at normal fields of view; the 4A-1 cross-fade, disc size, opacity, positions, magnitudes, visibility limit and stars are unchanged.
- **Lit fraction**: unchanged maths from 4A-2, already returned for every planet: `illum = (1 + cos i) / 2`, i = Sun-planet-Earth angle. 4A-3 only checked it for Mercury and Mars (below).
- **Orientation**: same as Venus: texture drawn lit side UP, sprite turned every frame by `-SkyMath.screenAngle(planet, Sun, yaw, pitch)` (includes perspective convergence), using true (unrefracted) alt/az.
- **Updates**: each planet has its own 128 px canvas texture and state (`phs[i]` in sky.js). A texture is redrawn only while that disc is shown AND its phase angle moved 0.25 deg or more. Mercury's phase moves about 3 to 4 deg per day, so it redraws often when time runs; Mars moves about 0.1 deg per day, so rarely. Camera moves only change rotation.
- **Lightweight**: three 128x128 canvases (about 64 KB RGBA each in memory), no new files shipped, no new textures downloaded. Redraw cost not measured in a browser (about 1.2 ms per redraw in Node for Venus; Mercury and Mars use the same code).
- **Venus preserved**: Venus code path is the same code as Mercury and Mars now; checked against a snapshot of the 4A-2 viewer (tests/ref/venus_baseline.json, 5 views) and the unchanged 48-check Venus suite (two of its assertions edited, see below).

### Modified / new files (4A-3)
- `sky.js`: `vn`/`drawVenus` replaced by `phs[i]` + `drawPhase(st, planet)`; `applyDisks` sets rotation for every planet that has `phs[i]`; planet names list `PN`; `SkyHook` gains `mercury()` and `mars()` next to `venus()` (all return `{phase, draws, rotation, illum}`).
- `tests/phase.test.js` (new, 78 checks), `tests/ref/make_phase_ref.py`, `tests/ref/mercury_ref.json` (46 cases), `tests/ref/mars_ref.json` (42 cases), `tests/ref/venus_baseline.json` (new), `tests/run-all.sh` (runs the new test), `PHASE4_PROGRESS.md`.
- `tests/venus.test.js`: TWO assertions edited because they described old behaviour: "only Venus has a phase texture" now says Mercury, Venus and Mars are shaded and Jupiter to Neptune are not; the Venus texture is now found by content (current Venus phase) because Mercury/Mars also draw 128 px textures; the fov-60 check now requires that NO phase texture is drawn for any planet. No Venus expectation was loosened.
- NOT changed: `sky-math.js`, eclipse-local.js, scene.js, walk.js, index.html, engines, textures, other tests.

### Tests actually run (Node, stubbed three.js): `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks + 48 venus + 78 phase = **264 checks, 0 failed** (186 before).
What the 78 show:
- Against PyEphem 4.2.1 (VSOP87), 1900-2099, 8 places: Mercury (46 cases) lit fraction worst difference 7.2e-5, direction to the Sun worst 0.33 deg (at 1 deg elongation, where a small position error swings the angle), alt/az worst 0.017 deg, apparent size within 0.2%. Mars (42 cases): lit fraction 3.5e-5, direction 0.14 deg, alt/az 0.022 deg, size within 0.1%. The tolerances in the test (0.003, 0.5 deg, 0.1 deg, 1%) were set AFTER measuring and are my choices.
- Cycles: Mars never below 0.82 lit over 12 years; Mercury under 0.05 lit near inferior and over 0.95 near superior conjunction.
- Viewer, three cases (Mercury 2025-12-06 21:36 UTC Manila, 79 deg phase angle, 0.59 lit; Mars 2025-05-01 12:00 UTC Manila, 37 deg, 0.90 lit; Mars 2025-01-10 near full, 0.998 lit): disc shown with blend 1 and phase texture; texture drawn once and byte-equal to `phaseDisk(128, 0.94, phase)`; drawn-canvas lit area equals the lit fraction within 0.02; light on the top side; sprite rotation equals an independent camera-basis projection (centred, and 3 panned views); panning never redraws; size and opacity follow the 4A-1 rules; one minute later no redraw; Mercury one day later redraws once; Mars one week later follows the 0.25 deg rule; other place gives the same phase angle; below-horizon Mars draws nothing; fov 60 draws nothing; zoom out and in again does not redraw.
- Venus: 5 views identical to the 4A-2 snapshot (rotation, opacity, size, phase, illum to 1e-12).
- Mutation checks (by hand, not a script): flipping the rotation sign (16 failures), flipping the illumination (8), wrong phase angle in the texture (18), no redraw after the first (3) and shading only Venus (crash in the new tests) were each caught; source restored and all 7 suites re-run clean.
What they do NOT show: how it looks in the real viewer, on a real GPU or screen, frame rate, sprite sort order.

### Mistakes made while testing (found and fixed)
- First Mercury "one day later" case failed: Mercury was still above the horizon but fell under the faintest-visible-magnitude limit in the viewer (the viewer's limit includes city glow, my scan did not), so the disc was correctly not drawn. Test time changed to 21:20 UTC next day. Not a code bug.
- First "Mars below horizon" case started with Mars up and counted its first draw. Case now starts below the horizon.
- I wrote one vacuous check (always true) and one with wrong operator precedence while drafting; both were removed or replaced before the final run.

### Known limits / unfinished (4A-3)
- NOT seen in a browser. The sprite rotation sign convention is the same unverified assumption as 4A-2 (three.js r128 Sprite rotation is counter-clockwise). If the lit side points the wrong way, flip the sign once at `st.rot=-M.screenAngle(...)` in `applyDisks`; that fixes all three planets together. Tests cannot catch a wrong sign inside three.js.
- Mercury is at most about 6.5 arcsec in radius: about 6 px wide at fov 0.3 on a 1000 px canvas, about 9 px at fov 0.2. The phase shape is barely visible except at the zoom floor. Mars is at most about 12.5 arcsec in radius, larger only near opposition. The zoom floor was not changed.
- Mars shading assumes a plain sphere: no polar caps, no surface markings, no limb haze. Mercury has no surface detail. Mars at near full phase looks like a flat round disc (correct for geometry, unverified for looks).
- Shading look (terminator softness, fall-off) is the 4A-2 tuning, never seen live. Flat colours reuse the point colours (Mercury 0.8/0.8/0.8, Mars 1/0.6/0.4).
- Mercury and Mars discs are found by name from the planet list (order: mercury, venus, mars, jupiter, saturn, uranus, neptune); `VI` for Venus is now looked up by name too.
- Hand-over from point to disc for thin Mercury crescents may look like a dim-down (same as Venus). Not tuned.
- Reference for Mercury and Mars is PyEphem, not an official almanac. Data was generated in this sandbox (`pip install ephem`; `make_phase_ref.py`).
- Everything open from Phases 0-3 and 4A-1/4A-2 is still open (Milky Way, 17-star list, time zones, cities.json, Orrery-side link code, real-browser test, frame rate, curved wall and fence, touch joystick, Phase 0 audit). The master handoff file (`Orrery_Sky_MASTER_Handoff.md`) was NOT updated by this task and still shows Phase 3 as part A only with no Phase 4 entry.

## Done: PROMPT 4A-4 Saturn's rings
- Saturn's disc is now a procedural globe + rings picture, drawn in code (`SkyMath.saturnDisk`, 256 x 256 RGBA, 256 KB in memory, nothing downloaded). Bands: C ring faint, B ring bright, Cassini division nearly clear, A ring medium (radii 74,658 / 92,000 / 117,580 / 122,170 / 136,775 km over the 60,268 km globe radius). The Encke gap is not drawn.
- **Shape and inclination**: the ring is an ellipse whose minor/major ratio is |sin B|, B = ring tilt seen from Earth (about -6.3 deg in Nov 2026, south face visible; edge-on 2025-03-23; maximum about +/-27 deg in 2017 and 2032). B comes from the IAU 2015 north pole of Saturn (RA 40.589, Dec 83.537, J2000) and Saturn's geocentric direction: `sin B = pole . (direction from Saturn to Earth)`. B > 0 = north face visible. Light-time ignored.
- **Occlusion**: the half of the ring BEHIND the globe is hidden by it; the half in front crosses the globe. Done inside the picture (back ring, globe, front ring). B > 0: the near half is the lower half of the picture (pole up); B < 0: the upper half.
- **Rotation / orientation**: the picture is drawn with Saturn's north pole UP. Each frame the sprite is turned by `-SkyMath.screenAngle(Saturn, a point 0.001 rad from Saturn toward the pole, yaw, pitch)`. This is the same helper, sign convention and true (unrefracted) alt/az as the Venus, Mercury and Mars phase discs (there the target is the Sun). The pole point is returned as `planet.ring.poleAlt/poleAz`.
- **Zoom**: Saturn is a POINT at normal fields. It cross-fades to the picture using the size of the whole RING system (outer ring diameter = 4.54 x globe), with the same 0.6x / 1.2x thresholds as the other planets. Measured for Saturn on 2026-11-16 (1000 px canvas, globe semi-diameter 9.5 arcsec): the picture starts fading in at about fov 5 deg (ring system 2.4 px) and is complete by fov 3 deg (4 px, a tiny smudge); the ring shape is only recognisable from about fov 1 deg (12 px) and down; at fov 0.3 the ring system is 40 px, at the 0.2 deg floor 60 px. `diamPx` still reports the globe, new `ringPx` reports the ring system.
- **Lightweight**: one 256 px canvas; redrawn only while Saturn is shown AND B moved 0.1 deg or more (B changes about 0.01 deg per day, so almost never while time runs). Sprite orientation updates every frame (cheap). Redraw cost in a browser is not measured (about 3 ms in Node for 65,000 pixels is my estimate, not a measurement).
- Globe edge: opaque to the true radius and the same soft 6% rim as the flat disc, so the globe itself looks as it did.

### Modified / new files (4A-4)
- `sky-math.js`: planets of Saturn return `ring: {B, poleAlt, poleAz}`; new exports `saturnDisk`, `ringGeom`, `RING_OUT` (2.2694), `RING_Q` (2.4). Nothing existing changed in value.
- `sky.js`: Saturn sprite uses its own CanvasTexture (`sat`, `drawSaturn`, `SI`); `applyDisks` sizes it by `RING_Q`, turns it to the pole, and drives its cross-fade by the ring extent; `dskInfo` gains `ringPx`; `SkyHook.disks()` gains `ringed`, and `shaded` is false for Saturn (shaded means phase texture); `SkyHook.saturn()` returns `{B, draws, rotation, ringB}`.
- `tests/rings.test.js` (new, 104 checks), `tests/ref/make_saturn_ref.py`, `tests/ref/saturn_ref.json` (60 cases), `tests/run-all.sh`, `PHASE4_PROGRESS.md`.
- `tests/venus.test.js` and `tests/phase.test.js`: ONE assertion each edited. They said "Jupiter, Saturn, Uranus, Neptune are unshaded and unrotated"; Saturn is now rotated by design, so they say: Jupiter, Uranus, Neptune unshaded and unrotated, Saturn not phase-shaded. Nothing else loosened.
- NOT changed: eclipse-local.js, scene.js, walk.js, index.html, engines, textures, the 4A-1 disks test, the planet baseline snapshot.

### Tests actually run (Node, stubbed three.js): `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks + 48 venus + 78 phase + 104 rings = **368 checks, 0 failed** (264 before).
What the 104 show:
- Against PyEphem 4.2.1 (VSOP87) and Meeus ch.45, 60 cases 1900-2099, 8 places: ring tilt B worst difference 0.061 deg vs PyEphem `earth_tilt` and 0.071 deg vs Meeus; sign right in all cases; direction to the north pole (from zenith-up) worst 0.55 deg vs a PyEphem + spherical-trig reference (test tolerance 1 deg); Saturn alt/az worst 0.17 deg; globe size within 0.05 arcsec. The IAU pole and the Meeus ring pole agree within 0.025 deg (a check of the constants, computed in the reference script). Tolerances (0.15, 1, 0.3, 0.2, 0.05) were set AFTER measuring; they are my choices.
- Cycle: ring plane crossing within 2 days of 2025-03-23 (|B| < 0.1 deg; engine gives 0.000 at 04h UT), B range about +/-26.9 deg 2015-2035, south face visible after 2025.
- Picture geometry (pure pixel data): symmetric; corners clear; globe rim as the flat disc; outer edge at 2.27 globe radii (within 2 px); minor axis equals |sin B| x major at two tilts (within 2 px); bands in the expected order and brightness; clear gap between globe and C ring; back half hidden and front half drawn over the globe for B = +25 and -25; B = -25 is exactly B = +25 flipped top to bottom; edge-on line thin and fainter; thickness grows with tilt.
- Viewer (stub), four cases (2026-11-16 B -6.3, 2017-09-10 B +26.9, 2031-08-19 B -26.6, 2025-06-20 B -3.5, all Manila): disc shown, blend 1, ring system 4.54 x globe; picture drawn once and byte-equal to `saturnDisk(256, B)`; sprite rotation equals an independent camera-basis projection (centred and 3 panned views) and the zenith-based pole angle; panning never redraws; sprite size and opacity rules; 1 minute later no redraw; 11 days later follows the 0.1 deg rule; same B in Sydney; cross-fade monotone, point at fov 60 and 10, full at 0.5, and rings fade in while the globe alone would still be a point; below the horizon nothing; Jupiter still a flat disc with the old size rule; Venus still shaded.
- Mutation checks (by hand, not a script): flipped rotation sign (16 failures), flipped B sign (4), swapped front/back half (2), cross-fade by globe only (6), no redraw (1), orientation to the Sun instead of the pole (16), outer ring too small (4), pole not precessed (1) were each caught; source restored and all 8 suites re-run clean.
What they do NOT show: how it looks in the real viewer, on a real GPU or screen, frame rate, sprite sort order.

### Mistakes made while testing (found and fixed)
- My first Meeus reference had the wrong sign in `sin B` (it disagreed with PyEphem by up to 56 deg); I rederived it (`sin B = sin i cos b sin(l - Omega) - cos i sin b`) and it then agreed within 0.03 deg. The Orrery code was not at fault.
- Three test flaws, not code bugs: the globe-rim check compared at a rounded pixel row instead of the true pixel radius; the Moon canvas is also 256 px so Saturn's picture had to be found by content; the "fov 60" check reused a view that had already drawn.

### Known limits / unfinished (4A-4)
- NOT seen in a browser. Sprite rotation sign is the same unverified three.js r128 assumption as 4A-2/4A-3; one sign flip at `sat.rot=-M.screenAngle(...)` fixes it. Tests cannot catch a wrong sign inside three.js.
- No shadows: no globe shadow on the rings, no ring shadow on the globe, no ring-through-Cassini detail beyond the band alphas, no Encke gap, no spokes, no globe banding or limb darkening, no phase of the globe (Saturn's phase is below 6.5 deg).
- Ring brightness is illustrative (luminance 150 / 238 / 200 / 205 for C / B / Cassini+A, alpha 0.32 / 0.95 / 0.07 / 0.75), never seen live. Rings and globe use the Saturn colour (1, 0.9, 0.65) multiplied in; the additive blend means rings brighten a bright sky.
- Edge-on (|B| near 0) is drawn as a thin faint line, at least 1.1 deg thick-equivalent (minor ratio clamped to 0.02) and 40% brightness; the real edge-on ring is nearly invisible.
- Saturn's POINT brightness still ignores the rings (existing magnitude formula: "Saturn rings ignored"); the real ring tilt changes Saturn by about 1 magnitude. Not changed ("preserve existing rendering").
- Saturn's disc/point cross-fade now follows the ring system, so Saturn turns into a picture at a wider fov than before (globe-only rule). This is a deliberate change to Saturn only; other planets unchanged.
- The ring tilt/pole use unrefracted positions and ignore light-time; stretch at screen edges is ignored (same as the other discs).
- The ring picture is 256 px across 2.4 globe radii each way; at the 0.2 deg zoom floor the ring system is about 60 px (1000 px canvas) or 90 px (1500 device px), so the picture is larger than it needs to be (could be 128 px; not reduced because shrinking it was not tested).
- Reference is PyEphem and Meeus, not an official almanac; data generated in this sandbox (`pip install ephem`; `make_saturn_ref.py`).
- Everything open from Phases 0-3, 4A-1, 4A-2 and 4A-3 is still open (Milky Way, 17-star list, time zones, cities.json, Orrery-side link code, real-browser test, frame rate, curved wall and fence, touch joystick, Phase 0 audit). The master handoff file (`Orrery_Sky_MASTER_Handoff.md`) was NOT updated by this task and still shows Phase 3 as part A only with no Phase 4 entry.

## Done: 4B-1 Sunrise and sunset colours (labelled by you; the notes before called the next step "4A-5")
- The sky colour is now a smooth function of the Sun's altitude, from full day through sunset to night. The old version blended two straight ramps (one over +8 to -4, one over -4 to -18). It went from bright blue at +8 to murky grey by +4, then to a dim brown horizon; it also had visible slope kinks where the ramps start and end.
- **Palette** (`SkyMath.skyPalette(h, asym)`): colour keys against Sun altitude, joined with a monotone cubic (`pchip`, end slopes clamped to zero). Layers: zenith, horizon colour all round, a WARM sun-side horizon glow that goes orange (0 deg) to red (-3) to deep crimson (-6) to purple (-9) and fades by -16, a pink "belt of Venus" band on the opposite horizon (peak near -4, gone by -13) with a slight darkening below it, and a Sun glow colour that goes from pale yellow to orange to red. Full-day (zenith .25,.5,.9; horizon .7,.8,.95) and astronomical-night colours are unchanged from before.
- **Dome shader** (in `sky.js`): new uniforms `warm, belt, wa, ba, asym, sa`; warm glow is blended in (not added) with a falloff by height above the horizon and by angle from the Sun's azimuth; belt on the far side; a tiny screen-space dither (about half a step of 255) to avoid banding in the dark gradients. The old city-glow term, the horizon-to-ground blend and the Sun-direction glow are kept as they were. `U.top` and `U.hor` still exist with the same meaning (scene.js reads them for fog and hemisphere light).
- **Actual Sun altitude**: the palette is driven by `sun.eff` (effective altitude; equals the TRUE, unrefracted altitude when there is no eclipse, and is lowered during a solar eclipse as before). It is never driven by clock time.
- **Sun colour**: `SkyMath.sunTint(trueAlt)` reddens the Sun glow and disc sprites near the horizon (orange at 0 deg, white by 40 deg). This is a small extra beyond the sky gradient; easy to remove (one line in `update()`).
- **Eclipse**: during a solar eclipse the effective altitude drops (as in Phase 3), and the warm glow spreads all round the horizon instead of staying on the Sun's side (`SkyMath.eclipseAsym`; asymmetry 1 normally, 0.15 at totality). Illustrative.
- Astronomy preserved: positions, magnitudes, visibility limit, stars, eclipse maths, planet discs and `sun.eff` are untouched. The 8 existing suites (368 checks) pass unchanged except for one stub fix (below).

### Modified / new files (4B-1)
- `sky-math.js`: new exports `skyPalette`, `eclipseAsym`, `sunTint`, `pchip`, `PAL`. Nothing existing changed.
- `sky.js`: dome shader and its uniforms; `setSkyColors(h, asym)` now calls `SkyMath.skyPalette`; `update()` passes `M.eclipseAsym(S.sun.trueAlt, S.sun.eff)`, sets `U.sa`, and tints the Sun sprites.
- `tests/palette.test.js` (new, 21 checks), `tests/render-sky.js` (new, 8 checks, real shader in headless Chromium), `tests/ref/make_sky_png.py` and `tests/ref/sky_palette_old_vs_new.png` (new; old vs new, 16 Sun altitudes), `tests/run-all.sh` (runs both new tests; they do NOT hide failures behind `tail`, unlike the older lines).
- `tests/disks.test.js`, `tests/phase.test.js`, `tests/rings.test.js`, `tests/venus.test.js`: ONE line each (the stub `SpriteMaterial`) now has a `color` with `setRGB`, because the real three.js SpriteMaterial has `color` and `update()` now sets it. No assertion changed.
- NOT changed: scene.js, walk.js, eclipse-local.js, index.html, engines, textures, `tests/smoke.test.js`, `tests/sky.test.js`, `tests/eclipse.test.js`, `tests/walk.test.js`. No scene geometry touched.

### Tests actually run: `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks + 48 venus + 78 phase + 104 rings + **21 palette + 8 render** = **397 checks, 0 failed** (368 before).
What the 21 palette checks show (Node): all values finite and inside 0..1 for Sun altitude -40..+60; continuous, with no channel moving more than 0.01 per 0.05 deg (new worst 0.0083; old palette 0.0045, so the new palette changes colour FASTER in its steepest channels, over a much larger colour range); slope kinks at most 0.0004 (old palette 0.009); day and night ends equal the old colours; zenith and horizon never brighten as the Sun goes down; warm colour is strongly red between Sun -6 and +2; belt, glow and warm weights peak where intended; a real Manila evening (2026-11-12, minute by minute) uses the true Sun altitude, has asymmetry exactly 1, and no channel changes faster than 0.2 per degree of the Sun's real altitude change; eclipse asymmetry behaves; Sun tint order and limits.
What the 8 render checks show (real GLSL compiled by Chromium + SwiftShader, so a software renderer, not a GPU): the shader compiles and links; every pixel is opaque; at Sun -2 the Sun-side horizon is red-orange and the opposite side is clearly less so; at Sun -4 the opposite horizon has the pink belt; zenith luminance never rises from +30 to -18; the day pixel equals the expected gradient (within 4); night is near black; dithering is active; neighbouring sky pixels differ by at most 10 vertically and 4 sideways (limits 14 and 6 chosen after measuring).
Mutation checks (by hand, not a script): flipped warm side (caught), removed dither (caught), free end slopes in `pchip` (caught: 2 failures), eclipse asymmetry fed the refracted altitude (caught).
I also LOOKED at the rendered old-vs-new image (`tests/ref/sky_palette_old_vs_new.png`): the old sky greys out between +8 and +2 and shows a small orange blob; the new sky stays blue longer, turns peach to orange to deep red low on the Sun side, a pink-lilac band on the far side, then fades to indigo and black. That is a picture of the shader through a software renderer, on a flat azimuth-by-altitude map, not the viewer.

### Mistakes made while testing (found and fixed)
- REAL BUG in my first wiring: I passed the REFRACTED Sun altitude to `eclipseAsym`, but `sun.eff` is built from the TRUE altitude, so ordinary refraction (up to about 0.6 deg) looked like a partial eclipse near the horizon (asymmetry about 0.89 instead of 1, with a jump when refraction switches on). Found by the minute-by-minute Manila test; fixed by passing `S.sun.trueAlt`; a test now requires asymmetry exactly 1 on an eclipse-free evening.
- Kinks at the ends of the colour tables (colours held flat past the last key with non-zero slope). Fixed by clamping end slopes to zero in `pchip`. I also softened the warm and belt weights (steepest slope was about 0.16 per degree).
- My first test thresholds were guesses and two rules were wrong (equal green and blue in deep red was demanded to differ; a per-minute limit unrelated to how fast the Sun moves; a day-zenith pixel compared at the wrong altitude; the horizon edge counted as a "hard edge"). I rewrote them and state in the test text which limits were set AFTER measuring.
- My first render harness computed the view direction per corner of the quad, so azimuth was interpolated away and the first picture was wrong; fixed to per-pixel before any check was trusted.

### Known limits / unfinished (4B-1)
- NOT seen in a real browser, on a real GPU or screen. All colours are my choices, tuned by eye on a software-rendered picture, never compared with the concept image on a real screen. Dusk against the concept image (orange horizon, deep blue top, first stars) still needs your eyes.
- **Existing astronomy issue, NOT changed (you said preserve astronomy):** `refr()` in sky-math.js returns 0 below true altitude -1 deg and about 0.58 deg just above it, so the REFRACTED Sun altitude (`sun.alt`) jumps by about 0.6 deg when the true altitude crosses -1 deg (seen in Manila: -0.28 to -1.15 in one minute). The Sun glow and disc sprites and the sky's Sun-glow direction use `sun.alt`, so they hop about 0.6 deg at that moment. The sky COLOUR uses the true altitude and is not affected. A smooth refraction fade below the horizon would fix it; it changes astronomy output, so I left it for you to decide.
- Scene lighting and fog (`scene.js`) read `U.top` and `U.hor`; at dusk the fog and the below-horizon haze are now warmer than before and the hemisphere light is slightly different. scene.js was NOT changed and these effects were not looked at.
- The sun-side glow is centred on the Sun's azimuth; the real sky also brightens toward the horizon at all azimuths in the twilight arch. No Moon-lit or city-lit coupling to the palette. The east-facing city-glow term is exactly as before.
- Sun glow sprite and disc are additive and tinted by multiplying colour; whether the reddened Sun looks right against the new sky is unseen.
- Sunrise is the mirror of sunset (the palette depends only on altitude); real mornings and evenings differ a little (aerosols, temperature); not modelled. Clouds, haze layers and the green flash are out of scope.
- Dither is a screen-space hash: it can shimmer slightly when the camera moves. Unseen.
- `render-sky.js` needs `/opt/npm-tools/node_modules/playwright` or a local `playwright` plus Chromium; it prints SKIP and returns success if they are missing, so on a machine without them those 8 checks do not run.
- Still open from earlier phases (unchanged): real-browser look at planet discs (shared rotation sign), Milky Way, 17-star list, time zones, cities.json, Orrery-side link code, frame rate, curved wall and fence, touch joystick, Phase 0 audit, Phase 3 parts B and C as listed in the master handoff.
- `Orrery_Sky_MASTER_Handoff.md` was NOT updated (it is not in the zip). It still shows Phase 3 as part A only and has no Phase 4 entry.

## Done: 4B-2 Horizon glow and atmospheric appearance
- **Horizon haze**: a band that hugs the horizon on every side (a little stronger toward the Sun) and replaces some of the base colour right at the horizon, fading with height. Its colour, strength and thickness depend on the Sun's altitude (keys in `PAL`: `hz` colour, `za` strength, `zk` fade rate): thick and warm at sunset (strength 0.5, fades over about 6 deg), purple then blue-grey in deeper twilight, thin and faint at night (airglow: strength 0.05, dark green-grey), pale and thin by day.
- **Sun aureole**: the sun-direction glow now has a second, tighter lobe (`gt`, strongest between 0 and +8 deg at 0.5, 0.06 by +40, none below -10). The old wide lobe (`ga`) is unchanged.
- **Scene fog** (`scene.js`, one line): the fog colour is now the horizon colour pulled toward the haze colour (by 0.6 x haze strength) so far terrain and the city fade into the same glow as the sky. No geometry changed.
- **Stars, planets, Milky Way**: the star and planet drawing, the limiting-magnitude function and all astronomy are untouched. The glow is kept low: with the Sun at -9 or lower it adds at most 2.1/255 of luminance at 10 deg altitude and above, and at most 1.0/255 at 20 deg and above (measured on the real shader). A limit-magnitude star keeps at least about 95% of its previous contrast (worst measured ratio 1.048 of the sky luminance). At night (Sun -18) the glow adds at most 0.93/255 anywhere above 3 deg.
- **Lightweight**: no textures, no extra passes, 4 new uniforms, about 2 extra mixes and 2 pow calls per pixel. Measured only as a relative cost in software GL on a CPU (ratio 1.01, i.e. no measurable change there). NOT measured on a GPU or a phone.
- No clouds, no weather.

### Modified / new files (4B-2)
- `sky-math.js`: `PAL` gets `hz, za, zk, gt`; `skyPalette` also returns `hz, za, zk, gt`. Nothing else changed.
- `sky.js`: four new uniforms, the haze mix, the second aureole lobe, `setSkyColors` sets them.
- `scene.js`: one line (fog colour, see above).
- `tests/palette.test.js`: 7 new checks (now 28). `tests/render-sky.js`: rewritten (now 17 checks): it renders three variants of the real shader (current, the same with haze and aureole off = the 4B-1 look, optionally the 4A-4 shader), plus a zoomed 0 to 15 deg horizon strip, and transfers pixels as base64 (the first attempt with plain arrays ran out of memory).
- `tests/ref/make_sky_png.py` (rewritten for the new format), `tests/ref/sky_glow_4b1_vs_4b2_zoom.png` and `tests/ref/sky_glow_4b1_vs_4b2_full.png` (new). `tests/ref/sky_palette_old_vs_new.png` is the 4B-1 picture, kept.
- NOT changed: walk.js, eclipse-local.js, index.html, engines, textures, the other test files.

### Tests actually run: `sh tests/run-all.sh`
16 sky + 23 walk + 40 eclipse + 28 smoke + 31 disks + 48 venus + 78 phase + 104 rings + **28 palette + 17 render** = **413 checks, 0 failed** (397 before).
New render checks (real GLSL, software GL): the glow adds at most 1.5/255 at 20 deg and up for Sun -9 and lower; sky luminance at 10 deg and up for Sun -9 and lower is at most 1.43 x the 4B-1 value (+1/255) (worst 1.048); away from the Sun the high sky changes by at most 3/255 at every Sun altitude (range -0.07 to +1.14); the horizon differs from 4B-1 by at least 2/255 for every Sun altitude from +8 to -12; the glow is strongest at Sun -3 (adds 32/255 at the horizon), weaker at -10 (3) and gone at -15 (0), with larger mean height at sunset (5.8 deg) than in deep twilight (4.3 deg); night airglow within limits; a stand-in Milky Way keeps at least 90% of its contrast (measured 1.000); the added glow fades smoothly with height; relative cost below 1.6x (measured 1.01). Palette checks cover strength, thickness, colour, night budget, aureole and eclipse.
Mutation checks (by hand): haze thickness fixed too fat (6 failures), haze strength tripled (caught by both suites), aureole left on at night (caught by the palette test, NOT by the render test, because the aureole at night is around a Sun that is below the horizon), haze removed (caught).
I looked at the old-vs-new pictures: sunset gets a brighter warm band along the horizon on all sides, the Sun gets a tight bright halo, deep twilight and night are practically unchanged.

### Mistakes made while testing (found and fixed)
- My first "responds to the Sun" check asked for Sun -14, which is not one of the rendered rows, so it produced NaN, and its half-height measure was unreliable on a faint signal. Replaced with a weighted mean height at rendered rows.
- The first haze was too faint in deep twilight (Sun -10 and -12 changed the horizon by under 2/255, invisible). Strengthened those keys; the effect there is still small (3 and 2 out of 255).
- The first render rewrite ran out of memory moving pixels as JSON arrays; switched to base64.

### Known limits / unfinished (4B-2)
- Still NOT seen in a real browser, on a real GPU, or on a phone. All colours and strengths are my choices from a software-rendered flat map, not compared with the concept image on a real screen.
- **No Milky Way is drawn in this project yet** (no texture in the zip). The Milky Way check uses an ASSUMED stand-in layer (0.05 of full scale). The real Milky Way brightness may differ; what the tests really show is that the glow adds almost nothing above 20 deg at night.
- Stars and planets were not rendered in these tests. The star check is a sky-luminance ratio, not an actual star on the sky. Daytime: the new aureole slightly brightens the sky around the Sun; planets are not visible by day anyway.
- The scene fog change is only exercised through the test stubs (it runs without error); how the city and far terrain look with the warmer fog at dusk is unseen. Fog distances were not changed.
- The haze is the same on every side apart from a mild Sun-side boost; no azimuth-dependent terrain haze, no light pollution coupling (the old east-facing city glow term is untouched).
- Existing refraction issue from 4B-1 still open (refracted Sun altitude jumps about 0.6 deg at true altitude -1 deg; Sun sprites hop; sky colour is not affected). Not changed.
- Everything else listed as open under 4B-1 is still open.
- `Orrery_Sky_MASTER_Handoff.md` was NOT updated (not in the zip).

## Done: 4C-1 Mobile touch joystick
- **On-screen stick** (`joystick.js`, new, loaded after `scene.js` in `index.html`): bottom-left, sits just above the info card, about 30% of the short screen side (ring 112 to 156 px, shrunk down to 80 px if a landscape phone leaves little room; touch area is the ring plus 14 px padding all round). Shown by default on touch (coarse-pointer) screens; hidden on desktop. The new **Stick** button in the top bar shows or hides it on any device (remembered; `?stick=1` or `?stick=0` forces it). Uses pointer events with pointer capture, `touch-action: none`, no text selection or long-press menu. Releases on finger lift, touch cancel, lost capture, window blur and tab hidden, so you cannot get stuck walking.
- **Directions**: up = forward, down = back, left and right = strafe, any angle in between (analog). Within 7 deg of an axis the direction snaps to it so walking dead straight is easy. Dead zone 12% (deflection starts from 0 just past it, no jump). Speed grows with deflection: walk speed (1.5 m/s) at 80% of the range, run speed (3 m/s) at the edge (the ring turns gold). Looking is unchanged: drag the 3D view with a second finger while the stick is held (tested).
- **Walking rules preserved and shared**: all walking now goes through one pure function, `SkyWalk.advance` (smoothing, wall slide, door open/shut rule), fed by `SkyWalk.moveCmd(keys, joy)`. The keyboard gives exactly the same velocity targets as before 4C-1 (checked for all 32 key combinations at 5 headings). The joystick wins while a finger holds it; releasing it hands control back to the keyboard.
- **No tunnelling**: `SkyWalk.stepSub` cuts each frame's move into pieces of at most 0.1 m, each checked by the existing `step`. Before this, a long step (slow frame at run speed is 0.3 m; a 1 m step in the test) could jump straight across the 0.6 m gap through the shut door or the glass wall; now it cannot. The walkable area itself (dome radius 3.3, door gap, terrace 13.2 x 7.2 m, fence) is unchanged.
- Scene hooks: `SkyHook.joy` ({f, r, mag} or null) is read every frame; `SkyHook.pos()` returns the local position (tests); `SkyHook.stick` has `show()`, `isOn()`, `size()`.

### Modified / new files (4C-1)
- `walk.js`: new exports `JOY, joyVec, joySpeed, moveCmd, stepSub, advance`. Nothing existing changed.
- `scene.js`: `H.tick` now calls `W.moveCmd` and `W.advance` instead of computing movement inline; `H.pos` added. Bob, door, hint and camera code unchanged.
- `joystick.js` (new), `index.html` (one script tag added).
- `tests/joystick.test.js` (new, 30 checks), `tests/joystick-touch.test.js` (new, 116 checks), `tests/run-all.sh` (runs both without hiding failures; syntax-checks the new files).
- NOT changed: sky.js, sky-math.js, the engines, textures, the other tests, the top-bar layout or any other mobile UI.

### Tests actually run: `sh tests/run-all.sh`
368 earlier + 28 palette + 17 render + **30 joystick logic + 116 joystick touch** = **559 checks, 0 failed**.
- Logic (Node, 30): joystick vector (directions, unit length at every 0.5 deg, dead zone, clamp, snap, bad input), speed curve (no jumps), keyboard parity with the old formula, joystick priority, step cannot tunnel (a 1 m step ended at z 4.20 through the door with the old code and stops at z 3.20 now), 20000 random long steps with the door shut never cross the glass either way, walking in all 4 directions facing east, speeds, release stops, door open then out onto the terrace and stopped by the front fence, door shut stays inside, fence at the worst frame time, a fuzz of 4000 random 500-frame walks (random heading, stick, frame times 8 to 100 ms, door open or shut: never left the walkable area, never crossed the dome wall with the door shut), and the REAL scene.js (stubbed DOM, same harness as the smoke test) driven by the W key and by the joystick: shut door stops you, useDoor then joystick walks you out and the fence stops you, sideways run into the side fence, keyboard works after joystick use, release stands still.
- Touch (Chromium touch emulation, real multi-touch via the DevTools protocol, 6 phone sizes: 390x844, 360x640, 320x568, 430x932, 844x390 landscape, 640x360 landscape; 19 checks each): shown by default; size 80 to 156 px; fully on screen, not over the info card, at most 4 px into the top bar (measured 0 px on all but 640x360 which is 4 px); touch-action none; centre gives no movement; up, right, left, down, diagonal; push past the edge gives full deflection and the run ring; two fingers (stick held and the second finger drags the view); lifting the look finger does not stop the stick; lifting the thumb, touch cancel and window blur stop walking; padding around the ring counts, a second finger on the stick does not take it over; Stick button hides and shows. Desktop mouse: hidden by default, Stick button present, can be turned on and driven by mouse.
- Mutation checks (by hand): no sub-stepping (caught by 2 checks), forward sign flipped (3), keyboard wins over joystick (6), no release on touch cancel (caught), `touch-action` removed (caught).
- I also looked at a screenshot of the stick on a 390x844 stand-in page (ring, knob, gold run ring).

### Mistakes made while testing (found and fixed)
- My first touch test read the stick before Chromium had delivered the move (touch moves arrive with the next animation frame) and used the outer ring radius, not the full-deflection radius (the knob stops where its edge meets the ring, 0.6 of the ring radius). 48 false failures; the stick was fine. Test fixed.
- My first speed check fed an already dead-zone-corrected value through the dead zone twice. Test fixed.
- My first geometry check for the stick position had a muddled `&&`/`||` and passed while the stick overlapped the top bar by 12 px on a 640x360 landscape phone. Found by printing the numbers; the layout now measures the real top-bar height and may shrink to 80 px, and the check is strict (0 to 4 px).

### Known limits / unfinished (4C-1)
- **Not tried on a real phone** (no real thumbs, no iOS Safari or Android Chrome, no notch or home-indicator insets beyond the CSS `env()` values, no rotation animation). Whether 112 to 156 px suits your thumb is unverified.
- The real `index.html` was NOT loaded in a browser (three.js comes from a CDN and there was no network): `joystick.js` was tested on a stand-in page (canvas, a top bar 84 px tall, an info card 150 px tall) and `scene.js` through the stubbed DOM. On a real phone the real top bar wraps over several rows and the real info card changes height; the stick measures both, but this was not seen with the real elements.
- On phone in landscape the ring can shrink to 80 px and may touch the top bar by a few px; the info card (up to 46% of screen height) leaves little room. A Stick button hides it.
- One stick, bottom-left only: no left-handed mode, no floating (appear-under-thumb) stick, no separate look stick (you drag the view with another finger), no run button (push to the edge), no haptics, no gyro. The Door button (top bar) still opens and closes the door; the hint text still says "Press E".
- Touch laptops (maxTouchPoints > 0) get the stick by default; use the Stick button to hide it.
- `advance` now sub-steps for the keyboard too (0.1 m pieces). Results are the same except that a very long frame can no longer skip through a wall. Frame time is still capped at 0.1 s as before.
- Pinch zoom and the existing look controls were not changed or re-tested here.
- Still open from earlier phases (unchanged): the refraction jump of the refracted Sun altitude at true altitude -1 deg (4B-1), real-browser look at dusk, fog and planet discs, Milky Way (not in the project), 17-star list, time zones, cities.json, Orrery link code, frame rate, curved wall and fence, Phase 0 audit.
- `Orrery_Sky_MASTER_Handoff.md` was NOT updated (not in the zip).

## Done: 4C-2 Mobile camera controls (touch look, pinch zoom, page guards)
**Verified first:** 4C-1 was complete (12 suites, 559 checks, 0 failed; joystick.js loaded in index.html).

**Problems found in the existing controls (and fixed):** (1) there was NO pinch handler, so a phone could not zoom at all; (2) one-finger drag had no tap tolerance, lifting any finger ended the drag, touch-cancel was ignored; (3) typing "-" in the latitude/longitude boxes zoomed the sky, and "+", arrows and Ctrl+/- also acted on it; (4) only the canvas WIDTH was compared on resize, so a height-only change (phone URL bar hiding) stretched the view; (5) a swipe on the top bar could not be stopped by JavaScript in Chromium (touchmove is not cancelable there), so it needs CSS.

**What changed**
- `camera-input.js` (new, loaded before sky.js): all look/zoom input. Touch: 6 px tap tolerance (mouse 0 px, pen 3 px), then 1:1 drag (deg per px = fov / screen height). Two fingers: pinch zoom (twice as far apart = half the field of view), limits restart so reversing responds at once; the finger midpoint only turns the view after 10 px (so a plain pinch never drifts); 2 to 1 fingers continues without a jump; a third finger is ignored. Light fling after a quick flick (350+ px/s, tau 0.32 s, at most 1.2 screen heights, off with reduced-motion, never for mouse, stops on touch/wheel/key/blur). Wheel: unchanged for a normal notch, line/page modes converted, one event capped at 250. Keys: unchanged, but ignored while typing in a box and with Ctrl/Cmd/Alt. Long-press menu blocked for touch/pen only. Page guards: non-passive touchmove block (not on the info card or text boxes), iOS gesture events blocked. All constants are in `CamInput.CFG`.
- `sky.js`: uses CamInput; resize now compares width, height and pixel ratio; `SkyHook.input` and `SkyHook.view()` added.
- `index.html`: `touch-action:none` on the top bar, `overscroll-behavior:none` on html/body, `contain` + `pan-x pan-y` on the info card, no text selection or tap highlight on the canvas, script tag.
- `tests/camera.test.js` (new, 85 checks), `tests/camera-touch.test.js` (new, 198 checks), `tests/smoke.test.js` (only the file list: camera-input.js added), `tests/run-all.sh`.

**Tests actually run:** `sh tests/run-all.sh` = 559 earlier + 85 + 198 = **842 checks, 0 failed**.
- Logic (85, fake clock): slop, 1:1 maths at several fovs, Flip, pitch/yaw limits, mouse parity with the old handlers (old-style events too), pinch maths and limits, 2 to 1 finger hand-over, fling rules and caps, wheel, keys and typing guards, page guards, and the real sky.js: pinch reaches the real fov, height-only resize and rotation are applied, drag after rotation uses the new height.
- Browser (198): real touch events in headless Chromium, 8 screens (390x844, 360x640, 320x568, 430x932, 844x390, 640x360, 768x1024, 1024x768) each with: tap/wiggle does not move the view, 80 px drag is 1:1, fine control at fov 2, fling then settle, touch stops a coast, pinch in/out (diagonal or horizontal) exact, no drift, limits, pinch while the stick is held, 6 top-bar taps never move the camera and all click, a drag from the sky ending on a button presses nothing, top bar starts no pan/zoom gesture, page scroll stays 0 and scale 1, the info card still scrolls, typing -33.8 does not zoom, rotation keeps drag 1:1; plus a desktop run (mouse, wheel, arrows, Ctrl+-, right-click menu).
- Mutation checks (by hand): no tap tolerance (3 failures), inverted pinch (7), no key guard (3), 2-to-1 re-using the tap tolerance (2), no fling release check (1), no wheel cap (1) were each caught. The "no wheel line conversion" mutation was a syntax error, so it proved nothing; that case is only covered by its own test.

**Mistakes made while testing:** my first stand-in info card was far too tall so touches landed on the bar; first flick was too slow (350 px/s limit); the desktop arrow check assumed yaw 100 after earlier drags; a pinch test moved fingers in 50 px jumps (midpoint zigzag, now gated by the 10 px dead zone); my first fling cap was in px only, so on a 360 px tall screen a hard flick turned the sky 64 degrees (now relative to screen height).

**Known limits / unfinished**
- NOT tried on a real phone, not iOS Safari, no real URL-bar collapse, pull-to-refresh or rubber-band (only the CSS and the guards are tested). The browser test uses a stand-in page made from the real index.html styles, markup, camera-input.js, walk.js and joystick.js; sky.js/three.js were not loaded in a browser (CDN, no network).
- Tap tolerance (6 px), fling numbers and the pinch dead zone are first guesses. Sensitivity itself was already 1:1 at the view centre; I kept it (`touchGain` 1.0).
- Zoom is about the screen centre, not the pinch point. Trackpad pinch on desktop and double-tap are unchanged. No double-tap zoom, no gyro.
- Layout, NOT changed: on 320x568 the top bar reaches 238 px (42% of the screen); on 640x360 landscape the bar reaches 144 px and the info card starts at 236 px; with a tall info card the free 3D area can be nearly zero. A collapsible top bar would help; not done.
- `Orrery_Sky_MASTER_Handoff.md` was not updated. Still open from earlier phases: real-browser look at dusk, fog and planet discs, Milky Way, 17-star list, time zones, cities.json, Orrery link code, frame rate, curved wall and fence, Phase 0 audit.

## Done: 4D-1 Keyboard accessibility
**Verified first:** Phase 4C is complete. The 4C-2 ZIP was unpacked fresh and `sh tests/run-all.sh` passed before any change (842 checks, 0 failed; 4C-1 joystick and 4C-2 camera controls both present and wired in index.html).

**What was already fine:** all top-bar controls are real `<button>`/`<input>` elements with labels, so they were reachable with Tab and activated with Enter/Space. Arrow keys, + -, W A S D and E already worked from the page.

**Gaps found and fixed (design unchanged: nothing new is visible except focus rings, one extra phrase in the existing hint line, and tooltips)**
1. **No designed focus indicator** (only the browser default). Added a gold 2 px ring (same gold as the run ring and warnings) with a dark halo, shown ONLY for keyboard focus (`:focus-visible`), so mouse and touch look as before: sky view, every top-bar control, the info card and its contents. The halo is there because gold alone over a bright daytime sky measured only 1.9:1 (WCAG asks 3:1); with the halo it is above 3:1 over night sky, daylight blue and white cloud (the test computes it). The date box needs `:focus-within` (its inner fields never match `:focus-visible`).
2. **Enter in the date, latitude or longitude box did nothing**; now it presses Go. (keyboard.js)
3. **No way back to the sky from a control.** Escape from any control or the info card now puts the focus on the sky view, so arrow keys, + - = and W A S D act again. (keyboard.js)
4. **The sky view was not a keyboard stop.** It is now (`tabindex=0`, `role=application`, a label that lists the keys). First stop in the Tab order.
5. **The info card scrolls but could not be scrolled by keyboard** (long eclipse tables). It becomes a tab stop only while it really overflows (and gets a name); while it itself has focus the arrow keys scroll it instead of turning the view (`data-own-arrows`, honoured by camera-input.js). + and - still zoom there.
6. **Zoom-in on a plain `=` key.** `=` is the + key without Shift on most keyboards; it now zooms in like `+`. `+`, `-`, numpad keys unchanged.
7. **Walking keys could stick on** (scene.js): Cmd+S, Cmd+A, Ctrl+A and similar combinations set the walking key but on macOS the key-up never arrives; also alt-tabbing while holding a key. Walking keys now ignore Ctrl/Cmd/Alt combinations and are released on window blur / tab hidden. Typing in any text, number, select or textarea (not only INPUT) never walks or opens the door.
8. **Names:** time-step, Go, Now, Sun, Moon, Dome and Terrace buttons have tooltips (`title`) saying what they do (visible text unchanged, so the accessible name still equals the visible text); the controls are a labelled group; Flip look reports `aria-pressed`; the visible hint line now reads "WASD walk · E door · drag/arrows look · wheel or +/- zoom · Esc back to sky".

**Existing shortcuts kept (all tested):** arrows turn the view fov/20 (also with a button focused), + - zoom by 1.2, W A S D walk, E uses the door, Enter/Space on any button, and the keys stay ignored while typing in a box or the City glow slider (arrows move the slider, not the camera). Ctrl+- / Ctrl+= (browser zoom) do not zoom the sky.

### Modified / new files (4D-1)
- `keyboard.js` (new, loaded last), `index.html` (focus CSS, canvas attributes, group label, titles, script tag), `scene.js` (key guards, blur reset, hint text, two titles), `camera-input.js` (`=` key, `data-own-arrows`), `sky.js` (Flip `aria-pressed`, 3 lines).
- `tests/keyboard.test.js` (new, 55 checks), `tests/keyboard-nav.test.js` (new, 51 checks), `tests/camera-touch.test.js` (one regex widened because the top bar markup gained attributes; no assertion changed), `tests/run-all.sh`.

### Tests actually run: `sh tests/run-all.sh`
842 earlier + 55 + 51 = **948 checks, 0 failed.**
- Logic (55): the real scene.js with stubs (plain W walks; not in INPUT/TEXTAREA/SELECT/editable; not with Ctrl, Cmd or Alt; stops on blur and does not creep; walks again after typing; E not while typing), `=`/`+`/`-`, arrows on page, button and focused card, keyboard.js with a fake page (Enter, Ctrl+Enter, IME Enter, Escape from box/button/card/card child, nothing when already on the sky, other keys untouched, card tab stop appears, disappears and moves focus to the sky), index.html markup (every button has text, every input a label, canvas stop and label, no positive tabindex, no `outline:none/0` anywhere, script order) and focus-ring contrast.
- Browser (51, real key presses in headless Chromium, 4 sizes: 1280x800, 390x844, 640x360, 320x568; page built from the real index.html plus the buttons and slider scene.js adds, real joystick.js, keyboard.js, camera-input.js, walk.js): Tab visits all 22 controls once each in page order at every size (the date box counts once although Chromium steps through its fields), same list at every size, gold 2 px ring on every stop, every stop on screen and not covered, no keyboard trap; Enter and Space on all 13 top-bar buttons give exactly one click; Stick button by keyboard; Enter in the three boxes presses Go once each (and not twice on the Go button); typing -33.8, arrow and = in the latitude box does nothing to the sky and the text arrives; Escape then arrows/=/+/- work; arrows on a focused button look; arrows on the City glow slider move the slider only; Ctrl+- does not zoom the sky; mouse click on the sky or a button shows no ring, Tab shows it; card: short = no tab stop, long = tab stop after the top bar, arrows and PageDown scroll it without turning the view, + - still zoom, Escape returns to the sky, back to non-stop when short, Enter/Space on a contact-time button, Tab to the Back link.
- Mutation checks (by hand): no Ctrl/Meta guard (4 failures), no blur reset (2), only INPUT guarded (3), no `=` key (1), card arrows (1), Enter does nothing (3), Escape does nothing (8), halo removed (1), canvas not focusable (1); all caught, sources restored (compared byte for byte) and re-run clean.
- I also looked at two screenshots of the ring (over a bright sky gradient and over night): gold ring with a dark halo, legible.

### Mistakes made while testing (found and fixed)
- The date box (`datetime-local`) has no ring at all with `:focus-visible`; found by the browser test (the logic tests could not see it). Fixed with `:focus-within`.
- The gold ring alone failed contrast over a daylight sky (1.9:1); halo added.
- My first "mouse click shows no ring" test clicked a sky view that was already keyboard-focused, which correctly keeps its ring; the test now blurs first. First card-scroll test read the scroll position before the smooth scroll finished.
- The 4C-2 touch test hard-coded `<div id="ui">`; the new attributes broke its regex (the test crashed, no behaviour regression). Regex widened.
- `sky.js` first called `setAttribute` on a stub element and broke every stub-page test; now guarded.

### Known limits / unfinished (4D-1)
- NOT tested with a screen reader (NVDA, JAWS, VoiceOver, TalkBack), nor in Safari or Firefox; Chromium only. Focus-ring look was not seen on a real screen. `role=application` on the sky view is a judgement call (it asks screen readers to pass keys through); not verified with a reader.
- The date box is several Tab stops in Chromium (month, day, year, hour, minute, second, AM/PM); that is the browser's own widget. Firefox and Safari differ.
- The tests use a stand-in page (sky.js, scene.js and three.js not loaded in a browser; no network). The tab order of the real page also includes anything those scripts add beyond the strings read from scene.js and joystick.js.
- Not changed: the on-screen joystick (touch only; keyboard users walk with W A S D; it still announces itself to screen readers although it cannot be driven by keys), the live text region (the whole summary line is re-read on every update; not tuned), touch target sizes, the large top bar on small phones (see 4C-2), colour contrast of the normal text and buttons (only the focus ring was measured), `prefers-reduced-motion` for anything except fling.
- No visible help for keys beyond the one hint line and the sky view's label (no "?" help button, to keep the design).
- Still open from earlier phases: see the 4C-2 section (real-browser look at dusk, fog and planet discs, Milky Way, 17-star list, time zones, cities.json, Orrery link code, frame rate, curved wall and fence, Phase 0 audit); `Orrery_Sky_MASTER_Handoff.md` was not updated.

## Done: 4D-2A Audit of astronomical object descriptions
The full task sequence supplied by the user identifies the earlier audit as 4D-2A. The audit is complete; its report is `PHASE4_AUDIT_object_descriptions.md`. The source ZIP did not include `Orrery_Sky_MASTER_Handoff.md`, so that file was unavailable.

**Audit result:** the project draws the Sun, Moon, seven planets, and 17 named bright stars. The audit found missing object descriptions and identified existing astronomy data that could support concise wording. It also recorded wording gaps for a separate later task. No code changed during the audit.

## Done: 4D-2B Add accessible descriptions for important astronomical objects
Added a screen-reader-only description associated with the sky canvas. It identifies the Sun, Moon, seven displayed planets, and all 17 existing bright-star names. The descriptions are outside the existing live status card; no live announcements were added.

### Modified files (4D-2B)
- `index.html`: object description, `aria-describedby`, visually-hidden style.
- `tests/object-descriptions.test.js`: new markup/content checks.
- `PHASE4_PROGRESS.md`.

### Tests recorded (4D-2B)
- `node tests/object-descriptions.test.js`: **9 passed, 0 failed**.
- `node tests/smoke.test.js`: **28 passed, 0 failed** at that task.
- Syntax checks for `sky.js` and the new test passed.
- Full test suite not run for this focused change.

## Done: 4D-2C Update descriptions when object information changes
The hidden description now summarizes current Sun/Moon horizon status, lunar illumination and waxing/waning, visible planets with magnitudes, and named bright stars above the existing visibility limit. It also describes the selected object, including its state and relevant magnitude or lunar illumination. It updates on astronomy and selection changes and skips writing identical text. No visible interface was changed and no live region was added.

### Modified files (4D-2C)
- `sky.js`: description generation, selection handling, and duplicate-write suppression.
- `index.html`: current-sky description paragraph.
- `tests/smoke.test.js`: update and deduplication checks.
- `PHASE4_PROGRESS.md`.

### Tests recorded (4D-2C)
- `node tests/smoke.test.js`: **34 passed, 0 failed** (includes 6 description-update checks).
- `node tests/object-descriptions.test.js`: **9 passed, 0 failed**.
- Syntax checks passed.
- Full test suite not run for this focused change.

## 4D completion status
The implementation tasks 4D-1 and 4D-2A/B/C are complete. Screen-reader behavior for 4D-1 and the object descriptions has not been verified with a real screen reader; that remains an explicit verification limitation, not an unfinished code task.

## Done: 4E-1A Low-Performance Mode Audit (audit only; no rendering code changed)
**Verified first:** the 4D implementation tasks 4D-1 and 4D-2A/B/C are recorded complete above. The object-description sequence in this file has been reconciled to the supplied task numbering. No file named `Orrery_Sky_MASTER_Handoff.md` was present in the latest ZIP or supplied in the current workspace.

**What was inspected:** `sky.js`, `scene.js`, `sky-math.js`, `index.html`, relevant Phase 1-3 reports, and the existing Phase 4 progress notes. The current rendering behavior and likely cost centers are described in `PHASE4_AUDIT_low_performance_mode.md`. This is a source audit only: no code or visual changes were made, and no performance measurements were taken.

### Main findings
- The renderer caps device pixel ratio at **1.5** and uses antialiasing. Pixel shading work scales with the square of the pixel ratio, so resolution is the strongest simple Low-mode lever. At a 1.5-to-1.0 cap, the drawing buffer has about **55.6% fewer pixels** on devices whose ratio is at least 1.5; this is arithmetic, not a measured frame-rate gain.
- The sky dome fragment shader runs across the viewport every frame and includes several `pow`/`exp` operations for the sky gradient, horizon haze, twilight belt, Sun glow, city glow, and dither. A separately compiled, simpler Low-mode shader could omit optional effects while preserving the base sky and object renderers.
- The static city light cloud is about **7,828 points** (7,000 city points plus 828 roadside points) and is submitted as one uncullable points object. Reducing the point set in Low mode is a candidate; preserve the normal-mode geometry and recognizable city pattern.
- The city is also represented by **1,400 instanced low buildings** and nine tower meshes. Instancing already keeps building draw submission compact. Removing these would affect the scene materially for less certain benefit.
- City glow has two costs: the per-pixel city term in the dome shader and the city-light points. The City glow slider handler calls `H.redraw()` twice for each input event. Each call uses the forced update path, recomputes the sky, and redraws the 256 x 256 Moon texture even though city glow does not change that texture; removing redundant/forced work is a safe cleanup candidate for a later implementation task.
- Planet/star point count is only 24. Planet disk sizing and orientation are recalculated each frame, but phase textures redraw only after a 0.25° change and only when a disc is shown; Saturn's ring texture redraws only after 0.1° tilt change. These existing thresholds already limit texture work. Simplifying planet calculations or hiding objects is not a good first Low-mode target.
- There are no shadow maps or post-processing passes in the inspected renderer. The scene also has a full-screen dome shader and transparent effects, which are better targets than removing important astronomical objects.

### Safe opportunity order for follow-up work
1. Add the mode setting while leaving rendering unchanged (4E-1B).
2. Lower the pixel-ratio cap only in Low mode; test resize behavior and text/object readability (4E-1C). A 1.0 cap is a conservative candidate; a lower cap should be selected only after checking representative screens.
3. Use a Low-mode shader variant that keeps the base day/night gradient, Sun/Moon, and planets while reducing optional per-pixel haze, twilight-belt, city-glow, or dither work (4E-1D). Verify the dome remains coherent at dawn, dusk, night, and during eclipse.
4. Reduce city-light point density and simplify the city-glow shader path in a separate Low-mode change (4E-1E). Preserve the Normal-mode slider and city appearance.
5. Consider antialiasing only if the mode can choose it before WebGL context creation. The current renderer creates one context with antialiasing enabled; changing that in place is not a simple live setting and could require context recreation.

### Verification and known limits (4E-1A)
- No automated tests were run because this task was an audit and made no code changes.
- No browser/GPU/phone measurement or visual inspection was performed. The suggested cost reductions are source-level opportunities, not claims of measured speedup.
- Prior Phase 1-3 gaps remain open as previously recorded, including the unmeasured real-device frame rate.

## Done: 4E-1B Add Low-Mode Setting
**Verified first:** the 4E-1A source audit and report are complete. The 4D-2A/B/C labels are reconciled above.

**What changed:** added a visible “Performance: Normal/Low” toggle in the existing control bar. Normal is the default; the selection is saved in local storage and restored on reload. The control exposes its toggle state with `aria-pressed`. `OrreryPerformanceMode.getMode()`, `setMode()`, `toggle()`, and `subscribe()` provide the mode state and change notifications for renderer integration. This task did not change rendering quality.

### Modified / new files (4E-1B)
- `index.html`: visible performance-mode button and `performance-mode.js` script.
- `performance-mode.js` (new): Normal/Low state, persistence, control wiring, read/set API, subscriptions.
- `tests/performance-mode.test.js` (new): default, persistence, toggle/read behavior, invalid values, storage errors, API notifications, markup.
- `tests/run-all.sh`: syntax-checks and runs the mode test.
- `tests/keyboard-nav.test.js`: accounts for the added keyboard stop.
- `tests/keyboard.test.js`: accepts the existing `aria-describedby` canvas attribute when checking the keyboard label.

### Tests recorded (4E-1B)
- `node tests/performance-mode.test.js`: **16 passed, 0 failed** after adding change subscriptions for 4E-1C.
- `node tests/keyboard.test.js`: **55 passed, 0 failed**.
- `node tests/keyboard-nav.test.js`: **SKIPPED** because Playwright is not installed.
- Full `tests/run-all.sh` was not run.

## Done: 4E-1C Lower Rendering Resolution
**Verified first:** 4E-1B's persisted setting, UI control, and mode API are present. Normal remains the default.

**What changed:** Normal mode keeps the existing `min(devicePixelRatio, 1.5)` renderer cap. Low mode now uses `min(devicePixelRatio, 1) × 0.75`, giving a 0.75 drawing-buffer ratio on common screens with DPR at least 1 and a proportionally lower ratio on sub-1 DPR screens. The performance-mode API notifies the renderer when the mode changes, so the ratio updates without a page reload. The existing animation loop detects the changed ratio and reapplies the current CSS width and height to the drawing buffer. Camera aspect continues to use CSS width/height, not the reduced buffer size. No other visual effects or astronomy calculations changed.

**Resolution check:** on a 390×844 CSS viewport at DPR 2, Normal uses a 585×1266 drawing buffer (ratio 1.5) and Low uses 292×633 (ratio 0.75). That is about 75% fewer buffer pixels by arithmetic; it is not a measured frame-rate gain. At DPR 1, Normal uses ratio 1 and Low 0.75.

### Modified files (4E-1C)
- `index.html`: loads the mode API before `sky.js` so the initial stored mode selects the correct renderer ratio.
- `performance-mode.js`: notifies subscribers when a valid mode change occurs; no duplicate notification when set to the same mode.
- `sky.js`: selects the mode-specific pixel ratio at startup and on changes; existing resize path reapplies the drawing-buffer size while keeping camera aspect based on screen dimensions.
- `tests/camera.test.js`: integration checks for Normal/Low buffer sizes, live switching, height-only resize, landscape resize, and camera aspect.
- `tests/performance-mode.test.js`: subscription and mode-specific ratio checks.
- `PHASE4_PROGRESS.md`.

### Tests actually run (4E-1C)
- `node tests/performance-mode.test.js`: **16 passed, 0 failed**.
- `node tests/camera.test.js`: **90 passed, 0 failed**, including real `sky.js` with stubbed WebGL/DOM and Normal/Low resize checks.
- `node tests/disks.test.js`: **31 passed, 0 failed** (planet disk sizing still passes at the existing DPR coverage).
- `node tests/keyboard.test.js`: **55 passed, 0 failed**.
- JavaScript syntax checks for `sky.js`, `performance-mode.js`, `tests/camera.test.js`, `tests/performance-mode.test.js`, and `tests/keyboard-nav.test.js` passed.
- `node tests/keyboard-nav.test.js` was not rerun for this task; the earlier 4E-1B run was skipped because Playwright is unavailable. Full `tests/run-all.sh` was not run.

### Known limits (4E-1C)
- No real-browser, GPU, or device visual check was performed. Low mode will look softer because the browser scales up a smaller drawing buffer; the look and readability have not been reviewed on a screen.
- Pixel-count savings are arithmetic only. No frame-rate or power improvement has been measured.
- The app keeps the existing `antialias:true` WebGL context in both modes; antialiasing was intentionally not changed in this task.

## Done: 4E-1D Simplify Expensive Sky Effects
**Verified first:** 4E-1C is complete. Normal retains its 1.5 pixel-ratio cap; Low uses the reduced resolution and preserves CSS dimensions and camera aspect. The 4E-1A audit identified optional full-screen shader work as a safe candidate.

**What changed:** Normal mode still uses the established sky fragment shader; its source was compared with the 4E-1C ZIP and is byte-identical. Low mode uses a separate simpler dome shader that retains the base day/night gradient, Sun glow, city-glow expression, and sky-to-ground blend. It omits the optional warm-side glow, twilight belt, horizon haze, and screen-space dither. Source operation counts drop from 7 to 3 `pow` operations and 5 to 1 `exp` operations per dome fragment. These are source counts, not measured frame-time improvements.

The selected shader follows the existing saved mode and swaps when the user changes mode. Planet and star points, Sun/Moon sprites, planet disks, positions, magnitudes, and astronomy calculations stay on their existing shared paths. The city-glow shader expression is identical in both modes; no city glow logic or slider behavior was changed.

### Modified files (4E-1D)
- `sky.js`: separate Normal/Low dome materials and mode-based material selection.
- `tests/sky-modes.test.js` (new): verifies shader features, unchanged city-glow expression, reduced shader operation counts, mode selection, and shared astronomical render paths.
- `tests/camera.test.js`: verifies live Normal/Low dome mode selection does not recalculate the sky data; retains 4E-1C resolution/resize checks.
- `tests/render-sky.js`: attempts to compile and render both Normal and Low shaders when Playwright/Chromium are available.
- `tests/run-all.sh`: syntax-checks and runs the new shader-mode test.
- `PHASE4_PROGRESS.md`.

### Tests actually run (4E-1D)
- `node tests/sky-modes.test.js`: **8 passed, 0 failed**.
- `node tests/camera.test.js`: **93 passed, 0 failed**, including mode switching, stable astronomy data, pixel-ratio changes, and resizing with stubbed WebGL/DOM.
- `node tests/performance-mode.test.js`: **16 passed, 0 failed**.
- `node tests/smoke.test.js`: **34 passed, 0 failed**.
- `node tests/disks.test.js`: **31 passed, 0 failed**.
- Normal shader source comparison against the 4E-1C ZIP: **byte-identical (789 characters)**.
- `node tests/render-sky.js`: **SKIPPED** because Playwright is not installed. The real GLSL compile/render path therefore was not exercised here.
- Full `tests/run-all.sh` was not run.

### Known limits (4E-1D)
- No real-browser, real-GPU, phone, or visual comparison was performed. The Low sky’s look at dawn, dusk, night, and eclipse remains unverified.
- No frame-rate or power improvement is claimed. Shader operation counts indicate a smaller shader source workload only.
- The alternate shader may compile the first time a user switches modes, which could briefly pause rendering; this was not measured.
- City glow was intentionally kept identical and is addressed by 4E-1E.

## Next task
**4E-1E — Simplify City Glow and Verify Low Mode.**

## Done: 4E-1E Simplify City Glow and Verify Low Mode
**Verified first:** 4E-1D is complete above. Normal continues to use its existing sky shader and all city lights. Low mode already has the reduced pixel ratio and simplified sky shader.

**What changed:** Normal retains the original 7,828 city and roadside point lights. Low mode now shows a prepared 4,328-point subset: every other city point plus all 828 roadside points. Both sets use the same shader and are switched live with the existing Performance setting, so the Normal set is restored when switching back. The Low sky shader uses a cheaper linear east-side horizon glow term; Normal’s city-glow expression is unchanged. The City glow slider now requests one regular sky refresh instead of two forced refreshes, avoiding an unnecessary Moon texture redraw while preserving the control’s updated city brightness and limiting magnitude.

**Modified files (4E-1E)**
- `scene.js`: sparse Low-mode lights, live visibility switching, a test readout, and single non-forced slider refresh.
- `sky.js`: simpler Low-mode city-glow expression; Normal shader unchanged.
- `tests/joystick.test.js`: tests city point counts and live mode changes through the existing real-scene test harness; checks slider refresh count.
- `tests/sky-modes.test.js`: checks that only Low’s city-glow calculation is simplified.
- `tests/smoke.test.js`: loads the existing performance-mode controller before the scene so the mode integration is represented in the scene test harness.
- `PHASE4_PROGRESS.md`.

**Tests actually run (4E-1E)**
- JavaScript syntax checks for `scene.js`, `sky.js`, and the three updated test files: passed.
- `node tests/joystick.test.js`: **34 passed, 0 failed**, including Normal/Low city-set counts, live switching, and one slider refresh.
- `node tests/sky-modes.test.js`: **8 passed, 0 failed**.
- `node tests/smoke.test.js`: **34 passed, 0 failed**.
- `node tests/performance-mode.test.js`: **16 passed, 0 failed**.
- No browser/GPU render was available, so visual quality and actual frame-time changes were not measured.

### Known limits (4E-1E)
- Sparse Low-mode city lighting and its simpler glow have source and stubbed-scene coverage only. Visual coherence across day/night transitions and real-device performance remain unverified because Playwright/WebGL and device measurements are unavailable in this environment.
- No measured frame-rate, battery, or power improvement is claimed. The reduced point count and shader operations are source-level workload reductions.

## Next task
**4F-1A — Planet Disks, Phases, and Saturn Rings Integration.**

## Done: 4F-1A Planet Disks, Phases, and Saturn Rings Integration
**Verified first:** 4E-1E is complete above. The city-light Normal/Low sets, mode switching, simpler Low city glow, and one-refresh slider path have automated coverage.

**Integration review:** the page loads Three.js and the astronomy modules before `sky.js`, then loads `scene.js`, joystick, and keyboard wiring. `sky.js` keeps the disk sprites on the existing shared sky scene and updates them from the same astronomy results as the point render. The drawing path applies planet disk sizing, Venus/Mercury/Mars phase textures and orientation, and Saturn’s globe-plus-rings texture and orientation. No missing connection or directly related regression was found, so no feature code was changed for this audit.

**Tests performed (4F-1A)**
- `node tests/disks.test.js`: **31 passed, 0 failed**.
- `node tests/venus.test.js`: **48 passed, 0 failed**.
- `node tests/phase.test.js`: **78 passed, 0 failed**.
- `node tests/rings.test.js`: **104 passed, 0 failed**.
- `node tests/smoke.test.js`: **34 passed, 0 failed**.
- `node tests/render-sky.js`: **SKIPPED** because Playwright is not installed; a real Chromium/WebGL visual integration check could not be performed.

**Modified files (4F-1A)**
- `PHASE4_PROGRESS.md` only. No application code changes were needed.

### Known limits (4F-1A)
- Automated rendering-state and astronomy checks use stubs or math comparisons. Actual GPU rendering, visual appearance, and device-specific layout remain unverified here.

## Next task
**4F-1B — Atmosphere, Controls, Accessibility, and Description Integration.**

## Done: 4F-1B Atmosphere, Controls, Accessibility, and Description Integration
**Verified first:** 4F-1A is complete above. Planet disks, phase shading, and Saturn rings passed their focused tests and remain wired into the sky viewer.

**Integration review:** checked the existing sunrise/sunset palette and twilight/horizon uniforms, Normal-mode atmospheric effects, planet twinkle and Sun glow, the mobile joystick’s shared walking input, camera input attachment and resize behavior, keyboard navigation/focus handling, and selected/current sky descriptions. The page loads required controllers before the scene/control scripts. Dynamic descriptions refresh from updated sky state and suppress duplicate writes; the separately hidden object list remains descriptive without a live-announcement attribute. The existing card’s live region is retained. No directly related integration bug was found, so no application code or interface redesign was needed.

**Tests performed (4F-1B)**
- `node tests/palette.test.js`: **28 passed, 0 failed** (sun-altitude palettes and twilight/eclipse cases).
- `node tests/sky-modes.test.js`: **8 passed, 0 failed** (Normal atmospheric effects retained; Low mode simplifications isolated).
- `node tests/joystick.test.js`: **34 passed, 0 failed**.
- `node tests/camera.test.js`: **93 passed, 0 failed**.
- `node tests/keyboard.test.js`: **55 passed, 0 failed**.
- `node tests/object-descriptions.test.js`: **9 passed, 0 failed**.
- `node tests/smoke.test.js`: **34 passed, 0 failed**, including unchanged-description suppression, selection changes, and time-dependent description updates.
- `node tests/joystick-touch.test.js`: **SKIPPED** because Playwright is not installed.
- `node tests/camera-touch.test.js`: **SKIPPED** because Playwright is not installed.
- `node tests/keyboard-nav.test.js`: **SKIPPED** because Playwright is not installed.

**Modified files (4F-1B)**
- `PHASE4_PROGRESS.md` only. No implementation changes were needed.

### Known limits (4F-1B)
- Touch/pointer interaction in a real browser and keyboard navigation across actual screen sizes could not be verified without Playwright/Chromium. The corresponding logic and markup tests passed.
- Screen-reader announcement behavior has not been verified with a real assistive technology. The current task explicitly does not add or redesign live announcements.

## Next task
**4F-1C — Final Verification and Project Summary.**

## Done: 4F-1C Final Phase 4 Verification
**Verified first:** 4F-1A and 4F-1B are complete above. Their integration reviews and focused automated tests passed, with real-browser touch/navigation checks explicitly skipped because Playwright is not installed.

**Final checks:** reviewed page script order and feature wiring; checked the Normal/Low setting, pixel ratio and sky shader switching, sparse Low city lights, preserved Normal city lights, controls, descriptions, and planet/ring render paths. The application smoke test ran the sky and scene with stubs. No JavaScript syntax errors or stubbed smoke-test errors were found. The final browser console could not be checked because no browser automation runtime is available.

**Full automated suite:** `tests/run-all.sh` could not be invoked because this Windows environment has no `sh`/Bash command. Its checks were run individually using Node, along with the object-description test added later. Result: **617 assertions passed, 0 failed.** JavaScript syntax checks passed for **31 files**. Four browser-backed tests exited successfully with explicit `SKIP` messages because Playwright is unavailable: sky render, touch joystick, touch camera, and keyboard navigation. No test failures were hidden.

**Project size:** 58 files, **3,349,214 raw bytes** before ZIP compression (includes documentation, tests, reference datasets, comparison images, and `PROJECT_SUMMARY.md`; excludes the Three.js library loaded from the CDN). The complete final ZIP is packaged separately.

### Completed work through 4F-1C
- 4D-1 and 4D-2A/B/C: keyboard/accessibility groundwork, accessible object descriptions, and dynamic description updates with repeated unchanged text suppressed.
- 4E-1A/B/C/D/E: Low-mode audit, saved accessible mode setting, reduced Low-mode drawing-buffer resolution, separate simplified Low sky shader, sparse Low city lights and cheaper Low city glow. Normal mode retains the existing sky shader and full city light set.
- 4F-1A/B/C: planet disk/phase/ring integration audit, atmosphere/control/accessibility integration audit, and final suite and feature-wiring verification.
- Earlier Phase 4 work already present and retained: sunrise/sunset palette, horizon and atmospheric glow, planet twinkle, touch walking joystick, camera gestures, keyboard controls, and live sky-card description.

### Remaining incomplete work and verification limits
- Do **not** mark the project or Phase 4 fully complete. Prior Phase 1–3 targets still open in their reports include a Milky Way, a broader sourced star catalog (currently 17 named bright stars), a city/time-zone dataset (the free-time default remains solar time from longitude), Orrery-side link-builder work, and earlier visual/performance acceptance targets.
- The final full viewer has not been visually checked in Chromium, Firefox, Safari, on a phone, or on real GPU hardware. Playwright-dependent checks were skipped. Screen-reader behavior has not been tested with assistive technology.
- No final frame-rate, load-time, battery, or power measurements were taken. Pixel-count and point-count reductions are source-level workload changes only; they are not claims of measured speedup.
- The UI’s city is an intentionally generic procedural scene rather than a named real city. Some visual choices and planet disk cross-fade thresholds remain provisional pending visual review.

**Task status:** the requested ordered task sequence through 4F-1C is complete as code work, integration review, and available automated verification. The project-level acceptance gaps above remain open.

## Next prompt
**4F-2A — Browser and Device Visual Verification.** Open the packaged project over HTTP in a browser, verify the full viewer visually in Normal and Low modes and at representative dawn, dusk, night, and eclipse views; test touch, camera, keyboard, and screen-reader descriptions on available devices; record the browser/device, screenshots, issues, and measured performance honestly. Keep Phase 4 open if required platforms or acceptance criteria remain unverified.
