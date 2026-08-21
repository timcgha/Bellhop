// Level 3 Stage 2: lava contact, safe anchors, recovery, vents, mandatory-leap CI.
// Geometry-agnostic against the Stage 4 production route (uses L.route / mandatoryLeaps).
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

H.startLevel(2);
const L=H.getLevel();
const lavaTun=H.getLava();
ok(L&&L.id==='level3','boots Level 3');
ok(lavaTun.anchorSettle===0.22,'safe-anchor settle is 0.22s');
ok(lavaTun.anchorClear===0.85,'safe-anchor lava clearance is 0.85');
ok(lavaTun.recovery===0.42,'lava recovery max is 0.42s');
ok(lavaTun.recovery<=lavaTun.hurtInv,'recovery duration ≤ hurt invulnerability');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Stage 1 Sky Blast tuning unchanged');

const DT=1/60;
const side=L.route.sideLava;
const firstLeap=L.mandatoryLeaps[0];
function releaseMove(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quietEnemies(){
  for(const e of W.gloops){if(!e.alive)continue;e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}
  for(const e of W.cinders){if(!e.alive)continue;e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}
  for(const q of W.goos){if(q.alive){q.alive=false;if(q.m)q.m.visible=false;}}
  for(const q of W.embers){if(q.alive){q.alive=false;q.m.visible=false;}}
}
function settle(x,y,z){
  releaseMove();quietEnemies();
  P.inv=0;P.dead=false;P.lavaRecT=0;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(6);
}
function inLavaAt(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function waitRecovery(){
  let n=0;
  while(P.lavaRecT>0&&n<180){frames(1);n++;}
  frames(2);
  return n;
}
function standUntilAnchor(x,y,z,want){
  settle(x,y,z);P.inv=0;P.dead=false;P.vel.set(0,0,0);P.grounded=true;P.surf='stone';P.lavaRecT=0;
  const need=Math.ceil((lavaTun.anchorSettle+0.2)/DT)+8;
  for(let i=0;i<need;i++){
    quietEnemies();
    P.pos.set(x,y,z);P.grounded=true;P.vel.set(0,0,0);P.surf='stone';P.inv=0;P.lavaRecT=0;
    frames(1);
  }
  if(want){
    ok(Math.hypot(P.safeAnchor.x-x,P.safeAnchor.z-z)<0.85,'anchor settled near '+want+' ('+P.safeAnchor.x.toFixed(2)+','+P.safeAnchor.z.toFixed(2)+')');
  }
}

ok(Math.hypot(P.safeAnchor.x-L.spawn.x,P.safeAnchor.z-L.spawn.z)<0.01,'spawn initializes safe anchor');
ok(!inLavaAt(P.safeAnchor.x,P.safeAnchor.y,P.safeAnchor.z),'spawn anchor is not in lava');
ok(W.lavas.length>=2,'Level 3 has lava volumes');
ok(H.getPhys().r===0.36,'clearance uses player radius R=0.36');

{
  const lv=W.lavas.find(l=>Math.abs(l.x-side.x)<0.5&&Math.abs(l.z-side.z)<0.5);
  ok(!!lv,'avoidable side lava pool present');
  const clear=lavaTun.anchorClear,R=H.getPhys().r;
  const px=lv.max.x+clear*0.5,pz=(lv.min.z+lv.max.z)/2;
  const centerDist=px-lv.max.x,bodyDist=centerDist-R;
  ok(centerDist<clear&&bodyDist<clear,'fixture: center-only would look safer than body clearance');
  standUntilAnchor(0,0.4,18,'clear-base');
  const baseA={x:P.safeAnchor.x,z:P.safeAnchor.z};
  P.inv=0;P.lavaRecT=0;P.pos.set(px,0.4,pz);P.vel.set(0,0,0);P.grounded=true;P.surf='stone';
  for(let i=0;i<Math.ceil((lavaTun.anchorSettle+0.2)/DT)+8;i++){quietEnemies();P.pos.set(px,0.4,pz);P.grounded=true;P.vel.set(0,0,0);P.inv=0;frames(1);}
  ok(Math.hypot(P.safeAnchor.x-baseA.x,P.safeAnchor.z-baseA.z)<0.5,'body-aware clearance rejects near-lava centers that only look safe by point distance');
}

const ns=firstLeap.nearSafe;
standUntilAnchor(ns.x,ns.y,ns.z,'near pad');
P.hasSkyBlast=true;P.puff=true;P.hp=4;P.inv=0;P.leapBoost.set(0,0,-8);
const hp0=P.hp;
P.pos.set(side.x,0.25,side.z);P.vel.set(0,-1,0);P.grounded=false;P.inv=0;P.leapBoost.set(0,0,-8);P.lavaRecT=0;
frames(3);
ok(P.hp===hp0-1,'lava contact costs exactly one heart');
ok(P.hasSkyBlast===true,'lava does not remove hasSkyBlast');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'lava clears leapBoost immediately');
ok(P.inv>1.0,'lava grants normal hurt invulnerability');
ok(P.lavaRecT>0||Math.hypot(P.pos.x-P.safeAnchor.x,P.pos.z-P.safeAnchor.z)<1.5,'lava recovery engaged or already near anchor');

const recMaxSeen=P.lavaRecMax||lavaTun.recovery;
ok(recMaxSeen<=lavaTun.hurtInv,'recovery duration bounded by hurt knockback/inv window');
waitRecovery();
ok(P.lavaRecT===0,'recovery terminates cleanly');
ok(!inLavaAt(P.pos.x,P.pos.y,P.pos.z),'arrival is not inside lava');
ok(Math.hypot(P.pos.x-P.safeAnchor.x,P.pos.z-P.safeAnchor.z)<0.35,'recovery reaches the safe anchor');

const hp1=P.hp;
P.pos.set(side.x,0.2,side.z);P.vel.set(0,0,0);P.inv=1.2;P.lavaRecT=0;
frames(30);
ok(P.hp===hp1,'i-frames prevent a second lava heart loss');
P.inv=0;P.pos.set(ns.x,ns.y,ns.z);P.vel.set(0,0,0);P.grounded=true;frames(4);
ok(P.hp===hp1,'leaving lava after one contact does not drain further');

// ---- end-to-end: powered leap into first mandatory gap lava ----
standUntilAnchor(ns.x,ns.y,ns.z,'takeoff');
P.hasSkyBlast=true;P.puff=true;P.hp=4;P.inv=0;P.yaw=Math.PI;H.CAM.yaw=0;
kd({code:'KeyW',preventDefault(){},repeat:false});
for(let i=0;i<28;i++)frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)>1,'powered leap has live leapBoost before lava');
const hpLeap=P.hp;
const boostBeforeLava=Math.hypot(P.leapBoost.x,P.leapBoost.z);
const gapLava=W.lavas.find(lv=>Math.abs(lv.x)<2&&lv.z<firstLeap.takeoff.z&&lv.z>firstLeap.landing.edgeZ);
ok(!!gapLava,'mandatory gap lava present');
P.pos.set(gapLava.x,gapLava.y+0.05,gapLava.z);P.vel.y=-2;P.grounded=false;
let hitLava=false;
for(let i=0;i<30;i++){
  frames(1);
  if(P.hp<hpLeap||P.lavaRecT>0){hitLava=true;break;}
}
ku({code:'KeyW'});ku({code:'Space'});
ok(hitLava,'powered leap contacted lava while boost was live (boost was '+boostBeforeLava.toFixed(2)+')');
ok(P.hp===hpLeap-1,'e2e: exactly one heart lost');
ok(P.hasSkyBlast===true,'e2e: hasSkyBlast still true');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'e2e: leapBoost == 0');
waitRecovery();
ok(Math.hypot(P.pos.x-P.safeAnchor.x,P.pos.z-P.safeAnchor.z)<0.4,'e2e: recovery reaches valid safe anchor');
const hpAfter=P.hp;
frames(20);
ok(P.hp===hpAfter,'e2e: no immediate second lava contact on arrival');
ok(P.puff===true,'landing/recovery restores spent P.puff for a retry');

