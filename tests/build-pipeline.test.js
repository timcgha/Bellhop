// Publishing/build regression coverage. This suite does not change gameplay.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const build=require('../build.js');
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}

const releasePath=path.join(ROOT,'release.json');
const templatePath=path.join(ROOT,'index.template.html');
const sourceProbe=path.join(ROOT,'src','util.js');
const release=JSON.parse(fs.readFileSync(releasePath,'utf8'));
const currentRelease=release&&typeof release.display==='string'?release.display:'';
const template=fs.readFileSync(templatePath,'utf8');
const rendered=build.render();

ok(currentRelease.trim().length>0,'canonical release metadata is a non-empty string');
ok(!template.includes(currentRelease)&&template.includes('{{RELEASE_DISPLAY}}'),'template does not duplicate the current visible release string');
ok(rendered.includes(`<div class="sub" id="ver">${currentRelease}</div>`),'generated artifact injects canonical release metadata');
ok(rendered.includes(`const BELLHOP_RELEASE=${JSON.stringify(currentRelease)};`)&&rendered.includes('const VERSION_BASE=BELLHOP_RELEASE;')&&!rendered.includes("const VERSION_BASE='")&&!rendered.includes('const VERSION_BASE="'),'runtime version base derives from canonical release metadata without a hard-coded release literal');
ok(!rendered.includes('{{RELEASE_DISPLAY}}')&&!rendered.includes('{{BUILD_CONTENT}}'),'generated artifact resolves all template tokens');
ok(rendered.includes('// ---- BUILD:START ----')&&rendered.includes('// ---- BUILD:END ----'),'generated artifact contains deterministic BUILD markers');
ok(build.ORDER.every(f=>rendered.includes(`// ===== src/${f} =====`)),'generated artifact contains every ordered src module');
ok((rendered.match(/class="lvl-card/g)||[]).length===5&&rendered.includes('>Desert</span>'),'generated artifact preserves five level cards including Desert');
ok(rendered.includes('id="snz">😴 0/4</span>'),'generated artifact preserves Level 5 Snoozle HUD baseline');
ok(rendered.includes('<title>Bellhop v6</title>'),'document title remains independent from release metadata');

const releaseOriginal=fs.readFileSync(releasePath,'utf8');
try{
  const proofRelease='v55 · Build proof';
  fs.writeFileSync(releasePath,JSON.stringify({display:proofRelease},null,2)+'\n');
  const v55=build.render();
  ok(v55.includes(`<div class="sub" id="ver">${proofRelease}</div>`)&&v55.includes(`const BELLHOP_RELEASE=${JSON.stringify(proofRelease)};`)&&v55.includes('const VERSION_BASE=BELLHOP_RELEASE;'),'version-bump proof: release.json alone changes visible/runtime release values while VERSION_BASE stays canonical');
}finally{fs.writeFileSync(releasePath,releaseOriginal);}

const sourceOriginal=fs.readFileSync(sourceProbe,'utf8');
try{
  const marker='// BUILD_PIPELINE_SOURCE_EDIT_PROOF';
  fs.writeFileSync(sourceProbe,sourceOriginal+'\n'+marker+'\n');
  const changed=build.render();
  ok(changed.includes(marker),'source-edit proof: small src change flows through normal generated artifact path');
}finally{fs.writeFileSync(sourceProbe,sourceOriginal);}

build.build();
try{build.check();ok(true,'built dist/index.html validates as current generated artifact');}
catch(error){ok(false,'built dist/index.html validates as current generated artifact: '+error.message);}

if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
console.log('\nall passed');
