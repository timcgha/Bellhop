let time=0,rescued=0,gotNotes=0;
let started=false;
window.__W={solids,gloops,goos,hearts,crates,powers,fires,checks,snoozles,notes,dust,puddles,sharks,fish,spikefish,clams,bubbleShots,kelps,steamVents,lavas,cinders,embers,wisps,salamanders,geysers,scorches,celebrationParticles:PART,get underwaterGroup(){return underwaterGroup;},get won(){return won;},get WM(){return WM;},get RAINBOW(){return RAINBOW;},get FINISH(){return FINISH;},get sfx(){return SFX;},get wreck(){return WRECK;},get conch(){return CONCH;}};
window.__started=()=>started;

// ---------- camera ----------
const CAM=window.__CAM={yaw:0,pitch:0.42,dist:8.5,pos:new THREE.Vector3(0,5,19),look:new THREE.Vector3(0,1,10),shake:0,fovKick:0,lastManual:-9};
function updateCamera(dt){
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
  const dist=inConch?12.2:(inWreck?13.2:8.5);
  const dx=Math.sin(CAM.yaw)*cp*dist,dy=spp*dist,dz=Math.cos(CAM.yaw)*cp*dist;
  // Thinner probe + higher floor so the camera resists crushing into walls.
  const probe=tight?0.1:0.35,kMin=tight?0.64:0.25;
  let k=1;for(let i=1;i<=10;i++){const f=i/10;if(insideSolid(tx+dx*f,ty+dy*f+0.35,tz+dz*f,probe)){k=(i-1)/10;break;}}
  k=Math.max(k,kMin);
  let wx=tx+dx*k,wz=tz+dz*k,wy=Math.max(ty+dy*k,groundHeightAt(wx,wz)+0.6);
  if(tight)wy=Math.max(wy,ty+1.35);
  CAM.pos.x=damp(CAM.pos.x,wx,10,dt);CAM.pos.y=damp(CAM.pos.y,wy,10,dt);CAM.pos.z=damp(CAM.pos.z,wz,10,dt);
  CAM.look.x=damp(CAM.look.x,tx,14,dt);CAM.look.y=damp(CAM.look.y,ty,10,dt);CAM.look.z=damp(CAM.look.z,tz,14,dt);
  CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
  camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
  CAM.fovKick=damp(CAM.fovKick,0,9,dt);
  // A touch more FOV in interiors gives breathing room without changing Level 1.
  const baseFov=tight?68:60;
  const fov=baseFov+CAM.fovKick;if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
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
  updateSharks(dt);updateFish(dt);updateSpikefish(dt);updateBubbleShots(dt);updateClams(dt);updateKelp(dt);
  updateWin(dt);if(FINISH)FINISH.update(dt,won?winT:-1);
  updateParticles(dt);updateRings(dt);updateZ(dt);updateCamera(dt);updatePlayerVisual(dt);
  IN.jump=IN.b=IN.y=false;IN.jumpHeld=IN.bHeld=false;IN.camDX=IN.camDY=0;IN.mx=IN.mz=0;
  renderer.render(scene,camera);}
requestAnimationFrame(frame);
updateHUD();
