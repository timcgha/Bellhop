#!/usr/bin/env node
// Pause / Exit Level browser verification at desktop and supported phone layouts.
// Uses Node's built-in WebSocket + Chrome DevTools Protocol; no npm packages required.
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const {spawn}=require('child_process');
const http=require('http');

const root=join(__dirname,'..');
const outDir=join(root,'artifacts','browser-pause-exit-level');
mkdirSync(outDir,{recursive:true});
const chrome=process.env.CHROME_BIN||['/usr/local/bin/google-chrome','/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
const port=8798,cdpPort=9238,userData='/tmp/bellhop-pause-exit-chrome';
const base=`http://127.0.0.1:${port}/index.html`;
const cases=[
  {label:'desktop-1280x720',width:1280,height:720,mobile:false,touch:false},
  {label:'portrait-390x844',width:390,height:844,mobile:true,touch:true},
  {label:'landscape-844x390',width:844,height:390,mobile:true,touch:true}
];
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function getJSON(url){return new Promise((resolve,reject)=>{
  http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);
});}
function inside(r,w,h){return !!r&&r.left>=-1&&r.top>=-1&&r.right<=w+1&&r.bottom<=h+1&&r.width>0&&r.height>0;}
function overlaps(a,b){if(!a||!b)return false;return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}

async function openCDP(){
  const targets=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`);
  const page=targets.find(t=>t.type==='page')||targets[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page target');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',e=>reject(e.error||e),{once:true});
  });
  let id=0,currentErrors=null;const pending=new Map();
  ws.addEventListener('message',ev=>{
    const msg=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());
    if(msg.id&&pending.has(msg.id)){
      const p=pending.get(msg.id);pending.delete(msg.id);
      if(msg.error)p.reject(new Error(JSON.stringify(msg.error)));else p.resolve(msg.result);
      return;
    }
    if(!currentErrors)return;
    if(msg.method==='Runtime.exceptionThrown'){
      const e=msg.params.exceptionDetails;
      currentErrors.push(`exception: ${e.exception&&e.exception.description||e.text}`);
    }else if(msg.method==='Runtime.consoleAPICalled'&&msg.params.type==='error'){
      const text=(msg.params.args||[]).map(a=>a.value||a.description||'').join(' ');
      if(!/^Failed to load resource:/.test(text))currentErrors.push(`console: ${text}`);
    }else if(msg.method==='Network.responseReceived'){
      const r=msg.params.response;
      if(r.status>=400&&!/\/favicon\.ico(?:\?|$)/.test(r.url))currentErrors.push(`response: ${r.status} ${r.url}`);
    }else if(msg.method==='Network.loadingFailed'&&!msg.params.canceled){
      currentErrors.push(`request: ${msg.params.errorText}`);
    }
  });
  function send(method,params={}){
    const mid=++id;
    return new Promise((resolve,reject)=>{pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  }
  async function evaluate(expression){
    const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception&&r.exceptionDetails.exception.description||r.exceptionDetails.text);
    return r.result.value;
  }
  async function waitFor(expression,timeout=20000){
    const end=Date.now()+timeout;
    while(Date.now()<end){try{if(await evaluate(expression))return;}catch(e){}await sleep(50);}
    throw new Error(`Timed out waiting for: ${expression}`);
  }
  async function elementCenter(id){
    return evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  }
  async function clickElement(id,touch){
    const p=await elementCenter(id);if(!p)throw new Error(`missing #${id}`);
    if(touch){
      await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:2,radiusY:2,force:1,id:1}]});
      await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else{
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1,buttons:1});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1,buttons:0});
    }
  }
  async function escape(){
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
  }
  async function screenshot(path){
    const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});writeFileSync(path,Buffer.from(r.data,'base64'));
  }
  return {send,evaluate,waitFor,clickElement,escape,screenshot,setErrors(v){currentErrors=v;},close(){ws.close();}};
}

const rectExpression=`(()=>{
  const rect=id=>{const el=document.getElementById(id);if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=id=>{const el=document.getElementById(id);if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const card=document.querySelector('#pauseMenu .card'),cr=card&&card.getBoundingClientRect();
  return {
    pause:rect('pauseBtn'),hud:rect('hud'),mute:rect('mute'),a:rect('bA'),b:rect('bB'),y:rect('bY'),menu:rect('pauseMenu'),
    card:cr?{left:cr.left,top:cr.top,right:cr.right,bottom:cr.bottom,width:cr.width,height:cr.height}:null,
    resume:rect('resumeLevel'),exit:rect('exitLevel'),start:rect('start'),
    visible:{pause:visible('pauseBtn'),a:visible('bA'),b:visible('bB'),y:visible('bY'),menu:visible('pauseMenu'),resume:visible('resumeLevel'),exit:visible('exitLevel'),start:visible('start')}
  };
})()`;

