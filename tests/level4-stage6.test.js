// Level 4 Stage 6 — Black hole portal, warp tunnel, finish void, return-to-picker.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function wake(H,sn){H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z+0.6);H.P.grounded=true;H.P.vel.set(0,0,0);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(40);}
function wakeAll(H){for(const s of H.W.snoozles){wake(H,s);H.frames(10);}}
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

// ---- black hole exists and is reachable ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  ok(H.getSpace().blackHole,'black hole landmark exists');
  const bh=H.getSpace().blackHoleFinish;
  ok(!!bh,'black hole finish registered');
  H.P.pos.set(10,24,-276);H.P.vel.set(0,0,0);
  flyToward(H,bh.x,bh.y,bh.z,500);
  ok(Math.hypot(H.P.pos.x-bh.x,H.P.pos.y-bh.y,H.P.pos.z-bh.z)<12,'black hole reachable by flight');
}

// ---- inactive at three Snoozles: no win, gentle bounce ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  for(let i=0;i<3;i++)wake(H,H.W.snoozles[i]);
  const bh=H.getSpace().blackHoleFinish;
  ok(!bh.active,'inactive at three awake Snoozles');
  H.P.pos.set(bh.x,bh.y,bh.z);H.P.vel.set(0,0,0);H.P.hp=4;H.P.inv=0;
  for(let i=0;i<20;i++)H.frames(1);
  ok(!H.W.won,'touching inactive hole does not win');
  ok(H.P.hp===4,'inactive contact does not damage player');
  ok(Math.hypot(H.P.vel.x,H.P.vel.y,H.P.vel.z)>0.01,'inactive hole gently repels');
}

// ---- activation once; portal open; fourth Snoozle does not win ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  wakeAll(H);
  const bh=H.getSpace().blackHoleFinish;
  ok(bh.active&&bh.activated,'portal activates once at four Snoozles');
  ok(bh.portal&&bh.portal.visible,'portal ring visible after activation');
  ok(!H.W.won,'fourth Snoozle alone does not win');
}

// ---- entering active portal triggers warp then win exactly once ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  wakeAll(H);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.P.vel.set(0,0,0);
  H.frames(3);
  ok(bh.warping||bh.finishImmune,'portal entry begins finish sequence');
  for(let i=0;i<450;i++)H.frames(1);
  ok(H.W.won,'warp tunnel reaches win state');
  ok(H.W.FINISH.winMsg==='The stars are singing!','win subtitle exact');
  const sm=H.el('win').querySelector('.sm');
  ok(sm&&sm.textContent==='The stars are singing!','banner subtitle in finish void');
  const w=H.W.won;
  H.frames(60);
  ok(H.W.won===w,'finish triggers exactly once');
}

// ---- hazards inert after win; return-to-picker ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  wakeAll(H);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.frames(450);
  ok(H.W.won,'win state for hazard test');
  H.P.hp=4;H.P.inv=0;
  const rock=H.getSpace().asteroids.find(a=>a.hazard);
  if(rock){H.P.pos.set(rock.x,rock.y,rock.z);for(let i=0;i<20;i++)H.frames(1);}
  ok(H.P.hp===4,'hazards cannot damage after win');
  H.window.__returnToLevelSelect();
  ok(!H.isStarted(),'return-to-picker leaves level');
  ok(!H.W.won,'return clears win state');
}

// ---- clean Level 4 restart ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  wakeAll(H);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.frames(450);
  H.window.__returnToLevelSelect();
  H.startLevel(3);H.frames(10);
  ok(H.W.snoozles.length===4,'restart Level 4 has four Snoozles');
  ok(!H.getSpace().blackHoleFinish.active,'restart resets black hole inactive');
  ok(!H.W.won,'restart creates clean run');
}

// ---- natural journey: Stage 4 endpoint → Observatory → black hole ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const end=H.getSpace().stage4Ends[0];
  for(let i=0;i<3;i++)wake(H,H.W.snoozles[i]);
  H.P.pos.set(end.x,end.y,end.z);H.P.vel.set(0,0,0);H.frames(4);
  flyToward(H,10,24,-272,400);
  ok(Math.hypot(H.P.pos.x-10,H.P.pos.z+272)<12,'journey reaches Observatory');
  const obs=H.W.snoozles[3];
  wake(H,obs);H.frames(40);
  ok(H.getSpace().blackHoleFinish.active,'Snoozle 4 activates portal on journey');
  const bh=H.getSpace().blackHoleFinish;
  flyToward(H,bh.x,bh.y,bh.z,400);
  H.P.pos.set(bh.x,bh.y,bh.z);H.frames(450);
  ok(H.W.won,'natural journey completes via portal');
}

// ---- Level 1 finish unchanged ----
{
  const H=boot({autostart:true,level:0});
  ok(H.W.FINISH.winMsg&&/rainbow/i.test(H.W.FINISH.winMsg),'Level 1 keeps rainbow win subtitle');
}

report();
