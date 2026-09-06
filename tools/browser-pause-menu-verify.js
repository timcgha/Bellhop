#!/usr/bin/env node
// v58 pause/menu real-browser acceptance. Uses the real picker plus real keyboard,
// mouse, and touch input. Runtime hooks are observed for acceptance evidence; the
// verifier never mutates pause, player position, progression, completion, or win state.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-pause-menu');
mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8798,cdpPort=9238,userData=`/tmp/bellhop-pause-${process.pid}`,base=`http://127.0.0.1:${port}/index.html`;
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
async function setViewport(cdp,w,h,touch){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:!!touch,screenWidth:w,screenHeight:h});
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:!!touch,maxTouchPoints:touch?5:1});
  await sleep(150);
}
async function fresh(cdp,w,h,touch){
  await setViewport(cdp,w,h,touch);
  await cdp.send('Page.navigate',{url:base});
  await waitEval(cdp.evaluate,`document.readyState==='complete'`,15000);
  await waitEval(cdp.evaluate,`typeof __started==='function'&&typeof __paused==='function'&&typeof __gameTime==='function'&&typeof __INPUT_STATE==='function'&&document.getElementById('pauseBtn')`,15000);
}
const keys={Space:[' ',32],KeyW:['w',87],KeyA:['a',65],KeyS:['s',83],KeyD:['d',68],KeyJ:['j',74],KeyK:['k',75],ArrowRight:['ArrowRight',39],Escape:['Escape',27],KeyP:['p',80]};
async function key(cdp,code,down){const [k,vk]=keys[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:down&&k.length===1?k:undefined,unmodifiedText:down&&k.length===1?k:undefined});}
async function tapKey(cdp,code,ms=70){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(80);}
async function holdKey(cdp,code,ms){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(100);}
async function holdKeys(cdp,codes,ms){for(const c of codes)await key(cdp,c,true);await sleep(ms);for(const c of [...codes].reverse())await key(cdp,c,false);await sleep(100);}
async function rect(ev,id){return ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height,display:s.display,visibility:s.visibility};})()`);}
function overlaps(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
async function mouseTap(cdp,ev,id){const r=await rect(ev,id);assert(r.display!=='none'&&r.w>0&&r.h>0,`#${id} not tappable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await sleep(100);}
async function touchTap(cdp,ev,id){const r=await rect(ev,id);assert(r.display!=='none'&&r.w>0&&r.h>0,`#${id} not touchable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:4,radiusY:4,force:1,id:1}]});await sleep(45);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(110);}
async function pickerToKeyboard(cdp,index){assert(await cdp.evaluate(`__started()===false`),'picker expected');for(let i=0;i<index;i++)await tapKey(cdp,'ArrowRight',45);await tapKey(cdp,'Space',70);}
async function sim(ev){return ev(`(()=>({started:__started(),paused:__paused(),time:__gameTime(),x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,vx:__P.vel.x,vy:__P.vel.y,vz:__P.vel.z,level:__LEVEL()&&__LEVEL().id,won:!!(__W&&__W.won),overlay:getComputedStyle(document.getElementById('pauseOverlay')).display,picker:getComputedStyle(document.getElementById('start')).display,win:getComputedStyle(document.getElementById('win')).display,playing:document.body.classList.contains('playing'),pausedClass:document.body.classList.contains('paused'),pauseBtn:getComputedStyle(document.getElementById('pauseBtn')).display,input:__INPUT_STATE(),camel:!!__P.camel,sled:!!__P.sled,moveZone:__P.moveZone,spaceThrust:!!__P.spaceThrust}))()`);}
function moved(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function frozen(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-6&&Math.abs(a.time-b.time)<1e-9;}
function neutralInput(i){return i.mx===0&&i.mz===0&&i.camDX===0&&i.camDY===0&&!i.jump&&!i.jumpHeld&&!i.b&&!i.bHeld&&!i.y&&i.touchStickId===null&&i.touchCamId===null&&!i.heldA&&!i.heldB&&i.keysDown.length===0;}
async function assertCleanPicker(cdp,label){
  const s=await sim(cdp.evaluate);
  assert(!s.started&&!s.paused&&!s.won,`${label}: Main Menu did not leave inactive, unpaused, non-win state`);
  assert(s.picker==='flex',`${label}: picker not visible after Main Menu`);
  assert(s.win==='none',`${label}: win/completion UI visible after abandonment`);
  assert(!s.playing&&!s.pausedClass,`${label}: stale playing/paused body state after Main Menu`);
  assert(s.pauseBtn==='none',`${label}: pause button remains visible on picker`);
  assert(neutralInput(s.input),`${label}: stale gameplay input after Main Menu: ${JSON.stringify(s.input)}`);
  const touchHidden=await cdp.evaluate(`['bA','bB','bY'].every(id=>getComputedStyle(document.getElementById(id)).display==='none')`);
  assert(touchHidden,`${label}: gameplay touch controls visible on picker after Main Menu`);
  return s;
}
async function startSameRunAgain(cdp,levelId,label){
  const t0=await cdp.evaluate(`__gameTime()`);
  await tapKey(cdp,'Space',70);
  await waitEval(cdp.evaluate,`__started()===true&&__LEVEL().id===${JSON.stringify(levelId)}&&__paused()===false&&!__W.won`,7000);
  await sleep(260);
  const s=await sim(cdp.evaluate);
  assert(s.time>t0,`${label}: subsequent run game time did not advance`);
  assert(!s.camel&&!s.sled&&!s.spaceThrust,`${label}: transient state leaked into subsequent run`);
  return s;
}
async function verifyLevelLifecycle(cdp,index,result){
  const levelId=`level${index+1}`,label=`Level ${index+1}`;
  await fresh(cdp,1280,720,false);
  await pickerToKeyboard(cdp,index);
  await waitEval(cdp.evaluate,`__started()===true&&__LEVEL().id===${JSON.stringify(levelId)}&&__paused()===false&&!__W.won`,7000);
  const d0=await sim(cdp.evaluate);await holdKey(cdp,'KeyD',420);const d1=await sim(cdp.evaluate);
  assert(moved(d0,d1)>0.08&&d1.time>d0.time,`${label}: active gameplay movement/time did not advance after legitimate start`);

  await tapKey(cdp,'Escape');await waitEval(cdp.evaluate,`__paused()===true&&getComputedStyle(document.getElementById('pauseOverlay')).display==='flex'`,3000);
  const f0=await sim(cdp.evaluate);await sleep(450);await holdKey(cdp,'KeyD',320);await tapKey(cdp,'Space',55);const f1=await sim(cdp.evaluate);
  assert(frozen(f0,f1),`${label}: simulation advanced while paused: ${JSON.stringify({before:f0,after:f1})}`);
  assert(neutralInput(f1.input),`${label}: paused gameplay input was retained: ${JSON.stringify(f1.input)}`);

  await mouseTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);
  const r0=await sim(cdp.evaluate);await holdKey(cdp,'KeyD',360);const r1=await sim(cdp.evaluate);
  assert(r1.time>r0.time&&moved(r0,r1)>0.06,`${label}: gameplay did not continue normally after Resume`);
  assert(!r1.won,`${label}: completion occurred during pause lifecycle`);

  await mouseTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);
  await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`__started()===false&&__paused()===false`,4000);
  await assertCleanPicker(cdp,label);
  await startSameRunAgain(cdp,levelId,label);
  result.levels.push({level:levelId,status:'PASS',freeze:'player+gameTime',blockedInput:'move+jump',resume:'movement+gameTime',mainMenu:'clean',subsequentRun:'clean'});
}
async function cameraForward(ev){await ev(`(()=>{__CAM.yaw=0;__CAM.lastManual=1e9;return true;})()`);}
async function driveTo(cdp,ev,tx,tz,label,timeout=50000){
  const start=Date.now();let last=null,stuck=0,loops=0;
  while(Date.now()-start<timeout){
    await cameraForward(ev);
    const s=await sim(ev);if(s.won)throw new Error(`${label}: unexpected win while establishing transient state`);
    const dx=tx-s.x,dz=tz-s.z;if(Math.hypot(dx,dz)<1.0)return s;
    const codes=[];if(Math.abs(dx)>0.65)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>0.65)codes.push(dz>0?'KeyS':'KeyW');
    if(!codes.length)return s;
    await holdKeys(cdp,codes,180);const n=await sim(ev);
    if(last&&Math.hypot(n.x-last.x,n.z-last.z)<0.04)stuck++;else stuck=0;last=n;
    if(stuck>=5){await tapKey(cdp,'Space',55);stuck=0;}
    if(++loops%28===0)await sleep(160);
  }
  const s=await sim(ev);throw new Error(`drive timeout ${label}: ${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)} -> ${tx},${tz}`);
}
async function verifySpaceTransient(cdp,result){
  const label='Level 4 space transient';
  await fresh(cdp,1280,720,false);await pickerToKeyboard(cdp,3);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level4'`,7000);
  await cameraForward(cdp.evaluate);await holdKey(cdp,'KeyW',1500);await waitEval(cdp.evaluate,`__P.moveZone==='openSpace'`,6000);
  await key(cdp,'Space',true);await waitEval(cdp.evaluate,`__P.spaceThrust===true`,3000);await sleep(260);
  await tapKey(cdp,'Escape',55);await key(cdp,'Space',false);await waitEval(cdp.evaluate,`__paused()===true`,3000);
  const a=await sim(cdp.evaluate);assert(a.moveZone==='openSpace'&&a.spaceThrust,label+': unusual-movement state not established');
  await holdKey(cdp,'KeyD',350);await tapKey(cdp,'Space',55);await sleep(320);const b=await sim(cdp.evaluate);
  assert(frozen(a,b),label+': player/game time advanced while paused');assert(b.moveZone===a.moveZone&&b.spaceThrust===a.spaceThrust,label+': movement mode changed while paused');
  await mouseTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);const t=a.time;await waitEval(cdp.evaluate,`__gameTime()>${t+0.08}`,3000);
  await mouseTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`!__started()&&!__paused()`,4000);
  const clean=await assertCleanPicker(cdp,label);assert(clean.moveZone==='grounded'&&!clean.spaceThrust,label+': space state leaked to picker');
  const again=await startSameRunAgain(cdp,'level4',label);assert(again.moveZone==='grounded'&&!again.spaceThrust,label+': space state leaked into subsequent run');
  result.transients.push({level:'level4',state:'openSpace + active space thrust',status:'PASS'});
}
async function verifyCamelTransient(cdp,result){
  const label='Level 5 camel transient';
  await fresh(cdp,1280,720,false);await pickerToKeyboard(cdp,4);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level5'`,7000);
  await driveTo(cdp,cdp.evaluate,-4,20,label+' approach',15000);await tapKey(cdp,'Space',55);await waitEval(cdp.evaluate,`!!__P.camel`,3000);
  await holdKey(cdp,'KeyW',350);
  await tapKey(cdp,'Escape');await waitEval(cdp.evaluate,`__paused()===true`,3000);
  const a=await cdp.evaluate(`(()=>{const c=__P.camel;return {sim:{time:__gameTime(),x:__P.pos.x,y:__P.pos.y,z:__P.pos.z},mounted:!!c,camel:c?{x:c.x,y:c.y,z:c.z,mounted:!!c.mounted}:null};})()`);
  assert(a.mounted&&a.camel&&a.camel.mounted,label+': mounted state not established');
  await holdKey(cdp,'KeyD',350);await tapKey(cdp,'Space',55);await sleep(350);
  const b=await cdp.evaluate(`(()=>{const c=__P.camel;return {sim:{time:__gameTime(),x:__P.pos.x,y:__P.pos.y,z:__P.pos.z},mounted:!!c,camel:c?{x:c.x,y:c.y,z:c.z,mounted:!!c.mounted}:null};})()`);
  assert(Math.hypot(a.sim.x-b.sim.x,a.sim.y-b.sim.y,a.sim.z-b.sim.z)<1e-6&&Math.abs(a.sim.time-b.sim.time)<1e-9,label+': player/game time advanced while paused');
  assert(b.mounted&&b.camel.mounted&&Math.hypot(a.camel.x-b.camel.x,a.camel.y-b.camel.y,a.camel.z-b.camel.z)<1e-6,label+': camel state advanced while paused');
  await mouseTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);const r0=await sim(cdp.evaluate);await holdKey(cdp,'KeyW',350);const r1=await sim(cdp.evaluate);assert(r1.time>r0.time&&moved(r0,r1)>0.05&&r1.camel,label+': mounted movement did not resume');
  await mouseTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`!__started()&&!__paused()`,4000);
  const clean=await assertCleanPicker(cdp,label);assert(!clean.camel,label+': camel leaked to picker');const again=await startSameRunAgain(cdp,'level5',label);assert(!again.camel,label+': camel leaked into subsequent run');
  result.transients.push({level:'level5',state:'mounted camel movement',status:'PASS'});
}
async function verifySledTransient(cdp,result){
  const label='Level 6 sled transient';
  await fresh(cdp,1280,720,false);await pickerToKeyboard(cdp,5);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level6'&&typeof __WINTER==='object'`,7000);
  const sled=await cdp.evaluate(`({x:__WINTER.sled.x,z:__WINTER.sled.z})`);await driveTo(cdp,cdp.evaluate,sled.x,sled.z+0.65,label+' approach',50000);
  await waitEval(cdp.evaluate,`__P.pos.y>5.2&&Math.hypot(__P.pos.x-__WINTER.sled.x,__P.pos.z-__WINTER.sled.z)<2.25`,7000);await tapKey(cdp,'Space',70);
  await waitEval(cdp.evaluate,`!!__P.sled&&__WINTER.sled.phase==='sliding'`,3500);await waitEval(cdp.evaluate,`__WINTER.sled.progress>0.04`,4000);
  await tapKey(cdp,'Escape');await waitEval(cdp.evaluate,`__paused()===true`,3000);
  const a=await cdp.evaluate(`(()=>({time:__gameTime(),px:__P.pos.x,py:__P.pos.y,pz:__P.pos.z,hasSled:!!__P.sled,phase:__WINTER.sled.phase,progress:__WINTER.sled.progress,x:__WINTER.sled.x,z:__WINTER.sled.z}))()`);
  assert(a.hasSled&&a.phase==='sliding',label+': live sliding state not established');
  await holdKey(cdp,'KeyA',420);await tapKey(cdp,'Space',55);await sleep(350);
  const b=await cdp.evaluate(`(()=>({time:__gameTime(),px:__P.pos.x,py:__P.pos.y,pz:__P.pos.z,hasSled:!!__P.sled,phase:__WINTER.sled.phase,progress:__WINTER.sled.progress,x:__WINTER.sled.x,z:__WINTER.sled.z}))()`);
  assert(Math.hypot(a.px-b.px,a.py-b.py,a.pz-b.pz)<1e-6&&Math.abs(a.time-b.time)<1e-9,label+': player/game time advanced while paused');
  assert(b.hasSled&&b.phase===a.phase&&Math.abs(b.progress-a.progress)<1e-9&&Math.hypot(b.x-a.x,b.z-a.z)<1e-6,label+': sled advanced while paused');
  await mouseTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);await waitEval(cdp.evaluate,`__WINTER.sled.progress>${a.progress+0.03}`,3000);
  await mouseTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`!__started()&&!__paused()`,4000);
  const clean=await assertCleanPicker(cdp,label);assert(!clean.sled,label+': sled leaked to picker');const again=await startSameRunAgain(cdp,'level6',label);assert(!again.sled,label+': sled leaked into subsequent run');
  result.transients.push({level:'level6',state:'active sliding sled',status:'PASS'});
}
async function verifyPhone(cdp,w,h,label,result){
  await fresh(cdp,w,h,true);
  await touchTap(cdp,cdp.evaluate,'lvl0');await touchTap(cdp,cdp.evaluate,'lvl0');
  await waitEval(cdp.evaluate,`__started()===true&&__LEVEL().id==='level1'`,7000);
  const p=await rect(cdp.evaluate,'pauseBtn'),m=await rect(cdp.evaluate,'mute'),hud=await rect(cdp.evaluate,'hud');
  assert(p.display!=='none'&&p.w>=44&&p.h>=44,`${label} pause target smaller than 44px`);
  assert(p.left>=0&&p.top>=0&&p.right<=w&&p.bottom<=h,`${label} pause target outside viewport`);
  assert(!overlaps(p,m),`${label} pause overlaps mute`);
  assert(!overlaps(p,hud),`${label} pause overlaps HUD`);
  await touchTap(cdp,cdp.evaluate,'pauseBtn');
  await waitEval(cdp.evaluate,`__paused()===true&&getComputedStyle(document.getElementById('pauseOverlay')).display==='flex'`,4000);
  const resume=await rect(cdp.evaluate,'pauseResume'),menu=await rect(cdp.evaluate,'pauseMenu');
  const cardRect=await cdp.evaluate(`(()=>{const r=document.querySelector('#pauseOverlay .pause-card').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height};})()`);
  assert(cardRect.left>=0&&cardRect.top>=0&&cardRect.right<=w&&cardRect.bottom<=h,`${label} pause card does not fit viewport`);
  assert(resume.h>=48&&menu.h>=48,`${label} pause action targets are too small`);
  const f0=await sim(cdp.evaluate);await sleep(300);await touchTap(cdp,cdp.evaluate,'bA');const f1=await sim(cdp.evaluate);assert(frozen(f0,f1),`${label} simulation advanced under touch input while paused`);
  await cdp.screenshot(`pause-${label}.png`);
  await touchTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);
  await touchTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);
  await touchTap(cdp,cdp.evaluate,'pauseMenu');
  await waitEval(cdp.evaluate,`__started()===false&&__paused()===false&&getComputedStyle(document.getElementById('start')).display==='flex'`,5000);
  await assertCleanPicker(cdp,label);
  result.viewports.push(label);result.actions.push(`${label}: touch pause/freeze/resume/menu + geometry`);
}
async function main(){
  try{rmSync(userData,{recursive:true,force:true});}catch(e){}
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={viewports:['1280x720'],levels:[],transients:[],actions:[]};
  try{
    let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}if(!ready)throw new Error('Chrome CDP did not become ready: '+chromeErr.slice(-1200));cdp=await openCDP();

    for(let i=0;i<6;i++)await verifyLevelLifecycle(cdp,i,result);
    result.actions.push('desktop Levels 1-6: start/active/pause/freeze/input-block/resume/pause/Main Menu/clean restart');
    await verifySpaceTransient(cdp,result);
    await verifyCamelTransient(cdp,result);
    await verifySledTransient(cdp,result);

    await verifyPhone(cdp,844,390,'844x390',result);
    await verifyPhone(cdp,390,844,'390x844',result);

    result.status='PASS';writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));console.log('PAUSE_MENU_BROWSER_VERIFY=PASS');console.log(JSON.stringify(result));
  }finally{
    if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}await sleep(200);try{rmSync(userData,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('browser cleanup warning: '+e.message);}
  }
}
main().catch(e=>{console.error('PAUSE_MENU_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});
