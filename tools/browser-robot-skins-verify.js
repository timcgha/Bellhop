#!/usr/bin/env node
// BH-002/BH-005: real UI selection, shared-material safety, rendering,
// persistence, and Web Hero through all six real picker lifecycles.
// Uses the established Snowbound route. Camera yaw is normalized while driving;
// no player position, physics, pause, progression or win state is assigned.
const {spawn,execFileSync}=require('child_process');
const fs=require('fs'),path=require('path'),http=require('http');
const crypto=require('crypto');
const {ROBOT_SKINS,ROBOT_SKIN_KEY}=require('../src/skin-state.js');
const out=path.join(__dirname,'..','artifacts','browser-robot-skins');fs.mkdirSync(out,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>p&&fs.existsSync(p));
if(!chrome)throw Error('Chrome/Chromium executable not found');
const port=8803,debugPort=9243,profile=`/tmp/bellhop-skins-${process.pid}`,url=`http://127.0.0.1:${port}/index.html`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(c,m)=>{if(!c)throw Error(m);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const expected=id=>{const s=ROBOT_SKINS.find(s=>s.id===id);return {panel:s.panel,soft:s.soft,accent:s.accent,joint:s.joint};};
const expectedSpecial=id=>{const s=ROBOT_SKINS.find(s=>s.id===id);return {colors:{headPanel:s.headPanel,headSoft:s.headSoft,headAccent:s.headAccent,eye:s.eye,eyeGlow:s.eyeGlow,badgeBack:s.badgeBack,badgeMark:s.badgeMark},badgeVisible:s.badge,chestVisible:!s.badge,chestGlowVisible:!s.badge};};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim();
function sourceIdentity(){
  let event=null;try{if(process.env.GITHUB_EVENT_PATH)event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));}catch(e){}
  const pr=event&&event.pull_request,checkout=git('rev-parse','HEAD');
  return {checkout,tree:git('rev-parse','HEAD^{tree}'),locallyVisibleParents:git('show','-s','--format=%P','HEAD').split(/\s+/).filter(Boolean),
    eventBase:pr&&pr.base&&pr.base.sha||null,eventHead:pr&&pr.head&&pr.head.sha||null,
    syntheticMerge:!!(pr&&checkout!==pr.head.sha),githubSha:process.env.GITHUB_SHA||null,githubHeadRef:process.env.GITHUB_HEAD_REF||null};
}
function json(url){return new Promise((resolve,reject)=>http.get(url,res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>{try{resolve(JSON.parse(s));}catch(e){reject(e);}});}).on('error',reject));}

