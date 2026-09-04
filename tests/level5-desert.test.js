// Level 5 — Desert enhancement: camel direction, longer challenge route, sealed cliff finale, lush oasis.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function width(s){return s.max.x-s.min.x;}
function depth(s){return s.max.z-s.min.z;}

// ---- level authoring / menu and extended world shape ----
{
  const H=boot();
  ok(!!H.el('lvl4')&&!!H.el('art4'),'picker exposes a fifth Desert card');
  H.startLevel(4);H.frames(4);
  const L=H.getLevel();
  ok(L&&L.id==='level5','picker index 4 loads Level 5');
  ok(H.window.__isDesert&&H.window.__isDesert(),'Level 5 owns the desert atmosphere');
  ok(H.W.camels.length===3,'extended route preserves two camel points and adds one forgiving remount');
  ok(H.W.cacti.length>=27,'extended route contains dense but readable cactus traversal');
  ok(H.W.lizards.length===2,'route preserves both original lizard reward types');
  ok(H.W.quicksands.length===13,'extended route contains twelve ordinary pools and one final pool');
  ok(H.W.quicksands.filter(q=>q.role==='ordinary').length===12,'ordinary quicksand remains distinct from finale sand');
  ok(H.W.quicksands.filter(q=>q.role==='final').length===1,'one explicit final quicksand pool is authored');
  ok(Array.isArray(L.challengeBeats)&&L.challengeBeats.length===7,'seven meaningful challenge beats are documented');
  ok(L.challengeBeats.every((b,i,a)=>i===0||b[1]<a[i-1][1]),'challenge beats progress monotonically down the desert route');
  ok(L.checks.length>=8,'checkpoints are distributed after meaningful progress');
  ok(H.W.FINISH&&H.W.FINISH.winMsg==='You found the green oasis!','oasis preserves the normal finish contract');
}

// ---- camel mount, true authored forward axis, higher jump, and B dismount ----
{
  const H=boot();H.startLevel(4);H.frames(4);
  const c=H.W.camels[0],neck=c.g.userData&&c.g.userData.neck;
  ok(!!neck&&neck.position.z>0&&neck.rotation.x>0,'camel head/neck is authored on local +Z, matching Pling movement forward');
  H.P.pos.set(c.x,c.y,c.z+0.7);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
  H.tap('Space',1);H.frames(1);
  ok(H.P.camel===c&&c.mounted,'A/Space near a camel mounts its saddle');
  const y0=H.P.pos.y;
  H.tap('Space',1);
  ok(H.P.camel===c&&H.P.vel.y>10.7&&H.P.pos.y>y0,'mounted A/Space remains a visibly higher camel jump');
  H.P.pos.y=0;H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
  H.tap('KeyJ',1);H.frames(1);
  ok(!H.P.camel&&!c.mounted,'B/J remains a stable camel dismount');
}

// ---- lizard rewards remain real pickups, not invisible score ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const heartL=H.W.lizards.find(l=>l.reward==='heart'),noteL=H.W.lizards.find(l=>l.reward==='note');
  const hearts0=H.W.hearts.length,notes0=H.W.notes.length;
  H.P.pos.set(heartL.x,0,heartL.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.tap('KeyK',2);H.frames(3);
  ok(!heartL.alive&&H.W.hearts.length===hearts0+1,'spinning the heart lizard leaves a visible heart reward');
  H.P.pos.set(noteL.x,0,noteL.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.tap('KeyK',2);H.frames(3);
  ok(!noteL.alive&&H.W.notes.length===notes0+1,'spinning the note lizard leaves a visible note reward');
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

// ---- finale geometry: walkable central ramp plus natural sandstone side closure ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const cliffs=H.W.solids.filter(s=>s.role==='cliff');
  const center=cliffs.find(s=>Math.abs(width(s)-18)<0.1&&Math.abs(depth(s)-14)<0.1&&Math.abs(s.max.y-7.22)<0.1);
  const side=cliffs.filter(s=>s!==center&&s.max.y>=11.7);
  const ramp=H.W.solids.filter(s=>s.role==='desertRamp').sort((a,b)=>b.min.z-a.min.z);
  ok(!!center,'original sandstone cliff architecture remains at the finale center');
  ok(ramp.length>=18,'final approach uses enough shallow terraces for ordinary step-up movement');
  let maxRise=0;for(let i=1;i<ramp.length;i++)maxRise=Math.max(maxRise,ramp[i].max.y-ramp[i-1].max.y);
  ok(maxRise<=0.42+1e-6,'each cliff terrace rise stays within the Level 5 STEP height');
  const highest=ramp[ramp.length-1];
  ok(!!highest&&Math.abs(highest.max.y-center.max.y)<=0.08,'terraced climb reaches the authored cliff-top height');
  ok(!!highest&&highest.min.z<=center.max.z+0.25&&highest.max.z>=center.max.z-0.25,'highest terrace still joins the central cliff');
  ok(side.length===6,'six visible sandstone canyon segments close the finale sides');
  const left=side.filter(s=>s.max.x<0),right=side.filter(s=>s.min.x>0);
  ok(left.length===3&&right.length===3,'finale has symmetric multi-segment left and right canyon walls');
  ok(left.every(s=>s.max.x>=center.min.x-0.25)&&right.every(s=>s.min.x<=center.max.x+0.25),'canyon walls overlap the central cliff edges with no side gap');
  ok(Math.min(...side.map(s=>s.min.z))<=-398&&Math.max(...side.map(s=>s.max.z))>=-333,'canyon walls cover wide and diagonal approaches through the final drop zone');
  ok(Math.min(...side.map(s=>s.max.y))-center.max.y>4.4,'side ridges are too high to climb from the cliff with ordinary camel traversal');
  const final=H.W.quicksands.find(q=>q.role==='final');
  ok(final.w>=18&&final.d>=22&&final.z<center.min.z,'special final quicksand fills the canyon floor below the cliff');
}

// ---- oasis is materially greener/richer while preserving the finish contract ----
{
  const H=boot();H.startLevel(4);H.frames(3);
  const o=H.window.__DESERT.state&&H.window.__DESERT.state.oasis,l=o&&o.lushness;
  ok(!!o&&!!l,'oasis exposes its authored lushness composition');
  ok(l.grassMounds>=5&&l.palms>=9,'oasis has layered green ground and more palm framing');
  ok(l.shrubs>=14&&l.reeds>=18,'oasis adds dense shrubs and shoreline reeds');
  ok(l.flowers>=30&&l.stones>=14&&l.sparkles>=12,'oasis adds color, shoreline detail and magical sparkles');
  ok(o.pool&&o.pool.material&&o.pool.material.color,'brighter oasis water remains visible');
}

// ---- final sand trap, portal, oasis and clean return ----
{
  const H=boot();H.startLevel(4);H.frames(3);
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

// ---- Levels 1–4 remain selectable and non-desert ----
{
  const H=boot();
  for(let i=0;i<4;i++){
    H.startLevel(i);H.frames(3);
    ok(H.getLevel().id===`level${i+1}`&&!H.window.__isDesert(),`Level ${i+1} remains selectable without Desert state`);
  }
}

report();
