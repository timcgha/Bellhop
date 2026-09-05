// Level 6 post-playtest polish: stronger snowmen, spin combat, steerable sled, festive finale.
const WINTER_SNOWMAN_CHASE_SPEED=2.35;
const WINTER_SLED_STEER_SPEED=5.2;

// Preserve the existing snowman hit effects while allowing the attack source to be recorded.
const _winterPlaytestBaseHitSnowman=hitSnowman;
hitSnowman=function(e,damage,source){
  const wasAlive=!!(e&&e.alive),hit=_winterPlaytestBaseHitSnowman(e,damage);
  if(hit&&e){e.lastHitBy=source||'snowball';if(wasAlive&&!e.alive)e.defeatedBy=source||'snowball';}
  return hit;
};

// Snowmen now close distance noticeably faster, while remaining far slower than Pling's run speed.
updateSnowmen=function(dt){
  for(const e of snowmen){if(!e.alive)continue;e.hurtT=Math.max(0,e.hurtT-dt);e.spinHitT=Math.max(0,(e.spinHitT||0)-dt);const dx=P.pos.x-e.x,dz=P.pos.z-e.z,d=Math.hypot(dx,dz)||1;
    if(!P.dead&&!P.sled&&d<8.5){const speed=e.hurtT>0?0:WINTER_SNOWMAN_CHASE_SPEED;e.x+=dx/d*speed*dt;e.z+=dz/d*speed*dt;e.chasing=true;}
    else{e.x=e.hx+Math.sin(time*0.45+e.ph)*1.1;e.z=e.hz+Math.cos(time*0.38+e.ph)*0.65;e.chasing=false;}
    e.y=groundHeightAt(e.x,e.z);e.g.position.set(e.x,e.y+Math.sin(time*3+e.ph)*0.025,e.z);e.g.rotation.y=Math.atan2(P.pos.x-e.x,P.pos.z-e.z);
    if(!P.dead&&!P.sled&&Math.hypot(P.pos.x-e.x,P.pos.z-e.z)<1.05&&Math.abs(P.pos.y-e.y)<2.3)hurtPlayer(P.pos.x-e.x,P.pos.z-e.z,0xbfeeff);
  }
};

// Bellhop's normal Y/K spin now damages a nearby live snowman once per legitimate spin contact.
const _winterPlaytestBaseDoBonk=doBonk;
doBonk=function(){
  _winterPlaytestBaseDoBonk();
  if(!isWinterLevel()||!WINTER||P.dead||won||P.sled)return;
  let hit=false;
  for(const e of snowmen){
    if(!e.alive||(e.spinHitT||0)>0)continue;
    if(Math.hypot(e.x-P.pos.x,e.z-P.pos.z)>BONKR||Math.abs(e.y-P.pos.y)>1.5)continue;
    e.spinHitT=0.45;hitSnowman(e,1,'spin');hit=true;
  }
  if(hit)rumble(70,0.42,0.2);
};

function winterSledSteerLimit(){
  const hill=WINTER&&WINTER.level&&WINTER.level.winter&&WINTER.level.winter.hill;
  return Math.max(2,((hill&&hill.width)||15)/2-1.4);
}

// Keep the timed downhill lifecycle, adding bounded steering through the shared movement axis.
updateSled=function(dt){
  const s=WINTER&&WINTER.sled;if(!s)return;
  if(s.phase==='top'){
    s.steerLimit=winterSledSteerLimit();s.steerOffset=0;s.steerV=0;s.g.position.set(s.x,s.y,s.z);return;
  }
  if(s.phase==='sliding'){
    s.t+=dt;s.progress=clamp(s.t/s.duration,0,1);const p=smooth(s.progress);
    s.steerLimit=winterSledSteerLimit();
    const baseline=s.startX+Math.sin(p*Math.PI*2.15)*0.9*Math.sin(p*Math.PI);
    const input=clamp(IN.mx||0,-1,1);
    s.steerV=damp(s.steerV||0,input*WINTER_SLED_STEER_SPEED,8,dt);
    s.steerOffset=clamp((s.steerOffset||0)+s.steerV*dt,-s.steerLimit,s.steerLimit);
    s.x=clamp(baseline+s.steerOffset,-s.steerLimit,s.steerLimit);s.steerOffset=s.x-baseline;
    s.z=s.startZ+(s.endZ-s.startZ)*p;s.y=Math.max(0,s.startY*(1-p));
    s.g.position.set(s.x,s.y,s.z);s.g.rotation.z=-input*0.09-Math.sin(p*Math.PI*2.15)*0.035;s.g.rotation.x=0.055;
    if(P.sled===s){P.pos.set(s.x,s.y+0.58,s.z);P.vel.set(s.steerV,0,(s.endZ-s.startZ)/s.duration);P.grounded=true;P.yaw=Math.PI;}
    if(s.progress>=1){s.phase='bottom';s.completed=true;s.y=0;s.z=s.endZ;s.steerV=0;s.g.position.set(s.x,s.y,s.z);s.g.rotation.set(0,0,0);if(P.sled===s){P.pos.set(s.x,0.58,s.z);P.vel.set(0,0,0);P.grounded=true;}showToast('Bottom! Press B to hop out.');}
  }else if(s.phase==='bottom'&&P.sled===s){P.pos.set(s.x,0.58,s.z);P.vel.set(0,0,0);P.grounded=true;}
};

