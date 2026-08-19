const solids=[],wobblers=[],pinwheels=[],toss=[],notes=[],dust=[],snoozles=[],fans=[],clouds=[],gloops=[],goos=[],puddles=[],hearts=[],crates=[],powers=[],fires=[];
let seenGloop=false,seenCrate=false;
let BOAT=null,WM=null,player=null,shadow=null,RAINBOW=null;
const checks=[];let won=false,winT=0,confT=0;
const POND={x0:-6,x1:6,z0:-33,z1:-25};
function inPond(x,z){return x>POND.x0&&x<POND.x1&&z>POND.z0&&z<POND.z1;}
function groundHeightAt(x,z){return inPond(x,z)?-0.4:0;}
function surfaceHeightAt(x,z,belowY,r){r=r||0.2;let h=groundHeightAt(x,z);for(const s of solids){if(x+r>s.min.x&&x-r<s.max.x&&z+r>s.min.z&&z-r<s.max.z&&s.max.y<=belowY+0.05&&s.max.y>h)h=s.max.y;}return h;}
function insideSolid(x,y,z,m){for(const s of solids){if(x>s.min.x-m&&x<s.max.x+m&&y>s.min.y-m&&y<s.max.y+m&&z>s.min.z-m&&z<s.max.z+m)return true;}return false;}
function addSolid(x,y,z,w,h,d,color,opts){const m=new THREE.Mesh(BOXG,lam(color));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);scene.add(m);
  const s={min:new THREE.Vector3(x-w/2,y,z-d/2),max:new THREE.Vector3(x+w/2,y+h,z+d/2),mesh:m,surf:(opts&&opts.surf)||'wood'};solids.push(s);return s;}

// ground with a hole for the pond
function grassTex(){const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle='#78c65a';g.fillRect(0,0,256,256);
  for(let i=0;i<700;i++){g.fillStyle=Math.random()<0.5?'rgba(255,255,255,0.09)':'rgba(0,70,0,0.11)';const s=rand(4,16);g.fillRect(Math.random()*256,Math.random()*256,s,s*0.6);}
  const tx=new THREE.CanvasTexture(cv);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(0.4,0.4);tx.encoding=THREE.sRGBEncoding;return tx;}
(function buildGround(){
  const shp=new THREE.Shape();shp.moveTo(-48,-28);shp.lineTo(36,-28);shp.lineTo(36,86);shp.lineTo(-48,86);shp.lineTo(-48,-28);
  const hole=new THREE.Path();hole.moveTo(POND.x0,-POND.z1);hole.lineTo(POND.x1,-POND.z1);hole.lineTo(POND.x1,-POND.z0);hole.lineTo(POND.x0,-POND.z0);hole.lineTo(POND.x0,-POND.z1);shp.holes.push(hole);
  const g=new THREE.Mesh(new THREE.ShapeGeometry(shp),new THREE.MeshLambertMaterial({map:grassTex()}));g.rotation.x=-Math.PI/2;scene.add(g);
  const cx=(POND.x0+POND.x1)/2,cz=(POND.z0+POND.z1)/2,w=POND.x1-POND.x0,d=POND.z1-POND.z0,sand=lam(0xd9c08a);
  scene.add(mesh(BOXG,sand,cx,-0.5,cz,w+0.6,0.2,d+0.6));
  scene.add(mesh(BOXG,sand,cx,-0.2,POND.z0-0.15,w+0.6,0.4,0.3));scene.add(mesh(BOXG,sand,cx,-0.2,POND.z1+0.15,w+0.6,0.4,0.3));
  scene.add(mesh(BOXG,sand,POND.x0-0.15,-0.2,cz,0.3,0.4,d+0.6));scene.add(mesh(BOXG,sand,POND.x1+0.15,-0.2,cz,0.3,0.4,d+0.6));
  const water=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:0x4fb4e6,transparent:true,opacity:0.72}));water.rotation.x=-Math.PI/2;water.position.set(cx,-0.08,cz);scene.add(water);
})();

