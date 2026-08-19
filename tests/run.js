#!/usr/bin/env node
// Runs every *.test.js in this folder, each in its own process so tests can't
// contaminate each other. Exits non-zero if any suite fails.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const dir=__dirname;
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.test.js')).sort();
if(!files.length){console.error('no test files found');process.exit(1);}
let failed=0,totalPass=0,totalFail=0;
for(const f of files){
  const r=spawnSync(process.execPath,[path.join(dir,f)],{encoding:'utf8'});
  const out=(r.stdout||'')+(r.stderr||'');
  const pass=(out.match(/^PASS /gm)||[]).length;
  const fail=(out.match(/^FAIL /gm)||[]).length;
  totalPass+=pass;totalFail+=fail;
  const bad=r.status!==0;
  if(bad)failed++;
  console.log(`${bad?'✗':'✓'} ${f.padEnd(22)} ${String(pass).padStart(3)} pass  ${fail} fail`);
  if(bad)console.log(out.split('\n').filter(l=>/^FAIL |Error|error/.test(l)).map(l=>'    '+l).join('\n'));
}
console.log(`\n${totalPass} passed, ${totalFail} failed, ${files.length} suites`);
process.exit(failed?1:0);
