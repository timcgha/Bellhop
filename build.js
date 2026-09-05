#!/usr/bin/env node
// Deterministically assembles the standalone Bellhop page from small source files.
//
//   node build.js          build dist/index.html
//   node build.js --check  verify dist/index.html is current
//
// The deploy artifact is generated output. Do not hand-edit or commit dist/.
const fs=require('fs'),path=require('path');

const ROOT=__dirname;
const ORDER=['util.js','audio.js','input.js','render.js','fx.js','entities.js','player.js','enemies.js','peak.js','deep.js','space.js','desert.js','winter.js','winter-picker.js','hud.js','winter-ui.js','game.js'];
const SRC=path.join(ROOT,'src'),LEVELS=path.join(ROOT,'levels');
const TEMPLATE=path.join(ROOT,'index.template.html');
const RELEASE=path.join(ROOT,'release.json');
const DIST=path.join(ROOT,'dist');
const OUTPUT=path.join(DIST,'index.html');
const BUILD_TOKEN='{{BUILD_CONTENT}}';
const RELEASE_TOKEN='{{RELEASE_DISPLAY}}';
const START='// ---- BUILD:START ----',END='// ---- BUILD:END ----';

function fail(message){throw new Error(message);}
function readUtf8(file,label){
  if(!fs.existsSync(file))fail(`missing ${label}: ${path.relative(ROOT,file)}`);
  return fs.readFileSync(file,'utf8');
}
function exactlyOnce(text,token,label){
  const first=text.indexOf(token),last=text.lastIndexOf(token);
  if(first<0||first!==last)fail(`${label} must contain exactly one ${token}`);
}
function readRelease(){
  let value;
  try{value=JSON.parse(readUtf8(RELEASE,'release metadata'));}
  catch(error){fail(`invalid release.json: ${error.message}`);}
  if(!value||typeof value.display!=='string'||!value.display.trim())fail('release.json display must be a non-empty string');
  return value.display;
}
function sourceParts(){
  if(!fs.existsSync(LEVELS))fail('missing levels/ directory');
  if(!fs.existsSync(SRC))fail('missing src/ directory');
  const parts=[];
  const levels=fs.readdirSync(LEVELS).filter(f=>f.endsWith('.js')).sort();
  if(!levels.length)fail('no level source files found');
  for(const f of levels)parts.push(`// ===== levels/${f} =====\n${readUtf8(path.join(LEVELS,f),`level source ${f}`)}`);
  for(const f of ORDER)parts.push(`// ===== src/${f} =====\n${readUtf8(path.join(SRC,f),`source ${f}`)}`);
  return parts;
}
function render(){
  const template=readUtf8(TEMPLATE,'HTML template');
  exactlyOnce(template,BUILD_TOKEN,'index.template.html');
  exactlyOnce(template,RELEASE_TOKEN,'index.template.html');
  if(template.includes(START)||template.includes(END))fail('index.template.html must not contain generated BUILD markers');
  const release=readRelease();
  const body=`const BELLHOP_RELEASE=${JSON.stringify(release)};\n\n${sourceParts().join('\n\n')}`;
  return template
    .replace(RELEASE_TOKEN,release)
    .replace(BUILD_TOKEN,`${START}\n${body}\n${END}`);
}
function validate(html){
  if(html.includes(BUILD_TOKEN)||html.includes(RELEASE_TOKEN))fail('generated artifact contains unresolved template tokens');
  const si=html.indexOf(START),ei=html.indexOf(END);
  if(si<0||ei<0||si>=ei)fail('generated artifact has invalid BUILD markers');
  const release=readRelease();
  if(!html.includes(`<div class="sub" id="ver">${release}</div>`))fail('generated artifact does not contain canonical release display');
  if(!html.includes(`const BELLHOP_RELEASE=${JSON.stringify(release)};`))fail('generated artifact does not expose canonical release to runtime code');
  for(const f of fs.readdirSync(LEVELS).filter(f=>f.endsWith('.js')).sort()){
    if(!html.includes(`// ===== levels/${f} =====`))fail(`generated artifact is missing levels/${f}`);
  }
  for(const f of ORDER){
    if(!html.includes(`// ===== src/${f} =====`))fail(`generated artifact is missing src/${f}`);
  }
  if(!html.includes('requestAnimationFrame(frame);'))fail('generated artifact is missing Bellhop frame-loop startup');
  return html;
}
function build(){
  const out=validate(render());
  fs.mkdirSync(DIST,{recursive:true});
  fs.writeFileSync(OUTPUT,out);
  return out;
}
function check(){
  if(!fs.existsSync(OUTPUT))fail('dist/index.html is missing — run: node build.js');
  const expected=validate(render());
  const actual=fs.readFileSync(OUTPUT,'utf8');
  if(actual!==expected)fail('dist/index.html is out of date — run: node build.js');
  validate(actual);
  return actual;
}

if(require.main===module){
  try{
    const out=process.argv.includes('--check')?check():build();
    console.log(process.argv.includes('--check')?'dist/index.html is up to date':`built dist/index.html from ${sourceParts().length} files (${(out.length/1024).toFixed(1)} KB)`);
  }catch(error){console.error(error.message);process.exit(1);}
}

module.exports={ORDER,OUTPUT,render,validate,build,check};
