// Level 4 Stage 5 — Star Observatory + Snoozle 4.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function flyToward(H,x,y,z,maxFrames){
  for(let i=0;i<(maxFrames||400);i++){
    const dx=x-H.P.pos.x,dy=y-H.P.pos.y,dz=z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    H.P.vel.set(dx/d*6.5,dy/d*6.5,dz/d*6.5);
    H.kd({code:'Space',preventDefault(){},repeat:false});
    H.frames(1);
    if(d<3.2)break;
  }
  H.ku({code:'Space'});
}
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+0.5);
  H.P.vel.set(0,0,0);H.P.grounded=true;H.P.moveZone='grounded';H.P.bonkCD=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(35);
}

// ---- version + route markers ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  ok(H.getCamDiag().VERSION_BASE==='v49 · Space finish','version stamp v49');
  const L=H.getLevel(),R=L.route;
  ok(R&&R.observatory&&R.snoozle4&&R.blackHole,'route markers for Observatory / Snoozle 4 / black hole');
  ok(R.observatory.z<R.stage4End.z,'Observatory begins after Stage 4 endpoint');
  ok(R.snoozle4.z<=R.observatory.z,'Snoozle 4 on Observatory catwalk toward black hole');
}

// ---- Observatory authored and landable ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace(),obs=S.observatory;
  ok(!!obs,'Star Observatory exists');
  ok(obs.g&&obs.g.userData.observatory,'observatory flag set');
  const pad=H.W.solids.find(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-obs.x,(s.min.z+s.max.z)/2-obs.z)<2);
  ok(!!pad,'Observatory main deck is landable');
  ok(S.saucers.filter(s=>!s.targetDummy&&s.z<-270).length===0,'no mandatory combat at Observatory');
}

// ---- exactly four Snoozles; 1–3 unchanged ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  ok(H.W.snoozles.length===4,'exactly four Level 4 Snoozles');
  ok(H.getLevel().snoozleGoal===4,'snoozleGoal remains 4');
  const dock=H.W.snoozles[0],candy=H.W.snoozles[1],crystal=H.W.snoozles[2],obsSn=H.W.snoozles[3];
  ok(Math.hypot(dock.g.position.x,dock.g.position.z)<8&&dock.g.position.y<2,'Snoozle 1 still on Launch Dock');
  const cp=H.getSpace().candyPlanet;
  ok(Math.hypot(candy.g.position.x-cp.pad.x,candy.g.position.z-cp.pad.z)<8,'Snoozle 2 still on Candy Planet');
  ok(Math.hypot(crystal.g.position.x-102,crystal.g.position.z+219)<4,'Snoozle 3 still in Crystal Cavern');
  const R=H.getLevel().route;
  ok(Math.hypot(obsSn.g.position.x-R.snoozle4.x,obsSn.g.position.z-R.snoozle4.z)<1.5,'Snoozle 4 at Observatory catwalk');
  ok(obsSn.g.position.y>20,'Snoozle 4 on deck height');
}

// ---- natural travel: Stage 4 end → Observatory ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const R=H.getLevel().route;
  H.P.pos.set(R.stage4End.x,R.stage4End.y,R.stage4End.z);
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  flyToward(H,R.observatory.x,R.observatory.y+1,R.observatory.z,500);
  ok(Math.hypot(H.P.pos.x-R.observatory.x,H.P.pos.z-R.observatory.z)<6,'Observatory reachable by open-space travel');
  // Land on deck
  H.P.pos.set(R.observatory.x,R.observatory.y+0.5,R.observatory.z);
  H.P.vel.set(0,-1,0);H.frames(20);
  ok(H.P.grounded||H.getMovement().zone==='grounded'||H.P.pos.y<=R.observatory.y+1.2,'Observatory provides a safe rest surface');
}

// ---- Snoozle 4 wake does not win ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const sn=H.W.snoozles[3];
  // Wake first three without triggering all-awake
  for(let i=0;i<3;i++){wake(H,H.W.snoozles[i]);}
  ok(H.W.snoozles.filter(s=>s.state!=='sleep').length===3,'three Snoozles awake before Observatory');
  ok(!H.getSpace().blackHoleActive,'black hole still inactive at 3/4');
  wake(H,sn);
  ok(sn.state!=='sleep','Snoozle 4 wakes via normal spin');
  ok(H.W.snoozles.filter(s=>s.state!=='sleep').length===4,'awake state becomes 4/4');
  ok(!H.W.won,'waking Snoozle 4 does NOT win');
  ok(H.el('win').style.display!=='flex','win banner not shown on Snoozle 4');
  ok(H.getSpace().blackHoleActive,'fourth Snoozle activates black hole');
  ok(H.AU().layers===4,'music layers advance to all-awake state');
}

// ---- Observatory checkpoint ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const R=H.getLevel().route;
  const check=H.W.checks.find(c=>Math.hypot(c.x-R.observatory.x,c.z-R.observatory.z)<3);
  ok(!!check,'Observatory checkpoint exists');
  H.P.pos.set(check.x,check.y+0.4,check.z);H.P.vel.set(0,0,0);H.frames(8);
  ok(check.on,'Observatory checkpoint arms on approach');
  ok(Math.abs(H.P.spawn.x-check.x)<0.1,'respawn set to Observatory checkpoint');
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
