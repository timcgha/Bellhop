const FISHC=[0xff6b81,0x4fb4e6,0xffe57f,0xa5d6a7,0xce93d8,0xffab91,0x80d8ff];
const BUBBLEGEO=new THREE.SphereGeometry(1,10,8);

function buildShark(){
  const g=new THREE.Group();
  const bodyCol=lam(0x6a7a8a),belly=lam(0x8a9aaa),fin=lam(0x5a6a7a);
  const body=mesh(SPH,bodyCol,0,0,0,0.42,0.32,1.35);body.scale.set(1,0.75,1);g.add(body);
  g.add(mesh(SPH,belly,0,-0.08,0.05,0.34,0.18,1.05));
  g.add(mesh(CONE,fin,0,0.06,0.82,0.2,0.22,0.55)); // nose
  g.add(mesh(CONE,fin,0,0.34,-0.05,0.08,0.28,0.04)); // dorsal
  const tail=new THREE.Group();tail.position.set(0,0.02,-0.82);
  tail.add(mesh(CONE,fin,0,0.12,0,0.04,0.38,0.22));tail.children[0].rotation.x=0.55;
  tail.add(mesh(CONE,fin,0,-0.12,0,0.04,0.38,0.22));tail.children[1].rotation.x=-0.55;
  g.add(tail);
  g.add(mesh(BOXG,fin,-0.28,-0.04,0.15,0.22,0.04,0.12));g.children[g.children.length-1].rotation.z=0.45;
  g.add(mesh(BOXG,fin,0.28,-0.04,0.15,0.22,0.04,0.12));g.children[g.children.length-1].rotation.z=-0.45;
  g.add(mesh(SPH,lam(0x111111),-0.16,0.1,0.42,0.06));
  g.add(mesh(SPH,lam(0x111111),0.16,0.1,0.42,0.06));
  return g;
}
function addShark(x,y,z,withNote,role){
  const g=buildShark();g.position.set(x,y,z);scene.add(g);
  const note=withNote?addNote(x,y+0.6,z,true):null;
  sharks.push({g,x,y,z,yBase:y,note,alive:true,state:'swim',trapT:0,hurtT:0,ph:rand(0,TAU),face:0,bubble:null,role:role||null});
}
function buildFish(col,gold){
  const g=new THREE.Group();
  const m=gold?pho(0xffd54a,160,0xffffff):lam(col);
  const belly=gold?pho(0xffee88,120,0xffffff):lam(0xffffff);
  g.add(mesh(BOXG,m,0,0,0,0.24,0.15,0.4));
  g.add(mesh(BOXG,belly,0,-0.05,0.02,0.18,0.06,0.28));
  const tail=new THREE.Group();tail.position.set(0,0,-0.22);
  tail.add(mesh(CONE,m,0,0.06,0,0.04,0.14,0.06));tail.children[0].rotation.x=0.65;
  tail.add(mesh(CONE,m,0,-0.06,0,0.04,0.14,0.06));tail.children[1].rotation.x=-0.65;
  g.add(tail);
  g.add(mesh(CONE,m,0,0.11,-0.02,0.04,0.1,0.02));
  g.add(mesh(BOXG,m,-0.1,-0.02,0.06,0.08,0.03,0.06));g.children[g.children.length-1].rotation.z=0.35;
  g.add(mesh(SPH,lam(0x111111),0.1,0.04,0.14,0.035));
  if(gold){
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff8c4,transparent:true,opacity:0.5}),0,0.02,0,0.26,0.16,0.44));
    g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.35}),0.12,0.08,0.08,0.05));
  }
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
  const body=lam(0x7a5a8a),spk=lam(0xf0e0ff),tip=lam(0xffffff);
  g.add(mesh(SPH,body,0,0,0,0.42,0.36,0.48));
  g.add(mesh(SPH,lam(0x9a7ab8),0,-0.06,0.02,0.34,0.28,0.38));
  for(let i=0;i<10;i++){
    const a=i/10*TAU;
    const sp=mesh(CONE,spk,Math.cos(a)*0.34,Math.sin(a)*0.16,0,0.07,0.28,0.07);
    sp.rotation.z=a-Math.PI/2;sp.rotation.y=Math.sin(a)*0.2;g.add(sp);
    g.add(mesh(SPH,tip,Math.cos(a)*0.46,Math.sin(a)*0.22,0,0.03));
  }
  g.add(mesh(CONE,tip,0,0.36,0,0.06,0.16,0.06));
  g.add(mesh(CONE,tip,0,-0.34,0,0.06,0.14,0.06));g.children[g.children.length-1].rotation.x=Math.PI;
  g.add(mesh(SPH,lam(0x111111),-0.14,0.08,0.16,0.055));
  g.add(mesh(SPH,lam(0x111111),0.14,0.08,0.16,0.055));
  return g;
}
function addSpikefish(x1,y1,z1,x2,y2,z2,withNote,role){
  const g=buildSpikefish();g.position.set(x1,y1,z1);scene.add(g);
  const note=withNote?addNote(x1,y1+0.5,z1,true):null;
  spikefish.push({g,x:x1,y:y1,z:z1,x1,y1,z1,x2,y2,z2,pathT:0,pathDir:1,note,alive:true,warnT:0,ph:rand(0,TAU),role:role||null});
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
function addClam(x,y,z,role){
  const g=buildClam();g.position.set(x,y,z);scene.add(g);
  clams.push({g,x,y,z,open:true,cd:0,ph:rand(0,TAU),gave:false,role:role||null});
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
    if(bubbleHitSomething(b,b.pos.x,b.pos.y,b.pos.z)||b.life<=0){
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

const kelps=[];let underwaterGroup=null;
const decorKelps=[],suspendMotes=[];
const CORALC=[0xff6b81,0xff8a65,0xffb347,0xf48fb1,0xce93d8,0x80cbc4,0xffee58];
const SANDC=[0xf5ecd7,0xe8dcc0,0xd9c08a,0xc8b898,0xf0e4c8];
function ugrp(){return underwaterGroup||scene;}
function beginLandLevel(){if(landGround)landGround.visible=true;if(underwaterGroup)underwaterGroup.visible=false;scene.background=new THREE.Color(0x9fdcff);scene.fog=new THREE.Fog(0x9fdcff,45,120);}
function beginUnderwaterLevel(L){
  if(landGround)landGround.visible=false;
  scene.background=new THREE.Color(0x4ab8d8);scene.fog=new THREE.Fog(0x52b8d4,20,92);
  decorKelps.length=0;suspendMotes.length=0;
  if(!underwaterGroup){underwaterGroup=new THREE.Group();scene.add(underwaterGroup);}
  underwaterGroup.visible=true;while(underwaterGroup.children.length)underwaterGroup.remove(underwaterGroup.children[0]);
  for(let i=0;i<5;i++){const c=SANDC[i%SANDC.length];const px=rand(-55,55),pz=rand(-105,18);
    const pw=rand(12,28),pd=rand(10,22);
    const patch=new THREE.Mesh(new THREE.PlaneGeometry(pw,pd),lam(c));patch.rotation.x=-Math.PI/2;patch.position.set(px,-0.54+rand(-0.02,0.01),pz);patch.rotation.z=rand(0,TAU);underwaterGroup.add(patch);}
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(140,160),lam(0xd9c8a8));floor.rotation.x=-Math.PI/2;floor.position.set(0,-0.55,-48);underwaterGroup.add(floor);
  const bright=lam(0xf5ecd7);const floor2=new THREE.Mesh(new THREE.PlaneGeometry(52,42),bright);floor2.rotation.x=-Math.PI/2;floor2.position.set(0,-0.48,4);underwaterGroup.add(floor2);
  for(let i=0;i<18;i++){const a=rand(0,TAU),r=rand(2,16);const x=Math.cos(a)*r,z=4+Math.sin(a)*r*0.6;
    underwaterGroup.add(mesh(SPH,lam(SANDC[i%SANDC.length]),x,-0.46+rand(0,0.06),z,rand(0.5,1.4),rand(0.08,0.18),rand(0.5,1.2)));}
  for(let i=0;i<24;i++){const z=rand(-100,12),x=rand(-10,10);
    underwaterGroup.add(mesh(SPH,lam(0xc8b898),x+rand(-3,3),-0.47,z+rand(-2,2),rand(0.8,2.2),rand(0.06,0.14),rand(0.8,2.2)));}
  const deepSand=lam(0xc8b898);const floor3=new THREE.Mesh(new THREE.PlaneGeometry(60,90),deepSand);floor3.rotation.x=-Math.PI/2;floor3.position.set(0,-0.52,-165);underwaterGroup.add(floor3);
  addDistantSilhouettes();
}
function sandPath(x1,z1,x2,z2){
  const cx=(x1+x2)/2,cz=(z1+z2)/2,lw=Math.abs(x2-x1)+0.4,ld=Math.abs(z2-z1)+0.4;
  ugrp().add(mesh(BOXG,lam(0xf0e4c8),cx,-0.43,cz,lw,0.05,ld));
  ugrp().add(mesh(BOXG,lam(0xe8dcc0),cx,-0.41,cz,lw*0.82,0.03,ld*0.88));
  const steps=Math.max(4,Math.round(Math.max(lw,ld)/1.6));
  for(let i=0;i<steps;i++){const t=(i+0.5)/steps;const along=lw>ld;
    const px=along?cx-lw/2+t*lw:cx+rand(-0.3,0.3),pz=along?cz+rand(-0.3,0.3):cz-ld/2+t*ld;
    ugrp().add(mesh(SPH,lam(0xb8a888),px,-0.4,pz,rand(0.06,0.14),rand(0.04,0.08),rand(0.06,0.14)));}
}
function addCoralWall(x1,z1,x2,z2){
  const cx=(x1+x2)/2,cz=(z1+z2)/2,w=Math.abs(x2-x1)+0.8,d=Math.abs(z2-z1)+0.8;
  const sol=addSolid(cx,0,cz,w,1.6,d,0xff7043,{surf:'stone'});sol.mesh.visible=false;
  const along=w>d,len=Math.max(w,d),n=Math.max(4,Math.round(len/0.75));
  for(let i=0;i<n;i++){const t=(i+0.5)/n;const px=along?cx-w/2+t*w:cx+rand(-0.25,0.25),pz=along?cz+rand(-0.25,0.25):cz-d/2+t*d;
    const c=CORALC[i%CORALC.length];const bh=0.45+rand(0,0.55);
    scene.add(mesh(SPH,lam(c),px,bh,pz,rand(0.4,0.85),rand(0.35,0.9),rand(0.4,0.85)));
    scene.add(mesh(CONE,lam(c),px+rand(-0.2,0.2),0.2,pz+rand(-0.2,0.2),rand(0.14,0.26),rand(0.4,0.95),rand(0.14,0.26)));
    if(i%2===0)scene.add(mesh(CONE,lam(c),px,bh+0.35,pz,rand(0.08,0.16),rand(0.25,0.45),rand(0.08,0.16)));}
  const kn=Math.max(3,Math.round(len/1.4));
  for(let i=0;i<kn;i++){const t=(i+0.5)/kn;const px=along?cx-w/2+t*w:cx,pz=along?cz:cz-d/2+t*d;
    const side=along?(px>cx?1:-1):(pz>cz?1:-1);
    addKelpCluster(px+side*0.9,pz,1.2,2,2.2+rand(0,1.5));}
}
function addCoralScatter(n,cx,cz,r){for(let i=0;i<n;i++){const a=rand(0,TAU),rr=Math.sqrt(Math.random())*r;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr,c=CORALC[i%CORALC.length];
  const bh=0.3+rand(0,0.35);
  scene.add(mesh(SPH,lam(c),x,bh,z,rand(0.22,0.55),rand(0.22,0.55),rand(0.22,0.55)));
  if(i%3===0)scene.add(mesh(CONE,lam(c),x+rand(-0.1,0.1),0.15,z+rand(-0.1,0.1),rand(0.1,0.18),rand(0.3,0.55),rand(0.1,0.18)));
  if(i%4===0){const sh=lam(0xf5a8a8);scene.add(mesh(SPH,sh,x+0.12,bh-0.05,z+0.08,rand(0.08,0.14),rand(0.05,0.08),rand(0.1,0.16)));}}
}
function buildKelpStrand(h){const g=new THREE.Group();const stem=mesh(CYL,lam(0x3d7a37),0,h/2,0,0.06+rand(0,0.02),h,0.06+rand(0,0.02));g.add(stem);
  const frN=3+Math.floor(rand(0,2.99));
  for(let i=0;i<frN;i++){const y=0.4+i*(h/frN);const fr=mesh(CONE,lam(0x4caf50),0,y,0,0.28+rand(0,0.12),0.45+rand(0,0.15),0.07);fr.rotation.z=(i%2?1:-1)*(0.55+rand(0,0.25));fr.rotation.y=i*0.9+rand(-0.2,0.2);g.add(fr);}return g;}
function addKelpCluster(cx,cz,w,count,hBase){
  const g=new THREE.Group();g.position.set(cx,0,cz);ugrp().add(g);
  const strands=[];const n=count||Math.max(3,Math.round(w*1.2));
  for(let i=0;i<n;i++){const t=(i+0.5)/n;const sx=(t-0.5)*w+rand(-0.15,0.15);const h=(hBase||3)+rand(-0.6,1.4);
    const st=buildKelpStrand(h);st.position.set(sx,0,rand(-0.2,0.2));g.add(st);strands.push(st);}
  decorKelps.push({g,strands,ph:rand(0,TAU)});
}
function addKelpCurtain(id,cx,cz,w,h,secret){
  const g=new THREE.Group();g.position.set(cx,0,cz);scene.add(g);
  const strands=[];const n=Math.max(4,Math.round(w*1.4));
  for(let i=0;i<n;i++){const t=(i+0.5)/n;const sx=(t-0.5)*w;const st=buildKelpStrand(h+rand(-0.4,0.6));st.position.set(sx,0,rand(-0.15,0.15));g.add(st);strands.push(st);}
  const sol=addSolid(cx,0,cz,w+0.4,h+0.5,0.55,0x2e6b32,{surf:'grass'});
  sol.mesh.visible=false;
  kelps.push({id,g,strands,sol,cx,cz,w,h,secret:!!secret,parted:false,partT:0,openSide:secret?-1:1});
  addKelpCluster(cx+(secret?-2.2:0),cz+(secret?0:2.8),w+1.5,3,h*0.55);
}
function addSeabedScatter(cx,cz,r,n){for(let i=0;i<n;i++){const a=rand(0,TAU),rr=Math.sqrt(Math.random())*r;const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;
  const kind=Math.random();if(kind<0.35){const sh=lam(0xf5a8a8);ugrp().add(mesh(SPH,sh,x,-0.44,z,rand(0.07,0.14),rand(0.04,0.07),rand(0.1,0.18)));}
  else if(kind<0.7){ugrp().add(mesh(SPH,lam(0xb8a888),x,-0.45,z,rand(0.05,0.12),rand(0.04,0.07),rand(0.05,0.12)));}
  else{ugrp().add(mesh(CONE,lam(CORALC[i%CORALC.length]),x,-0.42,z,rand(0.06,0.1),rand(0.08,0.14),rand(0.06,0.1)));}}
}
function dressWreckSurface(x,y,z,w,h,d){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const trim=lam(0x7a5a3a),weed=lam(0x3d7a37);
  g.add(mesh(BOXG,trim,0,h*0.48,0,w*0.94,h*0.08,d*0.94));
  g.add(mesh(SPH,weed,-w*0.4,h*0.58,d*0.35,rand(0.1,0.16),rand(0.08,0.14),rand(0.1,0.16)));
  g.add(mesh(SPH,weed,w*0.38,h*0.55,-d*0.32,rand(0.1,0.16),rand(0.08,0.14),rand(0.1,0.16)));
}
function dressWreckLedge(x,y,z,w,d){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  g.add(mesh(BOXG,lam(0xd9c08a),0,0.2,0,w*0.88,0.07,d*0.88));
  g.add(mesh(BOXG,lam(0x8a6a4a),0,0.08,0,w*0.92,0.06,d*0.92));
}
function inWreckInterior(){
  if(!WRECK||!WRECK.interior)return false;
  const b=WRECK.interior,p=P.pos;
  return p.x>b.x0&&p.x<b.x1&&p.z>b.z0&&p.z<b.z1&&p.y<b.yMax;
}
function updateWreckVisuals(){
  if(!WRECK||!WRECK.shaftLights)return;
  for(const l of WRECK.shaftLights){l.m.material.opacity=0.055+Math.sin(time*0.75+l.ph)*0.035;}
  if(WRECK.shaftBubbles)for(const b of WRECK.shaftBubbles){
    b.m.position.y=((b.y0+time*b.sp*0.9+b.ph*0.5)%13)+0.8;
    b.m.position.x=b.x0+Math.sin(time*0.6+b.ph)*0.12;
  }
  if(WRECK.openGlow){WRECK.openGlow.material.opacity=0.05+Math.sin(time*0.5)*0.02;}
}
function buildWreckShaftVisuals(g){
  const shaftX=0,shaftZ=3;
  WRECK.shaftLights=[];WRECK.shaftBubbles=[];
  [2.8,5.6,8.4,11.2].forEach((dy,i)=>{
    const beam=new THREE.Mesh(new THREE.PlaneGeometry(3.2,4.2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.08,depthWrite:false}));
    beam.position.set(shaftX,dy+1.4,shaftZ);beam.rotation.x=-0.12;g.add(beam);
    WRECK.shaftLights.push({m:beam,ph:i*1.1});
    const fr=mesh(BOXG,lam(0x4a3520),shaftX-2.1,dy+0.5,shaftZ,0.12,2.0,0.12);fr.rotation.z=0.32;g.add(fr);
    const fl=mesh(BOXG,lam(0x4a3520),shaftX+2.1,dy+0.5,shaftZ,0.12,2.0,0.12);fl.rotation.z=-0.32;g.add(fl);
  });
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(4.5,3),new THREE.MeshBasicMaterial({color:0xc8f0ff,transparent:true,opacity:0.06,depthWrite:false}));
  glow.position.set(shaftX,15.5,shaftZ);g.add(glow);WRECK.openGlow=glow;
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshBasicMaterial({color:0xd8f8ff,transparent:true,opacity:0.18,depthWrite:false}));
    const x0=shaftX+rand(-1,1),y0=rand(0.8,11);m.position.set(x0,y0,shaftZ+rand(-0.7,0.7));m.scale.setScalar(rand(0.04,0.09));g.add(m);
    WRECK.shaftBubbles.push({m,x0,y0,ph:rand(0,TAU),sp:rand(0.35,0.85)});
  }
}
function dressPlatform(x,y,z,w,h,d){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const rock=lam(0x9aa4ad),sand=lam(0xd9c08a),coral=lam(CORALC[Math.floor(rand(0,CORALC.length))]);
  g.add(mesh(BOXG,rock,0,h*0.5,0,w*0.92,h*0.88,d*0.92));
  g.add(mesh(BOXG,sand,0,h*0.02,0,w*0.78,0.08,d*0.78));
  for(let i=0;i<4;i++){const ox=(i%2?1:-1)*w*0.38,oz=(i<2?1:-1)*d*0.38;
    g.add(mesh(SPH,rock,ox,h*0.55,oz,rand(0.18,0.32),rand(0.15,0.28),rand(0.18,0.32)));}
  if(h>0.8){g.add(mesh(SPH,coral,w*0.32,h*0.75,d*0.22,rand(0.15,0.28),rand(0.18,0.32),rand(0.15,0.28)));
    g.add(mesh(CONE,coral,-w*0.28,h*0.65,-d*0.2,rand(0.08,0.14),rand(0.22,0.38),rand(0.08,0.14)));}
}
function addDistantSilhouettes(){
  const rock=lam(0x3a6a7a);
  [[-22,-30,1.2],[-26,-55,1.5],[-20,-82,1.3],[22,-35,1.1],[24,-68,1.4],[18,-95,1.6],[-16,-108,1.2],[0,-118,1.8],[-18,-145,1.4],[18,-150,1.5],[0,-175,2.2]].forEach(([x,z,s])=>{
    ugrp().add(mesh(SPH,rock,x,1.2*s,-z,s*2.2,s*1.4,s*1.6));
    ugrp().add(mesh(CONE,rock,x+rand(-1,1),0.4*s,-z,rand(0.5,0.9)*s,rand(1.2,2)*s,rand(0.5,0.9)*s));});
}
function addSuspendMotes(n){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,6,5),new THREE.MeshBasicMaterial({color:0xd8f8ff,transparent:true,opacity:rand(0.08,0.22),depthWrite:false}));
    const x=rand(-12,12),y=rand(0.5,8),z=rand(-105,14);m.position.set(x,y,z);m.scale.setScalar(rand(0.03,0.09));ugrp().add(m);
    suspendMotes.push({m,x,y,z,ph:rand(0,TAU),sp:rand(0.2,0.7)});}
}
function addSnoozleShell(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  const shell=lam(0xf5a8a8);
  g.add(mesh(SPH,shell,-0.55,-0.05,0,0.75,0.18,0.55));g.add(mesh(SPH,shell,0.55,-0.05,0,0.75,0.18,0.55));
  g.add(mesh(SPH,lam(0xfff0f0),0,0.08,0,0.55,0.12,0.45));
  addSeabedScatter(x,z,1.2,4);scene.add(g);}
