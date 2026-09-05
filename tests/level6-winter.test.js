// Level 6 — Snowbound: winter scene, post-playtest combat/cadence/sled polish, Snoozles and gated finale.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(){return require('./harness.js')({autostart:false});}
function startWinter(H){H.window.__setPickerIdx(5);H.confirmStart();H.frames(3);}
function getPower(H){const W=H.window.__WINTER,p=W.state.power;H.P.pos.set(p.x,0,p.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(2);return W;}
function wakeAll(H){for(const sn of H.W.snoozles){H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('KeyK',2);H.frames(38);}}
function completeSled(H,W){const s=W.sled;H.P.pos.set(s.x,s.y,s.z+0.7);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('Space',1);H.frames(500);H.tap('KeyJ',1);H.frames(2);return s;}

// ---- picker / startup / authored winter population + polished finale ----
{
  const H=boot();
  ok(H.window.__LEVELS.length===6&&H.window.__LEVELS[5].id==='level6','Level 6 is registered after Levels 1–5');
  startWinter(H);const W=H.window.__WINTER;
  ok(H.getLevel()&&H.getLevel().id==='level6'&&H.window.__isWinter(),'picker index 5 starts the winter level');
  ok(W.state&&W.state.level.winterAtmosphere,'winter atmosphere state owns Level 6');
  ok(W.snowTrees.length===20&&W.snowTrees.every(t=>t.snowLayers===4),'twenty snow-covered trees build four visible snow layers each');
  ok(W.snowmen.length===4&&W.snowmen.every(e=>e.alive&&e.hp===2),'four functional two-hit snowmen are active');
  ok(W.reindeer.length===6&&W.reindeer.filter(r=>r.redNosed).length===1,'six reindeer include exactly one red-nosed reindeer');
  ok(H.W.snoozles.length===5&&H.window.__snoozleGoal()===5,'five Snoozles define the explicit reachable Level 6 goal');
  ok(W.tree&&W.tree.star,'final Christmas tree retains its visible star');
  ok(W.tree.lights.length>=42&&W.tree.brightLights&&W.tree.lightRadius>=0.16,'tree lights have materially stronger bright visual treatment');
  ok(W.tree.ornaments.length>=20&&W.tree.garlands.length>=3,'tree carries additional festive ornaments and garland');
  ok(W.tree.presents.length>=6,'multiple wrapped presents are placed under the Christmas tree');
}

// ---- snowmen chase materially faster while remaining much slower than Pling ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,e=W.snowmen[0];
  e.x=e.hx=0;e.z=e.hz=-20;e.g.position.set(0,0,-20);H.P.pos.set(0,0,-13);H.P.vel.set(0,0,0);H.P.grounded=true;
  const z0=e.z;H.frames(60);
  ok(W.chaseSpeed>=2.0&&W.chaseSpeed<6.8,'snowman pursuit tuning is materially faster than the prior 0.75 speed but remains escapable');
  ok(e.z-z0>1.8&&e.chasing,'snowman visibly closes distance under active pursuit');
}

// ---- snowball power uses a one-second cooldown and allows overlapping live shots ----
{
  const H=boot();startWinter(H);const W=getPower(H);
  ok(W.state.snowballUnlocked&&W.state.power.got,'snowflake power-up unlocks the Snowball Blaster');
  H.P.pos.set(0,0,0);H.P.vel.set(0,0,0);H.P.yaw=0;H.P.grounded=true;H.P.lastGround=99;
  H.tap('KeyJ',1);
  ok(W.snowballs.filter(s=>s.alive).length===1,'first B/J attack fires a visible snowball');
  const firstCount=W.snowballs.length;H.frames(28);
  ok(!W.fireSnowball()&&W.snowballs.length===firstCount&&W.cooldownRemaining()>0,'second shot before the one-second cooldown is blocked');
  H.frames(33);
  ok(W.snowballs[0].alive,'first snowball can remain alive through the cooldown window');
  ok(W.fireSnowball(),'shot after approximately one second is allowed');
  ok(W.snowballs.filter(s=>s.alive).length>=2,'second live snowball may coexist with the first');
  const burst0=W.state.bursts;H.frames(140);
  ok(W.state.bursts>burst0&&W.state.lastBurst,'individual snowballs still produce snow burst/explosion cleanup');
}

// ---- snowballs still damage/defeat snowmen ----
{
  const H=boot();startWinter(H);const W=getPower(H),e=W.snowmen[0];
  e.x=e.hx=0;e.z=e.hz=-12;e.g.position.set(0,0,-12);e.hurtT=0;
  H.P.pos.set(0,0,-7);H.P.vel.set(0,0,0);H.P.yaw=Math.PI;H.P.grounded=true;H.P.lastGround=99;
  H.tap('KeyJ',1);H.frames(24);
  ok(e.hp===1&&e.alive&&e.lastHitBy==='snowball','first legitimate snowball removes one snowman HP');
  H.frames(61);H.tap('KeyJ',1);H.frames(24);
  ok(!e.alive&&e.defeatedBy==='snowball','second legitimate snowball still defeats the two-hit snowman');
}

