// Level 3 Peak systems: Cinders, embers, Wisps, salamanders, geysers.
const cinders=[],embers=[],wisps=[],salamanders=[],geysers=[],scorches=[];
const CINDER_AGGRO=8,CINDER_LEASH=10,EMBER_GRAV=-14;
const CTYPE={
  small:{size:0.7,hp:1,hopMul:0.7,spitMul:0.85,hopPow:2.6},
  mid:{size:1.0,hp:2,hopMul:1.0,spitMul:1.0,hopPow:2.1},
  big:{size:1.35,hp:3,hopMul:1.45,spitMul:1.3,hopPow:1.65}
};
const EMBGEO=new THREE.SphereGeometry(1,8,6);
for(let i=0;i<20;i++){const m=new THREE.Mesh(EMBGEO,new THREE.MeshBasicMaterial({color:0xff7a2a}));m.scale.setScalar(0.18);m.visible=false;scene.add(m);embers.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,trailT:0});}
const SCORCHG=new THREE.CylinderGeometry(1,1,0.02,12);SCORCHG.translate(0,0.01,0);
for(let i=0;i<10;i++){const m=new THREE.Mesh(SCORCHG,new THREE.MeshBasicMaterial({color:0x3a1a10,transparent:true,opacity:0.7}));m.visible=false;scene.add(m);scorches.push({m,life:0,alive:false});}

function buildCinder(size){
  const g=new THREE.Group();
  const shell=new THREE.Mesh(SPH,pho(0x5a3a2a,40,0x2a1810));shell.scale.set(0.55,0.42,0.55);shell.position.y=0.42;g.add(shell);
  const seam=pho(0xff6a18,80,0xffa040);
  g.add(mesh(BOXG,seam,0.08,0.5,0.35,0.06,0.22,0.04));
  g.add(mesh(BOXG,seam,-0.12,0.38,0.4,0.05,0.18,0.04));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xff9a3c}),0,0.55,0.4,0.1));
  [-0.18,0.18].forEach(x=>{g.add(mesh(SPH,pho(0xffe9d0,60,0xffffff),x,0.58,0.42,0.09));g.add(mesh(SPH,lam(0x1a0a05),x,0.58,0.48,0.04));});
  g.userData={shell};g.scale.setScalar(size);return g;
}
function addCinder(x,z,type){
  const T=CTYPE[type]||CTYPE.mid;const g=buildCinder(T.size);
  // Spawn on the authored walk surface (elevated pads), not the Peak void floor or world ceiling.
  const y=walkSurfaceAt(x,z,0.4);
  g.position.set(x,y,z);scene.add(g);
  cinders.push({g,x,z,hx:x,hz:z,y,type:type||'mid',size:T.size,hp:T.hp,maxHp:T.hp,hopMul:T.hopMul,spitMul:T.spitMul,hopPow:T.hopPow,
    state:'idle',t:0,spitT:rand(1.4,2.8),wind:0,vx:0,vz:0,hurtT:0,stunT:0,backT:0,alive:true,ph:rand(0,TAU),face:rand(0,TAU),hopT:rand(0.4,1.6),hopA:0,note:null});
  return cinders[cinders.length-1];
}
function addScorch(x,y,z){
  let s=null;for(const q of scorches){if(!q.alive){s=q;break;}}if(!s)s=scorches[0];
  s.alive=true;s.life=1.4;s.m.visible=true;s.m.position.set(x,y+0.02,z);s.m.scale.set(0.35,1,0.35);s.m.material.opacity=0.75;
}
function lobEmber(e){
  let q=null;for(const b of embers){if(!b.alive){q=b;break;}}if(!q)return;
  const ox=e.x+Math.sin(e.face)*0.45*e.size,oz=e.z+Math.cos(e.face)*0.45*e.size,oy=e.y+0.55*e.size;
  const tx=P.pos.x+rand(-0.8,0.8),tz=P.pos.z+rand(-0.8,0.8),ty=P.pos.y+0.5;
  const T=1.15;let vx=(tx-ox)/T,vz=(tz-oz)/T;const hs=Math.hypot(vx,vz);if(hs>6.5){vx*=6.5/hs;vz*=6.5/hs;}
  const vy=clamp((ty-oy-0.5*EMBER_GRAV*T*T)/T,4.5,11);
  q.alive=true;q.life=2.2;q.trailT=0;q.pos.set(ox,oy,oz);q.vel.set(vx,vy,vz);q.m.visible=true;q.m.position.copy(q.pos);q.m.scale.setScalar(0.18);
  SFX.emberLob();for(let i=0;i<4;i++)spawnP(ox,oy,oz,vx*0.15+rand(-1,1),rand(0,2),vz*0.15+rand(-1,1),0.06,0xff8a2b,0.3,0.4,-4,0.8);
}
function killEmber(q){q.alive=false;q.m.visible=false;}
function hitCinder(e,dmg,kx,kz){
  if(!e.alive||e.state==='dying')return;e.hp-=dmg;e.hurtT=0.3;e.vx+=kx;e.vz+=kz;e.wind=0;SFX.blorp();
  for(let i=0;i<8;i++)spawnP(e.x,e.y+0.5,e.z,rand(-3,3),rand(1,4),rand(-3,3),rand(0.06,0.12),0xff6a18,rand(0.3,0.5),0.3,-8,0.9);
  if(e.hp<=0){e.state='dying';e.t=0;e.vx=0;e.vz=0;SFX.dissolve();
    if(e.note)revealHeldNote(e.note);
    if(P.hp<P.maxHp)addHeart(e.x,e.y+0.8,e.z);
    for(let i=0;i<14;i++)spawnP(e.x,e.y+0.4,e.z,rand(-2,2),rand(1,3),rand(-2,2),rand(0.08,0.16),0xff9a3c,rand(0.5,0.9),0.5,-5,0.9);rumble(80,0.3,0.3);}
}
function updateCinders(dt){
  for(const e of cinders){if(!e.alive)continue;const g=e.g;
    if(e.state==='dying'){e.t+=dt;const k=Math.max(0,1-e.t/0.85);g.scale.setScalar(e.size*Math.max(k,0.02));g.position.set(e.x,e.y,e.z);if(e.t>=0.85){e.alive=false;g.visible=false;}continue;}
    const dx=P.pos.x-e.x,dz=P.pos.z-e.z,d=Math.hypot(dx,dz),dy=P.pos.y-e.y;
    const dHome=Math.hypot(e.x-e.hx,e.z-e.hz);
    e.hurtT-=dt;e.stunT-=dt;e.backT-=dt;
    e.x+=e.vx*dt;e.z+=e.vz*dt;e.vx=damp(e.vx,0,4.5,dt);e.vz=damp(e.vz,0,4.5,dt);
    const dHome2=Math.hypot(e.x-e.hx,e.z-e.hz);
    // Soft home pull when past leash — mirrors shark return behavior.
    if(dHome2>CINDER_LEASH){e.x=damp(e.x,e.hx,2.8,dt);e.z=damp(e.z,e.hz,2.8,dt);}
    e.y=walkSurfaceAt(e.x,e.z,0.3);
    const dHomeNow=Math.hypot(e.x-e.hx,e.z-e.hz);
    const near=d<CINDER_AGGRO&&Math.abs(dy)<6&&!P.dead&&e.backT<=0&&dHomeNow<CINDER_LEASH;
    if(near)e.face=Math.atan2(dx,dz);
    else if(dHomeNow>0.7)e.face=Math.atan2(e.hx-e.x,e.hz-e.z);
    g.rotation.y=angDamp(g.rotation.y,e.face,5,dt);
    let hop=0;
    if(e.stunT<=0){e.hopT-=dt;if(e.hopT<=0){
      e.hopT=rand(1.1,2.4)*e.hopMul;e.hopA=0.42;let ang=rand(0,TAU);
      if(dHomeNow>CINDER_LEASH*0.55)ang=Math.atan2(e.hx-e.x,e.hz-e.z);
      else if(near&&d<3.2){ang=e.face+Math.PI;e.backT=0.9;}
      else if(near)ang=e.face+rand(-0.7,0.7);
      else if(dHomeNow>0.8)ang=Math.atan2(e.hx-e.x,e.hz-e.z);
      e.vx+=Math.sin(ang)*e.hopPow;e.vz+=Math.cos(ang)*e.hopPow;
    }}
    if(e.hopA>0){e.hopA-=dt;hop=Math.sin((0.42-Math.max(e.hopA,0))/0.42*Math.PI)*0.32;}
    if(near&&d<10&&e.stunT<=0&&d>2.0){e.spitT-=dt;if(e.spitT<=0&&e.wind<=0)e.wind=0.55;}
    if(e.wind>0){e.wind-=dt;if(e.wind<=0){lobEmber(e);e.spitT=rand(2.4,3.6)*e.spitMul;}}
    const wob=1+Math.sin(time*5.5+e.ph)*0.04;g.scale.set(wob*e.size,(1/wob)*e.size*(e.hurtT>0?0.7:1),wob*e.size);
    g.position.set(e.x,e.y+hop*e.size,e.z);
    const CR=0.45+e.size*0.42;if(!P.dead&&d<CR&&Math.abs(dy)<1.35*e.size){
      const feet=P.pos.y-(e.y+hop),nx=dx/(d||1),nz=dz/(d||1);
      if(feet>0.28*e.size&&P.vel.y<-1){hitCinder(e,1,-nx*3,-nz*3);P.vel.y=8.5;P.puff=true;P.puffAir=0;endHover();P.sq=1.3;P.grounded=false;spawnRing(P.pos.x,P.pos.y,P.pos.z,0xff9a3c,0.3,4,0.3);}
      else if(feet<=0.28*e.size){const push=(CR-d)*0.5;P.pos.x+=nx*push;P.pos.z+=nz*push;e.x-=nx*push;e.z-=nz*push;}
    }
  }
}
function updateEmbers(dt){
  for(const q of embers){if(!q.alive)continue;q.life-=dt;q.vel.y+=EMBER_GRAV*dt;q.pos.x+=q.vel.x*dt;q.pos.y+=q.vel.y*dt;q.pos.z+=q.vel.z*dt;q.m.position.copy(q.pos);
    q.trailT-=dt;if(q.trailT<=0){q.trailT=0.05;spawnP(q.pos.x,q.pos.y,q.pos.z,rand(-0.3,0.3),rand(-0.4,0.6),rand(-0.3,0.3),0.07,Math.random()<0.5?0xff8a2b:0xffe36b,0.35,0.4,-2,0.75);}
    if(!P.dead&&P.inv<=0&&Math.hypot(q.pos.x-P.pos.x,q.pos.y-(P.pos.y+0.55),q.pos.z-P.pos.z)<0.55){
      hurtPlayer(q.vel.x,q.vel.z,0xff6a18);SFX.emberHit();killEmber(q);continue;
    }
    const gy=surfaceHeightAt(q.pos.x,q.pos.z,q.pos.y,0.12);
    if(q.pos.y<=gy+0.1||q.life<=0){addScorch(q.pos.x,gy,q.pos.z);SFX.fizz();for(let i=0;i<5;i++)spawnP(q.pos.x,gy+0.08,q.pos.z,rand(-1.5,1.5),rand(0.5,2),rand(-1.5,1.5),0.06,0xff8a2b,0.3,0.3,-5,0.85);killEmber(q);}
  }
  for(const s of scorches){if(!s.alive)continue;s.life-=dt;s.m.material.opacity=0.75*Math.min(1,s.life/0.6);if(s.life<=0){s.alive=false;s.m.visible=false;}}
}

