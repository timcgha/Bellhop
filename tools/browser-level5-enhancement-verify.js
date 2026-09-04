#!/usr/bin/env node
// Level 5 Desert human-playtest enhancement — real-browser journey and visual acceptance.
// Uses only browser input events for traversal/progression: no player teleports or progress-flag forcing.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-level5-enhancement');
mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8795,cdpPort=9235,userData='/tmp/level5-enhancement-chrome';
const base=`http://127.0.0.1:${port}/index.html`;
const results={};

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function getJSON(url){return new Promise((resolve,reject)=>{http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);});}
function assert(cond,msg){if(!cond)throw new Error(msg);}
async function openCDP(){
  const targets=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`);
  const page=targets.find(t=>t.type==='page')||targets[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',()=>res(),{once:true});ws.addEventListener('error',e=>rej(e.error||e),{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message',ev=>{const msg=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}});
  function send(method,params={}){const mid=++id;return new Promise((resolve,reject)=>{pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});}
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;}
  async function screenshot(path){const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(r.data,'base64'));}
  await send('Page.enable');await send('Runtime.enable');
  return {send,evaluate,screenshot,ws,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(evaluate,expr,timeoutMs=30000){const t0=Date.now();while(Date.now()-t0<timeoutMs){try{if(await evaluate(expr))return true;}catch(e){}await sleep(120);}throw new Error('timeout waiting for '+expr);}
async function frames(evaluate,n){await evaluate(`(()=>new Promise(r=>{let i=0,N=${n|0};(function t(){if(++i>N)return r(true);requestAnimationFrame(t);})();}))()`);}
async function setViewport(cdp,width,height){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=844,screenWidth:width,screenHeight:height});await sleep(180);}
async function key(evaluate,code,down){const keyMap={Space:' ',KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyJ:'j',KeyK:'k'};await evaluate(`window.dispatchEvent(new KeyboardEvent('${down?'keydown':'keyup'}',{code:${JSON.stringify(code)},key:${JSON.stringify(keyMap[code]||'')},bubbles:true,cancelable:true}))`);}
async function hold(evaluate,codes,ms){for(const c of codes)await key(evaluate,c,true);await sleep(ms);for(const c of [...codes].reverse())await key(evaluate,c,false);await sleep(30);}
async function tap(evaluate,code,ms=65){await key(evaluate,code,true);await sleep(ms);await key(evaluate,code,false);await sleep(60);}
async function state(evaluate){return evaluate(`(()=>({x:window.__P.pos.x,y:window.__P.pos.y,z:window.__P.pos.z,vx:window.__P.vel.x,vy:window.__P.vel.y,vz:window.__P.vel.z,hp:window.__P.hp,camel:!!window.__P.camel,dead:!!window.__P.dead,rec:window.__P.quicksandRecT||0,won:!!window.__W.won,finish:!!(window.__DESERT.state&&window.__DESERT.state.finish)}))()`);}
async function lockForwardCamera(evaluate){await evaluate(`(()=>{window.__CAM.yaw=0;window.__CAM.lastManual=1e9;return true;})()`);}

// Deliberately human-paced closed-loop movement. 100ms movement pulses + 220ms look/read
// pauses approximate a young player's stop-and-go route reading without artificial timers.
async function driveTo(evaluate,tx,tz,label,timeoutMs=55000){
  const t0=Date.now();let loops=0,last=null,stuck=0;
  while(Date.now()-t0<timeoutMs){
    await lockForwardCamera(evaluate);
    const s=await state(evaluate);
    if(s.won||s.finish)return s;
    if(s.dead||s.rec>0){await sleep(450);continue;}
    const dx=tx-s.x,dz=tz-s.z;
    if(Math.hypot(dx,dz)<1.05)return s;
    const codes=[];
    if(Math.abs(dx)>0.7)codes.push(dx>0?'KeyD':'KeyA');
    if(Math.abs(dz)>0.7)codes.push(dz>0?'KeyS':'KeyW');
    if(!codes.length)return s;
    await hold(evaluate,codes,100);
    await sleep(220);
    const n=await state(evaluate);
    if(last&&Math.hypot(n.x-last.x,n.z-last.z)<0.055)stuck++;else stuck=0;
    if(stuck>=5&&n.camel){await tap(evaluate,'Space',55);stuck=0;}
    last=n;loops++;
    if(loops%22===0)await sleep(450);
  }
  const s=await state(evaluate);throw new Error(`driveTo timeout ${label}: (${s.x.toFixed(1)},${s.z.toFixed(1)}) -> (${tx},${tz})`);
}
async function leapForward(evaluate,ms=1120,double=true){
  await lockForwardCamera(evaluate);await key(evaluate,'KeyW',true);await tap(evaluate,'Space',55);await sleep(300);
  if(double)await tap(evaluate,'Space',55);
  await sleep(Math.max(250,ms-420));await key(evaluate,'KeyW',false);await sleep(180);
}
async function observe(ms=1200){await sleep(ms);}

async function camelDirectionSample(evaluate,codes,label,expected){
  await lockForwardCamera(evaluate);await sleep(420);
  for(const c of codes)await key(evaluate,c,true);
  await sleep(620);
  const r=await evaluate(`(()=>{const c=window.__P.camel;if(!c)return null;c.g.updateMatrixWorld(true);const root=new THREE.Vector3(),nose=new THREE.Vector3();c.g.getWorldPosition(root);c.g.userData.neck.getWorldPosition(nose);let nx=nose.x-root.x,nz=nose.z-root.z,nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;let vx=window.__P.vel.x,vz=window.__P.vel.z,vl=Math.hypot(vx,vz)||1;vx/=vl;vz/=vl;const py=window.__P.yaw,px=Math.sin(py),pz=Math.cos(py);return {nx,nz,vx,vz,noseDot:nx*vx+nz*vz,riderDot:px*vx+pz*vz,x:window.__P.pos.x,z:window.__P.pos.z};})()`);
  for(const c of [...codes].reverse())await key(evaluate,c,false);
  await sleep(480);
  assert(r&&r.noseDot>0.88,`${label}: camel nose does not lead movement (dot=${r&&r.noseDot})`);
  assert(r.riderDot>0.88,`${label}: rider does not face travel (dot=${r.riderDot})`);
  if(expected){const ed=r.vx*expected[0]+r.vz*expected[1];assert(ed>0.78,`${label}: movement did not resolve to expected cardinal/diagonal direction (${ed})`);}
  return r;
}
async function layoutSnapshot(evaluate){
  return evaluate(`(()=>{const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,display:getComputedStyle(e).display,opacity:getComputedStyle(e).opacity};};const win=rect(document.getElementById('win')),btns=['bA','bB','bY'].map(id=>({id,r:rect(document.getElementById(id))}));const overlap=(a,b)=>!!(a&&b&&a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y);const o=window.__DESERT.state&&window.__DESERT.state.oasis;return {w:innerWidth,h:innerHeight,won:window.__W.won,mode:window.__CAM.mode,win,btns,overlaps:btns.filter(b=>overlap(win,b.r)).map(b=>b.id),oasisVisible:!!(o&&o.g&&o.g.visible),waterVisible:!!(o&&o.pool&&o.pool.visible!==false&&o.pool.material.opacity>0.5),lushness:o&&o.lushness};})()`);
}
async function framePerf(evaluate){return evaluate(`(()=>new Promise(r=>{const N=60,t0=performance.now();let n=0;(function f(){if(++n>=N){const ms=performance.now()-t0;r({frames:N,ms,avg:ms/N,fps:1000/(ms/N)});return;}requestAnimationFrame(f);})()}))()`);}

async function run(){
  const server=spawn('python3',['-m','http.server',String(port),'-d',join(__dirname,'..')],{stdio:'ignore'});
  const chromeProc=spawn(chrome,[
    '--headless=new',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,
    '--no-sandbox','--disable-dev-shm-usage','--disable-gpu-sandbox','--enable-webgl',
    '--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'
  ],{stdio:'ignore'});
  let cdp;
  try{
    await sleep(900);cdp=await openCDP();await setViewport(cdp,844,390);
    await cdp.send('Page.navigate',{url:base+'?level5-enhancement=1'});
    await waitEval(cdp.evaluate,`typeof window.__setPickerIdx==='function'`);
    await cdp.evaluate(`window.__setPickerIdx(4)`);await sleep(120);await tap(cdp.evaluate,'Space',70);
    await waitEval(cdp.evaluate,`!!(window.__started&&window.__started())`);
    await waitEval(cdp.evaluate,`window.__LEVEL&&window.__LEVEL().id==='level5'`);
    await lockForwardCamera(cdp.evaluate);await observe(700);
    const journeyStart=Date.now();

    await driveTo(cdp.evaluate,-4,21,'first camel');
    await tap(cdp.evaluate,'Space',65);await waitEval(cdp.evaluate,`!!window.__P.camel`);
    results.mount=await state(cdp.evaluate);assert(results.mount.camel,'mount failed');

    results.camel={};
    results.camel.south=await camelDirectionSample(cdp.evaluate,['KeyS'],'south',[0,1]);
    results.camel.north=await camelDirectionSample(cdp.evaluate,['KeyW'],'north',[0,-1]);
    results.camel.east=await camelDirectionSample(cdp.evaluate,['KeyD'],'east',[1,0]);
    results.camel.west=await camelDirectionSample(cdp.evaluate,['KeyA'],'west',[-1,0]);
    const q=Math.SQRT1_2;
    results.camel.diagonal=await camelDirectionSample(cdp.evaluate,['KeyW','KeyD'],'north-east',[q,-q]);
    await cdp.screenshot(join(outDir,'844x390-camel-forward.png'));

    await driveTo(cdp.evaluate,-5,-2,'heart approach');
    await tap(cdp.evaluate,'KeyJ',60);assert(!(await state(cdp.evaluate)).camel,'dismount failed');
    await tap(cdp.evaluate,'Space',65);await waitEval(cdp.evaluate,`!!window.__P.camel`);
    await driveTo(cdp.evaluate,-5,-8,'heart lizard');await tap(cdp.evaluate,'KeyK',65);await observe(900);
    assert(await cdp.evaluate(`!window.__W.lizards.find(l=>l.reward==='heart').alive`),'heart lizard reward was not triggered');

    await driveTo(cdp.evaluate,0,-21,'first quicksand lip');await leapForward(cdp.evaluate,1180,true);
    await driveTo(cdp.evaluate,3,-38,'second camel area');
    await driveTo(cdp.evaluate,0,-54,'note approach');
    await driveTo(cdp.evaluate,4.2,-58,'note lizard');await tap(cdp.evaluate,'KeyK',65);await observe(900);
    assert(await cdp.evaluate(`!window.__W.lizards.find(l=>l.reward==='note').alive`),'note lizard reward was not triggered');

    await driveTo(cdp.evaluate,-4.5,-80,'slalom left');await driveTo(cdp.evaluate,4.2,-88,'slalom right');
    await driveTo(cdp.evaluate,0,-92,'jump trench one');await leapForward(cdp.evaluate,1180,true);
    await driveTo(cdp.evaluate,-4.4,-104,'slalom left two');await driveTo(cdp.evaluate,4.5,-112,'slalom right two');
    await driveTo(cdp.evaluate,0,-116,'jump trench two');await leapForward(cdp.evaluate,1180,true);await observe(1200);

    await driveTo(cdp.evaluate,7.3,-145,'safe lane right');
    await driveTo(cdp.evaluate,-7.3,-162,'safe lane left');
    await driveTo(cdp.evaluate,7.2,-179,'safe lane right two');await observe(1300);

    await driveTo(cdp.evaluate,-3.5,-201,'third camel landmark');
    await driveTo(cdp.evaluate,4.4,-214,'dune canyon weave');
    await driveTo(cdp.evaluate,0,-218,'canyon quicksand lip');await leapForward(cdp.evaluate,1250,true);
    await driveTo(cdp.evaluate,-6.2,-232,'canyon left');await driveTo(cdp.evaluate,5.8,-240,'canyon right');await observe(1300);

    await driveTo(cdp.evaluate,6.8,-255,'route choice right');
    await driveTo(cdp.evaluate,-6.8,-273,'route choice left');
    await driveTo(cdp.evaluate,0,-287,'route choice jump lip');await leapForward(cdp.evaluate,1250,true);
    await driveTo(cdp.evaluate,0,-318,'final approach marker');await observe(1500);

    async function bypass(side,diagonal){
      const sx=side<0?-18.2:18.2;
      await driveTo(cdp.evaluate,sx,-329,`${side<0?'left':'right'} bypass setup`);
      const before=await state(cdp.evaluate);
      const codes=diagonal?['KeyW',side<0?'KeyA':'KeyD']:['KeyW'];
      await hold(cdp.evaluate,codes,2600);await sleep(220);
      const after=await state(cdp.evaluate);
      assert(!after.finish&&!after.won,`${side<0?'left':'right'} ${diagonal?'diagonal':'wide'} bypass accidentally entered finish`);
      assert(after.z>-333.8,`${side<0?'left':'right'} ${diagonal?'diagonal':'wide'} bypass passed sandstone canyon (${after.z})`);
      assert(after.camel,`${side<0?'left':'right'} bypass unexpectedly lost mounted state`);
      await driveTo(cdp.evaluate,sx,-325,'bypass retreat');
      return {before,after};
    }
    results.bypass={};
    results.bypass.leftWide=await bypass(-1,false);
    results.bypass.leftDiagonal=await bypass(-1,true);
    results.bypass.rightWide=await bypass(1,false);
    results.bypass.rightDiagonal=await bypass(1,true);
    await driveTo(cdp.evaluate,0,-326,'return center');
    await cdp.screenshot(join(outDir,'844x390-finale-canyon.png'));

    await driveTo(cdp.evaluate,0,-357,'cliff top',65000);
    const top=await state(cdp.evaluate);assert(top.y>6.8,'final ramp did not reach cliff top');
    await key(cdp.evaluate,'KeyW',true);await tap(cdp.evaluate,'Space',60);await sleep(1200);await key(cdp.evaluate,'KeyW',false);
    await waitEval(cdp.evaluate,`!!(window.__DESERT.state&&window.__DESERT.state.finish)`,12000);
    results.finalEntry=await state(cdp.evaluate);
    await waitEval(cdp.evaluate,`!!window.__W.won`,12000);
    results.durationSec=(Date.now()-journeyStart)/1000;
    assert(results.durationSec>=180&&results.durationSec<=330,`natural journey duration ${results.durationSec.toFixed(1)}s is outside 3–5.5 minute acceptance envelope`);

    await frames(cdp.evaluate,24);results.landscape=await layoutSnapshot(cdp.evaluate);
    assert(results.landscape.oasisVisible&&results.landscape.waterVisible,'landscape oasis/water not visible');
    assert(results.landscape.win&&results.landscape.win.x>=-1&&results.landscape.win.right<=845,'landscape victory banner does not fit viewport');
    assert(results.landscape.overlaps.length===0,'landscape controls overlap victory text: '+results.landscape.overlaps.join(','));
    await cdp.screenshot(join(outDir,'844x390-oasis-finish.png'));

    await setViewport(cdp,390,844);await frames(cdp.evaluate,28);results.portrait=await layoutSnapshot(cdp.evaluate);
    assert(results.portrait.oasisVisible&&results.portrait.waterVisible,'portrait oasis/water not visible');
    assert(results.portrait.win&&results.portrait.win.x>=-1&&results.portrait.win.right<=391,'portrait victory banner does not fit viewport');
    assert(results.portrait.overlaps.length===0,'portrait controls overlap victory text: '+results.portrait.overlaps.join(','));
    await cdp.screenshot(join(outDir,'390x844-oasis-finish.png'));

    await setViewport(cdp,1280,720);await frames(cdp.evaluate,28);results.desktop=await layoutSnapshot(cdp.evaluate);
    results.performance=await framePerf(cdp.evaluate);
    assert(results.desktop.oasisVisible&&results.desktop.waterVisible,'desktop oasis/water not visible');
    assert(results.desktop.win&&results.desktop.win.x>=-1&&results.desktop.win.right<=1281,'desktop victory banner does not fit viewport');
    assert(results.performance.fps>=20,`finish render cadence too low (${results.performance.fps.toFixed(1)} fps)`);
    await cdp.screenshot(join(outDir,'1280x720-oasis-finish.png'));

    await sleep(3800);await tap(cdp.evaluate,'Space',70);
    await waitEval(cdp.evaluate,`!(window.__started&&window.__started())`,12000);
    results.returnedToPicker=true;
    writeFileSync(join(outDir,'results.json'),JSON.stringify(results,null,2));
    console.log('LEVEL5_BROWSER_RESULT=PASS');
    console.log(`NATURAL_DURATION_SECONDS=${results.durationSec.toFixed(1)}`);
    console.log('CAMEL_CARDINAL_DIAGONAL=PASS');
    console.log('CLIFF_LEFT_RIGHT_WIDE_DIAGONAL_MOUNTED=PASS');
    console.log(`OASIS_844x390=PASS OASIS_390x844=PASS OASIS_1280x720=PASS FPS=${results.performance.fps.toFixed(1)}`);
  }finally{
    if(cdp)cdp.close();try{chromeProc.kill('SIGTERM');}catch(e){}try{server.kill('SIGTERM');}catch(e){}
  }
}
run().catch(e=>{console.error('LEVEL5_BROWSER_RESULT=FAIL');console.error(e&&e.stack||e);process.exit(1);});
