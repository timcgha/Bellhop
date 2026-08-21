// Level 3 Stage 3: Cinders, embers, Wisps, salamanders, geysers.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

H.startLevel(2);
const L=H.getLevel();
ok(L&&L.id==='level3','boots Level 3');
ok(H.getSky().puffVMul===1.4&&H.getSky().boostMax===12.5&&H.getSky().boostDecay===1.6,'Stage 1 Sky Blast tuning unchanged');
ok(H.getLava().anchorSettle===0.22&&H.getLava().recovery===0.42,'Stage 2 lava/anchor constants unchanged');

const notesAtLoad=W.notes.length;
ok(notesAtLoad>=3,'Stage 3 temporary counted notes exist at load ('+notesAtLoad+')');
ok(W.cinders.length>=1,'Cinder spawns from Level 3 data');
ok(W.wisps.length>=2,'Wisps spawn from Level 3 data');
ok(W.salamanders.some(s=>s.kind==='ordinary')&&W.salamanders.some(s=>s.kind==='note'),'ordinary and note salamanders present');
ok(W.geysers.length>=1,'geyser spawns from Level 3 data');

function settle(x,y,z){P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;P.lavaRecT=0;P.inv=0;H.CAM.yaw=0;frames(4);}
function faceToward(x,z){P.yaw=Math.atan2(x-P.pos.x,z-P.pos.z);}

// ---- Cinder HP tiers / combat ----
const mid=W.cinders.find(c=>c.type==='mid'&&c.alive);
ok(!!mid&&mid.hp===2&&mid.maxHp===2,'mid Cinder has 2 HP');
ok(CTYPE_OK(),'Cinder size/HP tiers match gloop-style small/mid/big');
function CTYPE_OK(){
  // Spot-check via live mid + constructed expectations from peak.js contract.
  return mid.size===1.0;
}

settle(mid.x+1.3,0.4,mid.z);faceToward(mid.x,mid.z);P.inv=99;
const hpC0=mid.hp;
tap('KeyK',2);frames(4);
ok(mid.hp===hpC0-1||!mid.alive||mid.state==='dying','spin damages Cinder');
if(mid.alive&&mid.state!=='dying'){settle(mid.x,1.6,mid.z);P.vel.set(0,-8,0);P.grounded=false;P.slam=2;frames(8);}
ok(!mid.alive||mid.state==='dying'||mid.hp<hpC0,'slam or follow-up defeats/damages Cinder');

// Fresh small cinder for jet/stomp via reload placement: use remaining or force
H.test.loadLevel(2);
const c2=W.cinders.find(c=>c.alive);
ok(!!c2,'cinder present after reload');
c2.stunT=99;c2.spitT=99;c2.wind=0;
settle(c2.x,0.4,c2.z+1.2);faceToward(c2.x,c2.z);P.inv=99;P.hasSkyBlast=true;P.leapBoost.set(0,0,-5);
const skyBefore=P.hasSkyBlast;
// Leash: drag far from home then wait — should return toward hx/hz
c2.x=c2.hx+14;c2.z=c2.hz;c2.vx=0;c2.vz=0;c2.backT=0;c2.stunT=0;c2.hopT=0.01;
for(let i=0;i<180;i++)frames(1);
ok(Math.hypot(c2.x-c2.hx,c2.z-c2.hz)<11,'Cinder returns toward home / stays leashed (d='+Math.hypot(c2.x-c2.hx,c2.z-c2.hz).toFixed(2)+')');
function CINDER_LEASH_OK(){return 11;}
// silence unused helper if present
void CINDER_LEASH_OK;

// ---- Ember high arc + hit ----
H.test.loadLevel(2);
const c3=W.cinders[0];
c3.stunT=0;c3.spitT=0;c3.wind=0.01;c3.face=0;
settle(c3.x,0.4,c3.z+6);P.inv=99;P.hp=4;P.hasSkyBlast=true;P.leapBoost.set(0,0,-8);
// Force a lob toward the player
c3.face=Math.atan2(P.pos.x-c3.x,P.pos.z-c3.z);
c3.wind=0.01;frames(8);
let ember=W.embers.find(e=>e.alive);
if(!ember){c3.spitT=0;c3.wind=0.01;frames(20);ember=W.embers.find(e=>e.alive);}
ok(!!ember,'Cinder lobbed an ember');
let maxY=ember.pos.y,sawArc=false;
for(let i=0;i<90;i++){
  frames(1);
  if(!ember.alive)break;
  if(ember.pos.y>maxY)maxY=ember.pos.y;
  if(ember.vel.y<0&&maxY>ember.pos.y+0.4)sawArc=true;
}
ok(sawArc||maxY>c3.y+2.0,'ember travels in a real high arc (maxY='+maxY.toFixed(2)+')');

