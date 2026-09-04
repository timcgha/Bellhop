#!/usr/bin/env node
// Level 4 iPhone playtest polish — browser verification (CDP / software WebGL).
const { spawn } = require('child_process');
const { mkdirSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const http = require('http');

const outDir = join(__dirname, '..', 'artifacts', 'browser-level4-iphone-polish');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8797;
const cdpPort = 9237;
const userData = '/tmp/level4-iphone-polish-chrome';
const base = `http://127.0.0.1:${port}/index.html`;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function getJSON(url){return new Promise((resolve,reject)=>{
  http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);
});}

async function openCDP(){
  const targets=await getJSON(`http://127.0.0.1:${cdpPort}/json/list`);
  const page=targets.find(t=>t.type==='page')||targets[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{
    ws.addEventListener('open',()=>res(),{once:true});
    ws.addEventListener('error',(e)=>rej(e.error||e),{once:true});
  });
  let id=0;const pending=new Map();
  ws.addEventListener('message',ev=>{
    const msg=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());
    if(msg.id&&pending.has(msg.id)){
      const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);
      if(msg.error)reject(new Error(JSON.stringify(msg.error)));else resolve(msg.result);
    }
  });
  function send(method,params={}){
    const mid=++id;
    return new Promise((resolve,reject)=>{
      pending.set(mid,{resolve,reject});
      ws.send(JSON.stringify({id:mid,method,params}));
    });
  }
  async function evaluate(expression){
    const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));
    return r.result&&r.result.value;
  }
  async function screenshot(path){
    const r=await send('Page.captureScreenshot',{format:'png'});
    require('fs').writeFileSync(path,Buffer.from(r.data,'base64'));
  }
  await send('Page.enable');
  await send('Runtime.enable');
  return {send,evaluate,screenshot,ws,close:()=>{try{ws.close();}catch(e){}}};
}

async function waitEval(evaluate, expr, timeoutMs=20000){
  const t0=Date.now();
  while(Date.now()-t0<timeoutMs){
    try{if(await evaluate(expr))return true;}catch(e){}
    await sleep(150);
  }
  throw new Error('timeout waiting for '+expr);
}

async function frames(evaluate,n){
  await evaluate(`(()=>new Promise(r=>{let i=0;const N=${n|0};(function t(){i=i+1;if(i>N)return r(true);requestAnimationFrame(t);})();}))()`);
}

async function holdCam(evaluate, px,py,pz, lx,ly,lz){
  const args=JSON.stringify([px,py,pz,lx,ly,lz].map(Number));
  await evaluate(`(()=>{
    const [px,py,pz,lx,ly,lz]=${args};
    const CAM=window.__CAM;
    CAM.mode='shot';
    CAM.pos.set(px,py,pz);
    CAM.look.set(lx,ly,lz);
    CAM.yaw=Math.atan2(lx-px,lz-pz);
    CAM.pitch=0.12;CAM.shake=0;CAM.fovKick=0;
    return true;
  })()`);
}

async function bootLevel(cdp,label,width,height){
  const {send,evaluate}=cdp;
  await send('Emulation.setDeviceMetricsOverride',{
    width,height,deviceScaleFactor:1,mobile:width<=844,screenWidth:width,screenHeight:height
  });
  await send('Emulation.setTouchEmulationEnabled',{enabled:height>width});
  await send('Page.navigate',{url:base+'?iphone='+label});
  await waitEval(evaluate,`typeof window.__setPickerIdx==='function'`);
  await evaluate(`window.__setPickerIdx(3)`);
  await sleep(120);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}))`);
  await sleep(60);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',key:' ',bubbles:true}))`);
  await waitEval(evaluate,`!!(window.__started&&window.__started())`);
  await sleep(300);
  await frames(evaluate,18);
}

