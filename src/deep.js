const FISHC=[0xff6b81,0x4fb4e6,0xffe57f,0xa5d6a7,0xce93d8,0xffab91,0x80d8ff];
const BUBBLEGEO=new THREE.SphereGeometry(1,10,8);

function buildShark(){
  const g=new THREE.Group();
  const body=mesh(SPH,lam(0x6a7a8a),0,0,0,0.55,0.28,1.1);
  body.scale.set(1,0.7,1.4);g.add(body);
  g.add(mesh(CONE,lam(0x5a6a7a),0,0.05,0.72,0.18,0.18,0.5)); // nose
  g.add(mesh(SPH,lam(0x111111),-0.18,0.12,0.35,0.07));
  g.add(mesh(SPH,lam(0x111111),0.18,0.12,0.35,0.07));
  g.add(mesh(CONE,lam(0x4a5a6a),0,0.18,-0.75,0.32,0.05,0.45)); // tail
  return g;
}
function addShark(x,y,z,withNote){
  const g=buildShark();g.position.set(x,y,z);scene.add(g);
  const note=withNote?addNote(x,y+0.6,z,true):null;
  sharks.push({g,x,y,z,yBase:y,note,alive:true,state:'swim',trapT:0,hurtT:0,ph:rand(0,TAU),face:0,bubble:null});
}
function buildFish(col,gold){
  const g=new THREE.Group();
  const m=gold?pho(0xffd54a,120,0xffffff):lam(col);
  g.add(mesh(SPH,m,0,0,0,0.14,0.1,0.28));
  g.add(mesh(CONE,m,0,0,0.16,0.08,0.08,0.16));
  if(gold){const sh=mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff8c4,transparent:true,opacity:0.45}),0,0.02,0,0.2,0.12,0.32);g.add(sh);}
  return g;
}
function addFishSchool(x,y,z,n){
  for(let i=0;i<n;i++){
    const a=rand(0,TAU),r=rand(0.4,2.2);
    const fx=x+Math.cos(a)*r,fy=y+rand(-0.4,0.4),fz=z+Math.sin(a)*r;
    const g=buildFish(FISHC[i%FISHC.length],false);g.position.set(fx,fy,fz);scene.add(g);
    fish.push({g,x:fx,y:fy,z:fz,hx:fx,hy:fy,hz:fz,vx:0,vy:0,vz:0,note:null,kind:'ordinary',ph:rand(0,TAU),alive:true});
  }
}
function addNoteFish(x,y,z){
  const g=buildFish(0xffd54a,true);g.position.set(x,y,z);scene.add(g);
  const note=addNote(x,y+0.35,z,true);
  fish.push({g,x,y,z,hx:x,hy:y,hz:z,vx:0,vy:0,vz:0,note,kind:'note',ph:rand(0,TAU),alive:true});
}
function buildSpikefish(){
  const g=new THREE.Group();
  g.add(mesh(SPH,lam(0x7a5a8a),0,0,0,0.38,0.28,0.55));
  for(let i=0;i<6;i++){const a=i/6*TAU;const sp=mesh(CONE,lam(0xd8c8e8),Math.cos(a)*0.28,Math.sin(a)*0.12,0,0.06,0.22,0.06);sp.rotation.z=a-Math.PI/2;g.add(sp);}
  g.add(mesh(SPH,lam(0x111111),-0.12,0.08,0.18,0.05));
  g.add(mesh(SPH,lam(0x111111),0.12,0.08,0.18,0.05));
  return g;
}
function addSpikefish(x1,y1,z1,x2,y2,z2,withNote){
  const g=buildSpikefish();g.position.set(x1,y1,z1);scene.add(g);
  const note=withNote?addNote(x1,y1+0.5,z1,true):null;
  spikefish.push({g,x:x1,y:y1,z:z1,x1,y1,z1,x2,y2,z2,pathT:0,pathDir:1,note,alive:true,warnT:0,ph:rand(0,TAU)});
}
function buildClam(){
  const g=new THREE.Group();
  const shell=lam(0xf5a8a8);
  g.add(mesh(SPH,shell,0,-0.05,0,0.75,0.22,0.65));
  const top=new THREE.Group();top.position.y=0.08;
  top.add(mesh(SPH,shell,0,0,0,0.7,0.18,0.6));g.add(top);
  g.userData={top,bubble:mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8f0ff,transparent:true,opacity:0.75}),0,0.35,0,0.18)};
  g.userData.bubble.visible=false;g.add(g.userData.bubble);
  return g;
}
function addClam(x,y,z){
  const g=buildClam();g.position.set(x,y,z);scene.add(g);
  clams.push({g,x,y,z,open:true,cd:0,ph:rand(0,TAU),gave:false});
}
for(let i=0;i<16;i++){
  const m=new THREE.Mesh(BUBBLEGEO,new THREE.MeshPhongMaterial({color:0xc8f0ff,shininess:140,specular:0xffffff,transparent:true,opacity:0.72}));
  m.scale.setScalar(0.2);m.visible=false;scene.add(m);
  bubbleShots.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,r:0.22});
}