// ---- normal Y/K spin damages once per legitimate spin and can defeat snowmen ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,e=W.snowmen[0];
  e.x=e.hx=0;e.z=e.hz=-12;e.g.position.set(0,0,-12);H.P.pos.set(0,0,-10.15);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;
  H.kd('KeyK');H.frames(1);H.frames(18);
  ok(e.hp===1&&e.alive&&e.lastHitBy==='spin','genuine Y/K spin contact removes one snowman HP');
  ok(e.hp===1,'one continuous spin input does not deal frame-by-frame repeated damage');
  H.ku('KeyK');H.frames(20);H.tap('KeyK',1);H.frames(2);
  ok(!e.alive&&e.defeatedBy==='spin','a later legitimate spin can finish the two-hit snowman');
}

// ---- sled remains a real timed ride and now supports bounded left/right steering ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,s=W.sled;
  ok(s&&s.phase==='top'&&Math.abs(s.y-6.95)<0.01&&s.z===-184,'sled starts at the authored hilltop');
  H.P.pos.set(s.x,s.y,s.z+0.7);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('Space',1);H.frames(2);
  ok(H.P.sled===s&&s.mounted&&s.phase==='sliding','A/Space mounts and starts the sled');
  const z0=s.z;H.frames(25);ok(s.z<z0&&s.progress>0&&H.P.sled===s,'neutral sled ride still advances down the hill');
  const x0=s.x;H.kd('KeyA');H.frames(45);H.ku('KeyA');const xL=s.x;
  ok(xL<x0-0.35,'normal left movement input steers the live sled left');
  H.kd('KeyD');H.frames(85);H.ku('KeyD');const xR=s.x;
  ok(xR>xL+0.7,'normal right movement input steers the live sled right');
  H.kd('KeyD');H.frames(110);H.ku('KeyD');
  ok(Math.abs(s.x)<=s.steerLimit+0.001&&s.steerLimit===W.sledSteerLimit(),'repeated steering remains constrained inside authored slope bounds');
  H.tap('KeyJ',1);H.frames(2);
  ok(H.P.sled===s&&s.phase==='sliding','B cannot bypass the sled by dismounting mid-run');
  H.frames(260);
  ok(s.phase==='bottom'&&s.completed&&s.z===s.endZ,'steerable sled still reaches and records the bottom progression gate');
  H.tap('KeyJ',1);H.frames(2);
  ok(!H.P.sled&&!s.mounted&&H.P.pos.z<s.endZ,'B/J dismounts cleanly only at the bottom');
}

// ---- finale requires all Snoozles even after the sled is complete ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,tree=W.tree,s=completeSled(H,W);
  ok(s.completed,'final gate records completed sled traversal');
  H.P.pos.set(tree.x,0,tree.z+1);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(3);
  ok(!H.W.won&&!W.winterReady(),'Christmas-tree finish is blocked while Snoozles remain asleep');
}

// ---- finale also requires the sled even when all five Snoozles are awake ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,tree=W.tree;wakeAll(H);
  ok(H.W.snoozles.every(sn=>sn.state!=='sleep'),'normal Snoozle spin/wake architecture reaches all five');
  ok(!W.sled.completed&&!W.winterReady(),'5/5 Snoozles alone cannot bypass the required sled completion');
  H.P.pos.set(tree.x,0,tree.z+1);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(3);
  ok(!H.W.won,'Christmas tree does not win before the sled has been completed');
}

// ---- completing both objectives still produces normal victory, cleanup and restart ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,tree=W.tree;completeSled(H,W);wakeAll(H);
  ok(W.winterReady(),'all-Snoozles plus sled completion satisfies the winter finish predicate');
  H.P.pos.set(tree.x,0,tree.z+1);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(3);
  ok(H.W.won&&W.state.party&&W.tree.party,'qualified arrival at the decorated Christmas tree triggers normal victory');
  H.window.__returnToLevelSelect();
  ok(!H.isStarted()&&!H.window.__WINTER.state&&!H.window.__WINTER.snowmen.length&&!H.window.__WINTER.reindeer.length,'return to picker clears all winter runtime state');
  H.window.__setPickerIdx(5);H.confirmStart();H.frames(3);
  ok(H.isStarted()&&H.getLevel().id==='level6'&&H.window.__WINTER.sled.phase==='top','Level 6 restarts cleanly from a fresh sled/Snoozle state');
}

// ---- prior level selection remains intact ----
{
  const H=boot();H.startLevel(0);H.frames(3);
  ok(H.getLevel().id==='level1'&&!H.window.__isWinter(),'Level 1 remains unchanged/selectable with no winter state');
}

report();