function addSunRays(n,cx,cz){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(0.35,8+rand(0,6)),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.07+Math.random()*0.05,depthWrite:false}));
  m.position.set(cx+rand(-8,8),rand(6,14),cz+rand(-6,6));m.rotation.x=-0.35+rand(-0.1,0.1);m.rotation.z=rand(-0.2,0.2);ugrp().add(m);}}
function gustHitKelp(mx,mz,k){
  for(const kp of kelps){if(kp.parted)continue;if(Math.abs(kp.cz-mz)>kp.h+2)continue;
    const s=k(kp.cx,kp.cz);if(s>0.12)partKelp(kp,s);}}
function partKelp(kp,s){
  if(kp.parted)return;kp.parted=true;kp.partT=0;SFX.gust();
  const i=solids.indexOf(kp.sol);if(i>=0)solids.splice(i,1);
  spawnRing(kp.cx,kp.h*0.55,kp.cz,0xa5d6a7,0.35,5,0.35);
  for(let j=0;j<10;j++)spawnP(kp.cx+rand(-1,1),rand(0.5,kp.h),kp.cz+rand(-1,1),rand(-2,2),rand(0.5,2),rand(-2,2),0.07,0xc8f0ff,0.5,0.3,-4,0.9);
  if(kp.secret)showToast('The kelp wall parted!');}
