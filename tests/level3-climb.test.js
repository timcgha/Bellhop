// Level 3 Stage 6: The Climb — vertical ascent, optional challenge, crater rim.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(R.climbBase&&R.climbHalfway&&R.climbRim&&R.snoozle4,'Climb route markers present');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast tuning unchanged');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2&&H.getSky().glideStartVy===0.2,'glide unchanged');
ok(L.snoozleGoal===4,'snoozleGoal remains 4');
ok(W.snoozles.length===4,'exactly four physical Snoozles');
ok(el('snz').textContent==='😴 0/4','HUD 0/4');
ok(H.getCamDiag().VERSION_BASE==='v49 · Star Observatory finish','version stamp is Peak playtest fixes');

const climbLeaps=L.mandatoryLeaps.filter(l=>/^climb/.test(l.id));
const lavaLeaps=L.mandatoryLeaps.filter(l=>['firstLavaLeap','islandA','islandB','wideRiver','geyserApproach'].includes(l.id));
ok(lavaLeaps.length===5,'Lava Field leaps preserved');
ok(climbLeaps.length>=5&&climbLeaps.length<=7,'5–7 Climb mandatory leaps ('+climbLeaps.length+')');
ok(climbLeaps.map(l=>l.id).join(',')==='climbShelfA,climbShelfB,climbShelfC,climbShelfD,climbShelfE,climbRimLeap','Climb leap ids in order');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quiet(){
  for(const e of W.cinders){if(e.alive){e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}}
  for(const e of W.embers){if(e.alive){e.alive=false;e.m.visible=false;}}
}
function settle(x,y,z){
  release();quiet();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(8);
}
function walkToward(tx,tz,steps){
  for(let i=0;i<(steps||200);i++){
    const dx=tx-P.pos.x,dz=tz-P.pos.z,d=Math.hypot(dx,dz);
    if(d<0.6)break;
    P.yaw=Math.atan2(dx,dz);H.CAM.yaw=0;
    kd({code:'KeyW',preventDefault(){},repeat:false});
    frames(1);
  }
  release();frames(4);
}
function poweredLeapToward(yaw){
  P.yaw=yaw;H.CAM.yaw=0;P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;
  kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<22;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
  for(let i=0;i<10;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
}
function flyUntil(pred,max=360){
  let okLand=false;
  for(let i=0;i<max;i++){quiet();frames(1);if(pred(i)){okLand=true;break;}}
  release();
  return okLand;
}
function clearMandatory(leap){
  const ns=leap.nearSafe;
  settle(ns.x,ns.y,ns.z);
  poweredLeapToward(Math.PI);
  const landed=flyUntil(()=>P.grounded&&P.pos.z<=leap.landing.edgeZ-1&&P.pos.y>=leap.farSafe.y-1&&P.lavaRecT<=0);
  return{landed,z:P.pos.z,y:P.pos.y,lava:P.lavaRecT>0};
}
function reloadL3(){
  if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
  frames(2);
  H.startLevel(2);
}
function inLava(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function standUntilAnchor(x,y,z){
  settle(x,y,z);
  P.inv=0;P.dead=false;P.vel.set(0,0,0);P.grounded=true;P.surf='stone';P.lavaRecT=0;
  const need=Math.ceil((H.getLava().anchorSettle+0.2)/0.05)+8;
  for(let i=0;i<need;i++){
    quiet();
    P.pos.set(x,y,z);P.grounded=true;P.vel.set(0,0,0);P.surf='stone';P.inv=0;P.lavaRecT=0;
    frames(1);
  }
}

// ---- Hollow connects to Climb; Stage 5 endpoint gone ----
ok(!L.steps.some(s=>s[0]==='protoEndpoint'&&Math.abs(s[3]-(-368))<1),'Stage 5 temporary Climb endpoint removed');
settle(0,21.7,-360);
walkToward(0,-378,220);
ok(P.pos.z<=R.climbBase.z+4&&P.pos.y>=R.climbBase.y-1,'Geode Hollow exit walks onto Climb base');
ok(P.pos.z<R.geodeHollow.zExit,'player leaves cool Hollow ambience zone');

// ---- Vertical progression ----
ok(Math.abs(R.climbBase.y-21.5)<0.2,'Climb base Y ≈ 21.5');
ok(Math.abs(R.climbHalfway.y-28.4)<0.2,'halfway Y ≈ 28.4');
ok(Math.abs(R.climbRim.y-44.4)<0.2,'rim Y ≈ 44.4');
const gain=R.climbRim.y-R.climbBase.y;
ok(gain>=18,'substantial total vertical gain ('+gain.toFixed(1)+')');
ok(R.climbHalfway.y>R.climbBase.y+4,'halfway is meaningful elevation progress');
ok(R.climbRim.y>R.climbHalfway.y+10,'rim is well above halfway');
const routeYs=[R.climbBase.y,R.climbHalfway.y,R.climbRim.y];
const maxRouteY=Math.max(...L.mandatoryLeaps.map(l=>Math.max(l.nearSafe.y,l.farSafe.y)),...routeYs);
ok(Math.abs(maxRouteY-R.climbRim.y)<0.5,'crater rim is highest normal production-route point');

// ---- Mandatory leap invariants (vents, pads, anchors) ----
const lavaTun=H.getLava();
function checkClimbLeaps(leaps,vents,lavas){
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
    else{
      const width=pad.max.x-pad.min.x;
      if(width<10)fails.push(leap.id+': landing too narrow ('+width.toFixed(1)+')');
    }
    if(Math.abs(land.edgeZ-land.farZ)<land.minDepth)fails.push(leap.id+': depth');
  }
  return fails;
}
const inv=checkClimbLeaps(climbLeaps,W.steamVents,W.lavas);
ok(inv.length===0,'Climb mandatory leaps pass vent/anchor/depth ('+(inv[0]||'ok')+')');

// ---- Live powered traversal of every Climb leap ----
let climbOk=true;
const measures=[];
for(const leap of climbLeaps){
  const r=clearMandatory(leap);
  measures.push({id:leap.id,landed:r.landed,z:r.z,y:r.y});
  if(!r.landed||r.lava){climbOk=false;ok(false,'Climb leap '+leap.id+' failed (z='+r.z.toFixed(2)+', y='+r.y.toFixed(2)+')');}
}
ok(climbOk,'production Climb main route clears all mandatory leaps');
ok(measures.length===climbLeaps.length,'recorded traversal for each Climb leap');

// Reach rim without optional challenge
reloadL3();
settle(R.climbRim.x,R.climbRim.y,R.climbRim.z);
ok(P.pos.y>=R.climbRim.y-0.5,'rim platform supports standing');
ok(W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].z<-450).every(w=>w.alive),'challenge wisps can remain alive on main route');
ok(W.notes.filter(n=>Math.abs(n.z-R.challengeReward.z)<4).every(n=>!n.got),'challenge notes can remain uncollected');