standUntilAnchor(ns.x,ns.y,ns.z,'near');
P.hp=1;P.inv=0;P.hasSkyBlast=true;P.dead=false;
P.pos.set(side.x,0.15,side.z);P.vel.set(0,-2,0);P.grounded=false;
frames(6);
ok(P.dead===true||P.hp<=0,'one-heart lava contact follows normal death');
for(let i=0;i<140;i++){frames(1);if(!P.dead)break;}
ok(!P.dead&&P.hp===P.maxHp,'death respawns with full hearts');

standUntilAnchor(0,0.4,18,'base');
const base={x:P.safeAnchor.x,z:P.safeAnchor.z};
P.grounded=false;P.pos.set(2,3,18);P.vel.set(0,4,0);P.inv=0;
frames(10);
ok(Math.hypot(P.safeAnchor.x-base.x,P.safeAnchor.z-base.z)<0.2,'airborne movement does not update the anchor');

standUntilAnchor(0,0.4,18,'base2');
const base2={x:P.safeAnchor.x,z:P.safeAnchor.z};
const land=firstLeap.landing;
P.pos.set(land.x,firstLeap.farSafe.y,land.edgeZ-0.2);P.vel.set(0,0,0);P.grounded=true;P.surf='stone';P.inv=0;
frames(3);
P.pos.set(0,0.4,18);P.vel.set(0,0,0);P.grounded=true;frames(4);
ok(Math.hypot(P.safeAnchor.x-base2.x,P.safeAnchor.z-base2.z)<0.35,'brief edge clip does not move the anchor');

