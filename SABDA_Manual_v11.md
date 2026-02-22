# SABDA Immersive Visual Production Manual v11

## Purpose

Step-by-step process for creating immersive 3D visual scenes for the SABDA wellness studio. Any agent should be able to follow this manual to produce either a **single self-contained HTML file** for real-time browser rendering, or a **pre-rendered video pipeline** for reliable Watchout projection playback â€” without any server, build tools, or dependencies beyond the file itself.

This manual is parameterised. The architecture is universal. Only the **scene content** changes (butterflies, forest, underwater, rain, etc.). The pipeline, HTML structure, animation system, and delivery format are always identical.

This is v11. It incorporates all v8/v9/v10 content plus: **render-only HTML architecture** (separate from interactive viewer, 10-25× faster), **loop check renderer** (render_loopcheck.js for verifying loop continuity), **bird homing fix** (gentle radial nudge replaces aggressive heading-steering that caused circular orbits), **preview mode limitations** (dt/time mismatch documentation), and **commit discipline rule** (always commit working files immediately).

Previous v10 additions (all retained): Video loop continuity fixes (6 modifications ensuring seamless frame 0 to frame 1799 transitions for looped Watchout playback), and the GitHub-based file transfer workflow that eliminates context window exhaustion from large HTML uploads.

Previous v9 additions (all retained): Puppeteer video rendering pipeline, Watchout integration, MSAA/readPixels discovery, CRF 14 quality standard, preview/full mode.

Previous v8 additions (all retained): 8K sky, PNG format, HalfFloat cubemap, shader dithering, adaptive shadow lift, visual inspection protocol.

---

## ðŸš¨ ABSOLUTE RULE #1: Visual Pre-Delivery Inspection (MANDATORY)

**NEVER deliver a build without first rendering it and inspecting the output with your own eyes.**

This is not optional. This is not "when possible." This is MANDATORY for every single delivery. It will save hours of back-and-forth and broken builds.

### What This Means In Practice

Before presenting ANY HTML file to the user:

1. **Extract the visible wall band** from the sky texture (rows 30.8%-65.6% of equirectangular = the Â±34.5Â° to -28Â° elevation band the walls display)
2. **Apply the worst-case warmth tint** (coolest phase values) to simulate the darkest the scene will ever get
3. **Render a wall preview image** at wall proportions (5.76:1 aspect ratio)
4. **View the preview image** using the `view` tool â€” actually look at it
5. **Check for**: flat/featureless zones, dark muddy patches, visible banding, unnatural colour, any area that looks different from the rest
6. **Verify numerically**: 0% pixels below 50 brightness across all 8 azimuth columns at coolest tint
7. **Only then** assemble and deliver

### Why This Rule Exists

In the Belfast sky session, 6 consecutive builds were delivered without visual inspection. Each time the user reported the same pixelation issue. Each time the fix addressed numbers but not what the eye actually sees. When the agent finally used `view` to inspect the wall preview, the problem was immediately visible â€” a flat, featureless water patch that no amount of brightness lifting could fix. The texture noise solution was found in one iteration after visual inspection vs 6 failed iterations without it.

**Time saved by looking first: hours. Cost of not looking: trust.**

### The Visual Inspection Checklist

```
â–¡ Wall preview rendered at coolest tint phase
â–¡ Wall preview viewed with own eyes (view tool)
â–¡ No flat/featureless zones visible
â–¡ No dark muddy patches
â–¡ No visible colour banding
â–¡ Brightness verified: 0% pixels below 50 at coolest tint
â–¡ Local texture detail verified: minimum 0.5 std in 16Ã—16 blocks per column
â–¡ Preview looks consistent across full 360Â° panorama
```

If ANY check fails, DO NOT deliver. Fix first, re-inspect, then deliver.

---

## âš ï¸ GOLDEN RULE: The User's Perspective Is Everything

**Before committing any visual change, mentally stand inside the room and look around.**

30 people will be in this room. Some are 1 metre from the walls. Some are at the far end, 7.5 metres from the nearest wall. The visuals must look immersive, clean, and consistent from every position.

This means:
- No pixelation on close walls â€” resolution must survive close viewing
- No inconsistent lighting â€” if walls are dim, the floor must be dim. If walls are bright, the floor reflects that brightness
- No unnatural artifacts â€” shooting stars must behave like real meteors, not game effects
- No hotspots or bright patches that don't match what's on the walls
- Fog must be tuned so the far end of the room doesn't look washed out
- Every element must pass the "would this break the immersion?" test
- **No flat featureless zones** â€” every part of the visible wall band must have texture detail

**The standard is 10/10 or nothing.**

---

## âš ï¸ MANDATORY: Pre-Assembly Verification Protocol

**ALWAYS double-check the template before assembling.** Assembly takes time and requires the user to download and re-test. Catching errors before assembly saves entire iteration cycles.

### Before Every Assembly, Run This Check:

```bash
echo "=== VERIFY BEFORE ASSEMBLY ==="
echo "--- Resolution Pipeline ---"
grep "CUBE_SIZE\|STRIP_W\|setPixelRatio\|samples:\|HalfFloatType" template.html
echo "--- Sky Format ---"
grep "b64T.*skydata" template.html
echo "--- Warmth Tint ---"
grep "skyR =\|skyG =\|skyB =" template.html
echo "--- Dithering ---"
grep "dither" template.html
echo "--- Floor ---"
grep "0x787878\|floorMat\|roomAmbient\|roomHemi" template.html
echo "--- Shooting Stars ---"
grep "ssHead\|ssTail\|ss.timer\|ss.maxLife" template.html
echo "--- Fog ---"
grep "FogExp2" template.html
echo "--- Cycles ---"
grep "BREATH\|CCYCLE\|SKY_ROTATION_PERIOD\|skyPhase.*1800" template.html
echo "--- Planets ---"
grep "plAngle\|planetGroup.scale\|saturnMainGroup.scale" template.html
echo "--- Bloom ---"
grep "bloomPass\|UnrealBloomPass" template.html
echo "--- No Broken Shaders ---"
grep "attribute float uv" template.html && echo "âš ï¸ BROKEN SHADER FOUND" || echo "âœ“ Clean"
echo "--- No Floor PointLights ---"
grep "addGlow\|floorGlowY\|uplightColor" template.html && echo "âš ï¸ FLOOR POINTLIGHTS FOUND" || echo "âœ“ Clean"
```

### What to Verify:

