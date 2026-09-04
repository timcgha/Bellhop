// Global Pause / Exit Level regression coverage for Levels 1-4.
const fs=require('fs'),path=require('path');
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(opts||{});}

// Escape pauses the frame loop without changing the current level or player state.
{
  const H=boot({level:0});
  H.P.hp=3;H.P.fire=true;H.P.vel.set(4,0,0);
  const before={x:H.P.pos.x,y:H.P.pos.y,z:H.P.pos.z,t:H.window.__gameTime(),zz:H.W.snoozles[0].zz};
  H.kd('Escape');H.frames(40);
  ok(H.window.__paused(),'Escape enters pause during gameplay');
  ok(H.el('pauseMenu').style.display==='flex','pause menu is shown');
  ok(H.isStarted()&&H.getLevel().id==='level1','pause keeps the same level active');
  ok(H.P.pos.x===before.x&&H.P.pos.y===before.y&&H.P.pos.z===before.z,'player movement stops while paused');
  ok(H.window.__gameTime()===before.t,'gameplay time does not advance while paused');
  ok(H.W.snoozles[0].zz===before.zz,'enemy and ambient simulation does not advance while paused');
  ok(H.P.hp===3&&H.P.fire,'pause preserves player progress and powers');

  H.kd('Space');H.frames(3);H.ku('Space');
  ok(!H.window.__inputState().jump&&!H.window.__inputState().jumpHeld,'keyboard gameplay input is blocked behind the pause menu');
  H.kd('Escape');
  ok(!H.window.__paused()&&H.el('pauseMenu').style.display==='none','Escape resumes from pause');
  ok(H.P.pos.x===before.x&&H.P.hp===3&&H.P.fire,'resume does not restart or lose level state');
  H.frames(2);
  ok(H.window.__gameTime()>before.t,'gameplay simulation continues after resume');
  ok(H.P.pos.x!==before.x,'player movement continues from the preserved velocity after resume');
}

// Touch pause blocks gameplay buttons; Resume restores them.
{
  const H=boot({level:0});
  H.P.grounded=true;H.P.vel.set(0,0,0);
  H.tapBtn('pauseBtn');
  ok(H.window.__paused(),'touch pause control enters pause');
  H.tapBtn('bA');H.frames(2);
  ok(H.P.vel.y===0,'touch A cannot trigger gameplay behind the pause overlay');
  ok(!H.window.__inputState().jump&&!H.window.__inputState().jumpHeld,'paused touch action does not remain queued');
  H.tapBtn('resumeLevel');
  ok(!H.window.__paused(),'Resume action closes the pause menu');
  H.tapBtn('bA');H.frames(1);
  ok(H.P.vel.y>0,'existing touch gameplay control works after resume');
}

// Exit Level is non-winning, clears transient state, and supports starting another level.
{
  const H=boot({level:0});
  ok(H.AU().active,'starting gameplay activates level audio scheduling');
  H.AU().layers=3;H.P.fire=true;H.setTouchStick(1,0);
  H.tapBtn('pauseBtn');H.tapBtn('exitLevel');
  ok(!H.isStarted(),'Exit Level returns to the picker');
  ok(!H.window.__paused()&&H.el('pauseMenu').style.display==='none','exit clears the paused state and overlay');
  ok(H.el('start').style.display==='flex','existing level picker is shown after exit');
  ok(!H.W.won&&H.el('win').style.display!=='flex','Exit Level does not mark the level won or show the finish UI');
  ok(H.getLevel()===null,'exit clears the current-level reference');
  ok(H.W.checks.length===0&&H.W.snoozles.length===0,'exit clears loaded level entities');
  ok(H.AU().layers===0&&!H.AU().win&&!H.AU().active,'exit clears level-owned audio state and scheduling');
  ok(!H.window.__inputState().touchStick&&!H.window.__inputState().jumpHeld&&!H.window.__inputState().bHeld,'exit clears held gameplay input');
  ok(!H.P.fire&&!H.P.bubble&&!H.P.hasSkyBlast&&!H.P.hasStarBeam,'exit clears level power state');
  H.startLevel(1);H.frames(2);
  ok(H.isStarted()&&H.getLevel().id==='level2','another level starts normally after Exit Level');
  ok(H.AU().active,'starting another level reactivates audio scheduling');
  ok(H.W.checks.length===8&&H.W.snoozles.length===4,'the next level loads its normal world state');
}

// The global pause lifecycle works in each shipped level without changing its identity.
['level1','level2','level3','level4'].forEach((id,i)=>{
  const H=boot({level:i});
  const t=H.window.__gameTime();
  H.tapBtn('pauseBtn');H.frames(8);
  ok(H.window.__paused()&&H.getLevel().id===id,`${id}: touch pause enters without unloading the level`);
  ok(H.window.__gameTime()===t,`${id}: simulation is frozen while paused`);
  H.tapBtn('resumeLevel');H.frames(2);
  ok(!H.window.__paused()&&H.isStarted()&&H.getLevel().id===id,`${id}: touch Resume restores gameplay`);
  H.tapBtn('pauseBtn');H.tapBtn('exitLevel');
  ok(!H.isStarted()&&!H.W.won&&H.getLevel()===null,`${id}: touch Exit Level returns without a win`);
});

// Level 4 moving hazards are also covered by the single frame-level pause gate.
{
  const H=boot({level:3});
  const moving=H.W.asteroids.find(a=>a.moving);
  ok(!!moving,'Level 4 has a moving hazard for the pause regression');
  const phase=moving.phase;
  H.window.__pauseGame();H.frames(60);
  ok(moving.phase===phase,'Level 4 moving hazard stops while paused');
  H.window.__resumeGame();H.frames(2);
  ok(moving.phase!==phase,'Level 4 moving hazard resumes afterward');
}

// Static UI contract: phone-safe pause button and an input-blocking modal layer.
{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  ok(/id="pauseBtn"[^>]*aria-label="Pause"/.test(html),'pause control has an accessible name');
  ok(/body\.touch\.playing #pauseBtn\{[^}]*display:flex/.test(html),'pause control is exposed during touch gameplay');
  ok(/body\.paused #pauseBtn,body\.paused \.tbtn,body\.finished #pauseBtn\{[^}]*display:none!important/.test(html),'gameplay controls are hidden while paused and pause is hidden after a win');
  ok(/#pauseMenu\{[^}]*z-index:10/.test(html),'pause overlay stacks above gameplay controls');
  ok(/id="resumeLevel"[^>]*>Resume<\/button>/.test(html),'pause menu provides explicit Resume action');
  ok(/id="exitLevel"[^>]*>Exit Level<\/button>/.test(html),'pause menu provides explicit Exit Level action');
  ok(/env\(safe-area-inset-top\)/.test(html)&&/env\(safe-area-inset-right\)/.test(html),'pause UI accounts for phone safe areas');
}

report();
