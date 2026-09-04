// Level 4 human-playtest remediation — Candy saucer, purple beam, gate choke,
// Observatory landing, Snoozle 4, Black Hole route.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function holdJump(H,n){H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(n);}
function releaseJump(H){H.ku({code:'Space'});}
function flyToward(H,x,y,z,maxFrames){
  for(let i=0;i<(maxFrames||360);i++){
    const dx=x-H.P.pos.x,dy=y-H.P.pos.y,dz=z-H.P.pos.z;
    const d=Math.hypot(dx,dy,dz)||1;
    H.P.vel.set(dx/d*6.5,dy/d*6.5,dz/d*6.5);
    H.kd({code:'Space',preventDefault(){},repeat:false});
    H.frames(1);
    if(d<3.2)break;
  }
  H.ku({code:'Space'});
}
function wake(H,sn){H.P.pos.set(sn.g.position.x,sn.g.position.y,sn.g.position.z+0.6);H.P.grounded=true;H.P.vel.set(0,0,0);
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(40);}
function fireBeamAt(H,target){
  H.P.yaw=Math.atan2(target.x-H.P.pos.x,target.z-H.P.pos.z);
  H.kd({code:'KeyJ',preventDefault(){},repeat:false});H.frames(2);H.ku({code:'KeyJ'});
  for(let i=0;i<50;i++)H.frames(1);
}
function breakRenewableCrate(H,crate){
  H.P.pos.set(crate.x,crate.y+0.5,crate.z);
  H.P.grounded=true;H.P.yaw=0;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});
  H.frames(35);
}
function padTop(cp){return cp.pad.y+0.55;}
function saucerClearance(e,cp){
  // Visible body bottom is near origin (disc sits ~0.24*size above). Require origin above pad.
  return e.y-padTop(cp);
}

// ---- version ----
{
  const H=boot();
  ok(H.getCamDiag().VERSION_BASE==='v53 · Desert Level 5','version stamp v53');
}

// ---- Issue 1: Candy surface enemies clear of landable pad ----
{
  const H=boot();H.startLevel(3);H.frames(12);
  const cp=H.getSpace().candyPlanet;
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  const dummy=H.getSpace().saucers.find(s=>s.targetDummy);
  ok(!!cp&&!!mid&&!!dummy,'candy pad, mid saucer, and target dummy exist');
  ok(saucerClearance(mid,cp)>1.0,'mid saucer hover clears candy pad top');
  ok(saucerClearance(dummy,cp)>1.0,'target dummy hover clears candy pad top');
  ok(Math.hypot(mid.x-cp.pad.x,mid.z-cp.pad.z)<cp.pad.w*0.55,'mid saucer over landable pad footprint');
  ok(Math.hypot(dummy.x-cp.pad.x,dummy.z-cp.pad.z)<cp.pad.w*0.55,'target dummy over landable pad footprint');
  // Patrol must not settle into the deck
  H.P.pos.set(cp.pad.x,padTop(cp),cp.pad.z);H.P.grounded=true;H.P.vel.set(0,0,0);
  for(let i=0;i<90;i++)H.frames(1);
  ok(saucerClearance(mid,cp)>0.95,'mid saucer stays clear during patrol');
  ok(saucerClearance(dummy,cp)>0.95,'target dummy stays clear during patrol');
}

// ---- Issue 1b: surface attack + Star Beam can hit real saucer ----
{
  const H=boot();H.startLevel(3);H.frames(10);
  const cp=H.getSpace().candyPlanet;
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  const crate=H.getSpace().starCrates[0];
  H.P.pos.set(cp.pad.x,padTop(cp),cp.pad.z);H.P.grounded=true;H.P.moveZone='grounded';H.P.vel.set(0,0,0);
  breakRenewableCrate(H,crate);
  ok(H.P.hasStarBeam,'Star Beam acquired on candy pad');
  H.P.pos.set(mid.x,padTop(cp),mid.z+2.2);H.P.grounded=true;
  fireBeamAt(H,mid);
  ok(mid.state==='dying'||!mid.alive||mid.hp<=0,'Star Beam defeats candy mid saucer from pad');
}

// ---- Issue 1c: spin from pad can reach mid saucer ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const cp=H.getSpace().candyPlanet;
  const mid=H.getSpace().saucers.find(s=>!s.targetDummy&&s.surfaceGate&&s.type==='mid'&&s.z>-210);
  H.P.pos.set(mid.x,padTop(cp),mid.z+0.8);H.P.grounded=true;H.P.vel.set(0,0,0);H.P.yaw=Math.PI;
  const hp0=mid.hp;
  H.kd({code:'KeyK',preventDefault(){},repeat:false});H.frames(3);H.ku({code:'KeyK'});H.frames(20);
  ok(mid.hp<hp0||mid.state==='dying'||!mid.alive,'spin from candy pad can hit mid saucer');
}

