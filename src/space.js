// Level 4 — open-space zones, Launch Dock, Asteroid Garden, saucers, recovery.
let spaceGroup=null,blackHoleLandmark=null,cheeseMoonLandmark=null,cheeseMoonBody=null,spaceStars=[];
let spaceOpenZones=[],spacePlayVolume=null,spaceDecorPlanets=[];
let spaceRecoveryT=0,spaceRecoveryFrom=null;
let spaceLandingTargets=[],spaceRouteTrail=[],spaceFirstDest=null,spaceRouteBeacons=[];
const asteroids=[],saucers=[],spaceSparks=[],spaceStage2Ends=[],spaceStage3Ends=[],shieldedGates=[],spaceStage4Ends=[];
const starCrates=[],starBeams=[],crystalDust=[];
let crystalInterior=null,candyPlanet=null,candyPlanetShellFade=1;
let OBSERVATORY=null,BLACKHOLE=null,spaceJellies=[];
const WARP_DUR=7.0;
const BEAM_LEN=20,BEAM_DUR=0.35,BEAM_W=0.85;
const ASTEROID_KB=5.2,ASTEROID_INV=1.4,SAUCER_AGGRO=11,SAUCER_LEASH=13,SAUCER_WIND=0.5,SAUCER_CD=2.6;
const SPARK_GEO=new THREE.SphereGeometry(1,8,6);
for(let i=0;i<12;i++){const m=new THREE.Mesh(SPARK_GEO,new THREE.MeshBasicMaterial({color:0x7dff6a}));m.scale.setScalar(0.22);m.visible=false;scene.add(m);spaceSparks.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,trailT:0});}

function isSpaceLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.spaceAtmosphere);}
function spaceCfg(){return CURRENT_LEVEL&&CURRENT_LEVEL.openSpace;}

function clearSpaceWorld(){
  const rem=m=>{if(!m)return;if(m.parent&&m.parent.remove)m.parent.remove(m);else if(scene.remove)scene.remove(m);else if(m.visible!=null)m.visible=false;};
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
  for(const c of starCrates)rem(c.g);starCrates.length=0;
  starBeams.length=0;crystalDust.length=0;crystalInterior=null;candyPlanet=null;candyPlanetShellFade=1;
  for(const q of spaceSparks){q.alive=false;q.m.visible=false;}
  if(OBSERVATORY&&OBSERVATORY.g)rem(OBSERVATORY.g);OBSERVATORY=null;
  if(BLACKHOLE){
    if(BLACKHOLE.g)rem(BLACKHOLE.g);
    if(BLACKHOLE.warpGroup)rem(BLACKHOLE.warpGroup);
    if(BLACKHOLE.voidGroup)rem(BLACKHOLE.voidGroup);
  }
  BLACKHOLE=null;spaceJellies.length=0;
}

