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
function enterPortal(H){
  wakeAll(H);
  const bh=H.getSpace().blackHoleFinish;
  H.P.pos.set(bh.x,bh.y,bh.z);H.P.vel.set(0,0,0);
  H.frames(3);
  return bh;
}
function homeDist(s){
  const hx=s.home&&s.home.x,hz=s.home&&s.home.z;
  if(hx==null||hz==null)return 999;
  return Math.hypot(s.g.position.x-hx,s.g.position.z-hz);
}

// ---- black hole exists and is reachable ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  ok(H.getSpace().blackHole,'black hole landmark exists');
  const bh=H.getSpace().blackHoleFinish;
  ok(!!bh,'black hole finish registered');
  ok(!!bh.voidGroup,'finish void group is constructed at build time');
  ok(bh.voidGroup.visible===false,'finish void hidden before warp');
  ok(bh.voidGroup!==bh.g,'finish void is distinct from approach black hole');
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
  ok(bh.voidGroup&&bh.voidGroup.visible===false,'finish void still hidden at activation');
}

// ---- warp camera ownership through real frame loop ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const bh=enterPortal(H);
  ok(bh.warping,'portal entry begins warp');
  ok(H.CAM.mode==='warp','camera mode is warp immediately after portal entry');
  const midModes=[],midWarpT=[];
  let streakZ0=null,ringZ0=null,planetZ0=null,motionChecked=false;
  for(let i=0;i<220;i++){
    H.frames(1); // full frame: FINISH.update then updateCamera
    if(!bh.warping)break;
    if(bh.warpT>0.8&&bh.warpT<5.5){
      midModes.push(H.CAM.mode);
      midWarpT.push(bh.warpT);
      if(!streakZ0&&bh.warpStreaks&&bh.warpRings&&bh.warpPlanets){
        streakZ0=bh.warpStreaks.map(s=>s.position.z);
        ringZ0=bh.warpRings.map(r=>r.position.z);
        planetZ0=bh.warpPlanets.map(p=>p.position.z);
      }else if(streakZ0&&!motionChecked&&midModes.length>=8){
        motionChecked=true;
        const streakMoved=bh.warpStreaks.some((s,i)=>Math.abs(s.position.z-streakZ0[i])>0.2);
        const ringMoved=bh.warpRings.some((r,i)=>Math.abs(r.position.z-ringZ0[i])>0.2);
        const planetMoved=bh.warpPlanets.some((p,i)=>Math.abs(p.position.z-planetZ0[i])>0.2);
        ok(streakMoved,'warp streak field animates during ride');
        ok(ringMoved,'warp rainbow rings progress during ride');
        ok(planetMoved,'warp celestial objects pass during ride');
      }
    }
  }
  ok(motionChecked,'warp presentation motion was sampled mid-ride');
  ok(midModes.length>=6,'sampled several mid-warp frames');
  ok(midModes.every(m=>m==='warp'),'camera remains warp-owned across mid-warp frames');
  ok(midModes.every(m=>m!=='outdoor'),'outdoor camera does not overwrite warp ownership');
  ok(H.getSpace().isSpaceWarpCamera(),'isSpaceWarpCamera reports active during warp');
  ok(bh.warpStreaks&&bh.warpStreaks.length>=80,'warp contains streak/star field');
  ok(bh.warpRings&&bh.warpRings.length>=8,'warp contains multiple light rings');
  ok(bh.warpPlanets&&bh.warpPlanets.length>=4,'warp contains passing celestial objects');
  ok(bh.warpGroup&&bh.warpGroup.parent,'warp tunnel group is in the scene');
  // Soft recovery must not fire during warp even outside play volume
  const far=H.getSpace().playVolume;
  if(far){H.P.pos.x=far.cx+((far.hard||82)+20);H.frames(5);
    ok(bh.warping&&H.CAM.mode==='warp','warp continues outside play volume without recovery');
  }
}

// ---- entering active portal triggers warp then win exactly once ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const bh=enterPortal(H);
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

// ---- finish void created/shown; distinct from approach; finish camera owns framing ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const bh=enterPortal(H);
  ok(bh.voidGroup&&!bh.voidGroup.visible,'finish void not shown before warp completion');
  ok(!bh.voidActive,'voidActive false during early warp');
  for(let i=0;i<450;i++)H.frames(1);
  ok(H.W.won,'win reached for void checks');
  ok(bh.voidActive,'finish void active after warp');
  ok(bh.voidGroup&&bh.voidGroup.visible,'finish void group shown after warp');
  ok(bh.voidGroup!==bh.g,'finish void remains distinct from approach black hole');
  ok(bh.g&&bh.g.visible===false,'ordinary approach black hole hidden in finish void');
  ok(bh.voidCenter&&Math.hypot(bh.voidCenter.x-bh.x,bh.voidCenter.z-bh.z)>20,'void center is away from approach hole');
  ok(!bh.warping,'warp no longer active after transition');
  ok(H.CAM.mode==='finish','finish camera owns framing after warp');
  ok(H.CAM.mode!=='warp','warp camera no longer owns framing after transition');
  ok(H.CAM.mode!=='outdoor','outdoor camera does not override finish tableau');
  for(let i=0;i<30;i++)H.frames(1);
  ok(H.CAM.mode==='finish','finish camera stays authoritative over celebration frames');
}