// ---- Issue 2: Star Beam is purple ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const cols=H.getSpace().STAR_BEAM_COLORS;
  ok(cols&&cols.indexOf(0xa070ff)>=0&&cols.indexOf(0xc8b0ff)>=0,'Star Beam palette includes violet + lavender');
  ok(cols.indexOf(0xffe078)<0&&cols.indexOf(0xffd700)<0,'Star Beam palette is not yellow/gold');
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','src','space.js'),'utf8');
  const beamFn=src.slice(src.indexOf('function fireStarBeam'),src.indexOf('function beamHitPoint'));
  ok(/0xa070ff/.test(beamFn)&&/0xc8b0ff/.test(beamFn),'fireStarBeam emits purple/lavender particles');
  ok(!/0xffe078/.test(beamFn)&&!/0xffd070/.test(beamFn),'fireStarBeam does not emit yellow route-star colors');
}

// ---- Issue 3: closed gate blocks center / above / below / left / right ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const gate=H.getSpace().shieldedGates[0];
  const post={x:28,y:18,z:-256};
  ok(!!gate&&!gate.opened,'gate closed for bypass attempts');
  ok(gate.barriers&&gate.barriers.length>=4,'asteroid choke barriers frame the opening');
  const attempts=[
    {name:'center',x:gate.x,y:gate.y+gate.h*0.45,z:gate.z+6},
    {name:'above',x:gate.x,y:gate.y+gate.h+6,z:gate.z+6},
    {name:'below',x:gate.x,y:gate.y-5,z:gate.z+6},
    {name:'left',x:gate.x-18,y:gate.y+gate.h*0.45,z:gate.z+6},
    {name:'right',x:gate.x+18,y:gate.y+gate.h*0.45,z:gate.z+6}
  ];
  for(const a of attempts){
    H.P.pos.set(a.x,a.y,a.z);H.P.vel.set(0,0,-8);H.P.grounded=false;H.P.moveZone='openSpace';
    H.P.hasStarBeam=false;
    for(let i=0;i<70;i++){
      H.kd({code:'Space',preventDefault(){},repeat:false});
      H.P.vel.z=-8;
      H.frames(1);
    }
    H.ku({code:'Space'});
    const reached=H.P.pos.z<gate.z-2.5&&Math.hypot(H.P.pos.x-post.x,H.P.pos.z-post.z)<10;
    ok(!reached&&H.P.pos.z>gate.z-2.2,'closed gate blocks '+a.name+' bypass');
  }
}

// ---- Issue 3b: Star Beam opens gate; natural passage succeeds ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const gate=H.getSpace().shieldedGates[0];
  const crate=H.getSpace().starCrates.find(c=>c.renewable&&c.z<-240);
  breakRenewableCrate(H,crate);
  H.P.pos.set(gate.x,gate.y+gate.h*0.4,gate.z+4);H.P.grounded=false;H.P.moveZone='openSpace';
  fireBeamAt(H,gate);
  ok(gate.opened,'Star Beam opens shielded gate');
  ok(!gate.solid,'opened gate removes blocking shield solid');
  ok(gate.barriers.every(b=>H.W.solids.indexOf(b)>=0),'asteroid barriers remain after open');
  flyToward(H,gate.x,gate.y+gate.h*0.4,gate.z-5,180);
  ok(H.P.pos.z<gate.z-1.5,'opened gate allows passage through the opening');
  flyToward(H,28,18,-256,220);
  ok(H.P.pos.z<-254,'post-gate rest route reachable after open');
}

// ---- Issue 4: Observatory main deck landable at several approaches ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const ox=10,oy=24,oz=-272;
  const decks=H.W.solids.filter(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-ox,(s.min.z+s.max.z)/2-oz)<6);
  ok(decks.length>=2,'Observatory has multiple landable deck solids');
  const main=decks.reduce((a,b)=>((b.max.x-b.min.x)*(b.max.z-b.min.z)>((a.max.x-a.min.x)*(a.max.z-a.min.z))?b:a));
  ok((main.max.x-main.min.x)>=9.5&&(main.max.z-main.min.z)>=9.5,'main deck collision matches large visible platform');
  const approaches=[
    {name:'center',x:ox,y:oy+5,z:oz+6,frames:160},
    {name:'left',x:ox-3.2,y:oy+4.5,z:oz+5,frames:160},
    {name:'right',x:ox+3.2,y:oy+4.5,z:oz+5,frames:160},
    {name:'high',x:ox,y:oy+7.5,z:oz+5,frames:280}
  ];
  for(const a of approaches){
    const H2=boot();H2.startLevel(3);H2.frames(6);
    H2.P.pos.set(a.x,a.y,a.z);H2.P.vel.set(0,-2.2,-2.8);H2.P.grounded=false;H2.P.moveZone='openSpace';
    H2.ku({code:'Space'});
    for(let i=0;i<a.frames;i++){
      if(!H2.P.grounded){
        H2.P.vel.x=moveSoft(H2.P.vel.x,(ox-H2.P.pos.x)*0.55);
        H2.P.vel.z=moveSoft(H2.P.vel.z,(oz-H2.P.pos.z)*0.55);
        if(H2.P.vel.y>-3.2)H2.P.vel.y-=0.06;
      }
      H2.frames(1);
      if(H2.P.grounded)break;
    }
    ok(H2.P.grounded,'Observatory '+a.name+' approach lands on deck');
    ok(H2.P.grounded&&(H2.P.moveZone==='grounded'||H2.P.surf==='pad'),'Observatory '+a.name+' stays grounded on deck');
    ok(Math.abs(H2.P.pos.y-main.max.y)<0.45,'Observatory '+a.name+' stands on deck top');
    // Takeoff back to open space
    holdJump(H2,18);
    ok(H2.getMovement().spaceThrust||H2.getMovement().zone==='openSpace'||!H2.P.grounded,'Observatory '+a.name+' can launch back into flight');
    releaseJump(H2);
  }
}
function moveSoft(v,t){return v+(t-v)*0.15;}

