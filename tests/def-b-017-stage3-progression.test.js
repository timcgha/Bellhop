// DEF-B-017: Stage 3 endpoint must not end Level 4 / return to picker.
// Natural journey: Asteroid Garden → Cheese Moon foreshadow → Candy Planet → Stage 3 milestone → stay in Level 4.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

{
  const H=boot();H.startLevel(3);H.frames(8);
  ok(H.isStarted()&&H.getLevel().id==='level4','start Level 4');

  // Asteroid Garden Stage 2 Cheese Moon foreshadow — remain in Level 4
  const s2=H.getSpace().stage2Ends[0];
  H.P.pos.set(s2.x,s2.y,s2.z);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(6);
  ok(s2.triggered,'Cheese Moon foreshadow triggered');
  for(let i=0;i<100;i++)H.frames(1);
  ok(H.isStarted()&&H.getLevel().id==='level4','remain in Level 4 after Cheese Moon');

  // Candy Planet approach / land (repository: landable)
  const cp=H.getSpace().candyPlanet;
  ok(!!cp&&cp.pad,'Candy Planet has approach pad');
  H.P.pos.set(cp.x,cp.y,cp.z);H.P.vel.set(2,0,-2);H.P.grounded=false;H.P.moveZone='openSpace';
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.grounded||(cp.landed===true),'Candy Planet approach lands (no pass-through)');
  ok(H.isStarted(),'still in Level 4 after Candy Planet');
  ok(H.getSpace().starCrates&&H.getSpace().starCrates.length>=1,'Star Beam crate reachable after landing');

  // Subsequent Stage 3 milestone (crystal exit endpoint) — must NOT soft-return
  const s3=H.getSpace().stage3Ends[0];
  ok(!!s3,'Stage 3 endpoint present');
  H.P.pos.set(s3.x,s3.y,s3.z);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(8);
  ok(s3.triggered,'Stage 3 milestone triggered');
  const toast=(H.el('toast')&&H.el('toast').textContent)||'';
  ok(/saucer belt/i.test(toast),'Stage 3 foreshadow message preserved');

  for(let i=0;i<100;i++)H.frames(1);

  ok(H.isStarted(),'DEF-B-017: runtime remains in Level 4 after Stage 3 milestone');
  ok(H.getLevel()&&H.getLevel().id==='level4','DEF-B-017: Level 4 still loaded');
  const startDisp=(H.el('start')&&H.el('start').style&&H.el('start').style.display)||'';
  ok(startDisp!=='flex','DEF-B-017: no title/picker/reset transition');
  ok(!H.W.won,'DEF-B-017: Stage 3 milestone does not complete Level 4');

  // Next Stage 3 content still reachable (crystal interior + star beam systems)
  ok(H.getSpace().crystalInterior&&H.getSpace().crystalInterior.active,'Crystal Cavern still reachable');
  ok(H.getSpace().stage3Ends.length===1,'Stage 3 endpoint remains available');
}

report();