// ---- Checkpoints ----
const baseCp=W.checks.find(c=>Math.abs(c.z-(-378))<1);
const midCp=W.checks.find(c=>Math.abs(c.z-(-441))<1);
ok(!!baseCp,'base Climb checkpoint exists');
ok(!!midCp,'halfway Climb checkpoint exists');
ok(!inLava(baseCp.x,baseCp.y||21.7,baseCp.z),'base checkpoint not in lava');
ok(!inLava(midCp.x,midCp.y||28.4,midCp.z),'halfway checkpoint not in lava');
settle(0,21.7,-378);frames(4);
ok(P.grounded&&P.pos.y>=21.0,'base checkpoint stands on safe ground');
settle(0,28.4,-441);frames(4);
ok(P.grounded&&P.pos.y>=27.5,'halfway checkpoint stands on safe ground');
ok(midCp.z<baseCp.z-40,'halfway checkpoint is substantial route progress');
const nearCinder=W.cinders.some(c=>Math.hypot(c.x-midCp.x,c.z-midCp.z)<3);
ok(!nearCinder,'halfway checkpoint not in Cinder contact range');

// ---- Lava failure / recovery on lower, mid, upper leaps ----
function failLeapIntoLava(leap){
  standUntilAnchor(leap.nearSafe.x,leap.nearSafe.y,leap.nearSafe.z);
  const ax=P.safeAnchor.x,ay=P.safeAnchor.y,az=P.safeAnchor.z;
  P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(3,0,-8);P.glideT=0.4;P.wingsOut=true;P.hp=4;P.inv=0;
  // Drop into gap lava ahead of the landing
  const dropZ=(leap.takeoff.z+leap.landing.edgeZ)*0.5;
  P.pos.set(0,leap.nearSafe.y+1.5,dropZ);P.vel.set(0,-8,0);P.grounded=false;
  let hit=false;
  for(let i=0;i<120;i++){
    frames(1);
    if(P.lavaRecT>0){hit=true;break;}
  }
  const hpAfter=P.hp;
  const keptBlast=P.hasSkyBlast;
  const boostGone=Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05;
  const glideGone=P.glideT<=0&&!P.wingsOut;
  for(let i=0;i<60;i++)frames(1);
  const recovered=!inLava(P.pos.x,P.pos.y,P.pos.z)&&P.lavaRecT<=0;
  const near=Math.hypot(P.pos.x-ax,P.pos.z-az)<18;
  const notHollow=P.pos.z<R.geodeHollow.zEnter-5;
  const notField=P.pos.z<-300;
  return{hit,hpAfter,keptBlast,boostGone,glideGone,recovered,near,notHollow,notField,ax,az,rx:P.pos.x,rz:P.pos.z};
}
reloadL3();
const lower=failLeapIntoLava(climbLeaps[0]);
ok(lower.hit&&lower.hpAfter===3,'lower Climb lava costs exactly one heart');
ok(lower.keptBlast,'lower Climb lava keeps hasSkyBlast');
ok(lower.boostGone&&lower.glideGone,'lower Climb lava clears leapBoost and glide');
ok(lower.recovered&&lower.near,'lower Climb recovers to nearby safe anchor');
ok(lower.notHollow&&lower.notField,'lower recovery stays on Climb (not Hollow/Lava Field)');

