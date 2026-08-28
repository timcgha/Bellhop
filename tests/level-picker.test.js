// Stage 1: level framework and start-card level picker.
let failures=0;
function ok(cond,msg){
  if(!cond) failures++;
  console.log((cond?'PASS ':'FAIL ')+msg);
}
function report(){
  if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
  console.log('\nall passed');
}

function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

// ---- selecting Level 1 boots LEVEL1 ----
{
  const H=boot();
  H.startLevel(0);
  ok(H.getLevel()&&H.getLevel().id==='level1','selecting Level 1 boots LEVEL1');
  ok(H.W.checks.length===6,'Level 1 has 6 checkpoints');
  ok(H.W.snoozles.length===4,'Level 1 has 4 snoozles');
}

// ---- selecting Level 2 boots LEVEL2 ----
{
  const H=boot();
  H.startLevel(1);
  ok(H.getLevel()&&H.getLevel().id==='level2','selecting Level 2 boots LEVEL2');
  ok(H.W.checks.length===8,'Level 2 has checkpoints through The Trench');
  ok(H.W.snoozles.length===4,'Level 2 has four snoozles through The Trench');
}

// ---- selecting Level 3 boots LEVEL3 ----
{
  const H=boot();
  H.startLevel(2);
  ok(H.getLevel()&&H.getLevel().id==='level3','selecting Level 3 boots LEVEL3');
  ok(H.W.steamVents.length>=1,'Level 3 prototype has a steam vent');
  ok(H.W.crates.some(c=>c.item==='sky'),'Level 3 prototype has a Sky Blast crate');
}

// ---- Level 3 physics match Level 1; Level 1 and 2 unchanged ----
{
  const H1=boot({autostart:true,level:0});
  const ph1=H1.getPhys();
  ok(ph1.grav===-30&&ph1.maxFall===-32&&ph1.jumpV===10.5&&ph1.puffV===9.4&&ph1.speed===6.8,'Level 1 physics unchanged');
}
{
  const H2=boot();
  H2.startLevel(1);
  const ph2=H2.getPhys();
  ok(ph2.grav===-6&&ph2.maxFall===-6&&ph2.jumpV===5.5,'Level 2 uses its own physics profile');
}
{
  const H3=boot();
  H3.startLevel(2);
  const ph3=H3.getPhys();
  ok(ph3.grav===-30&&ph3.maxFall===-32&&ph3.jumpV===10.5&&ph3.puffV===9.4&&ph3.speed===6.8,'Level 3 baseline equals Level 1 physics');
  const sky=H3.getSky();
  ok(sky.puffVMul===1.4&&sky.boostMax===12.5&&sky.boostDecay===1.6,'Level 3 Sky Blast tuning loaded');
}

// ---- old press-anything start path cannot bypass the level picker ----
{
  const H=boot();
  ok(!H.isStarted(),'game not started before confirm');
  ok(H.W.checks.length===0,'no level loaded before confirm');
  H.kd({code:'KeyW',preventDefault(){},repeat:false});H.frames(5);H.ku({code:'KeyW'});
  ok(!H.isStarted(),'KeyW does not start the game');
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(5);H.ku({code:'KeyJ'});
  ok(!H.isStarted(),'KeyJ does not start the game');
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(5);H.ku({code:'KeyK'});
  ok(!H.isStarted(),'KeyK does not start the game');
  H.selectLevel(1);
  H.kd({code:'KeyW',preventDefault(){},repeat:false});H.frames(5);H.ku({code:'KeyW'});
  ok(!H.isStarted(),'movement key after card select still does not start');
  H.confirmStart();
  ok(H.isStarted(),'Space confirms the highlighted level');
  ok(H.getLevel()&&H.getLevel().id==='level2','confirmed Level 2 card boots LEVEL2');
}

// ---- three cards always present ----
{
  const H=boot();
  ok(!!H.el('lvl0')&&!!H.el('lvl1')&&!!H.el('lvl2')&&!!H.el('lvl3'),'picker has four level cards');
  ok(!!H.el('art0')&&!!H.el('art1')&&!!H.el('art2')&&!!H.el('art3'),'picker has four art canvases');
}

