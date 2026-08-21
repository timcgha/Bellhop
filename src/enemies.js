function updateWobblers(dt){const px=P.pos.x,pz=P.pos.z,sp=Math.hypot(P.vel.x,P.vel.z);
  for(const w of wobblers){
    if(Math.abs(P.pos.y-w.y)<1.2){const dx=w.x-px,dz=w.z-pz,d=Math.hypot(dx,dz);if(d<0.8&&d>0.001){const s=(1-d/0.8)*(0.6+sp*0.5)*dt*40;w.vx+=dx/d*s;w.vz+=dz/d*s;}}
    w.vx+=(-60*w.tx-5.5*w.vx)*dt;w.vz+=(-60*w.tz-5.5*w.vz)*dt;w.tx=clamp(w.tx+w.vx*dt,-1.3,1.3);w.tz=clamp(w.tz+w.vz*dt,-1.3,1.3);
    w.g.rotation.z=-w.tx+Math.sin(time*1.5+w.ph)*0.04;w.g.rotation.x=w.tz;}}
function updatePinwheels(dt){for(const pw of pinwheels){pw.spinVel=damp(pw.spinVel,0.8,0.9,dt);pw.head.rotation.z+=pw.spinVel*dt;
  if(pw.spinVel>6&&Math.hypot(pw.x-P.pos.x,pw.z-P.pos.z)<9){pw.tick+=pw.spinVel*dt;if(pw.tick>Math.PI/2){pw.tick=0;if(Math.random()<0.4)SFX.tick();}}}}
function restHeightFor(t){let h=surfaceHeightAt(t.pos.x,t.pos.z,t.pos.y+0.3,t.r*0.7);for(const o of toss){if(o===t||!o.rest)continue;const dd=Math.hypot(o.pos.x-t.pos.x,o.pos.z-t.pos.z);if(dd<0.42&&o.pos.y+o.h<=t.pos.y+0.25&&o.pos.y+o.h>h)h=o.pos.y+o.h;}return h;}
function updateToss(dt){for(const t of toss){
  const dx=t.pos.x-P.pos.x,dz=t.pos.z-P.pos.z,d=Math.hypot(dx,dz);
  if(d<R+t.r&&t.pos.y<P.pos.y+H&&t.pos.y+t.h>P.pos.y){const sp=Math.hypot(P.vel.x,P.vel.z);const nx=dx/(d||0.01),nz=dz/(d||0.01);const push=Math.max(sp,1.5);t.vel.x+=nx*push*0.8;t.vel.z+=nz*push*0.8;t.vel.y=Math.max(t.vel.y,1.5+sp*0.2);t.rest=false;}
  if(t.rest){if(restHeightFor(t)<t.pos.y-0.02)t.rest=false;else continue;}
  t.vel.y+=GRAV*0.8*dt;t.pos.x+=t.vel.x*dt;t.pos.y+=t.vel.y*dt;t.pos.z+=t.vel.z*dt;
  const gy=restHeightFor(t);
  if(t.pos.y<=gy){t.pos.y=gy;if(t.vel.y<-1.5){t.vel.y=-t.vel.y*0.35;t.vel.x*=0.6;t.vel.z*=0.6;if(t.vel.y>1&&d<25)SFX.clatter();}else{t.vel.y=0;t.vel.x=damp(t.vel.x,0,7,dt);t.vel.z=damp(t.vel.z,0,7,dt);if(Math.hypot(t.vel.x,t.vel.z)<0.08){t.vel.set(0,0,0);t.rest=true;}}}
  t.pos.x=clamp(t.pos.x,-40,40);t.pos.z=clamp(t.pos.z,-40,40);
  t.m.position.copy(t.pos);t.m.rotation.z=-t.vel.x*0.06;t.m.rotation.x=t.vel.z*0.06;}}
