// Level 3 post-playtest patch 1: Geode entrance fall-through, void safety,
// lava/safe-ground visual language, Sky Blast box cleanup.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(H.getCamDiag().VERSION_BASE==='v45 · Candy land','version stamp');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast physics unchanged');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2&&H.getSky().glideStartVy===0.2,'glide physics unchanged');
ok(L.snoozleGoal===4&&W.snoozles.length===4,'Snoozles = 4');
ok(L.mandatoryLeaps.length===11,'mandatory leaps = 11');
ok(L.voidY===-4&&L.voidFloor===-25,'Level 3 opts into void safety');
ok(H.getVoid().y===-4,'void probe exports threshold');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quiet(){
  for(const e of W.cinders){if(e.alive){e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}}
  for(const e of W.embers){if(e.alive){e.alive=false;e.m.visible=false;}}
  for(const w of W.wisps){/* leave for corridor tests elsewhere */}
}
function settle(x,y,z){
  release();quiet();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);
  P.slam=0;P.puffAir=0;P.grounded=true;P.leapBoost.set(0,0,0);P.glideT=0;P.glideArmed=false;P.wingsOut=false;
  H.CAM.yaw=0;frames(8);
}
function floorSupport(x,z,belowY){
  const hits=[];
  for(const s of W.solids){
    if(x<=s.min.x||x>=s.max.x||z<=s.min.z||z>=s.max.z)continue;
    if(s.max.y>belowY+0.5||s.max.y<belowY-3)continue;
    const h=s.max.y-s.min.y;
    if(h>2.5)continue; // skip tall walls
    hits.push(s);
  }
  return hits;
}
function walkToward(tx,tz,steps){
  for(let i=0;i<(steps||220);i++){
    const dx=tx-P.pos.x,dz=tz-P.pos.z,d=Math.hypot(dx,dz);
    if(d<0.55)break;
    P.yaw=Math.atan2(dx,dz);H.CAM.yaw=0;
    kd({code:'KeyW',preventDefault(){},repeat:false});
    frames(1);
  }
  release();frames(4);
}
function reloadL3(){
  if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
  frames(2);H.startLevel(2);
}

// ---- P0: phone bug — geode entrance cannot drop Pling beneath volcano ----
// Pre-fix geometry had a ~2u floor gap at z∈[-269,-267] with the mouth at z=-268.
for(const z of [-266,-267,-267.5,-268,-268.5,-269,-270]){
  const hits=floorSupport(0,z,20.4);
  ok(hits.length>=1,'floor support at mouth z='+z+' (phone fall-through seam)');
}
for(const x of [-2.5,0,2.5]){
  for(const z of [-267.5,-268,-268.5]){
    ok(floorSupport(x,z,20.4).length>=1,'body-radius floor at ('+x+','+z+')');
  }
}

function enterMouth(sx,approach){
  settle(sx,20.2,-260);
  P.safeAnchor.set(sx,20.4,-260);
  if(approach==='run'){
    P.yaw=Math.PI;H.CAM.yaw=0;
    kd({code:'KeyW',preventDefault(){},repeat:false});
    for(let i=0;i<90;i++)frames(1);
    release();frames(10);
  }else if(approach==='jump'){
    P.yaw=Math.PI;H.CAM.yaw=0;
    kd({code:'KeyW',preventDefault(){},repeat:false});frames(8);
    kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space',preventDefault(){},repeat:false});
    for(let i=0;i<70;i++)frames(1);
    release();frames(10);
  }else if(approach==='air'){
    P.pos.set(sx,22.8,-264);P.grounded=false;P.vel.set(0,-1,-7);P.hasSkyBlast=true;P.leapBoost.set(0,0,-6);
    for(let i=0;i<80;i++)frames(1);
  }else{
    walkToward(sx,-278,200);
  }
  return {x:P.pos.x,y:P.pos.y,z:P.pos.z,grounded:P.grounded,hp:P.hp};
}

const center=enterMouth(0,'walk');
ok(center.y>19.5&&center.z<-270,'centerline walk enters Hollow above the volcano floor');
ok(center.y<24,'centerline did not clip into ceiling');

const left=enterMouth(-2.2,'walk');
ok(left.y>19.5&&left.z<-270,'left-edge walk enters Hollow');

const right=enterMouth(2.2,'walk');
ok(right.y>19.5&&right.z<-270,'right-edge walk enters Hollow');

const run=enterMouth(0,'run');
ok(run.y>19.5&&run.z<-268,'running entrance stays on authored floor');

const jmp=enterMouth(0,'jump');
ok(jmp.y>19.5&&jmp.z<-266,'jumping entrance does not fall beneath volcano');

