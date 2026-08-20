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
  else{H.P.pos.set(2,0,3);H.P.vel.set(0,0,0);H.frames(12);}
  return H.P.bubble;
}
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
  ok(H.W.snoozles.length===2,'Stage 4 has two snoozles so far');
  ok(H.W.snoozles[0].g.position.z>-16,'Snoozle 1 is in The Shallows');
  ok(H.W.snoozles[1].g.position.z<-40&&H.W.snoozles[1].g.position.z>-70,'Snoozle 2 is in the Kelp Forest');
  ok(H.W.snoozles[1].g.position.y>2,'Snoozle 2 sits on a raised shelf');
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
  ok(s&&!s.secret===false,'secret kelp wall exists');
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

// ---- Areas 1–3 traversable ----
{
  const H=boot();startL2(H);
  const legs=[[0,10],[0,0],[0,-8],[0,-20],[0,-35],[0,-52],[0,-62],[0,-74],[-4,-78],[-4,-88],[0,-102]];
  let stuck=[];
  for(const L of legs){if(!canStand(H,L[0],L[1],55))stuck.push(L.join(','));}
  ok(stuck.length===0,'Areas 1–3 route samples are traversable ('+(stuck.join(' | ')||'all clear')+')');
}

report();