// ---- touch picker: tap card selects, A confirms, other buttons do not start ----
{
  const H=boot();
  ok(H.pickerIdx()===0,'touch: default highlight is Level 1');
  H.tapCard(1);
  ok(H.pickerIdx()===1,'touch: tapping Level 2 card selects it');
  ok(!H.isStarted(),'touch: tapping an unselected card does not start the game');
  H.tapBtn('bB');
  ok(!H.isStarted(),'touch: B button does not start the game');
  H.tapBtn('bA');
  ok(H.isStarted(),'touch: A button confirms and starts');
  ok(H.getLevel()&&H.getLevel().id==='level2','touch: confirmed Level 2 boots LEVEL2');
}

// ---- touch: two physical taps required; default Meadow highlight does not count ----
{
  const H=boot();
  ok(H.pickerIdx()===0,'fresh: default highlight is Level 1');
  ok(!H.touchArmed(),'fresh: default highlight is not touch-armed');
  H.tapCard(0);
  ok(!H.isStarted(),'fresh: first tap on default-highlighted Meadow does NOT start');
  ok(H.pickerIdx()===0&&H.touchArmed(),'fresh: first Meadow tap arms selection only');
  H.tapCard(0);
  ok(H.isStarted(),'fresh: second Meadow tap starts');
  ok(H.getLevel()&&H.getLevel().id==='level1','fresh: Level 1 loads after two Meadow taps');
}
{
  const H=boot();
  H.tapCard(1);
  ok(H.pickerIdx()===1&&!H.isStarted(),'deep: first tap on The Deep selects only');
  ok(H.touchArmed(),'deep: first Deep tap arms it');
  H.tapCard(1);
  ok(H.isStarted(),'deep: second Deep tap starts');
  ok(H.getLevel()&&H.getLevel().id==='level2','deep: Level 2 loads through tap-again flow');
}
{
  const H=boot();
  H.tapCard(2);
  ok(H.pickerIdx()===2&&!H.isStarted(),'peak: first tap on The Peak selects only');
  ok(H.touchArmed(),'peak: first Peak tap arms it');
  H.tapCard(2);
  ok(H.isStarted(),'peak: second Peak tap starts');
  ok(H.getLevel()&&H.getLevel().id==='level3','peak: Level 3 loads through tap-again flow');
}
{
  const H=boot();
  H.tapCard(1);
  ok(H.pickerIdx()===1&&!H.isStarted(),'switch: first tap selects Level 2');
  H.tapCard(0);
  ok(H.pickerIdx()===0&&!H.isStarted(),'switch: tapping the other card changes selection without starting');
  ok(H.touchArmed(),'switch: newly selected card is armed, prior confirm reset');
  H.tapCard(0);
  ok(H.isStarted(),'switch: tapping newly selected Level 1 again starts it');
  ok(H.getLevel()&&H.getLevel().id==='level1','switch: Level 1 loads after re-arming');
}
{
  const H=boot();
  H.tapCard(0);
  ok(!H.isStarted(),'rearm: Meadow armed after first tap');
  H.tapCard(1);
  ok(H.pickerIdx()===1&&!H.isStarted(),'rearm: switching to Deep resets confirm (no start)');
  H.tapCard(1);
  ok(H.isStarted()&&H.getLevel().id==='level2','rearm: Deep needs a fresh second tap to start');
}
{
  const H=boot();
  H.tapCard(2);
  ok(H.touchArmed()&&!H.isStarted(),'peak-switch: Peak armed');
  H.tapCard(1);
  ok(H.pickerIdx()===1&&!H.isStarted()&&H.touchArmed(),'peak-switch: switching to Deep re-arms without starting');
  H.tapCard(1);
  ok(H.isStarted()&&H.getLevel().id==='level2','peak-switch: Deep starts on fresh second tap');
}

