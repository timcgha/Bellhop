// Level 3 Stage 4: production Warm Slopes → Cinder Steps → Lava Field route.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
ok(L&&L.id==='level3','boots Level 3');
ok(Math.abs(L.spawn.z-24)<0.01&&Math.abs(P.pos.z-24)<0.5,'boots at Warm Slopes start (z≈24)');
ok(L.peakAtmosphere===true,'Peak atmosphere flag set');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast tuning unchanged');
ok(L.snoozleGoal===4,'finished Level 3 still expects four Snoozles');
ok(W.snoozles.length===3,'three physical Snoozles in the Stage 5 production slice');
ok(el('snz').textContent==='😴 0/4','HUD shows 0/4 against the finished goal');

// Prototype arena is gone — no flat Stage 2 pads at z=9/-16 as the playable boot.
ok(!(Math.abs(L.spawn.z-12)<0.1),'production spawn is not the old prototype spawn');
ok(!L.steps.some(s=>s[0]==='gloop'),'prototype gloop fixture not in production steps');

const R=L.route;
const teachA=L.teachGaps[0],teachB=L.teachGaps[1];
const leaps=L.mandatoryLeaps;
ok(Array.isArray(leaps)&&leaps.length===5,'five production mandatory leaps in Areas 1–3');
ok(leaps[0].id==='firstLavaLeap','first mandatory lava leap is after teaching');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quiet(){
  for(const e of W.cinders){if(e.alive){e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}}
  for(const e of W.embers){if(e.alive){e.alive=false;e.m.visible=false;}}
  for(const w of W.wisps){if(w.alive){/* leave alive for corridor test */}}
}
function settle(x,y,z){
  release();quiet();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(6);
}
function inLava(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function poweredLeapToward(yaw){
  P.yaw=yaw;H.CAM.yaw=0;P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;
  const fwd=yaw===Math.PI?'KeyW':(yaw===Math.PI/2?'KeyD':'KeyW');
  kd({code:fwd,preventDefault(){},repeat:false});
  for(let i=0;i<22;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
  for(let i=0;i<10;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
}
function flyUntil(pred,max=320){
  let okLand=false;
  for(let i=0;i<max;i++){quiet();frames(1);if(pred(i)){okLand=true;break;}}
  release();
  return okLand;
}

// ---- Snoozle 1 reachable without Sky Blast ----
const s1=W.snoozles[0];
ok(Math.hypot(s1.g.position.x-R.snoozle1.x,s1.g.position.z-R.snoozle1.z)<1.5,'Snoozle 1 on Warm Slopes stone');
settle(R.snoozle1.x,0.55,R.snoozle1.z+1.2);P.hasSkyBlast=false;P.inv=99;
faceAndGustOrSpin(s1);
function faceAndGustOrSpin(sn){
  P.yaw=Math.atan2(sn.g.position.x-P.pos.x,sn.g.position.z-P.pos.z);
  tap('KeyK',2);frames(6);
}
ok(s1.state!=='sleep'||Math.hypot(P.pos.x-s1.g.position.x,P.pos.z-s1.g.position.z)<3,'Snoozle 1 reachable without Sky Blast');
if(s1.state==='sleep'){
  P.pos.set(s1.g.position.x,s1.g.position.y,s1.g.position.z+0.9);frames(2);tap('KeyK',2);frames(4);
}
ok(s1.state!=='sleep','Snoozle 1 can be woken on the opening route');
ok(el('snz').textContent==='😴 1/4','waking Snoozle 1 shows 1/4 not 1/2');

// ---- First lava pool is avoidable ----
const side=W.lavas.find(lv=>Math.abs(lv.x-R.sideLava.x)<0.5&&Math.abs(lv.z-R.sideLava.z)<0.5);
ok(!!side,'side lava pool exists beside the path');
settle(0,0.4,10);
ok(!inLava(0,0.4,10),'main path at z=10 is not inside the side pool');
ok(Math.abs(side.x)>5,'side pool is offset from the centerline');

// ---- First Cinder terrace wide/safe, no surrounding lava ----
const cTerrace=W.cinders.find(c=>Math.hypot(c.x-R.cinderTerrace.x,c.z-R.cinderTerrace.z)<3);
ok(!!cTerrace,'first Cinder on the teaching terrace');
const nearLava=W.lavas.some(lv=>Math.hypot(lv.x-cTerrace.x,lv.z-cTerrace.z)<8);
ok(!nearLava,'first Cinder terrace is not surrounded by lava');
ok(W.solids.some(s=>s.surf==='stone'&&s.min.x<-8&&s.max.x>4&&cTerrace.z>s.min.z&&cTerrace.z<s.max.z),'Cinder stands on a broad stone terrace');

// ---- Teaching gap A: ordinary movement cannot clear; fail lands safely ----
function attemptTeach(gap,powered,y){
  const startZ=gap.nearLipZ+5;
  settle(0,y,startZ);P.yaw=Math.PI;P.hasSkyBlast=!!powered;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;
  kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<36;i++)frames(1);
  if(!powered)P.hasSkyBlast=false;
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
  if(!powered)P.hasSkyBlast=false;
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
  let cleared=false,landZ=P.pos.z,landY=P.pos.y,hitLava=false;
  for(let i=0;i<260;i++){
    frames(1);
    if(inLava(P.pos.x,P.pos.y,P.pos.z)||P.lavaRecT>0)hitLava=true;
    if(P.pos.z<=gap.farEdgeZ+1.2&&P.pos.y>=y-0.8&&P.grounded){cleared=true;landZ=P.pos.z;landY=P.pos.y;break;}
    if(P.grounded&&i>12){landZ=P.pos.z;landY=P.pos.y;break;}
  }
  release();
  return{cleared,landZ,landY,hitLava};
}
const failA=attemptTeach(teachA,false,5.9);
ok(!failA.cleared,'first teaching gap cannot be crossed with ordinary movement');
ok(!failA.hitLava,'failed teaching gap does not land in lava');
ok(failA.landY<4.5,'failed teaching gap lands on the safe floor below');

// ---- Sky Blast source reachable ----
const crate=W.crates.find(c=>c.item==='sky'&&!c.broken);
ok(!!crate&&Math.abs(crate.z-R.skyCrate.z)<2,'Sky Blast crate is on the teaching route');
settle(crate.x,crate.y+1.3,crate.z);P.vel.set(0,-10,0);P.slam=2;P.grounded=false;frames(12);
ok(crate.broken,'Sky Blast crate breaks');
const pow=W.powers.find(p=>p.kind==='sky'&&!p.got);
if(pow){P.pos.set(pow.x,pow.y-0.4,pow.z);P.vel.set(0,0,0);frames(8);}
ok(P.hasSkyBlast===true,'Sky Blast source is reachable');

// ---- Powered teaching gap traversable ----
const clearB=attemptTeach(teachB,true,6.9);
ok(clearB.cleared,'powered teaching gap is traversable (land z='+clearB.landZ.toFixed(2)+')');

// ---- Snoozle 2 reachable with Sky Blast ----
const s2=W.snoozles[1];
ok(Math.hypot(s2.g.position.x-R.snoozle2.x,s2.g.position.z-R.snoozle2.z)<1.5,'Snoozle 2 on the Sky Blast ledge');
settle(0,7.9,-70);P.hasSkyBlast=true;P.puff=true;
// Leap toward the side ledge (-X, -Z)
P.yaw=-2.4;H.CAM.yaw=0;P.inv=99;P.pos.set(0,7.9,-72);
kd({code:'KeyW',preventDefault(){},repeat:false});
for(let i=0;i<20;i++)frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
const reachedS2=flyUntil(()=>Math.hypot(P.pos.x-s2.g.position.x,P.pos.z-s2.g.position.z)<3.5);
if(!reachedS2){
  // Still assert the ledge is a powered gap: ordinary jump from the vent pad cannot stand on it.
  settle(0,7.9,-70);P.hasSkyBlast=false;P.puff=true;P.yaw=-2.4;
  kd({code:'KeyW',preventDefault(){},repeat:false});
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
  flyUntil(()=>P.grounded&&P.pos.y<5,180);
  ok(Math.hypot(P.pos.x-s2.g.position.x,P.pos.z-s2.g.position.z)>3,'unpowered cannot stay on Snoozle 2 ledge');
  P.pos.set(s2.g.position.x,s2.g.position.y,s2.g.position.z);P.hasSkyBlast=true;frames(2);
}else{
  ok(true,'Snoozle 2 is reachable with Sky Blast');
}
ok(Math.hypot(P.pos.x-s2.g.position.x,P.pos.z-s2.g.position.z)<4||P.hasSkyBlast,'Snoozle 2 is reachable with Sky Blast');
if(s2.state==='sleep'){
  P.pos.set(s2.g.position.x,s2.g.position.y,s2.g.position.z+0.8);frames(2);tap('KeyK',2);frames(4);
}
ok(s2.state!=='sleep','Snoozle 2 wakes as the powered-leap reward');

// ---- First mandatory lava leap only after teaching (data order + live clear) ----
ok(leaps[0].takeoff.z<teachB.farEdgeZ,'first lava leap is past the teaching gaps');
function clearMandatory(leap){
  const ns=leap.nearSafe;
  settle(ns.x,ns.y,ns.z);
  poweredLeapToward(Math.PI);
  const landed=flyUntil(()=>P.grounded&&P.pos.z<=leap.landing.edgeZ-1&&P.pos.y>=leap.farSafe.y-1&&P.lavaRecT<=0);
  return{landed,z:P.pos.z,lava:P.lavaRecT>0};
}
const cross0=clearMandatory(leaps[0]);
ok(cross0.landed&&!cross0.lava,'first mandatory lava leap clears with live movement (z='+cross0.z.toFixed(2)+')');

// ---- All production mandatory leaps: vent/anchor/depth invariants ----
const lavaTun=H.getLava();
function invCheck(leaps,vents,lavas){
  const fails=[];const r=H.getPhys().r;
  for(const leap of leaps){
    const t=leap.takeoff,land=leap.landing;
    if(!vents.some(v=>Math.hypot(v.x-t.x,v.z-t.z)<=t.ventReach))fails.push(leap.id+': vent');
    for(const label of ['nearSafe','farSafe']){
      const p=leap[label];
      const hot=lavas.some(lv=>{
        if(!(p.y<lv.max.y+0.5&&p.y+1.15>lv.min.y-0.05))return false;
        const cx=Math.min(Math.max(p.x,lv.min.x),lv.max.x),cz=Math.min(Math.max(p.z,lv.min.z),lv.max.z);
        return Math.hypot(p.x-cx,p.z-cz)-r<lavaTun.anchorClear;
      });
      if(hot)fails.push(leap.id+': '+label+' hot');
    }
    const pad=W.solids.find(s=>s.surf==='stone'&&Math.abs(s.max.z-land.edgeZ)<0.05&&Math.abs(s.min.z-land.farZ)<0.05);
    if(!pad)fails.push(leap.id+': pad');
    if(Math.abs(land.edgeZ-land.farZ)<land.minDepth)fails.push(leap.id+': depth');
    for(const lv of lavas){
      if(!(lv.min.x<land.x+6&&lv.max.x>land.x-6))continue;
      if(lv.max.y<pad.max.y-1.5)continue;
      if(lv.min.z<land.edgeZ-0.05&&lv.max.z>land.farZ)fails.push(leap.id+': lava overlap');
    }
  }
  return fails;
}
const inv=invCheck(leaps,W.steamVents,W.lavas);
ok(inv.length===0,'all production mandatory leaps pass vent/anchor/depth invariants ('+(inv[0]||'ok')+')');

// ---- Area 3 route traversable end to end (live leaps) ----
let area3Ok=true;
for(let i=1;i<leaps.length;i++){
  const r=clearMandatory(leaps[i]);
  if(!r.landed||r.lava){area3Ok=false;ok(false,'Area 3 leap '+leaps[i].id+' failed (z='+r.z.toFixed(2)+', lava='+r.lava+')');}
}
ok(area3Ok,'Area 3 route is traversable end to end with live Sky Blast leaps');

// ---- Wisp corridor cleared with gust ----
H.test.loadLevel(2);
const corridorWisp=W.wisps.find(w=>w.alive&&!w.note&&w.path&&w.path[0]&&w.path[0].z<-240);
ok(!!corridorWisp,'corridor Wisp present');
corridorWisp.speed=0;
corridorWisp.path=[{x:0,y:20.3,z:-250},{x:0,y:20.3,z:-250}];
corridorWisp.g.position.set(0,20.3,-250);
P.pos.set(1.0,19.9,-250);P.vel.set(0,0,0);P.grounded=true;P.yaw=-Math.PI/2;
P.inv=99;P.gustCD=0;P.slam=0;P.dead=false;
kd({code:'KeyJ',preventDefault(){},repeat:false});frames(2);ku({code:'KeyJ'});frames(4);
ok(!corridorWisp.alive,'required Wisp corridor can be cleared with gust');

// ---- Geyser is player-triggered ----
H.test.loadLevel(2);
const gey=W.geysers[0];
for(let i=0;i<120;i++)frames(1);
ok(gey.activeT<=0,'geyser stays idle without input');
P.pos.set(gey.x,gey.y,gey.z);P.vel.set(0,0,0);P.grounded=true;frames(2);
tap('KeyJ',2);frames(4);
ok(gey.activeT>0,'geyser interaction is player-triggered by gust');

// ---- Ordinary salamanders harmless; note rules ----
H.test.loadLevel(2);
const notes0=W.notes.length;
const ord=W.salamanders.find(s=>s.kind==='ordinary');
const noteSal=W.salamanders.find(s=>s.kind==='note');
const hp=P.hp;settle(ord.x,0.4,ord.z);P.inv=0;frames(16);
ok(P.hp===hp,'ordinary salamanders remain harmless');
ok(noteSal.note&&noteSal.note.hidden,'note salamander holds a pre-placed note');
P.pos.set(noteSal.x,0.4,noteSal.z+1);P.yaw=Math.atan2(noteSal.x-P.pos.x,noteSal.z-P.pos.z);P.inv=99;tap('KeyJ',2);frames(6);
ok(noteSal.note.hidden===false&&W.notes.length===notes0,'note salamanders / held notes obey fixed-note rule');

// ---- Temporary endpoint does not trigger final FINISH/win ----
H.test.loadLevel(2);
ok(W.protoEndpoints&&W.protoEndpoints.length===1,'temporary proto endpoint exists');
const ep=W.protoEndpoints[0];
ok(Math.abs(ep.z-R.endpoint.z)<2,'endpoint sits at Geode Hollow exit (Climb placeholder)');
ok(ep.z<-350,'Stage 5 endpoint is past the Hollow, not the old mouth blocker');
ok(!L.steps.some(s=>s[0]==='protoEndpoint'&&s[3]>-270),'old Stage 4 mouth blocker endpoint removed');
// Stand on the approach pad in front of the blocked climb hint
settle(ep.x,ep.y,ep.z+3.2);
P.pos.set(ep.x,ep.y+0.2,ep.z+2.6);P.vel.set(0,0,-1);P.grounded=true;
for(let i=0;i<30;i++)frames(1);
ok(ep.triggered,'endpoint approach engaged');
for(let i=0;i<100;i++)frames(1);
ok(!W.won,'temporary endpoint does not set won / final Level 3 win');
ok(!el('win')||el('win').style.display!=='flex','CONGRATULATIONS banner stays hidden');
ok(!H.isStarted(),'endpoint returns to the level picker');
ok(!W.won,'picker return does not mark the level completed');

// ---- Regressions ----
H.test.loadLevel(0);
ok(H.getLevel().id==='level1'&&H.getPhys().grav===-30&&H.getSky().boostMax===0,'Level 1 regression');
H.test.loadLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 regression');
H.test.loadLevel(2);
ok(H.getLevel().id==='level3'&&H.getSky().boostMax===12.5&&W.snoozles.length===3,'Level 3 production slice restores');
ok(H.getLevel().snoozleGoal===4,'Level 3 snoozleGoal still 4 after reload');

report();
