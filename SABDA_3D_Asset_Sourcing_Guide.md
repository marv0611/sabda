# SABDA 3D Asset Sourcing Guide

## Purpose

Where to find the highest quality 3D models for SABDA immersive projection scenes. Every source listed here has been evaluated for: texture quality, format compatibility with Three.js, animation support, and licensing for commercial projection use.

---

## SABDA Has Two Delivery Pipelines

Assets can be used in **either or both** pipelines depending on the scene:

### Pipeline A: Unity â†’ NDI â†’ Watchout (Already in use)
- Build scene directly in Unity Editor
- Use Unity Asset Store models **as-is** with native shaders, particles, VFX Graph
- Output via **NDI plugin** to Watchout media server
- Watchout maps the output to the 8-projector wall setup
- **Pros:** Full Unity rendering power (URP/HDRP), native particle systems, real-time lighting, post-processing stack, no conversion needed for Unity assets
- **Cons:** Requires Unity running on the render PC, more complex setup, not a single-file deliverable
- **Best for:** Complex scenes with heavy VFX, particle systems, dynamic lighting, scenes that benefit from Unity-specific features

### Pipeline B: Three.js HTML â†’ Chromium â†’ Watchout (New)
- Self-contained HTML file with all assets embedded as base64
- Opens in Chromium kiosk mode at 6912Ã—1200
- Watchout captures the browser output
- **Pros:** Single file, double-click to run, no Unity install needed, portable, works on any PC with a browser
- **Cons:** Limited to Three.js capabilities, manual material/animation setup, asset conversion needed
- **Best for:** Scenes with simple animation loops (butterflies, birds, drifting particles), scenes that need to be shared/previewed easily, backup content

### When to Use Which

| Scenario | Pipeline |
|----------|----------|
| Heavy particle effects (rain, snow, fire) | Unity NDI |
| Complex shader effects (water, volumetric fog) | Unity NDI |
| Simple ambient scenes (butterflies, drifting objects) | Three.js HTML |
| Client preview / demo sharing | Three.js HTML |
| Backup content that "just works" | Three.js HTML |
| Scenes using VFX Graph | Unity NDI |
| Scenes needing portability | Three.js HTML |

### Using the Same Asset in Both Pipelines

Many assets work in both pipelines. Buy once, use twice:

1. **Buy the asset** (e.g., animated fish pack from Unity Asset Store)
2. **Use directly in Unity** for the NDI pipeline â€” native quality, no conversion
3. **Extract FBX + textures** â†’ Blender â†’ GLB for the Three.js pipeline â€” portable version

This gives you a production-quality Unity version AND a portable HTML backup of the same scene.

---

## Quick Reference: What SABDA Needs

Every 3D asset for SABDA must have:

- **High-resolution textures** (2K+ for hero objects, 512+ for repeated elements)
- **Proper UV mapping** (no auto-generated UVs â€” they look terrible at projection scale)
- **PBR materials** (diffuse/albedo, normal, roughness maps minimum)
- **Animation data** if the object moves (morph targets for wings/fins, skeletal rigs for birds/characters)
- **Commercial licence** that covers public projection / installation use

---

## Tier 1 â€” Best for SABDA (Direct or Easy Conversion)

### Sketchfab
- **URL:** https://sketchfab.com/store
- **Price:** Free + paid ($5â€“$200)
- **Formats:** GLB, FBX, OBJ, USDZ
- **Licence:** Standard or Editorial (check per model â€” Standard covers commercial use)
- **Why it's best for us:** Preview models in 3D in the browser before buying. GLB downloads work directly in Three.js. Largest selection of animated creatures (butterflies, birds, fish, jellyfish). The free tier has excellent models too.
- **Watch out for:** Older models using `KHR_materials_pbrSpecularGlossiness` â€” these need manual GLB conversion (see Manual Section 5h). Always check the material format before buying.
- **Best for:** Animated creatures, planets, fantasy objects, nature scenes