// BH-003 read-only inspection, injected only into the temporary served test page.
// The arrays come from the actual THREE meshes used by gameplay and the preview.
function readEyeState(robot){
  return robot?robot.userData.eyes.map(e=>({position:e.position.toArray(),parts:e.children.map(m=>({
    mesh:m.isMesh,visible:m.visible,geometry:m.geometry.uuid,scale:m.scale.toArray(),position:m.position.toArray(),
    color:m.material.color.getHex(),vertices:Array.from(m.geometry.attributes.position.array),
    normals:Array.from(m.geometry.attributes.normal.array)
  }))})):null;
}
function readPreviewFraming(){
  if(!skinPreview)return null;
  const v=skinPreview,box=new THREE.Box3().setFromObject(v.robot),min=box.min,max=box.max,points=[];v.camera.updateMatrixWorld(true);
  for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z]){const p=new THREE.Vector3(x,y,z).project(v.camera);points.push({x:p.x,y:p.y,z:p.z});}
  const host=document.getElementById('skinPreviewHost').getBoundingClientRect();
  return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y)),host:{x:host.x,y:host.y,w:host.width,h:host.height},canvas:{w:v.renderer.domElement.width,h:v.renderer.domElement.height}};
}
function eyeShapeStats(vertices){
  assert(vertices.length===390&&vertices.every(Number.isFinite),'invalid eye vertex buffer');
  const middle=[],ends=[];let sphereError=0;
  for(let i=0;i<vertices.length;i+=3){
    const x=vertices[i],y=vertices[i+1],z=vertices[i+2],originalY=y-.9*(.5-x*x);
    sphereError=Math.max(sphereError,Math.abs(x*x+originalY*originalY+z*z-1));
    if(Math.abs(x)<1e-5)middle.push(y);if(Math.abs(x)>.98)ends.push(y);
  }
  const center=(Math.max(...middle)+Math.min(...middle))/2,edge=(Math.max(...ends)+Math.min(...ends))/2;
  return {center,edge,rise:center-edge,openThickness:Math.max(...middle)-Math.min(...middle),sphereError};
}
function assertEyeState(eyes,label,id){
  const skin=ROBOT_SKINS.find(s=>s.id===id);assert(skin,'unknown eye skin '+id);
  assert(eyes&&eyes.length===2,label+' missing two actual eyes');let stats;
  for(let i=0;i<eyes.length;i++){
    const e=eyes[i];assert(same(e.position,[i===0?-.14:.14,.17,.472])&&e.parts.length===2,label+' changed eye placement/parts');
    for(let j=0;j<e.parts.length;j++){
      const m=e.parts[j];stats=eyeShapeStats(m.vertices);
      assert(m.mesh&&m.visible&&m.normals.length===m.vertices.length&&m.normals.every(Number.isFinite),label+' invalid rendered eye mesh/normals');
      assert(stats.rise>.8&&stats.rise<.95&&Math.abs(stats.openThickness-2)<1e-5&&stats.sphereError<1e-5,label+' not an open smiling lens '+JSON.stringify(stats));
      assert(same(m.scale,j?[.032,.020,.010]:[.066,.041,.024])&&same(m.position,j?[0,0,.018]:[0,0,0]),label+' reduced/repositioned lens');
      assert(m.color===(j?skin.eyeGlow:skin.eye),label+' wrong authored eye contrast');
      assert(same(m.vertices,eyes[0].parts[0].vertices),label+' inconsistent eyes/highlight');
    }
  }
  return stats;
}
async function eyeProof(c,gameplayId,previewRequired=false,previewId=gameplayId){
  const state=await c.ev('__BH003Eyes()'),stats=assertEyeState(state.gameplay,'gameplay',gameplayId);
  assert(eyeShapeStats(state.shared).rise<.01,'shared world sphere was bent');
  const neutral=state.gameplay.map(e=>({...e,parts:e.parts.map(m=>({...m,vertices:state.shared}))}));
  let neutralRejected=false;
  try{assertEyeState(neutral,'neutral control',gameplayId);}catch(error){neutralRejected=error.message.includes('not an open smiling lens');}
  assert(neutralRejected,'neutral eye geometry incorrectly passed the smiling-eye gate');
  if(previewRequired){
    assertEyeState(state.preview,'preview',previewId);
    assert(same(state.gameplay[0].parts[0].vertices,state.preview[0].parts[0].vertices),'preview/gameplay shape mismatch');
    assert(state.gameplay[0].parts[0].geometry!==state.preview[0].parts[0].geometry,'preview shares disposable gameplay geometry');
  }
  return {...stats,previewMatches:previewRequired,neutralRejected};
}
async function faceForward(c){
  // Real controls move clear of the checkpoint; no player/camera teleport or zoom.
  await hold(c,['KeyD'],550);await hold(c,['KeyS'],450);
  await wait(c,'__PLAYER().visible&&__PLAYER().userData.eyes.every(e=>e.scale.y>.99)');
}

