#!/usr/bin/env node
// Concatenates src/*.js into index.html between the build markers.
//
// index.html has to stay one self-contained file: GitHub Pages serves it at the
// project URL, and double-clicking it locally has to work too. Browsers block ES
// module imports over file://, so we concatenate instead of importing.
//
//   node build.js          rebuild index.html from src/
//   node build.js --check  exit 1 if index.html is out of date (for CI)
//
// Order matters: modules are emitted in the order listed below, inside one IIFE,
// so later files can use anything an earlier one declared.
const fs=require('fs'),path=require('path');
const ORDER=['util.js','audio.js','input.js','render.js','fx.js','entities.js','player.js','enemies.js','hud.js','game.js'];
const SRC=path.join(__dirname,'src'),LEVELS=path.join(__dirname,'levels');
const HTML=path.join(__dirname,'index.html');
const START='// ---- BUILD:START ----',END='// ---- BUILD:END ----';

if(!fs.existsSync(SRC)){
  console.error('No src/ directory yet — index.html is still the single source of truth.');
  console.error('Once the split is done, this script takes over. See CLAUDE.md.');
  process.exit(1);
}
const parts=[];
for(const f of fs.readdirSync(LEVELS).sort())parts.push(`// ===== levels/${f} =====\n`+fs.readFileSync(path.join(LEVELS,f),'utf8'));
for(const f of ORDER){
  const p=path.join(SRC,f);
  if(!fs.existsSync(p)){console.error('missing '+f);process.exit(1);}
  parts.push(`// ===== src/${f} =====\n`+fs.readFileSync(p,'utf8'));
}
const body=parts.join('\n\n');
const html=fs.readFileSync(HTML,'utf8');
const i=html.indexOf(START),j=html.indexOf(END);
if(i<0||j<0){console.error(`index.html is missing the ${START} / ${END} markers`);process.exit(1);}
const out=html.slice(0,i+START.length)+'\n'+body+'\n'+html.slice(j);
if(process.argv.includes('--check')){
  if(out!==html){console.error('index.html is out of date — run: node build.js');process.exit(1);}
  console.log('index.html is up to date');process.exit(0);
}
fs.writeFileSync(HTML,out);
console.log(`built index.html from ${parts.length} files (${(out.length/1024).toFixed(1)} KB)`);
