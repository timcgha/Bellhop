let time=0,rescued=0,gotNotes=0;
let started=false;
window.__W={solids,gloops,goos,hearts,crates,powers,fires,checks,snoozles,notes,dust,puddles,sharks,fish,spikefish,clams,bubbleShots,kelps,steamVents,lavas,cinders,embers,wisps,salamanders,geysers,scorches,protoEndpoints,steamCurtains,crystalSparks,celebrationParticles:PART,get asteroids(){return typeof asteroids!=='undefined'?asteroids:[];},get saucers(){return typeof saucers!=='undefined'?saucers:[];},get underwaterGroup(){return underwaterGroup;},get won(){return won;},get WM(){return WM;},get RAINBOW(){return RAINBOW;},get FINISH(){return FINISH;},get sfx(){return SFX;},get wreck(){return WRECK;},get conch(){return CONCH;},get organ(){return ORGAN;},get organFireworks(){return organFireworks;},get geodeShell(){return GEODE_SHELL;},get crackedGeode(){return crackedGeodeChamber;}};
window.__started=()=>started;

// ---------- camera ----------
const CAM=window.__CAM={yaw:0,pitch:0.42,dist:8.5,pos:new THREE.Vector3(0,5,19),look:new THREE.Vector3(0,1,10),shake:0,fovKick:0,lastManual:-9,boomDist:8.5,targetDist:8.5,effectiveDist:8.5,collisionPulled:false,mode:'outdoor'};
// Stage 4.8A — temporary Level 3 landscape camera-distance diagnostic (not a shipping profile).
const VERSION_BASE='v52 · iPhone playtest polish';
const CAMDIST_ALLOW={'8.5':8.5,'8.50':8.5,'6.8':6.8,'6.80':6.8,'6.07':6.07,'5':5,'5.0':5,'5.00':5,'3.93':3.93};
const CAMDIST_STEPS=[8.5,6.8,6.07,5,3.93];
function parseCamDistQuery(search){
  const m=/(?:^|[?&])camdist=([^&]*)/.exec(search||'');
  if(!m)return null;
  let key;try{key=decodeURIComponent(m[1]);}catch(e){return null;}
  return Object.prototype.hasOwnProperty.call(CAMDIST_ALLOW,key)?CAMDIST_ALLOW[key]:null;
}
let camDistParam=parseCamDistQuery((typeof location!=='undefined'&&location.search)||'');
function formatCamDistLabel(d){
  if(d===8.5)return '8.50';if(d===6.8)return '6.80';if(d===6.07)return '6.07';if(d===5)return '5.00';if(d===3.93)return '3.93';
  return (Math.round(d*100)/100).toFixed(2);
}
function isLandscapeViewport(){return (typeof innerWidth==='number'?innerWidth:1)>(typeof innerHeight==='number'?innerHeight:0);}
function isLevel3Cam(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.id==='level3');}
function outdoorBoomTarget(){
  // Diagnostic outdoor boom only on Level 3 + landscape + allow-listed query.
  if(camDistParam!=null&&isLevel3Cam()&&isLandscapeViewport())return camDistParam;
  return 8.5;
}
function ensureCamDiagEl(){
  let el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('camdiag');
  if(el)return el;
  if(typeof document==='undefined'||!document.body||!document.createElement)return null;
  el=document.createElement('div');el.id='camdiag';
  el.style.cssText='position:fixed;left:8px;bottom:8px;z-index:8;padding:4px 8px;border-radius:8px;background:rgba(20,60,80,.72);color:#fff;font:700 11px/1.35 -apple-system,system-ui,sans-serif;pointer-events:none;max-width:96vw;white-space:pre;display:none';
  document.body.appendChild(el);return el;
}
function updateCamDiagUI(){
  const sub=(typeof document!=='undefined'&&document.getElementById&&document.getElementById('ver'))||null;
  const el=ensureCamDiagEl();
  if(camDistParam==null){
    if(el)el.style.display='none';
    if(sub)sub.textContent=VERSION_BASE;
    return;
  }
  const land=isLandscapeViewport();
  const l3=isLevel3Cam();
  const active=l3&&land&&CAM.mode==='outdoor';
  if(sub)sub.textContent=active?('v33 · landscape cam '+formatCamDistLabel(camDistParam)):VERSION_BASE;
  if(!el)return;
  el.style.display='block';
  const ori=land?'landscape':'portrait';
  const tgt=active?camDistParam:8.5;
  const mode=CAM.collisionPulled?'collision-pulled':CAM.mode;
  const idle=active?'':' (diag idle)';
  el.textContent='ori '+ori+' | target '+formatCamDistLabel(tgt)+' | effective '+(CAM.effectiveDist!=null?CAM.effectiveDist.toFixed(2):'?')+' | '+mode+idle+'\nreq camdist='+formatCamDistLabel(camDistParam);
}
function stepCamDist(dir){
  if(!isLevel3Cam())return;
  let i=camDistParam==null?0:CAMDIST_STEPS.indexOf(camDistParam);
  if(i<0)i=0;
  i=(i+dir+CAMDIST_STEPS.length)%CAMDIST_STEPS.length;
  camDistParam=CAMDIST_STEPS[i];
  updateCamDiagUI();
}
window.__CAMDIAG={
  VERSION_BASE,CAMDIST_STEPS,CAMDIST_ALLOW,
  parse:parseCamDistQuery,
  format:formatCamDistLabel,
  getParam:()=>camDistParam,
  setParam(v){
    if(v==null||v===''){camDistParam=null;updateCamDiagUI();return null;}
    if(typeof v==='number'){
      camDistParam=CAMDIST_STEPS.indexOf(v)>=0?v:null;
      updateCamDiagUI();return camDistParam;
    }
    camDistParam=parseCamDistQuery('?camdist='+String(v));
    updateCamDiagUI();return camDistParam;
  },
  outdoorTarget:outdoorBoomTarget,
  isLandscape:isLandscapeViewport,
  isActive:()=>camDistParam!=null&&isLevel3Cam()&&isLandscapeViewport(),
  step:stepCamDist,
  getState:()=>({
    param:camDistParam,active:camDistParam!=null&&isLevel3Cam()&&isLandscapeViewport(),
    landscape:isLandscapeViewport(),level3:isLevel3Cam(),
    target:CAM.targetDist,effective:CAM.effectiveDist,boom:CAM.boomDist,
    collisionPulled:!!CAM.collisionPulled,mode:CAM.mode,dist:CAM.dist
  })
};
if(typeof addEventListener==='function'){
  addEventListener('keydown',e=>{
    if(!started||!isLevel3Cam())return;
    if(e.code==='BracketLeft'){e.preventDefault();stepCamDist(-1);}
    else if(e.code==='BracketRight'){e.preventDefault();stepCamDist(1);}
  });
}

