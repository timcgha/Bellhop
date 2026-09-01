// Level 4 Stage 1 — space flight framework + Launch Dock prototype.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}

// ---- picker / boot ----
{
  const H=boot();
  ok(!!H.el('lvl3')&&!!H.el('art3'),'fourth picker card exists');
  H.startLevel(3);
  ok(H.getLevel()&&H.getLevel().id==='level4','Level 4 loads from picker index 3');
  ok(H.getLevel().spaceAtmosphere,'Level 4 marks space atmosphere');
  ok(H.getLevel().openSpace&&H.getLevel().openSpace.thrustCap===9,'Level 4 openSpace tuning loaded');
  ok(H.getMovement().zone==='grounded','spawn starts grounded on Launch Dock');
}
{
  const H=boot();
  H.tapCard(3);
  ok(H.pickerIdx()===3&&!H.isStarted(),'touch: first Space tap selects only');
  ok(H.touchArmed(),'touch: Space card armed');
  H.tapCard(3);
  ok(H.isStarted()&&H.getLevel().id==='level4','touch: second Space tap starts Level 4');
}
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1'&&H1.W.checks.length===6,'Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

// ---- hold-A forever (level forward flight, no inevitable climb) ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  H.P.pos.set(0,28,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyD',preventDefault(){},repeat:false});
  holdJump(H,2);
  let maxSp=0,gravFall=false,lostThrust=false,y0=H.P.pos.y;
  for(let i=0;i<900;i++){
    H.frames(1);
    if(Math.hypot(H.P.pos.x,H.P.pos.z)>6){H.P.pos.x=0;H.P.pos.z=0;}
    const m=H.getMovement();
    if(m.zone!=='openSpace'){H.P.pos.set(0,28,0);H.P.grounded=false;continue;}
    if(!m.spaceThrust&&i>5)lostThrust=true;
    maxSp=Math.max(maxSp,m.speed);
    if(H.P.vel.y<-8&&m.zone==='openSpace')gravFall=true;
  }
  const yDrift=H.P.pos.y-y0;
  releaseJump(H);H.ku({code:'KeyD'});
  ok(!lostThrust,'continuous held A keeps openSpace thrust active 15s+');
  ok(!gravFall,'no gravity fall in openSpace while holding A');
  ok(maxSp<=9.08,'thrust speed stays at cap (~9)');
  ok(maxSp>4,'thrust reaches meaningful speed');
  ok(Math.abs(yDrift)<4,'lateral-only thrust does not climb forever over 15s');
}

// ---- release / coast ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  holdJump(H,40);H.ku({code:'KeyW'});releaseJump(H);
  const vy0=H.P.vel.y;
  ok(Math.abs(vy0)>0.1,'release leaves some coast velocity');
  ok(vy0>-0.5,'release does not start gravity fall');
  let maxCoast=0;
  for(let i=0;i<60;i++){H.frames(1);maxCoast=Math.max(maxCoast,H.getMovement().speed);}
  ok(maxCoast<=4.05,'coast velocity bounded (~4 cap)');
  H.kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<40;i++)H.frames(1);
  H.ku({code:'KeyD'});
  ok(Math.abs(H.P.vel.x)>0.05,'move input steers while coasting');
  holdJump(H,5);
  ok(H.getMovement().spaceThrust,'pressing A again resumes thrust immediately');
  releaseJump(H);
}

// ---- steering / correction ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,4,0);H.P.vel.set(0,0,0);H.P.grounded=false;
  holdJump(H,20);
  H.kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<50;i++)H.frames(1);
  ok(H.P.vel.x>1,'lateral steering while thrusting');
  H.ku({code:'KeyD'});
  H.kd({code:'KeyA',preventDefault(){},repeat:false});
  for(let i=0;i<70;i++)H.frames(1);
  ok(H.P.vel.x<1,'opposite steering bleeds velocity');
  releaseJump(H);
}

