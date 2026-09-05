// Level 5 human-playtest enhancement — deterministic geometry and preservation coverage.
let failures=0;
function ok(cond,msg){if(!cond)failures++;console.log((cond?'PASS ':'FAIL ')+msg);}
function report(){if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}console.log('\nall passed');}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}

// Camel rendered forward axis must agree with the same yaw convention that drives movement.
{
  const H=boot();H.startLevel(4);H.frames(4);
  const c=H.W.camels[0],D=H.window.__DESERT;
  H.P.pos.set(c.x,c.y,c.z+0.6);H.P.grounded=true;H.P.lastGround=99;
  ok(D.mountCamel(c)&&H.P.camel===c,'camel remains mountable for orientation verification');
  const neck=c.g.userData&&c.g.userData.neck;
  ok(!!neck&&neck.position.z>0,'camel head/neck is authored on local +Z, matching Pling forward');
  const headings=[['north',Math.PI],['south',0],['east',Math.PI/2],['west',-Math.PI/2],['diagonal',Math.PI/4]];
  for(const [name,yaw] of headings){
    H.P.yaw=yaw;H.P.vel.set(Math.sin(yaw)*5,0,Math.cos(yaw)*5);H.frames(1);
    const r=c.g.rotation.y,nx=Math.sin(r)*neck.position.z,nz=Math.cos(r)*neck.position.z;
    const ml=Math.hypot(H.P.vel.x,H.P.vel.z)||1,nl=Math.hypot(nx,nz)||1;
    const dot=(nx*H.P.vel.x+nz*H.P.vel.z)/(nl*ml);
    ok(dot>0.98,`camel nose direction follows ${name} movement vector`);
    const pling=H.window.__PLAYER&&H.window.__PLAYER();
    ok(!pling||Math.abs(Math.atan2(Math.sin(pling.rotation.y-r),Math.cos(pling.rotation.y-r)))<0.08,`Pling faces with camel on ${name} heading`);
  }
  ok(D.dismountCamel(true)&&!H.P.camel&&!c.mounted,'camel remains dismountable after orientation turns');
}

// Added journey must contain distinct authored beats rather than empty distance.
{
  const H=boot();H.startLevel(4);H.frames(4);
  const spurs=H.W.solids.filter(s=>s.role==='desertSpur');
  const passWalls=H.W.solids.filter(s=>s.role==='desertPassWall');
  const ramps=H.W.solids.filter(s=>s.role==='desertRamp');
  const final=H.W.quicksands.find(q=>q.role==='final');
  ok(spurs.length>=11,'extended route has two substantial sandstone switchback runs');
  ok(passWalls.length===2,'extended route has a canyon-framed central terraced pass');
  ok(ramps.length>=20,'terraced traversal remains authored with shallow walkable steps');
  ok(H.W.cacti.length>=20,'later cactus gauntlet adds meaningful route-reading obstacles');
  ok(H.W.quicksands.filter(q=>q.role==='ordinary').length===3,'ordinary quicksand count/behavior stays preserved across the longer route');
  ok(!!final&&final.z<-800,'finale is materially farther from spawn than the original short route');
  const beatZ=[];
  for(const s of H.W.solids)if(['desertSpur','desertPassWall','desertRamp','cliff'].includes(s.role))beatZ.push((s.min.z+s.max.z)/2);
  for(const q of H.W.quicksands)beatZ.push(q.z);
  for(const c of H.W.cacti)beatZ.push(c.z);
  for(const l of H.W.lizards)beatZ.push(l.z);
  beatZ.sort((a,b)=>b-a);
  let maxGap=0;for(let i=1;i<beatZ.length;i++)maxGap=Math.max(maxGap,beatZ[i-1]-beatZ[i]);
  ok(maxGap<55,'extended journey has no long authored no-interaction gap (max '+maxGap.toFixed(1)+')');
}

