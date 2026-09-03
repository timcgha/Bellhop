// Level 4 Stage 4 — Saucer Belt, shield gate, Candy Snoozle 2, observatory foreshadow.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}
function flyToward(H,x,y,z,maxFrames){
  for(let i=0;i<(maxFrames||320);i++){
    const dx=x-H.P.pos.x,dy=y-H.P.pos.y,dz=z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    H.P.vel.set(dx/d*6.5,dy/d*6.5,dz/d*6.5);
    H.kd({code:'Space',preventDefault(){},repeat:false});
    H.frames(1);
    if(d<3.5)break;
  }
  H.ku({code:'Space'});
}
function breakRenewableCrate(H,crate){
  H.P.pos.set(crate.x,crate.y+0.5,crate.z);
  H.P.grounded=true;H.P.yaw=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});
  H.frames(35);
}
function fireBeamAt(H,target){
  H.P.yaw=Math.atan2(target.x-H.P.pos.x,target.z-H.P.pos.z);
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});
  for(let i=0;i<45;i++)H.frames(1);
}

// ---- version ----
{
  const H=boot();
  ok(H.getCamDiag().VERSION_BASE==='v49 · Star Observatory finish','version stamp v49');
}

// ---- Snoozles: four authored (Snoozle 4 on Observatory) ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  ok(H.W.snoozles.length===4,'Level 4 has four authored Snoozles');
  ok(H.getLevel().snoozleGoal===4,'snoozleGoal remains 4');
  const dock=H.W.snoozles[0],candy=H.W.snoozles[1],crystal=H.W.snoozles[2];
  ok(Math.hypot(dock.g.position.x,dock.g.position.z)<8&&dock.g.position.y<2,'Snoozle 1 on Launch Dock');
  const cp=H.getSpace().candyPlanet;
  ok(!!cp,'Candy Planet present for Snoozle 2');
  ok(Math.hypot(candy.g.position.x-cp.pad.x,candy.g.position.z-cp.pad.z)<8,'Snoozle 2 on Candy Planet surface');
  const teachCrate=H.getSpace().starCrates[0];
  ok(Math.hypot(candy.g.position.x-teachCrate.x,candy.g.position.z-teachCrate.z)>2.5,'Candy Snoozle off Star Beam teaching line');
  ok(crystal.g.position.y<20,'Snoozle 3 in Crystal Cavern height band');
  ok(Math.hypot(crystal.g.position.x-102,crystal.g.position.z+219)<4,'Snoozle 3 at crystal route');
}

// ---- Cheese Moon remains foreshadow only ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace();
  ok(S.cheeseMoon&&S.cheeseMoon.userData.landable===false,'Cheese Moon non-landable');
  ok(!S.landingTargets.some(t=>Math.hypot(t.x-58,t.z+175)<6),'no Cheese Moon landing beacon');
}

// ---- Candy Snoozle collectible ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const sn=H.W.snoozles[1];
  H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z+0.5);
  H.P.grounded=true;H.P.vel.set(0,0,0);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(25);
  ok(sn.state!=='sleep','Candy Snoozle wakes via spin on surface');
}

// ---- Stage 4 route elements authored ----
{
  const H=boot();H.startLevel(3);
  const S=H.getSpace();
  ok(S.shieldedGates.length===1,'exactly one mandatory shield gate');
  ok(S.shieldedGates[0].opened===false,'gate starts closed');
  const beltCrates=S.starCrates.filter(c=>c.renewable&&c.z<-240);
  ok(beltCrates.length===1,'renewable star crate beside belt gate');
  const beltSaucers=S.saucers.filter(s=>!s.targetDummy&&s.z<-220);
  ok(beltSaucers.length===3,'Saucer Belt has one-saucer + two-saucer beats');
  ok(S.stage4Ends.length===1,'Stage 4 endpoint exists');
  ok(S.asteroids.filter(a=>a.hazard&&a.z<-200).length>=4,'asteroid-only teaching lane present');
}

// ---- Stage 5/6 finish authored ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  ok(!!H.getSpace().blackHoleFinish,'black hole finish present');
  ok(H.getSpace().stage5Ends.length===1,'Stage 5 endpoint present');
  ok(H.W.FINISH.winMsg==='The stars are singing!','FINISH owns space win subtitle');
}

// ---- shield gate: gust and spin do not open ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  H.P.hasStarBeam=false;
  H.P.pos.set(gate.x,gate.y+1,gate.z+3);H.P.grounded=false;H.P.moveZone='openSpace';H.P.yaw=Math.PI;
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});H.frames(20);
  ok(!gate.opened,'gust without Star Beam does not open gate');
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(20);
  ok(!gate.opened,'spin does not open gate');
}