function beginSpaceLevel(L){
  if(landGround)landGround.visible=false;
  if(peakGround)peakGround.visible=false;
  if(underwaterGroup)underwaterGroup.visible=false;
  scene.background=new THREE.Color(0x050812);
  scene.fog=new THREE.Fog(0x0a1020,85,220);
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
    const dist=Math.hypot(Math.hypot(dx,dz),Math.abs(dy));
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
    if(dy>0.25)v.y-=align*2.4;
    else if(dy<-0.15)v.y+=align*0.4;
  }
  if(near>0.35&&dy<2.0&&horiz<t.r*1.35){
    const snap=near*dt*5.5;
    if(horiz>0.08){v.x-=dx/(horiz||1)*snap;v.z-=dz/(horiz||1)*snap;}
    if(dy>0.08)v.y=moveTo(v.y,-1.4,7*dt);
  }
  if(near>0.55&&dy<1.0&&horiz<t.r*0.95){
    v.y=moveTo(v.y,-1.2,8*dt);
    if(horiz>0.05){v.x=moveTo(v.x,-dx/(horiz||1)*1.0,5*dt);v.z=moveTo(v.z,-dz/(horiz||1)*1.0,5*dt);}
  }
  // Soft claim while coasting down onto a pad — never while thrusting off one
  if(!IN.jumpHeld&&near>0.55&&horiz<t.r*0.9&&dy>=0&&dy<0.65&&v.y<=0&&sp<2.8){
    const land=landableSurfaceAt(t.x,t.z);
    if(land){p.y=land.y;v.x*=0.35;v.y=0;v.z*=0.35;landOn(land.surf||'pad');}
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

function hurtFromAsteroid(a,px,py,pz){
  if(won||(FINISH&&FINISH.camLock)||P.inv>0||P.dead)return false;
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
    if(!a.hazard||P.dead||won||(FINISH&&FINISH.camLock))continue;
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
    // Body contact — target dummy is beam practice only
    const CR=0.75*e.size;
    if(!e.targetDummy&&!P.dead&&d3<CR+0.35){
      if(P.bonkT>0){hitSaucer(e,1);}
      else if(P.inv<=0){
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
  const e=addSaucer(x,y,z,'small',false);
  e.targetDummy=true;e.alive=true;e.hp=999;e.maxHp=999;
  return e;
}

function fireStarBeam(fx,fz,mx,my,mz){
  if(won||P.dead)return;
  SFX.starBeam();
  const ox=mx,oy=my,oz=mz;
  const len=Math.hypot(fx,fz)||1;
  const dx=fx/len,dz=fz/len;
  starBeams.push({x:ox,y:oy,z:oz,dx,dz,t:0,life:BEAM_DUR,hit:new Set()});
  for(let i=0;i<10;i++){
    const t=i/9*BEAM_LEN;
    spawnP(ox+dx*t,oy,oz+dz*t,rand(-0.2,0.2),rand(-0.2,0.2),rand(-0.2,0.2),0.07,Math.random()<0.5?0xffe078:0xffffff,0.45,0.35,0,0.85);
  }
  CAM.fovKick=Math.max(CAM.fovKick,3);
}

function beamHitPoint(b,px,py,pz,pr){
  const along=(px-b.x)*b.dx+(pz-b.z)*b.dz;
  if(along<0||along>BEAM_LEN)return false;
  const cx=b.x+b.dx*along,cz=b.z+b.dz*along;
  const d=Math.hypot(px-cx,py-b.y,pz-cz);
  return d<(pr||BEAM_W);
}

function updateStarBeams(dt){
  for(let i=starBeams.length-1;i>=0;i--){
    const b=starBeams[i];
    b.t+=dt;
    if(b.t>=b.life){starBeams.splice(i,1);continue;}
    const k=1-b.t/b.life;
    for(let s=0;s<3;s++){
      const t=b.t*BEAM_LEN/BEAM_DUR+s*2;
      spawnP(b.x+b.dx*t,b.y,b.z+b.dz*t,0,0,0,0.06,0xffe078,0.35*k,0.4,0,0.7);
    }
    for(const e of saucers){
      if(!e.alive||e.state==='dying'||b.hit.has(e))continue;
      if(e.targetDummy){
        if(beamHitPoint(b,e.x,e.y+0.3,e.z,0.9*e.size)){
          b.hit.add(e);e.flashT=0.45;SFX.tick();
          for(let j=0;j<8;j++)spawnP(e.x,e.y+0.5,e.z,rand(-2,2),rand(0.5,2),rand(-2,2),0.08,0xffe078,0.5,0.4,0,0.85);
        }
        continue;
      }
      if(beamHitPoint(b,e.x,e.y+0.35,e.z,0.75*e.size)){b.hit.add(e);hitSaucer(e,e.hp);}
    }
    for(const a of asteroids){
      if(!a.cracked||a.broken||b.hit.has(a))continue;
      if(beamHitPoint(b,a.x,a.y,a.z,a.r*0.85)){b.hit.add(a);hitCrackedAsteroid(a,2);}
    }
    for(const gate of shieldedGates){
      if(gate.opened||b.hit.has(gate))continue;
      if(beamHitPoint(b,gate.x,gate.y,gate.z,gate.hitR||2.8)){b.hit.add(gate);openShieldedGate(gate);}
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

function addShieldedGate(x,y,z,w,h,d){
  w=w||8;h=h||5;d=d||1.2;
  const g=new THREE.Group();g.position.set(x,y,z);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:0x8868ff,transparent:true,opacity:0.72}));
  wall.position.y=h*0.5;g.add(wall);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(w+0.4,h+0.6,d+0.3),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.55}));
  rim.position.y=h*0.5;g.add(rim);
  for(let i=0;i<6;i++){
    const t=(i+0.5)/6;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.85}),lerp(-w*0.42,w*0.42,t),h*0.55,0,0.14));
  }
  const pillarL=mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.65}),-w*0.48,0,0,0.22,h*1.05,0.22);
  const pillarR=mesh(CYL,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.65}),w*0.48,0,0,0.22,h*1.05,0.22);
  g.add(pillarL);g.add(pillarR);
  g.userData.landmark=true;g.userData.shieldGate=true;
  scene.add(g);levelDecor.push(g);
  const solid=addSolid(x,y,z,w,h,d,0x442266,{surf:'stone',role:'shieldGate',invisible:true});
  const gate={g,x,y,z,w,h,d,hitR:Math.max(w,h)*0.42,solid,opened:false,openT:0,fxT:0};
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
  for(let i=0;i<18;i++)spawnP(gate.x+rand(-gate.w*0.4,gate.w*0.4),gate.y+rand(0.2,gate.h),gate.z+rand(-0.4,0.4),rand(-2,2),rand(0.5,3),rand(-1,1),rand(0.08,0.16),Math.random()<0.5?0xc8b0ff:0xffe078,rand(0.5,0.9),0.45,-3,0.9);
  showToast('Star Beam opened the way!');
}

