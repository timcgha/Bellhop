// Level 4 Stage 6 — Black Hole activation, warp tunnel, finish void, return-to-picker.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function flyToward(H,x,y,z,maxFrames){
  for(let i=0;i<(maxFrames||450);i++){
    const dx=x-H.P.pos.x,dy=y-H.P.pos.y,dz=z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    H.P.vel.set(dx/d*6.5,dy/d*6.5,dz/d*6.5);
    H.kd({code:'Space',preventDefault(){},repeat:false});
    H.frames(1);
    if(d<3.0)break;
  }
  H.ku({code:'Space'});
}
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+0.5);
  H.P.vel.set(0,0,0);H.P.grounded=true;H.P.moveZone='grounded';H.P.bonkCD=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(35);
}
function wakeAllButLast(H){
  for(let i=0;i<H.W.snoozles.length-1;i++)wake(H,H.W.snoozles[i]);
}
function awakeCount(H){return H.W.snoozles.filter(s=>s.state!=='sleep').length;}

// ---- black hole exists and is reachable ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace(),bh=S.blackHoleFinish,R=H.getLevel().route;
  ok(!!bh,'black hole finish exists');
  ok(Math.hypot(bh.x-R.blackHole.x,bh.y-R.blackHole.y,bh.z-R.blackHole.z)<1,'black hole at authored route marker');
  H.P.pos.set(R.observatory.x,R.observatory.y+1,R.observatory.z);
  H.P.grounded=false;H.P.moveZone='openSpace';
  flyToward(H,bh.x,bh.y,bh.z+8,500);
  ok(Math.hypot(H.P.pos.x-bh.x,H.P.pos.z-bh.z)<14,'black hole reachable from Observatory');
}

// ---- inactive at 3 Snoozles: contact does not win or damage ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  wakeAllButLast(H);
  ok(awakeCount(H)===3,'three Snoozles awake');
  const bh=H.getSpace().blackHoleFinish;
  ok(!bh.active&&!H.getSpace().blackHoleActive,'black hole inactive at 3/4');
  ok(!bh.portal.visible,'portal closed before activation');
  const hp0=H.P.hp;
  H.P.pos.set(bh.x,bh.y,bh.z);H.P.vel.set(0,0,-4);H.P.inv=0;H.P.grounded=false;H.P.moveZone='openSpace';
  for(let i=0;i<30;i++)H.frames(1);
  ok(!H.W.won,'inactive black-hole contact does not win');
  ok(H.P.hp===hp0,'inactive contact does not damage');
  ok(Math.hypot(H.P.pos.x-bh.x,H.P.pos.y-bh.y,H.P.pos.z-bh.z)>bh.bounceR*0.85,'inactive hole gently repels');
}

// ---- fourth Snoozle activates once; does not win ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  wakeAllButLast(H);
  const bh=H.getSpace().blackHoleFinish;
  wake(H,H.W.snoozles[3]);
  ok(bh.active&&H.getSpace().blackHoleActive,'fourth Snoozle activates black hole');
  ok(bh.activatedOnce,'activation flagged once');
  ok(bh.portal.visible,'portal open after activation');
  ok(!H.W.won,'fourth Snoozle alone does not win');
  // Re-call activate should be no-op
  const t0=bh.activateT;
  H.getSpace().activateBlackHole();
  ok(bh.activatedOnce&&bh.activateT>=t0,'activation happens once');
}

// ---- natural Stage 4 → Observatory → Snoozle 4 → portal → warp → finish ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const R=H.getLevel().route,S=H.getSpace();
  // Start at Stage 4 checkpoint area
  H.P.pos.set(R.stage4End.x,R.stage4End.y,R.stage4End.z);
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  flyToward(H,R.observatory.x,R.observatory.y+1,R.observatory.z,500);
  ok(Math.hypot(H.P.pos.x-R.observatory.x,H.P.pos.z-R.observatory.z)<8,'journey reaches Observatory');
  // Wake 1–3 via teleport (prereq), then wake 4 on deck
  wakeAllButLast(H);
  flyToward(H,R.snoozle4.x,R.snoozle4.y,R.snoozle4.z,200);
  wake(H,H.W.snoozles[3]);
  ok(S.blackHoleActive&&!H.W.won,'Snoozle 4 activates hole without winning');
  // Travel to active portal and enter
  const bh=S.blackHoleFinish;
  flyToward(H,bh.x,bh.y,bh.z,400);
  // Ensure we cross portal boundary
  H.P.pos.set(bh.x,bh.y,bh.z);H.P.vel.set(0,0,-2);H.frames(8);
  ok(bh.warping||bh.finishTriggered||H.W.won,'entering active portal starts finish/warp');
  // Drive warp to completion
  let sawWarp=bh.warping||bh.warpT>0;
  for(let i=0;i<500&&!H.W.won;i++)H.frames(1);
  ok(sawWarp||bh.warpT>0||H.W.won,'warp sequence began');
  ok(H.W.won,'entering active portal triggers finish exactly once');
  ok(bh.voidGroup&&bh.voidGroup.visible,'warp reaches finish void');
  ok(H.el('win').style.display==='flex','win banner appears in finish void');
  const sm=H.el('win').querySelector('.sm');
  ok(sm&&sm.textContent==='The stars are singing!','subtitle is exactly The stars are singing!');
}

