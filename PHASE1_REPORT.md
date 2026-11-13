# Orrery Sky - Phase 1 report (sky core, FIRST BUILD)
Nov 11, 2026. Not published. NOT run in a real browser or on a GPU: the viewer (`sky.js`) was only run with a stubbed three.js. Open it over http (for example `python3 -m http.server`), not file://, or the Moon texture cannot be read (it falls back to plain grey). three.js r128 loads from cdnjs, so you need internet.

## Built
- `sky-math.js`: Sun, Moon, 7 planets, 17 bright stars to altitude/azimuth; precession for planets and stars only; refraction (Bennett); altitude-only Moon parallax; planet magnitudes; faintest-visible-magnitude rule; extinction 0.2 mag/airmass; moonlight dimming; nearest-visible-time search (+/-36 h).
- `sky.js` + `index.html`: three.js sky dome coloured by Sun altitude, stars and planets as points that fade by magnitude, Sun glow, Moon drawn by the Phase 0 adapter, drag/keys/wheel look, fov 0.2-120, time and place controls, live text line, Orrery link (v, t, lat, lon, name, ev, look, fov, back) for all nine `ev` values, event cards, solar-filter warning.
- Tests: 16 sky-math checks and 18 stub-based smoke checks pass (`tests/run-all.sh`). Phase 0 tests are in the earlier zip.

## Measured (Node CPU, my memory-based references)
Sun altitude at the 2024-04-08 greatest point 69.7 deg (NASA about 70); Sun-Moon separation there 0.003 deg; Jupiter -2.82 and Mars -1.38 at opposition; Venus -4.63 in Feb 2025 (I expected about -4.9, so the old formula may run about 0.3 dim); Polaris altitude within 0.6 deg of latitude; sky() costs 0.16 ms per call.

## NOT done (Phase 1 target not met)
1. Milky Way: not drawn (needs the Orrery GV matrix and a real-browser orientation check).
2. Stars: only 17, typed from memory. Needs your BSC5 or HYG file.
3. Moon: no horizon tilt (parallactic angle), no libration; azimuth parallax neglected.
4. Event card: no local magnitude, contacts or obscuration (Phase 3); no lunar "go to place" button.
5. Time zones: "free" uses solar time from longitude, not a real time zone; no cities.json.
6. The three Orrery buttons: the Orrery side (SKY_URL and link builder) is not written; Sky's side of the link is.
7. Not measured: 30 fps, load time, phone behaviour, sky colours against the concept image, glare and glow.
8. Phase 1 "done when" is therefore NOT met.