async function measureWin(evaluate){
  return evaluate(`(()=>{
    const win=document.getElementById('win');
    const big=win&&win.querySelector('.big');
    const sm=win&&win.querySelector('.sm');
    const hint=document.getElementById('hint');
    if(!win||!big)return {ok:false};
    const wr=win.getBoundingClientRect();
    const br=big.getBoundingClientRect();
    const sr=sm?sm.getBoundingClientRect():null;
    const text=big.textContent.replace(/\\s+/g,' ').trim();
    const cs=getComputedStyle(big);
    return {
      ok:true,
      title:text,
      subtitle:sm?sm.textContent:'',
      hint:hint?hint.textContent:'',
      winW:wr.width,winH:wr.height,
      big:{left:br.left,right:br.right,top:br.top,bottom:br.bottom,width:br.width,height:br.height},
      sm:sr?{left:sr.left,right:sr.right,top:sr.top,bottom:sr.bottom,width:sr.width}:null,
      fontSize:cs.fontSize,
      overflowX:document.documentElement.scrollWidth<=window.innerWidth+1,
      firstLetterVisible:br.left>=-1,
      lastLetterVisible:br.right<=window.innerWidth+1,
      centered:Math.abs((br.left+br.right)/2-window.innerWidth/2)<24,
      vw:window.innerWidth,vh:window.innerHeight
    };
  })()`);
}

