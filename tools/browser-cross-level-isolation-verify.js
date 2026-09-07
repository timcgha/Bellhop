#!/usr/bin/env node
// BH-001 Iteration 3: cross-level scene isolation real-browser regression.
// Uses the real picker, real Pause/Main Menu controls, and observes Three.js object UUIDs.
// It does not teleport the player or directly mutate level/progression/pause state.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-cross-level-isolation');mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8799,cdpPort=9239,userData=`/tmp/bellhop-cross-level-${process.pid}`,base=`http://127.0.0.1:${port}/index.html`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(c,m){if(!c)throw new Error(m);}
function getJSON(url){return new Promise((resolve,reject)=>{http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);});}
async function openCDP(){
  const pages=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`),page=pages.find(x=>x.type==='page')||pages[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',e=>rej(e.error||e),{once:true});});
  let id=0;const pending=new Map();ws.addEventListener('message',ev=>{const m=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;};
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(outDir,name),Buffer.from(r.data,'base64'));};
  await send('Page.enable');await send('Runtime.enable');return {send,evaluate,screenshot,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(ev,expr,ms=12000){const t=Date.now();while(Date.now()-t<ms){try{if(await ev(expr))return true;}catch(e){}await sleep(100);}throw new Error('timeout: '+expr);}
async function viewport(cdp,w,h,touch=false){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:!!touch,screenWidth:w,screenHeight:h});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:!!touch,maxTouchPoints:touch?5:1});await sleep(180);}
const keys={Space:[' ',32],KeyD:['d',68],Escape:['Escape',27]};
async function key(cdp,code,down){const [k,vk]=keys[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:down&&k.length===1?k:undefined,unmodifiedText:down&&k.length===1?k:undefined});}
async function tapKey(cdp,code,ms=70){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(90);}
async function holdKey(cdp,code,ms){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(100);}
async function rect(ev,id){return ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height,display:s.display};})()`);}
async function ensureVisible(ev,id){await ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e)return false;e.scrollIntoView({block:'center',inline:'center'});return true;})()`);await sleep(100);}
async function mouseTap(cdp,ev,id){await ensureVisible(ev,id);const r=await rect(ev,id);assert(r&&r.display!=='none'&&r.w>0&&r.h>0,`#${id} not tappable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await sleep(120);}
async function touchTap(cdp,ev,id){await ensureVisible(ev,id);const r=await rect(ev,id);assert(r&&r.display!=='none'&&r.w>0&&r.h>0,`#${id} not touchable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:4,radiusY:4,force:1,id:1}]});await sleep(50);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(140);}
async function startCard(cdp,index,levelId,touch){const id=`lvl${index}`;assert(await cdp.evaluate(`__started()===false`),'picker expected before level start');const tap=touch?touchTap:mouseTap;await tap(cdp,cdp.evaluate,id);if(!(await cdp.evaluate(`__started()===true`)))await tap(cdp,cdp.evaluate,id);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id===${JSON.stringify(levelId)}&&!__paused()&&!__W.won`,8000);}
async function pauseAndMenu(cdp,touch){if(touch)await touchTap(cdp,cdp.evaluate,'pauseBtn');else await tapKey(cdp,'Escape');await waitEval(cdp.evaluate,`__paused()&&getComputedStyle(document.getElementById('pauseOverlay')).display==='flex'`,4000);const t0=await cdp.evaluate(`__gameTime()`);await sleep(260);const t1=await cdp.evaluate(`__gameTime()`);assert(Math.abs(t1-t0)<1e-9,'game time advanced while paused');if(touch)await touchTap(cdp,cdp.evaluate,'pauseMenu');else await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`!__started()&&!__paused()&&getComputedStyle(document.getElementById('start')).display==='flex'`,5000);}
async function sceneSnapshot(ev){return ev(`(()=>{const sc=__PLAYER().parent,out=[];function eff(o){let p=o;while(p){if(p.visible===false)return false;p=p.parent;}return true;}sc.traverse(o=>{if(o===sc)return;let root=o;while(root.parent&&root.parent!==sc)root=root.parent;out.push({uuid:o.uuid,type:o.type||'',name:o.name||'',visible:o.visible!==false,effectiveVisible:eff(o),parent:o.parent&&o.parent.uuid||null,parentType:o.parent&&o.parent.type||null,root:root.uuid,rootType:root.type||'',rootName:root.name||'',geom:o.geometry&&o.geometry.type||'',rootGeom:root.geometry&&root.geometry.type||'',x:+(o.position&&o.position.x||0).toFixed(2),y:+(o.position&&o.position.y||0).toFixed(2),z:+(o.position&&o.position.z||0).toFixed(2),rx:+(root.position&&root.position.x||0).toFixed(2),ry:+(root.position&&root.position.y||0).toFixed(2),rz:+(root.position&&root.position.z||0).toFixed(2)});});return out;})()`);}
async function runtimeResidue(ev){return ev(`(()=>{const active=a=>a.filter(o=>o&&(o.alive===true||o.life>0)).length,visible=a=>a.filter(o=>o&&((o.m&&o.m.visible)||(o.g&&o.g.visible))).length;return {solids:__W.solids.length,gloops:__W.gloops.length,hearts:__W.hearts.length,crates:__W.crates.length,powers:__W.powers.length,checks:__W.checks.length,snoozles:__W.snoozles.length,notes:__W.notes.length,dust:__W.dust.length,sharks:__W.sharks.length,fish:__W.fish.length,spikefish:__W.spikefish.length,clams:__W.clams.length,steamVents:__W.steamVents.length,lavas:__W.lavas.length,camels:__W.camels.length,cacti:__W.cacti.length,lizards:__W.lizards.length,quicksands:__W.quicksands.length,asteroids:__W.asteroids.length,saucers:__W.saucers.length,goosActive:active(__W.goos),goosVisible:visible(__W.goos),puddlesActive:active(__W.puddles),puddlesVisible:visible(__W.puddles),firesActive:active(__W.fires),firesVisible:visible(__W.fires),bubbleShotsActive:active(__W.bubbleShots),bubbleShotsVisible:visible(__W.bubbleShots),particlesActive:__W.celebrationParticles.filter(p=>p.life>0).length,particlesVisible:__W.celebrationParticles.filter(p=>p.m&&p.m.visible).length,camel:!!__P.camel,sled:!!__P.sled};})()`);}
function residueStateDirty(s){return Object.values(s).some(v=>v!==0&&v!==false);}
function setOf(rows){return new Set(rows.map(r=>r.uuid));}
function subtract(rows,ids){return rows.filter(r=>!ids.has(r.uuid));}
function roots(rows){const m=new Map();for(const r of rows){if(!m.has(r.root))m.set(r.root,{uuid:r.root,type:r.rootType,name:r.rootName,geom:r.rootGeom,x:r.rx,y:r.ry,z:r.rz,effectiveVisible:false,descendants:0});const q=m.get(r.root);q.descendants++;if(r.effectiveVisible)q.effectiveVisible=true;}return [...m.values()];}
// Only these actual, reusable world containers have an intentional lifetime
// beyond a level. Their identity is read from runtime ownership references,
// never inferred from UUID, position, geometry, or a hidden flag.
async function infrastructureContracts(ev){return ev(`(()=>{
  const sc=__PLAYER().parent;
  const refs=__sceneOwnership().persistentWorlds;
  return refs.map(({name,root:o})=>{
    const attached=o.parent===sc,empty=o.children.length===0,hidden=o.visible===false;
    return {name,uuid:o.uuid,type:o.type||'',attached,empty,hidden,descendants:o.children.length+1,inactive:attached&&empty&&hidden&&o.type==='Group',contract:'reusable world container; teardown empties children and hides the group'};
  });
})()`);}
function classifyOwnership(picker,baselineIds,contracts){
  const extras=subtract(picker,baselineIds);
  const valid=contracts.filter(c=>c.inactive),validIds=new Set(valid.map(c=>c.uuid));
  const unowned=extras.filter(r=>!validIds.has(r.uuid));
  return {extras,unowned,persistentInfrastructure:valid,invalidInfrastructure:contracts.filter(c=>!c.inactive)};
}
async function rainbowState(ev,uuid){return ev(`(()=>{
  const sc=__PLAYER().parent,o=sc.getObjectByProperty('uuid',${JSON.stringify(uuid)});
  return {uuid:${JSON.stringify(uuid)},attached:!!o,descendants:o?1+o.children.length:0,effectiveVisible:(()=>{let p=o;while(p){if(p.visible===false)return false;p=p.parent;}return !!o;})()};
})()`);}
async function conchRainbow(ev){return ev(`(()=>{
  const c=__W.conch,r=c&&c.rainbow;
  return r?{uuid:r.uuid,type:r.type,descendants:1+r.children.length,attached:!!r.parent,registered:__sceneOwnership().owned.includes(r)}:null;
})()`);}
async function auditPicker(ev,baselineIds){
  const picker=await sceneSnapshot(ev),contracts=await infrastructureContracts(ev);
  return {picker,ownership:classifyOwnership(picker,baselineIds,contracts),runtime:await runtimeResidue(ev),ownedCount:await ev(`__sceneOwnership().owned.length`)};
}
function ownershipDirty(a){return a.ownership.unowned.length>0||a.ownership.invalidInfrastructure.length>0||residueStateDirty(a.runtime)||a.ownedCount!==0;}
function ownershipReport(a){return {unownedRoots:roots(a.ownership.unowned),unownedObjects:a.ownership.unowned.length,persistentInfrastructure:a.ownership.persistentInfrastructure,invalidInfrastructure:a.ownership.invalidInfrastructure,ownedCount:a.ownedCount==null?null:a.ownedCount};}
async function runConchProbe(cdp,result,expectLeak){
  const label='1280x720';await viewport(cdp,1280,720,false);
  await cdp.send('Page.navigate',{url:base});
  await waitEval(cdp.evaluate,`document.readyState==='complete'`,20000);
  await waitEval(cdp.evaluate,`typeof __started==='function'&&__PLAYER()&&__PLAYER().parent&&document.getElementById('lvl1')`,20000);
  const baselineIds=setOf(await sceneSnapshot(cdp.evaluate));
  await startCard(cdp,1,'level2',false);
  const rainbow=await conchRainbow(cdp.evaluate);
  assert(rainbow&&rainbow.attached&&rainbow.descendants===8,'real Conch rainbow was not constructed');
  await holdKey(cdp,'KeyD',320);await sleep(180);
  await pauseAndMenu(cdp,false);await sleep(180);
  const audit=await auditPicker(cdp.evaluate,baselineIds);
  const state=await rainbowState(cdp.evaluate,rainbow.uuid);
  const detected=audit.ownership.unowned.some(r=>r.uuid===rainbow.uuid);
  const probe={mode:expectLeak?'before-correction':'after-correction',rainbow,state,detectedAsUnowned:detected,ownership:ownershipReport(audit),runtimeResidue:audit.runtime};
  result.probe=probe;
  const correct=expectLeak?(state.attached&&detected&&!rainbow.registered):(rainbow.registered&&!state.attached&&!detected&&!ownershipDirty(audit));
  result.status=correct?(expectLeak?'EXPECTED_FAILURE':'PASS'):'FAIL';
  writeFileSync(join(outDir,'conch-ownership-probe.json'),JSON.stringify(result,null,2));
  console.log(`CONCH_OWNERSHIP_PROBE=${result.status}`);console.log(JSON.stringify(result));
  if(!correct)throw new Error('Conch ownership regression did not match the expected lifecycle');
}
async function runViewport(cdp,w,h,label,touch,result){
  await viewport(cdp,w,h,touch);await cdp.send('Page.navigate',{url:base});await waitEval(cdp.evaluate,`document.readyState==='complete'`,20000);await waitEval(cdp.evaluate,`typeof __started==='function'&&typeof __paused==='function'&&typeof __gameTime==='function'&&typeof __PLAYER==='function'&&__PLAYER()&&__PLAYER().parent&&document.getElementById('lvl5')`,20000);
  const baseline=await sceneSnapshot(cdp.evaluate),baselineIds=setOf(baseline),baselineBy=new Map(baseline.map(r=>[r.uuid,r]));let pickerExtras=[];const view={viewport:label,baselineObjects:baseline.length,transitions:[],status:'PASS'};
  for(let i=0;i<6;i++){
    const levelId=`level${i+1}`,beforePickerIds=setOf(pickerExtras);
    await startCard(cdp,i,levelId,touch);const ta=await cdp.evaluate(`__gameTime()`);await holdKey(cdp,'KeyD',320);const tb=await cdp.evaluate(`__gameTime()`);assert(tb>ta,`${label} ${levelId}: active game time did not advance`);await sleep(220);
    const active=await sceneSnapshot(cdp.evaluate);const activeExtras=subtract(active,baselineIds);const introduced=activeExtras.filter(r=>!beforePickerIds.has(r.uuid)),introducedIds=setOf(introduced);
    const rainbow=levelId==='level2'?await conchRainbow(cdp.evaluate):null;
    if(levelId==='level2')assert(rainbow&&rainbow.attached&&rainbow.descendants===8&&rainbow.registered,`${label}: Conch rainbow missing or unregistered before teardown`);
    await pauseAndMenu(cdp,touch);await sleep(180);
    const audit=await auditPicker(cdp.evaluate,baselineIds),picker=audit.picker;pickerExtras=audit.ownership.extras;
    const residue=pickerExtras.filter(r=>introducedIds.has(r.uuid)),residueVisible=residue.filter(r=>r.effectiveVisible),priorResidue=pickerExtras.filter(r=>!introducedIds.has(r.uuid));
    const baselineReactivated=picker.filter(r=>{const b=baselineBy.get(r.uuid);return b&&!b.effectiveVisible&&r.effectiveVisible;});
    const rainbowAfter=rainbow?await rainbowState(cdp.evaluate,rainbow.uuid):null;
    const tr={from:levelId,to:'picker',introducedRoots:roots(introduced),residueRoots:roots(residue),visibleResidueRoots:roots(residueVisible),reactivatedBaselineRoots:roots(baselineReactivated),residueObjects:residue.length,visibleResidueObjects:residueVisible.length,reactivatedBaselineObjects:baselineReactivated.length,totalPickerExtras:pickerExtras.length,priorResidueObjects:priorResidue.length,runtimeResidue:audit.runtime,ownership:ownershipReport(audit),conchRainbow:rainbowAfter};view.transitions.push(tr);
    if(residueVisible.length||baselineReactivated.length||ownershipDirty(audit)||(rainbowAfter&&rainbowAfter.attached)){view.status='FAIL';await cdp.screenshot(`${label}-${levelId}-picker-residue.png`);}
  }
  // A subsequent real run must not reactivate or retain prior-level objects.
  const staleBefore=setOf(pickerExtras);await startCard(cdp,0,'level1',touch);const restarted=await sceneSnapshot(cdp.evaluate);const staleInRestart=restarted.filter(r=>staleBefore.has(r.uuid)),staleVisible=staleInRestart.filter(r=>r.effectiveVisible);
  const restartContracts=await infrastructureContracts(cdp.evaluate),restartOwnership=classifyOwnership(staleInRestart,new Set(),restartContracts);
  view.restart={level:'level1',staleObjects:staleInRestart.length,staleVisibleObjects:staleVisible.length,staleRoots:roots(staleInRestart),ownership:ownershipReport({ownership:restartOwnership})};
  if(staleVisible.length||restartOwnership.unowned.length||restartOwnership.invalidInfrastructure.length)view.status='FAIL';
  await pauseAndMenu(cdp,touch);
  const finalAudit=await auditPicker(cdp.evaluate,baselineIds);view.restart.pickerOwnership=ownershipReport(finalAudit);
  if(ownershipDirty(finalAudit))view.status='FAIL';
  result.viewports.push(view);if(view.status!=='PASS')result.status='FAIL';
}
async function main(){
  const probe=process.argv.includes('--probe-conch'),expectLeak=process.argv.includes('--expect-conch-leak');
  if(expectLeak&&!probe)throw new Error('--expect-conch-leak requires --probe-conch');
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={status:'PASS',viewports:[]};
  try{let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}if(!ready)throw new Error('Chrome CDP did not become ready: '+chromeErr.slice(-1200));cdp=await openCDP();
    if(probe)await runConchProbe(cdp,result,expectLeak);
    else{await runViewport(cdp,1280,720,'1280x720',false,result);await runViewport(cdp,390,844,'390x844',true,result);writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));console.log(`CROSS_LEVEL_ISOLATION_BROWSER_VERIFY=${result.status}`);console.log(JSON.stringify(result));if(result.status!=='PASS')throw new Error('cross-level scene residue detected; see result.json / residue roots above');}
  }finally{if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}await sleep(200);try{rmSync(userData,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('browser cleanup warning: '+e.message);}}
}
main().catch(e=>{console.error('CROSS_LEVEL_ISOLATION_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});
