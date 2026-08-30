// Candy Planet is landable — approach must land, not ghost through the sphere.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace();
  const cp=S.candyPlanet;
  ok(!!cp&&cp.g&&cp.g.userData.landable===true,'Candy Planet authored landable');
  ok(!!cp.pad,'approach-facing pad present');
  ok(S.landingTargets.some(t=>Math.hypot(t.x-cp.pad.x,t.z-cp.pad.z)<2),'landing beacon on candy pad');
  ok(H.W.solids.some(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-cp.pad.x,(s.min.z+s.max.z)/2-cp.pad.z)<2),'landable solid on candy pad');
}

// Fly through planet center — must capture to pad, not pass through
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const midSaucer=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid');
  ok(!!midSaucer,'candy mid saucer is surface-gated');
  // Approaching in open space: surface saucers must not aggro yet
  H.P.pos.set(cp.x-14,cp.y+1,cp.z+10);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(20);
  ok(!midSaucer.aggro,'surface saucer does not aggro during open-space approach');

  H.P.pos.set(cp.x-2,cp.y,cp.z+2);H.P.vel.set(3,0,-3);H.P.grounded=false;H.P.moveZone='openSpace';H.P.hp=4;
  for(let i=0;i<100;i++)H.frames(1);
  ok(H.P.grounded,'flying into Candy Planet lands on the pad');
  ok(Math.hypot(H.P.pos.x-cp.pad.x,H.P.pos.z-cp.pad.z)<cp.r*0.75,'landed near approach pad');
  ok(H.P.pos.y<cp.pad.y+2.5,'landed on pad height, not floating through body');
  ok(H.isStarted()&&H.getLevel().id==='level4','remain in Level 4 after candy landing');
}

// Valid approach from route height toward pad
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  H.P.pos.set(82,16,-192);H.P.vel.set(4,1,-2);H.P.grounded=false;H.P.moveZone='openSpace';
  for(let i=0;i<160;i++){
    const dx=cp.pad.x-H.P.pos.x,dy=cp.pad.y+1-H.P.pos.y,dz=cp.pad.z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    H.P.vel.set(dx/d*5.5,dy/d*4,dz/d*5.5);
    H.frames(1);
    if(H.P.grounded)break;
  }
  ok(H.P.grounded,'route approach to Candy Planet completes landing');
  ok(H.getSpace().starCrates.length>=1,'Star Beam teaching reachable after landing');
}

// Cheese Moon remains foreshadow-only
{
  const H=boot();H.startLevel(3);H.frames(4);
  ok(H.getSpace().cheeseMoon&&H.getSpace().cheeseMoon.userData.landable===false,'Cheese Moon still non-landable');
}

report();