function updateKelp(dt){
  for(const kp of kelps){
    kp.strands.forEach((st,i)=>{st.rotation.z=Math.sin(time*1.4+i)*0.08;st.rotation.x=Math.sin(time*1.1+i*0.7)*0.05;
      if(kp.parted){kp.partT+=dt;const k=smooth(Math.min(kp.partT/0.55,1));st.rotation.y=kp.openSide*(0.9+i*0.08)*k;}});
    if(kp.parted&&kp.partT>0.15){const k=smooth(Math.min(kp.partT/0.7,1));kp.g.position.x=lerp(kp.cx,kp.cx+kp.openSide*2.0,k);}}
  updateDecorKelp(dt);updateSuspendMotes(dt);}
function updateDecorKelp(dt){
  for(const kp of decorKelps){kp.strands.forEach((st,i)=>{st.rotation.z=Math.sin(time*(1.2+kp.ph*0.1)+i*0.7)*0.12;st.rotation.x=Math.sin(time*0.9+i*0.5+kp.ph)*0.06;});}}
function updateSuspendMotes(dt){
  for(const p of suspendMotes){p.m.position.y=p.y+Math.sin(time*p.sp+p.ph)*0.35;p.m.position.x=p.x+Math.sin(time*0.4+p.ph)*0.15;p.m.position.z=p.z+Math.cos(time*0.35+p.ph)*0.12;}
  updateWreckVisuals();}

