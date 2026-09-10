#!/usr/bin/env node
// BH-008 exact-source Chrome evidence. Prerequisite fixtures wake Snoozles and
// position Pling at authored destinations; Peak's final terrace-to-keyboard
// segment is always driven by continuous ordinary KeyW movement.
const {spawn,execFileSync}=require('child_process');
const {mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,readdirSync}=require('fs');
const {join,resolve,basename}=require('path');
const {createHash}=require('crypto');
const http=require('http');

const root=resolve(__dirname,'..');
const dist=resolve(process.env.BELLHOP_DIST||join(root,'dist'));
const sourceRoot=resolve(process.env.BELLHOP_SOURCE_ROOT||root);
const outDir=resolve(process.env.BELLHOP_EVIDENCE_DIR||join(root,'artifacts','browser-clear-reliable-finishes'));
const label=process.env.BELLHOP_EVIDENCE_LABEL||'candidate';
const expectFailure=process.env.BELLHOP_EXPECT==='fail';
const authorizedBase=process.env.BELLHOP_AUTHORIZED_BASE||'60890b569593211013217c0be60974e041983e4a';
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Chrome/Chromium executable not found');
mkdirSync(outDir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(args,allow=false)=>{try{return execFileSync('git',args,{cwd:sourceRoot,encoding:'utf8'}).trim();}catch(e){if(allow)return '';throw e;}};
const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);
const authorizedTree=git(['rev-parse',authorizedBase+'^{tree}']);
let baseIsAncestor=true;try{execFileSync('git',['merge-base','--is-ancestor',authorizedBase,'HEAD'],{cwd:sourceRoot});}catch(e){baseIsAncestor=false;}
const diff=git(['diff','--no-ext-diff',authorizedBase+'...HEAD'],true);
const provenance={
  label,sourceRoot,dist,authorizedBase,authorizedTree,baseIsAncestor,head,tree,
  expectedEventHead:process.env.BELLHOP_EXPECTED_HEAD||null,
  expectedEventBase:process.env.BELLHOP_EXPECTED_BASE||null,
  checkoutStatus:git(['status','--porcelain']),
  generatedHtmlSha256:sha(readFileSync(join(dist,'index.html'))),
  diffSha256:sha(Buffer.from(diff)),changedFiles:git(['diff','--name-only',authorizedBase+'...HEAD'],true).split('\n').filter(Boolean),
  startedAt:new Date().toISOString()
};
writeFileSync(join(outDir,label+'-provenance.json'),JSON.stringify(provenance,null,2));
writeFileSync(join(outDir,label+'-exact-candidate.diff'),diff);

