// landableSurfaceAt — Level 4 practice pad, open space, and stacked solids.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function near(a,b,tol){return Math.abs(a-b)<=tol;}

// ---- practice pad reports a pad surface near y≈0.42 ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const S=H.getSpace();
  ok(typeof S.landableSurfaceAt==='function','landableSurfaceAt exported on space');
  const land=S.landableSurfaceAt(22,-10);
  ok(!!land,'practice pad (22,-10) returns a landable surface');
  ok(near(land.y,0.42,0.05),'practice pad surface y≈0.42');
  ok(land.surf==='pad','practice pad surface is pad');
  ok(S.solidIsLandable(land.solid),'practice pad solid is landable');
}

// ---- open space far from pads returns null ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const S=H.getSpace();
  ok(S.landableSurfaceAt(50,50)===null,'open space (50,50) has no pad surface');
  ok(S.landableSurfaceAt(0,30)===null,'open space (0,30) has no pad surface');
  ok(S.landableSurfaceAt(80,20)===null,'open space (80,20) has no pad surface');
}

// ---- overlapping solids: highest landable wins, non-landable ignored ----
{
  const H=boot();H.startLevel(3);H.frames(4);
  const S=H.getSpace();
  const R=0.36;
  const x=102,z=-222;
  const covering=H.W.solids.filter(s=>x+R>s.min.x&&x-R<s.max.x&&z+R>s.min.z&&z-R<s.max.z);
  const landables=covering.filter(s=>S.solidIsLandable(s));
  const nonLandables=covering.filter(s=>!S.solidIsLandable(s));
  ok(landables.length>=2,'crystal interior has multiple landable solids at same x,z');
  const land=S.landableSurfaceAt(x,z);
  ok(!!land,'stacked solids return a landable surface');
  const highest=Math.max(...landables.map(s=>s.max.y));
  ok(near(land.y,highest,0.01),'highest landable surface selected among overlaps');
  ok(S.solidIsLandable(land.solid),'result solid is landable (role or pad surf)');
  ok(land.y>Math.min(...landables.map(s=>s.max.y))+0.5,'does not pick a lower landable slab');

  const x2=102,z2=-227;
  const wall=H.W.solids.find(s=>!S.solidIsLandable(s)&&x2+R>s.min.x&&x2-R<s.max.x&&z2+R>s.min.z&&z2-R<s.max.z);
  ok(!!wall&&wall.max.y>14.9,'non-landable solid overlaps crystal floor');
  const floor=S.landableSurfaceAt(x2,z2);
  ok(!!floor&&near(floor.y,14.85,0.01),'landable floor kept despite taller non-landable overlap');
  ok(S.solidIsLandable(floor.solid),'floor result is landable, not the invisible wall');
}

report();
