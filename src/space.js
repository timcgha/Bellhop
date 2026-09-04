// Level 4 — open-space zones, Launch Dock, Asteroid Garden, saucers, recovery.
let spaceGroup=null,blackHoleLandmark=null,cheeseMoonLandmark=null,cheeseMoonBody=null,spaceStars=[];
let spaceOpenZones=[],spacePlayVolume=null,spaceDecorPlanets=[];
let spaceRecoveryT=0,spaceRecoveryFrom=null;
let spaceLandingTargets=[],spaceRouteTrail=[],spaceFirstDest=null,spaceRouteBeacons=[];
const asteroids=[],saucers=[],spaceSparks=[],spaceStage2Ends=[],spaceStage3Ends=[],shieldedGates=[],spaceStage4Ends=[],spaceStage5Ends=[],spaceJellyfish=[];
let BLACK_HOLE=null;
const starCrates=[],starBeams=[],crystalDust=[];
let crystalInterior=null,candyPlanet=null,candyPlanetShellFade=1;
const BEAM_LEN=20,BEAM_DUR=0.35,BEAM_W=0.85;
const ASTEROID_KB=5.2,ASTEROID_INV=1.4,SAUCER_AGGRO=11,SAUCER_LEASH=13,SAUCER_WIND=0.5,SAUCER_CD=2.6;
const SPARK_GEO=new THREE.SphereGeometry(1,8,6);
for(let i=0;i<12;i++){const m=new THREE.Mesh(SPARK_GEO,new THREE.MeshBasicMaterial({color:0x7dff6a}));m.scale.setScalar(0.22);m.visible=false;scene.add(m);spaceSparks.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,trailT:0});}

function isSpaceLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.spaceAtmosphere);}
function spaceCfg(){return CURRENT_LEVEL&&CURRENT_LEVEL.openSpace;}

function clearSpaceWorld(){
  const rem=m=>{if(!m)return;if(m.parent&&m.parent.remove)m.parent.remove(m);else if(scene.remove)scene.remove(m);else if(m.visible!=null)m.visible=false;};
  destroyWarpTunnelVisuals();
  if(BLACK_HOLE&&BLACK_HOLE.voidGroup)rem(BLACK_HOLE.voidGroup);
  if(spaceGroup){while(spaceGroup.children.length)spaceGroup.remove(spaceGroup.children[0]);spaceGroup.visible=false;}
  blackHoleLandmark=null;cheeseMoonLandmark=null;cheeseMoonBody=null;spaceStars.length=0;spaceDecorPlanets.length=0;
  spaceOpenZones=[];spacePlayVolume=null;spaceRecoveryT=0;spaceRecoveryFrom=null;
  spaceLandingTargets.length=0;spaceRouteTrail.length=0;spaceFirstDest=null;spaceRouteBeacons.length=0;
  for(const a of asteroids)rem(a.g);asteroids.length=0;
  for(const s of saucers)rem(s.g);saucers.length=0;
  for(const e of spaceStage2Ends)rem(e.g);spaceStage2Ends.length=0;
  for(const e of spaceStage3Ends)rem(e.g);spaceStage3Ends.length=0;
  for(const g of shieldedGates){if(g.g)rem(g.g);if(g.solid&&g.solid.mesh)rem(g.solid.mesh);}
  shieldedGates.length=0;
  for(const e of spaceStage4Ends)rem(e.g);spaceStage4Ends.length=0;
  for(const e of spaceStage5Ends)rem(e.g);spaceStage5Ends.length=0;
  for(const j of spaceJellyfish)rem(j.g);spaceJellyfish.length=0;
  BLACK_HOLE=null;
  for(const c of starCrates)rem(c.g);starCrates.length=0;
  starBeams.length=0;crystalDust.length=0;crystalInterior=null;candyPlanet=null;candyPlanetShellFade=1;
  for(const q of spaceSparks){q.alive=false;q.m.visible=false;}
}

function beginSpaceLevel(L){
  if(landGround)landGround.visible=false;
  if(peakGround)peakGround.visible=false;
  if(underwaterGroup)underwaterGroup.visible=false;
  scene.background=new THREE.Color(0x050812);
  scene.fog=new THREE.Fog(0x0a1020,120,280);
  if(!spaceGroup){spaceGroup=new THREE.Group();scene.add(spaceGroup);}
  spaceGroup.visible=true;
  while(spaceGroup.children.length)spaceGroup.remove(spaceGroup.children[0]);
  spaceOpenZones=(L&&L.openSpaceZones)||[];
  spacePlayVolume=(L&&L.playVolume)||null;
  spaceFirstDest=(L&&L.firstDestination)||null;
  for(let i=0;i<140;i++){
    const r=rand(55,180),a=rand(0,TAU),el=rand(-0.35,0.55);
    const sx=Math.cos(a)*Math.cos(el)*r,sy=Math.sin(el)*r+rand(-8,18),sz=Math.sin(a)*Math.cos(el)*r;
    const s=mesh(SPH,new THREE.MeshBasicMaterial({color:Math.random()<0.15?0xfff8e8:0xffffff,transparent:true,opacity:rand(0.35,0.95)}),sx,sy,sz,rand(0.04,0.18));
    spaceGroup.add(s);spaceStars.push(s);
  }
}

function addBackdropPlanet(x,y,z,r,col,ring){
  const g=new THREE.Group();g.position.set(x,y,z);
  const body=mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.42}),0,0,0,r,r*0.92,r);
  g.add(body);
  if(ring){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(r*1.35,r*0.06,8,32),new THREE.MeshBasicMaterial({color:0x8898b8,transparent:true,opacity:0.28}));
    tor.rotation.x=Math.PI/2;g.add(tor);
  }
  g.userData.decor=true;g.userData.landable=false;
  scene.add(g);spaceDecorPlanets.push(g);levelDecor.push(g);return g;
}

function addBlackHoleLandmark(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  const core=mesh(SPH,new THREE.MeshBasicMaterial({color:0x020208}),0,0,0,2.8,2.8,2.8);g.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(5.2,0.55,10,48),new THREE.MeshBasicMaterial({color:0x3a2858,transparent:true,opacity:0.82}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(6.4,0.22,8,40),new THREE.MeshBasicMaterial({color:0x8878c8,transparent:true,opacity:0.45}));
  ring2.rotation.x=Math.PI/2;ring2.rotation.z=0.4;g.add(ring2);
  for(let i=0;i<12;i++){
    const a=i/12*TAU;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.7}),Math.cos(a)*6.8,Math.sin(a*2)*0.4,Math.sin(a)*6.8,0.12));
  }
  g.userData.landmark=true;g.userData.interactive=false;g.userData.landable=false;
  scene.add(g);blackHoleLandmark=g;levelDecor.push(g);
  return g;
}

function addSpaceBuoy(x,y,z,bright){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x5a6a78),0,0,0,0.08,1.6,0.08));
  const coreCol=bright?0xffe078:0x5ec8ff;
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:coreCol}),0,0.9,0,0.22));
  const halo=mesh(SPH,new THREE.MeshBasicMaterial({color:coreCol,transparent:true,opacity:bright?0.72:0.45}),0,0.9,0,0.38);
  g.add(halo);
  g.userData.routeBuoy=true;
  scene.add(g);spaceRouteBeacons.push(g);levelDecor.push(g);return g;
}

function addRouteTrail(x0,y0,z0,x1,y1,z1,n){
  const pts=[];
  for(let i=0;i<=n;i++){
    const t=i/n;
    const px=lerp(x0,x1,t),py=lerp(y0,y1,t)+Math.sin(t*Math.PI)*2.2,pz=lerp(z0,z1,t);
    pts.push({x:px,y:py,z:pz});
  }
  spaceRouteTrail.push({from:{x:x0,y:y0,z:z0},to:{x:x1,y:y1,z:z1},points:pts});
  for(let i=0;i<pts.length;i++){
    if(i%2===0)continue;
    const p=pts[i];
    const star=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.85}),p.x,p.y,p.z,0.16);
    star.userData.routeStar=true;star.userData.pulseT=rand(0,TAU);
    scene.add(star);spaceRouteBeacons.push(star);levelDecor.push(star);
  }
  return pts;
}

function addLandingBeacon(x,y,z,r,opts){
  opts=opts||{};
  const g=new THREE.Group();g.position.set(x,y,z);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r*0.92,0.14,10,40),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.88}));
  ring.rotation.x=Math.PI/2;ring.position.y=0.28;g.add(ring);
  const inner=mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff4c8,transparent:true,opacity:0.55}),0,0.28,0,r*0.55,0.04,r*0.55);
  g.add(inner);
  const beam=mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.42}),0,1.8,0,0.12,3.6,0.12);
  g.add(beam);
  for(let i=0;i<4;i++){
    const a=i/4*TAU;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.75}),Math.cos(a)*r*0.82,0.55,Math.sin(a)*r*0.82,0.1));
  }
  g.userData.landingBeacon=true;g.userData.pulseT=0;
  scene.add(g);levelDecor.push(g);
  spaceLandingTargets.push({
    x,y,z,r,
    approachR:opts.approachR||18,
    nearR:opts.nearR||8,
    primary:!!opts.primary,
    beacon:g
  });
  return g;
}

function addLaunchDock(x,y,z,w,d){
  const g=new THREE.Group();g.position.set(x,y,z);
  const plate=addSolid(x,y,z,w,0.45,d,0x4a5260,{surf:'pad',role:'landable'});
  plate.mesh.visible=true;
  if(plate.mesh.material&&plate.mesh.material.color)plate.mesh.material.color.setHex(0x5a6470);
  const rim=mesh(BOXG,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.55}),0,0.24,0,w+0.6,0.06,d+0.6);
  scene.add(rim);levelDecor.push(rim);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
    addSpaceBuoy(x+sx*(w*0.42),y+0.5,z+sz*(d*0.42));
  });
  for(let i=0;i<6;i++){
    const px=rand(-w*0.35,w*0.35),pz=rand(-d*0.35,d*0.35);
    addDecor(mesh(BOXG,lam(0x788898),x+px,y+0.24,z+pz,rand(0.4,1.2),0.04,rand(0.4,1.2)));
  }
  return plate;
}

function addPracticePad(x,y,z,r){
  const w=r*2;
  const sol=addSolid(x,y,z,w,0.38,w,0x3a4868,{surf:'pad',role:'landable',landingPad:true});
  sol.mesh.visible=true;
  if(sol.mesh.material&&sol.mesh.material.color)sol.mesh.material.color.setHex(0x4a5878);
  addLandingBeacon(x,y,z,r,{approachR:18,nearR:8,primary:true});
  return sol;
}

function solidIsLandable(s){
  return !!(s&&(s.role==='landable'||s.surf==='pad'));
}

function nearLandableAssist(p,cfg,maxH){
  maxH=maxH!=null?maxH:(cfg&&cfg.takeoffAssistH!=null?cfg.takeoffAssistH:3.5);
  let best=Infinity;
  for(const s of solids){
    if(!solidIsLandable(s))continue;
    if(p.x+R<=s.min.x||p.x-R>=s.max.x||p.z+R<=s.min.z||p.z-R>=s.max.z)continue;
    const dy=p.y-s.max.y;
    if(dy>=0&&dy<maxH)best=Math.min(best,dy);
  }
  return best<maxH;
}

function nearestLandingTarget(p){
  let best=null,bestD=Infinity;
  for(const t of spaceLandingTargets){
    const dx=p.x-t.x,dz=p.z-t.z,dy=p.y-(t.y+0.4);
    let dist=Math.hypot(Math.hypot(dx,dz),Math.abs(dy));
    // Prefer the obvious primary deck when two beacons compete.
    if(t.primary)dist*=0.72;
    if(dist<t.approachR&&dist<bestD){best=t;bestD=dist;}
  }
  return best?{target:best,dist:bestD}:null;
}

function applyLandingAssist(dt,p,v){
  if(!isSpaceLevel()||!spaceLandingTargets.length)return;
  const hit=nearestLandingTarget(p);
  if(!hit)return;
  const t=hit.target,dx=p.x-t.x,dz=p.z-t.z,dy=p.y-(t.y+0.4);
  const horiz=Math.hypot(dx,dz),dist=hit.dist;
  const outer=1-clamp(dist/t.approachR,0,1);
  const near=dist<t.nearR?1-clamp(dist/t.nearR,0,1):0;
  if(outer<=0)return;
  const sp=Math.hypot(v.x,v.y,v.z);
  if(sp>2.5){
    const slow=Math.exp(-(0.55*outer+0.85*near)*dt*3.2);
    v.x*=slow;v.y*=slow;v.z*=slow;
  }
  if(outer>0.12){
    const align=(0.9*outer+1.4*near)*dt;
    const pull=align*(2.4+4.5*near);
    if(horiz>0.12){v.x-=dx/(horiz||1)*pull;v.z-=dz/(horiz||1)*pull;}
    if(dy>0.25)v.y-=align*(t.primary?4.2:2.4);
    else if(dy<-0.15)v.y+=align*0.4;
  }
  if(near>0.2&&dy<4.5&&horiz<t.r*1.55){
    const snap=near*dt*(t.primary?8.5:5.5);
    if(horiz>0.08){v.x-=dx/(horiz||1)*snap;v.z-=dz/(horiz||1)*snap;}
    if(dy>0.08)v.y=moveTo(v.y,-2.6,11*dt);
  }
  if(near>0.28&&dy<3.5&&horiz<t.r*1.25){
    v.y=moveTo(v.y,-2.8,12*dt);
    if(horiz>0.05){v.x=moveTo(v.x,-dx/(horiz||1)*1.6,7*dt);v.z=moveTo(v.z,-dz/(horiz||1)*1.6,7*dt);}
  }
  // Soft claim while coasting down onto a pad — never while thrusting off one
  if(!IN.jumpHeld&&near>0.18&&horiz<t.r*1.2&&dy>=0&&dy<(t.primary?3.4:1.85)&&v.y<=0.65&&sp<5.5){
    const land=landableSurfaceAt(t.x,t.z);
    if(land){p.x=damp(p.x,t.x,8,dt);p.z=damp(p.z,t.z,8,dt);p.y=land.y;v.x*=0.25;v.y=0;v.z*=0.25;landOn(land.surf||'pad');}
  }
}

