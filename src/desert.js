// Level 5 — bright desert journey: camel riding, lizard rewards, quicksand, and oasis finish.
const camels=[],cacti=[],lizards=[],quicksands=[];
let desertGroup=null,desertSandTexture=null,desertSandLoading=false,DESERT=null;
const desertSandMaterials=[];
const DESERT_SAND_URL='https://files.manuscdn.com/user_upload_by_module/session_file/310519663940279136/ArEOdrOdqLrUPnrZ.png';

function isDesertLevel(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.desertAtmosphere);}
function removeChildren(g){if(!g)return;while(g.children&&g.children.length)g.remove(g.children[0]);}
function desertMat(){
  const m=lam(0xf0ba57);
  desertSandMaterials.push(m);
  // Keep the warm material visible while the optional CDN texture loads. A failed
  // texture request must never turn the entire child-friendly route black.
  if(!desertSandTexture&&!desertSandLoading&&THREE.TextureLoader){
    desertSandLoading=true;
    try{new THREE.TextureLoader().load(DESERT_SAND_URL,t=>{desertSandTexture=t;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,420);t.encoding=THREE.sRGBEncoding;for(const mm of desertSandMaterials){mm.map=t;mm.needsUpdate=true;}},undefined,()=>{desertSandLoading=false;});}catch(e){desertSandLoading=false;}
  }
  if(desertSandTexture){m.map=desertSandTexture;m.needsUpdate=true;}
  return m;
}
function beginDesertLevel(){
  if(landGround)landGround.visible=false;if(peakGround)peakGround.visible=false;if(underwaterGroup)underwaterGroup.visible=false;
  scene.background=new THREE.Color(0xffc36f);scene.fog=new THREE.Fog(0xffc36f,48,155);
  if(!desertGroup){desertGroup=new THREE.Group();desertGroup.name='desertGround';scene.add(desertGroup);}
  desertGroup.visible=true;removeChildren(desertGroup);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(44,900),desertMat());floor.rotation.x=-Math.PI/2;floor.position.set(0,-0.025,-400);desertGroup.add(floor);
  const edgeMat=lam(0xd88f45);
  for(const q of[[-25,-15,10,1.0,28],[25,-125,11,1.1,56],[-26,-300,13,1.2,78],[26,-485,12,1.15,78],[-26,-665,12,1.1,76],[26,-790,11,1.0,44]]){
    const d=mesh(SPH,edgeMat,q[0],q[3]*0.45,q[1],q[2],q[3],q[4]);desertGroup.add(d);
  }
  // A few broad, non-colliding background mesas frame the route without cluttering it.
  for(const q of[[-15,-88,3.8],[15,-175,3.3],[-17,-270,3.0],[16,-365,3.5],[-16,-470,3.1],[17,-575,3.6],[-15,-690,3.2],[16,-785,3.4],[16,18,2.4]]){
    const g=new THREE.Group();g.position.set(q[0],0,q[1]);g.add(mesh(CYL,lam(0xc96f45),0,q[2]*0.55,0,q[2]*0.66,q[2]*1.1,q[2]*0.7));g.add(mesh(SPH,lam(0xea9d5a),0,q[2]*1.1,0,q[2]*0.84,q[2]*0.34,q[2]*0.78));desertGroup.add(g);
  }
  DESERT={finish:null,final:null,portal:null,oasis:null,oasisGroup:null,finishCam:false};
}
function hideDesertWorld(){if(desertGroup)desertGroup.visible=false;if(DESERT&&DESERT.oasisGroup)DESERT.oasisGroup.visible=false;}
function clearDesertWorld(){
  dismountCamel(true);camels.length=0;cacti.length=0;lizards.length=0;quicksands.length=0;
  if(desertGroup){removeChildren(desertGroup);desertGroup.visible=false;}
  if(DESERT&&DESERT.oasisGroup){removeChildren(DESERT.oasisGroup);DESERT.oasisGroup.visible=false;scene.remove(DESERT.oasisGroup);}
  DESERT=null;
}