function updateCamera(dt){
  // FINISH-owned celebration framing supersedes gameplay boom (incl. camdiag) while won.
  if(won&&FINISH&&typeof FINISH.camHold==='function'){
    FINISH.camHold(dt);
    CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
    camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
    CAM.fovKick=damp(CAM.fovKick,0,9,dt);
    const baseFov=62;const fov=baseFov+CAM.fovKick;CAM.baseFov=baseFov;CAM.fov=fov;
    if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
    if(camDistParam!=null)updateCamDiagUI();
    return;
  }
  // Authored screenshot / cinematic hold — pos/look stay put.
  if(CAM.mode==='shot'){
    CAM.collisionPulled=false;
    CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
    CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
    camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
    CAM.fovKick=damp(CAM.fovKick,0,9,dt);
    const baseFov=62;const fov=baseFov+CAM.fovKick;CAM.baseFov=baseFov;CAM.fov=fov;
    if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
    if(camDistParam!=null)updateCamDiagUI();
    return;
  }
  // Warp tunnel owns framing for the whole ride — outdoor boom must not overwrite it.
  if(typeof isSpaceWarpCamera==='function'&&isSpaceWarpCamera()){
    CAM.mode='warp';CAM.collisionPulled=false;
    CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
    CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
    camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
    CAM.fovKick=damp(CAM.fovKick,0,9,dt);
    const baseFov=72;const fov=baseFov+CAM.fovKick;CAM.baseFov=baseFov;CAM.fov=fov;
    if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
    if(camDistParam!=null)updateCamDiagUI();
    return;
  }
  const inWreck=window.__inWreckInterior&&window.__inWreckInterior();
  const inConch=window.__inConchInterior&&window.__inConchInterior();
  const tight=inWreck||inConch;
  // Interiors: gentler pitch range so walls fill less of the phone screen.
  const pitchMin=tight?0.16:0.08,pitchMax=tight?0.82:1.05;
  if(Math.abs(IN.camDX)>1e-4||Math.abs(IN.camDY)>1e-4){CAM.yaw+=IN.camDX;CAM.pitch=clamp(CAM.pitch+IN.camDY,pitchMin,pitchMax);CAM.lastManual=time;}
  else if(tight)CAM.pitch=clamp(CAM.pitch,pitchMin,pitchMax);
  const sp=Math.hypot(P.vel.x,P.vel.z);
  if(sp>2&&time-CAM.lastManual>1.2){const mvx=P.vel.x/sp,mvz=P.vel.z/sp;const fx=-Math.sin(CAM.yaw),fz=-Math.cos(CAM.yaw);const d=mvx*fx+mvz*fz;if(d>-0.3)CAM.yaw=angDamp(CAM.yaw,Math.atan2(-mvx,-mvz),1.2*(0.5+d*0.5),dt);}
  // Prefer a slightly higher look target and a longer boom in tight spaces.
  const tx=P.pos.x,ty=P.pos.y+(tight?1.6:1.1),tz=P.pos.z;
  const cp=Math.cos(CAM.pitch),spp=Math.sin(CAM.pitch);
  let want;
  if(inConch){want=12.2;CAM.boomDist=12.2;CAM.mode='conch';}
  else if(inWreck){want=13.2;CAM.boomDist=13.2;CAM.mode='wreck';}
  else{
    want=outdoorBoomTarget();
    CAM.mode='outdoor';
    // Softly ease outdoor boom between diagnostic targets / baseline (no spring/overshoot).
    CAM.boomDist=damp(CAM.boomDist==null?want:CAM.boomDist,want,12,dt);
  }
  CAM.targetDist=want;
  CAM.dist=want;
  const dist=CAM.boomDist;
  const dx=Math.sin(CAM.yaw)*cp*dist,dy=spp*dist,dz=Math.cos(CAM.yaw)*cp*dist;
  // Thinner probe + higher floor so the camera resists crushing into walls.
  const probe=tight?0.1:0.35,kMin=tight?0.64:0.25;
  let k=1;for(let i=1;i<=10;i++){const f=i/10;if(insideSolid(tx+dx*f,ty+dy*f+0.35,tz+dz*f,probe)){k=(i-1)/10;break;}}
  k=Math.max(k,kMin);
  let wx=tx+dx*k,wz=tz+dz*k,wy=Math.max(ty+dy*k,groundHeightAt(wx,wz)+0.6);
  if(tight)wy=Math.max(wy,ty+1.35);
  CAM.pos.x=damp(CAM.pos.x,wx,10,dt);CAM.pos.y=damp(CAM.pos.y,wy,10,dt);CAM.pos.z=damp(CAM.pos.z,wz,10,dt);
  CAM.look.x=damp(CAM.look.x,tx,14,dt);CAM.look.y=damp(CAM.look.y,ty,10,dt);CAM.look.z=damp(CAM.look.z,tz,14,dt);
  CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
  CAM.collisionPulled=!tight&&CAM.effectiveDist<want-0.2;
  CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
  camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
  CAM.fovKick=damp(CAM.fovKick,0,9,dt);
  // A touch more FOV in interiors gives breathing room without changing Level 1.
  const baseFov=tight?68:60;
  const fov=baseFov+CAM.fovKick;CAM.baseFov=baseFov;CAM.fov=fov;
  if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
  if(camDistParam!=null)updateCamDiagUI();
}