reloadL3();
const mid=failLeapIntoLava(climbLeaps[2]);
ok(mid.hit&&mid.hpAfter===3,'mid Climb lava costs exactly one heart');
ok(mid.keptBlast&&mid.boostGone,'mid Climb lava keeps blast, clears boost');
ok(mid.recovered&&mid.near&&mid.notHollow,'mid Climb recovers nearby on Climb');

reloadL3();
const upper=failLeapIntoLava(climbLeaps[4]);
ok(upper.hit&&upper.hpAfter===3,'upper Climb lava costs exactly one heart');
ok(upper.recovered&&upper.near,'upper Climb recovers to nearby safe anchor');
ok(upper.rz<R.climbHalfway.z+20,'upper failure does not send Pling back to Hollow/Lava Field');

// No immediate second lava hit after recovery
reloadL3();
failLeapIntoLava(climbLeaps[1]);
const hpStable=P.hp;
for(let i=0;i<30;i++)frames(1);
ok(P.hp===hpStable,'no immediate second lava hit after recovery');

// ---- Optional challenge ----
reloadL3();
ok(R.challengeBranch&&R.challengeReward,'challenge route markers present');
const challWisps=W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].z<-455&&w.path[0].x>8);
ok(challWisps.length===2,'exactly two challenge wisps');
ok(challWisps.every(w=>!w.note),'challenge wisps are ordinary (no held notes)');
const challNotes=W.notes.filter(n=>Math.abs(n.z-R.challengeReward.z)<5&&n.x>8);
ok(challNotes.length===3,'three challenge reward notes exist at build time');
ok(W.notes.length===10,'fixed Level 3 note total is 10 at build');

// Reachable from halfway spur
settle(R.challengeBranch.x,R.challengeBranch.y,R.challengeBranch.z);
ok(P.grounded,'challenge branch spur is solid');
walkToward(10.5,-440,80);
ok(P.pos.x>6,'optional spur is walkable without taking main leaps');

// Gust extinguishes both from safe ground
for(const w of challWisps){
  w.speed=0;w.path=[{x:w.g.position.x,y:w.g.position.y,z:w.g.position.z}];
}
const nBeforeWisp=W.notes.length;
settle(10.5,29.0,-470);
for(const w of challWisps){
  P.pos.set(w.g.position.x-1.2,29.0,w.g.position.z);P.yaw=Math.atan2(w.g.position.x-P.pos.x,w.g.position.z-P.pos.z);
  P.gustCD=0;P.slam=0;P.grounded=true;P.inv=99;
  tap('KeyJ',2);frames(10);
}
ok(challWisps.every(w=>!w.alive),'both challenge wisps extinguish by gust');
ok(W.notes.length===nBeforeWisp,'extinguishing challenge wisps does not spawn notes');

// Spin/slam do not define wisp defeat (still dead from gust — re-test on reload)
reloadL3();
const w2=W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].z<-455&&w.path[0].x>8);
ok(w2.length===2,'reload restores two challenge wisps');
const target=w2[0];
target.speed=0;target.path=[{x:11,y:29.6,z:-470}];target.g.position.set(11,29.6,-470);
settle(11,29.0,-468);P.yaw=Math.PI;P.bonkCD=0;
tap('KeyK',2);frames(16);
ok(target.alive,'challenge wisp ignores spin');
P.pos.set(11,31.0,-470);P.vel.set(0,-1,0);P.grounded=false;P.slam=-1;
for(let i=0;i<40;i++)frames(1);
ok(target.alive,'challenge wisp ignores slam');

