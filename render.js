#!/usr/bin/env node
/**
 * SABDA Puppeteer Video Renderer
 * Renders 30-minute loop to 4 wall videos, then merges into top/bottom strips.
 * 
 * Usage:
 *   node render.js              # Preview mode (60s output, ~7 min render)
 *   node render.js full         # Full mode (30min output, ~3.3 hours)
 */

const puppeteer = require('puppeteer');
console.log('SABDA render.js starting...');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── CONFIG ──
const MODE = process.argv[2] === 'full' ? 'full' : 'preview';
const FPS = 30;
const DURATION_SEC = 1800;           // 30 minutes (one warmth cycle)
const PREVIEW_SPEED = 30;            // 30× speed for preview
const JPEG_QUALITY = 0.98;
const CRF = '14';
const PRESET_WALLS = 'medium';
const PRESET_MERGE = 'slow';

const TOTAL_FRAMES = MODE === 'full' ? DURATION_SEC * FPS : DURATION_SEC * FPS / PREVIEW_SPEED;
const FRAME_STEP = MODE === 'full' ? 1 / FPS : PREVIEW_SPEED / FPS;

const HTML_FILE = path.resolve(__dirname, 'sabda_evening_render_full.html');
const OUTPUT_DIR = path.resolve(__dirname, 'output');

// Wall definitions: name, width, height
const WALLS = [
  { name: 'left',  w: 5008, h: 1200 },
  { name: 'front', w: 1920, h: 1200 },
  { name: 'right', w: 5008, h: 1200 },
  { name: 'back',  w: 1920, h: 1200 },
];

console.log(`\n═══ SABDA Renderer ═══`);
console.log(`Mode: ${MODE}`);
console.log(`Frames: ${TOTAL_FRAMES} (${MODE === 'full' ? '30 min' : '60 sec'} output)`);
console.log(`Frame step: ${FRAME_STEP.toFixed(4)}s per frame`);
console.log(`Output: ${OUTPUT_DIR}\n`);

if (!fs.existsSync(HTML_FILE)) {
  console.error(`ERROR: ${HTML_FILE} not found. Run: python3 assemble_evening.py`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── FFMPEG PROCESSES ──
function startFFmpeg(wallName, w, h) {
  const outPath = path.join(OUTPUT_DIR, `wall_${wallName}.mp4`);
  const proc = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-crf', CRF,
    '-preset', PRESET_WALLS,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outPath
  ], { stdio: ['pipe', 'ignore', 'ignore'] });

  proc.on('error', (err) => console.error(`FFmpeg error (${wallName}):`, err));
  return proc;
}

async function main() {
  // Start 4 FFmpeg processes
  const ffmpegProcs = {};
  for (const wall of WALLS) {
    ffmpegProcs[wall.name] = startFFmpeg(wall.name, wall.w, wall.h);
  }

  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu-sandbox',
      '--enable-webgl',
      '--use-gl=egl',
      `--window-size=6928,2400`,
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 6928, height: 2400 });

  // Set Puppeteer flag before loading
  await page.evaluateOnNewDocument(() => {
    window.__SABDA_PUPPETEER__ = true;
  });

  console.log('Loading scene...');
  
  // Capture page console and errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('SABDA')) {
      console.log(`  [PAGE] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log(`  [PAGE ERROR] ${err.message}`));
  
  await page.goto(`file://${HTML_FILE}`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // Wait for all assets (sky textures, birds, planets, saturn) to load
  console.log('Waiting for assets...');
  await page.waitForFunction(() => window.SABDA_READY === true, { timeout: 180000 });
  console.log('Scene ready.\n');

  // ── RENDER LOOP ──
  const startTime = Date.now();
  let simTime = 0;

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    simTime = frame * FRAME_STEP;

    // 1. Render frame
    await page.evaluate((t) => window.SABDA_RENDER_FRAME(t), simTime);

    // 2. Capture each wall
    for (const wall of WALLS) {
      const jpegBase64 = await page.evaluate(async (wallName, quality) => {
        const renderer = window.SABDA_RENDERER;
        const rt = window.SABDA_WALLS[wallName];
        const gl = renderer.getContext();
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
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        const reader = new FileReader();
        return new Promise(r => {
          reader.onload = () => r(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }, wall.name, JPEG_QUALITY);

      // 3. Send to FFmpeg
      const buffer = Buffer.from(jpegBase64, 'base64');
      ffmpegProcs[wall.name].stdin.write(buffer);
    }

    // Progress
    if (frame % 100 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = ((frame + 1) / TOTAL_FRAMES * 100).toFixed(1);
      const fps = (frame + 1) / elapsed;
      const eta = ((TOTAL_FRAMES - frame - 1) / fps / 60).toFixed(1);
      const simMin = Math.floor(simTime / 60);
      const simSec = Math.floor(simTime % 60);
      console.log(`  Frame ${frame + 1}/${TOTAL_FRAMES} (${pct}%) | sim ${simMin}:${String(simSec).padStart(2, '0')} | ${fps.toFixed(1)} fps | ETA ${eta} min`);
    }
  }

  // Close FFmpeg stdin
  console.log('\nFinalizing wall videos...');
  const closePromises = WALLS.map(wall => new Promise(resolve => {
    ffmpegProcs[wall.name].stdin.end();
    ffmpegProcs[wall.name].on('close', resolve);
  }));
  await Promise.all(closePromises);

  await browser.close();

  // ── MERGE STRIPS ──
  console.log('\nMerging strips...');

  // Top: Left + Front
  await runFFmpeg([
    '-y', '-i', path.join(OUTPUT_DIR, 'wall_left.mp4'),
    '-i', path.join(OUTPUT_DIR, 'wall_front.mp4'),
    '-filter_complex', '[0:v][1:v]hstack=inputs=2',
    '-c:v', 'libx264', '-crf', CRF, '-preset', PRESET_MERGE,
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    path.join(OUTPUT_DIR, 'sabda_top.mp4')
  ]);
  console.log('  ✓ sabda_top.mp4');

  // Bottom: Right + Back
  await runFFmpeg([
    '-y', '-i', path.join(OUTPUT_DIR, 'wall_right.mp4'),
    '-i', path.join(OUTPUT_DIR, 'wall_back.mp4'),
    '-filter_complex', '[0:v][1:v]hstack=inputs=2',
    '-c:v', 'libx264', '-crf', CRF, '-preset', PRESET_MERGE,
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    path.join(OUTPUT_DIR, 'sabda_top.mp4').replace('top', 'bottom')
  ]);
  console.log('  ✓ sabda_bottom.mp4');

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n═══ Done in ${totalMin} minutes ═══`);
  console.log(`Output: ${OUTPUT_DIR}/sabda_top.mp4 + sabda_bottom.mp4\n`);
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`)));
    proc.on('error', reject);
  });
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