const FLOWERC=[0xff6b81,0xffb347,0xf9f871,0xc084fc,0xff8ac9,0xffffff,0x7ad7ff];
const CUPC=[0xff8a80,0x80d8ff,0xffe57f,0xa5d6a7,0xce93d8,0xffab91];
function addWobbler(x,z,kind){const g=new THREE.Group();const y=groundHeightAt(x,z);g.position.set(x,y,z);
  if(kind==='flower'){const c=FLOWERC[Math.floor(Math.random()*FLOWERC.length)];const h=rand(0.55,0.95);g.add(mesh(CYL,lam(0x4f9a3a),0,h/2,0,0.03,h,0.03));g.add(mesh(SPH,lam(c),0,h,0,0.17,0.12,0.17));g.add(mesh(SPH,lam(0xffe066),0,h+0.06,0,0.07));g.add(mesh(SPH,lam(0x5aa63a),0.12,h*0.4,0,0.14,0.03,0.07));}
  else if(kind==='grass'){for(let i=0;i<3;i++){const b=mesh(CONE,lam(0x6ec24d),rand(-0.1,0.1),0.32,rand(-0.1,0.1),0.06,0.64,0.06);b.rotation.z=rand(-0.25,0.25);b.rotation.x=rand(-0.25,0.25);g.add(b);}}
  else if(kind==='shroom'){g.add(mesh(CYL,lam(0xf3e6c8),0,0.2,0,0.09,0.4,0.09));const cap=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,8,0,TAU,0,Math.PI/2),lam(Math.random()<0.5?0xe74c3c:0xf39c12));cap.position.y=0.36;g.add(cap);g.add(mesh(SPH,lam(0xffffff),0.12,0.5,0.1,0.05,0.03,0.05));}
  else{const h=rand(1,1.5);g.add(mesh(CYL,lam(0x7a9a45),0,h/2,0,0.03,h,0.03));g.add(mesh(CYL,lam(0x6b4a2a),0,h+0.12,0,0.06,0.3,0.06));}
  scene.add(g);wobblers.push({g,x,y,z,tx:0,tz:0,vx:0,vz:0,ph:rand(0,TAU)});}
function addPinwheel(x,z,face){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;g.add(mesh(CYL,lam(0x8a5a2b),0,0.7,0,0.03,1.4,0.03));
  const head=new THREE.Group();head.position.set(0,1.42,0.06);const cols=[0xe74c3c,0xf1c40f,0x3498db,0xffffff];
  for(let i=0;i<4;i++){const pv=new THREE.Group();pv.rotation.z=i*Math.PI/2;pv.add(mesh(BOXG,lam(cols[i]),0.24,0,0,0.38,0.17,0.02));head.add(pv);}
  head.add(mesh(SPH,pho(0xd1a83c,120,0xfff0b8),0,0,0.02,0.06));g.add(head);scene.add(g);pinwheels.push({g,head,x,z,spinVel:1,tick:0});}
function addToss(x,y,z){const m=new THREE.Mesh(CUPG,lam(CUPC[toss.length%CUPC.length]));scene.add(m);const t={m,pos:new THREE.Vector3(x,y,z),vel:new THREE.Vector3(),rest:true,r:0.28,h:0.36};m.position.copy(t.pos);toss.push(t);}
function addCupPyramid(x,z,alongZ){const rows=[[-0.6,0,0.6],[-0.3,0.3],[0]];rows.forEach((r,i)=>r.forEach(o=>addToss(alongZ?x:x+o,i*0.36,alongZ?z+o:z)));}
function addNote(x,y,z,hidden){const g=new THREE.Group();g.position.set(x,y,z);const mat=pho(0xffd54a,100,0xffffff);g.add(mesh(SPH,mat,0,0,0,0.17,0.13,0.17));g.add(mesh(BOXG,mat,0.13,0.28,0,0.05,0.5,0.05));g.add(mesh(BOXG,mat,0.22,0.48,0,0.22,0.06,0.05));g.visible=!hidden;scene.add(g);const n={g,x,y,z,got:false,hidden:!!hidden,ph:rand(0,TAU)};notes.push(n);return n;}
function addDust(x,z){const m=new THREE.Mesh(DUSTG,lam(0xc4ad84));m.position.set(x,0,z);scene.add(m);const n=addNote(x,0.7,z,true);dust.push({m,x,z,amt:1,note:n});}
function buildSnoozle(){const g=new THREE.Group();g.add(mesh(SPH,lam(0xdba86a),0,0.34,0,0.42,0.32,0.36));g.add(mesh(SPH,lam(0xc98f4f),0,0.44,0,0.36,0.22,0.31));
  const leaf=mesh(CONE,lam(0x5aa63a),0.05,0.72,0,0.28,0.2,0.28);leaf.rotation.z=-0.2;g.add(leaf);g.add(mesh(CYL,lam(0x4c7d2c),0.02,0.86,0,0.03,0.12,0.03));
  const closed=new THREE.Group();[-0.13,0.13].forEach(x=>{closed.add(mesh(BOXG,lam(0x3a2a1a),x,0.36,0.34,0.11,0.03,0.02));});g.add(closed);
  const open=new THREE.Group();[-0.13,0.13].forEach(x=>{open.add(mesh(SPH,pho(0xffffff,80),x,0.36,0.33,0.07));open.add(mesh(SPH,lam(0x222222),x,0.36,0.39,0.035));});open.visible=false;g.add(open);
  const mouth=mesh(BOXG,lam(0x8b4a3a),0,0.25,0.35,0.08,0.03,0.02);g.add(mouth);
  [-0.15,0.15].forEach(x=>g.add(mesh(SPH,lam(0x8b6a4a),x,0.06,0.1,0.09,0.06,0.09)));
  g.userData={closed,open,mouth};return g;}
