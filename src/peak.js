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
  const T=CTYPE[type]||CTYPE.mid;const g=buildCinder(T.size);const y=groundHeightAt(x,z);
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
    e.y=surfaceHeightAt(e.x,e.z,e.y+0.5,0.3);
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
  opts=opts||{};const gold=!!opts.note;const g=buildSalamander(gold);const y=groundHeightAt(x,z)+0.02;
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
    s.y=surfaceHeightAt(s.x,s.z,s.y+0.4,0.15)+0.02;
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
  updateSteamCurtains(dt);updateCrystalSparks(dt);updateGeodeAmbience(dt);
}

// ---- Stage 4 presentation + temporary endpoint + Stage 5 Geode Hollow ----
const protoEndpoints=[],driftSparks=[],steamCurtains=[],crystalSparks=[];
let geodeAmbT=0,geodeInside=false;
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
  geodeAmbT=0;geodeInside=false;
}
function addVolcanoLandmark(x,y,z,scale){
  scale=scale||1;
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CONE,lam(0x4a3530),0,8*scale,0,14*scale,18*scale,14*scale));
  g.add(mesh(CONE,lam(0x6a3a2a),0,14*scale,0,7*scale,10*scale,7*scale));
  g.add(mesh(CYL,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.55}),0,20*scale,0,2.2*scale,4*scale,2.2*scale));
  // Soft smoke puffs (decorative only)
  for(let i=0;i<3;i++)g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0c0,transparent:true,opacity:0.35}),rand(-1.5,1.5)*scale,(22+i*2.2)*scale,rand(-1.5,1.5)*scale,(2.4-i*0.3)*scale));
  scene.add(g);levelDecor.push(g);
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
  // kind:'rim' (Stage 6 crater-rim threshold); 'climb' (legacy ascent hint); default blocked mouth.
  const g=new THREE.Group();g.position.set(x,y,z);
  const rim=kind==='rim',climb=kind==='climb';
  if(rim){
    // Crater-rim silhouette + glow beyond — anticipation only, no Organ / keyboard / pipes.
    g.add(mesh(BOXG,lam(0x2a2428),-4.2,1.4,0.2,4.2,2.8,1.4));
    g.add(mesh(BOXG,lam(0x2a2428),4.2,1.6,0.1,4.2,3.2,1.5));
    g.add(mesh(BOXG,lam(0x3a322e),0,2.8,-0.4,5.5,1.2,1.8));
    g.add(mesh(BOXG,lam(0x4a3a32),-2.8,3.6,-0.6,2.4,2.2,1.2));
    g.add(mesh(BOXG,lam(0x4a3a32),2.6,3.9,-0.7,2.6,2.6,1.3));
    // Warm glow past the rim (suggests the crater beyond).
    g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:0.5}),0,1.0,-1.4,7.5,0.1,2.2));
    g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:0.28}),0,2.2,-1.8,5.5,2.4,0.4));
    // Distant brass hint — a single dull cylinder, not an Organ.
    g.add(mesh(CYL,lam(0x8a7048),0,4.8,-2.0,0.35,2.4,0.35));
    for(let i=0;i<5;i++)g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe0c0,transparent:true,opacity:0.32}),rand(-2,2),2.4+i*0.55,rand(-1.2,-0.2),0.4+i*0.06));
    addSolid(x,y,z,10.5,5.5,1.8,0x2a2428,{surf:'stone',invisible:true});
  }else if(climb){
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
  protoEndpoints.push({g,x,y,z,trigZ:z+2.4,triggered:false,fxT:0,kind:rim?'rim':(climb?'climb':'mouth')});
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
  // Open cave mouth — crystal frame, no blocking wall (replaces Stage 4 blocker).
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(BOXG,lam(GEODE_ROCK),-4.2,2.4,0,1.6,4.8,2.2));
  g.add(mesh(BOXG,lam(GEODE_ROCK),4.2,2.4,0,1.6,4.8,2.2));
  g.add(mesh(BOXG,lam(GEODE_DEEP),0,4.6,0,7.2,1.2,2.0));
  g.add(mesh(BOXG,lam(0x3a2a48),0,2.0,0.35,5.2,3.6,0.35));
  addCrystalShard(g,-3.2,3.6,0.4,0.35,1.3,0.35,GEODE_CRYSTAL2,0xffffff);
  addCrystalShard(g,3.0,3.8,0.35,0.3,1.2,0.3,GEODE_CRYSTAL,0xc8b0ff);
  addCrystalShard(g,-1.2,4.8,0.3,0.22,0.9,0.22,GEODE_PALE,0xffffff);
  addCrystalShard(g,1.4,4.9,0.25,0.2,0.85,0.2,GEODE_CRYSTAL2,0xffffff);
  // Soft cool wash so the opening reads as "inside is different".
  g.add(mesh(BOXG,new THREE.MeshBasicMaterial({color:0xa090ff,transparent:true,opacity:0.18}),0,2.2,-0.6,4.6,3.6,0.08));
  scene.add(g);levelDecor.push(g);
  addSolid(x-4.2,y,z,1.6,4.8,2.2,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x+4.2,y,z,1.6,4.8,2.2,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x,y+4.0,z,7.2,1.2,2.0,GEODE_DEEP,{surf:'stone',invisible:true});
}
function addCrackedGeode(x,y,z,scale){
  // Large broken crystal shell open toward +Z (player approach). Snoozle sits inside.
  scale=scale||1.6;
  const g=new THREE.Group();g.position.set(x,y,z);
  const shell=pho(0x5a48a0,35,0xb8a0ff),inner=pho(0x88ccff,55,0xffffff),rim=lam(GEODE_DEEP);
  // Back half + side lobes; front (+Z) stays open.
  g.add(mesh(SPH,shell,0,1.1*scale,-0.55*scale,1.55*scale,1.35*scale,1.1*scale));
  g.add(mesh(SPH,inner,0,1.05*scale,-0.35*scale,1.15*scale,1.0*scale,0.85*scale));
  g.add(mesh(BOXG,rim,-1.35*scale,1.2*scale,0.15*scale,0.55*scale,2.0*scale,1.6*scale));
  g.add(mesh(BOXG,rim,1.35*scale,1.2*scale,0.15*scale,0.55*scale,2.0*scale,1.6*scale));
  g.add(mesh(BOXG,rim,0,2.15*scale,-0.1*scale,2.4*scale,0.45*scale,1.5*scale));
  g.add(mesh(BOXG,rim,0,0.15*scale,-0.1*scale,2.2*scale,0.35*scale,1.4*scale));
  addCrystalShard(g,-0.9*scale,2.0*scale,-0.7*scale,0.28*scale,1.1*scale,0.28*scale,GEODE_CRYSTAL,0xc8b0ff);
  addCrystalShard(g,0.85*scale,1.9*scale,-0.65*scale,0.24*scale,1.0*scale,0.24*scale,GEODE_CRYSTAL2,0xffffff);
  addCrystalShard(g,0.1*scale,2.35*scale,-0.9*scale,0.2*scale,0.85*scale,0.2*scale,GEODE_PALE,0xffffff);
  // Floor cushion inside the shell
  g.add(mesh(BOXG,lam(0x3a2e55),0,0.28*scale,0.35*scale,1.6*scale,0.2*scale,1.2*scale));
  scene.add(g);levelDecor.push(g);
  // Collision for the closed back / sides — leave the +Z mouth open for approach.
  addSolid(x,y,z-0.7*scale,2.8*scale,2.4*scale,0.9*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x-1.45*scale,y,z+0.05*scale,0.55*scale,2.2*scale,1.5*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x+1.45*scale,y,z+0.05*scale,0.55*scale,2.2*scale,1.5*scale,GEODE_ROCK,{surf:'stone',invisible:true});
  addSolid(x,y+2.0*scale,z-0.15*scale,2.5*scale,0.45*scale,1.5*scale,GEODE_ROCK,{surf:'stone',invisible:true});
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
