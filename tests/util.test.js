#!/usr/bin/env node
// Pure utility tests for src/util.js — no game boot required.
const fs = require('fs');
const path = require('path');

const utilPath = path.join(__dirname, '..', 'src', 'util.js');
const src = fs.readFileSync(utilPath, 'utf8')
  .replace(/\bconst\b/g, 'var')
  .replace(/if\(isTouch\)[^\n]+\n?/, '');

const util = new Function(`
  var window = { matchMedia: function() { return { matches: false }; } };
  var matchMedia = window.matchMedia;
  var document = { body: { classList: { add: function() {} } } };
  ${src}
  return { clamp, lerp, damp, moveTo, angDamp, smooth, TAU };
`)();

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { console.log('PASS ' + msg); pass++; }
  else { console.log('FAIL ' + msg); fail++; }
}

const { clamp, lerp, damp, moveTo, angDamp, smooth, TAU } = util;

ok(clamp(5, 0, 10) === 5, 'clamp keeps value inside range');
ok(clamp(-3, 0, 10) === 0, 'clamp floors below minimum');
ok(clamp(12, 0, 10) === 10, 'clamp caps above maximum');
ok(lerp(0, 10, 0.25) === 2.5, 'lerp quarter');
ok(moveTo(0, 10, 4) === 4, 'moveTo steps toward target');
ok(moveTo(10, 2, 4) === 6, 'moveTo steps down toward target');
ok(Math.abs(damp(0, 10, 5, 1) - 10 * (1 - Math.exp(-5))) < 1e-9, 'damp exponential approach');
ok(smooth(0) === 0 && smooth(1) === 1, 'smooth endpoints');
ok(Math.abs(smooth(0.5) - 0.5) < 1e-9, 'smooth midpoint');
ok(Math.abs(angDamp(0, Math.PI / 2, 10, 0.5) - (Math.PI / 2) * (1 - Math.exp(-5))) < 1e-9, 'angDamp shortest arc');
ok(TAU === Math.PI * 2, 'TAU is full circle');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