function addSnoozle(x,y,z,home,boat){const g=buildSnoozle();g.position.set(x,y,z);g.rotation.y=rand(0,TAU);scene.add(g);snoozles.push({g,state:'sleep',t:0,zz:rand(0,1),ph:rand(0,TAU),baseY:y,home:{x:home[0],z:home[1]},boat:!!boat,stepT:0,hopT:0});}
function addTree(x,z){addSolid(x,0,z,0.8,3.6,0.8,0x7a4f2b,{surf:'wood'});const c=lam(0x4d9a3a);scene.add(mesh(SPH,c,x,4.2,z,1.9,1.6,1.9));scene.add(mesh(SPH,c,x+0.9,3.6,z-0.4,1.2));scene.add(mesh(SPH,c,x-0.8,3.9,z+0.6,1.1));}
function addFan(x,z,r,top){const g=new THREE.Group();g.position.set(x,0,z);g.add(mesh(CYL,lam(0x4b5563),0,0.15,0,r,0.3,r));const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.08,8,32),pho(0xd1a83c,120,0xfff0b8));ring.rotation.x=Math.PI/2;ring.position.y=0.32;g.add(ring);
  const bl=new THREE.Group();bl.position.y=0.3;for(let i=0;i<3;i++){const b=mesh(BOXG,lam(0x9ca3af),0,0,0,r*1.7,0.04,0.35);b.rotation.y=i*Math.PI/3;bl.add(b);}g.add(bl);scene.add(g);fans.push({x,z,r,top,blades:bl,pt:0});}
function buildWindmill(x,z){const col=addSolid(x,0,z,3.4,6.6,3.4,0xffffff,{surf:'stone'});col.mesh.visible=false;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.75,6.4,18),lam(0xf1e3c2));body.position.set(x,3.2,z);scene.add(body);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(1.55,1.8,18),lam(0xc0392b));cap.position.set(x,7.3,z);scene.add(cap);
  scene.add(mesh(BOXG,lam(0x6b4a2a),x,0.9,z+1.68,1.0,1.8,0.2));scene.add(mesh(BOXG,lam(0x8fd3ff),x,3.6,z+1.5,0.6,0.7,0.2));
  const sails=new THREE.Group();sails.position.set(x,5.6,z+1.85);sails.add(mesh(SPH,pho(0xd1a83c,120,0xfff0b8),0,0,0,0.3));
  for(let i=0;i<4;i++){const a=new THREE.Group();a.rotation.z=i*Math.PI/2;a.add(mesh(BOXG,lam(0x7a4f2b),0,1.9,0,0.16,3.8,0.08));a.add(mesh(BOXG,lam(0xfff5e0),0.42,2.1,0,0.65,2.6,0.03));sails.add(a);}
  scene.add(sails);WM={sails,spin:0.5,party:false,sailX:x,sailZ:z+1.85,x,z};}
