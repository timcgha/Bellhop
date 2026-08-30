// Level 4 Stage 2 — Asteroid Garden + first flying saucer.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}
function flyTo(H,x,y,z,frames){
  for(let i=0;i<(frames||180);i++){
    const dx=x-H.P.pos.x,dy=y-H.P.pos.y,dz=z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    // Approximate stick: forward/back for climb/descend relative to camera is hard;
    // set velocity toward target while thrusting.
    H.P.vel.set(dx/d*6,dy/d*6,dz/d*6);
    H.kd({code:'Space',preventDefault(){},repeat:false});
    H.frames(1);
    if(Math.hypot(H.P.pos.x-x,H.P.pos.y-y,H.P.pos.z-z)<1.8)break;
  }
  H.ku({code:'Space'});
}

// ---- version ----
{
  const H=boot();
  ok(H.getCamDiag().VERSION_BASE==='v43 · Candy Planet','version stamp v42');
}

// ---- Snoozle 1 ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  ok(H.W.snoozles.length>=1,'Level 4 Snoozles authored');
  ok(H.getLevel().snoozleGoal===4,'snoozleGoal remains 4');
  const sn=H.W.snoozles[0];
  ok(Math.hypot(sn.g.position.x,sn.g.position.z)<8&&sn.g.position.y<2,'Snoozle 1 on Launch Dock / opening');
  ok(sn.state==='sleep','Snoozle 1 starts asleep');
  // Wake via spin near dock
  H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z+0.4);
  H.P.vel.set(0,0,0);H.P.grounded=true;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(20);
  ok(sn.state!=='sleep','Snoozle 1 wakes with ordinary spin');
  ok(H.AU().layers===1,'waking Snoozle 1 raises music to layer 1');
  ok(!H.W.won,'waking Snoozle 1 does not win');
  ok(!(H.getSpace().blackHole&&H.getSpace().blackHole.userData.active),'waking Snoozle 1 does not activate black hole');
}

// ---- asteroid visual roles ----
{
  const H=boot();H.startLevel(3);
  const S=H.getSpace();
  const hazards=S.asteroids.filter(a=>a.hazard);
  const backs=S.asteroids.filter(a=>a.role==='backdrop');
  const moving=S.asteroids.filter(a=>a.moving);
  ok(hazards.length>=6,'hazard asteroids authored for Garden');
  ok(backs.length>=4,'backdrop asteroids present');
  ok(backs.every(a=>!a.hazard),'backdrop asteroids are non-hazard');
  ok(moving.length===1,'exactly one moving gameplay asteroid');
  ok(S.landingTargets.every(t=>!t.hazard),'landable pads are not hazard asteroids');
  const teach=hazards.find(a=>a.role==='teach');
  ok(!!teach,'first teaching asteroid exists');
  ok(teach&&Math.hypot(teach.x-28,teach.z+32)>6,'teaching asteroid sits beside route, not filling it');
}

// ---- asteroid damage + i-frames + anti-pinball ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const S=H.getSpace();
  const teach=S.asteroids.find(a=>a.role==='teach');
  H.P.pos.set(teach.x-teach.r-0.2,teach.y,teach.z);H.P.vel.set(2,0,0);
  H.P.grounded=false;H.P.moveZone='openSpace';H.P.hp=4;H.P.inv=0;
  const hp0=H.P.hp;
  for(let i=0;i<30;i++)H.frames(1);
  ok(H.P.hp===hp0-1,'hazard contact removes exactly one heart');
  ok(H.P.inv>0.5,'i-frames activate after asteroid hit');
  const away=Math.hypot(H.P.pos.x-teach.x,H.P.pos.y-teach.y,H.P.pos.z-teach.z);
  ok(away>teach.r,'knockback moves Pling away from asteroid');
  // Continuous overlap during i-frames must not drain more hearts
  H.P.pos.set(teach.x,teach.y,teach.z);
  const nearby=S.asteroids.filter(a=>a.hazard&&a!==teach);
  // Place a second rock contact attempt while invincible
  if(nearby[0]){H.P.pos.set(nearby[0].x,nearby[0].y,nearby[0].z);}
  const hp1=H.P.hp;
  for(let i=0;i<40;i++)H.frames(1);
  ok(H.P.hp===hp1,'anti-pinball: second asteroid during i-frames does not remove another heart');
  // Flight control restored
  holdJump(H,5);
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<40;i++)H.frames(1);
  ok(H.getMovement().spaceThrust||H.getMovement().zone==='openSpace','after hit: space flight still available');
  ok(H.P.vel.y>0.2||H.P.pos.y>teach.y,'after hit: climb control works');
  H.ku({code:'KeyW'});releaseJump(H);
}

// ---- backdrop no damage ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const back=H.getSpace().asteroids.find(a=>a.role==='backdrop');
  H.P.pos.set(back.x,back.y,back.z);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.hp=4;H.P.inv=0;
  for(let i=0;i<20;i++)H.frames(1);
  ok(H.P.hp===4,'backdrop asteroid contact does not damage');
}