async function runViewport(cdp, label, width, height){
  const {evaluate,screenshot}=cdp;
  await bootLevel(cdp,label,width,height);
  const results={label,width,height};

  // A) Candy / earlier Space — giant wall must NOT fill distant sky
  const candy=await evaluate(`(()=>{
    try{
      const S=window.__SPACE,P=window.__P,cp=S&&S.candyPlanet;
      if(!S||!cp)return {err:'no space/candy',hasS:!!S,level:window.__LEVEL&&window.__LEVEL().id};
      const tut=S.saucers.find(s=>s.targetDummy);
      const mid=S.saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
      const gate=S.shieldedGates[0];
      if(!tut||!mid||!gate)return {err:'missing entities',tut:!!tut,mid:!!mid,gate:!!gate,saucers:S.saucers.length};
      const padTop=cp.pad.y+0.55;
      P.pos.set(cp.pad.x-1.2,padTop,cp.pad.z+2.8);P.vel.set(0,0,0);P.grounded=true;P.moveZone='grounded';
      return {padTop,pad:{x:cp.pad.x,y:cp.pad.y,z:cp.pad.z},tut:{x:tut.x,y:tut.y,z:tut.z,alive:tut.alive,hp:tut.hp,clear:tut.y-padTop},
        mid:{x:mid.x,y:mid.y,z:mid.z},gate:{x:gate.x,y:gate.y,z:gate.z,h:gate.h}};
    }catch(e){return {err:String(e&&e.message||e)};}
  })()`);
  if(candy.err)throw new Error('candy setup: '+JSON.stringify(candy));
  await frames(evaluate,8);
  const farReveal=await evaluate(`(()=>{
    const g=window.__SPACE.shieldedGates[0],r=g.reveal,P=window.__P;
    return {rockAlpha:r.rockAlpha,shieldAlpha:r.shieldAlpha,dist:r.dist,px:P.pos.x,py:P.pos.y,pz:P.pos.z};
  })()`);
  results.farReveal=farReveal;
  await holdCam(evaluate,
    candy.pad.x-2.5, candy.padTop+2.8, candy.pad.z+7.5,
    candy.mid.x, candy.mid.y+0.4, candy.mid.z-8
  );
  await frames(evaluate,10);
  await screenshot(join(outDir,`${label}-A-candy-open-sky.png`));

  // Attack tutorial alien
  const kill=await evaluate(`(()=>{
    const S=window.__SPACE,P=window.__P,cp=S.candyPlanet,tut=S.saucers.find(s=>s.targetDummy);
    P.hasStarBeam=true;P.pos.set(tut.x,cp.pad.y+0.55,tut.z+2.5);P.grounded=true;
    P.yaw=Math.atan2(tut.x-P.pos.x,tut.z-P.pos.z);
    S.fireStarBeam(Math.sin(P.yaw),Math.cos(P.yaw),P.pos.x,P.pos.y+0.85,P.pos.z);
    return {x:tut.x,y:tut.y,z:tut.z,hp0:tut.hp};
  })()`);
  await frames(evaluate,45);
  results.tutorialKill=await evaluate(`(()=>{
    const tut=window.__SPACE.saucers.find(s=>s.targetDummy);
    return {alive:tut.alive,state:tut.state,hp:tut.hp,visible:tut.g&&tut.g.visible};
  })()`);
  await holdCam(evaluate, kill.x-1.5, kill.y+1.8, kill.z+4.5, kill.x, kill.y, kill.z);
  await frames(evaluate,8);
  await screenshot(join(outDir,`${label}-A2-tutorial-alien-dead.png`));

  // B) medium gate approach
  const gate=candy.gate;
  results.midReveal=await evaluate(`(()=>{
    const P=window.__P,S=window.__SPACE,g=S.shieldedGates[0];
    P.pos.set(g.x,g.y+g.h*0.45,g.z+34);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';
    const cy=g.y+g.h*0.45;
    const dist=Math.hypot(P.pos.x-g.x,P.pos.y-cy,P.pos.z-g.z);
    const rockA=S.gateRevealAlpha(dist,S.GATE_REVEAL.rockFar,S.GATE_REVEAL.rockNear);
    const shieldA=S.gateRevealAlpha(dist,S.GATE_REVEAL.shieldFar,S.GATE_REVEAL.shieldNear);
    g.reveal.rockAlpha=rockA;g.reveal.shieldAlpha=shieldA;g.reveal.dist=dist;
    // Apply visuals now so the screenshot matches the reveal state
    for(const b of g.barriers){if(b.mesh){b.mesh.visible=rockA>0.02;if(b.mesh.material){b.mesh.material.opacity=rockA;b.mesh.material.transparent=true;}}}
    if(g.rockMeshes)for(const m of g.rockMeshes){m.visible=rockA>0.02;if(m.material){m.material.opacity=rockA;m.material.transparent=true;}}
    if(g.g&&!g.opened){g.g.visible=shieldA>0.02;}
    return {rockAlpha:rockA,shieldAlpha:shieldA,dist,px:P.pos.x,py:P.pos.y,pz:P.pos.z};
  })()`);
  await holdCam(evaluate, gate.x, gate.y+gate.h*0.6, gate.z+34, gate.x, gate.y+gate.h*0.4, gate.z);
  await frames(evaluate,10);
  await screenshot(join(outDir,`${label}-B-gate-mid.png`));

  // C) close gate
  results.nearReveal=await evaluate(`(()=>{
    const P=window.__P,S=window.__SPACE,g=S.shieldedGates[0];
    P.pos.set(g.x,g.y+g.h*0.45,g.z+12);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';
    const cy=g.y+g.h*0.45;
    const dist=Math.hypot(P.pos.x-g.x,P.pos.y-cy,P.pos.z-g.z);
    const rockA=S.gateRevealAlpha(dist,S.GATE_REVEAL.rockFar,S.GATE_REVEAL.rockNear);
    const shieldA=S.gateRevealAlpha(dist,S.GATE_REVEAL.shieldFar,S.GATE_REVEAL.shieldNear);
    g.reveal.rockAlpha=rockA;g.reveal.shieldAlpha=shieldA;g.reveal.dist=dist;
    for(const b of g.barriers){if(b.mesh){b.mesh.visible=rockA>0.02;if(b.mesh.material){b.mesh.material.opacity=rockA;b.mesh.material.transparent=true;}}}
    if(g.rockMeshes)for(const m of g.rockMeshes){m.visible=rockA>0.02;if(m.material){m.material.opacity=rockA;m.material.transparent=true;}}
    if(g.g&&!g.opened){g.g.visible=shieldA>0.02;}
    return {rockAlpha:rockA,shieldAlpha:shieldA,dist,px:P.pos.x,py:P.pos.y,pz:P.pos.z};
  })()`);
  await holdCam(evaluate, gate.x, gate.y+gate.h*0.55, gate.z+14, gate.x, gate.y+gate.h*0.4, gate.z);
  await frames(evaluate,10);
  await screenshot(join(outDir,`${label}-C-gate-close.png`));

  // D) opened gate
  await evaluate(`(()=>{
    const g=window.__SPACE.shieldedGates[0];
    if(!g.opened){
      g.opened=true;g.openT=0.95;
      if(g.g)g.g.visible=false;
      if(g.solid){const idx=window.__W.solids.indexOf(g.solid);if(idx>=0)window.__W.solids.splice(idx,1);g.solid=null;}
    }
    const P=window.__P;P.pos.set(g.x,g.y+g.h*0.45,g.z+10);
    return true;
  })()`);
  await frames(evaluate,6);
  await holdCam(evaluate, gate.x, gate.y+gate.h*0.55, gate.z+14, gate.x, gate.y+gate.h*0.3, gate.z-8);
  await frames(evaluate,10);
  await screenshot(join(outDir,`${label}-D-gate-open.png`));

  // Victory screen
  await evaluate(`(()=>{
    // Apply Level 4 win message and show banner without needing full warp
    if(window.__W&&window.__W.FINISH){
      const sm=document.querySelector('#win .sm');
      if(sm)sm.textContent=window.__W.FINISH.winMsg;
    }
    const w=document.getElementById('win');
    w.style.display='flex';w.style.opacity='1';
    const hint=document.getElementById('hint');
    if(hint){hint.textContent='Tap A to pick a level';hint.style.opacity='1';}
    document.body.classList.add('touch','playing');
    return true;
  })()`);
  await sleep(200);
  await frames(evaluate,20);
  results.win=await measureWin(evaluate);
  await screenshot(join(outDir,`${label}-E-victory.png`));

  return results;
}