function updateShieldedGates(dt){
  for(const gate of shieldedGates){
    if(!gate.opened)continue;
    gate.openT+=dt;gate.fxT+=dt;
    if(gate.g){
      const k=Math.max(0,1-gate.openT/0.85);
      gate.g.scale.set(1,Math.max(0.05,k),1);
      gate.g.rotation.y=gate.openT*2.4;
      gate.g.children.forEach(c=>{if(c.material&&c.material.opacity!=null)c.material.opacity*=0.985;});
      if(gate.openT>=0.85)gate.g.visible=false;
    }
  }
}

function addObservatoryLandmark(x,y,z){
  // Kept for any leftover step name; prefer buildStarObservatory.
  return buildStarObservatory(x,y,z);
}

function buildStarObservatory(x,y,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  const glass=new THREE.MeshBasicMaterial({color:0xa8d0ff,transparent:true,opacity:0.48});
  const frame=lam(0xc8d8f0),brass=lam(0xd4a85a);
  // Main deck — landable calm rest pad
  const deckY=y;
  addSolid(x,deckY,z,10.5,0.38,10.5,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
  g.add(mesh(CYL,glass,0,deckY+0.05-y,0,5.2,0.12,5.2));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(5.0,0.16,8,40),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.78}));
  rim.rotation.x=Math.PI/2;rim.position.y=deckY+0.22-y;g.add(rim);
  // Soft dome / glass canopy (visual only)
  const dome=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xb8d8ff,transparent:true,opacity:0.28}));
  dome.scale.set(4.6,2.4,4.6);dome.position.y=deckY+2.2-y;g.add(dome);
  // Catwalk toward the black hole (−Z) — Snoozle 4 stands here
  addSolid(x,deckY,z-8,3.6,0.32,8.5,0x7a98c8,{surf:'pad',role:'landable',landingPad:true});
  g.add(mesh(BOXG,glass,0,deckY+0.08-y,-8,3.2,0.08,8.0));
  g.add(mesh(BOXG,frame,-1.7,deckY+0.9-y,-8,0.12,1.4,7.5));
  g.add(mesh(BOXG,frame,1.7,deckY+0.9-y,-8,0.12,1.4,7.5));
  // Side floating glass platforms (optional exploration, no combat)
  addSolid(x-8,deckY+0.6,z-2,3.2,0.28,3.2,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
  addSolid(x+8,deckY+0.4,z-4,3.0,0.28,3.0,0x6a88b8,{surf:'pad',role:'landable',landingPad:true});
  g.add(mesh(CYL,glass,-8,deckY+0.65-y,-2,1.7,0.1,1.7));
  g.add(mesh(CYL,glass,8,deckY+0.45-y,-4,1.55,0.1,1.55));
  // Telescopes framing the black hole
  function addScope(lx,ly,lz,tilt){
    const scope=mesh(CYL,brass,lx,ly,lz,0.2,2.6,0.2);scope.rotation.x=tilt;g.add(scope);
    g.add(mesh(CYL,lam(0x3a4868),lx,ly-1.1,lz,0.35,0.5,0.35));
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.55}),lx,ly+1.2,lz-0.3,0.22));
  }
  addScope(-2.2,deckY+1.8-y,-1.5,-0.85);
  addScope(2.4,deckY+1.9-y,-1.2,-0.9);
  addScope(0.2,deckY+2.1-y,-3.5,-1.05);
  // Warm deck lights
  for(let i=0;i<6;i++){
    const a=i/6*TAU;
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.7}),Math.cos(a)*4.6,deckY+0.55-y,Math.sin(a)*4.6,0.14));
  }
  // Harmless space jellyfish (ambient only)
  spaceJellies.length=0;
  for(let i=0;i<5;i++){
    const jg=new THREE.Group();
    const bx=rand(-10,10),by=deckY+rand(2.5,6)-y,bz=rand(-6,4);
    jg.position.set(bx,by,bz);
    jg.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8a0ff,transparent:true,opacity:0.55}),0,0,0,0.35,0.42,0.35));
    jg.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0ff,transparent:true,opacity:0.35}),0,-0.35,0,0.22,0.4,0.22));
    g.add(jg);
    spaceJellies.push({m:jg,baseY:by,ph:rand(0,TAU),amp:rand(0.25,0.55)});
  }
  addLandingBeacon(x,deckY,z,4.2,{approachR:22,nearR:10,primary:true});
  g.userData.landmark=true;g.userData.landable=true;g.userData.observatory=true;g.userData.interactive=false;
  scene.add(g);levelDecor.push(g);
  OBSERVATORY={g,x,y:deckY,z,catwalkZ:z-8,snoozleSpot:{x:x-2,y:deckY+0.45,z:z-8}};
  return OBSERVATORY;
}