function landableSurfaceAt(x,z){
  let h=groundHeightAt(x,z),found=null;
  for(const s of solids){
    if(!solidIsLandable(s))continue;
    if(x+R<=s.min.x||x-R>=s.max.x||z+R<=s.min.z||z-R>=s.max.z)continue;
    if(s.max.y>h){h=s.max.y;found=s;}
  }
  return found?{y:h,surf:found.surf||'pad',solid:found}:null;
}

function pointInOpenZone(x,y,z){
  for(const zc of spaceOpenZones){
    if(x>=zc.x0&&x<=zc.x1&&y>=zc.y0&&y<=zc.y1&&z>=zc.z0&&z<=zc.z1)return true;
  }
  return false;
}

function pointInInterior(x,y,z){
  if(!crystalInterior||!crystalInterior.active)return false;
  const b=crystalInterior.bounds;
  return x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1&&z>=b.z0&&z<=b.z1;
}

function queryMoveZone(){
  if(!isSpaceLevel())return 'grounded';
  if(pointInInterior(P.pos.x,P.pos.y,P.pos.z))return 'grounded';
  if(P.grounded&&P.surf&&P.surf!=='void')return 'grounded';
  const land=landableSurfaceAt(P.pos.x,P.pos.z);
  if(land&&P.pos.y<=land.y+STEP+0.28&&P.vel.y<=2.5)return 'grounded';
  if(spaceOpenZones.length&&pointInOpenZone(P.pos.x,P.pos.y,P.pos.z))return 'openSpace';
  if(!land||P.pos.y>land.y+0.35)return 'openSpace';
  return 'grounded';
}

function applySpaceRecovery(dt){
  if(!isSpaceLevel()||!spacePlayVolume||spaceRecoveryT>0||P.dead||won)return false;
  // Finish immunity owns the ride — never soft-return mid-warp or in the void.
  if(isSpaceFinishImmune())return false;
  const pv=spacePlayVolume,cx=pv.cx!=null?pv.cx:0,cy=pv.cy!=null?pv.cy:8,cz=pv.cz!=null?pv.cz:0;
  const dx=P.pos.x-cx,dz=P.pos.z-cz,dy=P.pos.y-cy;
  const horiz=Math.hypot(dx,dz),dist=Math.hypot(horiz,Math.abs(dy));
  const soft= pv.soft||55,hard=pv.hard||82;
  if(dist<=soft)return false;
  if(dist>hard){
    spaceRecoveryT=pv.recoverDur||0.55;
    spaceRecoveryFrom={x:P.pos.x,y:P.pos.y,z:P.pos.z};
    const tgt=pv.recoverTo||P.spawn;
    P.pos.set(tgt.x,tgt.y,tgt.z);
    P.vel.set(0,0,0);
    P.grounded=false;P.moveZone='grounded';
    endSpaceThrust();clearLeapBoost();clearGlide();
    initSafeAnchor(tgt.x,tgt.y,tgt.z);
    SFX.refill();showToast('Whoops — back to the dock!');
    return true;
  }
  const nx=dx/(horiz||1),nz=dz/(horiz||1);
  const push=clamp((dist-soft)/(hard-soft),0,1)*18*dt;
  P.vel.x-=nx*push;P.vel.z-=nz*push;
  if(dy>12&&!P.spaceThrust)P.vel.y-=Math.sign(dy)*push*0.35;
  else if(dy<-12&&!P.spaceThrust)P.vel.y-=Math.sign(dy)*push*0.35;
  return false;
}

function addSpaceRestPad(x,y,z,r){
  r=r||3;
  const w=r*1.6;
  const sol=addSolid(x,y,z,w,0.32,w,0x3a4868,{surf:'pad',role:'landable',landingPad:true});
  sol.mesh.visible=true;
  if(sol.mesh.material&&sol.mesh.material.color)sol.mesh.material.color.setHex(0x4a6080);
  addLandingBeacon(x,y,z,r*0.85,{approachR:14,nearR:6,primary:false});
  return sol;
}

function addBackdropAsteroid(x,y,z,r){
  r=r||0.5;
  const g=new THREE.Group();g.position.set(x,y,z);
  const col=0x3a4250;
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.38}),0,0,0,r,r*0.88,r*0.95));
  g.userData.role='backdrop';g.userData.hazard=false;g.userData.decor=true;
  scene.add(g);levelDecor.push(g);
  asteroids.push({g,x,y,z,r,role:'backdrop',hazard:false,moving:false,spin:rand(0.05,0.15),ph:rand(0,TAU)});
  return asteroids[asteroids.length-1];
}

function buildHazardRock(r,role){
  const g=new THREE.Group();
  const bodyCol=role==='teach'?0x8a7a68:0x6e6254;
  const body=new THREE.Mesh(SPH,pho(bodyCol,35,0x2a2218));body.scale.set(r,r*0.88,r*0.94);g.add(body);
  g.add(mesh(SPH,lam(0x4a4038),r*0.35,r*0.15,-r*0.2,r*0.35,r*0.28,r*0.3));
  g.add(mesh(SPH,lam(0x9a8a78),-r*0.25,r*0.2,r*0.25,r*0.22));
  // Rim light so hazard reads against starfield on phone
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffd8a0,transparent:true,opacity:0.22}),0,0,0,r*1.08,r*0.95,r*1.02));
  g.userData={body,role};return g;
}

function addHazardAsteroid(x,y,z,r,role){
  r=r||1.6;role=role||'static';
  const g=buildHazardRock(r,role);g.position.set(x,y,z);scene.add(g);levelDecor.push(g);
  asteroids.push({g,x,y,z,hx:x,hy:y,hz:z,r,role,hazard:true,moving:false,spin:rand(0.2,0.45),ph:rand(0,TAU)});
  return asteroids[asteroids.length-1];
}

function addMovingAsteroid(x0,y0,z0,x1,y1,z1,r,period){
  r=r||1.5;period=period||10;
  const g=buildHazardRock(r,'moving');
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffc878,transparent:true,opacity:0.35}),0,0,0,r*0.2));
  g.position.set(x0,y0,z0);scene.add(g);levelDecor.push(g);
  // Dust path markers (telegraph)
  for(let i=1;i<5;i++){
    const t=i/5;
    const mx=lerp(x0,x1,t),my=lerp(y0,y1,t),mz=lerp(z0,z1,t);
    const dust=mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8b090,transparent:true,opacity:0.28}),mx,my,mz,0.12);
    dust.userData.pathDust=true;scene.add(dust);levelDecor.push(dust);spaceRouteBeacons.push(dust);
  }
  asteroids.push({g,x:x0,y:y0,z:z0,r,role:'moving',hazard:true,moving:true,
    p0:{x:x0,y:y0,z:z0},p1:{x:x1,y:y1,z:z1},period,phase:0,spin:0.55,ph:rand(0,TAU),trailT:0});
  return asteroids[asteroids.length-1];
}

function asteroidPos(a){
  if(!a.moving)return {x:a.x,y:a.y,z:a.z};
  const t=(Math.sin(a.phase*TAU)+1)*0.5;
  return {x:lerp(a.p0.x,a.p1.x,t),y:lerp(a.p0.y,a.p1.y,t),z:lerp(a.p0.z,a.p1.z,t)};
}

function isSpaceFinishImmune(){return won||!!(BLACK_HOLE&&(BLACK_HOLE.warping||BLACK_HOLE.finishImmune));}
function isSpaceWarpCamera(){return !!(BLACK_HOLE&&BLACK_HOLE.warping&&!won);}
function hurtFromAsteroid(a,px,py,pz){
  if(isSpaceFinishImmune()||P.inv>0||P.dead)return false;
  const dx=px-a.x,dy=(py+0.55)-a.y,dz=pz-a.z;
  const len=Math.hypot(dx,dy,dz)||1;
  // Moderate knockback AWAY from rock face; keep flight usable
  const k=ASTEROID_KB;
  P.hp--;P.inv=ASTEROID_INV;
  if(P.hasStarBeam){P.hasStarBeam=false;SFX.starBeamOut();}
  P.vel.x=dx/len*k;P.vel.y=dy/len*k*0.85;P.vel.z=dz/len*k;
  P.grounded=false;P.slam=0;P.puffAir=0;endHover();clearLeapBoost();clearGlide();
  // Keep space thrust available — do not endSpaceThrust permanently; brief interrupt only
  if(P.spaceThrust&&!IN.jumpHeld)endSpaceThrust();
  P.sq=0.65;SFX.hurt();CAM.shake=0.4;rumble(140,0.65,0.28);
  for(let i=0;i<10;i++)spawnP(px,py+0.5,pz,rand(-3,3),rand(-2,3),rand(-3,3),rand(0.07,0.13),0xc4a882,rand(0.3,0.5),0.3,-4,0.85);
  updateHUD();
  if(P.hp<=0){P.dead=true;P.deadT=1.8;SFX.deflate();showToast('Out of puff! Back to the last checkpoint…');}
  return true;
}

function updateAsteroids(dt){
  if(!isSpaceLevel())return;
  for(const a of asteroids){
    if(a.moving){
      a.phase=(a.phase+dt/a.period)%1;
      const p=asteroidPos(a);a.x=p.x;a.y=p.y;a.z=p.z;
      a.g.position.set(a.x,a.y,a.z);
      a.trailT=(a.trailT||0)-dt;
      if(a.trailT<=0){a.trailT=0.12;spawnP(a.x+rand(-0.3,0.3),a.y,a.z+rand(-0.3,0.3),rand(-0.4,0.4),rand(-0.3,0.3),rand(-0.4,0.4),0.08,0xc8b090,0.4,0.5,0,0.7);}
    }else{a.g.position.set(a.x,a.y,a.z);}
    a.g.rotation.y+=a.spin*dt;a.g.rotation.x+=a.spin*0.35*dt;
    if(!a.hazard||P.dead||isSpaceFinishImmune())continue;
    const dx=P.pos.x-a.x,dy=(P.pos.y+0.55)-a.y,dz=P.pos.z-a.z;
    const dist=Math.hypot(dx,dy,dz);
    const hitR=a.r+R*0.95;
    if(dist<hitR)hurtFromAsteroid(a,P.pos.x,P.pos.y,P.pos.z);
  }
}

function buildSaucer(size){
  size=size||1;
  const g=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.95,0.22,20),pho(0xc8d0dc,90,0xffffff));
  disc.position.y=0.35;g.add(disc);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.92,0.07,8,28),pho(0x8a98a8,60,0xffffff));
  rim.rotation.x=Math.PI/2;rim.position.y=0.35;g.add(rim);
  const dome=new THREE.Mesh(SPH,new THREE.MeshPhongMaterial({color:0x7dff9a,shininess:120,transparent:true,opacity:0.88}));
  dome.scale.set(0.42,0.32,0.42);dome.position.y=0.62;g.add(dome);
  // Alien eyes — readable hostile occupant
  [-0.12,0.12].forEach(x=>{
    g.add(mesh(SPH,pho(0xffffff,80),x,0.68,0.28,0.08));
    g.add(mesh(SPH,lam(0x1a3020),x,0.68,0.34,0.035));
  });
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x5dff7a}),0,0.22,0,0.12));
  g.userData={dome,disc};g.scale.setScalar(size);return g;
}

function addSaucer(x,y,z,type,withNote,opts){
  opts=opts||{};
  type=type||'small';
  const size=type==='big'?1.45:type==='mid'?1.15:1.0;
  const hp=type==='big'?3:type==='mid'?2:1;
  const g=buildSaucer(size);g.position.set(x,y,z);scene.add(g);levelDecor.push(g);
  let note=null;
  if(withNote){note=addNote(x,y+0.9,z,true);note.heldBy='saucer';}
  // Candy-surface saucers teach after landing — open-space belt saucers ignore this gate
  const surfaceGate=opts.openSpace?false:(opts.surfaceGate!=null?!!opts.surfaceGate:!!candyPlanet);
  saucers.push({g,x,y,z,hx:x,hy:y,hz:z,type,size,hp,maxHp:hp,alive:true,state:'patrol',t:0,
    face:rand(0,TAU),vx:0,vy:0,vz:0,stunT:0,hurtT:0,wind:0,spitT:rand(1.2,2.2),
    note,noteReleased:false,ph:rand(0,TAU),aggro:false,bob:0,surfaceGate});
  return saucers[saucers.length-1];
}

function revealSaucerNote(e){
  if(!e.note||e.noteReleased||e.note.got)return;
  e.noteReleased=true;
  // Pop the note slightly aside so defeat feedback is readable before collect
  const ox=e.x+(P.pos.x>e.x?-1.2:1.2),oy=e.y+0.8,oz=e.z;
  e.note.x=ox;e.note.y=oy;e.note.z=oz;
  e.note.g.position.set(ox,oy,oz);
  revealHeldNote(e.note);
}

function hitSaucer(e,dmg){
  if(!e.alive||e.state==='dying')return;
  e.hp-=dmg;e.hurtT=0.35;e.wind=0;SFX.blorp();
  for(let i=0;i<10;i++)spawnP(e.x,e.y+0.4,e.z,rand(-3,3),rand(-2,3),rand(-3,3),rand(0.07,0.14),0x7dff6a,rand(0.35,0.55),0.35,-5,0.9);
  if(e.hp<=0){
    e.state='dying';e.t=0;e.vx=0;e.vy=0;e.vz=0;SFX.dissolve();
    revealSaucerNote(e);
    if(P.hp<P.maxHp)addHeart(e.x,e.y+0.5,e.z);
    spawnRing(e.x,e.y,e.z,0xa8ff88,0.35,6,0.45);
    for(let i=0;i<16;i++)spawnP(e.x,e.y+0.3,e.z,rand(-3,3),rand(1,4),rand(-3,3),rand(0.08,0.16),Math.random()<0.5?0xc8d0dc:0x7dff6a,rand(0.5,0.9),0.5,-3,0.9);
    rumble(90,0.35,0.3);
  }
}

