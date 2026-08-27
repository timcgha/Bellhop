// Level 3 Stage 6: The Climb — vertical route, recovery, optional challenge, note budget.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(R.climbBase&&R.climbHalf&&R.climbRim&&R.endpoint,'Climb route markers present');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().glideDur===0.55,'Sky Blast unchanged');
ok(L.snoozleGoal===4,'snoozleGoal remains 4');
ok(W.snoozles.length===3,'exactly three physical Snoozles (no Snoozle 4 yet)');
ok(el('snz').textContent==='😴 0/4','HUD 0/4');

const climbLeaps=L.mandatoryLeaps.filter(l=>/^climb\d/.test(l.id));
const lavaLeaps=L.mandatoryLeaps.filter(l=>!/^climb\d/.test(l.id));
ok(lavaLeaps.length===5,'Lava Field mandatory leaps remain five');
ok(climbLeaps.length===6,'Climb adds six mandatory powered leaps');
ok(L.mandatoryLeaps.length===11,'total mandatory leaps = 5 lava + 6 climb');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function quiet(){
  for(const e of W.cinders){if(e.alive){e.stunT=99;e.spitT=99;e.wind=0;e.vx=0;e.vz=0;}}
  for(const e of W.embers){if(e.alive){e.alive=false;e.m.visible=false;}}
  for(const q of W.goos){if(q.alive){q.alive=false;if(q.m)q.m.visible=false;}}
}
function settle(x,y,z){
  release();quiet();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(8);
}
function inLava(x,y,z){
  for(const lv of W.lavas){
    if(x>lv.min.x&&x<lv.max.x&&z>lv.min.z&&z<lv.max.z&&y<lv.max.y+0.35&&y+1.15>lv.min.y-0.05)return true;
  }
  return false;
}
function insideSolidAt(x,y,z,m){
  m=m||0.2;
  for(const s of W.solids){
    if(x>s.min.x-m&&x<s.max.x+m&&y>s.min.y-m&&y<s.max.y+m&&z>s.min.z-m&&z<s.max.z+m)return true;
  }
  return false;
}
function walkToward(tx,tz,steps){
  for(let i=0;i<(steps||200);i++){
    const dx=tx-P.pos.x,dz=tz-P.pos.z,d=Math.hypot(dx,dz);
    if(d<0.55)break;
    // Movement is camera-relative; aim the camera at the target so KeyW walks there.
    H.CAM.yaw=Math.atan2(-dx,-dz);
    P.yaw=Math.atan2(dx,dz);
    kd({code:'KeyW',preventDefault(){},repeat:false});
    frames(1);
  }
  release();H.CAM.yaw=0;frames(4);
}
function reloadL3(){
  if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
  frames(2);
  H.startLevel(2);
}
function standUntilAnchor(x,y,z){
  settle(x,y,z);P.inv=0;P.dead=false;P.vel.set(0,0,0);P.grounded=true;P.surf='stone';P.lavaRecT=0;
  const need=Math.ceil((H.getLava().anchorSettle+0.2)/(1/60))+10;
  for(let i=0;i<need;i++){
    quiet();P.pos.set(x,y,z);P.grounded=true;P.vel.set(0,0,0);P.surf='stone';P.inv=0;P.lavaRecT=0;frames(1);
  }
}
function waitRecovery(){
  let n=0;while(P.lavaRecT>0&&n<180){frames(1);n++;}frames(2);return n;
}
function poweredLeapToward(yaw){
  P.yaw=yaw;H.CAM.yaw=0;P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;P.glideT=0;
  kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<22;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
  for(let i=0;i<10;i++){quiet();frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
}
function flyUntil(pred,max){
  let hit=false;
  for(let i=0;i<(max||340);i++){quiet();frames(1);if(pred(i)){hit=true;break;}}
  release();
  return hit;
}
function clearMandatory(leap){
  const ns=leap.nearSafe;
  settle(ns.x,ns.y,ns.z);
  poweredLeapToward(Math.PI);
  const landed=flyUntil(()=>P.grounded&&P.pos.z<=leap.landing.edgeZ-1&&P.pos.y>=leap.farSafe.y-1&&P.lavaRecT<=0);
  return{landed,z:P.pos.z,y:P.pos.y,lava:P.lavaRecT>0};
}

// ---- Hollow exit no longer blocked; connects to Climb base ----
ok(!L.steps.some(s=>s[0]==='protoEndpoint'&&Math.abs(s[3]-(-368))<1),'Stage 5 temporary endpoint at z≈-368 removed');
ok(!insideSolidAt(0,22.5,-368,0.25),'Hollow exit center is open');
settle(0,21.7,-360);
walkToward(0,-370,160);
walkToward(R.climbBase.x,R.climbBase.z,200);
ok(P.pos.z<R.geodeHollow.zExit&&P.pos.z>R.climbBase.z-6,'Hollow exit connects onto Climb base');
ok(Math.abs(P.pos.y-R.climbBase.y)<1.2,'standing near Climb base height');

// ---- Vertical progression ----
ok(R.climbBase.y>=22&&R.climbBase.y<=23,'Climb base Y ≈22.4');
ok(R.climbHalf.y>R.climbBase.y+5,'halfway checkpoint meaningfully above base');
ok(R.climbRim.y>R.climbHalf.y+5,'rim meaningfully above halfway');
ok(R.climbRim.y-R.climbBase.y>=12,'total vertical gain ≥12 (stair+leap climb)');
ok(R.endpoint.y>=R.climbRim.y-0.1,'endpoint sits on the rim');
const routeYs=L.mandatoryLeaps.map(l=>l.farSafe.y);
ok(Math.max(...routeYs)===R.climbRim.y||Math.max(...routeYs)>=R.climbRim.y-0.1,'rim is highest production-route landing');
let yProgress=true;
for(let i=1;i<climbLeaps.length;i++){
  if(climbLeaps[i].farSafe.y+0.5<climbLeaps[i-1].farSafe.y)yProgress=false;
}
ok(yProgress,'Climb landings do not descend to bypass major jumps');

// ---- Mandatory-leap invariants (shared with lava tests) ----
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
    if(!(land.minDepth>0)||Math.abs(land.edgeZ-land.farZ)<land.minDepth)fails.push(leap.id+': depth');
    if(pad){
      const width=pad.max.x-pad.min.x;
      if(width<10)fails.push(leap.id+': landing width '+width.toFixed(1)+' too narrow');
    }
  }
  return fails;
}
const inv=invCheck(climbLeaps,W.steamVents,W.lavas);
ok(inv.length===0,'Climb mandatory leaps pass vent/anchor/depth/width ('+(inv[0]||'ok')+')');
ok(invCheck(L.mandatoryLeaps,W.steamVents,W.lavas).length===0,'all production mandatory leaps still invariant-clean');