function revealHeldNote(n){
  if(!n||n.got||!n.hidden)return;
  n.hidden=false;n.g.visible=true;SFX.reveal();
  for(let i=0;i<12;i++)spawnP(n.x,n.y,n.z,rand(-2,2),rand(1,4),rand(-2,2),0.07,0xffe36b,0.7,0.3,-6,1);
}
function collectNote(n){n.got=true;n.g.visible=false;gotNotes++;SFX.note();for(let i=0;i<10;i++)spawnP(n.g.position.x,n.g.position.y,n.g.position.z,rand(-2,2),rand(1,4),rand(-2,2),0.07,0xffe36b,0.6,0.3,-6,1);updateHUD();}
function updateNotes(dt){for(const n of notes){if(n.got||n.hidden)continue;n.g.position.y=n.y+Math.sin(time*3+n.ph)*0.12;n.g.rotation.y+=dt*2.5;
  tmpV.set(P.pos.x,P.pos.y+0.6,P.pos.z);if(n.g.position.distanceTo(tmpV)<1.1)collectNote(n);}}
function dustHit(d,amount){d.amt-=amount;for(let i=0;i<8;i++){const a=rand(0,TAU);spawnP(d.x+Math.cos(a)*0.5,0.15,d.z+Math.sin(a)*0.5,Math.cos(a)*rand(1,3),rand(1,3),Math.sin(a)*rand(1,3),rand(0.1,0.2),0xc9b48a,rand(0.4,0.7),0.8,-4,0.8);}
  if(d.amt<=0.12){d.amt=0;d.m.visible=false;d.note.g.visible=true;d.note.hidden=false;SFX.reveal();showToast('Something was hiding under the dust!');for(let i=0;i<12;i++)spawnP(d.x,0.6,d.z,rand(-2,2),rand(1,4),rand(-2,2),0.07,0xffe36b,0.7,0.3,-6,1);}
  else d.m.scale.set(d.amt,d.amt,d.amt);}
function wakeSnoozle(s){if(s.state!=='sleep')return;s.state='wake';s.t=0;s.boat=false;s.baseY=s.g.position.y;s.g.scale.set(1,1,1);
  s.g.userData.closed.visible=false;s.g.userData.open.visible=true;s.g.userData.mouth.scale.set(0.1,0.1,0.02);setTimeout(()=>{s.g.userData.mouth.scale.set(0.08,0.03,0.02);},900);
  rescued++;AU.layers=rescued;SFX.wake();
  for(let i=0;i<12;i++)spawnP(s.g.position.x,s.g.position.y+0.6,s.g.position.z,rand(-2,2),rand(1,4),rand(-2,2),0.08,0xffe36b,0.7,0.2,-5,1);
  if(rescued<snoozles.length)showToast('A Snoozle woke up! ♪ '+rescued+' of '+snoozles.length);
  else FINISH.onAllAwake();
  updateHUD();}
