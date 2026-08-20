// Current-level FINISH ownership: Level 1 behavior stays exact while Level 2
// explicitly registers its unfinished, non-winning finish.
const fs=require('fs'),path=require('path');
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function wake(H,s){
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);
  H.P.vel.set(0,0,0);H.frames(2);H.tap('KeyK',2);H.frames(3);
}
function validFinish(f){
  return f&&[f.x,f.z,f.top].every(Number.isFinite)&&
    typeof f.onAllAwake==='function'&&typeof f.onWin==='function'&&typeof f.update==='function';
}

// ---- Level 1 registration and unchanged completion behavior ----
{
  const H=boot(),{W}=H;
  let fanfares=0;W.sfx.fanfare=()=>{fanfares++;};
  H.startLevel(0);
  const f=W.FINISH,wm=W.WM;
  ok(validFinish(f),'Level 1 registers the complete FINISH runtime shape');
  ok(f.x===wm.x&&f.z===wm.z&&f.top===17,'windmill supplies the celebration anchor');
  ok(!W.won&&H.el('win').style.display!=='flex','Level 1 starts with win UI hidden');

  const first=W.snoozles[0],home={x:first.home.x,z:first.home.z};
  wake(H,first);H.frames(200);
  ok(first.state==='home'&&Math.abs(first.g.position.x-home.x)<0.01&&Math.abs(first.g.position.z-home.z)<0.01,
    'Snoozle flies to its snoozleHomes coordinate exactly');
  ok(!W.won,'waking a non-final Level 1 Snoozle does not win');

  for(let i=1;i<W.snoozles.length-1;i++){wake(H,W.snoozles[i]);H.frames(180);}
  // Deliberately move only the FINISH anchor: confetti must follow it, not WM.
  f.x=100;f.z=200;f.top=50;
  wake(H,W.snoozles[W.snoozles.length-1]);H.frames(4);
  ok(W.won,'Level 1 wins immediately when the final Snoozle wakes');
  ok(fanfares===1,'Level 1 final Snoozle plays one fanfare');
  ok(H.el('win').style.display==='flex','Level 1 congratulations banner is shown');
  ok(wm.party&&W.RAINBOW.visible,'windmill party and rainbow start on win');
  H.frames(60);
  ok(W.RAINBOW.scale.x>0.5,'windmill FINISH update grows the rainbow');
  const conf=W.celebrationParticles.filter(p=>p.life>0&&p.grav===-2.2);
  ok(conf.length>0,'generic win flow emits celebration confetti');
  ok(conf.some(p=>Math.hypot(p.m.position.x-f.x,p.m.position.z-f.z)<16&&Math.abs(p.m.position.y-f.top)<5),
    'shared confetti uses FINISH x/z/top rather than the windmill');
}

// ---- Level 2 Conch finish: waking all opens destination but does not win ----
{
  const H=boot();H.startLevel(1);
  ok(validFinish(H.W.FINISH),'Level 2 registers a complete Conch FINISH');
  ok(H.W.conch&&!H.W.conch.open,'Conch starts closed');
  for(const s of H.W.snoozles){wake(H,s);H.frames(40);}
  ok(H.W.conch.open,'waking all Level 2 Snoozles opens the Conch');
  ok(!H.W.won,'waking all Level 2 Snoozles still does not win until entry');
  ok(H.el('win').style.display!=='flex','Level 2 does not show the win banner on final wake alone');
}

// ---- loading replaces current-level FINISH and missing registration fails ----
{
  const H=boot();H.startLevel(0);
  const level1Finish=H.W.FINISH;
  H.test.loadLevel(1);
  ok(H.W.FINISH!==level1Finish,'loading Level 2 resets and replaces the Level 1 FINISH');
  ok(validFinish(H.W.FINISH),'replacement Level 2 FINISH satisfies the contract');
  let error=null;
  try{
    H.test.loadLevel({id:'missing-finish',spawn:null,fence:0,fenceSolids:[],pathTiles:[],hedges:[],checks:[],
      tower:{tx:0,tz:0},steps:[],trees:[],snoozleHomes:[],snoozles:[]});
  }catch(e){error=e;}
  ok(error&&/did not register FINISH/.test(error.message),'level loading fails loudly when FINISH is not registered');
}

// ---- architectural boundaries in shared code ----
{
  const entities=fs.readFileSync(path.join(__dirname,'..','src','entities.js'),'utf8');
  const enemies=fs.readFileSync(path.join(__dirname,'..','src','enemies.js'),'utf8');
  const genericWin=entities.slice(entities.indexOf('function triggerWin'),entities.indexOf('function loadLevel'));
  ok(!/\bWM\b|\bRAINBOW\b|\bCONCH\b|\bconch\b/.test(genericWin),'generic triggerWin/updateWin contain no landmark references');
  ok(/FINISH\.onWin\(\)/.test(genericWin)&&/FINISH\.x/.test(genericWin)&&/FINISH\.top/.test(genericWin),
    'generic win flow delegates startup and anchors celebration through FINISH');
  const snoozleMove=enemies.slice(enemies.indexOf('function updateSnoozles'),enemies.indexOf('function updateBoat'));
  ok(/s\.home\.x/.test(snoozleMove)&&!/WM|FINISH/.test(snoozleMove),
    'shared Snoozle home movement remains landmark-free and data-driven');
  ok(/function updateWindmill[\s\S]*WM\.spin/.test(enemies),'ordinary windmill updating remains in updateWindmill');
}

report();
