# 4E-1A Audit: Low-Performance Mode opportunities

Date: Nov 13, 2026. Audit only; no rendering or application code changed. No browser, GPU, phone, or frame-rate measurement was performed. `Orrery_Sky_MASTER_Handoff.md` was not present in the project ZIP or current workspace.

## Scope inspected

Reviewed `sky.js`, `scene.js`, `sky-math.js`, `index.html`, and Phase 1-3 reports. The current app uses Three.js r128, one WebGL renderer, a continuously requested animation frame, a full-screen dome fragment shader, sky object points and sprites, and a static city scene.

## Current workload and safe opportunities

1. **Render resolution is the strongest simple lever.** `sky.js` caps device pixel ratio at 1.5. Fragment work scales approximately with pixel count, which scales with the square of this ratio. Reducing the cap from 1.5 to 1.0 gives about 55.6% fewer drawing-buffer pixels on screens whose device pixel ratio is at least 1.5. This is pixel-count arithmetic, not a measured frame-rate improvement. A lower cap trades sharpness for more savings and should be checked on representative screen sizes.

2. **The dome shader runs for the viewport on every rendered frame.** Its fragment code evaluates the base gradient plus horizon haze, a twilight belt, Sun glow, city glow, and dither, using multiple `pow` and `exp` operations. A Low-mode shader variant could preserve the base day/night sky and the Sun, Moon, planet, and star rendering while omitting or simplifying selected optional effects. Check dawn, dusk, nighttime, and eclipse scenes before keeping each simplification.

3. **City light points form a sizable but single draw.** `scene.js` builds 7,000 city points plus 828 roadside points (7,828 total), with frustum culling disabled. Low mode could use a separately prepared sparse point set, leaving the normal set intact and keeping the recognizable city pattern. The city buildings are already instanced: 1,400 building instances plus nine tower meshes. Removing those structures risks visible scene loss and is a weaker first target.

4. **City-glow input triggers avoidable work.** The City glow slider handler calls `H.redraw()` twice on every input event. `H.redraw()` calls `update(true)`; the forced path recomputes the sky and redraws the 256 × 256 Moon texture even though a city-glow change does not alter the Moon texture. Removing the duplicate call and avoiding the forced Moon texture redraw for a city-only change are low-risk cleanup candidates. The slider still needs to update the limiting magnitude, point alpha, and dome city glow.

5. **Planet and star object count is small.** There are 7 planets and 17 stars. Planet disk sizing is checked each animation frame, and orientation for shaded planets and Saturn's rings is updated with the view. Phase textures redraw only after 0.25° of phase change and while the disc is shown; Saturn's ring texture redraws only after 0.1° of tilt change and while its disc is shown. These guards already constrain canvas work. Reducing object count or changing astronomy calculations would be a poor performance tradeoff.

6. **Antialiasing is enabled at renderer creation.** Low mode could reduce multisampling, but the `antialias` context attribute is chosen when the WebGL context is created. A live mode toggle cannot simply change it on the existing renderer; recreating the context would be disruptive. Treat this as optional only if Low mode is selected before renderer creation or a safe context lifecycle is designed.

7. **The renderer continuously requests frames.** This keeps camera movement, walking, and scene updates responsive. A lower render cadence could reduce GPU submissions, but it will affect motion smoothness and needs interaction testing. It is not recommended before resolution and shader simplification are measured.

## Suggested order for the next tasks

- **4E-1B:** add a Normal/Low setting without changing rendering; keep Normal as the default.
- **4E-1C:** lower the pixel-ratio cap only in Low mode. Preserve the existing Normal cap and verify resize, camera dimensions, and readability.
- **4E-1D:** simplify optional dome shader effects in Low mode while retaining important astronomical objects and the base sky.
- **4E-1E:** lower city-light point density and simplify city glow separately; preserve the Normal appearance and slider behavior. Remove the duplicate forced redraw and avoid redrawing the Moon texture for city-only changes if the implementation can distinguish update causes safely.

## Verification limits

No automated tests were run because this was a source audit with no code changes. No visual or performance claims are made. The suggestions are hypotheses based on the current source and need measurements in a real browser/GPU before claiming a speed improvement.