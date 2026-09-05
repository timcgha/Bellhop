// Player visual redesign only.
// This module replaces Pling's rendered subparts after player.js boots while
// deliberately preserving the gameplay-owned root, physics, collision,
// attacks, camera behavior, mount offsets, and animation binding names.
(function rebuildPlayerVisual(){
  const old=player.userData||{};
  const jet=old.jet,flame=old.flame;

  // Keep gameplay/effect objects alive while discarding only the old visible shell.
  if(flame&&old.head&&flame.parent===old.head)old.head.remove(flame);
  [old.legL,old.legR,old.bel,old.head].forEach(o=>{if(o&&o.parent===player)player.remove(o);});

  const white=pho(0xf7fbff,170,0xffffff);
  const whiteSoft=pho(0xdceaf3,125,0xffffff);
  const cyan=pho(0x28d7ff,180,0xc8f8ff);
  const blue=pho(0x168cff,165,0x9bdfff);
  const visorMat=pho(0x071723,190,0x3d718d);
  const joint=pho(0x263746,90,0x7c9aaa);
  const seamSilver=0xc9ced4;

  const legL=new THREE.Group(),legR=new THREE.Group();
  legL.position.set(-0.17,0.3,0);legR.position.set(0.17,0.3,0);
  [[legL,-1],[legR,1]].forEach(a=>{
    const L=a[0];
    L.add(mesh(SPH,joint,0,0,0,0.095));
    L.add(mesh(CYL,white,0,-0.13,0,0.105,0.24,0.105));
    const cuff=new THREE.Mesh(new THREE.TorusGeometry(0.105,0.016,7,18),cyan);
    cuff.rotation.x=Math.PI/2;cuff.position.y=-0.23;L.add(cuff);
    L.add(mesh(SPH,whiteSoft,0,-0.27,0.045,0.15,0.05,0.18));
    L.add(mesh(SPH,blue,0,-0.27,0.17,0.105,0.034,0.06));
    player.add(L);
  });

  const bel=new THREE.Group();bel.position.y=0.3;player.add(bel);
  bel.add(mesh(CYL,white,0,0.29,0,0.33,0.44,0.33));
  bel.add(mesh(SPH,whiteSoft,0,0.08,0,0.33,0.09,0.33));
  bel.add(mesh(SPH,white,0,0.50,0,0.33,0.09,0.33));
  const chest=mesh(SPH,blue,0,0.31,0.315,0.17,0.14,0.055);bel.add(chest);
  const chestGlow=mesh(SPH,new THREE.MeshBasicMaterial({color:0x6be8ff}),0,0.31,0.357,0.075,0.055,0.018);bel.add(chestGlow);
  const seams=[];
  [0.14,0.29,0.44].forEach(y=>{
    const r=new THREE.Mesh(new THREE.TorusGeometry(0.337,0.014,7,24),pho(seamSilver,100,0xffffff));
    r.rotation.x=Math.PI/2;r.position.y=y;bel.add(r);seams.push(r);
  });

  const head=new THREE.Group();head.position.y=0.87;player.add(head);
  head.add(mesh(SPH,white,0,0.15,0,0.46,0.37,0.41));
  head.add(mesh(SPH,whiteSoft,0,-0.09,-0.005,0.39,0.20,0.35));
  const sideL=mesh(SPH,blue,-0.425,0.13,0,0.065,0.145,0.17);
  const sideR=mesh(SPH,blue,0.425,0.13,0,0.065,0.145,0.17);
  head.add(sideL);head.add(sideR);

  const visor=mesh(SPH,visorMat,0,0.14,0.39,0.365,0.205,0.075);head.add(visor);
  const visorGlow=mesh(SPH,new THREE.MeshBasicMaterial({color:0x163447,transparent:true,opacity:0.7}),0,0.14,0.454,0.33,0.17,0.012);head.add(visorGlow);
  const eyes=[];
  [-0.14,0.14].forEach(x=>{
    const e=new THREE.Group();e.position.set(x,0.17,0.472);
    e.add(mesh(SPH,cyan,0,0,0,0.066,0.041,0.024));
    e.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xbaf7ff}),0,0,0.018,0.032,0.020,0.010));
    head.add(e);eyes.push(e);
  });
  const mouth=mesh(BOXG,joint,0,-0.065,0.455,0.16,0.05,0.03);head.add(mouth);

  const antenna=new THREE.Group();
  antenna.add(mesh(CYL,joint,0,0.55,0,0.025,0.18,0.025));
  const antennaTip=mesh(SPH,cyan,0,0.675,0,0.061);antenna.add(antennaTip);
  const antennaGlow=mesh(SPH,new THREE.MeshBasicMaterial({color:0xbaf7ff}),0,0.675,0.018,0.027);antenna.add(antennaGlow);
  head.add(antenna);

  const armL=new THREE.Group(),armR=new THREE.Group();
  armL.position.set(-0.45,0.03,0);armR.position.set(0.45,0.03,0);
  [[armL,-1],[armR,1]].forEach(a=>{
    const A=a[0],sgn=a[1];
    A.add(mesh(SPH,joint,0,0,0,0.102));
    A.add(mesh(SPH,blue,sgn*0.015,0.005,0.018,0.082));
    A.add(mesh(CYL,white,sgn*0.055,-0.16,0,0.082,0.25,0.082));
    const cuff=new THREE.Mesh(new THREE.TorusGeometry(0.084,0.015,7,18),cyan);
    cuff.rotation.x=Math.PI/2;cuff.position.set(sgn*0.07,-0.275,0);A.add(cuff);
    A.add(mesh(SPH,whiteSoft,sgn*0.078,-0.32,0.015,0.108));
    head.add(A);
  });

  // Keep the existing deploy/retract animation contract for Sky Blast glide wings.
  const wings=new THREE.Group();wings.position.set(0,0.52,-0.05);bel.add(wings);
  const wingL=new THREE.Group(),wingR=new THREE.Group();
  wingL.position.set(-0.38,0,0);wingR.position.set(0.38,0,0);
  [[wingL,-1],[wingR,1]].forEach(a=>{
    const Wg=a[0],sgn=a[1];
    Wg.add(mesh(SPH,joint,sgn*0.02,0,0,0.075));
    const plate=mesh(BOXG,whiteSoft,sgn*0.42,0.02,-0.04,0.70,0.045,0.30);
    plate.userData.plate=true;Wg.add(plate);
    Wg.add(mesh(BOXG,blue,sgn*0.47,0.025,0.105,0.38,0.025,0.055));
  });
  wings.add(wingL);wings.add(wingR);wings.visible=false;wings.userData={wingL,wingR,open:0};

  // Preserve effect ownership and the animation API consumed later in player.js.
  if(flame){head.add(flame);flame.position.y=0.92;}
  player.userData={
    legL,legR,bel,head,eyes,mouth,armL,armR,seams,wings,
    jet,flame,visor,antenna,antennaTip,chest,
    visualStyle:'rounded-white-cyan-v57'
  };

  // Read-only verification hook; no gameplay state is exposed for mutation.
  window.__PLAYER_VISUAL=()=>({
    style:player.userData.visualStyle,
    rootScale:player.scale.x,
    eyeCount:eyes.length,
    hasVisor:!!visor,
    hasAntenna:!!antennaTip,
    hasChestAccent:!!chest,
    keepsJet:!!jet,
    keepsFlame:!!flame
  });
})();