function updateSnoozles(dt){for(const s of snoozles){const g=s.g;
  if(s.state==='sleep'){if(s.boat&&BOAT){g.position.set(BOAT.pos.x,0.28,BOAT.pos.z);g.rotation.y=BOAT.yaw+Math.PI/2;}
    g.scale.set(1,1+Math.sin(time*2+s.ph)*0.03,1);s.zz-=dt;if(s.zz<=0){s.zz=rand(0.8,1.3);spawnZ(g.position.x+0.2,g.position.y+0.8,g.position.z);}}
  else if(s.state==='wake'){s.t+=dt;const k=Math.min(s.t/1.1,1);g.position.y=s.baseY+Math.sin(k*Math.PI)*1.3;g.rotation.y+=dt*10;
    if(s.t>1.1){s.t=0;s.fx=g.position.x;s.fy=s.baseY;s.fz=g.position.z;s.homeY=groundHeightAt(s.home.x,s.home.z);
      if(s.path&&s.path.length){s.state='path';s.pathIdx=0;}else s.state='zoom';}}
  else if(s.state==='path'){s.t+=dt;const dur=1.15;const k=Math.min(s.t/dur,1);const tgt=s.path[s.pathIdx];
    g.position.x=lerp(s.fx,tgt.x,k);g.position.y=lerp(s.fy,tgt.y,k);g.position.z=lerp(s.fz,tgt.z,k);
    g.rotation.y+=dt*9;g.scale.set(1,1,1);
    s.stepT-=dt;if(s.stepT<=0){s.stepT=0.05;spawnP(g.position.x,g.position.y+0.3,g.position.z,rand(-0.6,0.6),rand(-0.6,0.6),rand(-0.6,0.6),0.1,Math.random()<0.5?0xfff0b8:0xffffff,0.55,0.4,0,0.85);}
    if(k>=1){s.pathIdx++;s.t=0;s.fx=g.position.x;s.fy=g.position.y;s.fz=g.position.z;
      if(s.pathIdx>=s.path.length)s.state='zoom';}}
  else if(s.state==='zoom'){s.t+=dt;const k=Math.min(s.t/1.7,1);
    g.position.x=lerp(s.fx,s.home.x,k);g.position.z=lerp(s.fz,s.home.z,k);
    g.position.y=lerp(s.fy,s.homeY,k)+Math.sin(k*Math.PI)*10;
    g.rotation.y+=dt*9;g.scale.set(1,1,1);
    s.stepT-=dt;if(s.stepT<=0){s.stepT=0.05;spawnP(g.position.x,g.position.y+0.3,g.position.z,rand(-0.6,0.6),rand(-0.6,0.6),rand(-0.6,0.6),0.1,Math.random()<0.5?0xfff0b8:0xffffff,0.55,0.4,0,0.85);}
    if(k>=1){s.state='home';s.baseY=s.homeY;g.position.set(s.home.x,s.homeY,s.home.z);}}
  else{s.t+=dt;const D=won?0.34:0.5;if(s.hopT<=0&&Math.random()<dt*(won?2.6:0.35))s.hopT=D;
    let hy=0;if(s.hopT>0){s.hopT-=dt;hy=Math.sin((D-Math.max(s.hopT,0))/D*Math.PI)*(won?0.62:0.4);}
    g.position.y=s.baseY+hy;g.scale.set(1,1+Math.sin(time*(won?9:5)+s.ph)*(won?0.09:0.04),1);
    if(won)g.rotation.y+=dt*3.6;else g.rotation.y=angDamp(g.rotation.y,Math.atan2(P.pos.x-g.position.x,P.pos.z-g.position.z),2,dt);}}}
function updateBoat(dt){if(!BOAT)return;const b=BOAT;b.pos.x+=b.vel.x*dt;b.pos.z+=b.vel.z*dt;b.vel.x=damp(b.vel.x,0,0.7,dt);b.vel.z=damp(b.vel.z,0,0.7,dt);
  const m=1.0;if(b.pos.x<POND.x0+m){b.pos.x=POND.x0+m;b.vel.x=Math.abs(b.vel.x)*0.5;}if(b.pos.x>POND.x1-m){b.pos.x=POND.x1-m;b.vel.x=-Math.abs(b.vel.x)*0.5;}
  if(b.pos.z<POND.z0+m){b.pos.z=POND.z0+m;b.vel.z=Math.abs(b.vel.z)*0.5;}if(b.pos.z>POND.z1-m){b.pos.z=POND.z1-m;b.vel.z=-Math.abs(b.vel.z)*0.5;}
  const sp=Math.hypot(b.vel.x,b.vel.z);if(sp>0.3)b.yaw=angDamp(b.yaw,Math.atan2(b.vel.x,b.vel.z),3,dt);
  b.g.position.set(b.pos.x,-0.1+Math.sin(time*2)*0.04,b.pos.z);b.g.rotation.set(Math.sin(time*1.7)*0.04,b.yaw,Math.sin(time*2.3)*0.05);}
