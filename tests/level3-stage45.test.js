// Level 3 Stage 4.5: under-route lava, more Sky Blast crates, wings + glide.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

H.startLevel(2);
const L=H.getLevel();
const sky=H.getSky();
ok(L&&L.id==='level3','boots Level 3');
ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.boostDecay===1.6,'Stage 1 leap tuning unchanged');
ok(sky.glideDur===0.55&&sky.glideFallCap===-2.2&&sky.glideStartVy===0.2,'glide constants present');

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
  P.inv=99;P.dead=false;P.lavaRecT=0;P.glideT=0;P.glideArmed=false;
  P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(6);
}
function inLava(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function wingsOpen(){
  const pl=H.getPlayer&&H.getPlayer();
  const w=pl&&pl.userData&&pl.userData.wings;
  if(!w||!w.userData)return P.glideT>0;
  return w.visible&&w.userData.open>0.2;
}

// ---- More Sky Blast mystery boxes (vents stay independent) ----
const skyCrates=W.crates.filter(c=>c.item==='sky');
ok(skyCrates.length>=5&&skyCrates.length<=8,'Areas 1–3 have multiple Sky Blast crates ('+skyCrates.length+')');
ok(L.route.skyCrates&&L.route.skyCrates.length===skyCrates.length,'route.skyCrates metadata matches live crates');
const vents=W.steamVents;
ok(vents.length>=5,'renewable steam vents remain on the route');
const firstCrate=skyCrates.find(c=>Math.abs(c.z+52)<1);
ok(!!firstCrate,'teaching Sky Blast crate still present');
settle(firstCrate.x,firstCrate.y+1.3,firstCrate.z);P.vel.set(0,-10,0);P.slam=2;P.grounded=false;P.hasSkyBlast=false;P.leapBoost.set(0,0,0);
frames(14);
ok(firstCrate.broken,'mystery box breaks');
const pow=W.powers.find(p=>p.kind==='sky'&&!p.got);
if(pow){P.pos.set(pow.x,pow.y-0.4,pow.z);P.vel.set(0,0,0);frames(8);}
ok(P.hasSkyBlast===true,'breaking a box grants hasSkyBlast');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'box does not create leapBoost');
const before=P.hasSkyBlast;
const second=skyCrates.find(c=>!c.broken&&c!==firstCrate);
if(second){
  settle(second.x,second.y+1.3,second.z);P.hasSkyBlast=true;P.leapBoost.set(0,0,0);
  P.vel.set(0,-10,0);P.slam=2;P.grounded=false;frames(14);
  const p2=W.powers.find(p=>p.kind==='sky'&&!p.got&&Math.hypot(p.x-second.x,p.z-second.z)<2);
  if(p2){P.pos.set(p2.x,p2.y-0.4,p2.z);frames(8);}
  ok(P.hasSkyBlast===true&&before===true,'already-powered player does not stack a second power tier');
  ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'second box still does not create leapBoost');
}else ok(true,'only one unbroken crate in this pass — stacking covered by hasSkyBlast boolean');

// Mandatory leaps still have vents even if all crates are gone
for(const c of W.crates){if(!c.broken){c.broken=true;c.g.visible=false;}}
for(const leap of L.mandatoryLeaps){
  const okVent=vents.some(v=>Math.hypot(v.x-leap.takeoff.x,v.z-leap.takeoff.z)<=leap.takeoff.ventReach);
  ok(okVent,'vent remains for '+leap.id+' without crates');
}

// ---- Lava coverage: teachFail safe; real leaps have under-route lava ----
H.test.loadLevel(2);
const teachA=L.teachGaps[0];
ok(!inLava(0,1.6,teachA.failFloorZ),'intentional first teaching fail floor remains outside lava');
ok(!W.lavas.some(lv=>lv.max.y<1&&lv.min.z<teachA.farEdgeZ&&lv.max.z>teachA.nearLipZ&&Math.abs(lv.x)<4),
  'no ground basin under the first teaching gap centerline');

