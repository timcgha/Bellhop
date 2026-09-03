// Level 3 Stage 5: Geode Hollow route, Snoozle 3, steam-curtain secret.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report,el}=H;

H.startLevel(2);
const L=H.getLevel();
const R=L.route;
ok(L&&L.id==='level3','boots Level 3');
ok(R.geodeHollow&&R.caveMouth&&R.snoozle3&&R.secretCurtain,'Geode Hollow route markers present');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().glideDur===0.55,'Sky Blast unchanged');
ok(L.snoozleGoal===4,'snoozleGoal remains 4');
ok(W.snoozles.length===4,'exactly four physical Level 3 Snoozles');
ok(el('snz').textContent==='😴 0/4','HUD 0/4');

function release(){
  for(const c of ['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyJ','KeyK']){
    try{ku({code:c,preventDefault(){},repeat:false});}catch(e){}
  }
}
function settle(x,y,z){
  release();
  P.inv=99;P.dead=false;P.lavaRecT=0;P.hp=4;P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;
  frames(8);
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
    if(d<0.6)break;
    P.yaw=Math.atan2(dx,dz);H.CAM.yaw=0;
    kd({code:'KeyW',preventDefault(){},repeat:false});
    frames(1);
  }
  release();frames(4);
}
function wakeSnoozle(i){
  const s=W.snoozles[i];
  P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1.15);
  P.vel.set(0,0,0);P.grounded=true;P.gustCD=0;P.slam=0;P.inv=99;P.dead=false;
  P.yaw=Math.atan2(s.g.position.x-P.pos.x,s.g.position.z-P.pos.z);H.CAM.yaw=0;
  tap('KeyJ',2);frames(10);
}
function reloadL3(){
  // loadLevel alone does not reset rescued/gotNotes/started — go through soft return + start.
  if(H.isStarted()&&typeof H.window.__softReturnToPicker==='function')H.window.__softReturnToPicker();
  frames(2);
  H.startLevel(2);
}

// ---- Old Stage 4 mouth blocker gone; Lava Field connects into Hollow ----
ok(!L.steps.some(s=>s[0]==='protoEndpoint'&&Math.abs(s[3]-(-265))<1),'old protoEndpoint at z≈-265 removed');
ok(L.steps.some(s=>s[0]==='geodeMouth'&&Math.abs(s[3]-R.caveMouth.z)<1),'geode mouth authored at cave entrance');
settle(0,20.2,-262);
ok(!insideSolidAt(0,21.2,-268,0.3),'cave mouth center is not blocked by a solid wall');
walkToward(0,-278,160);
ok(P.pos.z<-270&&P.pos.z>-290,'Lava Field approach walks into Geode Hollow entrance');
ok(P.pos.z<=R.geodeHollow.zEnter,'player crosses geodeHollow.zEnter');

// ---- Main Hollow route traversable without secret ----
settle(0,20.2,-278);
walkToward(0,-300,220);
ok(P.pos.z<-295,'mid Hollow path reachable');
walkToward(0,-328,260);
ok(Math.abs(P.pos.z-R.snoozle3.z)<8,'main chamber / Snoozle 3 approach reachable');
ok(Math.abs(P.pos.x)<4,'main route stays near centerline (secret not required)');

// ---- Sample floor continuity along the authored route (no fake duplicate coords) ----
const routeZs=[-268,-278,-290,-300,-318,-328,-348,-360];
let floorOk=true;
for(const z of routeZs){
  settle(0,20.2,z);
  if(P.pos.y<19.5||P.pos.y>23.5)floorOk=false;
  if(insideSolidAt(0,P.pos.y+0.5,P.pos.z,0.15))floorOk=false;
}
ok(floorOk,'authored Hollow floors support the main route');

// ---- Snoozle 3 reachable without discovering the secret ----
reloadL3();
const sn3=W.snoozles[2];
ok(sn3&&sn3.state==='sleep','Snoozle 3 starts asleep');
ok(Math.abs(sn3.g.position.z-R.snoozle3.z)<1&&Math.abs(sn3.g.position.x-R.snoozle3.x)<1,'Snoozle 3 sits in cracked geode chamber');
wakeSnoozle(2);
ok(W.snoozles[2].state!=='sleep','Snoozle 3 wakes via normal gust');
ok(el('snz').textContent==='😴 1/4','awake count becomes 1/4 after Snoozle 3 alone');
ok(!W.won,'waking Snoozle 3 does not win');
ok(!el('win')||el('win').style.display!=='flex','no CONGRATULATIONS after Snoozle 3');
ok(typeof W.FINISH.onAllAwake==='function','FINISH onAllAwake registered (Organ)');

