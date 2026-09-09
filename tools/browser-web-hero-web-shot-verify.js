#!/usr/bin/env node
// BH-007 exact-product Chrome/CDP verification and timestamp-faithful evidence.
// Positioning fixtures are labelled; input, projectile collision, capture and
// defeat run through the shipped browser product.
const {spawn,spawnSync}=require('child_process');
const {createHash}=require('crypto');
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.join(root,'artifacts','browser-web-hero-web-shot');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/local/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome/Chromium executable not found; set CHROME_BIN');
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('generated product missing; run node build.js');
fs.mkdirSync(out,{recursive:true});
const port=8920+(process.pid%200),debugPort=9520+(process.pid%200),profile='/tmp/bellhop-bh007-'+process.pid,url='http://127.0.0.1:'+port+'/index.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});return r.status===0?r.stdout.trim():null;}
let event=null;try{if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));}catch(error){}
const eventHead=event&&event.pull_request&&event.pull_request.head.sha||null,checkout=git(['rev-parse','HEAD']),checkoutTree=git(['rev-parse','HEAD^{tree}']);
const candidateHead=eventHead||checkout,candidateTree=git(['rev-parse',candidateHead+'^{tree}']);
const builtHtml=fs.readFileSync(path.join(dist,'index.html'));
const report={startedAt:new Date().toISOString(),source:{checkout,checkoutTree,candidateHead,candidateTree,eventBase:event&&event.pull_request&&event.pull_request.base.sha||null,githubSha:process.env.GITHUB_SHA||null,syntheticMerge:!!(eventHead&&checkout!==eventHead),status:git(['status','--short']),generatedHtmlSha256:createHash('sha256').update(builtHtml).digest('hex')},runtime:{node:process.version,chrome,method:'Chrome CDP with browser-level keyboard, touch and emulated standard Gamepad API; no physical device or WebKit'},viewports:[],journeys:[],levelMatrix:[],sequence:[],screenshots:[],checks:[],failures:[],teardown:[],status:'RUNNING'};
function check(name,ok,details){const row={name,ok:!!ok,details:details===undefined?null:details};report.checks.push(row);if(!row.ok)report.failures.push(row);return row.ok;}
function assert(ok,name,details){if(!check(name,ok,details))throw Error(name);}
function json(uri){return new Promise((resolve,reject)=>http.get(uri,res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>{try{resolve(JSON.parse(s));}catch(e){reject(e);}});}).on('error',reject));}
function writeEvidence(){
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(out,'sequence-manifest.json'),JSON.stringify({status:report.status,source:report.source,runtime:report.runtime,sequence:report.sequence,failures:report.failures},null,2));
}
function exited(proc){return !proc||proc.exitCode!==null||proc.signalCode!==null;}
function waitForExit(proc,timeout){
  if(exited(proc))return Promise.resolve(true);
  return new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);resolve(true);};proc.once('exit',done);timer=setTimeout(()=>{proc.removeListener('exit',done);resolve(exited(proc));},timeout);});
}
function groupAlive(proc){
  if(!proc||!proc.pid||process.platform==='win32')return false;
  try{process.kill(-proc.pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}
}
async function waitForGroupExit(proc,timeout){const at=Date.now();while(groupAlive(proc)&&Date.now()-at<timeout)await sleep(50);return !groupAlive(proc);}
function signalProcess(proc,signal,group){
  if(group&&process.platform!=='win32'){try{process.kill(-proc.pid,signal);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}}
  return proc.kill(signal);
}
async function stopProcess(proc,name,group=false){
  const row={name,pid:proc&&proc.pid||null,group,termSent:false,exitedAfterTerm:false,killSent:false,exitedAfterKill:false};
  try{
    const complete=()=>exited(proc)&&(!group||!groupAlive(proc));row.exitedAfterTerm=complete();
    if(!row.exitedAfterTerm){try{row.termSent=signalProcess(proc,'SIGTERM',group);}catch(error){row.termError=error.message;}await Promise.all([waitForExit(proc,2500),group?waitForGroupExit(proc,2500):Promise.resolve(true)]);row.exitedAfterTerm=complete();}
    if(!row.exitedAfterTerm){try{row.killSent=signalProcess(proc,'SIGKILL',group);}catch(error){row.killError=error.message;}await Promise.all([waitForExit(proc,2500),group?waitForGroupExit(proc,2500):Promise.resolve(true)]);row.exitedAfterKill=complete();}
  }catch(error){row.stopError=error.stack||String(error);}
  row.exitCode=proc&&proc.exitCode;row.signalCode=proc&&proc.signalCode;
  try{row.groupAlive=group?groupAlive(proc):false;}catch(error){row.groupAlive=null;row.groupProbeError=error.stack||String(error);}
  row.ok=exited(proc)&&row.groupAlive===false&&!row.stopError&&!row.groupProbeError;return row;
}
async function connect(){
  const pages=await json('http://127.0.0.1:'+debugPort+'/json/list'),page=pages.find(p=>p.type==='page')||pages[0];if(!page)throw Error('no CDP page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;const pending=new Map(),errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception&&r.exceptionDetails.exception.description||JSON.stringify(r.exceptionDetails));return r.result&&r.result.value;};
  const shot=async name=>{if(typeof name!=='string'||!name)throw Error('invalid screenshot name '+String(name));const file=name+'.png';if(report.screenshots.some(x=>x.file===file))throw Error('duplicate screenshot name '+file);const r=await send('Page.captureScreenshot',{format:'png'}),b=Buffer.from(r.data,'base64');fs.writeFileSync(path.join(out,file),b);const row={file,bytes:b.length,pixelWidth:b.readUInt32BE(16),pixelHeight:b.readUInt32BE(20),sha256:createHash('sha256').update(b).digest('hex')};report.screenshots.push(row);return row;};
  await send('Page.enable');await send('Runtime.enable');return {send,ev,shot,errors,close:()=>ws.close()};
}
async function wait(c,expr,ms=10000){const at=Date.now();let why='';while(Date.now()-at<ms){try{if(await c.ev(expr))return;}catch(e){why=e.message;}await sleep(80);}throw Error('timeout '+expr+(why?' / '+why:''));}
async function ordinaryApproach(c){
  const read=()=>c.ev("(()=>{const p=__P.pos,g=__W.gloops[0];return {gameTime:__gameTime(),distance:Math.hypot(p.x-g.x,p.z-g.z),player:{x:p.x,y:p.y,z:p.z},target:{x:g.x,y:g.y,z:g.z}}})()"),initial=await read(),wallStart=Date.now(),samples=[initial];let latest=initial,nextSample=initial.gameTime+.5;
  while(Date.now()-wallStart<20000){latest=await read();if(latest.gameTime>=nextSample){samples.push(latest);nextSample+=.5;}if(latest.distance<13)return {wallMs:Date.now()-wallStart,gameSeconds:latest.gameTime-initial.gameTime,initial,finish:latest,samples};if(latest.gameTime-initial.gameTime>=4.5)break;await sleep(80);}
  samples.push(latest);throw Error('ordinary KeyW approach did not reach distance <13 '+JSON.stringify({wallMs:Date.now()-wallStart,gameSeconds:latest.gameTime-initial.gameTime,initial,finish:latest,samples}));
}
async function viewport(c,name,width,height,dpr,touch){await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:touch,screenWidth:width,screenHeight:height,screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0}});await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});report.viewports.push({name,requested:{width,height,dpr,touch}});}
async function fresh(c,name){await c.send('Page.navigate',{url:url+'?bh007='+encodeURIComponent(name)+'&t='+Date.now()});await wait(c,"document.readyState==='complete'&&typeof __WEB_SHOT==='object'&&document.getElementById('lvl5')",20000);await sleep(180);const v=await c.ev("({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualViewport:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null,release:document.getElementById('ver').textContent})");report.viewports[report.viewports.length-1].observed=v;}
async function point(c,id){return c.ev("(()=>{const e=document.getElementById("+JSON.stringify(id)+");if(!e)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,display:getComputedStyle(e).display};})()");}
async function click(c,id,touch=false){const p=await point(c,id);assert(p&&p.w>0&&p.h>0&&p.display!=='none','visible control '+id,p);if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1,radiusX:4,radiusY:4,force:1}]});await sleep(45);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});}await sleep(130);}
const keys={KeyX:['x',88],KeyW:['w',87],Escape:['Escape',27]};
async function key(c,code,down){const k=keys[code];await c.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k[0],code,windowsVirtualKeyCode:k[1],nativeVirtualKeyCode:k[1],text:down&&k[0].length===1?k[0]:undefined});}
async function tapKey(c,code,hold=55){await key(c,code,true);await sleep(hold);await key(c,code,false);await sleep(70);}
async function pad(c,index){await c.ev('__bh007Pad.buttons['+index+'].pressed=true;__bh007Pad.timestamp=performance.now()');await sleep(90);await c.ev('__bh007Pad.buttons['+index+'].pressed=false;__bh007Pad.timestamp=performance.now()');await sleep(100);}
async function equip(c,id,touch=false){await click(c,'skinsOpen',touch);await wait(c,'__SKINS().open');await click(c,'skin-'+id,touch);await click(c,'skinUse',touch);await wait(c,'!__SKINS().open&&__SKINS().equipped==='+JSON.stringify(id));}
async function startLevel(c,index,touch=false){await click(c,'lvl'+index,touch);if(!await c.ev('__started()'))await click(c,'lvl'+index,touch);await wait(c,"__started()&&__LEVEL().id==='level"+(index+1)+"'");}
async function pauseMenu(c){await tapKey(c,'Escape');await wait(c,'__paused()');await click(c,'pauseMenu');await wait(c,'!__started()&&!__paused()');}
async function wrapPixels(c){return c.ev("(()=>{const root=__PLAYER().parent,w=root.children.find(o=>o.userData&&o.userData.webWrap);if(!w)return null;const box=new THREE.Box3().setFromObject(w),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),cam=new THREE.PerspectiveCamera(__CAM.fov||60,innerWidth/innerHeight,.1,220);cam.position.copy(__CAM.pos);cam.lookAt(__CAM.look);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();const p=center.clone().project(cam),px=center.clone().add(new THREE.Vector3(size.x/2,0,0)).project(cam),py=center.clone().add(new THREE.Vector3(0,size.y/2,0)).project(cam);let meshes=0,wireframes=0;w.traverse(o=>{if(o.isMesh){meshes++;if(o.material&&o.material.wireframe)wireframes++;}});return {center:p,widthPx:Math.abs(px.x-p.x)*innerWidth,heightPx:Math.abs(py.y-p.y)*innerHeight,meshes,wireframes,visible:w.visible!==false};})()");}
async function touchLayout(c,label){const state=await c.ev("(()=>{const ids=['bA','bB','bY','bX'],boxes=ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(e).display}}),hits=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j],area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));if(area>.5)hits.push({a:a.id,b:b.id,area});}return {viewport:{width:innerWidth,height:innerHeight},boxes,hits,newActionHits:hits.filter(x=>x.a==='bX'||x.b==='bX')};})()");assert(state.boxes.every(b=>b.display!=='none'&&b.width>=60&&b.height>=60&&b.left>=0&&b.top>=0&&b.right<=state.viewport.width&&b.bottom<=state.viewport.height)&&state.newActionHits.length===0,label+' touch actions visible/in bounds and new X separated',state);return state;}
async function captureFamily(c,family,input,label,screenshot){
  const target=await c.ev('__WEB_SHOT.eligible().find(t=>t.family==='+JSON.stringify(family)+')');assert(target,'eligible '+family,target);
  const aimed=await c.ev('__WEB_SHOT.evidenceAimAt('+JSON.stringify(family)+','+target.index+',4.5)');assert(aimed,'positioning fixture aimed '+family,aimed);await sleep(260);
  const prior=await c.ev("__WEB_SHOT.snapshot().events.filter(e=>e.type==='wrapped').length");
  if(input==='keyboard')await tapKey(c,'KeyX');else if(input==='gamepad')await pad(c,2);else await click(c,'bX',true);
  await wait(c,"__WEB_SHOT.snapshot().events.filter(e=>e.type==='wrapped').length>"+prior);
  const wrapped=await c.ev('__WEB_SHOT.snapshot()'),pixels=await wrapPixels(c);assert(wrapped.captures.some(x=>x.family===family)&&pixels&&pixels.visible&&pixels.meshes>=4&&pixels.wireframes>=4&&pixels.widthPx>=14&&pixels.heightPx>=14&&Math.abs(pixels.center.x)<1&&Math.abs(pixels.center.y)<1,'recognizable enclosing wrap '+family,{captures:wrapped.captures,pixels});
  const image=screenshot?await c.shot(label):null;
  await wait(c,"__WEB_SHOT.snapshot().events.some(e=>e.type==='disappeared'&&e.family==="+JSON.stringify(family)+")",4000);
  const done=await c.ev('__WEB_SHOT.snapshot()');assert(!done.captures.some(x=>x.family===family),'timed disappearance '+family,done.events.slice(-4));
  const row={family,input,level:await c.ev('__LEVEL().id'),positioning:'explicit evidence fixture only; shipped input/projectile/collision/capture/defeat paths remain real',targetIndex:target.index,wrapPixels:pixels,screenshot:image,eventTail:done.events.slice(-4)};report.levelMatrix.push(row);return row;
}
async function scenario(name,fn){try{const details=await fn();report.journeys.push({name,status:'PASS',details:details||null});}catch(error){check(name,false,error.stack||String(error));report.journeys.push({name,status:'FAIL',error:error.message});}}
async function sequence(c){
  await viewport(c,'1280x720',1280,720,1,false);await fresh(c,'sequence');await startLevel(c,0);const t=await c.ev("__WEB_SHOT.eligible().find(x=>x.family==='gloop')");await c.ev("__WEB_SHOT.evidenceAimAt('gloop',"+t.index+",6)");await sleep(320);
  const snap=async(stage,file)=>{const image=await c.shot(file),state=await c.ev('({gameTime:__gameTime(),web:__WEB_SHOT.snapshot()})'),row={stage,file:image.file,gameTime:state.gameTime,eventTail:state.web.events.slice(-4),shots:state.web.shots,captures:state.web.captures};report.sequence.push(row);return row;};
  await snap('ready','sequence-1280x720-00-ready');await key(c,'KeyX',true);await sleep(38);await snap('projectile-in-flight','sequence-1280x720-01-projectile');await key(c,'KeyX',false);await wait(c,"__WEB_SHOT.snapshot().captures.some(x=>x.family==='gloop')");const pixels=await wrapPixels(c);assert(pixels&&pixels.widthPx>=18&&pixels.heightPx>=18,'ordinary-camera wrap readable at desktop',pixels);await snap('wrapped','sequence-1280x720-02-wrapped');await wait(c,"__WEB_SHOT.snapshot().events.some(e=>e.type==='disappeared'&&e.family==='gloop')",4000);await snap('disappeared','sequence-1280x720-03-disappeared');
  const types=report.sequence.flatMap(x=>x.eventTail.map(e=>e.type));assert(types.includes('shot')&&types.includes('wrapped')&&types.includes('disappeared'),'timestamp-faithful sequence includes shot → wrap → disappearance',report.sequence);return {target:t,pixels};
}
async function main(){
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:250});let chromeError='';const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dist,stdio:'ignore'}),browser=spawn(chrome,['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','about:blank'],{stdio:['ignore','ignore','pipe'],detached:process.platform!=='win32'});if(browser.stderr)browser.stderr.on('data',d=>chromeError=(chromeError+d).slice(-12000));let c;
  try{
    let version;for(let i=0;i<100&&!version;i++){if(browser.exitCode!==null)throw Error('Chrome exited '+browser.exitCode+' '+chromeError);try{version=await json('http://127.0.0.1:'+debugPort+'/json/version');}catch(error){await sleep(160);}}if(!version)throw Error('Chrome CDP not ready '+chromeError);report.runtime.protocol=version;c=await connect();
    await c.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{const buttons=Array.from({length:18},()=>({pressed:false,touched:false,value:0}));window.__bh007Pad={id:'BH-007 virtual standard gamepad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__bh007Pad]});})();"});
    assert(report.source.status==='', 'clean tested checkout',report.source.status);assert(candidateTree&&checkoutTree===candidateTree,'tested checkout tree equals exact candidate tree',report.source);
    await viewport(c,'1280x720-bootstrap',1280,720,1,false);await fresh(c,'bootstrap');await c.ev('localStorage.clear()');await fresh(c,'eligibility');
    await scenario('preview/cancel cannot grant',async()=>{await click(c,'skinsOpen');await click(c,'skin-web-hero');assert(await c.ev("__SKINS().pending==='web-hero'&&__SKINS().equipped==='classic'"),'preview separate from equipped');await click(c,'skinBack');await startLevel(c,0);await tapKey(c,'KeyX');await sleep(150);assert(await c.ev("!__WEB_SHOT.snapshot().equipped&&__WEB_SHOT.snapshot().events.every(e=>e.type!=='shot')"),'cancelled preview has no ability');await pauseMenu(c);});
    await scenario('confirm and persistent reload',async()=>{await equip(c,'web-hero');await startLevel(c,0);assert(await c.ev("__WEB_SHOT.snapshot().available&&localStorage.getItem('bellhop.robotSkin')==='web-hero'"),'confirmed persisted authority');await fresh(c,'reload');await startLevel(c,0);assert(await c.ev("__SKINS().equipped==='web-hero'&&__WEB_SHOT.snapshot().available"),'reload restored ability');return {equipped:await c.ev('__SKINS().equipped')};});
    await scenario('ordinary Meadow keyboard journey',async()=>{let approach;await key(c,'KeyW',true);try{approach=await ordinaryApproach(c);}finally{await key(c,'KeyW',false);}await tapKey(c,'KeyX');await wait(c,"__WEB_SHOT.snapshot().events.some(e=>e.type==='wrapped'&&e.family==='gloop')",3000);return {method:'real menu start, continuous KeyW traversal through entrance, then KeyX; no position assignment',approach,events:await c.ev('__WEB_SHOT.snapshot().events')};});
    await scenario('timestamp-faithful desktop sequence',()=>sequence(c));
    const levels=[{i:0,f:['gloop']},{i:1,f:['shark','spikefish']},{i:2,f:['cinder','wisp']},{i:3,f:['saucer']},{i:4,f:[]},{i:5,f:['snowman']}];
    for(const row of levels)await scenario('level '+(row.i+1)+' hostile coverage',async()=>{await viewport(c,'level'+(row.i+1)+'-1280x720',1280,720,1,false);await fresh(c,'level'+(row.i+1));await startLevel(c,row.i);const actual=[...new Set((await c.ev('__WEB_SHOT.eligible()')).map(x=>x.family))];assert(JSON.stringify(actual)===JSON.stringify(row.f),'exact level enemy matrix '+(row.i+1),{expected:row.f,actual});if(!row.f.length){await tapKey(c,'KeyX');await wait(c,"__WEB_SHOT.snapshot().events.some(e=>e.type==='shot-ended')",3000);assert(await c.ev("__WEB_SHOT.snapshot().events.every(e=>e.type!=='wrapped')"),'Desert real-input miss has no capture');report.levelMatrix.push({level:'level5',family:'none',input:'keyboard',result:'finite miss/cleanup'});}for(const family of row.f)await captureFamily(c,family,'keyboard','matrix-'+family);return {actual};});
    await scenario('phone portrait touch journey',async()=>{await viewport(c,'390x844',390,844,2,true);await fresh(c,'portrait-touch');await startLevel(c,1,true);const layout=await touchLayout(c,'390x844');const row=await captureFamily(c,'shark','touch','touch-390x844-wrapped',true);return {layout,row};});
    await scenario('phone landscape gamepad journey',async()=>{await viewport(c,'844x390',844,390,2,true);await fresh(c,'landscape-gamepad');await startLevel(c,5,true);const layout=await touchLayout(c,'844x390'),row=await captureFamily(c,'snowman','gamepad','gamepad-844x390-wrapped',true);return {layout,row};});
    await scenario('heart loss then shoot again',async()=>{await viewport(c,'1280x720-damage',1280,720,1,false);await fresh(c,'damage');await startLevel(c,1);const before=await c.ev('__P.hp');await c.ev("(()=>{const e=__W.sharks[0];__P.inv=0;__P.pos.set(e.x,e.y,e.z);__P.vel.set(0,0,0);return true;})()");await wait(c,'__P.hp==='+String(before-1),2500);assert(await c.ev('__WEB_SHOT.snapshot().available'),'web remains available after actual shark contact');const row=await captureFamily(c,'shark','keyboard','damage-shoot-again');assert(await c.ev('__P.hp==='+String(before-1)),'one heart remains lost under invulnerability window');return {before,after:await c.ev('__P.hp'),capture:row};});
    await scenario('pause and temporary-power coexistence',async()=>{await fresh(c,'pause');await startLevel(c,0);await c.ev("__P.fire=true;__P.bubble=true;__P.hasSkyBlast=true;__P.hasStarBeam=true;__WEB_SHOT.evidenceAimAt('gloop',0,5)");await tapKey(c,'KeyX');await wait(c,'__WEB_SHOT.snapshot().captures.length===1');await tapKey(c,'Escape');const left=await c.ev('__WEB_SHOT.snapshot().captures[0].left');await sleep(500);assert(Math.abs((await c.ev('__WEB_SHOT.snapshot().captures[0].left'))-left)<.001,'pause freezes wrap timer',{left});await tapKey(c,'Escape');await wait(c,"__WEB_SHOT.snapshot().events.some(e=>e.type==='disappeared')",3000);assert(await c.ev('__P.fire&&__P.bubble&&__P.hasSkyBlast&&__P.hasStarBeam'),'web does not consume temporary powers');return {left};});
    const phoneRenders=report.screenshots.filter(x=>x.file==='touch-390x844-wrapped.png'||x.file==='gamepad-844x390-wrapped.png');assert(phoneRenders.some(x=>x.file==='touch-390x844-wrapped.png'&&x.pixelWidth===780&&x.pixelHeight===1688)&&phoneRenders.some(x=>x.file==='gamepad-844x390-wrapped.png'&&x.pixelWidth===1688&&x.pixelHeight===780),'distinct portrait and landscape wrap renders retained',phoneRenders);
    assert(c.errors.length===0,'no uncaught browser exceptions',c.errors);report.status=report.failures.length?'FAIL':'PASS';
  }catch(error){check('browser verifier completed',false,error.stack||String(error));report.status='FAIL';}
  finally{
    report.evidenceCheckpointAt=new Date().toISOString();
    try{writeEvidence();}catch(error){report.preCleanupWriteError=error.stack||String(error);}
    if(c)c.close();report.teardown=await Promise.all([stopProcess(browser,'chrome',true),stopProcess(server,'http-server')]);await sleep(500);
    try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:250});report.teardown.push({name:'profile',path:profile,ok:true});}
    catch(error){report.teardown.push({name:'profile',path:profile,ok:false,error:error.stack||String(error)});}
    for(const row of report.teardown)if(!row.ok)check('browser teardown '+row.name,false,row);
    report.finishedAt=new Date().toISOString();if(report.failures.length)report.status='FAIL';
    try{writeEvidence();}catch(error){report.status='FAIL';report.finalWriteError=error.stack||String(error);console.error('Evidence write failed:',error.stack||error);process.exitCode=1;}
  }
  console.log(JSON.stringify({status:report.status,checks:report.checks.length,failures:report.failures.length,journeys:report.journeys.length,matrix:report.levelMatrix.length,screenshots:report.screenshots.length,source:report.source},null,2));if(report.status!=='PASS')process.exit(1);
}
main();
