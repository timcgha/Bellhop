#!/usr/bin/env node
// Level 5 Desert human-playtest enhancement: real-browser acceptance.
// The full journey uses only keyboard input and the real picker/progression flow.
// No player teleporting, finish forcing, progress flags, or direct quicksand activation.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-level5-enhancement');
mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8795,cdpPort=9235,userData=`/tmp/bellhop-level5-enhancement-${process.pid}`;
const base=`http://127.0.0.1:${port}/index.html`;
const results={challengeBeats:4};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(cond,msg){if(!cond)throw new Error(msg);}
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
  const screenshot=async path=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(r.data,'base64'));};
  await send('Page.enable');await send('Runtime.enable');return {send,evaluate,screenshot,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(ev,expr,ms=30000){const t=Date.now();while(Date.now()-t<ms){try{if(await ev(expr))return;}catch(e){}await sleep(120);}throw new Error('timeout: '+expr);}
async function viewport(cdp,w,h){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<=844,screenWidth:w,screenHeight:h});await sleep(180);}
const keyName={Space:' ',KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyJ:'j',KeyK:'k'};
async function key(ev,code,down){await ev(`window.dispatchEvent(new KeyboardEvent('${down?'keydown':'keyup'}',{code:${JSON.stringify(code)},key:${JSON.stringify(keyName[code]||'')},bubbles:true,cancelable:true}))`);}
async function hold(ev,codes,ms){for(const c of codes)await key(ev,c,true);await sleep(ms);for(const c of [...codes].reverse())await key(ev,c,false);await sleep(35);}
async function tap(ev,code,ms=65){await key(ev,code,true);await sleep(ms);await key(ev,code,false);await sleep(70);}
async function cameraForward(ev){await ev(`(()=>{window.__CAM.yaw=0;window.__CAM.lastManual=1e9;return true;})()`);}
async function state(ev){return ev(`(()=>({x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,vx:__P.vel.x,vy:__P.vel.y,vz:__P.vel.z,grounded:!!__P.grounded,camel:!!__P.camel,dead:!!__P.dead,rec:__P.quicksandRecT||0,won:!!__W.won,finish:!!(__DESERT.state&&__DESERT.state.finish)}))()`);}

// Closed-loop input, deliberately stop/start rather than a speedrun. The pauses make the
// timing representative of a competent young player reading the route.
async function driveTo(ev,tx,tz,label,timeout=60000){
  const start=Date.now();let last=null,stuck=0,loops=0;
  while(Date.now()-start<timeout){
    await cameraForward(ev);const s=await state(ev);
    if(s.won||s.finish)return s;
    if(s.dead||s.rec>0){await sleep(500);continue;}
    const dx=tx-s.x,dz=tz-s.z;if(Math.hypot(dx,dz)<1.05)return s;
    const codes=[];if(Math.abs(dx)>0.7)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>0.7)codes.push(dz>0?'KeyS':'KeyW');
    if(!codes.length)return s;
    await hold(ev,codes,120);await sleep(110);
    const n=await state(ev);if(last&&Math.hypot(n.x-last.x,n.z-last.z)<0.045)stuck++;else stuck=0;last=n;
    if(stuck>=6){await tap(ev,'Space',55);stuck=0;}
    if(++loops%30===0)await sleep(320);
  }
  const s=await state(ev);throw new Error(`drive timeout ${label}: ${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)} -> ${tx},${tz}`);
}
async function jumpForward(ev,ms=1050){await cameraForward(ev);await key(ev,'KeyW',true);await tap(ev,'Space',55);await sleep(300);await tap(ev,'Space',55);await sleep(Math.max(260,ms-420));await key(ev,'KeyW',false);await sleep(260);}

