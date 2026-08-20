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
const SHARK_AGGRO=7,SHARK_LEASH=9;
function addShark(x,y,z,withNote,role){
  const g=buildShark();g.position.set(x,y,z);scene.add(g);
  const note=withNote?addNote(x,y+0.6,z,true):null;
  sharks.push({g,x,y,z,hx:x,hz:z,yBase:y,note,alive:true,state:'swim',trapT:0,hurtT:0,backT:0,ph:rand(0,TAU),face:0,bubble:null,role:role||null});
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
    const hx=s.hx-s.x,hz=s.hz-s.z,dHome=Math.hypot(hx,hz)||0.001;
    if(s.backT>0)s.backT-=dt;
    let mx=0,mz=0,sp=0;
    if(s.backT>0){
      // just bit: retreat toward home instead of chain-biting
      if(dHome>1){mx=hx/dHome;mz=hz/dHome;sp=2.4;s.face=Math.atan2(mx,mz);}
      else s.face=Math.atan2(-dx,-dz);
    }else if(!P.dead&&d<SHARK_AGGRO&&dHome<SHARK_LEASH){
      s.face=Math.atan2(dx,dz);
      if(d>0.8){mx=dx/d;mz=dz/d;sp=2.4;}
    }else if(dHome>0.6){
      mx=hx/dHome;mz=hz/dHome;sp=2.0;s.face=Math.atan2(mx,mz);
    }else{
      s.face=s.ph+Math.sin(time*0.35+s.ph)*0.9;
    }
    if(sp>0){s.x+=mx*sp*dt;s.z+=mz*sp*dt;}
    s.g.rotation.y=angDamp(s.g.rotation.y,s.face,4,dt);
    s.g.position.set(s.x,s.y,s.z);
    if(s.hurtT>0)s.hurtT-=dt;
    if(!P.dead&&P.inv<=0&&s.backT<=0&&d<0.85&&Math.abs(P.pos.y-s.y)<1.1){
      hurtPlayer(dx/d*4,dz/d*4,0x6a7a8a);SFX.sharkBite();s.backT=2.2;
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
    // gentle pull back toward home so scared fish do not drift away forever
    f.vx+=(f.hx-f.x)*0.8*dt;f.vz+=(f.hz-f.z)*0.8*dt;
    f.vx=damp(f.vx,0,2.5,dt);f.vz=damp(f.vz,0,2.5,dt);
    f.x+=f.vx*dt;f.z+=f.vz*dt;
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
          c.cd=1.6;
        }
      }
    }
  }
}

function hitSharkSpinJet(s,dmg){
  if(!s.alive||s.state==='trapped')return;
  killShark(s,false);
}

