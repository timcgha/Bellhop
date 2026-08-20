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
  ok(H.W.checks.length===7,'Level 2 has checkpoints through The Wreck midway');
  ok(H.W.snoozles.length===3,'Level 2 has three snoozles through The Wreck');
}

// ---- booting Level 2 does not alter Level 1 physics or expected values ----
{
  const H=boot({autostart:true,level:0});
  const ph=H.getPhys();
  ok(ph.grav===-30&&ph.maxFall===-32&&ph.jumpV===10.5,'Level 1 physics unchanged (grav/maxFall/jumpV)');
  H.P.pos.set(0,0,10);H.P.vel.set(0,0,0);H.frames(10);
  let maxY=0;H.kd({code:'Space',preventDefault(){},repeat:false});
  for(let i=0;i<40;i++){H.frames(1);maxY=Math.max(maxY,H.P.pos.y);}H.ku({code:'Space'});
  ok(maxY>1.5&&maxY<2.2,'Level 1 jump apex still '+maxY.toFixed(2));
}
{
  const H=boot();
  H.startLevel(1);
  const ph2=H.getPhys();
  ok(ph2.grav===-6&&ph2.maxFall===-6&&ph2.jumpV===5.5,'Level 2 uses its own physics profile');
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

// ---- touch picker: tap card selects, A confirms, other buttons do not start ----
{
  const H=boot();
  ok(H.pickerIdx()===0,'touch: default highlight is Level 1');
  H.tapCard(1);
  ok(H.pickerIdx()===1,'touch: tapping Level 2 card selects it');
  ok(!H.isStarted(),'touch: tapping a card does not start the game');
  H.tapBtn('bB');
  ok(!H.isStarted(),'touch: B button does not start the game');
  H.tapBtn('bA');
  ok(H.isStarted(),'touch: A button confirms and starts');
  ok(H.getLevel()&&H.getLevel().id==='level2','touch: confirmed Level 2 boots LEVEL2');
}

// ---- gamepad picker: dpad/stick moves highlight, A confirms, B does not start ----
{
  const H=boot();
  H.setGamepad(H.mkGamepad([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]));
  H.frames(1);
  ok(H.pickerIdx()===0,'gamepad: default highlight is Level 1');
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]);
  ok(H.pickerIdx()===1,'gamepad: dpad right selects Level 2');
  ok(!H.isStarted(),'gamepad: dpad does not start the game');
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]);
  ok(H.pickerIdx()===0,'gamepad: dpad left selects Level 1');
  H.gamepadTick([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]);
  ok(H.pickerIdx()===1,'gamepad: back on Level 2 for confirm test');
  H.gamepadTick([0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  ok(!H.isStarted(),'gamepad: B button does not start the game');
  H.gamepadTick([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  ok(H.isStarted(),'gamepad: A button confirms and starts');
  ok(H.getLevel()&&H.getLevel().id==='level2','gamepad: confirmed Level 2 boots LEVEL2');
}
{
  const H=boot();
  H.setGamepad(H.mkGamepad([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0.7,0,0,0]));
  H.frames(1);
  ok(H.pickerIdx()===1,'gamepad: stick right selects Level 2');
}

// ---- start overlay must not block touch A/B/Y while picker is open ----
{
  const css=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  ok(/#start\{[^}]*pointer-events\s*:\s*none/.test(css),'start overlay ignores pointer events outside the card');
  ok(/#start \.card\{[^}]*pointer-events\s*:\s*auto/.test(css),'start card remains tappable for level selection');
  ok(/\.tbtn\{[^}]*z-index\s*:\s*6/.test(css),'touch buttons stack above the start overlay');
}

report();
