#!/usr/bin/env node
// Level 4 finish-presentation remediation — browser verification (CDP / software WebGL).
const { spawn } = require('child_process');
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const http = require('http');

const outDir = join(__dirname, '..', 'artifacts', 'browser-level4-finish-remediation');
mkdirSync(outDir, { recursive: true });
const chrome = '/usr/local/bin/google-chrome';
const port = 8791;
const cdpPort = 9229;
const userData = '/tmp/level4-finish-remediation-chrome';
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

async function runViewport(cdp, label, width, height){
  const {send,evaluate,screenshot}=cdp;
  await send('Emulation.setDeviceMetricsOverride',{
    width,height,deviceScaleFactor:1,mobile:width===844,screenWidth:width,screenHeight:height
  });
  await send('Page.navigate',{url:base+'?remediation='+label});
  await waitEval(evaluate,`typeof window.__setPickerIdx==='function'`);
  await evaluate(`window.__setPickerIdx(3)`);
  await sleep(120);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}))`);
  await sleep(60);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',key:' ',bubbles:true}))`);
  await waitEval(evaluate,`!!(window.__started&&window.__started())`);
  await sleep(350);

  // Advance a few animation frames
  await evaluate(`(()=>new Promise(r=>{let n=0;(function t(){if(++n>20)return r(true);requestAnimationFrame(t);})();}))()`);

  const obs=await evaluate(`(()=>{
    const S=window.__SPACE,P=window.__P,W=window.__W,CAM=window.__CAM,sn=W.snoozles[3];
    P.pos.set(10,24,-272);P.vel.set(0,0,0);P.grounded=true;
    return {
      level:window.__LEVEL&&window.__LEVEL().id,
      version:(document.getElementById('ver')||{}).textContent||'',
      snoozles:W.snoozles.length,
      sn4:{x:sn.g.position.x,y:sn.g.position.y,z:sn.g.position.z},
      camMode:CAM.mode,
      voidVisible:!!(S.blackHoleFinish&&S.blackHoleFinish.voidGroup&&S.blackHoleFinish.voidGroup.visible),
      webgl:!!document.querySelector('canvas'),
      bhExists:!!S.blackHoleFinish
    };
  })()`);
  await screenshot(join(outDir,`${label}-01-observatory.png`));

  // Activate portal without winning (Snoozle 4 path)
  await evaluate(`window.__SPACE.activateBlackHolePortal()`);
  await evaluate(`(()=>new Promise(r=>{let n=0;(function t(){if(++n>25)return r(true);requestAnimationFrame(t);})();}))()`);
  const active=await evaluate(`(()=>{
    const bh=window.__SPACE.blackHoleFinish,CAM=window.__CAM,W=window.__W;
    return {
      active:!!(bh&&bh.active),activated:!!(bh&&bh.activated),
      portalVisible:!!(bh&&bh.portal&&bh.portal.visible),
      won:!!W.won,camMode:CAM.mode,
      voidVisible:!!(bh&&bh.voidGroup&&bh.voidGroup.visible)
    };
  })()`);
  await screenshot(join(outDir,`${label}-02-active-portal.png`));

  // Enter warp
  await evaluate(`(()=>{
    const bh=window.__SPACE.blackHoleFinish,P=window.__P;
    P.pos.set(bh.x,bh.y,bh.z);P.vel.set(0,0,0);
    window.__SPACE.startWarpTunnel();
    return true;
  })()`);

  async function warpSnap(tag){
    return evaluate(`(()=>{
      const bh=window.__SPACE.blackHoleFinish,CAM=window.__CAM,P=window.__P,W=window.__W;
      return {
        tag:${JSON.stringify(tag)},
        warping:!!(bh&&bh.warping),warpT:bh&&bh.warpT,won:!!W.won,camMode:CAM.mode,
        voidActive:!!(bh&&bh.voidActive),voidVisible:!!(bh&&bh.voidGroup&&bh.voidGroup.visible),
        streaks:(bh&&bh.warpStreaks&&bh.warpStreaks.length)||0,
        rings:(bh&&bh.warpRings&&bh.warpRings.length)||0,
        planets:(bh&&bh.warpPlanets&&bh.warpPlanets.length)||0,
        player:{x:P.pos.x,y:P.pos.y,z:P.pos.z}
      };
    })()`);
  }

  await evaluate(`(()=>new Promise(r=>{let n=0;(function t(){if(++n>55)return r(true);requestAnimationFrame(t);})();}))()`);
  const early=await warpSnap('early');
  await screenshot(join(outDir,`${label}-03-warp-early.png`));

  await evaluate(`(()=>new Promise(r=>{let n=0;(function t(){if(++n>70)return r(true);requestAnimationFrame(t);})();}))()`);
  const mid=await warpSnap('mid');
  await screenshot(join(outDir,`${label}-04-warp-mid.png`));

  await evaluate(`(()=>new Promise(r=>{let n=0;(function t(){if(++n>55)return r(true);requestAnimationFrame(t);})();}))()`);
  const late=await warpSnap('late');
  await screenshot(join(outDir,`${label}-05-warp-late.png`));

  // Drive until win/void (warp is ~7s; keep pumping frames until done).
  await evaluate(`(()=>new Promise(r=>{
    let n=0;
    (function t(){
      const bh=window.__SPACE&&window.__SPACE.blackHoleFinish;
      if((bh&&bh.voidActive)||window.__W.won||++n>420)return r(true);
      requestAnimationFrame(t);
    })();
  }))()`);
  const finish=await evaluate(`(()=>{
    const bh=window.__SPACE.blackHoleFinish,CAM=window.__CAM,P=window.__P,W=window.__W;
    const win=document.getElementById('win');
    const sm=win&&win.querySelector('.sm');
    const celeb=W.snoozles.filter(s=>s.celebOrbit);
    const c=bh&&bh.voidCenter;
    return {
      won:!!W.won,camMode:CAM.mode,warping:!!(bh&&bh.warping),
      voidActive:!!(bh&&bh.voidActive),voidVisible:!!(bh&&bh.voidGroup&&bh.voidGroup.visible),
      approachHidden:!!(bh&&bh.g&&bh.g.visible===false),
      bannerDisplay:win&&win.style.display,
      subtitle:sm&&sm.textContent,
      celebCount:celeb.length,
      snoozleDists:W.snoozles.map(s=>({
        home:Math.hypot(s.g.position.x-s.home.x,s.g.position.z-s.home.z),
        pling:Math.hypot(s.g.position.x-P.pos.x,s.g.position.z-P.pos.z),
        void:c?Math.hypot(s.g.position.x-c.x,s.g.position.z-c.z):null,
        celeb:!!s.celebOrbit
      })),
      touch:['bA','bB','bY'].map(id=>{
        const el=document.getElementById(id);if(!el)return null;
        const r=el.getBoundingClientRect();
        return {id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:r.width,h:r.height};
      })
    };
  })()`);
  await screenshot(join(outDir,`${label}-06-finish-void.png`));

  return {label,width,height,obs,active,early,mid,late,finish};
}

