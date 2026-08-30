#!/usr/bin/env node
// DEF-B-016 natural journey: Level 4 → Cheese Moon message → stay in play → Candy Planet
const puppeteer = require('puppeteer-core');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

const outDir = join(__dirname, '..', 'artifacts', 'browser-def-b-016');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8766;
const base = `http://127.0.0.1:${port}/index.html`;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: join(__dirname, '..'),
    stdio: 'ignore'
  });

  await sleep(500);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  const page = await browser.newPage();
  const logs = [];
  page.on('pageerror', e => logs.push('pageerror:' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') logs.push('console:' + msg.text()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__setPickerIdx === 'function', { timeout: 20000 });

  const version = await page.evaluate(() => document.getElementById('ver')?.textContent || null);

  // 1. Launch Level 4 normally via picker
  await page.click('#lvl3');
  await page.click('#lvl3');
  await page.waitForFunction(() => window.__started && window.__started(), { timeout: 10000 });
  await sleep(500);

  // 2–3. Fly Asteroid Garden path toward Stage 2 Cheese Moon endpoint (route along x≈28, -z)
  const cheese = await page.evaluate(async () => {
    const S = window.__SPACE;
    const P = window.__P;
    const end = S.stage2Ends[0];
    const route = [
      [22, 2.5, -10],
      [28, 5, -26],
      [28, 5, -56],
      [28, 5, -96],
      [28, 6, -118],
      [30, 5, -138],
      [end.x, end.y, end.z]
    ];
    for (const [x, y, z] of route) {
      P.moveZone = 'openSpace';
      P.grounded = false;
      for (let i = 0; i < 18; i++) {
        const dx = x - P.pos.x, dy = y - P.pos.y, dz = z - P.pos.z;
        const d = Math.hypot(dx, dy, dz) || 1;
        P.vel.set(dx / d * 6.5, dy / d * 4, dz / d * 6.5);
        P.pos.x += P.vel.x * 0.05;
        P.pos.y += P.vel.y * 0.05;
        P.pos.z += P.vel.z * 0.05;
        await new Promise(r => requestAnimationFrame(r));
      }
      P.pos.set(x, y, z);
      P.vel.set(0, 0, 0);
      for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r));
    }
    P.pos.set(end.x, end.y, end.z);
    P.vel.set(0, 0, 0);
    for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r));
    return {
      triggered: end.triggered,
      toast: (document.getElementById('toast') || {}).textContent || '',
      started: window.__started(),
      level: window.__LEVEL().id
    };
  });

  await page.screenshot({ path: join(outDir, 'cheese-moon-trigger.png') });

  // 4. Wait past old 1.2s soft-return window
  await sleep(1600);
  const afterCheese = await page.evaluate(() => ({
    started: window.__started(),
    level: window.__LEVEL() && window.__LEVEL().id,
    startDisplay: (document.getElementById('start') || {}).style?.display || '',
    toast: (document.getElementById('toast') || {}).textContent || '',
    cheeseLandable: !!(window.__SPACE.cheeseMoon && window.__SPACE.cheeseMoon.userData.landable === false),
    candy: !!window.__SPACE.candyPlanet,
    won: !!(window.__W && window.__W.won)
  }));
  await page.screenshot({ path: join(outDir, 'after-cheese-moon.png') });

  // 5–6. Continue toward Candy Planet along open-space route (beyond Cheese Moon)
  const candy = await page.evaluate(async () => {
    const S = window.__SPACE;
    const P = window.__P;
    const cp = S.candyPlanet;
    if (!cp) return { ok: false, reason: 'no candy planet' };
    const route = [
      [45, 8, -168],
      [58, 12, -175],
      [82, 16, -192],
      [98, 18, -198],
      [cp.x, cp.y - cp.r * 0.52 + 0.5, cp.z]
    ];
    for (const [x, y, z] of route) {
      P.moveZone = 'openSpace';
      P.grounded = false;
      for (let i = 0; i < 16; i++) {
        const dx = x - P.pos.x, dy = y - P.pos.y, dz = z - P.pos.z;
        const d = Math.hypot(dx, dy, dz) || 1;
        P.vel.set(dx / d * 7, dy / d * 4, dz / d * 7);
        P.pos.x += P.vel.x * 0.05;
        P.pos.y += P.vel.y * 0.05;
        P.pos.z += P.vel.z * 0.05;
        await new Promise(r => requestAnimationFrame(r));
      }
      P.pos.set(x, y, z);
      P.vel.set(0, 0, 0);
      for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
    }
    P.grounded = true;
    for (let i = 0; i < 8; i++) await new Promise(r => requestAnimationFrame(r));
    const dist = Math.hypot(P.pos.x - cp.x, P.pos.z - cp.z);
    return {
      ok: true,
      started: window.__started(),
      dist,
      nearCandy: dist < 14,
      starCrates: S.starCrates.length,
      stage3Ends: S.stage3Ends.length,
      hasStarBeamAvail: S.starCrates.length >= 1
    };
  });

  await page.screenshot({ path: join(outDir, 'candy-planet-reached.png') });

  const stage3 = await page.evaluate(async () => {
    const S = window.__SPACE;
    const P = window.__P;
    const c = S.starCrates[0];
    if (!c) return { hasStarBeam: false };
    P.pos.set(c.x, c.y + 0.5, c.z);
    P.grounded = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', bubbles: true }));
    for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK', bubbles: true }));
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    return {
      hasStarBeam: !!P.hasStarBeam,
      started: window.__started(),
      stage3Ends: S.stage3Ends.length
    };
  });
  await page.screenshot({ path: join(outDir, 'stage3-star-beam.png') });

  // Mobile width spot check: reload and confirm Cheese Moon still does not exit
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__setPickerIdx === 'function', { timeout: 20000 });
  await page.click('#lvl3');
  await page.click('#lvl3');
  await page.waitForFunction(() => window.__started && window.__started(), { timeout: 10000 });
  const mobile = await page.evaluate(async () => {
    const end = window.__SPACE.stage2Ends[0];
    window.__P.pos.set(end.x, end.y, end.z);
    window.__P.vel.set(0, 0, 0);
    window.__P.moveZone = 'openSpace';
    for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 1500));
    return {
      triggered: end.triggered,
      started: window.__started(),
      startDisplay: (document.getElementById('start') || {}).style?.display || '',
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  });
  await page.screenshot({ path: join(outDir, 'mobile-after-cheese.png') });

  const result = {
    version,
    cheese,
    afterCheese,
    candy,
    stage3,
    mobile,
    logs,
    fatalErrors: logs.some(l => l.startsWith('pageerror:')),
    pass: !!(
      cheese.triggered &&
      /cheese moon/i.test(cheese.toast) &&
      afterCheese.started &&
      afterCheese.level === 'level4' &&
      afterCheese.startDisplay !== 'flex' &&
      afterCheese.cheeseLandable &&
      candy.ok && candy.started && candy.nearCandy &&
      candy.hasStarBeamAvail &&
      stage3.started &&
      mobile.started && mobile.startDisplay !== 'flex' &&
      !logs.some(l => l.startsWith('pageerror:'))
    )
  };

  writeFileSync(join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  server.kill('SIGTERM');
  process.exit(result.pass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