function buildWisp(){
  const g=new THREE.Group();
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xff9a3c}),0,0.35,0,0.22));
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xffe36b}),0,0.55,0,0.14,0.32,0.14));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff3c4,transparent:true,opacity:0.7}),0,0.72,0,0.1));
  return g;
}
function addWisp(path,opts){
  opts=opts||{};path=path&&path.length?path:[{x:0,y:0.4,z:0}];
  const g=buildWisp();const p0=path[0];g.position.set(p0.x,p0.y,p0.z);scene.add(g);
  let note=null;if(opts.note){note=typeof opts.note==='object'?opts.note:addNote(p0.x,p0.y+0.6,p0.z,true);}
  wisps.push({g,path,idx:0,t:0,speed:opts.speed||2.2,alive:true,note,warnT:0,ph:rand(0,TAU)});
  return wisps[wisps.length-1];
}
function extinguishWisp(w){
  if(!w.alive)return;w.alive=false;w.g.visible=false;SFX.wispOut();
  spawnRing(w.g.position.x,w.g.position.y,w.g.position.z,0x9aa4ad,0.25,4,0.35);
  for(let i=0;i<14;i++)spawnP(w.g.position.x,w.g.position.y,w.g.position.z,rand(-1.5,1.5),rand(0.8,3),rand(-1.5,1.5),rand(0.08,0.14),Math.random()<0.5?0x8a8a8a:0xc8c8c8,rand(0.5,0.9),0.7,-1,0.7);
  if(w.note)revealHeldNote(w.note);
}
function updateWisps(dt){
  for(const w of wisps){if(!w.alive)continue;const path=w.path;if(path.length<2){w.g.position.y=path[0].y+Math.sin(time*6+w.ph)*0.08;continue;}
    const a=path[w.idx],b=path[(w.idx+1)%path.length];
    const dist=Math.hypot(b.x-a.x,b.z-a.z)||1;w.t+=dt*w.speed/dist;
    if(w.t>=1){w.t-=1;w.idx=(w.idx+1)%path.length;}
    const k=w.t,x=lerp(a.x,b.x,k),z=lerp(a.z,b.z,k),y=lerp(a.y,b.y,k)+Math.sin(time*7+w.ph)*0.1;
    w.g.position.set(x,y,z);w.g.scale.setScalar(1+Math.sin(time*14+w.ph)*0.08);
    const d=Math.hypot(P.pos.x-x,P.pos.z-z);
    if(d<4.5&&Math.abs(P.pos.y-y)<2.5){w.warnT-=dt;if(w.warnT<=0){w.warnT=0.55;SFX.spikeWarn();}}
    if(!P.dead&&P.inv<=0&&d<0.7&&Math.abs(P.pos.y+0.5-y)<1.1){hurtPlayer(P.pos.x-x,P.pos.z-z,0xff9a3c);SFX.spikeTouch();}
  }
}

function buildSalamander(gold){
  const g=new THREE.Group();
  const col=gold?pho(0xffd24a,100,0xfff0b8):lam(0xc45a28);
  g.add(mesh(SPH,col,0,0.12,0,0.18,0.1,0.28));
  g.add(mesh(SPH,col,0,0.16,0.22,0.12));
  if(gold)g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff8ee,transparent:true,opacity:0.55}),0,0.22,0.1,0.1));
  return g;
}
function addSalamander(x,z,opts){
  opts=opts||{};const gold=!!opts.note;const g=buildSalamander(gold);
  // Peak voidFloor is deep — place on the authored walk surface, same as Cinders.
  const y=walkSurfaceAt(x,z,0.4)+0.02;
  g.position.set(x,y,z);scene.add(g);
  const home={x,z};const pts=opts.path||[{x:x+rand(-1.5,1.5),z:z+rand(-1.5,1.5)},{x:x+rand(-1.5,1.5),z:z+rand(-1.5,1.5)},home];
  let note=null;if(opts.note===true)note=addNote(x,y+0.55,z,true);else if(opts.note&&typeof opts.note==='object')note=opts.note;
  salamanders.push({g,x,z,y,home,pts,idx:0,t:0,speed:gold?1.6:2.1,kind:gold?'note':'ordinary',alive:true,note,hideT:0,ph:rand(0,TAU)});
  return salamanders[salamanders.length-1];
}
function updateSalamanders(dt){
  for(const s of salamanders){if(!s.alive)continue;
    const d=Math.hypot(P.pos.x-s.x,P.pos.z-s.z);
    if(d<2.2){s.hideT=0.8;s.x=damp(s.x,s.home.x+(s.home.x-P.pos.x)*0.15,3,dt);s.z=damp(s.z,s.home.z+(s.home.z-P.pos.z)*0.15,3,dt);}
    else{s.hideT-=dt;const a=s.pts[s.idx],b=s.pts[(s.idx+1)%s.pts.length];
      const dist=Math.hypot(b.x-a.x,b.z-a.z)||1;s.t+=dt*s.speed/dist;
      if(s.t>=1){s.t-=1;s.idx=(s.idx+1)%s.pts.length;}
      s.x=lerp(a.x,b.x,s.t);s.z=lerp(a.z,b.z,s.t);
    }
    s.y=walkSurfaceAt(s.x,s.z,0.15)+0.02;
    s.g.position.set(s.x,s.y+(s.hideT>0?-0.06:0)+Math.sin(time*5+s.ph)*0.02,s.z);
    s.g.rotation.y=Math.atan2(s.pts[(s.idx+1)%s.pts.length].x-s.x,s.pts[(s.idx+1)%s.pts.length].z-s.z);
    if(s.kind==='note')s.g.scale.setScalar(1+Math.sin(time*8+s.ph)*0.06);
  }
}
function gustSalamanders(mx,mz,k){
  for(const s of salamanders){if(!s.alive||s.kind!=='note'||!s.note||s.note.got||!s.note.hidden)continue;
    const intens=k(s.x,s.z);if(intens>0.15&&Math.abs(P.pos.y-s.y)<2.2){
      revealHeldNote(s.note);SFX.fishPop();s.hideT=1.2;
      for(let i=0;i<8;i++)spawnP(s.x,s.y+0.2,s.z,rand(-2,2),rand(1,3),rand(-2,2),0.07,0xffe36b,0.5,0.4,-4,0.85);
    }
  }
}