const kelps=[];let underwaterGroup=null;
const decorKelps=[],suspendMotes=[],biolumGlows=[];
const CORALC=[0xff6b81,0xff8a65,0xffb347,0xf48fb1,0xce93d8,0x80cbc4,0xffee58];
const SANDC=[0xf5ecd7,0xe8dcc0,0xd9c08a,0xc8b898,0xf0e4c8];
const BIOLUMC=[0x66ffe0,0x88aaff,0xc48cff,0x6ef0a8];
function ugrp(){return underwaterGroup||scene;}
function beginLandLevel(){if(landGround)landGround.visible=true;if(underwaterGroup)underwaterGroup.visible=false;scene.background=new THREE.Color(0x9fdcff);scene.fog=new THREE.Fog(0x9fdcff,45,120);}
function beginUnderwaterLevel(L){
  if(landGround)landGround.visible=false;
  scene.background=new THREE.Color(0x4ab8d8);scene.fog=new THREE.Fog(0x52b8d4,20,92);
  decorKelps.length=0;suspendMotes.length=0;biolumGlows.length=0;CONCH=null;
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
function dressWreckSurface(x,y,z,w,h,d,weeds){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const trim=lam(0x7a5a3a),weed=lam(0x3d7a37);
  g.add(mesh(BOXG,trim,0,h*0.48,0,w*0.94,h*0.08,d*0.94));
  if(weeds){
    g.add(mesh(SPH,weed,-w*0.4,h*0.58,d*0.35,rand(0.1,0.16),rand(0.08,0.14),rand(0.1,0.16)));
    g.add(mesh(SPH,weed,w*0.38,h*0.55,-d*0.32,rand(0.1,0.16),rand(0.08,0.14),rand(0.1,0.16)));
  }
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
function addWreckShell(parent,m){
  // Decorative outer hull / wall occluders — fade when inside for phone readability.
  if(m.material&&typeof m.material.clone==='function'){
    m.material=m.material.clone();
    m.material.transparent=true;
    m.material.opacity=1;
  }
  parent.add(m);
  if(!WRECK.shellMeshes)WRECK.shellMeshes=[];
  WRECK.shellMeshes.push(m);
  return m;
}
function updateWreckShellFade(dt){
  if(!WRECK||!WRECK.shellMeshes||!WRECK.shellMeshes.length)return;
  const inside=inWreckInterior();
  const target=inside?0.22:1;
  if(WRECK.shellFade==null)WRECK.shellFade=1;
  WRECK.shellFade=damp(WRECK.shellFade,target,7,dt);
  const op=WRECK.shellFade;
  for(const m of WRECK.shellMeshes){
    if(!m.material)continue;
    m.material.opacity=op;
    m.material.transparent=op<0.99;
    m.material.depthWrite=op>0.85;
  }
  WRECK.shellInside=inside;
}
function updateWreckVisuals(dt){
  if(!WRECK)return;
  updateWreckShellFade(dt||0.016);
  if(WRECK.shaftLights)for(const l of WRECK.shaftLights){l.m.material.opacity=0.11+Math.sin(time*0.75+l.ph)*0.05;}
  if(WRECK.shaftBubbles)for(const b of WRECK.shaftBubbles){
    b.m.position.y=((b.y0+time*b.sp*0.9+b.ph*0.5)%13)+0.8;
    b.m.position.x=b.x0+Math.sin(time*0.6+b.ph)*0.12;
  }
  if(WRECK.openGlow){WRECK.openGlow.material.opacity=0.1+Math.sin(time*0.5)*0.035;}
  if(WRECK.entryGlow){WRECK.entryGlow.material.opacity=0.09+Math.sin(time*0.65)*0.03;}
}
function buildWreckShaftVisuals(g){
  WRECK.shaftLights=[];WRECK.shaftBubbles=[];
  // [deck height, local z of that deck's climb hole] — brighter shafts + thin hole rims for phone read
  const rim=lam(0xc8a878);
  [[2.8,6],[5.6,2.5],[8.4,0],[11.2,-2.5]].forEach(([dy,hz],i)=>{
    const beam=new THREE.Mesh(new THREE.PlaneGeometry(3.6,4.6),new THREE.MeshBasicMaterial({color:0xe8f8ff,transparent:true,opacity:0.12,depthWrite:false}));
    beam.position.set(0,dy+1.4,hz);beam.rotation.x=-0.12;g.add(beam);
    WRECK.shaftLights.push({m:beam,ph:i*1.1});
    // light rim around the climb hole so the next deck reads as an opening, not a dark slab
    g.add(mesh(BOXG,rim,0,dy+0.55,hz,3.4,0.08,3.4));
    const fr=mesh(BOXG,lam(0x6a5030),-2.35,dy+0.55,hz,0.1,1.6,0.1);fr.rotation.z=0.28;g.add(fr);
    const fl=mesh(BOXG,lam(0x6a5030),2.35,dy+0.55,hz,0.1,1.6,0.1);fl.rotation.z=-0.28;g.add(fl);
  });
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(5.2,3.6),new THREE.MeshBasicMaterial({color:0xc8f0ff,transparent:true,opacity:0.1,depthWrite:false}));
  glow.position.set(0,15.5,-4);g.add(glow);WRECK.openGlow=glow;
  // keel entrance wash — reads the way in from open water
  const entry=new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.8),new THREE.MeshBasicMaterial({color:0xb8e8ff,transparent:true,opacity:0.09,depthWrite:false}));
  entry.position.set(0,2.2,WRECK_HALF_L-0.2);g.add(entry);WRECK.entryGlow=entry;
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshBasicMaterial({color:0xd8f8ff,transparent:true,opacity:0.18,depthWrite:false}));
    const x0=rand(-1,1),y0=rand(0.8,11);m.position.set(x0,y0,rand(-2.5,6));m.scale.setScalar(rand(0.04,0.09));g.add(m);
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
  [[-22,-30,1.2],[-26,-55,1.5],[-20,-82,1.3],[22,-35,1.1],[24,-68,1.4],[18,-95,1.6],[-16,-108,1.2],[24,-120,1.8],[-18,-145,1.4],[18,-150,1.5],[-26,-178,2.2],
   [-20,-220,1.8],[20,-235,2.0],[-22,-255,1.6],[18,-270,2.1],[-16,-285,1.7],[22,-288,1.9]].forEach(([x,z,s])=>{
    ugrp().add(mesh(SPH,rock,x,1.2*s,z,s*2.2,s*1.4,s*1.6));
    ugrp().add(mesh(CONE,rock,x+rand(-1,1),0.4*s,z,rand(0.5,0.9)*s,rand(1.2,2)*s,rand(0.5,0.9)*s));});
}
function addSuspendMotes(n){
  for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,6,5),new THREE.MeshBasicMaterial({color:0xd8f8ff,transparent:true,opacity:rand(0.08,0.22),depthWrite:false}));
    const x=rand(-12,12),y=rand(0.5,8),z=rand(-105,14);m.position.set(x,y,z);m.scale.setScalar(rand(0.03,0.09));ugrp().add(m);
    suspendMotes.push({m,x,y,z,ph:rand(0,TAU),sp:rand(0.2,0.7)});}
}
function addTrenchFloor(cx,cz,w,d){
  const dark=lam(0x3a4a58),mid=lam(0x4a5a68);
  ugrp().add(mesh(BOXG,dark,cx,-0.52,cz,w,0.08,d));
  ugrp().add(mesh(BOXG,mid,cx,-0.46,cz,w*0.72,0.05,d*0.88));
}
function addTrenchRock(x,y,z,w,h,d){
  const sol=addSolid(x,y,z,w,h,d,0x2a3540,{surf:'stone'});sol.mesh.visible=false;
  const rock=lam(0x2f3d4c),dark=lam(0x1e2834),edge=lam(0x3a4e62);
  ugrp().add(mesh(BOXG,rock,x,y+h*0.48,z,w*0.96,h*0.92,d*0.96));
  ugrp().add(mesh(BOXG,dark,x+(w>d?0:w*0.08),y+h*0.55,z+(d>w?0:d*0.08),w*0.7,h*0.7,d*0.7));
  ugrp().add(mesh(SPH,edge,x+w*0.28,y+h*0.7,z-d*0.2,Math.min(w,d)*0.22,h*0.18,Math.min(w,d)*0.22));
  ugrp().add(mesh(SPH,dark,x-w*0.25,y+h*0.45,z+d*0.22,Math.min(w,d)*0.28,h*0.22,Math.min(w,d)*0.28));
}
function addBiolumCluster(cx,cz,n){
  const count=n||4;
  for(let i=0;i<count;i++){
    const a=i/count*TAU+rand(-0.2,0.2),r=0.4+rand(0,1.1);
    const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,col=BIOLUMC[i%BIOLUMC.length];
    const stemH=0.45+rand(0,0.55);
    ugrp().add(mesh(CYL,lam(0x2a4a3a),x,stemH*0.45,z,0.04,stemH,0.04));
    const bulb=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.85,depthWrite:false}));
    bulb.position.set(x,stemH+0.12,z);bulb.scale.setScalar(0.12+rand(0,0.08));ugrp().add(bulb);
    const halo=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.22,depthWrite:false}));
    halo.position.set(x,stemH+0.12,z);halo.scale.setScalar(0.28+rand(0,0.1));ugrp().add(halo);
    biolumGlows.push({m:halo,base:0.18,ph:rand(0,TAU)});
    if(i%2===0){
      const shell=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.55,depthWrite:false}));
      shell.position.set(x+0.2,0.12,z-0.15);shell.scale.set(0.14,0.07,0.16);ugrp().add(shell);
      biolumGlows.push({m:shell,base:0.4,ph:rand(0,TAU)});
    }
  }
}
function addGlowPool(x,z,col,size){
  const s=size||2.4;
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(s,s*0.7),new THREE.MeshBasicMaterial({color:col||0x66ffe0,transparent:true,opacity:0.16,depthWrite:false}));
  pool.rotation.x=-Math.PI/2;pool.position.set(x,0.02,z);ugrp().add(pool);
  biolumGlows.push({m:pool,base:0.14,ph:rand(0,TAU)});
  const moteN=3;
  for(let i=0;i<moteN;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshBasicMaterial({color:col||0x66ffe0,transparent:true,opacity:0.2,depthWrite:false}));
    const mx=x+rand(-s*0.3,s*0.3),my=0.4+rand(0,1.6),mz=z+rand(-s*0.25,s*0.25);
    m.position.set(mx,my,mz);m.scale.setScalar(rand(0.04,0.08));ugrp().add(m);
    suspendMotes.push({m,x:mx,y:my,z:mz,ph:rand(0,TAU),sp:rand(0.25,0.6)});
  }
}
function addTrenchMotes(n,cx,cz,spread){
  const r=spread||5;
  for(let i=0;i<n;i++){
    const col=BIOLUMC[i%BIOLUMC.length];
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:rand(0.1,0.22),depthWrite:false}));
    const x=cx+rand(-r,r),y=rand(0.4,5.5),z=cz+rand(-r,r);
    m.position.set(x,y,z);m.scale.setScalar(rand(0.03,0.08));ugrp().add(m);
    suspendMotes.push({m,x,y,z,ph:rand(0,TAU),sp:rand(0.2,0.55)});
  }
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
  for(const g of biolumGlows){if(g.m&&g.m.material)g.m.material.opacity=g.base+Math.sin(time*1.4+g.ph)*0.06;}
  updateWreckVisuals(dt);}