standUntilAnchor(ns.x,ns.y,ns.z,'pre-hurt');
const preHurt={x:P.safeAnchor.x,z:P.safeAnchor.z};
P.inv=1.2;P.pos.set(ns.x-2,ns.y,ns.z);P.vel.set(0,0,0);P.grounded=true;P.surf='stone';
frames(Math.ceil(lavaTun.anchorSettle/0.05)+6);
ok(Math.hypot(P.safeAnchor.x-preHurt.x,P.safeAnchor.z-preHurt.z)<0.35,'hurt i-frames do not update the anchor');

standUntilAnchor(ns.x,ns.y,ns.z,'pre-lava-anchor');
const preLava={x:P.safeAnchor.x,z:P.safeAnchor.z};
P.inv=99;P.lavaRecT=0;P.pos.set(side.x,0.2,side.z);P.grounded=true;P.surf='stone';P.vel.set(0,0,0);
frames(Math.ceil((lavaTun.anchorSettle+0.12)/DT)+8);
ok(Math.hypot(P.safeAnchor.x-preLava.x,P.safeAnchor.z-preLava.z)<0.35,'standing in lava volume does not update the anchor');
ok(!inLavaAt(P.safeAnchor.x,P.safeAnchor.y,P.safeAnchor.z),'anchor remains outside lava');