function addGeyser(x,y,z,r){
  r=r||1.1;const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x6a5a4a),0,0.12,0,r*0.9,0.24,r*0.9));
  g.add(mesh(CYL,lam(0x3a3028),0,0.28,0,r*0.55,0.12,r*0.55));
  g.add(mesh(BOXG,pho(0xffa060,30,0xffc08a),0.2,0.34,0,0.1,0.08,r*0.5));
  scene.add(g);
  // activeT: remaining boost window after a gust; coolT: brief reset before another gust can fire.
  geysers.push({g,x,y,z,r,activeT:0,coolT:0,boosted:false,pt:0});
  return geysers[geysers.length-1];
}
function fireGeyser(v){
  if(v.coolT>0||v.activeT>0)return false;
  v.activeT=0.55;v.coolT=0.85;v.boosted=false;SFX.geyser();
  spawnRing(v.x,v.y+0.1,v.z,0xfff0e0,0.35,6,0.4);
  for(let i=0;i<18;i++)spawnP(v.x+rand(-0.3,0.3),v.y+0.2,v.z+rand(-0.3,0.3),rand(-1,1),rand(6,12),rand(-1,1),rand(0.08,0.14),0xfff4e8,rand(0.5,0.9),1.2,0,0.65);
  return true;
}
function gustGeysers(mx,mz,k){
  for(const v of geysers){
    const s=k(v.x,v.z);
    // Standing on/beside the spout also counts — the toy should answer a ground gust at your feet.
    const nearFeet=Math.hypot(P.pos.x-v.x,P.pos.z-v.z)<v.r+0.55;
    if(s>0.14||nearFeet)fireGeyser(v);
  }
}
function updateGeysers(dt){
  for(const v of geysers){
    v.coolT=Math.max(0,v.coolT-dt);
    if(v.activeT>0){
      v.activeT-=dt;
      v.pt-=dt;if(v.pt<=0){v.pt=0.04;spawnP(v.x+rand(-0.25,0.25),v.y+0.3,v.z+rand(-0.25,0.25),rand(-0.4,0.4),rand(4,9),rand(-0.4,0.4),rand(0.07,0.12),0xfff0e0,0.4,0.8,0,0.55);}
      // One impulse per activation — not a per-frame stack.
      if(!v.boosted&&!P.dead){
        const dx=P.pos.x-v.x,dz=P.pos.z-v.z;
        if(dx*dx+dz*dz<(v.r+0.35)*(v.r+0.35)&&P.pos.y<v.y+3.2&&P.pos.y>v.y-0.2){
          v.boosted=true;P.vel.y=Math.max(P.vel.y,14.5);P.grounded=false;P.slam=0;P.puffAir=0;endHover();
          // Geysers are launch toys, not Sky Blast vents — never grant hasSkyBlast or leapBoost.
          CAM.fovKick=Math.max(CAM.fovKick,5);rumble(90,0.35,0.25);
        }
      }
    }else{
      v.pt-=dt;if(v.pt<=0){v.pt=0.35;spawnP(v.x+rand(-0.1,0.1),v.y+0.25,v.z+rand(-0.1,0.1),0,rand(0.6,1.4),0,0.05,0xfff0e0,0.4,0.4,0,0.4);}
    }
  }
}
function updatePeak(dt){
  updateCinders(dt);updateEmbers(dt);updateWisps(dt);updateSalamanders(dt);updateGeysers(dt);
  updateDriftSparks(dt);updateProtoEndpoints(dt);
  updateSteamCurtains(dt);updateCrystalSparks(dt);updateGeodeAmbience(dt);updateGeodeShellFade(dt);
  // Steam Organ finish update is owned by FINISH.update — do not double-drive here.
}