// Same finale tree, now with larger bright bulbs, ornaments, garland, stronger star, and presents.
buildChristmasTree=function(x,y,z,scale){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale||1);const green=pho(0x17663c,35,0x4bb86f),snow=lam(0xf4fcff),trunk=lam(0x74482f);
  g.add(mesh(CYL,trunk,0,1.35,0,0.5,2.7,0.5));
  [[2.6,4.5,3.3],[4.7,3.8,2.8],[6.5,3.0,2.15],[8.0,2.1,1.5]].forEach(q=>{g.add(mesh(CONE,green,0,q[0],0,q[1],q[2],q[1]));g.add(mesh(CONE,snow,0,q[0]+0.16,0,q[1]*0.82,q[2]*0.22,q[1]*0.82));});

  const colors=[0xff4058,0xffd329,0x39d9ff,0x75f35f,0xd96cff,0xff8d35],lights=[];
  for(let i=0;i<42;i++){
    const yv=2.15+(i%12)*0.5,rad=Math.max(0.62,3.25-yv*0.26),a=i*2.399;
    const m=mesh(SPH,new THREE.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:0.95}),Math.cos(a)*rad,yv,Math.sin(a)*rad,0.17);
    m.userData.bulbScale=0.17;g.add(m);lights.push(m);
  }

  const ornamentColors=[0xff5b68,0x5ed7ff,0xffd34d,0xb176ff,0x7ee36b],ornaments=[];
  for(let i=0;i<20;i++){
    const yv=2.5+(i%10)*0.58,rad=Math.max(0.7,2.85-yv*0.23),a=0.7+i*2.05;
    const m=mesh(SPH,pho(ornamentColors[i%ornamentColors.length],85,0xffffff),Math.cos(a)*rad,yv,Math.sin(a)*rad,0.2+(i%3)*0.025);g.add(m);ornaments.push(m);
  }

  const garlands=[];[[3.15,2.55],[4.65,2.15],[6.05,1.7]].forEach((q,i)=>{
    const m=new THREE.Mesh(new THREE.TorusGeometry(q[1],0.055,7,36),new THREE.MeshBasicMaterial({color:i%2?0xffe067:0xfff2a0}));m.rotation.x=Math.PI/2;m.position.y=q[0];g.add(m);garlands.push(m);
  });

  const star=new THREE.Group();star.position.set(0,9.5,0);const starMat=pho(0xffdf45,150,0xffffcc);
  star.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff39a,transparent:true,opacity:0.38}),0,0,0,0.52));
  star.add(mesh(SPH,starMat,0,0,0,0.28));
  for(let i=0;i<10;i++){const a=i*TAU/10,ray=mesh(CONE,starMat,Math.cos(a)*0.42,Math.sin(a)*0.42,0,0.15,i%2?0.62:0.82,0.15);ray.rotation.z=a-Math.PI/2;star.add(ray);}g.add(star);

  const presents=[],giftColors=[0xe94b5f,0x3fa7df,0x7fbf4d,0x9a61d2,0xf29f3d,0xe84f9d,0x36b8a0,0xf4cf4c];
  const giftLayout=[[-2.4,0.42,-0.5,1.25,0.8,1.0],[-1.05,0.32,1.25,0.95,0.62,0.8],[0.35,0.48,-1.5,1.1,0.92,1.1],[1.7,0.37,0.9,0.9,0.7,0.9],[2.6,0.3,-0.15,0.8,0.58,0.72],[-2.7,0.28,1.4,0.75,0.54,0.7],[0.9,0.27,1.9,0.72,0.52,0.68],[2.15,0.28,-1.7,0.78,0.55,0.72]];
  giftLayout.forEach((q,i)=>{
    const pg=new THREE.Group();pg.position.set(q[0],q[1],q[2]);const boxCol=giftColors[i%giftColors.length],ribbonCol=i%2?0xfff2a0:0xffffff;
    pg.add(mesh(BOXG,pho(boxCol,55,0xffffff),0,0,0,q[3],q[4],q[5]));
    pg.add(mesh(BOXG,lam(ribbonCol),0,0,0,q[3]*0.18,q[4]*1.04,q[5]*1.04));
    pg.add(mesh(BOXG,lam(ribbonCol),0,0,0,q[3]*1.04,q[4]*1.04,q[5]*0.18));
    pg.add(mesh(SPH,lam(ribbonCol),-0.15,q[4]*0.62,0,0.16,0.1,0.12));pg.add(mesh(SPH,lam(ribbonCol),0.15,q[4]*0.62,0,0.16,0.1,0.12));
    g.add(pg);presents.push(pg);
  });

  winterAdd(g);return {g,x,y,z,scale:scale||1,lights,star,ornaments,garlands,presents,brightLights:true,lightRadius:0.17,party:false};
};

// Keep the normal FINISH lifecycle but strengthen light animation on the polished tree.
const _winterPlaytestBaseRegisterChristmasFinish=registerChristmasFinish;
registerChristmasFinish=function(cfg){
  _winterPlaytestBaseRegisterChristmasFinish(cfg);
  const baseUpdate=FINISH.update;
  FINISH.update=function(dt,t){
    baseUpdate(dt,t);const tree=WINTER&&WINTER.tree;if(!tree)return;
    tree.lights.forEach((m,i)=>{const pulse=0.86+0.14*Math.sin(time*6.2+i*0.73);m.material.transparent=true;m.material.opacity=pulse;const b=(m.userData&&m.userData.bulbScale)||tree.lightRadius||0.17;m.scale.setScalar(b*(0.96+0.12*pulse));});
  };
};

if(window.__WINTER){
  window.__WINTER.hitSnowman=hitSnowman;
  window.__WINTER.chaseSpeed=WINTER_SNOWMAN_CHASE_SPEED;
  window.__WINTER.sledSteerSpeed=WINTER_SLED_STEER_SPEED;
  window.__WINTER.sledSteerLimit=winterSledSteerLimit;
}
