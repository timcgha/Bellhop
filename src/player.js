function buildPlayer(){
  const g=new THREE.Group();
  const teal=pho(0x2ba3a6,90,0x9ff0f4),brass=pho(0xd1a83c,140,0xfff0b8),silver=pho(0xc9ced4,70,0xffffff),dark=pho(0x2b3036,30,0x222222),white=pho(0xffffff,80,0xffffff),iris=pho(0x2f8fe6,80,0xffffff),pupil=lam(0x111111);
  const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-0.17,0.3,0);legR.position.set(0.17,0.3,0);
  [legL,legR].forEach(L=>{L.add(mesh(CYL,teal,0,-0.13,0,0.09,0.24,0.09));L.add(mesh(BOXG,dark,0,-0.27,0.03,0.24,0.1,0.3));g.add(L);});
  const bel=new THREE.Group();bel.position.y=0.3;g.add(bel);
  bel.add(mesh(CYL,silver,0,0.285,0,0.34,0.57,0.34));
  const seams=[];
  for(let i=0;i<6;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(0.35,0.03,8,20),pho(0xc9ced4,70,0xffffff));r.rotation.x=Math.PI/2;r.position.y=0.06+i*0.09;bel.add(r);seams.push(r);}
  const head=new THREE.Group();head.position.y=0.87;g.add(head);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.46,22,14,0,TAU,0,Math.PI*0.6),teal);dome.position.y=0.18;head.add(dome);
  head.add(mesh(CYL,teal,0,0.1,0,0.46,0.2,0.46));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.46,0.035,8,28),brass);rim.rotation.x=Math.PI/2;head.add(rim);
  const eyes=[];[-0.16,0.16].forEach(x=>{const e=new THREE.Group();e.position.set(x,0.22,0.39);e.add(mesh(SPH,white,0,0,0,0.115));e.add(mesh(SPH,iris,0,0,0.075,0.062));e.add(mesh(SPH,pupil,0,0.005,0.115,0.032));const gog=new THREE.Mesh(new THREE.TorusGeometry(0.125,0.022,8,20),brass);gog.position.z=0.06;e.add(gog);head.add(e);eyes.push(e);});
  const mouth=mesh(BOXG,dark,0,0.03,0.44,0.16,0.05,0.03);head.add(mouth);
  head.add(mesh(CYL,brass,0,0.7,0,0.075,0.3,0.075));head.add(mesh(CYL,dark,0,0.86,0,0.05,0.04,0.05));
  const armL=new THREE.Group(),armR=new THREE.Group();armL.position.set(-0.46,0.08,0);armR.position.set(0.46,0.08,0);
  [[armL,-1],[armR,1]].forEach(a=>{const A=a[0],sgn=a[1];A.add(mesh(SPH,brass,0,0,0,0.1));A.add(mesh(CYL,teal,sgn*0.06,-0.16,0,0.07,0.28,0.07));A.add(mesh(SPH,dark,sgn*0.08,-0.32,0,0.1));head.add(A);});
  // Compact mechanical glide wings — fold until a powered Sky Blast puff (visual deploys before glide physics).
  const wings=new THREE.Group();wings.position.set(0,0.55,-0.02);bel.add(wings);
  const wingMat=pho(0xb8c0c8,90,0xe8eef4),hingeMat=brass;
  const wingL=new THREE.Group(),wingR=new THREE.Group();
  wingL.position.set(-0.38,0,0);wingR.position.set(0.38,0,0);
  [[wingL,-1],[wingR,1]].forEach(a=>{
    const Wg=a[0],sgn=a[1];
    Wg.add(mesh(BOXG,hingeMat,sgn*0.02,0,0,0.08,0.1,0.12));
    const plate=mesh(BOXG,wingMat,sgn*0.42,0.02,-0.04,0.72,0.04,0.34);
    plate.userData.plate=true;Wg.add(plate);
    Wg.add(mesh(BOXG,hingeMat,sgn*0.55,0.0,-0.04,0.08,0.06,0.28));
  });
  wings.add(wingL);wings.add(wingR);
  wings.visible=false;wings.userData={wingL,wingR,open:0};
  g.scale.setScalar(0.72);g.userData={legL,legR,bel,head,eyes,mouth,armL,armR,seams,wings};return g;
}
player=buildPlayer();scene.add(player);
window.__PLAYER=()=>player;
(function(){const jg=new THREE.Group();
  [-0.17,0.17].forEach(x=>{
    const outer=mesh(CONE,new THREE.MeshBasicMaterial({color:0x5ec8ff,transparent:true,opacity:0.85}),x,-0.34,0,0.14,0.68,0.14);outer.rotation.z=Math.PI;jg.add(outer);
    const inner=mesh(CONE,new THREE.MeshBasicMaterial({color:0xe4f8ff,transparent:true,opacity:0.95}),x,-0.21,0,0.075,0.42,0.075);inner.rotation.z=Math.PI;jg.add(inner);});
  jg.visible=false;player.add(jg);player.userData.jet=jg;})();
(function(){const f=new THREE.Group();f.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xff7a1f}),0,0.14,0,0.13,0.4,0.13));f.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xffe36b}),0,0.1,0,0.07,0.24,0.07));f.position.y=0.92;f.visible=false;player.userData.head.add(f);player.userData.flame=f;})();
// Projected shadow — Stage 4.7A player readability.
// Invariant: readability aids increase only as Pling gets harder to track.
// This stage strengthens spatial grounding only (no camera / halo / locator).
// Scale shrinks with height (depth cue). Opacity stays strong through normal play.
const SHADOW_OPACITY=0.44;
const SHADOW_MIN_PLAY_OPACITY=0.38;
const SHADOW_EXTREME_HEIGHT_FADE_START=14;
const SHADOW_EXTREME_HEIGHT_FADE_END=28;
const SHADOW_SCALE_MIN=0.35;
const SHADOW_SCALE_RATE=0.05;
const SHADOW_RIM_OPACITY=0.26;
const SHADOW_CORE_COLOR=0x0a0a12;
const SHADOW_RIM_COLOR=0xe8eef6;
const SHADOW_RIM_LAVA_COLOR=0xffc9a0;
(function buildPlayerShadow(){
  shadow=new THREE.Group();
  const rim=new THREE.Mesh(new THREE.CircleGeometry(0.72,24),new THREE.MeshBasicMaterial({color:SHADOW_RIM_COLOR,transparent:true,opacity:SHADOW_RIM_OPACITY,depthWrite:false}));
  const core=new THREE.Mesh(new THREE.CircleGeometry(0.48,24),new THREE.MeshBasicMaterial({color:SHADOW_CORE_COLOR,transparent:true,opacity:SHADOW_OPACITY,depthWrite:false}));
  rim.rotation.x=core.rotation.x=-Math.PI/2;
  rim.renderOrder=1;core.renderOrder=2;
  rim.position.y=-0.001;
  shadow.add(rim);shadow.add(core);
  shadow.userData={rim,core};
  scene.add(shadow);
  window.__SHADOW={
    SHADOW_OPACITY,SHADOW_MIN_PLAY_OPACITY,SHADOW_EXTREME_HEIGHT_FADE_START,SHADOW_EXTREME_HEIGHT_FADE_END,
    SHADOW_SCALE_MIN,SHADOW_SCALE_RATE,SHADOW_RIM_OPACITY,SHADOW_CORE_COLOR,SHADOW_RIM_COLOR,SHADOW_RIM_LAVA_COLOR,
    group:shadow,core,rim,
    state:{scale:1,opacity:SHADOW_OPACITY,rimOpacity:SHADOW_RIM_OPACITY,h:0,y:0,kind:'ground',warm:false}
  };
})();
function shadowOpacityForHeight(h){
  // Flat through the normal play envelope; only soften well above ordinary jumps / Sky Blast.
  if(h<=SHADOW_EXTREME_HEIGHT_FADE_START)return SHADOW_OPACITY;
  const t=clamp((h-SHADOW_EXTREME_HEIGHT_FADE_START)/(SHADOW_EXTREME_HEIGHT_FADE_END-SHADOW_EXTREME_HEIGHT_FADE_START),0,1);
  return lerp(SHADOW_OPACITY,SHADOW_OPACITY*0.32,t);
}
function shadowScaleForHeight(h){return clamp(1-h*SHADOW_SCALE_RATE,SHADOW_SCALE_MIN,1);}