### TurboSquid (by Shutterstock)
- **URL:** https://www.turbosquid.com
- **Price:** $10â€“$500+ (CheckMate certified models are premium)
- **Formats:** FBX, OBJ, MAX, C4D, Blender
- **Licence:** Royalty-free, includes public display/projection. Up to $1M indemnification.
- **Why it's great:** CheckMate certification guarantees production-grade quality â€” proper topology, clean UVs, accurate textures. These are the models used in Hollywood VFX and broadcast.
- **Watch out for:** No GLB downloads â€” you'll need to convert via Blender (FBX â†’ GLB). Some models are 3ds Max or Cinema 4D native and need extra conversion steps.
- **Best for:** Hero assets where maximum quality matters (main planet, featured animal, centrepiece tree)

### Poly Haven
- **URL:** https://polyhaven.com
- **Price:** 100% free, CC0 (no attribution required)
- **Formats:** glTF/GLB, FBX, Blend
- **Licence:** CC0 â€” use for anything, no restrictions
- **Why it's great:** Film-quality assets with full PBR texture sets (diffuse, normal, roughness, displacement, AO). HDRIs for sky backgrounds. Textures at up to 16K resolution.
- **Watch out for:** Limited to environments and objects â€” no animated creatures. Mostly plants, rocks, furniture, architectural elements.
- **Best for:** HDRI skies, ground textures, trees, rocks, environment building

### CGTrader
- **URL:** https://www.cgtrader.com
- **Price:** Free + paid ($5â€“$300)
- **Formats:** FBX, OBJ, GLB, Blend, MAX
- **Licence:** Royalty-free, covers commercial display
- **Why it's great:** 2M+ models. Strong on nature and architectural assets. Many models come in multiple formats including GLB. Good search filters for poly count, animation, and format.
- **Watch out for:** Quality varies widely â€” always check the preview renders and read reviews. Some "high quality" models have poor UV mapping.
- **Best for:** Nature scenes (forests, coral, flowers), architectural elements, vehicles

---

## Tier 2 â€” High Quality, Needs Conversion

### Fab (Epic Games Marketplace)
- **URL:** https://www.fab.com
- **Price:** Free + paid ($5â€“$100+)
- **Formats:** UAsset (Unreal), FBX
- **Licence:** Covers use in Unreal projects; check terms for non-Unreal use
- **Why it's great:** Combines the old Unreal Marketplace, Quixel Megascans, and Sketchfab into one platform. Megascans photogrammetry assets are photorealistic â€” scanned from real objects at extremely high resolution. Environment packs (forests, caves, underwater) are stunning.
- **Conversion:** Download FBX where available â†’ Blender â†’ GLB. For UAsset-only content, you need to import into Unreal Engine first, then export as FBX.
- **Watch out for:** Licence may restrict use outside Unreal Engine projects for some assets. Read the specific licence before using in a Three.js WebGL project. Megascans (free with Unreal) are typically fine for any use.
- **Best for:** Photogrammetry environments, realistic ground surfaces, foliage, rocks

### Unity Asset Store â­ (Already in SABDA pipeline)
- **URL:** https://assetstore.unity.com
- **Price:** Free + paid ($5â€“$200+)
- **Formats:** .unitypackage (contains FBX/OBJ + Unity materials)
- **Licence:** "Extension Asset" licence â€” covers use in interactive products/media you create, including projection installations.
- **Why it's top tier for SABDA:** You already run Unity scenes via NDI to Watchout in the SABDA room. This means Unity Asset Store models can be used **two ways:**
  1. **Directly in Unity** â€” build the scene in Unity, output via NDI to Watchout (your current workflow). No conversion needed. Full access to Unity shaders, particle systems, VFX Graph, and animation controllers.
  2. **Converted to Three.js/WebGL** â€” extract the FBX + textures for use in the self-contained HTML pipeline. See conversion workflow below.
- **Conversion workflow (for Three.js use):**
  1. Import .unitypackage into a Unity project (free Unity Editor)
  2. Find the FBX/OBJ files inside the Assets folder
  3. Copy the texture files (PNG/JPG/TGA) from the Textures subfolder
  4. Open FBX in Blender â†’ reassign textures manually â†’ export as GLB
- **Why it's worth the effort even for Three.js:** Some of the highest quality animated character packs exist here. Particle effects packs can inspire scene design. Terrain and vegetation packs are exceptional.
- **Watch out for (Three.js conversion only):** Unity-specific shaders (URP/HDRP) won't translate â€” you need the raw texture files and must rebuild materials in Three.js. Animation controllers need to be replaced with manual morph targets or skeletal playback. None of this applies if you use the model directly in Unity via NDI.
- **Best for:** Animated characters, complex vegetation systems, underwater scenes, particle-heavy scenes