function stunSaucer(e){
  if(!e.alive||e.state==='dying')return;
  e.stunT=1.1;e.wind=0;e.hurtT=Math.max(e.hurtT,0.15);
  SFX.tick();
  for(let i=0;i<6;i++)spawnP(e.x,e.y+0.5,e.z,rand(-1.5,1.5),rand(0.5,2),rand(-1.5,1.5),0.07,0xffffff,0.4,0.5,0,0.75);
}

function lobSaucerSpark(e){
  let q=null;for(const b of spaceSparks){if(!b.alive){q=b;break;}}if(!q)return;
  const ox=e.x+Math.sin(e.face)*0.7*e.size,oy=e.y+0.35,oz=e.z+Math.cos(e.face)*0.7*e.size;
  const dx=P.pos.x-ox,dy=(P.pos.y+0.5)-oy,dz=P.pos.z-oz;
  const dist=Math.hypot(dx,dy,dz)||1;
  // Slow lazy spark — no homing after launch
  const sp=4.2;
  q.alive=true;q.life=3.2;q.trailT=0;q.pos.set(ox,oy,oz);q.vel.set(dx/dist*sp,dy/dist*sp*0.85,dz/dist*sp);
  q.m.visible=true;q.m.position.copy(q.pos);q.m.scale.setScalar(0.24);
  SFX.spit();
  for(let i=0;i<4;i++)spawnP(ox,oy,oz,rand(-1,1),rand(-0.5,1.5),rand(-1,1),0.06,0x7dff6a,0.35,0.4,0,0.8);
}

function updateSaucers(dt){
  if(!isSpaceLevel())return;
  for(const e of saucers){
    if(!e.alive)continue;
    const g=e.g;
    if(e.state==='dying'){
      e.t+=dt;const k=Math.max(0,1-e.t/0.85);
      g.scale.setScalar(e.size*(0.7+k*0.3));g.rotation.y+=dt*8;g.rotation.z=Math.sin(e.t*20)*0.4;
      g.position.set(e.x,e.y+e.t*1.2,e.z);
      if(g.userData.dome&&g.userData.dome.material)g.userData.dome.material.opacity=0.88*k;
      if(e.t>=0.85){e.alive=false;g.visible=false;}
      continue;
    }
    e.hurtT-=dt;e.stunT-=dt;
    const dx=P.pos.x-e.x,dy=P.pos.y-e.y,dz=P.pos.z-e.z;
    const d=Math.hypot(dx,dz),d3=Math.hypot(d,Math.abs(dy));
    const dHome=Math.hypot(e.x-e.hx,e.y-e.hy,e.z-e.hz);
    // Leash: return home if Pling leaves or saucer drifted far
    const plingNearHome=Math.hypot(P.pos.x-e.hx,P.pos.y-e.hy,P.pos.z-e.hz)<SAUCER_LEASH+4;
    const surfaceReady=!e.surfaceGate||P.grounded||(crystalInterior&&crystalInterior.inside)||P.moveZone==='grounded';
    e.aggro=!e.targetDummy&&surfaceReady&&d3<SAUCER_AGGRO&&!P.dead&&plingNearHome&&dHome<SAUCER_LEASH+2;
    if(e.aggro&&e.stunT<=0){
      e.face=Math.atan2(dx,dz);
      const want=2.8;
      if(d3>want){e.vx=moveTo(e.vx,dx/(d3||1)*2.4,6*dt);e.vy=moveTo(e.vy,dy/(d3||1)*1.6,5*dt);e.vz=moveTo(e.vz,dz/(d3||1)*2.4,6*dt);}
      else{e.vx=moveTo(e.vx,0,4*dt);e.vy=moveTo(e.vy,0,4*dt);e.vz=moveTo(e.vz,0,4*dt);}
    }else{
      // Patrol bob near home
      e.vx=moveTo(e.vx,(e.hx-e.x)*0.6,3*dt);e.vz=moveTo(e.vz,(e.hz-e.z)*0.6,3*dt);e.vy=moveTo(e.vy,(e.hy-e.y)*0.5,3*dt);
      if(dHome>SAUCER_LEASH){e.x=damp(e.x,e.hx,2.5,dt);e.y=damp(e.y,e.hy,2.5,dt);e.z=damp(e.z,e.hz,2.5,dt);}
    }
    if(e.stunT>0){e.vx*=0.85;e.vy*=0.85;e.vz*=0.85;}
    e.x+=e.vx*dt;e.y+=e.vy*dt;e.z+=e.vz*dt;
    // Soft leash clamp
    const dh=Math.hypot(e.x-e.hx,e.y-e.hy,e.z-e.hz);
    if(dh>SAUCER_LEASH){const s=SAUCER_LEASH/dh;e.x=e.hx+(e.x-e.hx)*s;e.y=e.hy+(e.y-e.hy)*s;e.z=e.hz+(e.z-e.hz)*s;e.vx*=0.5;e.vy*=0.5;e.vz*=0.5;}
    e.bob=Math.sin(time*2.4+e.ph)*0.18;
    // Candy-surface saucers stay clearly above the pad — never settle into the shell/deck.
    if(e.surfaceGate&&candyPlanet&&candyPlanet.pad){
      const padTop=candyPlanet.pad.y+0.55;
      const minY=padTop+1.35;
      if(e.hy<minY)e.hy=minY;
      if(e.y<minY){e.y=minY;if(e.vy<0)e.vy=0;}
    }
    g.position.set(e.x,e.y+e.bob,e.z);
    g.rotation.y=angDamp(g.rotation.y,e.face,5,dt);
    g.rotation.z=e.stunT>0?Math.sin(time*22)*0.25:(e.hurtT>0?Math.sin(time*30)*0.12:Math.sin(time*1.6+e.ph)*0.06);
    if(g.userData.dome){
      const pulse=e.wind>0?0.55+Math.sin(time*28)*0.4:0.75+Math.sin(time*3+e.ph)*0.1;
      g.userData.dome.material.opacity=e.stunT>0?0.35+Math.sin(time*18)*0.25:pulse;
      g.userData.dome.material.color.setHex(e.wind>0?0xfff06a:0x7dff9a);
    }
    // Attack: wind-up then one spark; only if facing/near and not stunned
    const canSee=e.aggro&&d3<12&&d3>2.2&&e.stunT<=0;
    if(canSee){e.spitT-=dt;if(e.spitT<=0&&e.wind<=0)e.wind=SAUCER_WIND;}
    else e.wind=0;
    if(e.wind>0){e.wind-=dt;if(e.wind<=0){lobSaucerSpark(e);e.spitT=SAUCER_CD;}}
    // Body contact — tutorial dummy takes hits but never damages Pling
    const CR=0.75*e.size;
    if(!P.dead&&d3<CR+0.35){
      if(P.bonkT>0){hitSaucer(e,1);}
      else if(!e.targetDummy&&P.inv<=0){
        const nx=dx/(d3||1),nz=dz/(d3||1);
        hurtPlayer(nx||0.1,nz||0.1,0x7dff6a);
        P.vel.y+=Math.sign(dy||1)*2.5;
      }
    }
  }
}

function updateSpaceSparks(dt){
  for(const q of spaceSparks){
    if(!q.alive)continue;
    q.life-=dt;q.pos.x+=q.vel.x*dt;q.pos.y+=q.vel.y*dt;q.pos.z+=q.vel.z*dt;q.m.position.copy(q.pos);
    q.trailT-=dt;if(q.trailT<=0){q.trailT=0.05;spawnP(q.pos.x,q.pos.y,q.pos.z,rand(-0.3,0.3),rand(-0.3,0.3),rand(-0.3,0.3),0.07,0x7dff6a,0.35,0.4,0,0.75);}
    if(!P.dead&&P.inv<=0&&Math.hypot(q.pos.x-P.pos.x,q.pos.y-(P.pos.y+0.55),q.pos.z-P.pos.z)<0.55){
      hurtPlayer(q.vel.x,q.vel.z,0x7dff6a);SFX.splat();q.alive=false;q.m.visible=false;continue;
    }
    // Bounce spark off saucer if reflected later; Stage 2: expire
    if(q.life<=0||Math.abs(q.pos.x)>120||Math.abs(q.pos.z)>220){q.alive=false;q.m.visible=false;}
  }
}

function addCheeseMoonLandmark(x,y,z,r){
  r=r||7;
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xf0d060,transparent:true,opacity:0.55}),0,0,0,r,r*0.92,r));
  // Crater nubs
  for(let i=0;i<6;i++){
    const a=i/6*TAU,cr=r*0.55;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xd4b048,transparent:true,opacity:0.5}),Math.cos(a)*cr,Math.sin(a*1.3)*cr*0.4,Math.sin(a)*cr,r*0.12));
  }
  g.userData.landmark=true;g.userData.landable=false;g.userData.decor=true;g.userData.cheeseMoon=true;
  scene.add(g);cheeseMoonLandmark=g;spaceDecorPlanets.push(g);levelDecor.push(g);
  return g;
}

function addSpaceStage2Endpoint(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  // Soft lookout ring facing Cheese Moon — foreshadow only; Stage 3 continues beyond
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.35}),0,0.05,0,2.8,0.08,2.8));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,0.12,8,32),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.7}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.55}),0,1.2,0,0.25));
  for(let i=0;i<4;i++){const a=i/4*TAU;g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x5ec8ff}),Math.cos(a)*2.2,0.4,Math.sin(a)*2.2,0.12));}
  scene.add(g);levelDecor.push(g);
  spaceStage2Ends.push({g,x,y,z,triggered:false,fxT:0});
  return g;
}

function updateSpaceStage2Ends(dt){
  for(const e of spaceStage2Ends){
    if(e.triggered){
      e.fxT+=dt;
      if(e.fxT>0.08&&e.fxT<0.9){
        e.pt=(e.pt||0)-dt;if(e.pt<=0){e.pt=0.06;
          spawnP(e.x+rand(-1.2,1.2),e.y+rand(0.3,2),e.z+rand(-1.2,1.2),rand(-1,1),rand(1,3),rand(-1,1),0.1,Math.random()<0.5?0x5ec8ff:0xffe078,0.5,0.4,0,0.8);
        }
      }
      // DEF-B-016: stay in Level 4 — Cheese Moon foreshadow must not soft-return to picker
      continue;
    }
    if(P.dead||won)continue;
    if(Math.hypot(P.pos.x-e.x,P.pos.y-e.y,P.pos.z-e.z)<3.2){
      e.triggered=true;e.fxT=0;e.pt=0;
      CAM.shake=Math.max(CAM.shake,0.3);CAM.fovKick=Math.max(CAM.fovKick,5);
      rumble(100,0.35,0.3);SFX.checkpoint();
      spawnRing(e.x,e.y+0.5,e.z,0xaaccff,0.4,6,0.5);
      showToast('Look — a cheese moon! Candy planet ahead!');
    }
  }
}

function beginSpaceOutOfRouteRecovery(){
  if(spaceRecoveryT>0)return;
  applySpaceRecovery(999);
}

function gustHitSaucers(mx,mz,k){
  for(const e of saucers){
    if(!e.alive||e.state==='dying')continue;
    const s=k(e.x,e.z);if(s>0&&Math.abs(e.y-P.pos.y)<3.5)stunSaucer(e);
  }
}

function spinHitSaucers(px,py,pz){
  let hit=false;
  for(const e of saucers){
    if(!e.alive||e.state==='dying')continue;
    const d=Math.hypot(e.x-px,e.y-py,e.z-pz);
    if(d<=BONKR+0.35*e.size){hitSaucer(e,1);hit=true;}
  }
  return hit;
}

function slamHitStarCrates(px,py,pz){
  for(const c of starCrates){
    if(c.broken)continue;
    if(Math.hypot(c.x-px,c.z-pz)<4.8*0.55&&Math.abs(c.y-py)<2.5)breakStarCrate(c);
  }
}

function spinHitStarCrates(px,pz){
  for(const c of starCrates){
    if(c.broken)continue;
    if(Math.hypot(c.x-px,c.z-pz)<BONKR+0.5&&Math.abs(c.y-P.pos.y)<2)breakStarCrate(c);
  }
}

function spinHitCracked(px,py,pz){
  let hit=false;
  for(const a of asteroids){
    if(!a.cracked||a.broken)continue;
    const d=Math.hypot(a.x-px,a.y-py,a.z-pz);
    if(d<=BONKR+a.r*0.4){hitCrackedAsteroid(a,1);hit=true;}
  }
  return hit;
}

function jetHitSaucers(){
  for(const e of saucers){
    if(!e.alive||e.state==='dying'||P.jetHits.indexOf(e)>=0)continue;
    const dx=e.x-P.pos.x,dz=e.z-P.pos.z,d=Math.hypot(dx,dz);
    if(d<0.55*e.size+0.35&&e.y<P.pos.y+0.2&&e.y>P.pos.y-1.1){P.jetHits.push(e);hitSaucer(e,1);}
  }
}

function buildCrackedRock(r){
  const g=buildHazardRock(r,'cracked');
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.65}),0,0,0,r*0.15));
  return g;
}

function addCrackedAsteroid(x,y,z,r,withNote){
  r=r||2.0;
  const g=buildCrackedRock(r);g.position.set(x,y,z);scene.add(g);levelDecor.push(g);
  let note=null;
  if(withNote){note=addNote(x,y+0.8,z,true);note.heldBy='cracked';}
  asteroids.push({g,x,y,z,r,role:'cracked',hazard:false,cracked:true,hp:2,moving:false,spin:0.3,ph:rand(0,TAU),note,noteReleased:false,broken:false});
  return asteroids[asteroids.length-1];
}