let WRECK=null;
const WRECK_DECK_H=2.8;
const WRECK_RECOVERY_MAX=3.2;
function initWreck(cx,cz){
  WRECK={cx,cz,deckH:WRECK_DECK_H,recoveryMax:WRECK_RECOVERY_MAX,ledges:[],shellMeshes:[],shellFade:1,shellInside:false};
}
function wreckDeck(x,y,z,w,d,holeW,holeD,holeOz){
  if(!WRECK)initWreck(x,z);
  const col=0x7a5a3a;
  // Dress each collision segment individually so the trim never spans the hole.
  const seg=(sx,sz,sw,sd,weeds)=>{addSolid(sx,y,sz,sw,0.5,sd,col,{surf:'stone'});dressWreckSurface(sx,y,sz,sw,0.5,sd,weeds);};
  if(!holeW||holeW<=0){seg(x,z,w,d,true);return;}
  const hw=holeW/2,hd=holeD/2,nw=(w-holeW)/2,hz=z+(holeOz||0);
  if(nw>0.2){seg(x-nw/2-hw/2,z,w/2-hw/2,d,true);seg(x+nw/2+hw/2,z,w/2-hw/2,d,true);}
  const south=hz-hd-(z-d/2),north=(z+d/2)-(hz+hd);
  if(south>0.2)seg(x,z-d/2+south/2,holeW,south,false);
  if(north>0.2)seg(x,z+d/2-north/2,holeW,north,false);
}
function wreckLedge(x,y,z,w,d,tag){
  if(!WRECK)initWreck(x,z);
  addSolid(x,y,z,w,0.42,d,0x8a6a4a,{surf:'stone'});
  dressWreckLedge(x,y,z,w,d);
  WRECK.ledges.push({x,y,z,w,d,tag:tag||''});
}
// Collision shell dimensions (local to the wreck center). The visible hull
// and the collision hull are the same boxes, so what the player sees is what
// blocks them. The only way in at seabed level is the keel entrance gap on
// the bow (north) face; the only way out at the top is over the broken
// wall tops (height WRECK_WALL_H) from the crow's-nest deck.
const WRECK_WALL_H=13,WRECK_HALF_W=7.8,WRECK_HALF_L=10.4,WRECK_GAP_HALF=3,WRECK_GAP_H=4.2;
function buildWreck(cx,cz){
  initWreck(cx,cz);
  const g=new THREE.Group();g.position.set(cx,0,cz);scene.add(g);
  const wood=lam(0x8a6a48),dark=lam(0x5a4030),rust=lam(0x8a5a3a),hull=lam(0x6a4830),liner=lam(0x9a7858);
  const HW=WRECK_HALF_W,HL=WRECK_HALF_L,GH=WRECK_GAP_HALF,GY=WRECK_GAP_H,WH=WRECK_WALL_H;
  // --- collision hull shell (world coords); hide bulky default boxes and dress thin liners ---
  // Liners sit on the inner collision face so what you see is what stops you.
  const west=addSolid(cx-HW,0,cz,0.8,WH,HL*2,0x5a3820,{surf:'stone'});west.mesh.visible=false;
  const east=addSolid(cx+HW,0,cz,0.8,WH,HL*2,0x5a3820,{surf:'stone'});east.mesh.visible=false;
  const stern=addSolid(cx,0,cz-HL,HW*2+0.8,WH,0.8,0x4a3520,{surf:'stone'});stern.mesh.visible=false;
  const sideW=HW+0.4-GH;
  const bowL=addSolid(cx-GH-sideW/2,0,cz+HL,sideW,WH,0.8,0x5a3820,{surf:'stone'});bowL.mesh.visible=false;
  const bowR=addSolid(cx+GH+sideW/2,0,cz+HL,sideW,WH,0.8,0x5a3820,{surf:'stone'});bowR.mesh.visible=false;
  const bowTop=addSolid(cx,GY,cz+HL,GH*2,WH-GY,0.8,0x4a3520,{surf:'stone'});bowTop.mesh.visible=false;
  // Wall liners + exterior plating are shell occluders (fade inside). Climb decks/ledges stay opaque.
  addWreckShell(g,mesh(BOXG,liner,-(HW-0.4-0.12),WH*0.5,0,0.24,WH,HL*2-0.6));
  addWreckShell(g,mesh(BOXG,liner,HW-0.4-0.12,WH*0.5,0,0.24,WH,HL*2-0.6));
  addWreckShell(g,mesh(BOXG,liner,0,WH*0.5,-(HL-0.4-0.12),HW*2-0.6,WH,0.24));
  addWreckShell(g,mesh(BOXG,liner,-(GH+sideW/2),WH*0.5,HL-0.4-0.12,sideW-0.2,WH,0.24));
  addWreckShell(g,mesh(BOXG,liner,GH+sideW/2,WH*0.5,HL-0.4-0.12,sideW-0.2,WH,0.24));
  addWreckShell(g,mesh(BOXG,liner,0,GY+(WH-GY)*0.5,HL-0.4-0.12,GH*2-0.2,WH-GY,0.24));
  // --- exterior dressing: plating pulled outward so interiors read open ---
  for(const s of[-1,1]){
    const p1=mesh(BOXG,hull,s*(HW+0.95),5.2,-3.5,0.28,10,12);p1.rotation.z=s*0.07;addWreckShell(g,p1);
    const p2=mesh(BOXG,dark,s*(HW+0.9),4.6,5.5,0.28,8.5,7.5);p2.rotation.z=s*0.1;addWreckShell(g,p2);
    for(let i=0;i<6;i++){const rz=-8.5+i*3.4;
      addWreckShell(g,mesh(BOXG,rust,s*(HW+1.1),1.6+rand(0,0.5),rz,0.14,3.4+rand(0,1.2),0.14));}
    for(let i=0;i<5;i++){const tz=-8+i*4+rand(-0.8,0.8);
      addWreckShell(g,mesh(BOXG,hull,s*(HW+0.2),WH+rand(0.3,1.1),tz,0.55,rand(0.6,2.2),rand(1.4,3.2)));}
  }
  for(let i=0;i<4;i++)addWreckShell(g,mesh(BOXG,dark,-6+i*4+rand(-0.5,0.5),WH+rand(0.3,0.9),-HL-0.35,rand(1.2,2.6),rand(0.5,1.8),0.55));
  // raised stern castle silhouette above the stern wall
  addWreckShell(g,mesh(BOXG,hull,0,WH+0.9,-HL+1.2,10,1.8,2.8));
  addWreckShell(g,mesh(BOXG,dark,0,WH+2,-HL+1,6,0.9,2.2));
  // --- tapered bow forward of the entrance wall ---
  for(const s of[-1,1]){
    const plate=mesh(BOXG,hull,s*4.4,7.5,HL+2.2,8.6,6.5,0.35);plate.rotation.y=-s*0.49;addWreckShell(g,plate);
    const rail=mesh(BOXG,dark,s*4.3,11,HL+2.3,8.8,0.35,0.45);rail.rotation.y=-s*0.49;addWreckShell(g,rail);
  }
  const stem=mesh(BOXG,dark,0,8.6,HL+4.4,0.5,7,0.65);stem.rotation.x=-0.18;addWreckShell(g,stem);
  const sprit=mesh(CYL,rust,0,12.6,HL+5.5,0.16,4.5,0.16);sprit.rotation.x=1.1;addWreckShell(g,sprit);
  // broken interior beams — side stubs only, clear of the climb shaft (stay opaque)
  for(let i=0;i<4;i++){const by=1.4+i*2.4;
    for(const s of[-1,1]){const bh=mesh(BOXG,wood,s*4.3,by,-5.8+i*0.7,2.8,0.14,0.14);
      bh.rotation.z=s*0.07;g.add(bh);}}
  // mast leaning over the ship, leading the eye up to the crow's nest (stay opaque)
  const mast=mesh(CYL,rust,3.8,8.5,-4.5,0.34,17,0.34);mast.rotation.z=0.3;g.add(mast);
  g.add(mesh(BOXG,rust,3.8,15,-4.5,5,0.18,0.22));
  g.add(mesh(BOXG,rust,3.8,11.5,-4.5,0.18,0.14,2.8));
  // crow's-nest railing around the top collision deck (deck itself is a wreckDeck step)
  const nest=new THREE.Group();nest.position.set(0,14.5,-6);
  for(const sx of[-1,1])for(const sz of[-1,1])
    nest.add(mesh(CYL,rust,sx*2.5,0.55,sz*2.5,0.1,1.1,0.1));
  nest.add(mesh(BOXG,rust,0,1.1,0,5.4,0.12,0.3));nest.add(mesh(BOXG,rust,0,1.1,0,0.3,0.12,5.4));
  nest.add(mesh(BOXG,rust,-2.5,1.1,0,0.14,0.12,5.2));nest.add(mesh(BOXG,rust,2.5,1.1,0,0.14,0.12,5.2));
  nest.add(mesh(BOXG,rust,0,1.1,-2.5,5.2,0.12,0.14));nest.add(mesh(BOXG,rust,0,1.1,2.5,5.2,0.12,0.14));
  g.add(nest);
  buildWreckShaftVisuals(g);
  addCoralScatter(5,cx+9,cz-3,3);addCoralScatter(4,cx-9,cz+1,3);
  addKelpCluster(cx-10,cz+5,2.5,4,3.5);addKelpCluster(cx+10,cz+3,2.5,4,3);
  addFishSchool(cx+7,2.5,cz+9,5);
  for(let i=0;i<2;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4,6+rand(0,2)),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.06+Math.random()*0.03,depthWrite:false}));
    m.position.set(rand(-3,3),rand(5,11),rand(-4,8));m.rotation.y=rand(-0.2,0.2);m.rotation.x=-0.18;g.add(m);}
  WRECK.g=g;WRECK.entrance={x:cx,z:cz+10};
  WRECK.interior={cx,cz,x0:cx-HW+0.2,x1:cx+HW-0.2,z0:cz-HL-0.2,z1:cz+HL+0.2,yMax:15.5};
}
window.__WRECK=()=>WRECK;
window.__WRECK_RECOVERY_MAX=()=>WRECK_RECOVERY_MAX;
window.__inWreckInterior=inWreckInterior;

