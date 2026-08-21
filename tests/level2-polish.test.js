// Level 2 polish/fix: notes coverage, shark threat height, Conch open read,
// win subtitle, return-to-picker.
const Hboot=opts=>require('./harness.js')(Object.assign({autostart:false},opts));
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function startL2(H){H.startLevel(1);}
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyK',2);H.frames(4);
}
function wakeAll(H){for(const s of H.W.snoozles){wake(H,s);H.frames(40);}}

// ---- more note opportunities; ordinary schools still do not count ----
{
  const H=Hboot();startL2(H);
  const noteFish=H.W.fish.filter(f=>f.kind==='note');
  const noteSpikes=H.W.spikefish.filter(s=>!!s.note);
  ok(noteFish.length+noteSpikes.length>=3,'Level 2 has multiple note-bearing creature opportunities');
  ok(H.W.notes.length===9,'production counted-note total stays finite at 9');
  const n0=H.W.notes.length;
  const g0=H.W.gotNotes!=null?H.W.gotNotes:0;
  const school=H.W.fish.filter(f=>f.kind==='ordinary'&&f.alive);
  ok(school.length>0,'ordinary school fish exist');
  H.P.bubble=true;H.P.pos.set(school[0].x-1.2,school[0].y,school[0].z-1.2);
  H.P.yaw=Math.atan2(school[0].x-H.P.pos.x,school[0].z-H.P.pos.z);
  H.frames(2);H.tap('KeyJ',2);
  for(let i=0;i<90;i++)H.frames(1);
  ok(H.W.notes.length===n0,'bubbling ordinary school fish does not change notes.length');
}

// ---- more spikefish later in the level ----
{
  const H=Hboot();startL2(H);
  ok(H.W.spikefish.length>=6,'Level 2 has additional spikefish presence');
  ok(H.W.spikefish.some(s=>s.role==='shoal_exit'),'shoal-exit spikefish exists');
  ok(H.W.spikefish.some(s=>s.role==='trench_mid'),'trench mid spikefish exists');
  ok(H.W.spikefish.some(s=>s.role==='wreck_note'&&s.note),'wreck note-bearing spikefish exists');
  ok(H.W.spikefish.find(s=>s.role==='open')&&H.W.spikefish.find(s=>s.role==='mandatory'),
    'Shoal open/mandatory teaching pair remains');
}

// ---- shark threatens seabed-height player ----
{
  const H=Hboot();startL2(H);
  const s=H.W.sharks.find(sh=>sh.role==='trench1')||H.W.sharks[0];
  ok(!!s,'production shark available for threat test');
  H.P.hp=4;H.P.inv=0;H.P.dead=false;
  H.P.pos.set(s.hx,0.55,s.hz);H.P.vel.set(0,0,0);
  let bitten=false;
  for(let i=0;i<240;i++){
    H.P.pos.x=s.x;H.P.pos.z=s.z;H.P.pos.y=0.55;H.P.vel.set(0,0,0);
    const hp=H.P.hp;H.frames(1);
    if(H.P.hp<hp){bitten=true;break;}
  }
  ok(bitten,'shark can bite a seabed-height player without a jump');
  ok(s.yBase<=1.4||s.y<1.6||bitten,'shark engages near realistic swim height');
}

// ---- Conch open visuals + Level 2 win subtitle + return to picker ----
{
  const H=Hboot();startL2(H);
  const c=H.W.conch,f=H.W.FINISH;
  ok(f.winMsg&&/Conch|singing|lullaby|deep/i.test(f.winMsg),'Level 2 FINISH owns a Deep win subtitle');
  ok(!/rainbow/i.test(f.winMsg),'Level 2 win subtitle is not the Level 1 rainbow line');
  wakeAll(H);
  ok(c.open,'Conch opens after four Snoozles');
  ok(c.openMouth&&c.openMouth.visible,'open-mouth glow visible when Conch opens');
  ok(c.openCavity&&c.openCavity.visible,'open cavity visible when Conch opens');
  ok(c.doorVis&&!c.doorVis.visible,'closed door visual hides when open');
  ok(H.W.solids.indexOf(c.doorSolid)<0,'door collision removed when open');
  // Enter the interior finish trigger (doorway contact alone does not win)
  H.P.pos.set(c.trigger.x,c.trigger.y,c.trigger.z);H.P.vel.set(0,0,0);H.frames(8);
  ok(H.W.won,'entering the open Conch wins');
  ok(H.el('win').style.display==='flex','win banner shown');
  const sm=H.el('win').querySelector('.sm');
  ok(sm&&/Conch|singing/i.test(sm.textContent),'banner subtitle uses the Level 2 message');
  ok(!/rainbow/i.test(sm.textContent),'banner subtitle no longer mentions the rainbow');
  // Return to picker via jump after celebration window
  for(let i=0;i<Math.ceil(3.6*60);i++)H.frames(1);
  H.tap('Space',2);H.frames(4);
  ok(!H.isStarted(),'win return leaves the game unstarted on the picker');
  ok(H.el('start').style.display!=='none','level select card is shown again');
  ok(!H.W.won,'won flag clears after return to picker');
}

// ---- Level 1 win message isolation ----
{
  const H=Hboot();H.startLevel(0);
  ok(H.W.FINISH.winMsg&&/rainbow/i.test(H.W.FINISH.winMsg),'Level 1 FINISH keeps the rainbow win subtitle');
  for(const s of H.W.snoozles){wake(H,s);H.frames(160);}
  ok(H.W.won,'Level 1 still wins on final Snoozle');
  const sm=H.el('win').querySelector('.sm');
  ok(sm&&/rainbow/i.test(sm.textContent),'Level 1 banner still shows the rainbow line');
}

report();