// ---- Issue 5: Snoozle 4 on landable Observatory deck, readable from landing ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const sn=H.W.snoozles[3];
  const ox=10,oy=24,oz=-272;
  const main=H.W.solids.find(s=>s.role==='landable'&&Math.hypot((s.min.x+s.max.x)/2-ox,(s.min.z+s.max.z)/2-oz)<2&&(s.max.x-s.min.x)>8);
  ok(!!main,'main Observatory deck solid found');
  ok(sn.g.position.x>main.min.x&&sn.g.position.x<main.max.x,'Snoozle 4 within main deck X');
  ok(sn.g.position.z>main.min.z&&sn.g.position.z<main.max.z,'Snoozle 4 within main deck Z');
  ok(sn.g.position.y>main.max.y&&sn.g.position.y<main.max.y+2.2,'Snoozle 4 clearly above deck, not buried');
  ok(sn.g.position.z<oz-1.5,'Snoozle 4 toward Black Hole side of deck');
  // From normal landing center, Snoozle is a short walk — not a secret hunt
  ok(Math.hypot(sn.g.position.x-ox,sn.g.position.z-oz)<5.5,'Snoozle 4 near main landing center');
  H.P.pos.set(ox,main.max.y,oz);H.P.grounded=true;H.P.vel.set(0,0,0);
  wake(H,sn);
  ok(sn.state!=='sleep','Snoozle 4 wakes from Observatory deck');
}

// ---- Issue 6: Black Hole activation + route cues from Observatory ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  const bh=H.getSpace().blackHoleFinish;
  const beacons0=H.getSpace().routeBeacons.length;
  for(let i=0;i<3;i++)wake(H,H.W.snoozles[i]);
  ok(!bh.active,'Black Hole inactive before fourth Snoozle');
  // Inactive landmark still large enough to read from Observatory
  ok(bh.bounceR>=7.5||bh.portalR>=6.5,'inactive Black Hole has large readable radius');
  wake(H,H.W.snoozles[3]);
  ok(bh.active,'Snoozle 4 activates Black Hole');
  ok(bh.portal&&bh.portal.visible,'active portal visible');
  ok(H.getSpace().routeBeacons.length>beacons0,'activation ignites extra route markers');
  const ignited=H.getSpace().routeBeacons.filter(b=>b.userData&&b.userData.pathIgnite);
  ok(ignited.length>=8,'gold path markers ignite toward Black Hole');
}

// ---- Natural Observatory → Black Hole → warp journey ----
{
  const H=boot();H.startLevel(3);H.frames(8);
  for(let i=0;i<4;i++)wake(H,H.W.snoozles[i]);
  const bh=H.getSpace().blackHoleFinish;
  ok(bh.active,'portal ready for final flight');
  H.P.pos.set(10,24.5,-272);H.P.grounded=true;H.P.vel.set(0,0,0);
  holdJump(H,20);releaseJump(H);
  flyToward(H,bh.x,bh.y,bh.z,520);
  ok(Math.hypot(H.P.pos.x-bh.x,H.P.pos.y-bh.y,H.P.pos.z-bh.z)<bh.triggerR+1.5,'natural flight reaches active Black Hole');
  for(let i=0;i<8;i++)H.frames(1);
  ok(bh.warping||H.CAM.mode==='warp'||H.W.won||bh.voidActive,'entering portal starts warp/finish');
}

// ---- Finish remediation still intact ----
{
  const H=boot();H.startLevel(3);H.frames(6);
  const bh=H.getSpace().blackHoleFinish;
  ok(!!bh.voidGroup,'finish void still constructed');
  ok(typeof H.getSpace().isSpaceWarpCamera==='function','warp camera ownership helper present');
}

// ---- Levels 1–3 untouched boot ----
{
  const H1=boot({autostart:true,level:0});
  ok(H1.getLevel().id==='level1','Level 1 boot unchanged');
  const H2=boot();H2.startLevel(1);
  ok(H2.getLevel().id==='level2','Level 2 boot unchanged');
  const H3=boot();H3.startLevel(2);
  ok(H3.getLevel().id==='level3','Level 3 boot unchanged');
}

report();
