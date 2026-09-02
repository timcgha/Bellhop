const solids=[],wobblers=[],pinwheels=[],toss=[],notes=[],dust=[],snoozles=[],fans=[],clouds=[],gloops=[],goos=[],puddles=[],hearts=[],crates=[],powers=[],fires=[];
const sharks=[],fish=[],spikefish=[],clams=[],bubbleShots=[],steamVents=[],lavas=[];
// Peak arrays live in peak.js (cinders, embers, wisps, salamanders, geysers).
let seenGloop=false,seenCrate=false;
let BOAT=null,WM=null,player=null,shadow=null,RAINBOW=null,FINISH=null;
// Intended Snoozle total for the level (may exceed placed count on a partial slice).
let SNOOZLE_GOAL=0;
function snoozleGoalCount(){return SNOOZLE_GOAL>0?SNOOZLE_GOAL:snoozles.length;}
window.__snoozleGoal=()=>snoozleGoalCount();
const checks=[];let won=false,winT=0,confT=0;
const LEVELS=[LEVEL1,LEVEL2,LEVEL3,LEVEL4];
let CURRENT_LEVEL=null;
function isUnderwater(){return !!(CURRENT_LEVEL&&CURRENT_LEVEL.underwater);}
const POND={x0:-6,x1:6,z0:-33,z1:-25};
function inPond(x,z){return x>POND.x0&&x<POND.x1&&z>POND.z0&&z<POND.z1;}
function groundHeightAt(x,z){
  if(isUnderwater())return 0;
  if(CURRENT_LEVEL&&CURRENT_LEVEL.spaceAtmosphere)
    return CURRENT_LEVEL.voidFloor!=null?CURRENT_LEVEL.voidFloor:-40;
  // Peak has no infinite meadow floor. Gaps without authored solids fall into the void
  // (Level 3 voidY recovery). Levels 1–2 keep the old y=0 / pond floor.
  if(CURRENT_LEVEL&&CURRENT_LEVEL.peakAtmosphere)
    return CURRENT_LEVEL.voidFloor!=null?CURRENT_LEVEL.voidFloor:-25;
  return inPond(x,z)?-0.4:0;
}
function surfaceHeightAt(x,z,belowY,r){r=r||0.2;let h=groundHeightAt(x,z);for(const s of solids){if(x+r>s.min.x&&x-r<s.max.x&&z+r>s.min.z&&z-r<s.max.z&&s.max.y<=belowY+0.05&&s.max.y>h)h=s.max.y;}return h;}
// Walkable tops only — skips tall wall/ceiling slabs that surfaceHeightAt would otherwise prefer.
function walkSurfaceAt(x,z,r){
  r=r||0.25;let h=groundHeightAt(x,z);
  for(const s of solids){
    if(x+r<=s.min.x||x-r>=s.max.x||z+r<=s.min.z||z-r>=s.max.z)continue;
    if(s.max.y-s.min.y>1.6)continue;
    if(s.max.y>h)h=s.max.y;
  }
  return h;
}
// Shadow receiving surface: nearest mostly-horizontal top beneath Pling, including lava.
// Physics still uses surfaceHeightAt (solids + ground only). Readability may land on lava.
let _shadowStick=null;
function clearShadowStick(){_shadowStick=null;}
function shadowReceiveAt(x,z,belowY,r){
  r=r||0.2;
  let bestY=groundHeightAt(x,z),bestKind='ground',bestBox=null;
  for(const s of solids){
    if(x+r<=s.min.x||x-r>=s.max.x||z+r<=s.min.z||z-r>=s.max.z)continue;
    // Skip tops above the query — ceilings / wall tops the player is beside mid-height.
    if(s.max.y>belowY+0.05)continue;
    if(s.max.y>bestY){bestY=s.max.y;bestKind='solid';bestBox=s;}
  }
  for(const lv of lavas){
    if(x+r<=lv.min.x||x-r>=lv.max.x||z+r<=lv.min.z||z-r>=lv.max.z)continue;
    if(lv.max.y>belowY+0.05)continue;
    if(lv.max.y>bestY){bestY=lv.max.y;bestKind='lava';bestBox=lv;}
  }
  // Edge hysteresis: keep a higher surface while the footprint still covers it, instead of
  // snapping to a much lower floor/lava at the pad rim.
  if(_shadowStick&&_shadowStick.y>bestY+0.25){
    const p=_shadowStick;
    const over=x+r>p.minx&&x-r<p.maxx&&z+r>p.minz&&z-r<p.maxz;
    if(over&&p.y<=belowY+0.05)return {y:p.y,kind:p.kind};
  }
  if(bestBox)_shadowStick={y:bestY,kind:bestKind,minx:bestBox.min.x,maxx:bestBox.max.x,minz:bestBox.min.z,maxz:bestBox.max.z};
  else _shadowStick={y:bestY,kind:'ground',minx:x-80,maxx:x+80,minz:z-80,maxz:z+80};
  return {y:bestY,kind:bestKind};
}
window.__shadowReceiveAt=(x,z,belowY,r)=>shadowReceiveAt(x,z,belowY,r);
function insideSolid(x,y,z,m){for(const s of solids){if(x>s.min.x-m&&x<s.max.x+m&&y>s.min.y-m&&y<s.max.y+m&&z>s.min.z-m&&z<s.max.z+m)return true;}return false;}
function addSolid(x,y,z,w,h,d,color,opts){const m=new THREE.Mesh(BOXG,lam(color));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);if(opts&&opts.invisible)m.visible=false;scene.add(m);
  // Peak Geode mouth corridor walls may opt into shell fade (collision stays; readability only).
  if(opts&&opts.geodeShell&&typeof registerGeodeShellMesh==='function')registerGeodeShellMesh(m);
  const s={min:new THREE.Vector3(x-w/2,y,z-d/2),max:new THREE.Vector3(x+w/2,y+h,z+d/2),mesh:m,surf:(opts&&opts.surf)||'wood',role:(opts&&opts.role)||null,color:color|0,geodeShell:!!(opts&&opts.geodeShell)};solids.push(s);return s;}

// ground with a hole for the pond
function grassTex(){const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle='#78c65a';g.fillRect(0,0,256,256);
  for(let i=0;i<700;i++){g.fillStyle=Math.random()<0.5?'rgba(255,255,255,0.09)':'rgba(0,70,0,0.11)';const s=rand(4,16);g.fillRect(Math.random()*256,Math.random()*256,s,s*0.6);}
  const tx=new THREE.CanvasTexture(cv);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(0.4,0.4);tx.encoding=THREE.sRGBEncoding;return tx;}