// ---- Stage 4 presentation + temporary endpoint + Stage 5 Geode Hollow ----
const protoEndpoints=[],driftSparks=[],steamCurtains=[],crystalSparks=[];
let geodeAmbT=0,geodeInside=false;
// Entrance shell fade — same idea as Wreck hull: keep collision, clear the camera.
const GEODE_SHELL={meshes:[],fade:1,inside:false};
let crackedGeodeChamber=null;
function registerGeodeShellMesh(m){
  if(!m||!m.material)return m;
  if(typeof m.material.clone==='function')m.material=m.material.clone();
  m.material.transparent=true;
  if(m.material.opacity==null)m.material.opacity=1;
  m.userData=m.userData||{};
  if(m.userData.shellBaseOp==null)m.userData.shellBaseOp=m.material.opacity;
  GEODE_SHELL.meshes.push(m);
  return m;
}
function clearPeakWorld(){
  const rem=m=>{
    if(!m)return;
    if(m.parent&&typeof m.parent.remove==='function')m.parent.remove(m);
    else if(typeof scene.remove==='function')scene.remove(m);
    else if(m.visible!=null)m.visible=false;
  };
  for(const o of cinders)rem(o.g);cinders.length=0;
  for(const o of wisps)rem(o.g);wisps.length=0;
  for(const o of salamanders)rem(o.g);salamanders.length=0;
  for(const o of geysers)rem(o.g);geysers.length=0;
  for(const e of embers){e.alive=false;e.m.visible=false;}
  for(const s of scorches){s.alive=false;s.m.visible=false;}
  for(const e of protoEndpoints)rem(e.g);protoEndpoints.length=0;
  for(const s of driftSparks)rem(s.m);driftSparks.length=0;
  for(const c of steamCurtains){rem(c.g);if(c.sol&&c.sol.mesh)rem(c.sol.mesh);}steamCurtains.length=0;
  for(const s of crystalSparks)rem(s.m);crystalSparks.length=0;
  for(const f of organFireworks){if(f.m)rem(f.m);}organFireworks.length=0;
  if(ORGAN&&ORGAN.g)rem(ORGAN.g);ORGAN=null;
  GEODE_SHELL.meshes.length=0;GEODE_SHELL.fade=1;GEODE_SHELL.inside=false;
  crackedGeodeChamber=null;
  geodeAmbT=0;geodeInside=false;
}
function addVolcanoLandmark(x,y,z,scale){
  // Clear volcano silhouette: cone mountain, open crater bowl, molten glow, smoke.
  scale=scale||1;
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CONE,lam(0x3a2a24),0,7*scale,0,16*scale,16*scale,16*scale));
  g.add(mesh(CONE,lam(0x5a3a2e),0,13*scale,0,9*scale,12*scale,9*scale));
  g.add(mesh(CONE,lam(0x6a4230),0,17*scale,0,5.2*scale,7*scale,5.2*scale));
  // Crater rim lip (readable bowl, not a sealed tip)
  g.add(mesh(CYL,lam(0x2a1e18),0,19.2*scale,0,3.6*scale,0.7*scale,3.6*scale));
  g.add(mesh(CYL,lam(0x4a2a20),0,19.0*scale,0,2.6*scale,0.5*scale,2.6*scale));
  // Molten throat + glow column
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xff4a12,transparent:true,opacity:0.7}),0,18.2*scale,0,1.6*scale,1.2*scale,1.6*scale));
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.55}),0,21*scale,0,1.8*scale,5*scale,1.8*scale));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0.4}),0,20.5*scale,0,2.2*scale));
  for(let i=0;i<4;i++)g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0c0,transparent:true,opacity:0.32}),rand(-1.8,1.8)*scale,(22+i*2.4)*scale,rand(-1.8,1.8)*scale,(2.6-i*0.35)*scale));
  g.userData={kind:'volcanoLandmark',scale};
  scene.add(g);levelDecor.push(g);
  return g;
}
function addPeakTuft(x,z,s){
  s=s||1;const g=new THREE.Group();g.position.set(x,groundHeightAt(x,z),z);
  // Sparse tough scrub — not bright meadow grass.
  const col=Math.random()<0.5?0x5a6a3a:0x4a5530;
  g.add(mesh(SPH,lam(col),0,0.22*s,0,0.28*s,0.32*s,0.22*s));
  g.add(mesh(SPH,lam(0x6a5a38),0.15*s,0.28*s,0.04*s,0.16*s,0.35*s,0.14*s));
  scene.add(g);levelDecor.push(g);
}
function addBasaltRock(x,y,z,s){
  s=s||1;const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(BOXG,lam(0x3a3538),0,0.35*s,0,0.9*s,0.7*s,0.7*s));
  g.add(mesh(BOXG,lam(0x5a2e2a),0.15*s,0.55*s,0.1*s,0.45*s,0.35*s,0.4*s));
  scene.add(g);levelDecor.push(g);
}
function addDriftSparks(n){
  n=n||18;
  for(let i=0;i<n;i++){
    const m=mesh(SPH,new THREE.MeshBasicMaterial({color:Math.random()<0.5?0xff9a3c:0xffe9d0}),0,0,0,0.06);
    m.position.set(rand(-18,18),rand(1,10),rand(-140,30));
    scene.add(m);
    driftSparks.push({m,vx:rand(-0.15,0.15),vy:rand(0.35,0.9),vz:rand(-0.1,0.1),ph:rand(0,TAU)});
  }
}
function updateDriftSparks(dt){
  for(const s of driftSparks){
    s.m.position.x+=s.vx*dt;s.m.position.y+=s.vy*dt;s.m.position.z+=s.vz*dt;
    if(s.m.position.y>16){s.m.position.y=0.6;s.m.position.x=rand(-16,16);s.m.position.z=rand(-150,28);}
    s.m.material.opacity=0.45+0.35*Math.sin(time*4+s.ph);
  }
}
function addProtoEndpoint(x,y,z,kind){
  // Temporary soft-return marker — never a real FINISH / win.
  // kind:'climb' (Stage 5 exit) suggests ascent; default is a blocked mouth wall.
  const g=new THREE.Group();g.position.set(x,y,z);
  const climb=kind==='climb';
  if(climb){
    g.add(mesh(BOXG,lam(0x3a2e38),0,1.6,0.4,8.5,3.2,1.2));
    g.add(mesh(BOXG,lam(0x2a2030),-2.6,2.8,-0.2,2.4,2.4,1.4));
    g.add(mesh(BOXG,lam(0x2a2030),2.6,3.4,-0.5,2.2,3.0,1.5));
    g.add(mesh(BOXG,lam(0x4a3a55),0,4.2,-0.8,5.5,0.5,2.2));
    // Far lava glow under the silhouette, steam drifting up.
    g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.45}),0,0.6,-1.2,4.5,0.08,1.6));
    for(let i=0;i<4;i++)g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0c0,transparent:true,opacity:0.35}),rand(-1.5,1.5),2.2+i*0.7,rand(-0.6,0.2),0.35+i*0.08));
    addSolid(x,y,z,8.8,5.2,1.6,0x3a2e38,{surf:'stone',invisible:true});
  }else{
    g.add(mesh(BOXG,lam(0x4a3a55),0,2.2,0,7.5,4.4,1.6));
    g.add(mesh(BOXG,lam(0x2a2035),0,1.6,0.55,4.2,3.2,0.5));
    g.add(mesh(CONE,pho(0x88ccff,40,0xffffff),-1.6,2.8,0.3,0.35,1.1,0.35));
    g.add(mesh(CONE,pho(0xc48cff,40,0xffffff),1.4,3.0,0.25,0.3,1.0,0.3));
    g.add(mesh(CONE,pho(0x66ffe0,40,0xffffff),0.2,3.4,0.35,0.28,0.9,0.28));
    addSolid(x,y,z,7.8,4.6,1.8,0x4a3a55,{surf:'stone',invisible:true});
  }
  scene.add(g);
  protoEndpoints.push({g,x,y,z,trigZ:z+2.4,triggered:false,fxT:0,kind:climb?'climb':'mouth'});
}
function updateProtoEndpoints(dt){
  for(const e of protoEndpoints){
    if(e.triggered){
      e.fxT+=dt;
      if(e.fxT>0.08&&e.fxT<0.9){
        e.pt=(e.pt||0)-dt;if(e.pt<=0){e.pt=0.06;
          spawnP(e.x+rand(-1.5,1.5),e.y+rand(0.5,3.5),e.z+rand(-0.4,0.4),rand(-1,1),rand(1,4),rand(-1,1),rand(0.08,0.14),Math.random()<0.5?0x88ccff:0xffe9d0,0.55,0.4,-2,0.8);
        }
      }
      if(e.fxT>1.15){e.triggered=false;e.fxT=0;softReturnToPicker();}
      continue;
    }
    if(P.dead||won)continue;
    // Approach from the playable side (+Z). Keep the trigger off the blocking wall volume.
    if(Math.abs(P.pos.x-e.x)<4.2&&Math.abs(P.pos.y-e.y)<3.2&&P.pos.z>e.z&&P.pos.z<e.trigZ+1.6){
      e.triggered=true;e.fxT=0;e.pt=0;
      CAM.shake=Math.max(CAM.shake,0.35);CAM.fovKick=Math.max(CAM.fovKick,6);
      rumble(120,0.4,0.35);SFX.checkpoint();
      spawnRing(e.x,e.y+1.2,e.z,0xaaccff,0.4,7,0.55);
      for(let i=0;i<22;i++)spawnP(e.x,e.y+1.5,e.z,rand(-3,3),rand(2,6),rand(-2,2),rand(0.08,0.16),Math.random()<0.5?0xc48cff:0xffe36b,0.7,0.5,-4,0.9);
    }
  }
}