function updateWindmill(dt){if(!WM)return;WM.spin=damp(WM.spin,WM.party?3:0.45,0.8,dt);WM.sails.rotation.z-=WM.spin*dt;}
function updateFans(dt){for(const f of fans){f.blades.rotation.y+=18*dt;f.pt-=dt;if(f.pt<=0){f.pt=0.06;const a=rand(0,TAU),r=rand(0,f.r*0.9);spawnP(f.x+Math.cos(a)*r,0.4,f.z+Math.sin(a)*r,0,rand(5,8),0,rand(0.06,0.12),0xffffff,rand(0.9,1.3),0.35,0,0.35);}}}
function updateClouds(dt){for(const c of clouds){c.g.position.x+=c.sp*dt;if(c.g.position.x>60)c.g.position.x=-60;}}

function updateGloops(dt){for(const e of gloops){if(!e.alive)continue;const g=e.g,u=g.userData;
  if(e.state==='dying'){e.t+=dt;const k=Math.max(0,1-e.t/0.9);g.scale.set((1+(1-k)*0.7)*e.size,Math.max(k*k,0.02)*e.size,(1+(1-k)*0.7)*e.size);g.position.set(e.x,e.y,e.z);u.body.material.opacity=0.92*k;if(e.t>=0.9){e.alive=false;g.visible=false;}continue;}
  const dx=P.pos.x-e.x,dz=P.pos.z-e.z,d=Math.hypot(dx,dz),dy=P.pos.y-e.y;
  e.x+=e.vx*dt;e.z+=e.vz*dt;e.vx=damp(e.vx,0,4,dt);e.vz=damp(e.vz,0,4,dt);e.x=clamp(e.x,-40,40);e.z=clamp(e.z,-40,40);e.y=surfaceHeightAt(e.x,e.z,e.y+0.5,0.3);
  e.hurtT-=dt;e.stunT-=dt;
  const near=d<15&&Math.abs(dy)<7&&!P.dead;
  if(near&&!seenGloop){seenGloop=true;showToast('A Gloop! Spin into it, slam it, or blow its goo back.');}
  if(near)e.face=Math.atan2(dx,dz);g.rotation.y=angDamp(g.rotation.y,e.face,6,dt);
  let hop=0;
  if(e.stunT<=0){e.hopT-=dt;if(e.hopT<=0){e.hopT=rand(1.2,2.6)*e.hopMul;e.hopA=0.45;let ang=rand(0,TAU);const dh=Math.hypot(e.x-e.hx,e.z-e.hz);if(dh>3.5)ang=Math.atan2(e.hx-e.x,e.hz-e.z);else if(near&&d<3.5)ang=e.face+Math.PI;else if(near)ang=e.face+rand(-0.8,0.8);e.vx+=Math.sin(ang)*e.hopPow;e.vz+=Math.cos(ang)*e.hopPow;}}
  if(e.hopA>0){e.hopA-=dt;hop=Math.sin((0.45-Math.max(e.hopA,0))/0.45*Math.PI)*0.35;}
  if(near&&d<11&&e.stunT<=0&&d>2.2){e.spitT-=dt;if(e.spitT<=0&&e.wind<=0)e.wind=0.5;}
  if(e.wind>0){e.wind-=dt;if(e.wind<=0){spit(e);e.spitT=rand(2.2,3.4)*e.spitMul;}}
  const wob=1+Math.sin(time*6+e.ph)*0.04;let sx=wob,sy=1/wob;
  if(e.wind>0){const k=1-e.wind/0.5;sx*=1+k*0.25;sy*=1-k*0.2;u.mouth.scale.set(0.1+k*0.12,0.06+k*0.16,0.06);}else u.mouth.scale.set(0.1,0.06,0.06);
  if(e.hurtT>0){sx*=1.25;sy*=0.6;}
  if(e.stunT>0){sy*=0.85;g.rotation.z=Math.sin(time*20)*0.15;}else g.rotation.z=0;
  g.scale.set(sx*e.size,sy*e.size,sx*e.size);g.position.set(e.x,e.y+hop*e.size,e.z);
  u.body.material.color.setHex(e.hurtT>0?0xffffff:(e.stunT>0?e.stunCol:e.col));
  const CR=0.45+e.size*0.45;if(!P.dead&&d<CR&&Math.abs(dy)<1.4*e.size){const feet=P.pos.y-(e.y+hop);const nx=dx/(d||1),nz=dz/(d||1);
    if(feet>0.3*e.size&&P.vel.y<-1){hitGloop(e,1,-nx*3,-nz*3);P.vel.y=8.5;P.puff=true;P.puffAir=0;endHover();P.sq=1.3;P.grounded=false;spawnRing(P.pos.x,P.pos.y,P.pos.z,e.stunCol,0.3,4,0.3);}
    else if(feet<=0.3*e.size){const push=(CR-d)*0.5;P.pos.x+=nx*push;P.pos.z+=nz*push;e.x-=nx*push;e.z-=nz*push;}}
}}
function updateGoos(dt){for(const q of goos){if(!q.alive)continue;q.life-=dt;q.vel.y+=GOOGRAV*dt;q.pos.x+=q.vel.x*dt;q.pos.y+=q.vel.y*dt;q.pos.z+=q.vel.z*dt;q.m.position.copy(q.pos);
  q.trailT-=dt;if(q.trailT<=0){q.trailT=0.06;spawnP(q.pos.x,q.pos.y,q.pos.z,rand(-0.3,0.3),rand(-0.5,0.5),rand(-0.3,0.3),0.07,q.col||GOOC,0.35,-0.5,-3,0.7);}
  if(!q.ref&&!P.dead&&P.inv<=0){if(Math.hypot(q.pos.x-P.pos.x,q.pos.y-(P.pos.y+0.6),q.pos.z-P.pos.z)<0.6+(q.r||0.22)){hurtPlayer(q.vel.x,q.vel.z,q.col);SFX.splat();killGoo(q);continue;}}
  if(q.ref){let hitE=false;for(const e of gloops){if(!e.alive||e.state==='dying')continue;if(Math.hypot(q.pos.x-e.x,q.pos.z-e.z)<0.85&&Math.abs(q.pos.y-(e.y+0.5))<0.9){hitGloop(e,1,q.vel.x*0.3,q.vel.z*0.3);SFX.splat();killGoo(q);hitE=true;break;}}if(hitE)continue;}
  const gy=surfaceHeightAt(q.pos.x,q.pos.z,q.pos.y,0.15);
  if(q.pos.y<=gy+0.12||q.life<=0){SFX.splat();addPuddle(q.pos.x,gy,q.pos.z,q.ref?0.5:0.5+(q.r||0.22),q.col);for(let i=0;i<6;i++)spawnP(q.pos.x,gy+0.1,q.pos.z,rand(-2,2),rand(1,3),rand(-2,2),0.06,q.col||GOOC,0.35,0.3,-8,0.9);killGoo(q);}}}