// Finale canyon must close every ordinary walk-around route while preserving the central jump.
{
  const H=boot();H.startLevel(4);H.frames(4);
  const cliffs=H.W.solids.filter(s=>s.role==='cliff');
  const central=cliffs.find(s=>Math.abs((s.min.x+s.max.x)/2)<0.2&&s.max.y>7);
  const final=H.W.quicksands.find(q=>q.role==='final');
  ok(!!central&&!!final,'central final cliff and special quicksand remain distinct authored finale pieces');
  function intervalsAt(z){return cliffs.filter(s=>z>s.min.z&&z<s.max.z).map(s=>[s.min.x,s.max.x]).sort((a,b)=>a[0]-b[0]);}
  function maxGapAt(z){const a=intervalsAt(z);let edge=-20,g=0;for(const [lo,hi] of a){if(hi<=edge)continue;g=Math.max(g,lo-edge);edge=Math.max(edge,hi);}g=Math.max(g,20-edge);return g;}
  ok(maxGapAt(-789)<0.05,'left/right/wide/diagonal ground bypasses are closed at the cliff face');
  const approach=intervalsAt(-770);
  const left=approach.some(([lo,hi])=>lo<=-19.5&&hi>=-9.1),right=approach.some(([lo,hi])=>lo<=9.1&&hi>=19.5);
  ok(left&&right,'sandstone ridges block wide-left and wide-right finale approaches while center ramp stays open');
  const poolLeft=final.x-final.w/2,poolRight=final.x+final.w/2;
  const sideAtPool=intervalsAt(final.z),leftInner=Math.max(...sideAtPool.filter(x=>x[1]<0).map(x=>x[1])),rightInner=Math.min(...sideAtPool.filter(x=>x[0]>0).map(x=>x[0]));
  ok(poolLeft-leftInner<0.36&&rightInner-poolRight<0.36,'final quicksand meets canyon ridges too tightly for mounted or on-foot side bypass');
  const cliffBack=central.min.z,poolFront=final.z+final.d/2;
  ok(Math.abs(cliffBack-poolFront)<0.15,'mandatory cliff drop lands directly into reachable special quicksand');
}

// Oasis should be materially denser without replacing the original finish contract.
{
  const H=boot();H.startLevel(4);H.frames(4);
  const D=H.window.__DESERT.state;
  ok(D&&D.oasis&&D.oasisGroup,'oasis finish is still built through the existing Desert finish system');
  ok(D.oasisGroup.children.length>=115,'oasis tableau has materially richer foliage/shoreline density');
  ok(H.W.FINISH&&H.W.FINISH.winMsg==='You found the green oasis!','existing oasis victory message/flow is preserved');
}

// Levels 1–4 must remain independent of the Level 5 desert changes.
{
  for(let i=0;i<4;i++){
    const H=boot();H.startLevel(i);H.frames(3);
    ok(H.getLevel().id===`level${i+1}`&&!H.window.__isDesert(),`Level ${i+1} remains non-desert and selectable`);
  }
}