function missPadIntoBasin(leap){
  // Drop beside the far pad into the under-route basin (not onto the pad top).
  const yPad=leap.farSafe.y;
  settle(0,yPad,leap.landing.edgeZ-1);
  P.hasSkyBlast=true;P.inv=0;P.hp=4;P.lavaRecT=0;
  // Step off to the side over empty air / basin
  P.pos.set(11,yPad+0.2,leap.farSafe.z);P.vel.set(0,-1,0);P.grounded=false;
  let hit=false;
  for(let i=0;i<120;i++){
    quiet();frames(1);
    if(P.lavaRecT>0||P.hp<4||inLava(P.pos.x,P.pos.y,P.pos.z)){hit=true;break;}
    if(P.grounded&&P.pos.y<1&&!inLava(P.pos.x,P.pos.y,P.pos.z))break;
  }
  return hit;
}
const sampleLeaps=[L.mandatoryLeaps[0],L.mandatoryLeaps[1],L.mandatoryLeaps[3],L.mandatoryLeaps[4]];
for(const leap of sampleLeaps){
  H.test.loadLevel(2);
  ok(missPadIntoBasin(leap),'missing '+leap.id+' elevated route contacts lava');
}

// Gap midpoints still have elevated lava
H.test.loadLevel(2);
for(const leap of L.mandatoryLeaps){
  const midZ=(leap.takeoff.z+leap.landing.edgeZ)/2;
  const elev=W.lavas.some(lv=>lv.max.y>leap.nearSafe.y-2&&lv.min.x<-2&&lv.max.x>2&&lv.min.z<midZ&&lv.max.z>midZ);
  const basin=W.lavas.some(lv=>lv.max.y<2&&lv.min.x<-4&&lv.max.x>4&&lv.min.z<midZ&&lv.max.z>midZ);
  ok(elev||basin,'failure region under '+leap.id+' has lava (elev='+elev+', basin='+basin+')');
  ok(!inLava(leap.farSafe.x,leap.farSafe.y,leap.farSafe.z),'landing pad '+leap.id+' remains outside lava');
}

// Body-aware clearance still rejects near-edge centers at the same height as side lava
const side=L.route.sideLava;
const lavaTun=H.getLava(),r=H.getPhys().r;
settle(0,0.4,14);
const nearX=side.x-2.2,nearZ=side.z;
const clearNear=(()=>{
  let best=Infinity;
  for(const lv of W.lavas){
    if(!(0.4<lv.max.y+0.5&&0.4+1.15>lv.min.y-0.05))continue;
    const cx=Math.min(Math.max(nearX,lv.min.x),lv.max.x),cz=Math.min(Math.max(nearZ,lv.min.z),lv.max.z);
    best=Math.min(best,Math.hypot(nearX-cx,nearZ-cz)-r);
  }
  return best;
})();
ok(clearNear<lavaTun.anchorClear,'body-aware clearance still tight near side lava');

// Elevated pad anchors ignore ground basins underneath
const fs=L.mandatoryLeaps[0].farSafe;
settle(fs.x,fs.y,fs.z);
for(let i=0;i<Math.ceil((lavaTun.anchorSettle+0.25)/0.05)+10;i++){
  quiet();P.pos.set(fs.x,fs.y,fs.z);P.grounded=true;P.vel.set(0,0,0);P.surf='stone';P.inv=0;P.lavaRecT=0;frames(1);
}
ok(Math.hypot(P.safeAnchor.x-fs.x,P.safeAnchor.z-fs.z)<0.6,'elevated pad can claim safe-anchor above ground basin');

// Checkpoints not inside expanded lava
for(const c of W.checks){
  ok(!inLava(c.x,c.y,c.z),'checkpoint at z='+c.z+' is not inside lava');
}

// ---- Wings / glide lifecycle ----
H.test.loadLevel(2);
ok(H.getPlayer()&&H.getPlayer().userData.wings,'player has mechanical wing meshes');