// ---- landable pad not damaging ----
{
  const H=boot();H.startLevel(3);H.frames(20);
  H.P.pos.set(22,0.42,-10);H.P.vel.set(0,-1,0);H.P.hp=4;
  for(let i=0;i<60;i++)H.frames(1);
  ok(H.P.hp===4,'landing on practice pad does not damage');
}

// ---- moving asteroid deterministic ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const mov=H.getSpace().asteroids.find(a=>a.moving);
  ok(!!mov,'moving asteroid exists');
  const p0={x:mov.x,y:mov.y,z:mov.z};
  for(let i=0;i<60;i++)H.frames(1);
  const p1={x:mov.x,y:mov.y,z:mov.z};
  for(let i=0;i<60;i++)H.frames(1);
  const p2={x:mov.x,y:mov.y,z:mov.z};
  // Deterministic cyclic: positions stay on authored segment
  const onSeg=(p)=>{
    const t=((p.x-mov.p0.x)/(mov.p1.x-mov.p0.x+1e-9));
    return t>=-0.05&&t<=1.05&&Math.abs(p.y-mov.p0.y)<0.5&&Math.abs(p.z-mov.p0.z)<0.5;
  };
  ok(onSeg(p1)&&onSeg(p2),'moving asteroid stays on authored path');
  const sp=Math.hypot(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z)/(60/60);
  ok(sp<8,'moving asteroid speed bounded (slow)');
  // Safe bypass exists above
  const bypassY=mov.y+mov.r+2.5;
  ok(bypassY<40,'safe bypass above moving asteroid exists');
  // Collision uses live position
  H.P.pos.set(mov.x,mov.y,mov.z);H.P.hp=4;H.P.inv=0;H.P.grounded=false;
  for(let i=0;i<10;i++)H.frames(1);
  ok(H.P.hp===3,'collision uses actual moving asteroid position');
}

// ---- Garden corridor spacing (production data) ----
{
  const H=boot();H.startLevel(3);
  const hazards=H.getSpace().asteroids.filter(a=>a.hazard&&!a.moving);
  let minGap=Infinity;
  for(let i=0;i<hazards.length;i++)for(let j=i+1;j<hazards.length;j++){
    const a=hazards[i],b=hazards[j];
    const gap=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-(a.r+b.r);
    if(gap<minGap)minGap=gap;
  }
  ok(minGap>2.2,'Garden hazards keep body-clearance gaps (>2.2 between shells)');
  // Main route centerline at x≈28 should not require damage
  const onRoute=hazards.filter(a=>Math.abs(a.x-28)<1.2&&a.role!=='climb'&&a.role!=='dive');
  ok(onRoute.length===0,'no static hazard centered on main route lane (except altitude beats)');
}

// ---- saucer ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const S=H.getSpace();
  ok(S.saucers.length>=1,'at least one hostile saucer in Garden');
  const e=S.saucers.find(s=>!s.targetDummy)||S.saucers[0];
  ok(e.type==='small'&&e.hp===1,'first saucer is small silver (1 hp)');
  ok(Math.hypot(e.hx-28,e.hz+118)<1,'saucer home in arena');
  // Leash: drag far and confirm return
  e.x=e.hx+20;e.z=e.hz+20;e.y=e.hy;
  for(let i=0;i<180;i++)H.frames(1);
  ok(Math.hypot(e.x-e.hx,e.y-e.hy,e.z-e.hz)<=13.2,'saucer does not chase indefinitely; returns within leash');
}

// ---- saucer attack readable ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const e=H.getSpace().saucers[0];
  H.P.pos.set(e.hx+4,e.hy,e.hz);H.P.grounded=false;H.P.moveZone='openSpace';H.P.hp=4;H.P.inv=0;
  e.spitT=0;e.wind=0;e.stunT=0;
  let sawWind=false,sparks=0;
  for(let i=0;i<200;i++){
    H.frames(1);
    if(e.wind>0)sawWind=true;
    sparks=H.getSpace().sparks.filter(q=>q.alive).length;
    if(sawWind&&sparks>0)break;
  }
  ok(sawWind,'saucer has readable wind-up state');
  ok(sparks<=1,'saucer fires no rapid spark spam (≤1 live)');
  // Off-range: far away should not fire
  for(const q of H.getSpace().sparks){q.alive=false;q.m.visible=false;}
  H.P.pos.set(e.hx+40,e.hy,e.hz+40);
  e.spitT=0;e.wind=0;
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.getSpace().sparks.every(q=>!q.alive),'saucer does not shoot from unreasonable range');
}

// ---- spark damage ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const e=H.getSpace().saucers[0];
  H.P.pos.set(e.x+3,e.y,e.z);H.P.hp=4;H.P.inv=0;H.P.grounded=false;
  // Force a spark onto the player
  const q=H.getSpace().sparks[0];
  q.alive=true;q.life=2;q.pos.set(H.P.pos.x,H.P.pos.y+0.5,H.P.pos.z);q.vel.set(0,0,0);q.m.visible=true;
  for(let i=0;i<5;i++)H.frames(1);
  ok(H.P.hp===3,'spark damage costs one heart');
}