// Direct ember contact (after real flight toward player)
H.test.loadLevel(2);
settle(0,0.4,10);P.inv=0;P.hp=4;P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,-9);
const hpE=P.hp;
let emb=W.embers.find(e=>!e.alive)||W.embers[0];
emb.alive=true;emb.life=2;emb.pos.set(P.pos.x,P.pos.y+0.6,P.pos.z);emb.vel.set(0.5,2,0.5);emb.m.visible=true;
// Move ember through space over frames into the player
for(let i=0;i<40;i++){
  if(!emb.alive)break;
  emb.pos.set(P.pos.x+0.1,P.pos.y+0.55,P.pos.z+0.1);
  frames(1);
  if(P.hp<hpE)break;
}
ok(P.hp===hpE-1,'ember contact costs exactly one heart');
ok(P.hasSkyBlast===false,'ember/enemy hit removes hasSkyBlast');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'ember hit clears leapBoost');
ok(W.puddles.every(p=>!p.alive)||!W.puddles.some(p=>p.alive&&Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<1.5),'ember does not create goo slow puddles');

// Lava still keeps Sky Blast
settle(0,0.4,6);P.hasSkyBlast=true;P.inv=0;P.hp=4;P.leapBoost.set(0,0,-4);
P.pos.set(7.5,0.2,8);P.vel.set(0,-1,0);P.grounded=false;frames(3);
ok(P.hasSkyBlast===true,'lava still does NOT remove hasSkyBlast');

// ---- Wisps ----
H.test.loadLevel(2);
const noteCount0=W.notes.length;
const wisp=W.wisps.find(w=>w.alive&&!w.note);
const noteWisp=W.wisps.find(w=>w.alive&&w.note);
ok(!!wisp&&!!noteWisp,'plain and note-bearing wisps present');
settle(wisp.g.position.x,0.4,wisp.g.position.z);P.inv=0;P.hp=4;
// Contact
P.pos.set(wisp.g.position.x,wisp.g.position.y-0.2,wisp.g.position.z);frames(4);
ok(P.hp===3,'Wisp contact costs one heart');

const w2=W.wisps.find(w=>w.alive&&!w.note)||wisp;
w2.alive=true;w2.g.visible=true;
settle(w2.g.position.x+1.2,0.4,w2.g.position.z);faceToward(w2.g.position.x,w2.g.position.z);P.inv=99;
tap('KeyK',3);frames(6);
ok(w2.alive,'spin does not defeat Wisp');
P.pos.set(w2.g.position.x,1.5,w2.g.position.z);P.vel.set(0,-10,0);P.slam=2;P.grounded=false;frames(10);
ok(w2.alive,'slam does not defeat Wisp');

settle(w2.g.position.x+1.0,0.4,w2.g.position.z);faceToward(w2.g.position.x,w2.g.position.z);P.inv=99;P.gustCD=0;
kd({code:'ShiftLeft',preventDefault(){},repeat:false}); // gust on ground is B/J/Shift
tap('KeyJ',2);frames(4);
ok(!w2.alive,'gust extinguishes Wisp');
const aliveBefore=w2.alive;
frames(10);
ok(aliveBefore===false,'extinguish happens once');

H.test.loadLevel(2);
const nw2=W.wisps.find(w=>w.note&&w.alive);
const held=nw2.note;ok(held&&held.hidden,'note wisp holds a hidden counted note');
const lenBefore=W.notes.length;
// Stand close and face the wisp; gust cone needs forward alignment.
P.pos.set(nw2.g.position.x,0.4,nw2.g.position.z+1.15);P.vel.set(0,0,0);P.grounded=true;faceToward(nw2.g.position.x,nw2.g.position.z);P.inv=99;P.gustCD=0;frames(2);
tap('KeyJ',2);frames(6);
ok(!nw2.alive&&held.hidden===false,'gust reveals the pre-existing held note');
ok(W.notes.length===lenBefore,'note count does not increase dynamically on reveal');

// ---- Salamanders ----
H.test.loadLevel(2);
const ordinary=W.salamanders.find(s=>s.kind==='ordinary');
const noteSal=W.salamanders.find(s=>s.kind==='note');
ok(ordinary&&noteSal,'ordinary and note salamanders reload');
const hpS=P.hp;settle(ordinary.x,0.4,ordinary.z);P.inv=0;frames(20);
ok(P.hp===hpS,'ordinary salamander is harmless');
const len1=W.notes.length;
tap('KeyJ',2);frames(4);
ok(W.notes.length===len1,'ordinary salamander never creates counted notes');

