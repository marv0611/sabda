const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// SABDA Loop Check Renderer
// Renders last 15s (t=1785→1800) + first 15s (t=0→15) at real-time speed.
// Loop point is at the 15-second mark of the output video.
// No warmup needed — homing fixes bring birds/dust to spawn positions
// near boundaries regardless of accumulated state.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  fps: 30,
  outputDuration: 60,    // 60 seconds total
  canvasW: 6928,
  canvasH: 2400,
  // Scene time ranges:
  // Frames 0-899:    t = 1770 → 1800 (last 30s of loop — full homing window)
  // Frames 900-1799: t = 0 → 30 (first 30s of loop — full homing window)
};

const totalFrames = CONFIG.fps * CONFIG.outputDuration;
const halfFrames = totalFrames / 2;

function simTimeForFrame(frame) {
  if (frame < halfFrames) {
    // Last 30 seconds of the loop
    return 1770 + (frame / halfFrames) * 30;
  } else {
    // First 30 seconds of the loop
    return ((frame - halfFrames) / halfFrames) * 30;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SABDA Loop Check Renderer');
  console.log(`  Output: ${CONFIG.outputDuration}s (${totalFrames} frames @ ${CONFIG.fps}fps)`);
  console.log('  t=1770→1800 then t=0→30 (loop point at 30s mark)');
  console.log('═══════════════════════════════════════════════');

  try { execSync('ffmpeg -version', { stdio: 'ignore' }); }
  catch { console.error('\n❌ FFmpeg not found.'); process.exit(1); }

  const htmlPath = path.join(__dirname, 'sabda_evening_render.html');
  if (!fs.existsSync(htmlPath)) { console.error('❌ HTML not found'); process.exit(1); }

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const walls = {
    left:  { w: 5008, h: 1200 },
    right: { w: 5008, h: 1200 },
    front: { w: 1920, h: 1200 },
    back:  { w: 1920, h: 1200 },
  };

  // FFmpeg pipes for 4 walls
  const ffProcs = {};
  for (const [name, dim] of Object.entries(walls)) {
    const outFile = path.join(outDir, `loopcheck_${name}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-f', 'image2pipe', '-framerate', `${CONFIG.fps}`, '-i', 'pipe:0',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '14',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    ff.stderr.on('data', () => {});
    ffProcs[name] = ff;
    console.log(`  ✓ FFmpeg: ${name} (${dim.w}×${dim.h})`);
  }

  console.log('\n  Launching Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-gpu-sandbox', '--use-gl=angle', '--enable-webgl',
      '--ignore-gpu-blocklist', '--disable-web-security', '--allow-file-access-from-files'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: CONFIG.canvasW, height: CONFIG.canvasH, deviceScaleFactor: 1 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [Err] ' + msg.text());
    else if (msg.text().includes('SABDA')) console.log('  [Browser] ' + msg.text());
  });
  page.on('pageerror', err => console.log('  [PageErr] ' + err.message));

  console.log('  Loading scene...');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 180000 });
  await page.waitForFunction('window.SABDA_READY === true', { timeout: 120000 });
  console.log('  ✓ Scene ready');

  await page.evaluate(() => {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('fps').style.display = 'none';
  });

  // Pre-create reusable canvases
  await page.evaluate(() => {
    const rts = window.SABDA_WALLS;
    window._cvs = {}; window._ctx = {};
    for (const [n, rt] of Object.entries(rts)) {
      const c = new OffscreenCanvas(rt.width, rt.height);
      window._cvs[n] = c; window._ctx[n] = c.getContext('2d');
    }
  });

  console.log('\n  Rendering loop check...\n');
  const startTime = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const simTime = simTimeForFrame(frame);

    const wallData = await page.evaluate(async (t) => {
      window.SABDA_RENDER_FRAME(t);
      const renderer = window.SABDA_RENDERER;
      const rts = window.SABDA_WALLS;
      const gl = renderer.getContext();
      const result = {};

      for (const [name, rt] of Object.entries(rts)) {
        const w = rt.width, h = rt.height;
        renderer.setRenderTarget(rt);
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const ctx = window._ctx[name];
        const img = ctx.createImageData(w, h);
        const rs = w * 4;
        for (let y = 0; y < h; y++) {
          img.data.set(px.subarray((h-1-y)*rs, (h-y)*rs), y*rs);
        }
        ctx.putImageData(img, 0, 0);
        const blob = await window._cvs[name].convertToBlob({ type: 'image/jpeg', quality: 0.98 });
        const ab = await blob.arrayBuffer();
        const u8 = new Uint8Array(ab);
        let b = '';
        for (let i = 0; i < u8.length; i += 32768) {
          b += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i+32768, u8.length)));
        }
        result[name] = btoa(b);
      }
      renderer.setRenderTarget(null);
      return result;
    }, simTime);

    for (const [name, b64] of Object.entries(wallData)) {
      const buf = Buffer.from(b64, 'base64');
      const ok = ffProcs[name].stdin.write(buf);
      if (!ok) await new Promise(r => ffProcs[name].stdin.once('drain', r));
    }

    if (frame % 5 === 0 || frame === totalFrames - 1) {
      const pct = ((frame+1)/totalFrames*100).toFixed(1);
      const el = (Date.now()-startTime)/1000;
      const spf = el/(frame+1);
      const rem = spf*(totalFrames-frame-1);
      const eta = rem>60?`${(rem/60).toFixed(0)}m`:`${rem.toFixed(0)}s`;
      const phase = frame < halfFrames ? 'END' : 'START';
      const sceneT = simTime.toFixed(1);
      process.stdout.write(`\r  Frame ${frame+1}/${totalFrames} (${pct}%) — ${spf.toFixed(2)}s/frame — t=${sceneT}s [${phase}] — ETA: ${eta}   `);
    }
  }

  console.log('\n\n  Finalizing wall videos...');
  for (const [name, ff] of Object.entries(ffProcs)) {
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    const f = path.join(outDir, `loopcheck_${name}.mp4`);
    if (fs.existsSync(f)) console.log(`  ✓ ${name}: ${(fs.statSync(f).size/1048576).toFixed(1)} MB`);
  }

  await browser.close();

  // Merge into 2 strips (same layout as main render)
  console.log('\n  Merging into 2 strips...');

  const topCmd = `ffmpeg -y -i "${path.join(outDir, 'loopcheck_left.mp4')}" -i "${path.join(outDir, 'loopcheck_front.mp4')}" -filter_complex "[0:v][1:v]hstack=inputs=2[out]" -map "[out]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart "${path.join(outDir, 'loopcheck_top.mp4')}"`;

  const botCmd = `ffmpeg -y -i "${path.join(outDir, 'loopcheck_right.mp4')}" -i "${path.join(outDir, 'loopcheck_back.mp4')}" -filter_complex "[0:v][1:v]hstack=inputs=2[out]" -map "[out]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart "${path.join(outDir, 'loopcheck_bottom.mp4')}"`;

  execSync(topCmd, { stdio: 'ignore' });
  const topFile = path.join(outDir, 'loopcheck_top.mp4');
  console.log(`  ✓ loopcheck_top.mp4: ${(fs.statSync(topFile).size/1048576).toFixed(1)} MB`);

  execSync(botCmd, { stdio: 'ignore' });
  const botFile = path.join(outDir, 'loopcheck_bottom.mp4');
  console.log(`  ✓ loopcheck_bottom.mp4: ${(fs.statSync(botFile).size/1048576).toFixed(1)} MB`);

  const totalTime = (Date.now()-startTime)/60000;
  console.log(`\n  ✅ Loop check done! ${totalTime.toFixed(1)} minutes`);
  console.log('  Loop point is at the 30-second mark of each video.');
  console.log('  Watch for any visual discontinuity at that moment.');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