function addDesertDune(x,y,z,r,h){
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(SPH,lam(0xe9aa4c),0,h*0.42,0,r,h*0.78,r*1.15));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffd783,transparent:true,opacity:0.28}),-r*0.16,h*0.68,-r*0.12,r*0.74,h*0.18,r*0.83));
  desertGroup.add(g);return g;
}
function addDesertRamp(x,y,z,w,d,h){
  // Keep every terrace within the ordinary STEP height so Pling and the camel can
  // walk the climb instead of facing a hidden vertical wall before the finale.
  const n=Math.max(5,Math.ceil(h/0.34)),stepH=h/n+0.05,stepD=d/n+0.35;
  const g=new THREE.Group();g.position.set(x,y,z);const mat=lam(0xe3a052);
  for(let i=0;i<n;i++){
    const t=(i+0.5)/n,yy=y+h*i/n,zz=z+d*0.5-t*d;
    addSolid(x,yy,zz,w,stepH,stepD,0xd88a45,{surf:'sand',role:'desertRamp',invisible:true});
    g.add(mesh(BOXG,mat,0,(yy-y)+stepH*0.5,zz-z,w*0.92,stepH,stepD));
  }
  desertGroup.add(g);return g;
}
function addDesertCliff(x,y,z,w,h,d){
  const sol=addSolid(x,y,z,w,h,d,0xbc6c43,{surf:'stone',role:'cliff'});sol.mesh.visible=false;
  const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(BOXG,lam(0xc97848),0,h*0.46,0,w,h*0.92,d));
  g.add(mesh(BOXG,lam(0xf1ba68),0,h+0.07,0,w*0.94,0.13,d*0.94));
  for(let i=0;i<7;i++){const px=-w*0.38+i*(w*0.13);g.add(mesh(SPH,lam(i%2?0xd78952:0xa9573a),px,h*(0.25+(i%3)*0.15),d*0.52,1.15,h*0.18,0.18));}
  desertGroup.add(g);return sol;
}
function addCactus(x,y,z,scale){
  scale=scale||1;const h=2.45*scale;
  const sol=addSolid(x,y,z,0.7*scale,h,0.7*scale,0x397c36,{surf:'stone',role:'cactus',invisible:true});
  const g=new THREE.Group();g.position.set(x,y,z);const green=lam(0x3f8f3b),light=lam(0x64ae47),flower=lam(0xffa13b);
  g.add(mesh(CYL,green,0,h*0.5,0,0.27*scale,h,0.27*scale));g.add(mesh(SPH,light,0,h*0.84,0,0.27*scale,0.16*scale,0.27*scale));
  for(const s of[-1,1]){const arm=new THREE.Group();arm.position.set(s*0.3*scale,h*0.5,0);arm.add(mesh(CYL,green,0,0,0,0.14*scale,0.74*scale,0.14*scale));arm.rotation.z=s*-0.83;g.add(arm);g.add(mesh(SPH,light,s*0.55*scale,h*0.7,0,0.14*scale,0.18*scale,0.14*scale));}
  for(let i=0;i<4;i++){const a=i/4*TAU;g.add(mesh(SPH,flower,Math.cos(a)*0.17*scale,h+0.04,Math.sin(a)*0.17*scale,0.06*scale));}
  desertGroup.add(g);const c={g,sol,x,y,z,scale,h};cacti.push(c);return c;
}
function buildCamel(){
  const g=new THREE.Group(),fur=lam(0xd9a060),dark=lam(0x8a522e),cream=lam(0xf2d18a),saddle=lam(0x2b9bb0),trim=lam(0xf3bb45);
  g.add(mesh(SPH,fur,0,1.16,0,1.0,0.56,0.48));
  for(const sx of[-0.68,0.68])for(const sz of[-0.28,0.28])g.add(mesh(CYL,dark,sx,0.5,sz,0.105,1.0,0.105));
  const neck=new THREE.Group();neck.position.set(0,1.5,0.34);neck.rotation.x=0.25;neck.add(mesh(CYL,fur,0,0.5,0,0.22,1.3,0.22));neck.add(mesh(SPH,fur,0,1.15,0.02,0.36,0.28,0.32));neck.add(mesh(SPH,dark,-0.13,1.2,0.27,0.05));neck.add(mesh(SPH,dark,0.13,1.2,0.27,0.05));g.add(neck);
  const seat=mesh(BOXG,saddle,0,1.72,0.08,0.9,0.18,0.62);g.add(seat);g.add(mesh(BOXG,trim,0,1.82,0.08,0.98,0.04,0.7));
  g.add(mesh(SPH,cream,0,1.66,-0.43,0.22,0.18,0.12));
  g.userData={seat,neck};return g;
}
function addCamel(x,y,z,rideable){
  const g=buildCamel();g.position.set(x,y,z);desertGroup.add(g);const c={g,x,y,z,home:{x,y,z},rideable:rideable!==false,mounted:false,postMountT:0,ph:rand(0,TAU)};camels.push(c);return c;
}
function nearbyCamel(){
  if(!isDesertLevel()||!P||P.dead||won)return null;
  let best=null,bd=2.35;for(const c of camels){if(!c.rideable||c.mounted)continue;const d=Math.hypot(P.pos.x-c.x,P.pos.z-c.z);if(d<bd){best=c;bd=d;}}
  return best;
}
function mountCamel(c){
  if(!c||P.camel||P.dead)return false;
  c.mounted=true;c.postMountT=0;P.camel=c;P.vel.set(0,0,0);P.puffAir=0;endHover();clearLeapBoost();clearGlide();
  SFX.camelMount();showToast('Ride the camel! A jumps. B hops off.');spawnRing(P.pos.x,P.pos.y+0.1,P.pos.z,0x58c6c7,0.35,5,0.45);return true;
}
function dismountCamel(silent){
  if(!P||!P.camel)return false;const c=P.camel;c.mounted=false;c.postMountT=0;c.x=P.pos.x+0.85;c.y=P.pos.y;c.z=P.pos.z;c.g.position.set(c.x,c.y,c.z);P.camel=null;
  if(!silent){SFX.camelMount();showToast('Nice riding!');}return true;
}
function desertHandleJumpAction(){
  if(!isDesertLevel()||!IN.jump||P.dead||won||(DESERT&&DESERT.finish))return false;
  // Once riding, A/Space stays a jump button so the camel can clear traversal gaps.
  if(P.camel)return false;
  const c=nearbyCamel();if(c){mountCamel(c);return true;}return false;
}
function desertHandleDismountAction(){
  // B/J/Shift becomes the short, stable "hop off" action while mounted.
  if(!isDesertLevel()||!IN.b||!P.camel||P.dead||won||(DESERT&&DESERT.finish))return false;
  dismountCamel();return true;
}
function updateCamels(dt){
  for(const c of camels){c.postMountT=Math.max(0,c.postMountT-dt);const bob=Math.sin(time*5+c.ph)*0.055;
    if(c.mounted){c.x=P.pos.x;c.y=P.pos.y;c.z=P.pos.z;c.g.position.set(c.x,c.y+bob,c.z);c.g.rotation.y=P.yaw;}
    else{c.g.position.set(c.x,c.y+bob,c.z);c.g.rotation.y=Math.sin(time*0.5+c.ph)*0.12;}
    if(c.g.userData&&c.g.userData.neck)c.g.userData.neck.rotation.z=Math.sin(time*2.1+c.ph)*0.055;
  }
}

