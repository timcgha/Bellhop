#!/usr/bin/env node
const puppeteer = require('puppeteer-core');
const { mkdirSync } = require('fs');
const { join } = require('path');

const outDir = join(__dirname, '..', 'artifacts', 'browser-stage3');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const base = 'http://127.0.0.1:8080/index.html';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const results = [];
  for (const vp of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'mobile390', width: 390, height: 844 }, { name: 'mobile320', width: 320, height: 568 }]) {
    const page = await browser.newPage();
    const logs = [];
    page.on('pageerror', e => logs.push('pageerror:' + e.message));
    page.on('console', msg => { if (msg.type() === 'error') logs.push('console:' + msg.text()); });
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => typeof window.__setPickerIdx === 'function', { timeout: 15000 });
    const version = await page.evaluate(() => document.getElementById('ver')?.textContent || null);
    await page.click('#lvl3');
    await page.click('#lvl3');
    await page.waitForFunction(() => window.__started && window.__started(), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));
    const state = await page.evaluate(() => ({
      level: window.__LEVEL().id,
      snoozles: window.__W.snoozles.length,
      starCrates: window.__SPACE.starCrates.length,
      candy: !!window.__SPACE.candyPlanet,
      cheese: !!(window.__SPACE.cheeseMoon && window.__SPACE.cheeseMoon.userData.landable === false),
      interior: !!window.__SPACE.crystalInterior
    }));
    await page.screenshot({ path: join(outDir, `picker-${vp.name}.png`) });
    await page.evaluate(() => {
      const cp = window.__SPACE.candyPlanet;
      if (cp) {
        window.__P.pos.set(cp.x, cp.y - cp.r * 0.52 + 0.5, cp.z);
        window.__P.grounded = true;
        window.__P.hasStarBeam = true;
      }
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: join(outDir, `candy-${vp.name}.png`) });
    results.push({ viewport: vp.name, version, state, logs, clicks: ['#lvl3', '#lvl3'] });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify({ ok: true, results, outDir }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