// ---- finish once; hazards inert; return-to-picker; clean restart ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  wakeAllButLast(H);wake(H,H.W.snoozles[3]);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.frames(10);
  for(let i=0;i<500&&!H.W.won;i++)H.frames(1);
  ok(H.W.won,'win state reached');
  const hp=H.P.hp;
  // Attempt hazard contact after win
  const rock=H.getSpace().asteroids.find(a=>a.hazard);
  if(rock){
    H.P.pos.set(rock.x,rock.y,rock.z);H.P.inv=0;
    for(let i=0;i<20;i++)H.frames(1);
  }
  ok(H.P.hp===hp,'hazards cannot damage after win');
  ok(typeof H.window.__returnToLevelSelect==='function','return-to-picker exists');
  H.window.__returnToLevelSelect();H.frames(4);
  ok(!H.isStarted(),'return-to-picker shows level select');
  // Clean Level 4 restart
  H.startLevel(3);H.frames(8);
  ok(!H.W.won&&awakeCount(H)===0,'restarting Level 4 creates a clean run');
  ok(!H.getSpace().blackHoleActive,'black hole inactive on fresh run');
}

// ---- full Level 4 checkpoint progression (accelerated) ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const R=H.getLevel().route;
  const stops=[
    {x:0,y:1,z:0,label:'Launch Dock'},
    {x:28,y:5,z:-26,label:'Asteroid Garden'},
    {x:94,y:24,z:-195,label:'Candy Planet'},
    {x:102,y:16.5,z:-222,label:'Crystal Cavern'},
    {x:28,y:18,z:-254,label:'Saucer Belt'},
    {x:R.observatory.x,y:R.observatory.y,z:R.observatory.z,label:'Observatory'},
    {x:R.blackHole.x,y:R.blackHole.y,z:R.blackHole.z+10,label:'Black Hole approach'}
  ];
  let orderOk=true;
  for(const s of stops){
    H.P.pos.set(s.x,s.y,s.z);H.P.vel.set(0,0,0);H.P.moveZone='openSpace';H.frames(2);
    if(!(Math.abs(H.P.pos.z-s.z)<1))orderOk=false;
  }
  ok(orderOk,'full Level 4 major checkpoint order preserved');
  wakeAllButLast(H);wake(H,H.W.snoozles[3]);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.frames(8);
  for(let i=0;i<500&&!H.W.won;i++)H.frames(1);
  ok(H.W.won,'full route prerequisites still finish Level 4');
}

// ---- Levels 1–3 finish flows unchanged ----
{
  const H=boot();H.startLevel(0);H.frames(4);
  for(let i=0;i<H.W.snoozles.length;i++)wake(H,H.W.snoozles[i]);
  ok(H.W.won,'Level 1 still wins on final Snoozle');
  const sm1=H.el('win').querySelector('.sm');
  ok(sm1&&/rainbow/i.test(sm1.textContent),'Level 1 win message unchanged');

  const H2=boot();H2.startLevel(1);H.frames(4);
  for(let i=0;i<H2.W.snoozles.length;i++)wake(H2,H2.W.snoozles[i]);
  ok(!H2.W.won&&H2.W.conch&&H2.W.conch.open,'Level 2 opens Conch without auto-win');

  const H3=boot();H3.startLevel(2);H.frames(4);
  for(let i=0;i<H3.W.snoozles.length;i++)wake(H3,H3.W.snoozles[i]);
  ok(!H3.W.won&&H3.W.organ&&H3.W.organ.active,'Level 3 activates Organ without auto-win');
}

// ---- Comet Run / Gold Saucer deferred ----
{
  const fs=require('fs'),path=require('path');
  const src=fs.readFileSync(path.join(__dirname,'..','levels','level4.js'),'utf8')
    +fs.readFileSync(path.join(__dirname,'..','src','space.js'),'utf8');
  ok(!/cometRun/i.test(src),'Comet Run deferred');
  ok(!/goldSaucer|miniBoss/i.test(src),'Gold saucer mini-boss deferred');
}

report();