function playerNearBlackHole(r){
  if(!BLACKHOLE)return false;
  return Math.hypot(P.pos.x-BLACKHOLE.x,P.pos.y-BLACKHOLE.y,P.pos.z-BLACKHOLE.z)<r;
}
function playerInBlackHolePortal(){
  if(!BLACKHOLE||!BLACKHOLE.active)return false;
  return Math.hypot(P.pos.x-BLACKHOLE.x,P.pos.y-BLACKHOLE.y,P.pos.z-BLACKHOLE.z)<BLACKHOLE.portalR;
}
function activateBlackHole(){
  if(!BLACKHOLE||BLACKHOLE.active)return;
  BLACKHOLE.active=true;BLACKHOLE.activateT=0;BLACKHOLE.activatedOnce=true;
  if(typeof SFX.blackHoleActivate==='function')SFX.blackHoleActivate();
  else if(typeof SFX.organSwell==='function')SFX.organSwell();
  else SFX.wake();
  CAM.fovKick=Math.max(CAM.fovKick,7);CAM.shake=Math.max(CAM.shake,0.35);
  spawnRing(BLACKHOLE.x,BLACKHOLE.y,BLACKHOLE.z,0xffe078,0.55,10,0.85);
  spawnRing(BLACKHOLE.x,BLACKHOLE.y,BLACKHOLE.z,0xffffff,0.35,8,0.7);
  for(let i=0;i<36;i++){
    const a=rand(0,TAU),r=rand(2,7);
    spawnP(BLACKHOLE.x+Math.cos(a)*r,BLACKHOLE.y+rand(-1,1),BLACKHOLE.z+Math.sin(a)*r,
      rand(-1.5,1.5),rand(0.5,3),rand(-1.5,1.5),0.1,Math.random()<0.5?0xffe078:0xffffff,0.9,0.4,-2,1);
  }
  setBlackHoleVisualState(true,false);
  showToast('The black hole woke up!');
}
function setBlackHoleVisualState(active,celebrating){
  if(!BLACKHOLE)return;
  const core=BLACKHOLE.core,ring=BLACKHOLE.ring,ring2=BLACKHOLE.ring2,portal=BLACKHOLE.portal,halo=BLACKHOLE.halo;
  if(core)core.material.color.setHex(celebrating?0x1a1028:0x020208);
  if(ring){
    ring.material.color.setHex(active||celebrating?0xffe8a0:0x3a2858);
    ring.material.opacity=celebrating?0.95:(active?0.92:0.82);
  }
  if(ring2){
    ring2.material.color.setHex(active||celebrating?0xffffff:0x8878c8);
    ring2.material.opacity=celebrating?0.7:(active?0.65:0.45);
  }
  if(portal){
    portal.visible=!!active;
    portal.material.color.setHex(celebrating?0xfff8e0:0xffe078);
    portal.material.opacity=celebrating?0.55:(active?0.42:0.08);
  }
  if(halo){
    halo.visible=!!(active||celebrating);
    halo.material.opacity=celebrating?0.5:(active?0.32:0);
  }
  if(BLACKHOLE.sparkles)for(const s of BLACKHOLE.sparkles){
    s.material.opacity=celebrating?0.95:(active?0.85:0.55);
    s.scale.setScalar(celebrating?0.22:(active?0.18:0.12));
  }
}
function beginBlackHoleWarp(){
  if(!BLACKHOLE||BLACKHOLE.warping||BLACKHOLE.finishTriggered||won)return;
  BLACKHOLE.warping=true;BLACKHOLE.warpT=0;BLACKHOLE.finishTriggered=true;
  if(FINISH)FINISH.camLock=true;
  P.inv=99;P.vel.set(0,0,-6);P.grounded=false;P.moveZone='openSpace';
  if(BLACKHOLE.warpGroup)BLACKHOLE.warpGroup.visible=true;
  if(typeof SFX.warpWhoosh==='function')SFX.warpWhoosh();
  else SFX.starBeam();
  CAM.fovKick=Math.max(CAM.fovKick,8);CAM.shake=Math.max(CAM.shake,0.3);
  CAM.mode='finish';
}
function stageBlackHoleFinishVoid(){
  if(!BLACKHOLE)return;
  const vx=BLACKHOLE.voidX,vy=BLACKHOLE.voidY,vz=BLACKHOLE.voidZ;
  P.pos.set(vx,vy,vz);P.vel.set(0,0,0);P.yaw=Math.PI;P.grounded=false;P.moveZone='openSpace';
  P.inv=2;P.puff=true;P.puffAir=0;endHover();
  if(BLACKHOLE.warpGroup)BLACKHOLE.warpGroup.visible=false;
  if(BLACKHOLE.voidGroup)BLACKHOLE.voidGroup.visible=true;
  setBlackHoleVisualState(true,true);
  CAM.look.set(vx,vy+1.5,vz-6);
  CAM.pos.set(vx+0.4,vy+5.5,vz+14);
  CAM.yaw=0.02;CAM.pitch=0.28;CAM.boomDist=16;CAM.targetDist=16;CAM.mode='finish';
  CAM.lastManual=time+99;
}
function blackHoleCamHold(dt){
  if(!BLACKHOLE)return;
  if(BLACKHOLE.warping&&!won){
    // Follow behind Pling through the warp tunnel
    const px=P.pos.x,py=P.pos.y,pz=P.pos.z;
    CAM.look.x=damp(CAM.look.x,px,10,dt);CAM.look.y=damp(CAM.look.y,py+0.8,10,dt);CAM.look.z=damp(CAM.look.z,pz-2,10,dt);
    CAM.pos.x=damp(CAM.pos.x,px,9,dt);CAM.pos.y=damp(CAM.pos.y,py+2.2,9,dt);CAM.pos.z=damp(CAM.pos.z,pz+8,9,dt);
    CAM.yaw=0;CAM.pitch=0.22;CAM.boomDist=10;CAM.targetDist=10;CAM.mode='finish';
    CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
    CAM.collisionPulled=false;
    return;
  }
  const vx=BLACKHOLE.voidX,vy=BLACKHOLE.voidY,vz=BLACKHOLE.voidZ;
  CAM.look.x=damp(CAM.look.x,vx,8,dt);CAM.look.y=damp(CAM.look.y,vy+1.8,8,dt);CAM.look.z=damp(CAM.look.z,vz-5,8,dt);
  CAM.pos.x=damp(CAM.pos.x,vx+0.5,7,dt);CAM.pos.y=damp(CAM.pos.y,vy+5.8,7,dt);CAM.pos.z=damp(CAM.pos.z,vz+15,7,dt);
  CAM.yaw=0.02;CAM.pitch=0.3;CAM.boomDist=16;CAM.targetDist=16;CAM.mode='finish';
  CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
  CAM.collisionPulled=false;
}
function updateBlackHole(dt,winT){
  if(!BLACKHOLE)return;
  // Spin / energy
  const spinMul=BLACKHOLE.active?(won?0.35:1.6):0.35;
  if(BLACKHOLE.g)BLACKHOLE.g.rotation.y+=dt*0.1*spinMul;
  if(BLACKHOLE.ring)BLACKHOLE.ring.rotation.z+=dt*(BLACKHOLE.active?1.1:0.25);
  if(BLACKHOLE.ring2)BLACKHOLE.ring2.rotation.z-=dt*(BLACKHOLE.active?0.85:0.18);
  if(BLACKHOLE.active)BLACKHOLE.activateT+=dt;
  if(BLACKHOLE.portal&&BLACKHOLE.active){
    BLACKHOLE.portal.rotation.z+=dt*1.4;
    BLACKHOLE.portal.material.opacity=0.35+Math.sin(time*3)*0.12+(won?0.15:0);
  }
  // Jellyfish drift near observatory
  for(const j of spaceJellies){
    j.m.position.y=j.baseY+Math.sin(time*1.1+j.ph)*j.amp;
    j.m.rotation.y+=dt*0.4;
  }
  if(winT>=0){
    // Finish-void star confetti
    BLACKHOLE.fxT=(BLACKHOLE.fxT||0)-dt;
    if(BLACKHOLE.fxT<=0&&winT<14){
      BLACKHOLE.fxT=0.06;
      const a=rand(0,TAU),r=rand(0.5,8);
      const col=[0xffe36b,0xffffff,0xff8ab0,0xc8f0ff,0xa0ffc8][Math.floor(Math.random()*5)];
      spawnP(BLACKHOLE.voidX+Math.cos(a)*r,BLACKHOLE.voidY+rand(-1,4),BLACKHOLE.voidZ+Math.sin(a)*r*0.6,
        rand(-1.2,1.2),rand(0.6,2.8),rand(-1.2,1.2),rand(0.07,0.14),col,rand(1.2,2.2),0.25,-1.2,0.95);
    }
    return;
  }
  // Inactive bounce — no damage, no win
  if(!BLACKHOLE.active&&!BLACKHOLE.warping&&playerNearBlackHole(BLACKHOLE.bounceR)){
    const dx=P.pos.x-BLACKHOLE.x,dy=P.pos.y-BLACKHOLE.y,dz=P.pos.z-BLACKHOLE.z;
    const d=Math.hypot(dx,dy,dz)||1;
    const push=10;
    P.vel.x=dx/d*push;P.vel.y=dy/d*push*0.6+2;P.vel.z=dz/d*push;
    P.pos.x=BLACKHOLE.x+dx/d*(BLACKHOLE.bounceR+0.4);
    P.pos.y=BLACKHOLE.y+dy/d*(BLACKHOLE.bounceR+0.4);
    P.pos.z=BLACKHOLE.z+dz/d*(BLACKHOLE.bounceR+0.4);
    if(BLACKHOLE.bounceCd<=0){BLACKHOLE.bounceCd=0.45;SFX.blorp();spawnRing(BLACKHOLE.x,BLACKHOLE.y,BLACKHOLE.z,0x8878c8,0.25,5,0.4);}
  }
  if(BLACKHOLE.bounceCd>0)BLACKHOLE.bounceCd-=dt;
  // Warp ride
  if(BLACKHOLE.warping){
    BLACKHOLE.warpT+=dt;
    // Soft forward motion; jump/gust remain cosmetically free via normal input
    P.vel.x=damp(P.vel.x,0,4,dt);
    P.vel.y=damp(P.vel.y,0,4,dt);
    P.vel.z=damp(P.vel.z,-11,3,dt);
    P.pos.z-=11*dt*0.35;
    P.inv=Math.max(P.inv,1);
    // Streaking stars / rings along the ride
    BLACKHOLE.warpFx=(BLACKHOLE.warpFx||0)-dt;
    if(BLACKHOLE.warpFx<=0){
      BLACKHOLE.warpFx=0.05;
      const col=[0xffffff,0xffe078,0xff8ab0,0x88e0ff,0xa0ff90][Math.floor(Math.random()*5)];
      spawnP(P.pos.x+rand(-4,4),P.pos.y+rand(-2,3),P.pos.z-rand(2,10),rand(-0.5,0.5),rand(-0.5,0.5),rand(8,16),0.12,col,0.55,0.2,0,0.9);
      if(Math.random()<0.35)spawnRing(P.pos.x,P.pos.y,P.pos.z-3,col,0.2,5,0.35);
    }
    if(BLACKHOLE.warpGroup){
      BLACKHOLE.warpGroup.position.set(P.pos.x,P.pos.y,P.pos.z-6);
      BLACKHOLE.warpGroup.rotation.z+=dt*1.8;
    }
    if(BLACKHOLE.warpT>=WARP_DUR){
      BLACKHOLE.warping=false;
      stageBlackHoleFinishVoid();
      triggerWin();
    }
    return;
  }
  // Active portal entry — once
  if(BLACKHOLE.active&&!BLACKHOLE.finishTriggered&&!won&&playerInBlackHolePortal()){
    beginBlackHoleWarp();
  }
}
function buildBlackHoleFinish(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  const core=mesh(SPH,new THREE.MeshBasicMaterial({color:0x020208}),0,0,0,4.2,4.2,4.2);g.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(7.2,0.85,12,56),new THREE.MeshBasicMaterial({color:0x3a2858,transparent:true,opacity:0.82}));
  ring.rotation.x=Math.PI/2;g.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(9.0,0.28,8,48),new THREE.MeshBasicMaterial({color:0x8878c8,transparent:true,opacity:0.45}));
  ring2.rotation.x=Math.PI/2;ring2.rotation.z=0.4;g.add(ring2);
  const portal=new THREE.Mesh(new THREE.TorusGeometry(3.2,0.55,10,40),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.08}));
  portal.rotation.x=Math.PI/2;portal.visible=false;g.add(portal);
  const halo=mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff4c8,transparent:true,opacity:0}),0,0,0,5.5,5.5,5.5);
  halo.visible=false;g.add(halo);
  const sparkles=[];
  for(let i=0;i<16;i++){
    const a=i/16*TAU;
    const s=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55}),Math.cos(a)*9.5,Math.sin(a*2)*0.5,Math.sin(a)*9.5,0.14);
    g.add(s);sparkles.push(s);
  }
  // Warp tunnel decoration (hidden until entry)
  const warpGroup=new THREE.Group();warpGroup.visible=false;
  for(let i=0;i<8;i++){
    const col=[0xff5a7a,0xffc94a,0x6fd45a,0x4fb4e6,0xa15ae0,0xffffff][i%6];
    const tor=new THREE.Mesh(new THREE.TorusGeometry(3.5+i*0.15,0.12,6,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.55}));
    tor.position.z=-i*4;warpGroup.add(tor);
  }
  for(let i=0;i<20;i++){
    warpGroup.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8}),rand(-5,5),rand(-3,3),-rand(0,30),0.08));
  }
  scene.add(warpGroup);
  // Finish void tableau
  const voidX=x,voidY=y+2,voidZ=z-28;
  const voidGroup=new THREE.Group();voidGroup.position.set(voidX,voidY,voidZ);voidGroup.visible=false;
  voidGroup.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x1a1030,transparent:true,opacity:0.55}),0,0,-8,10));
  const friendHalo=new THREE.Mesh(new THREE.TorusGeometry(6.5,0.4,8,40),new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.7}));
  friendHalo.rotation.x=Math.PI/2;friendHalo.position.z=-8;voidGroup.add(friendHalo);
  for(let i=0;i<30;i++){
    const a=rand(0,TAU),r=rand(2,12);
    voidGroup.add(mesh(SPH,new THREE.MeshBasicMaterial({color:Math.random()<0.3?0xffe078:0xffffff,transparent:true,opacity:0.85}),Math.cos(a)*r,rand(-2,5),Math.sin(a)*r,rand(0.06,0.16)));
  }
  scene.add(voidGroup);levelDecor.push(voidGroup);levelDecor.push(warpGroup);
  g.userData.landmark=true;g.userData.interactive=true;g.userData.landable=false;g.userData.blackHoleFinish=true;
  scene.add(g);levelDecor.push(g);
  BLACKHOLE={
    g,x,y,z,core,ring,ring2,portal,halo,sparkles,warpGroup,voidGroup,
    active:false,activatedOnce:false,activateT:0,warping:false,warpT:0,finishTriggered:false,
    bounceR:6.2,portalR:3.6,bounceCd:0,fxT:0,warpFx:0,
    voidX,voidY,voidZ
  };
  setBlackHoleVisualState(false,false);
  registerFinish({
    x,z,top:y+8,
    winMsg:'The stars are singing!',
    onAllAwake(){activateBlackHole();},
    onWin(){
      AU.layers=Math.max(AU.layers,5);
      BLACKHOLE.warping=false;
      if(!BLACKHOLE.voidGroup.visible)stageBlackHoleFinishVoid();
      setBlackHoleVisualState(true,true);
      for(let i=0;i<24;i++){
        const a=rand(0,TAU),r=rand(1,6);
        spawnP(BLACKHOLE.voidX+Math.cos(a)*r,BLACKHOLE.voidY+rand(0,3),BLACKHOLE.voidZ+Math.sin(a)*r,
          rand(-1,1),rand(1,3),rand(-1,1),0.1,Math.random()<0.5?0xffe078:0xffffff,0.8,0.35,-2,1);
      }
    },
    camHold(dt){blackHoleCamHold(dt);},
    update(dt,t){updateBlackHole(dt,t);}
  });
  if(FINISH)FINISH.camLock=false;
  return BLACKHOLE;
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
  // Black hole update is owned by FINISH.update; keep jellyfish alive if no FINISH tick yet
  if(BLACKHOLE&&!FINISH)updateBlackHole(dt,-1);
  for(const e of saucers){
    if(e.targetDummy&&e.flashT>0){e.flashT-=dt;if(e.g.userData&&e.g.userData.dome&&e.g.userData.dome.material)e.g.userData.dome.material.color.setHex(e.flashT>0?0xfff06a:0x7dff9a);}
  }
}