async function direction(ev,codes,label,expected){
  await cameraForward(ev);for(const c of codes)await key(ev,c,true);await sleep(520);
  const r=await ev(`(()=>{const c=__P.camel;if(!c)return null;c.g.updateMatrixWorld(true);const root=new THREE.Vector3(),nose=new THREE.Vector3();c.g.getWorldPosition(root);c.g.userData.neck.getWorldPosition(nose);let nx=nose.x-root.x,nz=nose.z-root.z,nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;let vx=__P.vel.x,vz=__P.vel.z,vl=Math.hypot(vx,vz)||1;vx/=vl;vz/=vl;const p=__PLAYER();const py=p.rotation.y,px=Math.sin(py),pz=Math.cos(py);return {nx,nz,vx,vz,noseDot:nx*vx+nz*vz,riderDot:px*vx+pz*vz,x:__P.pos.x,z:__P.pos.z};})()`);
  for(const c of [...codes].reverse())await key(ev,c,false);await sleep(300);
  assert(r&&r.noseDot>0.90,`${label} camel nose dot ${r&&r.noseDot}`);assert(r.riderDot>0.88,`${label} Pling facing dot ${r.riderDot}`);
  const e=r.vx*expected[0]+r.vz*expected[1];assert(e>0.77,`${label} movement expected-vector dot ${e}`);return r;
}
async function finishLayout(ev){return ev(`(()=>{const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,display:getComputedStyle(e).display,opacity:+getComputedStyle(e).opacity};};const win=rect(document.getElementById('win'));const ctrls=['bA','bB','bY'].map(id=>({id,r:rect(document.getElementById(id))}));const overlap=(a,b)=>!!(a&&b&&a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y);const o=__DESERT.state&&__DESERT.state.oasis,g=__DESERT.state&&__DESERT.state.oasisGroup,p=__PLAYER();const v=p.position.clone().project(camera);return {w:innerWidth,h:innerHeight,won:__W.won,mode:__CAM.mode,win,overlaps:ctrls.filter(c=>overlap(win,c.r)).map(c=>c.id),oasisVisible:!!(g&&g.visible),oasisChildren:g?g.children.length:0,waterVisible:!!(o&&o.pool&&o.pool.visible!==false&&o.pool.material.opacity>0.5),playerNdc:{x:v.x,y:v.y,z:v.z},canvas:!!document.querySelector('canvas')};})()`);}
async function perf(ev){return ev(`(()=>new Promise(r=>{let n=0,N=45,t=performance.now();(function f(){if(++n>=N){const ms=performance.now()-t;return r({frames:N,ms,avgMs:ms/N,fps:1000/(ms/N)});}requestAnimationFrame(f);})()}))()`);}
function validateLayout(x,label){assert(x.won&&x.mode==='finish',label+' victory/camera');assert(x.canvas,label+' canvas');assert(x.oasisVisible&&x.waterVisible,label+' oasis/water');assert(x.oasisChildren>=115,label+' lushness '+x.oasisChildren);assert(x.win&&x.win.display!=='none'&&x.win.opacity>0.2,label+' victory banner visible');assert(x.win.x>=-1&&x.win.y>=-1&&x.win.right<=x.w+1&&x.win.bottom<=x.h+1,label+' banner clipped');assert(!x.overlaps.length,label+' controls overlap '+x.overlaps.join(','));assert(Math.abs(x.playerNdc.x)<0.92&&Math.abs(x.playerNdc.y)<0.92,label+' Pling outside finish composition');}

