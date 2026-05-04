# WorldMap 3D Enhancement — Design Spec

**Date:** 2026-05-04
**Author:** Tuna Deniz (with Claude Code)
**Status:** Draft for user review
**Project:** ISO Testing World — OPUS team
**Phase:** Post-prototype (Week 4+) — visual and pedagogical upgrade of the WorldMap.

---

## 1. Summary

The WorldMap is a Three.js + react-three-fiber 3D scene that already exists in
[`iso-testing-world/src/pages/WorldMap.jsx`](../../../iso-testing-world/src/pages/WorldMap.jsx).
It has 5 procedural buildings, roads, lamps, trees, and a Sky background. This
phase rebuilds the WorldMap into a **pedagogically expressive, visually polished
3D scene** where every building is a metaphor for the ISO concept its zone
teaches, the central plaza shows live progress, and a sunset atmosphere with
post-processing gives the scene the production quality the rest of the game
deserves.

**Primary goal:** pedagogical depth — each building visually expresses an
ISO/IEC/IEEE 29119-1:2022 concept cluster.
**Secondary goal:** visual quality — sunset lighting, bloom, lit windows,
atmospheric perspective, sinematic camera moves.

Three.js is permitted **only on the WorldMap** (CLAUDE.md §14). All geometry is
**procedural** — no GLTF/FBX/OBJ assets, no `useGLTF()` calls (CLAUDE.md §15).

---

## 2. Context

### 2.1 Current state
- **File:** `iso-testing-world/src/pages/WorldMap.jsx` (~760 lines, all in one file)
- **Stack:** `three`, `@react-three/fiber`, `@react-three/drei` (Sky, Float,
  Html, ContactShadows, Line, OrbitControls)
- **Buildings:** 5 procedural shapes (`OfficeBuilding`, `Skyscraper`,
  `CampusBuilding`, `DataCenter`, `ExecutiveHQ`) — generic forms, no pedagogical link
- **Atmosphere:** daytime Sky, hemisphere + directional + ambient lighting
- **Interaction:** Float (hover bob), instant route change on click, OrbitControls
- **Bundle:** WorldMap chunk ≈ 1.45 MB raw / 412 kB gzip

### 2.2 What changed before this spec
- Earlier this session, broken `useGLTF` references for fountain + cars were
  removed (`iso-testing-world/src/three/SceneProps.jsx` and
  `useNormalizedGLTF.js` deleted). Their assets had already been removed from
  `public/models/`. The WorldMap now runs cleanly without external assets.
- CLAUDE.md was updated to lock `three` / `@react-three/fiber` / `@react-three/drei`
  into the stack list (§2), forbid 3D inside zones (§14), forbid external 3D
  models (§14, §15), and forbid `useGLTF()` (§15).

### 2.3 Why now
Week 3 prototype was delivered. This is a Week 4+ quality phase — no deadline
pressure. The motivating user request: "3D haritamız vardı ve bunu daha iyi bir
seviyeye getirmek istiyoruz."

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Replace 5 generic procedural buildings with 5 pedagogically themed buildings
  that visually express their ISO concept cluster.
- Add a central 5-ring progress sculpture that fills as zones are completed.
- Apply a sunset atmosphere — warm directional light, long shadows,
  Sky tuned for golden hour.
- Add lit windows on unlocked buildings and dark windows on locked ones.
- Implement cinematic interactions: 0.6 s camera zoom on click, rim light on
  hover, hover card with ISO concept hint, completed-zone light beam, flowing
  data dots on completed roads.
- Honour `prefers-reduced-motion` across every animated element.
- Stay within performance budget: ≤ 1.5 MB raw bundle for WorldMap chunk,
  ≥ 30 FPS on a mid-range laptop.
- Decompose `WorldMap.jsx` from 762 lines into a `world/` module of focused
  files (~16 files, each 80–150 lines).

### 3.2 Non-goals (explicit out-of-scope)
- Mobile or tablet support. Desktop/laptop only this phase.
- 2D fallback. Reduced-motion freezes animations but the scene stays 3D.
- Day/night toggle. Sunset only.
- Procedural human figures or NPCs.
- Procedural cars (the deleted GLTF cars are not coming back).
- A fountain. The CenterHub progress sculpture replaces it conceptually.
- Any 3D inside the 5 zones or Final Inspection. Those stay DOM-based per
  CLAUDE.md §14.
