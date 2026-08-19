const PGEO=new THREE.SphereGeometry(1,7,5);const PART=[];let pIdx=0;
for(let i=0;i<170;i++){const m=new THREE.Mesh(PGEO,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,depthWrite:false}));m.visible=false;m.frustumCulled=false;scene.add(m);PART.push({m,life:0,max:1,vx:0,vy:0,vz:0,grow:0,grav:0,size:1,alpha:1});}
function spawnP(x,y,z,vx,vy,vz,size,color,life,grow,grav,alpha){const p=PART[pIdx];pIdx=(pIdx+1)%PART.length;p.m.visible=true;p.m.position.set(x,y,z);p.vx=vx;p.vy=vy;p.vz=vz;p.size=size;p.m.scale.setScalar(size);p.m.material.color.setHex(color);p.life=p.max=life;p.grow=grow;p.grav=grav;p.alpha=alpha;p.m.material.opacity=alpha;}
function updateParticles(dt){for(const p of PART){if(p.life<=0)continue;p.life-=dt;if(p.life<=0){p.m.visible=false;continue;}p.vy+=p.grav*dt;const dr=Math.exp(-2.5*dt);p.vx*=dr;p.vz*=dr;if(p.grav===0)p.vy*=dr;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.size+=p.grow*dt*p.size;p.m.scale.setScalar(p.size);p.m.material.opacity=p.alpha*(p.life/p.max);}}
const RINGS=[];let rIdx=0;const RGEO=new THREE.RingGeometry(0.75,1,32);
for(let i=0;i<10;i++){const m=new THREE.Mesh(RGEO,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.7,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);RINGS.push({m,life:0,max:1,grow:1});}
function spawnRing(x,y,z,color,scale,grow,life){const r=RINGS[rIdx];rIdx=(rIdx+1)%RINGS.length;r.m.visible=true;r.m.position.set(x,y,z);r.m.scale.setScalar(scale);r.m.material.color.setHex(color);r.life=r.max=life;r.grow=grow;}
function updateRings(dt){for(const r of RINGS){if(r.life<=0)continue;r.life-=dt;if(r.life<=0){r.m.visible=false;continue;}r.m.scale.setScalar(r.m.scale.x+r.grow*dt);r.m.material.opacity=0.75*(r.life/r.max);}}
function textTex(txt,color){const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');g.font='bold 48px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.fillText(txt,32,34);return new THREE.CanvasTexture(cv);}
const ZTEX=textTex('z','#5b4bd6');const ZS=[];let zIdx=0;
for(let i=0;i<16;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ZTEX,transparent:true,opacity:1,depthWrite:false}));s.visible=false;scene.add(s);ZS.push({s,life:0,vx:0});}
function spawnZ(x,y,z){const o=ZS[zIdx];zIdx=(zIdx+1)%ZS.length;o.s.visible=true;o.s.position.set(x,y,z);o.life=1.6;o.vx=rand(-0.2,0.2);o.s.scale.setScalar(0.4);}
function updateZ(dt){for(const o of ZS){if(o.life<=0)continue;o.life-=dt;if(o.life<=0){o.s.visible=false;continue;}o.s.position.y+=0.7*dt;o.s.position.x+=o.vx*dt;const k=1-o.life/1.6;o.s.scale.setScalar(0.4+k*0.5);o.s.material.opacity=1-k;}}

