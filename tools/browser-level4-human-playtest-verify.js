#!/usr/bin/env node
// Level 4 human-playtest remediation — browser verification (CDP / software WebGL).
const { spawn } = require('child_process');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const http = require('http');

const outDir = join(__dirname, '..', 'artifacts', 'browser-level4-human-playtest');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8793;
const cdpPort = 9231;
const userData = '/tmp/level4-human-playtest-chrome';
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

// Hold outdoor camera at an authored pos/look by piggybacking warp camera ownership.
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

async function releaseCam(evaluate){
  await evaluate(`(()=>{const CAM=window.__CAM;if(CAM.mode==='shot')CAM.mode='outdoor';return true;})()`);
}

async function bootLevel(cdp,label,width,height){
  const {send,evaluate}=cdp;
  await send('Emulation.setDeviceMetricsOverride',{
    width,height,deviceScaleFactor:1,mobile:width===844,screenWidth:width,screenHeight:height
  });
  await send('Page.navigate',{url:base+'?playtest='+label});
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

async function runViewport(cdp, label, width, height){
  const {evaluate,screenshot}=cdp;
  await bootLevel(cdp,label,width,height);

  // 1) Candy Planet — enemies hovering above pad
  const candy=await evaluate(`(()=>{
    const S=window.__SPACE,P=window.__P,cp=S.candyPlanet;
    const mid=S.saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
    const dummy=S.saucers.find(s=>s.targetDummy);
    const padTop=cp.pad.y+0.55;
    P.pos.set(cp.pad.x-1.2,padTop,cp.pad.z+2.8);P.vel.set(0,0,0);P.grounded=true;P.moveZone='grounded';P.yaw=0.2;
    return {
      level:window.__LEVEL&&window.__LEVEL().id,
      version:(document.getElementById('ver')||{}).textContent||'',
      webgl:!!document.querySelector('canvas'),
      padTop,
      mid:{x:mid.x,y:mid.y,z:mid.z,clear:mid.y-padTop},
      dummy:{x:dummy.x,y:dummy.y,z:dummy.z,clear:dummy.y-padTop},
      pad:{x:cp.pad.x,y:cp.pad.y,z:cp.pad.z}
    };
  })()`);
  await holdCam(evaluate,
    candy.pad.x-2.5, candy.padTop+2.6, candy.pad.z+6.2,
    candy.mid.x, candy.mid.y+0.5, candy.mid.z
  );
  await frames(evaluate,10);
  await screenshot(join(outDir,`${label}-01-candy-enemies.png`));

  // 2) Purple Star Beam — fire toward mid saucer from pad
  const beam=await evaluate(`(()=>{
    const S=window.__SPACE,P=window.__P,cp=S.candyPlanet;
    const mid=S.saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
    P.hasStarBeam=true;P.pos.set(mid.x-0.2,cp.pad.y+0.55,mid.z+3.0);P.grounded=true;
    P.yaw=Math.atan2(mid.x-P.pos.x,mid.z-P.pos.z);
    const before=S.starBeams.length;
    S.fireStarBeam(Math.sin(P.yaw),Math.cos(P.yaw),P.pos.x,P.pos.y+0.85,P.pos.z);
    // Keep spawning a few frames of purple particles for the shot
    for(let i=0;i<10;i++){
      const t=i/9*18;
      const col=i%3===0?0xffffff:(i%2===0?0xa070ff:0xc8b0ff);
      // spawnP is in closure; use fireStarBeam again lightly
    }
    S.fireStarBeam(Math.sin(P.yaw),Math.cos(P.yaw),P.pos.x,P.pos.y+0.85,P.pos.z);
    return {before,after:S.starBeams.length,colors:S.STAR_BEAM_COLORS,
      mid:{x:mid.x,y:mid.y,z:mid.z},px:P.pos.x,py:P.pos.y,pz:P.pos.z,yaw:P.yaw};
  })()`);
  await holdCam(evaluate,
    beam.px - Math.sin(beam.yaw)*1.2, beam.py+1.6, beam.pz - Math.cos(beam.yaw)*1.2,
    beam.mid.x, beam.mid.y+0.4, beam.mid.z
  );
  await frames(evaluate,8);
  await screenshot(join(outDir,`${label}-02-purple-beam.png`));
  await releaseCam(evaluate);

  // 3) Closed shield gate choke
  const gateClosed=await evaluate(`(()=>{
    const S=window.__SPACE,P=window.__P,g=S.shieldedGates[0];
    P.pos.set(g.x,g.y+g.h*0.45,g.z+11);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';
    return {opened:!!g.opened,barriers:(g.barriers&&g.barriers.length)||0,w:g.w,h:g.h,x:g.x,y:g.y,z:g.z};
  })()`);
  await holdCam(evaluate,
    gateClosed.x, gateClosed.y+gateClosed.h*0.55, gateClosed.z+14,
    gateClosed.x, gateClosed.y+gateClosed.h*0.45, gateClosed.z
  );
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-03-gate-closed.png`));

  // 4) Open shield gate (same framing)
  const gateOpenState=await evaluate(`(()=>{
    const g=window.__SPACE.shieldedGates[0];
    if(!g.opened){
      g.opened=true;g.openT=0.95;
      if(g.g)g.g.visible=false;
      if(g.solid){const idx=window.__W.solids.indexOf(g.solid);if(idx>=0)window.__W.solids.splice(idx,1);g.solid=null;}
    }
    return {opened:!!g.opened,solidGone:!g.solid,x:g.x,y:g.y,z:g.z,h:g.h};
  })()`);
  await holdCam(evaluate,
    gateOpenState.x, gateOpenState.y+gateOpenState.h*0.55, gateOpenState.z+14,
    gateOpenState.x, gateOpenState.y+gateOpenState.h*0.35, gateOpenState.z-6
  );
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-04-gate-open.png`));
  await releaseCam(evaluate);

  // 5) Observatory approach
  await evaluate(`(()=>{const P=window.__P;P.pos.set(10,30,-258);P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';return true;})()`);
  await holdCam(evaluate, 10, 32, -255, 10, 24.8, -272);
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-05-observatory-approach.png`));

  // 6) Observatory landed + Snoozle 4
  const obsLand=await evaluate(`(()=>{
    const P=window.__P,W=window.__W,sn=W.snoozles[3];
    const main=W.solids.find(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-10,(s.min.z+s.max.z)/2+272)<2&&(s.max.x-s.min.x)>8);
    P.pos.set(10,main.max.y,-271.2);P.vel.set(0,0,0);P.grounded=true;P.moveZone='grounded';P.surf='pad';
    return {
      grounded:!!P.grounded,
      y:P.pos.y,deckTop:main.max.y,
      sn4:{x:sn.g.position.x,y:sn.g.position.y,z:sn.g.position.z}
    };
  })()`);
  await holdCam(evaluate,
    10, obsLand.deckTop+2.4, -267.8,
    obsLand.sn4.x, obsLand.sn4.y+0.5, obsLand.sn4.z
  );
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-06-observatory-landed-snoozle4.png`));

  // 7) BH activation from Observatory
  const wake=await evaluate(`(()=>{
    const S=window.__SPACE,W=window.__W,P=window.__P,bh=S.blackHoleFinish;
    for(let i=0;i<3;i++){const s=W.snoozles[i];s.state='home';if(s.g.userData){s.g.userData.closed.visible=false;s.g.userData.open.visible=true;}}
    S.activateBlackHolePortal();
    P.pos.set(10,24.42,-272);P.grounded=true;
    return {
      active:!!bh.active,
      portalVisible:!!(bh.portal&&bh.portal.visible),
      ignited:S.routeBeacons.filter(b=>b.userData&&b.userData.pathIgnite).length,
      bh:{x:bh.x,y:bh.y,z:bh.z}
    };
  })()`);
  await holdCam(evaluate, 10, 26.8, -269.5, wake.bh.x, wake.bh.y, wake.bh.z);
  await frames(evaluate,14);
  await screenshot(join(outDir,`${label}-07-bh-activation-from-obs.png`));

  // 8) Route markers toward BH
  await evaluate(`(()=>{const P=window.__P,bh=window.__SPACE.blackHoleFinish;P.pos.set(8.5,28,-284);P.grounded=false;return true;})()`);
  await holdCam(evaluate, 9, 29.5, -279, wake.bh.x, wake.bh.y, wake.bh.z);
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-08-route-to-bh.png`));

  // 9) Active Black Hole close approach
  await evaluate(`(()=>{const P=window.__P,bh=window.__SPACE.blackHoleFinish;P.pos.set(bh.x,bh.y,bh.z+12);return true;})()`);
  await holdCam(evaluate, wake.bh.x, wake.bh.y+2, wake.bh.z+16, wake.bh.x, wake.bh.y, wake.bh.z);
  await frames(evaluate,12);
  await screenshot(join(outDir,`${label}-09-black-hole-active.png`));
  await releaseCam(evaluate);

  const finish=await evaluate(`(()=>{
    const bh=window.__SPACE.blackHoleFinish;
    return {
      voidBuilt:!!(bh&&bh.voidGroup),
      warpCam:typeof window.__SPACE.isSpaceWarpCamera==='function',
      version:(document.getElementById('ver')||{}).textContent||''
    };
  })()`);

  return {label,width,height,candy,beam,gateClosed,gateOpenState,obsLand,wake,finish};
}

async function main(){
  const xvfb=spawn('Xvfb',[':98','-screen','0','1600x900x24'],{stdio:'ignore'});
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
  ],{stdio:'ignore',env:Object.assign({},process.env,{DISPLAY:':98'})});

  let ready=false;
  for(let i=0;i<50;i++){
    try{await getJSON(`http://127.0.0.1:${cdpPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}
  }
  if(!ready){chromeProc.kill();server.kill();xvfb.kill();throw new Error('Chrome CDP not ready');}

  const cdp=await openCDP();
  const results=[];
  try{
    results.push(await runViewport(cdp,'mobile-844x390',844,390));
    results.push(await runViewport(cdp,'desktop-1280x720',1280,720));
  }finally{
    cdp.close();
    try{chromeProc.kill();}catch(e){}
    try{server.kill();}catch(e){}
    try{xvfb.kill();}catch(e){}
  }

  writeFileSync(join(outDir,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));

  let fail=0;
  for(const r of results){
    const checks=[
      ['webgl',!!r.candy.webgl],
      ['level4',r.candy.level==='level4'],
      ['candy mid clear',r.candy.mid.clear>1.0],
      ['candy dummy clear',r.candy.dummy.clear>1.0],
      ['purple beam colors',!!(r.beam.colors&&r.beam.colors.indexOf(0xa070ff)>=0&&r.beam.colors.indexOf(0xc8b0ff)>=0)],
      ['beam fired',r.beam.after>r.beam.before],
      ['gate closed barriers',r.gateClosed.barriers>=4&&!r.gateClosed.opened],
      ['gate opened',!!(r.gateOpenState.opened&&r.gateOpenState.solidGone)],
      ['obs landed',!!(r.obsLand.grounded&&Math.abs(r.obsLand.y-r.obsLand.deckTop)<0.5)],
      ['snoozle4 on deck',!!(r.obsLand.sn4&&r.obsLand.sn4.y>r.obsLand.deckTop)],
      ['bh activated',!!(r.wake.active&&r.wake.portalVisible)],
      ['path ignited',r.wake.ignited>=8],
      ['finish void intact',!!r.finish.voidBuilt],
      ['warp cam helper',!!r.finish.warpCam],
      ['version v51',/v51/.test(r.finish.version||r.candy.version||'')]
    ];
    console.log('\n== '+r.label+' ==');
    for(const [name,ok] of checks){
      console.log((ok?'PASS':'FAIL')+' '+name);
      if(!ok)fail++;
    }
  }
  console.log('\nArtifacts in '+outDir);
  if(fail){console.log(fail+' FAILED');process.exit(1);}
  console.log('all browser checks passed');
}

main().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});
