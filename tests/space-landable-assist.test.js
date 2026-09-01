// nearLandableAssist — takeoffAssistH cutoff over Launch Dock (Level 4).
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

{
  const H=boot();
  H.startLevel(3);
  H.frames(4);

  const S=H.getSpace();
  const cfg=S.spaceCfg();
  const land=S.landableSurfaceAt(0,0);
  ok(!!land,'Launch Dock landable surface at origin');
  const padY=land.y;

  function overDock(dy){
    return {x:0,y:padY+dy,z:0};
  }

  ok(S.nearLandableAssist(overDock(0.04),cfg),'true at padY + 0.04');
  ok(S.nearLandableAssist(overDock(2.0),cfg),'true at padY + 2.0');
  ok(S.nearLandableAssist(overDock(3.49),cfg),'true at padY + 3.49');
  ok(!S.nearLandableAssist(overDock(3.5),cfg),'false at padY + 3.5 (takeoffAssistH cutoff)');
  ok(!S.nearLandableAssist(overDock(3.51),cfg),'false at padY + 3.51 (above cutoff)');
  ok(cfg.takeoffAssistH===3.5,'takeoffAssistH is 3.5m');
}

report();
