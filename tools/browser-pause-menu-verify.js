#!/usr/bin/env node
// v58 pause/menu real-browser acceptance. Uses real picker, keyboard, mouse, and
// touch input. Runtime hooks are read-only; this verifier never mutates pause,
// player position, game time, started state, progression, or win state.
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
  await waitEval(cdp.evaluate,`typeof __started==='function'&&typeof __paused==='function'&&typeof __gameTime==='function'&&document.getElementById('pauseBtn')`,15000);
}
const keys={Space:[' ',32],KeyD:['d',68],ArrowRight:['ArrowRight',39],Escape:['Escape',27],KeyP:['p',80]};
async function key(cdp,code,down){const [k,vk]=keys[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:down&&k.length===1?k:undefined,unmodifiedText:down&&k.length===1?k:undefined});}
async function tapKey(cdp,code,ms=70){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(80);}
async function holdKey(cdp,code,ms){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(100);}
async function rect(ev,id){return ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height,display:s.display,visibility:s.visibility};})()`);}
function overlaps(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
async function mouseTap(cdp,ev,id){const r=await rect(ev,id);assert(r.display!=='none'&&r.w>0&&r.h>0,`#${id} not tappable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await sleep(100);}
async function touchTap(cdp,ev,id){const r=await rect(ev,id);assert(r.display!=='none'&&r.w>0&&r.h>0,`#${id} not touchable`);const x=r.left+r.w/2,y=r.top+r.h/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:4,radiusY:4,force:1,id:1}]});await sleep(45);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(110);}
async function pickerToKeyboard(cdp,index){assert(await cdp.evaluate(`__started()===false`),'picker expected');for(let i=0;i<index;i++)await tapKey(cdp,'ArrowRight',45);await tapKey(cdp,'Space',70);}
async function startTouchLevel(cdp,index){for(let i=0;i<index;i++)await touchTap(cdp,cdp.evaluate,'lvl'+index);await touchTap(cdp,cdp.evaluate,'lvl'+index);await touchTap(cdp,cdp.evaluate,'lvl'+index);}
async function sim(ev){return ev(`(()=>({started:__started(),paused:__paused(),time:__gameTime(),x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,level:__LEVEL()&&__LEVEL().id,overlay:getComputedStyle(document.getElementById('pauseOverlay')).display,picker:getComputedStyle(document.getElementById('start')).display}))()`);}
function moved(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function frozen(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-6&&Math.abs(a.time-b.time)<1e-9;}
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
  const card=await rect(cdp.evaluate,'pauseOverlay .pause-card').catch(()=>null);
  const resume=await rect(cdp.evaluate,'pauseResume'),menu=await rect(cdp.evaluate,'pauseMenu');
  const cardRect=await cdp.evaluate(`(()=>{const r=document.querySelector('#pauseOverlay .pause-card').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height};})()`);
  assert(cardRect.left>=0&&cardRect.top>=0&&cardRect.right<=w&&cardRect.bottom<=h,`${label} pause card does not fit viewport`);
  assert(resume.h>=48&&menu.h>=48,`${label} pause action targets are too small`);
  await cdp.screenshot(`pause-${label}.png`);
  await touchTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);
  await touchTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);
  await touchTap(cdp,cdp.evaluate,'pauseMenu');
  await waitEval(cdp.evaluate,`__started()===false&&__paused()===false&&getComputedStyle(document.getElementById('start')).display==='flex'`,5000);
  const hidden=await cdp.evaluate(`['bA','bB','bY'].every(id=>getComputedStyle(document.getElementById(id)).display==='none')`);
  assert(hidden,`${label} gameplay touch controls visible on picker after Main Menu`);
  result.viewports.push(label);result.actions.push(`${label}: touch pause/resume/menu`);
}
async function main(){
  try{rmSync(userData,{recursive:true,force:true});}catch(e){}
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={viewports:[],actions:[]};
  try{
    let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}if(!ready)throw new Error('Chrome CDP did not become ready: '+chromeErr.slice(-1200));cdp=await openCDP();

    await fresh(cdp,1280,720,false);result.viewports.push('1280x720');
    await pickerToKeyboard(cdp,0);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level1'`,6000);
    const d0=await sim(cdp.evaluate);await holdKey(cdp,'KeyD',550);const d1=await sim(cdp.evaluate);assert(moved(d0,d1)>0.3,'desktop movement did not work before pause');result.actions.push('desktop movement');
    await tapKey(cdp,'Escape');await waitEval(cdp.evaluate,`__paused()===true`,3000);
    const f0=await sim(cdp.evaluate);await sleep(700);await holdKey(cdp,'KeyD',450);const f1=await sim(cdp.evaluate);assert(frozen(f0,f1),`desktop simulation advanced while paused: ${JSON.stringify({before:f0,after:f1})}`);result.actions.push('desktop true freeze + blocked movement');await cdp.screenshot('pause-desktop.png');
    await mouseTap(cdp,cdp.evaluate,'pauseResume');await waitEval(cdp.evaluate,`__paused()===false`,3000);const r0=await sim(cdp.evaluate);await holdKey(cdp,'KeyD',450);const r1=await sim(cdp.evaluate);assert(moved(r0,r1)>0.2,'desktop movement did not resume after Resume');result.actions.push('desktop resume');
    await mouseTap(cdp,cdp.evaluate,'pauseBtn');await waitEval(cdp.evaluate,`__paused()===true`,3000);await mouseTap(cdp,cdp.evaluate,'pauseMenu');await waitEval(cdp.evaluate,`__started()===false&&__paused()===false`,4000);
    assert(await cdp.evaluate(`getComputedStyle(document.getElementById('start')).display==='flex'`),'desktop picker not visible after Main Menu');
    await pickerToKeyboard(cdp,1);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level2'`,7000);result.actions.push('desktop Main Menu -> picker -> start another level');

    await verifyPhone(cdp,844,390,'844x390',result);
    await verifyPhone(cdp,390,844,'390x844',result);

    result.status='PASS';writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));console.log('PAUSE_MENU_BROWSER_VERIFY=PASS');console.log(JSON.stringify(result));
  }finally{
    if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}await sleep(200);try{rmSync(userData,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('browser cleanup warning: '+e.message);}
  }
}
main().catch(e=>{console.error('PAUSE_MENU_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});