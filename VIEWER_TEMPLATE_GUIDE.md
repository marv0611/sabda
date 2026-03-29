# SABDA Viewer Template — How to Replicate for Any Visual

## Overview
The murmuration scene has a built-in dual viewer (strip view + 360° room view). This guide explains how to replicate it for any new visual.

## Architecture
One HTML file (`sabda_SCENENAME_slim.html`) serves both:
- **Strip view** (default): two horizontal strips for Watchout (6928×1200 each)
- **360° room view** (press R): SABDA room simulation with orbit controls

## Key Constants (same for ALL visuals)
```javascript
// Room dimensions
const ROOM_L = 15.00;   // long walls (Left B / Right D) in meters
const ROOM_W = 5.63;    // short walls (Front A / Back C) in meters
const PERIM = 2 * ROOM_L + 2 * ROOM_W;  // 41.26m

// Wall pixel widths — UNIFORM px/degree (38.49 px/°)
const W_LEFT   = 5037, H_WALL = 1200;
const W_RIGHT  = 5037;
const W_FRONT  = 1891;
const W_BACK   = 1891;
const OUT_W = W_LEFT + W_FRONT;   // 6928
const OUT_H = H_WALL * 2;         // 2400

// Azimuth fractions (how the 360° wraps around walls)
const uF = ROOM_W / PERIM;                    // 0.1364
const uR = (ROOM_W + ROOM_L) / PERIM;         // 0.5000
const uB = (2 * ROOM_W + ROOM_L) / PERIM;     // 0.6364

// Cubemap: 8K for render, 4K for preview
const CUBE_SIZE = window.__SABDA_PUPPETEER__ ? 8192 : 4096;

// Eye height
const EYE_H = 1.6;

// Projection
const VFOV_RAD = 62.5 * Math.PI / 180.0;
const ELEV_OFFSET = 3.0 * Math.PI / 180.0;
```

## Post-Processing Shader (identical in BOTH strip and room shaders)
```glsl
// 1. Black floor lift (2%)
col.rgb = col.rgb * 0.96 + 0.02;

// 2. S-curve contrast (45%)
vec3 scurve = col.rgb * col.rgb * (3.0 - 2.0 * col.rgb);
col.rgb = mix(col.rgb, scurve, 0.45);

// 3. Saturation boost (30%)
float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
col.rgb = mix(vec3(luma), col.rgb, 1.30);

// 4. Highlight ceiling
col.rgb = min(col.rgb, 0.90 + (col.rgb - 0.90) * 0.4);

// 5. Vertical edge vignette (2%)
float topBottomFade = smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);
col.rgb *= topBottomFade * 0.05 + 0.95;

// 6. Dithering
col.rgb += dither(gl_FragCoord.xy) * 1.5 / 255.0;
```

## Room Viewer Requirements
1. **Room wall shader** must use `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` (NOT `position.xy`)
2. **Room renders to intermediate sRGB RT** then blits to screen via MeshBasicMaterial (matches strip pipeline)
3. **Floor**: `MeshBasicMaterial({color: 0x2a2a2a})` — matte dark gray, no reflections
4. **Ceiling**: `MeshBasicMaterial({color: 0x111111})`
5. **Camera**: position (0, EYE_H, 0), target (0, EYE_H, -0.01), FOV 75
6. **OrbitControls**: loaded dynamically on first R press, no pan, no zoom
7. **Tone mapping**: `THREE.NoToneMapping` for both strip and room final render

## Keyboard Controls (same for ALL visuals)
- **R**: toggle 360° room view
- **Y**: toggle 5× speed
- **T**: toggle 30× speed
- **D**: toggle guide overlays
- **P**: cycle projector strip views

## Timer
Uses `performance.now()` for real-time tracking (not frame-count based).

## Render Script (render_SCENENAME.js)
```javascript
const JPEG_QUALITY = 1.0;
const CRF = '14';
const WALLS = [
  { name: 'left',  w: 5037, h: 1200 },
  { name: 'front', w: 1891, h: 1200 },
  { name: 'right', w: 5037, h: 1200 },
  { name: 'back',  w: 1891, h: 1200 },
];
```

## Watchout Positioning
- Top strip: X=376, Y=0
- Bottom strip: X=376, Y=1200

## Critical Rules
1. Strip shader and room shader MUST have identical post-processing code
2. Never bake projector edge blending into content
3. All rotating elements must complete integer rotations in 1800s
4. Wall pixel widths must maintain uniform px/degree (use 5037/1891, not 5008/1920)
5. Any object near wall corners needs exclusion zones (~60cm)
6. `frustumCulled = false` on all scene objects
7. Zero allocations per frame — hoist all temps outside render loop

## To Create a New Visual
1. Copy `sabda_murmuration_slim.html` as template
2. Keep all viewer infrastructure (room viewer, controls, shaders, render targets)
3. Replace only the content scene elements (sky, objects, animations)
4. Create matching `assemble_SCENENAME.py` with your asset list
5. Create matching `render_SCENENAME.js` (copy from murmuration, change HTML filename)
6. Test: `python3 assemble_SCENENAME.py && open sabda_SCENENAME_full.html`
7. Render: `node render_SCENENAME.js full`