async function main(){
  const xvfb=spawn('Xvfb',[':99','-screen','0','1600x900x24'],{stdio:'ignore'});
  await sleep(700);
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:join(__dirname,'..'),stdio:'ignore'});
  const chromeProc=spawn(chrome,[
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userData}`,
    '--no-first-run','--no-default-browser-check',
    '--use-gl=angle',
    '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--no-sandbox','--disable-setuid-sandbox',
    '--window-size=1280,720',
    'about:blank'
  ],{stdio:'ignore',env:Object.assign({},process.env,{DISPLAY:':99'})});

  let ready=false;
  for(let i=0;i<50;i++){
    try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}
  }
  if(!ready){chromeProc.kill();server.kill();xvfb.kill();throw new Error('Chrome CDP not ready');}

  const cdp=await openCDP();
  const viewports=[
    {label:'390x844',w:390,h:844},
    {label:'430x932',w:430,h:932},
    {label:'844x390',w:844,h:390},
    {label:'1280x720',w:1280,h:720}
  ];
  const all=[];
  try{
    for(const v of viewports){
      console.log('viewport',v.label);
      const r=await runViewport(cdp,v.label,v.w,v.h);
      all.push(r);
      const w=r.win||{};
      console.log(JSON.stringify({
        label:v.label,
        tutorialDead:r.tutorialKill&&(!r.tutorialKill.alive||r.tutorialKill.state==='dying'),
        farRock:r.farReveal&&r.farReveal.rockAlpha,
        midRock:r.midReveal&&r.midReveal.rockAlpha,
        nearRock:r.nearReveal&&r.nearReveal.rockAlpha,
        winTitle:w.title,
        first:w.firstLetterVisible,last:w.lastLetterVisible,centered:w.centered,
        overflowX:w.overflowX,fontSize:w.fontSize,subtitle:w.subtitle
      }));
    }
  }finally{
    cdp.close();
    try{chromeProc.kill();}catch(e){}
    try{server.kill();}catch(e){}
    try{xvfb.kill();}catch(e){}
  }
  writeFileSync(join(outDir,'results.json'),JSON.stringify(all,null,2));
  // Assert critical checks
  let fails=0;
  for(const r of all){
    if(!(r.tutorialKill&&(r.tutorialKill.state==='dying'||!r.tutorialKill.alive||r.tutorialKill.hp<=0))){console.error('FAIL tutorial kill',r.label);fails++;}
    if(!(r.farReveal&&r.farReveal.rockAlpha<0.05)){console.error('FAIL far sky',r.label);fails++;}
    if(!(r.midReveal&&r.midReveal.rockAlpha>0.1&&r.midReveal.rockAlpha<0.95)){console.error('FAIL mid fade',r.label);fails++;}
    if(!(r.nearReveal&&r.nearReveal.rockAlpha>=0.99)){console.error('FAIL near visible',r.label);fails++;}
    if(r.height>r.width){ // portrait
      const w=r.win;
      if(!(w&&w.firstLetterVisible&&w.lastLetterVisible&&w.centered&&w.overflowX&&/CONGRATULATIONS/.test(w.title)&&/YOU WIN!/.test(w.title))){
        console.error('FAIL portrait win',r.label,w);fails++;
      }
      if(!(w&&w.subtitle==='The stars are singing!')){console.error('FAIL subtitle',r.label);fails++;}
    }else{
      const w=r.win;
      if(!(w&&w.firstLetterVisible&&w.lastLetterVisible&&/CONGRATULATIONS/.test(w.title))){
        console.error('FAIL landscape/desktop win',r.label,w);fails++;
      }
    }
  }
  console.log(fails?'BROWSER VERIFY FAILED '+fails:'BROWSER VERIFY OK');
  process.exit(fails?1:0);
}

main().catch(e=>{console.error(e);process.exit(1);});
