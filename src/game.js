let time=0,rescued=0,gotNotes=0;
let started=false;
window.__W={solids,gloops,goos,hearts,crates,powers,fires,checks,snoozles,notes,dust,puddles,get won(){return won;},get WM(){return WM;},get RAINBOW(){return RAINBOW;}};
window.__started=()=>started;

// ---------- camera ----------
const CAM=window.__CAM={yaw:0,pitch:0.42,dist:8.5,pos:new THREE.Vector3(0,5,19),look:new THREE.Vector3(0,1,10),shake:0,fovKick:0,lastManual:-9};
function updateCamera(dt){
  if(Math.abs(IN.camDX)>1e-4||Math.abs(IN.camDY)>1e-4){CAM.yaw+=IN.camDX;CAM.pitch=clamp(CAM.pitch+IN.camDY,0.08,1.05);CAM.lastManual=time;}
  const sp=Math.hypot(P.vel.x,P.vel.z);
  if(sp>2&&time-CAM.lastManual>1.2){const mvx=P.vel.x/sp,mvz=P.vel.z/sp;const fx=-Math.sin(CAM.yaw),fz=-Math.cos(CAM.yaw);const d=mvx*fx+mvz*fz;if(d>-0.3)CAM.yaw=angDamp(CAM.yaw,Math.atan2(-mvx,-mvz),1.2*(0.5+d*0.5),dt);}
  const tx=P.pos.x,ty=P.pos.y+1.1,tz=P.pos.z;
  const cp=Math.cos(CAM.pitch),spp=Math.sin(CAM.pitch);
  const dx=Math.sin(CAM.yaw)*cp*CAM.dist,dy=spp*CAM.dist,dz=Math.cos(CAM.yaw)*cp*CAM.dist;
  let k=1;for(let i=1;i<=8;i++){const f=i/8;if(insideSolid(tx+dx*f,ty+dy*f,tz+dz*f,0.35)){k=(i-1)/8;break;}}k=Math.max(k,0.25);
  const wx=tx+dx*k,wz=tz+dz*k,wy=Math.max(ty+dy*k,groundHeightAt(wx,wz)+0.6);
  CAM.pos.x=damp(CAM.pos.x,wx,10,dt);CAM.pos.y=damp(CAM.pos.y,wy,10,dt);CAM.pos.z=damp(CAM.pos.z,wz,10,dt);
  CAM.look.x=damp(CAM.look.x,tx,14,dt);CAM.look.y=damp(CAM.look.y,ty,10,dt);CAM.look.z=damp(CAM.look.z,tz,14,dt);
  CAM.shake=Math.max(0,CAM.shake-dt*2.2);const sh=CAM.shake*CAM.shake*0.35;
  camera.position.set(CAM.pos.x+rand(-sh,sh),CAM.pos.y+rand(-sh,sh),CAM.pos.z+rand(-sh,sh));camera.lookAt(CAM.look);
  CAM.fovKick=damp(CAM.fovKick,0,9,dt);const fov=60+CAM.fovKick;if(Math.abs(camera.fov-fov)>0.01){camera.fov=fov;camera.updateProjectionMatrix();}
}

// ---------- loop ----------
camera.position.copy(CAM.pos);camera.lookAt(CAM.look);
let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;
  pollGamepad(dt);
  if(!started){updateClouds(dt);updateSnoozles(dt);updateZ(dt);updatePlayerVisual(dt);renderer.render(scene,camera);return;}
  time+=dt;
  readKeys(dt);if(T.stickId!==null){IN.mx=T.jx;IN.mz=T.jy;}if(HELD.a)IN.jumpHeld=true;if(HELD.b)IN.bHeld=true;
  updatePlayer(dt);updateWobblers(dt);updatePinwheels(dt);updateToss(dt);updateNotes(dt);updateSnoozles(dt);updateBoat(dt);updateWindmill(dt);updateFans(dt);updateClouds(dt);updateGloops(dt);updateGoos(dt);updatePuddles(dt);updateFires(dt);updateCrates(dt);updatePowers(dt);updateHearts(dt);updateChecks(dt);updateWin(dt);
  updateParticles(dt);updateRings(dt);updateZ(dt);updateCamera(dt);updatePlayerVisual(dt);
  IN.jump=IN.b=IN.y=false;IN.jumpHeld=IN.bHeld=false;IN.camDX=IN.camDY=0;IN.mx=IN.mz=0;
  renderer.render(scene,camera);}
requestAnimationFrame(frame);
updateHUD();
