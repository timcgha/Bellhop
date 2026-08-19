// Headless test harness for Bellhop.
//
// There is no browser here. We stub THREE and the DOM with permissive proxies,
// boot the game's script, and then drive it one frame at a time with scripted
// input. That lets us assert on real physics and game state (positions,
// velocities, hit points, HUD text) without rendering anything.
//
// Usage in a test file:
//   const H = require('./harness.js')();
//   const {P, W, el, frames, tap, ok, kd, ku, report} = H;
//
// Each require('./harness.js')() call boots a FRESH game. Tests that need a
// clean world must live in their own file, because run.js gives every file its
// own process. Sharing one instance across unrelated assertions caused false
// failures (leftover fireballs, half-dead enemies) and is not worth the speed.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameScript } = require('../tools/load-game.js');

const GAME_HTML = path.join(__dirname, '..', 'index.html');

// --- permissive proxy: stands in for any THREE class or DOM object we don't model
const handler = {
  get(t, k) {
    if (k === Symbol.toPrimitive) return () => 0;
    if (k === 'then' || typeof k === 'symbol') return undefined;
    if (!(k in t)) t[k] = pf();
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; },
  apply() { return pf(); },
  construct() { return pf(); }
};
function pf() { return new Proxy(function () {}, handler); }

// --- the few THREE types the game does arithmetic on, so they must be real
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  setScalar(s) { this.x = this.y = this.z = s; return this; }
}
class Obj {
  constructor() {
    this.position = new V3(); this.rotation = new V3(); this.scale = new V3(1, 1, 1);
    this.userData = {}; this.visible = true; this.children = [];
    this.material = { color: { setHex() {} }, opacity: 1 };
  }
  add(c) { this.children.push(c); return this; }
  lookAt() {} updateProjectionMatrix() {}
}
class Cam extends Obj { constructor() { super(); this.fov = 60; } }

const THREE = new Proxy({}, {
  get(t, k) {
    if (k === 'Vector3') return V3;
    if (['Group', 'Mesh', 'Sprite', 'Scene'].includes(k)) return Obj;
    if (k === 'PerspectiveCamera') return Cam;
    if (k === 'Shape' || k === 'Path') return class { constructor() { this.holes = []; } moveTo() {} lineTo() {} };
    if (k === 'Color' || k === 'Fog') return class {};
    return pf();
  }
});

// --- test hooks (game exports P, CAM, and W on window — see player.js and game.js)
const HOOKS = [];

module.exports = function boot() {
  const html = fs.readFileSync(GAME_HTML, 'utf8');
  let src = loadGameScript(html);
  for (const [from, to] of HOOKS) {
    if (!src.includes(from)) throw new Error(`test hook not found in source: ${from}`);
    src = src.replace(from, to);
  }

  const els = {};
  function el(id) {
    if (!els[id]) els[id] = {
      id, listeners: {}, style: {}, textContent: '',
      classList: { add() {} },
      addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
      setPointerCapture() {}
    };
    return els[id];
  }

  const winListeners = {}, rafs = [], timeouts = [];
  const window = {
    THREE,
    matchMedia: () => ({ matches: false }),
    devicePixelRatio: 1, innerWidth: 800, innerHeight: 600,
    addEventListener(t, f) { (winListeners[t] = winListeners[t] || []).push(f); },
    document: {
      getElementById: el,
      body: { classList: { add() {} }, appendChild() {} },
      createElement() { return pf(); },
      addEventListener() {}
    },
    navigator: { getGamepads: () => [] },
    performance: { now: () => 0 },
    requestAnimationFrame(f) { rafs.push(f); },
    setInterval: () => 0,
    setTimeout(f) { timeouts.push(f); return 1; },
    clearTimeout() {}
  };

  const ctx = vm.createContext(Object.assign({}, window, { window, console, Math }));
  vm.runInContext(src, ctx);

  const P = window.__P, W = window.__W, CAM = window.__CAM;
  const kd = winListeners.keydown[0], ku = winListeners.keyup[0];
  let now = 0;

  function frames(n) { for (let i = 0; i < n; i++) { now += 16.67; rafs.shift()(now); } }
  function tap(code, n = 2) { kd({ code, preventDefault() {}, repeat: false }); frames(n); ku({ code }); }

  let failures = 0;
  function ok(cond, msg) {
    if (!cond) failures++;
    console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  }
  function report() {
    if (failures) { console.log(`\n${failures} FAILED`); process.exit(1); }
    console.log('\nall passed');
  }

  // start the game (the start card swallows the first input)
  kd({ code: 'Space', preventDefault() {}, repeat: false });
  frames(5);
  ku({ code: 'Space' });

  return { P, W, CAM, els, el, frames, tap, ok, report, kd, ku, timeouts };
};
