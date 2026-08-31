// Candy Planet shell proximity — deterministic enter-threshold boundary regression.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function distToPlanet(H){const cp=H.getSpace().candyPlanet;return Math.hypot(H.P.pos.x-cp.x,H.P.pos.y-cp.y,H.P.pos.z-cp.z);}
function placeAtShellDist(H,targetDist){
  const cp=H.getSpace().candyPlanet;
  const dir=Math.atan2(cp.pad.z-cp.z,cp.pad.x-cp.x)+Math.PI;
  const tilt=0.15;
  const ux=Math.cos(dir)*Math.cos(tilt),uy=Math.sin(tilt),uz=Math.sin(dir)*Math.cos(tilt);
  const norm=Math.hypot(ux,uy,uz);
  H.P.pos.set(cp.x+ux/norm*targetDist,cp.y+uy/norm*targetDist,cp.z+uz/norm*targetDist);
}

// Enter threshold: shellInside when pd < r + CANDY_SHELL_ENTER_PAD (exclusive outside).
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const enterR=cp.r+H.getSpace().CANDY_SHELL_ENTER_PAD;
  const eps=0.05;
  placeAtShellDist(H,enterR+eps);
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(5);
  ok(distToPlanet(H)>enterR,'CANDY_SHELL_ENTER_BOUNDARY_OUTSIDE: 3D dist beyond enter radius');
  ok(!cp.shellInside,'CANDY_SHELL_ENTER_BOUNDARY_OUTSIDE: shellInside false just outside enter threshold');
  ok(H.getSpace().candyPlanetShellFade>0.85,'CANDY_SHELL_ENTER_BOUNDARY_OUTSIDE: shell stays opaque outside threshold');
  ok(!H.getSpace().inCandyPlanetShellZone(),'CANDY_SHELL_ENTER_BOUNDARY_OUTSIDE: inCandyPlanetShellZone false outside threshold');
}

// At enter threshold (just inside) — must activate shell fade before landing assist captures.
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const enterR=cp.r+H.getSpace().CANDY_SHELL_ENTER_PAD;
  const eps=0.05;
  placeAtShellDist(H,enterR-eps);
  H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(15);
  ok(distToPlanet(H)<enterR,'CANDY_SHELL_ENTER_BOUNDARY_INSIDE: 3D dist within enter radius');
  ok(cp.shellInside,'CANDY_SHELL_ENTER_BOUNDARY_INSIDE: shellInside true at enter threshold');
  ok(H.getSpace().candyPlanetShellFade<0.5,'CANDY_SHELL_ENTER_BOUNDARY_INSIDE: shell fades at enter threshold');
  ok(H.getSpace().inCandyPlanetShellZone(),'CANDY_SHELL_ENTER_BOUNDARY_INSIDE: inCandyPlanetShellZone true at threshold');
}

report();
