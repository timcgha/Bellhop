#!/usr/bin/env node
// Pling v57 real-browser visual acceptance.
// Uses the real level picker and keyboard actions. It never teleports the player,
// forces progression, changes physics, or mutates combat/win state. The only
// direct runtime adjustment is camera yaw while pathing to the Level 5 camel;
// that standardizes the verifier's driving direction without changing gameplay.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-player-visual-redesign');
mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8797,cdpPort=9237,userData=`/tmp/bellhop-player-visual-${process.pid}`,base=`http://127.0.0.1:${port}/index.html`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(c,m){if(!c)throw new Error(m);}
function getJSON(url){return new Promise((resolve,reject)=>{http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);});}
async function openCDP(){
  const pages=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`),page=pages.find(x=>x.type==='page')||pages[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',e=>rej(e.error||e),{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message',ev=>{const m=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;};
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(outDir,name),Buffer.from(r.data,'base64'));};
  await send('Page.enable');await send('Runtime.enable');return {send,evaluate,screenshot,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(ev,expr,ms=12000){const t=Date.now();while(Date.now()-t<ms){try{if(await ev(expr))return true;}catch(e){}await sleep(100);}throw new Error('timeout: '+expr);}
async function viewport(cdp,w,h){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<=844,screenWidth:w,screenHeight:h});await sleep(220);}
const keys={
  Space:[' ',32],KeyW:['w',87],KeyA:['a',65],KeyS:['s',83],KeyD:['d',68],
  KeyJ:['j',74],KeyK:['k',75],ArrowRight:['ArrowRight',39]
};
async function key(cdp,code,down){const [k,vk]=keys[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:down&&k.length===1?k:undefined,unmodifiedText:down&&k.length===1?k:undefined});}
async function tap(cdp,code,ms=70){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(100);}
async function hold(cdp,codes,ms){for(const c of codes)await key(cdp,c,true);await sleep(ms);for(const c of [...codes].reverse())await key(cdp,c,false);await sleep(70);}
async function fresh(cdp){
  await cdp.send('Page.navigate',{url:base});
  await waitEval(cdp.evaluate,`document.readyState==='complete'`,15000);
  await waitEval(cdp.evaluate,`typeof __started==='function'&&typeof __PLAYER_VISUAL==='function'&&document.getElementById('lvl0')`,15000);
}
async function pickerTo(cdp,index){
  assert(await cdp.evaluate(`__started()===false`),'picker expected before start');
  for(let i=0;i<index;i++)await tap(cdp,'ArrowRight',45);
  const idx=await cdp.evaluate(`typeof __pickerIdx==='function'?__pickerIdx():${index}`);
  assert(idx===index,`picker index ${idx} !== ${index}`);
  await tap(cdp,'Space',75);
}
async function projection(ev){
  return ev(`(()=>{const p=__PLAYER(),cam=new THREE.PerspectiveCamera(__CAM.fov||60,innerWidth/innerHeight,0.1,220);cam.position.copy(__CAM.pos);cam.lookAt(__CAM.look);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();const v=new THREE.Vector3(p.position.x,p.position.y+0.58,p.position.z).project(cam);return {x:v.x,y:v.y,z:v.z,visible:p.visible,w:innerWidth,h:innerHeight,mode:__CAM.mode};})()`);
}
function assertFramed(p,label){assert(p.visible,label+' player hidden');assert(Math.abs(p.x)<0.96&&Math.abs(p.y)<0.96,label+` player outside camera frame (${p.x.toFixed(2)},${p.y.toFixed(2)})`);}
async function state(ev){return ev(`(()=>({x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,grounded:!!__P.grounded,yaw:__P.yaw,camel:!!__P.camel}))()`);}
async function driveTo(cdp,ev,tx,tz,label,timeout=24000){
  const start=Date.now();let stuck=0,last=null;
  while(Date.now()-start<timeout){
    // Camera-only normalization; player/world/progression state remains input-driven.
    await ev(`(()=>{__CAM.yaw=0;__CAM.lastManual=1e9;return true;})()`);
    const s=await state(ev),dx=tx-s.x,dz=tz-s.z;if(Math.hypot(dx,dz)<1.05)return s;
    const codes=[];if(Math.abs(dx)>0.65)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>0.65)codes.push(dz>0?'KeyS':'KeyW');
    await hold(cdp,codes,170);const n=await state(ev);
    if(last&&Math.hypot(n.x-last.x,n.z-last.z)<0.04)stuck++;else stuck=0;last=n;
    if(stuck>=5){await tap(cdp,'Space',55);stuck=0;}
  }
  const s=await state(ev);throw new Error(`drive timeout ${label}: ${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)} -> ${tx},${tz}`);
}
async function main(){
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';
  const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});
  if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={viewports:[],levels:[],actions:[]};
  try{
    let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}
    if(!ready)throw new Error('Chrome CDP did not become ready');
    cdp=await openCDP();

    // Level 1: real picker -> gameplay, then movement/facing/jump/spin/gust/grounding.
    await fresh(cdp);await viewport(cdp,1280,720);result.viewports.push('1280x720');await cdp.screenshot('01-picker-1280x720.png');
    await pickerTo(cdp,0);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level1'`,6000);result.levels.push('Level 1');
    const vis=await cdp.evaluate(`__PLAYER_VISUAL()`);assert(vis.style==='rounded-white-cyan-v57'&&vis.eyeCount===2&&vis.hasVisor&&vis.hasAntenna&&vis.hasChestAccent,'redesigned Pling visual hook mismatch');
    assert(vis.rootScale===0.72&&vis.keepsJet&&vis.keepsFlame,'root/effect preservation mismatch');
    assertFramed(await projection(cdp.evaluate),'Level 1 desktop');await cdp.screenshot('02-level1-idle-1280x720.png');

    // Move sideways first so the authored lamp immediately behind the spawn cannot
    // turn a valid movement check into a collision-specific false negative.
    const p0=await state(cdp.evaluate);await hold(cdp,['KeyD'],700);const p1=await state(cdp.evaluate);
    const moved=Math.hypot(p1.x-p0.x,p1.z-p0.z);
    assert(moved>0.8,`walking/running did not move Pling (${moved.toFixed(2)}m; ${p0.x.toFixed(2)},${p0.z.toFixed(2)} -> ${p1.x.toFixed(2)},${p1.z.toFixed(2)})`);result.actions.push('walk/run');
    const yaw0=p1.yaw;await hold(cdp,['KeyW'],500);const p2=await state(cdp.evaluate);
    let yd=Math.abs(((p2.yaw-yaw0+Math.PI)%(Math.PI*2))-Math.PI);assert(yd>0.2,`facing yaw did not respond to turn/movement (${yaw0.toFixed(2)} -> ${p2.yaw.toFixed(2)})`);
    assert(await cdp.evaluate(`Math.abs(__PLAYER().rotation.y-__P.yaw)<0.001`),'rendered facing detached from gameplay yaw');result.actions.push('facing');

    await key(cdp,'Space',true);await sleep(180);const jump=await state(cdp.evaluate);await key(cdp,'Space',false);
    assert(jump.y>p2.y+0.12&&!jump.grounded,'jump did not visibly leave ground');await cdp.screenshot('03-level1-jump.png');result.actions.push('jump');
    await waitEval(cdp.evaluate,`__P.grounded===true`,4500);
    const landed=await state(cdp.evaluate);assert(Math.abs((await cdp.evaluate(`__PLAYER().position.y`))-landed.y)<0.03,'ordinary grounded player root detached from physics position');result.actions.push('grounding');

    await key(cdp,'KeyK',true);await sleep(90);
    const spin=await cdp.evaluate(`({t:__P.bonkT,l:__PLAYER().userData.armL.rotation.z,r:__PLAYER().userData.armR.rotation.z})`);
    await key(cdp,'KeyK',false);assert(spin.t>0&&Math.abs(spin.l)>0.4&&Math.abs(spin.r)>0.4,'spin animation/action did not engage redesigned arms');result.actions.push('spin');
    await sleep(650);
    await key(cdp,'KeyJ',true);await sleep(85);
    const gust=await cdp.evaluate(`({mouthT:__P.mouthT,mouthY:__PLAYER().userData.mouth.scale.y})`);
    await key(cdp,'KeyJ',false);assert(gust.mouthT>0&&gust.mouthY>0.05,'normal ground gust/action did not animate redesigned mouth');result.actions.push('normal-action/gust');

    await viewport(cdp,844,390);result.viewports.push('844x390');assertFramed(await projection(cdp.evaluate),'Level 1 landscape mobile');await cdp.screenshot('04-level1-844x390.png');
    await viewport(cdp,390,844);result.viewports.push('390x844');assertFramed(await projection(cdp.evaluate),'Level 1 portrait mobile');await cdp.screenshot('05-level1-390x844.png');

    // Reload/start again to catch disappearance or broken construction on restart.
    await fresh(cdp);await viewport(cdp,1280,720);await pickerTo(cdp,0);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level1'`,6000);
    const restart=await cdp.evaluate(`({v:__PLAYER().visible,s:__PLAYER_VISUAL().style,n:__PLAYER().children.length})`);
    assert(restart.v&&restart.s==='rounded-white-cyan-v57'&&restart.n>0,'redesigned mesh missing/broken after browser restart');result.actions.push('restart');

    // Level 5: naturally path to a camel and mount it; verify visual root stays attached.
    await fresh(cdp);await viewport(cdp,844,390);await pickerTo(cdp,4);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level5'&&__W.camels.length>0`,7000);result.levels.push('Level 5');
    const camel=await cdp.evaluate(`(()=>{const c=__W.camels[0];return {x:c.x,z:c.z};})()`);await driveTo(cdp,cdp.evaluate,camel.x,camel.z,'camel');
    await tap(cdp,'Space',60);await waitEval(cdp.evaluate,`!!__P.camel`,3500);
    const m0=await cdp.evaluate(`(()=>{const p=__PLAYER();return {dx:p.position.x-__P.pos.x,dz:p.position.z-__P.pos.z,dy:p.position.y-__P.pos.y,style:__PLAYER_VISUAL().style};})()`);
    assert(Math.hypot(m0.dx,m0.dz)<0.02&&m0.dy>1.45&&m0.dy<1.70&&m0.style==='rounded-white-cyan-v57','mounted Pling visual detached at mount');
    await hold(cdp,['KeyW'],520);
    const m1=await cdp.evaluate(`(()=>{const p=__PLAYER();return {dx:p.position.x-__P.pos.x,dz:p.position.z-__P.pos.z,dy:p.position.y-__P.pos.y,mounted:!!__P.camel};})()`);
    assert(m1.mounted&&Math.hypot(m1.dx,m1.dz)<0.02&&m1.dy>1.45&&m1.dy<1.70,'mounted Pling visual detached while moving');await cdp.screenshot('06-level5-camel-844x390.png');result.actions.push('camel mount/attachment');

    // Level 6: cross-level presence and portrait framing; the repository's existing
    // Level 6 verifier separately exercises real snowball/spin/sled/restart gameplay.
    await fresh(cdp);await viewport(cdp,390,844);await pickerTo(cdp,5);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level6'`,7000);result.levels.push('Level 6');
    assert((await cdp.evaluate(`__PLAYER_VISUAL().style`))==='rounded-white-cyan-v57','Level 6 did not use redesigned Pling');
    assertFramed(await projection(cdp.evaluate),'Level 6 portrait');await cdp.screenshot('07-level6-390x844.png');

    result.status='PASS';writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));
    console.log('PLAYER_VISUAL_BROWSER_VERIFY=PASS');console.log(JSON.stringify(result));
  }finally{
    if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}rmSync(userData,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error('PLAYER_VISUAL_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});