- Authoring new ISO content. All `isoRef` strings already exist in
  `iso-definitions.js`. Hover-card hints reference those clauses but are not
  added to the canonical definitions file.

---

## 4. Architecture

### 4.1 New folder layout

```
src/
  pages/
    WorldMap.jsx                      ~150 lines — page composition only
    WorldMap.css                      (unchanged)
  world/                              NEW. All 3D code lives here.
    scene/
      Scene.jsx                       top-level scene composition inside <Canvas>
      Lighting.jsx                    sunset directional + hemisphere + ambient
      Atmosphere.jsx                  Sky, fog, post-processing pipeline
      Ground.jsx                      grass plane + central plaza
      ZoneFloor.jsx                   per-zone ground patch (existing ZonePatch refactored)
    buildings/
      ErrorDistrict.jsx
      VVTower.jsx
      MatrixHub.jsx
      ArtefactArchive.jsx
      FinalHQ.jsx
      _shared/
        materials.js                  CONCRETE, GLASS, GLASS_LIT, LOCKED, METAL, ACCENT
        BuildingShell.jsx             rim-light wrapper, hover scale, click handler
        Window.jsx                    lit/unlit window component
    props/
      Roads.jsx                       roads + flowing data dots
      StreetLamps.jsx                 (existing logic moved here)
      Trees.jsx                       (existing procedural trees moved here)
      CenterHub.jsx                   5-ring progress sculpture
    interaction/
      useCameraZoom.js                tween-and-navigate hook
      HoverCard.jsx                   floating ISO hint card via drei <Html>
      useReducedMotion.js             matchMedia hook
    data/
      zone-themes.js                  per-zone: color, accentColor, completedLightColor, gridPos
      iso-hover-text.js               per-zone: { title, clauses, hint }
```

**Total new files:** ~16. Each file 80–150 lines. `WorldMap.jsx` shrinks from
762 to ~150. All existing zone pages, components, hooks, context, and data
files remain untouched.

### 4.2 Data flow

```
WorldMap.jsx (page component)
    ├── useGame()         → completedZones, isZoneUnlocked, totalScore
    ├── useNavigate()     → route transitions
    ├── useState          → hoveredId
    └── <Canvas>
            └── <Scene>
                ├── <Atmosphere>      (Sky, fog, post-processing)
                ├── <Lighting>        (directional, hemisphere, ambient)
                ├── <Ground>
                ├── <ZoneFloor>       per zone, 5×
                ├── <Roads completedZones={…} reducedMotion={…} />
                ├── <StreetLamps />
                ├── <Trees />
                ├── <CenterHub completedCount={…} reducedMotion={…} />
                ├── <BuildingShell zoneId locked completed
                │       hovered onHover onClick> 5×
                │     wraps one of: ErrorDistrict | VVTower | MatrixHub
                │                   | ArtefactArchive | FinalHQ
                └── <HoverCard zoneId={hoveredId} buildings={BUILDING_POSITIONS} />

useCameraZoom (hook, called from BuildingShell onClick)
    → disables OrbitControls
    → tweens camera.position + controls.target for 0.6 s
    → calls navigate(zoneRoute) on completion
```

### 4.3 State boundaries

- `hoveredId` lives in `WorldMap.jsx` (page level) because the `HoverCard`
  needs it and so does the `BuildingShell`'s rim-light intensity.
- `completedZones`, `unlockedZones` come from `useGame()` (existing context).
- Camera animation state is internal to `useCameraZoom` (a `useRef`) and is
  not lifted up.
- `prefers-reduced-motion` is read by `useReducedMotion` at each consumer site
  (cheap — just a `useState` + matchMedia listener). No prop drilling.

### 4.4 Module contracts

**`world/buildings/_shared/BuildingShell.jsx`**
```jsx
<BuildingShell
  zoneId="vv-headquarters"
  position={[x, 0, z]}
  locked={boolean}
  completed={boolean}
  hovered={boolean}
  onHover={(zoneId | null) => void}
  onClick={(zoneId) => void}
>
  {/* the actual building geometry — VVTower, MatrixHub, etc. */}
</BuildingShell>
```
Provides: rim-light pointLight, Float wrapper (disabled if reducedMotion or
locked), hover scale, click handler, ZoneFloor patch underneath, completed
ring + light beam, building label via `<Html>`.