function hitCrackedAsteroid(a,dmg){
  if(a.broken||!a.cracked)return;
  a.hp-=dmg;a.hurtT=(a.hurtT||0)+0.3;SFX.crystalChime();
  for(let i=0;i<8;i++)spawnP(a.x,a.y,a.z,rand(-2,2),rand(0.5,2.5),rand(-2,2),rand(0.07,0.14),0xc8b0ff,rand(0.35,0.55),0.35,-4,0.85);
  if(a.hp<=0){
    a.broken=true;a.g.visible=false;
    if(a.note&&!a.noteReleased&&!a.note.got){a.noteReleased=true;revealHeldNote(a.note);}
    spawnRing(a.x,a.y,a.z,0xc8b0ff,0.35,6,0.45);
    for(let i=0;i<12;i++)spawnP(a.x,a.y,a.z,rand(-3,3),rand(1,4),rand(-3,3),rand(0.08,0.16),0xa090ff,rand(0.5,0.9),0.5,-3,0.9);
  }
}

function addCheeseMoonBody(x,y,z,r){
  r=r||7.5;
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xf0d060}),0,0,0,r,r*0.92,r));
  for(let i=0;i<6;i++){const a=i/6*TAU,cr=r*0.55;g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xd4b048,transparent:true,opacity:0.55}),Math.cos(a)*cr,Math.sin(a*1.3)*cr*0.4,Math.sin(a)*cr,r*0.14));}
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.35}),0,0,0,r*1.05,r*0.98,r*1.02));
  g.userData.landmark=true;g.userData.landable=true;g.userData.cheeseMoon=true;
  scene.add(g);cheeseMoonBody=g;cheeseMoonLandmark=g;spaceDecorPlanets.push(g);levelDecor.push(g);
  const padR=r*0.42;
  const sol=addSolid(x,y-r*0.55,z,padR*2,0.35,padR*2,0xe8c848,{surf:'pad',role:'landable',landingPad:true});
  sol.mesh.visible=true;
  addLandingBeacon(x,y-r*0.55,z,padR,{approachR:16,nearR:7,primary:true});
  return g;
}

function candyPlanetShellMesh(m,baseOp){
  if(!m||!m.material)return;
  m.material.transparent=true;
  if(m.material.opacity==null)m.material.opacity=baseOp;
  if(m.userData.shellBaseOp==null)m.userData.shellBaseOp=baseOp;
  return m;
}

// Proximity fade (Wreck-style): opaque until the player reaches the outer shell.
const CANDY_SHELL_ENTER_PAD=0.35,CANDY_SHELL_EXIT_PAD=2.0;
function inCandyPlanetShellZone(){
  if(!candyPlanet)return false;
  const cx=candyPlanet.x,cy=candyPlanet.y,cz=candyPlanet.z,r=candyPlanet.r;
  const pd=Math.hypot(P.pos.x-cx,P.pos.y-cy,P.pos.z-cz);
  const enterR=r+CANDY_SHELL_ENTER_PAD,exitR=r+CANDY_SHELL_EXIT_PAD;
  if(candyPlanet.shellInside)return pd<exitR;
  return pd<enterR;
}

function updateCandyPlanetShellFade(dt){
  if(!candyPlanet||!candyPlanet.shellMeshes||!candyPlanet.shellMeshes.length)return;
  const inside=inCandyPlanetShellZone();
  const target=inside?0.22:1;
  candyPlanetShellFade=damp(candyPlanetShellFade,target,7,dt||0.016);
  candyPlanet.shellInside=inside;
  const op=candyPlanetShellFade;
  for(const m of candyPlanet.shellMeshes){
    if(!m.material)continue;
    const b=m.userData&&m.userData.shellBaseOp!=null?m.userData.shellBaseOp:1;
    m.material.opacity=b*op;
    m.material.transparent=op<0.99||b<0.99;
    m.material.depthWrite=op>0.82&&b>0.82;
  }
}

function addCandyPlanet(x,y,z,r){
  r=r||11;
  const g=new THREE.Group();g.position.set(x,y,z);
  const shellMeshes=[];
  const stripes=[0xff6eb4,0xffe078,0x7ec8ff,0xff9ad6,0xc8f0ff];
  for(let i=0;i<stripes.length;i++){
    const band=mesh(SPH,new THREE.MeshBasicMaterial({color:stripes[i]}),0,(i-stripes.length/2)*r*0.14,0,r*0.98,r*0.16,r*0.98);
    g.add(band);shellMeshes.push(candyPlanetShellMesh(band,1));
  }
  const halo=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.25}),0,0,0,r*1.04,r*1.0,r*1.04);
  g.add(halo);shellMeshes.push(candyPlanetShellMesh(halo,0.25));
  const lollipop=mesh(CYL,new THREE.MeshBasicMaterial({color:0xff4080}),0,r*0.95,0,0.35,r*0.55,0.35);g.add(lollipop);
  g.userData.landmark=true;g.userData.landable=true;g.userData.candyPlanet=true;
  scene.add(g);
  // Approach-facing deck raised above the striped body so it reads from the flight lane
  const padX=x-5.2,padY=y+r*0.52,padZ=z+4.5;
  const padW=r*1.15,padD=r*1.05;
  const stem=mesh(CYL,new THREE.MeshBasicMaterial({color:0xff78b8,transparent:true,opacity:0.82}),padX,padY-r*0.2,padZ,padW*0.34,r*0.38,padW*0.34);
  scene.add(stem);levelDecor.push(stem);
  const sol=addSolid(padX,padY,padZ,padW,0.55,padD,0xff9ad6,{surf:'pad',role:'landable',landingPad:true});
  sol.mesh.visible=true;
  if(sol.mesh.material&&sol.mesh.material.color)sol.mesh.material.color.setHex(0xff9ad6);
  // Soft rim so the pad reads against candy stripes
  const rim=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.7}),padX,padY+0.58,padZ,padW+0.7,0.08,padD+0.7);
  scene.add(rim);levelDecor.push(rim);
  addLandingBeacon(padX,padY,padZ,r*0.48,{approachR:26,nearR:12,primary:true});
  candyPlanet={g,x,y,z,r,pad:{x:padX,y:padY,z:padZ,w:padW,d:padD},shellMeshes,greeted:false,landed:false,shellInside:false};
  spaceDecorPlanets.push(g);levelDecor.push(g);
  return candyPlanet;
}

function updateCandyPlanetLanding(dt){
  if(!candyPlanet||P.dead||won)return;
  if(crystalInterior&&crystalInterior.inside)return;
  if(P.grounded&&P.surf&&P.surf!=='void'){
    if(!candyPlanet.landed&&Math.hypot(P.pos.x-candyPlanet.pad.x,P.pos.z-candyPlanet.pad.z)<candyPlanet.r*0.85){
      candyPlanet.landed=true;
      if(!candyPlanet.landToast){candyPlanet.landToast=true;candyPlanet.greeted=true;showToast('Candy planet!');}
    }
    return;
  }
  const cp=candyPlanet,pad=cp.pad;
  const dx=P.pos.x-cp.x,dy=P.pos.y-cp.y,dz=P.pos.z-cp.z;
  const dist=Math.hypot(dx,dy,dz);
  const toPadX=pad.x-P.pos.x,toPadY=(pad.y+0.55)-P.pos.y,toPadZ=pad.z-P.pos.z;
  const padDist=Math.hypot(toPadX,toPadY,toPadZ)||1;
  const overPad=Math.abs(P.pos.x-pad.x)<pad.w*0.58&&Math.abs(P.pos.z-pad.z)<pad.d*0.58;
  const nearShell=dist<cp.r+2.4;
  if(!nearShell&&!overPad)return;
  if(!cp.greeted&&(dist<cp.r+1.2||overPad)){cp.greeted=true;showToast('Land on the candy planet!');}
  // Never fight a takeoff — assist is for approach and soft landing only
  if(IN.jumpHeld||P.spaceThrust||(!P.grounded&&P.vel.y>1.2))return;
  // Soft shell + approach assist: striped body is landable; pull to the deck
  const pull=dist<cp.r?28:(overPad?18:10);
  P.vel.x=moveTo(P.vel.x,toPadX/padDist*6,pull*dt);
  P.vel.y=moveTo(P.vel.y,toPadY/padDist*6,pull*dt);
  P.vel.z=moveTo(P.vel.z,toPadZ/padDist*6,pull*dt);
  if(dist<cp.r*0.95||(overPad&&P.pos.y<pad.y+3.5)||padDist<4.5){
    const land=landableSurfaceAt(pad.x,pad.z);
    if(land){
      P.pos.x=damp(P.pos.x,pad.x,10,dt);P.pos.z=damp(P.pos.z,pad.z,10,dt);
      if(Math.hypot(P.pos.x-pad.x,P.pos.z-pad.z)<3.5||dist<cp.r*0.88||padDist<3.2){
        P.pos.set(pad.x,land.y,pad.z);P.vel.set(0,0,0);landOn(land.surf||'pad');
        cp.landed=true;spawnRing(pad.x,pad.y+0.6,pad.z,0xff9ad6,0.35,6,0.45);
        if(!cp.landToast){cp.landToast=true;showToast('Candy planet!');SFX.checkpoint();}
      }
    }
  }
}

function buildStarCrateMesh(){
  const g=new THREE.Group();
  g.add(mesh(BOXG,lam(0x4a4868),0,0.45,0,0.95,0.95,0.95));
  g.add(mesh(BOXG,lam(0xffe078),0,0.45,0,1.0,0.16,1.0));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff}),0,0.95,0,0.18));
  for(let i=0;i<5;i++){const a=i/5*TAU;g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.8}),Math.cos(a)*0.35,0.95,Math.sin(a)*0.35,0.08));}
  return g;
}

function addStarCrate(x,y,z,renewable){
  const g=buildStarCrateMesh();g.position.set(x,y,z);scene.add(g);levelDecor.push(g);
  const ped=mesh(CYL,lam(0x6a5878),x,y-0.55,z,0.55,1.1,0.55);scene.add(ped);levelDecor.push(ped);
  const c={g,ped,x,y,z,renewable:!!renewable,broken:false,respawnT:0};
  starCrates.push(c);return c;
}

function breakStarCrate(c){
  if(c.broken)return;c.broken=true;c.g.visible=false;
  SFX.crate();CAM.shake=Math.max(CAM.shake,0.3);spawnRing(c.x,c.y+0.5,c.z,0xffe078,0.35,6,0.45);
  addStarPower(c.x,c.y+1.0,c.z);
  if(c.renewable)c.respawnT=4.5;
}

function updateStarCrates(dt){
  for(const c of starCrates){
    if(c.broken&&c.renewable){
      c.respawnT-=dt;
      if(c.respawnT<=0&&!P.hasStarBeam){
        c.broken=false;c.g.visible=true;c.respawnT=0;
        spawnRing(c.x,c.y+0.5,c.z,0xffe078,0.25,4,0.35);
      }
    }
    if(!c.broken&&Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<2.2&&Math.abs(c.y-P.pos.y)<2.5){
      if(P.bonkT>0||P.slam>0)breakStarCrate(c);
    }
  }
}

function addSaucerTarget(x,y,z){
  // Tutorial Candy saucer: passive (no aggro) but genuinely killable — same hp as a small saucer.
  const e=addSaucer(x,y,z,'small',false);
  e.targetDummy=true;e.alive=true;e.surfaceGate=true;
  return e;
}

function fireStarBeam(fx,fz,mx,my,mz){
  if(won||P.dead)return;
  SFX.starBeam();
  const ox=mx,oy=my,oz=mz;
  const len=Math.hypot(fx,fz)||1;
  const dx=fx/len,dz=fz/len;
  starBeams.push({x:ox,y:oy,z:oz,dx,dz,t:0,life:BEAM_DUR,hit:new Set()});
  // Locked designer identity: PURPLE / VIOLET Star Beam (not yellow/gold).
  for(let i=0;i<12;i++){
    const t=i/11*BEAM_LEN;
    const col=i%3===0?0xffffff:(i%2===0?0xa070ff:0xc8b0ff);
    spawnP(ox+dx*t,oy,oz+dz*t,rand(-0.15,0.15),rand(-0.15,0.15),rand(-0.15,0.15),0.085,col,0.5,0.35,0,0.9);
  }
  CAM.fovKick=Math.max(CAM.fovKick,3);
}

function beamHitPoint(b,px,py,pz,pr){
  const along=(px-b.x)*b.dx+(pz-b.z)*b.dz;
  if(along<0||along>BEAM_LEN)return false;
  const cx=b.x+b.dx*along,cz=b.z+b.dz*along;
  const r=pr||BEAM_W;
  // Horizontal tube with a taller vertical allowance — purple beam should hit hovering saucers from the pad.
  const dH=Math.hypot(px-cx,pz-cz);
  const dV=Math.abs(py-b.y);
  return dH<r&&dV<r*2.6;
}

function updateStarBeams(dt){
  for(let i=starBeams.length-1;i>=0;i--){
    const b=starBeams[i];
    b.t+=dt;
    if(b.t>=b.life){starBeams.splice(i,1);continue;}
    const k=1-b.t/b.life;
    for(let s=0;s<4;s++){
      const t=b.t*BEAM_LEN/BEAM_DUR+s*1.8;
      const col=s%2===0?0xa070ff:0xc8b0ff;
      spawnP(b.x+b.dx*t,b.y,b.z+b.dz*t,0,0,0,0.07,col,0.4*k,0.4,0,0.75);
    }
    for(const e of saucers){
      if(!e.alive||e.state==='dying'||b.hit.has(e))continue;
      // Tutorial dummy uses the same kill path as real saucers (Star Beam one-shots).
      const hitR=(e.targetDummy?0.9:0.75)*e.size;
      if(beamHitPoint(b,e.x,e.y+(e.targetDummy?0.3:0.35),e.z,hitR)){b.hit.add(e);hitSaucer(e,e.hp);}
    }
    for(const a of asteroids){
      if(!a.cracked||a.broken||b.hit.has(a))continue;
      if(beamHitPoint(b,a.x,a.y,a.z,a.r*0.85)){b.hit.add(a);hitCrackedAsteroid(a,2);}
    }
    for(const gate of shieldedGates){
      if(gate.opened||b.hit.has(gate))continue;
      if(beamHitPoint(b,gate.x,gate.y+gate.h*0.45,gate.z,gate.hitR||2.8)){b.hit.add(gate);openShieldedGate(gate);}
    }
  }
}

