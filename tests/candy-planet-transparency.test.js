// Candy Planet proximity shell fade — opaque far, translucent at outer shell, restore on exit.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function distToPlanet(H){const cp=H.getSpace().candyPlanet;return Math.hypot(H.P.pos.x-cp.x,H.P.pos.y-cp.y,H.P.pos.z-cp.z);}

// Intended interior platform count (approach deck only — crystal cavern is separate)
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const pads=H.W.solids.filter(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-cp.pad.x,(s.min.z+s.max.z)/2-cp.pad.z)<3);
  ok(pads.length===1,'CANDY_PLANET_INTENDED_PLATFORM_COUNT: one approach pad');
}

// Opaque when far from Candy Planet
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  H.P.pos.set(cp.x+42,cp.y+10,cp.z+38);H.P.vel.set(0,0,0);
  H.frames(90);
  ok(!cp.shellInside,'CANDY_PLANET_OPAQUE_WHEN_FAR: not inside shell zone');
  ok(H.getSpace().candyPlanetShellFade>0.85,'CANDY_PLANET_OPAQUE_WHEN_FAR: shell stays opaque');
  ok(distToPlanet(H)>cp.r+H.getSpace().CANDY_SHELL_EXIT_PAD,'far position outside exit radius');
}

// Approach lane stays opaque until outer shell contact
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  H.P.pos.set(82,16,-192);H.P.vel.set(0,0,0);
  H.frames(60);
  ok(distToPlanet(H)>cp.r+H.getSpace().CANDY_SHELL_ENTER_PAD,'route approach still outside enter radius');
  ok(!cp.shellInside,'approach lane does not trigger shell fade early');
  ok(H.getSpace().candyPlanetShellFade>0.85,'approach lane shell opaque');
}

// Translucent at outer shell / interior
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const pad=cp.pad;
  H.P.pos.set(pad.x,pad.y+0.55,pad.z);H.P.vel.set(0,0,0);H.P.grounded=true;
  H.frames(90);
  ok(cp.shellInside,'CANDY_PLANET_TRANSLUCENT_AT_OUTER_EDGE_OR_INTERIOR: shellInside at pad');
  ok(H.getSpace().candyPlanetShellFade<0.5,'CANDY_PLANET_TRANSLUCENT_AT_OUTER_EDGE_OR_INTERIOR: shell fades');
  ok(H.getSpace().inCandyPlanetShellZone(),'inCandyPlanetShellZone true on pad');
  ok(pad.y>cp.y+0.8,'INTERIOR_PLATFORMS_VISIBLE_INSIDE: pad raised for readability');
  ok(H.P.pos.y>=pad.y,'PLAYER_VISIBLE_INSIDE_CANDY_PLANET: player on pad inside zone');
}

// Shell contact at outer edge (not deep interior only)
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const r=cp.r,enter=H.getSpace().CANDY_SHELL_ENTER_PAD;
  const ux=(cp.pad.x-cp.x)/Math.hypot(cp.pad.x-cp.x,cp.pad.z-cp.z);
  const uz=(cp.pad.z-cp.z)/Math.hypot(cp.pad.x-cp.x,cp.pad.z-cp.z);
  H.P.pos.set(cp.x+ux*(r+enter*0.5),cp.y+0.2,cp.z+uz*(r+enter*0.5));H.P.vel.set(0,0,0);
  H.frames(90);
  ok(cp.shellInside,'shell fades when player touches outer edge');
  ok(H.getSpace().candyPlanetShellFade<0.5,'edge contact lowers shell opacity');
}

// Exit restores opaque shell
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  H.P.pos.set(cp.pad.x,cp.pad.y+0.55,cp.pad.z);H.P.vel.set(0,0,0);
  H.frames(90);
  ok(cp.shellInside,'precondition: inside before exit');
  H.P.pos.set(cp.x+40,cp.y+12,cp.z+36);H.P.vel.set(0,0,0);H.P.grounded=false;H.P.moveZone='openSpace';
  H.frames(90);
  ok(!cp.shellInside,'CANDY_PLANET_RETURNS_OPAQUE_AFTER_EXIT: shellInside cleared');
  ok(H.getSpace().candyPlanetShellFade>0.85,'CANDY_PLANET_RETURNS_OPAQUE_AFTER_EXIT: opacity restored');
}

// Hysteresis prevents flicker at boundary (wobble inside exit radius only)
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const r=cp.r,enter=H.getSpace().CANDY_SHELL_ENTER_PAD,exit=H.getSpace().CANDY_SHELL_EXIT_PAD;
  const dir=Math.atan2(cp.pad.z-cp.z,cp.pad.x-cp.x);
  H.P.pos.set(cp.x+Math.cos(dir)*(r+enter*0.4),cp.y+4,cp.z+Math.sin(dir)*(r+enter*0.4));
  H.P.grounded=false;H.P.moveZone='openSpace';H.P.vel.set(0,0,0);
  H.frames(90);
  ok(cp.shellInside,'entered shell zone');
  const wobble=[r+enter*0.8,r+enter*0.45,r+enter*0.75,r+enter*0.5,r+exit*0.85];
  let toggles=0,last=cp.shellInside;
  for(const d of wobble){
    H.P.pos.set(cp.x+Math.cos(dir)*d,cp.y+4,cp.z+Math.sin(dir)*d);
    H.P.grounded=false;H.P.moveZone='openSpace';H.P.vel.set(0,0,0);
    H.frames(30);
    if(cp.shellInside!==last){toggles++;last=cp.shellInside;}
  }
  ok(toggles===0,'boundary wobble inside exit radius does not oscillate shellInside ('+toggles+' toggles)');
  ok(cp.shellInside,'still inside until exit radius');
}

report();