// ---- four Snoozles staged in celebratory orbit around Pling ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const homes=H.W.snoozles.map(s=>({x:s.home.x,z:s.home.z,hy:s.home.y}));
  const bh=enterPortal(H);
  for(let i=0;i<450;i++)H.frames(1);
  ok(H.W.won,'win for snoozle tableau');
  ok(H.W.snoozles.length===4,'exactly four Snoozles exist');
  const celeb=H.W.snoozles.filter(s=>s.celebOrbit);
  ok(celeb.length===4,'exactly four celebration Snoozles staged');
  ok(celeb.length===H.W.snoozles.length,'no duplicated Snoozles in tableau');
  const c=bh.voidCenter;
  const pos0=H.W.snoozles.map(s=>({x:s.g.position.x,y:s.g.position.y,z:s.g.position.z}));
  for(const s of H.W.snoozles){
    const dHome=Math.hypot(s.g.position.x-s.home.x,s.g.position.z-s.home.z);
    const dPling=Math.hypot(s.g.position.x-H.P.pos.x,s.g.position.z-H.P.pos.z);
    ok(dHome>8,'celebration Snoozle left normal home position');
    ok(dPling<6,'celebration Snoozle staged near Pling');
    ok(Math.hypot(s.g.position.x-c.x,s.g.position.z-c.z)<5.5,'celebration Snoozle in void tableau radius');
  }
  for(let i=0;i<45;i++)H.frames(1);
  const moved=H.W.snoozles.some((s,i)=>Math.hypot(s.g.position.x-pos0[i].x,s.g.position.z-pos0[i].z)>0.15);
  ok(moved,'celebration Snoozles orbit/bob over time');
  // Angular spacing roughly 90°
  const angs=H.W.snoozles.map(s=>Math.atan2(s.g.position.z-c.z,s.g.position.x-c.x)).sort((a,b)=>a-b);
  let minGap=999;
  for(let i=0;i<angs.length;i++){
    let gap=angs[(i+1)%angs.length]-angs[i];
    if(gap<=0)gap+=Math.PI*2;
    if(gap<minGap)minGap=gap;
  }
  ok(minGap>0.8,'Snoozles remain spaced around Pling');
}

// ---- hazards inert after win; return-to-picker cleanup ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const bh=enterPortal(H);
  H.frames(450);
  ok(H.W.won,'win state for hazard test');
  H.P.hp=4;H.P.inv=0;
  const rock=H.getSpace().asteroids.find(a=>a.hazard);
  if(rock){H.P.pos.set(rock.x,rock.y,rock.z);for(let i=0;i<20;i++)H.frames(1);}
  ok(H.P.hp===4,'hazards cannot damage after win');
  ok(bh.voidGroup&&bh.voidGroup.visible,'void present before return');
  H.window.__returnToLevelSelect();
  ok(!H.isStarted(),'return-to-picker leaves level');
  ok(!H.W.won,'return clears win state');
  ok(!H.getSpace().blackHoleFinish,'return destroys black hole / finish state');
  ok(H.CAM.mode!=='warp'&&H.CAM.mode!=='finish','camera leaves warp/finish modes after return');
}

// ---- clean Level 4 restart ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  enterPortal(H);H.frames(450);
  H.window.__returnToLevelSelect();
  H.startLevel(3);H.frames(10);
  const bh=H.getSpace().blackHoleFinish;
  ok(H.W.snoozles.length===4,'restart Level 4 has four Snoozles');
  ok(!bh.active,'restart resets black hole inactive');
  ok(!bh.warping&&!bh.voidActive,'restart begins without warp/void');
  ok(bh.voidGroup&&bh.voidGroup.visible===false,'restart keeps finish void hidden');
  ok(H.W.snoozles.every(s=>!s.celebOrbit),'restart clears celebration Snoozle state');
  ok(!H.W.won,'restart creates clean run');
  ok(H.CAM.mode!=='warp'&&H.CAM.mode!=='finish','restart camera is ordinary');
}

// ---- Levels 1–3 have no warp/finish artifacts ----
{
  for(const lvl of [0,1,2]){
    const H=boot();H.startLevel(lvl);H.frames(8);
    ok(!H.getSpace().blackHoleFinish,'Level '+(lvl+1)+' has no black hole finish');
    ok(H.CAM.mode!=='warp'&&H.CAM.mode!=='finish','Level '+(lvl+1)+' camera is not warp/finish');
    ok(H.W.snoozles.every(s=>!s.celebOrbit),'Level '+(lvl+1)+' has no celebration orbit flags');
  }
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
  ok(bh.voidActive&&bh.voidGroup.visible,'natural journey lands in finish void');
}

// ---- Level 1 finish unchanged ----
{
  const H=boot({autostart:true,level:0});
  ok(H.W.FINISH.winMsg&&/rainbow/i.test(H.W.FINISH.winMsg),'Level 1 keeps rainbow win subtitle');
}

report();
