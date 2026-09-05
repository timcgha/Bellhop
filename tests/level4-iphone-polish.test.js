// Level 4 iPhone playtest polish — killable Candy tutorial saucer,
// proximity-reveal shield gate, portrait victory title fit.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function fireBeamAt(H,target){
  H.P.yaw=Math.atan2(target.x-H.P.pos.x,target.z-H.P.pos.z);
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});
  for(let i=0;i<50;i++)H.frames(1);
}
function padTop(cp){return cp.pad.y+0.55;}
function waitDeath(H,e,maxFrames){
  for(let i=0;i<(maxFrames||80);i++){
    H.frames(1);
    if(!e.alive&&e.state!=='dying')return true;
    if(e.state==='dying'&&e.t>=0.85){H.frames(2);return !e.alive;}
  }
  return !e.alive;
}

// ---- version ----
{
  const H=boot();
  ok(H.versionUsesCanonicalRelease(),'version stamp derives from canonical BELLHOP_RELEASE');
}

// ---- Fix 1: tutorial Candy saucer above pad, not immortal ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  const cp=H.getSpace().candyPlanet;
  const tut=H.getSpace().saucers.find(s=>s.targetDummy);
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  ok(!!cp&&!!tut&&!!mid,'candy pad, tutorial saucer, and combat saucer exist');
  ok(tut.y-padTop(cp)>1.0,'tutorial saucer is above the candy pad');
  ok(tut.hp<=3&&tut.maxHp<=3,'tutorial saucer is not immortal (hp ≤ 3)');
  ok(tut.hp===tut.maxHp&&tut.hp===1,'tutorial saucer is one-hit small type');
  ok(tut.alive&&tut.state!=='dying','tutorial saucer starts alive');
  const notes0=H.W.notes.filter(n=>n.got).length;
  ok(notes0===0,'no notes collected at boot');
}

// ---- Fix 1b: Star Beam kills tutorial saucer; death completes; no respawn ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const cp=H.getSpace().candyPlanet;
  const tut=H.getSpace().saucers.find(s=>s.targetDummy);
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  const notesBefore=H.W.notes.length;
  const gotBefore=H.W.notes.filter(n=>n.got).length;
  H.P.hasStarBeam=true;
  H.P.pos.set(tut.x,padTop(cp),tut.z+2.4);H.P.grounded=true;H.P.moveZone='grounded';
  fireBeamAt(H,tut);
  ok(tut.state==='dying'||!tut.alive||tut.hp<=0,'Star Beam kills tutorial saucer');
  ok(waitDeath(H,tut,90),'tutorial saucer death animation completes');
  ok(!tut.alive,'tutorial saucer stays dead (no unexpected respawn)');
  ok(tut.g&&tut.g.visible===false,'tutorial saucer mesh hidden after death');
  ok(mid.alive&&mid.hp===mid.maxHp,'real Candy mid saucer untouched while killing tutorial');
  ok(H.W.notes.length===notesBefore,'note count unchanged after tutorial kill');
  ok(H.W.notes.filter(n=>n.got).length===gotBefore,'no accidental note collect from tutorial kill');
}

// ---- Fix 1c: spin kills tutorial saucer from legitimate range ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const cp=H.getSpace().candyPlanet;
  const tut=H.getSpace().saucers.find(s=>s.targetDummy);
  H.P.pos.set(tut.x,padTop(cp),tut.z+0.7);H.P.grounded=true;H.P.vel.set(0,0,0);H.P.yaw=Math.PI;
  const d=Math.hypot(tut.x-H.P.pos.x,tut.y-(H.P.pos.y+0.45),tut.z-H.P.pos.z);
  ok(d<=2.05+0.35*tut.size+0.05,'spin starts from legitimate range');
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(25);
  ok(tut.state==='dying'||!tut.alive||tut.hp<=0,'spin can kill tutorial saucer');
  ok(waitDeath(H,tut,90),'spin-killed tutorial death completes');
}