1. **Visual inspection done** â€” wall preview rendered and viewed (see Absolute Rule #1)
2. **Resolution pipeline** â€” CubeCamera â‰¤ 2Ã— sky texture px/degree
3. **HalfFloat cubemap** â€” render target must use `THREE.HalfFloatType` to prevent banding
4. **Dithering shader** â€” equirect fragment shader must include dither function
5. **Sky format** â€” PNG for lossless quality (NOT JPEG)
6. **Warmth tint safe range** â€” minimum multipliers â‰¥ 0.85 R, â‰¥ 0.82 G
7. **Floor colour** â€” `#787878` medium grey, MeshStandardMaterial, NO PointLight hotspots
8. **Floor lighting consistency** â€” hemisphere + ambient only, both track wall brightness dynamically
9. **Shooting stars** â€” SphereGeometry head + CylinderGeometry tail (NOT custom shaders)
10. **Fog** â€” Content 0.003, Room 0.025 (tuned for 15m room depth)
11. **Cycles** â€” 14s breath, 90s colour, 1800s (30 min) sky rotation AND warmth
12. **No broken shaders** â€” `attribute float uv` in a ShaderMaterial will crash WebGL
13. **No floor PointLights** â€” these create inconsistent hotspots. Removed in v7.

---

## 1. What is SABDA

SABDA is a premium immersive wellness studio. Clients stand or sit inside a room where every wall is a continuous projection surface. The visuals wrap 360Â° around them. The goal is deep relaxation â€” not stimulation. Everything must feel natural, slow, meditative, alive.

### Physical Room Dimensions (CONFIRMED)

| Parameter | Value |
|-----------|-------|
| Length | **15.00 m** |
| Width | **5.63 m** |
| Height | **3.23 m** |
| Floor area | 84.45 mÂ² |
| Perimeter | 41.26 m |
| Shape | Rectangular (NOT square) |
| Class capacity | **30 people** |
| Closest viewing | **~1 metre from walls** |

âš ï¸ **CRITICAL:** The room is a **rectangle**, not a square. The room is nearly 3Ã— longer than it is wide. The two long walls (15m each) dominate the visual experience, while the two short walls (5.63m each) are narrow.

âš ï¸ **CLOSE VIEWING:** Classes host 30 people. Some will be within 1 metre of the walls. All rendering quality decisions must account for this.

### Wall Labelling System

Each wall has a tiny golden letter label at the top centre for reference:

```
        Wall A (short, 5.63m)
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚                     â”‚
Wall B  â”‚                     â”‚  Wall D
(long,  â”‚                     â”‚  (long,
15m)    â”‚                     â”‚  15m)
        â”‚                     â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        Wall C (short, 5.63m)
```

Wall B = planet side. Wall D = Saturn side. Labels rendered as `rgba(196, 168, 130, 0.35)` â€” barely visible, reference only.

---

## 2. Scene Parameters (What Changes Per Scene)

Every SABDA scene uses the same HTML architecture. Only these elements change:

| Parameter | Example (Butterfly Dusk) |
|-----------|------------------------|
| Sky HDRI | `belfast_sunset_puresky_8k.hdr` â†’ 8192Ã—4096 PNG |
| Animated creature | Butterfly FBX â†’ GLB |
| Creature texture(s) | Orange monarch + teal variant PNG |
| Background creatures | Eagle GLB flocks |
| Celestial body 1 | Fantasy planet GLB |
| Celestial body 2 | Saturn GLB |
| Colour palette | Warm amber / cool purple cycle |
| Shooting stars | Natural meteor streaks, ~1 per minute |

Everything else â€” the room, the rendering pipeline, the animation system, the breathing cycle â€” is identical across all scenes.

---

## 3. The Two Cycles: Sky Warmth + Colour Hue

SABDA classes run 60 minutes. The visual experience must evolve throughout without ever repeating noticeably. Two independent cycles create this:

### Sky Warmth Cycle (30 minutes â†’ 2 per hour)

Controls the overall mood of the sky â€” warm golden dusk â†” cool blue-purple twilight.

```javascript
const SKY_ROTATION_PERIOD = 1800;  // 30 minutes â€” sky rotates AND warms/cools
const skyPhase = (time / 1800) * Math.PI * 2;
const warmth = (Math.sin(skyPhase) + 1) / 2;  // 0 = coolest, 1 = warmest
```

In a 60-minute class, guests experience **2 full warmâ†’coolâ†’warm transitions**. This creates a living, breathing atmosphere without being perceptible moment-to-moment.

The warmth value controls:
- Sky sphere colour tint (warm gold â†” cool blue-purple)
- Sun intensity (dims in cool phase, brightens in warm)
- Star visibility (stars appear during cool phases)
- **Floor lighting intensity** (floor brightness tracks wall brightness)

âš ï¸ **WARMTH TINT SAFE RANGE (v8 CRITICAL):**
```javascript
// âœ“ CORRECT â€” gentle tint that never crushes dark areas
const skyR = 0.85 + warmth * 0.15;   // Range: 0.85â€“1.00
const skyG = 0.82 + warmth * 0.10;   // Range: 0.82â€“0.92
const skyB = 0.88 + (1 - warmth) * 0.12;  // Range: 0.88â€“1.00

// âœ— WRONG â€” old values that created pixelation in dark zones
const skyR = 0.75 + warmth * 0.25;   // Min 0.75 crushes dark pixels below 50
const skyG = 0.70 + warmth * 0.15;   // Min 0.70 is catastrophic for dark gradients
```

The old values (0.75/0.70 minimum) caused dark sky areas to drop below brightness 50 after tinting, which produces visible banding and posterization â€” especially on areas with low source texture detail. The new values (0.85/0.82 minimum) provide the same colour shift perception while keeping all pixel values in a safe range.

### Colour Hue Cycle (90 seconds)

Controls the accent colour that shifts through the lighting and atmospherics.

```javascript
const CCYCLE = 90;  // Full hue rotation every 90 seconds
const hue = (time / CCYCLE) % 1;
colT.setHSL(hue, 0.45, 0.45);
colC.lerp(colT, 0.004);  // Smooth interpolation
```

### Breathing Cycle (14 seconds)

Subtle luminance pulse that makes the scene feel alive:

```javascript
const BREATH = 14;
const br = t => (Math.sin(t * Math.PI * 2 / BREATH - Math.PI / 2) + 1) / 2;
```

### Why These Numbers

| Cycle | Period | Per 60-min class | Purpose |
|-------|--------|------------------|---------|
| Breathing | 14s | ~257 cycles | Subliminal "aliveness" |
| Colour hue | 90s | ~40 rotations | Colour richness |
| Sky warmth | 1800s (30 min) | 2 full cycles | Mood evolution |
| Sky rotation | 1800s (30 min) | 2 full rotations | Cloud/star drift |

---

## 4. Resolution Pipeline â€” Preventing Pixelation

### The Problem

The content scene renders through a chain: Sky texture â†’ Sky sphere â†’ CubeCamera â†’ Equirect shader â†’ Strip texture â†’ Wall planes. Each step can introduce pixelation if the resolution doesn't match.

### The Rule: CubeCamera Resolution Must Not Exceed Sky Texture Resolution

For an 8K sky (8192Ã—4096 equirectangular) = **~22 pixels per degree**.

| CubeCamera size | Pixels per degree | vs 8K Sky | Result |
|----------------|-------------------|-----------|--------|
| 4096 | 45.5 | 2Ã— oversample | **Correct** â€” matches sky density with filtering |
| 2048 | 22.7 | 1:1 match | Acceptable fallback |
| 1024 | 11.4 | 0.5Ã— undersample | Mobile only |

âš ï¸ **CRITICAL LESSON (v7/v8):** CubeCamera resolution must be calibrated to the sky texture. For a 4K sky, use 2048 CubeCamera. For an 8K sky, use 4096 CubeCamera. Going above 2Ã— source px/degree makes individual pixels visible instead of smooth.

### Current Settings (v8 â€” 8K Sky)

```javascript
const CUBE_SIZE = isMobile ? 1024 : 4096;      // Matches 8K sky texture density
const STRIP_W_VAL = isMobile ? 4096 : 12288;   // Strip for wall texture
const STRIP_H = Math.round(STRIP_W / 5.76);    // Aspect ratio from room perimeter
const MSAA_SAMPLES = isMobile ? 4 : 8;         // Anti-aliasing on strip
```

### If You Change the Sky Texture Resolution

| Sky texture | CubeCamera | Strip width |
|-------------|------------|-------------|
| 4096Ã—2048 | 2048 | 8192 |
| 8192Ã—4096 | 4096 | 12288 |

Always match: `CubeCamera px/degree â‰¤ 2Ã— Sky texture px/degree`

---

## 5. Sky Texture Processing â€” The Full Pipeline (v8)

### Source Format

Sky HDRIs are sourced from Poly Haven or similar at 8K resolution (8192Ã—4096). Pure sky versions (no ground) are preferred.

### Tonemapping from HDR

```python
# ACES filmic tonemapping
def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)

exposed = hdr_image * 0.15  # Exposure multiplier
mapped = aces(exposed)
ldr = (mapped * 255).astype(np.uint8)
```

### Adaptive Shadow Lift (v8 â€” CRITICAL)

Many HDRIs have dark, featureless areas below the horizon (calm water, flat ground). On a wall viewed from 1-3 metres, these become visible flat slabs. Apply a brightness-adaptive shadow lift:

```python
# Per-pixel adaptive lift â€” stronger in darker areas, barely touches brights
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(float) / 255.0
bright_map = cv2.GaussianBlur(gray, (201, 201), 50)
lift_map = np.clip(0.28 - bright_map * 0.30, 0.04, 0.28)

for c in range(3):
    channel = img[:,:,c]
    img[:,:,c] = channel + lift_map * (1.0 - channel)**2
```

This lifts shadows proportionally â€” dark areas (brightness ~0.2) get strong lift (~0.22), while bright areas (brightness ~0.8) get minimal lift (~0.04). The quadratic curve `(1-x)Â²` ensures highlights are untouched.

### Procedural Texture Noise for Flat Zones (v8 â€” CRITICAL)

After shadow lift, check local texture detail. Areas with local std < 2.0 in 16Ã—16 blocks are essentially flat colour and will look like slabs on the wall. Add subtle procedural noise:

```python
# Detect flat areas
local_std = compute_local_std(gray, kernel=61)
flat_mask = np.clip((2.0 - local_std) / 1.5, 0, 1)

# Multi-octave noise for natural cloud-like texture
noise = sum(
    cv2.resize(np.random.randn(h//s, w//s), (w, h)) * (s / 256.0)
    for s in [64, 128, 256]
)
noise = noise / noise.std()

# Apply only to flat areas at low amplitude (Â±4 out of 255)
for c in range(3):
    img[:,:,c] += noise * flat_mask * 4.0
```

### Output Format: PNG (NOT JPEG)

âš ï¸ **ALWAYS use PNG for sky textures.** JPEG creates 8Ã—8 block compression artifacts that are especially visible in dark gradient areas. Analysis showed 2Ã— worse gradient discontinuities at JPEG block boundaries in dark zones. PNG is lossless and eliminates this entirely.

```javascript
// âœ“ CORRECT
const skyTex = b64T('skydata', 'image/png');

// âœ— WRONG â€” JPEG block artifacts visible in dark sky gradients
const skyTex = b64T('skydata', 'image/jpeg');
```

File size impact: PNG sky textures are 9-15 MB base64 vs 2-3 MB for JPEG. The quality difference is non-negotiable at SABDA standard.

### Sky Quality Verification Script

Run this before building to verify a sky texture passes quality thresholds:

```python
import cv2, numpy as np

img = cv2.imread('sky_8k.png')
h, w = img.shape[:2]
mid = h // 2

# Simulate coolest warmth tint
tinted = img.astype(float)
tinted[:,:,2] *= 0.85  # R channel (BGR order)
tinted[:,:,1] *= 0.82  # G channel
tinted = np.clip(tinted, 0, 255).astype('uint8')

# Extract visible wall band
vis_top, vis_bot = int(h * 0.308), int(h * 0.656)
wall = tinted[vis_top:vis_bot]
gray = cv2.cvtColor(wall, cv2.COLOR_BGR2GRAY)

# Check per-column (8 azimuth segments)
n, cw = 8, w // 8
for i in range(n):
    col = gray[:, i*cw:(i+1)*cw]
    below_50 = (col < 50).sum() / col.size * 100
    print(f'Col {i}: mean={col.mean():.0f}, min={col.min()}, <50: {below_50:.1f}%')
    assert below_50 == 0, f'FAIL: Column {i} has {below_50:.1f}% pixels below 50'

# Check local detail in below-horizon area
below_hz = cv2.cvtColor(img[mid:vis_bot], cv2.COLOR_BGR2GRAY)
for i in range(n):
    col = below_hz[:, i*cw:(i+1)*cw]
    local_stds = [col[y:y+16, x:x+16].std()
                  for y in range(0, col.shape[0]-16, 16)
                  for x in range(0, col.shape[1]-16, 16)]
    detail = np.mean(local_stds)
    print(f'Col {i} detail: {detail:.1f}')
    assert detail >= 0.5, f'FAIL: Column {i} detail {detail:.1f} < 0.5 â€” needs texture noise'

print('ALL CHECKS PASSED')
```

---

## 6. Render Pipeline Anti-Banding System (v8)

### The Problem: 8-Bit Colour Banding

When the warmth tint multiplies dark pixel values (e.g., 70 Ã— 0.82 = 57.4), adjacent source values map to the same output value. In flat gradient areas, this creates visible bands â€” entire rows of identical brightness with sudden jumps. On a 3-metre wall viewed from 2 metres, these bands are visible.

### Solution 1: HalfFloat Cubemap Render Target

The CubeCamera render target must use 16-bit floating point instead of the default 8-bit. This preserves full precision during the tint multiply, preventing banding at the intermediate step.

```javascript
// âœ“ CORRECT â€” 16-bit precision prevents banding
const cubeRT = new THREE.WebGLCubeRenderTarget(CUBE_SIZE, {
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
  type: THREE.HalfFloatType,
});

// âœ— WRONG â€” default 8-bit causes banding in dark gradients after tint
const cubeRT = new THREE.WebGLCubeRenderTarget(CUBE_SIZE, {
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
});
```

### Solution 2: Dithering in the Equirect Shader

Add Â±0.5 LSB random noise in the equirectangular fragment shader. This breaks up any remaining 8-bit banding on the final output. Standard technique from professional film/TV colour grading.

```glsl
precision highp float;
uniform samplerCube tCube;
uniform float vFovRad;
uniform float elevOffset;
varying vec2 vUv;

// Dithering: breaks up 8-bit colour banding in dark gradients
float dither(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}

void main() {
  float azimuth = vUv.x * 6.283185307;
  float elevation = (vUv.y - 0.5) * vFovRad + elevOffset;
  float ce = cos(elevation);
  vec3 dir = vec3(sin(azimuth) * ce, sin(elevation), -cos(azimuth) * ce);
  vec4 col = textureCube(tCube, dir);
  // Add Â±0.5 LSB dithering noise â€” invisible but eliminates banding
  col.rgb += dither(gl_FragCoord.xy) / 255.0;
  gl_FragColor = col;
}
```

### Why Both Solutions Together

- **HalfFloat cubemap** prevents banding during the intermediate CubeCamera capture step (tint Ã— texture â†’ cubemap)
- **Dithering** prevents banding during the final equirect â†’ strip â†’ wall output step
- Together they eliminate banding at every stage of the pipeline

---

## 7. Floor Lighting â€” The Consistency Rule

### The Rule

**The floor must always be consistent with the walls.** If the walls show a dim cool purple sky, the floor must not have warm bright spots. If the walls show a bright golden sunset, the floor should be softly lit with warm spill.

### What NOT to Do (v6 mistake, fixed in v7)

```javascript
// âœ— WRONG â€” PointLights create hotspots independent of wall content
addGlow(ROOM_W/2 - 0.5, 0.4, z, 0.5);  // Bright warm spot near wall
```

PointLights on the floor create visible hotspots that don't correlate with what's showing on the walls. When the sky is cool purple, these warm spots look completely wrong.

### What to Do (v7)

```javascript
// âœ“ CORRECT â€” hemisphere + ambient only, both track wall brightness
const roomAmbient = new THREE.AmbientLight(0xaaa0a0, 0.3);
const roomHemi = new THREE.HemisphereLight(0xc09070, 0x080810, 0.5);

// In animation loop:
const wallBrightness = (0.3 + warmth * 0.7) * glowBreath;
roomHemi.color.setRGB(0.65 * tR * glowBreath, 0.50 * tG * glowBreath, 0.40 * tB * glowBreath);
roomHemi.intensity = 0.45 * wallBrightness;
roomAmbient.intensity = 0.15 + wallBrightness * 0.2;
```

### Floor Material

```javascript
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x787878,          // Medium grey â€” matches real SABDA vinyl
  map: vinylTex,            // Subtle noise texture for realism
  roughness: 0.75,          // Matte vinyl with hint of sheen
  metalness: 0.05,
  envMap: cubeRT.texture,   // Ghost of sky reflection
  envMapIntensity: 0.08,    // Barely there
});
```

---

## 8. Shooting Star System

### Natural Behaviour Requirements

Shooting stars must look like real meteors â€” nothing unnatural. Key properties:

1. **Shallow descent angle** â€” 8-22% below horizontal (not steep dives)
2. **Brief flash** â€” 0.7-1.1 seconds visible
3. **Fade curve** â€” instant appearance, smooth exponential fade-out
4. **Random direction** â€” can appear anywhere in the upper sky, travel left or right
5. **Infrequent** â€” approximately 1 per minute (50-75 second random interval)
6. **First appearance** â€” 45-75 seconds into the scene (not immediately)

### Implementation: Sphere + Cylinder (NOT Custom Shaders)

```javascript
// Head: bright glowing sphere
const ssHeadGeo = new THREE.SphereGeometry(1.5, 8, 8);
const ssHeadMat = new THREE.MeshBasicMaterial({ 
  color: 0xfff8e0, fog: false, toneMapped: false 
});

// Tail: tapered cone pointing backwards
const ssTailGeo = new THREE.CylinderGeometry(0.0, 1.2, 1.0, 8, 1);
const ssTailMat = new THREE.MeshBasicMaterial({ 
  color: 0xffe0a0, fog: false, transparent: true, opacity: 0.7, toneMapped: false
});
```

### Animation Parameters

```javascript
timer: 45 + Math.random() * 30,           // First one: 45-75s
ss.timer = 50 + Math.random() * 25;       // Subsequent: 50-75s (~1/min)
const sR = 340;                             // Distance (inside sky sphere at 400)
const sElev = (25 + Math.random() * 35) * Math.PI / 180;  // 25-60Â° above horizon
const speed = 180 + Math.random() * 100;    // 180-280 m/s
const downFrac = 0.08 + Math.random() * 0.12;  // 8-20% downward
ss.maxLife = 0.7 + Math.random() * 0.4;    // 0.7-1.1 seconds
const opacity = progress < 0.06 ? progress / 0.06 : Math.pow(Math.max(0, 1 - progress), 1.6);
```

---

## 9. Room Fog â€” Tuned for 15m Depth

```javascript
contentScene.fog = new THREE.FogExp2(0x9a7a90, 0.003);  // Atmospheric haze
roomScene.fog = new THREE.FogExp2(0x0a0808, 0.025);      // Subtle depth
```

| Distance | Room fog (0.025) | What's there |
|----------|-----------------|--------------|
| 2.8m | 7% | Short wall from centre |
| 7.5m | 18% | Long wall from centre |
| 15m | 33% | Far wall from near wall |

---

## 10. The 360Â° Equirectangular Rendering System

### Pipeline Overview

Content scene â†’ CubeCamera (6 faces) â†’ Equirect shader (with dithering) â†’ Strip texture â†’ 4 wall planes

### Three Render Passes, Different Tonemapping Each

```javascript
// Step 1: Content â†’ cube faces (WITH tonemapping)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
cubeCamera.update(renderer, contentScene);

// Step 2: Cube â†’ equirect strip (NO tonemapping)
renderer.toneMapping = THREE.NoToneMapping;
renderer.setRenderTarget(stripRT);
renderer.render(equirectScene, equirectCamera);
renderer.setRenderTarget(null);

// Step 3: Room â†’ screen with bloom (NO tonemapping)
renderer.toneMapping = THREE.NoToneMapping;
bloomComposer.render();
```

### Bloom Post-Processing

```javascript
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.15,    // Strength â€” barely perceptible cinematic touch
  0.6,     // Radius â€” soft spread
  0.85     // Threshold â€” only brightest areas (planets, horizon)
);
```

---

## 11. Quality & Design Philosophy

**SABDA is a world-class premium immersive space. The visuals must match.**

### Non-Negotiable Quality Rules

1. **10/10 or nothing** â€” every element must pass the "would this break immersion?" test
2. **Visually inspect before delivering** â€” use `view` tool on wall previews. MANDATORY. (See Absolute Rule #1)
3. **User perspective first** â€” mentally stand inside the room before committing changes
4. **Resolution must match source** â€” CubeCamera â‰¤ 2Ã— sky texture px/degree
5. **Floor matches walls** â€” no inconsistent lighting, ever
6. **Natural phenomena only** â€” shooting stars, birds, butterflies must behave realistically
7. **No visible artifacts** â€” pixelation, banding, hotspots, seams, flat zones, shader errors
8. **Test from multiple positions** â€” near wall, centre, far end
9. **Fog tuned for room depth** â€” 15m is a long room
10. **Maximum quality from source assets** â€” one excellent HDRI beats clever processing tricks
11. **Fix surgically** â€” when something is broken, change ONE thing. Don't redesign.
12. **Numbers lie, eyes don't** â€” a metric can pass while the visual fails. Always look.

### The "Less is More" Principle

From the v3 visual audit: subtle effects compound. When you reduce glow, emissive, fog, bloom, and particles each by a small amount, the combined result is dramatically cleaner. Always start subtle and add, never start heavy and reduce.

---

## 12. Testing Checklist

### Visual Quality

- [ ] **Wall preview visually inspected** (Absolute Rule #1 â€” MANDATORY)
- [ ] Sky not pixelated on any wall (especially close viewing)
- [ ] No flat/featureless zones in any direction (check all 8 azimuth segments)
- [ ] No visible colour banding in dark gradients
- [ ] Floor colour matches real SABDA vinyl (medium grey, not too dark)
- [ ] Floor lighting consistent with walls (dim walls = dim floor, bright walls = bright floor)
- [ ] No warm hotspots on floor when walls show cool sky
- [ ] Shooting stars appear naturally (~1/min after initial 45s delay)
- [ ] Shooting stars have natural trajectory (shallow descent, brief flash, exponential fade)
- [ ] No WebGL errors in console
- [ ] Butterflies don't get uncomfortably close to camera
- [ ] Birds flying at natural speed and banking
- [ ] Fantasy planet visible on Wall B with glow halo
- [ ] Saturn visible on Wall D with textured bands and rings
- [ ] No visible glow halo disc behind planets
- [ ] Breathing rhythm subtle (~14s pulse)
- [ ] Room fog doesn't wash out far walls
- [ ] View from centre of room: immersive and clean
- [ ] View from near wall: no pixelation, correct perspective
- [ ] View from far end: far walls visible, not overly dim

### Technical

- [ ] No shader compile errors (check console)
- [ ] No `attribute float uv` in any ShaderMaterial
- [ ] No floor PointLights (addGlow, floorGlowY, uplightColor)
- [ ] CubeCamera â‰¤ 2Ã— sky texture px/degree
- [ ] HalfFloat cubemap render target
- [ ] Dithering in equirect fragment shader
- [ ] Sky texture format is PNG (not JPEG)
- [ ] Warmth tint minimum â‰¥ 0.85 R, â‰¥ 0.82 G
- [ ] 30+ FPS on modern laptop
- [ ] Wall labels visible (A/B/C/D, subtle gold)
- [ ] 360Â° and non-360Â° brightness match (no double tonemapping)

---

## 13. Common Mistakes & Fixes (v7 + v8 Additions)

| Mistake | Fix |
|---------|-----|
| **Delivering without visual inspection** | **ALWAYS render wall preview and view it before delivering. Absolute Rule #1.** |
| **JPEG sky texture** | **Use PNG. JPEG block artifacts are visible in dark sky gradients at 2Ã— magnification.** |
| **8-bit cubemap render target** | **Use `THREE.HalfFloatType`. Default 8-bit causes banding after warmth tint multiply.** |
| **No dithering in equirect shader** | **Add Â±0.5 LSB dither noise. Eliminates final-stage 8-bit banding.** |
| **Warmth tint too aggressive (R=0.75, G=0.70)** | **Use Râ‰¥0.85, Gâ‰¥0.82 minimum. Old values crush dark areas below brightness 50.** |
| **Flat featureless below-horizon zones** | **Add procedural texture noise to areas with local std < 2.0. Invisible but prevents flat slabs.** |
| **Shadow lift applied uniformly** | **Use per-pixel adaptive lift based on local brightness. Dark areas get more, bright areas barely touched.** |
| **Dual-sphere sky approach for crossfade** | **Use single sphere + shader crossfade. Two 8K textures = 256MB VRAM + lag.** |
| **CubeCamera 2048 with 8K sky** | **Use 4096 for 8K sky. 2048 undersamples, losing detail.** |
| **Trusting brightness numbers alone** | **Numbers can pass while the visual fails. ALWAYS inspect with eyes. A local std of 0.4 "passes" numerically but looks like a flat slab.** |
| **Floor PointLights creating hotspots** | **Remove ALL floor PointLights. Use hemisphere + ambient only, both tracking wallBrightness.** |
| **Custom shader with `attribute float uv`** | **NEVER use `attribute float uv` in ShaderMaterial â€” conflicts with Three.js internals.** |
| **Shooting star using Points geometry** | **Use SphereGeometry head + CylinderGeometry tail. Points are sub-pixel at 300m.** |
| **Floor too dark (#303030)** | **Use #787878. Floor reads darker than expected in dim room lighting.** |
| **Room fog too strong (0.04)** | **Use 0.025 for 15m room. 0.04 creates 45% attenuation at far wall.** |
| **MeshBasicMaterial for floor** | **Use MeshStandardMaterial to receive hemisphere/ambient light properly.** |
| **MSAA on render targets used for gl.readPixels** | **Remove `samples` parameter from WebGLRenderTarget. MSAA render targets return all-black (zeros) when read with gl.readPixels in WebGL. This is a WebGL limitation, not a bug.** |
| **Using canvasHandle.screenshot() for video rendering** | **Use gl.readPixels + OffscreenCanvas JPEG instead. Screenshot approach encodes PNG internally, making it 20× slower (6s/frame vs 0.22s/frame).** |
| **Not testing preview mode before full render** | **ALWAYS run preview first (30× speed, 60s output, ~7 min). A full 30-min render takes 3+ hours — discovering a bug at frame 40,000 wastes an entire afternoon.** |
| **CRF 18 for projected content with subtle gradients** | **Use CRF 14. CRF 18 introduces visible banding in sky gradients and particle trails when projected on 15m walls. 50% larger files, non-negotiable quality.** |
| **JPEG quality <0.95 for frame capture** | **Use JPEG 0.98 for readPixels frame encoding. Lower quality introduces compression artifacts in sky gradients that compound with video codec compression.** |
| **HalfFloatType on wall render targets for video** | **Use UnsignedByteType for render targets that feed gl.readPixels. HalfFloat data needs conversion before readPixels can use it, and the video pipeline already handles 8-bit output.** |
| **Running full render without checking first frame** | **The video pipeline should output a test frame first. If it’s black, MSAA is likely still enabled on the render target.** |

---

## 14. Reference: Current Build Parameters (v8)

### Rendering Pipeline

| Parameter | Desktop | Mobile |
|-----------|---------|--------|
| CubeCamera | 4096 | 1024 |
| CubeCamera format | HalfFloatType | HalfFloatType |
| Strip width | 12288 | 4096 |
| Strip height | ~2134 | ~711 |
| MSAA | 8Ã— | 4Ã— |
| Pixel ratio | native (cap 3Ã—) | native (cap 3Ã—) |
| Equirect shader | With dithering | With dithering |

### Sky Texture

| Property | Value |
|----------|-------|
| Source resolution | 8192Ã—4096 (8K) |
| Format | PNG (lossless) |
| Processing | ACES tonemap (exp 0.15) + adaptive shadow lift + texture noise for flat zones |
| Base64 size | 9â€“15 MB per sky |
| Warmth tint range | R: 0.85â€“1.00, G: 0.82â€“0.92, B: 0.88â€“1.00 |

### Animation Cycles

| Cycle | Period | Per 60-min class |
|-------|--------|------------------|
| Breathing | 14s | ~257 cycles |
| Colour hue | 90s | ~40 rotations |
| Sky warmth | 1800s (30 min) | 2 full cycles |
| Sky rotation | 1800s (30 min) | 2 full rotations |

### Fog

| Scene | Density | At 7.5m | At 15m |
|-------|---------|---------|--------|
| Content | 0.003 | 2.2% | 4.4% |
| Room | 0.025 | 18% | 33% |

### Floor

| Property | Value |
|----------|-------|
| Material | MeshStandardMaterial |
| Base colour | `#787878` (RGB 120) |
| Roughness | 0.75 |
| Metalness | 0.05 |
| EnvMap intensity | 0.08 |
| Lighting | Hemisphere + ambient only (NO PointLights) |

### Shooting Stars

| Property | Value |
|----------|-------|
| Geometry | SphereGeometry(1.5) head + CylinderGeometry(0,1.2,1) tail |
| Material | MeshBasicMaterial, fog:false, toneMapped:false |
| First appearance | 45-75s |
| Interval | 50-75s (~1/min) |
| Duration | 0.7-1.1s |

### Bloom

| Property | Value |
|----------|-------|
| Strength | 0.15 |
| Radius | 0.6 |
| Threshold | 0.85 |

### Video Rendering Pipeline (v9)

| Parameter | Preview Mode | Full Mode |
|-----------|-------------|-----------|
| Speed | 30× real-time | 1× real-time |
| Frames | 1,800 | 54,000 |
| Output duration | 60 seconds | 30 minutes |
| Render time | ~7 minutes | ~3.3 hours |
| Frame rate | 30 FPS | 30 FPS |
| JPEG quality | 0.98 | 0.98 |
| CRF | 14 | 14 |
| Preset (walls) | medium | medium |
| Preset (merge) | slow | slow |
| Codec | H.264 MP4 | H.264 MP4 |
| Frame time | 0.22–0.25s | 0.22–0.25s |

### Watchout Stage (v9)

| Parameter | Value |
|-----------|-------|
| Total stage | 7680×2400 |
| Projectors | 8 (2 rows × 4) |
| Each projector | 1920×1200 |
| Content size | 6928×2400 (2 strips of 6928×1200) |
| Top strip position | X=92, Y=40 |
| Bottom strip position | X=92, Y=1506 |
| Top strip content | Left wall (5008) + Front wall (1920) |
| Bottom strip content | Right wall (5008) + Back wall (1920) |

### File Inventory (v9)

| File | Description | Size |
|------|-------------|------|
| `sabda_v4_template.html` | Room simulator template with all v8 fixes | ~25 KB |
| `belfast_8k_textured.b64` | Belfast Sunset sky (8K, shadow lift + texture noise, PNG) | ~12 MB |
| `evening_road_8k_lifted.b64` | Evening Road sky (8K, shadow lift, PNG) | ~15 MB |
| `v15c_glbdata.b64` | Butterfly GLB | ~2.3 MB |
| `v15c_tex_orange.b64` | Orange wing texture | ~580 KB |
| `v15c_tex_teal.b64` | Teal wing texture | ~530 KB |
| `birds.b64` | Eagle GLB | ~150 KB |
| `planet_hq.b64` | Fantasy planet GLB | ~2.4 MB |
| `saturn_opt.b64` | Saturn GLB (PBR-converted) | ~31.6 MB |

| `render.js` | Puppeteer video rendering script | ~8 KB |
| `sabda_evening_render.html` | Scene HTML with SABDA_RENDER_FRAME exposed | ~48 MB |
| `output/sabda_top.mp4` | Left + Front wall strip (6928×1200, 30 min) | ~2-3 GB |
| `output/sabda_bottom.mp4` | Right + Back wall strip (6928×1200, 30 min) | ~2-3 GB |

**Assembled HTML output:** ~48-52 MB (larger than v7 due to 8K PNG sky)
**Video output:** ~4-6 GB total (two 30-minute strips at CRF 14)

---

## 15. HDRI Selection Criteria (v8)

Not all HDRIs work well for SABDA. The below-horizon content is critical because it occupies the lower 40% of the visible wall band and is viewed from close range.

### Must-Have Properties

| Property | Threshold | Why |
|----------|-----------|-----|
| Resolution | â‰¥ 8192Ã—4096 | Close viewing on 15m walls |
| Below-horizon brightness | Mean â‰¥ 80 per column at coolest tint | Prevents dark banding |
| Below-horizon local detail | â‰¥ 0.5 std in 16Ã—16 blocks | Prevents flat slabs |
| Format | HDR/EXR (true HDR data) | Needed for proper tonemapping |
| Content | Pure sky preferred | Ground content often problematic |

### Red Flags in HDRIs

- **Calm water** â€” creates flat, featureless reflections that look like colour slabs on walls
- **Dark ground at one azimuth** â€” creates a visible dead zone on one wall
- **Very high dynamic range at horizon** â€” ACES tonemapping may crush adjacent areas
- **Strong ground features** â€” buildings, trees, roads look bizarre as immersive projection

### Comparison: Good vs Problematic HDRI

| Property | Evening Road 01 (âœ“ Good) | Belfast Sunset (âš ï¸ Needed fixes) |
|----------|--------------------------|----------------------------------|
| Below-horizon detail | 0.7-1.4 (cloud reflections) | 0.4 (flat water, columns 0-2) |
| Below-horizon brightness | min 67 at cool tint | min 33 before fix |
| Fix required | Mild shadow lift only | Adaptive lift + texture noise |

---

## 16. Dual-Sky Crossfade Architecture (v8)

For scenes that transition between two skies over the warmth cycle:

### âœ— WRONG: Dual Sphere Approach

```javascript
// Two sky spheres with transparency blending
// FAILS â€” 2Ã— 8K textures = 256MB VRAM, lag, double cloud stacking
const skyA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texA, transparent: true }));
const skyB = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texB, transparent: true }));
```

### âœ“ CORRECT: Single Sphere + Shader Crossfade

```javascript
const skySphereMat = new THREE.ShaderMaterial({
  uniforms: {
    texA: { value: skyTexA },
    texB: { value: skyTexB },
    mixVal: { value: 0.0 },
    tintColor: { value: new THREE.Color(1,1,1) }
  },
  fragmentShader: `
    uniform sampler2D texA, texB;
    uniform float mixVal;
    uniform vec3 tintColor;
    varying vec2 vUv;
    void main() {
      vec4 a = texture2D(texA, vUv);
      vec4 b = texture2D(texB, vUv);
      gl_FragColor = vec4(mix(a.rgb, b.rgb, mixVal) * tintColor, 1.0);
    }
  `,
  side: THREE.BackSide
});

// In animation loop:
skySphereMat.uniforms.mixVal.value = 1.0 - warmth;  // warmth=1 â†’ sky A, warmth=0 â†’ sky B
```

This uses a single sphere with a custom shader that mixes two textures on the GPU. Negligible performance cost compared to the dual-sphere approach.

---


## 17. Video Rendering Pipeline for Watchout (v9)

### Why Pre-Rendered Video

Live HTML rendering through Chromium as a Watchout input works for development and testing, but pre-rendered video is the production standard because:

1. **Guaranteed frame consistency** — no dropped frames, no GPU throttling, no browser garbage collection pauses
2. **Watchout native playback** — video files are Watchout’s primary media type, with robust timeline control
3. **Repeatable output** — identical playback every time, unlike live rendering which varies with system load
4. **Offline preparation** — render overnight, load into Watchout the next day, test at leisure

### Architecture Overview

```
Scene HTML → Puppeteer (headless Chrome) → Manual frame control
    → gl.readPixels (4 wall targets) → Vertical flip → OffscreenCanvas JPEG 0.98
    → Base64 → Node.js → Buffer → FFmpeg stdin (4 parallel processes)
    → 4 wall videos → hstack merge → sabda_top.mp4 + sabda_bottom.mp4
```

### HTML Scene Requirements

The HTML file must expose a manual frame control function for Puppeteer to call:

```javascript
// Add to the HTML scene (outside the animation loop)
window.SABDA_RENDER_FRAME = function(time) {
  // Advance all animations to the given time
  updateScene(time);       // Sky rotation, warmth, colour cycle, breathing
  updateCreatures(time);   // Birds, butterflies
  updateCelestials(time);  // Planets, shooting stars
  
  // Render all passes
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  cubeCamera.update(renderer, contentScene);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setRenderTarget(stripRT);
  renderer.render(equirectScene, equirectCamera);
  renderer.setRenderTarget(null);
  bloomComposer.render();
  
  // Render each wall to its own render target
  for (const wall of walls) {
    renderer.setRenderTarget(wall.renderTarget);
    renderer.render(roomScene, wall.camera);
    renderer.setRenderTarget(null);
  }
};
```

### ⚠️ CRITICAL: Wall Render Target Configuration for Video

Wall render targets used for gl.readPixels **MUST NOT** use MSAA. This is the single most important lesson from the video pipeline development:

```javascript
// ✓ CORRECT — No MSAA, UnsignedByte for readPixels compatibility
const wallRT = new THREE.WebGLRenderTarget(width, height, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.UnsignedByteType,  // NOT HalfFloatType
  // NO samples parameter — MSAA breaks readPixels
});

// ✗ WRONG — MSAA render target returns all-black via readPixels
const wallRT = new THREE.WebGLRenderTarget(width, height, {
  samples: 4,  // THIS CAUSES BLACK OUTPUT
  type: THREE.HalfFloatType,  // Incompatible with readPixels for video
});
```

**Why this happens:** In WebGL, MSAA render targets use multisampled storage that cannot be directly read by `gl.readPixels`. The call succeeds (no error) but returns an array of zeros — producing completely black frames. This is a WebGL specification limitation, not a Three.js bug.

**Note:** The content scene’s CubeCamera render target should still use HalfFloatType for banding prevention (see Section 6). Only the wall render targets that feed the video pipeline need UnsignedByteType without MSAA.

### Wall Render Target Dimensions

| Wall | Real size | Render target | Projectors |
|------|-----------|---------------|------------|
| Left (B) | 15.00m | 5008×1200 | 2.6 projectors |
| Right (D) | 15.00m | 5008×1200 | 2.6 projectors |
| Front (A) | 5.63m | 1920×1200 | 1 projector |
| Back (C) | 5.63m | 1920×1200 | 1 projector |
| **Total** | **41.26m** | **6928×1200 per strip** | **8 projectors** |

### render.js — The Rendering Script

Core parameters:

```javascript
const MODE = 'preview';           // 'preview' or 'full'
const FPS = 30;
const DURATION_SEC = 1800;        // 30 minutes (one warmth cycle)
const PREVIEW_SPEED = 30;         // 30× speed for preview mode
const JPEG_QUALITY = 0.98;        // High quality frame capture
const CRF = '14';                 // FFmpeg quality (lower = better)
const PRESET_WALLS = 'medium';    // FFmpeg encoding speed for walls
const PRESET_MERGE = 'slow';      // FFmpeg encoding speed for final merge
const VIEWPORT_W = 6928;          // Total width
const VIEWPORT_H = 2400;          // Total height (2 strips of 1200)
```

### Frame Capture Process (Per Frame)

```javascript
// 1. Advance scene to target time
await page.evaluate((t) => window.SABDA_RENDER_FRAME(t), frameTime);

// 2. Read pixels from each wall render target
const pixelData = await page.evaluate((wallIndex) => {
  const gl = renderer.getContext();
  const rt = walls[wallIndex].renderTarget;
  const w = rt.width, h = rt.height;
  const pixels = new Uint8Array(w * h * 4);
  
  renderer.setRenderTarget(rt);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  renderer.setRenderTarget(null);
  
  // Vertical flip (WebGL reads bottom-up)
  const flipped = new Uint8Array(w * h * 4);
  const rowSize = w * 4;
  for (let y = 0; y < h; y++) {
    flipped.set(
      pixels.subarray((h - 1 - y) * rowSize, (h - y) * rowSize),
      y * rowSize
    );
  }
  
  // Encode as JPEG via OffscreenCanvas
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const imgData = new ImageData(new Uint8ClampedArray(flipped.buffer), w, h);
  ctx.putImageData(imgData, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.98 });
  const reader = new FileReader();
  return new Promise(r => {
    reader.onload = () => r(reader.result.split(',')[1]);  // base64
    reader.readAsDataURL(blob);
  });
}, wallIndex);

// 3. Send to FFmpeg stdin
const buffer = Buffer.from(pixelData, 'base64');
ffmpegProcess.stdin.write(buffer);
```

### FFmpeg Configuration

Each wall gets its own FFmpeg process receiving JPEG frames via stdin:

```bash
ffmpeg -y -f image2pipe -framerate 30 -i pipe:0 \
  -c:v libx264 -crf 14 -preset medium \
  -pix_fmt yuv420p -movflags +faststart \
  wall_left.mp4
```

Final merge into two horizontal strips:

```bash
# Top strip: Left + Front = 6928×1200
ffmpeg -y -i wall_left.mp4 -i wall_front.mp4 \
  -filter_complex "[0:v][1:v]hstack=inputs=2" \
  -c:v libx264 -crf 14 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  sabda_top.mp4

# Bottom strip: Right + Back = 6928×1200
ffmpeg -y -i wall_right.mp4 -i wall_back.mp4 \
  -filter_complex "[0:v][1:v]hstack=inputs=2" \
  -c:v libx264 -crf 14 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  sabda_bottom.mp4
```

### Preview vs Full Mode

| Parameter | Preview | Full |
|-----------|---------|------|
| Speed | 30× real-time | 1× real-time |
| Frames | 1,800 | 54,000 |
| Output duration | 60 seconds | 30 minutes |
| Render time | ~7 minutes | ~3.3 hours |
| Purpose | Validate pipeline, check visuals | Production delivery |

**ALWAYS run preview mode first.** A 7-minute preview catches all pipeline issues, visual bugs, and encoding problems before committing to a 3+ hour full render.

### Quality Settings Rationale

| Setting | Value | Why |
|---------|-------|-----|
| JPEG quality | 0.98 | Frame capture fidelity. Lower values introduce artifacts in sky gradients that compound with video compression |
| CRF | 14 | Video compression quality. CRF 18 produces visible banding in subtle sky gradients when projected on 15m walls. CRF 14 is 50-70% larger but preserves all detail |
| Preset (walls) | medium | Balance of speed and quality for individual wall encoding |
| Preset (merge) | slow | Final output quality — worth the extra time since it only runs once |
| Codec | H.264 MP4 | Universal Watchout compatibility. Switch to HAP Q only if playback issues occur |

### Performance Benchmarks

| Metric | Value |
|--------|-------|
| Frame render time | 0.22–0.25s per frame |
| Bottleneck | Base64 transfer (readPixels → JPEG → base64 → Node.js) |
| Preview render | ~7 minutes for 1,800 frames |
| Full render | ~3.3 hours for 54,000 frames |
| Output file size | ~2–3 GB per 30-minute strip at CRF 14 |

### Video Pipeline File Structure

```
project_folder/
├── render.js                    # Puppeteer rendering script
├── sabda_evening_render.html    # Scene HTML (must be in same directory)
└── output/
    ├── wall_left.mp4            # Individual wall videos (intermediate)
    ├── wall_front.mp4
    ├── wall_right.mp4
    ├── wall_back.mp4
    ├── sabda_top.mp4            # Final: Left + Front strip (6928×1200)
    └── sabda_bottom.mp4         # Final: Right + Back strip (6928×1200)
```

### Running the Pipeline

```bash
# 1. Assemble full HTML (injects base64 assets)
cd ~/Documents/GitHub/sabda
python3 assemble_evening.py

# 2. Live browser preview (check crossfade, loop boundary)
open sabda_evening_render_full.html
# Use time scrub slider at bottom — drag to 22:30 for pure Belfast, 7:30 for pure Evening
# Scrub to 29:52→0:08 to verify bird fade and planet loop

# 3. Preview render (always first — 60s output, ~10 min)
node render.js

# 4. Check output visually
open output/sabda_top.mp4
open output/sabda_bottom.mp4
# Verify: no black frames, correct colours, smooth animation, no artifacts

# 5. Full production render (30min output, ~5 hours)
node render.js full

# 6. Load into Watchout (see Section 18)
```

---


## 17a. Video Loop Continuity Fixes (v10)

### The Problem

The 30-minute video (1800 seconds) loops in Watchout for 60-minute classes. Mathematical cycles (sky rotation, warmth, colour hue) align perfectly at t=1800. But **stateful animated elements** accumulate drift that creates a visible jump at the loop point:

| Element | Why It Breaks | Severity |
|---------|--------------|----------|
| Bird positions | Continuous heading drift via `heading += turnRate * dt` | High - visible position jump |
| Dust particles | Random drift + respawn, accumulates state | Medium - numerous but tiny |
| Planet rotations | `rotation.y += dt * rate` never completes full cycles | Medium - visible orientation jump |
| Shooting stars | Random timer, may be mid-streak at t=1799 | High - bright streak appears/vanishes |
| Colour lerp (colC) | `colC.lerp(colT, 0.004)` accumulates state | Low - subtle colour shift |

### The 6 Fixes (All Applied to sabda_evening_render.html)

#### Fix 1: Planet Rotations — Time-Absolute, Full Revolutions

Replace incremental rotation with time-absolute rotation that completes exact full cycles:

```javascript
// BEFORE (incremental - accumulates, never aligns)
planetGroup.rotation.y += dt * 0.006;
saturnGroup.rotation.y += dt * 0.003;
saturnMainGroup.rotation.y += dt * 0.0015;

// AFTER (time-absolute - exact full revolutions per 1800s)
planetGroup.rotation.y = (time / 1800) * Math.PI * 2 * 2;      // 2 full rotations
saturnGroup.rotation.y = (time / 1800) * Math.PI * 2 * 1;      // 1 full rotation
saturnMainGroup.rotation.y = (time / 1800) * Math.PI * 2 * 1;  // 1 full rotation
```

#### Fix 2: Shooting Star Suppression Near Loop Boundary

Suppress new shooting stars in the last 15 seconds and first 2 seconds of each 1800s cycle:

```javascript
const loopT = time % 1800;
if (ss.timer <= 0 && loopT > 2 && loopT < 1785) {
    // spawn new shooting star
}
```

This prevents a bright streak being visible at the loop cut point.

#### Fix 3: Bird Homing (Last 30s + First 30s)

Birds gently steer toward their spawn positions near loop boundaries:

```javascript
const birdLoopT = time % 1800;
const birdResetBlend = birdLoopT < 30 ? 1 - birdLoopT / 30 
                     : birdLoopT > 1770 ? (birdLoopT - 1770) / 30 
                     : 0;

// During homing window, blend toward initial orbit angle
if (birdResetBlend > 0) {
    const homeAngle = flock._initAngle + (time / 1800) * Math.PI * 2;
    const angleDiff = homeAngle - currentAngle;
    heading += angleDiff * birdResetBlend * 0.05;  // 5% per frame, gentle
}
```

Requires storing initial angle at spawn: `_initAngle: fc.angle` in the flock object.

#### Fix 4: Dust Particle Homing (Last 20s + First 20s)

Dust particles pull toward deterministic positions seeded by their index:

```javascript
const dustLoopT = time % 1800;
const dustResetBlend = dustLoopT < 20 ? 1 - dustLoopT / 20 
                     : dustLoopT > 1780 ? (dustLoopT - 1780) / 20 
                     : 0;

if (dustResetBlend > 0) {
    // Pull toward seeded initial position
    const homeX = (seededRandom(i * 3) - 0.5) * spread;
    pos.x += (homeX - pos.x) * dustResetBlend * 0.03;  // 3% per frame
}
```

#### Fix 5: Colour Lerp Reset (Last 5s)

Reset the accumulated colC lerp toward its initial value:

```javascript
const colLoopT = time % 1800;
if (colLoopT > 1795) {
    const resetFactor = (colLoopT - 1795) / 5;
    colC.lerp(new THREE.Color(0.7, 0.5, 0.4), resetFactor * 0.02);
}
```

#### Fix 6: Store Bird Initial Angles

Each bird flock must store its spawn angle for the homing calculation:

```javascript
birdFlocks.push({ ctr, mixer, action, heading, _initAngle: fc.angle, ... });
```

### What Naturally Aligns (No Fix Needed)

| Cycle | Period | Cycles in 1800s | Remainder |
|-------|--------|----------------|-----------|
| Sky rotation | 1800s | 1.00 | 0 |
| Sky warmth | 60s | 30.00 | 0 |
| Colour hue | 90s | 20.00 | 0 |
| Breathing | 14s | 128.57 | 8s offset |

Breathing has a slight misalignment but it's a subliminal luminance pulse of only 6% — invisible at the loop point.

### Testing Loop Continuity

After rendering, verify by:
1. Opening the preview video in VLC
2. Setting loop playback (right-click > Loop)
3. Watching the loop point repeatedly
4. Checking: no bird position jumps, no shooting star flashes, no planet orientation snaps, no dust cloud shifts

---

## 18. Watchout Integration — Video Workflow (v9)

### Stage Layout

The Watchout stage uses 8 projectors arranged in 2 rows of 4:

```
Watchout Stage: 7680×2400
┌────────────────────────────────────────┐
│  ┌────────────────────────────────────┐  │
│  │  sabda_top.mp4 (6928×1200)      │  │  Y=40
│  │  Left Wall  |  Front Wall      │  │
│  │  5008×1200  |  1920×1200       │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  sabda_bottom.mp4 (6928×1200)   │  │  Y=1506
│  │  Right Wall |  Back Wall       │  │
│  │  5008×1200  |  1920×1200       │  │
│  └────────────────────────────────────┘  │
└────────────────────────────────────────┘
X=92
```

### Watchout Positioning

| Media | Position | Size |
|-------|----------|------|
| sabda_top.mp4 | X=92, Y=40 | 6928×1200 |
| sabda_bottom.mp4 | X=92, Y=1506 | 6928×1200 |

The X=92 offset centres the 6928-wide content within the 7680-wide stage. The Y positions place each strip at the correct row of projectors with a 266px gap between rows (accounting for projector bezels/overlap).

### Projector Mapping

```
Top row (Y=0–1200):
  Proj 1: 0–1920      Proj 2: 1920–3840    Proj 3: 3840–5760    Proj 4: 5760–7680

Bottom row (Y=1200–2400):
  Proj 5: 0–1920      Proj 6: 1920–3840    Proj 7: 3840–5760    Proj 8: 5760–7680
```

### Looping Strategy

The 30-minute video covers exactly one full sky warmth cycle (1800 seconds). For a 60-minute class, loop the video twice. Because the warmth cycle is sinusoidal, the transition from end to start is seamless — both are at the same warmth phase.

### Watchout Setup Steps

1. Import `sabda_top.mp4` and `sabda_bottom.mp4` as media
2. Add both to the timeline at the same start time
3. Position top strip at X=92, Y=40
4. Position bottom strip at X=92, Y=1506
5. Set both to loop (timeline duration = class duration)
6. Test on all 8 projectors — verify wall boundaries align with physical corners

### Alternative: Live HTML via Chromium

For development and testing, Watchout can use Chromium as a live input source:

```
HTML → Chromium (6928×2400) → Spout feed → Watchout input → NDI → 8 projectors
```

This is useful for real-time parameter tweaking but should NOT be used for production classes due to the risk of frame drops, garbage collection pauses, and GPU throttling.

### Codec Upgrade Path

Start with H.264 MP4 (CRF 14). If Watchout shows any of these symptoms, switch to HAP Q:

- Frame drops during playback
- Visible decompression artifacts at projector boundaries
- Seek/loop transition stuttering

HAP Q uses GPU-accelerated decompression but produces much larger files (~10×). Only switch if H.264 proves insufficient.


---

## 19. Version History

| Version | Key Change |
|---------|-----------|
| v1-v14 | Procedural geometry, perspective camera â€” Failed |
| v15c | Real assets (butterfly FBX, HDRI sky, PBR textures) |
| v16 | Manual morph targets (10Ã— perf improvement) |
| v17 | Velocity-based physics for butterflies |
| v18a-c | Birds, planet, 360Â° equirectangular rendering |
| Sim v1-v3 | 3D room simulator, floor saga, tonemapping-per-pass |
| Sim v3.1 | Quality max (2560/8K/MSAA8Ã—), butterfly clamps, wall labels, glow fix |
| Sim v3.2 (v6) | Saturn integration, SpecGlossâ†’PBR, GPU-adaptive, sky rotation, dual planets |
| Sim v3.3 (v7) | Shooting stars, floor lighting consistency, sky pixelation fix, CubeCamera resolution matching, room fog tuning |
| **Sim v4 (v8)** | **8K sky upgrade, PNG format, HalfFloat cubemap, shader dithering, adaptive shadow lift, texture noise for flat zones, warmth tint safe range, visual pre-delivery inspection protocol, dual-sky crossfade architecture** |
| **v9** | **Video rendering pipeline (Puppeteer + readPixels + FFmpeg), Watchout integration workflow, preview/full mode, MSAA/readPixels incompatibility discovery, CRF 14 quality standard, stage positioning (X=92, Y=40/1506), H.264 → HAP Q codec upgrade path** |
| **v10** | **Video loop continuity fixes (6 modifications for seamless Watchout looping), GitHub-based file transfer workflow (eliminates context window exhaustion from HTML uploads)** |
| **v11** | **Render-only HTML architecture (separate from interactive viewer), loop check renderer (render_loopcheck.js), bird homing fix (radial nudge replaces heading-steering), preview mode dt/time mismatch documentation, commit discipline rule** |
| **v11.1** | **Dual-sky Belfast crossfade (single sphere + shader mix), bird loop fade-out/in (replaces homing), planet animation loop fix (integer cycle alignment), live browser preview with time scrub slider, render.js Puppeteer script (preview + full mode), WebGL Metal/ANGLE backend for Mac** |

---

## 20. Lessons Learned Log (v8 + v9 + v10 + v11 Additions)

Building on all v7 lessons (1-30), v8 adds lessons 31-42, v9 adds lessons 43-49, v10 adds lessons 50-52, v11 adds lessons 53-59.

31. **(v8) ALWAYS visually inspect before delivering.** Six consecutive builds were delivered and rejected because the agent trusted numbers without looking. The moment the agent used `view` to inspect the wall preview, the problem (flat featureless water patch) was immediately visible. Visual inspection would have caught this on build #1 and saved hours. This is now Absolute Rule #1.

32. **(v8) JPEG creates visible block artifacts in dark sky gradients.** Analysis showed 2Ã— worse gradient discontinuities at 8Ã—8 block boundaries in dark zones compared to bright zones. PNG eliminates this entirely. The file size increase (2MB â†’ 12MB) is non-negotiable for SABDA quality.

33. **(v8) 8-bit cubemap render targets cause banding after warmth tint.** When MeshBasicMaterial's color multiplies dark texture values, the result gets quantised to 8-bit in the default cubemap. HalfFloatType preserves 16-bit precision through the pipeline.

34. **(v8) Shader dithering eliminates final-stage banding.** Adding Â±0.5 LSB random noise in the equirect fragment shader is a standard film/TV colour grading technique. Invisible at viewing distance, completely eliminates visible colour steps in smooth gradients.

35. **(v8) Warmth tint minimum values must stay above 0.82.** The old coolest-phase tint (R=0.75, G=0.70) pushed dark sky areas below brightness 50, creating visible posterization. The new range (Râ‰¥0.85, Gâ‰¥0.82) provides perceptible colour shift without darkness-related artifacts.

36. **(v8) Below-horizon HDRI content quality varies wildly.** Some HDRIs have detailed cloud reflections below the horizon (Evening Road: detail 0.7-1.4). Others have flat calm water (Belfast: detail 0.3-0.4). On a wall at 1-3m viewing distance, flat areas become visible colour slabs. Always check per-column local detail before selecting an HDRI.

37. **(v8) Adaptive shadow lift beats uniform lift.** A uniform shadow lift brightens everything equally, washing out naturally bright areas. Per-pixel adaptive lift (stronger where darker, weaker where brighter) raises problematic areas without touching good ones. Use a Gaussian-blurred brightness map to drive the lift amount.

38. **(v8) Procedural texture noise rescues flat zones.** When an HDRI has genuinely featureless content (calm water, flat ground), no amount of brightness adjustment adds visual detail. Multi-octave procedural noise (scales 64/128/256) applied only to flat areas (local std < 2.0) at Â±4/255 amplitude creates invisible but effective texture that prevents the flat-slab appearance.

39. **(v8) Dual-sphere sky crossfade is a performance trap.** Two 8K textures with transparency compositing = 256MB VRAM + visible lag. A single sphere with a custom shader mixing two textures on the GPU achieves the same visual result at negligible performance cost.

40. **(v8) CubeCamera 2048 undersamples an 8K sky.** When the sky was upgraded from 4K to 8K, the CubeCamera should have been upgraded from 2048 to 4096 to match. 2048 on an 8K sky loses detail that's visible on close walls. Always recalibrate the full pipeline when changing sky resolution.

41. **(v8) Numbers lie, eyes don't.** A sky texture can pass all brightness thresholds (mean > 80, min > 50, 0% below threshold) while still looking terrible because of flat featureless content. The Qwantani sky had local detail of 0.3 in some areas â€” worse than Belfast's 0.4 â€” but was rated 8.5/10 because the overall composition worked. Metrics are necessary but not sufficient. Visual inspection is the final gate.

42. **(v8) Fix the root cause, not the symptom.** The Belfast pixelation went through 10 attempted fixes: reverting to single sky, downscaling to 4K, darkening below horizon, brightening below horizon, mirroring hemispheres, aggressive shadow removal. None worked because none addressed the root cause (low-detail water content + aggressive tint darkening + 8-bit banding). Finding the root cause required stepping back and analysing the full pipeline, not iterating on symptoms.

### v9 Additions: Video Rendering Pipeline

43. **(v9) MSAA render targets return black pixels via gl.readPixels.** This is a WebGL specification limitation — multisampled render target storage cannot be directly read. The gl.readPixels call succeeds without error but returns an array of zeros, producing completely black frames. Remove the `samples` parameter from any WebGLRenderTarget that needs pixel readback. This cost multiple debugging hours because the failure is silent — no error, no warning, just black output.

44. **(v9) Screenshot-based rendering (canvasHandle.screenshot()) is 20× slower than direct readPixels.** The Puppeteer screenshot approach captures the visible canvas as PNG, which involves internal PNG encoding overhead. For the SABDA resolution (6928×2400), this means ~6 seconds per frame vs ~0.22 seconds with direct readPixels + OffscreenCanvas JPEG. For a 54,000-frame render, that’s the difference between 3.3 hours and 90 hours.

45. **(v9) Preview mode (30× speed, 60-second output) validates the full pipeline in ~7 minutes.** Always run preview before committing to a 3+ hour full render. Preview mode advances the scene clock at 30× real-time, producing 1,800 frames that compress a 30-minute scene into 60 seconds. This catches: black frames (MSAA issue), incorrect colours, broken animations, encoding errors, and FFmpeg configuration problems — all in 7 minutes instead of 3.3 hours.

46. **(v9) CRF 14 vs CRF 18: 50-70% larger files but preserves subtle sky gradients and particle detail.** CRF 18 is visually acceptable on a laptop screen but introduces visible banding in subtle sky gradients when projected onto 15m walls from 1-3m viewing distance. CRF 14 preserves all gradient detail and is non-negotiable for SABDA production quality. File size increase (~2-3 GB per strip vs ~1.5 GB) is trivial compared to the quality improvement.

47. **(v9) Base64 transfer overhead (readPixels → JPEG → base64 → Node.js) is the pipeline bottleneck at 0.22s/frame.** This is acceptable for SABDA’s resolution and frame count. Optimising further would require native Node.js canvas bindings (node-canvas or sharp) to avoid the base64 serialisation step, but the complexity isn’t justified given the current 3.3-hour full render time.

48. **(v9) The transition from live HTML to pre-rendered video is the correct production path.** Live Chromium → Spout → Watchout works for development but risks frame drops during classes. Pre-rendered video guarantees frame-perfect playback every time, can be prepared overnight, and allows quality validation before the class starts. The rendering pipeline adds ~3.3 hours of preparation time but eliminates all runtime risk.

49. **(v9) Removing MSAA from wall render targets does not visibly degrade quality.** The content scene renders through the CubeCamera (which retains its quality settings) and the equirect shader (which has dithering). The wall render targets are simply capturing the room scene’s final composite, where MSAA’s edge smoothing is imperceptible at projection scale. Removing MSAA for readPixels compatibility has zero visual cost.

### v10 Additions: Loop Continuity & Workflow

50. **(v10) Pre-rendered video loops require ALL animated elements to align at the loop boundary.** Mathematical cycles (sky rotation, warmth, colour hue) naturally align if their periods divide evenly into 1800s. But stateful elements (bird positions via heading drift, dust particles via random respawn, planet rotations via incremental += dt) accumulate drift that creates visible jumps at the loop point. Each stateful element needs either time-absolute positioning (planets) or gentle homing blends near the boundary (birds, dust, colour lerp). Shooting stars need suppression in the last 15s to prevent mid-streak cuts.

51. **(v10) Homing blends must be gentle and bidirectional.** Birds need 30 seconds of 5%-per-frame homing on BOTH sides of the loop boundary (last 30s + first 30s). If homing is only applied before the cut, the first 30s after the cut shows birds suddenly released from homing, creating a different kind of visible discontinuity. The blend factor ramps 0 to 1 approaching the boundary and 1 to 0 leaving it, creating a smooth position match.

52. **(v10) Large HTML files (50MB+) must NEVER be uploaded as chat chunks.** Uploading 51MB of HTML chunks into a Claude chat alongside project files (1300+ lines of manual) immediately exhausts the context window, triggering compaction before the agent can even begin work. The solution is GitHub: store HTML files in a private repo (`github.com/marv0611/sabda`), clone via `git clone` at session start. This puts the file on disk without using any context. github.com is in the allowed network domains. raw.githubusercontent.com is blocked, so always use full `git clone`, not curl.

### v11 Additions: Render Architecture, Loop Check, Bird Fix, Context Optimization

53. **(v11) Render-only HTML is a separate file from the interactive viewer.** The render pipeline uses a dedicated lean HTML (~740 lines) with `antialias: false`, `UnsignedByteType`, no bloom, no orbit controls, no room scene, no strip RT, no MSAA. It exposes `SABDA_RENDER_FRAME` with all scene update logic inline. Never try to bolt render hooks onto the interactive viewer HTML — it's 10-25× slower due to the strip RT, MSAA, bloom, and rAF loop overhead. These are two separate files serving different purposes: the interactive viewer (antialias, bloom, MSAA, orbit controls, room scene) is for browser preview; the render HTML (antialias false, UnsignedByteType, no bloom, no room, direct per-wall equirect) is for Puppeteer rendering. Any attempt to unify them with URL parameters or mode flags creates the exact 25× slowdown that was debugged for 3 hours.

54. **(v11) Always commit working files to the repo immediately.** A 3-hour debugging session happened because the working render HTML was never committed. When a new chat started, only the interactive viewer HTML was in the repo, and the agent had to re-derive the render HTML from scratch — incorrectly. Rule: after any successful render run, immediately `git add -A && git commit -m "working render" && git push`. This is non-negotiable.

55. **(v11) Preview mode cannot validate dt-dependent elements.** Preview (30× speed) advances scene time by `sceneTimePerFrame = 1.0` per frame, but `dt` stays hardcoded at `1/30`. Any physics or animation using `dt` (birds, dust, shooting stars) runs at 1/30th real speed relative to scene time. Preview only validates time-absolute elements: sky rotation, warmth cycle, planet positions, colour cycling. This is not a bug — it's a known limitation of the preview architecture. Do not waste time trying to "fix" bird movement in preview mode.

56. **(v11) Loop check renderer verifies loop continuity.** Use `render_loopcheck.js` to verify loop continuity — it renders the last 15 seconds (t=1785→1800) followed by the first 15 seconds (t=0→15) at real-time speed. The loop point is at the 15-second mark of the output video. No warmup is needed because homing fixes bring birds/dust to spawn positions near boundaries regardless of accumulated state. Always run the loop check after modifying any animation that has state near the boundary.

57. **(v11) Bird homing must nudge position, not steer heading.** The original homing implementation (v10 Fix 3) steered bird heading toward a rotating `homeAngle` at 5% per frame. This overpowered the birds' natural flight drift and caused them to orbit their spawn position in tight circles — especially visible in the loopcheck where 100% of the rendered time is homing zone. The fix replaces heading-steering with gentle radial position nudging: `distErr * birdResetBlend * 0.003` moves the bird toward `homeDist` from centre, and a matching height nudge moves it toward `homeY`. The existing boundary steering (line 691, `dist > homeDist + 5`) handles angular distribution naturally. Birds now fly with natural drift during homing instead of circling.

58. **(v11) Loopcheck only shows homing time — behaviour looks worse than reality.** The loopcheck renders t=1770→1800 + t=0→30, which is 100% inside the homing zone. Any issues with homing (circular orbits, unnatural steering) are maximally visible in loopcheck output. In the actual 30-minute video, homing only runs for 60 seconds out of 1800 (3.3% of total time). If birds look slightly constrained in loopcheck but not visibly circular, that's acceptable.

59. **(v11) Chrome launch args matter for render performance.** The Puppeteer renderer uses `--use-gl=angle` and `--enable-webgl` with `--ignore-gpu-blocklist` for GPU access. The viewport size is set to 6928×2400 (the composite output resolution). These args are critical — without `--use-gl=angle`, Chrome may fall back to software rendering, which is orders of magnitude slower.

60. **(v11) Context window management is a production constraint.** The Claude Project File loads into EVERY message. A bloated project file (4K+ tokens of tables) + pasted conversation transcripts + full manual reads = conversation dies after 3-4 messages. Fix: slim project file (~800 tokens), no transcript pasting (use Claude's past-chat search tools), targeted manual section reads only. See Section 23.

61. **(v11.1) Dual-sky crossfade must use single sphere + ShaderMaterial.** Two sky spheres with transparency = 256MB VRAM + lag. A single sphere with a custom fragment shader mixing two textures via `mix(a.rgb, b.rgb, mixVal)` achieves the same result at negligible cost. The `mixVal` uniform is driven by `1.0 - warmth` so warm peak = sky A (Evening), cool peak = sky B (Belfast). Include dithering in the fragment shader to prevent banding at blend boundaries. The vertex shader must use standard `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` — not the flat quad `vec4(position.xy, 0.0, 1.0)` used by equirect wall shaders.

62. **(v11.1) When replacing MeshBasicMaterial with ShaderMaterial, update all property access.** `MeshBasicMaterial` has `.color` for tinting; `ShaderMaterial` does not. After converting the sky sphere to ShaderMaterial, all `.color.setRGB()` calls in the render loop must change to `.uniforms.tintColor.value.setRGB()`. Missing this causes silent black rendering.

63. **(v11.1) Bird loop homing is a dead end — use fade-out/fade-in instead.** Three iterations of position/heading homing all failed: (a) per-frame 0.08 fractional blend never reaches target, (b) smoothstep time-absolute blend with 30s window freezes birds in place for too long, (c) tight 8s window causes visible retracing. The correct solution: scale birds to 0 over the last 8 seconds, silently reset positions at t=0, scale back up over the first 8 seconds. No homing math, no unnatural movement. Birds fly naturally for 29:44 of the 30-minute loop.

64. **(v11.1) Planet animation loops require integer cycle alignment.** If a GLB model has animations played via `AnimationMixer.setTime()`, the animation time at t=1800 must exactly equal t=0. Calculate: `nCycles = Math.round(totalAnimTime / clipDuration)`, then `loopAnimTime = nCycles * clipDuration`. Use `setTime(((time % 1800) / 1800) * loopAnimTime)`. Also: if `action.timeScale` was set during setup AND `setTime()` is used in the render loop, the speed is double-applied. Set `timeScale = 1` and control speed entirely via `setTime()` math.

65. **(v11.1) The slim HTML file needs a live preview loop for browser testing.** The render HTML only exposes `SABDA_RENDER_FRAME()` for Puppeteer — opening it directly shows a black screen. Add a live preview fallback gated by `if (!window.__SABDA_PUPPETEER__)` that calls `SABDA_RENDER_FRAME(liveT)` + `renderer.render(compScene, compCam)` via `requestAnimationFrame`. Include a time scrub slider (0–1800s) with play/pause, warmth/mix readout, and sky label. This is essential for rapid visual iteration without running the full render pipeline.

66. **(v11.1) Headless Chrome on Mac requires ANGLE/Metal for WebGL.** The default `--use-gl=egl` flag fails on macOS with "WebGL context could not be created". Use: `--use-gl=angle --use-angle=metal --ignore-gpu-blocklist --enable-gpu`. Without these, Chrome falls back to software rendering (no WebGL at all).

67. **(v11.1) Puppeteer page load: use domcontentloaded, not networkidle0.** With base64-embedded assets (two 8K sky textures = 27MB), `networkidle0` hangs waiting for data URL "network" activity to settle. Use `waitUntil: 'domcontentloaded'` for page load, then `waitForFunction(() => window.SABDA_READY === true)` to confirm all assets have loaded via the `checkReady()` counter.

68. **(v11.1) Assembly script must handle cross-scene assets.** When crossfading between two scenes' skies, the assembly script needs to pull assets from a different scene's asset folder. The Evening scene's `assemble_evening.py` injects `skydata_b` from `assets_belfast/skydata.b64`. Each new cross-scene asset needs: (a) a `<script id="...">ASSET_PLACEHOLDER</script>` tag in the slim HTML, (b) a corresponding entry in the assembly script with the correct source path.

---

## 21. Content Calendar

| Time | Scene | Mood |
|------|-------|------|
| 6-9 AM | Sunrise Forest | Warm gold, gentle mist, birdsong |
| 9-12 PM | Garden | Bright daylight, butterflies, flowers |
| 12-3 PM | Underwater | Cool blue, fish, gentle current |
| 3-6 PM | Cherry Blossom | Soft pink, falling petals |
| 6-9 PM | Butterfly Dusk | Warm amber, drifting butterflies |
| 9-11 PM | Night Forest | Cool blue, fireflies, moonlight |

---



## 22. File Transfer: GitHub Workflow (v10)

### The Problem

SABDA HTML files are 48-52 MB (mostly base64-embedded assets). Uploading these as chat chunks exhausts the AI context window before work can begin, causing compaction loops and lost instructions. The manual itself (~1300 lines) plus HTML chunks leaves zero room for actual work.

### The Solution

Scene HTML files are stored in a GitHub repository. The agent clones the repo at the start of each session, getting all files on disk without using any context window space.

### Repository

- **URL:** `https://github.com/marv0611/sabda.git`
- **Type:** Private
- **Contents:** Scene HTML files, render scripts, output videos

### Agent Workflow (Every New Session)

```bash
cd /home/claude
git clone https://github.com/marv0611/sabda.git
ls -lh sabda/
```

This gives the agent the full HTML file on disk in seconds. No chunks, no uploads, no context used.

### User Workflow (Updating Files)

1. Copy updated HTML into the local `sabda` folder (managed by GitHub Desktop)
2. Open GitHub Desktop — it shows the changed files
3. Type a summary (e.g., "added render hooks") → Click **Commit to main**
4. Click **Push origin**

The next Claude session clones and gets the latest version automatically.

### What Goes in the Repo

| File | Purpose |
|------|---------|
| `sabda_evening_render.html` | Current Evening Road scene — render-only HTML (loop-fixed, bird homing fixed) |
| `render.js` | Video rendering script — Puppeteer + FFmpeg (preview/full modes) |
| `render_loopcheck.js` | Loop boundary checker — renders last 15s + first 15s at real-time speed |
| `render_html_chunk_a*` | Split chunks of the render HTML (GitHub-friendly, `cat` to reconstruct) |
| Future scene HTMLs | New scenes as they're built |

### What Does NOT Go in the Repo

- The manual (stays as a Claude project file for always-available reference)
- Output videos (too large for GitHub, stay on local disk)
- Base64 asset files (.b64) — already embedded in the HTML

### Important Notes

- `raw.githubusercontent.com` is blocked — individual file downloads via curl won't work. Always use `git clone`.
- The repo is private — if auth is needed, provide a personal access token in the clone URL: `git clone https://TOKEN@github.com/marv0611/sabda.git`
- GitHub has a 100MB file size limit. SABDA HTMLs at 48-52MB are well within this.

---

## 23. Context Optimization Protocol (v11)

### The Problem

Claude conversations have a finite context window. Every token counts. The SABDA project is large — 75KB manual, 50MB HTML files, detailed parameter tables. If the project file (loaded on EVERY message) is bloated, conversations die after 3-4 exchanges.

### What Eats Context (Ranked)

1. **Pasted conversation transcripts** — BIGGEST killer. A single paste from a prior chat can be 30-40% of the budget. Claude has `conversation_search` and `recent_chats` tools — use those instead.
2. **Project file size** — Loaded into every single message. The old reference file was ~4K tokens of tables already in the manual. Trimmed to ~800 tokens in v2.
3. **Full manual reads** — `view` on the entire 75KB manual dumps it into context. Only read needed sections.
4. **Tool output echoing** — Git clone output, file listings, command results all accumulate. Summarize, don't echo.
5. **Long Claude responses** — Previous responses stay in context. Concise answers = more room for later messages.

### Rules for the User

- **Never paste transcripts from previous conversations.** Say "continue from [topic]" or "pick up where SKY9 left off" — Claude can search past chats.
- **Keep instructions concise.** Claude has memory of the project + can search past chats for details.
- **If hitting conversation limits:** Start a new chat. Don't try to push through — quality degrades as context fills.
- **One task per conversation** when possible. Don't overload a single chat with multiple unrelated changes.

### Rules for Claude

- Clone repo once at session start.
- Do NOT `view` the full manual. Read only the specific sections needed for the current task.
- Check memory first — don't re-read sections you already know.
- Minimize tool output in responses. Summarize results, don't echo raw output.
- Keep responses focused and concise. Avoid repeating what the user already knows.

### Lesson

> **Lesson 60: Context window management is a production constraint.** Treat it like render budget — every token has a cost. Slim project file + targeted manual reads + no transcript pasting = 3-4× longer conversations.

---

## 24. Archived Reference Data (Moved from Project File v1)

The following data was previously in the Claude Project File. It was moved here to save context tokens. All of this information also exists in the relevant manual sections above — this is kept as a consolidated quick-reference.

### Build Parameters Summary (v10)

| Parameter | Desktop | Mobile |
|-----------|---------|--------|
| CubeCamera | 4096 | 1024 |
| CubeCamera format | HalfFloatType | HalfFloatType |
| Strip width | 12288 | 4096 |
| MSAA | 8× | 4× |
| Equirect shader | With dithering | With dithering |

Sky: 8192×4096 PNG. Warmth tint: R 0.85–1.00, G 0.82–0.92, B 0.88–1.00.

Animation cycles: Breathing 14s, Colour hue 90s, Sky warmth 1800s, Sky rotation 1800s.

Floor: MeshStandardMaterial #787878, roughness 0.75, metalness 0.05. Hemisphere + ambient only.

Fog: Content 0.003, Room 0.025. Bloom: 0.15 strength, 0.6 radius, 0.85 threshold.

Shooting stars: First 45-75s, interval 50-75s, duration 0.7-1.1s. Suppressed near loop boundaries.

### Video Pipeline Summary

Output: Two 6928×1200 H.264 MP4s. CRF 14. 30 FPS. Preview mode: 30×, 1800 frames, ~7 min. Full: 1×, 54000 frames, ~3.3 hrs.

Wall targets: Left/Right 5008×1200, Front/Back 1920×1200. NO MSAA, UnsignedByteType.

Watchout: sabda_top.mp4 at X=92 Y=40, sabda_bottom.mp4 at X=92 Y=1506.

### Loop Continuity Fixes (6 total)

1. Planet rotations — time-absolute
2. Shooting star suppression — last 15s / first 2s
3. Bird homing — radial nudge toward spawn (last/first 30s)
4. Bird initial angle — `_initAngle` saved at spawn
5. Dust particle homing — last/first 20s
6. Colour lerp reset — cubic convergence last 10s

### Top 10 Lessons

1. MSAA render targets return black via readPixels
2. PNG for sky, never JPEG
3. HalfFloatType on CubeCamera prevents banding
4. Warmth tint minimum ≥ 0.85 R, ≥ 0.82 G
5. Visually inspect every build
6. CubeCamera must match sky resolution
7. No floor PointLights
8. Preview mode before full render
9. CRF 14 not 18
10. GitHub clone instead of chat uploads

### Two Delivery Pipelines

Pipeline A: Unity → NDI → Watchout (complex scenes, heavy VFX)
Pipeline B: Three.js HTML → Chromium → Watchout (portable single-file, backup content)

### Wall Layout

```
        Wall A (short, 5.63m)
        ┌─────────────────────┐
        │                     │
Wall B  │                     │  Wall D
(long,  │                     │  (long,
15m)    │                     │  15m)
        │                     │
        └─────────────────────┘
        Wall C (short, 5.63m)
```

Wall B = planet side. Wall D = Saturn side.

---

*Manual v11 — February 2026*
*Standard: 10/10 or nothing.*
*Rule #1: Look before you deliver.*