function buildLizard(){
  const g=new THREE.Group(),green=lam(0x6bae43),lime=lam(0x9bd85e),eye=lam(0x20221b);
  g.add(mesh(SPH,green,0,0.18,0,0.35,0.15,0.22));g.add(mesh(SPH,lime,0,0.24,-0.23,0.17,0.13,0.16));
  g.add(mesh(SPH,eye,-0.07,0.31,-0.34,0.045));g.add(mesh(SPH,eye,0.07,0.31,-0.34,0.045));
  const tail=mesh(CONE,green,0,0.15,0.32,0.12,0.65,0.12);tail.rotation.x=Math.PI*0.52;g.add(tail);return g;
}
function addLizard(x,y,z,reward){const g=buildLizard();g.position.set(x,y,z);desertGroup.add(g);const l={g,x,y,z,reward:reward==='note'?'note':'heart',alive:true,ph:rand(0,TAU)};lizards.push(l);return l;}
function hitLizard(l){
  if(!l.alive)return false;l.alive=false;l.g.visible=false;const col=l.reward==='heart'?0xff5a7a:0xffd54a;
  if(l.reward==='heart')addHeart(l.x,l.y+0.7,l.z);else addNote(l.x,l.y+0.75,l.z,false);
  SFX.lizardReward();spawnRing(l.x,l.y+0.15,l.z,col,0.22,3.5,0.35);
  for(let i=0;i<9;i++)spawnP(l.x,l.y+0.3,l.z,rand(-2,2),rand(1,3),rand(-2,2),rand(0.06,0.11),col,0.4,0.35,-4,0.85);
  return true;
}
function updateLizards(dt){
  for(const l of lizards){if(!l.alive)continue;l.g.position.y=l.y+Math.sin(time*5+l.ph)*0.04;l.g.rotation.y=Math.sin(time*1.5+l.ph)*0.28;
    const d=Math.hypot(P.pos.x-l.x,P.pos.z-l.z),spin=P.bonkT>0&&d<1.7,jet=P.jetT>0&&d<0.8&&P.pos.y>l.y+0.35;
    if(!P.dead&&!won&&(spin||jet))hitLizard(l);
  }
}

