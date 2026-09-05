// Level 4 Stage 5 — Star Observatory, Snoozle 4, calm rest area.
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
function wake(H,sn){H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z+0.6);H.P.grounded=true;H.P.vel.set(0,0,0);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(40);}

// ---- version ----
{
  const H=boot();
  ok(H.versionUsesCanonicalRelease(),'version stamp derives from canonical BELLHOP_RELEASE');
}

// ---- Snoozles: exactly four (Launch Dock, Candy, Crystal, Observatory) ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  ok(H.W.snoozles.length===4,'Level 4 has four authored Snoozles');
  ok(H.getLevel().snoozleGoal===4,'snoozleGoal remains 4');
  const dock=H.W.snoozles[0],candy=H.W.snoozles[1],crystal=H.W.snoozles[2],obs=H.W.snoozles[3];
  ok(Math.hypot(dock.g.position.x,dock.g.position.z)<8&&dock.g.position.y<2,'Snoozle 1 on Launch Dock');
  ok(Math.hypot(candy.g.position.x-98,candy.g.position.z+188)<8,'Snoozle 2 on Candy Planet surface');
  ok(crystal.g.position.y<20,'Snoozle 3 in Crystal Cavern height band');
  ok(Math.hypot(obs.g.position.x-10,obs.g.position.z+270)<6,'Snoozle 4 on Observatory deck');
  ok(obs.g.position.y>20,'Snoozle 4 at Observatory height');
}

// ---- Observatory route after Stage 4 checkpoint ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const end=H.getSpace().stage4Ends[0];
  ok(!!end,'Stage 4 endpoint exists');
  H.P.pos.set(end.x,end.y,end.z);H.P.vel.set(0,0,0);H.frames(6);
  flyToward(H,10,24,-272,400);
  ok(H.P.pos.z<-265,'Observatory route reachable from Stage 4 endpoint');
  ok(Math.hypot(H.P.pos.x-10,H.P.pos.z+272)<12,'player reaches Observatory area');
}

// ---- Observatory safe rest (no mandatory combat) ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const beltSaucers=H.getSpace().saucers.filter(s=>!s.targetDummy&&s.z>-280&&s.z<-240);
  ok(beltSaucers.length>=1,'Saucer Belt still has belt saucers');
  const obsSaucers=H.getSpace().saucers.filter(s=>!s.targetDummy&&Math.hypot(s.x-10,s.z+272)<22);
  ok(obsSaucers.length===0,'no mandatory combat saucers at Observatory');
  ok(H.getSpace().jellyfish.length>=2,'harmless jellyfish at Observatory');
}

// ---- Snoozle 4 collectible, does not win ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  for(let i=0;i<3;i++)wake(H,H.W.snoozles[i]);
  ok(H.AU().layers===3,'three Snoozles raise music to layer 3');
  ok(!H.W.won,'three Snoozles do not win');
  const obs=H.W.snoozles[3];
  wake(H,obs);
  ok(obs.state!=='sleep','Snoozle 4 wakes via spin on Observatory deck');
  ok(H.AU().layers===4,'waking Snoozle 4 raises music to layer 4');
  ok(!H.W.won,'waking Snoozle 4 does NOT trigger win');
}

// ---- Observatory checkpoint ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const cp=H.W.checks.find(c=>Math.hypot(c.x-10,c.z+272)<4);
  ok(!!cp,'Observatory checkpoint authored');
  H.P.pos.set(cp.x,cp.y,cp.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.moveZone='grounded';H.P.surf='pad';
  H.frames(30);
  ok(cp.on,'Observatory checkpoint triggers on approach');
}

// ---- black hole activates on fourth Snoozle (not on wake win) ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  for(let i=0;i<3;i++)wake(H,H.W.snoozles[i]);
  const bh=H.getSpace().blackHoleFinish;
  ok(bh&&!bh.active,'black hole inactive at three Snoozles');
  wake(H,H.W.snoozles[3]);
  ok(bh.active,'fourth Snoozle activates black hole portal');
  ok(!H.W.won,'activation alone does not win');
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