reloadL3();
for(let i=0;i<3;i++)wakeSnoozle(i);
ok(W.snoozles.slice(0,3).every(s=>s.state!=='sleep'),'first three Snoozles can wake');
ok(el('snz').textContent==='😴 3/4','HUD shows 3/4 — organ/finish still waits for fourth');
ok(!W.won,'3/4 does not trigger win or Organ climax');
ok(W.organ&&!W.organ.active,'Organ stays dark at 3/4');

// ---- Snoozle 3 flight stays in corridor (no wall-cut path) ----
reloadL3();
const flyer=W.snoozles[2];
ok(flyer.home&&flyer.home.path&&flyer.home.path.length>=2,'Snoozle 3 has an explicit exit path in level data');
wakeSnoozle(2);
let wallCut=false,samples=0;
for(let i=0;i<420;i++){
  frames(1);
  const x=flyer.g.position.x,z=flyer.g.position.z,y=flyer.g.position.y;
  if(flyer.state==='path'||flyer.state==='zoom'||flyer.state==='wake'){
    samples++;
    if(z<=R.geodeHollow.zEnter&&z>=R.geodeHollow.zExit){
      if(Math.abs(x)>6.2)wallCut=true;
      if(insideSolidAt(x,y+0.3,z,0.05)&&Math.abs(x)>5.5)wallCut=true;
    }
  }
  if(flyer.state==='home')break;
}
ok(samples>10,'Snoozle 3 flight sampled');
ok(!wallCut,'Snoozle 3 flight does not route through side-wall solids');

// ---- Exit corridor reachable without secret (do not soft-return yet) ----
reloadL3();
settle(0,20.5,-328);
walkToward(0,-348,220);
walkToward(0,-360,200);
ok(P.pos.z<-350,'exit corridor reachable');
ok(!L.steps.some(s=>s[0]==='protoEndpoint'&&Math.abs(s[3]-(-368))<1),'Stage 5 temporary endpoint at z≈-368 removed');
ok(R.climbBase&&R.climbRim,'Climb route markers present');
settle(0,22.0,-368);
walkToward(0,-378,160);
ok(P.pos.z<R.geodeHollow.zExit&&P.pos.y>=21.5,'Hollow exit connects onto Climb base');

// ---- Crystal collision agreement ----
reloadL3();
const blocking=L.steps.filter(s=>s[0]==='crystalCluster'&&s[5]===true);
const decor=L.steps.filter(s=>s[0]==='crystalCluster'&&s[5]===false);
ok(blocking.length>=3,'blocking crystal clusters authored');
ok(decor.length>=2,'decorative crystal clusters authored');
let blockOk=true;
for(const s of blocking){
  const x=s[1],y=s[2],z=s[3],sc=s[4]||1;
  if(!insideSolidAt(x,y+0.8*sc,z,0.15))blockOk=false;
}
ok(blockOk,'major blocking crystals have matching solids');
let decorClear=true;
for(const s of decor){
  const x=s[1],y=s[2],z=s[3];
  if(insideSolidAt(x,y+0.4,z,0.05)&&Math.abs(x)<2.5)decorClear=false;
}
ok(decorClear,'decorative crystals do not create centerline-blocking collision');

// ---- Steam curtain secret ----
reloadL3();
ok(W.steamCurtains&&W.steamCurtains.length===1,'one steam curtain');
let curtain=W.steamCurtains[0];
ok(!curtain.parted,'curtain begins closed');
ok(W.notes.length===10,'Level 3 counted-note total is 10 with secret + Climb challenge notes');
const secretNotes=W.notes.filter(n=>Math.abs(n.z-R.secretAlcove.z)<4&&n.x<R.secretCurtain.x-2);
ok(secretNotes.length===2,'both secret notes exist at build time');

// Walking into the curtain does not open it
settle(-4.5,20.2,-308);
P.pos.set(-5.5,20.3,-308);P.vel.set(-2,0,0);P.grounded=true;
for(let i=0;i<40;i++)frames(1);
ok(!curtain.parted,'ordinary contact does not open the curtain');