const P=window.__P={spawn:{x:0,y:0,z:10},pos:new THREE.Vector3(0,0,10),vel:new THREE.Vector3(),yaw:Math.PI,grounded:false,wasGrounded:false,lastGround:-9,jumpBuf:-9,jumping:false,puff:true,slam:0,hangT:0,gustCD:0,bonkCD:0,bonkT:0,sq:1,sqV:0,sqT:1,footT:0,surf:'grass',run:0,mouthT:0,blinkT:2,blinkAnim:0,inFan:false,splT:0,puffAir:0,hover:false,hovT:0,hoverS:null,hp:4,maxHp:4,inv:0,dead:false,deadT:0,inGoo:false,fire:false,bubble:false,hasSkyBlast:false,leapBoost:new THREE.Vector3(),glideT:0,glideArmed:false,wingsOut:false,lavaRecT:0,lavaRecMax:0,anchorSettleT:0,safeAnchor:new THREE.Vector3(0,0,10),lavaRecFrom:new THREE.Vector3(),jetT:0,jetP:0,jetHits:[],moveZone:'grounded',spaceThrust:false,spaceThrustS:null,spaceThrustY:0};
let R=0.36,H=1.15,SPEED=6.8,ACC=44,DEC=60,AIRACC=20,GRAV=-30,JUMPV=10.5,PUFFV=9.4,MAXFALL=-32,COYOTE=0.12,BUFFER=0.15,STEP=0.42;
let HOVER_HELD=1.0,HOVER_REL=0.5,HOVER_DRIFT=-1.6,SLAM_HANG=0.14,SLAM_FALL=-34,SLAM_REBOUND=8,JET_T=0.38,BONKR=2.05,BONK_CD=0.5;
// Sky Blast tuning — inactive until a level supplies skyBlast (Level 3). Separate from ordinary SPEED/PUFFV.
// Glide fields are Stage 4.5: short descent softener after crest — not a second flight mode.
let SKY={puffVMul:1,boostMax:0,boostDecay:2,glideDur:0,glideFallCap:-32,glideStartVy:0};
// Lava recovery / safe-anchor — Level 3. Hurt invulnerability remains 1.4s; recovery must stay ≤ that.
// Anchor settle rejects momentary clips; clearance keeps the saved point inset from lava edges.
// Speed is intentionally NOT a gate — a successful running landing must still claim the far pad.
let LAVA_ANCHOR_SETTLE=0.22,LAVA_ANCHOR_CLEAR=0.85,LAVA_RECOVERY=0.42,HURT_INV=1.4;
function applyPhysics(ph){
  R=ph.r;H=ph.h;SPEED=ph.speed;ACC=ph.acc;DEC=ph.dec;AIRACC=ph.airAcc;
  GRAV=ph.grav;JUMPV=ph.jumpV;PUFFV=ph.puffV;MAXFALL=ph.maxFall;
  COYOTE=ph.coyote;BUFFER=ph.buffer;STEP=ph.step;
  HOVER_HELD=ph.hoverHeld;HOVER_REL=ph.hoverReleased;HOVER_DRIFT=ph.hoverDrift;
  SLAM_HANG=ph.slamHang;SLAM_FALL=ph.slamFall;SLAM_REBOUND=ph.slamRebound;
  JET_T=ph.jetTime;BONKR=ph.bonkR;BONK_CD=ph.bonkCD;
}
function applySkyBlastTuning(s){
  if(!s){SKY={puffVMul:1,boostMax:0,boostDecay:2,glideDur:0,glideFallCap:-32,glideStartVy:0};return;}
  SKY={
    puffVMul:s.puffVMul,boostMax:s.boostMax,boostDecay:s.boostDecay,
    glideDur:s.glideDur!=null?s.glideDur:0,
    glideFallCap:s.glideFallCap!=null?s.glideFallCap:-32,
    glideStartVy:s.glideStartVy!=null?s.glideStartVy:0
  };
}
function applyLavaTuning(L){
  LAVA_ANCHOR_SETTLE=(L&&L.anchorSettle!=null)?L.anchorSettle:0.22;
  LAVA_ANCHOR_CLEAR=(L&&L.anchorClear!=null)?L.anchorClear:0.85;
  LAVA_RECOVERY=(L&&L.lavaRecovery!=null)?L.lavaRecovery:0.42;
}
// Level 4 open-space flight — inactive unless level supplies openSpace config.
let SPACE_THRUST=5.5,SPACE_CAP=9,SPACE_COAST=4,SPACE_COAST_DEC=2.8,SPACE_STEER_T=38,SPACE_STEER_C=22,SPACE_BRAKE=52,SPACE_LEVEL_BAND=0.18,SPACE_VERT_GAIN=0.92,SPACE_TAKEOFF_BIAS=0.32,SPACE_TAKEOFF_H=3.5,SPACE_JUMP=8.5,SPACE_PUFF=7.5;
function applySpaceTuning(cfg){
  if(!cfg){SPACE_THRUST=5.5;SPACE_CAP=9;SPACE_COAST=4;SPACE_COAST_DEC=2.8;SPACE_STEER_T=38;SPACE_STEER_C=22;SPACE_BRAKE=52;SPACE_LEVEL_BAND=0.18;SPACE_VERT_GAIN=0.92;SPACE_TAKEOFF_BIAS=0.32;SPACE_TAKEOFF_H=3.5;SPACE_JUMP=8.5;SPACE_PUFF=7.5;return;}
  SPACE_THRUST=cfg.thrustHold;SPACE_CAP=cfg.thrustCap;SPACE_COAST=cfg.coastCap;SPACE_COAST_DEC=cfg.coastDecay;
  SPACE_STEER_T=cfg.steerThrust;SPACE_STEER_C=cfg.steerCoast;SPACE_BRAKE=cfg.brake;
  SPACE_LEVEL_BAND=cfg.levelBand!=null?cfg.levelBand:0.18;
  SPACE_VERT_GAIN=cfg.vertGain!=null?cfg.vertGain:0.92;
  SPACE_TAKEOFF_BIAS=cfg.takeoffBias!=null?cfg.takeoffBias:0.32;
  SPACE_TAKEOFF_H=cfg.takeoffAssistH!=null?cfg.takeoffAssistH:3.5;
  SPACE_JUMP=cfg.jumpV;SPACE_PUFF=cfg.puffV;
}
function spaceThrustDir(wx,wz,wl,mz,cfg){
  const band=cfg.levelBand!=null?cfg.levelBand:SPACE_LEVEL_BAND;
  const vGain=cfg.vertGain!=null?cfg.vertGain:SPACE_VERT_GAIN;
  const takeoff=cfg.takeoffBias!=null?cfg.takeoffBias:SPACE_TAKEOFF_BIAS;
  const takeoffH=cfg.takeoffAssistH!=null?cfg.takeoffAssistH:SPACE_TAKEOFF_H;
  let tx,tz,ty=0;
  if(mz<-band)ty=(-mz-band)*vGain;
  else if(mz>band)ty=-(mz-band)*vGain;
  if(wl>0.05){tx=wx;tz=wz;}
  else{
    tx=Math.sin(P.yaw)*0.2;tz=Math.cos(P.yaw)*0.2;
    if(Math.abs(ty)<0.02&&nearLandableAssist(P.pos,cfg,takeoffH))ty=takeoff;
  }
  const len=Math.hypot(tx,ty,tz)||1;
  return {x:tx/len,y:ty/len,z:tz/len,tyRaw:ty};
}
function endSpaceThrust(){P.spaceThrust=false;P.spaceThrustY=0;if(P.spaceThrustS){SFX.spaceThrustStop(P.spaceThrustS);P.spaceThrustS=null;}}
function capSpaceVel(v,cap){const sp=Math.hypot(v.x,v.y,v.z);if(sp>cap){const k=cap/sp;v.x*=k;v.y*=k;v.z*=k;}}
window.__PHYS=()=>({speed:SPEED,acc:ACC,dec:DEC,airAcc:AIRACC,grav:GRAV,jumpV:JUMPV,puffV:PUFFV,maxFall:MAXFALL,coyote:COYOTE,buffer:BUFFER,step:STEP,r:R,h:H});
window.__SPACEPHYS=()=>({thrustHold:SPACE_THRUST,thrustCap:SPACE_CAP,coastCap:SPACE_COAST,coastDecay:SPACE_COAST_DEC,steerThrust:SPACE_STEER_T,steerCoast:SPACE_STEER_C,brake:SPACE_BRAKE,levelBand:SPACE_LEVEL_BAND,vertGain:SPACE_VERT_GAIN,takeoffBias:SPACE_TAKEOFF_BIAS,takeoffAssistH:SPACE_TAKEOFF_H,jumpV:SPACE_JUMP,puffV:SPACE_PUFF});
window.__MOVEMENT=()=>({zone:P.moveZone,spaceThrust:!!P.spaceThrust,grounded:!!P.grounded,speed:Math.hypot(P.vel.x,P.vel.y,P.vel.z),horiz:Math.hypot(P.vel.x,P.vel.z),vy:P.vel.y,pitch:CAM.pitch,thrustY:P.spaceThrustY||0});
window.__SKY=()=>({puffVMul:SKY.puffVMul,boostMax:SKY.boostMax,boostDecay:SKY.boostDecay,glideDur:SKY.glideDur,glideFallCap:SKY.glideFallCap,glideStartVy:SKY.glideStartVy});
window.__LAVA=()=>({anchorSettle:LAVA_ANCHOR_SETTLE,anchorClear:LAVA_ANCHOR_CLEAR,recovery:LAVA_RECOVERY,hurtInv:HURT_INV});
window.__VOID=()=>({y:CURRENT_LEVEL&&CURRENT_LEVEL.voidY!=null?CURRENT_LEVEL.voidY:null,floor:CURRENT_LEVEL&&CURRENT_LEVEL.voidFloor!=null?CURRENT_LEVEL.voidFloor:null});
function clearLeapBoost(){P.leapBoost.set(0,0,0);}
function clearGlide(){P.glideT=0;P.glideArmed=false;P.wingsOut=false;}
function leapBoostMag(){return Math.hypot(P.leapBoost.x,P.leapBoost.z);}
// Capture run-up into a stored horizontal boost. Does not stack; call only when consuming P.puff.
function fireLeapBoost(){
  if(!(SKY.boostMax>0)||!P.hasSkyBlast)return;
  const hx=P.vel.x,hz=P.vel.z,run=Math.hypot(hx,hz);
  const scale=clamp(run/SPEED,0,1);
  let dx,dz;
  if(run>0.05){dx=hx/run;dz=hz/run;}
  else{dx=Math.sin(P.yaw);dz=Math.cos(P.yaw);}
  P.leapBoost.x=dx*SKY.boostMax*scale;
  P.leapBoost.z=dz*SKY.boostMax*scale;
  // Arm physical glide for crest/descent. Wings deploy NOW (visual only) so the leap reads as a glide immediately.
  if(SKY.glideDur>0&&P.glideT<=0)P.glideArmed=true;
  P.wingsOut=true;
}
function decayLeapBoost(dt){
  if(leapBoostMag()<1e-4){clearLeapBoost();return;}
  const k=Math.exp(-SKY.boostDecay*dt);
  P.leapBoost.x*=k;P.leapBoost.z*=k;
  if(leapBoostMag()<0.05)clearLeapBoost();
}
function initSafeAnchor(x,y,z){P.safeAnchor.set(x,y,z);P.anchorSettleT=0;}
function pointInLava(x,y,z){
  // Vertical band is tight on purpose: a successful Sky Blast may skim above the
  // surface; contact should mean falling into / standing in the hazard, not flying over it.
  for(const lv of lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+H>lv.min.y-0.05)return lv;
  }
  return null;
}
function playerInLava(){return pointInLava(P.pos.x,P.pos.y,P.pos.z);}
function lavaVerticallyRelevant(lv,y){
  // Basins under elevated pads must not poison safe-anchor clearance while the player
  // stands well above them. Only volumes the standing capsule could touch count.
  return y<lv.max.y+0.5&&y+H>lv.min.y-0.05;
}
function lavaClearance(x,z,y){
  // Horizontal distance from the player's capsule edge (radius R) to the nearest
  // lava AABB that is vertically relevant at y — not just the center point.
  if(y==null)y=P.pos.y;
  let best=Infinity;
  for(const lv of lavas){
    if(!lavaVerticallyRelevant(lv,y))continue;
    const cx=clamp(x,lv.min.x,lv.max.x),cz=clamp(z,lv.min.z,lv.max.z);
    const d=Math.hypot(x-cx,z-cz)-R;
    if(d<best)best=d;
  }
  return best;
}
function surfaceIsAnchorEligible(surf){
  if(!surf)return false;
  if(surf==='lava'||surf==='goo'||surf==='water')return false;
  return true;
}
function updateSafeAnchor(dt){
  if(P.lavaRecT>0||P.dead||P.inv>0.05){P.anchorSettleT=0;return;}
  if(!P.grounded||playerInLava()){P.anchorSettleT=0;return;}
  if(!surfaceIsAnchorEligible(P.surf)){P.anchorSettleT=0;return;}
  // Inset from lava edges — allows full-speed traversal on deep safe ground, rejects lip clips.
  if(lavaClearance(P.pos.x,P.pos.z,P.pos.y)<LAVA_ANCHOR_CLEAR){P.anchorSettleT=0;return;}
  P.anchorSettleT+=dt;
  if(P.anchorSettleT>=LAVA_ANCHOR_SETTLE){
    P.safeAnchor.set(P.pos.x,P.pos.y,P.pos.z);
    P.anchorSettleT=LAVA_ANCHOR_SETTLE;
  }
}
function lavaYeouchFX(){
  SFX.lavaYeouch();CAM.shake=Math.max(CAM.shake,0.55);CAM.fovKick=Math.max(CAM.fovKick,7);rumble(160,0.8,0.4);
  spoutWorld(tmpV);
  for(let i=0;i<16;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-2.5,2.5),rand(2,5),rand(-2.5,2.5),rand(0.08,0.16),Math.random()<0.5?0xffe9d0:0xff9a3c,rand(0.4,0.7),0.5,-2,0.85);
  spawnRing(P.pos.x,P.pos.y+0.1,P.pos.z,0xff9a3c,0.4,5,0.4);
}
function beginLavaRecovery(){
  // Lava never removes hasSkyBlast: the power is the tool for the hazard, so the hazard must not confiscate it
  // (Level 3 frozen spec — deliberate exception to "kept until something hits you"). Enemy hits still take it.
  clearLeapBoost();clearGlide();
  P.puffAir=0;endHover();P.slam=0;P.jumping=false;P.grounded=false;
  P.lavaRecMax=LAVA_RECOVERY;P.lavaRecT=LAVA_RECOVERY;
  P.lavaRecFrom.copy(P.pos);
  P.vel.set(0,0,0);
  P.anchorSettleT=0;
}
function beginVoidRecovery(){
  // Level-owned impossible-world safety net. No heart cost — this is a geometry bug state, not a hazard.
  if(won||P.dead||P.lavaRecT>0)return;
  beginLavaRecovery();
  SFX.refill();CAM.shake=Math.max(CAM.shake,0.25);
  showToast('Whoops!');
}
function lavaContact(){
  if(won||P.dead||P.lavaRecT>0)return;
  if(P.inv>0)return; // i-frames block another heart, same as goo
  P.hp--;P.inv=HURT_INV;
  beginLavaRecovery();
  lavaYeouchFX();
  updateHUD();
  if(P.hp<=0){P.dead=true;P.deadT=1.8;P.lavaRecT=0;SFX.deflate();showToast('Out of puff! Back to the last checkpoint…');}
  else showToast('Yeouch! Hot!');
}
function updateLavaRecovery(dt){
  if(P.lavaRecT<=0)return false;
  P.lavaRecT-=dt;
  clearLeapBoost();clearGlide();
  const dur=P.lavaRecMax||LAVA_RECOVERY;
  const k=smooth(clamp(1-Math.max(P.lavaRecT,0)/dur,0,1));
  const ax=P.safeAnchor.x,ay=P.safeAnchor.y,az=P.safeAnchor.z;
  P.pos.x=lerp(P.lavaRecFrom.x,ax,k);
  P.pos.z=lerp(P.lavaRecFrom.z,az,k);
  // Comic pop arc — never leave him sunk in the hazard volume.
  P.pos.y=lerp(P.lavaRecFrom.y,ay,k)+Math.sin(k*Math.PI)*2.4;
  P.vel.set(0,0,0);
  if(P.lavaRecT<=0){
    P.lavaRecT=0;
    P.pos.set(ax,ay,az);
    P.vel.set(0,0,0);
    P.grounded=true;P.lastGround=time;P.surf='stone';
    if(!P.puff){P.puff=true;refillFX();}
    // Nudge off any residual lava overlap toward the anchor (already on it).
    if(playerInLava()){P.pos.set(ax,ay+0.05,az);}
  }
  return true;
}
function hOverlap(s){const p=P.pos;return p.x+R>s.min.x&&p.x-R<s.max.x&&p.z+R>s.min.z&&p.z-R<s.max.z;}
function pushOutXZ(s){const p=P.pos;const px1=(p.x+R)-s.min.x,px2=s.max.x-(p.x-R),pz1=(p.z+R)-s.min.z,pz2=s.max.z-(p.z-R);const m=Math.min(px1,px2,pz1,pz2);if(m===px1)p.x=s.min.x-R-0.001;else if(m===px2)p.x=s.max.x+R+0.001;else if(m===pz1)p.z=s.min.z-R-0.001;else p.z=s.max.z+R+0.001;}
function collideAxis(ax){const p=P.pos,v=P.vel;for(const s of solids){if(!hOverlap(s))continue;if(p.y+H<=s.min.y+0.001||p.y>=s.max.y-0.001)continue;
  if(s.max.y-p.y<=STEP&&v.y<=0.6){p.y=s.max.y;continue;}
  if(ax==='x'){if(v.x>0)p.x=s.min.x-R-0.001;else if(v.x<0)p.x=s.max.x+R+0.001;else{const c=(s.min.x+s.max.x)/2;p.x=p.x<c?s.min.x-R-0.001:s.max.x+R+0.001;}v.x=0;}
  else{if(v.z>0)p.z=s.min.z-R-0.001;else if(v.z<0)p.z=s.max.z+R+0.001;else{const c=(s.min.z+s.max.z)/2;p.z=p.z<c?s.min.z-R-0.001:s.max.z+R+0.001;}v.z=0;}}}