**`world/interaction/useCameraZoom.js`**
```js
const zoomToBuilding = useCameraZoom();
zoomToBuilding(targetPosition: [x, y, z], routePath: string);
```
Side effects: disables OrbitControls, tweens for 0.6 s (0.05 s under
reduced-motion), calls `navigate(routePath)` at completion. Idempotent — a
second call while a tween is in flight is a no-op.

**`world/interaction/HoverCard.jsx`**
```jsx
<HoverCard zoneId={'vv-headquarters' | null} positions={…} />
```
Renders an `<Html>` block at `positions[zoneId]` with the hint from
`iso-hover-text.js`. Fade-in 200 ms, fade-out 150 ms (0 ms under reduced-motion).

**`world/data/zone-themes.js`** schema
```js
{
  'vv-headquarters': {
    color: '#3b82f6',
    accentColor: '#0c447c',
    completedLightColor: '#3b82f6',
    gridPos: [4.2, 0.8],
    labelHeight: 17,
  },
  // … one entry per zone
}
```

**`world/data/iso-hover-text.js`** schema
```js
{
  'vv-headquarters': {
    title: 'Verification · Validation · Oracle',
    clauses: '§4.1.3 · §3.115',
    hint: 'Verification asks "did we build it to the spec?". Validation '
        + 'asks "did we build the right thing?". Either party can do '
        + 'either — the question, not the role, decides which one applies. '
        + 'The Oracle is the criterion that determines pass/fail.',
  },
  // … one entry per zone
}
```

