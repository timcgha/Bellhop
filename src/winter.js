// Level 6 — Snowbound: snowballs, snowmen, reindeer, sled ride, and Christmas-tree finale.
const snowballs=[],snowmen=[],snowTrees=[],reindeer=[],snowflakes=[];
let WINTER=null;

function isWinterLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.winterAtmosphere);}
function clearWinterWorld(){
  snowballs.length=0;snowmen.length=0;snowTrees.length=0;reindeer.length=0;snowflakes.length=0;
  if(P&&P.sled)P.sled=null;
  WINTER=null;
}
function winterAdd(m){return addDecor(m);}
function beginWinterLevel(L){
  if(landGround)landGround.visible=false;
  if(peakGround)peakGround.visible=false;
  if(underwaterGroup)underwaterGroup.visible=false;
  if(typeof hideDesertWorld==='function')hideDesertWorld();
  scene.background=new THREE.Color(0xa9d8ee);scene.fog=new THREE.Fog(0xc8e7f4,54,175);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,535),lam(0xf3fbff));
  floor.rotation.x=-Math.PI/2;floor.position.set(0,0.015,-228);winterAdd(floor);
  // Soft blue-white banks keep the route visually snowy without adding hidden collision.
  for(let z=18;z>-470;z-=34){
    winterAdd(mesh(SPH,lam(0xd8eff8),-18,0.42,z,5.2,0.75,10));
    winterAdd(mesh(SPH,lam(0xe7f6fb),18,0.35,z-12,5.6,0.68,11));
  }
  const flakeMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.82});
  for(let i=0;i<42;i++){
    const m=new THREE.Mesh(SPH,flakeMat.clone());m.scale.setScalar(rand(0.025,0.075));
    m.position.set(rand(-19,19),rand(2,14),rand(-490,35));winterAdd(m);
    snowflakes.push({m,vy:rand(0.45,1.15),drift:rand(-0.2,0.2),ph:rand(0,TAU)});
  }
  WINTER={level:L,power:null,sled:null,tree:null,snowballUnlocked:false,bursts:0,lastBurst:null,party:false,gateToastT:0};
}
function addSnowTree(x,z,scale){
  scale=scale||1;const y=groundHeightAt(x,z);
  const trunk=addSolid(x,y,z,0.62*scale,3.1*scale,0.62*scale,0x6a4a35,{surf:'wood',role:'snowTree',invisible:true});
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x6a4a35),0,1.5*scale,0,0.22*scale,3*scale,0.22*scale));
  const green=lam(0x2f6f57),snow=lam(0xf8fdff);
  [[1.1,2.4,1.75],[2.2,2.0,1.45],[3.2,1.55,1.1],[4.0,1.1,0.78]].forEach(q=>{
    g.add(mesh(CONE,green,0,q[0]*scale,0,q[1]*scale,q[2]*scale,q[1]*scale));
    g.add(mesh(CONE,snow,0,(q[0]+0.13)*scale,0,q[1]*0.84*scale,q[2]*0.24*scale,q[1]*0.84*scale));
  });
  winterAdd(g);const t={g,trunk,x,y,z,scale,snowLayers:4};snowTrees.push(t);return t;
}
function buildSnowman(){
  const g=new THREE.Group(),white=pho(0xf7fcff,35,0xffffff),coal=lam(0x1d2730),orange=lam(0xf08a24),wood=lam(0x705039);
  g.add(mesh(SPH,white,0,0.52,0,0.62));g.add(mesh(SPH,white,0,1.32,0,0.48));g.add(mesh(SPH,white,0,1.96,0,0.36));
  [-0.12,0.12].forEach(x=>g.add(mesh(SPH,coal,x,2.04,0.31,0.045)));
  const nose=mesh(CONE,orange,0,1.93,0.48,0.075,0.42,0.075);nose.rotation.x=Math.PI/2;g.add(nose);
  for(const y of[1.15,1.42,1.68])g.add(mesh(SPH,coal,0,y,0.45,0.045));
  const armL=mesh(CYL,wood,-0.58,1.42,0,0.04,0.72,0.04),armR=mesh(CYL,wood,0.58,1.42,0,0.04,0.72,0.04);armL.rotation.z=-1.05;armR.rotation.z=1.05;g.add(armL);g.add(armR);
  g.userData={body:g.children[0],head:g.children[2],armL,armR};return g;
}
function addSnowman(x,z){
  const y=groundHeightAt(x,z),g=buildSnowman();g.position.set(x,y,z);winterAdd(g);
  const e={g,x,z,y,hx:x,hz:z,hp:2,maxHp:2,alive:true,hurtT:0,ph:rand(0,TAU),defeatedBy:null};snowmen.push(e);return e;
}
function hitSnowman(e,damage){
  if(!e||!e.alive)return false;e.hp-=damage||1;e.hurtT=0.22;
  spawnRing(e.x,e.y+1,e.z,0xdff7ff,0.18,2.6,0.25);
  for(let i=0;i<8;i++)spawnP(e.x,e.y+1+rand(-0.35,0.65),e.z,rand(-2,2),rand(0.5,2.7),rand(-2,2),rand(0.05,0.1),0xffffff,0.35,0.25,-3,0.8);
  if(e.hp<=0){e.alive=false;e.defeatedBy='snowball';e.g.visible=false;spawnRing(e.x,e.y+0.4,e.z,0xbcecff,0.3,4.4,0.45);showToast('Snowman poof!');}
  return true;
}
function buildReindeer(redNosed){
  const g=new THREE.Group(),fur=lam(0x8b603f),dark=lam(0x5d3b28),cream=lam(0xd6b58b),antler=lam(0x6f5944);
  g.add(mesh(SPH,fur,0,1.0,0,0.82,0.46,0.4));
  for(const sx of[-0.5,0.5])for(const sz of[-0.24,0.24])g.add(mesh(CYL,dark,sx,0.48,sz,0.07,0.9,0.07));
  const neck=mesh(CYL,fur,0,1.45,0.22,0.16,0.85,0.16);neck.rotation.x=-0.2;g.add(neck);
  g.add(mesh(SPH,fur,0,1.82,0.35,0.34,0.28,0.31));
  g.add(mesh(SPH,cream,0,1.76,0.62,0.25,0.18,0.18));
  const nose=mesh(SPH,redNosed?pho(0xff2e3f,100,0xff8894):dark,0,1.78,0.79,redNosed?0.105:0.075);g.add(nose);
  [-1,1].forEach(s=>{const a=mesh(CYL,antler,s*0.16,2.17,0.32,0.035,0.55,0.035);a.rotation.z=s*0.36;g.add(a);});
  return {g,nose};
}
function addReindeer(x,z,redNosed){
  const b=buildReindeer(!!redNosed),y=groundHeightAt(x,z);b.g.position.set(x,y,z);winterAdd(b.g);
  const r={g:b.g,nose:b.nose,x,z,y,homeX:x,homeZ:z,redNosed:!!redNosed,ph:rand(0,TAU)};reindeer.push(r);return r;
}
function addSnowPower(x,y,z){
  const g=new THREE.Group(),ice=pho(0xbdeeff,100,0xffffff),white=pho(0xffffff,80,0xffffff);
  g.add(mesh(SPH,ice,0,0,0,0.3));
  for(let i=0;i<6;i++){const a=i*TAU/6;const arm=mesh(BOXG,white,Math.cos(a)*0.25,Math.sin(a)*0.25,0,0.42,0.055,0.055);arm.rotation.z=a;g.add(arm);}
  g.position.set(x,y,z);winterAdd(g);WINTER.power={g,x,y,z,got:false,ph:rand(0,TAU)};return WINTER.power;
}
function snowballBurst(x,y,z){
  if(!WINTER)return;WINTER.bursts++;WINTER.lastBurst={x,y,z,time};spawnRing(x,y,z,0xe9fbff,0.15,2.7,0.28);
  for(let i=0;i<14;i++)spawnP(x,y,z,rand(-3,3),rand(-1,3),rand(-3,3),rand(0.045,0.095),i%3?0xffffff:0xaee8ff,rand(0.25,0.5),0.15,-2.5,0.85);
}
function fireSnowballFromPlayer(){
  if(!isWinterLevel()||!WINTER||!WINTER.snowballUnlocked||P.dead||won||P.sled)return false;
  // Strict one-at-a-time behavior: no spread and no second live projectile.
  if(snowballs.some(s=>s.alive))return false;
  const dx=Math.sin(P.yaw),dz=Math.cos(P.yaw),g=new THREE.Group();
  g.add(mesh(SPH,pho(0xf8fdff,85,0xffffff),0,0,0,0.25));
  for(let i=0;i<5;i++){const a=i*TAU/5;g.add(mesh(SPH,lam(0xc8ecf7),Math.cos(a)*0.18,Math.sin(a)*0.12,Math.sin(a*1.7)*0.12,0.055));}
  const y=P.pos.y+0.78,x=P.pos.x+dx*0.85,z=P.pos.z+dz*0.85;g.position.set(x,y,z);winterAdd(g);
  snowballs.push({g,pos:new THREE.Vector3(x,y,z),vel:new THREE.Vector3(dx*18,0,dz*18),life:2.2,alive:true});
  spawnRing(x,y,z,0xdff8ff,0.08,0.7,0.16);return true;
}
function explodeSnowball(s,e){
  if(!s||!s.alive)return;s.alive=false;s.g.visible=false;snowballBurst(s.pos.x,s.pos.y,s.pos.z);if(e)hitSnowman(e,1);
}
function updateSnowballs(dt){
  for(const s of snowballs){if(!s.alive)continue;s.life-=dt;
    const nx=s.pos.x+s.vel.x*dt,ny=s.pos.y+s.vel.y*dt,nz=s.pos.z+s.vel.z*dt;
    let target=null;for(const e of snowmen){if(!e.alive)continue;if(Math.hypot(nx-e.x,nz-e.z)<0.85&&Math.abs(ny-(e.y+1.15))<1.15){target=e;break;}}
    if(target){s.pos.set(nx,ny,nz);s.g.position.copy(s.pos);explodeSnowball(s,target);continue;}
    if(insideSolid(nx,ny,nz,0.16)||s.life<=0){s.pos.set(nx,ny,nz);s.g.position.copy(s.pos);explodeSnowball(s,null);continue;}
    s.pos.set(nx,ny,nz);s.g.position.copy(s.pos);s.g.rotation.x+=dt*8;s.g.rotation.z+=dt*6;
  }
}
function addWinterHill(cfg){
  const n=cfg.terraces||22,len=Math.abs(cfg.topZ-cfg.startZ),stepD=len/n+0.42,stepRise=cfg.topY/n;
  for(let i=0;i<n;i++){
    const z=cfg.startZ-(i+0.5)*len/n,y=i*stepRise,h=stepRise+0.08;
    addSolid(0,y,z,cfg.width,h,stepD,0xe6f6fb,{surf:'snow',role:'winterHill'});
  }
  const runN=20,runLen=134;
  for(let i=0;i<runN;i++){
    const p=i/(runN-1),z=cfg.topZ-(i+0.5)*runLen/runN,top=cfg.topY*(1-p),next=cfg.topY*(1-Math.min(1,(i+1)/(runN-1)));
    addSolid(0,Math.max(0,next-0.06),z,17,Math.max(0.18,top-next+0.16),runLen/runN+0.5,0xdff3fa,{surf:'snow',role:'sledRun'});
  }
  for(let z=cfg.topZ-6;z>-318;z-=18){winterAdd(mesh(SPH,lam(0xcdeaf5),-9.2,0.55,z,1.8,0.9,8));winterAdd(mesh(SPH,lam(0xcdeaf5),9.2,0.55,z-7,1.8,0.9,8));}
}
function buildSled(){
  const g=new THREE.Group(),red=pho(0xc93644,50,0xff9da6),wood=lam(0x8b5a3c),metal=pho(0xd7e5ee,90,0xffffff);
  g.add(mesh(BOXG,red,0,0.43,0,1.2,0.16,1.65));g.add(mesh(BOXG,wood,0,0.62,0.18,1.0,0.12,0.72));
  [-0.52,0.52].forEach(x=>{g.add(mesh(BOXG,metal,x,0.08,0,0.07,0.08,1.95));const nose=mesh(CYL,metal,x,0.24,-0.92,0.045,0.44,0.045);nose.rotation.x=Math.PI/2.5;g.add(nose);});
  return g;
}
function addSled(cfg){
  const g=buildSled();g.position.set(cfg.x,cfg.y,cfg.z);winterAdd(g);
  WINTER.sled={g,x:cfg.x,y:cfg.y,z:cfg.z,startX:cfg.x,startY:cfg.y,startZ:cfg.z,endZ:cfg.endZ,duration:cfg.duration||8,phase:'top',t:0,mounted:false,completed:false,progress:0};return WINTER.sled;
}
function nearbySled(){
  const s=WINTER&&WINTER.sled;if(!s||s.phase!=='top'||P.dead||won)return null;
  return Math.hypot(P.pos.x-s.x,P.pos.z-s.z)<2.25&&Math.abs(P.pos.y-s.y)<2.1?s:null;
}
function mountSled(s){
  if(!s||P.sled)return false;s.mounted=true;s.phase='sliding';s.t=0;P.sled=s;P.vel.set(0,0,0);P.grounded=true;P.slam=0;P.puffAir=0;endHover();clearLeapBoost();clearGlide();
  showToast('Sled ride! Hold on — B hops out at the bottom.');spawnRing(s.x,s.y+0.1,s.z,0xff6b78,0.3,4,0.4);return true;
}
function dismountSled(){
  const s=P.sled;if(!s||s.phase!=='bottom')return false;s.mounted=false;P.sled=null;P.pos.set(s.x+1.25,0,s.z-1.5);P.vel.set(0,0,-1);P.grounded=true;P.lastGround=time;showToast('Great sledding! Find the Christmas tree.');return true;
}
function winterHandleJumpAction(){
  if(!isWinterLevel()||!IN.jump||P.dead||won||P.sled)return false;const s=nearbySled();if(!s)return false;return mountSled(s);
}
function winterHandleDismountAction(){
  if(!isWinterLevel()||!IN.b||!P.sled)return false;
  if(P.sled.phase==='bottom')dismountSled();else if(WINTER&&WINTER.gateToastT<=0){WINTER.gateToastT=1.4;showToast('Wheee! Hop out when the sled reaches the bottom.');}
  return true;
}
function updateSled(dt){
  const s=WINTER&&WINTER.sled;if(!s)return;
  if(s.phase==='top'){s.g.position.set(s.x,s.y,s.z);return;}
  if(s.phase==='sliding'){
    s.t+=dt;s.progress=clamp(s.t/s.duration,0,1);const p=smooth(s.progress);
    s.x=s.startX+Math.sin(p*Math.PI*2.15)*2.4*(Math.sin(p*Math.PI));s.z=s.startZ+(s.endZ-s.startZ)*p;s.y=Math.max(0,s.startY*(1-p));
    s.g.position.set(s.x,s.y,s.z);s.g.rotation.z=-Math.sin(p*Math.PI*2.15)*0.08;s.g.rotation.x=0.055;
    if(P.sled===s){P.pos.set(s.x,s.y+0.58,s.z);P.vel.set(0,0,(s.endZ-s.startZ)/s.duration);P.grounded=true;P.yaw=Math.PI;}
    if(s.progress>=1){s.phase='bottom';s.completed=true;s.x=0;s.y=0;s.z=s.endZ;s.g.position.set(s.x,s.y,s.z);s.g.rotation.set(0,0,0);if(P.sled===s){P.pos.set(s.x,0.58,s.z);P.vel.set(0,0,0);P.grounded=true;}showToast('Bottom! Press B to hop out.');}
  }else if(s.phase==='bottom'&&P.sled===s){P.pos.set(s.x,0.58,s.z);P.vel.set(0,0,0);P.grounded=true;}
}
function buildChristmasTree(x,y,z,scale){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale||1);const green=pho(0x17663c,35,0x4bb86f),snow=lam(0xf4fcff),trunk=lam(0x74482f);
  g.add(mesh(CYL,trunk,0,1.35,0,0.5,2.7,0.5));
  [[2.6,4.5,3.3],[4.7,3.8,2.8],[6.5,3.0,2.15],[8.0,2.1,1.5]].forEach(q=>{g.add(mesh(CONE,green,0,q[0],0,q[1],q[2],q[1]));g.add(mesh(CONE,snow,0,q[0]+0.16,0,q[1]*0.82,q[2]*0.22,q[1]*0.82));});
  const colors=[0xff4f62,0xffd34d,0x5ed7ff,0x9df06e,0xcf72ff],lights=[];
  for(let i=0;i<30;i++){const yv=2.2+(i%10)*0.62,rad=Math.max(0.6,3.1-yv*0.25),a=i*2.399;const m=mesh(SPH,new THREE.MeshBasicMaterial({color:colors[i%colors.length]}),Math.cos(a)*rad,yv,Math.sin(a)*rad,0.105);g.add(m);lights.push(m);}
  const star=new THREE.Group();star.position.set(0,9.45,0);const starMat=pho(0xffdf45,140,0xffffcc);star.add(mesh(SPH,starMat,0,0,0,0.24));
  for(let i=0;i<5;i++){const a=i*TAU/5,ray=mesh(CONE,starMat,Math.cos(a)*0.38,Math.sin(a)*0.38,0,0.18,0.75,0.18);ray.rotation.z=a-Math.PI/2;star.add(ray);}g.add(star);
  winterAdd(g);return {g,x,y,z,scale:scale||1,lights,star,party:false};
}
function winterReady(){return !!(WINTER&&WINTER.sled&&WINTER.sled.completed&&rescued>=snoozleGoalCount()&&snoozles.every(s=>s.state!=='sleep'));}
function registerChristmasFinish(cfg){
  WINTER.tree=buildChristmasTree(cfg.x,cfg.y,cfg.z,cfg.scale);
  registerFinish({x:cfg.x,z:cfg.z,top:15,
    winMsg:'Winter wonderland saved! Every Snoozle is awake!',
    onAllAwake(){showToast(WINTER.sled&&WINTER.sled.completed?'Everyone is awake — reach the big Christmas tree!':'Everyone is awake — ride the sled, then find the tree!');},
    onWin(){WINTER.party=true;WINTER.tree.party=true;},
    update(dt,t){
      const tree=WINTER&&WINTER.tree;if(!tree)return;tree.lights.forEach((m,i)=>{m.material.opacity=0.65+0.35*Math.sin(time*5+i);m.material.transparent=true;});tree.star.rotation.z+=dt*(t>=0?1.8:0.35);
      if(t>=0&&Math.random()<0.45)spawnP(tree.x+rand(-4,4),rand(2,12),tree.z+rand(-4,4),rand(-0.8,0.8),rand(-0.4,1),rand(-0.8,0.8),rand(0.045,0.09),Math.random()<0.5?0xffffff:0xffdf45,rand(0.5,1),0.15,-1,0.85);
    },
    camHold(dt){const tree=WINTER&&WINTER.tree;if(!tree)return;CAM.mode='finish';CAM.look.x=damp(CAM.look.x,tree.x,5,dt);CAM.look.y=damp(CAM.look.y,5.1,5,dt);CAM.look.z=damp(CAM.look.z,tree.z,5,dt);CAM.pos.x=damp(CAM.pos.x,tree.x+8.5,4,dt);CAM.pos.y=damp(CAM.pos.y,7.0,4,dt);CAM.pos.z=damp(CAM.pos.z,tree.z+14,4,dt);CAM.targetDist=15;CAM.boomDist=15;CAM.collisionPulled=false;}
  });
}
function buildWinterFromLevel(L){
  const w=L.winter||{};addWinterHill(w.hill);
  for(const t of w.snowTrees||[])addSnowTree(t[0],t[1],t[2]);
  for(const e of w.snowmen||[])addSnowman(e[0],e[1]);
  for(const r of w.reindeer||[])addReindeer(r[0],r[1],r[2]);
  addSnowPower(w.power.x,w.power.y,w.power.z);addSled(w.sled);registerChristmasFinish(w.finale);
}
function updateSnowPower(dt){
  const p=WINTER&&WINTER.power;if(!p||p.got)return;p.ph+=dt;p.g.rotation.y+=dt*1.8;p.g.position.y=p.y+Math.sin(time*3+p.ph)*0.08;
  if(Math.hypot(P.pos.x-p.x,P.pos.z-p.z)<1.5&&Math.abs(P.pos.y-p.y)<2){p.got=true;p.g.visible=false;WINTER.snowballUnlocked=true;showToast('Snowball Blaster! B / J shoots one snowball at a time.');updateHUD();spawnRing(p.x,p.y,p.z,0xc8f4ff,0.2,3.2,0.35);}
}
function updateSnowmen(dt){
  for(const e of snowmen){if(!e.alive)continue;e.hurtT=Math.max(0,e.hurtT-dt);const dx=P.pos.x-e.x,dz=P.pos.z-e.z,d=Math.hypot(dx,dz)||1;
    if(!P.dead&&!P.sled&&d<8.5){const speed=e.hurtT>0?0:0.75;e.x+=dx/d*speed*dt;e.z+=dz/d*speed*dt;}
    else{e.x=e.hx+Math.sin(time*0.45+e.ph)*1.1;e.z=e.hz+Math.cos(time*0.38+e.ph)*0.65;}
    e.y=groundHeightAt(e.x,e.z);e.g.position.set(e.x,e.y+Math.sin(time*3+e.ph)*0.025,e.z);e.g.rotation.y=Math.atan2(P.pos.x-e.x,P.pos.z-e.z);
    if(!P.dead&&!P.sled&&Math.hypot(P.pos.x-e.x,P.pos.z-e.z)<1.05&&Math.abs(P.pos.y-e.y)<2.3)hurtPlayer(P.pos.x-e.x,P.pos.z-e.z,0xbfeeff);
  }
}
function updateReindeer(dt){for(const r of reindeer){const a=time*0.28+r.ph;r.g.position.x=r.homeX+Math.sin(a)*1.7;r.g.position.z=r.homeZ+Math.cos(a*0.8)*0.8;r.g.rotation.y=Math.sin(a)*0.35;}}
function updateSnowfall(dt){for(const f of snowflakes){f.m.position.y-=f.vy*dt;f.m.position.x+=Math.sin(time*0.8+f.ph)*f.drift*dt;if(f.m.position.y<0.4)f.m.position.y=rand(9,15);}}
function updateWinterFinish(dt){
  if(!WINTER||won)return;WINTER.gateToastT=Math.max(0,WINTER.gateToastT-dt);const tree=WINTER.tree;if(!tree)return;
  if(Math.hypot(P.pos.x-tree.x,P.pos.z-tree.z)<4.2){
    if(winterReady())triggerWin();
    else if(WINTER.gateToastT<=0){WINTER.gateToastT=1.6;if(!WINTER.sled.completed)showToast('The Christmas tree is ahead — ride the sled first!');else showToast('Wake all '+snoozleGoalCount()+' Snoozles before the celebration!');}
  }
}
function updateWinterWorld(dt){if(!isWinterLevel()||!WINTER)return;updateSnowPower(dt);updateSnowballs(dt);updateSnowmen(dt);updateReindeer(dt);updateSnowfall(dt);updateSled(dt);updateWinterFinish(dt);}