// Level 5 now carries the normal four-Snoozle progression across safe route lanes.
{
  const H=boot();H.startLevel(4);H.frames(4);
  const L=H.getLevel(),sn=H.W.snoozles;
  ok(L.snoozleGoal===4&&H.window.__snoozleGoal()===4,'Level 5 requires exactly four Snoozles');
  ok(sn.length===4&&L.snoozleHomes.length===4,'Level 5 instantiates four Snoozles with four homes');
  const zs=sn.map(s=>s.g.position.z);
  ok(zs[0]>-20&&zs[1]<-100&&zs[1]>-170&&zs[2]<-330&&zs[2]>-410&&zs[3]<-700,'Snoozles are distributed from early route through pre-finale');
  for(let i=0;i<sn.length;i++){
    const x=sn[i].g.position.x,z=sn[i].g.position.z;
    const inSand=H.W.quicksands.some(q=>Math.abs(x-q.x)<q.w*0.5+0.4&&Math.abs(z-q.z)<q.d*0.5+0.4);
    const nearCactus=H.W.cacti.some(c=>Math.hypot(x-c.x,z-c.z)<1.7);
    const inRock=H.W.solids.some(s=>['desertSpur','desertPassWall','cliff','cactus'].includes(s.role)&&x>s.min.x-0.4&&x<s.max.x+0.4&&z>s.min.z-0.4&&z<s.max.z+0.4);
    ok(!inSand&&!nearCactus&&!inRock,'Snoozle '+(i+1)+' sits in a safe readable lane');
  }
  for(let i=0;i<sn.length;i++){
    H.P.pos.set(sn[i].g.position.x,0,sn[i].g.position.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;H.tap('KeyK',2);H.frames(2);
    ok(sn[i].state!=='sleep','Snoozle '+(i+1)+' wakes through normal player spin interaction');
    ok(sn.filter(s=>s.state!=='sleep').length===i+1,'Snoozle count advances to '+(i+1)+'/4');
    H.frames(40);
  }
  const final=H.W.quicksands.find(q=>q.role==='final');H.P.pos.set(final.x,0,final.z);H.P.grounded=true;
  ok(H.window.__DESERT.beginFinalQuicksand(final),'special final quicksand unlocks after all four Snoozles wake');
}

// The special final sand is visibly gated before the four-Snoozle objective is complete.
{
  const H=boot();H.startLevel(4);H.frames(4);const final=H.W.quicksands.find(q=>q.role==='final'),hp=H.P.hp;
  H.P.safeAnchor.set(0,7.22,-780);H.P.pos.set(final.x,0,final.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.frames(2);
  ok(!H.window.__DESERT.state.finish&&!H.W.won,'final sand cannot start the portal before Snoozles are awake');
  ok(H.P.quicksandRecT>0&&H.P.hp===hp-1,'locked final sand uses normal checkpoint recovery instead of a second win path');
}

// Airborne dismount inherits the camel's vertical motion, lands naturally, and stays reusable.
for(const tc of [{name:'takeoff',frames:4,sign:1},{name:'apex',frames:22,sign:0},{name:'descent',frames:34,sign:-1}]){
  const H=boot();H.startLevel(4);H.frames(4);const D=H.window.__DESERT,c=H.W.camels[0],count=H.W.camels.length;
  H.P.pos.set(c.x,0,c.z);H.P.vel.set(0,0,0);H.P.grounded=true;H.P.lastGround=99;ok(D.mountCamel(c),tc.name+' case mounts camel');
  H.kd('Space');H.frames(tc.frames);ok(!H.P.grounded&&H.P.pos.y>0.05,tc.name+' case reaches airborne state');H.tap('KeyJ',1);H.ku('Space');H.frames(1);
  ok(!H.P.camel&&!c.mounted&&c.airborne,tc.name+' dismount separates rider while camel stays physically airborne');
  if(tc.sign>0)ok(c.vy>0,tc.name+' camel retains upward velocity after early dismount');
  else if(tc.sign<0)ok(c.vy<0,tc.name+' camel retains descending velocity after late dismount');
  else ok(Math.abs(c.vy)<5,tc.name+' camel is near apex rather than frozen');
  const y0=c.y;H.frames(110);
  ok(!c.airborne&&c.grounded&&Math.abs(c.y)<0.06,tc.name+' camel falls back to valid ground and settles');
  ok(c.y<y0||tc.sign>0,tc.name+' camel vertical lifecycle progresses instead of freezing');
  ok(H.W.camels.length===count,'camel does not duplicate during '+tc.name+' dismount');
  H.P.pos.set(c.x,0,c.z);H.P.vel.set(0,0,0);H.P.grounded=true;ok(D.mountCamel(c),'landed camel remains mountable after '+tc.name+' dismount');
}

report();