function addCrystalDust(x,y,z){
  const g=mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.55}),x,y,z,0.35);
  g.visible=false;scene.add(g);levelDecor.push(g);
  crystalDust.push({g,x,y,z,revealed:false,amt:1});return crystalDust[crystalDust.length-1];
}

function gustCrystalDust(mx,mz,k){
  for(const d of crystalDust){
    if(d.revealed)continue;
    const s=k(d.x,d.z);
    if(s>0.12&&Math.abs(d.y-P.pos.y)<3){
      d.revealed=true;d.g.visible=true;SFX.reveal();SFX.crystalChime();
      for(let i=0;i<8;i++)spawnP(d.x,d.y,d.z,rand(-1.5,1.5),rand(0.5,2),rand(-1.5,1.5),0.08,0xe8f0ff,0.5,0.4,0,0.85);
    }
  }
}

function addCrystalInterior(ox,oy,oz){
  const ix=ox,iy=oy-2,iz=oz-18;
  const g=new THREE.Group();g.position.set(ix,iy,iz);
  const deep=lam(0x2a1848),crystal=lam(0x8868c8),glow=new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.35});
  g.add(mesh(BOXG,deep,0,0.15,0,14,0.35,10));
  g.add(mesh(BOXG,glow,0,2.2,0,12,4.2,0.12));
  addSolid(ix,iy,iz,14,0.35,10,0x3a2868,{surf:'stone',role:'landable',landingPad:true});
  addSolid(ix,iy+1.2,iz-5.2,13,2.5,0.8,0x4a3868,{surf:'stone',invisible:true});
  addSolid(ix-6.2,iy+1.2,iz,0.8,2.8,9.5,0x4a3868,{surf:'stone',invisible:true});
  addSolid(ix+6.2,iy+1.2,iz,0.8,2.8,9.5,0x4a3868,{surf:'stone',invisible:true});
  for(let i=0;i<6;i++){
    const t=(i+0.5)/6;
    addSolid(ix-4+t*8,iy+0.8,iz-2+t*4,1.8,0.25,1.6,0x5a48a0,{surf:'stone',role:'landable'});
  }
  [[-4,1.5,-1],[4,1.5,1],[-2,2.2,2],[3,1.8,-2]].forEach(p=>{
    const shard=mesh(BOXG,crystal,p[0],p[1],p[2],0.35,1.2,0.35);g.add(shard);
    addCrystalDust(ix+p[0],iy+p[1]+0.6,iz+p[2]);
  });
  const mouth=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xa090ff,transparent:true,opacity:0.28}),0,2.5,4.8,4.2,3.2,0.2);
  g.add(mouth);
  scene.add(g);levelDecor.push(g);
  const padY=candyPlanet&&candyPlanet.pad?candyPlanet.pad.y+0.55:(candyPlanet?candyPlanet.y-candyPlanet.r*0.52+0.45:oy+1.5);
  crystalInterior={
    g,x:ix,y:iy,z:iz,active:true,
    bounds:{x0:ix-7,x1:ix+7,y0:iy-0.5,y1:iy+5.5,z0:iz-5.5,z1:iz+5.5},
    entry:{x:ox,y:padY,z:oz+0.6},entryInterior:{x:ix,y:iy+0.5,z:iz+4.2},
    exit:{x:ix,y:iy+3.8,z:iz-4.5},exteriorExit:{x:ox+6,y:oy+12,z:oz+10}
  };
  return crystalInterior;
}

function addCandyCaveMouth(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(BOXG,lam(0xff9ad6),0,1.2,0.6,5.5,2.6,1.2));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.35}),0,1.8,0.9,0.5));
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xff4080,transparent:true,opacity:0.55}),0,3.2,0,0.25,1.8,0.25));
  scene.add(g);levelDecor.push(g);
  if(candyPlanet)candyPlanet.caveMouth={x,y,z,g};
  return g;
}

function updateCrystalTransitions(dt){
  if(!crystalInterior||!crystalInterior.active||P.dead||won)return;
  const ci=crystalInterior;
  if(!ci.inside){
    const dx=P.pos.x-ci.entry.x,dz=P.pos.z-ci.entry.z,dy=P.pos.y-ci.entry.y;
    const d=Math.hypot(Math.hypot(dx,dz),Math.abs(dy));
    if(d<3.2&&(P.grounded||dy<2.5)){
      ci.inside=true;
      P.pos.set(ci.entryInterior.x,ci.entryInterior.y,ci.entryInterior.z);
      P.vel.set(0,0,0);P.grounded=true;P.moveZone='grounded';P.surf='stone';
      endSpaceThrust();SFX.checkpoint();showToast('Crystal cavern!');
      spawnRing(ci.entryInterior.x,ci.entryInterior.y,ci.entryInterior.z,0xc8b0ff,0.4,6,0.45);
    }
  }else{
    const d=Math.hypot(P.pos.x-ci.exit.x,P.pos.y-ci.exit.y,P.pos.z-ci.exit.z);
    if(d<2.8){
      ci.inside=false;
      P.pos.set(ci.exteriorExit.x,ci.exteriorExit.y,ci.exteriorExit.z);
      P.vel.set(0,0,0);P.grounded=false;P.moveZone='openSpace';P.surf='void';
      endSpaceThrust();SFX.checkpoint();showToast('Back to the stars!');
      spawnRing(ci.exteriorExit.x,ci.exteriorExit.y,ci.exteriorExit.z,0x5ec8ff,0.4,6,0.45);
    }
  }
}

function addSpaceStage3Endpoint(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.35}),0,0.05,0,3.2,0.08,3.2));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.8,0.14,8,32),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.75}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  scene.add(g);levelDecor.push(g);
  spaceStage3Ends.push({g,x,y,z,triggered:false,fxT:0});
  return g;
}

// Gate choke proximity reveal — collision stays on; visuals fade in before contact.
const GATE_ROCK_FAR=42,GATE_ROCK_NEAR=26,GATE_SHIELD_FAR=48,GATE_SHIELD_NEAR=28;
function gateRevealAlpha(dist,far,near){
  if(dist>=far)return 0;
  if(dist<=near)return 1;
  return smooth((far-dist)/(far-near));
}
function forEachGateMat(root,fn){
  if(!root)return;
  if(root.material)fn(root.material);
  const kids=root.children||[];
  for(let i=0;i<kids.length;i++){
    const c=kids[i];
    if(c.material)fn(c.material);
    if(c.children&&c.children.length)forEachGateMat(c,fn);
  }
}
function prepGateFadeMat(mat,baseOp){
  if(!mat)return;
  mat.transparent=true;
  mat.opacity=0;
  mat.userData=mat.userData||{};
  mat.userData.gateBaseOp=baseOp!=null?baseOp:1;
  mat.depthWrite=false;
}
function setGateMeshReveal(m,alpha){
  if(!m)return;
  const seen=typeof Set!=='undefined'?new Set():null;
  const apply=mat=>{
    if(!mat)return;
    if(seen){if(seen.has(mat))return;seen.add(mat);}
    const base=(mat.userData&&mat.userData.gateBaseOp!=null)?mat.userData.gateBaseOp:1;
    mat.opacity=base*alpha;
    mat.depthWrite=alpha>=0.99;
  };
  forEachGateMat(m,apply);
  m.visible=alpha>0.02;
}

function addShieldedGate(x,y,z,w,h,d){
  w=w||7;h=h||7;d=d||1.4;
  const g=new THREE.Group();g.position.set(x,y,z);
  // Purple energy wall fills the ONLY opening in an asteroid choke.
  const wall=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:0x8868ff,transparent:true,opacity:0.78}));
  wall.position.y=h*0.5;g.add(wall);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(w+0.45,h+0.7,d+0.35),new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.62}));
  rim.position.y=h*0.5;g.add(rim);
  for(let i=0;i<7;i++){
    const t=(i+0.5)/7;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xa070ff,transparent:true,opacity:0.9}),lerp(-w*0.42,w*0.42,t),h*0.55,0,0.16));
  }
  const pillarL=mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.7}),-w*0.52,0,0,0.28,h*1.08,0.28);
  const pillarR=mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.7}),w*0.52,0,0,0.28,h*1.08,0.28);
  g.add(pillarL);g.add(pillarR);
  g.userData.landmark=true;g.userData.shieldGate=true;
  // Start hidden — proximity reveal brings the purple opening in slightly earlier than rocks.
  forEachGateMat(g,mat=>prepGateFadeMat(mat,mat.opacity!=null?mat.opacity:1));
  g.visible=false;
  scene.add(g);levelDecor.push(g);
  // Thin-but-wide asteroid WALL with a single hole. Barriers stay after the beam clears the opening.
  // Keep Z thickness modest so the post-gate rest pad (z≈gate.z-2) stays clear.
  const rock=0x6a5a48;
  const thick=3.4;
  const spanL=70,spanR=70;
  const below=14,totalH=42;
  const left=addSolid(x-w*0.5-spanL*0.5,y-below,z,spanL,totalH,thick,rock,{surf:'stone',invisible:false});
  if(left.mesh&&left.mesh.material){left.mesh.material.color.setHex(0x7a6a58);prepGateFadeMat(left.mesh.material,1);}
  const right=addSolid(x+w*0.5+spanR*0.5,y-below,z,spanR,totalH,thick,rock,{surf:'stone',invisible:false});
  if(right.mesh&&right.mesh.material){right.mesh.material.color.setHex(0x7a6a58);prepGateFadeMat(right.mesh.material,1);}
  const floor=addSolid(x,y-below,z,w+0.6,below,thick,rock,{surf:'stone',invisible:false});
  if(floor.mesh&&floor.mesh.material){floor.mesh.material.color.setHex(0x5a4a3a);prepGateFadeMat(floor.mesh.material,1);}
  const ceilH=Math.max(8,totalH-below-h);
  const ceil=addSolid(x,y+h,z,w+0.6,ceilH,thick,rock,{surf:'stone',invisible:false});
  if(ceil.mesh&&ceil.mesh.material){ceil.mesh.material.color.setHex(0x5a4a3a);prepGateFadeMat(ceil.mesh.material,1);}
  // Readable boulder face along the wall so the choke is obvious, not an invisible slab.
  const rockMeshes=[];
  for(const side of[-1,1]){
    for(let i=0;i<6;i++){
      const bx=x+side*(w*0.5+1.8+i*3.1),by=y+0.6+i*1.35,bz=z+((i%2)?1.1:-1.1);
      const boulder=mesh(SPH,lam(0x8a7a68),bx,by,bz,1.55+i*0.12,1.2+i*0.08,1.4+i*0.1);
      prepGateFadeMat(boulder.material,1);
      scene.add(boulder);levelDecor.push(boulder);rockMeshes.push(boulder);
    }
  }
  for(let i=0;i<4;i++){
    const bx=x-w*0.35+i*(w*0.25),by=y-1.2-i*0.4,bz=z+((i%2)?0.9:-0.9);
    const sill=mesh(SPH,lam(0x6a5a48),bx,by,bz,1.1,0.85,1.0);
    prepGateFadeMat(sill.material,1);
    scene.add(sill);levelDecor.push(sill);rockMeshes.push(sill);
  }
  const solid=addSolid(x,y,z,w,h,d,0x442266,{surf:'stone',role:'shieldGate',invisible:true});
  const gate={g,x,y,z,w,h,d,hitR:Math.max(w,h)*0.55,solid,opened:false,openT:0,fxT:0,
    barriers:[left,right,ceil,floor],rockMeshes,
    reveal:{rockFar:GATE_ROCK_FAR,rockNear:GATE_ROCK_NEAR,shieldFar:GATE_SHIELD_FAR,shieldNear:GATE_SHIELD_NEAR,rockAlpha:0,shieldAlpha:0},
    opening:{x0:x-w/2,x1:x+w/2,y0:y,y1:y+h,z0:z-thick/2,z1:z+thick/2}};
  // Start fully hidden until the player approaches.
  for(const b of gate.barriers){if(b.mesh){b.mesh.visible=false;}}
  for(const m of rockMeshes)m.visible=false;
  shieldedGates.push(gate);
  return gate;
}

function openShieldedGate(gate){
  if(!gate||gate.opened)return;
  gate.opened=true;gate.openT=0;gate.fxT=0;
  if(gate.solid){
    const idx=solids.indexOf(gate.solid);
    if(idx>=0)solids.splice(idx,1);
    if(gate.solid.mesh&&gate.solid.mesh.parent)gate.solid.mesh.parent.remove(gate.solid.mesh);
    else if(gate.solid.mesh&&scene.remove)scene.remove(gate.solid.mesh);
    gate.solid=null;
  }
  SFX.crystalChime();CAM.shake=Math.max(CAM.shake,0.45);CAM.fovKick=Math.max(CAM.fovKick,6);
  spawnRing(gate.x,gate.y+gate.h*0.45,gate.z,0xc8b0ff,0.45,8,0.55);
  for(let i=0;i<18;i++)spawnP(gate.x+rand(-gate.w*0.4,gate.w*0.4),gate.y+rand(0.2,gate.h),gate.z+rand(-0.4,0.4),rand(-2,2),rand(0.5,3),rand(-1,1),rand(0.08,0.16),Math.random()<0.5?0xc8b0ff:0xa070ff,rand(0.5,0.9),0.45,-3,0.9);
  showToast('Star Beam opened the way!');
}