### Blender Market
- **URL:** https://blendermarket.com
- **Price:** $5â€“$150
- **Formats:** .blend (native Blender)
- **Licence:** Royalty-free, commercial use allowed
- **Why it's great:** Assets are Blender-native, which means direct GLB export with one click. Materials are already node-based PBR. Many include particle systems and procedural variations that can be baked before export.
- **Watch out for:** Some assets rely heavily on Blender-specific features (geometry nodes, shader nodes) that don't export to GLB. Test the GLB export before buying if possible.
- **Best for:** Blender users who want the cleanest export path to GLB

### ArtStation Marketplace
- **URL:** https://www.artstation.com/marketplace
- **Price:** $5â€“$200+
- **Formats:** Varies (FBX, OBJ, Blend, ZBrush, MAX)
- **Licence:** Check per asset â€” most allow commercial use
- **Why it's great:** Professional artist community. Extremely high-quality sculpts and characters. Detailed texture work. Many assets come with multiple LOD levels.
- **Watch out for:** Many models are ZBrush sculpts (.ztl) which need decimation and retopology before they're usable in real-time WebGL. High poly counts can crash Three.js.
- **Best for:** Hero characters, detailed creatures, high-art objects

---

## Tier 3 â€” Specialised / Free Sources

### Quixel Megascans (via Fab)
- **URL:** https://www.fab.com (search Megascans)
- **Price:** Free with Unreal Engine account
- **Formats:** FBX + texture maps (albedo, normal, roughness, displacement, AO)
- **Why it's great:** Photogrammetry-scanned real-world surfaces and objects. Nothing looks more real than a literally-real scan. Thousands of rocks, bark, leaves, sand, soil, ice, etc.
- **Best for:** Ground textures, rocks, cliff faces, foliage â€” anything environmental

### Mixamo (Adobe)
- **URL:** https://www.mixamo.com
- **Price:** Free
- **Formats:** FBX (rigged + animated)
- **Why it's great:** Auto-rigs and animates humanoid characters. Upload any humanoid mesh and get walk/dance/gesture animations in seconds.
- **Best for:** If SABDA ever needs human figures or silhouettes

### Free3D
- **URL:** https://free3d.com
- **Price:** Free + paid
- **Formats:** FBX, OBJ, MAX, Blend
- **Quality varies wildly.** Good for quick prototyping, not for final production. Always inspect before committing.

### RenderHub
- **URL:** https://www.renderhub.com
- **Price:** Free + paid ($5â€“$100)
- **Formats:** FBX, OBJ, Blend, Daz
- **Best for:** Architectural visualisation, interior objects, character models

### 3DExport
- **URL:** https://3dexport.com
- **Price:** Free + paid
- **Formats:** FBX, OBJ, MAX, C4D
- **Decent mid-range marketplace.** Some gems in the nature and animal categories.

### Daz 3D
- **URL:** https://www.daz3d.com
- **Price:** Free + paid
- **Formats:** Daz-native (requires Daz Studio for export)
- **Best for:** Hyper-realistic human figures if SABDA ever needs them

---

## Format Conversion Quick Reference

| Source Format | Conversion Path | Difficulty | Notes |
|---------------|----------------|------------|-------|
| **GLB/glTF** | Direct use | â˜…â˜†â˜† | Check for SpecularGlossiness extension |
| **FBX** | Blender â†’ Export GLB | â˜…â˜…â˜† | Check morph targets survive export |
| **OBJ + MTL** | Blender â†’ Export GLB | â˜…â˜…â˜† | No animation data â€” static only |
| **Blend** | Open in Blender â†’ Export GLB | â˜…â˜†â˜† | Cleanest path |
| **.unitypackage** | Unity â†’ extract FBX â†’ Blender â†’ GLB | â˜…â˜…â˜… | Rebuild materials manually |
| **UAsset (Unreal)** | Unreal â†’ Export FBX â†’ Blender â†’ GLB | â˜…â˜…â˜… | May need LOD selection |
| **ZBrush (.ztl)** | ZBrush â†’ Decimate â†’ Export OBJ â†’ Blender â†’ GLB | â˜…â˜…â˜…â˜… | High poly, needs reduction |
| **MAX (.max)** | 3ds Max â†’ Export FBX â†’ Blender â†’ GLB | â˜…â˜…â˜… | Requires 3ds Max licence |
| **C4D** | Cinema 4D â†’ Export FBX â†’ Blender â†’ GLB | â˜…â˜…â˜… | Requires C4D licence |