const air=enterMouth(0,'air');
ok(air.y>19.5&&air.z<-266,'airborne approach lands on cave floor');

// Wall contact then continue — pillars must not shove player into the old seam.
settle(-2.8,20.2,-262);P.safeAnchor.set(0,20.4,-262);
walkToward(-4.5,-268,70);
walkToward(0,-278,140);
ok(P.pos.y>19.5&&P.pos.z<-270,'pillar contact then center entry stays on route');

// No invisible blocker on the open mouth centerline.
settle(0,20.2,-266);
ok(P.pos.z>-267.5||P.pos.y>19.5,'standing at mouth threshold is supported');
walkToward(0,-278,120);
ok(P.pos.z<=R.geodeHollow.zEnter,'crosses geodeHollow.zEnter');

// ---- Void safety net ----
reloadL3();
settle(0,20.4,-262);
P.safeAnchor.set(0,20.4,-262);
P.hasSkyBlast=true;P.leapBoost.set(0,0,-8);P.glideT=0.4;P.wingsOut=true;P.hp=4;
const hp0=P.hp;
// Drop just below voidY but above the legacy y<-6 snap so void owns the recovery.
P.pos.set(0,-5,-268);P.grounded=false;P.vel.set(0,-8,0);
frames(3);
ok(P.lavaRecT>0,'falling below voidY begins recovery');
for(let i=0;i<40;i++)frames(1);
ok(P.lavaRecT===0,'void recovery completes');
ok(P.pos.y>19&&Math.hypot(P.pos.x-0,P.pos.z-(-262))<2.5,'void recovery returns to safe anchor');
ok(P.hp===hp0,'void recovery does not cost an extra heart');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'void recovery clears leapBoost');
ok(P.glideT===0&&P.wingsOut===false,'void recovery clears glide/wings');
ok(P.grounded&&!P.dead,'player remains controllable after void recovery');
const yStable=P.pos.y;
frames(30);
ok(Math.abs(P.pos.y-yStable)<0.2&&P.lavaRecT===0,'void recovery does not loop');

// Deep fall onto Peak voidFloor also recovers (void runs before y<-6 spawn snap).
settle(0,20.4,-262);P.safeAnchor.set(1,20.4,-261);P.hp=4;const hp1=P.hp;
P.pos.set(0,-20,-268);P.grounded=false;P.vel.set(0,-12,0);P.leapBoost.set(3,0,3);P.wingsOut=true;
frames(3);
ok(P.lavaRecT>0,'deep voidFloor fall begins void recovery (not spawn snap)');
for(let i=0;i<40;i++)frames(1);
ok(P.hp===hp1&&P.pos.y>19,'deep void recovery restores without heart loss');

// Ordinary lava recovery must not be mistaken for void (threshold is below lava).
settle(0,0.4,14);P.safeAnchor.set(0,0.4,14);P.inv=0;P.hp=4;P.hasSkyBlast=true;
P.pos.set(10,0.5,10); // side lava pool
frames(6);
ok(P.lavaRecT>0||P.hp<4,'lava contact still recovers via lava system');
ok(P.hasSkyBlast===true,'lava still preserves hasSkyBlast');
ok(P.pos.y>L.voidY,'lava recovery never dips into void threshold incorrectly during settle');

// Ordinary elevated traversal never trips voidY.
settle(0,20.2,-278);P.safeAnchor.set(0,20.4,-278);
walkToward(0,-300,180);
ok(P.pos.y>19&&P.pos.y>L.voidY&&P.lavaRecT===0,'ordinary Hollow walk does not trigger void');

