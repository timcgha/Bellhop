// Level 6 — Snowbound: winter scene, snowball combat, sled route, reindeer, Snoozles and gated finale.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(){return require('./harness.js')({autostart:false});}
function startWinter(H){H.window.__setPickerIdx(5);H.confirmStart();H.frames(3);}

// ---- picker / startup / authored winter population ----
{
  const H=boot();
  ok(H.window.__LEVELS.length===6&&H.window.__LEVELS[5].id==='level6','Level 6 is registered after Levels 1–5');
  startWinter(H);const W=H.window.__WINTER;
  ok(H.getLevel()&&H.getLevel().id==='level6'&&H.window.__isWinter(),'picker index 5 starts the winter level');
  ok(W.state&&W.state.level.winterAtmosphere,'winter atmosphere state owns Level 6');
  ok(W.snowTrees.length===20&&W.snowTrees.every(t=>t.snowLayers===4),'twenty snow-covered trees build four visible snow layers each');
  ok(W.snowmen.length===4&&W.snowmen.every(e=>e.alive&&e.hp===2),'four functional two-hit snowmen are active');
  ok(W.reindeer.length===6,'ambient reindeer population is present');
  ok(W.reindeer.filter(r=>r.redNosed).length===1,'exactly one ambient reindeer is red-nosed');
  ok(W.tree&&W.tree.lights.length===30&&W.tree.star,'final Christmas tree has lights and a star');
  ok(H.W.snoozles.length===5&&H.window.__snoozleGoal()===5,'five Snoozles define the explicit reachable Level 6 goal');
}

// ---- snowball power uses the normal B/J attack path and is strictly single-shot ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,power=W.state.power;
  H.P.pos.set(power.x,0,power.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(2);
  ok(W.state.snowballUnlocked&&power.got,'snowflake power-up unlocks the Snowball Blaster');
  const e=W.snowmen[0];e.x=e.hx=-5;e.z=e.hz=-66;e.g.position.set(e.x,0,e.z);
  H.P.pos.set(-5,0,-61);H.P.vel.set(0,0,0);H.P.yaw=Math.PI;H.P.grounded=true;H.P.lastGround=99;
  H.tap('KeyJ',1);
  ok(W.snowballs.filter(s=>s.alive).length===1,'B/J fires exactly one visible snowball on the normal attack action');
  const count=W.snowballs.length;ok(!W.fireSnowball()&&W.snowballs.length===count,'a live snowball blocks a second simultaneous projectile');
  const burst0=W.state.bursts;H.frames(22);
  ok(e.hp===1&&e.alive,'first snowball meaningfully damages but does not instantly erase the snowman');
  ok(W.state.bursts>burst0&&W.state.lastBurst,'snowball impact creates a recorded snow burst/explosion');
  H.frames(32);H.tap('KeyJ',1);H.frames(24);
  ok(!e.alive&&e.defeatedBy==='snowball','second legitimate snowball defeats the snowman');
}

// ---- sled is a real mount / downhill / dismount progression beat ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,s=W.sled;
  ok(s&&s.phase==='top'&&Math.abs(s.y-6.95)<0.01&&s.z===-184,'sled starts at the authored hilltop');
  H.P.pos.set(s.x,s.y,s.z+0.7);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('Space',1);H.frames(2);
  ok(H.P.sled===s&&s.mounted&&s.phase==='sliding','A/Space mounts and starts the sled');
  const z0=s.z;H.frames(130);
  ok(s.z<z0-15&&s.progress>0.2&&H.P.sled===s,'mounted sled advances deliberately down the hill');
  H.tap('KeyJ',1);H.frames(2);
  ok(H.P.sled===s&&s.phase==='sliding','B cannot bypass the sled by dismounting mid-run');
  H.frames(390);
  ok(s.phase==='bottom'&&s.completed&&s.z===s.endZ,'sled reaches and records the bottom progression gate');
  H.tap('KeyJ',1);H.frames(2);
  ok(!H.P.sled&&!s.mounted&&H.P.pos.z<s.endZ,'B/J dismounts cleanly only at the bottom');
}

// ---- Christmas-tree finish stays gated until BOTH sled and Snoozle objectives are complete ----
{
  const H=boot();startWinter(H);const W=H.window.__WINTER,s=W.sled,tree=W.tree;
  // Complete the sled through its real lifecycle but leave Snoozles sleeping.
  H.P.pos.set(s.x,s.y,s.z+0.7);H.P.grounded=true;H.P.lastGround=99;H.tap('Space',1);H.frames(500);H.tap('KeyJ',1);H.frames(2);
  ok(s.completed,'final gate records completed sled traversal');
  H.P.pos.set(tree.x,0,tree.z+1);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(3);
  ok(!H.W.won&&!W.winterReady(),'Christmas-tree finish is blocked while Snoozles remain asleep');
  for(const sn of H.W.snoozles){
    H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('KeyK',2);H.frames(38);
  }
  ok(H.W.snoozles.every(sn=>sn.state!=='sleep')&&H.window.__snoozleGoal()===5,'existing Snoozle spin/wake architecture reaches all five');
  ok(W.winterReady(),'all-Snoozles plus sled completion satisfies the winter finish predicate');
  H.P.pos.set(tree.x,0,tree.z+1);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(3);
  ok(H.W.won&&W.state.party&&W.tree.party,'qualified arrival at the Christmas tree triggers normal victory celebration');
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