// ---- ground / space transitions ----
{
  const H=boot();H.startLevel(3);H.frames(20);
  ok(H.P.grounded&&H.getMovement().zone==='grounded','Launch Dock spawn is grounded');
  ok(H.getPhys().grav===-30,'grounded Level 4 uses Level 1 gravity constants');
  holdJump(H,8);
  ok(!H.P.grounded||H.getMovement().zone==='openSpace','leaving dock enters openSpace');
  releaseJump(H);
  H.P.pos.set(22,0.42,-10);H.P.vel.set(0,-1,0);H.P.grounded=false;H.P.moveZone='openSpace';
  for(let i=0;i<180;i++){H.frames(1);if(H.P.grounded)break;}
  ok(H.P.grounded&&H.getMovement().zone==='grounded','practice pad landing restores grounded movement');
  ok(Math.hypot(H.P.vel.x,H.P.vel.z)<2.5,'landing clears excessive horizontal velocity');
  holdJump(H,10);
  ok(H.getMovement().zone==='openSpace','relaunch from pad returns to openSpace');
  releaseJump(H);
}

// ---- play volume / recovery ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  H.P.pos.set(8,10,-4);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  for(let i=0;i<40;i++)H.frames(1);
  ok(H.P.pos.x<70,'normal flight inside soft envelope stays free');
  const hp0=H.P.hp;
  H.P.pos.set(120,20,120);H.P.vel.set(30,20,30);
  for(let i=0;i<5;i++)H.frames(1);
  ok(Math.hypot(H.P.pos.x,H.P.pos.z)<90,'outer escape triggers safe recovery');
  ok(H.P.hp===hp0,'recovery does not cost a heart');
  ok(Math.hypot(H.P.vel.x,H.P.vel.y,H.P.vel.z)<0.5,'recovery clears velocity');
  ok(H.getMovement().zone==='grounded','recovery returns controllable grounded state');
}

// ---- backdrop / landable roles ----
{
  const H=boot();H.startLevel(3);
  const land=H.W.solids.filter(s=>s.role==='landable');
  ok(land.length>=2,'Launch Dock and practice pad registered as landable');
  ok(H.W.solids.every(s=>!s.decor),'solids are not decorative backdrop');
  ok(H.getSpace()&&H.getSpace().blackHole,'black hole landmark exists');
  ok(!H.W.won,'no Stage 1 FINISH win on boot');
  ok(!H.W.gloops.length,'no saucer/gloop enemies in Stage 1');
  ok(!H.W.crates.length,'no Star Beam crates in Stage 1');
}

// ---- deferred systems absent ----
{
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','src','player.js'),'utf8')
    +require('fs').readFileSync(require('path').join(__dirname,'..','src','space.js'),'utf8')
    +require('fs').readFileSync(require('path').join(__dirname,'..','levels','level4.js'),'utf8');
  ok(!/warpTunnel|blackHoleFinish|blackHoleActive|cometRun/i.test(src),'Stage 1 source has no Stage 5+ finish systems');
}

// ---- 3D vertical control (primary movement input, no camera pitch) ----
function fly2s(H, keys, pitch){
  H.P.vel.set(0,0,0);
  if(pitch!=null)H.setCamPitch(pitch);
  else H.setCamPitch(0.42);
  for(const c of keys||['KeyW'])H.kd({code:c,preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  const y0=H.P.pos.y;
  for(let i=0;i<120;i++)H.frames(1);
  const y1=H.P.pos.y,vy1=H.P.vel.y,m=H.getMovement();
  H.ku({code:'Space'});
  for(const c of keys||['KeyW'])H.ku({code:c});
  return {dy:y1-y0,vy:vy1,m};
}
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,20,0);H.P.grounded=false;H.P.moveZone='openSpace';
  const up=fly2s(H,['KeyW']);
  ok(up.dy>1.5,'UP: forward input + A gains altitude without camera pitch');
  ok(up.m.thrustY>0.05,'UP: positive thrustY while climbing');
  H.P.pos.set(0,20,0);
  const lvl=fly2s(H,['KeyD']);
  ok(Math.abs(lvl.dy)<1.2,'LEVEL: lateral-only input stays near altitude');
  ok(Math.abs(lvl.m.thrustY)<0.08,'LEVEL: near-zero vertical thrust component');
  H.P.pos.set(0,20,0);
  const dn=fly2s(H,['KeyS']);
  ok(dn.dy<-1.5,'DOWN: back input + A loses altitude');
  ok(dn.vy<-0.5,'DOWN: negative vertical velocity without gravity');
  ok(dn.m.thrustY<-0.05,'DOWN: negative thrustY while descending');
}