function killShark(s,byBubble){
  if(!s.alive||s.state==='trapped')return;
  if(byBubble){
    s.state='trapped';s.trapT=0;
    const bm=new THREE.Mesh(BUBBLEGEO,new THREE.MeshPhongMaterial({color:0xd8f8ff,transparent:true,opacity:0.55,shininess:120,specular:0xffffff}));
    bm.scale.setScalar(0.9);s.g.add(bm);s.bubble=bm;
    SFX.bubbleTrap();return;
  }
  s.alive=false;s.g.visible=false;SFX.sharkPop();
  if(s.note)revealHeldNote(s.note);
  for(let i=0;i<10;i++)spawnP(s.x,s.y+0.3,s.z,rand(-2,2),rand(1,3),rand(-2,2),0.08,0x9fe4ff,0.45,0.3,-5,0.9);
}
function popFish(f){
  if(!f.alive)return;
  f.alive=false;f.g.visible=false;SFX.fishPop();
  for(let i=0;i<10;i++)spawnP(f.x,f.y,f.z,rand(-2,2),rand(1,3.5),rand(-2,2),0.07,Math.random()<0.5?0xffffff:0xc8f0ff,0.5,0.3,-4,1);
  if(f.note)revealHeldNote(f.note);
}
function killSpikefish(sp){
  if(!sp.alive)return;
  sp.alive=false;sp.g.visible=false;SFX.bubblePop();
  if(sp.note)revealHeldNote(sp.note);
  for(let i=0;i<8;i++)spawnP(sp.x,sp.y,sp.z,rand(-2,2),rand(1,3),rand(-2,2),0.08,0xd8c8f0,0.4,0.3,-5,0.9);
}
function fireBubble(){
  const yaw=P.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw);
  const mx=P.pos.x+fx*0.35,my=P.pos.y+0.85,mz=P.pos.z+fz*0.35;
  let b=null;for(const q of bubbleShots){if(!q.alive){b=q;break;}}
  if(!b)return;
  b.alive=true;b.life=2.4;b.pos.set(mx,my,mz);b.vel.set(fx*7,0.8,fz*7);
  b.m.visible=true;b.m.position.copy(b.pos);b.m.scale.setScalar(0.22);
  SFX.bubbleShot();
  for(let i=0;i<6;i++)spawnP(mx,my,mz,fx*rand(1,3),rand(0.2,1.2),fz*rand(1,3),0.06,0xd8f8ff,0.35,0.3,0,0.8);
}
function bubbleHitSomething(b,x,y,z){
  for(const s of sharks){if(!s.alive)continue;if(Math.hypot(x-s.x,z-s.z)<0.75&&Math.abs(y-s.y)<0.7){killShark(s,true);return true;}}
  for(const sp of spikefish){if(!sp.alive)continue;if(Math.hypot(x-sp.x,z-sp.z)<0.65&&Math.abs(y-sp.y)<0.65){killSpikefish(sp);return true;}}
  for(const f of fish){if(!f.alive)continue;if(Math.hypot(x-f.x,z-f.z)<0.45&&Math.abs(y-f.y)<0.35){popFish(f);return true;}}
  return false;
}