> **OPEN QUESTION (FQ-1):** Hover hints language — English (matches CLAUDE.md
> §14 "English only") or Turkish (matches the user's daily working language)?
> Default in this spec is English to stay consistent with the rest of the game.
> If the user picks Turkish, this is the only file that changes.

---

## 5. Visual Design — 5 Buildings

Each building uses the shared materials (`materials.js`) and is wrapped in
`<BuildingShell>`. The geometry inside each file is procedural — `boxGeometry`,
`cylinderGeometry`, `sphereGeometry`, `extrudeGeometry`, `torusGeometry`,
`latheGeometry`. No GLTF.

### 5.1 ErrorDistrict.jsx — broken office (Error → Fault → Failure)

**Concept link:** §3.39 (incident), §4.7 (defect & incident management).
A single visible event is the failure; the broken code is the fault; the
human action that caused it is the error. The building shows all three
visually as a chain.

**Geometry:**
- **Tilted podium** — `boxGeometry [5, 1, 3]`, rotated `z = 0.04 rad` to feel
  unstable.
- **Main tower** — `boxGeometry [3.5, 6, 2.5]`, plus an `extrudeGeometry`
  cap with one corner sliced off (chamfered roof = "collapsed corner").
- **Cracked glass strips** — 4 thin `boxGeometry` panels at heights 2.0 / 2.8
  / 3.6 / 4.4. Each uses GLASS material with thin emissive red bars
  (`emissive: '#ff3b3b', emissiveIntensity: 0.6`) layered as additional
  micro-boxes — read as cracks at distance.
- **Roof alarm** — `cylinderGeometry [0.18, 0.3, 0.4]` + `sphereGeometry`
  on top. Pulsing emissive red, period 1.2 s, intensity 0.2 ↔ 1.5 via
  `useFrame`. **Reduced-motion: held at 0.85.**
- **Three fallen boxes** in front of the building, in a row — small / medium /
  large, sized 0.4 / 0.7 / 1.0. Connected by thin emissive bars (zone red).
  Emissive intensity ramps small→large 0.3→1.0 (error subtle, failure visible).
  Each labelled via `<Html>` with `ERROR §3.39` / `FAULT/DEFECT` / `FAILURE`.

**Pedagogical message conveyed by the form:** the same incident has three
stages, each more visible than the last. The fallen boxes literalise the
chain.

### 5.2 VVTower.jsx — symmetric two-wing tower (Verification ↔ Validation)

**Concept link:** §4.1.3 (V&V), §3.115 (Test Oracle).
Verification and Validation are not separated by who does them but by the
question being asked. The two wings represent the two questions; the bridge
between them represents the shared structure; the antenna on top is the
Oracle.

**Geometry:**
- **Shared podium** — `cylinderGeometry [4, 4, 1]`, both wings sit on it.
- **Left wing (Verification)** — `boxGeometry [2.5, 8, 3]` with a strict 4×8
  glass grid facade (32 small panels, 0.5×0.85 each, mid-blue tinted GLASS).
  Reads as "structured, conforms-to-spec".
- **Right wing (Validation)** — same dimensions but the side facing the camera
  uses a `latheGeometry` with a sinuous profile — wavy organic side. Greenish
  GLASS tint. Reads as "fluid, fits-real-use".
- **Glass bridge** — `boxGeometry [4, 1, 1.5]` at height 4 m, GLASS, connects
  the two wings. Subtle emissive trim.
- **Bridge label** — `<Html>` "V & V" centered between the wings.
- **Oracle antenna** on top, centered above the bridge — `cylinderGeometry`
  spire + a `torusGeometry` ring rotating slowly (`useFrame`, y-axis, period
  6 s). Gold emissive when unlocked. **Reduced-motion: stops rotating.**

**Pedagogical message:** two questions, one structure, one oracle.

### 5.3 MatrixHub.jsx — 4×4 grid-facade research tower (Levels × Types)

**Concept link:** §3.108 (test level), §3.130 (test type), §3.130 Note 1
(orthogonality — a type can apply at multiple levels).

**Geometry:**
- **Main tower** — `boxGeometry [5, 7, 5]`, cubic and modern.
- **Facade grid** — 4×4 = 16 small glass panels per face (1×1.4×0.05), thin
  concrete dividers between them. Same grid on all four faces — the tower
  reads identical from every angle.
- **Independent cell pulses** — each panel has emissive intensity following
  `0.3 + 0.4 * sin(t * 1.5 + index * 0.37)`. The phase offset means panels
  light independently — orthogonality made visible. **Reduced-motion: every
  panel held at intensity 0.5 (still lit, no flicker).**
- **Cell colours** — drawn from the four zone colours (red / blue / green /
  amber) cycling diagonally — diagonal cells are different colours, reinforcing
  axis independence.
- **Cross-axis symbol on roof** — two `cylinderGeometry [0.1, 0.1, 4]` rotated
  90° to each other forming an X. Zone-green emissive.
- **Wide low podium** — `boxGeometry [7, 1, 7]`, lab-campus feel.

**Pedagogical message:** 4×4 visible at every angle. Cells light
independently — type and level are independent axes.

### 5.4 ArtefactArchive.jsx — twin-wing archive (Static · Dynamic · Test Basis)

**Concept link:** §3.84 (test basis), §3.107 (test item / test object),
§3.78 (static testing), §3.29 (dynamic testing). §3.84 Note 1: "the test
basis may also be an undocumented understanding."

**Geometry:**
- **Left wing (Static)** — `boxGeometry [4, 4, 3]`, facade has 12 thin
  horizontal `boxGeometry` strips at fixed Y positions (bookshelf rows).
  Stone-grey concrete, no animation. Reads as "shelved, motionless artefacts".
- **Right wing (Dynamic)** — same dimensions, facade has 3 emissive horizontal
  strips that scroll vertically via `useFrame` (modulo loop, 4 s period).
  Reads as "code in motion, things being executed". **Reduced-motion: strips
  freeze in place.**
- **Shared roof slab** — `boxGeometry [9, 0.3, 4]`, ties the two wings under
  one roof.
- **Front placard** — small `boxGeometry [0.6, 0.6, 0.05]` + `<Html>` "verbal_
  agreement.txt", a tiny post-it style label. A subtle nod to §3.84 Note 1 —
  the trap artefact in Zone 4. The hover card on this building mentions it.
- **Loading ramp** — sloped `boxGeometry`, archive aesthetic.

**Pedagogical message:** static and dynamic are both testing — twin wings of
the same archive. Even an undocumented agreement is a test basis.

### 5.5 FinalHQ.jsx — domed inspection HQ (5 zones + Oracle beam)

**Concept link:** §3.115, §4.1.10 (Test Oracle), and integration of all
prior zones.

**Geometry (extends the existing `ExecutiveHQ` with concept-driven additions):**
- **Wide circular podium** — `cylinderGeometry [4.5, 4.5, 1, 32]` (kept).
- **Five facade columns** in a half-arc at the front — `cylinderGeometry
  [0.22, 0.25, 3.2]` each, positioned at angles -50° / -25° / 0° / 25° / 50°
  on a 3.5 m radius. **Each column carries one zone's colour** (emissive band
  rising from base to mid-height):
  - Column 1: error-district red
  - Column 2: vv-headquarters blue
  - Column 3: matrix-tower green
  - Column 4: artefact-archive amber
  - Column 5: final/oracle purple
