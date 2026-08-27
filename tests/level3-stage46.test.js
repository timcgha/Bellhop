// Level 3 Stage 4.6: early wing visuals, accessible crates, volcanic ground/lava readability.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

H.startLevel(2);
const L=H.getLevel();
const sky=H.getSky();
ok(L&&L.id==='level3','boots Level 3');
ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.boostDecay===1.6,'Stage 1 leap tuning unchanged');
ok(sky.glideDur===0.55&&sky.glideFallCap===-2.2&&sky.glideStartVy===0.2,'Stage 4.5 glide physics unchanged');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quiet(){
  for(const e of W.cinders){if(e.alive){e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}}
  for(const e of W.embers){if(e.alive){e.alive=false;e.m.visible=false;}}
}
function settle(x,y,z){
  release();quiet();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.glideT=0;P.glideArmed=false;P.wingsOut=false;
  P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(6);
}
function inLava(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function supportTop(x,z,belowY){
  let best=-Infinity;
  for(const s of W.solids){
    if(s.surf==='wood')continue; // crate solids
    if(x<=s.min.x||x>=s.max.x||z<=s.min.z||z>=s.max.z)continue;
    if(s.max.y>belowY+0.05)continue;
    best=Math.max(best,s.max.y);
  }
  return best;
}
function crateIntersectsNonCrateSolid(c){
  const minx=c.x-0.45,maxx=c.x+0.45,miny=c.y+0.02,maxy=c.y+0.9,minz=c.z-0.45,maxz=c.z+0.45;
  for(const s of W.solids){
    if(s===c.sol||s.surf==='wood')continue;
    if(s.invisible)continue;
    const ox=Math.min(maxx,s.max.x)-Math.max(minx,s.min.x);
    const oy=Math.min(maxy,s.max.y)-Math.max(miny,s.min.y);
    const oz=Math.min(maxz,s.max.z)-Math.max(minz,s.min.z);
    if(ox>0.02&&oy>0.02&&oz>0.02)return s;
  }
  return null;
}

// ---- Peak ground is volcanic, not meadow grass ----
ok(H.getLevel().peakAtmosphere===true,'Peak atmosphere active');
// landGround should be hidden; peakGround visible — probe via falling surf
settle(14,0.4,10);P.inv=99;P.pos.set(14,2,10);P.vel.set(0,-2,0);P.grounded=false;
for(let i=0;i<40;i++){frames(1);if(P.grounded)break;}
ok(P.surf==='stone'||P.lavaRecT>0,'Peak floor contact is stone/ash (not meadow grass surf)');

// ---- Early wings vs late physical glide ----
settle(-6,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;P.inv=99;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(30);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(P.wingsOut===true,'powered puff sets wingsOut immediately');
ok(P.glideArmed===true,'physical glide is armed but not started yet');
ok(P.glideT===0,'physical glideT still 0 right after puff');
let sawWingBeforeGlide=P.wingsOut&&P.glideT===0;
let glideStarted=false,wingAtGlideStart=false;
for(let i=0;i<80;i++){
  frames(1);
  if(P.wingsOut&&P.glideT===0)sawWingBeforeGlide=true;
  if(!glideStarted&&P.glideT>0){glideStarted=true;wingAtGlideStart=P.wingsOut;ok(P.vel.y<=sky.glideStartVy+0.05,'physical glide still starts at crest/descent');}
  if(P.grounded&&i>12)break;
}
release();
ok(sawWingBeforeGlide,'wings deploy before physical glide activates');
ok(glideStarted&&wingAtGlideStart,'wings remain open when physical glide begins');

// Early wings do not alter peak height vs prior Stage 4.5 expectation (farther not higher)
settle(-8,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(40);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
let yPeak=P.pos.y;
for(let i=0;i<200;i++){frames(1);yPeak=Math.max(yPeak,P.pos.y);if(P.grounded&&i>12)break;}
release();
ok(yPeak-0.4<4.0,'early wings do not create a super-jump peak (peak='+(yPeak-0.4).toFixed(2)+')');

// Unpowered never wings
settle(0,0.4,16);P.hasSkyBlast=false;P.puff=true;P.yaw=Math.PI/2;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(20);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
let badWing=false;
for(let i=0;i<80;i++){frames(1);if(P.wingsOut||P.glideT>0)badWing=true;if(P.grounded&&i>8)break;}
release();
ok(!badWing,'unpowered puff never deploys wings');

// Slam clears wings
settle(-6,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;P.inv=99;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(25);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
frames(4);
ok(P.wingsOut===true,'wings out before slam');
tap('KeyJ',2);frames(2);
ok(P.wingsOut===false&&P.glideT===0&&Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'slam retracts wings and clears glide/boost');
release();
for(let i=0;i<80;i++){frames(1);if(P.grounded&&P.slam===0)break;}

// Lava clears wings, keeps power
H.test.loadLevel(2);
settle(0,0.4,14);P.hasSkyBlast=true;P.wingsOut=true;P.glideT=0.3;P.leapBoost.set(0,0,-6);P.inv=0;P.hp=4;
const side=L.route.sideLava;
P.pos.set(side.x,0.2,side.z);P.vel.set(0,-1,0);P.grounded=false;frames(4);
ok(P.hasSkyBlast===true,'lava preserves hasSkyBlast');
ok(P.wingsOut===false&&P.glideT===0,'lava retracts wings and clears glide');

// ---- Accessible Sky Blast crates ----
H.test.loadLevel(2);
const skyCrates=W.crates.filter(c=>c.item==='sky');
ok(skyCrates.length===6,'exactly six Sky Blast crates');
ok(L.route.skyCrates.length===6,'route metadata lists six crates');
for(const meta of L.route.skyCrates){
  const c=skyCrates.find(x=>Math.abs(x.x-meta.x)<0.2&&Math.abs(x.z-meta.z)<0.2);
  ok(!!c,'live crate matches metadata '+meta.note);
  if(!c)continue;
  const top=supportTop(c.x,c.z,c.y+0.05);
  ok(Math.abs(top-c.y)<0.08,'crate '+meta.note+' sits on support top (y='+c.y+' top='+top.toFixed(2)+')');
  const hit=crateIntersectsNonCrateSolid(c);
  ok(!hit,'crate '+meta.note+' does not intersect platform solids');
  ok(!inLava(c.x,c.y+0.3,c.z),'crate '+meta.note+' is not inside lava');
  // Break with slam from above
  settle(c.x,c.y+1.4,c.z);P.vel.set(0,-12,0);P.slam=2;P.grounded=false;P.hasSkyBlast=false;
  frames(16);
  ok(c.broken,'crate '+meta.note+' can be broken with production slam');
}

// Vents remain independent
H.test.loadLevel(2);
for(const leap of L.mandatoryLeaps){
  ok(W.steamVents.some(v=>Math.hypot(v.x-leap.takeoff.x,v.z-leap.takeoff.z)<=leap.takeoff.ventReach),
    'vent remains for '+leap.id);
}

// ---- Teaching safe; post-teaching misses → lava ----
H.test.loadLevel(2);
const teachA=L.teachGaps[0];
ok(!inLava(0,1.6,teachA.failFloorZ),'first teaching fail floor remains safe');
ok(!W.lavas.some(lv=>lv.max.y<1.2&&Math.abs(lv.x)<4&&lv.min.z<teachA.farEdgeZ&&lv.max.z>teachA.nearLipZ),
  'no ground basin under first teaching gap centerline');

function missSide(leap){
  settle(0,leap.farSafe.y,leap.farSafe.z);
  P.hp=4;P.inv=0;P.lavaRecT=0;P.hasSkyBlast=true;
  P.pos.set(11,leap.farSafe.y+0.3,leap.farSafe.z);P.vel.set(0,-1,0);P.grounded=false;
  let hit=false;
  for(let i=0;i<140;i++){quiet();frames(1);if(P.lavaRecT>0||P.hp<4||inLava(P.pos.x,P.pos.y,P.pos.z)){hit=true;break;}}
  return hit;
}
for(const leap of [L.mandatoryLeaps[0],L.mandatoryLeaps[1],L.mandatoryLeaps[3],L.mandatoryLeaps[4]]){
  H.test.loadLevel(2);
  ok(missSide(leap),'missing '+leap.id+' hits lava');
}

// Area 3 low miss near wisp approach
H.test.loadLevel(2);
settle(0,19.5,-230);P.hp=4;P.inv=0;
P.pos.set(11,19.8,-234);P.vel.set(0,-2,0);P.grounded=false;
let wispMiss=false;
for(let i=0;i<160;i++){frames(1);if(P.lavaRecT>0||P.hp<4){wispMiss=true;break;}}
ok(wispMiss,'missing elevated Wisp terrace falls into lava');

// Pads/anchors still safe
const lavaTun=H.getLava(),r=H.getPhys().r;
for(const leap of L.mandatoryLeaps){
  for(const label of ['nearSafe','farSafe']){
    const p=leap[label];
    const hot=W.lavas.some(lv=>{
      if(!(p.y<lv.max.y+0.5&&p.y+1.15>lv.min.y-0.05))return false;
      const cx=Math.min(Math.max(p.x,lv.min.x),lv.max.x),cz=Math.min(Math.max(p.z,lv.min.z),lv.max.z);
      return Math.hypot(p.x-cx,p.z-cz)-r<lavaTun.anchorClear;
    });
    ok(!hot,leap.id+' '+label+' remains outside lava clearance');
  }
}

// First mandatory leap still clears
H.test.loadLevel(2);
const leap0=L.mandatoryLeaps[0];
settle(leap0.nearSafe.x,leap0.nearSafe.y,leap0.nearSafe.z);
P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI;H.CAM.yaw=0;P.inv=99;P.hp=4;
kd({code:'KeyW',preventDefault(){},repeat:false});
for(let i=0;i<22;i++){quiet();frames(1);}
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
for(let i=0;i<10;i++)frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
let landed=false,lavaHit=false;
for(let i=0;i<320;i++){
  quiet();frames(1);
  if(P.lavaRecT>0||P.hp<4)lavaHit=true;
  if(P.grounded&&P.pos.z<=leap0.landing.edgeZ-0.5&&P.pos.z>=leap0.landing.farZ-0.5&&P.pos.y>=leap0.farSafe.y-1&&P.lavaRecT<=0){landed=true;break;}
}
release();
ok(landed&&!lavaHit,'first mandatory leap still clears (z='+P.pos.z.toFixed(2)+')');

// Prototype soft-return removed — Organ FINISH owns the end
H.test.loadLevel(2);
ok(!W.protoEndpoints||W.protoEndpoints.length===0,'no proto endpoint after Stage 7');
ok(W.organ&&typeof W.FINISH.onAllAwake==='function','Steam Organ FINISH present');
ok(!W.won,'Organ presence alone does not win');

// Regressions
H.test.loadLevel(0);
ok(H.getLevel().id==='level1'&&H.getSky().boostMax===0,'Level 1 unchanged');
H.test.loadLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 unchanged');
H.test.loadLevel(2);
ok(H.getSky().glideDur===0.55&&L.snoozleGoal===4,'Level 3 Stage 4.6 restores');

report();