// ---- keyboard confirm still works after the touch UX change ----
{
  const H=boot();
  H.selectLevel(1);
  ok(!H.isStarted(),'keyboard: selecting a card alone does not start');
  ok(!H.touchArmed(),'keyboard: arrow/select does not touch-arm');
  H.confirmStart();
  ok(H.isStarted()&&H.getLevel().id==='level2','keyboard: Space still confirms the highlighted level');
}
{
  const H=boot();
  H.selectLevel(2);
  H.confirmStart();
  ok(H.isStarted()&&H.getLevel().id==='level3','keyboard: Space confirms Level 3');
}

// ---- gamepad picker: dpad/stick moves highlight across three cards ----
{
  const H=boot();
  const idle=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  H.setGamepad(H.mkGamepad(idle));
  H.frames(1);
  ok(H.pickerIdx()===0,'gamepad: default highlight is Level 1');
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]);
  ok(H.pickerIdx()===1,'gamepad: dpad right selects Level 2');
  ok(!H.isStarted(),'gamepad: dpad does not start the game');
  H.gamepadTick(idle); // release so the next right press edges again
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]);
  ok(H.pickerIdx()===2,'gamepad: dpad right again selects Level 3');
  H.gamepadTick(idle);
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]);
  ok(H.pickerIdx()===1,'gamepad: dpad left selects Level 2');
  H.gamepadTick(idle);
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]);
  ok(H.pickerIdx()===2,'gamepad: back on Level 3 for confirm test');
  H.gamepadTick(idle);
  H.gamepadTick([0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  ok(!H.isStarted(),'gamepad: B button does not start the game');
  H.gamepadTick(idle);
  H.gamepadTick([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  ok(H.isStarted(),'gamepad: A button confirms and starts');
  ok(H.getLevel()&&H.getLevel().id==='level3','gamepad: confirmed Level 3 boots LEVEL3');
}
{
  const H=boot();
  H.setGamepad(H.mkGamepad([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0.7,0,0,0]));
  H.frames(1);
  ok(H.pickerIdx()===1,'gamepad: stick right selects Level 2');
}

// ---- gamepad: right stick on the picker must not store camera motion ----
{
  const H=boot();
  const idle=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  H.setGamepad(H.mkGamepad(idle,[0,0,1,0.6]));
  H.frames(300);
  ok(!H.isStarted(),'gamepad: stick wiggle on picker does not start the game');
  const yaw0=H.CAM.yaw;
  H.gamepadTick([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0]);
  H.setGamepad(H.mkGamepad(idle,[0,0,0,0]));
  H.frames(3);
  ok(H.isStarted(),'gamepad: A starts after stick wiggle');
  ok(Math.abs(H.CAM.yaw-yaw0)<0.05,`gamepad: no stored camera jump on start (yaw moved ${Math.abs(H.CAM.yaw-yaw0).toFixed(3)})`);
}

// ---- start overlay must not block touch A/B/Y while picker is open ----
{
  const css=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  ok(/#start\{[^}]*pointer-events\s*:\s*none/.test(css),'start overlay ignores pointer events outside the card');
  ok(/#start \.card\{[^}]*pointer-events\s*:\s*auto/.test(css),'start card remains tappable for level selection');
  ok(/\.tbtn\{[^}]*z-index\s*:\s*6/.test(css),'touch buttons stack above the start overlay');
  ok(/lvlPulse/.test(css),'selected level card has a pulse animation for touch feedback');
  ok(/id="lvl2"/.test(css),'Peak card is present in the start overlay');
  ok(/id="lvl3"/.test(css),'Space card is present in the start overlay');
  const hud=require('fs').readFileSync(require('path').join(__dirname,'..','src','hud.js'),'utf8');
  ok(/tap it again to play/.test(hud),'touch pick hint no longer requires pressing A');
  ok(/function tapLevelCard/.test(hud),'level cards use tapLevelCard for select-or-start');
  ok(/space/.test(hud),'picker draws Space card art');
}

report();