function buildBoat(x,z){const g=new THREE.Group();g.add(mesh(BOXG,lam(0x8b5a2b),0,0.15,0,0.9,0.3,1.7));g.add(mesh(BOXG,lam(0xa86b32),0,0.32,0,1.0,0.06,1.8));g.add(mesh(CYL,lam(0x5b3a1a),0,1.0,-0.1,0.04,1.4,0.04));
  g.add(mesh(BOXG,lam(0xffffff),0,1.15,-0.1,0.9,0.9,0.02));g.add(mesh(BOXG,lam(0xe74c3c),0,1.15,-0.1,0.9,0.25,0.021));scene.add(g);g.position.set(x,-0.1,z);
  BOAT={g,pos:new THREE.Vector3(x,0,z),vel:new THREE.Vector3(),yaw:0};}
function addCloud(x,y,z,s){const g=new THREE.Group();const m=lam(0xffffff);g.add(mesh(SPH,m,0,0,0,1.6*s,1.0*s,1.2*s));g.add(mesh(SPH,m,1.4*s,0.2*s,0,1.1*s,0.8*s,1.0*s));g.add(mesh(SPH,m,-1.3*s,0.1*s,0.2,1.0*s,0.7*s,0.9*s));g.position.set(x,y,z);scene.add(g);clouds.push({g,sp:rand(0.3,0.8)});}

const GOOC=0x8fe36b,GOOGRAV=-20;
const GTYPE={
  small:{size:0.72,hp:1,col:0x8fe36b,dk:0x3f8a1e,stun:0xd6f7b4,hopMul:0.65,spitMul:0.8,hopPow:2.9},
  mid:{size:1.0,hp:2,col:0xa07ce8,dk:0x5b3fa0,stun:0xdccdf8,hopMul:1.0,spitMul:1.0,hopPow:2.2},
  big:{size:1.42,hp:3,col:0xf08a45,dk:0x9c4d17,stun:0xf9cba6,hopMul:1.6,spitMul:1.35,hopPow:1.7}};
function buildGloop(col,dk){const g=new THREE.Group();const body=new THREE.Mesh(SPH,new THREE.MeshPhongMaterial({color:col,shininess:120,specular:0xffffff,transparent:true,opacity:0.92}));body.scale.set(0.6,0.5,0.6);body.position.y=0.5;g.add(body);
  g.add(mesh(SPH,lam(dk),0,0.45,0,0.22,0.2,0.22));
  [-0.2,0.2].forEach(x=>{const e=new THREE.Group();e.position.set(x,0.6,0.5);e.add(mesh(SPH,pho(0xffffff,80,0xffffff),0,0,0,0.11));e.add(mesh(SPH,lam(0x111111),0,0,0.08,0.05));const brow=mesh(BOXG,lam(dk),0,0.14,0.02,0.2,0.05,0.04);brow.rotation.z=x<0?-0.5:0.5;e.add(brow);g.add(e);});
  const mouth=mesh(SPH,lam(dk),0,0.38,0.55,0.1,0.06,0.06);g.add(mouth);g.userData={body,mouth};return g;}
function addGloop(x,z,type){const T=GTYPE[type]||GTYPE.mid;const g=buildGloop(T.col,T.dk);const y=groundHeightAt(x,z);g.position.set(x,y,z);const face=rand(0,TAU);g.rotation.y=face;scene.add(g);
  gloops.push({g,x,z,hx:x,hz:z,y,type:type||'mid',size:T.size,col:T.col,stunCol:T.stun,hopMul:T.hopMul,spitMul:T.spitMul,hopPow:T.hopPow,hp:T.hp,maxHp:T.hp,state:'idle',t:0,spitT:rand(1,2.5),wind:0,vx:0,vz:0,hurtT:0,stunT:0,alive:true,ph:rand(0,TAU),face,hopT:rand(0.5,2),hopA:0});}