let landGround=null,peakGround=null;
(function buildGround(){
  landGround=new THREE.Group();
  const shp=new THREE.Shape();shp.moveTo(-48,-28);shp.lineTo(36,-28);shp.lineTo(36,86);shp.lineTo(-48,86);shp.lineTo(-48,-28);
  const hole=new THREE.Path();hole.moveTo(POND.x0,-POND.z1);hole.lineTo(POND.x1,-POND.z1);hole.lineTo(POND.x1,-POND.z0);hole.lineTo(POND.x0,-POND.z0);hole.lineTo(POND.x0,-POND.z1);shp.holes.push(hole);
  const g=new THREE.Mesh(new THREE.ShapeGeometry(shp),new THREE.MeshLambertMaterial({map:grassTex()}));g.rotation.x=-Math.PI/2;landGround.add(g);
  const cx=(POND.x0+POND.x1)/2,cz=(POND.z0+POND.z1)/2,w=POND.x1-POND.x0,d=POND.z1-POND.z0,sand=lam(0xd9c08a);
  landGround.add(mesh(BOXG,sand,cx,-0.5,cz,w+0.6,0.2,d+0.6));
  landGround.add(mesh(BOXG,sand,cx,-0.2,POND.z0-0.15,w+0.6,0.4,0.3));landGround.add(mesh(BOXG,sand,cx,-0.2,POND.z1+0.15,w+0.6,0.4,0.3));
  landGround.add(mesh(BOXG,sand,POND.x0-0.15,-0.2,cz,0.3,0.4,d+0.6));landGround.add(mesh(BOXG,sand,POND.x1+0.15,-0.2,cz,0.3,0.4,d+0.6));
  const water=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:0x4fb4e6,transparent:true,opacity:0.72}));water.rotation.x=-Math.PI/2;water.position.set(cx,-0.08,cz);landGround.add(water);
  scene.add(landGround);
})();
(function buildPeakGround(){
  // Volcanic ash / basalt floor for The Peak — replaces the meadow grass plane while Level 3 is loaded.
  peakGround=new THREE.Group();peakGround.visible=false;
  const ash=new THREE.Mesh(new THREE.PlaneGeometry(80,360),lam(0x2a221c));
  ash.rotation.x=-Math.PI/2;ash.position.set(0,-0.02,-110);peakGround.add(ash);
  const basalt=new THREE.Mesh(new THREE.PlaneGeometry(70,200),lam(0x1a1614));
  basalt.rotation.x=-Math.PI/2;basalt.position.set(0,-0.01,-160);peakGround.add(basalt);
  // Warm sand near the opening slopes only
  const warm=new THREE.Mesh(new THREE.PlaneGeometry(40,50),lam(0x3a2a22));
  warm.rotation.x=-Math.PI/2;warm.position.set(0,-0.005,8);peakGround.add(warm);
  // Ember crack ribbons (decorative)
  for(let i=0;i<10;i++){
    const crack=mesh(BOXG,pho(0xff6a20,30,0xff9a3c),rand(-14,14),0.01,rand(-250,20),rand(0.15,0.35),0.02,rand(4,14));
    peakGround.add(crack);
  }
  scene.add(peakGround);
})();

const FLOWERC=[0xff6b81,0xffb347,0xf9f871,0xc084fc,0xff8ac9,0xffffff,0x7ad7ff];
const CUPC=[0xff8a80,0x80d8ff,0xffe57f,0xa5d6a7,0xce93d8,0xffab91];
function addWobbler(x,z,kind){const g=new THREE.Group();const y=groundHeightAt(x,z);g.position.set(x,y,z);
  if(kind==='flower'){const c=FLOWERC[Math.floor(Math.random()*FLOWERC.length)];const h=rand(0.55,0.95);g.add(mesh(CYL,lam(0x4f9a3a),0,h/2,0,0.03,h,0.03));g.add(mesh(SPH,lam(c),0,h,0,0.17,0.12,0.17));g.add(mesh(SPH,lam(0xffe066),0,h+0.06,0,0.07));g.add(mesh(SPH,lam(0x5aa63a),0.12,h*0.4,0,0.14,0.03,0.07));}
  else if(kind==='grass'){for(let i=0;i<3;i++){const b=mesh(CONE,lam(0x6ec24d),rand(-0.1,0.1),0.32,rand(-0.1,0.1),0.06,0.64,0.06);b.rotation.z=rand(-0.25,0.25);b.rotation.x=rand(-0.25,0.25);g.add(b);}}
  else if(kind==='shroom'){g.add(mesh(CYL,lam(0xf3e6c8),0,0.2,0,0.09,0.4,0.09));const cap=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,8,0,TAU,0,Math.PI/2),lam(Math.random()<0.5?0xe74c3c:0xf39c12));cap.position.y=0.36;g.add(cap);g.add(mesh(SPH,lam(0xffffff),0.12,0.5,0.1,0.05,0.03,0.05));}
  else{const h=rand(1,1.5);g.add(mesh(CYL,lam(0x7a9a45),0,h/2,0,0.03,h,0.03));g.add(mesh(CYL,lam(0x6b4a2a),0,h+0.12,0,0.06,0.3,0.06));}
  scene.add(g);wobblers.push({g,x,y,z,tx:0,tz:0,vx:0,vz:0,ph:rand(0,TAU)});}
function addPinwheel(x,z,face){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=face;g.add(mesh(CYL,lam(0x8a5a2b),0,0.7,0,0.03,1.4,0.03));
  const head=new THREE.Group();head.position.set(0,1.42,0.06);const cols=[0xe74c3c,0xf1c40f,0x3498db,0xffffff];
  for(let i=0;i<4;i++){const pv=new THREE.Group();pv.rotation.z=i*Math.PI/2;pv.add(mesh(BOXG,lam(cols[i]),0.24,0,0,0.38,0.17,0.02));head.add(pv);}
  head.add(mesh(SPH,pho(0xd1a83c,120,0xfff0b8),0,0,0.02,0.06));g.add(head);scene.add(g);pinwheels.push({g,head,x,z,spinVel:1,tick:0});}