**Universal rule:** Always go through Blender as the intermediate step. Blender is free, handles every format, and exports clean GLB.

---

## What to Look for When Buying

### Must-Have Checklist

- [ ] **Texture resolution stated** â€” minimum 2K for hero objects
- [ ] **PBR material workflow** â€” not legacy Phong/Blinn
- [ ] **Polygon count stated** â€” under 500K for real-time use, ideally under 100K per object
- [ ] **UV mapped** â€” not auto-generated / box projected
- [ ] **FBX or GLB available** â€” avoid MAX-only or C4D-only if you don't have those apps
- [ ] **Preview renders look good** â€” if the preview is bad, the model is bad
- [ ] **Animation included** (if needed) â€” check for morph targets or skeletal rig
- [ ] **Commercial licence** â€” covers public display / installation

### Red Flags

- No texture previews shown (model might have no textures)
- "Game ready" with 200 polygons (too low for 1-metre projection viewing)
- Only .max or .c4d format (conversion chain too long, things break)
- "Procedural textures" (these don't export â€” you get flat colours)
- No wireframe preview (topology might be terrible)
- Very cheap ($1â€“$3) animated models (usually broken rigs)

### Sweet Spot for SABDA

- **Creatures (butterflies, birds, fish):** $15â€“$50 on Sketchfab with animation
- **Planets / celestial bodies:** $20â€“$80 on Sketchfab or TurboSquid
- **Trees / vegetation:** Free from Poly Haven or $10â€“$30 on CGTrader
- **Ground textures:** Free from Poly Haven or Megascans
- **HDRI skies:** Free from Poly Haven (always)
- **Hero centrepiece asset:** Up to $100â€“$200 on TurboSquid with CheckMate certification

---

## Scene-Specific Sourcing Suggestions

| Scene | Primary Assets | Best Source | Budget |
|-------|---------------|-------------|--------|
| Butterfly Dusk | Animated butterfly, birds, planets | Sketchfab | $30â€“$60 |
| Pine Forest | Photoscanned pine trees, ground | Poly Haven + Megascans | Free |
| Underwater | Coral reef, animated fish, jellyfish | Sketchfab + CGTrader | $50â€“$100 |
| Cherry Blossom | Sakura tree, petal particles | Blender Market + Sketchfab | $30â€“$50 |
| Snow Forest | Pine trees, snow ground | Poly Haven + Megascans | Free |
| Night Forest | Trees, firefly particles, moon | Poly Haven + Sketchfab | $0â€“$20 |
| Desert Night | Rock formations, starfield | Megascans + Poly Haven | Free |
| Rain | Wet surfaces, rain particles | Megascans + procedural | Free |
| Garden | Flowers, hedges, insects | CGTrader + Poly Haven | $20â€“$60 |
| Sunrise Forest | Deciduous trees, mist, birds | Poly Haven + Sketchfab | $0â€“$30 |

---

## Licence Summary

| Source | Commercial Projection OK? | Notes |
|--------|--------------------------|-------|
| Poly Haven | âœ… Yes (CC0) | No restrictions whatsoever |
| Sketchfab (Standard) | âœ… Yes | Covers commercial display |
| TurboSquid | âœ… Yes | Royalty-free, indemnified |
| CGTrader | âœ… Yes | Royalty-free commercial |
| Megascans / Fab | âš ï¸ Check | Free with Unreal â€” non-Unreal use may need separate licence |
| Unity Asset Store | âœ… Yes | Already in SABDA pipeline via NDI. Licence covers projection use. |
| Blender Market | âœ… Yes | Royalty-free |
| ArtStation | âš ï¸ Check | Varies per asset |
| Mixamo | âœ… Yes | Free for commercial use |
| Daz 3D | âš ï¸ Check | Some assets restrict rendering contexts |