function updateSharks(dt){
  for(const s of sharks){
    if(!s.alive)continue;
    if(s.state==='trapped'){
      s.trapT+=dt;s.y+=dt*1.6;s.g.position.y=s.y;
      if(s.bubble)s.bubble.scale.setScalar(0.9+Math.sin(s.trapT*8)*0.05);
      if(s.trapT>1.1){
        SFX.bubblePop();spawnRing(s.x,s.y+0.4,s.z,0xd8f8ff,0.35,5,0.35);
        if(s.note)revealHeldNote(s.note);
        s.alive=false;s.g.visible=false;
      }
      continue;
    }
    s.y=s.yBase+Math.sin(time*1.1+s.ph)*0.28;
    const dx=P.pos.x-s.x,dz=P.pos.z-s.z,d=Math.hypot(dx,dz)||0.01;
    s.face=Math.atan2(dx,dz);
    s.g.rotation.y=angDamp(s.g.rotation.y,s.face,4,dt);
    const sp=2.4;
    if(d>0.8){s.x+=dx/d*sp*dt;s.z+=dz/d*sp*dt;}
    s.g.position.set(s.x,s.y,s.z);
    if(s.hurtT>0)s.hurtT-=dt;
    if(!P.dead&&P.inv<=0&&d<0.85&&Math.abs(P.pos.y-s.y)<1.1){
      hurtPlayer(dx/d*4,dz/d*4,0x6a7a8a);SFX.sharkBite();
    }
  }
}
function updateFish(dt){
  const px=P.pos.x,pz=P.pos.z;
  for(const f of fish){
    if(!f.alive)continue;
    const dx=f.x-px,dz=f.z-pz,d=Math.hypot(dx,dz);
    if(d<3.5&&d>0.05){
      const flee=(1-d/3.5)*3.5;
      f.vx+=dx/d*flee*dt*8;f.vz+=dz/d*flee*dt*8;
      if(d<0.55&&f.kind==='ordinary'){
        P.vel.x-=dx/d*0.8*dt;P.vel.z-=dz/d*0.8*dt;
      }
    }
    f.vx=damp(f.vx,0,2.5,dt);f.vz=damp(f.vz,0,2.5,dt);
    f.vy=damp(f.vy,0,2,dt);
    f.x+=f.vx*dt;f.y+=f.vy*dt;f.z+=f.vz*dt;
    f.y=f.hy+Math.sin(time*1.8+f.ph)*0.12;
    f.g.position.set(f.x,f.y,f.z);
    f.g.rotation.y=Math.atan2(f.vx,f.vz)||f.g.rotation.y;
    if(f.kind==='note'){f.g.rotation.y+=dt*0.6;f.g.scale.setScalar(1+Math.sin(time*4+f.ph)*0.08);}
  }
}
function updateSpikefish(dt){
  for(const sp of spikefish){
    if(!sp.alive)continue;
    sp.pathT+=dt*0.12*sp.pathDir;
    if(sp.pathT>=1){sp.pathT=1;sp.pathDir=-1;}else if(sp.pathT<=0){sp.pathT=0;sp.pathDir=1;}
    const k=sp.pathT;
    sp.x=lerp(sp.x1,sp.x2,k);sp.y=lerp(sp.y1,sp.y2,k)+Math.sin(time*0.9+sp.ph)*0.15;sp.z=lerp(sp.z1,sp.z2,k);
    sp.g.position.set(sp.x,sp.y,sp.z);
    sp.g.rotation.y=Math.atan2(sp.x2-sp.x1,sp.z2-sp.z1);
    const d=Math.hypot(sp.x-P.pos.x,sp.z-P.pos.z);
    if(d<7&&Math.abs(sp.y-P.pos.y)<2.5){
      sp.warnT-=dt;
      if(sp.warnT<=0){sp.warnT=1.8;SFX.spikeWarn();}
    }
    if(!P.dead&&P.inv<=0&&d<0.7&&Math.abs(P.pos.y-sp.y)<0.8){
      const dx=sp.x-P.pos.x,dz=sp.z-P.pos.z,l=Math.hypot(dx,dz)||1;
      hurtPlayer(dx/l*3,dz/l*3,0x9a7ab8);SFX.spikeTouch();
    }
  }
}
function updateBubbleShots(dt){
  for(const b of bubbleShots){
    if(!b.alive)continue;
    b.life-=dt;b.pos.x+=b.vel.x*dt;b.pos.y+=b.vel.y*dt;b.pos.z+=b.vel.z*dt;
    b.vel.y+=GRAV*0.15*dt;
    b.m.position.copy(b.pos);
    b.m.scale.setScalar(0.22+Math.sin(time*12)*0.03);
    if(bubbleHitSomething(b,b.pos.x,b.pos.y,b.pos.z)||b.life<=0||Math.abs(b.pos.x)>50||Math.abs(b.pos.z)>50){
      b.alive=false;b.m.visible=false;
    }
  }
}
function updateClams(dt){
  for(const c of clams){
    c.cd=Math.max(0,c.cd-dt);
    c.open=c.cd<=0;
    const top=c.g.userData.top;
    top.rotation.x=c.open?-0.55:0.05+Math.sin(time*1.5+c.ph)*0.03;
    c.g.userData.bubble.visible=c.open&&P.bubble;
    if(c.open){
      c.g.userData.bubble.position.y=0.35+Math.sin(time*3+c.ph)*0.06;
      c.g.scale.setScalar(1+Math.sin(time*2+c.ph)*0.02);
    }
    if(!P.dead&&c.open){
      tmpV.set(P.pos.x,P.pos.y+0.5,P.pos.z);
      if(c.g.position.distanceTo(tmpV)<1.35){
        if(!P.bubble){
          P.bubble=true;SFX.bubblePower();CAM.fovKick=Math.max(CAM.fovKick,5);
          showToast('Bubble power! Gust to trap fish — keep it until something hits you.');
          for(let i=0;i<14;i++)spawnP(c.x,c.y+0.4,c.z,rand(-2,2),rand(1,3),rand(-2,2),0.07,0xc8f0ff,0.6,0.3,-4,1);
          updateHUD();
        }
        c.cd=1.6;
      }
    }
  }
}

function hitSharkSpinJet(s,dmg){
  if(!s.alive||s.state==='trapped')return;
  killShark(s,false);
}