function makeQuicksandVisual(w,d,final){
  const g=new THREE.Group(),outer=final?0x9a542e:0x855035,inner=final?0xc1773b:0x6b402d;
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(1,1,0.06,28),new THREE.MeshBasicMaterial({color:outer,transparent:true,opacity:0.96}));rim.scale.set(w*0.5,1,d*0.5);rim.position.y=0.025;g.add(rim);
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(0.76,0.82,0.08,28),new THREE.MeshBasicMaterial({color:inner,transparent:true,opacity:0.96}));pool.scale.set(w*0.5,1,d*0.5);pool.position.y=0.07;g.add(pool);
  const rings=[];for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(0.2+i*0.15,0.025,6,28),new THREE.MeshBasicMaterial({color:final?0xffda72:0xd19a5b,transparent:true,opacity:0.42}));ring.rotation.x=Math.PI/2;ring.position.y=0.125+i*0.006;ring.scale.set(w/(1.5+i),1,d/(1.5+i));g.add(ring);rings.push(ring);}return {g,pool,rings};
}
function addQuicksand(x,y,z,w,d,role){
  const final=role==='final';const v=makeQuicksandVisual(w,d,final);v.g.position.set(x,y,z);desertGroup.add(v.g);
  const q={g:v.g,pool:v.pool,rings:v.rings,x,y,z,w,d,role:final?'final':'ordinary',ph:rand(0,TAU),active:true};quicksands.push(q);return q;
}
function addFinalQuicksand(x,y,z,w,d){const q=addQuicksand(x,y,z,w,d,'final');if(DESERT)DESERT.final=q;return q;}
function inQuicksand(q,x,z){return Math.abs(x-q.x)<q.w*0.5&&Math.abs(z-q.z)<q.d*0.5;}
function playerInOrdinaryQuicksand(){if(!isDesertLevel()||!P)return false;return quicksands.some(q=>q.role==='ordinary'&&q.active&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55);}
function beginQuicksandRecovery(){
  if(P.quicksandRecT>0||P.dead||won)return false;dismountCamel(true);P.hp--;P.inv=1.4;P.quicksandRecMax=0.62;P.quicksandRecT=P.quicksandRecMax;P.quicksandRecFrom.copy(P.pos);P.vel.set(0,0,0);P.grounded=false;P.puffAir=0;endHover();clearLeapBoost();clearGlide();P.anchorSettleT=0;
  SFX.quicksand();CAM.shake=Math.max(CAM.shake,0.28);spawnRing(P.pos.x,P.pos.y+0.1,P.pos.z,0xd58a48,0.3,4.2,0.4);updateHUD();
  if(P.hp<=0){P.dead=true;P.deadT=1.8;P.quicksandRecT=0;SFX.deflate();showToast('Out of puff! Back to the last checkpoint…');}
  else showToast('Squelch! Back to the checkpoint.');return true;
}
function updateDesertQuicksandRecovery(dt){
  if(!P.quicksandRecT)return false;P.quicksandRecT-=dt;const dur=P.quicksandRecMax||0.62,k=smooth(clamp(1-Math.max(P.quicksandRecT,0)/dur,0,1));
  P.pos.x=lerp(P.quicksandRecFrom.x,P.safeAnchor.x,k);P.pos.z=lerp(P.quicksandRecFrom.z,P.safeAnchor.z,k);P.pos.y=lerp(P.quicksandRecFrom.y,P.safeAnchor.y,k)-Math.sin(k*Math.PI)*0.38;P.vel.set(0,0,0);P.sqT=0.58;
  if(P.quicksandRecT<=0){P.quicksandRecT=0;P.pos.copy(P.safeAnchor);P.grounded=true;P.lastGround=time;P.surf='sand';P.puff=true;P.sqT=1;}
  return true;
}
function finalQuicksandReady(q){return q&&q.role==='final'&&!P.dead&&!won&&!DESERT.finish&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55;}
function beginFinalQuicksand(q){
  if(!finalQuicksandReady(q))return false;dismountCamel(true);DESERT.finish={phase:'sink',t:0,from:{x:P.pos.x,y:P.pos.y,z:P.pos.z,yaw:P.yaw},q};DESERT.finishCam=true;P.inv=99;P.vel.set(0,0,0);P.grounded=false;P.puffAir=0;endHover();clearLeapBoost();clearGlide();
  if(DESERT.portal)DESERT.portal.visible=true;SFX.quicksand();showToast('The special sand is pulling you in!');CAM.shake=Math.max(CAM.shake,0.38);return true;
}
function updateQuicksandVisuals(dt){
  for(const q of quicksands){const pulse=0.86+Math.sin(time*2.2+q.ph)*0.08;if(q.pool)q.pool.scale.y=pulse;if(q.rings)q.rings.forEach((r,i)=>{r.rotation.z+=dt*(i%2?0.65:-0.45);if(r.material)r.material.opacity=0.26+Math.sin(time*2.6+i+q.ph)*0.16;});}
}