async function verifyCase(cdp,cfg){
  const errors=[];cdp.setErrors(errors);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:cfg.width,height:cfg.height,deviceScaleFactor:cfg.mobile?2:1,mobile:cfg.mobile,screenWidth:cfg.width,screenHeight:cfg.height});
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:cfg.touch,maxTouchPoints:cfg.touch?5:1});
  await cdp.send('Page.navigate',{url:`${base}?verify=${cfg.label}`});
  await cdp.waitFor(`typeof window.__startGame==='function'&&typeof window.__pauseGame==='function'`);
  if(cfg.touch)await cdp.evaluate(`document.body.classList.add('touch')`);
  await cdp.evaluate(`window.__setPickerIdx(0);window.__startGame();true`);
  await cdp.waitFor(`window.__started&&window.__started()`);await sleep(250);
  const gameplay=await cdp.evaluate(rectExpression);
  await cdp.screenshot(join(outDir,`${cfg.label}-gameplay.png`));

  if(cfg.touch)await cdp.clickElement('pauseBtn',true);else await cdp.escape();
  await cdp.waitFor(`window.__paused&&window.__paused()`);await sleep(100);
  const before=await cdp.evaluate(`({time:window.__gameTime(),pos:{x:window.__P.pos.x,y:window.__P.pos.y,z:window.__P.pos.z}})`);
  await sleep(350);
  const after=await cdp.evaluate(`({time:window.__gameTime(),pos:{x:window.__P.pos.x,y:window.__P.pos.y,z:window.__P.pos.z}})`);
  const paused=await cdp.evaluate(rectExpression);
  await cdp.screenshot(join(outDir,`${cfg.label}-paused.png`));

  await cdp.clickElement('resumeLevel',cfg.touch);
  await cdp.waitFor(`window.__paused&&!window.__paused()`);
  const resumeStart=await cdp.evaluate(`window.__gameTime()`);await sleep(150);const resumeEnd=await cdp.evaluate(`window.__gameTime()`);

  if(cfg.touch)await cdp.clickElement('pauseBtn',true);else await cdp.escape();
  await cdp.waitFor(`window.__paused&&window.__paused()`);
  await cdp.clickElement('exitLevel',cfg.touch);
  await cdp.waitFor(`window.__started&&!window.__started()`);await sleep(100);
  const exited=await cdp.evaluate(rectExpression);
  const exitState=await cdp.evaluate(`({started:window.__started(),paused:window.__paused(),won:window.__W.won,level:window.__LEVEL()})`);
  await cdp.screenshot(join(outDir,`${cfg.label}-after-exit.png`));

  const touchControlRects=[gameplay.a,gameplay.b,gameplay.y];
  const checks={
    GAMEPLAY_STARTED:true,
    TOUCH_PAUSE_VISIBLE:cfg.touch?gameplay.visible.pause:!gameplay.visible.pause,
    PAUSE_CLEAR_OF_HUD:cfg.touch?!overlaps(gameplay.pause,gameplay.hud):true,
    PAUSE_CLEAR_OF_MUTE:cfg.touch?!overlaps(gameplay.pause,gameplay.mute):true,
    PAUSE_CLEAR_OF_ABY:cfg.touch?touchControlRects.every(r=>!overlaps(gameplay.pause,r)):true,
    PAUSE_BUTTON_IN_VIEWPORT:cfg.touch?inside(gameplay.pause,cfg.width,cfg.height):true,
    PAUSE_MENU_VISIBLE:paused.visible.menu&&paused.visible.resume&&paused.visible.exit,
    PAUSE_CARD_IN_VIEWPORT:inside(paused.card,cfg.width,cfg.height),
    PAUSE_ACTIONS_IN_VIEWPORT:inside(paused.resume,cfg.width,cfg.height)&&inside(paused.exit,cfg.width,cfg.height),
    GAMEPLAY_CONTROLS_HIDDEN_WHILE_PAUSED:!paused.visible.pause&&!paused.visible.a&&!paused.visible.b&&!paused.visible.y,
    SIMULATION_FROZEN:after.time===before.time&&after.pos.x===before.pos.x&&after.pos.y===before.pos.y&&after.pos.z===before.pos.z,
    RESUME_ADVANCES_SIMULATION:resumeEnd>resumeStart,
    EXIT_RETURNS_TO_PICKER:!exitState.started&&!exitState.paused&&!exitState.won&&exitState.level===null&&exited.visible.start,
    NO_GAMEPLAY_CONTROLS_AFTER_EXIT:!exited.visible.pause&&!exited.visible.a&&!exited.visible.b&&!exited.visible.y,
    NO_PAGE_ERRORS:errors.length===0
  };
  return {viewport:{width:cfg.width,height:cfg.height,mobile:cfg.mobile,touch:cfg.touch},gameplay,paused,exited,exitState,errors,checks};
}

async function main(){
  if(!chrome)throw new Error('Chrome/Chromium not found; set CHROME_BIN');
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
  const chromeProc=spawn(chrome,[
    `--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--headless=new','--no-first-run','--no-default-browser-check',
    '--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl',
    '--ignore-certificate-errors','--no-sandbox','--disable-setuid-sandbox','about:blank'
  ],{stdio:'ignore'});
  let cdp;
  try{
    let ready=false;for(let i=0;i<60;i++){try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}
    if(!ready)throw new Error('Chrome CDP not ready');
    cdp=await openCDP();
    await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
    const report={};
    for(const cfg of cases)report[cfg.label]=await verifyCase(cdp,cfg);
    const failed=[];
    for(const [label,result] of Object.entries(report))for(const [name,pass] of Object.entries(result.checks))if(!pass)failed.push(`${label}:${name}`);
    report.summary={viewports:cases.length,checks:cases.length*Object.keys(report[cases[0].label].checks).length,failed};
    writeFileSync(join(outDir,'report.json'),JSON.stringify(report,null,2));
    for(const [label,result] of Object.entries(report)){
      if(label==='summary')continue;console.log(label);
      for(const [name,pass] of Object.entries(result.checks))console.log(`  ${pass?'PASS':'FAIL'} ${name}`);
    }
    console.log(`\n${report.summary.checks-failed.length} passed, ${failed.length} failed, ${cases.length} viewports`);
    if(failed.length)process.exitCode=1;
  }finally{
    if(cdp)cdp.close();chromeProc.kill();server.kill();rmSync(userData,{recursive:true,force:true});
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
