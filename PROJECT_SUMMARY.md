# Orrery Sky — Project Summary

Updated Nov 13, 2026, after Stage 5.6 integration review. This document describes the project included in the accompanying updated ZIP.

## What the project is

Orrery Sky is a small, static browser application for exploring an astronomical sky and a simple 3D observing site. The user can change the time and observing coordinates, look around the sky, inspect astronomical events, and walk between a glass dome and an outdoor terrace. The application is not published and has no build step or package manifest. It loads Three.js r128 from a CDN, so an internet connection is needed; serve the project over HTTP rather than opening `index.html` directly from disk.

## Astronomy and event features

- Computes the Sun, Moon, seven planets, and 17 named bright stars for a date and latitude/longitude. Sky data includes altitude/azimuth, refraction, visibility and magnitude estimates, and apparent sizes. Planet positions, phase, illumination, and magnitude share the same astronomy result used by the viewer.
- Includes topocentric Sun/Moon geometry, lunar parallax in altitude and azimuth, apparent solar and lunar radii, Moon orientation, and solar/lunar eclipse calculations.
- Builds local eclipse circumstances and event cards with contact times, visibility warnings, and time-jump buttons. Event links can include an IANA time-zone name; the ordinary “free time” default uses solar time from longitude rather than a location time-zone database.
- Includes reference datasets and test generators for sky, eclipse, planet phase, and Saturn-ring comparisons. Historical test notes describe comparisons to independent PyEphem/JPL DE421 results; these are engineering references, not a claim of official-almanac certification.

## Sky rendering

- Draws a sky dome with a Sun-altitude palette, sunrise/sunset color transitions, twilight and horizon effects, Sun glow, planet twinkle, stars and planets as points, and a Moon texture (`tex/MoonMoon2k.webp`).
- Fades planet points into true-size discs as the user zooms in. Mercury, Venus, and Mars discs receive procedural phase shading and are oriented toward the Sun. Saturn’s disc includes a procedural globe-and-rings image whose orientation follows the ring pole. Other planet discs remain unshaded.
- Supports solar and lunar eclipse shading, the solar disc and corona, and an astronomy status line and event information card.
- Offers a saved Normal/Low performance preference. Normal preserves the original pixel-ratio cap and sky shader, draws the full 7,828 city/roadside light points, and enables soft directional Sun shadows. Low reduces drawing-buffer resolution, uses a simpler sky shader and city-glow calculation, draws a 4,328-point city set that keeps all 828 roadside lights, and disables renderer shadows. Both modes can be switched without reloading. These are source-level workload reductions; no speed or power improvement has been measured.

## Environment and movement

- Builds a generic observing scene from code: ribbed glass dome and outward-swinging door, stone base and floor, terrace, walls and fences, mountain/cliff/foreground terrain, distant procedural city, daytime low buildings, lit towers, and a curved lighted road.
- Stage 5.1 updates the dome shell to a taller elliptical profile with curved metal ribs and segmented horizontal bands, a textured stone foundation and coping, and an arched curved glass door that retains the existing hinge and walking rules. The teal glass uses a palette-updated equirectangular environment map for stylized reflections. The design reference is included at `reference/dome-environment-design.jpg`; the surrounding procedural landscape is now in place and remains generic pending visual review.
- Stage 5.2 provides a raised stone platform with irregular flagstone paving, a bowed front retaining wall, coping and wire fencing. A semicircular stone path loops around the front and side shoulders of the dome. A later detail pass added irregular staggered paver courses, varied stone color, recessed joints, surface relief, and projecting retaining-wall piers. Walking collision includes the path but keeps the rear cliff and existing main terrace boundaries closed. The intersecting ridge was moved behind the observatory and the cliff backdrop refined with a denser, smoother mesh.
- Stage 5.3 reinforces all 68 terrace and path fence panels with lit diamond mesh and top, middle, and bottom metal rails, adds anchored foot plates and caps to 41 posts, and marks a distinct 1.9 m wide entrance route. Path-side guard sections rise about 1 m; the front terrace rail remains at its established height. These details preserve existing walking bounds. The latest terrace/railing update has not been tested yet.
- Stage 5.4 replaces the broad faceted backdrop with a 64 × 48 rocky height mesh, adds 56 instanced pines and 42 scrub forms outside the walkable area, and keeps the city lights, 1,400 low-rise buildings and nine illuminated towers down in the valley at a base around 250 m below the terrace. Normal/Low city point counts and switching are preserved.
- Stage 5.5 refines the transparent teal dome glass and curved door, adds a sky-linked scene environment for PBR reflections, subtle stone/paving bump detail, and warm amber interior/entrance lights. Sun-altitude profiles blend day, twilight and night; the updated procedural reflection map follows the Sun’s azimuth with a soft twilight band and includes a rocky horizon, stars, and valley lights. Hemisphere fill follows the sky palette; soft Sun shadows are enabled in Normal mode and disabled in Low mode. Reflections remain a stylized environment map rather than live geometry reflections.
- Stage 5.6 integrates the environment at reference scale: 7 m dome, 14 m terrace, 1.9 m entrance path, and city 250 m below. Its mountain revision uses a textured 112 × 80 main ridge, a 36 × 20 distant ridge, and 68 instanced outcrops. User feedback also led to four gridded city districts with 1,400 variable-height buildings and emissive windows, plus a 2.25 m door beneath the 1.65 m camera eye level. The latest dome detailing uses 16 individually reflective curved glass panes with subtle surface texture, varied rib profiles, and visible entrance hinges, pull plate, and threshold. Automated checks pass; visual approval and real-GPU performance measurements remain pending.
- Couples scene lighting, fog, city lights, and city glow to the Sun, Moon, and sky palette. A City glow slider controls city brightness and the faintest visible magnitude.
- Provides WASD movement, Shift to run, collision boundaries, a nearby-facing door interaction with E or a button, reduced-motion-aware head bob, and Dome/Terrace location buttons.
- Supports drag and arrow-key looking, mouse wheel, pinch zoom, keyboard zoom keys, a Flip look setting, and a touch joystick on coarse-pointer devices or when enabled. Camera and walking logic are separate modules and share the scene’s movement rules.

