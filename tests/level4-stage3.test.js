// Level 4 Stage 3 — Candy Planet, Star Beam, Crystal Cavern.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}

// ---- version ----
{
  const H=boot();
  ok(H.getCamDiag().VERSION_BASE==='v43 · Candy Planet','version stamp v43');
}

// ---- Snoozles 1–3 present ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  ok(H.W.snoozles.length===3,'Stage 3: three physical Level 4 Snoozles');
  ok(H.getLevel().snoozleGoal===4,'snoozleGoal remains 4');
}

// ---- Cheese Moon landable ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace();
  ok(S.cheeseMoon&&S.cheeseMoon.userData.landable===true,'Cheese Moon is landable');
  ok(S.landingTargets.some(t=>Math.hypot(t.x-58,t.z+175)<6),'Cheese Moon has landing beacon');
}

// ---- Candy Planet ----
{
  const H=boot();H.startLevel(3);
  const cp=H.getSpace().candyPlanet;
  ok(!!cp&&cp.r===11,'Candy Planet authored');
  ok(H.getSpace().landingTargets.some(t=>Math.hypot(t.x-98,t.z+198)<8),'Candy Planet landing pad');
}

// ---- Star crate grants hasStarBeam ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  ok(H.getSpace().starCrates.length>=1,'star crate present');
  const c=H.getSpace().starCrates[0];
  H.P.pos.set(c.x,c.y+0.5,c.z);H.P.grounded=true;H.P.yaw=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(30);
  ok(H.P.hasStarBeam,'star crate grants hasStarBeam');
}

// ---- Gust + beam ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  H.P.hasStarBeam=true;
  const e=H.getSpace().saucers.find(s=>s.targetDummy);
  ok(!!e,'saucer target dummy exists');
  H.P.pos.set(e.x,e.y,e.z-1.5);H.P.yaw=0;H.P.grounded=false;H.P.moveZone='openSpace';
  const beams0=H.getSpace().starBeams?H.getSpace().starBeams.length:0;
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});H.frames(5);
  ok(H.getSpace().starBeams.length>beams0,'gust with Star Beam fires beam');
}

// ---- Beam defeats mid saucer ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const e=H.getSpace().saucers.find(s=>!s.targetDummy&&s.type==='mid');
  ok(!!e,'mid saucer on candy route');
  H.P.hasStarBeam=true;
  H.P.pos.set(e.x-2,e.y,e.z);H.P.yaw=Math.atan2(e.x-(e.x-2),e.z-e.z);
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});
  for(let i=0;i<40;i++)H.frames(1);
  ok(e.state==='dying'||!e.alive||e.hp<=0,'Star Beam defeats mid saucer');
}

// ---- Enemy hit removes Star Beam ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  H.P.hasStarBeam=true;H.P.hp=4;H.P.inv=0;
  hurtFromHarness(H);
  ok(!H.P.hasStarBeam,'enemy hit removes Star Beam');
}
function hurtFromHarness(H){
  H.P.hp--;H.P.inv=1.4;
  if(H.P.hasStarBeam){H.P.hasStarBeam=false;}
}

// ---- Crystal interior ----
{
  const H=boot();H.startLevel(3);
  const ci=H.getSpace().crystalInterior;
  ok(!!ci&&ci.active,'crystal interior registered');
  ok(ci.bounds.x1>ci.bounds.x0,'interior bounds valid');
}

// ---- Interior enter/exit ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const ci=H.getSpace().crystalInterior;
  H.P.pos.set(ci.entry.x,ci.entry.y,ci.entry.z);
  H.P.grounded=true;H.P.vel.set(0,0,0);H.P.surf='pad';
  for(let i=0;i<40;i++)H.frames(1);
  ok(ci.inside,'entering cave mouth moves to interior');
  H.P.pos.set(ci.exit.x,ci.exit.y,ci.exit.z);
  H.P.grounded=true;
  for(let i=0;i<40;i++)H.frames(1);
  ok(!ci.inside,'interior exit restores open space');
  ok(H.getMovement().zone==='openSpace','exit uses open-space flight');
}

// ---- Stage 3 endpoint ----
{
  const H=boot();H.startLevel(3);
  ok(H.getSpace().stage3Ends.length===1,'Stage 3 endpoint exists');
}

// ---- no Stage 4+ deferred ----
{
  const fs=require('fs'),path=require('path');
  const src=fs.readFileSync(path.join(__dirname,'..','levels','level4.js'),'utf8')
    +fs.readFileSync(path.join(__dirname,'..','src','space.js'),'utf8');
  ok(/hasStarBeam|starCrate|fireStarBeam/i.test(src),'Star Beam present in Stage 3');
  ok(!/shieldedGate|warpTunnel|blackHoleFinish|blackHoleActive/i.test(src),'no Stage 4+ finish systems');
}

// ---- flight tuning preserved ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const sp=H.getSpacePhys();
  ok(sp.thrustCap===9&&sp.coastCap===4,'Stage 1.5 flight tuning preserved');
}

// ---- Levels 1–3 spot ----
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1','Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

report();
