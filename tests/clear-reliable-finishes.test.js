// BH-008: shared finish presentation and Peak's ordinary final approach.
// BELLHOP_HTML may point at an exact-base build for an expected-failure run.
const fs=require('fs'),path=require('path');
const htmlPath=process.env.BELLHOP_HTML||path.join(__dirname,'..','dist','index.html');
const html=fs.readFileSync(htmlPath,'utf8');
let failures=0;
function ok(c,m){if(!c)failures++;console.log((c?'PASS ':'FAIL ')+m);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts={}){return require('./harness.js')({...opts,html});}
function contrast(a,b){
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
  const lum=h=>{const v=rgb(h);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function wake(H,s){
  H.P.inv=99;H.P.dead=false;H.P.lavaRecT=0;
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  H.P.vel.set(0,0,0);H.P.grounded=true;H.P.bonkCD=0;H.frames(2);H.tap('KeyK',2);H.frames(42);
}
function wakeAll(H){for(const s of H.W.snoozles)wake(H,s);}
function place(H,x,y,z){
  H.P.inv=0;H.P.dead=false;H.P.hp=4;H.P.lavaRecT=0;H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);H.P.grounded=true;H.CAM.yaw=0;H.frames(32);
}

// Shared, immediately readable compact surface.
{
  const style=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
  const big=(style.match(/#win \.big\{([^}]*)\}/)||[])[1]||'';
  const card=(style.match(/#win \.finish-card\{([^}]*)\}/)||[])[1]||'';
  ok(/<div id="win" role="status" aria-live="polite"><div class="finish-card"><div class="big">You did it!<\/div>/.test(html),'shared finish title is exact “You did it!” on a semantic compact surface');
  ok(!/CONGRATULATIONS<br>\s*YOU WIN!/.test(html),'legacy two-line victory shout is absent');
  ok(/background:#fff8e6/.test(card)&&/border:3px solid #f5b400/.test(card)&&/border-radius:22px/.test(card),'surface uses established cream and warm-gold restrained treatment');
  ok(/color:#155e64/.test(big)&&!/(?:text-stroke|text-shadow|paint-order)/.test(big),'title is solid teal type without outline or heavy offset shadow');
  ok(/color:#155e64/.test(big)&&/background:#fff8e6/.test(card)&&contrast('#155e64','#fff8e6')>=7,'title/card contrast is at least WCAG AAA for normal text');
  ok(/background:rgba\(11,40,58,\.18\)/.test(style),'scene remains visible through a modest backdrop');
  ok(/animation:finishSettle \.42s/.test(card)&&!/(?:infinite|alternate)/.test(card),'entrance is restrained and non-repeating');
  ok(/prefers-reduced-motion:reduce/.test(style)&&/#win \.finish-card\{animation:none\}/.test(style),'reduced motion removes the entrance animation');
  ok(/env\(safe-area-inset-(?:top|right|bottom|left)\)/.test(style),'finish geometry accounts for safe-area insets');
  ok(/orientation:landscape[^]*max-height:500px[^]*286px/.test(style),'short landscape reserves the ordinary touch-control zone');
}

// Six levels keep their authored identity while sequential loads replace FINISH.
{
  const H=boot({autostart:false});H.startLevel(0);
  const expected=[
    ['level1','Everyone is awake. Look at that rainbow!'],
    ['level2','Everyone is awake. The Conch is singing!'],
    ['level3','The mountain is singing!'],
    ['level4','The stars are singing!'],
    ['level5','You found the green oasis!'],
    ['level6','Winter wonderland saved! Every Snoozle is awake!']
  ];
  let prior=null;
  expected.forEach(([id,msg],i)=>{
    if(i)H.test.loadLevel(i);
    ok(H.getLevel().id===id,`${id} loads in matrix order`);
    ok(H.W.FINISH&&H.W.FINISH.winMsg===msg,`${id} keeps exact finish subtitle`);
    ok(!prior||H.W.FINISH!==prior,`${id} owns a fresh FINISH registration`);
    prior=H.W.FINISH;
  });
}

// Peak: completed prerequisites are a labelled fixture; the final travel is only
// ordinary continuous forward movement from the settled final terrace.
{
  const H=boot({autostart:false});H.startLevel(2);const {P,W}=H,kb=W.organ.trigger;
  const approach=W.solids.find(s=>Math.abs(s.min.x+7)<.01&&Math.abs(s.max.x-7)<.01&&Math.abs(s.min.z+628)<.01&&Math.abs(s.max.z+612)<.01);
  const keyboardDeck=W.solids.find(s=>Math.abs(s.min.x+6)<.01&&Math.abs(s.max.x-6)<.01&&Math.abs(s.min.z+635)<.01&&Math.abs(s.max.z+628)<.01);
  ok(!!approach&&!!keyboardDeck&&Math.abs(approach.min.z-keyboardDeck.max.z)<.001,'final terrace top surface meets the visible keyboard deck without a gap');
  place(H,0,44.4,-608);H.kd({code:'KeyW'});
  for(let i=0;i<190&&P.pos.z>-635;i++)H.frames(1);
  H.ku({code:'KeyW'});
  ok(!W.won,'approaching the keyboard before 4/4 cannot win');
  place(H,0,44.4,-608);const deep=W.lavas.find(l=>l.max.y>20&&l.min.z<-630);
  P.pos.set((deep.min.x+deep.max.x)/2,deep.max.y-.05,(deep.min.z+deep.max.z)/2);H.frames(8);
  ok(P.hp===3&&P.lavaRecT>0&&!W.won,'pre-finish lava/recovery damages normally and cannot cause victory');

  H.window.__softReturnToPicker();H.frames(2);H.startLevel(2);wakeAll(H);
  ok(H.W.organ.active&&!H.W.won,'labelled 4/4 wake fixture activates the Organ without winning');

  place(H,6.35,44.4,-608);H.kd({code:'KeyW'});
  for(let i=0;i<160;i++)H.frames(1);
  H.ku({code:'KeyW'});
  ok(!H.W.won,'nearby space outside the visible keyboard cannot trigger victory');

  place(H,0,44.4,-608);let fanfares=0,minHp=P.hp,dead=false,recovery=false,winFrame=-1;
  W.sfx.fanfare=()=>{fanfares++;};H.kd({code:'KeyW'});
  for(let i=0;i<220&&!W.won;i++){
    H.frames(1);minHp=Math.min(minHp,P.hp);dead=dead||P.dead;recovery=recovery||P.lavaRecT>0;
    if(W.won)winFrame=i+1;
  }
  H.ku({code:'KeyW'});
  ok(W.won&&winFrame>0,'continuous ordinary movement reaches the visible keyboard and wins');
  ok(P.pos.z<=kb.z+kb.hz&&P.pos.z>=kb.z-kb.hz,'victory occurs inside the existing keyboard trigger depth');
  ok(minHp===4&&!dead&&!recovery,'final approach has no lava contact, heart loss, death, or recovery');
  ok(fanfares===1,'Peak finish triggers exactly once');
  H.frames(60);ok(fanfares===1,'settled keyboard overlap cannot retrigger victory');
  ok(H.el('win').style.display==='flex'&&H.el('win').querySelector('.sm').textContent==='The mountain is singing!','Peak victory shows shared surface with Peak subtitle');
  ok(H.CAM.mode==='finish'&&H.W.organ.playing,'authored Peak finish camera and Steam Organ celebration remain active');
  ok(H.window.__setPaused(true)===false&&!H.window.__paused(),'pause cannot cover an active finish');
}

// Generic return lifecycle: keyboard, touch A, standard Gamepad A, auto-return,
// and a subsequent level load all clear the overlay and stale input.
function meadowWin(H){H.startLevel(0);wakeAll(H);ok(H.W.won,'Meadow reaches its authored final-Snoozle win');}
function assertClean(H,label){
  const s=H.window.__INPUT_STATE();
  ok(!H.isStarted()&&!H.W.won&&H.el('win').style.display==='none',`${label} returns to picker and hides finish surface`);
  ok(!s.jump&&!s.jumpHeld&&!s.b&&!s.bHeld&&!s.y&&!s.web&&!s.keysDown.length,`${label} leaves no stale gameplay input`);
}
{
  const H=boot({autostart:false});meadowWin(H);H.frames(220);H.tap('Space',1);H.frames(2);assertClean(H,'keyboard Space');
  H.startLevel(1);ok(H.W.FINISH.winMsg==='Everyone is awake. The Conch is singing!'&&H.el('win').style.display==='none','level switch has correct subtitle and no stale overlay');
}
{
  const H=boot({autostart:false});meadowWin(H);H.frames(220);H.tapBtn('bA');H.frames(2);assertClean(H,'touch A');
}
{
  const H=boot({autostart:false});H.setGamepad(H.mkGamepad(Array(16).fill(false)));meadowWin(H);H.frames(220);H.gamepadTick(Array(16).fill(false));const b=Array(16).fill(false);b[0]=true;H.gamepadTick(b);H.frames(2);assertClean(H,'standard Gamepad A');
}
{
  const H=boot({autostart:false});meadowWin(H);H.frames(1100);assertClean(H,'18-second safety auto-return');
}

report();