## Accessibility and interface

- Provides labels and keyboard focus styling for the sky canvas and controls, keyboard shortcuts for navigation, and escape-to-canvas focus handling.
- Includes a visually hidden object description list naming the Sun, Moon, seven displayed planets, and 17 bright stars. A current-sky description changes with visibility, selected object, and relevant time/sky information, while identical text is not written repeatedly.
- The current-sky description list itself is not a live-announcement region. The existing information card has its own polite status region. Screen-reader behavior has not been checked with assistive technology.

## Main files

- `index.html`: page, control markup, style, and script loading order.
- `sky.js`: Three.js viewer, astronomical object rendering, controls, event cards, and current-sky descriptions.
- `sky-math.js`: sky, palette, apparent-size, disk, phase, and orientation calculations.
- `engine/orrery-astro.js`, `engine/event-finder-core.js`, `engine/orrery-eclipse.js`, `eclipse-local.js`: astronomy, event search, eclipse geometry, and local circumstances.
- `scene.js`, `walk.js`: 3D site, sky-to-scene coupling, movement and collision rules.
- `camera-input.js`, `joystick.js`, `keyboard.js`: camera gestures, touch movement, and keyboard accessibility.
- `performance-mode.js`: saved Normal/Low mode and its change subscription API.
- `PHASE1_REPORT.md` through `PHASE3_REPORT.md`: earlier phase scope and known gaps. `PHASE4_PROGRESS.md` is the task and verification log. `PHASE4_AUDIT_*.md` record the object-description and Low-mode audits.
- `tests/`: Node-based astronomy and interaction tests, optional Playwright browser tests, reference data, and test-image artifacts.

## Verification status

For the 4F-1C baseline, JavaScript syntax checks passed for 31 files and the full Node test set produced **617 assertions passed, 0 failed**; four Playwright-backed checks skipped because Playwright was not installed. Stage 5.1 passes 9 dome architecture checks. Prior Stage 5.2 terrace checks: 10; prior Stage 5.3 railing checks: 5; Stage 5.4 environment checks: 8; Stage 5.5 material/lighting checks: 9; Stage 5.6 design integration: 8 and dome/door: 12. Stage 5.6 also passes 93 camera checks, 27 walking checks, 34 joystick checks, 16 performance-mode checks, 8 sky-mode checks, and 34 smoke checks. The touch-camera browser check skipped because Playwright was not installed. The latest terrace/railing, lighting/atmosphere, and asset-based environment revisions are untested by automated suites. The prior asset preview exposed cliff proxy models intersecting the hillside, so those models were removed from active placement. The latest environment package adds terrain-conformed mountainside scans and a modular apartment kit; Computer Use could not access a local browser in the latest turn, so the new render has not been visually checked. The complete visual result is not approved, and no real-device performance check has been done. The current package includes the Poly Haven asset files and GLTF loader; Three.js itself remains a CDN dependency.

## Open work and limits