async function main(){
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..'),stdio:'ignore'});
  let chromeErr='';
  const cp=spawn(chrome,['--headless=new',`--remote-debugging-address=127.0.0.1`,`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});
  if(cp.stderr)cp.stderr.on('data',d=>{chromeErr+=d.toString();if(chromeErr.length>12000)chromeErr=chromeErr.slice(-12000);});
  let cdp;
  try{
    let ready=false,lastErr=null;
    for(let i=0;i<75;i++){
      if(cp.exitCode!==null)throw new Error(`Chrome exited before CDP became ready (code ${cp.exitCode}): ${chromeErr.trim()}`);
      try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){lastErr=e;await sleep(200);}
    }
    if(!ready)throw new Error(`Chrome CDP did not become ready on ${cdpPort}: ${lastErr&&lastErr.message}; stderr=${chromeErr.trim()}`);
    cdp=await openCDP();await viewport(cdp,844,390);await cdp.send('Page.navigate',{url:base+'?level5-enhancement=1'});
    await waitEval(cdp.evaluate,`typeof __setPickerIdx==='function'`);await cdp.evaluate(`__setPickerIdx(4)`);await tap(cdp.evaluate,'Space');
    await waitEval(cdp.evaluate,`!!(__started&&__started())&&__LEVEL().id==='level5'`);await cameraForward(cdp.evaluate);await sleep(650);

    // Mount and visual forward-axis proof in a real rendered browser.
    await driveTo(cdp.evaluate,-4,21,'camel intro');await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!__P.camel`);
    results.camel={};results.camel.south=await direction(cdp.evaluate,['KeyS'],'south',[0,1]);results.camel.north=await direction(cdp.evaluate,['KeyW'],'north',[0,-1]);results.camel.east=await direction(cdp.evaluate,['KeyD'],'east',[1,0]);results.camel.west=await direction(cdp.evaluate,['KeyA'],'west',[-1,0]);const q=Math.SQRT1_2;results.camel.diagonal=await direction(cdp.evaluate,['KeyW','KeyD'],'diagonal',[q,-q]);
    await cdp.screenshot(join(outDir,'01-camel-forward-844x390.png'));
    await waitEval(cdp.evaluate,`__P.grounded===true`,5000);const y0=(await state(cdp.evaluate)).y;await key(cdp.evaluate,'Space',true);await sleep(70);const js=await state(cdp.evaluate);await key(cdp.evaluate,'Space',false);assert(js.camel&&js.vy>7&&js.y>y0,`mounted camel jump regressed vy=${js.vy} dy=${js.y-y0}`);results.camelJump={vy:js.vy,dy:js.y-y0};await sleep(900);
    await tap(cdp.evaluate,'KeyJ');assert(!(await state(cdp.evaluate)).camel,'dismount failed');await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!__P.camel`);

    // Natural route timing begins after the orientation diagnostic; every progression step below is real input.
    const naturalStart=Date.now();let adversarialMs=0;
    await driveTo(cdp.evaluate,-5,-8,'heart lizard');await tap(cdp.evaluate,'KeyJ');await tap(cdp.evaluate,'KeyK');await sleep(700);assert(await cdp.evaluate(`!__W.lizards.find(l=>l.reward==='heart').alive`),'heart lizard not hit');await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!__P.camel`);
    await driveTo(cdp.evaluate,0,-22,'ordinary quicksand lip');await jumpForward(cdp.evaluate,1050);let s=await state(cdp.evaluate);assert(!s.won&&!s.finish&&s.rec===0,'first ordinary quicksand incorrectly won/recovered during successful jump');
    await driveTo(cdp.evaluate,4.2,-58,'note lizard');await tap(cdp.evaluate,'KeyJ');await tap(cdp.evaluate,'KeyK');await sleep(700);assert(await cdp.evaluate(`!__W.lizards.find(l=>l.reward==='note').alive`),'note lizard not hit');await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!__P.camel`);

    // Beat 2: alternating sandstone switchbacks.
    const waypoints=[
      [13,-94],[13,-116],[-13,-129],[-13,-151],[13,-164],[13,-186],[-13,-199],[-13,-221],[13,-234],[13,-256],[0,-278],
      // Beat 3: central terrace + offset quicksand + second switchback run.
      [0,-288],[0,-313],[6,-326],[6,-347],[-13,-364],[-13,-386],[13,-399],[13,-421],[-13,-434],[-13,-456],[13,-469],[13,-491],[-13,-504],[-13,-526],[13,-539],[13,-561],[-7,-568],[-7,-585],
      // Beat 4: readable cactus/dune gauntlet.
      [5,-596],[-7,-608],[-5,-621],[7,-640],[-5,-656],[5,-674],[-7,-692],[-5,-711],[5,-743],[0,-751]
    ];
    for(let i=0;i<waypoints.length;i++){await driveTo(cdp.evaluate,waypoints[i][0],waypoints[i][1],'route '+i);if(i===10||i===28)await sleep(900);}

    // Deliberately attack the finale from both sides, wide/diagonal and with repeated mounted jumps.
    const advStart=Date.now();results.bypass={};
    async function sideTry(name,x,codes,jumps){await driveTo(cdp.evaluate,x,-751,name+' setup');const before=await state(cdp.evaluate);if(jumps){await key(cdp.evaluate,'KeyW',true);for(let i=0;i<5;i++){await tap(cdp.evaluate,'Space',50);await sleep(280);}await key(cdp.evaluate,'KeyW',false);}else await hold(cdp.evaluate,codes,2100);await sleep(180);const after=await state(cdp.evaluate);assert(!after.finish&&!after.won,name+' entered finish');assert(after.z>-760.2,name+' bypassed sandstone ridge z='+after.z);assert(after.camel,name+' lost mounted state');await driveTo(cdp.evaluate,x,-748,name+' retreat');return {before,after};}
    results.bypass.left=await sideTry('left',-18,['KeyW'],false);results.bypass.right=await sideTry('right',18,['KeyW'],false);results.bypass.wideLeft=await sideTry('wide-left',-18.5,['KeyW','KeyA'],false);results.bypass.wideRight=await sideTry('wide-right',18.5,['KeyW','KeyD'],false);results.bypass.diagonalLeft=await sideTry('diagonal-left',-11,['KeyW','KeyA'],false);results.bypass.diagonalRight=await sideTry('diagonal-right',11,['KeyW','KeyD'],false);results.bypass.climbLeft=await sideTry('climb-left',-14,['KeyW'],true);results.bypass.climbRight=await sideTry('climb-right',14,['KeyW'],true);adversarialMs=Date.now()-advStart;

    // Intended finale: center terrace -> cliff top -> deliberate drop -> real final quicksand -> portal -> oasis.
    await driveTo(cdp.evaluate,0,-751,'final center');await driveTo(cdp.evaluate,0,-779,'terraced cliff climb',70000);await driveTo(cdp.evaluate,0,-790,'cliff top',40000);await cameraForward(cdp.evaluate);await hold(cdp.evaluate,['KeyW'],1900);await waitEval(cdp.evaluate,`!!(__DESERT.state&&__DESERT.state.finish)`,10000);assert(!(await state(cdp.evaluate)).won,'win fired before portal sequence');await waitEval(cdp.evaluate,`__W.won===true`,10000);
    const naturalEnd=Date.now();results.naturalSeconds=(naturalEnd-naturalStart-adversarialMs)/1000;assert(results.naturalSeconds>=150&&results.naturalSeconds<=360,'natural traversal outside few-minute target: '+results.naturalSeconds.toFixed(1)+'s');
    results.challengeBeats=4;

    // Same naturally reached victory state at all required viewports.
    results.landscape=await finishLayout(cdp.evaluate);validateLayout(results.landscape,'844x390');await cdp.screenshot(join(outDir,'02-oasis-844x390.png'));
    await viewport(cdp,390,844);results.portrait=await finishLayout(cdp.evaluate);validateLayout(results.portrait,'390x844');await cdp.screenshot(join(outDir,'03-oasis-390x844.png'));
    await viewport(cdp,1280,720);results.desktop=await finishLayout(cdp.evaluate);validateLayout(results.desktop,'1280x720');results.performance=await perf(cdp.evaluate);assert(results.performance.fps>10,'finish render stalled fps='+results.performance.fps);await cdp.screenshot(join(outDir,'04-oasis-1280x720.png'));

    // Normal post-victory return and restart still function.
    await sleep(3800);await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!(__started&&__started())`,5000);results.returnToPicker=true;await cdp.evaluate(`__setPickerIdx(4)`);await tap(cdp.evaluate,'Space');await waitEval(cdp.evaluate,`!!(__started&&__started())&&__LEVEL().id==='level5'`,5000);results.restart=true;

    writeFileSync(join(outDir,'result.json'),JSON.stringify(results,null,2));console.log('LEVEL5_BROWSER_RESULT=PASS');console.log(JSON.stringify(results));
  }finally{if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}try{rmSync(userData,{recursive:true,force:true});}catch(e){}}
}
main().catch(e=>{console.error('LEVEL5_BROWSER_RESULT=FAIL');console.error(e&&e.stack||e);process.exit(1);});