// Entering challenge does not change note total; collecting uses normal notes
reloadL3();
const n0=W.notes.length;
settle(11,29.2,-472);
ok(W.notes.length===n0,'entering challenge area does not change note total');
const reward=W.notes.filter(n=>Math.abs(n.z-R.challengeReward.z)<5&&n.x>8);
let got=0;
for(const n of reward){
  P.pos.set(n.x,n.y,n.z);frames(10);
  if(n.got)got++;
}
ok(got===3,'challenge reward notes collect normally');

// Main route open while challenge ignored
reloadL3();
ok(W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].z<-455).length===2,'wisps alive if challenge ignored');
const mainClear=clearMandatory(climbLeaps[2]);
ok(mainClear.landed&&!mainClear.lava,'main Climb continues while challenge ignored');
settle(0,28.4,-448);
walkToward(0,-458,120);
ok(Math.abs(P.pos.x)<4,'main route stays on centerline past challenge branch');

// ---- Note budget ----
reloadL3();
ok(W.notes.length===10,'notes.length is 10 immediately after build');
const secretStill=W.notes.filter(n=>Math.abs(n.z-R.secretAlcove.z)<4&&n.x<R.secretCurtain.x-2);
ok(secretStill.length===2,'Stage 5 secret notes remain intact');
const amb0=W.notes.length;
for(let i=0;i<30;i++)frames(1);
ok(W.notes.length===amb0,'ambient entities never increase counted-note total');

// ---- Rim leads to Snoozle 4 / Organ — no prototype soft-return ----
reloadL3();
ok(!W.protoEndpoints||W.protoEndpoints.length===0,'no crater-rim proto endpoint');
ok(W.snoozles.length===4,'four Snoozles including rim Snoozle 4');
const s4=W.snoozles[3];
ok(s4&&Math.abs(s4.g.position.z-R.snoozle4.z)<1,'Snoozle 4 on crater rim');
ok(W.organ&&!W.organ.active,'Organ present and dark before all awake');
settle(R.snoozle4.x,R.snoozle4.y,R.snoozle4.z+1.2);
ok(H.isStarted(),'rim does not soft-return to picker');
ok(!W.won,'standing on rim does not win');

// ---- World bounds: ceiling above Organ, far wall past Crater ----
H.startLevel(2);
const ceil=W.solids.find(s=>s.min.y>=68&&s.max.y<=76&&(s.max.x-s.min.x)>30);
ok(!!ceil&&ceil.min.y>=68,'invisible ceiling clears Organ pipes');
ok(ceil.min.y>R.climbRim.y+10,'ceiling does not cut rim traversal');
ok(W.solids.some(s=>s.max.z<-650&&(s.max.x-s.min.x)>30),'far perimeter wall past Crater Organ');

// ---- Camera probe (diagnostic untouched; report effective distance) ----
reloadL3();
settle(0,21.7,-378);
frames(10);
const camBase={eff:H.CAM.effectiveDist,boom:H.CAM.boomDist,pull:H.CAM.collisionPulled};
settle(0,28.4,-441);frames(10);
const camMid={eff:H.CAM.effectiveDist,boom:H.CAM.boomDist,pull:H.CAM.collisionPulled};
settle(0,44.4,-585);frames(10);
const camRim={eff:H.CAM.effectiveDist,boom:H.CAM.boomDist,pull:H.CAM.collisionPulled};
ok(typeof camBase.eff==='number'&&camBase.eff>0,'camera effective distance readable at Climb base');
ok(H.getCamDiag().parse('?camdist=6.8')===6.8,'Stage 4.8A camdist diagnostic unchanged');
console.log('cam probe base',camBase,'mid',camMid,'rim',camRim);
console.log('climb measures',measures.map(m=>m.id+' z='+m.z.toFixed(1)+' y='+m.y.toFixed(1)).join('; '));

// ---- Regressions ----
H.test.loadLevel(0);
ok(H.getLevel().id==='level1'&&H.getPhys().grav===-30&&H.getSky().boostMax===0,'Level 1 unchanged');
H.test.loadLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 unchanged');
H.test.loadLevel(2);
ok(H.getSky().boostMax===12.5&&H.getSky().glideDur===0.55&&W.snoozles.length===4,'Level 3 Climb slice restores');
ok(H.getLevel().snoozleGoal===4,'snoozleGoal still 4');
ok(W.notes.length===10,'note total restores to 10');

report();