// ---- vertical correction without camera ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,24,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<80;i++)H.frames(1);
  ok(H.P.vel.y>1,'correction: climbing velocity achievable');
  H.ku({code:'KeyW'});
  H.kd({code:'KeyS',preventDefault(){},repeat:false});
  for(let i=0;i<140;i++)H.frames(1);
  ok(H.P.vel.y<-0.5,'correction: climb reversed into descent via back input');
  ok(H.getMovement().speed<=9.08,'correction: velocity stays within thrust cap');
  H.ku({code:'KeyS'});
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<140;i++)H.frames(1);
  ok(H.P.vel.y>0.5,'correction: descent reversed into climb via forward input');
  H.ku({code:'Space'});H.ku({code:'KeyW'});
}

// ---- landing from above ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(22,3.5,-10);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  ok(H.getMovement().zone==='openSpace','landing from above: starts in openSpace above pad');
  H.setTouchStick(0,0.85);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  let landed=false;
  for(let i=0;i<120;i++){
    H.frames(1);
    if(H.P.grounded&&H.getMovement().zone==='grounded'){landed=true;break;}
  }
  H.ku({code:'Space'});H.clearTouchStick();
  ok(landed,'landing from above: reaches practice pad');
  ok(Math.hypot(H.P.pos.x-22,H.P.pos.z+10)<5.5,'landing from above: stays over practice pad');
  ok(H.P.pos.y<1.5,'landing from above: settles on pad surface');
  ok(Math.hypot(H.P.vel.x,H.P.vel.z)<2.5,'landing from above: clears excessive horizontal velocity');
  H.kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<30;i++)H.frames(1);
  ok(landed&&Math.abs(H.P.pos.x-22)>0.15,'landing from above: can walk normally after landing');
  H.ku({code:'KeyD'});
}

// ---- dock takeoff assist ----
{
  const H=boot();H.startLevel(3);H.frames(20);
  ok(H.P.grounded,'takeoff: starts grounded on dock');
  holdJump(H,3);
  for(let i=0;i<60;i++)H.frames(1);
  ok(H.P.pos.y>1.2,'takeoff: hold A alone lifts from Launch Dock');
  ok(H.getMovement().zone==='openSpace','takeoff: enters openSpace');
  releaseJump(H);
}

// ---- touch / phone-size vertical control (no camera input) ----
{
  const H=boot();H.startLevel(3);H.setViewport(844,390);H.frames(6);
  H.P.pos.set(0,18,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.setTouchStick(0,-0.85);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<120;i++)H.frames(1);
  const touchUp=H.P.pos.y;
  H.ku({code:'Space'});H.clearTouchStick();
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);
  H.setTouchStick(0.85,0);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<120;i++)H.frames(1);
  const touchLvl=H.P.pos.y;
  H.ku({code:'Space'});H.clearTouchStick();
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);
  H.setTouchStick(0,0.85);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<120;i++)H.frames(1);
  const touchDn=H.P.pos.y;
  H.ku({code:'Space'});H.clearTouchStick();
  ok(touchUp>19.5,'touch UP: stick forward + A climbs without camera');
  ok(Math.abs(touchLvl-18)<1.2,'touch LEVEL: lateral stick holds altitude');
  ok(touchDn<16.5,'touch DOWN: stick back + A descends without camera');
}

report();