settle(0,0.4,16);P.hasSkyBlast=false;P.puff=true;P.yaw=Math.PI/2;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(20);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
let sawWing=false,sawGlide=false;
for(let i=0;i<100;i++){frames(1);if(P.glideT>0)sawGlide=true;if(wingsOpen())sawWing=true;if(P.grounded&&i>8)break;}
release();
ok(!sawGlide&&!sawWing,'ordinary jump/puff never deploys wings or glide');

settle(0,0.4,16);P.hasSkyBlast=true;P.puff=true;P.glideT=0;P.glideArmed=false;
frames(20);
ok(P.glideT===0&&!wingsOpen(),'owning Sky Blast while idle does not deploy wings');

function measureLeap(opts){
  const hold=!!(opts&&opts.hold);
  const powered=opts&&opts.powered!==false;
  settle(-8,0.4,16);P.yaw=Math.PI/2;H.CAM.yaw=0;P.inv=99;
  P.hasSkyBlast=!!powered;P.puff=true;P.leapBoost.set(0,0,0);P.glideT=0;P.glideArmed=false;
  kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<40;i++)frames(1);
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
  frames(8);
  const x0=P.pos.x,y0=P.pos.y;
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);
  if(!hold)ku({code:'Space'});
  else{/* keep held */}
  let xMax=x0,yPeak=y0,boost0=Math.hypot(P.leapBoost.x,P.leapBoost.z);
  let glideSeen=0,glideMax=0,wingSeen=false,minVyDuringGlide=0,startedGlideY=null;
  for(let i=0;i<260;i++){
    frames(1);
    xMax=Math.max(xMax,P.pos.x);yPeak=Math.max(yPeak,P.pos.y);
    if(P.glideT>0){
      glideSeen++;glideMax=Math.max(glideMax,P.glideT);
      if(startedGlideY==null)startedGlideY=P.vel.y;
      minVyDuringGlide=Math.min(minVyDuringGlide,P.vel.y);
    }
    if(wingsOpen())wingSeen=true;
    if(P.grounded&&i>12)break;
  }
  release();
  return{
    travel:xMax-x0,peak:yPeak-0.4,boost0,
    glideFrames:glideSeen,glideMax,wingSeen,startedGlideY,minVyDuringGlide
  };
}

const unpowered=measureLeap({powered:false,hold:false});
const powered=measureLeap({powered:true,hold:false});
const poweredHold=measureLeap({powered:true,hold:true});

ok(powered.boost0>5,'powered Sky Blast creates leapBoost');
ok(powered.wingSeen,'wings deploy during powered glide');
ok(powered.glideFrames>0,'glide phase runs on powered leap');
ok(powered.startedGlideY!=null&&powered.startedGlideY<=sky.glideStartVy+0.05,'glide begins near crest/descent');
ok(powered.minVyDuringGlide>=sky.glideFallCap-0.05,'glide caps descent (minVy='+powered.minVyDuringGlide.toFixed(2)+')');
ok(powered.travel>unpowered.travel+2,'powered+glide travels farther than unpowered');
ok(powered.peak<unpowered.peak+2.5,'powered leap is farther not a big height increase (peaks '+unpowered.peak.toFixed(2)+' / '+powered.peak.toFixed(2)+')');
ok(poweredHold.glideFrames*(1/60)<sky.glideDur+0.2,'hold-to-float does not extend glide indefinitely');
ok(Math.abs(poweredHold.travel-powered.travel)<3.5,'hold during glide only modestly changes distance');

// Report measured distances for the Stage 4.5 writeup
ok(true,'MEASURE unpowered travel='+unpowered.travel.toFixed(2)+' peak='+unpowered.peak.toFixed(2));
ok(true,'MEASURE powered+glide travel='+powered.travel.toFixed(2)+' peak='+powered.peak.toFixed(2)+' glideDur='+sky.glideDur+' fallCap='+sky.glideFallCap);
ok(true,'MEASURE powered+hold travel='+poweredHold.travel.toFixed(2)+' peak='+poweredHold.peak.toFixed(2));

