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
async function sceneSnapshot(ev){return ev(`(()=>{const out=[];function eff(o){let p=o;while(p){if(p.visible===false)return false;p=p.parent;}return true;}scene.traverse(o=>{if(o===scene)return;let root=o;while(root.parent&&root.parent!==scene)root=root.parent;out.push({uuid:o.uuid,type:o.type||'',name:o.name||'',visible:o.visible!==false,effectiveVisible:eff(o),parent:o.parent&&o.parent.uuid||null,parentType:o.parent&&o.parent.type||null,root:root.uuid,rootType:root.type||'',rootName:root.name||'',geom:o.geometry&&o.geometry.type||'',rootGeom:root.geometry&&root.geometry.type||'',x:+(o.position&&o.position.x||0).toFixed(2),y:+(o.position&&o.position.y||0).toFixed(2),z:+(o.position&&o.position.z||0).toFixed(2),rx:+(root.position&&root.position.x||0).toFixed(2),ry:+(root.position&&root.position.y||0).toFixed(2),rz:+(root.position&&root.position.z||0).toFixed(2)});});return out;})()`);}
function setOf(rows){return new Set(rows.map(r=>r.uuid));}
function subtract(rows,ids){return rows.filter(r=>!ids.has(r.uuid));}
function roots(rows){const m=new Map();for(const r of rows){if(!m.has(r.root))m.set(r.root,{uuid:r.root,type:r.rootType,name:r.rootName,geom:r.rootGeom,x:r.rx,y:r.ry,z:r.rz,effectiveVisible:false,descendants:0});const q=m.get(r.root);q.descendants++;if(r.effectiveVisible)q.effectiveVisible=true;}return [...m.values()];}
async function runViewport(cdp,w,h,label,touch,result){
  await viewport(cdp,w,h,touch);await cdp.send('Page.navigate',{url:base});await waitEval(cdp.evaluate,`document.readyState==='complete'`,20000);await waitEval(cdp.evaluate,`typeof __started==='function'&&typeof __paused==='function'&&typeof __gameTime==='function'&&typeof scene!=='undefined'&&document.getElementById('lvl5')`,20000);
  const baseline=await sceneSnapshot(cdp.evaluate),baselineIds=setOf(baseline);let pickerExtras=[];const view={viewport:label,baselineObjects:baseline.length,transitions:[],status:'PASS'};
  for(let i=0;i<6;i++){
    const levelId=`level${i+1}`,beforePickerIds=setOf(pickerExtras);
    await startCard(cdp,i,levelId,touch);const ta=await cdp.evaluate(`__gameTime()`);await holdKey(cdp,'KeyD',320);const tb=await cdp.evaluate(`__gameTime()`);assert(tb>ta,`${label} ${levelId}: active game time did not advance`);await sleep(220);
    const active=await sceneSnapshot(cdp.evaluate);const activeExtras=subtract(active,baselineIds);const introduced=activeExtras.filter(r=>!beforePickerIds.has(r.uuid)),introducedIds=setOf(introduced);
    await pauseAndMenu(cdp,touch);await sleep(180);const picker=await sceneSnapshot(cdp.evaluate);pickerExtras=subtract(picker,baselineIds);
    const residue=pickerExtras.filter(r=>introducedIds.has(r.uuid));const residueVisible=residue.filter(r=>r.effectiveVisible);const priorResidue=pickerExtras.filter(r=>!introducedIds.has(r.uuid));
    const tr={from:levelId,to:'picker',introducedRoots:roots(introduced),residueRoots:roots(residue),visibleResidueRoots:roots(residueVisible),residueObjects:residue.length,visibleResidueObjects:residueVisible.length,totalPickerExtras:pickerExtras.length,priorResidueObjects:priorResidue.length};view.transitions.push(tr);
    if(residue.length||residueVisible.length){view.status='FAIL';await cdp.screenshot(`${label}-${levelId}-picker-residue.png`);}
  }
  const staleBefore=setOf(pickerExtras);await startCard(cdp,0,'level1',touch);const restarted=await sceneSnapshot(cdp.evaluate);const staleInRestart=restarted.filter(r=>staleBefore.has(r.uuid));view.restart={level:'level1',staleObjects:staleInRestart.length,staleVisibleObjects:staleInRestart.filter(r=>r.effectiveVisible).length,staleRoots:roots(staleInRestart)};if(staleInRestart.length)view.status='FAIL';await pauseAndMenu(cdp,touch);
  result.viewports.push(view);if(view.status!=='PASS')result.status='FAIL';
}
async function main(){
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={status:'PASS',viewports:[]};
  try{let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}if(!ready)throw new Error('Chrome CDP did not become ready: '+chromeErr.slice(-1200));cdp=await openCDP();await runViewport(cdp,1280,720,'1280x720',false,result);await runViewport(cdp,390,844,'390x844',true,result);writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));console.log(`CROSS_LEVEL_ISOLATION_BROWSER_VERIFY=${result.status}`);console.log(JSON.stringify(result));if(result.status!=='PASS')throw new Error('cross-level scene residue detected; see result.json / residue roots above');
  }finally{if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}await sleep(200);try{rmSync(userData,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('browser cleanup warning: '+e.message);}}
}
main().catch(e=>{console.error('CROSS_LEVEL_ISOLATION_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});