function updateSpaceDecor(dt){
  if(!isSpaceLevel())return;
  for(const b of spaceRouteBeacons){
    if(b.userData&&b.userData.routeStar){
      const ph=b.userData.pulseT+time*2.4;
      b.material.opacity=0.55+Math.sin(ph)*0.35;
      b.scale.setScalar(0.14+Math.sin(ph*1.3)*0.04);
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
  if(blackHoleLandmark){
    blackHoleLandmark.rotation.y+=dt*0.08;
    const ch=blackHoleLandmark.children;
    if(ch[1])ch[1].rotation.z+=dt*0.25;
    if(ch[2])ch[2].rotation.z-=dt*0.18;
  }
  // Active finish black hole spin is handled in updateBlackHole
  const moonSpin=cheeseMoonBody||cheeseMoonLandmark;
  if(moonSpin)moonSpin.rotation.y+=dt*0.04;
  if(candyPlanet&&candyPlanet.g)candyPlanet.g.rotation.y+=dt*0.025;
  for(const p of spaceDecorPlanets){if(p!==cheeseMoonLandmark&&p!==(cheeseMoonBody||null)&&p!==(candyPlanet&&candyPlanet.g))p.rotation.y+=dt*0.015;}
}

window.__SPACE={
  isSpaceLevel,spaceCfg,queryMoveZone,landableSurfaceAt,solidIsLandable,pointInOpenZone,
  nearLandableAssist,nearestLandingTarget,applyLandingAssist,
  get blackHole(){return blackHoleLandmark;},
  get blackHoleFinish(){return BLACKHOLE;},
  get blackHoleActive(){return !!(BLACKHOLE&&BLACKHOLE.active);},
  get warpTunnel(){return BLACKHOLE&&BLACKHOLE.warpGroup;},
  get observatory(){return OBSERVATORY;},
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
  openShieldedGate,
  get starCrates(){return starCrates;},
  get starBeams(){return starBeams;},
  get crystalInterior(){return crystalInterior;},
  get candyPlanet(){return candyPlanet;},
  get candyPlanetShellFade(){return candyPlanetShellFade;},
  inCandyPlanetShellZone,updateCandyPlanetShellFade,
  get CANDY_SHELL_ENTER_PAD(){return CANDY_SHELL_ENTER_PAD;},
  get CANDY_SHELL_EXIT_PAD(){return CANDY_SHELL_EXIT_PAD;},
  get cheeseMoonBody(){return cheeseMoonBody;},
  asteroidPos,hurtFromAsteroid,hitSaucer,stunSaucer,fireStarBeam,gustCrystalDust,spinHitCracked,spinHitStarCrates,slamHitStarCrates,
  activateBlackHole,beginBlackHoleWarp,playerInBlackHolePortal,playerNearBlackHole
};