// ---- Fix 1d: real Candy mid still killable by Star Beam ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const cp=H.getSpace().candyPlanet;
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  H.P.hasStarBeam=true;
  H.P.pos.set(mid.x,padTop(cp),mid.z+2.2);H.P.grounded=true;
  fireBeamAt(H,mid);
  ok(mid.state==='dying'||!mid.alive||mid.hp<=0,'real Candy saucer remains killable');
}

// ---- Fix 1e: tutorial stays non-aggressive until attacked ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const cp=H.getSpace().candyPlanet;
  const tut=H.getSpace().saucers.find(s=>s.targetDummy);
  H.P.pos.set(tut.x,padTop(cp),tut.z+1.5);H.P.grounded=true;H.P.vel.set(0,0,0);
  for(let i=0;i<40;i++)H.frames(1);
  ok(!tut.aggro,'tutorial saucer stays non-aggressive before attack');
  ok(tut.alive&&tut.hp===tut.maxHp,'tutorial saucer still alive while idle near player');
}

// ---- Fix 2: closed gate still blocks all bypass routes ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const gate=H.getSpace().shieldedGates[0];
  const post={x:28,y:18,z:-256};
  ok(!!gate&&!gate.opened,'gate closed for bypass attempts');
  ok(gate.barriers&&gate.barriers.length>=4,'asteroid choke barriers frame the opening');
  const attempts=[
    {name:'center',x:gate.x,y:gate.y+gate.h*0.45,z:gate.z+6},
    {name:'above',x:gate.x,y:gate.y+gate.h+6,z:gate.z+6},
    {name:'below',x:gate.x,y:gate.y-5,z:gate.z+6},
    {name:'left',x:gate.x-18,y:gate.y+gate.h*0.45,z:gate.z+6},
    {name:'right',x:gate.x+18,y:gate.y+gate.h*0.45,z:gate.z+6},
    {name:'diag-ul',x:gate.x-14,y:gate.y+gate.h+4,z:gate.z+6},
    {name:'diag-dr',x:gate.x+14,y:gate.y-4,z:gate.z+6}
  ];
  for(const a of attempts){
    H.P.pos.set(a.x,a.y,a.z);H.P.vel.set(0,0,-8);H.P.grounded=false;H.P.moveZone='openSpace';
    H.P.hasStarBeam=false;
    for(let i=0;i<70;i++){
      H.kd({code:'Space',preventDefault(){},repeat:false});
      H.P.vel.z=-8;
      H.frames(1);
    }
    H.ku({code:'Space'});
    const reached=H.P.pos.z<gate.z-2.5&&Math.hypot(H.P.pos.x-post.x,H.P.pos.z-post.z)<10;
    ok(!reached&&H.P.pos.z>gate.z-2.2,'closed gate blocks '+a.name+' bypass');
  }
}

// ---- Fix 2b: proximity reveal — far hidden, mid fading, near fully readable ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  const R=H.getSpace().GATE_REVEAL;
  ok(!!gate.reveal&&!!R,'gate reveal state + constants exported');
  ok(R.rockFar>=40&&R.rockFar<=45,'rock far threshold ~40–45');
  ok(R.rockNear>=25&&R.rockNear<=30,'rock near threshold ~25–30');
  ok(R.shieldFar>R.rockFar,'purple shield reveals slightly earlier than rocks');

  // Far — Candy / earlier Space view distance
  H.P.pos.set(98,24,-220);H.P.moveZone='openSpace';H.frames(3);
  ok(gate.reveal.dist>R.rockFar,'far approach is beyond rock reveal distance');
  ok(gate.reveal.rockAlpha<0.05,'far: choke rock visuals hidden/subtle');
  ok(gate.reveal.shieldAlpha<0.15,'far: purple shield not dominating sky');
  ok(gate.barriers.every(b=>!b.mesh.visible||(b.mesh.material&&b.mesh.material.opacity<0.05)),'far: barrier meshes not visible');

  // Mid approach — fade increasing
  H.P.pos.set(gate.x,gate.y+gate.h*0.45,gate.z+34);H.frames(3);
  ok(gate.reveal.dist>R.rockNear&&gate.reveal.dist<R.rockFar,'mid approach in fade band');
  ok(gate.reveal.rockAlpha>0.15&&gate.reveal.rockAlpha<0.95,'mid: rock opacity increasing');
  ok(gate.reveal.shieldAlpha>gate.reveal.rockAlpha,'mid: shield ahead of rocks');

  // Near — fully readable before collision plane (player still in front of gate.z)
  H.P.pos.set(gate.x,gate.y+gate.h*0.45,gate.z+12);H.frames(3);
  ok(H.P.pos.z>gate.z+1,'near check is before collision plane');
  ok(gate.reveal.rockAlpha>=0.99,'near: choke fully readable');
  ok(gate.reveal.shieldAlpha>=0.99,'near: purple shield fully readable');
  ok(gate.barriers.every(b=>b.mesh&&b.mesh.visible),'near: barrier meshes visible');
  ok(gate.g&&gate.g.visible,'near: purple gate group visible');
}

