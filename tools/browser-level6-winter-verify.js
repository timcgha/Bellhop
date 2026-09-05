#!/usr/bin/env node
// Level 6 Snowbound real-browser acceptance. Uses the real picker, keyboard actions,
// normal Snoozle progression, cooldown combat, spin combat, steerable sled and victory flow.
// It does not teleport Pling or directly mutate combat/progression/win state.
const {spawn}=require('child_process');
const {mkdirSync,writeFileSync,existsSync,rmSync}=require('fs');
const {join}=require('path');
const http=require('http');

const outDir=join(__dirname,'..','artifacts','browser-level6-winter');mkdirSync(outDir,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const port=8796,cdpPort=9236,userData=`/tmp/bellhop-level6-winter-${process.pid}`,base=`http://127.0.0.1:${port}/index.html`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(c,m){if(!c)throw new Error(m);}
function getJSON(url){return new Promise((resolve,reject)=>{http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);});}
async function openCDP(){
  const pages=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`),page=pages.find(x=>x.type==='page')||pages[0];if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',e=>rej(e.error||e),{once:true});});
  let id=0;const pending=new Map();ws.addEventListener('message',ev=>{const m=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;};
  const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(outDir,name),Buffer.from(r.data,'base64'));};
  await send('Page.enable');await send('Runtime.enable');return {send,evaluate,screenshot,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(ev,expr,ms=20000){const t=Date.now();while(Date.now()-t<ms){try{if(await ev(expr))return true;}catch(e){}await sleep(100);}throw new Error('timeout: '+expr);}
async function viewport(cdp,w,h){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<=844,screenWidth:w,screenHeight:h});await sleep(180);}
const keys={Space:[' ',32],KeyW:['w',87],KeyA:['a',65],KeyS:['s',83],KeyD:['d',68],KeyJ:['j',74],KeyK:['k',75]};
async function key(cdp,code,down){const [key,vk]=keys[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key,code,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:down?key:undefined,unmodifiedText:down?key:undefined});}
async function tap(cdp,code,ms=65){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(90);}
async function hold(cdp,codes,ms){for(const c of codes)await key(cdp,c,true);await sleep(ms);for(const c of [...codes].reverse())await key(cdp,c,false);await sleep(35);}
async function cameraForward(ev){await ev(`(()=>{__CAM.yaw=0;__CAM.lastManual=1e9;return true;})()`);}
async function state(ev){return ev(`(()=>({x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,grounded:!!__P.grounded,dead:!!__P.dead,won:!!__W.won,sled:!!__P.sled,sledPhase:__WINTER.sled&&__WINTER.sled.phase,awake:__W.snoozles.filter(s=>s.state!=='sleep').length}))()`);}
async function driveTo(cdp,ev,tx,tz,label,timeout=45000){
  const start=Date.now();let last=null,stuck=0,loops=0;
  while(Date.now()-start<timeout){await cameraForward(ev);const s=await state(ev);if(s.won)return s;if(s.dead){await sleep(450);continue;}const dx=tx-s.x,dz=tz-s.z;if(Math.hypot(dx,dz)<1.0)return s;
    const codes=[];if(Math.abs(dx)>0.65)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>0.65)codes.push(dz>0?'KeyS':'KeyW');if(!codes.length)return s;
    await hold(cdp,codes,190);const n=await state(ev);if(last&&Math.hypot(n.x-last.x,n.z-last.z)<0.04)stuck++;else stuck=0;last=n;
    if(stuck>=5){await tap(cdp,'Space',55);stuck=0;}if(++loops%28===0)await sleep(160);
  }
  const s=await state(ev);throw new Error(`drive timeout ${label}: ${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)} -> ${tx},${tz}`);
}
async function wakeSnoozle(cdp,ev,idx,label){
  const q=await ev(`(()=>{const s=__W.snoozles[${idx}];return {x:s.g.position.x,z:s.g.position.z};})()`);await driveTo(cdp,ev,q.x,q.z,label);const before=await ev(`__W.snoozles.filter(s=>s.state!=='sleep').length`);await tap(cdp,'KeyK',70);await waitEval(ev,`__W.snoozles[${idx}].state!=='sleep'`,3500);const after=await ev(`__W.snoozles.filter(s=>s.state!=='sleep').length`);assert(after===before+1,label+' wake count');return {idx,before,after};
}
async function exerciseSnowballCooldown(cdp,ev){
  await cameraForward(ev);const startCount=await ev('__WINTER.snowballs.length'),burst0=await ev('__WINTER.state.bursts');
  await tap(cdp,'KeyJ',70);await sleep(100);assert((await ev('__WINTER.snowballs.length'))===startCount+1,'first snowball shot missing');assert((await ev('__WINTER.snowballs.filter(s=>s.alive).length'))>=1,'first snowball is not live');
  const afterFirst=await ev('__WINTER.snowballs.length');await tap(cdp,'KeyJ',70);await sleep(120);assert((await ev('__WINTER.snowballs.length'))===afterFirst,'premature snowball bypassed cooldown');
  await waitEval(ev,'__WINTER.cooldownRemaining()<=0.01',1800);assert(await ev('__WINTER.snowballs.some(s=>s.alive)'),'first snowball did not remain alive through cooldown');
  await tap(cdp,'KeyJ',70);await sleep(120);assert((await ev('__WINTER.snowballs.length'))===afterFirst+1,'post-cooldown snowball did not fire');assert((await ev('__WINTER.snowballs.filter(s=>s.alive).length'))>=2,'post-cooldown shot did not coexist with first live snowball');
  await waitEval(ev,`__WINTER.state.bursts>${burst0}`,3500);return {startCount,afterFirst,afterSecond:await ev('__WINTER.snowballs.length'),burstCount:await ev('__WINTER.state.bursts')};
}
async function exerciseSnowman(cdp,ev){
  const home=await ev(`(()=>{const e=__WINTER.snowmen[0];return {x:e.x,z:e.z};})()`);await driveTo(cdp,ev,home.x,home.z+6.2,'snowman pursuit approach');
  const before=await ev(`(()=>{const e=__WINTER.snowmen[0];return {x:e.x,z:e.z,d:Math.hypot(e.x-__P.pos.x,e.z-__P.pos.z)};})()`);await hold(cdp,['KeyA'],220);await sleep(650);
  const after=await ev(`(()=>{const e=__WINTER.snowmen[0];return {x:e.x,z:e.z,d:Math.hypot(e.x-__P.pos.x,e.z-__P.pos.z),chasing:!!e.chasing};})()`);const travel=Math.hypot(after.x-before.x,after.z-before.z);assert(after.chasing&&travel>1.0,'snowman pursuit did not materially move toward active player');
  let spun=false;for(let i=0;i<4&&!spun;i++){const q=await ev(`(()=>{const e=__WINTER.snowmen[0];return {x:e.x,z:e.z,hp:e.hp};})()`);await driveTo(cdp,ev,q.x,q.z+1.55,'snowman spin approach '+i,12000);await tap(cdp,'KeyK',70);await sleep(180);spun=(await ev('__WINTER.snowmen[0].hp'))===1;}
  assert(spun,'genuine spin attack did not damage snowman');
  await waitEval(ev,'__WINTER.cooldownRemaining()<=0.01',2500);await cameraForward(ev);await tap(cdp,'KeyJ',70);await waitEval(ev,'__WINTER.snowmen[0].alive===false',4500);assert((await ev('__WINTER.snowmen[0].defeatedBy'))==='snowball','snowball did not finish spin-damaged snowman');
  return {pursuitTravel:travel,spinHp:1,defeated:true};
}
async function main(){
  rmSync(userData,{recursive:true,force:true});
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..','dist'),stdio:'ignore'});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${cdpPort}`,`--user-data-dir=${userData}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-12000));
  let cdp;const result={viewports:[],route:[]};
  try{
    let ready=false;for(let i=0;i<75;i++){if(cp.exitCode!==null)throw new Error(`Chrome exited ${cp.exitCode}: ${chromeErr}`);try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}if(!ready)throw new Error('Chrome CDP did not become ready');
    cdp=await openCDP();await cdp.send('Page.navigate',{url:base});await waitEval(cdp.evaluate,`document.readyState==='complete'`,20000);await waitEval(cdp.evaluate,`typeof __setPickerIdx==='function'&&document.getElementById('lvl5')`,20000);
    await viewport(cdp,1280,720);result.viewports.push('1280x720');await cdp.screenshot('01-picker-desktop.png');
    const card=await cdp.evaluate(`(()=>{const e=document.getElementById('lvl5'),r=e.getBoundingClientRect();return {label:e.textContent.trim(),visible:r.width>0&&r.height>0};})()`);assert(card.visible&&/Snowbound/.test(card.label),'Snowbound picker card not visible');
    await cdp.evaluate(`__setPickerIdx(5)`);await tap(cdp,'Space',80);await waitEval(cdp.evaluate,`__started()&&__LEVEL().id==='level6'&&__isWinter()`,6000);
    assert(await cdp.evaluate(`__WINTER.snowTrees.length===20&&__WINTER.snowmen.length===4`),'winter scene population mismatch');assert(await cdp.evaluate(`__WINTER.reindeer.length===6&&__WINTER.reindeer.filter(r=>r.redNosed).length===1`),'reindeer/red-nose population mismatch');
    await cdp.screenshot('02-winter-load-desktop.png');

    await driveTo(cdp,cdp.evaluate,0,8,'snowball power');await waitEval(cdp.evaluate,'__WINTER.state.snowballUnlocked===true',3000);result.route.push('snowball-power');
    result.cooldown=await exerciseSnowballCooldown(cdp,cdp.evaluate);result.route.push('snowball-cooldown-overlap');result.route.push('snowball-burst');
    result.combat=await exerciseSnowman(cdp,cdp.evaluate);result.route.push('snowman-pursuit');result.route.push('snowman-spin-hit');result.route.push('snowman-snowball-finish');

    await wakeSnoozle(cdp,cdp.evaluate,0,'snoozle 1');result.route.push('snoozle-1');
    await wakeSnoozle(cdp,cdp.evaluate,1,'snoozle 2');result.route.push('snoozle-2');
    await wakeSnoozle(cdp,cdp.evaluate,2,'hilltop snoozle');result.route.push('hilltop-snoozle');

    await driveTo(cdp,cdp.evaluate,0,-182.5,'sled top');await waitEval(cdp.evaluate,'__P.pos.y>5.2',5000);await tap(cdp,'Space',70);await waitEval(cdp.evaluate,'!!__P.sled&&__WINTER.sled.phase===\'sliding\'',3500);result.route.push('sled-entry');
    await waitEval(cdp.evaluate,'__WINTER.sled.progress>0.15',4000);await viewport(cdp,844,390);result.viewports.push('844x390');
    const sx0=await cdp.evaluate('__WINTER.sled.x');await hold(cdp,['KeyA'],700);const sxL=await cdp.evaluate('__WINTER.sled.x');assert(sxL<sx0-0.35,'live sled did not steer left');result.route.push('sled-steer-left');
    await hold(cdp,['KeyD'],1400);const steer=await cdp.evaluate('({x:__WINTER.sled.x,limit:__WINTER.sled.steerLimit,phase:__WINTER.sled.phase})');assert(steer.x>sxL+0.7,'live sled did not steer right');assert(Math.abs(steer.x)<=steer.limit+0.05,'sled steering escaped authored slope bounds');result.route.push('sled-steer-right');
    const deer=await cdp.evaluate(`(()=>{const r=__WINTER.reindeer.find(r=>r.redNosed);return {visible:r.g.visible!==false,d:Math.hypot(__P.pos.x-r.g.position.x,__P.pos.z-r.g.position.z)};})()`);assert(deer.visible&&deer.d<28,'red-nosed reindeer not visibly near sled route');await cdp.screenshot('03-steerable-sled-844x390.png');
    await waitEval(cdp.evaluate,'__WINTER.sled.phase===\'bottom\'&&__WINTER.sled.completed',7000);await tap(cdp,'KeyJ',70);await waitEval(cdp.evaluate,'!__P.sled',2500);result.route.push('sled-exit');

    await wakeSnoozle(cdp,cdp.evaluate,3,'snoozle 4');await wakeSnoozle(cdp,cdp.evaluate,4,'snoozle 5');result.route.push('all-snoozles');assert(await cdp.evaluate(`__W.snoozles.every(s=>s.state!=='sleep')&&__WINTER.winterReady()`),'all-Snoozles finish predicate not ready');
    await driveTo(cdp,cdp.evaluate,0,-456,'decorated Christmas tree approach');const decor=await cdp.evaluate(`(()=>{const t=__WINTER.tree;return {lights:t.lights.length,bright:!!t.brightLights,ornaments:t.ornaments.length,garlands:t.garlands.length,presents:t.presents.length,star:!!t.star};})()`);assert(decor.star&&decor.bright&&decor.lights>=42&&decor.ornaments>=20&&decor.garlands>=3&&decor.presents>=6,'polished Christmas-tree decorations/presents incomplete');await cdp.screenshot('04-decorated-finale-844x390.png');result.route.push('decorated-tree');
    await driveTo(cdp,cdp.evaluate,0,-462.5,'Christmas tree finale');await waitEval(cdp.evaluate,'__W.won===true',5000);assert(await cdp.evaluate('__WINTER.tree.party'),'Christmas-tree victory celebration did not activate');result.route.push('victory');

    await viewport(cdp,390,844);result.viewports.push('390x844');await cdp.screenshot('05-victory-phone-390x844.png');
    await sleep(3800);await tap(cdp,'Space',70);await waitEval(cdp.evaluate,'!__started()&&document.getElementById(\'start\').style.display!==\'none\'',4000);await cdp.screenshot('06-return-picker-phone.png');result.route.push('picker-return');
    await tap(cdp,'Space',80);await waitEval(cdp.evaluate,"__started()&&__LEVEL().id==='level6'&&__WINTER.sled.phase==='top'",5000);result.route.push('restart');

    result.redNosedCount=await cdp.evaluate('__WINTER.reindeer.filter(r=>r.redNosed).length');result.awakeBeforeRestart=5;result.decor=decor;result.sled={left:sxL,right:steer.x,limit:steer.limit};result.status='PASS';writeFileSync(join(outDir,'result.json'),JSON.stringify(result,null,2));console.log('LEVEL6_BROWSER_VERIFY=PASS');console.log(JSON.stringify(result));
  }finally{if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}try{server.kill('SIGKILL');}catch(e){}rmSync(userData,{recursive:true,force:true});}
}
main().catch(e=>{console.error('LEVEL6_BROWSER_VERIFY=FAIL');console.error(e&&e.stack||e);process.exit(1);});