const GOOGEO=new THREE.SphereGeometry(1,10,8);
for(let i=0;i<24;i++){const m=new THREE.Mesh(GOOGEO,new THREE.MeshPhongMaterial({color:GOOC,shininess:120,specular:0xffffff,transparent:true,opacity:0.95}));m.scale.setScalar(0.22);m.visible=false;scene.add(m);goos.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,ref:false,trailT:0});}
const PUDG=new THREE.CylinderGeometry(1,1,0.04,18);PUDG.translate(0,0.02,0);
for(let i=0;i<14;i++){const m=new THREE.Mesh(PUDG,new THREE.MeshLambertMaterial({color:0x7fd35a,transparent:true,opacity:0.75}));m.visible=false;scene.add(m);puddles.push({m,x:0,y:0,z:0,life:0,alive:false,size:0.65});}
function addPuddle(x,y,z,size,col){let p=null;for(const q of puddles){if(!q.alive){p=q;break;}}if(!p){p=puddles[0];for(const q of puddles)if(q.life<p.life)p=q;}p.alive=true;p.x=x;p.y=y;p.z=z;p.life=5;p.size=size||0.65;p.m.visible=true;p.m.position.set(x,y+0.01,z);p.m.scale.set(0.2,1,0.2);p.m.material.color.setHex(col||0x7fd35a);p.m.material.opacity=0.75;}
function buildCrate(){const g=new THREE.Group();const band=pho(0xd1a83c,120,0xfff0b8);
  g.add(mesh(BOXG,lam(0xd6a05e),0,0.45,0,0.9,0.9,0.9));
  g.add(mesh(BOXG,band,0,0.45,0,0.94,0.14,0.94));g.add(mesh(BOXG,band,0,0.07,0,0.94,0.1,0.94));g.add(mesh(BOXG,band,0,0.83,0,0.94,0.1,0.94));
  [[0,0.47,0],[0,-0.47,0],[0.47,0,1],[-0.47,0,1]].forEach(q=>{const d=mesh(SPH,pho(0xfff3c4,140,0xffffff),q[0],0.45,q[1],q[2]?0.04:0.13,0.13,q[2]?0.13:0.04);g.add(d);});
  return g;}
function addCrate(x,y,z,item){const g=buildCrate();g.position.set(x,y,z);scene.add(g);
  const sol={min:new THREE.Vector3(x-0.45,y,z-0.45),max:new THREE.Vector3(x+0.45,y+0.9,z+0.45),mesh:g,surf:'wood'};solids.push(sol);
  crates.push({g,x,y,z,item,broken:false,sol});}
function breakCrate(c){if(c.broken)return;c.broken=true;c.g.visible=false;const i=solids.indexOf(c.sol);if(i>=0)solids.splice(i,1);
  SFX.crate();CAM.shake=Math.max(CAM.shake,0.3);rumble(70,0.4,0.2);spawnRing(c.x,c.y+0.05,c.z,0xffe9b0,0.3,5,0.35);
  for(let k=0;k<16;k++)spawnP(c.x+rand(-0.4,0.4),c.y+0.45+rand(-0.4,0.4),c.z+rand(-0.4,0.4),rand(-3.5,3.5),rand(1,4.5),rand(-3.5,3.5),rand(0.08,0.17),Math.random()<0.3?0xd1a83c:0xc98a4b,rand(0.5,0.9),0.2,-9,0.9);
  if(c.item==='fire')addPower(c.x,c.y+0.85,c.z);else addHeart(c.x,c.y+0.85,c.z);}
function buildFlameItem(){const g=new THREE.Group();
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xff7a1f}),0,0.06,0,0.22,0.58,0.22));
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xffd24a}),0,-0.04,0,0.13,0.36,0.13));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff3c4}),0,-0.18,0,0.12,0.09,0.12));return g;}
function addPower(x,y,z){const g=buildFlameItem();g.position.set(x,y,z);scene.add(g);powers.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0});}
const FIREGEO=new THREE.SphereGeometry(1,9,7);
for(let i=0;i<26;i++){const m=new THREE.Mesh(FIREGEO,new THREE.MeshBasicMaterial({color:0xff8a2b}));m.scale.setScalar(0.24);m.visible=false;scene.add(m);fires.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,trailT:0});}
function buildHeart(){const g=new THREE.Group();const m=pho(0xff5a7a,120,0xffffff);g.add(mesh(SPH,m,-0.11,0.1,0,0.16));g.add(mesh(SPH,m,0.11,0.1,0,0.16));const c=mesh(CONE,m,0,-0.06,0,0.26,0.36,0.16);c.rotation.z=Math.PI;g.add(c);g.scale.setScalar(0.9);return g;}
function addHeart(x,y,z){const g=buildHeart();g.position.set(x,y,z);scene.add(g);hearts.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0});}

