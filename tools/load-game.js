// Load game script: concatenate src/*.js (build order) + remainder between BUILD markers.
const fs = require('fs');
const path = require('path');

const ORDER = ['util.js','audio.js','input.js','render.js','fx.js','entities.js','player.js','enemies.js','hud.js','game.js'];
const SRC = path.join(__dirname, '..', 'src');

function loadGameScript(html) {
  const m = html.match(/<script>\n([\s\S]*?)<\/script>\s*<\/body>/);
  if (!m) throw new Error('could not find the game script inside index.html');
  const shell = m[1];
  const START = '// ---- BUILD:START ----', END = '// ---- BUILD:END ----';
  const si = shell.indexOf(START), ei = shell.indexOf(END);
  if (si < 0 || ei < 0) return shell;
  const before = shell.slice(0, si + START.length) + '\n';
  const after = '\n' + shell.slice(ei);
  const remainder = shell.slice(si + START.length, ei);
  const parts = [];
  for (const f of ORDER) {
    const p = path.join(SRC, f);
    if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
  }
  if (!parts.length) return shell;
  const body = parts.join('\n\n') + (remainder.trim() ? '\n\n' + remainder : '');
  return before + body + after;
}

module.exports = { loadGameScript, ORDER };