function addDesertMarker(x,y,z,kind){
  const g=new THREE.Group();g.position.set(x,y,z);const post=lam(0x9a5834),sign=lam(0xffd36c);g.add(mesh(CYL,post,0,0.6,0,0.055,1.2,0.055));g.add(mesh(BOXG,sign,0,1.15,0,0.84,0.42,0.08));
  if(kind==='camel')g.add(mesh(SPH,lam(0x58b8be),0,1.15,0.07,0.15));else if(kind==='ride')g.add(mesh(CONE,lam(0x58b8be),0,1.15,0.07,0.16,0.25,0.16));else g.add(mesh(CONE,lam(0xffffff),0,1.28,0.07,0.11,0.24,0.11));desertGroup.add(g);return g;
}
function addOasis(ox,oy,oz){
  const g=new THREE.Group();g.position.set(ox,oy,oz);g.visible=false;scene.add(g);
  const grass=lam(0x43a447),grassBright=lam(0x79c95c),grassDeep=lam(0x2f8740);
  const water=new THREE.MeshBasicMaterial({color:0x45cbea,transparent:true,opacity:0.9}),waterGlow=new THREE.MeshBasicMaterial({color:0xa7f3ff,transparent:true,opacity:0.26});
  const palm=lam(0x6a4a28),leaf=lam(0x2f9140),leafBright=lam(0x58b94e),reed=lam(0x4aa54a),shrub=lam(0x378f45),shrubBright=lam(0x67bd52);
  g.add(mesh(SPH,grass,0,0.1,0,14.5,0.5,10.5));
  g.add(mesh(SPH,grassBright,-5.2,0.17,-1.0,7.2,0.26,5.0));
  g.add(mesh(SPH,grassBright,5.6,0.16,-1.8,6.8,0.24,4.8));
  g.add(mesh(SPH,grassDeep,0,0.14,-5.1,8.4,0.2,3.2));
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.75,0.09,36),water);pool.position.set(0,0.23,0);g.add(pool);
  const shine=new THREE.Mesh(new THREE.CylinderGeometry(4.75,4.95,0.025,36),waterGlow);shine.position.set(-0.25,0.285,-0.15);g.add(shine);
  const palms=[[-8.3,-2.8],[-7.6,4.0],[8.2,-3.0],[7.7,4.2],[-4.4,-6.5],[4.5,-6.4],[-9.1,0.8],[9.0,0.7],[0,-7.4]];
  for(let i=0;i<palms.length;i++){const q=palms[i],px=q[0],pz=q[1],h=3.9+(i%3)*0.52;g.add(mesh(CYL,palm,px,h*0.5,pz,0.16,h,0.16));for(let j=0;j<6;j++){const fr=mesh(CONE,j%2?leafBright:leaf,px,h,pz,0.5,1.95,0.18);fr.rotation.z=j/6*TAU;fr.rotation.y=j/6*TAU;g.add(fr);}}
  const shrubs=[[-10,-3],[-9,3],[-6,6],[-3,-7],[3,-7],[6,6],[9,3],[10,-3],[-7,-5],[7,-5],[-11,0],[11,0],[-4,5],[4,5],[-7,1],[7,1],[-2,-6],[2,-6]];
  for(let i=0;i<shrubs.length;i++){const q=shrubs[i],m=i%2?shrubBright:shrub;g.add(mesh(SPH,m,q[0],0.5+(i%3)*0.08,q[1],0.75+(i%2)*0.2,0.45+(i%3)*0.08,0.7));}
  for(let i=0;i<24;i++){const aa=i/24*TAU,r=5.85+(i%2)*0.18,px=Math.cos(aa)*r,pz=Math.sin(aa)*r*0.82;g.add(mesh(CYL,reed,px,0.52,pz,0.035,0.86+(i%3)*0.12,0.035));}
  const flowerM=[lam(0xffcf5a),lam(0xff8b83),lam(0xf694d7),lam(0xffffff)];
  for(let i=0;i<32;i++){const aa=i*2.399,r=6.2+(i%7)*0.72,px=Math.cos(aa)*r,pz=Math.sin(aa)*r*0.68;if(pz>3.5&&Math.abs(px)<3.2)continue;g.add(mesh(SPH,flowerM[i%flowerM.length],px,0.4,pz,0.14,0.12,0.14));}
  const stoneM=[lam(0xd8c49a),lam(0xbfa77d)];for(let i=0;i<18;i++){const aa=i/18*TAU,r=5.55,px=Math.cos(aa)*r,pz=Math.sin(aa)*r*0.82;g.add(mesh(SPH,stoneM[i%2],px,0.3,pz,0.27,0.14,0.22));}
  const portal=new THREE.Group();portal.position.set(0,0.4,8);const halo=new THREE.Mesh(new THREE.TorusGeometry(2.25,0.24,10,36),new THREE.MeshBasicMaterial({color:0xffd264,transparent:true,opacity:0.82}));halo.rotation.x=Math.PI/2;portal.add(halo);portal.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffc05a,transparent:true,opacity:0.34}),0,0.28,0,1.9,0.22,1.9));portal.visible=false;desertGroup.add(portal);
  if(DESERT){DESERT.oasis={x:ox,y:oy,z:oz,g,pool,waterShine:shine,portalHalo:halo};DESERT.oasisGroup=g;DESERT.portal=portal;}
  registerFinish({x:ox,z:oz,top:oy+5.2,winMsg:'You found the green oasis!',onAllAwake(){},onWin(){if(DESERT&&DESERT.oasisGroup)DESERT.oasisGroup.visible=true;},update(dt,winT){updateOasisCelebration(dt,winT);},camHold(dt){oasisCameraHold(dt);}});
  return g;
}
function updateOasisCelebration(dt,winT){
  if(!DESERT||!DESERT.oasis||!DESERT.oasisGroup||!DESERT.oasisGroup.visible)return;const o=DESERT.oasis;if(o.portalHalo){o.portalHalo.rotation.z+=dt*0.8;if(o.portalHalo.material)o.portalHalo.material.opacity=0.58+Math.sin(time*3)*0.22;}
  if(o.pool&&o.pool.material)o.pool.material.opacity=0.72+Math.sin(time*2)*0.12;
  if(o.waterShine&&o.waterShine.material)o.waterShine.material.opacity=0.18+Math.sin(time*1.7)*0.08;
  if(winT>=0){DESERT.oasisBurstT=(DESERT.oasisBurstT||0)-dt;if(DESERT.oasisBurstT<=0&&winT<14){DESERT.oasisBurstT=0.08;const a=rand(0,TAU),r=rand(1.2,9);spawnP(o.x+Math.cos(a)*r,o.y+rand(0.8,5.5),o.z+Math.sin(a)*r*0.65,rand(-1.2,1.2),rand(0.8,3.2),rand(-1.2,1.2),rand(0.08,0.15),[0xffffff,0x7dd95a,0x4fc9e8,0xffd15a][Math.floor(rand(0,4))],1.2,0.3,-1.6,0.95);}}
}
function oasisCameraHold(dt){
  if(!DESERT||!DESERT.oasis)return;const o=DESERT.oasis;CAM.look.x=damp(CAM.look.x,o.x,8,dt);CAM.look.y=damp(CAM.look.y,o.y+1.65,8,dt);CAM.look.z=damp(CAM.look.z,o.z,8,dt);CAM.pos.x=damp(CAM.pos.x,o.x+0.6,7,dt);CAM.pos.y=damp(CAM.pos.y,o.y+5.3,7,dt);CAM.pos.z=damp(CAM.pos.z,o.z+15.5,7,dt);CAM.yaw=0.03;CAM.pitch=0.26;CAM.boomDist=16;CAM.targetDist=16;CAM.mode='finish';CAM.collisionPulled=false;CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);
}
function updateDesertFinishPlayer(dt){
  if(!isDesertLevel()||!DESERT||!DESERT.finish)return false;const f=DESERT.finish;f.t+=dt;P.vel.set(0,0,0);P.puffAir=0;P.grounded=false;P.sqT=0.58;
  if(f.phase==='sink'){
    const k=clamp(f.t/1.05,0,1);P.pos.set(f.from.x,f.from.y-1.5*k,f.from.z);P.yaw=f.from.yaw+Math.sin(f.t*7)*0.08;
    if(f.t>=1.05){f.phase='portal';f.t=0;SFX.sandPortal();showToast('A sand portal!');}
  }else if(f.phase==='portal'){
    const k=smooth(clamp(f.t/1.25,0,1)),q=f.q;P.pos.set(lerp(q.x,f.q.x,0.5),lerp(q.y-1.5,q.y+1.2,k),lerp(q.z,q.z+0.45,k));P.yaw=f.from.yaw+f.t*1.8;
    if(DESERT.portal){DESERT.portal.position.set(q.x,q.y+0.15,q.z);DESERT.portal.scale.setScalar(0.7+1.6*k);}
    if(f.t>=1.25){f.phase='oasis';const o=DESERT.oasis;DESERT.finishCam=false;if(DESERT.portal)DESERT.portal.visible=false;if(o&&o.g)o.g.visible=true;P.pos.set(o.x,o.y+0.38,o.z+3.3);P.yaw=Math.PI;P.grounded=true;P.puff=true;P.sqT=1;CAM.shake=Math.max(CAM.shake,0.55);triggerWin();}
  }
  return true;
}
function desertFinishCamera(dt){
  if(!DESERT||!DESERT.finish||DESERT.finish.phase==='oasis')return false;const f=DESERT.finish,q=f.q;const px=P.pos.x,py=P.pos.y,pz=P.pos.z;CAM.look.x=damp(CAM.look.x,px,10,dt);CAM.look.y=damp(CAM.look.y,py+0.5,10,dt);CAM.look.z=damp(CAM.look.z,pz-0.6,10,dt);CAM.pos.x=damp(CAM.pos.x,px+0.3,8,dt);CAM.pos.y=damp(CAM.pos.y,py+3.2,8,dt);CAM.pos.z=damp(CAM.pos.z,pz+7.0,8,dt);CAM.yaw=0;CAM.pitch=0.22;CAM.boomDist=7;CAM.targetDist=7;CAM.mode='sandPortal';CAM.collisionPulled=false;CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);return true;}
function updateDesertWorld(dt){
  if(!isDesertLevel())return;updateCamels(dt);updateLizards(dt);updateQuicksandVisuals(dt);
  if(!DESERT||DESERT.finish||P.quicksandRecT>0||P.dead||won)return;
  for(const q of quicksands){if(q.role==='final'){if(finalQuicksandReady(q))beginFinalQuicksand(q);}else if(q.active&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55){beginQuicksandRecovery();break;}}
}
window.__DESERT={isDesertLevel,get camels(){return camels;},get cacti(){return cacti;},get lizards(){return lizards;},get quicksands(){return quicksands;},get state(){return DESERT;},nearbyCamel,mountCamel,dismountCamel,beginFinalQuicksand,playerInOrdinaryQuicksand};