- **Column glow scales with completedZones** — emissiveIntensity 0.1 if zone
  not done, 0.8 if done. Live-bound to game state.
- **Drum + glass dome** — kept (`cylinderGeometry [3.2, 3.2, 1.8]` +
  `sphereGeometry` half-sphere with `meshPhysicalMaterial` transmission 0.35).
- **Oracle beam** on top — replaces the dome accent sphere. A
  `cylinderGeometry [0.15, 0.6, 25]` reaching up into the sky, alpha-gradient
  material (top fades), purple emissive. Intensity scales with
  `completedZones.size / 4` — fully bright when all four prior zones complete.
- **"ISO INCIDENT REPORT" placard** at the front — `<Html>` panel, illuminated
  in zone-purple when this final is unlocked.

**Pedagogical message:** five score rows = five columns. Oracle beam visible
from anywhere on the map, brightens as you progress. The HQ literally lights
up as you approach completion.

---

## 6. Atmosphere

### 6.1 Sky (drei `<Sky>`)
- `inclination={0.49}` — sun near the horizon
- `azimuth={0.25}` — sun at front-right of the camera default view
- `turbidity={6}` — warm haze
- `rayleigh={2.5}` — strong orange/pink scattering
- `mieCoefficient={0.005}`, `mieDirectionalG={0.92}` (kept defaults)

### 6.2 Lights (`Lighting.jsx`)
- **Directional (sun)**:
  - `color="#ffb27a"` (sunset orange)
  - `position={[60, 18, 30]}` — low, long shadows
  - `intensity={1.8}`
  - `castShadow`, `shadow-mapSize=[2048, 2048]`, shadow camera covers
    `±45` on each axis (existing values fine)
- **Hemisphere**:
  - `skyColor="#ffd9a8"` (warm sky)
  - `groundColor="#3a4a3e"` (greenish ground bounce)
  - `intensity={0.4}`
- **Ambient**:
  - `color="#5a6a8a"` (cool fill — keeps sunset contrast)
  - `intensity={0.2}`

### 6.3 Fog
- `<fog attach="fog" args={['#d4a880', 30, 110]}>` — warm sunset haze.
  Distant buildings fade into atmospheric perspective.

### 6.4 Ground
- **Grass plane** — `planeGeometry [200, 200]`, color `#4a6840` (dark olive,
  contrasts the warm light without competing).
- **Central plaza** — `planeGeometry [38, 38]`, color `#d4c4a0` (warm beige,
  catches sunset light).

### 6.5 Window lighting (`_shared/Window.jsx`)
- Each window is a thin `boxGeometry` GLASS panel.
- `lit` prop: when true, switches to GLASS_LIT material — GLASS plus
  `emissive: '#ffe8a8', emissiveIntensity: 1.5`.
- Per-building rule: `lit = unlocked && ((windowIndex * 7) % 10 < 3)` — about
  30 % of windows lit, deterministic by the window's index in its building's
  array (so the lit pattern is stable across re-renders and is the same on
  every machine). Locked buildings: no lit windows.

### 6.6 Post-processing (`Atmosphere.jsx`)
New dependency: `@react-three/postprocessing` (~80 kB gzip).
- **Bloom**: `intensity={0.6}, luminanceThreshold={0.85},
  luminanceSmoothing={0.3}`. Only very bright emissives bloom — Oracle beam,
  flowing road dots, lit windows at glancing angles, completed light beams.
  Building surfaces are not affected (their roughness keeps them below
  threshold).
- **Vignette**: `darkness={0.45}, offset={0.5}` — cinematic edge falloff,
  draws attention to the centre.
- **SMAA**: edge anti-aliasing, lighter than MSAA.

> **OPEN QUESTION (FQ-2):** add `@react-three/postprocessing` (~80 kB gzip).
> This pushes us close to the 1.5 MB raw bundle ceiling but gives a
> meaningful visual lift. Default in this spec: yes, add it. If perf
> measurements show we exceed the budget after build, the fallback is to drop
> Bloom + Vignette and keep only SMAA (zero extra bundle).

---

## 7. CenterHub — 5-ring progress sculpture