let WRECK=null;
const WRECK_DECK_H=2.8;
const WRECK_RECOVERY_MAX=3.2;
function initWreck(cx,cz){
  WRECK={cx,cz,deckH:WRECK_DECK_H,recoveryMax:WRECK_RECOVERY_MAX,ledges:[]};
}
function wreckDeck(x,y,z,w,d,holeW,holeD,holeOz){
  if(!WRECK)initWreck(x,z);
  const col=0x7a5a3a;
  if(!holeW||holeW<=0){addSolid(x,y,z,w,0.5,d,col,{surf:'stone'});dressWreckSurface(x,y,z,w,0.5,d);return;}
  const hw=holeW/2,hd=holeD/2,nw=(w-holeW)/2,hz=z+(holeOz||0);
  if(nw>0.2){addSolid(x-nw/2-hw/2,y,z,w/2-hw/2,0.5,d,col,{surf:'stone'});addSolid(x+nw/2+hw/2,y,z,w/2-hw/2,0.5,d,col,{surf:'stone'});}
  const south=hz-hd-(z-d/2),north=(z+d/2)-(hz+hd);
  if(south>0.2)addSolid(x,y,z-d/2+south/2,w,0.5,south,col,{surf:'stone'});
  if(north>0.2)addSolid(x,y,z+d/2-north/2,w,0.5,north,col,{surf:'stone'});
  dressWreckSurface(x,y,z,w,0.5,d);
}
function wreckLedge(x,y,z,w,d,tag){
  if(!WRECK)initWreck(x,z);
  addSolid(x,y,z,w,0.42,d,0x8a6a4a,{surf:'stone'});
  dressWreckLedge(x,y,z,w,d);
  WRECK.ledges.push({x,y,z,w,d,tag:tag||''});
}
function buildWreck(cx,cz){
  initWreck(cx,cz);
  const g=new THREE.Group();g.position.set(cx,0,cz);scene.add(g);
  const wood=lam(0x6b4a2a),dark=lam(0x4a3520),rust=lam(0x8a5a3a),hull=lam(0x5a3820);
  g.add(mesh(BOXG,dark,0,0.35,0,8.5,0.45,17));
  const stern=mesh(BOXG,hull,0,3.4,-6,11,5.2,7);stern.rotation.z=0.1;g.add(stern);
  g.add(mesh(BOXG,dark,-5.8,2.2,-6,1,3.8,6.5));g.add(mesh(BOXG,dark,5.8,2.2,-6,1,3.8,6.5));
  const mid=mesh(BOXG,hull,0,3.9,1,9.5,6,9);mid.rotation.z=0.16;g.add(mid);
  g.add(mesh(BOXG,hull,-5.2,3.2,1,0.9,4.8,8.5));g.add(mesh(BOXG,hull,5.2,3.2,1,0.9,4.8,8.5));
  g.add(mesh(BOXG,hull,0,3.1,7,7,4.2,4.5));
  g.add(mesh(BOXG,hull,0,2.6,10,4.8,3,2.8));
  const bow=mesh(BOXG,hull,0,2,12.5,2.8,2,1.6);bow.rotation.x=-0.15;g.add(bow);
  g.add(mesh(BOXG,dark,2.2,1.8,9.5,1.8,2.2,0.25));
  g.add(mesh(BOXG,dark,-2.5,4.8,-7.5,3.5,1.2,0.25));
  for(let i=0;i<7;i++){const rz=-7.5+i*2.4;
    const rib=mesh(BOXG,dark,0,2.1+rand(0,0.4),rz,0.14,3.2+rand(0,0.8),0.14);rib.rotation.z=0.18+rand(-0.06,0.06);g.add(rib);
    g.add(mesh(BOXG,rust,-5.8,2.6,rz,0.1,2.6,0.1));g.add(mesh(BOXG,rust,5.8,2.6,rz,0.1,2.6,0.1));}
  for(let i=0;i<4;i++){const by=1.4+i*2.4,bh=mesh(BOXG,wood,0,by,-1.5+i*0.4,10.5,0.16,0.16);
    bh.rotation.x=0.1+i*0.03;bh.rotation.z=0.06;g.add(bh);}
  const mast=mesh(CYL,rust,3.2,8.5,-1.5,0.38,17,0.38);mast.rotation.z=0.3;g.add(mast);
  g.add(mesh(BOXG,rust,3.2,15,-1.5,5,0.18,0.22));
  g.add(mesh(BOXG,rust,3.2,11.5,-1.5,0.18,0.14,2.8));
  const nest=new THREE.Group();nest.position.set(0,13.6,-3.5);
  nest.add(mesh(BOXG,rust,0,0,0,4,0.32,4));
  for(let i=0;i<4;i++){const a=i*Math.PI/2+0.4;
    nest.add(mesh(CYL,rust,Math.cos(a)*1.7,0.65,Math.sin(a)*1.7,0.09,1.3,0.09));}
  nest.add(mesh(BOXG,rust,0,1.15,0,3.6,0.1,3.6));
  g.add(nest);
  buildWreckShaftVisuals(g);
  addCoralScatter(5,cx+8,cz-3,3);addCoralScatter(4,cx-8,cz+1,3);
  addKelpCluster(cx-10,cz+5,2.5,4,3.5);addKelpCluster(cx+10,cz+3,2.5,4,3);
  addFishSchool(cx+7,2.5,cz+9,5);
  for(let i=0;i<2;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4,6+rand(0,2)),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.06+Math.random()*0.03,depthWrite:false}));
    m.position.set(rand(-3,3),rand(5,11),rand(-4,8));m.rotation.y=rand(-0.2,0.2);m.rotation.x=-0.18;g.add(m);}
  WRECK.g=g;WRECK.entrance={x:cx,z:cz+10};
  WRECK.interior={cx,cz,x0:cx-7,x1:cx+7,z0:cz-14,z1:cz+12,yMax:15.5};
}
window.__WRECK=()=>WRECK;
window.__WRECK_RECOVERY_MAX=()=>WRECK_RECOVERY_MAX;
window.__inWreckInterior=inWreckInterior;
window.__TEST={
  addClam:(x,y,z,r)=>{addClam(x,y,z,r);return clams[clams.length-1];},
  addShark:(x,y,z,n)=>{addShark(x,y,z,n);return sharks[sharks.length-1];},
  addFishSchool:(x,y,z,n)=>{addFishSchool(x,y,z,n);return fish.slice(-n);},
  addNoteFish:(x,y,z)=>{addNoteFish(x,y,z);return fish[fish.length-1];},
  addSpikefish:(x1,y1,z1,x2,y2,z2,n,r)=>{addSpikefish(x1,y1,z1,x2,y2,z2,n,r);return spikefish[spikefish.length-1];}
};
