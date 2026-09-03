// Level 4 Stage 1.5 — movement-input flight, landing readability, opening route.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}

// ---- version ----
{
  const H=boot();
  ok(H.getCamDiag().VERSION_BASE==='v50 · Finish void celebration','version stamp v50');
}

// ---- flight without camera input (keyboard) ----
function flyNoCam(H, keys, frames){
  H.P.vel.set(0,0,0);
  for(const c of keys||[])H.kd({code:c,preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  const y0=H.P.pos.y,x0=H.P.pos.x,z0=H.P.pos.z;
  for(let i=0;i<(frames||120);i++)H.frames(1);
  const out={dy:H.P.pos.y-y0,dx:H.P.pos.x-x0,dz:H.P.pos.z-z0,vy:H.P.vel.y,m:H.getMovement()};
  H.ku({code:'Space'});
  for(const c of keys||[])H.ku({code:c});
  return out;
}
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,12,0);H.P.grounded=false;H.P.moveZone='openSpace';
  const pitch0=H.CAM.pitch;
  H.P.pos.set(0,0.45,0);H.P.grounded=true;H.P.moveZone='grounded';
  holdJump(H,5);
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.pos.y>1.2,'takeoff: hold A lifts into openSpace');
  ok(H.getMovement().zone==='openSpace','takeoff: enters openSpace');
  releaseJump(H);
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  const climb=flyNoCam(H,['KeyW']);
  ok(climb.dy>1.5,'no-cam climb: forward + A gains altitude');
  ok(H.CAM.pitch===pitch0,'no-cam climb: camera pitch unchanged');
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);
  const level=flyNoCam(H,['KeyD']);
  ok(Math.abs(level.dy)<1.2,'no-cam level: lateral input stays near altitude');
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);
  const down=flyNoCam(H,['KeyS']);
  ok(down.dy<-1.5,'no-cam descent: back + A loses altitude');
  ok(down.vy<-0.5,'no-cam descent: negative vy quickly');
  H.P.pos.set(0,18,0);H.P.vel.set(0,0,0);
  const steer=flyNoCam(H,['KeyD']);
  ok(Math.abs(steer.dx)>0.5,'no-cam steer: lateral input moves horizontally');
}

// ---- descent strength ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,24,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyS',preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  let vyNeg=false;
  for(let i=0;i<30;i++){H.frames(1);if(H.P.vel.y<-0.3){vyNeg=true;break;}}
  ok(vyNeg,'descent: negative vy within ~0.5s');
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.pos.y<22,'descent: substantial Y loss over 2s');
  ok(H.getPhys().grav===-30,'descent: Level 4 grounded grav unchanged; open space uses thrust not gravity');
  H.ku({code:'Space'});H.ku({code:'KeyS'});
}

// ---- touch descent path ----
{
  const H=boot();H.startLevel(3);H.setViewport(844,390);H.frames(6);
  H.P.pos.set(0,22,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.setTouchStick(0,0.9);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  let vyNeg=false;
  for(let i=0;i<30;i++){H.frames(1);if(H.P.vel.y<-0.3){vyNeg=true;break;}}
  ok(vyNeg,'touch descent: negative vy quickly');
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.P.pos.y<20,'touch descent: substantial Y loss');
  H.ku({code:'Space'});H.clearTouchStick();
}

// ---- neutral A-hold ----
{
  const H=boot();H.startLevel(3);H.frames(20);
  ok(H.P.grounded,'neutral A: starts grounded');
  holdJump(H,3);
  for(let i=0;i<60;i++)H.frames(1);
  ok(H.P.pos.y>1.2,'neutral A: takeoff assist lifts from dock');
  const yAfterTakeoff=H.P.pos.y;
  H.P.pos.set(0,20,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  holdJump(H,2);
  for(let i=0;i<600;i++)H.frames(1);
  ok(H.P.pos.y<23,'neutral A: no indefinite climb at altitude');
  ok(H.getMovement().speed<=9.08,'neutral A: speed bounded');
  releaseJump(H);
}

// ---- coast preserved ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,16,0);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  holdJump(H,40);releaseJump(H);
  ok(H.P.vel.y>-0.5,'coast: no gravity fall on release');
  let maxCoast=0;
  for(let i=0;i<60;i++){H.frames(1);maxCoast=Math.max(maxCoast,H.getMovement().speed);}
  ok(maxCoast<=4.05,'coast: velocity capped');
}