Replaces the deleted fountain conceptually. Geometric, pedagogical, alive.

**Geometry:**
- **Stone base platform** — `cylinderGeometry [2.5, 2.5, 0.4]`, warm grey.
- **Five horizontal rings** stacked vertically, all sharing the central axis:
  - `torusGeometry [2.0, 0.12, 12, 48]` for each
  - Heights: 0.8 / 1.5 / 2.2 / 2.9 / 3.6 (evenly spaced)
  - Ring 1 = error-district, 2 = vv-headquarters, 3 = matrix-tower, 4 =
    artefact-archive, 5 = final-inspection
- **Per-ring state**:
  - Not completed: dull grey, `emissive: '#222', emissiveIntensity: 0.1`,
    static.
  - Completed: zone-color emissive 0.8, slowly rotating about y-axis (period
    8 s). **Reduced-motion: still lit, no rotation.**
- **The fifth (final) ring**: stays grey until rings 1–4 are completed, then
  blooms into gold emissive 1.0.
- **Vertical spine** — thin `cylinderGeometry [0.05, 0.05, 4.2]` through the
  rings' centres, gives the sculpture continuity.
- **Crowning sphere** — `sphereGeometry [0.25]` on top of the spine, golden
  emissive when all five rings are complete (mirrors the FinalHQ Oracle beam).

**Position:** centered on the plaza at world origin `[0, 0, 0]`.

**Pedagogical message:** the world's centre is the integration of the five
zones. As you progress, the centre comes alive.

---

## 8. Interaction

### 8.1 Camera zoom on click (`useCameraZoom`)
- User clicks an unlocked building → `BuildingShell` calls
  `zoomToBuilding(buildingPosition, zoneRoute)`.
- Hook disables OrbitControls, captures start (camera.position, target),
  defines end (`buildingPos + [6, 5, 6]`, target `buildingPos + [0, 2, 0]`).
- Tweens both vectors over 600 ms with easeOut (`1 - (1-t)^3`).
- On completion, calls `navigate(zoneRoute)`. WorldMap unmounts; on return,
  the camera resets to its initial Canvas-prop position.
- Guard: a second invocation while a tween is active is a no-op.
- **Reduced-motion**: tween duration 50 ms — visually instant, same code path.

### 8.2 Hover card (`HoverCard.jsx`)
- Subscribes to `hoveredId` from `WorldMap.jsx`.
- Renders a drei `<Html>` block at the building's world position +
  `[3, building.labelHeight - 2, 0]` (offset to the right of the building).
- Card content from `iso-hover-text.js`: title, clauses badge, hint paragraph.
- Visual: 280 px wide, semi-transparent dark card (`background:
  rgba(20,24,32,0.92)`), zone-color top stripe, rounded corners. Builds on
  the existing `.zone-label-container` styles in `WorldMap.css`.
- Fade-in 200 ms, fade-out 150 ms via opacity transition.
- **Reduced-motion**: transition duration 0 — hard switch.
- **Locked zones**: card still appears, but the hint is suffixed with
  *"Complete the previous zone to unlock."*

### 8.3 Rim light on hover
- `BuildingShell` mounts a `pointLight` positioned at `[buildingX, 6, buildingZ - 3]`.
- Color: zone color. Distance: 8. Decay: 2.
- Intensity tween: 0 → 1.5 on hover-in (200 ms), 1.5 → 0 on hover-out (200 ms).
- **Reduced-motion**: 0 ms tween — instant on/off.

### 8.4 Flowing road data dots (`Roads.jsx`)
- Only runs on roads originating from a completed zone (matches existing
  `RoadSegment` `isCompleted` flag).
- Each completed road segment spawns 3 small `sphereGeometry [0.18]` emissive
  dots, zone-coloured.
- Per-frame position: `t = ((clock.elapsedTime * 0.5) + (i * 0.33)) % 1`,
  position = `lerp(roadStart, roadEnd, t)`, height fixed at `y = 0.25`.
- Bloom catches the emissive dots; reads as data flowing along the road.
- **Reduced-motion**: dots freeze at their initial `t = i * 0.33` positions.
  Visible but motionless.

### 8.5 Completed-zone light beam
- `BuildingShell` mounts a `cylinderGeometry [0.6, 0.2, 25]` above the
  building when `completed === true`.
- Material: `meshBasicMaterial` with `transparent: true, opacity: 0.55,
  color: zoneColor`. Emissive via Bloom.
