// Level 5 — Desert: picker, camel ride, cactus blockers, lizard rewards, quicksand, and oasis finish.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}

// ---- level authoring / menu and world shape ----
{
  const H=boot();
  ok(!!H.el('lvl4')&&!!H.el('art4'),'picker exposes a fifth Desert card');
  H.startLevel(4);H.frames(4);
  ok(H.getLevel()&&H.getLevel().id==='level5','picker index 4 loads Level 5');
  ok(H.window.__isDesert&&H.window.__isDesert(),'Level 5 owns the desert atmosphere');
  ok(H.W.camels.length===2,'two friendly camel ride points are authored');
  ok(H.W.cacti.length>=8,'route contains readable cactus blockers');
  ok(H.W.lizards.length===2,'route contains both lizard reward types');
  ok(H.W.quicksands.length===4,'route contains ordinary pools and one final pool');
  ok(H.W.quicksands.filter(q=>q.role==='ordinary').length===3,'three ordinary quicksand pools are distinct from the finale');
  ok(H.W.quicksands.filter(q=>q.role==='final').length===1,'one explicit final quicksand pool is authored');
  ok(H.W.solids.some(s=>s.role==='cactus')&&H.W.solids.some(s=>s.role==='cliff'),'cactus and sandstone cliff supply real collision roles');
  ok(H.W.FINISH&&H.W.FINISH.winMsg==='You found the green oasis!','oasis registers the normal finish contract');
}

// ---- camel mount, higher stride / jump, and B dismount ----
{
  const H=boot();H.startLevel(4);H.frames(4);
  const c=H.W.camels[0];
  H.P.pos.set(c.x,c.y,c.z+0.7);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
  H.tap('Space',1);H.frames(1);
  ok(H.P.camel===c&&c.mounted,'A/Space near a camel mounts its saddle');
  const y0=H.P.pos.y;
  H.tap('Space',1);
  ok(H.P.camel===c&&H.P.vel.y>10.7&&H.P.pos.y>y0,'mounted A/Space is a visibly higher camel jump');
  H.P.pos.y=0;H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
  H.tap('KeyJ',1);H.frames(1);
  ok(!H.P.camel&&!c.mounted,'B/J provides a stable camel dismount');
}

// ---- lizard rewards are real pickups, not an invisible score ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const heartL=H.W.lizards.find(l=>l.reward==='heart'),noteL=H.W.lizards.find(l=>l.reward==='note');
  const hearts0=H.W.hearts.length,notes0=H.W.notes.length;
  H.P.pos.set(heartL.x,0,heartL.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.tap('KeyK',2);H.frames(3);
  ok(!heartL.alive&&H.W.hearts.length===hearts0+1,'spinning a heart lizard leaves a visible heart reward');
  H.P.pos.set(noteL.x,0,noteL.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.tap('KeyK',2);H.frames(3);
  ok(!noteL.alive&&H.W.notes.length===notes0+1,'spinning a note lizard leaves a visible note reward');
}

// ---- ordinary quicksand recovers without winning ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const q=H.W.quicksands.find(x=>x.role==='ordinary');
  H.P.safeAnchor.set(0,0,28);H.P.pos.set(q.x,0,q.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.hp=4;
  H.frames(1);
  ok(H.P.quicksandRecT>0,'ordinary quicksand begins its recovery animation');
  ok(!H.W.won,'ordinary quicksand cannot trigger the oasis finish');
  H.frames(60);
  ok(H.P.hp===3&&dist(H.P.pos,H.P.safeAnchor)<0.1&&H.P.grounded,'ordinary quicksand costs one heart and returns to the safe anchor');
  ok(!H.W.won,'ordinary recovery remains non-winning after completion');
}

// ---- cliff ascent is actually walkable and joins the dramatic drop ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const cliff=H.W.solids.find(s=>s.role==='cliff');
  const ramp=H.W.solids.filter(s=>s.role==='desertRamp'&&s.min.z<-700).sort((a,b)=>b.min.z-a.min.z);
  ok(!!cliff,'sandstone cliff is collision-authored before the finale');
  ok(ramp.length>=18,'cliff approach uses enough shallow terraces for ordinary step-up movement');
  let maxRise=0;
  for(let i=1;i<ramp.length;i++)maxRise=Math.max(maxRise,ramp[i].max.y-ramp[i-1].max.y);
  ok(maxRise<=0.42+1e-6,'each cliff terrace rise stays within the Level 5 STEP height');
  const highest=ramp[ramp.length-1];
  ok(!!highest&&Math.abs(highest.max.y-cliff.max.y)<=0.08,'terraced climb reaches the authored cliff-top height');
  ok(!!highest&&highest.min.z<=cliff.max.z+0.25&&highest.max.z>=cliff.max.z-0.25,'highest terrace joins the cliff instead of leaving an impassable gap');
}

// ---- final sand trap, portal, oasis and clean return ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  for(const s of H.W.snoozles){
    H.P.pos.set(s.g.position.x,0,s.g.position.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
    H.tap('KeyK',2);H.frames(40);
  }
  ok(H.W.snoozles.every(s=>s.state!=='sleep')&&H.window.__snoozleGoal()===4,'normal Snoozle progression unlocks the Desert finale');
  const final=H.W.quicksands.find(q=>q.role==='final');
  H.P.pos.set(final.x,0,final.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.hp=4;
  H.frames(3);
  ok(H.window.__DESERT.state&&H.window.__DESERT.state.finish&&H.window.__DESERT.state.finish.phase==='sink','final quicksand begins the distinct sink sequence');
  H.frames(190);
  const d=H.window.__DESERT.state;
  ok(H.W.won,'final quicksand portal reaches the ordinary win flow exactly once');
  ok(d&&d.oasisGroup&&d.oasisGroup.visible,'oasis tableau appears only after the portal transition');
  ok(H.CAM.mode==='finish','oasis celebration owns a stable finish camera');
  H.window.__returnToLevelSelect();
  ok(!H.isStarted()&&!H.window.__DESERT.state&&!H.W.camels.length&&!H.W.quicksands.length,'return-to-picker cleans Level 5 entities and finish state');
}

// ---- prior worlds remain selectable after Level 5 cleanup ----
{
  const H=boot();H.startLevel(0);H.frames(3);
  ok(H.getLevel().id==='level1'&&!H.window.__isDesert(),'Level 1 remains selectable without desert state');
}

report();