function updatePuddles(dt){for(const p of puddles){if(!p.alive)continue;p.life-=dt;const s=Math.min(p.size,p.m.scale.x+dt*4);p.m.scale.set(s,1,s);p.m.material.opacity=0.75*Math.min(1,p.life/1.5);if(p.life<=0){p.alive=false;p.m.visible=false;}}}
function fireBurst(px,py,pz){SFX.fireSlam();CAM.shake=Math.max(CAM.shake,0.85);CAM.fovKick=Math.max(CAM.fovKick,10);rumble(220,1,0.6);
  spawnRing(px,py+0.04,pz,0xff9a3c,0.4,14,0.55);spawnRing(px,py+0.04,pz,0xffe36b,0.25,9,0.7);
  const n=10;for(let i=0;i<n;i++){const a=i/n*TAU+rand(-0.06,0.06);let f=null;for(const b of fires){if(!b.alive){f=b;break;}}if(!f)break;
    f.alive=true;f.life=1.15;f.trailT=0;f.pos.set(px+Math.sin(a)*0.45,py+0.36,pz+Math.cos(a)*0.45);f.vel.set(Math.sin(a)*11.5,0,Math.cos(a)*11.5);f.m.visible=true;f.m.position.copy(f.pos);f.m.scale.setScalar(0.24);}}
