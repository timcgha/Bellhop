// Candy Planet shell enter-threshold boundary — activation at r+ENTER_PAD, none just outside.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const r=cp.r,enter=H.getSpace().CANDY_SHELL_ENTER_PAD;
  const enterR=r+enter;
  const dx=cp.pad.x-cp.x,dy=cp.pad.y-cp.y,dz=cp.pad.z-cp.z;
  const len=Math.hypot(dx,dy,dz)||1;
  const ux=dx/len,uy=dy/len,uz=dz/len;
  const eps=0.001;

  cp.shellInside=false;
  H.P.pos.set(cp.x+ux*enterR,cp.y+uy*enterR,cp.z+uz*enterR);
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.getSpace().updateCandyPlanetShellFade(0.05);
  ok(H.getSpace().inCandyPlanetShellZone(),'CANDY_SHELL_ENTER_BOUNDARY: activates at distance r+CANDY_SHELL_ENTER_PAD');
  ok(cp.shellInside,'CANDY_SHELL_ENTER_BOUNDARY: shellInside at enter threshold');

  cp.shellInside=false;
  H.P.pos.set(cp.x+ux*(enterR+eps),cp.y+uy*(enterR+eps),cp.z+uz*(enterR+eps));
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.getSpace().updateCandyPlanetShellFade(0.05);
  ok(!H.getSpace().inCandyPlanetShellZone(),'CANDY_SHELL_ENTER_BOUNDARY: no activation immediately outside enter threshold');
  ok(!cp.shellInside,'CANDY_SHELL_ENTER_BOUNDARY: shellInside stays false just outside enter threshold');
}

report();