function addToss(x,y,z){const m=new THREE.Mesh(CUPG,lam(CUPC[toss.length%CUPC.length]));scene.add(m);const t={m,pos:new THREE.Vector3(x,y,z),vel:new THREE.Vector3(),rest:true,r:0.28,h:0.36};m.position.copy(t.pos);toss.push(t);}
function addCupPyramid(x,z,alongZ){const rows=[[-0.6,0,0.6],[-0.3,0.3],[0]];rows.forEach((r,i)=>r.forEach(o=>addToss(alongZ?x:x+o,i*0.36,alongZ?z+o:z)));}
function addNote(x,y,z,hidden){const g=new THREE.Group();g.position.set(x,y,z);const mat=pho(0xffd54a,100,0xffffff);g.add(mesh(SPH,mat,0,0,0,0.17,0.13,0.17));g.add(mesh(BOXG,mat,0.13,0.28,0,0.05,0.5,0.05));g.add(mesh(BOXG,mat,0.22,0.48,0,0.22,0.06,0.05));g.visible=!hidden;scene.add(g);const n={g,x,y,z,got:false,hidden:!!hidden,ph:rand(0,TAU)};notes.push(n);return n;}
function addDust(x,z){const m=new THREE.Mesh(DUSTG,lam(0xc4ad84));m.position.set(x,0,z);scene.add(m);const n=addNote(x,0.7,z,true);dust.push({m,x,z,amt:1,note:n});}
function buildSnoozle(){const g=new THREE.Group();g.add(mesh(SPH,lam(0xdba86a),0,0.34,0,0.42,0.32,0.36));g.add(mesh(SPH,lam(0xc98f4f),0,0.44,0,0.36,0.22,0.31));
  const leaf=mesh(CONE,lam(0x5aa63a),0.05,0.72,0,0.28,0.2,0.28);leaf.rotation.z=-0.2;g.add(leaf);g.add(mesh(CYL,lam(0x4c7d2c),0.02,0.86,0,0.03,0.12,0.03));
  const closed=new THREE.Group();[-0.13,0.13].forEach(x=>{closed.add(mesh(BOXG,lam(0x3a2a1a),x,0.36,0.34,0.11,0.03,0.02));});g.add(closed);
  const open=new THREE.Group();[-0.13,0.13].forEach(x=>{open.add(mesh(SPH,pho(0xffffff,80),x,0.36,0.33,0.07));open.add(mesh(SPH,lam(0x222222),x,0.36,0.39,0.035));});open.visible=false;g.add(open);
  const mouth=mesh(BOXG,lam(0x8b4a3a),0,0.25,0.35,0.08,0.03,0.02);g.add(mouth);
  [-0.15,0.15].forEach(x=>g.add(mesh(SPH,lam(0x8b6a4a),x,0.06,0.1,0.09,0.06,0.09)));
  g.userData={closed,open,mouth};return g;}
function addSnoozle(x,y,z,home,boat){
  const g=buildSnoozle();g.position.set(x,y,z);g.rotation.y=rand(0,TAU);scene.add(g);
  const h=parseSnoozleHome(home);
  snoozles.push({g,state:'sleep',t:0,zz:rand(0,1),ph:rand(0,TAU),baseY:y,home:h,path:h.path||null,boat:!!boat,stepT:0,hopT:0});
}
function parseSnoozleHome(home){
  if(!home)return {x:0,z:0};
  if(Array.isArray(home)){
    const h={x:home[0],z:home[1]};
    let i=2;
    if(home[i]&&Array.isArray(home[i])){h.path=home[i].map(p=>({x:p[0],y:p[1],z:p[2]}));i++;}
    if(typeof home[i]==='number')h.y=home[i];
    return h;
  }
  return {x:home.x,z:home.z,y:home.y,path:home.path||null};
}
function addTree(x,z){addSolid(x,0,z,0.8,3.6,0.8,0x7a4f2b,{surf:'wood'});const c=lam(0x4d9a3a);addDecor(mesh(SPH,c,x,4.2,z,1.9,1.6,1.9));addDecor(mesh(SPH,c,x+0.9,3.6,z-0.4,1.2));addDecor(mesh(SPH,c,x-0.8,3.9,z+0.6,1.1));}
function addFan(x,z,r,top){const g=new THREE.Group();g.position.set(x,0,z);g.add(mesh(CYL,lam(0x4b5563),0,0.15,0,r,0.3,r));const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.08,8,32),pho(0xd1a83c,120,0xfff0b8));ring.rotation.x=Math.PI/2;ring.position.y=0.32;g.add(ring);
  const bl=new THREE.Group();bl.position.y=0.3;for(let i=0;i<3;i++){const b=mesh(BOXG,lam(0x9ca3af),0,0,0,r*1.7,0.04,0.35);b.rotation.y=i*Math.PI/3;bl.add(b);}g.add(bl);scene.add(g);fans.push({g,x,z,r,top,blades:bl,pt:0});}
function registerFinish(f){
  if(FINISH)throw new Error('Level registered more than one FINISH');
  if(!f||![f.x,f.z,f.top].every(Number.isFinite)||typeof f.onAllAwake!=='function'||typeof f.onWin!=='function'||typeof f.update!=='function')
    throw new Error('Invalid FINISH registration');
  FINISH=f;
}
const levelDecor=[];
function addDecor(m){scene.add(m);levelDecor.push(m);return m;}
function clearLevelWorld(){
  clearShadowStick();
  const rem=m=>{
    if(!m)return;
    if(m.parent&&typeof m.parent.remove==='function')m.parent.remove(m);
    else if(typeof scene.remove==='function')scene.remove(m);
    else if(m.visible!=null)m.visible=false;
  };
  for(const s of solids)rem(s.mesh);solids.length=0;
  for(const o of wobblers)rem(o.g);wobblers.length=0;
  for(const o of pinwheels)rem(o.g);pinwheels.length=0;
  for(const o of toss)rem(o.m);toss.length=0;
  for(const o of notes)rem(o.g);notes.length=0;
  for(const o of dust)rem(o.m);dust.length=0;
  for(const o of snoozles)rem(o.g);snoozles.length=0;
  for(const o of fans)rem(o.g);fans.length=0;
  for(const o of steamVents)rem(o.g);steamVents.length=0;
  for(const o of lavas){rem(o.g);if(o.edge)rem(o.edge);}lavas.length=0;
  clearPeakWorld();
  clearSpaceWorld();
  for(const o of clouds)rem(o.g);clouds.length=0;
  for(const o of gloops)rem(o.g);gloops.length=0;
  for(const o of hearts)rem(o.g);hearts.length=0;
  for(const o of crates)rem(o.g);crates.length=0;
  for(const o of powers)rem(o.g);powers.length=0;
  for(const o of sharks)rem(o.g);sharks.length=0;
  for(const o of fish)rem(o.g);fish.length=0;
  for(const o of spikefish)rem(o.g);spikefish.length=0;
  for(const o of clams)rem(o.g);clams.length=0;
  for(const o of kelps)rem(o.g);kelps.length=0;
  for(const o of checks)rem(o.g);checks.length=0;
  for(const m of levelDecor)rem(m);levelDecor.length=0;
  decorKelps.length=0;suspendMotes.length=0;biolumGlows.length=0;
  if(underwaterGroup)while(underwaterGroup.children.length)underwaterGroup.remove(underwaterGroup.children[0]);
  if(CONCH&&CONCH.g)rem(CONCH.g);CONCH=null;
  if(ORGAN&&ORGAN.g)rem(ORGAN.g);ORGAN=null;
  if(WRECK){for(const m of(WRECK.shellMeshes||[]))rem(m);if(WRECK.g)rem(WRECK.g);WRECK=null;}
  if(RAINBOW){rem(RAINBOW);RAINBOW=null;}
  if(WM&&WM.parts)WM.parts.forEach(rem);WM=null;
  if(BOAT&&BOAT.g)rem(BOAT.g);BOAT=null;
  FINISH=null;SNOOZLE_GOAL=0;seenGloop=false;seenCrate=false;
}
function buildWindmill(x,z){const col=addSolid(x,0,z,3.4,6.6,3.4,0xffffff,{surf:'stone'});col.mesh.visible=false;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.75,6.4,18),lam(0xf1e3c2));body.position.set(x,3.2,z);scene.add(body);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(1.55,1.8,18),lam(0xc0392b));cap.position.set(x,7.3,z);scene.add(cap);
  const door=mesh(BOXG,lam(0x6b4a2a),x,0.9,z+1.68,1.0,1.8,0.2);scene.add(door);
  const win=mesh(BOXG,lam(0x8fd3ff),x,3.6,z+1.5,0.6,0.7,0.2);scene.add(win);
  const sails=new THREE.Group();sails.position.set(x,5.6,z+1.85);sails.add(mesh(SPH,pho(0xd1a83c,120,0xfff0b8),0,0,0,0.3));
  for(let i=0;i<4;i++){const a=new THREE.Group();a.rotation.z=i*Math.PI/2;a.add(mesh(BOXG,lam(0x7a4f2b),0,1.9,0,0.16,3.8,0.08));a.add(mesh(BOXG,lam(0xfff5e0),0.42,2.1,0,0.65,2.6,0.03));sails.add(a);}
  scene.add(sails);WM={sails,spin:0.5,party:false,sailX:x,sailZ:z+1.85,x,z,parts:[body,cap,door,win,sails]};
  registerFinish({x,z,top:17,
    winMsg:'Everyone is awake. Look at that rainbow!',
    onAllAwake(){triggerWin();},
    onWin(){WM.party=true;RAINBOW.visible=true;},
    update(dt,t){if(t<0)return;const k=smooth(Math.min(t/1.3,1));RAINBOW.scale.setScalar(0.15+k*0.85);RAINBOW.children.forEach(r=>{r.material.opacity=0.85*k;});}
  });}