// Spin does not open
settle(-5.2,20.2,-308);P.yaw=-Math.PI/2;P.bonkCD=0;
tap('KeyK',2);frames(20);
ok(!curtain.parted,'spin does not open the curtain');

// Slam does not open
settle(-5.2,20.4,-308);P.pos.y=22.5;P.vel.set(0,-1,0);P.grounded=false;P.slam=-1;
for(let i=0;i<40;i++)frames(1);
ok(!curtain.parted,'slam does not open the curtain');

// Sky Blast does not auto-open
settle(-5.2,20.2,-308);P.hasSkyBlast=true;P.puff=true;P.glideT=0.4;P.wingsOut=true;
for(let i=0;i<30;i++)frames(1);
ok(!curtain.parted,'Sky Blast does not automatically open the curtain');

// Valid gust opens it
settle(-5.0,20.2,-308);
P.pos.set(-5.2,20.3,-308);P.vel.set(0,0,0);P.yaw=-Math.PI/2;H.CAM.yaw=0;
P.gustCD=0;P.slam=0;P.grounded=true;P.hasSkyBlast=false;P.glideT=0;P.wingsOut=false;
const lenBeforeGust=W.notes.length;
tap('KeyJ',2);frames(12);
curtain=W.steamCurtains[0];
ok(curtain.parted,'valid gust opens the steam curtain');
ok(W.notes.length===lenBeforeGust,'gusting the curtain does not increase notes.length');
ok(W.solids.indexOf(curtain.sol)<0,'curtain collision removed after open');

// Stays open
for(let i=0;i<120;i++)frames(1);
ok(curtain.parted,'curtain stays open for the rest of the run');

// Alcove accessible; notes collectable
settle(-9.5,20.2,-308);
walkToward(-11.8,-306.5,120);
let got=0;
for(const n of secretNotes){
  P.pos.set(n.x,n.y,n.z);frames(10);
  if(n.got)got++;
}
ok(got===2,'secret notes collect with normal note behavior');

// Main route still works while closed (reload)
reloadL3();
const c2=W.steamCurtains[0];
ok(!c2.parted,'reload restores closed curtain');
settle(0,20.2,-300);
walkToward(0,-328,260);
ok(P.pos.z<-320&&Math.abs(P.pos.x)<4,'main route traversable while curtain closed');
ok(W.notes.length===10,'reload restores fixed note total');

// ---- Hollow exit has no soft-return; Crater continues past Climb ----
reloadL3();
ok(!W.protoEndpoints||W.protoEndpoints.length===0,'no soft-return proto endpoints remain');
ok(!W.protoEndpoints.some||!W.protoEndpoints.some(e=>Math.abs(e.z-(-368))<2),'no soft-return blocker at Hollow exit');
ok(W.organ&&L.route.snoozle4,'Crater Organ and Snoozle 4 exist beyond Hollow');

// ---- Regressions ----
H.window.__softReturnToPicker();frames(2);
H.startLevel(0);
ok(H.getLevel().id==='level1'&&H.getPhys().grav===-30&&H.getSky().boostMax===0,'Level 1 untouched');
H.window.__softReturnToPicker();frames(2);H.startLevel(1);
ok(H.getLevel().id==='level2'&&H.getPhys().grav===-6,'Level 2 untouched');
H.window.__softReturnToPicker();frames(2);H.startLevel(2);
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Sky Blast restores');
ok(H.getSky().glideDur===0.55&&H.getSky().glideFallCap===-2.2&&H.getSky().glideStartVy===0.2,'glide restores');
const lavaIds=['firstLavaLeap','islandA','islandB','wideRiver','geyserApproach'];
ok(lavaIds.every(id=>H.getLevel().mandatoryLeaps.some(l=>l.id===id)),'Lava Field mandatory leaps unchanged');
ok(W.geysers.length===1&&W.steamVents.length>=1,'vents/geyser systems present');
ok(typeof H.getCamDiag==='function'&&H.getCamDiag().VERSION_BASE==='v50 · Finish void celebration','version stamp + camdiag preserved');
ok(H.getCamDiag().parse('?camdist=6.8')===6.8,'camdist diagnostic parse unchanged');

report();
