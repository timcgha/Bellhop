// Level 4 — open-space zones, Launch Dock builders, recovery, backdrop.
let spaceGroup=null,blackHoleLandmark=null,spaceStars=[];
let spaceOpenZones=[],spacePlayVolume=null,spaceDecorPlanets=[];
let spaceRecoveryT=0,spaceRecoveryFrom=null;

function isSpaceLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.spaceAtmosphere);}
function spaceCfg(){return CURRENT_LEVEL&&CURRENT_LEVEL.openSpace;}

function clearSpaceWorld(){
  const rem=m=>{if(!m)return;if(m.parent&&m.parent.remove)m.parent.remove(m);else if(scene.remove)scene.remove(m);else if(m.visible!=null)m.visible=false;};
  if(spaceGroup){while(spaceGroup.children.length)spaceGroup.remove(spaceGroup.children[0]);spaceGroup.visible=false;}
  blackHoleLandmark=null;spaceStars.length=0;spaceDecorPlanets.length=0;
  spaceOpenZones=[];spacePlayVolume=null;spaceRecoveryT=0;spaceRecoveryFrom=null;
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
  // Distant star shell
  for(let i=0;i<140;i++){
    const r=rand(55,180),a=rand(0,TAU),el=rand(-0.35,0.55);
    const sx=Math.cos(a)*Math.cos(el)*r,sy=Math.sin(el)*r+rand(-8,18),sz=Math.sin(a)*Math.cos(el)*r;
    const s=mesh(SPH,new THREE.MeshBasicMaterial({color:Math.random()<0.15?0xfff8e8:0xffffff,transparent:true,opacity:rand(0.35,0.95)}),sx,sy,sz,rand(0.04,0.18));
    spaceGroup.add(s);spaceStars.push(s);
  }
}

function addBackdropPlanet(x,y,z,r,col,ring){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(SPH,lam(col),0,0,0,r,r*0.92,r));
  if(ring){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(r*1.35,r*0.08,8,32),new THREE.MeshBasicMaterial({color:0xc8d0e8,transparent:true,opacity:0.55}));
    tor.rotation.x=Math.PI/2;g.add(tor);
  }
  g.userData.decor=true;
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
  g.userData.landmark=true;g.userData.interactive=false;
  scene.add(g);blackHoleLandmark=g;levelDecor.push(g);
  return g;
}

function addSpaceBuoy(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x5a6a78),0,0,0,0.08,1.6,0.08));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0x5ec8ff}),0,0.9,0,0.22));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.55}),0,0.9,0,0.38));
  scene.add(g);levelDecor.push(g);return g;
}

function addLaunchDock(x,y,z,w,d){
  const g=new THREE.Group();g.position.set(x,y,z);
  const plate=addSolid(x,y,z,w,0.45,d,0x4a5260,{surf:'pad',role:'landable'});
  plate.mesh.visible=true;
  if(plate.mesh.material&&plate.mesh.material.color)plate.mesh.material.color.setHex(0x5a6470);
  // Rim glow / tether markers
  const rim=mesh(BOXG,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.55}),0,0.24,0,w+0.6,0.06,d+0.6);
  scene.add(rim);levelDecor.push(rim);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
    addSpaceBuoy(x+sx*(w*0.42),y+0.5,z+sz*(d*0.42));
  });
  // Metallic deck detail
  for(let i=0;i<6;i++){
    const px=rand(-w*0.35,w*0.35),pz=rand(-d*0.35,d*0.35);
    addDecor(mesh(BOXG,lam(0x788898),x+px,y+0.24,z+pz,rand(0.4,1.2),0.04,rand(0.4,1.2)));
  }
  return plate;
}

function addPracticePad(x,y,z,r){
  const w=r*2;
  const sol=addSolid(x,y,z,w,0.38,w,0x3a4868,{surf:'pad',role:'landable'});
  sol.mesh.visible=true;
  const rim=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.65}),x,y+0.22,z,w+0.5,0.05,w+0.5);
  scene.add(rim);levelDecor.push(rim);
  addSpaceBuoy(x+r*0.7,y+0.4,z);
  addSpaceBuoy(x-r*0.7,y+0.4,z+r*0.5);
  return sol;
}

function solidIsLandable(s){
  return !!(s&&(s.role==='landable'||s.surf==='pad'));
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
  // Soft nudge toward center
  const nx=dx/(horiz||1),nz=dz/(horiz||1);
  const push=clamp((dist-soft)/(hard-soft),0,1)*18*dt;
  P.vel.x-=nx*push;P.vel.z-=nz*push;
  if(dy>12&&!P.spaceThrust)P.vel.y-=Math.sign(dy)*push*0.35;
  else if(dy<-12&&!P.spaceThrust)P.vel.y-=Math.sign(dy)*push*0.35;
  return false;
}

function updateSpaceDecor(dt){
  if(!isSpaceLevel())return;
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
  get blackHole(){return blackHoleLandmark;},
  get decorPlanets(){return spaceDecorPlanets;},
  get openZones(){return spaceOpenZones;},
  get playVolume(){return spacePlayVolume;},
  get recoveryT(){return spaceRecoveryT;}
};
