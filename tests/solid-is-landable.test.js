// solidIsLandable — Level 4 launch dock, rest pads, and collision-only solids.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

function solidCenter(s){
  return {x:(s.min.x+s.max.x)/2,y:(s.min.y+s.max.y)/2,z:(s.min.z+s.max.z)/2};
}

{
  const H=boot();H.startLevel(3);H.frames(4);
  const landable=H.getSpace().solidIsLandable;
  ok(typeof landable==='function','__SPACE exports solidIsLandable');

  ok(landable(null)===false,'null solid is not landable');
  ok(landable(undefined)===false,'undefined solid is not landable');
  ok(landable({})===false,'empty object is not landable');
  ok(landable({role:'hazard'})===false,'solid with unrelated role is not landable');
  ok(landable({surf:'stone'})===false,'stone collision without landable role is not landable');

  const solids=H.W.solids;
  const isLand=s=>landable(s);

  const dock=solids.find(s=>{
    const c=solidCenter(s);
    return s.role==='landable'&&s.surf==='pad'&&Math.abs(c.x)<0.01&&Math.abs(c.z)<0.01;
  });
  ok(!!dock,'Launch Dock solid exists');
  ok(isLand(dock),'Launch Dock is landable');

  const restPads=solids.filter(s=>{
    const c=solidCenter(s);
    return s.role==='landable'&&s.surf==='pad'&&Math.abs(c.x-28)<0.01&&Math.abs(c.z+26)<0.5
      ||Math.abs(c.x-28)<0.01&&Math.abs(c.z+104)<0.5;
  });
  ok(restPads.length===2,'two rest pads authored on Level 4');
  ok(restPads.every(isLand),'rest pads are landable');

  const collisionOnly=solids.filter(s=>s.role!=='landable'&&s.surf!=='pad');
  ok(collisionOnly.length>=3,'Level 4 has collision solids without landable markers');
  ok(collisionOnly.every(s=>!isLand(s)),'ordinary collision solids are not landable');

  ok(isLand({surf:'pad'})===true,'surf pad marker alone is landable');
  ok(isLand({role:'landable'})===true,'role landable marker alone is landable');
}

report();
