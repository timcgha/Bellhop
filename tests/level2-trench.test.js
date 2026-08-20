// Stage 6A: The Trench — route, sharks, Snoozle 4, optional alcove, no win yet.
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
function canStand(H,x,z,frames){
  H.P.pos.set(x,3,z);H.P.vel.set(0,0,0);H.frames(frames||50);
  return H.P.pos.y<1.5&&Math.hypot(H.P.pos.x-x,H.P.pos.z-z)<1.5;
}
function push(H,x,y,z,vx,vz,n){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);
  for(let i=0;i<(n||110);i++){H.P.vel.x=vx;H.P.vel.z=vz;H.frames(1);}
  return H.P.pos;
}
function pushFly(H,x,y,z,vx,vy,vz,n){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);H.frames(3);
  for(let i=0;i<(n||250);i++){H.P.vel.x=vx;H.P.vel.y=vy;H.P.vel.z=vz;H.frames(1);}
  return H.P.pos;
}
function wakeSnoozle(H,i){
  const s=H.W.snoozles[i];
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);H.P.vel.set(0,0,0);H.frames(2);
  H.tap('KeyK',2);H.frames(180);
}
function phys(H){return H.getLevel().physics;}

const TRENCH_START=-205;
const SNOOZLE4_Z=-272;
const CONCH_STAGING_Z=-285;
const SHARK_AGGRO=7;

// ---- structure: trench after wreck ----
{
  const H=boot();startL2(H);
  ok(H.W.snoozles.length===4,'Stage 6A has four Level 2 Snoozles');
  ok(H.W.snoozles[3].g.position.z<TRENCH_START,'Snoozle 4 is past the Wreck exit');
  ok(H.W.snoozles[3].g.position.z>CONCH_STAGING_Z-5&&H.W.snoozles[3].g.position.z<TRENCH_START,
    'Snoozle 4 sits on the Trench main route');
  ok(Math.abs(H.W.snoozles[3].g.position.z-SNOOZLE4_Z)<1,'Snoozle 4 is at the intended Trench landmark');
  ok(H.W.checks.some(c=>c.z<-235&&c.z>-245),'Trench checkpoint exists on the main route');
  const trenchSharks=H.W.sharks.filter(s=>s.role==='trench1'||s.role==='trench2');
  ok(trenchSharks.length===2,'exactly two production Trench sharks exist');
  ok(trenchSharks.every(s=>s.alive&&Number.isFinite(s.hx)&&Number.isFinite(s.hz)),
    'Trench sharks use stabilized shark home behavior');
}

// ---- wreck exit reaches trench; route reaches snoozle 4 and conch staging ----
{
  const H=boot();startL2(H);
  ok(canStand(H,0,-198,55),'Wreck exit still reaches open water toward The Trench');
  ok(canStand(H,0,-216,55),'transition into the Trench is standable');
  const legs=[[0,-220],[0,-230],[0,-240],[0,-250],[0,-260],[0,-272],[0,-285]];
  let stuck=[];
  for(const L of legs){H.P.inv=999;if(!canStand(H,L[0],L[1],55))stuck.push(L.join(','));}
  ok(stuck.length===0,'main Trench route samples are traversable ('+(stuck.join(' | ')||'all clear')+')');
  ok(canStand(H,0,-280,55),'route reaches the Conch approach');
}

// ---- physics frozen ----
{
  const H=boot();startL2(H);
  const p=phys(H);
  ok(p.grav===-6&&p.maxFall===-6&&p.jumpV===5.5&&p.puffV===9.4,'Level 2 underwater physics constants unchanged');
  ok(p.speed===6.8&&p.acc===44&&p.hoverDrift===-1.6,'Level 2 movement profile unchanged');
}

// ---- no mandatory bubble on main route ----
{
  const H=boot();startL2(H);
  ok(!H.W.spikefish.some(s=>s.role!=='trench_alcove'&&s.z1<-205&&s.z1>-290),
    'no main-route spikefish gate in The Trench');
  const mainLegs=[[0,-220],[0,-235],[0,-250],[0,-265],[0,-272]];
  let needBubble=false;
  for(const L of mainLegs){
    H.P.bubble=false;H.P.inv=999;
    if(!canStand(H,L[0],L[1],60))needBubble=true;
  }
  ok(!needBubble,'main Trench route is traversable without bubble power');
}

// ---- perimeter: cannot bypass intended trench corridor ----
{
  const H=boot();startL2(H);
  ok(push(H,10,0.5,-220,0,-5).z>-230,'east flank of the Trench cannot bypass the corridor');
  ok(push(H,-11,0.5,-220,0,-5).z>-230,'west flank north of the alcove cannot bypass the corridor');
  ok(push(H,-11,0.5,-265,0,-5).z>-275,'west flank south of the alcove cannot bypass toward Snoozle 4');
  ok(pushFly(H,0,2,-288,0,1.5,-5).z>-295.5,'south fence contains the future Conch staging');
}