function spoutWorld(out){const y=(0.3+0.57*P.sq+0.9)*0.72;out.set(P.pos.x,P.pos.y+y,P.pos.z);return out;}
function refillFX(){SFX.refill();spoutWorld(tmpV);for(let i=0;i<4;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-0.6,0.6),rand(1.5,3),rand(-0.6,0.6),rand(0.06,0.1),0xffffff,rand(0.4,0.6),1.5,0,0.8);}
function skyLeapFX(){const c=Math.cos(P.yaw),s=Math.sin(P.yaw);for(let sg=-1;sg<=1;sg+=2){const fx=P.pos.x+sg*0.12*c,fz=P.pos.z-sg*0.12*s;for(let i=0;i<8;i++)spawnP(fx+rand(-0.08,0.08),P.pos.y+0.05,fz+rand(-0.08,0.08),rand(-1.4,1.4),rand(-4.5,-1.8),rand(-1.4,1.4),rand(0.12,0.2),Math.random()<0.5?0xffe9d0:0xffb06a,rand(0.35,0.55),1.4,0,0.9);}spawnRing(P.pos.x,P.pos.y+0.03,P.pos.z,0xffc08a,0.35,4,0.35);}
function puffJumpFX(){const c=Math.cos(P.yaw),s=Math.sin(P.yaw);for(let sg=-1;sg<=1;sg+=2){const fx=P.pos.x+sg*0.12*c,fz=P.pos.z-sg*0.12*s;for(let i=0;i<7;i++)spawnP(fx+rand(-0.08,0.08),P.pos.y+0.05,fz+rand(-0.08,0.08),rand(-1.2,1.2),rand(-4,-1.5),rand(-1.2,1.2),rand(0.12,0.2),0xffffff,rand(0.35,0.6),1.4,0,0.9);}spawnRing(P.pos.x,P.pos.y+0.03,P.pos.z,0xffffff,0.3,3.5,0.35);}
let skyTrailT=0;
function spawnSkySteamTrail(dt){
  const mag=leapBoostMag();if(mag<0.08){skyTrailT=0;return;}
  skyTrailT-=dt;if(skyTrailT>0)return;
  // Density and length track live boost magnitude — not a fixed timer length.
  const n=1+Math.floor(clamp(mag/SKY.boostMax,0,1)*3);
  skyTrailT=0.045+0.04*(1-clamp(mag/Math.max(SKY.boostMax,1e-3),0,1));
  const bx=P.leapBoost.x,bz=P.leapBoost.z,bl=mag||1;
  const tx=-bx/bl,tz=-bz/bl;
  const speed=2.2+mag*0.55;
  for(let i=0;i<n;i++)spawnP(P.pos.x+rand(-0.12,0.12),P.pos.y+0.45+rand(-0.1,0.15),P.pos.z+rand(-0.12,0.12),tx*speed+rand(-0.4,0.4),rand(0.4,1.4),tz*speed+rand(-0.4,0.4),rand(0.08,0.14),Math.random()<0.5?0xfff4e8:0xffd2a8,rand(0.28,0.45)+mag*0.02,1.1+mag*0.04,0,0.7);
}
function grantSkyBlastFromVent(){
  // Steam vent: restores hasSkyBlast and a spent P.puff. Never creates or stacks leapBoost —
  // the player still has to press Jump to fire the powered stroke.
  const needPower=!P.hasSkyBlast,needPuff=!P.puff;
  if(!needPower&&!needPuff)return false;
  P.hasSkyBlast=true;
  if(needPuff){P.puff=true;refillFX();}
  else if(needPower){SFX.powerUp();spoutWorld(tmpV);for(let i=0;i<10;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-2,2),rand(1,3),rand(-2,2),0.08,0xffc08a,0.6,0.3,-3,0.9);}
  return true;
}
function updateSteamVentTouch(dt){
  for(const v of steamVents){
    const dx=P.pos.x-v.x,dz=P.pos.z-v.z;
    if(dx*dx+dz*dz<(v.r+0.2)*(v.r+0.2)&&Math.abs(P.pos.y-v.y)<1.4){
      if(P.grounded||!P.puff||!P.hasSkyBlast)grantSkyBlastFromVent();
    }
  }
}
function gustSteamVents(mx,mz,k){
  for(const v of steamVents){const s=k(v.x,v.z);if(s>0.12){grantSkyBlastFromVent();for(let i=0;i<8;i++)spawnP(v.x,v.y+0.2,v.z,rand(-1,1),rand(2,5),rand(-1,1),0.08,0xfff0e0,0.5,0.5,0,0.7);}}
}
function fireJet(){P.jetT=JET_T;P.jetP=0;P.jetHits.length=0;SFX.jet();}
function jetDamage(){  for(const e of gloops){if(!e.alive||e.state==='dying')continue;if(P.jetHits.indexOf(e)>=0)continue;
  const dx=e.x-P.pos.x,dz=e.z-P.pos.z,d=Math.hypot(dx,dz);if(d>0.55+e.size*0.5)continue;
  if(e.y>P.pos.y+0.15||e.y+0.85*e.size<P.pos.y-0.7)continue;
  P.jetHits.push(e);const n=d||0.01;hitGloop(e,1,dx/n*4.5,dz/n*4.5);
  spawnRing(e.x,e.y+0.15,e.z,0x9fe4ff,0.25,4,0.3);
  for(let i=0;i<6;i++)spawnP(e.x,e.y+0.4,e.z,rand(-2,2),rand(1,3),rand(-2,2),0.09,0x9fe4ff,0.4,0.4,-5,0.9);}
  for(const e of cinders){if(!e.alive||e.state==='dying'||P.jetHits.indexOf(e)>=0)continue;
  const dx=e.x-P.pos.x,dz=e.z-P.pos.z,d=Math.hypot(dx,dz);if(d>0.55+e.size*0.5)continue;
  if(e.y>P.pos.y+0.15||e.y+0.85*e.size<P.pos.y-0.7)continue;
  P.jetHits.push(e);const n=d||0.01;hitCinder(e,1,dx/n*4.5,dz/n*4.5);}
  for(const s of sharks){if(!s.alive||P.jetHits.indexOf(s)>=0)continue;
  const dx=s.x-P.pos.x,dz=s.z-P.pos.z,d=Math.hypot(dx,dz);if(d>0.55)continue;
  if(s.y>P.pos.y+0.15||s.y+0.5<P.pos.y-0.7)continue;
  P.jetHits.push(s);hitSharkSpinJet(s,1);}
  if(typeof jetHitSaucers==='function')jetHitSaucers();}