- Subtle pulse — `emissiveIntensity` `0.7 ↔ 1.0` over 3 s.
- **Reduced-motion**: held at 0.85, no pulse.

### 8.6 Lock / unlocked / completed visual hierarchy

| State | Building | Windows | Outgoing roads | Interaction |
|---|---|---|---|---|
| **Locked** | LOCKED material (grey, desat). Static. | All dark. | Static, dim grey. | No hover handler; cursor default. Hover card still shows with "complete previous zone" suffix. Click is a no-op. |
| **Unlocked, not completed** | Full materials, animated highlights (alarm / antenna / cell pulses). | ~30 % lit. | Dashed line, semi-bright. | Hover → rim light + card. Click → camera zoom + route. |
| **Completed** | Full materials, accent emissive boosted 1.5×. | ~30 % lit + light beam from roof. | Solid line + flowing zone-colour dots. | Hover → card with hint. Click → camera zoom + route (zones decide their own replay UI). |

### 8.7 `useReducedMotion`
```js
const reduced = useReducedMotion();
// reduced === true | false, updates live on OS-level changes
```
- Reads `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Adds a `change` listener; updates `useState` on change.
- All animated components consume this hook; see table at end of section 8.

### 8.8 Reduced-motion effect map

| Animated element | reduced-motion behaviour |
|---|---|
| Camera zoom tween | 50 ms duration (effectively instant) |
| Float (hover bob) | disabled — `Float speed={0}` |
| OrbitControls auto-rotate | disabled |
| Flowing road dots | frozen in place |
| Completed light-beam pulse | static intensity |
| MatrixHub cell pulses | static, all at intensity 0.5 |
| ErrorDistrict alarm pulse | static at intensity 0.85 |
| VVTower Oracle antenna spin | stopped |
| ArtefactArchive Dynamic strips | frozen |
| CenterHub ring rotation | stopped |
| HoverCard fade | 0 ms (instant) |
| Rim light fade | 0 ms (instant) |
| Bloom post-processing | stays on (static effect, no animation) |

---

## 9. Performance Budget

| Metric | Target | Measurement |
|---|---|---|
| Target device | Desktop / laptop, mid-range integrated or discrete GPU | n/a |
| FPS | ≥ 30 sustained | Chrome DevTools Performance tab spot-check, full map orbit cycle |
| WorldMap chunk (raw) | ≤ 1.5 MB | `dist/assets/index-*.js` size after `npm run build` |
| WorldMap chunk (gzip) | ≤ 450 kB | reported by Vite build output |
| Initial route bundle (zone pages) | no three/drei chunk | Network tab on first load of e.g. `/zone/error-district` |
| Lighthouse Performance score | not measured this phase | n/a |

**Code splitting strategy:**
- WorldMap will be lazy-loaded via `React.lazy` in `App.jsx` so the route's
  Three.js dependencies are not in the initial bundle. Zones (which contain
  no 3D) load instantly.
- Suspense fallback on the WorldMap route: a simple "Loading map…" screen with
  the existing top bar visible.

**If we exceed budget:**
- First fallback: drop `@react-three/postprocessing` (saves ~80 kB).
- Second fallback: simplify Bloom (or remove), keep SMAA via `gl={{ antialias: true }}`.
- Third fallback: reduce CenterHub ring count or drop the Dynamic-strip
  scroll animation.

---

## 10. Definition of Done

The phase is complete and demoable when **all** of the following hold:

**Visual / pedagogical:**
- ✅ All five buildings rebuilt to the themes in §5 (ErrorDistrict broken
  office + 3 fallen boxes; VVTower symmetric two wings + bridge + Oracle
  antenna; MatrixHub 4×4 grid facade; ArtefactArchive twin static/dynamic
  wings + verbal_agreement placard; FinalHQ dome + 5 zone-coloured columns +
  Oracle beam).
- ✅ CenterHub 5-ring progress sculpture present at world origin and reacts
  to `state.completedZones`.
- ✅ Sunset atmosphere: Sky tuned, sun light warm and low, fog at 30/110.
- ✅ Lit windows on unlocked buildings; no lit windows on locked.

**Interaction:**
- ✅ Hover shows rim light + ISO concept hint card within ~250 ms.
- ✅ Click on unlocked building runs ~600 ms camera zoom, then routes to
  zone page.
- ✅ Completed buildings have a continuous zone-color light beam.
- ✅ Roads from completed zones show flowing zone-color dots.
- ✅ Under `prefers-reduced-motion`, every animated element listed in §8.8
  matches its reduced behaviour.

**Technical:**
- ✅ `npm run build` succeeds with zero errors. ESLint warnings unchanged
  (the existing `currentTags` warning in `ArtefactArchive.jsx` is not in
  this phase's scope).
- ✅ WorldMap chunk ≤ 1.5 MB raw. Reported in build output.
- ✅ Zone routes do not include three/drei in their initial chunk
  (verified by Network tab on a zone-only navigation).
- ✅ Spot-check ≥ 30 FPS on the developer's mid-range laptop during a full
  orbit + hover + click cycle.
- ✅ `WorldMap.jsx` reduced from 762 lines to ≤ 200 lines. New `world/`
  module structure matches §4.1.

**Documentation:**
- ✅ This spec is committed to `docs/superpowers/specs/`.
- ✅ The corresponding implementation plan is committed to
  `docs/superpowers/plans/2026-05-04-worldmap-3d-enhancement.md` (next step,
  via writing-plans skill).

---

## 11. Open Questions

These are flagged for the user to resolve before or during implementation.
None block plan-writing.

- **FQ-1: Hover card hint language — English (default) or Turkish?**
  Affects `world/data/iso-hover-text.js`. Default = English to match
  CLAUDE.md §14. One-file change if user picks Turkish.

- **FQ-2: Add `@react-three/postprocessing` (~80 kB gzip)?** Default = yes,
  enables Bloom + Vignette + SMAA. If post-build the chunk exceeds 1.5 MB
  raw, fallback strategies are in §9.

- **FQ-3: Replay UX for completed zones.** When a user clicks a completed
  building, the WorldMap zooms + routes — same behaviour as an unlocked
  zone. The zone page itself decides what to show on replay. **This spec
  does not modify zone pages.** Out of scope here, flagged for a future
  spec if desired.

- **FQ-4: Hover-card content tone.** The placeholder hints in §4.4 are
  short and didactic. The user may want to tighten / rewrite them during
  the implementation phase. Not a blocker.

---

## 12. Risks

- **Bundle bloat from `@react-three/postprocessing`.** Mitigation: §9
  fallback chain.
- **Procedural building complexity drift.** Each building can grow into
  hundreds of geometry primitives. Mitigation: hard cap of ~200 lines per
  building file. If a file exceeds, refactor sub-parts into the
  `_shared/` folder.
- **Hover-card position lag at high orbit speeds.** drei `<Html>` reprojects
  every frame; could feel slightly out of sync. Mitigation: `<Html>` already
  has `distanceFactor` and `transform` modes — pick whichever feels stable.
- **Reduced-motion regressions.** Easy to forget the `useReducedMotion` hook
  in a new animation. Mitigation: include a checklist item per building file
  in the implementation plan.
- **Camera tween edge cases.** Double-clicks, route changes during tween,
  unmounting `<Canvas>` mid-tween. Mitigation: `useRef` guard + `useEffect`
  cleanup that nulls the animRef on unmount.

---

## 13. CLAUDE.md alignment

This spec is consistent with CLAUDE.md as of 2026-05-04:
- §2 (locked stack): all dependencies used here are listed (`three`,
  `@react-three/fiber`, `@react-three/drei`). One new sibling dependency
  proposed: `@react-three/postprocessing` — adding it requires team approval
  per CLAUDE.md §0. Flagged as FQ-2.
- §3 (architecture): "components in `src/components/`" generalises to "all
  3D code in `src/world/`". This is an extension, not a contradiction —
  zones still live in `src/components/zoneN/`.
- §11 (CSS tokens): the WorldMap continues to read zone colours from
  `tokens.css` via `zone-themes.js`. No new hardcoded colours in JSX or
  CSS.
- §13 (pedagogical principles): each building visually expresses an ISO
  concept; nothing dilutes the standard's vocabulary.
- §14 (out of scope): all clauses honoured — no zones get 3D, no GLTF, no
  mobile, no persistence.
- §15 (never do): no `useGLTF`, no `<Canvas>` outside WorldMap, no inline
  ISO definitions, no hardcoded colours.

---

*Spec version 1 — 2026-05-04. Awaiting user review before plan phase.*