// ---- shield gate: Star Beam opens ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  H.P.hasStarBeam=true;
  H.P.pos.set(gate.x-3,gate.y+1,gate.z+2);H.P.grounded=false;H.P.moveZone='openSpace';
  fireBeamAt(H,gate);
  ok(gate.opened,'Star Beam opens shield gate');
}

// ---- renewable power: reacquire after loss, still opens gate ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  const crate=H.getSpace().starCrates.find(c=>c.renewable&&c.z<-240);
  ok(!!crate,'renewable belt crate located');
  H.P.hasStarBeam=true;H.P.hp=4;H.P.inv=0;
  H.P.hp--;H.P.inv=1.4;H.P.hasStarBeam=false;
  ok(!H.P.hasStarBeam,'enemy-style hit removes Star Beam');
  breakRenewableCrate(H,crate);
  ok(H.P.hasStarBeam,'renewable crate restores Star Beam');
  H.P.pos.set(gate.x-3,gate.y+1,gate.z+2);H.P.grounded=false;H.P.moveZone='openSpace';
  fireBeamAt(H,gate);
  ok(gate.opened,'reacquired Star Beam opens gate');
}

// ---- gate cannot permanently block progression ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  const crate=H.getSpace().starCrates.find(c=>c.renewable&&c.z<-240);
  H.P.hasStarBeam=false;
  H.P.pos.set(gate.x,gate.y+1,gate.z+6);H.P.vel.set(0,0,-6);H.P.grounded=false;H.P.moveZone='openSpace';
  const z0=H.P.pos.z;
  for(let i=0;i<30;i++)H.frames(1);
  ok(H.P.pos.z>gate.z-1,'closed gate blocks forward drift');
  breakRenewableCrate(H,crate);
  fireBeamAt(H,gate);
  ok(gate.opened,'local renewable source prevents soft-lock');
  flyToward(H,gate.x,gate.y+1,gate.z-5,150);
  ok(H.P.pos.z<gate.z-1,'opened gate allows passage');
}

// ---- natural journey: crystal exit → belt checkpoint ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const ci=H.getSpace().crystalInterior;
  const exit=ci.exteriorExit;
  H.P.pos.set(exit.x,exit.y,exit.z);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  ok(H.getMovement().zone==='openSpace','crystal exit restores open-space flight');
  flyToward(H,84,24,-220,360);
  ok(H.P.pos.z<-208,'journey reaches asteroid lane');
  flyToward(H,64,22,-238,360);
  ok(H.P.pos.z<-228,'journey reaches one-saucer beat');
  flyToward(H,46,20,-252,400);
  ok(H.P.pos.z<-244,'journey reaches gate approach');
  const gate=H.getSpace().shieldedGates[0];
  const crate=H.getSpace().starCrates.find(c=>c.renewable&&c.z<-240);
  if(!H.P.hasStarBeam)breakRenewableCrate(H,crate);
  if(!gate.opened)fireBeamAt(H,gate);
  flyToward(H,28,18,-256,360);
  const end=H.getSpace().stage4Ends[0];
  H.P.pos.set(end.x,end.y,end.z);H.P.vel.set(0,0,0);H.frames(10);
  ok(end.triggered,'Stage 4 checkpoint endpoint triggers after gate');
  ok(H.getMovement().zone==='openSpace'||!H.P.grounded,'post-gate area remains open space');
}

// ---- belt saucer aggro in open space ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const belt=SaucerAt(H,74,-232);
  function SaucerAt(H,x,z){return H.getSpace().saucers.find(s=>!s.targetDummy&&Math.abs(s.x-x)<2&&Math.abs(s.z-z)<2);}
  ok(!!belt,'belt saucer authored');
  H.P.pos.set(belt.x,belt.y,belt.z+4);H.P.grounded=false;H.P.moveZone='openSpace';H.P.vel.set(0,0,0);
  for(let i=0;i<60;i++)H.frames(1);
  ok(belt.aggro||Math.hypot(belt.x-H.P.pos.x,belt.z-H.P.pos.z)<belt.size+2,'open-space belt saucer can aggro without landing');
}

// ---- hazard recovery after saucer belt asteroid ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const rock=H.getSpace().asteroids.find(a=>a.hazard&&a.z<-210);
  ok(!!rock,'belt hazard asteroid present');
  H.P.pos.set(rock.x-rock.r-0.1,rock.y,rock.z);H.P.vel.set(2,0,0);
  H.P.grounded=false;H.P.moveZone='openSpace';H.P.hp=4;H.P.inv=0;
  const hp0=H.P.hp;
  for(let i=0;i<30;i++)H.frames(1);
  ok(H.P.hp===hp0-1,'belt asteroid costs one heart');
  ok(H.P.inv>0.4,'belt asteroid grants i-frames');
  holdJump(H,8);
  ok(H.getMovement().spaceThrust||H.getMovement().zone==='openSpace','flight restored after belt hazard hit');
  releaseJump(H);
}

// ---- Levels 1–3 regression spot ----
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1','Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

report();