// Levels 1/2 do not opt in.
reloadL3();
if(typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
frames(2);H.startLevel(0);
const L1=H.getLevel();
ok(!L1.voidY&&H.getVoid().y==null,'Level 1 has no voidY');
H.startLevel(1);
const L2=H.getLevel();
ok(!L2.voidY&&H.getVoid().y==null,'Level 2 has no voidY');

// ---- Geode mouth visual / collision agreement ----
reloadL3();
ok(L.steps.some(s=>s[0]==='geodeMouth'),'geodeMouth builder still authored');
const mouthSolids=W.solids.filter(s=>s.min.z<-270&&s.max.z>-266&&s.max.y>23&&(s.max.x-s.min.x)<4);
ok(mouthSolids.length>=2,'cave mouth has side collision masses');
settle(0,21.5,-268);
ok(P.pos.y>20,'open center passage is traversable (not a solid door fill)');

// ---- Lava visual language ----
const falseLavaCols=new Set([0xc45a28,0xe07a3a,0xffd24a,0x8a4a2a]);
let badSafe=0,safeRock=0,safeCrack=0;
for(const s of W.solids){
  if(s.role==='safeRock')safeRock++;
  if(s.role==='safeCrack')safeCrack++;
  if(s.role==='safeRock'||s.role==='safeCrack'){
    if(falseLavaCols.has(s.color|0))badSafe++;
  }
}
ok(safeRock>=20,'major safe volcanic floors tagged safeRock');
ok(safeCrack>=8,'thin safe cracks tagged separately');
ok(badSafe===0,'no safeRock/safeCrack uses bright false-lava primary colors');
ok(W.lavas.length>=8&&W.lavas.every(l=>l.role==='lava'),'lava hazards registered with lava role');
ok(W.lavas.every(l=>l.body&&l.glow&&l.edge),'lava keeps molten body + glow + crust rim');
ok(W.lavas.every(l=>l.core),'lava has brighter emissive core treatment');

// Broad Warm Slopes / early pads are dark rock, not molten orange.
const warmPad=W.solids.find(s=>Math.abs((s.min.x+s.max.x)/2-(-5))<0.2&&Math.abs((s.min.z+s.max.z)/2-6)<0.2&&(s.max.y-s.min.y)>0.3);
ok(warmPad&&warmPad.role==='safeRock'&&!falseLavaCols.has(warmPad.color|0),'Snoozle 1 pad is safe rock, not false lava');

// ---- Sky Blast boxes ----
const skyCrates=W.crates.filter(c=>c.item==='sky');
ok(skyCrates.length===2,'exactly two Sky Blast crates after audit');
ok(R.skyCrates.length===2,'route metadata lists two crates');
const teach=skyCrates.find(c=>Math.abs(c.z-R.skyCrate.z)<1);
ok(!!teach,'teaching Sky Blast crate remains');
settle(teach.x,teach.y+1.3,teach.z);P.vel.set(0,-10,0);P.slam=2;P.grounded=false;P.hasSkyBlast=false;
frames(8);
ok(teach.broken&&P.hasSkyBlast===true,'teaching box still grants Sky Blast');

const recovery=skyCrates.find(c=>c!==teach);
ok(!!recovery&&Math.abs(recovery.z-(-90))<1,'post-leap recovery box retained at z≈-90');
ok(!skyCrates.some(c=>Math.abs(c.z-(-70))<1),'redundant takeoff-vent box at z≈-70 removed');
ok(!skyCrates.some(c=>Math.abs(c.z-(-121))<1||Math.abs(c.z-(-182))<1||Math.abs(c.z-(-194))<1),'later redundant Sky Blast boxes removed');

// Fair power-loss cinder on the broad landing after Sky Blast is learned.
const lossC=W.cinders.find(c=>Math.hypot(c.hx-R.powerLossCinder.x,c.hz-R.powerLossCinder.z)<1.5);
ok(!!lossC&&lossC.y>7.5,'power-loss cinder stands on the elevated landing');
settle(lossC.x,lossC.y,lossC.z);P.inv=0;P.hp=4;P.hasSkyBlast=true;P.leapBoost.set(0,0,-4);
let hit=false;
for(let i=0;i<40;i++){
  P.pos.set(lossC.x,lossC.y,lossC.z);
  frames(1);
  if(!P.hasSkyBlast){hit=true;break;}
}
// Force an ember if contact did not land during the short window.
if(P.hasSkyBlast){
  const emb=W.embers.find(e=>!e.alive)||W.embers[0];
  if(emb){emb.alive=true;emb.life=2;emb.m.visible=true;emb.pos.set(P.pos.x,P.pos.y+0.4,P.pos.z);emb.vel.set(0,0,0);}
  frames(4);
}
ok(P.hasSkyBlast===false||hit,'enemy/ember hit can remove hasSkyBlast');

// Vents remain the completion guarantee with all crates broken.
reloadL3();
for(const c of W.crates){if(!c.broken){c.broken=true;c.g.visible=false;}}
for(const leap of L.mandatoryLeaps){
  const vent=W.steamVents.find(v=>Math.hypot(v.x-leap.takeoff.x,v.z-leap.takeoff.z)<=leap.takeoff.ventReach+0.05);
  ok(!!vent,'vent remains for '+leap.id+' without crates');
}
const v0=W.steamVents[0];
P.hasSkyBlast=false;P.puff=false;settle(v0.x,v0.y,v0.z);frames(10);
ok(P.hasSkyBlast===true&&P.puff===true,'vent restores Sky Blast and puff');

// Final invariants / finish still present.
ok(W.organ&&W.FINISH&&/mountain is singing/i.test(W.FINISH.winMsg),'Organ finish preserved');
ok(H.getCamDiag().parse('?camdist=6.8')===6.8,'camdiag diagnostic preserved');

report();