function endHover(){P.hover=false;if(P.hoverS){SFX.hoverStop(P.hoverS);P.hoverS=null;}}
function hoverPuffFX(){const c=Math.cos(P.yaw),s=Math.sin(P.yaw);for(let sg=-1;sg<=1;sg+=2){spawnP(P.pos.x+sg*0.12*c+rand(-0.05,0.05),P.pos.y+0.04,P.pos.z-sg*0.12*s+rand(-0.05,0.05),rand(-0.4,0.4),rand(-2.5,-1.2),rand(-0.4,0.4),rand(0.07,0.11),0xffffff,rand(0.3,0.45),1.2,0,0.7);}}
function onLand(fall,surf){if(!P.puff){P.puff=true;refillFX();}P.sq=clamp(1-fall*0.045,0.55,0.9);SFX.land(fall);
  if(surf==='water'){SFX.splash();for(let i=0;i<10;i++)spawnP(P.pos.x,-0.05,P.pos.z,rand(-2,2),rand(1.5,4),rand(-2,2),rand(0.06,0.14),0xdff6ff,rand(0.3,0.5),0.5,-7,0.9);}
  else if(fall>7){spawnRing(P.pos.x,P.pos.y+0.03,P.pos.z,0xe9dcc0,0.35,4,0.35);for(let i=0;i<8;i++){const a=rand(0,TAU);spawnP(P.pos.x,P.pos.y+0.05,P.pos.z,Math.cos(a)*rand(1,3),rand(0.5,1.5),Math.sin(a)*rand(1,3),rand(0.08,0.14),0xffffff,rand(0.3,0.5),1.0,-2,0.7);}}
  CAM.fovKick=-3*clamp(fall/20,0,1);if(fall>14)rumble(80,0.4,0.2);}
function landOn(surf){const v=P.vel;const fall=-v.y;if(v.y<0)v.y=0;P.puffAir=0;endHover();clearLeapBoost();clearGlide();endSpaceThrust();P.grounded=true;P.lastGround=time;P.surf=surf;P.moveZone='grounded';
  if(isSpaceLevel()){v.x*=0.18;v.z*=0.18;v.y=0;}
  if(P.slam!==0){slamImpact();return;}if(!P.wasGrounded)onLand(fall,surf);}