let CONCH=null;
function inConchInterior(){
  if(!CONCH||!CONCH.interior)return false;
  const b=CONCH.interior,p=P.pos;
  return p.x>b.x0&&p.x<b.x1&&p.y<b.yMax&&p.z>b.z0&&p.z<b.z1;
}
function playerInConchTrigger(){
  if(!CONCH||!CONCH.trigger||!CONCH.open)return false;
  const t=CONCH.trigger,p=P.pos;
  // Must clear the doorway plane first — brushing the open mouth never wins.
  if(p.z>CONCH.doorZ-1.4)return false;
  return Math.abs(p.x-t.x)<t.hx&&Math.abs(p.y-t.y)<t.hy&&Math.abs(p.z-t.z)<t.hz;
}
function setConchDoorOpen(open){
  if(!CONCH||!CONCH.doorSolid)return;
  const i=solids.indexOf(CONCH.doorSolid);
  if(open){if(i>=0)solids.splice(i,1);CONCH.doorSolid.mesh.visible=false;if(CONCH.doorVis)CONCH.doorVis.visible=false;if(CONCH.openMouth)CONCH.openMouth.visible=true;if(CONCH.closedSeam)CONCH.closedSeam.visible=false;}
  else{if(i<0)solids.push(CONCH.doorSolid);CONCH.doorSolid.mesh.visible=false;if(CONCH.doorVis)CONCH.doorVis.visible=true;if(CONCH.openMouth)CONCH.openMouth.visible=false;if(CONCH.closedSeam)CONCH.closedSeam.visible=true;}
}
function openConch(){
  if(!CONCH||CONCH.open)return;
  CONCH.open=true;CONCH.openT=0;
  setConchDoorOpen(true);
  SFX.conchOpen();
  CAM.fovKick=Math.max(CAM.fovKick,5);CAM.shake=Math.max(CAM.shake,0.25);
  spawnRing(CONCH.doorX,CONCH.doorY,CONCH.doorZ,0xffe9b0,0.45,6,0.55);
  for(let i=0;i<18;i++)spawnP(CONCH.doorX+rand(-1,1),CONCH.doorY+rand(0,2),CONCH.doorZ+rand(-0.5,0.5),rand(-2,2),rand(1,4),rand(-2,2),0.08,Math.random()<0.5?0xffe36b:0xc8f0ff,0.7,0.3,-4,1);
  showToast('The Conch opened!');
}
function updateConch(dt,winT){
  if(!CONCH)return;
  if(CONCH.open)CONCH.openT+=dt;
  const glow=CONCH.open?(0.22+Math.min(CONCH.openT,1)*0.35):(0.06+Math.sin(time*0.8)*0.02);
  if(CONCH.spiralLights)for(const L of CONCH.spiralLights){L.m.material.opacity=glow*(0.55+0.45*Math.sin(time*1.6+L.ph));}
  if(CONCH.shellGlow)CONCH.shellGlow.material.opacity=CONCH.open?(0.12+Math.min(CONCH.openT,1)*0.18):(0.03+Math.sin(time*0.6)*0.015);
  if(CONCH.interiorGlow)CONCH.interiorGlow.material.opacity=CONCH.open?(0.12+Math.min(CONCH.openT,1)*0.28):0.03;
  if(winT>=0){
    if(CONCH.rainbow){const k=smooth(Math.min(winT/1.3,1));CONCH.rainbow.visible=true;CONCH.rainbow.scale.setScalar(0.2+k*1.1);
      CONCH.rainbow.children.forEach(r=>{r.material.opacity=0.85*k;});}
    if(CONCH.spiralLights)for(const L of CONCH.spiralLights){L.m.material.opacity=0.55+Math.sin(time*4+L.ph)*0.25;}
    if(CONCH.shellGlow)CONCH.shellGlow.material.opacity=0.35+Math.sin(time*3)*0.08;
    if(CONCH.interiorGlow)CONCH.interiorGlow.material.opacity=0.4+Math.sin(time*2.4)*0.1;
  }else if(CONCH.open&&!won&&playerInConchTrigger())triggerWin();
}
function addConchShellSolid(x,y,z,w,h,d){
  const s=addSolid(x,y,z,w,h,d,0xd9a07a,{surf:'stone'});s.mesh.visible=false;CONCH.shellSolids.push(s);return s;
}
function buildConch(cx,cz){
  // Doorway aperture facing +z (north / trench approach). Collision and visuals share these sizes.
  const DOOR_W=3.6,DOOR_H=3.5,DOOR_D=0.85,DOOR_Y=0.35,DOOR_Z=5.15;
  CONCH={cx,cz,open:false,openT:0,spiralLights:[],shellSolids:[],
    doorX:cx,doorY:DOOR_Y+DOOR_H*0.5,doorZ:cz+DOOR_Z,
    doorW:DOOR_W,doorH:DOOR_H};
  const g=new THREE.Group();g.position.set(cx,0,cz);scene.add(g);
  // Warm shell palette — value shifts sell the spiral at phone distance.
  const cream=lam(0xe8d5bc),ivory=lam(0xf4e8d4),shell=lam(0xd9a07a),deep=lam(0xc4865c),
    recess=lam(0xb07850),rib=lam(0xf5ebd8),lip=lam(0xe8b890),dark=lam(0x5a3020),inner=lam(0xf0c8a8);
  // --- GIANT CONCH SILHOUETTE (visual only; collision proxies below stay boxy) ---
  // Classic SIDE-PROFILE shell facing the trench: huge left coil stepping up to a
  // pointed skyline tip, swollen body around a compact mouth hole. Built so the
  // outline alone reads as a giant conch at phone approach distance.
  // Main swollen body chamber (around the doorway)
  g.add(mesh(SPH,cream,0.8,3.6,1.2,5.0,4.4,4.6));
  g.add(mesh(SPH,shell,1.6,2.9,2.4,3.8,3.4,3.2));
  g.add(mesh(SPH,deep,-0.6,4.6,-0.2,3.6,3.2,3.4));
  // Stepped spiral coil — five LARGE lobes climbing LEFT and UP (the shell read)
  g.add(mesh(SPH,cream,-4.4,2.8,2.0,4.2,3.6,3.4));
  g.add(mesh(SPH,shell,-5.4,4.8,0.4,3.5,3.1,3.0));
  g.add(mesh(SPH,deep,-5.0,6.8,-1.4,2.7,2.5,2.5));
  g.add(mesh(SPH,recess,-3.8,8.4,-2.8,2.05,1.95,1.95));
  g.add(mesh(SPH,deep,-2.4,9.8,-4.0,1.45,1.4,1.4));
  // Raised ribs on each coil step (lighter)
  g.add(mesh(SPH,rib,-4.5,3.2,2.2,4.45,0.85,3.55));
  g.add(mesh(SPH,ivory,-5.5,5.2,0.6,3.7,0.7,3.15));
  g.add(mesh(SPH,rib,-5.1,7.2,-1.2,2.9,0.58,2.65));
  g.add(mesh(SPH,ivory,-3.9,8.8,-2.6,2.2,0.48,2.1));
  g.add(mesh(SPH,rib,-2.5,10.2,-3.8,1.6,0.38,1.5));
  // Dark recesses between turns (value contrast for spiral depth)
  g.add(mesh(SPH,recess,-4.9,3.9,1.0,3.2,0.6,2.7));
  g.add(mesh(SPH,recess,-5.2,5.9,-0.6,2.6,0.55,2.3));
  g.add(mesh(SPH,recess,-4.4,7.7,-2.2,2.05,0.48,1.85));
  // Right flare / lip wing (asymmetry past the mouth)
  g.add(mesh(SPH,shell,4.6,2.5,2.6,3.0,2.8,2.5));
  g.add(mesh(SPH,cream,5.5,3.4,1.2,2.35,2.15,2.1));
  g.add(mesh(SPH,rib,4.9,2.9,2.0,3.1,0.6,2.6));
  // Belly / keel
  g.add(mesh(SPH,shell,-1.2,1.0,0.5,5.4,1.7,5.0));
  g.add(mesh(SPH,deep,0.5,0.85,-2.4,3.6,1.35,3.6));
  // --- SPIRE — tall tip that breaks the trench skyline from approach ---
  g.add(mesh(SPH,shell,-1.2,10.6,-4.6,1.6,1.55,1.55));
  g.add(mesh(SPH,deep,-0.5,12.2,-5.2,1.1,1.25,1.05));
  g.add(mesh(SPH,recess,0.05,13.6,-5.6,0.62,0.95,0.58));
  const tip=mesh(CONE,ivory,0.35,15.2,-5.9,0.4,2.6,0.4);tip.rotation.z=-0.28;g.add(tip);
  g.add(mesh(SPH,cream,0.55,16.6,-6.1,0.15,0.3,0.14));
  g.add(mesh(SPH,rib,-1.0,11.1,-4.8,1.75,0.34,1.65));
  g.add(mesh(SPH,rib,-0.25,12.8,-5.4,1.2,0.28,1.15));
  // --- ORGANIC MOUTH — compact hole in the body (not a building façade) ---
  g.add(mesh(SPH,lip,0.2,2.2,4.5,3.0,2.5,1.4));
  g.add(mesh(SPH,inner,0.15,2.1,3.9,2.3,1.95,1.25));
  g.add(mesh(SPH,shell,-2.0,2.0,4.55,1.55,2.2,1.2));
  g.add(mesh(SPH,shell,2.3,2.1,4.5,1.65,2.25,1.25));
  g.add(mesh(SPH,lip,0.15,3.85,4.75,2.6,0.95,1.05));
  g.add(mesh(SPH,lip,0.15,0.55,4.95,2.5,0.65,1.0));
  for(let i=0;i<5;i++){
    const a=-0.9+i*0.45,cy=2.1+Math.sin(a)*1.3,cxo=Math.cos(a)*1.85;
    g.add(mesh(SPH,rib,cxo,cy,DOOR_Z-0.12,0.45,0.38,0.4));
  }
  const doorVis=mesh(SPH,dark,0,DOOR_Y+DOOR_H*0.5,DOOR_Z,DOOR_W*0.55,DOOR_H*0.52,DOOR_D*0.55);
  g.add(doorVis);CONCH.doorVis=doorVis;
  const closedSeam=mesh(SPH,lam(0x3a2010),0,DOOR_Y+DOOR_H*0.5,DOOR_Z+0.22,0.08,DOOR_H*0.4,0.06);
  g.add(closedSeam);CONCH.closedSeam=closedSeam;
  const openMouth=mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff2d0,transparent:true,opacity:0.5,depthWrite:false}),0,DOOR_Y+DOOR_H*0.5,DOOR_Z-0.05,DOOR_W*0.5,DOOR_H*0.48,0.35);
  openMouth.visible=false;g.add(openMouth);CONCH.openMouth=openMouth;
  // --- collision proxies (simple boxes; ridges stay decorative) ---
  // Removable front door — matches visible closed plate
  const doorSolid=addSolid(cx,DOOR_Y,cz+DOOR_Z,DOOR_W,DOOR_H,DOOR_D,0x5a3020,{surf:'stone'});
  doorSolid.mesh.visible=false;CONCH.doorSolid=doorSolid;
  // Always-solid mouth flanks + lintel (remain after open)
  addConchShellSolid(cx-(DOOR_W*0.5+0.95),0,cz+DOOR_Z,1.7,4.6,1.2);
  addConchShellSolid(cx+(DOOR_W*0.5+0.95),0,cz+DOOR_Z,1.7,4.6,1.2);
  addConchShellSolid(cx,DOOR_Y+DOOR_H,cz+DOOR_Z,DOOR_W+2.8,1.3,1.15);
  // Side shell walls (cover the visible left/right spiral body)
  addConchShellSolid(cx-4.3,0,cz-0.8,3.0,8.0,11.5);
  addConchShellSolid(cx+4.3,0,cz-0.8,3.0,8.0,11.5);
  // Rear / stern shell
  addConchShellSolid(cx,0,cz-6.0,9.2,9.0,3.2);
  // Upper shell cap
  addConchShellSolid(cx,6.6,cz-1.0,8.0,2.4,10.5);
  // Floor strip inside so the player can rest after swimming in
  addSolid(cx,0,cz+0.6,3.4,0.35,7.2,0xe8b890,{surf:'stone'});
  // spiral lights (dim when closed, bright when open)
  for(let i=0;i<8;i++){
    const t=i/7,y=1.4+t*4.8,z=3.0-t*7.5;
    const m=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe39a,transparent:true,opacity:0.08,depthWrite:false}));
    m.position.set((i%2?0.5:-0.5),y,z);m.scale.setScalar(0.35+t*0.15);g.add(m);
    CONCH.spiralLights.push({m,ph:i*0.7});
  }
  const shellGlow=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshBasicMaterial({color:0xffd28a,transparent:true,opacity:0.04,depthWrite:false}));
  shellGlow.position.set(-1.8,6.5,-1.5);shellGlow.scale.set(8.5,8.5,9.5);g.add(shellGlow);CONCH.shellGlow=shellGlow;
  const interiorGlow=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0.04,depthWrite:false}));
  interiorGlow.position.set(0,2.2,0.2);interiorGlow.scale.set(2.6,2.2,3.2);g.add(interiorGlow);CONCH.interiorGlow=interiorGlow;
  // Finish trigger deep inside — past the doorway plane, not the mouth lip
  CONCH.trigger={x:cx,y:2.0,z:cz-1.6,hx:1.5,hy:2.0,hz:1.35};
  CONCH.interior={x0:cx-2.2,x1:cx+2.2,z0:cz-4.5,z1:cz+DOOR_Z-0.6,yMax:6.2};
  const rainbow=buildRainbow(cx,cz);
  rainbow.position.set(cx,18,cz);rainbow.scale.setScalar(0.18);rainbow.visible=false;CONCH.rainbow=rainbow;
  CONCH.g=g;
  registerFinish({
    x:cx,z:cz,top:10,
    onAllAwake(){openConch();},
    onWin(){AU.layers=Math.max(AU.layers,4);if(CONCH.rainbow)CONCH.rainbow.visible=true;},
    update(dt,winT){updateConch(dt,winT);}
  });
  return CONCH;
}
window.__CONCH=()=>CONCH;
window.__inConchInterior=inConchInterior;
window.__TEST={
  addClam:(x,y,z,r)=>{addClam(x,y,z,r);return clams[clams.length-1];},
  addShark:(x,y,z,n)=>{addShark(x,y,z,n);return sharks[sharks.length-1];},
  addFishSchool:(x,y,z,n)=>{addFishSchool(x,y,z,n);return fish.slice(-n);},
  addNoteFish:(x,y,z)=>{addNoteFish(x,y,z);return fish[fish.length-1];},
  addSpikefish:(x1,y1,z1,x2,y2,z2,n,r)=>{addSpikefish(x1,y1,z1,x2,y2,z2,n,r);return spikefish[spikefish.length-1];},
  loadLevel:l=>loadLevel(typeof l==='number'?LEVELS[l]:l)
};
