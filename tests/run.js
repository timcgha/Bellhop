#!/usr/bin/env node
// Builds the deploy artifact, then runs every *.test.js in this folder in its
// own process so suites cannot contaminate each other.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..'),dir=__dirname;
const built=spawnSync(process.execPath,[path.join(root,'build.js')],{encoding:'utf8'});
if(built.status!==0){
  process.stdout.write(built.stdout||'');
  process.stderr.write(built.stderr||'');
  console.error('build failed before tests');
  process.exit(1);
}
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
  console.log(`${bad?'✗':'✓'} ${f.padEnd(36)} ${String(pass).padStart(3)} pass  ${fail} fail`);
  if(bad)console.log(out.split('\n').filter(l=>/^FAIL |Error|error/.test(l)).map(l=>'    '+l).join('\n'));
}
console.log(`\n${totalPass} passed, ${totalFail} failed, ${files.length} suites`);
process.exit(failed?1:0);
