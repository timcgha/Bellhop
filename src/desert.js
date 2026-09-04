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
    try{new THREE.TextureLoader().load(DESERT_SAND_URL,t=>{desertSandTexture=t;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,84);t.encoding=THREE.sRGBEncoding;for(const mm of desertSandMaterials){mm.map=t;mm.needsUpdate=true;}},undefined,()=>{desertSandLoading=false;});}catch(e){desertSandLoading=false;}
  }
  if(desertSandTexture){m.map=desertSandTexture;m.needsUpdate=true;}
  return m;
}
function beginDesertLevel(){
  if(landGround)landGround.visible=false;if(peakGround)peakGround.visible=false;if(underwaterGroup)underwaterGroup.visible=false;
  scene.background=new THREE.Color(0xffc36f);scene.fog=new THREE.Fog(0xffc36f,48,154);
  if(!desertGroup){desertGroup=new THREE.Group();desertGroup.name='desertGround';scene.add(desertGroup);}
  desertGroup.visible=true;removeChildren(desertGroup);
  // Level 5 is now a genuine journey rather than a short demo. Keep one continuous
  // desert floor under the authored route and the post-portal oasis tableau.
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(44,560),desertMat());floor.rotation.x=-Math.PI/2;floor.position.set(0,-0.025,-190);desertGroup.add(floor);
  const edgeMat=lam(0xd88f45);
  for(const q of[
    [-25,-15,10,1.0,28],[25,-42,11,1.1,38],[-26,-86,13,1.2,42],[26,-108,12,1.15,34],
    [-26,-156,12,1.1,38],[26,-205,13,1.2,44],[-26,-258,12,1.1,40],[26,-312,13,1.2,44],
    [-26,-370,12,1.15,38],[26,-430,13,1.15,42]
  ]){
    const d=mesh(SPH,edgeMat,q[0],q[3]*0.45,q[1],q[2],q[3],q[4]);desertGroup.add(d);
  }
  // Broad, non-colliding background mesas frame the route without becoming walls.
  for(const q of[
    [-15,-88,3.8],[15,-112,3.3],[-17,-150,2.8],[16,18,2.4],
    [16,-194,3.2],[-17,-242,3.6],[15,-288,3.1],[-16,-322,3.5],[17,-414,3.0]
  ]){
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
  // Pling's movement/yaw convention treats local +Z as forward. Author the camel's
  // head on that same axis so the nose, rider and velocity all agree in every turn.
  const neck=new THREE.Group();neck.position.set(0,1.5,0.34);neck.rotation.x=0.25;neck.add(mesh(CYL,fur,0,0.5,0,0.22,1.3,0.22));neck.add(mesh(SPH,fur,0,1.15,0.02,0.36,0.28,0.32));neck.add(mesh(SPH,dark,-0.13,1.2,0.27,0.05));neck.add(mesh(SPH,dark,0.13,1.2,0.27,0.05));g.add(neck);
  const seat=mesh(BOXG,saddle,0,1.72,0.08,0.9,0.18,0.62);g.add(seat);g.add(mesh(BOXG,trim,0,1.82,0.08,0.98,0.04,0.7));
  // Small rear roll remains behind the now-correct +Z head.
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
  const grass=lam(0x4ea946),grassLight=lam(0x78ca58),grassDeep=lam(0x2f8b3e);
  const water=new THREE.MeshBasicMaterial({color:0x35c9e8,transparent:true,opacity:0.92}),palm=lam(0x6a4a28),leaf=lam(0x2f9b45),leafLight=lam(0x55ba52);
  // Layered green mounds create an immediate dry-desert → paradise contrast without
  // raising foliage into the victory camera sightline.
  const mounds=[
    [0,0.10,0,13.6,0.46,9.4,grass],
    [-6.0,0.15,-1.0,7.6,0.28,5.2,grassLight],
    [5.4,0.14,-1.8,7.0,0.25,4.8,grassDeep],
    [-1.8,0.13,-5.1,6.4,0.24,3.5,grassLight],
    [2.0,0.12,4.4,5.4,0.22,2.8,grass]
  ];
  for(const m of mounds)g.add(mesh(SPH,m[6],m[0],m[1],m[2],m[3],m[4],m[5]));
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(5.15,5.45,0.09,36),water);pool.position.set(0,0.24,0);g.add(pool);

  const palmAngles=[0.10,0.72,2.18,2.72,3.28,3.88,4.48,5.10,5.72];
  for(let i=0;i<palmAngles.length;i++){const a=palmAngles[i],r=7.4+(i%2)*0.7;const px=Math.cos(a)*r,pz=Math.sin(a)*r*0.65,h=3.8+(i%3)*0.5;g.add(mesh(CYL,palm,px,h*0.5,pz,0.16,h,0.16));for(let j=0;j<6;j++){const fr=mesh(CONE,j%2?leaf:leafLight,px,h,pz,0.5,1.95,0.18);fr.rotation.z=(j/6*TAU);fr.rotation.y=j/6*TAU;g.add(fr);}}

  const shrubs=[];
  for(let i=0;i<18;i++){const a=i/18*TAU+0.12,r=6.1+(i%3)*1.25,px=Math.cos(a)*r,pz=Math.sin(a)*r*0.63;if(Math.abs(px)<2.1&&pz>2.8)continue;const s=mesh(SPH,i%3===0?grassDeep:grass,px,0.42+(i%2)*0.08,pz,0.75+(i%2)*0.24,0.38,0.62+(i%3)*0.12);g.add(s);shrubs.push(s);}

  const reeds=[];
  for(let i=0;i<18;i++){const a=i/18*TAU+0.08,r=5.45,px=Math.cos(a)*r,pz=Math.sin(a)*r,stem=mesh(CYL,lam(0x5e9e3d),px,0.52,pz,0.035,0.66+(i%3)*0.11,0.035);stem.rotation.z=(i%2?-0.08:0.08);g.add(stem);reeds.push(stem);}

  const flowers=[];
  const flowerCols=[0xff8c6b,0xf3c75e,0xff6fae,0x8ad7ff,0xffffff];
  for(let i=0;i<32;i++){const a=(i*2.39996)%TAU,r=rand(3.8,10.4),f=mesh(SPH,lam(flowerCols[i%flowerCols.length]),Math.cos(a)*r,0.4+(i%3)*0.03,Math.sin(a)*r*0.62,0.12+(i%2)*0.03,0.11,0.12+(i%2)*0.03);g.add(f);flowers.push(f);}

  const stones=[];
  for(let i=0;i<14;i++){const a=i/14*TAU+0.18,r=5.65+(i%2)*0.22,s=mesh(SPH,lam(i%2?0xb89b6f:0xd2b987),Math.cos(a)*r,0.3,Math.sin(a)*r,0.28+(i%3)*0.06,0.13,0.22+(i%2)*0.05);g.add(s);stones.push(s);}

  const sparkles=[];
  for(let i=0;i<12;i++){const a=i/12*TAU+0.25,r=2.4+(i%4)*1.65,sy=1.0+(i%3)*0.72,s=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:i%3===0?0xfff2a6:0xd8ffe0,transparent:true,opacity:0.58,depthWrite:false}));s.position.set(Math.cos(a)*r,sy,Math.sin(a)*r*0.7);s.scale.setScalar(0.045+(i%2)*0.018);s.userData.baseY=sy;s.userData.ph=i*0.73;g.add(s);sparkles.push(s);}

  const portal=new THREE.Group();portal.position.set(0,0.4,8);const halo=new THREE.Mesh(new THREE.TorusGeometry(2.25,0.24,10,36),new THREE.MeshBasicMaterial({color:0xffd264,transparent:true,opacity:0.82}));halo.rotation.x=Math.PI/2;portal.add(halo);portal.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffc05a,transparent:true,opacity:0.34}),0,0.28,0,1.9,0.22,1.9));portal.visible=false;desertGroup.add(portal);
  if(DESERT){DESERT.oasis={x:ox,y:oy,z:oz,g,pool,portalHalo:halo,sparkles,lushness:{grassMounds:mounds.length,palms:palmAngles.length,shrubs:shrubs.length,reeds:reeds.length,flowers:flowers.length,stones:stones.length,sparkles:sparkles.length}};DESERT.oasisGroup=g;DESERT.portal=portal;}
  registerFinish({x:ox,z:oz,top:oy+5.2,winMsg:'You found the green oasis!',onAllAwake(){},onWin(){if(DESERT&&DESERT.oasisGroup)DESERT.oasisGroup.visible=true;},update(dt,winT){updateOasisCelebration(dt,winT);},camHold(dt){oasisCameraHold(dt);}});
  return g;
}
function updateOasisCelebration(dt,winT){
  if(!DESERT||!DESERT.oasis||!DESERT.oasisGroup||!DESERT.oasisGroup.visible)return;const o=DESERT.oasis;if(o.portalHalo){o.portalHalo.rotation.z+=dt*0.8;if(o.portalHalo.material)o.portalHalo.material.opacity=0.58+Math.sin(time*3)*0.22;}
  if(o.pool&&o.pool.material)o.pool.material.opacity=0.78+Math.sin(time*2)*0.10;
  if(o.sparkles)for(let i=0;i<o.sparkles.length;i++){const s=o.sparkles[i],ph=s.userData.ph||0;s.position.y=(s.userData.baseY||1)+Math.sin(time*1.8+ph)*0.16;if(s.material)s.material.opacity=0.38+Math.sin(time*2.4+ph)*0.22;}
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
  if(!DESERT||!DESERT.finish||DESERT.finish.phase==='oasis')return false;const f=DESERT.finish,q=f.q;const px=P.pos.x,py=P.pos.y,pz=P.pos.z;CAM.look.x=damp(CAM.look.x,px,10,dt);CAM.look.y=damp(CAM.look.y,py+0.5,10,dt);CAM.look.z=damp(CAM.look.z,pz-0.6,10,dt);CAM.pos.x=damp(CAM.pos.x,px+0.3,8,dt);CAM.pos.y=damp(CAM.pos.y,py+3.2,8,dt);CAM.pos.z=damp(CAM.pos.z,pz+7.0,8,dt);CAM.yaw=0;CAM.pitch=0.22;CAM.boomDist=7;CAM.targetDist=7;CAM.mode='sandPortal';CAM.collisionPulled=false;CAM.effectiveDist=Math.hypot(CAM.pos.x-CAM.look.x,CAM.pos.y-CAM.look.y,CAM.pos.z-CAM.look.z);return true;
}
function updateDesertWorld(dt){
  if(!isDesertLevel())return;updateCamels(dt);updateLizards(dt);updateQuicksandVisuals(dt);
  if(!DESERT||DESERT.finish||P.quicksandRecT>0||P.dead||won)return;
  for(const q of quicksands){if(q.role==='final'){if(finalQuicksandReady(q))beginFinalQuicksand(q);}else if(q.active&&inQuicksand(q,P.pos.x,P.pos.z)&&P.pos.y<q.y+0.55){beginQuicksandRecovery();break;}}
}
window.__DESERT={isDesertLevel,get camels(){return camels;},get cacti(){return cacti;},get lizards(){return lizards;},get quicksands(){return quicksands;},get state(){return DESERT;},nearbyCamel,mountCamel,dismountCamel,beginFinalQuicksand,playerInOrdinaryQuicksand};