function registerUnfinishedFinish(x,z,top){
  registerFinish({x,z,top,
    onAllAwake(){showToast('A Snoozle woke up! ♪ '+rescued+' of '+snoozleGoalCount());},
    onWin(){},
    update(){}
  });
}
// Soft return used by the Stage 4 temporary Peak endpoint — no win banner, no level-complete mark.
function softReturnToPicker(){
  if(!started)return;
  clearLevelWorld();
  won=false;winT=0;confT=0;started=false;rescued=0;gotNotes=0;time=0;
  AU.win=false;
  P.hp=P.maxHp;P.dead=false;P.inv=0;P.fire=false;P.bubble=false;P.hasSkyBlast=false;P.hasStarBeam=false;clearLeapBoost();P.vel.set(0,0,0);
  P.pos.set(P.spawn.x,P.spawn.y,P.spawn.z);
  beginLandLevel();
  const w=$('win');if(w){w.style.display='none';w.style.opacity=1;}
  $('start').style.display='flex';
  document.body.classList.remove('playing');
  touchArmed=false;updatePickerUI();
  const hint=$('hint');if(hint){hint.textContent=CTLTEXT;hint.style.opacity=0.95;}
  updateHUD();
}
window.__softReturnToPicker=softReturnToPicker;
function buildBoat(x,z){const g=new THREE.Group();g.add(mesh(BOXG,lam(0x8b5a2b),0,0.15,0,0.9,0.3,1.7));g.add(mesh(BOXG,lam(0xa86b32),0,0.32,0,1.0,0.06,1.8));g.add(mesh(CYL,lam(0x5b3a1a),0,1.0,-0.1,0.04,1.4,0.04));
  g.add(mesh(BOXG,lam(0xffffff),0,1.15,-0.1,0.9,0.9,0.02));g.add(mesh(BOXG,lam(0xe74c3c),0,1.15,-0.1,0.9,0.25,0.021));scene.add(g);g.position.set(x,-0.1,z);
  BOAT={g,pos:new THREE.Vector3(x,0,z),vel:new THREE.Vector3(),yaw:0};}
function addCloud(x,y,z,s){const g=new THREE.Group();const m=lam(0xffffff);g.add(mesh(SPH,m,0,0,0,1.6*s,1.0*s,1.2*s));g.add(mesh(SPH,m,1.4*s,0.2*s,0,1.1*s,0.8*s,1.0*s));g.add(mesh(SPH,m,-1.3*s,0.1*s,0.2,1.0*s,0.7*s,0.9*s));g.position.set(x,y,z);scene.add(g);clouds.push({g,sp:rand(0.3,0.8)});}

const GOOC=0x8fe36b,GOOGRAV=-20;
const GTYPE={
  small:{size:0.72,hp:1,col:0x8fe36b,dk:0x3f8a1e,stun:0xd6f7b4,hopMul:0.65,spitMul:0.8,hopPow:2.9},
  mid:{size:1.0,hp:2,col:0xa07ce8,dk:0x5b3fa0,stun:0xdccdf8,hopMul:1.0,spitMul:1.0,hopPow:2.2},
  big:{size:1.42,hp:3,col:0xf08a45,dk:0x9c4d17,stun:0xf9cba6,hopMul:1.6,spitMul:1.35,hopPow:1.7}};
function buildGloop(col,dk){const g=new THREE.Group();const body=new THREE.Mesh(SPH,new THREE.MeshPhongMaterial({color:col,shininess:120,specular:0xffffff,transparent:true,opacity:0.92}));body.scale.set(0.6,0.5,0.6);body.position.y=0.5;g.add(body);
  g.add(mesh(SPH,lam(dk),0,0.45,0,0.22,0.2,0.22));
  [-0.2,0.2].forEach(x=>{const e=new THREE.Group();e.position.set(x,0.6,0.5);e.add(mesh(SPH,pho(0xffffff,80,0xffffff),0,0,0,0.11));e.add(mesh(SPH,lam(0x111111),0,0,0.08,0.05));const brow=mesh(BOXG,lam(dk),0,0.14,0.02,0.2,0.05,0.04);brow.rotation.z=x<0?-0.5:0.5;e.add(brow);g.add(e);});
  const mouth=mesh(SPH,lam(dk),0,0.38,0.55,0.1,0.06,0.06);g.add(mouth);g.userData={body,mouth};return g;}
function addGloop(x,z,type){const T=GTYPE[type]||GTYPE.mid;const g=buildGloop(T.col,T.dk);const y=groundHeightAt(x,z);g.position.set(x,y,z);const face=rand(0,TAU);g.rotation.y=face;scene.add(g);
  gloops.push({g,x,z,hx:x,hz:z,y,type:type||'mid',size:T.size,col:T.col,stunCol:T.stun,hopMul:T.hopMul,spitMul:T.spitMul,hopPow:T.hopPow,hp:T.hp,maxHp:T.hp,state:'idle',t:0,spitT:rand(1,2.5),wind:0,vx:0,vz:0,hurtT:0,stunT:0,alive:true,ph:rand(0,TAU),face,hopT:rand(0.5,2),hopA:0});}