function updateShieldedGates(dt){
  for(const gate of shieldedGates){
    const cy=gate.y+gate.h*0.45;
    const dist=Math.hypot(P.pos.x-gate.x,P.pos.y-cy,P.pos.z-gate.z);
    const rockA=gateRevealAlpha(dist,GATE_ROCK_FAR,GATE_ROCK_NEAR);
    // Purple opening becomes readable a little earlier than the darkest rocks.
    let shieldA=gateRevealAlpha(dist,GATE_SHIELD_FAR,GATE_SHIELD_NEAR);
    if(gate.reveal){gate.reveal.rockAlpha=rockA;gate.reveal.shieldAlpha=shieldA;gate.reveal.dist=dist;}
    // Collision stays active; only presentation fades.
    for(const b of gate.barriers){if(b.mesh)setGateMeshReveal(b.mesh,rockA);}
    if(gate.rockMeshes)for(const m of gate.rockMeshes)setGateMeshReveal(m,rockA);
    if(gate.opened){
      gate.openT+=dt;gate.fxT+=dt;
      if(gate.g){
        const k=Math.max(0,1-gate.openT/0.85);
        gate.g.scale.set(1,Math.max(0.05,k),1);
        gate.g.rotation.y=gate.openT*2.4;
        gate.g.children.forEach(c=>{if(c.material&&c.material.opacity!=null)c.material.opacity*=0.985;});
        if(gate.openT>=0.85)gate.g.visible=false;
      }
    }else if(gate.g){
      setGateMeshReveal(gate.g,shieldA);
    }
  }
}

function addObservatoryLandmark(x,y,z){
  return buildObservatory(x,y,z,{landmarkOnly:true});
}

function addSpaceJellyfish(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  const bell=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.62}));
  bell.scale.set(0.55,0.42,0.55);g.add(bell);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.45}),0,-0.15,0,0.08));
  for(let i=0;i<4;i++){
    const a=i/4*TAU;
    const tent=mesh(CYL,new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.55}),Math.cos(a)*0.22,-0.35,Math.sin(a)*0.22,0.03,0.45,0.03);
    tent.rotation.x=0.35;g.add(tent);
  }
  g.userData.decor=true;g.userData.harmless=true;
  scene.add(g);levelDecor.push(g);
  spaceJellyfish.push({g,x,y,z,hx:x,hy:y,hz:z,ph:rand(0,TAU),drift:rand(0,TAU)});
  return g;
}

function updateSpaceJellyfish(dt){
  for(const j of spaceJellyfish){
    j.ph+=dt*0.35;
    const bob=Math.sin(time*1.4+j.ph)*0.35,sway=Math.sin(time*0.7+j.drift)*0.55;
    j.g.position.set(j.x+sway,j.y+bob,j.z+Math.cos(time*0.6+j.ph)*0.4);
    j.g.rotation.y+=dt*0.25;
    const bell=j.g.children[0];
    if(bell&&bell.material)bell.material.opacity=0.5+Math.sin(time*2+j.ph)*0.12;
  }
}

function gustHitJellyfish(mx,mz,k){
  for(const j of spaceJellyfish){
    const s=k(j.x,j.z);
    if(s>0.15&&Math.abs(j.y-P.pos.y)<4){
      j.drift+=0.8;SFX.bubblePop();
      for(let i=0;i<5;i++)spawnP(j.x,j.y,j.z,rand(-1,1),rand(0.2,1.2),rand(-1,1),0.07,0xc8b0ff,0.45,0.4,0,0.75);
    }
  }
}

function buildObservatory(x,y,z,opts){
  opts=opts||{};
  const g=new THREE.Group();g.position.set(x,y,z);
  // Glass deck platforms — MAIN deck is a real landable solid matching the visible cylinder.
  const deck=mesh(CYL,new THREE.MeshBasicMaterial({color:0x88a8d8,transparent:true,opacity:0.55}),0,0.2,0,5.2,0.35,5.2);
  g.add(deck);
  const deck2=mesh(CYL,new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.42}),-2.2,0.15,-1.8,3.4,0.28,3.4);
  g.add(deck2);
  if(!opts.landmarkOnly){
    // Generous main-deck collision (≈ visual radius 5.2). Bottom at y so top ≈ y+0.42.
    const mainDeck=addSolid(x,y,z,10.4,0.42,10.4,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
    mainDeck.mesh.visible=false;
    // Side deck also landable so the offset glass is honest.
    const sideDeck=addSolid(x-2.2,y,z-1.8,6.6,0.36,6.6,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
    sideDeck.mesh.visible=false;
    // Catwalk toward Black Hole remains as a readable secondary pad.
    const catwalk=addSolid(x,y+0.05,z-4.6,3.8,0.28,3.2,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
    catwalk.mesh.visible=true;
    if(catwalk.mesh.material&&catwalk.mesh.material.color)catwalk.mesh.material.color.setHex(0x7a98c8);
    // Landing assist targets the obvious MAIN deck center — not a tiny offset patch.
    addLandingBeacon(x,y,z,3.8,{approachR:30,nearR:16,primary:true});
    addLandingBeacon(x,y+0.05,z-4.6,1.8,{approachR:14,nearR:6,primary:false});
  }
  // Dome sits above deck so it does not hide Snoozle 4
  const dome=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.32}));
  dome.scale.set(3.2,1.7,3.2);dome.position.set(0,2.4,-0.4);g.add(dome);
  // Telescopes / frame point toward the Black Hole (-Z)
  const scope1=mesh(CYL,lam(0xc8d8f0),-1.4,2.4,-2.8,0.16,2.8,0.16);scope1.rotation.x=0.55;g.add(scope1);
  const scope2=mesh(CYL,lam(0xc8d8f0),1.5,2.2,-2.4,0.14,2.4,0.14);scope2.rotation.x=0.48;scope2.rotation.y=-0.2;g.add(scope2);
  const frame=mesh(CYL,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.78}),0,1.6,-4.2,0.12,0.12,3.4);
  g.add(frame);
  // Gold rim lights toward Black Hole for orientation
  for(let i=0;i<5;i++){
    const a=-0.55+i*0.28;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.75}),Math.sin(a)*3.6,0.85,-Math.cos(a)*4.4,0.16));
  }
  for(let i=0;i<8;i++){
    const a=i/8*TAU;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.55}),Math.cos(a)*5.0,0.5,Math.sin(a)*5.0,0.11));
  }
  // Soft pedestal under Snoozle 4 spot (toward BH) so the final friend reads clearly
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.55}),0,0.55,-2.6,0.9,0.18,0.9));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5}),0,1.05,-2.6,0.22));
  g.userData.landmark=true;g.userData.landable=true;g.userData.observatory=true;
  g.userData.deck={x,y:y+0.42,z,r:5.0};
  scene.add(g);levelDecor.push(g);spaceDecorPlanets.push(g);
  if(!opts.landmarkOnly){
    g.userData.fullObservatory=true;
    addSpaceJellyfish(x-4.2,y+2.2,z+2.0);
    addSpaceJellyfish(x+4.5,y+3.0,z+0.8);
    addSpaceJellyfish(x-2.0,y+3.8,z+3.2);
  }
  return g;
}

function addSpaceStage5Endpoint(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.38}),0,0.05,0,3.8,0.08,3.8));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2,0.14,8,32),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.8}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x88a8d8,transparent:true,opacity:0.6}),0,1.5,0,0.3));
  scene.add(g);levelDecor.push(g);
  spaceStage5Ends.push({g,x,y,z,triggered:false,fxT:0});
  return g;
}

function updateSpaceStage5Ends(dt){
  for(const e of spaceStage5Ends){
    if(e.triggered){
      e.fxT+=dt;
      if(e.fxT>0.08&&e.fxT<0.9){
        e.pt=(e.pt||0)-dt;if(e.pt<=0){e.pt=0.06;
          spawnP(e.x+rand(-1.2,1.2),e.y+rand(0.3,2),e.z+rand(-1.2,1.2),rand(-1,1),rand(1,3),rand(-1,1),0.1,Math.random()<0.5?0xa8d0ff:0xffe078,0.5,0.4,0,0.8);
        }
      }
      continue;
    }
    if(P.dead||won||isSpaceFinishImmune())continue;
    if(Math.hypot(P.pos.x-e.x,P.pos.y-e.y,P.pos.z-e.z)<3.5){
      e.triggered=true;e.fxT=0;e.pt=0;
      CAM.shake=Math.max(CAM.shake,0.35);CAM.fovKick=Math.max(CAM.fovKick,5);
      rumble(100,0.35,0.3);SFX.checkpoint();
      spawnRing(e.x,e.y+0.5,e.z,0xa8d0ff,0.4,6,0.5);
      showToast('The black hole waits ahead…');
    }
  }
}

function buildFinishVoidScene(bh){
  const vx=bh.x,vy=bh.y+10,vz=bh.z-48;
  const g=new THREE.Group();g.position.set(vx,vy,vz);g.visible=false;g.name='finishVoid';
  // Calm deep starfield — distinct from the ordinary approach black-hole scene.
  const stars=[];
  for(let i=0;i<90;i++){
    const a=rand(0,TAU),el=rand(-0.9,0.9),r=rand(10,58);
    const sx=Math.cos(a)*Math.cos(el)*r,sy=Math.sin(el)*r*0.7,sz=Math.sin(a)*Math.cos(el)*r-8;
    const st=mesh(SPH,new THREE.MeshBasicMaterial({color:Math.random()<0.2?0xfff0c8:0xffffff,transparent:true,opacity:rand(0.35,0.95)}),sx,sy,sz,rand(0.05,0.16));
    g.add(st);stars.push(st);
  }
  // Friendly glowing portal-remnant / halo behind the tableau (not scary).
  const softGlow=mesh(SPH,new THREE.MeshBasicMaterial({color:0x2a1848,transparent:true,opacity:0.55}),0,2.2,-16,5.5,5.5,5.5);
  g.add(softGlow);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(7.5,0.55,10,48),new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0.72}));
  halo.rotation.x=Math.PI/2;halo.position.set(0,2.2,-16);g.add(halo);
  const halo2=new THREE.Mesh(new THREE.TorusGeometry(9.2,0.22,8,40),new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.5}));
  halo2.rotation.x=Math.PI/2;halo2.rotation.z=0.35;halo2.position.set(0,2.2,-16);g.add(halo2);
  const sparkles=[];
  for(let i=0;i<18;i++){
    const a=i/18*TAU;
    const sp=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8}),Math.cos(a)*5.5,2.2+Math.sin(a*2)*0.6,Math.sin(a)*5.5-4,0.1);
    g.add(sp);sparkles.push(sp);
  }
  scene.add(g);levelDecor.push(g);
  bh.voidGroup=g;bh.voidStars=stars;bh.voidHalo=halo;bh.voidHalo2=halo2;bh.voidSparkles=sparkles;
  bh.voidCenter={x:vx,y:vy,z:vz};bh.voidActive=false;
}

function buildBlackHoleFinish(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  // Large inactive silhouette — readable from the Observatory (~28m away).
  const core=mesh(SPH,new THREE.MeshBasicMaterial({color:0x020208}),0,0,0,4.4,4.4,4.4);g.add(core);
  const darkHalo=mesh(SPH,new THREE.MeshBasicMaterial({color:0x1a1028,transparent:true,opacity:0.55}),0,0,0,5.6,5.6,5.6);g.add(darkHalo);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(8.4,0.85,10,48),new THREE.MeshBasicMaterial({color:0x3a2858,transparent:true,opacity:0.88}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(10.2,0.35,8,40),new THREE.MeshBasicMaterial({color:0x8878c8,transparent:true,opacity:0.55}));
  ring2.rotation.x=Math.PI/2;ring2.rotation.z=0.4;g.add(ring2);
  const portal=new THREE.Mesh(new THREE.TorusGeometry(3.2,0.28,10,40),new THREE.MeshBasicMaterial({color:0x1a1028,transparent:true,opacity:0.35}));
  portal.rotation.x=Math.PI/2;portal.visible=false;g.add(portal);
  const portalHalo=new THREE.Mesh(new THREE.TorusGeometry(3.8,0.16,8,36),new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0}));
  portalHalo.rotation.x=Math.PI/2;portalHalo.visible=false;g.add(portalHalo);
  const sparkles=[];
  for(let i=0;i<20;i++){
    const a=i/20*TAU;
    const sp=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.75}),Math.cos(a)*9.4,Math.sin(a*2)*0.5,Math.sin(a)*9.4,0.16);
    g.add(sp);sparkles.push(sp);
  }
  g.userData.landmark=true;g.userData.interactive=true;g.userData.landable=false;g.userData.active=false;
  scene.add(g);blackHoleLandmark=g;levelDecor.push(g);
  BLACK_HOLE={
    g,x,y,z,active:false,activated:false,warping:false,warpT:0,warpDur:7.0,finishImmune:false,
    portalR:7.2,triggerR:3.0,bounceR:8.5,
    core,ring,ring2,portal,portalHalo,sparkles,
    voidReady:true,voidActive:false,voidGroup:null,winBurstT:0,
    warpFrom:null,warpTo:null,
    warpGroup:null,warpStreaks:null,warpRings:null,warpPlanets:null
  };
  buildFinishVoidScene(BLACK_HOLE);
  registerFinish({
    x,z,top:y+14,
    winMsg:'The stars are singing!',
    onAllAwake(){activateBlackHolePortal();},
    onWin(){
      BLACK_HOLE.finishImmune=true;
      if(!BLACK_HOLE.voidActive)enterFinishVoid();
      spaceWinBurst();
    },
    update(dt,winT){updateBlackHoleFinish(dt,winT);},
    camHold(dt){spaceFinishCamHold(dt);}
  });
  return g;
}