- Earlier project revisions were visually inspected in a local Chromium-based browser. The latest asset-based render has not been checked because local browser access was unavailable to Computer Use in the current chat. Firefox, Safari, phone, and real GPU behavior are also unreviewed. Automated tests use Node, math references, or stubbed DOM/Three.js; they do not prove final appearance.
- Frame rate, load time, battery use, and power have not been measured. Visual choices, including planet point-to-disc cross-fade thresholds and the Low-mode sky/city appearance, still need review on representative screens.
- Earlier Phase 1–3 acceptance gaps remain: no Milky Way, only 17 manually selected bright stars instead of a broader sourced catalog, no city/time-zone dataset, no Orrery-side link-builder work, and no end-to-end browser/device performance acceptance. The Moon also has no libration model.
- The city layout is intentionally generic rather than a real named location. The latest working copy hides the old generated cube blocks and uses five repeated modular residential facade sections plus valley lights; visual review is still required to check repetition and scale. The low-poly ridge remains behind the observatory, with three scanned mountain sections overlaid in Normal mode and one in Low mode.

The ordered work through 4F-1C is recorded complete as implementation, integration review, and available automated checks; Stages 5.1–5.5 are implemented, while Stage 5.6 visual design approval remains pending. The new locally bundled models begin replacing prototype assets, but the environment still relies heavily on generated geometry and needs terrain-conforming scans, more natural foliage, better city composition, and real-device performance review.

## Asset-based environment follow-up — November 13, 2026

Added a local Three.js r128 GLTF loader and a bundled Poly Haven CC0 asset library under `assets/polyhaven/`. The corrected working copy uses two scanned mountain outcrops (one retained in Low mode), 30 pine instances and six fern clusters for Normal mode, and three material-merged residential facade sections at the valley floor. Generated cube city buildings and towers are hidden; valley lights and the low city elevation remain. Two earlier cliff proxy assets are retained but inactive because they clipped through the slope.

The previous local browser review exposed the proxy overlap. The latest code and model placement changes could not be visually reviewed because Computer Use reported that local browser access was unavailable in the current chat. Automated tests and real-device performance checks were not run for this follow-up. Stage 5.6 design approval remains pending until day/twilight/night and Normal/Low views are visually accepted. Inspect mountain contact, city repetition, vegetation placement, and performance before approval.

## User-reported city visibility, mountains, and lag correction — November 14, 2026

The provided screenshots showed the terrace camera still looking above the valley, huge scanned rock faces with stretched lower surfaces, and an excessive model workload. The Terrace shortcut now looks 18° downward toward the city (still at y = -250 m); the Dome shortcut resets the camera to level. The mountain set is now two smaller intact scanned outcrops anchored at the sampled hillside and sunk slightly into the terrain, with one visible in Low mode. The residential kit layout is reduced to three sections and merged by material (about five mesh groups per kit instead of roughly 147 separate mesh draws); the old cube city remains hidden. Procedural mountain boulders were reduced from 68 to 28 and distant imported rock/building meshes no longer cast shadows.

`node --check scene.js` passed. Automated suites and GPU/frame-rate measurements were not run. Computer Use still cannot access a local browser in this chat, so these corrections are not visually verified; Stage 5.6 approval remains pending. Recheck the corrected day/night city view, mountain-to-slope contact, and Normal/Low performance before sign-off.

## Stage 5.6 skyline visibility correction — November 13, 2026

The daytime buildings were present but nearly hidden against the horizon because the terrace shortcut was too level relative to the city 85 m below. The Terrace view now tilts 15° downward, the nearest facade row is 330–370 m away rather than about 500 m, and the assembled facade/body scale is 2.1×. Daylight browser review showed the buildings in both Normal and Low modes, with clearer facade detail in Normal. Twilight Low and night Normal spot checks retained visible city lights. The revised terrain retains the earlier smoothed/darker ridge and reduced Normal-only scanned model workload.

Targeted verification: scene syntax passed; environment checks **11/11 passed**; design-integration checks **9/9 passed**; performance-mode checks **16/16 passed**. Visual review used the local browser at the current desktop viewport. The skyline and mountains remain stylized, Low mode uses the procedural ridge, and no frame-rate/GPU benchmark was made. Stage 5.6 design approval therefore remains pending.

## Screenshot-driven visual correction — November 13, 2026

The user’s latest captures showed a detached scanned rock on the mountain crest, pale angular imported rock chunks, gray terrain, and a small repeated block skyline. The detached mountainside and rock-face placements were removed. Terrain now uses a warm, multiscale stone texture and overlapping sharper peak profiles; separate boulders were reduced to 10 and darkened. The assembled city grew from 29 to 37 buildings (13 in Low), with instanced podiums, roof caps, selected rooftop bulkheads/tanks, and varied warm facade/body colors.

Verification: JavaScript syntax passed; environment tests **12/12**, design integration **11/11**, and performance-mode tests **16/16** passed. The updated local scene rendered in the daylight city view with no browser console errors. The mountain-facing result still needs a clear visual check; city facades remain generic and no frame-rate benchmark has been performed. Stage 5.6 visual approval remains pending.

## Current Stage 5.6 update — detailed texture tiers, foliage, and city massing