const port=8800+(process.pid%500),cdpPort=9300+(process.pid%500),userData='/tmp/bellhop-bh008-'+label+'-'+process.pid;
const base='http://127.0.0.1:'+port+'/index.html';
const mime={'.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  let file=null;
  if(u.pathname==='/'||u.pathname==='/index.html')file=join(dist,'index.html');
  else if(u.pathname==='/sheet.html')file=join(outDir,label+'-six-level-render-sheet.html');
  else if(u.pathname.startsWith('/evidence/'))file=join(outDir,basename(u.pathname));
  if(!file||!existsSync(file)){res.writeHead(404);res.end('not found');return;}
  const ext=file.slice(file.lastIndexOf('.'));res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(readFileSync(file));
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(c,m)=>{if(!c)throw new Error(m);};
function getJSON(url){return new Promise((resolve,reject)=>{http.get(url,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(e);}});}).on('error',reject);});}
async function openCDP(){
  const pages=await getJSON('http://127.0.0.1:'+cdpPort+'/json/list'),page=pages.find(x=>x.type==='page')||pages[0];
  if(!page||!page.webSocketDebuggerUrl)throw new Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',e=>rej(e.error||e),{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message',ev=>{const m=JSON.parse(typeof ev.data==='string'?ev.data:ev.data.toString());if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const mid=++id;pending.set(mid,{resolve,reject});ws.send(JSON.stringify({id:mid,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception&&r.exceptionDetails.exception.description)||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;};
  await send('Page.enable');await send('Runtime.enable');
  return {send,evaluate,close:()=>{try{ws.close();}catch(e){}}};
}
async function waitEval(cdp,expr,ms=15000){const t=Date.now();while(Date.now()-t<ms){try{if(await cdp.evaluate(expr))return;}catch(e){}await sleep(80);}throw new Error('timeout: '+expr);}
async function viewport(cdp,w,h,touch,reduced){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:!!touch,screenWidth:w,screenHeight:h});
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:!!touch,maxTouchPoints:touch?5:1});
  await cdp.send('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
}
async function navigate(cdp,w,h,touch=false,reduced=false){
  await viewport(cdp,w,h,touch,reduced);await cdp.send('Page.navigate',{url:base});
  await waitEval(cdp,"document.readyState==='complete'",25000);
  await waitEval(cdp,"typeof __started==='function'&&typeof __startGame==='function'&&__P&&__W&&document.getElementById('lvl5')",25000);
}
const keyMap={KeyW:['w',87],Space:[' ',32],Escape:['Escape',27],KeyK:['k',75]};
async function key(cdp,code,down){const q=keyMap[code];await cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:q[0],code,windowsVirtualKeyCode:q[1],nativeVirtualKeyCode:q[1],text:down&&q[0].length===1?q[0]:undefined,unmodifiedText:down&&q[0].length===1?q[0]:undefined});}
async function tapKey(cdp,code,ms=45){await key(cdp,code,true);await sleep(ms);await key(cdp,code,false);await sleep(70);}
async function capture(cdp,name){
  const r=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const b=Buffer.from(r.data,'base64');writeFileSync(join(outDir,name),b);return {name,sha256:sha(b),bytes:b.length,data:r.data};
}
async function captureMeta(cdp,name){const r=await capture(cdp,name);delete r.data;return r;}
async function startLevel(cdp,index){
  await cdp.evaluate('(()=>{__setPickerIdx('+index+');__startGame();return true;})()');
  await waitEval(cdp,'__started()&&__LEVEL().id==="level'+(index+1)+'"&&!__W.won',12000);
}
async function installFanfareCounter(cdp){
  await cdp.evaluate("(()=>{window.__bhFanfareCount=0;const old=__W.sfx.fanfare.bind(__W.sfx);__W.sfx.fanfare=()=>{window.__bhFanfareCount++;return old();};return true;})()");
}
async function wakeAll(cdp){
  const n=await cdp.evaluate('__W.snoozles.length');
  for(let i=0;i<n;i++){
    await cdp.evaluate('(()=>{const s=__W.snoozles['+i+'];__P.inv=99;__P.dead=false;__P.lavaRecT=0;__P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);__P.vel.set(0,0,0);__P.grounded=true;__P.bonkCD=0;return s.state;})()');
    await tapKey(cdp,'KeyK',45);
    await waitEval(cdp,'__W.snoozles['+i+'].state!=="sleep"',3500);
  }
}
async function place(cdp,x,y,z,settle=120){
  await cdp.evaluate('(()=>{const P=__P;P.inv=0;P.dead=false;P.hp=4;P.lavaRecT=0;P.pos.set('+x+','+y+','+z+');P.vel.set(0,0,0);P.grounded=true;__CAM.yaw=0;return true;})()');await sleep(settle);
}
async function state(cdp){return cdp.evaluate("(()=>({wall:Date.now(),game:+__gameTime().toFixed(3),x:+__P.pos.x.toFixed(3),y:+__P.pos.y.toFixed(3),z:+__P.pos.z.toFixed(3),hp:__P.hp,dead:!!__P.dead,lavaRecovery:+(__P.lavaRecT||0).toFixed(3),won:!!__W.won,fanfare:window.__bhFanfareCount||0}))()");}
async function finishDOM(cdp){
  return cdp.evaluate("(()=>{const win=document.getElementById('win'),card=win.querySelector('.finish-card'),big=win.querySelector('.big'),sm=win.querySelector('.sm');const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility};};const overlap=(a,b)=>!!(a&&b&&Math.max(a.left,b.left)<Math.min(a.right,b.right)&&Math.max(a.top,b.top)<Math.min(a.bottom,b.bottom));const wr=rect(win),cr=rect(card),br=rect(big),sr=rect(sm),controls={};for(const id of ['bA','bB','bY','bX','pauseBtn','mute','hint'])controls[id]=rect(document.getElementById(id));const bs=getComputedStyle(big),cs=card?getComputedStyle(card):null,ws=getComputedStyle(win);return {viewport:{w:innerWidth,h:innerHeight},title:big&&big.textContent.trim(),subtitle:sm&&sm.textContent.trim(),aria:{role:win.getAttribute('role'),live:win.getAttribute('aria-live')},rects:{win:wr,card:cr,big:br,subtitle:sr,controls},styles:{title:{color:bs.color,fontSize:bs.fontSize,textStroke:bs.webkitTextStroke||'',textStrokeWidth:bs.webkitTextStrokeWidth||'0px',textShadow:bs.textShadow},card:cs&&{background:cs.backgroundColor,border:cs.border,borderRadius:cs.borderRadius,boxShadow:cs.boxShadow,animationName:cs.animationName,animationDuration:cs.animationDuration},win:{background:ws.backgroundColor,opacity:ws.opacity,display:ws.display}},bounds:!!cr&&cr.left>=-0.5&&cr.right<=innerWidth+0.5&&cr.top>=-0.5&&cr.bottom<=innerHeight+0.5,overlaps:Object.fromEntries(Object.entries(controls).map(([id,r])=>[id,r&&r.display!=='none'&&r.visibility!=='hidden'&&overlap(cr,r)])),game:{level:__LEVEL().id,won:__W.won,hp:__P.hp,dead:__P.dead,paused:__paused(),audioWin:__AU.win,camMode:__CAM.mode,fanfare:window.__bhFanfareCount||0},authored:{meadow:!!(__W.WM&&__W.WM.party&&__W.RAINBOW&&__W.RAINBOW.visible),deep:!!(__W.conch&&__W.conch.rainbow&&__W.conch.rainbow.visible),peak:!!(__W.organ&&__W.organ.playing&&__W.organ.eruptionActive),space:!!(__SPACE.blackHoleFinish&&__SPACE.blackHoleFinish.voidActive),desert:!!(__DESERT.state&&__DESERT.state.oasisGroup&&__DESERT.state.oasisGroup.visible),winter:!!(__WINTER.state&&__WINTER.state.party&&__WINTER.tree&&__WINTER.tree.party)}};})()");
}
async function pixelCounts(cdp,pngBase64){
  const expr="(async()=>{const im=new Image();im.src='data:image/png;base64,"+pngBase64+"';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let teal=0,cream=0,gold=0;for(let i=0;i<d.length;i+=4){if(Math.abs(d[i]-21)<=3&&Math.abs(d[i+1]-94)<=3&&Math.abs(d[i+2]-100)<=3)teal++;if(Math.abs(d[i]-255)<=3&&Math.abs(d[i+1]-248)<=3&&Math.abs(d[i+2]-230)<=3)cream++;if(Math.abs(d[i]-245)<=3&&Math.abs(d[i+1]-180)<=3&&d[i+2]<=4)gold++;}return {width:c.width,height:c.height,tealPixels:teal,creamPixels:cream,goldPixels:gold};})()";
  return cdp.evaluate(expr);
}
async function finishShot(cdp,name){
  await sleep(620);const dom=await finishDOM(cdp),shot=await capture(cdp,name);shot.pixels=await pixelCounts(cdp,shot.data);delete shot.data;return {dom,shot};
}
async function completePeak(cdp,journeyPrefix){
  await installFanfareCounter(cdp);await wakeAll(cdp);
  const active=await cdp.evaluate('__W.organ.active&&!__W.won');assert(active,'Peak Organ did not activate at 4/4');
  await place(cdp,0,44.4,-608,650);
  const points=[await state(cdp)],frames=[await captureMeta(cdp,journeyPrefix+'-01-final-terrace.png')];let approachCaptured=false,fallCaptured=false,recoveryCaptured=false;
  await key(cdp,'KeyW',true);const t=Date.now();let minHp=4,maxRecovery=0;
  while(Date.now()-t<5200){
    const s=await state(cdp);points.push(s);minHp=Math.min(minHp,s.hp);maxRecovery=Math.max(maxRecovery,s.lavaRecovery);
    if(!approachCaptured&&s.z<=-626.0&&s.y>43.5){frames.push(await captureMeta(cdp,journeyPrefix+'-02-visible-keyboard-approach.png'));approachCaptured=true;}
    if(!fallCaptured&&s.y<42.5){frames.push(await captureMeta(cdp,journeyPrefix+'-02-gap-fall.png'));fallCaptured=true;}
    if(!recoveryCaptured&&(s.hp<4||s.lavaRecovery>0)){frames.push(await captureMeta(cdp,journeyPrefix+'-03-lava-recovery.png'));recoveryCaptured=true;}
    if(s.won)break;await sleep(45);
  }
  await key(cdp,'KeyW',false);const final=await state(cdp);points.push(final);
  if(final.won)frames.push(await captureMeta(cdp,journeyPrefix+'-03-victory.png'));
  await sleep(350);const settled=await state(cdp);
  return {fixture:'Four Snoozles completed by positioned normal spin input; start settled at final terrace z=-608; final segment continuous KeyW only',points,frames,minHp,maxRecovery,final,settled,approachCaptured,fallCaptured,recoveryCaptured};
}
async function completeLevel(cdp,index,prefix){
  await startLevel(cdp,index);
  if(index===2)return completePeak(cdp,prefix+'-peak');
  await installFanfareCounter(cdp);
  await wakeAll(cdp);
  if(index===1)await cdp.evaluate("(()=>{const t=__W.conch.trigger;__P.pos.set(t.x,t.y,t.z);__P.vel.set(0,0,0);__P.grounded=true;return true;})()");
  else if(index===3)await cdp.evaluate("(()=>{const b=__SPACE.blackHoleFinish;__P.pos.set(b.x,b.y-.55,b.z);__P.vel.set(0,0,0);__P.grounded=false;return true;})()");
  else if(index===4)await cdp.evaluate("(()=>{const q=__W.quicksands.find(x=>x.role==='final');__P.pos.set(q.x,q.y+.15,q.z);__P.vel.set(0,0,0);__P.grounded=true;return true;})()");
  else if(index===5)await cdp.evaluate("(()=>{__WINTER.sled.completed=true;const t=__WINTER.tree;__P.pos.set(t.x,t.y+.2,t.z+1);__P.vel.set(0,0,0);__P.grounded=true;return true;})()");
  await waitEval(cdp,'__W.won',index===3?12000:7000);
  return {fixture:index===0?'All Snoozles woken with normal spin input':(index===5?'All Snoozles woken with normal spin input; sled completion is a labelled prerequisite fixture':'All Snoozles woken with normal spin input; Pling positioned at authored finish destination'),final:await state(cdp)};
}
function domPass(dom,reduced){
  if(!dom||dom.title!=='You did it!'||!dom.subtitle||!dom.rects.card||!dom.bounds)return false;
  if(dom.styles.title.color!=='rgb(21, 94, 100)'||dom.styles.title.textShadow!=='none'||parseFloat(dom.styles.title.textStrokeWidth)!==0)return false;
  if(dom.styles.card.background!=='rgb(255, 248, 230)'||Object.values(dom.overlaps).some(Boolean))return false;
  if(reduced&&dom.styles.card.animationName!=='none')return false;
  return true;
}
async function baselineRun(cdp,result){
  await navigate(cdp,844,390,true,false);await startLevel(cdp,0);await installFanfareCounter(cdp);await wakeAll(cdp);await waitEval(cdp,'__W.won',5000);
  const presentation=await finishShot(cdp,'baseline-844x390-level1-meadow-victory.png');result.presentation=presentation;
  await navigate(cdp,844,390,false,false);await startLevel(cdp,2);result.peak=await completePeak(cdp,'baseline-peak');
  const presentationFailed=!domPass(presentation.dom,false);
  const peakFailed=!result.peak.final.won&&(result.peak.minHp<4||result.peak.maxRecovery>0||result.peak.fallCaptured);
  result.expectedFailures={presentationFailed,peakFailed};
  assert(presentationFailed,'exact base unexpectedly passed finish-presentation requirement');
  assert(peakFailed,'exact base unexpectedly passed ordinary Peak final approach');
  result.status='EXPECTED_FAILURE_CONFIRMED';
}
async function candidateRun(cdp,result){
  const names=['meadow','deep','peak','space','desert','snowbound'];
  const expected=['Everyone is awake. Look at that rainbow!','Everyone is awake. The Conch is singing!','The mountain is singing!','The stars are singing!','You found the green oasis!','Winter wonderland saved! Every Snoozle is awake!'];
  result.levels=[];
  for(let i=0;i<6;i++){
    await navigate(cdp,844,390,true,false);const completion=await completeLevel(cdp,i,'candidate');
    await cdp.evaluate("document.body.classList.add('touch')");
    const evidence=await finishShot(cdp,'candidate-844x390-level'+(i+1)+'-'+names[i]+'-victory.png');
    assert(evidence.dom.subtitle===expected[i],'wrong '+names[i]+' subtitle');
    assert(domPass(evidence.dom,false),names[i]+' finish DOM/geometry failed');
    assert(evidence.dom.game.won&&evidence.dom.game.audioWin&&evidence.dom.game.fanfare===1,names[i]+' win/audio/once state failed');
    assert(evidence.dom.authored[names[i]==='snowbound'?'winter':names[i]],names[i]+' authored celebration missing');
    assert(evidence.shot.pixels.tealPixels>80&&evidence.shot.pixels.creamPixels>1200,names[i]+' rendered solid teal/cream pixels missing');
    result.levels.push({name:names[i],expectedSubtitle:expected[i],completion,evidence});
  }
  const views=[{name:'390x844',w:390,h:844,touch:true,reduced:false},{name:'1280x720',w:1280,h:720,touch:false,reduced:false},{name:'932x430',w:932,h:430,touch:true,reduced:false},{name:'667x320-reduced-motion',w:667,h:320,touch:true,reduced:true}];
  result.responsive=[];
  for(const v of views){
    await navigate(cdp,v.w,v.h,v.touch,v.reduced);await completeLevel(cdp,0,'candidate-'+v.name);if(v.touch)await cdp.evaluate("document.body.classList.add('touch','web-hero-equipped')");
    const e=await finishShot(cdp,'candidate-'+v.name+'-representative-victory.png');assert(domPass(e.dom,v.reduced),v.name+' responsive/reduced-motion check failed');result.responsive.push({...v,evidence:e});
  }
  await navigate(cdp,390,844,true,false);await completeLevel(cdp,0,'candidate-resize');await viewport(cdp,932,430,true,false);await sleep(250);await cdp.evaluate("document.body.classList.add('touch','web-hero-equipped')");
  result.resize=await finishDOM(cdp);assert(domPass(result.resize,false)&&result.resize.subtitle===expected[0],'active finish failed orientation/resize');
  await key(cdp,'Escape',true);await key(cdp,'Escape',false);await sleep(120);assert(!(await cdp.evaluate('__paused()')),'pause opened over active finish');

  result.returns={};
  async function freshMeadow(){await navigate(cdp,844,390,true,false);await startLevel(cdp,0);await installFanfareCounter(cdp);await wakeAll(cdp);await waitEval(cdp,'__W.won',5000);const observed=await cdp.evaluate('__gameTime()');await waitEval(cdp,'__gameTime()>'+JSON.stringify(observed+3.67),10000);}
  const clean="!__started()&&!__W.won&&getComputedStyle(document.getElementById('win')).display==='none'&&!__INPUT_STATE().jump&&!__INPUT_STATE().jumpHeld&&!__INPUT_STATE().keysDown.length";
  await freshMeadow();await tapKey(cdp,'Space');await waitEval(cdp,clean,3000);result.returns.keyboard=await cdp.evaluate('({clean:'+clean+',input:__INPUT_STATE()})');
  await cdp.evaluate('(()=>{__setPickerIdx(1);__startGame();return true;})()');await waitEval(cdp,'__started()&&__LEVEL().id==="level2"',4000);result.returns.restart=await cdp.evaluate("({level:__LEVEL().id,won:__W.won,overlay:getComputedStyle(document.getElementById('win')).display,input:__INPUT_STATE(),subtitle:__W.FINISH.winMsg})");assert(!result.returns.restart.won&&result.returns.restart.overlay==='none','restart/level-switch retained finish state');
  await freshMeadow();const r=await cdp.evaluate("(()=>{const e=document.getElementById('bA'),q=e.getBoundingClientRect();document.body.classList.add('touch');return {x:q.left+q.width/2,y:q.top+q.height/2};})()");await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y,radiusX:4,radiusY:4,force:1,id:1}]});await sleep(55);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await waitEval(cdp,clean,3000);result.returns.touch=await cdp.evaluate('({clean:'+clean+',input:__INPUT_STATE()})');
  await freshMeadow();await cdp.evaluate("(()=>{window.__bhPad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__bhPad]});return true;})()");await sleep(120);await cdp.evaluate('window.__bhPad.buttons[0].pressed=true');await waitEval(cdp,clean,3000);result.returns.gamepad=await cdp.evaluate('({clean:'+clean+',input:__INPUT_STATE()})');
  await navigate(cdp,844,390,false,false);await startLevel(cdp,0);await installFanfareCounter(cdp);await wakeAll(cdp);await waitEval(cdp,'__W.won',5000);const autoStart=Date.now(),autoObservedGame=await cdp.evaluate('__gameTime()');await waitEval(cdp,clean,40000);result.returns.auto={clean:true,elapsedMs:Date.now()-autoStart,observedGame:autoObservedGame,input:await cdp.evaluate('__INPUT_STATE()')};

  const cards=result.levels.map((x,i)=>'<figure><img src="/evidence/candidate-844x390-level'+(i+1)+'-'+names[i]+'-victory.png"><figcaption>'+(i+1)+'. '+names[i]+' — '+expected[i]+'</figcaption></figure>').join('');
  const sheet='<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#173b4c;color:#fff;font:700 14px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;background:#fff8e6;color:#1c2b33;border:3px solid #f5b400;border-radius:12px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:7px 9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><main>'+cards+'</main>';
  writeFileSync(join(outDir,'candidate-six-level-render-sheet.html'),sheet);
  await viewport(cdp,1320,720,false,false);await cdp.send('Page.navigate',{url:'http://127.0.0.1:'+port+'/sheet.html'});await waitEval(cdp,"document.readyState==='complete'&&document.images.length===6&&Array.from(document.images).every(i=>i.complete)",8000);
  result.renderSheet=await captureMeta(cdp,'candidate-844x390-six-level-render-sheet.png');
  result.status='PASS';
}
function manifest(){const rows=[];for(const name of readdirSync(outDir).sort()){if(name===label+'-manifest.json')continue;const b=readFileSync(join(outDir,name));rows.push({name,bytes:b.length,sha256:sha(b)});}writeFileSync(join(outDir,label+'-manifest.json'),JSON.stringify({label,createdAt:new Date().toISOString(),files:rows},null,2));}
async function main(){
  assert(existsSync(join(dist,'index.html')),'missing built dist/index.html');
  assert(authorizedTree==='df863400c7a9e5e02785f439c192443bfe546544','authorized base tree mismatch');
  assert(baseIsAncestor,'authorized base is not an ancestor of checkout');
  assert(!provenance.expectedEventHead||head===provenance.expectedEventHead,'checkout HEAD differs from expected event head');
  if(expectFailure)assert(head===authorizedBase,'baseline source is not exact authorized base');
  await new Promise((res,rej)=>server.listen(port,'127.0.0.1',res).once('error',rej));rmSync(userData,{recursive:true,force:true});
  let chromeErr='';const cp=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+cdpPort,'--user-data-dir='+userData,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1320,844','about:blank'],{stdio:['ignore','ignore','pipe']});
  if(cp.stderr)cp.stderr.on('data',d=>chromeErr=(chromeErr+d.toString()).slice(-16000));
  let cdp;const result={label,expectFailure,provenance,status:'RUNNING',startedAt:new Date().toISOString()};
  try{
    let ready=false;for(let i=0;i<100;i++){if(cp.exitCode!==null)throw new Error('Chrome exited '+cp.exitCode+': '+chromeErr);try{await getJSON('http://127.0.0.1:'+cdpPort+'/json/version');ready=true;break;}catch(e){await sleep(150);}}if(!ready)throw new Error('Chrome CDP did not become ready: '+chromeErr);
    cdp=await openCDP();if(expectFailure)await baselineRun(cdp,result);else await candidateRun(cdp,result);
    result.finishedAt=new Date().toISOString();writeFileSync(join(outDir,label+'-result.json'),JSON.stringify(result,null,2));manifest();
    console.log('BH008_CLEAR_RELIABLE_FINISHES_'+label.toUpperCase()+'='+result.status);console.log(JSON.stringify({status:result.status,head,tree,label}));
  }finally{if(cdp)cdp.close();try{cp.kill('SIGKILL');}catch(e){}server.close();await sleep(160);try{rmSync(userData,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch(e){console.warn('cleanup warning: '+e.message);}}
}
main().catch(e=>{const failure={label,status:'FAIL',error:String(e&&e.stack||e),provenance,finishedAt:new Date().toISOString()};writeFileSync(join(outDir,label+'-failure.json'),JSON.stringify(failure,null,2));try{manifest();}catch(_){}console.error('BH008_CLEAR_RELIABLE_FINISHES_'+label.toUpperCase()+'=FAIL');console.error(e&&e.stack||e);process.exit(1);});