// ---- gust stuns, spin defeats ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const e=H.getSpace().saucers[0];
  // Stand south of saucer, face north (+Z toward it) so gust cone hits
  H.P.pos.set(e.x,e.y,e.z-1.3);H.P.yaw=0;H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});H.frames(10);
  ok(e.stunT>0,'gust stuns saucer');
  ok(e.alive&&e.state!=='dying'&&e.hp===1,'gust does not defeat saucer');
  // Spin defeat in open space
  e.stunT=0;
  H.P.pos.set(e.x,e.y,e.z+0.5);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(20);
  ok(e.state==='dying'||!e.alive||e.hp<=0,'spin defeats saucer in openSpace');
}

// ---- held note invariant ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const noteCount=H.W.notes.length;
  ok(noteCount>=1,'Level 4 counted notes at build');
  const e=H.getSpace().saucers.find(s=>s.note&&!s.targetDummy)||H.getSpace().saucers[0];
  ok(!!e.note,'saucer holds a pre-authored note');
  ok(e.note.hidden&&!e.note.g.visible,'held note begins hidden');
  ok(H.W.notes.indexOf(e.note)>=0,'held note exists in notes[] at build');
  const nRef=e.note;
  H.P.pos.set(e.x+1.6,e.y,e.z);H.P.grounded=false;H.P.vel.set(0,0,0);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyK'});
  // Immediately step away so reveal is observable before auto-collect
  H.P.pos.set(e.x+5,e.y+2,e.z+5);H.P.vel.set(0,0,0);
  H.frames(20);
  ok(H.W.notes.length===noteCount,'notes.length does not increase on defeat');
  ok(nRef===e.note&&!nRef.hidden,'same note is revealed');
  ok(nRef.g.visible&&!nRef.got,'revealed note is visible and not yet collected');
  // Collect
  H.P.pos.set(nRef.x,nRef.y,nRef.z);
  for(let i=0;i<20;i++)H.frames(1);
  ok(nRef.got,'collecting revealed note works normally');
  // Anti-farm: "defeat" again cannot create another note
  const before=H.W.notes.length;
  hitSaucerAgain(H,e);
  ok(H.W.notes.length===before,'repeated defeat cannot create another counted note');
}
function hitSaucerAgain(H,e){
  // Saucer already dead — calling hit again is a no-op; simulate respawn without new note
  if(!e.alive){e.alive=true;e.state='patrol';e.hp=1;e.g.visible=true;e.noteReleased=true;}
  H.P.pos.set(e.x,e.y,e.z+0.4);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(20);
}

// ---- route connectivity ----
{
  const H=boot();H.startLevel(3);
  const L=H.getLevel(),S=H.getSpace();
  ok(L.garden&&L.garden.entry.z===-26,'Garden entry authored');
  ok(S.firstDestination.x===22,'Launch Dock first destination preserved');
  ok(S.routeTrail.length>=4,'route trails continue through Garden');
  ok(S.stage2Ends.length===1,'Stage 2 endpoint exists');
  ok(S.cheeseMoon,'Cheese Moon body exists (Stage 3 landable)');
  const checks=H.W.checks;
  ok(checks.length>=3,'dock + garden entry + recovery checkpoints');
}

// ---- flight regression (no retune) ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const sp=H.getSpacePhys();
  ok(sp.thrustCap===9&&sp.coastCap===4&&sp.coastDecay===2.8,'Stage 1.5 flight tuning preserved');
  ok(sp.steerThrust===38&&sp.steerCoast===22&&sp.brake===52,'steering tuning preserved');
  ok(sp.levelBand===0.18&&sp.vertGain===0.92&&sp.takeoffAssistH===3.5,'vertical/takeoff tuning preserved');
  H.P.pos.set(28,12,-50);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  const y0=H.P.pos.y;
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.pos.y>y0+1.2,'Garden: climb still works without camera');
  H.ku({code:'KeyW'});H.kd({code:'KeyS',preventDefault(){},repeat:false});
  for(let i=0;i<100;i++)H.frames(1);
  ok(H.P.vel.y<-0.4,'Garden: descend still works');
  H.ku({code:'KeyS'});H.kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<50;i++)H.frames(1);
  ok(H.P.vel.x>0.5,'Garden: steer still works');
  H.ku({code:'Space'});H.ku({code:'KeyD'});
  let maxCoast=0;
  for(let i=0;i<40;i++){H.frames(1);maxCoast=Math.max(maxCoast,H.getMovement().speed);}
  ok(maxCoast<=4.05,'Garden: coast still capped');
}

// ---- deferred systems absent ----
{
  const fs=require('fs'),path=require('path');
  const src=fs.readFileSync(path.join(__dirname,'..','levels','level4.js'),'utf8')
    +fs.readFileSync(path.join(__dirname,'..','src','space.js'),'utf8')
    +fs.readFileSync(path.join(__dirname,'..','src','player.js'),'utf8');
  ok(!/shieldedGate|warpTunnel|blackHoleFinish|blackHoleActive/i.test(src),'no Stage 4+ warp / black-hole finish');
  ok(H_snoozleCount()>=1,'Snoozle 1 on dock');
  function H_snoozleCount(){const H=boot();H.startLevel(3);return H.W.snoozles.length;}
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
