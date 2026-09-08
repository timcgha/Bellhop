#!/usr/bin/env node
// BH-004 motion evidence. Real CDP keyboard/touch input; no player, camera,
// progression or physics writes. The read-only probe exists only in served copies.
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const {spawn,execFileSync}=require('child_process');
const crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const BASE='33f3d4a750cb78bfbd48d464ad38292d2a933133';
const BASE_TREE='61c46dd64d2922760c309adf85de67dc41fce884';
const CDN='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const OUT=path.join(ROOT,'artifacts','browser-movement-jump');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(c,m)=>{if(!c)throw Error(m);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8'}).trim();
const write=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,2));
function probe(){
  const original=renderer.render.bind(renderer);
  const records=[];let previous=null;
  window.__BH004Capture=false;
  window.__BH004PointerEvents=[];window.__BH004PointerCount=0;window.__BH004LastPointer=null;
  document.addEventListener('pointerdown',e=>{
    const event={count:++window.__BH004PointerCount,type:e.pointerType,target:e.target.id,
      path:e.composedPath().map(n=>n.id).filter(Boolean),trusted:e.isTrusted,x:e.clientX,y:e.clientY,time:performance.now()};
    window.__BH004LastPointer=event;if(window.__BH004PointerEvents.length<200)window.__BH004PointerEvents.push(event);
  },true);
  window.__BH004Read=()=>records.slice();
  renderer.render=function(...args){
    const result=original(...args),now=performance.now();
    if(window.__BH004Capture&&records.length<20000){
      const u=player.userData;
      records.push({ms:now,interval:previous===null?null:now-previous,time,started,paused,
        level:CURRENT_LEVEL&&CURRENT_LEVEL.id,pos:[P.pos.x,P.pos.y,P.pos.z],vel:[P.vel.x,P.vel.y,P.vel.z],
        grounded:P.grounded,dead:P.dead,puff:P.puff,hover:P.hover,slam:P.slam,
        root:[player.position.x,player.position.y,player.position.z],
        pose:[u.legL.rotation.x,u.legR.rotation.x,u.armL.rotation.x,u.armR.rotation.x,u.head.rotation.x],
        squash:P.sq,headY:u.head.position.y,camera:[camera.position.x,camera.position.y,camera.position.z],
        camel:!!P.camel,sled:!!P.sled,spaceThrust:!!P.spaceThrust});
      previous=now;
    }
    return result;
  };
}
function json(url){return new Promise((resolve,reject)=>http.get(url,res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>{try{resolve(JSON.parse(s));}catch(e){reject(e);}});}).on('error',reject));}
async function connect(port,targetId=null){
  const pages=await json(`http://127.0.0.1:${port}/json/list`),page=pages.find(p=>p.type==='page'&&(!targetId||p.id===targetId));assert(page,'no browser page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;const pending=new Map(),errors=[],listeners=new Map();
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout '+method));},20000);pending.set(n,{resolve,reject,t});ws.send(JSON.stringify({id:n,method,params}));});
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(listeners.has(m.method))listeners.get(m.method)(m.params);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.t);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
  await send('Page.enable');await send('Runtime.enable');return {send,ev,errors,targetId:page.id,on:(m,f)=>listeners.set(m,f),close:()=>ws.close()};
}
async function wait(c,expr,ms=15000){const start=Date.now();let last;while(Date.now()-start<ms){try{if(await c.ev(expr))return;}catch(e){last=e.message;}await sleep(80);}throw Error('timeout '+expr+(last?' / '+last:''));}
async function key(c,code,down){const map={Space:[' ',32],KeyD:['d',68],KeyA:['a',65],KeyS:['s',83]},[key,v]=map[code];await c.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key,code,windowsVirtualKeyCode:v,nativeVirtualKeyCode:v});}
async function point(c,id){
  // A viewport/scroll change must be painted before CDP routes touch coordinates.
  await c.ev(`new Promise(resolve=>{document.getElementById(${JSON.stringify(id)}).scrollIntoView({block:'center',inline:'nearest'});requestAnimationFrame(()=>requestAnimationFrame(resolve));})`);
  const p=await c.ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(x,y))};})()`);
  assert(p.hit,'control is not the actual pointer hit target: '+id+' '+JSON.stringify(p));return p;
}
// Run #399's landscape touch was acknowledged by CDP but delivered no DOM
// pointerdown. Reinitialize emulation on the NEW document, not only the widget
// being navigated away from. This resets test transport, never game input/state.
async function inputTransport(c,touch){
  const before=await c.ev('({url:location.href,touchPoints:navigator.maxTouchPoints})');
  await c.send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  const after=await c.ev('({url:location.href,touchPoints:navigator.maxTouchPoints,focused:document.hasFocus(),width:innerWidth,height:innerHeight})');
  assert(after.touchPoints===(touch?5:0),'touch emulation not bound to the current document');
  (c.transportEvidence??=[]).push({before,after,layout:await c.send('Page.getLayoutMetrics')});
}
async function click(c,id,touch){
  const p=await point(c,id);assert(p.w>0&&p.h>0,'hidden control '+id);
  const previous=await c.ev('__BH004PointerCount');
  try{
    if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1,radiusX:4,radiusY:4,force:1}]});
    else await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
    // A protocol reply or elapsed wall-clock delay does not prove delivery.
    // Keep the actual finger down until the current DOM sees this exact target.
    await wait(c,`__BH004LastPointer&&__BH004LastPointer.count>${previous}&&__BH004LastPointer.trusted&&__BH004LastPointer.type===${JSON.stringify(touch?'touch':'mouse')}&&__BH004LastPointer.path.includes(${JSON.stringify(id)})`);
    (c.tapEvidence??=[]).push({id,requested:p,event:await c.ev('__BH004LastPointer'),url:await c.ev('location.href')});
  }finally{
    if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    else await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  }
  await sleep(100);
}
async function controls(c,touch,w,h){
  let move=null,jump=false,points=[];
  const log=[];const mark=async(label)=>{log.push({label,wallMs:Date.now(),browserMs:await c.ev('performance.now()')});};
  async function direction(sign,z=0){
    if(touch){
      assert(!jump,'finish touch jump before releasing stick');
      if(points.length)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});points=[];
      if(sign||z){const p={x:Math.round(w*.22),y:Math.round(h*.72),id:1};await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});p.x+=sign*48;p.y+=z*48;points=[p];await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});}
    }else{if(move)await key(c,move,false);if(sign||z)await key(c,z?'KeyS':sign>0?'KeyD':'KeyA',true);}
    move=sign||z?(z?'KeyS':sign>0?'KeyD':'KeyA'):null;
  }
  async function jumpDown(){
    if(touch){const p=await point(c,'bA');points=[...points,{x:p.x,y:p.y,id:2}];await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});}
    else await key(c,'Space',true);jump=true;
  }
  async function release(){
    if(touch){if(points.length)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});points=[];move=null;}
    else{if(jump)await key(c,'Space',false);if(move)await key(c,move,false);move=null;}
    jump=false;
  }
  return {mark,log,direction,jumpDown,release};
}
function stats(a){const s=a.filter(Number.isFinite).sort((a,b)=>a-b),at=q=>s[Math.min(s.length-1,Math.floor(q*s.length))]??null;return {count:s.length,min:s[0]??null,p50:at(.5),p95:at(.95),max:s.at(-1)??null};}
function summarize(samples){
  const landings=[],takeoffs=[];
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(!a.grounded&&b.grounded&&!b.dead)landings.push({index:i,ms:b.ms,poseDelta:b.pose.map((v,j)=>v-a.pose[j]),squashDelta:b.squash-a.squash});
    if(a.grounded&&!b.grounded&&!b.dead)takeoffs.push({index:i,ms:b.ms,vy:b.vel[1]});
  }
  return {frameIntervalsMs:stats(samples.map(s=>s.interval)),landings,takeoffs,
    maxRootError:Math.max(0,...samples.filter(s=>!s.camel).map(s=>Math.hypot(...s.root.map((v,i)=>v-s.pos[i]))))};
}
async function gameWait(c,ms){const target=await c.ev(`__gameTime()+${ms/1000}`);await wait(c,`__gameTime()>=${target}`,90000);}
async function capture(c,origin,version,w,h){
  const touch=w!==1280,name=`${version}-${w}x${h}`,dir=path.join(OUT,name);fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
  await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:touch,screenWidth:w,screenHeight:h});
  await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  const target=`${origin}/${version}?capture=${w}x${h}`;await c.send('Page.navigate',{url:target});
  await wait(c,`location.href===${JSON.stringify(target)}&&document.readyState==='complete'&&typeof __BH004Read==='function'&&typeof THREE!=='undefined'`);
  await inputTransport(c,touch);
  assert(await c.ev('THREE.REVISION')==='128','wrong THREE revision');
  await click(c,'lvl0',touch);if(!await c.ev('__started()')){await wait(c,'__touchArmed()&&__pickerIdx()===0');await click(c,'lvl0',touch);}
  await wait(c,`__started()&&__LEVEL().id==='level1'&&!__paused()&&__P.grounded`);
  const input=await controls(c,touch,w,h);
  // Real movement clear of the starting checkpoint, at the ordinary camera.
  await input.direction(1);await gameWait(c,400);await input.release();await gameWait(c,350);
  const frames=[];let n=0,recording=true;
  c.on('Page.screencastFrame',p=>{c.send('Page.screencastFrameAck',{sessionId:p.sessionId}).catch(()=>{});if(recording){const file=`frames/${String(n++).padStart(5,'0')}.jpg`;fs.writeFileSync(path.join(dir,file),Buffer.from(p.data,'base64'));frames.push({file,timestamp:p.metadata.timestamp,receivedMs:Date.now()});}});
  await c.ev('window.__BH004Capture=true');
  await c.send('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:w,maxHeight:h,everyNthFrame:1});
  try{
    await input.mark('idle');await gameWait(c,500);
    await input.mark('idle-to-run');await input.direction(1);await gameWait(c,420);
    await input.mark('run-to-stop');await input.release();await gameWait(c,350);
    await input.mark('change-direction');await input.direction(-1);await gameWait(c,420);await input.release();await gameWait(c,350);
    await input.mark('standing-jump');await input.jumpDown();await gameWait(c,380);await input.release();await gameWait(c,1000);
    await input.mark('early-release-short-hop');await input.jumpDown();await gameWait(c,70);await input.release();await gameWait(c,900);
    await input.mark('held-jump');await input.jumpDown();await gameWait(c,720);await input.release();await gameWait(c,650);
    await input.mark('puff-float');await input.jumpDown();await gameWait(c,100);await input.release();await gameWait(c,150);await input.jumpDown();await gameWait(c,1000);await input.release();await gameWait(c,1600);
    await input.mark('running-jump-and-landing-into-run');await input.direction(-1);await gameWait(c,200);await input.jumpDown();await gameWait(c,1000);await input.release();await gameWait(c,500);
    await input.mark('end');
    const samples=await c.ev('__BH004Read()'),summary=summarize(samples);
    write(path.join(dir,'samples.json'),samples);write(path.join(dir,'frames.json'),frames);write(path.join(dir,'inputs.json'),input.log);write(path.join(dir,'summary.json'),summary);
    assert(samples.length>60&&frames.length>30,'insufficient real motion capture');
    assert(summary.takeoffs.length>=5&&summary.landings.length>=5,'missing jump/landing path '+JSON.stringify(summary));
    assert(samples.some(s=>s.hover),'puff/float was not exercised');
    assert(samples.every(s=>s.started&&!s.paused&&!s.dead&&s.level==='level1'),'route left normal Level 1 play');
    assert(summary.maxRootError<1e-9,'physical/visual root mismatch');
    write(path.join(dir,'samples.json'),samples);write(path.join(dir,'frames.json'),frames);write(path.join(dir,'inputs.json'),input.log);write(path.join(dir,'summary.json'),summary);
    return {name,viewport:[w,h],input:touch?'CDP touch emulation':'CDP keyboard',status:'CAPTURED',frames:frames.length,samples:samples.length,...summary};
  }finally{recording=false;await c.send('Page.stopScreencast');await c.ev('window.__BH004Capture=false');await input.release();}
}
// Reuse the existing picker/pause controls; no level or progression setters.
async function lifecycle(c,origin,w,h){
  c.on('Page.screencastFrame',p=>{c.send('Page.screencastFrameAck',{sessionId:p.sessionId}).catch(()=>{});});
  const touch=w!==1280,name=`lifecycle-${w}x${h}`,dir=path.join(OUT,name);fs.mkdirSync(dir,{recursive:true});
  await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:touch,screenWidth:w,screenHeight:h});
  await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  const target=`${origin}/candidate?lifecycle=${w}x${h}`;await c.send('Page.navigate',{url:target});await wait(c,`location.href===${JSON.stringify(target)}&&document.readyState==='complete'&&typeof __BH004Read==='function'`);
  await inputTransport(c,touch);
  await click(c,'skinsOpen',touch);await wait(c,'__SKINS().open');await click(c,'skin-purple',touch);await click(c,'skinUse',touch);await wait(c,`!__SKINS().open&&__SKINS().equipped==='purple'`);
  const state=()=>c.ev(`({time:__gameTime(),pos:[__P.pos.x,__P.pos.y,__P.pos.z],root:[__PLAYER().position.x,__PLAYER().position.y,__PLAYER().position.z],arms:[__PLAYER().userData.armL.rotation.x,__PLAYER().userData.armR.rotation.x],grounded:__P.grounded,dead:__P.dead,started:__started(),paused:__paused(),won:__W.won,level:__LEVEL().id,thrust:__P.spaceThrust,skin:__SKINS().equipped})`);
  const rows=[];
  for(let index=0;index<6;index++){
    console.log('MOTION lifecycle '+w+'x'+h+' level '+(index+1));
    await click(c,'lvl'+index,touch);if(!await c.ev('__started()')){await wait(c,`__touchArmed()&&__pickerIdx()===${index}`);await click(c,'lvl'+index,touch);}
    await wait(c,`__started()&&__LEVEL().id==='level${index+1}'&&!__paused()&&__P.grounded`,45000);
    const input=await controls(c,touch,w,h),start=await state();
    await c.ev('window.__BH004Capture=true');
    await input.direction(1);await gameWait(c,250);await input.release();await gameWait(c,300);const moved=await state();
    assert(Math.hypot(...moved.pos.map((v,j)=>v-start.pos[j]))>.08,'movement not observed');
    await input.jumpDown();await wait(c,'!__P.grounded&&__P.vel.y>0',20000);await gameWait(c,80);await input.release();const airborne=await state();
    await click(c,'pauseBtn',touch);await wait(c,'__paused()');const frozen=await state();await sleep(350);const held=await state();
    assert(JSON.stringify(frozen)===JSON.stringify(held),'paused motion/pose changed');
    await click(c,'pauseResume',touch);await wait(c,'!__paused()');await gameWait(c,100);
    let descent=null;
    if(index===3){
      // Native open-space backward-stick + held A descends back to the same pad.
      await input.direction(0,1);await input.jumpDown();await wait(c,'__P.grounded',45000);descent=await state();await input.release();
    }else await wait(c,'__P.grounded',45000);
    const landed=await state();assert(!landed.dead&&!landed.won&&landed.skin==='purple'&&landed.grounded,'invalid native landing');
    await gameWait(c,250);const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,'level'+(index+1)+'-landed.png'),Buffer.from(shot.data,'base64'));
    const samples=await c.ev('__BH004Read()');write(path.join(dir,'level'+(index+1)+'-samples.json'),samples);
    await c.ev('window.__BH004Capture=false');await click(c,'pauseBtn',touch);await wait(c,'__paused()');await click(c,'pauseMenu',touch);await wait(c,`!__started()&&!__paused()&&!__W.won`);
    assert(await c.ev(`!__P.camel&&!__P.sled&&!__P.spaceThrust&&__INPUT_STATE().keysDown.length===0&&!__INPUT_STATE().jumpHeld`),'menu retained mode/input');
    rows.push({level:index+1,status:'PASS',input:touch?'real CDP touch emulation':'real CDP keyboard',start,moved,airborne,pauseFrozen:true,landed,descent,menu:true});
  }
  // Restart after the sixth teardown through the same real picker.
  await click(c,'lvl0',touch);if(!await c.ev('__started()')){await wait(c,'__touchArmed()&&__pickerIdx()===0');await click(c,'lvl0',touch);}await wait(c,`__started()&&__LEVEL().id==='level1'&&__P.grounded`);
  const restart=await state();assert(!restart.dead&&!restart.won&&restart.skin==='purple','restart lost native state');
  write(path.join(dir,'result.json'),{status:'PASS',viewport:[w,h],rows,restart});return {name,status:'PASS',rows,restart};
}
function viewer(names){return `<!doctype html><meta charset="utf-8"><title>BH-004 normal-speed motion</title><style>body{font:16px system-ui;background:#16191d;color:white;margin:24px}img{max-width:100%;display:block}button,select{font:inherit;padding:8px;margin:8px}p{max-width:70em}</style><h1>BH-004 motion evidence</h1><p>Normal-speed timestamped browser frames, not interpolated frames. Select a capture and Play. Real frame intervals are in summary.json. Touch means emulation, not a physical phone. Source identities and limitations are in result.json.</p><select id="pick">${names.map(n=>`<option>${n}</option>`).join('')}</select><button id="play">Play at 1×</button><span id="clock"></span><img id="frame"><script>let ticket=0;document.getElementById('play').onclick=async()=>{const id=++ticket,name=document.getElementById('pick').value,frames=await(await fetch(name+'/frames.json')).json(),images=await Promise.all(frames.map(f=>new Promise(r=>{const x=new Image();x.onload=()=>r(x);x.onerror=()=>r(x);x.src=name+'/'+f.file;})));const t0=performance.now(),start=frames[0].timestamp;let i=0;function show(){if(ticket!==id)return;const elapsed=(performance.now()-t0)/1000;while(i+1<frames.length&&frames[i+1].timestamp-start<=elapsed)i++;document.getElementById('frame').src=images[i].src;document.getElementById('clock').textContent=(frames[i].timestamp-start).toFixed(2)+' s | frame '+i;if(i+1<frames.length)requestAnimationFrame(show);}show();};</script>`;}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bh004-')),port=8814,debugPort=9254;
  let browser,server,c;const result={status:'RUNNING',base:BASE,baseTree:BASE_TREE,observedAt:new Date().toISOString(),captures:[],limitations:['Original reporter device, browser, input and precise symptom unknown.','Browser is headless Chrome with software WebGL; touch is emulation.','Inputs wait for observed gameplay time; wall durations and frame quantization differ on software rendering. Exact version parity is a separate deterministic test.','Read-only observation and screencast add capture overhead.','No subjective or human acceptance is inferred from capture success.']};
  try{
    assert(git('rev-parse',`${BASE}^{tree}`)===BASE_TREE,'authorized base tree mismatch');
    execFileSync('git',['merge-base','--is-ancestor',BASE,'HEAD'],{cwd:ROOT});
    result.checkout=git('rev-parse','HEAD');result.checkoutTree=git('rev-parse','HEAD^{tree}');
    const baseDir=path.join(tmp,'base');fs.mkdirSync(baseDir);
    const tar=execFileSync('git',['archive',BASE],{cwd:ROOT,maxBuffer:16*1024*1024});execFileSync('tar',['-x','-C',baseDir],{input:tar});
    execFileSync(process.execPath,['build.js'],{cwd:baseDir});execFileSync(process.execPath,['build.js'],{cwd:ROOT});
    const base=fs.readFileSync(path.join(baseDir,'dist','index.html'),'utf8'),candidate=fs.readFileSync(path.join(ROOT,'dist','index.html'),'utf8');
    result.baseArtifactSha256=hash(base);result.candidateArtifactSha256=hash(candidate);
    fs.writeFileSync(path.join(OUT,'base.html'),base);fs.writeFileSync(path.join(OUT,'candidate.html'),candidate);
    execFileSync('git',['bundle','create',path.join(OUT,'bellhop.bundle'),'HEAD'],{cwd:ROOT});
    let lib;if(process.env.BH004_THREE_PATH)lib=fs.readFileSync(process.env.BH004_THREE_PATH);else{const r=await fetch(CDN,{signal:AbortSignal.timeout(30000)});assert(r.ok,'existing Three.js dependency unavailable '+r.status);lib=Buffer.from(await r.arrayBuffer());}
    assert(lib.length>100000,'invalid Three.js dependency');fs.writeFileSync(path.join(OUT,'three-r128.min.js'),lib);result.dependency={url:CDN,sha256:hash(lib)};
    const marker='// ---- BUILD:END ----';const serve=s=>{assert(s.split(marker).length===2,'ambiguous probe insertion');return s.replace(CDN,'/three-r128.min.js').replace(marker,`(${probe.toString()})();\n`+marker);};
    const pages={base:serve(base),candidate:serve(candidate)};
    server=http.createServer((req,res)=>{const requested=new URL(req.url,'http://localhost').pathname;if(requested==='/three-r128.min.js'){res.setHeader('Content-Type','application/javascript');res.end(lib);}else if(pages[requested.slice(1)]){res.setHeader('Content-Type','text/html');res.end(pages[requested.slice(1)]);}else{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(port,'127.0.0.1',r));
    const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&fs.existsSync(p));assert(chrome,'Chrome unavailable');result.browser=execFileSync(chrome,['--version'],{encoding:'utf8'}).trim();result.node=process.version;
    browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${path.join(tmp,'chrome')}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:'ignore'});
    let ready=false;for(let i=0;i<75;i++){try{await json(`http://127.0.0.1:${debugPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}assert(ready,'Chrome did not initialize');c=await connect(debugPort);
    // Runs #399/#400 lost DOM touch delivery only after reusing a captured
    // portrait widget for landscape. A fresh sequential page owns each viewport;
    // no old touch/scroll/screencast transport is reused, and every tap still
    // requires a trusted DOM receipt. This is test isolation, not another worker.
    const inputEvidence={transports:[],taps:[]};
    async function freshPage(){
      assert(!c.errors.length,'browser exceptions '+JSON.stringify(c.errors));
      const old=c,next=await old.send('Target.createTarget',{url:'about:blank'});
      c=await connect(debugPort,next.targetId);
      c.transportEvidence=inputEvidence.transports;c.tapEvidence=inputEvidence.taps;
      await c.send('Page.bringToFront');
      await c.send('Target.closeTarget',{targetId:old.targetId});old.close();
    }
    const versions=base===candidate?['base']:['base','candidate'];
    for(const version of versions)for(const [w,h] of [[1280,720],[390,844],[844,390]]){await freshPage();console.log('MOTION '+version+' '+w+'x'+h);result.captures.push(await capture(c,`http://127.0.0.1:${port}`,version,w,h));}
    if(versions.length===2){result.lifecycle=[];for(const [w,h] of [[1280,720],[390,844],[844,390]]){await freshPage();result.lifecycle.push(await lifecycle(c,`http://127.0.0.1:${port}`,w,h));}}
    assert(!c.errors.length,'browser exceptions '+JSON.stringify(c.errors));result.errors=c.errors;
    if(versions.length===2){result.landingComparison=result.captures.filter(x=>x.name.startsWith('base-')).map(b=>{const a=result.captures.find(x=>x.name===b.name.replace('base-','candidate-'));const deltas=x=>x.landings.map(l=>Math.max(Math.abs(l.poseDelta[2]),Math.abs(l.poseDelta[3])));return {viewport:b.viewport,base:deltas(b),candidate:deltas(a),note:'Real browser schedules differ; exact-input/time gameplay parity is in physics-comparison.json.'};});}
    result.status=versions.length===1?'BASELINE_CAPTURED_NO_PRODUCT_CHANGE':'COMPARISON_CAPTURED';
    fs.writeFileSync(path.join(OUT,'index.html'),viewer(result.captures.map(x=>x.name)));
  }catch(e){result.status='FAIL';result.error=e.stack||String(e);if(c){result.errors=c.errors;try{const s=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,'failure.png'),Buffer.from(s.data,'base64'));write(path.join(OUT,'failure-samples.json'),await c.ev('__BH004Read()'));write(path.join(OUT,'failure-input.json'),await c.ev('({events:__BH004PointerEvents,armed:__touchArmed(),picker:__pickerIdx(),viewport:[innerWidth,innerHeight]})'));}catch(_){}}process.exitCode=1;}
  finally{if(c){write(path.join(OUT,'input-delivery.json'),{transports:c.transportEvidence||[],taps:c.tapEvidence||[]});}write(path.join(OUT,'result.json'),result);console.log(JSON.stringify(result,null,2));if(c)c.close();if(browser)browser.kill('SIGKILL');if(server)server.close();await sleep(200);fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={summarize,stats};