// ---- Live main Climb route (optional challenge untouched) ----
reloadL3();
const challengeWisps=W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].x>10);
ok(challengeWisps.length===2,'exactly two optional-challenge wisps');
let climbOk=true;
for(const leap of climbLeaps){
  const r=clearMandatory(leap);
  if(!r.landed||r.lava){climbOk=false;ok(false,'Climb leap '+leap.id+' failed (z='+r.z.toFixed(2)+', y='+r.y.toFixed(2)+', lava='+r.lava+')');}
}
ok(climbOk,'main Climb route traversable end to end with Sky Blast');
ok(challengeWisps.every(w=>w.alive),'main route did not require extinguishing challenge wisps');
ok(P.pos.z<=R.climbRim.z+10&&P.pos.y>=R.climbRim.y-1.5,'route reaches crater-rim platform');

// ---- Main route ignores optional notes ----
reloadL3();
const notes0=W.notes.length;
ok(notes0===10,'Level 3 counted-note total is 10 at build time');
const rewardNotes=W.notes.filter(n=>Math.abs(n.x-R.challengeReward.x)<3&&Math.abs(n.z-R.challengeReward.z)<6);
ok(rewardNotes.length===3,'three challenge reward notes exist at build time');
const secretNotes=W.notes.filter(n=>Math.abs(n.z-R.secretAlcove.z)<4&&n.x<R.secretCurtain.x-2);
ok(secretNotes.length===2,'Stage 5 secret notes remain');
settle(R.climbBase.x,R.climbBase.y,R.climbBase.z);
for(const leap of climbLeaps){
  settle(leap.nearSafe.x,leap.nearSafe.y,leap.nearSafe.z);
  poweredLeapToward(Math.PI);
  flyUntil(()=>P.grounded&&P.pos.z<=leap.landing.edgeZ-1&&P.pos.y>=leap.farSafe.y-1&&P.lavaRecT<=0);
}
ok(W.notes.length===notes0,'traversing main Climb does not spawn notes');
ok(rewardNotes.every(n=>!n.got),'optional notes remain uncollected on main route');