const GOOGEO=new THREE.SphereGeometry(1,10,8);
for(let i=0;i<24;i++){const m=new THREE.Mesh(GOOGEO,new THREE.MeshPhongMaterial({color:GOOC,shininess:120,specular:0xffffff,transparent:true,opacity:0.95}));m.scale.setScalar(0.22);m.visible=false;scene.add(m);goos.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,ref:false,trailT:0});}
const PUDG=new THREE.CylinderGeometry(1,1,0.04,18);PUDG.translate(0,0.02,0);
for(let i=0;i<14;i++){const m=new THREE.Mesh(PUDG,new THREE.MeshLambertMaterial({color:0x7fd35a,transparent:true,opacity:0.75}));m.visible=false;scene.add(m);puddles.push({m,x:0,y:0,z:0,life:0,alive:false,size:0.65});}
function addPuddle(x,y,z,size,col){let p=null;for(const q of puddles){if(!q.alive){p=q;break;}}if(!p){p=puddles[0];for(const q of puddles)if(q.life<p.life)p=q;}p.alive=true;p.x=x;p.y=y;p.z=z;p.life=5;p.size=size||0.65;p.m.visible=true;p.m.position.set(x,y+0.01,z);p.m.scale.set(0.2,1,0.2);p.m.material.color.setHex(col||0x7fd35a);p.m.material.opacity=0.75;}
function buildCrate(){const g=new THREE.Group();const band=pho(0xd1a83c,120,0xfff0b8);
  g.add(mesh(BOXG,lam(0xd6a05e),0,0.45,0,0.9,0.9,0.9));
  g.add(mesh(BOXG,band,0,0.45,0,0.94,0.14,0.94));g.add(mesh(BOXG,band,0,0.07,0,0.94,0.1,0.94));g.add(mesh(BOXG,band,0,0.83,0,0.94,0.1,0.94));
  [[0,0.47,0],[0,-0.47,0],[0.47,0,1],[-0.47,0,1]].forEach(q=>{const d=mesh(SPH,pho(0xfff3c4,140,0xffffff),q[0],0.45,q[1],q[2]?0.04:0.13,0.13,q[2]?0.13:0.04);g.add(d);});
  return g;}
function addCrate(x,y,z,item){const g=buildCrate();g.position.set(x,y,z);scene.add(g);
  const sol={min:new THREE.Vector3(x-0.45,y,z-0.45),max:new THREE.Vector3(x+0.45,y+0.9,z+0.45),mesh:g,surf:'wood'};solids.push(sol);
  crates.push({g,x,y,z,item,broken:false,sol});}
function breakCrate(c){if(c.broken)return;c.broken=true;c.g.visible=false;const i=solids.indexOf(c.sol);if(i>=0)solids.splice(i,1);
  SFX.crate();CAM.shake=Math.max(CAM.shake,0.3);rumble(70,0.4,0.2);spawnRing(c.x,c.y+0.05,c.z,0xffe9b0,0.3,5,0.35);
  for(let k=0;k<16;k++)spawnP(c.x+rand(-0.4,0.4),c.y+0.45+rand(-0.4,0.4),c.z+rand(-0.4,0.4),rand(-3.5,3.5),rand(1,4.5),rand(-3.5,3.5),rand(0.08,0.17),Math.random()<0.3?0xd1a83c:0xc98a4b,rand(0.5,0.9),0.2,-9,0.9);
  if(c.item==='fire')addPower(c.x,c.y+0.85,c.z);
  else if(c.item==='bubble')addBubblePower(c.x,c.y+0.85,c.z);
  else if(c.item==='sky')addSkyPower(c.x,c.y+0.85,c.z);
  else if(c.item==='star')addStarPower(c.x,c.y+0.85,c.z);
  else addHeart(c.x,c.y+0.85,c.z);}
function buildFlameItem(){const g=new THREE.Group();
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xff7a1f}),0,0.06,0,0.22,0.58,0.22));
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xffd24a}),0,-0.04,0,0.13,0.36,0.13));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff3c4}),0,-0.18,0,0.12,0.09,0.12));return g;}
function addPower(x,y,z){const g=buildFlameItem();g.position.set(x,y,z);scene.add(g);powers.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0,kind:'fire'});}
function buildBubbleItem(){const g=new THREE.Group();
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xc8f0ff,transparent:true,opacity:0.85}),0,0.08,0,0.24));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.55}),0,0.12,0,0.14));return g;}
function addBubblePower(x,y,z){const g=buildBubbleItem();g.position.set(x,y,z);scene.add(g);powers.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0,kind:'bubble'});}
function buildSkyItem(){const g=new THREE.Group();
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xff9a3c}),0,0.05,0,0.2));
  g.add(mesh(CONE,new THREE.MeshBasicMaterial({color:0xffe9d0,transparent:true,opacity:0.85}),0,0.28,0,0.14,0.36,0.14));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xfff8ee,transparent:true,opacity:0.7}),0,0.42,0,0.1));return g;}
function addSkyPower(x,y,z){const g=buildSkyItem();g.position.set(x,y,z);scene.add(g);powers.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0,kind:'sky'});}
function buildStarItem(){const g=new THREE.Group();
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078}),0,0.05,0,0.22));
  g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85}),0,0.22,0,0.12));
  for(let i=0;i<4;i++){const a=i/4*TAU;g.add(mesh(SPH,new THREE.MeshBasicMaterial({color:0xffe078,transparent:true,opacity:0.75}),Math.cos(a)*0.18,0.12,Math.sin(a)*0.18,0.05));}
  return g;}
function addStarPower(x,y,z){const g=buildStarItem();g.position.set(x,y,z);scene.add(g);powers.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0,kind:'star'});}
function addSteamVent(x,y,z,r){r=r||1.2;const g=new THREE.Group();g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x4a3a32),0,0.08,0,r*0.95,0.16,r*0.95));
  g.add(mesh(CYL,lam(0x2e2420),0,0.14,0,r*0.55,0.08,r*0.55));
  const crack=pho(0xff7a2a,40,0xffa060);g.add(mesh(BOXG,crack,0.12,0.18,0,0.08,0.06,r*0.7));g.add(mesh(BOXG,crack,-0.1,0.18,0.05,0.06,0.05,r*0.5));
  scene.add(g);steamVents.push({g,x,y,z,r,pt:0});}