async function connect(){
  const pages=await json(`http://127.0.0.1:${debugPort}/json/list`),page=pages.find(p=>p.type==='page');assert(page,'no browser page');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;const pending=new Map(),errors=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result?.value;};
  const captures=[];
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'}),b=Buffer.from(r.data,'base64'),file=name+'.png';fs.writeFileSync(path.join(out,file),b);const width=b.readUInt32BE(16),height=b.readUInt32BE(20);captures.push({file,width,height,bytes:b.length,sha256:hash(b)});};
  await send('Page.enable');await send('Runtime.enable');return {send,ev,shot,captures,errors,close:()=>ws.close()};
}
async function wait(c,expr,ms=8000){const start=Date.now();let last;while(Date.now()-start<ms){try{if(await c.ev(expr))return;}catch(e){last=e.message;}await sleep(100);}throw Error('timeout: '+expr+(last?' / '+last:''));}
const keyMap={Space:[' ',32],Enter:['Enter',13],Escape:['Escape',27],Tab:['Tab',9],ArrowLeft:['ArrowLeft',37],ArrowRight:['ArrowRight',39],ArrowDown:['ArrowDown',40],KeyW:['w',87],KeyA:['a',65],KeyS:['s',83],KeyD:['d',68],KeyK:['k',75]};
async function key(c,code,down,modifiers=0){const [k,v]=keyMap[code];await c.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:k,code,modifiers,windowsVirtualKeyCode:v,nativeVirtualKeyCode:v,text:down&&k.length===1?k:undefined});}
async function tapKey(c,code,ms=60,modifiers=0){await key(c,code,true,modifiers);await sleep(ms);await key(c,code,false,modifiers);await sleep(100);}
async function hold(c,codes,ms){for(const code of codes)await key(c,code,true);await sleep(ms);for(const code of codes.reverse())await key(c,code,false);await sleep(80);}
async function padTap(c,index,ms=130){await c.ev(`__BH005PadButton(${index},true)`);await sleep(ms);await c.ev(`__BH005PadButton(${index},false)`);await sleep(ms);}
async function tap(c,id,touch=false){
  const r=await c.ev(`(()=>{const el=document.getElementById(${JSON.stringify(id)});el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};})()`);
  assert(r.w>0&&r.h>0,'hidden control '+id);
  if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y,id:1,radiusX:4,radiusY:4,force:1}]});await sleep(45);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});}
  await sleep(130);
}
async function viewport(c,w,h,touch){await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:touch,screenWidth:w,screenHeight:h});await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});await sleep(150);}
async function navigate(c){await c.send('Page.navigate',{url});await wait(c,`document.readyState==='complete'&&typeof __SKINS==='function'&&typeof __sceneOwnership==='function'`,20000);}
async function skins(c){return c.ev('__SKINS()');}
function assertSpecial(actual,id,label){
  const wanted=expectedSpecial(id);assert(actual&&same(actual.colors,wanted.colors),label+' special material mismatch '+id+' '+JSON.stringify(actual));
  assert(actual.badgeVisible===wanted.badgeVisible&&actual.chestVisible===wanted.chestVisible&&actual.chestGlowVisible===wanted.chestGlowVisible,label+' chest/badge selection mismatch '+id);
  assert(actual.badge&&actual.badge.legs===8&&actual.badge.construction==='bellhop-simple-geometry-v1',label+' missing original eight-leg badge construction');
}
async function appearance(c,id){const s=await skins(c);assert(s.equipped===id&&same(s.gameplay,expected(id)),'equipped/rendered palette mismatch '+id+' '+JSON.stringify(s));assertSpecial(s.gameplaySpecial,id,'gameplay');await eyeProof(c,id);return s;}
async function sim(c){return c.ev(`({started:__started(),paused:__paused(),won:__W.won,time:__gameTime(),x:__P.pos.x,y:__P.pos.y,z:__P.pos.z,hp:__P.hp,maxHp:__P.maxHp,dead:__P.dead,grounded:__P.grounded,camel:!!__P.camel,sled:!!__P.sled,thrust:__P.spaceThrust,zone:__P.moveZone,physics:__PHYS(),skin:__PLAYER().userData.skinId,level:__LEVEL()&&__LEVEL().id})`);}
async function sceneRoots(c){return c.ev(`__PLAYER().parent.children.map(o=>o.uuid).sort()`);}
async function nonRobotMaterials(c){return c.ev(`(()=>{const root=__PLAYER(),items={};root.parent.traverse(o=>{let p=o;while(p){if(p===root)return;p=p.parent;}if(o.material&&o.material.color)items[o.material.uuid]=o.material.color.getHex();});return items;})()`);}
async function checkPreview(c,id,equipped){
  const s=await skins(c);assert(s.open&&s.pending===id&&s.equipped===equipped,'pending/equipped separation');assert(s.preview&&same(s.preview.colors,expected(id)),'preview actual material mismatch '+id);assertSpecial(s.preview.special,id,'preview');
  assert(same(s.gameplay,expected(equipped)),'preview recolored gameplay');assertSpecial(s.gameplaySpecial,equipped,'gameplay after preview');
  assert(s.preview.special.badge.circle!==s.gameplaySpecial.badge.circle&&s.preview.special.badge.ring!==s.gameplaySpecial.badge.ring,'preview shares disposable badge geometry');
  await eyeProof(c,equipped,true,id);
}
async function previewFraming(c){return c.ev('__BH005PreviewFraming()');}
async function gameplayFraming(c){return c.ev(`(()=>{const p=__PLAYER(),cam=new THREE.PerspectiveCamera(__CAM.fov||60,innerWidth/innerHeight,.1,220);cam.position.copy(__CAM.pos);cam.lookAt(__CAM.look);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();const v=new THREE.Vector3(p.position.x,p.position.y+.58,p.position.z).project(cam);return {x:v.x,y:v.y,z:v.z,visible:p.visible,mode:__CAM.mode,w:innerWidth,h:innerHeight};})()`);}
async function focusState(c){return c.ev(`(()=>{const e=document.activeElement,s=e&&getComputedStyle(e);return {id:e&&e.id,outline:s&&s.outline,outlineWidth:s&&s.outlineWidth,outlineStyle:s&&s.outlineStyle};})()`);}
async function browserGamepad(c){
  assert(!await c.ev('__started()'),'gamepad route began during gameplay');await padTap(c,3);await wait(c,'__SKINS().open');
  for(let i=0;i<6;i++)await padTap(c,15);
  let s=await skins(c),focus=await focusState(c);assert(s.pending==='web-hero'&&focus.id==='skin-web-hero','emulated gamepad did not reach seventh skin '+JSON.stringify({s,focus}));
  await padTap(c,14);s=await skins(c);focus=await focusState(c);assert(s.pending==='purple'&&focus.id==='skin-purple','emulated gamepad reverse traversal failed');
  await padTap(c,15);await padTap(c,15);focus=await focusState(c);assert(focus.id==='skinUse','emulated gamepad did not reach Use Skin');await padTap(c,0);await wait(c,'!__SKINS().open');await appearance(c,'web-hero');
  return {method:'browser-level emulated standard Gamepad API; real application requestAnimationFrame polling/input path',forward:6,reverse:1,activation:'A',status:'PASS'};
}
async function open(c,touch=false){await tap(c,'skinsOpen',touch);await wait(c,'__SKINS().open&&!!__SKINS().preview');}
async function equip(c,id,touch=false){await open(c,touch);await tap(c,'skin-'+id,touch);await checkPreview(c,id,(await skins(c)).equipped);await tap(c,'skinUse',touch);await wait(c,'!__SKINS().open');await appearance(c,id);assert(!await c.ev('__started()'),'Use Skin launched a level');}
async function checkClosed(c){const s=await skins(c);assert(!s.open&&s.preview===null&&await c.ev(`document.getElementById('skinPreviewHost').children.length===0&&!document.getElementById('start').inert`),'preview resources or input lock survived close');if(s.lastDisposal)assert(s.lastDisposal.detached&&s.lastDisposal.materials>0&&s.lastDisposal.geometries>0,'preview cleanup evidence missing');}
async function start(c,index,touch=false){await tap(c,'lvl'+index,touch);if(!await c.ev('__started()'))await tap(c,'lvl'+index,touch);await wait(c,`__started()&&__LEVEL().id==='level${index+1}'&&!__paused()&&!__W.won`);}
async function movement(c){for(const code of ['KeyD','KeyA','KeyW','KeyS']){const a=await sim(c);await hold(c,[code],420);const b=await sim(c);if(b.time>a.time&&Math.hypot(a.x-b.x,a.z-b.z)>.06)return {input:code,distance:Math.hypot(a.x-b.x,a.z-b.z),time:b.time-a.time};}throw Error('active movement/time not established');}
async function menu(c,touch=false){
  if(!await c.ev('__paused()'))await tap(c,'pauseBtn',touch);await wait(c,'__paused()');const a=await sim(c);await tapKey(c,'Space');await hold(c,['KeyD'],250);const b=await sim(c);
  assert(a.time===b.time&&a.x===b.x&&a.y===b.y&&a.z===b.z,'pause did not freeze');
  await tap(c,'pauseResume',touch);await wait(c,'!__paused()');await wait(c,`__gameTime()>${b.time}`);await tap(c,'pauseBtn',touch);await wait(c,'__paused()');await tap(c,'pauseMenu',touch);
  await wait(c,`!__started()&&!__paused()&&!__W.won&&getComputedStyle(document.getElementById('start')).display==='flex'`);
  assert(await c.ev(`['fire','bubble','starbeam','pauseOverlay','pauseBtn','bA','bB','bY','win'].every(id=>getComputedStyle(document.getElementById(id)).display==='none')`),'stale gameplay HUD');
  const input=await c.ev('__INPUT_STATE()');assert(!input.keysDown.length&&!input.jump&&!input.jumpHeld&&!input.b&&!input.bHeld&&!input.y&&input.mx===0&&input.mz===0,'stale control input');await checkClosed(c);
}
async function audit(c,baseline){return c.ev(`(()=>{
  const scene=__PLAYER().parent,base=new Set(${JSON.stringify(baseline)}),own=__sceneOwnership();
  const contracts=own.persistentWorlds.map(c=>({name:c.name,root:c.root}));
  const retained=scene.children.filter(o=>!base.has(o.uuid));
  const invalid=retained.filter(o=>!contracts.some(c=>c.root===o&&o.isGroup&&o.parent===scene&&o.children.length===0&&o.visible===false));
  const active=__W.celebrationParticles.filter(p=>p.life>0||p.m.visible).length;
  return {retained:retained.map(o=>({uuid:o.uuid,contract:contracts.find(c=>c.root===o)?.name,children:o.children.length,visible:o.visible})),unowned:invalid.map(o=>o.uuid),owned:own.owned.length,activeFx:active,conch:!!__W.conch,camel:!!__P.camel,sled:!!__P.sled,thrust:!!__P.spaceThrust};
})()`);}
function assertAudit(s){assert(!s.unowned.length&&s.owned===0&&s.activeFx===0&&!s.conch&&!s.camel&&!s.sled&&!s.thrust,'isolation residue '+JSON.stringify(s));}
async function drive(c,tx,tz,label,timeout=50000,stopOnDeath=false){
  const t=Date.now();let last=null,stuck=0;
  while(Date.now()-t<timeout){
    await c.ev('(()=>{__CAM.yaw=0;__CAM.lastManual=1e9;})()');const s=await sim(c);assert(!s.won,'unexpected completion on '+label);if(s.dead){if(stopOnDeath)return {dead:true};await sleep(450);continue;}
    const dx=tx-s.x,dz=tz-s.z;if(Math.hypot(dx,dz)<1.05)return;
    const codes=[];if(Math.abs(dx)>.65)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>.65)codes.push(dz>0?'KeyS':'KeyW');await hold(c,codes,180);
    const n=await sim(c);if(last&&Math.hypot(n.x-last.x,n.z-last.z)<.04)stuck++;else stuck=0;last=n;if(stuck>=5){await tapKey(c,'Space',55);stuck=0;}
  }
  throw Error('drive timeout '+label+' '+JSON.stringify(await sim(c)));
}
async function naturalDeathRespawn(c){
  const startState=await sim(c),hits=[];assert(startState.level==='level1'&&startState.hp===startState.maxHp,'death route requires fresh Level 1');
  for(let attempt=0;attempt<10&&!(await sim(c)).dead;attempt++){
    const q=await c.ev(`(()=>{const e=__W.gloops.find(e=>e.alive);return e&&{x:e.x,z:e.z};})()`);assert(q,'no live Level 1 Gloop for real damage route');
    const route=await drive(c,q.x,q.z+4.3,'Gloop projectile range',18000,true);if(route&&route.dead)break;const before=await sim(c);
    try{await wait(c,`__P.hp<${before.hp}||__P.dead`,9500);}catch(e){continue;}
    const after=await sim(c);hits.push({before:before.hp,after:after.hp,source:'real Gloop projectile/contact simulation'});if(!after.dead)await wait(c,'__P.inv<=0',5000);
  }
  const dead=await sim(c);assert(dead.dead&&dead.hp<=0,'real enemy route did not reach death '+JSON.stringify({dead,hits}));assert(dead.skin==='web-hero','death changed equipped skin');
  await c.shot('web-hero-real-death');await wait(c,'!__P.dead&&__P.hp===__P.maxHp',5000);const respawned=await sim(c);await appearance(c,'web-hero');
  return {startHp:startState.hp,hits,dead:{hp:dead.hp,skin:dead.skin},respawn:{hp:respawned.hp,skin:respawned.skin},status:'PASS'};
}
async function transients(c,index,result){
  if(index===3){await key(c,'Space',true);await wait(c,`__P.moveZone==='openSpace'&&__P.spaceThrust`,3500);await sleep(180);await appearance(c,'web-hero');await c.shot('web-hero-space-thrust');await key(c,'Space',false);result.transients.push({level:4,state:'real open-space thrust',skin:'web-hero',status:'PASS'});}
  if(index===4){const q=await c.ev(`({x:__W.camels[0].x,z:__W.camels[0].z})`);await drive(c,q.x,q.z,'camel',24000);await tapKey(c,'Space');await wait(c,'!!__P.camel',3500);await hold(c,['KeyW'],300);await appearance(c,'web-hero');assert(await c.ev(`Math.abs(__PLAYER().position.x-__P.pos.x)<.02&&__PLAYER().position.y-__P.pos.y>1.45`),'camel attachment');await c.shot('web-hero-mounted-camel');result.transients.push({level:5,state:'real camel mount/movement',skin:'web-hero',status:'PASS'});}
  if(index===5){
    for(let i=0;i<3;i++){const q=await c.ev(`({x:__W.snoozles[${i}].g.position.x,z:__W.snoozles[${i}].g.position.z})`);await drive(c,q.x,q.z,'Snowbound Snoozle '+i);await tapKey(c,'KeyK',70);await wait(c,`__W.snoozles[${i}].state!=='sleep'`,3500);}
    const q=await c.ev(`({x:__WINTER.sled.x,z:__WINTER.sled.z})`);await drive(c,q.x,q.z+.65,'sled',12000);await wait(c,`__P.pos.y>5.2&&Math.hypot(__P.pos.x-__WINTER.sled.x,__P.pos.z-__WINTER.sled.z)<2.25`,6000);await tapKey(c,'Space',70);await wait(c,`!!__P.sled&&__WINTER.sled.phase==='sliding'&&__WINTER.sled.progress>.04`,4000);await appearance(c,'web-hero');await c.shot('web-hero-sliding-sled');result.transients.push({level:6,state:'real Snoozle progression/mounted sliding sled',skin:'web-hero',status:'PASS'});
  }
}
async function selector(c,w,h,result){
  const touch=w!==1280;await viewport(c,w,h,touch);await c.ev(`localStorage.setItem(${JSON.stringify(ROBOT_SKIN_KEY)},'obsolete')`);await navigate(c);await appearance(c,'classic');
  await tap(c,'lvl2',touch);assert(!await c.ev('__started()'),'level selection launched unexpectedly');const original='classic',idx=await c.ev('__pickerIdx()'),roots=await sceneRoots(c),world=await nonRobotMaterials(c);
  await open(c,touch);await checkPreview(c,original,original);await tap(c,'skin-web-hero',touch);await checkPreview(c,'web-hero',original);
  const renders=(await skins(c)).preview.renders;await sleep(300);assert((await skins(c)).preview.renders===renders,'preview runs an unnecessary render loop');
  await tapKey(c,'ArrowLeft');let focus=await focusState(c);assert(focus.id==='skin-purple'&&(await skins(c)).pending==='purple','keyboard reverse traversal from seventh choice failed');
  await tapKey(c,'ArrowRight');focus=await focusState(c);assert(focus.id==='skin-web-hero'&&(await skins(c)).pending==='web-hero','keyboard forward traversal to seventh choice failed');
  await tapKey(c,'Tab',60,8);assert((await focusState(c)).id==='skin-purple','Shift+Tab reverse focus trap failed');await tapKey(c,'Tab');focus=await focusState(c);assert(focus.id==='skin-web-hero'&&focus.outlineStyle==='solid'&&parseFloat(focus.outlineWidth)>=3,'visible focus/focus trap evidence missing '+JSON.stringify(focus));
  await tapKey(c,'ArrowLeft');await tapKey(c,'Space');await tapKey(c,'ArrowRight');assert(await c.ev(`!__started()&&__pickerIdx()===${idx}`),'panel input activated underlying picker');await checkPreview(c,'web-hero',original);
  const geometry=await c.ev(`(()=>{const p=document.getElementById('skinsPanel').getBoundingClientRect();return {panel:{l:p.left,r:p.right,t:p.top,b:p.bottom},controls:[...document.querySelectorAll('#skinsPanel button')].map(e=>{e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {id:e.id,w:r.width,h:r.height,l:r.left,r:r.right,t:r.top,b:r.bottom};})};})()`);
  assert(geometry.panel.l>=0&&geometry.panel.r<=w+.5,'panel horizontally clipped');for(const b of geometry.controls)assert(b.w>=44&&b.h>=44&&b.l>=0&&b.r<=w+.5&&b.t>=0&&b.b<=h+.5,'unreachable touch target '+JSON.stringify(b));
  await c.ev(`document.getElementById('skinsPanel').scrollTop=0`);await sleep(150);const framed=await previewFraming(c);assert(framed&&framed.minX>=-1&&framed.maxX<=1&&framed.minY>=-1&&framed.maxY<=1&&framed.maxY-framed.minY>.55,'whole preview robot is not normally framed '+JSON.stringify(framed));await c.shot('web-hero-menu-'+w+'x'+h);await tap(c,'skinBack',touch);await appearance(c,original);await checkClosed(c);assert(same(roots,await sceneRoots(c))&&same(world,await nonRobotMaterials(c)),'preview altered main scene/materials');
  await open(c,touch);await tap(c,'skin-red',touch);await tapKey(c,'Escape');await checkClosed(c);await appearance(c,original);
  let gamepad=null;if(!touch)gamepad=await browserGamepad(c);else await equip(c,'web-hero',touch);
  assert(await c.ev(`localStorage.getItem(${JSON.stringify(ROBOT_SKIN_KEY)})==='web-hero'`),'confirm did not persist Web Hero');await navigate(c);await appearance(c,'web-hero');await open(c,touch);await checkPreview(c,'web-hero','web-hero');await tap(c,'skinBack',touch);
  await start(c,0,touch);await appearance(c,'web-hero');const active=await movement(c);await faceForward(c);const gameplayFrame=await gameplayFraming(c);assert(gameplayFrame.visible&&Math.abs(gameplayFrame.x)<.9&&Math.abs(gameplayFrame.y)<.9&&gameplayFrame.z>0&&gameplayFrame.z<1,'ordinary gameplay framing failed '+JSON.stringify(gameplayFrame));await c.shot('web-hero-gameplay-'+w+'x'+h);const deathRespawn=!touch?await naturalDeathRespawn(c):null;await menu(c,touch);
  result.viewports.push({viewport:w+'x'+h,status:'PASS',interaction:touch?'CDP touch emulation':'CDP mouse, keyboard and Gamepad API emulation',invalidStorageFallback:true,confirmCancel:true,reload:true,keyboardBothDirections:true,visibleFocus:focus,gamepad,targets:geometry.controls,menuPreviewFraming:framed,gameplayFraming:gameplayFrame,movement:active,deathRespawn,previewSceneUnchanged:true});
}
async function main(){
  fs.rmSync(profile,{recursive:true,force:true});
  const served=profile+'-page',html=fs.readFileSync(path.join(__dirname,'..','dist','index.html'),'utf8'),marker='// ---- BUILD:END ----';
  assert(html.split(marker).length===2,'missing/ambiguous test observation insertion point');
  const probe=`window.__BH003Eyes=()=>({gameplay:(${readEyeState.toString()})(player),preview:(${readEyeState.toString()})(skinPreview&&skinPreview.robot),shared:Array.from(SPH.attributes.position.array)});window.__BH005PreviewFraming=(${readPreviewFraming.toString()});\n`+
    `const __bh005Buttons=Array.from({length:16},()=>({pressed:false,value:0}));window.__BH005Pad={connected:true,id:'BH-005 browser-emulated standard gamepad',mapping:'standard',axes:[0,0,0,0],buttons:__bh005Buttons,timestamp:0};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__BH005Pad]});window.__BH005PadButton=(i,on)=>{__bh005Buttons[i].pressed=!!on;__bh005Buttons[i].value=on?1:0;window.__BH005Pad.timestamp=performance.now();return true;};\n`;
  fs.mkdirSync(served,{recursive:true});fs.writeFileSync(path.join(served,'index.html'),html.replace(marker,probe+marker));
  const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:served,stdio:'ignore'});
  let err='';const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--window-size=1280,720','about:blank'],{stdio:['ignore','ignore','pipe']});browser.stderr.on('data',d=>err=(err+d).slice(-8000));
  let c;const result={status:'RUNNING',source:sourceIdentity(),browser:{executable:chrome,route:'headless Chromium via CDP',physicalDevice:false},viewports:[],skins:[],transients:[],levels:[],errors:[]};
  try{
    let ready=false;for(let i=0;i<75;i++){if(browser.exitCode!==null)throw Error('Chrome exited '+err);try{await json(`http://127.0.0.1:${debugPort}/json/version`);ready=true;break;}catch(e){await sleep(200);}}assert(ready,'Chrome initialization failed '+err);c=await connect();await viewport(c,1280,720,false);await navigate(c);await appearance(c,'classic');
    for(const [w,h] of [[1280,720],[390,844],[844,390]]){console.log('SKINS selector '+w+'x'+h);await selector(c,w,h,result);}
    await viewport(c,1280,720,false);await navigate(c);const baseline=await sceneRoots(c);
    for(const skin of ROBOT_SKINS){
      console.log('SKINS gameplay '+skin.id);await equip(c,skin.id);
      await open(c);const previewEyes=await eyeProof(c,skin.id,true);await c.shot('preview-'+skin.id);await tap(c,'skinBack');await checkClosed(c);
      await start(c,0);await wait(c,'__PLAYER().visible');await appearance(c,skin.id);const proof=await movement(c);await faceForward(c);
      const eyes=await eyeProof(c,skin.id);await c.shot('gameplay-'+skin.id);await menu(c);
      result.skins.push({skin:skin.id,status:'PASS',colors:expected(skin.id),special:expectedSpecial(skin.id),movement:proof,eyes,previewEyes});
    }
    const roots=await sceneRoots(c);for(let i=0;i<5;i++){await open(c);await tap(c,'skin-green');await tap(c,'skinBack');await checkClosed(c);assert(same(roots,await sceneRoots(c)),'preview scene roots accumulated');}
    await equip(c,'web-hero');
    for(const [w,h] of [[1280,720],[390,844]]){
      await viewport(c,w,h,w!==1280);
      for(let i=0;i<6;i++){
        console.log('SKINS lifecycle '+w+'x'+h+' level '+(i+1));await start(c,i,w!==1280);await appearance(c,'web-hero');const active=await movement(c);
        let conch=null;if(i===1)conch=await c.ev(`({uuid:__W.conch.rainbow.uuid,registered:__sceneOwnership().owned.includes(__W.conch.rainbow)})`);
        if(w===1280)await transients(c,i,result);
        await menu(c,w!==1280);await appearance(c,'web-hero');const isolation=await audit(c,baseline);assertAudit(isolation);
        if(conch){assert(conch.registered,'Conch rainbow unregistered');assert(await c.ev(`!__PLAYER().parent.getObjectByProperty('uuid',${JSON.stringify(conch.uuid)})`),'Conch rainbow survived teardown');}
        result.levels.push({viewport:w+'x'+h,level:i+1,status:'PASS',skin:'web-hero',active,isolation,conch:conch?{registered:true,detached:true}:null});
      }
      await start(c,0,w!==1280);await appearance(c,'web-hero');await movement(c);await menu(c,w!==1280);assertAudit(await audit(c,baseline));
    }
    assert(!c.errors.length,'page exceptions '+JSON.stringify(c.errors));result.status='PASS';result.previewCycles=5;result.restart='PASS';result.errors=c.errors;console.log('ROBOT_SKINS_BROWSER_VERIFY=PASS');
  }catch(e){result.status='FAIL';result.error=e.stack||String(e);if(c){try{result.lastState=await sim(c);result.skinState=await skins(c);result.errors=c.errors;await c.shot('failure');}catch(snapshotError){result.snapshotError=String(snapshotError);}}console.error('ROBOT_SKINS_BROWSER_VERIFY=FAIL');console.error(e.stack||e);process.exitCode=1;}
  finally{if(c)result.captures=c.captures;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(c)c.close();browser.kill('SIGKILL');server.kill('SIGKILL');await sleep(200);try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});fs.rmSync(served,{recursive:true,force:true});}catch(e){}}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