function igniteBlackHoleRoute(){
  // Bright gold path from Observatory toward the Black Hole — no reading required.
  const ox=10,oy=25,oz=-276,tx=BLACK_HOLE.x,ty=BLACK_HOLE.y,tz=BLACK_HOLE.z;
  for(let i=0;i<=14;i++){
    const t=i/14;
    const px=lerp(ox,tx,t),py=lerp(oy,ty,t)+Math.sin(t*Math.PI)*1.6,pz=lerp(oz,tz,t);
    const star=mesh(SPH,new THREE.MeshBasicMaterial({color:i%2?0xffffff:0xfff0c8,transparent:true,opacity:0.95}),px,py,pz,0.28+t*0.12);
    star.userData.routeStar=true;star.userData.pathIgnite=true;star.userData.pulseT=i*0.4;
    scene.add(star);spaceRouteBeacons.push(star);levelDecor.push(star);
  }
  for(const b of spaceRouteBeacons){
    if(!b.userData)continue;
    const p=b.position||b;
    const z=p.z!=null?p.z:(b.position&&b.position.z);
    if(z==null||z>-278)continue;
    b.userData.pathIgnite=true;
    if(b.material&&b.material.color){b.material.color.setHex(0xfff0c8);b.material.opacity=1;}
    if(b.children)b.children.forEach(c=>{
      if(c.material&&c.material.color){c.material.color.setHex(0xfff0c8);if(c.material.opacity!=null)c.material.opacity=Math.max(c.material.opacity,0.9);}
    });
    if(b.scale&&b.scale.setScalar)b.scale.setScalar(1.55);
  }
  spawnRing(ox,oy,oz,0xfff0c8,0.5,8,0.55);
  spawnRing(BLACK_HOLE.x,BLACK_HOLE.y,BLACK_HOLE.z,0xffffff,0.7,12,0.7);
}

function activateBlackHolePortal(){
  if(!BLACK_HOLE||BLACK_HOLE.activated)return;
  BLACK_HOLE.activated=true;BLACK_HOLE.active=true;BLACK_HOLE.activateT=0;
  if(blackHoleLandmark)blackHoleLandmark.userData.active=true;
  if(BLACK_HOLE.portal){
    BLACK_HOLE.portal.visible=true;
    if(BLACK_HOLE.portal.material){BLACK_HOLE.portal.material.color.setHex(0xfff0c8);BLACK_HOLE.portal.material.opacity=0.92;}
  }
  if(BLACK_HOLE.portalHalo){
    BLACK_HOLE.portalHalo.visible=true;
    if(BLACK_HOLE.portalHalo.material)BLACK_HOLE.portalHalo.material.opacity=0.95;
  }
  if(BLACK_HOLE.ring&&BLACK_HOLE.ring.material){
    BLACK_HOLE.ring.material.color.setHex(0xfff0c8);
    BLACK_HOLE.ring.material.opacity=0.98;
  }
  if(BLACK_HOLE.ring2&&BLACK_HOLE.ring2.material){
    BLACK_HOLE.ring2.material.color.setHex(0xffffff);
    BLACK_HOLE.ring2.material.opacity=0.85;
  }
  if(BLACK_HOLE.sparkles)BLACK_HOLE.sparkles.forEach(sp=>{if(sp.material){sp.material.color.setHex(0xfff0c8);sp.material.opacity=1;}});
  igniteBlackHoleRoute();
  SFX.blackHoleOpen();
  CAM.shake=Math.max(CAM.shake,0.55);CAM.fovKick=Math.max(CAM.fovKick,8);
  spawnRing(BLACK_HOLE.x,BLACK_HOLE.y,BLACK_HOLE.z,0xfff0c8,0.55,10,0.65);
  for(let i=0;i<36;i++)spawnP(BLACK_HOLE.x+rand(-4,4),BLACK_HOLE.y+rand(-1,3),BLACK_HOLE.z+rand(-4,4),rand(-2,2),rand(0.5,3.5),rand(-2,2),rand(0.1,0.18),Math.random()<0.5?0xfff0c8:0xffffff,rand(0.55,1.0),0.4,-3,0.95);
  // Flash visible from Observatory
  for(let i=0;i<12;i++)spawnP(10+rand(-2,2),25+rand(0,2),-274+rand(-2,2),rand(-1,1),rand(1,3),rand(-3,-1),0.12,0xfff0c8,0.7,0.35,0,0.9);
  showToast('The portal opened!');
}

function destroyWarpTunnelVisuals(){
  if(!BLACK_HOLE)return;
  const rem=m=>{if(!m)return;if(m.parent&&m.parent.remove)m.parent.remove(m);else if(scene.remove)scene.remove(m);else if(m.visible!=null)m.visible=false;};
  if(BLACK_HOLE.warpGroup){rem(BLACK_HOLE.warpGroup);BLACK_HOLE.warpGroup=null;}
  BLACK_HOLE.warpStreaks=null;BLACK_HOLE.warpRings=null;BLACK_HOLE.warpPlanets=null;
}

function buildWarpTunnelVisuals(){
  destroyWarpTunnelVisuals();
  if(!BLACK_HOLE)return;
  const g=new THREE.Group();g.name='warpTunnel';
  const streaks=[];
  for(let i=0;i<160;i++){
    const a=rand(0,TAU),r=rand(0.7,5.2),d=rand(2,110);
    const len=rand(1.2,3.6);
    const st=mesh(BOXG,new THREE.MeshBasicMaterial({color:Math.random()<0.3?0xfff0c8:0xffffff,transparent:true,opacity:rand(0.55,1)}),Math.cos(a)*r,Math.sin(a)*r,d,0.045,0.045,len);
    g.add(st);streaks.push(st);
  }
  const rings=[];
  for(let i=0;i<16;i++){
    const col=CONF[i%CONF.length];
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.0+((i%3)*0.22),0.22+((i%2)*0.06),8,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.92}));
    ring.position.z=i*6.2+3;
    ring.rotation.z=i*0.35;
    g.add(ring);rings.push(ring);
  }
  const planets=[];
  const cols=[0xff8a6a,0x6fd4ff,0xffe078,0xc8b0ff,0x7dff9a,0xff9a3c];
  for(let i=0;i<7;i++){
    const pg=new THREE.Group();
    const rr=rand(0.85,2.0);
    pg.add(mesh(SPH,new THREE.MeshBasicMaterial({color:cols[i%cols.length]}),0,0,0,rr));
    if(i%2===0){
      const tor=new THREE.Mesh(new THREE.TorusGeometry(rr*1.35,rr*0.1,6,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55}));
      tor.rotation.x=Math.PI/2;pg.add(tor);
    }
    pg.position.set(rand(-7,7),rand(-3.5,3.5),18+i*12);
    g.add(pg);planets.push(pg);
  }
  scene.add(g);
  BLACK_HOLE.warpGroup=g;BLACK_HOLE.warpStreaks=streaks;BLACK_HOLE.warpRings=rings;BLACK_HOLE.warpPlanets=planets;
}

function startWarpTunnel(){
  if(!BLACK_HOLE||BLACK_HOLE.warping||won)return;
  BLACK_HOLE.warping=true;BLACK_HOLE.warpT=0;BLACK_HOLE.finishImmune=true;
  BLACK_HOLE.warpFrom={x:P.pos.x,y:P.pos.y,z:P.pos.z,yaw:P.yaw};
  // Ride ends at the finish-void entry — not the ordinary approach scene.
  const vc=BLACK_HOLE.voidCenter||{x:BLACK_HOLE.x,y:BLACK_HOLE.y+10,z:BLACK_HOLE.z-48};
  BLACK_HOLE.warpTo={x:vc.x,y:vc.y+1.5,z:vc.z+10};
  P.inv=99;P.vel.set(0,0,0);endSpaceThrust();
  buildWarpTunnelVisuals();
  SFX.warpWhoosh();CAM.mode='warp';
  rumble(200,0.5,0.45);
  applyWarpCamera(P.pos.x,P.pos.y,P.pos.z);
  const hint=$('hint');if(hint)hint.style.opacity=0;
  const toast=$('toast');if(toast){toast.style.opacity=0;toast.textContent='';}
}

function applyWarpCamera(px,py,pz){
  const yaw=P.yaw;
  // Behind Pling looking forward along his facing (sin/cos yaw).
  const fx=Math.sin(yaw),fz=Math.cos(yaw);
  CAM.look.set(px+fx*2.4,py+0.9,pz+fz*2.4);
  CAM.pos.set(px-fx*4.6,py+2.0,pz-fz*4.6);
  CAM.yaw=yaw;CAM.pitch=0.16;CAM.boomDist=5;CAM.targetDist=5;CAM.mode='warp';CAM.collisionPulled=false;
  CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
}

function stageFinishSnoozleTableau(){
  if(!BLACK_HOLE||!BLACK_HOLE.voidCenter)return;
  const n=snoozles.length;
  for(let i=0;i<n;i++){
    const s=snoozles[i];
    s.celebOrbit=true;
    if(s.state==='sleep'){s.state='home';s.g.userData.closed.visible=false;s.g.userData.open.visible=true;}
    s.orbitA=(i/Math.max(n,1))*TAU;
    s.orbitR=3.35;
    s.orbitH=1.15;
    s.ph=s.ph!=null?s.ph:i;
  }
}

function clearFinishSnoozleTableau(){
  for(const s of snoozles){if(s)s.celebOrbit=false;}
}

function enterFinishVoid(){
  if(!BLACK_HOLE)return;
  destroyWarpTunnelVisuals();
  BLACK_HOLE.warping=false;
  BLACK_HOLE.voidActive=true;
  BLACK_HOLE.finishImmune=true;
  if(BLACK_HOLE.voidGroup)BLACK_HOLE.voidGroup.visible=true;
  // Hide ordinary approach black hole — celebration lives in the void scene.
  if(BLACK_HOLE.g)BLACK_HOLE.g.visible=false;
  stageSpaceWinPose();
  stageFinishSnoozleTableau();
  updateFinishSnoozleTableau(0);
}

function stageSpaceWinPose(){
  if(!BLACK_HOLE)return;
  const c=BLACK_HOLE.voidCenter||{x:BLACK_HOLE.x,y:BLACK_HOLE.y+1.5,z:BLACK_HOLE.z-14};
  const vx=c.x,vy=c.y+1.2,vz=c.z;
  P.pos.set(vx,vy,vz);P.vel.set(0,0,0);P.grounded=false;P.yaw=Math.PI;
  CAM.look.set(vx,vy+1.5,vz);CAM.pos.set(vx+0.4,vy+6.2,vz+16.5);
  CAM.yaw=0.02;CAM.pitch=0.26;CAM.boomDist=18;CAM.targetDist=18;CAM.mode='finish';CAM.collisionPulled=false;
}

function spaceWinBurst(){
  if(!BLACK_HOLE)return;
  const c=BLACK_HOLE.voidCenter||{x:BLACK_HOLE.x,y:BLACK_HOLE.y,z:BLACK_HOLE.z};
  spawnRing(c.x,c.y+1,c.z,0xfff0c8,0.55,10,0.7);
  for(let i=0;i<32;i++){
    const a=rand(0,TAU),r=rand(2,9);
    spawnP(c.x+Math.cos(a)*r,c.y+rand(0.5,6),c.z+Math.sin(a)*r,
      rand(-2,2),rand(1,4),rand(-2,2),rand(0.08,0.16),CONF[Math.floor(Math.random()*CONF.length)],rand(0.6,1.1),0.35,-3,1);
  }
}

function spaceFinishCamHold(dt){
  if(!BLACK_HOLE)return;
  const c=BLACK_HOLE.voidCenter||{x:BLACK_HOLE.x,y:BLACK_HOLE.y+1.8,z:BLACK_HOLE.z-10};
  const lookX=c.x,lookY=c.y+1.8,lookZ=c.z;
  const posX=c.x+0.4,posY=c.y+6.4,posZ=c.z+17.5;
  CAM.look.x=damp(CAM.look.x,lookX,8,dt);CAM.look.y=damp(CAM.look.y,lookY,8,dt);CAM.look.z=damp(CAM.look.z,lookZ,8,dt);
  CAM.pos.x=damp(CAM.pos.x,posX,7,dt);CAM.pos.y=damp(CAM.pos.y,posY,7,dt);CAM.pos.z=damp(CAM.pos.z,posZ,7,dt);
  CAM.yaw=0.02;CAM.pitch=0.26;CAM.boomDist=18;CAM.targetDist=18;CAM.mode='finish';
  CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
  CAM.collisionPulled=false;
}

function updateFinishSnoozleTableau(dt){
  if(!BLACK_HOLE||!BLACK_HOLE.voidActive||!BLACK_HOLE.voidCenter)return;
  const c=BLACK_HOLE.voidCenter;
  for(const s of snoozles){
    if(!s.celebOrbit)continue;
    s.orbitA=(s.orbitA||0)+dt*0.58;
    const x=c.x+Math.cos(s.orbitA)*s.orbitR;
    const z=c.z+Math.sin(s.orbitA)*s.orbitR;
    const y=c.y+s.orbitH+Math.sin(time*2.2+(s.ph||0))*0.38;
    s.g.position.set(x,y,z);
    s.baseY=y;
    s.g.rotation.y+=dt*2.8;
  }
}

function repelInactiveBlackHole(dt){
  if(!BLACK_HOLE||BLACK_HOLE.active||BLACK_HOLE.warping||won||P.dead)return;
  const dx=P.pos.x-BLACK_HOLE.x,dy=(P.pos.y+0.55)-BLACK_HOLE.y,dz=P.pos.z-BLACK_HOLE.z;
  const d=Math.hypot(dx,dy,dz);
  if(d>=BLACK_HOLE.bounceR||d<0.01)return;
  const nx=dx/d,ny=dy/d,nz=dz/d;
  const push=(BLACK_HOLE.bounceR-d)*10*dt;
  P.vel.x+=nx*push;P.vel.y+=ny*push*0.65;P.vel.z+=nz*push;
  BLACK_HOLE.shimmerT=(BLACK_HOLE.shimmerT||0)-dt;
  if(BLACK_HOLE.shimmerT<=0){
    BLACK_HOLE.shimmerT=0.12;
    spawnP(BLACK_HOLE.x+nx*3.2,BLACK_HOLE.y+ny*1.5,BLACK_HOLE.z+nz*3.2,rand(-0.5,0.5),rand(0.2,1),rand(-0.5,0.5),0.08,0x8878c8,0.45,0.4,0,0.75);
  }
}