// Lava is a hazard volume, not a walkable solid. Contact is handled by lavaContact in player.js.
function addLava(x,y,z,w,h,d){
  const g=new THREE.Group();g.position.set(x,y,z);
  // Hazard visual language: bright molten center, hot glow sheet, dark crust rim.
  const body=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff6a18}),0,h/2,0,w,h,d);g.add(body);
  const core=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xffe14a,transparent:true,opacity:0.55}),0,h*0.72,0,w*0.55,h*0.35,d*0.55);g.add(core);
  const glow=mesh(BOXG,new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:0.6}),0,h+0.02,0,w*0.98,0.04,d*0.98);g.add(glow);
  // Ember-red rim so the safe/hot boundary stays obvious.
  const edge=mesh(BOXG,new THREE.MeshBasicMaterial({color:0x8a2010}),0,h+0.01,0,w+0.25,0.03,d+0.25);
  scene.add(g);scene.add(edge);
  lavas.push({g,edge,body,core,glow,x,y,z,w,h,d,role:'lava',min:new THREE.Vector3(x-w/2,y,z-d/2),max:new THREE.Vector3(x+w/2,y+h,z+d/2),pt:0,ph:rand(0,TAU)});
}
// Ambient lava decoration only — collision state is always on (no timed hazard cycles).
function updateLavas(dt){
  for(const lv of lavas){
    lv.pt-=dt;
    if(lv.pt<=0){
      lv.pt=0.1+Math.random()*0.22;
      const bx=lv.x+rand(-lv.w*0.42,lv.w*0.42),bz=lv.z+rand(-lv.d*0.42,lv.d*0.42);
      spawnP(bx,lv.max.y+0.04,bz,rand(-0.35,0.35),rand(0.6,2.0),rand(-0.35,0.35),rand(0.07,0.13),Math.random()<0.45?0xffe9d0:0xff6a18,rand(0.35,0.65),0.55,-1.2,0.75);
      if(Math.random()<0.3)spawnP(bx,lv.max.y+0.08,bz,rand(-1.2,1.2),rand(1.8,4.2),rand(-1.2,1.2),rand(0.04,0.08),0xffc04a,rand(0.25,0.45),0.45,-4,0.9);
    }
    if(lv.glow&&lv.glow.material)lv.glow.material.opacity=0.42+0.18*Math.sin(time*1.6+lv.ph);
    if(lv.core&&lv.core.material)lv.core.material.opacity=0.42+0.2*Math.sin(time*2.1+lv.ph*1.3);
  }
}
const FIREGEO=new THREE.SphereGeometry(1,9,7);
for(let i=0;i<26;i++){const m=new THREE.Mesh(FIREGEO,new THREE.MeshBasicMaterial({color:0xff8a2b}));m.scale.setScalar(0.24);m.visible=false;scene.add(m);fires.push({m,pos:new THREE.Vector3(),vel:new THREE.Vector3(),life:0,alive:false,trailT:0});}
function buildHeart(){const g=new THREE.Group();const m=pho(0xff5a7a,120,0xffffff);g.add(mesh(SPH,m,-0.11,0.1,0,0.16));g.add(mesh(SPH,m,0.11,0.1,0,0.16));const c=mesh(CONE,m,0,-0.06,0,0.26,0.36,0.16);c.rotation.z=Math.PI;g.add(c);g.scale.setScalar(0.9);return g;}
function addHeart(x,y,z){const g=buildHeart();g.position.set(x,y,z);scene.add(g);hearts.push({g,x,y,z,got:false,ph:rand(0,TAU),t:0});}

function hedge(x1,z1,x2,z2){const cx=(x1+x2)/2,cz=(z1+z2)/2,w=Math.abs(x2-x1)+0.9,d=Math.abs(z2-z1)+0.9;
  const sol=addSolid(cx,0,cz,w,1.35,d,0x3f8a2e,{surf:'grass'});
  const along=w>d,len=Math.max(w,d),n=Math.max(2,Math.round(len/1.15));
  for(let i=0;i<n;i++){const t=(i+0.5)/n;const px=along?cx-w/2+t*w:cx,pz=along?cz:cz-d/2+t*d;
    addDecor(mesh(SPH,lam(Math.random()<0.5?0x57a83f:0x4a9633),px+rand(-0.1,0.1),1.28,pz+rand(-0.1,0.1),along?0.66:w*0.6,0.44,along?d*0.6:0.66));}
  return sol;}
function pathTile(x1,z1,x2,z2){const cx=(x1+x2)/2,cz=(z1+z2)/2;addDecor(mesh(BOXG,lam(0xd8c48f),cx,0.02,cz,Math.abs(x2-x1),0.05,Math.abs(z2-z1)));}
function addCheck(x,z,yOpt){const g=new THREE.Group();const y=(yOpt!=null)?yOpt:groundHeightAt(x,z);g.position.set(x,y,z);
  g.add(mesh(CYL,lam(0x9aa4ad),0,0.11,0,0.58,0.22,0.58));
  const post=mesh(CYL,pho(0xd1a83c,140,0xfff0b8),0,0.82,0,0.085,1.45,0.085);g.add(post);
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.31,0.44,12),pho(0x8f8467,50,0x777777));bell.position.y=1.66;g.add(bell);
  const fg=new THREE.Group();fg.position.set(0,1.22,0);const flag=mesh(BOXG,lam(0xc3bcaa),0.3,0,0,0.52,0.34,0.03);fg.add(flag);g.add(fg);
  scene.add(g);checks.push({g,x,z,y,bell,fg,flag,on:false,t:0});}
function updateChecks(dt){for(let i=0;i<checks.length;i++){const c=checks[i];
  if(!c.on&&!P.dead&&Math.hypot(c.x-P.pos.x,c.z-P.pos.z)<2.1&&Math.abs(P.pos.y-c.y)<2.6){
    c.on=true;P.spawn.x=c.x;P.spawn.y=c.y;P.spawn.z=c.z+1.5;
    c.bell.material.color.setHex(0xf5c542);c.flag.material.color.setHex(0xff7a5a);
    SFX.checkpoint();spawnRing(c.x,c.y+0.05,c.z,0xffe9b0,0.3,5,0.5);
    for(let k=0;k<14;k++)spawnP(c.x,c.y+1.75,c.z,rand(-2,2),rand(1,3.5),rand(-2,2),0.08,0xffe36b,0.7,0.3,-4,1);
    if(i>0)showToast('Checkpoint!');}
  if(c.on){c.t+=dt;c.bell.rotation.y=c.t*2.4;c.fg.rotation.y=Math.sin(c.t*2.6)*0.5;}}}
const CONF=[0xff5a7a,0xffc94a,0x6fd45a,0x4fb4e6,0xa15ae0,0xffffff,0xff9a3c];
function buildRainbow(x,z){const g=new THREE.Group();const cols=[0xff5a5a,0xff9a3c,0xffe14a,0x6fd45a,0x4fb4e6,0x5a6fe0,0xa15ae0];
  cols.forEach((c,i)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(27-i*1.6,0.8,7,44,Math.PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.85}));g.add(t);});
  g.position.set(x,0.2,z);g.scale.setScalar(0.15);g.visible=false;scene.add(g);return g;}