function doGust(){const yaw=P.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw);const mx=P.pos.x+fx*0.35,my=P.pos.y+0.85,mz=P.pos.z+fz*0.35;
  SFX.gust();P.sq=Math.min(P.sq,0.72);P.mouthT=0.35;
  for(let i=0;i<14;i++){const sp=rand(5,9),a=rand(-0.35,0.35);spawnP(mx,my+rand(-0.1,0.1),mz,Math.sin(yaw+a)*sp,rand(-0.5,1),Math.cos(yaw+a)*sp,rand(0.08,0.16),0xffffff,rand(0.3,0.5),1.6,0,0.7);}
  const RG=6.5;const k=(x,z)=>{const dx=x-mx,dz=z-mz;const d=Math.hypot(dx,dz);if(d>RG||d<1e-3)return 0;const dot=(dx*fx+dz*fz)/d;if(dot<0.55)return 0;return (1-d/RG)*smooth((dot-0.55)/0.35);};
  for(const w of wobblers){if(Math.abs(w.y-P.pos.y)>3)continue;const s=k(w.x,w.z);if(s>0){w.vx+=fx*s*10;w.vz+=fz*s*10;}}
  for(const pw of pinwheels){const s=k(pw.x,pw.z);if(s>0)pw.spinVel+=s*34;}
  for(const t of toss){if(Math.abs(t.pos.y-P.pos.y)>2.5)continue;const s=k(t.pos.x,t.pos.z);if(s>0){t.vel.x+=fx*s*10;t.vel.z+=fz*s*10;t.vel.y+=s*4+0.5;t.rest=false;}}
  for(const d of dust){if(d.amt<=0||Math.abs(P.pos.y)>3)continue;const s=k(d.x,d.z);if(s>0.05)dustHit(d,s*0.75);}
  for(const sn of snoozles){if(sn.state!=='sleep')continue;const s=k(sn.g.position.x,sn.g.position.z);if(s>0.18&&Math.abs(sn.g.position.y-P.pos.y)<2.5)wakeSnoozle(sn);}
  for(const e of gloops){if(!e.alive||e.state==='dying'||Math.abs(e.y-P.pos.y)>3)continue;const s=k(e.x,e.z);if(s>0){e.vx+=fx*(5+s*7);e.vz+=fz*(5+s*7);e.stunT=1.2;e.wind=0;e.hurtT=Math.max(e.hurtT,0.1);}}
  for(const e of cinders){if(!e.alive||e.state==='dying'||Math.abs(e.y-P.pos.y)>3)continue;const s=k(e.x,e.z);if(s>0){e.vx+=fx*(5+s*7);e.vz+=fz*(5+s*7);e.stunT=1.0;e.wind=0;e.hurtT=Math.max(e.hurtT,0.1);}}
  for(const w of wisps){if(!w.alive)continue;const s=k(w.g.position.x,w.g.position.z);if(s>0.16&&Math.abs(w.g.position.y-P.pos.y)<2.6)extinguishWisp(w);}
  for(const q of goos){if(!q.alive||q.ref||Math.abs(q.pos.y-P.pos.y)>3)continue;const s=k(q.pos.x,q.pos.z);if(s>0){q.ref=true;q.vel.x=fx*12;q.vel.z=fz*12;q.vel.y=Math.max(q.vel.y,3);q.life=3;q.m.material.color.setHex(0xd8ff9a);spawnRing(q.pos.x,q.pos.y,q.pos.z,0xd8ff9a,0.2,3,0.25);}}
  {if(WM){const s=k(WM.sailX,WM.sailZ);if(s>0)WM.spin+=s*7;}}
  {if(BOAT){const s=k(BOAT.pos.x,BOAT.pos.z);if(s>0){BOAT.vel.x+=fx*s*6;BOAT.vel.z+=fz*s*6;}}}
  gustSteamVents(mx,mz,k);
  gustGeysers(mx,mz,k);
  gustSalamanders(mx,mz,k);
  gustSteamCurtains(mx,mz,k);
  if(typeof gustHitSaucers==='function')gustHitSaucers(mx,mz,k);
  if(isUnderwater())gustHitKelp(mx,mz,k);
  rumble(60,0.2,0.4);
  if(isUnderwater()&&P.bubble)fireBubble();
}
function doBonk(){const px=P.pos.x,pz=P.pos.z;SFX.bonk();SFX.spin();
  const k=(x,z)=>{const d=Math.hypot(x-px,z-pz);return d>BONKR?0:1-d/BONKR;};
  const nx=(x,z)=>{const d=Math.hypot(x-px,z-pz)||0.01;return [(x-px)/d,(z-pz)/d];};
  let hit=false;
  for(const t of toss){if(Math.abs(t.pos.y-P.pos.y)>1.5)continue;const s=k(t.pos.x,t.pos.z);if(s>0){const n=nx(t.pos.x,t.pos.z);t.vel.x+=n[0]*(4+s*6);t.vel.z+=n[1]*(4+s*6);t.vel.y+=3.5;t.rest=false;hit=true;}}
  for(const sn of snoozles){if(sn.state!=='sleep')continue;const s=k(sn.g.position.x,sn.g.position.z);if(s>0&&Math.abs(sn.g.position.y-P.pos.y)<1.5){wakeSnoozle(sn);hit=true;}}
  for(const pw of pinwheels){const s=k(pw.x,pw.z);if(s>0){pw.spinVel+=22;hit=true;}}
  for(const w of wobblers){if(Math.abs(w.y-P.pos.y)>1.5)continue;const s=k(w.x,w.z);if(s>0){const n=nx(w.x,w.z);w.vx+=n[0]*s*9;w.vz+=n[1]*s*9;}}
  for(const d of dust){if(d.amt<=0)continue;const s=k(d.x,d.z);if(s>0){dustHit(d,0.7);hit=true;}}
  for(const e of gloops){if(!e.alive||e.state==='dying'||Math.abs(e.y-P.pos.y)>1.5)continue;const s=k(e.x,e.z);if(s>0){const n=nx(e.x,e.z);hitGloop(e,1,n[0]*6,n[1]*6);hit=true;}}
  for(const e of cinders){if(!e.alive||e.state==='dying'||Math.abs(e.y-P.pos.y)>1.5)continue;const s=k(e.x,e.z);if(s>0){const n=nx(e.x,e.z);hitCinder(e,1,n[0]*6,n[1]*6);hit=true;}}
  for(const s of sharks){if(!s.alive)continue;const s2=k(s.x,s.z);if(s2>0&&Math.abs(s.y-P.pos.y)<1.5){hitSharkSpinJet(s,1);hit=true;}}
  for(const c of crates){if(c.broken)continue;if(Math.hypot(c.x-px,c.z-pz)<BONKR&&Math.abs(c.y-P.pos.y)<1.4){breakCrate(c);hit=true;}}
  if(typeof spinHitSaucers==='function'&&spinHitSaucers(px,P.pos.y+0.45,pz))hit=true;
  spawnRing(px,P.pos.y+0.45,pz,0xffe9b0,0.55,5,0.3);
  for(let i=0;i<7;i++){const a=i/7*TAU;spawnP(px+Math.cos(a)*0.7,P.pos.y+0.55,pz+Math.sin(a)*0.7,Math.cos(a)*3,rand(0.5,1.5),Math.sin(a)*3,0.09,0xfff0b8,0.3,0.8,0,0.8);}
  if(hit)rumble(60,0.35,0.15);}
function slamImpact(){const px=P.pos.x,py=P.pos.y,pz=P.pos.z;SFX.slam();CAM.shake=0.7;CAM.fovKick=8;rumble(180,0.9,0.5);
  spawnRing(px,py+0.03,pz,0xffffff,0.5,9,0.5);spawnRing(px,py+0.03,pz,0xfff2b0,0.3,6,0.6);
  for(let i=0;i<18;i++){const a=rand(0,TAU),sp=rand(3,8);spawnP(px+Math.cos(a)*0.3,py+0.1,pz+Math.sin(a)*0.3,Math.cos(a)*sp,rand(1,4),Math.sin(a)*sp,rand(0.12,0.22),0xd9c9a4,rand(0.4,0.8),1.2,-6,0.8);}
  const RS=4.8;const kk=(x,z)=>{const d=Math.hypot(x-px,z-pz);return d>RS?0:(1-d/RS);};
  for(const w of wobblers){if(Math.abs(w.y-py)>3)continue;const s=kk(w.x,w.z);if(s>0){const d=Math.hypot(w.x-px,w.z-pz)||0.01;w.vx+=(w.x-px)/d*s*9;w.vz+=(w.z-pz)/d*s*9;}}
  for(const pw of pinwheels){const s=kk(pw.x,pw.z);if(s>0)pw.spinVel+=s*22;}
  for(const t of toss){if(Math.abs(t.pos.y-py)>3)continue;const s=kk(t.pos.x,t.pos.z);if(s>0){const d=Math.hypot(t.pos.x-px,t.pos.z-pz)||0.01;t.vel.x+=(t.pos.x-px)/d*s*9;t.vel.z+=(t.pos.z-pz)/d*s*9;t.vel.y+=s*7+2;t.rest=false;}}
  for(const d of dust){if(d.amt<=0||Math.abs(py)>3)continue;const s=kk(d.x,d.z);if(s>0.05)dustHit(d,s*1.3);}
  for(const sn of snoozles){if(sn.state!=='sleep')continue;const s=kk(sn.g.position.x,sn.g.position.z);if(s>0.3&&Math.abs(sn.g.position.y-py)<3)wakeSnoozle(sn);}
  for(const e of gloops){if(!e.alive||e.state==='dying'||Math.abs(e.y-py)>3)continue;const s=kk(e.x,e.z);if(s>0.15){const d=Math.hypot(e.x-px,e.z-pz)||0.01;hitGloop(e,2,(e.x-px)/d*8,(e.z-pz)/d*8);}}
  for(const e of cinders){if(!e.alive||e.state==='dying'||Math.abs(e.y-py)>3)continue;const s=kk(e.x,e.z);if(s>0.15){const d=Math.hypot(e.x-px,e.z-pz)||0.01;hitCinder(e,2,(e.x-px)/d*8,(e.z-pz)/d*8);}}
  for(const c of crates){if(c.broken)continue;if(Math.hypot(c.x-px,c.z-pz)<RS*0.55&&Math.abs(c.y-py)<2.5)breakCrate(c);}
  if(P.fire)fireBurst(px,py,pz);
  {if(WM){const s=kk(WM.sailX,WM.sailZ);if(s>0)WM.spin+=s*4;}}
  {if(BOAT){const s=kk(BOAT.pos.x,BOAT.pos.z);if(s>0){const d=Math.hypot(BOAT.pos.x-px,BOAT.pos.z-pz)||0.01;BOAT.vel.x+=(BOAT.pos.x-px)/d*s*4;BOAT.vel.z+=(BOAT.pos.z-pz)/d*s*4;}}}
  P.vel.y=SLAM_REBOUND;P.grounded=false;P.lastGround=-9;P.slam=0;P.sq=0.5;if(!P.puff){P.puff=true;refillFX();}}
