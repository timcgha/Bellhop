// Level 3 Stage 1: Sky Blast state model, long-leap carry, prototype gap.
const H=require('./harness.js')({autostart:false});
const {P,W,frames,tap,ok,kd,ku,report}=H;

H.startLevel(2);
ok(H.getLevel()&&H.getLevel().id==='level3','boots Level 3');
const ph=H.getPhys(),sky=H.getSky();
ok(ph.speed===6.8&&ph.grav===-30&&ph.jumpV===10.5&&ph.puffV===9.4,'Level 3 baseline physics match Level 1');
ok(sky.puffVMul===1.4&&sky.boostMax===12.5,'Sky Blast tuning constants present');

function settle(x,y,z){P.pos.set(x,y,z);P.vel.set(0,0,0);P.slam=0;P.puffAir=0;P.grounded=true;H.CAM.yaw=0;frames(8);}
function grabSky(){
  const c=W.crates.find(x=>x.item==='sky'&&!x.broken);
  if(c){P.pos.set(c.x+1.1,c.y,c.z);P.vel.set(0,0,0);frames(2);tap('KeyK');frames(6);}
  const w=W.powers.find(p=>p.kind==='sky'&&!p.got);
  if(w){P.pos.set(w.x,w.y-0.5,w.z);P.vel.set(0,0,0);frames(6);}
  return P.hasSkyBlast;
}
function leapOnce(opts){
  const run=!!(opts&&opts.run);
  const hold=!!(opts&&opts.hold);
  const reverse=!!(opts&&opts.reverse);
  // Measure carry on the near pad along +X so the Stage 2 lava gap cannot interrupt the flight.
  settle(-6,0.4,8);
  P.yaw=Math.PI/2;
  P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;
  if(run){kd({code:'KeyD',preventDefault(){},repeat:false});for(let i=0;i<40;i++)frames(1);}
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
  frames(8);
  const x0=P.pos.x;
  kd({code:'Space',preventDefault(){},repeat:false});
  frames(2);
  const boost0=Math.hypot(P.leapBoost.x,P.leapBoost.z);
  if(!hold)ku({code:'Space'});
  if(reverse){ku({code:'KeyD'});kd({code:'KeyA',preventDefault(){},repeat:false});}
  let maxHoriz=0,xMax=x0;
  for(let i=0;i<220;i++){
    frames(1);
    maxHoriz=Math.max(maxHoriz,Math.hypot(P.vel.x+P.leapBoost.x,P.vel.z+P.leapBoost.z));
    xMax=Math.max(xMax,P.pos.x);
    if(P.grounded&&i>12)break;
  }
  ku({code:'Space'});ku({code:'KeyD'});ku({code:'KeyA'});
  return{x0,xMax,travel:xMax-x0,boost0,maxHoriz};
}

// ---- acquiring Sky Blast ----
ok(grabSky()===true,'acquiring Sky Blast sets hasSkyBlast');
ok(P.puff===true,'pickup does not consume P.puff');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.01,'pickup does not create leapBoost');

// ---- powered second press creates one boost and consumes puff ----
// Stay on the start pad away from the side vent so it cannot refill mid-assert.
settle(0,0.4,10);P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,0);P.yaw=Math.PI;
kd({code:'KeyA',preventDefault(){},repeat:false}); // run sideways, not toward the vent/gap
frames(35);ku({code:'KeyA'});
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
ok(P.puff===true&&P.grounded===false,'after jump, puff still available');
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(P.puff===false,'powered puff consumes P.puff');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)>0.5,'powered puff creates leapBoost');
const boostAfter=Math.hypot(P.leapBoost.x,P.leapBoost.z);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});
ok(P.puff===false&&Math.hypot(P.leapBoost.x,P.leapBoost.z)<=boostAfter+0.05,'repeated presses do not stack a second boost');
for(let i=0;i<180;i++){frames(1);if(P.grounded)break;}
ok(P.grounded&&Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'landing clears leapBoost');
ok(P.puff===true,'landing restores P.puff');

// ---- standing vs running carry ----
const stand=leapOnce({run:false});
const run=leapOnce({run:true});
ok(stand.boost0<run.boost0*0.35,'standing powered puff has much smaller boost than running');
ok(stand.travel+1.5<run.travel,'standing horizontal carry is substantially less than running');
ok(run.maxHoriz>ph.speed*1.15,'full powered leap exceeds normal SPEED during the boost ('+run.maxHoriz.toFixed(2)+')');
ok(run.boost0>sky.boostMax*0.7,'running boost near full strength');

// ---- reverse does not instantly zero boost; boost decays ----
settle(-4,0.4,8);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;P.leapBoost.set(0,0,0);P.inv=99;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(35);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
const bFire=Math.hypot(P.leapBoost.x,P.leapBoost.z);
ku({code:'KeyD'});kd({code:'KeyA',preventDefault(){},repeat:false});
frames(6);
const bMid=Math.hypot(P.leapBoost.x,P.leapBoost.z);
ok(bFire>5,'reverse test started with a live boost');
ok(bMid>bFire*0.55,'reversing stick does not instantly zero leapBoost ('+bMid.toFixed(2)+' after reverse)');
ok(P.leapBoost.x>0,'stored boost still points in original leap direction');
frames(90);
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<bMid*0.5||P.grounded,'boost decays over time');
ku({code:'KeyA'});
for(let i=0;i<120;i++){frames(1);if(P.grounded)break;}