function popFire(f){f.alive=false;f.m.visible=false;SFX.fizz();for(let i=0;i<7;i++)spawnP(f.pos.x,f.pos.y,f.pos.z,rand(-2.5,2.5),rand(0.5,3),rand(-2.5,2.5),rand(0.08,0.15),Math.random()<0.5?0xff8a2b:0xffe36b,rand(0.3,0.5),0.4,-4,0.9);}
function updateFires(dt){for(const f of fires){if(!f.alive)continue;f.life-=dt;
  f.pos.x+=f.vel.x*dt;f.pos.z+=f.vel.z*dt;f.pos.y=surfaceHeightAt(f.pos.x,f.pos.z,f.pos.y+0.7,0.2)+0.36;
  f.m.position.copy(f.pos);f.m.scale.setScalar(0.24+Math.sin(time*34+f.pos.x)*0.05);
  f.trailT-=dt;if(f.trailT<=0){f.trailT=0.035;spawnP(f.pos.x,f.pos.y,f.pos.z,rand(-0.6,0.6),rand(0.4,1.6),rand(-0.6,0.6),0.11,Math.random()<0.5?0xff8a2b:0xffe36b,0.35,0.5,0,0.9);}
  let hit=false;
  for(const e of gloops){if(!e.alive||e.state==='dying')continue;if(Math.hypot(f.pos.x-e.x,f.pos.z-e.z)<0.45+e.size*0.55&&Math.abs(f.pos.y-e.y)<1.6){const d=Math.hypot(e.x-f.pos.x,e.z-f.pos.z)||0.01;hitGloop(e,2,(e.x-f.pos.x)/d*7,(e.z-f.pos.z)/d*7);hit=true;break;}}
  if(!hit)for(const e of cinders){if(!e.alive||e.state==='dying')continue;if(Math.hypot(f.pos.x-e.x,f.pos.z-e.z)<0.45+e.size*0.55&&Math.abs(f.pos.y-e.y)<1.6){const d=Math.hypot(e.x-f.pos.x,e.z-f.pos.z)||0.01;hitCinder(e,2,(e.x-f.pos.x)/d*7,(e.z-f.pos.z)/d*7);hit=true;break;}}
  if(!hit)for(const c of crates){if(c.broken)continue;if(Math.hypot(f.pos.x-c.x,f.pos.z-c.z)<0.95&&Math.abs(f.pos.y-c.y)<1.3){breakCrate(c);hit=true;break;}}
  if(!hit)for(const d of dust){if(d.amt<=0)continue;if(Math.hypot(f.pos.x-d.x,f.pos.z-d.z)<1.35&&Math.abs(f.pos.y-0.36)<2){dustHit(d,1.5);hit=true;break;}}
  if(!hit&&insideSolid(f.pos.x,f.pos.y,f.pos.z,0.12))hit=true;
  if(hit||f.life<=0||Math.abs(f.pos.x)>44||Math.abs(f.pos.z)>44)popFire(f);}}