// ---- Geode Hollow builders (Stage 5) ----
const GEODE_ROCK=0x2a1e38,GEODE_DEEP=0x1a1228,GEODE_CRYSTAL=0x7a5cff,GEODE_CRYSTAL2=0x88ccff,GEODE_PALE=0xd8c8ff;
function addCrystalShard(parent,x,y,z,sx,sy,sz,col,emissive){
  const m=mesh(CONE,pho(col||GEODE_CRYSTAL,45,emissive!=null?emissive:0xffffff),x,y,z,sx,sy,sz);
  parent.add(m);return m;
}
function addCrystalCluster(x,y,z,scale,blocking){
  scale=scale||1;
  const g=new THREE.Group();g.position.set(x,y,z);
  const rock=lam(GEODE_ROCK),deep=lam(GEODE_DEEP);
  g.add(mesh(BOXG,rock,0,0.35*scale,0,1.1*scale,0.7*scale,0.9*scale));
  g.add(mesh(BOXG,deep,0.15*scale,0.55*scale,0.1*scale,0.55*scale,0.4*scale,0.5*scale));
  addCrystalShard(g,-0.25*scale,1.1*scale,0,0.22*scale,1.4*scale,0.22*scale,GEODE_CRYSTAL,0xc8b0ff);
  addCrystalShard(g,0.3*scale,0.95*scale,0.15*scale,0.18*scale,1.1*scale,0.18*scale,GEODE_CRYSTAL2,0xffffff);
  addCrystalShard(g,0.05*scale,1.35*scale,-0.2*scale,0.14*scale,0.9*scale,0.14*scale,GEODE_PALE,0xffffff);
  scene.add(g);levelDecor.push(g);
  // Large clusters that visibly block the path get matching collision; tiny décor does not.
  if(blocking)addSolid(x,y,z,1.15*scale,1.6*scale,0.95*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  return g;
}
function addGeodeMouth(x,y,z){
  // Natural volcanic cave mouth — irregular basalt, not a rectangular door/box.
  // Cool light spills from inside; crystals begin at the rim. Floor solid matches the opening.
  // Decorative shell meshes fade when Pling enters (Wreck-style readability).
  const g=new THREE.Group();g.position.set(x,y,z);
  const basalt=lam(0x2a221c),dark=lam(0x1a1410),rim=lam(0x3a2e28),deep=lam(GEODE_DEEP);
  const shellAdd=(m)=>{registerGeodeShellMesh(m);g.add(m);return m;};
  // Floor sill through the mouth (visual + matched by collision below). Keep opaque — not an occluder.
  g.add(mesh(BOXG,basalt,0,0.2,0,8.4,0.4,3.6));
  g.add(mesh(BOXG,lam(0x2a1e38),0,0.42,-0.4,5.2,0.08,2.4));
  // Left basalt mass — stacked uneven chunks, not a flat pillar.
  shellAdd(mesh(BOXG,basalt,-4.6,1.4,0.2,2.4,2.8,3.0));
  shellAdd(mesh(BOXG,dark,-5.2,2.8,-0.3,2.0,2.4,2.4));
  shellAdd(mesh(BOXG,rim,-3.6,3.6,0.35,1.6,1.8,2.0));
  shellAdd(mesh(BOXG,basalt,-4.0,4.6,-0.2,2.2,1.2,2.2));
  // Right basalt mass — deliberately asymmetric silhouette.
  shellAdd(mesh(BOXG,basalt,4.8,1.2,0.15,2.6,2.4,2.8));
  shellAdd(mesh(BOXG,dark,5.1,2.9,0.4,2.1,2.6,2.2));
  shellAdd(mesh(BOXG,rim,3.7,3.4,-0.25,1.5,2.0,2.1));
  shellAdd(mesh(BOXG,basalt,4.2,4.8,0.1,2.0,1.4,2.0));
  // Broken lintel / irregular arch crown (jagged top, not a flat beam).
  shellAdd(mesh(BOXG,dark,-1.6,5.1,0,2.4,1.1,2.4));
  shellAdd(mesh(BOXG,basalt,1.4,5.35,0.15,2.8,1.4,2.2));
  shellAdd(mesh(BOXG,rim,0.2,5.7,-0.35,3.6,0.9,1.8));
  shellAdd(mesh(BOXG,dark,-2.8,4.9,0.4,1.2,0.8,1.6));
  // Inner cave shadow — open passage, not a door fill.
  shellAdd(mesh(BOXG,deep,0,2.4,-0.9,5.0,4.2,0.5));
  // Cool wash spilling out of the Hollow (already translucent; still tracks fade).
  shellAdd(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xa090ff,transparent:true,opacity:0.22}),0,2.3,-0.35,4.4,3.4,0.12));
  shellAdd(mesh(BOXG,new THREE.MeshBasicMaterial({color:0x88ccff,transparent:true,opacity:0.12}),0,2.0,0.55,3.6,2.8,0.08));
  // Crystal growth beginning at the mouth.
  const c1=addCrystalShard(g,-3.4,3.2,0.55,0.32,1.2,0.32,GEODE_CRYSTAL2,0xffffff);registerGeodeShellMesh(c1);
  const c2=addCrystalShard(g,3.2,3.5,0.45,0.28,1.15,0.28,GEODE_CRYSTAL,0xc8b0ff);registerGeodeShellMesh(c2);
  const c3=addCrystalShard(g,-1.0,4.9,0.35,0.2,0.85,0.2,GEODE_PALE,0xffffff);registerGeodeShellMesh(c3);
  const c4=addCrystalShard(g,1.6,5.1,0.2,0.18,0.75,0.18,GEODE_CRYSTAL2,0xffffff);registerGeodeShellMesh(c4);
  const c5=addCrystalShard(g,-2.2,2.2,0.7,0.16,0.7,0.16,GEODE_CRYSTAL,0xc8b0ff);registerGeodeShellMesh(c5);
  // Thin steam leaking from cracks.
  for(let i=0;i<4;i++){
    shellAdd(mesh(SPH,new THREE.MeshBasicMaterial({color:0xe8f0ff,transparent:true,opacity:0.28}),
      rand(-3.5,3.5),1.2+i*0.7,0.6+rand(-0.2,0.2),0.22+i*0.04));
  }
  g.userData={kind:'geodeMouth',shell:true};
  scene.add(g);levelDecor.push(g);
  // Collision: floor sill through the mouth + irregular side masses + crown.
  // Opening stays open on the centerline (~|x|<3.2). Invisible — fade is visual-only.
  addSolid(x,y,z,8.6,0.4,3.8,0x2a221c,{surf:'stone',invisible:true,role:'safeRock'});
  addSolid(x-4.6,y,z,2.6,5.2,3.2,0x2a221c,{surf:'stone',invisible:true,role:'safeRock'});
  addSolid(x+4.7,y,z,2.7,5.2,3.0,0x2a221c,{surf:'stone',invisible:true,role:'safeRock'});
  addSolid(x,y+4.7,z,8.0,1.5,2.6,0x1a1410,{surf:'stone',invisible:true,role:'safeRock'});
  return g;
}
function addCrackedGeode(x,y,z,scale){
  // Open cracked-geode chamber on the main route. Mouth faces +Z (approach).
  // Interior must read clearly — Snoozle 3 is not a secret/gotcha.
  scale=scale||1.6;
  const g=new THREE.Group();g.position.set(x,y,z);
  const shell=pho(0x5a48a0,35,0xb8a0ff),inner=pho(0x88ccff,55,0xffffff),rim=lam(GEODE_DEEP),pad=lam(0x3a2e55);
  // Floor cushion — raised, lit pad so the sleeper sits in a readable nest.
  g.add(mesh(BOXG,pad,0,0.22*scale,0.35*scale,1.9*scale,0.28*scale,1.7*scale));
  g.add(mesh(BOXG,pho(0x6a58c0,40,0xc8b0ff),0,0.38*scale,0.4*scale,1.45*scale,0.08*scale,1.25*scale));
  // Back bowl (−Z) and side petals — leave a wide open mouth toward +Z.
  g.add(mesh(BOXG,shell,0,1.25*scale,-1.05*scale,2.5*scale,2.5*scale,0.5*scale));
  g.add(mesh(BOXG,inner,0,1.2*scale,-0.75*scale,2.05*scale,2.05*scale,0.22*scale));
  g.add(mesh(BOXG,rim,-1.6*scale,1.15*scale,0.05*scale,0.42*scale,2.3*scale,1.9*scale));
  g.add(mesh(BOXG,rim,1.6*scale,1.15*scale,0.05*scale,0.42*scale,2.3*scale,1.9*scale));
  // Incomplete canopy — gap in the front so the camera sees straight into the chamber.
  g.add(mesh(BOXG,shell,-0.85*scale,2.4*scale,-0.25*scale,1.1*scale,0.38*scale,1.7*scale));
  g.add(mesh(BOXG,shell,0.85*scale,2.45*scale,-0.2*scale,1.1*scale,0.38*scale,1.6*scale));
  // Crystal teeth framing the open mouth (+Z) — read as "cracked open," not sealed.
  addCrystalShard(g,-1.15*scale,1.85*scale,0.95*scale,0.3*scale,1.15*scale,0.3*scale,GEODE_CRYSTAL,0xc8b0ff);
  addCrystalShard(g,1.15*scale,1.75*scale,1.0*scale,0.26*scale,1.05*scale,0.26*scale,GEODE_CRYSTAL2,0xffffff);
  addCrystalShard(g,-0.35*scale,2.35*scale,0.55*scale,0.2*scale,0.9*scale,0.2*scale,GEODE_PALE,0xffffff);
  addCrystalShard(g,0.4*scale,2.4*scale,0.5*scale,0.18*scale,0.85*scale,0.18*scale,GEODE_CRYSTAL2,0xffffff);
  addCrystalShard(g,0.05*scale,2.0*scale,-0.95*scale,0.22*scale,1.0*scale,0.22*scale,GEODE_CRYSTAL,0xc8b0ff);
  // Interior wash — soft glow so Snoozle reads against the back wall from the approach.
  g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xc8b0ff,transparent:true,opacity:0.38}),0,1.15*scale,0.25*scale,1.7*scale,1.9*scale,0.1*scale));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xe8f4ff,transparent:true,opacity:0.28}),0,1.05*scale,-0.15*scale,0.95*scale));
  g.userData={kind:'crackedGeode',openFacing:'+z',chamber:true,mainRoute:true};
  scene.add(g);levelDecor.push(g);
  // Collision for the closed back / sides — leave the +Z mouth open for approach and wake.
  addSolid(x,y,z-0.85*scale,2.7*scale,2.5*scale,0.7*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x-1.55*scale,y,z+0.05*scale,0.5*scale,2.3*scale,1.7*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x+1.55*scale,y,z+0.05*scale,0.5*scale,2.3*scale,1.7*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x,y+2.15*scale,z-0.25*scale,2.4*scale,0.4*scale,1.5*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  crackedGeodeChamber={g,x,y,z,scale,openFacing:'+z',mainRoute:true,mouthHalfW:1.2*scale};
  return g;
}
function addSteamCurtain(x,y,z,w,h,axis){
  w=w||4.2;h=h||3.8;axis=axis||'z';
  const g=new THREE.Group();g.position.set(x,y,z);
  const plumes=[];
  const alongZ=axis==='x';
  for(let i=0;i<7;i++){
    const t=(i+0.5)/7,off=(t-0.5)*w*0.92;
    const px=alongZ?0:off,pz=alongZ?off:0;
    const p=mesh(SPH,new THREE.MeshBasicMaterial({color:0xe8f0ff,transparent:true,opacity:0.42}),px,h*0.45,pz,alongZ?0.28:0.35+rand(0,0.12),h*0.55,alongZ?0.35+rand(0,0.12):0.28);
    g.add(p);plumes.push({m:p,base:off});
  }
  if(alongZ){
    g.add(mesh(BOXG,lam(0x4a3a48),0,0.15,0,0.55,0.3,w*0.95));
    g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xc8d8ff,transparent:true,opacity:0.22}),0.05,h*0.5,0,0.12,h*0.95,w*0.9));
  }else{
    g.add(mesh(BOXG,lam(0x4a3a48),0,0.15,0,w*0.95,0.3,0.55));
    g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xc8d8ff,transparent:true,opacity:0.22}),0,h*0.5,0.05,w*0.9,h*0.95,0.12));
  }
  scene.add(g);
  const sol=alongZ
    ?addSolid(x,y,z,0.7,h+0.4,w+0.35,0x4a3a55,{surf:'stone',invisible:true})
    :addSolid(x,y,z,w+0.35,h+0.4,0.7,0x4a3a55,{surf:'stone',invisible:true});
  // openSide pushes plumes left (−X) for side curtains, or −X for Z curtains (matches kelp secret).
  steamCurtains.push({g,plumes,sol,x,y,z,w,h,axis,parted:false,partT:0,pt:0,openSide:alongZ?-1:-1});
  return steamCurtains[steamCurtains.length-1];
}
function partSteamCurtain(c){
  if(!c||c.parted)return;
  c.parted=true;c.partT=0;
  const i=solids.indexOf(c.sol);if(i>=0)solids.splice(i,1);
  if(c.sol&&c.sol.mesh)c.sol.mesh.visible=false;
  SFX.gust();SFX.reveal();
  spawnRing(c.x,c.y+c.h*0.45,c.z,0xc8e0ff,0.4,6,0.4);
  for(let j=0;j<16;j++)spawnP(c.x+rand(-c.w*0.4,c.w*0.4),c.y+rand(0.4,c.h),c.z+rand(-0.3,0.3),rand(-2,2),rand(1,4),rand(-1,1),rand(0.07,0.14),Math.random()<0.5?0xe8f4ff:0xc48cff,0.6,0.45,-2,0.85);
}
function gustSteamCurtains(mx,mz,k){
  for(const c of steamCurtains){
    if(c.parted)continue;
    const s=k(c.x,c.z);
    const nearFeet=Math.hypot(P.pos.x-c.x,P.pos.z-c.z)<(c.axis==='x'?1.2:c.w*0.55)+0.55;
    if(s>0.14||(nearFeet&&Math.abs(P.pos.y-c.y)<c.h))partSteamCurtain(c);
  }
}
function updateSteamCurtains(dt){
  for(const c of steamCurtains){
    if(c.parted){
      c.partT+=dt;const k=smooth(Math.min(c.partT/0.55,1));
      if(c.axis==='x')c.g.position.z=lerp(c.z,c.z-2.2,k);
      else c.g.position.x=lerp(c.x,c.x+c.openSide*2.4,k);
      for(let i=0;i<c.plumes.length;i++){
        const p=c.plumes[i],m=p.m||p;
        m.material.opacity=0.42*(1-k*0.85);
      }
      continue;
    }
    c.pt-=dt;if(c.pt<=0){c.pt=0.12;
      const ox=c.axis==='x'?rand(-0.15,0.15):rand(-c.w*0.4,c.w*0.4);
      const oz=c.axis==='x'?rand(-c.w*0.4,c.w*0.4):rand(-0.15,0.15);
      spawnP(c.x+ox,c.y+0.4,c.z+oz,rand(-0.2,0.2),rand(1.2,2.8),rand(-0.15,0.15),rand(0.06,0.1),0xe8f0ff,0.45,0.55,0,0.55);
    }
    for(let i=0;i<c.plumes.length;i++){
      const m=(c.plumes[i].m||c.plumes[i]);
      m.scale.y=(c.h*0.55)*(0.9+0.12*Math.sin(time*2.4+i));
      m.material.opacity=0.32+0.14*Math.sin(time*3+i*0.7);
    }
  }
}
function addCrystalSparks(n,cx,cz,spread){
  n=n||14;spread=spread||8;
  for(let i=0;i<n;i++){
    const col=Math.random()<0.5?GEODE_CRYSTAL2:GEODE_PALE;
    const m=mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.55}),0,0,0,0.05);
    m.position.set(cx+rand(-spread,spread),rand(21,26),cz+rand(-spread,spread));
    scene.add(m);
    crystalSparks.push({m,vx:rand(-0.12,0.12),vy:rand(0.15,0.45),vz:rand(-0.12,0.12),ph:rand(0,TAU),baseY:m.position.y,cx,cz,spread});
  }
}
function updateCrystalSparks(dt){
  for(const s of crystalSparks){
    s.m.position.x+=s.vx*dt;s.m.position.y+=s.vy*dt;s.m.position.z+=s.vz*dt;
    if(s.m.position.y>s.baseY+3.5){s.m.position.y=s.baseY;s.m.position.x=s.cx+rand(-s.spread,s.spread);s.m.position.z=s.cz+rand(-s.spread,s.spread);}
    s.m.material.opacity=0.35+0.35*Math.sin(time*3.5+s.ph);
  }
}
function inGeodeHollow(){
  const z=CURRENT_LEVEL&&CURRENT_LEVEL.route&&CURRENT_LEVEL.route.geodeHollow;
  if(!z)return false;
  return P.pos.z<=z.zEnter&&P.pos.z>=z.zExit&&Math.abs(P.pos.x)<(z.halfW||12);
}
function nearGeodeEntrance(){
  // Fade early — a few units before zEnter — so the mouth clears as Pling steps through.
  const z=CURRENT_LEVEL&&CURRENT_LEVEL.route&&CURRENT_LEVEL.route.geodeHollow;
  if(!z)return false;
  const early=z.zEnter+6;
  return P.pos.z<=early&&P.pos.z>=z.zExit&&Math.abs(P.pos.x)<(z.halfW||12)+2;
}
function updateGeodeShellFade(dt){
  if(!GEODE_SHELL.meshes.length)return;
  const inside=nearGeodeEntrance();
  const target=inside?0.2:1;
  GEODE_SHELL.fade=damp(GEODE_SHELL.fade,target,7,dt||0.016);
  const op=GEODE_SHELL.fade;
  for(const m of GEODE_SHELL.meshes){
    if(!m.material)continue;
    const b=m.userData&&m.userData.shellBaseOp!=null?m.userData.shellBaseOp:1;
    m.material.opacity=b*op;
    m.material.transparent=op<0.99||b<0.99;
    m.material.depthWrite=op>0.85&&b>0.85;
  }
  GEODE_SHELL.inside=inside;
}
function updateGeodeAmbience(dt){
  const inside=inGeodeHollow();
  if(inside!==geodeInside){
    geodeInside=inside;
    if(CURRENT_LEVEL&&CURRENT_LEVEL.peakAtmosphere){
      if(inside){
        // Cooler, closer fog — register break without a separate music system.
        scene.background=new THREE.Color(0x2a2048);
        scene.fog=new THREE.Fog(0x3a2a68,12,55);
      }else beginPeakLevel();
    }
  }
  if(!inside)return;
  geodeAmbT-=dt;
  if(geodeAmbT<=0){
    geodeAmbT=rand(1.6,3.2);
    // Sparse crystal chime — thins the Peak bed by presence, not by rewriting the sequencer.
    if(typeof SFX.crystalChime==='function')SFX.crystalChime();
    else if(AU.ctx){const c=chordNow();tone(hz(c[Math.floor(Math.random()*3)]+24,523.25),0.45,{type:'sine',gain:0.045,attack:0.02});}
  }
}