function hedge(x1,z1,x2,z2){const cx=(x1+x2)/2,cz=(z1+z2)/2,w=Math.abs(x2-x1)+0.9,d=Math.abs(z2-z1)+0.9;
  const sol=addSolid(cx,0,cz,w,1.35,d,0x3f8a2e,{surf:'grass'});
  const along=w>d,len=Math.max(w,d),n=Math.max(2,Math.round(len/1.15));
  for(let i=0;i<n;i++){const t=(i+0.5)/n;const px=along?cx-w/2+t*w:cx,pz=along?cz:cz-d/2+t*d;
    scene.add(mesh(SPH,lam(Math.random()<0.5?0x57a83f:0x4a9633),px+rand(-0.1,0.1),1.28,pz+rand(-0.1,0.1),along?0.66:w*0.6,0.44,along?d*0.6:0.66));}
  return sol;}
function pathTile(x1,z1,x2,z2){const cx=(x1+x2)/2,cz=(z1+z2)/2;scene.add(mesh(BOXG,lam(0xd8c48f),cx,0.02,cz,Math.abs(x2-x1),0.05,Math.abs(z2-z1)));}
function addCheck(x,z){const g=new THREE.Group();const y=groundHeightAt(x,z);g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x9aa4ad),0,0.11,0,0.58,0.22,0.58));
  const post=mesh(CYL,pho(0xd1a83c,140,0xfff0b8),0,0.82,0,0.085,1.45,0.085);g.add(post);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.31,0.44,12),pho(0x8f8467,50,0x777777));bell.position.y=1.66;g.add(bell);
  const fg=new THREE.Group();fg.position.set(0,1.22,0);const flag=mesh(BOXG,lam(0xc3bcaa),0.3,0,0,0.52,0.34,0.03);fg.add(flag);g.add(fg);
  scene.add(g);checks.push({g,x,z,y,bell,fg,flag,on:false,t:0});}
function updateChecks(dt){for(let i=0;i<checks.length;i++){const c=checks[i];
  if(!c.on&&!P.dead&&Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<2.1&&Math.abs(P.pos.y-c.y)<2.6){
    c.on=true;P.spawn.x=c.x;P.spawn.y=c.y;P.spawn.z=c.z+1.5;
    c.bell.material.color.setHex(0xf5c542);c.flag.material.color.setHex(0xff7a5a);
    SFX.checkpoint();spawnRing(c.x,c.y+0.05,c.z,0xffe9b0,0.3,5,0.5);
    for(let k=0;k<14;k++)spawnP(c.x,c.y+1.75,c.z,rand(-2,2),rand(1,3.5),rand(-2,2),0.08,0xffe36b,0.7,0.3,-4,1);
    if(i>0)showToast('Checkpoint!');}
  if(c.on){c.t+=dt;c.bell.rotation.y=c.t*2.4;c.fg.rotation.y=Math.sin(c.t*2.6)*0.5;}}}
const CONF=[0xff5a7a,0xffc94a,0x6fd45a,0x4fb4e6,0xa15ae0,0xffffff,0xff9a3c];
function buildRainbow(x,z){const g=new THREE.Group();const cols=[0xff5a5a,0xff9a3c,0xffe14a,0x6fd45a,0x4fb4e6,0x5a6fe0,0xa15ae0];
  cols.forEach((c,i)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(27-i*1.6,0.8,7,44,Math.PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.85}));g.add(t);});
  g.position.set(x,0.2,z);g.scale.setScalar(0.15);g.visible=false;scene.add(g);return g;}
function triggerWin(){if(won)return;won=true;winT=0;WM.party=true;AU.win=true;SFX.fanfare();
  if(RAINBOW)RAINBOW.visible=true;const w=$('win');w.style.display='flex';w.style.opacity=1;
  CAM.fovKick=Math.max(CAM.fovKick,7);CAM.shake=Math.max(CAM.shake,0.4);rumble(500,0.6,0.7);}
function updateWin(dt){if(!won)return;winT+=dt;
  const k=smooth(Math.min(winT/1.3,1));if(RAINBOW){RAINBOW.scale.setScalar(0.15+k*0.85);RAINBOW.children.forEach(t=>{t.material.opacity=0.85*k;});}
  confT-=dt;if(confT<=0&&winT<16){confT=0.05;const a=rand(0,TAU),r=rand(0,15);
    spawnP(WM.x+Math.cos(a)*r,rand(13,21),WM.z+Math.sin(a)*r,rand(-1.2,1.2),rand(-3,-1),rand(-1.2,1.2),rand(0.09,0.18),CONF[Math.floor(Math.random()*CONF.length)],rand(1.8,2.8),0,-2.2,1);}
  if(winT>9){const w=$('win');w.style.opacity=Math.max(0,1-(winT-9)/2.5);if(winT>11.7)w.style.display='none';}}