function applyWinMessage(){
  const sm=$('win')&&$('win').querySelector('.sm');
  if(sm)sm.textContent=(FINISH&&FINISH.winMsg)||'Everyone is awake. Look at that rainbow!';
}
function triggerWin(){if(won)return;won=true;winT=0;AU.win=true;SFX.fanfare();FINISH.onWin();
  applyWinMessage();
  const w=$('win');w.style.display='flex';w.style.opacity=1;
  CAM.fovKick=Math.max(CAM.fovKick,7);CAM.shake=Math.max(CAM.shake,0.4);rumble(500,0.6,0.7);
  const hint=$('hint');if(hint){hint.textContent=isTouch?'Tap A to pick a level':'Press Space or A to pick a level';hint.style.opacity=1;}
}
function returnToLevelSelect(){
  if(!won||!started)return;
  clearLevelWorld();
  won=false;winT=0;confT=0;started=false;rescued=0;gotNotes=0;time=0;
  AU.win=false;
  P.hp=P.maxHp;P.dead=false;P.inv=0;P.fire=false;P.bubble=false;P.hasSkyBlast=false;P.hasStarBeam=false;clearLeapBoost();P.vel.set(0,0,0);
  P.pos.set(P.spawn.x,P.spawn.y,P.spawn.z);
  beginLandLevel();
  const w=$('win');if(w){w.style.display='none';w.style.opacity=1;}
  $('start').style.display='flex';
  document.body.classList.remove('playing');
  touchArmed=false;updatePickerUI();
  const hint=$('hint');if(hint){hint.textContent=CTLTEXT;hint.style.opacity=0.95;}
  updateHUD();
}
window.__returnToLevelSelect=returnToLevelSelect;
function updateWin(dt){if(!won)return;winT+=dt;
  confT-=dt;if(confT<=0&&winT<16){confT=0.05;const a=rand(0,TAU),r=rand(0,15);
    spawnP(FINISH.x+Math.cos(a)*r,rand(FINISH.top-4,FINISH.top+4),FINISH.z+Math.sin(a)*r,rand(-1.2,1.2),rand(-3,-1),rand(-1.2,1.2),rand(0.09,0.18),CONF[Math.floor(Math.random()*CONF.length)],rand(1.8,2.8),0,-2.2,1);}
  if(winT>9){const w=$('win');w.style.opacity=Math.max(0,1-(winT-9)/2.5);if(winT>11.7)w.style.display='none';}
  // Manual return after a short celebration; auto-return later as a safety net.
  if(winT>3.5&&IN.jump){returnToLevelSelect();return;}
  if(winT>18)returnToLevelSelect();
}