// ---- landable vs backdrop ----
{
  const H=boot();H.startLevel(3);
  const S=H.getSpace();
  ok(S.landingTargets.length>=1,'first destination registered as landing target');
  ok(S.landingTargets.some(t=>t.primary),'primary landing target exists');
  ok(S.landingTargets[0].approachR===18,'landing approach radius 18');
  ok(S.landingTargets[0].nearR===8,'landing near radius 8');
  ok(S.decorPlanets.filter(p=>!p.userData.cheeseMoon&&!p.userData.candyPlanet).every(p=>p.userData.landable===false),'backdrop planets not landable');
  ok(S.blackHole&&S.blackHole.userData.landable===false,'black hole noninteractive');
  ok(!S.landingTargets.some(t=>t.x===8&&t.z===-115),'black hole not a landing target');
}

// ---- opening route cue ----
{
  const H=boot();H.startLevel(3);
  const S=H.getSpace();
  ok(S.firstDestination&&S.firstDestination.x===22,'Launch Dock has designated first destination');
  ok(S.routeTrail.length>=1,'visual route trail exists');
  ok(S.routeTrail[0].points.length>=4,'route trail has star breadcrumbs');
  ok(S.routeBeacons.length>=3,'route buoys/stars present');
  ok(S.landingTargets.some(t=>t.beacon),'first destination has landing beacon');
}

// ---- landing assist ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(22,8,-10);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.setTouchStick(0,0.85);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  let assistSeen=false,landed=false,spNear=99;
  for(let i=0;i<180;i++){
    H.frames(1);
    const near=H.getSpace().nearestLandingTarget(H.P.pos);
    if(near&&near.dist<18){assistSeen=true;spNear=Math.min(spNear,H.getMovement().speed);}
    if(H.P.grounded&&H.getMovement().zone==='grounded'){landed=true;break;}
  }
  const spEnd=H.getMovement().speed;
  H.ku({code:'Space'});H.clearTouchStick();
  ok(assistSeen,'landing assist: enters approach radius');
  ok(landed||spEnd<=spNear+0.5,'landing assist: excess velocity reduces near pad');
  ok(landed,'landing assist: reaches grounded state');
  ok(H.P.pos.y<1.5,'landing assist: settles on surface');
  ok(Math.hypot(H.P.pos.x-22,H.P.pos.z+10)<6,'landing assist: stays near practice pad');
  H.kd({code:'KeyD',preventDefault(){},repeat:false});
  for(let i=0;i<30;i++)H.frames(1);
  ok(Math.abs(H.P.pos.x-22)>0.05,'landing assist: can walk after touchdown');
  H.ku({code:'KeyD'});
  holdJump(H,10);
  ok(H.getMovement().zone==='openSpace','landing assist: relaunch restores openSpace');
  releaseJump(H);
}

// ---- landing assist does not pull from far away ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(28,8,-48);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  const tgt=H.getSpace().landingTargets.find(t=>t.primary)||H.getSpace().landingTargets[0];
  const d0=Math.hypot(H.P.pos.x-tgt.x,H.P.pos.y-tgt.y,H.P.pos.z-tgt.z);
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<60;i++)H.frames(1);
  const d1=Math.hypot(H.P.pos.x-tgt.x,H.P.pos.y-tgt.y,H.P.pos.z-tgt.z);
  H.ku({code:'Space'});
  ok(d1>12,'landing assist: no magnet pull from far away');
}

// ---- vertical reversal time ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  H.P.pos.set(0,20,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.kd({code:'KeyW',preventDefault(){},repeat:false});
  H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<60;i++)H.frames(1);
  H.ku({code:'KeyW'});
  H.kd({code:'KeyS',preventDefault(){},repeat:false});
  let revFrames=-1;
  for(let i=0;i<90;i++){
    H.frames(1);
    if(H.P.vel.y<-0.3){revFrames=i;break;}
  }
  H.ku({code:'Space'});H.ku({code:'KeyS'});
  ok(revFrames>=0&&revFrames<75,'vertical reversal: back input reverses climb within ~1.25s');
}

// ---- tuning unchanged ----
{
  const H=boot();H.startLevel(3);
  const sp=H.getSpacePhys();
  ok(sp.thrustCap===9,'thrustCap preserved');
  ok(sp.coastCap===4,'coastCap preserved');
  ok(sp.coastDecay===2.8,'coastDecay preserved');
  ok(sp.steerThrust===38,'steerThrust preserved');
  ok(sp.steerCoast===22,'steerCoast preserved');
  ok(sp.brake===52,'brake preserved');
}

// ---- Levels 1-3 regression spot checks ----
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1','Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

// ---- no Stage 3+ deferred content ----
{
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','levels','level4.js'),'utf8')
    +require('fs').readFileSync(require('path').join(__dirname,'..','src','space.js'),'utf8');
  ok(!/cometRun/i.test(src),'Stage 1.5 build has no Comet Run');
}

report();
