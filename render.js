const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// SABDA Renderer v7b — Quality Upgrade
// JPEG 0.98 intermediate, CRF 14 output
//
// MODE: "preview" = 30min scene compressed into 1-minute video
//       "full"    = real-time 30-minute render (change below)
// ═══════════════════════════════════════════════════════════════

const MODE = 'full';   // 'preview' or 'full'

const CONFIG = MODE === 'preview' ? {
  fps: 30,
  outputDuration: 60,     // 1-minute output video
  sceneDuration: 1800,    // covers full 30 minutes of scene time
  canvasW: 6928,
  canvasH: 2400,
} : {
  fps: 30,
  outputDuration: 1800,   // 30-minute output
  sceneDuration: 1800,    // real-time
  canvasW: 6928,
  canvasH: 2400,
};

const totalFrames = CONFIG.fps * CONFIG.outputDuration;
const sceneTimePerFrame = CONFIG.sceneDuration / totalFrames;

async function main() {
  const isPreview = MODE === 'preview';
  console.log('═══════════════════════════════════════════════');
  console.log(`  SABDA Renderer v7b${isPreview ? ' — PREVIEW MODE' : ''}`);
  console.log(`  Output: ${CONFIG.outputDuration}s (${totalFrames} frames @ ${CONFIG.fps}fps)`);
  console.log(`  Scene: ${CONFIG.sceneDuration}s${isPreview ? ' (30× speed)' : ' (real-time)'}`);
  console.log('  Quality: JPEG 0.98 → CRF 14');
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

  // Step 1: Render 4 walls — CRF 14 + preset medium
  const ffProcs = {};
  for (const [name, dim] of Object.entries(walls)) {
    const outFile = path.join(outDir, `sabda_${name}.mp4`);
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

  console.log('\n  Rendering...\n');
  const startTime = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const simTime = frame * sceneTimePerFrame;

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
      const eta = rem>3600?`${(rem/3600).toFixed(1)}h`:rem>60?`${(rem/60).toFixed(0)}m`:`${rem.toFixed(0)}s`;
      const sceneMin = (simTime/60).toFixed(1);
      process.stdout.write(`\r  Frame ${frame+1}/${totalFrames} (${pct}%) — ${spf.toFixed(2)}s/frame — Scene: ${sceneMin}min — ETA: ${eta}   `);
    }
  }

  console.log('\n\n  Finalizing wall videos...');
  for (const [name, ff] of Object.entries(ffProcs)) {
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    const f = path.join(outDir, `sabda_${name}.mp4`);
    if (fs.existsSync(f)) console.log(`  ✓ ${name}: ${(fs.statSync(f).size/1048576).toFixed(1)} MB`);
  }

  await browser.close();

  // Step 2: Merge into 2 strips
  console.log('\n  Merging into 2 strips...');
  const suffix = isPreview ? '_preview' : '';

  const topCmd = `ffmpeg -y -i "${path.join(outDir, 'sabda_left.mp4')}" -i "${path.join(outDir, 'sabda_front.mp4')}" -filter_complex "[0:v][1:v]hstack=inputs=2[out]" -map "[out]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart "${path.join(outDir, `sabda_top${suffix}.mp4`)}"`;

  const botCmd = `ffmpeg -y -i "${path.join(outDir, 'sabda_right.mp4')}" -i "${path.join(outDir, 'sabda_back.mp4')}" -filter_complex "[0:v][1:v]hstack=inputs=2[out]" -map "[out]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart "${path.join(outDir, `sabda_bottom${suffix}.mp4`)}"`;

  execSync(topCmd, { stdio: 'ignore' });
  const topFile = path.join(outDir, `sabda_top${suffix}.mp4`);
  console.log(`  ✓ sabda_top${suffix}.mp4: ${(fs.statSync(topFile).size/1048576).toFixed(1)} MB`);

  execSync(botCmd, { stdio: 'ignore' });
  const botFile = path.join(outDir, `sabda_bottom${suffix}.mp4`);
  console.log(`  ✓ sabda_bottom${suffix}.mp4: ${(fs.statSync(botFile).size/1048576).toFixed(1)} MB`);

  const totalTime = (Date.now()-startTime)/60000;
  console.log(`\n  ✅ Done! ${totalTime.toFixed(1)} minutes`);
  console.log(`  Final: sabda_top${suffix}.mp4 + sabda_bottom${suffix}.mp4 (6928×1200 each)`);
  if (isPreview) {
    console.log(`  This is a 1-minute preview covering the full 30-minute scene at 30× speed.`);
    console.log(`  To render full: change MODE to 'full' at the top of render.js`);
  }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
