// DEF-B-016: Cheese Moon Stage 2 foreshadow must not end Level 4.
// Human journey: Asteroid Garden → Cheese Moon message → remain in Level 4 → Candy Planet.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

{
  const H=boot();H.startLevel(3);H.frames(8);
  ok(H.isStarted()&&H.getLevel().id==='level4','start Level 4');
  ok(H.getSpace().stage2Ends.length===1,'Asteroid Garden Stage 2 endpoint present');
  ok(H.getSpace().cheeseMoon&&H.getSpace().cheeseMoon.userData.landable===false,'Cheese Moon foreshadow, not landable');

  // Traverse accepted Asteroid Garden flow into the Stage 2 Cheese Moon trigger
  const e=H.getSpace().stage2Ends[0];
  H.P.pos.set(e.x,e.y,e.z);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(6);
  ok(e.triggered,'Cheese Moon foreshadow message/event triggered');
  const toast=(H.el('toast')&&H.el('toast').textContent)||'';
  ok(/cheese moon/i.test(toast),'Cheese Moon message preserved');

  // Wait past the old 1.2s soft-return window (~72 frames at 16.67ms)
  for(let i=0;i<100;i++)H.frames(1);

  ok(H.isStarted(),'DEF-B-016: runtime remains in Level 4 after Cheese Moon');
  ok(H.getLevel()&&H.getLevel().id==='level4','DEF-B-016: Level 4 still loaded');
  const startDisp=(H.el('start')&&H.el('start').style&&H.el('start').style.display)||'';
  ok(startDisp!=='flex','DEF-B-016: no title/picker/reset transition');
  ok(!H.W.won,'DEF-B-016: Cheese Moon does not complete Level 4');

  // Continue beyond Cheese Moon toward Candy Planet Stage 3
  const cp=H.getSpace().candyPlanet;
  ok(!!cp,'Candy Planet exists beyond Cheese Moon');
  if(cp){
    H.P.pos.set(cp.x,cp.y-cp.r*0.52+0.5,cp.z);H.P.vel.set(0,0,0);H.P.grounded=true;
    H.frames(12);
  }
  ok(H.isStarted(),'DEF-B-016: still in Level 4 after reaching Candy Planet');
  ok(H.getSpace().starCrates&&H.getSpace().starCrates.length>=1,'Stage 3 Star Beam progression reachable');
  ok(H.getSpace().stage3Ends&&H.getSpace().stage3Ends.length===1,'Stage 3 endpoint still available');
}

report();