// ---- Lava recovery on representative Climb leaps ----
function failIntoGap(leap){
  standUntilAnchor(leap.nearSafe.x,leap.nearSafe.y,leap.nearSafe.z);
  P.hasSkyBlast=true;P.puff=true;P.hp=4;P.inv=0;P.leapBoost.set(0,0,-6);P.glideT=0.3;P.wingsOut=true;
  const gapZ=(leap.takeoff.z+leap.landing.edgeZ)/2;
  const gapLava=W.lavas.find(lv=>lv.min.z<gapZ&&lv.max.z>gapZ&&Math.abs(lv.x-leap.takeoff.x)<8)
    ||W.lavas.find(lv=>lv.z<leap.takeoff.z&&lv.z>leap.landing.farZ);
  ok(!!gapLava,'gap/basin lava under '+leap.id);
  const hp0=P.hp;
  P.pos.set(gapLava.x,gapLava.y+0.08,gapLava.z);P.vel.set(0,-2,0);P.grounded=false;
  frames(6);
  ok(P.hp===hp0-1,leap.id+' failure costs exactly one heart');
  ok(P.hasSkyBlast===true,leap.id+' retains hasSkyBlast');
  ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,leap.id+' clears leapBoost');
  ok(P.glideT===0&&!P.wingsOut,leap.id+' clears glide/wings');
  waitRecovery();
  ok(!inLava(P.pos.x,P.pos.y,P.pos.z),leap.id+' recovery not in lava');
  ok(P.pos.z<R.geodeHollow.zExit-2,leap.id+' does not respawn in Geode Hollow');
  ok(P.pos.z<-300,leap.id+' does not return to Lava Field');
  ok(Math.hypot(P.pos.x-P.safeAnchor.x,P.pos.z-P.safeAnchor.z)<0.5,leap.id+' recovers to safe anchor');
  const hp1=P.hp;frames(20);ok(P.hp===hp1,leap.id+' no immediate second lava hit');
}
failIntoGap(climbLeaps[0]);
failIntoGap(climbLeaps[2]);
failIntoGap(climbLeaps[5]);

// Safe-anchor audit: takeoff + landing pads settle
for(const leap of [climbLeaps[0],climbLeaps[2],climbLeaps[4]]){
  standUntilAnchor(leap.nearSafe.x,leap.nearSafe.y,leap.nearSafe.z);
  ok(Math.hypot(P.safeAnchor.x-leap.nearSafe.x,P.safeAnchor.z-leap.nearSafe.z)<0.9,leap.id+' takeoff is valid safe anchor');
  standUntilAnchor(leap.farSafe.x,leap.farSafe.y,leap.farSafe.z);
  ok(Math.hypot(P.safeAnchor.x-leap.farSafe.x,P.safeAnchor.z-leap.farSafe.z)<0.9,leap.id+' landing is valid safe anchor');
}

// ---- Checkpoints ----
reloadL3();
const baseCk=W.checks.find(c=>Math.abs(c.z-R.climbBase.z)<3);
const halfCk=W.checks.find(c=>Math.abs(c.z-R.climbHalf.z)<3);
ok(!!baseCk,'Climb base checkpoint present');
ok(!!halfCk,'Climb halfway checkpoint present');
ok(!inLava(baseCk.x,baseCk.y,baseCk.z),'base checkpoint not in lava');
ok(!inLava(halfCk.x,halfCk.y,halfCk.z),'halfway checkpoint not in lava');
ok(halfCk.y>baseCk.y+6,'halfway checkpoint is meaningful vertical progress');
ok(Math.abs(baseCk.z-R.climbBase.z)<4&&Math.abs(halfCk.z-R.climbHalf.z)<4,'checkpoints lie on Climb route');
for(const ck of [baseCk,halfCk]){
  const nearEnemy=W.cinders.some(e=>e.alive&&Math.hypot(e.x-ck.x,e.z-ck.z)<2.2)
    ||W.wisps.some(w=>w.alive&&Math.hypot(w.g.position.x-ck.x,w.g.position.z-ck.z)<2.0);
  ok(!nearEnemy,'checkpoint at z='+ck.z+' clear of enemy contact');
}

// ---- Optional challenge ----
reloadL3();
ok(!!R.challengeBranch&&!!R.challengeReward,'challenge route markers present');
settle(R.climbHalf.x,R.climbHalf.y,R.climbHalf.z);
walkToward(R.challengeBranch.x,R.challengeBranch.z,160);
ok(P.pos.x>5,'optional spur is physically reachable from halfway');
const cWisps=W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].x>10);
ok(cWisps.length===2,'challenge still has exactly two wisps');
// Freeze paths and gust through normal wisp behavior from safe pads
for(const w of cWisps){
  const p=w.g.position;
  w.speed=0;w.path=[{x:p.x,y:p.y,z:p.z},{x:p.x,y:p.y,z:p.z}];
  settle(p.x-1.3,p.y-0.8,p.z);P.yaw=Math.atan2(p.x-P.pos.x,p.z-P.pos.z);P.gustCD=0;P.slam=0;
  tap('KeyJ',2);frames(12);
}
ok(cWisps.every(w=>!w.alive),'both challenge wisps extinguish via gust');
ok(W.notes.length===10,'extinguishing challenge wisps does not increase note total');
// Collect reward notes (fresh refs after reload)
const rewardNow=W.notes.filter(n=>Math.abs(n.x-R.challengeReward.x)<3&&Math.abs(n.z-R.challengeReward.z)<6);
ok(rewardNow.length===3,'reward notes still present in this load');
settle(R.challengeReward.x,R.challengeReward.y,R.challengeReward.z);
let got=0;
for(const n of rewardNow){
  P.pos.set(n.x,n.y,n.z);frames(10);
  if(n.got)got++;
}
ok(got===3,'challenge reward notes collect normally');
// Return / rejoin toward main landing4
walkToward(5,-526,220);
ok(P.pos.x<8&&P.pos.z>-540,'challenge can rejoin main Climb');