// ---- Great Steam Organ + crater finish (Stage 7) ----
let ORGAN=null;
const organFireworks=[];
function playerInOrganKeyboard(){
  if(!ORGAN||!ORGAN.trigger||!ORGAN.active)return false;
  const t=ORGAN.trigger,p=P.pos;
  return Math.abs(p.x-t.x)<t.hx&&Math.abs(p.z-t.z)<t.hz&&p.y>t.y-0.4&&p.y<t.y+t.hy;
}
function activateSteamOrgan(){
  if(!ORGAN||ORGAN.active)return;
  ORGAN.active=true;ORGAN.activateT=0;
  if(typeof SFX.organSwell==='function')SFX.organSwell();
  else SFX.wake();
  CAM.fovKick=Math.max(CAM.fovKick,5);CAM.shake=Math.max(CAM.shake,0.22);
  spawnRing(ORGAN.cx,ORGAN.deckY+1.2,ORGAN.cz+6,0xffd24a,0.45,8,0.6);
  spawnRing(ORGAN.cx,ORGAN.deckY+2.4,ORGAN.cz+2,0xff9a3c,0.3,7,0.5);
  for(let i=0;i<28;i++){
    spawnP(ORGAN.cx+rand(-3,3),ORGAN.deckY+rand(1,6),ORGAN.cz+rand(0,8),
      rand(-1.5,1.5),rand(1,4),rand(-1,2),0.1,Math.random()<0.5?0xffe36b:0xff9a3c,0.8,0.35,-3,1);
  }
  showToast('The mountain woke up!');
}
function stageOrganWinPose(){
  if(!ORGAN)return;
  const kx=ORGAN.trigger.x,kz=ORGAN.trigger.z,ky=ORGAN.deckY+0.4;
  P.pos.set(kx,ky,kz);P.vel.set(0,0,0);P.yaw=Math.PI;P.grounded=true;P.puff=true;P.puffAir=0;endHover();
  // Pull back and lift so Pling, Organ, crater walls, and sky eruption all read.
  CAM.look.set(kx,ky+3.2,kz-4.5);
  CAM.pos.set(kx+0.6,ky+7.5,kz+18.5);
  CAM.yaw=0.02;CAM.pitch=0.34;CAM.boomDist=18;CAM.targetDist=18;CAM.mode='finish';
  CAM.fovKick=Math.max(CAM.fovKick,10);CAM.shake=Math.max(CAM.shake,0.38);
  CAM.lastManual=time+99;
}
function spawnOrganFireworkBurst(){
  if(!ORGAN)return;
  // Lava-fireworks: tall eruptions from the crater throat behind the Organ, plus sky bursts.
  const throatZ=ORGAN.cz-6,throatY=ORGAN.deckY+2;
  for(let n=0;n<4;n++){
    const ox=ORGAN.cx+rand(-5,5),oy=throatY,oz=throatZ+rand(-3,1);
    const col=Math.random()<0.4?0xff4a12:(Math.random()<0.5?0xff6a18:0xffe36b);
    // Vertical lava jet (the "mountain erupts" read)
    for(let i=0;i<10;i++){
      const m=mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.95}),0,0,0,0.14+rand(0,0.08));
      m.position.set(ox+rand(-0.4,0.4),oy,oz+rand(-0.4,0.4));scene.add(m);
      organFireworks.push({m,vx:rand(-1.2,1.2),vy:rand(14,24),vz:rand(-1.2,1.2),life:rand(0.9,1.6),grav:-11,kind:'erupt'});
    }
    // Sky burst above the jet
    const bx=ox+rand(-2,2),by=oy+rand(10,16),bz=oz+rand(-2,2);
    for(let i=0;i<12;i++){
      const a=rand(0,TAU),sp=rand(2.5,8);
      const m=mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.95}),0,0,0,0.12);
      m.position.set(bx,by,bz);scene.add(m);
      organFireworks.push({m,vx:Math.cos(a)*sp,vy:rand(3,10),vz:Math.sin(a)*sp*0.55,life:rand(0.7,1.4),grav:-9,kind:'fw'});
    }
    spawnRing(ox,oy+2,oz,col,0.4,7,0.65);
    spawnRing(bx,by,bz,col,0.35,6,0.55);
  }
  ORGAN.eruptionActive=true;
  ORGAN.eruptionBurst=(ORGAN.eruptionBurst||0)+1;
}
function updateOrganFireworks(dt){
  for(let i=organFireworks.length-1;i>=0;i--){
    const f=organFireworks[i];
    f.life-=dt;f.vy+=f.grav*dt;f.m.position.x+=f.vx*dt;f.m.position.y+=f.vy*dt;f.m.position.z+=f.vz*dt;
    f.m.material.opacity=Math.max(0,f.life*0.9);
    if(f.life<=0){if(f.m.parent)f.m.parent.remove(f.m);else scene.remove(f.m);organFireworks.splice(i,1);}
  }
}
function setOrganVisualState(lit,playing){
  if(!ORGAN)return;
  const glow=lit?(playing?0.85:0.55):(0.04+Math.sin(time*0.7)*0.015);
  const steamOp=lit?(playing?0.55:0.38):(0.06+Math.sin(time*0.5)*0.02);
  if(ORGAN.pipeLights)for(const L of ORGAN.pipeLights){
    L.m.material.opacity=glow*(0.55+0.45*Math.sin(time*(playing?4:1.4)+L.ph));
  }
  if(ORGAN.valves)for(const v of ORGAN.valves){
    if(v.glow)v.glow.material.opacity=lit?(playing?0.7:0.45):(0.05+Math.sin(time*0.9+v.ph)*0.02);
  }
  if(ORGAN.steamPuffs)for(const s of ORGAN.steamPuffs){
    s.m.material.opacity=steamOp*(0.6+0.4*Math.sin(time*2+s.ph));
    if(lit)s.m.position.y=s.baseY+((time*0.7+s.ph)%2.4);
  }
  if(ORGAN.keyGlow)ORGAN.keyGlow.material.opacity=lit?(0.22+Math.sin(time*1.6)*0.1):(0.04);
  if(ORGAN.keyGlow)ORGAN.keyGlow.visible=!!lit;
  // Persistent eruption plume during win celebration.
  if(ORGAN.eruptPlume){
    const on=!!playing;
    ORGAN.eruptPlume.visible=on;
    if(on)ORGAN.eruptPlume.material.opacity=0.45+0.25*Math.sin(time*5);
  }
  if(ORGAN.eruptColumn){
    const on=!!playing;
    ORGAN.eruptColumn.visible=on;
    if(on)ORGAN.eruptColumn.material.opacity=0.55+0.2*Math.sin(time*4.2);
  }
}
function organCamHold(dt){
  if(!ORGAN)return;
  const kx=ORGAN.trigger.x,kz=ORGAN.trigger.z,ky=ORGAN.deckY+0.4;
  // Frame Pling + keyboard + Organ pipes + sky lava-fireworks above the crater throat.
  const lookX=kx,lookY=ky+3.6,lookZ=kz-5.0;
  const posX=kx+0.5,posY=ky+8.0,posZ=kz+19.5;
  CAM.look.x=damp(CAM.look.x,lookX,8,dt);CAM.look.y=damp(CAM.look.y,lookY,8,dt);CAM.look.z=damp(CAM.look.z,lookZ,8,dt);
  CAM.pos.x=damp(CAM.pos.x,posX,7,dt);CAM.pos.y=damp(CAM.pos.y,posY,7,dt);CAM.pos.z=damp(CAM.pos.z,posZ,7,dt);
  CAM.yaw=0.02;CAM.pitch=0.34;CAM.boomDist=18;CAM.targetDist=18;CAM.mode='finish';
  CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
  CAM.collisionPulled=false;
}
function updateSteamOrgan(dt,winT){
  if(!ORGAN)return;
  if(ORGAN.active)ORGAN.activateT+=dt;
  setOrganVisualState(ORGAN.active,won);
  updateOrganFireworks(dt);
  if(winT>=0){
    ORGAN.fwT=(ORGAN.fwT||0)-dt;
    if(ORGAN.fwT<=0&&winT<14){ORGAN.fwT=0.45;spawnOrganFireworkBurst();}
    return;
  }
  if(ORGAN.active&&!won&&playerInOrganKeyboard()){
    if(typeof SFX.organKey==='function')SFX.organKey();
    triggerWin();
  }
}
function buildSteamOrgan(cx,deckY,cz){
  deckY=deckY!=null?deckY:44.4;cz=cz!=null?cz:-640;
  const g=new THREE.Group();g.position.set(cx,0,cz);
  const brassDark=lam(0x5a4030),brass=lam(0xb08a4a),brassLite=pho(0xd4a85a,40,0xffe0a0);
  const rock=lam(0x3a3538),rockDeep=lam(0x2a2218),rockWarm=lam(0x4a3228);
  // Monumental pipe bank rising from volcanic rock.
  const pipes=[
    {x:-6.2,z:-2.0,h:12.5,r:0.55},
    {x:-3.4,z:-3.5,h:15.5,r:0.48},
    {x:-0.8,z:-4.2,h:17.2,r:0.62},
    {x:2.2,z:-3.2,h:14.0,r:0.5},
    {x:5.4,z:-1.6,h:11.8,r:0.58},
    {x:7.6,z:-3.8,h:13.6,r:0.42},
    {x:-7.8,z:-4.5,h:10.5,r:0.4}
  ];
  ORGAN={cx,cz,deckY,active:false,playing:false,activateT:0,pipeLights:[],valves:[],steamPuffs:[],homes:[],fwT:0,eruptionActive:false,eruptionBurst:0,g};
  for(const p of pipes){
    const body=mesh(CYL,brassDark,p.x,deckY+p.h*0.5,p.z,p.r,p.h,p.r);g.add(body);
    const rim=mesh(CYL,brass,p.x,deckY+p.h+0.08,p.z,p.r*1.15,0.16,p.r*1.15);g.add(rim);
    const light=mesh(SPH,new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:0.05,depthWrite:false}),p.x,deckY+p.h*0.65,p.z,p.r*0.85);
    g.add(light);ORGAN.pipeLights.push({m:light,ph:rand(0,TAU)});
  }
  // Rock plinth under pipes
  g.add(mesh(BOXG,rock,0,deckY-0.2,-3.2,18,1.2,8));
  g.add(mesh(BOXG,rockDeep,0,deckY+1.2,-4.5,14,3.5,4));
  // Crater volcano bowl behind the Organ — mountain climax silhouette, not a flat black corridor.
  g.add(mesh(CONE,rockWarm,0,deckY+6,-14,22,18,22));
  g.add(mesh(CONE,rockDeep,0,deckY+12,-16,12,14,12));
  g.add(mesh(CYL,lam(0x2a1a14),0,deckY+16.5,-16,5.5,1.2,5.5));
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xff4a12,transparent:true,opacity:0.55}),0,deckY+15.5,-16,3.2,1.0,3.2));
  // Persistent eruption plume (hidden until win)
  const eruptCol=mesh(CYL,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.55,depthWrite:false}),0,deckY+24,-16,2.2,14,2.2);
  eruptCol.visible=false;g.add(eruptCol);ORGAN.eruptColumn=eruptCol;
  const eruptPlume=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0.4,depthWrite:false}),0,deckY+32,-16,4.5);
  eruptPlume.visible=false;g.add(eruptPlume);ORGAN.eruptPlume=eruptPlume;
  // Warm crater lip walls flanking the celebration
  g.add(mesh(BOXG,rockWarm,-12,deckY+3,-8,5,8,18));
  g.add(mesh(BOXG,rockWarm,12,deckY+3,-8,5,8,18));
  g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.28}),0,deckY+0.3,-10,16,0.08,10));
  // Valves along the bank
  for(let i=0;i<6;i++){
    const vx=-7+i*2.6,vz=-1.2;
    g.add(mesh(CYL,brass,vx,deckY+1.1,vz,0.22,0.7,0.22));
    const glow=mesh(SPH,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.05,depthWrite:false}),vx,deckY+1.55,vz,0.28);
    g.add(glow);ORGAN.valves.push({glow,ph:i*0.7});
  }
  // Walkways / side rails — frame, not cover, the keyboard.
  addSolid(cx-9.5,deckY,cz+4,2.4,0.4,14,0x4a3a32,{surf:'stone'});
  addSolid(cx+9.5,deckY,cz+4,2.4,0.4,14,0x4a3a32,{surf:'stone'});
  g.add(mesh(BOXG,brass,-9.5,deckY+1.1,4,0.2,2.0,12));
  g.add(mesh(BOXG,brass,9.5,deckY+1.1,4,0.2,2.0,12));
  // Keyboard deck — broad, readable keys, easy entry from +Z.
  const keyZ=8.5;
  addSolid(cx,deckY,cz+keyZ,12,0.4,7,0x5a4030,{surf:'stone'});
  for(let i=0;i<8;i++){
    const kx=-5.2+i*1.45;
    const key=mesh(BOXG,i%2?brassLite:brass,kx,deckY+0.28,keyZ,1.2,0.16,4.8);
    g.add(key);
  }
  const keyGlow=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xffe36b,transparent:true,opacity:0.04,depthWrite:false}),0,deckY+0.35,keyZ,10,0.05,5.2);
  keyGlow.visible=false;g.add(keyGlow);ORGAN.keyGlow=keyGlow;
  // Subtle ambient steam (always faint); grows when active.
  for(let i=0;i<8;i++){
    const sx=rand(-6,6),sz=rand(-4,2);
    const m=mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0c0,transparent:true,opacity:0.08,depthWrite:false}),sx,deckY+3+i*0.4,sz,0.5+i*0.05);
    g.add(m);ORGAN.steamPuffs.push({m,baseY:deckY+2.5+i*0.35,ph:rand(0,TAU)});
  }
  // Pipe-top home pads (collision so surface/home settle reads) — offset so Snoozles frame Pling.
  const homes=[
    {x:cx-6.2,y:deckY+12.7,z:cz-2.0},
    {x:cx+5.4,y:deckY+12.0,z:cz-1.6},
    {x:cx-3.4,y:deckY+15.7,z:cz-3.5},
    {x:cx+2.2,y:deckY+14.2,z:cz-3.2}
  ];
  for(const h of homes){
    addSolid(h.x,h.y-0.15,h.z,1.1,0.3,1.1,0xb08a4a,{surf:'stone'});
    ORGAN.homes.push(h);
  }
  ORGAN.trigger={x:cx,y:deckY,z:cz+keyZ,hx:5.2,hy:2.4,hz:3.0};
  ORGAN.keyboard={x:cx,y:deckY,z:cz+keyZ,w:12,d:7};
  scene.add(g);levelDecor.push(g);
  setOrganVisualState(false,false);
  registerFinish({
    x:cx,z:cz+keyZ,top:deckY+16,
    winMsg:'The mountain is singing!',
    onAllAwake(){activateSteamOrgan();},
    onWin(){
      ORGAN.playing=true;
      ORGAN.eruptionActive=true;
      // Organ layer joins only at keyboard win — keeps climax/finish distinct.
      AU.layers=Math.max(AU.layers,5);
      stageOrganWinPose();
      spawnOrganFireworkBurst();
      ORGAN.fwT=0.25;
    },
    camHold(dt){organCamHold(dt);},
    update(dt,t){updateSteamOrgan(dt,t);}
  });
  return ORGAN;
}
window.__ORGAN=()=>ORGAN;
window.__organFireworks=()=>organFireworks;