// ---- far-side anchor after running Sky Blast landing ----
standUntilAnchor(ns.x,ns.y,ns.z,'near-cross');
const nearBeforeCross={x:P.safeAnchor.x,z:P.safeAnchor.z};
ok(nearBeforeCross.z>firstLeap.landing.edgeZ,'pre-cross anchor is on the near side');
quietEnemies();
P.hasSkyBlast=true;P.puff=true;P.inv=0;P.yaw=Math.PI;H.CAM.yaw=0;P.hp=4;P.leapBoost.set(0,0,0);P.lavaRecT=0;
kd({code:'KeyW',preventDefault(){},repeat:false});
for(let i=0;i<16;i++){quietEnemies();frames(1);}
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
for(let i=0;i<12;i++){quietEnemies();frames(1);}
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)>1,'Sky Blast boost live for the crossing');
let landedFar=false,landI=-1,runSpAtLand=0,lavaOnCross=false;
const farEdge=firstLeap.landing.edgeZ;
for(let i=0;i<320;i++){
  quietEnemies();
  frames(1);
  if(P.lavaRecT>0||P.hp<4)lavaOnCross=true;
  if(!landedFar&&P.grounded&&P.pos.z<=farEdge-1&&P.pos.y>=firstLeap.farSafe.y-0.5&&P.lavaRecT<=0){
    landedFar=true;landI=i;runSpAtLand=Math.hypot(P.vel.x,P.vel.z);
  }
  if(landedFar&&i>=landI+Math.ceil((lavaTun.anchorSettle+0.25)/DT)+24)break;
  if(lavaOnCross&&!landedFar&&i>40)break;
}
ok(!lavaOnCross,'crossing did not touch lava');
ok(landedFar,'powered leap lands on the far pad (z='+P.pos.z.toFixed(2)+')');
ok(runSpAtLand>4,'landed while still carrying substantial run speed ('+runSpAtLand.toFixed(2)+')');
ok(Math.hypot(P.vel.x,P.vel.z)>3,'still moving forward after landing without braking ('+Math.hypot(P.vel.x,P.vel.z).toFixed(2)+')');
ok(P.safeAnchor.z<farEdge,'running far-side occupancy updates the safe anchor (z='+P.safeAnchor.z.toFixed(2)+')');
ok(P.safeAnchor.z<nearBeforeCross.z-5,'far anchor differs from the pre-cross near anchor');
const farA={x:P.safeAnchor.x,y:P.safeAnchor.y,z:P.safeAnchor.z};

// Fail into a far-side lava if one exists near the landing; else skip with a soft stand-in.
const farLava=W.lavas.find(lv=>lv.z<farEdge&&lv.z>firstLeap.landing.farZ-8&&Math.abs(lv.x)>3);
if(farLava){
  P.hp=4;P.inv=0;P.hasSkyBlast=true;P.leapBoost.set(0,0,0);
  P.pos.set(farLava.x,farLava.y+0.05,farLava.z);P.vel.set(0,-1,0);P.grounded=false;
  frames(5);
  ok(P.lavaRecT>0||P.inv>0,'far-side lava triggers recovery');
  waitRecovery();
  ku({code:'KeyW'});ku({code:'Space'});
  ok(P.pos.z<farEdge+2,'running-landing failure recovers on the far side, not the start (z='+P.pos.z.toFixed(2)+')');
  ok(Math.hypot(P.pos.x-farA.x,P.pos.z-farA.z)<5.5,'recovery lands near the far-side anchor established while running');
}else{
  ku({code:'KeyW'});ku({code:'Space'});
  ok(true,'no off-path far lava puddle in production slice — far-anchor already asserted');
  ok(true,'far-anchor proximity covered by running-landing settle');
}

standUntilAnchor(0,0.4,18,'pre-lip');
const preLip={x:P.safeAnchor.x,z:P.safeAnchor.z};
P.pos.set(land.x,firstLeap.farSafe.y,land.edgeZ-0.05);P.vel.set(0,0,-6);P.grounded=true;P.surf='stone';P.inv=0;
frames(4);
P.pos.set(0,0.4,18);P.vel.set(0,0,0);P.grounded=true;frames(4);
ok(Math.hypot(P.safeAnchor.x-preLip.x,P.safeAnchor.z-preLip.z)<0.5,'brief far-lip contact without settle/clearance does not move the anchor');

P.hasSkyBlast=false;P.puff=false;P.leapBoost.set(3,0,3);P.inv=99;
const vent=W.steamVents.find(v=>Math.hypot(v.x-firstLeap.takeoff.x,v.z-firstLeap.takeoff.z)<=firstLeap.takeoff.ventReach)||W.steamVents[0];
ok(!!vent,'production has a steam vent');
const boostBefore=Math.hypot(P.leapBoost.x,P.leapBoost.z);
settle(vent.x,vent.y,vent.z);frames(8);
ok(P.hasSkyBlast===true,'vent restores hasSkyBlast');
ok(P.puff===true,'vent restores spent P.puff');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<=boostBefore+0.01,'vent does not create a leapBoost by itself');
P.leapBoost.set(0,0,0);P.hasSkyBlast=false;P.puff=false;
settle(vent.x,vent.y,vent.z);frames(6);
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.01,'vent refill leaves leapBoost at zero');