function updateCrates(dt){if(seenCrate)return;for(const c of crates){if(c.broken)continue;if(Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<6&&Math.abs(c.y-P.pos.y)<3){seenCrate=true;showToast('A crate! Spin (Y) or slam it open.');break;}}}
function updatePowers(dt){for(const w of powers){if(w.got)continue;w.t+=dt;w.g.position.y=w.y+Math.sin(time*3+w.ph)*0.13;w.g.rotation.y+=dt*2.2;
  const fl=1+Math.sin(time*17+w.ph)*0.12;w.g.scale.set(fl,Math.min(1,w.t*3)*(2-fl),fl);
  w.pt=(w.pt||0)-dt;if(w.pt<=0){w.pt=0.08;const col=w.kind==='sky'?(Math.random()<0.5?0xff9a3c:0xffe9d0):(w.kind==='bubble'?0xc8f0ff:(Math.random()<0.5?0xff8a2b:0xffe36b));
    spawnP(w.g.position.x+rand(-0.1,0.1),w.g.position.y+0.2,w.g.position.z+rand(-0.1,0.1),rand(-0.2,0.2),rand(0.6,1.4),rand(-0.2,0.2),0.06,col,0.35,0.3,0,0.6);}
  if(!P.dead){tmpV.set(P.pos.x,P.pos.y+0.6,P.pos.z);if(w.g.position.distanceTo(tmpV)<1.1){w.got=true;w.g.visible=false;
    if(w.kind==='bubble'){P.bubble=true;SFX.bubblePower();CAM.fovKick=Math.max(CAM.fovKick,5);showToast('Bubble power! Gust to trap fish — keep it until something hits you.');
      for(let i=0;i<16;i++)spawnP(w.g.position.x,w.g.position.y,w.g.position.z,rand(-3,3),rand(1,4),rand(-3,3),0.07,0xc8f0ff,0.8,0.3,-4,1);}
    else if(w.kind==='sky'){P.hasSkyBlast=true;SFX.powerUp();CAM.fovKick=Math.max(CAM.fovKick,5);showToast('Sky Blast! Jump, then puff again for a long leap.');
      for(let i=0;i<16;i++)spawnP(w.g.position.x,w.g.position.y,w.g.position.z,rand(-3,3),rand(1,4),rand(-3,3),0.09,Math.random()<0.5?0xff9a3c:0xffe9d0,0.8,0.3,-4,1);}
    else{P.fire=true;SFX.powerUp();CAM.fovKick=Math.max(CAM.fovKick,5);showToast('Fire slam! Ground pound for fireballs — keep it until a Gloop hits you.');
      for(let i=0;i<16;i++)spawnP(w.g.position.x,w.g.position.y,w.g.position.z,rand(-3,3),rand(1,4),rand(-3,3),0.09,Math.random()<0.5?0xff8a2b:0xffe36b,0.8,0.3,-4,1);}
    updateHUD();}}}}
function updateSteamVents(dt){for(const v of steamVents){v.pt-=dt;if(v.pt>0)continue;v.pt=0.1;
  spawnP(v.x+rand(-0.2,0.2),v.y+0.2,v.z+rand(-0.2,0.2),rand(-0.3,0.3),rand(1.5,3.2),rand(-0.3,0.3),rand(0.06,0.1),0xfff0e0,rand(0.5,0.8),0.6,0,0.55);}}
function updateHearts(dt){for(const h of hearts){if(h.got)continue;h.t+=dt;h.g.position.y=h.y+Math.sin(time*3+h.ph)*0.1;h.g.rotation.y+=dt*2;h.g.scale.setScalar(0.9*Math.min(1,h.t*3));
  if(!P.dead){tmpV.set(P.pos.x,P.pos.y+0.6,P.pos.z);if(h.g.position.distanceTo(tmpV)<1.05){h.got=true;h.g.visible=false;P.hp=Math.min(P.maxHp,P.hp+1);SFX.heal();for(let i=0;i<12;i++)spawnP(h.g.position.x,h.g.position.y,h.g.position.z,rand(-2,2),rand(1,4),rand(-2,2),0.07,0xff8fa8,0.7,0.3,-5,1);updateHUD();}}}}