// ---- air-slam clears boost ----
settle(-4,0.4,8);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;H.CAM.yaw=0;P.inv=99;
P.vel.set(ph.speed,0,0);
kd({code:'KeyD',preventDefault(){},repeat:false});
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
P.vel.set(ph.speed,P.vel.y,0);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)>1,'boost live before slam ('+Math.hypot(P.leapBoost.x,P.leapBoost.z).toFixed(2)+')');
tap('KeyJ',2);frames(2);
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'air-slam clears leapBoost');
ok(P.slam>0,'slam state engaged');
ku({code:'KeyD'});
for(let i=0;i<120;i++){frames(1);if(P.grounded&&P.slam===0)break;}

// ---- enemy knockback clears boost and removes hasSkyBlast ----
settle(0,0.4,5);P.hasSkyBlast=true;P.puff=true;P.leapBoost.set(0,0,-10);P.inv=0;P.hp=4;
const hp0=P.hp;
const g=W.gloops.find(e=>e.alive);
ok(!!g,'prototype has a gloop for knockback');
g.x=P.pos.x;g.z=P.pos.z+0.8;g.y=P.pos.y;g.stunT=0;g.spitT=0;g.state='idle';
let hurt=false;
for(let i=0;i<400;i++){
  frames(1);
  if(P.hp<hp0){hurt=true;break;}
  if(i===20)P.inv=0;
}
if(!hurt){
  const q=W.goos.find(x=>!x.alive)||W.goos[0];
  q.alive=true;q.ref=false;q.life=2;q.pos.set(P.pos.x,P.pos.y+0.5,P.pos.z);q.vel.set(0,0,0);q.m.visible=true;q.col=0x8fe36b;q.r=0.3;
  P.inv=0;frames(6);
  hurt=P.hp<hp0;
}
ok(hurt,'took an enemy hit');
ok(P.hasSkyBlast===false,'enemy hit removes hasSkyBlast');
ok(Math.hypot(P.leapBoost.x,P.leapBoost.z)<0.05,'enemy hit clears leapBoost');

// ---- vent restores hasSkyBlast and spent P.puff ----
P.hasSkyBlast=false;P.puff=false;P.inv=99;
const vent=W.steamVents[0];
settle(vent.x,vent.y,vent.z);frames(10);
ok(P.hasSkyBlast===true,'vent restores hasSkyBlast');
ok(P.puff===true,'vent restores spent P.puff');

P.puff=false;P.hasSkyBlast=true;P.grounded=false;P.pos.set(vent.x,vent.y+1.2,vent.z);P.vel.set(0,2,0);frames(4);
ok(P.puff===true&&P.hasSkyBlast===true,'airborne vent refill restores puff while keeping power');

// ---- prototype gap: unpowered cannot clear, powered running leap can ----
function attemptGap(powered){
  // Start well clear of the side vent; run straight toward -Z across the gap.
  settle(0,0.4,6);P.yaw=Math.PI;P.hasSkyBlast=!!powered;P.puff=true;P.leapBoost.set(0,0,0);P.inv=99;
  kd({code:'KeyW',preventDefault(){},repeat:false});
  for(let i=0;i<40;i++)frames(1);
  if(!powered)P.hasSkyBlast=false;
  kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
  if(!powered)P.hasSkyBlast=false;
  kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
  const zPuff=P.pos.z;
  let cleared=false,minZ=zPuff,landZ=zPuff,landY=0;
  for(let i=0;i<260;i++){
    frames(1);
    if(!P.grounded)minZ=Math.min(minZ,P.pos.z);
    if(P.pos.z<=-9.5&&P.pos.y>=0.35&&P.grounded){cleared=true;landZ=P.pos.z;landY=P.pos.y;break;}
    if(P.grounded&&i>10){landZ=P.pos.z;landY=P.pos.y;break;}
  }
  ku({code:'KeyW'});ku({code:'Space'});
  return{cleared,minZ,landZ,landY,airTravel:zPuff-minZ};
}
const unpowered=attemptGap(false);
const powered=attemptGap(true);
ok(!unpowered.cleared,'unpowered movement cannot clear the prototype gap (land z='+unpowered.landZ.toFixed(2)+')');
ok(powered.cleared,'powered running leap clears the prototype gap (land z='+powered.landZ.toFixed(2)+')');
ok(powered.airTravel>unpowered.airTravel*1.35,'powered air travel exceeds unpowered ('+powered.airTravel.toFixed(2)+' vs '+unpowered.airTravel.toFixed(2)+')');

// ---- hold-to-float left deliberately untuned: still engages during a live boost ----
settle(-4,0.4,8);P.hasSkyBlast=true;P.puff=true;P.yaw=Math.PI/2;P.inv=99;
kd({code:'KeyD',preventDefault(){},repeat:false});frames(30);
kd({code:'Space',preventDefault(){},repeat:false});frames(3);ku({code:'Space'});frames(8);
kd({code:'Space',preventDefault(){},repeat:false});
let hovered=false,boostWhileHover=false;
for(let i=0;i<120;i++){frames(1);if(P.hover)hovered=true;if(P.hover&&Math.hypot(P.leapBoost.x,P.leapBoost.z)>0.2)boostWhileHover=true;if(P.grounded&&i>20)break;}
ku({code:'Space'});ku({code:'KeyD'});
ok(hovered,'hold-to-float still engages after Sky Blast puff');
ok(boostWhileHover,'float can overlap a live leapBoost (intentionally untuned)');

// ---- Level 1 / Level 2 physics regression via reload ----
H.test.loadLevel(0);
ok(H.getPhys().grav===-30&&H.getPhys().jumpV===10.5&&H.getSky().boostMax===0,'loading Level 1 restores land physics and clears Sky tuning');
H.test.loadLevel(1);
ok(H.getPhys().grav===-6&&H.getPhys().jumpV===5.5,'loading Level 2 keeps Deep physics');
H.test.loadLevel(2);
ok(H.getPhys().grav===-30&&H.getSky().boostMax===12.5,'reloading Level 3 restores Peak Sky Blast tuning');

report();