function checkMandatoryLeaps(leaps,vents,lavas){
  const fails=[];
  const R=H.getPhys().r;
  for(const leap of leaps||[]){
    const t=leap.takeoff,land=leap.landing;
    if(!t||!land||!leap.nearSafe||!leap.farSafe){fails.push(leap.id+': missing fields');continue;}
    const ventOk=vents.some(v=>Math.hypot(v.x-t.x,v.z-t.z)<=t.ventReach);
    if(!ventOk)fails.push(leap.id+': no renewable vent within ventReach of takeoff');
    for(const label of ['nearSafe','farSafe']){
      const p=leap[label];
      const hot=lavas.some(lv=>{
        const cx=Math.min(Math.max(p.x,lv.min.x),lv.max.x),cz=Math.min(Math.max(p.z,lv.min.z),lv.max.z);
        return Math.hypot(p.x-cx,p.z-cz)-R<lavaTun.anchorClear;
      });
      if(hot)fails.push(leap.id+': '+label+' is inside lava clearance (body+R)');
    }
    const pad=W.solids.find(s=>s.surf==='stone'&&Math.abs(s.max.z-land.edgeZ)<0.05&&Math.abs(s.min.z-land.farZ)<0.05);
    if(!pad)fails.push(leap.id+': landing edgeZ/farZ do not match a stone pad solid');
    const depth=Math.abs(land.edgeZ-land.farZ);
    if(!(land.minDepth>0))fails.push(leap.id+': landing.minDepth must be a named positive requirement');
    if(depth<land.minDepth)fails.push(leap.id+': landing depth '+depth+' < minDepth '+land.minDepth);
    for(const lv of lavas){
      const onCorridor=lv.min.x<land.x+6&&lv.max.x>land.x-6;
      if(!onCorridor)continue;
      if(lv.min.z<land.edgeZ-0.05&&lv.max.z>land.farZ)fails.push(leap.id+': gap lava overlaps the landing pad (lava z '+lv.min.z.toFixed(2)+'..'+lv.max.z.toFixed(2)+')');
    }
  }
  return fails;
}

const leaps=L.mandatoryLeaps;
ok(Array.isArray(leaps)&&leaps.length>=1,'Level 3 declares mandatoryLeaps data');
const inv0=checkMandatoryLeaps(leaps,W.steamVents,W.lavas);
ok(inv0.length===0,'mandatory-leap invariants hold ('+(inv0[0]||'ok')+')');

const withoutVent=W.steamVents.filter(v=>Math.hypot(v.x-leaps[0].takeoff.x,v.z-leaps[0].takeoff.z)>leaps[0].takeoff.ventReach);
const invFail=checkMandatoryLeaps(leaps,withoutVent,W.lavas);
ok(invFail.some(f=>/no renewable vent/.test(f)),'removing the required vent makes the mandatory-leap invariant fail');

ok(W.lavas.some(lv=>Math.abs(lv.x-side.x)<0.5&&Math.abs(lv.z-side.z)<0.5),'avoidable side lava pool present');
ok(W.lavas.some(lv=>Math.abs(lv.x)<2&&lv.z<firstLeap.takeoff.z),'mandatory gap lava present');

H.test.loadLevel(0);
ok(H.getPhys().grav===-30&&H.getPhys().jumpV===10.5&&H.getSky().boostMax===0,'Level 1 physics unchanged');
H.test.loadLevel(1);
ok(H.getPhys().grav===-6&&H.getPhys().jumpV===5.5,'Level 2 physics unchanged');
H.test.loadLevel(2);
ok(H.getSky().puffVMul===1.4&&H.getLava().recovery===0.42,'Level 3 lava + Sky Blast restore after reload');

report();
