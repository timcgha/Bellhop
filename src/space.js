// Level 4 — open-space zones, Launch Dock builders, recovery, backdrop, landing assist.
let spaceGroup=null,blackHoleLandmark=null,spaceStars=[];
let spaceOpenZones=[],spacePlayVolume=null,spaceDecorPlanets=[];
let spaceRecoveryT=0,spaceRecoveryFrom=null;
let spaceLandingTargets=[],spaceRouteTrail=[],spaceFirstDest=null,spaceRouteBeacons=[];

function isSpaceLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.spaceAtmosphere);}
function spaceCfg(){return CURRENT_LEVEL&&CURRENT_LEVEL.openSpace;}

function clearSpaceWorld(){
  const rem=m=>{if(!m)return;if(m.parent&&m.parent.remove)m.parent.remove(m);else if(scene.remove)scene.remove(m);else if(m.visible!=null)m.visible=false;};
  if(spaceGroup){while(spaceGroup.children.length)spaceGroup.remove(spaceGroup.children[0]);spaceGroup.visible=false;}
  blackHoleLandmark=null;spaceStars.length=0;spaceDecorPlanets.length=0;
  spaceOpenZones=[];spacePlayVolume=null;spaceRecoveryT=0;spaceRecoveryFrom=null;
  spaceLandingTargets.length=0;spaceRouteTrail.length=0;spaceFirstDest=null;spaceRouteBeacons.length=0;
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

function queryMoveZone(){
  if(!isSpaceLevel())return 'grounded';
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

function updateSpaceDecor(dt){
  if(!isSpaceLevel())return;
  const pulse=0.55+Math.sin(time*3.2)*0.25;
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
  for(const p of spaceDecorPlanets)p.rotation.y+=dt*0.015;
}

function beginSpaceOutOfRouteRecovery(){
  if(spaceRecoveryT>0)return;
  applySpaceRecovery(999);
}

window.__SPACE={
  isSpaceLevel,spaceCfg,queryMoveZone,landableSurfaceAt,solidIsLandable,pointInOpenZone,
  nearLandableAssist,nearestLandingTarget,applyLandingAssist,
  get blackHole(){return blackHoleLandmark;},
  get decorPlanets(){return spaceDecorPlanets;},
  get landingTargets(){return spaceLandingTargets;},
  get routeTrail(){return spaceRouteTrail;},
  get firstDestination(){return spaceFirstDest;},
  get routeBeacons(){return spaceRouteBeacons;},
  get openZones(){return spaceOpenZones;},
  get playVolume(){return spacePlayVolume;},
  get recoveryT(){return spaceRecoveryT;}
};
