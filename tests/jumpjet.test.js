// The blue jump jet: lights on every jump, burns what is directly underneath, once per jump.
const H=require('./harness.js')();const {P,W,el,frames,tap,ok,kd,ku,report}=H;
P.pos.set(0,0,10);P.vel.set(0,0,0);P.inv=999;frames(20);
ok(P.jetT<=0,'no jet while standing');
tap('Space',3);frames(2);
ok(P.jetT>0,'jump lit the jet, jetT='+P.jetT.toFixed(2));
frames(40);ok(P.jetT<=0,'jet burns out after ~0.4s');
tap('Space',3);frames(12);const before=P.jetT;tap('Space',3);frames(2);
ok(P.jetT>before,'air-puff relit the jet');
frames(120);

// one tick per jump, on the way up, before any stomp can happen
const e2=W.gloops.find(x=>x.alive&&x.type==='big');e2.stunT=9999;
P.pos.set(20,0,8);P.vel.set(0,0,0);frames(3);
e2.x=P.pos.x;e2.z=P.pos.z;e2.y=0;e2.hp=3;frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(1);
ok(e2.hp===2&&P.jetHits.length===1,'jet ticks once on jump, hp='+e2.hp+' hits='+P.jetHits.length);
for(let i=0;i<5;i++){e2.x=P.pos.x;e2.z=P.pos.z;frames(1);}
ok(e2.hp===2&&P.jetHits.length===1,'no repeat tick while the jet burns, hp='+e2.hp);
ku({code:'Space'});frames(90);

// a later jump lights a fresh jet
P.pos.set(20,0,8);P.vel.set(0,0,0);frames(3);
e2.x=P.pos.x;e2.z=P.pos.z;e2.y=0;e2.hp=3;e2.stunT=9999;frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(1);ku({code:'Space'});
ok(e2.hp===2,'a later jump burns again, hp='+e2.hp);
frames(90);

// a small gloop dies to one jump
const e1=W.gloops.find(x=>x.alive&&x.type==='small');e1.stunT=9999;
P.pos.set(-20,0,8);P.vel.set(0,0,0);frames(3);
e1.x=P.pos.x;e1.z=P.pos.z;e1.y=0;e1.hp=1;frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(2);ku({code:'Space'});
ok(e1.state==='dying'||!e1.alive,'small gloop dissolved by the jet');
frames(90);

// nothing gets burned that is not underneath him
const e3=W.gloops.find(x=>x.alive&&x.state!=='dying'&&x!==e2&&x!==e1);
P.pos.set(-30,0,8);P.vel.set(0,0,0);frames(3);
e3.x=P.pos.x+3;e3.z=P.pos.z;e3.y=0;e3.stunT=9999;const hp3=e3.hp;frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(6);ku({code:'Space'});
ok(e3.hp===hp3,'a gloop 3m away is untouched (hp '+e3.hp+')');
// and the jet does not reach down through the air (gloops always sit on the ground)
P.pos.set(-30,0,8);P.vel.set(0,0,0);frames(3);
e3.x=P.pos.x;e3.z=P.pos.z;e3.y=0;e3.stunT=9999;const hp3b=e3.hp;
P.pos.set(-30,3.2,8);P.vel.set(0,0,0);P.puff=true;frames(1);
kd({code:'Space',preventDefault(){},repeat:false});frames(1);ku({code:'Space'});
ok(P.jetT>0,'air-puff jet lit 3m up');
ok(e3.hp===hp3b,'jet does not reach a gloop 3m below (hp '+e3.hp+')');
report();