// Main route still works with wisps alive and notes untouched
reloadL3();
const aliveWisps=W.wisps.filter(w=>w.alive&&w.path&&w.path[0]&&w.path[0].x>10);
ok(aliveWisps.length===2,'reload restores two challenge wisps');
for(const leap of climbLeaps){
  const r=clearMandatory(leap);
  ok(r.landed&&!r.lava,'main Climb '+leap.id+' clear while challenge untouched');
}

// ---- Endpoint: rim soft-return, no win, no Snoozle 4 ----
reloadL3();
ok(W.protoEndpoints.length===1,'one temporary proto endpoint');
const ep=W.protoEndpoints[0];
ok(ep.kind==='rim','endpoint is crater-rim kind');
ok(Math.abs(ep.z-R.endpoint.z)<1&&ep.y>=37,'endpoint at crater rim');
ok(!L.steps.some(s=>s[0]==='snoozle'||(Array.isArray(s)&&false)),'no fourth snoozle step');
ok(W.snoozles.length===3,'still three Snoozles at rim stage');
settle(ep.x,ep.y,ep.z+3.2);
P.pos.set(ep.x,ep.y+0.2,ep.z+2.6);P.vel.set(0,0,-1);
for(let i=0;i<40;i++)frames(1);
ok(ep.triggered,'rim endpoint engages');
for(let i=0;i<100;i++)frames(1);
ok(!W.won,'rim endpoint does not trigger win');
ok(!el('win')||el('win').style.display!=='flex','no CONGRATULATIONS');
ok(!H.isStarted(),'rim endpoint soft-returns to picker');

// Reaching rim does not increment awake / Organ climax
H.startLevel(2);
ok(el('snz').textContent==='😴 0/4','awake count unchanged after rim soft-return reload');
ok(typeof W.FINISH.onAllAwake==='function','unfinishedFinish still registered (no Organ climax)');

// ---- World bounds / ceiling ----
reloadL3();
const ceil=W.solids.find(s=>s.min.y>=60&&s.max.y<=72&&s.max.x-s.min.x>30);
ok(!!ceil,'invisible ceiling raised above rim');
ok(ceil.min.y>R.climbRim.y+8,'ceiling leaves Stage 7 Organ/fireworks headroom');
const back=W.solids.find(s=>Math.abs((s.min.z+s.max.z)/2-(-640))<2&&s.max.x-s.min.x>30);
ok(!!back,'back perimeter covers past the rim');
settle(R.climbRim.x,R.climbRim.y,R.climbRim.z);
P.pos.y=R.climbRim.y+0.2;P.vel.set(0,8,0);P.grounded=false;
for(let i=0;i<90;i++)frames(1);
ok(P.pos.y<ceil.min.y+0.5,'legitimate rim jump does not clip through raised ceiling oddly');

// ---- Camera diagnostic preserved (Stage 4.8A) ----
ok(typeof H.getCamDiag==='function'&&H.getCamDiag().VERSION_BASE==='v35 · The Climb','version stamp is The Climb');
ok(H.getCamDiag().parse('?camdist=6.8')===6.8,'camdist diagnostic parse unchanged');
ok(H.getCamDiag().CAMDIST_STEPS.join(',')==='8.5,6.8,6.07,5,3.93','camdist steps unchanged');

// ---- Regressions ----
if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
frames(2);
H.startLevel(0);
ok(H.getLevel().id==='level1'&&H.getPhys().grav===-30&&H.getSky().boostMax===0,'Level 1 untouched');
H.window.__softReturnToPicker();frames(2);H.startLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 untouched');
H.window.__softReturnToPicker();frames(2);H.startLevel(2);
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast restores');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2,'glide restores');
ok(H.getLava().anchorClear===0.85&&H.getLava().recovery===0.42,'lava/safe-anchor restores');
ok(lavaLeaps.every(l=>H.getLevel().mandatoryLeaps.some(m=>m.id===l.id)),'Lava Field leaps preserved');
ok(W.geysers.length===1,'geyser unchanged');
ok(W.steamCurtains&&W.steamCurtains.length===1,'Geode steam curtain preserved');
ok(W.snoozles.length===3&&H.getLevel().snoozleGoal===4,'Snoozle count / goal unchanged');

report();