// ---- sharks: spacing, avoidance, not mandatory kills ----
{
  const H=boot();startL2(H);
  const s1=H.W.sharks.find(s=>s.role==='trench1');
  const s2=H.W.sharks.find(s=>s.role==='trench2');
  const sep=Math.hypot(s1.hx-s2.hx,s1.hz-s2.hz);
  ok(sep>SHARK_AGGRO*2,'Trench sharks are spaced beyond overlapping aggro ('+sep.toFixed(1)+')');
  // approaching shark 1 does not put the player inside shark 2 aggro
  H.P.pos.set(s1.hx,s1.yBase,s1.hz+2.5);H.P.vel.set(0,0,0);H.frames(8);
  const d2=Math.hypot(H.P.pos.x-s2.x,H.P.pos.z-s2.z);
  ok(d2>SHARK_AGGRO,'normal approach to the first shark does not activate the second');
  // swim past shark 1 on the open west side without killing it
  H.P.inv=999;H.P.hp=4;
  push(H,-2.2,3.2,s1.hz+6,0,-4,160);
  ok(s1.alive,'first Trench shark is not a mandatory kill gate');
  ok(H.P.pos.z<s1.hz-2,'player can continue past the first shark while it lives');
  H.P.inv=999;
  push(H,2.2,3.2,s2.hz+6,0,-4,160);
  ok(s2.alive,'second Trench shark is not a mandatory kill gate');
  ok(H.P.pos.z<s2.hz-2,'player can continue past the second shark while it lives');
}

// ---- Snoozle 4: required route, no win ----
{
  const H=boot();startL2(H);
  const s4=H.W.snoozles[3];
  ok(Math.abs(s4.g.position.x)<2.5,'Snoozle 4 sits on the center main route');
  // reach Snoozle 4 without entering the optional alcove (alcove is x < -6)
  H.P.inv=999;
  ok(canStand(H,0,SNOOZLE4_Z,60),'Snoozle 4 is reachable on the main route');
  ok(H.P.pos.x>-5,'main-route approach never entered the west alcove');
  wakeSnoozle(H,3);
  ok(s4.state!=='sleep','Snoozle 4 wakes with existing behavior');
  ok(H.el('snz').textContent==='😴 1/4','Snoozle 4 increments rescued count');
  ok(!H.W.won,'waking Snoozle 4 does not set Level 2 to won');
  ok(H.el('win').style.display!=='flex','no congratulations banner after Snoozle 4');
}
{
  const H=boot();startL2(H);
  for(let i=0;i<H.W.snoozles.length;i++)wakeSnoozle(H,i);
  ok(H.el('snz').textContent==='😴 4/4','all four Level 2 Snoozles can be woken');
  ok(!H.W.won,'waking all four Level 2 Snoozles still does not win');
  ok(H.el('win').style.display!=='flex','Level 1 celebration banner never shown on Level 2');
  ok(!H.W.WM||!H.W.WM.party,'no windmill party after four Level 2 Snoozles');
}

// ---- optional hard alcove ----
{
  const H=boot();startL2(H);
  const alcoveSpikes=H.W.spikefish.filter(s=>s.role==='trench_alcove');
  ok(alcoveSpikes.length===2,'optional alcove contains two spikefish');
  const alcoveNotes=H.W.notes.filter(n=>!n.hidden&&n.z<-240&&n.z>-255&&n.x<-6);
  ok(alcoveNotes.length===3,'optional alcove has three counted notes from build time');
  const clam=H.W.clams.find(c=>c.role==='trench_alcove');
  ok(clam,'renewable clam sits near the optional alcove');
  ok(Math.hypot(clam.x-(-6.2),clam.z-(-246.5))<1,'alcove clam is at the mouth of the side path');
  // main route remains completable without entering alcove
  H.P.inv=999;
  ok(canStand(H,0,-250,55)&&canStand(H,0,-272,55),'main route past the alcove mouth stays completable');
  // entering alcove is possible but optional
  push(H,-2,0.5,-248,-4,0,90);
  ok(H.P.pos.x<-6,'player can choose to enter the optional alcove');
}

// ---- counted notes stable from build ----
{
  const H=boot();startL2(H);
  ok(H.W.notes.length===6,'production Level 2 counted-note total is 6 after The Trench');
  const hidden=H.W.notes.filter(n=>n.hidden).length;
  const visible=H.W.notes.filter(n=>!n.hidden).length;
  ok(hidden===1&&visible===5,'note breakdown: one held note fish + two secret + three trench alcove');
  const n0=H.W.notes.length;
  const sp=H.W.spikefish.find(s=>s.role==='trench_alcove');
  sp.alive=false;H.frames(4);
  ok(H.W.notes.length===n0,'defeating an alcove spikefish does not change notes.length');
}

// ---- trench checkpoint activates and respawns usefully ----
{
  const H=boot();startL2(H);
  const c=H.W.checks.find(ch=>ch.z<-235&&ch.z>-245);
  ok(c,'trench checkpoint record exists');
  H.P.pos.set(c.x,c.y+0.5,c.z);H.P.vel.set(0,0,0);H.frames(20);
  ok(c.on,'trench checkpoint activates from its intended standable position');
  ok(Math.abs(H.P.spawn.y-c.y)<0.1,'respawn height matches the checkpoint platform');
  ok(Math.abs(H.P.spawn.z-(c.z+1.5))<0.1,'respawn sits just past the checkpoint flag');
  // dying returns to the trench checkpoint, not an earlier wreck one
  H.P.dead=true;H.P.deadT=0.05;H.P.hp=0;H.frames(20);
  ok(Math.abs(H.P.pos.z-c.z)<4,'after death the player respawns at the Trench checkpoint');
  ok(Math.abs(H.P.pos.y-c.y)<2,'respawn height is recoverable on the Trench platform');
}

// ---- Conch FINISH still does not win from the trench approach ----
{
  const H=boot();startL2(H);
  ok(H.W.FINISH&&H.W.FINISH.z===-288,'Level 2 FINISH anchors at the Conch');
  H.P.pos.set(0,1,-283);H.P.vel.set(0,0,0);H.frames(60);
  ok(!H.W.won,'reaching the Conch approach does not win Level 2');
}

report();
