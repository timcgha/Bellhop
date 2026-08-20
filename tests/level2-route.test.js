// Stage 4: Level 2 route through The Shallows, Kelp Forest, and The Shoal.
let failures=0;
function ok(cond,msg){
  if(!cond) failures++;
  console.log((cond?'PASS ':'FAIL ')+msg);
}
function report(){
  if(failures){console.log(`\n${failures} FAILED`);process.exit(1);}
  console.log('\nall passed');
}
function boot(opts){return require('./harness.js')(Object.assign({autostart:false},opts));}
function startL2(H){H.startLevel(1);}
function gust(H){H.P.gustCD=0;H.tap('KeyJ',2);}
function kelp(H,id){return H.W.kelps.find(k=>k.id===id);}
function grantBubble(H){
  const c=H.W.crates.find(x=>x.item==='bubble'&&!x.broken);
  if(c){H.P.pos.set(c.x+0.8,c.y,c.z);H.P.vel.set(0,0,0);H.frames(4);H.tap('KeyK',2);H.frames(8);
    const w=H.W.powers.find(p=>!p.got&&p.kind==='bubble');
    if(w){H.P.pos.set(w.x,w.y-0.5,w.z);H.P.vel.set(0,0,0);H.frames(6);}}
  else{
    const safety=H.W.clams.find(c=>c.role==='safety');
    H.P.pos.set(safety.x,safety.y,safety.z);H.P.vel.set(0,0,0);H.frames(12);
  }
  return H.P.bubble;
}
const SHALLOWS_Z=-18;
const SHOAL_Z=-66;
function canStand(H,x,z,frames){
  H.P.pos.set(x,3,z);H.P.vel.set(0,0,0);H.frames(frames||50);
  return H.P.pos.y<1.5&&Math.hypot(H.P.pos.x-x,H.P.pos.z-z)<1.5;
}

// ---- underwater presentation, not Level 1 meadow ----
{
  const H=boot();startL2(H);
  ok(H.getLevel().underwater,'Level 2 is underwater');
  ok(H.W.kelps.length>=2,'Level 2 has kelp curtains');
  ok(H.W.underwaterGroup,'Level 2 builds underwater presentation group');
  ok(H.W.fish.length>0,'Level 2 has schooling fish visible early');
}

// ---- snoozles in correct areas ----
{
  const H=boot();startL2(H);
  ok(H.W.snoozles.length===3,'Stage 5 has three snoozles');
  ok(H.W.snoozles[0].g.position.z>-16,'Snoozle 1 is in The Shallows');
  ok(H.W.snoozles[1].g.position.z<-40&&H.W.snoozles[1].g.position.z>-70,'Snoozle 2 is in the Kelp Forest');
  ok(H.W.snoozles[1].g.position.y>2,'Snoozle 2 sits on a raised shelf');
  ok(H.W.snoozles[2].g.position.y>12,'Snoozle 3 is in the crow\'s nest');
  ok(H.W.snoozles[2].g.position.z<-175,'Snoozle 3 is in The Wreck');
}

// ---- kelp curtain and secret wall ----
{
  const H=boot();startL2(H);
  const c=kelp(H,'curtain');
  ok(c&&!c.parted,'mandatory-route kelp curtain starts closed');
  H.P.pos.set(c.cx,c.h*0.5,c.cz+3);H.P.yaw=Math.PI;H.frames(4);
  gust(H);H.frames(20);
  ok(c.parted,'early kelp curtain parts on underwater gust');
}
{
  const H=boot();startL2(H);
  const s=kelp(H,'secret');
  const n0=H.W.notes.length;
  ok(s&&s.secret,'secret kelp wall exists');
  ok(H.W.notes.length>=n0,'secret alcove notes already count in notes.length from build');
  H.P.pos.set(s.cx,s.h*0.5,s.cz+3);H.P.yaw=Math.PI;H.frames(4);
  gust(H);H.frames(25);
  ok(s.parted,'secret kelp wall opens on gust');
}

