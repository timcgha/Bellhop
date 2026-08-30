#!/usr/bin/env node
// Stage 3 playtest revision: natural Level 4 journey + Candy land + Stage 3 stay
const puppeteer = require('puppeteer-core');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

const outDir = join(__dirname, '..', 'artifacts', 'browser-stage3-playtest');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8767;
const base = `http://127.0.0.1:${port}/index.html`;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function flyRoute(page, points) {
  return page.evaluate(async (route) => {
    const P = window.__P;
    for (const [x, y, z] of route) {
      P.moveZone = 'openSpace';
      P.grounded = false;
      for (let i = 0; i < 22; i++) {
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
  }, points);
}

async function runJourney(page, label) {
  const logs = [];
  page.on('pageerror', e => logs.push('pageerror:' + e.message));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (/Failed to load resource|favicon|404/i.test(t)) return;
    logs.push('console:' + t);
  });

  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__setPickerIdx === 'function', { timeout: 20000 });
  const version = await page.evaluate(() => document.getElementById('ver')?.textContent || null);

  await page.click('#lvl3');
  await page.click('#lvl3');
  await page.waitForFunction(() => window.__started && window.__started(), { timeout: 10000 });
  await sleep(400);

  // Asteroid Garden → Stage 2 Cheese Moon foreshadow
  await flyRoute(page, [
    [22, 2.5, -10], [28, 5, -26], [28, 5, -56], [28, 5, -96], [28, 6, -118], [30, 5, -138]
  ]);
  const cheese = await page.evaluate(async () => {
    const end = window.__SPACE.stage2Ends[0];
    const P = window.__P;
    P.pos.set(end.x, end.y, end.z); P.vel.set(0, 0, 0); P.grounded = false; P.moveZone = 'openSpace';
    for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
    return {
      triggered: end.triggered,
      toast: (document.getElementById('toast') || {}).textContent || '',
      cheeseLandable: !!(window.__SPACE.cheeseMoon && window.__SPACE.cheeseMoon.userData.landable === false)
    };
  });
  await page.screenshot({ path: join(outDir, label + '-cheese.png') });
  await sleep(1600);
  const afterCheese = await page.evaluate(() => ({
    started: window.__started(),
    level: window.__LEVEL() && window.__LEVEL().id,
    startDisplay: (document.getElementById('start') || {}).style?.display || ''
  }));

  // Candy Planet approach — fly into body / toward pad
  const candy = await page.evaluate(async () => {
    const cp = window.__SPACE.candyPlanet;
    const P = window.__P;
    const pad = cp.pad;
    const padVisibleFromApproach = pad.y > cp.y + cp.r * 0.45;
    // Approach from route, then through body
    P.pos.set(82, 16, -192); P.vel.set(4, 0, -2); P.grounded = false; P.moveZone = 'openSpace';
    for (let i = 0; i < 90; i++) {
      const dx = pad.x - P.pos.x, dy = pad.y + 1 - P.pos.y, dz = pad.z - P.pos.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      P.vel.set(dx / d * 5.5, dy / d * 3.5, dz / d * 5.5);
      await new Promise(r => requestAnimationFrame(r));
      if (P.grounded) break;
    }
    // If still flying, dive into planet center to prove capture
    if (!P.grounded) {
      P.pos.set(cp.x - 1, cp.y, cp.z + 1); P.vel.set(2, -1, -2);
      for (let i = 0; i < 80; i++) {
        await new Promise(r => requestAnimationFrame(r));
        if (P.grounded) break;
      }
    }
    const shellFadeWhileInside = window.__SPACE.candyPlanetShellFade;
    let takeoffY = P.pos.y;
    if (P.grounded) {
      for (let i = 0; i < 60; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        await new Promise(r => requestAnimationFrame(r));
      }
      takeoffY = P.pos.y;
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
        await new Promise(r => requestAnimationFrame(r));
      }
    }
    const sn3 = window.__W.snoozles[1];
    const ci = window.__SPACE.crystalInterior;
    const mid = window.__SPACE.saucers.find(s => s.surfaceGate && !s.targetDummy);
    return {
      grounded: !!P.grounded,
      landedFlag: !!cp.landed,
      nearPad: Math.hypot(P.pos.x - pad.x, P.pos.z - pad.z) < cp.r * 0.8,
      y: P.pos.y,
      padY: pad.y,
      padVisibleFromApproach,
      shellFadeWhileInside,
      takeoffWorked: takeoffY > pad.y + 2,
      snoozleY: sn3 && sn3.g.position.y,
      snoozleInInterior: !!(sn3 && ci && sn3.g.position.y > ci.bounds.y0 && sn3.g.position.y < ci.bounds.y1),
      toast: (document.getElementById('toast') || {}).textContent || '',
      saucerAggroBeforeLand: mid ? !!mid.aggro && !P.grounded : null,
      started: window.__started(),
      starCrates: window.__SPACE.starCrates.length
    };
  });
  await page.screenshot({ path: join(outDir, label + '-candy.png') });

  // Crystal exit → Stage 3 endpoint
  const stage3 = await page.evaluate(async () => {
    const end = window.__SPACE.stage3Ends[0];
    const P = window.__P;
    P.pos.set(end.x, end.y, end.z); P.vel.set(0, 0, 0); P.grounded = false; P.moveZone = 'openSpace';
    for (let i = 0; i < 14; i++) await new Promise(r => requestAnimationFrame(r));
    return {
      triggered: end.triggered,
      toast: (document.getElementById('toast') || {}).textContent || ''
    };
  });
  await sleep(1600);
  const afterStage3 = await page.evaluate(() => ({
    started: window.__started(),
    level: window.__LEVEL() && window.__LEVEL().id,
    startDisplay: (document.getElementById('start') || {}).style?.display || '',
    won: !!(window.__W && window.__W.won),
    crystal: !!(window.__SPACE.crystalInterior && window.__SPACE.crystalInterior.active),
    stage3Ends: window.__SPACE.stage3Ends.length
  }));
  await page.screenshot({ path: join(outDir, label + '-stage3.png') });

  return { version, cheese, afterCheese, candy, stage3, afterStage3, logs };
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: join(__dirname, '..'),
    stdio: 'ignore'
  });
  await sleep(600);
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1280, height: 720 });
  const desk = await runJourney(desktop, 'desktop');
  await desktop.close();

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const mob = await runJourney(mobile, 'mobile');
  await mobile.close();

  await browser.close();
  server.kill();

  function pass(j) {
    const fatal = (j.logs || []).filter(l => !/404|Failed to load resource|favicon/i.test(l));
    return j.version && /v46/.test(j.version)
      && j.cheese.triggered && j.cheese.cheeseLandable
      && j.afterCheese.started && j.afterCheese.level === 'level4' && j.afterCheese.startDisplay !== 'flex'
      && (j.candy.grounded || j.candy.landedFlag) && j.candy.nearPad && j.candy.started
      && j.candy.padVisibleFromApproach && j.candy.shellFadeWhileInside < 0.55
      && j.candy.takeoffWorked && j.candy.snoozleInInterior
      && j.stage3.triggered && /saucer belt/i.test(j.stage3.toast)
      && j.afterStage3.started && j.afterStage3.level === 'level4' && j.afterStage3.startDisplay !== 'flex'
      && !j.afterStage3.won && j.afterStage3.crystal && j.afterStage3.stage3Ends === 1
      && fatal.length === 0;
  }

  const result = {
    desktop: desk,
    mobile: mob,
    desktopPass: pass(desk),
    mobilePass: pass(mob)
  };
  writeFileSync(join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    desktopPass: result.desktopPass,
    mobilePass: result.mobilePass,
    desktopVersion: desk.version,
    mobileVersion: mob.version,
    desktopCandyLanded: !!(desk.candy.grounded || desk.candy.landedFlag),
    desktopStage3Stay: desk.afterStage3.started && desk.afterStage3.startDisplay !== 'flex',
    desktopLogs: desk.logs,
    mobileLogs: mob.logs
  }, null, 2));
  if (!result.desktopPass || !result.mobilePass) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