function loadLevel(L){
  clearLevelWorld();
  FINISH=null;
  if(L.physics)applyPhysics(L.physics);
  applySkyBlastTuning(L.skyBlast);
  applyLavaTuning(L);
  applySpaceTuning(L.openSpace);
  CURRENT_LEVEL=L;
  SNOOZLE_GOAL=L.snoozleGoal||0;
  setSong(L.music||'meadow');
  if(L.underwater)beginUnderwaterLevel(L);
  else if(L.peakAtmosphere)beginPeakLevel();
  else if(L.spaceAtmosphere)beginSpaceLevel(L);
  else beginLandLevel();
  P.fire=false;P.bubble=false;P.hasSkyBlast=false;P.hasStarBeam=false;clearLeapBoost();clearGlide();endSpaceThrust();P.puff=true;P.puffAir=0;endHover();P.slam=0;P.lavaRecT=0;P.anchorSettleT=0;P.moveZone='grounded';P.spaceThrust=false;
  if(L.spawn){P.spawn.x=L.spawn.x;P.spawn.y=L.spawn.y;P.spawn.z=L.spawn.z;P.pos.set(L.spawn.x,L.spawn.y,L.spawn.z);P.vel.set(0,0,0);initSafeAnchor(L.spawn.x,L.spawn.y,L.spawn.z);
    if(L.spaceAtmosphere&&typeof landableSurfaceAt==='function'){const land=landableSurfaceAt(L.spawn.x,L.spawn.z);if(land&&L.spawn.y<=land.y+STEP+0.3){P.pos.y=land.y;P.grounded=true;P.moveZone='grounded';P.surf=land.surf||'pad';P.lastGround=time;}}}
  const fence=L.fence;
  for(const s of L.fenceSolids)addSolid(s[0],s[1],s[2],s[3],s[4],s[5],fence);
  for(const p of L.pathTiles)pathTile(p[0],p[1],p[2],p[3]);
  for(const h of L.hedges)hedge(h[0],h[1],h[2],h[3]);
  for(const c of L.checks)addCheck(c[0],c[1],c[2]);
  const TX=L.tower.tx,TZ=L.tower.tz,homes=L.snoozleHomes;
  for(const step of L.steps){
    const k=step[0];
    if(k==='solid')addSolid(step[1],step[2],step[3],step[4],step[5],step[6],step[7],step[8]||undefined);
    else if(k==='note')addNote(step[1],step[2],step[3],step[4]);
    else if(k==='crate')addCrate(step[1],step[2],step[3],step[4]);
    else if(k==='cupPyramid')addCupPyramid(step[1],step[2],step[3]);
    else if(k==='dust')addDust(step[1],step[2]);
    else if(k==='heart')addHeart(step[1],step[2],step[3]);
    else if(k==='gloop')addGloop(step[1],step[2],step[3]);
    else if(k==='boat')buildBoat(step[1],step[2]);
    else if(k==='fan')addFan(step[1],step[2],step[3],step[4]);
    else if(k==='steamVent')addSteamVent(step[1],step[2],step[3],step[4]);
    else if(k==='lava')addLava(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='cinder')addCinder(step[1],step[2],step[3]);
    else if(k==='wisp')addWisp(step[1],step[2]);
    else if(k==='salamander')addSalamander(step[1],step[2],step[3]||{});
    else if(k==='geyser')addGeyser(step[1],step[2],step[3],step[4]);
    else if(k==='volcanoLandmark')addVolcanoLandmark(step[1],step[2],step[3],step[4]);
    else if(k==='peakTuft')addPeakTuft(step[1],step[2],step[3]);
    else if(k==='basaltRock')addBasaltRock(step[1],step[2],step[3],step[4]);
    else if(k==='driftSparks')addDriftSparks(step[1]);
    else if(k==='geodeMouth')addGeodeMouth(step[1],step[2],step[3]);
    else if(k==='crackedGeode')addCrackedGeode(step[1],step[2],step[3],step[4]);
    else if(k==='crystalCluster')addCrystalCluster(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='steamCurtain')addSteamCurtain(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='crystalSparks')addCrystalSparks(step[1],step[2],step[3],step[4]);
    else if(k==='protoEndpoint')addProtoEndpoint(step[1],step[2],step[3],step[4]);
    else if(k==='windmill')buildWindmill(step[1],step[2]);
    else if(k==='rainbow')RAINBOW=buildRainbow(step[1],step[2]);
    else if(k==='pinwheelRow'){for(let i=0;i<step[4];i++)addPinwheel(step[1]+i*step[5],step[2]+i*step[6],step[3]);}
    else if(k==='pinwheelAlt'){for(let i=0;i<step[1];i++)addPinwheel(i%2?step[2]:step[3],step[4]-i*step[5],step[6]);}
    else if(k==='wobblerScatter'){for(let i=0;i<step[1];i++){const a=rand(0,TAU),r=step[6]?Math.sqrt(Math.random())*step[4]:rand(1,step[4]);addWobbler(step[2]+Math.cos(a)*r,step[3]+Math.sin(a)*r,step[5]);}}
    else if(k==='wobblerRand'){for(let i=0;i<step[1];i++)addWobbler(rand(step[2],step[3]),rand(step[4],step[5]),step[6]);}
    else if(k==='pondReeds'){for(let i=0;i<step[1];i++){const t=i/step[1];const x=POND.x0-0.6+t*(POND.x1-POND.x0+1.2);addWobbler(x,i%2?POND.z0-0.8:POND.z1+0.8,'reed');}}
    else if(k==='towerCore'){addSolid(TX,0,TZ,3.6,12,3.6,0x9aa4ad,{surf:'stone'});addSolid(TX,12,TZ,6,0.5,6,0xc98a4b,{surf:'wood'});}
    else if(k==='towerSteps'){for(let i=0;i<step[1];i++){const a=-Math.PI/2+i*0.56;const y=1.1*(i+1);const sl=addSolid(TX+Math.cos(a)*4.3,y-0.4,TZ+Math.sin(a)*4.3,2.4,0.4,2.4,i%2?0xc98a4b:0xd9a262,{surf:'wood'});if(step[2].indexOf(i)>=0)addNote(sl.mesh.position.x,y+0.7,sl.mesh.position.z,false);}}
    else if(k==='bushScatter'){for(let i=0;i<step[1];i++){const x=rand(-46,34),z=rand(-82,24);if(x>-38&&x<24&&z>-74&&z<16)continue;scene.add(mesh(SPH,lam(0x4f9f3f),x,0.35,z,rand(0.9,1.6),rand(0.6,1.0),rand(0.9,1.6)));}}
    else if(k==='cloudScatter'){for(let i=0;i<step[1];i++)addCloud(rand(-44,32),rand(22,30),rand(-80,20),rand(1.5,3));}
    else if(k==='clam')addClam(step[1],step[2],step[3],step[4]);
    else if(k==='shark')addShark(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='fishSchool')addFishSchool(step[1],step[2],step[3],step[4]);
    else if(k==='noteFish')addNoteFish(step[1],step[2],step[3]);
    else if(k==='spikefish')addSpikefish(step[1],step[2],step[3],step[4],step[5],step[6],step[7],step[8]);
    else if(k==='kelpCurtain')addKelpCurtain(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='coralWall')addCoralWall(step[1],step[2],step[3],step[4]);
    else if(k==='coralScatter')addCoralScatter(step[1],step[2],step[3],step[4]);
    else if(k==='sandPath')sandPath(step[1],step[2],step[3],step[4]);
    else if(k==='snoozleShell')addSnoozleShell(step[1],step[2],step[3]);
    else if(k==='sunRays')addSunRays(step[1],step[2],step[3]);
    else if(k==='kelpCluster')addKelpCluster(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='seabedScatter')addSeabedScatter(step[1],step[2],step[3],step[4]);
    else if(k==='dressPlatform')dressPlatform(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='suspendMotes')addSuspendMotes(step[1]);
    else if(k==='trenchFloor')addTrenchFloor(step[1],step[2],step[3],step[4]);
    else if(k==='trenchRock')addTrenchRock(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='biolumCluster')addBiolumCluster(step[1],step[2],step[3]);
    else if(k==='glowPool')addGlowPool(step[1],step[2],step[3],step[4]);
    else if(k==='trenchMotes')addTrenchMotes(step[1],step[2],step[3],step[4]);
    else if(k==='wreck')buildWreck(step[1],step[2]);
    else if(k==='wreckDeck')wreckDeck(step[1],step[2],step[3],step[4],step[5],step[6]||0,step[7]||0,step[8]||0);
    else if(k==='wreckLedge')wreckLedge(step[1],step[2],step[3],step[4],step[5],step[6]||'');
    else if(k==='unfinishedFinish')registerUnfinishedFinish(step[1],step[2],step[3]);
    else if(k==='launchDock')addLaunchDock(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='practicePad')addPracticePad(step[1],step[2],step[3],step[4]);
    else if(k==='spaceRestPad')addSpaceRestPad(step[1],step[2],step[3],step[4]);
    else if(k==='routeTrail')addRouteTrail(step[1],step[2],step[3],step[4],step[5],step[6],step[7]);
    else if(k==='spaceBuoy')addSpaceBuoy(step[1],step[2],step[3],step[4]);
    else if(k==='backdropPlanet')addBackdropPlanet(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='backdropAsteroid')addBackdropAsteroid(step[1],step[2],step[3],step[4]);
    else if(k==='hazardAsteroid')addHazardAsteroid(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='movingAsteroid')addMovingAsteroid(step[1],step[2],step[3],step[4],step[5],step[6],step[7],step[8]);
    else if(k==='saucer')addSaucer(step[1],step[2],step[3],step[4],step[5],{openSpace:!!step[6]});
    else if(k==='cheeseMoonLandmark')addCheeseMoonLandmark(step[1],step[2],step[3],step[4]);
    else if(k==='cheeseMoon')addCheeseMoonBody(step[1],step[2],step[3],step[4]);
    else if(k==='candyPlanet')addCandyPlanet(step[1],step[2],step[3],step[4]);
    else if(k==='candyCaveMouth')addCandyCaveMouth(step[1],step[2],step[3]);
    else if(k==='crystalInterior')addCrystalInterior(step[1],step[2],step[3]);
    else if(k==='starCrate')addStarCrate(step[1],step[2],step[3],step[4]);
    else if(k==='saucerTarget')addSaucerTarget(step[1],step[2],step[3]);
    else if(k==='crackedAsteroid')addCrackedAsteroid(step[1],step[2],step[3],step[4],step[5]);
    else if(k==='spaceStage2Endpoint')addSpaceStage2Endpoint(step[1],step[2],step[3]);
    else if(k==='spaceStage3Endpoint')addSpaceStage3Endpoint(step[1],step[2],step[3]);
    else if(k==='shieldedGate')addShieldedGate(step[1],step[2],step[3],step[4],step[5],step[6]);
    else if(k==='observatoryLandmark')buildStarObservatory(step[1],step[2],step[3]);
    else if(k==='starObservatory')buildStarObservatory(step[1],step[2],step[3]);
    else if(k==='spaceStage4Endpoint')addSpaceStage4Endpoint(step[1],step[2],step[3]);
    else if(k==='blackHoleLandmark')addBlackHoleLandmark(step[1],step[2],step[3]);
    else if(k==='blackHoleFinish')buildBlackHoleFinish(step[1],step[2],step[3]);
    else if(k==='conch')buildConch(step[1],step[2]);
    else if(k==='steamOrgan')buildSteamOrgan(step[1],step[2],step[3]);
  }
  for(const t of L.trees)addTree(t[0],t[1]);
  for(const s of L.snoozles){const x=s[0]!=null?s[0]:TX,y=s[1],z=s[2]!=null?s[2]:TZ;addSnoozle(x,y,z,homes[s[3]],s[4]);}
  if(!FINISH)throw new Error('Level '+L.id+' did not register FINISH');
}
window.__LEVEL=()=>CURRENT_LEVEL;
window.__LEVELS=LEVELS;
window.__isUnderwater=isUnderwater;