// Small integration hooks keep Level 6 isolated in its own source module while reusing the
// established common level loader, player controls, cleanup, and frame loop.
const _winterClearLevelWorld=clearLevelWorld;
clearLevelWorld=function(){clearWinterWorld();return _winterClearLevelWorld();};
const _winterLoadLevel=loadLevel;
loadLevel=function(L){
  _winterLoadLevel(L);
  if(L&&L.winterAtmosphere){beginWinterLevel(L);FINISH=null;buildWinterFromLevel(L);}
};
LEVELS.push(LEVEL6);
const _winterJumpAction=desertHandleJumpAction;
desertHandleJumpAction=function(){if(winterHandleJumpAction())return true;return _winterJumpAction();};
const _winterDismountAction=desertHandleDismountAction;
desertHandleDismountAction=function(){if(winterHandleDismountAction())return true;return _winterDismountAction();};
const _winterDoGust=doGust;
doGust=function(){_winterDoGust();if(isWinterLevel())fireSnowballFromPlayer();};
const _winterUpdateDesertWorld=updateDesertWorld;
updateDesertWorld=function(dt){_winterUpdateDesertWorld(dt);updateWinterWorld(dt);};

window.__isWinter=isWinterLevel;
window.__WINTER={
  get state(){return WINTER;},get snowballs(){return snowballs;},get snowmen(){return snowmen;},get snowTrees(){return snowTrees;},get reindeer(){return reindeer;},get sled(){return WINTER&&WINTER.sled;},get tree(){return WINTER&&WINTER.tree;},
  fireSnowball:fireSnowballFromPlayer,mountSled,dismountSled,winterReady,hitSnowman
};