// ---------- loop ----------
camera.position.copy(CAM.pos);camera.lookAt(CAM.look);
let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;
  pollGamepad(dt);
  if(!started){updateClouds(dt);updateSnoozles(dt);updateZ(dt);updatePlayerVisual(dt);renderer.render(scene,camera);return;}
  time+=dt;
  readKeys(dt);if(T.stickId!==null){IN.mx=T.jx;IN.mz=T.jy;}if(HELD.a)IN.jumpHeld=true;if(HELD.b)IN.bHeld=true;
  updatePlayer(dt);updateWobblers(dt);updatePinwheels(dt);updateToss(dt);updateNotes(dt);updateSnoozles(dt);updateBoat(dt);updateWindmill(dt);updateFans(dt);updateSteamVents(dt);updateLavas(dt);updateClouds(dt);updateGloops(dt);updateGoos(dt);updatePuddles(dt);updateFires(dt);updateCrates(dt);updatePowers(dt);updateHearts(dt);updateChecks(dt);
  updatePeak(dt);
  updateSpaceDecor(dt);
  updateSpaceWorld(dt);
  updateSharks(dt);updateFish(dt);updateSpikefish(dt);updateBubbleShots(dt);updateClams(dt);updateKelp(dt);
  updateWin(dt);if(FINISH)FINISH.update(dt,won?winT:-1);
  updateParticles(dt);updateRings(dt);updateZ(dt);updateCamera(dt);updatePlayerVisual(dt);
  IN.jump=IN.b=IN.y=false;IN.jumpHeld=IN.bHeld=false;IN.camDX=IN.camDY=0;IN.mx=IN.mz=0;
  renderer.render(scene,camera);}
requestAnimationFrame(frame);
updateHUD();
updateCamDiagUI();
