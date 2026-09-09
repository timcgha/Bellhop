// Web Hero's one narrow gameplay exception: a confirmed, persistent web shot.
// Eligibility comes only from the authoritative equipped-skin selection.
const WEB_SHOT=Object.freeze({speed:18,lifetime:1,range:16,cooldown:0.45,wrapTime:0.8,coneDeg:30,radius:0.18,maxShots:4});
const webShots=[],webCaptures=[],webEvents=[];
let webShotCooldown=0,webSerial=0;

function isWebHeroEquipped(){return skinSelection.snapshot().equipped==='web-hero';}
function webRecord(type,data){webEvents.push({seq:++webSerial,time:+time.toFixed(3),type,...(data||{})});if(webEvents.length>160)webEvents.splice(0,webEvents.length-160);}
function webPose(kind,e){
  if(kind==='gloop')return {x:e.x,y:e.y+0.55*e.size,z:e.z,r:0.58*e.size,h:1.05*e.size};
  if(kind==='shark')return {x:e.x,y:e.y,z:e.z,r:0.9,h:0.9};
  if(kind==='spikefish')return {x:e.x,y:e.y,z:e.z,r:0.72,h:0.8};
  if(kind==='cinder')return {x:e.x,y:e.y+0.55*e.size,z:e.z,r:0.6*e.size,h:1.05*e.size};
  if(kind==='wisp')return {x:e.g.position.x,y:e.g.position.y,z:e.g.position.z,r:0.68,h:1.1};
  if(kind==='saucer')return {x:e.x,y:e.y+(e.bob||0),z:e.z,r:0.9*e.size,h:0.72*e.size};
  return {x:e.x,y:e.y+1.15,z:e.z,r:0.72,h:2.25};
}
function webFamilies(){return [
  {kind:'gloop',list:gloops,ok:e=>e.alive&&e.state!=='dying',defeat:e=>hitGloop(e,Math.max(1,e.hp),0,0)},
  {kind:'shark',list:sharks,ok:e=>e.alive&&e.state!=='trapped',defeat:e=>killShark(e,false)},
  {kind:'spikefish',list:spikefish,ok:e=>e.alive,defeat:e=>killSpikefish(e)},
  {kind:'cinder',list:cinders,ok:e=>e.alive&&e.state!=='dying',defeat:e=>hitCinder(e,Math.max(1,e.hp),0,0)},
  {kind:'wisp',list:wisps,ok:e=>e.alive,defeat:e=>extinguishWisp(e)},
  {kind:'saucer',list:saucers,ok:e=>e.alive&&!e.targetDummy&&e.state!=='dying',defeat:e=>hitSaucer(e,Math.max(1,e.hp))},
  {kind:'snowman',list:snowmen,ok:e=>e.alive,defeat:e=>hitSnowman(e,Math.max(1,e.hp),'web')}
];}
function webEligibleTargets(){
  const out=[];for(const f of webFamilies())for(let i=0;i<f.list.length;i++){const e=f.list[i];if(f.ok(e)&&!e.webCaptured)out.push({family:f,index:i,e,pose:webPose(f.kind,e)});}return out;
}
function webLineBlocked(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  for(let i=1;i<=18;i++){const k=i/19;if(insideSolid(a.x+dx*k,a.y+dy*k,a.z+dz*k,WEB_SHOT.radius))return true;}return false;
}
function webAim(origin){
  const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),cos=Math.cos(WEB_SHOT.coneDeg*Math.PI/180);let best=null;
  for(const t of webEligibleTargets()){
    const dx=t.pose.x-origin.x,dy=t.pose.y-origin.y,dz=t.pose.z-origin.z,d=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz)||1;
    const dot=(dx*fx+dz*fz)/flat;if(d>WEB_SHOT.range||dot<cos||webLineBlocked(origin,t.pose))continue;
    const score=d+(1-dot)*5;if(!best||score<best.score)best={...t,score,d};
  }
  if(best){const dx=best.pose.x-origin.x,dy=best.pose.y-origin.y,dz=best.pose.z-origin.z,l=Math.hypot(dx,dy,dz)||1;return {x:dx/l,y:dy/l,z:dz/l,target:best};}
  return {x:fx,y:0,z:fz,target:null};
}
function webProjectileVisual(){
  const g=new THREE.Group(),white=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.95,depthWrite:false}),blue=new THREE.MeshBasicMaterial({color:0xbdeaff,transparent:true,opacity:0.8,depthWrite:false});
  g.add(mesh(SPH,white,0,0,0,0.17));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.025,5,16),blue);ring.rotation.x=Math.PI/2;g.add(ring);g.userData.webProjectile=true;return g;
}
function webWrapVisual(family,pose){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.92,wireframe:true,depthWrite:false}),edge=new THREE.MeshBasicMaterial({color:0x246db5,transparent:true,opacity:0.42,wireframe:true,depthWrite:false});
  const backing=new THREE.Mesh(new THREE.SphereGeometry(1.035,14,10),edge);g.add(backing);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),mat);g.add(shell);
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.01,0.035,6,28),mat);if(i===0)ring.rotation.x=Math.PI/2;if(i===1)ring.rotation.y=Math.PI/2;g.add(ring);}
  g.position.set(pose.x,pose.y,pose.z);g.scale.set(Math.max(pose.r,0.48),Math.max(pose.h*0.58,0.5),Math.max(pose.r,0.48));g.userData={webWrap:true,family};scene.add(g);return g;
}
function fireWebShot(input){
  if(!started||paused||won||P.dead||!isWebHeroEquipped()||webShotCooldown>0||webShots.length>=WEB_SHOT.maxShots)return false;
  const origin={x:P.pos.x,y:P.pos.y+0.82,z:P.pos.z},aim=webAim(origin),g=webProjectileVisual();g.position.set(origin.x,origin.y,origin.z);scene.add(g);
  webShots.push({g,pos:new THREE.Vector3(origin.x,origin.y,origin.z),dir:aim,life:WEB_SHOT.lifetime,travel:0,input:input||'unknown'});webShotCooldown=WEB_SHOT.cooldown;
  webRecord('shot',{input:input||'unknown',aimFamily:aim.target&&aim.target.family.kind||null});SFX.webShot();return true;
}
function removeWebShot(i,reason){const s=webShots[i];if(s&&s.g&&s.g.parent)s.g.parent.remove(s.g);webShots.splice(i,1);if(reason)webRecord('shot-ended',{reason});}
function captureEnemy(target){
  const e=target.e;if(!target.family.ok(e)||e.webCaptured)return false;const pose=webPose(target.family.kind,e);
  const saved={alive:e.alive,visible:e.g.visible,state:e.state,vx:e.vx,vy:e.vy,vz:e.vz,wind:e.wind,spitT:e.spitT};
  e.webCaptured=true;e.alive=false;if('vx'in e)e.vx=0;if('vy'in e)e.vy=0;if('vz'in e)e.vz=0;if('wind'in e)e.wind=0;e.g.visible=true;
  webCaptures.push({family:target.family,e,index:target.index,wrap:webWrapVisual(target.family.kind,pose),left:WEB_SHOT.wrapTime,saved,done:false});
  webRecord('wrapped',{family:target.family.kind,index:target.index});SFX.webWrap();return true;
}
function restoreCaptured(c){
  const e=c.e,s=c.saved;e.webCaptured=false;e.alive=s.alive;e.g.visible=s.visible;if(s.state!==undefined)e.state=s.state;
  for(const k of['vx','vy','vz','wind','spitT'])if(s[k]!==undefined)e[k]=s[k];
}
function finishCapture(i){
  const c=webCaptures[i];if(!c||c.done)return;c.done=true;if(c.wrap&&c.wrap.parent)c.wrap.parent.remove(c.wrap);
  const e=c.e;e.webCaptured=false;e.alive=true;e.g.visible=true;c.family.defeat(e);
  // Shared dissolve handlers already awarded/released exactly once. The web's
  // wrap owns the visible exit, so suppress their later duplicate visual phase.
  e.alive=false;e.g.visible=false;e.defeatedBy='web';e.webRemoved=true;
  webRecord('disappeared',{family:c.family.kind,index:c.index});webCaptures.splice(i,1);
}
function clearWebState(restore,reason){
  const had=webShots.length||webCaptures.length;
  for(const s of webShots)if(s.g&&s.g.parent)s.g.parent.remove(s.g);webShots.length=0;
  for(const c of webCaptures){if(c.wrap&&c.wrap.parent)c.wrap.parent.remove(c.wrap);if(restore)restoreCaptured(c);else{c.e.webCaptured=false;c.e.alive=false;c.e.g.visible=false;}}webCaptures.length=0;webShotCooldown=0;
  if(had)webRecord('cleanup',{reason:reason||'state-change',restored:!!restore});
}
function webTargetHit(x,y,z){
  let best=null;for(const t of webEligibleTargets()){const p=t.pose,d=Math.hypot(x-p.x,y-p.y,z-p.z);if(d<=p.r+WEB_SHOT.radius&&(!best||d<best.d))best={...t,d};}return best;
}
function updateWebShots(dt){
  webShotCooldown=Math.max(0,webShotCooldown-dt);
  if(!started||won||P.dead||!isWebHeroEquipped()){if(webShots.length||webCaptures.length)clearWebState(!won,!started?'menu':won?'victory':P.dead?'death':'skin-change');return;}
  if(IN.web)fireWebShot('input');
  for(let i=webShots.length-1;i>=0;i--){const s=webShots[i];s.life-=dt;const dist=Math.min(WEB_SHOT.speed*dt,WEB_SHOT.range-s.travel);if(dist<=0||s.life<=0){removeWebShot(i,s.life<=0?'lifetime':'range');continue;}
    const steps=Math.max(1,Math.ceil(dist/0.16)),step=dist/steps;let ended=false;
    for(let n=0;n<steps;n++){s.pos.x+=s.dir.x*step;s.pos.y+=s.dir.y*step;s.pos.z+=s.dir.z*step;s.travel+=step;
      if(insideSolid(s.pos.x,s.pos.y,s.pos.z,WEB_SHOT.radius)){removeWebShot(i,'solid');ended=true;break;}
      const hit=webTargetHit(s.pos.x,s.pos.y,s.pos.z);if(hit){captureEnemy(hit);removeWebShot(i,'enemy');ended=true;break;}
    }
    if(!ended){s.g.position.copy(s.pos);if(s.travel>=WEB_SHOT.range)removeWebShot(i,'range');else{for(let p=0;p<2;p++)spawnP(s.pos.x,s.pos.y,s.pos.z,rand(-0.2,0.2),rand(-0.1,0.25),rand(-0.2,0.2),0.035,0xffffff,0.15,0.1,-0.2,0.75);}}
  }
  for(let i=webCaptures.length-1;i>=0;i--){const c=webCaptures[i],p=webPose(c.family.kind,c.e);c.left-=dt;c.wrap.position.set(p.x,p.y,p.z);c.wrap.rotation.y+=dt*1.7;c.wrap.rotation.z=Math.sin(time*7)*0.05;if(c.left<=0)finishCapture(i);}
}
function updateWebHeroTouchControl(){
  const enabled=isWebHeroEquipped(),active=enabled&&started,b=$('bX');document.body.classList.toggle('web-hero-equipped',enabled);if(b){b.disabled=!active;b.setAttribute&&b.setAttribute('aria-hidden',active?'false':'true');}
}
function webEvidenceAimAt(kind,index,distance){
  const f=webFamilies().find(x=>x.kind===kind),e=f&&f.list[index||0];if(!f||!e||!f.ok(e))return null;const p=webPose(kind,e),d=distance||4;
  P.pos.set(p.x,p.y-0.82,p.z+d);P.vel.set(0,0,0);P.yaw=Math.PI;CAM.yaw=0;CAM.lastManual=-9;return {family:kind,index:index||0,distance:d};
}

const _webBaseClearLevelWorld=clearLevelWorld;
clearLevelWorld=function(){clearWebState(true,'level-exit');return _webBaseClearLevelWorld();};
const _webBaseRespawn=respawn;
respawn=function(){clearWebState(true,'respawn');return _webBaseRespawn();};
window.__WEB_SHOT={
  constants:WEB_SHOT,
  snapshot:()=>({equipped:isWebHeroEquipped(),available:started&&!paused&&!won&&!P.dead&&isWebHeroEquipped(),cooldown:+webShotCooldown.toFixed(3),shots:webShots.map(s=>({input:s.input,life:+s.life.toFixed(3),travel:+s.travel.toFixed(3)})),captures:webCaptures.map(c=>({family:c.family.kind,index:c.index,left:+c.left.toFixed(3),visible:!!(c.wrap&&c.wrap.visible)})),events:webEvents.slice()}),
  eligible:()=>webEligibleTargets().map(t=>({family:t.family.kind,index:t.index,x:t.pose.x,y:t.pose.y,z:t.pose.z})),
  evidenceAimAt:webEvidenceAimAt,
  clear:()=>clearWebState(true,'evidence-clear')
};