function hurtPlayer(kx,kz,col){if(won||P.inv>0||P.dead)return;P.hp--;P.inv=1.4;const l=Math.hypot(kx,kz)||1;P.vel.x=kx/l*5;P.vel.z=kz/l*5;P.vel.y=Math.max(P.vel.y,5);P.grounded=false;P.slam=0;P.puffAir=0;endHover();clearLeapBoost();clearGlide();P.sq=0.6;SFX.hurt();CAM.shake=0.45;rumble(150,0.7,0.3);
  for(let i=0;i<10;i++)spawnP(P.pos.x,P.pos.y+0.6,P.pos.z,rand(-3,3),rand(1,4),rand(-3,3),rand(0.06,0.12),col||GOOC,rand(0.3,0.5),0.3,-8,0.9);
  const lostFire=P.fire;
  const lostBubble=P.bubble&&isUnderwater();
  // Enemy hits remove Sky Blast like fire/bubbles. Future lava contact must clear leapBoost only and KEEP hasSkyBlast (see Level 3 spec).
  const lostSky=P.hasSkyBlast;
  if(P.fire){P.fire=false;SFX.fireOut();spoutWorld(tmpV);for(let i=0;i<12;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-1.2,1.2),rand(0.5,2.2),rand(-1.2,1.2),rand(0.08,0.15),0x8a8a8a,rand(0.5,0.9),0.9,-1,0.55);}
  if(lostBubble){P.bubble=false;SFX.bubbleOut();spoutWorld(tmpV);for(let i=0;i<10;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-1,1),rand(0.5,2),rand(-1,1),0.07,0xc8f0ff,rand(0.4,0.7),0.8,-1,0.7);}
  if(lostSky){P.hasSkyBlast=false;SFX.fireOut();spoutWorld(tmpV);for(let i=0;i<10;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-1,1),rand(0.8,2.4),rand(-1,1),rand(0.07,0.12),0xffc08a,rand(0.4,0.7),0.7,-1,0.65);}
  updateHUD();if(P.hp<=0){P.dead=true;P.deadT=1.8;SFX.deflate();showToast('Out of puff! Back to the last checkpoint…');spoutWorld(tmpV);for(let i=0;i<8;i++)spawnP(tmpV.x,tmpV.y,tmpV.z,rand(-0.5,0.5),rand(1,2),rand(-0.5,0.5),0.08,0xffffff,0.8,1.2,0,0.7);}
  else if(lostFire)showToast('The fire went out!');
  else if(lostBubble)showToast('The bubbles went away!');
  else if(lostSky)showToast('The Sky Blast went out!');}
function respawn(){P.pos.set(P.spawn.x,P.spawn.y,P.spawn.z);P.vel.set(0,0,0);P.hp=P.maxHp;P.dead=false;P.inv=1.5;P.puff=true;P.puffAir=0;endHover();clearLeapBoost();clearGlide();P.slam=0;P.lavaRecT=0;P.sq=1.3;P.yaw=Math.PI;CAM.yaw=0;CAM.pos.set(P.spawn.x,P.spawn.y+5,P.spawn.z+9);CAM.look.set(P.spawn.x,P.spawn.y+1,P.spawn.z);CAM.lastManual=-9;initSafeAnchor(P.spawn.x,P.spawn.y,P.spawn.z);SFX.refill();puffJumpFX();showToast('Back on your feet!');updateHUD();}
function hitGloop(e,dmg,kx,kz){if(!e.alive||e.state==='dying')return;e.hp-=dmg;e.hurtT=0.3;e.vx+=kx;e.vz+=kz;e.wind=0;SFX.blorp();
  for(let i=0;i<8;i++)spawnP(e.x,e.y+0.5,e.z,rand(-3,3),rand(1,4),rand(-3,3),rand(0.06,0.12),e.col,rand(0.3,0.5),0.3,-8,0.9);
  if(e.hp<=0){e.state='dying';e.t=0;e.vx=0;e.vz=0;SFX.dissolve();addPuddle(e.x,e.y,e.z,0.8+e.size*0.6,e.col);if(P.hp<P.maxHp)addHeart(e.x,e.y+0.8,e.z);for(let i=0;i<14;i++)spawnP(e.x,e.y+0.4,e.z,rand(-2,2),rand(1,3),rand(-2,2),rand(0.08,0.16),e.col,rand(0.5,0.9),0.5,-5,0.9);rumble(80,0.3,0.3);}}
function spit(e){const ox=e.x+Math.sin(e.face)*0.55*e.size,oz=e.z+Math.cos(e.face)*0.55*e.size,oy=e.y+0.45*e.size;const tx=P.pos.x+rand(-0.5,0.5),tz=P.pos.z+rand(-0.5,0.5),ty=P.pos.y+0.4;const T=1.0;let vx=(tx-ox)/T,vz=(tz-oz)/T;const hs=Math.hypot(vx,vz);if(hs>13){vx*=13/hs;vz*=13/hs;}const vy=clamp((ty-oy-0.5*GOOGRAV*T*T)/T,3,16);
  let q=null;for(const g2 of goos){if(!g2.alive){q=g2;break;}}if(!q)return;q.alive=true;q.ref=false;q.life=4;q.trailT=0;q.pos.set(ox,oy,oz);q.vel.set(vx,vy,vz);q.m.visible=true;q.m.position.copy(q.pos);q.col=e.col;q.r=0.15+e.size*0.1;q.m.scale.setScalar(q.r);q.m.material.color.setHex(e.col);
  e.vx-=Math.sin(e.face)*1.5;e.vz-=Math.cos(e.face)*1.5;SFX.spit();for(let i=0;i<4;i++)spawnP(ox,oy,oz,vx*0.2+rand(-1,1),rand(0,2),vz*0.2+rand(-1,1),0.06,e.col,0.3,0.4,-6,0.8);}