// ---- Kelp Forest teaching: bubble, fish, note fish ----
{
  const H=boot();startL2(H);
  const crate=H.W.crates.find(x=>x.item==='bubble');
  ok(crate&&crate.z<-25&&crate.z>-35,'Kelp Forest has the first bubble-power crate');
  ok(H.W.fish.filter(f=>f.kind==='ordinary').length>=10,'teaching area has a large ordinary fish school');
  ok(H.W.fish.some(f=>f.kind==='note'),'teaching school includes a golden note fish');
}

// ---- teaching order regression ----
{
  const H=boot();startL2(H);
  const shallows=(z)=>z>SHALLOWS_Z;
  const beforeShoal=(z)=>z>SHOAL_Z;
  ok(!H.W.clams.some(c=>shallows(c.z)),'no clam bubble source in The Shallows');
  ok(!H.W.crates.some(c=>c.item==='bubble'&&shallows(c.z)),'no bubble crate in The Shallows');
  ok(!H.W.sharks.some(s=>shallows(s.z)),'no shark in The Shallows');
  ok(!H.W.spikefish.some(s=>beforeShoal(s.z1)),'no spikefish before the Shoal introduction');
  const intro=H.W.crates.find(c=>c.item==='bubble');
  ok(intro&&intro.z<-25&&intro.z>-35,'first production bubble-power source is the Kelp Forest crate');
  ok(H.W.clams.filter(c=>c.role==='safety').length===1,'only one safety clam for progression');
  ok(H.W.clams.filter(c=>c.role==='wreck_entrance').length===1,'one optional wreck entrance clam after the Shoal');
  ok(H.W.clams.every(c=>c.role==='safety'||c.role==='wreck_entrance'||!c.role),'no extra production clams besides safety and wreck entrance');
}
{
  const H=boot();startL2(H);
  ok(H.W.notes.length===3,'production Level 2 has three counted notes after fixture removal');
  const hidden=H.W.notes.filter(n=>n.hidden).length;
  const visible=H.W.notes.filter(n=>!n.hidden).length;
  ok(hidden===1&&visible===2,'note breakdown: one hidden held note fish + two secret alcove notes');
  const noteFish=H.W.fish.find(f=>f.kind==='note');
  ok(noteFish&&noteFish.note&&noteFish.note.hidden,'held note fish note counts from build time');
}

// ---- Shoal spikefish teaching ----
{
  const H=boot();startL2(H);
  const open=H.W.spikefish.find(s=>s.role==='open');
  const mand=H.W.spikefish.find(s=>s.role==='mandatory');
  ok(open,'first spikefish patrols open water');
  ok(mand,'mandatory spikefish blocks the narrow passage');
  ok(open.z<-70&&open.z>-85,'open spikefish sits before the narrow passage');
  // bypass: wide route west of the open spikefish
  ok(canStand(H,-4,open.z-2,60),'open spikefish encounter can be bypassed without bubble power');
}
{
  const H=boot();startL2(H);
  const mand=H.W.spikefish.find(s=>s.role==='mandatory');
  const safety=H.W.clams.find(c=>c.role==='safety');
  ok(safety,'renewable safety clam sits at the mandatory passage');
  ok(Math.hypot(safety.x-mand.x,safety.z-mand.z)<4,'safety clam is beside the mandatory spikefish');
  grantBubble(H);
  ok(H.P.bubble,'player can gain bubble power at the passage');
  H.P.pos.set(mand.x-2*Math.sin(0),mand.y-0.5,mand.z-2);H.P.yaw=Math.atan2(mand.x-H.P.pos.x,mand.z-H.P.pos.z);
  const fx=Math.sin(H.P.yaw),fz=Math.cos(H.P.yaw);
  const mx=H.P.pos.x+fx*0.35,my=H.P.pos.y+0.85,mz=H.P.pos.z+fz*0.35;
  H.P.gustCD=0;H.kd({code:'KeyJ',preventDefault(){},repeat:false});
  for(let i=0;i<200;i++){
    mand.x1=mand.x2=mx;mand.y1=mand.y2=my;mand.z1=mand.z2=mz;mand.pathT=0;
    mand.x=mx;mand.y=my;mand.z=mz;
    H.frames(1);
    if(!mand.alive)break;
    if(i===3)H.ku({code:'KeyJ'});
  }
  ok(!mand.alive,'mandatory spikefish can be removed with bubble power');
}
{
  const H=boot();startL2(H);
  const safety=H.W.clams.find(c=>c.role==='safety');
  grantBubble(H);
  H.P.pos.set(safety.x,safety.y,safety.z);H.P.hp=4;H.P.inv=0;
  const sp=H.W.spikefish.find(s=>s.role==='open');
  H.P.pos.set(sp.x,sp.y,sp.z);H.frames(120);
  ok(!H.P.bubble,'bubble power is lost on damage near the passage');
  H.frames(100);
  H.P.pos.set(safety.x,safety.y,safety.z);H.P.vel.set(0,0,0);H.frames(12);
  ok(H.P.bubble,'safety clam restores bubble power after a loss');
}