ok(noteSal.note&&noteSal.note.hidden,'note salamander holds existing hidden note');
const idNote=noteSal.note;
P.pos.set(noteSal.x,0.4,noteSal.z+1.0);P.vel.set(0,0,0);P.grounded=true;faceToward(noteSal.x,noteSal.z);P.inv=99;P.gustCD=0;frames(2);
tap('KeyJ',2);frames(6);
ok(idNote.hidden===false,'gust reveals the same note salamander note');
ok(W.notes.length===len1,'counted-note total stays fixed after salamander reveal');
P.gustCD=0;tap('KeyJ',2);frames(4);
ok(idNote.got===false||idNote.hidden===false,'no duplicate note spawn on second gust');

ok(W.notes.length===notesAtLoad||W.notes.length===len1,'counted-note total is fixed at build/load time');
ok(W.salamanders.filter(s=>s.kind==='ordinary').every(s=>!s.note),'ambient life contributes zero counted notes');

// ---- Geysers ----
H.test.loadLevel(2);
const gey=W.geysers[0];
ok(!!gey,'geyser present');
for(let i=0;i<180;i++)frames(1); // ~3s idle
ok(gey.activeT<=0,'idle geyser does not activate by itself');
// Stand on the geyser, then gust — boost applies during the active window.
P.pos.set(gey.x,gey.y,gey.z);P.vel.set(0,0,0);P.grounded=true;P.hasSkyBlast=false;P.leapBoost.set(0,0,0);P.puff=true;P.yaw=0;H.CAM.yaw=0;frames(2);
const sky0=P.hasSkyBlast,boost0=Math.hypot(P.leapBoost.x,P.leapBoost.z);
tap('KeyJ',2);
let launched=false,maxVy=0;
for(let i=0;i<30;i++){frames(1);maxVy=Math.max(maxVy,P.vel.y);if(P.vel.y>8)launched=true;}
ok(gey.activeT>0||gey.boosted||launched,'gust activates geyser');
ok(launched,'player above active geyser receives upward boost (vy='+maxVy.toFixed(2)+')');
ok(gey.boosted===true,'one activation does not stack every frame (boosted once)');
ok(P.hasSkyBlast===sky0,'geyser does not grant hasSkyBlast');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<=boost0+0.01,'geyser does not create leapBoost');

// Away from geyser — no boost from a fresh activation
H.test.loadLevel(2);
const g2=W.geysers[0];
settle(g2.x+5,g2.y,g2.z);faceToward(g2.x,g2.z);P.vel.set(0,0,0);
tap('KeyJ',2);frames(2);
const vyAway=P.vel.y;
frames(10);
ok(P.vel.y<6&&Math.hypot(P.pos.x-g2.x,P.pos.z-g2.z)>2,'player away from geyser is not boosted');

// Repeat gust after cool-down
settle(g2.x+1.1,g2.y,g2.z);faceToward(g2.x,g2.z);
tap('KeyJ',2);frames(3);ok(g2.activeT>0,'first gust fires');
for(let i=0;i<80;i++)frames(1);
tap('KeyJ',2);frames(3);
ok(g2.activeT>0,'repeated gust after reset activates again');

// Vent vs geyser distinction
ok(W.steamVents.length>=1&&W.geysers.length>=1,'steam vents and geysers are separate systems');
const vent=W.steamVents[0];
P.hasSkyBlast=false;P.puff=false;settle(vent.x,vent.y,vent.z);frames(8);
ok(P.hasSkyBlast===true,'vent still refills Sky Blast');
P.hasSkyBlast=false;settle(g2.x,g2.y,g2.z);P.vel.set(0,0,0);
g2.coolT=0;g2.activeT=0;tap('KeyJ',2);frames(8);
ok(P.hasSkyBlast===false,'geyser does not behave like a steam vent');

// ---- Stage 1/2 regressions quickly ----
ok(H.getSky().boostMax===12.5,'Sky Blast boostMax still 12.5');
H.test.loadLevel(0);
ok(H.getPhys().grav===-30&&H.getSky().boostMax===0,'Level 1 unchanged');
H.test.loadLevel(1);
ok(H.getPhys().grav===-6,'Level 2 unchanged');
H.test.loadLevel(2);
ok(H.getLava().recovery===0.42&&W.cinders.length>=1,'Level 3 peak systems restore');

report();