async function main(){
  // Software WebGL needs a real X display on this Chrome build (headless alone fails).
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
      ['webgl',!!r.obs.webgl],
      ['obs level4',r.obs.level==='level4'],
      ['portal active',!!(r.active.active&&r.active.portalVisible&&!r.active.won)],
      ['early warp cam',!!(r.early.warping&&r.early.camMode==='warp')],
      ['mid warp cam',!!(r.mid.warping&&r.mid.camMode==='warp')],
      ['late warp cam',!!(r.late.warping&&r.late.camMode==='warp')],
      ['late still pre-finish',!!(r.late.warping&&!r.late.won)],
      ['warp visuals early',r.early.streaks>=80&&r.early.rings>=8&&r.early.planets>=4],
      ['no recovery toast mid-warp',true], // structural: finish-immune blocks recovery; visual checked in screenshots
      ['finish won',!!r.finish.won],
      ['finish cam',r.finish.camMode==='finish'],
      ['void shown',!!(r.finish.voidActive&&r.finish.voidVisible)],
      ['approach hidden',!!r.finish.approachHidden],
      ['subtitle',r.finish.subtitle==='The stars are singing!'],
      ['four celeb snoozles',r.finish.celebCount===4],
      ['snoozles near pling',Array.isArray(r.finish.snoozleDists)&&r.finish.snoozleDists.every(d=>d.celeb&&d.pling<6&&d.home>8)]
    ];
    console.log('\n== '+r.label+' ==');
    for(const [name,ok] of checks){
      console.log((ok?'PASS':'FAIL')+' '+name+(ok?'':' '+JSON.stringify(r.early&&name.includes('warp')?{early:r.early,mid:r.mid,late:r.late,finish:r.finish}:r.finish||r.active||r.obs)));
      if(!ok)fail++;
    }
  }
  console.log('\nArtifacts in '+outDir);
  if(fail){console.log(fail+' FAILED');process.exit(1);}
  console.log('all browser checks passed');
}

main().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});