// ---- Shoal mandatory passage cannot be bypassed ----
function push(H,x,y,z,vx,vz,n){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);
  for(let i=0;i<(n||110);i++){H.P.vel.x=vx;H.P.vel.z=vz;H.frames(1);}
  return H.P.pos;
}
{
  const H=boot();startL2(H);
  ok(push(H,-8,0.5,-91,0,-5).z>-95.6,'west side of the Shoal passage is walled off');
  ok(push(H,8,0.5,-91,0,-5).z>-95.6,'east side of the Shoal passage is walled off');
  const walls=H.W.solids.filter(s=>Math.abs((s.min.z+s.max.z)/2+96)<1&&s.max.y>=5.5);
  ok(walls.length>=2,'passage walls are too tall to swim over');
  const mand=H.W.spikefish.find(s=>s.role==='mandatory');
  mand.alive=false;
  ok(push(H,0,0.5,-91,0,-5,140).z<-100,'center passage leads onward once the spikefish is dealt with');
}

// ---- Areas 1–3 traversable ----
{
  const H=boot();startL2(H);
  const legs=[[0,10],[0,0],[0,-8],[0,-20],[0,-35],[0,-52],[0,-62],[0,-74],[-4,-78],[-4,-88],[0,-102]];
  let stuck=[];
  for(const L of legs){if(!canStand(H,L[0],L[1],55))stuck.push(L.join(','));}
  ok(stuck.length===0,'Areas 1–3 route samples are traversable ('+(stuck.join(' | ')||'all clear')+')');
}

function wakeSnoozle(H,i){
  const s=H.W.snoozles[i];
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);H.P.vel.set(0,0,0);H.frames(2);
  H.tap('KeyK',2);H.frames(150);
}

// ---- Level 2 must not invoke Level 1 win flow ----
{
  const H=boot();startL2(H);
  ok(!H.W.won,'Level 2 does not start in won state');
  ok(H.el('win').style.display!=='flex','win banner hidden at Level 2 start');
  for(let i=0;i<H.W.snoozles.length;i++)wakeSnoozle(H,i);
  ok(H.el('snz').textContent==='😴 3/3','all three Level 2 snoozles can be woken');
  ok(!H.W.won,'waking all Level 2 snoozles does not set won');
  ok(H.el('win').style.display!=='flex','Level 1 congratulations banner never shown on Level 2');
  ok(!H.W.WM||!H.W.WM.party,'windmill party mode not invoked on Level 2');
  ok(!H.W.RAINBOW||H.W.RAINBOW.visible===false,'rainbow win FX not shown on Level 2');
}
{
  const H=boot();startL2(H);
  H.P.pos.set(0,1,-200);H.P.vel.set(0,0,0);H.frames(120);
  ok(!H.W.won,'reaching the Stage 5 end-cap toward The Trench does not win the game');
  ok(H.el('win').style.display!=='flex','end-cap traversal does not show win banner');
}

// ---- Level 2 touch B label ----
{
  const H=boot();startL2(H);
  ok(H.el('bBLbl').textContent==='gust','Level 2 B label shows gust when unpowered');
  H.test.addClam(35,0,35);
  H.P.pos.set(35,0,35);H.P.vel.set(0,0,0);H.frames(12);
  ok(H.el('bBLbl').textContent==='bubble','Level 2 B label shows bubble when powered');
}

report();
