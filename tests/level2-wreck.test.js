// Stage 5: The Wreck structure, traversal, and no-dive recoverability.
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
function canRest(H,x,y,z,frames){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);H.frames(frames||45);
  return Math.abs(H.P.pos.y-y)<0.8&&Math.hypot(H.P.pos.x-x,H.P.pos.z-z)<1.6;
}
function maxSwimY(H,x,y,z){
  H.P.pos.set(x,y,z);H.P.vel.set(0,0,0);H.P.puff=true;H.frames(6);
  let maxY=y;
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});
  H.frames(8);
  H.kd({code:'Space',preventDefault(){},repeat:false});H.frames(4);H.ku({code:'Space'});
  H.kd({code:'Space',preventDefault(){},repeat:true});
  for(let i=0;i<50;i++){H.frames(1);maxY=Math.max(maxY,H.P.pos.y);}
  H.ku({code:'Space'});
  return maxY;
}
function climb(H,x,y,z){
  maxSwimY(H,x,y,z);
  for(let i=0;i<80;i++){H.frames(1);if(H.P.grounded&&H.P.puff)break;}
}
function testRecoverability(H,ledge,maxDrop){
  H.P.pos.set(ledge.x,ledge.y+0.55,ledge.z);H.P.vel.set(0,0,0);H.frames(4);
  const startY=H.P.pos.y;
  H.P.pos.x+=ledge.w*0.32*(ledge.x>=0?-1:1);
  H.P.vel.set(0,-0.5,0);
  let restY=startY,grounded=false;
  for(let i=0;i<200;i++){
    H.frames(1);
    if(H.P.grounded){restY=H.P.pos.y;grounded=true;break;}
  }
  ok(grounded,'drop from '+ledge.tag+' lands on a surface');
  ok(startY-restY<=maxDrop,'drop from '+ledge.tag+' loses at most one deck ('+(startY-restY).toFixed(2)+'m <= '+maxDrop+'m)');
}
function wakeSnoozle(H,i){
  const s=H.W.snoozles[i];
  H.P.pos.set(s.g.position.x,s.g.position.y,s.g.position.z+1);H.P.vel.set(0,0,0);H.frames(2);
  H.tap('KeyK',2);H.frames(200);
}

const RECOVERY_MAX=3.2;
const DECK_H=2.8;

// ---- structure ----
{
  const H=boot();startL2(H);
  ok(H.W.wreck&&H.W.wreck.g,'The Wreck visual exists after Areas 1–3');
  ok(H.W.checks.some(c=>c.z<-155&&c.z>-165),'entrance checkpoint exists near the keel');
  ok(H.W.checks.some(c=>c.z<-175&&c.z>-185),'midway Wreck checkpoint exists in the upper climb');
  ok(H.W.snoozles.length===3,'Snoozle 3 exists');
  ok(H.W.snoozles[2].g.position.y>12&&H.W.snoozles[2].g.position.z<-175,'Snoozle 3 sits in the crow\'s nest');
}

// ---- approach and entrance ----
{
  const H=boot();startL2(H);
  const legs=[[0,-108],[0,-120],[0,-135],[0,-150],[0,-165],[0,-168]];
  let stuck=[];
  for(const L of legs){if(!canStand(H,L[0],L[1],55))stuck.push(L.join(','));}
  ok(stuck.length===0,'open-water approach reaches the Wreck entrance ('+(stuck.join(' | ')||'all clear')+')');
  ok(canRest(H,0,0.5,-172,50),'keel entrance floor is reachable');
}

// ---- bubble source at entrance (optional) ----
{
  const H=boot();startL2(H);
  const clam=H.W.clams.find(c=>c.role==='wreck_entrance');
  ok(clam,'renewable bubble clam sits near the Wreck entrance');
  H.P.pos.set(clam.x,clam.y,clam.z);H.P.vel.set(0,0,0);H.frames(12);
  ok(H.P.bubble,'entrance clam grants bubble power');
}

// ---- shark encounter ----
{
  const H=boot();startL2(H);
  const wreckSharks=H.W.sharks.filter(s=>s.role==='wreck');
  ok(wreckSharks.length===1,'exactly one Wreck shark exists');
  ok(wreckSharks[0].alive,'wreck shark uses existing shark behavior');
  H.P.pos.set(5.5,5.8,-177);H.P.vel.set(0,0,0);H.frames(40);
  ok(Math.hypot(H.P.pos.x-5.5,H.P.pos.z+177)<2,'east bypass ledge exists beside the shark');
  ok(maxSwimY(H,5.5,5.8,-177)>8,'player can continue upward without defeating the shark');
}

// ---- spikefish shaft ----
{
  const H=boot();startL2(H);
  const sp=H.W.spikefish.find(s=>s.role==='wreck_shaft');
  ok(sp,'one spikefish patrols the main Wreck shaft');
  ok(Math.abs(sp.y2-sp.y1)>3,'shaft spikefish moves vertically');
  ok(Math.abs(sp.x2-sp.x1)<0.5&&Math.abs(sp.z2-sp.z1)<0.5,'shaft spikefish stays in the central shaft');
}

// ---- recoverability (no-dive invariant) ----
{
  const H=boot();startL2(H);
  ok(H.W.wreck.ledges.length>=4,'Wreck registers major recovery ledges');
  ok(Math.abs(RECOVERY_MAX-(DECK_H+0.4))<0.01,'recovery threshold is one deck spacing (2.8m) + 0.4m tolerance');
  for(const ledge of H.W.wreck.ledges)testRecoverability(H,ledge,RECOVERY_MAX);
}

// ---- traversal without bubble power ----
{
  const H=boot();startL2(H);
  ok(!H.P.bubble,'start without bubble power');
  ok(maxSwimY(H,-5,0.8,-170)>=2.8,'keel west route reaches lower deck height');
  ok(canRest(H,-5,2.8,-174,50),'lower west recovery ledge is standable');
  ok(maxSwimY(H,-5,3.0,-174)>=5.6,'lower deck reaches middle deck height');
  ok(canRest(H,-5,5.6,-177,50),'middle west recovery ledge is standable');
  ok(maxSwimY(H,5.5,5.8,-177)>=8.4,'east shark bypass reaches upper-middle deck height');
  ok(canRest(H,-5,8.4,-179,50),'upper-middle west recovery ledge is standable');
  ok(maxSwimY(H,-5,8.6,-179)>=11.2,'upper-middle deck reaches top interior deck height');
  ok(canRest(H,5,11.2,-181,50),'top east recovery ledge is standable');
  ok(maxSwimY(H,5,11.45,-181)>=14,'top deck reaches crow\'s nest height');
  ok(canRest(H,0,14.25,-184,50),'crow\'s nest deck is standable');
}

// ---- Snoozle 3 and no win ----
{
  const H=boot();startL2(H);
  wakeSnoozle(H,2);
  ok(H.W.snoozles[2].state!=='sleep','Snoozle 3 wakes with existing behavior');
  ok(H.el('snz').textContent==='😴 1/3','Snoozle 3 increments rescued count');
  ok(!H.W.won,'waking Snoozle 3 does not set Level 2 to won');
  ok(H.el('win').style.display!=='flex','no congratulations banner after Snoozle 3');
  ok(!H.W.WM||!H.W.WM.party,'no windmill party after Snoozle 3');
}

// ---- exit toward Stage 6 ----
{
  const H=boot();startL2(H);
  ok(canStand(H,0,-195,55),'route exits the Wreck toward the future Trench');
}

report();