function updateWarpTunnel(dt){
  if(!BLACK_HOLE||!BLACK_HOLE.warping||won)return;
  BLACK_HOLE.warpT+=dt;
  const k=clamp(BLACK_HOLE.warpT/BLACK_HOLE.warpDur,0,1);
  const ease=smooth(k);
  const from=BLACK_HOLE.warpFrom,to=BLACK_HOLE.warpTo;
  const px=lerp(from.x,to.x,ease),py=lerp(from.y,to.y,ease)+Math.sin(k*Math.PI)*2.5,pz=lerp(from.z,to.z,ease);
  P.pos.set(px,py,pz);
  P.yaw=from.yaw+((()=>{let d=Math.atan2(to.x-from.x,to.z-from.z)-from.yaw;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;})())*ease;
  // Soft steering — child stays involved
  if(IN.mx||IN.mz){
    P.pos.x+=IN.mx*dt*2.2;P.pos.y+=IN.mz*dt*1.4;
  }
  applyWarpCamera(P.pos.x,P.pos.y,P.pos.z);
  // Tunnel spectacle: streaking stars, rainbow rings, passing planets travel past the camera.
  if(BLACK_HOLE.warpGroup){
    BLACK_HOLE.warpGroup.position.set(P.pos.x,P.pos.y,P.pos.z);
    BLACK_HOLE.warpGroup.rotation.y=P.yaw;
    const scroll=-(22+k*26);
    if(BLACK_HOLE.warpRings){
      for(let i=0;i<BLACK_HOLE.warpRings.length;i++){
        const ring=BLACK_HOLE.warpRings[i];
        ring.position.z+=scroll*dt;
        ring.rotation.z+=dt*(1.2+i*0.05);
        if(ring.position.z<-8){
          ring.position.z+=BLACK_HOLE.warpRings.length*6.2;
          if(ring.material)ring.material.color.setHex(CONF[(i+Math.floor(BLACK_HOLE.warpT*3))%CONF.length]);
        }
      }
    }
    if(BLACK_HOLE.warpStreaks){
      for(const st of BLACK_HOLE.warpStreaks){
        st.position.z+=-(48+k*40)*dt;
        if(st.position.z<-10){
          const a=rand(0,TAU),r=rand(0.7,5.2);
          st.position.set(Math.cos(a)*r,Math.sin(a)*r,st.position.z+110);
        }
      }
    }
    if(BLACK_HOLE.warpPlanets){
      for(let i=0;i<BLACK_HOLE.warpPlanets.length;i++){
        const pg=BLACK_HOLE.warpPlanets[i];
        pg.position.z+=-(12+k*12)*dt;
        pg.rotation.y+=dt*0.8;
        if(pg.position.z<-12){
          pg.position.z+=95;
          pg.position.x=rand(-7,7);pg.position.y=rand(-3.5,3.5);
        }
      }
    }
  }
  BLACK_HOLE.ringFxT=(BLACK_HOLE.ringFxT||0)-dt;
  if(BLACK_HOLE.ringFxT<=0){
    BLACK_HOLE.ringFxT=0.07;
    const ringCol=CONF[Math.floor(k*CONF.length)%CONF.length];
    spawnRing(P.pos.x,P.pos.y,P.pos.z,ringCol,0.2+k*0.3,4+k*3,0.3);
  }
  if(k>0.15&&k<0.95&&Math.random()<dt*3)SFX.warpTwinkle();
  if(BLACK_HOLE.warpT>=BLACK_HOLE.warpDur){
    enterFinishVoid();
    triggerWin();
  }
}

function updateBlackHoleFinish(dt,winT){
  if(!BLACK_HOLE)return;
  const bh=BLACK_HOLE;
  if(bh.g&&bh.g.visible!==false){
    if(bh.active){
      bh.activateT=(bh.activateT||0)+dt;
      const spin=0.08+bh.activateT*0.04;
      bh.g.rotation.y+=dt*spin;
      if(bh.ring)bh.ring.rotation.z+=dt*(0.35+bh.activateT*0.12);
      if(bh.ring2)bh.ring2.rotation.z-=dt*(0.22+bh.activateT*0.08);
      const pulse=0.55+Math.sin(time*2.8)*0.15;
      if(bh.portal&&bh.portal.material)bh.portal.material.opacity=pulse;
      if(bh.portalHalo&&bh.portalHalo.material)bh.portalHalo.material.opacity=0.35+Math.sin(time*3.2)*0.12;
      for(const sp of bh.sparkles){
        if(sp.material)sp.material.opacity=0.55+Math.sin(time*4+sp.position.x)*0.35;
      }
    }else{
      bh.g.rotation.y+=dt*0.08;
      if(bh.ring)bh.ring.rotation.z+=dt*0.25;
      if(bh.ring2)bh.ring2.rotation.z-=dt*0.18;
    }
  }
  if(bh.warping){updateWarpTunnel(dt);return;}
  repelInactiveBlackHole(dt);
  if(bh.active&&!won&&!bh.warping){
    const dx=P.pos.x-bh.x,dy=(P.pos.y+0.55)-bh.y,dz=P.pos.z-bh.z;
    const d=Math.hypot(dx,dy,dz);
    if(d<bh.triggerR)startWarpTunnel();
  }
  if(winT>=0){
    updateFinishSnoozleTableau(dt);
    if(bh.voidGroup&&bh.voidGroup.visible){
      if(bh.voidHalo)bh.voidHalo.rotation.z+=dt*0.35;
      if(bh.voidHalo2)bh.voidHalo2.rotation.z-=dt*0.22;
      if(bh.voidSparkles){
        for(const sp of bh.voidSparkles){
          if(sp.material)sp.material.opacity=0.5+Math.sin(time*4.5+sp.position.x)*0.4;
        }
      }
    }
    bh.winBurstT=(bh.winBurstT||0)-dt;
    if(bh.winBurstT<=0&&winT<14){
      bh.winBurstT=0.08;
      spaceWinBurst();
    }
  }
}


function addSpaceStage4Endpoint(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0x88a8d8,transparent:true,opacity:0.35}),0,0.05,0,3.6,0.08,3.6));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.0,0.14,8,32),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.78}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.65}),0,1.4,0,0.28));
  scene.add(g);levelDecor.push(g);
  spaceStage4Ends.push({g,x,y,z,triggered:false,fxT:0});
  return g;
}

function updateSpaceStage4Ends(dt){
  for(const e of spaceStage4Ends){
    if(e.triggered){
      e.fxT+=dt;
      if(e.fxT>0.08&&e.fxT<0.9){
        e.pt=(e.pt||0)-dt;if(e.pt<=0){e.pt=0.06;
          spawnP(e.x+rand(-1.2,1.2),e.y+rand(0.3,2),e.z+rand(-1.2,1.2),rand(-1,1),rand(1,3),rand(-1,1),0.1,Math.random()<0.5?0x88a8d8:0xffe078,0.5,0.4,0,0.8);
        }
      }
      continue;
    }
    if(P.dead||won)continue;
    if(Math.hypot(P.pos.x-e.x,P.pos.y-e.y,P.pos.z-e.z)<3.5){
      e.triggered=true;e.fxT=0;e.pt=0;
      CAM.shake=Math.max(CAM.shake,0.35);CAM.fovKick=Math.max(CAM.fovKick,5);
      rumble(100,0.35,0.3);SFX.checkpoint();
      spawnRing(e.x,e.y+0.5,e.z,0x88a8d8,0.4,6,0.5);
      showToast('The Star Observatory waits ahead…');
    }
  }
}

function updateSpaceStage3Ends(dt){
  for(const e of spaceStage3Ends){
    if(e.triggered){
      e.fxT+=dt;
      if(e.fxT>0.08&&e.fxT<0.9){
        e.pt=(e.pt||0)-dt;if(e.pt<=0){e.pt=0.06;
          spawnP(e.x+rand(-1.2,1.2),e.y+rand(0.3,2),e.z+rand(-1.2,1.2),rand(-1,1),rand(1,3),rand(-1,1),0.1,Math.random()<0.5?0xc8b0ff:0xffe078,0.5,0.4,0,0.8);
        }
      }
      // DEF-B-017: Stage 3 foreshadow must not soft-return to picker — Level 4 continues
      continue;
    }
    if(P.dead||won)continue;
    if(Math.hypot(P.pos.x-e.x,P.pos.y-e.y,P.pos.z-e.z)<3.5){
      e.triggered=true;e.fxT=0;e.pt=0;
      CAM.shake=Math.max(CAM.shake,0.35);CAM.fovKick=Math.max(CAM.fovKick,5);
      rumble(100,0.35,0.3);SFX.checkpoint();
      spawnRing(e.x,e.y+0.5,e.z,0xc8b0ff,0.4,6,0.5);
      showToast('The saucer belt waits ahead…');
    }
  }
}

function updateSpaceWorld(dt){
  if(!isSpaceLevel())return;
  updateAsteroids(dt);
  updateSaucers(dt);
  updateSpaceSparks(dt);
  updateStarBeams(dt);
  updateStarCrates(dt);
  updateCrystalTransitions(dt);
  updateCandyPlanetLanding(dt);
  updateCandyPlanetShellFade(dt);
  updateSpaceStage2Ends(dt);
  updateSpaceStage3Ends(dt);
  updateShieldedGates(dt);
  updateSpaceStage4Ends(dt);
  updateSpaceStage5Ends(dt);
  updateSpaceJellyfish(dt);
}

function updateSpaceDecor(dt){
  if(!isSpaceLevel())return;
  for(const b of spaceRouteBeacons){
    if(b.userData&&b.userData.routeStar){
      const boost=b.userData.pathIgnite?1.55:1;
      const ph=b.userData.pulseT+time*(b.userData.pathIgnite?4.2:2.4);
      b.material.opacity=(0.55+Math.sin(ph)*0.35)*Math.min(1,0.65+boost*0.25);
      b.scale.setScalar((0.14+Math.sin(ph*1.3)*0.04)*boost);
    }else if(b.userData&&b.userData.pathIgnite&&b.children){
      const ph=time*3.6;
      b.children.forEach(c=>{if(c.material&&c.material.opacity!=null)c.material.opacity=0.75+Math.sin(ph)*0.22;});
    }
  }
  for(const t of spaceLandingTargets){
    if(!t.beacon)continue;
    const ph=time*2.8;
    t.beacon.children.forEach((c,i)=>{
      if(c.material&&c.material.opacity!=null){
        if(i===0)c.material.opacity=0.72+Math.sin(ph)*0.2;
        else if(i===2)c.material.opacity=0.32+Math.sin(ph*1.1)*0.18;
      }
    });
  }
  if(blackHoleLandmark&&!BLACK_HOLE){
    blackHoleLandmark.rotation.y+=dt*0.08;
    const ch=blackHoleLandmark.children;
    if(ch[1])ch[1].rotation.z+=dt*0.25;
    if(ch[2])ch[2].rotation.z-=dt*0.18;
  }
  const moonSpin=cheeseMoonBody||cheeseMoonLandmark;
  if(moonSpin)moonSpin.rotation.y+=dt*0.04;
  if(candyPlanet&&candyPlanet.g)candyPlanet.g.rotation.y+=dt*0.025;
  for(const p of spaceDecorPlanets){if(p!==cheeseMoonLandmark&&p!==(cheeseMoonBody||null)&&p!==(candyPlanet&&candyPlanet.g))p.rotation.y+=dt*0.015;}
}

window.__SPACE={
  isSpaceLevel,spaceCfg,queryMoveZone,landableSurfaceAt,solidIsLandable,pointInOpenZone,
  nearLandableAssist,nearestLandingTarget,applyLandingAssist,
  get blackHole(){return blackHoleLandmark;},
  get cheeseMoon(){return cheeseMoonBody||cheeseMoonLandmark;},
  get decorPlanets(){return spaceDecorPlanets;},
  get landingTargets(){return spaceLandingTargets;},
  get routeTrail(){return spaceRouteTrail;},
  get firstDestination(){return spaceFirstDest;},
  get routeBeacons(){return spaceRouteBeacons;},
  get openZones(){return spaceOpenZones;},
  get playVolume(){return spacePlayVolume;},
  get recoveryT(){return spaceRecoveryT;},
  get asteroids(){return asteroids;},
  get saucers(){return saucers;},
  get sparks(){return spaceSparks;},
  get stage2Ends(){return spaceStage2Ends;},
  get stage3Ends(){return spaceStage3Ends;},
  get stage4Ends(){return spaceStage4Ends;},
  get shieldedGates(){return shieldedGates;},
  get stage5Ends(){return spaceStage5Ends;},
  get blackHoleFinish(){return BLACK_HOLE;},
  get jellyfish(){return spaceJellyfish;},
  isSpaceFinishImmune,isSpaceWarpCamera,activateBlackHolePortal,startWarpTunnel,
  get starCrates(){return starCrates;},
  get starBeams(){return starBeams;},
  get crystalInterior(){return crystalInterior;},
  get candyPlanet(){return candyPlanet;},
  get candyPlanetShellFade(){return candyPlanetShellFade;},
  inCandyPlanetShellZone,updateCandyPlanetShellFade,
  get CANDY_SHELL_ENTER_PAD(){return CANDY_SHELL_ENTER_PAD;},
  get CANDY_SHELL_EXIT_PAD(){return CANDY_SHELL_EXIT_PAD;},
  get cheeseMoonBody(){return cheeseMoonBody;},
  get STAR_BEAM_COLORS(){return[0xa070ff,0xc8b0ff,0xffffff];},
  get GATE_REVEAL(){return{rockFar:GATE_ROCK_FAR,rockNear:GATE_ROCK_NEAR,shieldFar:GATE_SHIELD_FAR,shieldNear:GATE_SHIELD_NEAR};},
  gateRevealAlpha,
  asteroidPos,hurtFromAsteroid,hitSaucer,stunSaucer,fireStarBeam,gustCrystalDust,spinHitCracked,spinHitStarCrates,slamHitStarCrates
};