function killGoo(q){q.alive=false;q.m.visible=false;}
function updateOpenSpacePlayer(dt,mx,mz){
  const p=P.pos,v=P.vel,cfg=spaceCfg()||{};
  const thrustCap=cfg.thrustCap||SPACE_CAP,coastCap=cfg.coastCap||SPACE_COAST;
  const band=cfg.levelBand!=null?cfg.levelBand:SPACE_LEVEL_BAND;
  P.grounded=false;P.moveZone='openSpace';
  decayLeapBoost(dt);
  if(IN.jump)P.jumpBuf=time;
  const thrusting=IN.jumpHeld&&!P.dead;
  if(thrusting){
    if(!P.spaceThrust){P.spaceThrust=true;if(!P.spaceThrustS)P.spaceThrustS=SFX.spaceThrustStart();}
    if(IN.jump){fireJet();SFX.jump();}
    P.sqT=1.08;
  }else if(P.spaceThrust)endSpaceThrust();
  if(!P.dead&&IN.jump&&!P.puff&&P.slam===0&&time-P.jumpBuf<BUFFER){
    v.y=Math.max(v.y,0)*0.35+(cfg.puffV||SPACE_PUFF);P.puff=false;P.jumping=true;P.jumpBuf=-9;P.sq=1.25;
    puffJumpFX();SFX.puff();fireJet();CAM.fovKick=4;
  }
  const cy=CAM.yaw,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  const fmz=mz<-band?mz:0;
  let wx=fx*(-fmz)+rx*mx,wz=fz*(-fmz)+rz*mx,wl=Math.hypot(wx,wz);
  if(wl>1){wx/=wl;wz/=wl;wl=1;}
  const dir=spaceThrustDir(wx,wz,wl,mz,cfg);
  const tx=dir.x,ty=dir.y,tz=dir.z;
  P.spaceThrustY=dir.tyRaw;
  const steer=thrusting?(cfg.steerThrust||SPACE_STEER_T):(cfg.steerCoast||SPACE_STEER_C);
  const hold=cfg.thrustHold||SPACE_THRUST;
  applyLandingAssist(dt,p,v);
  if(thrusting){
    v.x+=tx*hold*dt;v.y+=ty*hold*dt;v.z+=tz*hold*dt;
    if(wl>0.05){
      v.x=moveTo(v.x,wx*thrustCap,steer*dt);
      v.z=moveTo(v.z,wz*thrustCap,steer*dt);
      v.y=moveTo(v.y,dir.tyRaw*thrustCap,steer*dt);
    }else if(Math.abs(dir.tyRaw)>0.02){
      v.y=moveTo(v.y,dir.tyRaw*thrustCap,steer*dt);
    }else{
      v.y=moveTo(v.y,0,steer*dt*0.9);
    }
    capSpaceVel(v,thrustCap);
  }else{
    const k=Math.exp(-(cfg.coastDecay||SPACE_COAST_DEC)*dt);
    v.x*=k;v.y*=k;v.z*=k;
    if(wl>0.05){
      v.x=moveTo(v.x,wx*coastCap,steer*dt);v.z=moveTo(v.z,wz*coastCap,steer*dt);
      const dot=v.x*wx+v.z*wz;
      if(dot<-0.05){v.x=moveTo(v.x,0,(cfg.brake||SPACE_BRAKE)*dt);v.z=moveTo(v.z,0,(cfg.brake||SPACE_BRAKE)*dt);}
    }
    capSpaceVel(v,coastCap);
  }
  if(wl>0.05)P.yaw=angDamp(P.yaw,Math.atan2(wx,wz),14,dt);
  else P.sqT=0.92;
  capSpaceVel(v,thrusting?thrustCap:coastCap);
  P.gustCD-=dt;P.bonkCD-=dt;
  if(!P.dead&&IN.b&&P.gustCD<=0){doGust();P.gustCD=0.45;}
  if(!P.dead&&IN.y&&P.bonkCD<=0){doBonk();P.bonkCD=BONK_CD;P.bonkT=0.45;}
  applySpaceRecovery(dt);
  capSpaceVel(v,thrustCap);
  p.x+=v.x*dt;collideAxis('x');p.z+=v.z*dt;collideAxis('z');
  const prevY=p.y;p.y+=v.y*dt;
  let landY=-Infinity,landSurf=null,bump=false,bumpY=Infinity;
  for(const s of solids){
    if(!solidIsLandable(s))continue;
    if(!hOverlap(s))continue;
    if(p.y+H<=s.min.y||p.y>=s.max.y)continue;
    if(v.y<=0&&prevY>=s.max.y-0.08){if(s.max.y>landY){landY=s.max.y;landSurf=s.surf||'pad';}}
    else if(v.y>0&&prevY+H<=s.min.y+0.06){if(s.min.y<bumpY){bumpY=s.min.y;bump=true;}}
    else{if(s.max.y-p.y<STEP+0.06){if(s.max.y>landY){landY=s.max.y;landSurf=s.surf||'pad';}}else pushOutXZ(s);}
  }
  if(landY>-Infinity){p.y=landY;landOn(landSurf||'pad');}
  else if(bump){p.y=bumpY-H-0.001;if(v.y>0)v.y=0;}
  if(P.spaceThrust){P.jetT=Math.max(P.jetT,0.06);P.jetP-=dt;if(P.jetP<=0){P.jetP=0.028;const cy=Math.cos(P.yaw),sy=Math.sin(P.yaw);
    for(let sg=-1;sg<=1;sg+=2)spawnP(p.x+sg*0.12*cy,p.y-0.04,p.z-sg*0.12*sy,rand(-0.8,0.8),rand(-4,-1.8),rand(-0.8,0.8),rand(0.07,0.13),Math.random()<0.5?0x5ec8ff:0xe4f8ff,rand(0.25,0.42),1.1,0,0.85);}}
  updateSafeAnchor(dt);
}
function updatePlayer(dt){const p=P.pos,v=P.vel;
  P.inv-=dt;if(P.dead){P.deadT-=dt;if(P.deadT<=0)respawn();}
  // Lava recovery owns motion briefly — skip normal move/input so a live boost cannot fight the fling.
  if(updateLavaRecovery(dt))return;
  const cy=CAM.yaw,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  let wx=fx*(-IN.mz)+rx*IN.mx,wz=fz*(-IN.mz)+rz*IN.mx;let wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;wl=1;}if(P.dead){wx=0;wz=0;wl=0;}
  if(isSpaceLevel()){
    P.moveZone=queryMoveZone();
    if(P.moveZone==='openSpace'){updateOpenSpacePlayer(dt,IN.mx,IN.mz);return;}
    P.moveZone='grounded';
  }else P.moveZone='grounded';
  // Ordinary movement stays SPEED-capped. leapBoost is applied separately so stick reverse cannot cancel it.
  if(P.slam===0){const a=P.grounded?(wl>0.05?ACC:DEC):(wl>0.05?AIRACC:3);v.x=moveTo(v.x,wx*SPEED,a*dt);v.z=moveTo(v.z,wz*SPEED,a*dt);if(wl>0.05)P.yaw=angDamp(P.yaw,Math.atan2(wx,wz),14,dt);}
  decayLeapBoost(dt);
  if(IN.jump)P.jumpBuf=time;
  const canJump=(P.grounded||time-P.lastGround<COYOTE)&&P.slam===0;
  if(!P.dead&&time-P.jumpBuf<BUFFER&&canJump){v.y=JUMPV;P.grounded=false;P.lastGround=-9;P.jumpBuf=-9;P.jumping=true;P.sq=1.25;SFX.jump();fireJet();for(let i=0;i<3;i++)spawnP(p.x,p.y+0.05,p.z,rand(-1,1),rand(0.5,1),rand(-1,1),0.09,0xffffff,0.3,0.8,0,0.5);}
  else if(!P.dead&&IN.jump&&!P.grounded&&!canJump&&P.puff&&P.slam===0){
    const puffV=PUFFV*(P.hasSkyBlast?SKY.puffVMul:1);
    v.y=Math.max(v.y,0)*0.35+puffV;P.puff=false;P.puffAir=1;P.jumping=true;P.jumpBuf=-9;P.sq=1.35;
    if(P.hasSkyBlast&&SKY.boostMax>0){fireLeapBoost();skyLeapFX();}
    else puffJumpFX();
    SFX.puff();fireJet();CAM.fovKick=6;}
  if(P.jumping&&!IN.jumpHeld&&v.y>0){v.y*=0.5;P.jumping=false;}
  if(v.y<=0)P.jumping=false;
  P.gustCD-=dt;P.bonkCD-=dt;
  const uw=isUnderwater();
  if(!P.dead&&IN.b&&P.slam===0&&!P.inFan){
    if(uw){if(P.gustCD<=0){doGust();P.gustCD=0.45;}}
    else if(!P.grounded&&!isSpaceLevel()){P.slam=1;P.hangT=SLAM_HANG;v.x*=0.25;v.z*=0.25;v.y=Math.max(v.y,0)*0.2;P.puffAir=0;endHover();clearLeapBoost();clearGlide();SFX.slamCharge();}
    else if(P.gustCD<=0){doGust();P.gustCD=0.45;}
  }
  if(!P.dead&&IN.y&&P.bonkCD<=0){doBonk();P.bonkCD=BONK_CD;P.bonkT=0.45;}
  if(P.slam===1){P.hangT-=dt;v.y=1.5;P.sqT=1.4;if(P.hangT<=0){P.slam=2;v.y=SLAM_FALL;}}
  else if(P.slam===2){v.y=SLAM_FALL;P.sqT=1.25;}
  else{
    // Sky Blast glide: after crest of a powered leap, soften descent for a bounded window.
    // Hold-to-float must not reset or extend glideT — the timer owns the end.
    if(P.glideArmed&&P.glideT<=0&&!P.grounded&&SKY.glideDur>0&&v.y<=SKY.glideStartVy){
      P.glideT=SKY.glideDur;P.glideArmed=false;
    }
    if(P.glideT>0&&!P.grounded){
      P.glideT-=dt;
      v.y+=GRAV*dt;
      const cap=SKY.glideFallCap;
      // Holding Jump may soften a little more inside the same bounded window — never extends it.
      const softCap=IN.jumpHeld?Math.max(cap,-1.6):cap;
      if(v.y<softCap)v.y=softCap;
      P.sqT=lerp(0.78,1.15,clamp(P.glideT/Math.max(SKY.glideDur,1e-3),0,1));
      // Keep ordinary puffAir for post-glide float; do not start hover while wings are out.
      if(P.hover)endHover();
      if(P.glideT<=0){P.glideT=0;}
    }else if(P.puffAir>0&&!P.grounded&&v.y<1.0&&!P.inFan){
      if(!P.hover){P.hover=true;P.hoverS=SFX.hoverStart();}
      P.puffAir-=dt/(IN.jumpHeld?HOVER_HELD:HOVER_REL);
      v.y=moveTo(v.y,HOVER_DRIFT,7*dt);P.sqT=lerp(0.72,1.2,clamp(P.puffAir,0,1));
      P.hovT-=dt;if(P.hovT<=0){P.hovT=0.05;hoverPuffFX();}
      if(P.puffAir<=0){P.puffAir=0;endHover();}
    }else{P.sqT=P.grounded?1:(v.y>3?1.1:1);v.y+=GRAV*dt;if(v.y<MAXFALL)v.y=MAXFALL;}
  }
  P.inFan=false;
  for(const f of fans){const dx=p.x-f.x,dz=p.z-f.z;if(dx*dx+dz*dz<f.r*f.r&&p.y<f.top){P.inFan=true;if(P.slam){P.slam=0;}P.puffAir=0;endHover();v.y=moveTo(v.y,9.5,50*dt);if(!P.puff){P.puff=true;refillFX();}}}
  updateSteamVentTouch(dt);
  P.wasGrounded=P.grounded;P.grounded=false;
  // Integrate ordinary velocity plus the independent leapBoost carry.
  p.x+=(v.x+P.leapBoost.x)*dt;collideAxis('x');p.z+=(v.z+P.leapBoost.z)*dt;collideAxis('z');
  const prevY=p.y;p.y+=v.y*dt;
  let landY=-Infinity,landSurf=null,bump=false,bumpY=Infinity;
  for(const s of solids){if(!hOverlap(s))continue;if(p.y+H<=s.min.y||p.y>=s.max.y)continue;
    if(v.y<=0&&prevY>=s.max.y-0.06){if(s.max.y>landY){landY=s.max.y;landSurf=s.surf;}}
    else if(v.y>0&&prevY+H<=s.min.y+0.06){if(s.min.y<bumpY){bumpY=s.min.y;bump=true;}}
    else{if(s.max.y-p.y<STEP+0.06){if(s.max.y>landY){landY=s.max.y;landSurf=s.surf;}}else pushOutXZ(s);}}
  const gy=groundHeightAt(p.x,p.z);
  if(p.y<=gy&&gy>landY){landY=gy;landSurf=(CURRENT_LEVEL&&CURRENT_LEVEL.peakAtmosphere)?'stone':(inPond(p.x,p.z)?'water':'grass');}
  if(landY>-Infinity){p.y=landY;landOn(landSurf);}
  else if(bump){p.y=bumpY-H-0.001;if(v.y>0)v.y=0;}
  // Level-owned void recovery runs before the crude y<-6 spawn snap.
  // Levels without voidY keep the old failsafe. No heart cost; celebration skipped via !won.
  if(!P.dead&&!won&&P.lavaRecT<=0&&CURRENT_LEVEL&&CURRENT_LEVEL.voidY!=null&&p.y<CURRENT_LEVEL.voidY)beginVoidRecovery();
  else if(p.y<-6){p.set(P.spawn.x,P.spawn.y,P.spawn.z);v.set(0,0,0);clearLeapBoost();clearGlide();}
  if(P.jetT>0){P.jetT-=dt;jetDamage();
    P.jetP-=dt;if(P.jetP<=0){P.jetP=0.028;const cy=Math.cos(P.yaw),sy=Math.sin(P.yaw);
      for(let sg=-1;sg<=1;sg+=2)spawnP(p.x+sg*0.12*cy,p.y-0.04,p.z-sg*0.12*sy,rand(-0.8,0.8),rand(-4,-1.8),rand(-0.8,0.8),rand(0.07,0.13),Math.random()<0.5?0x5ec8ff:0xe4f8ff,rand(0.25,0.42),1.1,0,0.85);}}
  spawnSkySteamTrail(dt);
  P.inGoo=false;if(P.grounded){for(const pu of puddles){if(!pu.alive)continue;if(Math.abs(p.y-pu.y)<0.4&&Math.hypot(p.x-pu.x,p.z-pu.z)<pu.size+R*0.5){P.inGoo=true;break;}}}
  if(P.inGoo){v.x*=Math.exp(-16*dt);v.z*=Math.exp(-16*dt);P.surf='goo';}
  // Lava contact: one heart + comic yeouch + recover to safe anchor. Keeps hasSkyBlast (unlike enemy hits).
  if(!P.dead&&!won&&playerInLava())lavaContact();
  updateSafeAnchor(dt);
  const sp=Math.hypot(v.x,v.z);
  if(P.grounded&&sp>1.5){P.footT+=dt*sp;if(P.footT>2.6){P.footT=0;SFX.step(P.surf==='pad'?'stone':P.surf);if(P.surf==='grass')spawnP(p.x,p.y+0.05,p.z,rand(-0.5,0.5),rand(0.5,1.2),rand(-0.5,0.5),0.09,0xffffff,0.35,0.6,0,0.35);}}else P.footT=1.5;
  if(P.grounded&&P.surf==='water'&&sp>1){P.splT-=dt;if(P.splT<=0){P.splT=0.09;spawnP(p.x+rand(-0.3,0.3),-0.05,p.z+rand(-0.3,0.3),rand(-1,1),rand(1.5,3.5),rand(-1,1),rand(0.06,0.12),0xdff6ff,rand(0.3,0.5),0.5,-6,0.9);}}
}
function updatePlayerVisual(dt){const u=player.userData;if(P.dead)P.sqT=0.45;
  P.sqV+=((P.sqT-P.sq)*220-P.sqV*16)*dt;P.sq+=P.sqV*dt;P.sq=clamp(P.sq,0.4,1.6);
  u.bel.scale.y=P.sq;u.head.position.y=0.3+0.57*P.sq;
  player.position.copy(P.pos);player.rotation.y=P.yaw;
  const sp=Math.hypot(P.vel.x,P.vel.z);
  if(P.grounded){P.run+=dt*sp*2.2;const a=Math.sin(P.run)*Math.min(sp/6,1)*0.7;u.legL.rotation.x=a;u.legR.rotation.x=-a;u.armL.rotation.x=-a*0.6;u.armR.rotation.x=a*0.6;u.head.rotation.x=sp<0.5?Math.sin(time*2)*0.03:Math.min(sp/6,1)*0.12;}
  else{const k=1-Math.exp(-8*dt);u.legL.rotation.x=lerp(u.legL.rotation.x,0.5,k);u.legR.rotation.x=lerp(u.legR.rotation.x,0.5,k);u.armL.rotation.x=lerp(u.armL.rotation.x,-1.2,k);u.armR.rotation.x=lerp(u.armR.rotation.x,-1.2,k);u.head.rotation.x=0;}
  if(P.slam===1){u.armL.rotation.x=-2.6;u.armR.rotation.x=-2.6;}
  if(P.bonkT>0){P.bonkT-=dt;const bk=clamp(1-Math.max(P.bonkT,0)/0.45,0,1);const out=0.55+Math.sin(Math.min(bk*1.15,1)*Math.PI)*0.45;
    u.armL.rotation.x=0;u.armR.rotation.x=0;u.armL.rotation.z=-1.6*out;u.armR.rotation.z=1.6*out;u.armL.scale.y=1+out*0.85;u.armR.scale.y=1+out*0.85;
    u.head.rotation.x=-0.12*out;player.rotation.y=P.yaw+bk*TAU;}
  else{u.armL.rotation.z=0;u.armR.rotation.z=0;u.armL.scale.y=1;u.armR.scale.y=1;}
  if(P.spaceThrust||P.jetT>0){const jk=P.spaceThrust?0.85:clamp(P.jetT/JET_T,0,1);u.jet.visible=true;
    u.jet.scale.set(0.85+Math.sin(time*42)*0.16,0.3+jk*1.1,0.85+Math.sin(time*49)*0.16);
    u.jet.children.forEach(c=>{c.material.opacity=(c.material.color?0.5:0.5)+jk*0.45;});}
  else u.jet.visible=false;
  u.flame.visible=!!P.fire;if(P.fire){const fl=1+Math.sin(time*19)*0.16;u.flame.scale.set(fl,1+Math.sin(time*25)*0.24,fl);u.flame.rotation.y=time*3.4;}
  // Idle Sky Blast tell: bellows seams glow orange. No spout flame — that stays fire-power only.
  if(u.seams){const runGlow=P.grounded?clamp(Math.hypot(P.vel.x,P.vel.z)/SPEED,0,1):0;
    for(const seam of u.seams){const mat=seam.material;if(!mat||!mat.color)continue;
      if(P.hasSkyBlast){const g=0.45+runGlow*0.35+Math.sin(time*6)*0.05;mat.color.setHex(0xff8a3a);if(mat.emissive&&mat.emissive.setHex)mat.emissive.setHex(0xff6a20);if(mat.emissiveIntensity!=null)mat.emissiveIntensity=g;}
      else{mat.color.setHex(0xc9ced4);if(mat.emissive&&mat.emissive.setHex)mat.emissive.setHex(0x000000);if(mat.emissiveIntensity!=null)mat.emissiveIntensity=0;}}}
  // Mechanical glide wings: deploy on powered puff (visual), stay through glide physics, retract on clear.
  if(u.wings){
    const wd=u.wings.userData;
    const want=P.wingsOut||P.glideT>0;
    if(want)wd.open=lerp(wd.open,1,1-Math.exp(-22*dt));
    else if(P.grounded||P.slam>0||P.dead)wd.open=0;
    else wd.open=lerp(wd.open,0,1-Math.exp(-20*dt));
    const o=wd.open;
    u.wings.visible=o>0.04;
    if(u.wings.visible){
      const flap=Math.sin(time*10)*0.04*o;
      wd.wingL.rotation.z=lerp(-1.15,0.22+flap,o);
      wd.wingR.rotation.z=lerp(1.15,-(0.22+flap),o);
      wd.wingL.rotation.y=lerp(0.9,0.08,o);
      wd.wingR.rotation.y=lerp(-0.9,-0.08,o);
      u.wings.scale.set(0.55+0.55*o,0.7+0.4*o,0.55+0.55*o);
    }
  }
  P.mouthT-=dt;u.mouth.scale.set(0.16,P.mouthT>0?0.16:0.05,0.03);
  P.blinkT-=dt;if(P.blinkT<=0){P.blinkT=rand(2,5);P.blinkAnim=0.14;}
  if(P.blinkAnim>0){P.blinkAnim-=dt;const s=P.blinkAnim>0.07?0.15:1;u.eyes.forEach(e=>{e.scale.y=s;});}else u.eyes.forEach(e=>{e.scale.y=1;});
  if(P.dead){u.eyes.forEach(e=>{e.scale.y=0.15;});u.head.rotation.x=0.55;}
  player.visible=P.dead||P.inv<=0||Math.floor(time*14)%2===0;
  // Project onto the actual receiving surface under the player footprint (platforms + lava).
  const footR=R*0.85;
  const recv=shadowReceiveAt(P.pos.x,P.pos.z,P.pos.y+0.01,footR);
  const sy=recv.y,hAbove=Math.max(0,P.pos.y-sy);
  const ss=shadowScaleForHeight(hAbove);
  const op=shadowOpacityForHeight(hAbove);
  const warm=recv.kind==='lava';
  shadow.position.set(P.pos.x,sy+0.02,P.pos.z);
  shadow.scale.setScalar(ss);
  const ud=shadow.userData,core=ud.core,rim=ud.rim;
  if(core&&core.material)core.material.opacity=op;
  if(rim&&rim.material){
    rim.material.opacity=SHADOW_RIM_OPACITY*(0.85+0.15*(op/SHADOW_OPACITY));
    if(rim.material.color&&rim.material.color.setHex)rim.material.color.setHex(warm?SHADOW_RIM_LAVA_COLOR:SHADOW_RIM_COLOR);
  }
  const S=window.__SHADOW;
  if(S&&S.state){
    S.state.scale=ss;S.state.opacity=op;S.state.rimOpacity=rim&&rim.material?rim.material.opacity:SHADOW_RIM_OPACITY;
    S.state.h=hAbove;S.state.y=sy;S.state.kind=recv.kind;S.state.warm=warm;
    S.state.x=P.pos.x;S.state.z=P.pos.z;
  }
}