The current package bundles CC0 Poly Haven textures: Rocky Terrain 02 diffuse at 8K/2K and normal maps at 4K/2K; Brick Wall 003 and Concrete Wall 009 diffuse maps at 4K/2K. Normal mode requests 8K mountain diffuse plus 4K normal and city diffuse maps. Low mode requests 2K textures. Texture quality changes with the existing performance control, and stale texture downloads are discarded when modes switch quickly. `assets/polyhaven/HIGH_RES_TEXTURES.md` records sources and license.

The mountain now uses 180 instanced conifers and 160 instanced shrubs in Normal mode, reduced to 56 and 42 in Low mode, alongside 12 scanned pine details in Normal. The generated skyline keeps 1,400 instanced city blocks across four districts but concentrates more of the tallest buildings into its central district; current generated buildings range from about 8 m to 354 m, with 172 at or above 105 m. The lower valley remains at -85 m and the existing 37/13 assembled facade instances remain available in Normal/Low.

The texture loader’s renderer reference was fixed after browser console inspection showed the maps could not be assigned. Scene syntax, environment (**13/13**), design integration (**11/11**), and performance-mode (**16/16**) checks pass. The local browser was reloaded; daylight Normal and Low skyline views were inspected, and no new texture-loader error appeared after the correction. The city and mountains are still stylized, the camera can frame the terrace railing prominently, and no measured FPS/VRAM/load-time benchmark exists. Stage 5.6 visual approval remains **pending**; inspect day, twilight, and night in both modes and benchmark the target device before sign-off.

## Blender-authored environment model

Blender 5.3.0 was used to create the editable `assets/blender/nyc_skyline_cluster.blend` and a compact `assets/blender/nyc_skyline_cluster.glb`. The authored cluster contains 14 individually named landmark towers and 34 mixed mid-rises with varied brick, concrete, limestone, and glass facade styles, window layouts, setback crowns, spires, and rooftop equipment. The build script batches geometry into seven material meshes and creates physically scaled UV tiling. Blender source materials link the included CC0 Poly Haven 4K brick/concrete maps; the web runtime assigns 4K in Normal and 2K in Low, while mountain texture selection is 8K/4K Normal and 2K Low. The model is integrated at the existing -85 m city base, shown in Normal, and hidden in Low.

The new GLB and Blender source test passes **5/5**; environment checks pass **13/13**, design integration **11/11**, and performance mode **16/16**. The browser showed the landmark model in daytime Normal and hid it in Low; switching back restored it without new console errors. Blender’s headless EEVEE preview could not use the Intel UHD 620 Vulkan driver, so final visual checking was done through the app’s WebGL browser view. This is an original stylized city asset, not photogrammetric New York; its visual quality and performance still need review on a larger view and target hardware. No custom texture maps were baked and no FPS/VRAM benchmark was run. Stage 5.6 approval remains **pending**.

## Latest screenshot-driven lighting and building-scale adjustment — November 13, 2026

Responded to the latest screenshots by increasing the terrain's daylight-only warm emissive lift and reducing the Blender city landmarks to 45% of their authored height; supporting mid-rises now use a 26–64 m range. Rebuilt `assets/blender/nyc_skyline_cluster.blend` and `.glb` with the Blender build script. Facade UVs and all four runtime material families remain supported by the existing 4K Normal / 2K Low assignments. Fixed the script's output path resolution so model builds and linked textures resolve within the project regardless of Blender's working directory.

Checks: Blender 5.3 model export succeeded; scene syntax passed; environment **13/13**, Blender asset integration **6/6**, design integration **11/11**, and performance-mode **16/16** passed. The browser review showed the skyline before the final additional height reduction; the final export still needs a reload and visual confirmation. Mountain daylight appearance likewise needs a mountain-facing check. The scene remains stylized, equal texture readability is not visually confirmed, and no target-device performance benchmark was run. Stage 5.6 visual approval stays pending.

## Latest visual correction — November 14, 2026

Removed the low-poly cone-tree and scrub-rock prototypes that made the hillside read as a game environment. Normal mode now places a bounded set of bundled, textured scanned pine models and a few more fern models; Low mode skips the imported trees. Fixed Blender skyline texture handling: embedded facade images stay assigned until the chosen higher-resolution 4K Normal or 2K Low maps finish loading. Reduced generated city block heights to 8–75.8 m and brightened their facade palettes so Blender's landmark towers remain the visual focus.

Verified scene syntax and focused tests: environment 13/13, Blender asset integration 6/6, design integration 11/11, performance mode 16/16, material/lighting 9/9. Browser spot check: daytime Normal mode, Terrace view; landmark buildings and lower city visible, with embedded facade maps retained. The skyline is still stylized, especially its procedural city fill, and the Terrace railing can obstruct it. Mountain-facing appearance and the full day/twilight/night × Normal/Low matrix still need review; no FPS/VRAM benchmark was run. Stage 5.6 approval remains pending.