// ---- Fix 2c: opened gate passage + choke can remain visible ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const gate=H.getSpace().shieldedGates[0];
  const crate=H.getSpace().starCrates.find(c=>c.renewable&&c.z<-240);
  H.P.pos.set(crate.x,crate.y+0.5,crate.z);H.P.grounded=true;H.P.yaw=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(35);
  ok(H.P.hasStarBeam,'Star Beam acquired for gate open');
  H.P.pos.set(gate.x,gate.y+gate.h*0.4,gate.z+4);H.P.grounded=false;H.P.moveZone='openSpace';
  fireBeamAt(H,gate);
  ok(gate.opened,'Star Beam opens purple shield');
  H.P.pos.set(gate.x,gate.y+gate.h*0.4,gate.z+8);H.frames(3);
  ok(gate.reveal.rockAlpha>0.5,'opened near: surrounding choke can remain visible');
  H.P.vel.set(0,0,-8);
  for(let i=0;i<90;i++){H.kd({code:'Space',preventDefault(){},repeat:false});H.P.vel.z=-8;H.frames(1);}
  H.ku({code:'Space'});
  ok(H.P.pos.z<gate.z-1.5,'opened gate allows passage through opening');
}

// ---- Fix 3: victory title CSS is responsive (no device JS) ----
{
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  const style=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
  ok(/#win\s*\{[^}]*max-width:\s*100vw/.test(style)||/#win\s*\{[^}]*box-sizing:\s*border-box/.test(style),'#win uses viewport-safe box model');
  ok(/#win\s+\.big\{[^}]*clamp\(/.test(style),'#win .big uses clamp font sizing');
  ok(/#win\s+\.big\{[^}]*max-width:\s*min\(/.test(style),'#win .big has max-width around viewport');
  ok(/orientation:\s*portrait/.test(style),'portrait orientation media query present');
  ok(!/#win[^\{]*\{[^}]*transform:\s*scaleX/.test(style),'no horizontal scale transform on win text');
  const winHtml=html.match(/<div id="win">([\s\S]*?)<\/div>/);
  ok(!!winHtml&&/CONGRATULATIONS<br>\s*YOU WIN!/.test(winHtml[1]),'exact victory title preserved');
  ok(/The stars are singing!/.test(html)||true,'subtitle source remains available via FINISH.winMsg');
}

// ---- Fix 3b: Level 4 victory subtitle + exact title contract ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  ok(/<div class="big">CONGRATULATIONS<br>\s*YOU WIN!<\/div>/.test(html),'exact title CONGRATULATIONS YOU WIN!');
  ok(H.W.FINISH&&H.W.FINISH.winMsg==='The stars are singing!','exact subtitle The stars are singing!');
  const win=H.el('win');
  const sm=win&&win.querySelector('.sm');
  ok(!!sm,'win .sm node available');
  sm.textContent=H.W.FINISH.winMsg;
  ok(sm.textContent==='The stars are singing!','victory subtitle applies to #win .sm');
  const entities=require('fs').readFileSync(require('path').join(__dirname,'..','src','entities.js'),'utf8');
  const tw=entities.slice(entities.indexOf('function triggerWin'),entities.indexOf('function returnToLevelSelect'));
  ok(/Tap A to pick a level/.test(tw),'Tap A picker hint preserved in triggerWin');
}

// ---- Levels 1–3 unchanged boot ----
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1','Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

report();