function buildLevel(){
  const fence=0x9c6b3c;
  addSolid(-6,0,26,84,0.7,0.5,fence);addSolid(-6,0,-84,84,0.7,0.5,fence);
  addSolid(-48,0,-29,0.5,0.7,112,fence);addSolid(36,0,-29,0.5,0.7,112,fence);

  // --- the path floor ---
  pathTile(-3,12,3,-20); pathTile(-3,-24,11,-21); pathTile(7,-38,11,-24);
  pathTile(6,-48,10,-38); pathTile(6,-60,10,-48); pathTile(-3,-62,10,-58);
  pathTile(-19,-62,-3,-58); pathTile(-32,-62,-19,-58); pathTile(-34,-68,-22,-56);

  // --- hedges: room A (start meadow) ---
  hedge(-11,14,11,14); hedge(-11,-6,-11,14); hedge(11,-6,11,14);
  hedge(-11,-6,-4,-6); hedge(4,-6,11,-6);
  // corridor 1
  hedge(-4,-20,-4,-6); hedge(4,-20,4,-6);
  // room B (pond garden)
  hedge(-14,-20,-4,-20); hedge(4,-20,14,-20); hedge(-14,-38,-14,-20); hedge(14,-38,14,-20);
  hedge(-14,-38,4,-38); hedge(12,-38,14,-38);
  // corridor 2
  hedge(4,-48,4,-38); hedge(12,-48,12,-38);
  // room C (tower yard)
  hedge(-4,-48,4,-48); hedge(12,-48,22,-48); hedge(22,-66,22,-48); hedge(-4,-66,22,-66);
  hedge(-4,-56,-4,-48); hedge(-4,-66,-4,-64);
  // corridor 3
  hedge(-20,-64,-4,-64); hedge(-20,-56,-4,-56);
  // room D (windmill plaza)
  hedge(-20,-56,-20,-52); hedge(-20,-72,-20,-64); hedge(-36,-72,-20,-72);
  hedge(-36,-72,-36,-52); hedge(-36,-52,-20,-52);

  // --- room A: learn to move ---
  addCheck(0,11);
  addSolid(3,0,7,1.3,0.4,1.3,0xb07a3f);addSolid(4.6,0,7,1.3,1.0,1.3,0xb07a3f);addSolid(6.2,0,7,1.3,2.0,1.3,0xb07a3f);
  addNote(6.2,2.7,7,false);addNote(0,1.5,3,false);
  addCrate(-3,0,6,'fire');addCrate(-8,0,-3,'heart');
  for(let i=0;i<7;i++)addPinwheel(-8+i*0.9,9-i*2.2,0.3);
  addCupPyramid(-7,2,false);
  addDust(8,-2);
  for(let i=0;i<34;i++){const a=rand(0,TAU),r=Math.sqrt(Math.random())*7;addWobbler(-5+Math.cos(a)*r,4+Math.sin(a)*r,'flower');}
  for(let i=0;i<12;i++){const a=rand(0,TAU),r=Math.sqrt(Math.random())*7;addWobbler(-5+Math.cos(a)*r,4+Math.sin(a)*r,'grass');}
  for(let i=0;i<5;i++)addWobbler(rand(-9,9),rand(-4,12),'shroom');
  addHeart(8,0.7,4);

  // --- corridor 1: first Gloop ---
  addGloop(0,-13,'small');
  addCupPyramid(-2,-9,true);
  addNote(0,1.4,-17,false);
  for(let i=0;i<4;i++)addPinwheel(i%2?-2.6:2.6,-8-i*3,0.3);

  // --- room B: the pond ---
  addCheck(0,-21);
  buildBoat(0,-29);
  for(let i=0;i<12;i++){const t=i/12;const x=POND.x0-0.6+t*(POND.x1-POND.x0+1.2);addWobbler(x,i%2?POND.z0-0.8:POND.z1+0.8,'reed');}
  addGloop(-9,-24,'mid');addGloop(10,-34,'big');
  addCrate(-11,0,-30,'heart');
  addDust(12,-22);
  addNote(-11,1.4,-36,false);addNote(11,1.4,-28,false);
  addHeart(-12,0.7,-22);
  for(let i=0;i<20;i++){const a=rand(0,TAU),r=rand(1,5);addWobbler(-10+Math.cos(a)*r,-33+Math.sin(a)*r,'flower');}
  for(let i=0;i<4;i++)addWobbler(rand(-13,13),rand(-37,-21),'shroom');

  // --- corridor 2 ---
  addCheck(8,-39);
  addGloop(8,-44,'small');
  addCupPyramid(7,-41,true);addCrate(6,0,-44,'fire');
  addNote(8,1.4,-46,false);

  // --- room C: the tower ---
  addCheck(8,-49);
  const TX=12,TZ=-58;
  addSolid(TX,0,TZ,3.6,12,3.6,0x9aa4ad,{surf:'stone'});addSolid(TX,12,TZ,6,0.5,6,0xc98a4b,{surf:'wood'});
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*0.56;const y=1.1*(i+1);
    const sl=addSolid(TX+Math.cos(a)*4.3,y-0.4,TZ+Math.sin(a)*4.3,2.4,0.4,2.4,i%2?0xc98a4b:0xd9a262,{surf:'wood'});
    if(i===3||i===7)addNote(sl.mesh.position.x,y+0.7,sl.mesh.position.z,false);}
  addNote(TX,13.2,TZ,false);
  addFan(19,-52,1.8,9.5);
  addSolid(19,6.5,-56,3.4,0.5,3.4,0xc98a4b);addNote(19,8.2,-56,false);
  addSolid(16,9.1,-61,3.2,0.5,3.2,0xc98a4b);addCrate(16,9.6,-61,'fire');
  addGloop(2,-56,'big');addGloop(18,-62,'mid');
  addCrate(-1,0,-52,'heart');
  addDust(4,-64);
  addHeart(0,0.7,-62);
  for(let i=0;i<14;i++)addWobbler(rand(-3,21),rand(-65,-49),'flower');

  // --- corridor 3 ---
  addCheck(-6,-60);
  addGloop(-14,-60,'small');
  addCrate(-18,0,-58,'heart');
  addNote(-11,1.4,-61,false);
  for(let i=0;i<3;i++)addPinwheel(-8-i*4,i%2?-57:-63,0.3);

  // --- room D: the windmill ---
  addCheck(-21,-60);
  buildWindmill(-28,-64);
  RAINBOW=buildRainbow(-28,-70);
  addCupPyramid(-24,-55,false);addCrate(-25,0,-54,'heart');
  addNote(-24,1.4,-57,false);
  addHeart(-33,0.7,-56);
  for(let i=0;i<26;i++){const a=rand(0,TAU),r=rand(1,7);addWobbler(-28+Math.cos(a)*r,-57+Math.sin(a)*r,'flower');}
  for(let i=0;i<6;i++)addPinwheel(-34+i*2.4,-54,Math.PI);

  // --- scenery outside the hedges ---
  [[-20,18],[18,16],[-26,4],[24,2],[-22,-30],[24,-28],[-30,-40],[26,-44],[-42,-16],[30,-70],[-42,-64],[-14,-78],[10,-76],[28,-14],[-38,20],[6,20]].forEach(t=>addTree(t[0],t[1]));
  for(let i=0;i<22;i++){const x=rand(-46,34),z=rand(-82,24);if(x>-38&&x<24&&z>-74&&z<16)continue;scene.add(mesh(SPH,lam(0x4f9f3f),x,0.35,z,rand(0.9,1.6),rand(0.6,1.0),rand(0.9,1.6)));}
  for(let i=0;i<10;i++)addCloud(rand(-44,32),rand(22,30),rand(-80,20),rand(1.5,3));

  // --- the four Snoozles ---
  const homes=[[-30.2,-60.4],[-28.6,-59.4],[-26.4,-60.4],[-28.4,-61.4]];
  addSnoozle(-7,0,-1,homes[0],false);
  addSnoozle(0,0.28,-29,homes[1],true);
  addSnoozle(TX,12.5,TZ,homes[2],false);
  addSnoozle(-28,0,-60.6,homes[3],false);
}

