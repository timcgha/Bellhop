// Candy Planet playtest revision — platform visibility, shell fade, takeoff, Snoozle 3.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}

// Platform raised above planet body for approach readability
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  ok(!!cp&&cp.pad,'CANDY_PLANET_PLATFORM_TARGETABLE: pad exists');
  ok(cp.pad.y>cp.y+cp.r*0.45,'CANDY_PLANET_PLATFORM_TARGETABLE: pad raised above equator');
  ok(cp.pad.y>cp.y+0.8,'CANDY_PLANET_PLATFORM_TARGETABLE: pad clearly above planet center');
}

// Shell fades when player would be occluded by the candy body
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  ok(cp.shellMeshes&&cp.shellMeshes.length>=5,'candy shell meshes tracked');
  H.P.pos.set(cp.x-1,cp.y,cp.z+1);H.P.vel.set(0,0,0);H.P.grounded=false;
  H.CAM.pos.set(cp.x-18,cp.y+4,cp.z+14);H.CAM.look.set(cp.x-1,cp.y+0.5,cp.z+1);
  H.frames(30);
  ok(H.getSpace().candyPlanetOccludesView(),'PLAYER_VISIBLE_WHEN_PLANET_WOULD_OCCLUDE_CAMERA: occlusion detected');
  ok(H.getSpace().candyPlanetShellFade<0.5,'PLAYER_VISIBLE_WHEN_PLANET_WOULD_OCCLUDE_CAMERA: shell fades');
  H.P.pos.set(cp.x+40,cp.y+8,cp.z+40);
  H.CAM.pos.set(cp.x+50,cp.y+12,cp.z+50);H.CAM.look.set(cp.x+40,cp.y+8,cp.z+40);
  H.frames(40);
  ok(H.getSpace().candyPlanetShellFade>0.85,'shell opacity restores away from planet');
}

// Takeoff after landing on candy pad
{
  const H=boot();H.startLevel(3);H.frames(4);
  const cp=H.getSpace().candyPlanet;
  const pad=cp.pad;
  H.P.pos.set(pad.x,pad.y+0.55,pad.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.moveZone='grounded';H.P.surf='pad';
  H.frames(2);
  holdJump(H,3);
  for(let i=0;i<40;i++)H.frames(1);
  ok(H.P.pos.y>pad.y+2.5,'CANDY_PLANET_TAKEOFF_AFTER_LANDING: rises off pad');
  ok(!H.P.grounded||H.getMovement().zone==='openSpace','CANDY_PLANET_TAKEOFF_AFTER_LANDING: leaves grounded lock');
  releaseJump(H);
  holdJump(H,25);
  for(let i=0;i<30;i++)H.frames(1);
  ok(H.getMovement().zone==='openSpace','NORMAL_FLIGHT_CONTROLS_RESTORED: open-space flight resumes');
  ok(H.P.pos.y>pad.y+4,'NORMAL_FLIGHT_CONTROLS_RESTORED: sustained ascent');
  releaseJump(H);
}

// Snoozle 3 on crystal main route, not floating in open void
{
  const H=boot();H.startLevel(3);H.frames(6);
  const sn=H.W.snoozles[1];
  const ci=H.getSpace().crystalInterior;
  ok(!!sn,'Snoozle 3 present');
  ok(sn.g.position.y>12,'SNOOZLE_POSITIONING_CORRECT: not stranded in deep void');
  ok(sn.g.position.y>=ci.bounds.y0&&sn.g.position.y<=ci.bounds.y1,'SNOOZLE_POSITIONING_CORRECT: inside crystal interior');
  ok(Math.abs(sn.g.position.x-ci.x)<4&&Math.abs(sn.g.position.z-ci.z)<5.5,'SNOOZLE_POSITIONING_CORRECT: on main chamber route');
}

// Cheese Moon unchanged
{
  const H=boot();H.startLevel(3);H.frames(4);
  ok(H.getSpace().cheeseMoon&&H.getSpace().cheeseMoon.userData.landable===false,'Cheese Moon still foreshadow-only');
}

report();