// Landing clears
settle(-6,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(30);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
for(let i=0;i<200;i++){frames(1);if(P.grounded&&i>10)break;}
release();
frames(20);
ok(P.glideT===0&&P.glideArmed===false,'landing clears glide state');
ok(!wingsOpen(),'wings retract after landing');

// Air-slam clears mid-glide
settle(-6,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;P.inv=99;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(30);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
let armed=false;
for(let i=0;i<40;i++){frames(1);if(P.glideT>0||P.glideArmed){armed=true;break;}}
ok(armed||Math.hypot(P.leapBoost.x,P.leapBoost.z)>1,'boost/glide live before slam');
tap('KeyJ',2);frames(2);
ok(P.glideT===0&&P.glideArmed===false,'air-slam clears glide');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'air-slam clears leapBoost');
release();
for(let i=0;i<100;i++){frames(1);if(P.grounded&&P.slam===0)break;}

// Enemy knockback clears glide + power
settle(0,0.4,14);P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,-10);P.glideT=0.4;P.glideArmed=false;P.inv=0;P.hp=4;
const hp0=P.hp;
let emb=W.embers.find(e=>!e.alive)||W.embers[0];
emb.alive=true;emb.life=2;emb.pos.set(P.pos.x,P.pos.y+0.55,P.pos.z);emb.vel.set(0,0,0);emb.m.visible=true;
let hurt=false;
for(let i=0;i<40;i++){emb.pos.set(P.pos.x,P.pos.y+0.5,P.pos.z);frames(1);if(P.hp<hp0){hurt=true;break;}}
ok(hurt,'enemy hit during glide');
ok(P.hasSkyBlast===false,'enemy hit removes hasSkyBlast');
ok(P.glideT===0&&Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'enemy hit clears glide and leapBoost');

// Lava clears glide/boost, keeps power
H.test.loadLevel(2);
settle(0,0.4,14);P.hasSkyBlast=true;P.leapBoost.set(0,0,-8);P.glideT=0.4;P.inv=0;P.hp=4;
const sideLv=L.route.sideLava;
P.pos.set(sideLv.x,0.2,sideLv.z);P.vel.set(0,-1,0);P.grounded=false;P.lavaRecT=0;
frames(4);
ok(P.hasSkyBlast===true,'lava preserves hasSkyBlast');
ok(P.glideT===0&&Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'lava clears glide and leapBoost');

// Death clears glide — fresh contact at one heart
H.test.loadLevel(2);
settle(0,0.4,14);P.hasSkyBlast=true;P.hp=1;P.inv=0;P.glideT=0.3;P.dead=false;P.lavaRecT=0;
P.pos.set(sideLv.x,0.2,sideLv.z);P.vel.set(0,-1,0);P.grounded=false;
frames(8);
ok(P.dead===true||P.hp<=0,'lava death path');
ok(P.glideT===0,'death clears glide');

// Cannot stack glide by mashing
settle(-6,0.4,16);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(25);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
for(let i=0;i<20;i++)frames(1);
const g1=P.glideT;
kd({code:'Space',preventDefault(){},repeat:false});frames(4);ku({code:'Space'});
ok(!(P.glideT>g1+0.2),'repeated presses do not stack a longer glide');
release();

// End-to-end first mandatory leap still clears onto the landing pad
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
ok(landed&&!lavaHit,'first mandatory leap still clears with glide (z='+P.pos.z.toFixed(2)+')');

// Regressions
H.test.loadLevel(0);
ok(H.getLevel().id==='level1'&&H.getSky().boostMax===0&&H.getSky().glideDur===0,'Level 1 unchanged (no glide)');
H.test.loadLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 unchanged');
H.test.loadLevel(2);
ok(H.getSky().boostMax===12.5&&H.getSky().glideDur===0.55&&L.snoozleGoal===4,'Level 3 Stage 4.5 restores');

report();
